import Image from "next/image";

import { EDITORIAL_IMAGES } from "@/data/cinematic-editorial";
import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";

import styles from "./hero.module.css";

export default function HeroSection(): React.JSX.Element {
  const hero = EDITORIAL_IMAGES.hero;

  return (
    <section
      className={styles.hero}
      data-hero="cinematic"
      aria-labelledby="hero-title"
      data-cinematic-section="hero"
    >
      <div className={styles.grid}>
        <span className={styles.lightAxis} aria-hidden="true" />
        <div className={styles.copy}>
          <p className={styles.kicker}>Trinkgut Jammers · Goch</p>
          <h1 className={styles.title} id="hero-title">
            <span>Goch</span>
            <span className={styles.titleLight}>schenkt</span>
            <span>ein.</span>
          </h1>
          <p className={styles.lead}>
            Persönliche Beratung, Partybedarf und Vermietung vor Ort.
          </p>
          <div className={styles.actions}>
            <a
              className={styles.primary}
              href={SITE_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              Per WhatsApp schreiben
            </a>
            <a
              className={styles.secondary}
              href={SITE_LINKS.route}
              target="_blank"
              rel="noopener noreferrer"
            >
              Route planen
            </a>
          </div>
        </div>
        <figure className={styles.portrait}>
          <Image
            className={styles.portraitImage}
            src={hero.image}
            alt={hero.alt}
            placeholder="blur"
            sizes="(max-width: 63.999rem) 100vw, 55vw"
            priority
          />
          <figcaption>{hero.caption}</figcaption>
        </figure>
        <span className={styles.redGesture} aria-hidden="true" />
        <dl className={styles.facts}>
          <div>
            <dt>Adresse</dt>
            <dd>{MARKET.street}</dd>
          </div>
          <div>
            <dt>Öffnungszeiten</dt>
            <dd>{MARKET.openingHours}</dd>
          </div>
          <div>
            <dt>Ort</dt>
            <dd>
              {MARKET.postalCode} {MARKET.city}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
