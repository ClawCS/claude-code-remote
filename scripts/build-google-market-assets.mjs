#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCES = resolve(ROOT, "assets/source/google-market-photos");
const OUTPUT = resolve(ROOT, "public/images/editorial/google");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const positive = value => Number.isSafeInteger(value) && value > 0;
const fail = message => { throw new Error(`Google market assets: ${message}`); };
function keys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join(",") !== [...expected].sort().join(",")) fail(`invalid ${label} fields (private identities are not allowed)`);
}
function size(value, label) {
  keys(value, ["width", "height"], label);
  if (!positive(value.width) || !positive(value.height)) fail(`invalid ${label}`);
}
function within(parent, child) {
  const path = relative(parent, child);
  return path !== "" && path !== ".." && !path.startsWith(`..${sep}`) && !path.startsWith(sep);
}
async function inputs() {
  if (sharp.versions.sharp !== "0.35.5") fail("unsupported Sharp toolchain");
  const manifest = JSON.parse(await readFile(join(SOURCES, "manifest.json"), "utf8"));
  keys(manifest, ["schemaVersion", "reviewedAt", "releaseBasis", "entries"], "manifest");
  if (manifest.schemaVersion !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(manifest.reviewedAt) || manifest.releaseBasis !== "user-approved-google-owner-2026-10-08" || !Array.isArray(manifest.entries) || !manifest.entries.length) fail("invalid manifest");
  const ids = new Set(); const names = new Set(); const jobs = [];
  const sourceRoot = await realpath(SOURCES);
  for (const entry of manifest.entries) {
    keys(entry, ["id", "source", "sourceHash", "sourceDimensions", "crop", "provenance", "rubric", "output"], "entry");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || ids.has(entry.id)) fail("invalid or duplicate id");
    ids.add(entry.id);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.jpg$/.test(entry.source)) fail(`invalid source: ${entry.id}`);
    if (!/^[a-f0-9]{64}$/.test(entry.sourceHash)) fail(`invalid source hash: ${entry.id}`);
    if (entry.provenance !== "operator-approved-google-owner") fail(`invalid provenance: ${entry.id}`);
    if (typeof entry.rubric !== "string" || !entry.rubric.trim() || /https?:\/\//i.test(entry.rubric)) fail(`invalid rubric: ${entry.id}`);
    size(entry.sourceDimensions, "source dimensions");
    keys(entry.crop, ["left", "top", "width", "height"], "crop");
    if (entry.crop.left !== 0 || entry.crop.top !== 0 || entry.crop.width !== entry.sourceDimensions.width || entry.crop.height !== entry.sourceDimensions.height) fail(`full-frame crop required: ${entry.id}`);
    keys(entry.output, ["name", "maxBytes", "sha256", "dimensions"], "output");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/.test(entry.output.name) || names.has(entry.output.name)) fail("invalid or duplicate output name");
    names.add(entry.output.name);
    if (!positive(entry.output.maxBytes) || entry.output.maxBytes > 350000 || !/^[a-f0-9]{64}$/.test(entry.output.sha256)) fail(`invalid output hash or budget: ${entry.id}`);
    size(entry.output.dimensions, "output dimensions");
    const source = resolve(SOURCES, entry.source);
    if (!within(sourceRoot, await realpath(source))) fail(`source escapes directory: ${entry.id}`);
    const bytes = await readFile(source);
    if (hash(bytes) !== entry.sourceHash) fail(`source hash mismatch: ${entry.id}`);
    const metadata = await sharp(bytes).metadata();
    if (metadata.format !== "jpeg" || metadata.width !== entry.sourceDimensions.width || metadata.height !== entry.sourceDimensions.height || metadata.exif || metadata.xmp || metadata.icc || metadata.iptc || metadata.orientation) fail(`source dimensions or sanitized metadata mismatch: ${entry.id}`);
    jobs.push({ ...entry, bytes });
  }
  return jobs;
}
async function validate(bytes, job) {
  if (hash(bytes) !== job.output.sha256) fail(`derivative hash mismatch: ${job.id}`);
  const metadata = await sharp(bytes).metadata();
  if (metadata.format !== "webp" || metadata.width !== job.output.dimensions.width || metadata.height !== job.output.dimensions.height || metadata.exif || metadata.xmp || metadata.icc || metadata.iptc || metadata.orientation) fail(`output dimensions or metadata mismatch: ${job.id}`);
  if (bytes.length >= job.output.maxBytes) fail(`output exceeds byte budget: ${job.id}`);
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length && args[0] !== "--check")) fail("only --check is supported");
  const check = args[0] === "--check";
  const jobs = await inputs();
  // Rebuild only in memory: check mode never creates directories or files.
  const rebuilt = [];
  for (const job of jobs) {
    const bytes = await sharp(job.bytes).rotate().resize({ width: 1000, height: 1200, fit: "inside", withoutEnlargement: true }).toColourspace("srgb").webp({ quality: 82, effort: 6 }).toBuffer();
    await validate(bytes, job); rebuilt.push({ job, bytes });
  }
  if (check) {
    if (JSON.stringify((await readdir(OUTPUT)).sort()) !== JSON.stringify(jobs.map(job => job.output.name).sort())) fail("public derivative allowlist drift");
    const outputRoot = await realpath(OUTPUT);
    for (const { job, bytes } of rebuilt) {
      const target = join(OUTPUT, job.output.name);
      if (!within(outputRoot, await realpath(target))) fail(`output escapes directory: ${job.id}`);
      const actual = await readFile(target); await validate(actual, job);
      if (!actual.equals(bytes)) fail(`public derivative drift: ${job.id}`);
    }
  } else {
    await mkdir(dirname(OUTPUT), { recursive: true });
    const staging = await mkdtemp(join(dirname(OUTPUT), ".google-market-staging-"));
    const backup = `${OUTPUT}.backup-${randomUUID()}`; let hadTarget = false;
    try {
      for (const { job, bytes } of rebuilt) await writeFile(join(staging, job.output.name), bytes);
      try { await rename(OUTPUT, backup); hadTarget = true; } catch (error) { if (error.code !== "ENOENT") throw error; }
      try { await rename(staging, OUTPUT); } catch (error) { if (hadTarget) await rename(backup, OUTPUT); throw error; }
      if (hadTarget) await rm(backup, { recursive: true, force: true });
    } finally { await rm(staging, { recursive: true, force: true }); }
  }
  console.log(`${check ? "Checked" : "Built"} ${jobs.length} approved Google-owner market assets`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
