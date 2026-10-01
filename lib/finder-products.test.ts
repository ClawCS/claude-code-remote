import { describe, expect, it } from "vitest";
import { assortmentProducts } from "@/lib/catalog";
import { filterFinderProducts } from "@/lib/finder-products";
import type { Product } from "@/lib/utils";

function product(name: string, categorySlug = "bier"): Product {
  return { ...assortmentProducts[0], name, categorySlug, description: name };
}

describe("finder uses explicit catalog evidence without fallback", () => {
  it("does not offer sparkling wine for dry red wine in the real catalog", () => {
    expect(filterFinderProducts(assortmentProducts, "wein", ["rot", "trocken"])).toEqual([]);
  });

  it.each(["sprudel", "medium", "still"])("returns no water when %s carbonation is not documented", carbonation => {
    expect(filterFinderProducts(assortmentProducts, "wasser", [carbonation, "egal"])).toEqual([]);
  });

  it("matches Altbier, not Altenmünster or a combined Alt/blue offer", () => {
    expect(filterFinderProducts(assortmentProducts, "bier", ["alt", "any"]).map(p => p.name)).toEqual(["Bolten Altbier"]);
  });

  it("does not mutate or replace matching catalog records", () => {
    const match = product("Pils");
    const pool = [match, product("Altbier")];
    expect(filterFinderProducts(pool, "bier", ["pils", "any"])).toEqual([match]);
    expect(pool).toHaveLength(2);
  });

  it.each([
    ["pils", "Pilsener"], ["weizen", "Weißbier"], ["alt", "Altbier"], ["lager", "Helles Vollbier"],
  ])("accepts the explicit %s beer style in %s", (style, name) => {
    const match = product(name);
    expect(filterFinderProducts([match], "bier", [style, "any"])).toEqual([match]);
  });

  it.each(["Altenmünster Urig Würzig", "Altbier oder Pils", "Frankenheim Alt o. blue", "Altbier / Radler", "Altbier & Pils"])("does not claim Alt for %s", name => {
    expect(filterFinderProducts([product(name)], "bier", ["alt", "any"])).toEqual([]);
  });

  it("does not widen an unavailable beer style to the whole beer category", () => {
    expect(filterFinderProducts([product("Pils")], "bier", ["weizen", "any"])).toEqual([]);
  });

  it.each(["Pils alkoholfrei", "Pils 0,0 %", "Pils 0.0%"])("accepts positively documented alcohol-free beer: %s", name => {
    const match = product(name);
    expect(filterFinderProducts([match], "bier", ["pils", "alcohol-free"])).toEqual([match]);
    expect(filterFinderProducts([match], "bier", ["pils", "classic"])).toEqual([]);
  });

  it.each(["Pils 4,8 % vol.", "Pils 10,0 % vol."])("requires positive alcohol evidence for classic instead of assuming from absence: %s", name => {
    const classic = product(name);
    expect(filterFinderProducts([product("Pils"), classic], "bier", ["pils", "classic"])).toEqual([classic]);
  });

  it("rejects combined classic/alcohol-free beer variants", () => {
    const mixed = product("Helles, Helles 0,0% o. Zitronken");
    expect(filterFinderProducts([mixed], "bier", ["lager", "alcohol-free"])).toEqual([]);
    expect(filterFinderProducts([mixed], "bier", ["lager", "classic"])).toEqual([]);
  });

  it.each([
    ["rot", "trocken", "Rotwein trocken"],
    ["weiss", "halbtrocken", "Weißwein halbtrocken"],
    ["rose", "lieblich", "Rosé lieblich"],
  ])("accepts only explicit %s / %s wine evidence", (color, taste, name) => {
    const match = product(name, "wein");
    expect(filterFinderProducts([match], "wein", [color, taste])).toEqual([match]);
  });

  it.each([
    ["Rotwein trocken", "sekt"], ["Rot-Käppchen", "sekt"], ["Oberrotweiler trocken", "wein"],
    ["Pinot Noir trocken", "wein"], ["Rotwein halbtrocken", "wein"], ["Rotwein lieblich", "wein"],
    ["Rotwein oder Weißwein trocken", "wein"], ["Rotwein trocken / halbtrocken", "wein"],
    ["Rotwein", "wein"],
  ])("rejects an unproven dry red selection for %s (%s)", (name, category) => {
    expect(filterFinderProducts([product(name, category)], "wein", ["rot", "trocken"])).toEqual([]);
  });

  it("keeps Sekt separate from non-sparkling wine", () => {
    const match = product("Sekt trocken", "sekt");
    expect(filterFinderProducts([match, product("Rotwein trocken", "wein")], "wein", ["sekt", "trocken"])).toEqual([match]);
  });

  it.each(["Prosecco", "Sekt demi-sec", "Brut Dargent Ice Chardonnay & Pinot Noir", "Sekt"])("does not infer dry from a substring, brand, or missing taste: %s", name => {
    expect(filterFinderProducts([product(name, "sekt")], "wein", ["sekt", "trocken"])).toEqual([]);
  });

  it.each([
    ["sprudel", "glas", "Mineralwasser Classic Glasflasche"],
    ["medium", "pet", "Mineralwasser Medium PET-Flasche"],
    ["still", "egal", "Mineralwasser Still"],
  ])("accepts explicit plain-water %s / %s evidence", (carbonation, material, name) => {
    const match = product(name, "alkoholfrei");
    expect(filterFinderProducts([match], "wasser", [carbonation, material])).toEqual([match]);
  });

  it.each([
    "Cola Classic", "Quelle Limonade Classic", "Tonic Water Classic", "Mineralwasser Medium",
    "Mineralwasser", "Mineralwasser Classic / Still", "Mineralwasser Classic mit Zitrone", "Mineralwasser Classic mit Geschmack",
  ])("does not turn %s into plain sparkling water", name => {
    expect(filterFinderProducts([product(name, "alkoholfrei")], "wasser", ["sprudel", "egal"])).toEqual([]);
  });

  it.each([["glas", "Mehrweg"], ["pet", "Einweg"]])("does not infer %s from %s", (material, depositType) => {
    expect(filterFinderProducts([product(`Mineralwasser Classic ${depositType}`, "alkoholfrei")], "wasser", ["sprudel", material])).toEqual([]);
  });

  it("does not widen a missing material match or merge conflicting materials", () => {
    const pool = [product("Mineralwasser Classic PET", "alkoholfrei"), product("Mineralwasser Classic Glas / PET", "alkoholfrei")];
    expect(filterFinderProducts(pool, "wasser", ["sprudel", "glas"])).toEqual([]);
  });

  it("returns empty for incomplete or unknown hard preferences", () => {
    const pool = [product("Pils")];
    expect(filterFinderProducts(pool, null, [])).toEqual([]);
    expect(filterFinderProducts(pool, "bier", [])).toEqual([]);
    expect(filterFinderProducts(pool, "bier", ["unknown", "any"])).toEqual([]);
    expect(filterFinderProducts(pool, "bier", ["pils", "unknown"])).toEqual([]);
  });
});
