import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Professionelle Zertifikatskurse | Getränkeakademie",
  description: "IHK-Zertifikate, Sommelier-Ausbildungen und Fachkurse für Wein, Bier, Spirituosen — alle buchbaren Kurse auf einen Blick.",
};

type Kurs = {
  titel: string;
  abschluss: string;
  anbieter: string;
  dauer: string;
  kosten: string;
  beschreibung: string;
  url: string;
  kategorie: "wein" | "bier" | "spirituosen" | "allgemein";
  highlight?: boolean;
};

const zertifikatskurse: Kurs[] = [
  // === WEIN ===
  {
    titel: "Geprüfter Sommelier (IHK)",
    abschluss: "IHK-Zeugnis",
    anbieter: "IHK / Sommelier-Union Deutschland",
    dauer: "10-12 Monate (berufsbegleitend)",
    kosten: "ca. 3.500-5.500 EUR",
    beschreibung: "Die hoechste deutsche Sommelier-Ausbildung. Weinwissen, Service, Sensorik, Menueberatung, Kalkulation und Betriebsfuehrung. Voraussetzung: Abschluss in Gastronomie oder 3 Jahre Berufserfahrung.",
    url: "https://www.sommelier-union.de",
    kategorie: "wein",
    highlight: true,
  },
  {
    titel: "WSET Level 1 - Award in Wines",
    abschluss: "WSET Level 1 Zertifikat",
    anbieter: "Wine & Spirit Education Trust (WSET)",
    dauer: "1 Tag (6-8 Stunden)",
    kosten: "ca. 200-300 EUR",
    beschreibung: "Einstieg in die Weinwelt. Grundlagen der Weintypen, Rebsorten und Verkostungstechnik. Ideal fuer Quereinsteiger und Weinliebhaber.",
    url: "https://www.wsetglobal.com/qualifications/wset-level-1-award-in-wines/",
    kategorie: "wein",
  },
  {
    titel: "WSET Level 2 - Award in Wines",
    abschluss: "WSET Level 2 Zertifikat",
    anbieter: "Wine & Spirit Education Trust (WSET)",
    dauer: "3-5 Tage oder 6-8 Wochen (abends)",
    kosten: "ca. 500-700 EUR",
    beschreibung: "Vertiefung: Rebsorten, Anbaugebiete, Weinherstellung, Etikettenlesen und systematische Verkostung (SAT). International anerkannt.",
    url: "https://www.wsetglobal.com/qualifications/wset-level-2-award-in-wines/",
    kategorie: "wein",
  },
  {
    titel: "WSET Level 3 - Award in Wines",
    abschluss: "WSET Level 3 Zertifikat + Pin",
    anbieter: "Wine & Spirit Education Trust (WSET)",
    dauer: "ca. 6-12 Monate (berufsbegleitend)",
    kosten: "ca. 1.200-1.800 EUR",
    beschreibung: "Fortgeschrittenes Expertenwissen. Detaillierte Analyse von Weinregionen weltweit, Vinifikation, Qualitaetsbewertung und Geschaeftsaspekte. Voraussetzung: WSET Level 2.",
    url: "https://www.wsetglobal.com/qualifications/wset-level-3-award-in-wines/",
    kategorie: "wein",
    highlight: true,
  },
  {
    titel: "Weinberater (IHK)",
    abschluss: "IHK-Zertifikat",
    anbieter: "Verschiedene IHK-Standorte",
    dauer: "40-80 Stunden",
    kosten: "ca. 600-1.200 EUR",
    beschreibung: "Grundlagen der Weinberatung im Handel. Rebsorten, Anbaugebiete, Verkostung und Kundenberatung. Ideal fuer den Getraenkehandel.",
    url: "https://www.ihk.de",
    kategorie: "wein",
  },
  {
    titel: "Weinfachberater (DWI)",
    abschluss: "DWI-Zertifikat",
    anbieter: "Deutsches Weininstitut",
    dauer: "3 Tage Intensivkurs",
    kosten: "ca. 400-600 EUR",
    beschreibung: "Fokus auf deutsche Weine: 13 Anbaugebiete, Qualitaetsstufen, Rebsorten und Vermarktung. Perfekt fuer den deutschen Weinhandel.",
    url: "https://www.deutscheweine.de",
    kategorie: "wein",
  },
  // === BIER ===
  {
    titel: "Biersommelier (Doemens)",
    abschluss: "Doemens-Diplom Biersommelier",
    anbieter: "Doemens Akademie, Graefelfing",
    dauer: "2 Wochen Vollzeit (ca. 80 Std.)",
    kosten: "ca. 3.200-3.800 EUR",
    beschreibung: "Die renommierteste Biersommelier-Ausbildung im deutschsprachigen Raum. Braukunst, Sensorik, Bierstile weltweit, Food Pairing, Praesentation und Beratung.",
    url: "https://www.doemens.org",
    kategorie: "bier",
    highlight: true,
  },
  {
    titel: "Bier-Botschafter (IHK)",
    abschluss: "IHK-Zertifikat Bier-Botschafter",
    anbieter: "IHK Muenchen / verschiedene Standorte",
    dauer: "3-5 Tage",
    kosten: "ca. 800-1.500 EUR",
    beschreibung: "Kompaktkurs fuer den Getraenkehandel und die Gastronomie. Bierherstellung, Bierstile, Sensorik und Kundenberatung.",
    url: "https://www.ihk.de",
    kategorie: "bier",
  },
  {
    titel: "Certified Beer Server (Cicerone)",
    abschluss: "Cicerone CBS Zertifikat",
    anbieter: "Cicerone Certification Program",
    dauer: "Selbststudium + Online-Pruefung",
    kosten: "ca. 79 USD",
    beschreibung: "Internationaler Einstieg. Grundlagen des Bierservice: Ausschank, Lagerung, Bierstile und Fehlererkennung. Online-Pruefung mit 60 Multiple-Choice-Fragen.",
    url: "https://www.cicerone.org/us-en/certifications/certified-beer-server",
    kategorie: "bier",
  },
  {
    titel: "Certified Cicerone",
    abschluss: "Certified Cicerone",
    anbieter: "Cicerone Certification Program",
    dauer: "6-12 Monate Vorbereitung",
    kosten: "ca. 450 USD (Pruefung: 250 + 200 USD)",
    beschreibung: "Fortgeschrittene Pruefung: Braukunst, Bierstile, Sensorik, Ausschank-Technologie und Pairing. Schriftlich + Verkostung + Demonstration. International hoechstes Ansehen.",
    url: "https://www.cicerone.org/us-en/certifications/certified-cicerone",
    kategorie: "bier",
    highlight: true,
  },
  // === SPIRITUOSEN ===
  {
    titel: "WSET Level 2 - Award in Spirits",
    abschluss: "WSET Level 2 Spirits Zertifikat",
    anbieter: "Wine & Spirit Education Trust (WSET)",
    dauer: "2-3 Tage",
    kosten: "ca. 500-700 EUR",
    beschreibung: "Systematische Einfuehrung in alle Spirituosenkategorien: Whisky, Rum, Gin, Brandy, Tequila, Vodka. Herstellung, Verkostung und Service.",
    url: "https://www.wsetglobal.com/qualifications/wset-level-2-award-in-spirits/",
    kategorie: "spirituosen",
  },
  {
    titel: "WSET Level 3 - Award in Spirits",
    abschluss: "WSET Level 3 Spirits Zertifikat",
    anbieter: "Wine & Spirit Education Trust (WSET)",
    dauer: "ca. 3-6 Monate",
    kosten: "ca. 1.500-2.000 EUR",
    beschreibung: "Expertenniveau: Vertiefte Analyse aller Spirituosenkategorien, Destillationstechnik, Reifung, globale Maerkte und Trends.",
    url: "https://www.wsetglobal.com/qualifications/wset-level-3-award-in-spirits/",
    kategorie: "spirituosen",
    highlight: true,
  },
  {
    titel: "Spirituosen-Sommelier (Doemens)",
    abschluss: "Doemens-Diplom Spirituosen-Sommelier",
    anbieter: "Doemens Akademie, Graefelfing",
    dauer: "1 Woche Vollzeit",
    kosten: "ca. 2.200-2.800 EUR",
    beschreibung: "Destillation, Reifung, Verkostung aller Spirituosenkategorien. Cocktails, Bar-Management und Kundenberatung. Abschluss mit Pruefung.",
    url: "https://www.doemens.org",
    kategorie: "spirituosen",
  },
  {
    titel: "Barkeeper / Barmixer (IHK)",
    abschluss: "IHK-Zertifikat",
    anbieter: "Verschiedene IHK-Standorte",
    dauer: "1-2 Wochen",
    kosten: "ca. 800-1.500 EUR",
    beschreibung: "Praxiskurs: Cocktailtechniken, Spirituosenkunde, Bar-Setup, Kalkulation und Gaestebetreuung. Mit praktischer Pruefung.",
    url: "https://www.ihk.de",
    kategorie: "spirituosen",
  },
  // === ALLGEMEIN ===
  {
    titel: "Getraenkefachwirt (IHK)",
    abschluss: "IHK-Pruefungszeugnis (Meister-Niveau)",
    anbieter: "IHK",
    dauer: "12-18 Monate (berufsbegleitend)",
    kosten: "ca. 3.000-5.000 EUR",
    beschreibung: "Die hoechste kaufmaennische Qualifikation im Getraenkehandel. BWL, Marketing, Sortimentsgestaltung, Logistik und Personalfuehrung. Auf Meisterebene (DQR 6).",
    url: "https://www.ihk.de",
    kategorie: "allgemein",
    highlight: true,
  },
  {
    titel: "Fachkraft fuer Getraenkeschankanlagen",
    abschluss: "Sachkundenachweis nach TRSK",
    anbieter: "TUEV / DEKRA / IHK",
    dauer: "2-3 Tage",
    kosten: "ca. 400-700 EUR",
    beschreibung: "Gesetzlich vorgeschriebener Sachkundenachweis fuer den Betrieb von Schankanlagen. Hygiene, Technik, Wartung und Reinigung nach TRSK.",
    url: "https://www.tuv.com",
    kategorie: "allgemein",
  },
  {
    titel: "Ausbilder-Eignungspruefung (AEVO/AdA)",
    abschluss: "IHK-Ausbilderschein",
    anbieter: "IHK",
    dauer: "1-2 Wochen oder berufsbegleitend",
    kosten: "ca. 500-800 EUR",
    beschreibung: "Berechtigung zur Ausbildung von Lehrlingen. Pflicht fuer Betriebe die ausbilden wollen. Paedagogik, Arbeitsrecht und Pruefungswesen.",
    url: "https://www.ihk.de",
    kategorie: "allgemein",
  },
];

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
        <Link href="/akademie" className="text-sm text-primary hover:underline mb-4 inline-block">&larr; Zurueck zur Akademie</Link>
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary mb-3">Professionelle Zertifikatskurse</h1>
        <p className="text-muted max-w-2xl mx-auto">
          Von der IHK ueber Doemens bis zum WSET — hier findest du alle buchbaren Kurse mit anerkanntem Abschluss.
          Investiere in dein Fachwissen und werde zertifizierter Experte.
        </p>
      </div>

      {/* Info-Banner */}
      <div className="bg-gradient-to-r from-primary to-red-700 text-white rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center gap-4">
        <span className="text-4xl">💡</span>
        <div>
          <h3 className="font-bold text-lg">Du willst dich weiterbilden?</h3>
          <p className="text-white/90 text-sm">
            Sprich uns an! Wir bei Trinkgut Jammers unterstuetzen Mitarbeiter bei Weiterbildungen.
            Einige Kurse koennen ueber Bildungsgutscheine gefoerdert werden.
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
                      Zum Kurs &rarr;
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
              <p>3. Spirituosen-Sommelier</p>
              <p className="text-primary">&darr;</p>
              <p className="font-bold text-secondary">4. WSET Level 3 Spirits</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <p className="text-muted mb-4">Fragen zu Kursen oder Foerderung? Sprich uns direkt an!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/akademie" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
            Zurueck zur Akademie
          </Link>
          <a href="tel:+4928234187071" className="px-6 py-3 border-2 border-secondary text-secondary rounded-xl font-semibold hover:bg-secondary hover:text-white transition-colors">
            Anrufen: 02823-418707
          </a>
        </div>
      </div>
    </div>
  );
}
