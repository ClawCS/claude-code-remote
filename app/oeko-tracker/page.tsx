"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- Constants ---

const LEERGUT_STORAGE_KEY = "trinkgut-leergut-historie";

// CO2 savings per bottle type (grams) — Mehrweg vs Einweg comparison
const CO2_PER_BOTTLE = 200; // ~200g CO2 saved per reused bottle
const WATER_PER_BOTTLE = 3; // ~3L water saved per recycled bottle
const ENERGY_PER_BOTTLE = 0.05; // ~0.05 kWh saved per bottle
const CO2_PER_TREE_YEAR = 22000; // ~22kg = 22000g CO2 absorbed per tree per year
const TURTLES_PER_BOTTLES = 50; // 1 "rescued turtle" per 50 bottles (humorous)

type LeergutHistoryEntry = {
  date: string;
  counts: Record<string, number>;
  total: number;
};

type EcoStats = {
  totalBottles: number;
  co2Grams: number;
  trees: number;
  turtles: number;
  waterLiters: number;
  energyKwh: number;
};

function calculateEcoStats(bottles: number): EcoStats {
  const co2Grams = bottles * CO2_PER_BOTTLE;
  return {
    totalBottles: bottles,
    co2Grams,
    trees: co2Grams / CO2_PER_TREE_YEAR,
    turtles: bottles / TURTLES_PER_BOTTLES,
    waterLiters: bottles * WATER_PER_BOTTLE,
    energyKwh: bottles * ENERGY_PER_BOTTLE,
  };
}

function loadLeergutHistory(): LeergutHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEERGUT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function countBottlesFromHistory(history: LeergutHistoryEntry[]): number {
  return history.reduce((sum, entry) => {
    return sum + Object.values(entry.counts).reduce((s, v) => s + v, 0);
  }, 0);
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1500): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }

    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

function StatCard({
  icon,
  value,
  unit,
  label,
  color,
}: {
  icon: string;
  value: number;
  unit: string;
  label: string;
  color: string;
}) {
  const animated = useAnimatedCounter(value);
  const isDecimal = value < 10 && value > 0;

  return (
    <div className={`bg-white border border-border rounded-2xl p-5 text-center hover:shadow-lg transition-shadow`}>
      <span className="text-4xl block mb-2">{icon}</span>
      <div className={`text-3xl sm:text-4xl font-bold ${color} mb-1`}>
        {isDecimal ? animated.toFixed(2) : Math.round(animated).toLocaleString("de-DE")}
        <span className="text-lg font-semibold ml-1">{unit}</span>
      </div>
      <p className="text-xs text-muted font-medium">{label}</p>
    </div>
  );
}

function ShareCard({ stats }: { stats: EcoStats }) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateShareText = () => {
    const turtles = Math.floor(stats.turtles);
    const co2kg = (stats.co2Grams / 1000).toFixed(1);
    return `Ich habe dieses Jahr ${stats.totalBottles} Flaschen bei Trinkgut Jammers Goch zurückgebracht und damit ${co2kg}kg CO2 gespart${turtles > 0 ? ` und ${turtles} Schildkröte${turtles > 1 ? "n" : ""} gerettet` : ""}! ♻️🐢\n\nBerechne deinen Öko-Fußabdruck: trinkgut-jammers.de/oeko-tracker`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = generateShareText();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generateShareText())}`, "_blank");
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center">
      <h3 className="font-bold text-secondary text-lg mb-2">{"\uD83C\uDF1F"} Teile deinen Impact!</h3>
      <div className="bg-white rounded-xl p-5 mb-4 border border-green-100">
        <p className="text-2xl mb-1">{"\u267B\uFE0F\uD83D\uDC22"}</p>
        <p className="text-secondary font-bold text-sm">
          Ich habe dieses Jahr{" "}
          <span className="text-green-600">{stats.totalBottles} Flaschen</span>{" "}
          zur&uuml;ckgebracht und{" "}
          <span className="text-green-600">{(stats.co2Grams / 1000).toFixed(1)}kg CO{"\u2082"}</span>{" "}
          gespart!
        </p>
        {stats.turtles >= 1 && (
          <p className="text-green-700 font-semibold text-sm mt-1">
            {"\uD83D\uDC22"} {Math.floor(stats.turtles)} Schildkr&ouml;te{Math.floor(stats.turtles) > 1 ? "n" : ""} gerettet!
          </p>
        )}
        <p className="text-xs text-muted mt-2">trinkgut-jammers.de/oeko-tracker</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={handleWhatsApp}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </button>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border text-secondary font-semibold rounded-xl hover:bg-light transition-colors text-sm"
        >
          {copied ? (
            <>
              {"\u2705"} Kopiert!
            </>
          ) : (
            <>
              {"\uD83D\uDCCB"} Text kopieren
            </>
          )}
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default function OekoTrackerPage() {
  const [inputMode, setInputMode] = useState<"manual" | "history">("history");
  const [manualBottles, setManualBottles] = useState(0);
  const [historyBottles, setHistoryBottles] = useState(0);
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    const history = loadLeergutHistory();
    const count = countBottlesFromHistory(history);
    setHistoryBottles(count);
    setHasHistory(count > 0);
    if (count > 0) {
      setInputMode("history");
    } else {
      setInputMode("manual");
    }
  }, []);

  const activeBottles = inputMode === "history" ? historyBottles : manualBottles;
  const stats = calculateEcoStats(activeBottles);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="relative text-center mb-10 overflow-hidden">
        {/* Decorative leaves */}
        <div className="absolute top-0 left-4 text-5xl opacity-20 animate-float" style={{ animationDelay: "0s" }}>
          {"\uD83C\uDF3F"}
        </div>
        <div className="absolute top-2 right-8 text-4xl opacity-15 animate-float" style={{ animationDelay: "1s" }}>
          {"\uD83C\uDF40"}
        </div>
        <div className="absolute bottom-0 left-1/4 text-3xl opacity-10 animate-float" style={{ animationDelay: "2s" }}>
          {"\uD83C\uDF31"}
        </div>

        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <span className="text-base">{"\uD83C\uDF0D"}</span> &Ouml;ko-Tracker
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-secondary mb-3">
          Wie viel hast du f&uuml;r die Umwelt getan?
        </h1>
        <p className="text-muted max-w-lg mx-auto">
          Berechne deinen &ouml;kologischen Impact durch Mehrweg und Recycling.
          Jede Flasche z&auml;hlt!
        </p>
      </div>

      {/* Input Mode Toggle */}
      <div className="bg-white border border-border rounded-xl p-6 mb-8">
        <div className="flex flex-wrap gap-2 mb-5">
          {hasHistory && (
            <button
              onClick={() => setInputMode("history")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                inputMode === "history"
                  ? "bg-green-600 text-white shadow-lg shadow-green-200"
                  : "bg-light text-muted hover:bg-border"
              }`}
            >
              {"\uD83D\uDCCA"} Aus Leergut-Historie ({historyBottles} Flaschen)
            </button>
          )}
          <button
            onClick={() => setInputMode("manual")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              inputMode === "manual"
                ? "bg-green-600 text-white shadow-lg shadow-green-200"
                : "bg-light text-muted hover:bg-border"
            }`}
          >
            {"\u270B"} Manuell eingeben
          </button>
        </div>

        {inputMode === "manual" ? (
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Wie viele Flaschen/Dosen hast du dieses Jahr zur&uuml;ckgebracht?
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={2000}
                step={10}
                value={manualBottles}
                onChange={(e) => setManualBottles(parseInt(e.target.value))}
                className="flex-1 accent-green-600"
              />
              <input
                type="number"
                min={0}
                value={manualBottles}
                onChange={(e) => setManualBottles(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 text-center font-bold text-secondary border border-border rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-muted">
              {"\u2705"} Daten automatisch aus deiner{" "}
              <Link href="/leergut" className="text-green-600 font-semibold hover:underline">
                Leergut-Historie
              </Link>{" "}
              &uuml;bernommen.
            </p>
            <p className="text-2xl font-bold text-green-700 mt-2">
              {historyBottles} Flaschen & Dosen
            </p>
          </div>
        )}

        {!hasHistory && inputMode === "manual" && (
          <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-3">
            <p className="text-xs text-green-700">
              {"\uD83D\uDCA1"} Tipp: Nutze den{" "}
              <Link href="/leergut" className="font-semibold underline">
                Leergut-Rechner
              </Link>{" "}
              um deine R&uuml;ckgaben zu tracken. Die Daten werden hier automatisch &uuml;bernommen!
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {activeBottles > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={"\u2601\uFE0F"}
              value={stats.co2Grams}
              unit="g"
              label={`CO\u2082 gespart`}
              color="text-green-600"
            />
            <StatCard
              icon={"\uD83C\uDF33"}
              value={stats.trees}
              unit=""
              label="B&auml;ume (Jahresleistung)"
              color="text-green-700"
            />
            <StatCard
              icon={"\uD83D\uDC22"}
              value={stats.turtles}
              unit=""
              label="Schildkr&ouml;ten gerettet"
              color="text-teal-600"
            />
            <StatCard
              icon={"\uD83D\uDCA7"}
              value={stats.waterLiters}
              unit="L"
              label="Wasser gespart"
              color="text-blue-600"
            />
            <StatCard
              icon={"\u26A1"}
              value={stats.energyKwh}
              unit="kWh"
              label="Energie gespart"
              color="text-amber-600"
            />
            <StatCard
              icon={"\u267B\uFE0F"}
              value={stats.totalBottles}
              unit=""
              label="Flaschen recycelt"
              color="text-green-600"
            />
          </div>

          {/* Fun Facts */}
          <div className="bg-white border border-border rounded-xl p-6 mb-8">
            <h3 className="font-bold text-secondary text-sm mb-4">{"\uD83C\uDF1F"} Das bedeuten deine Zahlen</h3>
            <div className="space-y-3 text-sm text-muted">
              {stats.co2Grams >= 1000 && (
                <p>
                  {"\uD83D\uDE97"} Dein CO{"\u2082"}-Ersparnis entspricht ca.{" "}
                  <strong className="text-secondary">
                    {Math.round(stats.co2Grams / 120)} km
                  </strong>{" "}
                  Autofahrt weniger.
                </p>
              )}
              {stats.waterLiters >= 10 && (
                <p>
                  {"\uD83D\uDEB0"} Mit {stats.waterLiters}L gespartem Wasser k&ouml;nntest du{" "}
                  <strong className="text-secondary">
                    {Math.round(stats.waterLiters / 150)} mal
                  </strong>{" "}
                  duschen.
                </p>
              )}
              {stats.energyKwh >= 1 && (
                <p>
                  {"\uD83D\uDCA1"} Die gesparte Energie k&ouml;nnte eine LED-Lampe{" "}
                  <strong className="text-secondary">
                    {Math.round(stats.energyKwh / 0.01)} Stunden
                  </strong>{" "}
                  leuchten lassen.
                </p>
              )}
              {stats.turtles >= 1 && (
                <p>
                  {"\uD83D\uDC22"} Du hast symbolisch{" "}
                  <strong className="text-secondary">
                    {Math.floor(stats.turtles)} Meeresschildkr&ouml;te{Math.floor(stats.turtles) > 1 ? "n" : ""}
                  </strong>{" "}
                  vor Plastikm&uuml;ll bewahrt!
                </p>
              )}
              <p>
                {"\uD83C\uDF31"} Jede Mehrwegflasche wird bis zu <strong className="text-secondary">50 Mal</strong> wiederverwendet.
              </p>
            </div>
          </div>

          {/* Share Card */}
          <div className="mb-8">
            <ShareCard stats={stats} />
          </div>
        </>
      )}

      {/* Empty State */}
      {activeBottles === 0 && (
        <div className="text-center py-12 mb-8">
          <span className="text-6xl block mb-4">{"\uD83C\uDF0D"}</span>
          <h3 className="text-lg font-bold text-secondary mb-2">
            Noch keine Daten vorhanden
          </h3>
          <p className="text-sm text-muted mb-4">
            Gib oben die Anzahl deiner zur&uuml;ckgegebenen Flaschen ein oder nutze den Leergut-Rechner.
          </p>
          <Link
            href="/leergut"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors text-sm"
          >
            {"\u267B\uFE0F"} Zum Leergut-Rechner
          </Link>
        </div>
      )}

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-center text-white">
        <h3 className="text-lg font-bold mb-2">
          Gemeinsam f&uuml;r die Umwelt!
        </h3>
        <p className="text-sm text-green-100 mb-4 max-w-md mx-auto">
          Bring dein Leergut zu Trinkgut Jammers und leiste deinen Beitrag.
          Jede Flasche z&auml;hlt &mdash; f&uuml;r dich und f&uuml;r unseren Planeten.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/leergut"
            className="px-5 py-2.5 bg-white text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-colors text-sm"
          >
            {"\u267B\uFE0F"} Leergut-Rechner
          </Link>
          <a
            href="https://wa.me/4901752492386"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-green-500/30 text-white font-semibold rounded-xl hover:bg-green-500/50 transition-colors text-sm"
          >
            {"\uD83D\uDCF1"} WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
