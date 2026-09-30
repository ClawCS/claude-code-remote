import { expect, test } from "vitest";
import { getRentalItem, rentalToProduct } from "@/data/rentals";
import { addCartItem, assertRentalStock, maxRentalQuantity, parseStoredCart } from "@/lib/cart-items";
const rental = { startDate: "2026-10-05", endDate: "2026-10-07", workdays: 3, periods: 0, basePrice: 0, totalRentalPrice: 0 };
const table = rentalToProduct(getRentalItem(20005)!);
const bench = rentalToProduct(getRentalItem(20006)!);
const set = rentalToProduct(getRentalItem(20007)!);
test("set and single furniture do not claim independent overlapping physical pools", () => {
  const tables = addCartItem([], table, 13, rental);
  expect(maxRentalQuantity(tables, set.id, rental)).toBe(0);
  expect(addCartItem(tables, set, 13, rental)).toHaveLength(1);
  const sets = addCartItem([], set, 13, rental);
  expect(maxRentalQuantity(sets, table.id, rental)).toBe(0);
  expect(maxRentalQuantity(sets, bench.id, rental)).toBe(0);
  expect(() => assertRentalStock([...sets, { product: table, quantity: 13, rental }])).toThrow();
  expect(parseStoredCart([...sets, { product: bench, quantity: 44, rental }])).toHaveLength(1);
});
test("sets and single furniture on disjoint dates remain possible", () => {
  const tables = addCartItem([], table, 13, rental);
  expect(addCartItem(tables, set, 13, { ...rental, startDate: "2026-10-08", endDate: "2026-10-09" })).toHaveLength(2);
  expect(addCartItem(tables, bench, 44, rental)).toHaveLength(2);
});
