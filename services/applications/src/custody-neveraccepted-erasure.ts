import { lstat } from "node:fs/promises";
import type { Stats } from "node:fs";
import { dirname, join } from "node:path";
import type { ApplicationRepository, CustodyConfig, CustodyLedger } from "./types";
import type { AcceptedHooks } from "./custody-accepted-erasure";
import type { CustodyObservation, Observation } from "./custody-erasure";
import { cleanupSourceOwner, type CleanupCandidate, type CleanupOperands } from "./cleanup-storage";
import type { InventoryJournal } from "./erasure-storage";
import { createPhysicalResources, type PhysicalIO } from "./custody-physical-resources";
import { assertMaintenance, assertMaintenanceCustodyIdentity, assertMaintenanceSettled, maintenanceCommand, maintenanceRemaining, type MaintenanceRun } from "./worker-maintenance";

interface Composition {
  custody: CustodyLedger; repository: ApplicationRepository; config: CustodyConfig;
  hooks: AcceptedHooks & { cleanupDependency(id: string): boolean; duplicateInventoryDependency(journal:Readonly<InventoryJournal>,pass:string): {blocked:boolean;consumedItems:number} };
  ancestryMaximum: number;
  coverage(run: MaintenanceRun, io: PhysicalIO): Promise<string>;
  remove(candidate: CleanupCandidate, run: MaintenanceRun, io: PhysicalIO): Promise<void>;
  mint(run: MaintenanceRun, value: Observation): CustodyObservation;
}
function fail(): never { throw new Error("ERASURE_OWNERSHIP_INVALID"); }
function matches(stat: Stats, value: CleanupOperands) {
  const m = value.manifest, o = value.object;
  return stat.isFile() && stat.nlink === 1 && stat.dev === (m?.expectedDevice ?? o.device) && stat.ino === (m?.expectedInode ?? o.inode) && stat.size === (m?.expectedSize ?? o.size) && stat.uid === o.uid && stat.gid === o.gid && (stat.mode & 0o7777) === o.mode;
}
export function createNeverAcceptedErasure(c: Composition) {
  const storage = cleanupSourceOwner(c.custody).inventory, resources = createPhysicalResources(c.hooks);
  const roots = { incoming: c.config.intakeRoot, custody: c.config.custodyRoot, runtime: c.config.runtimeRoot };
  let active = false, resourceRun: MaintenanceRun | undefined, reinspect = false;
  const idle = () => !active && resources.idle();
  async function finishResources(run: MaintenanceRun) {
    if (active || resourceRun !== run) throw new Error("MAINTENANCE_WORK_ACTIVE");
    return c.hooks.track(() => c.hooks.exclusive(async () => {
      let used = 0; const io: PhysicalIO = async action => { used++; return action(); };
      await resources.close("target", io); await resources.close("parent", io); await resources.finishIngress(io);
      if (idle()) resourceRun = undefined; return used;
    }));
  }
  async function cleanupNeverAcceptedBatch(run: MaintenanceRun) {
    assertMaintenanceCustodyIdentity(run, c.repository, c.custody);
    assertMaintenanceSettled(run, c.repository);
    if (!idle()) throw new Error("MAINTENANCE_WORK_ACTIVE");
    // Fixed selector40 + plan25 or verify25/three source phases150/retire40,
    // four coverage sweeps, native/lease/descriptor/private-copy<=50, and
    // conservative validation/retry reserve. No accepted guard or event cost.
    const maximum = 420 + 8 * c.ancestryMaximum;
    if (maximum > 1000) throw new Error("MAINTENANCE_BUDGET_INSUFFICIENT");
    return c.hooks.track(async () => {
      active = true; let consumedItems = 0, complete = false;
      try {
        while (!complete && maintenanceRemaining(run, c.repository).items >= maximum && maintenanceRemaining(run, c.repository).selections > 0) {
          const result = await maintenanceCommand(run, c.repository, maximum, "filesystem", () => c.hooks.exclusive(async () => {
            let used = 0; const io: PhysicalIO = async action => { used++; return action(); };
            const pass = await c.coverage(run, io);
            if (reinspect) { storage.restart(); used++; reinspect = false; }
            const selected = storage.next(run); used += selected.consumedItems;
            if (!selected.candidate) return { value: selected.complete, consumedItems: used };
            const candidate = selected.candidate;
            let value = storage.read(candidate, run);
            const path = join(roots[value.object.root], value.relativePath);
            resourceRun = run;
            const stat = async () => {
              try { return await io(() => lstat(path)); }
              catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined; throw error; }
            };
            const before = await stat();
            if (before && !matches(before, value)) fail();
            const evidence = await io(() => c.hooks.ingress(value.journal, "observe")); used++;
            if (value.object.slot === "incoming-sealed" && ((before ? evidence.object?.dev !== before.dev || evidence.object?.ino !== before.ino : evidence.object !== null) || (value.manifest?.remainingCharge === 0 && evidence.chargedBytes !== 0))) fail();
            if (selected.planning) {
              if ((value.object.presence === "present") !== !!before || (value.object.slot === "incoming-sealed" && evidence.chargedBytes !== value.object.chargedBytes)) fail();
              await c.coverage(run, io);
              used += storage.plan(c.mint(run, { kind: "cleanup-plan", pass, candidate }), run);
              return { value: false, consumedItems: used };
            }
            if (!value.manifest) fail();
            if (before && value.manifest.remainingCharge === 0) { used += 3; if (!storage.initialZero(candidate, run)) fail(); }
            used += storage.verify(candidate, run);
            if (selected.retiring) {
              if (before || evidence.state !== "released" || evidence.chargedBytes !== 0 || evidence.object !== null || c.hooks.cleanupDependency(value.journal.journalId)) fail();
              await c.coverage(run, io);
              used += storage.retire(c.mint(run, { kind: "cleanup-retire", pass, candidate }), run);
              return { value: false, consumedItems: used };
            }
            const quiescent = await resources.ingress(value.journal, "quiesce", io);
            if (value.object.slot === "incoming-sealed" && before && (quiescent.object?.dev !== before.dev || quiescent.object?.ino !== before.ino)) fail();
            if (before && value.manifest.scanPass !== pass) {
              if (value.object.slot === "incoming-sealed" && quiescent.chargedBytes !== value.manifest.remainingCharge) fail();
              await c.coverage(run, io);
              used += storage.rebind(c.mint(run, { kind: "cleanup-rebind", pass, candidate }), run);
              value = storage.read(candidate, run);
            }
            if (before) {
              const target = await resources.open("target", path, io);
              try { if (!matches(await io(() => target.stat()), value)) fail(); } finally { await resources.close("target", io); }
            }
            await c.coverage(run, io);
            used += storage.phase(c.mint(run, { kind: "cleanup-holders", pass, candidate }), run);
            const boundary = await stat();
            if (boundary && !matches(boundary, value)) fail();
            used += storage.verify(candidate, run); assertMaintenance(run, c.repository, "filesystem");
            if (boundary) await c.remove(candidate, run, io);
            if (await stat()) fail();
            const parentPath = dirname(path), parentIdentity = await io(() => lstat(parentPath));
            const parent = await resources.open("parent", parentPath, io);
            try {
              const actual = await io(() => parent.stat());
              if (!actual.isDirectory() || actual.dev !== parentIdentity.dev || actual.ino !== parentIdentity.ino || actual.mode !== parentIdentity.mode || actual.uid !== parentIdentity.uid || actual.gid !== parentIdentity.gid) fail();
              await io(() => parent.sync());
            } finally { await resources.close("parent", io); }
            if (await stat()) fail();
            await resources.ingress(value.journal, "released", io);
            await c.coverage(run, io);
            used += storage.phase(c.mint(run, { kind: "cleanup-absent", pass, candidate }), run);
            if (value.object.slot === "journal") used += await c.hooks.forget(value.journal);
            used += storage.phase(c.mint(run, { kind: "cleanup-final", pass, candidate }), run);
            return { value: false, consumedItems: used };
          }));
          consumedItems += result.consumedItems; complete = result.value;
        }
        return Object.freeze({ complete, consumedItems });
      } catch (error) { reinspect = true; throw error; }
      finally { active = false; }
    });
  }
  async function pruneInventoryBatch(run: MaintenanceRun) {
    assertMaintenanceCustodyIdentity(run, c.repository, c.custody); assertMaintenanceSettled(run, c.repository);
    if (!idle()) throw new Error("MAINTENANCE_WORK_ACTIVE");
    // Two fixed source/dependency sweeps40+50, three root/hold coverage sweeps,
    // observe/validation2 and original private point checks, fairness included;
    // two duplicate-only current private observation checks reserve12 each.
    const maximum = 129 + 3 * c.ancestryMaximum;
    if (maximum > 1000) throw new Error("MAINTENANCE_BUDGET_INSUFFICIENT");
    return c.hooks.track(async () => {
      active = true; let examined = 0, removed = 0, consumedItems = 0;
      try {
        while (maintenanceRemaining(run, c.repository).items >= maximum && maintenanceRemaining(run, c.repository).selections > 0) {
          const result = await maintenanceCommand(run, c.repository, maximum, "filesystem", () => c.hooks.exclusive(async () => {
            let used = 0; const io: PhysicalIO = async action => { used++; return action(); };
            const pass = await c.coverage(run, io), selected = storage.selectPrune(run); used += selected.consumedItems;
            const dependent=()=>{
              if(!selected.journal)return false;
              if(selected.kind!=="duplicate")return c.hooks.cleanupDependency(selected.journal.journalId);
              const result=c.hooks.duplicateInventoryDependency(selected.journal,pass);used+=result.consumedItems;return result.blocked;
            };
            let kind: "cleanup-prune-released" | "cleanup-prune-duplicate" | "cleanup-prune-blocked" | "cleanup-prune-scan" = "cleanup-prune-blocked";
            if (selected.kind === "scan") kind = "cleanup-prune-scan";
            if (selected.journal && !dependent()) {
              used++;
              if (selected.kind === "duplicate") kind = "cleanup-prune-duplicate";
              else if (selected.kind === "released-intake") {
                try {
                  const evidence = await io(() => c.hooks.ingress(selected.journal!, "observe")); used++;
                  if (evidence.state === "released" && evidence.chargedBytes === 0 && evidence.object === null) kind = "cleanup-prune-released";
                } catch { /* Unknown exact generation retains bookkeeping; no native retry is started. */ }
              }
            }
            await c.coverage(run, io);
            if (selected.journal && dependent()) kind = "cleanup-prune-blocked";
            used++;
            const result = storage.prune(c.mint(run, { kind, pass, candidate: selected.candidate }), run); used += result.consumedItems;
            return { value: { examined: selected.examined, removed: result.removed }, consumedItems: used };
          }));
          examined += result.value.examined; removed += result.value.removed; consumedItems += result.consumedItems;
        }
        return Object.freeze({ examined, removed, consumedItems });
      } finally { active = false; }
    });
  }
  return Object.freeze({ cleanupNeverAcceptedBatch, pruneInventoryBatch, idle, finishResources });
}
