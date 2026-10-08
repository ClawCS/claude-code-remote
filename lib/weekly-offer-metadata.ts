import type { OriginalCrop } from "./weekly-offer-crops";

export type ReviewedWeeklyOffer = OriginalCrop & {
  id: string;
  name: string;
  categorySlug: string;
  conditions: string;
  sourceWarning?: string;
  imagePath?: string;
};

export type WeeklyOfferPublicSource = {
  language: string;
  flyerId: string;
  sourceUrl: string;
  publishedPdfPath: string;
  privatePdf?: string;
  pdfSha256: string;
  validFrom: string;
  validTo: string;
  reviewedAt: string;
  rightsStatus: string;
};

/** The complete layout-derived publication record; imageSha256 comes from the actual image bytes. */
export function buildPublicOfferMetadata(source: WeeklyOfferPublicSource, page: number, offer: ReviewedWeeklyOffer, imagePath: string) {
  if (!/^\/handzettel\/[a-zA-Z0-9/_-]+\.pdf$/.test(source.publishedPdfPath) || source.publishedPdfPath.includes("//")) throw new Error("Offers require a local published PDF");
  if (!/^\/images\/offers\/[a-zA-Z0-9/_-]+\.(?:webp|png|jpe?g|avif)$/.test(imagePath) || imagePath.includes("//")) throw new Error("Offers require a safe local derivative");
  return {
    id: offer.id,
    name: offer.name,
    categorySlug: offer.categorySlug,
    language: source.language,
    flyerId: source.flyerId,
    validFrom: source.validFrom,
    validTo: source.validTo,
    image: imagePath,
    sourcePage: page,
    rect: offer.rect,
    sourceDimensions: offer.sourceDimensions,
    ...(offer.sourceRegions ? { sourceRegions: offer.sourceRegions } : {}),
    pdfSha256: source.pdfSha256,
    sourceUrl: source.publishedPdfPath,
    rightsStatus: source.rightsStatus,
    reviewedAt: source.reviewedAt,
    conditions: offer.conditions,
    ...(offer.sourceWarning ? { sourceWarning: offer.sourceWarning } : {}),
  };
}
