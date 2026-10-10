import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/transaction.module.css";
import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";
export default function InquiryInformation() {
  return <><PageIntro title="Deine Reservierungsanfragen" /><div className={styles.body} data-service="inquiry-history"><p className="text-muted leading-relaxed">Die Website bereitet unverbindliche Nachrichten an unser Team vor. Sie speichert keine Anfragen und zeigt keine Bestellhistorie. Frühere lokal gespeicherte Entwürfe werden beim Besuch dieser Version entfernt. Maßgeblich ist die persönliche Bestätigung durch Trinkgut Jammers.</p><div className={styles.actions}><Link href="/warenkorb" className="text-primary underline">Warenkorb ansehen</Link><SocialLink platform="whatsapp" href={SITE_LINKS.whatsapp} label="Per WhatsApp anfragen" className="text-primary" /><a href={`mailto:${MARKET.email}`} className="text-primary underline">Per E-Mail anfragen</a></div></div></>;
}
