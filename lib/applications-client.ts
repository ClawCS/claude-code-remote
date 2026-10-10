// Node-free: no private service configuration, storage or logging.
import type { PublicApplicationConfig, PublicStatus, IntakeAcceptanceResponse, IntakeSessionResponse } from "./applications-contract";

export const APPLICATION_FALLBACK: PublicApplicationConfig = { enabled: false, mode: "disabled", limits: { maxFiles: 5, maxFileBytes: 5242880, maxTotalBytes: 10485760 }, jobs: [{ id: "sales-fulltime", label: "Verkauf Vollzeit (m/w/d)" }, { id: "sales-parttime", label: "Verkauf Teilzeit bis zu 150 Stunden/Monat (m/w/d)" }] };
function shape(value: unknown, keys: readonly string[], optional: readonly string[] = []): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && keys.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => keys.includes(key) || optional.includes(key));
}
const reference = (value: unknown): value is string => typeof value === "string" && /^TJ-[A-F0-9]{24}$/.test(value);
// 32-byte base64url proof: final six bits may encode only four data bits.
const proof = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(value);
export function validateApplicationConfig(value: unknown): PublicApplicationConfig | null {
  if (!shape(value, ["enabled", "mode", "limits", "jobs"]) || typeof value.enabled !== "boolean" || typeof value.mode !== "string" || !["disabled", "pilot", "enabled"].includes(value.mode) || value.mode === "disabled" && value.enabled) return null;
  if (!shape(value.limits, ["maxFiles", "maxFileBytes", "maxTotalBytes"]) || value.limits.maxFiles !== 5 || value.limits.maxFileBytes !== 5242880 || value.limits.maxTotalBytes !== 10485760) return null;
  if (!Array.isArray(value.jobs) || value.jobs.length !== 2 || !value.jobs.every(job => shape(job, ["id", "label"]) && typeof job.id === "string" && ["sales-fulltime", "sales-parttime"].includes(job.id) && typeof job.label === "string" && job.label.length > 0 && job.label.length <= 160 && !/[\u0000-\u001f\u007f]/.test(job.label)) || new Set(value.jobs.map(job => job.id)).size !== 2) return null;
  return { enabled: value.enabled, mode: value.mode as PublicApplicationConfig["mode"], limits: { ...APPLICATION_FALLBACK.limits }, jobs: value.jobs.map(job => ({ id: job.id, label: job.label })) };
}
export function validateApplicationAcceptance(value: unknown): IntakeAcceptanceResponse | null {
  return shape(value, ["reference", "state", "statusToken"]) && reference(value.reference) && value.state === "processing" && proof(value.statusToken) ? { reference: value.reference, state: "processing", statusToken: value.statusToken } : null;
}
export function validateApplicationSession(value: unknown): IntakeSessionResponse | null {
  return shape(value, ["formToken"]) && typeof value.formToken === "string" && value.formToken.length <= 2048 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(value.formToken) ? { formToken: value.formToken } : null;
}
export function validateApplicationStatus(value: unknown): PublicStatus | null {
  return shape(value, ["reference", "state", "acceptedAt"]) && reference(value.reference) && typeof value.state === "string" && ["processing", "delivered", "needs_attention"].includes(value.state) && typeof value.acceptedAt === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.acceptedAt) && Number.isFinite(Date.parse(value.acceptedAt)) && new Date(value.acceptedAt).toISOString() === value.acceptedAt ? { reference: value.reference, state: value.state as PublicStatus["state"], acceptedAt: value.acceptedAt } : null;
}
export type ApplicationOutcome = "accepted" | "correctable" | "conflict" | "session" | "retry" | "ambiguous";
export function applicationOutcome(status: number, value: unknown): ApplicationOutcome {
  if (status === 202 && validateApplicationAcceptance(value)) return "accepted";
  if (!shape(value, ["code", "error"], ["retryAfterSeconds"]) || typeof value.code !== "string" || typeof value.error !== "string" || value.error.length > 512 || value.retryAfterSeconds !== undefined && (!Number.isInteger(value.retryAfterSeconds) || Number(value.retryAfterSeconds) < 1 || Number(value.retryAfterSeconds) > 3600)) return "ambiguous";
  if (status === 400 && value.code === "INVALID_REQUEST" || status === 413 && value.code === "PAYLOAD_TOO_LARGE") return "correctable";
  if (status === 403 && value.code === "FORBIDDEN") return "session";
  if (status === 409 && value.code === "IDEMPOTENCY_CONFLICT") return "conflict";
  if (status === 409 && value.code === "UPLOAD_IN_PROGRESS" || status === 429 && ["RATE_LIMITED", "CAPACITY_EXCEEDED"].includes(value.code)) return "retry";
  return "ambiguous";
}
export function applicationRetryDelay(value: string | null): number {
  return value !== null && /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 3600 ? Number(value) * 1000 : 60000;
}
export function mayRetryApplication(attempt: {firstAt:number;submissions:number;notBefore:number}, now:number): boolean {
  return Number.isFinite(now) && now >= attempt.firstAt && now < attempt.firstAt + 900000 && now >= attempt.notBefore && attempt.notBefore < attempt.firstAt + 900000 && attempt.submissions < 3;
}
export function selectApplicationFiles(existing: readonly File[], incoming: readonly File[]): {files:readonly File[];error?:string} {
  const proposed = [...existing, ...incoming];
  const fail = (error: string) => ({ files: existing, error });
  if (proposed.length > 5) return fail("Bitte wähle höchstens fünf Dateien.");
  if (new Set(proposed).size !== proposed.length) return fail("Diese Datei ist bereits ausgewählt.");
  if (proposed.some(file => file.size > 5242880 || file.size === 0)) return fail("Jede Datei muss zwischen 1 Byte und 5 MiB groß sein.");
  if (proposed.reduce((size, file) => size + file.size, 0) > 10485760) return fail("Die Dateien dürfen zusammen höchstens 10 MiB groß sein.");
  if (proposed.some(file => !((/\.pdf$/i.test(file.name) && file.type === "application/pdf") || (/\.jpe?g$/i.test(file.name) && file.type === "image/jpeg") || (/\.png$/i.test(file.name) && file.type === "image/png")))) return fail("Bitte wähle ausschließlich PDF, JPG/JPEG oder PNG.");
  return { files: proposed };
}
export async function readApplicationJson(response: Response): Promise<unknown> {
  const invalid = () => new Error("APPLICATION_RESPONSE_INVALID");
  if (response.redirected || response.status >= 300 && response.status < 400 || !/^application\/json(?:\s*;|$)/i.test(response.headers.get("content-type") ?? "") || !response.body) { await response.body?.cancel(); throw invalid(); }
  const reader = response.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.byteLength; if (size > 8192) throw invalid(); chunks.push(chunk.value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch { await reader.cancel().catch(() => {}); throw invalid(); } finally { reader.releaseLock(); }
}
