import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import FlyerViewer from "@/components/cinematic/FlyerViewer";
import { formatDateRange } from "@/lib/cinematic/presentation";
import type { FlyerIndex } from "@/lib/flyer-index";
import { SITE_LINKS } from "@/lib/cinematic/site";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";
import PageIntro from "./editorial/PageIntro";
import styles from "./editorial/collection.module.css";
import editorial from "./editorial/editorial.module.css";

export default function FlyerIndexView({index, compact = false}: {index: FlyerIndex; compact?: boolean}) {
  const CardHeading = compact ? "h3" : "h2";
  const accent = compact ? "text-[#a54108]" : "text-primary";
  const theme = compact ? { ...cinematicTokenStyle, "--cinematic-color-red": "#a54108" } : cinematicTokenStyle;
  return <section id={compact ? "handzettel" : "aktuell"} style={theme}>
    {compact ? <div className={`${styles.body} ${styles.section}`}><h2>Onze actuele folders</h2><p>Bekijk de aanbiedingen binnen de vermelde geldigheidsperiode.</p></div> : <PageIntro eyebrow="Trinkgut Jammers · Goch" title="Aktuelle Handzettel" description="Alle Wochenangebote mit ihrem tatsächlichen Gültigkeitszeitraum. Preise und Aktionsbedingungen findest du im jeweiligen Handzettel." breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Angebote" }]} />}
    <div className={styles.body} data-collection="flyers">
    {index.flyers.length ? <div className={styles.flyers}>{index.flyers.map((flyer) => <article key={flyer.id} className={styles.flyer}><p className={styles.meta}>{flyer.language === "nl" ? "Nederlands" : compact ? "Duits" : "Deutsch"} · {formatDateRange(flyer.validFrom,flyer.validTo)}</p><CardHeading>{flyer.title}</CardHeading><FlyerViewer flyer={flyer} locale={compact ? "nl" : "de"}/></article>)}</div> : <div className={editorial.emptyState}><p>{compact ? "De volgende geldige folder wordt voorbereid. Verlopen folders worden niet als actuele aanbiedingen getoond." : "Der nächste gültige Handzettel wird vorbereitet. Abgelaufene Ausgaben werden hier nicht als aktuelle Angebote angezeigt."}</p></div>}
    {index.issues.includes("nl-flyer-missing") && <p role="status" className={editorial.notice}>{compact ? "De Nederlandse weekfolder is nog niet beschikbaar." : "Der niederländische Wochenflyer ist noch nicht verfügbar."}</p>}
    {index.scheduled.length > 0 && <div className="mt-8"><h2 className="text-xl font-bold mb-3">{compact ? "Binnenkort" : "Als Nächstes"}</h2><ul className="space-y-2">{index.scheduled.map((item) => <li key={item.id}>{item.title} ({item.language.toUpperCase()}) · {compact ? "vanaf" : "ab"} {formatDateRange(item.validFrom,item.validTo)}</li>)}</ul></div>}
    <div className="mt-8 text-sm text-muted flex flex-wrap items-center gap-3"><p>{compact ? "Vragen over producten of beschikbaarheid?" : "Fragen zu Produkten oder Verfügbarkeit?"}</p><SocialLink platform="whatsapp" href={compact ? SITE_LINKS.whatsappNl : SITE_LINKS.whatsapp} className={accent} label={compact ? "Stuur ons team een WhatsApp-bericht" : "Schreib unserem Team per WhatsApp"} /><Link href="/" className={`${accent} underline`}>{compact ? "Naar de Duitse startpagina" : "Zur Startseite"}</Link></div>
    </div>
  </section>;
}
