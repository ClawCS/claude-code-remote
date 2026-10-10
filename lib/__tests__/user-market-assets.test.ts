import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { afterEach, expect, test } from "vitest";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
async function fixture(kind = "photo", width = 1800, height = 2400) {
  const script = resolve("scripts/build-user-market-assets.mjs");
  expect(existsSync(script), "approved desktop image pipeline exists").toBe(true);
  const root = mkdtempSync(join(tmpdir(), "jammers-user-assets-")); roots.push(root);
  mkdirSync(join(root, "scripts")); symlinkSync(resolve("node_modules"), join(root, "node_modules"));
  copyFileSync(script, join(root, "scripts/build-user-market-assets.mjs"));
  const sourceDir = join(root, "assets/source/user-market-photos"), outputDir = join(root, "public/images/editorial/user");
  mkdirSync(sourceDir, { recursive: true }); mkdirSync(outputDir, { recursive: true });
  const bytes = await sharp({ create: { width, height, channels: 3, background: "#a82921" } }).jpeg().toBuffer();
  const derivative = await sharp(bytes).resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true }).toColourspace("srgb").webp({ quality: kind === "poster" ? 90 : 82, effort: 6 }).toBuffer();
  const size = await sharp(derivative).metadata();
  const entry = { id: "display", source: "display.jpg", sourceHash: hash(bytes), sourceDimensions: { width, height }, crop: { left: 0, top: 0, width, height }, provenance: "operator-approved-desktop", kind, processing: "technical-only", rubric: "Marktleben", output: { name: "display.webp", maxBytes: kind === "poster" ? 500000 : 350000, sha256: hash(derivative), dimensions: { width: size.width!, height: size.height! } } };
  const manifest = { schemaVersion: 1, reviewedAt: "2026-10-10", releaseBasis: "user-approved-desktop-2026-10-10", entries: [entry] };
  const save = () => writeFileSync(join(sourceDir, "manifest.json"), JSON.stringify(manifest));
  writeFileSync(join(sourceDir, entry.source), bytes); writeFileSync(join(outputDir, entry.output.name), derivative); save();
  const run = (...args: string[]) => spawnSync(process.execPath, [join(root, "scripts/build-user-market-assets.mjs"), ...args], { encoding: "utf8" });
  return { sourceDir, outputDir, entry, manifest, save, run, derivative };
}
test.each(["photo", "poster"])("checks complete %s without writing and preserves its aspect ratio", async kind => {
  const f = await fixture(kind); const before = statSync(join(f.outputDir, "display.webp")).mtimeMs;
  const r = f.run("--check"); expect(r.status, r.stderr).toBe(0);
  const size = await sharp(readFileSync(join(f.outputDir, "display.webp"))).metadata();
  expect([size.width, size.height]).toEqual([1200, 1600]);
  expect(statSync(join(f.outputDir, "display.webp")).mtimeMs).toBe(before);
});
test("builds without enlarging a small source or preserving private metadata", async () => {
  const f = await fixture("photo", 320, 200); rmSync(join(f.outputDir, "display.webp"));
  const r = f.run(); expect(r.status, r.stderr).toBe(0);
  const meta = await sharp(readFileSync(join(f.outputDir, "display.webp"))).metadata();
  expect([meta.width, meta.height]).toEqual([320, 200]);
  expect(meta.exif ?? meta.xmp ?? meta.icc ?? meta.iptc).toBeUndefined();
});
test.each(["source-hash", "output-hash", "crop", "dimensions", "provenance", "private-field", "duplicate", "budget", "kind", "photo-ai"])("blocks %s drift without publishing", async kind => {
  const f = await fixture("photo", 320, 200);
  if (kind === "source-hash") f.entry.sourceHash = "0".repeat(64);
  if (kind === "output-hash") f.entry.output.sha256 = "0".repeat(64);
  if (kind === "crop") f.entry.crop.width--;
  if (kind === "dimensions") f.entry.output.dimensions.width++;
  if (kind === "provenance") f.entry.provenance = "canva";
  if (kind === "private-field") Object.assign(f.entry, { originalPath: "/private/source" });
  if (kind === "duplicate") f.manifest.entries.push(f.entry);
  if (kind === "budget") f.entry.output.maxBytes = 350001;
  if (kind === "kind") f.entry.kind = "unknown";
  if (kind === "photo-ai") f.entry.processing = "ai-email-edit";
  f.save(); const r = f.run("--check"); expect(r.status).toBe(1); expect(r.stderr).toContain("User market assets:");
  expect(readFileSync(join(f.outputDir, "display.webp"))).toEqual(f.derivative);
});
test.each(["extra", "missing", "source-symlink", "output-symlink", "metadata"])("rejects %s without rebuilding in check mode", async kind => {
  const f = await fixture("photo", 320, 200);
  if (kind === "extra") writeFileSync(join(f.outputDir, "extra.webp"), f.derivative);
  if (kind === "missing") rmSync(join(f.outputDir, "display.webp"));
  if (kind === "source-symlink") { const outside = join(f.outputDir, "outside.jpg"); copyFileSync(join(f.sourceDir, "display.jpg"), outside); rmSync(join(f.sourceDir, "display.jpg")); symlinkSync(outside, join(f.sourceDir, "display.jpg")); }
  if (kind === "output-symlink") { const outside = join(f.sourceDir, "outside.webp"); copyFileSync(join(f.outputDir, "display.webp"), outside); rmSync(join(f.outputDir, "display.webp")); symlinkSync(outside, join(f.outputDir, "display.webp")); }
  if (kind === "metadata") { const bytes = await sharp(readFileSync(join(f.sourceDir, "display.jpg"))).withMetadata().jpeg().toBuffer(); writeFileSync(join(f.sourceDir, "display.jpg"), bytes); f.entry.sourceHash = hash(bytes); f.save(); }
  const r = f.run("--check"); expect(r.status).toBe(1);
  if (kind === "missing") expect(existsSync(join(f.outputDir, "display.webp"))).toBe(false);
});
test("ships only the 17 selected motifs with exactly three marked AI email edits", () => {
  const manifestPath = "assets/source/user-market-photos/manifest.json";
  expect(existsSync(manifestPath)).toBe(true);
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  expect(m.entries).toHaveLength(17);
  expect(m.entries.filter((e: {processing: string}) => e.processing === "ai-email-edit").map((e: {id: string}) => e.id).sort()).toEqual(["jobs-ausbildung", "jobs-teilzeit", "jobs-vollzeit"]);
  const names = m.entries.map((e: {output: {name: string}}) => e.output.name).sort();
  expect(readdirSync("public/images/editorial/user").sort()).toEqual(names);
  expect(names).not.toContain("tcg-regal.webp");
  const r = spawnSync(process.execPath, ["scripts/build-user-market-assets.mjs", "--check"], {encoding: "utf8"});
  expect(r.status, r.stderr).toBe(0);
}, 30000);

test("public rendering data covers the exact approved files and dimensions", async () => {
  const { USER_MARKET_PHOTOS, PRIZE_HANDOVER_PHOTOS, USER_JOB_POSTERS } = await import("../../data/user-market-photos");
  const photos = [...Object.values(USER_MARKET_PHOTOS), ...PRIZE_HANDOVER_PHOTOS, ...Object.values(USER_JOB_POSTERS)];
  const m = JSON.parse(readFileSync("assets/source/user-market-photos/manifest.json", "utf8"));
  expect(photos).toHaveLength(17);
  expect(new Set(photos.map(photo => photo.src)).size).toBe(17);
  for (const entry of m.entries) {
    const photo = photos.find(photo => photo.src === `/images/editorial/user/${entry.output.name}`);
    expect(photo).toMatchObject(entry.output.dimensions);
    expect(photo?.alt.length).toBeGreaterThan(15);
  }
});
