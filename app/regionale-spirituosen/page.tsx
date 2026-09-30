import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { REGIONAL_SPECIALTIES } from "@/data/regional-specialties";

export const metadata: Metadata = {
  title: "Regionale Spirituosen in Goch",
  description: "Brüdergeist-Spezialitäten und regionale Genussideen bei Trinkgut Jammers in Goch. Persönlich beraten lassen und Verfügbarkeit im Markt abstimmen.",
  alternates: { canonical: "/regionale-spirituosen" },
};

export default function RegionaleSpirituosenPage() {
  return <>
    <div className="category-intro">
      <nav aria-label="Brotkrumennavigation"><Link href="/">Startseite</Link><span>/</span><Link href="/kategorie/spirituosen">Spirituosen</Link><span>/</span><span>Regional entdecken</span></nav>
      <p>Genussideen vom Niederrhein</p>
      <h1>Regional. Besonders. Für dich.</h1>
      <p>Bei uns gibt es neben bekannten Klassikern auch regionale Entdeckungen. Drei Brüdergeist-Spezialitäten aus unserem Canva-Bestand geben dir einen ersten Eindruck.</p>
      <p>Die Abbildungen sind originale Produktgrafiken, keine Marktfotos. Preise, aktuelle Auswahl und Verfügbarkeit bestätigen wir persönlich im Markt.</p>
    </div>
    <section className="regional-specialties" aria-label="Brüdergeist-Spezialitäten">
      {REGIONAL_SPECIALTIES.map(item => <article key={item.name}>
        <figure><Image src={item.src} width={item.width} height={item.height} alt={item.alt} sizes="(max-width: 768px) 90vw, 360px" /><figcaption>Originale Canva-Produktgrafik · Sortimentsbeispiel</figcaption></figure>
        <h2>{item.name}</h2><p>{item.description}</p>
      </article>)}
    </section>
    <section className="max-w-4xl mx-auto px-6 py-12" aria-labelledby="regional-advice">
      <h2 id="regional-advice" className="text-3xl font-bold mb-4">Lust auf eine Entdeckung?</h2>
      <p className="mb-6">Frag uns nach einer passenden Spezialität für deinen Geschmack oder als Geschenk. Auch unsere Jammers-Eigenmarken gehören zu den besonderen Genussideen aus dem Markt.</p>
      <div className="flex flex-wrap gap-6"><Link href="/kontakt" className="underline font-bold text-primary">Persönlich beraten lassen</Link><Link href="/eigenmarke" className="underline font-bold text-primary">Jammers-Eigenmarken entdecken</Link><Link href="/geschenkideen" className="underline font-bold text-primary">Geschenkideen ansehen</Link></div>
    </section>
  </>;
}
