import { useMemo } from "react";
import { Euro, TrendingDown, RotateCcw } from "lucide-react";
import { PUBLICATIONS } from "../../data/publications";
import { useAppStore } from "../../store/useAppStore";

type Row = {
  id: string;
  name: string;
  color: string;
  type: "weekly" | "daily";
  circulation: number;
  cost: number;
  cpm: number | null;
};

export default function CostCalculator() {
  const costs = useAppStore((s) => s.costs);
  const setCost = useAppStore((s) => s.setCost);

  const rows: Row[] = useMemo(() => {
    return PUBLICATIONS.map((p) => {
      const cost = costs[p.id] ?? 0;
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        type: p.type,
        circulation: p.circulation,
        cost,
        cpm: cost > 0 ? (cost / p.circulation) * 1000 : null,
      };
    });
  }, [costs]);

  const sortedByCPM = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (a.cpm == null && b.cpm == null) return 0;
        if (a.cpm == null) return 1;
        if (b.cpm == null) return -1;
        return a.cpm - b.cpm;
      }),
    [rows],
  );

  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalReach = rows
    .filter((r) => r.cost > 0)
    .reduce((s, r) => s + r.circulation, 0);
  const overallCPM = totalReach > 0 ? (totalCost / totalReach) * 1000 : null;

  function reset() {
    PUBLICATIONS.forEach((p) => setCost(p.id, 0));
  }

  return (
    <section className="card p-5">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="label flex items-center gap-1.5">
            <Euro className="h-3 w-3" />
            Kosten & CPM-Analyse
          </div>
          <h3 className="mt-1 text-xl">Was kostet dich eine Schaltung pro 1.000 Leser?</h3>
          <p className="mt-1 text-xs text-ink-500">
            Preise pro Schaltung eintragen — Sortierung nach bester CPM. Werte
            bleiben lokal gespeichert.
          </p>
        </div>
        <button type="button" onClick={reset} className="btn-ghost !py-1 !text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          Alles zurücksetzen
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/10 text-left text-[11px] uppercase tracking-wider text-ink-500">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Publikation</th>
              <th className="py-2 pr-2 text-right">Auflage</th>
              <th className="py-2 pr-2 text-right">Kosten / Schaltung</th>
              <th className="py-2 pr-2 text-right">CPM (€)</th>
            </tr>
          </thead>
          <tbody>
            {sortedByCPM.map((r, i) => (
              <tr
                key={r.id}
                className="border-b border-ink-900/5 last:border-b-0"
              >
                <td className="py-2 pr-2 text-ink-500">
                  {r.cpm != null ? i + 1 : "—"}
                </td>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: r.color }}
                      aria-hidden
                    />
                    <span className="font-medium text-ink-900">{r.name}</span>
                    <span className="text-[10px] uppercase text-ink-300">
                      {r.type === "daily" ? "TZ" : "WB"}
                    </span>
                  </div>
                </td>
                <td className="py-2 pr-2 text-right tabular-nums text-ink-700">
                  {r.circulation.toLocaleString("de-DE")}
                </td>
                <td className="py-2 pr-2 text-right">
                  <div className="inline-flex items-center gap-1">
                    <span className="text-ink-500">€</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={r.cost || ""}
                      placeholder="—"
                      onChange={(e) =>
                        setCost(r.id, Number(e.target.value) || 0)
                      }
                      className="input !w-24 !py-1 text-right tabular-nums"
                    />
                  </div>
                </td>
                <td className="py-2 pr-2 text-right">
                  {r.cpm != null ? (
                    <span
                      className={`tabular-nums font-medium ${
                        i === 0 ? "text-green-700" : "text-ink-900"
                      }`}
                    >
                      {i === 0 && (
                        <TrendingDown className="mr-1 inline h-3 w-3" />
                      )}
                      €{r.cpm.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-ink-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink-900/20 font-medium">
              <td className="py-3 pr-2"></td>
              <td className="py-3 pr-2">Summe (eingetragen)</td>
              <td className="py-3 pr-2 text-right tabular-nums">
                {totalReach.toLocaleString("de-DE")}
              </td>
              <td className="py-3 pr-2 text-right tabular-nums">
                €{totalCost.toFixed(2)}
              </td>
              <td className="py-3 pr-2 text-right tabular-nums">
                {overallCPM != null ? `€${overallCPM.toFixed(2)}` : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-500">
        <strong>CPM</strong> = Kosten pro 1.000 erreichte Leser.{" "}
        Je niedriger, desto effizienter die Schaltung im Verhältnis zur
        Gesamt-Auflage. Überlagere die Reichweite mit deinen Bon-Daten
        (Heatmap unten) um zu sehen, welche Auflage auch wirklich bei dir
        ankommt.
      </p>
    </section>
  );
}
