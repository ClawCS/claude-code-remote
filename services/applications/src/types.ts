import type { ApplicationInput, JobId, PublicStatus } from "../../../lib/applications-contract";
export type { IntakeErrorCode, IntakeErrorResponse, IntakeAcceptanceResponse } from "../../../lib/applications-contract";
import type { KeyObject } from "node:crypto";
import type { DocumentFormat } from "./reconstruction-types";
export type ApplicationId = string & { readonly __applicationId: unique symbol };
export type StaffId = string & { readonly __staffId: unique symbol };
export type DateOnly = string & { readonly __dateOnly: unique symbol };
export type Digest = string & { readonly __digest: unique symbol };
export type Instant = string & { readonly __instant: unique symbol };
export function applicationId(value: string): ApplicationId {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value)) throw new Error("INVALID_APPLICATION_ID");
  return value as ApplicationId;
}
export function staffId(value: string): StaffId {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(value)) throw new Error("INVALID_STAFF_ID");
  return value as StaffId;
}
export function dateOnly(value: string): DateOnly {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error("INVALID_DATE_ONLY");
  return value as DateOnly;
}
export function digest(value: string): Digest {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error("INVALID_DIGEST");
  return value as Digest;
}
export function utcInstant(value: string): Instant {
  if (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new Error("INVALID_INSTANT");
  return value as Instant;
}
export interface Clock { now(): Date }
export interface DeliveryIdentity { readonly id: ApplicationId; readonly messageId: string; readonly keyId: string; readonly date: Instant }
export interface MimeLimits { readonly maxRawBytes: number; readonly maxParts: number; readonly maxAttachments: number; readonly maxDepth: number; readonly maxFileBytes: number; readonly maxAttachmentBytes: number; readonly maxTextBytes: number }
export interface MailAttachmentIdentity { readonly name: string; readonly mediaType: string; readonly digest: Digest; readonly bytes: number }
export interface MailShape { readonly kind: "text" | "mixed"; readonly parts: number; readonly attachments: readonly MailAttachmentIdentity[] }
export interface MailFingerprint { readonly fingerprint: Digest; readonly headers: Readonly<Record<string, string>>; readonly attachments: readonly MailAttachmentIdentity[]; readonly shape: MailShape }
export interface RegisteredMail { readonly id: ApplicationId; readonly messageId: string; readonly keyId: string; readonly profile: "tj-mail-1"; readonly fingerprint: Digest; readonly shape: MailShape }
export interface MailEnvelope { readonly from: "info@trinkgut-jammers.de"; readonly to: readonly ["info@trinkgut-jammers.de"] }
export interface PreparedMail { readonly identity: DeliveryIdentity; readonly envelope: MailEnvelope; readonly raw: AsyncIterable<Uint8Array>; readonly fingerprint: Digest; readonly registered: RegisteredMail }
// Task7 owns durable adoption/registration before invoking the SMTP boundary.
export interface StoredMailForSend { readonly registered: RegisteredMail; readonly raw: AsyncIterable<Uint8Array> }
export type VerificationKeys = ReadonlyMap<string, KeyObject>;
export type VerificationResult = { kind: "verified" } | { kind: "mismatch" };
export type SendOutcome = { kind: "accepted" } | { kind: "definitely_failed"; retryable: boolean } | { kind: "uncertain" };
export interface SmtpResult { readonly accepted: readonly string[]; readonly rejected: readonly string[]; readonly response: string }
export interface SmtpPort { connect(): Promise<void>; login(): Promise<void>; send(envelope: MailEnvelope, raw: AsyncIterable<Uint8Array>): Promise<SmtpResult>; close(): void }
export type DeliveryState = "queued" | "scanning" | "ready" | "sending" | "smtp_accepted" | "uncertain" | "delivered" | "needs_attention";
export type CaseState = "open" | "reviewing" | "rejected_closed" | "manual_case";
export type SubmissionKind = { readonly kind: "application" } | { readonly kind: "synthetic"; readonly pilotRunId: string };
export interface AdmissionKeys { sessionKey: Digest; ipKey: Digest }
export interface ReservationInput { sessionHash: Digest; idempotencyKey: string; reservedBytes: number; now: Instant; abuse: AdmissionKeys; submission: SubmissionKind }
export interface Reservation { id: string; sessionHash: Digest; idempotencyKey: string; reservedBytes: number; expiresAt: Instant; readonly submission: SubmissionKind }
export interface IntakeReadiness { ready: boolean }
// Worker-owned current evidence, including freshness and deployment qualification.
// A missing provider is unavailable; local fixtures never qualify production.
export interface IntakeReadinessProvider { getIntakeReadiness(): IntakeReadiness }
export interface IntakeWorkerPort {
  reserve(input: ReservationInput): Promise<Reservation>;
  commitIntake(input: IntakeCommit): Promise<Acceptance>;
  getPublicStatus(proofHash: Digest, now: Instant): Promise<PublicStatus | null>;
  abortIntake(reservationId: string, sessionHash: Digest): Promise<void>;
  getIntakeReadiness(): Promise<IntakeReadiness>;
}
export interface IntakeCommit { reservationId: string; digest: Digest; encryptedPayloadPath: string; actualBytes: number; encryptedName: string; job: JobId; now: Instant }
export interface Acceptance { id: ApplicationId; reference: string; statusProof: string; acceptedAt: Instant; replayed: boolean }
export interface CaseRecord {
  id: ApplicationId; reference: string; encryptedName: string; job: JobId; acceptedAt: Instant;
  deliveryState: DeliveryState; caseState: CaseState; version: number;
  encryptedPayloadPath: string | null; payloadBytes: number;
  closedOn: DateOnly | null; deleteAfter: Instant | null; payloadDeleteAfter: Instant;
  contactDeleteAfter: Instant; claimOwner: string | null; claimedAt: Instant | null;
  readonly submission: SubmissionKind;
}
export interface ClaimedCase extends CaseRecord { claimOwner: string; claimedAt: Instant }
export interface DeliveryTransition { state: DeliveryState }
export type ArtifactKind = "bundle" | "mime";
export interface ArtifactRecord { caseId: ApplicationId; kind: ArtifactKind; path: string; bytes: number; plaintextDigest: Digest; ciphertextDigest: Digest; expiresAt: Instant }
export interface RequestIdentity { id: ApplicationId; digest: Digest; acceptedAt: Instant }
export interface ArtifactReservation { caseId: ApplicationId; kind: ArtifactKind; bytes: number; expiresAt: Instant }
export interface ApplicationRepository {
  // Capacity is computed by worker custody, never accepted from RPC metadata.
  reserve(input: ReservationInput, capacity?: "available" | "exhausted"): Reservation;
  pruneAdmissionEvents(now: Instant): number;
  releaseReservation(id: string): void;
  commitIntake(input: IntakeCommit): Acceptance;
  claimNext(owner: string, now: Instant): ClaimedCase | null;
  getPublicStatus(proofHash: Digest, now: Instant): PublicStatus | null;
  withCaseLock<T>(id: ApplicationId, action: (row: Readonly<CaseRecord>) => Promise<T>): Promise<T>;
  transitionDelivery(id: ApplicationId, expectedVersion: number, next: DeliveryTransition): Promise<CaseRecord>;
  getCommittedIntake(id: ApplicationId): CommittedIntake | null;
  listRetainedIntakes(): readonly CommittedIntake[];
  getRequestIdentity(id: ApplicationId): RequestIdentity;
  // Immutable worker-only metadata; synchronous reads acquire no case lock.
  getSubmissionKind(id: ApplicationId): SubmissionKind;
  getArtifact(id: ApplicationId, kind: ArtifactKind): ArtifactRecord | null;
  listRetainedArtifacts(): readonly ArtifactRecord[];
  listArtifactReservations(): readonly ArtifactReservation[];
  isReplayReservation(reservationId:string):boolean;
  adoptArtifact(record: ArtifactRecord, expectedVersion: number): Promise<CaseRecord>;
  retireOriginal(id: ApplicationId, expectedVersion: number): Promise<CaseRecord>;
  close(): void;
}
export interface IncomingTarget { root: string; maxBytes: number; reservationId?: string; sharedGid?: number }
export interface SealedFile { path: string; bytes: number; wireDigest: Digest }
export interface CommittedIntake { id: ApplicationId; encryptedPayloadPath: string; actualBytes: number; digest: Digest; acceptedAt: Instant }
export interface WorkerKeys { privateKey: KeyObject; publicKey: KeyObject; intakeRoot: string; privateRoot: string; runtimeRoot: string; custody: CustodyLedger }
export interface PrivateSnapshot { id: ApplicationId; input: Readonly<ApplicationInput>; files: readonly { name: string; mediaType: string; digest: Digest; bytes: number }[]; digest: Digest; encryptedPayloadPath: string; bytes: number }
export interface ProcessingSnapshot extends Omit<PrivateSnapshot, "files"> { files: readonly { name: string; mediaType: string; digest: Digest; bytes: number; path: string }[] }
export type SnapshotFile = ProcessingSnapshot["files"][number];
export const VALIDATION_FAILURES = ["IDENTITY_MISMATCH", "DIGEST_MISMATCH", "INVALID_FILE", "FILE_LIMIT", "ACTIVE_PDF", "ENCRYPTED_PDF", "UNSUPPORTED_PDF", "PAGE_LIMIT", "IMAGE_LIMIT", "PARSER_TIMEOUT", "PARSER_LIMIT", "PARSER_UNAVAILABLE", "SANDBOX_UNAVAILABLE", "PDF_AMBIGUITY_UNRESOLVED"] as const;
export type ValidationFailure = typeof VALIDATION_FAILURES[number];
export type ParserResult = { kind: "parsed"; format: DocumentFormat } | { kind: "blocked"; reason: ValidationFailure };
export interface ParserPort {
  readonly assurance: "unavailable" | "local-test" | "linux-sandbox";
  parse(file: SnapshotFile): Promise<ParserResult>;
}
export type ValidatedFile = { kind: "valid"; file: SnapshotFile; format: "pdf" | "jpeg" | "png" } | { kind: "diagnostic"; file: SnapshotFile; format: "pdf" | "jpeg" | "png"; productionReady: false } | { kind: "blocked"; reason: ValidationFailure };
export type ScanFailure = "NOT_READY" | "BUSY" | "TIMEOUT" | "STALE_SIGNATURES" | "INCOMPLETE_SCAN" | "INFECTED" | "SCANNER_ERROR" | "DIGEST_MISMATCH" | "FILE_LIMIT";
export interface ScannerFileResult { kind: "clean" | "infected" | "error"; complete: boolean; digest: Digest; bytes: number; signatureTime: Instant; engineIdentity: string }
export interface ScannerPort {
  readonly assurance: "unavailable" | "local-test" | "qualified-local-engine";
  scan(file: SnapshotFile, signal: AbortSignal): Promise<ScannerFileResult>;
}
export type ScanResult = { kind: "clean"; scannedDigests: Digest[] } | { kind: "blocked"; reason: ScanFailure };
export interface PayloadFile { name: string; mediaType: "application/pdf" | "image/jpeg" | "image/png"; content: string }
export interface IntakePayload { version: 1; input: ApplicationInput; files: PayloadFile[] }
export interface IngressLease { reservationId: string; generation: string; domain: string; path: string; allowance: number }
export type LegacyIngress = Pick<IngressLease,"reservationId"|"path"|"allowance">;
export interface IngressEvidence { lease: IngressLease; state: "prepared" | "bounded" | "quiescent" | "released"; chargedBytes: number; object: { dev: number; ino: number } | null }
// Trusted worker dependency, never an intake RPC or caller-supplied closure flag.
// The default is unavailable; R5 must supply actual no-escape/quota enforcement.
export interface IngressAuthority {
  readonly assurance: "unavailable" | "local-test" | "qualified-os";
  recover(leases: readonly IngressLease[], legacy: readonly LegacyIngress[]): Promise<readonly IngressLease[]>;
  prepare(reservationId: string, path: string, allowance: number): Promise<IngressLease>;
  grant(lease: IngressLease): Promise<IngressEvidence>;
  observe(lease: IngressLease): Promise<IngressEvidence>;
  quiesce(lease: IngressLease): Promise<IngressEvidence>;
  released(lease: IngressLease): Promise<IngressEvidence>;
}
export interface CustodyConfig { intakeRoot: string; custodyRoot: string; runtimeRoot: string; intakeUid: number; sharedGid: number; clock: Clock; ingressAuthority?: IngressAuthority }
export interface RpcConfig { socketPath: string; custody: CustodyLedger; sharedGid: number; clock: Clock; readiness?: IntakeReadinessProvider }
export interface CustodyInventory { physicalBytes: number; reservedHeadroom: number; orphans: readonly { path: string; cleanupAfter: Instant }[] }
export interface CustodyLedger {
  reconcile(): Promise<CustodyInventory>;
  getIntakeReadiness(): IntakeReadiness;
  // Private worker gate evaluated inside the custody queue, not a wire parameter.
  reserve(input: ReservationInput, readiness?: IntakeReadinessProvider): Promise<Reservation>;
  commitIntake(input: IntakeCommit): Promise<Acceptance>;
  abortIntake(id: string, sessionHash: Digest): Promise<void>;
  beginProcessing(snapshot: PrivateSnapshot, bytes: number): Promise<string>;
  finishProcessing(path: string): Promise<void>;
  cleanupOrphans(): Promise<CustodyInventory>;
  withScope<T>(id: ApplicationId, action: (directory: string) => Promise<T>): Promise<T>;
  withProcessingAuthority<T>(id: ApplicationId, directory: string, action: () => Promise<T>): Promise<T>;
  publishArtifact(id: ApplicationId, kind: ArtifactKind, bytes: Buffer, metadata: Pick<ArtifactRecord,"plaintextDigest"|"ciphertextDigest"|"expiresAt">, expectedVersion: number): Promise<ArtifactRecord>;
}
