import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { extname, isAbsolute, resolve } from "node:path";
import { readBoundedFile } from "./crypto";
import { VALIDATION_FAILURES, type ParserPort, type ParserResult, type SnapshotFile, type ValidatedFile, type ValidationFailure } from "./types";
import { decodeSourceInspectorResult, type SourceInspection, type SourceInspectorPort } from "./reconstruction-types";

export async function inspectReconstructionSource(file: SnapshotFile, inspector: SourceInspectorPort, signal: AbortSignal): Promise<SourceInspection> {
  try {
    if (signal.aborted) throw new FileCheckError("PARSER_TIMEOUT");
    const assurance = inspector?.assurance;
    if ((assurance !== "local-test" && assurance !== "linux-sandbox") || (assurance === "local-test" && process.env.NODE_ENV !== "test")) throw new FileCheckError("SANDBOX_UNAVAILABLE");
    const format = identifyFile(await readSnapshotFile(file));
    if (!format || !sourceIdentityMatches(file, format)) throw new FileCheckError("IDENTITY_MISMATCH");
    const result = decodeSourceInspectorResult(await inspector.inspect(file, signal));
    if (signal.aborted) throw new FileCheckError("PARSER_TIMEOUT");
    await readSnapshotFile(file);
    if (!result) throw new FileCheckError("INVALID_FILE");
    if (result.kind === "blocked") throw new FileCheckError(result.reason);
    if (result.inspection.format !== format) throw new FileCheckError("IDENTITY_MISMATCH");
    // Source eligibility is NOT output validation or permission to dispatch originals.
    return result.inspection;
  } catch (error) { throw error instanceof FileCheckError ? error : new FileCheckError("INVALID_FILE"); }
}
function sourceIdentityMatches(file: SnapshotFile, format: "pdf" | "jpeg" | "png"): boolean {
  const suffixes = { pdf: [".pdf"], jpeg: [".jpg", ".jpeg"], png: [".png"] };
  const media = { pdf: "application/pdf", jpeg: "image/jpeg", png: "image/png" };
  return suffixes[format].includes(extname(file.name).toLowerCase()) && file.mediaType === media[format];
}

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export class FileCheckError extends Error { constructor(readonly reason: ValidationFailure) { super(reason); } }
export async function readSnapshotFile(file: SnapshotFile): Promise<Buffer> {
  if (!Number.isSafeInteger(file.bytes) || file.bytes < 1 || file.bytes > MAX_FILE_BYTES) throw new FileCheckError("FILE_LIMIT");
  if (!isAbsolute(file.path) || resolve(file.path) !== file.path) throw new FileCheckError("INVALID_FILE");
  const fd = await open(file.path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await fd.stat();
    if (!stat.isFile() || stat.nlink !== 1 || stat.size !== file.bytes) throw new FileCheckError("DIGEST_MISMATCH");
    const bytes = await readBoundedFile(fd, MAX_FILE_BYTES);
    if (bytes.length !== file.bytes || createHash("sha256").update(bytes).digest("hex") !== file.digest) throw new FileCheckError("DIGEST_MISMATCH");
    return bytes;
  } finally { await fd.close(); }
}
export function identifyFile(bytes: Buffer): "pdf" | "jpeg" | "png" | undefined {
  if (bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) return "pdf";
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
}
export function decodeParserResult(value: unknown): ParserResult | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return;
  const keys = Reflect.ownKeys(value), properties = Object.getOwnPropertyDescriptors(value);
  if (keys.length !== 2 || keys.some(key => typeof key !== "string" || !("value" in properties[key]))) return;
  const kind: unknown = properties.kind?.value;
  if (kind === "parsed" && keys.includes("format")) {
    const format: unknown = properties.format.value;
    if (format === "pdf" || format === "jpeg" || format === "png") return { kind, format };
  }
  if (kind === "blocked" && keys.includes("reason")) {
    const reason: unknown = properties.reason.value;
    if (typeof reason === "string" && VALIDATION_FAILURES.includes(reason as ValidationFailure)) return { kind, reason: reason as ValidationFailure };
  }
}
export function createFileValidator(parser: ParserPort) {
  return async (file: SnapshotFile): Promise<ValidatedFile> => {
    try {
      const assurance = parser?.assurance;
      if (assurance !== "local-test" && assurance !== "linux-sandbox") return { kind: "blocked", reason: "SANDBOX_UNAVAILABLE" };
      if (assurance === "local-test" && process.env.NODE_ENV !== "test") return { kind: "blocked", reason: "SANDBOX_UNAVAILABLE" };
      const bytes = await readSnapshotFile(file), format = identifyFile(bytes);
      if (!format || !sourceIdentityMatches(file, format)) return { kind: "blocked", reason: "IDENTITY_MISMATCH" };
      const result = decodeParserResult(await parser.parse(file));
      await readSnapshotFile(file);
      if (!result) return { kind: "blocked", reason: "INVALID_FILE" };
      if (result.kind === "blocked") return result;
      if (result.format !== format) return { kind: "blocked", reason: "IDENTITY_MISMATCH" };
      // Temporary F2 activation barrier: OS isolation cannot resolve QPDF/viewer
      // disagreement on discarded malformed definitions. Controller ruling pending.
      if (format === "pdf" && assurance === "linux-sandbox") return { kind: "blocked", reason: "PDF_AMBIGUITY_UNRESOLVED" };
      return assurance === "local-test" ? { kind: "diagnostic", file, format, productionReady: false } : { kind: "valid", file, format };
    } catch (error) { return { kind: "blocked", reason: error instanceof FileCheckError ? error.reason : "INVALID_FILE" }; }
  };
}
export const validateFile = createFileValidator({ assurance: "unavailable", async parse() { return { kind: "blocked", reason: "SANDBOX_UNAVAILABLE" }; } });
