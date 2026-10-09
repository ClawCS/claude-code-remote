import sharp from "sharp";
import { decodeRasterFrame } from "./raster-protocol";
import type { RasterFrame } from "./reconstruction-types";
import { MAX_FILE_BYTES } from "./file-validation";

/** Encoder only receives checked raw pixels; no source buffer or metadata. */
export async function encodeRaster(frame: RasterFrame, format: "jpeg" | "png"): Promise<Uint8Array> {
  const checked = decodeRasterFrame({ index: 0, width: frame.width, height: frame.height, channels: frame.channels }, frame.pixels, 0, frame.channels === 4 ? "png" : format);
  if (format === "jpeg" && checked.channels !== 3) throw new Error("RASTER_INVALID");
  const image = sharp(checked.pixels, { raw: { width: checked.width, height: checked.height, channels: checked.channels }, limitInputPixels: 25_000_000 }).toColourspace("srgb");
  let warning = false; image.on("warning", () => { warning = true; });
  const output = await (format === "jpeg" ? image.jpeg({ quality: 94, chromaSubsampling: "4:4:4" }) : image.png()).toBuffer();
  if (warning) throw new Error("OUTPUT_INVALID");
  if (!output.length || output.length > MAX_FILE_BYTES) throw new Error("OUTPUT_LIMIT");
  // pdf-lib's JPEG embedder requires a zero-offset, exact backing ArrayBuffer.
  return Uint8Array.from(output);
}
