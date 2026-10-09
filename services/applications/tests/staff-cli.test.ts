import { afterEach, describe, expect, it, vi } from "vitest";
import { PassThrough, Writable } from "node:stream";
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openRepository } from "../src/repository";
import { createStaffCli, readSecret } from "../src/staff-cli";
import { digest } from "../src/types";
import { Secret, TOTP } from "otpauth";

class Input extends PassThrough { isTTY = true; isRaw = false; setRawMode(value: boolean) { this.isRaw = value; return this; } }
function terminal() {
  const input = new Input(); let shown = "";
  const output = Object.assign(new Writable({ write(chunk, _encoding, next) { shown += String(chunk); next(); } }), { isTTY: true });
  return { input, output, shown: () => shown };
}
afterEach(() => vi.useRealTimers());
describe("private interactive input", () => {
  it("collects a Unicode single-line paste without echo and restores owned state/listeners", async () => {
    const tty = terminal(), pending = readSecret(tty.input, tty.output, "Secret: ");
    tty.input.write("synthetic café secret\r");
    expect(await pending).toBe("synthetic café secret");
    expect(tty.shown()).toBe("Secret: \n"); expect(tty.input.isRaw).toBe(false);
    expect(tty.input.listenerCount("data")).toBe(0); expect(tty.input.listenerCount("keypress")).toBe(0);
  });
  it.each(["line one\nline two\n", "secret\u0003", "secret\u0004", "secret\u001b[A", "x".repeat(513)])("aborts unsupported input without reflecting it (%#)", async input => {
    const tty = terminal(), pending = readSecret(tty.input, tty.output, "Secret: ");
    tty.input.write(input); await expect(pending).rejects.toThrow("STAFF_CLI_ABORTED");
    expect(tty.shown()).not.toContain(input); expect(tty.input.isRaw).toBe(false); expect(tty.input.listenerCount("keypress")).toBe(0);
  });
  it("fails on redirected streams, EOF, errors and timeout", async () => {
    const tty = terminal(); tty.output.isTTY = false;
    await expect(readSecret(tty.input, tty.output, "Secret: ")).rejects.toThrow("STAFF_CLI_ABORTED"); expect(tty.shown()).toBe("");
    tty.output.isTTY = true;
    const eof = readSecret(tty.input, tty.output, "Secret: "); tty.input.end(); await expect(eof).rejects.toThrow("STAFF_CLI_ABORTED");
    const error = terminal(), failed = readSecret(error.input, error.output, "Secret: "); error.input.emit("error", new Error("synthetic")); await expect(failed).rejects.toThrow("STAFF_CLI_ABORTED");
    vi.useFakeTimers(); const stalled = terminal(), timeout = readSecret(stalled.input, stalled.output, "Secret: ").catch(error => error.message);
    await vi.advanceTimersByTimeAsync(60000); expect(await timeout).toBe("STAFF_CLI_ABORTED"); expect(stalled.input.isRaw).toBe(false);
  });
  it("never carries typeahead from a first line into confirmation", async () => {
    const tty = terminal(), first = readSecret(tty.input, tty.output, "First: ");
    tty.input.write("first secret\rconfirmation secret\r");
    await expect(first).rejects.toThrow("STAFF_CLI_ABORTED");
  });
  it("rejects an output failure during completion instead of resolving a secret after the terminal fails", async () => {
    const input = new Input(), output = Object.assign(new Writable({ write(chunk, _encoding, next) { next(String(chunk) === "\n" ? new Error("synthetic output failure") : undefined); } }), { isTTY: true });
    output.on("error", () => {});
    const pending = readSecret(input, output, "Secret: "); input.write("synthetic secret\r");
    await expect(pending).rejects.toThrow("STAFF_CLI_ABORTED"); expect(input.isRaw).toBe(false);
  });
});
describe("stopped-worker maintenance ownership", () => {
  it("fails before any prompt when the actual serving repository owns the database", async () => {
    const directory = mkdtempSync(join(realpathSync(tmpdir()), "staff-cli-synthetic-")), path = join(directory, "registry.sqlite"), repository = openRepository(path), tty = terminal();
    try {
      const cli = createStaffCli({ input: tty.input, output: tty.output, databasePath: path, workerUid: process.getuid!(), dependencies: { keys: generateKeyPairSync("rsa", { modulusLength: 2048 }), rateKey: randomBytes(32), trust: { currentEpoch: () => digest("a".repeat(64)) } } });
      await expect(cli.run("enroll")).rejects.toThrow("STAFF_CLI_ABORTED"); expect(tty.shown()).toBe("");
    } finally { repository.close(); rmSync(directory, { recursive: true, force: true }); }
  });
  it("enrolls only the fixed identity via confirmed hidden input and displays material once on a private TTY", async () => {
    const directory = mkdtempSync(join(realpathSync(tmpdir()), "staff-cli-synthetic-")), path = join(directory, "registry.sqlite"), input = new Input();
    const password = "Synthetic CLI password only", now = Date.parse("2026-10-09T12:00:00.000Z");
    let shown = "", uri = "", rawBetweenPrompts = false;
    const output = Object.assign(new Writable({ write(chunk, _encoding, next) {
      const text = String(chunk); shown += text;
      if (text === "Password: " || text === "Confirm password: ") queueMicrotask(() => input.write(password + "\r"));
      if (text.includes("otpauth://")) { uri = text.split("\n").find(line => line.startsWith("otpauth://"))!; rawBetweenPrompts = input.isRaw; }
      if (text === "New OTP: ") queueMicrotask(() => input.write(TOTP.generate({ secret: Secret.fromBase32(new URL(uri).searchParams.get("secret")!), algorithm: "SHA1", digits: 6, period: 30, timestamp: now }) + "\r"));
      next();
    } }), { isTTY: true });
    const dependencies = { keys: generateKeyPairSync("rsa", { modulusLength: 2048 }), rateKey: randomBytes(32), trust: { currentEpoch: () => digest("a".repeat(64)) } };
    try {
      const cli = createStaffCli({ input, output, databasePath: path, workerUid: process.getuid!(), dependencies, clock: { now: () => new Date(now) } });
      await cli.run("enroll");
      expect(shown).not.toContain(password); expect(shown.match(/otpauth:\/\//g)).toHaveLength(1);
      expect(shown.match(/^[a-f0-9]{8}(?:-[a-f0-9]{8}){3}$/gm)).toHaveLength(10);
      expect(rawBetweenPrompts).toBe(true); expect(input.isRaw).toBe(false);
      const repository = openRepository(path);
      try { expect((await repository.createAuthentication(dependencies).authenticate({ username: "other", password, otp: "000000", trustedIp: "127.0.0.1" })).kind).toBe("denied"); }
      finally { repository.close(); }
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});
