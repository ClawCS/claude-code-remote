import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/context/CartContext", () => ({ useCart: () => ({ addItem: vi.fn() }) }));
vi.mock("@/context/WishlistContext", () => ({ useWishlist: () => ({ toggleItem: vi.fn(), isInWishlist: () => false }) }));
vi.mock("next/link", async () => {
  const React = await import("react");
  return { default: ({ href, children }: { href: string; children: React.ReactNode }) => React.createElement("a", { href }, children) };
});
import ProductCard from "@/components/ProductCard";
import { assortmentProducts as products } from "@/lib/catalog";

describe("catalog cards without verified product photos", () => {
  test("keep the wishlist and inquiry controls without a logo or emoji picture", () => {
    const html = renderToStaticMarkup(<ProductCard product={{ ...products[0], image: "/images/home/brand-logo.webp" }} />);
    expect(html).toContain('aria-label="Zum Merkzettel"');
    expect(html).toContain("Anfragen");
    expect(html).not.toContain("<img");
    expect(html).toContain(`href="/produkte/${products[0].slug}"`);
  });
});
