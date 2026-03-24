import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "5€ Follower-Rabatt" };

export default function FollowerRabattPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10 animate-fade-in-up">
        <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">Exklusiv</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary mb-3">5€ Follower-Rabatt</h1>
        <p className="text-muted max-w-lg mx-auto">
          Folge uns auf Instagram und spare 5€ auf ausgewählte Produkte. Exklusiv nur für unsere Follower!
        </p>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-8 mb-10 text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">So funktioniert&apos;s</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="text-center">
            <span className="text-4xl block mb-2">1️⃣</span>
            <h3 className="font-bold mb-1">Folgen</h3>
            <p className="text-sm text-white/80">Folge uns auf Instagram @trinkgutjammers_goch</p>
          </div>
          <div className="text-center">
            <span className="text-4xl block mb-2">2️⃣</span>
            <h3 className="font-bold mb-1">Produkt wählen</h3>
            <p className="text-sm text-white/80">Wähle ein Produkt aus der Rabatt-Auswahl unten</p>
          </div>
          <div className="text-center">
            <span className="text-4xl block mb-2">3️⃣</span>
            <h3 className="font-bold mb-1">Sparen</h3>
            <p className="text-sm text-white/80">Zeig an der Kasse dein Follow und spare 5€</p>
          </div>
        </div>
        <div className="text-center mt-6">
          <a
            href="https://www.instagram.com/trinkgutjammers_goch/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-secondary font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            Jetzt folgen
          </a>
        </div>
      </div>

      {/* Placeholder Products */}
      <h2 className="text-2xl font-bold text-secondary mb-6">Aktuelle Rabatt-Produkte</h2>
      <div className="bg-amber-50 border-2 border-amber-300 border-dashed rounded-2xl p-10 text-center mb-10">
        <span className="text-5xl block mb-4">🏷️</span>
        <h3 className="text-xl font-bold text-secondary mb-2">Produkte werden bald hinzugefügt</h3>
        <p className="text-muted max-w-md mx-auto mb-4">
          Die Rabatt-Produkte werden von uns manuell ausgewählt und hier angezeigt.
          Schau regelmäßig vorbei — es lohnt sich!
        </p>
        <p className="text-sm text-amber-700 font-medium">
          Tipp: Folge uns auf Instagram um sofort zu erfahren welche Produkte im Rabatt sind.
        </p>
      </div>

      {/* Terms */}
      <div className="bg-light rounded-xl p-6 text-sm text-muted">
        <h3 className="font-semibold text-secondary mb-2">Teilnahmebedingungen</h3>
        <ul className="space-y-1 list-disc pl-5">
          <li>Gültig nur für aktive Instagram-Follower von @trinkgutjammers_goch</li>
          <li>Follow muss an der Kasse vorgezeigt werden</li>
          <li>Nicht kombinierbar mit anderen Rabatten</li>
          <li>Nur solange der Vorrat reicht</li>
          <li>Trinkgut Jammers behält sich vor, die Auswahl der Produkte jederzeit zu ändern</li>
        </ul>
      </div>
    </div>
  );
}
