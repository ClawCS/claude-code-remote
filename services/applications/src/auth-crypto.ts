import { constants, createCipheriv, createDecipheriv, createHash, createHmac, privateDecrypt, publicEncrypt, randomBytes, scrypt, timingSafeEqual, type KeyObject } from "node:crypto";
import { Secret, TOTP } from "otpauth";
import { performance } from "node:perf_hooks";
import { digest, staffId, type Digest, type StaffId } from "./types";

const PROFILE = { version: "scrypt-v1", N: 131072, r: 8, p: 1, maxmem: 268435456, keylen: 32 } as const;
export interface PasswordRecord { version: "scrypt-v1"; N: number; r: number; p: number; maxmem: number; keylen: number; salt: string; hash: string }
export function validPassword(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 256 || Buffer.byteLength(value, "utf8") > 512 || /[\u0000-\u001f\u007f-\u009f]/u.test(value)) return false;
  const scalars = [...value];
  return scalars.length >= 15 && scalars.length <= 128 && scalars.every(character => !/^[\ud800-\udfff]$/u.test(character));
}
function record(value: PasswordRecord): boolean {
  return !!value && Object.entries(PROFILE).every(([key, expected]) => value[key as keyof PasswordRecord] === expected) && /^[a-f0-9]{32}$/.test(value.salt) && /^[a-f0-9]{64}$/.test(value.hash);
}
type Derive = (password: string, salt: Buffer) => Promise<Buffer>;
const nativeDerive: Derive = (password, salt) => new Promise((resolve, reject) => {
  try { scrypt(password, salt, 32, { N: PROFILE.N, r: PROFILE.r, p: PROFILE.p, maxmem: PROFILE.maxmem }, (error, key) => error ? reject(new Error("AUTH_DENIED")) : resolve(key)); }
  catch { reject(new Error("AUTH_DENIED")); }
});
// One instance per exclusive repository owner. Started native work retains its
// slot until settlement; caller cancellation never frees a running native job.
export function createPasswordHasher(derive: Derive = nativeDerive) {
  let running = false;
  const waiting: { start(): void; reject(): void; deadline: number; timer: ReturnType<typeof setTimeout> }[] = [];
  function run(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const start = () => {
        running = true;
        Promise.resolve().then(() => derive(password, salt)).then(resolve, () => reject(new Error("AUTH_DENIED"))).finally(() => {
          running = false;
          while (waiting.length) {
            const next = waiting.shift()!; clearTimeout(next.timer);
            if (performance.now() >= next.deadline) { next.reject(); continue; }
            next.start(); break;
          }
        });
      };
      if (!running) { start(); return; }
      if (waiting.length >= 2) { reject(new Error("AUTH_DENIED")); return; }
      const item = { start, deadline: performance.now() + 5000, reject: () => reject(new Error("AUTH_DENIED")), timer: setTimeout(() => {
        const index = waiting.indexOf(item); if (index >= 0) { waiting.splice(index, 1); item.reject(); }
      }, 5000) };
      waiting.push(item);
    });
  }
  return {
    async hash(password: string): Promise<PasswordRecord> {
      if (!validPassword(password)) throw new Error("AUTH_DENIED");
      const salt = randomBytes(16), key = await run(password, salt);
      try { if (key.length !== 32) throw new Error("AUTH_DENIED"); return { ...PROFILE, salt: salt.toString("hex"), hash: key.toString("hex") }; }
      finally { key.fill(0); }
    },
    async verify(password: string, stored: PasswordRecord | null): Promise<boolean> {
      if (!validPassword(password)) return false;
      const valid = stored !== null && record(stored);
      // Fixed bounded dummy work; no database record controls native cost.
      const key = await run(password, valid ? Buffer.from(stored.salt, "hex") : Buffer.alloc(16));
      try { return key.length === 32 && timingSafeEqual(key, valid ? Buffer.from(stored.hash, "hex") : Buffer.alloc(32)) && valid; }
      finally { key.fill(0); }
    },
  };
}
export function randomToken(): string { return randomBytes(32).toString("base64url"); }
export function tokenDigest(purpose: "session" | "csrf" | "grant" | "replacement", value: string): Digest {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value) || Buffer.from(value, "base64url").toString("base64url") !== value) throw new Error("AUTH_DENIED");
  return digest(createHash("sha256").update(`tj-auth-${purpose}-1\0`).update(value).digest("hex"));
}
export function ipDigest(ip: string, key: Buffer): Digest {
  if (!Buffer.isBuffer(key) || key.length !== 32 || typeof ip !== "string" || ip.length > 64 || !ip) throw new Error("AUTH_DENIED");
  return digest(createHmac("sha256", key).update("tj-auth-ip-1\0").update(ip).digest("hex"));
}
export function recoveryDigest(code: string, id: StaffId, generation: number): Digest {
  if (typeof code !== "string" || !/^(?:[a-fA-F0-9]{32}|[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{8}){3})$/.test(code)) throw new Error("AUTH_DENIED");
  return digest(createHash("sha256").update(`tj-auth-recovery-1\0${staffId(id)}\0${generation}\0${code.replaceAll("-", "").toLowerCase()}`).digest("hex"));
}
export function newRecoveryCodes(): string[] { return Array.from({ length: 10 }, () => randomBytes(16).toString("hex").match(/.{8}/g)!.join("-")); }
export function newFactor(): Secret { return new Secret({ size: 20 }); }
export function provisioningUri(secret: Secret): string { return new TOTP({ issuer: "Trinkgut Jammers", label: "niko", secret, algorithm: "SHA1", digits: 6, period: 30 }).toString(); }
export function verifyFactor(secret: Secret, token: string, timestamp: number): number {
  if (!/^[0-9]{6}$/.test(token) || !Number.isSafeInteger(timestamp) || timestamp < 0 || TOTP.validate({ secret, token, algorithm: "SHA1", digits: 6, period: 30, window: 0, timestamp }) !== 0) throw new Error("AUTH_DENIED");
  return TOTP.counter({ period: 30, timestamp });
}
const MAGIC = Buffer.from("TJAUTH01");
function binding(id: StaffId, generation: number, prefix: Buffer): Buffer {
  staffId(id); if (!Number.isSafeInteger(generation) || generation < 1) throw new Error("AUTH_DENIED");
  return Buffer.concat([Buffer.from(`tj-auth-totp-v1\0${id}\0${generation}\0`), prefix]);
}
export function sealFactor(secret: Secret, id: StaffId, generation: number, publicKey: KeyObject): string {
  const size = publicKey.asymmetricKeyDetails?.modulusLength ?? 0;
  if (publicKey.type !== "public" || publicKey.asymmetricKeyType !== "rsa" || size < 2048 || size > 8192 || publicKey.asymmetricKeyDetails?.publicExponent !== BigInt(65537) || secret.bytes.length !== 20) throw new Error("AUTH_DENIED");
  const key = randomBytes(32), nonce = randomBytes(12);
  try {
    const wrapped = publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256", oaepLabel: MAGIC }, key);
    const length = Buffer.alloc(2); length.writeUInt16BE(wrapped.length);
    const prefix = Buffer.concat([MAGIC, length, wrapped, nonce]);
    const cipher = createCipheriv("aes-256-gcm", key, nonce); cipher.setAAD(binding(id, generation, prefix));
    return Buffer.concat([prefix, cipher.update(secret.bytes), cipher.final(), cipher.getAuthTag()]).toString("base64");
  } finally { key.fill(0); }
}
export function openFactor(value: string, id: StaffId, generation: number, privateKey: KeyObject): Secret {
  let key: Buffer | undefined, plaintext: Buffer | undefined;
  try {
    if (typeof value !== "string" || value.length > 1456 || privateKey.type !== "private" || privateKey.asymmetricKeyType !== "rsa") throw new Error();
    const bytes = Buffer.from(value, "base64"), size = bytes.readUInt16BE(8), prefixLength = 22 + size;
    if (bytes.toString("base64") !== value || !bytes.subarray(0, 8).equals(MAGIC) || size < 256 || size > 1024 || bytes.length !== prefixLength + 36) throw new Error();
    key = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256", oaepLabel: MAGIC }, bytes.subarray(10, 10 + size));
    const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(10 + size, prefixLength));
    decipher.setAAD(binding(id, generation, bytes.subarray(0, prefixLength))); decipher.setAuthTag(bytes.subarray(-16));
    plaintext = Buffer.concat([decipher.update(bytes.subarray(prefixLength, -16)), decipher.final()]);
    return new Secret({ buffer: Uint8Array.from(plaintext).buffer });
  } catch { throw new Error("AUTH_DENIED"); }
  finally { key?.fill(0); plaintext?.fill(0); }
}
