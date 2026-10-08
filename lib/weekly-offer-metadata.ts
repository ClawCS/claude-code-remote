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
  pdfSha256: string;
  validFrom: string;
  validTo: string;
  reviewedAt: string;
  rightsStatus: string;
};

/** The complete layout-derived publication record; imageSha256 comes from the actual image bytes. */
export function buildPublicOfferMetadata(source: WeeklyOfferPublicSource, page: number, offer: ReviewedWeeklyOffer) {
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
    sourceUrl: source.sourceUrl,
    rightsStatus: source.rightsStatus,
    reviewedAt: source.reviewedAt,
    conditions: offer.conditions,
    ...(offer.sourceWarning ? { sourceWarning: offer.sourceWarning } : {}),
  };
}
