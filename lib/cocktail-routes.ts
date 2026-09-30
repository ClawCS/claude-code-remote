import { cocktails, type Cocktail } from "@/data/cocktails";
import { createSlug } from "@/lib/utils";

export type CocktailRecipeRoute = { slug: string; href: string; cocktail: Cocktail };
export type CocktailCategoryRoute = { name: string; slug: string; href: string; recipes: CocktailRecipeRoute[] };
export function buildCocktailCatalog(source: Cocktail[]): { recipes: CocktailRecipeRoute[]; categories: CocktailCategoryRoute[] } {
  const recipeSlugs = new Set<string>();
  const categoryMap = new Map<string, CocktailCategoryRoute>();
  const recipes = source.map((cocktail) => {
    const slug = createSlug(cocktail.name);
    if (recipeSlugs.has(slug)) throw new Error(`Duplicate recipe slug: ${slug}`);
    recipeSlugs.add(slug);
    const recipe = { slug, href: `/cocktails/${slug}`, cocktail };
    const categorySlug = createSlug(cocktail.category);
    let category = categoryMap.get(categorySlug);
    if (category && category.name !== cocktail.category) throw new Error(`Duplicate category slug: ${categorySlug}`);
    if (!category) {
      category = { name: cocktail.category, slug: categorySlug, href: `/cocktails/kategorie/${categorySlug}`, recipes: [] };
      categoryMap.set(categorySlug, category);
    }
    category.recipes.push(recipe);
    return recipe;
  });
  return { recipes, categories: [...categoryMap.values()] };
}
export const cocktailCatalog = buildCocktailCatalog(cocktails);
export function findCocktail(slug: string): CocktailRecipeRoute | undefined {
  return cocktailCatalog.recipes.find((recipe) => recipe.slug === slug);
}
export function findCocktailCategory(slug: string): CocktailCategoryRoute | undefined {
  return cocktailCatalog.categories.find((category) => category.slug === slug);
}
