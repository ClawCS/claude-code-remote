import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";

const sourceFolder = "assets/source/market-photos";
const rawFolder = "assets/source/canva-exports-2026-09-30";
const inputs = [
  { id: "gift-basket", kind: "photo", source: "gift-basket.png", sourceHash: "920b21382a54fa35c03e1cf954a3c23acfd2dfd9f5211cdf2e4d5823ebb7d4ce", sourceDimensions: { width: 666, height: 910 }, crop: { left: 0, top: 0, width: 666, height: 910 }, output: { name: "gift-basket.webp", maxBytes: 120000, sha256: "2fd0c3a3c78134f0a077e11a09b524e54a16b0498ce8222ccf3635f13d5638f2" }, provenance: "operator-approved-canva", rubric: "geschenke" },
  { id: "salitos-market", kind: "photo", source: "salitos-market.png", sourceHash: "2eec65e7d0ac748d94784a62accb9897ec7cb6b1cd48db9ba7b9055fd7ff3445", sourceDimensions: { width: 696, height: 975 }, crop: { left: 0, top: 0, width: 696, height: 975 }, output: { name: "salitos-market.webp", maxBytes: 150000, sha256: "178308dcb2a5af95336e051a3df4c3779cbcd793e0b07cc63db89166a5d84da8" }, provenance: "operator-approved-canva", rubric: "markt" },
];
const fixtures: string[] = [];
afterEach(() => { for (const path of fixtures.splice(0)) rmSync(path, { recursive: true, force: true }); });

function hash(bytes: Buffer) { return createHash("sha256").update(bytes).digest("hex"); }

function fixture({ raw = false } = {}) {
  const root = mkdtempSync(join(process.cwd(), ".market-pipeline-test-"));
  fixtures.push(root);
  const script = join(root, "scripts/build-market-assets.mjs");
  mkdirSync(dirname(script), { recursive: true });
  if (existsSync(resolve("scripts/build-market-assets.mjs"))) copyFileSync(resolve("scripts/build-market-assets.mjs"), script);
  for (const [index, input] of inputs.entries()) {
    const target = join(root, raw ? rawFolder : sourceFolder, raw ? `fixture/${index + 1}.png` : input.source);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(resolve(sourceFolder, input.source), target);
  }
  const manifest = { schemaVersion: 1, reviewedAt: "2026-09-30", releaseBasis: "user-approved-canva-pool-2026-09-30", entries: structuredClone(inputs).map((entry, index) => raw ? { ...entry, source: `fixture/${index + 1}.png`, canva: { designId: "DAGfixture", page: index + 1 } } : entry) };
  const manifestPath = join(root, raw ? rawFolder : sourceFolder, raw ? "derivatives.json" : "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const output = join(root, "output");
  const save = () => writeFileSync(manifestPath, JSON.stringify(manifest));
  function run(args: string[] = []) {
    const child = spawn(process.execPath, [script, ...args], { env: { ...process.env, MARKET_ASSET_OUTPUT_DIR: output }, stdio: ["ignore", "pipe", "pipe"] });
    let text = "";
    child.stdout.on("data", chunk => { text += chunk.toString(); });
    child.stderr.on("data", chunk => { text += chunk.toString(); });
    const completion = new Promise<{ code: number | null; text: string }>(resolve => child.once("close", code => resolve({ code, text })));
    return { child, completion, stderr: () => text };
  }
  return { root, output, manifest, manifestPath, save, run };
}

async function waitForStaging(root: string, child: ChildProcess, error: () => string) {
  const until = Date.now() + 10000;
  while (Date.now() < until) {
    if (readdirSync(root).some(name => name.startsWith(".output.staging-"))) return;
    if (child.exitCode !== null) throw new Error(`Asset script exited before staging: ${error()}`);
    await new Promise(resolve => setTimeout(resolve, 2));
  }
  throw new Error("Asset staging was not reached");
}

describe("verified Canva market-photo derivatives", () => {
  it("prepares publishable lossless source crops without leaking raw account provenance", async () => {
    const f = fixture({ raw: true });
    const result = await f.run(["--prepare-sources"]).completion;
    expect(result.code, result.text).toBe(0);
    const publicManifestPath = join(f.root, "assets/source/market-photos/manifest.json");
    expect(existsSync(publicManifestPath)).toBe(true);
    const text = readFileSync(publicManifestPath, "utf8");
    expect(text).not.toContain("designId"); expect(text).not.toContain("DAGfixture");
    expect(text).not.toContain("fixture/1.png");
    const publicManifest = JSON.parse(text);
    expect(publicManifest.entries[0]).toMatchObject({ source: "gift-basket.png", sourceDimensions: { width: 666, height: 910 }, kind: "photo" });
    expect(publicManifest.entries[1]).toMatchObject({ source: "salitos-market.png", sourceDimensions: { width: 696, height: 975 }, kind: "photo" });
    for (const entry of publicManifest.entries) {
      const metadata = await sharp(join(f.root, "assets/source/market-photos", entry.source)).metadata();
      expect(metadata.exif).toBeUndefined(); expect(metadata.xmp).toBeUndefined(); expect(metadata.icc).toBeUndefined();
    }
  });

  it("creates natural-size stripped WebP crops without changing the originals", async () => {
    const f = fixture();
    const result = await f.run().completion;
    expect(result.code, result.text).toBe(0);
    expect(readdirSync(f.output).sort()).toEqual(["gift-basket.webp", "salitos-market.webp"]);
    for (const [index, expected] of [{ width: 666, height: 910 }, { width: 696, height: 975 }].entries()) {
      const input = inputs[index];
      const file = join(f.output, input.output.name);
      const bytes = readFileSync(file);
      const metadata = await sharp(bytes).metadata();
      expect(metadata).toMatchObject({ format: "webp", ...expected });
      expect(metadata.exif).toBeUndefined(); expect(metadata.xmp).toBeUndefined(); expect(metadata.icc).toBeUndefined();
      expect(bytes.length).toBeLessThan(input.output.maxBytes);
      expect(hash(readFileSync(join(f.root, sourceFolder, input.source)))).toBe(input.sourceHash);
      const original = await sharp(join(f.root, sourceFolder, input.source)).extract(input.crop).toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
      const originalStats = await sharp(original.data, { raw: original.info }).stats();
      const webStats = await sharp(bytes).stats();
      for (let channel = 0; channel < 3; channel++) expect(Math.abs(originalStats.channels[channel].mean - webStats.channels[channel].mean)).toBeLessThan(2);
    }
  });

  it("reproduces the complete published set on a clone with no private export folder", async () => {
    const f = fixture();
    for (const name of readdirSync(resolve(sourceFolder))) copyFileSync(resolve(sourceFolder, name), join(f.root, sourceFolder, name));
    expect(existsSync(join(f.root, rawFolder))).toBe(false);
    const result = await f.run().completion;
    expect(result.code, result.text).toBe(0);
    const expected = {
      "gift-basket.webp": "2fd0c3a3c78134f0a077e11a09b524e54a16b0498ce8222ccf3635f13d5638f2",
      "salitos-market.webp": "178308dcb2a5af95336e051a3df4c3779cbcd793e0b07cc63db89166a5d84da8",
      "regional-tante-dele.webp": "57b88cd7870aee9a9ce4c4d9553d580a3a02088cfe180ae8d559c25ee3ea3d56",
      "regional-schokolaedchen.webp": "211414d28abf4a6bb1af657ed26d583ea29b8e92a9146001419ebfd65adf6118",
      "regional-kaeffchen.webp": "2b364a9797e549a983527093b8e04107908dc7923ae49d3a55c1862cea30babd",
      "niko-market-life.webp": "1a4616a7a39df0833daf1a3dc60adb0050334d4ab0dc742d201c0891dc2f1c04",
    };
    expect(readdirSync(f.output).sort()).toEqual(Object.keys(expected).sort());
    for (const [name, sha] of Object.entries(expected)) expect(hash(readFileSync(join(f.output, name)))).toBe(sha);
    const check = await f.run(["--check"]).completion;
    expect(check.code, check.text).toBe(0);
  }, 15000);

  it("allows the larger original-product-graphic budget without applying it to photos", async () => {
    const f = fixture();
    f.manifest.entries[0].kind = "product-graphic";
    f.manifest.entries[0].output.maxBytes = 300000;
    f.save();
    const graphic = await f.run().completion;
    expect(graphic.code, graphic.text).toBe(0);
    f.manifest.entries[0].kind = "photo"; f.save();
    const photo = await f.run().completion;
    expect(photo.code).toBe(1);
    expect(photo.text).toMatch(/budget/i);
  });

  it("accepts the approved 150KB full-resolution photo budget but rejects larger declarations", async () => {
    const f = fixture();
    f.manifest.entries[0].output.maxBytes = 150000; f.save();
    const approved = await f.run().completion;
    expect(approved.code, approved.text).toBe(0);
    f.manifest.entries[0].output.maxBytes = 150001; f.save();
    const oversized = await f.run().completion;
    expect(oversized.code).toBe(1);
    expect(oversized.text).toMatch(/budget/i);
  });

  it("rebuilds identical bytes and removes obsolete files only from its output target", async () => {
    const f = fixture();
    const first = await f.run().completion;
    expect(first.code, first.text).toBe(0);
    const firstHash = hash(readFileSync(join(f.output, "gift-basket.webp")));
    writeFileSync(join(f.output, "stale.txt"), "old output");
    const second = await f.run().completion;
    expect(second.code, second.text).toBe(0);
    expect(hash(readFileSync(join(f.output, "gift-basket.webp")))).toBe(firstHash);
    expect(existsSync(join(f.output, "stale.txt"))).toBe(false);
    expect(existsSync(join(f.root, sourceFolder, "gift-basket.png"))).toBe(true);
  });

  it("check mode compares derivative bytes and never replaces a drifting target", async () => {
    const f = fixture();
    expect((await f.run().completion).code).toBe(0);
    expect((await f.run(["--check"]).completion).code).toBe(0);
    const destination = join(f.output, "gift-basket.webp");
    writeFileSync(destination, "tampered-output");
    const drift = await f.run(["--check"]).completion;
    expect(drift.code).toBe(1);
    expect(drift.text).toMatch(/drift/i);
    expect(readFileSync(destination, "utf8")).toBe("tampered-output");
  });

  it("validates every immutable input before touching an existing output directory", async () => {
    const f = fixture();
    mkdirSync(f.output); writeFileSync(join(f.output, "sentinel"), "preserve");
    f.manifest.entries[1].sourceHash = "0".repeat(64); f.save();
    const result = await f.run().completion;
    expect(result.code).toBe(1);
    expect(result.text).toMatch(/source hash mismatch/i);
    expect(readdirSync(f.output)).toEqual(["sentinel"]);
    expect(readdirSync(f.root).some(name => name.includes("staging"))).toBe(false);
  });

  it("rejects a derivative whose private manifest hash does not match", async () => {
    const f = fixture();
    (f.manifest.entries[0].output as typeof inputs[number]["output"] & { sha256?: string }).sha256 = "0".repeat(64);
    f.save();
    const result = await f.run().completion;
    expect(result.code).toBe(1);
    expect(result.text).toMatch(/derivative hash mismatch/i);
    expect(existsSync(f.output)).toBe(false);
  });

  it("rejects a public source manifest that omits the locked derivative hash", async () => {
    const f = fixture();
    Reflect.deleteProperty(f.manifest.entries[0].output, "sha256"); f.save();
    const result = await f.run().completion;
    expect(result.code).toBe(1);
    expect(result.text).toMatch(/derivative hash/i);
    expect(existsSync(f.output)).toBe(false);
  });

  it.each([
    ["source traversal", (entry: typeof inputs[number]) => { entry.source = "../team-canva/team-niko.jpg"; }, /source path/i],
    ["wrong dimensions", (entry: typeof inputs[number]) => { entry.sourceDimensions.width = 667; }, /source dimensions/i],
    ["crop outside original", (entry: typeof inputs[number]) => { entry.crop.left = 1400; }, /crop/i],
    ["noninteger crop", (entry: typeof inputs[number]) => { entry.crop.width = 392.5; }, /crop/i],
    ["escaping output", (entry: typeof inputs[number]) => { entry.output.name = "../escape.webp"; }, /output name/i],
    ["unsupported output", (entry: typeof inputs[number]) => { entry.output.name = "gift.jpg"; }, /output name/i],
    ["excessive budget", (entry: typeof inputs[number]) => { entry.output.maxBytes = 150001; }, /budget/i],
    ["missing Canva provenance", (entry: typeof inputs[number]) => { entry.provenance = ""; }, /canva/i],
  ] as const)("rejects %s before output writes", async (_name, change, message) => {
    const f = fixture(); change(f.manifest.entries[0]); f.save();
    const result = await f.run().completion;
    expect(result.code).toBe(1);
    expect(result.text).toMatch(message);
    expect(existsSync(f.output)).toBe(false);
  });

  it("renders only the source bytes that passed validation even if the file later changes", async () => {
    const f = fixture();
    const baseline = await f.run().completion;
    expect(baseline.code, baseline.text).toBe(0);
    const expected = hash(readFileSync(join(f.output, "salitos-market.webp")));
    const run = f.run();
    await waitForStaging(f.root, run.child, run.stderr);
    writeFileSync(join(f.root, sourceFolder, "salitos-market.png"), "changed after source validation");
    const result = await run.completion;
    expect(result.code, result.text).toBe(0);
    expect(hash(readFileSync(join(f.output, "salitos-market.webp")))).toBe(expected);
  }, 15000);
});
