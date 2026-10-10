"use client";
import Image from "next/image";
import Link from "next/link";
import { selectWeeklyOffers } from "@/lib/catalog";
import { formatDateRange } from "@/lib/cinematic/presentation";
import type { WeeklyOfferContent } from "@/lib/weekly-publication-types";
import { useWeeklyOfferContent } from "./WeeklyOfferRuntime";
import styles from "./editorial/collection.module.css";
import editorial from "./editorial/editorial.module.css";

export default function WeeklyOfferGrid({ content, category, search = "", language = "alle" }: { content: WeeklyOfferContent; category?: string; search?: string; language?: string }) {
  const {current,now}=useWeeklyOfferContent(content);
  const offers = selectWeeklyOffers(current.offers, current.flyers, now, category).filter(offer =>
    (language === "alle" || offer.language === language) && offer.name.toLocaleLowerCase("de").includes(search.toLocaleLowerCase("de")));
  return <section aria-label="Aktuelle Einzelangebote" className={styles.results}>
    <p role="status" className={offers.length ? styles.resultCount : editorial.emptyState}>{offers.length ? `${offers.length} ${offers.length === 1 ? "Angebot" : "Angebote"} aus den aktuellen Handzetteln` : "Hier ist derzeit kein passendes Einzelangebot freigegeben. Alle aktuellen Angebote findest du in unseren Handzetteln."}</p>
    <div className={styles.offerGrid}>{offers.map(offer => {
      const flyer = current.flyers.find(source => source.id === offer.flyerId)!;
      const originalUrl = `${flyer.pdfUrl.split("#")[0]}#page=${offer.sourcePage}`;
      return <article key={`${offer.id}-${offer.pdfSha256}`} data-offer-id={offer.id} className={styles.offer}>
        <a href={originalUrl} target="_blank" rel="noopener noreferrer" aria-label={`${offer.name} im Originalhandzettel öffnen`}>
          <Image src={offer.image} alt={`Originalangebot: ${offer.name} – Preis, Gebinde und Bedingungen im abgebildeten Handzettelausschnitt`} width={offer.rect[2]} height={offer.rect[3]} className={styles.offerImage} sizes="(max-width:752px) 90vw, (max-width:1008px) 45vw, 30vw" />
        </a>
        <div className={styles.offerText}><p className={styles.meta}>{offer.language === "nl" ? "NL-Handzettel" : "DE-Handzettel"} · {formatDateRange(offer.validFrom, offer.validTo)}</p>
          <h2>{offer.name}</h2>
          <p className={styles.fineprint}>Originalausschnitt. Preise, Pfand, Varianten und Aktionsbedingungen bitte vollständig beachten. Keine Live-Bestandsanzeige.</p>
          {offer.conditions && <details className={styles.conditions}><summary>Bedingungen zum Angebot</summary><p>{offer.conditions}</p></details>}
          {offer.sourceWarning && <p className={styles.warning}><strong>Hinweis zum Original:</strong> {offer.sourceWarning}</p>}
          <a href={originalUrl} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>Originalhandzettel öffnen ↗</a>
        </div>
      </article>;
    })}</div>
    <Link href="/angebote" className={styles.sourceLink}>Alle Angebote im deutschen und niederländischen Handzettel →</Link>
  </section>;
}
