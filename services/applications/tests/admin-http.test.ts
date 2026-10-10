import { afterEach, describe, expect, it, vi } from "vitest";
import { request as httpRequest, type IncomingHttpHeaders, type Server } from "node:http";
import { connect } from "node:net";
import { once } from "node:events";
import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { Secret, TOTP } from "otpauth";
import type Database from "better-sqlite3";
import { createAdminServer } from "../src/admin-http";
import { openReadyTestRepository, testAdmission } from "./fixtures/admission";
import { applicationId, digest, utcInstant, type ApplicationAuth, type ApplicationRepository } from "../src/types";

const connections = vi.hoisted(() => ({ current: undefined as Database.Database | undefined }));
vi.mock("better-sqlite3", async original => {
  const actual = await original<{ default: typeof Database }>();
  return { default: class extends actual.default { constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); connections.current = this; } } };
});

const origin = "https://admin.example.invalid", prefix = "/api/bewerbungsverwaltung/";
const metadata = { origin, "sec-fetch-site": "same-origin", "sec-fetch-mode": "cors", "sec-fetch-dest": "empty", "x-application-client-ip": "192.0.2.1" };
const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const password = "  Synthetic password only 2026  ";
let server: Server | undefined, repo: ApplicationRepository | undefined, directory: string | undefined;
let time = Date.parse("2026-10-09T12:00:00.000Z");
const clock = { now: () => new Date(time) };
const events: string[] = [];
type Reply = { status: number; headers: IncomingHttpHeaders; body: Record<string, unknown> | null; text: string };
function deniedAuth(): ApplicationAuth {
  const fail = () => { throw new Error("UNEXPECTED_AUTH_CALL private canary"); };
  return { authenticate: vi.fn(async () => ({ kind: "denied" as const })), authorizeSession: vi.fn(() => null), authorizeMutation: vi.fn(() => null), authorizeSensitiveAction: vi.fn(fail), logout: vi.fn(), beginEnrollment: vi.fn(fail), finishEnrollment: vi.fn(fail), beginReplacement: vi.fn(fail), finishReplacement: vi.fn(fail) };
}
async function start(auth = deniedAuth()) {
  server = createAdminServer({ auth, origin, clock, proxy: { peer: "loopback", clientIpHeader: "x-application-client-ip" }, operationalEvent: code => events.push(code) });
  server.listen(0, "127.0.0.1"); await once(server, "listening"); return auth;
}
function port() { const address = server!.address(); if (!address || typeof address === "string") throw new Error("TEST_ADDRESS"); return address.port; }
function request(route: string, options: { method?: string; headers?: Record<string, string | undefined>; body?: string | Buffer } = {}): Promise<Reply> {
  const method = options.method ?? (route === "session" ? "GET" : "POST"), body = options.body ?? (method === "GET" || method === "HEAD" ? undefined : "{}");
  const headers = { ...metadata, ...(body === undefined ? {} : { "content-type": "application/json", "content-length": String(Buffer.byteLength(body)) }), ...options.headers };
  return new Promise((resolve, reject) => {
    const client = httpRequest({ host: "127.0.0.1", port: port(), path: route.startsWith("/") ? route : prefix + route, method, headers: Object.fromEntries(Object.entries(headers).filter(([, value]) => value !== undefined)) }, response => {
      const chunks: Buffer[] = []; response.on("data", chunk => chunks.push(chunk)); response.on("end", () => { const text = Buffer.concat(chunks).toString("utf8"); resolve({ status: response.statusCode!, headers: response.headers, text, body: text ? JSON.parse(text) : null }); });
    }); client.on("error", reject); client.end(body);
  });
}
function raw(message: string | Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = connect(port(), "127.0.0.1"), chunks: Buffer[] = [];
    socket.on("connect", () => socket.write(message)); socket.on("data", chunk => chunks.push(chunk)); socket.on("error", error => { if (!chunks.length) reject(error); }); socket.on("close", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}
const rawHeaders = Object.entries(metadata).map(([key, value]) => `${key}: ${value}`).join("\r\n");
function frame(extra = "", body = "{}", route = "logout") { return `POST ${prefix}${route} HTTP/1.1\r\nHost: local\r\n${rawHeaders}\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\n${extra}\r\n${body}`; }
function privateReply(reply: Reply) {
  expect(reply.headers).toMatchObject({ "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff", "x-robots-tag": "noindex, nofollow", connection: "close", "content-length": String(Buffer.byteLength(reply.text)) });
  expect(reply.headers["access-control-allow-origin"]).toBeUndefined();
}
async function actual() {
  time = Date.parse("2026-10-09T12:00:00.000Z"); directory = mkdtempSync(join(realpathSync(tmpdir()), "admin-http-synthetic-"));
  repo = await openReadyTestRepository(join(directory, "registry.sqlite"), clock);
  const epoch = digest("a".repeat(64));
  const auth = repo.createAuthentication({ keys, rateKey: Buffer.alloc(32, 7), trust: { currentEpoch: () => epoch }, initialEnrollmentEpoch: () => epoch });
  const stage = await auth.beginEnrollment(password, password);
  const otp = () => TOTP.generate({ secret: Secret.fromBase32(new URL(stage.provisioningUri).searchParams.get("secret")!), algorithm: "SHA1", digits: 6, period: 30, timestamp: time });
  auth.finishEnrollment(stage.handle, otp()); time += 30000; await start(auth);
  return { auth, otp, login: () => request("login", { body: JSON.stringify({ username: "niko", password, otp: otp() }) }) };
}
afterEach(async () => {
  vi.useRealTimers();
  if (server?.listening) { server.closeAllConnections(); await new Promise<void>(resolve => server!.close(() => resolve())); }
  server = undefined; repo?.close(); repo = undefined;
  if (directory) rmSync(directory, { recursive: true, force: true }); directory = undefined;
  events.length = 0; vi.restoreAllMocks();
});

describe("admin auth HTTP envelope", () => {
  it("exposes only the four exact auth routes and never provisioning, cases, queries or aliases", async () => {
    const auth = await start();
    for (const path of ["cases", "enroll", "recovery", "login/", "login?x=1", "%6cogin", "login#x", "/api/bewerbung/login"]) {
      const response = await request(path); expect(response.status).toBe(404); privateReply(response);
    }
    expect(auth.authenticate).not.toHaveBeenCalled(); expect(auth.logout).not.toHaveBeenCalled();
  });
  it.each(["GET", "HEAD", "OPTIONS", "PUT"])("never mutates through %s and sends exact Allow", async method => {
    const auth = await start();
    for (const route of ["login", "logout", "reauth"]) { const response = await request(route, { method }); expect(response.status).toBe(405); expect(response.headers.allow).toBe("POST"); }
    expect((await request("session", { method: "POST" })).headers.allow).toBe("GET");
    expect(auth.authenticate).not.toHaveBeenCalled(); expect(auth.logout).not.toHaveBeenCalled();
  });
  it.each([
    { origin: undefined }, { origin: "https://evil.invalid" }, { origin: origin + "/" },
    { "sec-fetch-site": undefined }, { "sec-fetch-site": "cross-site" }, { "sec-fetch-mode": "navigate" }, { "sec-fetch-dest": "document" },
    { authorization: "Bearer private-canary" }, { "x-application-client-ip": undefined }, { "x-application-client-ip": "192.0.2.1, 192.0.2.2" },
    { "x-application-client-ip": "::ffff:192.0.2.1" }, { "x-application-client-ip": "2001:0db8::1" }, { "x-application-client-ip": "fe80::1%lo0" },
  ])("rejects untrusted transport %# without calling auth", async headers => {
    const auth = await start(); const response = await request("login", { headers });
    expect(response.status).toBe(403); expect(response.body).toEqual({ code: "FORBIDDEN", error: "Anfrage nicht erlaubt." }); privateReply(response);
    expect(auth.authenticate).not.toHaveBeenCalled();
  });
  it.each(["Origin", "Sec-Fetch-Site", "Sec-Fetch-Mode", "Sec-Fetch-Dest", "Cookie", "Authorization", "X-Application-Admin-CSRF", "X-Application-Client-IP", "Content-Type", "Content-Encoding"])("rejects duplicate raw %s headers", async name => {
    const auth = await start(); const duplicate = ["Origin", "Sec-Fetch-Site", "Sec-Fetch-Mode", "Sec-Fetch-Dest", "X-Application-Client-IP", "Content-Type"].includes(name) ? `${name}: ignored\r\n` : `${name}: ignored\r\n${name}: ignored\r\n`;
    expect(await raw(frame(duplicate))).toContain("403 Forbidden"); expect(auth.logout).not.toHaveBeenCalled();
  });
  it.each(["Content-Length: 2\r\n", "Transfer-Encoding: chunked\r\n", "Content-Encoding: gzip\r\n", "Expect: 100-continue\r\n"])("rejects invalid raw framing %s with sanitized private JSON", async extra => {
    const auth = await start(); const result = await raw(frame(extra));
    expect(result).toContain("400 Bad Request"); expect(result).toContain('"code":"INVALID_REQUEST"'); expect(result.toLowerCase()).toContain("x-robots-tag: noindex, nofollow");
    expect(auth.logout).not.toHaveBeenCalled();
  });
  it.each(['{"username":"a","username":"b"}', '{"username":"a","user\\u006eame":"b"}', '[]', '{"password":{}}', '{"staffId":"injected"}', '{"password":3}', '{"otp":null}', '{"password":"' + "x".repeat(257) + '"}'])("rejects invalid or duplicate credential JSON %#", async body => {
    const auth = await start(); expect((await request("login", { body })).status).toBe(400); expect(auth.authenticate).not.toHaveBeenCalled();
  });
  it("bounds streaming bytes, UTF8, content type and GET bodies before auth", async () => {
    const auth = await start();
    expect((await request("login", { body: Buffer.from([0xc3, 0x28]) })).status).toBe(400);
    expect((await request("login", { body: " ".repeat(8193), headers: { "content-length": undefined, "transfer-encoding": "chunked" } })).status).toBe(413);
    expect((await request("login", { headers: { "content-type": "application/json; charset=latin1" } })).status).toBe(400);
    expect((await request("session", { body: "x" })).status).toBe(400);
    expect(auth.authenticate).not.toHaveBeenCalled(); expect(auth.authorizeSession).not.toHaveBeenCalled();
  });
  it("keeps cookies canonical and singleton without decoding or unquoting", async () => {
    const auth = await start(); const canonical = Buffer.alloc(32, 1).toString("base64url");
    expect((await request("logout", { headers: { cookie: `__Host-tj-application-admin=${canonical}; __Host-tj-application-admin=${canonical}` } })).status).toBe(403);
    for (const cookie of [`__Host-tj-application-admin="${canonical}"`, "__Host-tj-application-admin=%41", "other=bounded"]) {
      expect((await request("session", { headers: { cookie, origin: undefined } })).status).toBe(401);
      expect((await request("logout", { headers: { cookie } })).status).toBe(200);
    }
    expect(auth.logout).toHaveBeenCalledWith("");
    expect((await request("logout", { headers: { cookie: "other=" + "x".repeat(8192) } })).status).toBe(403);
  });
  it("maps all denied logins including missing second factor identically without trimming credentials", async () => {
    const auth = await start(); const response = await request("login", { body: '{"username":" niko ","password":"  exact  "}' });
    expect(auth.authenticate).toHaveBeenCalledWith({ username: " niko ", password: "  exact  ", otp: "", trustedIp: "192.0.2.1" });
    expect(response.status).toBe(401); expect(response.body).toEqual({ code: "AUTH_DENIED", error: "Anmeldung erforderlich oder nicht möglich." }); privateReply(response);
  });
});

describe("real owner authentication across HTTP", () => {
  it("never overwrites a canonical logout retry handle with a new login", async () => {
    const fixture = await actual(), logged = await fixture.login(), cookie = logged.headers["set-cookie"]![0].split(";")[0];
    time += 30000;
    const response = await request("login", { headers: { cookie }, body: JSON.stringify({ username: "niko", password, otp: fixture.otp() }) });
    expect(response.status).toBe(403); expect(response.headers["set-cookie"]).toBeUndefined();
    expect((await request("session", { headers: { cookie } })).status).toBe(200);
  });
  it("uses actual password/TOTP and secure cookies, projects only times/CSRF and never renews on session reads", async () => {
    const fixture = await actual();
    expect((await request("login", { body: JSON.stringify({ username: "niko", password }) })).status).toBe(401);
    const login = await fixture.login(); expect(login.status).toBe(200); privateReply(login);
    expect(Object.keys(login.body!).sort()).toEqual(["authenticated", "csrf", "expiresAt", "issuedAt"]);
    const cookie = login.headers["set-cookie"]![0]; expect(cookie).toContain("; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800;"); expect(cookie).not.toContain("Domain=");
    const session = await request("session", { headers: { cookie: cookie.split(";")[0], origin: undefined } });
    expect(session.status).toBe(200); expect(Object.keys(session.body!).sort()).toEqual(["authenticated", "expiresAt", "issuedAt"]); expect(session.headers["set-cookie"]).toBeUndefined();
    expect(login.text + session.text).not.toContain(password); expect(login.text + session.text).not.toContain("staffId");
  });
  it("preserves the logout handle on real durable revocation failure and supports explicit same-cookie retry", async () => {
    const fixture = await actual(), logged = await fixture.login(), cookie = logged.headers["set-cookie"]![0].split(";")[0];
    connections.current!.exec("CREATE TRIGGER synthetic_logout_failure BEFORE UPDATE OF revoked ON auth_sessions BEGIN SELECT RAISE(ABORT,'private storage canary'); END;");
    const failed = await request("logout", { headers: { cookie } });
    expect(failed.status).toBe(503); expect(failed.body).toEqual({ code: "AUTH_LOGOUT_FAILED", error: "Abmeldung serverseitig nicht bestätigt. Bitte erneut versuchen oder den Verantwortlichen kontaktieren.", retryAfterSeconds: 60 });
    expect(failed.headers["set-cookie"]).toBeUndefined(); expect(failed.text).not.toContain("canary");
    expect((await request("session", { headers: { cookie } })).status).toBe(200);
    connections.current!.exec("DROP TRIGGER synthetic_logout_failure;");
    const completed = await request("logout", { headers: { cookie } }); expect(completed.status).toBe(200); expect(completed.body).toEqual({ loggedOut: true }); expect(completed.headers["set-cookie"]![0]).toContain("Max-Age=0");
    expect((await request("session", { headers: { cookie } })).status).toBe(401);
    expect((await request("logout", { headers: { cookie } })).status).toBe(200);
  });
  it("keeps reload without CSRF locked and still permits revocation of expired sessions", async () => {
    const fixture = await actual(), logged = await fixture.login(), cookie = logged.headers["set-cookie"]![0].split(";")[0];
    const body = JSON.stringify({ password, otp: fixture.otp(), action: { kind: "review", caseId: applicationId("11111111-1111-4111-8111-111111111111"), version: 1 } });
    expect((await request("reauth", { headers: { cookie }, body })).status).toBe(403);
    time += 1800000;
    expect((await request("session", { headers: { cookie } })).status).toBe(401);
    expect((await request("logout", { headers: { cookie } })).status).toBe(200);
    expect(fixture.auth.authorizeSession(cookie.split("=")[1], utcInstant(new Date(time).toISOString()))).toBeNull();
  });
  it("projects a real action-bound grant without completing the case and collapses stale/OTP denial", async () => {
    const fixture = await actual(), logged = await fixture.login(), cookie = logged.headers["set-cookie"]![0].split(";")[0];
    const at = utcInstant(new Date(time).toISOString());
    const reservation = repo!.reserve({ ...testAdmission(), sessionHash: digest("d".repeat(64)), idempotencyKey: "synthetic-admin-http-case", reservedBytes: 1, now: at });
    const target = repo!.commitIntake({ reservationId: reservation.id, digest: digest("e".repeat(64)), actualBytes: 1, encryptedPayloadPath: join(directory!, "synthetic.enc"), encryptedName: "encrypted-synthetic", job: "sales-fulltime", now: at });
    time += 30000;
    const headers = { cookie, "x-application-admin-csrf": logged.body!.csrf as string };
    const body = (version = 1) => JSON.stringify({ password, otp: fixture.otp(), action: { kind: "review", caseId: target.id, version } });
    const response = await request("reauth", { headers, body: body() }); expect(response.status).toBe(200); privateReply(response);
    const grant = response.body!.grant as Record<string, unknown>;
    expect(Object.keys(grant).sort()).toEqual(["action", "expiresAt", "issuedAt", "nonce"]);
    expect(grant.action).toEqual({ kind: "review", caseId: target.id, version: 1 }); expect(grant.nonce).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Date.parse(grant.expiresAt as string) - Date.parse(grant.issuedAt as string)).toBe(300000);
    expect((await repo!.withCaseLock(target.id, async row => row)).version).toBe(1);
    const replay = await request("reauth", { headers, body: body() }); expect(replay.status).toBe(403); expect(replay.body).toEqual({ code: "REAUTH_REQUIRED", error: "Erneute Bestätigung erforderlich." });
    time += 30000; const stale = await request("reauth", { headers, body: body(2) }); expect(stale.status).toBe(403); expect(stale.body).toEqual(replay.body);
    expect((await request("reauth", { headers: { ...headers, "x-application-admin-csrf": Buffer.alloc(32, 2).toString("base64url") }, body: body() })).status).toBe(403);
  });
});

describe("auth resource ownership", () => {
  it("enforces the absolute response deadline even when a synchronous dependency delays timer callbacks", async () => {
    const fixture = await actual(), logged = await fixture.login(), cookie = logged.headers["set-cookie"]![0].split(";")[0], authorize = fixture.auth.authorizeSession.bind(fixture.auth);
    let tick = 0; vi.spyOn(performance, "now").mockImplementation(() => tick);
    vi.spyOn(fixture.auth, "authorizeSession").mockImplementation((...args) => { const session = authorize(...args); tick = 10001; return session; });
    const response = await request("session", { headers: { cookie } }); expect(response.status).toBe(408); expect(response.body!.code).toBe("REQUEST_TIMEOUT");
  });
  it("checks the absolute header deadline before accepting late headers even when its timer has not fired", async () => {
    let tick = 0; vi.spyOn(performance, "now").mockImplementation(() => tick); const auth = await start();
    const accepted = once(server!, "connection"), socket = connect(port(), "127.0.0.1"); await accepted;
    const result = new Promise<string>(resolve => { let text = ""; socket.on("data", chunk => { text += chunk; }); socket.on("close", () => resolve(text)); });
    tick = 5001; socket.write(frame());
    expect(await result).toContain("408 Request Timeout"); expect(auth.logout).not.toHaveBeenCalled();
  });
  it("checks duplicate Expect before the expectation rejection and keeps a bare duplicate cookie ambiguous", async () => {
    const auth = await start();
    expect(await raw(frame("Expect: 100-continue\r\nExpect: 100-continue\r\n"))).toContain("403 Forbidden");
    const cookie = `__Host-tj-application-admin; __Host-tj-application-admin=${Buffer.alloc(32, 1).toString("base64url")}`;
    expect((await request("logout", { headers: { cookie } })).status).toBe(403);
    expect(auth.logout).not.toHaveBeenCalled();
  });
  it("retains three credential slots after timeout and holds server close through actual late-login revocation", async () => {
    const fixture = await actual();
    const authenticate = fixture.auth.authenticate.bind(fixture.auth), logout = fixture.auth.logout.bind(fixture.auth);
    let release!: () => void, started!: () => void, cleanupStarted!: () => void, finishCleanup!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), entered = new Promise<void>(resolve => { started = resolve; });
    const cleanup = new Promise<void>(resolve => { cleanupStarted = resolve; }), cleanupGate = new Promise<void>(resolve => { finishCleanup = resolve; });
    let token = "";
    vi.spyOn(fixture.auth, "authenticate").mockImplementation(async input => {
      const result = await authenticate(input); if (result.kind === "authenticated") token = result.token;
      started(); await gate; return result;
    });
    vi.spyOn(fixture.auth, "logout").mockImplementation((async value => { cleanupStarted(); await cleanupGate; logout(value); }) as ApplicationAuth["logout"]);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const pending = fixture.login(); await entered; await vi.advanceTimersByTimeAsync(10000);
    const timeout = await pending; expect(timeout.status).toBe(408); expect(timeout.body).toEqual({ code: "REQUEST_TIMEOUT", error: "Zeitlimit erreicht. Der Ausgang ist unklar." }); expect(timeout.headers["set-cookie"]).toBeUndefined();
    let closed = false; server!.close(() => { closed = true; }); release(); await cleanup;
    await new Promise<void>(resolve => setImmediate(resolve)); expect(closed).toBe(false);
    expect(fixture.auth.authorizeSession(token, utcInstant(new Date(time).toISOString()))).not.toBeNull();
    finishCleanup(); await once(server!, "close");
    expect(closed).toBe(true); expect(fixture.auth.authorizeSession(token, utcInstant(new Date(time).toISOString()))).toBeNull();
    expect(events).toEqual([]);
  });
  it("rejects the fourth credential call after three timeouts until those calls actually settle", async () => {
    const auth = deniedAuth(); let release!: () => void, entered!: () => void, calls = 0;
    const gate = new Promise<void>(resolve => { release = resolve; }), three = new Promise<void>(resolve => { entered = resolve; });
    vi.mocked(auth.authenticate).mockImplementation(async () => { if (++calls === 3) entered(); await gate; return { kind: "denied" }; });
    await start(auth); vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const pending = [request("login"), request("login"), request("login")]; await three;
    expect((await request("login")).status).toBe(429); expect(calls).toBe(3);
    await vi.advanceTimersByTimeAsync(10000); expect((await Promise.all(pending)).map(reply => reply.status)).toEqual([408, 408, 408]);
    expect((await request("login")).status).toBe(429); expect(calls).toBe(3);
    release(); await new Promise<void>(resolve => setImmediate(resolve));
    expect((await request("login")).status).toBe(401); expect(calls).toBe(4);
  });
  it("limits global admission to120 per monotonic minute independently of wall time", async () => {
    let tick = 0; vi.spyOn(performance, "now").mockImplementation(() => tick); const auth = await start();
    for (let i = 0; i < 120; i++) expect((await request("logout")).status).toBe(200);
    time += 24 * 60 * 60 * 1000;
    const blocked = await request("logout"); expect(blocked.status).toBe(429); expect(blocked.headers["retry-after"]).toBe("60"); expect(auth.logout).toHaveBeenCalledTimes(120);
    tick = 60000; expect((await request("logout")).status).toBe(200);
  });
  it("bounds slow-body handlers to8 without queueing a ninth", async () => {
    const auth = await start(), clients: ReturnType<typeof connect>[] = []; let admitted = 0, filled!: () => void;
    const eight = new Promise<void>(resolve => { filled = resolve; }); server!.on("request", () => { if (++admitted === 8) filled(); });
    for (let i = 0; i < 8; i++) { const socket = connect(port(), "127.0.0.1"); socket.on("error", () => {}); socket.on("connect", () => socket.write(frame().slice(0, -2))); clients.push(socket); }
    await eight; expect((await request("logout")).status).toBe(429); expect(auth.logout).not.toHaveBeenCalled();
    clients.forEach(client => client.destroy());
  });
  it("limits idle sockets to32 and expires incomplete headers after5seconds", async () => {
    await start(); const clients: ReturnType<typeof connect>[] = []; vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    for (let i = 0; i < 32; i++) { const accepted = once(server!, "connection"), socket = connect(port(), "127.0.0.1"); socket.on("error", () => {}); clients.push(socket); await accepted; }
    expect(await raw(frame())).toContain("429 Too Many Requests");
    const response = new Promise<string>(resolve => { let text = ""; clients[0].on("data", chunk => { text += chunk; }); clients[0].on("close", () => resolve(text)); });
    await vi.advanceTimersByTimeAsync(5000); expect(await response).toContain("408 Request Timeout");
    clients.forEach(client => client.destroy());
  });
  it("revokes an actual successful login after disconnect and reports only a fixed code if cleanup fails", async () => {
    const fixture = await actual(), original = fixture.auth.authenticate.bind(fixture.auth), logout = fixture.auth.logout.bind(fixture.auth);
    let release!: () => void, started!: () => void, cleaned!: () => void, token = "";
    const gate = new Promise<void>(resolve => { release = resolve; }), entered = new Promise<void>(resolve => { started = resolve; }), cleanup = new Promise<void>(resolve => { cleaned = resolve; });
    vi.spyOn(fixture.auth, "authenticate").mockImplementation(async input => { const result = await original(input); if (result.kind === "authenticated") token = result.token; started(); await gate; return result; });
    vi.spyOn(fixture.auth, "logout").mockImplementation(value => { try { logout(value); } finally { cleaned(); } });
    const socket = connect(port(), "127.0.0.1"); socket.on("error", () => {});
    socket.on("connect", () => socket.write(frame("", JSON.stringify({ username: "niko", password, otp: fixture.otp() }), "login")));
    await entered; socket.destroy(); await once(socket, "close"); await new Promise<void>(resolve => setImmediate(resolve));
    connections.current!.exec("CREATE TRIGGER synthetic_late_logout_failure BEFORE UPDATE OF revoked ON auth_sessions BEGIN SELECT RAISE(ABORT,'private cleanup canary'); END;");
    release(); await cleanup; await new Promise<void>(resolve => setImmediate(resolve));
    expect(events).toEqual(["AUTH_LATE_LOGOUT_FAILED"]);
    // A recorded failure is not a claim of revocation; the real session remains.
    expect(fixture.auth.authorizeSession(token, utcInstant(new Date(time).toISOString()))).not.toBeNull();
    connections.current!.exec("DROP TRIGGER synthetic_late_logout_failure;"); logout(token);
  });
  it("times out an ambiguous logout without expiring its handle and lets explicit retry confirm revocation", async () => {
    const fixture = await actual(), logged = await fixture.login(), cookie = logged.headers["set-cookie"]![0].split(";")[0], logout = fixture.auth.logout.bind(fixture.auth);
    let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), started = new Promise<void>(resolve => { entered = resolve; });
    vi.spyOn(fixture.auth, "logout").mockImplementationOnce((async value => { entered(); await gate; logout(value); }) as ApplicationAuth["logout"]);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const pending = request("logout", { headers: { cookie } }); await started; await vi.advanceTimersByTimeAsync(10000);
    const timeout = await pending; expect(timeout.status).toBe(408); expect(timeout.headers["set-cookie"]).toBeUndefined();
    release(); await new Promise<void>(resolve => setImmediate(resolve));
    const retry = await request("logout", { headers: { cookie } }); expect(retry.status).toBe(200); expect(retry.headers["set-cookie"]![0]).toContain("Max-Age=0");
  });
  it("keeps unexpected dependency failures private and rejects header overflow through its parser boundary", async () => {
    const auth = deniedAuth(); vi.mocked(auth.authenticate).mockRejectedValue(new Error("private credential canary")); await start(auth);
    const failure = await request("login"); expect(failure.status).toBe(503); expect(failure.body).toEqual({ code: "ADMIN_UNAVAILABLE", error: "Verwaltung vorübergehend nicht verfügbar.", retryAfterSeconds: 60 }); privateReply(failure);
    const oversized = await raw(frame("X-Filler: " + "x".repeat(16384) + "\r\n"));
    expect(oversized).toContain("400 Bad Request"); expect(oversized).not.toContain("xxxx"); expect(oversized).toContain('"code":"INVALID_REQUEST"');
  });
});
