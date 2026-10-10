import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";
import styles from "./hero.module.css";

export default function HomeQuickLinks(): React.JSX.Element {
  return (
    <nav className={styles.quickLinks} aria-label="Direkt zu Angeboten, Partyplanung und Besuch">
      <a className={styles.quickLink} href="#aktuell"><span>Diese Woche sparen<small>Aktuelle Angebote · DE + NL</small></span><span aria-hidden="true">↗</span></a>
      <Link className={styles.quickLink} href="/partyplaner" prefetch={false}><span>Deine Party planen<small>Mengen planen &amp; gemeinsam feiern</small></span><span aria-hidden="true">↗</span></Link>
      <div className={styles.visit}><div><Link href="/kontakt" prefetch={false}>Bei uns vorbeikommen</Link><small>{MARKET.street} · {MARKET.openingHours}</small></div><SocialLink platform="maps" href={SITE_LINKS.route} label="Route zu Trinkgut Jammers in Google Maps planen" /></div>
    </nav>
  );
}
