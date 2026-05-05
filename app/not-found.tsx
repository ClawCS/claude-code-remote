import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seite nicht gefunden — 404 | Trinkgut Jammers",
  description: "Die gesuchte Seite existiert nicht. Zurück zur Startseite oder Sortiment durchsuchen.",
};

export default function NotFound() {
  return (
    <>
      <div className="page-hero-banner py-16 md:py-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#F59E0B] mb-4">Fehler 404</p>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-lg mb-3">
            Seite nicht gefunden
          </h1>
          <p className="text-white/80 max-w-xl mx-auto text-lg">
            Die gesuchte Seite existiert nicht oder wurde verschoben. Vielleicht ein Tippfehler in der URL?
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-secondary text-lg mb-8">
          Was möchtest du als Nächstes tun?
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <Link
            href="/"
            className="group bg-white border border-border rounded-2xl p-6 card-hover-glow"
          >
            <span className="text-4xl block mb-3">🏠</span>
            <h2 className="font-bold text-secondary group-hover:text-primary transition-colors">Zur Startseite</h2>
            <p className="text-sm text-muted mt-1">Zurück zum Hauptbereich</p>
          </Link>
          <Link
            href="/produkte"
            className="group bg-white border border-border rounded-2xl p-6 card-hover-glow"
          >
            <span className="text-4xl block mb-3">🛒</span>
            <h2 className="font-bold text-secondary group-hover:text-primary transition-colors">Sortiment</h2>
            <p className="text-sm text-muted mt-1">Aktuelle Angebote entdecken</p>
          </Link>
          <Link
            href="/handzettel"
            className="group bg-white border border-border rounded-2xl p-6 card-hover-glow"
          >
            <span className="text-4xl block mb-3">📰</span>
            <h2 className="font-bold text-secondary group-hover:text-primary transition-colors">Handzettel</h2>
            <p className="text-sm text-muted mt-1">Aktuelle Wochenangebote</p>
          </Link>
          <Link
            href="/kontakt"
            className="group bg-white border border-border rounded-2xl p-6 card-hover-glow"
          >
            <span className="text-4xl block mb-3">📞</span>
            <h2 className="font-bold text-secondary group-hover:text-primary transition-colors">Kontakt</h2>
            <p className="text-sm text-muted mt-1">Wir helfen dir weiter</p>
          </Link>
        </div>

        <p className="text-sm text-muted">
          Oder ruf uns direkt an:{" "}
          <a href="tel:02823418707" className="text-primary font-medium hover:underline">02823-418707</a>
        </p>
      </div>
    </>
  );
}
