import { describe, expect, it } from "vitest";
import { assortmentProducts } from "@/lib/catalog";
import { calculateNeeds, distributionValidity, getRecommendations } from "@/lib/party-planner";

const defaults = { guests: 20, duration: 5, beerDrinkers: 50, wineDrinkers: 20, softDrinkers: 20, spiritDrinkers: 10 };
describe("party drink planning", () => {
  it.each([
    [0, 0, 0, 0, 0, false], [45, 20, 20, 10, 95, false],
    [55, 20, 20, 10, 105, false], [100, 100, 100, 100, 400, false],
    [50, 20, 20, 10, 100, true], [-5, 105, 0, 0, 100, false],
    [NaN, 20, 20, 10, NaN, false], [Infinity, 20, 20, 10, Infinity, false],
  ])("validates finite, bounded shares %j/%j/%j/%j", (beerDrinkers, wineDrinkers, softDrinkers, spiritDrinkers, total, valid) => {
    expect(distributionValidity({ ...defaults, beerDrinkers: Number(beerDrinkers), wineDrinkers: Number(wineDrinkers), softDrinkers: Number(softDrinkers), spiritDrinkers: Number(spiritDrinkers) })).toEqual({ total, valid });
  });
  it("keeps the consumption model and recommends three reviewed plain-water cases for twenty liters", () => {
    const needs = calculateNeeds(defaults);
    expect(needs.totalDrinks).toBe(200);
    expect(needs.waterLiters).toBe(20);
    const water = getRecommendations(needs, assortmentProducts).filter(rec => rec.reason.endsWith(" Wasser"));
    expect(water.map(rec => [rec.product.id, rec.quantity])).toEqual([[71, 3]]);
  });
  it("does not turn tea, vitamin drinks or refreshment brands into water when no evidenced water exists", () => {
    const falseWater = assortmentProducts.filter(product => [60, 65].includes(product.id));
    expect(getRecommendations(calculateNeeds(defaults), falseWater).filter(rec => rec.reason.endsWith(" Wasser"))).toEqual([]);
  });
  it("keeps water liters non-cartable when its reviewed product has no usable volume", () => {
    const water = assortmentProducts.find(product => product.id === 71)!;
    const invalidVolume = { ...water, unit: "Packungsgröße im Markt bestätigen", description: water.name };
    expect(getRecommendations(calculateNeeds(defaults), [invalidVolume]).filter(rec => rec.reason.endsWith(" Wasser"))).toEqual([]);
  });
  it("omits categories with zero share", () => {
    const needs = calculateNeeds({ ...defaults, beerDrinkers: 0, wineDrinkers: 0, spiritDrinkers: 0, softDrinkers: 100 });
    expect(getRecommendations(needs, assortmentProducts).map(rec => rec.reason)).toEqual(["~50 l Softdrinks", "~20 l Wasser"]);
  });
});
