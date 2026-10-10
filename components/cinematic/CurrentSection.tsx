import Image from "next/image";
import Link from "next/link";
import SocialLink from "@/components/SocialLink";

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
        <div><p className={styles.eyebrow}>Gute Getränke. Gute Angebote.</p>
        <h2 id="aktuell-title">Deine Woche.<br />Ein guter Einkauf.</h2></div>
        <Link href="/angebote" prefetch={false} className={styles.allOffers}>Alle aktuellen Angebote ↗</Link>
      </div>
      <div className={styles.stage}>
        <div className={styles.flyers}>
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
            <SocialLink
              platform="whatsapp"
              href={SITE_LINKS.whatsapp}
              label="Per WhatsApp nachfragen"
            />
          </div>
        )}

        {view.nlFlyer ? (
          <article className={styles.flyer} data-current-nl-flyer lang="nl">
            <p className={styles.validity}>Nederlands · Geldig {formatDateRange(view.nlFlyer.validFrom, view.nlFlyer.validTo)}</p>
            <h3>{view.nlFlyer.title}</h3>
            <p>1 pagina</p>
            <FlyerViewer flyer={view.nlFlyer} locale="nl" />
          </article>
        ) : null}
        </div>

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
