import { PDFDocument } from "pdf-lib";

/** pdf-lib tolerates a missing terminal EOF; every original entry point must reject it. */
export async function validatePublicationPdf(bytes: Uint8Array, pageCount: number): Promise<void> {
  const buffer = Buffer.from(bytes);
  if (buffer.subarray(0,5).toString() !== "%PDF-" || !/%%EOF\s*$/.test(buffer.subarray(-1024).toString("latin1"))) throw new Error("Original PDF completeness mismatch");
  if ((await PDFDocument.load(buffer)).getPageCount() !== pageCount) throw new Error("Original PDF page count mismatch");
}
