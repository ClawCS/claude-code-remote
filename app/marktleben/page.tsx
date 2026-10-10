import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MARKET_PHOTOS } from "@/data/market-photos";
import { GOOGLE_MARKET_PHOTOS } from "@/data/google-market-photos";
import { USER_MARKET_PHOTOS } from "@/data/user-market-photos";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/collection.module.css";

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
    <PageIntro eyebrow="Jammers in Goch. Mit Menschen dahinter." title="Unser Markt. Nah dran." description="Bei uns geht es um Getränke – und um die Menschen, die den Markt jeden Tag mit Leben füllen. Echte Einblicke zeigen, wie unterschiedlich Marktalltag aussehen kann." breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Marktleben" }]} />
    <div className={styles.body} data-collection="market">
    <p className={styles.fineprint}>Auf den Marktaufnahmen sichtbare Preise sind nicht aktuell; Sortiment und Verfügbarkeit bitte im Markt erfragen. Die Gas-Tauschwerbung findest du separat weiter unten.</p>
    {[
      { id: "bier-braukunst", title: "Bier & Braukunst", photos: [USER_MARKET_PHOTOS.schneiderWeisse, USER_MARKET_PHOTOS.bueble, USER_MARKET_PHOTOS.erdinger, USER_MARKET_PHOTOS.mixedBeer] },
      { id: "wein-entdecken", title: "Wein entdecken", photos: [USER_MARKET_PHOTOS.wineShelf] },
      { id: "alkoholfrei", title: "Alkoholfrei", photos: [USER_MARKET_PHOTOS.spezi] },
    ].map(group => <section key={group.id} className={styles.section} aria-labelledby={group.id}>
      <h2 id={group.id}>{group.title}</h2>
      <div className={styles.photoGrid}>{group.photos.map(photo => <article key={photo.src}><figure><Image {...photo} alt={photo.alt} sizes="(max-width: 752px) 90vw, 50vw" loading="lazy" /></figure></article>)}</div>
    </section>)}
    {groups.map(group => <section key={group.id} className={styles.section} aria-labelledby={group.id}>
      <h2 id={group.id}>{group.title}</h2>
      <div>
        {group.photos.map(item => <article key={item.photo.src} className={styles.story}>
          <figure><Image src={item.photo.src} width={item.photo.width} height={item.photo.height} alt={item.photo.alt} sizes="(max-width: 752px) 90vw, 45vw" loading="lazy" /></figure>
          <div><h3 className="text-2xl font-medium mb-3">{item.title}</h3>
          <p>{item.text}</p>
          {"href" in item && item.href && <Link href={item.href} className="inline-block mt-4 underline font-bold text-primary">{item.link}</Link>}
          </div>
        </article>)}
      </div>
    </section>)}
    <section className={styles.section} aria-labelledby="markt-entdeckungen">
      <h2 id="markt-entdeckungen">Entdeckungen im Markt</h2>
      <div className={styles.photoGrid}>{[USER_MARKET_PHOTOS.salitosPoster, USER_MARKET_PHOTOS.liefmansPoster].map(photo => <article key={photo.src}><figure><a href={photo.src} target="_blank" rel="noopener noreferrer" aria-label={`${photo.alt} – vollständige Ansicht öffnen`} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"><Image {...photo} alt={photo.alt} sizes="(max-width: 752px) 90vw, 45vw" loading="lazy" /></a></figure></article>)}</div>
    </section>
    <section className={styles.section} aria-labelledby="gasflaschen-tauschen">
      <h2 id="gasflaschen-tauschen">Gasflaschen tauschen</h2>
      <div className={styles.story}>
        <article><figure><a href={USER_MARKET_PHOTOS.gasExchange.src} target="_blank" rel="noopener noreferrer" aria-label="Gas-Tauschwerbung vollständig öffnen" className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"><Image {...USER_MARKET_PHOTOS.gasExchange} alt={USER_MARKET_PHOTOS.gasExchange.alt} sizes="(max-width: 768px) 90vw, 384px" loading="lazy" /></a></figure></article>
        <div><p className="text-xl mb-4">Unsere Tauschpreise: 14,99 € und 25,99 € für die im Plakat gezeigten Varianten.</p><p>Welche Tauschflasche passt? Sprich uns vor Ort an oder melde dich beim Markt.</p><Link href="/kontakt" className="inline-block mt-6 underline font-bold text-primary">Kontakt zum Markt</Link></div>
      </div>
    </section>
    <section className={styles.section} aria-labelledby="market-visit">
      <h2 id="market-visit" className="text-3xl font-bold mb-4">Komm vorbei. Wir beraten dich.</h2>
      <p className="mb-6">Ob du ein Getränk für den Feierabend, eine Geschenkidee oder den Bedarf für eine Feier suchst: Sprich uns im Markt an.</p>
      <div className="flex flex-wrap gap-6"><Link href="/kontakt" className="underline font-bold text-primary">Anfahrt und Kontakt</Link><Link href="/galerie" className="underline font-bold text-primary">Team kennenlernen</Link><Link href="/produkte" className="underline font-bold text-primary">Sortiment entdecken</Link></div>
    </section>
    </div>
  </>;
}
