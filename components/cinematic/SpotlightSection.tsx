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
        <p>Jammers Originalposter</p>
        <h2 id="eigenmarken-title">Drei Originale im Licht.</h2>
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
                  sizes="(max-width: 63.999rem) 100vw, min(64vw, 1054px)"
                />
                <figcaption className={styles.posterMeta}>
                  <span className={styles.number}>{poster.number}</span>
                  <span className={styles.posterName}>{poster.name}</span>
                  <span className={styles.posterLabel}>{poster.label}</span>
                  <span className={styles.posterCopy}>{poster.copy}</span>
                </figcaption>
              </figure>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
