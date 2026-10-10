import { erasureOwner } from "./erasure-repository";
import { custodyErasureOwner } from "./custody-erasure";
import { maintenanceJournal } from "./ledger";
import { beginMaintenance, beginFreshHeldMaintenance, maintenanceOrigin, maintenanceSnapshot, maintenanceRemaining, maintenanceReadPhase, releaseMaintenanceForRecheck, reopenMaintenance, retainMaintenanceCycle, settleMaintenance, type MaintenanceRun } from "./worker-maintenance";
import { utcInstant, type DurableReceipt, type EraseJournalEvent, type ErasureRowCursor, type ErasureWork, type JournalProgress, type RetentionReport, type WorkerOwner } from "./types";

interface Session {
  journal: "refresh" | "continue-replay" | "recover";
  active?: Promise<RetentionReport>;
  timedOut: boolean;
  retainedFailure?: boolean;
  authLocked: boolean;
  phase: "journal" | "scan" | "due" | "pending" | "committed" | "checkpoint" | "cleanup" | "global" | "prune" | "pre-refresh" | "final-invalidate" | "fresh-final" | "final-scan" | "accounting" | "final-work" | "release-invalidate" | "final-checkpoint" | "release" | "post-refresh" | "post-work" | "reopen" | "complete" | "rehold" | "fresh-held";
  scanInvalidated?: boolean;
  nextWakeAt?: string | null;
  duePages?: number;
  job?: { kind: "event"; event: EraseJournalEvent; phase: "recover" | "continue-replay" | "receipt" | "ack"; receipt?: DurableReceipt }
    | { kind: "done"; commit: string }
    | { kind: "work"; work: ErasureWork; phase: "claim" | "physical" | "rows"; cursor: ErasureRowCursor | null };
}
const sessions = new WeakMap<WorkerOwner, Session>();

function report(owner: WorkerOwner, status: RetentionReport["status"], blocker: RetentionReport["blocker"] = null): RetentionReport {
  const snapshot = maintenanceSnapshot(owner);
  const complete = status === "complete", earliest = sessions.get(owner)?.nextWakeAt;
  const wake = new Date(owner.clock.now().getTime() + (complete ? 3600000 : 1000)).toISOString();
  return Object.freeze({ status, consumedItems: snapshot.consumedItems, selectedCount: snapshot.selectedCount, hasMore: !complete, nextWakeAt: utcInstant(complete && earliest && earliest < wake ? earliest : wake), blocker });
}
async function step(owner: WorkerOwner, state: Session, run: MaintenanceRun): Promise<void> {
  const erasure = erasureOwner(owner.repository), custody = custodyErasureOwner(owner.custody), job = state.job;
  if (["final-work", "final-checkpoint", "release", "post-work", "reopen"].includes(state.phase) && !erasure.journal?.observation()) {
    const operation = state.journal === "refresh" ? { kind: "refresh" as const, purpose: "refresh" as const } : { kind: state.journal };
    state.journal = "recover";
    const progress = (await maintenanceJournal(run, owner.repository, operation)).value as JournalProgress;
    state.journal = progress.kind === "continuation" ? progress.next : "refresh";
    return;
  }
  if (job?.kind === "event") {
    if (job.phase === "ack") {
      if (job.event[3] === "erase_commit") await erasure.acknowledgeCommit(job.event, job.receipt!, run);
      else await erasure.acknowledgeDone(job.event, job.receipt!, run);
      state.job = undefined; return;
    }
    if (job.phase === "receipt") {
      job.phase = "recover";
      const result = await maintenanceJournal(run, owner.repository, { kind: "append", event: job.event });
      job.receipt = result.value as DurableReceipt; job.phase = "ack"; return;
    }
    const operation = job.phase === "recover" ? { kind: "recover" as const, event: job.event } : { kind: "continue-replay" as const };
    job.phase = "recover";
    const result = await maintenanceJournal(run, owner.repository, operation), progress = result.value as JournalProgress;
    job.phase = progress.kind === "continuation" && progress.next === "continue-replay" ? "continue-replay" : "receipt";
    return;
  }
  if (job?.kind === "done") {
    const result = await erasure.prepareDone(job.commit, run);
    if (result.event) state.job = { kind: "event", event: result.event, phase: "recover" };
    return;
  }
  if (job?.kind === "work") {
    if (job.phase === "claim") { await erasure.reconcileClaim(job.work.commitEventId, run); job.phase = job.work.scope === "processing_payload" || job.work.scope === "identifying_register" ? "physical" : "rows"; }
    else if (job.phase === "physical") { if ((await custody.eraseScopeBatch(job.work.commitEventId, run)).complete) job.phase = "rows"; }
    else { const result = await erasure.applyRowBatch(job.work.commitEventId, job.cursor, run); job.cursor = result.next; if (result.complete) state.job = undefined; }
    return;
  }
  switch (state.phase) {
    case "scan": if ((await custody.scanBatch(run)).complete) state.phase = "due"; return;
    case "due":
      // Rotate once through the eight original fair streams before rebuilding
      // physical coverage. Each page retains its own original 860 precharge.
      do {
        await erasure.prepareDueBatch(run);
        state.duePages=(state.duePages??0)+1;
        if(state.duePages===8){state.duePages=0;state.phase="pending";break;}
      } while(maintenanceRemaining(run,owner.repository).items>=860 && maintenanceRemaining(run,owner.repository).selections>=3);
      return;
    case "pending": {
      const page = await erasure.listPending(run), first = page.items[0];
      if (first?.kind === "proposed") state.job = { kind: "event", event: first.event, phase: "recover" };
      else if (first) state.job = { kind: "done", commit: first.work.commitEventId };
      state.phase = "committed"; return;
    }
    case "committed": {
      const page = await erasure.listCommitted(run), first = page.items[0];
      if (first && first.stage === "rows-pending") state.job = { kind: "work", work: first, phase: "claim", cursor: null };
      state.phase = "checkpoint"; return;
    }
    case "checkpoint":
      // An actual newly completed obligation can now stage its done event;
      // consume that original pending stream before rebuilding final coverage.
      state.phase = (await erasure.checkpointDatabase(run)).complete ? "pending" : "cleanup"; return;
    case "cleanup": if ((await custody.cleanupNeverAcceptedBatch(run)).complete) state.phase = "global"; return;
    case "global": await erasure.expireGlobalBatch(run); state.phase = "prune"; return;
    case "prune": await custody.pruneInventoryBatch(run); state.phase = "pre-refresh"; return;
    case "final-invalidate": await custody.invalidateAndClose(run); state.phase = "fresh-final"; return;
    case "fresh-final": await custody.startFreshPass(run); state.scanInvalidated = false; state.phase = "final-scan"; return;
    case "fresh-held": await custody.startFreshPass(run); state.scanInvalidated = false; state.phase = "journal"; return;
    case "final-scan": if ((await custody.scanBatch(run)).complete) state.phase = "accounting"; return;
    case "accounting": if ((await custody.accountBatch(run)).complete) state.phase = "final-work"; return;
    case "final-work": case "post-work": {
      // Each original command reserves 200 and at most one selected parent.
      // The shared remaining allowance, not a caller-supplied work count,
      // admits another key. Thus <=5 keys fit the aggregate 1000-item run.
      do {
        const result = await erasure.finalWorkBatch(run); state.nextWakeAt = result.nextWakeAt;
        if (result.complete) {
          state.phase = result.hasWork ? state.phase === "post-work" ? "rehold" : state.scanInvalidated ? "fresh-held" : "due" : state.phase === "post-work" ? "reopen" : state.scanInvalidated || maintenanceOrigin(owner) === "cold-maintenance" ? "final-checkpoint" : "release-invalidate";
          break;
        }
      } while(maintenanceRemaining(run,owner.repository,maintenanceReadPhase(run,owner.repository)).items>=200);
      return;
    }
    case "release-invalidate": await custody.invalidateAndClose(run); state.scanInvalidated = true; state.phase = "final-work"; return;
    case "final-checkpoint": if ((await erasure.checkpointFinalDatabase(run)).complete) state.phase = maintenanceOrigin(owner) === "cold-maintenance" ? "complete" : "release"; return;
    case "release": await releaseMaintenanceForRecheck(run, owner.repository); state.phase = "post-refresh"; state.journal = "refresh"; return;
    case "reopen": await reopenMaintenance(run, owner.repository); state.phase = "complete"; return;
    case "complete": case "rehold": throw new Error("MAINTENANCE_RUN_STOPPED");
  }
  const operation = state.journal === "refresh" ? { kind: "refresh" as const, purpose: maintenanceOrigin(owner) === "cold-maintenance" ? "restore" as const : "refresh" as const } : { kind: state.journal };
  state.journal = "recover";
  const result = await maintenanceJournal(run, owner.repository, operation);
  const progress = result.value as JournalProgress;
  if (progress.kind === "continuation") state.journal = progress.next;
  else { state.journal = "refresh"; state.phase = state.phase === "pre-refresh" ? "final-invalidate" : state.phase === "post-refresh" ? "post-work" : "scan"; }
}

// This method is deliberately not async: beginMaintenance inhibits both
// original producer owners synchronously before the first acquisition wait.
export function runRetentionOnce(owner: WorkerOwner): Promise<RetentionReport> {
  return runMaintenanceCycle(owner);
}
export function runMaintenanceCycle(owner: WorkerOwner): Promise<RetentionReport> {
  let state = sessions.get(owner);
  if (!state) {
    state = { journal: "refresh", timedOut: false, authLocked: false, phase: "journal" };
    sessions.set(owner, state);
    if (maintenanceOrigin(owner) === "cold-maintenance") {
      // Mandatory cold bootstrap is outside the bounded allowance (R92).
      // The immutable cold original rejects authentication construction itself.
      erasureOwner(owner.repository).lockRestoredAuthentication();
      state.authLocked = true;
    }
  }
  if (state.active) return state.timedOut ? Promise.resolve(report(owner, "settling", "deadline")) : state.active;
  if (state.retainedFailure) return Promise.resolve(report(owner, "blocked", "ownership"));
  state.timedOut = false;
  const rehold = state.phase === "rehold";
  if (rehold || (state.phase === "complete" && maintenanceOrigin(owner) === "ordinary")) state.phase = "fresh-held";
  else if (state.phase === "complete") state.phase = "pre-refresh";
  const admitted = rehold ? beginFreshHeldMaintenance(owner) : beginMaintenance(owner);
  const current = state;
  let timer: ReturnType<typeof setTimeout>;
  const work = (async () => {
    let blocker: RetentionReport["blocker"] = null;
    try { const run = await admitted; await step(owner, current, run); }
    catch (error) {
      const code = error instanceof Error ? error.message : "";
      blocker = code === "MAINTENANCE_DEADLINE" ? "deadline" : code === "ERASURE_SANITATION_REQUIRED" ? "baseline"
        : code === "MAINTENANCE_HOLD_LOST" ? "ownership"
          : ["scan", "final-scan", "fresh-final", "fresh-held", "cleanup", "prune"].includes(current.phase) ? "custody"
            : current.job?.kind === "event" && current.job.phase !== "ack" || ["journal", "pre-refresh", "post-refresh"].includes(current.phase) ? "journal" : "erasure";
    }
    try { await settleMaintenance(owner); }
    catch { blocker = "ownership"; current.retainedFailure = true; }
    return report(owner, blocker ? "blocked" : current.phase === "complete" ? "complete" : "progress", blocker);
  })();
  retainMaintenanceCycle(owner,work);
  const deadline = new Promise<RetentionReport>((resolve,reject) => { timer = setTimeout(() => { current.timedOut = true; try { resolve(report(owner, "settling", "deadline")); } catch(error) { reject(error); } }, 120000); });
  const response = Promise.race([work, deadline]);
  current.active = response;
  const cleanup=()=>{clearTimeout(timer);current.active=undefined;};
  void work.then(cleanup,cleanup);
  return response;
}
export function restoredAuthenticationLocked(owner: WorkerOwner): boolean {
  return maintenanceOrigin(owner) === "cold-maintenance" && sessions.get(owner)?.authLocked === true;
}
