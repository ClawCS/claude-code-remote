import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import { MARKET_PHOTOS } from "@/data/market-photos";
import { GOOGLE_MARKET_PHOTOS } from "@/data/google-market-photos";
import { SITE_LINKS } from "@/lib/cinematic/site";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/collection.module.css";

export const metadata: Metadata = { title: "Geschenkideen aus Goch", description: "Getränke als Geschenk, Geschenkkörbe und persönliche Beratung bei Trinkgut Jammers in Goch. Zusammenstellung und Verfügbarkeit persönlich abstimmen.", alternates: { canonical: "/geschenkideen" } };

export default function GeschenkideenPage() {
  const photo = MARKET_PHOTOS.gifts;
  return <>
    <PageIntro eyebrow="Eine kleine Geste. Ein besonderer Anlass." title="Freude schenken. Mit Jammers." description="Ein Mitbringsel für die Einladung, ein Geburtstagsgruß oder ein Dankeschön: Wir helfen dir, eine passende Getränke-Geschenkidee zu finden." breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Sortiment", href: "/produkte" }, { label: "Geschenkideen" }]} />
    <div className={styles.body} data-collection="gifts" data-category-photo="verified">
    <section className={styles.story} aria-labelledby="gift-advice"><figure><Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} sizes="(max-width: 752px) 90vw, 45vw" /></figure>
      <div><h2 id="gift-advice">Für wen darf es sein?</h2><p>Sag uns, für welchen Anlass du etwas suchst, welche Getränke die Person gerne mag und welches Budget du im Blick hast. Inhalt, Verpackung, Preis und Verfügbarkeit stimmen wir persönlich mit dir ab.</p><p>Die Abbildung zeigt einen Geschenkkorb aus dem Markt. Die aktuell möglichen Produkte und Zusammenstellungen können davon abweichen.</p>
      <div className={styles.links}><Link href="/kontakt">Im Markt beraten lassen</Link><SocialLink platform="whatsapp" href={SITE_LINKS.whatsapp} label="Geschenkidee per WhatsApp besprechen" className="text-primary" /></div></div>
    </section>
    <section className={styles.section} aria-labelledby="gift-cards">
      <div><h2 id="gift-cards">Kleine Grüße. Große Wirkung.</h2>
        <p className="max-w-2xl">Eine persönliche Karte macht das Mitbringsel noch persönlicher. Die aktuelle Auswahl besprechen wir gerne mit dir.</p>
      </div>
      <div className={styles.photoGrid}>
        {[GOOGLE_MARKET_PHOTOS.greetingCards, GOOGLE_MARKET_PHOTOS.characterCards].map(card => <article key={card.src}>
          <figure><Image src={card.src} width={card.width} height={card.height} alt={card.alt} sizes="(max-width: 768px) 90vw, 384px" loading="lazy" /></figure>
        </article>)}
      </div>
    </section>
    </div>
  </>;
}
