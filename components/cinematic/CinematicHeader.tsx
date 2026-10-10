import Link from "next/link";
import Image from "next/image";
import brandLogo from "@/public/images/home/brand-logo.webp";
import SocialLink from "@/components/SocialLink";

import { CINEMATIC_NAV, MARKET, SITE_LINKS } from "@/lib/cinematic/site";

import LiveMarketStatus from "./LiveMarketStatus";
import MobileNavigation from "./MobileNavigation";
import NavigationDisclosure from "./NavigationDisclosure";
import styles from "./chrome.module.css";

type CinematicHeaderProps = Readonly<{
  nowIso: string;
  hasActions: boolean;
}>;

export default function CinematicHeader({
  nowIso,
}: CinematicHeaderProps): React.JSX.Element {
  const items = CINEMATIC_NAV;

  return (
    <header className={styles.header} data-cinematic-header>
      <div className={styles.languageStrip}>
        <div className={styles.infoInner}>
          <div className={styles.hours}>
            <span>{MARKET.city} · {MARKET.openingHours}</span>
            <LiveMarketStatus initialNowIso={nowIso} />
          </div>
          <span className={styles.address}>{MARKET.street}</span>
          <Link
            className={styles.dutchEntry}
            href="/nl"
            lang="nl"
            hrefLang="nl"
            prefetch={false}
            aria-label="Nederlands"
          >
            <span aria-hidden="true">🇳🇱</span>
            <span>Nederlands</span><span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
      <div className={styles.headerInner}>
        <Link
          className={styles.logo}
          href="/"
          prefetch={false}
          aria-label="Trinkgut Jammers – Startseite"
        >
          <Image src={brandLogo} alt="Trinkgut Jammers" sizes="(min-width: 72rem) 151px, 126px" priority />
        </Link>
        <nav className={styles.desktopNav} aria-label="Hauptnavigation">
          <ul className={styles.desktopNavList}>
            {items.map((item) => (
              <li key={item.label}>
                {"children" in item || "groups" in item ? <NavigationDisclosure item={item} /> : <Link href={item.href} prefetch={false}
                  {...(item.href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >{item.label}</Link>}
              </li>
            ))}
          </ul>
        </nav>
        <SocialLink
          className={styles.whatsapp}
          platform="whatsapp"
          href={SITE_LINKS.whatsapp}
          label="Per WhatsApp schreiben"
        />
        <MobileNavigation items={items} />
      </div>
    </header>
  );
}
