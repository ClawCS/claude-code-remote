import { useState } from "react";
import { GoogleMap } from "./components/Map/GoogleMap";
import { PublicationToggles } from "./components/Filters/PublicationToggles";
import { PublicationDashboard } from "./components/Panels/PublicationDashboard";
import { DistanceCalculator } from "./components/Panels/DistanceCalculator";
import { CostCalculator } from "./components/Panels/CostCalculator";
import { BonHeatmapUpload, type HeatmapPoint } from "./components/Panels/BonHeatmapUpload";
import { ExportButton } from "./components/Panels/ExportButton";
import { STORE } from "./data/publications";

export default function App(): JSX.Element {
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([]);

  const heatmapForMap = heatmap.map((p) => ({
    lat: p.lat,
    lng: p.lng,
    weight: Math.max(1, p.count),
  }));

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="border-b border-ink-900/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-trinkgut font-display text-lg font-bold text-cream-50">
                T
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-ink-500">
                Trinkgut Jammers Goch · Werbegebiete
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Wo deine 9 Publikationen wirklich ankommen.
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
              Interaktive Reichweitenanalyse mit echten Fahrzeiten ab {STORE.address.split(",")[0]}.
              CPM-Vergleich, Distance-Check, Kunden-Heatmap — damit du Media Central datenbasiert gegenueberstehst.
            </p>
          </div>
          <div className="no-export">
            <ExportButton targetIds={["export-map", "export-dashboard", "export-cost"]} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
        {/* Map + Toggle-Bar */}
        <section id="export-map" className="space-y-4">
          <PublicationToggles />
          <GoogleMap heatmapPoints={heatmapForMap.length ? heatmapForMap : undefined} />
        </section>

        {/* Dashboard-Cards */}
        <section id="export-dashboard">
          <PublicationDashboard />
        </section>

        {/* Calculators + Heatmap */}
        <section id="export-cost" className="grid gap-6 lg:grid-cols-2">
          <DistanceCalculator />
          <CostCalculator />
        </section>

        <section>
          <BonHeatmapUpload onPoints={setHeatmap} />
        </section>

        <footer className="border-t border-ink-900/10 pt-6 pb-10 text-center text-xs text-ink-400">
          <p>
            Gebaut fuer Niko · Trinkgut Jammers Goch e.K. · Daten: Media Central /
            Verlage. Fahrzeiten via Google Directions API. Fahrzeit-Cache: 30
            Tage (localStorage).
          </p>
        </footer>
      </main>
    </div>
  );
}
