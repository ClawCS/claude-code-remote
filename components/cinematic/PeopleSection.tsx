import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import TeamPhotoPlaceholder from "@/components/TeamPhotoPlaceholder";

import { EDITORIAL_IMAGES, PEOPLE_STORY } from "@/data/cinematic-editorial";

import styles from "./editorial.module.css";

export default function PeopleSection(): React.JSX.Element {
  return (
    <section
      className={styles.section}
      id="menschen"
      aria-labelledby="menschen-title"
    >
      <div className={styles.peopleIntro}>
      <Image src={EDITORIAL_IMAGES.hero.image} alt={EDITORIAL_IMAGES.hero.alt} placeholder="blur" sizes="(max-width: 47.999rem) 100vw, 50vw" className={styles.peoplePhoto} />
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>Unser Markt. Unser Team.</p>
        <h2 id="menschen-title">Menschen hinter Jammers</h2>
        <p>Dein Lieblingsgetränk finden, eine Feier planen oder einfach kurz schnacken: Wir sind für dich da.</p>
        <div className={styles.actionLinks}>
          <Link href="/galerie" prefetch={false}>Unser Team kennenlernen ↗</Link>
          <Link href="/bewerbung" prefetch={false}>Offene Stellen &amp; Bewerbung ↗</Link>
        </div>
      </div>
      </div>
      <details className={styles.peopleDetails}>
      <summary>Die Menschen im Team <span aria-hidden="true">+</span></summary>
      <div className={styles.peopleGrid} data-people-story>
        <TeamPhotoPlaceholder />
        {PEOPLE_STORY.map((person) => {
          const figureStyle = {
            "--editorial-image-max-width": `${person.image.width}px`,
          } as CSSProperties;

          return (
            <figure
              className={styles.figure}
              key={person.id}
              style={figureStyle}
            >
              <Image
                className={styles.image}
                src={person.image}
                alt={person.alt}
                placeholder="blur"
                sizes={`(max-width: 47.999rem) min(50vw, ${person.image.width}px), min(25vw, ${person.image.width}px)`}
              />
              {person.caption && <figcaption className={styles.caption}>
                {person.caption}
              </figcaption>}
            </figure>
          );
        })}
      </div>
      </details>
    </section>
  );
}
