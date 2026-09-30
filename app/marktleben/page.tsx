import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MARKET_PHOTOS } from "@/data/market-photos";

export const metadata: Metadata = {
  title: "Marktleben in Goch",
  description: "Echte Einblicke in den Getränke- und Marktalltag bei Trinkgut Jammers in Goch. Menschen, Aufbauten und persönliche Beratung.",
  alternates: { canonical: "/marktleben" },
};

export default function MarktlebenPage() {
  const photos = [MARKET_PHOTOS.market, MARKET_PHOTOS.behindScenes];
  return <>
    <div className="category-intro">
      <nav aria-label="Brotkrumennavigation"><Link href="/">Startseite</Link><span>/</span><span>Marktleben</span></nav>
      <p>Jammers in Goch. Mit Menschen dahinter.</p>
      <h1>Unser Markt. Nah dran.</h1>
      <p>Bei uns geht es um Getränke – und um die Menschen, die den Markt jeden Tag mit Leben füllen. Zwei echte Einblicke aus unserem Canva-Bestand zeigen, wie unterschiedlich Marktalltag aussehen kann.</p>
    </div>
    <section className="regional-specialties" aria-label="Einblicke in den Marktalltag">
      {photos.map(photo => <article key={photo.src}>
        <figure><Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} sizes="(max-width: 768px) 90vw, 360px" /><figcaption>{photo.caption}</figcaption></figure>
        <h2>{photo === MARKET_PHOTOS.market ? "Platz für Entdeckungen." : "Mit Herz. Und mit anpacken."}</h2>
        <p>{photo === MARKET_PHOTOS.market ? "Getränkeaufbauten machen besondere Sortimente im Markt sichtbar. Das Foto zeigt einen früheren Salitos-Aufbau – keine aktuelle Preisaktion oder Verfügbarkeitszusage." : "Ein kleiner Blick hinter die Kulissen mit Niko. Nahbar, persönlich und mitten im Marktalltag."}</p>
      </article>)}
    </section>
    <section className="max-w-4xl mx-auto px-6 py-12" aria-labelledby="market-visit">
      <h2 id="market-visit" className="text-3xl font-bold mb-4">Komm vorbei. Wir beraten dich.</h2>
      <p className="mb-6">Ob du ein Getränk für den Feierabend, eine Geschenkidee oder den Bedarf für eine Feier suchst: Sprich uns im Markt an.</p>
      <div className="flex flex-wrap gap-6"><Link href="/kontakt" className="underline font-bold text-primary">Anfahrt und Kontakt</Link><Link href="/galerie" className="underline font-bold text-primary">Team kennenlernen</Link><Link href="/produkte" className="underline font-bold text-primary">Sortiment entdecken</Link></div>
    </section>
  </>;
}
