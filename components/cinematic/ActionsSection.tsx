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

import styles from "./editorial.module.css";

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
    <section
      className={styles.actionsStage}
      id="aktionen"
      aria-labelledby="aktionen-title"
    >
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>Im Markt passiert mehr.</p>
        <h2 id="aktionen-title">Aktionen &amp; Rückblicke</h2>
      </div>
      <div className={styles.actionLayout}>
        {event ? (
          <article className={styles.actionCard} data-action-current>
            {canRenderHomepageImage(event.image) ? (
              <div className={styles.actionImage} data-action-image>
                <Image
                  src={event.image}
                  alt=""
                  fill
                  sizes="(max-width: 63.999rem) 100vw, 50vw"
                />
              </div>
            ) : null}
            <p className={styles.actionValidity} data-event-interval>
              Aktionszeitraum · {formatDateRange(event.validFrom, event.validTo)}
            </p>
            <h3>{event.title}</h3>
            <p>{event.summary}</p>
            <div className={styles.actionLinks}>
              <EventLink event={event} />
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Quelle öffnen
              </a>
            </div>
          </article>
        ) : null}
        {archive.length ? (
          <div className={styles.archive} data-action-archive>
            {archive.map((item) => (
              <article key={item.id}>
                {canRenderHomepageImage(item.image) ? (
                  <div className={styles.archiveImage} data-archive-image>
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(max-width: 47.999rem) 100vw, 33vw"
                    />
                  </div>
                ) : null}
                <p className={styles.archiveDate}>
                  Rückblick · {formatDate(item.date)}
                </p>
                <h3>{item.title}</h3>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
