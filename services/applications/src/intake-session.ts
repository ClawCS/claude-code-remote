import type { IntakeConfig } from "./config";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { strictObject } from "./crypto";
import { digest, type AdmissionKeys, type Digest } from "./types";
export interface IntakeSession { v: 1; id: string; issuedAt: number; expiresAt: number; pilot?: { runId: string; issuedAt: number; expiresAt: number } }
const domains = { session: "TJ-SESSION-1", form: "TJ-FORM-1", pilot: "TJ-PILOT-1" };
function now(config: IntakeConfig) { return Math.floor(config.clock.now().getTime() / 1000); }
export function sessionCookieName(config: IntakeConfig): string {
  const local = process.env.NODE_ENV === "test" && new URL(config.origin).protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(config.origin).hostname);
  return local ? "application-test-session" : "__Host-application-session";
}
function sign(value: unknown, key: Buffer, domain: string) {
  const data = Buffer.from(JSON.stringify(value)).toString("base64url");
  return data + "." + createHmac("sha256", key).update(domain + "\0" + data).digest("base64url");
}
function claims(value: unknown, required: readonly string[], optional: readonly string[] = []): Record<string, unknown> {
  try { return strictObject(value, required, optional); } catch { throw new Error("FORBIDDEN"); }
}
function verify(token: string, key: Buffer, domain: string): unknown {
  if (token.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("FORBIDDEN");
  const [data, signature] = token.split(".");
  const bytes = Buffer.from(data, "base64url"), mac = Buffer.from(signature, "base64url");
  if (bytes.toString("base64url") !== data || mac.toString("base64url") !== signature || !timingSafeEqual(mac, createHmac("sha256", key).update(domain + "\0" + data).digest())) throw new Error("FORBIDDEN");
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); } catch { throw new Error("FORBIDDEN"); }
}
function interval(issuedAt: unknown, expiresAt: unknown, seconds: number, time: number) {
  if (!Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(expiresAt) || (issuedAt as number) < 0 || (issuedAt as number) > time || (expiresAt as number) <= time || (expiresAt as number) <= (issuedAt as number) || (expiresAt as number) - (issuedAt as number) > seconds) throw new Error("FORBIDDEN");
}
export function readSession(config: IntakeConfig, cookie: string | undefined): IntakeSession | null {
  if (!config.acceptance || !cookie || cookie.length > 8192) return null;
  try {
    const matches = cookie.split(";").map(part => part.trim()).filter(part => part.startsWith(sessionCookieName(config) + "="));
    if (matches.length !== 1) return null;
    const value = strictObject(verify(matches[0].slice(sessionCookieName(config).length + 1), config.acceptance.keys.cookieSignature, domains.session), ["v", "id", "issuedAt", "expiresAt"], ["pilot"]);
    if (value.v !== 1 || typeof value.id !== "string" || !/^[a-f0-9]{64}$/.test(value.id)) return null;
    interval(value.issuedAt, value.expiresAt, config.lifetimes.sessionSeconds, now(config));
    if ((value.expiresAt as number) - (value.issuedAt as number) !== config.lifetimes.sessionSeconds) return null;
    if (value.pilot !== undefined) {
      const pilot = strictObject(value.pilot, ["runId", "issuedAt", "expiresAt"]);
      interval(pilot.issuedAt, pilot.expiresAt, config.lifetimes.pilotSeconds, pilot.issuedAt as number);
      if (typeof pilot.runId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(pilot.runId) || (pilot.issuedAt as number) > now(config) || (pilot.expiresAt as number) > (value.expiresAt as number)) return null;
    }
    return value as unknown as IntakeSession;
  } catch { return null; }
}
export function activePilot(config: IntakeConfig, session: IntakeSession | null): boolean { return Boolean(session?.pilot && session.pilot.expiresAt > now(config)); }
export function bootstrapSession(config: IntakeConfig, cookie: string | undefined, authorization: string | undefined): { cookie: string; formToken: string } {
  if (!config.acceptance || config.mode === "disabled") throw new Error("WORKER_UNAVAILABLE");
  const time = now(config);
  let session = readSession(config, cookie);
  if (!session) session = { v: 1, id: randomBytes(32).toString("hex"), issuedAt: time, expiresAt: time + config.lifetimes.sessionSeconds };
  if (config.mode === "enabled" && (authorization !== undefined || session.pilot)) throw new Error("FORBIDDEN");
  if (config.mode === "pilot") {
    if (authorization !== undefined) {
      if (!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(authorization)) throw new Error("FORBIDDEN");
      const grant = claims(verify(authorization.slice(7), config.acceptance.keys.pilotSignature, domains.pilot), ["v", "runId", "issuedAt", "expiresAt"]);
      if (grant.v !== 1 || typeof grant.runId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(grant.runId)) throw new Error("FORBIDDEN");
      interval(grant.issuedAt, grant.expiresAt, config.lifetimes.pilotSeconds, time);
      session = { ...session, pilot: { runId: grant.runId, issuedAt: grant.issuedAt as number, expiresAt: Math.min(grant.expiresAt as number, session.expiresAt) } };
    }
    if (!activePilot(config, session)) throw new Error("FORBIDDEN");
  }
  const expiresAt = Math.min(time + config.lifetimes.formSeconds, session.expiresAt, session.pilot?.expiresAt ?? Infinity);
  const formToken = sign({ v: 1, session: session.id, issuedAt: time, expiresAt, nonce: randomBytes(16).toString("hex") }, config.acceptance.keys.formSignature, domains.form);
  const name = sessionCookieName(config), secure = name.startsWith("__Host-") ? "; Secure" : "";
  return { formToken, cookie: `${name}=${sign(session, config.acceptance.keys.cookieSignature, domains.session)}; Max-Age=${session.expiresAt - time}; Path=/; HttpOnly; SameSite=Strict${secure}` };
}
export function requireForm(config: IntakeConfig, session: IntakeSession | null, token: string | undefined): IntakeSession {
  if (!config.acceptance || !session || !token) throw new Error("FORBIDDEN");
  const form = claims(verify(token, config.acceptance.keys.formSignature, domains.form), ["v", "session", "issuedAt", "expiresAt", "nonce"]);
  if (form.v !== 1 || form.session !== session.id || typeof form.nonce !== "string" || !/^[a-f0-9]{32}$/.test(form.nonce) || (form.expiresAt as number) > session.expiresAt || (form.issuedAt as number) < session.issuedAt) throw new Error("FORBIDDEN");
  interval(form.issuedAt, form.expiresAt, config.lifetimes.formSeconds, now(config));
  return session;
}
export function sessionAdmission(config: IntakeConfig, session: IntakeSession, canonicalIp: string): { sessionHash: Digest; abuse: AdmissionKeys } {
  if (!config.acceptance) throw new Error("WORKER_UNAVAILABLE");
  const hash = (key: Buffer, purpose: string, value: string) => digest(createHmac("sha256", key).update(purpose + "\0" + value).digest("hex"));
  return { sessionHash: hash(config.acceptance.keys.sessionHash, "TJ-IDENTITY-1", session.id), abuse: { sessionKey: hash(config.acceptance.keys.sessionRate, "TJ-SESSION-RATE-1", session.id), ipKey: hash(config.acceptance.keys.ipRate, "TJ-IP-RATE-1", canonicalIp) } };
}
