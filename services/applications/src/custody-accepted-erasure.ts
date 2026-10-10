import { constants, type Stats, type Dir } from "node:fs";
import { lstat, open, opendir, type FileHandle } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ApplicationRepository, CustodyConfig, CustodyLedger, IngressEvidence } from "./types";
import type { AcceptedCandidate, AcceptedOperands, InventoryJournal, PhysicalCompletion, createCustodyInventoryStorage } from "./erasure-storage";
import type { CustodyObservation, Observation } from "./custody-erasure";
import { erasureOwner } from "./erasure-repository";
import { assertMaintenance, assertMaintenanceCustodyIdentity, assertMaintenanceSettled, closeCustodyHandle, maintenanceCommand, maintenanceRemaining, observeCustodyHandle, type MaintenanceRun } from "./worker-maintenance";

type IO = <T>(action: () => Promise<T>) => Promise<T>;
export interface AcceptedHooks {
  exclusive<T>(action: () => Promise<T>): Promise<T>;
  track<T>(action: () => Promise<T>): Promise<T>;
  ingress(journal: Readonly<InventoryJournal>, operation: "observe" | "quiesce" | "released"): Promise<IngressEvidence>;
  forget(journal: Readonly<InventoryJournal>): Promise<number>;
  privateRevision(): number;
  privateReady(): boolean;
}
interface Composition {
  custody: CustodyLedger; repository: ApplicationRepository; config: CustodyConfig;
  storage: ReturnType<typeof createCustodyInventoryStorage>; hooks: AcceptedHooks;
  ancestryMaximum: number;
  coverage(run: MaintenanceRun, io: IO): Promise<string>;
  checkCoverage(): void;
  remove(candidate: AcceptedCandidate, run: MaintenanceRun, io: IO): Promise<void>;
  mint(run: MaintenanceRun, value: Observation): CustodyObservation;
}
function fail(): never { throw new Error("ERASURE_OWNERSHIP_INVALID"); }
function matches(stat: Stats, value: AcceptedOperands, removedChildren?: number) {
  const expected = value.manifest, object = value.object;
  const directoryDelta = object.slot === "processing-directory" && removedChildren !== undefined && stat.size <= (expected?.expectedSize ?? object.size!) && stat.nlink <= object.nlink! && object.nlink! - stat.nlink <= removedChildren && (removedChildren > 0 || (stat.size === object.size && stat.nlink === object.nlink));
  return stat.dev === (expected?.expectedDevice ?? object.device) && stat.ino === (expected?.expectedInode ?? object.inode) && (directoryDelta || stat.size === (expected?.expectedSize ?? object.size) && stat.nlink === object.nlink) && stat.uid === object.uid && stat.gid === object.gid && (stat.mode & 0o7777) === object.mode && (object.type === "directory" ? stat.isDirectory() : stat.isFile());
}
// One original queue and at most one admitted object. This helper owns neither
// a repository nor a runtime hold; all authority is borrowed from composition.
export function createAcceptedErasure(c: Composition) {
  let target: FileHandle | undefined, parent: FileHandle | undefined;
  let directory: Dir | undefined;
  let ingressPending: { journal: Readonly<InventoryJournal>; operation: "quiesce" | "released" } | undefined;
  let active = false;
  let resourceRun: MaintenanceRun | undefined;
  let completion: { commit: string; pass: string; fingerprint: string; revision: number } | undefined;
  let reinspect = false;
  const proofs = new WeakMap<PhysicalCompletion, { completion: NonNullable<typeof completion>; run: MaintenanceRun; guard: object }>();
  const roots = { custody: c.config.custodyRoot, incoming: c.config.intakeRoot, runtime: c.config.runtimeRoot };
  const idle = () => !active && !target && !parent && !directory && !ingressPending;
  async function closeDirectory(io: IO) { if (directory) { await io(() => directory!.close()); directory = undefined; } }
  async function close(which: "target" | "parent", io: IO) {
    const handle = which === "target" ? target : parent;
    if (!handle) return;
    await io(() => closeCustodyHandle(handle));
    if (which === "target") target = undefined; else parent = undefined;
  }
  async function ingress(journal: Readonly<InventoryJournal>, operation: "quiesce" | "released", io: IO) {
    ingressPending = { journal, operation };
    const evidence = await io(() => c.hooks.ingress(journal, operation));
    await io(async () => {
      if (operation === "released" ? evidence.state !== "released" : !["quiescent", "released"].includes(evidence.state)) throw new Error("INGRESS_RECOVERY_REQUIRED");
    });
    ingressPending = undefined; return evidence;
  }
  async function finishResources(run: MaintenanceRun): Promise<number> {
    if (active || (resourceRun && resourceRun !== run)) throw new Error("MAINTENANCE_WORK_ACTIVE");
    return c.hooks.track(() => c.hooks.exclusive(async () => {
      let consumedItems = 0;
      const io: IO = async action => { consumedItems++; return action(); };
      await close("target", io); await close("parent", io); await closeDirectory(io);
      if (ingressPending) await ingress(ingressPending.journal, ingressPending.operation, io);
      if (idle()) resourceRun = undefined;
      return consumedItems;
    }));
  }
  async function eraseScopeBatch(commit: string, run: MaintenanceRun) {
    assertMaintenanceCustodyIdentity(run, c.repository, c.custody);
    if (completion) reinspect = true;
    completion = undefined;
    assertMaintenanceSettled(run, c.repository);
    if (!idle()) throw new Error("MAINTENANCE_WORK_ACTIVE");
    let consumedItems = 0, complete = false;
    // All branches are precharged conservatively together: guard20, selector45,
    // plan75, rebind80, three phases63, source60, <=8 ancestry sweeps, and140
    // for <=20 exact child probes/companions, native/lease/private-copy work,
    // restart13 and completion14. A failed command retains this reservation.
    const maximum = 20 + 45 + 75 + 80 + 63 + 60 + 8 * c.ancestryMaximum + 140;
    if (maximum > 1000) throw new Error("MAINTENANCE_BUDGET_INSUFFICIENT");
    return c.hooks.track(async () => {
      active = true;
      try {
        while (!complete && maintenanceRemaining(run, c.repository).items >= maximum) {
          const result = await maintenanceCommand(run, c.repository, maximum, "filesystem", () => erasureOwner(c.repository).withErasureGuard(commit, () => c.hooks.exclusive(async () => {
            let used = 20;
            const io: IO = async action => { used++; return action(); };
            const pass = await c.coverage(run, io);
            if (reinspect) { used += c.storage.restartAccepted(commit, run); reinspect = false; }
            const selected = c.storage.nextAccepted(commit, run); used += selected.consumedItems;
            if (!selected.candidate) {
              if (selected.exhausted) {
                const checked = c.storage.verifyCompletionWork(commit, run); used += checked.consumedItems;
                completion = { commit, pass, fingerprint: checked.fingerprint, revision: c.hooks.privateRevision() };
              }
              return { value: selected.exhausted, consumedItems: used };
            }
            const candidate = selected.candidate;
            let value = c.storage.readAccepted(candidate, run);
            const path = join(roots[value.object.root], value.relativePath);
            resourceRun = run;
            const stat = async () => {
              try { return await io(() => lstat(path)); }
              catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined; throw error; }
            };
            const before = await stat();
            let removedChildren: number | undefined;
            if (before && value.manifest && value.object.slot === "processing-directory") {
              const companions = c.storage.directoryCompanions(candidate, run); used += companions.consumedItems;
              removedChildren = companions.leaves.length;
              if (!matches(before, value, removedChildren)) fail();
              for (const leaf of companions.leaves) {
                try { await io(() => lstat(join(path, leaf))); fail(); }
                catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error; }
              }
              directory = await io(() => opendir(path, { bufferSize: 1 }));
              try { if (await io(() => directory!.read())) fail(); }
              finally { await closeDirectory(io); }
              parent = observeCustodyHandle(await io(() => open(path, constants.O_RDONLY | constants.O_NOFOLLOW)));
              try { if (!matches(await io(() => parent!.stat()), value, removedChildren)) fail(); await io(() => parent!.sync()); }
              finally { await close("parent", io); }
              const fresh = await stat(); if (!fresh || !matches(fresh, value, removedChildren)) fail();
            }
            if (before && !matches(before, value, removedChildren)) fail();
            if (selected.planning) {
              if (value.object.presence === "present" ? !before : !!before) fail();
              if (value.journal.kind === "intake") {
                const evidence = await io(() => c.hooks.ingress(value.journal, "observe")); used++;
                if (value.object.slot === "incoming-sealed" && (evidence.chargedBytes !== value.object.chargedBytes || (before ? evidence.object?.dev !== before.dev || evidence.object?.ino !== before.ino : evidence.object !== null))) fail();
              }
              await c.coverage(run, io);
              used += c.storage.planAccepted(c.mint(run, { kind: "accepted-plan", pass, candidate }), run);
              return { value: false, consumedItems: used };
            }
            if (!value.manifest) fail();
            if (before && value.manifest.remainingCharge === 0) { used += 3; if (!c.storage.isInitialZero(candidate, run)) fail(); }
            used += c.storage.checkAcceptedSource(candidate, run);
            let released: IngressEvidence | undefined;
            if (value.journal.kind === "intake") {
              released = await ingress(value.journal, "quiesce", io);
              if (value.object.slot === "incoming-sealed" && ((before && (released.object?.dev !== before.dev || released.object?.ino !== before.ino)) || (value.manifest.remainingCharge === 0 && released.chargedBytes !== 0))) fail();
            }
            if (value.manifest.scanPass !== pass && before && value.object.slot !== "processing-directory") {
              await c.coverage(run, io);
              used += c.storage.rebindAccepted(c.mint(run, { kind: "accepted-rebind", pass, candidate }), run);
              value = c.storage.readAccepted(candidate, run);
            }
            if (before) {
              target = observeCustodyHandle(await io(() => open(path, constants.O_RDONLY | constants.O_NOFOLLOW)));
              try { if (!matches(await io(() => target!.stat()), value, removedChildren)) fail(); }
              finally { await close("target", io); }
            }
            await c.coverage(run, io);
            used += c.storage.advanceAccepted(c.mint(run, { kind: "accepted-holders", pass, candidate }), run);
            assertMaintenance(run, c.repository, "filesystem");
            const boundary = await stat();
            if (boundary && !matches(boundary, value, removedChildren)) fail();
            if (boundary) await c.remove(candidate, run, io);
            if (await stat()) fail();
            let parentPath = dirname(path), parentIdentity: Stats;
            try { parentIdentity = await io(() => lstat(parentPath)); }
            catch (error) {
              if (!(error instanceof Error && "code" in error && error.code === "ENOENT") || value.object.slot !== "processing-file") throw error;
              used += c.storage.absentParent(candidate, run); parentPath = c.config.runtimeRoot; parentIdentity = await io(() => lstat(parentPath));
            }
            parent = observeCustodyHandle(await io(() => open(parentPath, constants.O_RDONLY | constants.O_NOFOLLOW)));
            try { const parentStat = await io(() => parent!.stat()); if (!parentStat.isDirectory() || parentStat.dev !== parentIdentity.dev || parentStat.ino !== parentIdentity.ino || parentStat.mode !== parentIdentity.mode || parentStat.uid !== parentIdentity.uid || parentStat.gid !== parentIdentity.gid) fail(); await io(() => parent!.sync()); }
            finally { await close("parent", io); }
            if (await stat()) fail();
            if (value.journal.kind === "intake") released = await ingress(value.journal, "released", io);
            await c.coverage(run, io);
            used += c.storage.advanceAccepted(c.mint(run, { kind: "accepted-absent", pass, candidate }), run);
            if (value.object.slot === "journal") { used += await c.hooks.forget(value.journal); if (value.journal.kind === "intake" && released?.state !== "released") fail(); }
            used += c.storage.advanceAccepted(c.mint(run, { kind: "accepted-final", pass, candidate }), run);
            return { value: false, consumedItems: used };
          })));
          consumedItems += result.consumedItems; complete = result.value;
        }
        return Object.freeze({ complete, consumedItems });
      } catch (error) { completion = undefined; reinspect = true; throw error; }
      finally { active = false; }
    });
  }
  c.storage.bindPhysicalVerifier(Object.freeze({
    maximumItems: c.ancestryMaximum + 36,
    async verify(commit: string, run: MaintenanceRun) {
      assertMaintenanceCustodyIdentity(run, c.repository, c.custody);
      const before = c.storage.verifyCompletionWork(commit, run);
      if (!completion || completion.commit !== commit || completion.pass !== before.pass || completion.fingerprint !== before.fingerprint || completion.revision !== c.hooks.privateRevision() || !idle() || !c.hooks.privateReady()) fail();
      const expected = completion;
      return c.hooks.track(() => c.hooks.exclusive(async () => {
        let consumedItems = before.consumedItems + 3;
        const io: IO = async action => { consumedItems++; return action(); };
        const pass = await c.coverage(run, io), after = c.storage.verifyCompletionWork(commit, run); consumedItems += after.consumedItems + 3;
        if (completion !== expected || pass !== expected.pass || after.fingerprint !== expected.fingerprint || before.guard !== after.guard || expected.revision !== c.hooks.privateRevision() || !idle() || !c.hooks.privateReady()) fail();
        const proof = Object.freeze({}) as PhysicalCompletion; proofs.set(proof, { completion: expected, run, guard: after.guard });
        return Object.freeze({ proof, consumedItems });
      })).catch(error => { completion = undefined; reinspect = true; throw error; });
    },
    consume(proof: PhysicalCompletion, commit: string, run: MaintenanceRun) {
      const value = proofs.get(proof); proofs.delete(proof);
      c.checkCoverage();
      const current = c.storage.verifyCompletionWork(commit, run);
      if (!value || value.run !== run || value.guard !== current.guard || value.completion !== completion || !completion || completion.commit !== commit || completion.pass !== current.pass || completion.fingerprint !== current.fingerprint || completion.revision !== c.hooks.privateRevision() || !idle() || !c.hooks.privateReady()) fail();
      return current.consumedItems + 3;
    },
  }));
  return Object.freeze({ eraseScopeBatch, finishResources, idle });
}
