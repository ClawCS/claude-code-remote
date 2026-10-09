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
