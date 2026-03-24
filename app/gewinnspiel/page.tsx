"use client";

import { useState } from "react";
import Link from "next/link";

type Gewinnspiel = {
  title: string;
  description: string;
  prize: string;
  icon: string;
  deadline: string;
  active: boolean;
};

const gewinnspiele: Gewinnspiel[] = [
  {
    title: "Monster Energy Cooler",
    description: "Gewinne einen exklusiven Monster Energy Kühlschrank! Einfach bei uns im Markt eine Monster Energy kaufen und am Gewinnspiel teilnehmen.",
    prize: "Monster Energy Cooler Kühlschrank",
    icon: "🧊",
    deadline: "31.03.2026",
    active: true,
  },
  {
    title: "Weber Grill Gewinnspiel",
    description: "Gewinne einen original Weber Spirit E-325S Gasgrill im Wert von 600€! Perfekt für die Grillsaison. Teilnahme über Instagram oder im Markt.",
    prize: "Weber Spirit Gasgrill (Wert: 600€)",
    icon: "🔥",
    deadline: "15.04.2026",
    active: true,
  },
  {
    title: "Salitos Sommer-Gewinnspiel",
    description: "Der Sommer kommt! Gewinne ein Salitos Überraschungspaket. Folge uns auf Instagram und markiere einen Freund.",
    prize: "Salitos Überraschungspaket",
    icon: "🏖️",
    deadline: "30.04.2026",
    active: true,
  },
];

export default function GewinnspielPage() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [selectedGewinnspiel, setSelectedGewinnspiel] = useState<Gewinnspiel | null>(null);

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
    // Store locally
    const existing = JSON.parse(localStorage.getItem("gewinnspiel-teilnahmen") || "[]");
    existing.push(entry);
    localStorage.setItem("gewinnspiel-teilnahmen", JSON.stringify(existing));

    // Send notification email via mailto (client-side fallback)
    const subject = encodeURIComponent(`Neue Gewinnspiel-Teilnahme: ${entry.gewinnspiel}`);
    const body = encodeURIComponent(
      `Neue Teilnahme am Gewinnspiel!\n\nGewinnspiel: ${entry.gewinnspiel}\nVorname: ${entry.vorname}\nNachname: ${entry.nachname}\nE-Mail: ${entry.email}\nInstagram: ${entry.instagram || "–"}\nZeitpunkt: ${new Date().toLocaleString("de-DE")}`
    );
    // Open mailto in background (won't interrupt user)
    const mailtoLink = document.createElement("a");
    mailtoLink.href = `mailto:hanna.thewald@trinkgut-jammers.de?subject=${subject}&body=${body}`;
    mailtoLink.click();

    setSubmitted(selectedGewinnspiel?.title || "");
    setSelectedGewinnspiel(null);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <span className="text-6xl block mb-4">🎉</span>
        <h1 className="text-3xl font-bold text-secondary mb-3">Teilnahme erfolgreich!</h1>
        <p className="text-muted mb-2">Du nimmst jetzt am Gewinnspiel teil:</p>
        <p className="text-lg font-bold text-primary mb-6">{submitted}</p>
        <p className="text-sm text-muted mb-8">Die Gewinner werden per E-Mail benachrichtigt. Viel Glück!</p>
        <button onClick={() => setSubmitted(null)} className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors">
          Weitere Gewinnspiele ansehen
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10">
        <span className="text-5xl block mb-4">🏆</span>
        <h1 className="text-3xl font-bold text-secondary mb-2">Gewinnspiele</h1>
        <p className="text-muted max-w-lg mx-auto">
          Bei Trinkgut Jammers gibt es regelmäßig tolle Gewinnspiele. Mitmachen lohnt sich!
          Folge uns auch auf <a href="https://www.instagram.com/trinkgutjammers_goch/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Instagram</a> für exklusive Aktionen.
        </p>
      </div>

      {/* Active Gewinnspiele */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {gewinnspiele.filter(g => g.active).map((g) => (
          <div key={g.title} className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all group">
            <div className="bg-gradient-to-br from-primary to-primary-dark p-6 text-white text-center">
              <span className="text-5xl block mb-3">{g.icon}</span>
              <h3 className="text-xl font-bold">{g.title}</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted mb-3">{g.description}</p>
              <div className="flex items-center gap-2 text-sm mb-4">
                <span className="text-xs bg-accent/20 text-amber-700 font-medium px-2 py-0.5 rounded">Preis: {g.prize}</span>
              </div>
              <p className="text-xs text-muted mb-4">Teilnahmeschluss: {g.deadline}</p>
              <button
                onClick={() => setSelectedGewinnspiel(g)}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
              >
                Jetzt teilnehmen
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Instagram CTA */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-8 text-white text-center mb-12">
        <h2 className="text-2xl font-bold mb-2">Exklusive Aktionen auf Instagram</h2>
        <p className="text-white/80 mb-4 max-w-md mx-auto">
          1€ Rabatt nur für Follower, exklusive Gewinnspiele und Behind-the-Scenes aus dem Markt. Folge uns jetzt!
        </p>
        <a
          href="https://www.instagram.com/trinkgutjammers_goch/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-secondary font-bold rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          @trinkgutjammers_goch folgen
        </a>
      </div>

      {/* Archiv Link */}
      <div className="text-center mb-12">
        <Link href="/gewinnspiel/archiv" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
          <span>📅</span> Gewinnspiel-Archiv 2025 ansehen
        </Link>
      </div>

      {/* Teilnahme Modal */}
      {selectedGewinnspiel && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setSelectedGewinnspiel(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-2xl z-50 shadow-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-3xl">{selectedGewinnspiel.icon}</span>
                <h2 className="text-xl font-bold text-secondary mt-2">{selectedGewinnspiel.title}</h2>
              </div>
              <button onClick={() => setSelectedGewinnspiel(null)} className="p-1 text-muted hover:text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Vorname *</label>
                  <input required type="text" name="vorname" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Nachname *</label>
                  <input required type="text" name="nachname" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">E-Mail *</label>
                <input required type="email" name="email" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Instagram-Name (optional)</label>
                <input type="text" name="instagram" placeholder="@dein_name" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div className="flex items-start gap-2">
                <input required type="checkbox" id="consent" className="mt-1 accent-primary" />
                <label htmlFor="consent" className="text-xs text-muted">
                  Ich akzeptiere die Teilnahmebedingungen und die Datenschutzerklärung. *
                </label>
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors">
                Teilnehmen
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
