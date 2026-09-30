import rawProducts from "@/data/products.json";
import type { Product } from "@/lib/utils";

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
