import Link from "next/link";
import { notFound } from "next/navigation";
import WeeklyOfferGrid from "@/components/WeeklyOfferGrid";
import AcademyEntry from "@/components/AcademyEntry";
import PageIntro, { type PageIntroProps } from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/collection.module.css";
import { categories } from "@/lib/utils";
import { getWeeklyOfferContent } from "@/lib/weekly-offer-content";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
export const dynamic = "force-dynamic";

// Explicit presentation choices for validated categories, not inventory claims.
const presentation: Record<string, Pick<PageIntroProps, "theme" | "media">> = {
  bier: { theme: "beer", media: { src: "/images/akademie/bier-editorial.webp", alt: "Helles, bernsteinfarbenes und dunkles Bier im Glas · Themenbild", width: 1200, height: 800, position: "50% 58%" } },
  alkoholfrei: { theme: "fresh", media: { src: "/images/akademie/mineralwasser-editorial.webp", alt: "Stilles und sprudelndes Wasser in Gläsern · Themenbild", width: 1200, height: 800, position: "50% 60%" } },
  wein: { theme: "wine", media: { src: "/images/akademie/wein-editorial.webp", alt: "Weißwein, Rotwein und Rosé zur Verkostung · Themenbild", width: 1200, height: 800, position: "50% 56%" } },
  sekt: { theme: "wine", media: { src: "/images/akademie/schaumwein-editorial.webp", alt: "Zwei Gläser Schaumwein mit feiner Perlage · Themenbild", width: 1200, height: 800 } },
  spirituosen: { theme: "spirits", media: { src: "/images/akademie/whiskey-editorial.webp", alt: "Zwei Whisky-Verkostungsgläser mit unterschiedlichen Bernsteinfarben · Themenbild", width: 1200, height: 800, position: "50% 60%" } },
  lebensmittel: { theme: "neutral" },
};

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
  const content = await getWeeklyOfferContent(resolveHomepageNow());
  return <>
    <PageIntro {...presentation[slug]} eyebrow="Unsere Getränkewelten" title={category.name} description={<><p>{introductions[slug]}</p><p>Das vollständige Sortiment findest du im Markt.</p></>} breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Sortiment", href: "/produkte" }, { label: category.name }]} />
    <div className={styles.body} data-collection="category" data-category-intro>
      <nav className={styles.categories} aria-label="Warengruppen">{categories.map(item => <Link key={item.slug} href={`/kategorie/${item.slug}`} aria-current={slug === item.slug ? "page" : undefined}>{item.name}</Link>)}</nav>
      {slug === "spirituosen" && <p className="mb-8"><Link href="/regionale-spirituosen" className="text-primary underline font-bold">Regionale Spezialitäten vom Niederrhein entdecken</Link></p>}
      <WeeklyOfferGrid content={content} category={slug} />
      {slug === "spirituosen" && <Link href="/eigenmarke" className="inline-block text-primary underline mt-8">Unsere Jammers-Eigenmarken kennenlernen</Link>}
      <AcademyEntry category={slug} />
    </div>
  </>;
}
