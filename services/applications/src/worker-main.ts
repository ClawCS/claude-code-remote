import { randomUUID } from "node:crypto";
import type { Server } from "node:net";
import { runDispatchOnce } from "./dispatch";
import { createWorkerRpc } from "./worker-rpc";
import { utcInstant, type ApplicationWorker, type DispatchDependencies, type WorkerAssurance, type WorkerLifecycleOptions, type WorkerLifecycleState, type WorkerOwner, type WorkerProof, type WorkerRestoreProof, type WorkerScheduleEntry } from "./types";

const POLL_MS = 1000, MAINTENANCE_MS = 300000, RETENTION_MS = 3600000;
// No process handlers, credentials, repository, timers or sockets at import time.
export function createApplicationWorker(options: WorkerLifecycleOptions): ApplicationWorker {
  let state: WorkerLifecycleState = "new", owner: WorkerOwner | undefined, dispatch: DispatchDependencies | undefined;
  let checkpoint: WorkerRestoreProof | null = null, retention: WorkerProof | null = null;
  let queue = Promise.resolve(), timer: ReturnType<typeof setTimeout> | undefined, rpc: Server | undefined;
  let pruneTimer: ReturnType<typeof setInterval> | undefined;
  let maintenanceAt = 0, retentionAt = 0, healthy = false, started = false;
  let drainWork: Promise<boolean> | undefined;
  let stopping = false;
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
      if (state !== "running" || !healthy || !dispatch || !owner || !restoreCurrent() || !allowed(options.retention?.assurance) || !fresh(retention) || !allowed(options.readiness?.assurance) || !owner.custody.getIntakeReadiness().ready) return false;
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
    if (state !== "running") return null;
    const time = owner!.clock.now().getTime();
    const deadlines = rows.flatMap(row => [row.dispatchDueAt, row.incidentAt, row.manualRequiredAt]).filter((value): value is NonNullable<typeof value> => value !== null && Date.parse(value) > time).map(value => Date.parse(value));
    const wake = Math.min(time + POLL_MS, ...[maintenanceAt, retentionAt, ...deadlines].filter(deadline => deadline > time));
    timer = setTimeout(() => { timer = undefined; void worker.runOnce(); }, Math.max(1, wake - time));
    timer.unref();
    return utcInstant(new Date(wake).toISOString());
  }
  const worker: ApplicationWorker = {
    getState: () => state,
    getIntakeReadiness: () => ({ ready: current() }),
    start: () => exclusive(async () => {
      if (state === "draining" || state === "stopped" || started) return { state };
      state = "starting";
      try {
        owner ??= options.acquire();
        if (!allowed(options.restore?.assurance)) throw new Error("WORKER_UNAVAILABLE");
        checkpoint = await options.restore!.verify(owner);
        if (stopping) return { state };
        if (!checkpoint || checkpoint.ledgerVerified !== true || !/^[A-Za-z0-9_-]{1,128}$/.test(checkpoint.checkpointId) || !fresh(checkpoint) || !restoreCurrent()) throw new Error("WORKER_UNAVAILABLE");
        // Runtime evidence includes actual previous scanner/raster holder recovery,
        // not merely an available service or a sandbox qualification label.
        if (!allowed(options.readiness?.assurance) || !fresh(options.readiness!.current(owner).runtime)) throw new Error("WORKER_UNAVAILABLE");
        await owner.custody.reconcile();
        const ingress = await owner.custody.settleIngress({ kind: "drain" });
        if (!ingress.complete) throw new Error("WORKER_UNAVAILABLE");
        await owner.custody.cleanupOrphans();
        if (!allowed(options.retention?.assurance)) throw new Error("WORKER_UNAVAILABLE");
        retention = await options.retention!.sweep(owner);
        if (stopping) return { state };
        if (!fresh(retention)) throw new Error("WORKER_UNAVAILABLE");
        dispatch = options.dispatch?.(owner);
        if (dispatch && (dispatch.repository !== owner.repository || dispatch.custody !== owner.custody || dispatch.clock !== owner.clock || dispatch.keys.custody !== owner.custody || dispatch.reconstruction.scope !== owner.custody)) throw new Error("WORKER_OWNER_MISMATCH");
        owner.repository.pruneAdmissionEvents(now());
        // Synchronous SQLite pruning has no async/case/custody scope and cannot
        // interleave a transaction. Keep its five-minute bound during slow I/O.
        pruneTimer = setInterval(() => {
          try { owner!.repository.pruneAdmissionEvents(now()); } catch { healthy = false; emit("WORKER_UNAVAILABLE"); }
        }, MAINTENANCE_MS);
        pruneTimer.unref();
        maintenanceAt = owner.clock.now().getTime() + MAINTENANCE_MS; retentionAt = owner.clock.now().getTime() + RETENTION_MS;
        healthy = true; started = true; state = "running";
        const rows = project();
        if (options.rpc) {
          rpc = createWorkerRpc(owner.repository, { ...options.rpc, custody: owner.custody, clock: owner.clock, readiness: worker });
          await new Promise<void>((resolve, reject) => { rpc!.once("error", reject); rpc!.listen(options.rpc!.socketPath, resolve); });
          rpc.on("error", () => { healthy = false; emit("WORKER_UNAVAILABLE"); });
        }
        schedule(rows);
      } catch { healthy = false; if (!stopping) state = "unavailable"; emit("WORKER_UNAVAILABLE"); }
      return { state };
    }),
    runOnce: () => exclusive(async () => {
      if (state !== "running" || !owner) return { dispatched: false, nextWakeAt: null };
      let dispatched = false;
      try {
        const time = owner.clock.now().getTime();
        if (time >= maintenanceAt) {
          owner.repository.pruneAdmissionEvents(now());
          const ingress = await owner.custody.settleIngress({ kind: "expired" });
          await owner.custody.cleanupOrphans();
          healthy = ingress.complete;
          maintenanceAt = time + MAINTENANCE_MS;
        }
        if (time >= retentionAt) {
          retention = allowed(options.retention?.assurance) ? await options.retention!.sweep(owner) : null;
          retentionAt = time + RETENTION_MS;
        }
        let rows = project();
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
      if (!drainWork) {
        // This requests actual producer termination without waiting for SMTP.
        const ingress = owner?.custody.settleIngress({ kind: "drain" }).catch(() => null);
        drainWork = exclusive(async () => {
          const result = await ingress;
          if (owner && (!result?.complete || !(await owner.custody.settleIngress({ kind: "drain" })).complete)) return false;
          await options.services?.settle();
          if (rpc?.listening) await new Promise<void>((resolve, reject) => rpc!.close(error => error ? reject(error) : resolve()));
          await options.services?.close();
          owner?.repository.close(); if (pruneTimer) clearInterval(pruneTimer); state = "stopped"; return true;
        }).catch(() => false);
        const attempt = drainWork;
        void attempt.then(complete => { if (!complete && drainWork === attempt) drainWork = undefined; });
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
