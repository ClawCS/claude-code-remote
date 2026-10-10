"use client";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/tools.module.css";
import editorial from "@/components/editorial/editorial.module.css";

import { useState } from "react";
import { calculateNeeds, distributionValidity, type PartyConfig } from "@/lib/party-planner";

const litersFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });

export default function PartyplanerPage() {
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
  const categories = [
    { label: "Bier", liters: needs.beerLiters },
    { label: "Wein", liters: needs.wineLiters },
    { label: "Softdrinks", liters: needs.softLiters },
    { label: "Spirituosen", liters: needs.spiritLiters },
    { label: "Wasser", liters: needs.waterLiters },
  ];

  return (
    <>
    <PageIntro eyebrow="Gut vorbereitet" title="Partyplaner" description="Wie viele Liter brauchst du für deine Feier? Berechne deinen Getränkebedarf nach Warengruppen – unabhängig von Marken und Wochenangeboten." breadcrumbs={[{ label: "Start", href: "/" }, { label: "Partyplaner" }]} />
    <div data-tool="planner" className={styles.body}>
      <div className={styles.planner}>
      {/* Config Form */}
      <div className={styles.panel}>
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
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { key: "beerDrinkers" as const, label: "Bier", color: "text-[#92400E]" },
            { key: "wineDrinkers" as const, label: "Wein", color: "text-[#7A1428]" },
            { key: "softDrinkers" as const, label: "Softdrinks", color: "text-[#DC2626]" },
            { key: "spiritDrinkers" as const, label: "Spirituosen", color: "text-[#B91C1C]" },
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
          className={`${editorial.primaryLink} mt-6 w-full`}
        >
          Berechnen
        </button>
      </div>

      {/* Results */}
      {showResults && valid && (
        <section aria-labelledby="party-results-title" className={styles.results}>
          <h2 id="party-results-title" className="text-xl font-bold text-secondary mb-2">Dein Getränkebedarf</h2>
          <p className="text-sm text-muted mb-6">
            Für {config.guests} Gäste und {config.duration} Stunden · Richtwerte in Litern
          </p>

          <dl className="space-y-3 mb-6">
            {categories.map(({ label, liters }) => (
              <div key={label} >
                <dt className="font-semibold text-secondary">{label}</dt>
                <dd className="text-xl font-bold text-primary whitespace-nowrap tabular-nums">{litersFormat.format(liters)} l</dd>
              </div>
            ))}
          </dl>

          <p className="text-sm text-muted border-t border-border pt-4">
            Unverbindliche Mengenhilfe auf Basis von ca. 2 Getränken pro Gast und Stunde.
            Wasser ist zusätzlich mit 0,2 Litern pro Gast und Stunde eingeplant.
            Den passenden Bedarf stimmen wir gerne persönlich mit dir ab.
          </p>
        </section>
      )}
      {!showResults && <aside className={styles.results}><h2>Eine erste Mengenhilfe</h2><p>Gäste und Dauer festlegen, die Getränke auf insgesamt 100% verteilen und den Literbedarf berechnen. Wasser wird zusätzlich eingeplant.</p></aside>}
      </div>
    </div>
    </>
  );
}
