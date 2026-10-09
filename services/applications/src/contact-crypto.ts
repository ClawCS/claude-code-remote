import { constants, createCipheriv, createDecipheriv, privateDecrypt, publicEncrypt, randomBytes, type KeyObject } from "node:crypto";
import { applicationId, utcInstant, type ApplicationId, type Instant } from "./types";
export interface ContactBinding { readonly caseId: ApplicationId; readonly acceptedAt: Instant; readonly version: number }
const MAGIC = Buffer.from("TJCONT01");
export const MAX_CONTACT_ENVELOPE = 2752;
function contactBytes(value: string): Buffer {
  if (typeof value !== "string" || value.length > MAX_CONTACT_ENVELOPE || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error("CONTACT_AUTHENTICATION_FAILED");
  const bytes = Buffer.from(value, "base64");
  if (bytes.toString("base64") !== value || bytes.length < 39 || !bytes.subarray(0, 8).equals(MAGIC)) throw new Error("CONTACT_AUTHENTICATION_FAILED");
  const size = bytes.readUInt16BE(8), prefixLength = 22 + size;
  if (size < 256 || size > 1024 || bytes.length <= prefixLength + 16 || bytes.length > prefixLength + 16 + 254) throw new Error("CONTACT_AUTHENTICATION_FAILED");
  return bytes;
}
// Bounded structural validation for persisted ciphertext; not authentication or
// permission to display. Only openContact authenticates and decrypts the value.
export function assertContactEnvelope(value: string): void { contactBytes(value); }
function emailBytes(email: string): Buffer {
  if (typeof email !== "string" || email.length > 254 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(email) || email.includes("..")) throw new Error("INVALID_CONTACT");
  const [local, domain] = email.split("@");
  if (local.length > 64 || local.startsWith(".") || local.endsWith(".") || domain.split(".").some(label => label.length > 63)) throw new Error("INVALID_CONTACT");
  return Buffer.from(email, "ascii");
}
function aad(binding: ContactBinding, prefix: Buffer): Buffer {
  applicationId(binding.caseId); utcInstant(binding.acceptedAt);
  if (binding.version !== 1 || Object.keys(binding).sort().join(",") !== "acceptedAt,caseId,version") throw new Error("INVALID_CONTACT_BINDING");
  return Buffer.concat([Buffer.from(`tj-application-contact-1\0${binding.caseId}\0${binding.acceptedAt}\0`), prefix]);
}
export function sealContact(email: string, binding: ContactBinding, publicKey: KeyObject): string {
  const plaintext = emailBytes(email), size = publicKey.asymmetricKeyDetails?.modulusLength ?? 0;
  if (publicKey.type !== "public" || publicKey.asymmetricKeyType !== "rsa" || size < 2048 || size > 8192 || publicKey.asymmetricKeyDetails?.publicExponent !== BigInt(65537)) { plaintext.fill(0); throw new Error("INVALID_PUBLIC_KEY"); }
  const key = randomBytes(32), nonce = randomBytes(12);
  try {
    const wrapped = publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256", oaepLabel: MAGIC }, key);
    const length = Buffer.alloc(2); length.writeUInt16BE(wrapped.length);
    const prefix = Buffer.concat([MAGIC, length, wrapped, nonce]);
    const cipher = createCipheriv("aes-256-gcm", key, nonce); cipher.setAAD(aad(binding, prefix));
    return Buffer.concat([prefix, cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]).toString("base64");
  } finally { plaintext.fill(0); key.fill(0); }
}
export function openContact(value: string, binding: ContactBinding, privateKey: KeyObject): string {
  let key: Buffer | undefined, plaintext: Buffer | undefined;
  try {
    if (privateKey.type !== "private" || privateKey.asymmetricKeyType !== "rsa") throw new Error();
    const bytes = contactBytes(value);
    const size = bytes.readUInt16BE(8), prefixLength = 22 + size;
    key = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256", oaepLabel: MAGIC }, bytes.subarray(10, 10 + size));
    const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(10 + size, prefixLength));
    decipher.setAAD(aad(binding, bytes.subarray(0, prefixLength))); decipher.setAuthTag(bytes.subarray(-16));
    plaintext = Buffer.concat([decipher.update(bytes.subarray(prefixLength, -16)), decipher.final()]);
    const email = new TextDecoder("utf-8", { fatal: true }).decode(plaintext); emailBytes(email).fill(0);
    return email;
  } catch { throw new Error("CONTACT_AUTHENTICATION_FAILED"); }
  finally { key?.fill(0); plaintext?.fill(0); }
}
