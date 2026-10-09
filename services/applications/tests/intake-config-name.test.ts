import { describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readIntakeConfig } from "../src/config";
import { openName, sealName, decryptEnvelope } from "../src/crypto";

const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const env = { NODE_ENV: "production", APPLICATIONS_MODE: "enabled", APPLICATIONS_ORIGIN: "https://trinkgut-jammers.de", APPLICATIONS_INTAKE_ROOT: "/srv/trinkgut-intake", APPLICATIONS_SOCKET_PATH: "/run/trinkgut-applications/worker.sock", APPLICATIONS_INTAKE_UID: "1001", APPLICATIONS_SHARED_GID: "1003", APPLICATIONS_INGRESS_MASTER_KEY: Buffer.alloc(32, 7).toString("base64"), APPLICATIONS_WORKER_PUBLIC_KEY: keys.publicKey.export({ type: "spki", format: "pem" }).toString() } satisfies NodeJS.ProcessEnv;
describe("independent ingress config", () => {
  it("boots disabled fallback without acceptance keys or worker configuration", () => {
    const config = readIntakeConfig({ NODE_ENV: "production", APPLICATIONS_MODE: "disabled", APPLICATIONS_ORIGIN: env.APPLICATIONS_ORIGIN });
    expect(config.acceptance).toBeNull();
  });
  it("rejects enabled missing stable secrets and private RSA material", () => {
    expect(() => readIntakeConfig({ ...env, APPLICATIONS_INGRESS_MASTER_KEY: undefined })).toThrow("INVALID_INGRESS_KEY");
    expect(() => readIntakeConfig({ ...env, APPLICATIONS_WORKER_PUBLIC_KEY: keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString() })).toThrow("INVALID_PUBLIC_KEY");
  });
  it("loads stable separated keys without reading worker secrets or private paths", () => {
    const first = readIntakeConfig({ ...env, APPLICATIONS_WORKER_ROOT: "unsafe", APPLICATIONS_ENCRYPTION_KEY: "private-do-not-read", APPLICATIONS_SIGNING_KEY: "private-do-not-read" });
    const second = readIntakeConfig(env);
    expect(first.acceptance!.keys.sessionHash.equals(second.acceptance!.keys.sessionHash)).toBe(true);
    expect(new Set(Object.values(first.acceptance!.keys).map(value => value.toString("hex"))).size).toBe(6);
    expect(JSON.stringify(first)).not.toContain("private-do-not-read");
    expect(first).not.toHaveProperty("worker"); expect(first).not.toHaveProperty("registryPath");
  });
  it("only permits local HTTP and injected clock explicitly in tests", () => {
    expect(() => readIntakeConfig({ ...env, APPLICATIONS_ORIGIN: "http://localhost:3105" })).toThrow("INVALID_ORIGIN");
    expect(() => readIntakeConfig({ ...env, APPLICATIONS_TEST_NOW: "2026-10-09T10:00:00.000Z" })).toThrow("TEST_CLOCK_FORBIDDEN");
    expect(readIntakeConfig({ APPLICATIONS_MODE: "disabled", NODE_ENV: "test", APPLICATIONS_ORIGIN: "http://localhost:3105", APPLICATIONS_TEST_NOW: "2026-10-09T10:00:00.000Z" }).clock.now().toISOString()).toBe("2026-10-09T10:00:00.000Z");
  });
  it("refuses an unsafe existing RPC socket parent without requiring worker private configuration", () => {
    const root = mkdtempSync(join(realpathSync(tmpdir()), "ingress-config-")), incoming = join(root, "incoming"), socket = join(root, "socket");
    try {
      mkdirSync(incoming, { mode: 0o2770 }); chmodSync(incoming, 0o2770); mkdirSync(socket, { mode: 0o777 }); chmodSync(socket, 0o777);
      const local = { ...env, NODE_ENV: "test" as const, APPLICATIONS_ORIGIN: "http://localhost:3105", APPLICATIONS_INTAKE_ROOT: incoming, APPLICATIONS_SOCKET_PATH: join(socket, "worker.sock"), APPLICATIONS_INTAKE_UID: String(process.getuid!()), APPLICATIONS_SHARED_GID: String(process.getgid!()) };
      expect(() => readIntakeConfig(local)).toThrow("UNSAFE_PATH");
      chmodSync(socket, 0o2750); expect(() => readIntakeConfig(local)).not.toThrow();
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
describe("bounded name envelope", () => {
  it("roundtrips the maximum multibyte name and never authenticates as a V1 payload", () => {
    const name = "界".repeat(120), encrypted = sealName(name, keys.publicKey);
    expect(openName(encrypted, keys.privateKey)).toBe(name);
    expect(encrypted.length).toBeLessThanOrEqual(4096);
    expect(() => decryptEnvelope(Buffer.from(encrypted, "base64"), keys.privateKey)).toThrow("AUTHENTICATION_FAILED");
  });
  it("rejects tampering, malformed base64, oversize and invalid names", () => {
    const encrypted = sealName("Synthetic", keys.publicKey), bytes = Buffer.from(encrypted, "base64"); bytes[bytes.length - 1] ^= 1;
    for (const value of [bytes.toString("base64"), encrypted + "\n", "A".repeat(4097), Buffer.from("TJAPP001").toString("base64")]) expect(() => openName(value, keys.privateKey)).toThrow("AUTHENTICATION_FAILED");
    for (const name of ["", "a".repeat(121), "a\0b", "\ud800"]) expect(() => sealName(name, keys.publicKey)).toThrow("INVALID_NAME");
  });
  it("refuses unsupported RSA profiles rather than producing an unusable admission name", () => {
    const unsupported = generateKeyPairSync("rsa", { modulusLength: 2048, publicExponent: 3 });
    expect(() => sealName("Synthetic", unsupported.publicKey)).toThrow("INVALID_PUBLIC_KEY");
  });
});
