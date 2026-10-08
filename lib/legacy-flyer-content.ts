// Legacy import/editorial tooling only. Public consumers use verified weekly editions.
import { validateCatalog, type HandzettelCache } from "./handzettel-catalog";
import type { FlyerPackage } from "./flyer-packages";
import type { HomepageFlyer } from "./homepage-content";
export function mapHandzettelCacheToFlyer(
  cache: HandzettelCache,
): HomepageFlyer {
  validateCatalog(cache, {
    validFrom: cache.validFrom,
    validTo: cache.validTo,
  });
  const cover = cache.pages[0];
  if (!cover) throw new TypeError("validated catalog has no cover page");
  return {
    id: `catalog-${cache.storeId}-${cache.kw}-${cache.year}`,
    title: "Angebote der Woche",
    validFrom: cache.validFrom,
    validTo: cache.validTo,
    viewerUrl: cache.viewerUrl,
    pdfUrl: cache.pdfUrl,
    pageCount: cache.pageCount,
    coverUrl: cover.imageUrl,
    sourceUrl: cache.viewerUrl,
  };
}

export function mapFlyerPackageToFlyer(item: FlyerPackage): HomepageFlyer {
  return {
    id: item.id, title: item.title, validFrom: item.validFrom, validTo: item.validTo,
    viewerUrl: item.pdfPath, pdfUrl: item.pdfPath, coverUrl: item.coverPath,
    pageCount: item.pageNumbers.length, sourceUrl: item.pdfPath,
  };
}
