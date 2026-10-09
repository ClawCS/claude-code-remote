import Database from "better-sqlite3";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import type { PublicStatus } from "../../../lib/applications-contract";
import type { Acceptance, ApplicationId, ApplicationRepository, ArtifactKind, ArtifactRecord, ArtifactReservation, CaseRecord, ClaimedCase, DeliveryState, DeliveryTransition, Digest, Instant, IntakeCommit, Reservation, ReservationInput, RequestIdentity } from "./types";
import { applicationId, digest, utcInstant } from "./types";
import { ARTIFACT_METADATA_RESERVE, artifactLimit, OUTPUT_RESERVE, storageBudget } from "./storage-budget";

const DAY = 86400000;
const transitions: Record<DeliveryState, readonly DeliveryState[]> = {
  queued: [], scanning: ["ready", "needs_attention"], ready: ["sending", "needs_attention"],
  sending: ["smtp_accepted", "uncertain", "needs_attention"], smtp_accepted: ["delivered", "uncertain"],
  uncertain: ["delivered", "needs_attention"], delivered: [], needs_attention: [],
};
function addDays(value: Instant, days: number): Instant { return utcInstant(new Date(Date.parse(value) + days * DAY).toISOString()); }
function checkBytes(value: number): void { if (!Number.isSafeInteger(value) || value < 0) throw new Error("INVALID_BYTES"); }
interface StoredReservation extends Reservation { active: number }
interface StoredCase extends CaseRecord { digest: Digest; reservationId: string; sessionHash: Digest; idempotencyKey: string }
interface Guard { id: ApplicationId; active: boolean }

export function openRepository(path: string): ApplicationRepository {
  if (!isAbsolute(path) || resolve(path) !== path || path.split(sep).some(part => ["public", ".git", "releases", ".build"].includes(part))) throw new Error("UNSAFE_PATH");
  for (let part = dirname(path); part !== dirname(part); part = dirname(part)) {
    const stat = lstatSync(part); if (stat.isSymbolicLink()) throw new Error("UNSAFE_PATH");
  }
  const parent = lstatSync(dirname(path));
  if (!parent.isDirectory() || (parent.mode & 0o077) !== 0) throw new Error("UNSAFE_PATH");
  const fd = openSync(path, constants.O_CREAT | constants.O_RDWR | constants.O_NOFOLLOW, 0o600);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || (stat.mode & 0o077) !== 0 || stat.nlink !== 1 || (process.getuid && stat.uid !== process.getuid())) throw new Error("UNSAFE_PATH");
  } finally { closeSync(fd); }
  const db = new Database(path, { timeout: 0 });
  try {
    db.pragma("locking_mode = EXCLUSIVE");
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.pragma("synchronous = FULL");
    // An eager write transaction obtains ownership; the pragma alone does not.
    db.exec("BEGIN IMMEDIATE; COMMIT;");
    const version = db.pragma("user_version", { simple: true });
    if (version === 0) db.transaction(() => db.exec(readFileSync(join(__dirname, "schema.sql"), "utf8"))).immediate();
    else if (version === 1) db.transaction(() => {
      const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
      db.exec(schema.slice(schema.indexOf("CREATE TABLE artifacts")));
      for (const row of db.prepare("SELECT id, acceptedAt, payloadDeleteAfter FROM cases").all() as CaseRecord[]) {
        for (const kind of ["bundle", "mime"] as const) db.prepare("INSERT INTO artifact_reservations VALUES (?, ?, ?, ?)").run(row.id, kind, artifactLimit(kind), row.payloadDeleteAfter < addDays(row.acceptedAt, 7) ? row.payloadDeleteAfter : addDays(row.acceptedAt, 7));
      }
    }).immediate();
    else if (version !== 2) throw new Error("UNSUPPORTED_SCHEMA_VERSION");
    db.transaction(() => {
      db.prepare("DELETE FROM reservations WHERE active = 1").run();
      db.prepare("INSERT INTO audit (caseId, event, version, at) SELECT id, 'recovered', version + 1, ? FROM cases WHERE deliveryState IN ('scanning','ready','sending','smtp_accepted')").run(new Date().toISOString());
      db.prepare("UPDATE cases SET deliveryState = CASE WHEN deliveryState IN ('sending','smtp_accepted') THEN 'uncertain' ELSE 'queued' END, claimOwner = NULL, claimedAt = NULL, version = version + 1 WHERE deliveryState IN ('scanning','ready','sending','smtp_accepted')").run();
    }).immediate();
  } catch (error) {
    db.close();
    if (error instanceof Error && "code" in error && error.code === "SQLITE_BUSY") throw new Error("REPOSITORY_IN_USE");
    throw error;
  }
  const locks = new Map<ApplicationId, Promise<void>>();
  const context = new AsyncLocalStorage<Guard>();
  let closed = false;
  function live(): void { if (closed) throw new Error("REPOSITORY_CLOSED"); }
  function readCase(id: ApplicationId): CaseRecord {
    live(); applicationId(id); const row = db.prepare("SELECT id, reference, encryptedName, job, acceptedAt, deliveryState, caseState, version, encryptedPayloadPath, payloadBytes, closedOn, deleteAfter, payloadDeleteAfter, contactDeleteAfter, claimOwner, claimedAt FROM cases WHERE id = ?").get(id) as CaseRecord | undefined;
    if (!row) throw new Error("CASE_NOT_FOUND");
    return row;
  }
  async function guarded<T>(id: ApplicationId, action: () => Promise<T>): Promise<T> {
    live(); const own = context.getStore();
    if (own?.active && own.id === id) return action();
    const previous = locks.get(id);
    let release!: () => void;
    const held = new Promise<void>(resolveHeld => { release = resolveHeld; });
    locks.set(id, held);
    if (previous) await previous;
    const guard: Guard = { id, active: true };
    try { live(); return await context.run(guard, action); }
    finally { guard.active = false; release(); if (locks.get(id) === held) locks.delete(id); }
  }
  function proof(row: Pick<CaseRecord, "id" | "reference" | "acceptedAt">, now: Instant, replayed = false): Acceptance {
    const statusProof = randomBytes(32).toString("base64url");
    db.prepare("DELETE FROM status_proofs WHERE expiresAt <= ?").run(now);
    db.prepare("INSERT INTO status_proofs VALUES (?, ?, ?)").run(createHash("sha256").update(statusProof).digest("hex"), row.id, addDays(row.acceptedAt, 7));
    return { id: row.id, reference: row.reference, acceptedAt: row.acceptedAt, statusProof, replayed };
  }
  function reserve(input: ReservationInput): Reservation {
    live(); digest(input.sessionHash); checkBytes(input.reservedBytes); utcInstant(input.now);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(input.idempotencyKey)) throw new Error("INVALID_IDEMPOTENCY_KEY");
    return db.transaction(() => {
      db.prepare("DELETE FROM reservations WHERE active = 1 AND expiresAt <= ?").run(input.now);
      const existing = db.prepare("SELECT * FROM reservations WHERE sessionHash = ? AND idempotencyKey = ? AND active = 1").get(input.sessionHash, input.idempotencyKey) as StoredReservation | undefined;
      if (existing) {
        if (existing.reservedBytes !== input.reservedBytes) throw new Error("IDEMPOTENCY_CONFLICT");
        throw new Error("UPLOAD_IN_PROGRESS");
      }
      const reservations = db.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(reservedBytes), 0) AS bytes, COALESCE(SUM(CASE WHEN NOT EXISTS (SELECT 1 FROM cases c WHERE c.sessionHash = r.sessionHash AND c.idempotencyKey = r.idempotencyKey) THEN 1 ELSE 0 END), 0) AS newCount FROM reservations r WHERE active = 1").get() as { count: number; bytes: number; newCount: number };
      const cases = db.prepare("SELECT SUM(CASE WHEN deliveryState != 'delivered' THEN 1 ELSE 0 END) AS count, COALESCE(SUM(payloadBytes), 0) AS bytes FROM cases").get() as { count: number | null; bytes: number };
      const replay = db.prepare("SELECT 1 FROM cases WHERE sessionHash = ? AND idempotencyKey = ?").get(input.sessionHash, input.idempotencyKey);
      if (reservations.count >= 2 || (!replay && (cases.count ?? 0) + reservations.newCount >= 20)) throw new Error("CAPACITY_EXCEEDED");
      const outputs = db.prepare("SELECT COALESCE(SUM(COALESCE(a.bytes,r.bytes)),0) AS bytes, COUNT(*) AS count FROM artifact_reservations r LEFT JOIN artifacts a ON a.caseId=r.caseId AND a.kind=r.kind").get() as { bytes: number; count: number };
      storageBudget(cases.bytes + outputs.bytes + reservations.bytes + input.reservedBytes, 0, [{ allowance: (reservations.newCount + (replay ? 0 : 1)) * OUTPUT_RESERVE, actual: 0 }], 8192 + outputs.count * ARTIFACT_METADATA_RESERVE);
      const result = { id: randomUUID(), sessionHash: input.sessionHash, idempotencyKey: input.idempotencyKey, reservedBytes: input.reservedBytes, expiresAt: addDays(input.now, 1) };
      db.prepare("INSERT INTO reservations VALUES (@id, @sessionHash, @idempotencyKey, @reservedBytes, @expiresAt, 1)").run(result);
      return result;
    }).immediate();
  }
  function commitIntake(input: IntakeCommit): Acceptance {
    live(); digest(input.digest); checkBytes(input.actualBytes); utcInstant(input.now);
    return db.transaction(() => {
      const reservation = db.prepare("SELECT * FROM reservations WHERE id = ?").get(input.reservationId) as StoredReservation | undefined;
      if (!reservation || (reservation.active && reservation.expiresAt <= input.now)) throw new Error("RESERVATION_NOT_FOUND");
      if (input.actualBytes > reservation.reservedBytes) throw new Error("RESERVATION_EXCEEDED");
      const existing = db.prepare("SELECT * FROM cases WHERE sessionHash = ? AND idempotencyKey = ?").get(reservation.sessionHash, reservation.idempotencyKey) as StoredCase | undefined;
      if (existing) {
        if (existing.digest !== input.digest) throw new Error("IDEMPOTENCY_CONFLICT");
        db.prepare("UPDATE reservations SET active = 0 WHERE id = ?").run(input.reservationId);
        return proof(existing, input.now, true);
      }
      if (!reservation.active) throw new Error("RESERVATION_NOT_FOUND");
      if (!isAbsolute(input.encryptedPayloadPath) || resolve(input.encryptedPayloadPath) !== input.encryptedPayloadPath || input.encryptedPayloadPath.split(sep).some(part => ["public", ".git", "releases", ".build"].includes(part)) || !input.encryptedName || input.encryptedName.length > 4096) throw new Error("INVALID_PRIVATE_PAYLOAD");
      const row = { id: applicationId(randomUUID()), reference: `TJ-${randomBytes(12).toString("hex").toUpperCase()}`, reservationId: input.reservationId, sessionHash: reservation.sessionHash, idempotencyKey: reservation.idempotencyKey, digest: input.digest, encryptedName: input.encryptedName, job: input.job, acceptedAt: input.now, encryptedPayloadPath: input.encryptedPayloadPath, payloadBytes: input.actualBytes, payloadDeleteAfter: addDays(input.now, 7), contactDeleteAfter: addDays(input.now, 30) };
      db.prepare("INSERT INTO cases (id, reference, reservationId, sessionHash, idempotencyKey, digest, encryptedName, job, acceptedAt, deliveryState, caseState, version, encryptedPayloadPath, payloadBytes, payloadDeleteAfter, contactDeleteAfter) VALUES (@id, @reference, @reservationId, @sessionHash, @idempotencyKey, @digest, @encryptedName, @job, @acceptedAt, 'queued', 'open', 1, @encryptedPayloadPath, @payloadBytes, @payloadDeleteAfter, @contactDeleteAfter)").run(row);
      db.prepare("UPDATE reservations SET active = 0 WHERE id = ?").run(input.reservationId);
      for (const kind of ["bundle", "mime"] as const) db.prepare("INSERT INTO artifact_reservations VALUES (?, ?, ?, ?)").run(row.id, kind, artifactLimit(kind), row.payloadDeleteAfter);
      db.prepare("INSERT INTO audit (caseId, event, version, at) VALUES (?, 'accepted', 1, ?)").run(row.id, input.now);
      return proof(row, input.now);
    }).immediate();
  }
  function claimNext(owner: string, now: Instant): ClaimedCase | null {
    live(); utcInstant(now); if (!/^[A-Za-z0-9_-]{1,128}$/.test(owner)) throw new Error("INVALID_CLAIM_OWNER");
    return db.transaction(() => {
      if (db.prepare("SELECT 1 FROM cases WHERE deliveryState = 'scanning'").get()) return null;
      const rows = db.prepare("SELECT id, version FROM cases WHERE deliveryState = 'queued' ORDER BY acceptedAt, rowid").all() as { id: ApplicationId; version: number }[];
      const next = rows.find(row => !locks.has(row.id)); if (!next) return null;
      const result = db.prepare("UPDATE cases SET deliveryState = 'scanning', claimOwner = ?, claimedAt = ?, version = version + 1 WHERE id = ? AND version = ? AND deliveryState = 'queued'").run(owner, now, next.id, next.version);
      if (result.changes !== 1) throw new Error("STALE_VERSION");
      db.prepare("INSERT INTO audit (caseId, event, version, at) VALUES (?, 'claimed', ?, ?)").run(next.id, next.version + 1, now);
      return readCase(next.id) as ClaimedCase;
    }).immediate();
  }
  function getPublicStatus(proofHash: Digest, now: Instant): PublicStatus | null {
    live(); digest(proofHash); utcInstant(now);
    const row = db.prepare("SELECT c.reference, c.deliveryState, c.acceptedAt FROM status_proofs p JOIN cases c ON c.id = p.caseId WHERE p.proofHash = ? AND p.expiresAt > ?").get(proofHash, now) as Pick<CaseRecord, "reference" | "deliveryState" | "acceptedAt"> | undefined;
    return row ? { reference: row.reference, acceptedAt: row.acceptedAt, state: row.deliveryState === "delivered" ? "delivered" : ["uncertain", "needs_attention"].includes(row.deliveryState) ? "needs_attention" : "processing" } : null;
  }
  async function transitionDelivery(id: ApplicationId, expectedVersion: number, next: DeliveryTransition): Promise<CaseRecord> {
    return guarded(id, async () => db.transaction(() => {
      const current = readCase(id);
      if (current.version !== expectedVersion) throw new Error("STALE_VERSION");
      if (!transitions[current.deliveryState].includes(next.state)) throw new Error("INVALID_TRANSITION");
      const result = db.prepare("UPDATE cases SET deliveryState = ?, version = version + 1 WHERE id = ? AND version = ?").run(next.state, id, expectedVersion);
      if (result.changes !== 1) throw new Error("STALE_VERSION");
      db.prepare("INSERT INTO audit (caseId, event, version, at) VALUES (?, ?, ?, ?)").run(id, `delivery:${next.state}`, expectedVersion + 1, new Date().toISOString());
      return readCase(id);
    }).immediate());
  }
  function getArtifact(id: ApplicationId, kind: ArtifactKind): ArtifactRecord | null {
    live(); applicationId(id); if (!["bundle", "mime"].includes(kind)) throw new Error("INVALID_ARTIFACT");
    return (db.prepare("SELECT * FROM artifacts WHERE caseId=? AND kind=?").get(id, kind) as ArtifactRecord | undefined) ?? null;
  }
  function verifyArtifact(record: ArtifactRecord): void {
    applicationId(record.caseId); digest(record.plaintextDigest); digest(record.ciphertextDigest); utcInstant(record.expiresAt);
    if (!["bundle", "mime"].includes(record.kind) || !Number.isSafeInteger(record.bytes) || record.bytes < 1 || record.bytes > artifactLimit(record.kind) || !isAbsolute(record.path) || resolve(record.path) !== record.path || record.path.split(sep).some(part => ["public", ".git", "releases", ".build"].includes(part))) throw new Error("INVALID_ARTIFACT");
    for (let parent = dirname(record.path); parent !== dirname(parent); parent = dirname(parent)) if (lstatSync(parent).isSymbolicLink()) throw new Error("UNSAFE_PATH");
    const fd = openSync(record.path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const stat = fstatSync(fd);
      if (!stat.isFile() || stat.nlink !== 1 || stat.uid !== process.getuid?.() || (stat.mode & 0o7777) !== 0o600 || stat.size !== record.bytes) throw new Error("INVALID_ARTIFACT");
      const bytes = readFileSync(fd);
      if (bytes.length !== record.bytes || createHash("sha256").update(bytes).digest("hex") !== record.ciphertextDigest) throw new Error("DIGEST_MISMATCH");
    } finally { closeSync(fd); }
  }
  async function adoptArtifact(record: ArtifactRecord, expectedVersion: number): Promise<CaseRecord> {
    return guarded(record.caseId, async () => db.transaction(() => {
      const current = readCase(record.caseId), existing = getArtifact(record.caseId, record.kind);
      if (existing) {
        verifyArtifact(existing);
        if (existing.plaintextDigest !== record.plaintextDigest || existing.expiresAt !== record.expiresAt) throw new Error("ARTIFACT_CONFLICT");
        return current;
      }
      if (current.version !== expectedVersion) throw new Error("STALE_VERSION");
      if (!["queued", "scanning", "ready"].includes(current.deliveryState)) throw new Error("ARTIFACT_CREATION_CLOSED");
      const expiry = current.payloadDeleteAfter < addDays(current.acceptedAt, 7) ? current.payloadDeleteAfter : addDays(current.acceptedAt, 7);
      if (record.expiresAt !== expiry) throw new Error("INVALID_ARTIFACT_EXPIRY");
      verifyArtifact(record);
      db.prepare("INSERT INTO artifacts VALUES (@caseId,@kind,@path,@bytes,@plaintextDigest,@ciphertextDigest,@expiresAt)").run(record);
      db.prepare("UPDATE cases SET version=version+1 WHERE id=? AND version=?").run(record.caseId, expectedVersion);
      db.prepare("INSERT INTO audit(caseId,event,version,at) VALUES(?,?,?,?)").run(record.caseId, `artifact:${record.kind}`, expectedVersion + 1, new Date().toISOString());
      return readCase(record.caseId);
    }).immediate());
  }
  async function retireOriginal(id: ApplicationId, expectedVersion: number): Promise<CaseRecord> {
    return guarded(id, async () => db.transaction(() => {
      const current = readCase(id), bundle = getArtifact(id, "bundle");
      if (!bundle) throw new Error("BUNDLE_REQUIRED");
      verifyArtifact(bundle);
      if (!current.encryptedPayloadPath) return current;
      if (current.version !== expectedVersion) throw new Error("STALE_VERSION");
      db.prepare("UPDATE cases SET encryptedPayloadPath=NULL,payloadBytes=0,version=version+1 WHERE id=? AND version=?").run(id, expectedVersion);
      db.prepare("INSERT INTO audit(caseId,event,version,at) VALUES(?,?,?,?)").run(id, "original:retired", expectedVersion + 1, new Date().toISOString());
      return readCase(id);
    }).immediate());
  }
  return {
    getRequestIdentity(id) { readCase(id); return db.prepare("SELECT id,digest,acceptedAt FROM cases WHERE id=?").get(id) as RequestIdentity; },
    getArtifact, adoptArtifact, retireOriginal,
    listRetainedArtifacts() { live(); return db.prepare("SELECT * FROM artifacts ORDER BY caseId,kind").all() as ArtifactRecord[]; },
    listArtifactReservations() { live(); return db.prepare("SELECT * FROM artifact_reservations ORDER BY caseId,kind").all() as ArtifactReservation[]; },
    isReplayReservation(id) { live(); return !!db.prepare("SELECT 1 FROM reservations r JOIN cases c ON c.sessionHash=r.sessionHash AND c.idempotencyKey=r.idempotencyKey WHERE r.id=?").get(id); },
    getCommittedIntake(id) { live(); applicationId(id); return (db.prepare("SELECT id, encryptedPayloadPath, payloadBytes AS actualBytes, digest, acceptedAt FROM cases WHERE id = ? AND encryptedPayloadPath IS NOT NULL").get(id) as import("./types").CommittedIntake | undefined) ?? null; },
    listRetainedIntakes() { live(); return db.prepare("SELECT id, encryptedPayloadPath, payloadBytes AS actualBytes, digest, acceptedAt FROM cases WHERE encryptedPayloadPath IS NOT NULL ORDER BY acceptedAt, rowid").all() as import("./types").CommittedIntake[]; },
    reserve, commitIntake, claimNext, getPublicStatus, transitionDelivery,
    releaseReservation(id) { live(); db.prepare("DELETE FROM reservations WHERE id = ? AND active = 1").run(id); },
    withCaseLock: (id, action) => guarded(id, () => action(Object.freeze(readCase(id)))),
    close() { if (closed) return; if (locks.size) throw new Error("CASE_LOCK_ACTIVE"); db.close(); closed = true; },
  };
}
