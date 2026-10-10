import { afterEach, describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { rm } from "node:fs/promises";
import { maintenanceFixture, deferred } from "./fixtures/maintenance";
import { bindMaintenance, beginMaintenance, settleMaintenance, maintenanceSnapshot, maintenanceCommand } from "../src/worker-maintenance";
import { testAdmission, testReadiness, refreshTestRepository } from "./fixtures/admission";
import { digest, utcInstant } from "../src/types";
import { takePrivateSnapshot, withPrivateFiles } from "../src/custody";
import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import * as privateFiles from "../src/crypto";
import type { FileHandle } from "node:fs/promises";
import * as fs from "node:fs/promises";
import { createArtifactStore } from "../src/artifact-store";
import { withReconstructedDocuments, type ReconstructionDependencies } from "../src/reconstruction";
import { erasureOwner } from "../src/erasure-repository";
import { randomUUID } from "node:crypto";
import { encodeJournalEvent } from "../src/ledger-contract";
import { caseId, instant } from "./fixtures/ledger";
import type { EraseJournalEvent, IngressLease } from "../src/types";

const connections = vi.hoisted(() => ({ all: [] as Database.Database[] }));
vi.mock("node:fs/promises", async original => ({ ...await original<typeof import("node:fs/promises")>() }));
vi.mock("better-sqlite3", async original => {
  const actual = await original<{ default: typeof Database }>();
  return { default: class extends actual.default { constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); connections.all.push(this); } } };
});
const fixtures: Awaited<ReturnType<typeof maintenanceFixture>>[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const fixture of fixtures) await settleMaintenance(fixture.owner).catch(() => {});
  // Failure tests deliberately retain the production close gate. Dispose the
  // real synthetic connection here, not through a production force-close API.
  for (const db of connections.all.splice(0)) if (db.open) db.close();
  for (const fixture of fixtures.splice(0)) await rm(fixture.root, { recursive: true, force: true });
});
async function setup(startup?: "ordinary" | "cold-maintenance") { const f = await maintenanceFixture(startup); fixtures.push(f); return { ...f, db: connections.all.at(-1)! }; }
async function historicalBacklog(f: Awaited<ReturnType<typeof setup>>, count: number) {
  const original = await f.accept(), ids = [original.accepted.id];
  // Synthetic persisted backlog; it is not current intake capacity or physical evidence.
  const row = f.db.prepare("SELECT * FROM cases WHERE id=?").get(ids[0]) as Record<string, unknown>;
  const reservation = f.db.prepare("SELECT * FROM reservations WHERE id=?").get(row.reservationId) as Record<string, unknown>;
  f.db.transaction(() => {
    for (let i = 1; i < count; i++) {
      const id = i === count - 1 ? "ffffffff-ffff-4fff-bfff-ffffffffffff" : randomUUID(), reservationId = randomUUID(), sessionHash = i.toString(16).padStart(64, "0");
      const r = { ...reservation, id: reservationId, sessionHash }, c = { ...row, id, reference: `synthetic-${i}`, reservationId, sessionHash, encryptedPayloadPath: `${f.root}/${i}.enc` };
      for (const [table, values] of [["reservations", r], ["cases", c]] as const) f.db.prepare(`INSERT INTO ${table}(${Object.keys(values).join(",")}) VALUES(${Object.keys(values).map(key => `@${key}`).join(",")})`).run(values);
      ids.push(id as typeof original.accepted.id);
    }
  })();
  return ids;
}
describe("original maintenance lifetime", () => {
  it.each(["runtime", "journal"] as const)("retains the failed %s root sync across exact processing cleanup retries", async boundary => {
    const f = await setup(), accepted = await f.accept();
    const snapshot = await takePrivateSnapshot(accepted.record, accepted.keys);
    const directory = await f.owner.custody.beginProcessing(snapshot, 4096);
    await mkdir(directory, { mode: 0o700 });
    const targetRoot = boundary === "runtime" ? f.config.runtimeRoot : f.config.custodyRoot;
    const originalOpen = fs.open; let failSync = true, failedSyncs = 0, successfulSyncs = 0;
    vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      const handle = await originalOpen(...args);
      if (args[0] === targetRoot) {
        const sync = handle.sync.bind(handle);
        handle.sync = async () => {
          if (failSync) { failedSyncs++; throw new Error("private-root-sync-canary"); }
          await sync(); successfulSyncs++;
        };
      }
      return handle;
    });
    await expect(f.owner.custody.finishProcessing(directory)).rejects.toThrow("private-root-sync-canary");
    await expect(stat(directory)).rejects.toMatchObject({ code: "ENOENT" });
    expect(successfulSyncs).toBe(0);
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(beginMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
    for (let attempt = 0; attempt < 2; attempt++) {
      await expect(f.owner.custody.finishProcessing(directory)).rejects.toThrow("private-root-sync-canary");
      await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
      expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
      expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
      expect(successfulSyncs).toBe(0);
    }
    expect(failedSyncs).toBe(3);
    failSync = false;
    await f.owner.custody.finishProcessing(directory);
    expect(successfulSyncs).toBe(1);
    await settleMaintenance(f.owner); await beginMaintenance(f.owner); await settleMaintenance(f.owner);
    expect(maintenanceSnapshot(f.owner).status).toBe("settled");
    expect((await readdir(f.config.custodyRoot)).some(name => name.startsWith(directory.split("/").at(-1)!))).toBe(false);
    expect(() => f.owner.repository.close()).not.toThrow();
  });
  it("retains an unreleased real ingress holder until exact abort retry confirms release", async () => {
    const f = await setup(), sessionHash = digest("a".repeat(64));
    const reservation = await f.owner.custody.reserve({ ...testAdmission(), sessionHash, idempotencyKey: "held-release", reservedBytes: 20000, now: utcInstant(f.owner.clock.now().toISOString()) }, testReadiness);
    await fs.writeFile(`${f.config.intakeRoot}/${reservation.id}.enc`, "synthetic", { mode: 0o600 });
    const holder = await f.authority.retain(reservation.id);
    try {
      await expect(f.owner.custody.abortIntake(reservation.id, sessionHash)).rejects.toThrow("INGRESS_BUSY");
      expect((await holder.stat()).isFile()).toBe(true);
      bindMaintenance(f.owner, f.services, f.monotonicNow);
      await expect(beginMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
      await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
      expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
      await holder.close();
      await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
      await f.owner.custody.abortIntake(reservation.id, sessionHash);
      await settleMaintenance(f.owner); await beginMaintenance(f.owner);
      expect(await fs.readdir(f.config.intakeRoot)).toEqual([]);
      expect(f.db.prepare("SELECT id FROM reservations WHERE id=?").get(reservation.id)).toBeUndefined();
    } finally { if (holder.fd !== -1) await holder.close(); }
  });
  it("retains a failed hidden root descriptor close after publication unwinds", async () => {
    const f = await setup(), closing = deferred(), release = deferred(), originalOpen = fs.open;
    let retained: FileHandle | undefined, actuallyClose: (() => Promise<void>) | undefined;
    vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      const handle = await originalOpen(...args);
      if (args[0] === f.config.custodyRoot) {
        retained = handle; actuallyClose = handle.close.bind(handle);
        handle.close = async () => { closing.resolve(); await release.promise; throw new Error("private-root-close-canary"); };
      }
      return handle;
    });
    const reserve = f.owner.custody.reserve({ ...testAdmission(), sessionHash: digest("a".repeat(64)), idempotencyKey: "root-close", reservedBytes: 20000, now: utcInstant(f.owner.clock.now().toISOString()) }, testReadiness).catch(error => error);
    await closing.promise; bindMaintenance(f.owner, f.services, f.monotonicNow);
    const starting = beginMaintenance(f.owner).then(() => "settled", error => error.message); release.resolve(); await reserve;
    try {
      expect((await retained!.stat()).isDirectory()).toBe(true);
      expect(await starting).toBe("MAINTENANCE_SETTLEMENT_UNCERTAIN");
      await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
      expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
    } finally { await actuallyClose!(); }
  });
  it("retains a failed hidden authenticated-artifact close through the actual bundle reader", async () => {
    const f = await setup(), accepted = await f.accept(), closing = deferred(), release = deferred();
    const store = createArtifactStore(f.owner.repository, accepted.keys, f.owner.custody);
    const deps: ReconstructionDependencies = { scope: f.owner.custody, monotonicNow: () => 0, scanner: { assurance: "qualified-local-engine", scan: async () => { throw new Error("NO_FILES"); } }, inspector: { assurance: "local-test", inspect: async () => { throw new Error("NO_FILES"); } }, raster: { render: async () => { throw new Error("NO_FILES"); } }, output: { verify: async () => {} } };
    const snapshot = await takePrivateSnapshot(accepted.record, accepted.keys);
    const bundle = await withPrivateFiles(snapshot, accepted.keys, value => withReconstructedDocuments(value, deps, reconstructed => store.adoptBundle(reconstructed, 1)));
    const originalOpen = fs.open; let retained: FileHandle | undefined, actuallyClose: (() => Promise<void>) | undefined;
    vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      const handle = await originalOpen(...args);
      if (args[0] === bundle.path) {
        retained = handle; actuallyClose = handle.close.bind(handle);
        handle.close = async () => { closing.resolve(); await release.promise; throw new Error("private-artifact-close-canary"); };
      }
      return handle;
    });
    const read = store.withBundle(accepted.accepted.id, async () => { throw new Error("UNREACHABLE"); }).catch(error => error);
    await closing.promise; bindMaintenance(f.owner, f.services, f.monotonicNow);
    const starting = beginMaintenance(f.owner).then(() => "settled", error => error.message); release.resolve(); await read;
    try {
      expect((await retained!.stat()).isFile()).toBe(true);
      expect(await readdir(f.config.runtimeRoot)).toEqual([]);
      expect(await starting).toBe("MAINTENANCE_SETTLEMENT_UNCERTAIN");
      await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
      expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
      expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
    } finally { await actuallyClose!(); }
  });
  it.each(["stat", "validation"] as const)("settles after a post-open %s rejection only when the actual handle closes", async fault => {
    const f = await setup(), accepted = await f.accept(), originalOpen = fs.open;
    let retained: FileHandle | undefined, realStat: FileHandle["stat"] | undefined;
    if (fault === "validation") await fs.chmod(accepted.record.encryptedPayloadPath, 0o644);
    vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      const handle = await originalOpen(...args);
      if (args[0] === accepted.record.encryptedPayloadPath) {
        retained = handle; realStat = handle.stat.bind(handle);
        if (fault === "stat") handle.stat = async () => { throw new Error("SYNTHETIC_STAT_FAILURE"); };
      }
      return handle;
    });
    await expect(takePrivateSnapshot(accepted.record, accepted.keys)).rejects.toThrow(fault === "stat" ? "SYNTHETIC_STAT_FAILURE" : "UNSAFE_PATH");
    try {
      await expect(realStat!()).rejects.toMatchObject({ code: "EBADF" });
      bindMaintenance(f.owner, f.services, f.monotonicNow); await beginMaintenance(f.owner); await settleMaintenance(f.owner);
      expect(maintenanceSnapshot(f.owner).status).toBe("settled");
    } finally { if (retained!.fd !== -1) await retained!.close(); }
  });
  it.each(["snapshot", "processing"] as const)("retains a still-open %s source after failed close instead of declaring custody settled", async kind => {
    const f = await setup(), accepted = await f.accept(), closing = deferred(), release = deferred();
    const snapshot = await takePrivateSnapshot(accepted.record, accepted.keys);
    const originalOpen = privateFiles.openPrivateFile;
    let retained: FileHandle | undefined, actuallyClose: (() => Promise<void>) | undefined;
    vi.spyOn(privateFiles, "openPrivateFile").mockImplementation(async (...args) => {
      const handle = await originalOpen(...args);
      if (args[0] === accepted.record.encryptedPayloadPath) {
        retained = handle; actuallyClose = handle.close.bind(handle);
        handle.close = async () => { closing.resolve(); await release.promise; throw new Error("private-source-close-canary"); };
      }
      return handle;
    });
    const read = (kind === "snapshot" ? takePrivateSnapshot(accepted.record, accepted.keys) : withPrivateFiles(snapshot, accepted.keys, async () => {})).catch(error => error);
    await closing.promise; bindMaintenance(f.owner, f.services, f.monotonicNow);
    const starting = beginMaintenance(f.owner).then(() => "settled", error => error.message);
    release.resolve(); await read;
    try {
      expect((await retained!.stat()).isFile()).toBe(true);
      expect(await readdir(f.config.runtimeRoot)).toEqual([]);
      expect(await starting).toBe("MAINTENANCE_SETTLEMENT_UNCERTAIN");
      await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
      expect(maintenanceSnapshot(f.owner).status).toBe("settling");
      expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
      expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
    } finally { await actuallyClose!(); }
  });
  it("retains failed processing cleanup after its producer finishes", async () => {
    const f = await setup(), accepted = await f.accept();
    const snapshot = await takePrivateSnapshot(accepted.record, accepted.keys);
    const directory = await f.owner.custody.beginProcessing(snapshot, 4096);
    await mkdir(directory, { mode: 0o700 }); await writeFile(`${directory}/unknown-private-canary`, "synthetic", { mode: 0o600 });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    const starting = beginMaintenance(f.owner).then(() => "settled", error => error.message);
    await expect(f.owner.custody.finishProcessing(directory)).rejects.toThrow("CUSTODY_UNACCOUNTED_FILE");
    expect((await stat(directory)).isDirectory()).toBe(true);
    expect(await starting).toBe("MAINTENANCE_SETTLEMENT_UNCERTAIN");
    await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
    expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
    expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
    // The fixture removes its foreign obstruction; pathname disappearance is
    // not release evidence. Only retrying the exact original cleanup clears it.
    await fs.unlink(`${directory}/unknown-private-canary`);
    await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
    await f.owner.custody.finishProcessing(directory);
    await settleMaintenance(f.owner); await beginMaintenance(f.owner);
    expect(await readdir(f.config.runtimeRoot)).toEqual([]);
  });
  it("settles an expected denial that acquired no resource", async () => {
    const f = await setup();
    await expect(f.owner.custody.reserve({ ...testAdmission(), sessionHash: digest("a".repeat(64)), idempotencyKey: "denied-before-acquire", reservedBytes: 20000, now: utcInstant(f.owner.clock.now().toISOString()) }, { getIntakeReadiness: () => ({ ready: false }) })).rejects.toThrow("WORKER_UNAVAILABLE");
    bindMaintenance(f.owner, f.services, f.monotonicNow); await beginMaintenance(f.owner); await settleMaintenance(f.owner);
    expect(maintenanceSnapshot(f.owner).status).toBe("settled");
    expect(() => f.owner.repository.close()).not.toThrow();
  });
  it("prepares a due restored case in the cold original owner without enabling normal reads", async () => {
    const original = await setup(), { accepted } = await original.accept(), cold = await setup("cold-maintenance");
    // Synthetic persisted restore rows, never a claim of restored file coverage.
    for (const table of ["reservations", "cases", "case_lifecycle", "deliveries"]) {
      for (const row of original.db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[]) cold.db.prepare(`INSERT INTO ${table}(${Object.keys(row).join(",")}) VALUES(${Object.keys(row).map(key => `@${key}`).join(",")})`).run(row);
    }
    cold.advance(7 * 86400000); await refreshTestRepository(cold.owner.repository);
    expect(() => cold.owner.repository.getDelivery(accepted.id)).toThrow("REPOSITORY_COLD");
    bindMaintenance(cold.owner, cold.services, cold.monotonicNow); const run = await beginMaintenance(cold.owner), owner = erasureOwner(cold.owner.repository);
    const page = await owner.listDue(run); expect((await owner.prepareDue(page.items[0], run)).event[4][0]).toBe(accepted.id);
    expect(() => cold.owner.repository.getDelivery(accepted.id)).toThrow("REPOSITORY_COLD");
  });
  it("shares concurrent settlement so a late settler cannot clear a successor run", async () => {
    const f = await setup(), original = f.services.settle, gate = deferred(); let calls = 0;
    f.services.settle = async () => { calls++; if (calls > 1) await gate.promise; await original(); };
    bindMaintenance(f.owner, f.services, f.monotonicNow); await beginMaintenance(f.owner);
    const first = settleMaintenance(f.owner), second = settleMaintenance(f.owner);
    const settlingCalls = calls;
    expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
    gate.resolve(); await Promise.all([first, second]); expect(settlingCalls).toBe(2);
    const next = await beginMaintenance(f.owner);
    expect(await erasureOwner(f.owner.repository).listDue(next)).toMatchObject({ items: [] });
  });
  it("advances past over a thousand covered parents without unbounded filtering or starvation", async () => {
    const f = await setup(), ids = await historicalBacklog(f, 1002), wanted = ids.at(-1)!;
    const cover = f.db.prepare("INSERT INTO erasure_scopes VALUES(?,'processing_payload',?,1)");
    f.db.transaction(() => { for (const id of ids.slice(0, -1)) cover.run(id, "a".repeat(32)); })();
    f.advance(7 * 86400000); await refreshTestRepository(f.owner.repository);
    bindMaintenance(f.owner, f.services, f.monotonicNow); const owner = erasureOwner(f.owner.repository);
    let found = false, calls = 0;
    while (!found && calls < 410) {
      const run = await beginMaintenance(f.owner), page = await owner.listDue(run); calls++;
      expect(page.consumedItems).toBeLessThanOrEqual(108); expect(maintenanceSnapshot(f.owner).selectedCount).toBeLessThanOrEqual(20);
      found = page.items.some(candidate => candidate.caseId === wanted && candidate.scope === "processing_payload");
      await settleMaintenance(f.owner);
    }
    expect(found).toBe(true); expect(calls).toBe(401);
  });
  it("counts a preexisting case-guard wait before selection without resetting its deadline", async () => {
    const f = await setup(), { accepted } = await f.accept(), entered = deferred(), gate = deferred();
    const guard = f.owner.repository.withCaseLock(accepted.id, async () => { entered.resolve(); await gate.promise; });
    await entered.promise; bindMaintenance(f.owner, f.services, f.monotonicNow);
    const starting = beginMaintenance(f.owner); f.advance(120001); gate.resolve(); await guard;
    const run = await starting;
    await expect(erasureOwner(f.owner.repository).listDue(run)).rejects.toThrow("MAINTENANCE_DEADLINE");
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(0);
  });
  it("rejects changed claim identity between observation and the exact CAS", async () => {
    const f = await setup(), { accepted } = await f.accept();
    f.owner.repository.claimNext("original", utcInstant(f.owner.clock.now().toISOString()));
    const before = f.db.prepare("SELECT claimToken FROM cases WHERE id=?").get(accepted.id);
    f.advance(7 * 86400000); await refreshTestRepository(f.owner.repository);
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner), owner = erasureOwner(f.owner.repository), page = await owner.listDue(run);
    const prepare = f.db.prepare.bind(f.db); let changed = false;
    const spy = vi.spyOn(f.db, "prepare").mockImplementation(sql => {
      const statement = prepare(sql);
      if (sql.startsWith("SELECT claimOwner,claimedAt,claimToken,claimKind,deliveryState")) {
        const get = statement.get.bind(statement);
        vi.spyOn(statement, "get").mockImplementation((...args: unknown[]) => { const row = get(...args); prepare("UPDATE cases SET claimToken=? WHERE id=?").run("f".repeat(64), accepted.id); changed = true; return row; });
      }
      return statement;
    });
    await expect(owner.prepareDue(page.items[0], run)).rejects.toThrow("ERASURE_CLAIM_ACTIVE"); spy.mockRestore();
    expect(changed).toBe(true); expect(f.db.prepare("SELECT claimToken FROM cases WHERE id=?").get(accepted.id)).toEqual(before);
    expect(f.db.prepare("SELECT count(*) AS n FROM erasure_events").get()).toEqual({ n: 0 });
  });
  it("keeps trusted service method receivers and sanitizes a failed acquisition", async () => {
    const f = await setup(), original = f.services.holdMaintenance!;
    f.services.holdMaintenance = async function (owner) { expect(this).toBe(f.services); return original(owner); };
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await beginMaintenance(f.owner); await settleMaintenance(f.owner);
    const other = await setup();
    other.services.holdMaintenance = async () => { throw new Error("private-sensitive-canary"); };
    bindMaintenance(other.owner, other.services, other.monotonicNow);
    await expect(beginMaintenance(other.owner)).rejects.toThrow("MAINTENANCE_HOLD_LOST");
  });
  it("revokes a late ingress grant and settles its cleanup before maintenance can start", async () => {
    const f = await setup(), entered = deferred(), gate = deferred(), grant = f.authority.grant.bind(f.authority);
    let lease!: IngressLease;
    f.authority.grant = async current => { lease = current; entered.resolve(); await gate.promise; return grant(current); };
    const reserve = f.owner.custody.reserve({ ...testAdmission(), sessionHash: digest("a".repeat(64)), idempotencyKey: "late-grant", reservedBytes: 20000, now: utcInstant(f.owner.clock.now().toISOString()) }, testReadiness);
    const denied = expect(reserve).rejects.toThrow("MAINTENANCE_INHIBITED");
    await entered.promise; bindMaintenance(f.owner, f.services, f.monotonicNow);
    let started = false; const starting = beginMaintenance(f.owner).then(run => { started = true; return run; });
    await new Promise(resolve => setImmediate(resolve)); expect(started).toBe(false);
    gate.resolve(); await denied; await starting;
    expect(await f.authority.observe(lease)).toMatchObject({ state: "released", chargedBytes: 0, object: null });
    expect(f.db.prepare("SELECT count(*) AS n FROM cases").get()).toEqual({ n: 0 });
  });
  it("uses actual indexed SEARCH plans for every due/pending/global key selector", async () => {
    const f = await setup(), statements = new Set<string>(), prepare = f.db.prepare.bind(f.db);
    const spy = vi.spyOn(f.db, "prepare").mockImplementation(sql => { if (/^SELECT (?:\w+ AS keyAt|json_extract\(event|rowid FROM)/.test(sql)) statements.add(sql); return prepare(sql); });
    bindMaintenance(f.owner, f.services, f.monotonicNow); const owner = erasureOwner(f.owner.repository);
    for (let i = 0; i < 8; i++) {
      const run = await beginMaintenance(f.owner); await owner.listDue(run);
      if (i < 2) await owner.listPending(run); if (i < 4) await owner.expireGlobalBatch(run);
      await settleMaintenance(f.owner);
    }
    spy.mockRestore();
    expect(statements.size).toBe(17); // accepted/cleanup SQL reuse; pending prefix ranges.
    for (const sql of statements) {
      const plan = prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...Array.from({ length: (sql.match(/\?/g) ?? []).length }, () => 1)) as { detail: string }[];
      expect(plan.some(row => /SEARCH/.test(row.detail)), sql).toBe(true);
      expect(plan.some(row => /SCAN|TEMP B-TREE/.test(row.detail)), sql).toBe(false);
    }
  });
  it("retains all original authority on claim CAS rollback and stops further commands", async () => {
    const f = await setup(), { accepted } = await f.accept();
    f.owner.repository.claimNext("original-owner", utcInstant(f.owner.clock.now().toISOString()));
    const original = f.db.prepare("SELECT claimOwner,claimedAt,claimToken,claimKind,deliveryState FROM cases WHERE id=?").get(accepted.id);
    f.advance(7 * 86400000); await refreshTestRepository(f.owner.repository);
    f.db.exec("CREATE TRIGGER synthetic_claim_failure BEFORE UPDATE OF claimToken ON cases BEGIN SELECT RAISE(ABORT,'private-sensitive-canary'); END;");
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner), owner = erasureOwner(f.owner.repository), page = await owner.listDue(run);
    await expect(owner.prepareDue(page.items[0], run)).rejects.toThrow("MAINTENANCE_COMMAND_FAILED");
    expect(f.db.prepare("SELECT claimOwner,claimedAt,claimToken,claimKind,deliveryState FROM cases WHERE id=?").get(accepted.id)).toEqual(original);
    expect(f.db.prepare("SELECT count(*) AS n FROM erasure_events").get()).toEqual({ n: 0 });
    await expect(owner.expireGlobalBatch(run)).rejects.toThrow("MAINTENANCE_RUN_STOPPED");
  });
  it("preserves auth monotonic clock and exact fifteen-minute expiry without reset", async () => {
    const f = await setup(), owner = erasureOwner(f.owner.repository);
    f.db.prepare("INSERT INTO auth_attempts VALUES('ip','at-boundary',?)").run("2026-10-10T11:45:00.000Z");
    f.db.prepare("INSERT INTO auth_attempts VALUES('ip','after-boundary',?)").run("2026-10-10T11:45:00.001Z");
    f.db.prepare("UPDATE maintenance_selectors SET globalPhase=3").run();
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner);
    expect(await owner.expireGlobalBatch(run)).toMatchObject({ deleted: 1 });
    expect(f.db.prepare("SELECT key FROM auth_attempts").all()).toEqual([{ key: "after-boundary" }]);
    const recorded = f.db.prepare("SELECT lastAt FROM auth_clock").get();
    f.db.prepare("UPDATE auth_clock SET lastAt=?").run("2026-10-10T12:00:01.000Z");
    f.db.prepare("UPDATE maintenance_selectors SET globalPhase=3").run();
    await expect(owner.expireGlobalBatch(run)).rejects.toThrow("AUTH_DENIED");
    expect(recorded).toEqual({ lastAt: "2026-10-10T12:00:00.000Z" });
    expect(f.db.prepare("SELECT lastAt FROM auth_clock").get()).toEqual({ lastAt: "2026-10-10T12:00:01.000Z" });
    expect(f.db.prepare("SELECT key FROM auth_attempts").all()).toEqual([{ key: "after-boundary" }]);
  });
  it("denies absent maintenance methods, forged/reused/cross-owner runs and aggregate overspend", async () => {
    const f = await setup(), other = await setup();
    expect(() => bindMaintenance(f.owner, { settle: async () => {}, close: async () => {} })).toThrow("MAINTENANCE_UNAVAILABLE");
    bindMaintenance(f.owner, f.services, f.monotonicNow); bindMaintenance(other.owner, other.services, other.monotonicNow);
    const run = await beginMaintenance(f.owner);
    await expect(erasureOwner(other.owner.repository).listDue(run)).rejects.toThrow("MAINTENANCE_RUN_INVALID");
    await expect(erasureOwner(f.owner.repository).listDue({} as never)).rejects.toThrow("MAINTENANCE_RUN_INVALID");
    await maintenanceCommand(run, f.owner.repository, 999, "scalar", () => ({ value: null, consumedItems: 999 }));
    await expect(maintenanceCommand(run, f.owner.repository, 2, "scalar", () => ({ value: null, consumedItems: 2 }))).rejects.toThrow("MAINTENANCE_BUDGET_INSUFFICIENT");
    await maintenanceCommand(run, f.owner.repository, 1, "scalar", () => ({ value: null, consumedItems: 1 }));
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(1000);
    await settleMaintenance(f.owner);
    await expect(erasureOwner(f.owner.repository).listDue(run)).rejects.toThrow("MAINTENANCE_RUN_INVALID");
  });
  it("selects the exact original pending done without a live parent", async () => {
    const f = await setup(), event: EraseJournalEvent = ["tj-journal-event-v1", "e".repeat(32), instant, "erase_done", [caseId, "c".repeat(32)]];
    f.db.prepare("INSERT INTO erasure_events(eventId,caseId,event,phase) VALUES(?,?,?,'proposed')").run(event[1], caseId, encodeJournalEvent(event));
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner);
    const page = await erasureOwner(f.owner.repository).listPending(run);
    expect(page.items).toEqual([{ kind: "proposed", event }]);
    expect(f.db.prepare("SELECT 1 FROM cases WHERE id=?").get(caseId)).toBeUndefined();
    expect(page.consumedItems).toBeGreaterThan(0);
  });
  it("reconciles only a current verified obligation and retains delivery uncertainty", async () => {
    const f = await setup(), { accepted } = await f.accept();
    f.db.prepare("UPDATE cases SET deliveryState='uncertain',claimOwner='prior',claimedAt=?,claimToken=?,claimKind='reconcile' WHERE id=?").run(instant, "a".repeat(64), accepted.id);
    const event: EraseJournalEvent = ["tj-journal-event-v1", "c".repeat(32), instant, "erase_commit", [accepted.id, "processing_payload", "fixture-erasure", "d".repeat(64)]];
    await erasureOwner(f.owner.repository).journal!.append(event);
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner), owner = erasureOwner(f.owner.repository);
    const listed = await owner.listCommitted(run); expect(listed.items[0].commitEventId).toBe(event[1]);
    expect(await owner.reconcileClaim(event[1], run)).toMatchObject({ changed: true });
    expect(f.db.prepare("SELECT deliveryState,claimToken FROM cases WHERE id=?").get(accepted.id)).toEqual({ deliveryState: "uncertain", claimToken: null });
    await expect(owner.reconcileClaim("f".repeat(32), run)).rejects.toThrow();
  });
  it("pages due candidates fairly beyond twenty and never spends a fresh helper allowance", async () => {
    const f = await setup(), ids = await historicalBacklog(f, 45);
    f.advance(7 * 86400000); await refreshTestRepository(f.owner.repository);
    bindMaintenance(f.owner, f.services, f.monotonicNow); const owner = erasureOwner(f.owner.repository);
    const seen = new Set<string>();
    for (let invocation = 0; invocation < 24; invocation++) {
      const run = await beginMaintenance(f.owner), page = await owner.listDue(run);
      for (const candidate of page.items) if (candidate.scope === "processing_payload") seen.add(candidate.caseId);
      expect(maintenanceSnapshot(f.owner).selectedCount).toBeLessThanOrEqual(20);
      expect(maintenanceSnapshot(f.owner).consumedItems).toBe(page.consumedItems);
      await settleMaintenance(f.owner);
    }
    expect(seen).toEqual(new Set(ids));
  });
  it("prepares only an owner-issued candidate and clears exactly an excluded abandoned claim", async () => {
    const f = await setup(), { accepted } = await f.accept();
    const now = utcInstant(f.owner.clock.now().toISOString()); f.owner.repository.claimNext("synthetic-dead-worker", now);
    const before = f.db.prepare("SELECT deliveryState,claimOwner,claimToken,claimKind FROM cases WHERE id=?").get(accepted.id);
    f.advance(7 * 86400000); await refreshTestRepository(f.owner.repository);
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner), owner = erasureOwner(f.owner.repository);
    const page = await owner.listDue(run), candidate = page.items[0];
    await expect(owner.prepareDue({ ...candidate }, run)).rejects.toThrow("ERASURE_CANDIDATE_INVALID");
    const result = await owner.prepareDue(candidate, run);
    expect(result.event[3]).toBe("erase_commit");
    expect(result.event[4].slice(0, 2)).toEqual([accepted.id, "processing_payload"]);
    expect(before).toMatchObject({ deliveryState: "scanning", claimOwner: "synthetic-dead-worker", claimKind: "prepare" });
    expect(f.db.prepare("SELECT deliveryState,claimOwner,claimToken,claimKind FROM cases WHERE id=?").get(accepted.id)).toEqual({ deliveryState: "scanning", claimOwner: null, claimToken: null, claimKind: null });
    await expect(owner.prepareDue(candidate, run)).rejects.toThrow("ERASURE_CANDIDATE_INVALID");
  });
  it("bounds global expiry mutations across shared invocations without touching auth sessions", async () => {
    const f = await setup();
    const insert = f.db.prepare("INSERT INTO abuse_events VALUES('session','synthetic',?,?)");
    f.db.transaction(() => { for (let i = 0; i < 1500; i++) insert.run("2026-01-01T00:00:00.000Z", "2026-01-01T00:15:00.000Z"); })();
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner), owner = erasureOwner(f.owner.repository);
    let deleted = 0;
    for (let i = 0; i < 4; i++) deleted += (await owner.expireGlobalBatch(run)).deleted;
    expect(deleted).toBeGreaterThan(0); expect(deleted).toBeLessThan(500);
    expect(f.db.prepare("SELECT count(*) AS n FROM abuse_events").get()).toEqual({ n: 1500 - deleted });
    expect(maintenanceSnapshot(f.owner).consumedItems).toBeLessThanOrEqual(1000);
    expect(f.db.prepare("SELECT count(*) AS n FROM auth_sessions").get()).toEqual({ n: 0 });
  });
  it("retains begin/finish lifetime between queue tasks until real finally cleanup finishes", async () => {
    const f = await setup(), accepted = await f.accept();
    const snapshot = await takePrivateSnapshot(accepted.record, accepted.keys);
    const directory = await f.owner.custody.beginProcessing(snapshot, 4096);
    await mkdir(directory, { mode: 0o700 });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    let started = false;
    const starting = beginMaintenance(f.owner).then(run => { started = true; return run; });
    await new Promise(resolve => setImmediate(resolve));
    expect(started).toBe(false);
    expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
    await f.owner.custody.finishProcessing(directory); await starting;
    expect(await readdir(f.config.runtimeRoot)).toEqual([]);
  });
  it("settles an admitted plaintext scope and cleanup enqueued after an awaited action", async () => {
    const f = await setup(), accepted = await f.accept(), gate = deferred(), entered = deferred();
    const snapshot = await takePrivateSnapshot(accepted.record, accepted.keys);
    const scope = withPrivateFiles(snapshot, accepted.keys, async () => { entered.resolve(); await gate.promise; });
    await entered.promise;
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    let started = false;
    const starting = beginMaintenance(f.owner).then(run => { started = true; return run; });
    await new Promise(resolve => setImmediate(resolve));
    expect(started).toBe(false); gate.resolve(); await scope; await starting;
    expect(await readdir(f.config.runtimeRoot)).toEqual([]);
  });
  it("inhibits original admission synchronously and rejects tuple forgery and rebinding", async () => {
    const f = await setup();
    expect(() => bindMaintenance({ ...f.owner, clock: { now: f.owner.clock.now } }, f.services)).toThrow("MAINTENANCE_OWNER_MISMATCH");
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    expect(() => bindMaintenance(f.owner, f.services)).toThrow("MAINTENANCE_ALREADY_BOUND");
    const starting = beginMaintenance(f.owner);
    expect(() => f.owner.repository.reserve({ ...testAdmission(), sessionHash: digest("a".repeat(64)), idempotencyKey: "blocked", reservedBytes: 1, now: utcInstant(f.owner.clock.now().toISOString()) })).toThrow("MAINTENANCE_INHIBITED");
    await starting;
    expect(f.owner.custody.getIntakeReadiness()).toEqual({ ready: false });
    expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
  });
  it("keeps the run and close guard until actual work settles after the report deadline", async () => {
    const f = await setup(); bindMaintenance(f.owner, f.services, f.monotonicNow);
    const run = await beginMaintenance(f.owner), gate = deferred();
    const work = maintenanceCommand(run, f.owner.repository, 10, "scalar", async () => { await gate.promise; return { value: "settled", consumedItems: 7 }; });
    f.advance(120001);
    expect(maintenanceSnapshot(f.owner)).toMatchObject({ status: "settling", consumedItems: 10 });
    expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
    expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
    gate.resolve(); expect(await work).toEqual({ value: "settled", consumedItems: 7 });
    await settleMaintenance(f.owner);
    expect(f.owner.custody.getIntakeReadiness()).toEqual({ ready: false });
    expect(maintenanceSnapshot(f.owner)).toMatchObject({ status: "settled", consumedItems: 7 });
  });
  it("counts waits in the original allowance and fails closed on missing or lost hold", async () => {
    const f = await setup(), gate = deferred();
    const hold = f.services.holdMaintenance!;
    f.services.holdMaintenance = async owner => { await gate.promise; return hold(owner); };
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    const starting = beginMaintenance(f.owner); f.advance(60000); gate.resolve();
    const run = await starting;
    await expect(maintenanceCommand(run, f.owner.repository, 1, "journal", async () => ({ value: null, consumedItems: 1 }))).rejects.toThrow("MAINTENANCE_DEADLINE");
    await settleMaintenance(f.owner);
    const next = await beginMaintenance(f.owner); f.loseHold();
    await expect(maintenanceCommand(next, f.owner.repository, 1, "scalar", async () => ({ value: null, consumedItems: 1 }))).rejects.toThrow("MAINTENANCE_HOLD_LOST");
    expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
  });
});
