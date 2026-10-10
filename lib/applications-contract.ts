export type ApplicationMode = "disabled" | "pilot" | "enabled";
export type JobId = "sales-fulltime" | "sales-parttime";
export interface JobOption { id: JobId; label: string }
export interface PublicApplicationConfig {
  enabled: boolean;
  mode: ApplicationMode;
  limits: { maxFiles: 5; maxFileBytes: 5242880; maxTotalBytes: 10485760 };
  jobs: JobOption[];
}
export type PublicState = "processing" | "delivered" | "needs_attention";
export interface PublicStatus { reference: string; state: PublicState; acceptedAt: string }
export interface ApplicationInput { name: string; email: string; job: JobId; phone?: string; message?: string }
export type IntakeErrorCode = "INVALID_REQUEST" | "FORBIDDEN" | "PAYLOAD_TOO_LARGE" | "RATE_LIMITED" | "CAPACITY_EXCEEDED" | "UPLOAD_IN_PROGRESS" | "IDEMPOTENCY_CONFLICT" | "WORKER_UNAVAILABLE";
export interface IntakeErrorResponse { error: string; code: IntakeErrorCode; retryAfterSeconds?: number }
export interface IntakeAcceptanceResponse { reference: string; state: "processing"; statusToken: string }
export interface IntakeSessionResponse { formToken: string }

export type DeliveryFailureReason = "INVALID_INPUT" | "MALICIOUS_INPUT" | "CONTACT_UNAVAILABLE" | "ARTIFACT_UNAVAILABLE" | "VERIFICATION_FAILED" | "DEPENDENCY_UNAVAILABLE" | "PERMANENT_SEND_FAILURE" | "ATTEMPTS_EXHAUSTED" | "RECEIPT_UNRESOLVED" | "LEGACY_UNVERIFIED" | "PROCESSING_EXPIRED" | "MANUAL_REQUIRED";
export type AdminCaseActionKind = "review" | "reject" | "correct-date" | "reopen" | "release-hold" | "hold" | "manual-case" | "confirm-external-copies";
export type AdminScopeState = "not_committed" | "commit_pending" | "committed_cleanup_pending" | "local_complete";
export interface AdminCaseSummary {
  readonly id: string; readonly reference: string; readonly name: string; readonly job: JobId;
  readonly acceptedAt: string; readonly version: number;
  readonly caseState: "open" | "reviewing" | "rejected_closed" | "manual_case";
  readonly deliveryState: "queued" | "scanning" | "ready" | "sending" | "smtp_accepted" | "uncertain" | "delivered" | "needs_attention";
  readonly closedOn: string | null; readonly deadline: string | null; readonly deleteFrom: string | null;
  readonly holdReviewOn: string | null; readonly manualCategory: "hired" | "withdrawn" | "data-subject-request" | "other" | null;
  readonly hints: Readonly<{ deletionWarning: boolean; openReminder: boolean; holdReviewDue: boolean }>;
  readonly pendingAction: boolean; readonly identityValidUntil: string | null;
}
export interface AdminCasePage { readonly cases: readonly AdminCaseSummary[]; readonly next: string | null; readonly observedAt: string }
export interface AdminCaseDetail {
  readonly case: AdminCaseSummary; readonly observedAt: string; readonly holdReason: string | null;
  readonly deliveryIssue: Readonly<{ category: "invalid" | "operational"; reason: DeliveryFailureReason; determinedAt: string; incidentAt: string; manualRequiredAt: string }> | null;
  readonly mailbox: Readonly<{ state: "not_observed" | "open" | "partial" | "blocked" | "currently_cleared" }>;
  readonly externalCopies: Readonly<{ confirmed: boolean; at: string | null }>;
  readonly retention: Readonly<{ payload: AdminScopeState; contact: AdminScopeState; publicToken: AdminScopeState; incidentIdentity: AdminScopeState; identifyingRegister: AdminScopeState }>;
  readonly contact: Readonly<{ email: string; validUntil: string }> | null;
  readonly pending: Readonly<{ eventId: string; kind: AdminCaseActionKind; phase: "proposed" | "acknowledged" }> | null;
}
