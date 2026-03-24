import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Handzettel - Aktuelle Prospekte",
  description: "Der aktuelle Trinkgut Jammers Handzettel mit allen Wochenangeboten. Werbekreis 3.6 Goch.",
};

export default function HandzettelPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-8">
        <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">Wochenangebote</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary mb-3">Aktueller Handzettel</h1>
        <p className="text-muted max-w-lg mx-auto">
          Unser aktueller Prospekt mit allen Angeboten der Woche. Werbekreis 3.6 — Goch und Umgebung.
        </p>
      </div>

      {/* Direkt-Link zum Trinkgut Handzettel */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
        <div className="bg-gradient-to-r from-primary to-red-700 p-6 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Trinkgut Prospekt der Woche</h2>
          <p className="text-white/80 text-sm">Klicke auf den Button um den aktuellen Handzettel direkt zu sehen</p>
        </div>
        <div className="p-8 text-center">
          <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto mb-6">
            <a
              href="https://www.trinkgut.de/angebote/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white rounded-xl font-bold hover:bg-red-700 transition-colors text-lg"
            >
              <span className="text-2xl">🇩🇪</span>
              Handzettel DE
            </a>
            <a
              href="https://www.trinkgut.de/angebote/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors text-lg"
            >
              <span className="text-2xl">🇳🇱</span>
              Folder NL
            </a>
          </div>
          <p className="text-xs text-muted">Prospekt wird direkt bei trinkgut.de geoeffnet — Werbekreis 3.6</p>
        </div>
      </div>

      {/* Iframe Embed */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
        <iframe
          src="https://www.trinkgut.de/angebote/"
          className="w-full border-0"
          style={{ height: "800px" }}
          title="Trinkgut Handzettel"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>

      {/* Info */}
      <div className="bg-light rounded-xl p-6 text-center">
        <h3 className="font-bold text-secondary mb-2">Angebote gelten in unserem Markt in Goch</h3>
        <p className="text-muted text-sm mb-4">
          Jurgenstr. 20, 47574 Goch — Werbekreis 3.6
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/angebote" className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-red-700 transition-colors text-sm">
            Online-Angebote ansehen
          </Link>
          <a href="tel:02823418707" className="px-5 py-2.5 border-2 border-secondary text-secondary rounded-xl font-semibold hover:bg-secondary hover:text-white transition-colors text-sm">
            Anrufen: 02823-418707
          </a>
        </div>
      </div>
    </div>
  );
}
