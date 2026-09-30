import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
vi.mock("@/context/WishlistContext", () => ({ useWishlist: () => ({ items: [{ id: 1 }], clearWishlist: vi.fn() }) }));
vi.mock("@/context/CartContext", () => ({ useCart: () => ({ addItem: vi.fn() }) }));
vi.mock("@/components/ProductGrid", () => ({ default: () => null }));
import MerkzettelPage from "@/app/merkzettel/page";
test("wishlist page preserves the old useful bulk actions", () => {
  const html = renderToStaticMarkup(<MerkzettelPage />);
  expect(html).toContain("Alle zur Anfrageliste");
  expect(html).toContain("Merkzettel leeren");
});
