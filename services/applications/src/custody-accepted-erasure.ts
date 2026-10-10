import { type Stats, type Dir } from "node:fs";
import { lstat, opendir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ApplicationId, ApplicationRepository, CustodyConfig, CustodyLedger, IngressEvidence } from "./types";
import type { AcceptedCandidate, AcceptedOperands, InventoryJournal, PhysicalCompletion, createCustodyInventoryStorage } from "./erasure-storage";
import type { CustodyObservation, Observation } from "./custody-erasure";
import { erasureOwner } from "./erasure-repository";
import { assertMaintenance, assertMaintenanceCustodyIdentity, assertMaintenanceSettled, maintenanceCommand, maintenanceRemaining, type MaintenanceRun } from "./worker-maintenance";
import { createPhysicalResources } from "./custody-physical-resources";

type IO = <T>(action: () => Promise<T>) => Promise<T>;
export interface AcceptedHooks {
  exclusive<T>(action: () => Promise<T>): Promise<T>;
  track<T>(action: () => Promise<T>): Promise<T>;
  ingress(journal: Readonly<InventoryJournal>, operation: "observe" | "quiesce" | "released"): Promise<IngressEvidence>;
  forget(journal: Readonly<InventoryJournal>): Promise<number>;
  privateRevision(): number;
  privateReady(): boolean;
  inspectCopies(caseId: ApplicationId, reservationId: string | null): { complete: boolean; consumedItems: number };
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
  const resources = createPhysicalResources(c.hooks);
  let directory: Dir | undefined;
  let active = false;
  let resourceRun: MaintenanceRun | undefined;
  let completion: { commit: string; pass: string; fingerprint: string; revision: number } | undefined;
  let reinspect = false;
  const proofs = new WeakMap<PhysicalCompletion, { completion: NonNullable<typeof completion>; run: MaintenanceRun; guard: object }>();
  let inspection: { fingerprint: string; pass: string; revision: number; key: [string,string,string,string]; reservationKey: string; reservationsDone: boolean; objectsDone: boolean; copiesDone: boolean } | undefined;
  const inspectionProofs = new WeakMap<PhysicalCompletion, { state: NonNullable<typeof inspection>; run: MaintenanceRun; guard: object }>();
  const roots = { custody: c.config.custodyRoot, incoming: c.config.intakeRoot, runtime: c.config.runtimeRoot };
  const idle = () => !active && resources.idle() && !directory;
  async function closeDirectory(io: IO) { if (directory) { await io(() => directory!.close()); directory = undefined; } }
  const close = resources.close, ingress = resources.ingress;
  async function finishResources(run: MaintenanceRun): Promise<number> {
    if (active || (resourceRun && resourceRun !== run)) throw new Error("MAINTENANCE_WORK_ACTIVE");
    return c.hooks.track(() => c.hooks.exclusive(async () => {
      let consumedItems = 0;
      const io: IO = async action => { consumedItems++; return action(); };
      await close("target", io); await close("parent", io); await closeDirectory(io); await resources.finishIngress(io);
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
    // Guard20, selector70, max(plan100,rebind110), three phases120, source85,
    // <=8 ancestry sweeps, and160. Planning returns before execution/rebind,
    // so those two storage blocks cannot occur in the same admitted unit.
    // for <=20 exact child probes/companions, native/lease/private-copy work,
    // restart31 and completion32. A failed command retains this reservation.
    const maximum = 20 + 70 + Math.max(100, 110) + 120 + 85 + 8 * c.ancestryMaximum + 160;
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
              const parent = await resources.open("parent", path, io);
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
              const target = await resources.open("target", path, io);
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
            const parent = await resources.open("parent", parentPath, io);
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
  const verifier = Object.freeze({
    maximumItems: c.ancestryMaximum + 72,
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
    inspectionMaximum: 2 * c.ancestryMaximum + 236,
    async inspect(commit: string, run: MaintenanceRun) {
      assertMaintenanceCustodyIdentity(run, c.repository, c.custody);
      const before = c.storage.inspectionWork(commit,run);
      if (!before.rowOnly && !before.reduced) return verifier.verify(before.physical.commitEventId,run);
      return c.hooks.track(() => c.hooks.exclusive(async () => {
        let consumedItems = before.consumedItems;
        const io: IO = async action => { consumedItems++; return action(); };
        const pass = await c.coverage(run,io), revision = c.hooks.privateRevision();
        if (!idle() || !c.hooks.privateReady()) fail();
        if (!inspection || inspection.fingerprint !== before.fingerprint || inspection.pass !== pass || inspection.revision !== revision) inspection = { fingerprint: before.fingerprint,pass,revision,key:["","","",""],reservationKey:"",reservationsDone:before.reservationId!==null,objectsDone:before.rowOnly,copiesDone:before.rowOnly };
        const expected = inspection;
        if(!expected.reservationsDone) {
          const selected=c.storage.inspectionReservation(expected.reservationKey,before.work); consumedItems+=selected.consumedItems;
          if(selected.next)expected.reservationKey=selected.next;else expected.reservationsDone=true;
        }
        if (!expected.copiesDone) {
          const copies = c.hooks.inspectCopies(before.work.caseId,before.reservationId); consumedItems += copies.consumedItems;
          expected.copiesDone = copies.complete;
        }
        if (!expected.objectsDone) {
          const selected = c.storage.inspectionObject(expected.key,before.work.caseId); consumedItems += selected.consumedItems;
          if (selected.value) {
            const value = selected.value, path = join(roots[value.object.root],value.relativePath);
            try { await io(() => lstat(path)); fail(); }
            catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error; }
            if (value.journal.kind === "intake") {
              const evidence = await io(() => c.hooks.ingress(value.journal,"observe")); consumedItems++;
              if (evidence.state !== "released" || evidence.chargedBytes !== 0 || evidence.object !== null) fail();
            }
            const parent = await resources.open("parent",roots[value.object.root],io);
            try { await io(() => parent!.sync()); } finally { await resources.close("parent",io); }
          }
          if (selected.next) expected.key = selected.next; else expected.objectsDone = true;
        }
        await c.coverage(run,io);
        const after = c.storage.inspectionWork(commit,run); consumedItems += after.consumedItems;
        if (after.fingerprint !== before.fingerprint || after.guard !== before.guard || c.hooks.privateRevision() !== revision || !idle() || !c.hooks.privateReady()) fail();
        if (!expected.objectsDone || !expected.copiesDone || !expected.reservationsDone) return Object.freeze({proof:null,consumedItems});
        const proof = Object.freeze({}) as PhysicalCompletion;
        inspectionProofs.set(proof,{state:expected,run,guard:after.guard});
        return Object.freeze({proof,consumedItems});
      })).catch(error => { inspection = undefined; throw error; });
    },
    consumeInspection(proof: PhysicalCompletion, commit: string, run: MaintenanceRun) {
      const current = c.storage.inspectionWork(commit,run);
      if (!current.rowOnly && !current.reduced) return current.consumedItems + verifier.consume(proof,current.physical.commitEventId,run);
      const value = inspectionProofs.get(proof); inspectionProofs.delete(proof); c.checkCoverage();
      if (!value || value.run !== run || value.guard !== current.guard || value.state !== inspection || current.fingerprint !== inspection.fingerprint || current.pass !== inspection.pass || c.hooks.privateRevision() !== inspection.revision || !idle() || !c.hooks.privateReady()) fail();
      return current.consumedItems + 4;
    },
  });
  c.storage.bindPhysicalVerifier(verifier);
  return Object.freeze({ eraseScopeBatch, finishResources, idle });
}
