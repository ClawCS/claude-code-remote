import { MapPin, Download } from "lucide-react";

type Props = {
  onExport: () => void;
};

export default function Header({ onExport }: Props) {
  return (
    <header className="flex flex-col gap-3 border-b border-ink-900/10 pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-trinkgut">
          <MapPin className="h-3 w-3" />
          Trinkgut Jammers Goch
        </div>
        <h1 className="mt-1 text-4xl leading-[1.05] md:text-5xl">
          NL-Werbegebiete &amp; Reichweiten-Analyse
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-500">
          9 Publikationen, 70+ Städte, eine Karte. Fahrzeiten live aus
          Google-Routing, CPM-Rechner gegen die tatsächliche Auflage, und (wenn
          du willst) deine eigenen Kassenbon-Daten als Heatmap darüber — damit
          du bei Media Central datenbasiert diskutieren kannst.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onExport} className="btn-trinkgut">
          <Download className="h-4 w-4" />
          PDF-Briefing
        </button>
      </div>
    </header>
  );
}
