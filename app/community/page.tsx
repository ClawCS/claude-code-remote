import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import { SITE_LINKS } from "@/lib/cinematic/site";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/tools.module.css";
import editorial from "@/components/editorial/editorial.module.css";
export default function CommunityPage() {
  return <>
    <PageIntro eyebrow="Goch. Getränke. Gute Leute." title="Unsere Community lebt im Markt." description="Teamgeschichten, Verkostungen und Aktionen: Auf unserem Instagram-Kanal bekommst du die Einblicke hinter die Kulissen. Und natürlich freuen wir uns, dich im Markt zu sehen." />
    <div data-tool="community" className={styles.body}>
      <div className={editorial.notice}>Die frühere Punktefunktion ist aktuell nicht verfügbar. Es werden hier keine neuen Profile angelegt.</div>
      <div className={styles.actions}><SocialLink platform="instagram" href={SITE_LINKS.instagram} label="Instagram-Profil @trinkgutjammers_goch öffnen" /><Link href="/gewinnspiel" className={editorial.secondaryLink}>Gewinnspiele &amp; Aktionen</Link></div>
    </div>
  </>;
}
