import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import { MARKET_PHOTOS } from "@/data/market-photos";
import { GOOGLE_MARKET_PHOTOS } from "@/data/google-market-photos";
import { SITE_LINKS } from "@/lib/cinematic/site";

export const metadata: Metadata = { title: "Geschenkideen aus Goch", description: "Getränke als Geschenk, Geschenkkörbe und persönliche Beratung bei Trinkgut Jammers in Goch. Zusammenstellung und Verfügbarkeit persönlich abstimmen.", alternates: { canonical: "/geschenkideen" } };

export default function GeschenkideenPage() {
  const photo = MARKET_PHOTOS.gifts;
  return <>
    <div className="category-intro" data-category-photo="verified">
      <div><nav aria-label="Brotkrumennavigation"><Link href="/">Startseite</Link><span>/</span><Link href="/produkte">Sortiment</Link><span>/</span><span>Geschenkideen</span></nav>
        <p>Eine kleine Geste. Ein besonderer Anlass.</p><h1>Freude schenken. Mit Jammers.</h1>
        <p>Ein Mitbringsel für die Einladung, ein Geburtstagsgruß oder ein Dankeschön: Wir helfen dir, eine passende Getränke-Geschenkidee zu finden.</p>
      </div>
      <figure className="category-photo"><Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} sizes="(max-width: 768px) 90vw, 320px" /></figure>
    </div>
    <section className="max-w-7xl mx-auto pt-12" aria-labelledby="gift-cards">
      <div className="px-6"><h2 id="gift-cards" className="text-3xl font-bold mb-4">Kleine Grüße. Große Wirkung.</h2>
        <p className="max-w-2xl">Eine persönliche Karte macht das Mitbringsel noch persönlicher. Die aktuelle Auswahl besprechen wir gerne mit dir.</p>
      </div>
      <div className="regional-specialties">
        {[GOOGLE_MARKET_PHOTOS.greetingCards, GOOGLE_MARKET_PHOTOS.characterCards].map(card => <article key={card.src}>
          <figure><Image src={card.src} width={card.width} height={card.height} alt={card.alt} sizes="(max-width: 768px) 90vw, 384px" loading="lazy" /></figure>
        </article>)}
      </div>
    </section>
    <section className="max-w-4xl mx-auto px-6 py-12" aria-labelledby="gift-advice"><h2 id="gift-advice" className="text-3xl font-bold mb-4">Für wen darf es sein?</h2>
      <p className="mb-4">Sag uns, für welchen Anlass du etwas suchst, welche Getränke die Person gerne mag und welches Budget du im Blick hast. Inhalt, Verpackung, Preis und Verfügbarkeit stimmen wir persönlich mit dir ab.</p>
      <p className="mb-8">Die Abbildung zeigt einen Geschenkkorb aus dem Markt. Die aktuell möglichen Produkte und Zusammenstellungen können davon abweichen.</p>
      <div className="flex flex-wrap items-center gap-4"><Link href="/kontakt" className="underline font-bold text-primary">Im Markt beraten lassen</Link><SocialLink platform="whatsapp" href={SITE_LINKS.whatsapp} label="Geschenkidee per WhatsApp besprechen" className="text-primary" /></div>
    </section>
  </>;
}
