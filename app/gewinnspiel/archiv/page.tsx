import Link from "next/link";
import type { Metadata } from "next";
import GiveawayCard from "@/components/giveaways/GiveawayCard";
import styles from "@/components/giveaways/giveaways.module.css";
import { GIVEAWAYS_2026, GIVEAWAYS_UPDATED_ON } from "@/data/giveaways";
import { getGiveawayStatus, getMonthlyAgenda } from "@/lib/giveaways";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
import PageIntro from "@/components/editorial/PageIntro";
import collection from "@/components/editorial/collection.module.css";

export const metadata: Metadata = { title: "Gewinnspielarchiv 2026", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AktionenArchivPage() {
  const now = resolveHomepageNow();
  const ended = getMonthlyAgenda(2026, now).filter((slot) => slot.status === "ended" && slot.giveaway);
  const special = GIVEAWAYS_2026.filter((giveaway) => giveaway.kind === "special" && getGiveawayStatus(giveaway, now) === "ended");
  return (
    <>
      <PageIntro eyebrow="Die Aktionen im Rückblick" title="Gewinnspielarchiv 2026" description="Diese Gewinnspiele sind beendet. Die Originalbeiträge dokumentieren die jeweilige Aktion und ihre Teilnahmebedingungen. Hier werden keine Gewinnernamen veröffentlicht." breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Gewinnspiele", href: "/gewinnspiel" }, { label: "Archiv" }]}>
        <div className={styles.jumpLinks}><Link href="/gewinnspiel">Zur aktuellen Übersicht</Link></div>
      </PageIntro>
      <div className={collection.body} data-collection="archive">
      <section className={styles.section} aria-labelledby="monatsarchiv-heading">
        <div className={styles.sectionHeading}><h2 id="monatsarchiv-heading">Beendete Monatsgewinnspiele</h2><p>Historische Aktionen · keine aktuelle Teilnahme</p></div>
        {ended.length ? <div className={styles.grid}>{ended.map((slot) => <GiveawayCard key={slot.month} giveaway={slot.giveaway!} status="ended" label={`${slot.monthName} 2026`} />)}</div> : <p className={styles.empty}>Für diesen Kalenderstand ist noch kein belegtes Monatsgewinnspiel beendet.</p>}
      </section>
      {special.length > 0 && <section className={styles.section} aria-labelledby="sonderarchiv-heading"><div className={styles.sectionHeading}><h2 id="sonderarchiv-heading">Beendete Sondergewinnspiele</h2></div><div className={styles.grid}>{special.map((giveaway) => <GiveawayCard key={giveaway.id} giveaway={giveaway} status="ended" label="Sondergewinnspiel 2026" />)}</div></section>}
      <p className={styles.note}>Die Jahresagenda bleibt als Rückblick auf 2026 erhalten. Zuletzt aktualisiert: {GIVEAWAYS_UPDATED_ON}.</p>
    </div>
    </>
  );
}
