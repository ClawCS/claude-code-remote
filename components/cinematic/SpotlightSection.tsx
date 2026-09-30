import Image from "next/image";
import Link from "next/link";

import { SPOTLIGHT_POSTERS } from "@/data/cinematic-editorial";

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
        <h2 id="eigenmarken-title">Drei mit Charakter.</h2>
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
