import { describe, expect, it } from "vitest";
import { calculateWorkdays, calculateRentalPeriods, calculateRentalPrice } from "@/lib/utils";

describe("NRW rental workdays", () => {
  it("counts Friday, Saturday and Monday across the October DST boundary", () => {
    expect(calculateWorkdays("2026-10-23", "2026-10-26")).toBe(3);
  });

  it("excludes German Unity Day even when it falls on Saturday", () => {
    expect(calculateWorkdays("2026-09-28", "2026-10-03")).toBe(5);
  });

  it.each([
    ["2026-01-01", "New Year"], ["2026-04-03", "Good Friday"],
    ["2026-04-06", "Easter Monday"], ["2026-05-01", "Labour Day"],
    ["2026-05-14", "Ascension"], ["2026-05-25", "Whit Monday"],
    ["2026-06-04", "Corpus Christi"], ["2026-10-03", "German Unity Day"],
    ["2025-11-01", "All Saints"], ["2026-12-25", "Christmas Day"],
    ["2026-12-26", "Second Christmas Day"],
  ])("does not count %s (%s) as a workday", (date) => {
    expect(calculateWorkdays(date, date)).toBe(0);
  });

  it("recalculates movable holidays for another Easter year", () => {
    expect(calculateWorkdays("2025-04-18", "2025-04-21")).toBe(1);
    expect(calculateWorkdays("2026-04-02", "2026-04-07")).toBe(3);
  });

  it.each(["2026-10-05", "2026-10-10", "2024-02-29"])("counts a same-day ordinary rental on %s", (date) => {
    expect(calculateWorkdays(date, date)).toBe(1);
  });

  it("does not exclude holidays that are not public holidays in NRW", () => {
    expect(calculateWorkdays("2026-01-06", "2026-01-06")).toBe(1);
    expect(calculateWorkdays("2026-10-31", "2026-10-31")).toBe(1);
  });

  it.each([
    ["", "2026-10-05"], ["bad", "2026-10-05"],
    ["2026-02-30", "2026-03-03"], ["2026-02-29", "2026-03-03"],
    ["2026-10-05T00:00:00Z", "2026-10-06"], ["2026-10-6", "2026-10-06"],
    ["2026-10-07", "2026-10-05"], ["2026-10-05", "bad"],
  ])("preserves invalid-range compatibility for %s to %s", (start, end) => {
    expect(calculateWorkdays(start, end)).toBe(0);
  });
});

describe("started three-workday blocks", () => {
  it.each([[1, 1], [3, 1], [4, 2], [6, 2], [7, 3]])("charges %i workdays as %i blocks", (days, blocks) => {
    expect(calculateRentalPeriods(days)).toBe(blocks);
    expect(calculateRentalPrice(12, days)).toBe(blocks * 12);
  });
});
