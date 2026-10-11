import type { EditionSource } from "./weekly-publication-types";
import { getCurrentWeekRange } from "./editorial-schedule";
import { getAcceptedNlOfferRanges, getOfficialOfferRange } from "./offer-validity";

export type AgencyMedium = "de-maas-driehoek" | "udens-weekblad";
export type PublicationPurpose = "weekly" | "supplemental";
export type PublicationMedium = "trinkgut" | AgencyMedium | "maasduinen" | "legacy-canva";
export type PublicationIdentity = Readonly<{ language: "de" | "nl"; purpose: PublicationPurpose; medium: PublicationMedium }>;

export function isPublicationDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}
export function isPublicationTimestamp(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().replace(".000Z", "Z") === value.replace(".000Z", "Z");
}
export function expectedNlAgencyMedium(week: string): AgencyMedium {
  if (!isPublicationDate(week) || new Date(`${week}T12:00:00Z`).getUTCDay() !== 1) throw new TypeError("Invalid publication week");
  // ISO week belongs to its Thursday's year, not necessarily the Monday's year.
  const thursday = new Date(`${week}T12:00:00Z`);
  thursday.setUTCDate(thursday.getUTCDate() + 3);
  const isoWeek = Math.ceil(((thursday.valueOf() - Date.UTC(thursday.getUTCFullYear(), 0, 1, 12)) / 86400000 + 1) / 7);
  return isoWeek % 2 === 0 ? "de-maas-driehoek" : "udens-weekblad";
}
export function assertPublicationPolicy(identity: PublicationIdentity, source: EditionSource, validFrom: string, validTo: string, week?: string): void {
  if (!identity || Object.keys(identity).sort().join() !== "language,medium,purpose"
    || !["de", "nl"].includes(identity.language) || !["weekly", "supplemental"].includes(identity.purpose)
    || !isPublicationDate(validFrom) || !isPublicationDate(validTo) || validFrom > validTo || !source) throw new TypeError("Invalid publication identity or validity");
  if (identity.purpose === "supplemental") {
    if (identity.language !== "nl" || identity.medium !== "maasduinen" || source.kind !== "canva" || week !== undefined) throw new TypeError("Invalid supplemental provider");
    return;
  }
  const monday = week ?? validFrom;
  expectedNlAgencyMedium(monday);
  const range = getCurrentWeekRange(new Date(`${monday}T12:00:00Z`));
  const accepted = identity.language === "de" && source.kind === "trinkgut-official"
    ? [getOfficialOfferRange(range, source)] : getAcceptedNlOfferRanges(range);
  if (!accepted.some(row => row.validFrom === validFrom && row.validTo === validTo)) throw new TypeError("Invalid printed publication week/year");
  if (identity.language === "de") {
    if (identity.medium !== "trinkgut" || source.kind !== "trinkgut-official") throw new TypeError("Invalid DE provider");
  } else if (monday >= "2026-10-12") {
    const expected = expectedNlAgencyMedium(monday);
    if (source.kind !== "agency" || identity.medium !== expected || source.medium !== expected) throw new TypeError("Invalid NL agency provider for ISO week");
  } else if (identity.medium !== "legacy-canva" || source.kind !== "canva") throw new TypeError("Invalid historical NL provider");
}
