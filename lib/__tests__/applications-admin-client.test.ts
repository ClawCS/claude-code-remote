import { afterEach, describe, expect, it, vi } from "vitest";

// Removing validation, request bounds or conservative outcomes must break these
// tests. Only the external fetch transport is replaced; parsing stays real.
async function client() {
  const implementation = await import("../applications-admin-client").catch(() => null);
  expect(implementation, "bounded admin client must exist").not.toBeNull();
  return implementation!;
}
const now = Date.parse("2026-10-10T12:00:00.000Z");
const session = { authenticated: true, issuedAt: "2026-10-10T11:59:00.000Z", expiresAt: "2026-10-10T19:59:00.000Z" };
const login = { ...session, csrf: "A".repeat(43) };
const input = { username: "synthetic-staff", password: "  synthetic password  ", otp: "123456" };
function reply(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } });
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("strict admin auth projections", () => {
  it("accepts only real booleans and exact session times without inventing CSRF", async () => {
    const c = await client();
    expect(c.validateAdminSession(session, now)).toEqual(session);
    for (const value of [null, [], { ...session, authenticated: "true" }, { ...session, authenticated: 1 }, { ...session, authenticated: false }, { ...session, csrf: login.csrf }, { ...session, staffId: "private" }]) expect(c.validateAdminSession(value, now)).toBeNull();
  });
  it.each(["2026-02-30T12:00:00.000Z", "2026-10-10T12:00:00Z", "2026-10-10T14:00:00.000+02:00", "yesterday"])("rejects noncanonical instant %s", async issuedAt => {
    expect((await client()).validateAdminSession({ ...session, issuedAt }, now)).toBeNull();
  });
  it("rejects inverted and expired session lifetimes", async () => {
    const c = await client();
    expect(c.validateAdminSession({ ...session, expiresAt: session.issuedAt }, now)).toBeNull();
    expect(c.validateAdminSession(session, Date.parse(session.expiresAt))).toBeNull();
    expect(c.validateAdminSession({ ...session, issuedAt: [session.issuedAt] }, now)).toBeNull();
  });
  it("accepts login only with canonical 32-byte CSRF and no private extras", async () => {
    const c = await client(); expect(c.validateAdminLogin(login, now)).toEqual(login);
    for (const csrf of [null, [login.csrf], "", "A".repeat(42), "A".repeat(42) + "B"]) expect(c.validateAdminLogin({ ...login, csrf }, now)).toBeNull();
    expect(c.validateAdminLogin({ ...login, role: "owner" }, now)).toBeNull();
    expect(c.validateAdminLogin(session, now)).toBeNull();
  });
  it("rejects coercion, arrays and extra fields in logout confirmation", async () => {
    const c = await client(); expect(c.validateAdminLogout({ loggedOut: true })).toEqual({ loggedOut: true });
    for (const value of [{ loggedOut: "true" }, { loggedOut: 1 }, { loggedOut: false }, [{ loggedOut: true }], { loggedOut: true, csrf: login.csrf }]) expect(c.validateAdminLogout(value)).toBeNull();
  });
});

describe("bounded same-origin admin transport", () => {
  it("uses only actual endpoints with browser-managed credentials, no redirects or invented metadata", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now); const calls: { path: unknown; options: RequestInit }[] = [];
    vi.stubGlobal("fetch", async (path: unknown, options: RequestInit) => { calls.push({ path, options }); return reply(path === "/api/bewerbungsverwaltung/login" ? login : path === "/api/bewerbungsverwaltung/logout" ? { loggedOut: true } : session); });
    const c = await client();
    expect(await c.getApplicationAdminSession()).toEqual({ kind: "success", data: session });
    expect(await c.loginApplicationAdmin(input)).toEqual({ kind: "success", data: login });
    expect(await c.logoutApplicationAdmin()).toEqual({ kind: "success", data: { loggedOut: true } });
    expect(calls.map(call => call.path)).toEqual(["/api/bewerbungsverwaltung/session", "/api/bewerbungsverwaltung/login", "/api/bewerbungsverwaltung/logout"]);
    for (const { options } of calls) {
      expect(options).toMatchObject({ credentials: "same-origin", mode: "same-origin", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer" });
      expect([...new Headers(options.headers).keys()]).not.toEqual(expect.arrayContaining(["authorization", "cookie", "sec-fetch-site", "x-application-admin-csrf"]));
    }
    expect(calls[0].options.method).toBe("GET"); expect(calls[0].options.body).toBeUndefined();
    expect(calls[1].options.body).toBe('{"username":"synthetic-staff","password":"  synthetic password  ","otp":"123456"}');
    expect(calls[2].options.body).toBe("{}");
  });
  it("projects only exact fixed error/status combinations without echoing server errors", async () => {
    const c = await client();
    vi.stubGlobal("fetch", async () => reply({ code: "AUTH_DENIED", error: "SERVER_PRIVATE_CANARY" }, 401));
    expect(await c.loginApplicationAdmin(input)).toEqual({ kind: "failure", code: "AUTH_DENIED", retryAfterMs: 0 });
    for (const value of [{ code: ["AUTH_DENIED"], error: "private" }, { code: "AUTH_DENIED", error: 3 }, { code: "AUTH_DENIED", error: "private", staff: "private" }, { code: "AUTH_DENIED", error: "private", retryAfterSeconds: "60" }]) {
      vi.stubGlobal("fetch", async () => reply(value, 401)); expect(await c.loginApplicationAdmin(input)).toEqual({ kind: "failure", code: "UNKNOWN", retryAfterMs: 0 });
    }
    vi.stubGlobal("fetch", async () => reply({ code: "AUTH_DENIED", error: "private" }, 200)); expect((await c.loginApplicationAdmin(input)).kind).toBe("failure");
  });
  it.each(["not JSON", "x".repeat(8193), '{"authenticated":true,"authenticated":false}', '{"loggedOut":true,"loggedOut":true}'])("keeps malformed/oversized/duplicate reply %# uncertain", async body => {
    vi.stubGlobal("fetch", async () => new Response(body, { headers: { "Content-Type": "application/json" } }));
    expect(await (await client()).logoutApplicationAdmin()).toEqual({ kind: "failure", code: "UNKNOWN", retryAfterMs: 0 });
  });
  it("rejects wrong content type, advertised oversized bytes and invalid UTF8", async () => {
    const c = await client();
    for (const response of [new Response("{}", { headers: { "Content-Type": "text/html" } }), new Response("{}", { headers: { "Content-Type": "application/json", "Content-Length": "8193" } }), new Response(new Uint8Array([0xff]), { headers: { "Content-Type": "application/json" } }), new Response("{}", { status: 307, headers: { "Content-Type": "application/json" } })]) {
      vi.stubGlobal("fetch", async () => response); expect((await c.logoutApplicationAdmin()).code).toBe("UNKNOWN");
    }
  });
  it("cancels streaming beyond 8192 actual bytes despite a false length header", async () => {
    let canceled = false;
    const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array(4096)); controller.enqueue(new Uint8Array(4097)); }, cancel() { canceled = true; } });
    vi.stubGlobal("fetch", async () => new Response(stream, { headers: { "Content-Type": "application/json", "Content-Length": "2" } }));
    expect((await (await client()).logoutApplicationAdmin()).code).toBe("UNKNOWN"); expect(canceled).toBe(true);
  });
  it("honors header and bounded body retry delay even when a body is unusable", async () => {
    const c = await client();
    vi.stubGlobal("fetch", async () => new Response("private", { status: 503, headers: { "Content-Type": "text/html", "Retry-After": "3600" } }));
    expect(await c.logoutApplicationAdmin()).toEqual({ kind: "failure", code: "UNKNOWN", retryAfterMs: 3600000 });
    vi.stubGlobal("fetch", async () => reply({ code: "AUTH_LOGOUT_FAILED", error: "private", retryAfterSeconds: 60 }, 503, { "Retry-After": "1" }));
    expect(await c.logoutApplicationAdmin()).toEqual({ kind: "failure", code: "AUTH_LOGOUT_FAILED", retryAfterMs: 60000 });
    expect(c.adminRetryDelay("Sun, 11 Oct 2026 12:00:00 GMT", now)).toBe(86400000);
    expect(c.adminRetryDelay("9999999999", now)).toBe(9999999999000);
    expect(c.adminRetryDelay("0003600", now)).toBe(3600000);
    expect(c.adminRetryDelay("10000000000", now)).toBe(10000000000000);
    for (const value of [null, "-1", "Infinity", "1.5", "not a date"]) expect(c.adminRetryDelay(value, now)).toBeNull();
  });
  it("bounds header and body wait, aborts transport, and never automatically replays credentials", async () => {
    const c = await client(); vi.useFakeTimers(); let calls = 0, signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", (_path: unknown, options: RequestInit) => { calls++; signal = options.signal as AbortSignal; return new Promise(() => {}); });
    const pending = c.loginApplicationAdmin(input); await vi.advanceTimersByTimeAsync(10000);
    expect(await pending).toEqual({ kind: "failure", code: "UNKNOWN", retryAfterMs: 0 }); expect(signal?.aborted).toBe(true); expect(calls).toBe(1);
    let canceled = false;
    vi.stubGlobal("fetch", async () => new Response(new ReadableStream({ cancel() { canceled = true; } }), { headers: { "Content-Type": "application/json" } }));
    const body = c.logoutApplicationAdmin(); await vi.advanceTimersByTimeAsync(10000); expect((await body).code).toBe("UNKNOWN"); expect(canceled).toBe(true);
  });
  it("honors dispose abort before fetch and while pending without accepting a late success", async () => {
    const c = await client(); let calls = 0; const disposed = new AbortController(); disposed.abort();
    vi.stubGlobal("fetch", async () => { calls++; return reply(login); });
    expect((await c.loginApplicationAdmin(input, disposed.signal)).kind).toBe("failure"); expect(calls).toBe(0);
    const controller = new AbortController(); let release!: (response: Response) => void;
    vi.stubGlobal("fetch", () => new Promise<Response>(resolve => { release = resolve; }));
    const pending = c.loginApplicationAdmin(input, controller.signal); controller.abort(); release(reply(login));
    expect((await pending).kind).toBe("failure");
  });
  it("rejects a response beyond the monotonic deadline even before the timer callback runs", async () => {
    const c = await client(); vi.spyOn(Date, "now").mockReturnValue(now); let tick = 0;
    vi.spyOn(performance, "now").mockImplementation(() => tick);
    vi.stubGlobal("fetch", async () => { tick = 10001; return reply(login); });
    expect(await c.loginApplicationAdmin(input)).toEqual({ kind: "failure", code: "UNKNOWN", retryAfterMs: 0 });
  });
});
