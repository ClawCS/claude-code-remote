import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { FileCheckError, identifyFile, readSnapshotFile } from "./file-validation";
import { inspectPdfGraph, PDF_LIMITS, PdfPolicyError } from "./pdf-policy";
import { PINNED_QPDF_VERSION } from "./parser-process";
import type { ParserResult, SnapshotFile } from "./types";

// Entrypoint is diagnostic-only until a qualified Linux supervisor is implemented.
async function inspect(file: SnapshotFile, qpdfPath: string): Promise<ParserResult> {
  if (process.env.NODE_ENV !== "test") return { kind: "blocked", reason: "SANDBOX_UNAVAILABLE" };
  const bytes = await readSnapshotFile(file), format = identifyFile(bytes);
  if (!format) throw new FileCheckError("IDENTITY_MISMATCH");
  if (format === "pdf") {
    const command = (args: string[], maxBuffer: number, expected = 0) => {
      const result = spawnSync(qpdfPath, args, { env: { NODE_ENV: "test", TZ: "UTC", LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin" }, cwd: "/", maxBuffer, encoding: "buffer", stdio: ["ignore", "pipe", "pipe"] });
      if (result.error) throw new FileCheckError("code" in result.error && result.error.code === "ENOBUFS" ? "PARSER_LIMIT" : "PARSER_UNAVAILABLE");
      if (result.stderr.length > PDF_LIMITS.diagnostics) throw new FileCheckError("PARSER_LIMIT");
      if (result.status !== expected || result.signal) throw new FileCheckError("INVALID_FILE");
      return result.stdout;
    };
    const version = command(["--version"], PDF_LIMITS.diagnostics).toString("utf8");
    if (!version.startsWith(`qpdf version ${PINNED_QPDF_VERSION}\n`)) throw new FileCheckError("PARSER_UNAVAILABLE");
    const encrypted = spawnSync(qpdfPath, ["--is-encrypted", file.path], { env: { NODE_ENV: "test", TZ: "UTC", LANG: "C", PATH: "/usr/bin:/bin" }, maxBuffer: PDF_LIMITS.diagnostics, encoding: "buffer", stdio: ["ignore", "pipe", "pipe"] });
    if (encrypted.error || encrypted.signal) throw new FileCheckError("PARSER_UNAVAILABLE");
    if (encrypted.status === 0) throw new FileCheckError("ENCRYPTED_PDF");
    if (encrypted.status !== 2) throw new FileCheckError("INVALID_FILE");
    command(["--suppress-recovery", "--check", file.path], PDF_LIMITS.diagnostics);
    const json = command(["--suppress-recovery", "--json=2", "--json-key=qpdf", "--json-stream-data=none", file.path], PDF_LIMITS.jsonBytes);
    const policy = inspectPdfGraph(JSON.parse(json.toString("utf8")));
    let decoded = 0;
    for (const stream of policy.streams) {
      const data = command(["--suppress-recovery", `--show-object=${stream}`, "--filtered-stream-data", "--decode-level=all", file.path], PDF_LIMITS.streamBytes);
      decoded += data.length; if (decoded > PDF_LIMITS.decodedBytes) throw new FileCheckError("PARSER_LIMIT");
    }
  } else {
    sharp.cache(false); sharp.concurrency(1);
    const image = sharp(bytes, { failOn: "warning", limitInputPixels: 25_000_000, limitInputChannels: 4, unlimited: false, sequentialRead: true });
    try {
      const metadata = await image.metadata();
      if (metadata.format !== format) throw new FileCheckError("IDENTITY_MISMATCH");
      if (!metadata.width || !metadata.height || metadata.width * metadata.height > 25_000_000 || (metadata.pages ?? 1) !== 1) throw new FileCheckError("IMAGE_LIMIT");
      await image.stats(); // Evaluates compressed pixels; metadata alone is insufficient.
    } catch (error) {
      if (error instanceof FileCheckError) throw error;
      if (error instanceof Error && /pixel limit/i.test(error.message)) throw new FileCheckError("IMAGE_LIMIT");
      throw new FileCheckError("INVALID_FILE");
    }
  }
  await readSnapshotFile(file);
  return { kind: "parsed", format };
}
async function main(): Promise<void> {
  let result: ParserResult;
  try {
    let request = Buffer.alloc(0);
    for await (const chunk of process.stdin) { if (request.length + chunk.length > 16384) throw new FileCheckError("PARSER_LIMIT"); request = Buffer.concat([request, chunk]); }
    const input = JSON.parse(request.toString("utf8")); result = await inspect(input.file, input.qpdfPath);
  }
  catch (error) { result = { kind: "blocked", reason: error instanceof FileCheckError || error instanceof PdfPolicyError ? error.reason : "INVALID_FILE" }; }
  process.stdout.write(JSON.stringify(result));
}
void main();
