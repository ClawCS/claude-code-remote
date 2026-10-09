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
