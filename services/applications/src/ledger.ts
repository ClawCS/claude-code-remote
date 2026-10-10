import { randomBytes } from "node:crypto";
import { decodeJournalEvent, encodeJournalEvent, validateJournalTrust, verifyJournalCheckpoint, verifyJournalEntry, verifyJournalReceipt, verifyNextJournalEntry } from "./ledger-contract";
import { applicationId, type ApplicationId, type DeletionLedgerPort, type DurableReceipt, type JournalCheckpoint, type JournalClock, type JournalEvent, type JournalProgress, type JournalSafetyProjection, type LedgerTrustContext, type LedgerTrustPort, type SafetyJournal } from "./types";

interface Dependencies { readonly port: DeletionLedgerPort; readonly trust: LedgerTrustPort; readonly clock: JournalClock; readonly projection?: JournalSafetyProjection }
interface Pending {
  readonly event: JournalEvent;
  receipt?: DurableReceipt;
  barrier?: JournalEvent;
  target?: DurableReceipt;
  targetEvent?: JournalEvent;
  challengeStarted?: number;
  replay: JournalCheckpoint;
  memberSeen: boolean;
}
const ownedPorts = new WeakSet<DeletionLedgerPort>();
interface Work {
  readonly admitted: number;
  phase: "waiting" | "append" | "replay";
  deadline: number;
  expired: boolean;
  ownsPending: boolean;
  timer: ReturnType<typeof setTimeout>;
  run(): Promise<void>;
  expire(): void;
}
function failure(code: string): Error { return new Error(`JOURNAL_${code}`); }
function cloneReceipt(receipt: DurableReceipt): DurableReceipt { return Object.freeze({ entry: receipt.entry, head: receipt.head }); }
function snapshot(context: LedgerTrustContext | null): LedgerTrustContext {
  if (!context) throw failure("UNAVAILABLE");
  validateJournalTrust(context);
  const copy = Object.freeze({ ...context, anchor: Object.freeze({ cursor: context.anchor.cursor, receipt: context.anchor.receipt === null ? null : cloneReceipt(context.anchor.receipt) }) });
  verifyJournalCheckpoint(copy.anchor, copy);
  return copy;
}
function identity(context: LedgerTrustContext): string {
  return JSON.stringify([context.ledgerId, context.historyEpoch, context.writerEpoch, context.keyId, context.publicKey.export({ type: "spki", format: "der" }).toString("hex"), context.genesisHash, context.operationalStart, context.operationalEnd, context.anchor.cursor, context.anchor.receipt]);
}

/** Worker-local sole coordinator. Construction and signatures do not qualify the
 * injected storage or trust ports. Production composition must own exactly one. */
export function createSafetyJournal({ port, trust, clock, projection }: Dependencies): SafetyJournal {
  if (ownedPorts.has(port)) throw failure("ALREADY_OWNED");
  let context: LedgerTrustContext;
  try { context = snapshot(trust.currentContext()); } catch { throw failure("UNAVAILABLE"); }
  const pinned = identity(context), anchor = verifyJournalCheckpoint(context.anchor, context);
  let checkpoint = anchor, pending: Pending | null = null, lastReceipt: DurableReceipt | null = null, headReceipt = context.anchor.receipt;
  let lastEvent: JournalEvent | null = null, observedAt: number | null = null, unknown = false;
  let wallHigh = -Infinity, monoHigh = -Infinity, clockFailed = false;
  let active: Work | null = null;
  const waiting: Work[] = [];
  const admittedOwners = new Set<Promise<void>>();
  function settle(): Promise<void> { return Promise.all([...admittedOwners]).then(() => {}); }

  function now(): { wall: number; mono: number } {
    const wallDate = clock.wallNow(), wall = wallDate.getTime(), mono = clock.monotonicNow();
    if (clockFailed || !Number.isFinite(wall) || !Number.isFinite(mono) || mono < 0 || wall < wallHigh || mono < monoHigh || wallDate.toISOString() < context.operationalStart || wallDate.toISOString() > context.operationalEnd) {
      clockFailed = true; observedAt = null; throw failure("UNAVAILABLE");
    }
    wallHigh = wall; monoHigh = mono; return { wall, mono };
  }
  function current() {
    try {
      if (identity(snapshot(trust.currentContext())) !== pinned) throw failure("UNAVAILABLE");
      return now();
    } catch { observedAt = null; throw failure("UNAVAILABLE"); }
  }
  current();
  projection?.beginProjection(context.anchor);
  ownedPorts.add(port);
  function observation(): JournalCheckpoint | null {
    try { const time = current(); return !pending && !unknown && observedAt !== null && time.mono - observedAt < 60_000 ? checkpoint : null; }
    catch { return null; }
  }
  function caseAuthority(caseId: ApplicationId) {
    try {
      applicationId(caseId); const head = observation(); if (!head || !projection) return null;
      const latestFence = projection.readCaseAuthority(caseId, head);
      if (observation() !== head) return null;
      return Object.freeze({ head: Object.freeze({ sequence: head.sequence, hash: head.hash, observedAt: head.observedAt, cursor: head.cursor }), latestFence });
    } catch { return null; }
  }
  function continuation(): JournalProgress { return { kind: "continuation", checkpoint: pending?.replay ?? checkpoint, next: pending?.target ? "continue-replay" : "refresh" }; }
  function guard(work: Work): void {
    current();
    if (!work.expired && now().mono >= work.deadline) work.expire();
    if (work.expired) throw failure("EXPIRED");
  }
  function drain(): void {
    if (active) return;
    while (waiting.length) {
      const work = waiting.shift()!;
      if (work.expired) continue;
      if (clock.monotonicNow() >= work.admitted + 15_000) { work.expire(); continue; }
      active = work; work.phase = "append";
      void work.run();
      return;
    }
  }
  function enqueue<T>(action: (work: Work) => Promise<T>, replayOnly = false, progressResult = true): Promise<T> {
    let admitted: number;
    try { admitted = current().mono; } catch { return Promise.reject(failure("UNAVAILABLE")); }
    if (active && waiting.length >= 2) return Promise.reject(failure("QUEUE_FULL"));
    let settled!: () => void;
    const ownership = new Promise<void>(resolve => { settled = resolve; }); admittedOwners.add(ownership);
    const release = () => { admittedOwners.delete(ownership); settled(); };
    return new Promise<T>((resolve, reject) => {
      let delivered = false;
      const work: Work = {
        admitted, deadline: admitted + 15_000, phase: "waiting", expired: false, ownsPending: false, timer: undefined as unknown as ReturnType<typeof setTimeout>,
        expire() {
          if (work.expired) return;
          work.expired = true; delivered = true;
          if (work.phase === "waiting") { const index = waiting.indexOf(work); if (index >= 0) waiting.splice(index, 1); release(); reject(failure("QUEUE_EXPIRED")); }
          else if (work.phase === "replay" && progressResult) { observedAt = null; resolve(continuation() as T); }
          else { if (work.ownsPending && pending) unknown = true; observedAt = null; reject(failure(unknown ? "UNKNOWN" : "UNAVAILABLE")); }
        },
        async run() {
          let result: T | undefined, error: unknown;
          try {
            guard(work);
            if (replayOnly) replayPhase(work);
            result = await action(work);
          } catch (caught) {
            // A queued preflight rejection does not own the previous command's
            // retained replay and must not invalidate its verified continuation.
            if (!work.expired && work.ownsPending && pending) { unknown = true; observedAt = null; }
            error = work.ownsPending && pending ? failure("UNKNOWN") : caught instanceof Error ? caught : failure("UNAVAILABLE");
          }
          // All underlying awaits (including iterator cleanup) settled. Release
          // before delivering normal completion, never on caller timeout alone.
          clearTimeout(work.timer); active = null; release(); drain();
          if (!delivered) { delivered = true; if (error) reject(error); else resolve(result as T); }
        },
      };
      work.timer = setTimeout(work.expire, 15_000);
      waiting.push(work); drain();
    });
  }
  function replayPhase(work: Work): void {
    clearTimeout(work.timer); work.phase = "replay"; work.deadline = current().mono + 30_000;
    work.timer = setTimeout(work.expire, 30_000);
  }
  function proposed(event: JournalEvent): JournalEvent { return decodeJournalEvent(encodeJournalEvent(event)); }
  function freshBarrier(purpose: "startup" | "restore" | "refresh"): JournalEvent {
    if (!["startup", "restore", "refresh"].includes(purpose)) throw failure("INVALID");
    return proposed(["tj-journal-event-v1", randomBytes(16).toString("hex"), new Date(current().wall).toISOString(), "barrier", [randomBytes(32).toString("hex"), checkpoint.hash, purpose]]);
  }
  async function appendExact(event: JournalEvent, work: Work, capture: (receipt: DurableReceipt) => void): Promise<DurableReceipt> {
    guard(work);
    const receipt = await port.append(event);
    // Check bindings before retaining the late reply, but never treat a late
    // reply as current success. Its running slot survives until this settles.
    verifyJournalReceipt(event, receipt, context);
    const copy = cloneReceipt(receipt); capture(copy); guard(work); return copy;
  }
  function timeBinding(event: JournalEvent, start: number, end: number): void {
    const observed = Date.parse(event[2]);
    if (observed < start - 30_000 || observed > end + 30_000) throw failure("UNAVAILABLE");
  }
  async function replay(work: Work): Promise<JournalProgress> {
    const state = pending;
    if (!state?.target) throw failure("UNAVAILABLE");
    work.ownsPending = true;
    const target = verifyJournalReceipt(state.targetEvent ?? state.barrier ?? state.event, state.target, context);
    const member = state.receipt ? verifyJournalReceipt(state.event, state.receipt, context) : null;
    if (member && state.replay.sequence === member.sequence && state.replay.hash === member.hash) state.memberSeen = true;
    let count = 0, bytes = 0;
    const iterator = port.readSince(state.replay.cursor)[Symbol.asyncIterator]();
    try {
      while (state.replay.sequence !== target.sequence) {
        guard(work);
        if (count >= 1000 || bytes >= 8 * 1024 * 1024) return continuation();
        const next = await iterator.next(); guard(work);
        if (next.done) throw failure("INCOMPLETE");
        if (typeof next.value !== "string") throw failure("INVALID");
        const size = Buffer.byteLength(next.value, "utf8");
        if (bytes + size > 8 * 1024 * 1024) return continuation();
        const entry = verifyNextJournalEntry(state.replay, next.value, context);
        if (BigInt(entry.sequence) > BigInt(target.sequence)) throw failure("INVALID");
        if (member && entry.sequence === member.sequence) {
          if (entry.wire !== state.receipt!.entry) throw failure("CONFLICT");
          state.memberSeen = true;
        }
        if (entry.sequence === target.sequence && (entry.hash !== target.hash || entry.wire !== state.target.entry)) throw failure("INVALID");
        guard(work); projection?.applyVerifiedEntry(state.replay, entry); guard(work);
        state.replay = entry;
        if (BigInt(entry.sequence) > BigInt(checkpoint.sequence)) checkpoint = entry;
        count++; bytes += size;
      }
      if (state.replay.hash !== target.hash || !state.memberSeen) throw failure("INCOMPLETE");
    } finally {
      // Async iterator cleanup may itself remain live. Do not free ownership.
      if (iterator.return) await iterator.return();
    }
    guard(work);
    const fresh = state.challengeStarted !== undefined && current().mono - state.challengeStarted < 60_000;
    lastReceipt = state.receipt ?? state.target; lastEvent = state.event; headReceipt = state.target;
    pending = null; unknown = false;
    if (!fresh) { observedAt = null; return continuation(); }
    observedAt = state.challengeStarted!;
    return { kind: "observed", checkpoint, receipt: state.target };
  }
  function append(event: JournalEvent): Promise<DurableReceipt> {
    let value: JournalEvent;
    try {
      current(); value = proposed(event);
      if (lastEvent?.[1] === value[1]) {
        if (encodeJournalEvent(lastEvent) !== encodeJournalEvent(value)) throw failure("CONFLICT");
        if (!unknown && !pending && lastReceipt) return Promise.resolve(lastReceipt);
      }
      if (unknown || (pending && !active)) throw failure("UNKNOWN");
    } catch (error) { return Promise.reject(error); }
    return enqueue(async work => {
      if (lastEvent?.[1] === value[1] && lastReceipt && !pending && !unknown) {
        if (encodeJournalEvent(lastEvent) !== encodeJournalEvent(value)) throw failure("CONFLICT");
        return lastReceipt;
      }
      if (!observation()) throw failure(pending || unknown ? "UNKNOWN" : "UNAVAILABLE");
      const start = current(), priorObservation = observedAt; timeBinding(value, start.wall, start.wall);
      pending = { event: value, replay: checkpoint, memberSeen: false, challengeStarted: start.mono }; work.ownsPending = true; observedAt = null;
      const receipt = await appendExact(value, work, r => { pending!.receipt = r; pending!.target = r; });
      const entry = verifyJournalReceipt(value, receipt, context);
      if (BigInt(entry.sequence) <= BigInt(checkpoint.sequence)) {
        if (!headReceipt) throw failure("UNAVAILABLE");
        pending.target = headReceipt;
        pending.targetEvent = verifyJournalEntry(headReceipt.entry, context).event;
        pending.replay = anchor; pending.challengeStarted = priorObservation ?? undefined;
      } else verifyNextJournalEntry(checkpoint, receipt.entry, context);
      timeBinding(value, start.wall, current().wall); guard(work);
      replayPhase(work);
      const result = await replay(work);
      if (result.kind !== "observed" && pending) throw failure("UNKNOWN");
      return receipt;
    }, false, false);
  }
  function refresh(purpose: "startup" | "restore" | "refresh"): Promise<JournalProgress> {
    if (unknown || (pending && !active)) return Promise.reject(failure("UNKNOWN"));
    return enqueue(async work => {
      if (pending || unknown) throw failure("UNKNOWN");
      const start = current(), event = freshBarrier(purpose);
      pending = { event, replay: checkpoint, memberSeen: false, challengeStarted: start.mono }; work.ownsPending = true; observedAt = null;
      const receipt = await appendExact(event, work, r => { pending!.receipt = r; pending!.target = r; });
      timeBinding(event, start.wall, current().wall); verifyJournalReceipt(event, receipt, context);
      replayPhase(work); return replay(work);
    });
  }
  function recover(event?: JournalEvent): Promise<JournalProgress> {
    if (active) return Promise.reject(failure("BUSY"));
    let value: JournalEvent;
    try {
      value = proposed(event ?? pending?.event as JournalEvent);
      if (pending && encodeJournalEvent(value) !== encodeJournalEvent(pending.event)) throw failure("CONFLICT");
    } catch (error) { return Promise.reject(error); }
    return enqueue(async work => {
      pending ??= { event: value, replay: anchor, memberSeen: false };
      work.ownsPending = true;
      const state = pending; observedAt = null;
      if (!state.receipt) await appendExact(state.event, work, r => { state.receipt = r; });
      // The old exact receipt never renews freshness. Reconcile through a new
      // challenge, keeping a possibly in-flight challenge's exact ID on retry.
      if (!state.barrier) {
        state.barrier = freshBarrier("refresh"); state.challengeStarted = current().mono;
        state.target = undefined; state.targetEvent = undefined; state.replay = anchor; state.memberSeen = false;
      }
      if (!state.target) await appendExact(state.barrier, work, r => { state.target = r; });
      unknown = false; replayPhase(work); return replay(work);
    });
  }
  function continueReplay(): Promise<JournalProgress> {
    if (active) return Promise.reject(failure("BUSY"));
    if (unknown || !pending?.target) return Promise.reject(failure("UNAVAILABLE"));
    return enqueue(replay, true);
  }
  return Object.freeze({ append, refresh, recover, continueReplay, observation, caseAuthority, settle });
}
