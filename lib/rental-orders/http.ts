import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "jammers-rental-admin";
const SESSION_MS = 6 * 60 * 60 * 1000;
export class RentalHttpError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
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
const limits = new Map<string, { count: number; reset: number }>();
/** Single-host admission guard; durable order idempotency is enforced separately. */
export function rateLimit(scope: string, limit: number, now = Date.now()): void {
  const previous = limits.get(scope);
  const bucket = previous && previous.reset > now ? previous : { count: 0, reset: now + 60_000 };
  if (bucket.count >= limit) throw new RentalHttpError("Bitte einen Moment warten und erneut versuchen.", 429);
  bucket.count += 1;
  limits.set(scope, bucket);
}
export function privateJson(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" } });
}
