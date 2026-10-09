import type { ApplicationInput, JobId, PublicStatus } from "../../../lib/applications-contract";
import type { KeyObject } from "node:crypto";
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
export type DeliveryState = "queued" | "scanning" | "ready" | "sending" | "smtp_accepted" | "uncertain" | "delivered" | "needs_attention";
export type CaseState = "open" | "reviewing" | "rejected_closed" | "manual_case";
export interface ReservationInput { sessionHash: Digest; idempotencyKey: string; reservedBytes: number; now: Instant }
export interface Reservation { id: string; sessionHash: Digest; idempotencyKey: string; reservedBytes: number; expiresAt: Instant }
export interface IntakeCommit { reservationId: string; digest: Digest; encryptedPayloadPath: string; actualBytes: number; encryptedName: string; job: JobId; now: Instant }
export interface Acceptance { id: ApplicationId; reference: string; statusProof: string; acceptedAt: Instant; replayed: boolean }
export interface CaseRecord {
  id: ApplicationId; reference: string; encryptedName: string; job: JobId; acceptedAt: Instant;
  deliveryState: DeliveryState; caseState: CaseState; version: number;
  encryptedPayloadPath: string | null; payloadBytes: number;
  closedOn: DateOnly | null; deleteAfter: Instant | null; payloadDeleteAfter: Instant;
  contactDeleteAfter: Instant; claimOwner: string | null; claimedAt: Instant | null;
}
export interface ClaimedCase extends CaseRecord { claimOwner: string; claimedAt: Instant }
export interface DeliveryTransition { state: DeliveryState }
export interface ApplicationRepository {
  reserve(input: ReservationInput): Reservation;
  releaseReservation(id: string): void;
  commitIntake(input: IntakeCommit): Acceptance;
  claimNext(owner: string, now: Instant): ClaimedCase | null;
  getPublicStatus(proofHash: Digest, now: Instant): PublicStatus | null;
  withCaseLock<T>(id: ApplicationId, action: (row: Readonly<CaseRecord>) => Promise<T>): Promise<T>;
  transitionDelivery(id: ApplicationId, expectedVersion: number, next: DeliveryTransition): Promise<CaseRecord>;
  getCommittedIntake(id: ApplicationId): CommittedIntake | null;
  listRetainedIntakes(): readonly CommittedIntake[];
  close(): void;
}
export interface IncomingTarget { root: string; maxBytes: number; reservationId?: string; sharedGid?: number }
export interface SealedFile { path: string; bytes: number; wireDigest: Digest }
export interface CommittedIntake { id: ApplicationId; encryptedPayloadPath: string; actualBytes: number; digest: Digest; acceptedAt: Instant }
export interface WorkerKeys { privateKey: KeyObject; publicKey: KeyObject; intakeRoot: string; privateRoot: string; runtimeRoot: string; custody: CustodyLedger }
export interface PrivateSnapshot { id: ApplicationId; input: Readonly<ApplicationInput>; files: readonly { name: string; mediaType: string; digest: Digest; bytes: number }[]; digest: Digest; encryptedPayloadPath: string; bytes: number }
export interface ProcessingSnapshot extends Omit<PrivateSnapshot, "files"> { files: readonly { name: string; mediaType: string; digest: Digest; bytes: number; path: string }[] }
export type SnapshotFile = ProcessingSnapshot["files"][number];
export type ValidationFailure = "IDENTITY_MISMATCH" | "DIGEST_MISMATCH" | "INVALID_FILE" | "FILE_LIMIT" | "ACTIVE_PDF" | "ENCRYPTED_PDF" | "UNSUPPORTED_PDF" | "PAGE_LIMIT" | "IMAGE_LIMIT" | "PARSER_TIMEOUT" | "PARSER_LIMIT" | "PARSER_UNAVAILABLE" | "SANDBOX_UNAVAILABLE";
export type ParserResult = { kind: "parsed"; format: "pdf" | "jpeg" | "png" } | { kind: "blocked"; reason: ValidationFailure };
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
export interface CustodyConfig { intakeRoot: string; custodyRoot: string; runtimeRoot: string; intakeUid: number; sharedGid: number; clock: Clock }
export interface RpcConfig { socketPath: string; custody: CustodyLedger; sharedGid: number; clock: Clock }
export interface CustodyInventory { physicalBytes: number; reservedHeadroom: number; orphans: readonly { path: string; cleanupAfter: Instant }[] }
export interface CustodyLedger {
  reconcile(): Promise<CustodyInventory>;
  reserve(input: ReservationInput): Promise<Reservation>;
  commitIntake(input: IntakeCommit): Promise<Acceptance>;
  abortIntake(id: string, sessionHash: Digest): Promise<void>;
  beginProcessing(snapshot: PrivateSnapshot, bytes: number): Promise<string>;
  finishProcessing(path: string): Promise<void>;
  cleanupOrphans(): Promise<CustodyInventory>;
}
