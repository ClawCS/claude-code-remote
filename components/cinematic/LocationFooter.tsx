import Link from "next/link";
import SocialLink from "@/components/SocialLink";

import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";

import styles from "./editorial.module.css";

const legalLinks = [
  { href: "/kontakt", label: "Kontakt" },
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "Anfragehinweise" },
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
        <span>{MARKET.openingHoursNote}</span>
        <a href={MARKET.phoneHref}>{MARKET.phoneDisplay}</a>
        <a href={`mailto:${MARKET.email}`}>{MARKET.email}</a>
      </address>
      <nav className={styles.footerNav} aria-label="Kontakt und Anfahrt">
        <SocialLink
          platform="maps"
          href={SITE_LINKS.route}
          label="Route zu Trinkgut Jammers in Google Maps planen"
        />
        <SocialLink
          platform="whatsapp"
          href={SITE_LINKS.whatsapp}
          label="Per WhatsApp schreiben"
        />
        <SocialLink
          platform="instagram"
          href={SITE_LINKS.instagram}
          label="Instagram-Profil von Trinkgut Jammers öffnen"
        />
        <Link href={SITE_LINKS.nl} prefetch={false}>
          Für Grenzkunden: Nederlands
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
        <Link href="/bewerbung" prefetch={false}>Jobs bei Jammers</Link>{" · "}
        <Link href="/cocktails" prefetch={false}>Cocktail-Rezepte</Link>{" · "}
        <Link href="/partyplaner" prefetch={false}>Party planen</Link>{" · "}
        <Link href="/akademie" prefetch={false}>Getränkeakademie</Link>{" · "}
        <Link href="/geschenkideen" prefetch={false}>Geschenkideen</Link>{" · "}
        <Link href="/marktleben" prefetch={false}>Marktleben</Link>{" · "}
        <Link href="/regionale-spirituosen" prefetch={false}>Regionale Spezialitäten</Link>{" · "}
        <Link href="/gewinnspiel#jahresagenda" prefetch={false}>Gewinnspiel-Agenda</Link>{" · "}
        <Link href="/warenkorb" prefetch={false}>Anfrageliste</Link>{" · "}
        <Link href="/merkzettel" prefetch={false}>Merkzettel</Link>
      </p>
      <p className={styles.footerFineprint}>
        {MARKET.legalName} · Inhaber {MARKET.owner}
      </p>
    </footer>
  );
}
