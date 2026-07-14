import Link from "next/link";

import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";

import styles from "./editorial.module.css";

const legalLinks = [
  { href: "/kontakt", label: "Kontakt" },
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "AGB" },
] as const;

export default function LocationFooter(): React.JSX.Element {
  return (
    <footer
      className={styles.footer}
      id="kontakt"
      aria-labelledby="kontakt-title"
    >
      <p className={styles.eyebrow}>Dein Getränkemarkt in Goch</p>
      <h2 id="kontakt-title">Komm vorbei.</h2>
      <address>
        <strong>{MARKET.displayName}</strong>
        <span>{MARKET.street}</span>
        <span>
          {MARKET.postalCode} {MARKET.city}
        </span>
        <span>{MARKET.openingHours}</span>
        <a href={MARKET.phoneHref}>{MARKET.phoneDisplay}</a>
        <a href={`mailto:${MARKET.email}`}>{MARKET.email}</a>
      </address>
      <nav className={styles.footerNav} aria-label="Kontakt und Anfahrt">
        <a
          href={SITE_LINKS.route}
          target="_blank"
          rel="noopener noreferrer"
        >
          Route planen
        </a>
        <a
          href={SITE_LINKS.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
        <a
          href={SITE_LINKS.instagram}
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram
        </a>
        <Link href={SITE_LINKS.nl} prefetch={false}>
          Nederlands
        </Link>
      </nav>
      <nav className={styles.legal} aria-label="Rechtliche Informationen">
        {legalLinks.map((link) => (
          <Link key={link.href} href={link.href} prefetch={false}>
            {link.label}
          </Link>
        ))}
      </nav>
      <p className={styles.footerFineprint}>
        {MARKET.legalName} · Inhaber {MARKET.owner}
      </p>
    </footer>
  );
}
