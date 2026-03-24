import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Handzettel - Aktuelle Prospekte",
  description: "Der aktuelle Trinkgut Jammers Handzettel mit allen Wochenangeboten. Werbekreis 3.6 Goch.",
};

function getISOCalendarWeek() {
  const now = new Date();
  const tmp = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

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

      {/* Prospekt direkt eingebettet */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
        <div className="bg-gradient-to-r from-primary to-red-700 p-4 text-white flex items-center justify-between">
          <h2 className="text-lg font-bold">Trinkgut Prospekt KW {getISOCalendarWeek()} — Werbekreis 3.6</h2>
          <a
            href="https://www.trinkgut.de/angebote/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
          >
            Vollbild öffnen ↗
          </a>
        </div>
        <iframe
          src="https://www.trinkgut.de/angebote/"
          className="w-full border-0"
          style={{ height: "900px" }}
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
