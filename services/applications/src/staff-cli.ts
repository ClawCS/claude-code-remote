import { emitKeypressEvents, type Key } from "node:readline";
import { PassThrough, type Readable, type Writable } from "node:stream";
import { openRepository } from "./repository";
import { trustedAuthEpoch } from "./auth";
import type { ApplicationRepository, AuthDependencies, Clock } from "./types";

export interface SecretInput extends Readable { readonly isTTY?: boolean; readonly isRaw?: boolean; setRawMode?(value: boolean): unknown }
export interface SecretOutput extends Writable { readonly isTTY?: boolean }
export interface StaffCliOptions { readonly input: SecretInput; readonly output: SecretOutput; readonly databasePath: string; readonly workerUid: number; readonly dependencies: AuthDependencies; readonly clock?: Clock }
const abort = () => new Error("STAFF_CLI_ABORTED");
function terminal(input: SecretInput, output: SecretOutput): void { if (input.isTTY !== true || output.isTTY !== true || typeof input.setRawMode !== "function" || input.destroyed || input.readableEnded || output.destroyed || output.writableEnded) throw abort(); }
function writePrivate(output: SecretOutput, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const complete = (error?: Error | null) => {
      if (settled) return; settled = true; output.removeListener("error", failed);
      if (error) reject(abort()); else resolve();
    };
    const failed = () => complete(abort());
    output.once("error", failed);
    try {
      if (output.isTTY !== true || output.destroyed || output.writableEnded) throw abort();
      output.write(value, error => {
        // A failed native write emits its error after invoking this callback.
        // Retain our listener until that event, with a handled fallback.
        if (error) setImmediate(failed); else complete();
      });
    } catch { complete(abort()); }
  });
}

// No readline Interface/history/masking output or private API overrides. Handled
// exits restore owned terminal/listener state. SIGKILL/crashes cannot guarantee
// restoration; JS strings cannot be reliably erased. Terminal recordings may
// capture intentionally displayed provisioning material: use a private terminal.
export function readSecret(input: SecretInput, output: SecretOutput, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try { terminal(input, output); if (!/^[A-Za-z0-9 :?()-]{1,120}$/.test(prompt)) throw abort(); }
    catch { reject(abort()); return; }
    const raw = input.isRaw === true, paused = input.isPaused();
    const decoder = new PassThrough();
    let value = "", settled = false, entering = false, timer: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      input.removeListener("data", data); input.removeListener("end", fail); input.removeListener("close", fail); input.removeListener("error", fail); output.removeListener("error", fail);
      decoder.removeAllListeners(); decoder.destroy();
      try { input.setRawMode!(raw); } catch { /* Best possible handled cleanup. */ }
      if (paused) input.pause();
    };
    const complete = (success: boolean) => {
      if (settled) return; settled = true; cleanup();
      if (success) resolve(value); else reject(abort());
      value = "";
    };
    const finish = (success: boolean) => {
      if (settled) return;
      if (!success) { complete(false); return; }
      void writePrivate(output, "\n").then(() => complete(true), () => complete(false));
    };
    function fail() { finish(false); }
    function keypress(character: string | undefined, key: Key) {
      if (settled) return;
      if (entering || key.ctrl || key.meta || key.name === "escape") { fail(); return; }
      if (key.name === "return" || key.name === "enter") { entering = true; queueMicrotask(() => finish(true)); return; }
      if (key.name === "backspace") { value = [...value].slice(0, -1).join(""); return; }
      if (!character || /[\u0000-\u001f\u007f-\u009f]/u.test(character) || (key.name && ["up", "down", "left", "right", "delete", "home", "end", "tab"].includes(key.name))) { fail(); return; }
      value += character;
      if (Buffer.byteLength(value, "utf8") > 512 || [...value].length > 128) fail();
    }
    function data(chunk: Buffer | string) {
      const text = String(chunk), line = text.search(/[\r\n]/);
      if (entering || Buffer.byteLength(text) > 513 || text.includes("\u001b") || (line >= 0 && line !== text.length - 1)) { fail(); return; }
      decoder.write(chunk);
    }
    try {
      // Discard buffered typeahead before a new question; never turn it into
      // password confirmation. Raw mode stops kernel echo for future input.
      input.pause(); while (input.read() !== null) { /* discard */ }
      input.setRawMode!(true);
      emitKeypressEvents(decoder);
      decoder.on("keypress", keypress); input.on("data", data); input.once("end", fail); input.once("close", fail); input.once("error", fail); output.once("error", fail);
      timer = setTimeout(fail, 60000);
      output.write(prompt); input.resume();
    } catch { fail(); }
  });
}

// Importable only; no argv/env secret parsing, process launch, account or network
// action occurs at import. The operational gate must stop the serving worker and
// provision its exact OS identity/trust port before invoking this factory.
export function createStaffCli(options: StaffCliOptions) {
  let running = false;
  return {
    async run(mode: "enroll" | "replace-totp" | "replace-recovery"): Promise<void> {
      if (running) throw abort(); running = true;
      let repository: ApplicationRepository | undefined;
      const originalRaw = options.input.isRaw === true, originalPaused = options.input.isPaused();
      let ownsTerminal = false, streamFailed = false;
      const streamFailure = () => { streamFailed = true; };
      const checkTerminal = () => { terminal(options.input, options.output); if (streamFailed) throw abort(); };
      try {
        terminal(options.input, options.output);
        if (!["enroll", "replace-totp", "replace-recovery"].includes(mode) || !Number.isSafeInteger(options.workerUid) || options.workerUid < 0 || process.getuid?.() !== options.workerUid || (options.clock && process.env.NODE_ENV !== "test")) throw abort();
        trustedAuthEpoch(options.dependencies);
        repository = openRepository(options.databasePath, options.clock);
        const auth = repository.createAuthentication(options.dependencies);
        options.input.setRawMode!(true); options.input.pause(); ownsTerminal = true;
        options.input.on("error", streamFailure); options.input.on("end", streamFailure); options.output.on("error", streamFailure);
        await writePrivate(options.output, "Private maintenance for Nikolaos Jammers (niko). Do not record this terminal.\n");
        const password = await readSecret(options.input, options.output, "Password: ");
        const stage = mode === "enroll"
          ? await auth.beginEnrollment(password, await readSecret(options.input, options.output, "Confirm password: "))
          : await auth.beginReplacement(mode === "replace-totp"
            ? { password, otp: await readSecret(options.input, options.output, "Current OTP: "), trustedIp: "127.0.0.1" }
            : { password, recoveryCode: await readSecret(options.input, options.output, "Recovery code: "), trustedIp: "127.0.0.1" });
        checkTerminal(); await writePrivate(options.output, `Provision once in your authenticator:\n${stage.provisioningUri}\n`);
        const code = await readSecret(options.input, options.output, "New OTP: ");
        checkTerminal(); const result = mode === "enroll" ? auth.finishEnrollment(stage.handle, code) : auth.finishReplacement(stage.handle, code);
        await writePrivate(options.output, `Store these recovery codes privately; displayed once:\n${result.recoveryCodes.join("\n")}\n`);
      } catch { throw abort(); }
      finally {
        if (ownsTerminal) {
          options.input.removeListener("error", streamFailure); options.input.removeListener("end", streamFailure); options.output.removeListener("error", streamFailure);
          try { options.input.setRawMode!(originalRaw); } catch { /* Crash/terminal loss cannot guarantee restoration. */ }
          if (originalPaused) options.input.pause(); else options.input.resume();
        }
        try { repository?.close(); } finally { running = false; }
      }
    },
  };
}
