import type { OriginalCrop } from "./weekly-offer-crops";

export type ReviewedWeeklyOffer = OriginalCrop & {
  id: string;
  name: string;
  categorySlug: string;
  conditions: string;
  sourceWarning?: string;
};

export type WeeklyOfferPublicSource = {
  language: string;
  flyerId: string;
  sourceUrl: string;
  privatePdf?: string;
  pdfSha256: string;
  validFrom: string;
  validTo: string;
  reviewedAt: string;
  rightsStatus: string;
};

/** The complete layout-derived publication record; imageSha256 comes from the actual image bytes. */
export function buildPublicOfferMetadata(source: WeeklyOfferPublicSource, page: number, offer: ReviewedWeeklyOffer) {
  let sourceUrl = source.sourceUrl;
  if (source.language === "nl") {
    // The Canva URL is editorial provenance; visitors receive only the verified local original.
    const publishedPdf = source.privatePdf?.match(/^public(\/handzettel\/[a-zA-Z0-9/_-]+\.pdf)$/);
    if (!publishedPdf) throw new Error("NL offers require a local published PDF");
    sourceUrl = publishedPdf[1];
  }
  return {
    id: offer.id,
    name: offer.name,
    categorySlug: offer.categorySlug,
    language: source.language,
    flyerId: source.flyerId,
    validFrom: source.validFrom,
    validTo: source.validTo,
    image: `/images/offers/${offer.id}.webp`,
    sourcePage: page,
    rect: offer.rect,
    sourceDimensions: offer.sourceDimensions,
    ...(offer.sourceRegions ? { sourceRegions: offer.sourceRegions } : {}),
    pdfSha256: source.pdfSha256,
    sourceUrl,
    rightsStatus: source.rightsStatus,
    reviewedAt: source.reviewedAt,
    conditions: offer.conditions,
    ...(offer.sourceWarning ? { sourceWarning: offer.sourceWarning } : {}),
  };
}
