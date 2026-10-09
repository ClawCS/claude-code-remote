import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSecretKey, createHash } from "node:crypto";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { MailParser, type AttachmentStream } from "mailparser";
import { buildMail, fingerprintMime, verifyMail } from "../src/mail-manifest";
import { withReconstructedDocuments, type ReconstructionDependencies, type ReconstructedBundle } from "../src/reconstruction";
import { readSnapshotFile } from "../src/file-validation";
import { utcInstant, type PrivateSnapshot } from "../src/types";
import { fixture, snapshot, staticPdf } from "./fixtures/synthetic";
import { blank } from "./fixtures/reconstruction";
const key = createSecretKey(Buffer.alloc(32, 7));
const identity = { id: snapshot([]).id, messageId: "<application-1111@trinkgut-jammers.de>", keyId: "mail-2026", date: utcInstant("2026-10-09T12:00:00.000Z") };
const limits = { maxRawBytes: 16777216, maxParts: 12, maxAttachments: 5, maxDepth: 1, maxFileBytes: 5242880, maxAttachmentBytes: 10485760, maxTextBytes: 65536 };
let root: string;
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), "mail-manifest-")); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });
async function* stream(raw: Buffer | string) { const bytes = Buffer.from(raw); for (let i = 0; i < bytes.length; i += 17) yield bytes.subarray(i, i + 17); }
async function collect(raw: AsyncIterable<Uint8Array>) { const chunks: Buffer[] = []; for await (const chunk of raw) chunks.push(Buffer.from(chunk)); return Buffer.concat(chunks); }
async function sentAttachments(raw: Buffer) {
  const parser = new MailParser(), pending = pipeline(Readable.from([raw]), parser), files: Buffer[] = [];
  for await (const part of parser) if (part.type === "attachment") {
    const file = part as AttachmentStream;
    try { if (!(file.content instanceof Readable)) throw new Error("fixture stream"); files.push(await collect(file.content)); } finally { file.release(); }
  }
  await pending; return files;
}
function deps(): ReconstructionDependencies { return {
  inspector: { assurance: "local-test", async inspect() { return { kind: "inspected", inspection: { format: "pdf", pageCount: 1 } }; } },
  raster: { async render(_file, emit) { await emit(blank()); return { format: "pdf", pageCount: 1 }; } },
  scanner: { assurance: "qualified-local-engine", async scan(file) { return { kind: "clean", complete: true, digest: file.digest, bytes: file.bytes, signatureTime: utcInstant(new Date().toISOString()), engineIdentity: "synthetic-only" }; } },
  output: { async verify(file) { await stat(file.path); } },
  scope: { async withScope(_id, action) { const path = await mkdtemp(join(root, "scope-")); try { return await action(path); } finally { await rm(path, { recursive: true, force: true }); } } }, monotonicNow: () => performance.now(),
}; }
async function prepared(withFile = true) {
  const source = snapshot(withFile ? [await fixture(root, staticPdf())] : []);
  return withReconstructedDocuments(source, deps(), async bundle => {
    const outputs = await Promise.all(bundle.files.map(readSnapshotFile));
    const mail = await buildMail(bundle, identity, key);
    return { mail, outputs, raw: await collect(mail.raw), source };
  });
}
describe("signed reconstructed mail (local synthetic streams)", () => {
  it("binds the actual reconstructed output, fixed addresses and immutable one-use MIME", async () => {
    const { mail, outputs, raw, source } = await prepared();
    expect(raw.toString()).toContain("From: info@trinkgut-jammers.de\r\n");
    expect(raw.toString()).toContain("To: info@trinkgut-jammers.de\r\n");
    expect(raw.toString()).toContain("Reply-To: test@example.invalid\r\n");
    const fingerprint = await fingerprintMime(stream(raw), limits);
    expect(await sentAttachments(raw)).toEqual(outputs);
    expect(fingerprint.attachments.map(f => f.digest)).toEqual(outputs.map(bytes => createHash("sha256").update(bytes).digest("hex")));
    expect(fingerprint.attachments[0].digest).not.toBe(source.files[0].digest);
    expect(await verifyMail(stream(raw), mail.registered, new Map([[identity.keyId, key]]))).toEqual({ kind: "verified" });
    await expect(collect(mail.raw)).rejects.toThrow("MAIL_ALREADY_CONSUMED");
  });
  it("rejects copied signature headers with changed or original attachment bytes", async () => {
    const { mail, raw } = await prepared();
    const changed = raw.toString().replace(/(Content-Transfer-Encoding: base64\r\nContent-Disposition:[\s\S]*?\r\n\r\n)[\s\S]*?(\r\n--)/, "$1" + staticPdf().toString("base64") + "$2");
    expect(changed).not.toBe(raw.toString());
    expect((await fingerprintMime(stream(changed), limits)).attachments[0].digest).toBe(createHash("sha256").update(staticPdf()).digest("hex"));
    expect((await verifyMail(stream(changed), mail.registered, new Map([[identity.keyId, key]]))).kind).toBe("mismatch");
  });
  it("permits only transport Received additions and retains old verification keys", async () => {
    const { mail, raw } = await prepared(false);
    expect(await verifyMail(stream("Received: by synthetic.invalid; Fri, 9 Oct 2026 12:00:01 +0000\r\n" + raw), mail.registered, new Map([["new-key", createSecretKey(Buffer.alloc(32, 8))], [identity.keyId, key]]))).toEqual({ kind: "verified" });
    expect((await verifyMail(stream(raw), mail.registered, new Map())).kind).toBe("mismatch");
  });
  it.each(["From: other@example.invalid\r\n", "X-Unreviewed: value\r\n", "Content-Type: text/plain; charset=utf-8\r\n"])("rejects duplicate identity or unapproved root header %s", async header => {
    const { mail, raw } = await prepared(false);
    expect((await verifyMail(stream(header + raw), mail.registered, new Map([[identity.keyId, key]]))).kind).toBe("mismatch");
  });
  it.each(["a@example.invalid, b@example.invalid", "a@example.invalid\r\nBcc: victim@example.invalid", "Name <a@example.invalid>", ".a@example.invalid", "a.@example.invalid", "a".repeat(65) + "@example.invalid", "a@" + "b".repeat(64) + ".invalid"])("rejects non-single Reply-To %s", async email => {
    const source = snapshot([]); source.input = { ...source.input, email };
    await expect(withReconstructedDocuments(source, deps(), bundle => buildMail(bundle, identity, key))).rejects.toThrow("INVALID_REPLY_TO");
  });
  it("verifies registered shape independent of object property serialization order", async () => {
    const { mail, raw } = await prepared();
    const expected = { ...mail.registered, shape: { attachments: mail.registered.shape.attachments.map(file => ({ bytes: file.bytes, digest: file.digest, mediaType: file.mediaType, name: file.name })), parts: mail.registered.shape.parts, kind: mail.registered.shape.kind } };
    expect(await verifyMail(stream(raw), expected, new Map([[identity.keyId, key]]))).toEqual({ kind: "verified" });
  });
  it("never replays a partially consumed prepared stream", async () => {
    const mail = await withReconstructedDocuments(snapshot([]), deps(), bundle => buildMail(bundle, identity, key));
    const iterator = mail.raw[Symbol.asyncIterator](); expect((await iterator.next()).done).toBe(false); await iterator.return?.();
    await expect(collect(mail.raw)).rejects.toThrow("MAIL_ALREADY_CONSUMED");
  });
  it("rejects forged and expired bundle authority", async () => {
    // A wrong buildMail parameter type makes this assignment fail in root tsc.
    const compileRejectsOriginal: PrivateSnapshot extends Parameters<typeof buildMail>[0] ? true : false = false;
    expect(compileRejectsOriginal).toBe(false);
    await expect(buildMail(snapshot([]) as unknown as ReconstructedBundle, identity, key)).rejects.toThrow("INVALID_RECONSTRUCTED_BUNDLE");
    const bundle = await withReconstructedDocuments(snapshot([]), deps(), async value => value);
    await expect(buildMail(bundle, identity, key)).rejects.toThrow("INVALID_RECONSTRUCTED_BUNDLE");
  });
  it.each(["messageId", "keyId"])("rejects identity header injection in %s", async field => {
    await expect(withReconstructedDocuments(snapshot([]), deps(), bundle => buildMail(bundle, { ...identity, [field]: "value\r\nBcc: victim@example.invalid" }, key))).rejects.toThrow("INVALID_MAIL_IDENTITY");
  });
  it("composes bounded immutable bytes while authority is live, consumable after scope closes", async () => {
    const mail = await withReconstructedDocuments(snapshot([await fixture(root, staticPdf())]), deps(), bundle => buildMail(bundle, identity, key));
    expect((await verifyMail(stream(await collect(mail.raw)), mail.registered, new Map([[identity.keyId, key]]))).kind).toBe("verified");
  });
  it.each(["x-tj-signature", "x-tj-fingerprint", "x-tj-key-id", "message-id"])("rejects copied identity claim mutation %s", async field => {
    const { mail, raw } = await prepared(false);
    const changed = raw.toString().replace(new RegExp(`^${field}: .*\\r?$`, "im"), `${field}: incorrect\r`);
    expect((await verifyMail(stream(changed), mail.registered, new Map([[identity.keyId, key]]))).kind).toBe("mismatch");
  });
  it("stops a raw over-limit stream without consuming the rest", async () => {
    let reads = 0; async function* excessive() { for (let i = 0; i < 10; i++) { reads++; yield Buffer.alloc(1024); } }
    await expect(fingerprintMime(excessive(), { ...limits, maxRawBytes: 1024 })).rejects.toThrow("MIME_LIMIT"); expect(reads).toBe(2);
  });
});
