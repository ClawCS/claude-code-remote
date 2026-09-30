import Image from "next/image";

import { EDITORIAL_IMAGES } from "@/data/cinematic-editorial";
import { MARKET } from "@/lib/cinematic/site";

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
          <p className={styles.kicker}>Dein Getränkemarkt. Mitten in Goch.</p>
          <h1 className={styles.title} id="hero-title">
            <span>Goch</span>
            <span className={styles.titleLight}>schenkt ein.</span>
          </h1>
          <p className={styles.lead}>
            Für deinen Feierabend. Für die große Runde. Und für alles, was du zu feiern hast. Wir beraten dich persönlich und machen deine Party startklar.
          </p>
          <div className={styles.actions}>
            <a
              className={styles.primary}
              href="#aktuell"
            >
              Wochenangebote ansehen
            </a>
            <a
              className={styles.secondary}
              href="/partyplaner"
            >
              Party planen
            </a>
          </div>
        </div>
        <figure className={styles.portrait}>
          <Image
            className={styles.portraitImage}
            src={hero.image}
            alt={hero.alt}
            placeholder="blur"
            sizes="(max-width: 47.999rem) 100vw, (max-width: 79.999rem) 40vw, min(50vw, 915px)"
            priority
            fetchPriority="high"
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
