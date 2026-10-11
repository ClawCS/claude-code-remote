import type { Cocktail } from "@/data/cocktails";
import { getCocktailPhoto, type CocktailPhoto } from "@/data/cocktail-images";
import { SEARCH_ORIGIN } from "@/lib/search-metadata";

/** Only the recipe's reviewed local photograph can describe it to search consumers. */
export function buildRecipeJsonLd(recipe: Cocktail, photo: CocktailPhoto | undefined) {
  const image = photo?.status === "approved" && photo.name === recipe.name && photo.src === getCocktailPhoto(recipe.name)?.src && /^\/images\/cocktails\/[a-z0-9-]+\.webp$/.test(photo.src)
    ? `${SEARCH_ORIGIN}${photo.src}` : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
    recipeCategory: recipe.category,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.instructions,
    ...(image ? { image } : {}),
  };
}

export function buildBreadcrumbJsonLd(items: readonly { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, index) => {
      if (!path.startsWith("/") || path.startsWith("//") || /[?#]/.test(path) || new URL(path, SEARCH_ORIGIN).href !== `${SEARCH_ORIGIN}${path}`) {
        throw new TypeError("Expected an own-page breadcrumb path");
      }
      return { "@type": "ListItem", position: index + 1, name, item: `${SEARCH_ORIGIN}${path}` };
    }),
  };
}
