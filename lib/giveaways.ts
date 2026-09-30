import { GIVEAWAYS_2026, type Giveaway } from "@/data/giveaways";

export type GiveawayStatus = "active" | "ended" | "later";
export type MonthlyAgendaSlot = Readonly<{
  year: number;
  month: number;
  monthName: string;
  giveaway: Giveaway | null;
  status: GiveawayStatus | "unannounced";
}>;

const berlinCalendar = new Intl.DateTimeFormat("en", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" });
const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function berlinDate(now: Date): string {
  const parts = berlinCalendar.formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

/** Calendar classification, not a claim about the original post's publication date. */
export function getGiveawayStatus(giveaway: Giveaway, now: Date): GiveawayStatus {
  const today = berlinDate(now);
  if (today > giveaway.verifiedEndsDate) return "ended";
  const knownFrom = giveaway.kind === "special" ? giveaway.verifiedAt : `${giveaway.year}-${String(giveaway.month).padStart(2, "0")}-01`;
  return today < knownFrom ? "later" : "active";
}

export function getMonthlyAgenda(year: number, now: Date, giveaways: readonly Giveaway[] = GIVEAWAYS_2026): MonthlyAgendaSlot[] {
  return monthNames.map((monthName, index) => {
    const month = index + 1;
    const giveaway = giveaways.find((entry) => entry.kind === "monthly" && entry.year === year && entry.month === month) ?? null;
    return { year, month, monthName, giveaway, status: giveaway ? getGiveawayStatus(giveaway, now) : "unannounced" };
  });
}

export function getActiveGiveaways(now: Date, giveaways: readonly Giveaway[] = GIVEAWAYS_2026): Giveaway[] {
  return giveaways.filter((giveaway) => getGiveawayStatus(giveaway, now) === "active");
}
