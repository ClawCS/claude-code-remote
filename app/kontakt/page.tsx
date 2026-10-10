import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/transaction.module.css";
import editorial from "@/components/editorial/editorial.module.css";
import type { Metadata } from "next";
import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontaktiere Trinkgut Jammers in Goch — Telefon, WhatsApp, E-Mail, Adresse und Öffnungszeiten.",
};

export default function KontaktPage() {
  return (
    <>
      <div className={styles.breadcrumb}><nav aria-label="Brotkrumennavigation"><Link href="/">Home</Link><span> / </span><span aria-current="page">Kontakt</span></nav></div>
      <PageIntro title="Kontakt" description="Wir freuen uns auf deine Nachricht oder deinen Besuch im Markt." />
      <div className={styles.body} data-service="contact">
        <div className={styles.contactGrid}>
          {/* Adresse + Öffnungszeiten */}
          <div className={styles.contactGroup}>
            <h2>Adresse</h2>
            <p className="text-secondary leading-relaxed">
              Trinkgut Jammers Goch<br />
              {MARKET.street}<br />
              {MARKET.postalCode} {MARKET.city}
            </p>
            <SocialLink
              platform="maps"
              href={SITE_LINKS.route}
              label="Route zu Trinkgut Jammers in Google Maps planen"
              className="mt-4"
            />

            <h2>Öffnungszeiten</h2>
            <p className="text-secondary leading-relaxed">
              Montag – Samstag: 08:00 – 20:00 Uhr<br />
              Sonn- und Feiertage: geschlossen
            </p>
          </div>

          {/* Telefon + E-Mail + WhatsApp */}
          <div className={styles.contactGroup}>
            <h2>Telefon</h2>
            <p className="text-secondary leading-relaxed">
              Markt: <a href="tel:+492823418707" className="text-primary hover:underline">02823-418707</a><br />
              Mobil: <a href="tel:+4917663228597" className="text-primary hover:underline">0176-63228597</a>
            </p>

            <h2>WhatsApp</h2>
            <SocialLink
              platform="whatsapp"
              href="https://wa.me/491752492386"
              label="Schreib uns auf WhatsApp"
            />

            <h2>E-Mail</h2>
            <p className="text-secondary leading-relaxed">
              <a href="mailto:jammers-goch@trinkgut.de" className="text-primary hover:underline">
                jammers-goch@trinkgut.de
              </a>
            </p>

            <h2>Bewerbungen</h2>
            <p className="text-secondary leading-relaxed">
              <a href="mailto:info@trinkgut-jammers.de" className={styles.textLink}>info@trinkgut-jammers.de</a>
            </p>

            <h2>Instagram</h2>
            <SocialLink
              platform="instagram"
              href="https://www.instagram.com/trinkgutjammers_goch/"
              label="Instagram-Profil @trinkgutjammers_goch öffnen"
              className="text-primary"
            />
          </div>
        </div>

        <section className={styles.section} aria-labelledby="contact-useful-title">
          <h2 id="contact-useful-title">Gut zu wissen</h2>
          <div className={styles.actions}>
            <Link href="/leergut" className={editorial.secondaryLink}>Leergut berechnen</Link>
            <Link href="/oeko-tracker" className={editorial.secondaryLink}>Mehrweg entdecken</Link>
          </div>
        </section>

        <div className={styles.notice}>
          <p className="text-sm text-muted">
            Für rechtliche Angaben siehe{" "}
            <Link href="/impressum" className="text-primary hover:underline">Impressum</Link>,{" "}
            <Link href="/datenschutz" className="text-primary hover:underline">Datenschutz</Link> und{" "}
            <Link href="/agb" className="text-primary hover:underline">AGB</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
