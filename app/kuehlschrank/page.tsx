import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import { SITE_LINKS } from "@/lib/cinematic/site";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/tools.module.css";
import editorial from "@/components/editorial/editorial.module.css";
export default function KuehlschrankPage() {
  return <>
    <PageIntro eyebrow="Persönlich beraten" title="Was fehlt für die nächste Runde?" description="Für deinen Anlass beraten wir dich persönlich." />
    <div data-tool="fridge" className={styles.body}>
      <div className={editorial.notice}>Der frühere Foto-Check ist aktuell nicht verfügbar; auf dieser Seite werden keine Bilder hochgeladen oder zur Analyse an externe Anbieter gesendet.</div>
      <div className={styles.actions}><Link href="/partyplaner" className={editorial.primaryLink}>Getränkemengen planen</Link><SocialLink platform="whatsapp" href={SITE_LINKS.whatsapp} label="Unser Team per WhatsApp fragen" /></div>
    </div>
  </>;
}
