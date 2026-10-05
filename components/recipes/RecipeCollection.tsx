import Link from "next/link";
import { getCocktailPhoto } from "@/data/cocktail-images";
import CocktailPhoto from "@/components/recipes/CocktailPhoto";
import { cocktailCatalog, type CocktailRecipeRoute } from "@/lib/cocktail-routes";

export function RecipeIntro({ title, description, category }: { title: string; description: string; category?: { name: string; href: string } }) {
  return (
    <div className="page-hero-banner py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav aria-label="Brotkrümelnavigation" className="flex flex-wrap gap-2 text-sm text-white/80 mb-6">
          <Link href="/" className="hover:text-white">Home</Link><span aria-hidden="true">/</span>
          {title === "Cocktail-Rezepte" ? <span aria-current="page">Cocktail-Rezepte</span> : <><Link href="/cocktails" className="hover:text-white">Cocktail-Rezepte</Link><span aria-hidden="true">/</span></>}
          {category && <><Link href={category.href} className="hover:text-white">{category.name}</Link><span aria-hidden="true">/</span></>}
          {title !== "Cocktail-Rezepte" && <span aria-current="page">{title}</span>}
        </nav>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-5">{title}</h1>
        <p className="text-white/85 max-w-2xl text-lg leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function RecipeCategories({ activeSlug }: { activeSlug?: string }) {
  return (
    <nav aria-label="Rezeptkategorien" className="flex flex-wrap gap-3 mb-10">
      <Link href="/cocktails" aria-current={!activeSlug ? "page" : undefined} className={`px-4 py-2 rounded-full border text-sm font-medium ${!activeSlug ? "bg-primary border-primary text-white" : "border-border text-secondary hover:border-primary"}`}>
        Alle ({cocktailCatalog.recipes.length})
      </Link>
      {cocktailCatalog.categories.map((category) => (
        <Link key={category.slug} href={category.href} aria-current={activeSlug === category.slug ? "page" : undefined} className={`px-4 py-2 rounded-full border text-sm font-medium ${activeSlug === category.slug ? "bg-primary border-primary text-white" : "border-border text-secondary hover:border-primary"}`}>
          {category.name} ({category.recipes.length})
        </Link>
      ))}
    </nav>
  );
}

export function RecipeGrid({ recipes }: { recipes: CocktailRecipeRoute[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {recipes.map(({ cocktail, slug, href }) => {
        const photo = getCocktailPhoto(cocktail.name);
        const category = cocktailCatalog.categories.find((item) => item.name === cocktail.category)!;
        return (
          <article key={slug} className="bg-white border border-border/70 rounded-2xl overflow-hidden">
            {photo && <CocktailPhoto photo={photo} href={href} />}
            <div className="p-6 md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm mb-5">
                <Link href={category.href} className="text-primary underline underline-offset-4">{cocktail.category}</Link>
                <span className="text-muted">{cocktail.difficulty}</span>
              </div>
              <h2 className="text-2xl font-bold text-secondary mb-3"><Link href={href} aria-label={`${cocktail.name} – Rezept ansehen`} className="hover:text-primary">{cocktail.name}</Link></h2>
              <p className="text-sm text-muted leading-relaxed mb-5">{cocktail.ingredients.slice(0, 3).join(" · ")}</p>
              <p className="text-sm text-muted">{cocktail.ingredients.length} Zutaten <span aria-hidden="true" className="mx-2">·</span> Zutaten &amp; Zubereitung</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
