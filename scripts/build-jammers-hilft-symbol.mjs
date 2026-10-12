import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

// Extract the approved native symbol, not the surrounding wordmark or arrow.
const source = resolve("public/images/Expertise Liköre (A5)/2.png");
const destination = resolve("public/images/brands/jammers-hilft-symbol.png");
const original = await readFile(source);
const originalHash = createHash("sha256").update(original).digest("hex");
if (originalHash !== "cadb058903f81e984c7a25e4a097339621d4edfcd6a6cc2adc6558b201ce3e1c") {
  throw new Error("Original sheet changed: recheck the approved crop before rebuilding.");
}
const width = 250;
const height = 250;
const paper = [251, 251, 242];
const pixels = await sharp(original).extract({ left: 57, top: 1644, width, height }).ensureAlpha().raw().toBuffer();
const exterior = new Uint8Array(width * height);
const queue = [];
function visit(p) {
  if (exterior[p]) return;
  const offset = p * 4;
  if (!paper.every((value, c) => Math.abs(pixels[offset + c] - value) <= 2)) return;
  exterior[p] = 1;
  queue.push(p);
}
for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
for (let i = 0; i < queue.length; i++) {
  const p = queue[i], x = p % width, y = Math.floor(p / width);
  if (x > 0) visit(p - 1);
  if (x < width - 1) visit(p + 1);
  if (y > 0) visit(p - width);
  if (y < height - 1) visit(p + width);
}
for (let p = 0; p < exterior.length; p++) {
  const offset = p * 4;
  if (exterior[p]) { pixels[offset + 3] = 0; continue; }
  const x = p % width, y = Math.floor(p / width);
  const touchesPaper = (x > 0 && exterior[p - 1]) || (x < width - 1 && exterior[p + 1]) ||
    (y > 0 && exterior[p - width]) || (y < height - 1 && exterior[p + width]);
  // Only dematte outer red antialias. Interior white hands remain unchanged.
  if (!touchesPaper || pixels[offset] <= pixels[offset + 1] || pixels[offset + 1] === 0 ||
    pixels[offset + 1] > paper[1] || pixels[offset + 2] > paper[2]) continue;
  const alphaByte = Math.max(1, Math.round((1 - pixels[offset + 1] / paper[1]) * 255));
  const alpha = alphaByte / 255;
  for (let c = 0; c < 3; c++) pixels[offset + c] = Math.max(0, Math.min(255,
    Math.round((pixels[offset + c] - paper[c] * (1 - alpha)) / alpha)));
  pixels[offset + 3] = alphaByte;
}
await mkdir(dirname(destination), { recursive: true });
await sharp(pixels, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(destination);
const output = await readFile(destination);
console.log(JSON.stringify({ path: "public/images/brands/jammers-hilft-symbol.png", width, height,
  bytes: output.length, sha256: createHash("sha256").update(output).digest("hex"), originalHash }));
