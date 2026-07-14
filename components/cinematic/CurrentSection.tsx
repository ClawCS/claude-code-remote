import Image from "next/image";
import Link from "next/link";

import type { HomepageContent, HomepageEvent } from "@/lib/homepage-content";
import {
  buildCurrentView,
  canRenderHomepageImage,
  formatDateRange,
  formatPageCount,
} from "@/lib/cinematic/presentation";
import { SITE_LINKS } from "@/lib/cinematic/site";

import FlyerViewer from "./FlyerViewer";
import styles from "./current.module.css";

function EventDestination({ event }: { event: HomepageEvent }): React.JSX.Element {
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

export default function CurrentSection({
  content,
}: {
  content: HomepageContent;
}): React.JSX.Element {
  const view = buildCurrentView(content);

  return (
    <section
      className={styles.section}
      id="aktuell"
      aria-labelledby="aktuell-title"
    >
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Aktuell bei Jammers</p>
        <h2 id="aktuell-title">Diese Woche im Markt</h2>
      </div>
      <div className={styles.stage}>
        {view.flyer ? (
          <article className={styles.flyer} data-current-flyer>
            <p className={styles.validity}>
              Gültig {formatDateRange(view.flyer.validFrom, view.flyer.validTo)}
            </p>
            <h3>{view.flyer.title}</h3>
            <p>{formatPageCount(view.flyer.pageCount)}</p>
            <FlyerViewer flyer={view.flyer} />
          </article>
        ) : (
          <div className={styles.fallback} data-current-fallback>
            {view.fallbackMessage ? <p>{view.fallbackMessage}</p> : null}
            <a
              href={SITE_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              Per WhatsApp nachfragen
            </a>
          </div>
        )}

        {view.event ? (
          <article className={styles.event} data-current-event>
            {canRenderHomepageImage(view.event.image) ? (
              <div className={styles.eventImage} data-event-image>
                <Image
                  src={view.event.image}
                  alt=""
                  fill
                  sizes="(max-width: 63.999rem) 100vw, 50vw"
                />
              </div>
            ) : null}
            <p className={styles.validity} data-event-interval>
              Aktionszeitraum ·{" "}
              {formatDateRange(view.event.validFrom, view.event.validTo)}
            </p>
            <h3>{view.event.title}</h3>
            <p>{view.event.summary}</p>
            <EventDestination event={view.event} />
            <a
              href={view.event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Quelle öffnen
            </a>
          </article>
        ) : null}
      </div>
    </section>
  );
}
