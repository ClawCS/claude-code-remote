import { describe, expect, it } from "vitest";
import { readConfig } from "../src/config";
import { applicationId, dateOnly, digest, staffId, utcInstant } from "../src/types";
import { chmodSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const env = { NODE_ENV: "production", APPLICATIONS_MODE: "enabled", APPLICATIONS_ORIGIN: "https://trinkgut-jammers.de", APPLICATIONS_INTAKE_ROOT: "/srv/trinkgut-intake", APPLICATIONS_WORKER_ROOT: "/srv/trinkgut-worker", APPLICATIONS_SOCKET_PATH: "/run/trinkgut-applications/worker.sock", APPLICATIONS_INTAKE_UID: "1001", APPLICATIONS_WORKER_UID: "1002", APPLICATIONS_SHARED_GID: "1003", APPLICATIONS_RUNTIME_ROOT: "/run/trinkgut-applications-worker" } satisfies NodeJS.ProcessEnv;
describe("application configuration", () => {
  it("requires distinct explicitly configured production service identities", () => {
    expect(() => readConfig({ ...env, APPLICATIONS_INTAKE_UID: undefined })).toThrow("INVALID_STORAGE_IDENTITY");
    expect(() => readConfig({ ...env, APPLICATIONS_WORKER_UID: "1001" })).toThrow("INVALID_STORAGE_IDENTITY");
    expect(() => readConfig({ ...env, APPLICATIONS_SHARED_GID: "-1" })).toThrow("INVALID_STORAGE_IDENTITY");
    expect(readConfig(env)).toMatchObject({ intake: { ownerUid: 1001, sharedGid: 1003 }, worker: { ownerUid: 1002, sharedGid: 1003, runtimeRoot: "/run/trinkgut-applications-worker" } });
  });
  it("accepts only exact shared incoming permissions and worker-private storage", () => {
    const dir = mkdtempSync(join(realpathSync(tmpdir()), "application-config-shared-"));
    const local = { ...env, NODE_ENV: "test", APPLICATIONS_ORIGIN: "http://localhost:3105", APPLICATIONS_INTAKE_ROOT: dir, APPLICATIONS_INTAKE_UID: String(process.getuid!()), APPLICATIONS_WORKER_UID: String(process.getuid!()), APPLICATIONS_SHARED_GID: String(process.getgid!()) } satisfies NodeJS.ProcessEnv;
    try { chmodSync(dir, 0o2770); expect(() => readConfig(local)).not.toThrow(); chmodSync(dir, 0o2777); expect(() => readConfig(local)).toThrow("UNSAFE_PATH"); }
    finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it("rejects an enabled service without a real HTTPS origin", () => {
    for (const origin of [undefined, "", "https://example.com", "http://trinkgut-jammers.de", "https://localhost", "https://trinkgut-jammers.de/path"]) expect(() => readConfig({ ...env, APPLICATIONS_ORIGIN: origin })).toThrow("INVALID_ORIGIN");
  });
  it("rejects unsafe and overlapping storage paths", () => {
    for (const path of ["relative", "/", "/var/www/public/uploads", process.cwd(), "/srv/trinkgut-worker", "/srv/trinkgut-worker/child", "/opt/releases/v1/uploads"]) expect(() => readConfig({ ...env, APPLICATIONS_INTAKE_ROOT: path })).toThrow("UNSAFE_PATH");
  });
  it("rejects an existing storage root readable by other users", () => {
    const dir = mkdtempSync(join(realpathSync(tmpdir()), "application-config-"));
    try { chmodSync(dir, 0o755); expect(() => readConfig({ ...env, APPLICATIONS_INTAKE_ROOT: dir })).toThrow("UNSAFE_PATH"); }
    finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it("rejects a dangling symlink in a storage path", () => {
    const dir = mkdtempSync(join(realpathSync(tmpdir()), "application-config-"));
    try { const link = join(dir, "link"); symlinkSync(join(dir, "missing"), link); expect(() => readConfig({ ...env, APPLICATIONS_INTAKE_ROOT: link })).toThrow("UNSAFE_PATH"); }
    finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it("rejects production test clocks", () => { expect(() => readConfig({ ...env, APPLICATIONS_TEST_NOW: "2026-10-09T10:00:00.000Z" })).toThrow("TEST_CLOCK_FORBIDDEN"); });
  it("does not allow a non-HTTP scheme merely because the test origin is local", () => {
    expect(() => readConfig({ ...env, NODE_ENV: "test", APPLICATIONS_ORIGIN: "ftp://localhost" })).toThrow("INVALID_ORIGIN");
  });
  it("keeps unauthenticated pilot visitors disabled", () => {
    expect(readConfig({ ...env, APPLICATIONS_MODE: "pilot" })).toMatchObject({ public: { enabled: false, mode: "pilot" } });
  });
  it("exposes only public limits and jobs without paths or secrets", () => {
    const config = readConfig({ ...env, APPLICATIONS_ENCRYPTION_KEY: "synthetic-secret", APPLICATIONS_SIGNING_KEY: "synthetic-signing-secret" }) as { public: unknown };
    expect(config.public).toEqual({ enabled: true, mode: "enabled", limits: { maxFiles: 5, maxFileBytes: 5242880, maxTotalBytes: 10485760 }, jobs: [{ id: "sales-fulltime", label: "Verkauf Vollzeit (m/w/d)" }, { id: "sales-parttime", label: "Verkauf Teilzeit bis zu 150 Stunden/Monat (m/w/d)" }] });
  });
  it("permits an injected clock only in a local test process", () => {
    const config = readConfig({ ...env, NODE_ENV: "test", APPLICATIONS_ORIGIN: "http://localhost:3105", APPLICATIONS_TEST_NOW: "2026-10-09T10:00:00.000Z" }) as { clock: { now(): Date } };
    expect(config.clock.now().toISOString()).toBe("2026-10-09T10:00:00.000Z");
  });
});
describe("validated registry values", () => {
  it.each([
    [applicationId, "not-an-id", "INVALID_APPLICATION_ID"],
    [staffId, "../niko", "INVALID_STAFF_ID"],
    [dateOnly, "2026-02-30", "INVALID_DATE_ONLY"],
    [digest, "g".repeat(64), "INVALID_DIGEST"],
    [utcInstant, "2026-10-09T12:00:00+02:00", "INVALID_INSTANT"],
  ] as const)("rejects invalid input %s %s", (parse, value, error) => {
    expect(() => parse(value)).toThrow(error);
  });
  it("accepts validated identifiers and a real leap day", () => {
    expect(applicationId("00000000-0000-4000-8000-000000000001")).toBe("00000000-0000-4000-8000-000000000001");
    expect(staffId("niko")).toBe("niko");
    expect(dateOnly("2028-02-29")).toBe("2028-02-29");
    expect(digest("a".repeat(64))).toBe("a".repeat(64));
    expect(utcInstant("2026-10-09T10:00:00.000Z")).toBe("2026-10-09T10:00:00.000Z");
  });
});
