import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeCategories, RecipeGrid, RecipeIntro } from "@/components/recipes/RecipeCollection";
import { cocktailCatalog, findCocktailCategory } from "@/lib/cocktail-routes";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return cocktailCatalog.categories.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = findCocktailCategory((await params).slug);
  if (!category) notFound();
  return { title: `Cocktails mit ${category.name}`, description: `${category.recipes.length} Cocktail-Rezepte mit ${category.name}: Zutaten, Zubereitung und Tipps.`, alternates: { canonical: category.href } };
}
export default async function CocktailCategoryPage({ params }: Props) {
  const category = findCocktailCategory((await params).slug);
  if (!category) notFound();
  return (
    <>
      <RecipeIntro title={`Cocktails mit ${category.name}`} description={`${category.recipes.length} Rezepte mit ${category.name}. Entdecke die Zutaten, Zubereitung und Tipps für deinen nächsten Drink.`} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <RecipeCategories activeSlug={category.slug} />
        <RecipeGrid recipes={category.recipes} />
      </div>
    </>
  );
}
