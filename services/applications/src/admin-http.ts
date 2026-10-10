import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { isIP, type Socket } from "node:net";
import { performance } from "node:perf_hooks";
import { expiredSessionCookie, sessionCookie, validAdminOrigin } from "./auth";
import { AUTH_ACTIONS } from "./auth-repository";
import { applicationId, utcInstant, type ApplicationAuth, type Clock, type SensitiveAction } from "./types";

export interface AdminDependencies {
  readonly auth: ApplicationAuth;
  readonly origin: string;
  readonly clock: Clock;
  readonly proxy: { readonly peer: "loopback"; readonly clientIpHeader: string };
  readonly operationalEvent?: (code: "AUTH_LATE_LOGOUT_FAILED") => void;
}
const PREFIX = "/api/bewerbungsverwaltung/", COOKIE = "__Host-tj-application-admin", CSRF = "x-application-admin-csrf";
const MAX_BODY = 8192;
const errors = {
  INVALID_REQUEST: [400, "Anfrage ungültig."],
  AUTH_DENIED: [401, "Anmeldung erforderlich oder nicht möglich."],
  FORBIDDEN: [403, "Anfrage nicht erlaubt."],
  REAUTH_REQUIRED: [403, "Erneute Bestätigung erforderlich."],
  NOT_FOUND: [404, "Endpunkt nicht verfügbar."],
  METHOD_NOT_ALLOWED: [405, "Methode nicht erlaubt."],
  REQUEST_TIMEOUT: [408, "Zeitlimit erreicht. Der Ausgang ist unklar."],
  PAYLOAD_TOO_LARGE: [413, "Anfrage zu groß."],
  RATE_LIMITED: [429, "Zu viele Anfragen. Bitte später erneut versuchen."],
  ADMIN_UNAVAILABLE: [503, "Verwaltung vorübergehend nicht verfügbar."],
  AUTH_LOGOUT_FAILED: [503, "Abmeldung serverseitig nicht bestätigt. Bitte erneut versuchen oder den Verantwortlichen kontaktieren."],
} as const;
type ErrorCode = keyof typeof errors;
class HttpFailure extends Error { constructor(readonly code: ErrorCode) { super(code); } }
function failure(code: ErrorCode): never { throw new HttpFailure(code); }
function errorBody(code: ErrorCode) {
  const [status, error] = errors[code];
  return { code, error, ...(status === 429 || status === 503 ? { retryAfterSeconds: 60 } : {}) };
}
function headers(bytes: number, extra: Record<string, string> = {}): Record<string, string> {
  return { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow", Connection: "close", "Content-Length": String(bytes), ...extra };
}
function json(response: ServerResponse, status: number, body: unknown, extra: Record<string, string> = {}): Promise<boolean> {
  if (response.destroyed || response.writableEnded || response.headersSent) return Promise.resolve(false);
  const text = JSON.stringify(body);
  if (Buffer.byteLength(text) > MAX_BODY) failure("ADMIN_UNAVAILABLE");
  return new Promise(resolve => {
    const finish = () => { cleanup(); resolve(true); };
    const close = () => { cleanup(); resolve(false); };
    const cleanup = () => { response.removeListener("finish", finish); response.removeListener("close", close); response.removeListener("error", close); };
    response.once("finish", finish); response.once("close", close); response.once("error", close);
    try { response.writeHead(status, headers(Buffer.byteLength(text), extra)); response.end(text); }
    catch { close(); response.destroy(); }
  });
}
function reject(response: ServerResponse, code: ErrorCode, extra: Record<string, string> = {}) {
  const status = errors[code][0];
  return json(response, status, errorBody(code), { ...(status === 429 || status === 503 ? { "Retry-After": "60" } : {}), ...extra });
}
function rejectSocket(socket: Socket, code: ErrorCode) {
  if (socket.destroyed || !socket.writable) return;
  const body = JSON.stringify(errorBody(code)), status = errors[code][0];
  const values = headers(Buffer.byteLength(body), status === 429 || status === 503 ? { "Retry-After": "60" } : {});
  socket.end(`HTTP/1.1 ${status} ${status === 408 ? "Request Timeout" : status === 429 ? "Too Many Requests" : status === 503 ? "Service Unavailable" : "Bad Request"}\r\n${Object.entries(values).map(([name, value]) => `${name}: ${value}`).join("\r\n")}\r\n\r\n${body}`, () => socket.destroy());
}
function singleton(request: IncomingMessage, name: string): string | undefined {
  let found: string | undefined;
  for (let i = 0; i < request.rawHeaders.length; i += 2) if (request.rawHeaders[i].toLowerCase() === name) {
    if (found !== undefined) failure("FORBIDDEN"); found = request.rawHeaders[i + 1];
  }
  return found;
}
function canonicalToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value) && Buffer.from(value, "base64url").toString("base64url") === value;
}
function cookieToken(value: string | undefined): string | undefined {
  if (!value) return;
  if (Buffer.byteLength(value) > 8192) failure("FORBIDDEN");
  let found: string | undefined;
  for (const pair of value.split(";")) {
    const at = pair.indexOf("=");
    if ((at < 0 ? pair : pair.slice(0, at)).trim() !== COOKIE) continue;
    if (found !== undefined) failure("FORBIDDEN");
    found = at < 0 ? "" : pair.slice(at + 1); // Never decode, unquote or normalize the credential.
  }
  return canonicalToken(found) ? found : undefined;
}
function envelope(request: IncomingMessage, deps: AdminDependencies): { token?: string; ip: string; origin?: string; csrf?: string } {
  for (const name of ["origin", "sec-fetch-site", "sec-fetch-mode", "sec-fetch-dest", "cookie", "authorization", CSRF, deps.proxy.clientIpHeader, "content-type", "content-length", "content-encoding", "transfer-encoding", "expect"]) singleton(request, name);
  const get = (name: string) => singleton(request, name), origin = get("origin");
  if ((request.method === "POST" || origin !== undefined) && !validAdminOrigin(origin, deps.origin)) failure("FORBIDDEN");
  if (get("sec-fetch-site") !== "same-origin" || !["cors", "same-origin"].includes(get("sec-fetch-mode") ?? "") || get("sec-fetch-dest") !== "empty" || get("authorization") !== undefined) failure("FORBIDDEN");
  if (get("expect") !== undefined || (get("content-encoding") !== undefined && get("content-encoding") !== "identity")) failure("INVALID_REQUEST");
  const length = get("content-length"), transfer = get("transfer-encoding");
  if ((length !== undefined && (!/^(0|[1-9][0-9]*)$/.test(length) || !Number.isSafeInteger(Number(length)))) || (transfer !== undefined && (transfer.toLowerCase() !== "chunked" || length !== undefined))) failure("INVALID_REQUEST");
  if (length !== undefined && Number(length) > MAX_BODY) failure("PAYLOAD_TOO_LARGE");
  if (request.method === "POST" && !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(get("content-type") ?? "")) failure("INVALID_REQUEST");
  if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(request.socket.remoteAddress ?? "")) failure("FORBIDDEN");
  const ip = get(deps.proxy.clientIpHeader);
  if (!ip || ip.length > 45 || ip.includes("%") || !isIP(ip)) failure("FORBIDDEN");
  if (isIP(ip) === 6 && (new URL(`http://[${ip}]/`).hostname !== `[${ip}]` || ip.startsWith("::ffff:"))) failure("FORBIDDEN");
  return { token: cookieToken(get("cookie")), ip, origin, csrf: get(CSRF) };
}
function readBody(request: IncomingMessage, signal: AbortSignal): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []; let bytes = 0;
    const cleanup = () => { request.pause(); request.removeListener("data", data); request.removeListener("end", end); signal.removeEventListener("abort", abort); };
    const abort = () => { cleanup(); reject(new HttpFailure("REQUEST_TIMEOUT")); };
    const data = (chunk: Buffer) => {
      bytes += chunk.byteLength;
      if (bytes > MAX_BODY || (request.method === "GET" && bytes > 0)) { cleanup(); reject(new HttpFailure(bytes > MAX_BODY ? "PAYLOAD_TOO_LARGE" : "INVALID_REQUEST")); }
      else chunks.push(chunk);
    };
    const end = () => { cleanup(); resolve(Buffer.concat(chunks)); };
    if (signal.aborted) return abort();
    request.on("data", data); request.once("end", end); signal.addEventListener("abort", abort, { once: true }); request.resume();
  });
}
function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) failure("INVALID_REQUEST");
  return value as Record<string, unknown>;
}
function jsonObject(bytes: Buffer): Record<string, unknown> {
  let text: string, value: unknown;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); value = JSON.parse(text); } catch { failure("INVALID_REQUEST"); }
  // JSON.parse validates syntax but loses duplicate keys. Inspect the original
  // bounded tokens, including escaped key names, before accepting any object.
  const stack: Set<string>[] = [], tokens = /"(?:\\.|[^"\\])*"|[{}\[\]]/g;
  for (let match; (match = tokens.exec(text));) {
    const token = match[0];
    if (token === "[") failure("INVALID_REQUEST");
    if (token === "{") { stack.push(new Set()); if (stack.length > 2) failure("INVALID_REQUEST"); }
    else if (token === "}") stack.pop();
    else if (token.startsWith('"') && text.slice(tokens.lastIndex).trimStart().startsWith(":")) {
      const name: string = JSON.parse(token), names = stack.at(-1)!;
      if (names.has(name)) failure("INVALID_REQUEST"); names.add(name);
    }
  }
  return object(value);
}
function exact(body: Record<string, unknown>, allowed: readonly string[], required = allowed): void {
  if (Object.keys(body).some(key => !allowed.includes(key)) || required.some(key => !Object.hasOwn(body, key))) failure("INVALID_REQUEST");
}
function credential(value: unknown, units: number, bytes: number, missing = false): string {
  if (missing && value === undefined) return "";
  if (typeof value !== "string" || value.length > units || Buffer.byteLength(value) > bytes) failure("INVALID_REQUEST");
  return value;
}
function actionShape(value: unknown): SensitiveAction {
  const action = object(value); exact(action, ["kind", "caseId", "version"]);
  if (!AUTH_ACTIONS.includes(action.kind as SensitiveAction["kind"]) || !Number.isSafeInteger(action.version) || (action.version as number) < 1) failure("INVALID_REQUEST");
  try { return { kind: action.kind as SensitiveAction["kind"], caseId: applicationId(action.caseId as string), version: action.version as number }; } catch { failure("INVALID_REQUEST"); }
}

/** Factory only: worker composition owns the single auth instance and loopback listener. */
export function createAdminServer(deps: AdminDependencies): Server {
  if (!validAdminOrigin(deps.origin, deps.origin) || deps.proxy?.peer !== "loopback" || !/^x-[a-z0-9-]{1,62}$/.test(deps.proxy.clientIpHeader) || deps.proxy.clientIpHeader === CSRF) throw new Error("ADMIN_UNAVAILABLE");
  let admitted = 0, credentials = 0, windowStart = performance.now(), count = 0, closing = false;
  const work = new Set<Promise<void>>(), sockets = new Map<Socket, { timer: ReturnType<typeof setTimeout>; deadline: number }>(), used = new WeakSet<Socket>();
  const server = createServer({ maxHeaderSize: 16384, headersTimeout: 5000, requestTimeout: 10000, connectionsCheckingInterval: 1000 }, (request, response) => {
    const connection = sockets.get(request.socket); clearTimeout(connection?.timer);
    if (!connection || performance.now() >= connection.deadline) { void reject(response, "REQUEST_TIMEOUT"); return; }
    if (used.has(request.socket)) { request.socket.destroy(); return; }
    used.add(request.socket);
    const controller = new AbortController(), deadline = performance.now() + 10000;
    let acquired = false;
    const disconnected = () => controller.abort();
    const timeout = () => { controller.abort(); if (response.headersSent && !response.writableFinished) response.destroy(); else void reject(response, "REQUEST_TIMEOUT"); };
    const timer = setTimeout(timeout, 10000);
    request.on("aborted", disconnected); request.on("error", disconnected);
    const close = () => { if (!response.writableFinished) disconnected(); };
    response.on("close", close);
    const ensureOpen = () => { if (performance.now() >= deadline) timeout(); if (controller.signal.aborted || response.destroyed) failure("REQUEST_TIMEOUT"); };
    const withCredential = async (run: () => Promise<void>) => {
      ensureOpen(); if (credentials >= 3) failure("RATE_LIMITED"); credentials++;
      try { await run(); } finally { credentials--; }
    };
    const handle = async () => {
      const route = request.url?.startsWith(PREFIX) ? request.url.slice(PREFIX.length) : "";
      if (!["login", "logout", "reauth", "session"].includes(route)) { await reject(response, "NOT_FOUND"); return; }
      const method = route === "session" ? "GET" : "POST";
      if (request.method !== method) { await reject(response, "METHOD_NOT_ALLOWED", { Allow: method }); return; }
      if (closing) failure("ADMIN_UNAVAILABLE");
      const transport = envelope(request, deps), tick = performance.now();
      if (tick - windowStart >= 60000) { windowStart = tick; count = 0; }
      if (admitted >= 8 || count >= 120) failure("RATE_LIMITED");
      admitted++; count++; acquired = true;
      const bytes = await readBody(request, controller.signal); ensureOpen();
      if (route === "session") {
        const session = transport.token ? deps.auth.authorizeSession(transport.token, utcInstant(deps.clock.now().toISOString())) : null;
        ensureOpen(); if (!session) failure("AUTH_DENIED");
        await json(response, 200, { authenticated: true, issuedAt: session.issuedAt, expiresAt: session.expiresAt }); return;
      }
      const body = jsonObject(bytes);
      if (route === "logout") {
        exact(body, []);
        try { await deps.auth.logout(transport.token ?? ""); } catch (error) { if (error instanceof Error && error.message === "AUTH_LOGOUT_FAILED") failure("AUTH_LOGOUT_FAILED"); throw error; }
        ensureOpen(); await json(response, 200, { loggedOut: true }, { "Set-Cookie": expiredSessionCookie() }); return;
      }
      if (route === "login") {
        // R90: do not replace the sole revocation-retry handle on deliberate re-login.
        if (transport.token) failure("FORBIDDEN");
        exact(body, ["username", "password", "otp"], []);
        const input = { username: credential(body.username, 64, 256, true), password: credential(body.password, 256, 512, true), otp: credential(body.otp, 64, 64, true), trustedIp: transport.ip };
        await withCredential(async () => {
          const result = await deps.auth.authenticate(input);
          if (result.kind === "denied") failure("AUTH_DENIED");
          let delivered = false;
          try {
            ensureOpen(); if (!canonicalToken(result.csrf)) failure("ADMIN_UNAVAILABLE");
            const cookie = sessionCookie(result.token, result.session.expiresAt, utcInstant(deps.clock.now().toISOString()));
            delivered = await json(response, 200, { authenticated: true, csrf: result.csrf, issuedAt: result.session.issuedAt, expiresAt: result.session.expiresAt }, { "Set-Cookie": cookie });
          } finally {
            if (!delivered) try { await deps.auth.logout(result.token); } catch { try { deps.operationalEvent?.("AUTH_LATE_LOGOUT_FAILED"); } catch { /* Operational sink failures never expose auth material. */ } }
          }
        }); return;
      }
      exact(body, ["password", "otp", "action"]);
      const proof = { password: credential(body.password, 256, 512), otp: credential(body.otp, 64, 64), trustedIp: transport.ip }, action = actionShape(body.action);
      if (!transport.token || !deps.auth.authorizeSession(transport.token, utcInstant(deps.clock.now().toISOString()))) failure("AUTH_DENIED");
      if (!canonicalToken(transport.csrf)) failure("FORBIDDEN");
      const session = deps.auth.authorizeMutation(transport.token, transport.csrf, transport.origin, deps.origin);
      if (!session) failure("FORBIDDEN");
      await withCredential(async () => {
        let grant;
        try { grant = await deps.auth.authorizeSensitiveAction(session, proof, action); }
        catch (error) { if (error instanceof Error && error.message === "AUTH_DENIED") failure("REAUTH_REQUIRED"); throw error; }
        ensureOpen(); if (!canonicalToken(grant.nonce)) failure("ADMIN_UNAVAILABLE");
        await json(response, 200, { grant: { nonce: grant.nonce, action: { kind: grant.action.kind, caseId: grant.action.caseId, version: grant.action.version }, issuedAt: grant.issuedAt, expiresAt: grant.expiresAt } });
      });
    };
    const pending = handle().catch(error => reject(response, error instanceof HttpFailure ? error.code : "ADMIN_UNAVAILABLE")).then(() => {}).finally(() => {
      clearTimeout(timer); if (acquired) admitted--;
      request.removeListener("aborted", disconnected); request.removeListener("error", disconnected); response.removeListener("close", close); work.delete(pending);
    });
    work.add(pending);
  });
  server.on("connection", socket => {
    if (closing || sockets.size >= 32) { rejectSocket(socket, closing ? "ADMIN_UNAVAILABLE" : "RATE_LIMITED"); return; }
    const timer = setTimeout(() => rejectSocket(socket, "REQUEST_TIMEOUT"), 5000); sockets.set(socket, { timer, deadline: performance.now() + 5000 });
    socket.once("close", () => { clearTimeout(timer); sockets.delete(socket); });
  });
  // Route through the same duplicate-header/routing checks, without sending100.
  const expectation = (request: IncomingMessage, response: ServerResponse) => { server.emit("request", request, response); };
  server.on("checkContinue", expectation); server.on("checkExpectation", expectation);
  server.on("clientError", (error, socket) => { clearTimeout(sockets.get(socket as Socket)?.timer); rejectSocket(socket as Socket, "code" in error && error.code === "ERR_HTTP_REQUEST_TIMEOUT" ? "REQUEST_TIMEOUT" : "INVALID_REQUEST"); });
  const close = server.close.bind(server);
  server.close = callback => {
    closing = true;
    // Do not announce close/drain while durable auth or late-token cleanup is
    // still running, even if the transport already timed out or disconnected.
    void Promise.allSettled([...work]).then(() => close(callback));
    return server;
  };
  return server;
}
