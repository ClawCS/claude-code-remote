import { describe, expect, it } from "vitest";
import type { CartItem } from "@/context/CartContext";
import { getRentalItem, rentalToProduct } from "@/data/rentals";
import { rentalCartQuote as quote, money } from "@/lib/rental-cart";
const rental = (id = 20003, quantity = 2): CartItem => ({
  product: rentalToProduct(getRentalItem(id)!), quantity,
  rental: { startDate: "2026-10-05", endDate: "2026-10-08", workdays: 0, periods: 0, basePrice: 0, totalRentalPrice: 0 },
});
const goods: CartItem = { product: { ...rental(20003).product, id: 123, name: "Getränk", category: "Bier", categorySlug: "bier", price: 42 }, quantity: 3 };

describe("canonical cart rental quote", () => {
  it("recomputes zeroed inquiry prices and stale workdays from only ID, quantity and dates", () => {
    const items = Object.freeze([Object.freeze(rental())]);
    expect(quote(items)).toMatchObject({ onlyRentals: true, error: "", selection: [{ id: 20003, quantity: 2, startDate: "2026-10-05", endDate: "2026-10-08" }],
      quote: { totalCents: 4800, lines: [{ workdays: 4, periods: 2, unitPriceCents: 1200, lineTotalCents: 4800 }] } });
    expect(items[0].rental!.totalRentalPrice).toBe(0);
  });
  it("returns no rental quote for empty or goods-only lists", () => {
    expect(quote([])).toEqual({ selection: [], quote: null, error: "", onlyRentals: false });
    expect(quote([goods])).toEqual({ selection: [], quote: null, error: "", onlyRentals: false });
  });
  it("quotes the rentals in a mixed list without making the whole list payable", () => {
    expect(quote([rental(), goods])).toMatchObject({ onlyRentals: false, error: "", quote: { totalCents: 4800 } });
    expect(quote([rental(), goods]).selection).toHaveLength(1);
  });
  it("retains unknown prices instead of presenting a zero-price rental", () => {
    expect(quote([rental(), rental(20008, 1)])).toMatchObject({ onlyRentals: true, error: "", quote: { totalCents: null, knownSubtotalCents: 4800, allPriced: false } });
  });
  it("catches invalid rental dates with a customer-readable error", () => {
    const item = rental(); item.rental!.endDate = "2026-02-30";
    expect(quote([item])).toMatchObject({ onlyRentals: true, quote: null });
    expect(quote([item]).error).toMatch(/zeitraum/i);
  });
  it("does not silently treat a canonical rental missing its date data as goods", () => {
    const item = rental(); delete item.rental;
    expect(quote([item])).toMatchObject({ onlyRentals: true, quote: null });
    expect(quote([item]).error).toMatch(/zeitraum/i);
  });
  it("rejects an unknown rental identity and stock overbooking", () => {
    expect(quote([{ ...rental(), product: { ...rental().product, id: 1001 } }]).error).toMatch(/Leihartikel/);
    expect(quote([rental(20001, 4)]).error).toMatch(/Bestand/);
  });
  it("formats integer cents and preserves unknown prices in the display helper", () => {
    expect(money(40)).toContain("0,40");
    expect(money(4800)).toContain("48,00");
    expect(money(null)).toBe("Preis auf Anfrage");
  });
});
