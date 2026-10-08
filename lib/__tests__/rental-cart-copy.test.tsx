import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/context/CartContext", async () => {
  const { getRentalItem, rentalToProduct } = await import("@/data/rentals");
  return {
    useCart: () => ({
      items: [{ product: rentalToProduct(getRentalItem(20001)!), quantity: 1,
        rental: { startDate: "2026-10-12", endDate: "2026-10-14", workdays: 3, periods: 0, basePrice: 0, totalRentalPrice: 0 } }],
      addItem: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn(), clearCart: vi.fn(),
      totalItems: 1, totalPrice: 0, isCartOpen: true, setIsCartOpen: vi.fn(), quantityError: "",
    }),
  };
});

import WarenkorbPage from "@/app/warenkorb/page";
import CartDrawer from "@/components/CartDrawer";

describe("active rental inquiry copy", () => {
  it.each([["cart page", WarenkorbPage], ["cart drawer", CartDrawer]] as const)("keeps fully priced rentals an inquiry in the %s", (_, Component) => {
    const html = renderToStaticMarkup(<Component />);
    expect(html).toMatch(/href="\/checkout"[^>]*>Unverbindlich anfragen<\/a>/);
    expect(html).toContain("Zahlung bei Abholung");
    expect(html).not.toMatch(/Onlinezahlung|Zur Bestellung|Zahlung erst danach|bezahlt wird erst danach/);
    expect(html).toContain("Mietgesamtpreis");
    expect(html).toContain("150,00");
  });

  it("gives the confirmed pickup and deposit rules without removing personal confirmation", () => {
    const html = renderToStaticMarkup(<WarenkorbPage />);
    expect(html).toContain("Nur Abholung im Markt von 9–19 Uhr");
    expect(html).toContain("keine Kaution");
    expect(html).toContain("Termin und Verfügbarkeit bestätigen wir persönlich.");
  });
});
