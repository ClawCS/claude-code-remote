import { describe, expect, it } from "vitest";
import { assortmentProducts, assortmentUnit } from "@/lib/catalog";
import original from "@/data/products.json";

describe("historical product pool is an honest assortment", () => {
  it.each([
    ["Kasten 20 x 0,5 l (1l = €1,20)", "20 x 0,5 l"],
    ["inkl. Glas gratis. 20% Vol. 0,7l Flasche", "0,7l"],
    ["4+1 gratis = 625 g Packung", "625 g"],
    ["Krat = 20x0,5L / 24x0,33L", "20x0,5L / 24x0,33L"],
    ["", "Packungsgröße im Markt bestätigen"],
  ])("keeps only size facts from %s", (input, expected) => {
    expect(assortmentUnit(input)).toBe(expected);
  });
  it("preserves product identity but publishes no historical action, price or stock promises", () => {
    expect(assortmentProducts.map(p=>[p.id,p.slug,p.name])).toEqual(original.map(p=>[p.id,p.slug,p.name]));
    for (const product of assortmentProducts) {
      expect(`${product.unit} ${product.description}`).not.toMatch(/€|gratis|zugabe|im angebot|trinkgut app/i);
      expect(product.price).toBe(0);
      expect(product.originalPrice).toBeUndefined();
      expect(product.inStock).toBe(false);
      expect(product.image).toBe("/images/home/brand-logo.webp");
      expect(product.extractedImage).toBeUndefined();
    }
  });
});
