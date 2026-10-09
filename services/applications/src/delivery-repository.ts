import type Database from "better-sqlite3";
import { randomBytes, randomUUID, type KeyObject } from "node:crypto";
import { assertContactEnvelope, openContact } from "./contact-crypto";
import { applicationId, digest, utcInstant, type ApplicationId, type ArtifactRecord, type CaseRecord, type ClaimedCase, type DeliveryAttempt, type DeliveryClaimAuthority, type DeliveryFailure, type DeliveryFailureReason, type DeliveryIdentity, type DeliveryRecord, type DeliveryRepository, type DeliverySnapshot, type DeliveryState, type DeliveryWorkKind, type Instant, type RegisteredMail, type SendOutcome, type VerifiedCopy, type VerificationResult } from "./types";

const HOUR = 3600000, DAY = 24 * HOUR;
const REASONS: readonly DeliveryFailureReason[] = ["INVALID_INPUT", "MALICIOUS_INPUT", "CONTACT_UNAVAILABLE", "ARTIFACT_UNAVAILABLE", "VERIFICATION_FAILED", "DEPENDENCY_UNAVAILABLE", "PERMANENT_SEND_FAILURE", "ATTEMPTS_EXHAUSTED", "RECEIPT_UNRESOLVED", "LEGACY_UNVERIFIED", "PROCESSING_EXPIRED", "MANUAL_REQUIRED"];
const ISSUES = ["INVALID_IDENTITY", "DEPENDENCY_UNAVAILABLE", "CONNECTION_FAILED", "OPERATION_TIMEOUT", "PROTOCOL_LIMIT", "LIST_LIMIT", "FOLDER_UNAVAILABLE", "CANDIDATE_LIMIT", "INCOMPLETE_CONTENT", "CONTENT_MISMATCH", "UIDVALIDITY_CHANGED", "UNSAFE_DELETE_CAPABILITY", "WRITE_UNAVAILABLE", "IDENTITY_CHANGED", "DELETE_UNCERTAIN"];
const plus = (value: Instant, ms: number): Instant => utcInstant(new Date(Date.parse(value) + ms).toISOString());
function invalid(): never { throw new Error("INVALID_DELIVERY_METADATA"); }
function exact(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) invalid();
  return value as Record<string, unknown>;
}
function integer(value: unknown, min: number, max: number): number { if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) invalid(); return value as number; }
function instant(value: unknown): Instant { if (typeof value !== "string") invalid(); try { return utcInstant(value); } catch { return invalid(); } }
function hash(value: unknown) { if (typeof value !== "string") invalid(); try { return digest(value); } catch { return invalid(); } }
function identity(value: DeliveryIdentity, row: CaseRecord): DeliveryIdentity {
  exact(value, ["id", "messageId", "keyId", "date"]);
  if (value.id !== row.id || value.date !== row.acceptedAt || !/^<[A-Za-z0-9._-]{1,120}@trinkgut-jammers\.de>$/.test(value.messageId) || !/^[A-Za-z0-9_-]{1,64}$/.test(value.keyId)) invalid();
  applicationId(value.id); instant(value.date); return { id: value.id, messageId: value.messageId, keyId: value.keyId, date: value.date };
}
function registration(value: RegisteredMail, fixed: DeliveryIdentity): RegisteredMail {
  exact(value, ["id", "messageId", "keyId", "profile", "fingerprint", "shape"]);
  if (value.id !== fixed.id || value.messageId !== fixed.messageId || value.keyId !== fixed.keyId || value.profile !== "tj-mail-1") invalid();
  hash(value.fingerprint); exact(value.shape, ["kind", "parts", "attachments"]);
  const shape = value.shape;
  if (!Array.isArray(shape.attachments) || shape.attachments.length > 5 || !["text", "mixed"].includes(shape.kind) || shape.parts !== (shape.kind === "text" ? 1 : shape.attachments.length + 2) || (shape.kind === "text") !== (shape.attachments.length === 0)) invalid();
  let total = 0;
  const attachments = shape.attachments.map((file, index) => {
    exact(file, ["name", "mediaType", "digest", "bytes"]);
    const ext = ({ "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" } as Record<string, string>)[file.mediaType];
    if (!ext || file.name !== `document-${index + 1}.${ext}`) invalid();
    total += integer(file.bytes, 1, 5242880); hash(file.digest);
    return { name: file.name, mediaType: file.mediaType, digest: file.digest, bytes: file.bytes };
  });
  if (total > 10485760) invalid();
  return { id: value.id, messageId: value.messageId, keyId: value.keyId, profile: "tj-mail-1", fingerprint: value.fingerprint, shape: { kind: shape.kind, parts: shape.parts, attachments } };
}
function outcome(value: SendOutcome): SendOutcome {
  if (value?.kind === "definitely_failed") { exact(value, ["kind", "retryable"]); if (typeof value.retryable !== "boolean") invalid(); return { kind: value.kind, retryable: value.retryable }; }
  exact(value, ["kind"]); if (!["accepted", "uncertain"].includes(value.kind)) invalid(); return { kind: value.kind };
}
function copies(value: unknown, expected: RegisteredMail | null): VerifiedCopy[] {
  if (!Array.isArray(value) || value.length > 20) invalid();
  const seen = new Map<string, string>(), exactCopies = new Set<string>();
  const result = value.map(copy => {
    exact(copy, ["mailbox", "uidValidity", "uid", "fingerprint"]);
    if (typeof copy.mailbox !== "string" || !copy.mailbox || copy.mailbox.length > 4096 || /[\u0000-\u001f\u007f]/.test(copy.mailbox) || typeof copy.uidValidity !== "string" || !/^[1-9][0-9]{0,9}$/.test(copy.uidValidity) || Number(copy.uidValidity) > 4294967295 || !expected || copy.fingerprint !== expected.fingerprint) invalid();
    integer(copy.uid, 1, 4294967295); hash(copy.fingerprint);
    const previous = seen.get(copy.mailbox); if (previous && previous !== copy.uidValidity) invalid(); seen.set(copy.mailbox, copy.uidValidity);
    const identity = JSON.stringify([copy.mailbox, copy.uidValidity, copy.uid]); if (exactCopies.has(identity)) invalid(); exactCopies.add(identity);
    return { mailbox: copy.mailbox, uidValidity: copy.uidValidity, uid: copy.uid, fingerprint: copy.fingerprint };
  });
  if (JSON.stringify(result).length > 90000) invalid();
  return result;
}
function parse(value: string, limit: number): unknown {
  if (typeof value !== "string" || value.length > limit) invalid();
  try { return JSON.parse(value); } catch { return invalid(); }
}
function schedule(start: Instant, acceptedAt: Instant): Instant[] {
  const end = plus(acceptedAt, DAY);
  return [...new Set([start, plus(start, 5 * 60000), plus(start, 30 * 60000), plus(start, HOUR)].filter(slot => slot < end).concat(end))];
}
interface StoredDelivery {
  caseId: ApplicationId; messageId: string | null; keyId: string | null; identityDate: Instant | null; registered: string | null;
  mimeDigest: string | null; sendDueAt: Instant | null; receiptStartedAt: Instant | null; receiptSchedule: string; receiptCursor: number; mailboxChecks: number;
  confirmedAt: Instant | null; copies: string; category: "invalid" | "operational" | null; reason: DeliveryFailureReason | null; determinedAt: Instant | null; cleanupDueAt: Instant | null; contactEnvelope: string | null;
}
interface StoredAttempt { ordinal: number; startedAt: Instant; finishedAt: Instant | null; outcome: SendOutcome["kind"] | null; retryable: number | null; mimeDigest: string; fingerprint: string }

export function recoverDelivery(db: Database.Database, now: Instant): void {
  utcInstant(now);
  const rows = db.prepare("SELECT id,acceptedAt,deliveryState,version,claimToken,claimOwner FROM cases ORDER BY rowid").all() as CaseRecord[];
  for (const row of rows) {
    db.prepare("INSERT OR IGNORE INTO deliveries(caseId) VALUES(?)").run(row.id);
    const delivery = db.prepare("SELECT * FROM deliveries WHERE caseId=?").get(row.id) as StoredDelivery;
    const unfinished = db.prepare("SELECT 1 FROM delivery_attempts WHERE caseId=? AND finishedAt IS NULL").get(row.id);
    let state = row.deliveryState, reason: DeliveryFailureReason | null = null;
    const retainedMime = db.prepare("SELECT 1 FROM artifacts WHERE caseId=? AND kind='mime'").get(row.id);
    if ((["sending", "smtp_accepted", "uncertain"].includes(state) && (!delivery.registered || !delivery.mimeDigest)) || (state === "delivered" && !delivery.confirmedAt) || (retainedMime && !delivery.registered)) { state = "needs_attention"; reason = "LEGACY_UNVERIFIED"; }
    else if (state === "sending" || (unfinished && ["smtp_accepted", "uncertain"].includes(state))) {
      state = "uncertain";
      if (!delivery.receiptStartedAt) db.prepare("UPDATE deliveries SET receiptStartedAt=?,receiptSchedule=?,sendDueAt=NULL WHERE caseId=?").run(now, JSON.stringify(schedule(now, row.acceptedAt)), row.id);
    } else if (state === "scanning" || (state === "ready" && !delivery.mimeDigest)) state = "queued";
    if (state !== row.deliveryState || row.claimOwner || row.claimToken) {
      db.prepare("UPDATE cases SET deliveryState=?,claimOwner=NULL,claimedAt=NULL,claimToken=NULL,claimKind=NULL,version=version+1 WHERE id=?").run(state, row.id);
      if (reason) db.prepare("UPDATE deliveries SET category='operational',reason=?,determinedAt=? WHERE caseId=?").run(reason, now, row.id);
      db.prepare("INSERT INTO audit(caseId,event,version,at) VALUES(?,'recovered',?,?)").run(row.id, row.version + 1, now);
    }
  }
}

export function createDeliveryRepository(db: Database.Database, readCase: (id: ApplicationId) => CaseRecord, guarded: <T>(id: ApplicationId, action: () => Promise<T>) => Promise<T>, locked: (id: ApplicationId) => boolean, getArtifact: (id: ApplicationId, kind: "mime") => ArtifactRecord | null, verifyArtifact: (artifact: ArtifactRecord) => void): DeliveryRepository {
  function getDelivery(id: ApplicationId): DeliveryRecord {
    const row = readCase(id), stored = db.prepare("SELECT * FROM deliveries WHERE caseId=?").get(id) as StoredDelivery | undefined;
    if (!stored) return invalid();
    const fixed = stored.messageId === null ? null : identity({ id, messageId: stored.messageId, keyId: stored.keyId!, date: stored.identityDate! }, row);
    if (!fixed && (stored.keyId !== null || stored.identityDate !== null)) invalid();
    const registered = stored.registered === null ? null : fixed ? registration(parse(stored.registered, 4096) as RegisteredMail, fixed) : invalid();
    const mimeDigest = stored.mimeDigest === null ? null : hash(stored.mimeDigest);
    if (mimeDigest && !registered) invalid();
    const parsedSchedule = parse(stored.receiptSchedule, 256);
    if (!Array.isArray(parsedSchedule) || parsedSchedule.length > 5) invalid();
    const receiptSchedule = parsedSchedule.map(instant);
    if (stored.receiptStartedAt !== null) {
      instant(stored.receiptStartedAt);
      if (JSON.stringify(receiptSchedule) !== JSON.stringify(schedule(stored.receiptStartedAt, row.acceptedAt))) invalid();
    } else if (receiptSchedule.length) invalid();
    integer(stored.receiptCursor, 0, receiptSchedule.length); integer(stored.mailboxChecks, 0, 5);
    if (stored.mailboxChecks > stored.receiptCursor || (stored.category !== null && !["invalid", "operational"].includes(stored.category)) || (stored.reason !== null && !REASONS.includes(stored.reason))) invalid();
    for (const value of [stored.sendDueAt, stored.confirmedAt, stored.determinedAt, stored.cleanupDueAt]) if (value !== null) instant(value);
    if ((stored.category === null) !== (stored.reason === null) || (stored.category === "invalid") !== (stored.reason === "INVALID_INPUT" || stored.reason === "MALICIOUS_INPUT")) invalid();
    if (stored.contactEnvelope !== null) { try { assertContactEnvelope(stored.contactEnvelope); } catch { invalid(); } }
    const attempts = (db.prepare("SELECT ordinal,startedAt,finishedAt,outcome,retryable,mimeDigest,fingerprint FROM delivery_attempts WHERE caseId=? ORDER BY ordinal").all(id) as StoredAttempt[]).map((attempt, index): DeliveryAttempt => {
      if (integer(attempt.ordinal, 1, 3) !== index + 1) invalid(); instant(attempt.startedAt);
      if (attempt.mimeDigest !== mimeDigest || attempt.fingerprint !== registered?.fingerprint || attempt.startedAt < row.acceptedAt || attempt.startedAt >= plus(row.acceptedAt, DAY)) invalid();
      let result: SendOutcome | null = null;
      if (attempt.finishedAt !== null) {
        instant(attempt.finishedAt); if (attempt.finishedAt < attempt.startedAt) invalid();
        result = outcome(attempt.outcome === "definitely_failed" ? { kind: "definitely_failed", retryable: integer(attempt.retryable, 0, 1) === 1 } : { kind: attempt.outcome } as SendOutcome);
        if (attempt.outcome !== "definitely_failed" && attempt.retryable !== null) invalid();
      } else if (attempt.outcome !== null || attempt.retryable !== null) invalid();
      return { ordinal: attempt.ordinal, startedAt: attempt.startedAt, finishedAt: attempt.finishedAt, outcome: result, mimeDigest: hash(attempt.mimeDigest), fingerprint: hash(attempt.fingerprint) };
    });
    if (attempts.length > 3 || attempts.some((attempt, index) => index < attempts.length - 1 && (attempt.outcome?.kind !== "definitely_failed" || !attempt.outcome.retryable))) invalid();
    const last = attempts.at(-1);
    if (row.deliveryState === "ready") {
      if (!registered || !mimeDigest || !stored.sendDueAt || stored.sendDueAt >= plus(row.acceptedAt, DAY)) invalid();
      if (last && (last.outcome?.kind !== "definitely_failed" || !last.outcome.retryable || last.ordinal >= 3 || stored.sendDueAt !== plus(last.finishedAt!, (last.ordinal === 1 ? 5 : 30) * 60000))) invalid();
    } else if (stored.sendDueAt !== null) invalid();
    if (row.deliveryState === "sending" && (!mimeDigest || !last || last.finishedAt !== null)) invalid();
    if (["smtp_accepted", "uncertain", "delivered"].includes(row.deliveryState) && (!registered || !mimeDigest || !stored.receiptStartedAt || !receiptSchedule.length)) invalid();
    if (row.deliveryState === "smtp_accepted" && last?.outcome?.kind !== "accepted") invalid();
    if (row.deliveryState === "uncertain" && (!last || (last.finishedAt !== null && last.outcome?.kind !== "uncertain"))) invalid();
    if (["queued", "scanning"].includes(row.deliveryState) && (mimeDigest || attempts.length)) invalid();
    for (let index = 1; index < attempts.length; index++) if (attempts[index].startedAt < plus(attempts[index - 1].finishedAt!, (index === 1 ? 5 : 30) * 60000)) invalid();
    const evidence = copies(parse(stored.copies, 90000), registered);
    if ((stored.confirmedAt === null) !== (evidence.length === 0) || (row.deliveryState === "delivered" && !stored.confirmedAt)) invalid();
    return { id, identity: fixed, registered, mimeDigest, sendDueAt: stored.sendDueAt, receiptStartedAt: stored.receiptStartedAt, receiptSchedule, receiptCursor: stored.receiptCursor, mailboxChecks: stored.mailboxChecks, confirmedAt: stored.confirmedAt, copies: evidence, attempts, category: stored.category, reason: stored.reason, determinedAt: stored.determinedAt, incidentAt: plus(row.acceptedAt, HOUR), manualRequiredAt: plus(row.acceptedAt, DAY), cleanupDueAt: stored.cleanupDueAt, contactEnvelope: stored.contactEnvelope };
  }
  function snapshot(id: ApplicationId): DeliverySnapshot { return { case: readCase(id), delivery: getDelivery(id) }; }
  function changed(row: CaseRecord, event: string, now: Instant, state = row.deliveryState, clear = false): DeliverySnapshot {
    const result = db.prepare("UPDATE cases SET version=version+1,deliveryState=?,claimOwner=CASE WHEN ? THEN NULL ELSE claimOwner END,claimedAt=CASE WHEN ? THEN NULL ELSE claimedAt END,claimToken=CASE WHEN ? THEN NULL ELSE claimToken END,claimKind=CASE WHEN ? THEN NULL ELSE claimKind END WHERE id=? AND version=?").run(state, Number(clear), Number(clear), Number(clear), Number(clear), row.id, row.version);
    if (result.changes !== 1) throw new Error("STALE_VERSION");
    db.prepare("INSERT INTO audit(caseId,event,version,at) VALUES(?,?,?,?)").run(row.id, event, row.version + 1, now); return snapshot(row.id);
  }
  function authority(claim: DeliveryClaimAuthority, now: Instant, kinds: readonly DeliveryWorkKind[]): CaseRecord {
    exact(claim, ["id", "version", "token"]); applicationId(claim.id); utcInstant(now); integer(claim.version, 1, Number.MAX_SAFE_INTEGER);
    const row = readCase(claim.id); if (row.version !== claim.version) throw new Error("STALE_VERSION");
    if (typeof claim.token !== "string" || !/^[a-f0-9]{64}$/.test(claim.token) || row.claimToken !== claim.token) throw new Error("STALE_CLAIM");
    if (!row.claimKind || !kinds.includes(row.claimKind)) throw new Error("INVALID_DELIVERY_WORK");
    if (now < row.acceptedAt || now < row.claimedAt!) throw new Error("INVALID_DELIVERY_TIME");
    return row;
  }
  function mutate(claim: DeliveryClaimAuthority, now: Instant, kinds: readonly DeliveryWorkKind[], fn: (row: CaseRecord, delivery: DeliveryRecord) => DeliverySnapshot): Promise<DeliverySnapshot> {
    return guarded(claim.id, async () => db.transaction(() => { const row = authority(claim, now, kinds); return fn(row, getDelivery(row.id)); }).immediate());
  }
  function permitted(row: CaseRecord, now: Instant, send = false): void { if (now >= row.payloadDeleteAfter || (send && now >= plus(row.acceptedAt, DAY))) throw new Error("DELIVERY_EXPIRED"); }
  function mime(row: CaseRecord, delivery: DeliveryRecord, artifact: ArtifactRecord, verification: VerificationResult, now: Instant): void {
    exact(verification, ["kind"]); if (verification.kind !== "verified") throw new Error("MIME_VERIFICATION_REQUIRED");
    exact(artifact, ["caseId", "kind", "path", "bytes", "plaintextDigest", "ciphertextDigest", "expiresAt"]);
    const stored = getArtifact(row.id, "mime");
    if (!stored || Object.keys(stored).some(key => stored[key as keyof ArtifactRecord] !== artifact[key as keyof ArtifactRecord]) || artifact.caseId !== row.id || artifact.kind !== "mime" || !delivery.registered || (delivery.mimeDigest !== null && delivery.mimeDigest !== artifact.plaintextDigest)) throw new Error("MIME_AUTHORITY_MISMATCH");
    permitted(row, now); if (now >= artifact.expiresAt) throw new Error("DELIVERY_EXPIRED"); verifyArtifact(stored);
  }
  function mailboxOnly(row: CaseRecord, delivery: DeliveryRecord, now: Instant): void {
    if (!delivery.receiptStartedAt) db.prepare("UPDATE deliveries SET receiptStartedAt=?,receiptSchedule=?,sendDueAt=NULL WHERE caseId=?").run(now, JSON.stringify(schedule(now, row.acceptedAt)), row.id);
  }
  function shorten(row: CaseRecord, now: Instant): void {
    const end = plus(now, DAY), payload = row.payloadDeleteAfter < end ? row.payloadDeleteAfter : end, contact = row.contactDeleteAfter < end ? row.contactDeleteAfter : end;
    db.prepare("UPDATE cases SET payloadDeleteAfter=?,contactDeleteAfter=? WHERE id=?").run(payload, contact, row.id);
    const cleanup = [plus(now, 23 * HOUR), plus(payload, -HOUR), plus(contact, -HOUR)].sort()[0];
    db.prepare("UPDATE deliveries SET cleanupDueAt=? WHERE caseId=?").run(cleanup, row.id);
  }
  function fail(row: CaseRecord, failure: DeliveryFailure, now: Instant): DeliverySnapshot {
    exact(failure, ["category", "reason"]);
    if (!REASONS.includes(failure.reason) || !["invalid", "operational"].includes(failure.category) || (failure.category === "invalid") !== ["INVALID_INPUT", "MALICIOUS_INPUT"].includes(failure.reason)) invalid();
    db.prepare("UPDATE deliveries SET category=?,reason=?,determinedAt=?,sendDueAt=NULL WHERE caseId=?").run(failure.category, failure.reason, now, row.id);
    if (failure.category === "invalid") shorten(row, now);
    return changed(row, `delivery:failure:${failure.reason}`, now, "needs_attention", true);
  }
  return {
    getDelivery,
    listWorkerSchedule(now) {
      utcInstant(now);
      const ids = db.prepare("SELECT id FROM cases WHERE deliveryState <> 'delivered' ORDER BY acceptedAt,rowid LIMIT 21").all() as { id: ApplicationId }[];
      if (ids.length > 20) throw new Error("WORKER_SCHEDULE_OVERFLOW");
      return ids.map(({ id }) => {
        const row = readCase(id), delivery = getDelivery(id), busy = row.claimToken !== null || locked(id);
        if (!/^TJ-[A-F0-9]{24}$/.test(row.reference)) invalid();
        let dispatchDueAt: Instant | null = null;
        if (!busy) {
          if (row.deliveryState === "queued") dispatchDueAt = row.acceptedAt;
          else if (row.deliveryState === "ready") dispatchDueAt = delivery.sendDueAt;
          else if (["smtp_accepted", "uncertain"].includes(row.deliveryState)) dispatchDueAt = delivery.receiptSchedule[delivery.receiptCursor] ?? null;
          if (dispatchDueAt) {
            const artifact = getArtifact(id, "mime");
            dispatchDueAt = [dispatchDueAt, row.payloadDeleteAfter, ...(artifact ? [artifact.expiresAt] : []), ...(row.deliveryState === "ready" ? [delivery.manualRequiredAt] : [])].sort()[0];
          }
        }
        return { id, reference: row.reference, state: row.deliveryState, busy, dispatchDueAt, incidentAt: delivery.incidentAt, manualRequiredAt: delivery.manualRequiredAt };
      });
    },
    claimDispatchWork(owner, now, kind) {
      utcInstant(now); if (typeof owner !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(owner)) throw new Error("INVALID_CLAIM_OWNER");
      if (kind !== undefined && !["prepare", "send", "reconcile"].includes(kind)) invalid();
      return db.transaction(() => {
        const rows = db.prepare("SELECT id FROM cases WHERE claimToken IS NULL AND deliveryState IN ('queued','ready','smtp_accepted','uncertain') ORDER BY acceptedAt,rowid").all() as { id: ApplicationId }[];
        for (const item of rows) {
          if (locked(item.id)) continue;
          const row = readCase(item.id), delivery = getDelivery(row.id);
          if (now < row.acceptedAt) continue;
          const work: DeliveryWorkKind = row.deliveryState === "queued" ? "prepare" : row.deliveryState === "ready" ? "send" : "reconcile";
          if (kind !== undefined && work !== kind) continue;
          const artifact = getArtifact(row.id, "mime");
          if (now >= row.payloadDeleteAfter || (artifact && now >= artifact.expiresAt)) { fail(row, { category: "operational", reason: "PROCESSING_EXPIRED" }, now); continue; }
          if (delivery.mimeDigest || artifact) {
            try {
              if (!artifact || (delivery.mimeDigest && artifact.plaintextDigest !== delivery.mimeDigest)) throw new Error();
              verifyArtifact(artifact);
            } catch { fail(row, { category: "operational", reason: "ARTIFACT_UNAVAILABLE" }, now); continue; }
          }
          if (work !== "reconcile" && now >= plus(row.acceptedAt, DAY)) { fail(row, { category: "operational", reason: "MANUAL_REQUIRED" }, now); continue; }
          if (work === "prepare" && db.prepare("SELECT 1 FROM cases WHERE deliveryState='scanning'").get()) continue;
          if (work === "send" && (!delivery.sendDueAt || delivery.sendDueAt > now)) continue;
          if (work === "reconcile" && (!delivery.registered || !delivery.mimeDigest || delivery.receiptCursor >= delivery.receiptSchedule.length || delivery.receiptSchedule[delivery.receiptCursor] > now)) continue;
          const token = randomBytes(32).toString("hex");
          const claimed = db.prepare("UPDATE cases SET claimOwner=?,claimedAt=?,claimToken=?,claimKind=? WHERE id=? AND version=? AND claimToken IS NULL").run(owner, now, token, work, row.id, row.version);
          if (claimed.changes !== 1) throw new Error("STALE_VERSION");
          return changed(row, "claimed", now, work === "prepare" ? "scanning" : row.deliveryState) as DeliverySnapshot & { case: ClaimedCase };
        }
        return null;
      }).immediate();
    },
    stageDeliveryIdentity(claim, keyId, now) { return mutate(claim, now, ["prepare"], (row, delivery) => {
      permitted(row, now); if (typeof keyId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(keyId)) invalid();
      if (delivery.identity) { if (delivery.identity.keyId !== keyId) throw new Error("DELIVERY_IDENTITY_CONFLICT"); return snapshot(row.id); }
      db.prepare("UPDATE deliveries SET messageId=?,keyId=?,identityDate=? WHERE caseId=?").run(`<${randomUUID()}@trinkgut-jammers.de>`, keyId, row.acceptedAt, row.id); return changed(row, "delivery:identity", now);
    }); },
    stageRegisteredMail(claim, mail, now) { return mutate(claim, now, ["prepare"], (row, delivery) => {
      permitted(row, now); if (!delivery.identity) throw new Error("DELIVERY_IDENTITY_REQUIRED");
      const canonical = JSON.stringify(registration(mail, delivery.identity));
      if (delivery.registered) { if (canonical !== JSON.stringify(delivery.registered)) throw new Error("REGISTRATION_CONFLICT"); return snapshot(row.id); }
      if (getArtifact(row.id, "mime") || delivery.attempts.length) throw new Error("REGISTRATION_TOO_LATE");
      db.prepare("UPDATE deliveries SET registered=? WHERE caseId=?").run(canonical, row.id); return changed(row, "delivery:registered", now);
    }); },
    bindVerifiedMime(claim, artifact, verification, now) { return mutate(claim, now, ["prepare"], (row, delivery) => {
      if (row.deliveryState !== "scanning" || delivery.attempts.length) throw new Error("INVALID_DELIVERY_WORK");
      permitted(row, now, true);
      mime(row, delivery, artifact, verification, now);
      db.prepare("UPDATE deliveries SET mimeDigest=?,sendDueAt=? WHERE caseId=?").run(artifact.plaintextDigest, now, row.id); return changed(row, "delivery:ready", now, "ready", true);
    }); },
    beginSendAttempt(claim, artifact, verification, now) { return mutate(claim, now, ["send"], (row, delivery) => {
      if (row.deliveryState !== "ready" || !delivery.mimeDigest || !delivery.sendDueAt || delivery.sendDueAt > now || delivery.attempts.length >= 3) throw new Error("INVALID_DELIVERY_WORK");
      permitted(row, now, true); mime(row, delivery, artifact, verification, now);
      const previous = delivery.attempts.at(-1); if (previous && (previous.outcome?.kind !== "definitely_failed" || !previous.outcome.retryable)) throw new Error("INVALID_DELIVERY_WORK");
      db.prepare("INSERT INTO delivery_attempts(caseId,ordinal,startedAt,mimeDigest,fingerprint) VALUES(?,?,?,?,?)").run(row.id, delivery.attempts.length + 1, now, delivery.mimeDigest, delivery.registered!.fingerprint);
      db.prepare("UPDATE deliveries SET sendDueAt=NULL WHERE caseId=?").run(row.id); return changed(row, "delivery:send-intent", now, "sending");
    }); },
    finishSendAttempt(claim, input, now) { return mutate(claim, now, ["send"], (row, delivery) => {
      const result = outcome(input), last = delivery.attempts.at(-1);
      if (row.deliveryState !== "sending" || !last || last.finishedAt || now < last.startedAt) throw new Error("INVALID_DELIVERY_WORK");
      db.prepare("UPDATE delivery_attempts SET finishedAt=?,outcome=?,retryable=? WHERE caseId=? AND ordinal=? AND finishedAt IS NULL").run(now, result.kind, result.kind === "definitely_failed" ? Number(result.retryable) : null, row.id, last.ordinal);
      if (result.kind !== "definitely_failed") { mailboxOnly(row, delivery, now); return changed(row, `delivery:${result.kind}`, now, result.kind === "accepted" ? "smtp_accepted" : "uncertain", true); }
      if (!result.retryable || last.ordinal === 3) return fail(row, { category: "operational", reason: result.retryable ? "ATTEMPTS_EXHAUSTED" : "PERMANENT_SEND_FAILURE" }, now);
      const due = plus(now, (last.ordinal === 1 ? 5 : 30) * 60000);
      if (due >= plus(row.acceptedAt, DAY) || due >= row.payloadDeleteAfter) return fail(row, { category: "operational", reason: "MANUAL_REQUIRED" }, now);
      db.prepare("UPDATE deliveries SET sendDueAt=? WHERE caseId=?").run(due, row.id); return changed(row, "delivery:retry-ready", now, "ready", true);
    }); },
    recordMailboxCheck(claim, mail, result, now) { return mutate(claim, now, ["reconcile"], (row, delivery) => {
      if (!["smtp_accepted", "uncertain"].includes(row.deliveryState) || !delivery.identity || !delivery.registered || delivery.receiptCursor >= delivery.receiptSchedule.length || delivery.receiptSchedule[delivery.receiptCursor] > now) throw new Error("INVALID_DELIVERY_WORK");
      permitted(row, now); const artifact = getArtifact(row.id, "mime"); if (!artifact || now >= artifact.expiresAt || artifact.plaintextDigest !== delivery.mimeDigest) throw new Error("MIME_AUTHORITY_MISMATCH");
      verifyArtifact(artifact);
      if (JSON.stringify(registration(mail, delivery.identity)) !== JSON.stringify(delivery.registered)) throw new Error("REGISTRATION_CONFLICT");
      exact(result, ["complete", "copies", "issues"]); if (typeof result.complete !== "boolean" || !Array.isArray(result.issues) || result.issues.length > 20 || result.issues.some(issue => !ISSUES.includes(issue))) invalid();
      const evidence = copies(result.copies, delivery.registered);
      const cursor = delivery.receiptSchedule.findIndex((slot, index) => index >= delivery.receiptCursor && slot > now);
      db.prepare("UPDATE deliveries SET receiptCursor=?,mailboxChecks=mailboxChecks+1 WHERE caseId=?").run(cursor < 0 ? delivery.receiptSchedule.length : cursor, row.id);
      if (result.complete && !result.issues.length && evidence.length) {
        db.prepare("UPDATE deliveries SET confirmedAt=?,copies=?,category=NULL,reason=NULL,determinedAt=NULL WHERE caseId=?").run(now, JSON.stringify(evidence), row.id);
        shorten(row, now); return changed(row, "delivery:delivered", now, "delivered", true);
      }
      if (cursor < 0) return fail(row, { category: "operational", reason: "RECEIPT_UNRESOLVED" }, now);
      return changed(row, "delivery:receipt-unresolved", now, row.deliveryState, true);
    }); },
    storeContact(claim, envelope, privateKey: KeyObject, now) { return mutate(claim, now, ["prepare"], (row, delivery) => {
      permitted(row, now); if (now >= row.contactDeleteAfter) throw new Error("CONTACT_EXPIRED");
      const binding = { caseId: row.id, acceptedAt: row.acceptedAt, version: 1 };
      const email = openContact(envelope, binding, privateKey);
      if (delivery.contactEnvelope) { if (openContact(delivery.contactEnvelope, binding, privateKey) !== email) throw new Error("CONTACT_CONFLICT"); return snapshot(row.id); }
      db.prepare("UPDATE deliveries SET contactEnvelope=? WHERE caseId=?").run(envelope, row.id); return changed(row, "delivery:contact", now);
    }); },
    recordDeliveryFailure(claim, failure, now) { return mutate(claim, now, ["prepare", "send", "reconcile"], (row, delivery) => {
      if (row.deliveryState === "sending" || row.deliveryState === "delivered" || (failure.category === "invalid" && (row.claimKind !== "prepare" || delivery.attempts.length))) throw new Error("INVALID_DELIVERY_WORK"); return fail(row, failure, now);
    }); },
    releaseDeliveryClaim(claim, now) { return mutate(claim, now, ["prepare", "send", "reconcile"], (row, delivery) => {
      let state: DeliveryState = row.deliveryState;
      if (state === "scanning") state = "queued";
      if (state === "sending") { mailboxOnly(row, delivery, now); state = "uncertain"; }
      return changed(row, "delivery:released", now, state, true);
    }); },
  };
}
