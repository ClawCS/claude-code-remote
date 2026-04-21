import { PUBLICATIONS } from "../../data/publications";
import { useStore } from "../../state/store";
import { Eye, EyeOff } from "lucide-react";

export function PublicationToggles(): JSX.Element {
  const activeIds = useStore((s) => s.activeIds);
  const toggle = useStore((s) => s.toggle);
  const setAll = useStore((s) => s.setAll);
  const allOn = activeIds.length === PUBLICATIONS.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="label">Publikationen</h3>
        <button
          onClick={() => setAll(!allOn)}
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900"
        >
          {allOn ? <EyeOff size={14} /> : <Eye size={14} />}
          {allOn ? "Alle ausblenden" : "Alle anzeigen"}
        </button>
      </div>
      <div className="chip-scroller -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {PUBLICATIONS.map((p) => {
          const active = activeIds.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`chip whitespace-nowrap shrink-0 ${active ? "chip-active" : ""}`}
              style={
                active
                  ? { backgroundColor: p.color, borderColor: p.color }
                  : undefined
              }
              title={`${p.publisher} · ${p.circulationLabel} Auflage`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: active ? "#ffffff" : p.color,
                  opacity: active ? 0.85 : 1,
                }}
              />
              {p.title}
              <span className={active ? "text-white/80" : "text-ink-400"}>
                · {p.kind === "weekly" ? "W" : "T"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
