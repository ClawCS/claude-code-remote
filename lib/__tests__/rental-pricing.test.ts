import { describe, expect, it, vi } from "vitest";
import { quoteRentals as quote, type RentalSelection } from "@/lib/rental-pricing";
const line = (values: Partial<RentalSelection> = {}): RentalSelection => ({
  id: 20003, quantity: 1, startDate: "2026-10-05", endDate: "2026-10-07", ...values,
});

describe("canonical rental quotes", () => {
  it.each([
    ["2026-10-05", 1, 1, 1200], ["2026-10-07", 3, 1, 1200],
    ["2026-10-08", 4, 2, 2400], ["2026-10-10", 6, 2, 2400],
    ["2026-10-12", 7, 3, 3600],
  ])("charges the started blocks ending %s", (endDate, workdays, periods, totalCents) => {
    const result = quote([line({ endDate })]);
    expect(result).toMatchObject({ currency: "EUR", allPriced: true, totalCents, knownSubtotalCents: totalCents,
      lines: [{ name: "Stehtisch", workdays, periods, unitPriceCents: 1200, lineTotalCents: totalCents }] });
    expect(result.pricingVersion).toBeTruthy();
  });

  it("keeps fractional glass prices and quantities in integer cents", () => {
    const result = quote([line({ id: 20013, quantity: 7, endDate: "2026-10-08" }), line({ id: 20015, quantity: 3 })]);
    expect(result.lines).toMatchObject([{ unitPriceCents: 40, lineTotalCents: 560 }, { unitPriceCents: 40, lineTotalCents: 120 }]);
    expect(result.totalCents).toBe(680);
  });

  it("does not trust extra client price, name, workday or period fields", () => {
    const forged = { ...line({ quantity: 2 }), name: "Gratis", unitPriceCents: 0, lineTotalCents: 0, workdays: 0, periods: 0 };
    expect(quote([forged])).toMatchObject({ totalCents: 2400, lines: [{ name: "Stehtisch", workdays: 3, periods: 1, unitPriceCents: 1200 }] });
  });

  it("aggregates duplicate identity and date lines without mutating the input", () => {
    const items = Object.freeze([Object.freeze(line({ quantity: 2 })), Object.freeze(line({ quantity: 3 }))]);
    expect(quote(items)).toMatchObject({ totalCents: 6000, lines: [{ quantity: 5, lineTotalCents: 6000 }] });
    expect(quote(items).lines).toHaveLength(1);
    expect(items.map(item => item.quantity)).toEqual([2, 3]);
  });

  it("keeps unknown prices unknown while showing the known subtotal", () => {
    const result = quote([line(), line({ id: 20008, quantity: 2 })]);
    expect(result).toMatchObject({ totalCents: null, knownSubtotalCents: 1200, allPriced: false,
      lines: [{ lineTotalCents: 1200 }, { name: "Theke", unitPriceCents: null, lineTotalCents: null }] });
    expect(quote([line({ id: 20014 })])).toMatchObject({ totalCents: null, knownSubtotalCents: 0, allPriced: false });
  });

  it("uses inclusive dates and NRW holidays in the canonical quote", () => {
    expect(quote([line({ startDate: "2026-10-23", endDate: "2026-10-26" })]).lines[0].workdays).toBe(3);
    expect(quote([line({ startDate: "2026-09-28", endDate: "2026-10-03" })]).lines[0].workdays).toBe(5);
  });

  it("accepts same-day ordinary rentals and the maximum 366 calendar days", () => {
    expect(quote([line({ endDate: "2026-10-05" })]).totalCents).toBe(1200);
    expect(quote([line({ startDate: "2028-01-01", endDate: "2028-12-31" })]).allPriced).toBe(true);
  });
});

describe("quote validation", () => {
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects quantity %s", quantity => {
    expect(() => quote([line({ quantity })])).toThrow(/Menge/);
  });
  it.each([1001, 21000, 20003.5, NaN])("rejects unknown or invalid identity %s", id => {
    expect(() => quote([line({ id })])).toThrow(/Leihartikel/);
  });
  it.each([
    ["2026-02-30", "2026-03-03"], ["2026-02-29", "2026-03-03"],
    ["2026-10-05T00:00:00Z", "2026-10-07"], ["2026-10-5", "2026-10-07"],
    ["bad", "2026-10-07"], ["2026-10-05", "bad"], ["2026-10-08", "2026-10-07"],
  ])("rejects invalid dates %s to %s", (startDate, endDate) => {
    expect(() => quote([line({ startDate, endDate })])).toThrow(/zeitraum/i);
  });
  it.each(["2026-10-04", "2026-10-03", "2026-04-03"])("rejects a zero-workday rental on %s", date => {
    expect(() => quote([line({ startDate: date, endDate: date })])).toThrow(/Werktag/);
  });
  it("rejects ranges longer than 366 inclusive calendar days", () => {
    expect(() => quote([line({ startDate: "2028-01-01", endDate: "2029-01-01" })])).toThrow(/366/);
  });
  it("rejects empty, non-array and malformed selections with readable errors", () => {
    expect(() => quote([])).toThrow(/Leihartikel/);
    expect(() => quote(null as unknown as RentalSelection[])).toThrow(/Leihartikel/);
    expect(() => quote([null as unknown as RentalSelection])).toThrow(/Leihartikel/);
    expect(() => quote([line({ quantity: "1" as unknown as number })])).toThrow(/Menge/);
  });
  it("limits untrusted input to 50 rows before duplicate aggregation", () => {
    expect(() => quote(Array.from({ length: 51 }, () => line()))).toThrow(/50/);
    expect(quote(Array.from({ length: 50 }, () => line({ id: 20013 })))).toMatchObject({ lines: [{ quantity: 50 }], totalCents: 2000 });
  });
  it("permits historical quoting by default and prevents past pickup when requested", () => {
    expect(quote([line()], { today: "2026-10-06" }).allPriced).toBe(true);
    expect(() => quote([line()], { today: "2026-10-06", requireFuture: true })).toThrow(/Vergangenheit/);
    expect(quote([line()], { today: "2026-10-05", requireFuture: true }).allPriced).toBe(true);
  });
  it("rejects an invalid supplied today instead of bypassing future validation", () => {
    expect(() => quote([line()], { today: "not-a-date", requireFuture: true })).toThrow(/Datum/);
  });
  it("uses Berlin's calendar date for the future-check fallback", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-10-05T22:30:00Z"));
      expect(() => quote([line()], { requireFuture: true })).toThrow(/Vergangenheit/);
      expect(quote([line({ startDate: "2026-10-06" })], { requireFuture: true }).allPriced).toBe(true);
    } finally { vi.useRealTimers(); }
  });
});

describe("physical inventory across inclusive rental ranges", () => {
  it.each([
    [20001, 3], [20002, 4], [20003, 20], [20004, 3], [20005, 13], [20006, 44], [20007, 13],
    [20008, 2], [20009, 2], [20010, 3], [20011, 2], [20012, 1], [20013, 124], [20014, 33],
    [20015, 226], [20016, 402], [20017, 299], [20018, 58], [20019, 177], [20020, 23],
  ])("enforces canonical stock %i at %i", (id, quantity) => {
    expect(quote([line({ id, quantity })]).lines[0].quantity).toBe(quantity);
    expect(() => quote([line({ id, quantity: quantity + 1 })])).toThrow(/Bestand/);
  });
  it("rejects excess stock hidden in duplicate lines", () => {
    expect(() => quote([line({ id: 20001, quantity: 2 }), line({ id: 20001, quantity: 2 })])).toThrow(/Bestand/);
  });
  it("rejects overlap on the shared pickup/return boundary", () => {
    expect(() => quote([line({ id: 20001, quantity: 2 }), line({ id: 20001, quantity: 2, startDate: "2026-10-07", endDate: "2026-10-10" })])).toThrow(/Bestand/);
  });
  it("allows full stock on disjoint dates", () => {
    expect(quote([line({ id: 20001, quantity: 3 }), line({ id: 20001, quantity: 3, startDate: "2026-10-08", endDate: "2026-10-10" })]).lines).toHaveLength(2);
  });
  it("counts peak simultaneous occupancy, not every chained partial overlap", () => {
    const items = [line({ id: 20001 }), line({ id: 20001, startDate: "2026-10-08", endDate: "2026-10-10" }),
      line({ id: 20001, quantity: 2, startDate: "2026-10-06", endDate: "2026-10-09" })];
    expect(quote(items).lines).toHaveLength(3);
    expect(() => quote([...items, line({ id: 20001, startDate: "2026-10-08", endDate: "2026-10-08" })])).toThrow(/Bestand/);
  });
  it.each([20005, 20006])("does not combine set 20007 and single furniture %i on overlapping dates", id => {
    expect(() => quote([line({ id: 20007 }), line({ id })])).toThrow(/garnitur/i);
    expect(() => quote([line({ id }), line({ id: 20007, startDate: "2026-10-07", endDate: "2026-10-10" })])).toThrow(/garnitur/i);
    expect(quote([line({ id: 20007 }), line({ id, startDate: "2026-10-08", endDate: "2026-10-10" })]).lines).toHaveLength(2);
  });
  it("allows standalone table and bench pools concurrently", () => {
    expect(quote([line({ id: 20005, quantity: 13 }), line({ id: 20006, quantity: 44 })]).lines).toHaveLength(2);
  });
});
