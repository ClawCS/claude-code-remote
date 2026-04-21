import { useRef } from "react";
import Header from "./components/Layout/Header";
import ApiKeyWarning from "./components/Layout/ApiKeyWarning";
import PublicationToggles from "./components/Filters/PublicationToggles";
import GoogleMap from "./components/Map/GoogleMap";
import Dashboard from "./components/Panels/Dashboard";
import DistanceCalculator from "./components/Panels/DistanceCalculator";
import CostCalculator from "./components/Panels/CostCalculator";
import BonHeatmapUpload from "./components/Panels/BonHeatmapUpload";
import { useGoogleMaps } from "./hooks/useGoogleMaps";
import { HAS_API_KEY } from "./utils/config";
import { exportNodeAsPdf } from "./utils/pdfExport";
import "./App.css";

function App() {
  const { ready, error } = useGoogleMaps();
  const exportRef = useRef<HTMLDivElement>(null);

  async function onExport() {
    if (!exportRef.current) return;
    try {
      await exportNodeAsPdf(
        exportRef.current,
        `trinkgut-werbegebiete-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (err) {
      console.error("PDF-Export fehlgeschlagen:", err);
      alert("PDF-Export fehlgeschlagen. Details in der Konsole.");
    }
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <Header onExport={onExport} />

        {!HAS_API_KEY && (
          <div className="mt-6">
            <ApiKeyWarning />
          </div>
        )}

        {error && HAS_API_KEY && (
          <div className="mt-6 rounded-2xl border border-trinkgut/30 bg-trinkgut/5 p-4 text-sm text-trinkgut-dark">
            Google Maps konnte nicht geladen werden: {error}
          </div>
        )}

        <div ref={exportRef} className="mt-6 flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <PublicationToggles />
            {HAS_API_KEY ? (
              <GoogleMap ready={ready} />
            ) : (
              <div className="flex h-[55vh] min-h-[420px] items-center justify-center rounded-2xl border-2 border-dashed border-ink-900/15 bg-cream-200 p-8 text-center text-sm text-ink-500">
                Karte inaktiv — bitte Google-Maps-API-Key in{" "}
                <code className="mx-1 rounded bg-white px-1.5 py-0.5">
                  .env.local
                </code>{" "}
                eintragen.
              </div>
            )}
          </section>

          <DistanceCalculator />

          <Dashboard />

          <CostCalculator />

          <BonHeatmapUpload />
        </div>

        <footer className="mt-12 border-t border-ink-900/10 pt-6 text-xs text-ink-500">
          <p>
            Datenstand: Media-Central-Sortiment Trinkgut Jammers ·
            Fahrzeiten live via Google Directions (gecacht) · Koordinaten der
            Publikationsgebiete als Näherung auf Stadtzentren.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
