import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cocktailImages } from "@/data/cocktail-images";
import { RecipeIntro } from "@/components/recipes/RecipeCollection";
import { cocktailCatalog, findCocktail } from "@/lib/cocktail-routes";

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
  const image = cocktailImages[cocktail.name];
  return (
    <>
      <RecipeIntro title={cocktail.name} description={`${cocktail.category} · ${cocktail.difficulty} · ${cocktail.ingredients.length} Zutaten`} category={category} />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="flex flex-wrap gap-4 mb-8 text-sm">
          <Link href="/cocktails" className="text-primary underline underline-offset-4">Alle Cocktail-Rezepte</Link>
          <Link href={category.href} className="text-primary underline underline-offset-4">Kategorie: {category.name}</Link>
        </div>
        {image && <div className="relative aspect-[4/3] mb-8 rounded-2xl overflow-hidden"><Image src={image} alt={cocktail.name} fill sizes="(max-width: 896px) 100vw, 896px" className="object-cover" /></div>}
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-8 md:gap-12">
          <section aria-labelledby="recipe-ingredients" className="bg-white border border-border rounded-2xl p-6 md:p-8">
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
      </article>
    </>
  );
}
