import { afterEach, describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { copyFile, lstat, readdir, readFile, rm, writeFile, rename, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import type { Dir } from "node:fs";
import { maintenanceFixture, deferred } from "./fixtures/maintenance";
import { beginMaintenance, bindMaintenance, maintenanceSnapshot, settleMaintenance, selectMaintenance, closeCustodyHandle, closeMaintenanceScanIterators, finishMaintenanceAcceptedResources } from "../src/worker-maintenance";
import { custodyErasureOwner, consumeCustodyObservation, type CustodyObservation } from "../src/custody-erasure";
import { createCustodyLedger } from "../src/custody";
import { createCustodyInventoryStorage } from "../src/erasure-storage";
import type { FileHandle } from "node:fs/promises";
import type { MaintenanceRun } from "../src/worker-maintenance";
import type { CustodyLedger, WorkerOwner } from "../src/types";
import { applicationId, digest, utcInstant } from "../src/types";
import { testAdmission, testReadiness, refreshTestRepository } from "./fixtures/admission";
import { erasureOwner } from "../src/erasure-repository";
import * as maintenance from "../src/worker-maintenance";
import type { PhysicalVerifier, PhysicalCompletion } from "../src/erasure-storage";
import { TestIngressAuthority } from "./fixtures/ingress-authority";

const connections = vi.hoisted(() => ({ all: [] as Database.Database[] }));
const observationProbe = vi.hoisted(() => ({ record: undefined as ((token: CustodyObservation, run: MaintenanceRun, custody: CustodyLedger) => void) | undefined, completion: undefined as (() => void) | undefined, completionRead: undefined as (() => void) | undefined }));
const verifierProbe = vi.hoisted(() => ({ all: [] as { custody: CustodyLedger; verifier: PhysicalVerifier; register: (value: PhysicalVerifier) => void }[] }));
vi.mock("../src/erasure-storage", async original => {
  const actual = await original<typeof import("../src/erasure-storage")>();
  return { ...actual, createCustodyInventoryStorage(...args: Parameters<typeof actual.createCustodyInventoryStorage>) {
    const authority = args[4];
    if (authority) args[4] = { ...authority, registerPhysicalVerifier(verifier) { authority.registerPhysicalVerifier(verifier); verifierProbe.all.push({ custody: args[2], verifier, register: authority.registerPhysicalVerifier }); } };
    const storage = actual.createCustodyInventoryStorage(...args);
    return { ...storage, record(token: CustodyObservation, run: MaintenanceRun) { observationProbe.record?.(token, run, args[2]); return storage.record(token, run); }, verifyCompletionWork(...operands: Parameters<typeof storage.verifyCompletionWork>) { observationProbe.completionRead?.(); const result = storage.verifyCompletionWork(...operands); observationProbe.completion?.(); return result; } };
  } };
});
vi.mock("node:fs/promises", async original => ({ ...await original<typeof import("node:fs/promises")>() }));
vi.mock("../src/worker-maintenance", async original => ({ ...await original<typeof import("../src/worker-maintenance")>() }));
vi.mock("better-sqlite3", async original => {
  const actual = await original<{ default: typeof Database }>();
  return { default: class extends actual.default { constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); connections.all.push(this); } } };
});
const fixtures: Awaited<ReturnType<typeof maintenanceFixture>>[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  observationProbe.record = undefined;
  observationProbe.completion = undefined;
  observationProbe.completionRead = undefined;
  verifierProbe.all.length = 0;
  for (const f of fixtures) await settleMaintenance(f.owner).catch(() => {});
  for (const db of connections.all.splice(0)) if (db.open) db.close();
  for (const f of fixtures.splice(0)) await rm(f.root, { recursive: true, force: true });
});
async function setup(startup?: "ordinary" | "cold-maintenance") {
  const f = await maintenanceFixture(startup); fixtures.push(f);
  return { ...f, db: connections.all.at(-1)! };
}
async function acknowledgedPayload(f: Awaited<ReturnType<typeof setup>>) {
  const accepted = await f.accept(); f.advance(7 * 86400000); await refreshTestRepository(f.owner.repository);
  const erasure = erasureOwner(f.owner.repository);
  const event = await f.owner.repository.withCaseLock(accepted.accepted.id, async () => {
    const event = erasure.prepareCommit(accepted.accepted.id, "processing_payload");
    erasure.acknowledge(event, await erasure.journal!.append(event)); return event;
  });
  return { accepted, event };
}
async function eraseAll(owner: WorkerOwner, event: string) {
  let complete = false;
  for (let n = 0; !complete && n < 200; n++) {
    const run = await beginMaintenance(owner);
    try { complete = (await custodyErasureOwner(owner.custody).eraseScopeBatch(event, run)).complete; }
    finally { await settleMaintenance(owner); }
  }
  expect(complete).toBe(true);
}
async function scanAll(owner: WorkerOwner) {
  let complete = false;
  for (let n = 0; !complete && n < 100; n++) {
    try { complete = (await custodyErasureOwner(owner.custody).scanBatch(await beginMaintenance(owner))).complete; }
    finally { await settleMaintenance(owner); }
  }
  expect(complete).toBe(true);
}
describe("bounded original-custody erasure", () => {
  it("covers actual twenty-leaf native and SQLite work with the single charged physical allowance", async () => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f), id = randomUUID(), path = join(f.config.runtimeRoot, id);
    await mkdir(path, { mode: 0o700 });
    const leaves = [...Array.from({ length: 5 }, (_, n) => `${n}.data`), ...Array.from({ length: 5 }, (_, n) => ["pdf", "jpg", "png"].map(ext => `document-${n + 1}.${ext}`)).flat()];
    for (const leaf of leaves) await writeFile(join(path, leaf), "real residue", { mode: 0o600 });
    await writeFile(join(f.config.custodyRoot, `${id}.journal`), JSON.stringify({ version: 3, id, kind: "processing", state: "committed", path, budget: 4096, cleanupAfter: "2026-10-18T12:00:00.000Z", caseId: accepted.accepted.id }), { mode: 0o600 });
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    let native = 0, rows = 0, total = 0;
    const stat = fs.lstat, open = fs.open, opendir = fs.opendir, unlink = fs.unlink, rmdir = fs.rmdir, prepare = f.db.prepare.bind(f.db);
    vi.spyOn(fs, "lstat").mockImplementation(async (...args) => { native++; return stat(...args); });
    vi.spyOn(fs, "unlink").mockImplementation(async (...args) => { native++; return unlink(...args); });
    vi.spyOn(fs, "rmdir").mockImplementation(async (...args) => { native++; return rmdir(...args); });
    vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      native++; const fd = await open(...args), stat = fd.stat.bind(fd), sync = fd.sync.bind(fd), close = fd.close.bind(fd);
      vi.spyOn(fd, "stat").mockImplementation(async (...args) => { native++; return stat(...args); });
      vi.spyOn(fd, "sync").mockImplementation(async () => { native++; return sync(); });
      vi.spyOn(fd, "close").mockImplementation(async () => { native++; return close(); }); return fd;
    });
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => {
      native++; const dir = await opendir(...args), read = dir.read.bind(dir), close = dir.close.bind(dir);
      dir.read = async () => { native++; return read(); }; dir.close = async () => { native++; return close(); }; return dir;
    });
    vi.spyOn(f.db, "prepare").mockImplementation(sql => {
      const statement = prepare(sql), get = statement.get.bind(statement), all = statement.all.bind(statement), run = statement.run.bind(statement);
      vi.spyOn(statement, "get").mockImplementation((...args: unknown[]) => { const result = get(...args); rows += result ? 2 : 1; return result; });
      vi.spyOn(statement, "all").mockImplementation((...args: unknown[]) => { const result = all(...args); rows += result.length + 1; return result; });
      vi.spyOn(statement, "run").mockImplementation((...args: unknown[]) => { rows++; return run(...args); }); return statement;
    });
    let complete = false;
    for (let n = 0; !complete && n < 200; n++) {
      const before = native + rows, result = await custodyErasureOwner(f.owner.custody).eraseScopeBatch(event[1], await beginMaintenance(f.owner));
      complete = result.complete; total += result.consumedItems;
      expect(result.consumedItems).toBeGreaterThanOrEqual(native + rows - before); expect(maintenanceSnapshot(f.owner).consumedItems).toBeLessThanOrEqual(1000);
      await settleMaintenance(f.owner);
    }
    expect(complete).toBe(true); expect(native).toBeGreaterThan(500); expect(total).toBeGreaterThan(1000); expect(await readdir(f.config.runtimeRoot)).toEqual([]);
  });
  it.each([false, true])("uses one existing reservation for combined staging/sealed artifacts (overflow=%s)", async overflow => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f), id = randomUUID(), stage = join(f.config.custodyRoot, `${id}.bundle.staging`), sealed = join(f.config.custodyRoot, `${id}.bundle.enc`), size = overflow ? 6 * 1024 * 1024 : 13;
    await writeFile(stage, Buffer.alloc(size, 1), { mode: 0o600 }); await writeFile(sealed, Buffer.alloc(size, 2), { mode: 0o600 });
    f.db.prepare("INSERT INTO artifacts(caseId,kind,path,bytes,plaintextDigest,ciphertextDigest,expiresAt) VALUES(?,'bundle',?,?,?,?,'2026-10-18T12:00:00.000Z')").run(accepted.accepted.id, sealed, size, "1".repeat(64), "2".repeat(64));
    await writeFile(join(f.config.custodyRoot, `${id}.journal`), JSON.stringify({ version: 3, id, kind: "artifact", artifactKind: "bundle", state: "committed", path: stage, workerPath: sealed, budget: size, cleanupAfter: "2026-10-18T12:00:00.000Z", caseId: accepted.accepted.id }), { mode: 0o600 });
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    if (overflow) { await expect(eraseAll(f.owner, event[1])).rejects.toThrow(); expect((await lstat(stage)).size).toBe(size); expect((await lstat(sealed)).size).toBe(size); }
    else { await eraseAll(f.owner, event[1]); expect(await readdir(f.config.custodyRoot)).toEqual([]); expect(f.db.prepare("SELECT bytes FROM artifacts WHERE caseId=?").get(accepted.accepted.id)).toEqual({ bytes: size }); }
  });
  it("keeps a lost-acceptance-reply journal associated with its accepted case through physical finalization", async () => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f), path = accepted.record.encryptedPayloadPath.replace(/\.enc$/, ".journal");
    const journal = JSON.parse(await readFile(path, "utf8")); delete journal.caseId; journal.state = "orphan";
    await writeFile(path, JSON.stringify(journal), { mode: 0o600 });
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner); await eraseAll(f.owner, event[1]);
    expect(f.db.prepare("SELECT DISTINCT caseId FROM erasure_inventory_journals").all()).toEqual([{ caseId: accepted.accepted.id }]);
    expect(await readdir(f.config.custodyRoot)).toEqual([]);
  });
  it("denies source charge changes between admitted batches while preserving the original native object", async () => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f), unlink = fs.unlink;
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    vi.spyOn(fs, "unlink").mockImplementation(async path => { if (path === accepted.record.encryptedPayloadPath) throw new Error("source change boundary"); await unlink(path); });
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow("MAINTENANCE_COMMAND_FAILED"); vi.restoreAllMocks();
    const before = f.db.prepare("SELECT * FROM erasure_manifests WHERE slot='original-sealed'").get();
    f.db.prepare("UPDATE cases SET payloadBytes=payloadBytes+1 WHERE id=?").run(accepted.accepted.id);
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow();
    expect(f.db.prepare("SELECT * FROM erasure_manifests WHERE slot='original-sealed'").get()).toEqual(before); expect((await lstat(accepted.record.encryptedPayloadPath)).size).toBe(accepted.record.actualBytes);
  });
  it("retains positive charge across an original terminal-release failure and finishing-only retry", async () => {
    let armed = false, calls = 0, failed = false;
    const released = TestIngressAuthority.prototype.released;
    vi.spyOn(TestIngressAuthority.prototype, "released").mockImplementation(async function (this: TestIngressAuthority, lease) {
      if (armed && ++calls === 2) { failed = true; throw new Error("private terminal-release canary"); }
      return released.call(this, lease);
    });
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f);
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner); armed = true;
    let stopped: MaintenanceRun | undefined;
    for (let n = 0; !stopped && n < 30; n++) {
      const run = await beginMaintenance(f.owner);
      try { await custodyErasureOwner(f.owner.custody).eraseScopeBatch(event[1], run); }
      catch (error) { expect(error).toMatchObject({ message: "INGRESS_RECOVERY_REQUIRED" }); stopped = run; }
      if (!stopped) await settleMaintenance(f.owner);
    }
    expect(failed).toBe(true); await expect(lstat(accepted.record.encryptedPayloadPath)).rejects.toMatchObject({ code: "ENOENT" });
    const old = f.db.prepare("SELECT phase,remainingCharge FROM erasure_manifests WHERE slot='original-sealed'").get();
    expect(old).toEqual({ phase: "holders-released", remainingCharge: accepted.record.actualBytes });
    expect(await finishMaintenanceAcceptedResources(stopped!, f.owner.custody)).toEqual({ consumedItems: 2 });
    expect(f.db.prepare("SELECT phase,remainingCharge FROM erasure_manifests WHERE slot='original-sealed'").get()).toEqual(old);
    await settleMaintenance(f.owner); await eraseAll(f.owner, event[1]);
  });
  it("tracks a late admitted unlink through settlement and requires fresh recovery before finalization", async () => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f), started = deferred(), release = deferred();
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    const unlink = fs.unlink; let armed = true;
    vi.spyOn(fs, "unlink").mockImplementation(async path => {
      if (armed && path === accepted.record.encryptedPayloadPath) { armed = false; started.resolve(); await release.promise; }
      await unlink(path);
    });
    const task = (async () => {
      for (let n = 0; n < 30; n++) { await custodyErasureOwner(f.owner.custody).eraseScopeBatch(event[1], await beginMaintenance(f.owner)); await settleMaintenance(f.owner); }
    })();
    const rejection = expect(task).rejects.toThrow(); await started.promise;
    f.advance(120001); let settled = false; const settling = settleMaintenance(f.owner).then(() => { settled = true; });
    await Promise.resolve(); expect(settled).toBe(false); release.resolve(); await rejection; await settling;
    expect(f.db.prepare("SELECT phase,remainingCharge FROM erasure_manifests WHERE slot='original-sealed'").get()).toEqual({ phase: "holders-released", remainingCharge: accepted.record.actualBytes });
    vi.restoreAllMocks(); const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    try { await scanAll(restarted.owner); await eraseAll(restarted.owner, event[1]); }
    finally { await settleMaintenance(restarted.owner); }
  });
  it("bounds real accepted execution and all-manifest recovery across more than1000 credits and20 cases", async () => {
    const f = await setup(), first = await acknowledgedPayload(f), events = [first.event[1]];
    const source = f.db.prepare("SELECT * FROM cases WHERE id=?").get(first.accepted.accepted.id) as Record<string, unknown>;
    const reservation = f.db.prepare("SELECT * FROM reservations WHERE id=?").get(source.reservationId) as Record<string, unknown>;
    const journal = JSON.parse(await readFile(first.accepted.record.encryptedPayloadPath.replace(/\.enc$/, ".journal"), "utf8"));
    for (let n = 0; n < 20; n++) {
      const id = randomUUID(), reservationId = randomUUID(), sessionHash = n.toString(16).padStart(64, "0"), path = join(f.config.custodyRoot, `${reservationId}.enc`);
      const records: [string, Record<string, unknown>][] = [["reservations", { ...reservation, id: reservationId, sessionHash }], ["cases", { ...source, id, reference: `bounded-${n}`, reservationId, sessionHash, encryptedPayloadPath: path }]];
      for (const table of ["case_lifecycle", "deliveries"]) records.push([table, { ...f.db.prepare(`SELECT * FROM ${table} WHERE caseId=?`).get(source.id) as Record<string, unknown>, caseId: id }]);
      for (const [table, value] of records) f.db.prepare(`INSERT INTO ${table}(${Object.keys(value).join(",")}) VALUES(${Object.keys(value).map(key => `@${key}`).join(",")})`).run(value);
      const lease = await f.authority.prepare(reservationId, join(f.config.intakeRoot, `${reservationId}.enc`), 10000); await f.authority.grant(lease);
      await copyFile(first.accepted.record.encryptedPayloadPath, path);
      await writeFile(join(f.config.custodyRoot, `${reservationId}.journal`), JSON.stringify({ ...journal, id: reservationId, caseId: id, path: lease.path, workerPath: path, lease, release: "pending", reservation: { ...journal.reservation, id: reservationId, sessionHash } }), { mode: 0o600 });
      const erasure = erasureOwner(f.owner.repository), event = await f.owner.repository.withCaseLock(applicationId(id), async () => {
        const proposed = erasure.prepareCommit(applicationId(id), "processing_payload"); erasure.acknowledge(proposed, await erasure.journal!.append(proposed)); return proposed;
      }); events.push(event[1]);
    }
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    let total = 0, batches = 0;
    for (const event of events) {
      let complete = false;
      for (let n = 0; !complete && n < 100; n++) {
        const result = await custodyErasureOwner(f.owner.custody).eraseScopeBatch(event, await beginMaintenance(f.owner));
        complete = result.complete; total += result.consumedItems; batches++;
        expect(maintenanceSnapshot(f.owner).consumedItems).toBeLessThanOrEqual(1000); expect(maintenanceSnapshot(f.owner).selectedCount).toBeLessThanOrEqual(20);
        await settleMaintenance(f.owner);
      }
      expect(complete).toBe(true);
    }
    expect(total).toBeGreaterThan(1000); expect(batches).toBeGreaterThan(21);
    expect(f.db.prepare("SELECT count(*) n FROM erasure_manifests WHERE phase='metadata-finalized' AND remainingCharge=0").get()).toEqual({ n: 63 });
    const restarted = await f.restart(), db = connections.all.at(-1)!; bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    try {
      const run = await beginMaintenance(restarted.owner);
      for (let n = 0; n < 19; n++) selectMaintenance(run, restarted.owner.repository, `occupied-selection:${n}`);
      expect((await custodyErasureOwner(restarted.owner.custody).scanBatch(run)).complete).toBe(false);
      expect(maintenanceSnapshot(restarted.owner).selectedCount).toBe(20); expect(maintenanceSnapshot(restarted.owner).consumedItems).toBeLessThanOrEqual(1000);
      await settleMaintenance(restarted.owner); await scanAll(restarted.owner);
      const pass = (db.prepare("SELECT scanPass FROM erasure_maintenance").get() as { scanPass: string }).scanPass;
      expect(db.prepare("SELECT count(*) n FROM erasure_inventory_objects WHERE pass=? AND presence='absent'").get(pass)).toEqual({ n: 63 });
    } finally { await settleMaintenance(restarted.owner); }
  }, 20000);
  it("uses indexed bounded accepted selectors and native identity probes", async () => {
    const f = await setup();
    const queries: [string, unknown[]][] = [
      ["SELECT journalId FROM erasure_inventory_journals INDEXED BY erasure_inventory_case WHERE pass=? AND caseId=? AND journalId>? ORDER BY journalId LIMIT 1", ["", "", ""]],
      ["SELECT * FROM erasure_manifests INDEXED BY erasure_manifest_execution WHERE eraseCommitId=? AND slot=? AND (journalId,leaf)>(?,?) ORDER BY journalId,leaf LIMIT 1", ["", "", "", ""]],
      ["SELECT * FROM erasure_manifests WHERE (eraseCommitId,journalId,slot,leaf)>(?,?,?,?) ORDER BY eraseCommitId,journalId,slot,leaf LIMIT 1", ["", "", "", ""]],
      ["SELECT journalId,slot,leaf FROM erasure_inventory_objects INDEXED BY erasure_inventory_identity WHERE pass=? AND device=? AND inode=? LIMIT 2", ["", 1, 1]],
      ["SELECT leaf,phase,remainingCharge FROM erasure_manifests WHERE eraseCommitId=? AND journalId=? AND slot='processing-file' ORDER BY leaf LIMIT 21", ["", ""]],
    ];
    for (const [sql, args] of queries) {
      const rows = f.db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as { detail: string }[];
      expect(rows.every(row => !/SCAN |TEMP B-TREE/.test(row.detail))).toBe(true); expect(rows.some(row => /SEARCH .*INDEX/.test(row.detail))).toBe(true);
    }
  });
  it.each(["same-pass", "cold-restart"] as const)("keeps fresh empty resources distinct from restored zero in %s continuation", async continuation => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f), id = randomUUID(), artifact = randomUUID(), directory = join(f.config.runtimeRoot, id), empty = join(directory, "0.data"), stage = join(f.config.custodyRoot, `${artifact}.bundle.staging`);
    await mkdir(directory, { mode: 0o700 }); await writeFile(empty, "", { mode: 0o600 }); await writeFile(stage, "", { mode: 0o600 });
    await writeFile(join(f.config.custodyRoot, `${id}.journal`), JSON.stringify({ version: 3, id, kind: "processing", state: "committed", path: directory, budget: 4096, cleanupAfter: "2026-10-18T12:00:00.000Z", caseId: accepted.accepted.id }), { mode: 0o600 });
    await writeFile(join(f.config.custodyRoot, `${artifact}.journal`), JSON.stringify({ version: 3, id: artifact, kind: "artifact", artifactKind: "bundle", state: "reserved", path: stage, workerPath: stage.replace(/\.staging$/, ".enc"), budget: 4096, cleanupAfter: "2026-10-18T12:00:00.000Z", caseId: accepted.accepted.id }), { mode: 0o600 });
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    const unlink = fs.unlink; vi.spyOn(fs, "unlink").mockImplementation(async path => { if (path === empty) throw new Error("empty unlink interruption"); await unlink(path); });
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow("MAINTENANCE_COMMAND_FAILED");
    expect(f.db.prepare("SELECT phase,remainingCharge,expectedSize FROM erasure_manifests WHERE journalId=? AND slot='processing-file'").get(id)).toEqual({ phase: "holders-released", remainingCharge: 0, expectedSize: 0 });
    vi.restoreAllMocks();
    if (continuation === "same-pass") {
      await eraseAll(f.owner, event[1]); expect(await readdir(f.config.custodyRoot)).toEqual([]); expect(await readdir(f.config.runtimeRoot)).toEqual([]);
    } else {
      const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
      try { await expect(scanAll(restarted.owner)).rejects.toThrow(); expect((await lstat(empty)).size).toBe(0); }
      finally { await settleMaintenance(restarted.owner); }
    }
  });
  it("recovers surviving native bytes from the exact normalized plans when their journal is absent", async () => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f);
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    const unlink = fs.unlink; vi.spyOn(fs, "unlink").mockImplementation(async path => { if (path === accepted.record.encryptedPayloadPath) throw new Error("planned original interruption"); await unlink(path); });
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow("MAINTENANCE_COMMAND_FAILED"); vi.restoreAllMocks();
    await fs.unlink(accepted.record.encryptedPayloadPath.replace(/\.enc$/, ".journal"));
    const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    try { await scanAll(restarted.owner); await eraseAll(restarted.owner, event[1]); expect(await readdir(f.config.custodyRoot)).toEqual([]); }
    finally { await settleMaintenance(restarted.owner); }
  });
  it.each(["absent-synced", "metadata-finalized"] as const)("does not rearm a genuinely empty resource restored after %s", async phase => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f), id = randomUUID(), path = join(f.config.custodyRoot, `${id}.bundle.staging`);
    await writeFile(path, "", { mode: 0o600 });
    await writeFile(join(f.config.custodyRoot, `${id}.journal`), JSON.stringify({ version: 3, id, kind: "artifact", artifactKind: "bundle", state: "reserved", path, workerPath: path.replace(/\.staging$/, ".enc"), budget: 4096, cleanupAfter: "2026-10-18T12:00:00.000Z", caseId: accepted.accepted.id }), { mode: 0o600 });
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    if (phase === "absent-synced") {
      const prepare = f.db.prepare.bind(f.db);
      vi.spyOn(f.db, "prepare").mockImplementation(sql => {
        const statement = prepare(sql);
        if (sql.startsWith("UPDATE erasure_manifests SET phase=")) {
          const run = statement.run.bind(statement);
          vi.spyOn(statement, "run").mockImplementation((...args: unknown[]) => { if (args[0] === "metadata-finalized" && args[4] === "artifact-staging") throw new Error("final write interrupted"); return run(...args); });
        }
        return statement;
      });
      await expect(eraseAll(f.owner, event[1])).rejects.toThrow("MAINTENANCE_COMMAND_FAILED"); vi.restoreAllMocks();
    } else await eraseAll(f.owner, event[1]);
    expect(f.db.prepare("SELECT phase,remainingCharge FROM erasure_manifests WHERE journalId=? AND slot='artifact-staging'").get(id)).toEqual({ phase, remainingCharge: 0 });
    await expect(lstat(path)).rejects.toMatchObject({ code: "ENOENT" }); await writeFile(path, "", { mode: 0o600 });
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow(); expect((await lstat(path)).size).toBe(0);
    expect(f.db.prepare("SELECT phase,remainingCharge FROM erasure_manifests WHERE journalId=? AND slot='artifact-staging'").get(id)).toEqual({ phase, remainingCharge: 0 });
  });
  it("rejects an acknowledged non-payload scope before planning or native deletion", async () => {
    const f = await setup(), accepted = await f.accept(); f.advance(7 * 86400000); await refreshTestRepository(f.owner.repository);
    const erasure = erasureOwner(f.owner.repository), event = await f.owner.repository.withCaseLock(accepted.accepted.id, async () => {
      const proposed = erasure.prepareCommit(accepted.accepted.id, "public_token"); erasure.acknowledge(proposed, await erasure.journal!.append(proposed)); return proposed;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow("ERASURE_UNVERIFIED");
    expect(f.db.prepare("SELECT count(*) n FROM erasure_manifests").get()).toEqual({ n: 0 }); expect((await lstat(accepted.record.encryptedPayloadPath)).size).toBe(accepted.record.actualBytes);
  });
  it("does not advance its private cursor when SQLite COMMIT rolls back a finalized phase", async () => {
    const f = await setup(), { event } = await acknowledgedPayload(f);
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    const prepare = f.db.prepare.bind(f.db); let fired = false;
    vi.spyOn(f.db, "prepare").mockImplementation(sql => {
      const statement = prepare(sql);
      if (sql.startsWith("UPDATE erasure_manifests SET phase=")) {
        const run = statement.run.bind(statement);
        vi.spyOn(statement, "run").mockImplementation((...args: unknown[]) => {
          const result = run(...args);
          if (!fired && args[0] === "metadata-finalized" && args[4] === "original-sealed") {
            fired = true; f.db.pragma("defer_foreign_keys=ON");
            prepare("INSERT INTO erasure_manifests SELECT ?,scanPass,journalId,slot,leaf,expectedDevice,expectedInode,expectedSize,remainingCharge,phase FROM erasure_manifests WHERE slot='original-sealed'").run("f".repeat(32));
          }
          return result;
        });
      }
      return statement;
    });
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow("MAINTENANCE_COMMAND_FAILED"); expect(fired).toBe(true);
    expect(f.db.prepare("SELECT remainingCharge FROM erasure_manifests WHERE slot='original-sealed'").get()).toMatchObject({ remainingCharge: expect.any(Number) });
    vi.restoreAllMocks(); await eraseAll(f.owner, event[1]);
    expect(f.db.prepare("SELECT 1 FROM erasure_manifests WHERE remainingCharge!=0 OR phase!='metadata-finalized'").get()).toBeUndefined();
  });
  it("keeps physical completion private, execution-minted, one-use and exact-guard/run bound", async () => {
    const f = await setup(), { event } = await acknowledgedPayload(f);
    const binding = verifierProbe.all.find(value => value.custody === f.owner.custody)!, verifier = binding.verifier;
    expect(() => binding.register(verifier)).toThrow("ERASURE_ALREADY_OWNED");
    expect("assertPhysicalComplete" in custodyErasureOwner(f.owner.custody)).toBe(false);
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    let run = await beginMaintenance(f.owner);
    await expect(maintenance.maintenanceCommand(run, f.owner.repository, 20 + verifier.maximumItems, "filesystem", () => erasureOwner(f.owner.repository).withErasureGuard(event[1], async () => {
      const result = await verifier.verify(event[1], run); return { value: result.proof, consumedItems: 20 + result.consumedItems };
    }))).rejects.toThrow("ERASURE_OWNERSHIP_INVALID");
    await settleMaintenance(f.owner); await eraseAll(f.owner, event[1]); run = await beginMaintenance(f.owner);
    const issue = () => maintenance.maintenanceCommand(run, f.owner.repository, 20 + verifier.maximumItems, "filesystem", () => erasureOwner(f.owner.repository).withErasureGuard(event[1], async () => {
      const result = await verifier.verify(event[1], run); return { value: result.proof, consumedItems: 20 + result.consumedItems };
    }));
    const staleGuard = (await issue()).value;
    await maintenance.maintenanceCommand(run, f.owner.repository, 20 + verifier.maximumItems + 68, "filesystem", () => erasureOwner(f.owner.repository).withErasureGuard(event[1], async () => {
      expect(() => verifier.consume(staleGuard, event[1], run)).toThrow("ERASURE_OWNERSHIP_INVALID");
      expect(() => verifier.consume({} as PhysicalCompletion, event[1], run)).toThrow("ERASURE_OWNERSHIP_INVALID");
      const result = await verifier.verify(event[1], run);
      expect(verifier.consume(result.proof, event[1], run)).toBe(17);
      expect(() => verifier.consume(result.proof, event[1], run)).toThrow("ERASURE_OWNERSHIP_INVALID");
      return { value: undefined, consumedItems: 20 + result.consumedItems + 68 };
    }));
    const staleRun = (await issue()).value; await settleMaintenance(f.owner); run = await beginMaintenance(f.owner);
    await maintenance.maintenanceCommand(run, f.owner.repository, 37, "filesystem", () => erasureOwner(f.owner.repository).withErasureGuard(event[1], async () => {
      expect(() => verifier.consume(staleRun, event[1], run)).toThrow("ERASURE_OWNERSHIP_INVALID"); return { value: undefined, consumedItems: 37 };
    }));
  });
  it("permanently denies same-owner recovery after the final held assertion rejects execution EOF", async () => {
    const f = await setup(), { event } = await acknowledgedPayload(f), assertHeld = f.services.assertMaintenanceHeld!;
    let failFinal = false, rejected = false;
    f.services.assertMaintenanceHeld = function(owner, handle) {
      assertHeld.call(this, owner, handle);
      if (failFinal) { failFinal = false; rejected = true; throw new Error("synthetic final held assertion"); }
    };
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    observationProbe.completion = () => { observationProbe.completion = undefined; failFinal = true; };
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN"); expect(rejected).toBe(true);
    await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
    expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
  });
  it("replays actual manifests after a transient final current-work query failure at execution EOF", async () => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f), prepare = f.db.prepare.bind(f.db);
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    let failRead = false, rejected = false;
    observationProbe.completionRead = () => { observationProbe.completionRead = undefined; failRead = true; };
    vi.spyOn(f.db, "prepare").mockImplementation(sql => {
      const statement = prepare(sql), get = statement.get.bind(statement);
      vi.spyOn(statement, "get").mockImplementation((...args: unknown[]) => { const result = get(...args); if (failRead) { failRead = false; rejected = true; throw new Error("synthetic SQLite read interruption"); } return result; });
      return statement;
    });
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow("MAINTENANCE_COMMAND_FAILED"); expect(rejected).toBe(true); vi.restoreAllMocks();
    const stat = fs.lstat; let objectProbes = 0;
    vi.spyOn(fs, "lstat").mockImplementation(async (...args) => { if (args[0] === accepted.record.encryptedPayloadPath) objectProbes++; return stat(...args); });
    await eraseAll(f.owner, event[1]); expect(objectProbes).toBeGreaterThan(0);
  });
  it.each(["roots", "private-copy-revision", "scan-invalidation"] as const)("invalidates the private physical gate after %s changes", async mutation => {
    const f = await setup(), { event } = await acknowledgedPayload(f), verifier = verifierProbe.all.find(value => value.custody === f.owner.custody)!.verifier;
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner); await eraseAll(f.owner, event[1]);
    const run = await beginMaintenance(f.owner);
    if (mutation === "roots") { await rename(f.config.custodyRoot, `${f.config.custodyRoot}-old`); await mkdir(f.config.custodyRoot, { mode: 0o700 }); }
    if (mutation === "private-copy-revision") await f.owner.custody.abortIntake(randomUUID(), digest("f".repeat(64))).catch(() => {});
    if (mutation === "scan-invalidation") await custodyErasureOwner(f.owner.custody).invalidateAndClose(run);
    await expect(maintenance.maintenanceCommand(run, f.owner.repository, 20 + verifier.maximumItems, "filesystem", () => erasureOwner(f.owner.repository).withErasureGuard(event[1], async () => {
      const result = await verifier.verify(event[1], run); return { value: undefined, consumedItems: 20 + result.consumedItems };
    }))).rejects.toThrow();
  });
  it.each(["changed-inode", "moved", "hardlink", "restored-zero"] as const)("denies %s recovery without rearming or discarding the old binding", async mutation => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f), path = accepted.record.encryptedPayloadPath;
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    const unlink = fs.unlink; vi.spyOn(fs, "unlink").mockImplementation(async candidate => { if (candidate === path) throw new Error("interrupt before removal"); await unlink(candidate); });
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow("MAINTENANCE_COMMAND_FAILED"); vi.restoreAllMocks();
    if (mutation === "changed-inode") { await rename(path, join(f.root, "retained-original")); await copyFile(join(f.root, "retained-original"), path); }
    if (mutation === "moved") await rename(path, join(f.config.custodyRoot, `${randomUUID()}.enc`));
    if (mutation === "hardlink") await fs.link(path, join(f.root, "retained-link"));
    if (mutation === "restored-zero") f.db.prepare("UPDATE erasure_manifests SET remainingCharge=0,phase='metadata-finalized' WHERE slot='original-sealed'").run();
    const old = f.db.prepare("SELECT * FROM erasure_manifests WHERE slot='original-sealed'").get();
    const restarted = await f.restart(), db = connections.all.at(-1)!; bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    try {
      await expect(scanAll(restarted.owner)).rejects.toThrow();
      expect(db.prepare("SELECT * FROM erasure_manifests WHERE slot='original-sealed'").get()).toEqual(old);
      expect(db.prepare("SELECT payloadBytes FROM cases WHERE id=?").get(accepted.accepted.id)).toEqual({ payloadBytes: accepted.record.actualBytes });
    } finally { await settleMaintenance(restarted.owner); }
  });
  it.each(["changed-directory", "unknown-child", "growth", "zero-directory"] as const)("denies %s after child removal instead of relaxing directory identity", async mutation => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f), id = randomUUID(), path = join(f.config.runtimeRoot, id);
    await mkdir(path, { mode: 0o700 }); await writeFile(join(path, "0.data"), "native child", { mode: 0o600 });
    await writeFile(join(f.config.custodyRoot, `${id}.journal`), JSON.stringify({ version: 3, id, kind: "processing", state: "committed", path, budget: 4096, cleanupAfter: "2026-10-18T12:00:00.000Z", caseId: accepted.accepted.id }), { mode: 0o600 });
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    const rmdir = fs.rmdir; vi.spyOn(fs, "rmdir").mockImplementation(async (...args) => { if (args[0] === path) throw new Error("interrupt directory removal"); await rmdir(...args); });
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow("MAINTENANCE_COMMAND_FAILED"); vi.restoreAllMocks();
    if (mutation === "changed-directory") { await rename(path, join(f.root, "retained-directory")); await mkdir(path, { mode: 0o700 }); }
    if (mutation === "unknown-child") await writeFile(join(path, "unknown"), "untouched", { mode: 0o600 });
    if (mutation === "growth") for (let n = 0; n < 40; n++) await writeFile(join(path, `unknown-${n}`), "untouched", { mode: 0o600 });
    if (mutation === "zero-directory") f.db.prepare("UPDATE erasure_manifests SET remainingCharge=0,phase='metadata-finalized' WHERE journalId=? AND slot='processing-directory'").run(id);
    const old = f.db.prepare("SELECT * FROM erasure_manifests WHERE journalId=? AND slot='processing-directory'").get(id);
    const restarted = await f.restart(), db = connections.all.at(-1)!; bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    try { await expect(scanAll(restarted.owner)).rejects.toThrow(); expect(db.prepare("SELECT * FROM erasure_manifests WHERE journalId=? AND slot='processing-directory'").get(id)).toEqual(old); expect((await lstat(path)).isDirectory()).toBe(true); }
    finally { await settleMaintenance(restarted.owner); }
  });
  it("finishes only an admitted failed native close on the same stopped run before fresh phase admission", async () => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f);
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    const originalOpen = fs.open; let retained: FileHandle | undefined, failClose = true;
    vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      const fd = await originalOpen(...args);
      if (args[0] === accepted.record.encryptedPayloadPath) {
        retained = fd; const close = fd.close.bind(fd);
        vi.spyOn(fd, "close").mockImplementation(async () => { if (failClose) { failClose = false; throw new Error("private close canary"); } return close(); });
      }
      return fd;
    });
    let failed: MaintenanceRun | undefined;
    for (let n = 0; !failed && n < 30; n++) {
      const run = await beginMaintenance(f.owner);
      try { await custodyErasureOwner(f.owner.custody).eraseScopeBatch(event[1], run); }
      catch (error) { expect(error).toMatchObject({ message: "MAINTENANCE_COMMAND_FAILED" }); failed = run; }
      if (!failed) await settleMaintenance(f.owner);
    }
    expect(failed).toBeDefined(); expect((await retained!.stat()).size).toBe(accepted.record.actualBytes);
    const before = f.db.prepare("SELECT phase,remainingCharge FROM erasure_manifests WHERE slot='original-sealed'").get();
    await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
    const charged = maintenanceSnapshot(f.owner).consumedItems;
    expect(await finishMaintenanceAcceptedResources(failed!, f.owner.custody)).toEqual({ consumedItems: 1 });
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(charged + 1);
    expect(f.db.prepare("SELECT phase,remainingCharge FROM erasure_manifests WHERE slot='original-sealed'").get()).toEqual(before);
    await expect(retained!.stat()).rejects.toMatchObject({ code: "EBADF" });
    await expect(custodyErasureOwner(f.owner.custody).eraseScopeBatch(event[1], failed!)).rejects.toThrow("MAINTENANCE_RUN_STOPPED");
    await settleMaintenance(f.owner); vi.restoreAllMocks(); await eraseAll(f.owner, event[1]);
  });
  it.each(["unlink-after-success", "parent-fsync", "holders-released", "absent-synced", "metadata-finalized", "journal-scrub"] as const)("recovers actual %s interruption without losing the retained plan", async fault => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f);
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    let fired = false;
    const unlink = fs.unlink, open = fs.open, prepare = f.db.prepare.bind(f.db);
    if (fault === "unlink-after-success" || fault === "journal-scrub") vi.spyOn(fs, "unlink").mockImplementation(async path => {
      await unlink(path);
      if (!fired && path === (fault === "journal-scrub" ? accepted.record.encryptedPayloadPath.replace(/\.enc$/, ".journal") : accepted.record.encryptedPayloadPath)) { fired = true; throw new Error("private unlink canary"); }
    });
    else if (fault === "parent-fsync") vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      const fd = await open(...args);
      if (args[0] === f.config.custodyRoot) { const sync = fd.sync.bind(fd); vi.spyOn(fd, "sync").mockImplementation(async () => { if (!fired) { fired = true; throw new Error("private fsync canary"); } await sync(); }); }
      return fd;
    });
    else vi.spyOn(f.db, "prepare").mockImplementation(sql => {
      const statement = prepare(sql);
      if (sql.startsWith("UPDATE erasure_manifests SET phase=")) {
        const run = statement.run.bind(statement);
        vi.spyOn(statement, "run").mockImplementation((...args: unknown[]) => { if (!fired && args[0] === fault && args[4] === "original-sealed") { fired = true; throw new Error("private transaction canary"); } return run(...args); });
      }
      return statement;
    });
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow("MAINTENANCE_COMMAND_FAILED"); expect(fired).toBe(true);
    const slot = fault === "journal-scrub" ? "journal" : "original-sealed";
    const old = f.db.prepare("SELECT remainingCharge FROM erasure_manifests WHERE slot=?").get(slot) as { remainingCharge: number };
    expect(old.remainingCharge).toBeGreaterThan(0);
    vi.restoreAllMocks(); const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    try { await scanAll(restarted.owner); await eraseAll(restarted.owner, event[1]); expect(await readdir(f.config.custodyRoot)).toEqual([]); }
    finally { await settleMaintenance(restarted.owner); }
  });
  it("preserves over-budget processing residues instead of treating each leaf as an independent budget", async () => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f), id = randomUUID(), path = join(f.config.runtimeRoot, id);
    await mkdir(path, { mode: 0o700 });
    for (const leaf of ["0.data", "1.data"]) await writeFile(join(path, leaf), Buffer.alloc(3000), { mode: 0o600 });
    await writeFile(join(f.config.custodyRoot, `${id}.journal`), JSON.stringify({ version: 3, id, kind: "processing", state: "committed", path, budget: 4096, cleanupAfter: "2026-10-18T12:00:00.000Z", caseId: accepted.accepted.id }), { mode: 0o600 });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    let complete = false;
    for (let n = 0; !complete && n < 10; n++) { complete = (await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).complete; await settleMaintenance(f.owner); }
    expect(complete).toBe(true);
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow();
    expect(await readdir(path)).toEqual(["0.data", "1.data"]);
  });
  it("does not call a missing initial worker copy complete without a durable old manifest", async () => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f);
    await fs.unlink(accepted.record.encryptedPayloadPath);
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner)); await settleMaintenance(f.owner);
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow();
    expect(f.db.prepare("SELECT payloadBytes FROM cases WHERE id=?").get(accepted.accepted.id)).toEqual({ payloadBytes: accepted.record.actualBytes });
    expect((await lstat(accepted.record.encryptedPayloadPath.replace(/\.enc$/, ".journal"))).isFile()).toBe(true);
  });
  it.each(["before-rmdir", "after-rmdir"] as const)("retains the old directory charge across owned child removal and %s interruption/restart", async interruption => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f), id = randomUUID(), path = join(f.config.runtimeRoot, id);
    await mkdir(path, { mode: 0o700 }); await writeFile(join(path, "0.data"), "real child residue", { mode: 0o600 });
    await writeFile(join(f.config.custodyRoot, `${id}.journal`), JSON.stringify({ version: 3, id, kind: "processing", state: "committed", path, budget: 4096, cleanupAfter: "2026-10-18T12:00:00.000Z", caseId: accepted.accepted.id }), { mode: 0o600 });
    const initial = await lstat(path);
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    let scanned = false;
    for (let n = 0; !scanned && n < 10; n++) { scanned = (await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).complete; await settleMaintenance(f.owner); }
    expect(scanned).toBe(true);
    const rmdir = fs.rmdir, denied = vi.spyOn(fs, "rmdir").mockImplementation(async (...args) => { if (args[0] === path) { if (interruption === "after-rmdir") await rmdir(...args); throw new Error("synthetic directory interruption"); } return rmdir(...args); });
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow("MAINTENANCE_COMMAND_FAILED");
    expect(denied).toHaveBeenCalledWith(path);
    if (interruption === "before-rmdir") expect(await readdir(path)).toEqual([]); else await expect(lstat(path)).rejects.toMatchObject({ code: "ENOENT" });
    const old = f.db.prepare("SELECT * FROM erasure_manifests WHERE journalId=? AND slot='processing-directory'").get(id) as { remainingCharge: number; scanPass: string; expectedSize: number };
    expect(old).toMatchObject({ remainingCharge: initial.size, expectedSize: initial.size });
    vi.restoreAllMocks();
    const restarted = await f.restart(), db = connections.all.at(-1)!; bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    try {
      let complete = false;
      for (let n = 0; !complete && n < 20; n++) { complete = (await custodyErasureOwner(restarted.owner.custody).scanBatch(await beginMaintenance(restarted.owner))).complete; await settleMaintenance(restarted.owner); }
      expect(complete).toBe(true); await eraseAll(restarted.owner, event[1]);
      expect(db.prepare("SELECT scanPass,expectedSize,remainingCharge,phase FROM erasure_manifests WHERE journalId=? AND slot='processing-directory'").get(id)).toEqual({ scanPass: old.scanPass, expectedSize: old.expectedSize, remainingCharge: 0, phase: "metadata-finalized" });
      await expect(lstat(path)).rejects.toMatchObject({ code: "ENOENT" });
    } finally { await settleMaintenance(restarted.owner); }
  });
  it.each([false, true])("rebinds a positive same-object plan after cold reconstruction (rollback=%s)", async rollback => {
    const f = await setup(), { accepted, event } = await acknowledgedPayload(f);
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner)); await settleMaintenance(f.owner);
    const unlink = fs.unlink;
    vi.spyOn(fs, "unlink").mockImplementation(async path => { if (path === accepted.record.encryptedPayloadPath) throw new Error("synthetic unlink interruption"); return unlink(path); });
    await expect(eraseAll(f.owner, event[1])).rejects.toThrow("MAINTENANCE_COMMAND_FAILED");
    const old = f.db.prepare("SELECT * FROM erasure_manifests WHERE slot='original-sealed'").get() as { remainingCharge: number; scanPass: string };
    expect(old.remainingCharge).toBe(accepted.record.actualBytes);
    vi.restoreAllMocks();
    const restarted = await f.restart(), db = connections.all.at(-1)!;
    bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    try {
      let complete = false;
      for (let n = 0; !complete && n < 20; n++) { complete = (await custodyErasureOwner(restarted.owner.custody).scanBatch(await beginMaintenance(restarted.owner))).complete; await settleMaintenance(restarted.owner); }
      expect(complete).toBe(true);
      if (rollback) {
        const prepare = db.prepare.bind(db); let fired = false;
        vi.spyOn(db, "prepare").mockImplementation(sql => {
          const statement = prepare(sql);
          if (sql.startsWith("INSERT INTO erasure_manifests")) {
            const run = statement.run.bind(statement);
            vi.spyOn(statement, "run").mockImplementation((...args: unknown[]) => {
              const result = run(...args);
              const current = prepare("SELECT scanPass FROM erasure_manifests WHERE slot='original-sealed'").get() as { scanPass: string } | undefined;
              if (!fired && current && current.scanPass !== old.scanPass) {
                fired = true; db.pragma("defer_foreign_keys=ON");
                prepare("INSERT INTO erasure_manifests SELECT ?,scanPass,journalId,slot,leaf,expectedDevice,expectedInode,expectedSize,remainingCharge,phase FROM erasure_manifests WHERE slot='original-sealed'").run("f".repeat(32));
              }
              return result;
            });
          }
          return statement;
        });
        await expect(eraseAll(restarted.owner, event[1])).rejects.toThrow("MAINTENANCE_COMMAND_FAILED"); expect(fired).toBe(true);
        expect(db.prepare("SELECT * FROM erasure_manifests WHERE slot='original-sealed'").get()).toEqual(old);
        expect((await lstat(accepted.record.encryptedPayloadPath)).size).toBe(accepted.record.actualBytes);
        vi.restoreAllMocks();
      }
      await eraseAll(restarted.owner, event[1]);
      const current = db.prepare("SELECT scanPass,phase,remainingCharge FROM erasure_manifests WHERE slot='original-sealed'").get() as { scanPass: string };
      expect(current.scanPass).not.toBe(old.scanPass);
      expect(current).toMatchObject({ phase: "metadata-finalized", remainingCharge: 0 });
      await expect(lstat(accepted.record.encryptedPayloadPath)).rejects.toMatchObject({ code: "ENOENT" });
    } finally { await settleMaintenance(restarted.owner); }
  });
  it("reinspects every finalized absent manifest after cold reconstruction and journal scrub", async () => {
    const f = await setup(), { event } = await acknowledgedPayload(f);
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    expect((await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).complete).toBe(true);
    await settleMaintenance(f.owner); await eraseAll(f.owner, event[1]);
    expect(await readdir(f.config.custodyRoot)).toEqual([]);
    const oldPass = (f.db.prepare("SELECT scanPass FROM erasure_maintenance").get() as { scanPass: string }).scanPass;
    const restarted = await f.restart(), db = connections.all.at(-1)!;
    bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    try {
      let complete = false;
      for (let n = 0; !complete && n < 20; n++) { complete = (await custodyErasureOwner(restarted.owner.custody).scanBatch(await beginMaintenance(restarted.owner))).complete; await settleMaintenance(restarted.owner); }
      expect(complete).toBe(true);
      const current = (db.prepare("SELECT scanPass FROM erasure_maintenance").get() as { scanPass: string }).scanPass;
      expect(current).not.toBe(oldPass);
      expect(db.prepare("SELECT count(*) n FROM erasure_inventory_objects WHERE pass=? AND presence='absent'").get(current)).toEqual({ n: 3 });
      await eraseAll(restarted.owner, event[1]);
    } finally { await settleMaintenance(restarted.owner); }
  });
  it("observes the exact incoming generation even when a retained native handle has no pathname", async () => {
    const f = await setup(), first = await f.accept();
    const original = f.db.prepare("SELECT * FROM cases WHERE id=?").get(first.accepted.id) as Record<string, unknown>;
    const reservation = f.db.prepare("SELECT * FROM reservations WHERE id=?").get(original.reservationId) as Record<string, unknown>;
    const journal = JSON.parse(await readFile(join(f.config.custodyRoot, `${original.reservationId}.journal`), "utf8"));
    const id = randomUUID(), reservationId = randomUUID(), sessionHash = "b".repeat(64), path = join(f.config.custodyRoot, `${reservationId}.enc`);
    const r = { ...reservation, id: reservationId, sessionHash }, c = { ...original, id, reference: "hidden-synthetic", reservationId, sessionHash, encryptedPayloadPath: path };
    for (const [table, value] of [["reservations", r], ["cases", c]] as const) f.db.prepare(`INSERT INTO ${table}(${Object.keys(value).join(",")}) VALUES(${Object.keys(value).map(key => `@${key}`).join(",")})`).run(value);
    const lifecycle = { ...f.db.prepare("SELECT * FROM case_lifecycle WHERE caseId=?").get(first.accepted.id) as Record<string, unknown>, caseId: id };
    f.db.prepare(`INSERT INTO case_lifecycle(${Object.keys(lifecycle).join(",")}) VALUES(${Object.keys(lifecycle).map(key => `@${key}`).join(",")})`).run(lifecycle);
    const delivery = { ...f.db.prepare("SELECT * FROM deliveries WHERE caseId=?").get(first.accepted.id) as Record<string, unknown>, caseId: id };
    f.db.prepare(`INSERT INTO deliveries(${Object.keys(delivery).join(",")}) VALUES(${Object.keys(delivery).map(key => `@${key}`).join(",")})`).run(delivery);
    const lease = await f.authority.prepare(reservationId, join(f.config.intakeRoot, `${reservationId}.enc`), 10000);
    await f.authority.grant(lease);
    await writeFile(lease.path, "hidden-native-bytes", { mode: 0o640 });
    const handle = await f.authority.retain(reservationId);
    try {
      await fs.unlink(lease.path); await copyFile(first.record.encryptedPayloadPath, path);
      await writeFile(join(f.config.custodyRoot, `${reservationId}.journal`), JSON.stringify({ ...journal, id: reservationId, caseId: id, path: lease.path, workerPath: path, lease, release: "pending", reservation: { ...journal.reservation, id: reservationId, sessionHash } }), { mode: 0o600 });
      f.advance(7 * 86400000); await refreshTestRepository(f.owner.repository);
      const erasure = erasureOwner(f.owner.repository), event = await f.owner.repository.withCaseLock(applicationId(id), async () => {
        const proposed = erasure.prepareCommit(applicationId(id), "processing_payload"); erasure.acknowledge(proposed, await erasure.journal!.append(proposed)); return proposed;
      });
      bindMaintenance(f.owner, f.services, f.monotonicNow);
      let complete = false;
      for (let n = 0; !complete && n < 10; n++) { complete = (await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).complete; await settleMaintenance(f.owner); }
      expect(complete).toBe(true);
      expect(f.db.prepare("SELECT presence,chargedBytes,leaseState,device,inode FROM erasure_inventory_objects WHERE journalId=? AND slot='incoming-sealed'").get(reservationId)).toEqual({ presence: "absent", chargedBytes: 19, leaseState: "bounded", device: null, inode: null });
      expect((await handle.stat()).size).toBe(19);
      let failed: MaintenanceRun | undefined;
      for (let n = 0; !failed && n < 30; n++) {
        const run = await beginMaintenance(f.owner);
        try { await custodyErasureOwner(f.owner.custody).eraseScopeBatch(event[1], run); }
        catch (error) { expect(error).toMatchObject({ message: "INGRESS_RECOVERY_REQUIRED" }); failed = run; }
        if (!failed) await settleMaintenance(f.owner);
      }
      expect(failed).toBeDefined();
      expect(f.db.prepare("SELECT phase,remainingCharge FROM erasure_manifests WHERE journalId=? AND slot='incoming-sealed'").get(reservationId)).toEqual({ phase: "planned", remainingCharge: 19 });
      await expect(finishMaintenanceAcceptedResources(failed!, f.owner.custody)).rejects.toThrow("MAINTENANCE_COMMAND_FAILED");
      expect((await handle.stat()).size).toBe(19); await handle.close();
      expect(await finishMaintenanceAcceptedResources(failed!, f.owner.custody)).toEqual({ consumedItems: 2 });
      expect(f.db.prepare("SELECT remainingCharge FROM erasure_manifests WHERE journalId=? AND slot='incoming-sealed'").get(reservationId)).toEqual({ remainingCharge: 19 });
      await settleMaintenance(f.owner); await eraseAll(f.owner, event[1]);
      expect(f.db.prepare("SELECT phase,remainingCharge FROM erasure_manifests WHERE journalId=? AND slot='incoming-sealed'").get(reservationId)).toEqual({ phase: "metadata-finalized", remainingCharge: 0 });
    } finally { await handle.close(); }
  });
  it("unlinks the acknowledged case's physical bytes while retaining identifying row teardown for 1c", async () => {
    const f = await setup(), accepted = await f.accept(), original = accepted.record.encryptedPayloadPath;
    f.advance(7 * 86400000); await refreshTestRepository(f.owner.repository);
    const erasure = erasureOwner(f.owner.repository);
    const event = await f.owner.repository.withCaseLock(accepted.accepted.id, async () => {
      const proposed = erasure.prepareCommit(accepted.accepted.id, "processing_payload");
      erasure.acknowledge(proposed, await erasure.journal!.append(proposed)); return proposed;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    let run = await beginMaintenance(f.owner);
    expect((await custodyErasureOwner(f.owner.custody).scanBatch(run)).complete).toBe(true);
    let complete = false;
    for (let attempt = 0; !complete && attempt < 30; attempt++) {
      const result = await custodyErasureOwner(f.owner.custody).eraseScopeBatch(event[1], run);
      complete = result.complete;
      await settleMaintenance(f.owner);
      if (!complete) run = await beginMaintenance(f.owner);
    }
    expect(complete).toBe(true);
    await expect(lstat(original)).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readdir(f.config.custodyRoot)).toEqual([]);
    expect(f.db.prepare("SELECT phase,remainingCharge FROM erasure_manifests").all()).not.toHaveLength(0);
    expect(f.db.prepare("SELECT 1 FROM erasure_manifests WHERE phase!='metadata-finalized' OR remainingCharge!=0").get()).toBeUndefined();
    expect(f.db.prepare("SELECT payloadBytes FROM cases WHERE id=?").get(accepted.accepted.id)).toEqual({ payloadBytes: accepted.record.actualBytes });
  });
  it.each([
    { partial: false, failure: "deadline" }, { partial: true, failure: "deadline" },
    { partial: false, failure: "hold" }, { partial: true, failure: "hold" },
  ])("revokes previously admitted coverage on an outer $failure failure (partial=$partial)", async ({ partial, failure }) => {
    const f = await setup(), originalOpen = fs.opendir, opened: Dir[] = [];
    if (partial) {
      await f.accept(); const name = (await readdir(f.config.custodyRoot)).find(name => name.endsWith(".journal"))!;
      for (let n = 0; n < 40; n++) await copyFile(join(f.config.custodyRoot, name), join(f.config.custodyRoot, `${name}.${randomUUID()}.tmp`));
    }
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => { const dir = await originalOpen(...args); opened.push(dir); return dir; });
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner), scanner = custodyErasureOwner(f.owner.custody);
    expect((await scanner.scanBatch(run)).complete).toBe(!partial);
    expect((f.db.prepare("SELECT count(*) n FROM erasure_scans").get() as { n: number }).n).toBeGreaterThan(0);
    const charged = maintenanceSnapshot(f.owner).consumedItems;
    if (failure === "deadline") f.advance(120001); else f.loseHold();
    await expect(scanner.scanBatch(run)).rejects.toThrow(failure === "deadline" ? "MAINTENANCE_DEADLINE" : "MAINTENANCE_HOLD_LOST");
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state!='blocked'").get()).toEqual({ n: 0 });
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(charged);
    for (const dir of opened) await expect(dir.read()).rejects.toMatchObject({ code: "ERR_DIR_CLOSED" });
    if (failure === "deadline") {
      await settleMaintenance(f.owner);
      await expect(scanner.scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("ERASURE_ROOT_CHANGED");
    } else {
      await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
      expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
    }
  });
  it.each(["loop", "before-command"] as const)("revokes admitted coverage when deadline expires at the %s admission boundary", async boundary => {
    const f = await setup(); bindMaintenance(f.owner, f.services, f.monotonicNow);
    const run = await beginMaintenance(f.owner); let calls = 0;
    if (boundary === "loop") {
      const remaining = maintenance.maintenanceRemaining;
      vi.spyOn(maintenance, "maintenanceRemaining").mockImplementation((...args) => {
        if (++calls === 5) f.advance(120001);
        return remaining(...args);
      });
    } else {
      const command = maintenance.maintenanceCommand;
      vi.spyOn(maintenance, "maintenanceCommand").mockImplementation((...args) => {
        if (++calls === 4) f.advance(120001);
        return command(...args);
      });
    }
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(run)).rejects.toThrow("MAINTENANCE_DEADLINE");
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state!='blocked'").get()).toEqual({ n: 0 });
    await settleMaintenance(f.owner);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("ERASURE_ROOT_CHANGED");
  });
  it.each(["scanBatch", "invalidateAndClose"] as const)("does not invalidate a truly untouched scanner when its first %s expires before admission", async operation => {
    const f = await setup(); bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner);
    f.advance(120001);
    await expect(custodyErasureOwner(f.owner.custody)[operation](run)).rejects.toThrow("MAINTENANCE_DEADLINE");
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(0);
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans").get()).toEqual({ n: 0 });
    await settleMaintenance(f.owner);
    expect((await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).complete).toBe(true);
  });
  it.each([false, true])("spends the originating run's retained finishing reservation across dormant settlement (partial=%s)", async partial => {
    const f = await setup();
    if (partial) {
      await f.accept(); const name = (await readdir(f.config.custodyRoot)).find(name => name.endsWith(".journal"))!;
      for (let n = 0; n < 40; n++) await copyFile(join(f.config.custodyRoot, name), join(f.config.custodyRoot, `${name}.${randomUUID()}.tmp`));
    }
    bindMaintenance(f.owner, f.services, f.monotonicNow); const first = await beginMaintenance(f.owner), scanner = custodyErasureOwner(f.owner.custody);
    const result = await scanner.scanBatch(first);
    expect(result.complete).toBe(!partial);
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(result.consumedItems);
    expect(result.consumedItems).toBeGreaterThanOrEqual(7);
    await settleMaintenance(f.owner); const next = await beginMaintenance(f.owner);
    f.advance(120001);
    await expect(scanner.scanBatch(next)).rejects.toThrow("MAINTENANCE_DEADLINE");
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(0); // Paid by first, not a new allowance.
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state!='blocked'").get()).toEqual({ n: 0 });
    await settleMaintenance(f.owner);
    await expect(scanner.scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("ERASURE_ROOT_CHANGED");
  });
  it.each(["scanBatch", "invalidateAndClose"] as const)("does not let forged, stale or foreign runs spend another scanner's outstanding reservation through %s", async operation => {
    const f = await setup(), other = await setup();
    bindMaintenance(f.owner, f.services, f.monotonicNow); bindMaintenance(other.owner, other.services, other.monotonicNow);
    const first = await beginMaintenance(f.owner), foreign = await beginMaintenance(other.owner), scanner = custodyErasureOwner(f.owner.custody);
    expect((await scanner.scanBatch(first)).complete).toBe(true);
    await settleMaintenance(f.owner); const next = await beginMaintenance(f.owner);
    for (const invalid of [Object.freeze({}) as MaintenanceRun, first, foreign]) await expect(scanner[operation](invalid)).rejects.toThrow("MAINTENANCE_RUN_INVALID");
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state='complete'").get()).toEqual({ n: 3 });
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(0);
    f.advance(120001); await expect(scanner.scanBatch(next)).rejects.toThrow("MAINTENANCE_DEADLINE");
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state='blocked'").get()).toEqual({ n: 3 });
  });
  it.each(["scanBatch", "invalidateAndClose"] as const)("uses exactly three denial writes and two retained closes once at the exhausted 1000-credit %s boundary", async operation => {
    const f = await setup(), first = await f.accept(), id = randomUUID(), path = join(f.config.runtimeRoot, id), live = new Set<Dir>();
    await mkdir(path, { mode: 0o700 });
    for (let n = 0; n < 5; n++) await writeFile(join(path, `${n}.data`), "x", { mode: 0o600 });
    for (let n = 1; n <= 5; n++) for (const ext of ["pdf", "jpg", "png"]) await writeFile(join(path, `document-${n}.${ext}`), "x", { mode: 0o600 });
    await writeFile(join(f.config.custodyRoot, `${id}.journal`), JSON.stringify({ version: 3, id, kind: "processing", state: "committed", path, budget: 4096, cleanupAfter: "2026-10-11T12:00:00.000Z", caseId: first.accepted.id }), { mode: 0o600 });
    const originalOpen = fs.opendir; let closes = 0;
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => {
      const dir = await originalOpen(...args), close = dir.close.bind(dir); live.add(dir);
      dir.close = async () => { closes++; await close(); live.delete(dir); }; return dir;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow); let run = await beginMaintenance(f.owner);
    const scanner = custodyErasureOwner(f.owner.custody);
    for (let n = 0; n < 6; n++) {
      expect((await scanner.scanBatch(run)).complete).toBe(false);
      if (live.size === 2) break;
      await settleMaintenance(f.owner); run = await beginMaintenance(f.owner);
    }
    expect(live.size).toBe(2); const retained = [...live];
    const remaining = maintenance.maintenanceRemaining(run, f.owner.repository).items;
    // Actual fixed no-row writes consume every remaining credit, not a mocked allowance.
    await maintenance.maintenanceCommand(run, f.owner.repository, remaining, "scalar", () => {
      for (let n = 0; n < remaining; n++) f.db.prepare("UPDATE erasure_scans SET itemCount=itemCount WHERE 0").run();
      return { value: undefined, consumedItems: remaining };
    });
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(1000);
    const prepare = f.db.prepare.bind(f.db), writes: unknown[][] = []; const beforeCloses = closes;
    vi.spyOn(f.db, "prepare").mockImplementation(sql => {
      const statement = prepare(sql);
      if (sql.startsWith("UPDATE erasure_scans SET state='blocked'")) {
        const execute = statement.run.bind(statement);
        statement.run = (...args: unknown[]) => { writes.push(args); return execute(...args); };
      }
      return statement;
    });
    f.advance(120001); await expect(scanner[operation](run)).rejects.toThrow("MAINTENANCE_DEADLINE");
    expect(writes.map(args => args[1])).toEqual(["custody", "incoming", "runtime"]);
    expect(closes - beforeCloses).toBe(2); expect(live.size).toBe(0);
    for (const dir of retained) await expect(dir.read()).rejects.toMatchObject({ code: "ERR_DIR_CLOSED" });
    await expect(scanner[operation](run)).rejects.toThrow(operation === "scanBatch" ? "MAINTENANCE_RUN_STOPPED" : "MAINTENANCE_BUDGET_INSUFFICIENT");
    expect(writes).toHaveLength(3); expect(closes - beforeCloses).toBe(2);
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(1000);
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state!='blocked'").get()).toEqual({ n: 0 });
  });
  it("charges seven on actual pass admission even before any root opens", async () => {
    const f = await setup(); bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner);
    for (let n = 0; n < 20; n++) selectMaintenance(run, f.owner.repository, `occupied:${n}`);
    expect(await custodyErasureOwner(f.owner.custody).scanBatch(run)).toEqual({ complete: false, consumedItems: 7 });
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(7);
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans").get()).toEqual({ n: 0 });
  });
  it.each([
    { partial: false, failure: "deadline" }, { partial: true, failure: "deadline" },
    { partial: false, failure: "hold" }, { partial: true, failure: "hold" },
  ])("revokes coverage on cleanup-boundary $failure loss (partial=$partial)", async ({ partial, failure }) => {
    const f = await setup(), originalOpen = fs.opendir, opened: Dir[] = [];
    if (partial) {
      await f.accept(); const name = (await readdir(f.config.custodyRoot)).find(name => name.endsWith(".journal"))!;
      for (let n = 0; n < 40; n++) await copyFile(join(f.config.custodyRoot, name), join(f.config.custodyRoot, `${name}.${randomUUID()}.tmp`));
    }
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => { const dir = await originalOpen(...args); opened.push(dir); return dir; });
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner), scanner = custodyErasureOwner(f.owner.custody);
    expect((await scanner.scanBatch(run)).complete).toBe(!partial);
    const charged = maintenanceSnapshot(f.owner).consumedItems;
    if (failure === "deadline") f.advance(120001); else f.loseHold();
    await expect(scanner.invalidateAndClose(run)).rejects.toThrow(failure === "deadline" ? "MAINTENANCE_DEADLINE" : "MAINTENANCE_HOLD_LOST");
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state!='blocked'").get()).toEqual({ n: 0 });
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(charged);
    for (const dir of opened) await expect(dir.read()).rejects.toMatchObject({ code: "ERR_DIR_CLOSED" });
    if (failure === "deadline") {
      await settleMaintenance(f.owner);
      await expect(scanner.scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("ERASURE_ROOT_CHANGED");
    } else {
      await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
      expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
    }
  });
  it("tracks the whole cleanup-boundary finishing close through concurrent settlement", async () => {
    const f = await setup(); await f.accept(); const name = (await readdir(f.config.custodyRoot)).find(name => name.endsWith(".journal"))!;
    for (let n = 0; n < 40; n++) await copyFile(join(f.config.custodyRoot, name), join(f.config.custodyRoot, `${name}.${randomUUID()}.tmp`));
    const originalOpen = fs.opendir, closing = deferred(), release = deferred();
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => {
      const dir = await originalOpen(...args), close = dir.close.bind(dir);
      dir.close = async () => { closing.resolve(); await release.promise; await close(); }; return dir;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner), scanner = custodyErasureOwner(f.owner.custody);
    expect((await scanner.scanBatch(run)).complete).toBe(false);
    const charged = maintenanceSnapshot(f.owner).consumedItems;
    f.advance(120001); const cleanup = scanner.invalidateAndClose(run).catch(error => error);
    await closing.promise; let settled = false;
    const settling = settleMaintenance(f.owner).then(() => { settled = true; });
    await Promise.resolve(); expect(settled).toBe(false);
    expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
    expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
    release.resolve(); expect((await cleanup).message).toBe("MAINTENANCE_DEADLINE"); await settling;
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(charged);
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state!='blocked'").get()).toEqual({ n: 0 });
    expect(() => f.owner.repository.close()).not.toThrow();
  });
  it.each(["scanBatch", "invalidateAndClose"] as const)("retains an outer-failure native close error from %s without spending again until charged R105 retry", async operation => {
    const f = await setup(); await f.accept(); const name = (await readdir(f.config.custodyRoot)).find(name => name.endsWith(".journal"))!;
    for (let n = 0; n < 40; n++) await copyFile(join(f.config.custodyRoot, name), join(f.config.custodyRoot, `${name}.${randomUUID()}.tmp`));
    const originalOpen = fs.opendir; let failClose = true, attempts = 0;
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => {
      const dir = await originalOpen(...args), close = dir.close.bind(dir);
      dir.close = async () => { attempts++; if (failClose) throw new Error("synthetic-close-failure"); await close(); }; return dir;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner), scanner = custodyErasureOwner(f.owner.custody);
    expect((await scanner.scanBatch(run)).complete).toBe(false); const before = maintenanceSnapshot(f.owner).consumedItems;
    f.advance(120001); await expect(scanner[operation](run)).rejects.toThrow("MAINTENANCE_DEADLINE");
    expect(attempts).toBe(1);
    await expect(scanner.scanBatch(run)).rejects.toThrow("MAINTENANCE_RUN_STOPPED");
    expect(attempts).toBe(1); expect(maintenanceSnapshot(f.owner).consumedItems).toBe(before);
    await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
    expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
    failClose = false;
    expect(await scanner.invalidateAndClose(run)).toEqual({ consumedItems: 1 });
    expect(attempts).toBe(2); expect(maintenanceSnapshot(f.owner).consumedItems).toBe(before + 1);
    await settleMaintenance(f.owner);
    await expect(scanner.scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("ERASURE_ROOT_CHANGED");
  });
  it("does not admit another step after a concurrent outer failure revokes coverage", async () => {
    const f = await setup(), originalOpen = fs.opendir, reading = deferred(), release = deferred();
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => {
      const dir = await originalOpen(...args), read = dir.read.bind(dir);
      dir.read = async () => { reading.resolve(); await release.promise; return read(); }; return dir;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner), scanner = custodyErasureOwner(f.owner.custody);
    const active = scanner.scanBatch(run).catch(error => error);
    await reading.promise;
    const outer = scanner.scanBatch(run).catch(error => error);
    const command = vi.spyOn(maintenance, "maintenanceCommand");
    release.resolve();
    expect((await outer).message).toBe("MAINTENANCE_WORK_ACTIVE");
    expect((await active).message).toBe("ERASURE_ROOT_CHANGED");
    expect(command).not.toHaveBeenCalled();
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state!='blocked'").get()).toEqual({ n: 0 });
  });
  it("keeps ancestor inode validation without mistaking an unrelated sibling directory for root replacement", async () => {
    const f = await setup(), before = await lstat(f.root), originalOpen = fs.opendir; let changed = false;
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => {
      const dir = await originalOpen(...args), read = dir.read.bind(dir);
      dir.read = async () => { if (!changed) { changed = true; await mkdir(join(f.root, "unrelated-sibling")); } return read(); }; return dir;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    const scan = await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner));
    expect((await lstat(f.root)).ino).toBe(before.ino);
    expect(scan.complete).toBe(true);
  });
  it("keeps late native iterator close owned through concurrent settlement and the report deadline", async () => {
    const f = await setup(), originalOpen = fs.opendir, closing = deferred(), release = deferred();
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => {
      const dir = await originalOpen(...args), close = dir.close.bind(dir);
      dir.close = async () => { closing.resolve(); await release.promise; await close(); }; return dir;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner);
    const scan = custodyErasureOwner(f.owner.custody).scanBatch(run).catch(error => error);
    await closing.promise; f.advance(120001); const settling = settleMaintenance(f.owner);
    expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
    expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
    release.resolve(); expect((await scan).message).toBe("MAINTENANCE_RUN_STOPPED"); await settling;
    expect(f.db.prepare("SELECT state FROM erasure_scans").all()).toEqual([{ state: "blocked" }]);
    expect(() => f.owner.repository.close()).not.toThrow();
  });
  it("blocks an actual incoming root owned by a different UID than the captured authority configuration", async () => {
    const f = await setup("cold-maintenance"); await fs.chmod(f.config.intakeRoot, 0o2770);
    const custody = createCustodyLedger(f.owner.repository, { ...f.config, intakeUid: process.getuid!() + 1, ingressAuthority: f.authority });
    const owner: WorkerOwner = Object.freeze({ ...f.owner, custody }), handle = Object.freeze({}); let held = false;
    bindMaintenance(owner, { ...f.services,
      async holdMaintenance(candidate) { if (candidate !== owner || held) throw new Error("LOCAL_HOLD_INVALID"); held = true; return handle; },
      assertMaintenanceHeld(candidate, actual) { if (candidate !== owner || actual !== handle || !held) throw new Error("LOCAL_HOLD_INVALID"); },
    }, f.monotonicNow);
    await expect(custodyErasureOwner(custody).scanBatch(await beginMaintenance(owner))).rejects.toThrow(/^MAINTENANCE_COMMAND_FAILED$/);
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans").get()).toEqual({ n: 0 });
    await settleMaintenance(owner); expect(() => owner.repository.close()).not.toThrow();
  });
  it("does not treat an absent journal as accepted-object recovery authority", async () => {
    const f = await setup(), first = await f.accept();
    const journal = (await readdir(f.config.custodyRoot)).find(name => name.endsWith(".journal"))!;
    await fs.unlink(join(f.config.custodyRoot, journal));
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow(/^MAINTENANCE_COMMAND_FAILED$/);
    expect((await lstat(first.record.encryptedPayloadPath)).isFile()).toBe(true);
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state='complete'").get()).toEqual({ n: 0 });
  });
  it("revokes EOF coverage when the shared command's final held assertion fails after its action returns", async () => {
    const f = await setup(), assertHeld = f.services.assertMaintenanceHeld!;
    let records = 0, finalAssertions = 0;
    observationProbe.record = () => { records++; };
    f.services.assertMaintenanceHeld = function(owner, handle) {
      if (records === 6 && ++finalAssertions === 3) f.loseHold();
      return assertHeld.call(this, owner, handle);
    };
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("MAINTENANCE_HOLD_LOST");
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state='complete'").get()).toEqual({ n: 0 });
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state='blocked'").get()).toEqual({ n: 3 });
    expect(maintenanceSnapshot(f.owner).consumedItems).toBeLessThanOrEqual(1000);
  });
  it("does not capture a symlink swapped in after the initial private-root validation", async () => {
    const f = await setup(), originalStat = fs.lstat; let calls = 0;
    vi.spyOn(fs, "lstat").mockImplementation((async (...args: Parameters<typeof fs.lstat>) => {
      if (args[0] === f.config.custodyRoot && ++calls === 2) {
        await rename(f.config.custodyRoot, `${f.config.custodyRoot}-old`);
        await fs.symlink(`${f.config.custodyRoot}-old`, f.config.custodyRoot);
      }
      return originalStat(...args);
    }) as typeof fs.lstat);
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("ERASURE_ROOT_CHANGED");
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state='complete'").get()).toEqual({ n: 0 });
  });
  it("validates cold roots independently and rejects overlapping captured root configuration", async () => {
    const f = await setup("cold-maintenance");
    const custody = createCustodyLedger(f.owner.repository, { ...f.config, runtimeRoot: f.config.custodyRoot, ingressAuthority: f.authority });
    const owner: WorkerOwner = Object.freeze({ ...f.owner, custody }), handle = Object.freeze({}); let held = false;
    bindMaintenance(owner, { ...f.services,
      async holdMaintenance(candidate) { if (candidate !== owner || held) throw new Error("LOCAL_HOLD_INVALID"); held = true; return handle; },
      assertMaintenanceHeld(candidate, actual) { if (candidate !== owner || actual !== handle || !held) throw new Error("LOCAL_HOLD_INVALID"); },
    }, f.monotonicNow);
    await expect(custodyErasureOwner(custody).scanBatch(await beginMaintenance(owner))).rejects.toThrow("ERASURE_ROOT_CHANGED");
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans").get()).toEqual({ n: 0 });
    await settleMaintenance(owner); expect(() => owner.repository.close()).not.toThrow();
  });
  it.each([80000, 80001])("retains the 40000ms physical reserve after %ims already elapsed", async elapsed => {
    const f = await setup(); bindMaintenance(f.owner, f.services, f.monotonicNow);
    const run = await beginMaintenance(f.owner); f.advance(elapsed);
    const scan = custodyErasureOwner(f.owner.custody).scanBatch(run);
    if (elapsed === 80000) expect((await scan).complete).toBe(true);
    else { await expect(scan).rejects.toThrow("MAINTENANCE_DEADLINE"); expect(f.db.prepare("SELECT count(*) n FROM erasure_scans").get()).toEqual({ n: 0 }); }
  });
  it("does not reset its deadline after waiting for original owner settlement", async () => {
    const f = await setup(), entered = deferred(), release = deferred();
    f.services.settle = async () => { entered.resolve(); await release.promise; };
    bindMaintenance(f.owner, f.services, f.monotonicNow); const starting = beginMaintenance(f.owner);
    await entered.promise; f.advance(120001); release.resolve(); const run = await starting;
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(run)).rejects.toThrow("MAINTENANCE_DEADLINE");
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(0);
  });
  it("records denial and closes actual iterators when held exclusion is lost during native read", async () => {
    const f = await setup(), originalOpen = fs.opendir; let retained: Dir | undefined;
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => {
      const dir = await originalOpen(...args), read = dir.read.bind(dir); retained = dir;
      dir.read = async () => { const result = await read(); f.loseHold(); return result; }; return dir;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("MAINTENANCE_HOLD_LOST");
    expect(f.db.prepare("SELECT state FROM erasure_scans").all()).toEqual([{ state: "blocked" }]);
    await expect(retained!.read()).rejects.toMatchObject({ code: "ERR_DIR_CLOSED" });
    await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
  });
  it("rejects the local-only ingress authority outside its original test environment", async () => {
    const f = await setup(); await f.accept(); bindMaintenance(f.owner, f.services, f.monotonicNow);
    await fs.chmod(f.config.intakeRoot, 0o2770);
    const run = await beginMaintenance(f.owner), environment = process.env.NODE_ENV;
    try {
      vi.stubEnv("NODE_ENV", "production");
      await expect(custodyErasureOwner(f.owner.custody).scanBatch(run)).rejects.toThrow("INGRESS_RECOVERY_REQUIRED");
    } finally { vi.stubEnv("NODE_ENV", environment); }
  });
  it("detects a journal modified in place during its bounded native read", async () => {
    const f = await setup(); await f.accept(); const originalOpen = fs.open;
    vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      const handle = await originalOpen(...args);
      if (String(args[0]).endsWith(".journal")) {
        const read = handle.read.bind(handle);
        handle.read = (async (...params: Parameters<typeof handle.read>) => {
          const result = await read(...params); await fs.utimes(args[0], new Date(0), new Date(0)); return result;
        }) as typeof handle.read;
      }
      return handle;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("ERASURE_JOURNAL_INVALID");
  });
  it("requires indexed point searches for every actual source and inventory validation query", async () => {
    const f = await setup(), first = await f.accept(), artifact = randomUUID();
    const path = join(f.config.custodyRoot, `${artifact}.bundle.staging`);
    await writeFile(path, "synthetic", { mode: 0o600 });
    await writeFile(join(f.config.custodyRoot, `${artifact}.journal`), JSON.stringify({ version: 3, id: artifact, kind: "artifact", artifactKind: "bundle", state: "reserved", path, workerPath: join(f.config.custodyRoot, `${artifact}.bundle.enc`), budget: 4096, cleanupAfter: "2026-10-11T12:00:00.000Z", caseId: first.accepted.id }), { mode: 0o600 });
    const prepare = f.db.prepare.bind(f.db);
    const plans = new Map<string, string[]>();
    vi.spyOn(f.db, "prepare").mockImplementation(sql => {
      const statement = prepare(sql);
      return new Proxy(statement, { get(target, property) {
        const method = Reflect.get(target, property);
        if (typeof method !== "function") return method;
        return (...args: unknown[]) => {
          if ((property === "get" || property === "run") && /^(SELECT|UPDATE) /.test(sql)) {
            const rows = prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as { detail: string }[];
            plans.set(sql, rows.map(row => row.detail));
          }
          return method.apply(target, args);
        };
      } });
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    expect((await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).complete).toBe(true);
    await settleMaintenance(f.owner);
    await custodyErasureOwner(f.owner.custody).invalidateAndClose(await beginMaintenance(f.owner));
    expect(plans.size).toBeGreaterThanOrEqual(11);
    for (const plan of plans.values()) { expect(plan.some(detail => detail.includes("SEARCH"))).toBe(true); expect(plan.some(detail => /SCAN|TEMP B-TREE/.test(detail))).toBe(false); }
  });
  it("rejects an authentic but unconsumed observation after its original run has ended", async () => {
    const f = await setup(); let captured: CustodyObservation | undefined;
    observationProbe.record = token => { captured = token; throw new Error("private-storage-canary"); };
    bindMaintenance(f.owner, f.services, f.monotonicNow); const oldRun = await beginMaintenance(f.owner);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(oldRun)).rejects.toThrow(/^MAINTENANCE_COMMAND_FAILED$/);
    await settleMaintenance(f.owner); await beginMaintenance(f.owner);
    expect(() => consumeCustodyObservation(captured!, f.owner.custody, oldRun)).toThrow("ERASURE_OBSERVATION_INVALID");
  });
  it("rejects cross-owner and cross-run genuine observations before their one successful fixed write, then rejects reuse", async () => {
    const f = await setup(), other = await setup(); let captured: CustodyObservation | undefined;
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner);
    bindMaintenance(other.owner, other.services, other.monotonicNow); const otherRun = await beginMaintenance(other.owner);
    observationProbe.record = (token, issuedRun, custody) => {
      captured = token;
      expect(() => consumeCustodyObservation(token, other.owner.custody, issuedRun)).toThrow("ERASURE_OBSERVATION_INVALID");
      expect(() => consumeCustodyObservation(token, custody, otherRun)).toThrow("ERASURE_OBSERVATION_INVALID");
    };
    expect((await custodyErasureOwner(f.owner.custody).scanBatch(run)).complete).toBe(true);
    expect(() => consumeCustodyObservation(captured!, f.owner.custody, run)).toThrow("ERASURE_OBSERVATION_INVALID");
  });
  it.each([4096, 4097])("enforces the actual %i-byte journal boundary", async bytes => {
    const f = await setup(); await f.accept();
    const path = join(f.config.custodyRoot, (await readdir(f.config.custodyRoot)).find(name => name.endsWith(".journal"))!);
    const original = await readFile(path); await writeFile(path, Buffer.concat([original, Buffer.alloc(bytes - original.length, 32)]));
    expect((await lstat(path)).size).toBe(bytes);
    bindMaintenance(f.owner, f.services, f.monotonicNow); const scan = custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner));
    if (bytes === 4096) expect((await scan).complete).toBe(true);
    else await expect(scan).rejects.toThrow("ERASURE_JOURNAL_INVALID");
  });
  it.each(["symlink", "hardlink", "type", "mode"] as const)("rejects actual %s changes to a known payload", async change => {
    const f = await setup(), first = await f.accept(), path = first.record.encryptedPayloadPath;
    if (change === "hardlink") await fs.link(path, join(f.root, "outside-hardlink"));
    else if (change === "mode") await fs.chmod(path, 0o644);
    else { await rename(path, join(f.root, "old-payload")); if (change === "symlink") await fs.symlink(join(f.root, "old-payload"), path); else await mkdir(path, { mode: 0o700 }); }
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow();
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state='complete'").get()).toEqual({ n: 0 });
    expect(await lstat(path)).toBeDefined();
  });
  it.each([20, 21])("checks all %i actual processing leaves without exceeding the recognized twenty-leaf set", async count => {
    const f = await setup(), first = await f.accept(), id = randomUUID(), path = join(f.config.runtimeRoot, id);
    await mkdir(path, { mode: 0o700 });
    for (let n = 0; n < 5; n++) await writeFile(join(path, `${n}.data`), "x", { mode: 0o600 });
    for (let n = 1; n <= 5; n++) for (const ext of ["pdf", "jpg", "png"]) await writeFile(join(path, `document-${n}.${ext}`), "x", { mode: 0o600 });
    if (count === 21) await writeFile(join(path, "document-6.pdf"), "x", { mode: 0o600 });
    await writeFile(join(f.config.custodyRoot, `${id}.journal`), JSON.stringify({ version: 3, id, kind: "processing", state: "committed", path, budget: 4096, cleanupAfter: "2026-10-11T12:00:00.000Z", caseId: first.accepted.id }), { mode: 0o600 });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    let complete = false, failure: unknown;
    for (let n = 0; n < 10 && !complete && !failure; n++) {
      try { complete = (await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).complete; } catch (error) { failure = error; }
      await settleMaintenance(f.owner);
    }
    if (count === 20) { expect(failure).toBeUndefined(); expect(complete).toBe(true); expect(f.db.prepare("SELECT count(*) n FROM erasure_inventory_objects WHERE slot='processing-file'").get()).toEqual({ n: 20 }); }
    else { expect(failure).toMatchObject({ message: "ERASURE_UNKNOWN_OBJECT" }); expect(complete).toBe(false); }
    expect(await readdir(path)).toHaveLength(count);
  });
  it("preserves accepted-after-lost-reply association instead of inferring nonacceptance", async () => {
    const f = await setup(), accepted = await f.accept();
    const path = join(f.config.custodyRoot, (await readdir(f.config.custodyRoot)).find(name => name.endsWith(".journal"))!);
    const journal = JSON.parse(await readFile(path, "utf8")); delete journal.caseId; journal.state = "reserved";
    await writeFile(path, JSON.stringify(journal));
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    expect((await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).complete).toBe(true);
    expect(f.db.prepare("SELECT caseId,state FROM erasure_inventory_journals").all()).toEqual([{ caseId: accepted.accepted.id, state: "committed" }]);
  });
  it("blocks a genuine replay reservation rather than claiming another accepted reservation's case", async () => {
    const f = await setup(); await f.accept();
    await f.owner.custody.reserve({ ...testAdmission(), sessionHash: digest("a".repeat(64)), idempotencyKey: "custody-lifetime", reservedBytes: 20000, now: utcInstant(f.owner.clock.now().toISOString()) }, testReadiness);
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("ERASURE_ASSOCIATION_INVALID");
  });
  it("scans twenty-one distinct historical accepted cases with bounded continuation and no skipped inventory", async () => {
    const f = await setup(), first = await f.accept();
    const row = f.db.prepare("SELECT * FROM cases WHERE id=?").get(first.accepted.id) as Record<string, unknown>;
    const reservation = f.db.prepare("SELECT * FROM reservations WHERE id=?").get(row.reservationId) as Record<string, unknown>;
    const originalJournal = JSON.parse(await readFile(join(f.config.custodyRoot, `${row.reservationId}.journal`), "utf8"));
    // Synthetic persisted historical sources, not a forged scan/physical result.
    // Every scanner observation below still comes from actual native files.
    for (let n = 1; n < 21; n++) {
      const id = randomUUID(), reservationId = randomUUID(), sessionHash = n.toString(16).padStart(64, "0");
      const path = join(f.config.custodyRoot, `${reservationId}.enc`);
      const r = { ...reservation, id: reservationId, sessionHash }, c = { ...row, id, reference: `scan-synthetic-${n}`, reservationId, sessionHash, encryptedPayloadPath: path };
      for (const [table, value] of [["reservations", r], ["cases", c]] as const) f.db.prepare(`INSERT INTO ${table}(${Object.keys(value).join(",")}) VALUES(${Object.keys(value).map(key => `@${key}`).join(",")})`).run(value);
      const lease = await f.authority.prepare(reservationId, join(f.config.intakeRoot, `${reservationId}.enc`), 10000);
      await f.authority.quiesce(lease); await f.authority.released(lease);
      const journal = { ...originalJournal, id: reservationId, caseId: id, path: lease.path, workerPath: path, lease, reservation: { ...originalJournal.reservation, id: reservationId, sessionHash } };
      await copyFile(first.record.encryptedPayloadPath, path);
      await writeFile(join(f.config.custodyRoot, `${reservationId}.journal`), JSON.stringify(journal), { mode: 0o600 });
    }
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    let complete = false, runs = 0;
    while (!complete && runs++ < 20) {
      complete = (await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).complete;
      expect(maintenanceSnapshot(f.owner).selectedCount).toBeLessThanOrEqual(20);
      expect(maintenanceSnapshot(f.owner).consumedItems).toBeLessThanOrEqual(1000);
      await settleMaintenance(f.owner);
    }
    expect(complete).toBe(true); expect(runs).toBeGreaterThan(1);
    expect(f.db.prepare("SELECT count(DISTINCT caseId) n FROM erasure_inventory_journals").get()).toEqual({ n: 21 });
    expect(f.db.prepare("SELECT count(*) n FROM erasure_inventory_objects WHERE slot!='incoming-sealed'").get()).toEqual({ n: 42 });
    expect(f.db.prepare("SELECT count(*) n FROM erasure_inventory_objects WHERE slot='incoming-sealed' AND presence='absent'").get()).toEqual({ n: 21 });
  });
  it("retains an already-read native entry when selection fills during its await", async () => {
    const f = await setup(); await f.accept(); const originalOpen = fs.opendir;
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner);
    let filled = false;
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => {
      const dir = await originalOpen(...args), read = dir.read.bind(dir);
      dir.read = async () => { const result = await read(); if (result && !filled) { filled = true; for (let n = 0; n < 20; n++) selectMaintenance(run, f.owner.repository, `case:parallel-${n}`); } return result; };
      return dir;
    });
    expect((await custodyErasureOwner(f.owner.custody).scanBatch(run)).complete).toBe(false);
    expect(f.db.prepare("SELECT count(*) n FROM erasure_inventory_objects").get()).toEqual({ n: 0 });
    await settleMaintenance(f.owner);
    expect((await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).complete).toBe(true);
    expect(f.db.prepare("SELECT count(*) n FROM erasure_inventory_objects WHERE slot!='incoming-sealed'").get()).toEqual({ n: 2 });
    expect(f.db.prepare("SELECT count(*) n FROM erasure_inventory_objects WHERE slot='incoming-sealed' AND presence='absent'").get()).toEqual({ n: 1 });
  });
  it("retains an unlinked journal descriptor after a failed actual close without exposing its private error", async () => {
    const f = await setup(); await f.accept(); const originalOpen = fs.open;
    let retained: FileHandle | undefined, realClose: (() => Promise<void>) | undefined;
    vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      const handle = await originalOpen(...args);
      if (String(args[0]).endsWith(".journal") && !retained) {
        retained = handle; realClose = handle.close.bind(handle);
        handle.close = async () => { await fs.unlink(args[0]).catch(() => {}); throw new Error("private-journal-close-canary"); };
      }
      return handle;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow(/^MAINTENANCE_COMMAND_FAILED$/);
    expect((await retained!.stat()).nlink).toBe(0);
    await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
    expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
    retained!.close = realClose!; await closeCustodyHandle(retained!);
    await settleMaintenance(f.owner); expect(() => f.owner.repository.close()).not.toThrow();
  });
  it("uses the same deadline through a native read wait and durably revokes coverage on expiry", async () => {
    const f = await setup(), originalOpen = fs.opendir, entered = deferred(), release = deferred();
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => {
      const dir = await originalOpen(...args), read = dir.read.bind(dir);
      dir.read = async () => { entered.resolve(); await release.promise; return read(); }; return dir;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner);
    const result = custodyErasureOwner(f.owner.custody).scanBatch(run).catch(error => error);
    await entered.promise; f.advance(120001); release.resolve();
    expect((await result).message).toBe("MAINTENANCE_DEADLINE");
    expect(f.db.prepare("SELECT state FROM erasure_scans").all()).toEqual([{ state: "blocked" }]);
    expect(maintenanceSnapshot(f.owner).consumedItems).toBeLessThanOrEqual(1000);
    await settleMaintenance(f.owner); expect(() => f.owner.repository.close()).not.toThrow();
  });
  it("rejects caller-created observations, equivalent configuration DTOs and another custody cleanup identity", async () => {
    const f = await setup(), other = await setup();
    bindMaintenance(f.owner, f.services, f.monotonicNow); const run = await beginMaintenance(f.owner);
    expect(() => consumeCustodyObservation(Object.freeze({}) as CustodyObservation, f.owner.custody, run)).toThrow("ERASURE_OBSERVATION_INVALID");
    expect(() => createCustodyInventoryStorage(f.db, f.owner.repository, f.owner.custody, { ...f.config, ingressAuthority: f.authority })).toThrow("MAINTENANCE_OWNER_MISMATCH");
    expect(() => createCustodyInventoryStorage(f.db, f.owner.repository, f.owner.custody, { ...f.config, clock: { now: f.owner.clock.now } })).toThrow("MAINTENANCE_OWNER_MISMATCH");
    await expect(closeMaintenanceScanIterators(run, other.owner.custody)).rejects.toThrow("MAINTENANCE_WORK_ACTIVE");
  });
  it("preserves ordinary custody reconstruction on the same repository but rejects another custody's run", async () => {
    const f = await setup();
    const other = createCustodyLedger(f.owner.repository, { ...f.config, ingressAuthority: f.authority });
    await other.reconcile();
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(other).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("MAINTENANCE_OWNER_MISMATCH");
  });
  it("rejects replacement of the originally captured ingress observe method", async () => {
    const f = await setup(); await f.accept();
    const observe = f.authority.observe.bind(f.authority);
    f.authority.observe = lease => observe(lease);
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("INGRESS_RECOVERY_REQUIRED");
  });
  it("retains failed real Dir.close ownership until the exact cleanup retry actually succeeds", async () => {
    const f = await setup(), originalOpen = fs.opendir;
    let retained: Dir | undefined, failClose = true, closes = 0;
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => {
      const dir = await originalOpen(...args), close = dir.close.bind(dir);
      if (args[0] === f.config.custodyRoot) {
        retained = dir;
        dir.close = async () => { if (failClose) throw new Error("private-dir-canary"); await close(); closes++; };
      }
      return dir;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    const run = await beginMaintenance(f.owner), scan = custodyErasureOwner(f.owner.custody);
    await expect(scan.scanBatch(run)).rejects.toThrow(/^MAINTENANCE_COMMAND_FAILED$/);
    expect(await retained!.read()).toBeNull();
    await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
    expect(() => beginMaintenance(f.owner)).toThrow("MAINTENANCE_RUN_ACTIVE");
    expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
    await expect(scan.invalidateAndClose(run)).rejects.toThrow(/^MAINTENANCE_COMMAND_FAILED$/);
    expect(closes).toBe(0); failClose = false; f.advance(120001);
    const before = maintenanceSnapshot(f.owner).consumedItems;
    expect(await scan.invalidateAndClose(run)).toEqual({ consumedItems: 1 });
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(before + 1);
    expect(closes).toBe(1); await expect(retained!.read()).rejects.toMatchObject({ code: "ERR_DIR_CLOSED" });
    await settleMaintenance(f.owner); expect(() => f.owner.repository.close()).not.toThrow();
    expect(f.db.open).toBe(false);
  });
  it("never stores complete EOF when the root changes during the native EOF read", async () => {
    const f = await setup(), originalOpen = fs.opendir;
    vi.spyOn(fs, "opendir").mockImplementation(async (...args) => {
      const dir = await originalOpen(...args), read = dir.read.bind(dir);
      if (args[0] === f.config.custodyRoot) dir.read = async () => {
        const value = await read();
        if (!value) { await rename(f.config.custodyRoot, `${f.config.custodyRoot}-old`); await mkdir(f.config.custodyRoot, { mode: 0o700 }); }
        return value;
      };
      return dir;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("ERASURE_ROOT_CHANGED");
    expect(f.db.prepare("SELECT state FROM erasure_scans").all()).toEqual([{ state: "blocked" }]);
  });
  it("stops before inventory writes when twenty other selections already consumed the run", async () => {
    const f = await setup(); await f.accept(); bindMaintenance(f.owner, f.services, f.monotonicNow);
    const run = await beginMaintenance(f.owner);
    for (let n = 0; n < 20; n++) selectMaintenance(run, f.owner.repository, `case:other-${n}`);
    expect((await custodyErasureOwner(f.owner.custody).scanBatch(run)).complete).toBe(false);
    expect(f.db.prepare("SELECT count(*) n FROM erasure_inventory_objects").get()).toEqual({ n: 0 });
    await settleMaintenance(f.owner);
    expect((await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).complete).toBe(true);
    expect(f.db.prepare("SELECT count(*) n FROM erasure_inventory_objects WHERE slot!='incoming-sealed'").get()).toEqual({ n: 2 });
    expect(f.db.prepare("SELECT count(*) n FROM erasure_inventory_objects WHERE slot='incoming-sealed' AND presence='absent'").get()).toEqual({ n: 1 });
  });
  it("durably invalidates previous EOF coverage after a root changes", async () => {
    const f = await setup(); bindMaintenance(f.owner, f.services, f.monotonicNow);
    const scan = custodyErasureOwner(f.owner.custody), run = await beginMaintenance(f.owner);
    expect((await scan.scanBatch(run)).complete).toBe(true);
    await rename(f.config.custodyRoot, `${f.config.custodyRoot}-old`); await mkdir(f.config.custodyRoot, { mode: 0o700 });
    await expect(scan.scanBatch(run)).rejects.toThrow("ERASURE_ROOT_CHANGED");
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state='complete'").get()).toEqual({ n: 0 });
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state='blocked'").get()).toEqual({ n: 3 });
  });
  it("checks the original ingress authority even when only the released journal and worker copy remain", async () => {
    const f = await setup(); await f.accept(); f.authority.available = false;
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("INGRESS_RECOVERY_REQUIRED");
    expect(f.db.prepare("SELECT count(*) n FROM erasure_scans WHERE state='complete'").get()).toEqual({ n: 0 });
  });
  it("rejects malformed legacy lease generations instead of accepting journal-only inventory", async () => {
    const f = await setup(); await f.accept();
    const name = (await readdir(f.config.custodyRoot)).find(name => name.endsWith(".journal"))!;
    const path = join(f.config.custodyRoot, name), journal = JSON.parse(await readFile(path, "utf8"));
    journal.version = 1; journal.lease.generation = 7; await writeFile(path, JSON.stringify(journal));
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).rejects.toThrow("INGRESS_RECOVERY_REQUIRED");
  });
  it("records root completion only after actual EOF and closes the iterators", async () => {
    const f = await setup(); bindMaintenance(f.owner, f.services, f.monotonicNow);
    const run = await beginMaintenance(f.owner);
    const result = await custodyErasureOwner(f.owner.custody).scanBatch(run);
    expect(result.complete).toBe(true);
    expect(f.db.prepare("SELECT root,state,itemCount FROM erasure_scans ORDER BY root").all()).toEqual([
      { root: "custody", state: "complete", itemCount: 0 },
      { root: "incoming", state: "complete", itemCount: 0 },
      { root: "runtime", state: "complete", itemCount: 0 },
    ]);
    expect(result.consumedItems).toBeGreaterThan(0);
    await settleMaintenance(f.owner); expect(() => f.owner.repository.close()).not.toThrow();
  });
  it("retains an iterator across allowances without claiming EOF or closing the database", async () => {
    const f = await setup(); await f.accept();
    const journal = (await readdir(f.config.custodyRoot)).find(name => name.endsWith(".journal"))!;
    for (let n = 0; n < 1001; n++) await copyFile(join(f.config.custodyRoot, journal), join(f.config.custodyRoot, `${journal}.${randomUUID()}.tmp`));
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    let run = await beginMaintenance(f.owner), result = await custodyErasureOwner(f.owner.custody).scanBatch(run);
    expect(result.complete).toBe(false);
    expect(maintenanceSnapshot(f.owner).consumedItems).toBeLessThanOrEqual(1000);
    expect(f.db.prepare("SELECT count(*) AS n FROM erasure_inventory_objects").get()).toMatchObject({ n: expect.any(Number) });
    await settleMaintenance(f.owner); expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
    let runs = 1;
    while (!result.complete && runs++ < 200) {
      run = await beginMaintenance(f.owner); result = await custodyErasureOwner(f.owner.custody).scanBatch(run);
      expect(maintenanceSnapshot(f.owner).consumedItems).toBeLessThanOrEqual(1000);
      await settleMaintenance(f.owner);
    }
    expect(result.complete).toBe(true);
    expect(f.db.prepare("SELECT count(*) AS n FROM erasure_inventory_objects WHERE slot='journal-temp'").get()).toEqual({ n: 1001 });
    expect(() => f.owner.repository.close()).not.toThrow();
  });
  it("blocks an unknown object without deleting it or claiming complete inventory", async () => {
    const f = await setup(), path = join(f.config.custodyRoot, "unknown-private-object");
    await writeFile(path, "synthetic", { mode: 0o600 });
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    const run = await beginMaintenance(f.owner);
    await expect(custodyErasureOwner(f.owner.custody).scanBatch(run)).rejects.toThrow("ERASURE_UNKNOWN_OBJECT");
    expect(await readdir(f.config.custodyRoot)).toContain("unknown-private-object");
    expect(f.db.prepare("SELECT 1 FROM erasure_scans WHERE state='complete'").get()).toBeUndefined();
  });
});
