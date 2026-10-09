import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateKeyPairSync, randomUUID, createHash } from "node:crypto";
import { constants } from "node:fs";
import { mkdtemp, mkdir, realpath, rm, readFile, open, symlink, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { join } from "node:path";
import { sealIncoming, encodePayload, payloadDigest, readBoundedFile } from "../src/crypto";
import { createCustodyLedger, takePrivateSnapshot, withPrivateFiles } from "../src/custody";
import { openRepository } from "../src/repository";
import { digest, utcInstant, type WorkerKeys, type ApplicationRepository, type CommittedIntake } from "../src/types";

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
afterEach(async () => { repo?.close(); await rm(root, { recursive: true, force: true }); });
async function sealed(beforeCommit?: (path: string) => Promise<void>) {
  const reservation = await keys.custody.reserve({ sessionHash: digest("b".repeat(64)), idempotencyKey: randomUUID(), reservedBytes: 20000, now: utcInstant("2026-10-09T10:00:00.000Z") });
  const file = await sealIncoming((async function* () { yield payload; })(), { root: keys.intakeRoot, maxBytes: reservation.reservedBytes, reservationId: reservation.id }, keys.publicKey);
  await beforeCommit?.(file.path);
  const accepted = await keys.custody.commitIntake({ reservationId: reservation.id, encryptedPayloadPath: file.path, actualBytes: file.bytes, digest: payloadDigest(body), encryptedName: "ciphertext:synthetic", job: "sales-fulltime", now: utcInstant("2026-10-09T10:00:00.000Z") });
  records.set(file.path, repo.getCommittedIntake(accepted.id)!); return file;
}
function record(file: Awaited<ReturnType<typeof sealed>>) { return records.get(file.path)!; }

describe("custody-open-fd", () => {
  it("keeps the worker-owned bytes unchanged after mutation through a retained ingress descriptor", async () => {
    let retained!: Awaited<ReturnType<typeof open>>;
    const file = await sealed(async path => { retained = await open(path, constants.O_RDWR); });
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
  it("removes journal-owned plaintext after an actual SIGKILL before reopening healthy custody", async () => {
    repo.close();
    const parameters = { root, intakeRoot: keys.intakeRoot, privateRoot: keys.privateRoot, runtimeRoot: keys.runtimeRoot, sourceRoot: process.cwd(), body };
    const code = `const {join}=require('node:path'); const {generateKeyPairSync}=require('node:crypto'); const {openRepository}=require(join(p.sourceRoot,'services/applications/src/repository.ts')); const {createCustodyLedger,takePrivateSnapshot,withPrivateFiles}=require(join(p.sourceRoot,'services/applications/src/custody.ts')); const {encodePayload,payloadDigest,sealIncoming}=require(join(p.sourceRoot,'services/applications/src/crypto.ts')); (async()=>{ const repo=openRepository(join(p.root,'registry.sqlite')); const now='2026-10-09T10:00:00.000Z'; const clock={now:()=>new Date(now)}; const custody=createCustodyLedger(repo,{intakeRoot:p.intakeRoot,custodyRoot:p.privateRoot,runtimeRoot:p.runtimeRoot,intakeUid:process.getuid(),sharedGid:process.getgid(),clock}); await custody.reconcile(); const keys={...generateKeyPairSync('rsa',{modulusLength:2048}),intakeRoot:p.intakeRoot,privateRoot:p.privateRoot,runtimeRoot:p.runtimeRoot,custody}; const reservation=await custody.reserve({sessionHash:'b'.repeat(64),idempotencyKey:'crash',reservedBytes:20000,now}); const file=await sealIncoming((async function*(){yield encodePayload(p.body)})(),{root:p.intakeRoot,maxBytes:reservation.reservedBytes,reservationId:reservation.id},keys.publicKey); const accepted=await custody.commitIntake({reservationId:reservation.id,encryptedPayloadPath:file.path,actualBytes:file.bytes,digest:payloadDigest(p.body),encryptedName:'ciphertext',job:'sales-fulltime',now}); const snapshot=await takePrivateSnapshot(repo.getCommittedIntake(accepted.id),keys); await withPrivateFiles(snapshot,keys,async()=>{process.stdout.write('ready');await new Promise(()=>{});}); })().catch(e=>{console.error(e);process.exit(1)}); setInterval(()=>{},1000);`;
    const child = spawn(process.execPath, ["--import", "tsx", "--eval", `const p=${JSON.stringify(parameters)};${code}`], { stdio: ["ignore", "pipe", "pipe"] });
    try {
      await Promise.race([once(child.stdout!, "data"), once(child, "exit").then(() => { throw new Error("child failed before plaintext scope"); })]);
      expect(await readdir(keys.runtimeRoot)).toHaveLength(1);
      const exited = once(child, "exit"); child.kill("SIGKILL"); await exited;
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
