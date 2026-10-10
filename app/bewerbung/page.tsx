import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/transaction.module.css";
import ApplicationForm from "@/components/applications/ApplicationForm";
export const dynamic = "force-dynamic";
export default function BewerbungPage() {
  return <><PageIntro eyebrow="Team Jammers" title="Lust auf Getränke und Menschen?" description="Verstärke unser Verkaufsteam in Goch oder starte deine Ausbildung bei uns. Im Verkauf ist ein sofortiger Einstieg möglich." /><div className={styles.body} data-service="career"><ApplicationForm /></div></>;
}
