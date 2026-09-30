#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const RAW_SOURCE_ROOT = resolve(PROJECT_ROOT, "assets/source/canva-exports-2026-09-30");
const SOURCE_ROOT = resolve(PROJECT_ROOT, "assets/source/market-photos");
const PREPARE_MODE = process.argv.slice(2).includes("--prepare-sources");
const MANIFEST = PREPARE_MODE ? join(RAW_SOURCE_ROOT, "derivatives.json") : join(SOURCE_ROOT, "manifest.json");
const OUTPUT_DIR = resolve(process.env.MARKET_ASSET_OUTPUT_DIR ?? join(PROJECT_ROOT, "public/images/editorial/canva"));
const CHECK_MODE = process.argv.slice(2).includes("--check");
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const integer = value => Number.isInteger(value) && Number.isFinite(value);

function within(parent, child) {
  const path = relative(parent, child);
  return path !== "" && path !== ".." && !path.startsWith(`..${sep}`) && !path.startsWith(sep);
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

function validateEntry(entry, ids, names) {
  if (!entry || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id ?? "") || ids.has(entry.id)) throw new Error("Invalid or duplicate asset id");
  ids.add(entry.id);
  const sourcePattern = PREPARE_MODE ? /^[a-z0-9-]+\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpe?g)$/ : /^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/;
  if (typeof entry.source !== "string" || !sourcePattern.test(entry.source) || entry.source.includes("..")) throw new Error(`Invalid source path: ${entry.id}`);
  if (!/^[a-f0-9]{64}$/.test(entry.sourceHash ?? "")) throw new Error(`Invalid source hash: ${entry.id}`);
  const size = entry.sourceDimensions;
  if (!size || !integer(size.width) || !integer(size.height) || size.width <= 0 || size.height <= 0) throw new Error(`Invalid source dimensions: ${entry.id}`);
  const crop = entry.crop;
  if (!crop || ![crop.left, crop.top, crop.width, crop.height].every(integer) || crop.left < 0 || crop.top < 0 || crop.width <= 0 || crop.height <= 0 || crop.left + crop.width > size.width || crop.top + crop.height > size.height) throw new Error(`Invalid crop bounds: ${entry.id}`);
  const output = entry.output;
  if (!output || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/.test(output.name ?? "") || names.has(output.name)) throw new Error(`Invalid or duplicate output name: ${entry.id}`);
  names.add(output.name);
  const kind = entry.kind ?? (PREPARE_MODE ? "photo" : null);
  if (!["photo", "product-graphic"].includes(kind)) throw new Error(`Unsupported editorial image kind: ${entry.id}`);
  if (!integer(output.maxBytes) || output.maxBytes <= 0 || output.maxBytes > (kind === "product-graphic" ? 300000 : 150000)) throw new Error(`Invalid output byte budget: ${entry.id}`);
  if ((!PREPARE_MODE || output.sha256 !== undefined) && !/^[a-f0-9]{64}$/.test(output.sha256 ?? "")) throw new Error(`Invalid or missing derivative hash: ${entry.id}`);
  if (PREPARE_MODE) {
    if (!entry.canva || !/^DA[A-Za-z0-9_-]+$/.test(entry.canva.designId ?? "") || !integer(entry.canva.page) || entry.canva.page < 1) throw new Error(`Missing or invalid Canva identity: ${entry.id}`);
  } else if (entry.provenance !== "operator-approved-canva") throw new Error(`Missing Canva provenance: ${entry.id}`);
  if (typeof entry.rubric !== "string" || !entry.rubric.trim()) throw new Error(`Missing editorial rubric: ${entry.id}`);
}

async function validatedInputs() {
  if (sharp.versions.sharp !== "0.35.5") throw new Error("Unsupported Sharp toolchain; expected 0.35.5");
  if (PREPARE_MODE && CHECK_MODE) throw new Error("Do not combine --prepare-sources and --check");
  if (!within(PROJECT_ROOT, OUTPUT_DIR) || [SOURCE_ROOT, RAW_SOURCE_ROOT].some(source => within(source, OUTPUT_DIR) || OUTPUT_DIR === source || within(OUTPUT_DIR, source))) throw new Error("Output target must be a dedicated project directory outside sources");
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  if (manifest.schemaVersion !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(manifest.reviewedAt ?? "") || !manifest.releaseBasis || !Array.isArray(manifest.entries) || manifest.entries.length === 0) throw new Error("Invalid private derivative manifest");
  const ids = new Set(); const names = new Set();
  for (const entry of manifest.entries) validateEntry(entry, ids, names);
  const sourceDirectory = PREPARE_MODE ? RAW_SOURCE_ROOT : SOURCE_ROOT;
  const sourceRoot = await realpath(sourceDirectory);
  const jobs = [];
  // Read and validate the complete input set before mkdir/staging/output writes.
  for (const entry of manifest.entries) {
    const file = resolve(sourceDirectory, entry.source);
    if (!within(sourceRoot, await realpath(file))) throw new Error(`Source path escapes the approved source directory: ${entry.id}`);
    const bytes = await readFile(file);
    if (sha256(bytes) !== entry.sourceHash) throw new Error(`Source hash mismatch: ${entry.id}`);
    const metadata = await sharp(bytes).metadata();
    if (metadata.width !== entry.sourceDimensions.width || metadata.height !== entry.sourceDimensions.height) throw new Error(`Source dimensions mismatch: ${entry.id}`);
    if (metadata.orientation && metadata.orientation !== 1) throw new Error(`Source orientation requires a separately reviewed crop: ${entry.id}`);
    jobs.push(Object.freeze({ ...entry, bytes }));
  }
  return Object.freeze(jobs);
}

async function validateOutput(bytes, job) {
  if (job.output.sha256 && sha256(bytes) !== job.output.sha256) throw new Error(`Derivative hash mismatch: ${job.id}`);
  const metadata = await sharp(bytes).metadata();
  if (metadata.format !== "webp" || metadata.width !== job.crop.width || metadata.height !== job.crop.height) throw new Error(`Output dimensions or format mismatch: ${job.id}`);
  if (metadata.exif || metadata.xmp || metadata.icc) throw new Error(`Output metadata was not stripped: ${job.id}`);
  if (bytes.length >= job.output.maxBytes) throw new Error(`Output exceeds byte budget: ${job.id}`);
}

async function compareTarget(staging, jobs) {
  if (!(await exists(OUTPUT_DIR))) throw new Error("Market asset drift: output directory is missing");
  const expectedNames = jobs.map(job => job.output.name).sort();
  if (JSON.stringify((await readdir(OUTPUT_DIR)).sort()) !== JSON.stringify(expectedNames)) throw new Error("Market asset allowlist drift");
  for (const job of jobs) {
    const actual = await readFile(join(OUTPUT_DIR, job.output.name));
    const rebuilt = await readFile(join(staging, job.output.name));
    if (sha256(actual) !== sha256(rebuilt)) throw new Error(`Market asset drift: ${job.output.name}`);
    await validateOutput(actual, job);
  }
}

async function installTarget(staging, target = OUTPUT_DIR) {
  const backup = join(dirname(target), `.${basename(target)}.backup-${randomUUID()}`);
  const hadTarget = await exists(target);
  let installed = false;
  try {
    if (hadTarget) await rename(target, backup);
    await rename(staging, target);
    installed = true;
    if (hadTarget) await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (installed) await rm(target, { recursive: true, force: true });
    if (hadTarget && await exists(backup) && !(await exists(target))) await rename(backup, target);
    throw error;
  }
}

async function prepareSourceCrops(jobs) {
  await mkdir(dirname(SOURCE_ROOT), { recursive: true });
  const staging = await mkdtemp(join(dirname(SOURCE_ROOT), ".market-photos.staging-"));
  const publicManifest = {
    schemaVersion: 1, reviewedAt: "2026-09-30", releaseBasis: "user-approved-canva-pool-2026-09-30",
    provenance: "Only operator-reviewed, lossless source crops from the approved Canva pool; no account/design/page IDs or raw promotional collages are published.",
    entries: [],
  };
  const privateManifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  try {
    for (const job of jobs) {
      const bytes = await sharp(job.bytes).extract(job.crop).toColourspace("srgb").png({ compressionLevel: 9, palette: false }).toBuffer();
      const metadata = await sharp(bytes).metadata();
      if (metadata.exif || metadata.xmp || metadata.icc || metadata.width !== job.crop.width || metadata.height !== job.crop.height) throw new Error(`Public source crop was not safely stripped: ${job.id}`);
      const publicEntry = {
        id: job.id, kind: job.kind ?? "photo", source: `${job.id}.png`, sourceHash: sha256(bytes),
        sourceDimensions: { width: job.crop.width, height: job.crop.height },
        crop: { left: 0, top: 0, width: job.crop.width, height: job.crop.height },
        provenance: "operator-approved-canva", rubric: job.rubric,
        output: { name: job.output.name, maxBytes: job.output.maxBytes },
      };
      const derivative = await sharp(bytes).toColourspace("srgb").webp({ quality: 82, effort: 6 }).toBuffer();
      await validateOutput(derivative, job);
      publicEntry.output.sha256 = sha256(derivative);
      publicManifest.entries.push(publicEntry);
      const privateEntry = privateManifest.entries.find(entry => entry.id === job.id);
      privateEntry.publicSource = { path: `assets/source/market-photos/${job.id}.png`, sha256: publicEntry.sourceHash, dimensions: publicEntry.sourceDimensions };
      privateEntry.output.sha256 = publicEntry.output.sha256;
      await writeFile(join(staging, publicEntry.source), bytes);
    }
    await writeFile(join(staging, "manifest.json"), `${JSON.stringify(publicManifest, null, 2)}\n`);
    await installTarget(staging, SOURCE_ROOT);
    await writeFile(MANIFEST, `${JSON.stringify(privateManifest, null, 2)}\n`);
    console.log(`Prepared ${jobs.length} public-safe Canva source crops in ${SOURCE_ROOT}; raw provenance remains private`);
  } finally { await rm(staging, { recursive: true, force: true }); }
}

async function main() {
  const jobs = await validatedInputs();
  if (PREPARE_MODE) return prepareSourceCrops(jobs);
  await mkdir(dirname(OUTPUT_DIR), { recursive: true });
  const staging = await mkdtemp(join(dirname(OUTPUT_DIR), `.${basename(OUTPUT_DIR)}.staging-`));
  try {
    for (const job of jobs) {
      const bytes = await sharp(job.bytes).extract(job.crop).toColourspace("srgb").webp({ quality: 82, effort: 6 }).toBuffer();
      await validateOutput(bytes, job);
      await writeFile(join(staging, job.output.name), bytes);
    }
    if (CHECK_MODE) await compareTarget(staging, jobs);
    else await installTarget(staging);
    console.log(`${CHECK_MODE ? "Checked" : "Built"} ${jobs.length} verified Canva market assets in ${OUTPUT_DIR}`);
  } finally { await rm(staging, { recursive: true, force: true }); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
