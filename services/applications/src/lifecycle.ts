import { dateOnly, utcInstant, type ActionGrant, type ApplicationId, type CaseAction, type CaseRecord, type DateOnly, type Eligibility, type FenceAction, type LifecycleDependencies, type ManualCategory, type StaffId, type Instant } from "./types";

export function berlinDate(value: Date): DateOnly {
  utcInstant(value.toISOString());
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  return dateOnly(["year", "month", "day"].map(kind => parts.find(part => part.type === kind)!.value).join("-"));
}
export function calendarDays(value: DateOnly, count: number): DateOnly {
  dateOnly(value); const date = new Date(`${value}T12:00:00.000Z`); date.setUTCDate(date.getUTCDate() + count); return dateOnly(date.toISOString().slice(0, 10));
}
export function retentionDates(closedOn: DateOnly): { deadline: DateOnly; deleteFrom: DateOnly } {
  dateOnly(closedOn);
  const [year, month, day] = closedOn.split("-").map(Number), targetMonth = (month - 1 + 6) % 12 + 1, targetYear = year + Math.floor((month - 1 + 6) / 12);
  const first = `${String(targetYear).padStart(4, "0")}-${String(targetMonth).padStart(2, "0")}-01`;
  const end = new Date(`${dateOnly(first)}T12:00:00.000Z`); end.setUTCMonth(end.getUTCMonth() + 1, 0);
  const deadline = dateOnly(`${first.slice(0, 8)}${String(Math.min(day, end.getUTCDate())).padStart(2, "0")}`);
  return { deadline, deleteFrom: calendarDays(deadline, 1) };
}
export function operatorReason(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || [...value].length > 500 || Buffer.byteLength(value, "utf8") > 2000 || /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u.test(value)) throw new Error("CASE_ACTION_INVALID");
  return value;
}
export function validateCaseAction(value: CaseAction): CaseAction {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error("CASE_ACTION_INVALID");
  const fields: Record<string, readonly string[]> = { review: ["kind"], reject: ["kind", "closedOn"], "correct-date": ["kind", "closedOn", "reason"], reopen: ["kind", "reason"], hold: ["kind", "reviewOn", "reason"], "release-hold": ["kind", "reason"], "manual-case": ["kind", "category", "reason"], "confirm-external-copies": ["kind", "confirmed", "reason"] };
  const keys = fields[value.kind];
  if (!keys || Reflect.ownKeys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key)) || Object.values(Object.getOwnPropertyDescriptors(value)).some(descriptor => !Object.hasOwn(descriptor, "value"))) throw new Error("CASE_ACTION_INVALID");
  if ("reason" in value) operatorReason(value.reason);
  if ("closedOn" in value) dateOnly(value.closedOn);
  if ("reviewOn" in value) dateOnly(value.reviewOn);
  if ("category" in value && !["hired", "withdrawn", "data-subject-request", "other"].includes(value.category)) throw new Error("CASE_ACTION_INVALID");
  if ("confirmed" in value && typeof value.confirmed !== "boolean") throw new Error("CASE_ACTION_INVALID");
  const result = Object.fromEntries(keys.map(key => [key, value[key as keyof CaseAction]])) as unknown as CaseAction;
  if (Buffer.byteLength(JSON.stringify(result)) > 4096) throw new Error("CASE_ACTION_INVALID");
  return Object.freeze(result);
}
export function caseFenceAction(row: CaseRecord, action: CaseAction): FenceAction | null {
  return action.kind === "review" || action.kind === "confirm-external-copies" ? null : action.kind === "hold" && row.lifecycle.hold ? "renew-hold" : action.kind;
}
export function decideCaseAction(row: CaseRecord, input: CaseAction, actor: StaffId, now: Instant): CaseRecord {
  const action = validateCaseAction(input), today = berlinDate(new Date(now));
  if (row.lifecycle.identityState !== "identifying") throw new Error("CASE_BLOCKED");
  let state = row.caseState, closedOn = row.closedOn;
  const next = { ...row.lifecycle };
  const invalid = () => { throw new Error("CASE_TRANSITION_INVALID"); }, noop = () => { throw new Error("CASE_NO_OP"); };
  switch (action.kind) {
    case "review": if (state === "reviewing") noop(); if (state !== "open") invalid(); state = "reviewing"; break;
    case "reject": case "correct-date":
      if (action.kind === "reject" ? !["open", "reviewing"].includes(state) : state !== "rejected_closed") invalid();
      if (action.kind === "correct-date" && closedOn === action.closedOn) noop();
      if (action.closedOn < berlinDate(new Date(row.acceptedAt)) || action.closedOn > today) throw new Error("CASE_DATE_INVALID");
      if (action.kind === "reject") next.externalCopiesConfirmed = false;
      closedOn = action.closedOn; Object.assign(next, retentionDates(closedOn)); state = "rejected_closed"; break;
    case "reopen": if (state !== "rejected_closed") invalid(); state = "reviewing"; closedOn = null; next.deadline = null; next.deleteFrom = null; next.externalCopiesConfirmed = false; break;
    case "manual-case":
      if (state === "manual_case" && next.manualCategory === action.category) noop();
      state = "manual_case"; next.manualCategory = action.category; closedOn = null; next.deadline = null; next.deleteFrom = null; next.externalCopiesConfirmed = false; break;
    case "hold":
      if (state !== "rejected_closed") invalid();
      if (action.reviewOn < today || action.reviewOn > calendarDays(today, 30)) throw new Error("CASE_DATE_INVALID");
      if (next.hold?.reviewOn === action.reviewOn && next.hold.reason === action.reason) noop();
      next.hold = { reviewOn: action.reviewOn, reason: action.reason, actor, at: now }; break;
    case "release-hold": if (!next.hold) invalid(); next.hold = null; break;
    case "confirm-external-copies":
      if (next.externalCopiesConfirmed === action.confirmed) noop();
      next.externalCopiesConfirmed = action.confirmed; next.externalCopiesAt = now; next.externalCopiesActor = actor; next.externalCopiesReason = action.reason; break;
  }
  return { ...row, caseState: state, closedOn, version: row.version + 1, lifecycle: next };
}
export function validateLifecycle(row: CaseRecord): void {
  const l = row.lifecycle, validId = (id: string | null) => id !== null && /^[a-f0-9]{32}$/.test(id);
  if (!l || !["identifying", "minimized"].includes(l.identityState) || !Number.isSafeInteger(l.safetyRevision) || l.safetyRevision < 0 || (l.pendingEventId !== null && !validId(l.pendingEventId)) || typeof l.externalCopiesConfirmed !== "boolean") throw new Error("INVALID_LIFECYCLE_STATE");
  if (l.initialAuthority !== null && !validId(l.initialAuthority)) throw new Error("INVALID_LIFECYCLE_STATE");
  if ((l.authorityKind === null) !== (l.authorityId === null) || (l.authorityKind !== null && (!["initial", "fence"].includes(l.authorityKind) || !validId(l.authorityId))) || (l.authorityKind === "initial" && l.authorityId !== l.initialAuthority)) throw new Error("INVALID_LIFECYCLE_STATE");
  if (row.caseState === "rejected_closed") {
    if (!row.closedOn) throw new Error("INVALID_LIFECYCLE_STATE");
    const dates = retentionDates(row.closedOn);
    if (dates.deadline !== l.deadline || dates.deleteFrom !== l.deleteFrom || row.closedOn < berlinDate(new Date(row.acceptedAt))) throw new Error("INVALID_LIFECYCLE_STATE");
  } else if (!["open", "reviewing", "manual_case"].includes(row.caseState) || row.closedOn !== null || l.deadline !== null || l.deleteFrom !== null) throw new Error("INVALID_LIFECYCLE_STATE");
  if ((row.caseState === "manual_case") !== (l.manualCategory !== null) || (l.manualCategory !== null && !(["hired", "withdrawn", "data-subject-request", "other"] as ManualCategory[]).includes(l.manualCategory))) throw new Error("INVALID_LIFECYCLE_STATE");
  if (l.hold) { dateOnly(l.hold.reviewOn); operatorReason(l.hold.reason); utcInstant(l.hold.at); if (!l.hold.actor || l.hold.reviewOn < berlinDate(new Date(l.hold.at)) || l.hold.reviewOn > calendarDays(berlinDate(new Date(l.hold.at)), 30)) throw new Error("INVALID_LIFECYCLE_STATE"); }
  if ((l.externalCopiesAt === null) !== (l.externalCopiesActor === null) || (l.externalCopiesAt === null) !== (l.externalCopiesReason === null) || (l.externalCopiesConfirmed && l.externalCopiesAt === null)) throw new Error("INVALID_LIFECYCLE_STATE");
  if (l.externalCopiesAt) { utcInstant(l.externalCopiesAt); operatorReason(l.externalCopiesReason); }
}
export function deletionEligibility(row: CaseRecord, todayBerlin: DateOnly): Eligibility {
  try { dateOnly(todayBerlin); validateLifecycle(row); } catch { return "blocked"; }
  if (row.lifecycle.identityState !== "identifying" || !row.lifecycle.authorityId || row.lifecycle.pendingEventId) return "blocked";
  if (row.lifecycle.hold) return "held";
  return row.caseState !== "rejected_closed" || todayBerlin < row.lifecycle.deleteFrom! ? "not_due" : "eligible";
}
export function lifecycleIndicators(row: CaseRecord, todayBerlin: DateOnly) {
  dateOnly(todayBerlin); validateLifecycle(row);
  return { deletionWarning: row.lifecycle.deleteFrom !== null && todayBerlin >= calendarDays(row.lifecycle.deleteFrom, -7), openReminder: ["open", "reviewing", "manual_case"].includes(row.caseState) && todayBerlin >= calendarDays(berlinDate(new Date(row.acceptedAt)), 30), holdReviewDue: row.lifecycle.hold !== null && todayBerlin >= row.lifecycle.hold.reviewOn };
}
export function applyCaseAction(id: ApplicationId, action: CaseAction, grant: ActionGrant, deps: LifecycleDependencies): Promise<CaseRecord> {
  return deps.repository.applyCaseAction(id, action, grant, deps.session, deps.recoveryEventId);
}
