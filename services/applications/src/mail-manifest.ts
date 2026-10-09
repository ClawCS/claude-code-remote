import { createHash, createHmac, timingSafeEqual, type KeyObject } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import MailComposer from "nodemailer/lib/mail-composer";
import { MailParser, type AttachmentStream } from "mailparser";
import { assertReconstructedBundle, type ReconstructedBundle } from "./reconstruction";
import { readSnapshotFile } from "./file-validation";
import { applicationId, digest, utcInstant, type DeliveryIdentity, type MailAttachmentIdentity, type MailFingerprint, type MailShape, type MimeLimits, type PreparedMail, type RegisteredMail, type VerificationKeys, type VerificationResult } from "./types";
import { checkMimeLimits, collectMime, inspectMimeStructure, MAIL_ADDRESS, MAIL_PROFILE, MIME_LIMITS, STABLE_HEADERS } from "./mime-structure";
export { MIME_LIMITS, MAIL_PROFILE } from "./mime-structure";

function frame(values: readonly string[]): Buffer { return Buffer.concat(values.map(value => { const bytes = Buffer.from(value, "utf8"), length = Buffer.alloc(4); length.writeUInt32BE(bytes.length); return Buffer.concat([length, bytes]); })); }
function sign(identity: Pick<RegisteredMail, "id" | "messageId" | "keyId" | "fingerprint" | "profile">, key: KeyObject): string {
  if (key.type !== "secret" || (key.symmetricKeySize ?? 0) < 32) throw new Error("INVALID_MAIL_KEY");
  return createHmac("sha256", key).update(frame(["tj-application-mail-signature-1", identity.profile, identity.keyId, identity.id, identity.messageId, identity.fingerprint])).digest("hex");
}
function equalHex(left: string, right: string): boolean { return /^[a-f0-9]{64}$/.test(left) && /^[a-f0-9]{64}$/.test(right) && timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex")); }
function replyTo(value: string): string {
  if (typeof value !== "string" || value.length > 254 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(value) || value.includes("..")) throw new Error("INVALID_REPLY_TO");
  const [local, domain] = value.split("@");
  if (local.length > 64 || local.startsWith(".") || local.endsWith(".") || domain.split(".").some(label => label.length > 63)) throw new Error("INVALID_REPLY_TO");
  return value;
}
function validateIdentity(identity: DeliveryIdentity): void {
  applicationId(identity.id); utcInstant(identity.date);
  if (!/^<[A-Za-z0-9._-]{1,120}@trinkgut-jammers\.de>$/.test(identity.messageId) || !/^[A-Za-z0-9_-]{1,64}$/.test(identity.keyId)) throw new Error("INVALID_MAIL_IDENTITY");
}
export async function buildMail(bundle: ReconstructedBundle, identity: DeliveryIdentity, signingKey: KeyObject): Promise<PreparedMail> {
  assertReconstructedBundle(bundle); validateIdentity(identity);
  if (identity.id !== bundle.id) throw new Error("INVALID_MAIL_IDENTITY");
  const email = replyTo(bundle.input.email), attachments = [];
  for (const file of bundle.files) { const content = await readSnapshotFile(file); assertReconstructedBundle(bundle); attachments.push({ filename: file.name, contentType: file.mediaType, content, contentDisposition: "attachment", contentTransferEncoding: "base64" }); }
  const input = bundle.input;
  const text = [`Bewerbung: ${input.job === "sales-fulltime" ? "Verkauf Vollzeit" : "Verkauf Teilzeit bis zu 150 Stunden/Monat"}`, `Referenz: ${bundle.id}`, `Name: ${input.name}`, `E-Mail: ${email}`, `Telefon: ${input.phone ?? ""}`, "", "Nachricht:", input.message ?? "", "", "Technisch aufbereitete Kopien", "Unterlagen wurden technisch neu erstellt; digitale Signaturen werden nicht als gültig übernommen.", ""].join("\n");
  if (/\r(?!\n)/.test(text) || text.includes("\u0000")) throw new Error("INVALID_MAIL_TEXT");
  const composer = new MailComposer({ from: MAIL_ADDRESS, to: MAIL_ADDRESS, replyTo: email, messageId: identity.messageId, date: new Date(identity.date), subject: "Bewerbung über das Bewerbungsportal", text, textEncoding: "base64", attachments, disableFileAccess: true, disableUrlAccess: true, headers: { "X-TJ-Application-ID": identity.id, "X-TJ-Profile": MAIL_PROFILE, "X-TJ-Key-ID": identity.keyId } });
  const unsigned = await collectMime(composer.compile().createReadStream(), MIME_LIMITS.maxRawBytes);
  assertReconstructedBundle(bundle);
  const fingerprint = await fingerprintMime(Readable.from([unsigned]), MIME_LIMITS);
  const registered: RegisteredMail = Object.freeze({ id: identity.id, messageId: identity.messageId, keyId: identity.keyId, profile: MAIL_PROFILE, fingerprint: fingerprint.fingerprint, shape: fingerprint.shape });
  const raw = Buffer.concat([Buffer.from(`X-TJ-Fingerprint: ${registered.fingerprint}\r\nX-TJ-Signature: ${sign(registered, signingKey)}\r\n`), unsigned]);
  if (raw.length > MIME_LIMITS.maxRawBytes) throw new Error("MIME_LIMIT");
  let consumed = false;
  const source: AsyncIterable<Uint8Array> = { [Symbol.asyncIterator]() {
    if (consumed) throw new Error("MAIL_ALREADY_CONSUMED"); consumed = true;
    return (async function* () { try { for (let offset = 0; offset < raw.length; offset += 65536) yield Buffer.from(raw.subarray(offset, offset + 65536)); } finally { raw.fill(0); } })();
  } };
  return Object.freeze({ identity: Object.freeze({ ...identity }), envelope: Object.freeze({ from: MAIL_ADDRESS, to: Object.freeze([MAIL_ADDRESS] as const) }), raw: source, fingerprint: registered.fingerprint, registered });
}
export async function fingerprintMime(raw: AsyncIterable<Uint8Array>, limits: MimeLimits): Promise<MailFingerprint> {
  checkMimeLimits(limits);
  const bytes = await collectMime(raw, limits.maxRawBytes), structure = await inspectMimeStructure(bytes, limits);
  replyTo(structure.headers["reply-to"]); applicationId(structure.headers["x-tj-application-id"]);
  if (!/^<[A-Za-z0-9._-]{1,120}@trinkgut-jammers\.de>$/.test(structure.headers["message-id"]) || !/^[A-Za-z0-9_-]{1,64}$/.test(structure.headers["x-tj-key-id"]) || !Number.isFinite(Date.parse(structure.headers.date))) throw new Error("INVALID_MIME");
  const attachments: MailAttachmentIdentity[] = [], parser = new MailParser({ checksumAlgo: "sha256", skipHtmlToText: true, skipTextToHtml: true, skipTextLinks: true, skipImageLinks: true });
  // Canonical v1 is a sequence of uint32-BE byte lengths followed by UTF-8
  // values/raw bytes: profile, stable field-name/value pairs, CRLF→LF text,
  // decimal attachment count; then each name/type/decimal size/output bytes.
  // Received, signature and claimed fingerprint are never self-referenced.
  const canonical = createHash("sha256").update(frame([MAIL_PROFILE, ...STABLE_HEADERS.flatMap(key => [key, structure.headers[key]]), structure.text, String(structure.attachments.length)]));
  let total = 0;
  const parsing = pipeline(Readable.from([bytes]), parser);
  try {
    for await (const item of parser) {
      if (item.type !== "attachment") continue;
      const attachment = item as AttachmentStream, expected = structure.attachments[attachments.length];
      if (!expected) throw new Error("INVALID_MIME");
      canonical.update(frame([expected.name, expected.mediaType, String(expected.bytes)]));
      const byteLength = Buffer.alloc(4); byteLength.writeUInt32BE(expected.bytes); canonical.update(byteLength);
      const hash = createHash("sha256"); let count = 0;
      try {
        if (!(attachment.content instanceof Readable)) throw new Error("INVALID_MIME");
        for await (const part of attachment.content) {
          count += part.length; total += part.length;
          if (count > limits.maxFileBytes || total > limits.maxAttachmentBytes) throw new Error("MIME_LIMIT"); hash.update(part); canonical.update(part);
        }
      } finally { attachment.release(); }
      if (count !== expected.bytes || attachment.filename !== expected.name || attachment.contentType !== expected.mediaType) throw new Error("INVALID_MIME");
      attachments.push(Object.freeze({ ...expected, digest: digest(hash.digest("hex")), bytes: count }));
    }
    await parsing;
  } catch (error) { parser.destroy(); await parsing.catch(() => {}); throw error; }
  if (attachments.length !== structure.attachments.length) throw new Error("INVALID_MIME");
  const fingerprint = digest(canonical.digest("hex"));
  const shape = Object.freeze({ kind: structure.kind, parts: structure.parts, attachments: Object.freeze(attachments) });
  return Object.freeze({ fingerprint, headers: structure.headers, attachments: shape.attachments, shape });
}
export async function verifyMail(raw: AsyncIterable<Uint8Array>, expected: RegisteredMail, keys: VerificationKeys): Promise<VerificationResult> {
  try {
    const result = await fingerprintMime(raw, MIME_LIMITS), headers = result.headers, key = keys.get(expected.keyId);
    if (!key || expected.profile !== MAIL_PROFILE || headers["x-tj-application-id"] !== expected.id || headers["message-id"] !== expected.messageId || headers["x-tj-key-id"] !== expected.keyId || !equalHex(result.fingerprint, expected.fingerprint) || !equalHex(headers["x-tj-fingerprint"] ?? "", result.fingerprint) || !equalHex(headers["x-tj-signature"] ?? "", sign(expected, key)) || !sameShape(result.shape, expected.shape)) return { kind: "mismatch" };
    return { kind: "verified" };
  } catch { return { kind: "mismatch" }; }
}
function sameShape(left: MailShape, right: MailShape): boolean {
  return left.kind === right.kind && left.parts === right.parts && left.attachments.length === right.attachments.length && left.attachments.every((file, index) => {
    const other = right.attachments[index]; return file.name === other.name && file.mediaType === other.mediaType && file.bytes === other.bytes && equalHex(file.digest, other.digest);
  });
}
