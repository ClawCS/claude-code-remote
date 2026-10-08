import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import GiveawayCard from "@/components/giveaways/GiveawayCard";
import styles from "@/components/giveaways/giveaways.module.css";
import { getActiveGiveaways, getMonthlyAgenda } from "@/lib/giveaways";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
import { SITE_LINKS } from "@/lib/cinematic/site";
import { GIVEAWAYS_UPDATED_ON } from "@/data/giveaways";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function GewinnspielPage() {
  const now = resolveHomepageNow();
  const active = getActiveGiveaways(now);
  const agenda = getMonthlyAgenda(2026, now);
  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <nav className={styles.breadcrumbs} aria-label="Brotkrumennavigation"><Link href="/">Startseite</Link><span aria-hidden="true">/</span><span>Gewinnspiele</span></nav>
        <p className={styles.eyebrow}>Bei Jammers passiert mehr</p>
        <h1>Ein Jahr.<br />Viele Gewinnchancen.</h1>
        <p>Unsere Monatsgewinnspiele 2026 im Überblick – mit den belegten Gewinnen, Teilnahmeschlüssen und dem direkten Weg zum Originalbeitrag.</p>
        <div className={styles.jumpLinks}><a href="#aktuell">Offene Gewinnspiele</a><a href="#jahresagenda">Jahresagenda 2026</a><Link href="/gewinnspiel/archiv">Zum Archiv</Link></div>
      </div>
      <div className={styles.notice}>
        <strong>Teilnahme ausschließlich im Originalbeitrag</strong>
        <p>Auf dieser Website findet keine Teilnahme statt. Maßgeblich sind die Teilnahmebedingungen, der Veranstalter und Aktualisierungen im jeweiligen Instagram-Beitrag. Der Teilnahmeschluss gilt bis zum Ende des angegebenen Tages in Europe/Berlin.</p>
      </div>
      <section id="aktuell" className={styles.section} aria-labelledby="aktuell-heading">
        <div className={styles.sectionHeading}><h2 id="aktuell-heading">Jetzt mitmachen</h2><p>Direkt zu den Originalbeiträgen auf Instagram.</p></div>
        {active.length ? <div className={styles.activeGrid}>{active.map((giveaway) => <GiveawayCard key={giveaway.id} giveaway={giveaway} status="active" layout="wide" label={giveaway.kind === "special" ? "Sondergewinnspiel" : "Monatsgewinnspiel 2026"} />)}</div> : <div className={styles.empty}><p>Aktuell ist kein belegtes Gewinnspiel offen.</p><p>Neue Ankündigungen findest du auf unserem Instagram-Kanal.</p><SocialLink platform="instagram" className="mt-3 text-primary" href={SITE_LINKS.instagram} label="Neue Ankündigungen auf Instagram ansehen" /></div>}
      </section>
      <section id="jahresagenda" className={styles.section} aria-labelledby="agenda-heading">
        <div className={styles.sectionHeading}><h2 id="agenda-heading">Jahresagenda 2026</h2><p>Die Monatszuordnung ist eine Kalenderübersicht, kein Veröffentlichungsdatum.</p></div>
        <div className={styles.grid}>{agenda.map((slot) => slot.giveaway && slot.status !== "unannounced" ? <GiveawayCard key={slot.month} giveaway={slot.giveaway} status={slot.status} label={`${slot.monthName} ${slot.year}`} /> : <article key={slot.month} className={`${styles.card} ${styles.pending}`} data-month={slot.month}><p className={styles.eyebrow}>{slot.monthName} {slot.year}</p><h3>Noch nicht angekündigt</h3><p className={styles.description}>Für diesen Monat liegt noch kein belegtes Monatsgewinnspiel vor.</p></article>)}</div>
        <p className={styles.note} style={{ marginTop: "1.5rem" }}>Zuletzt aktualisiert: {GIVEAWAYS_UPDATED_ON}. Sondergewinnspiele stehen getrennt von der Monatsagenda. Beendete Aktionen sind keine aktuellen Gewinnchancen.</p>
      </section>
    </div>
  );
}
