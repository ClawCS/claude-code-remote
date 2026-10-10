import type { ApplicationInput, JobId, PublicStatus } from "../../../lib/applications-contract";
export type { IntakeErrorCode, IntakeErrorResponse, IntakeAcceptanceResponse } from "../../../lib/applications-contract";
import type { KeyObject } from "node:crypto";
import type { DocumentFormat } from "./reconstruction-types";
import type { ArtifactStore } from "./artifact-store";
import type { ReconstructionDependencies } from "./reconstruction";
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
// Worker-only safety-journal V1. These signed bytes authenticate bindings, not
// storage durability, current coverage, or exclusion of another writer.
export type FenceAction = "reject" | "correct-date" | "reopen" | "hold" | "renew-hold" | "release-hold" | "manual-case";
export type CopyResultPayload = readonly [ApplicationId, string, "deleted" | "not-found", null]
  | readonly [ApplicationId, string, "mismatch", "INVALID_IDENTITY" | "CONTENT_MISMATCH" | "UIDVALIDITY_CHANGED" | "IDENTITY_CHANGED"]
  | readonly [ApplicationId, string, "blocked", "DEPENDENCY_UNAVAILABLE" | "CONNECTION_FAILED" | "OPERATION_TIMEOUT" | "PROTOCOL_LIMIT" | "FOLDER_UNAVAILABLE" | "CANDIDATE_LIMIT" | "INCOMPLETE_CONTENT" | "UNSAFE_DELETE_CAPABILITY" | "WRITE_UNAVAILABLE"]
  | readonly [ApplicationId, string, "uncertain", "DELETE_UNCERTAIN"];
export type MailboxJournalEvent = readonly ["tj-journal-event-v1", string, string, "attempt_intent", readonly [ApplicationId, string, "initial" | "fence", string, string, string, string, string]]
  | readonly ["tj-journal-event-v1", string, string, "copy_mutation_started", readonly [ApplicationId, string, "1" | "2" | "3", string]]
  | readonly ["tj-journal-event-v1", string, string, "copy_result", CopyResultPayload]
  | readonly ["tj-journal-event-v1", string, string, "mailbox_clear_observed", readonly [ApplicationId, string, "1" | "2" | "3", string, string, "listed-selectable-v1"]];
export type TechnicalEraseScope = "processing_payload" | "processing_contact" | "incident_identity" | "public_token";
export type EraseScope = TechnicalEraseScope | "identifying_register";
export type EraseJournalEvent = readonly ["tj-journal-event-v1", string, string, "erase_commit", readonly [ApplicationId, TechnicalEraseScope, string, string]]
  | readonly ["tj-journal-event-v1", string, string, "erase_commit", readonly [ApplicationId, "identifying_register", string, string, "initial" | "fence", string, string, string, string]]
  | readonly ["tj-journal-event-v1", string, string, "erase_done", readonly [ApplicationId, string]];
export interface CurrentExternalAttestation {
  readonly sequence: number;
  readonly version: number;
  readonly actor: StaffId;
  readonly at: Instant;
  readonly reason: string;
}
export interface CurrentMailboxClear {
  readonly caseId: ApplicationId;
  readonly caseVersion: number;
  readonly safetyRevision: number;
  readonly head: JournalCheckpoint;
  readonly clearEvent: Extract<MailboxJournalEvent, readonly [string, string, string, "mailbox_clear_observed", unknown]>;
  readonly clearReceipt: DurableReceipt;
  readonly intentEvent: Extract<MailboxJournalEvent, readonly [string, string, string, "attempt_intent", unknown]>;
  readonly intentReceipt: DurableReceipt;
}
export interface FinalErasureEvidence {
  readonly caseId: ApplicationId; readonly caseVersion: number; readonly safetyRevision: number;
  readonly clear: CurrentMailboxClear; readonly attestation: CurrentExternalAttestation; readonly externalAttestationAssociation: string;
}
export interface ErasureWork {
  readonly commitEventId: string; readonly caseId: ApplicationId; readonly scope: EraseScope;
  readonly ledgerId: string; readonly historyEpoch: string; readonly associationKeyId: string; readonly replayAssociation: string;
  readonly sequence: string; readonly entryHash: string; readonly stage: "rows-pending" | "database-maintenance-pending" | "locally-complete";
}
export type ErasureRowPhase = "scope-contact" | "scope-proofs" | "payload-artifacts" | "payload-reservations" | "payload-case" | "payload-send"
  | "identity-grants" | "identity-lifecycle-audit" | "identity-lifecycle-proposals" | "identity-audit" | "identity-searches"
  | "identity-diagnostics" | "identity-mail-events" | "identity-mail-state" | "identity-delivery-attempts" | "identity-delivery"
  | "identity-lifecycle" | "identity-replay-reservations" | "identity-case-reservation";
export type ErasureRowKey = string | number | readonly [string, string | number];
export type ErasureRowCursor = readonly [string, ErasureRowPhase, ErasureRowKey | null];
export interface ErasureRowTarget { readonly phase: ErasureRowPhase; readonly key: ErasureRowKey }
export interface ErasureRowPage { readonly targets: readonly ErasureRowTarget[]; readonly next: ErasureRowCursor | null; readonly consumedItems: number }
export interface ErasureWorkPage { readonly items: readonly ErasureWork[]; readonly hasMore: boolean; readonly consumedItems: number }
export type JournalEvent = readonly ["tj-journal-event-v1", string, string, "case_fence", readonly [ApplicationId, "initial" | "fence", string, string, FenceAction]]
  | readonly ["tj-journal-event-v1", string, string, "barrier", readonly [string, string, "startup" | "restore" | "refresh"]]
  | MailboxJournalEvent | EraseJournalEvent;
export type Tombstone = JournalEvent;
export type SignedEntry = string & { readonly __signedJournalEntry: unique symbol };
export type SignedHead = string & { readonly __signedJournalHead: unique symbol };
export type LedgerCursor = string & { readonly __journalCursor: unique symbol };
export type CommittedTombstone = SignedEntry;
export interface DurableReceipt { readonly entry: SignedEntry; readonly head: SignedHead }
export interface DeletionLedgerPort {
  append(event: Tombstone): Promise<DurableReceipt>;
  readSince(cursor: LedgerCursor): AsyncIterable<CommittedTombstone>;
}
export interface LedgerAnchor { readonly cursor: LedgerCursor; readonly receipt: DurableReceipt | null }
export interface LedgerTrustContext {
  readonly ledgerId: string; readonly historyEpoch: string; readonly writerEpoch: string;
  readonly keyId: string; readonly publicKey: KeyObject; readonly genesisHash: string;
  readonly operationalStart: string; readonly operationalEnd: string;
  // Independently selected retained coverage anchor, never supplied by HTTP or
  // inferred from a restored database's signed records. Task14 qualifies it.
  readonly anchor: LedgerAnchor;
}
export interface LedgerTrustPort { currentContext(): LedgerTrustContext | null }
export interface JournalClock { wallNow(): Date; monotonicNow(): number }
export interface JournalCheckpoint { readonly sequence: string; readonly hash: string; readonly observedAt: string | null; readonly cursor: LedgerCursor }
export interface VerifiedJournalEntry extends JournalCheckpoint { readonly event: JournalEvent; readonly wire: SignedEntry }
export interface JournalFenceFact { readonly eventId: string; readonly sequence: string; readonly entryHash: string }
export interface JournalCaseAuthority { readonly head: JournalCheckpoint; readonly latestFence: JournalFenceFact | null }
export interface JournalSafetyProjection {
  beginProjection(anchor: LedgerAnchor): void;
  applyVerifiedEntry(previous: JournalCheckpoint, entry: VerifiedJournalEntry): void;
  readCaseAuthority(caseId: ApplicationId, expectedAppliedHead: JournalCheckpoint): JournalFenceFact | null;
}
export type JournalProgress = { readonly kind: "observed"; readonly checkpoint: JournalCheckpoint; readonly receipt: DurableReceipt }
  | { readonly kind: "continuation"; readonly checkpoint: JournalCheckpoint; readonly next: "continue-replay" | "refresh" };
export interface SafetyJournal {
  append(event: JournalEvent): Promise<DurableReceipt>;
  refresh(purpose: "startup" | "restore" | "refresh"): Promise<JournalProgress>;
  continueReplay(): Promise<JournalProgress>;
  recover(event?: JournalEvent): Promise<JournalProgress>;
  observation(): JournalCheckpoint | null;
  caseAuthority(caseId: ApplicationId): JournalCaseAuthority | null;
  settle(): Promise<void>;
}
// Worker-only authority. This port must be independently qualified before use;
// a stored epoch or a local configuration flag is not restore assurance.
export interface AuthTrustPort { currentEpoch(): Digest | null }
export interface AuthDependencies {
  readonly keys: { readonly privateKey: KeyObject; readonly publicKey: KeyObject };
  readonly rateKey: Buffer;
  readonly trust: AuthTrustPort;
  readonly initialEnrollmentEpoch?: () => Digest | null;
}
export interface LoginInput { readonly username: string; readonly password: string; readonly otp: string; readonly trustedIp: string }
export interface StaffSession { readonly sessionId: Digest; readonly staffId: StaffId; readonly generation: number; readonly issuedAt: Instant; readonly expiresAt: Instant }
export type LoginResult = { readonly kind: "denied" } | { readonly kind: "authenticated"; readonly token: string; readonly csrf: string; readonly session: StaffSession };
export interface ReauthProof { readonly password: string; readonly otp: string; readonly trustedIp: string }
export interface SensitiveAction { readonly kind: "review" | "reject" | "reopen" | "correct-date" | "hold" | "release-hold" | "manual-case" | "confirm-external-copies"; readonly caseId: ApplicationId; readonly version: number }
export interface ActionGrant { readonly nonce: string; readonly staffId: StaffId; readonly action: SensitiveAction; readonly issuedAt: Instant; readonly expiresAt: Instant }
export type ManualCategory = "hired" | "withdrawn" | "data-subject-request" | "other";
export type CaseAction = { readonly kind: "review" } | { readonly kind: "reject"; readonly closedOn: DateOnly }
  | { readonly kind: "correct-date"; readonly closedOn: DateOnly; readonly reason: string }
  | { readonly kind: "reopen" | "release-hold"; readonly reason: string }
  | { readonly kind: "hold"; readonly reviewOn: DateOnly; readonly reason: string }
  | { readonly kind: "manual-case"; readonly category: ManualCategory; readonly reason: string }
  | { readonly kind: "confirm-external-copies"; readonly confirmed: boolean; readonly reason: string };
export interface CaseLifecycle {
  readonly identityState: "identifying" | "minimized";
  readonly initialAuthority: string | null;
  readonly authorityKind: "initial" | "fence" | null; readonly authorityId: string | null;
  readonly safetyRevision: number; readonly pendingEventId: string | null;
  readonly deadline: DateOnly | null; readonly deleteFrom: DateOnly | null;
  readonly hold: { readonly reviewOn: DateOnly; readonly reason: string; readonly actor: StaffId; readonly at: Instant } | null;
  readonly manualCategory: ManualCategory | null;
  readonly externalCopiesConfirmed: boolean; readonly externalCopiesAt: Instant | null;
  readonly externalCopiesActor: StaffId | null; readonly externalCopiesReason: string | null;
}
export type Eligibility = "not_due" | "held" | "blocked" | "eligible";
export interface LifecycleDependencies { readonly repository: ApplicationRepository; readonly session: StaffSession; readonly recoveryEventId?: string }
export interface LifecycleRecoveryPage { readonly cases: readonly { readonly id: ApplicationId; readonly eventId: string; readonly phase: "proposed" | "acknowledged"; readonly outcome: "acknowledged" | "blocked" | "continuation" }[]; readonly continuation: ApplicationId | null }
// Worker-local maintenance material, deliberately absent from the shared public
// applications contract. Only the CLI may display provisioning/recovery values.
export interface FactorStage { readonly handle: string; readonly provisioningUri: string }
export interface FactorResult { readonly recoveryCodes: readonly string[] }
export type ReplacementProof = { readonly password: string; readonly trustedIp: string } & ({ readonly otp: string } | { readonly recoveryCode: string });
export interface ApplicationAuth {
  authenticate(input: LoginInput): Promise<LoginResult>;
  authorizeSession(token: string, now: Instant): StaffSession | null;
  authorizeSensitiveAction(session: StaffSession, proof: ReauthProof, action: SensitiveAction): Promise<ActionGrant>;
  logout(token: string): void;
  authorizeMutation(token: string, csrf: string, origin: string | undefined, configuredOrigin: string): StaffSession | null;
  beginEnrollment(password: string, confirmation: string): Promise<FactorStage>;
  finishEnrollment(handle: string, otp: string): FactorResult;
  beginReplacement(proof: ReplacementProof): Promise<FactorStage>;
  finishReplacement(handle: string, otp: string): FactorResult;
}
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
export interface MailboxRunBudget { readonly __mailboxRunBudget: unique symbol }
export interface ImapConfig { readonly user: string; readonly pass: string; readonly keys: VerificationKeys; readonly budget: MailboxRunBudget }
export interface VerifiedCopy { readonly mailbox: string; readonly uidValidity: string; readonly uid: number; readonly fingerprint: Digest }
export type MailboxIssue = "INVALID_IDENTITY" | "DEPENDENCY_UNAVAILABLE" | "CONNECTION_FAILED" | "OPERATION_TIMEOUT" | "PROTOCOL_LIMIT" | "LIST_LIMIT" | "FOLDER_UNAVAILABLE" | "CANDIDATE_LIMIT" | "INCOMPLETE_CONTENT" | "CONTENT_MISMATCH" | "UIDVALIDITY_CHANGED" | "UNSAFE_DELETE_CAPABILITY" | "WRITE_UNAVAILABLE" | "IDENTITY_CHANGED" | "DELETE_UNCERTAIN";
export interface MailboxSearch { copies: VerifiedCopy[]; complete: boolean; issues: MailboxIssue[] }
export type DeleteResult = { kind: "deleted" } | { kind: "not-found" } | { kind: "mismatch"; issue: MailboxIssue } | { kind: "blocked"; issue: MailboxIssue } | { kind: "uncertain"; issue: MailboxIssue };
export interface MailboxPort { findVerified(mail: RegisteredMail): Promise<MailboxSearch>; deleteVerified(copy: VerifiedCopy, mail: RegisteredMail): Promise<DeleteResult>; disconnect(): Promise<void>; settle(): Promise<void> }
export type DeliveryState = "queued" | "scanning" | "ready" | "sending" | "smtp_accepted" | "uncertain" | "delivered" | "needs_attention";
export type CaseState = "open" | "reviewing" | "rejected_closed" | "manual_case";
export type SubmissionKind = { readonly kind: "application" } | { readonly kind: "synthetic"; readonly pilotRunId: string };
// Worker-private, independently configured authorization, never intake DTOs.
export type AdmissionScope = readonly [string, "application", null, string, string | null]
  | readonly [string, "synthetic", string, string, string | null];
export interface AdmissionScopePort { currentScope(): AdmissionScope | null }
export interface DeletionScope {
  readonly ledgerId: string; readonly historyEpoch: string;
  readonly associationKeyId: string; readonly associationKey: Buffer;
  readonly approvedScopes: readonly AdmissionScope[];
}
export interface DeletionScopePort { currentScope(): DeletionScope | null }
export type DeletionReason = "DEFERRED" | "AUTHORITY_UNAVAILABLE" | "CONTEXT_CHANGED" | "INVALID_EVIDENCE" | "JOURNAL_UNAVAILABLE" | "STORAGE_FAILED" | "ORCHESTRATION_FAILED" | MailboxIssue;
export interface DeletionCaseResult { readonly id: ApplicationId; readonly status: "not_due" | "held" | "mailbox_cleared" | "partial" | "blocked"; readonly reason: DeletionReason | null; readonly externalCopiesConfirmed: boolean }
export interface DeletionReport { readonly runId: string; readonly ownership: "settled" | "retained"; readonly stopReason: "finished" | "deadline" | "blocked"; readonly hasMore: boolean; readonly cases: readonly DeletionCaseResult[] }
export interface DeletionDependencies {
  readonly repository: ApplicationRepository; readonly clock: JournalClock;
  readonly scope?: DeletionScopePort; readonly verificationKeys: () => VerificationKeys;
  readonly createMailbox: (budget: MailboxRunBudget) => MailboxPort;
}
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
  closedOn: DateOnly | null; readonly lifecycle: CaseLifecycle; payloadDeleteAfter: Instant;
  contactDeleteAfter: Instant; claimOwner: string | null; claimedAt: Instant | null;
  claimToken: string | null; claimKind: DeliveryWorkKind | null;
  readonly submission: SubmissionKind;
  readonly acceptanceEpochId: string | null;
}
export interface ClaimedCase extends CaseRecord { claimOwner: string; claimedAt: Instant; claimToken: string; claimKind: DeliveryWorkKind }
export interface DeliveryTransition { state: DeliveryState }
export type DeliveryWorkKind = "prepare" | "send" | "reconcile";
export interface DeliveryClaimAuthority { id: ApplicationId; version: number; token: string }
export type DeliveryFailureReason = "INVALID_INPUT" | "MALICIOUS_INPUT" | "CONTACT_UNAVAILABLE" | "ARTIFACT_UNAVAILABLE" | "VERIFICATION_FAILED" | "DEPENDENCY_UNAVAILABLE" | "PERMANENT_SEND_FAILURE" | "ATTEMPTS_EXHAUSTED" | "RECEIPT_UNRESOLVED" | "LEGACY_UNVERIFIED" | "PROCESSING_EXPIRED" | "MANUAL_REQUIRED";
export type DeliveryFailure = { category: "invalid"; reason: "INVALID_INPUT" | "MALICIOUS_INPUT" } | { category: "operational"; reason: Exclude<DeliveryFailureReason, "INVALID_INPUT" | "MALICIOUS_INPUT"> };
export interface DeliveryAttempt { ordinal: number; startedAt: Instant; finishedAt: Instant | null; outcome: SendOutcome | null; mimeDigest: Digest; fingerprint: Digest }
export interface DeliveryRecord {
  readonly payloadErased?: true;
  readonly id: ApplicationId; readonly identity: DeliveryIdentity | null; readonly registered: RegisteredMail | null;
  readonly mimeDigest: Digest | null; readonly sendDueAt: Instant | null; readonly receiptStartedAt: Instant | null;
  readonly receiptSchedule: readonly Instant[]; readonly receiptCursor: number; readonly mailboxChecks: number;
  readonly confirmedAt: Instant | null; readonly copies: readonly VerifiedCopy[]; readonly attempts: readonly DeliveryAttempt[];
  readonly category: "invalid" | "operational" | null; readonly reason: DeliveryFailureReason | null; readonly determinedAt: Instant | null;
  readonly incidentAt: Instant; readonly manualRequiredAt: Instant; readonly cleanupDueAt: Instant | null;
  readonly contactEnvelope: string | null;
}
export interface DeliverySnapshot { readonly case: CaseRecord; readonly delivery: DeliveryRecord }
export type FindOnlyMailbox = Pick<MailboxPort, "findVerified" | "disconnect">;
export interface DispatchDependencies {
  readonly repository: ApplicationRepository;
  readonly clock: Clock;
  readonly owner: string;
  readonly keys: WorkerKeys;
  readonly custody: CustodyLedger;
  readonly artifacts: ArtifactStore;
  readonly reconstruction: ReconstructionDependencies;
  readonly signingKeyId: string;
  readonly signingKeys: ReadonlyMap<string, KeyObject>;
  readonly verificationKeys: VerificationKeys;
  readonly createSmtp: () => SmtpPort;
  readonly createMailbox: (budget: MailboxRunBudget) => FindOnlyMailbox;
}
export type DispatchResult = { readonly kind: "idle" } | {
  readonly kind: "processed";
  readonly id: ApplicationId;
  readonly work: DeliveryWorkKind;
  readonly state: DeliveryState;
  readonly reason: DeliveryFailureReason | null;
  readonly incidentDue: boolean;
  readonly manualRequired: boolean;
  readonly nextDueAt: Instant | null;
};
export interface DeliveryClaim extends DeliverySnapshot { readonly case: ClaimedCase }
export interface WorkerScheduleEntry {
  readonly id: ApplicationId; readonly reference: string; readonly state: DeliveryState;
  readonly busy: boolean; readonly dispatchDueAt: Instant | null;
  readonly incidentAt: Instant; readonly manualRequiredAt: Instant;
}
export interface WorkerProof { readonly checkedAt: Instant; readonly validUntil: Instant }
export interface WorkerRestoreProof extends WorkerProof { readonly checkpointId: string; readonly ledgerVerified: true }
export interface WorkerOwner { readonly repository: ApplicationRepository; readonly custody: CustodyLedger; readonly clock: Clock }
export interface RuntimeMaintenanceExclusion { readonly [key: symbol]: never }
export interface WorkerServices {
  settle(): Promise<void>;
  close(): Promise<void>;
  // Actual continuous same-domain exclusion, including previous processes.
  // Absent methods remain source-compatible, but cannot qualify maintenance.
  holdMaintenance?(owner: WorkerOwner): Promise<RuntimeMaintenanceExclusion>;
  assertMaintenanceHeld?(owner: WorkerOwner, hold: RuntimeMaintenanceExclusion): void;
  releaseMaintenance?(owner: WorkerOwner, hold: RuntimeMaintenanceExclusion): Promise<void>;
}
export type WorkerAssurance = "unavailable" | "local-test" | "qualified";
export interface WorkerLifecycleOptions {
  // Trusted platform wiring acquires the exclusive repository and its sole ledger.
  // Called once, only from start(). No second retention/maintenance DB owner.
  readonly acquire: () => WorkerOwner;
  readonly dispatch?: (owner: WorkerOwner) => DispatchDependencies;
  readonly restore?: { readonly assurance: WorkerAssurance; verify(owner: WorkerOwner): Promise<WorkerRestoreProof | null>; current(owner: WorkerOwner): WorkerRestoreProof | null };
  readonly retention?: { readonly assurance: WorkerAssurance; sweep(owner: WorkerOwner): Promise<WorkerProof | null> };
  // Runtime proof includes actual previous-process scanner/raster holder recovery;
  // scanner proof includes current signatures/engine, not just daemon liveness.
  readonly readiness?: { readonly assurance: WorkerAssurance; current(owner: WorkerOwner): { runtime: WorkerProof | null; scanner: WorkerProof | null; mail: WorkerProof | null; retention: WorkerProof | null } };
  readonly rpc?: { readonly socketPath: string; readonly sharedGid: number };
  // Task14-owned services must resolve only after their real scopes have settled.
  readonly services?: WorkerServices;
  readonly onEvent?: (event: { readonly reference: string; readonly code: "WORKER_UNAVAILABLE" | "DRAIN_INCOMPLETE" | "DELIVERY_INCIDENT" | "MANUAL_REQUIRED" }) => void;
}
export type WorkerLifecycleState = "new" | "starting" | "unavailable" | "running" | "draining" | "stopped";
export interface ApplicationWorker extends IntakeReadinessProvider {
  start(): Promise<{ state: WorkerLifecycleState }>;
  runOnce(): Promise<{ dispatched: boolean; nextWakeAt: Instant | null }>;
  drain(options: { graceMs: number }): Promise<{ state: "draining" | "stopped"; complete: boolean }>;
  getState(): WorkerLifecycleState;
}
export interface DeliveryRepository {
  listWorkerSchedule(now: Instant): readonly WorkerScheduleEntry[];
  getDelivery(id: ApplicationId): DeliveryRecord;
  claimDispatchWork(owner: string, now: Instant, kind?: DeliveryWorkKind): DeliveryClaim | null;
  stageDeliveryIdentity(claim: DeliveryClaimAuthority, keyId: string, now: Instant): Promise<DeliverySnapshot>;
  stageRegisteredMail(claim: DeliveryClaimAuthority, mail: RegisteredMail, now: Instant): Promise<DeliverySnapshot>;
  // Caller must obtain verification from authenticated withMime bytes. These commands
  // validate its DTO/registration authority; they do not perform network/MIME verification.
  bindVerifiedMime(claim: DeliveryClaimAuthority, artifact: ArtifactRecord, verification: VerificationResult, now: Instant): Promise<DeliverySnapshot>;
  beginSendAttempt(claim: DeliveryClaimAuthority, artifact: ArtifactRecord, verification: VerificationResult, now: Instant): Promise<DeliverySnapshot>;
  finishSendAttempt(claim: DeliveryClaimAuthority, outcome: SendOutcome, now: Instant): Promise<DeliverySnapshot>;
  recordMailboxCheck(claim: DeliveryClaimAuthority, mail: RegisteredMail, result: MailboxSearch, now: Instant): Promise<DeliverySnapshot>;
  storeContact(claim: DeliveryClaimAuthority, envelope: string, privateKey: KeyObject, now: Instant): Promise<DeliverySnapshot>;
  recordDeliveryFailure(claim: DeliveryClaimAuthority, failure: DeliveryFailure, now: Instant): Promise<DeliverySnapshot>;
  releaseDeliveryClaim(claim: DeliveryClaimAuthority, now: Instant): Promise<DeliverySnapshot>;
}
export type ArtifactKind = "bundle" | "mime";
export interface ArtifactRecord { caseId: ApplicationId; kind: ArtifactKind; path: string; bytes: number; plaintextDigest: Digest; ciphertextDigest: Digest; expiresAt: Instant }
export interface RequestIdentity { id: ApplicationId; digest: Digest; acceptedAt: Instant }
export interface ArtifactReservation { caseId: ApplicationId; kind: ArtifactKind; bytes: number; expiresAt: Instant }
export interface ApplicationRepository extends DeliveryRepository {
  createAuthentication(deps: AuthDependencies): ApplicationAuth;
  getLifecycleCase(id: ApplicationId, session: StaffSession): CaseRecord;
  applyCaseAction(id: ApplicationId, action: CaseAction, grant: ActionGrant, session: StaffSession, recoveryEventId?: string): Promise<CaseRecord>;
  recoverLifecyclePending(after?: ApplicationId): Promise<LifecycleRecoveryPage>;
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
  // Requests irreversible revocation of this generation's grant/reopen rights.
  // Quiescent means every holder has actually terminated/reaped, including any
  // transferred descriptors. A timer, absent pathname or socket close is not proof.
  quiesce(lease: IngressLease): Promise<IngressEvidence>;
  released(lease: IngressLease): Promise<IngressEvidence>;
}
export interface CustodyConfig { intakeRoot: string; custodyRoot: string; runtimeRoot: string; intakeUid: number; sharedGid: number; clock: Clock; ingressAuthority?: IngressAuthority }
export interface RpcConfig { socketPath: string; custody: CustodyLedger; sharedGid: number; clock: Clock; readiness?: IntakeReadinessProvider }
export interface CustodyInventory { physicalBytes: number; reservedHeadroom: number; orphans: readonly { path: string; cleanupAfter: Instant }[] }
export interface IngressSettlement { complete: boolean; pending: number; inventory: CustodyInventory }
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
  // Worker-only; serialized with custody changes, never acquires a case lock.
  settleIngress(request: { kind: "expired" | "drain" }): Promise<IngressSettlement>;
  withScope<T>(id: ApplicationId, action: (directory: string) => Promise<T>): Promise<T>;
  withProcessingAuthority<T>(id: ApplicationId, directory: string, action: () => Promise<T>): Promise<T>;
  publishArtifact(id: ApplicationId, kind: ArtifactKind, bytes: Buffer, metadata: Pick<ArtifactRecord,"plaintextDigest"|"ciphertextDigest"|"expiresAt">, expectedVersion: number): Promise<ArtifactRecord>;
}
