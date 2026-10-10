import type { Metadata } from "next";
import { RecipeCategories, RecipeGrid, RecipeIntro } from "@/components/recipes/RecipeCollection";
import { cocktailCatalog } from "@/lib/cocktail-routes";
import styles from "@/components/editorial/learning.module.css";

export const metadata: Metadata = {
  title: "Cocktail-Rezepte",
  description: "65 Cocktail-Rezepte mit Zutaten, Zubereitung und Tipps. Entdecke Klassiker und neue Drinks in sechs Kategorien bei trinkgut Jammers.",
  alternates: { canonical: "/cocktails" },
};

export default function CocktailsPage() {
  return (
    <>
      <RecipeIntro title="Cocktail-Rezepte" description={`${cocktailCatalog.recipes.length} Rezepte in ${cocktailCatalog.categories.length} Kategorien – mit Zutaten, Zubereitung und Tipps für deinen nächsten Drink.`} />
      <div data-learning="recipes" className={styles.body}>
        <RecipeCategories />
        <RecipeGrid recipes={cocktailCatalog.recipes} />
      </div>
    </>
  );
}
