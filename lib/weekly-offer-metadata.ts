import type { OriginalCrop } from "./weekly-offer-crops";
import type { PublicationIdentity } from "./flyer-source-policy";
import type { EditionSource } from "./weekly-publication-types";

/** Printed facts only: no calculated values, stock or numeric price schema. */
export type OfferSummary = Readonly<{ price: string; package: string; deposit: string; unitPrice: string }>;

export function validateOfferSummary(value: unknown): OfferSummary | undefined {
  if (value === undefined) return undefined;
  const fields = ["price", "package", "deposit", "unitPrice"] as const;
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Reflect.ownKeys(value).length !== fields.length
    || fields.some(key => !Object.hasOwn(value, key))) throw new TypeError("Invalid offer summary fields");
  const summary = value as Record<string, unknown>;
  for (const key of fields) {
    const fact = summary[key];
    if (typeof fact !== "string" || !fact.trim() || fact.length > 160
      || fact !== fact.trim() || /[<>]|\p{C}/u.test(fact)) throw new TypeError("Invalid plain offer summary fact");
  }
  return { price: summary.price as string, package: summary.package as string, deposit: summary.deposit as string, unitPrice: summary.unitPrice as string };
}

export type ReviewedWeeklyOffer = OriginalCrop & {
  id: string;
  name: string;
  categorySlug: string;
  conditions: string;
  sourceWarning?: string;
  summary?: OfferSummary;
  imagePath?: string;
};

export type WeeklyOfferPublicSource = {
  identity?: PublicationIdentity;
  source?: EditionSource;
  approvedAt?: string;
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
  const summary = validateOfferSummary(offer.summary);
  // KW41 is an immutable legacy archive. From the approved KW42 completion
  // onward, a weekly import must contain all four source-reviewed facts.
  // A value absent from the original is a descriptive fact, never a calculation.
  if (source.identity?.purpose !== "supplemental" && source.validFrom >= "2026-10-12" && summary === undefined) {
    throw new TypeError(`Complete reviewed offer summary required: ${offer.id}`);
  }
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
    ...(summary === undefined ? {} : { summary }),
  };
}
