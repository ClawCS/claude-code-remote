import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import { categories } from "@/lib/utils";
import { assortmentProducts } from "@/lib/catalog";

const introductions: Record<string, string> = {
  bier: "Pils, Alt, Weizen und Fassbier: Entdecke eine Auswahl aus unserem Markt. Für die große Runde beraten wir dich auch zu Fassbier und Zapfanlagen.",
  alkoholfrei: "Wasser, Limonaden, Säfte und neue Drinks. Für Alltag, Sport und Feiern – wir helfen dir bei der Auswahl.",
  wein: "Wein zum Essen, für einen besonderen Abend oder als Geschenk. Sprich uns an: Gemeinsam finden wir etwas Passendes.",
  sekt: "Sekt und prickelnde Begleiter für Empfang und Feier. Auswahl, Mengen und Gläser stimmen wir mit dir ab.",
  spirituosen: "Von vertrauten Klassikern bis zu regionalen Spezialitäten und unseren Jammers-Likören. Entdecke deine nächste Genussidee.",
  lebensmittel: "Mehr als Getränke: eine Auswahl an Begleitern für deinen Einkauf und deinen Anlass. Das aktuelle Sortiment erfährst du im Markt.",
};

export default async function KategoriePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categories.find(item => item.slug === slug);
  if (!category) notFound();
  const products = assortmentProducts.filter(item => item.categorySlug === slug);
  return <>
    <div className="category-intro" data-category-intro>
      <div>
        <nav aria-label="Brotkrumennavigation"><Link href="/">Startseite</Link><span>/</span><Link href="/produkte">Sortiment</Link><span>/</span><span>{category.name}</span></nav>
        <h1>{category.name}</h1>
        <p>{introductions[slug]}</p>
        <p>Sortimentsbeispiele · Preise und Verfügbarkeit bestätigen wir persönlich.</p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-6 py-10">
      <nav className="category-links" aria-label="Warengruppen">{categories.map(item => <Link key={item.slug} href={`/kategorie/${item.slug}`} aria-current={slug === item.slug ? "page" : undefined}>{item.name}</Link>)}</nav>
      {slug === "spirituosen" && <p className="mb-8"><Link href="/regionale-spirituosen" className="text-primary underline font-bold">Regionale Spezialitäten vom Niederrhein entdecken</Link></p>}
      <p className="text-muted mb-6">{products.length} Sortimentsbeispiele</p>
      <ProductGrid products={products} headingLevel={2} />
      {slug === "spirituosen" && <Link href="/eigenmarke" className="inline-block text-primary underline mt-8">Unsere Jammers-Eigenmarken kennenlernen</Link>}
    </div>
  </>;
}
