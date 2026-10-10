import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCocktailPhoto } from "@/data/cocktail-images";
import CocktailPhoto from "@/components/recipes/CocktailPhoto";
import { RecipeIntro } from "@/components/recipes/RecipeCollection";
import { cocktailCatalog, findCocktail } from "@/lib/cocktail-routes";
import styles from "@/components/editorial/learning.module.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return cocktailCatalog.recipes.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = findCocktail((await params).slug);
  if (!recipe) notFound();
  return { title: `${recipe.cocktail.name} – Cocktail-Rezept`, description: `${recipe.cocktail.name}: ${recipe.cocktail.ingredients.length} Zutaten, Zubereitung und Tipps. Schwierigkeit: ${recipe.cocktail.difficulty}.`, alternates: { canonical: recipe.href } };
}
export default async function CocktailRecipePage({ params }: Props) {
  const recipe = findCocktail((await params).slug);
  if (!recipe) notFound();
  const cocktail = recipe.cocktail;
  const category = cocktailCatalog.categories.find((item) => item.name === cocktail.category)!;
  const photo = getCocktailPhoto(cocktail.name);
  return (
    <>
      <RecipeIntro title={cocktail.name} description={`${cocktail.category} · ${cocktail.difficulty} · ${cocktail.ingredients.length} Zutaten`} category={category} />
      <article data-learning="recipe" className={styles.body}>
        <div className="flex flex-wrap gap-4 mb-8 text-sm">
          <Link href="/cocktails" className="text-primary underline underline-offset-4">Alle Cocktail-Rezepte</Link>
          <Link href={category.href} className="text-primary underline underline-offset-4">Kategorie: {category.name}</Link>
        </div>
        <div className={styles.recipe}>
        {photo && <CocktailPhoto photo={photo} />}
        <div className={styles.reading}>
          <section aria-labelledby="recipe-ingredients" className={styles.ingredients}>
            <h2 id="recipe-ingredients" className="text-2xl font-bold text-secondary mb-5">Zutaten</h2>
            <ul className="list-disc pl-5 space-y-3 text-muted leading-relaxed">{cocktail.ingredients.map((ingredient, index) => <li key={index}>{ingredient}</li>)}</ul>
          </section>
          <div>
            <section aria-labelledby="recipe-instructions" className="mb-8">
              <h2 id="recipe-instructions" className="text-2xl font-bold text-secondary mb-5">Zubereitung</h2>
              <p className="text-muted leading-relaxed">{cocktail.instructions}</p>
            </section>
            <aside className="border-l-4 border-primary pl-5">
              <h2 className="text-lg font-bold text-secondary mb-2">Tipp</h2>
              <p className="text-muted leading-relaxed">{cocktail.tip}</p>
            </aside>
          </div>
        </div>
        </div>
      </article>
    </>
  );
}
