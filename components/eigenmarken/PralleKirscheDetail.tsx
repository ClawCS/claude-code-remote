import Image from "next/image";
import Link from "next/link";
import { eigenmarken } from "@/data/eigenmarken";
import JammersHilftSymbol from "@/components/JammersHilftSymbol";
import AcademyEntry from "@/components/AcademyEntry";
import styles from "./brand-world.module.css";

export default function PralleKirscheDetail() {
  const brand = eigenmarken.find(item => item.slug === "pralle-kirsche")!;
  return <div className={styles.world} data-brand-detail="pralle-kirsche" data-atmosphere="spirits">
    <div className={styles.cherryWorld}>
      <header className={`${styles.wrap} ${styles.detailHero}`}>
        <nav className={styles.breadcrumbs} aria-label="Brotkrumennavigation"><Link href="/" prefetch={false}>Startseite</Link><Link href="/eigenmarke" prefetch={false}>Eigenmarken</Link><span aria-current="page">{brand.name}</span></nav>
        <div className={styles.detailGrid}>
          <div className={styles.detailCopy} data-brand-copy>
            <p className={styles.eyebrow}>Jammers · 01 / 06</p><h1>Pralle{" "}<br /><span>Kirsche.</span></h1>
            <p className={styles.detailType}>{brand.flavor}</p><p className={styles.lead}>Fruchtige Kirsche. Eine feine Mandelnote.</p>
            <dl className={styles.detailFacts}><div><dt>Alkohol</dt><dd>{brand.abv}% Vol.</dd></div><div><dt>Flascheninhalt</dt><dd>{brand.volume} ml</dd></div></dl>
            <a className={`${styles.button} ${styles.rubyButton}`} href="#geschmack">Die Sorte kennenlernen <span aria-hidden="true">↓</span></a>
          </div>
          <div className={styles.detailScene}>
            <Image className={styles.cherryScene} data-brand-background src="/images/eigenmarken-scenes/cherry-b26593bf6dc6.webp" width={1672} height={941} alt="" aria-hidden="true" loading="eager" unoptimized />
            <div className={styles.cherryShade} data-brand-light aria-hidden="true" />
            <span className={styles.detailWord} aria-hidden="true">Kirsche.</span>
            <div className={styles.detailHalo} data-brand-light aria-hidden="true" />
            <div className={styles.detailBottle} data-brand-product>
              <Image src="/images/eigenmarken-bottles/pralle-kirsche.png" width={258} height={1200} alt="Pralle Kirsche – Originalflasche des Kirsch-Mandel-Likörs" loading="eager" unoptimized />
            </div>
          </div>
        </div>
      </header>
      <section id="geschmack" aria-labelledby="taste-title" className={`${styles.wrap} ${styles.taste}`}>
        <div><p className={styles.eyebrow}>Der Geschmack</p><h2 id="taste-title">Kirsche trifft<br /><span>Mandel.</span></h2></div>
        <div><p className={styles.lead}>{brand.descriptionDE}</p><details className={styles.translationDisclosure} lang="nl"><summary>Beschrijving in het Nederlands</summary><p className={styles.translation}>{brand.descriptionNL}</p></details></div>
      </section>
    </div>
    <div className={styles.readingEnd}><div className={styles.wrap}>
      <section className={styles.productInfo} aria-labelledby="facts-title">
        <div><p className={styles.eyebrow}>Pralle Kirsche im Überblick</p><h2 id="facts-title">Die Fakten.<br />Ganz klar.</h2></div>
        <dl><div><dt>Sorte</dt><dd>{brand.flavor}</dd></div><div><dt>Alkoholgehalt</dt><dd>{brand.abv}% Vol.</dd></div><div><dt>Flascheninhalt</dt><dd>{brand.volume} ml</dd></div></dl>
      </section>
      <section className={styles.contact} aria-labelledby="cherry-contact-title">
        <div><p className={styles.eyebrow}>Persönlich bei Jammers</p><h2 id="cherry-contact-title">Noch eine Frage?</h2></div>
        <div><p>Frag unser Team vor deinem Besuch nach der aktuellen Verfügbarkeit.</p><Link href="/kontakt" prefetch={false} className={styles.button}>Kontakt zum Markt <span aria-hidden="true">↗</span></Link></div>
        <JammersHilftSymbol />
      </section>
      <nav className={styles.otherBrands} aria-label="Weitere Eigenmarken"><Link href="/eigenmarke" prefetch={false}>Alle Eigenmarken <span aria-hidden="true">↗</span></Link>{eigenmarken.filter(item => item.slug !== brand.slug).map(item => <Link key={item.slug} href={`/eigenmarke#${item.slug}`} prefetch={false}>{item.name}</Link>)}</nav>
      <AcademyEntry category="eigenmarke" />
    </div></div>
  </div>;
}
