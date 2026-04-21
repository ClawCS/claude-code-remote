import { useMemo } from "react";
import type { Publication } from "../../data/publications";
import { useDriveInfo } from "../../hooks/useDirections";
import { nearestCityToStore } from "../../utils/geo";
import { formatKm, formatMinutes } from "../../utils/geo";
import { useStore } from "../../state/store";
import { Clock, MapPin, Users } from "lucide-react";

export function PublicationCard({ pub }: { pub: Publication }): JSX.Element {
  const setFocused = useStore((s) => s.setFocused);
  const focusedId = useStore((s) => s.focusedId);
  const activeIds = useStore((s) => s.activeIds);
  const toggle = useStore((s) => s.toggle);

  const nearest = useMemo(() => nearestCityToStore(pub), [pub]);
  const { info, loading } = useDriveInfo(nearest);
  const isFocused = focusedId === pub.id;
  const isActive = activeIds.includes(pub.id);

  return (
    <article
      className={`card relative flex flex-col p-4 transition-all ${
        isFocused ? "ring-2" : ""
      } ${!isActive ? "opacity-55" : ""}`}
      style={
        isFocused
          ? { boxShadow: `0 0 0 2px ${pub.color}, 0 8px 24px rgba(0,0,0,0.08)` }
          : undefined
      }
    >
      {/* farbiger Balken links */}
      <span
        className="absolute left-0 top-4 bottom-4 w-1 rounded-full"
        style={{ backgroundColor: pub.color }}
      />

      <header className="mb-3 flex items-start justify-between gap-2 pl-2">
        <div>
          <h3 className="font-display text-lg leading-tight">{pub.title}</h3>
          <p className="mt-0.5 text-xs text-ink-500">{pub.publisher}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
          style={{ backgroundColor: pub.color }}
        >
          {pub.kind === "weekly" ? "Wochenblatt" : "Tageszeitung"}
        </span>
      </header>

      <dl className="space-y-1.5 pl-2 text-sm">
        <div className="flex items-center gap-2 text-ink-700">
          <Users size={14} className="text-ink-400" />
          <span className="font-mono text-xs">
            {pub.circulationLabel} <span className="text-ink-400">· {pub.rhythm}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-ink-700">
          <Clock size={14} className="text-ink-400" />
          {loading && !info ? (
            <span className="text-xs text-ink-400">lade Fahrzeit…</span>
          ) : info ? (
            <span className="text-xs">
              <strong>{nearest.name}:</strong> {formatMinutes(info.durationMin)} · {formatKm(info.distanceKm)}
              {info.estimated && <span className="ml-1 text-ink-400">(geschaetzt)</span>}
            </span>
          ) : (
            <span className="text-xs text-ink-400">—</span>
          )}
        </div>
        <div className="flex items-start gap-2 text-ink-700">
          <MapPin size={14} className="mt-0.5 shrink-0 text-ink-400" />
          <span className="text-xs leading-snug">
            {pub.cities.map((c) => c.name).join(" · ")}
          </span>
        </div>
      </dl>

      {pub.note && (
        <p className="mt-3 rounded-lg bg-cream-100 p-2 pl-2 text-[11px] leading-snug text-ink-500">
          {pub.note}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 pl-2">
        <button
          onClick={() => setFocused(isFocused ? null : pub.id)}
          className="btn-ghost text-xs"
        >
          {isFocused ? "Fokus loesen" : "Auf Karte zoomen"}
        </button>
        <button
          onClick={() => toggle(pub.id)}
          className="text-xs text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline"
        >
          {isActive ? "ausblenden" : "einblenden"}
        </button>
      </div>
    </article>
  );
}
