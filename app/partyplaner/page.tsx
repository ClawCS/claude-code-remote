"use client";
import Link from "next/link";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { calculateNeeds, distributionValidity, getRecommendations, type PartyConfig } from "@/lib/party-planner";
import { assortmentProducts as products } from "@/lib/catalog";

export default function PartyplanerPage() {
  const { addItem } = useCart();
  const [config, setConfig] = useState<PartyConfig>({
    guests: 20,
    duration: 5,
    beerDrinkers: 50,
    wineDrinkers: 20,
    softDrinkers: 20,
    spiritDrinkers: 10,
  });
  const [showResults, setShowResults] = useState(false);
  const { total, valid } = distributionValidity(config);

  const updateConfig = (next: PartyConfig) => {
    setConfig(next);
    setShowResults(false);
  };
  const handleCalculate = () => {
    if (!valid) return;
    setShowResults(true);
  };

  const needs = calculateNeeds(config);
  const recommendations = getRecommendations(needs, products);

  const handleAddAll = () => {
    if (!valid || !showResults) return;
    recommendations.forEach((r) => addItem(r.product, r.quantity));
  };

  return (
    <>
    <div className="page-hero-banner py-16 md:py-24">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <nav className="text-sm text-white/60 mb-4"><Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">/</span> <span className="text-white">Partyplaner</span></nav>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Partyplaner</h1>
        <p className="text-white/80 max-w-xl mx-auto text-lg">
          Plane deine Getränke als unverbindliche Mengenhilfe. Die passende Auswahl und deinen Bedarf stimmen wir persönlich mit dir ab.
        </p>
      </div>
    </div>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* Config Form */}
      <div className="bg-white border border-border rounded-xl p-6 mb-8">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="party-guests" className="block text-sm font-medium text-secondary mb-2">
              Anzahl Gäste
            </label>
            <input
              id="party-guests"
              type="range"
              min={5}
              max={200}
              step={5}
              value={config.guests}
              onChange={(e) => updateConfig({ ...config, guests: +e.target.value })}
              className="w-full accent-primary"
            />
            <div className="text-2xl font-bold text-primary mt-1">{config.guests} Personen</div>
          </div>

          <div>
            <label htmlFor="party-duration" className="block text-sm font-medium text-secondary mb-2">
              Dauer der Party
            </label>
            <input
              id="party-duration"
              type="range"
              min={2}
              max={12}
              value={config.duration}
              onChange={(e) => updateConfig({ ...config, duration: +e.target.value })}
              className="w-full accent-primary"
            />
            <div className="text-2xl font-bold text-primary mt-1">{config.duration} Stunden</div>
          </div>
        </div>

        <hr className="my-6 border-border" />

        <h2 className="utility-heading font-semibold text-secondary mb-4">Was trinken deine Gäste? (Prozent-Verteilung)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "beerDrinkers" as const, label: "🍺 Bier", color: "text-[#92400E]" },
            { key: "wineDrinkers" as const, label: "🍷 Wein", color: "text-[#7A1428]" },
            { key: "softDrinkers" as const, label: "🥤 Softdrinks", color: "text-[#DC2626]" },
            { key: "spiritDrinkers" as const, label: "🥃 Spirituosen", color: "text-[#B91C1C]" },
          ].map(({ key, label, color }) => (
            <div key={key} className="text-center">
              <label htmlFor={`party-${key}`} className="block text-sm font-medium text-muted mb-1">{label}</label>
              <input
                id={`party-${key}`}
                type="range"
                min={0}
                max={100}
                step={5}
                value={config[key]}
                onChange={(e) => updateConfig({ ...config, [key]: +e.target.value })}
                aria-invalid={!valid}
                aria-describedby={!valid ? "party-distribution-error" : undefined}
                className="w-full accent-primary"
              />
              <span className={`text-lg font-bold ${color}`}>{config[key]}%</span>
            </div>
          ))}
        </div>
        {!valid && (
          <p id="party-distribution-error" role="alert" className="text-sm text-red-700 mt-2">
            Summe: {total}% — bitte verteile genau 100% auf die Kategorien (jeweils 0–100%).
          </p>
        )}

        <button
          onClick={handleCalculate}
          disabled={!valid}
          className="mt-6 w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-lg"
        >
          Berechnen
        </button>
      </div>

      {/* Results */}
      {showResults && valid && (
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-secondary mb-2">Deine Party-Einkaufsliste</h2>
          <p className="text-sm text-muted mb-6">
            Für {config.guests} Gäste, {config.duration} Stunden – ca. {needs.totalDrinks} Getränke gesamt
          </p>

          <div className="space-y-4 mb-6">
            {!recommendations.some(rec => rec.reason.endsWith(" Wasser")) && <p className="text-sm text-muted">Zusätzlich ca. {Math.round(needs.waterLiters)} l Wasser einplanen. Passendes Mineralwasser und Packungsgrößen bitte im Markt abstimmen; kein Wasserartikel zur Anfrageliste hinzugefügt.</p>}
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-light rounded-lg">
                {rec.product.image && rec.product.image !== "/images/home/brand-logo.webp" && <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 relative">
                  <Image src={rec.product.image} alt={rec.product.name} fill sizes="64px" className="object-contain p-1" />
                </div>}
                <div className="flex-1">
                  <p className="font-semibold text-secondary">{rec.product.name}</p>
                  <p className="text-sm text-muted">{rec.reason}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{rec.quantity} Packungen</p>
                  <p className="text-xs text-muted">{rec.product.unit}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-secondary">Preis und Verfügbarkeit auf Anfrage</p>
              <p className="text-sm text-muted">Noch keine Bestellung oder Reservierung.</p>
            </div>
            <button
              onClick={handleAddAll}
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
            >
              Alles zur Anfrageliste
            </button>
          </div>

          <p className="text-xs text-muted mt-4">
            * Berechnung basiert auf ca. 2 Getränken pro Person pro Stunde. Dazu empfehlen wir immer genug Wasser!
            Gerne beraten wir dich persönlich im Markt.
          </p>
        </div>
      )}
    </div>
    </>
  );
}
