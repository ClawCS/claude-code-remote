import Link from "next/link";
import Image from "next/image";
import brandLogo from "@/public/images/home/brand-logo.webp";

import { CINEMATIC_NAV, SITE_LINKS } from "@/lib/cinematic/site";

import LiveMarketStatus from "./LiveMarketStatus";
import MobileNavigation from "./MobileNavigation";
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
      <div className={styles.headerInner}>
        <Link
          className={styles.logo}
          href="/"
          prefetch={false}
          aria-label="Trinkgut Jammers – Startseite"
        >
          <Image src={brandLogo} alt="Trinkgut Jammers" sizes="180px" priority />
        </Link>
        <nav className={styles.desktopNav} aria-label="Hauptnavigation">
          <ul className={styles.desktopNavList}>
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} prefetch={false}
                  {...(item.href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <LiveMarketStatus initialNowIso={nowIso} />
        <a
          className={styles.whatsapp}
          href={SITE_LINKS.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          Per WhatsApp schreiben
        </a>
        <MobileNavigation items={items} />
      </div>
    </header>
  );
}
