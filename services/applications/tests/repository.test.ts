import { testAdmission, removeTask10Schema } from "./fixtures/admission";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHash, generateKeyPairSync } from "node:crypto";
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import Database from "better-sqlite3";
import { openTestRepository as openRepository, openReadyTestRepository } from "./fixtures/admission";
import { sealContact } from "../src/contact-crypto";
import type { ApplicationId, ApplicationRepository, CaseRecord, Digest, Instant, IntakeCommit } from "../src/types";

const now = "2026-10-09T10:00:00.000Z" as Instant;
const digest = "a".repeat(64) as Digest;
const session = "b".repeat(64) as Digest;
const MiB = 1024 * 1024;
const contactKeys = generateKeyPairSync("rsa", { modulusLength: 2048 });
let dir: string;
let repo: ApplicationRepository;
beforeEach(async () => { dir = mkdtempSync(join(realpathSync(tmpdir()), "applications-registry-")); repo = await openReadyTestRepository(join(dir, "registry.sqlite")); });
afterEach(() => { repo?.close(); rmSync(dir, { recursive: true, force: true }); });
function reserve(key: string, bytes = 1) { return repo.reserve({ ...testAdmission(),  sessionHash: session, idempotencyKey: key, reservedBytes: bytes, now }); }
function commit(key: string, bytes = 1): IntakeCommit {
  return { reservationId: reserve(key, bytes).id, digest, actualBytes: bytes, encryptedPayloadPath: join(dir, `${key}.enc`), encryptedName: "ciphertext:synthetic-name", job: "sales-fulltime", now };
}

describe("repository-idempotency", () => {
  it("reads immutable worker submission metadata synchronously even while the case is locked", async () => {
    const accepted = repo.commitIntake(commit("submission-lookup"));
    await repo.withCaseLock(accepted.id, async () => {
      const metadata = repo.getSubmissionKind(accepted.id);
      expect(metadata).toEqual({ kind: "application" }); expect(Object.isFrozen(metadata)).toBe(true);
      expect(repo.getRequestIdentity(accepted.id)).toEqual({ id: accepted.id, digest, acceptedAt: now });
    });
    expect(() => repo.getSubmissionKind("00000000-0000-4000-8000-000000000001" as Parameters<typeof repo.getSubmissionKind>[0])).toThrow("CASE_NOT_FOUND");
  });
  it("exposes a minimal authoritative retained manifest only to worker consumers", () => {
    const input = commit("manifest", 12); const accepted = repo.commitIntake(input);
    const wanted = { id: accepted.id, encryptedPayloadPath: input.encryptedPayloadPath, actualBytes: 12, digest, acceptedAt: now };
    expect(repo.getCommittedIntake(accepted.id)).toEqual(wanted);
    expect(repo.listRetainedIntakes()).toEqual([wanted]);
  });
  it("returns one stable reference and queues only one intake for identical retries", () => {
    const input = commit("same"); const first = repo.commitIntake(input); const second = repo.commitIntake(input);
    expect(second.reference).toBe(first.reference);
    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.statusProof).not.toBe(first.statusProof);
    expect(repo.claimNext("worker-a", now)?.id).toBe(first.id);
    expect(repo.claimNext("worker-b", now)).toBeNull();
  });
  it("rejects a changed digest under an already committed key", () => {
    const input = commit("same"); repo.commitIntake(input);
    expect(() => repo.commitIntake({ ...input, digest: "c".repeat(64) as Digest })).toThrow("IDEMPOTENCY_CONFLICT");
  });
  it("scopes keys to server-issued browser sessions", async () => {
    const first = repo.commitIntake(commit("same"));
    const other = repo.reserve({ ...testAdmission(),  sessionHash: "c".repeat(64) as Digest, idempotencyKey: "same", reservedBytes: 1, now });
    const second = repo.commitIntake({ ...commit("unused"), reservationId: other.id });
    expect(second.reference).not.toBe(first.reference);
    const claim = repo.claimNext("a", now)!; expect(claim.id).toBe(first.id);
    await repo.recordDeliveryFailure(authority(claim), { category: "operational", reason: "DEPENDENCY_UNAVAILABLE" }, now);
    expect(repo.claimNext("b", now)?.id).toBe(second.id);
  });
});
describe("repository-capacity", () => {
  it("rejects a concurrent body for the same active key", () => {
    reserve("in-progress");
    expect(() => reserve("in-progress")).toThrow("UPLOAD_IN_PROGRESS");
  });
  it("counts committed-key replay upload slots and releases them on completion", () => {
    const first = repo.commitIntake(commit("first")); repo.commitIntake(commit("second")); repo.commitIntake(commit("third"));
    const a = reserve("first"); reserve("second");
    expect(() => reserve("third")).toThrow("CAPACITY_EXCEEDED");
    expect(repo.commitIntake({ ...commitPayload("first", a.id), now }).reference).toBe(first.reference);
    expect(reserve("third").id).not.toBe(a.id);
  });
  it("counts temporary replay bytes even for a committed key", () => {
    repo.commitIntake(commit("large", 95 * MiB));
    expect(() => reserve("large", MiB + 1)).toThrow("CAPACITY_EXCEEDED");
  });
  it("permits a replay at 20 small persisted cases but still applies active upload capacity", async () => {
    const first = await smallArtifactCase("case-0");
    for (let i = 1; i < 20; i++) await smallArtifactCase(`case-${i}`);
    const retry = reserve("case-0");
    expect(repo.commitIntake(commitPayload("case-0", retry.id)).reference).toBe(first.reference);
    expect(() => reserve("new-case")).toThrow("CAPACITY_EXCEEDED");
  });
  it("rejects the 21st pending case without losing admitted work", async () => {
    for (let i = 0; i < 20; i++) await smallArtifactCase(`case-${i}`);
    expect(() => reserve("overflow")).toThrow("CAPACITY_EXCEEDED");
  });
  it("rejects a third simultaneous upload and releases aborted reservation budget", () => {
    const first = reserve("a"); reserve("b");
    expect(() => reserve("c")).toThrow("CAPACITY_EXCEEDED");
    repo.releaseReservation(first.id);
    expect(reserve("c").id).toBeTruthy();
  });
  it("rejects a reservation above 250 MiB", () => { expect(() => reserve("large", 250 * MiB + 1)).toThrow("CAPACITY_EXCEEDED"); });
  it("counts committed actual bytes plus reservations atomically", () => {
    repo.commitIntake(commit("large", 95 * MiB));
    expect(() => reserve("overflow", MiB + 1)).toThrow("CAPACITY_EXCEEDED");
    // 250 MiB minus 128 MiB scratch, 95 MiB intake, 26 MiB output,
    // 65536 manifest, 4096 envelope, 16384 artifact and 8192 registry overhead.
    expect(reserve("large", 954368).id).toBeTruthy();
  });
  it("rejects actual bytes beyond a reservation without creating a case", () => {
    const input = commit("small");
    expect(() => repo.commitIntake({ ...input, actualBytes: 2 })).toThrow("RESERVATION_EXCEEDED");
    expect(repo.claimNext("worker", now)).toBeNull();
  });
  it("expires abandoned reservations after 24 hours", () => {
    reserve("a"); reserve("b");
    expect(repo.reserve({ ...testAdmission(),  sessionHash: session, idempotencyKey: "c", reservedBytes: 1, now: "2026-10-10T10:00:00.000Z" as Instant }).expiresAt).toBe("2026-10-11T10:00:00.000Z");
  });
});
describe("registry lifecycle", () => {
  it("migrates v1 transactionally without changing acceptance, request digest, or public proofs",async()=>{
    const accepted=repo.commitIntake(commit("legacy"));repo.close();
    const legacy=new Database(join(dir,"registry.sqlite"));removeV4(legacy);legacy.exec("DROP TABLE artifacts; DROP TABLE artifact_reservations; DROP TABLE abuse_events; DROP TRIGGER reservation_submission_immutable; DROP TRIGGER case_submission_immutable; ALTER TABLE reservations DROP COLUMN submission; ALTER TABLE cases DROP COLUMN submission; PRAGMA user_version=1;");legacy.close();
    repo=await openReadyTestRepository(join(dir,"registry.sqlite"));
    expect(repo.getRequestIdentity(accepted.id)).toEqual({id:accepted.id,digest,acceptedAt:now});
    expect(repo.listArtifactReservations()).toEqual([
      {caseId:accepted.id,kind:"bundle",bytes:10553344,expiresAt:"2026-10-16T10:00:00.000Z"},
      {caseId:accepted.id,kind:"mime",bytes:16779264,expiresAt:"2026-10-16T10:00:00.000Z"},
    ]);
    expect(repo.getPublicStatus(createHash("sha256").update(accepted.statusProof).digest("hex") as Digest,now)?.reference).toBe(accepted.reference);
    expect(repo.claimNext("migration", now)?.submission).toEqual({ kind: "application" });
  });
  it("migrates the actual v2 artifact schema through v3/v4 to v5 without changing artifacts or identity", async () => {
    const accepted = repo.commitIntake(commit("v2"));
    const path = join(dir, "v2-bundle.enc"), bytes = Buffer.from("synthetic-v2-artifact"); writeFileSync(path, bytes, { mode: 0o600 });
    const artifact = { caseId: accepted.id, kind: "bundle" as const, path, bytes: bytes.length, plaintextDigest: digest, ciphertextDigest: createHash("sha256").update(bytes).digest("hex") as Digest, expiresAt: "2026-10-16T10:00:00.000Z" as Instant };
    await repo.adoptArtifact(artifact, 1); const reserves = repo.listArtifactReservations();
    repo.close(); const legacy = new Database(join(dir, "registry.sqlite"));
    removeV4(legacy); legacy.exec("DROP TABLE abuse_events; DROP TRIGGER reservation_submission_immutable; DROP TRIGGER case_submission_immutable; ALTER TABLE reservations DROP COLUMN submission; ALTER TABLE cases DROP COLUMN submission; PRAGMA user_version=2;"); legacy.close();
    repo = await openReadyTestRepository(join(dir, "registry.sqlite"));
    expect(repo.getArtifact(accepted.id, "bundle")).toEqual(artifact); expect(repo.listArtifactReservations()).toEqual(reserves);
    expect(repo.getRequestIdentity(accepted.id)).toEqual({ id: accepted.id, digest, acceptedAt: now });
    expect(repo.getPublicStatus(createHash("sha256").update(accepted.statusProof).digest("hex") as Digest, now)?.reference).toBe(accepted.reference);
    await repo.withCaseLock(accepted.id, async row => { expect(row.submission).toEqual({ kind: "application" }); });
    repo.close(); const inspect = new Database(join(dir, "registry.sqlite")); expect(inspect.pragma("user_version", { simple: true })).toBe(10);
    expect(() => inspect.prepare("UPDATE cases SET submission=? WHERE id=?").run('{"kind":"synthetic","pilotRunId":"invented"}', accepted.id)).toThrow("IMMUTABLE_SUBMISSION"); inspect.close();
    repo = await openReadyTestRepository(join(dir, "registry.sqlite"));
  });
  it("keeps artifact identity and original request proof through original retirement and restart", async () => {
    const accepted = repo.commitIntake(commit("artifacts"));
    const path = join(dir, "bundle.enc"), bytes = Buffer.from("sealed artifact");
    writeFileSync(path, bytes, { mode: 0o600 });
    const record = { caseId: accepted.id, kind: "bundle" as const, path, bytes: bytes.length, plaintextDigest: digest, ciphertextDigest: createHash("sha256").update(bytes).digest("hex") as Digest, expiresAt: "2026-10-16T10:00:00.000Z" as Instant };
    await repo.adoptArtifact(record, 1);
    await expect(repo.adoptArtifact({ ...record, plaintextDigest: "c".repeat(64) as Digest }, 2)).rejects.toThrow("ARTIFACT_CONFLICT");
    expect((await repo.adoptArtifact(record, 1)).version).toBe(2);
    const claimed=repo.claimNext("contact-fixture",now)!;
    const contact=await repo.storeContact(authority(claimed),sealContact("synthetic@example.test",{caseId:accepted.id,acceptedAt:now,version:1},contactKeys.publicKey),contactKeys.privateKey,now);
    await repo.retireOriginal(accepted.id, contact.case.version);
    expect(repo.getCommittedIntake(accepted.id)).toBeNull();
    expect(repo.getRequestIdentity(accepted.id)).toEqual({ id: accepted.id, digest, acceptedAt: now });
    repo.close(); repo = await openReadyTestRepository(join(dir, "registry.sqlite"));
    expect(repo.getArtifact(accepted.id, "bundle")).toEqual(record);
    expect(repo.commitIntake(commit("artifacts")).reference).toBe(accepted.reference);
  });
  it("cannot retire the sole original or create an artifact once sending has begun", async () => {
    const accepted = repo.commitIntake(commit("sole"));
    await expect(repo.retireOriginal(accepted.id, 1)).rejects.toThrow("BUNDLE_REQUIRED");
    const sending = await beginSyntheticSend(accepted.id);
    const path = join(dir, "late.enc"); writeFileSync(path, "late", { mode: 0o600 });
    await expect(repo.adoptArtifact({ caseId: accepted.id, kind: "bundle", path, bytes: 4, plaintextDigest: digest, ciphertextDigest: createHash("sha256").update("late").digest("hex") as Digest, expiresAt: "2026-10-16T10:00:00.000Z" as Instant }, sending.version)).rejects.toThrow("ARTIFACT_CREATION_CLOSED");
  });
  it("refuses an existing database readable by other OS users", () => {
    const path = join(dir, "unsafe.sqlite"); writeFileSync(path, "", { mode: 0o644 });
    expect(() => openRepository(path)).toThrow("UNSAFE_PATH");
  });
  it("excludes a second worker instance", () => { expect(() => openRepository(join(dir, "registry.sqlite"))).toThrow("REPOSITORY_IN_USE"); });
  it("eagerly excludes a separate OS process before any intake", () => {
    const child = spawnSync(process.execPath, ["--import", "tsx", "--eval", `const {openRepository}=require(${JSON.stringify(join(process.cwd(), "services/applications/src/repository.ts"))}); try {openRepository(${JSON.stringify(join(dir, "registry.sqlite"))}); process.exit(2)} catch(e) {if(e.message!=="REPOSITORY_IN_USE") throw e;}`], { encoding: "utf8", timeout: 10000 });
    expect(child.status, child.stderr).toBe(0);
  });
  it("releases process ownership after an abrupt OS-process crash", async () => {
    repo.close();
    const child = spawn(process.execPath, ["--import", "tsx", "--eval", `const {openRepository}=require(${JSON.stringify(join(process.cwd(), "services/applications/src/repository.ts"))}); openRepository(${JSON.stringify(join(dir, "registry.sqlite"))}); process.stdout.write("ready"); setInterval(()=>{},1000);`], { stdio: ["ignore", "pipe", "pipe"] });
    try {
      const ready = await Promise.race([once(child.stdout!, "data"), once(child, "exit").then(() => { throw new Error("worker failed to start"); })]);
      expect(String(ready[0])).toBe("ready");
      const exited = once(child, "exit"); child.kill("SIGKILL"); await exited;
      repo = await openReadyTestRepository(join(dir, "registry.sqlite"));
      expect(reserve("after-crash").reservedBytes).toBe(1);
    } finally { child.kill("SIGKILL"); }
  });
  it("persists references and recovers interrupted pre-send claims on restart", async () => {
    const first = repo.commitIntake(commit("durable")); repo.claimNext("before-crash", now); repo.close();
    repo = await openReadyTestRepository(join(dir, "registry.sqlite"));
    expect(repo.claimNext("after-crash", now)?.reference).toBe(first.reference);
    expect(repo.commitIntake({ ...commit("durable") }).reference).toBe(first.reference);
  });
  it("audits the version change caused by crash recovery", async () => {
    const accepted = repo.commitIntake(commit("audit-recovery")); repo.claimNext("worker", now); repo.close();
    repo = await openReadyTestRepository(join(dir, "registry.sqlite")); repo.close();
    const inspection = new Database(join(dir, "registry.sqlite"), { readonly: true });
    try {
      expect(inspection.prepare("SELECT event, version FROM audit WHERE caseId = ? ORDER BY sequence").all(accepted.id)).toEqual([{ event: "accepted", version: 1 }, { event: "claimed", version: 2 }, { event: "recovered", version: 3 }]);
    } finally { inspection.close(); }
  });
  it("never requeues a potentially sent case after restart", async () => {
    const first = repo.commitIntake(commit("uncertain")); await beginSyntheticSend(first.id);
    repo.close(); repo = await openReadyTestRepository(join(dir, "registry.sqlite"));
    expect(repo.claimNext("new-worker", now)).toBeNull();
    const state = await repo.withCaseLock(first.id, async row => row.deliveryState);
    expect(state).toBe("uncertain");
  });
  it("serializes the whole async action and never versions a read", async () => {
    const first = repo.commitIntake(commit("lock"));
    let release!: () => void; const barrier = new Promise<void>(resolve => { release = resolve; });
    const order: string[] = [];
    const a = repo.withCaseLock(first.id, async row => { order.push("a-start"); expect(Object.isFrozen(row)).toBe(true); await barrier; order.push("a-end"); });
    const b = repo.withCaseLock(first.id, async row => { order.push("b"); expect(row.version).toBe(1); });
    const settled = Promise.allSettled([a, b]);
    try { await Promise.resolve(); expect(order).toEqual(["a-start"]); } finally { release(); await settled; }
    expect(order).toEqual(["a-start", "a-end", "b"]);
    expect(await repo.withCaseLock(first.id, async row => row.version)).toBe(1);
  });
  it("releases the case guard when a callback rejects", async () => {
    const first = repo.commitIntake(commit("rollback"));
    await expect(repo.withCaseLock(first.id, async () => { throw new Error("aborted"); })).rejects.toThrow("aborted");
    expect(await repo.withCaseLock(first.id, async row => row.caseState)).toBe("open");
  });
  it("supports explicit CAS transitions inside the guard without deadlock", async () => {
    const first = repo.commitIntake(commit("transition")); const claim = repo.claimNext("worker", now)!;
    await repo.withCaseLock(first.id, async row => {
      const updated = await repo.stageDeliveryIdentity(authority(row), "signing-1", now);
      expect(updated.case.version).toBe(3);
    });
    await expect(repo.transitionDelivery(first.id, claim.version, { state: "sending" })).rejects.toThrow("STALE_VERSION");
    await expect(repo.transitionDelivery(first.id, 3, { state: "delivered" })).rejects.toThrow("INVALID_TRANSITION");
  });
  it("never lets a general transition bypass claim ownership or the single scan slot", async () => {
    const first = repo.commitIntake(commit("claimed")); const second = repo.commitIntake(commit("waiting"));
    repo.claimNext("worker", now);
    await expect(repo.transitionDelivery(second.id, 1, { state: "scanning" })).rejects.toThrow("INVALID_TRANSITION");
    expect(await repo.withCaseLock(first.id, async row => row.claimOwner)).toBe("worker");
  });
  it("does not leak guard authority into a detached async continuation", async () => {
    const first = repo.commitIntake(commit("detached")); repo.claimNext("worker", now);
    let resume!: () => void; const barrier = new Promise<void>(resolve => { resume = resolve; });
    let detached!: Promise<unknown>;
    await repo.withCaseLock(first.id, async row => { detached = barrier.then(() => repo.stageDeliveryIdentity(authority(row), "signing-1", now)); });
    const result = Promise.allSettled([detached]);
    let release!: () => void; const held = new Promise<void>(resolve => { release = resolve; });
    let completed = false;
    const holding = repo.withCaseLock(first.id, async () => { resume(); await held; });
    detached.then(() => { completed = true; }, () => {});
    await new Promise(resolve => setImmediate(resolve));
    try { expect(completed).toBe(false); } finally { release(); await holding; await result; }
    expect(completed).toBe(true);
  });
});
describe("public proof", () => {
  it("anchors replay proofs to the original acceptance, never the retry time", () => {
    const first = repo.commitIntake(commit("replay-proof"));
    const later = "2026-10-15T10:00:00.000Z" as Instant;
    const retry = repo.reserve({ ...testAdmission(),  sessionHash: session, idempotencyKey: "replay-proof", reservedBytes: 1, now: later });
    const accepted = repo.commitIntake({ ...commitPayload("replay-proof", retry.id), now: later });
    const hash = createHash("sha256").update(accepted.statusProof).digest("hex") as Digest;
    expect(accepted.acceptedAt).toBe(first.acceptedAt);
    expect(repo.getPublicStatus(hash, later)?.acceptedAt).toBe(now);
    expect(repo.getPublicStatus(hash, "2026-10-16T10:00:00.000Z" as Instant)).toBeNull();
  });
  it("requires the hashed proof, never the stable reference, and expires seven days from acceptance", () => {
    const accepted = repo.commitIntake(commit("proof"));
    const proofHash = createHash("sha256").update(accepted.statusProof).digest("hex") as Digest;
    expect(repo.getPublicStatus(proofHash, now)).toEqual({ reference: accepted.reference, state: "processing", acceptedAt: now });
    expect(repo.getPublicStatus(createHash("sha256").update(accepted.reference).digest("hex") as Digest, now)).toBeNull();
    expect(repo.getPublicStatus(proofHash, "2026-10-16T10:00:00.000Z" as Instant)).toBeNull();
  });
});
function commitPayload(key: string, reservationId: string): IntakeCommit {
  return { reservationId, digest, actualBytes: 1, encryptedPayloadPath: join(dir, `${key}.enc`), encryptedName: "ciphertext:synthetic-name", job: "sales-fulltime", now };
}
async function smallArtifactCase(key:string){
  const accepted=repo.commitIntake(commit(key));let row=await stageMail(accepted.id);
  for(const kind of ["bundle","mime"] as const){
    const path=join(dir,`${key}.${kind}.enc`);writeFileSync(path,"x",{mode:0o600});
    row=await repo.adoptArtifact({caseId:accepted.id,kind,path,bytes:1,plaintextDigest:digest,ciphertextDigest:createHash("sha256").update("x").digest("hex") as Digest,expiresAt:"2026-10-16T10:00:00.000Z" as Instant},row.version);
  }
  await repo.bindVerifiedMime(authority(row),repo.getArtifact(accepted.id,"mime")!,{kind:"verified"},now);
  return accepted;
}
function authority(row: CaseRecord) { return { id: row.id, version: row.version, token: row.claimToken! }; }
async function stageMail(id: ApplicationId) {
  const claimed=repo.claimNext("fixture",now)!; expect(claimed.id).toBe(id);
  const staged=await repo.stageDeliveryIdentity(authority(claimed),"signing-1",now);
  return (await repo.stageRegisteredMail(authority(staged.case),{id,messageId:staged.delivery.identity!.messageId,keyId:"signing-1",profile:"tj-mail-1",fingerprint:digest,shape:{kind:"text",parts:1,attachments:[]}},now)).case;
}
async function beginSyntheticSend(id: ApplicationId) {
  const row=await stageMail(id),path=join(dir,`${id}.mime.enc`);writeFileSync(path,"x",{mode:0o600});
  const artifact={caseId:id,kind:"mime" as const,path,bytes:1,plaintextDigest:digest,ciphertextDigest:createHash("sha256").update("x").digest("hex") as Digest,expiresAt:"2026-10-16T10:00:00.000Z" as Instant};
  const adopted=await repo.adoptArtifact(artifact,row.version); await repo.bindVerifiedMime(authority(adopted),artifact,{kind:"verified"},now);
  const claimed=repo.claimDispatchWork("fixture",now,"send")!;
  return (await repo.beginSendAttempt(authority(claimed.case),artifact,{kind:"verified"},now)).case;
}
function removeV4(db: Database.Database) {
  removeTask10Schema(db);
  db.exec("DROP TABLE lifecycle_audit; DROP TABLE lifecycle_proposals; DROP TABLE case_lifecycle;");
  db.exec("DROP TABLE auth_grants; DROP TABLE auth_sessions; DROP TABLE auth_recovery; DROP TABLE auth_staff; DROP TABLE auth_attempts; DROP TABLE auth_clock;");
  db.exec("DROP TABLE delivery_attempts; DROP TABLE deliveries; DROP INDEX delivery_claim_token; DROP TRIGGER case_accepted_at_immutable; ALTER TABLE cases DROP COLUMN claimToken; ALTER TABLE cases DROP COLUMN claimKind;");
}
