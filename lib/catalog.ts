import rawProducts from "@/data/products.json";
import type { Product } from "@/lib/utils";
import { berlinDateKey } from "@/lib/editorial-schedule";

type DatedSource = { id: string; language: string; validFrom: string; validTo: string; pdfUrl?: string; pdfSha256?: string };
type DatedOffer = Omit<DatedSource, "id"> & { flyerId: string; categorySlug: string; sourceUrl?: string };

/** A crop never outlives its validated original, even when an old tab is open. */
export function selectWeeklyOffers<T extends DatedOffer>(offers: readonly T[], flyers: readonly DatedSource[], now = new Date(), category?: string): T[] {
  const today = berlinDateKey(now);
  return offers.filter(offer => (!category || offer.categorySlug === category)
    && offer.validFrom <= today && today <= offer.validTo
    && flyers.some(flyer => flyer.id === offer.flyerId && flyer.language === offer.language
      && flyer.validFrom === offer.validFrom && flyer.validTo === offer.validTo
      && Boolean(offer.pdfSha256) && flyer.pdfSha256 === offer.pdfSha256
      && flyer.validFrom <= today && today <= flyer.validTo));
}

/** Historical flyers are a product pool, never a current price/stock source. */
export function assortmentUnit(unit: string): string {
  const text = unit.replace(/\([^)]*\)/g, "");
  const sizes = text.match(/\b(?:\d+\s*[x×]\s*)?\d+(?:[,.]\d+)?\s*(?:ml|cl|ltr|l|kg|g)\b/gi) ?? [];
  return [...new Set(sizes.map(size => size.trim()))].join(" / ") || "Packungsgröße im Markt bestätigen";
}

export const assortmentProducts: Product[] = rawProducts.map(product => {
  const unit = assortmentUnit(product.unit);
  return {
    ...product,
    origin: product.origin === "DE" || product.origin === "NL" ? product.origin : undefined,
    // The old crop pixels include expired prices and free-gift promises.
    image: "/images/home/brand-logo.webp",
    extractedImage: undefined,
    unit,
    description: `${product.name} – ${unit}. Sortimentsbeispiel; Auswahl und Verfügbarkeit nach Absprache.`,
    price: 0,
    originalPrice: undefined,
    inStock: false,
    highlight: false,
  };
});
