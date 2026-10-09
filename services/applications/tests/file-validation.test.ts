import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { deflateSync } from "node:zlib";
import { createLocalDiagnosticParser } from "../src/parser-process";
import { createFileValidator, validateFile } from "../src/file-validation";
import { fixture, staticPdf, pdf, streamObject, incrementalPdf, duplicateDefinitionPdf } from "./fixtures/synthetic";

let root: string;
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), "application-validation-")); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });
describe("snapshot identity", () => {
  const local = createFileValidator({ assurance: "local-test", async parse() { return { kind: "parsed", format: "pdf" }; } });
  it("does not turn a local parser result into production validation", async () => {
    const file = await fixture(root, staticPdf());
    expect(await local(file)).toEqual({ kind: "diagnostic", file, format: "pdf", productionReady: false });
    expect(await validateFile(file)).toEqual({ kind: "blocked", reason: "SANDBOX_UNAVAILABLE" });
  });
  it.each([["cv.jpg", "application/pdf"], ["cv.pdf", "image/jpeg"], ["cv.html", "text/html"]])("rejects forged metadata %s %s", async (name, mediaType) => {
    expect(await local(await fixture(root, staticPdf(), name, mediaType))).toEqual({ kind: "blocked", reason: "IDENTITY_MISMATCH" });
  });
  it.each(["<svg/>", "<html/>", "PK\u0003\u0004office", "GIF89a"]) ("rejects non-allowed byte identity %s", async content => {
    expect(await local(await fixture(root, Buffer.from(content)))).toEqual({ kind: "blocked", reason: "IDENTITY_MISMATCH" });
  });
  it("binds both pre-validation and post-validation bytes to the snapshot digest", async () => {
    const file = await fixture(root, staticPdf());
    await writeFile(file.path, staticPdf("/ViewerPreferences << >>"));
    expect(await local(file)).toEqual({ kind: "blocked", reason: "DIGEST_MISMATCH" });
    const again = await fixture(root, staticPdf());
    const mutate = createFileValidator({ assurance: "local-test", async parse() { await writeFile(again.path, "changed"); return { kind: "parsed", format: "pdf" }; } });
    expect(await mutate(again)).toEqual({ kind: "blocked", reason: "DIGEST_MISMATCH" });
  });
});
describe("real pinned QPDF and Sharp, local diagnostic only", () => {
  const validate = createFileValidator(createLocalDiagnosticParser("/opt/homebrew/opt/qpdf/bin/qpdf"));
  it("accepts a static original PDF without changing its bytes", async () => { const file = await fixture(root, staticPdf()); expect(await validate(file)).toEqual({ kind: "diagnostic", file, format: "pdf", productionReady: false }); });
  it.each(["jpeg", "png"] as const)("fully decodes a synthetic %s", async format => {
    const bytes = await sharp({ create: { width: 2, height: 3, channels: 3, background: "white" } }).toFormat(format).toBuffer();
    const file = await fixture(root, bytes, `cv.${format}`, `image/${format}`);
    expect(await validate(file)).toEqual({ kind: "diagnostic", file, format, productionReady: false });
  });
  it.each(["/OpenAction << /S /JavaScript /JS (app.alert) >>", "/AA << >>", "/AcroForm << /XFA [] >>"])("blocks active PDF %s", async extra => { expect(await validate(await fixture(root, staticPdf(extra)))).toEqual({ kind: "blocked", reason: "ACTIVE_PDF" }); });
  it("finds unreferenced and escaped active dictionaries", async () => { expect(await validate(await fixture(root, staticPdf("", ["<< /J#61vaScript true >>"])))).toEqual({ kind: "blocked", reason: "ACTIVE_PDF" }); });
  it("rejects corrupt PDFs and truncated raster data", async () => {
    expect((await validate(await fixture(root, Buffer.from("%PDF-1.7\ninvalid")))).kind).toBe("blocked");
    const bytes = await sharp({ create: { width: 30, height: 30, channels: 3, background: "red" } }).jpeg().toBuffer();
    expect((await validate(await fixture(root, bytes.subarray(0, bytes.length - 15), "bad.jpg", "image/jpeg"))).kind).toBe("blocked");
  });
  it("rejects 51 pages and images above 25 million pixels", async () => {
    const objects = ["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${Array.from({ length: 51 }, (_, i) => `${i + 3} 0 R`).join(" ")}] /Count 51 >>`, ...Array.from({ length: 51 }, () => "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 10 10] /Resources << >> >>")];
    expect(await validate(await fixture(root, pdf(objects)))).toEqual({ kind: "blocked", reason: "PAGE_LIMIT" });
    const bytes = await sharp({ create: { width: 5001, height: 5000, channels: 3, background: "white" } }).png().toBuffer();
    expect(await validate(await fixture(root, bytes, "large.png", "image/png"))).toEqual({ kind: "blocked", reason: "IMAGE_LIMIT" });
  });
  it("rejects an empty-user-password encrypted PDF", async () => {
    const original = await fixture(root, staticPdf(), "original.pdf"), path = join(root, "encrypted.pdf");
    execFileSync("/opt/homebrew/opt/qpdf/bin/qpdf", [original.path, "--encrypt", "", "synthetic-owner", "256", "--", path], { stdio: "ignore" });
    const bytes = await import("node:fs/promises").then(fs => fs.readFile(path));
    expect(await validate(await fixture(root, bytes))).toEqual({ kind: "blocked", reason: "ENCRYPTED_PDF" });
  });
  it("supports modern xref/object streams using the original selected view", async () => {
    const source = await fixture(root, staticPdf(), "source.pdf"), path = join(root, "modern.pdf");
    execFileSync("/opt/homebrew/opt/qpdf/bin/qpdf", ["--object-streams=generate", source.path, path], { stdio: "ignore" });
    const bytes = await import("node:fs/promises").then(fs => fs.readFile(path));
    expect((await validate(await fixture(root, bytes))).kind).toBe("diagnostic");
  });
  it.each([false, true])("accepts valid incremental history (historical active=%s) under R16", async historicalActive => {
    expect((await validate(await fixture(root, incrementalPdf(historicalActive)))).kind).toBe("diagnostic");
  });
  it.each([false, true])("LIMITATION: QPDF discards duplicate raw definition (duplicate xref=%s)", async duplicateXref => {
    expect((await validate(await fixture(root, duplicateDefinitionPdf(duplicateXref)))).kind).toBe("diagnostic");
  });
  it("rejects warning-producing duplicate dictionary keys even when dangerous value was overwritten", async () => {
    const file = await fixture(root, staticPdf("/OpenAction << /S /JavaScript /JS (old) >> /OpenAction null"));
    expect(await validate(file)).toEqual({ kind: "blocked", reason: "INVALID_FILE" });
  });
  it.each(["plain", "FlateDecode", "ASCIIHexDecode", "ASCII85Decode", "RunLengthDecode", "LZWDecode", "DCTDecode"])("decodes selected unreferenced %s stream through QPDF", async filter => {
    let bytes = Buffer.from("q\nQ\n");
    if (filter === "FlateDecode") bytes = deflateSync(bytes);
    if (filter === "ASCIIHexDecode") bytes = Buffer.from("710a510a>");
    if (filter === "ASCII85Decode") { const number = 0x710a510a; let rest = number, text = ""; for (let i = 0; i < 5; i++) { text = String.fromCharCode(rest % 85 + 33) + text; rest = Math.floor(rest / 85); } bytes = Buffer.from(text + "~>"); }
    if (filter === "RunLengthDecode") bytes = Buffer.from([3, 113, 10, 81, 10, 128]);
    if (filter === "LZWDecode") { const bits = [256, 113, 10, 81, 10, 257].map(code => code.toString(2).padStart(9, "0")).join("").padEnd(56, "0"); bytes = Buffer.from(Array.from({ length: 7 }, (_, i) => parseInt(bits.slice(i * 8, i * 8 + 8), 2))); }
    if (filter === "DCTDecode") bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).jpeg().toBuffer();
    const file = await fixture(root, staticPdf("", [streamObject(bytes, filter === "plain" ? "" : `/Filter /${filter}`)]));
    expect((await validate(file)).kind).toBe("diagnostic");
  });
  it("fails closed for unsupported filters and malformed stream lengths", async () => {
    expect(await validate(await fixture(root, staticPdf("", [streamObject(Buffer.from("data"), "/Filter /JBIG2Decode")])))).toEqual({ kind: "blocked", reason: "UNSUPPORTED_PDF" });
    expect((await validate(await fixture(root, staticPdf("", ["<< /Length 1 >>\nstream\nlonger\nendstream"])))).kind).toBe("blocked");
  });
  it("rejects decoded expansion beyond the selected-stream output budget", async () => {
    const packed = deflateSync(Buffer.alloc(64 * 1024 * 1024 + 1, 32));
    expect(await validate(await fixture(root, staticPdf("", [streamObject(packed, "/Filter /FlateDecode")])))).toEqual({ kind: "blocked", reason: "PARSER_LIMIT" });
  });
});
