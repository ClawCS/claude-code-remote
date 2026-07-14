import Image from "next/image";
import type { CSSProperties } from "react";

import { PEOPLE_STORY } from "@/data/cinematic-editorial";

import styles from "./editorial.module.css";

export default function PeopleSection(): React.JSX.Element {
  return (
    <section
      className={styles.section}
      id="menschen"
      aria-labelledby="menschen-title"
    >
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>Unser Markt. Unser Team.</p>
        <h2 id="menschen-title">Menschen hinter Jammers</h2>
      </div>
      <div className={styles.peopleGrid} data-people-story>
        {PEOPLE_STORY.map((person, index) => {
          const desktopWidth = index === 0 || index === 3 ? "58vw" : "42vw";
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
                sizes={`(max-width: 47.999rem) min(100vw, ${person.image.width}px), min(${desktopWidth}, ${person.image.width}px)`}
              />
              <figcaption className={styles.caption}>
                {person.caption}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
