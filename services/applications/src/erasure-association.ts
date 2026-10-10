import { createHmac } from "node:crypto";
import { snapshotDeletionScope } from "./deletion-association";
import { operatorReason } from "./lifecycle";
import { applicationId, digest, staffId, utcInstant, type ApplicationId, type CurrentExternalAttestation, type DeletionScope, type Digest } from "./types";

function invalid(): never { throw new Error("ERASURE_ASSOCIATION_INVALID"); }
function association(scope: DeletionScope, domain: string, fields: readonly string[], ceiling: number): string {
  const preimage = Buffer.from(domain + "\n" + JSON.stringify(fields), "utf8");
  if (preimage.length > ceiling) invalid();
  return createHmac("sha256", scope.associationKey).update(preimage).digest("hex");
}
// Pure bindings only. Current owner evidence and eligibility are separate.
export function replayAssociation(scope: DeletionScope, sessionHash: Digest, idempotencyKey: string): string {
  try {
    const current = snapshotDeletionScope(scope); digest(sessionHash);
    if (typeof idempotencyKey !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(idempotencyKey)) invalid();
    return association(current, "tj-erasure-replay-v1", [current.ledgerId, current.historyEpoch, current.associationKeyId, sessionHash, idempotencyKey], 1024);
  } catch { return invalid(); }
}
export function externalAttestationAssociation(scope: DeletionScope, caseId: ApplicationId, audit: CurrentExternalAttestation): string {
  try {
    const current = snapshotDeletionScope(scope); applicationId(caseId);
    const keys = ["sequence", "version", "actor", "at", "reason"];
    if (!audit || typeof audit !== "object" || Array.isArray(audit) || Reflect.ownKeys(audit).length !== keys.length || keys.some(key => !Object.hasOwn(audit, key)) || Object.values(Object.getOwnPropertyDescriptors(audit)).some(value => !Object.hasOwn(value, "value"))) invalid();
    if (!Number.isSafeInteger(audit.sequence) || audit.sequence < 1 || !Number.isSafeInteger(audit.version) || audit.version < 1) invalid();
    staffId(audit.actor); utcInstant(audit.at); operatorReason(audit.reason);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(audit.at)) invalid();
    return association(current, "tj-erasure-external-attestation-v1", [current.ledgerId, current.historyEpoch, current.associationKeyId, caseId, String(audit.sequence), String(audit.version), audit.actor, audit.at, "confirmed", audit.reason], 8192);
  } catch { return invalid(); }
}
