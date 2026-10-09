import { TextDecoder } from "node:util";
import { decodeSourceInspection, strictRecord, type DocumentFormat, type RasterFrame, type SourceInspection } from "./reconstruction-types";
import { RECONSTRUCTION_LIMITS as limits } from "./reconstruction-limits";

function fail(code: string): never { throw new Error(code); }
function frameHeader(header: unknown, expectedIndex: number, format: DocumentFormat): Omit<RasterFrame, "pixels"> {
  const record = strictRecord(header, ["index", "width", "height", "channels"], ["pagePoints"]);
  if (!record || !["pdf", "jpeg", "png"].includes(format) || !Number.isSafeInteger(record.width) || !Number.isSafeInteger(record.height) || Number(record.width) < 1 || Number(record.height) < 1 || (record.channels !== 3 && record.channels !== 4) || (format !== "png" && record.channels !== 3)) fail("RASTER_INVALID");
  if (!Number.isSafeInteger(expectedIndex) || expectedIndex < 0 || !Number.isSafeInteger(record.index) || record.index !== expectedIndex || (format !== "pdf" && expectedIndex !== 0)) fail("RASTER_INDEX");
  const width = record.width as number, height = record.height as number, channels = record.channels as 3 | 4;
  if (width > limits.edgePixels || height > limits.edgePixels || width * height > (format === "pdf" ? limits.pdfPagePixels : limits.imagePixels)) fail("RASTER_LIMIT");
  let pagePoints: RasterFrame["pagePoints"];
  if (format === "pdf") {
    const points = strictRecord(record.pagePoints, ["width", "height"]);
    if (!points || typeof points.width !== "number" || typeof points.height !== "number" || !Number.isFinite(points.width) || !Number.isFinite(points.height) || points.width <= 0 || points.height <= 0) fail("RASTER_PAGE_POINTS");
    pagePoints = { width: points.width, height: points.height };
  } else if (Object.hasOwn(record, "pagePoints")) fail("RASTER_PAGE_POINTS");
  return { index: expectedIndex, width, height, channels, ...(pagePoints ? { pagePoints } : {}) };
}
export function decodeRasterFrame(header: unknown, pixels: Uint8Array, expectedIndex: number, format: DocumentFormat): RasterFrame {
  const decoded = frameHeader(header, expectedIndex, format);
  if (!(pixels instanceof Uint8Array) || pixels.byteLength !== decoded.width * decoded.height * decoded.channels) fail("RASTER_BYTES");
  return { ...decoded, pixels };
}

/** Wire: uint32 BE JSON byte length, fatal UTF-8 JSON (<=4096 bytes), exact raw pixels.
 * Each frame header is {version:1,operation:'raster',kind:'frame',frame:{...}}.
 * Final header is {version:1,operation:'raster',kind:'completed',inspection:{...}}.
 * Only one bounded incoming chunk and one frame are retained; emit is awaited.
 * exitCode must reflect process close, not just an earlier 'exit' event.
 */
export async function decodeRasterStream(chunks: AsyncIterable<Uint8Array>, inspection: SourceInspection, emit: (frame: RasterFrame) => Promise<void>, exitCode: number | null | Promise<number | null>): Promise<SourceInspection> {
  const expected = decodeSourceInspection(inspection);
  if (!expected) fail("RASTER_PROTOCOL");
  const iterator = chunks[Symbol.asyncIterator]();
  let pending: Uint8Array = new Uint8Array(0), offset = 0, ended = false;
  const read = async (length: number, allowEnd = false): Promise<Uint8Array | undefined> => {
    // Called only after fixed prefix/header validation; pixel allocation is bounded.
    const bytes = new Uint8Array(length); let used = 0;
    while (used < length) {
      if (offset === pending.length) {
        if (ended) { if (allowEnd && used === 0) return; fail("RASTER_INCOMPLETE"); }
        const next = await iterator.next();
        if (next.done) { ended = true; pending = new Uint8Array(0); offset = 0; continue; }
        if (!(next.value instanceof Uint8Array) || next.value.byteLength > limits.imagePixels * 4 + limits.headerBytes + 4) fail("RASTER_LIMIT");
        pending = next.value; offset = 0; continue;
      }
      const count = Math.min(length - used, pending.length - offset);
      bytes.set(pending.subarray(offset, offset + count), used); offset += count; used += count;
    }
    return bytes;
  };
  let index = 0;
  try {
    while (true) {
      const prefix = await read(4);
      const length = new DataView(prefix!.buffer, prefix!.byteOffset, 4).getUint32(0);
      if (length > limits.headerBytes) fail("RASTER_LIMIT");
      if (length < 1) fail("RASTER_PROTOCOL");
      let header: unknown;
      const bytes = await read(length);
      try { header = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); } catch { fail("RASTER_PROTOCOL"); }
      const frame = strictRecord(header, ["version", "operation", "kind", "frame"]);
      if (frame?.version === 1 && frame.operation === "raster" && frame.kind === "frame") {
        if (index >= expected.pageCount) fail("RASTER_INDEX");
        const decoded = frameHeader(frame.frame, index, expected.format);
        const pixels = (await read(decoded.width * decoded.height * decoded.channels))!;
        await emit(decodeRasterFrame(frame.frame, pixels, index, expected.format)); index++;
        continue;
      }
      const completed = strictRecord(header, ["version", "operation", "kind", "inspection"]);
      const actual = decodeSourceInspection(completed?.inspection);
      if (completed?.version !== 1 || completed.operation !== "raster" || completed.kind !== "completed" || !actual || actual.format !== expected.format || actual.pageCount !== expected.pageCount || index !== expected.pageCount) fail("RASTER_PROTOCOL");
      if (await read(1, true)) fail("RASTER_PROTOCOL");
      if (await exitCode !== 0) fail("RASTER_PROCESS");
      return actual;
    }
  } finally { await iterator.return?.(); }
}
