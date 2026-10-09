import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLocalClamDiagnosticPort, scanSnapshot } from "../src/scanner";
import { createServer, type Server } from "node:net";
import { once } from "node:events";
import { utcInstant, type ScannerPort, type SnapshotFile } from "../src/types";
import { fixture, snapshot, staticPdf } from "./fixtures/synthetic";
let root: string; let file: SnapshotFile;
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), "application-scan-")); file = await fixture(root, staticPdf()); vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] }); vi.setSystemTime(new Date("2026-10-09T12:00:00.000Z")); });
afterEach(async () => { vi.useRealTimers(); await rm(root, { recursive: true, force: true }); });
function port(overrides = {}): ScannerPort { return { assurance: "qualified-local-engine", async scan(file) { return { kind: "clean", complete: true, digest: file.digest, bytes: file.bytes, signatureTime: utcInstant("2026-10-09T11:00:00.000Z"), engineIdentity: "synthetic-engine/1", ...overrides }; } }; }
describe("fail closed scan orchestration (engine is a stub)", () => {
  it("returns only exact snapshot digests after complete fresh scans", async () => { expect(await scanSnapshot(snapshot([file]), port())).toEqual({ kind: "clean", scannedDigests: [file.digest] }); });
  it.each([["2026-10-08T11:59:59.999Z", "STALE_SIGNATURES"], ["2026-10-09T12:00:00.001Z", "STALE_SIGNATURES"]])("rejects bad signature age %s", async (signatureTime, reason) => { expect(await scanSnapshot(snapshot([file]), port({ signatureTime }))).toEqual({ kind: "blocked", reason }); });
  it("permits exactly 24h but never incomplete scans", async () => {
    expect((await scanSnapshot(snapshot([file]), port({ signatureTime: "2026-10-08T12:00:00.000Z" }))).kind).toBe("clean");
    expect(await scanSnapshot(snapshot([file]), port({ complete: false }))).toEqual({ kind: "blocked", reason: "INCOMPLETE_SCAN" });
    expect(await scanSnapshot(snapshot([file]), port({ complete: "yes" }))).toEqual({ kind: "blocked", reason: "INCOMPLETE_SCAN" });
  });
  it("does not qualify local protocol tests as real scanner evidence", async () => { expect(await scanSnapshot(snapshot([file]), { ...port(), assurance: "local-test" })).toEqual({ kind: "blocked", reason: "NOT_READY" }); });
  it("detects a scanner changing the private file", async () => {
    const scanner = port(); const scan = scanner.scan;
    scanner.scan = async (f, signal) => { const result = await scan(f, signal); await writeFile(f.path, "changed"); return result; };
    expect(await scanSnapshot(snapshot([file]), scanner)).toEqual({ kind: "blocked", reason: "DIGEST_MISMATCH" });
  });
  it("times out without freeing the single scan slot until cancellation settles", async () => {
    let started!: () => void, finish!: () => void; const ready = new Promise<void>(resolve => { started = resolve; });
    const stalled = port(); const scan = stalled.scan;
    stalled.scan = async (f, signal) => { started(); await new Promise<void>(resolve => { finish = resolve; }); return scan(f, signal); };
    const pending = scanSnapshot(snapshot([file]), stalled); await ready;
    expect(await scanSnapshot(snapshot([file]), port())).toEqual({ kind: "blocked", reason: "BUSY" });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(await pending).toEqual({ kind: "blocked", reason: "TIMEOUT" });
    expect(await scanSnapshot(snapshot([file]), port())).toEqual({ kind: "blocked", reason: "BUSY" });
    finish(); await new Promise(resolve => setImmediate(resolve));
    expect((await scanSnapshot(snapshot([file]), port())).kind).toBe("clean");
  });
  it.each([{ kind: "infected" }, { kind: "error" }, { digest: "f".repeat(64) }, { bytes: 0 }, { engineIdentity: "" }])("does not clean a bad result %j", async result => { expect((await scanSnapshot(snapshot([file]), port(result))).kind).toBe("blocked"); });
});

describe("real Unixsocket framing with a synthetic ClamD protocol peer, NOT an engine", () => {
  let server: Server | undefined;
  afterEach(async () => { if (server) { const closed = once(server, "close"); server.close(); await closed; server = undefined; } });
  async function peer(scanReply: Buffer, versions = ["ClamAV 1.4.3/27700/Fri Oct  9 11:00:00 2026\0"]) {
    const path = join(root, "clam.sock"); let versionIndex = 0; const received: Buffer[] = [];
    server = createServer(socket => {
      let data = Buffer.alloc(0);
      socket.on("data", chunk => {
        data = Buffer.concat([data, chunk]);
        if (data.equals(Buffer.from("zVERSION\0"))) { socket.end(versions[Math.min(versionIndex++, versions.length - 1)]); return; }
        if (!data.subarray(0, 10).equals(Buffer.from("zINSTREAM\0"))) return;
        let offset = 10; const parts: Buffer[] = [];
        while (offset + 4 <= data.length) {
          const length = data.readUInt32BE(offset); offset += 4;
          if (!length) { received.push(Buffer.concat(parts)); socket.write(scanReply.subarray(0, 3)); socket.end(scanReply.subarray(3)); return; }
          if (offset + length > data.length) return;
          parts.push(data.subarray(offset, offset + length)); offset += length;
        }
      });
    });
    server.listen(path); await once(server, "listening"); return { path, received };
  }
  it("streams exact snapshot bytes and never promotes OK to qualified completeness", async () => {
    const { path, received } = await peer(Buffer.from("stream: OK\0"));
    const scanner = createLocalClamDiagnosticPort(path);
    const result = await scanner.scan(file, new AbortController().signal);
    expect(result).toEqual({ kind: "clean", complete: false, digest: file.digest, bytes: file.bytes, signatureTime: "2026-10-09T11:00:00.000Z", engineIdentity: "ClamAV 1.4.3/27700/Fri Oct  9 11:00:00 2026" });
    expect(received).toEqual([staticPdf()]);
    expect(await scanSnapshot(snapshot([file]), scanner)).toEqual({ kind: "blocked", reason: "NOT_READY" });
  });
  it.each(["stream: OK", "stream: OK\0extra\0", "stream: ERROR\0", "stream: synthetic FOUND\0"])("does not accept ambiguous/incomplete/detected response %s", async reply => {
    const { path } = await peer(Buffer.from(reply));
    const result = await createLocalClamDiagnosticPort(path).scan(file, new AbortController().signal);
    expect(result.kind).not.toBe("clean"); expect(result.complete).toBe(false);
  });
  it("fails when database identity changes across scan", async () => {
    const { path } = await peer(Buffer.from("stream: OK\0"), ["ClamAV 1.4.3/27700/Fri Oct  9 11:00:00 2026\0", "ClamAV 1.4.3/27701/Fri Oct  9 11:30:00 2026\0"]);
    expect((await createLocalClamDiagnosticPort(path).scan(file, new AbortController().signal)).kind).toBe("error");
  });
});
