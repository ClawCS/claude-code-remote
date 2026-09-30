import Link from "next/link";
import FlyerViewer from "@/components/cinematic/FlyerViewer";
import { formatDateRange } from "@/lib/cinematic/presentation";
import type { FlyerIndex } from "@/lib/flyer-index";
import { SITE_LINKS } from "@/lib/cinematic/site";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";

export default function FlyerIndexView({index, compact = false}: {index: FlyerIndex; compact?: boolean}) {
  const Heading = compact ? "h2" : "h1";
  return <section id={compact ? "handzettel" : "aktuell"} className="max-w-6xl mx-auto px-4 sm:px-6 py-12" style={cinematicTokenStyle}>
    <div className="mb-8"><p className="text-primary font-semibold uppercase tracking-wide text-sm">Trinkgut Jammers · Goch</p><Heading className="text-3xl md:text-5xl font-bold text-secondary mt-2">{compact ? "Onze actuele folders" : "Aktuelle Handzettel"}</Heading><p className="text-muted mt-4">{compact ? "Bekijk de aanbiedingen binnen de vermelde geldigheidsperiode." : "Alle Wochenangebote mit ihrem tatsächlichen Gültigkeitszeitraum. Preise und Aktionsbedingungen findest du im jeweiligen Handzettel."}</p></div>
    {index.flyers.length ? <div className="grid md:grid-cols-2 gap-8">{index.flyers.map((flyer) => <article key={flyer.id} className="border border-border rounded-xl p-5 bg-[#FFF8F2] text-secondary"><p className="text-primary font-bold text-sm">{flyer.language === "nl" ? "Nederlands" : compact ? "Duits" : "Deutsch"} · {formatDateRange(flyer.validFrom,flyer.validTo)}</p><h2 className="text-xl font-bold my-3">{flyer.title}</h2><FlyerViewer flyer={flyer} locale={compact ? "nl" : "de"}/></article>)}</div> : <div className="p-8 border border-border bg-[#FFF8F2] rounded-xl"><p>{compact ? "De volgende geldige folder wordt voorbereid. Verlopen folders worden niet als actuele aanbiedingen getoond." : "Der nächste gültige Handzettel wird vorbereitet. Abgelaufene Ausgaben werden hier nicht als aktuelle Angebote angezeigt."}</p><a className="inline-block mt-4 text-primary underline" href="https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest" target="_blank" rel="noopener noreferrer">{compact ? "Officiële Trinkgut-folder openen" : "Offiziellen Trinkgut-Handzettel öffnen"}</a></div>}
    {index.issues.includes("nl-flyer-missing") && <p role="status" className="mt-6 p-5 border border-border rounded-xl bg-white text-secondary">{compact ? "De Nederlandse weekfolder is nog niet beschikbaar." : "Der niederländische Wochenflyer ist noch nicht verfügbar."}</p>}
    {index.scheduled.length > 0 && <div className="mt-8"><h2 className="text-xl font-bold mb-3">{compact ? "Binnenkort" : "Als Nächstes"}</h2><ul className="space-y-2">{index.scheduled.map((item) => <li key={item.id}>{item.title} ({item.language.toUpperCase()}) · {compact ? "vanaf" : "ab"} {formatDateRange(item.validFrom,item.validTo)}</li>)}</ul></div>}
    <p className="mt-8 text-sm text-muted">{compact ? "Vragen over producten of beschikbaarheid?" : "Fragen zu Produkten oder Verfügbarkeit?"} <a href={SITE_LINKS.whatsapp} className="text-primary underline" target="_blank" rel="noopener noreferrer">{compact ? "Stuur ons team een bericht" : "Schreib unserem Team"}</a>. <Link href="/" className="text-primary underline">{compact ? "Naar de Duitse startpagina" : "Zur Startseite"}</Link></p>
  </section>;
}
