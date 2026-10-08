import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { afterEach, expect, test } from "vitest";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
async function fixture(width = 1600, height = 2400) {
  const root = mkdtempSync(join(tmpdir(), "jammers-google-assets-")); roots.push(root);
  mkdirSync(join(root, "scripts"));
  symlinkSync(resolve("node_modules"), join(root, "node_modules"));
  const script = resolve("scripts/build-google-market-assets.mjs");
  copyFileSync(script, join(root, "scripts/build-google-market-assets.mjs"));
  const sourceDir = join(root, "assets/source/google-market-photos");
  const outputDir = join(root, "public/images/editorial/google");
  mkdirSync(sourceDir, { recursive: true }); mkdirSync(outputDir, { recursive: true });
  const bytes = await sharp({ create: { width, height, channels: 3, background: "#a82921" } }).jpeg().toBuffer();
  const derivative = await sharp(bytes).rotate().resize({ width: 1000, height: 1200, fit: "inside", withoutEnlargement: true }).toColourspace("srgb").webp({ quality: 82, effort: 6 }).toBuffer();
  const size = await sharp(derivative).metadata();
  const entry = { id: "display", source: "display.jpg", sourceHash: hash(bytes), sourceDimensions: { width, height }, crop: { left: 0, top: 0, width, height }, provenance: "operator-approved-google-owner", rubric: "Marktleben", output: { name: "display.webp", maxBytes: 150000, sha256: hash(derivative), dimensions: { width: size.width, height: size.height } } };
  const manifest = { schemaVersion: 1, reviewedAt: "2026-10-08", releaseBasis: "user-approved-google-owner-2026-10-08", entries: [entry] };
  const save = () => writeFileSync(join(sourceDir, "manifest.json"), JSON.stringify(manifest));
  writeFileSync(join(sourceDir, entry.source), bytes); writeFileSync(join(outputDir, entry.output.name), derivative); save();
  const run = (...args: string[]) => spawnSync(process.execPath, [join(root, "scripts/build-google-market-assets.mjs"), ...args], { encoding: "utf8" });
  return { sourceDir, outputDir, entry, manifest, save, run, derivative };
}

test("checks a full portrait derivative with bounded natural dimensions without rewriting it", async () => {
  const f = await fixture(); const result = f.run("--check");
  expect(result.status, result.stderr).toBe(0);
  expect(f.entry.output.dimensions).toEqual({ width: 800, height: 1200 });
  expect(readFileSync(join(f.outputDir, "display.webp"))).toEqual(f.derivative);
});
test("builds the full image without upscaling a small source", async () => {
  const f = await fixture(320, 200); rmSync(join(f.outputDir, "display.webp"));
  const result = f.run(); expect(result.status, result.stderr).toBe(0);
  const size = await sharp(readFileSync(join(f.outputDir, "display.webp"))).metadata();
  expect([size.width, size.height]).toEqual([320, 200]);
  expect(size.exif).toBeUndefined(); expect(size.icc).toBeUndefined();
});
test("accepts a reviewed larger photo budget up to 350000 bytes", async () => {
  const f = await fixture(); f.entry.output.maxBytes = 350000; f.save();
  const result = f.run("--check"); expect(result.status, result.stderr).toBe(0);
});
test("rejects a photo budget above 350000 bytes", async () => {
  const f = await fixture(); f.entry.output.maxBytes = 350001; f.save();
  const result = f.run("--check"); expect(result.status).toBe(1);
  expect(result.stderr).toContain("invalid output hash or budget");
});
test.each(["source-hash", "output-hash", "crop", "dimensions", "provenance", "private-identity", "duplicate", "budget"])("rejects %s contract drift", async kind => {
  const f = await fixture();
  if (kind === "source-hash") f.entry.sourceHash = "0".repeat(64);
  if (kind === "output-hash") f.entry.output.sha256 = "0".repeat(64);
  if (kind === "crop") f.entry.crop.width -= 1;
  if (kind === "dimensions") f.entry.output.dimensions.width = 999;
  if (kind === "provenance") f.entry.provenance = "operator-approved-canva";
  if (kind === "private-identity") Object.assign(f.entry, { sourceUrl: "https://private.example/photo" });
  if (kind === "duplicate") f.manifest.entries.push(f.entry);
  if (kind === "budget") f.entry.output.maxBytes = 1;
  f.save(); const result = f.run("--check"); expect(result.status).toBe(1);
  expect(result.stderr).toContain("Google market assets:");
  expect(readFileSync(join(f.outputDir, "display.webp"))).toEqual(f.derivative);
});
test("check rejects missing or extra public files without regenerating", async () => {
  const f = await fixture(); writeFileSync(join(f.outputDir, "extra.webp"), f.derivative);
  expect(f.run("--check").status).toBe(1);
  rmSync(join(f.outputDir, "extra.webp")); rmSync(join(f.outputDir, "display.webp"));
  expect(f.run("--check").status).toBe(1);
  expect(() => readFileSync(join(f.outputDir, "display.webp"))).toThrow();
});
test("rejects metadata-bearing JPEG sources even when their hash is approved", async () => {
  const f = await fixture(320, 200);
  const bytes = await sharp(readFileSync(join(f.sourceDir, "display.jpg"))).withMetadata().jpeg().toBuffer();
  writeFileSync(join(f.sourceDir, "display.jpg"), bytes); f.entry.sourceHash = hash(bytes); f.save();
  const result = f.run("--check"); expect(result.status).toBe(1);
  expect(result.stderr).toContain("sanitized metadata mismatch");
});
test("rejects a source symlink outside its sanitized directory", async () => {
  const f = await fixture(320, 200); const outside = join(f.outputDir, "outside.jpg");
  copyFileSync(join(f.sourceDir, "display.jpg"), outside); rmSync(join(f.sourceDir, "display.jpg"));
  symlinkSync(outside, join(f.sourceDir, "display.jpg"));
  const result = f.run("--check"); expect(result.status).toBe(1);
  expect(result.stderr).toContain("source escapes directory");
});
