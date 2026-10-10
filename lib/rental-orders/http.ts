import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import type { RentalRuntimeConfig } from "./config";

export const ADMIN_COOKIE = "jammers-rental-admin";
const SESSION_MS = 6 * 60 * 60 * 1000;
export class RentalHttpError extends Error {
  constructor(message: string, public readonly status = 400, public readonly retryAfterSeconds?: number) { super(message); }
}
export function credentialMatches(value: unknown, expected: string): boolean {
  if (typeof value !== "string" || !expected || value.length > 1024) return false;
  return timingSafeEqual(createHash("sha256").update(value).digest(), createHash("sha256").update(expected).digest());
}
function sign(value: string, secret: string): string {
  if (secret.length < 32) throw new RentalHttpError("Der Bestellzugang ist noch nicht eingerichtet.", 503);
  return createHmac("sha256", secret).update(value).digest("base64url");
}
export function adminSession(secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ exp: now + SESSION_MS })).toString("base64url");
  return `${payload}.${sign(`admin:${payload}`, secret)}`;
}
export function validAdminSession(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token || token.length > 1024 || secret.length < 32) return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !credentialMatches(parts[1], sign(`admin:${parts[0]}`, secret))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return Number.isSafeInteger(exp) && exp > now && exp <= now + SESSION_MS;
  } catch { return false; }
}
export function customerToken(orderId: string, secret: string): string { return sign(`customer-order:${orderId}`, secret); }
export function validCustomerToken(orderId: string, token: unknown, secret: string): boolean {
  return secret.length >= 32 && credentialMatches(token, customerToken(orderId, secret));
}
export function cookieValue(request: Request, name: string): string | undefined {
  return request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
}
export function assertSameOrigin(request: Request, origin: string): void {
  if (request.headers.get("origin") !== origin) throw new RentalHttpError("Bitte die Aktion direkt auf dieser Website ausführen.", 403);
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") throw new RentalHttpError("Diese Anfrage ist nicht zulässig.", 403);
}
export function isLoopbackOrigin(origin: string): boolean {
  try { const url = new URL(origin); return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && ["http:", "https:"].includes(url.protocol); } catch { return false; }
}
export async function readBoundedJson(request: Request, maxBytes = 32_768): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new RentalHttpError("Bitte JSON-Daten senden.", 415);
  if (Number(request.headers.get("content-length")) > maxBytes) throw new RentalHttpError("Die Anfrage ist zu groß.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RentalHttpError("Die Anfrage ist leer.");
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const result = await reader.read();
    if (result.done) break;
    bytes += result.value.byteLength;
    if (bytes > maxBytes) { await reader.cancel(); throw new RentalHttpError("Die Anfrage ist zu groß.", 413); }
    chunks.push(result.value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new RentalHttpError("Die Anfrage enthält ungültige Daten."); }
}
const ratePolicies = {
  "rental-login": { client: 10, global: 100 },
  "rental-submit": { client: 30, global: 300 },
  // Provider retries have their own scope and receive a retryable non-2xx response.
  "rental-webhook": { client: 120, global: 1200 },
} as const;
type RateScope = keyof typeof ratePolicies;
type Bucket = { count: number; reset: number };
const limits = new Map<RateScope, { global: Bucket; clients: Map<string, Bucket> }>();
const RATE_WINDOW_MS = 60_000;
const MAX_CLIENT_BUCKETS = 1024;

function rateClient(request: Request, config: Pick<RentalRuntimeConfig, "mode" | "trustedProxy">): string {
  if (config.mode === "test") {
    if (!isLoopbackOrigin(request.url)) throw new RentalHttpError("Testbetrieb ist nur lokal erreichbar.", 403);
    // Local tests have no trusted ingress. Never let forwarded headers rotate this bucket.
    return "loopback-test";
  }
  if (config.mode !== "live" || config.trustedProxy !== "single-proxy-x-real-ip") throw new RentalHttpError("Der Zugriffsschutz ist noch nicht eingerichtet.", 503);
  const ip = request.headers.get("x-real-ip") || "";
  const version = isIP(ip);
  if (!version || ip.includes("%")) throw new RentalHttpError("Der Proxy-Clientzugang konnte nicht geprüft werden.", 503);
  let normalized = version === 6 ? new URL(`http://[${ip}]`).hostname.slice(1, -1) : ip;
  const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(normalized);
  if (mapped) {
    const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
    normalized = `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
  }
  return createHash("sha256").update(normalized).digest("hex");
}

/** Bounded, single-process protection; ingress limits and durable idempotency remain separate. */
export function rateLimit(request: Request, scope: RateScope, config: Pick<RentalRuntimeConfig, "mode" | "trustedProxy">, now = Date.now()): void {
  const client = rateClient(request, config), policy = ratePolicies[scope];
  let state = limits.get(scope);
  if (!state) {
    state = { global: { count: 0, reset: now + RATE_WINDOW_MS }, clients: new Map() };
    limits.set(scope, state);
  }
  for (const [key, bucket] of state.clients) if (bucket.reset <= now) state.clients.delete(key);
  const bucket = state.clients.get(client) || { count: 0, reset: now + RATE_WINDOW_MS };
  const retryAfter = (reset: number) => Math.max(1, Math.ceil((reset - now) / 1000));
  if (bucket.count >= policy.client) throw new RentalHttpError("Bitte einen Moment warten und erneut versuchen.", 429, retryAfter(bucket.reset));
  if (state.global.reset <= now) state.global = { count: 0, reset: now + RATE_WINDOW_MS };
  if (state.global.count >= policy.global) throw new RentalHttpError("Bitte einen Moment warten und erneut versuchen.", 429, retryAfter(state.global.reset));
  if (!state.clients.has(client) && state.clients.size >= MAX_CLIENT_BUCKETS) throw new RentalHttpError("Der Bestellzugang ist vorübergehend ausgelastet.", 503, 60);
  bucket.count += 1; state.clients.set(client, bucket);
  // Already-blocked clients cannot exhaust the separate process-wide allowance.
  state.global.count += 1;
}
export function privateJson(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" } });
}
