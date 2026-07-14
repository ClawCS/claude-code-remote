import Image from "next/image";

import { INSTAGRAM_SELECTION } from "@/data/cinematic-editorial";
import { formatDate } from "@/lib/cinematic/presentation";
import { SITE_LINKS } from "@/lib/cinematic/site";

import styles from "./editorial.module.css";

export default function InstagramSection(): React.JSX.Element {
  return (
    <section
      className={styles.instagramSection}
      id="instagram"
      aria-labelledby="instagram-title"
    >
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>Direkt aus Goch</p>
        <h2 id="instagram-title">Jammers auf Instagram</h2>
      </div>
      {INSTAGRAM_SELECTION.length ? (
        <div className={styles.instagramGrid} data-instagram-selection>
          {INSTAGRAM_SELECTION.map((item) => (
            <figure key={item.id}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={item.image}
                  alt={item.caption}
                  placeholder="blur"
                  sizes="(max-width: 47.999rem) 100vw, 33vw"
                />
                <figcaption>
                  <time dateTime={item.date}>{formatDate(item.date)}</time>
                  <span>{item.caption}</span>
                </figcaption>
              </a>
            </figure>
          ))}
        </div>
      ) : (
        <div className={styles.instagramFallback} data-instagram-fallback>
          <p>Neue Einblicke folgen</p>
          <a
            href={SITE_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram-Profil öffnen
          </a>
        </div>
      )}
    </section>
  );
}
