import { strictObject } from "./crypto";
import { digest, type AdmissionKeys, type SubmissionKind } from "./types";

export const ADMISSION_WINDOW_MS = 3600000;
export const ADMISSION_EVENT_CAP = 100000;
export class RateLimitedError extends Error {
  constructor(readonly retryAfterSeconds: number) { super("RATE_LIMITED"); }
}
export function submissionKind(value: unknown): SubmissionKind {
  const candidate = strictObject(value, ["kind"], ["pilotRunId"]);
  if (candidate.kind === "application" && !Object.hasOwn(candidate, "pilotRunId")) return Object.freeze({ kind: "application" });
  if (candidate.kind === "synthetic" && typeof candidate.pilotRunId === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(candidate.pilotRunId)) return Object.freeze({ kind: "synthetic", pilotRunId: candidate.pilotRunId });
  throw new Error("INVALID_SUBMISSION");
}
export function admissionKeys(value: unknown): AdmissionKeys {
  const keys = strictObject(value, ["sessionKey", "ipKey"]);
  if (typeof keys.sessionKey !== "string" || typeof keys.ipKey !== "string") throw new Error("INVALID_ADMISSION");
  return { sessionKey: digest(keys.sessionKey), ipKey: digest(keys.ipKey) };
}
