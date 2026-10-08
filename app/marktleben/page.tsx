import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MARKET_PHOTOS } from "@/data/market-photos";
import { GOOGLE_MARKET_PHOTOS } from "@/data/google-market-photos";

export const metadata: Metadata = {
  title: "Marktleben in Goch",
  description: "Echte Einblicke in den Getränke- und Marktalltag bei Trinkgut Jammers in Goch. Menschen, Aufbauten und persönliche Beratung.",
  alternates: { canonical: "/marktleben" },
};

export default function MarktlebenPage() {
  const groups = [
    { id: "menschen-marktmomente", title: "Menschen & Marktmomente", photos: [
      { photo: GOOGLE_MARKET_PHOTOS.tasting, title: "Gemeinsam entdecken.", text: "Eine Verkostung mit unseren Eigenmarken: ein Moment zum Probieren und Austauschen.", href: "/eigenmarke", link: "Unsere Eigenmarken entdecken" },
    ] },
    { id: "aufbauten-entdeckungen", title: "Aufbauten & Entdeckungen", photos: [
      { photo: MARKET_PHOTOS.market, title: "Platz für Entdeckungen.", text: "Ein früherer Salitos-Aufbau zeigt, wie besondere Sortimente im Markt ihren Platz finden." },
      { photo: GOOGLE_MARKET_PHOTOS.desperados, title: "Ein Blick aufs Detail.", text: "Desperados auf weißen Getränkekisten – ein Ausschnitt aus dem Marktalltag." },
      { photo: GOOGLE_MARKET_PHOTOS.baileys, title: "Mitten im Aufbau.", text: "Ein Baileys-Zimtschnecken-Aufbau bringt eine weitere Genussidee ins Bild." },
    ] },
    { id: "mehr-als-getraenke", title: "Mehr als Getränke", photos: [
      { photo: GOOGLE_MARKET_PHOTOS.regional, title: "Ein Stück Bauernhof im Markt.", text: "Äpfel, Eier und Gläser im Holzaufbau." },
      { photo: GOOGLE_MARKET_PHOTOS.grill, title: "Begleiter für den Grillabend.", text: "Ein Blick in die Kühlung mit Wurstwaren und Dips – passend zu geselligen Runden." },
    ] },
  ];
  return <>
    <div className="category-intro">
      <nav aria-label="Brotkrumennavigation"><Link href="/">Startseite</Link><span>/</span><span>Marktleben</span></nav>
      <p>Jammers in Goch. Mit Menschen dahinter.</p>
      <h1>Unser Markt. Nah dran.</h1>
      <p>Bei uns geht es um Getränke – und um die Menschen, die den Markt jeden Tag mit Leben füllen. Echte Einblicke zeigen, wie unterschiedlich Marktalltag aussehen kann.</p>
      <p className="text-sm">Auf den Fotos sichtbare Preise sind nicht aktuell; Sortiment und Verfügbarkeit bitte im Markt erfragen.</p>
    </div>
    {groups.map(group => <section key={group.id} className="max-w-7xl mx-auto pt-12" aria-labelledby={group.id}>
      <h2 id={group.id} className="text-3xl font-bold px-6">{group.title}</h2>
      <div className="regional-specialties">
        {group.photos.map(item => <article key={item.photo.src}>
          <figure><Image src={item.photo.src} width={item.photo.width} height={item.photo.height} alt={item.photo.alt} sizes="(max-width: 768px) 90vw, 384px" loading="lazy" /></figure>
          <h3 className="text-2xl font-bold mt-6 mb-3">{item.title}</h3>
          <p>{item.text}</p>
          {"href" in item && item.href && <Link href={item.href} className="inline-block mt-4 underline font-bold text-primary">{item.link}</Link>}
        </article>)}
      </div>
    </section>)}
    <section className="max-w-4xl mx-auto px-6 py-12" aria-labelledby="market-visit">
      <h2 id="market-visit" className="text-3xl font-bold mb-4">Komm vorbei. Wir beraten dich.</h2>
      <p className="mb-6">Ob du ein Getränk für den Feierabend, eine Geschenkidee oder den Bedarf für eine Feier suchst: Sprich uns im Markt an.</p>
      <div className="flex flex-wrap gap-6"><Link href="/kontakt" className="underline font-bold text-primary">Anfahrt und Kontakt</Link><Link href="/galerie" className="underline font-bold text-primary">Team kennenlernen</Link><Link href="/produkte" className="underline font-bold text-primary">Sortiment entdecken</Link></div>
    </section>
  </>;
}
