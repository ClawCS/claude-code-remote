import Image from "next/image";

import { PEOPLE_STORY } from "@/data/cinematic-editorial";

export default function PeopleSection(): React.JSX.Element {
  return (
    <section id="menschen" aria-labelledby="menschen-title">
      <p>Unser Markt. Unser Team.</p>
      <h2 id="menschen-title">Menschen hinter Jammers</h2>
      <div data-people-story>
        {PEOPLE_STORY.map((person) => (
          <figure key={person.id}>
            <Image
              src={person.image}
              alt={person.alt}
              placeholder="blur"
              sizes="(max-width: 47.999rem) 100vw, (max-width: 79.999rem) 50vw, 33vw"
            />
            <figcaption>{person.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
