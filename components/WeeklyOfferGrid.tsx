"use client";
import Image from "next/image";
import Link from "next/link";
import { selectWeeklyOffers } from "@/lib/catalog";
import { formatDateRange } from "@/lib/cinematic/presentation";
import type { WeeklyOfferContent } from "@/lib/weekly-publication-types";
import { useWeeklyOfferContent } from "./WeeklyOfferRuntime";

export default function WeeklyOfferGrid({ content, category, search = "", language = "alle" }: { content: WeeklyOfferContent; category?: string; search?: string; language?: string }) {
  const {current,now}=useWeeklyOfferContent(content);
  const offers = selectWeeklyOffers(current.offers, current.flyers, now, category).filter(offer =>
    (language === "alle" || offer.language === language) && offer.name.toLocaleLowerCase("de").includes(search.toLocaleLowerCase("de")));
  return <section aria-label="Aktuelle Einzelangebote">
    <p className="text-muted mb-6">{offers.length ? `${offers.length} ${offers.length === 1 ? "Angebot" : "Angebote"} aus den aktuellen Handzetteln` : "Hier ist derzeit kein passendes Einzelangebot freigegeben. Alle aktuellen Angebote findest du in unseren Handzetteln."}</p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{offers.map(offer => {
      const flyer = current.flyers.find(source => source.id === offer.flyerId)!;
      const originalUrl = `${flyer.pdfUrl.split("#")[0]}#page=${offer.sourcePage}`;
      return <article key={`${offer.id}-${offer.pdfSha256}`} data-offer-id={offer.id} className="overflow-hidden rounded-2xl border border-border bg-white">
        <a href={originalUrl} target="_blank" rel="noopener noreferrer" aria-label={`${offer.name} im Originalhandzettel öffnen`}>
          <Image src={offer.image} alt={`Originalangebot: ${offer.name} – Preis, Gebinde und Bedingungen im abgebildeten Handzettelausschnitt`} width={offer.rect[2]} height={offer.rect[3]} className="w-full h-80 object-contain bg-[#fff8f2] p-3" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
        </a>
        <div className="p-5"><p className="text-xs font-bold uppercase text-primary">{offer.language === "nl" ? "NL-Handzettel" : "DE-Handzettel"} · {formatDateRange(offer.validFrom, offer.validTo)}</p>
          <h2 className="text-xl font-bold mt-2">{offer.name}</h2>
          <p className="text-sm text-muted mt-2">Originalausschnitt. Preise, Pfand, Varianten und Aktionsbedingungen bitte vollständig beachten. Keine Live-Bestandsanzeige.</p>
          {offer.conditions && <details className="mt-3 text-sm"><summary className="cursor-pointer py-2 font-semibold">Bedingungen zum Angebot</summary><p className="mt-2 text-muted">{offer.conditions}</p></details>}
          {offer.sourceWarning && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-secondary"><strong>Hinweis zum Original:</strong> {offer.sourceWarning}</p>}
          <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-primary font-bold underline">Originalhandzettel öffnen ↗</a>
        </div>
      </article>;
    })}</div>
    <Link href="/angebote" className="inline-block my-8 text-primary font-bold underline">Alle Angebote im deutschen und niederländischen Handzettel →</Link>
  </section>;
}
