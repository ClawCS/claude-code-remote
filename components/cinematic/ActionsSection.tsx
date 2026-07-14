import Image from "next/image";
import Link from "next/link";

import type {
  HomepageArchiveItem,
  HomepageEvent,
} from "@/lib/homepage-content";
import {
  canRenderHomepageImage,
  formatDate,
  formatDateRange,
} from "@/lib/cinematic/presentation";

function EventLink({ event }: { event: HomepageEvent }): React.JSX.Element {
  if (event.href.startsWith("/") && !event.href.startsWith("//")) {
    return (
      <Link href={event.href} prefetch={false}>
        Aktion ansehen
      </Link>
    );
  }

  return (
    <a href={event.href} target="_blank" rel="noopener noreferrer">
      Aktion ansehen
    </a>
  );
}

export default function ActionsSection({
  event,
  archive,
}: {
  event: HomepageEvent | null;
  archive: readonly HomepageArchiveItem[];
}): React.JSX.Element | null {
  if (!event && archive.length === 0) return null;

  return (
    <section id="aktionen" aria-labelledby="aktionen-title">
      <p>Im Markt passiert mehr.</p>
      <h2 id="aktionen-title">Aktionen &amp; Rückblicke</h2>
      {event ? (
        <article data-action-current>
          {canRenderHomepageImage(event.image) ? (
            <div
              data-action-image
              style={{ position: "relative", aspectRatio: "16 / 9" }}
            >
              <Image
                src={event.image}
                alt=""
                fill
                sizes="(max-width: 63.999rem) 100vw, 50vw"
              />
            </div>
          ) : null}
          <p data-event-interval>
            Aktionszeitraum · {formatDateRange(event.validFrom, event.validTo)}
          </p>
          <h3>{event.title}</h3>
          <p>{event.summary}</p>
          <EventLink event={event} />
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Quelle öffnen
          </a>
        </article>
      ) : null}
      {archive.length ? (
        <div data-action-archive>
          {archive.map((item) => (
            <article key={item.id}>
              {canRenderHomepageImage(item.image) ? (
                <div
                  data-archive-image
                  style={{ position: "relative", aspectRatio: "16 / 9" }}
                >
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 47.999rem) 100vw, 33vw"
                  />
                </div>
              ) : null}
              <p>Rückblick · {formatDate(item.date)}</p>
              <h3>{item.title}</h3>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
