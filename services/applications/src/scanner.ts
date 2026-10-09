import { FileCheckError, readSnapshotFile } from "./file-validation";
import { createConnection } from "node:net";
import { lstat } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { utcInstant, type ProcessingSnapshot, type ScannerPort, type ScanResult, type ScanFailure, type Digest, type Instant } from "./types";

const MAX_SIGNATURE_AGE_MS = 24 * 60 * 60 * 1000;
const SCAN_TIMEOUT_MS = 30_000;
let busy = false;
export const scannerReadiness = Object.freeze({ productionReady: false, reason: "LOCAL_ENGINE_AND_CONFIG_UNQUALIFIED" });
export const unavailableScanner: ScannerPort = { assurance: "unavailable", async scan() { throw new Error("NOT_READY"); } };

function parseUtcVersion(response: string): { signatureTime: Instant; engineIdentity: string } {
  const match = /^ClamAV ([0-9]+\.[0-9]+\.[0-9]+)\/([0-9]+)\/(Sun|Mon|Tue|Wed|Thu|Fri|Sat) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ([ 0-3][0-9]) ([0-2][0-9]):([0-5][0-9]):([0-5][0-9]) ([0-9]{4})\0$/.exec(response);
  if (!match) throw new Error("INVALID_VERSION");
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(match[4]);
  const date = new Date(Date.UTC(Number(match[9]), month, Number(match[5]), Number(match[6]), Number(match[7]), Number(match[8])));
  if (date.getUTCFullYear() !== Number(match[9]) || date.getUTCMonth() !== month || date.getUTCDate() !== Number(match[5]) || date.getUTCHours() !== Number(match[6]) || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getUTCDay()] !== match[3]) throw new Error("INVALID_VERSION");
  const age = Date.now() - date.getTime(); if (age < 0 || age > MAX_SIGNATURE_AGE_MS) throw new Error("STALE_SIGNATURES");
  return { signatureTime: utcInstant(date.toISOString()), engineIdentity: response.slice(0, -1) };
}
async function clamCommand(socketPath: string, frames: Buffer[], signal: AbortSignal): Promise<string> {
  if (signal.aborted) throw new Error("ABORTED");
  if (!(await lstat(socketPath)).isSocket()) throw new Error("LOCAL_SOCKET_REQUIRED");
  return new Promise((resolve, reject) => {
    const socket = createConnection({ path: socketPath }); let reply = Buffer.alloc(0), ended = false, failed = false;
    const abort = () => { failed = true; socket.destroy(); };
    signal.addEventListener("abort", abort, { once: true });
    socket.on("error", () => { failed = true; });
    socket.on("data", chunk => { if (reply.length + chunk.length > 4096) abort(); else reply = Buffer.concat([reply, chunk]); });
    socket.on("end", () => { ended = true; });
    socket.on("close", () => {
      signal.removeEventListener("abort", abort);
      if (failed || !ended || !reply.length || reply[reply.length - 1] !== 0 || reply.subarray(0, -1).includes(0)) reject(new Error("INCOMPLETE_REPLY"));
      else resolve(reply.toString("utf8"));
    });
    socket.on("connect", () => {
      void (async () => {
        for (const frame of frames) {
          if (signal.aborted || socket.destroyed) throw new Error("ABORTED");
          await new Promise<void>((resolveWrite, rejectWrite) => socket.write(frame, error => error ? rejectWrite(error) : resolveWrite()));
        }
      })().catch(abort);
    });
    if (signal.aborted) abort();
  });
}
export function createLocalClamDiagnosticPort(socketPath: string): ScannerPort {
  if (process.env.NODE_ENV !== "test" || !isAbsolute(socketPath)) throw new Error("LOCAL_DIAGNOSTIC_ONLY");
  return {
    assurance: "local-test",
    async scan(file, signal) {
      if (process.env.NODE_ENV !== "test") throw new Error("LOCAL_DIAGNOSTIC_ONLY");
      const abort = new AbortController(), cancel = () => abort.abort();
      signal.addEventListener("abort", cancel, { once: true }); if (signal.aborted) cancel();
      const timer = setTimeout(cancel, SCAN_TIMEOUT_MS);
      const base = { complete: false, digest: file.digest, bytes: file.bytes, signatureTime: utcInstant("1970-01-01T00:00:00.000Z"), engineIdentity: "" };
      try {
        const bytes = await readSnapshotFile(file);
        const before = parseUtcVersion(await clamCommand(socketPath, [Buffer.from("zVERSION\0")], abort.signal));
        const frames: Buffer[] = [Buffer.from("zINSTREAM\0")];
        for (let offset = 0; offset < bytes.length; offset += 65536) { const chunk = bytes.subarray(offset, offset + 65536), length = Buffer.alloc(4); length.writeUInt32BE(chunk.length); frames.push(length, chunk); }
        frames.push(Buffer.alloc(4));
        const reply = await clamCommand(socketPath, frames, abort.signal);
        const after = parseUtcVersion(await clamCommand(socketPath, [Buffer.from("zVERSION\0")], abort.signal));
        await readSnapshotFile(file);
        if (before.engineIdentity !== after.engineIdentity) throw new Error("ENGINE_CHANGED");
        // VERSION sandwich is not atomic and OK supplies no full-coverage attestation.
        // Never make complete=true here without a separately reviewed real-engine adapter.
        return { ...base, ...after, kind: reply === "stream: OK\0" ? "clean" : /^stream: [^\0]+ FOUND\0$/.test(reply) ? "infected" : "error" };
      } catch { return { ...base, kind: "error" }; }
      finally { clearTimeout(timer); signal.removeEventListener("abort", cancel); }
    },
  };
}
class ScanError extends Error { constructor(readonly reason: ScanFailure) { super(reason); } }
export async function scanSnapshot(snapshot: ProcessingSnapshot, scanner: ScannerPort): Promise<ScanResult> {
  if (scanner?.assurance !== "qualified-local-engine") return { kind: "blocked", reason: "NOT_READY" };
  if (busy) return { kind: "blocked", reason: "BUSY" };
  if (snapshot.files.length > 5 || snapshot.files.reduce((sum, f) => sum + f.bytes, 0) > 10 * 1024 * 1024) return { kind: "blocked", reason: "FILE_LIMIT" };
  busy = true;
  const abort = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
  const operation = (async (): Promise<ScanResult> => {
    const scannedDigests: Digest[] = [];
    for (const file of snapshot.files) {
      if (abort.signal.aborted) throw new ScanError("TIMEOUT");
      await readSnapshotFile(file);
      const result = await scanner.scan(file, abort.signal);
      if (abort.signal.aborted) throw new ScanError("TIMEOUT");
      await readSnapshotFile(file);
      if (result.kind === "infected") throw new ScanError("INFECTED");
      if (result.kind !== "clean") throw new ScanError("SCANNER_ERROR");
      if (result.complete !== true || typeof result.engineIdentity !== "string" || !result.engineIdentity) throw new ScanError("INCOMPLETE_SCAN");
      if (result.digest !== file.digest || result.bytes !== file.bytes) throw new ScanError("DIGEST_MISMATCH");
      const time = Date.parse(result.signatureTime), age = Date.now() - time;
      if (!Number.isFinite(time) || new Date(time).toISOString() !== result.signatureTime || age < 0 || age > MAX_SIGNATURE_AGE_MS) throw new ScanError("STALE_SIGNATURES");
      scannedDigests.push(file.digest);
    }
    return { kind: "clean", scannedDigests };
  })();
  // A timed-out port that ignores cancellation keeps the process-wide slot locked.
  // Returning a timeout must never permit a second overlapping engine operation.
  const settled = operation.finally(() => { busy = false; if (timer) clearTimeout(timer); });
  try {
    return await Promise.race([settled, new Promise<ScanResult>((_, reject) => { timer = setTimeout(() => { abort.abort(); reject(new ScanError("TIMEOUT")); }, SCAN_TIMEOUT_MS); })]);
  } catch (error) {
    return { kind: "blocked", reason: error instanceof ScanError ? error.reason : error instanceof FileCheckError && error.reason === "DIGEST_MISMATCH" ? "DIGEST_MISMATCH" : "SCANNER_ERROR" };
  }
}
