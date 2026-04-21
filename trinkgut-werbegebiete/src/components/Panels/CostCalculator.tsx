import { useMemo } from "react";
import { PUBLICATIONS } from "../../data/publications";
import { useStore } from "../../state/store";
import { formatEuro } from "../../utils/geo";
import { Calculator, ArrowDownUp } from "lucide-react";

interface Row {
  id: string;
  title: string;
  color: string;
  circulation: number;
  cost: number;
  cpm: number | null;
  kind: "weekly" | "daily";
}

export function CostCalculator(): JSX.Element {
  const costs = useStore((s) => s.costs);
  const setCost = useStore((s) => s.setCost);

  const rows = useMemo<Row[]>(() => {
    return PUBLICATIONS.map((p) => {
      const cost = costs[p.id] ?? 0;
      const cpm = cost > 0 ? (cost / p.circulation) * 1000 : null;
      return {
        id: p.id,
        title: p.title,
        color: p.color,
        circulation: p.circulation,
        cost,
        cpm,
        kind: p.kind,
      };
    }).sort((a, b) => {
      if (a.cpm == null && b.cpm == null) return b.circulation - a.circulation;
      if (a.cpm == null) return 1;
      if (b.cpm == null) return -1;
      return a.cpm - b.cpm;
    });
  }, [costs]);

  const totalCost = rows.reduce((acc, r) => acc + r.cost, 0);
  const totalCirc = rows.filter((r) => r.cost > 0).reduce((a, r) => a + r.circulation, 0);
  const blendedCpm = totalCirc > 0 ? (totalCost / totalCirc) * 1000 : null;

  return (
    <div className="card p-5">
      <header className="mb-4 flex items-center gap-2">
        <Calculator size={18} className="text-trinkgut" />
        <h3 className="font-display text-xl">Kostenrechner · CPM-Analyse</h3>
      </header>
      <p className="mb-4 text-xs text-ink-500">
        Trage pro Publikation die Kosten pro Schaltung (Netto, EUR) ein. CPM = Kosten pro 1.000 erreichten Exemplaren.
        Sortiert nach bester CPM = guenstigster Kontaktpreis.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-ink-900/10 text-left text-[11px] uppercase tracking-wider text-ink-500">
              <th className="py-2 pr-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  <ArrowDownUp size={12} /> Publikation
                </span>
              </th>
              <th className="py-2 pr-3 text-right font-medium">Auflage</th>
              <th className="py-2 pr-3 text-right font-medium">Kosten / Schaltung</th>
              <th className="py-2 pr-3 text-right font-medium">CPM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={r.id}
                className={`border-b border-ink-900/5 last:border-b-0 ${
                  idx === 0 && r.cpm != null ? "bg-cream-50" : ""
                }`}
              >
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className="font-medium">{r.title}</span>
                    <span className="text-[10px] uppercase text-ink-400">
                      {r.kind === "weekly" ? "W" : "T"}
                    </span>
                    {idx === 0 && r.cpm != null && (
                      <span className="rounded-full bg-trinkgut/10 px-1.5 py-0.5 text-[10px] font-semibold text-trinkgut">
                        Beste CPM
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 pr-3 text-right font-mono text-xs text-ink-700">
                  {r.circulation.toLocaleString("de-DE")}
                </td>
                <td className="py-2 pr-3 text-right">
                  <div className="inline-flex items-center">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={r.cost || ""}
                      onChange={(e) =>
                        setCost(r.id, Math.max(0, Number(e.target.value) || 0))
                      }
                      placeholder="0"
                      className="input w-24 py-1 text-right font-mono text-xs"
                    />
                    <span className="ml-1 text-xs text-ink-400">€</span>
                  </div>
                </td>
                <td className="py-2 pr-3 text-right font-mono text-xs">
                  {r.cpm == null ? (
                    <span className="text-ink-400">—</span>
                  ) : (
                    <span className="font-semibold">
                      {formatEuro(r.cpm)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {totalCost > 0 && (
            <tfoot>
              <tr className="border-t-2 border-ink-900/20 font-semibold">
                <td className="py-2 pr-3">Gesamt (mit Kosten)</td>
                <td className="py-2 pr-3 text-right font-mono text-xs">
                  {totalCirc.toLocaleString("de-DE")}
                </td>
                <td className="py-2 pr-3 text-right font-mono text-xs">
                  {formatEuro(totalCost)}
                </td>
                <td className="py-2 pr-3 text-right font-mono text-xs">
                  {blendedCpm != null ? formatEuro(blendedCpm) : "—"}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="mt-3 text-[11px] text-ink-400">
        Werte werden automatisch im Browser gespeichert (localStorage).
      </p>
    </div>
  );
}
