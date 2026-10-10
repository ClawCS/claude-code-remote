import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { REGIONAL_SPECIALTIES } from "@/data/regional-specialties";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/collection.module.css";

export const metadata: Metadata = {
  title: "Regionale Spirituosen in Goch",
  description: "Brüdergeist-Spezialitäten und regionale Genussideen bei Trinkgut Jammers in Goch. Persönlich beraten lassen und Verfügbarkeit im Markt abstimmen.",
  alternates: { canonical: "/regionale-spirituosen" },
};

export default function RegionaleSpirituosenPage() {
  return <>
    <PageIntro eyebrow="Genussideen vom Niederrhein" title="Regional. Besonders. Für dich." description="Bei uns gibt es neben bekannten Klassikern auch regionale Entdeckungen. Drei Brüdergeist-Spezialitäten aus unserem Canva-Bestand geben dir einen ersten Eindruck." breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Spirituosen", href: "/kategorie/spirituosen" }, { label: "Regional entdecken" }]} />
    <div className={styles.body} data-collection="regional">
    <p className={styles.fineprint}>Die Abbildungen sind originale Produktgrafiken, keine Marktfotos. Preise, aktuelle Auswahl und Verfügbarkeit bestätigen wir persönlich im Markt.</p>
    <section className={styles.brandStories} aria-label="Brüdergeist-Spezialitäten">
      {REGIONAL_SPECIALTIES.map(item => <article key={item.name} className={styles.story}>
        <figure><Image src={item.src} width={item.width} height={item.height} alt={item.alt} sizes="(max-width: 752px) 90vw, 45vw" /></figure>
        <div><h2>{item.name}</h2><p>{item.description}</p></div>
      </article>)}
    </section>
    <section className={styles.section} aria-labelledby="regional-advice">
      <h2 id="regional-advice" className="text-3xl font-bold mb-4">Lust auf eine Entdeckung?</h2>
      <p className="mb-6">Frag uns nach einer passenden Spezialität für deinen Geschmack oder als Geschenk. Auch unsere Jammers-Eigenmarken gehören zu den besonderen Genussideen aus dem Markt.</p>
      <div className="flex flex-wrap gap-6"><Link href="/kontakt" className="underline font-bold text-primary">Persönlich beraten lassen</Link><Link href="/eigenmarke" className="underline font-bold text-primary">Jammers-Eigenmarken entdecken</Link><Link href="/geschenkideen" className="underline font-bold text-primary">Geschenkideen ansehen</Link></div>
    </section>
    </div>
  </>;
}
