import { useState, type FormEvent } from "react";
import { MapPin, Search, AlertCircle, Loader2, Route } from "lucide-react";
import { PUBLICATIONS, STORE_LOCATION } from "../../data/publications";
import { fetchDirections } from "../../hooks/useDirections";
import { formatKm, formatMin, haversineKm } from "../../utils/geo";
import { HAS_API_KEY } from "../../utils/config";

type Result = {
  formattedAddress: string;
  lat: number;
  lng: number;
  durationMin: number;
  drivingKm: number;
  source: "google" | "estimate";
  matchingPublications: { id: string; name: string; color: string }[];
};

async function geocode(
  query: string,
): Promise<{ formatted: string; lat: number; lng: number } | null> {
  if (typeof google === "undefined" || !google.maps) return null;
  const geocoder = new google.maps.Geocoder();
  const res = await geocoder.geocode({
    address: query,
    componentRestrictions: {},
    region: "eu",
  });
  const first = res.results[0];
  if (!first) return null;
  return {
    formatted: first.formatted_address,
    lat: first.geometry.location.lat(),
    lng: first.geometry.location.lng(),
  };
}

function findMatchingPublications(
  lat: number,
  lng: number,
  radiusKm = 8,
): Result["matchingPublications"] {
  return PUBLICATIONS.filter((pub) =>
    pub.cities.some(
      (c) =>
        haversineKm({ lat, lng }, { lat: c.lat, lng: c.lng }) <= radiusKm,
    ),
  ).map((p) => ({ id: p.id, name: p.name, color: p.color }));
}

export default function DistanceCalculator() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(8);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (!HAS_API_KEY) {
        setError("Google Maps API-Key fehlt. Geocoding nicht verfügbar.");
        return;
      }
      const geo = await geocode(query.trim());
      if (!geo) {
        setError("Adresse nicht gefunden. Bitte mit Stadt/Land versuchen.");
        return;
      }
      const dir = await fetchDirections(STORE_LOCATION, {
        lat: geo.lat,
        lng: geo.lng,
      });
      const matches = findMatchingPublications(geo.lat, geo.lng, radius);
      setResult({
        formattedAddress: geo.formatted,
        lat: geo.lat,
        lng: geo.lng,
        durationMin: dir.durationMin,
        drivingKm: dir.drivingKm,
        source: dir.source,
        matchingPublications: matches,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler bei der Suche");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card p-5">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="label flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            Distanz-Rechner
          </div>
          <h3 className="mt-1 text-xl">Wo wohnt der Kunde?</h3>
          <p className="mt-1 text-xs text-ink-500">
            PLZ, Stadt oder Adresse (NL oder DE) → Fahrzeit zu Trinkgut Goch +
            passende Publikationen
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="z.B. 6511 Nijmegen · Venlo · Boxmeer"
          className="input flex-1"
          autoComplete="off"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-ink-500">
            <span>Radius</span>
            <input
              type="number"
              min={1}
              max={30}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value) || 8)}
              className="input !w-16 !py-1.5"
            />
            <span>km</span>
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Prüfen
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-trinkgut/10 p-3 text-sm text-trinkgut-dark">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-cream-100 p-4">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 text-ink-500" />
            <div>
              <div className="font-medium text-ink-900">
                {result.formattedAddress}
              </div>
              <div className="text-xs text-ink-500">
                {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-ink-900/10 pt-3">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-ink-500" />
              <div>
                <div className="label">Fahrzeit</div>
                <div className="text-lg font-medium">
                  {formatMin(result.durationMin)}
                </div>
              </div>
            </div>
            <div>
              <div className="label">Distanz</div>
              <div className="text-lg font-medium">
                {formatKm(result.drivingKm)}
              </div>
            </div>
            {result.source === "estimate" && (
              <div className="ml-auto rounded-full bg-white/80 px-2 py-1 text-[10px] uppercase tracking-wider text-ink-500">
                Schätzung (kein Live-Routing)
              </div>
            )}
          </div>

          <div className="border-t border-ink-900/10 pt-3">
            <div className="label mb-2">
              Erreicht von{" "}
              <strong>
                {result.matchingPublications.length} Publikation
                {result.matchingPublications.length === 1 ? "" : "en"}
              </strong>{" "}
              (Radius {radius} km)
            </div>
            {result.matchingPublications.length === 0 ? (
              <p className="text-sm text-ink-500">
                Diese Adresse liegt außerhalb aller Publikationsgebiete. Radius
                erhöhen oder andere Schaltungen prüfen.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {result.matchingPublications.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                    style={{ background: p.color }}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
