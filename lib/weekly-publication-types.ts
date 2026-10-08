import type { buildPublicOfferMetadata } from "./weekly-offer-metadata";

export type LocalAsset = Readonly<{ path: string; sha256: string; bytes: number }>;
export type PublishedOffer = ReturnType<typeof buildPublicOfferMetadata> & { imageSha256: string };
export type EditionSource =
  | { kind: "trinkgut-official"; catalogId: string; catalogVersion: string; metadataSha256: string }
  | { kind: "canva"; flyerId: string };
export type WeeklyEdition = Readonly<{
  id: string;
  language: "de" | "nl";
  title: string;
  validFrom: string;
  validTo: string;
  source: EditionSource;
  pdf: LocalAsset;
  cover: LocalAsset;
  pageCount: number;
  review: { reviewedAt: string; printedValidFrom: string; printedValidTo: string; pageOfferCounts: readonly number[] };
  offerIds: readonly string[];
  offersSha256: string;
}>;
export type WeeklyPublication = Readonly<{ schemaVersion: 1; week: string; editions: readonly WeeklyEdition[] }>;
export type VerifiedWeeklyEdition = Readonly<{ edition: WeeklyEdition; offers: readonly PublishedOffer[] }>;
export type WeeklyPublicationIssue = Readonly<{ week: string | null; language?: "de" | "nl"; code: string }>;
export type LoadedWeeklyPublications = Readonly<{ editions: readonly VerifiedWeeklyEdition[]; issues: readonly WeeklyPublicationIssue[] }>;
export type PublicFlyer = import("./homepage-content").HomepageFlyer & Readonly<{language: "de" | "nl"; pdfSha256: string}>;
export type PublicOfferView = Readonly<Pick<PublishedOffer, "id" | "name" | "categorySlug" | "language" | "flyerId" | "validFrom" | "validTo" | "image" | "sourcePage" | "rect" | "pdfSha256" | "sourceUrl" | "conditions" | "sourceWarning">>;
export type WeeklyOfferContent = Readonly<{ status: "ok" | "degraded"; issues: readonly string[]; generatedAt: string; flyers: readonly PublicFlyer[]; offers: readonly PublicOfferView[] }>;
