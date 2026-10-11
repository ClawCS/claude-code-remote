import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CocktailRecipePage from "@/app/cocktails/[slug]/page";
import { cocktailCatalog } from "@/lib/cocktail-routes";
import { getCocktailPhoto } from "@/data/cocktail-images";
import JsonLdScript from "@/components/JsonLdScript";
import { serializeJsonLd } from "@/lib/cinematic/metadata";

function structuredData(html: string) {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(([, json]) => JSON.parse(json));
}

describe("source-backed recipe structured data", () => {
  test("Mojito describes exactly its visible recipe and approved local photo", async () => {
    const html = renderToStaticMarkup(await CocktailRecipePage({ params: Promise.resolve({ slug: "mojito" }) }));
    const data = structuredData(html).find(item => item["@type"] === "Recipe");
    expect(data).toEqual({
      "@context": "https://schema.org", "@type": "Recipe", name: "Mojito", recipeCategory: "Rum",
      recipeIngredient: ["5 cl weißer Rum", "3 cl Limettensaft", "2 cl Zuckersirup", "6–8 Minzblätter", "Soda", "Crushed Ice"],
      recipeInstructions: "Minze und Limettensaft im Glas sanft andrücken. Rum und Sirup dazu, mit Crushed Ice auffüllen und mit Soda toppen. Vorsichtig umrühren.",
      image: "https://trinkgut-jammers.de/images/cocktails/mojito.webp",
    });
    expect(html).toContain("/images/cocktails/mojito.webp");
    for (const ingredient of data.recipeIngredient) expect(html).toContain(`<li>${ingredient}</li>`);
    expect(html).toContain(`<p class="text-muted leading-relaxed">${data.recipeInstructions}</p>`);
  });

  test.each(cocktailCatalog.recipes)("$slug emits only catalogue facts and real breadcrumbs", async (recipe) => {
    const html = renderToStaticMarkup(await CocktailRecipePage({ params: Promise.resolve({ slug: recipe.slug }) }));
    const data = structuredData(html);
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ "@type": "Recipe", name: recipe.cocktail.name, recipeCategory: recipe.cocktail.category, recipeIngredient: recipe.cocktail.ingredients, recipeInstructions: recipe.cocktail.instructions });
    expect(Object.keys(data[0]).sort()).toEqual(["@context", "@type", "name", "recipeCategory", "recipeIngredient", "recipeInstructions", ...(getCocktailPhoto(recipe.cocktail.name) ? ["image"] : [])].sort());
    if (!getCocktailPhoto(recipe.cocktail.name)) expect(data[0]).not.toHaveProperty("image");
    const category = cocktailCatalog.categories.find(item => item.name === recipe.cocktail.category)!;
    expect(data[1]).toEqual({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Start", item: "https://trinkgut-jammers.de/" },
      { "@type": "ListItem", position: 2, name: "Cocktail-Rezepte", item: "https://trinkgut-jammers.de/cocktails" },
      { "@type": "ListItem", position: 3, name: category.name, item: `https://trinkgut-jammers.de${category.href}` },
      { "@type": "ListItem", position: 4, name: recipe.cocktail.name, item: `https://trinkgut-jammers.de${recipe.href}` },
    ] });
  });

  test("builders omit unsupported photos and safely preserve hostile recipe text", async () => {
    const builders = await import("@/lib/recipe-structured-data").catch(() => null);
    expect(builders, "recipe builders must be implemented").not.toBeNull();
    if (!builders) return;
    const recipe = { ...cocktailCatalog.recipes[0].cocktail, name: "</script><script>alert(1)</script>", ingredients: ["<ingredient>"], instructions: "</script>" };
    const data = builders.buildRecipeJsonLd(recipe, undefined);
    expect(data).not.toHaveProperty("image");
    expect(JSON.parse(serializeJsonLd(data))).toMatchObject({ name: recipe.name, recipeIngredient: recipe.ingredients, recipeInstructions: recipe.instructions });
    const html = renderToStaticMarkup(<JsonLdScript value={data} />);
    expect(html.match(/<script\b/g)).toHaveLength(1);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).not.toContain("<ingredient>");
    const approved = getCocktailPhoto("Mojito")!;
    for (const photo of [{ ...approved, status: "pending" }, { ...approved, src: "https://example.com/photo.jpg" }, { ...approved, src: "/images/cocktails/unapproved.webp" }, { ...approved, name: "Different recipe" }]) {
      expect(builders.buildRecipeJsonLd(cocktailCatalog.recipes[0].cocktail, photo)).not.toHaveProperty("image");
    }
    const breadcrumbs = builders.buildBreadcrumbJsonLd([{ name: recipe.name, path: "/cocktails/mojito" }]);
    expect(JSON.parse(serializeJsonLd(breadcrumbs)).itemListElement[0].name).toBe(recipe.name);
    expect(renderToStaticMarkup(<JsonLdScript value={breadcrumbs} />).match(/<script\b/g)).toHaveLength(1);
    expect(() => builders.buildBreadcrumbJsonLd([{ name: "Hostile", path: "//example.com" }])).toThrow();
  });
});
