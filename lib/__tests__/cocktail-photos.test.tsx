import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RecipeGrid } from "@/components/recipes/RecipeCollection";
import { cocktailCatalog } from "@/lib/cocktail-routes";
import { getCocktailPhoto } from "@/data/cocktail-images";
import catalogue from "@/data/cocktail-photo-candidates.json";
import CocktailRecipePage from "@/app/cocktails/[slug]/page";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

describe("licensed cocktail photography", () => {
  test("shows the individually licensed Lillet Vive brand photograph and its primary CC BY 3.0 credit", () => {
    const recipe = cocktailCatalog.recipes.find(({ cocktail }) => cocktail.name === "Lillet Vive")!;
    const html = renderToStaticMarkup(<RecipeGrid recipes={[recipe]} />);
    expect(html).toContain('data-cocktail-photo="Lillet Vive"');
    expect(html).toContain("mynewsdesk.com/de/pernod-ricard-deutschland/images/lillet-vive-792978");
    expect(html).toContain("Pernod Ricard Deutschland");
    expect(html).toContain("CC BY 3.0");
    expect(html).toContain("creativecommons.org/licenses/by/3.0");
  });

  test.each(["Gin Fizz", "Bramble", "Aviation", "French 75", "Bee's Knees", "Hugo", "Campari Spritz", "Bellini", "Kir Royal", "Rossini", "Americano", "Limoncello Spritz", "Margarita", "Paloma", "Tequila Sunrise"])("renders the newly reviewed %s photo with source and license on its recipe card", (name) => {
    const recipe = cocktailCatalog.recipes.find(({ cocktail }) => cocktail.name === name)!;
    const html = renderToStaticMarkup(<RecipeGrid recipes={[recipe]} />);
    expect(html).toContain(`data-cocktail-photo="${name.replace(/'/g, "&#x27;")}"`);
    expect(html).toContain("commons.wikimedia.org/wiki/");
    expect(html).toMatch(/CC BY|CC0|Public domain/);
    expect(html).toContain("Foto &amp; Lizenz");
  });

  test("does not publish an unsupported Zombie variation without the recipe's grenadine presentation", () => {
    expect(getCocktailPhoto("Zombie")).toBeUndefined();
    expect(catalogue.unresolved.find(photo => photo.name === "Zombie")?.reason).toContain("grenadine");
  });

  test("does not substitute the rejected mineral-water bottle photograph for the Ranch Water recipe", () => {
    const recipe = cocktailCatalog.recipes.find(({ cocktail }) => cocktail.name === "Ranch Water")!;
    const html = renderToStaticMarkup(<RecipeGrid recipes={[recipe]} />);
    expect(getCocktailPhoto("Ranch Water")).toBeUndefined();
    expect(html).not.toContain('data-cocktail-photo="Ranch Water"');
    expect(html).toContain('href="/cocktails/ranch-water"');
    expect(catalogue.unresolved.find(photo => photo.name === "Ranch Water")?.reason).toContain("bottle");
  });

  test("shows the Daiquiri photograph with creator, original source and reusable license instead of an empty card", () => {
    const recipe = cocktailCatalog.recipes.find(({ cocktail }) => cocktail.name === "Daiquiri")!;
    const html = renderToStaticMarkup(<RecipeGrid recipes={[recipe]} />);
    const image = html.match(/<img\b[^>]*src="([^"]+)"/);
    expect(decodeURIComponent(image?.[1] ?? "")).toContain("/images/cocktails/daiquiri.webp");
    expect(html).toContain("Will Shenton");
    expect(html).toContain("https://commons.wikimedia.org/wiki/File:Classic_Daiquiri_in_Cocktail_Glass.jpg");
    expect(html).toContain("https://creativecommons.org/licenses/by-sa/3.0");
    expect(html).toContain("CC BY-SA 3.0");
    expect(html).toContain("object-contain");
    expect(html).toContain('href="/cocktails/daiquiri"');
  });

  test("never exposes a pending or rejected candidate as a recipe photo", () => {
    for (const photo of catalogue.photos.filter(item => item.status !== "approved")) {
      expect(getCocktailPhoto(photo.name), photo.name).toBeUndefined();
    }
    expect(getCocktailPhoto("Nicht belegtes Beispielmotiv")).toBeUndefined();
  });

  test("the public photo directory contains approved derivatives only", () => {
    const approvedFiles = catalogue.photos.filter(photo => photo.status === "approved").map(photo => path.basename(photo.src)).sort();
    expect(readdirSync(path.join(process.cwd(), "public/images/cocktails")).sort()).toEqual(approvedFiles);
  });

  test("accounts for every recipe without calling unresolved photo work complete", () => {
    const names = [
      ...catalogue.photos.filter(photo => photo.status === "approved").map(photo => photo.name),
      ...catalogue.unresolved.map(photo => photo.name),
    ].sort();
    expect(names).toEqual(cocktailCatalog.recipes.map(recipe => recipe.cocktail.name).sort());
    for (const photo of catalogue.unresolved) expect(photo.reason.trim().length).toBeGreaterThan(20);
  });

  test("keeps recipe details usable and places the full credit directly below the photo", async () => {
    const html = renderToStaticMarkup(await CocktailRecipePage({ params: Promise.resolve({ slug: "daiquiri" }) }));
    expect(html).toContain('data-cocktail-photo="Daiquiri"');
    expect(html).toContain("Will Shenton");
    expect(html).toContain("Auch die Webfassung steht unter dieser Lizenz.");
    expect(html).not.toContain("<details");
    expect(html).toContain("Zutaten");
    expect(html).toContain("Zubereitung");
  });

  test("every approved photo is unique, licensed, hash-bound and locally decodable at its recorded size", async () => {
    const photos = catalogue.photos.filter(item => item.status === "approved");
    expect(photos.length).toBeGreaterThan(0);
    expect(new Set(photos.map(photo => photo.name)).size).toBe(photos.length);
    for (const photo of photos) {
      expect(cocktailCatalog.recipes.some(item => item.cocktail.name === photo.name), photo.name).toBe(true);
      expect(photo.src).toMatch(/^\/images\/cocktails\/[a-z0-9-]+\.webp$/);
      expect(photo.sourceUrl).toMatch(/^https:\/\//);
      expect(photo.creator.trim().length).toBeGreaterThan(0);
      expect(photo.license).toMatch(/^(CC BY(?:-SA)? [234]\.0|CC0|Public domain)/);
      if (photo.license.startsWith("CC BY")) expect(photo.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\/licenses\//);
      const bytes = readFileSync(path.join(process.cwd(), "public", photo.src));
      expect(createHash("sha256").update(bytes).digest("hex"), photo.name).toBe(photo.sha256);
      const metadata = await sharp(bytes).metadata();
      expect(metadata.format).toBe("webp");
      expect(metadata.width).toBe(photo.width);
      expect(metadata.height).toBe(photo.height);
      expect(metadata.exif).toBeUndefined();
      expect(metadata.xmp).toBeUndefined();
    }
  });
});
