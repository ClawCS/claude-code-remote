import Link from "next/link";
import type { Metadata } from "next";
import { academyCertificates as zertifikatskurse } from "@/data/academy-certificates";

export const metadata: Metadata = {
  title: "Professionelle Zertifikatskurse | Getränkeakademie",
  description: `${zertifikatskurse.length} Weiterbildungshinweise zu IHK, WSET und Sommelier-Qualifikationen. Termine, Preise und Anmeldung bitte beim jeweiligen Anbieter prüfen.`,
  alternates: { canonical: "/akademie/zertifikate" },
};

const kategorien = [
  { key: "wein" as const, label: "Wein", icon: "\uD83C\uDF77", color: "from-purple-600 to-purple-800" },
  { key: "bier" as const, label: "Bier", icon: "\uD83C\uDF7A", color: "from-amber-500 to-amber-700" },
  { key: "spirituosen" as const, label: "Spirituosen", icon: "\uD83E\uDD43", color: "from-amber-700 to-amber-900" },
  { key: "allgemein" as const, label: "Allgemein / Handel", icon: "\uD83C\uDF93", color: "from-gray-600 to-gray-800" },
];

export default function ZertifikatePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <Link href="/akademie" className="text-sm text-primary hover:underline mb-4 inline-block">&larr; Zurück zur Akademie</Link>
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary mb-3">Professionelle Zertifikatskurse</h1>
        <p className="text-muted max-w-2xl mx-auto">
          {zertifikatskurse.length} Weiterbildungshinweise — von der IHK über Doemens bis zum WSET.
          Informationen zu Qualifikationen und Kursen; aktuelle Termine, Preise und Anmeldung bitte beim jeweiligen Anbieter prüfen.
        </p>
      </div>

      {/* Info-Banner */}
      <div className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center gap-4">
        <span className="text-4xl">💡</span>
        <div>
          <h3 className="font-bold text-lg">Du willst dich weiterbilden?</h3>
          <p className="text-white/90 text-sm">
            Sprich uns an! Wir bei Trinkgut Jammers unterstützen Mitarbeiter bei Weiterbildungen.
            Einige Kurse können über Bildungsgutscheine gefördert werden.
          </p>
        </div>
      </div>

      {/* Kategorien */}
      {kategorien.map((kat) => {
        const kurse = zertifikatskurse.filter((k) => k.kategorie === kat.key);
        return (
          <section key={kat.key} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{kat.icon}</span>
              <h2 className="text-2xl font-bold text-secondary">{kat.label}</h2>
              <span className="text-sm text-muted">({kurse.length} Kurse)</span>
            </div>

            <div className="grid gap-4">
              {kurse.map((kurs) => (
                <div
                  key={kurs.titel}
                  className={`bg-white border rounded-xl p-5 hover:shadow-lg transition-all ${kurs.highlight ? "border-primary/30 ring-1 ring-primary/10" : "border-gray-200"}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-secondary text-lg">{kurs.titel}</h3>
                        {kurs.highlight && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">Top-Empfehlung</span>
                        )}
                      </div>
                      <p className="text-muted text-sm mb-3">{kurs.beschreibung}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted">
                        <span className="bg-gray-100 px-2 py-1 rounded">🎓 {kurs.abschluss}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">🏢 {kurs.anbieter}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">⏱ {kurs.dauer}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded font-semibold">💰 {kurs.kosten}</span>
                      </div>
                    </div>
                    <a
                      href={kurs.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-colors text-sm font-semibold"
                    >
                      Informationen beim Anbieter &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Karrierepfad */}
      <section className="bg-light rounded-2xl p-8 mb-10">
        <h2 className="text-2xl font-bold text-secondary mb-6 text-center">Empfohlene Karrierepfade</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <span className="text-3xl block mb-2">🍷</span>
            <h3 className="font-bold text-secondary mb-2">Wein-Karriere</h3>
            <div className="text-sm text-muted space-y-1">
              <p>1. WSET Level 1</p>
              <p className="text-primary">&darr;</p>
              <p>2. WSET Level 2</p>
              <p className="text-primary">&darr;</p>
              <p>3. Weinberater (IHK)</p>
              <p className="text-primary">&darr;</p>
              <p>4. WSET Level 3</p>
              <p className="text-primary">&darr;</p>
              <p className="font-bold text-secondary">5. Gepr. Sommelier (IHK)</p>
            </div>
          </div>
          <div className="text-center">
            <span className="text-3xl block mb-2">🍺</span>
            <h3 className="font-bold text-secondary mb-2">Bier-Karriere</h3>
            <div className="text-sm text-muted space-y-1">
              <p>1. Certified Beer Server</p>
              <p className="text-primary">&darr;</p>
              <p>2. Bier-Botschafter (IHK)</p>
              <p className="text-primary">&darr;</p>
              <p>3. Biersommelier (Doemens)</p>
              <p className="text-primary">&darr;</p>
              <p className="font-bold text-secondary">4. Certified Cicerone</p>
            </div>
          </div>
          <div className="text-center">
            <span className="text-3xl block mb-2">🥃</span>
            <h3 className="font-bold text-secondary mb-2">Spirituosen-Karriere</h3>
            <div className="text-sm text-muted space-y-1">
              <p>1. WSET Level 2 Spirits</p>
              <p className="text-primary">&darr;</p>
              <p>2. Barkeeper (IHK)</p>
              <p className="text-primary">&darr;</p>
              <p>3. Destillat-Sommelier (Doemens)</p>
              <p className="text-primary">&darr;</p>
              <p className="font-bold text-secondary">4. WSET Level 3 Spirits</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <p className="text-muted mb-4">Fragen zu Kursen oder Förderung? Sprich uns direkt an!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/akademie" className="px-6 py-3 bg-[#DC2626] text-white rounded-xl font-semibold hover:bg-[#B91C1C] transition-colors">
            Zurück zur Akademie
          </Link>
          <a href="tel:+492823418707" className="px-6 py-3 border-2 border-secondary text-secondary rounded-xl font-semibold hover:bg-secondary hover:text-white transition-colors">
            Anrufen: 02823-418707
          </a>
        </div>
      </div>
    </div>
  );
}
