import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { Upload, Trash2, FileText, Loader2 } from "lucide-react";
import { getApiKey, loadGoogleMaps } from "../../hooks/useGoogleMaps";
import { usePersistedState } from "../../hooks/usePersistedState";

export interface HeatmapPoint {
  plz: string;
  count: number;
  lat: number;
  lng: number;
  label?: string;
}

interface Props {
  onPoints: (points: HeatmapPoint[]) => void;
}

const GEO_CACHE_KEY = "trinkgut_plz_geocode_cache_v1";

type GeoCache = Record<string, { lat: number; lng: number; label?: string }>;

function loadGeoCache(): GeoCache {
  try {
    return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) ?? "{}") as GeoCache;
  } catch {
    return {};
  }
}

function saveGeoCache(c: GeoCache): void {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

export function BonHeatmapUpload({ onPoints }: Props): JSX.Element {
  const [points, setPoints] = usePersistedState<HeatmapPoint[]>(
    "trinkgut_heatmap_points_v1",
    [],
  );
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasKey = getApiKey() != null;

  useEffect(() => {
    onPoints(points);
  }, [points, onPoints]);

  async function handleFile(file: File): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
        delimiter: "",
      });
      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        setError(`CSV-Fehler: ${parsed.errors[0].message}`);
        return;
      }

      // Spaltennamen-Erkennung: plz / postcode / postleitzahl + anzahl_bons / count / bons / anzahl
      const sample = parsed.data[0];
      if (!sample) {
        setError("CSV enthielt keine Datenzeilen.");
        return;
      }
      const plzKey = pickKey(sample, ["plz", "postcode", "postleitzahl", "zip"]);
      const cntKey = pickKey(sample, ["anzahl_bons", "bons", "anzahl", "count", "kunden", "n"]);
      if (!plzKey || !cntKey) {
        setError(
          `Konnte Spalten nicht erkennen. Erwartet: "plz" + "anzahl_bons" (oder aehnlich). Gefunden: ${Object.keys(sample).join(", ")}`,
        );
        return;
      }

      // Aggregieren nach PLZ
      const agg = new Map<string, number>();
      for (const row of parsed.data) {
        const plz = String(row[plzKey] ?? "").trim();
        const cnt = Number(String(row[cntKey] ?? "").replace(",", "."));
        if (!plz || !Number.isFinite(cnt) || cnt <= 0) continue;
        agg.set(plz, (agg.get(plz) ?? 0) + cnt);
      }
      if (agg.size === 0) {
        setError("Keine gueltigen Zeilen gefunden.");
        return;
      }

      if (!hasKey) {
        setError("Geocoding braucht einen Google-Maps-API-Key in .env.local.");
        return;
      }
      const googlePromise = loadGoogleMaps();
      if (!googlePromise) {
        setError("Google Maps konnte nicht geladen werden.");
        return;
      }
      const g = await googlePromise;
      const geocoder = new g.maps.Geocoder();

      const cache = loadGeoCache();
      const entries = [...agg.entries()];
      const result: HeatmapPoint[] = [];
      setProgress({ done: 0, total: entries.length });

      for (let i = 0; i < entries.length; i++) {
        const [plz, count] = entries[i];
        const isNlPlz = /^\d{4}\s?[a-zA-Z]{2}$/.test(plz);
        const cacheKey = `${plz}|${isNlPlz ? "nl" : "de"}`;
        let geo = cache[cacheKey];
        if (!geo) {
          try {
            const res = await geocoder.geocode({
              address: plz,
              region: isNlPlz ? "nl" : "de",
              componentRestrictions: { country: isNlPlz ? "NL" : "DE", postalCode: plz },
            });
            const first = res.results[0];
            if (first) {
              geo = {
                lat: first.geometry.location.lat(),
                lng: first.geometry.location.lng(),
                label: first.formatted_address,
              };
              cache[cacheKey] = geo;
              saveGeoCache(cache);
            }
          } catch {
            /* skip */
          }
          // Rate-Limit-freundliche Pause bei neuen Calls
          await new Promise((r) => setTimeout(r, 80));
        }
        if (geo) {
          result.push({ plz, count, lat: geo.lat, lng: geo.lng, label: geo.label });
        }
        setProgress({ done: i + 1, total: entries.length });
      }

      setPoints(result);
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  }

  function clear(): void {
    setPoints([]);
  }

  const totalCount = points.reduce((a, p) => a + p.count, 0);
  const topPoints = [...points].sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <div className="card p-5">
      <header className="mb-2 flex items-center gap-2">
        <FileText size={18} className="text-trinkgut" />
        <h3 className="font-display text-xl">Bon-Heatmap <span className="text-xs font-normal text-ink-400">(optional)</span></h3>
      </header>
      <p className="mb-4 text-xs text-ink-500">
        Lade eine CSV mit Spalten <code className="font-mono">plz</code> (DE- oder NL-PLZ) und{" "}
        <code className="font-mono">anzahl_bons</code>. Die PLZs werden geocodet und als Heatmap-Layer auf der Karte angezeigt.
        So siehst du, wo deine realen Kunden herkommen — vs. wo deine Werbegebiete liegen.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy || !hasKey}
          className="btn-primary text-sm"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          CSV hochladen
        </button>
        {points.length > 0 && (
          <button onClick={clear} disabled={busy} className="btn-ghost text-sm">
            <Trash2 size={14} /> Zuruecksetzen
          </button>
        )}
      </div>

      {!hasKey && (
        <p className="mt-3 text-xs text-trinkgut">
          Heatmap braucht einen Google-Maps-API-Key in <code>.env.local</code>.
        </p>
      )}

      {progress && (
        <div className="mt-3">
          <div className="mb-1 text-xs text-ink-500">
            Geocodiere PLZs… {progress.done} / {progress.total}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-cream-200">
            <div
              className="h-full bg-trinkgut transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-trinkgut">{error}</p>}

      {points.length > 0 && !progress && (
        <div className="mt-4 border-t border-ink-900/10 pt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs font-medium text-ink-700">
              {points.length} PLZs · {totalCount.toLocaleString("de-DE")} Bons geladen
            </span>
          </div>
          <ul className="space-y-1 text-xs">
            {topPoints.map((p) => (
              <li key={p.plz} className="flex justify-between">
                <span className="font-mono text-ink-700">{p.plz}</span>
                <span className="text-ink-500">{p.count.toLocaleString("de-DE")} Bons</span>
              </li>
            ))}
          </ul>
          {points.length > topPoints.length && (
            <p className="mt-2 text-[11px] text-ink-400">
              … und {points.length - topPoints.length} weitere.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function pickKey(row: Record<string, unknown>, candidates: string[]): string | null {
  for (const c of candidates) {
    if (c in row) return c;
  }
  return null;
}
