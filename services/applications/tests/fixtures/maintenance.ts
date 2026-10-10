import { mkdtemp, mkdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lstatSync } from "node:fs";
import { openReadyTestRepository } from "./admission";
import { createCustodyLedger } from "../../src/custody";
import { testIngressAuthority } from "./ingress-authority";
import type { WorkerOwner, WorkerLifecycleOptions, RegisteredMail, MailboxPort, CaseAction } from "../../src/types";
import { dateOnly, digest, utcInstant } from "../../src/types";
import { generateKeyPairSync, createSecretKey } from "node:crypto";
import { Readable } from "node:stream";
import { Secret, TOTP } from "otpauth";
import { fingerprintMime, MIME_LIMITS } from "../../src/mail-manifest";
import { runDeletionOnce } from "../../src/deletion";
import { encodePayload, payloadDigest, sealIncoming } from "../../src/crypto";
import { testAdmission, testReadiness, testAdmissionScope, refreshTestRepository } from "./admission";
import { syntheticJournal } from "./ledger";
import { createSafetyJournal } from "../../src/ledger";

export function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

// Actual local exclusion model for these synthetic owners only. Not OS evidence.
export async function maintenanceFixture(startup: "ordinary" | "cold-maintenance" = "ordinary", sanitation = false) {
  const root = await mkdtemp(join(await realpath(tmpdir()), "maintenance-synthetic-"));
  // This test owns the private directory before SQLite opens and keeps all
  // synthetic actors in-process until close. NOT Linux/native qualification.
  const originalRoot = lstatSync(root);
  let pathExclusion = true;
  let time = Date.parse("2026-10-10T12:00:00.000Z"), monotonic = 0;
  const clock = { now: () => new Date(time) };
  const journalFixture = syntheticJournal();
  const deletionScope = () => ({ ledgerId: journalFixture.context.ledgerId, historyEpoch: journalFixture.context.historyEpoch, associationKeyId: "fixture-erasure", associationKey: Buffer.alloc(32, 17), approvedScopes: [testAdmissionScope] });
  const open = (mode: "ordinary" | "cold-maintenance") => openReadyTestRepository(join(root, "registry.sqlite"), clock, { startup: mode,
    deletionScope: { currentScope: deletionScope },
    journalFactory: projection => createSafetyJournal({ port: { append: event => journalFixture.port.append(event), readSince: cursor => journalFixture.port.readSince(cursor) }, trust: { currentContext: () => journalFixture.context }, clock: { wallNow: () => clock.now(), monotonicNow: () => monotonic }, projection }),
  });
  const repository = await open(startup);
  const config = { intakeRoot: join(root, "incoming"), custodyRoot: join(root, "custody"), runtimeRoot: join(root, "runtime"), intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock };
  await Promise.all([config.intakeRoot, config.custodyRoot, config.runtimeRoot].map(path => mkdir(path, { mode: 0o700 })));
  const authority = testIngressAuthority(config.intakeRoot);
  const custody = createCustodyLedger(repository, { ...config, ingressAuthority: authority });
  if (startup === "ordinary") await custody.reconcile();
  const owner: WorkerOwner = Object.freeze({ repository, custody, clock });
  let handle = Object.freeze({});
  let held = false, settles = 0;
  const services: NonNullable<WorkerLifecycleOptions["services"]> = {
    async holdMaintenance(candidate) { if (candidate !== owner || held) throw new Error("SYNTHETIC_HOLD_INVALID"); held = true; handle = Object.freeze({}); return handle; },
    assertMaintenanceHeld(candidate, value) { if (candidate !== owner || value !== handle || !held) throw new Error("SYNTHETIC_HOLD_LOST"); },
    async releaseMaintenance(candidate, value) { this.assertMaintenanceHeld!(candidate, value); held = false; },
    assertOrdinaryReady(candidate) { if (candidate !== owner || held || !pathExclusion) throw new Error("SYNTHETIC_ORDINARY_INVALID"); },
    async settle() { settles++; }, async close() {},
  };
  if (sanitation) services.assertDatabaseSanitationBaseline = function(candidate, value, target) {
    this.assertMaintenanceHeld!(candidate, value);
    const parent = lstatSync(root), file = lstatSync(join(root,"registry.sqlite"));
    if (!pathExclusion || parent.dev !== originalRoot.dev || parent.ino !== originalRoot.ino || !Object.isFrozen(target) || target.canonicalPath !== join(root,"registry.sqlite") || target.device !== file.dev || target.inode !== file.ino) throw new Error("SYNTHETIC_BASELINE_LOST");
  };
  async function accept() {
    const keys = { ...generateKeyPairSync("rsa", { modulusLength: 2048 }), intakeRoot: config.intakeRoot, privateRoot: config.custodyRoot, runtimeRoot: config.runtimeRoot, custody };
    const payload = { version: 1 as const, input: { name: "Synthetic only", email: "synthetic@example.invalid", job: "sales-fulltime" as const }, files: [] };
    const now = utcInstant(clock.now().toISOString());
    const reservation = await custody.reserve({ ...testAdmission(), sessionHash: digest("a".repeat(64)), idempotencyKey: "custody-lifetime", reservedBytes: 20000, now }, testReadiness);
    const file = await sealIncoming((async function* () { yield encodePayload(payload); })(), { root: config.intakeRoot, maxBytes: 10000, reservationId: reservation.id }, keys.publicKey);
    const accepted = await custody.commitIntake({ reservationId: reservation.id, digest: payloadDigest(payload), encryptedPayloadPath: file.path, actualBytes: file.bytes, encryptedName: "synthetic", job: "sales-fulltime", now });
    return { keys, accepted, record: repository.getCommittedIntake(accepted.id)! };
  }
  async function qualifySyntheticFinalScope(value: Awaited<ReturnType<typeof accept>>) {
    const advance = (ms: number) => { time += ms; monotonic += ms; }, now = utcInstant(clock.now().toISOString());
    const claim = repository.claimNext("synthetic-final", now)!;
    if (!claim || claim.id !== value.accepted.id) throw new Error("SYNTHETIC_FINAL_CLAIM");
    const identity = await repository.stageDeliveryIdentity({ id: claim.id, version: claim.version, token: claim.claimToken }, "fixture-mime", now);
    const raw = Buffer.from(`From: info@trinkgut-jammers.de\r\nTo: info@trinkgut-jammers.de\r\nReply-To: synthetic@example.invalid\r\nSubject: Synthetic\r\nDate: Sat, 10 Oct 2026 12:00:00 +0000\r\nMessage-ID: ${identity.delivery.identity!.messageId}\r\nX-TJ-Application-ID: ${claim.id}\r\nX-TJ-Profile: tj-mail-1\r\nX-TJ-Key-ID: fixture-mime\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\nSGVsbG8=\r\n`);
    const fingerprint = await fingerprintMime(Readable.from([raw]), MIME_LIMITS);
    const mail: RegisteredMail = { id: claim.id, messageId: identity.delivery.identity!.messageId, keyId: "fixture-mime", profile: "tj-mail-1", fingerprint: fingerprint.fingerprint, shape: fingerprint.shape };
    const registered = await repository.stageRegisteredMail({ id: claim.id, version: identity.case.version, token: claim.claimToken }, mail, now);
    await repository.releaseDeliveryClaim({ id: claim.id, version: registered.case.version, token: claim.claimToken }, now);
    const auth = repository.createAuthentication({ keys: value.keys, rateKey: Buffer.alloc(32, 8), trust: { currentEpoch: () => digest("9".repeat(64)) }, initialEnrollmentEpoch: () => digest("9".repeat(64)) });
    const password = "Synthetic final fixture password", enrollment = await auth.beginEnrollment(password, password);
    const otp = () => TOTP.generate({ secret: Secret.fromBase32(new URL(enrollment.provisioningUri).searchParams.get("secret")!), algorithm: "SHA1", digits: 6, period: 30, timestamp: time });
    auth.finishEnrollment(enrollment.handle, otp());
    for (const action of [{ kind: "reject", closedOn: dateOnly("2026-10-10") }, { kind: "confirm-external-copies", confirmed: true, reason: "Synthetic copies checked" }] as const satisfies readonly CaseAction[]) {
      advance(30000); const login = await auth.authenticate({ username: "niko", password, otp: otp(), trustedIp: "127.0.0.1" });
      if (login.kind !== "authenticated") throw new Error("SYNTHETIC_FINAL_LOGIN");
      advance(30000); const row = repository.getLifecycleCase(claim.id, login.session);
      const proof = await auth.authorizeSensitiveAction(login.session, { password, otp: otp(), trustedIp: "127.0.0.1" }, { kind: action.kind, caseId: claim.id, version: row.version });
      await refreshTestRepository(repository);
      await repository.applyCaseAction(claim.id, action, proof, login.session);
    }
    advance(Date.parse("2027-04-11T12:00:00.000Z") - time);
    await refreshTestRepository(repository);
    const mailbox: MailboxPort = { async findVerified() { return { copies: [], complete: true, issues: [] }; }, async deleteVerified() { throw new Error("NO_SYNTHETIC_COPY"); }, async disconnect() {}, async settle() {} };
    const result = await runDeletionOnce({ repository, clock: { wallNow: clock.now, monotonicNow: () => monotonic }, scope: { currentScope: deletionScope }, verificationKeys: () => new Map([["fixture-mime", createSecretKey(Buffer.alloc(32, 7))]]), createMailbox: () => mailbox });
    if (result.cases[0]?.status !== "mailbox_cleared") throw new Error("SYNTHETIC_FINAL_CLEAR");
  }
  return { root, owner, config, authority, services, journalFixture, accept, qualifySyntheticFinalScope, losePathExclusion() { pathExclusion = false; }, monotonicNow: () => monotonic, get settles() { return settles; }, loseHold() { held = false; }, advance(ms: number) { monotonic += ms; time += ms; },
    async restart(mode: "ordinary" | "cold-maintenance" = "cold-maintenance") {
      repository.close();
      const nextRepository = await open(mode), nextCustody = createCustodyLedger(nextRepository, { ...config, ingressAuthority: authority });
      const nextOwner: WorkerOwner = Object.freeze({ repository: nextRepository, custody: nextCustody, clock }), nextHandle = Object.freeze({}); let nextHeld = false;
      const nextServices = { ...services,
        async holdMaintenance(candidate: WorkerOwner) { if (candidate !== nextOwner || nextHeld) throw new Error("SYNTHETIC_HOLD_INVALID"); nextHeld = true; return nextHandle; },
        assertMaintenanceHeld(candidate: WorkerOwner, value: object) { if (candidate !== nextOwner || value !== nextHandle || !nextHeld) throw new Error("SYNTHETIC_HOLD_LOST"); },
        async releaseMaintenance(candidate: WorkerOwner, value: object) { this.assertMaintenanceHeld(candidate,value); nextHeld = false; },
        assertOrdinaryReady(candidate: WorkerOwner) { if (candidate !== nextOwner || nextHeld || !pathExclusion) throw new Error("SYNTHETIC_ORDINARY_INVALID"); },
      };
      return { owner: nextOwner, services: nextServices };
    },
    async close() { repository.close(); await rm(root, { recursive: true, force: true }); } };
}
