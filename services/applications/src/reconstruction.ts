import { createHash } from "node:crypto";
import { lstat, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { digest, VALIDATION_FAILURES, type ApplicationId, type Digest, type ProcessingSnapshot, type ScannerPort, type SnapshotFile } from "./types";
import { inspectReconstructionSource, MAX_FILE_BYTES, readSnapshotFile } from "./file-validation";
import { decodeSourceInspection, type RasterPort, type SourceInspectorPort, type SourceInspection } from "./reconstruction-types";
import { decodeRasterFrame } from "./raster-protocol";
import { RECONSTRUCTION_LIMITS as limits } from "./reconstruction-limits";
import { scanFiles } from "./scanner";
import { encodeRaster } from "./image-encoder";
import { createPdfReconstruction } from "./pdf-reconstruction";
import type { GeneratedOutputExpectation, GeneratedOutputPort } from "./generated-output-policy";

const reconstructed: unique symbol = Symbol("verified reconstructed application bundle");
export interface ReconstructedFile extends SnapshotFile { sourceIndex: number; sourceDigest: Digest; pageCount?: number }
export interface ReconstructedBundle { readonly [reconstructed]: true; version: 1; id: ApplicationId; input: ProcessingSnapshot["input"]; requestDigest: Digest; policyId: "tj-reconstruction-1"; files: readonly ReconstructedFile[] }
export interface ReconstructionScopePort { withScope<T>(id: ApplicationId, action: (directory: string) => Promise<T>): Promise<T> }
export interface ReconstructionDependencies { inspector: SourceInspectorPort; raster: RasterPort; scanner: ScannerPort; scope: ReconstructionScopePort; output: GeneratedOutputPort; monotonicNow: () => number }
export const reconstructionReadiness = Object.freeze({ productionReady: false, reason: "LINUX_RECONSTRUCTION_UNQUALIFIED" });
let busy = false;
const failureCodes = new Set<string>([...VALIDATION_FAILURES,"NOT_READY","BUSY","TIMEOUT","STALE_SIGNATURES","INCOMPLETE_SCAN","INFECTED","SCANNER_ERROR","OUTPUT_INVALID","OUTPUT_UNAVAILABLE","OUTPUT_LIMIT","OUTPUT_IDENTITY","UNSAFE_SCOPE","RECONSTRUCTION_TIMEOUT","RASTER_INDEX","RASTER_INVALID","RASTER_BYTES","RASTER_LIMIT","RASTER_PAGE_POINTS","RASTER_INCOMPLETE","RASTER_PROTOCOL","RASTER_PROCESS","RASTER_TIMEOUT","RASTER_SOURCE"]);
export async function withReconstructedDocuments<T>(snapshot: ProcessingSnapshot, deps: ReconstructionDependencies, action: (bundle: ReconstructedBundle) => Promise<T>): Promise<T> {
  if (busy) throw new Error("BUSY");
  if (deps.scanner?.assurance !== "qualified-local-engine" || !["linux-sandbox", "local-test"].includes(deps.inspector?.assurance) || (deps.inspector.assurance === "local-test" && process.env.NODE_ENV !== "test") || !deps.raster?.render || !deps.output?.verify || !deps.scope?.withScope) throw new Error("NOT_READY");
  if (snapshot.files.length > 5 || snapshot.files.reduce((sum, f) => sum + f.bytes, 0) > 10 * 1024 * 1024) throw new Error("FILE_LIMIT");
  busy = true;
  let handedOff = false;
  try {
    const originalScan = await scanFiles(snapshot.files, deps.scanner);
    if (originalScan.kind !== "clean") throw new Error(originalScan.reason);
    if (originalScan.scannedDigests.length !== snapshot.files.length || originalScan.scannedDigests.some((hash, i) => hash !== snapshot.files[i].digest)) throw new Error("DIGEST_MISMATCH");
    const start = deps.monotonicNow(); if (!Number.isFinite(start)) throw new Error("RECONSTRUCTION_TIMEOUT");
    const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), 90_000);
    const check = () => { const now = deps.monotonicNow(); if (abort.signal.aborted || !Number.isFinite(now) || now < start || now - start >= 90_000) { abort.abort(); throw new Error("RECONSTRUCTION_TIMEOUT"); } };
    const step = async <R>(operation: () => Promise<R>): Promise<R> => {
      check(); const childTimer = setTimeout(() => abort.abort(), 30_000);
      try { const result = await operation(); check(); return result; }
      catch (error) { check(); throw error; } finally { clearTimeout(childTimer); }
    };
    try {
      const inspections: SourceInspection[] = []; let totalPages = 0;
      for (const file of snapshot.files) {
        const inspection = await step(() => inspectReconstructionSource(file, deps.inspector, abort.signal)); inspections.push(inspection);
        if (inspection.format === "pdf" && (totalPages += inspection.pageCount) > limits.applicationPdfPages) throw new Error("PAGE_LIMIT");
      }
      return await deps.scope.withScope(snapshot.id, async directory => {
        if (!isAbsolute(directory) || resolve(directory) !== directory) throw new Error("UNSAFE_SCOPE");
        const info = await lstat(directory); check(); if (!info.isDirectory() || info.isSymbolicLink() || (info.mode & 0o777) !== 0o700 || info.uid !== process.getuid?.()) throw new Error("UNSAFE_SCOPE");
        const files: ReconstructedFile[] = []; let totalBytes = 0;
        for (let sourceIndex = 0; sourceIndex < snapshot.files.length; sourceIndex++) {
          const source = snapshot.files[sourceIndex], inspection = inspections[sourceIndex];
          const expected: GeneratedOutputExpectation = { format: inspection.format, pages: [] }, pages: GeneratedOutputExpectation["pages"][number][] = [];
          const pdf = inspection.format === "pdf" ? createPdfReconstruction() : undefined; let encoded: Uint8Array | undefined, index = 0;
          const completion = await step(() => deps.raster.render(source, async raw => {
            check(); if (index >= inspection.pageCount) throw new Error("RASTER_INDEX");
            const frame = decodeRasterFrame({ index: raw.index, width: raw.width, height: raw.height, channels: raw.channels, ...(raw.pagePoints ? { pagePoints: raw.pagePoints } : {}) }, raw.pixels, index, inspection.format);
            pages.push({ width: frame.width, height: frame.height, channels: frame.channels, ...(frame.pagePoints ? { pagePoints: { ...frame.pagePoints } } : {}) });
            if (pdf) await pdf.append(frame); else encoded = await encodeRaster(frame, inspection.format as "jpeg" | "png");
            check(); index++;
          }, abort.signal));
          const actual = decodeSourceInspection(completion);
          if (!actual || actual.format !== inspection.format || actual.pageCount !== inspection.pageCount || index !== inspection.pageCount) throw new Error("RASTER_INCOMPLETE");
          await step(() => readSnapshotFile(source));
          if (pdf) encoded = await step(() => pdf.finish());
          if (!encoded || !encoded.length || encoded.length > MAX_FILE_BYTES || (totalBytes += encoded.length) > 10 * 1024 * 1024) throw new Error("OUTPUT_LIMIT");
          const extension = inspection.format === "jpeg" ? "jpg" : inspection.format, name = `document-${sourceIndex + 1}.${extension}`;
          const file: ReconstructedFile = { sourceIndex, sourceDigest: source.digest, name, path: join(directory, name), mediaType: source.mediaType, bytes: encoded.length, digest: digest(createHash("sha256").update(encoded).digest("hex")), ...(pdf ? { pageCount: inspection.pageCount } : {}) };
          // R31: deterministic canonical PNG encoding may legitimately match the
          // source digest. Identity is the new exclusively-created scoped file.
          if (file.path === source.path) throw new Error("OUTPUT_IDENTITY");
          await step(() => writeFile(file.path, encoded!, { flag: "wx", mode: 0o600 })); encoded = undefined;
          expected.pages = pages;
          await step(() => deps.output.verify(file, expected, abort.signal)); await step(() => readSnapshotFile(file)); files.push(Object.freeze(file));
        }
        check(); clearTimeout(timer);
        const outputScan = await scanFiles(files, deps.scanner);
        if (outputScan.kind !== "clean") throw new Error(outputScan.reason);
        if (outputScan.scannedDigests.length !== files.length || outputScan.scannedDigests.some((hash, i) => hash !== files[i].digest)) throw new Error("DIGEST_MISMATCH");
        // Brand only after whole-set validation/scan. It is not serialized or restorable from JSON.
        const bundle = { version: 1 as const, id: snapshot.id, input: snapshot.input, requestDigest: snapshot.digest, policyId: "tj-reconstruction-1" as const, files: Object.freeze(files) };
        Object.defineProperty(bundle, reconstructed, { value: true, enumerable: false });
        handedOff = true; return action(Object.freeze(bundle) as ReconstructedBundle);
      });
    } finally { clearTimeout(timer); }
  } catch (error) {
    // The caller owns callback failures (e.g. delivery state); reconstruction
    // diagnostics never leave this boundary as source-controlled free text.
    if (handedOff) throw error;
    throw new Error(error instanceof Error && failureCodes.has(error.message) ? error.message : "RECONSTRUCTION_FAILED");
  } finally { busy = false; }
}
