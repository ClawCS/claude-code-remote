import Image from "next/image";
import Link from "next/link";

import { SPOTLIGHT_POSTERS } from "@/data/cinematic-editorial";

export default function SpotlightSection(): React.JSX.Element {
  return (
    <section
      id="eigenmarken"
      data-signature="cinematic"
      aria-labelledby="eigenmarken-title"
    >
      <p>Jammers Originalposter</p>
      <h2 id="eigenmarken-title">Drei Originale im Licht.</h2>
      <div data-rail="cinematic">
        {SPOTLIGHT_POSTERS.map((poster) => (
          <Link key={poster.number} href={poster.href} prefetch={false}>
            <figure>
              <Image
                src={poster.image}
                alt={poster.alt}
                placeholder="blur"
                sizes="(max-width: 63.999rem) 100vw, min(64vw, 65.875rem)"
              />
              <figcaption>
                <span>{poster.number}</span> <span>{poster.name}</span>{" "}
                <span>{poster.label}</span>
                <span>{poster.copy}</span>
              </figcaption>
            </figure>
          </Link>
        ))}
      </div>
    </section>
  );
}
