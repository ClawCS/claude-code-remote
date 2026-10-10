import HeroFilm from "./HeroFilm";
import styles from "./hero.module.css";

export default function HeroSection(): React.JSX.Element {
  return (
    <section
      className={styles.hero}
      data-hero="cinematic"
      aria-labelledby="hero-title"
      data-cinematic-section="hero"
    >
      <HeroFilm copyClassName={styles.copy}>
          <p className={styles.kicker}>Getränke. Partyservice. Jammers.</p>
          <h1 className={styles.title} id="hero-title">
            <span>Goch</span>
            <span>schenkt ein.</span>
          </h1>
          <p className={styles.lead}>
            Vom ersten Anstoßen bis zur großen Runde. Alles für deinen Anlass unter einem Dach.
          </p>
          <div className={styles.actions}>
            <a
              className={styles.primary}
              href="#aktuell"
            >
              Aktuelle Angebote <span aria-hidden="true">↗</span>
            </a>
            <a
              className={styles.secondary}
              href="#service"
            >
              Party &amp; Miete <span aria-hidden="true">↗</span>
            </a>
          </div>
      </HeroFilm>
    </section>
  );
}
