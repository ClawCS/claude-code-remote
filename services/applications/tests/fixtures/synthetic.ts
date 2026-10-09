import { createHash } from "node:crypto";
import { accessSync, constants, statSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { digest, applicationId, type ProcessingSnapshot, type SnapshotFile } from "../../src/types";
export function requireQpdfTestExecutable(value = process.env.APPLICATIONS_TEST_QPDF): string {
  try {
    if (!value || !isAbsolute(value) || !statSync(value).isFile()) throw new Error();
    accessSync(value, constants.X_OK);
    return value;
  } catch { throw new Error("QPDF_TEST_PREREQUISITE: set APPLICATIONS_TEST_QPDF to an absolute executable path for pinned QPDF 12.4.2; no fixtures are skipped"); }
}

// Independent tiny PDF fixture writer. It creates bytes for tests; never validates uploads.
export function pdf(objects: string[], trailer = "/Root 1 0 R", appended = ""): Buffer {
  let text = "%PDF-1.7\n"; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(text, "latin1")); text += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(text, "latin1");
  text += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  text += offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  return Buffer.from(`${text}trailer\n<< /Size ${objects.length + 1} ${trailer} >>\nstartxref\n${xref}\n%%EOF\n${appended}`, "latin1");
}
export function streamObject(bytes: Buffer, attributes = ""): string { return `<< /Length ${bytes.length} ${attributes} >>\nstream\n${bytes.toString("latin1")}\nendstream`; }
export function incrementalPdf(historicalActive: boolean): Buffer {
  const old = staticPdf(historicalActive ? "/OpenAction << /S /JavaScript /JS (old) >>" : "").toString("latin1");
  const previous = /startxref\n([0-9]+)/.exec(old)![1];
  const revision = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  return Buffer.from(`${old}${revision}xref\n1 1\n${String(old.length).padStart(10, "0")} 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R /Prev ${previous} >>\nstartxref\n${old.length + revision.length}\n%%EOF\n`, "latin1");
}
export function duplicateDefinitionPdf(duplicateXref = false): Buffer {
  const data = pdf(["<< /Type /Catalog /Pages 2 0 R >>\nendobj\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R /OpenAction << /S /JavaScript /JS (discarded) >> >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Resources << >> >>"]).toString("latin1");
  if (!duplicateXref) return Buffer.from(data, "latin1");
  const secondDefinition = data.indexOf("1 0 obj", data.indexOf("1 0 obj") + 1);
  return Buffer.from(data.replace("trailer\n", `1 1\n${String(secondDefinition).padStart(10, "0")} 00000 n \ntrailer\n`), "latin1");
}
export function staticPdf(extraCatalog = "", extras: string[] = []): Buffer {
  return pdf([`<< /Type /Catalog /Pages 2 0 R ${extraCatalog} >>`, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> >>", ...extras]);
}
export async function fixture(root: string, bytes: Buffer, name = "synthetic.pdf", mediaType = "application/pdf"): Promise<SnapshotFile> {
  const path = join(root, name); await writeFile(path, bytes, { mode: 0o600 });
  return { name, path, bytes: bytes.length, mediaType, digest: digest(createHash("sha256").update(bytes).digest("hex")) };
}
export function snapshot(files: SnapshotFile[]): ProcessingSnapshot {
  return { id: applicationId("11111111-1111-4111-8111-111111111111"), input: { name: "Synthetic", email: "test@example.invalid", job: "sales-fulltime" }, files, digest: digest("a".repeat(64)), encryptedPayloadPath: "/unused", bytes: files.reduce((sum, file) => sum + file.bytes, 0) };
}
