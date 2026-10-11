import Link from "next/link";
import Image from "next/image";
import ArrowUpRight from "@/components/ArrowUpRight";
import SocialLink from "@/components/SocialLink";
import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";
import type { HomepageContent } from "@/lib/homepage-content";
import { canRenderHomepageImage } from "@/lib/cinematic/presentation";
import { MARKET_PHOTOS } from "@/data/market-photos";
import { PARTY_SCENE } from "@/data/party-scene";
import styles from "./atmosphere.module.css";

export default function HomeQuickLinks({ content }: { content: HomepageContent }): React.JSX.Element {
  const flyers = [content.flyer, content.nlFlyer].filter((flyer) => flyer && canRenderHomepageImage(flyer.coverUrl));
  return (
    <nav className={styles.quickLinks} aria-label="Direkt zu Angeboten, Partyplanung und Besuch">
      <a className={`${styles.quickCard} ${styles.offers}`} href="#aktuell" data-quick-entry="offers">
        <span className={styles.entryCopy}><small>Deine Wochenangebote</small><strong>Diese Woche<br />sparen.</strong><span>{flyers.length ? "Aktuelle Handzettel ansehen" : "Neue Angebote folgen"}</span></span>
        {flyers.length ? <span className={styles.miniFlyers} aria-hidden="true">{flyers.map((flyer) => flyer && <Image key={flyer.id} src={flyer.coverUrl} alt="" width={180} height={240} sizes="100px" />)}</span> : <span className={styles.editions} aria-hidden="true">DE<span>+</span>NL</span>}
        <ArrowUpRight className={styles.entryArrow} />
      </a>
      <Link className={`${styles.quickCard} ${styles.party}`} href="/partyplaner" prefetch={false} data-quick-entry="party">
        <Image {...PARTY_SCENE} alt="" className={styles.entryPhoto} sizes="(max-width: 767px) 100vw, 33vw" />
        <span className={styles.entryCopy}><small>Zusammen feiern</small><strong>Deine Party<br />planen.</strong><span>Die richtigen Mengen für deine Runde</span></span><ArrowUpRight className={styles.entryArrow} />
      </Link>
      <div className={`${styles.quickCard} ${styles.visit}`} data-quick-entry="visit">
        <Image {...MARKET_PHOTOS.market} alt="" className={styles.visitPhoto} sizes="(max-width: 767px) 50vw, 18vw" />
        <Link href="/kontakt" prefetch={false} className={styles.visitLink}><span className={styles.entryCopy}><small>Dein Getränkemarkt in Goch</small><strong>Bei uns<br />vorbeikommen.</strong><span>{MARKET.street}<br />{MARKET.openingHours}</span></span></Link>
        <SocialLink platform="maps" href={SITE_LINKS.route} label="Route zu Trinkgut Jammers in Google Maps planen" />
      </div>
    </nav>
  );
}
