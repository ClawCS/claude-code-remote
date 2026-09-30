import type { Metadata } from "next";
import { RecipeCategories, RecipeGrid, RecipeIntro } from "@/components/recipes/RecipeCollection";
import { cocktailCatalog } from "@/lib/cocktail-routes";

export const metadata: Metadata = {
  title: "Cocktail-Rezepte",
  description: "65 Cocktail-Rezepte mit Zutaten, Zubereitung und Tipps. Entdecke Klassiker und neue Drinks in sechs Kategorien bei trinkgut Jammers.",
  alternates: { canonical: "/cocktails" },
};

export default function CocktailsPage() {
  return (
    <>
      <RecipeIntro title="Cocktail-Rezepte" description={`${cocktailCatalog.recipes.length} Rezepte in ${cocktailCatalog.categories.length} Kategorien – mit Zutaten, Zubereitung und Tipps für deinen nächsten Drink.`} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <RecipeCategories />
        <RecipeGrid recipes={cocktailCatalog.recipes} />
      </div>
    </>
  );
}
