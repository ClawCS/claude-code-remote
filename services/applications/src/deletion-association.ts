import { createHmac, timingSafeEqual } from "node:crypto";
import { applicationId, type AdmissionScope, type DeletionScope, type RegisteredMail, type SubmissionKind, type VerifiedCopy } from "./types";

// Pure worker-private codecs. Valid shape and a keyed digest are bindings, not
// proof of admission, a current case authority or permission to mutate mail.
const ID = /^[a-f0-9]{32}$/, DIGEST = /^[a-f0-9]{64}$/;
function invalid(): never { throw new Error("DELETION_ASSOCIATION_INVALID"); }
function exact(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Reflect.ownKeys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown, pattern: RegExp, max: number): string {
  if (typeof value !== "string" || value.length > max || !pattern.test(value)) invalid();
  return value;
}
function instant(value: unknown): string {
  const result = text(value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 24);
  if (!Number.isFinite(Date.parse(result)) || new Date(result).toISOString() !== result) invalid();
  return result;
}
function integer(value: unknown, min: number, max: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) invalid();
  return value as number;
}
export function snapshotAdmissionScope(value: unknown): AdmissionScope {
  if (!Array.isArray(value) || value.length !== 5 || Object.keys(value).length !== 5) invalid();
  const epoch = text(value[0], ID, 32), from = instant(value[3]), through = value[4] === null ? null : instant(value[4]);
  if (through !== null && through <= from) invalid();
  if (value[1] === "application" && value[2] === null) return Object.freeze([epoch, "application", null, from, through]);
  if (value[1] === "synthetic") return Object.freeze([epoch, "synthetic", text(value[2], /^[A-Za-z0-9_-]{1,64}$/, 64), from, through]);
  return invalid();
}
export function snapshotDeletionScope(value: unknown): DeletionScope {
  const source = exact(value, ["ledgerId", "historyEpoch", "associationKeyId", "associationKey", "approvedScopes"]);
  const ledgerId = text(source.ledgerId, ID, 32), historyEpoch = text(source.historyEpoch, ID, 32), associationKeyId = text(source.associationKeyId, /^[a-z0-9-]{1,32}$/, 32);
  if (!Buffer.isBuffer(source.associationKey) || source.associationKey.length !== 32 || !Array.isArray(source.approvedScopes) || source.approvedScopes.length < 1 || source.approvedScopes.length > 16 || Object.keys(source.approvedScopes).length !== source.approvedScopes.length) invalid();
  const approvedScopes = source.approvedScopes.map(snapshotAdmissionScope);
  if (new Set(approvedScopes.map(scope => scope[0])).size !== approvedScopes.length) invalid();
  return Object.freeze({ ledgerId, historyEpoch, associationKeyId, associationKey: Buffer.from(source.associationKey), approvedScopes: Object.freeze(approvedScopes) });
}
export function admissionScopeAccepts(scope: AdmissionScope, submission: SubmissionKind, acceptedAt: string): boolean {
  const checked = snapshotAdmissionScope(scope), at = instant(acceptedAt);
  exact(submission, submission.kind === "application" ? ["kind"] : ["kind", "pilotRunId"]);
  return checked[1] === submission.kind && (submission.kind === "application" || checked[2] === submission.pilotRunId)
    && at >= checked[3] && (checked[4] === null || at < checked[4]);
}
export function sameDeletionScope(left: DeletionScope, right: DeletionScope): boolean {
  const a = snapshotDeletionScope(left), b = snapshotDeletionScope(right);
  return a.ledgerId === b.ledgerId && a.historyEpoch === b.historyEpoch && a.associationKeyId === b.associationKeyId
    && timingSafeEqual(a.associationKey, b.associationKey) && a.approvedScopes.length === b.approvedScopes.length
    && a.approvedScopes.every((scope, i) => scope.every((value, j) => value === b.approvedScopes[i][j]));
}
function association(key: Buffer, domain: string, fields: readonly string[]): string {
  // Only bounded, validated primitive snapshots reach serialization. Include
  // domain/newline in the byte ceiling; never truncate or normalize a preimage.
  const preimage = Buffer.from(domain + "\n" + JSON.stringify(fields), "utf8");
  if (preimage.length > 32768) invalid();
  return createHmac("sha256", key).update(preimage).digest("hex");
}
export function registrationAssociation(scope: DeletionScope, epoch: string, value: RegisteredMail): string {
  const context = snapshotDeletionScope(scope); text(epoch, ID, 32);
  if (!context.approvedScopes.some(approved => approved[0] === epoch)) invalid();
  const source = exact(value, ["id", "messageId", "keyId", "profile", "fingerprint", "shape"]);
  const id = text(source.id, /^[a-f0-9-]{36}$/, 36); try { applicationId(id); } catch { invalid(); }
  const messageId = text(source.messageId, /^<[A-Za-z0-9._-]{1,120}@trinkgut-jammers\.de>$/, 142);
  const keyId = text(source.keyId, /^[A-Za-z0-9_-]{1,64}$/, 64), fingerprint = text(source.fingerprint, DIGEST, 64);
  if (source.profile !== "tj-mail-1") invalid();
  const shape = exact(source.shape, ["kind", "parts", "attachments"]), files = shape.attachments;
  if (!Array.isArray(files) || files.length > 5 || Object.keys(files).length !== files.length || (shape.kind !== "text" && shape.kind !== "mixed") || (shape.kind === "text") !== (files.length === 0) || shape.parts !== (shape.kind === "text" ? 1 : files.length + 2)) invalid();
  const tail: string[] = []; let total = 0;
  for (let index = 0; index < files.length; index++) {
    const file = exact(files[index], ["name", "mediaType", "digest", "bytes"]);
    const mediaType = text(file.mediaType, /^(application\/pdf|image\/jpeg|image\/png)$/, 15);
    const ext = mediaType === "application/pdf" ? "pdf" : mediaType === "image/jpeg" ? "jpg" : "png";
    const name = text(file.name, /^document-[1-5]\.(pdf|jpg|png)$/, 14);
    if (name !== `document-${index + 1}.${ext}`) invalid();
    const bytes = integer(file.bytes, 1, 5242880); total += bytes;
    tail.push(name, mediaType, text(file.digest, DIGEST, 64), String(bytes));
  }
  if (total > 10485760) invalid();
  return association(context.associationKey, "tj-deletion-registration-v1", [context.ledgerId, context.historyEpoch, context.associationKeyId, epoch, id, messageId, keyId, "tj-mail-1", fingerprint, shape.kind, String(shape.parts), String(files.length), ...tail]);
}
export function copyAssociation(scope: DeletionScope, registration: string, value: VerifiedCopy): string {
  const context = snapshotDeletionScope(scope); text(registration, DIGEST, 64);
  const source = exact(value, ["mailbox", "uidValidity", "uid", "fingerprint"]);
  const mailbox = text(source.mailbox, /^[^\u0000-\u001f\u007f]+$/, 4096);
  for (let i = 0; i < mailbox.length; i++) {
    const unit = mailbox.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = mailbox.charCodeAt(++i); if (!(next >= 0xdc00 && next <= 0xdfff)) invalid();
    } else if (unit >= 0xdc00 && unit <= 0xdfff) invalid();
  }
  const uidValidity = text(source.uidValidity, /^[1-9][0-9]{0,9}$/, 10);
  if (Number(uidValidity) > 4294967295) invalid();
  const uid = integer(source.uid, 1, 4294967295), fingerprint = text(source.fingerprint, DIGEST, 64);
  return association(context.associationKey, "tj-deletion-copy-v1", [registration, mailbox, uidValidity, String(uid), fingerprint]);
}
