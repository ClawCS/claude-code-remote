import Image from "next/image";
import Link from "next/link";
import { eigenmarken } from "@/data/eigenmarken";
import AcademyEntry from "@/components/AcademyEntry";
import LocalAnswers from "@/components/LocalAnswers";
import JammersHilftSymbol from "@/components/JammersHilftSymbol";
import styles from "./brand-world.module.css";

const bottleWidths: Readonly<Record<string, number>> = {
  "pralle-kirsche": 258, "dicke-nuesse": 260, "suesse-suende": 259,
  caramello: 260, "schwarzer-teufel": 259, "weisser-engel": 263,
};

export default function BrandWorld() {
  return <div className={styles.world} data-brand-world data-collection="brands" data-atmosphere="spirits">
    <header className={styles.collectionHero}>
      <div className={styles.heroLight} data-brand-light aria-hidden="true" />
      <div className={`${styles.wrap} ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <nav className={styles.breadcrumbs} aria-label="Brotkrumennavigation"><Link href="/" prefetch={false}>Startseite</Link><span aria-current="page">Eigenmarken</span></nav>
          <p className={styles.eyebrow}>Die Jammers Eigenmarken</p>
          <h1>Sechs Sorten.<br /><span>Ganz Jammers.</span></h1>
          <p className={styles.lead}>Von Kirsch-Mandel bis Anis. Entdecke unsere Liköre mit eigenem Charakter.</p>
          <a className={styles.button} href="#kollektion">Die Kollektion entdecken <span aria-hidden="true">↓</span></a>
          <p className={styles.index}>01 — 06 <span>Sechs eigene Charaktere.</span></p>
        </div>
        <div className={styles.lineup} role="group" aria-label="Die sechs Jammers-Originalflaschen">
          {eigenmarken.map((brand, index) => <div key={brand.slug} className={styles.lineupBottle} data-brand-tone={brand.slug}>
            <span className={styles.bottleLight} data-brand-light aria-hidden="true" />
            <Image src={`/images/eigenmarken-bottles/${brand.slug}.png`} width={bottleWidths[brand.slug]} height={1200}
              alt={`${brand.name} – Originalflasche`} unoptimized loading={index < 3 ? "eager" : "lazy"} />
          </div>)}
        </div>
      </div>
      <nav className={`${styles.wrap} ${styles.sortNav}`} aria-label="Unsere sechs Sorten">
        {eigenmarken.map(brand => <a href={`#${brand.slug}`} key={brand.slug}>{brand.name}</a>)}
      </nav>
    </header>
    <section className={`${styles.wrap} ${styles.collection}`} id="kollektion" aria-labelledby="collection-title">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Die Kollektion</p><h2 id="collection-title">Finde deinen<br /><span>Charakter.</span></h2></div><p>Jede Sorte hat ihre eigene Bühne.</p></div>
      <div className={styles.brandGrid}>
        {eigenmarken.map((brand, index) => <article key={brand.slug} id={brand.slug} className={styles.brandStage} data-brand-stage data-brand-tone={brand.slug} aria-labelledby={`${brand.slug}-title`}>
          <div className={styles.stageLight} data-brand-light aria-hidden="true" />
          <span className={styles.number} aria-hidden="true">0{index + 1}</span>
          <div className={styles.brandCopy} data-brand-copy>
            <p className={styles.productType}>{brand.flavor}</p>
            <h3 id={`${brand.slug}-title`}>{brand.name}</h3>
            <p className={styles.description}>{brand.descriptionDE}</p>
            <p className={styles.translation} lang="nl">{brand.descriptionNL}</p>
            <p className={styles.facts}><span>{brand.abv}% Vol.</span><span>{brand.volume} ml</span></p>
            <Link className={styles.textLink} href={brand.slug === "pralle-kirsche" ? "/eigenmarke/pralle-kirsche" : "/kontakt"} prefetch={false}>
              {brand.slug === "pralle-kirsche" ? "Pralle Kirsche entdecken" : "Beim Team nachfragen"}<span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className={styles.productStage} data-brand-product>
            <Image src={`/images/eigenmarken-bottles/${brand.slug}.png`} width={bottleWidths[brand.slug]} height={1200}
              alt={`${brand.name} – Originalflasche`} loading="lazy" unoptimized />
          </div>
        </article>)}
      </div>
    </section>
    <div className={styles.readingEnd}><div className={styles.wrap}>
      <section className={styles.contact} aria-labelledby="brands-contact-title">
        <div><p className={styles.eyebrow}>Persönlich bei Jammers</p><h2 id="brands-contact-title">Deine Sorte?<br />Frag uns.</h2></div>
        <div><p>Frag unser Team vor deinem Besuch nach der aktuellen Verfügbarkeit.</p><Link href="/kontakt" prefetch={false} className={styles.button}>Kontakt zum Markt <span aria-hidden="true">↗</span></Link></div>
        <JammersHilftSymbol />
      </section>
      <LocalAnswers topic="brands" /><AcademyEntry category="eigenmarke" />
    </div></div>
  </div>;
}
