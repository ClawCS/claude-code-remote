export const EDITORIAL_TIME_ZONE = "Europe/Berlin" as const;

export type EditorialSource =
  | "trinkgut-official"
  | "canva"
  | "instagram"
  | "local";

export type EditorialStatus = "draft" | "scheduled" | "active" | "expired" | "archived";
export type TemporalEditorialStatus = Exclude<EditorialStatus, "draft">;
export type RightsStatus = "official" | "approved" | "review-required" | "rejected";

export type ScheduledEditorial = Readonly<{
  id: string;
  source: EditorialSource;
  sourceUrl: string;
  validFrom: string;
  validTo: string;
  rightsStatus: RightsStatus;
  archived?: boolean;
}>;

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EDITORIAL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function berlinDateKey(now = new Date()): string {
  return dateKeyFormatter.format(now);
}

export function deriveEditorialStatus(
  item: ScheduledEditorial,
  now = new Date(),
): TemporalEditorialStatus {
  if (item.archived) return "archived";
  const today = berlinDateKey(now);
  if (today < item.validFrom) return "scheduled";
  if (today > item.validTo) return "expired";
  return "active";
}

function addCalendarDays(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function isValidDateKey(dateKey: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === dateKey;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function berlinWeekdayAndTime(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EDITORIAL_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function getPublicationWeekRange(now = new Date()) {
  const today = berlinDateKey(now);
  const day = new Date(`${today}T12:00:00.000Z`).getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  let validFrom = addCalendarDays(today, -daysSinceMonday);
  const clock = berlinWeekdayAndTime(now);
  const minutes = Number(clock.hour) * 60 + Number(clock.minute);
  if (clock.weekday === "Sun" && minutes >= 16 * 60) {
    validFrom = addCalendarDays(validFrom, 7);
  }
  return { validFrom, validTo: addCalendarDays(validFrom, 5) } as const;
}

export function isEditorialPublishable(
  item: ScheduledEditorial,
  now = new Date(),
): boolean {
  if (item.rightsStatus !== "official" && item.rightsStatus !== "approved") return false;
  if (!isHttpsUrl(item.sourceUrl)) return false;
  if (!isValidDateKey(item.validFrom)) return false;
  if (!isValidDateKey(item.validTo)) return false;
  if (item.validFrom > item.validTo) return false;
  return deriveEditorialStatus(item, now) === "active";
}
