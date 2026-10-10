import Image from "next/image";
import Link from "next/link";

import { SPOTLIGHT_POSTERS } from "@/data/cinematic-editorial";
import { eigenmarken } from "@/data/eigenmarken";
import { GOOGLE_MARKET_PHOTOS } from "@/data/google-market-photos";

import styles from "./spotlight.module.css";

export default function SpotlightSection(): React.JSX.Element {
  return (
    <section
      className={styles.section}
      id="eigenmarken"
      data-signature="cinematic"
      aria-labelledby="eigenmarken-title"
    >
      <div className={styles.intro}>
        <p>Unsere Eigenmarken</p>
        <h2 id="eigenmarken-title">Sechs eigene Charaktere.</h2>
      </div>
      <div className={styles.brandStory}>
        <div className={styles.bottleImage}>
          <Image src={GOOGLE_MARKET_PHOTOS.ownBrands.src} width={GOOGLE_MARKET_PHOTOS.ownBrands.width} height={GOOGLE_MARKET_PHOTOS.ownBrands.height} alt={GOOGLE_MARKET_PHOTOS.ownBrands.alt} sizes="(max-width: 767px) 100vw, 50vw" />
        </div>
        <div className={styles.brandCopy}>
          <p>Sechs Namen. Eine Familie aus Goch. Entdecke unsere Eigenmarken und frag unser Team nach deinem Favoriten.</p>
          <ul className={styles.brandNames}>
            {eigenmarken.map(brand => <li key={brand.slug}><Link href="/eigenmarke" prefetch={false}>{brand.name}<span aria-hidden="true">↗</span></Link></li>)}
          </ul>
          <Link href="/eigenmarke" prefetch={false} className={styles.allBrands}>Unsere Eigenmarken kennenlernen ↗</Link>
        </div>
      </div>
      <div className={styles.railViewport}>
        <div className={styles.rail} data-rail="cinematic">
          {SPOTLIGHT_POSTERS.map((poster) => (
            <Link
              className={styles.frame}
              key={poster.number}
              href={poster.href}
              prefetch={false}
            >
              <figure className={styles.posterWindow}>
                <Image
                  className={styles.posterImage}
                  src={poster.image}
                  alt={poster.alt}
                  placeholder="blur"
                  sizes="(max-width: 47.999rem) 100vw, 33vw"
                />
                <figcaption className={styles.posterMeta}>
                  <span className={styles.posterName}>{poster.name}</span>
                  <span className={styles.posterLabel}>Im Markt entdecken ↗</span>
                </figcaption>
              </figure>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
