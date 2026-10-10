import { afterEach, expect, it } from "vitest";
import { createHash, createPrivateKey, createPublicKey, createSecretKey, generateKeyPairSync } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { request as httpRequest } from "node:http";
import { join } from "node:path";
import sharp from "sharp";
import { runDispatchOnce } from "../src/dispatch";
import { createArtifactStore } from "../src/artifact-store";
import { createCustodyLedger } from "../src/custody";
import { openTestRepository as openRepository } from "./fixtures/admission";
import { openContact } from "../src/contact-crypto";
import { verifyMail, fingerprintMime, MIME_LIMITS } from "../src/mail-manifest";
import { utcInstant, type Acceptance, type ArtifactRecord, type DispatchDependencies, type MailboxSearch, type RegisteredMail } from "../src/types";
import { makeArtifactHarness } from "./fixtures/artifacts";
import { testIngressAuthority } from "./fixtures/ingress-authority";
import { testReadiness } from "./fixtures/admission";
import { createWorkerRpc, createWorkerRpcClient } from "../src/worker-rpc";
import { createIntakeServer } from "../src/intake-http";
import type { IntakeConfig } from "../src/config";
import { inspectMimeStructure } from "../src/mime-structure";

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });
const stream = (bytes: Buffer) => (async function* () { yield bytes; })();
const collect = async (raw: AsyncIterable<Uint8Array>) => { const chunks = []; for await (const bytes of raw) chunks.push(Buffer.from(bytes)); return Buffer.concat(chunks); };

type StorageHarness = Pick<Awaited<ReturnType<typeof makeArtifactHarness>>, "root" | "repo" | "keys" | "accepted" | "config">;
async function harness(withFile = false, resumed?: StorageHarness) {
  const input = await sharp({ create: { width: 1, height: 1, channels: 3, background: { r: 200, g: 30, b: 40 } } }).png().toBuffer();
  const h = resumed ?? await makeArtifactHarness(withFile ? [{ name: "original.png", mediaType: "image/png", content: input.toString("base64") }] : []);
  let repo = h.repo, clockValue = h.accepted.acceptedAt;
  const clock = { now: () => new Date(clockValue) };
  h.config.clock = clock;
  let custody = h.keys.custody;
  const key = createSecretKey(Buffer.alloc(32, 7));
  const sent: Buffer[] = [], scans: string[] = [], budgets: unknown[] = [];
  let rasterCalls = 0, closed = 0, factories = 0, searches = 0;
  let smtpBehavior: (raw: AsyncIterable<Uint8Array>) => Promise<import("../src/types").SmtpResult> = async raw => {
    sent.push(await collect(raw)); return { accepted: ["info@trinkgut-jammers.de"], rejected: [], response: "250 accepted" };
  };
  let mailboxBehavior: (mail: RegisteredMail) => Promise<MailboxSearch> = async () => ({ complete: true, copies: [], issues: [] });
  const deps: DispatchDependencies = {
    repository: repo, clock, owner: "dispatch-fixture", keys: h.keys, custody,
    artifacts: createArtifactStore(repo, h.keys, custody), signingKeyId: "key-1", signingKeys: new Map([["key-1", key]]), verificationKeys: new Map([["key-1", key]]),
    reconstruction: {
      scope: custody, monotonicNow: () => 0,
      scanner: { assurance: "qualified-local-engine", scan: async file => { scans.push(file.digest); return { kind: "clean", complete: true, digest: file.digest, bytes: file.bytes, signatureTime: utcInstant(new Date().toISOString()), engineIdentity: "synthetic-not-clamav" }; } },
      inspector: { assurance: "local-test", inspect: async () => ({ kind: "inspected", inspection: { format: "png", pageCount: 1 } }) },
      raster: { render: async (_file, emit) => { rasterCalls++; await emit({ index: 0, width: 1, height: 1, channels: 3, pixels: new Uint8Array([9, 8, 7]) }); return { format: "png", pageCount: 1 }; } },
      output: { verify: async file => { await sharp(await readFile(file.path)).raw().toBuffer(); } },
    },
    createSmtp: () => { factories++; return { connect: async () => {}, login: async () => {}, send: async (envelope, raw) => { expect(envelope).toEqual({ from: "info@trinkgut-jammers.de", to: ["info@trinkgut-jammers.de"] }); expect(repo.getDelivery(h.accepted.id).attempts.at(-1)?.outcome).toBeNull(); return smtpBehavior(raw); }, close: () => { closed++; } }; },
    createMailbox: budget => { budgets.push(budget); return { findVerified: async mail => { searches++; return mailboxBehavior(mail); }, disconnect: async () => {} }; },
  };
  cleanups.push(async () => { repo.close(); await rm(h.root, { recursive: true, force: true }); });
  return {
    h, deps, sent, scans, budgets, input,
    counts: () => ({ rasterCalls, closed, factories, searches }),
    now: (value: string) => { clockValue = utcInstant(value); },
    smtp: (behavior: typeof smtpBehavior) => { smtpBehavior = behavior; },
    mailbox: (behavior: typeof mailboxBehavior) => { mailboxBehavior = behavior; },
    row: () => repo.withCaseLock(h.accepted.id, async row => row),
    delivery: () => repo.getDelivery(h.accepted.id),
    restart: async () => {
      repo.close(); repo = openRepository(join(h.root, "registry.sqlite"), clock);
      custody = createCustodyLedger(repo, h.config); await custody.reconcile(); h.keys.custody = custody;
      Object.assign(deps, { repository: repo, custody, artifacts: createArtifactStore(repo, h.keys, custody), reconstruction: { ...deps.reconstruction, scope: custody } });
    },
  };
}

it("prepares authenticated cleaned artifacts and contact before sending exact stored bytes, then confirms only a verified receipt", async () => {
  const f = await harness(true);
  expect(await runDispatchOnce(f.deps)).toMatchObject({ kind: "processed", work: "prepare", state: "ready" });
  expect(f.counts().rasterCalls).toBe(1); expect(f.scans).toHaveLength(2); expect(f.scans[0]).not.toBe(f.scans[1]);
  expect(f.deps.repository.getCommittedIntake(f.h.accepted.id)).toBeNull();
  expect(openContact(f.delivery().contactEnvelope!, { caseId: f.h.accepted.id, acceptedAt: f.h.accepted.acceptedAt, version: 1 }, f.h.keys.privateKey)).toBe("synthetic@example.invalid");
  const raw = await f.deps.artifacts.withMime(f.h.accepted.id, collect);
  const registered = f.delivery().registered!;
  expect(await verifyMail(stream(raw), registered, f.deps.verificationKeys)).toEqual({ kind: "verified" });
  expect((await fingerprintMime(stream(raw), MIME_LIMITS)).attachments[0]).toMatchObject({ name: "document-1.png", digest: f.scans[1] });
  expect(await runDispatchOnce(f.deps)).toMatchObject({ work: "send", state: "smtp_accepted" });
  expect(f.sent).toEqual([raw]); expect(f.counts()).toMatchObject({ closed: 1, factories: 1 });
  f.mailbox(async mail => ({ complete: (await verifyMail(stream(f.sent[0]), mail, f.deps.verificationKeys)).kind === "verified", copies: [{ mailbox: "INBOX", uidValidity: "1", uid: 42, fingerprint: mail.fingerprint }], issues: [] }));
  expect(await runDispatchOnce(f.deps)).toMatchObject({ work: "reconcile", state: "delivered" });
  expect((await f.row()).payloadDeleteAfter).toBe("2026-10-10T10:00:00.000Z");
  expect(f.delivery().cleanupDueAt).toBe("2026-10-10T09:00:00.000Z");
  expect(await runDispatchOnce(f.deps)).toEqual({ kind: "idle" });
});

it("persists failure-relative 5/30-minute retries across restart, with identical raw and at most three sends", async () => {
  const f = await harness(); await runDispatchOnce(f.deps);
  f.smtp(async raw => { f.sent.push(await collect(raw)); throw { command: "DATA", responseCode: 451, response: "451 temporary" }; });
  await runDispatchOnce(f.deps);
  expect(f.delivery().sendDueAt).toBe("2026-10-09T10:05:00.000Z");
  await f.restart(); f.now("2026-10-09T10:04:59.999Z"); expect(await runDispatchOnce(f.deps)).toEqual({ kind: "idle" });
  f.now("2026-10-09T10:08:00.000Z"); await runDispatchOnce(f.deps);
  expect(f.delivery().sendDueAt).toBe("2026-10-09T10:38:00.000Z");
  await f.restart(); f.now("2026-10-09T10:37:59.999Z"); expect(await runDispatchOnce(f.deps)).toEqual({ kind: "idle" });
  f.now("2026-10-09T10:38:00.000Z"); expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "needs_attention", reason: "ATTEMPTS_EXHAUSTED" });
  expect(f.sent).toHaveLength(3); expect(new Set(f.sent.map(raw => createHash("sha256").update(raw).digest("hex"))).size).toBe(1);
  expect(f.counts()).toMatchObject({ closed: 3, factories: 3 });
  await f.restart(); expect(await runDispatchOnce(f.deps)).toEqual({ kind: "idle" });
});

it("never resends generic post-send errors and consumes finite receipt slots without catch-up bursts", async () => {
  const f = await harness(); await runDispatchOnce(f.deps);
  f.smtp(async raw => { f.sent.push(await collect(raw)); throw new Error("provider private error"); });
  expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "uncertain" });
  await f.restart(); await runDispatchOnce(f.deps); expect(f.delivery().mailboxChecks).toBe(1);
  expect(await runDispatchOnce(f.deps)).toEqual({ kind: "idle" });
  f.now("2026-10-09T11:00:00.000Z"); expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "uncertain", incidentDue: true });
  expect(f.delivery().mailboxChecks).toBe(2); expect(f.delivery().receiptCursor).toBe(4);
  f.now("2026-10-10T10:00:00.000Z"); expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "needs_attention", reason: "RECEIPT_UNRESOLVED", manualRequired: true });
  expect(f.sent).toHaveLength(1); expect(f.budgets).toHaveLength(3); expect(new Set(f.budgets).size).toBe(3);
  await f.restart(); expect(await runDispatchOnce(f.deps)).toEqual({ kind: "idle" });
});

it("consumes a persisted receipt slot even when mailbox construction fails", async () => {
  const f = await harness(); await runDispatchOnce(f.deps); await runDispatchOnce(f.deps);
  const deps = { ...f.deps, createMailbox: () => { throw new Error("private constructor details"); } };
  expect(await runDispatchOnce(deps)).toMatchObject({ state: "smtp_accepted", nextDueAt: "2026-10-09T10:05:00.000Z" });
  expect(f.delivery().mailboxChecks).toBe(1); expect(f.sent).toHaveLength(1);
});

it.each([
  { boundary: "24-hour send", time: "2026-10-10T10:00:00.000Z", reason: "MANUAL_REQUIRED" },
  { boundary: "effective payload/artifact", time: "2026-10-16T10:00:00.000Z", reason: "PROCESSING_EXPIRED" },
])("does not reopen MIME when the $boundary deadline passes after verification", async ({ time, reason }) => {
  const f = await harness(); await runDispatchOnce(f.deps);
  expect((await f.row()).payloadDeleteAfter).toBe("2026-10-16T10:00:00.000Z");
  expect(f.deps.repository.getArtifact(f.h.accepted.id, "mime")?.expiresAt).toBe("2026-10-16T10:00:00.000Z");
  const original = f.deps.artifacts.withMime;
  let opens = 0;
  f.deps.artifacts.withMime = (id, action) => {
    opens++;
    return original(id, async raw => { const result = await action(raw); f.now(time); return result; });
  };
  expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "needs_attention", reason });
  expect(opens).toBe(1);
  expect(f.delivery().attempts).toHaveLength(0); expect(f.sent).toHaveLength(0);
});

it.each(["missing", "wrong"])("refuses %s verification keys before any send", async mode => {
  const f = await harness(); await runDispatchOnce(f.deps);
  const verificationKeys = mode === "missing" ? new Map() : new Map([["key-1", createSecretKey(Buffer.alloc(32, 9))]]);
  expect(await runDispatchOnce({ ...f.deps, verificationKeys })).toMatchObject({ state: "needs_attention", reason: "VERIFICATION_FAILED" });
  expect(f.sent).toHaveLength(0); expect(f.delivery().attempts).toHaveLength(0);
});

it("does not switch an established signing identity when its key disappears", async () => {
  const f = await harness();
  const claim = f.deps.repository.claimDispatchWork("staging", utcInstant(f.deps.clock.now().toISOString()))!;
  await f.deps.repository.stageDeliveryIdentity({ id: claim.case.id, version: claim.case.version, token: claim.case.claimToken }, "old-key", claim.case.acceptedAt);
  await f.restart();
  expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "needs_attention", reason: "DEPENDENCY_UNAVAILABLE" });
  expect(f.delivery().identity?.keyId).toBe("old-key"); expect(f.sent).toHaveLength(0);
});

it.each(["missing", "corrupt"])("never regenerates %s adopted MIME", async mode => {
  const f = await harness(true); await runDispatchOnce(f.deps);
  const artifact = f.deps.repository.getArtifact(f.h.accepted.id, "mime")!;
  if (mode === "missing") await rm(artifact.path); else { const bytes = await readFile(artifact.path); bytes[bytes.length - 1] ^= 1; await writeFile(artifact.path, bytes); }
  expect(await runDispatchOnce(f.deps)).toEqual({ kind: "idle" });
  expect((await f.row()).deliveryState).toBe("needs_attention"); expect(f.delivery().reason).toBe("ARTIFACT_UNAVAILABLE");
  expect(f.counts().rasterCalls).toBe(1); expect(f.sent).toHaveLength(0);
});

it("captures email before an infected-source determination and shortens invalid retention", async () => {
  const f = await harness(true);
  f.deps.reconstruction.scanner.scan = async file => ({ kind: "infected", complete: true, digest: file.digest, bytes: file.bytes, signatureTime: utcInstant(new Date().toISOString()), engineIdentity: "synthetic" });
  expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "needs_attention", reason: "MALICIOUS_INPUT" });
  expect(f.delivery().contactEnvelope).not.toBeNull(); expect(f.counts().rasterCalls).toBe(0);
  expect((await f.row()).payloadDeleteAfter).toBe("2026-10-10T10:00:00.000Z");
  expect((await f.row()).contactDeleteAfter).toBe("2026-10-10T10:00:00.000Z");
});

it.each(["mismatched", "unknown"])("shortens retention for authenticated %s source identity without sending", async kind => {
  const bytes = kind === "mismatched"
    ? await sharp({ create: { width: 1, height: 1, channels: 3, background: "red" } }).png().toBuffer()
    : Buffer.from("not an allowed document format");
  const storage = await makeArtifactHarness([{ name: "claimed.jpg", mediaType: "image/jpeg", content: bytes.toString("base64") }]);
  const f = await harness(false, storage);
  expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "needs_attention", reason: "INVALID_INPUT" });
  expect(f.delivery()).toMatchObject({ category: "invalid", cleanupDueAt: "2026-10-10T09:00:00.000Z" });
  expect((await f.row()).payloadDeleteAfter).toBe("2026-10-10T10:00:00.000Z");
  expect((await f.row()).contactDeleteAfter).toBe("2026-10-10T10:00:00.000Z");
  expect(openContact(f.delivery().contactEnvelope!, { caseId: storage.accepted.id, acceptedAt: storage.accepted.acceptedAt, version: 1 }, storage.keys.privateKey)).toBe("synthetic@example.invalid");
  expect(f.scans).toHaveLength(1); expect(f.counts().rasterCalls).toBe(0);
  expect(f.delivery().attempts).toHaveLength(0); expect(f.sent).toHaveLength(0);
});

it("keeps a processing-file digest integrity failure operational rather than invalid input", async () => {
  const f = await harness(true), scan = f.deps.reconstruction.scanner.scan;
  f.deps.reconstruction.scanner.scan = async (file, signal) => {
    const result = await scan(file, signal), bytes = await readFile(file.path);
    bytes[bytes.length - 1] ^= 1; await writeFile(file.path, bytes); return result;
  };
  expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "needs_attention", reason: "DEPENDENCY_UNAVAILABLE" });
  expect(f.delivery()).toMatchObject({ category: "operational", cleanupDueAt: null });
  expect((await f.row()).payloadDeleteAfter).toBe("2026-10-16T10:00:00.000Z");
  expect((await f.row()).contactDeleteAfter).toBe("2026-11-08T10:00:00.000Z");
  expect(f.delivery().contactEnvelope).not.toBeNull(); expect(f.sent).toHaveLength(0);
});

it("fails closed before scanning when original ciphertext is altered", async () => {
  const f = await harness(true), original = f.deps.repository.getCommittedIntake(f.h.accepted.id)!;
  const bytes = await readFile(original.encryptedPayloadPath); bytes[bytes.length - 1] ^= 1; await writeFile(original.encryptedPayloadPath, bytes);
  expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "needs_attention", reason: "CONTACT_UNAVAILABLE" });
  expect(f.counts().rasterCalls).toBe(0); expect(f.delivery().contactEnvelope).toBeNull(); expect(f.sent).toHaveLength(0);
});

it("makes a transport-factory failure after durable intent mailbox-only without guessing definite failure", async () => {
  const f = await harness(); await runDispatchOnce(f.deps);
  expect(await runDispatchOnce({ ...f.deps, createSmtp: () => { throw new Error("private factory error"); } })).toMatchObject({ state: "uncertain" });
  expect(f.delivery().attempts[0]).toMatchObject({ outcome: null, finishedAt: null });
  await f.restart(); await runDispatchOnce(f.deps); expect(f.sent).toHaveLength(0); expect(f.counts().searches).toBe(1);
});

it("preserves uncertainty if SMTP succeeded but the outcome transaction did not commit", async () => {
  const f = await harness(); await runDispatchOnce(f.deps);
  f.deps.repository.finishSendAttempt = async () => { throw new Error("synthetic outcome write failure"); };
  expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "uncertain" });
  expect(f.sent).toHaveLength(1); expect(f.delivery().attempts[0].outcome).toBeNull();
  await f.restart(); await runDispatchOnce(f.deps); expect(f.sent).toHaveLength(1);
});

it.each(["incomplete", "contradictory", "timeout", "budget"])("does not confirm or resend a %s mailbox search", async kind => {
  const f = await harness(); await runDispatchOnce(f.deps); await runDispatchOnce(f.deps);
  f.mailbox(async mail => {
    if (kind === "timeout") throw new Error("private timeout");
    const copy = { mailbox: "INBOX", uidValidity: "1", uid: 1, fingerprint: mail.fingerprint };
    return { copies: kind === "contradictory" ? [copy, { ...copy, uidValidity: "2", uid: 2 }] : [copy], complete: kind === "contradictory", issues: kind === "budget" ? ["CANDIDATE_LIMIT"] : [] };
  });
  expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "smtp_accepted" });
  expect(f.delivery().confirmedAt).toBeNull(); expect(f.delivery().mailboxChecks).toBe(1); expect(f.sent).toHaveLength(1);
  expect(await runDispatchOnce(f.deps)).toEqual({ kind: "idle" });
});

it("does not steal an in-flight send claim when a concurrent run advances the clock", async () => {
  const f = await harness(); await runDispatchOnce(f.deps);
  let entered!: () => void, release!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; }), gate = new Promise<void>(resolve => { release = resolve; });
  f.smtp(async raw => { f.sent.push(await collect(raw)); entered(); await gate; return { accepted: ["info@trinkgut-jammers.de"], rejected: [], response: "250 accepted" }; });
  const sending = runDispatchOnce(f.deps); await started;
  try { f.now("2026-10-10T11:00:00.000Z"); expect(await runDispatchOnce(f.deps)).toEqual({ kind: "idle" }); expect(f.sent).toHaveLength(1); }
  finally { release(); await sending; }
  expect(f.delivery().attempts).toHaveLength(1);
});

it("never starts SMTP at acceptedAt plus 24 hours or reads an expired original", async () => {
  const f = await harness(); await runDispatchOnce(f.deps);
  f.now("2026-10-10T10:00:00.000Z"); await runDispatchOnce(f.deps);
  expect(f.delivery().reason).toBe("MANUAL_REQUIRED"); expect(f.sent).toHaveLength(0);
  const expired = await harness(); expired.now("2026-10-16T10:00:00.000Z"); await runDispatchOnce(expired.deps);
  expect(expired.delivery().reason).toBe("PROCESSING_EXPIRED"); expect(expired.delivery().contactEnvelope).toBeNull();
});

it.each(["bundle", "registration", "mime", "intent", "outcome"])("recovers an actual SIGKILL at %s without rerastering or ambiguous resend", async stage => {
  const child = spawn(process.execPath, ["--import", "tsx", join(process.cwd(), "services/applications/tests/fixtures/dispatch-crash-child.ts"), stage], { stdio: ["ignore", "ignore", "pipe", "ipc"] });
  let root: string | undefined, adopted = false;
  try {
    const [message] = await Promise.race([once(child, "message"), once(child, "exit").then(() => { throw new Error("CRASH_FIXTURE_EXITED_EARLY"); })]);
    const result = message as { error?: string; root: string; accepted: Acceptance; privateKey: string; publicKey: string; sendCalls: number; rasterCalls: number; registered: RegisteredMail | null; mime: ArtifactRecord | null };
    expect(result.error).toBeUndefined(); root = result.root;
    const exited = once(child, "exit"); child.kill("SIGKILL"); const [code, signal] = await exited;
    expect(code).toBeNull(); expect(signal).toBe("SIGKILL"); expect(result.rasterCalls).toBe(1);
    const intakeRoot = join(root, "intake"), privateRoot = join(root, "custody"), runtimeRoot = join(root, "runtime");
    const authority = testIngressAuthority(intakeRoot); await authority.recoverExitedHarness(child, privateRoot);
    const clock = { now: () => new Date(result.accepted.acceptedAt) };
    const repo = openRepository(join(root, "registry.sqlite"), clock);
    const config = { intakeRoot, custodyRoot: privateRoot, runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock, ingressAuthority: authority };
    const custody = createCustodyLedger(repo, config);
    const f = await harness(false, { root, repo, accepted: result.accepted, config, keys: { privateKey: createPrivateKey(result.privateKey), publicKey: createPublicKey(result.publicKey), intakeRoot, privateRoot, runtimeRoot, custody } }); adopted = true;
    await custody.reconcile();
    if (["intent", "outcome"].includes(stage)) {
      expect((await f.row()).deliveryState).toBe("uncertain");
      await runDispatchOnce(f.deps); expect(f.sent).toHaveLength(0);
      expect(result.sendCalls).toBe(stage === "outcome" ? 1 : 0);
      expect(f.delivery().attempts[0]).toMatchObject({ outcome: null, finishedAt: null });
    } else {
      expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "ready" });
      if (result.registered) expect(f.delivery().registered).toEqual(result.registered);
      if (result.mime) expect(f.deps.repository.getArtifact(result.accepted.id, "mime")).toEqual(result.mime);
      await runDispatchOnce(f.deps); expect(f.sent).toHaveLength(1);
    }
    expect(f.counts().rasterCalls).toBe(0);
  } finally {
    if (child.exitCode === null && child.signalCode === null) { const ended = once(child, "exit"); child.kill("SIGKILL"); await ended; }
    if (root && !adopted) await rm(root, { recursive: true, force: true });
  }
}, 15000);

it("integrates actual synthetic HTTP and Unix RPC intake with cleaned stored MIME and an independently verified mailbox receipt", async () => {
  const root = await mkdtemp(join(await realpath(tmpdir()), "dispatch-http-"));
  const intakeRoot = join(root, "intake"), privateRoot = join(root, "custody"), runtimeRoot = join(root, "runtime");
  await Promise.all([intakeRoot, privateRoot, runtimeRoot].map(path => mkdir(path, { mode: 0o700 })));
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 }), clock = { now: () => new Date("2026-10-09T10:00:00.000Z") };
  const repo = openRepository(join(root, "registry.sqlite"), clock);
  const config = { intakeRoot, custodyRoot: privateRoot, runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock, ingressAuthority: testIngressAuthority(intakeRoot) };
  const custody = createCustodyLedger(repo, config); await custody.reconcile();
  const socketPath = join(root, "worker.sock");
  const rpc = createWorkerRpc(repo, { socketPath, custody, sharedGid: process.getgid!(), clock, readiness: testReadiness });
  const intake: IntakeConfig = { mode: "enabled", origin: "http://localhost", clock, host: "127.0.0.1", port: 3105, proxy: { peer: "loopback", clientIpHeader: "x-application-client-ip" }, lifetimes: { sessionSeconds: 604800, formSeconds: 900, pilotSeconds: 3600 }, acceptance: { privateRoot: intakeRoot, socketPath, ownerUid: process.getuid!(), sharedGid: process.getgid!(), publicKey: pair.publicKey, keys: { cookieSignature: Buffer.alloc(32, 1), formSignature: Buffer.alloc(32, 2), sessionHash: Buffer.alloc(32, 3), sessionRate: Buffer.alloc(32, 4), ipRate: Buffer.alloc(32, 5), pilotSignature: Buffer.alloc(32, 6) } } };
  const server = createIntakeServer(intake, createWorkerRpcClient(socketPath));
  let adopted = false;
  try {
    rpc.listen(socketPath); await once(rpc, "listening"); server.listen(0, "127.0.0.1"); await once(server, "listening");
    const address = server.address(); if (!address || typeof address === "string") throw new Error("TEST_ADDRESS");
    const request = (path: string, headers: Record<string, string> = {}, body?: Buffer) => new Promise<{ status: number; headers: import("node:http").IncomingHttpHeaders; body: unknown }>((resolve, reject) => {
      const outgoing = httpRequest({ host: "127.0.0.1", port: address.port, path, method: "POST", headers: { origin: "http://localhost", "sec-fetch-site": "same-origin", "sec-fetch-mode": "cors", "sec-fetch-dest": "empty", ...headers } }, response => {
        const chunks: Buffer[] = []; response.on("data", chunk => chunks.push(chunk)); response.on("end", () => resolve({ status: response.statusCode!, headers: response.headers, body: JSON.parse(Buffer.concat(chunks).toString()) }));
      }); outgoing.on("error", reject); outgoing.end(body);
    });
    const session = await request("/api/bewerbung/session"); expect(session.status).toBe(200);
    const image = await sharp({ create: { width: 1, height: 1, channels: 3, background: "red" } }).png().toBuffer();
    const chunks = [Buffer.from("--dispatch-boundary\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\nSynthetic Applicant\r\n--dispatch-boundary\r\nContent-Disposition: form-data; name=\"email\"\r\n\r\nsynthetic@example.invalid\r\n--dispatch-boundary\r\nContent-Disposition: form-data; name=\"job\"\r\n\r\nsales-fulltime\r\n--dispatch-boundary\r\nContent-Disposition: form-data; name=\"files\"; filename=\"untrusted.png\"\r\nContent-Type: image/png\r\n\r\n"), image, Buffer.from("\r\n--dispatch-boundary--\r\n")];
    const response = await request("/api/bewerbung", { cookie: session.headers["set-cookie"]![0].split(";")[0], "x-application-form-token": (session.body as { formToken: string }).formToken, "idempotency-key": "synthetic-dispatch-http", "x-application-client-ip": "192.0.2.2", "content-type": "multipart/form-data; boundary=dispatch-boundary" }, Buffer.concat(chunks));
    expect(response.status).toBe(202);
    const original = repo.listRetainedIntakes()[0]; expect(original).toBeDefined();
    const accepted: Acceptance = { id: original.id, acceptedAt: original.acceptedAt, reference: "synthetic", statusProof: "synthetic", replayed: false };
    const f = await harness(false, { root, repo, config, accepted, keys: { ...pair, intakeRoot, privateRoot, runtimeRoot, custody } }); adopted = true;
    await runDispatchOnce(f.deps);
    const cleaned = await f.deps.artifacts.withBundle(original.id, bundle => readFile(bundle.files[0].path));
    expect(cleaned.equals(image)).toBe(false);
    await runDispatchOnce(f.deps);
    const structure = await inspectMimeStructure(f.sent[0], MIME_LIMITS);
    // Independent decoder on the actual emitted raw body, not DTO assertions.
    const attachmentPart = f.sent[0].toString("ascii").split(/Content-Disposition: attachment[^]*?\r\n\r\n/)[1];
    expect(Buffer.from(attachmentPart.split("\r\n--")[0].replace(/\s/g, ""), "base64")).toEqual(cleaned);
    expect(structure.headers.to).toBe("info@trinkgut-jammers.de");
    expect(structure.attachments).toMatchObject([{ name: "document-1.png", mediaType: "image/png" }]);
    f.mailbox(async mail => ({ complete: (await verifyMail(stream(f.sent[0]), mail, f.deps.verificationKeys)).kind === "verified", copies: [{ mailbox: "INBOX", uidValidity: "17", uid: 3, fingerprint: mail.fingerprint }], issues: [] }));
    expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "delivered" });
  } finally {
    server.closeAllConnections(); if (server.listening) await new Promise<void>(resolve => server.close(() => resolve()));
    if (rpc.listening) await new Promise<void>(resolve => rpc.close(() => resolve()));
    if (!adopted) { repo.close(); await rm(root, { recursive: true, force: true }); }
  }
});

it("limits timely receipt runs to exactly five persisted slots with no sixth search", async () => {
  const f = await harness(); await runDispatchOnce(f.deps); await runDispatchOnce(f.deps);
  for (const time of ["2026-10-09T10:00:00.000Z", "2026-10-09T10:05:00.000Z", "2026-10-09T10:30:00.000Z", "2026-10-09T11:00:00.000Z", "2026-10-10T10:00:00.000Z"]) {
    f.now(time); await runDispatchOnce(f.deps); await f.restart(); expect(await runDispatchOnce(f.deps)).toEqual({ kind: "idle" });
  }
  expect(f.counts().searches).toBe(5); expect(f.delivery().mailboxChecks).toBe(5); expect(f.sent).toHaveLength(1);
});

it("closes a newly constructed transport without connecting when construction crosses the send deadline", async () => {
  const f = await harness(); await runDispatchOnce(f.deps);
  let connects = 0, closes = 0;
  const result = await runDispatchOnce({ ...f.deps, createSmtp: () => {
    f.now("2026-10-10T10:00:00.000Z");
    return { connect: async () => { connects++; }, login: async () => {}, send: async () => ({ accepted: ["info@trinkgut-jammers.de"], rejected: [], response: "250 accepted" }), close: () => { closes++; } };
  } });
  expect(connects).toBe(0); expect(closes).toBe(1); expect(result).toMatchObject({ state: "uncertain" });
});

it("rejects authenticated but unverified adopted MIME before it can become ready", async () => {
  const f = await harness(); const adopt = f.deps.artifacts.adoptMime;
  f.deps.artifacts.adoptMime = async (id, raw, version) => { await collect(raw); return adopt(id, stream(Buffer.from("not MIME")), version); };
  expect(await runDispatchOnce(f.deps)).toMatchObject({ state: "needs_attention", reason: "VERIFICATION_FAILED" });
  expect(f.delivery().mimeDigest).toBeNull(); expect(f.sent).toHaveLength(0);
});

it("keeps the fixed old identity and key when a new active signing key is configured", async () => {
  const f = await harness();
  const claim = f.deps.repository.claimDispatchWork("staging", utcInstant(f.deps.clock.now().toISOString()))!;
  await f.deps.repository.stageDeliveryIdentity({ id: claim.case.id, version: claim.case.version, token: claim.case.claimToken }, "key-1", claim.case.acceptedAt);
  const identity = f.delivery().identity; await f.restart();
  expect(await runDispatchOnce({ ...f.deps, signingKeyId: "key-2", signingKeys: new Map([...f.deps.signingKeys, ["key-2", createSecretKey(Buffer.alloc(32, 8))]]) })).toMatchObject({ state: "ready" });
  expect(f.delivery().identity).toEqual(identity);
});
