import { afterEach, describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { copyFile, lstat, readdir, readFile, rm, writeFile, rename, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import type { Dir } from "node:fs";
import { maintenanceFixture, deferred } from "./fixtures/maintenance";
import { beginMaintenance, bindMaintenance, maintenanceSnapshot, settleMaintenance, selectMaintenance, closeCustodyHandle, closeMaintenanceScanIterators } from "../src/worker-maintenance";
import { custodyErasureOwner, consumeCustodyObservation, type CustodyObservation } from "../src/custody-erasure";
import { createCustodyLedger } from "../src/custody";
import { createCustodyInventoryStorage } from "../src/erasure-storage";
import type { FileHandle } from "node:fs/promises";
import type { MaintenanceRun } from "../src/worker-maintenance";
import type { CustodyLedger, WorkerOwner } from "../src/types";
import { digest, utcInstant } from "../src/types";
import { testAdmission, testReadiness } from "./fixtures/admission";

const connections = vi.hoisted(() => ({ all: [] as Database.Database[] }));
const observationProbe = vi.hoisted(() => ({ record: undefined as ((token: CustodyObservation, run: MaintenanceRun, custody: CustodyLedger) => void) | undefined }));
vi.mock("../src/erasure-storage", async original => {
  const actual = await original<typeof import("../src/erasure-storage")>();
  return { ...actual, createCustodyInventoryStorage(...args: Parameters<typeof actual.createCustodyInventoryStorage>) {
    const storage = actual.createCustodyInventoryStorage(...args);
    return { ...storage, record(token: CustodyObservation, run: MaintenanceRun) { observationProbe.record?.(token, run, args[2]); return storage.record(token, run); } };
  } };
});
vi.mock("node:fs/promises", async original => ({ ...await original<typeof import("node:fs/promises")>() }));
vi.mock("better-sqlite3", async original => {
  const actual = await original<{ default: typeof Database }>();
  return { default: class extends actual.default { constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); connections.all.push(this); } } };
});
const fixtures: Awaited<ReturnType<typeof maintenanceFixture>>[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  observationProbe.record = undefined;
  for (const f of fixtures) await settleMaintenance(f.owner).catch(() => {});
  for (const db of connections.all.splice(0)) if (db.open) db.close();
  for (const f of fixtures.splice(0)) await rm(f.root, { recursive: true, force: true });
});
async function setup(startup?: "ordinary" | "cold-maintenance") {
  const f = await maintenanceFixture(startup); fixtures.push(f);
  return { ...f, db: connections.all.at(-1)! };
}
describe("bounded original-custody erasure", () => {
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
    expect(f.db.prepare("SELECT count(*) n FROM erasure_inventory_objects").get()).toEqual({ n: 42 });
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
    expect(f.db.prepare("SELECT count(*) n FROM erasure_inventory_objects").get()).toEqual({ n: 2 });
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
    expect(f.db.prepare("SELECT count(*) n FROM erasure_inventory_objects").get()).toEqual({ n: 2 });
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
