import { constants as cryptoConstants, createCipheriv, createDecipheriv, createHash, publicEncrypt, privateDecrypt, randomBytes, randomUUID, type KeyObject } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, unlink } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import type { IncomingTarget, SealedFile, IntakePayload, Digest } from "./types";
import { digest } from "./types";

// V1: magic(8), RSA wrapped-key length(u16), wrapped-key, nonce(12), ciphertext, tag(16).
// Authenticate the complete prefix as AAD. Bound plaintext independently of physical budget.
const MAGIC = Buffer.from("TJAPP001");
export const MAX_PAYLOAD_BYTES = 14 * 1024 * 1024 + 65536;
export const MAX_SEALED_BYTES = MAX_PAYLOAD_BYTES + 2048;
export async function readBoundedFile(fd: import("node:fs/promises").FileHandle, limit: number): Promise<Buffer> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_SEALED_BYTES) throw new Error("INVALID_READ_LIMIT");
  const chunks: Buffer[] = []; let bytes = 0;
  for (;;) {
    const chunk = Buffer.alloc(Math.min(65536, limit - bytes + 1));
    const result = await fd.read(chunk, 0, chunk.length, bytes); if (!result.bytesRead) break;
    bytes += result.bytesRead; if (bytes > limit) throw new Error("PAYLOAD_TOO_LARGE"); chunks.push(chunk.subarray(0, result.bytesRead));
  }
  return Buffer.concat(chunks, bytes);
}
export function strictObject(value: unknown, required: readonly string[], optional: readonly string[] = []): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_PAYLOAD");
  const object = value as Record<string, unknown>;
  if (required.some(key => !Object.hasOwn(object, key)) || Object.keys(object).some(key => ![...required, ...optional].includes(key))) throw new Error("INVALID_PAYLOAD");
  return object;
}
export function validatePayload(value: unknown): IntakePayload {
  const body = strictObject(value, ["version", "input", "files"]);
  const input = strictObject(body.input, ["name", "email", "job"], ["phone", "message"]);
  const bounds: Record<string, number> = { name: 120, email: 254, phone: 40, message: 5000 };
  for (const [key, max] of Object.entries(bounds)) {
    if (input[key] !== undefined && (typeof input[key] !== "string" || (input[key] as string).length > max || /\u0000/.test(input[key] as string))) throw new Error("INVALID_PAYLOAD");
  }
  if (!input.name || !input.email || !["sales-fulltime", "sales-parttime"].includes(String(input.job)) || body.version !== 1 || !Array.isArray(body.files) || body.files.length > 5) throw new Error("INVALID_PAYLOAD");
  let total = 0;
  for (const value of body.files) {
    const file = strictObject(value, ["name", "mediaType", "content"]);
    if (typeof file.name !== "string" || !file.name || file.name.length > 255 || /[\/\\\x00-\x1f\x7f]/.test(file.name) || [".", ".."].includes(file.name) || !["application/pdf", "image/jpeg", "image/png"].includes(String(file.mediaType)) || typeof file.content !== "string" || file.content.length > 6990508 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.content)) throw new Error("INVALID_PAYLOAD");
    const bytes = Buffer.from(file.content, "base64");
    if (bytes.toString("base64") !== file.content || bytes.length > 5242880) throw new Error("INVALID_PAYLOAD");
    total += bytes.length;
  }
  if (total > 10485760) throw new Error("INVALID_PAYLOAD");
  return value as IntakePayload;
}
export function encodePayload(payload: IntakePayload): Buffer {
  validatePayload(payload);
  const input = { name: payload.input.name, email: payload.input.email, job: payload.input.job, ...(payload.input.phone !== undefined ? { phone: payload.input.phone } : {}), ...(payload.input.message !== undefined ? { message: payload.input.message } : {}) };
  const bytes = Buffer.from(JSON.stringify({ version: 1, input, files: payload.files.map(file => ({ name: file.name, mediaType: file.mediaType, content: file.content })) }));
  if (bytes.length > MAX_PAYLOAD_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
  return bytes;
}
export function payloadDigest(payload: IntakePayload): Digest {
  const canonical = JSON.parse(encodePayload(payload).toString("utf8")) as IntakePayload;
  const hash = createHash("sha256");
  const field = (bytes: Buffer) => { const size = Buffer.alloc(4); size.writeUInt32BE(bytes.length); hash.update(size).update(bytes); };
  field(Buffer.from("TJ-REQUEST-1")); field(Buffer.from(JSON.stringify(canonical.input)));
  for (const file of canonical.files) { field(Buffer.from(file.name)); field(Buffer.from(file.mediaType)); field(Buffer.from(file.content, "base64")); }
  return digest(hash.digest("hex"));
}
export async function checkPrivateRoot(root: string): Promise<void> {
  if (!isAbsolute(root) || resolve(root) !== root || root === dirname(root) || root.split("/").some(part => ["public", ".git", "releases", ".build"].includes(part))) throw new Error("UNSAFE_PATH");
  for (let path = root; path !== dirname(path); path = dirname(path)) {
    const stat = await lstat(path);
    if (stat.isSymbolicLink() || !stat.isDirectory() || (path === root && ((stat.mode & 0o077) !== 0 || stat.uid !== process.getuid?.()))) throw new Error("UNSAFE_PATH");
  }
}
export async function checkIncomingRoot(root: string, uid: number, gid: number): Promise<void> {
  if (!Number.isSafeInteger(uid) || !Number.isSafeInteger(gid) || uid < 0 || gid < 0) throw new Error("UNSAFE_PATH");
  if (process.env.NODE_ENV === "test" && uid === process.getuid?.()) { const stat = await lstat(root); if ((stat.mode & 0o7777) === 0o700) { await checkPrivateRoot(root); return; } }
  if (!isAbsolute(root) || resolve(root) !== root || root === dirname(root)) throw new Error("UNSAFE_PATH");
  for (let path = root; path !== dirname(path); path = dirname(path)) { const stat = await lstat(path); if (!stat.isDirectory() || stat.isSymbolicLink() || (path === root && (stat.uid !== uid || stat.gid !== gid || (stat.mode & 0o7777) !== 0o2770))) throw new Error("UNSAFE_PATH"); }
}
export async function openPrivateFile(path: string, root: string, incoming?: { uid: number; gid: number }) {
  const check = () => incoming ? checkIncomingRoot(root, incoming.uid, incoming.gid) : checkPrivateRoot(root);
  await check();
  const before = await lstat(root);
  if (dirname(path) !== root || resolve(path) !== path) throw new Error("UNSAFE_PATH");
  let fd;
  try { fd = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW); } catch { throw new Error("UNSAFE_PATH"); }
  const stat = await fd.stat();
  try { await check(); const after = await lstat(root); if (before.ino !== after.ino || before.dev !== after.dev) throw new Error("UNSAFE_PATH"); } catch (error) { await fd.close(); throw error; }
  const mode = incoming ? 0o640 : 0o600;
  const fixture = process.env.NODE_ENV === "test" && incoming?.uid === process.getuid?.() && (stat.mode & 0o7777) === 0o600;
  if (!stat.isFile() || stat.nlink !== 1 || stat.uid !== (incoming?.uid ?? process.getuid?.()) || (!fixture && (stat.mode & 0o7777) !== mode) || (incoming && !fixture && stat.gid !== incoming.gid) || stat.size > MAX_SEALED_BYTES) { await fd.close(); throw new Error("UNSAFE_PATH"); }
  return fd;
}
export async function syncRoot(root: string): Promise<void> { const fd = await open(root, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW); try { await fd.sync(); } finally { await fd.close(); } }
export function intakePath(root: string, ticket: string): string {
  if (!/^[a-f0-9-]{36}$/.test(ticket)) throw new Error("INVALID_RESERVATION");
  return join(root, `${ticket}.enc`);
}
export async function sealIncoming(source: AsyncIterable<Uint8Array>, target: IncomingTarget, publicKey: KeyObject): Promise<SealedFile> {
  if (target.sharedGid !== undefined) await checkIncomingRoot(target.root, process.getuid!(), target.sharedGid); else await checkPrivateRoot(target.root);
  if (publicKey.type !== "public" || publicKey.asymmetricKeyType !== "rsa" || (publicKey.asymmetricKeyDetails?.modulusLength ?? 0) < 2048 || !Number.isSafeInteger(target.maxBytes) || target.maxBytes < 1 || target.maxBytes > MAX_SEALED_BYTES) throw new Error("INVALID_ENCRYPTION_TARGET");
  const path = intakePath(target.root, target.reservationId ?? randomUUID());
  const key = randomBytes(32), nonce = randomBytes(12);
  const wrapped = publicEncrypt({ key: publicKey, padding: cryptoConstants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, key);
  const length = Buffer.alloc(2); length.writeUInt16BE(wrapped.length);
  const prefix = Buffer.concat([MAGIC, length, wrapped, nonce]);
  const cipher = createCipheriv("aes-256-gcm", key, nonce); cipher.setAAD(prefix);
  const fd = await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, target.sharedGid !== undefined ? 0o640 : 0o600);
  if (target.sharedGid !== undefined) await fd.chmod(0o640);
  let bytes = 0, plaintext = 0;
  const hash = createHash("sha256");
  async function write(chunk: Buffer) {
    if (bytes + chunk.length + 16 > target.maxBytes) throw new Error("RESERVATION_EXCEEDED");
    let offset = 0; while (offset < chunk.length) { const result = await fd.write(chunk, offset, chunk.length - offset); if (!result.bytesWritten) throw new Error("WRITE_FAILED"); offset += result.bytesWritten; }
    bytes += chunk.length;
  }
  try {
    await write(prefix);
    for await (const chunk of source) { plaintext += chunk.length; if (plaintext > MAX_PAYLOAD_BYTES) throw new Error("PAYLOAD_TOO_LARGE"); hash.update(chunk); await write(cipher.update(chunk)); }
    await write(cipher.final());
    const tag = cipher.getAuthTag(); await fd.writeFile(tag); bytes += tag.length;
    await fd.sync(); await syncRoot(target.root);
    return { path, bytes, wireDigest: digest(hash.digest("hex")) };
  } catch (error) { await unlink(path); await syncRoot(target.root); throw error; }
  finally { key.fill(0); await fd.close(); }
}
export function decryptEnvelope(bytes: Buffer, privateKey: KeyObject): Buffer {
  if (bytes.length > MAX_SEALED_BYTES || bytes.length < 38 || !bytes.subarray(0, 8).equals(MAGIC) || privateKey.type !== "private" || privateKey.asymmetricKeyType !== "rsa") throw new Error("AUTHENTICATION_FAILED");
  const wrappedLength = bytes.readUInt16BE(8), prefixLength = 10 + wrappedLength + 12;
  if (wrappedLength < 256 || wrappedLength > 1024 || bytes.length < prefixLength + 16) throw new Error("AUTHENTICATION_FAILED");
  let key: Buffer | undefined;
  try {
    key = privateDecrypt({ key: privateKey, padding: cryptoConstants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, bytes.subarray(10, 10 + wrappedLength));
    const cipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(10 + wrappedLength, prefixLength)); cipher.setAAD(bytes.subarray(0, prefixLength)); cipher.setAuthTag(bytes.subarray(-16));
    // No caller sees update output until final has authenticated the complete object.
    return Buffer.concat([cipher.update(bytes.subarray(prefixLength, -16)), cipher.final()]);
  } catch { throw new Error("AUTHENTICATION_FAILED"); } finally { key?.fill(0); }
}
export function decodePayload(bytes: Buffer): IntakePayload {
  if (bytes.length > MAX_PAYLOAD_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
  try { return validatePayload(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes))); } catch { throw new Error("INVALID_PAYLOAD"); }
}
