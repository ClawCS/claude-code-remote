import Link from "next/link";
import { getCocktailPhoto } from "@/data/cocktail-images";
import CocktailPhoto from "@/components/recipes/CocktailPhoto";
import { cocktailCatalog, type CocktailRecipeRoute } from "@/lib/cocktail-routes";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/learning.module.css";

export function RecipeIntro({ title, description, category }: { title: string; description: string; category?: { name: string; href: string } }) {
  return <PageIntro eyebrow="Rezepte & Genuss" title={title} description={description} breadcrumbs={[
    { label: "Start", href: "/" },
    ...(title !== "Cocktail-Rezepte" ? [{ label: "Cocktail-Rezepte", href: "/cocktails" }] : []),
    ...(category ? [{ label: category.name, href: category.href }] : []),
    { label: title },
  ]} />;
}

export function RecipeCategories({ activeSlug }: { activeSlug?: string }) {
  return (
    <nav aria-label="Rezeptkategorien" className={styles.filters}>
      <Link href="/cocktails" aria-current={!activeSlug ? "page" : undefined}>
        Alle ({cocktailCatalog.recipes.length})
      </Link>
      {cocktailCatalog.categories.map((category) => (
        <Link key={category.slug} href={category.href} aria-current={activeSlug === category.slug ? "page" : undefined}>
          {category.name} ({category.recipes.length})
        </Link>
      ))}
    </nav>
  );
}

export function RecipeGrid({ recipes }: { recipes: CocktailRecipeRoute[] }) {
  return (
    <div className={styles.grid}>
      {recipes.map(({ cocktail, slug, href }) => {
        const photo = getCocktailPhoto(cocktail.name);
        const category = cocktailCatalog.categories.find((item) => item.name === cocktail.category)!;
        return (
          <article key={slug} className={styles.card}>
            {photo && <CocktailPhoto photo={photo} href={href} />}
            <div className={styles.cardBody}>
              <div className={styles.meta}>
                <Link href={category.href} className="text-primary underline underline-offset-4">{cocktail.category}</Link>
                <span className="text-muted">{cocktail.difficulty}</span>
              </div>
              <h2><Link href={href} aria-label={`${cocktail.name} – Rezept ansehen`} className="hover:text-primary">{cocktail.name}</Link></h2>
              <p className="text-sm text-muted leading-relaxed mb-5">{cocktail.ingredients.slice(0, 3).join(" · ")}</p>
              <p className="text-sm text-muted">{cocktail.ingredients.length} Zutaten <span aria-hidden="true" className="mx-2">·</span> Zutaten &amp; Zubereitung</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
