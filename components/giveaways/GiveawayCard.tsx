import type { Giveaway } from "@/data/giveaways";
import type { GiveawayStatus } from "@/lib/giveaways";
import styles from "./giveaways.module.css";

const statusLabels: Record<GiveawayStatus, string> = { active: "Teilnahme offen", ended: "Beendet", later: "Später im Jahr" };

export default function GiveawayCard({ giveaway, status, label }: { giveaway: Giveaway; status: GiveawayStatus; label: string }) {
  const [year, month, day] = giveaway.verifiedEndsDate.split("-");
  return (
    <article className={styles.card} data-giveaway-id={giveaway.id} data-status={status}>
      <div className={styles.cardTop}><p className={styles.eyebrow}>{label}</p><span className={`${styles.status} ${status === "active" ? styles.open : ""}`}>{statusLabels[status]}</span></div>
      <h3>{giveaway.title}</h3>
      <p className={styles.description}>{giveaway.description}</p>
      <p className={styles.deadline}>Teilnahmeschluss: <time dateTime={giveaway.verifiedEndsDate}>{day}.{month}.{year}</time><br />23:59 Uhr · Europe/Berlin</p>
      <a className={styles.sourceLink} href={giveaway.sourceURL} target="_blank" rel="noopener noreferrer">{status === "active" ? "Originalbeitrag & Teilnahmebedingungen" : "Originalbeitrag ansehen"}<span aria-hidden="true"> ↗</span></a>
    </article>
  );
}
