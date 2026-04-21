import { useEffect, useState } from "react";
import { ChevronRight, Circle, Square, MapPin, Clock } from "lucide-react";
import { STORE_LOCATION, type Publication } from "../../data/publications";
import { fetchDirections } from "../../hooks/useDirections";
import { formatKm, formatMin, haversineKm } from "../../utils/geo";
import { useAppStore } from "../../store/useAppStore";

type NearestInfo = {
  cityName: string;
  durationMin: number;
  drivingKm: number;
  source: "google" | "estimate";
};

async function computeNearest(pub: Publication): Promise<NearestInfo> {
  let bestByAir = pub.cities[0];
  let bestDistAir = Infinity;
  for (const c of pub.cities) {
    const d = haversineKm(STORE_LOCATION, c);
    if (d < bestDistAir) {
      bestDistAir = d;
      bestByAir = c;
    }
  }
  const res = await fetchDirections(STORE_LOCATION, bestByAir);
  return {
    cityName: bestByAir.name,
    durationMin: res.durationMin,
    drivingKm: res.drivingKm,
    source: res.source,
  };
}

export default function PublicationCard({ pub }: { pub: Publication }) {
  const [nearest, setNearest] = useState<NearestInfo | null>(null);
  const visible = useAppStore((s) => s.visible[pub.id] ?? true);
  const toggle = useAppStore((s) => s.toggle);
  const setFocus = useAppStore((s) => s.setFocusedPublication);
  const focused = useAppStore((s) => s.focusedPublicationId === pub.id);

  useEffect(() => {
    let cancelled = false;
    computeNearest(pub).then((res) => {
      if (!cancelled) setNearest(res);
    });
    return () => {
      cancelled = true;
    };
  }, [pub]);

  const Icon = pub.type === "daily" ? Square : Circle;

  return (
    <article
      className={`card relative flex cursor-pointer flex-col gap-3 overflow-hidden p-5 ${
        focused ? "ring-2 ring-trinkgut" : ""
      }`}
      onClick={() => setFocus(focused ? null : pub.id)}
    >
      <div
        className="absolute left-0 top-0 h-full w-1.5"
        style={{ background: pub.color }}
        aria-hidden
      />
      <header className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: pub.color }}
              fill={pub.color}
            />
            <span className="text-[10px] font-medium uppercase tracking-wider text-ink-500">
              {pub.type === "daily" ? "Tageszeitung" : "Wochenblatt"}
            </span>
          </div>
          <h3 className="mt-1 text-xl font-medium leading-tight">{pub.name}</h3>
          <p className="mt-1 text-xs text-ink-500">{pub.region}</p>
        </div>
        <label className="flex shrink-0 items-center gap-1.5">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => {
              e.stopPropagation();
              toggle(pub.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 accent-ink-900"
          />
          <span className="text-[10px] uppercase tracking-wide text-ink-500">
            Karte
          </span>
        </label>
      </header>

      <div className="grid grid-cols-3 gap-3 pl-2 text-sm">
        <div>
          <div className="label">Auflage</div>
          <div className="font-medium text-ink-900">
            {pub.circulation.toLocaleString("de-DE")}
          </div>
          {pub.circulationNote && (
            <div className="text-[10px] text-ink-500">
              {pub.circulationNote}
            </div>
          )}
        </div>
        <div>
          <div className="label">Rhythmus</div>
          <div className="text-ink-700">{pub.rhythm}</div>
        </div>
        <div>
          <div className="label">Verlag</div>
          <div className="text-ink-700">{pub.publisher}</div>
        </div>
      </div>

      <div className="pl-2">
        <div className="label mb-1.5 flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          Städte ({pub.cities.length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {pub.cities.map((c) => (
            <span
              key={c.name}
              className="inline-flex items-center gap-1 rounded-full border border-ink-900/10 bg-cream-100 px-2 py-0.5 text-[11px] text-ink-700"
            >
              {c.name}
              <span className="text-[9px] uppercase text-ink-300">
                {c.country}
              </span>
            </span>
          ))}
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-ink-900/10 pl-2 pt-3 text-xs text-ink-500">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {nearest ? (
            <span>
              Nächste Stadt:{" "}
              <strong className="text-ink-900">{nearest.cityName}</strong>{" "}
              · {formatMin(nearest.durationMin)} / {formatKm(nearest.drivingKm)}
              {nearest.source === "estimate" && (
                <span className="ml-1 text-ink-300">(Schätzung)</span>
              )}
            </span>
          ) : (
            <span className="opacity-60">Berechne…</span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-ink-500">
          {focused ? "Fokus aus" : "Fokus"}
          <ChevronRight className="h-3 w-3" />
        </span>
      </footer>
    </article>
  );
}
