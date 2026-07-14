import Link from "next/link";

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
  hasActions,
}: CinematicHeaderProps): React.JSX.Element {
  const items = hasActions
    ? CINEMATIC_NAV
    : CINEMATIC_NAV.filter(({ href }) => href !== "#aktionen");

  return (
    <header className={styles.header} data-cinematic-header>
      <div className={styles.headerInner}>
        <Link
          className={styles.logo}
          href="/"
          prefetch={false}
          aria-label="Trinkgut Jammers – Startseite"
        >
          Trinkgut Jammers
        </Link>
        <nav className={styles.desktopNav} aria-label="Hauptnavigation">
          <ul className={styles.desktopNavList}>
            {items.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
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
