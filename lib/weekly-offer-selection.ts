import { berlinDateKey, getCurrentWeekRange } from "./editorial-schedule";
import { getOfferDemandRange } from "./offer-validity";
import { selectPublishedEditions } from "./weekly-publication";
import type { LoadedWeeklyPublications, PublicFlyer, PublicOfferView, WeeklyEdition, WeeklyOfferContent } from "./weekly-publication-types";

export function mapPublishedEditionToFlyer(edition: WeeklyEdition): PublicFlyer {
  return { id: edition.id, language: edition.language, title: edition.title,
    validFrom: edition.validFrom, validTo: edition.validTo, viewerUrl: edition.pdf.path,
    pdfUrl: edition.pdf.path, sourceUrl: edition.pdf.path, coverUrl: edition.cover.path,
    pageCount: edition.pageCount, pdfSha256: edition.pdf.sha256 };
}


/** CLI-safe public projection of an already verified package. No I/O or source fallbacks. */
export function selectWeeklyOfferContent(loaded:LoadedWeeklyPublications, now:Date):WeeklyOfferContent {
  const range = getCurrentWeekRange(now);
  const relevant = loaded.issues.filter(issue => issue.week === null || issue.week === range.validFrom);
  // Unassignable corruption cannot be proved unrelated; no public selection is safe.
  const selected = relevant.some(issue => issue.week === null || !issue.language)
    ? [] : selectPublishedEditions(loaded, now).filter(item => !relevant.some(issue => issue.language === item.edition.language));
  const issues = relevant.map(issue => `${issue.language ? `${issue.language}-` : ""}${issue.code}`);
  if (berlinDateKey(now) <= getOfferDemandRange(range).validTo) {
    if (!selected.some(item => item.edition.language === "de")) issues.push("official-flyer-missing");
    if (!selected.some(item => item.edition.language === "nl")) issues.push("nl-flyer-missing");
  }
  const flyers = selected.map(({ edition }) => mapPublishedEditionToFlyer(edition));
  const offers: PublicOfferView[] = selected.flatMap(({ edition, offers }) => offers.map(offer => ({
    id: offer.id, name: offer.name, categorySlug: offer.categorySlug, language: offer.language,
    flyerId: edition.id, validFrom: offer.validFrom, validTo: offer.validTo, image: offer.image,
    sourcePage: offer.sourcePage, rect: offer.rect, pdfSha256: offer.pdfSha256,
    sourceUrl: edition.pdf.path, conditions: offer.conditions,
    ...(offer.sourceWarning === undefined ? {} : { sourceWarning: offer.sourceWarning }),
  })));
  return { status: issues.length ? "degraded" : "ok", issues: [...new Set(issues)], generatedAt: now.toISOString(), flyers, offers };
}
