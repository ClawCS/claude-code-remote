import SocialLink from "@/components/SocialLink";
import type { FlyerIndex } from "@/lib/flyer-index";
import { formatDateRange } from "@/lib/cinematic/presentation";
import { SITE_LINKS } from "@/lib/cinematic/site";
import FlyerViewer from "./FlyerViewer";
import styles from "./current.module.css";

/** Localized landing composition; publication data and viewer behavior stay shared. */
export default function NlCurrentSection({ index }: { index: FlyerIndex }) {
  return <section id="handzettel" className={styles.section} aria-labelledby="nl-current-title">
    <div className={styles.heading}>
      <div><p className={styles.eyebrow}>Goed om voor langs te komen.</p><h2 id="nl-current-title">Onze actuele folders</h2></div>
      <p>Bekijk de aanbiedingen binnen de vermelde geldigheidsperiode.</p>
    </div>
    {index.flyers.length ? <div className={styles.flyers}>
      {index.flyers.map(flyer => <article key={flyer.id} className={styles.flyer}>
        <div className={styles.flyerCopy}>
          <p className={styles.validity}>{flyer.language === "nl" ? "Nederlands" : "Duits"} · {formatDateRange(flyer.validFrom, flyer.validTo)}</p>
          <h3 lang={flyer.language}>{flyer.title}</h3>
          <p>{flyer.pageCount} {flyer.pageCount === 1 ? "pagina" : "pagina’s"}</p>
        </div>
        <FlyerViewer flyer={flyer} locale="nl" />
      </article>)}
    </div> : <div className={styles.fallback}><p>De volgende geldige folder wordt voorbereid. Verlopen folders worden niet als actuele aanbiedingen getoond.</p></div>}
    {index.issues.includes("nl-flyer-missing") && <p role="status" className={styles.notice}>De Nederlandse weekfolder is nog niet beschikbaar.</p>}
    {index.scheduled.length > 0 && <div className={styles.scheduled}><h3>Binnenkort</h3><ul>{index.scheduled.map(item => <li key={item.id}>{item.title} ({item.language.toUpperCase()}) · vanaf {formatDateRange(item.validFrom, item.validTo)}</li>)}</ul></div>}
    <div className={styles.flyerFooter}><p>Vragen over producten of beschikbaarheid?</p><SocialLink platform="whatsapp" href={SITE_LINKS.whatsappNl} label="Stuur ons team een WhatsApp-bericht" /></div>
  </section>;
}
