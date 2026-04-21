import { useState } from "react";
import { getApiKey, loadGoogleMaps } from "../../hooks/useGoogleMaps";
import { getDriveInfo } from "../../hooks/useDirections";
import { PUBLICATIONS, STORE, type Publication } from "../../data/publications";
import { formatKm, formatMinutes, publicationsCoveringPoint } from "../../utils/geo";
import { Navigation, Search } from "lucide-react";

interface Result {
  address: string;
  durationMin: number;
  distanceKm: number;
  estimated: boolean;
  coveringPubs: Publication[];
  lat: number;
  lng: number;
}

export function DistanceCalculator(): JSX.Element {
  const [query, setQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState(8);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasKey = getApiKey() != null;

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const googlePromise = loadGoogleMaps();
      if (!googlePromise) {
        setError("Kein Google-Maps-API-Key konfiguriert (.env.local).");
        return;
      }
      const g = await googlePromise;
      const geocoder = new g.maps.Geocoder();
      const geoRes = await geocoder.geocode({
        address: query,
        region: query.match(/\b\d{4}\s?[A-Za-z]{2}\b/) ? "nl" : "de",
      });
      const first = geoRes.results[0];
      if (!first) {
        setError(`Kein Ort gefunden fuer "${query}".`);
        return;
      }
      const loc = first.geometry.location;
      const drive = await getDriveInfo(
        { lat: loc.lat(), lng: loc.lng() },
        { lat: STORE.lat, lng: STORE.lng },
      );
      const covering = publicationsCoveringPoint(
        PUBLICATIONS,
        { lat: loc.lat(), lng: loc.lng() },
        radiusKm,
      );
      setResult({
        address: first.formatted_address,
        durationMin: drive.durationMin,
        distanceKm: drive.distanceKm,
        estimated: drive.estimated,
        coveringPubs: covering,
        lat: loc.lat(),
        lng: loc.lng(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <header className="mb-4 flex items-center gap-2">
        <Navigation size={18} className="text-trinkgut" />
        <h3 className="font-display text-xl">Distance-Calculator</h3>
      </header>
      <p className="mb-4 text-xs text-ink-500">
        Gib eine PLZ oder Adresse (NL oder DE) ein, um Fahrzeit zu Goch und Reichweiten-Abdeckung zu pruefen.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="z.B. 6511 KS Nijmegen oder 47533 Kleve"
            className="input pl-9"
            disabled={!hasKey}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-ink-500" title="Radius um Publikations-Staedte zur Abdeckung">
            Radius
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Math.max(1, Number(e.target.value) || 1))}
            className="input w-20"
            disabled={!hasKey}
          />
          <span className="text-xs text-ink-500">km</span>
        </div>
        <button type="submit" className="btn-primary" disabled={!hasKey || loading}>
          {loading ? "Suche…" : "Berechnen"}
        </button>
      </form>

      {!hasKey && (
        <p className="mt-3 text-xs text-trinkgut">
          Funktioniert erst nach Setzen des Google-Maps-API-Keys in <code>.env.local</code>.
        </p>
      )}
      {error && <p className="mt-3 text-xs text-trinkgut">{error}</p>}

      {result && (
        <div className="mt-5 space-y-3 border-t border-ink-900/10 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-500">Ziel</div>
              <div className="text-sm font-medium">{result.address}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl text-trinkgut">
                {formatMinutes(result.durationMin)}
              </div>
              <div className="text-xs text-ink-500">
                {formatKm(result.distanceKm)} ab Goch
                {result.estimated && <span className="ml-1 text-ink-400">(geschaetzt)</span>}
              </div>
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-ink-500">
              Abgedeckt von {result.coveringPubs.length} Publikation{result.coveringPubs.length === 1 ? "" : "en"}
            </div>
            {result.coveringPubs.length === 0 ? (
              <p className="text-xs text-ink-500">
                Keine deiner 9 Publikationen deckt diesen Punkt im {radiusKm}-km-Radius ab.
                Kunde kommt ueber andere Kanaele / Direct-Walk-In.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {result.coveringPubs.map((p) => (
                  <span
                    key={p.id}
                    className="chip chip-active text-[11px]"
                    style={{ backgroundColor: p.color, borderColor: p.color }}
                  >
                    {p.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
