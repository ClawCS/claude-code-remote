import { AlertTriangle } from "lucide-react";

export default function ApiKeyWarning() {
  return (
    <div className="rounded-2xl border border-trinkgut/30 bg-trinkgut/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-trinkgut" />
        <div>
          <h2 className="text-lg font-medium text-trinkgut-dark">
            Google-Maps-API-Key fehlt
          </h2>
          <p className="mt-1 text-sm text-ink-700">
            Das Tool läuft im Offline-Modus — Fahrzeiten sind Schätzungen
            (Luftlinie × 1.3), und die Karte selbst ist deaktiviert.
            Lege eine{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">
              .env.local
            </code>{" "}
            im Projekt-Root an mit:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-ink-900 p-3 text-xs text-cream-50">
            VITE_GOOGLE_MAPS_API_KEY=dein-key-hier
          </pre>
          <p className="mt-2 text-xs text-ink-500">
            Key bekommst du unter console.cloud.google.com → APIs &amp;
            Services. Aktiviere: Maps JavaScript API, Directions API, Geocoding
            API. Siehe README für die vollständige Anleitung.
          </p>
        </div>
      </div>
    </div>
  );
}
