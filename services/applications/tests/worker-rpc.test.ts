import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createConnection, type Server } from "node:net";
import { once } from "node:events";
import { mkdtemp, realpath, rm, mkdir, stat, writeFile, readdir, open, symlink, readFile, copyFile } from "node:fs/promises";
import { createHash, generateKeyPairSync } from "node:crypto";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openRepository } from "../src/repository";
import { createWorkerRpc, createWorkerRpcClient } from "../src/worker-rpc";
import { digest, utcInstant, type ApplicationRepository, type CustodyLedger, type IntakeCommit } from "../src/types";
import { createCustodyLedger } from "../src/custody";
import { sealIncoming, intakePath } from "../src/crypto";
let root: string;
let repo: ApplicationRepository;
let server: Server;
let intakeRoot: string, custodyRoot: string, runtimeRoot: string, ledger: CustodyLedger, time: Date;
const now = utcInstant("2026-10-09T10:00:00.000Z");
const publicKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).publicKey;
const clock = { now: () => new Date(time) };
beforeEach(async () => {
  root = await mkdtemp(join(await realpath(tmpdir()), "applications-rpc-")); repo = openRepository(join(root, "registry.sqlite"));
  intakeRoot = join(root, "intake"); custodyRoot = join(root, "custody"); runtimeRoot = join(root, "run"); time = new Date(now);
  await Promise.all([intakeRoot, custodyRoot, runtimeRoot].map(path => mkdir(path, { mode: 0o700 })));
  ledger = createCustodyLedger(repo, { intakeRoot, custodyRoot, runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock });
});
afterEach(async () => { if (server?.listening) await new Promise<void>(resolve => server.close(() => resolve())); repo.close(); await rm(root, { recursive: true, force: true }); });
async function request(method: string, params: unknown = {}) {
  const socket = createConnection(join(root, "worker.sock"));
  await once(socket, "connect");
  socket.end(JSON.stringify({ method, params }) + "\n");
  const [data] = await once(socket, "data");
  socket.destroy();
  return JSON.parse(String(data));
}
describe("rpc-no-admin", () => {
  it("rejects admission before explicit worker startup reconciliation", async () => {
    server = createWorkerRpc(repo, { socketPath: join(root, "worker.sock"), custody: ledger, sharedGid: process.getgid!(), clock }); server.listen(join(root, "worker.sock")); await once(server, "listening");
    expect(await request("reserve", reserveInput())).toEqual({ ok: false, error: "CUSTODY_NOT_READY" });
  });
  it("shares accounting with worker snapshots created after RPC startup", async () => {
    await ledger.reconcile();
    server = createWorkerRpc(repo, { socketPath: join(root, "worker.sock"), custody: ledger, sharedGid: process.getgid!(), clock }); server.listen(join(root, "worker.sock")); await once(server, "listening");
    const client = createWorkerRpcClient(join(root, "worker.sock"));
    const reserved = await client.reserve(reserveInput()); const file = await sealIncoming((async function* () { yield Buffer.from("synthetic"); })(), { root: intakeRoot, maxBytes: reserved.reservedBytes, reservationId: reserved.id }, publicKey);
    const accepted = await client.commitIntake(commitInput(reserved.id, file.bytes));
    await ledger.reconcile();
    const record = repo.getCommittedIntake(accepted.id)!;
    const directory = await ledger.beginProcessing({ id: record.id, input: { name: "Synthetic", email: "synthetic@example.invalid", job: "sales-fulltime" }, files: [], digest: record.digest, encryptedPayloadPath: record.encryptedPayloadPath, bytes: record.actualBytes }, 4096);
    await mkdir(directory, { mode: 0o700 });
    try { await expect(client.reserve(reserveInput("next"))).resolves.toMatchObject({ reservedBytes: 20000 }); } finally { await ledger.finishProcessing(directory); }
  });
  it("rejects delete without exposing any administrative operation", async () => {
    await ledger.reconcile();
    server = createWorkerRpc(repo, { socketPath: join(root, "worker.sock"), custody: ledger, sharedGid: process.getgid!(), clock });
    server.listen(join(root, "worker.sock")); await once(server, "listening");
    expect(await request("delete")).toEqual({ ok: false, error: "METHOD_NOT_ALLOWED" });
  });
  it("creates a restricted Unix socket and rejects extra schema fields", async () => {
    await ledger.reconcile();
    server = createWorkerRpc(repo, { socketPath: join(root, "worker.sock"), custody: ledger, sharedGid: process.getgid!(), clock });
    server.listen(join(root, "worker.sock")); await once(server, "listening");
    expect((await stat(join(root, "worker.sock"))).mode & 0o777).toBe(0o660);
    expect(await request("reserve", { ...reserveInput(), path: "/etc/passwd" })).toEqual({ ok: false, error: "INVALID_REQUEST" });
    expect(await request("getCommittedIntake")).toEqual({ ok: false, error: "METHOD_NOT_ALLOWED" });
  });
  it("exposes reserve, commit and proof-hash status using a fresh ticket for every replay", async () => {
    await ledger.reconcile();
    server = createWorkerRpc(repo, { socketPath: join(root, "worker.sock"), custody: ledger, sharedGid: process.getgid!(), clock }); server.listen(join(root, "worker.sock")); await once(server, "listening");
    const reserved = await request("reserve", reserveInput()); expect(reserved.ok).toBe(true);
    const file = await sealIncoming((async function* () { yield Buffer.from("synthetic"); })(), { root: intakeRoot, maxBytes: 20000, reservationId: reserved.result.id }, publicKey);
    const accepted = await request("commitIntake", commitInput(reserved.result.id, file.bytes)); expect(accepted.ok).toBe(true);
    expect(repo.getCommittedIntake(accepted.result.id)?.actualBytes).toBe(file.bytes);
    expect(await request("reserve", reserveInput())).toMatchObject({ ok: true });
    expect(await request("getPublicStatus", { proofHash: createHash("sha256").update(accepted.result.statusProof).digest("hex"), now: "2099-10-09T10:00:00.000Z" })).toEqual({ ok: true, result: { reference: accepted.result.reference, state: "processing", acceptedAt: now } });
  });
  it("binds abort to the session and never deletes an accepted file", async () => {
    await ledger.reconcile();
    server = createWorkerRpc(repo, { socketPath: join(root, "worker.sock"), custody: ledger, sharedGid: process.getgid!(), clock }); server.listen(join(root, "worker.sock")); await once(server, "listening");
    const client = createWorkerRpcClient(join(root, "worker.sock")); const reservation = await client.reserve({ ...reserveInput(), now: utcInstant("2099-10-09T10:00:00.000Z") });
    expect(reservation.expiresAt).toBe("2026-10-10T10:00:00.000Z");
    await writeFile(intakePath(intakeRoot, reservation.id), "synthetic", { mode: 0o600 });
    await expect(client.abortIntake(reservation.id, digest("c".repeat(64)))).rejects.toThrow("INVALID_RESERVATION");
    await client.abortIntake(reservation.id, reserveInput().sessionHash); expect(await readdir(intakeRoot)).toEqual([]);
    const next = await client.reserve(reserveInput()); const file = await sealIncoming((async function* () { yield Buffer.from("synthetic"); })(), { root: intakeRoot, maxBytes: next.reservedBytes, reservationId: next.id }, publicKey);
    const accepted = await client.commitIntake({ ...commitInput(next.id, file.bytes), now: utcInstant("2099-10-09T10:00:00.000Z") }); expect(accepted.acceptedAt).toBe(now);
    await expect(client.abortIntake(next.id, reserveInput().sessionHash)).rejects.toThrow("INVALID_RESERVATION"); expect((await stat(repo.getCommittedIntake(accepted.id)!.encryptedPayloadPath)).size).toBe(file.bytes);
  });
});
function reserveInput(key = "synthetic") { return { sessionHash: digest("b".repeat(64)), idempotencyKey: key, reservedBytes: 20000, now }; }
function commitInput(id: string, bytes: number): IntakeCommit { return { reservationId: id, encryptedPayloadPath: intakePath(intakeRoot, id), actualBytes: bytes, digest: digest("a".repeat(64)), encryptedName: "ciphertext:synthetic", job: "sales-fulltime", now }; }
async function admitted(key = "synthetic") {
  const reservation = await ledger.reserve(reserveInput(key));
  const file = await sealIncoming((async function* () { yield Buffer.from("synthetic"); })(), { root: intakeRoot, maxBytes: reservation.reservedBytes, reservationId: reservation.id }, publicKey);
  return { reservation, file, input: commitInput(reservation.id, file.bytes) };
}
describe("durable custody accounting", () => {
  it("refuses abort of authoritative acceptance after an error before the committed journal update", async () => {
    await ledger.reconcile(); const pending = await admitted();
    const originalCommit = repo.commitIntake;
    // Fault only the return boundary AFTER the real SQLite transaction has committed.
    repo.commitIntake = input => { originalCommit(input); throw new Error("POST_COMMIT_FAILURE"); };
    try { await expect(ledger.commitIntake(pending.input)).rejects.toThrow("POST_COMMIT_FAILURE"); }
    finally { repo.commitIntake = originalCommit; }
    const accepted = repo.listRetainedIntakes()[0];
    expect(accepted.encryptedPayloadPath).toBe(intakePath(custodyRoot, pending.reservation.id));
    const before = await readFile(accepted.encryptedPayloadPath);
    await expect(ledger.abortIntake(pending.reservation.id, reserveInput().sessionHash)).rejects.toThrow("INVALID_RESERVATION");
    expect(await readFile(accepted.encryptedPayloadPath)).toEqual(before);
    expect(repo.getCommittedIntake(accepted.id)).toEqual(accepted);
    await ledger.reconcile();
    expect((await ledger.cleanupOrphans()).orphans).toHaveLength(0);
    expect(await readFile(accepted.encryptedPayloadPath)).toEqual(before);
  });
  it("preserves the other live upload ownership after a commit failure closes readiness", async () => {
    await ledger.reconcile(); const failing = await admitted("failing"), live = await admitted("live");
    const writer = await open(live.file.path, "r+");
    try {
      await expect(ledger.commitIntake({ ...failing.input, actualBytes: 1 })).rejects.toThrow("SIZE_MISMATCH");
      await expect(ledger.reconcile()).rejects.toThrow("CUSTODY_SCOPE_ACTIVE");
      await writer.write(Buffer.from("still live"), 0, 10, 0);
      expect((await stat(live.file.path)).ino).toBe((await writer.stat()).ino);
      await ledger.abortIntake(live.reservation.id, reserveInput().sessionHash);
      const inventory = await ledger.reconcile();
      expect(inventory.orphans).toHaveLength(1);
      expect(inventory.orphans[0].path).toBe(failing.file.path);
      await expect(ledger.reserve(reserveInput("after-drain"))).resolves.toMatchObject({ reservedBytes: 20000 });
    } finally { await writer.close(); }
  });
  it("requires successful explicit abort draining even after abort cleanup fails", async () => {
    await ledger.reconcile(); const pending = await admitted(); const ciphertext = await readFile(pending.file.path);
    await rm(pending.file.path); await symlink(join(root, "registry.sqlite"), pending.file.path);
    await expect(ledger.abortIntake(pending.reservation.id, reserveInput().sessionHash)).rejects.toThrow("UNSAFE_PATH");
    await rm(pending.file.path); await writeFile(pending.file.path, ciphertext, { mode: 0o600 });
    await expect(ledger.reconcile()).rejects.toThrow("CUSTODY_SCOPE_ACTIVE");
    await ledger.abortIntake(pending.reservation.id, reserveInput().sessionHash);
    expect((await ledger.reconcile()).orphans).toHaveLength(0);
    expect(await readdir(intakeRoot)).toEqual([]);
  });
  it("fsyncs a new worker-private accepted inode before ingress can mutate its retained descriptor", async () => {
    await ledger.reconcile(); const pending = await admitted(); const fd = await open(pending.file.path, "r+");
    const before = await readFile(pending.file.path);
    try {
      const accepted = await ledger.commitIntake(pending.input); const committed = repo.getCommittedIntake(accepted.id)!;
      expect(committed.encryptedPayloadPath.startsWith(custodyRoot + "/")).toBe(true);
      expect((await fd.stat()).ino).not.toBe((await stat(committed.encryptedPayloadPath)).ino);
      await fd.write(Buffer.from("mutated"), 0, 7, 0);
      expect(await readFile(committed.encryptedPayloadPath)).toEqual(before);
    } finally { await fd.close(); }
  });
  it("cannot enable admission via cleanup without authoritative startup reconciliation", async () => {
    await expect(ledger.cleanupOrphans()).rejects.toThrow("CUSTODY_NOT_READY");
    await expect(ledger.reserve(reserveInput())).rejects.toThrow("CUSTODY_NOT_READY");
  });
  it("refuses startup reconciliation over a live upload ticket", async () => {
    await ledger.reconcile(); const pending = await admitted();
    await expect(ledger.reconcile()).rejects.toThrow("CUSTODY_SCOPE_ACTIVE");
    await ledger.abortIntake(pending.reservation.id, reserveInput().sessionHash);
  });
  it("does not extend the first orphan cleanup deadline when recovery occurs after ticket expiry", async () => {
    await ledger.reconcile(); const pending = await admitted();
    repo.close(); repo = openRepository(join(root, "registry.sqlite")); time = new Date("2026-10-11T10:00:00.000Z");
    ledger = createCustodyLedger(repo, { intakeRoot, custodyRoot, runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock });
    expect((await ledger.reconcile()).orphans[0].cleanupAfter).toBe("2026-10-10T10:00:00.000Z");
    expect((await ledger.cleanupOrphans()).physicalBytes).toBe(0); expect(await readdir(intakeRoot)).toEqual([]); expect(pending.file.bytes).toBeGreaterThan(0);
  });
  it("rejects a foreign session before touching a reserved file", async () => {
    await ledger.reconcile(); const pending = await admitted();
    await expect(ledger.abortIntake(pending.reservation.id, digest("c".repeat(64)))).rejects.toThrow("INVALID_RESERVATION");
    expect((await stat(pending.file.path)).size).toBe(pending.file.bytes);
  });
  it("serializes commit against abort and preserves the winning committed file", async () => {
    await ledger.reconcile(); const pending = await admitted();
    const result = await Promise.allSettled([ledger.commitIntake(pending.input), ledger.abortIntake(pending.reservation.id, reserveInput().sessionHash)]);
    expect(result.map(item => item.status)).toEqual(["fulfilled", "rejected"]); expect((await stat(repo.listRetainedIntakes()[0].encryptedPayloadPath)).size).toBe(pending.file.bytes);
  });
  it("keeps reservation budget and readiness closed when abort cleanup fails", async () => {
    await ledger.reconcile(); const pending = await admitted();
    await rm(pending.file.path); await symlink(join(root, "registry.sqlite"), pending.file.path);
    await expect(ledger.abortIntake(pending.reservation.id, reserveInput().sessionHash)).rejects.toThrow("UNSAFE_PATH");
    expect(() => repo.reserve(reserveInput())).toThrow("UPLOAD_IN_PROGRESS");
    await expect(ledger.reserve(reserveInput("later"))).rejects.toThrow("CUSTODY_NOT_READY");
  });
  for (const stage of ["partial-before-fsync", "sealed-before-db", "after-db"] as const) it(`recovers after an actual killed worker at ${stage}`, async () => {
    repo.close();
    const paths = { root, intakeRoot, custodyRoot, runtimeRoot, stage, sourceRoot: process.cwd() };
    const code = `const {join}=require('node:path'); const {writeFile,readFile,open}=require('node:fs/promises'); const {generateKeyPairSync}=require('node:crypto'); const {openRepository}=require(join(p.sourceRoot,'services/applications/src/repository.ts')); const {createCustodyLedger}=require(join(p.sourceRoot,'services/applications/src/custody.ts')); const {sealIncoming,intakePath}=require(join(p.sourceRoot,'services/applications/src/crypto.ts')); (async()=>{ const repo=openRepository(join(p.root,'registry.sqlite')); const now='2026-10-09T10:00:00.000Z'; const ledger=createCustodyLedger(repo,{intakeRoot:p.intakeRoot,custodyRoot:p.custodyRoot,runtimeRoot:p.runtimeRoot,intakeUid:process.getuid(),sharedGid:process.getgid(),clock:{now:()=>new Date(now)}}); await ledger.reconcile(); const r=await ledger.reserve({sessionHash:'b'.repeat(64),idempotencyKey:'crash',reservedBytes:20000,now}); if(p.stage==='partial-before-fsync') await writeFile(intakePath(p.intakeRoot,r.id),'partial',{mode:0o600}); else { const {publicKey}=generateKeyPairSync('rsa',{modulusLength:2048}); const file=await sealIncoming((async function*(){yield Buffer.from('synthetic')})(),{root:p.intakeRoot,maxBytes:r.reservedBytes,reservationId:r.id},publicKey); if(p.stage==='after-db') { const privatePath=intakePath(p.custodyRoot,r.id); const fd=await open(privatePath,'wx',0o600); await fd.writeFile(await readFile(file.path)); await fd.sync(); await fd.close(); repo.commitIntake({reservationId:r.id,encryptedPayloadPath:privatePath,actualBytes:file.bytes,digest:'a'.repeat(64),encryptedName:'ciphertext',job:'sales-fulltime',now}); } } process.stdout.write('ready'); setInterval(()=>{},1000); })().catch(e=>{console.error(e);process.exit(1)});`;
    const child = spawn(process.execPath, ["--import", "tsx", "--eval", `const p=${JSON.stringify(paths)};${code}`], { stdio: ["ignore", "pipe", "pipe"] });
    try {
      await Promise.race([once(child.stdout!, "data"), once(child, "exit").then(() => { throw new Error("child failed before crash boundary"); })]);
      const exited = once(child, "exit"); child.kill("SIGKILL"); await exited;
      repo = openRepository(join(root, "registry.sqlite")); ledger = createCustodyLedger(repo, { intakeRoot, custodyRoot, runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock });
      const inventory = await ledger.reconcile(); expect(inventory.orphans).toHaveLength(stage === "after-db" ? 0 : 1); expect(repo.listRetainedIntakes()).toHaveLength(stage === "after-db" ? 1 : 0);
    } finally { child.kill("SIGKILL"); }
  });
  it("fails closed until reconciliation succeeds and on an unknown retained file", async () => {
    await expect(ledger.reserve(reserveInput())).rejects.toThrow("CUSTODY_NOT_READY");
    await writeFile(join(intakeRoot, "unknown.enc"), "synthetic", { mode: 0o600 });
    await expect(ledger.reconcile()).rejects.toThrow("CUSTODY_UNACCOUNTED_FILE");
    await expect(ledger.reserve(reserveInput())).rejects.toThrow("CUSTODY_NOT_READY");
  });
  it("rejects lying sizes and paths, then preserves failed upload cleanup metadata", async () => {
    await ledger.reconcile(); const { input } = await admitted();
    await expect(ledger.commitIntake({ ...input, encryptedPayloadPath: join(root, "registry.sqlite") })).rejects.toThrow("INVALID_PRIVATE_PAYLOAD");
    await expect(ledger.commitIntake({ ...input, actualBytes: 1 })).rejects.toThrow("SIZE_MISMATCH");
    const inventory = await ledger.reconcile(); expect(inventory.orphans).toHaveLength(1); expect(inventory.physicalBytes).toBeGreaterThan(input.actualBytes);
  });
  it("deletes a fresh replay file while preserving the first committed payload", async () => {
    await ledger.reconcile(); const first = await admitted(); const accepted = await ledger.commitIntake(first.input);
    const replay = await admitted(); const second = await ledger.commitIntake(replay.input);
    expect(second.reference).toBe(accepted.reference); expect(second.replayed).toBe(true);
    expect(await readdir(intakeRoot)).toEqual([]);
    expect(repo.getCommittedIntake(accepted.id)?.encryptedPayloadPath).not.toBe(first.file.path);
  });
  it("reconciles a crash before fsync or DB commit as a bounded orphan", async () => {
    await ledger.reconcile(); const reservation = await ledger.reserve(reserveInput());
    await writeFile(intakePath(intakeRoot, reservation.id), "partial", { mode: 0o600 });
    repo.close(); repo = openRepository(join(root, "registry.sqlite")); ledger = createCustodyLedger(repo, { intakeRoot, custodyRoot, runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock });
    const inventory = await ledger.reconcile(); expect(inventory.orphans).toHaveLength(1); expect(inventory.orphans[0].cleanupAfter).toBe("2026-10-10T10:00:00.000Z");
    time = new Date("2026-10-10T10:00:00.000Z"); expect((await ledger.cleanupOrphans()).physicalBytes).toBe(0);
  });
  it("reconciles a crash after fsync and DB commit using the authoritative retained manifest", async () => {
    await ledger.reconcile(); const pending = await admitted(); const privatePath = intakePath(custodyRoot, pending.reservation.id); await copyFile(pending.file.path, privatePath); const fd = await open(privatePath, "r+"); await fd.sync(); await fd.close(); const accepted = repo.commitIntake({ ...pending.input, encryptedPayloadPath: privatePath });
    repo.close(); repo = openRepository(join(root, "registry.sqlite")); ledger = createCustodyLedger(repo, { intakeRoot, custodyRoot, runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock });
    expect((await ledger.reconcile()).orphans).toHaveLength(0); expect(repo.getCommittedIntake(accepted.id)?.actualBytes).toBe(pending.file.bytes);
  });
  it("counts physical orphan bytes after ticket expiry and cannot evade 250 MiB via registry restart", async () => {
    await ledger.reconcile();
    for (let i = 0; i < 17; i++) {
      const reservation = await ledger.reserve({ ...reserveInput(String(i)), reservedBytes: 14 * 1024 * 1024 });
      const fd = await open(intakePath(intakeRoot, reservation.id), "wx", 0o600); await fd.truncate(14 * 1024 * 1024); await fd.close();
      repo.releaseReservation(reservation.id);
      // Each restart marks known-but-uncommitted files orphaned without dropping their actual disk bytes.
      ledger = createCustodyLedger(repo, { intakeRoot, custodyRoot, runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock });
      await ledger.reconcile();
    }
    time = new Date("2026-10-10T10:00:00.000Z");
    await expect(ledger.reserve({ ...reserveInput("overflow"), reservedBytes: 14 * 1024 * 1024 })).rejects.toThrow("CAPACITY_EXCEEDED");
  });
  it("fails readiness when cleanup encounters replaced symlink custody", async () => {
    await ledger.reconcile(); const pending = await admitted();
    ledger = createCustodyLedger(repo, { intakeRoot, custodyRoot, runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock }); await ledger.reconcile();
    await rm(pending.file.path); await symlink(join(root, "registry.sqlite"), pending.file.path);
    time = new Date("2026-10-10T10:00:00.000Z");
    await expect(ledger.cleanupOrphans()).rejects.toThrow("CUSTODY_UNACCOUNTED_FILE");
    await expect(ledger.reserve(reserveInput("later"))).rejects.toThrow("CUSTODY_NOT_READY");
  });
});
