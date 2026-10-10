import type { ApplicationRepository, Clock, CustodyLedger, RuntimeMaintenanceExclusion, WorkerOwner, WorkerServices } from "./types";
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
interface Lifetime { inhibit(): void; settle(): Promise<void>; idle(): boolean }
const repositories = new WeakMap<ApplicationRepository, Lifetime & { clock: Clock }>();
const custodians = new WeakMap<CustodyLedger, Lifetime & { repository: ApplicationRepository; clock: Clock }>();
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
  hold?: RuntimeMaintenanceExclusion; acquisition?: Promise<void>; settlement?: Promise<void>; current?: Run; lastRun?: Run;
  started: boolean; settled: boolean; uncertain: boolean; journal?: { settle(): Promise<void> };
}
const runs = new WeakMap<MaintenanceRun, Run>();
const journals = new WeakMap<ApplicationRepository, { settle(): Promise<void> } | undefined>();
function fail(code: string): never { throw new Error(code); }
const commandErrors = new Set(["ERASURE_CLAIM_ACTIVE", "ERASURE_NOT_DUE", "ERASURE_PENDING", "ERASURE_FINAL_EVIDENCE_REQUIRED", "ERASURE_UNVERIFIED", "ERASURE_ADMISSION_UNAVAILABLE", "ERASURE_SANITATION_REQUIRED", "MAINTENANCE_DEADLINE", "MAINTENANCE_HOLD_LOST", "MAINTENANCE_RUN_STOPPED", "MAINTENANCE_SELECTION_LIMIT", "AUTH_DENIED"]);
export function registerMaintenanceRepository(repository: ApplicationRepository, clock: Clock, lifetime: Lifetime, journal?: { settle(): Promise<void> }): void {
  if (repositories.has(repository)) fail("MAINTENANCE_ALREADY_OWNED");
  repositories.set(repository, { ...lifetime, clock }); journals.set(repository, journal);
}
export function registerMaintenanceCustody(custody: CustodyLedger, repository: ApplicationRepository, clock: Clock, lifetime: Lifetime): void {
  if (custodians.has(custody)) fail("MAINTENANCE_ALREADY_OWNED");
  custodians.set(custody, { ...lifetime, repository, clock });
}
export function bindMaintenance(owner: WorkerOwner, services: WorkerServices, monotonic: () => number = () => performance.now()): void {
  if (bindings.has(owner) || repositoryOwners.has(owner.repository) || custodyOwners.has(owner.custody)) fail("MAINTENANCE_ALREADY_BOUND");
  const repo = repositories.get(owner.repository), files = custodians.get(owner.custody);
  if (!repo || !files || files.repository !== owner.repository || repo.clock !== owner.clock || files.clock !== owner.clock) fail("MAINTENANCE_OWNER_MISMATCH");
  if (!services || typeof services.settle !== "function" || typeof services.close !== "function" || typeof services.holdMaintenance !== "function" || typeof services.assertMaintenanceHeld !== "function" || typeof services.releaseMaintenance !== "function") fail("MAINTENANCE_UNAVAILABLE");
  let last: number; try { last = monotonic(); } catch { fail("MAINTENANCE_CLOCK_INVALID"); }
  if (!Number.isFinite(last) || last < 0) fail("MAINTENANCE_CLOCK_INVALID");
  const b: Binding = { owner, repository: owner.repository, custody: owner.custody, clock: owner.clock, repo, files, services, monotonic, last, holdMethod: services.holdMaintenance, assertMethod: services.assertMaintenanceHeld, releaseMethod: services.releaseMaintenance, settleMethod: services.settle, started: false, settled: false, uncertain: false, journal: journals.get(owner.repository) };
  bindings.set(owner, b); repositoryOwners.set(owner.repository, owner); custodyOwners.set(owner.custody, owner);
}
function binding(owner: WorkerOwner): Binding {
  const b = bindings.get(owner); if (!b || owner.repository !== b.repository || owner.custody !== b.custody || owner.clock !== b.clock) fail("MAINTENANCE_OWNER_MISMATCH"); return b;
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
async function settleOwners(b: Binding): Promise<void> {
  // Each owner retains entire scopes, including finally work enqueued later.
  let failed = false;
  for (const settle of [() => b.settleMethod.call(b.services), () => b.files.settle(), () => b.repo.settle(), () => b.journal?.settle()]) {
    try { await settle(); if (b.hold) held(b); } catch { failed = true; }
  }
  if (failed) fail("MAINTENANCE_SETTLEMENT_UNCERTAIN");
  if (!b.files.idle() || !b.repo.idle()) fail("MAINTENANCE_WORK_ACTIVE");
}
export function beginMaintenance(owner: WorkerOwner): Promise<MaintenanceRun> {
  const b = binding(owner); if (b.current || b.settlement) fail("MAINTENANCE_RUN_ACTIVE");
  if (b.uncertain) fail("MAINTENANCE_HOLD_LOST");
  const token = Object.freeze({}) as MaintenanceRun;
  const run: Run = { binding: b, token, start: tick(b), consumed: 0, selected: new Set(), failed: false, accepting: true, pending: new Set() };
  runs.set(token, run); b.current = run; b.lastRun = run; b.started = true; b.settled = false;
  b.repo.inhibit(); b.files.inhibit(); // Synchronous, before acquisition/waits.
  const start = (async () => {
    if (!b.acquisition) b.acquisition = (async () => {
      try { const hold = await b.holdMethod!.call(b.services, owner); if (!hold || typeof hold !== "object") throw new Error(); b.hold = hold; held(b); }
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
export function assertMaintenance(run: MaintenanceRun, repository: ApplicationRepository, phase: "scalar" | "journal" | "filesystem" = "scalar"): void {
  const r = current(run, repository); held(r.binding);
  if (!r.accepting || r.failed) fail("MAINTENANCE_RUN_STOPPED");
  const remaining = 120000 - (tick(r.binding) - r.start), minimum = phase === "journal" ? 65000 : phase === "filesystem" ? 40000 : 0;
  if (remaining <= 0 || remaining < minimum) { r.accepting = false; fail("MAINTENANCE_DEADLINE"); }
}
export function maintenanceRemaining(run: MaintenanceRun, repository: ApplicationRepository): Readonly<{ items: number; selections: number; now: string }> {
  assertMaintenance(run, repository); const r = current(run);
  let now: string; try { now = utcInstant(r.binding.clock.now().toISOString()); } catch { r.failed = true; fail("MAINTENANCE_CLOCK_INVALID"); }
  return Object.freeze({ items: 1000 - r.consumed, selections: 20 - r.selected.size, now });
}
export function selectMaintenance(run: MaintenanceRun, repository: ApplicationRepository, key: string): void {
  assertMaintenance(run, repository); const r = current(run);
  if (!r.selected.has(key) && r.selected.size >= 20) fail("MAINTENANCE_SELECTION_LIMIT"); r.selected.add(key);
}
export function assertMaintenanceSettled(run: MaintenanceRun, repository: ApplicationRepository): void {
  assertMaintenance(run, repository); const b = current(run).binding;
  if (!b.files.idle() || !b.repo.idle()) fail("MAINTENANCE_WORK_ACTIVE");
}
// Accounting only: no DB/custody mutation capability is granted here. Closed
// owner commands supply fixed code and query-derived worst-case reservations.
export async function maintenanceCommand<T>(token: MaintenanceRun, repository: ApplicationRepository, maximum: number, phase: "scalar" | "journal" | "filesystem", action: () => Promise<{ value: T; consumedItems: number }> | { value: T; consumedItems: number }): Promise<Readonly<{ value: T; consumedItems: number }>> {
  const r = current(token, repository); assertMaintenance(token, repository, phase);
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > 1000 - r.consumed) fail("MAINTENANCE_BUDGET_INSUFFICIENT");
  r.consumed += maximum;
  const task = (async () => { assertMaintenance(token, repository, phase); return action(); })().then(result => {
    // Late completion is retained and recorded, not treated as cancellation.
    if (!Number.isSafeInteger(result.consumedItems) || result.consumedItems < 0 || result.consumedItems > maximum) fail("MAINTENANCE_ACCOUNTING_INVALID");
    r.consumed -= maximum - result.consumedItems; held(r.binding); return Object.freeze(result);
  }).catch(error => { r.failed = true; r.accepting = false; throw new Error(error instanceof Error && commandErrors.has(error.message) ? error.message : "MAINTENANCE_COMMAND_FAILED"); });
  r.pending.add(task);
  try { return await task; } finally { r.pending.delete(task); }
}
export function settleMaintenance(owner: WorkerOwner): Promise<void> {
  const b = bindings.get(owner); if (!b || !b.started) return Promise.resolve();
  if (b.settlement) return b.settlement;
  b.settlement = (async () => {
    const run = b.current; if (run) { run.accepting = false; while (run.pending.size) await Promise.allSettled([...run.pending]); }
    await settleOwners(b); b.settled = true; b.current = undefined;
  })().finally(() => { b.settlement = undefined; });
  return b.settlement;
}
export function assertMaintenanceClose(repository: ApplicationRepository): void {
  const owner = repositoryOwners.get(repository); if (!owner) return;
  const b = binding(owner); if (!b.started) return;
  if (!b.settled || b.current || b.settlement || !b.repo.idle() || !b.files.idle()) fail("MAINTENANCE_WORK_ACTIVE");
  if (b.hold) held(b);
}
export function maintenanceSnapshot(owner: WorkerOwner) {
  const b = binding(owner), run = b.current ?? b.lastRun;
  return Object.freeze({ status: b.settled ? "settled" as const : "settling" as const, consumedItems: run?.consumed ?? 0, selectedCount: run?.selected.size ?? 0, expired: run ? tick(b) - run.start >= 120000 : false });
}
