import Link from "next/link";

import { CINEMATIC_NAV, SITE_LINKS } from "@/lib/cinematic/site";

import LiveMarketStatus from "./LiveMarketStatus";
import MobileNavigation from "./MobileNavigation";

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
    <header data-cinematic-header>
      <Link
        href="/"
        prefetch={false}
        aria-label="Trinkgut Jammers – Startseite"
      >
        Trinkgut Jammers
      </Link>
      <nav aria-label="Hauptnavigation">
        <ul>
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <LiveMarketStatus initialNowIso={nowIso} />
      <a
        href={SITE_LINKS.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
      >
        Per WhatsApp schreiben
      </a>
      <MobileNavigation items={items} />
    </header>
  );
}
