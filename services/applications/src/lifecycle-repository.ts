import type Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import { tokenDigest } from "./auth-crypto";
import { decodeJournalEvent, encodeJournalEvent } from "./ledger-contract";
import { caseFenceAction, decideCaseAction, validateCaseAction, validateLifecycle } from "./lifecycle";
import { applicationId, digest, staffId, utcInstant, type ActionGrant, type ApplicationId, type CaseAction, type CaseLifecycle, type CaseRecord, type DurableReceipt, type Instant, type JournalEvent, type LifecycleRecoveryPage, type SafetyJournal, type SensitiveAction, type StaffSession } from "./types";
import type { AuthRepository } from "./auth-repository";
import { readIncidentResolution, validateIncidentResolution } from "./incident-resolution";
import type { DeliveryRecord, IncidentResolutionInput, IncidentResolutionResult, IncidentResolutionReadResult, IncidentResolutionRetention } from "./types";

type StoredLifecycle = Omit<CaseLifecycle, "hold" | "externalCopiesConfirmed"> & { caseId: ApplicationId; holdReviewOn: CaseLifecycle["deadline"]; holdReason: string | null; holdActor: CaseLifecycle["externalCopiesActor"]; holdAt: Instant | null; externalCopiesConfirmed: number };
interface Proposal { eventId: string; caseId: ApplicationId; event: string; actionBytes: string; grantHash: string; phase: "proposed" | "acknowledged" | "applied" | "superseded"; entry: DurableReceipt["entry"] | null; head: DurableReceipt["head"] | null }
function fail(): never { throw new Error("INVALID_LIFECYCLE_STATE"); }
function receiptBinding(event: JournalEvent, receipt: DurableReceipt): void {
  // The only source is the shared verifying facade, or its already-persisted
  // output. This structural check prevents confusing a recovery barrier receipt
  // with the original case fence. It does not assert storage qualification.
  if (typeof receipt.entry !== "string" || typeof receipt.head !== "string" || Buffer.byteLength(receipt.entry) > 4096 || Buffer.byteLength(receipt.head) > 1024 || Buffer.byteLength(JSON.stringify([receipt.entry, receipt.head])) > 6144) fail();
  try {
    const entry = JSON.parse(receipt.entry), head = JSON.parse(receipt.head);
    if (JSON.stringify(entry) !== receipt.entry || JSON.stringify(head) !== receipt.head || entry.length !== 2 || head.length !== 2 || entry[0].length !== 8 || head[0].length !== 9 || entry[0][0] !== "tj-journal-entry-v1" || head[0][0] !== "tj-journal-head-v1" || encodeJournalEvent(entry[0][7]) !== encodeJournalEvent(event) || head[0][6] !== event[1] || head[0][7] !== event[2] || entry[0][4] !== head[0][4] || !/^[A-Za-z0-9_-]{86}$/.test(entry[1]) || !/^[A-Za-z0-9_-]{86}$/.test(head[1])) fail();
  } catch { fail(); }
}
function proposal(db: Database.Database, eventId: string): Proposal {
  const p = db.prepare("SELECT * FROM lifecycle_proposals WHERE eventId=?").get(eventId) as Proposal | undefined;
  if (!p || !/^[a-f0-9]{32}$/.test(p.eventId) || !["proposed", "acknowledged", "applied", "superseded"].includes(p.phase)) fail();
  const event = decodeJournalEvent(p.event); applicationId(p.caseId); digest(p.grantHash);
  if (event[1] !== eventId || event[3] !== "case_fence" || event[4][0] !== p.caseId || Buffer.byteLength(p.actionBytes) > 4096) fail();
  let action: CaseAction;
  try { action = validateCaseAction(JSON.parse(p.actionBytes)); } catch { fail(); }
  if (JSON.stringify(action) !== p.actionBytes || (event[4][4] === "renew-hold" ? action.kind !== "hold" : event[4][4] !== action.kind)) fail();
  if (p.phase === "proposed") { if (p.entry !== null || p.head !== null) fail(); }
  else { if (p.entry === null || p.head === null) fail(); receiptBinding(event, { entry: p.entry, head: p.head }); }
  return p;
}
export function readLifecycle(db: Database.Database, row: Omit<CaseRecord, "lifecycle">): CaseRecord {
  const stored = db.prepare("SELECT * FROM case_lifecycle WHERE caseId=?").get(row.id) as StoredLifecycle | undefined;
  if (!stored || ![0, 1].includes(stored.externalCopiesConfirmed)) fail();
  const { caseId: _caseId, holdReviewOn, holdReason, holdActor, holdAt, ...state } = stored;
  void _caseId;
  const holdValues = [holdReviewOn, holdReason, holdActor, holdAt];
  if (holdValues.some(value => value !== null) && holdValues.some(value => value === null)) fail();
  const lifecycle: CaseLifecycle = { ...state, externalCopiesConfirmed: stored.externalCopiesConfirmed === 1, hold: holdReviewOn === null ? null : Object.freeze({ reviewOn: holdReviewOn, reason: holdReason!, actor: staffId(holdActor!), at: utcInstant(holdAt!) }) };
  const result: CaseRecord = { ...row, lifecycle: Object.freeze(lifecycle) }; validateLifecycle(result);
  if (lifecycle.authorityKind === "fence") {
    const p = proposal(db, lifecycle.authorityId!); const event = decodeJournalEvent(p.event);
    if (p.caseId !== row.id || p.phase !== "applied" || event[3] !== "case_fence" || Number(event[4][3]) >= row.version) fail();
    const kind = event[4][4] === "renew-hold" ? "hold" : event[4][4];
    if (!db.prepare("SELECT 1 FROM lifecycle_audit WHERE caseId=? AND eventId=? AND version=? AND kind=?").get(row.id, p.eventId, Number(event[4][3]) + 1, kind)) fail();
  }
  const outstanding = db.prepare("SELECT eventId FROM lifecycle_proposals WHERE caseId=? AND phase IN('proposed','acknowledged') LIMIT 2").all(row.id) as { eventId: string }[];
  if (lifecycle.pendingEventId === null ? outstanding.length !== 0 : outstanding.length !== 1 || outstanding[0].eventId !== lifecycle.pendingEventId) fail();
  if (lifecycle.pendingEventId) {
    const p = proposal(db, lifecycle.pendingEventId), event = decodeJournalEvent(p.event);
    if (p.caseId !== row.id || !["proposed", "acknowledged"].includes(p.phase) || event[3] !== "case_fence" || Number(event[4][3]) > row.version) fail();
  }
  return result;
}

export function readAdminPending(db: Database.Database, row: CaseRecord): import("./types").AdminCaseDetail["pending"] {
  if (!row.lifecycle.pendingEventId) return null;
  const p = proposal(db, row.lifecycle.pendingEventId);
  if (p.caseId !== row.id || p.phase !== "proposed" && p.phase !== "acknowledged") fail();
  return Object.freeze({ eventId: p.eventId, kind: validateCaseAction(JSON.parse(p.actionBytes)).kind, phase: p.phase });
}

// Internal composition of the sole DB/auth/clock owner; not an RPC port.
export function createLifecycleRepository(db: Database.Database, readCase: (id: ApplicationId) => CaseRecord, guarded: <T>(id: ApplicationId, action: () => Promise<T>) => Promise<T>, auth: AuthRepository, epochNow: () => ReturnType<typeof digest>, clockNow: () => Instant, journal: SafetyJournal | undefined, incident: Readonly<{ delivery(id: ApplicationId): DeliveryRecord; identityDenied(id: ApplicationId): boolean; prepare(id: ApplicationId): void; retention(id: ApplicationId): IncidentResolutionRetention }>) {
  function requireJournal(): SafetyJournal { if (!journal) throw new Error("CASE_JOURNAL_UNAVAILABLE"); return journal; }
  function requireAuthority(row: CaseRecord, pendingId?: string): void {
    const proof = requireJournal().caseAuthority(row.id);
    if (!proof || (pendingId ? proof.latestFence?.eventId !== pendingId : row.lifecycle.authorityKind === "initial" ? proof.latestFence !== null : !row.lifecycle.authorityId || proof.latestFence?.eventId !== row.lifecycle.authorityId)) throw new Error("CASE_BLOCKED");
  }
  function authorize(session: StaffSession): void {
    const now = clockNow(), epoch = epochNow(), row = auth.session(session.sessionId, epoch, now);
    if (!row || row.staffId !== session.staffId || row.generation !== session.generation || row.issuedAt !== session.issuedAt || row.expiresAt !== session.expiresAt || epochNow() !== epoch) throw new Error("AUTH_DENIED");
  }
  function current(id: ApplicationId, session: StaffSession): CaseRecord { authorize(session); return readCase(id); }
  function ack(p: Proposal, receipt: DurableReceipt): void {
    receiptBinding(decodeJournalEvent(p.event), receipt);
    db.transaction(() => {
      const stored = proposal(db, p.eventId), row = readCase(p.caseId);
      if (stored.event !== p.event || stored.actionBytes !== p.actionBytes || stored.grantHash !== p.grantHash || row.lifecycle.pendingEventId !== p.eventId) throw new Error("CASE_BLOCKED");
      if (stored.phase === "acknowledged") {
        if (stored.entry !== receipt.entry || stored.head !== receipt.head) fail(); return;
      }
      if (stored.phase !== "proposed") fail();
      db.prepare("UPDATE lifecycle_proposals SET phase='acknowledged',entry=?,head=? WHERE eventId=? AND phase='proposed'").run(receipt.entry, receipt.head, p.eventId);
      db.prepare("UPDATE case_lifecycle SET safetyRevision=safetyRevision+1 WHERE caseId=?").run(p.caseId);
    }).immediate();
  }
  async function reconcile(p: Proposal): Promise<"acknowledged" | "continuation"> {
    const facade = requireJournal(), event = decodeJournalEvent(p.event);
    const progress = await facade.recover(event);
    if (progress.kind !== "observed") return "continuation";
    requireAuthority(readCase(p.caseId), p.eventId);
    // recover's receipt belongs to its fresh barrier. Idempotent append retrieves
    // the original receipt and never renews freshness or retries a new ID.
    const receipt = await facade.append(event); ack(p, receipt);
    requireAuthority(readCase(p.caseId), p.eventId);
    return "acknowledged";
  }
  function writeBusiness(before: CaseRecord, after: CaseRecord, action: CaseAction, actor: StaffSession["staffId"], now: Instant, eventId: string | null): CaseRecord {
    const l = after.lifecycle, old = before.lifecycle;
    if (db.prepare("UPDATE cases SET caseState=?,closedOn=?,version=version+1 WHERE id=? AND version=?").run(after.caseState, after.closedOn, before.id, before.version).changes !== 1) throw new Error("CASE_STALE");
    if (db.prepare("UPDATE case_lifecycle SET deadline=?,deleteFrom=?,manualCategory=?,holdReviewOn=?,holdReason=?,holdActor=?,holdAt=?,externalCopiesConfirmed=?,externalCopiesAt=?,externalCopiesActor=?,externalCopiesReason=?,authorityKind=?,authorityId=?,pendingEventId=NULL WHERE caseId=? AND safetyRevision=?").run(l.deadline, l.deleteFrom, l.manualCategory, l.hold?.reviewOn ?? null, l.hold?.reason ?? null, l.hold?.actor ?? null, l.hold?.at ?? null, Number(l.externalCopiesConfirmed), l.externalCopiesAt, l.externalCopiesActor, l.externalCopiesReason, eventId ? "fence" : l.authorityKind, eventId ?? l.authorityId, before.id, old.safetyRevision).changes !== 1) throw new Error("CASE_BLOCKED");
    if (eventId && db.prepare("UPDATE lifecycle_proposals SET phase='applied' WHERE eventId=? AND phase='acknowledged'").run(eventId).changes !== 1) throw new Error("CASE_BLOCKED");
    const record = { caseId: before.id, kind: action.kind, actor, at: now, version: after.version, reason: "reason" in action ? action.reason : null, eventId, oldState: before.caseState, newState: after.caseState, oldClosedOn: before.closedOn, newClosedOn: after.closedOn, oldDeadline: old.deadline, newDeadline: l.deadline, oldDeleteFrom: old.deleteFrom, newDeleteFrom: l.deleteFrom, oldHoldReviewOn: old.hold?.reviewOn ?? null, newHoldReviewOn: l.hold?.reviewOn ?? null, oldHoldReason: old.hold?.reason ?? null, newHoldReason: l.hold?.reason ?? null, oldHoldActor: old.hold?.actor ?? null, newHoldActor: l.hold?.actor ?? null, oldHoldAt: old.hold?.at ?? null, newHoldAt: l.hold?.at ?? null, oldManualCategory: old.manualCategory, newManualCategory: l.manualCategory, oldExternalConfirmed: Number(old.externalCopiesConfirmed), newExternalConfirmed: Number(l.externalCopiesConfirmed), oldExternalAt: old.externalCopiesAt, newExternalAt: l.externalCopiesAt, oldExternalActor: old.externalCopiesActor, newExternalActor: l.externalCopiesActor, oldExternalReason: old.externalCopiesReason, newExternalReason: l.externalCopiesReason };
    const columns = Object.keys(record); db.prepare(`INSERT INTO lifecycle_audit(${columns.join(",")}) VALUES(${columns.map(key => `@${key}`).join(",")})`).run(record);
    db.prepare("INSERT INTO audit(caseId,event,version,at) VALUES(?,?,?,?)").run(before.id, `lifecycle:${action.kind}`, after.version, now);
    return readCase(before.id);
  }
  async function apply(id: ApplicationId, input: CaseAction, proof: ActionGrant, session: StaffSession, recoveryEventId?: string): Promise<CaseRecord> {
    // Snapshot untrusted mutable operands before the first await. Only persisted
    // canonical action bytes are later compared; they never authorize execution.
    const action = validateCaseAction(input), active = Object.freeze({ ...session });
    let hash: ReturnType<typeof digest>, binding: SensitiveAction;
    try {
      hash = tokenDigest("grant", proof.nonce); binding = Object.freeze({ kind: action.kind, caseId: id, version: proof.action.version });
      if (proof.staffId !== active.staffId || proof.action.caseId !== id || proof.action.kind !== action.kind) throw new Error();
    } catch { throw new Error("AUTH_DENIED"); }
    if (recoveryEventId !== undefined && !/^[a-f0-9]{32}$/.test(recoveryEventId)) throw new Error("CASE_BLOCKED");
    return guarded(id, async () => {
      let context = auth.preflight(hash, active, binding, epochNow, clockNow, "CASE_STALE"), row = context.row;
      decideCaseAction(row, action, context.actor, context.now);
      const fenced = caseFenceAction(row, action), bytes = JSON.stringify(action);
      let predecessor: Proposal | null = null;
      if (row.lifecycle.pendingEventId) {
        if (!fenced || recoveryEventId !== row.lifecycle.pendingEventId) throw new Error("CASE_BLOCKED");
        predecessor = proposal(db, recoveryEventId);
        if (predecessor.grantHash === hash) throw new Error("CASE_FRESH_GRANT_REQUIRED");
        const recoveredRevision = row.lifecycle.safetyRevision + (predecessor.phase === "proposed" ? 1 : 0);
        if (await reconcile(predecessor) === "continuation") throw new Error("CASE_JOURNAL_CONTINUATION");
        context = auth.preflight(hash, active, binding, epochNow, clockNow, "CASE_STALE"); row = context.row;
        if (row.lifecycle.pendingEventId !== predecessor.eventId || row.lifecycle.safetyRevision !== recoveredRevision) throw new Error("CASE_BLOCKED");
        decideCaseAction(row, action, context.actor, context.now);
      } else if (recoveryEventId !== undefined) throw new Error("CASE_BLOCKED");
      let eventId: string | null = null, safetyRevision = row.lifecycle.safetyRevision;
      if (fenced) {
        const facade = requireJournal();
        if (!row.lifecycle.initialAuthority || !row.lifecycle.authorityId || !row.lifecycle.authorityKind || !facade.observation()) throw new Error("CASE_BLOCKED");
        requireAuthority(row, predecessor?.eventId);
        eventId = randomBytes(16).toString("hex");
        const event: JournalEvent = ["tj-journal-event-v1", eventId, context.now, "case_fence", [id, predecessor ? "fence" : row.lifecycle.authorityKind, predecessor?.eventId ?? row.lifecycle.authorityId, String(row.version), fenced]];
        db.transaction(() => {
          const fresh = auth.preflight(hash, active, binding, epochNow, clockNow, "CASE_STALE").row;
          if (fresh.lifecycle.safetyRevision !== safetyRevision || fresh.lifecycle.pendingEventId !== (predecessor?.eventId ?? null)) throw new Error("CASE_BLOCKED");
          if (predecessor && db.prepare("UPDATE lifecycle_proposals SET phase='superseded' WHERE eventId=? AND phase='acknowledged'").run(predecessor.eventId).changes !== 1) throw new Error("CASE_BLOCKED");
          db.prepare("INSERT INTO lifecycle_proposals(eventId,caseId,event,actionBytes,grantHash,phase) VALUES(?,?,?,?,?,'proposed')").run(eventId, id, encodeJournalEvent(event), bytes, hash);
          db.prepare("UPDATE case_lifecycle SET pendingEventId=?,safetyRevision=safetyRevision+1 WHERE caseId=?").run(eventId, id);
        }).immediate();
        const receipt = await facade.append(event); ack(proposal(db, eventId), receipt);
        requireAuthority(readCase(id), eventId);
        safetyRevision += 2;
      }
      return auth.withGrant(hash, active, binding, epochNow, clockNow, (currentRow, final) => {
        if (currentRow.lifecycle.safetyRevision !== safetyRevision || currentRow.lifecycle.pendingEventId !== eventId || currentRow.lifecycle.identityState !== "identifying") throw new Error("CASE_BLOCKED");
        if (eventId) {
          const staged = proposal(db, eventId);
          if (staged.phase !== "acknowledged" || staged.actionBytes !== bytes || staged.grantHash !== hash || !requireJournal().observation()) throw new Error("CASE_BLOCKED");
          requireAuthority(currentRow, eventId);
        }
        const after = decideCaseAction(currentRow, action, final.actor, final.now);
        return writeBusiness(currentRow, after, action, final.actor, final.now, eventId);
      }, "CASE_STALE");
    }).catch((error: unknown) => {
      if (error instanceof Error && "code" in error && typeof error.code === "string" && error.code.startsWith("SQLITE_")) throw new Error("CASE_STORAGE_FAILED");
      throw error;
    });
  }
  async function recover(after?: ApplicationId): Promise<LifecycleRecoveryPage> {
    if (after !== undefined) applicationId(after);
    const selected = db.prepare("SELECT caseId FROM case_lifecycle WHERE pendingEventId IS NOT NULL AND caseId>? ORDER BY caseId LIMIT 21").all(after ?? "") as { caseId: ApplicationId }[];
    const cases: LifecycleRecoveryPage["cases"][number][] = [];
    for (const { caseId } of selected.slice(0, 20)) await guarded(caseId, async () => {
      const row = readCase(caseId); if (!row.lifecycle.pendingEventId) return;
      const p = proposal(db, row.lifecycle.pendingEventId);
      let outcome: "acknowledged" | "blocked" | "continuation" = "blocked";
      try { if (row.lifecycle.identityState === "identifying") outcome = await reconcile(p); } catch { /* Retain exact proposal; no automatic business execution. */ }
      const phase = proposal(db, p.eventId).phase;
      if (phase !== "proposed" && phase !== "acknowledged") fail();
      cases.push({ id: caseId, eventId: p.eventId, phase, outcome });
    });
    return { cases, continuation: selected.length > 20 ? selected[19].caseId : null };
  }
  async function recordDeliveryIncidentResolution(id: ApplicationId, input: IncidentResolutionInput, proof: ActionGrant, session: StaffSession): Promise<IncidentResolutionResult> {
    const action = validateIncidentResolution(input), active = Object.freeze({ ...session });
    let hash: ReturnType<typeof digest>, binding: SensitiveAction;
    try {
      hash = tokenDigest("grant", proof.nonce); binding = Object.freeze({ kind: action.kind, caseId: id, version: proof.action.version });
      if (proof.staffId !== active.staffId || proof.action.caseId !== id || proof.action.kind !== action.kind) throw new Error();
    } catch { throw new Error("AUTH_DENIED"); }
    return auth.withGrant(hash, active, binding, epochNow, clockNow, (row, context) => {
      if (row.lifecycle.identityState !== "identifying" || row.lifecycle.pendingEventId || row.claimToken !== null || row.claimOwner !== null || row.claimedAt !== null || row.claimKind !== null || row.deliveryState !== "needs_attention" || !requireJournal().observation()) throw new Error("CASE_BLOCKED");
      requireAuthority(row);
      if (readIncidentResolution(db, id)) throw new Error("INCIDENT_RESOLUTION_EXISTS");
      const delivery = incident.delivery(id);
      if (delivery.category !== "operational" || !delivery.reason || !delivery.determinedAt || delivery.determinedAt < row.acceptedAt || delivery.determinedAt > context.now || delivery.confirmedAt !== null || delivery.copies.length !== 0) throw new Error("CASE_BLOCKED");
      if (action.contactedAt < row.acceptedAt || action.contactedAt > context.now) throw new Error("INCIDENT_RESOLUTION_INVALID");
      if (db.prepare("UPDATE cases SET version=version+1,payloadDeleteAfter=min(payloadDeleteAfter,?),contactDeleteAfter=min(contactDeleteAfter,?) WHERE id=? AND version=?").run(context.now, context.now, id, row.version).changes !== 1) throw new Error("CASE_STALE");
      db.prepare("INSERT INTO delivery_incident_resolutions(caseId,version,actor,recordedAt,contactedAt,contactChannel,agreedResubmissionRoute) VALUES(?,?,?,?,?,?,?)").run(id, row.version + 1, context.actor, context.now, action.contactedAt, action.contactChannel, action.agreedResubmissionRoute);
      db.prepare("INSERT INTO audit(caseId,event,version,at) VALUES(?,?,?,?)").run(id, "delivery:incident-resolution-recorded", row.version + 1, context.now);
      // Captured original synchronous erasure seam; its savepoint and grant
      // consumption roll back with this same original transaction.
      incident.prepare(id);
      return Object.freeze({ record: readIncidentResolution(db, id)!, retention: "commit_pending" as const });
    }, "CASE_STALE").catch((error: unknown) => {
      if (error instanceof Error && "code" in error && typeof error.code === "string" && error.code.startsWith("SQLITE_")) throw new Error("CASE_STORAGE_FAILED");
      throw error;
    });
  }
  function getDeliveryIncidentResolution(id: ApplicationId, session: StaffSession): IncidentResolutionReadResult | null {
    authorize(session); applicationId(id);
    try {
      // Original committed-identity denial wins even without current journal
      // observation. Never select private proof columns after that boundary.
      if (incident.identityDenied(id)) return db.prepare("SELECT 1 FROM delivery_incident_resolutions WHERE caseId=?").get(id)
        ? Object.freeze({ record: null, retention: incident.retention(id) }) : null;
      const record = readIncidentResolution(db, id);
      return record ? Object.freeze({ record, retention: incident.retention(id) }) : null;
    } catch (error) {
      if (error instanceof Error && "code" in error && typeof error.code === "string" && error.code.startsWith("SQLITE_")) throw new Error("CASE_STORAGE_FAILED");
      throw error;
    }
  }
  return { getLifecycleCase: current, applyCaseAction: apply, recoverLifecyclePending: recover, recordDeliveryIncidentResolution, getDeliveryIncidentResolution };
}
