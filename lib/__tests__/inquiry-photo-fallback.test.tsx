import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { assortmentProducts } from "@/lib/catalog";

vi.mock("@/context/CartContext", () => ({ useCart: () => ({ items: [{ product: { ...assortmentProducts[0], image: "/images/home/brand-logo.webp" }, quantity: 1 }], removeItem: vi.fn(), updateQuantity: vi.fn(), clearCart: vi.fn() }) }));
vi.mock("next/link", async () => {
  const React = await import("react");
  return { default: ({ href, children }: { href: string; children: React.ReactNode }) => React.createElement("a", { href }, children) };
});
import WarenkorbPage from "@/app/warenkorb/page";

test("the inquiry page never presents the brand logo as a product photo", () => {
  const html = renderToStaticMarkup(<WarenkorbPage />);
  expect(html).toContain(assortmentProducts[0].name);
  expect(html).not.toContain("<img");
});
