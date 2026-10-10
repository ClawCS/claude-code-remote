import { testAdmission } from "./fixtures/admission";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, randomUUID, createHash } from "node:crypto";
import { mkdtemp, mkdir, realpath, rm, readFile, open, symlink, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { join } from "node:path";
import { sealIncoming, encodePayload, payloadDigest, readBoundedFile } from "../src/crypto";
import { takePrivateSnapshot, withPrivateFiles } from "../src/custody";
import { createTestCustodyLedger as createCustodyLedger, testIngressAuthority } from "./fixtures/ingress-authority";
import { openTestRepository as openRepository } from "./fixtures/admission";
import { digest, utcInstant, type WorkerKeys, type ApplicationRepository, type CommittedIntake } from "../src/types";
import { makeArtifactHarness, claimArtifactPreparation } from "./fixtures/artifacts";
import { createArtifactStore } from "../src/artifact-store";
import { withReconstructedDocuments, type ReconstructionDependencies } from "../src/reconstruction";

let root: string;
let keys: WorkerKeys;
let repo: ApplicationRepository;
let records: Map<string, CommittedIntake>;
const input = { name: "Synthetic Applicant", email: "synthetic@example.invalid", job: "sales-fulltime" };
const body = { version: 1 as const, input: { ...input, job: "sales-fulltime" as const }, files: [{ name: "synthetic.pdf", mediaType: "application/pdf" as const, content: Buffer.from("synthetic document").toString("base64") }] };
const payload = Buffer.from(JSON.stringify(body));
beforeEach(async () => {
  root = await mkdtemp(join(await realpath(tmpdir()), "applications-custody-"));
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const intakeRoot = join(root, "intake"), privateRoot = join(root, "worker"), runtimeRoot = join(root, "run");
  await Promise.all([intakeRoot, privateRoot, runtimeRoot].map(path => mkdir(path, { mode: 0o700 })));
  repo = openRepository(join(root, "registry.sqlite"));
  const custody = createCustodyLedger(repo, { intakeRoot, custodyRoot: privateRoot, runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock: { now: () => new Date("2026-10-09T10:00:00.000Z") } });
  await custody.reconcile();
  keys = { ...pair, intakeRoot, privateRoot, runtimeRoot, custody }; records = new Map();
});
afterEach(async () => { vi.restoreAllMocks(); repo?.close(); await rm(root, { recursive: true, force: true }); });
async function sealed(beforeCommit?: (path: string) => Promise<void>) {
  const reservation = await keys.custody.reserve({ ...testAdmission(),  sessionHash: digest("b".repeat(64)), idempotencyKey: randomUUID(), reservedBytes: 20000, now: utcInstant("2026-10-09T10:00:00.000Z") });
  const file = await sealIncoming((async function* () { yield payload; })(), { root: keys.intakeRoot, maxBytes: reservation.reservedBytes, reservationId: reservation.id }, keys.publicKey);
  await beforeCommit?.(file.path);
  const accepted = await keys.custody.commitIntake({ reservationId: reservation.id, encryptedPayloadPath: file.path, actualBytes: file.bytes, digest: payloadDigest(body), encryptedName: "ciphertext:synthetic", job: "sales-fulltime", now: utcInstant("2026-10-09T10:00:00.000Z") });
  records.set(file.path, repo.getCommittedIntake(accepted.id)!); return file;
}
function record(file: Awaited<ReturnType<typeof sealed>>) { return records.get(file.path)!; }

async function retryAttempt(idempotencyKey = "synthetic-conflict", requestBody = body) {
  const reservation = await keys.custody.reserve({ ...testAdmission(), sessionHash: digest("b".repeat(64)), idempotencyKey, reservedBytes: 20000, now: utcInstant("2026-10-09T10:00:00.000Z") });
  const file = await sealIncoming((async function* () { yield encodePayload(requestBody); })(), { root: keys.intakeRoot, maxBytes: reservation.reservedBytes / 2, reservationId: reservation.id }, keys.publicKey);
  return { reservation, file, commit: { reservationId: reservation.id, encryptedPayloadPath: file.path, actualBytes: file.bytes, digest: payloadDigest(requestBody), encryptedName: "ciphertext:synthetic", job: "sales-fulltime" as const, now: utcInstant("2026-10-09T10:00:00.000Z") } };
}
describe("terminal idempotency conflict", () => {
  it("preserves retired accepted bytes through unhealthy recovery, due cleanup and restart while removing genuine unaccepted orphans", async () => {
    const h = await makeArtifactHarness();
    let reopened: ApplicationRepository | undefined;
    let time = new Date("2026-10-09T10:00:00.000Z");
    h.config.clock = { now: () => new Date(time) };
    try {
      const original = h.repo.getCommittedIntake(h.accepted.id)!, originalBytes = await readFile(original.encryptedPayloadPath);
      const claimed = await claimArtifactPreparation(h);
      expect(h.repo.getDelivery(h.accepted.id).contactEnvelope).not.toBeNull();
      const store = createArtifactStore(h.repo, h.keys, h.keys.custody);
      const reconstruction: ReconstructionDependencies = {
        scope: h.keys.custody, monotonicNow: () => 0,
        scanner: { assurance: "qualified-local-engine", scan: async file => ({ kind: "clean", complete: true, digest: file.digest, bytes: file.bytes, signatureTime: utcInstant(new Date().toISOString()), engineIdentity: "synthetic-not-clamav" }) },
        inspector: { assurance: "local-test", inspect: async () => ({ kind: "inspected", inspection: { format: "png", pageCount: 1 } }) },
        raster: { render: async () => { throw new Error("NO_FILES"); } }, output: { verify: async () => {} },
      };
      const snapshot = await takePrivateSnapshot(original, h.keys);
      const bundle = await withPrivateFiles(snapshot, h.keys, processing => withReconstructedDocuments(processing, reconstruction, value => store.adoptBundle(value, claimed.version)));
      const bundleBytes = await readFile(bundle.path);
      await h.repo.withCaseLock(h.accepted.id, row => h.repo.retireOriginal(row.id, row.version));
      expect(h.repo.getCommittedIntake(h.accepted.id)).toBeNull();
      h.authority.available = false;
      await expect(h.keys.custody.cleanupOrphans()).rejects.toThrow("INGRESS_AUTHORITY_UNAVAILABLE");
      expect(h.keys.custody.getIntakeReadiness()).toEqual({ ready: false });
      h.authority.available = true; time = new Date("2026-10-10T10:00:00.000Z");
      expect(await h.keys.custody.settleIngress({ kind: "expired" })).toMatchObject({ complete: true });
      const afterRecovery = await h.keys.custody.cleanupOrphans();
      expect(await readFile(original.encryptedPayloadPath)).toEqual(originalBytes);
      expect(afterRecovery.orphans).toEqual([]);
      expect(await readFile(bundle.path)).toEqual(bundleBytes);

      h.repo.close(); reopened = openRepository(join(h.root, "registry.sqlite"), h.config.clock);
      let recovered = createCustodyLedger(reopened, h.config);
      await recovered.reconcile();
      const afterRestart = await recovered.cleanupOrphans();
      expect(await readFile(original.encryptedPayloadPath)).toEqual(originalBytes);
      expect(afterRestart.physicalBytes + afterRestart.reservedHeadroom).toBe(afterRecovery.physicalBytes + afterRecovery.reservedHeadroom);
      expect(reopened.getArtifact(h.accepted.id, "bundle")).toEqual(bundle);

      const unaccepted = await recovered.reserve({ ...testAdmission(), sessionHash: digest("c".repeat(64)), idempotencyKey: "genuine-orphan", reservedBytes: 20000, now: utcInstant(time.toISOString()) });
      const orphan = await sealIncoming((async function* () { yield encodePayload(h.payload); })(), { root: h.keys.intakeRoot, maxBytes: 10000, reservationId: unaccepted.id }, h.keys.publicKey);
      reopened.close(); reopened = openRepository(join(h.root, "registry.sqlite"), h.config.clock);
      recovered = createCustodyLedger(reopened, h.config);
      expect((await recovered.reconcile()).orphans).toEqual([{ path: orphan.path, cleanupAfter: "2026-10-11T10:00:00.000Z" }]);
      time = new Date("2026-10-11T10:00:00.000Z");
      const cleaned = await recovered.cleanupOrphans();
      await expect(stat(orphan.path)).rejects.toMatchObject({ code: "ENOENT" });
      expect(cleaned.orphans).toEqual([]);
      expect(await readFile(original.encryptedPayloadPath)).toEqual(originalBytes);
      expect(await readFile(bundle.path)).toEqual(bundleBytes);
      expect(cleaned.physicalBytes + cleaned.reservedHeadroom).toBe(afterRecovery.physicalBytes + afterRecovery.reservedHeadroom);
    } finally { reopened?.close(); h.authority.available = true; await h.close(); }
  });
  it("does not clear an unrelated custody failure or full-reconcile over a live processing scope", async () => {
    const accepted = await sealed(), snapshot = await takePrivateSnapshot(record(accepted), keys);
    await withPrivateFiles(snapshot, keys, async () => {
      const pending = await retryAttempt();
      await expect(keys.custody.commitIntake({ ...pending.commit, actualBytes: 1 })).rejects.toThrow("SIZE_MISMATCH");
      expect(await keys.custody.settleIngress({ kind: "drain" })).toMatchObject({ complete: true });
      expect(keys.custody.getIntakeReadiness()).toEqual({ ready: false });
      await expect(keys.custody.reconcile()).rejects.toThrow("CUSTODY_SCOPE_ACTIVE");
    });
    await keys.custody.reconcile(); expect(keys.custody.getIntakeReadiness()).toEqual({ ready: true });
  });
  it("counts an unlinked live producer inode until real holder settlement, never treating ENOENT as proof", async () => {
    const pending = await retryAttempt(), authority = testIngressAuthority(keys.intakeRoot), holder = await authority.retain(pending.reservation.id);
    await rm(pending.file.path);
    try {
      const result = await keys.custody.settleIngress({ kind: "drain" });
      expect(result.complete).toBe(false); expect(result.inventory.physicalBytes).toBeGreaterThanOrEqual(pending.file.bytes);
      await holder.write(Buffer.from("still live"), 0, 10, 0);
      await expect(keys.custody.reconcile()).rejects.toThrow("CUSTODY_SCOPE_ACTIVE");
    } finally { await holder.close(); }
    expect((await keys.custody.settleIngress({ kind: "drain" })).inventory.physicalBytes).toBe(0);
  });
  it("rejects wrong-generation evidence and preserves the reservation through a failed final release acknowledgement", async () => {
    const pending = await retryAttempt(), authority = testIngressAuthority(keys.intakeRoot), quiesce = authority.quiesce.bind(authority);
    const wrong = vi.spyOn(authority, "quiesce").mockImplementationOnce(async lease => ({ ...await authority.observe(lease), lease: { ...lease, generation: "wrong-generation" } }));
    await expect(keys.custody.settleIngress({ kind: "drain" })).rejects.toThrow("INGRESS_AUTHORITY_MISMATCH");
    expect(await readFile(pending.file.path)).toHaveLength(pending.file.bytes); wrong.mockImplementation(quiesce);
    vi.spyOn(authority, "released").mockRejectedValueOnce(new Error("synthetic-final-release-failed"));
    await expect(keys.custody.settleIngress({ kind: "drain" })).rejects.toThrow("synthetic-final-release-failed");
    const journal = JSON.parse(await readFile(join(keys.privateRoot, pending.reservation.id + ".journal"), "utf8"));
    expect(journal).toMatchObject({ release: "pending", settlement: "drain", budget: 20000 });
    expect(() => repo.reserve({ ...testAdmission(), sessionHash: digest("b".repeat(64)), idempotencyKey: "synthetic-conflict", reservedBytes: 20000, now: utcInstant("2026-10-09T10:00:00.000Z") })).toThrow("UPLOAD_IN_PROGRESS");
    await expect(keys.custody.reconcile()).rejects.toThrow("CUSTODY_SCOPE_ACTIVE");
    expect(await keys.custody.settleIngress({ kind: "drain" })).toMatchObject({ complete: true, pending: 0 });
  });
  it("rechecks the current worker gate after awaited custody checks and before granting a producer", async () => {
    let healthy = true;
    const authority = testIngressAuthority(keys.intakeRoot), original = authority.prepare.bind(authority);
    vi.spyOn(authority, "prepare").mockImplementation(async (...args) => { const lease = await original(...args); healthy = false; return lease; });
    await expect(keys.custody.reserve({ ...testAdmission(), sessionHash: digest("b".repeat(64)), idempotencyKey: "closing", reservedBytes: 20000, now: utcInstant("2026-10-09T10:00:00.000Z") }, { getIntakeReadiness: () => ({ ready: healthy }) })).rejects.toThrow("WORKER_UNAVAILABLE");
    const journalName = (await readdir(keys.privateRoot)).find(name => name.endsWith(".journal"))!;
    const journal = JSON.parse(await readFile(join(keys.privateRoot, journalName), "utf8"));
    expect((await authority.observe(journal.lease)).state).toBe("prepared");
    expect(await keys.custody.settleIngress({ kind: "drain" })).toMatchObject({ complete: true });
  });
  it("keeps accepted producer ownership until terminal settlement rather than clearing it at commit return", async () => {
    const pending = await retryAttempt(), holder = await testIngressAuthority(keys.intakeRoot).retain(pending.reservation.id);
    try {
      const accepted = await keys.custody.commitIntake(pending.commit);
      await expect(keys.custody.reconcile()).rejects.toThrow("CUSTODY_SCOPE_ACTIVE");
      expect(repo.getCommittedIntake(accepted.id)).not.toBeNull();
    } finally { await holder.close(); }
    expect(await keys.custody.settleIngress({ kind: "drain" })).toMatchObject({ complete: true });
    await expect(keys.custody.reconcile()).resolves.toMatchObject({ orphans: [] });
  });
  it("retains the failed commit reservation until authority-backed cleanup succeeds", async () => {
    const pending = await retryAttempt(), holder = await testIngressAuthority(keys.intakeRoot).retain(pending.reservation.id);
    try {
      await expect(keys.custody.commitIntake({ ...pending.commit, actualBytes: 1 })).rejects.toThrow("SIZE_MISMATCH");
      expect(() => repo.reserve({ ...testAdmission(), sessionHash: digest("b".repeat(64)), idempotencyKey: "synthetic-conflict", reservedBytes: 20000, now: utcInstant("2026-10-09T10:00:00.000Z") })).toThrow("UPLOAD_IN_PROGRESS");
      await expect(keys.custody.reconcile()).rejects.toThrow("CUSTODY_SCOPE_ACTIVE");
    } finally { await holder.close(); }
    expect(await keys.custody.settleIngress({ kind: "drain" })).toMatchObject({ complete: true });
  });
  it("settles only known terminal producer generations and preserves durable intent across restart", async () => {
    const pending = await retryAttempt();
    const authority = testIngressAuthority(keys.intakeRoot), holder = await authority.retain(pending.reservation.id);
    try {
      expect(await keys.custody.settleIngress({ kind: "drain" })).toMatchObject({ complete: false, pending: 1 });
      const journal = JSON.parse(await readFile(join(keys.privateRoot, pending.reservation.id + ".journal"), "utf8"));
      expect(journal).toMatchObject({ settlement: "drain", release: "pending", budget: 20000 });
      expect(() => repo.reserve({ ...testAdmission(), sessionHash: digest("b".repeat(64)), idempotencyKey: "synthetic-conflict", reservedBytes: 20000, now: utcInstant("2026-10-09T10:00:00.000Z") })).toThrow("UPLOAD_IN_PROGRESS");
      await expect(keys.custody.reconcile()).rejects.toThrow("CUSTODY_SCOPE_ACTIVE");
      expect(keys.custody.getIntakeReadiness()).toEqual({ ready: false });
      await holder.write(Buffer.from("live"), 0, 4, 0);
      expect((await holder.stat()).ino).toBe((await stat(pending.file.path)).ino);
      repo.close(); repo = openRepository(join(root, "registry.sqlite"));
      keys.custody = createCustodyLedger(repo, { intakeRoot: keys.intakeRoot, custodyRoot: keys.privateRoot, runtimeRoot: keys.runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock: { now: () => new Date("2026-10-09T10:00:00.000Z") } });
      await keys.custody.reconcile();
      expect(keys.custody.getIntakeReadiness()).toEqual({ ready: false });
      expect(await keys.custody.settleIngress({ kind: "expired" })).toMatchObject({ complete: false, pending: 1 });
    } finally { await holder.close(); }
    expect(await keys.custody.settleIngress({ kind: "expired" })).toMatchObject({ complete: true, pending: 0 });
    expect(await readdir(keys.intakeRoot)).toEqual([]);
    expect(await readdir(keys.privateRoot)).toEqual([]);
    expect(await keys.custody.settleIngress({ kind: "drain" })).toMatchObject({ complete: true, pending: 0 });
    expect(keys.custody.getIntakeReadiness()).toEqual({ ready: true });
  });
  it("keeps healthy readiness after proven repository conflict, terminal cleanup and identical original accounting", async () => {
    const first = await retryAttempt(), accepted = await keys.custody.commitIntake(first.commit);
    const original = repo.getCommittedIntake(accepted.id)!, bytes = await readFile(original.encryptedPayloadPath), inventory = await keys.custody.cleanupOrphans();
    const changed = await retryAttempt(undefined, { ...body, files: [{ ...body.files[0], content: Buffer.from("synthetic edited document").toString("base64") }] });
    await expect(keys.custody.commitIntake(changed.commit)).rejects.toThrow("IDEMPOTENCY_CONFLICT");
    expect(keys.custody.getIntakeReadiness()).toEqual({ ready: true });
    expect(await readdir(keys.intakeRoot)).toEqual([]); expect(await keys.custody.cleanupOrphans()).toEqual(inventory);
    expect(repo.getCommittedIntake(accepted.id)).toEqual(original); expect(await readFile(original.encryptedPayloadPath)).toEqual(bytes);
    const unrelated = await retryAttempt("synthetic-unrelated"); await expect(keys.custody.commitIntake(unrelated.commit)).resolves.toMatchObject({ replayed: false });
    expect(repo.listRetainedIntakes()).toHaveLength(2);
  });
  it("fails closed and retains both copies/accounting when conflict terminal authority still has a live descriptor", async () => {
    const first = await retryAttempt(), accepted = await keys.custody.commitIntake(first.commit);
    const original = repo.getCommittedIntake(accepted.id)!, bytes = await readFile(original.encryptedPayloadPath), before = await keys.custody.cleanupOrphans();
    const changed = await retryAttempt(undefined, { ...body, files: [{ ...body.files[0], content: Buffer.from("synthetic edited document").toString("base64") }] });
    const holder = await testIngressAuthority(keys.intakeRoot).retain(changed.reservation.id);
    try {
      await expect(keys.custody.commitIntake(changed.commit)).rejects.toThrow("INGRESS_BUSY");
      expect(keys.custody.getIntakeReadiness()).toEqual({ ready: false });
      expect(await readFile(changed.file.path)).toHaveLength(changed.file.bytes);
      const journal = JSON.parse(await readFile(join(keys.privateRoot, changed.reservation.id + ".journal"), "utf8"));
      expect(journal).toMatchObject({ state: "orphan", release: "pending", budget: 20000 });
      expect(await readFile(journal.workerPath)).toHaveLength(changed.file.bytes);
      const after = await keys.custody.cleanupOrphans(); expect(after.physicalBytes).toBeGreaterThan(before.physicalBytes); expect(after.reservedHeadroom).toBeGreaterThan(before.reservedHeadroom);
      expect(repo.getCommittedIntake(accepted.id)).toEqual(original); expect(await readFile(original.encryptedPayloadPath)).toEqual(bytes);
      await expect(keys.custody.reserve({ ...testAdmission(), sessionHash: digest("c".repeat(64)), idempotencyKey: "unrelated", reservedBytes: 20000, now: utcInstant("2026-10-09T10:00:00.000Z") })).rejects.toThrow("CUSTODY_NOT_READY");
    } finally { await holder.close(); }
    expect(keys.custody.getIntakeReadiness()).toEqual({ ready: false });
  });
  it("does not exempt a repository error merely named conflict when no matching accepted key exists", async () => {
    const pending = await retryAttempt();
    vi.spyOn(repo, "commitIntake").mockImplementationOnce(() => { throw new Error("IDEMPOTENCY_CONFLICT"); });
    await expect(keys.custody.commitIntake(pending.commit)).rejects.toThrow("IDEMPOTENCY_CONFLICT");
    expect(keys.custody.getIntakeReadiness()).toEqual({ ready: false }); expect(repo.listRetainedIntakes()).toEqual([]);
    expect((await keys.custody.cleanupOrphans()).physicalBytes).toBeGreaterThan(pending.file.bytes);
  });
});

describe("custody-open-fd", () => {
  it("keeps the worker-owned bytes unchanged after mutation through a retained ingress descriptor", async () => {
    let retained!: Awaited<ReturnType<typeof open>>;
    const file = await sealed(async path => { retained = await testIngressAuthority(keys.intakeRoot).retain(path.split("/").at(-1)!.slice(0,-4)); });
    try {
      const snapshot = await takePrivateSnapshot(record(file), keys);
      const before = createHash("sha256").update(await readFile(snapshot.encryptedPayloadPath)).digest("hex");
      await retained.write(Buffer.from("mutated"), 0, 7, 0);
      const after = createHash("sha256").update(await readFile(snapshot.encryptedPayloadPath)).digest("hex");
      expect(after).toBe(before);
      expect(snapshot.input).toEqual(input);
      expect(snapshot.files[0].digest).toBe(createHash("sha256").update("synthetic document").digest("hex"));
      expect((await readFile(snapshot.encryptedPayloadPath)).includes(Buffer.from(input.name))).toBe(false);
      expect((await retained.stat()).ino).not.toBe((await stat(snapshot.encryptedPayloadPath)).ino);
      await withPrivateFiles(snapshot, keys, async processing => { expect(await readFile(processing.files[0].path, "utf8")).toBe("synthetic document"); });
      expect(await readdir(keys.runtimeRoot)).toEqual([]);
    } finally { await retained.close(); }
  });
});
describe("custody-tamper", () => {
  it("rejects a modified GCM tag before a private snapshot or plaintext becomes available", async () => {
    const file = await sealed(); const fd = await open(record(file).encryptedPayloadPath, "r+");
    try { const bytes = await readFile(record(file).encryptedPayloadPath); bytes[bytes.length - 1] ^= 1; await fd.write(bytes, 0, bytes.length, 0); } finally { await fd.close(); }
    await expect(takePrivateSnapshot(record(file), keys)).rejects.toThrow("AUTHENTICATION_FAILED");
    expect((await readdir(keys.privateRoot)).filter(name => name.endsWith(".enc"))).toHaveLength(1); expect(await readdir(keys.runtimeRoot)).toEqual([]);
  });
  it("rejects a different authenticated request fingerprint", async () => {
    const file = await sealed();
    await expect(takePrivateSnapshot({ ...record(file), digest: digest("f".repeat(64)) }, keys)).rejects.toThrow("DIGEST_MISMATCH");
    expect((await readdir(keys.privateRoot)).filter(name => name.endsWith(".enc"))).toHaveLength(1);
  });
});
describe("custody-symlink", () => {
  it("rejects symlinked and traversal paths without reading their targets", async () => {
    const file = await sealed(); const link = join(keys.privateRoot, "link.enc"); await symlink(record(file).encryptedPayloadPath, link);
    await expect(takePrivateSnapshot({ ...record(file), encryptedPayloadPath: link }, keys)).rejects.toThrow("UNSAFE_PATH");
    await expect(takePrivateSnapshot({ ...record(file), encryptedPayloadPath: keys.privateRoot + "/../worker/" + record(file).encryptedPayloadPath.split("/").at(-1) }, keys)).rejects.toThrow("UNSAFE_PATH");
  });
});
describe("bounded wire payload", () => {
  it("accepts exactly 5 MiB decoded base64 without recursion and rejects overlimit or noncanonical encodings",()=>{
    const file={name:"synthetic.png",mediaType:"image/png" as const,content:Buffer.alloc(5242880,83).toString("base64")};
    expect(encodePayload({...body,files:[file]}).length).toBeGreaterThan(5242880);
    expect(()=>encodePayload({...body,files:[{...file,content:Buffer.alloc(5242881,83).toString("base64")}]})).toThrow("INVALID_PAYLOAD");
    for(const content of ["AAB=","AA=A","A===","AAA","AA$=","AAAA=","===="]){
      expect(()=>encodePayload({...body,files:[{...file,content}]})).toThrow("INVALID_PAYLOAD");
    }
  });
  it("removes journal-owned plaintext after an actual SIGKILL before reopening healthy custody", async () => {
    repo.close();
    const parameters = { root, intakeRoot: keys.intakeRoot, privateRoot: keys.privateRoot, runtimeRoot: keys.runtimeRoot, sourceRoot: process.cwd(), body };
    const code = `const {join}=require('node:path'); const {testAdmission}=require(join(p.sourceRoot,'services/applications/tests/fixtures/admission.ts')); const {generateKeyPairSync}=require('node:crypto'); const {openTestRepository:openRepository}=require(join(p.sourceRoot,'services/applications/tests/fixtures/admission.ts')); const {createCustodyLedger,takePrivateSnapshot,withPrivateFiles}=require(join(p.sourceRoot,'services/applications/src/custody.ts')); const {encodePayload,payloadDigest,sealIncoming}=require(join(p.sourceRoot,'services/applications/src/crypto.ts')); (async()=>{ const repo=openRepository(join(p.root,'registry.sqlite')); const now='2026-10-09T10:00:00.000Z'; const clock={now:()=>new Date(now)}; const custody=createCustodyLedger(repo,{intakeRoot:p.intakeRoot,custodyRoot:p.privateRoot,runtimeRoot:p.runtimeRoot,intakeUid:process.getuid(),sharedGid:process.getgid(),clock}); await custody.reconcile(); const keys={...generateKeyPairSync('rsa',{modulusLength:2048}),intakeRoot:p.intakeRoot,privateRoot:p.privateRoot,runtimeRoot:p.runtimeRoot,custody}; const reservation=await custody.reserve({ ...testAdmission(), sessionHash:'b'.repeat(64),idempotencyKey:'crash',reservedBytes:20000,now}); const file=await sealIncoming((async function*(){yield encodePayload(p.body)})(),{root:p.intakeRoot,maxBytes:reservation.reservedBytes,reservationId:reservation.id},keys.publicKey); const accepted=await custody.commitIntake({reservationId:reservation.id,encryptedPayloadPath:file.path,actualBytes:file.bytes,digest:payloadDigest(p.body),encryptedName:'ciphertext',job:'sales-fulltime',now}); const snapshot=await takePrivateSnapshot(repo.getCommittedIntake(accepted.id),keys); await withPrivateFiles(snapshot,keys,async()=>{process.stdout.write('ready');await new Promise(()=>{});}); })().catch(e=>{console.error(e);process.exit(1)}); setInterval(()=>{},1000);`;
    const child = spawn(process.execPath, ["--import", "tsx", "--eval", `const p=${JSON.stringify(parameters)};${code.replace("services/applications/src/custody.ts","services/applications/tests/fixtures/ingress-authority.ts")}`], { stdio: ["ignore", "pipe", "pipe"] });
    try {
      await Promise.race([once(child.stdout!, "data"), once(child, "exit").then(() => { throw new Error("child failed before plaintext scope"); })]);
      expect(await readdir(keys.runtimeRoot)).toHaveLength(1);
      const exited = once(child, "exit"); child.kill("SIGKILL"); await exited;
      await testIngressAuthority(keys.intakeRoot).recoverExitedHarness(child,keys.privateRoot);
      repo = openRepository(join(root, "registry.sqlite"));
      const recovered = createCustodyLedger(repo, { intakeRoot: keys.intakeRoot, custodyRoot: keys.privateRoot, runtimeRoot: keys.runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock: { now: () => new Date("2026-10-09T10:00:00.000Z") } });
      await recovered.reconcile(); expect(await readdir(keys.runtimeRoot)).toEqual([]);
    } finally { child.kill("SIGKILL"); }
  });
  it("rejects a second processing scope and never cleans a live owned scope during reconciliation", async () => {
    const snapshot = await takePrivateSnapshot(record(await sealed()), keys);
    let release!: () => void; const barrier = new Promise<void>(resolve => { release = resolve; });
    let entered!: () => void; const started = new Promise<void>(resolve => { entered = resolve; });
    const running = withPrivateFiles(snapshot, keys, async processing => { entered(); await barrier; expect(await readFile(processing.files[0].path, "utf8")).toBe("synthetic document"); });
    await started;
    try {
      await expect(withPrivateFiles(snapshot, keys, async () => {})).rejects.toThrow("PROCESSING_IN_PROGRESS");
      await expect(keys.custody.reconcile()).rejects.toThrow("CUSTODY_SCOPE_ACTIVE");
    } finally { release(); await running; }
    expect(await readdir(keys.runtimeRoot)).toEqual([]);
  });
  it("bounds an opened descriptor read even when the file grows after its initial stat", async () => {
    const file = await sealed(); const reader = await open(record(file).encryptedPayloadPath, "r"), writer = await open(record(file).encryptedPayloadPath, "r+");
    try { await writer.truncate(100000); await expect(readBoundedFile(reader, 1000)).rejects.toThrow("PAYLOAD_TOO_LARGE"); } finally { await reader.close(); await writer.close(); }
  });
  it("canonicalizes input fields while fingerprinting decoded attachment bytes and metadata", () => {
    expect(payloadDigest(body)).toBe(payloadDigest({ ...body, input: { email: body.input.email, job: body.input.job, name: body.input.name } }));
    expect(payloadDigest({ ...body, files: [{ ...body.files[0], name: "other.pdf" }] })).not.toBe(payloadDigest(body));
    expect(() => encodePayload({ ...body, files: [{ ...body.files[0], content: "%%%" }] })).toThrow("INVALID_PAYLOAD");
  });
  it("enforces physical envelope budget during streaming and removes partial ciphertext", async () => {
    await expect(sealIncoming((async function* () { yield Buffer.alloc(1000); })(), { root: keys.intakeRoot, maxBytes: 100 }, keys.publicKey)).rejects.toThrow("RESERVATION_EXCEEDED");
    expect(await readdir(keys.intakeRoot)).toEqual([]);
  });
  it("disposes authenticated runtime files even when the consumer throws", async () => {
    const snapshot = await takePrivateSnapshot(record(await sealed()), keys);
    await expect(withPrivateFiles(snapshot, keys, async () => { throw new Error("scanner failed"); })).rejects.toThrow("scanner failed");
    expect(await readdir(keys.runtimeRoot)).toEqual([]);
  });
});
