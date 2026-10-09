import { describe, expect, it } from "vitest";
import { createHmac, generateKeyPairSync } from "node:crypto";
import { readIntakeConfig } from "../src/config";
import { readSession, bootstrapSession, requireForm, activePilot, sessionAdmission } from "../src/intake-session";
const now = 1791540000;
const pem = generateKeyPairSync("rsa", { modulusLength: 2048 }).publicKey.export({ type: "spki", format: "pem" }).toString();
const config = readIntakeConfig({ NODE_ENV: "test", APPLICATIONS_MODE: "enabled", APPLICATIONS_ORIGIN: "http://localhost", APPLICATIONS_TEST_NOW: "2026-10-09T10:00:00.000Z", APPLICATIONS_INGRESS_MASTER_KEY: Buffer.alloc(32, 7).toString("base64"), APPLICATIONS_WORKER_PUBLIC_KEY: pem, APPLICATIONS_INTAKE_UID: String(process.getuid!()), APPLICATIONS_SHARED_GID: String(process.getgid!()), APPLICATIONS_INTAKE_ROOT: "/private/tmp/intake-session-test-does-not-exist", APPLICATIONS_SOCKET_PATH: "/private/tmp/intake-session-parent-does-not-exist/worker.sock" });
function signed(value: unknown, key = config.acceptance!.keys.cookieSignature) { const data = Buffer.from(JSON.stringify(value)).toString("base64url"); return data + "." + createHmac("sha256", key).update("TJ-SESSION-1\0" + data).digest("base64url"); }
describe("fixed signed sessions", () => {
  it("uses Host-only secure production cookie without rotating identity or extending fixed expiry", () => {
    const production = { ...config, origin: "https://trinkgut-jammers.de" };
    const first = bootstrapSession(production, undefined, undefined), cookie = first.cookie.split(";")[0];
    expect(first.cookie).toMatch(/^__Host-application-session=/); expect(first.cookie).toContain("; Path=/; HttpOnly; SameSite=Strict; Secure"); expect(first.cookie).not.toContain("Domain=");
    const late = { ...production, clock: { now: () => new Date("2026-10-16T09:59:30.000Z") } };
    const refreshed = bootstrapSession(late, cookie, undefined);
    expect(refreshed.cookie.split(";")[0]).toBe(cookie); expect(refreshed.cookie).toContain("Max-Age=30;");
    expect(requireForm(late, readSession(late, cookie), refreshed.formToken)).toEqual(readSession(production, cookie));
    expect(() => requireForm({ ...late, clock: { now: () => new Date("2026-10-16T10:00:00.000Z") } }, readSession(late, cookie), refreshed.formToken)).toThrow("FORBIDDEN");
  });
  it("limits reusable form proof to fifteen minutes, binds session, and separates rate purposes", () => {
    const first = bootstrapSession(config, undefined, undefined), second = bootstrapSession(config, undefined, undefined);
    const session = readSession(config, first.cookie.split(";")[0])!;
    expect(requireForm(config, session, first.formToken)).toEqual(session); expect(requireForm(config, session, first.formToken)).toEqual(session);
    expect(() => requireForm(config, readSession(config, second.cookie.split(";")[0]), first.formToken)).toThrow("FORBIDDEN");
    expect(() => requireForm({ ...config, clock: { now: () => new Date("2026-10-09T10:15:00.000Z") } }, session, first.formToken)).toThrow("FORBIDDEN");
    const keys = sessionAdmission(config, session, "192.0.2.1");
    expect(keys.sessionHash).not.toBe(keys.abuse.sessionKey); expect(keys.abuse.ipKey).not.toBe(keys.abuse.sessionKey);
    expect(sessionAdmission(config, session, "192.0.2.2").sessionHash).toBe(keys.sessionHash);
    expect(sessionAdmission(config, session, "192.0.2.2").abuse.ipKey).not.toBe(keys.abuse.ipKey);
    expect(sessionAdmission({ ...config }, session, "192.0.2.1")).toEqual(keys);
  });
  it("validates bounded pilot claim lifetime while preserving fixed identity after claim expiry", () => {
    const value = { v: 1, id: "a".repeat(64), issuedAt: now, expiresAt: now + 604800, pilot: { runId: "synthetic-run", issuedAt: now, expiresAt: now + 3600 } };
    const cookie = "application-test-session=" + signed(value);
    expect(readSession(config, cookie)).toEqual(value); expect(activePilot(config, readSession(config, cookie))).toBe(true);
    const late = { ...config, clock: { now: () => new Date("2026-10-09T11:00:00.000Z") } };
    expect(readSession(late, cookie)).toEqual(value); expect(activePilot(late, readSession(late, cookie))).toBe(false);
    expect(readSession(config, "application-test-session=" + signed({ ...value, pilot: { ...value.pilot, expiresAt: now + 3601 } }))).toBeNull();
  });
  it("authenticates a fixed seven-day session from the correct cookie", () => {
    const value = { v: 1, id: "a".repeat(64), issuedAt: now, expiresAt: now + 604800 };
    expect(readSession(config, "application-test-session=" + signed(value))).toEqual(value);
  });
  it("rejects tamper, wrong purpose, duplicated cookie and expired/future claims", () => {
    const value = { v: 1, id: "a".repeat(64), issuedAt: now, expiresAt: now + 604800 };
    expect(readSession(config, "application-test-session=" + signed(value).slice(0, -1) + "x")).toBeNull();
    expect(readSession(config, "application-test-session=" + signed(value, config.acceptance!.keys.formSignature))).toBeNull();
    expect(readSession(config, "application-test-session=" + signed(value) + "; application-test-session=" + signed(value))).toBeNull();
    for (const claims of [{ ...value, issuedAt: now - 604800, expiresAt: now }, { ...value, issuedAt: now + 1, expiresAt: now + 604801 }, { ...value, expiresAt: now + 604801 }, { ...value, unknown: true }]) expect(readSession(config, "application-test-session=" + signed(claims))).toBeNull();
  });
});
