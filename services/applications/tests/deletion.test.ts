import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { createHmac, createSecretKey, generateKeyPairSync } from "node:crypto";
import { Readable } from "node:stream";
import { ImapFlow } from "imapflow";
import { fingerprintMime, MIME_LIMITS } from "../src/mail-manifest";
import { createMailbox } from "../src/imap";
import { imapServer } from "./helpers/imap-server";
import { Secret, TOTP } from "otpauth";
import { runDeletionOnce, hasRetainedDeletion, awaitDeletionSettlement } from "../src/deletion";
import { deletionOwner } from "../src/deletion-repository";
import { openRepository } from "../src/repository";
import { createSafetyJournal } from "../src/ledger";
import { dateOnly, digest, utcInstant, type AdmissionScope, type ApplicationRepository, type JournalEvent, type SafetyJournal, type MailboxPort, type RegisteredMail } from "../src/types";
import { caseId, fence, instant, syntheticJournal } from "./fixtures/ledger";
import { testAdmission, removeTask10Schema } from "./fixtures/admission";

const connection = vi.hoisted(() => ({ current: undefined as Database.Database | undefined }));
vi.mock("better-sqlite3", async original => {
  const actual = await original<{ default: typeof Database }>();
  return { default: class extends actual.default { constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); connection.current = this; } } };
});
const cleanup: (() => void)[] = [];
afterEach(() => { vi.useRealTimers(); while (cleanup.length) cleanup.pop()!(); });
const scope: AdmissionScope = ["4".repeat(32), "application", null, "2026-01-01T00:00:00.000Z", "2028-01-01T00:00:00.000Z"];
function setup() {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), "deletion-synthetic-")), fixture = syntheticJournal();
  let time = Date.parse(instant), mono = 0, admission: AdmissionScope | null = scope, calls = 0;
  let journal!: SafetyJournal, repository!: ApplicationRepository;
  const options = { admissionScope: { currentScope: () => admission }, journalFactory: (projection: Parameters<typeof createSafetyJournal>[0]["projection"]) => {
    calls++; journal = createSafetyJournal({ port: { append: event => fixture.port.append(event), readSince: cursor => fixture.port.readSince(cursor) }, trust: { currentContext: () => fixture.context }, clock: { wallNow: () => new Date(time), monotonicNow: () => mono }, projection }); return journal;
  } };
  function open() { repository = openRepository(join(dir, "registry.sqlite"), { now: () => new Date(time) }, options); }
  open(); cleanup.push(() => { repository.close(); rmSync(dir, { recursive: true, force: true }); });
  let acceptedCount = 0;
  function accept() {
    const now = utcInstant(new Date(time).toISOString()), reservation = repository.reserve({ ...testAdmission(), sessionHash: digest("a".repeat(64)), idempotencyKey: `case-${++acceptedCount}`, reservedBytes: 1, now });
    const input = { reservationId: reservation.id, digest: digest("b".repeat(64)), encryptedPayloadPath: join(dir, "payload.enc"), actualBytes: 1, encryptedName: "synthetic", job: "sales-fulltime" as const, now };
    return { value: repository.commitIntake(input), input };
  }
  return { fixture, dir, accept, get repository() { return repository; }, get journal() { return journal; }, get db() { return connection.current!; }, get calls() { return calls; }, get time() { return time; }, clock: { wallNow: () => new Date(time), monotonicNow: () => mono }, setAdmission(value: AdmissionScope | null) { admission = value; }, advance(ms: number) { time += ms; mono += ms; }, restart() { repository.close(); open(); } };
}
const authKeys = generateKeyPairSync("rsa", { modulusLength: 2048 }), mimeKey = createSecretKey(Buffer.alloc(32, 7));
async function due() {
  const s = setup(), accepted = s.accept().value, at = utcInstant(new Date(s.time).toISOString());
  await s.journal.refresh("startup");
  const claim = s.repository.claimNext("fixture", at)!;
  const identity = await s.repository.stageDeliveryIdentity({ id: claim.id, version: claim.version, token: claim.claimToken }, "mime", at);
  const unsigned = Buffer.from(`From: info@trinkgut-jammers.de\r\nTo: info@trinkgut-jammers.de\r\nReply-To: synthetic@example.invalid\r\nSubject: Synthetic\r\nDate: Sat, 10 Oct 2026 12:00:00 +0000\r\nMessage-ID: ${identity.delivery.identity!.messageId}\r\nX-TJ-Application-ID: ${accepted.id}\r\nX-TJ-Profile: tj-mail-1\r\nX-TJ-Key-ID: mime\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\nSGVsbG8=\r\n`);
  const fingerprint = await fingerprintMime(Readable.from([unsigned]), MIME_LIMITS);
  const mail: RegisteredMail = { id: accepted.id, messageId: identity.delivery.identity!.messageId, keyId: "mime", profile: "tj-mail-1", fingerprint: fingerprint.fingerprint, shape: fingerprint.shape };
  const framed = ["tj-application-mail-signature-1", mail.profile, mail.keyId, mail.id, mail.messageId, mail.fingerprint].map(value => { const bytes = Buffer.from(value), length = Buffer.alloc(4); length.writeUInt32BE(bytes.length); return Buffer.concat([length, bytes]); });
  const signature = createHmac("sha256", mimeKey).update(Buffer.concat(framed)).digest("hex");
  const raw = Buffer.concat([Buffer.from(`X-TJ-Fingerprint: ${mail.fingerprint}\r\nX-TJ-Signature: ${signature}\r\n`), unsigned]);
  const staged = await s.repository.stageRegisteredMail({ id: claim.id, version: identity.case.version, token: claim.claimToken }, mail, at);
  await s.repository.releaseDeliveryClaim({ id: claim.id, version: staged.case.version, token: claim.claimToken }, at);
  const service = s.repository.createAuthentication({ keys: authKeys, rateKey: Buffer.alloc(32, 8), trust: { currentEpoch: () => digest("9".repeat(64)) } });
  const password = "Synthetic deletion fixture password", stage = await service.beginEnrollment(password, password);
  const otp = () => TOTP.generate({ secret: Secret.fromBase32(new URL(stage.provisioningUri).searchParams.get("secret")!), algorithm: "SHA1", digits: 6, period: 30, timestamp: s.time });
  service.finishEnrollment(stage.handle, otp()); s.advance(30000);
  const login = await service.authenticate({ username: "niko", password, otp: otp(), trustedIp: "127.0.0.1" }); if (login.kind !== "authenticated") throw new Error("FIXTURE_LOGIN");
  s.advance(30000);
  const row = s.repository.getLifecycleCase(accepted.id, login.session);
  const grant = await service.authorizeSensitiveAction(login.session, { password, otp: otp(), trustedIp: "127.0.0.1" }, { kind: "reject", caseId: row.id, version: row.version });
  await s.journal.refresh("refresh"); await s.repository.applyCaseAction(row.id, { kind: "reject", closedOn: dateOnly("2026-10-10") }, grant, login.session);
  s.advance(Date.parse("2027-04-11T12:00:00.000Z") - s.time); await s.journal.refresh("refresh");
  const deletionScope = { ledgerId: s.fixture.context.ledgerId, historyEpoch: s.fixture.context.historyEpoch, associationKeyId: "deletion-key", associationKey: Buffer.alloc(32, 6), approvedScopes: [scope] };
  let searches = 0, deletions = 0, exists = true;
  const mailbox: MailboxPort = { findVerified: async () => { searches++; return { complete: true, issues: [], copies: exists ? [{ mailbox: "canary@example.invalid/Archive", uid: 1, uidValidity: "1", fingerprint: mail.fingerprint }] : [] }; }, deleteVerified: async () => { deletions++; exists = false; return { kind: "deleted" }; }, disconnect: async () => {}, settle: async () => {} };
  const deps = { repository: s.repository, clock: s.clock, scope: { currentScope: () => deletionScope }, verificationKeys: () => new Map([["mime", mimeKey]]), createMailbox: () => mailbox };
  return { ...s, get repository() { return s.repository; }, get journal() { return s.journal; }, get db() { return s.db; }, accepted, mail, raw, mailbox, deps, deletionScope, get searches() { return searches; }, get deletions() { return deletions; } };
}

describe("finite guarded deletion", () => {
  it.each(["CONTENT_MISMATCH", "INVALID_IDENTITY", "IDENTITY_CHANGED"] as const)("keeps %s blocked across diagnostic SQL failure and exact restart recovery", async issue => {
    const s = await due();
    s.mailbox.deleteVerified = async () => ({ kind: "mismatch", issue });
    s.db.exec("CREATE TRIGGER synthetic_diagnostic_fault BEFORE INSERT ON deletion_diagnostics BEGIN SELECT RAISE(ABORT,'synthetic diagnostic fault'); END;");
    expect((await runDeletionOnce(s.deps)).cases[0].reason).toBe("STORAGE_FAILED");
    const pending = s.db.prepare("SELECT eventId,event FROM deletion_events WHERE phase='proposed'").get() as { eventId: string; event: string };
    expect(JSON.parse(pending.event)[4].slice(2)).toEqual(["mismatch", issue]);
    expect(s.db.prepare("SELECT contradictory,status FROM deletion_state WHERE caseId=?").get(s.accepted.id)).toEqual({ contradictory: 1, status: "blocked" });
    s.db.exec("DROP TRIGGER synthetic_diagnostic_fault"); s.restart(); s.deps.repository = s.repository;
    s.mailbox.findVerified = async () => ({ copies: [], complete: true, issues: [] });
    expect((await runDeletionOnce(s.deps)).cases[0].reason).toBe("DEFERRED");
    expect(s.db.prepare("SELECT eventId,event FROM deletion_events WHERE eventId=? AND phase='acknowledged'").get(pending.eventId)).toEqual(pending);
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("blocked");
    expect(s.fixture.receipts.map(r => JSON.parse(r.entry)[0][7][3])).not.toContain("mailbox_clear_observed");
    expect(s.db.prepare("SELECT clearEventId FROM deletion_state WHERE caseId=?").get(s.accepted.id)).toEqual({ clearEventId: null });
  });
  for (const phase of ["proposed", "acknowledged"] as const) {
    it.each(["CONTENT_MISMATCH", "INVALID_IDENTITY", "IDENTITY_CHANGED"] as const)(`reconciles old ${phase} %s evidence with a missing latch before empty-search clearing`, async issue => {
      const s = await due(); s.mailbox.deleteVerified = async () => ({ kind: "mismatch", issue });
      s.db.exec("CREATE TRIGGER synthetic_diagnostic_fault BEFORE INSERT ON deletion_diagnostics BEGIN SELECT RAISE(ABORT,'synthetic diagnostic fault'); END;");
      await runDeletionOnce(s.deps); s.db.exec("DROP TRIGGER synthetic_diagnostic_fault");
      const pending = s.db.prepare("SELECT eventId,event FROM deletion_events WHERE phase='proposed'").get() as { eventId: string; event: string };
      if (phase === "acknowledged") {
        const event = JSON.parse(pending.event);
        await s.journal.recover(event); const receipt = await s.journal.append(event);
        await s.repository.withCaseLock(s.accepted.id, async () => deletionOwner(s.repository).acknowledge(s.accepted.id, event, receipt));
      }
      // Genuine persisted pre-fix boundary: exact outcome exists but the old
      // separately written latch was absent at the stop/restore boundary.
      s.db.prepare("UPDATE deletion_state SET contradictory=0,status='partial' WHERE caseId=?").run(s.accepted.id);
      s.restart(); s.deps.repository = s.repository;
      s.mailbox.findVerified = async () => ({ copies: [], complete: true, issues: [] });
      if (phase === "proposed") expect((await runDeletionOnce(s.deps)).cases[0].reason).toBe("DEFERRED");
      expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("blocked");
      expect(s.db.prepare("SELECT contradictory,status,clearEventId FROM deletion_state WHERE caseId=?").get(s.accepted.id)).toEqual({ contradictory: 1, status: "blocked", clearEventId: null });
      expect(s.db.prepare("SELECT eventId,event FROM deletion_events WHERE eventId=? AND phase='acknowledged'").get(pending.eventId)).toEqual(pending);
      expect(s.fixture.receipts.map(r => JSON.parse(r.entry)[0][7][3])).not.toContain("mailbox_clear_observed");
    });
  }
  it("keeps UIDVALIDITY_CHANGED transient across restart and permits later complete empty evidence", async () => {
    const s = await due(); s.mailbox.deleteVerified = async () => ({ kind: "mismatch", issue: "UIDVALIDITY_CHANGED" });
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("partial");
    expect(s.db.prepare("SELECT contradictory FROM deletion_state WHERE caseId=?").get(s.accepted.id)).toEqual({ contradictory: 0 });
    s.restart(); s.deps.repository = s.repository;
    s.mailbox.findVerified = async () => ({ copies: [], complete: true, issues: [] });
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("mailbox_cleared");
  });
  it("does no work when the existing case guard is acquired only after the run deadline", async () => {
    const s = await due(); let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), seen = new Promise<void>(resolve => { entered = resolve; });
    const locked = s.repository.withCaseLock(s.accepted.id, async () => { entered(); await gate; }); await seen;
    const before = s.fixture.receipts.length; vi.useFakeTimers(); const running = runDeletionOnce(s.deps);
    await Promise.resolve(); s.advance(900000); await vi.advanceTimersByTimeAsync(900000);
    const report = await running; expect(report.ownership).toBe("retained"); expect(report.cases[0].reason).toBe("DEFERRED");
    expect(hasRetainedDeletion(s.repository)).toBe(true); release(); await locked; await awaitDeletionSettlement(s.repository);
    expect(s.fixture.receipts).toHaveLength(before); expect(s.searches).toBe(0); expect(s.deletions).toBe(0);
  });
  it("blocks a newer independently committed fence absent from the local business proposal", async () => {
    const s = await due(), row = s.repository.withCaseLock(s.accepted.id, async value => value);
    const value = await row;
    s.fixture.commit(["tj-journal-event-v1", "e".repeat(32), new Date(s.time).toISOString(), "case_fence", [value.id, "fence", value.lifecycle.authorityId!, String(value.version), "reopen"]]);
    s.advance(60000);
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("blocked"); expect(s.searches).toBe(0); expect(s.deletions).toBe(0);
  });
  it("does not append a persisted intent when synchronous storage consumes the deadline", async () => {
    const s = await due(), before = s.fixture.receipts.length;
    s.db.function("synthetic_stall", () => { s.advance(600000); return 1; });
    s.db.exec("CREATE TRIGGER synthetic_stall_before_intent BEFORE INSERT ON deletion_events BEGIN SELECT synthetic_stall(); END;");
    const report = await runDeletionOnce(s.deps); await awaitDeletionSettlement(s.repository);
    expect(report.stopReason).toBe("deadline"); expect(s.fixture.receipts).toHaveLength(before); expect(s.searches).toBe(0);
    expect(s.db.prepare("SELECT phase FROM deletion_events").all()).toEqual([{ phase: "proposed" }]);
  });
  it("persists a late actual mutation result without starting another journal or mailbox effect", async () => {
    const s = await due(); let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), seen = new Promise<void>(resolve => { entered = resolve; });
    s.mailbox.deleteVerified = async () => { entered(); await gate; return { kind: "deleted" }; };
    s.mailbox.settle = () => gate;
    vi.useFakeTimers(); const run = runDeletionOnce(s.deps); await seen;
    const before = s.fixture.receipts.length; s.advance(600000); await vi.advanceTimersByTimeAsync(600000);
    const report = await run; expect(report.ownership).toBe("retained"); release(); await awaitDeletionSettlement(s.repository);
    expect(s.fixture.receipts).toHaveLength(before); expect(s.searches).toBe(1);
    const pending = s.db.prepare("SELECT event FROM deletion_events WHERE phase='proposed'").get() as { event: string };
    expect(JSON.parse(pending.event).slice(3)).toEqual(["copy_result", [s.accepted.id, expect.any(String), "deleted", null]]);
    expect(report.cases[0].status).not.toBe("mailbox_cleared");
  });
  it("recovers exact result acknowledgement after restart without retrying the saved UID", async () => {
    const s = await due(), append = s.fixture.port.append; let lost = false;
    s.fixture.port.append = async event => { const receipt = await append(event); if (!lost && event[3] === "copy_result") { lost = true; throw new Error("synthetic lost result ack"); } return receipt; };
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("blocked"); expect(s.deletions).toBe(1);
    const pending = s.db.prepare("SELECT eventId FROM deletion_events WHERE phase='proposed'").get();
    s.restart(); s.deps.repository = s.repository;
    expect((await runDeletionOnce(s.deps)).cases[0].reason).toBe("DEFERRED"); expect(s.deletions).toBe(1); expect(s.searches).toBe(1);
    expect(s.db.prepare("SELECT eventId FROM deletion_events WHERE eventId=? AND phase='acknowledged'").get((pending as { eventId: string }).eventId)).toEqual(pending);
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("mailbox_cleared"); expect(s.deletions).toBe(1);
  });
  it("resolves transient uncertainty only after a later complete empty search and preserves observed diagnostic expiry", async () => {
    const s = await due(); s.mailbox.findVerified = async () => ({ copies: [], complete: false, issues: ["FOLDER_UNAVAILABLE"] });
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("partial");
    expect(s.db.prepare("SELECT status FROM deletion_state WHERE caseId=?").get(s.accepted.id)).toEqual({ status: "partial" });
    const original = s.db.prepare("SELECT observedAt,expiresAt FROM deletion_diagnostics").all(); s.advance(86400000);
    s.mailbox.findVerified = async () => ({ copies: [], complete: true, issues: [] });
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("mailbox_cleared");
    expect(s.db.prepare("SELECT observedAt,expiresAt FROM deletion_diagnostics").all()).toEqual(original);
    expect(Date.parse((original[0] as { expiresAt: string }).expiresAt) - Date.parse((original[0] as { observedAt: string }).observedAt)).toBe(30 * 86400000);
  });
  it("uses the real Task6 protocol to remove fresh verified copies in multiple folders and preserve foreign Deleted mail", async () => {
    const s = await due();
    const foreign = { uid: 999, raw: Buffer.from("Subject: Synthetic\r\n\r\nunrelated"), flags: new Set(["\\Deleted"]) };
    const folders = [{ path: "INBOX", messages: [{ uid: 123, raw: s.raw, flags: new Set<string>() }, foreign] }, { path: "Archive", messages: [{ uid: 123, raw: s.raw, flags: new Set<string>() }] }];
    const server = await imapServer({ folders });
    try {
      const report = await runDeletionOnce({ ...s.deps, createMailbox: budget => createMailbox({ user: "synthetic", pass: "synthetic", keys: s.deps.verificationKeys(), budget }, { createClient: options => new ImapFlow({ ...options, host: "127.0.0.1", port: server.port, secure: false, doSTARTTLS: false, tls: undefined }) }) });
      expect(report.cases[0].status).toBe("mailbox_cleared"); expect(folders[0].messages).toEqual([foreign]); expect(folders[1].messages).toEqual([]);
      expect(server.commands.filter(command => ["EXPUNGE", "CLOSE"].includes(command.verb))).toEqual([]);
      expect(server.commands.filter(command => command.verb === "UID EXPUNGE").map(command => command.args)).toEqual(["123", "123"]);
    } finally { await server.close(); }
  });
  it("does not mutate any copy when a real matching-header candidate has forged content", async () => {
    const s = await due(), forged = Buffer.from(s.raw.toString().replace("SGVsbG8=", "Rm9yZ2Vk"));
    const folder = { path: "INBOX", messages: [{ uid: 123, raw: s.raw, flags: new Set<string>() }, { uid: 456, raw: forged, flags: new Set<string>() }] }, server = await imapServer({ folders: [folder] });
    try {
      const report = await runDeletionOnce({ ...s.deps, createMailbox: budget => createMailbox({ user: "synthetic", pass: "synthetic", keys: s.deps.verificationKeys(), budget }, { createClient: options => new ImapFlow({ ...options, host: "127.0.0.1", port: server.port, secure: false, doSTARTTLS: false, tls: undefined }) }) });
      expect(report.cases[0].status).toBe("blocked"); expect(folder.messages).toHaveLength(2);
      expect(server.commands.filter(command => command.verb === "UID STORE" || command.verb === "UID EXPUNGE")).toEqual([]);
    } finally { await server.close(); }
  });
  it("never issues a fourth discovery and leaves third-round mutations unproved until a separate run", async () => {
    const s = await due(); let searches = 0, deletes = 0;
    s.mailbox.findVerified = async () => { searches++; return { complete: true, issues: [], copies: [{ mailbox: "INBOX", uid: searches, uidValidity: "1", fingerprint: s.mail.fingerprint }] }; };
    s.mailbox.deleteVerified = async () => { deletes++; return { kind: "deleted" }; };
    const result = await runDeletionOnce(s.deps); expect(searches).toBe(3); expect(deletes).toBe(3); expect(result.cases[0].status).toBe("partial");
    s.mailbox.findVerified = async () => { searches++; return { complete: true, issues: [], copies: [] }; };
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("mailbox_cleared"); expect(searches).toBe(4);
  });
  it("defers before a marker when less than the full possible-mutation reserve remains", async () => {
    const s = await due(); s.mailbox.findVerified = async () => { s.advance(351000); return { complete: true, issues: [], copies: [{ mailbox: "INBOX", uid: 1, uidValidity: "1", fingerprint: s.mail.fingerprint }] }; };
    const result = await runDeletionOnce(s.deps); expect(result.cases[0].reason).toBe("DEFERRED"); expect(s.deletions).toBe(0);
    expect(s.fixture.receipts.map(r => JSON.parse(r.entry)[0][7][3])).not.toContain("copy_mutation_started");
  });
  it.each(["scope", "version", "safety", "key"] as const)("rechecks actual %s after the awaited search before any mutation", async change => {
    const s = await due(), original = s.mailbox.findVerified;
    s.mailbox.findVerified = async mail => {
      const result = await original(mail);
      if (change === "scope") s.deletionScope.associationKey[0] ^= 1;
      if (change === "version") s.db.prepare("UPDATE cases SET version=version+1 WHERE id=?").run(s.accepted.id);
      if (change === "safety") s.db.prepare("UPDATE case_lifecycle SET safetyRevision=safetyRevision+1 WHERE caseId=?").run(s.accepted.id);
      if (change === "key") s.deps.verificationKeys = () => new Map([["mime", createSecretKey(Buffer.alloc(32, 1))]]);
      return result;
    };
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("blocked"); expect(s.deletions).toBe(0);
  });
  it("retains contradictory identity history even when a later complete search is empty", async () => {
    const s = await due(); s.mailbox.findVerified = async () => ({ copies: [], complete: true, issues: ["CONTENT_MISMATCH"] });
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("blocked");
    s.mailbox.findVerified = async () => ({ copies: [], complete: true, issues: [] });
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("blocked"); expect(s.deletions).toBe(0);
  });
  it("keeps exact pending intent after lost acknowledgement and recovers only the original event", async () => {
    const s = await due(), append = s.fixture.port.append; let lost = false;
    s.fixture.port.append = async event => { const receipt = await append(event); if (!lost && event[3] === "attempt_intent") { lost = true; throw new Error("synthetic lost ack"); } return receipt; };
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("blocked"); expect(s.searches).toBe(0);
    const before = s.db.prepare("SELECT eventId,event FROM deletion_events WHERE phase='proposed'").get();
    expect((await runDeletionOnce(s.deps)).cases[0].reason).toBe("DEFERRED"); expect(s.searches).toBe(0);
    expect(s.db.prepare("SELECT eventId,event FROM deletion_events").all()).toEqual([before]);
    expect(s.fixture.receipts.map(r => JSON.parse(r.entry)[0][7][3]).filter(k => k === "attempt_intent")).toHaveLength(1);
  });
  it("rejects oversized search DTOs instead of slicing them into successful coverage", async () => {
    const s = await due(); s.mailbox.findVerified = async () => ({ complete: true, issues: [], copies: Array.from({ length: 21 }, (_, i) => ({ mailbox: "INBOX", uid: i + 1, uidValidity: "1", fingerprint: s.mail.fingerprint })) });
    expect((await runDeletionOnce(s.deps)).cases[0].reason).toBe("INVALID_EVIDENCE"); expect(s.deletions).toBe(0);
  });
  it.each(["copies", "issues"] as const)("rejects sparse %s without persisting malformed search evidence", async field => {
    const s = await due(); s.mailbox.findVerified = async () => ({ complete: true, copies: [], issues: [], [field]: new Array(1) });
    expect((await runDeletionOnce(s.deps)).cases[0].reason).toBe("INVALID_EVIDENCE");
    expect(s.db.prepare("SELECT count(*) n FROM deletion_searches").get()).toEqual({ n: 0 });
  });
  it("invalidates a changed verification-key configuration even when the registered key survived", async () => {
    const s = await due(), original = s.mailbox.findVerified;
    s.mailbox.findVerified = async mail => { const result = await original(mail); s.deps.verificationKeys = () => new Map([["mime", mimeKey], ["added", createSecretKey(Buffer.alloc(32, 2))]]); return result; };
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("blocked"); expect(s.deletions).toBe(0);
  });
  it("does not release the case if one cleanup observer rejects while real journal ownership is still pending", async () => {
    const s = await due(), append = s.fixture.port.append; let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), seen = new Promise<void>(resolve => { entered = resolve; });
    s.fixture.port.append = async event => { if (event[3] === "copy_mutation_started") { entered(); await gate; } return append(event); };
    s.mailbox.settle = async () => { throw new Error("synthetic cleanup rejection"); };
    vi.useFakeTimers(); const running = runDeletionOnce(s.deps); await seen;
    s.advance(600000); await vi.advanceTimersByTimeAsync(600000); await running;
    await Promise.resolve(); expect(hasRetainedDeletion(s.repository)).toBe(true);
    release(); await awaitDeletionSettlement(s.repository);
  });
  it("keeps existing active delivery ownership intact and exposes no unguarded evidence write", async () => {
    const s = await due();
    s.db.prepare("UPDATE cases SET deliveryState='scanning',claimToken=?,claimOwner='active-worker',claimKind='prepare',claimedAt=acceptedAt WHERE id=?").run("d".repeat(64), s.accepted.id);
    expect((await runDeletionOnce(s.deps)).cases[0].status).toBe("blocked"); expect(s.searches).toBe(0);
    expect(s.db.prepare("SELECT claimOwner FROM cases WHERE id=?").get(s.accepted.id)).toEqual({ claimOwner: "active-worker" });
    expect(() => deletionOwner(s.repository).snapshot(s.accepted.id)).toThrow("DELETION_GUARD_REQUIRED");
  });
  it("journals exact phases, clears only after empty observation and keeps organizational evidence separate", async () => {
    const s = await due(), report = await runDeletionOnce(s.deps);
    expect(report.cases).toEqual([{ id: s.accepted.id, status: "mailbox_cleared", reason: null, externalCopiesConfirmed: false }]);
    expect(s.searches).toBe(2); expect(s.deletions).toBe(1); expect(report.ownership).toBe("settled");
    const events = s.fixture.receipts.map(r => JSON.parse(r.entry)[0][7] as JournalEvent).filter(e => !["barrier", "case_fence"].includes(e[3]));
    expect(events.map(e => e[3])).toEqual(["attempt_intent", "copy_mutation_started", "copy_result", "mailbox_clear_observed"]);
    expect(JSON.stringify(events) + JSON.stringify(report)).not.toContain("canary@example.invalid");
    expect(s.repository.getDelivery(s.accepted.id).confirmedAt).toBeNull();
  });
  it("performs no mutation from incomplete or issue-bearing search results", async () => {
    const s = await due(); s.mailbox.findVerified = async () => ({ copies: [{ mailbox: "INBOX", uid: 1, uidValidity: "1", fingerprint: s.mail.fingerprint }], complete: false, issues: ["FOLDER_UNAVAILABLE"] });
    const result = await runDeletionOnce(s.deps);
    expect(s.deletions).toBe(0); expect(result.cases[0].status).toBe("partial");
    expect(s.fixture.receipts.map(r => JSON.parse(r.entry)[0][7][3])).not.toContain("copy_mutation_started");
  });
  it("returns one immutable timed report while retaining the real guard and same repository run", async () => {
    const s = await due(); let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), seen = new Promise<void>(resolve => { entered = resolve; });
    s.mailbox.findVerified = async () => { entered(); await gate; return { copies: [], complete: true, issues: [] }; };
    s.mailbox.settle = () => gate;
    vi.useFakeTimers();
    const first = runDeletionOnce(s.deps); await seen; const second = runDeletionOnce({ ...s.deps, createMailbox: () => { throw new Error("SECOND_RUN"); } });
    expect(first).toBe(second); s.advance(600000); await vi.advanceTimersByTimeAsync(600000);
    const report = await first; expect(report.ownership).toBe("retained"); expect(report.stopReason).toBe("deadline");
    expect(hasRetainedDeletion(s.repository)).toBe(true); expect(Object.isFrozen(report)).toBe(true);
    let settled = false; const settlement = awaitDeletionSettlement(s.repository).then(() => { settled = true; }); await Promise.resolve(); expect(settled).toBe(false);
    release(); await settlement; expect(hasRetainedDeletion(s.repository)).toBe(false); expect(report.ownership).toBe("retained");
  });
});

describe("original-owner safety projection and acceptance", () => {
  it("migrates actual schema7 to8 once, preserving exact facts and using the contradiction index", async () => {
    const s = await due(); s.mailbox.deleteVerified = async () => ({ kind: "mismatch", issue: "CONTENT_MISMATCH" }); await runDeletionOnce(s.deps);
    const tables = ["cases", "case_lifecycle", "lifecycle_proposals", "auth_grants", "deliveries", "deletion_events", "deletion_state", "deletion_diagnostics"];
    const before = tables.map(table => s.db.prepare(`SELECT * FROM ${table}`).all());
    s.db.exec("DROP INDEX IF EXISTS deletion_contradictory_result; PRAGMA user_version=7;"); s.restart();
    expect(s.db.pragma("user_version", { simple: true })).toBe(8);
    expect(tables.map(table => s.db.prepare(`SELECT * FROM ${table}`).all())).toEqual(before);
    const plan = s.db.prepare("EXPLAIN QUERY PLAN SELECT eventId FROM deletion_events WHERE caseId=? AND json_extract(event,'$[3]')='copy_result' AND json_extract(event,'$[4][2]')='mismatch' AND json_extract(event,'$[4][3]') IN ('INVALID_IDENTITY','CONTENT_MISMATCH','IDENTITY_CHANGED') LIMIT 1").all(s.accepted.id) as { detail: string }[];
    expect(plan.some(row => row.detail.includes("USING INDEX deletion_contradictory_result"))).toBe(true);
    s.restart(); expect(s.db.pragma("user_version", { simple: true })).toBe(8);
    expect(tables.map(table => s.db.prepare(`SELECT * FROM ${table}`).all())).toEqual(before);
  });
  it.each(["cross-case", "duplicate-result"] as const)("rejects independently signed %s causal facts", async fault => {
    const s = setup(), first = s.accept().value, second = s.accept().value; await s.journal.refresh("startup");
    const row = await s.repository.withCaseLock(first.id, async value => value);
    await s.journal.append(["tj-journal-event-v1", "a".repeat(32), instant, "attempt_intent", [first.id, "b".repeat(32), "initial", row.lifecycle.initialAuthority!, "1", scope[0], "deletion-key", "c".repeat(64)]]);
    if (fault === "cross-case") {
      await expect(s.journal.append(["tj-journal-event-v1", "d".repeat(32), instant, "copy_mutation_started", [second.id, "a".repeat(32), "1", "e".repeat(64)]])).rejects.toThrow();
    } else {
      await s.journal.append(["tj-journal-event-v1", "d".repeat(32), instant, "copy_mutation_started", [first.id, "a".repeat(32), "1", "e".repeat(64)]]);
      await s.journal.append(["tj-journal-event-v1", "f".repeat(32), instant, "copy_result", [first.id, "d".repeat(32), "deleted", null]]);
      await expect(s.journal.append(["tj-journal-event-v1", "9".repeat(32), instant, "copy_result", [first.id, "d".repeat(32), "not-found", null]])).rejects.toThrow();
    }
    expect(s.journal.caseAuthority(first.id)).toBeNull();
  });
  it("migrates schema6 acceptance to null once and never backfills it on replay", () => {
    const s = setup(), accepted = s.accept();
    removeTask10Schema(s.db); s.db.pragma("user_version=6"); s.restart();
    expect(s.db.pragma("user_version", { simple: true })).toBe(8);
    expect(s.db.prepare("SELECT acceptanceEpochId FROM cases WHERE id=?").get(accepted.value.id)).toEqual({ acceptanceEpochId: null });
    s.setAdmission(null); expect(s.repository.commitIntake(accepted.input).replayed).toBe(true); s.restart();
    expect(s.db.prepare("SELECT acceptanceEpochId FROM cases WHERE id=?").get(accepted.value.id)).toEqual({ acceptanceEpochId: null });
  });
  it("rolls acceptance epoch, lifecycle authority, delivery and audit back together on actual SQL failure", () => {
    const s = setup(); s.db.exec("CREATE TRIGGER synthetic_acceptance_fault BEFORE INSERT ON audit WHEN NEW.event='accepted' BEGIN SELECT RAISE(ABORT,'synthetic fault'); END;");
    expect(() => s.accept()).toThrow("synthetic fault");
    for (const table of ["cases", "case_lifecycle", "deliveries", "audit"]) expect(s.db.prepare(`SELECT count(*) n FROM ${table}`).get()).toEqual({ n: 0 });
  });
  it.each([
    [scope[0], "application", null, "2026-10-10T12:00:00.001Z", null],
    [scope[0], "application", null, "2026-01-01T00:00:00.000Z", instant],
    [scope[0], "synthetic", "pilot-1", "2026-01-01T00:00:00.000Z", null],
  ] as const)("blocks original acceptance outside the exact approved interval or submission kind %j", (...input) => {
    const s = setup(); s.setAdmission(input as AdmissionScope); expect(() => s.accept()).toThrow("ADMISSION_SCOPE_UNAVAILABLE");
  });
  it("enumerates at most20 using durable continuation and does not silently drop unvisited due rows", () => {
    const s = setup(), ids: string[] = [];
    // Minimal synthetic candidate rows are intentionally not deletion authority;
    // this tests the bounded indexed selector independently of actual mutations.
    for (let i = 0; i < 25; i++) {
      if (i) { s.db.prepare("UPDATE cases SET deliveryState='delivered'").run(); s.db.prepare("DELETE FROM artifact_reservations").run(); }
      const accepted = s.accept(); ids.push(accepted.value.id);
      s.db.prepare("UPDATE cases SET caseState='rejected_closed',closedOn='2026-10-10' WHERE id=?").run(accepted.value.id);
      s.db.prepare("UPDATE case_lifecycle SET authorityKind=NULL,authorityId=NULL,deadline='2027-04-10',deleteFrom='2027-04-11' WHERE caseId=?").run(accepted.value.id);
    }
    s.advance(Date.parse("2027-04-11T12:00:00.000Z") - s.time);
    const owner = deletionOwner(s.repository), first = owner.listWork(); s.restart(); const second = deletionOwner(s.repository).listWork();
    expect(first.ids).toHaveLength(20); expect(first.hasMore).toBe(true); expect(second.ids).toHaveLength(5);
    expect(new Set([...first.ids, ...second.ids])).toEqual(new Set(ids)); expect(first.ids).toEqual([...first.ids].sort());
  });
  it("blocks a signed orphan mailbox phase rather than treating it as independent authority", async () => {
    const s = setup(); await s.journal.refresh("startup");
    const orphan: JournalEvent = ["tj-journal-event-v1", "c".repeat(32), instant, "copy_mutation_started", [caseId, "d".repeat(32), "1", "e".repeat(64)]];
    s.fixture.commit(orphan); await expect(s.journal.refresh("refresh")).rejects.toThrow(); expect(s.journal.caseAuthority(caseId)).toBeNull();
  });
  it("keeps the original1000-entry bound with real projection and only exposes the fully applied head", async () => {
    const s = setup();
    for (let i = 0; i < 1000; i++) s.fixture.commit(["tj-journal-event-v1", i.toString(16).padStart(32, "0"), instant, "barrier", ["1".repeat(64), "0".repeat(64), "refresh"]]);
    expect((await s.journal.refresh("startup")).kind).toBe("continuation"); expect(s.journal.caseAuthority(caseId)).toBeNull();
    expect(s.db.prepare("SELECT sequence FROM journal_projection").get()).toEqual({ sequence: "1000" });
    expect((await s.journal.continueReplay()).kind).toBe("observed"); expect(s.journal.caseAuthority(caseId)?.head.sequence).toBe("1001");
  });
  it("rejects a non-genesis coverage anchor instead of inferring current-case authority", async () => {
    const s = setup(); await s.journal.refresh("startup");
    Object.assign(s.fixture.context, { anchor: { cursor: s.journal.observation()!.cursor, receipt: s.fixture.receipts[0] } });
    s.restart(); await expect(s.journal.refresh("startup")).rejects.toThrow(); expect(s.journal.caseAuthority(caseId)).toBeNull();
  });
  it("applies another guarded case's fence without waiting for that case guard", async () => {
    const s = setup(), first = s.accept().value, second = s.accept().value; await s.journal.refresh("startup");
    let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), seen = new Promise<void>(resolve => { entered = resolve; });
    const locked = s.repository.withCaseLock(second.id, async row => {
      s.fixture.commit(["tj-journal-event-v1", "d".repeat(32), instant, "case_fence", [row.id, "initial", row.lifecycle.initialAuthority!, String(row.version), "reject"]]); entered(); await gate;
    }); await seen;
    try { await s.repository.withCaseLock(first.id, async () => { await s.journal.refresh("refresh"); expect(s.journal.caseAuthority(second.id)?.latestFence?.eventId).toBe("d".repeat(32)); }); }
    finally { release(); await locked; }
  });
  it("does not publish current authority after projection SQL fault and recovers the same target prefix", async () => {
    const s = setup(); await s.journal.refresh("startup");
    s.db.exec("CREATE TRIGGER synthetic_projection_fault BEFORE INSERT ON journal_facts WHEN NEW.kind='case_fence' BEGIN SELECT RAISE(ABORT,'synthetic fault'); END;");
    await expect(s.journal.append(fence())).rejects.toThrow(); expect(s.journal.caseAuthority(caseId)).toBeNull();
    s.db.exec("DROP TRIGGER synthetic_projection_fault");
    expect((await s.journal.recover(fence())).kind).toBe("observed"); expect(s.journal.caseAuthority(caseId)?.latestFence?.eventId).toBe(fence()[1]);
  });
  it.each(["missing", "wrong"] as const)("rejects %s projected fence facts even when the restored applied-head row still matches", async fault => {
    const s = setup(); await s.journal.refresh("startup"); await s.journal.append(fence());
    if (fault === "missing") s.db.prepare("DELETE FROM journal_fences").run();
    else s.db.prepare("UPDATE journal_fences SET eventId=?").run("f".repeat(32));
    expect(s.journal.caseAuthority(caseId)).toBeNull();
  });
  it("constructs one projected facade and proves no fence only through its current applied head", async () => {
    const s = setup(); expect(s.calls).toBe(1);
    expect(s.journal.caseAuthority(caseId)).toBeNull();
    await s.journal.refresh("startup");
    expect(s.journal.caseAuthority(caseId)?.latestFence).toBeNull();
    expect(s.journal.observation()).toMatchObject(s.journal.caseAuthority(caseId)!.head);
    const event = fence(); s.fixture.commit(event);
    await s.journal.refresh("refresh");
    expect(s.journal.caseAuthority(caseId)?.latestFence?.eventId).toBe(event[1]);
    s.advance(60000); expect(s.journal.caseAuthority(caseId)).toBeNull();
  });
  it("does not reuse a restored higher applied head as authority on cold start", async () => {
    const s = setup(); await s.journal.refresh("startup"); await s.journal.append(fence());
    s.restart(); expect(s.journal.caseAuthority(caseId)).toBeNull();
    await s.journal.refresh("startup"); expect(s.journal.caseAuthority(caseId)?.latestFence?.eventId).toBe("a".repeat(32));
    expect(s.fixture.calls.filter(c => c.method === "readSince").at(-1)?.value).toBe(s.fixture.context.anchor.cursor);
  });
  it("rejects orphan and conflicting independently signed fence ancestry", async () => {
    const s = setup(); await s.journal.refresh("startup"); await s.journal.append(fence());
    const wrong: JournalEvent = ["tj-journal-event-v1", "c".repeat(32), instant, "case_fence", [caseId, "fence", "f".repeat(32), "2", "reopen"]];
    s.fixture.commit(wrong);
    await expect(s.journal.refresh("refresh")).rejects.toThrow(); expect(s.journal.caseAuthority(caseId)).toBeNull();
  });
  it("atomically assigns server-owned acceptance provenance and preserves it on replay", () => {
    const s = setup(), accepted = s.accept();
    expect(s.db.prepare("SELECT acceptanceEpochId FROM cases WHERE id=?").get(accepted.value.id)).toEqual({ acceptanceEpochId: scope[0] });
    s.setAdmission(null); s.advance(1000);
    expect(s.repository.commitIntake({ ...accepted.input, now: utcInstant("2026-01-01T00:00:00.000Z") })).toMatchObject({ id: accepted.value.id, replayed: true, acceptedAt: instant });
    expect(() => s.db.prepare("UPDATE cases SET acceptanceEpochId=NULL WHERE id=?").run(accepted.value.id)).toThrow("IMMUTABLE_ACCEPTANCE_EPOCH");
  });
  it("rejects original acceptance without a valid matching current admission scope", () => {
    const s = setup(); s.setAdmission(null); expect(() => s.accept()).toThrow("ADMISSION_SCOPE_UNAVAILABLE");
    expect(s.db.prepare("SELECT count(*) n FROM cases").get()).toEqual({ n: 0 });
    expect(s.db.prepare("SELECT count(*) n FROM case_lifecycle").get()).toEqual({ n: 0 });
  });
});
