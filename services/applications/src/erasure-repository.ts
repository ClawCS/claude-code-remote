import type Database from "better-sqlite3";
import { createHash, randomBytes } from "node:crypto";
import { decodeJournalEvent, encodeJournalEvent } from "./ledger-contract";
import { admissionScopeAccepts, registrationAssociation } from "./deletion-association";
import { externalAttestationAssociation, replayAssociation } from "./erasure-association";
import { createErasureRowSelector, createCustodyInventoryStorage } from "./erasure-storage";
import type { CustodyConfig, CustodyLedger } from "./types";
import { berlinDate, operatorReason } from "./lifecycle";
import { assertMaintenance, assertMaintenanceSettled, maintenanceCommand, maintenanceRemaining, selectMaintenance, type MaintenanceRun } from "./worker-maintenance";
import { advanceAuthMaintenanceClock } from "./auth-repository";
import { applicationId, staffId, utcInstant, type ApplicationId, type ApplicationRepository, type CaseRecord, type CurrentExternalAttestation, type CurrentMailboxClear, type DeletionScope, type DeliveryRecord, type DurableReceipt, type EraseJournalEvent, type EraseScope, type ErasureRowCursor, type ErasureRowPage, type ErasureWork, type ErasureWorkPage, type FinalErasureEvidence, type SafetyJournal } from "./types";

// Private 11B admission contract for commands without a consumedItems DTO.
// Reserve BEFORE calling; these bounds include nested fixed owner validation,
// bounded lookahead and bookkeeping. Any throw stops new-work admission.
// withErasureGuard is already included in every rowPage's twenty-item charge;
// reserve it separately when its callback does not call rowPage.
// Bounds: raw case/lifecycle <=7 rows; delivery <=16; currentClear <=41
// including I1 latch, pending lookahead, receipts and projection authority.
// Scope consistency adds two composite-PK range probes (<=1 row each),
// including when the current replay history is large; no history traversal.
// currentFinalEvidence <=93: case7 + scope3 + delivery16 + clear64 + audit2
// + one spare. prepare <=144: reserved final128 + pending2 + scope3 + case7
// + identity1 + writes3. acknowledge <=147: final128 + phase1 + work4 +
// scope3 + case7 + identity1 + update1 + two spare bookkeeping credits.
// Rounded reserves below deliberately charge empty fixed queries as well.
// R92: lockRestoredAuthentication is instead one mandatory cold bootstrap
// transaction BEFORE authentication/bounded erasure invocations. Existing auth
// rows have no total cap, so it has no claimed item/latency bound. Task14 must
// qualify its exclusive startup/resource/DB cleanup window; never split it or
// treat a JavaScript timeout as interruption. Failure remains cold/denied.
export const ERASURE_COMMAND_ITEMS=Object.freeze({pending:2,currentClear:64,currentFinalEvidence:128,prepareCommit:256,acknowledge:192,withErasureGuard:20});

export interface ErasureOwner {
  bindCustody(custody: CustodyLedger, config: CustodyConfig): ReturnType<typeof createCustodyInventoryStorage>;
  readonly journal: SafetyJournal | undefined;
  pending(id: ApplicationId): EraseJournalEvent | null;
  prepareCommit(id: ApplicationId, scope: EraseScope): EraseJournalEvent;
  acknowledge(event: EraseJournalEvent, receipt: DurableReceipt): void;
  currentFinalEvidence(id: ApplicationId): FinalErasureEvidence | null;
  withErasureGuard<T>(commitEventId: string, action: (work: ErasureWork) => Promise<T>): Promise<T>;
  listWork(remainingItems: number): ErasureWorkPage;
  rowPage(commitEventId: string, cursor: ErasureRowCursor | null, remainingItems: number): ErasureRowPage;
  lockRestoredAuthentication(): void;
  listDue(run: MaintenanceRun): Promise<DuePage>;
  prepareDue(candidate: DueCandidate, run: MaintenanceRun): Promise<Readonly<{ event: EraseJournalEvent; consumedItems: number }>>;
  expireGlobalBatch(run: MaintenanceRun): Promise<Readonly<{ deleted: number; hasMore: boolean; consumedItems: number }>>;
  listPending(run: MaintenanceRun): Promise<Readonly<{ items: readonly PendingMaintenance[]; hasMore: boolean; consumedItems: number }>>;
  listCommitted(run: MaintenanceRun): Promise<ErasureWorkPage>;
  reconcileClaim(commitEventId: string, run: MaintenanceRun): Promise<Readonly<{ changed: boolean; consumedItems: number }>>;
}
export type PendingMaintenance = Readonly<{ kind: "proposed"; event: EraseJournalEvent }> | Readonly<{ kind: "needs-done"; work: ErasureWork }>;
export interface DueCandidate { readonly caseId: ApplicationId; readonly scope: EraseScope; readonly dueAt: string }
export interface DuePage { readonly items: readonly DueCandidate[]; readonly hasMore: boolean; readonly consumedItems: number }
const owners = new WeakMap<ApplicationRepository, ErasureOwner>();
export function bindErasureOwner(repository: ApplicationRepository, owner: ErasureOwner): void { if (owners.has(repository)) throw new Error("ERASURE_ALREADY_OWNED"); owners.set(repository, owner); }
export function erasureOwner(repository: ApplicationRepository): ErasureOwner { const owner = owners.get(repository); if (!owner) throw new Error("ERASURE_UNAVAILABLE"); return owner; }
function fail(code = "ERASURE_STORAGE_INVALID"): never { throw new Error(code); }
const scopes: readonly EraseScope[] = ["processing_payload", "processing_contact", "incident_identity", "public_token", "identifying_register"];
type Phase = { eventId: string; caseId: ApplicationId; event: string; phase: "proposed" | "acknowledged"; entry: DurableReceipt["entry"] | null; head: DurableReceipt["head"] | null };
interface Dependencies {
  readonly repository: ApplicationRepository;
  readonly journal: SafetyJournal | undefined;
  readonly now: () => string;
  readonly guard: (id: ApplicationId) => void;
  readonly guarded: <T>(id: ApplicationId, action: () => Promise<T>) => Promise<T>;
  readonly readCase: (id: ApplicationId) => CaseRecord;
  readonly delivery: (id: ApplicationId) => DeliveryRecord;
  readonly currentClear: (id: ApplicationId) => CurrentMailboxClear | null;
  readonly scope: () => DeletionScope;
  readonly lockAuthentication: () => void;
}
export function createErasureRepository(db: Database.Database, deps: Dependencies): ErasureOwner {
  const boundCustodies = new WeakSet<CustodyLedger>();
  const selectRows=createErasureRowSelector(db);
  const candidates = new WeakMap<DueCandidate, { run: MaintenanceRun; used: boolean }>();
  const dueStreams = [
    ["cases", "payloadDeleteAfter", "id", "maintenance_payload_due", "processing_payload", 0],
    ["cases", "contactDeleteAfter", "id", "maintenance_contact_due", "processing_contact", 0],
    ["cases", "acceptedAt", "id", "maintenance_accepted_due", "public_token", 7],
    ["cases", "acceptedAt", "id", "maintenance_accepted_due", "incident_identity", 30],
    ["deliveries", "cleanupDueAt", "caseId", "maintenance_cleanup_due", "processing_payload", 0],
    ["deliveries", "cleanupDueAt", "caseId", "maintenance_cleanup_due", "processing_contact", 0],
    ["deliveries", "determinedAt", "caseId", "maintenance_invalid_due", "incident_identity", 1],
    ["case_lifecycle", "deleteFrom", "caseId", "deletion_due", "identifying_register", 0],
  ] as const;
  async function listDue(run: MaintenanceRun): Promise<DuePage> {
    const remaining = maintenanceRemaining(run, deps.repository);
    // State query+row(2), cursor query+row(2), key query(1), lookahead(1),
    // two fairness writes(2); per parent row(1), two point queries+rows(4).
    const limit = Math.min(20, remaining.selections, Math.floor((remaining.items - 8) / 5));
    if (limit < 1) return Object.freeze({ items: Object.freeze([]), hasMore: true, consumedItems: 0 });
    const result = await maintenanceCommand(run, deps.repository, 8 + 5 * limit, "scalar", () => db.transaction(() => {
      assertMaintenance(run, deps.repository);
      const phase = (db.prepare("SELECT duePhase FROM maintenance_selectors WHERE singleton=1").get() as { duePhase: number }).duePhase;
      const cursor = db.prepare("SELECT keyAt,keyId FROM maintenance_due_cursors WHERE stream=?").get(phase) as { keyAt: string; keyId: string };
      const [table, column, id, index, scope, days] = dueStreams[phase];
      const cutoff = phase === 7 ? berlinDate(new Date(remaining.now)) : new Date(Date.parse(remaining.now) - days * 86400000).toISOString();
      const selected = db.prepare(`SELECT ${column} AS keyAt,${id} AS caseId FROM ${table} INDEXED BY ${index} WHERE ${phase === 6 ? "category='invalid' AND " : ""}${column}<=? AND (${column},${id})>(?,?) ORDER BY ${column},${id} LIMIT ?`).all(cutoff, cursor.keyAt, cursor.keyId, limit + 1) as { keyAt: string; caseId: ApplicationId }[];
      const page = selected.slice(0, limit), items: DueCandidate[] = []; let consumed = 7 + selected.length;
      for (const row of page) {
        applicationId(row.caseId); selectMaintenance(run, deps.repository, `case:${row.caseId}`);
        const covering = scope === "processing_contact" || scope === "public_token" ? [scope, "incident_identity", "identifying_register"] : [scope, "identifying_register"];
        consumed++;
        const covered = db.prepare(`SELECT 1 FROM erasure_scopes WHERE caseId=? AND scope IN(${covering.map(() => "?").join(",")}) LIMIT 1`).get(row.caseId, ...covering);
        if (covered) { consumed++; continue; }
        consumed++;
        if (db.prepare("SELECT 1 FROM erasure_events WHERE caseId=? AND phase='proposed' LIMIT 1").get(row.caseId)) { consumed++; continue; }
        const candidate = Object.freeze({ caseId: row.caseId, scope, dueAt: phase === 7 ? row.keyAt : new Date(Date.parse(row.keyAt) + days * 86400000).toISOString() });
        candidates.set(candidate, { run, used: false }); items.push(candidate);
      }
      const last = selected.length > limit ? page.at(-1) : undefined;
      db.prepare("UPDATE maintenance_due_cursors SET keyAt=?,keyId=? WHERE stream=?").run(last?.keyAt ?? "", last?.caseId ?? "", phase);
      // Rotate after EVERY bounded page; a large/blocked stream cannot monopolize.
      db.prepare("UPDATE maintenance_selectors SET duePhase=? WHERE singleton=1").run((phase + 1) % 8);
      return { value: Object.freeze({ items: Object.freeze(items), hasMore: true }), consumedItems: consumed };
    }).immediate());
    return Object.freeze({ ...result.value, consumedItems: result.consumedItems });
  }
  function reconcileSelectedClaim(id: ApplicationId, run: MaintenanceRun): boolean {
    assertMaintenance(run, deps.repository); deps.guard(id);
    const row = db.prepare("SELECT claimOwner,claimedAt,claimToken,claimKind,deliveryState FROM cases WHERE id=?").get(id) as { claimOwner: string | null; claimedAt: string | null; claimToken: string | null; claimKind: string | null; deliveryState: string } | undefined;
    if (!row || [row.claimOwner, row.claimedAt, row.claimToken, row.claimKind].every(value => value === null)) return false;
    if (!row.claimOwner || !/^[A-Za-z0-9_-]{1,128}$/.test(row.claimOwner) || !row.claimToken || !/^[a-f0-9]{64}$/.test(row.claimToken) || !row.claimedAt || !["prepare", "send", "reconcile"].includes(row.claimKind ?? "")) fail("ERASURE_CLAIM_ACTIVE");
    try { utcInstant(row.claimedAt); } catch { fail("ERASURE_CLAIM_ACTIVE"); }
    if ((row.claimKind === "prepare" && row.deliveryState !== "scanning") || (row.claimKind === "send" && !["ready", "sending"].includes(row.deliveryState)) || (row.claimKind === "reconcile" && !["smtp_accepted", "uncertain"].includes(row.deliveryState))) fail("ERASURE_CLAIM_ACTIVE");
    // Same continuous runtime hold includes prior workers. Full scopes/senders
    // were settled at begin; no ordinary producer may have started since.
    assertMaintenance(run, deps.repository);
    const changed = db.prepare("UPDATE cases SET claimOwner=NULL,claimedAt=NULL,claimToken=NULL,claimKind=NULL WHERE id=? AND claimOwner=? AND claimedAt=? AND claimToken=? AND claimKind=? AND deliveryState=?").run(id, row.claimOwner, row.claimedAt, row.claimToken, row.claimKind, row.deliveryState).changes;
    if (changed !== 1) fail("ERASURE_CLAIM_ACTIVE");
    assertMaintenance(run, deps.repository); return true;
  }
  async function prepareDue(candidate: DueCandidate, run: MaintenanceRun) {
    const record = candidates.get(candidate);
    if (!record || record.run !== run || record.used) fail("ERASURE_CANDIDATE_INVALID");
    record.used = true;
    assertMaintenanceSettled(run, deps.repository);
    // prepareCommit256 + original guard20 + claim query/row2 + exact CAS1.
    const result = await maintenanceCommand(run, deps.repository, 279, "scalar", () => deps.guarded(candidate.caseId, async () => {
      assertMaintenance(run, deps.repository);
      return db.transaction(() => { reconcileSelectedClaim(candidate.caseId, run); const event = prepareCommit(candidate.caseId, candidate.scope); assertMaintenance(run, deps.repository); return { value: event, consumedItems: 279 }; }).immediate();
    }));
    return Object.freeze({ event: result.value, consumedItems: result.consumedItems });
  }
  async function expireGlobalBatch(run: MaintenanceRun) {
    const remaining = maintenanceRemaining(run, deps.repository);
    // Fixed state query/row2, secure_delete1, select1, fairness write1;
    // auth clock query/row+write3. Each selected row and exact delete cost2.
    const limit = Math.min(100, Math.floor((remaining.items - 8) / 2));
    if (limit < 1) return Object.freeze({ deleted: 0, hasMore: true, consumedItems: 0 });
    const result = await maintenanceCommand(run, deps.repository, 8 + 2 * limit, "scalar", () => db.transaction(() => {
      assertMaintenance(run, deps.repository);
      if (db.pragma("secure_delete", { simple: true }) !== 1) fail("ERASURE_SANITATION_REQUIRED");
      const phase = (db.prepare("SELECT globalPhase FROM maintenance_selectors WHERE singleton=1").get() as { globalPhase: number }).globalPhase;
      const [table, column, index] = [["abuse_events", "expiresAt", "abuse_events_expiry"], ["deletion_diagnostics", "expiresAt", "maintenance_diagnostics_expiry"], ["deletion_searches", "expiresAt", "maintenance_searches_expiry"], ["auth_attempts", "at", "maintenance_auth_expiry"]][phase];
      let consumed = 5;
      if (phase === 3) { advanceAuthMaintenanceClock(db, utcInstant(remaining.now)); consumed += 3; }
      const cutoff = phase === 3 ? new Date(Date.parse(remaining.now) - 900000).toISOString() : remaining.now;
      const rows = db.prepare(`SELECT rowid FROM ${table} INDEXED BY ${index} WHERE ${column}<=? ORDER BY ${column},rowid LIMIT ?`).all(cutoff, limit) as { rowid: number }[];
      let deleted = 0;
      for (const row of rows) {
        if (!Number.isSafeInteger(row.rowid)) fail();
        deleted += db.prepare(`DELETE FROM ${table} WHERE rowid=? AND ${column}<=?`).run(row.rowid, cutoff).changes; consumed += 2;
      }
      assertMaintenance(run, deps.repository);
      db.prepare("UPDATE maintenance_selectors SET globalPhase=? WHERE singleton=1").run((phase + 1) % 4);
      return { value: Object.freeze({ deleted, hasMore: true }), consumedItems: consumed };
    }).immediate());
    return Object.freeze({ ...result.value, consumedItems: result.consumedItems });
  }
  async function listPending(run: MaintenanceRun) {
    const remaining = maintenanceRemaining(run, deps.repository);
    // Two state/cursor query+row pairs4, optional projection query+row2,
    // <=4 disjoint indexed range queries/lookahead1/two writes2. Each key1 + phase
    // point query/row2 + verified work's two fixed join pairs4 = at most7.
    const limit = Math.min(20, remaining.selections, Math.floor((remaining.items - 13) / 7));
    if (limit < 1) return Object.freeze({ items: Object.freeze([]), hasMore: true, consumedItems: 0 });
    const result = await maintenanceCommand(run, deps.repository, 13 + 7 * limit, "scalar", () => db.transaction(() => {
      const phase = (db.prepare("SELECT pendingPhase FROM maintenance_selectors WHERE singleton=1").get() as { pendingPhase: number }).pendingPhase;
      const cursor = db.prepare("SELECT keyAt,keyCase,keyEvent FROM maintenance_pending_cursors WHERE stream=?").get(phase) as { keyAt: string; keyCase: string; keyEvent: string };
      const selected: { keyAt: string; caseId: ApplicationId; eventId: string }[] = []; let consumed = 6;
      const select = (sql: string, args: readonly unknown[]) => {
        if (selected.length >= limit + 1) return;
        consumed++; selected.push(...db.prepare(sql).all(...args, limit + 1 - selected.length) as typeof selected);
      };
      if (phase === 0) {
        // SQLite does not seek a row-value bound beginning with an expression.
        // Disjoint prefix ranges avoid scanning equal-time predecessors.
        const prefix = "SELECT json_extract(event,'$[2]') AS keyAt,caseId,eventId FROM erasure_events INDEXED BY maintenance_proposed WHERE phase='proposed' AND ";
        const order = " ORDER BY json_extract(event,'$[2]'),caseId,eventId LIMIT ?";
        select(prefix + "json_extract(event,'$[2]')=? AND caseId=? AND eventId>? ORDER BY eventId LIMIT ?", [cursor.keyAt, cursor.keyCase, cursor.keyEvent]);
        select(prefix + "json_extract(event,'$[2]')=? AND caseId>? ORDER BY caseId,eventId LIMIT ?", [cursor.keyAt, cursor.keyCase]);
        select(prefix + "json_extract(event,'$[2]')>?" + order, [cursor.keyAt]);
      } else {
        const projection = db.prepare("SELECT pass FROM journal_projection WHERE singleton=1").get() as { pass: string }; consumed += 2;
        const prefix = "SELECT sequence AS keyAt,caseId,commitEventId AS eventId FROM erasure_obligations INDEXED BY maintenance_completed WHERE stage='locally-complete' AND inspectionGeneration=? AND ";
        const order = " ORDER BY length(sequence),sequence,caseId,commitEventId LIMIT ?", length = cursor.keyAt.length;
        select(prefix + "length(sequence)=? AND sequence=? AND caseId=? AND commitEventId>? ORDER BY commitEventId LIMIT ?", [projection.pass, length, cursor.keyAt, cursor.keyCase, cursor.keyEvent]);
        select(prefix + "length(sequence)=? AND sequence=? AND caseId>? ORDER BY caseId,commitEventId LIMIT ?", [projection.pass, length, cursor.keyAt, cursor.keyCase]);
        select(prefix + "length(sequence)=? AND sequence>? ORDER BY sequence,caseId,commitEventId LIMIT ?", [projection.pass, length, cursor.keyAt]);
        select(prefix + "length(sequence)>?" + order, [projection.pass, length]);
      }
      consumed += selected.length;
      const page = selected.slice(0, limit), items: PendingMaintenance[] = [];
      for (const key of page) {
        applicationId(key.caseId); selectMaintenance(run, deps.repository, `case:${key.caseId}`); consumed += 2;
        if (phase === 0) {
          const row = db.prepare("SELECT event FROM erasure_events WHERE eventId=? AND caseId=? AND phase='proposed'").get(key.eventId, key.caseId) as { event: string } | undefined;
          if (!row) fail(); const event = decodeJournalEvent(row.event);
          if ((event[3] !== "erase_commit" && event[3] !== "erase_done") || event[1] !== key.eventId || event[4][0] !== key.caseId || event[2] !== key.keyAt) fail();
          items.push(Object.freeze({ kind: "proposed", event }));
        } else {
          const row = db.prepare("SELECT historicalDone FROM erasure_obligations WHERE commitEventId=?").get(key.eventId) as { historicalDone: string | null };
          if (row.historicalDone !== null) continue;
          const current = work(key.eventId); consumed += 4;
          if (current.caseId !== key.caseId || current.stage !== "locally-complete") fail();
          items.push(Object.freeze({ kind: "needs-done", work: current }));
        }
      }
      const last = selected.length > limit ? page.at(-1) : undefined;
      db.prepare("UPDATE maintenance_pending_cursors SET keyAt=?,keyCase=?,keyEvent=? WHERE stream=?").run(last?.keyAt ?? "", last?.caseId ?? "", last?.eventId ?? "", phase);
      db.prepare("UPDATE maintenance_selectors SET pendingPhase=? WHERE singleton=1").run(1 - phase);
      assertMaintenance(run, deps.repository);
      return { value: Object.freeze({ items: Object.freeze(items), hasMore: true }), consumedItems: consumed };
    }).immediate());
    return Object.freeze({ ...result.value, consumedItems: result.consumedItems });
  }
  async function listCommitted(run: MaintenanceRun): Promise<ErasureWorkPage> {
    const remaining = maintenanceRemaining(run, deps.repository), maximum = Math.min(remaining.items, 4 + 6 * remaining.selections);
    if (maximum < 10) return Object.freeze({ items: Object.freeze([]), hasMore: true, consumedItems: 0 });
    const result = await maintenanceCommand(run, deps.repository, maximum, "scalar", () => {
      const page = owner.listWork(maximum);
      for (const work of page.items) selectMaintenance(run, deps.repository, `commit:${work.commitEventId}`);
      return { value: page, consumedItems: page.consumedItems };
    });
    return result.value;
  }
  async function reconcileClaim(commitEventId: string, run: MaintenanceRun) {
    assertMaintenanceSettled(run, deps.repository);
    // Existing guard resolution reserve20 + selected claim query/row/CAS3.
    const result = await maintenanceCommand(run, deps.repository, 23, "scalar", async () => {
      const initial = work(commitEventId); selectMaintenance(run, deps.repository, `commit:${commitEventId}`);
      return deps.guarded(initial.caseId, async () => {
        assertMaintenance(run, deps.repository);
        return db.transaction(() => { const current = work(commitEventId); if (current.caseId !== initial.caseId) fail(); return { value: reconcileSelectedClaim(current.caseId, run), consumedItems: 23 }; }).immediate();
      });
    });
    return Object.freeze({ changed: result.value, consumedItems: result.consumedItems });
  }
  function pending(id: ApplicationId): EraseJournalEvent | null {
    deps.guard(id);
    const phase = db.prepare("SELECT event FROM erasure_events WHERE caseId=? AND phase='proposed'").get(id) as { event: string } | undefined;
    if (!phase) return null;
    const event = decodeJournalEvent(phase.event);
    if ((event[3] !== "erase_commit" && event[3] !== "erase_done") || event[4][0] !== id) fail();
    return event;
  }
  function attestation(row: CaseRecord): CurrentExternalAttestation | null {
    const l = row.lifecycle;
    if (!l.externalCopiesConfirmed) return null;
    const audit = db.prepare("SELECT sequence,version,actor,at,reason,newExternalConfirmed,newExternalAt,newExternalActor,newExternalReason FROM lifecycle_audit WHERE caseId=? AND kind='confirm-external-copies' ORDER BY sequence DESC LIMIT 1").get(row.id) as (CurrentExternalAttestation & { newExternalConfirmed: number; newExternalAt: string; newExternalActor: string; newExternalReason: string }) | undefined;
    if (!audit || audit.newExternalConfirmed !== 1 || audit.actor !== l.externalCopiesActor || audit.at !== l.externalCopiesAt || audit.reason !== l.externalCopiesReason || audit.newExternalAt !== audit.at || audit.newExternalActor !== audit.actor || audit.newExternalReason !== audit.reason) return null;
    if (!Number.isSafeInteger(audit.sequence) || audit.sequence < 1 || !Number.isSafeInteger(audit.version) || audit.version < 1 || audit.version > row.version) fail();
    staffId(audit.actor); utcInstant(audit.at); operatorReason(audit.reason);
    const invalidated = db.prepare("SELECT 1 FROM lifecycle_audit WHERE caseId=? AND sequence>? AND newExternalConfirmed=0 LIMIT 1").get(row.id, audit.sequence);
    if (invalidated) return null;
    return Object.freeze({ sequence: audit.sequence, version: audit.version, actor: audit.actor, at: audit.at, reason: audit.reason });
  }
  function currentFinalEvidence(id: ApplicationId): FinalErasureEvidence | null {
    deps.guard(id); const row = deps.readCase(id), now = utcInstant(deps.now());
    if (row.claimToken || row.caseState !== "rejected_closed" || row.lifecycle.hold || !row.lifecycle.deleteFrom || row.lifecycle.deleteFrom > berlinDate(new Date(now)) || row.lifecycle.pendingEventId || !row.acceptanceEpochId) return null;
    const scope = deps.scope(), delivery = deps.delivery(id), clear = deps.currentClear(id), audit = attestation(row);
    if (!clear || !audit || !delivery.registered || !scope.approvedScopes.some(item => item[0] === row.acceptanceEpochId && admissionScopeAccepts(item, row.submission, row.acceptedAt))) return null;
    const intent = clear.intentEvent[4];
    if (intent[6] !== scope.associationKeyId || intent[7] !== registrationAssociation(scope, row.acceptanceEpochId, delivery.registered)) return null;
    return Object.freeze({ caseId: id, caseVersion: row.version, safetyRevision: row.lifecycle.safetyRevision, clear, attestation: audit, externalAttestationAssociation: externalAttestationAssociation(scope, id, audit) });
  }
  function due(row: CaseRecord, delivery: DeliveryRecord, scope: EraseScope, now: string): void {
    const at = Date.parse(row.acceptedAt), time = Date.parse(now), day = 86400000;
    if (time < at) fail("ERASURE_NOT_DUE");
    if (scope === "public_token") { if (time < at + 7 * day) fail("ERASURE_NOT_DUE"); return; }
    let early: number | null = null;
    if (delivery.confirmedAt || delivery.category === "invalid") {
      const determined = delivery.confirmedAt ?? delivery.determinedAt;
      if (!determined || determined < row.acceptedAt || !delivery.cleanupDueAt) fail();
      const expected = Math.min(Date.parse(determined) + 23 * 3600000, Date.parse(row.payloadDeleteAfter) - 3600000, Date.parse(row.contactDeleteAfter) - 3600000);
      if (Date.parse(delivery.cleanupDueAt) !== expected) fail(); early = expected;
    } else if (delivery.cleanupDueAt !== null) fail();
    const deadline = scope === "processing_payload" ? Math.min(Date.parse(row.payloadDeleteAfter), early ?? Infinity)
      : scope === "processing_contact" ? Math.min(Date.parse(row.contactDeleteAfter), early ?? Infinity)
      : delivery.confirmedAt ? Infinity : delivery.category === "invalid" ? Math.min(Date.parse(row.contactDeleteAfter), Date.parse(delivery.determinedAt!) + day) : at + 30 * day;
    if (time < deadline) fail("ERASURE_NOT_DUE");
  }
  function prepareCommit(id: ApplicationId, target: EraseScope): EraseJournalEvent {
    deps.guard(id); applicationId(id); if (!scopes.includes(target)) fail();
    return db.transaction(() => {
      const old = pending(id); if (old) { if (old[3] !== "erase_commit" || old[4][1] !== target) fail("ERASURE_PENDING"); return old; }
      const scope = deps.scope(), row = deps.readCase(id), now = utcInstant(deps.now());
      if (row.claimToken !== null) fail("ERASURE_CLAIM_ACTIVE");
      const identity = db.prepare("SELECT sessionHash,idempotencyKey FROM cases WHERE id=?").get(id) as { sessionHash: import("./types").Digest; idempotencyKey: string } | undefined;
      if (!identity) fail();
      const association = replayAssociation(scope, identity.sessionHash, identity.idempotencyKey), eventId = randomBytes(16).toString("hex");
      let event: EraseJournalEvent;
      if (target === "identifying_register") {
        const evidence = currentFinalEvidence(id); if (!evidence) fail("ERASURE_FINAL_EVIDENCE_REQUIRED");
        const intent = evidence.clear.intentEvent[4];
        event = ["tj-journal-event-v1", eventId, now, "erase_commit", [id, target, scope.associationKeyId, association, intent[2], intent[3], String(evidence.caseVersion), evidence.clear.clearEvent[1], evidence.externalAttestationAssociation]];
      } else { due(row, deps.delivery(id), target, now); event = ["tj-journal-event-v1", eventId, now, "erase_commit", [id, target, scope.associationKeyId, association]]; }
      const wire = encodeJournalEvent(event);
      db.prepare("INSERT INTO erasure_events(eventId,caseId,event,phase) VALUES(?,?,?,'proposed')").run(eventId, id, wire);
      db.prepare("INSERT INTO erasure_replay(ledgerId,historyEpoch,associationKeyId,replayAssociation,stagedEventId) VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING").run(scope.ledgerId, scope.historyEpoch, scope.associationKeyId, association, eventId);
      db.prepare("INSERT INTO erasure_scopes(caseId,scope,eventId,committed) VALUES(?,?,?,0) ON CONFLICT DO NOTHING").run(id, target, eventId);
      return decodeJournalEvent(wire) as EraseJournalEvent;
    }).immediate();
  }
  function work(commitEventId: string): ErasureWork {
    if (typeof commitEventId !== "string" || !/^[a-f0-9]{32}$/.test(commitEventId)) fail();
    const row = db.prepare("SELECT o.* FROM erasure_obligations o JOIN journal_projection p ON p.pass=o.inspectionGeneration WHERE o.commitEventId=? AND p.singleton=1 AND o.ledgerId=p.ledgerId AND o.historyEpoch=p.historyEpoch").get(commitEventId) as ErasureWork | undefined;
    const fact = db.prepare("SELECT f.event,f.sequence,f.entryHash FROM journal_facts f JOIN journal_projection p ON p.pass=f.pass WHERE p.singleton=1 AND f.eventId=?").get(commitEventId) as { event: string; sequence: string; entryHash: string } | undefined;
    if (!row || !fact) fail("ERASURE_UNVERIFIED");
    const event = decodeJournalEvent(fact.event);
    if (event[3] !== "erase_commit" || event[4][0] !== row.caseId || event[4][1] !== row.scope || event[4][2] !== row.associationKeyId || event[4][3] !== row.replayAssociation || row.sequence !== fact.sequence || row.entryHash !== fact.entryHash) fail();
    return Object.freeze({ commitEventId, caseId: row.caseId, scope: row.scope, ledgerId: row.ledgerId, historyEpoch: row.historyEpoch, associationKeyId: row.associationKeyId, replayAssociation: row.replayAssociation, sequence: row.sequence, entryHash: row.entryHash, stage: row.stage });
  }
  function acknowledge(event: EraseJournalEvent, receipt: DurableReceipt): void {
    deps.guard(event[4][0]);
    const p = db.prepare("SELECT * FROM erasure_events WHERE eventId=?").get(event[1]) as Phase | undefined;
    if (!p || p.caseId !== event[4][0] || p.event !== encodeJournalEvent(event) || event[3] !== "erase_commit") fail();
    const current = work(event[1]), scope = deps.scope();
    if (scope.ledgerId !== current.ledgerId || scope.historyEpoch !== current.historyEpoch || scope.associationKeyId !== current.associationKeyId) fail();
    const raw=deps.readCase(p.caseId),identity=db.prepare("SELECT sessionHash,idempotencyKey FROM cases WHERE id=?").get(p.caseId) as {sessionHash:import("./types").Digest;idempotencyKey:string}|undefined;
    if(raw.claimToken!==null)fail("ERASURE_CLAIM_ACTIVE");
    if(!identity||replayAssociation(scope,identity.sessionHash,identity.idempotencyKey)!==event[4][3])fail();
    if(event[4][1]!=="identifying_register")due(raw,deps.delivery(p.caseId),event[4][1],utcInstant(deps.now()));
    if (typeof receipt.entry !== "string" || typeof receipt.head !== "string" || Buffer.byteLength(receipt.entry)>4096 || Buffer.byteLength(receipt.head)>1024) fail();
    let entry: unknown, head: unknown; try { entry = JSON.parse(receipt.entry); head = JSON.parse(receipt.head); } catch { fail(); }
    if (!Array.isArray(entry) || !Array.isArray(head) || entry.length!==2 || head.length!==2 || !Array.isArray(entry[0]) || !Array.isArray(head[0]) || entry[0].length!==8 || head[0].length!==9 || typeof entry[1]!=="string" || typeof head[1]!=="string" || !/^[A-Za-z0-9_-]{86}$/.test(entry[1]) || !/^[A-Za-z0-9_-]{86}$/.test(head[1]) || JSON.stringify(entry)!==receipt.entry || JSON.stringify(head)!==receipt.head) fail();
    const e=entry[0],h=head[0];
    if (e[0]!=="tj-journal-entry-v1" || h[0]!=="tj-journal-head-v1" || e[1]!==scope.ledgerId || e[2]!==scope.historyEpoch || h[1]!==e[1] || h[2]!==e[2] || encodeJournalEvent(e[7])!==p.event || e[4]!==current.sequence || h[4]!==current.sequence || h[5]!==current.entryHash || h[6]!==event[1] || h[7]!==event[2] || createHash("sha256").update("tj-journal-entry-hash-v1\n"+JSON.stringify(e)).digest("hex")!==current.entryHash) fail();
    if (event[4][1] === "identifying_register") {
      const evidence=currentFinalEvidence(p.caseId),payload=event[4];
      if (!evidence || String(evidence.caseVersion)!==payload[6] || evidence.clear.clearEvent[1]!==payload[7] || evidence.externalAttestationAssociation!==payload[8]) fail("ERASURE_FINAL_EVIDENCE_REQUIRED");
    }
    if(p.phase==="acknowledged") { if(p.entry!==receipt.entry||p.head!==receipt.head) fail(); return; }
    db.prepare("UPDATE erasure_events SET phase='acknowledged',entry=?,head=? WHERE eventId=? AND phase='proposed'").run(receipt.entry,receipt.head,event[1]);
  }
  function budget(value:number):void { if(!Number.isSafeInteger(value)||value<1||value>1000) fail("ERASURE_BUDGET_INVALID"); }
  const owner: ErasureOwner = Object.freeze({ journal:deps.journal,pending,prepareCommit,acknowledge,currentFinalEvidence,listDue,prepareDue,expireGlobalBatch,listPending,listCommitted,reconcileClaim,
    bindCustody(custody: CustodyLedger, config: CustodyConfig) {
      if (boundCustodies.has(custody)) fail("ERASURE_ALREADY_OWNED");
      const storage = createCustodyInventoryStorage(db, deps.repository, custody, config); boundCustodies.add(custody); return storage;
    },
    async withErasureGuard<T>(commitEventId:string,action:(value:ErasureWork)=>Promise<T>):Promise<T> {
      const initial=work(commitEventId);
      return deps.guarded(initial.caseId,async()=>{ const current=work(commitEventId); const claim=db.prepare("SELECT claimToken,claimOwner,claimedAt FROM cases WHERE id=?").get(current.caseId) as {claimToken:string|null;claimOwner:string|null;claimedAt:string|null}|undefined; if(claim&&Object.values(claim).some(value=>value!==null)) fail("ERASURE_CLAIM_ACTIVE"); return action(current); });
    },
    listWork(remainingItems:number):ErasureWorkPage {
      budget(remainingItems); if(remainingItems<10)return Object.freeze({items:Object.freeze([]),hasMore:true,consumedItems:0});
      return db.transaction(()=>{
        let cycle=(db.prepare("SELECT cycle FROM erasure_progress WHERE singleton=1").get() as {cycle:number}).cycle;
        // Selection + obligation/projection + fact/projection + fairness update:
        // six scalar rows per item; four more cover cycle/empty retry/lookahead.
        const limit=Math.min(20,Math.floor((remainingItems-4)/6));
        const select=()=>db.prepare("SELECT o.commitEventId FROM erasure_obligations o INDEXED BY erasure_work_order JOIN journal_projection p ON p.pass=o.inspectionGeneration WHERE p.singleton=1 AND o.stage!='locally-complete' AND o.selectedCycle<? ORDER BY o.selectedCycle,length(o.sequence),o.sequence,o.caseId,o.commitEventId LIMIT ?").all(cycle,limit+1) as {commitEventId:string}[];
        let selected=select(); if(!selected.length){if(!Number.isSafeInteger(cycle+1))fail();cycle++;db.prepare("UPDATE erasure_progress SET cycle=? WHERE singleton=1").run(cycle);selected=select();}
        const hasMore=selected.length>limit,items=selected.slice(0,limit).map(item=>{const result=work(item.commitEventId);db.prepare("UPDATE erasure_obligations SET selectedCycle=? WHERE commitEventId=?").run(cycle,item.commitEventId);return result;});
        return Object.freeze({items:Object.freeze(items),hasMore,consumedItems:4+6*items.length});
      }).immediate();
    },
    rowPage(commitEventId:string,cursor:ErasureRowCursor|null,remainingItems:number):ErasureRowPage {
      budget(remainingItems);if(remainingItems<22)fail("ERASURE_BUDGET_INSUFFICIENT");
      const current=work(commitEventId);deps.guard(current.caseId);
      // Twenty credits conservatively include BOTH withErasureGuard resolutions
      // and this page's obligation/fact/projection/claim/covering-scope reads.
      // Charge this even when the same guard spans several pages. 11B must stop
      // new-work admission after a failure and count its mutations separately.
      const claim=db.prepare("SELECT claimToken,claimOwner,claimedAt FROM cases WHERE id=?").get(current.caseId) as {claimToken:string|null;claimOwner:string|null;claimedAt:string|null}|undefined;
      if(claim&&Object.values(claim).some(value=>value!==null))fail("ERASURE_CLAIM_ACTIVE");
      if(current.scope==="incident_identity"&&!db.prepare("SELECT 1 FROM erasure_obligations o JOIN journal_projection p ON p.pass=o.inspectionGeneration WHERE o.caseId=? AND o.scope IN('processing_payload','identifying_register') AND o.stage='locally-complete' LIMIT 1").get(current.caseId))fail("ERASURE_PAYLOAD_COVERAGE_REQUIRED");
      const page=selectRows(current,cursor,remainingItems-20);return Object.freeze({...page,consumedItems:page.consumedItems+20});
    },
    lockRestoredAuthentication:deps.lockAuthentication,
  });
  return owner;
}
