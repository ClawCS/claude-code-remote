import { afterEach, describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { chmod, copyFile, readFile, rm, writeFile, readdir, lstat } from "node:fs/promises";
import * as fs from "node:fs/promises";
import { join } from "node:path";
import { maintenanceFixture } from "./fixtures/maintenance";
import { testAdmission, testReadiness, refreshTestRepository, openTestRepository, openReadyTestRepository } from "./fixtures/admission";
import { createCustodyLedger } from "../src/custody";
import { digest, utcInstant } from "../src/types";
import { beginMaintenance, bindMaintenance, settleMaintenance, finishMaintenanceNeverAcceptedResources, maintenanceSnapshot, maintenanceCommand, selectMaintenance, type MaintenanceRun } from "../src/worker-maintenance";
import type { WorkerOwner } from "../src/types";
import { custodyErasureOwner } from "../src/custody-erasure";
import * as custodyComposition from "../src/custody-erasure";
import type { InventoryJournal } from "../src/erasure-storage";
import { erasureOwner } from "../src/erasure-repository";
import { TestIngressAuthority } from "./fixtures/ingress-authority";
import { randomUUID } from "node:crypto";

const connections = vi.hoisted(() => ({ all: [] as Database.Database[] }));
vi.mock("node:fs/promises", async original => ({ ...await original<typeof import("node:fs/promises")>() }));
vi.mock("better-sqlite3", async original => {
  const actual = await original<{ default: typeof Database }>();
  return { default: class extends actual.default {
    constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); connections.all.push(this); }
  } };
});
const fixtures: Awaited<ReturnType<typeof maintenanceFixture>>[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const db of connections.all.splice(0)) if (db.open) db.close();
  for (const f of fixtures.splice(0)) await rm(f.root, { recursive: true, force: true });
});
async function setup() {
  const f = await maintenanceFixture(); fixtures.push(f);
  return { ...f, db: connections.all.at(-1)! };
}
function input(f: Awaited<ReturnType<typeof setup>>, key = "synthetic-never-accepted") {
  return { ...testAdmission(), sessionHash: digest("b".repeat(64)), idempotencyKey: key, reservedBytes: 20000, now: utcInstant(f.owner.clock.now().toISOString()) };
}
async function scanAll(owner: WorkerOwner) {
  let complete = false;
  for (let n = 0; !complete && n < 100; n++) {
    try { complete = (await custodyErasureOwner(owner.custody).scanBatch(await beginMaintenance(owner))).complete; }
    finally { await settleMaintenance(owner); }
  }
  expect(complete).toBe(true);
}
async function cleanupAll(owner: WorkerOwner) {
  let complete = false;
  for (let n = 0; !complete && n < 100; n++) {
    try { complete = (await custodyErasureOwner(owner.custody).cleanupNeverAcceptedBatch(await beginMaintenance(owner))).complete; }
    finally { await settleMaintenance(owner); }
  }
  expect(complete).toBe(true);
}
async function prune(owner: WorkerOwner, rounds = 15) {
  let removed = 0;
  for (let n = 0; n < rounds; n++) {
    try {
      const report = await custodyErasureOwner(owner.custody).pruneInventoryBatch(await beginMaintenance(owner));
      expect(Object.isFrozen(report)).toBe(true); expect(report.consumedItems).toBeLessThanOrEqual(1000); removed += report.removed;
    } finally { await settleMaintenance(owner); }
  }
  return removed;
}
async function aborted() {
  const f = await setup(), request = input(f), reservation = await f.owner.custody.reserve(request, testReadiness);
  const path = join(f.config.intakeRoot, `${reservation.id}.enc`); await writeFile(path, "synthetic", { mode: 0o640 });
  await expect(f.owner.custody.abortIntake(reservation.id, request.sessionHash)).rejects.toThrow("CUSTODY_NOT_READY");
  bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
  return { ...f, reservation, path };
}

describe("proven never-accepted original custody cleanup", () => {
  it("releases a genuinely original never-started same-key retry without changing its accepted winner", async () => {
    const f = await setup(), accepted = await f.accept(), bytes = await readFile(accepted.record.encryptedPayloadPath);
    const reservation = f.owner.repository.reserve({ ...input(f, "custody-lifetime"), sessionHash: digest("a".repeat(64)) });
    expect(f.db.prepare("SELECT custodyStarted FROM reservations WHERE id=?").get(reservation.id)).toEqual({ custodyStarted: 0 });
    f.owner.repository.releaseReservation(reservation.id);
    expect(f.db.prepare("SELECT 1 FROM reservations WHERE id=?").get(reservation.id)).toBeUndefined();
    expect(await readFile(accepted.record.encryptedPayloadPath)).toEqual(bytes);
  });
  it("recovers an expired started same-key retry after a crash before abort or commit capture", async () => {
    const f = await setup(), accepted = await f.accept(), bytes = await readFile(accepted.record.encryptedPayloadPath);
    const reservation = await f.owner.custody.reserve({ ...input(f, "custody-lifetime"), sessionHash: digest("a".repeat(64)) }, testReadiness);
    const path = join(f.config.intakeRoot, `${reservation.id}.enc`); await writeFile(path, "synthetic expired retry", { mode: 0o640 });
    expect(f.db.prepare("SELECT custodyStarted,cleanupDisposition FROM reservations WHERE id=?").get(reservation.id)).toEqual({ custodyStarted: 1, cleanupDisposition: null });
    f.advance(86400001); const restarted = await f.restart(), db = connections.all.at(-1)!, prepare = db.prepare.bind(db);
    let work = 0;
    vi.spyOn(db, "prepare").mockImplementation(sql => {
      const statement = prepare(sql);
      for (const method of ["get", "all", "run"] as const) {
        const original = statement[method].bind(statement);
        vi.spyOn(statement, method).mockImplementation((...args: unknown[]) => {
          const result = original(...args); work += 1 + (method === "all" ? (result as unknown[]).length : method === "get" && result ? 1 : 0); return result;
        });
      }
      return statement;
    });
    bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    let complete = false;
    for (let n = 0; !complete && n < 100; n++) {
      const run = await beginMaintenance(restarted.owner); work = 0;
      try {
        const report = await custodyErasureOwner(restarted.owner.custody).scanBatch(run); complete = report.complete;
        expect(report.consumedItems).toBeGreaterThanOrEqual(work); expect(maintenanceSnapshot(restarted.owner).consumedItems).toBeLessThanOrEqual(1000);
      } finally { await settleMaintenance(restarted.owner); }
    }
    expect(complete).toBe(true); vi.restoreAllMocks(); await cleanupAll(restarted.owner);
    expect(connections.all.at(-1)!.prepare("SELECT 1 FROM reservations WHERE id=?").get(reservation.id)).toBeUndefined();
    await expect(lstat(path)).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readFile(accepted.record.encryptedPayloadPath)).toEqual(bytes);
  });
  it("retains restored never-started same-key rows without original issuance", async () => {
    const f = await setup(), accepted = await f.accept(), bytes = await readFile(accepted.record.encryptedPayloadPath);
    const reservation = f.owner.repository.reserve({ ...input(f, "custody-lifetime"), sessionHash: digest("a".repeat(64)) });
    f.owner.repository.close(); const repository = openTestRepository(join(f.root, "registry.sqlite"), f.owner.clock);
    repository.releaseReservation(reservation.id);
    expect(connections.all.at(-1)!.prepare("SELECT custodyStarted FROM reservations WHERE id=?").get(reservation.id)).toEqual({ custodyStarted: 0 });
    expect(await readFile(accepted.record.encryptedPayloadPath)).toEqual(bytes);
  });
  it.each(["nonexpired", "unknown-lineage", "changed-source", "changed-generation"] as const)("does not classify an expired retry with %s evidence", async reason => {
    const f = await setup(), accepted = await f.accept(), bytes = await readFile(accepted.record.encryptedPayloadPath);
    const reservation = await f.owner.custody.reserve({ ...input(f, "custody-lifetime"), sessionHash: digest("a".repeat(64)) }, testReadiness);
    const path = join(f.config.intakeRoot, `${reservation.id}.enc`), journalPath = join(f.config.custodyRoot, `${reservation.id}.journal`);
    await writeFile(path, "synthetic retained retry", { mode: 0o640 });
    if (reason !== "nonexpired") f.advance(86400001);
    if (reason === "unknown-lineage") {
      const trigger = f.db.prepare("SELECT sql FROM sqlite_master WHERE name='cleanup_source_monotonic'").get() as { sql: string };
      f.db.exec("DROP TRIGGER cleanup_source_monotonic"); f.db.prepare("UPDATE reservations SET custodyStarted=NULL WHERE id=?").run(reservation.id); f.db.exec(trigger.sql);
    }
    if (reason === "changed-source" || reason === "changed-generation") {
      const journal = JSON.parse(await readFile(journalPath, "utf8"));
      if (reason === "changed-source") journal.reservation.idempotencyKey = "synthetic changed source";
      else journal.lease.generation = randomUUID();
      await writeFile(journalPath, JSON.stringify(journal), { mode: 0o600 });
    }
    const restarted = await f.restart(), db = connections.all.at(-1)!; bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    await expect(scanAll(restarted.owner)).rejects.toThrow();
    expect(db.prepare("SELECT active,reservedBytes,cleanupDisposition FROM reservations WHERE id=?").get(reservation.id)).toEqual({ active: 1, reservedBytes: 20000, cleanupDisposition: null });
    expect(await readFile(path, "utf8")).toBe("synthetic retained retry"); expect(await readFile(accepted.record.encryptedPayloadPath)).toEqual(bytes);
  });
  it.each(["items", "selections"] as const)("admits expired retry classification only within the original %s budget", async limit => {
    const f = await setup(); await f.accept();
    const reservation = await f.owner.custody.reserve({ ...input(f, "custody-lifetime"), sessionHash: digest("a".repeat(64)) }, testReadiness);
    const other = Array.from({ length: 20 }, (_, n) => {
      const row = f.owner.repository.reserve(input(f, `synthetic-budget-${n}`));
      f.owner.repository.releaseReservation(row.id); return row;
    });
    f.advance(86400001); const restarted = await f.restart(), db = connections.all.at(-1)!; bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    const run = await beginMaintenance(restarted.owner);
    if (limit === "items") await maintenanceCommand(run, restarted.owner.repository, 1000, "scalar", () => ({ value: null, consumedItems: 1000 }));
    else for (const row of other) selectMaintenance(run, restarted.owner.repository, `reservation:${row.id}`);
    try {
      if (limit === "items") await expect(custodyErasureOwner(restarted.owner.custody).scanBatch(run)).rejects.toThrow("MAINTENANCE_BUDGET_INSUFFICIENT");
      else expect((await custodyErasureOwner(restarted.owner.custody).scanBatch(run)).complete).toBe(false);
      expect(maintenanceSnapshot(restarted.owner).consumedItems).toBeLessThanOrEqual(1000);
      expect(db.prepare("SELECT cleanupDisposition FROM reservations WHERE id=?").get(reservation.id)).toEqual({ cleanupDisposition: null });
    } finally { await settleMaintenance(restarted.owner); }
  });
  it("retires an authenticated pre-commit same-key cancellation after its tracked abort exits while preserving the winner", async () => {
    const f = await setup(), accepted = await f.accept(), winnerBytes = await readFile(accepted.record.encryptedPayloadPath);
    const request = { ...input(f, "custody-lifetime"), sessionHash: digest("a".repeat(64)) };
    const reservation = await f.owner.custody.reserve(request, testReadiness), path = join(f.config.intakeRoot, `${reservation.id}.enc`);
    await writeFile(path, "synthetic cancelled upload", { mode: 0o640 });
    await expect(f.owner.custody.abortIntake(reservation.id, request.sessionHash)).rejects.toThrow("CUSTODY_NOT_READY");
    expect(f.owner.custody.getIntakeReadiness()).toEqual({ ready: false });
    expect(await readFile(accepted.record.encryptedPayloadPath)).toEqual(winnerBytes);
    expect(f.db.prepare("SELECT active FROM reservations WHERE id=?").get(reservation.id)).toEqual({ active: 1 });
    expect(f.db.prepare("SELECT cleanupDisposition,cleanupWinner FROM reservations WHERE id=?").get(reservation.id)).toEqual({ cleanupDisposition: "replay-loser", cleanupWinner: (f.db.prepare("SELECT reservationId FROM cases WHERE id=?").get(accepted.accepted.id) as { reservationId: string }).reservationId });
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner); await cleanupAll(f.owner);
    expect(f.db.prepare("SELECT 1 FROM reservations WHERE id=?").get(reservation.id)).toBeUndefined();
    await expect(lstat(path)).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readFile(accepted.record.encryptedPayloadPath)).toEqual(winnerBytes);
    expect(f.db.prepare("SELECT encryptedPayloadPath FROM cases WHERE id=?").get(accepted.accepted.id)).toEqual({ encryptedPayloadPath: accepted.record.encryptedPayloadPath });
  });
  it("denies cancellation of its own accepted source without adding loser authority", async () => {
    const f = await setup(), accepted = await f.accept(), bytes = await readFile(accepted.record.encryptedPayloadPath);
    const source = f.db.prepare("SELECT reservationId,sessionHash FROM cases WHERE id=?").get(accepted.accepted.id) as { reservationId: string; sessionHash: ReturnType<typeof digest> };
    await expect(f.owner.custody.abortIntake(source.reservationId, source.sessionHash)).rejects.toThrow("INVALID_RESERVATION");
    expect(f.db.prepare("SELECT cleanupDisposition,cleanupWinner FROM reservations WHERE id=?").get(source.reservationId)).toEqual({ cleanupDisposition: null, cleanupWinner: null });
    expect(await readFile(accepted.record.encryptedPayloadPath)).toEqual(bytes);
  });
  it("retains an authenticated cancelled retry when its bound winning association changes", async () => {
    const f = await setup(), accepted = await f.accept(), bytes = await readFile(accepted.record.encryptedPayloadPath);
    const request = { ...input(f, "custody-lifetime"), sessionHash: digest("a".repeat(64)) };
    const reservation = await f.owner.custody.reserve(request, testReadiness), path = join(f.config.intakeRoot, `${reservation.id}.enc`);
    await writeFile(path, "synthetic cancelled upload", { mode: 0o640 });
    await expect(f.owner.custody.abortIntake(reservation.id, request.sessionHash)).rejects.toThrow("CUSTODY_NOT_READY");
    const before = f.db.prepare("SELECT * FROM reservations WHERE id=?").get(reservation.id);
    f.db.prepare("UPDATE cases SET idempotencyKey=? WHERE id=?").run("synthetic changed winner", accepted.accepted.id);
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    await expect(scanAll(f.owner)).rejects.toThrow("ERASURE_ASSOCIATION_INVALID");
    expect(f.db.prepare("SELECT * FROM reservations WHERE id=?").get(reservation.id)).toEqual(before);
    expect(await readFile(path, "utf8")).toBe("synthetic cancelled upload");
    expect(await readFile(accepted.record.encryptedPayloadPath)).toEqual(bytes);
  });
  it("does not turn own accepted lost-reply bytes into never-accepted cleanup", async () => {
    const f = await setup(), commit = f.owner.repository.commitIntake.bind(f.owner.repository);
    vi.spyOn(f.owner.repository, "commitIntake").mockImplementation(input => { commit(input); throw new Error("synthetic lost accepted reply"); });
    await expect(f.accept()).rejects.toThrow("synthetic lost accepted reply");
    const accepted = f.owner.repository.listRetainedIntakes()[0], bytes = await readFile(accepted.encryptedPayloadPath);
    // The legacy sealing fixture defaults600; this strict scanner requires the
    // actual configured incoming640 mode, including on a lost-reply residue.
    const source = f.db.prepare("SELECT reservationId FROM cases WHERE id=?").get(accepted.id) as { reservationId: string };
    await chmod(join(f.config.intakeRoot, `${source.reservationId}.enc`), 0o640);
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner); await cleanupAll(f.owner);
    expect(await readFile(accepted.encryptedPayloadPath)).toEqual(bytes); expect(f.db.prepare("SELECT 1 FROM cleanup_manifests LIMIT 1").get()).toBeUndefined();
  });
  it("continues source retirement after a real earlier manifest was retired but the final transaction failed", async () => {
    const f = await aborted(), prepare = f.db.prepare.bind(f.db); let deleted = 0;
    vi.spyOn(f.db, "prepare").mockImplementation(sql => {
      const s = prepare(sql), run = s.run.bind(s);
      if (sql.startsWith("DELETE FROM cleanup_manifests")) vi.spyOn(s, "run").mockImplementation((...args: unknown[]) => { if (++deleted === 2) throw new Error("private final-source canary"); return run(...args); }); return s;
    });
    await expect(cleanupAll(f.owner)).rejects.toThrow("MAINTENANCE_COMMAND_FAILED"); expect(deleted).toBe(2);
    expect(f.db.prepare("SELECT active FROM reservations WHERE id=?").get(f.reservation.id)).toEqual({ active: 1 });
    expect(f.db.prepare("SELECT count(*) AS n FROM cleanup_manifests WHERE reservationId=?").get(f.reservation.id)).toEqual({ n: 1 });
    vi.restoreAllMocks(); const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow); await scanAll(restarted.owner); await cleanupAll(restarted.owner);
    expect(connections.all.at(-1)!.prepare("SELECT 1 FROM reservations WHERE id=?").get(f.reservation.id)).toBeUndefined();
  });
  it("does not treat genuinely finalized zero manifests as permission to delete resurrected bytes", async () => {
    const f = await aborted(), prepare = f.db.prepare.bind(f.db);
    vi.spyOn(f.db, "prepare").mockImplementation(sql => {
      const s = prepare(sql); if (sql.startsWith("DELETE FROM cleanup_manifests")) vi.spyOn(s, "run").mockImplementation(() => { throw new Error("synthetic retirement interruption"); }); return s;
    });
    await expect(cleanupAll(f.owner)).rejects.toThrow("MAINTENANCE_COMMAND_FAILED");
    const before = f.db.prepare("SELECT * FROM cleanup_manifests").all(); expect(before).toEqual(expect.arrayContaining([expect.objectContaining({ phase: "metadata-finalized", remainingCharge: 0 })]));
    vi.restoreAllMocks(); await writeFile(f.path, "synthetic", { mode: 0o640 });
    await expect(cleanupAll(f.owner)).rejects.toThrow();
    expect(await readFile(f.path, "utf8")).toBe("synthetic"); expect(f.db.prepare("SELECT * FROM cleanup_manifests").all()).toEqual(before);
    expect(f.db.prepare("SELECT active FROM reservations WHERE id=?").get(f.reservation.id)).toEqual({ active: 1 });
  });
  it("cannot extend a filled original allowance or admit physical work past its fixed reserve", async () => {
    const f = await aborted(), run = await beginMaintenance(f.owner);
    await maintenanceCommand(run, f.owner.repository, 1000, "scalar", () => ({ value: null, consumedItems: 1000 }));
    expect(await custodyErasureOwner(f.owner.custody).cleanupNeverAcceptedBatch(run)).toEqual({ complete: false, consumedItems: 0 });
    expect(await custodyErasureOwner(f.owner.custody).pruneInventoryBatch(run)).toEqual({ examined: 0, removed: 0, consumedItems: 0 });
    expect(maintenanceSnapshot(f.owner).consumedItems).toBe(1000); expect(await readFile(f.path, "utf8")).toBe("synthetic");
    await settleMaintenance(f.owner);
    const late = await beginMaintenance(f.owner); f.advance(80001);
    await expect(custodyErasureOwner(f.owner.custody).cleanupNeverAcceptedBatch(late)).rejects.toThrow("MAINTENANCE_DEADLINE");
    expect(await readFile(f.path, "utf8")).toBe("synthetic"); await settleMaintenance(f.owner);
    await cleanupAll(f.owner);
  });
  it("retains obsolete intake metadata when the exact original released-generation observer is unavailable", async () => {
    const f = await aborted(); await cleanupAll(f.owner);
    const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow); await scanAll(restarted.owner);
    const db = connections.all.at(-1)!, rows = db.prepare("SELECT * FROM erasure_inventory_objects").all();
    f.authority.available = false;
    expect(await prune(restarted.owner)).toBe(0); expect(db.prepare("SELECT * FROM erasure_inventory_objects").all()).toEqual(rows);
    f.authority.available = true; expect(await prune(restarted.owner)).toBeGreaterThan(0);
  });
  it("keeps ordinary orphan recovery unavailable until its deferred maintenance actually settles", async () => {
    const f = await setup(); await f.owner.custody.reserve(input(f), testReadiness); f.owner.repository.close();
    const repository = await openReadyTestRepository(join(f.root, "registry.sqlite"), f.owner.clock), custody = createCustodyLedger(repository, { ...f.config, ingressAuthority: f.authority });
    expect((await custody.reconcile()).orphans).toHaveLength(1);
    expect(custody.getIntakeReadiness()).toEqual({ ready: false });
  });
  it("uses real normalized non-intake replacements, not absent-source inference", async () => {
    const f = await setup(), accepted = await f.accept(), id = randomUUID(), path = join(f.config.runtimeRoot, id);
    await fs.mkdir(path, { mode: 0o700 }); await writeFile(join(path, "0.data"), "synthetic", { mode: 0o600 });
    await writeFile(join(f.config.custodyRoot, `${id}.journal`), JSON.stringify({ version: 3, id, kind: "processing", state: "committed", path, budget: 4096, cleanupAfter: "2026-10-11T12:00:00.000Z", caseId: accepted.accepted.id }), { mode: 0o600 });
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    const old = (f.db.prepare("SELECT scanPass FROM erasure_maintenance").get() as { scanPass: string }).scanPass;
    const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow); await scanAll(restarted.owner);
    const db = connections.all.at(-1)!; await prune(restarted.owner);
    expect(db.prepare("SELECT 1 FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(old, id)).toBeUndefined();
    expect(db.prepare("SELECT 1 FROM erasure_inventory_journals WHERE pass!=? AND journalId=?").get(old, id)).toBeDefined();
    expect(await readFile(join(path, "0.data"), "utf8")).toBe("synthetic");
  });
  it.each(["replace", "hardlink"] as const)("blocks a %s at the physical boundary without reducing charge or source", async mode => {
    const f = await aborted();
    if (mode === "replace") { await fs.rename(f.path, join(f.root, "held-original")); await writeFile(f.path, "synthetic", { mode: 0o640 }); }
    else await fs.link(f.path, join(f.root, "held-original"));
    await expect(cleanupAll(f.owner)).rejects.toThrow("ERASURE_OWNERSHIP_INVALID");
    expect(f.db.prepare("SELECT active FROM reservations WHERE id=?").get(f.reservation.id)).toEqual({ active: 1 }); expect(await readFile(f.path, "utf8")).toBe("synthetic");
  });
  it("charges all observed native and SQLite work across N phases and obsolete inventory pruning", async () => {
    const f = await aborted(); let native = 0, rows = 0, total = 0;
    const stat = fs.lstat, open = fs.open, unlink = fs.unlink, prepare = f.db.prepare.bind(f.db);
    vi.spyOn(fs, "lstat").mockImplementation(async (...args) => { native++; return stat(...args); });
    vi.spyOn(fs, "unlink").mockImplementation(async (...args) => { native++; return unlink(...args); });
    vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      native++; const fd = await open(...args), stat = fd.stat.bind(fd), sync = fd.sync.bind(fd), close = fd.close.bind(fd);
      vi.spyOn(fd, "stat").mockImplementation(async (...args) => { native++; return stat(...args); });
      vi.spyOn(fd, "sync").mockImplementation(async () => { native++; return sync(); });
      vi.spyOn(fd, "close").mockImplementation(async () => { native++; return close(); }); return fd;
    });
    vi.spyOn(f.db, "prepare").mockImplementation(sql => {
      const s = prepare(sql), get = s.get.bind(s), all = s.all.bind(s), run = s.run.bind(s);
      vi.spyOn(s, "get").mockImplementation((...args: unknown[]) => { const result = get(...args); rows += result ? 2 : 1; return result; });
      vi.spyOn(s, "all").mockImplementation((...args: unknown[]) => { const result = all(...args); rows += 1 + result.length; return result; });
      vi.spyOn(s, "run").mockImplementation((...args: unknown[]) => { rows++; return run(...args); }); return s;
    });
    let complete = false;
    for (let n = 0; !complete && n < 100; n++) {
      const before = native + rows, result = await custodyErasureOwner(f.owner.custody).cleanupNeverAcceptedBatch(await beginMaintenance(f.owner));
      expect(result.consumedItems).toBeGreaterThanOrEqual(native + rows - before); expect(maintenanceSnapshot(f.owner).consumedItems).toBeLessThanOrEqual(1000); total += result.consumedItems; complete = result.complete; await settleMaintenance(f.owner);
    }
    expect(complete).toBe(true); expect(total).toBeGreaterThan(1000); expect(native).toBeGreaterThan(100);
    for (let n = 0; n < 4; n++) {
      const before = native + rows, result = await custodyErasureOwner(f.owner.custody).pruneInventoryBatch(await beginMaintenance(f.owner));
      expect(result.consumedItems).toBeGreaterThanOrEqual(native + rows - before); await settleMaintenance(f.owner);
    }
  });
  it("bounds and fairly retires more than 1000 obsolete scan rows without touching the fresh held pass", async () => {
    const f = await setup(); bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    const current = f.db.prepare("SELECT * FROM erasure_scans").all(); expect(current).toHaveLength(3);
    f.db.transaction(() => { for (let n = 1; n <= 1001; n++) f.db.prepare("INSERT INTO erasure_scans(pass,root,state,itemCount) VALUES(?,'incoming','scanning',0)").run(n.toString(16).padStart(32, "0")); })();
    let total = 0;
    for (let n = 0; n < 1100 && total < 1001; n++) total += await prune(f.owner, 1);
    expect(total).toBe(1001); expect(f.db.prepare("SELECT * FROM erasure_scans").all()).toEqual(current);
    const plans = [
      ["SELECT * FROM erasure_inventory_objects WHERE (pass,journalId,slot,leaf)>(?,?,?,?) ORDER BY pass,journalId,slot,leaf LIMIT 1", ["", "", "", ""]],
      ["SELECT * FROM erasure_inventory_journals WHERE (pass,journalId)>(?,?) ORDER BY pass,journalId LIMIT 1", ["", ""]],
      ["SELECT * FROM erasure_scans WHERE (pass,root)>(?,?) ORDER BY pass,root LIMIT 1", ["", ""]],
      ["SELECT 1 FROM reservations WHERE cleanupWinner=? LIMIT 1", [""]],
      ["SELECT 1 FROM erasure_manifests WHERE scanPass=? AND journalId=? AND slot=? AND leaf=? LIMIT 1", ["", "", "", ""]],
      ["SELECT 1 FROM cleanup_manifests WHERE scanPass=? AND journalId=? AND slot=? AND leaf=? LIMIT 1", ["", "", "", ""]],
      ["SELECT * FROM cleanup_manifests WHERE reservationId=? AND slot=? AND leaf>=? ORDER BY leaf LIMIT 1", ["", "", ""]],
    ] as const;
    for (const [sql, params] of plans) {
      const plan = f.db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params) as { detail: string }[];
      expect(plan.some(row => /SEARCH/.test(row.detail)), sql).toBe(true); expect(plan.some(row => /SCAN|TEMP B-TREE/.test(row.detail)), sql).toBe(false);
    }
  });
  it("rolls back an actual obsolete-row delete together with its cursor when publication fails", async () => {
    const f = await aborted(); await cleanupAll(f.owner);
    const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow); await scanAll(restarted.owner);
    const db = connections.all.at(-1)!, before = db.prepare("SELECT * FROM erasure_inventory_objects").all(), cursors = db.prepare("SELECT * FROM cleanup_prune_cursors").all(), phase = db.prepare("SELECT prunePhase FROM cleanup_maintenance").get(), prepare = db.prepare.bind(db); let fired = false;
    vi.spyOn(db, "prepare").mockImplementation(sql => {
      const s = prepare(sql); if (sql.startsWith("UPDATE cleanup_prune_cursors")) vi.spyOn(s, "run").mockImplementation(() => { fired = true; throw new Error("private cursor canary"); }); return s;
    });
    await expect(prune(restarted.owner, 1)).rejects.toThrow("MAINTENANCE_COMMAND_FAILED"); expect(fired).toBe(true);
    expect(db.prepare("SELECT * FROM erasure_inventory_objects").all()).toEqual(before); expect(db.prepare("SELECT * FROM cleanup_prune_cursors").all()).toEqual(cursors); expect(db.prepare("SELECT prunePhase FROM cleanup_maintenance").get()).toEqual(phase);
    vi.restoreAllMocks(); expect(await prune(restarted.owner)).toBeGreaterThan(0);
  });
  it("advances past an ambiguous historical source without discarding it or starving a later eligible source", async () => {
    const f = await setup(), request = input(f), one = await f.owner.custody.reserve(request, testReadiness), two = await f.owner.custody.reserve(input(f, "later"), testReadiness);
    for (const r of [one, two]) await expect(f.owner.custody.abortIntake(r.id, request.sessionHash)).rejects.toThrow("CUSTODY_NOT_READY");
    const [unknown, eligible] = [one, two].sort((a, b) => a.id.localeCompare(b.id));
    const trigger = f.db.prepare("SELECT sql FROM sqlite_master WHERE name='cleanup_source_monotonic'").get() as { sql: string };
    f.db.exec("DROP TRIGGER cleanup_source_monotonic"); f.db.prepare("UPDATE reservations SET custodyStarted=NULL WHERE id=?").run(unknown.id); f.db.exec(trigger.sql);
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    for (let n = 0; n < 40 && f.db.prepare("SELECT 1 FROM reservations WHERE id=?").get(eligible.id); n++) {
      try { await custodyErasureOwner(f.owner.custody).cleanupNeverAcceptedBatch(await beginMaintenance(f.owner)); } finally { await settleMaintenance(f.owner); }
    }
    expect(f.db.prepare("SELECT active,custodyStarted FROM reservations WHERE id=?").get(unknown.id)).toEqual({ active: 1, custodyStarted: null });
    expect(f.db.prepare("SELECT 1 FROM reservations WHERE id=?").get(eligible.id)).toBeUndefined();
  });
  it("retains a failed actual final release and charge until resource-only finishing and reinspection", async () => {
    const original = TestIngressAuthority.prototype.released; let fail = true;
    vi.spyOn(TestIngressAuthority.prototype, "released").mockImplementation(async function (this: TestIngressAuthority, lease) {
      if (fail) throw new Error("private failed release canary"); return original.call(this, lease);
    });
    const f = await aborted(), scanner = custodyErasureOwner(f.owner.custody); let stopped: MaintenanceRun | undefined;
    for (let n = 0; !stopped && n < 30; n++) {
      const run = await beginMaintenance(f.owner);
      try { await scanner.cleanupNeverAcceptedBatch(run); } catch (error) { expect(error).toMatchObject({ message: "INGRESS_RECOVERY_REQUIRED" }); stopped = run; }
      if (!stopped) await settleMaintenance(f.owner);
    }
    expect(stopped).toBeDefined(); await expect(lstat(f.path)).rejects.toMatchObject({ code: "ENOENT" });
    expect(f.db.prepare("SELECT remainingCharge FROM cleanup_manifests WHERE slot='incoming-sealed'").get()).toEqual({ remainingCharge: 9 });
    await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
    fail = false; expect(await finishMaintenanceNeverAcceptedResources(stopped!, f.owner.custody)).toEqual({ consumedItems: 2 });
    expect(f.db.prepare("SELECT remainingCharge FROM cleanup_manifests WHERE slot='incoming-sealed'").get()).toEqual({ remainingCharge: 9 });
    await settleMaintenance(f.owner); await cleanupAll(f.owner);
  });
  it("never prunes actual accepted finalized zero manifests or their exact older inventory references", async () => {
    const f = await setup(), accepted = await f.accept(); f.advance(7 * 86400000); await refreshTestRepository(f.owner.repository);
    const erasure = erasureOwner(f.owner.repository), event = await f.owner.repository.withCaseLock(accepted.accepted.id, async () => {
      const value = erasure.prepareCommit(accepted.accepted.id, "processing_payload"); erasure.acknowledge(value, await erasure.journal!.append(value)); return value;
    });
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    let complete = false;
    for (let n = 0; !complete && n < 100; n++) {
      try { complete = (await custodyErasureOwner(f.owner.custody).eraseScopeBatch(event[1], await beginMaintenance(f.owner))).complete; } finally { await settleMaintenance(f.owner); }
    }
    expect(complete).toBe(true);
    const before = f.db.prepare("SELECT * FROM erasure_manifests").all(); expect(before.length).toBeGreaterThan(0);
    const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow); await scanAll(restarted.owner); await prune(restarted.owner);
    const db = connections.all.at(-1)!; expect(db.prepare("SELECT * FROM erasure_manifests").all()).toEqual(before);
    expect(db.pragma("foreign_key_check")).toEqual([]);
    for (const m of before as { scanPass: string; journalId: string; slot: string; leaf: string }[]) expect(db.prepare("SELECT 1 FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").get(m.scanPass, m.journalId, m.slot, m.leaf)).toBeDefined();
  });
  it("replaces exact obsolete accepted inventory duplicates while preserving the live source and current pass", async () => {
    const f = await setup(), accepted = await f.accept();
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    const old = (f.db.prepare("SELECT scanPass FROM erasure_maintenance").get() as { scanPass: string }).scanPass;
    const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow); await scanAll(restarted.owner);
    const db = connections.all.at(-1)!, before = db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass!=?").all(old);
    expect(before.length).toBeGreaterThan(0); expect(await prune(restarted.owner)).toBeGreaterThan(0);
    expect(db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass!=?").all(old)).toEqual(before);
    expect(db.prepare("SELECT 1 FROM erasure_inventory_journals WHERE pass=?").get(old)).toBeUndefined();
    expect(db.prepare("SELECT id FROM cases WHERE id=?").get(accepted.accepted.id)).toBeDefined();
    expect(await readFile(accepted.record.encryptedPayloadPath)).toBeDefined();
  });
  it("binds scanner-only duplicate dependence to the actual current pass and normalized entry",async()=>{
    const original=custodyComposition.bindCustodyErasure;
    let hooks:Parameters<typeof original>[3]|undefined;
    vi.spyOn(custodyComposition,"bindCustodyErasure").mockImplementation((...args)=>{hooks=args[3];return original(...args);});
    const f=await setup(),accepted=await f.accept();bindMaintenance(f.owner,f.services,f.monotonicNow);await scanAll(f.owner);
    const old=(f.db.prepare("SELECT scanPass FROM erasure_maintenance").get() as {scanPass:string}).scanPass;
    const restarted=await f.restart();bindMaintenance(restarted.owner,restarted.services,f.monotonicNow);await scanAll(restarted.owner);
    const db=connections.all.at(-1)!,pass=(db.prepare("SELECT scanPass FROM erasure_maintenance").get() as {scanPass:string}).scanPass;
    const journal=db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND caseId=?").get(pass,accepted.accepted.id) as InventoryJournal;
    expect(hooks!.cleanupDependency(journal.journalId)).toBe(true);
    expect(hooks!.duplicateInventoryDependency(journal,pass)).toEqual({blocked:false,consumedItems:12});
    expect(hooks!.duplicateInventoryDependency(journal,old)).toEqual({blocked:true,consumedItems:12});
    expect(hooks!.duplicateInventoryDependency({...journal,budget:journal.budget+1},pass)).toEqual({blocked:true,consumedItems:12});
    expect(await readFile(accepted.record.encryptedPayloadPath)).toBeDefined();
  });
  it("never promotes an ordinary private entry through repeated original scanner hydration",async()=>{
    const f=await setup();await f.accept();bindMaintenance(f.owner,f.services,f.monotonicNow);await scanAll(f.owner);
    const scanner=custodyErasureOwner(f.owner.custody),old=(f.db.prepare("SELECT scanPass FROM erasure_maintenance").get() as {scanPass:string}).scanPass;
    const before=f.db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=?").all(old);
    let run=await beginMaintenance(f.owner);await scanner.invalidateAndClose(run);await settleMaintenance(f.owner);
    run=await beginMaintenance(f.owner);await scanner.startFreshPass(run);await settleMaintenance(f.owner);await scanAll(f.owner);
    expect((f.db.prepare("SELECT scanPass FROM erasure_maintenance").get() as {scanPass:string}).scanPass).not.toBe(old);
    await prune(f.owner);
    expect(f.db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=?").all(old)).toEqual(before);
    expect(f.db.prepare("SELECT 1 FROM erasure_inventory_journals WHERE pass=?").get(old)).toBeDefined();
  });
  it.each(["changed", "private-entry"] as const)("retains duplicate bookkeeping with %s dependence", async reason => {
    const f = await setup(); await f.accept(); bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner);
    const current = (f.db.prepare("SELECT scanPass FROM erasure_maintenance").get() as { scanPass: string }).scanPass;
    const old = "0".repeat(32);
    const journals = f.db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=?").all(current) as Record<string, unknown>[];
    const objects = f.db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=?").all(current) as Record<string, unknown>[];
    for (const [table, rows] of [["erasure_inventory_journals", journals], ["erasure_inventory_objects", objects]] as const) for (const row of rows) {
      const keys = Object.keys(row); f.db.prepare(`INSERT INTO ${table}(${keys.join(",")}) VALUES(${keys.map(key => `@${key}`).join(",")})`).run({ ...row, pass: old });
    }
    if (reason === "changed") f.db.prepare("UPDATE erasure_inventory_objects SET size=size+1 WHERE pass=? AND slot='original-sealed'").run(old);
    if (reason === "private-entry") {
      const before = f.db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=?").all(old);
      await prune(f.owner); expect(f.db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=?").all(old)).toEqual(before);
      expect(f.db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=?").all(current)).toEqual(objects);
    } else {
      const changed = f.db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND slot='original-sealed'").get(old);
      const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow); await scanAll(restarted.owner); await prune(restarted.owner);
      expect(connections.all.at(-1)!.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND slot='original-sealed'").get(old)).toEqual(changed);
    }
  });
  it("keeps unknown source provenance unknown and the original reservation association immutable", async () => {
    const f = await setup(), reservation = f.owner.repository.reserve(input(f));
    expect(() => f.db.prepare("UPDATE reservations SET expiresAt=? WHERE id=?").run("2030-01-01T00:00:00.000Z", reservation.id)).toThrow("IMMUTABLE_CLEANUP_SOURCE");
    const trigger = f.db.prepare("SELECT sql FROM sqlite_master WHERE name='cleanup_source_monotonic'").get() as { sql: string };
    f.db.exec("DROP TRIGGER cleanup_source_monotonic");
    f.db.prepare("UPDATE reservations SET custodyStarted=NULL WHERE id=?").run(reservation.id);
    f.db.exec(trigger.sql);
    expect(() => f.db.prepare("UPDATE reservations SET custodyStarted=0 WHERE id=?").run(reservation.id)).toThrow("IMMUTABLE_CLEANUP_SOURCE");
    f.owner.repository.releaseReservation(reservation.id);
    expect(f.db.prepare("SELECT custodyStarted FROM reservations WHERE id=?").get(reservation.id)).toEqual({ custodyStarted: null });
  });
  it("retains an expired acquired source and its original headroom during unrelated admission", async () => {
    const f = await setup(), reservation = await f.owner.custody.reserve(input(f), testReadiness);
    f.advance(86400001); await refreshTestRepository(f.owner.repository);
    f.owner.repository.reserve(input(f, "unrelated"));
    expect(f.db.prepare("SELECT active,reservedBytes FROM reservations WHERE id=?").get(reservation.id)).toEqual({ active: 1, reservedBytes: 20000 });
  });
  it("retains acquired source through ordinary original repository reconstruction", async () => {
    const f = await setup(), reservation = await f.owner.custody.reserve(input(f), testReadiness);
    f.owner.repository.close();
    openTestRepository(join(f.root, "registry.sqlite"), f.owner.clock);
    expect(connections.all.at(-1)!.prepare("SELECT active,reservedBytes FROM reservations WHERE id=?").get(reservation.id)).toEqual({ active: 1, reservedBytes: 20000 });
  });
  it("captures authenticated abort but returns pending without deleting the actual owned file or source", async () => {
    const f = await setup(), request = input(f), reservation = await f.owner.custody.reserve(request, testReadiness);
    const path = join(f.config.intakeRoot, `${reservation.id}.enc`);
    await writeFile(path, Buffer.from("synthetic-private-canary"), { mode: 0o640 });
    await expect(f.owner.custody.abortIntake(reservation.id, request.sessionHash)).rejects.toThrow("CUSTODY_NOT_READY");
    expect(await readFile(path, "utf8")).toBe("synthetic-private-canary");
    expect(f.db.prepare("SELECT active,reservedBytes FROM reservations WHERE id=?").get(reservation.id)).toEqual({ active: 1, reservedBytes: 20000 });
    expect(f.owner.custody.getIntakeReadiness().ready).toBe(false);
  });
  it("retains source when prepare acquired a real generation but its reply was lost", async () => {
    const f = await setup(), original = f.authority.prepare.bind(f.authority);
    let id = "";
    vi.spyOn(f.authority, "prepare").mockImplementation(async (...args) => {
      id = args[0]; await original(...args); throw new Error("synthetic-private-prepare-canary");
    });
    await expect(f.owner.custody.reserve(input(f), testReadiness)).rejects.toThrow();
    expect(id).not.toBe("");
    expect(f.db.prepare("SELECT active,reservedBytes FROM reservations WHERE id=?").get(id)).toEqual({ active: 1, reservedBytes: 20000 });
  });
  it.each([false, true])("retains a distinct replay loser pending with exact winner binding (conflict=%s)", async conflict => {
    const f = await setup(), accepted = await f.accept();
    const request = { ...input(f, "custody-lifetime"), sessionHash: digest("a".repeat(64)) };
    const reservation = await f.owner.custody.reserve(request, testReadiness), path = join(f.config.intakeRoot, `${reservation.id}.enc`);
    await copyFile(accepted.record.encryptedPayloadPath, path); await chmod(path, 0o640);
    await expect(f.owner.custody.commitIntake({ reservationId: reservation.id, digest: conflict ? digest("f".repeat(64)) : accepted.record.digest, encryptedPayloadPath: path, actualBytes: accepted.record.actualBytes, encryptedName: "synthetic", job: "sales-fulltime", now: request.now })).rejects.toThrow("WORKER_UNAVAILABLE");
    const winner = f.db.prepare("SELECT reservationId FROM cases WHERE id=?").get(accepted.accepted.id) as { reservationId: string };
    expect(f.db.prepare("SELECT active,cleanupDisposition,cleanupWinner FROM reservations WHERE id=?").get(reservation.id)).toEqual({ active: 1, cleanupDisposition: "replay-loser", cleanupWinner: winner.reservationId });
    expect(await readFile(path)).toEqual(await readFile(accepted.record.encryptedPayloadPath));
    expect(f.owner.custody.getIntakeReadiness().ready).toBe(false);
    expect(f.db.pragma("foreign_key_list(reservations)")).toContainEqual(expect.objectContaining({ from: "cleanupWinner", table: "reservations", to: "id", on_delete: "NO ACTION" }));
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner); await cleanupAll(f.owner);
    expect(f.db.prepare("SELECT 1 FROM reservations WHERE id=?").get(reservation.id)).toBeUndefined();
    expect(await readFile(accepted.record.encryptedPayloadPath)).toHaveLength(accepted.record.actualBytes);
  });
  it("expiry reports pending and retains the unaccepted named inode until bounded cleanup", async () => {
    const f = await setup(), reservation = await f.owner.custody.reserve(input(f), testReadiness);
    const path = join(f.config.intakeRoot, `${reservation.id}.enc`); await writeFile(path, "synthetic", { mode: 0o640 });
    f.advance(86400001);
    expect(await f.owner.custody.settleIngress({ kind: "expired" })).toMatchObject({ complete: false, pending: 1 });
    expect(await readFile(path, "utf8")).toBe("synthetic");
    bindMaintenance(f.owner, f.services, f.monotonicNow); await scanAll(f.owner); await cleanupAll(f.owner);
    await expect(lstat(path)).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("performs real bounded abort erasure and only then retires its source", async () => {
    const f = await setup(), request = input(f), reservation = await f.owner.custody.reserve(request, testReadiness);
    const path = join(f.config.intakeRoot, `${reservation.id}.enc`); await writeFile(path, "synthetic", { mode: 0o640 });
    await f.owner.custody.abortIntake(reservation.id, request.sessionHash).catch(() => {});
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    let scanned = false;
    for (let n = 0; !scanned && n < 100; n++) {
      scanned = (await custodyErasureOwner(f.owner.custody).scanBatch(await beginMaintenance(f.owner))).complete;
      await settleMaintenance(f.owner);
    }
    expect(scanned).toBe(true);
    let complete = false;
    for (let n = 0; !complete && n < 100; n++) {
      try { complete = (await custodyErasureOwner(f.owner.custody).cleanupNeverAcceptedBatch(await beginMaintenance(f.owner))).complete; }
      finally { await settleMaintenance(f.owner); }
    }
    expect(complete).toBe(true);
    await expect(readFile(path)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(f.config.custodyRoot, `${reservation.id}.journal`))).rejects.toMatchObject({ code: "ENOENT" });
    expect(f.db.prepare("SELECT 1 FROM reservations WHERE id=?").get(reservation.id)).toBeUndefined();
    expect(f.db.prepare("SELECT 1 FROM erasure_obligations").get()).toBeUndefined();
  });
  it.each(["unlink-after-success", "parent-fsync", "holders-released", "absent-synced", "metadata-finalized", "journal-scrub"] as const)("recovers actual %s interruption under independent normalized N authority", async fault => {
    const f = await aborted(); let fired = false;
    const unlink = fs.unlink, open = fs.open, prepare = f.db.prepare.bind(f.db);
    if (fault === "unlink-after-success" || fault === "journal-scrub") vi.spyOn(fs, "unlink").mockImplementation(async path => {
      await unlink(path);
      if (!fired && path === (fault === "journal-scrub" ? join(f.config.custodyRoot, `${f.reservation.id}.journal`) : f.path)) { fired = true; throw new Error("private unlink canary"); }
    });
    else if (fault === "parent-fsync") vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      const fd = await open(...args);
      if (args[0] === f.config.intakeRoot) { const sync = fd.sync.bind(fd); vi.spyOn(fd, "sync").mockImplementation(async () => { if (!fired) { fired = true; throw new Error("private fsync canary"); } await sync(); }); }
      return fd;
    });
    else vi.spyOn(f.db, "prepare").mockImplementation(sql => {
      const statement = prepare(sql);
      if (sql.startsWith("UPDATE cleanup_manifests SET phase=")) {
        const run = statement.run.bind(statement);
        vi.spyOn(statement, "run").mockImplementation((...args: unknown[]) => { if (!fired && args[0] === fault && args[4] === "incoming-sealed") { fired = true; throw new Error("private transaction canary"); } return run(...args); });
      }
      return statement;
    });
    await expect(cleanupAll(f.owner)).rejects.toThrow("MAINTENANCE_COMMAND_FAILED"); expect(fired).toBe(true);
    expect(f.db.prepare("SELECT active FROM reservations WHERE id=?").get(f.reservation.id)).toEqual({ active: 1 });
    const old = f.db.prepare("SELECT remainingCharge FROM cleanup_manifests WHERE slot=?").get(fault === "journal-scrub" ? "journal" : "incoming-sealed") as { remainingCharge: number };
    expect(old.remainingCharge).toBeGreaterThan(0);
    vi.restoreAllMocks(); const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow);
    await scanAll(restarted.owner); await cleanupAll(restarted.owner);
    expect(await readdir(f.config.custodyRoot)).toEqual([]); expect(await readdir(f.config.intakeRoot)).toEqual([]);
    expect(connections.all.at(-1)!.prepare("SELECT 1 FROM reservations WHERE id=?").get(f.reservation.id)).toBeUndefined();
  });
  it("keeps actual failed target close and its charge until exact resource-only finishing", async () => {
    const f = await aborted(), open = fs.open; let failed = false;
    let handle: Awaited<ReturnType<typeof fs.open>> | undefined;
    vi.spyOn(fs, "open").mockImplementation(async (...args) => {
      const fd = await open(...args);
      if (args[0] === f.path && !failed) {
        const close = fd.close.bind(fd); handle = fd;
        vi.spyOn(fd, "close").mockImplementation(async () => { if (!failed) { failed = true; throw new Error("private close canary"); } await close(); });
      }
      return fd;
    });
    let stopped: MaintenanceRun | undefined;
    for (let n = 0; !stopped && n < 30; n++) {
      const run = await beginMaintenance(f.owner);
      try { await custodyErasureOwner(f.owner.custody).cleanupNeverAcceptedBatch(run); }
      catch (error) { expect(error).toMatchObject({ message: "MAINTENANCE_COMMAND_FAILED" }); stopped = run; }
      if (!stopped) await settleMaintenance(f.owner);
    }
    expect(stopped).toBeDefined(); expect(await handle!.stat()).toMatchObject({ size: 9 });
    const old = f.db.prepare("SELECT phase,remainingCharge FROM cleanup_manifests WHERE slot='incoming-sealed'").get();
    expect(old).toEqual({ phase: "planned", remainingCharge: 9 });
    await expect(settleMaintenance(f.owner)).rejects.toThrow("MAINTENANCE_SETTLEMENT_UNCERTAIN");
    expect(() => f.owner.repository.close()).toThrow();
    expect(await finishMaintenanceNeverAcceptedResources(stopped!, f.owner.custody)).toEqual({ consumedItems: 1 });
    expect(f.db.prepare("SELECT phase,remainingCharge FROM cleanup_manifests WHERE slot='incoming-sealed'").get()).toEqual(old);
    expect(maintenanceSnapshot(f.owner)?.consumedItems).toBeLessThanOrEqual(1000);
    await settleMaintenance(f.owner); await cleanupAll(f.owner); await expect(lstat(f.path)).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("atomically transfers a still-positive same-inode cleanup plan to the fresh pass before retrying unlink", async () => {
    const f = await aborted(), unlink = fs.unlink;
    vi.spyOn(fs, "unlink").mockImplementation(async path => { if (path === f.path) throw new Error("synthetic interruption"); await unlink(path); });
    await expect(cleanupAll(f.owner)).rejects.toThrow("MAINTENANCE_COMMAND_FAILED");
    const old = f.db.prepare("SELECT * FROM cleanup_manifests WHERE slot='incoming-sealed'").get() as { scanPass: string; remainingCharge: number; expectedInode: number };
    expect(old.remainingCharge).toBe(9);
    vi.restoreAllMocks(); const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow); await scanAll(restarted.owner);
    const db = connections.all.at(-1)!;
    await prune(restarted.owner);
    expect(db.prepare("SELECT * FROM cleanup_manifests WHERE slot='incoming-sealed'").get()).toEqual(old);
    expect(db.prepare("SELECT 1 FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot='incoming-sealed'").get(old.scanPass, f.reservation.id)).toBeDefined();
    vi.spyOn(fs, "unlink").mockImplementation(async path => { if (path === f.path) throw new Error("synthetic repeated interruption"); await unlink(path); });
    await expect(cleanupAll(restarted.owner)).rejects.toThrow("MAINTENANCE_COMMAND_FAILED");
    const next = db.prepare("SELECT * FROM cleanup_manifests WHERE slot='incoming-sealed'").get() as typeof old;
    expect(next.scanPass).not.toBe(old.scanPass); expect(next.remainingCharge).toBe(9); expect(next.expectedInode).toBe(old.expectedInode);
    expect((await lstat(f.path)).ino).toBe(old.expectedInode);
    vi.restoreAllMocks(); await cleanupAll(restarted.owner);
  });
  it("expires obsolete intake inventory only after fresh combined EOF and positive exact generation release", async () => {
    const f = await aborted(); await cleanupAll(f.owner);
    expect(f.db.prepare("SELECT 1 FROM erasure_inventory_journals LIMIT 1").get()).toBeDefined();
    const restarted = await f.restart(); bindMaintenance(restarted.owner, restarted.services, f.monotonicNow); await scanAll(restarted.owner);
    const db = connections.all.at(-1)!;
    for (let n = 0; n < 10 && db.prepare("SELECT 1 FROM erasure_inventory_journals LIMIT 1").get(); n++) {
      try { await custodyErasureOwner(restarted.owner.custody).pruneInventoryBatch(await beginMaintenance(restarted.owner)); }
      finally { await settleMaintenance(restarted.owner); }
    }
    expect(db.prepare("SELECT 1 FROM erasure_inventory_journals LIMIT 1").get()).toBeUndefined();
    expect(db.prepare("SELECT 1 FROM erasure_inventory_objects LIMIT 1").get()).toBeUndefined();
    expect(db.pragma("foreign_key_check")).toEqual([]);
  });
});
