// Browser-only transport contract. No private service imports, cookie access,
// credential persistence, logging, arbitrary URLs or automatic request retries.
export interface AdminSession { authenticated: true; issuedAt: string; expiresAt: string }
export interface AdminLogin extends AdminSession { csrf: string }
export interface AdminCredentials { username: string; password: string; otp: string }
const errorStatus = {
  INVALID_REQUEST: 400, AUTH_DENIED: 401, FORBIDDEN: 403,
  REAUTH_REQUIRED: 403, NOT_FOUND: 404, METHOD_NOT_ALLOWED: 405,
  REQUEST_TIMEOUT: 408, PAYLOAD_TOO_LARGE: 413, RATE_LIMITED: 429,
  ADMIN_UNAVAILABLE: 503, AUTH_LOGOUT_FAILED: 503,
} as const;
export type AdminFailureCode = keyof typeof errorStatus | "UNKNOWN";
export type AdminResult<T> = { kind: "success"; data: T; code?: never } | { kind: "failure"; code: AdminFailureCode; retryAfterMs: number };
const MAX_BYTES = 8192, TIMEOUT_MS = 10000;
function shape(value: unknown, required: readonly string[], optional: readonly string[] = []): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
function instant(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const time = Date.parse(value); return Number.isFinite(time) && new Date(time).toISOString() === value;
}
function sessionFields(value: Record<string, unknown>, now: number): boolean {
  return value.authenticated === true && instant(value.issuedAt) && instant(value.expiresAt) && Date.parse(value.issuedAt) < Date.parse(value.expiresAt) && Date.parse(value.expiresAt) > now;
}
export function validateAdminSession(value: unknown, now = Date.now()): AdminSession | null {
  if (!shape(value, ["authenticated", "issuedAt", "expiresAt"]) || !sessionFields(value, now)) return null;
  return { authenticated: true, issuedAt: value.issuedAt as string, expiresAt: value.expiresAt as string };
}
export function validateAdminLogin(value: unknown, now = Date.now()): AdminLogin | null {
  if (!shape(value, ["authenticated", "issuedAt", "expiresAt", "csrf"]) || !sessionFields(value, now) || typeof value.csrf !== "string" || !/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(value.csrf)) return null;
  return { authenticated: true, issuedAt: value.issuedAt as string, expiresAt: value.expiresAt as string, csrf: value.csrf };
}
export function validateAdminLogout(value: unknown): { loggedOut: true } | null {
  return shape(value, ["loggedOut"]) && value.loggedOut === true ? { loggedOut: true } : null;
}
/** A valid delay is never shortened, including one beyond the UI timer range. */
export function adminRetryDelay(value: string | null, now = Date.now()): number | null {
  if (value === null || value.length > 128) return null;
  if (/^\d+$/.test(value)) {
    const milliseconds = Number(value) * 1000;
    // An exceptionally long valid server wait must not become a shorter retry.
    return Number.isSafeInteger(milliseconds) ? milliseconds : Infinity;
  }
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toUTCString() === value ? Math.max(0, time - now) : null;
}
function fixedError(value: unknown, status: number): { code: AdminFailureCode; delay: number } | null {
  if (!shape(value, ["code", "error"], ["retryAfterSeconds"]) || typeof value.code !== "string" || !Object.hasOwn(errorStatus, value.code) || errorStatus[value.code as keyof typeof errorStatus] !== status || typeof value.error !== "string" || value.error.length > 512 || /[\u0000-\u001f\u007f]/.test(value.error)) return null;
  if (Object.hasOwn(value, "retryAfterSeconds") && (!Number.isSafeInteger(value.retryAfterSeconds) || (value.retryAfterSeconds as number) < 0 || (value.retryAfterSeconds as number) > 9999999999)) return null;
  return { code: value.code as keyof typeof errorStatus, delay: (value.retryAfterSeconds as number | undefined ?? 0) * 1000 };
}
async function boundedJson(response: Response, signal: AbortSignal): Promise<unknown> {
  const invalid = () => { throw new Error("ADMIN_RESPONSE_INVALID"); };
  const length = response.headers.get("content-length");
  if (response.redirected || response.status >= 300 && response.status < 400 || !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(response.headers.get("content-type") ?? "") || (length !== null && (!/^(0|[1-9]\d*)$/.test(length) || Number(length) > MAX_BYTES)) || !response.body) {
    void response.body?.cancel().catch(() => {}); return invalid();
  }
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  let bytes = 0;
  try {
    if (signal.aborted) return invalid();
    while (true) {
      const next = await reader.read(); if (signal.aborted) return invalid();
      if (next.done) break;
      bytes += next.value.byteLength; if (bytes > MAX_BYTES) return invalid(); chunks.push(next.value);
    }
    const payload = new Uint8Array(bytes); let at = 0;
    for (const chunk of chunks) { payload.set(chunk, at); at += chunk.byteLength; }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(payload), value: unknown = JSON.parse(text);
    // All current auth replies are flat objects. Detect duplicate (including
    // escaped) property names before JSON.parse's last-key-wins can grant trust.
    const names = new Set<string>(), tokens = /"(?:\\.|[^"\\])*"|[{}\[\]]/g; let depth = 0;
    for (let match; (match = tokens.exec(text));) {
      const token = match[0];
      if (token === "[") return invalid();
      if (token === "{") { if (++depth > 1) return invalid(); }
      else if (token === "}") depth--;
      else if (token.startsWith('"') && text.slice(tokens.lastIndex).trimStart().startsWith(":")) {
        const name = JSON.parse(token) as string; if (names.has(name)) return invalid(); names.add(name);
      }
    }
    return value;
  } finally { signal.removeEventListener("abort", abort); void reader.cancel().catch(() => {}); reader.releaseLock(); }
}
async function request<T>(route: "session" | "login" | "logout", validate: (value: unknown) => T | null, body?: string, parent?: AbortSignal): Promise<AdminResult<T>> {
  let retryAfterMs = 0;
  const controller = new AbortController(), deadline = performance.now() + TIMEOUT_MS;
  let failAbort!: () => void;
  const aborted = new Promise<never>((_, reject) => { failAbort = () => reject(new Error("ADMIN_OUTCOME_UNKNOWN")); });
  const abort = () => { controller.abort(); failAbort(); };
  if (parent?.aborted) return { kind: "failure", code: "UNKNOWN", retryAfterMs: 0 };
  parent?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, TIMEOUT_MS);
  const ensureOpen = () => { if (controller.signal.aborted || performance.now() >= deadline) throw new Error("ADMIN_OUTCOME_UNKNOWN"); };
  try {
    const work = async (): Promise<AdminResult<T>> => {
      const response = await fetch(`/api/bewerbungsverwaltung/${route}`, {
        method: route === "session" ? "GET" : "POST", credentials: "same-origin", mode: "same-origin",
        cache: "no-store", redirect: "error", referrerPolicy: "no-referrer", signal: controller.signal,
        ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body }),
      });
      ensureOpen();
      retryAfterMs = adminRetryDelay(response.headers.get("retry-after")) ?? (response.status === 429 || response.status === 503 ? 60000 : 0);
      const value = await boundedJson(response, controller.signal); ensureOpen();
      if (response.status === 200) { const data = validate(value); if (data) return { kind: "success", data }; }
      const error = fixedError(value, response.status);
      return { kind: "failure", code: error?.code ?? "UNKNOWN", retryAfterMs: Math.max(retryAfterMs, error?.delay ?? 0) };
    };
    return await Promise.race([work(), aborted]);
  } catch { return { kind: "failure", code: "UNKNOWN", retryAfterMs }; }
  finally { clearTimeout(timer); parent?.removeEventListener("abort", abort); controller.abort(); }
}
export function getApplicationAdminSession(signal?: AbortSignal): Promise<AdminResult<AdminSession>> {
  return request("session", validateAdminSession, undefined, signal);
}
export function loginApplicationAdmin(input: AdminCredentials, signal?: AbortSignal): Promise<AdminResult<AdminLogin>> {
  // Explicit projection prevents caller extras from becoming authority fields.
  return request("login", validateAdminLogin, JSON.stringify({ username: input.username, password: input.password, otp: input.otp }), signal);
}
export function logoutApplicationAdmin(signal?: AbortSignal): Promise<AdminResult<{ loggedOut: true }>> {
  return request("logout", validateAdminLogout, "{}", signal);
}
