import { VALIDATION_FAILURES, type ParserPort, type SnapshotFile, type ValidationFailure } from "./types";
import { RECONSTRUCTION_LIMITS } from "./reconstruction-limits";
export type DocumentFormat = "pdf" | "jpeg" | "png";
export interface RasterFrame { index: number; width: number; height: number; channels: 3 | 4; pixels: Uint8Array; pagePoints?: { width: number; height: number } }
export interface SourceInspection { format: DocumentFormat; pageCount: number }
// Implementations must await emit sequentially, and return only after successful close.
export interface RasterPort { render(file: SnapshotFile, emit: (frame: RasterFrame) => Promise<void>, signal: AbortSignal): Promise<SourceInspection> }
export type SourceInspectorResult = { kind: "inspected"; inspection: SourceInspection } | { kind: "blocked"; reason: ValidationFailure };
export interface SourceInspectorPort { readonly assurance: ParserPort["assurance"]; inspect(file: SnapshotFile, signal: AbortSignal): Promise<SourceInspectorResult> }

/** Copies only own data properties, without invoking accessors or accepting inherited DTOs. */
export function strictRecord(value: unknown, required: readonly string[], optional: readonly string[] = []): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return;
  const keys = Reflect.ownKeys(value), descriptors = Object.getOwnPropertyDescriptors(value);
  if (required.some(key => !keys.includes(key)) || keys.some(key => typeof key !== "string" || ![...required, ...optional].includes(key) || !("value" in descriptors[key]))) return;
  return Object.fromEntries(keys.map(key => [key, descriptors[key as string].value as unknown]));
}
export function decodeSourceInspection(value: unknown): SourceInspection | undefined {
  const record = strictRecord(value, ["format", "pageCount"]);
  if (!record || !["pdf", "jpeg", "png"].includes(record.format as string) || !Number.isSafeInteger(record.pageCount) || Number(record.pageCount) < 1) return;
  if (Number(record.pageCount) > (record.format === "pdf" ? RECONSTRUCTION_LIMITS.pdfPages : RECONSTRUCTION_LIMITS.imageFrames)) return;
  return { format: record.format as DocumentFormat, pageCount: record.pageCount as number };
}
export function decodeSourceInspectorResult(value: unknown): SourceInspectorResult | undefined {
  const inspected = strictRecord(value, ["kind", "inspection"]);
  if (inspected?.kind === "inspected") { const inspection = decodeSourceInspection(inspected.inspection); if (inspection) return { kind: "inspected", inspection }; }
  const blocked = strictRecord(value, ["kind", "reason"]);
  if (blocked?.kind === "blocked" && typeof blocked.reason === "string" && VALIDATION_FAILURES.includes(blocked.reason as ValidationFailure)) return { kind: "blocked", reason: blocked.reason as ValidationFailure };
}
export function decodeSourceInspectorResponse(value: unknown): SourceInspectorResult | undefined {
  const response = strictRecord(value, ["version", "operation", "result"]);
  if (response?.version === 1 && response.operation === "inspect-source") return decodeSourceInspectorResult(response.result);
}
