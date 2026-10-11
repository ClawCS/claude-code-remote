#!/usr/bin/env node
/** Focused, read-only GET audit. No API probes, external requests or persisted response bodies. */
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { renderedTree, walk } from "../lib/rendered-html.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ACCEPTS = [
  ["avif-preferred", "image/avif,image/webp,image/*;q=0.8"],
  ["webp", "image/webp"],
];
const WIDTHS = [640, 768, 1280];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const FORMATS = { "image/webp": "webp", "image/avif": "heif", "image/png": "png", "image/jpeg": "jpeg" };
const hash = bytes => createHash("sha256").update(bytes).digest("hex");

function origin(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Use an HTTP(S) origin without credentials");
  return new URL(url.origin);
}

function localUrl(value, base) {
  const url = new URL(value, base);
  if (url.origin !== base.origin || url.username || url.password) throw new Error("Giveaway images must use same-origin URLs without credentials");
  return url;
}

function imageSource(value, base) {
  const url = localUrl(value, base);
  const source = url.pathname === "/_next/image" ? url.searchParams.get("url") : url.pathname;
  if (!source || !/^\/images\/editorial\/(?:instagram|canva)\/giveaway-[a-z0-9-]+\.webp$/.test(source)) throw new Error("Unrecognized giveaway original path");
  const width = url.pathname === "/_next/image" ? Number(url.searchParams.get("w")) : null;
  if (width !== null && (!Number.isInteger(width) || width <= 0)) throw new Error("Invalid responsive image width");
  return { originalPath: source, path: url.pathname + url.search, width };
}

/** Inspect actual rendered active cards, not strings in RSC payloads/inert scripts. */
export function discoverGiveawayImages(html, baseUrl) {
  const base = origin(baseUrl);
  const cards = [];
  walk(renderedTree(html), node => {
    if (node.tag !== "article" || node.attrs["data-status"] !== "active" || !node.attrs["data-giveaway-id"]) return;
    const id = node.attrs["data-giveaway-id"];
    const images = [];
    walk(node, descendant => { if (descendant.tag === "img") images.push(descendant); });
    if (images.length !== 1) throw new Error(`${id}: active giveaway must have exactly one cover image`);
    const image = images[0];
    const source = imageSource(image.attrs.src, base);
    const width = Number(image.attrs.width), height = Number(image.attrs.height);
    if (![width, height].every(value => Number.isInteger(value) && value > 0)) throw new Error(`${id}: invalid declared cover dimensions`);
    const candidates = [source];
    for (const entry of (image.attrs.srcset ?? "").split(",").filter(Boolean)) {
      const [path, descriptor] = entry.trim().split(/\s+/);
      const variant = imageSource(path, base);
      if (variant.originalPath !== source.originalPath) throw new Error(`${id}: responsive variant points to a different original`);
      if (descriptor && /^\d+w$/.test(descriptor) && variant.width !== Number(descriptor.slice(0, -1))) throw new Error(`${id}: srcset width does not match optimizer width`);
      candidates.push(variant);
    }
    // Keep the actual src, and use advertised widths where possible. A missing
    // target width is requested through the same observed optimizer URL/quality.
    const variants = new Map();
    if (source.width !== null) variants.set(source.width, source);
    const optimizer = candidates.find(candidate => candidate.width !== null);
    if (!optimizer) throw new Error(`${id}: no responsive optimizer URL was discovered`);
    for (const wanted of WIDTHS) {
      const advertised = candidates.find(candidate => candidate.width === wanted);
      const url = localUrl(optimizer.path, base);
      url.searchParams.set("w", String(wanted));
      variants.set(wanted, advertised ?? { originalPath: source.originalPath, path: url.pathname + url.search, width: wanted });
    }
    cards.push({ id, originalPath: source.originalPath, width, height, src: source.path, srcset: image.attrs.srcset ?? "", variants: [...variants.values()].sort((a, b) => a.width - b.width) });
  });
  return cards;
}

async function bounded(operation, timeoutMs, cancel = () => {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60000) throw new Error("Timeout must be between 1 and 60000 ms");
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise((_, reject) => { timer = setTimeout(() => { cancel(); reject(new Error(`Request/decode timeout after ${timeoutMs} ms`)); }, timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

async function readBody(response, maxBytes, onReader) {
  const announced = Number(response.headers.get("content-length"));
  if (announced > maxBytes) throw new Error("Response exceeds byte limit");
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  onReader(reader);
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > maxBytes) throw new Error("Response exceeds byte limit");
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks, length);
  } finally { reader.cancel().catch(() => {}); }
}

/** Validate HTTP status, full body, hash, decoded pixels and requested dimensions. */
export async function inspectImageResponse(response, expected = {}, { timeoutMs = 15000 } = {}) {
  let reader, decoder;
  return bounded(async () => {
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
    const type = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!FORMATS[type]) throw new Error(`Unexpected image content-type: ${type || "missing"}`);
    const bytes = await readBody(response, MAX_IMAGE_BYTES, value => { reader = value; });
    if (!bytes.length) throw new Error("Empty image body");
    if (expected.bytes !== undefined && bytes.length !== expected.bytes) throw new Error("Original byte size mismatch");
    const sha256 = hash(bytes);
    if (expected.sha256 && sha256 !== expected.sha256) throw new Error("Original hash mismatch");
    let metadata;
    try {
      decoder = sharp(bytes, { limitInputPixels: 20000000, failOn: "warning" });
      metadata = await decoder.metadata();
      await decoder.raw().toBuffer(); // metadata alone accepts some truncated files.
    } catch (error) { throw new Error(`Image decode failed: ${error.message}`); }
    if (metadata.format !== FORMATS[type]) throw new Error("Image content-type/decoded format mismatch");
    if (expected.width !== undefined && metadata.width !== Math.min(expected.width, expected.sourceWidth ?? expected.width)) throw new Error("Responsive/original width mismatch");
    if (expected.height !== undefined && metadata.height !== expected.height) throw new Error("Original height mismatch");
    if (expected.sourceWidth && expected.sourceHeight && Math.abs(metadata.height - Math.round(metadata.width * expected.sourceHeight / expected.sourceWidth)) > 1) throw new Error("Responsive image aspect ratio mismatch");
    return { contentType: type, format: type === "image/avif" ? "avif" : metadata.format, width: metadata.width, height: metadata.height, bytes: bytes.length, sha256 };
  }, timeoutMs, () => { reader?.cancel().catch(() => {}); decoder?.destroy(); });
}

async function loadManifest() {
  const instagram = JSON.parse(await readFile(resolve(ROOT, "data/editorial/giveaway-instagram-covers.json"), "utf8"));
  const canva = JSON.parse(await readFile(resolve(ROOT, "assets/source/market-photos/manifest.json"), "utf8"));
  return { covers: [
    ...instagram.covers.filter(cover => cover.status === "approved"),
    ...canva.entries.filter(entry => entry.id.startsWith("giveaway-")).map(entry => ({ id: entry.id.slice("giveaway-".length), src: `/images/editorial/canva/${entry.output.name}`, width: entry.crop.width, height: entry.crop.height, sha256: entry.output.sha256 })),
  ] };
}

/** Uses the site's real-clock SSR status. Only local GETs; all failures are retained. */
export async function auditGiveawayImages({ url, manifest, fetchImpl = fetch, timeoutMs = 15000 }) {
  const base = origin(url);
  manifest ??= await loadManifest();
  const report = { schemaVersion: 1, auditedAt: new Date().toISOString(), baseUrl: base.origin, scope: "Active giveaway SSR covers and decoded original/responsive image GETs; not a browser visibility test", ok: false, pages: [], checks: [], findings: [] };
  const covers = new Map();
  const fail = (code, path, detail) => report.findings.push({ code, path, detail });
  async function request(path, accept, inspect) {
    const controller = new AbortController();
    try {
      return await bounded(async () => {
        const response = await fetchImpl(localUrl(path, base), { method: "GET", headers: { Accept: accept }, redirect: "manual", credentials: "omit", signal: controller.signal });
        return inspect(response);
      }, timeoutMs, () => controller.abort());
    } finally { controller.abort(); } // Also release rejected status/type bodies.
  }
  for (const path of ["/", "/gewinnspiel"]) {
    const page = { path, ids: [], ok: false };
    report.pages.push(page);
    try {
      const html = await request(path, "text/html", async response => {
        if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
        if (!response.headers.get("content-type")?.includes("text/html")) throw new Error("Page content-type is not HTML");
        return (await readBody(response, 4 * 1024 * 1024, () => {})).toString("utf8");
      });
      const found = discoverGiveawayImages(html, base.origin);
      page.ids = [...new Set(found.map(cover => cover.id))].sort();
      page.ok = true;
      for (const cover of found) {
        const previous = covers.get(cover.id);
        if (previous && previous.originalPath !== cover.originalPath) throw new Error(`${cover.id}: pages disagree about original`);
        if (previous) cover.variants = [...new Map([...previous.variants, ...cover.variants].map(variant => [variant.path, variant])).values()];
        covers.set(cover.id, cover);
      }
    } catch (error) { page.ok = false; fail("page-request-failed", path, error.message); }
  }
  if (report.pages.every(page => page.ok) && JSON.stringify(report.pages[0].ids) !== JSON.stringify(report.pages[1].ids)) fail("active-giveaway-mismatch", "/gewinnspiel", "Homepage and giveaway page disagree about active IDs");
  if (report.pages.every(page => page.ok) && covers.size === 0) fail("no-active-image-coverage", "/gewinnspiel", "No active covers discovered; current image delivery could not be verified. This is not proof that giveaways are missing.");
  for (const cover of covers.values()) {
    const original = manifest.covers.find(entry => entry.id === cover.id && entry.src === cover.originalPath);
    if (!original || !/^[a-f0-9]{64}$/.test(original.sha256 ?? "")) { fail("unverified-original", cover.originalPath, `${cover.id}: no approved original hash in manifest`); continue; }
    if (original.width !== cover.width || original.height !== cover.height) { fail("declared-dimension-mismatch", cover.originalPath, `${cover.id}: SSR dimensions differ from manifest`); continue; }
    const probes = [{ kind: "original", path: cover.originalPath, accept: "original", header: "image/webp", expected: { width: original.width, height: original.height, bytes: original.bytes, sha256: original.sha256 } }];
    for (const variant of cover.variants) for (const [accept, header] of ACCEPTS) probes.push({ kind: "variant", path: variant.path, width: variant.width, accept, header, expected: { width: variant.width, sourceWidth: original.width, sourceHeight: original.height } });
    // Deliberately sequential: a focused probe must not load-test the optimizer.
    for (const probe of probes) {
      const start = performance.now();
      const check = { id: cover.id, kind: probe.kind, path: probe.path, width: probe.width, accept: probe.accept, ok: false };
      report.checks.push(check);
      try {
        Object.assign(check, await request(probe.path, probe.header, response => inspectImageResponse(response, probe.expected, { timeoutMs })), { ok: true });
      } catch (error) { check.error = error.message; fail("image-delivery-failed", probe.path, `${probe.accept}: ${error.message}`); }
      check.durationMs = Math.round(performance.now() - start);
    }
  }
  report.ok = report.findings.length === 0;
  return report;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) { console.log("Usage: node scripts/audit-giveaway-images.mjs --url https://trinkgut-jammers.de [--output audit/evidence/giveaway-images.json]\nRead-only GETs for /, /gewinnspiel, current original covers and responsive image variants. No external requests or API probes. Default per-probe timeout: 15s. JSON goes to stdout unless --output is provided."); return; }
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!["--url", "--output"].includes(args[index]) || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error("Expected --url <origin> [--output <path>]");
    options[args[index].slice(2)] = args[index + 1];
  }
  if (!options.url) throw new Error("--url is required");
  const report = await auditGiveawayImages({ url: options.url });
  if (options.output) {
    const output = resolve(options.output);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`${report.ok ? "PASS" : "FAIL"}: ${report.checks.length} image GETs; ${report.findings.length} findings. Evidence: ${output}`);
  } else console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
