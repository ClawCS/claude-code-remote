import type Database from "better-sqlite3";
import { applicationId, staffId, utcInstant, type ApplicationId, type IncidentResolutionInput, type IncidentResolutionRecord } from "./types";

function invalid(): never { throw new Error("INCIDENT_RESOLUTION_INVALID"); }
export function validateIncidentResolution(value: IncidentResolutionInput): IncidentResolutionInput {
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) invalid();
  const fields = ["kind", "contactedAt", "contactChannel", "agreedResubmissionRoute"];
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(value).length !== 4 || fields.some(key => !descriptors[key] || !Object.hasOwn(descriptors[key], "value"))) invalid();
  // Read only captured data descriptors; accessors never execute.
  const input = Object.fromEntries(fields.map(key => [key, descriptors[key].value])) as unknown as IncidentResolutionInput;
  const route = input.agreedResubmissionRoute;
  if (input.kind !== "record-delivery-incident-resolution" || !["email", "phone", "in_person"].includes(input.contactChannel) || typeof route !== "string" || !route.trim() || [...route].length > 250 || Buffer.byteLength(route) > 1000 || /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u.test(route)) invalid();
  try { utcInstant(input.contactedAt); } catch { invalid(); }
  if (Buffer.byteLength(JSON.stringify(input)) > 2048) invalid();
  return Object.freeze(input);
}

// Private fixed-row validation; sole callers are the original composition.
export function readIncidentResolution(db: Database.Database, id: ApplicationId): IncidentResolutionRecord | null {
  applicationId(id);
  const row = db.prepare("SELECT caseId,version,actor,recordedAt,contactedAt,contactChannel,agreedResubmissionRoute FROM delivery_incident_resolutions WHERE caseId=?").get(id) as IncidentResolutionRecord | undefined;
  if (!row) return null;
  const input = validateIncidentResolution({ kind: "record-delivery-incident-resolution", contactedAt: row.contactedAt, contactChannel: row.contactChannel, agreedResubmissionRoute: row.agreedResubmissionRoute });
  staffId(row.actor); utcInstant(row.recordedAt);
  const parent = db.prepare("SELECT acceptedAt,version FROM cases WHERE id=?").get(id) as { acceptedAt: string; version: number } | undefined;
  if (row.caseId !== id || !Number.isSafeInteger(row.version) || row.version < 1 || !parent || row.version > parent.version || input.contactedAt < utcInstant(parent.acceptedAt) || input.contactedAt > row.recordedAt) invalid();
  return Object.freeze(row);
}
