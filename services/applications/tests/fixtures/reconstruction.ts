import { accessSync, constants, statSync } from "node:fs";
import { isAbsolute } from "node:path";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import sharp from "sharp";
import type { RasterFrame } from "../../src/reconstruction-types";

export function requirePopplerTestExecutable(value = process.env.APPLICATIONS_TEST_POPPLER): string {
  try { if (!value || !isAbsolute(value) || !statSync(value).isFile()) throw new Error(); accessSync(value, constants.X_OK); return value; }
  catch { throw new Error("POPPLER_TEST_PREREQUISITE: explicit absolute Poppler 26.10.0 path required; no skipping"); }
}
export function blank(index = 0): RasterFrame { return { index, width: 100, height: 100, channels: 3, pixels: new Uint8Array(30_000).fill(255), pagePoints: { width: 36, height: 36 } }; }
export function imageFrame(alpha = false): RasterFrame {
  return { index: 0, width: 2, height: 3, channels: alpha ? 4 : 3, pixels: Uint8Array.from(alpha ? [255,0,0,0,0,255,0,128,0,0,255,255,255,255,0,255,0,255,255,128,255,0,255,255] : [255,0,0,0,255,0,0,0,255,255,255,0,0,255,255,255,0,255]) };
}
// Synthetic, no applicant data. Four pages: small type/table/signature, scan,
// offset CropBox + rotation, and a genuine blank page.
export async function visualPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([360, 504]);
  page.drawText("Synthetic application - 8 point readability", { x: 20, y: 474, size: 8, font });
  for (let row = 0; row < 8; row++) {
    page.drawText(`Row ${row + 1}   Complete qualifications   2026`, { x: 24, y: 445 - row * 22, size: 8, font });
    page.drawLine({ start: { x: 20, y: 437 - row * 22 }, end: { x: 340, y: 437 - row * 22 }, thickness: 0.5 });
  }
  page.drawText("Visible synthetic signature", { x: 20, y: 180, size: 8, font });
  for (let i = 0; i < 16; i++) page.drawLine({ start: { x: 25 + i * 9, y: 150 + Math.sin(i) * 9 }, end: { x: 34 + i * 9, y: 150 + Math.sin(i + 1) * 9 }, thickness: 1.2, color: rgb(0.1, 0.2, 0.5) });
  const scan = await sharp({ create: { width: 300, height: 180, channels: 3, background: "#e8e8e8" } }).composite([{ input: Buffer.from('<svg width="300" height="180"><text x="15" y="40" font-size="16">SYNTHETIC SCAN</text><path d="M15 70H280M15 90H260M15 110H275" stroke="black"/></svg>') }]).jpeg().toBuffer();
  const scanned = doc.addPage([300, 180]); scanned.drawImage(await doc.embedJpg(scan), { x: 0, y: 0, width: 300, height: 180 });
  const rotated = doc.addPage([400, 300]); rotated.setCropBox(40, 30, 300, 200); rotated.setRotation(degrees(90));
  rotated.drawRectangle({ x: 40, y: 30, width: 300, height: 200, borderWidth: 2, borderColor: rgb(1,0,0) });
  rotated.drawText("ROTATED CROP - every edge retained", { x: 55, y: 120, size: 10, font });
  doc.addPage([144, 216]);
  return Buffer.from(await doc.save({ useObjectStreams: false, addDefaultPage: false }));
}
