import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { createLocalDiagnosticSourceInspector } from "./parser-process";
import { decodeRasterStream } from "./raster-protocol";
import { RECONSTRUCTION_LIMITS as limits } from "./reconstruction-limits";
import type { RasterPort } from "./reconstruction-types";

export const PINNED_POPPLER_VERSION = "26.10.0";
export const rasterReadiness = Object.freeze({ productionReady: false, reason: "LINUX_RASTER_SANDBOX_UNIMPLEMENTED" });
export function requireLocalTools(popplerPath: string, qpdfPath: string): void {
  if (process.env.NODE_ENV !== "test" || !isAbsolute(popplerPath) || !isAbsolute(qpdfPath)) throw new Error("LOCAL_DIAGNOSTIC_ONLY");
}
export function rasterChildArgs(): string[] {
  const compiled = join(__dirname, "raster-child.js");
  return existsSync(compiled) ? [compiled] : ["--import", require.resolve("tsx"), join(__dirname, "raster-child.ts")];
}
/** Strict P6 RGB framing. A single page is bounded before pixel allocation. */
export function decodePpm(bytes: Uint8Array): { width: number; height: number; channels: 3; pixels: Uint8Array } {
  const data = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength); let offset = 0;
  const token = (): string => {
    while (offset < data.length) {
      if ([9,10,13,32].includes(data[offset])) { offset++; continue; }
      if (data[offset] === 35) { while (offset < data.length && data[offset] !== 10) offset++; continue; } break;
    }
    const start = offset; while (offset < data.length && ![9,10,13,32,35].includes(data[offset])) { if (offset - start > 16) throw new Error("RASTER_PROTOCOL"); offset++; }
    if (offset === start || offset > 4096) throw new Error("RASTER_PROTOCOL"); return data.toString("ascii", start, offset);
  };
  if (token() !== "P6") throw new Error("RASTER_PROTOCOL");
  const w = token(), h = token(); if (!/^[1-9]\d*$/.test(w) || !/^[1-9]\d*$/.test(h) || token() !== "255") throw new Error("RASTER_PROTOCOL");
  const width = Number(w), height = Number(h);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width > limits.edgePixels || height > limits.edgePixels || width * height > limits.pdfPagePixels) throw new Error("RASTER_LIMIT");
  if (![9,10,13,32].includes(data[offset])) throw new Error("RASTER_PROTOCOL");
  offset++; // Exactly one separator: pixel values can themselves be whitespace or '#'.
  if (data.length - offset !== width * height * 3) throw new Error("RASTER_BYTES");
  return { width, height, channels: 3, pixels: data.subarray(offset) };
}
export function createLocalDiagnosticRaster(popplerPath: string, qpdfPath: string): RasterPort {
  requireLocalTools(popplerPath, qpdfPath);
  const inspector = createLocalDiagnosticSourceInspector(qpdfPath);
  return { async render(file, emit, signal) {
    requireLocalTools(popplerPath, qpdfPath);
    const source = { name: file.name, path: file.path, bytes: file.bytes, mediaType: file.mediaType, digest: file.digest };
    const result = await inspector.inspect(source, signal);
    if (signal.aborted) throw new Error("RASTER_TIMEOUT");
    if (result.kind !== "inspected") throw new Error("RASTER_SOURCE");
    const child = spawn(process.execPath, rasterChildArgs(), { detached: true, cwd: "/", env: { NODE_ENV: "test", TZ: "UTC", LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin", UV_THREADPOOL_SIZE: "1" }, stdio: ["pipe", "pipe", "pipe"] });
    let failed = false;
    const kill = () => { if (child.pid) { try { process.kill(-child.pid, "SIGKILL"); } catch { /* Already closed. */ } } };
    const cancel = () => { failed = true; kill(); };
    const timer = setTimeout(cancel, 30_000); signal.addEventListener("abort", cancel, { once: true });
    child.stderr.on("data", cancel); child.on("error", cancel); child.stdin.on("error", cancel);
    const closed = new Promise<number | null>(resolve => { child.on("exit", kill); child.on("close", code => resolve(failed ? null : code)); });
    child.stdin.end(JSON.stringify({ version: 1, operation: "raster", file: source, popplerPath, qpdfPath })); if (signal.aborted) cancel();
    try { return await decodeRasterStream(child.stdout, result.inspection, async frame => { if (signal.aborted) throw new Error("RASTER_TIMEOUT"); await emit(frame); }, closed); }
    catch { cancel(); throw new Error(signal.aborted ? "RASTER_TIMEOUT" : "RASTER_PROCESS"); }
    finally { kill(); await closed; clearTimeout(timer); signal.removeEventListener("abort", cancel); }
  } };
}
