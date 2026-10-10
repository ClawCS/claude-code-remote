import { randomUUID } from "node:crypto";
import type { Server } from "node:net";
import { runDispatchOnce } from "./dispatch";
import { createWorkerRpc } from "./worker-rpc";
import { bindMaintenance, inhibitMaintenance, maintenanceOrigin, settleMaintenanceForClose } from "./worker-maintenance";
import { runRetentionOnce } from "./retention";
import { reconcileRestore } from "./restore";
import { utcInstant, type ApplicationWorker, type DispatchDependencies, type WorkerAssurance, type WorkerLifecycleOptions, type WorkerLifecycleState, type WorkerOwner, type WorkerProof, type WorkerRestoreProof, type WorkerScheduleEntry } from "./types";

const POLL_MS = 1000, MAINTENANCE_MS = 300000, RETENTION_MS = 3600000;
// No process handlers, credentials, repository, timers or sockets at import time.
export function createApplicationWorker(options: WorkerLifecycleOptions): ApplicationWorker {
  let state: WorkerLifecycleState = "new", owner: WorkerOwner | undefined, dispatch: DispatchDependencies | undefined;
  let checkpoint: WorkerRestoreProof | null = null, retention: WorkerProof | null = null;
  let queue = Promise.resolve(), timer: ReturnType<typeof setTimeout> | undefined, rpc: Server | undefined;
  let maintenanceAt = 0, retentionAt = 0, healthy = false, started = false, bound = false, maintenanceComplete = false;
  let origin: "ordinary" | "cold-maintenance" | undefined;
  let drainWork: Promise<boolean> | undefined;
  let stopping = false, databaseClosed = false, inhibitionFailed = false;
  const services = options.services, closeServices = services?.close;
  const reference = randomUUID(), emitted = new Set<string>();
  const allowed = (assurance: WorkerAssurance | undefined) => assurance === "qualified" || (assurance === "local-test" && process.env.NODE_ENV === "test");
  const now = () => utcInstant(owner!.clock.now().toISOString());
  const emit = (code: Parameters<NonNullable<WorkerLifecycleOptions["onEvent"]>>[0]["code"], ref: string = reference) => {
    try { options.onEvent?.({ reference: ref, code }); } catch { /* Logging cannot grant authority or interrupt settlement. */ }
  };
  function fresh(proof: WorkerProof | null | undefined): boolean {
    if (!owner || !proof) return false;
    try { const current = now(); return utcInstant(proof.checkedAt) <= current && utcInstant(proof.validUntil) > current; } catch { return false; }
  }
  function restoreCurrent(): boolean {
    if (!owner || !checkpoint || !allowed(options.restore?.assurance)) return false;
    const proof = options.restore!.current(owner);
    return !!proof && proof.checkpointId === checkpoint.checkpointId && proof.ledgerVerified === true && fresh(proof);
  }
  function current(): boolean {
    try {
      if (state !== "running" || !healthy || !maintenanceComplete || origin !== "ordinary" || !dispatch || !owner || !restoreCurrent() || !allowed(options.retention?.assurance) || !fresh(retention) || !allowed(options.readiness?.assurance) || !owner.custody.getIntakeReadiness().ready) return false;
      const evidence = options.readiness!.current(owner);
      return [evidence.runtime, evidence.scanner, evidence.mail, evidence.retention].every(fresh);
    } catch { return false; }
  }
  function exclusive<T>(action: () => Promise<T>): Promise<T> { const result = queue.then(action); queue = result.then(() => {}, () => {}); return result; }
  function project(): readonly WorkerScheduleEntry[] {
    const rows = owner!.repository.listWorkerSchedule(now());
    for (const row of rows) for (const [deadline, code] of [[row.incidentAt, "DELIVERY_INCIDENT"], [row.manualRequiredAt, "MANUAL_REQUIRED"]] as const) {
      const key = `${row.id}:${code}`;
      if (deadline <= now() && !emitted.has(key)) { emit(code, row.reference); emitted.add(key); }
    }
    return rows;
  }
  function schedule(rows: readonly WorkerScheduleEntry[]) {
    if (timer) clearTimeout(timer);
    if (!started || stopping || !owner) return null;
    const time = owner!.clock.now().getTime();
    const deadlines = rows.flatMap(row => [row.dispatchDueAt, row.incidentAt, row.manualRequiredAt]).filter((value): value is NonNullable<typeof value> => value !== null && Date.parse(value) > time).map(value => Date.parse(value));
    const wake = Math.min(time + POLL_MS, ...[maintenanceAt, retentionAt, ...deadlines].filter(deadline => deadline > time));
    timer = setTimeout(() => { timer = undefined; void worker.runOnce(); }, Math.max(1, wake - time));
    timer.unref();
    return utcInstant(new Date(wake).toISOString());
  }
  async function maintain() {
    healthy = false; maintenanceComplete = false;
    if (!restoreCurrent() || !allowed(options.readiness?.assurance) || !fresh(options.readiness!.current(owner!).runtime) || !allowed(options.retention?.assurance)) throw new Error("WORKER_UNAVAILABLE");
    const report = await (origin === "cold-maintenance" ? reconcileRestore(owner!) : runRetentionOnce(owner!));
    if (stopping) return;
    const time = owner!.clock.now().getTime(), next = report.nextWakeAt === null ? time + POLL_MS : Date.parse(report.nextWakeAt);
    maintenanceAt = Math.max(time + 1, Math.min(time + (report.status === "complete" ? MAINTENANCE_MS : POLL_MS), next));
    state = "unavailable";
    if (origin !== "ordinary" || report.status !== "complete") return;
    maintenanceComplete = true;
    if (time >= retentionAt || !fresh(retention)) {
      retention = await options.retention!.sweep(owner!);
      retentionAt = owner!.clock.now().getTime() + RETENTION_MS;
    }
    if (stopping) return;
    if (!fresh(retention)) throw new Error("WORKER_UNAVAILABLE");
    healthy = true; state = "running";
  }
  const worker: ApplicationWorker = {
    getState: () => state,
    getIntakeReadiness: () => ({ ready: current() }),
    start: () => exclusive(async () => {
      if (state === "draining" || state === "stopped" || started) return { state };
      state = "starting";
      try {
        owner ??= options.acquire();
        if (!bound) { bindMaintenance(owner, services!); bound = true; origin = maintenanceOrigin(owner); }
        if (!allowed(options.restore?.assurance)) throw new Error("WORKER_UNAVAILABLE");
        checkpoint = await options.restore!.verify(owner);
        if (stopping) return { state };
        if (!checkpoint || checkpoint.ledgerVerified !== true || !/^[A-Za-z0-9_-]{1,128}$/.test(checkpoint.checkpointId) || !fresh(checkpoint) || !restoreCurrent()) throw new Error("WORKER_UNAVAILABLE");
        // Runtime evidence includes actual previous scanner/raster holder recovery,
        // not merely an available service or a sandbox qualification label.
        if (!allowed(options.readiness?.assurance) || !fresh(options.readiness!.current(owner).runtime)) throw new Error("WORKER_UNAVAILABLE");
        if (!allowed(options.retention?.assurance)) throw new Error("WORKER_UNAVAILABLE");
        dispatch = origin === "ordinary" ? options.dispatch?.(owner) : undefined;
        if (dispatch && (dispatch.repository !== owner.repository || dispatch.custody !== owner.custody || dispatch.clock !== owner.clock || dispatch.keys.custody !== owner.custody || dispatch.reconstruction.scope !== owner.custody)) throw new Error("WORKER_OWNER_MISMATCH");
        started = true;
        await maintain();
        if (stopping) return { state };
        if (options.rpc && origin === "ordinary") {
          rpc = createWorkerRpc(owner.repository, { ...options.rpc, custody: owner.custody, clock: owner.clock, readiness: worker });
          await new Promise<void>((resolve, reject) => { rpc!.once("error", reject); rpc!.listen(options.rpc!.socketPath, resolve); });
          rpc.on("error", () => { healthy = false; emit("WORKER_UNAVAILABLE"); });
        }
        schedule(maintenanceComplete ? project() : []);
      } catch { healthy = false; if (!stopping) state = "unavailable"; emit("WORKER_UNAVAILABLE"); schedule([]); }
      return { state };
    }),
    runOnce: () => exclusive(async () => {
      if (!started || stopping || !owner) return { dispatched: false, nextWakeAt: null };
      let dispatched = false;
      try {
        const time = owner.clock.now().getTime();
        if (time >= maintenanceAt || (maintenanceComplete && !owner.custody.getIntakeReadiness().ready)) {
          await maintain();
          // One bounded maintenance continuation per scheduler turn. Dispatch
          // gets a later turn, only after genuine ordinary reopening.
          return { dispatched: false, nextWakeAt: schedule(maintenanceComplete && !stopping ? project() : []) };
        }
        if (stopping) return { dispatched: false, nextWakeAt: null };
        if (maintenanceComplete && time >= retentionAt) {
          retention = allowed(options.retention?.assurance) ? await options.retention!.sweep(owner) : null;
          retentionAt = time + RETENTION_MS;
        }
        let rows = maintenanceComplete ? project() : [];
        if (current() && rows.some(row => !row.busy && row.dispatchDueAt !== null && row.dispatchDueAt <= now())) {
          await runDispatchOnce(dispatch!); dispatched = true;
          // idle is not a no-op: the selector may have terminalized several rows.
          rows = project();
        }
        return { dispatched, nextWakeAt: schedule(rows) };
      } catch { healthy = false; emit("WORKER_UNAVAILABLE"); return { dispatched, nextWakeAt: schedule([]) }; }
    }),
    drain: async ({ graceMs }) => {
      if (!Number.isSafeInteger(graceMs) || graceMs < 0 || graceMs > 60000) throw new Error("INVALID_DRAIN_GRACE");
      if (state === "stopped") return { state, complete: true };
      // Synchronous before the first await, including while dispatch holds the queue.
      stopping = true; state = "draining"; healthy = false; if (timer) clearTimeout(timer); timer = undefined;
      if (owner && !databaseClosed) {
        try { if (!bound) throw new Error("MAINTENANCE_UNAVAILABLE"); inhibitMaintenance(owner); }
        catch { inhibitionFailed = true; }
      }
      if (!drainWork) {
        drainWork = exclusive(async () => {
          if (inhibitionFailed) return false;
          if (owner) await settleMaintenanceForClose(owner);
          if (rpc?.listening) await new Promise<void>((resolve, reject) => rpc!.close(error => error ? reject(error) : resolve()));
          if (owner) {
            if (!services || services.close !== closeServices) return false;
            // The original hold/process/DB-path exclusion remains retained
            // through SQLite close. Service close may do no later DB cleanup.
            owner.repository.close(); databaseClosed = true;
            await closeServices!.call(services);
          }
          state = "stopped"; return true;
        }).catch(() => false);
        const attempt = drainWork;
        void attempt.then(complete => { if (!complete && !databaseClosed && drainWork === attempt) drainWork = undefined; });
      }
      let deadline: ReturnType<typeof setTimeout> | undefined;
      const complete = await Promise.race([drainWork, new Promise<false>(resolve => { deadline = setTimeout(() => resolve(false), graceMs); })]);
      if (deadline) clearTimeout(deadline);
      if (!complete) emit("DRAIN_INCOMPLETE");
      return { state: complete ? "stopped" : "draining", complete };
    },
  };
  return worker;
}
