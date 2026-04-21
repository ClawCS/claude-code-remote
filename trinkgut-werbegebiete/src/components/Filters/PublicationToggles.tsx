import { Eye, EyeOff } from "lucide-react";
import {
  DAILY_PUBLICATIONS,
  WEEKLY_PUBLICATIONS,
  type Publication,
} from "../../data/publications";
import { useAppStore } from "../../store/useAppStore";

function ToggleChip({ pub }: { pub: Publication }) {
  const visible = useAppStore((s) => s.visible[pub.id] ?? true);
  const toggle = useAppStore((s) => s.toggle);
  return (
    <button
      type="button"
      onClick={() => toggle(pub.id)}
      className={`chip shrink-0 ${visible ? "chip-active" : ""}`}
      style={
        visible
          ? { background: pub.color, borderColor: pub.color, color: "#fff" }
          : undefined
      }
      aria-pressed={visible}
    >
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{
          background: visible ? "#ffffffcc" : pub.color,
          border: visible ? "none" : "1px solid rgba(0,0,0,0.1)",
        }}
      />
      <span className="whitespace-nowrap">{pub.name}</span>
      <span
        className="text-[10px] uppercase tracking-wide opacity-70"
        style={{ color: visible ? "#ffffff" : undefined }}
      >
        {pub.type === "daily" ? "Tagesz." : "Wo-Bl."}
      </span>
    </button>
  );
}

export default function PublicationToggles() {
  const showAll = useAppStore((s) => s.showAll);
  const hideAll = useAppStore((s) => s.hideAll);
  const allVisible = useAppStore((s) =>
    Object.values(s.visible).every(Boolean),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-500">
          <span>Publikationen</span>
          <span className="text-ink-300">·</span>
          <span>{WEEKLY_PUBLICATIONS.length} Wochenblätter</span>
          <span className="text-ink-300">·</span>
          <span>{DAILY_PUBLICATIONS.length} Tageszeitungen</span>
        </div>
        <button
          type="button"
          onClick={allVisible ? hideAll : showAll}
          className="btn-ghost !py-1 !text-xs"
        >
          {allVisible ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              Alle ausblenden
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              Alle anzeigen
            </>
          )}
        </button>
      </div>
      <div className="-mx-2 overflow-x-auto px-2 pb-1">
        <div className="flex min-w-max gap-2">
          {WEEKLY_PUBLICATIONS.map((p) => (
            <ToggleChip key={p.id} pub={p} />
          ))}
          <span className="mx-1 self-center text-ink-300">|</span>
          {DAILY_PUBLICATIONS.map((p) => (
            <ToggleChip key={p.id} pub={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
