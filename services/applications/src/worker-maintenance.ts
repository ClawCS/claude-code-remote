import type { ApplicationRepository, Clock, CustodyConfig, CustodyLedger, DatabaseIncarnation, RuntimeMaintenanceExclusion, WorkerOwner, WorkerServices } from "./types";
import { utcInstant } from "./types";
import { AsyncLocalStorage } from "node:async_hooks";
import type { FileHandle } from "node:fs/promises";

// Internal descriptor observation only, installed by the original custody
// lifetime. No observer flag is accepted as release evidence: close runs here.
interface ResourceObserver { acquired(handle: FileHandle): void; released(handle: FileHandle): void }
const resourceContext = new AsyncLocalStorage<ResourceObserver>();
const resourceOwners = new WeakMap<FileHandle, ResourceObserver>();
export function withCustodyResourceTracking<T>(observer: ResourceObserver, action: () => Promise<T>): Promise<T> { return resourceContext.run(observer, action); }
export function observeCustodyHandle(handle: FileHandle): FileHandle {
  const observer = resourceContext.getStore();
  if (observer) {
    const original = resourceOwners.get(handle);
    if (original && original !== observer) throw new Error("CUSTODY_RESOURCE_OWNER_MISMATCH");
    resourceOwners.set(handle, observer); observer.acquired(handle);
  }
  return handle;
}
export async function closeCustodyHandle(handle: FileHandle): Promise<void> {
  await handle.close();
  resourceOwners.get(handle)?.released(handle); resourceOwners.delete(handle);
}

// Private composition only. Original constructors register these exact objects.
interface Lifetime { origin?: "ordinary" | "cold-maintenance"; inhibit(): void; settle(): Promise<void>; idle(): boolean; finalReady?(): void; ordinaryReady?(): boolean; reopen?(): void; releaseReady?(): boolean; finishForDrain?(run: MaintenanceRun): Promise<void>; closeReady?(): boolean; closeScanIterators?(): Promise<number>; finishAcceptedResources?(run: MaintenanceRun): Promise<number>; finishNeverAcceptedResources?(run: MaintenanceRun): Promise<number> }
const repositories = new WeakMap<ApplicationRepository, Lifetime & { clock: Clock }>();
const custodians = new WeakMap<CustodyLedger, Lifetime & { repository: ApplicationRepository; clock: Clock; config?: CustodyConfig }>();
const bindings = new WeakMap<WorkerOwner, Binding>();
const repositoryOwners = new WeakMap<ApplicationRepository, WorkerOwner>();
const custodyOwners = new WeakMap<CustodyLedger, WorkerOwner>();
declare const runBrand: unique symbol;
export interface MaintenanceRun { readonly [runBrand]: true }
interface Run {
  binding: Binding; token: MaintenanceRun; start: number; consumed: number;
  selected: Set<string>; failed: boolean; accepting: boolean; pending: Set<Promise<unknown>>;
}
interface Binding {
  owner: WorkerOwner; repository: ApplicationRepository; custody: CustodyLedger; clock: Clock;
  repo: Lifetime; files: Lifetime; services: WorkerServices; monotonic: () => number; last: number;
  holdMethod: WorkerServices["holdMaintenance"]; assertMethod: WorkerServices["assertMaintenanceHeld"];
  releaseMethod: WorkerServices["releaseMaintenance"]; settleMethod: WorkerServices["settle"];
  sanitationMethod: WorkerServices["assertDatabaseSanitationBaseline"];
  ordinaryMethod?: WorkerServices["assertOrdinaryReady"];
  released?: boolean; reopened?: boolean; draining?: boolean;
  closing?: Promise<void>;
  cycles: Set<Promise<unknown>>;
  exclusion?: object;
  hold?: RuntimeMaintenanceExclusion; acquisition?: Promise<void>; settlement?: Promise<void>; current?: Run; lastRun?: Run;
  started: boolean; settled: boolean; uncertain: boolean; journal?: { settle(): Promise<void> };
}
const runs = new WeakMap<MaintenanceRun, Run>();
const journals = new WeakMap<ApplicationRepository, { settle(): Promise<void> } | undefined>();
function fail(code: string): never { throw new Error(code); }
const commandErrors = new Set(["ERASURE_UNKNOWN_OBJECT", "ERASURE_OWNERSHIP_INVALID", "ERASURE_JOURNAL_INVALID", "ERASURE_ASSOCIATION_INVALID", "ERASURE_ROOT_CHANGED", "INGRESS_RECOVERY_REQUIRED", "ERASURE_CLAIM_ACTIVE", "ERASURE_NOT_DUE", "ERASURE_PENDING", "ERASURE_FINAL_EVIDENCE_REQUIRED", "ERASURE_PAYLOAD_COVERAGE_REQUIRED", "ERASURE_UNVERIFIED", "ERASURE_ADMISSION_UNAVAILABLE", "ERASURE_SANITATION_REQUIRED", "MAINTENANCE_DEADLINE", "MAINTENANCE_HOLD_LOST", "MAINTENANCE_RUN_STOPPED", "MAINTENANCE_SELECTION_LIMIT", "AUTH_DENIED"]);
export function registerMaintenanceRepository(repository: ApplicationRepository, clock: Clock, lifetime: Lifetime, journal?: { settle(): Promise<void> }): void {
  if (repositories.has(repository)) fail("MAINTENANCE_ALREADY_OWNED");
  repositories.set(repository, { ...lifetime, clock }); journals.set(repository, journal);
}
export function registerMaintenanceCustody(custody: CustodyLedger, repository: ApplicationRepository, clock: Clock, lifetime: Lifetime, config?: CustodyConfig): void {
  if (custodians.has(custody)) fail("MAINTENANCE_ALREADY_OWNED");
  custodians.set(custody, { ...lifetime, repository, clock, config });
}
export function assertOriginalMaintenanceCustody(custody: CustodyLedger, repository: ApplicationRepository, config: CustodyConfig): void {
  const files = custodians.get(custody);
  if (!files || files.repository !== repository || files.clock !== config.clock || files.config !== config) fail("MAINTENANCE_OWNER_MISMATCH");
}
// Finishing only: the original registration supplies this one closed operation.
// No fresh admission, callback, path, success flag or allowance is accepted.
export async function closeMaintenanceScanIterators(token: MaintenanceRun, custody: CustodyLedger): Promise<Readonly<{ consumedItems: number }>> {
  const r = current(token), b = r.binding;
  if (b.custody !== custody || r.pending.size || b.settlement || !b.files.closeScanIterators) fail("MAINTENANCE_WORK_ACTIVE");
  held(b);
  if (1000 - r.consumed < 2) fail("MAINTENANCE_BUDGET_INSUFFICIENT");
  r.consumed += 2;
  const task = b.files.closeScanIterators().then(consumedItems => {
    if (!Number.isSafeInteger(consumedItems) || consumedItems < 0 || consumedItems > 2) fail("MAINTENANCE_ACCOUNTING_INVALID");
    r.consumed -= 2 - consumedItems; held(b); return Object.freeze({ consumedItems });
  }).catch(() => { r.failed = true; r.accepting = false; fail("MAINTENANCE_COMMAND_FAILED"); });
  r.pending.add(task);
  try { return await task; } finally { r.pending.delete(task); }
}
// R108: at most two retained file closes, one directory iterator close and one already-started ingress
// operation plus its validation. This cannot select an object or advance a phase.
export async function finishMaintenanceAcceptedResources(token: MaintenanceRun, custody: CustodyLedger): Promise<Readonly<{ consumedItems: number }>> {
  return finishPhysicalResources(token, custody, "accepted");
}
export async function finishMaintenanceNeverAcceptedResources(token: MaintenanceRun, custody: CustodyLedger): Promise<Readonly<{ consumedItems: number }>> {
  return finishPhysicalResources(token, custody, "never-accepted");
}
async function finishPhysicalResources(token: MaintenanceRun, custody: CustodyLedger, kind: "accepted" | "never-accepted"): Promise<Readonly<{ consumedItems: number }>> {
  const r = current(token), b = r.binding;
  const finish = kind === "accepted" ? b.files.finishAcceptedResources : b.files.finishNeverAcceptedResources;
  const maximum = kind === "accepted" ? 5 : 4;
  if (b.custody !== custody || r.pending.size || b.settlement || !finish) fail("MAINTENANCE_WORK_ACTIVE");
  held(b);
  if (1000 - r.consumed < maximum) fail("MAINTENANCE_BUDGET_INSUFFICIENT");
  r.consumed += maximum;
  const task = finish(token).then(consumedItems => {
    if (!Number.isSafeInteger(consumedItems) || consumedItems < 0 || consumedItems > maximum) fail("MAINTENANCE_ACCOUNTING_INVALID");
    r.consumed -= maximum - consumedItems; held(b); return Object.freeze({ consumedItems });
  }).catch(() => { r.failed = true; r.accepting = false; fail("MAINTENANCE_COMMAND_FAILED"); });
  r.pending.add(task);
  try { return await task; } finally { r.pending.delete(task); }
}
export function bindMaintenance(owner: WorkerOwner, services: WorkerServices, monotonic: () => number = () => performance.now()): void {
  if (bindings.has(owner) || repositoryOwners.has(owner.repository) || custodyOwners.has(owner.custody)) fail("MAINTENANCE_ALREADY_BOUND");
  const repo = repositories.get(owner.repository), files = custodians.get(owner.custody);
  if (!repo || !files || files.repository !== owner.repository || repo.clock !== owner.clock || files.clock !== owner.clock) fail("MAINTENANCE_OWNER_MISMATCH");
  if (!services || typeof services.settle !== "function" || typeof services.close !== "function" || typeof services.holdMaintenance !== "function" || typeof services.assertMaintenanceHeld !== "function" || typeof services.releaseMaintenance !== "function") fail("MAINTENANCE_UNAVAILABLE");
  let last: number; try { last = monotonic(); } catch { fail("MAINTENANCE_CLOCK_INVALID"); }
  if (!Number.isFinite(last) || last < 0) fail("MAINTENANCE_CLOCK_INVALID");
  const b: Binding = { owner, repository: owner.repository, custody: owner.custody, clock: owner.clock, repo, files, services, monotonic, last, holdMethod: services.holdMaintenance, assertMethod: services.assertMaintenanceHeld, releaseMethod: services.releaseMaintenance, settleMethod: services.settle, sanitationMethod: services.assertDatabaseSanitationBaseline, ordinaryMethod: services.assertOrdinaryReady, cycles: new Set(), started: false, settled: false, uncertain: false, journal: journals.get(owner.repository) };
  bindings.set(owner, b); repositoryOwners.set(owner.repository, owner); custodyOwners.set(owner.custody, owner);
}
function binding(owner: WorkerOwner): Binding {
  const b = bindings.get(owner); if (!b || owner.repository !== b.repository || owner.custody !== b.custody || owner.clock !== b.clock) fail("MAINTENANCE_OWNER_MISMATCH"); return b;
}
export function maintenanceOrigin(owner: WorkerOwner): "ordinary" | "cold-maintenance" {
  const origin = binding(owner).repo.origin;
  if (!origin) fail("MAINTENANCE_OWNER_MISMATCH");
  return origin;
}
function tick(b: Binding): number {
  let value: number; try { value = b.monotonic(); } catch { b.uncertain = true; fail("MAINTENANCE_CLOCK_INVALID"); }
  if (!Number.isFinite(value) || value < b.last) { b.uncertain = true; fail("MAINTENANCE_CLOCK_INVALID"); } b.last = value; return value;
}
function held(b: Binding): void {
  binding(b.owner);
  try {
    if (b.uncertain || !b.hold || b.services.holdMaintenance !== b.holdMethod || b.services.assertMaintenanceHeld !== b.assertMethod || b.services.releaseMaintenance !== b.releaseMethod || b.services.settle !== b.settleMethod) throw new Error();
    b.assertMethod!.call(b.services, b.owner, b.hold);
  } catch { b.uncertain = true; fail("MAINTENANCE_HOLD_LOST"); }
}
function released(b: Binding): void {
  binding(b.owner);
  if (b.uncertain || !b.released || b.draining || b.services.holdMaintenance !== b.holdMethod || b.services.assertMaintenanceHeld !== b.assertMethod || b.services.releaseMaintenance !== b.releaseMethod || b.services.settle !== b.settleMethod || !b.ordinaryMethod || b.services.assertOrdinaryReady !== b.ordinaryMethod) fail("MAINTENANCE_HOLD_LOST");
}
async function settleOwners(b: Binding): Promise<void> {
  // Each owner retains entire scopes, including finally work enqueued later.
  let failed = false;
  for (const settle of [() => b.settleMethod.call(b.services), () => b.files.settle(), () => b.repo.settle(), () => b.journal?.settle()]) {
    try { await settle(); if (b.released) released(b); else if (b.hold) held(b); } catch { failed = true; }
  }
  if (failed) fail("MAINTENANCE_SETTLEMENT_UNCERTAIN");
  if (!b.files.idle() || !b.repo.idle()) fail("MAINTENANCE_WORK_ACTIVE");
}
export function beginMaintenance(owner: WorkerOwner): Promise<MaintenanceRun> {
  return begin(owner, false);
}
function begin(owner: WorkerOwner, closing: boolean): Promise<MaintenanceRun> {
  const b = binding(owner); if (b.current || b.settlement) fail("MAINTENANCE_RUN_ACTIVE");
  if (b.draining && !closing) fail("MAINTENANCE_RUN_STOPPED");
  if (b.reopened) { b.reopened = false; b.released = false; b.acquisition = undefined; b.hold = undefined; }
  if (b.uncertain) fail("MAINTENANCE_HOLD_LOST");
  const token = Object.freeze({}) as MaintenanceRun;
  const run: Run = { binding: b, token, start: tick(b), consumed: 0, selected: new Set(), failed: false, accepting: true, pending: new Set() };
  runs.set(token, run); b.current = run; b.lastRun = run; b.started = true; b.settled = false;
  b.repo.inhibit(); b.files.inhibit(); // Synchronous, before acquisition/waits.
  const start = (async () => {
    if (b.released) { released(b); await settleOwners(b); released(b); return token; }
    if (!b.acquisition) b.acquisition = (async () => {
      try { const hold = await b.holdMethod!.call(b.services, owner); if (!hold || typeof hold !== "object") throw new Error(); b.hold = hold; held(b); b.exclusion = Object.freeze({}); }
      catch { b.uncertain = true; fail("MAINTENANCE_HOLD_LOST"); }
    })();
    await b.acquisition; held(b); await settleOwners(b); held(b); return token;
  })();
  run.pending.add(start);
  void start.then(() => run.pending.delete(start), () => { run.pending.delete(start); run.failed = true; run.accepting = false; });
  return start;
}
function current(token: MaintenanceRun, repository?: ApplicationRepository): Run {
  const run = runs.get(token);
  if (!run || run.binding.current !== run || (repository && run.binding.repository !== repository)) fail("MAINTENANCE_RUN_INVALID"); return run;
}
export function assertMaintenanceCustodyIdentity(run: MaintenanceRun, repository: ApplicationRepository, custody: CustodyLedger): void {
  if (current(run, repository).binding.custody !== custody) fail("MAINTENANCE_OWNER_MISMATCH");
}
export function originalMaintenanceCustody(run: MaintenanceRun, repository: ApplicationRepository): CustodyLedger {
  assertMaintenance(run, repository); return current(run, repository).binding.custody;
}
export function originalMaintenanceExclusion(run: MaintenanceRun, repository: ApplicationRepository): object {
  assertMaintenance(run,repository); const value = current(run,repository).binding.exclusion;
  if (!value) fail("MAINTENANCE_HOLD_LOST"); return value;
}
export function originalMaintenanceJournal(run: MaintenanceRun, repository: ApplicationRepository): object {
  assertMaintenance(run, repository, "journal");
  const journal = current(run, repository).binding.journal;
  if (!journal) fail("MAINTENANCE_UNAVAILABLE");
  return journal;
}
export function assertDatabaseSanitationBaseline(run: MaintenanceRun, repository: ApplicationRepository, target: DatabaseIncarnation): void {
  assertMaintenance(run,repository); const b=current(run,repository).binding;
  if (!b.sanitationMethod || b.services.assertDatabaseSanitationBaseline !== b.sanitationMethod) fail("ERASURE_SANITATION_REQUIRED");
  try { b.sanitationMethod.call(b.services,b.owner,b.hold!,target); }
  catch { fail("ERASURE_SANITATION_REQUIRED"); }
  assertMaintenance(run,repository);
}
type Phase = "scalar" | "journal" | "filesystem" | "post-release";
export function assertMaintenance(run: MaintenanceRun, repository: ApplicationRepository, phase: Phase = "scalar"): void {
  const r = current(run, repository);
  if (r.binding.released) { released(r.binding); if (phase !== "journal" && phase !== "post-release") fail("MAINTENANCE_RUN_STOPPED"); }
  else held(r.binding);
  if (!r.accepting || r.failed) fail("MAINTENANCE_RUN_STOPPED");
  const remaining = 120000 - (tick(r.binding) - r.start), minimum = phase === "journal" ? 65000 : phase === "filesystem" ? 40000 : 0;
  if (remaining <= 0 || remaining < minimum) { r.accepting = false; fail("MAINTENANCE_DEADLINE"); }
}
export function maintenanceReadPhase(run: MaintenanceRun, repository: ApplicationRepository): "scalar" | "post-release" {
  return current(run, repository).binding.released ? "post-release" : "scalar";
}
export function maintenanceRemaining(run: MaintenanceRun, repository: ApplicationRepository, phase: Phase = "scalar"): Readonly<{ items: number; selections: number; now: string }> {
  assertMaintenance(run, repository, phase); const r = current(run);
  let now: string; try { now = utcInstant(r.binding.clock.now().toISOString()); } catch { r.failed = true; fail("MAINTENANCE_CLOCK_INVALID"); }
  return Object.freeze({ items: 1000 - r.consumed, selections: 20 - r.selected.size, now });
}
export function selectMaintenance(run: MaintenanceRun, repository: ApplicationRepository, key: string, phase: Phase = "scalar"): void {
  assertMaintenance(run, repository, phase); const r = current(run);
  if (!r.selected.has(key) && r.selected.size >= 20) fail("MAINTENANCE_SELECTION_LIMIT"); r.selected.add(key);
}
export function assertMaintenanceSettled(run: MaintenanceRun, repository: ApplicationRepository): void {
  assertMaintenance(run, repository); const b = current(run).binding;
  if (!b.files.idle() || !b.repo.idle()) fail("MAINTENANCE_WORK_ACTIVE");
}
// Accounting only: no DB/custody mutation capability is granted here. Closed
// owner commands supply fixed code and query-derived worst-case reservations.
export async function maintenanceCommand<T>(token: MaintenanceRun, repository: ApplicationRepository, maximum: number, phase: Phase, action: () => Promise<{ value: T; consumedItems: number }> | { value: T; consumedItems: number }): Promise<Readonly<{ value: T; consumedItems: number }>> {
  const r = current(token, repository); assertMaintenance(token, repository, phase);
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > 1000 - r.consumed) fail("MAINTENANCE_BUDGET_INSUFFICIENT");
  r.consumed += maximum;
  const task = (async () => { assertMaintenance(token, repository, phase); return action(); })().then(result => {
    // Late completion is retained and recorded, not treated as cancellation.
    if (!Number.isSafeInteger(result.consumedItems) || result.consumedItems < 0 || result.consumedItems > maximum) fail("MAINTENANCE_ACCOUNTING_INVALID");
    r.consumed -= maximum - result.consumedItems; if (r.binding.released) released(r.binding); else held(r.binding); return Object.freeze(result);
  }).catch(error => { r.failed = true; r.accepting = false; throw new Error(error instanceof Error && commandErrors.has(error.message) ? error.message : "MAINTENANCE_COMMAND_FAILED"); });
  r.pending.add(task);
  try { return await task; } finally { r.pending.delete(task); }
}
export async function releaseMaintenanceForRecheck(run: MaintenanceRun, repository: ApplicationRepository): Promise<void> {
  const b = current(run, repository).binding;
  await maintenanceCommand(run, repository, 20, "scalar", () => {
    if (b.repo.origin !== "ordinary" || b.draining || !b.ordinaryMethod || b.services.assertOrdinaryReady !== b.ordinaryMethod || !b.repo.finalReady || !b.files.releaseReady?.() || !b.files.ordinaryReady?.()) fail("MAINTENANCE_RUN_STOPPED");
    b.repo.finalReady(); return { value: undefined, consumedItems: 20 };
  });
  await maintenanceCommand(run, repository, 1, "filesystem", async () => {
    // Unknown release is terminal for this handle. Keep producer denial and
    // ownership even if the service reports failure after a physical release.
    try { await b.releaseMethod!.call(b.services, b.owner, b.hold!); }
    catch { b.uncertain = true; fail("MAINTENANCE_HOLD_LOST"); }
    b.released = true;
    return { value: undefined, consumedItems: 1 };
  });
}
export async function reopenMaintenance(run: MaintenanceRun, repository: ApplicationRepository): Promise<void> {
  const b = current(run, repository).binding;
  await maintenanceCommand(run, repository, 20, "post-release", () => {
    released(b);
    if (b.repo.origin !== "ordinary" || !b.repo.finalReady || !b.repo.ordinaryReady?.() || !b.files.ordinaryReady?.() || !b.repo.reopen || !b.files.reopen) fail("MAINTENANCE_RUN_STOPPED");
    b.ordinaryMethod!.call(b.services, b.owner);
    b.repo.finalReady();
    // No await from the final original checks through both local gates.
    released(b); b.repo.reopen(); b.files.reopen(); b.reopened = true;
    return { value: undefined, consumedItems: 20 };
  });
}
export function beginFreshHeldMaintenance(owner: WorkerOwner): Promise<MaintenanceRun> {
  const b = binding(owner);
  if (b.current || b.settlement || !b.settled || !b.released || b.uncertain) fail("MAINTENANCE_WORK_ACTIVE");
  b.released = false; b.acquisition = undefined; b.hold = undefined;
  return beginMaintenance(owner);
}
export function inhibitMaintenance(owner: WorkerOwner): void {
  const b = binding(owner); b.draining = true; if (b.current) b.current.accepting = false; b.repo.inhibit(); b.files.inhibit();
}
// Retain the full scheduler finally/settlement lifetime, not its timeout race.
// Adding work can only delay close; no caller can remove another cycle.
export function retainMaintenanceCycle(owner: WorkerOwner, work: Promise<unknown>): void {
  const b = binding(owner); b.cycles.add(work);
  void work.then(() => b.cycles.delete(work), () => b.cycles.delete(work));
}
export function settleMaintenanceForClose(owner: WorkerOwner): Promise<void> {
  inhibitMaintenance(owner);
  const b = binding(owner);
  if (b.closing) return b.closing;
  b.closing = (async () => {
    while (b.cycles.size) await Promise.allSettled([...b.cycles]);
    if (b.settlement) await b.settlement.catch(() => {});
    while (b.current?.pending.size) await Promise.allSettled([...b.current.pending]);
    if (b.uncertain) fail("MAINTENANCE_HOLD_LOST");
    // A confirmed ordinary release needs a genuinely new exclusion before DB
    // close. Never reuse its stale handle or retry an uncertain release.
    if (b.released) { b.released = false; b.reopened = false; b.hold = undefined; b.acquisition = undefined; }
    if (!b.current) await begin(owner, true);
    else if (!b.hold) {
      let hold: RuntimeMaintenanceExclusion;
      try { hold = await b.holdMethod!.call(b.services, owner); }
      catch { b.uncertain = true; fail("MAINTENANCE_HOLD_LOST"); }
      if (!hold || typeof hold !== "object") { b.uncertain = true; fail("MAINTENANCE_HOLD_LOST"); }
      b.hold = hold; held(b);
      b.exclusion = Object.freeze({});
    }
    // Settlement owns complete producer/finally/journal scopes. A known
    // retained scanner resource can still require its exact finishing hook.
    await b.journal?.settle();
    await b.settleMethod.call(b.services); held(b);
    await b.repo.settle();
    await b.files.settle().catch(() => {});
    if (!b.files.finishForDrain || !b.current) fail("MAINTENANCE_WORK_ACTIVE");
    await b.files.finishForDrain(b.current.token);
    await settleMaintenance(owner);
    assertMaintenanceClose(b.repository);
  })().catch(error => { b.closing = undefined; throw error; });
  return b.closing;
}
export function settleMaintenance(owner: WorkerOwner): Promise<void> {
  const b = bindings.get(owner); if (!b || !b.started) return Promise.resolve();
  if (b.settlement) return b.settlement;
  b.settlement = (async () => {
    const run = b.current; if (run) { run.accepting = false; while (run.pending.size) await Promise.allSettled([...run.pending]); }
    // New ordinary producers may start after the synchronous reopen. They are
    // not work admitted to the now-finished maintenance invocation.
    if (b.reopened) { b.settled = true; b.current = undefined; return; }
    await settleOwners(b); b.settled = true; b.current = undefined;
  })().finally(() => { b.settlement = undefined; });
  return b.settlement;
}
export function assertMaintenanceClose(repository: ApplicationRepository): void {
  const owner = repositoryOwners.get(repository); if (!owner) return;
  const b = binding(owner); if (!b.started) return;
  if (!b.settled || b.current || b.settlement || !b.repo.idle() || !b.files.idle() || !(b.files.closeReady?.() ?? b.files.idle())) fail("MAINTENANCE_WORK_ACTIVE");
  if (b.hold) held(b);
}
export function maintenanceSnapshot(owner: WorkerOwner) {
  const b = binding(owner), run = b.current ?? b.lastRun;
  return Object.freeze({ status: b.settled ? "settled" as const : "settling" as const, consumedItems: run?.consumed ?? 0, selectedCount: run?.selected.size ?? 0, expired: run ? tick(b) - run.start >= 120000 : false });
}
