import { PDFDocument, PDFName } from "pdf-lib";
import { decodeRasterFrame } from "./raster-protocol";
import { encodeRaster } from "./image-encoder";
import { MAX_FILE_BYTES } from "./file-validation";
import type { RasterFrame } from "./reconstruction-types";
import { RECONSTRUCTION_LIMITS as limits } from "./reconstruction-limits";

export function assertPageGeometry(frame: RasterFrame): void {
  const points = frame.pagePoints;
  if (!points || Math.abs(frame.width - points.width * limits.dpi / 72) > 1 || Math.abs(frame.height - points.height * limits.dpi / 72) > 1) throw new Error("RASTER_PAGE_POINTS");
}
export function createPdfReconstruction(): { append(frame: RasterFrame): Promise<void>; finish(): Promise<Uint8Array> } {
  const document = PDFDocument.create({ updateMetadata: false }); let pages = 0, encodedBytes = 0, finished = false;
  return {
    async append(frame) {
      if (finished || pages >= limits.pdfPages) throw new Error("PAGE_LIMIT");
      const checked = decodeRasterFrame({ index: frame.index, width: frame.width, height: frame.height, channels: frame.channels, pagePoints: frame.pagePoints }, frame.pixels, pages, "pdf");
      assertPageGeometry(checked);
      const jpeg = await encodeRaster(checked, "jpeg"); encodedBytes += jpeg.length;
      if (encodedBytes > MAX_FILE_BYTES) throw new Error("OUTPUT_LIMIT");
      const doc = await document, image = await doc.embedJpg(jpeg), points = checked.pagePoints!;
      const page = doc.addPage([points.width, points.height]); page.drawImage(image, { x: 0, y: 0, width: points.width, height: points.height });
      page.node.delete(PDFName.of("Annots")); pages++;
    },
    async finish() {
      if (finished || !pages) throw new Error("RASTER_INCOMPLETE"); finished = true;
      const output = await (await document).save({ useObjectStreams: false, addDefaultPage: false, updateFieldAppearances: false });
      if (output.length > MAX_FILE_BYTES) throw new Error("OUTPUT_LIMIT"); return output;
    },
  };
}
