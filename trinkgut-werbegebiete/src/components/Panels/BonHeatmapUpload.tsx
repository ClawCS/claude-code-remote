import { useRef, useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import {
  Upload,
  FileText,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useAppStore, type GeocodedBon } from "../../store/useAppStore";
import { HAS_API_KEY } from "../../utils/config";

type RawRow = Record<string, string>;

type Mapping = {
  plz: string;
  anzahlBons: string;
  datum?: string;
  umsatz?: string;
  warengruppen?: string;
};

type GeocodeResult = {
  total: number;
  geocoded: number;
  failed: string[];
};

const PLZ_CACHE_KEY = "trinkgut-plz-geocache";

function loadPlzCache(): Record<string, { lat: number; lng: number }> {
  try {
    const raw = localStorage.getItem(PLZ_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePlzCache(cache: Record<string, { lat: number; lng: number }>) {
  try {
    localStorage.setItem(PLZ_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

function guessCountry(plz: string): "NL" | "DE" {
  const digits = plz.replace(/\D/g, "");
  if (digits.length === 4) return "NL";
  return "DE";
}

async function geocodePlz(
  plz: string,
): Promise<{ lat: number; lng: number } | null> {
  if (typeof google === "undefined" || !google.maps) return null;
  const geocoder = new google.maps.Geocoder();
  const country = guessCountry(plz);
  try {
    const res = await geocoder.geocode({
      address: plz,
      componentRestrictions: { country, postalCode: plz },
    });
    const first = res.results[0];
    if (!first) return null;
    return {
      lat: first.geometry.location.lat(),
      lng: first.geometry.location.lng(),
    };
  } catch {
    return null;
  }
}

export default function BonHeatmapUpload() {
  const fileRef = useRef<HTMLInputElement>(null);
  const bons = useAppStore((s) => s.bons);
  const setBons = useAppStore((s) => s.setBons);
  const clearBons = useAppStore((s) => s.clearBons);
  const showHeatmap = useAppStore((s) => s.showHeatmap);
  const setShowHeatmap = useAppStore((s) => s.setShowHeatmap);

  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({
    plz: "",
    anzahlBons: "",
  });
  const [geocoding, setGeocoding] = useState(false);
  const [progress, setProgress] = useState<GeocodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setProgress(null);
    Papa.parse<RawRow>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data.filter(
          (r) => r && Object.keys(r).length > 0,
        );
        const fields = res.meta.fields ?? [];
        setHeaders(fields);
        setRawRows(rows);
        // Auto-guess mapping
        const lcFields = fields.map((f) => f.toLowerCase());
        const findField = (candidates: string[]): string | undefined => {
          for (const c of candidates) {
            const idx = lcFields.findIndex((f) => f.includes(c));
            if (idx >= 0) return fields[idx];
          }
          return undefined;
        };
        setMapping({
          plz: findField(["plz", "postleit", "postcode", "zip"]) ?? "",
          anzahlBons:
            findField(["anzahl", "bon", "count", "kunden", "menge"]) ?? "",
          datum: findField(["datum", "date"]),
          umsatz: findField(["umsatz", "betrag", "sum"]),
          warengruppen: findField(["warengruppe", "sorte", "kategor"]),
        });
      },
      error: (err) => setError(`CSV-Parse-Fehler: ${err.message}`),
    });
  }

  async function onProcess() {
    if (!mapping.plz || !mapping.anzahlBons) {
      setError("Bitte mindestens PLZ- und Anzahl-Spalte zuordnen.");
      return;
    }
    if (!HAS_API_KEY) {
      setError("Google Maps API-Key fehlt — Geocoding nicht verfügbar.");
      return;
    }
    setError(null);
    setGeocoding(true);
    const cache = loadPlzCache();

    const aggregated: Record<string, Omit<GeocodedBon, "lat" | "lng">> = {};
    for (const row of rawRows) {
      const plz = String(row[mapping.plz] ?? "").trim();
      if (!plz) continue;
      const anzahl = Number(
        String(row[mapping.anzahlBons] ?? "0").replace(",", "."),
      );
      if (!Number.isFinite(anzahl) || anzahl <= 0) continue;

      const umsatz = mapping.umsatz
        ? Number(String(row[mapping.umsatz] ?? "").replace(",", "."))
        : undefined;
      const datum = mapping.datum ? String(row[mapping.datum] ?? "") : undefined;
      const warengruppen = mapping.warengruppen
        ? String(row[mapping.warengruppen] ?? "")
        : undefined;

      if (!aggregated[plz]) {
        aggregated[plz] = {
          plz,
          anzahlBons: 0,
          umsatz: umsatz != null && Number.isFinite(umsatz) ? 0 : undefined,
          datum,
          warengruppen,
        };
      }
      aggregated[plz].anzahlBons += anzahl;
      if (aggregated[plz].umsatz != null && Number.isFinite(umsatz ?? NaN)) {
        aggregated[plz].umsatz! += umsatz ?? 0;
      }
    }

    const plzList = Object.keys(aggregated);
    const result: GeocodedBon[] = [];
    const failed: string[] = [];
    let done = 0;

    for (const plz of plzList) {
      let coords: { lat: number; lng: number } | null = cache[plz] ?? null;
      if (!coords) {
        coords = await geocodePlz(plz);
        if (coords) {
          cache[plz] = coords;
          savePlzCache(cache);
        }
        await new Promise((r) => setTimeout(r, 40));
      }
      const agg = aggregated[plz];
      if (coords && agg) {
        result.push({ ...agg, lat: coords.lat, lng: coords.lng });
      } else {
        failed.push(plz);
      }
      done++;
      setProgress({ total: plzList.length, geocoded: done, failed });
    }

    setBons(result);
    setGeocoding(false);
  }

  function resetUpload() {
    setRawRows([]);
    setHeaders([]);
    setMapping({ plz: "", anzahlBons: "" });
    setProgress(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const totalBons = bons.reduce((s, b) => s + b.anzahlBons, 0);

  return (
    <section className="card p-5">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="label flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            Bon-Heatmap (Deine Kundenherkunft)
          </div>
          <h3 className="mt-1 text-xl">
            CSV hochladen → Kunden-Heatmap über die Werbegebiete legen
          </h3>
          <p className="mt-1 text-xs text-ink-500">
            Unterstützt flexible Spalten (PLZ, Anzahl, Datum, Umsatz,
            Warengruppen). Die PLZ-Koordinaten werden gecacht, damit du die
            Analyse nicht jedes Mal neu starten musst.
          </p>
        </div>
        {bons.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="btn-ghost !py-1 !text-xs"
            >
              {showHeatmap ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Heatmap aus
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Heatmap an
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                clearBons();
                resetUpload();
              }}
              className="btn-ghost !py-1 !text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Bons löschen
            </button>
          </div>
        )}
      </header>

      {rawRows.length === 0 && (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-900/15 bg-cream-100 py-8 text-center text-sm text-ink-500 transition hover:border-ink-900/30 hover:bg-cream-200">
          <Upload className="h-6 w-6" />
          <span>
            CSV-Datei auswählen{" "}
            <span className="text-ink-300">(z.B. bons_export.csv)</span>
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="hidden"
          />
        </label>
      )}

      {rawRows.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-700">
              <strong>{rawRows.length}</strong> Zeilen geladen
            </span>
            <button
              type="button"
              onClick={resetUpload}
              className="btn-ghost !py-1 !text-xs"
            >
              Andere Datei
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-xl bg-cream-100 p-4 md:grid-cols-2">
            <div>
              <label className="label">PLZ-Spalte *</label>
              <select
                value={mapping.plz}
                onChange={(e) =>
                  setMapping((m) => ({ ...m, plz: e.target.value }))
                }
                className="input"
              >
                <option value="">— Spalte wählen —</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Anzahl-Bons-Spalte *</label>
              <select
                value={mapping.anzahlBons}
                onChange={(e) =>
                  setMapping((m) => ({ ...m, anzahlBons: e.target.value }))
                }
                className="input"
              >
                <option value="">— Spalte wählen —</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Datum (optional)</label>
              <select
                value={mapping.datum ?? ""}
                onChange={(e) =>
                  setMapping((m) => ({
                    ...m,
                    datum: e.target.value || undefined,
                  }))
                }
                className="input"
              >
                <option value="">—</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Umsatz (optional)</label>
              <select
                value={mapping.umsatz ?? ""}
                onChange={(e) =>
                  setMapping((m) => ({
                    ...m,
                    umsatz: e.target.value || undefined,
                  }))
                }
                className="input"
              >
                <option value="">—</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Warengruppen (optional)</label>
              <select
                value={mapping.warengruppen ?? ""}
                onChange={(e) =>
                  setMapping((m) => ({
                    ...m,
                    warengruppen: e.target.value || undefined,
                  }))
                }
                className="input"
              >
                <option value="">—</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={onProcess}
            disabled={geocoding || !mapping.plz || !mapping.anzahlBons}
            className="btn-trinkgut self-start"
          >
            {geocoding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            PLZ geocoden &amp; Heatmap erstellen
          </button>

          {progress && (
            <div className="rounded-xl bg-cream-100 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>
                  Geocodet: <strong>{progress.geocoded}</strong> /{" "}
                  {progress.total}
                </span>
                {progress.failed.length > 0 && (
                  <span className="text-xs text-trinkgut-dark">
                    {progress.failed.length} PLZ ohne Treffer
                  </span>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-900/10">
                <div
                  className="h-full bg-trinkgut"
                  style={{
                    width: `${(progress.geocoded / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {bons.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-green-50 p-3 text-sm">
          <div>
            <div className="label">Aktive Heatmap</div>
            <div className="text-lg font-medium">
              {bons.length} PLZ ·{" "}
              {totalBons.toLocaleString("de-DE")} Bons gesamt
            </div>
          </div>
          <span className="text-xs text-ink-500">
            Ziehe die Karte oben, um zu vergleichen, welche Publikationen deine
            tatsächliche Kundenherkunft abdecken.
          </span>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-trinkgut/10 p-3 text-sm text-trinkgut-dark">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
