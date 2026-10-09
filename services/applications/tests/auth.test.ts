import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openRepository } from "../src/repository";
import { digest } from "../src/types";
import { TOTP, Secret } from "otpauth";
import { createPasswordHasher, newFactor, openFactor, sealFactor, validPassword } from "../src/auth-crypto";
import { sessionCookie, validAdminOrigin } from "../src/auth";
import { staffId, utcInstant, type LoginResult } from "../src/types";
import { createAuthRepository } from "../src/auth-repository";
import { tokenDigest } from "../src/auth-crypto";
import { testAdmission } from "./fixtures/admission";
import type Database from "better-sqlite3";
import type { ApplicationId, CaseRecord, SensitiveAction } from "../src/types";
import { performance } from "node:perf_hooks";
// Observe (do not replace) the one actual SQLite connection so internal Task9
// composition can be tested without adding a production SQL/testing back door.
const connections = vi.hoisted(() => ({ current: undefined as Database.Database | undefined }));
vi.mock("better-sqlite3", async original => {
  const actual = await original<{ default: typeof Database }>();
  return { default: class extends actual.default { constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); connections.current = this; } } };
});

const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
let directory: string;
let repository: ReturnType<typeof openRepository>;
let time = Date.parse("2026-10-09T12:00:00.000Z");
let epoch: ReturnType<typeof digest> | null;
beforeEach(() => { time = Date.parse("2026-10-09T12:00:00.000Z"); epoch = digest("a".repeat(64)); directory = mkdtempSync(join(realpathSync(tmpdir()), "auth-synthetic-")); repository = openRepository(join(directory, "registry.sqlite"), { now: () => new Date(time) }); });
afterEach(() => { repository.close(); rmSync(directory, { recursive: true, force: true }); });

describe("named authentication ownership", () => {
  it("creates authentication only on the existing exclusive repository owner", () => {
    expect(repository.createAuthentication).toBeTypeOf("function");
    const options = { keys, rateKey: randomBytes(32), trust: { currentEpoch: () => digest("a".repeat(64)) } };
    expect(repository.createAuthentication(options)).toBeDefined();
    expect(() => repository.createAuthentication(options)).toThrow("AUTH_ALREADY_OWNED");
    expect(() => openRepository(join(directory, "registry.sqlite"))).toThrow("REPOSITORY_IN_USE");
  });
});

function successful(result: LoginResult) { if (result.kind !== "authenticated") throw new Error("expected authenticated"); return result; }
async function login(service: ReturnType<typeof auth>, uri: string, ip = "127.0.0.1") { return successful(await service.authenticate({ username: "niko", password, otp: otp(uri), trustedIp: ip })); }

describe("session and HTTP policies", () => {
  it("reports a sanitized logout failure when durable revocation fails and the bearer remains active", async () => {
    const service = auth(), setup = await enrolled(service), logged = await login(service, setup.provisioningUri), db = connections.current!;
    db.exec("CREATE TRIGGER synthetic_logout_failure BEFORE UPDATE OF revoked ON auth_sessions BEGIN SELECT RAISE(ABORT,'synthetic private storage detail'); END;");
    let failure: unknown;
    try { service.logout(logged.token); } catch (error) { failure = error; }
    expect(service.authorizeSession(logged.token, utcInstant(new Date(time).toISOString()))).not.toBeNull();
    expect(failure).toEqual(new Error("AUTH_LOGOUT_FAILED"));
    db.exec("DROP TRIGGER synthetic_logout_failure;");
    expect(() => service.logout(logged.token)).not.toThrow();
    expect(service.authorizeSession(logged.token, utcInstant(new Date(time).toISOString()))).toBeNull();
  });
  it("keeps malformed, unknown and already-revoked logout tokens idempotent without revoking another session", async () => {
    const service = auth(), setup = await enrolled(service), logged = await login(service, setup.provisioningUri);
    for (const token of ["", "malformed", randomBytes(32).toString("base64url")]) expect(() => service.logout(token)).not.toThrow();
    expect(service.authorizeSession(logged.token, utcInstant(new Date(time).toISOString()))).not.toBeNull();
    service.logout(logged.token);
    expect(() => service.logout(logged.token)).not.toThrow();
    expect(service.authorizeSession(logged.token, utcInstant(new Date(time).toISOString()))).toBeNull();
  });
  it("prunes expired auth attempts on worker maintenance without later login, preserving live limits and rollback rejection", async () => {
    const service = auth(), setup = await enrolled(service);
    await login(service, setup.provisioningUri); const first = time;
    time += 30000; await login(service, setup.provisioningUri);
    const db = connections.current!;
    time = first + 900000;
    expect(repository.pruneAdmissionEvents(utcInstant(new Date(time).toISOString()))).toBe(2);
    expect((db.prepare("SELECT COUNT(*) AS n FROM auth_attempts").get() as { n: number }).n).toBe(2);
    expect(() => repository.pruneAdmissionEvents(utcInstant(new Date(first).toISOString()))).toThrow("AUTH_DENIED");
    for (let i = 0; i < 4; i++) await service.authenticate({ username: "niko", password, otp: "wrong", trustedIp: "127.0.0.1" });
    expect((db.prepare("SELECT COUNT(*) AS n FROM auth_attempts WHERE scope='staff'").get() as { n: number }).n).toBe(5);
    expect(await service.authenticate({ username: "niko", password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.99" })).toEqual({ kind: "denied" });
  });
  it("fails closed at the IP bucket cap without evicting an active budget or allocating arbitrary usernames", async () => {
    const service = auth(), setup = await enrolled(service), db = connections.current!, at = new Date(time).toISOString();
    const insert = db.prepare("INSERT INTO auth_attempts VALUES('ip',?,?)");
    db.transaction(() => { for (let i = 0; i < 1024; i++) insert.run(i.toString(16).padStart(64, "0"), at); })();
    expect(await service.authenticate({ username: "niko", password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" })).toEqual({ kind: "denied" });
    expect((db.prepare("SELECT COUNT(*) AS n FROM auth_attempts").get() as { n: number }).n).toBe(1024);
    expect((db.prepare("SELECT COUNT(*) AS n FROM auth_staff").get() as { n: number }).n).toBe(1);
  });
  it("expires exactly at inactivity and fixed absolute deadlines without sliding the absolute deadline", async () => {
    const service = auth(), setup = await enrolled(service), result = await login(service, setup.provisioningUri);
    const issued = time;
    time += 1800000;
    expect(service.authorizeSession(result.token, utcInstant(new Date(time).toISOString()))).toBeNull();
    time = issued + 30000;
    const active = await login(service, setup.provisioningUri);
    for (let i = 0; i < 16; i++) {
      time += 1799999;
      expect(service.authorizeSession(active.token, utcInstant(new Date(time).toISOString()))).not.toBeNull();
    }
    time = Date.parse(active.session.expiresAt);
    expect(service.authorizeSession(active.token, utcInstant(new Date(time).toISOString()))).toBeNull();
  });
  it("rejects rollback, wrong CSRF/origin, logout and changed epochs", async () => {
    const service = auth(), setup = await enrolled(service), result = await login(service, setup.provisioningUri);
    expect(service.authorizeSession(result.token, utcInstant(new Date(time - 1).toISOString()))).toBeNull();
    expect(service.authorizeMutation(result.token, result.csrf, "https://trinkgut-jammers.de", "https://trinkgut-jammers.de")).not.toBeNull();
    expect(service.authorizeMutation(result.token, result.token, "https://trinkgut-jammers.de", "https://trinkgut-jammers.de")).toBeNull();
    expect(service.authorizeMutation(result.token, result.csrf, "https://attacker.invalid", "https://trinkgut-jammers.de")).toBeNull();
    expect(service.authorizeMutation(result.token, result.csrf, undefined, "https://trinkgut-jammers.de")).toBeNull();
    epoch = digest("c".repeat(64));
    expect(service.authorizeSession(result.token, utcInstant(new Date(time).toISOString()))).toBeNull();
    epoch = digest("a".repeat(64)); service.logout(result.token);
    expect(service.authorizeSession(result.token, utcInstant(new Date(time).toISOString()))).toBeNull();
    const cookie = sessionCookie(result.token, result.session.expiresAt, result.session.issuedAt);
    expect(cookie).toContain("__Host-tj-application-admin="); expect(cookie).toContain("; Secure; HttpOnly; SameSite=Strict;"); expect(cookie).not.toContain("Domain=");
    expect(validAdminOrigin("https://trinkgut-jammers.de/", "https://trinkgut-jammers.de")).toBe(false);
    vi.stubEnv("NODE_ENV", "production");
    try { expect(validAdminOrigin("http://localhost", "http://localhost")).toBe(false); } finally { vi.unstubAllEnvs(); }
  });
  it("keeps successful and failed attempts charged across restart, on staff and on IP", async () => {
    let service = auth(); const setup = await enrolled(service);
    for (let i = 0; i < 5; i++) { time += 30000; expect((await service.authenticate({ username: "niko", password, otp: otp(setup.provisioningUri), trustedIp: `127.0.0.${i + 1}` })).kind).toBe("authenticated"); }
    repository.close(); repository = openRepository(join(directory, "registry.sqlite"), { now: () => new Date(time) }); service = auth(); time += 30000;
    expect(await service.authenticate({ username: "niko", password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.9" })).toEqual({ kind: "denied" });
    for (let i = 0; i < 4; i++) expect(await service.authenticate({ username: `unknown-${i}`, password, otp: "000000", trustedIp: "127.0.0.1" })).toEqual({ kind: "denied" });
    time += 900000;
    expect((await service.authenticate({ username: "niko", password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" })).kind).toBe("authenticated");
  });
});

describe("bounded cryptography", () => {
  it("preserves exact Unicode and spaces and rejects controls, lone surrogates and size violations", async () => {
    const hasher = createPasswordHasher(), exact = "  café synthetic password  ";
    const stored = await hasher.hash(exact);
    expect(await hasher.verify(exact, stored)).toBe(true);
    expect(await hasher.verify(exact.trim(), stored)).toBe(false);
    expect(await hasher.verify(exact.normalize("NFD"), stored)).toBe(false);
    for (const value of ["short", "a".repeat(129), "x".repeat(15) + "\ud800", "x".repeat(15) + "\u0085", "x".repeat(15) + "\n"]) expect(validPassword(value)).toBe(false);
    expect(validPassword("😀".repeat(128))).toBe(true);
    expect(await hasher.verify(exact, { ...stored, N: 1 })).toBe(false);
    const other = await hasher.hash(exact); expect(other.salt).not.toBe(stored.salt); expect(other.hash).not.toBe(stored.hash);
  });
  it("authenticates encrypted factor identity/generation and rejects envelope tampering", () => {
    const secret = newFactor(), id = staffId("synthetic"), envelope = sealFactor(secret, id, 1, keys.publicKey);
    expect(openFactor(envelope, id, 1, keys.privateKey).hex).toBe(secret.hex);
    expect(() => openFactor(envelope, staffId("other"), 1, keys.privateKey)).toThrow("AUTH_DENIED");
    expect(() => openFactor(envelope, id, 2, keys.privateKey)).toThrow("AUTH_DENIED");
    const bytes = Buffer.from(envelope, "base64"); bytes[bytes.length - 1] ^= 1;
    expect(() => openFactor(bytes.toString("base64"), id, 1, keys.privateKey)).toThrow("AUTH_DENIED");
  });
  it("holds one native slot, limits the queue and expires waiting work without releasing started work", async () => {
    vi.useFakeTimers();
    let complete!: (value: Buffer) => void, starts = 0;
    const hasher = createPasswordHasher(() => { starts++; return new Promise(resolve => { complete = resolve; }); });
    try {
      const running = hasher.hash(password); await Promise.resolve();
      const queued = hasher.hash(password).catch(error => error.message), queued2 = hasher.hash(password).catch(error => error.message);
      await expect(hasher.hash(password)).rejects.toThrow("AUTH_DENIED");
      await vi.advanceTimersByTimeAsync(5000);
      expect(await queued).toBe("AUTH_DENIED"); expect(await queued2).toBe("AUTH_DENIED"); expect(starts).toBe(1);
      complete(Buffer.alloc(32, 1)); await running;
    } finally { vi.useRealTimers(); }
  });
  it("fails closed and releases the bounded slot after synchronous or asynchronous derivation failure", async () => {
    let attempt = 0;
    const hasher = createPasswordHasher(() => { attempt++; if (attempt === 1) throw new Error("synthetic native throw"); if (attempt === 2) return Promise.reject(new Error("synthetic native error")); return Promise.resolve(Buffer.alloc(32, 3)); });
    await expect(hasher.hash(password)).rejects.toThrow("AUTH_DENIED");
    await expect(hasher.hash(password)).rejects.toThrow("AUTH_DENIED");
    const stored = await hasher.hash(password); expect(stored.hash).toBe("03".repeat(32));
  });
  it("does not start expired queued KDF work even when its timeout callback has not run", async () => {
    let tick = 0, starts = 0, complete!: (value: Buffer) => void;
    const timer = vi.spyOn(performance, "now").mockImplementation(() => tick);
    const hasher = createPasswordHasher(() => { starts++; return new Promise(resolve => { complete = resolve; }); });
    try {
      const running = hasher.hash(password); await Promise.resolve();
      const queued = hasher.hash(password).catch(error => error.message);
      tick = 5001; complete(Buffer.alloc(32, 1)); await running; await Promise.resolve(); await Promise.resolve();
      expect(starts).toBe(1);
      expect(await queued).toBe("AUTH_DENIED");
    } finally { timer.mockRestore(); }
  });
});

describe("factor-only replacement", () => {
  it("rolls back generation, proof consumption and revocation if final recovery insertion fails", async () => {
    const service = auth(), setup = await enrolled(service), logged = await login(service, setup.provisioningUri); time += 30000;
    const stage = await service.beginReplacement({ password, recoveryCode: setup.recoveryCodes[0].replaceAll("-", ""), trustedIp: "127.0.0.1" }), db = connections.current!;
    db.exec("CREATE TRIGGER synthetic_recovery_failure BEFORE INSERT ON auth_recovery BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;");
    expect(() => service.finishReplacement(stage.handle, otp(stage.provisioningUri))).toThrow("synthetic failure");
    expect((db.prepare("SELECT generation FROM auth_staff").get() as { generation: number }).generation).toBe(1);
    expect((db.prepare("SELECT COUNT(*) AS n FROM auth_recovery").get() as { n: number }).n).toBe(10);
    expect(service.authorizeSession(logged.token, utcInstant(new Date(time).toISOString()))).not.toBeNull();
    db.exec("DROP TRIGGER synthetic_recovery_failure;");
    service.finishReplacement(stage.handle, otp(stage.provisioningUri));
    expect((db.prepare("SELECT generation FROM auth_staff").get() as { generation: number }).generation).toBe(2);
    expect(service.authorizeSession(logged.token, utcInstant(new Date(time).toISOString()))).toBeNull();
  });
  it("requires a fresh old TOTP and does not let interrupted, expired or epoch-stale staging replace credentials", async () => {
    const service = auth(), setup = await enrolled(service), logged = await login(service, setup.provisioningUri);
    await expect(service.beginReplacement({ password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" })).rejects.toThrow("AUTH_DENIED");
    time += 30000;
    const stage = await service.beginReplacement({ password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" });
    epoch = digest("b".repeat(64)); expect(() => service.finishReplacement(stage.handle, otp(stage.provisioningUri))).toThrow("AUTH_DENIED");
    epoch = digest("a".repeat(64)); time += 300000;
    expect(() => service.finishReplacement(stage.handle, otp(stage.provisioningUri))).toThrow("AUTH_DENIED");
    expect(service.authorizeSession(logged.token, utcInstant(new Date(time).toISOString()))).not.toBeNull();
    expect((await service.authenticate({ username: "niko", password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.2" })).kind).toBe("authenticated");
  });
  it("requires the new factor, revokes old sessions and invalidates recovery as a set", async () => {
    const service = auth(), setup = await enrolled(service), result = await login(service, setup.provisioningUri);
    time += 30000;
    const stage = await service.beginReplacement({ password, recoveryCode: setup.recoveryCodes[0].toUpperCase(), trustedIp: "127.0.0.1" });
    expect(service.authorizeSession(result.token, utcInstant(new Date(time).toISOString()))).not.toBeNull();
    expect(() => service.finishReplacement(stage.handle, "00000x")).toThrow("AUTH_DENIED");
    const replaced = service.finishReplacement(stage.handle, otp(stage.provisioningUri));
    expect(replaced.recoveryCodes).toHaveLength(10);
    expect(service.authorizeSession(result.token, utcInstant(new Date(time).toISOString()))).toBeNull();
    expect(() => service.finishReplacement(stage.handle, otp(stage.provisioningUri))).toThrow("AUTH_DENIED");
    time += 30000;
    await expect(service.beginReplacement({ password, recoveryCode: setup.recoveryCodes[1], trustedIp: "127.0.0.2" })).rejects.toThrow("AUTH_DENIED");
    expect((await service.authenticate({ username: "niko", password, otp: otp(stage.provisioningUri), trustedIp: "127.0.0.3" })).kind).toBe("authenticated");
  });
});

describe("case-bound atomic reauthentication", () => {
  function caseRecord() {
    const at = utcInstant(new Date(time).toISOString());
    const reservation = repository.reserve({ ...testAdmission(), sessionHash: digest("d".repeat(64)), idempotencyKey: "synthetic-auth-case", reservedBytes: 1, now: at });
    return repository.commitIntake({ reservationId: reservation.id, digest: digest("e".repeat(64)), actualBytes: 1, encryptedPayloadPath: join(directory, "synthetic.enc"), encryptedName: "encrypted-synthetic", job: "sales-fulltime", now: at });
  }
  function internal() {
    const db = connections.current!;
    const read = (id: ApplicationId) => { const row = db.prepare("SELECT * FROM cases WHERE id=?").get(id) as CaseRecord | undefined; if (!row) throw new Error("CASE_NOT_FOUND"); return row; };
    return { db, store: createAuthRepository(db, () => { if (!db.open) throw new Error("REPOSITORY_CLOSED"); }, read, (id, action) => repository.withCaseLock(id, action)), read };
  }
  it("shares a synchronous non-consuming authoritative preflight with final captured actor/time and preserves generic stale denial by default", async () => {
    const service = auth(), setup = await enrolled(service), logged = await login(service, setup.provisioningUri), target = caseRecord(); time += 30000;
    const action: SensitiveAction = { kind: "review", caseId: target.id, version: 1 };
    const grant = await service.authorizeSensitiveAction(logged.session, { password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" }, action);
    const { db, store } = internal(), hash = tokenDigest("grant", grant.nonce), at = () => utcInstant(new Date(time).toISOString());
    const context = store.preflight(hash, logged.session, action, () => epoch!, at);
    expect(context).toMatchObject({ actor: logged.session.staffId, now: at(), epoch, row: { version: 1 } });
    expect(context).not.toHaveProperty("then"); expect(db.inTransaction).toBe(false);
    expect(db.prepare("SELECT COUNT(*) AS n FROM auth_grants WHERE hash=?").get(hash)).toEqual({ n: 1 });
    db.prepare("UPDATE cases SET version=2 WHERE id=?").run(target.id);
    expect(() => store.preflight(hash, logged.session, action, () => epoch!, at)).toThrow("AUTH_DENIED");
    expect(() => store.preflight(hash, logged.session, action, () => epoch!, at, "CASE_STALE")).toThrow("CASE_STALE");
    expect(() => store.preflight(hash, { ...logged.session, generation: 2 }, action, () => epoch!, at, "CASE_STALE")).toThrow("AUTH_DENIED");
  });
  it("rejects consumption through another live session of the same named staff member", async () => {
    const service = auth(), setup = await enrolled(service), first = await login(service, setup.provisioningUri), target = caseRecord(); time += 30000;
    const action: SensitiveAction = { kind: "hold", caseId: target.id, version: 1 };
    const grant = await service.authorizeSensitiveAction(first.session, { password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" }, action); time += 30000;
    const second = await login(service, setup.provisioningUri), { store } = internal();
    await expect(store.withGrant(tokenDigest("grant", grant.nonce), second.session, action, () => epoch!, () => utcInstant(new Date(time).toISOString()), () => true)).rejects.toThrow("AUTH_DENIED");
  });
  it("rejects wrong case/action/version/actor, rolls back both nonce and mutation, and commits only once", async () => {
    const service = auth(), setup = await enrolled(service), logged = await login(service, setup.provisioningUri), target = caseRecord();
    time += 30000;
    const action: SensitiveAction = { kind: "reject", caseId: target.id, version: 1 };
    const grant = await service.authorizeSensitiveAction(logged.session, { password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" }, action);
    await expect(service.authorizeSensitiveAction(logged.session, { password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" }, action)).rejects.toThrow("AUTH_DENIED");
    const { db, store, read } = internal(), at = utcInstant(new Date(time).toISOString()), hash = tokenDigest("grant", grant.nonce);
    const consume = (input: SensitiveAction, actor = grant.staffId, mutation = () => { db.prepare("UPDATE cases SET version=version+1 WHERE id=?").run(target.id); db.prepare("INSERT INTO audit(caseId,event,version,at) VALUES(?,?,?,?)").run(target.id, "synthetic:grant-mutation", 2, at); return read(target.id); }) => store.withGrant(hash, { ...logged.session, staffId: actor }, input, () => epoch!, () => utcInstant(new Date(time).toISOString()), mutation);
    for (const wrong of [{ ...action, kind: "hold" as const }, { ...action, version: 2 }, { ...action, caseId: "00000000-0000-4000-8000-000000000009" as ApplicationId }]) await expect(consume(wrong)).rejects.toThrow();
    await expect(consume(action, staffId("wrong-actor"))).rejects.toThrow("AUTH_DENIED");
    await expect(consume(action, grant.staffId, () => { db.prepare("UPDATE cases SET version=version+1 WHERE id=?").run(target.id); throw new Error("synthetic rollback"); })).rejects.toThrow("synthetic rollback");
    expect(read(target.id).version).toBe(1);
    await expect(store.withGrant(hash, logged.session, action, () => epoch!, () => at, () => Promise.resolve())).rejects.toThrow("ASYNC_AUTH_MUTATION");
    expect(read(target.id).version).toBe(1);
    expect((await consume(action)).version).toBe(2);
    await expect(consume(action)).rejects.toThrow("AUTH_DENIED");
    expect((db.prepare("SELECT COUNT(*) AS n FROM audit WHERE event='synthetic:grant-mutation'").get() as { n: number }).n).toBe(1);
  });
  it("uses the real case exclusion, rechecks live authority, and rejects expired or revoked grants", async () => {
    const service = auth(), setup = await enrolled(service), logged = await login(service, setup.provisioningUri), target = caseRecord(); time += 30000;
    const action: SensitiveAction = { kind: "hold", caseId: target.id, version: 1 };
    const grant = await service.authorizeSensitiveAction(logged.session, { password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" }, action);
    const { store } = internal(); let release!: () => void, mutated = false;
    const held = repository.withCaseLock(target.id, async () => new Promise<void>(resolve => { release = resolve; }));
    await Promise.resolve();
    const consuming = store.withGrant(tokenDigest("grant", grant.nonce), logged.session, action, () => epoch!, () => utcInstant(new Date(time).toISOString()), () => { mutated = true; });
    await Promise.resolve(); expect(mutated).toBe(false);
    service.logout(logged.token); release(); await held;
    await expect(consuming).rejects.toThrow("AUTH_DENIED"); expect(mutated).toBe(false);
  });
  it("checks expiry after waiting for case exclusion, not at initial enqueue", async () => {
    const service = auth(), setup = await enrolled(service), logged = await login(service, setup.provisioningUri), target = caseRecord(); time += 30000;
    const action: SensitiveAction = { kind: "hold", caseId: target.id, version: 1 };
    const grant = await service.authorizeSensitiveAction(logged.session, { password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" }, action);
    const { store } = internal(); let release!: () => void, mutated = false;
    const held = repository.withCaseLock(target.id, async () => new Promise<void>(resolve => { release = resolve; })); await Promise.resolve();
    const consuming = store.withGrant(tokenDigest("grant", grant.nonce), logged.session, action, () => epoch!, () => utcInstant(new Date(time).toISOString()), () => { mutated = true; });
    time += 300000; release(); await held;
    await expect(consuming).rejects.toThrow("AUTH_DENIED"); expect(mutated).toBe(false);
  });
});

const password = "Synthetic password only 2026";
function auth() { return repository.createAuthentication({ keys, rateKey: Buffer.alloc(32, 7), trust: { currentEpoch: () => epoch } }); }
function otp(uri: string) { return TOTP.generate({ secret: Secret.fromBase32(new URL(uri).searchParams.get("secret")!), algorithm: "SHA1", digits: 6, period: 30, timestamp: time }); }
async function enrolled(service: ReturnType<typeof auth>) {
  const stage = await service.beginEnrollment(password, password);
  const result = service.finishEnrollment(stage.handle, otp(stage.provisioningUri));
  time += 30000;
  return { ...stage, ...result };
}

describe("real password and factor proof", () => {
  it("does not consume TOTP when session insertion rolls back, and consumes it durably on success", async () => {
    let service = auth(); const setup = await enrolled(service), db = connections.current!;
    db.exec("CREATE TRIGGER synthetic_session_failure BEFORE INSERT ON auth_sessions BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;");
    expect(await service.authenticate({ username: "niko", password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" })).toEqual({ kind: "denied" });
    db.exec("DROP TRIGGER synthetic_session_failure;"); const logged = await login(service, setup.provisioningUri);
    repository.close(); repository = openRepository(join(directory, "registry.sqlite"), { now: () => new Date(time) }); service = auth();
    expect(service.authorizeSession(logged.token, utcInstant(new Date(time).toISOString()))).not.toBeNull();
    expect(await service.authenticate({ username: "niko", password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.2" })).toEqual({ kind: "denied" });
  });
  it.each([undefined, { currentEpoch: () => null }, { currentEpoch: () => "bad" }, { currentEpoch: () => { throw new Error("synthetic"); } }])("fails closed for absent, malformed or throwing trust provider (%#)", async trust => {
    const service = repository.createAuthentication({ keys, rateKey: Buffer.alloc(32, 7), trust: trust as Parameters<typeof repository.createAuthentication>[0]["trust"] });
    expect(await service.authenticate({ username: "niko", password, otp: "000000", trustedIp: "127.0.0.1" })).toEqual({ kind: "denied" });
    await expect(service.beginEnrollment(password, password)).rejects.toThrow("AUTH_DENIED");
    await expect(service.beginReplacement({ password, otp: "000000", trustedIp: "127.0.0.1" })).rejects.toThrow("AUTH_DENIED");
  });
  it("rejects adjacent-step and non-ASCII OTP, and never persists raw credentials or bearer material", async () => {
    const service = auth(), setup = await enrolled(service), previous = time - 30000;
    const secret = Secret.fromBase32(new URL(setup.provisioningUri).searchParams.get("secret")!);
    const old = TOTP.generate({ secret, algorithm: "SHA1", digits: 6, period: 30, timestamp: previous });
    for (const token of [old, "１２３４５６"]) expect(await service.authenticate({ username: "niko", password, otp: token, trustedIp: "127.0.0.1" })).toEqual({ kind: "denied" });
    const logged = await login(service, setup.provisioningUri), db = connections.current!;
    const rows = JSON.stringify([db.prepare("SELECT * FROM auth_staff").all(), db.prepare("SELECT * FROM auth_sessions").all(), db.prepare("SELECT * FROM auth_recovery").all(), db.prepare("SELECT * FROM auth_attempts").all()]);
    for (const raw of [password, secret.base32, logged.token, logged.csrf, ...setup.recoveryCodes, "127.0.0.1"]) expect(rows.includes(raw)).toBe(false);
    expect(Object.keys(logged.session).sort()).toEqual(["expiresAt", "generation", "issuedAt", "sessionId", "staffId"]);
  });
  it("rechecks disabled identity after hashing and rejects sessions/recovery even if credentials match", async () => {
    const service = auth(), setup = await enrolled(service), logged = await login(service, setup.provisioningUri); time += 30000;
    const attempt = service.authenticate({ username: "niko", password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" });
    connections.current!.prepare("UPDATE auth_staff SET enabled=0").run();
    expect(await attempt).toEqual({ kind: "denied" });
    expect(service.authorizeSession(logged.token, utcInstant(new Date(time).toISOString()))).toBeNull();
    await expect(service.beginReplacement({ password, recoveryCode: setup.recoveryCodes[0], trustedIp: "127.0.0.1" })).rejects.toThrow("AUTH_DENIED");
  });
  it("requires TOTP, rejects replay and never grants mailbox-derived administration", async () => {
    const service = auth(), setup = await enrolled(service);
    expect(await service.authenticate({ username: "niko", password, otp: "", trustedIp: "127.0.0.1" })).toEqual({ kind: "denied" });
    expect(await service.authenticate({ username: "ordinary-mailbox-reader", password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.2" })).toEqual({ kind: "denied" });
    const result = await service.authenticate({ username: "niko", password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" });
    expect(result.kind).toBe("authenticated");
    expect(await service.authenticate({ username: "niko", password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" })).toEqual({ kind: "denied" });
    expect(setup.recoveryCodes).toHaveLength(10);
  });
  it("does not activate unconfirmed or mismatched enrollment, and consumes the confirming step", async () => {
    const service = auth();
    await expect(service.beginEnrollment(password, password + " ")).rejects.toThrow("AUTH_DENIED");
    const stage = await service.beginEnrollment(password, password);
    expect(() => service.finishEnrollment(stage.handle, "wrong")).toThrow("AUTH_DENIED");
    service.finishEnrollment(stage.handle, otp(stage.provisioningUri));
    expect(await service.authenticate({ username: "niko", password, otp: otp(stage.provisioningUri), trustedIp: "127.0.0.1" })).toEqual({ kind: "denied" });
    await expect(service.beginEnrollment(password, password)).rejects.toThrow("AUTH_DENIED");
  });
  it("denies missing or changed independent trust before and after asynchronous proof", async () => {
    const service = auth(); epoch = null;
    await expect(service.beginEnrollment(password, password)).rejects.toThrow("AUTH_DENIED");
    epoch = digest("a".repeat(64)); const setup = await enrolled(service);
    const pending = service.authenticate({ username: "niko", password, otp: otp(setup.provisioningUri), trustedIp: "127.0.0.1" });
    epoch = digest("b".repeat(64)); expect(await pending).toEqual({ kind: "denied" });
  });
});
