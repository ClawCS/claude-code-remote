import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import FlyerViewer from "@/components/cinematic/FlyerViewer";
import { formatDateRange } from "@/lib/cinematic/presentation";
import type { FlyerIndex } from "@/lib/flyer-index";
import { SITE_LINKS } from "@/lib/cinematic/site";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";

export default function FlyerIndexView({index, compact = false}: {index: FlyerIndex; compact?: boolean}) {
  const Heading = compact ? "h2" : "h1";
  const CardHeading = compact ? "h3" : "h2";
  const accent = compact ? "text-[#a54108]" : "text-primary";
  const theme = compact ? { ...cinematicTokenStyle, "--cinematic-color-red": "#a54108" } : cinematicTokenStyle;
  return <section id={compact ? "handzettel" : "aktuell"} className="max-w-6xl mx-auto px-4 sm:px-6 py-12" style={theme}>
    <div className="mb-8"><p className={`${accent} font-semibold uppercase tracking-wide text-sm`}>Trinkgut Jammers · Goch</p><Heading className="text-3xl md:text-5xl font-bold text-secondary mt-2">{compact ? "Onze actuele folders" : "Aktuelle Handzettel"}</Heading><p className="text-muted mt-4">{compact ? "Bekijk de aanbiedingen binnen de vermelde geldigheidsperiode." : "Alle Wochenangebote mit ihrem tatsächlichen Gültigkeitszeitraum. Preise und Aktionsbedingungen findest du im jeweiligen Handzettel."}</p></div>
    {index.flyers.length ? <div className="grid md:grid-cols-2 gap-8">{index.flyers.map((flyer) => <article key={flyer.id} className="border border-border rounded-xl p-5 bg-[#FFF8F2] text-secondary"><p className={`${accent} font-bold text-sm`}>{flyer.language === "nl" ? "Nederlands" : compact ? "Duits" : "Deutsch"} · {formatDateRange(flyer.validFrom,flyer.validTo)}</p><CardHeading className="text-xl font-bold my-3">{flyer.title}</CardHeading><FlyerViewer flyer={flyer} locale={compact ? "nl" : "de"}/></article>)}</div> : <div className="p-8 border border-border bg-[#FFF8F2] rounded-xl"><p>{compact ? "De volgende geldige folder wordt voorbereid. Verlopen folders worden niet als actuele aanbiedingen getoond." : "Der nächste gültige Handzettel wird vorbereitet. Abgelaufene Ausgaben werden hier nicht als aktuelle Angebote angezeigt."}</p></div>}
    {index.issues.includes("nl-flyer-missing") && <p role="status" className="mt-6 p-5 border border-border rounded-xl bg-white text-secondary">{compact ? "De Nederlandse weekfolder is nog niet beschikbaar." : "Der niederländische Wochenflyer ist noch nicht verfügbar."}</p>}
    {index.scheduled.length > 0 && <div className="mt-8"><h2 className="text-xl font-bold mb-3">{compact ? "Binnenkort" : "Als Nächstes"}</h2><ul className="space-y-2">{index.scheduled.map((item) => <li key={item.id}>{item.title} ({item.language.toUpperCase()}) · {compact ? "vanaf" : "ab"} {formatDateRange(item.validFrom,item.validTo)}</li>)}</ul></div>}
    <div className="mt-8 text-sm text-muted flex flex-wrap items-center gap-3"><p>{compact ? "Vragen over producten of beschikbaarheid?" : "Fragen zu Produkten oder Verfügbarkeit?"}</p><SocialLink platform="whatsapp" href={compact ? SITE_LINKS.whatsappNl : SITE_LINKS.whatsapp} className={accent} label={compact ? "Stuur ons team een WhatsApp-bericht" : "Schreib unserem Team per WhatsApp"} /><Link href="/" className={`${accent} underline`}>{compact ? "Naar de Duitse startpagina" : "Zur Startseite"}</Link></div>
  </section>;
}
