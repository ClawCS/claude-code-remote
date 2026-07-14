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
    <section id="aktuell" aria-labelledby="aktuell-title">
      <p>Aktuell bei Jammers</p>
      <h2 id="aktuell-title">Diese Woche im Markt</h2>
      {view.flyer ? (
        <article data-current-flyer>
          <p>Gültig {formatDateRange(view.flyer.validFrom, view.flyer.validTo)}</p>
          <h3>{view.flyer.title}</h3>
          <p>{formatPageCount(view.flyer.pageCount)}</p>
          <FlyerViewer flyer={view.flyer} />
        </article>
      ) : (
        <div data-current-fallback>
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
        <article data-current-event>
          {canRenderHomepageImage(view.event.image) ? (
            <div
              data-event-image
              style={{ position: "relative", aspectRatio: "16 / 9" }}
            >
              <Image
                src={view.event.image}
                alt=""
                fill
                sizes="(max-width: 63.999rem) 100vw, 50vw"
              />
            </div>
          ) : null}
          <p data-event-interval>
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
    </section>
  );
}
