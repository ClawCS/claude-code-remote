import { describe, expect, it } from "vitest";
import { cocktails } from "@/data/cocktails";
import { buildCocktailCatalog, cocktailCatalog, findCocktail, findCocktailCategory } from "@/lib/cocktail-routes";

describe("cocktail route catalog", () => {
  it("exposes all recipes without losing their original preparation data", () => {
    expect(cocktailCatalog.recipes).toHaveLength(65);
    for (const recipe of cocktailCatalog.recipes) {
      expect(recipe.cocktail).toBe(cocktails.find((item) => item.name === recipe.cocktail.name));
      expect(findCocktail(recipe.slug)).toBe(recipe);
    }
  });

  it.each([
    ["mojito", "Mojito"],
    ["pi-a-colada", "Piña Colada"],
    ["dark-n-stormy", "Dark 'n' Stormy"],
    ["jack-coke", "Jack & Coke"],
    ["tommy-s-margarita", "Tommy's Margarita"],
  ])("resolves canonical recipe slug %s", (slug, name) => {
    expect(findCocktail(slug)?.cocktail.name).toBe(name);
    expect(findCocktail(slug)?.href).toBe(`/cocktails/${slug}`);
  });

  it("resolves category routes to only their own recipes", () => {
    const rum = findCocktailCategory("rum");
    expect(rum?.href).toBe("/cocktails/kategorie/rum");
    expect(rum?.recipes).toHaveLength(12);
    expect(rum?.recipes.every((recipe) => recipe.cocktail.category === "Rum")).toBe(true);
    expect(cocktailCatalog.categories).toHaveLength(6);
  });

  it.each(["unknown", "", "Mojito", "__proto__", "constructor"])("rejects unknown or noncanonical recipe slug %s", (slug) => {
    expect(findCocktail(slug)).toBeUndefined();
  });

  it.each(["unknown", "", "Rum", "__proto__"])("rejects unknown or noncanonical category slug %s", (slug) => {
    expect(findCocktailCategory(slug)).toBeUndefined();
  });

  it("rejects colliding recipe slugs instead of silently opening another recipe", () => {
    expect(() => buildCocktailCatalog([
      { ...cocktails[0], name: "A & B" },
      { ...cocktails[1], name: "A-B" },
    ])).toThrow(/duplicate recipe slug/i);
  });

  it("rejects colliding category slugs instead of merging different categories", () => {
    expect(() => buildCocktailCatalog([
      { ...cocktails[0], category: "A & B" },
      { ...cocktails[1], category: "A-B" },
    ])).toThrow(/duplicate category slug/i);
  });
});
