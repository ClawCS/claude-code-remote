import type { Metadata } from "next";
import Image from "next/image";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/collection.module.css";
import { eigenmarken } from "@/data/eigenmarken";
import AcademyEntry from "@/components/AcademyEntry";
import { GOOGLE_MARKET_PHOTOS } from "@/data/google-market-photos";

export const metadata: Metadata = {
  title: "Unsere Eigenmarken — 6 exklusive Liköre",
  description: "Sechs handwerklich kuratierte Eigenmarken-Liköre — exklusiv bei Trinkgut Jammers in Goch.",
};

export default function EigenmarkePage() {
  const photo = GOOGLE_MARKET_PHOTOS.ownBrands;
  return (
    <>
    <PageIntro eyebrow="Exklusiv bei Jammers" title="Unsere Eigenmarken" description={`${eigenmarken.length} exklusive Liköre — nur bei Trinkgut Jammers erhältlich.`} breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Unsere Eigenmarken" }]} />
    <div className={styles.body} data-collection="brands">
      <section className={styles.story} aria-labelledby="own-brand-bottles">
        <div><h2 id="own-brand-bottles" className="text-3xl font-bold mb-4">Sechs eigene Charaktere.</h2>
          <p className="max-w-xl">Unsere Eigenmarken zusammen im Bild. Von Kirsche und Haselnuss bis zu Lakritz und Anis: Unter dem Foto findest du die sechs Liköre mit ihren originalen Motiven.</p>
        </div>
        <figure><Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} sizes="(max-width: 752px) 90vw, 45vw" loading="lazy" /></figure>
      </section>

      <div className={styles.brandStories}>
        {eigenmarken.map((likoer) => (
          <article
            key={likoer.slug}
            id={likoer.slug}
            className={styles.brand}
          >
            <div className={styles.poster}>
              <Image
                src={likoer.image}
                alt={`${likoer.name} — ${likoer.flavor}`}
                fill
                sizes="(max-width: 752px) 90vw, 480px"
                className="object-contain"
                unoptimized
              />
            </div>
            <div>
              <h2>{likoer.name}</h2>
              <p className="text-sm text-muted mt-1">{likoer.flavor} · {likoer.abv}% Vol. · {likoer.volume} ml</p>
              <p className="text-sm text-muted leading-relaxed mt-3">{likoer.descriptionDE}</p>
              <p lang="nl">{likoer.descriptionNL}</p>
            </div>
          </article>
        ))}
      </div>

      <AcademyEntry category="eigenmarke" />
    </div>
    </>
  );
}
