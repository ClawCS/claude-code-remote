"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/tools.module.css";
import editorial from "@/components/editorial/editorial.module.css";
import { MARKET } from "@/lib/cinematic/site";

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
  { key: "mehrweg_buegel", label: "B\u00FCgelflasche (z.B. Flensburger)", icon: "\uD83C\uDF7E", price: 0.15, description: "0,15 \u20AC Pfand" },
  { key: "mehrweg_wasser_pet", label: "Mehrweg-Wasser PET", icon: "\uD83D\uDCA7", price: 0.15, description: "0,15 \u20AC Pfand" },
  { key: "mehrweg_glas", label: "Mehrweg-Glas 0,7/0,75L", icon: "\uD83C\uDF77", price: 0.15, description: "0,15 \u20AC Pfand" },
  { key: "bierkasten_20", label: "Bierkasten 20er (nur Kasten)", icon: "\uD83D\uDCE6", price: 1.50, description: "1,50 \u20AC \u2014 Flaschen separat z\u00E4hlen" },
  { key: "bierkasten_24", label: "Bierkasten 24er (inkl. Flaschen)", icon: "\uD83D\uDCE6", price: 3.42, description: "3,42 \u20AC inkl. Flaschen" },
  { key: "wasserkasten", label: "Wasserkasten 12er (inkl. Flaschen)", icon: "\uD83D\uDCE6", price: 3.30, description: "3,30 \u20AC inkl. Flaschen" },
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
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed:unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(entry=>entry && typeof entry.date === "string" && Number.isFinite(entry.total) && entry.counts && Object.values(entry.counts).every(value=>typeof value === "number" && Number.isFinite(value) && value >= 0)).slice(0,100) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {if (entries.length) sessionStorage.setItem(STORAGE_KEY,JSON.stringify(entries));else sessionStorage.removeItem(STORAGE_KEY);} catch { /* Calculator works without browser storage. */ }
}

// --- Components ---

function CounterCard({ type, count, onChange }: { type: PfandType; count: number; onChange: (val: number) => void }) {
  return (
    <div className={styles.counter}>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-secondary text-sm">{type.label}</div>
        <div className="text-xs text-muted">{type.description}</div>
      </div>
      <div className={styles.counterControls}>
        <button
          onClick={() => onChange(Math.max(0, count - 1))}

          aria-label={`Weniger ${type.label}`}
        >
          -
        </button>
        <input
          type="number"
          aria-label={`Anzahl ${type.label}`}
          min={0}
          value={count}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}

        />
        <button
          onClick={() => onChange(count + 1)}

          aria-label={`Mehr ${type.label}`}
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
    <>
    <PageIntro eyebrow="Rückgabe vorbereiten" title="Leergut-Rechner" description="Zähle dein Leergut manuell. Der Foto-Scan ist derzeit nicht verfügbar. Wir berechnen deinen Pfandwert sofort." breadcrumbs={[{ label: "Start", href: "/" }, { label: "Leergut-Rechner" }]} />
    <div data-tool="deposit" className={`${styles.body} ${styles.workspace}`}>
      {/* Mode Toggle */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setMode("manual")}
          aria-pressed={mode === "manual"}
          className={`${editorial.secondaryLink} ${styles.mode}`}
        >
           Manuell z&auml;hlen
        </button>
        <button
          disabled
          aria-label="Foto-Scan derzeit nicht verfügbar"
          className={editorial.secondaryLink}
        >
           Foto scannen
        </button>
      </div>

      {/* Scan Success Banner */}
      {scanSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-sm p-4 mb-6 text-center animate-fade-in">
          <p className="text-secondary font-semibold text-sm">
             Foto-Scan abgeschlossen! Die Ergebnisse wurden eingetragen. Du kannst sie unten korrigieren.
          </p>
        </div>
      )}

      {/* Photo Mode */}
      {mode === "photo" && (
        <div className="bg-white border border-border rounded-sm p-6 mb-8 text-center">
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
                className="max-h-64 mx-auto rounded-sm border border-border"
              />
            </div>
          )}

          {scanning ? (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted text-sm">Dein Leergut wird ausgewertet...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-sm hover:bg-green-700 transition-colors  "
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Foto aufnehmen / hochladen
              </button>
              <p className="text-xs text-muted">
                Fotografiere dein Leergut zur automatischen Z&auml;hlung.
                <br />
                Du kannst das Ergebnis danach manuell korrigieren.
              </p>
            </div>
          )}

          {scanError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-sm p-3 text-red-700 text-sm">
              {scanError}
            </div>
          )}
        </div>
      )}

      {/* Manual Counter Grid */}
      <div className={styles.counterGrid}>
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
      <div className={styles.total} aria-live="polite">
        <p className={styles.eyebrow}>
          Dein Pfandwert ({totalBottles} {totalBottles === 1 ? "Teil" : "Teile"})
        </p>
        <p
          className={styles.totalValue} data-changing={totalAnimating}
        >
          {formatEuro(total)}
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-5">
          <button
            onClick={saveToHistory}
            disabled={total <= 0}
            className={editorial.primaryLink}
          >
             Speichern & zur&uuml;cksetzen
          </button>
          <button
            onClick={resetCounts}
            className={editorial.secondaryLink}
          >
             Zur&uuml;cksetzen
          </button>
          <Link
            href="/oeko-tracker"
            className={editorial.secondaryLink}
          >
             &Ouml;ko-Tracker
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className={editorial.notice}>
        <h2 className="utility-heading text-lg font-bold text-secondary mb-2">
          Jetzt einl&ouml;sen bei Trinkgut Jammers!
        </h2>
        <p className="text-sm text-secondary mb-4">
          Bring dein Leergut vorbei und erhalte sofort dein Pfandgeld.
          <br />
          Mo&ndash;Sa 08:00&ndash;20:00 Uhr | {MARKET.street}, {MARKET.postalCode} {MARKET.city}
        </p>
        <SocialLink
          platform="whatsapp"
          href="https://wa.me/491752492386?text=Hallo%2C+ich+m%C3%B6chte+mein+Leergut+abgeben!"
          label="Leergut per WhatsApp anfragen"
        />
      </div>

      {/* Pfand Info Table */}
      <div className={styles.history}>
        <div className="bg-light px-6 py-3 border-b border-border">
          <h2 className="utility-heading font-bold text-secondary text-sm"> Pfand-&Uuml;bersicht Deutschland</h2>
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
                    {t.label}
                  </td>
                  <td className="px-6 py-2.5 text-right font-semibold text-secondary">
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
        <div className={styles.history}>
          <div className={styles.historyHeader}>
            <h2 className="utility-heading font-bold text-secondary text-sm">
               Meine Leergut-Historie
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">
                Gesamt: <strong className="text-secondary">{formatEuro(historyTotal)}</strong>
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
                          {entry.counts[t.key]}x {t.label.split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-secondary text-sm">{formatEuro(entry.total)}</div>
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
    </>
  );
}
