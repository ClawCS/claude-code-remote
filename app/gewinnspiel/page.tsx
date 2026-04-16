"use client";

import { useState } from "react";
import Image from "next/image";

type Gewinnspiel = {
  month: string;
  year: number;
  title: string;
  prize: string;
  value: string;
  description: string;
  image: string;
  active: boolean;
  winners?: number;
};

const gewinnspiele: Gewinnspiel[] = [
  {
    month: "April",
    year: 2026,
    title: "Edifier MP230 + Ballantine's KISS Edition",
    prize: "Edifier MP230 Bluetooth-Lautsprecher + Ballantine's Finest KISS Edition",
    value: "200",
    description: "Gewinne einen stylischen Edifier MP230 Retro-Lautsprecher zusammen mit der limitierten Ballantine's KISS Edition! 2 Gewinner werden ausgelost.",
    image: "/images/gewinnspiele/april.png",
    active: true,
    winners: 2,
  },
  {
    month: "Maerz",
    year: 2026,
    title: "Monster Energy Cooler",
    prize: "Monster Energy Cooler Kuehlschrank",
    value: "500",
    description: "Ein exklusiver Monster Energy Cooler Kuehlschrank im Wert von ueber 500 Euro — der Hingucker fuer jede Maennerhoehle!",
    image: "/images/gewinnspiele/maerz.png",
    active: false,
  },
  {
    month: "Februar",
    year: 2026,
    title: "@Home Sportpaket",
    prize: "OTT Sports Fitness-Paket",
    value: "250",
    description: "Ein komplettes @Home Sportpaket von OTT Sports: Yogamatte, Widerstandsbaender, Sporttasche, Springseil und mehr. Alles fuer dein Heimtraining!",
    image: "/images/gewinnspiele/februar.png",
    active: false,
  },
  {
    month: "Januar",
    year: 2026,
    title: "Salitos Sommer-Paket",
    prize: "Salitos Surfboard + Ueberraschungspaket",
    value: "300",
    description: "Starte ins neue Jahr mit Urlaubsfeeling! Ein Salitos Surfboard und ein Salitos Blue Ueberraschungspaket fuer den naechsten Sommer.",
    image: "/images/gewinnspiele/januar.png",
    active: false,
  },
];

export default function GewinnspielPage() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [selectedGewinnspiel, setSelectedGewinnspiel] = useState<Gewinnspiel | null>(null);

  const activeGewinnspiel = gewinnspiele.find((g) => g.active);
  const pastGewinnspiele = gewinnspiele.filter((g) => !g.active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const entry = {
      gewinnspiel: selectedGewinnspiel?.title,
      vorname: formData.get("vorname"),
      nachname: formData.get("nachname"),
      email: formData.get("email"),
      instagram: formData.get("instagram"),
      timestamp: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("gewinnspiel-teilnahmen") || "[]");
    existing.push(entry);
    localStorage.setItem("gewinnspiel-teilnahmen", JSON.stringify(existing));

    const subject = encodeURIComponent(`Neue Gewinnspiel-Teilnahme: ${entry.gewinnspiel}`);
    const body = encodeURIComponent(
      `Neue Teilnahme am Gewinnspiel!\n\nGewinnspiel: ${entry.gewinnspiel}\nVorname: ${entry.vorname}\nNachname: ${entry.nachname}\nE-Mail: ${entry.email}\nInstagram: ${entry.instagram || "–"}\nZeitpunkt: ${new Date().toLocaleString("de-DE")}`
    );
    window.location.href = `mailto:hanna.thewald@trinkgut-jammers.de?subject=${subject}&body=${body}`;

    setSubmitted(selectedGewinnspiel?.title || "");
    setSelectedGewinnspiel(null);
  };

  if (submitted) {
    return (
      <>
        <div className="page-hero-banner py-16 md:py-24 relative">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: `${3 + (i % 4) * 2}px`,
                height: `${3 + (i % 4) * 2}px`,
                background: i % 3 === 0 ? "rgba(245, 158, 11, 0.7)" : "rgba(255, 255, 255, 0.5)",
                left: `${2 + (i * 4.2) % 96}%`,
                top: `${5 + (i * 7.3) % 85}%`,
                boxShadow: i % 3 === 0
                  ? "0 0 6px rgba(245, 158, 11, 0.5)"
                  : "0 0 4px rgba(255, 255, 255, 0.4)",
                animation: `particleFloat ${5 + (i % 4) * 2}s ease-in-out ${(i * 0.4) % 4}s infinite`,
              }}
            />
          ))}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <nav className="text-sm text-white/60 mb-4"><a href="/" className="hover:text-white">Home</a> <span className="mx-1">/</span> <span className="text-white">Gewinnspiel</span></nav>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Gewinnspiele</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="bg-white border border-border/60 rounded-2xl p-10 shadow-lg">
            <span className="text-6xl block mb-4">🎉</span>
            <h2 className="text-3xl font-bold text-[#1F2937] mb-3">Teilnahme erfolgreich!</h2>
            <p className="text-muted mb-2">Du nimmst jetzt am Gewinnspiel teil:</p>
            <p className="text-lg font-bold text-[#DC2626] mb-6">{submitted}</p>
            <p className="text-sm text-muted mb-8">Die Gewinner werden per E-Mail benachrichtigt. Viel Glueck!</p>
            <button onClick={() => setSubmitted(null)} className="px-6 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl transition-colors">
              Weitere Gewinnspiele ansehen
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Hero Banner with shimmer particles */}
      <div className="page-hero-banner py-16 md:py-24 relative">
        {/* Shimmer particles */}
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: `${3 + (i % 4) * 2}px`,
              height: `${3 + (i % 4) * 2}px`,
              background: i % 3 === 0 ? "rgba(245, 158, 11, 0.7)" : "rgba(255, 255, 255, 0.5)",
              left: `${2 + (i * 4.2) % 96}%`,
              top: `${5 + (i * 7.3) % 85}%`,
              boxShadow: i % 3 === 0
                ? "0 0 6px rgba(245, 158, 11, 0.5)"
                : "0 0 4px rgba(255, 255, 255, 0.4)",
              animation: `particleFloat ${5 + (i % 4) * 2}s ease-in-out ${(i * 0.4) % 4}s infinite`,
            }}
          />
        ))}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <nav className="text-sm text-white/60 mb-4"><a href="/" className="hover:text-white">Home</a> <span className="mx-1">/</span> <span className="text-white">Gewinnspiel</span></nav>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Monatsgewinnspiele 2026</h1>
          <p className="text-white/80 max-w-lg mx-auto text-lg">
            Jeden Monat ein neues Gewinnspiel — mitmachen lohnt sich!
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Aktuelles Gewinnspiel — gross und prominent */}
        {activeGewinnspiel && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC2626] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#DC2626]" />
              </span>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#DC2626]">Aktuelles Gewinnspiel — {activeGewinnspiel.month} {activeGewinnspiel.year}</h2>
            </div>
            <div className="relative bg-white border border-border/60 rounded-3xl overflow-hidden shadow-xl group">
              <div className="grid md:grid-cols-2">
                {/* Bild */}
                <div className="relative aspect-[3/4] md:aspect-auto md:min-h-[480px] bg-black overflow-hidden">
                  <Image
                    src={activeGewinnspiel.image}
                    alt={activeGewinnspiel.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                    unoptimized
                  />
                </div>
                {/* Info */}
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#DC2626] text-white px-3 py-1 rounded-full w-fit mb-4">
                    JETZT MITMACHEN
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-[#1F2937] mb-3">{activeGewinnspiel.title}</h3>
                  <p className="text-muted leading-relaxed mb-5">{activeGewinnspiel.description}</p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    <span className="inline-flex items-center gap-1.5 text-sm bg-[#FFF5F3] text-[#DC2626] font-semibold px-3 py-1.5 rounded-lg">
                      🎁 Wert: ueber {activeGewinnspiel.value}€
                    </span>
                    {activeGewinnspiel.winners && (
                      <span className="inline-flex items-center gap-1.5 text-sm bg-amber-50 text-amber-700 font-semibold px-3 py-1.5 rounded-lg">
                        🏆 {activeGewinnspiel.winners} Gewinner
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedGewinnspiel(activeGewinnspiel)}
                    className="w-full md:w-auto px-8 py-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl btn-hover btn-shimmer shadow-lg shadow-[#DC2626]/20 text-lg transition-colors"
                  >
                    Jetzt teilnehmen
                  </button>
                  <p className="text-xs text-muted mt-3">Teilnahme kostenlos. Gewinner werden per E-Mail benachrichtigt.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Vergangene Gewinnspiele — Timeline */}
        <section className="mb-16">
          <h2 className="text-sm font-bold tracking-widest uppercase text-muted mb-8">Bisherige Gewinnspiele 2026</h2>
          <div className="relative">
            {/* Timeline-Linie */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-border to-transparent hidden md:block" />

            <div className="space-y-6">
              {pastGewinnspiele.map((g, i) => (
                <div key={g.month} className="relative md:pl-16 group">
                  {/* Timeline-Dot */}
                  <div className="absolute left-[18px] top-6 w-3 h-3 rounded-full bg-border group-hover:bg-[#DC2626] transition-colors hidden md:block ring-4 ring-white" />

                  <div className="bg-white border border-border/60 rounded-2xl overflow-hidden hover:shadow-lg transition-all card-hover-glow">
                    <div className="grid sm:grid-cols-[200px_1fr] md:grid-cols-[240px_1fr]">
                      {/* Bild */}
                      <div className="relative aspect-[4/5] sm:aspect-auto sm:min-h-[220px] bg-black overflow-hidden">
                        <Image
                          src={g.image}
                          alt={g.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 240px"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <span className="absolute top-3 left-3 text-xs font-bold bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
                          Beendet
                        </span>
                      </div>
                      {/* Info */}
                      <div className="p-5 sm:p-6 flex flex-col justify-center">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">{g.month} {g.year}</p>
                        <h3 className="text-lg font-bold text-[#1F2937] mb-2">{g.title}</h3>
                        <p className="text-sm text-muted leading-relaxed mb-3">{g.description}</p>
                        <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 font-medium px-2.5 py-1 rounded-lg w-fit">
                          🎁 Wert: ueber {g.value}€
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Instagram CTA */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Kein Gewinnspiel verpassen!</h2>
            <p className="text-white/80 mb-5 max-w-md mx-auto">
              Folge uns auf Instagram — dort kuendigen wir jeden Monat das neue Gewinnspiel zuerst an.
            </p>
            <a
              href="https://www.instagram.com/trinkgutjammers_goch/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1F2937] font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              @trinkgutjammers_goch folgen
            </a>
          </div>
        </section>
      </div>

      {/* Teilnahme Modal */}
      {selectedGewinnspiel && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setSelectedGewinnspiel(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-2xl z-50 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header mit Bild */}
            <div className="relative h-40 overflow-hidden">
              <Image
                src={selectedGewinnspiel.image}
                alt={selectedGewinnspiel.title}
                fill
                sizes="500px"
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <h2 className="text-xl font-bold text-white drop-shadow-lg">{selectedGewinnspiel.title}</h2>
                <p className="text-white/80 text-sm">{selectedGewinnspiel.month} {selectedGewinnspiel.year}</p>
              </div>
              <button onClick={() => setSelectedGewinnspiel(null)} className="absolute top-3 right-3 p-1.5 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#1F2937] mb-1">Vorname *</label>
                    <input required type="text" name="vorname" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1F2937] mb-1">Nachname *</label>
                    <input required type="text" name="nachname" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1F2937] mb-1">E-Mail *</label>
                  <input required type="email" name="email" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1F2937] mb-1">Instagram-Name (optional)</label>
                  <input type="text" name="instagram" placeholder="@dein_name" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]" />
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <input required type="checkbox" id="consent" className="mt-1 accent-[#DC2626]" />
                  <label htmlFor="consent" className="text-xs text-muted">
                    Ich akzeptiere die Teilnahmebedingungen und die Datenschutzerklaerung. *
                  </label>
                </div>
                <button type="submit" className="w-full py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl transition-colors text-lg shadow-lg shadow-[#DC2626]/20">
                  Jetzt teilnehmen
                </button>
                <p className="text-[10px] text-muted text-center">Teilnahme kostenlos. Gewinner werden per E-Mail benachrichtigt.</p>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
