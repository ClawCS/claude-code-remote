import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHash, generateKeyPairSync, randomUUID } from "node:crypto";
import { mkdtempSync, realpathSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { openTestRepository as openRepository } from "./fixtures/admission";
import { sealContact } from "../src/contact-crypto";
import { testAdmission, removeTask10Schema } from "./fixtures/admission";
import { digest, utcInstant, type ApplicationId, type ApplicationRepository, type ArtifactRecord, type CaseRecord, type DeliverySnapshot, type RegisteredMail } from "../src/types";

const now = utcInstant("2026-10-09T10:00:00.000Z"), hash = digest("a".repeat(64));
const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
let dir: string, repo: ApplicationRepository, id: ApplicationId;
beforeEach(() => {
  dir = mkdtempSync(join(realpathSync(tmpdir()), "application-delivery-")); repo = openRepository(join(dir, "db.sqlite"), { now: () => new Date(now) });
  const r = repo.reserve({ ...testAdmission(), sessionHash: hash, idempotencyKey: "synthetic", reservedBytes: 1, now });
  id = repo.commitIntake({ reservationId: r.id, digest: hash, actualBytes: 1, encryptedPayloadPath: join(dir, "original.enc"), encryptedName: "synthetic-encrypted-name", job: "sales-fulltime", now }).id;
});
afterEach(() => { repo.close(); rmSync(dir, { recursive: true, force: true }); });
function authority(row: CaseRecord) { return { id: row.id, version: row.version, token: row.claimToken! }; }
const at = (minutes: number) => utcInstant(new Date(Date.parse(now) + minutes * 60000).toISOString());
async function prepare(): Promise<DeliverySnapshot> {
  const claim = repo.claimDispatchWork("worker", now, "prepare")!;
  const staged = await repo.stageDeliveryIdentity(authority(claim.case), "signing-1", now);
  const mail: RegisteredMail = { id, messageId: staged.delivery.identity!.messageId, keyId: "signing-1", profile: "tj-mail-1", fingerprint: hash, shape: { kind: "text", parts: 1, attachments: [] } };
  return repo.stageRegisteredMail(authority(staged.case), mail, now);
}
async function adopt(row: DeliverySnapshot): Promise<{ row: DeliverySnapshot; artifact: ArtifactRecord }> {
  const path = join(dir, "mime.enc"); writeFileSync(path, "synthetic ciphertext", { mode: 0o600 });
  const artifact: ArtifactRecord = { caseId: id, kind: "mime", path, bytes: 20, plaintextDigest: hash, ciphertextDigest: digest(createHash("sha256").update("synthetic ciphertext").digest("hex")), expiresAt: utcInstant("2026-10-16T10:00:00.000Z") };
  const current = await repo.adoptArtifact(artifact, row.case.version);
  return { row: await repo.bindVerifiedMime(authority(current), artifact, { kind: "verified" }, now), artifact };
}
async function sending(time = now) {
  const ready = await adopt(await prepare());
  const claimed = repo.claimDispatchWork("smtp-worker", time, "send")!;
  return { row: await repo.beginSendAttempt(authority(claimed.case), ready.artifact, { kind: "verified" }, time), artifact: ready.artifact };
}
function reopen() { repo.close(); repo = openRepository(join(dir, "db.sqlite"), { now: () => new Date(now) }); }
describe("durable delivery authority", () => {
  it("refuses an oversized unresolved schedule rather than silently dropping cases", () => {
    repo.close(); const db = new Database(join(dir, "db.sqlite"));
    for (let index = 0; index < 20; index++) {
      const next = randomUUID(), reservation = randomUUID();
      db.prepare("INSERT INTO reservations (id,sessionHash,idempotencyKey,reservedBytes,expiresAt,active,submission) SELECT ?,sessionHash,?,reservedBytes,expiresAt,active,submission FROM reservations LIMIT 1").run(reservation, `overflow-${index}`);
      db.prepare("INSERT INTO cases (id,reference,reservationId,sessionHash,idempotencyKey,digest,encryptedName,job,acceptedAt,deliveryState,caseState,version,payloadBytes,payloadDeleteAfter,contactDeleteAfter,submission) SELECT ?,?,?,sessionHash,?,digest,encryptedName,job,acceptedAt,deliveryState,caseState,version,payloadBytes,payloadDeleteAfter,contactDeleteAfter,submission FROM cases WHERE id=?").run(next, `TJ-${String(index).padStart(24, "0")}`, reservation, `overflow-${index}`, id);
      db.prepare("INSERT INTO deliveries(caseId) VALUES(?)").run(next);
      db.prepare("INSERT INTO case_lifecycle(caseId) VALUES(?)").run(next);
    }
    db.close(); repo = openRepository(join(dir, "db.sqlite"));
    expect(() => repo.listWorkerSchedule(now)).toThrow("WORKER_SCHEDULE_OVERFLOW");
  });
  it("refuses a corrupted non-random reference rather than projecting it into worker logs", () => {
    repo.close(); const db = new Database(join(dir, "db.sqlite")); db.prepare("UPDATE cases SET reference='private@example.invalid' WHERE id=?").run(id); db.close();
    repo = openRepository(join(dir, "db.sqlite"));
    expect(() => repo.listWorkerSchedule(now)).toThrow("INVALID_DELIVERY_METADATA");
  });
  it("requires durable authenticated contact before retiring the last original authority", async () => {
    const prepared = await prepare(), path = join(dir, "bundle.enc"); writeFileSync(path, "bundle", { mode: 0o600 });
    const adopted = await repo.adoptArtifact({ caseId: id, kind: "bundle", path, bytes: 6, plaintextDigest: hash, ciphertextDigest: digest(createHash("sha256").update("bundle").digest("hex")), expiresAt: utcInstant("2026-10-16T10:00:00.000Z") }, prepared.case.version);
    await expect(repo.retireOriginal(id, adopted.version)).rejects.toThrow("CONTACT_REQUIRED");
    expect(repo.getCommittedIntake(id)).not.toBeNull();
    const saved = await repo.storeContact(authority(adopted), sealContact("synthetic@example.test", { caseId: id, acceptedAt: now, version: 1 }, keys.publicKey), keys.privateKey, now);
    const retired = await repo.retireOriginal(id, saved.case.version); expect(retired.version).toBe(saved.case.version + 1); expect(repo.getCommittedIntake(id)).toBeNull();
  });
  it.each(["sending", "smtp_accepted", "uncertain", "ready"] as const)("recovers pre-ledger %s with retained MIME to attention without guessing a registration", async state => {
    repo.close(); const db = new Database(join(dir, "db.sqlite"));
    db.prepare("UPDATE cases SET deliveryState=? WHERE id=?").run(state, id);
    if (state === "ready") db.prepare("INSERT INTO artifacts VALUES(?, 'mime', ?, 1, ?, ?, ?)").run(id, join(dir, "legacy.enc"), hash, hash, at(7 * 1440));
    db.close(); repo = openRepository(join(dir, "db.sqlite"), { now: () => new Date(now) });
    expect(await repo.withCaseLock(id, async row => row.deliveryState)).toBe("needs_attention"); expect(repo.getDelivery(id).identity).toBeNull(); expect(repo.claimDispatchWork("worker", now)).toBeNull();
  });
  it("rejects runtime enum coercion and unknown SMTP provider metadata", async () => {
    const prepared = await prepare();
    await expect(repo.stageDeliveryIdentity(authority(prepared.case), 123 as unknown as string, now)).rejects.toThrow("INVALID_DELIVERY_METADATA");
    await expect(repo.stageRegisteredMail(authority(prepared.case), { ...prepared.delivery.registered!, keyId: 123 as unknown as string }, now)).rejects.toThrow("INVALID_DELIVERY_METADATA");
    await repo.releaseDeliveryClaim(authority(prepared.case), now);
    const reprepare = repo.claimDispatchWork("prepare", now)!;
    const ready = await adopt({ case: reprepare.case, delivery: reprepare.delivery });
    const claim = repo.claimDispatchWork("send", now)!; const intent = await repo.beginSendAttempt(authority(claim.case), ready.artifact, { kind: "verified" }, now);
    await expect(repo.finishSendAttempt(authority(intent.case), { kind: "accepted", response: "provider plaintext" } as { kind: "accepted" }, now)).rejects.toThrow("INVALID_DELIVERY_METADATA");
    expect(repo.getDelivery(id).attempts[0].outcome).toBeNull();
  });
  it("migrates actual schema3 send states conservatively without fabricating identity", async () => {
    repo.close(); const legacy = new Database(join(dir, "db.sqlite"));
    // Remove v4/v5/v6/v7 additions to produce the actual schema3 fixture.
    removeTask10Schema(legacy);
    legacy.exec("DROP TABLE lifecycle_audit; DROP TABLE lifecycle_proposals; DROP TABLE case_lifecycle;");
    legacy.exec("DROP TABLE auth_grants; DROP TABLE auth_sessions; DROP TABLE auth_recovery; DROP TABLE auth_staff; DROP TABLE auth_attempts; DROP TABLE auth_clock; DROP TABLE delivery_attempts; DROP TABLE deliveries; DROP INDEX delivery_claim_token; DROP TRIGGER case_accepted_at_immutable; ALTER TABLE cases DROP COLUMN claimToken; ALTER TABLE cases DROP COLUMN claimKind; PRAGMA user_version=3;");
    legacy.prepare("UPDATE cases SET deliveryState='smtp_accepted' WHERE id=?").run(id); legacy.close();
    repo = openRepository(join(dir, "db.sqlite"), { now: () => new Date(now) });
    expect(await repo.withCaseLock(id, async row => row.deliveryState)).toBe("needs_attention");
    expect(repo.getDelivery(id).identity).toBeNull(); expect(repo.getDelivery(id).reason).toBe("LEGACY_UNVERIFIED"); expect(repo.getDelivery(id).attempts).toEqual([]);
    expect(repo.getRequestIdentity(id).acceptedAt).toBe(now); expect(repo.listArtifactReservations()).toHaveLength(2);
    repo.close(); const inspection = new Database(join(dir, "db.sqlite"));
    expect(inspection.pragma("user_version", { simple: true })).toBe(7);
    expect(() => inspection.prepare("UPDATE cases SET acceptedAt=? WHERE id=?").run(at(1), id)).toThrow("IMMUTABLE_ACCEPTED_AT"); inspection.close();
    repo = openRepository(join(dir, "db.sqlite"));
  });
  it("rejects sensitive/unknown registration fields and malformed stored registration", async () => {
    const staged = await prepare();
    await expect(repo.stageRegisteredMail(authority(staged.case), { ...staged.delivery.registered!, body: "private" } as RegisteredMail, now)).rejects.toThrow("INVALID_DELIVERY_METADATA");
    await expect(repo.stageRegisteredMail(authority(staged.case), { ...staged.delivery.registered!, shape: { kind: "mixed", parts: 3, attachments: [{ name: "original-private-name.pdf", mediaType: "application/pdf", digest: hash, bytes: 1 }] } }, now)).rejects.toThrow("INVALID_DELIVERY_METADATA");
    repo.close(); const db = new Database(join(dir, "db.sqlite")); db.prepare("UPDATE deliveries SET registered=? WHERE caseId=?").run('{"body":"private"}', id); db.close();
    expect(() => openRepository(join(dir, "db.sqlite"))).toThrow("INVALID_DELIVERY_METADATA");
    const repair = new Database(join(dir, "db.sqlite")); repair.prepare("UPDATE deliveries SET registered=? WHERE caseId=?").run(JSON.stringify(staged.delivery.registered), id); repair.close(); repo = openRepository(join(dir, "db.sqlite"));
  });
  it("stages fixed identity and canonical registration before allowing MIME adoption", async () => {
    const first = await prepare(), again = await repo.stageRegisteredMail(authority(first.case), { ...first.delivery.registered!, shape: { attachments: [], parts: 1, kind: "text" } }, now);
    expect(again.case.version).toBe(first.case.version);
    expect(first.delivery.identity).toMatchObject({ id, date: now, keyId: "signing-1" });
    expect(first.delivery.identity!.messageId).toMatch(/^<[a-f0-9-]+@trinkgut-jammers\.de>$/);
    await expect(repo.stageDeliveryIdentity(authority(first.case), "signing-2", now)).rejects.toThrow("DELIVERY_IDENTITY_CONFLICT");
    await expect(repo.stageRegisteredMail(authority(first.case), { ...first.delivery.registered!, fingerprint: digest("b".repeat(64)) }, now)).rejects.toThrow("REGISTRATION_CONFLICT");
    const ready = await adopt(first); expect(ready.row.case.deliveryState).toBe("ready"); expect(ready.row.case.claimToken).toBeNull();
    expect(ready.row.delivery.mimeDigest).toBe(hash); expect(ready.row.case.version).toBeGreaterThan(first.case.version);
  });
  it("rejects generic sending/delivery/ready bypasses and incomplete MIME authority", async () => {
    const staged = await prepare();
    for (const state of ["ready", "sending", "delivered"] as const) await expect(repo.transitionDelivery(id, staged.case.version, { state })).rejects.toThrow("INVALID_TRANSITION");
    await expect(repo.bindVerifiedMime(authority(staged.case), { caseId: id, kind: "mime" } as ArtifactRecord, { kind: "verified" }, now)).rejects.toThrow();
    expect(repo.getDelivery(id).attempts).toEqual([]);
  });
  it("does not steal a live claim by wall clock and rejects stale tokens or versions", async () => {
    const prepared = await prepare();
    expect(repo.claimDispatchWork("other", at(1439))).toBeNull();
    await expect(repo.stageRegisteredMail({ ...authority(prepared.case), token: "0".repeat(64) }, prepared.delivery.registered!, now)).rejects.toThrow("STALE_CLAIM");
    await expect(repo.stageRegisteredMail({ ...authority(prepared.case), version: 1 }, prepared.delivery.registered!, now)).rejects.toThrow("STALE_VERSION");
    const ready = await adopt(prepared);
    const first = repo.claimDispatchWork("one", now, "send")!; expect(repo.claimDispatchWork("two", now, "send")).toBeNull();
    const [a, b] = await Promise.allSettled([repo.beginSendAttempt(authority(first.case), ready.artifact, { kind: "verified" }, now), repo.beginSendAttempt(authority(first.case), ready.artifact, { kind: "verified" }, now)]);
    expect(a.status).toBe("fulfilled"); expect(b.status).toBe("rejected"); expect(repo.getDelivery(id).attempts).toHaveLength(1);
  });
  it("preserves ready retries, exact failure-anchored due times and at most three attempts", async () => {
    let current = await sending();
    let failed = await repo.finishSendAttempt(authority(current.row.case), { kind: "definitely_failed", retryable: true }, at(2));
    expect(failed.delivery.sendDueAt).toBe("2026-10-09T10:07:00.000Z"); reopen();
    expect(repo.getDelivery(id).sendDueAt).toBe("2026-10-09T10:07:00.000Z"); expect(repo.claimDispatchWork("early", at(6))).toBeNull();
    let claim = repo.claimDispatchWork("retry", at(7), "send")!;
    current = { row: await repo.beginSendAttempt(authority(claim.case), current.artifact, { kind: "verified" }, at(7)), artifact: current.artifact };
    failed = await repo.finishSendAttempt(authority(current.row.case), { kind: "definitely_failed", retryable: true }, at(8));
    expect(failed.delivery.sendDueAt).toBe("2026-10-09T10:38:00.000Z");
    claim = repo.claimDispatchWork("retry", at(38), "send")!;
    current.row = await repo.beginSendAttempt(authority(claim.case), current.artifact, { kind: "verified" }, at(38));
    failed = await repo.finishSendAttempt(authority(current.row.case), { kind: "definitely_failed", retryable: true }, at(39));
    expect(failed.case.deliveryState).toBe("needs_attention"); expect(failed.delivery.reason).toBe("ATTEMPTS_EXHAUSTED");
    expect(failed.delivery.attempts).toHaveLength(3); expect(repo.claimDispatchWork("fourth", at(100))).toBeNull();
  });
  it("recovers send intent as mailbox-only uncertainty without inventing an outcome", async () => {
    const current = await sending(); reopen();
    const recovered = repo.getDelivery(id); expect(recovered.attempts[0].outcome).toBeNull(); expect(recovered.attempts[0].finishedAt).toBeNull();
    const claim = repo.claimDispatchWork("mailbox", now)!; expect(claim.case.claimKind).toBe("reconcile"); expect(claim.case.deliveryState).toBe("uncertain");
    await expect(repo.beginSendAttempt(authority(claim.case), current.artifact, { kind: "verified" }, now)).rejects.toThrow("INVALID_DELIVERY_WORK");
    expect(recovered.receiptSchedule).toEqual([now, at(5), at(30), at(60), at(1440)]);
  });
  it("preserves confirmed delivery across restart despite an unfinished original SMTP attempt", async () => {
    await sending(); reopen();
    const claim = repo.claimDispatchWork("receipt", now, "reconcile")!;
    const done = await repo.recordMailboxCheck(authority(claim.case), claim.delivery.registered!, { complete: true, copies: [{ mailbox: "INBOX", uidValidity: "17", uid: 42, fingerprint: hash }], issues: [] }, now);
    expect(done.case.deliveryState).toBe("delivered");
    expect(done.delivery.attempts[0]).toMatchObject({ outcome: null, finishedAt: null });
    reopen();
    const recovered = await repo.withCaseLock(id, async row => row);
    expect(recovered.deliveryState).toBe("delivered");
    expect(recovered).toEqual(done.case);
    expect(repo.getDelivery(id)).toEqual(done.delivery);
    expect(repo.claimDispatchWork("again", at(5))).toBeNull();
  });
  it.each(["final unresolved", "manual"] as const)("preserves %s attention across restart despite an unfinished original SMTP attempt", async resolution => {
    await sending(); reopen();
    const time = resolution === "final unresolved" ? at(1440) : now;
    const claim = repo.claimDispatchWork("receipt", time, "reconcile")!;
    const done = resolution === "final unresolved"
      ? await repo.recordMailboxCheck(authority(claim.case), claim.delivery.registered!, { complete: true, copies: [], issues: [] }, time)
      : await repo.recordDeliveryFailure(authority(claim.case), { category: "operational", reason: "MANUAL_REQUIRED" }, time);
    expect(done.case.deliveryState).toBe("needs_attention");
    expect(done.delivery.reason).toBe(resolution === "final unresolved" ? "RECEIPT_UNRESOLVED" : "MANUAL_REQUIRED");
    expect(done.delivery.attempts[0]).toMatchObject({ outcome: null, finishedAt: null });
    reopen();
    const recovered = await repo.withCaseLock(id, async row => row);
    expect(recovered.deliveryState).toBe("needs_attention");
    expect(recovered).toEqual(done.case);
    expect(repo.getDelivery(id)).toEqual(done.delivery);
    expect(repo.claimDispatchWork("again", at(1500))).toBeNull();
  });
  it("persists accepted outcomes and never converts them to ordinary sending after restart", async () => {
    const current = await sending(); await repo.finishSendAttempt(authority(current.row.case), { kind: "accepted" }, at(1)); reopen();
    expect(repo.claimDispatchWork("send", at(2), "send")).toBeNull();
    const claim = repo.claimDispatchWork("receipt", at(2), "reconcile")!; expect(claim.case.deliveryState).toBe("smtp_accepted");
    expect(repo.getDelivery(id).attempts[0].outcome).toEqual({ kind: "accepted" });
  });
  it("advances elapsed receipt slots once, retains exact verified evidence and shortens both deadlines", async () => {
    const current = await sending(); let pending = await repo.finishSendAttempt(authority(current.row.case), { kind: "uncertain" }, now);
    const claimed = repo.claimDispatchWork("receipt", at(31), "reconcile")!;
    pending = await repo.recordMailboxCheck(authority(claimed.case), pending.delivery.registered!, { complete: false, copies: [], issues: ["CANDIDATE_LIMIT"] }, at(31));
    expect(pending.delivery.mailboxChecks).toBe(1); expect(pending.delivery.receiptCursor).toBe(3);
    expect(repo.claimDispatchWork("burst", at(31))).toBeNull(); reopen();
    const next = repo.claimDispatchWork("receipt", at(60), "reconcile")!;
    const copies = [{ mailbox: "INBOX", uidValidity: "17", uid: 42, fingerprint: hash }];
    const done = await repo.recordMailboxCheck(authority(next.case), pending.delivery.registered!, { complete: true, copies, issues: [] }, at(60));
    expect(done.case.deliveryState).toBe("delivered"); expect(done.delivery.copies).toEqual(copies);
    expect(done.case.payloadDeleteAfter).toBe("2026-10-10T11:00:00.000Z"); expect(done.case.contactDeleteAfter).toBe(done.case.payloadDeleteAfter);
    expect(done.delivery.cleanupDueAt).toBe("2026-10-10T10:00:00.000Z");
    expect(done.delivery.incidentAt).toBe(at(60)); expect(done.delivery.manualRequiredAt).toBe(at(1440));
  });
  it("allows one final receipt-only check at the 24h boundary then requires attention", async () => {
    const current = await sending(); const pending = await repo.finishSendAttempt(authority(current.row.case), { kind: "uncertain" }, at(1439));
    expect(pending.delivery.receiptSchedule).toEqual([at(1439), at(1440)]);
    const claim = repo.claimDispatchWork("final", at(1500))!; expect(claim.case.claimKind).toBe("reconcile");
    const done = await repo.recordMailboxCheck(authority(claim.case), pending.delivery.registered!, { complete: true, copies: [], issues: [] }, at(1500));
    expect(done.case.deliveryState).toBe("needs_attention"); expect(repo.claimDispatchWork("again", at(1501))).toBeNull();
    expect(done.delivery.mailboxChecks).toBe(1); expect(done.delivery.receiptCursor).toBe(2);
  });
  it("forbids new SMTP after acceptance plus 24h and fails closed on artifact expiry", async () => {
    await adopt(await prepare()); expect(repo.claimDispatchWork("late", at(1440), "send")).toBeNull();
    expect(await repo.withCaseLock(id, async row => row.deliveryState)).toBe("needs_attention");
  });
  it.each(["missing", "corrupt"] as const)("turns %s adopted MIME into attention without recomposition or send intent", async kind => {
    const ready = await adopt(await prepare());
    if (kind === "missing") unlinkSync(ready.artifact.path); else writeFileSync(ready.artifact.path, "tampered ciphertext!", { mode: 0o600 });
    expect(repo.claimDispatchWork("send", now, "send")).toBeNull();
    const row = await repo.withCaseLock(id, async row => row);
    expect(row.deliveryState).toBe("needs_attention"); expect(repo.getDelivery(id).reason).toBe("ARTIFACT_UNAVAILABLE"); expect(repo.getDelivery(id).attempts).toEqual([]);
    await expect(repo.adoptArtifact({ ...ready.artifact, plaintextDigest: digest("b".repeat(64)) }, row.version)).rejects.toThrow();
  });
  it("honors the stricter effective document deadline without extending immutable artifact metadata", async () => {
    const ready = await adopt(await prepare()); repo.close(); const db = new Database(join(dir, "db.sqlite")); db.prepare("UPDATE cases SET payloadDeleteAfter=? WHERE id=?").run(at(1), id); db.close();
    repo = openRepository(join(dir, "db.sqlite"), { now: () => new Date(now) });
    expect(repo.claimDispatchWork("expired", at(1), "send")).toBeNull(); expect(repo.getDelivery(id).reason).toBe("PROCESSING_EXPIRED");
    expect(repo.getArtifact(id, "mime")).toEqual(ready.artifact); expect(repo.getRequestIdentity(id).acceptedAt).toBe(now);
  });
  it("classifies permanent SMTP failure without a retry or 24h contact-shortening shortcut", async () => {
    const intent = await sending(); const failed = await repo.finishSendAttempt(authority(intent.row.case), { kind: "definitely_failed", retryable: false }, at(1));
    expect(failed.case.deliveryState).toBe("needs_attention"); expect(failed.delivery.reason).toBe("PERMANENT_SEND_FAILURE"); expect(failed.delivery.sendDueAt).toBeNull();
    expect(failed.case.contactDeleteAfter).toBe("2026-11-08T10:00:00.000Z"); reopen(); expect(repo.claimDispatchWork("retry", at(100))).toBeNull();
  });
  it("rejects send mismatches, false verification and expired permission without allocating an attempt", async () => {
    const ready = await adopt(await prepare()), claim = repo.claimDispatchWork("send", now, "send")!;
    await expect(repo.beginSendAttempt(authority(claim.case), ready.artifact, { kind: "mismatch" }, now)).rejects.toThrow("MIME_VERIFICATION_REQUIRED");
    await expect(repo.beginSendAttempt(authority(claim.case), { ...ready.artifact, plaintextDigest: digest("b".repeat(64)) }, { kind: "verified" }, now)).rejects.toThrow("MIME_AUTHORITY_MISMATCH");
    await expect(repo.beginSendAttempt(authority(claim.case), ready.artifact, { kind: "verified" }, at(1440))).rejects.toThrow("DELIVERY_EXPIRED");
    expect(repo.getDelivery(id).attempts).toEqual([]);
  });
  it("does not confirm missing, incomplete, conflicting or malformed mailbox evidence", async () => {
    const current = await sending(); let pending = await repo.finishSendAttempt(authority(current.row.case), { kind: "accepted" }, now);
    for (const [time, result] of [[now, { complete: true, copies: [], issues: [] }], [at(5), { complete: false, copies: [{ mailbox: "INBOX", uidValidity: "7", uid: 1, fingerprint: hash }], issues: [] }], [at(30), { complete: true, copies: [{ mailbox: "INBOX", uidValidity: "7", uid: 1, fingerprint: hash }], issues: ["CONTENT_MISMATCH"] }]] as const) {
      const claim = repo.claimDispatchWork("receipt", time, "reconcile")!;
      pending = await repo.recordMailboxCheck(authority(claim.case), pending.delivery.registered!, { ...result, copies: [...result.copies], issues: [...result.issues] }, time);
      expect(pending.case.deliveryState).not.toBe("delivered"); expect(pending.delivery.copies).toEqual([]);
    }
    const claim = repo.claimDispatchWork("receipt", at(60), "reconcile")!;
    await expect(repo.recordMailboxCheck(authority(claim.case), pending.delivery.registered!, { complete: true, copies: [{ mailbox: "INBOX", uidValidity: "7", uid: 0, fingerprint: hash }], issues: [] }, at(60))).rejects.toThrow("INVALID_DELIVERY_METADATA");
    const copy = { mailbox: "INBOX", uidValidity: "7", uid: 1, fingerprint: hash };
    await expect(repo.recordMailboxCheck(authority(claim.case), pending.delivery.registered!, { complete: true, copies: [copy, copy], issues: [] }, at(60))).rejects.toThrow("INVALID_DELIVERY_METADATA");
    await expect(repo.recordMailboxCheck(authority(claim.case), pending.delivery.registered!, { complete: true, copies: [copy, { ...copy, uidValidity: "8", uid: 2 }], issues: [] }, at(60))).rejects.toThrow("INVALID_DELIVERY_METADATA");
    await expect(repo.recordMailboxCheck(authority(claim.case), pending.delivery.registered!, { complete: true, copies: Array.from({ length: 20 }, (_, index) => ({ ...copy, mailbox: "\\".repeat(4096), uid: index + 1 })), issues: [] }, at(60))).rejects.toThrow("INVALID_DELIVERY_METADATA");
    await expect(repo.recordDeliveryFailure(authority(claim.case), { category: "invalid", reason: "INVALID_INPUT" }, at(60))).rejects.toThrow("INVALID_DELIVERY_WORK");
  });
  it("will not commit a receipt if registered local MIME authority corrupts after claim", async () => {
    const intent = await sending(), pending = await repo.finishSendAttempt(authority(intent.row.case), { kind: "accepted" }, now);
    const claimed = repo.claimDispatchWork("receipt", now, "reconcile")!;
    writeFileSync(intent.artifact.path, "tampered ciphertext!", { mode: 0o600 });
    await expect(repo.recordMailboxCheck(authority(claimed.case), pending.delivery.registered!, { complete: true, copies: [{ mailbox: "INBOX", uidValidity: "7", uid: 42, fingerprint: hash }], issues: [] }, now)).rejects.toThrow("DIGEST_MISMATCH");
    expect(repo.getDelivery(id).confirmedAt).toBeNull();
    const incident = await repo.recordDeliveryFailure(authority(claimed.case), { category: "operational", reason: "ARTIFACT_UNAVAILABLE" }, now); expect(incident.case.deliveryState).toBe("needs_attention");
  });
  it("refuses a tampered persisted retry due time rather than authorizing an early send", async () => {
    const intent = await sending(); await repo.finishSendAttempt(authority(intent.row.case), { kind: "definitely_failed", retryable: true }, at(1));
    repo.close(); const db = new Database(join(dir, "db.sqlite")); db.prepare("UPDATE deliveries SET sendDueAt=? WHERE caseId=?").run(at(2), id); db.close();
    expect(() => openRepository(join(dir, "db.sqlite"), { now: () => new Date(at(2)) })).toThrow("INVALID_DELIVERY_METADATA");
    const repair = new Database(join(dir, "db.sqlite")); repair.prepare("UPDATE deliveries SET sendDueAt=? WHERE caseId=?").run(at(6), id); repair.close(); repo = openRepository(join(dir, "db.sqlite"));
  });
  it("preserves safe queued and staged scanning recovery without a MIME rewrite", async () => {
    const prepared = await prepare(); const fixed = prepared.delivery.identity; reopen();
    const claim = repo.claimDispatchWork("resume", now, "prepare")!;
    expect(claim.case.deliveryState).toBe("scanning"); expect(claim.delivery.identity).toEqual(fixed); expect(claim.delivery.registered).toEqual(prepared.delivery.registered);
    expect(claim.case.version).toBeGreaterThan(prepared.case.version); expect(claim.case.claimToken).not.toBe(prepared.case.claimToken);
    expect(await repo.stageRegisteredMail(authority(claim.case), prepared.delivery.registered!, now)).toEqual(claim);
  });
  it("returns authoritative claim-release state and never releases unfinished SMTP as a retry", async () => {
    const staged = await prepare(), released = await repo.releaseDeliveryClaim(authority(staged.case), now);
    expect(released.case.deliveryState).toBe("queued"); expect(released.case.claimToken).toBeNull();
    const next = repo.claimDispatchWork("prepare", now, "prepare")!; expect(next.case.claimToken).not.toBe(staged.case.claimToken);
    const ready = await adopt({ case: next.case, delivery: next.delivery }), send = repo.claimDispatchWork("send", now, "send")!;
    const intent = await repo.beginSendAttempt(authority(send.case), ready.artifact, { kind: "verified" }, now);
    const unresolved = await repo.releaseDeliveryClaim(authority(intent.case), at(1));
    expect(unresolved.case.deliveryState).toBe("uncertain"); expect(unresolved.delivery.attempts[0].outcome).toBeNull();
  });
  it("authenticates contact on storage and equality re-entry without plaintext in DB or audit", async () => {
    const prepared = await prepare(), binding = { caseId: id, acceptedAt: now, version: 1 };
    const a = sealContact("synthetic@example.test", binding, keys.publicKey), b = sealContact("synthetic@example.test", binding, keys.publicKey);
    const saved = await repo.storeContact(authority(prepared.case), a, keys.privateKey, now);
    const repeated = await repo.storeContact(authority(saved.case), b, keys.privateKey, now);
    expect(repeated.case.version).toBe(saved.case.version); expect(repeated.delivery.contactEnvelope).toBe(a);
    await expect(repo.storeContact(authority(saved.case), sealContact("different@example.test", binding, keys.publicKey), keys.privateKey, now)).rejects.toThrow("CONTACT_CONFLICT");
    await expect(repo.storeContact(authority(saved.case), "bad", keys.privateKey, now)).rejects.toThrow("CONTACT_AUTHENTICATION_FAILED");
    repo.close(); const db = new Database(join(dir, "db.sqlite"));
    expect(JSON.stringify(db.prepare("SELECT * FROM deliveries").all())).not.toContain("example.test"); expect(JSON.stringify(db.prepare("SELECT * FROM audit").all())).not.toContain("example.test"); db.close();
    repo = openRepository(join(dir, "db.sqlite"));
  });
  it("rejects a malformed persisted contact envelope before exposing retirement authority", () => {
    repo.close(); const db = new Database(join(dir, "db.sqlite")); db.prepare("UPDATE deliveries SET contactEnvelope='AAAA' WHERE caseId=?").run(id); db.close();
    expect(() => openRepository(join(dir, "db.sqlite"))).toThrow("INVALID_DELIVERY_METADATA");
    const repair = new Database(join(dir, "db.sqlite")); repair.prepare("UPDATE deliveries SET contactEnvelope=NULL WHERE caseId=?").run(id); repair.close(); repo = openRepository(join(dir, "db.sqlite"));
  });
  it.each(["invalid", "operational"] as const)("distinguishes %s determination and its cleanup policy", async category => {
    const prepared = await prepare(); const result = await repo.recordDeliveryFailure(authority(prepared.case), category === "invalid" ? { category, reason: "MALICIOUS_INPUT" } : { category, reason: "DEPENDENCY_UNAVAILABLE" }, at(60));
    expect(result.case.deliveryState).toBe("needs_attention"); expect(result.delivery.category).toBe(category);
    expect(result.case.payloadDeleteAfter).toBe(category === "invalid" ? "2026-10-10T11:00:00.000Z" : "2026-10-16T10:00:00.000Z");
    expect(result.case.contactDeleteAfter).toBe(category === "invalid" ? "2026-10-10T11:00:00.000Z" : "2026-11-08T10:00:00.000Z");
  });
});
