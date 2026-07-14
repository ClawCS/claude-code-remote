import Image from "next/image";

import { EDITORIAL_IMAGES } from "@/data/cinematic-editorial";
import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";

export default function HeroSection(): React.JSX.Element {
  const hero = EDITORIAL_IMAGES.hero;

  return (
    <section
      data-hero="cinematic"
      aria-labelledby="hero-title"
      data-cinematic-section="hero"
    >
      <div>
        <p>Trinkgut Jammers · Goch</p>
        <h1 id="hero-title">Goch schenkt ein.</h1>
        <p>Persönliche Beratung, Partybedarf und Vermietung vor Ort.</p>
        <div>
          <a
            href={SITE_LINKS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            Per WhatsApp schreiben
          </a>
          <a
            href={SITE_LINKS.route}
            target="_blank"
            rel="noopener noreferrer"
          >
            Route planen
          </a>
        </div>
        <dl>
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
      <figure>
        <Image
          src={hero.image}
          alt={hero.alt}
          placeholder="blur"
          sizes="(max-width: 63.999rem) 100vw, 55vw"
          priority
        />
        <figcaption>{hero.caption}</figcaption>
      </figure>
    </section>
  );
}
