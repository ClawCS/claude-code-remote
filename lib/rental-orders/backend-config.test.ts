import { afterEach, describe, expect, it } from "vitest";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadRentalConfig, publicRentalConfig } from "./config";

const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })));
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "rental-config-")); dirs.push(dir);
  const file = join(dir, "settings.json");
  const settings = { issuer: { name: "Example business", address: ["Example Street 1", "12345 Example"], taxNumber: "TEST TAX", vatRateBps: 1900, invoicePrefix: "RE" }, termsVersion: "v1", termsText: "Approved terms", privacyText: "Approved privacy", marketEmail: "market@example.com", publicOrigin: "https://rent.example.com", selfPickupOnly: true, noExtraUpfrontCharges: true, onlinePayment: true };
  const env = { RENTAL_MODE: "live", RENTAL_DATA_DIR: join(dir, "private"), RENTAL_SETTINGS_FILE: file, RENTAL_ADMIN_SECRET: "a".repeat(40), RENTAL_SESSION_SECRET: "s".repeat(40), MOLLIE_API_KEY: "live_examplekey", SMTP_HOST: "smtp.example.com", SMTP_PORT: "465", SMTP_SECURE: "true", SMTP_USER: "mailer", SMTP_PASS: "smtp-secret", SMTP_FROM: "rentals@example.com" };
  writeFileSync(file, JSON.stringify(settings), { mode: 0o600 });
  return { dir, file, settings, env };
}

describe("rental runtime activation", () => {
  it("does not activate from secrets alone or incomplete live settings", () => {
    expect(loadRentalConfig({}).enabled).toBe(false);
    const config = loadRentalConfig({ RENTAL_MODE: "live" });
    expect(config.enabled).toBe(false);
    expect(config.issues.length).toBeGreaterThan(0);
    expect(publicRentalConfig(config).onlinePayment).toBe(false);
  });
  it("requires explicit test mode and confines test public origin to loopback", () => {
    const config = loadRentalConfig({ RENTAL_MODE: "test", RENTAL_DATA_DIR: "/tmp/rental-test" });
    expect(config.enabled).toBe(true);
    expect(config.issuer.invoicePrefix).toMatch(/^TEST/);
    expect(config.marketEmail).toMatch(/\.invalid$/);
    expect(loadRentalConfig({ RENTAL_MODE: "test", RENTAL_PUBLIC_ORIGIN: "https://example.com", RENTAL_DATA_DIR: "/tmp/rental-test" }).enabled).toBe(false);
  });
  it("activates complete live config without disclosing secrets publicly", () => {
    const { env } = fixture(); const config = loadRentalConfig(env);
    expect(config.issues).toEqual([]); expect(config.enabled).toBe(true);
    expect(publicRentalConfig(config)).toMatchObject({ enabled: true, testMode: false, onlinePayment: true, termsVersion: "v1" });
    expect(JSON.stringify(publicRentalConfig(config))).not.toContain("smtp-secret");
  });
  it("never silently treats unknown upfront charges as zero", () => {
    const { env, settings, file } = fixture();
    writeFileSync(file, JSON.stringify({ ...settings, noExtraUpfrontCharges: undefined }));
    expect(loadRentalConfig(env).enabled).toBe(false);
  });
  it("rejects relative storage and insecure live origins", () => {
    const { env, settings, file } = fixture();
    writeFileSync(file, JSON.stringify({ ...settings, publicOrigin: "http://rent.example.com" }));
    expect(loadRentalConfig({ ...env, RENTAL_DATA_DIR: "relative" }).enabled).toBe(false);
  });
  it("rejects world-readable private configuration", () => {
    const { env, file } = fixture(); chmodSync(file, 0o644);
    expect(loadRentalConfig(env).enabled).toBe(false);
  });
  it.each(["ftp://localhost", "http://user:pass@localhost:3000", "http://localhost:3000/arbitrary?token=secret"])("rejects invalid test origin %s", origin => {
    expect(loadRentalConfig({ RENTAL_MODE: "test", RENTAL_DATA_DIR: "/tmp/rental-test", RENTAL_PUBLIC_ORIGIN: origin }).enabled).toBe(false);
  });
  it("does not accept built-in public test credentials as live secrets", () => {
    const { env } = fixture(); const test = loadRentalConfig({ RENTAL_MODE: "test", RENTAL_DATA_DIR: "/tmp/rental-test" });
    expect(loadRentalConfig({ ...env, RENTAL_ADMIN_SECRET: test.adminSecret, RENTAL_SESSION_SECRET: test.sessionSecret }).enabled).toBe(false);
  });
  it("rejects storage inside public assets or behind application symlinks", () => {
    const { env, dir } = fixture();
    expect(loadRentalConfig({ ...env, RENTAL_DATA_DIR: join(dir, "public", "rentals") }).enabled).toBe(false);
    const target = join(dir, "target"); mkdirSync(target); symlinkSync(target, join(dir, "linked"));
    expect(loadRentalConfig({ ...env, RENTAL_DATA_DIR: join(dir, "linked", "rentals") }).enabled).toBe(false);
  });
  it.each(["/", "/tmp", "/var", process.cwd()])("requires a dedicated data directory, not %s", path => {
    expect(loadRentalConfig({ RENTAL_MODE: "test", RENTAL_DATA_DIR: path }).enabled).toBe(false);
  });
  it("disables live settings with an address rejected by the actual SMTP boundary", () => {
    const { env, settings, file } = fixture();
    expect(loadRentalConfig({ ...env, SMTP_FROM: "sender(comment)@example.com" }).enabled).toBe(false);
    writeFileSync(file, JSON.stringify({ ...settings, marketEmail: "market[alias]@example.com" }));
    expect(loadRentalConfig(env).enabled).toBe(false);
  });
  it.each([
    ["SMTP_HOST", "smtp.example.com/path"],
    ["SMTP_HOST", "smtp example.com"],
    ["SMTP_USER", "mail\nuser"],
    ["SMTP_PASS", "mail\npassword"],
    ["SMTP_FROM", `${"x".repeat(245)}@example.com`],
    ["MOLLIE_API_KEY", "live_bad key-value"],
    ["MOLLIE_API_KEY", `live_${"x".repeat(201)}`],
  ])("does not advertise ordering with %s rejected by its transport adapter", (name, value) => {
    const { env } = fixture(); const config = loadRentalConfig({ ...env, [name]: value });
    expect(config.enabled).toBe(false);
    expect(publicRentalConfig(config).onlinePayment).toBe(false);
    expect(JSON.stringify(config.issues)).not.toContain(value);
  });
  it("does not activate a market mailbox too long for its mail boundary", () => {
    const { env, settings, file } = fixture();
    writeFileSync(file, JSON.stringify({ ...settings, marketEmail: `${"x".repeat(245)}@example.com` }));
    expect(loadRentalConfig(env).enabled).toBe(false);
  });
});
