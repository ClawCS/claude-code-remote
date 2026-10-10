import type Database from "better-sqlite3";
import { KeyObject } from "node:crypto";
import { openName } from "./crypto";
import { openContact } from "./contact-crypto";
import { readAdminDelivery } from "./delivery-repository";
import { readAdminPending } from "./lifecycle-repository";
import { readIncidentResolution } from "./incident-resolution";
import { validatedEarlyCleanup } from "./erasure-repository";
import { berlinDate, lifecycleIndicators } from "./lifecycle";
import { applicationId, utcInstant, type AdminCaseDetail, type AdminCasePage, type AdminCaseSummary, type ApplicationId, type ApplicationRepository, type CaseRecord, type Instant, type SafetyJournal, type StaffSession } from "./types";

function unavailable(): never { throw new Error("ADMIN_UNAVAILABLE"); }
function displayInstant(value: string): Instant { if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) unavailable(); return utcInstant(value); }
type Key = Readonly<{ acceptedAt: Instant; id: ApplicationId }>;
function seek(value: Key): Key {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || Reflect.ownKeys(value).length !== 2) unavailable();
  const d = Object.getOwnPropertyDescriptors(value);
  if (!d.acceptedAt || !d.id || !("value" in d.acceptedAt) || !("value" in d.id) || typeof d.acceptedAt.value !== "string" || typeof d.id.value !== "string") unavailable();
  return Object.freeze({ acceptedAt: displayInstant(d.acceptedAt.value), id: applicationId(d.id.value) });
}
function cursor(value: Key): string {
  const result = Buffer.from(JSON.stringify([1, value.acceptedAt, value.id]), "utf8");
  if (result.length > 96 || result.toString("base64url").length > 128) unavailable();
  return result.toString("base64url");
}
function bounded<T>(value: T, bytes: number): T { if (Buffer.byteLength(JSON.stringify(value), "utf8") > bytes) unavailable(); return value; }
function activeSession(value: StaffSession): StaffSession {
  try {
    const keys = ["sessionId", "staffId", "generation", "issuedAt", "expiresAt"];
    if (!value || Object.getPrototypeOf(value) !== Object.prototype || Reflect.ownKeys(value).length !== keys.length) throw new Error();
    const d = Object.getOwnPropertyDescriptors(value);
    if (keys.some(k => !d[k as keyof StaffSession] || !("value" in d[k as keyof StaffSession]))) throw new Error();
    const active = Object.fromEntries(keys.map(k => [k, d[k as keyof StaffSession].value])) as unknown as StaffSession;
    if (typeof active.sessionId !== "string" || !/^[a-f0-9]{64}$/.test(active.sessionId) || typeof active.staffId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(active.staffId) || !Number.isSafeInteger(active.generation) || active.generation < 1) throw new Error();
    displayInstant(active.issuedAt); displayInstant(active.expiresAt); return Object.freeze(active);
  } catch { throw new Error("AUTH_DENIED"); }
}

// Internal, single construction owner. No callback/SQL/key binder is exposed
// through ApplicationRepository, and no second connection is opened here.
export function createAdminReadRepository(db: Database.Database, privateKey: KeyObject | undefined, deps: Readonly<{
  authorize(session: StaffSession): Instant;
  ready(): void;
  readCase(id: ApplicationId): CaseRecord;
  denied(id: ApplicationId, scope: "identity" | "payload" | "contact"): boolean;
  journal: SafetyJournal | undefined;
  mailbox(row: CaseRecord): AdminCaseDetail["mailbox"];
  retention(id: ApplicationId): AdminCaseDetail["retention"];
}>): Pick<ApplicationRepository, "listAdminCases" | "getAdminCase"> {
  const key = privateKey instanceof KeyObject && privateKey.type === "private" && privateKey.asymmetricKeyType === "rsa" && (privateKey.asymmetricKeyDetails?.modulusLength ?? 0) >= 2048 && (privateKey.asymmetricKeyDetails?.modulusLength ?? 0) <= 8192 && privateKey.asymmetricKeyDetails?.publicExponent === BigInt(65537) ? privateKey : null;
  let budget: { remaining: number } | null = null;
  const prepare = db.prepare.bind(db);
  // Count every original-owner SQL statement and returned row, including nested
  // auth/projection reads. Budget lifetime is the whole synchronous operation.
  db.prepare = ((sql: string) => {
    const statement = prepare(sql);
    for (const method of ["get", "all"] as const) {
      const read = statement[method].bind(statement);
      Object.defineProperty(statement, method, { configurable: true, writable: true, value: (...args: unknown[]) => {
        if (budget && (!statement.readonly || --budget.remaining < 0)) unavailable();
        const result = read(...args);
        if (budget && (budget.remaining -= method === "all" ? (result as unknown[]).length : result === undefined ? 0 : 1) < 0) unavailable();
        return result;
      } });
    }
    const run = statement.run.bind(statement);
    statement.run = ((...args: unknown[]) => { if (budget) unavailable(); return run(...args); }) as typeof statement.run;
    return statement;
  }) as typeof db.prepare;

  function authority(row: CaseRecord): void {
    const proof = deps.journal?.caseAuthority(row.id);
    if (!proof) unavailable();
    const expected = row.lifecycle.pendingEventId ?? (row.lifecycle.authorityKind === "fence" ? row.lifecycle.authorityId : null);
    // A proposed fence may not yet have arrived; acknowledged fences must be
    // the current independent authority. Never recover it during this read.
    const pending = readAdminPending(db, row);
    if (pending?.phase === "proposed" && (proof.latestFence?.eventId ?? null) === (row.lifecycle.authorityKind === "fence" ? row.lifecycle.authorityId : null)) return;
    if ((proof.latestFence?.eventId ?? null) !== expected) unavailable();
  }
  function project(id: ApplicationId, now: Instant, detail: boolean): { summary: AdminCaseSummary; detail: AdminCaseDetail | null } | null {
    // Denial precedes selection of private case/lifecycle/incident columns.
    if (deps.denied(id, "identity")) return null;
    if (!db.prepare("SELECT 1 FROM cases WHERE id=?").get(id)) return null;
    const row = deps.readCase(id);
    if (row.lifecycle.identityState !== "identifying") return null;
    displayInstant(row.acceptedAt);
    if (row.acceptedAt > now || !/^TJ-[A-F0-9]{24}$/.test(row.reference) || !["sales-fulltime", "sales-parttime"].includes(row.job) || !["queued", "scanning", "ready", "sending", "smtp_accepted", "uncertain", "delivered", "needs_attention"].includes(row.deliveryState)) unavailable();
    const delivery = readAdminDelivery(db, row, deps.denied), resolution = readIncidentResolution(db, id);
    if (resolution && displayInstant(resolution.recordedAt) > now) unavailable();
    for (const at of [delivery.confirmedAt, delivery.determinedAt, delivery.cleanupDueAt, delivery.incidentAt, delivery.manualRequiredAt]) if (at !== null) displayInstant(at);
    if ((delivery.confirmedAt !== null) !== (row.deliveryState === "delivered")) unavailable();
    if (delivery.determinedAt && (delivery.determinedAt < row.acceptedAt || delivery.determinedAt > now) || delivery.confirmedAt && (delivery.confirmedAt < row.acceptedAt || delivery.confirmedAt > now)) unavailable();
    if (delivery.category !== null && !delivery.determinedAt || row.deliveryState === "needs_attention" && (!delivery.category || !delivery.reason || !delivery.determinedAt)) unavailable();
    const early = validatedEarlyCleanup(row, delivery);
    const deadline = delivery.confirmedAt ? null : displayInstant(new Date(Math.min(Date.parse(row.acceptedAt) + 30 * 86400000, resolution ? Date.parse(resolution.recordedAt) : Infinity, delivery.category === "invalid" ? Math.min(Date.parse(row.contactDeleteAfter), Date.parse(delivery.determinedAt!) + 86400000) : Infinity)).toISOString());
    if (deadline !== null && now >= deadline) return null;
    authority(row);
    const retention = deps.retention(id);
    const pending = readAdminPending(db, row);
    const summary: AdminCaseSummary = bounded(Object.freeze({ id, reference: row.reference, name: openName(row.encryptedName, key!), job: row.job, acceptedAt: row.acceptedAt, version: row.version, caseState: row.caseState, deliveryState: row.deliveryState, closedOn: row.closedOn, deadline: row.lifecycle.deadline, deleteFrom: row.lifecycle.deleteFrom, holdReviewOn: row.lifecycle.hold?.reviewOn ?? null, manualCategory: row.lifecycle.manualCategory, hints: Object.freeze(lifecycleIndicators(row, berlinDate(new Date(now)))), pendingAction: pending !== null, identityValidUntil: deadline }), 3072);
    if (!detail) return { summary, detail: null };
    let contact: AdminCaseDetail["contact"] = null;
    if (row.deliveryState === "needs_attention" && delivery.category === "operational" && delivery.reason && delivery.determinedAt && !delivery.confirmedAt && delivery.copies.length === 0 && row.claimToken === null && !pending && !resolution && !deps.denied(id, "contact")) {
      const validUntil = displayInstant(new Date(Math.min(Date.parse(row.contactDeleteAfter), Date.parse(row.acceptedAt) + 30 * 86400000, early ?? Infinity)).toISOString());
      if (now < validUntil && delivery.contactEnvelope !== null) contact = Object.freeze({ email: openContact(delivery.contactEnvelope, { caseId: id, acceptedAt: row.acceptedAt, version: 1 }, key!), validUntil });
    }
    return { summary, detail: Object.freeze({ case: summary, observedAt: now, holdReason: row.lifecycle.hold?.reason ?? null, deliveryIssue: delivery.category && delivery.reason && delivery.determinedAt ? Object.freeze({ category: delivery.category, reason: delivery.reason, determinedAt: delivery.determinedAt, incidentAt: delivery.incidentAt, manualRequiredAt: delivery.manualRequiredAt }) : null, mailbox: deps.mailbox(row), externalCopies: Object.freeze({ confirmed: row.lifecycle.externalCopiesConfirmed, at: row.lifecycle.externalCopiesAt }), retention, contact, pending }) };
  }
  function read<T>(session: StaffSession, limit: number, action: (initial: Instant, finish: () => Instant) => T): T {
    if (budget) unavailable();
    budget = { remaining: limit - 2 }; // BEGIN and COMMIT statements
    try {
      return db.transaction(() => {
        const active = activeSession(session);
        const initial = displayInstant(deps.authorize(active)); deps.ready(); if (!key) unavailable();
        return action(initial, () => { const final = displayInstant(deps.authorize(active)); deps.ready(); if (final < initial) unavailable(); return final; });
      }).deferred();
    } catch (error) { if (error instanceof Error && error.message === "AUTH_DENIED") throw new Error("AUTH_DENIED"); unavailable(); }
    finally { budget = null; }
  }
  return Object.freeze({
    listAdminCases(after: Key | null, session: StaffSession): AdminCasePage {
      return read(session, 4096, (initial, finish) => {
        const start = after === null ? null : seek(after);
        const keys = (start ? db.prepare("SELECT acceptedAt,id FROM cases INDEXED BY maintenance_accepted_due WHERE (acceptedAt,id)>(?,?) ORDER BY acceptedAt,id LIMIT 21").all(start.acceptedAt, start.id) : db.prepare("SELECT acceptedAt,id FROM cases INDEXED BY maintenance_accepted_due ORDER BY acceptedAt,id LIMIT 21").all()) as Key[];
        keys.forEach(seek);
        const examined = keys.slice(0, 20), summaries = examined.map(k => project(k.id, initial, false)?.summary).filter((s): s is AdminCaseSummary => s !== undefined);
        const observedAt = finish();
        const cases = summaries.filter(s => !deps.denied(applicationId(s.id), "identity") && (s.identityValidUntil === null || observedAt < s.identityValidUntil));
        return bounded(Object.freeze({ cases: Object.freeze(cases), next: keys.length > 20 ? cursor(examined[19]) : null, observedAt }), 65536);
      });
    },
    getAdminCase(id: ApplicationId, session: StaffSession): AdminCaseDetail | null {
      return read(session, 256, (initial, finish) => {
        applicationId(id); const result = project(id, initial, true)?.detail ?? null, observedAt = finish();
        if (!result || deps.denied(id, "identity") || result.case.identityValidUntil !== null && observedAt >= result.case.identityValidUntil) return null;
        return bounded(Object.freeze({ ...result, observedAt, contact: result.contact && observedAt < result.contact.validUntil && !deps.denied(id, "contact") ? result.contact : null }), 8192);
      });
    },
  });
}
