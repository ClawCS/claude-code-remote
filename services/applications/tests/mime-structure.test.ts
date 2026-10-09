import { describe, expect, it } from "vitest";
import { fingerprintMime } from "../src/mail-manifest";
import { collectMime, inspectMimeStructure, MIME_LIMITS } from "../src/mime-structure";
function message(text: Buffer | string, type = "text/plain; charset=utf-8") {
  return Buffer.from(["From: info@trinkgut-jammers.de", "To: info@trinkgut-jammers.de", "Reply-To: test@example.invalid", "Subject: Synthetic", "Date: Fri, 9 Oct 2026 12:00:00 +0000", "Message-ID: <application-1111@trinkgut-jammers.de>", "X-TJ-Application-ID: 11111111-1111-4111-8111-111111111111", "X-TJ-Profile: tj-mail-1", "X-TJ-Key-ID: old-key", "MIME-Version: 1.0", `Content-Type: ${type}`, "Content-Transfer-Encoding: base64", "", Buffer.from(text).toString("base64"), ""].join("\r\n"));
}
async function* bytes(raw: Buffer) { for (let i = 0; i < raw.length; i += 3) yield raw.subarray(i, i + 3); }
function mixed(attachmentCount = 1) {
  const headers = message("").toString().split("\r\n\r\n")[0].replace("text/plain; charset=utf-8", "multipart/mixed; boundary=FIXED").replace("\r\nContent-Transfer-Encoding: base64", "");
  const text = "--FIXED\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\nQQ==\r\n";
  const leaves = Array.from({ length: attachmentCount }, (_, i) => `--FIXED\r\nContent-Type: application/pdf; name=document-${i + 1}.pdf\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=document-${i + 1}.pdf\r\n\r\nJVBERi0=\r\n`).join("");
  return headers + "\r\n\r\n" + text + leaves + "--FIXED--\r\n";
}
describe("strict declared MIME v1 structure", () => {
  it("preserves meaningful folded-header continuation whitespace in independent fingerprints", async () => {
    const flat = message("A").toString().replace("Subject: Synthetic", "Subject: Synthetic A");
    const singleFold = flat.replace("Subject: Synthetic A", "Subject: Synthetic\r\n A");
    const changedFold = flat.replace("Subject: Synthetic A", "Subject: Synthetic\r\n  A");
    const original = await fingerprintMime(bytes(Buffer.from(flat)), MIME_LIMITS);
    expect((await fingerprintMime(bytes(Buffer.from(singleFold)), MIME_LIMITS)).fingerprint).toBe(original.fingerprint);
    const changed = await fingerprintMime(bytes(Buffer.from(changedFold)), MIME_LIMITS);
    expect(changed.headers.subject).toBe("Synthetic  A"); expect(changed.fingerprint).not.toBe(original.fingerprint);
  });
  it("preserves a UTF-8 BOM instead of silently removing content", async () => {
    expect((await inspectMimeStructure(message(Buffer.from([0xef, 0xbb, 0xbf, 0x41])), MIME_LIMITS)).text).toBe("\uFEFFA");
  });
  it("rejects high-bit garbage in transfer encoding instead of masking to ASCII", async () => {
    const raw = message("A"); raw[raw.indexOf("QQ==")] = 0xd1;
    await expect(inspectMimeStructure(raw, MIME_LIMITS)).rejects.toThrow("INVALID_MIME");
  });
  it("normalizes only CRLF while retaining whitespace and terminal newlines", async () => {
    const first = await fingerprintMime(bytes(message("A \r\n\r\n")), MIME_LIMITS);
    const equivalent = await fingerprintMime(bytes(message("A \n\n")), MIME_LIMITS);
    expect(first.fingerprint).toBe(equivalent.fingerprint);
    for (const changed of ["A\n\n", "A \n", "A \n\n "]) expect((await fingerprintMime(bytes(message(changed)), MIME_LIMITS)).fingerprint).not.toBe(first.fingerprint);
  });
  it.each([Buffer.from([0xc3, 0x28]), Buffer.from("A\rB")])("rejects invalid UTF-8 or bare CR %#", async text => {
    await expect(inspectMimeStructure(message(text), MIME_LIMITS)).rejects.toThrow("INVALID_MIME");
  });
  it.each(["text/plain; charset=utf-8; format=flowed", "text/plain; charset=utf-8; charset=ascii", "text/plain", "text/html; charset=utf-8"])("rejects ambiguous/unsupported declaration %s", async type => {
    await expect(inspectMimeStructure(message("A", type), MIME_LIMITS)).rejects.toThrow("INVALID_MIME");
  });
  it("enforces a decoded text bound before parsing convenience text", async () => {
    await expect(inspectMimeStructure(message("12345"), { ...MIME_LIMITS, maxTextBytes: 4 })).rejects.toThrow("MIME_LIMIT");
  });
  it("rejects a missing closing boundary instead of accepting a partial message", async () => {
    await expect(inspectMimeStructure(Buffer.from(mixed().replace("--FIXED--\r\n", "")), MIME_LIMITS)).rejects.toThrow("INVALID_MIME");
  });
  it("rejects nonempty multipart preamble including fake boundary-like text", async () => {
    await expect(inspectMimeStructure(Buffer.from(mixed().replace("\r\n\r\n--FIXED", "\r\n\r\n--FAKE\r\n--FIXED")), MIME_LIMITS)).rejects.toThrow("INVALID_MIME");
  });
  it.each([
    (raw: string) => raw.replace("--FIXED--", "--FIXED\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n\r\n--FIXED--"),
    (raw: string) => raw.replace("application/pdf; name=", "application/octet-stream; name="),
    (raw: string) => raw.replace("name=document-1.pdf", "name=other.pdf"),
    (raw: string) => raw.replace("filename=document-1.pdf", "filename=document-1.pdf; filename=other.pdf"),
    (raw: string) => raw.replace("Content-Disposition: attachment", "Content-ID: <inline>\r\nContent-Disposition: attachment"),
    (raw: string) => raw.replace("Content-Disposition: attachment", "Content-Disposition: inline"),
    (raw: string) => raw.replace("Content-Disposition: attachment", "Content-Type: image/png\r\nContent-Disposition: attachment"),
    (raw: string) => raw.replace("text/plain; charset=utf-8", "multipart/mixed; boundary=NESTED"),
  ])("rejects extra/ambiguous/nested attachment structures %#", async mutation => {
    await expect(inspectMimeStructure(Buffer.from(mutation(mixed())), MIME_LIMITS)).rejects.toThrow();
  });
  it("counts root part and enforces exact attachment/part/depth limits", async () => {
    expect((await inspectMimeStructure(Buffer.from(mixed(5)), MIME_LIMITS)).parts).toBe(7);
    await expect(inspectMimeStructure(Buffer.from(mixed(6)), MIME_LIMITS)).rejects.toThrow("MIME_LIMIT");
    await expect(inspectMimeStructure(Buffer.from(mixed()), { ...MIME_LIMITS, maxParts: 2 })).rejects.toThrow();
    await expect(inspectMimeStructure(Buffer.from(mixed()), { ...MIME_LIMITS, maxDepth: 0 })).rejects.toThrow();
  });
  it("matches independently framed v1 vector including direct decoded output bytes", async () => {
    expect((await fingerprintMime(bytes(Buffer.from(mixed())), MIME_LIMITS)).fingerprint).toBe("9b86fb08601610aaf17dc8d98add73d2fcaafed9d0462a44fd47c5ffd1c54a95");
  });
  it("enforces decoded file and aggregate byte limits under raw cap", async () => {
    await expect(fingerprintMime(bytes(Buffer.from(mixed())), { ...MIME_LIMITS, maxFileBytes: 4 })).rejects.toThrow("MIME_LIMIT");
    await expect(fingerprintMime(bytes(Buffer.from(mixed(2))), { ...MIME_LIMITS, maxAttachmentBytes: 9 })).rejects.toThrow("MIME_LIMIT");
  });
  it("accepts exactly 16 MiB raw collection but rejects one more byte", async () => {
    async function* maximum(extra: boolean) { for (let i = 0; i < 16; i++) yield Buffer.alloc(1048576); if (extra) yield Buffer.alloc(1); }
    expect((await collectMime(maximum(false), MIME_LIMITS.maxRawBytes)).length).toBe(16777216);
    await expect(collectMime(maximum(true), MIME_LIMITS.maxRawBytes)).rejects.toThrow("MIME_LIMIT");
  });
});
