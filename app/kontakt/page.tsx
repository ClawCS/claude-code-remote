import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kontakt — Trinkgut Jammers Goch",
  description: "Kontaktiere Trinkgut Jammers in Goch — Telefon, WhatsApp, E-Mail, Adresse und Öffnungszeiten.",
};

export default function KontaktPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <nav className="text-sm text-muted mb-4">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-1">/</span>
        <span className="text-secondary">Kontakt</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-extrabold text-secondary mb-2">Kontakt</h1>
      <p className="text-muted mb-10">Wir freuen uns auf deine Nachricht oder deinen Besuch im Markt.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Adresse + Öffnungszeiten */}
        <div className="bg-white border border-border/60 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-secondary mb-3 flex items-center gap-2">
            <span aria-hidden="true">📍</span> Adresse
          </h2>
          <p className="text-secondary leading-relaxed">
            Trinkgut Jammers Goch<br />
            Jurgenstr. 20<br />
            47574 Goch
          </p>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=Jurgenstr.+20,+47574+Goch"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            Route in Google Maps öffnen →
          </a>

          <h2 className="text-lg font-bold text-secondary mt-8 mb-3 flex items-center gap-2">
            <span aria-hidden="true">🕐</span> Öffnungszeiten
          </h2>
          <p className="text-secondary leading-relaxed">
            Montag – Samstag: 08:00 – 20:00 Uhr<br />
            Sonntag: geschlossen
          </p>
        </div>

        {/* Telefon + E-Mail + WhatsApp */}
        <div className="bg-white border border-border/60 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-secondary mb-3 flex items-center gap-2">
            <span aria-hidden="true">📞</span> Telefon
          </h2>
          <p className="text-secondary leading-relaxed">
            Markt: <a href="tel:+492823418707" className="text-primary hover:underline">02823-418707</a><br />
            Mobil: <a href="tel:+4917663228597" className="text-primary hover:underline">0176-63228597</a>
          </p>

          <h2 className="text-lg font-bold text-secondary mt-8 mb-3 flex items-center gap-2">
            <span aria-hidden="true">💬</span> WhatsApp
          </h2>
          <a
            href="https://wa.me/491752492386"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
          >
            Schreib uns auf WhatsApp
          </a>

          <h2 className="text-lg font-bold text-secondary mt-8 mb-3 flex items-center gap-2">
            <span aria-hidden="true">✉️</span> E-Mail
          </h2>
          <p className="text-secondary leading-relaxed">
            <a href="mailto:jammers-goch@trinkgut.de" className="text-primary hover:underline">
              jammers-goch@trinkgut.de
            </a>
          </p>

          <h2 className="text-lg font-bold text-secondary mt-8 mb-3 flex items-center gap-2">
            <span aria-hidden="true">📸</span> Instagram
          </h2>
          <a
            href="https://www.instagram.com/trinkgutjammers_goch/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            @trinkgutjammers_goch
          </a>
        </div>
      </div>

      <div className="mt-10 p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl text-center">
        <p className="text-sm text-muted">
          Für rechtliche Angaben siehe{" "}
          <Link href="/impressum" className="text-primary hover:underline">Impressum</Link> und{" "}
          <Link href="/datenschutz" className="text-primary hover:underline">Datenschutz</Link>.
        </p>
      </div>
    </div>
  );
}
