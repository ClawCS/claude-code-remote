"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// --- Pfand types & prices ---

type PfandType = {
  key: string;
  label: string;
  icon: string;
  price: number;
  description: string;
};

const PFAND_TYPES: PfandType[] = [
  { key: "einweg_pet", label: "Einweg PET-Flasche", icon: "\uD83E\uDDF4", price: 0.25, description: "0,25 \u20AC Pfand" },
  { key: "einweg_dose", label: "Einweg-Dose", icon: "\uD83E\uDD64", price: 0.25, description: "0,25 \u20AC Pfand" },
  { key: "mehrweg_bier_033", label: "Mehrweg-Bier 0,33L", icon: "\uD83C\uDF7A", price: 0.08, description: "0,08 \u20AC Pfand" },
  { key: "mehrweg_bier_05", label: "Mehrweg-Bier 0,5L", icon: "\uD83C\uDF7A", price: 0.08, description: "0,08 \u20AC Pfand" },
  { key: "mehrweg_wasser_pet", label: "Mehrweg-Wasser PET", icon: "\uD83D\uDCA7", price: 0.15, description: "0,15 \u20AC Pfand" },
  { key: "mehrweg_glas", label: "Mehrweg-Glas 0,7/0,75L", icon: "\uD83C\uDF77", price: 0.15, description: "0,15 \u20AC Pfand" },
  { key: "bierkasten_20", label: "Bierkasten 20er", icon: "\uD83D\uDCE6", price: 1.50, description: "1,50 \u20AC Pfand" },
  { key: "bierkasten_24", label: "Bierkasten 24er", icon: "\uD83D\uDCE6", price: 3.42, description: "3,42 \u20AC inkl. Flaschen" },
  { key: "wasserkasten", label: "Wasserkasten 12er", icon: "\uD83D\uDCE6", price: 3.30, description: "3,30 \u20AC inkl. Flaschen" },
];

type Counts = Record<string, number>;

type HistoryEntry = {
  date: string;
  counts: Counts;
  total: number;
};

const STORAGE_KEY = "trinkgut-leergut-historie";

function getInitialCounts(): Counts {
  const counts: Counts = {};
  PFAND_TYPES.forEach((t) => (counts[t.key] = 0));
  return counts;
}

function calculateTotal(counts: Counts): number {
  return PFAND_TYPES.reduce((sum, t) => sum + (counts[t.key] || 0) * t.price, 0);
}

function formatEuro(val: number): string {
  return val.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// --- Components ---

function CounterCard({ type, count, onChange }: { type: PfandType; count: number; onChange: (val: number) => void }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <span className="text-3xl">{type.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-secondary text-sm">{type.label}</div>
        <div className="text-xs text-muted">{type.description}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, count - 1))}
          className="w-8 h-8 rounded-lg bg-light border border-border text-secondary font-bold text-lg flex items-center justify-center hover:bg-border transition-colors active:scale-95"
          aria-label="Weniger"
        >
          -
        </button>
        <input
          type="number"
          min={0}
          value={count}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-14 text-center font-bold text-secondary border border-border rounded-lg py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={() => onChange(count + 1)}
          className="w-8 h-8 rounded-lg bg-primary text-white font-bold text-lg flex items-center justify-center hover:bg-primary-dark transition-colors active:scale-95"
          aria-label="Mehr"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function LeergutRechnerPage() {
  const [mode, setMode] = useState<"manual" | "photo">("manual");
  const [counts, setCounts] = useState<Counts>(getInitialCounts);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanSuccess, setScanSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [totalAnimating, setTotalAnimating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevTotalRef = useRef(0);

  const total = calculateTotal(counts);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Animate total on change
  useEffect(() => {
    if (total !== prevTotalRef.current) {
      setTotalAnimating(true);
      const t = setTimeout(() => setTotalAnimating(false), 500);
      prevTotalRef.current = total;
      return () => clearTimeout(t);
    }
  }, [total]);

  const updateCount = useCallback((key: string, val: number) => {
    setCounts((prev) => ({ ...prev, [key]: val }));
  }, []);

  const resetCounts = () => {
    setCounts(getInitialCounts());
    setPreviewUrl(null);
    setScanSuccess(false);
    setScanError("");
  };

  const saveToHistory = () => {
    if (total <= 0) return;
    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      counts: { ...counts },
      total,
    };
    const updated = [entry, ...history];
    setHistory(updated);
    saveHistory(updated);
    resetCounts();
  };

  const deleteHistoryEntry = (index: number) => {
    const updated = history.filter((_, i) => i !== index);
    setHistory(updated);
    saveHistory(updated);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const totalBottles = Object.values(counts).reduce((s, v) => s + v, 0);
  const historyTotal = history.reduce((s, e) => s + e.total, 0);

  // Photo scan handler
  const handleImageUpload = async (file: File) => {
    setScanning(true);
    setScanError("");
    setScanSuccess(false);

    // Preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/leergut-scan", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Scan fehlgeschlagen");
      }

      const data = await res.json();
      const result = data.result;

      // Merge results into counts
      setCounts((prev) => {
        const updated = { ...prev };
        for (const key of Object.keys(result)) {
          if (key in updated) {
            updated[key] = (updated[key] || 0) + (result[key] || 0);
          }
        }
        return updated;
      });

      setScanSuccess(true);
      setMode("manual"); // Switch to manual so user can verify/correct
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <span className="text-base">{"\u267B\uFE0F"}</span> Pfand-Rechner
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-secondary mb-3">
          Was ist dein Leergut wert?
        </h1>
        <p className="text-muted max-w-lg mx-auto">
          Z&auml;hle dein Leergut manuell oder scanne es mit KI-Bilderkennung.
          Wir berechnen deinen Pfandwert sofort.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setMode("manual")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mode === "manual"
              ? "bg-green-600 text-white shadow-lg shadow-green-200"
              : "bg-light text-muted hover:bg-border"
          }`}
        >
          {"\u270B"} Manuell z&auml;hlen
        </button>
        <button
          onClick={() => setMode("photo")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mode === "photo"
              ? "bg-green-600 text-white shadow-lg shadow-green-200"
              : "bg-light text-muted hover:bg-border"
          }`}
        >
          {"\uD83D\uDCF7"} Foto scannen (KI)
        </button>
      </div>

      {/* Scan Success Banner */}
      {scanSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center animate-fade-in">
          <p className="text-green-700 font-semibold text-sm">
            {"\u2705"} KI-Scan abgeschlossen! Die Ergebnisse wurden eingetragen. Du kannst sie unten korrigieren.
          </p>
        </div>
      )}

      {/* Photo Mode */}
      {mode === "photo" && (
        <div className="bg-white border border-border rounded-xl p-6 mb-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {previewUrl && (
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Leergut Foto"
                className="max-h-64 mx-auto rounded-lg border border-border"
              />
            </div>
          )}

          {scanning ? (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted text-sm">KI analysiert dein Leergut...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Foto aufnehmen / hochladen
              </button>
              <p className="text-xs text-muted">
                Fotografiere dein Leergut und die KI z&auml;hlt automatisch.
                <br />
                Du kannst das Ergebnis danach manuell korrigieren.
              </p>
            </div>
          )}

          {scanError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {scanError}
            </div>
          )}
        </div>
      )}

      {/* Manual Counter Grid */}
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        {PFAND_TYPES.map((type) => (
          <CounterCard
            key={type.key}
            type={type}
            count={counts[type.key] || 0}
            onChange={(val) => updateCount(type.key, val)}
          />
        ))}
      </div>

      {/* Total & Actions */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white text-center mb-8 shadow-xl">
        <p className="text-sm font-medium text-green-100 mb-1">
          Dein Pfandwert ({totalBottles} {totalBottles === 1 ? "Teil" : "Teile"})
        </p>
        <p
          className={`text-4xl sm:text-5xl font-bold transition-transform ${
            totalAnimating ? "scale-110" : "scale-100"
          }`}
        >
          {formatEuro(total)}
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-5">
          <button
            onClick={saveToHistory}
            disabled={total <= 0}
            className="px-5 py-2.5 bg-white text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {"\uD83D\uDCBE"} Speichern & zur&uuml;cksetzen
          </button>
          <button
            onClick={resetCounts}
            className="px-5 py-2.5 bg-green-500/30 text-white font-semibold rounded-xl hover:bg-green-500/50 transition-colors text-sm"
          >
            {"\uD83D\uDD04"} Zur&uuml;cksetzen
          </button>
          <Link
            href="/oeko-tracker"
            className="px-5 py-2.5 bg-green-500/30 text-white font-semibold rounded-xl hover:bg-green-500/50 transition-colors text-sm"
          >
            {"\uD83C\uDF3F"} &Ouml;ko-Tracker
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center mb-10">
        <h3 className="text-lg font-bold text-secondary mb-2">
          Jetzt einl&ouml;sen bei Trinkgut Jammers!
        </h3>
        <p className="text-sm text-muted mb-4">
          Bring dein Leergut vorbei und erhalte sofort dein Pfandgeld.
          <br />
          Mo&ndash;Sa 08:00&ndash;20:00 Uhr | Jurgenstr. 20, 47574 Goch
        </p>
        <a
          href="https://wa.me/4901752492386?text=Hallo%2C+ich+m%C3%B6chte+mein+Leergut+abgeben!"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm"
        >
          {"\uD83D\uDCF1"} Per WhatsApp anfragen
        </a>
      </div>

      {/* Pfand Info Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden mb-10">
        <div className="bg-light px-6 py-3 border-b border-border">
          <h3 className="font-bold text-secondary text-sm">{"\u2139\uFE0F"} Pfand-&Uuml;bersicht Deutschland</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-light/50">
                <th className="text-left px-6 py-2.5 font-semibold text-secondary">Typ</th>
                <th className="text-right px-6 py-2.5 font-semibold text-secondary">Pfand</th>
              </tr>
            </thead>
            <tbody>
              {PFAND_TYPES.map((t) => (
                <tr key={t.key} className="border-t border-border hover:bg-light/30">
                  <td className="px-6 py-2.5">
                    <span className="mr-2">{t.icon}</span>
                    {t.label}
                  </td>
                  <td className="px-6 py-2.5 text-right font-semibold text-green-700">
                    {formatEuro(t.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="bg-light px-6 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-secondary text-sm">
              {"\uD83D\uDCCA"} Meine Leergut-Historie
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">
                Gesamt: <strong className="text-green-700">{formatEuro(historyTotal)}</strong>
              </span>
              <button
                onClick={clearHistory}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Alle l&ouml;schen
              </button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {history.map((entry, i) => {
              const items = PFAND_TYPES.filter((t) => (entry.counts[t.key] || 0) > 0);
              return (
                <div key={i} className="px-6 py-3 flex items-center gap-4 hover:bg-light/30">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted mb-1">
                      {new Date(entry.date).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-secondary flex flex-wrap gap-2">
                      {items.map((t) => (
                        <span key={t.key} className="bg-light px-2 py-0.5 rounded">
                          {t.icon} {entry.counts[t.key]}x {t.label.split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-700 text-sm">{formatEuro(entry.total)}</div>
                  </div>
                  <button
                    onClick={() => deleteHistoryEntry(i)}
                    className="p-1 text-muted hover:text-red-500 transition-colors"
                    aria-label="Eintrag löschen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
