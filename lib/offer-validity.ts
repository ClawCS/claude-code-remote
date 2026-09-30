export type OfferRange = Readonly<{validFrom: string; validTo: string}>;

// Reviewed 2026-09-30: official catalog 1384969 v4/v5 PDF and full-resolution
// cover print 28.09.2026–02.10.2026, although viewer expiry is 03.10.2026.
// Source: https://werbung.trinkgut.de/frontend/catalogs/1384969/4/pdf/complete.pdf
// This is one source-backed exception, not a rule inferred from holidays.
function isReviewedKw40(range: OfferRange): boolean {
  return range.validFrom === "2026-09-28" && range.validTo === "2026-10-03";
}

export function getOfferDemandRange(calendarRange: OfferRange): OfferRange {
  return isReviewedKw40(calendarRange) ? {...calendarRange, validTo: "2026-10-02"} : calendarRange;
}

export function getOfficialOfferRange(
  calendarRange: OfferRange,
  identity?: Readonly<{catalogId: string; catalogVersion: string}>,
): OfferRange {
  if (identity && (identity.catalogId !== "1384969" || !["4", "5"].includes(identity.catalogVersion))) return calendarRange;
  return getOfferDemandRange(calendarRange);
}

export function getAcceptedNlOfferRanges(calendarRange: OfferRange): readonly OfferRange[] {
  return isReviewedKw40(calendarRange) ? [calendarRange, getOfferDemandRange(calendarRange)] : [calendarRange];
}
