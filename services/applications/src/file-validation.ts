import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { extname, isAbsolute, resolve } from "node:path";
import { readBoundedFile } from "./crypto";
import type { ParserPort, SnapshotFile, ValidatedFile, ValidationFailure } from "./types";

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
export function createFileValidator(parser: ParserPort) {
  return async (file: SnapshotFile): Promise<ValidatedFile> => {
    if (parser.assurance === "unavailable") return { kind: "blocked", reason: "SANDBOX_UNAVAILABLE" };
    if (parser.assurance === "local-test" && process.env.NODE_ENV !== "test") return { kind: "blocked", reason: "SANDBOX_UNAVAILABLE" };
    try {
      const bytes = await readSnapshotFile(file), format = identifyFile(bytes);
      const suffixes = { pdf: [".pdf"], jpeg: [".jpg", ".jpeg"], png: [".png"] };
      const media = { pdf: "application/pdf", jpeg: "image/jpeg", png: "image/png" };
      if (!format || !suffixes[format].includes(extname(file.name).toLowerCase()) || file.mediaType !== media[format]) return { kind: "blocked", reason: "IDENTITY_MISMATCH" };
      const result = await parser.parse(file);
      await readSnapshotFile(file);
      if (result.kind === "blocked") return result;
      if (result.format !== format) return { kind: "blocked", reason: "IDENTITY_MISMATCH" };
      return parser.assurance === "local-test" ? { kind: "diagnostic", file, format, productionReady: false } : { kind: "valid", file, format };
    } catch (error) { return { kind: "blocked", reason: error instanceof FileCheckError ? error.reason : "INVALID_FILE" }; }
  };
}
export const validateFile = createFileValidator({ assurance: "unavailable", async parse() { return { kind: "blocked", reason: "SANDBOX_UNAVAILABLE" }; } });
