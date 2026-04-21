# Trinkgut Jammers · NL-Werbegebiete-Tool

Interaktive Karte aller 9 Publikationen, in denen Trinkgut Jammers Goch
über **Media Central** wöchentlich inseriert — mit Live-Fahrzeiten,
CPM-Rechner, Distanz-Check und Bon-Heatmap-Upload.

Stack: **Vite + React 18 + TypeScript · Tailwind v3 · Google Maps JS API ·
Zustand · html2canvas + jsPDF**.

---

## 1. Quick-Start

```bash
npm install
cp .env.example .env.local
# → VITE_GOOGLE_MAPS_API_KEY eintragen
npm run dev
```

Läuft auf http://localhost:5173.

## 2. Google Maps API-Key besorgen

1. https://console.cloud.google.com/ öffnen → Projekt anlegen
   (z.B. "trinkgut-werbegebiete")
2. **APIs & Services → Bibliothek** → diese drei APIs aktivieren:
   - Maps JavaScript API
   - Directions API (für echte Fahrzeiten)
   - Geocoding API (für Adress-/PLZ-Suche)
3. **APIs & Services → Anmeldedaten → Anmeldedaten erstellen →
   API-Schlüssel**
4. Neu erstellten Key ins `.env.local` als `VITE_GOOGLE_MAPS_API_KEY`
5. **Wichtig:** Key einschränken auf HTTP-Referrer
   (`localhost:*`, `*.vercel.app/*`, später `trinkgut-jammers.de/*`).
   APIs weiter einschränken auf die drei oben.

Ohne Key läuft das Tool im Offline-Modus: Fahrzeit-Schätzung via
Luftlinie × 1.3, Karte selbst ist deaktiviert.

## 3. Features

| Bereich | Was es tut |
| --- | --- |
| **Karte** | 9 togglebare Publikations-Layer, Pins mit Labels, InfoWindow mit Live-Fahrzeit on-click. Wochenblätter = runde Pins, Tageszeitungen = rotierte Quadrate. Roter Trinkgut-Marker für den Store. |
| **Filter-Chips** | Einzelne Publikationen ein-/ausblenden. Karte fitted Bounds automatisch. "Alle anzeigen/ausblenden". |
| **Publikations-Cards** | Dashboard mit Auflage, Rhythmus, Verlag, Städteliste und Fahrzeit zur nächstgelegenen Stadt. Klick auf eine Card fokussiert das Gebiet auf der Karte. |
| **Distanz-Rechner** | Adresse/PLZ eingeben → Fahrzeit nach Goch + Liste passender Publikationen (Radius einstellbar). |
| **CPM-Rechner** | Kosten pro Schaltung eingeben → CPM-Sortierung. Werte persistieren per localStorage. |
| **Bon-Heatmap** | CSV mit deinen Kassendaten hochladen → PLZ-Koordinaten werden gecacht → Heatmap über die Karte. Zeigt, ob deine Werbegebiete zur tatsächlichen Kundenherkunft passen. |
| **PDF-Export** | Ein Klick → Karte + Dashboard als Briefing-PDF für Media Central. |

## 4. CSV-Format für Bon-Heatmap

Unterstützt wird jede CSV mit Header-Zeile. Beim Upload öffnet sich ein
Spalten-Mapper, wo du zuweist, welche Spalte PLZ/Anzahl/etc. ist.

Minimal-Spalten:

```csv
plz,anzahl_bons
47574,142
6511,38
6512,61
```

Erweiterte Variante (Spalten werden auto-erkannt, alles ist optional
außer PLZ + Anzahl):

```csv
plz,anzahl_bons,datum,umsatz,warengruppen
47574,142,2026-04-01,4512.30,Bier;Spirituosen
6511,38,2026-04-01,1204.80,Wein;AfG
```

Die PLZ-Koordinaten werden nach dem ersten Geocoding dauerhaft in
`localStorage` gespeichert — nächster Upload geht ohne Google-API-Calls
durch.

## 5. Publikation hinzufügen / bearbeiten

Alle Daten liegen in einer einzigen Datei:
[`src/data/publications.ts`](./src/data/publications.ts).

```ts
{
  id: "neue-publikation",
  name: "Neue Publikation XY",
  type: "weekly",          // "weekly" | "daily"
  circulation: 18000,
  rhythm: "Wöchentlich (Do)",
  publisher: "Verlag XY",
  region: "Kurzbeschreibung",
  color: "#a855f7",        // Hex, eigene Farbe
  cities: [
    { name: "Stadt", country: "NL", lat: 51.6, lng: 5.8 },
    // ...
  ],
}
```

Einfach ans Array `PUBLICATIONS` anhängen — UI, Filter und Cards
erscheinen automatisch.

## 6. Deployment (Vercel)

1. Repo auf GitHub pushen
2. https://vercel.com/new → Repo importieren
3. **Environment Variables**: `VITE_GOOGLE_MAPS_API_KEY` setzen
4. Framework: **Vite** (auto-erkannt), Build-Command: `npm run build`,
   Output: `dist`
5. Vor dem Deploy den Google-API-Key um die Vercel-Preview-Domains
   erweitern.

## 7. Build & Lint

```bash
npm run build   # typecheck + prod build
npm run lint    # ESLint
npm run preview # lokale Vorschau des Prod-Builds
```

## 8. Architektur

```
src/
├── components/
│   ├── Layout/Header.tsx          Titel + PDF-Export-Button
│   ├── Layout/ApiKeyWarning.tsx   Fallback-UI ohne Key
│   ├── Filters/PublicationToggles.tsx
│   ├── Map/GoogleMap.tsx          Karte, Marker, Heatmap
│   └── Panels/
│       ├── Dashboard.tsx          Cards-Grid
│       ├── PublicationCard.tsx    eine Karte pro Publikation
│       ├── DistanceCalculator.tsx Kundenadresse → Fahrzeit
│       ├── CostCalculator.tsx     CPM-Tabelle
│       └── BonHeatmapUpload.tsx   CSV-Parser + Geocoding
├── data/publications.ts           ★ die einzige Daten-Quelle
├── hooks/
│   ├── useGoogleMaps.ts           lädt JS API einmal
│   └── useDirections.ts           Fahrzeit mit Cache + Fallback
├── store/useAppStore.ts           Zustand (visible/costs/bons)
├── utils/
│   ├── geo.ts                     Haversine, Formatter
│   ├── config.ts                  API-Key-Helper
│   └── pdfExport.ts               html2canvas + jsPDF
├── App.tsx
├── main.tsx
└── index.css                      Tailwind + Design-Tokens
```

## 9. Known Issues / Notes

- **React 19 statt 18**: Das Vite-Template hat React 19 gescaffoldet,
  Code läuft problemlos — keine Migration nötig.
- **Google Heatmap deprecated**: Die `visualization`-Library wird von
  Google nur noch maintained. Funktioniert stabil, aber irgendwann
  sollten wir auf [deck.gl](https://deck.gl/) migrieren.
- **Directions-Cache**: 30 Tage TTL in `localStorage`. Per
  DevTools-Console `localStorage.clear()` bzw.
  `localStorage.removeItem('trinkgut-directions-cache')` zurücksetzen.
- **Koordinaten**: Stadtzentren als Näherung. Feinere Geometrien
  (ISO3166-Postalcode-Polygone) sind möglich, aber für den
  Entscheidungs-Use-Case "Wo wirbt wer?" nicht nötig.

## 10. Spätere Einbindung in trinkgut-jammers.de

Zwei Wege:

1. **iframe** der Vercel-Preview-URL unter `/werbegebiete`
2. **Build-Output** (`dist/`) direkt als statische Assets ins
   Next.js-`public/werbegebiete/` — dann ist es eine echte Subroute
   ohne Cross-Origin-Gedöns.

Option 2 ist sauberer, Option 1 ist in 2 Minuten erledigt.
