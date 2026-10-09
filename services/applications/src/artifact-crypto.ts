import { constants as cryptoConstants, createCipheriv, createDecipheriv, createHash, privateDecrypt, publicEncrypt, randomBytes, type KeyObject } from "node:crypto";
import { constants } from "node:fs";
import { open, lstat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { ApplicationId, ApplicationRepository, ArtifactKind, ArtifactRecord, WorkerKeys } from "./types";
import { applicationId } from "./types";
import { checkPrivateRoot } from "./crypto";
import { artifactLimit, ARTIFACT_OVERHEAD } from "./storage-budget";

const magic = (kind: ArtifactKind) => Buffer.from(kind === "bundle" ? "TJBND001" : "TJMIM001");
function aad(prefix: Buffer, id: ApplicationId, kind: ArtifactKind) { applicationId(id); return Buffer.concat([prefix, Buffer.from(`\0${id}\0${kind}\0v1`)]); }
export function sealArtifactEnvelope(bytes: Buffer, id: ApplicationId, kind: ArtifactKind, key: KeyObject): Buffer {
  if (!["bundle", "mime"].includes(kind) || bytes.length > artifactLimit(kind) - ARTIFACT_OVERHEAD) throw new Error("ARTIFACT_TOO_LARGE");
  if (key.type !== "public" || key.asymmetricKeyType !== "rsa" || (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) throw new Error("INVALID_ENCRYPTION_TARGET");
  const secret = randomBytes(32), nonce = randomBytes(12);
  try {
    const wrapped = publicEncrypt({ key, padding: cryptoConstants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, secret);
    if (wrapped.length > 1024) throw new Error("INVALID_ENCRYPTION_TARGET");
    const size = Buffer.alloc(2); size.writeUInt16BE(wrapped.length);
    const prefix = Buffer.concat([magic(kind), size, wrapped, nonce]);
    const cipher = createCipheriv("aes-256-gcm", secret, nonce); cipher.setAAD(aad(prefix, id, kind));
    return Buffer.concat([prefix, cipher.update(bytes), cipher.final(), cipher.getAuthTag()]);
  } finally { secret.fill(0); }
}
export function openArtifactEnvelope(bytes: Buffer, id: ApplicationId, kind: ArtifactKind, key: KeyObject): Buffer {
  let secret: Buffer | undefined, unverified: Buffer | undefined;
  try {
    if (!["bundle", "mime"].includes(kind) || bytes.length < 38 || bytes.length > artifactLimit(kind) || !bytes.subarray(0,8).equals(magic(kind))) throw new Error();
    const length = bytes.readUInt16BE(8), prefixLength = 10 + length + 12;
    if (length < 256 || length > 1024 || bytes.length < prefixLength + 16 || bytes.length - prefixLength - 16 > artifactLimit(kind) - ARTIFACT_OVERHEAD) throw new Error();
    secret = privateDecrypt({ key, padding: cryptoConstants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, bytes.subarray(10,10+length));
    const cipher = createDecipheriv("aes-256-gcm", secret, bytes.subarray(10+length,prefixLength));
    cipher.setAAD(aad(bytes.subarray(0,prefixLength),id,kind)); cipher.setAuthTag(bytes.subarray(-16));
    unverified = cipher.update(bytes.subarray(prefixLength,-16));
    const final = cipher.final();
    const plaintext = Buffer.concat([unverified, final]);
    return plaintext;
  } catch { throw new Error("AUTHENTICATION_FAILED"); }
  finally { secret?.fill(0); unverified?.fill(0); }
}
export async function openArtifactHandle(path:string,root:string,kind:ArtifactKind){
  await checkPrivateRoot(root);
  if(dirname(path)!==root||resolve(path)!==path||!["bundle","mime"].includes(kind))throw new Error("INVALID_ARTIFACT");
  const before=await lstat(root),fd=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{
    const info=await fd.stat(),after=await lstat(root);
    if(before.ino!==after.ino||before.dev!==after.dev||!info.isFile()||info.nlink!==1||info.uid!==process.getuid?.()||(info.mode&0o7777)!==0o600||info.size>artifactLimit(kind))throw new Error("INVALID_ARTIFACT");
    return fd;
  }catch(error){await fd.close();throw error;}
}
export async function readArtifactFile(record: ArtifactRecord, root: string): Promise<Buffer> {
  if (!Number.isSafeInteger(record.bytes) || record.bytes < 1 || record.bytes > artifactLimit(record.kind)) throw new Error("INVALID_ARTIFACT");
  const fd=await openArtifactHandle(record.path,root,record.kind);
  try {
    if ((await fd.stat()).size !== record.bytes) throw new Error("INVALID_ARTIFACT");
    const bytes = Buffer.alloc(record.bytes + 1); let offset = 0;
    while (offset < bytes.length) { const read = await fd.read(bytes,offset,bytes.length-offset,offset); if (!read.bytesRead) break; offset += read.bytesRead; }
    if (offset !== record.bytes || createHash("sha256").update(bytes.subarray(0,offset)).digest("hex") !== record.ciphertextDigest) throw new Error("DIGEST_MISMATCH");
    return bytes.subarray(0,offset);
  } finally { await fd.close(); }
}
const authenticated = new WeakMap<object, { record: ArtifactRecord; plaintext: Buffer }>();
declare const evidenceBrand: unique symbol;
export interface AuthenticatedArtifact { readonly [evidenceBrand]: true }
export function assertAuthenticatedArtifact(evidence:AuthenticatedArtifact,id:ApplicationId,kind:ArtifactKind):void{
  const value=authenticated.get(evidence);if(!value||value.record.caseId!==id||value.record.kind!==kind)throw new Error("INVALID_ARTIFACT_AUTHORITY");
}
export function authenticatedArtifactBytes(evidence: AuthenticatedArtifact, id: ApplicationId, kind: ArtifactKind): Buffer {
  const value = authenticated.get(evidence);
  if (!value || value.record.caseId !== id || value.record.kind !== kind) throw new Error("INVALID_ARTIFACT_AUTHORITY");
  return Buffer.from(value.plaintext);
}
export async function withAuthenticatedArtifact<T>(repo: ApplicationRepository, record: ArtifactRecord, keys: WorkerKeys, action: (evidence: AuthenticatedArtifact) => Promise<T>): Promise<T> {
  return repo.withCaseLock(record.caseId, async () => {
    const registered = repo.getArtifact(record.caseId,record.kind);
    if (!registered || (["caseId","kind","path","bytes","plaintextDigest","ciphertextDigest","expiresAt"] as const).some(field=>registered[field]!==record[field])) throw new Error("INVALID_ARTIFACT_AUTHORITY");
    const plaintext = openArtifactEnvelope(await readArtifactFile(record,keys.privateRoot),record.caseId,record.kind,keys.privateKey);
    if (createHash("sha256").update(plaintext).digest("hex") !== record.plaintextDigest) { plaintext.fill(0); throw new Error("DIGEST_MISMATCH"); }
    const evidence = Object.freeze({}) as AuthenticatedArtifact;
    authenticated.set(evidence,{ record: { ...record }, plaintext });
    try { return await action(evidence); }
    finally { authenticated.delete(evidence); plaintext.fill(0); }
  });
}
