# Trinkgut Werbegebiete-Tool

Interaktive Reichweitenanalyse für die **9 NL/DE-Publikationen** von Trinkgut Jammers Goch e.K.

- **9 Publikationen** (7 Wochenblätter + 2 Tageszeitungen) als togglebare Layer auf Google Maps
- **Echte Fahrzeiten** ab Goch (Google Directions API, lokalem 30-Tage-Cache)
- **Distance-Calculator** — Adresse rein, Fahrzeit + abdeckende Publikationen raus
- **CPM-Kostenrechner** — trage Kosten pro Schaltung ein, bekomme sortierte Kontaktpreise
- **Bon-Heatmap-Upload** — CSV mit PLZ + Anzahl Bons hochladen, als Heatmap auf die Karte
- **PDF-Export** — Map + Dashboard als Briefing-PDF für Media-Central-Gespräche

## Stack

- Vite 5 + React 18 + TypeScript (strict)
- Tailwind CSS v3 (warmes Cream-Background, Trinkgut-Rot `#c8102e`)
- Zustand (persistiertes State-Management)
- `@googlemaps/js-api-loader` (Maps + Directions + Geocoding + Visualization)
- `papaparse` (CSV), `html2canvas` + `jspdf` (PDF-Export)
- `lucide-react` (Icons)

## Quick Start

```bash
# 1. Dependencies installieren
npm install

# 2. API-Key setzen
cp .env.example .env.local
# → .env.local oeffnen, VITE_GOOGLE_MAPS_API_KEY= einfuegen

# 3. Dev-Server starten
npm run dev
# → http://localhost:5173

# 4. Production-Build
npm run build
npm run preview
```

## Google-Maps-API-Key beschaffen

1. https://console.cloud.google.com/ → Projekt anlegen (z.B. "Trinkgut Werbegebiete")
2. **APIs & Services → Library** → folgende drei aktivieren:
   - `Maps JavaScript API`
   - `Directions API`
   - `Geocoding API`
   - (optional für Heatmap: schon in "Maps JavaScript API" enthalten via `visualization`-Library)
3. **Credentials → Create Credentials → API key**
4. Key absichern:
   - **Application restrictions → HTTP referrers** → `localhost:5173/*`, deine Staging- und Production-Domains (z.B. `werbegebiete.trinkgut-jammers.de/*`)
   - **API restrictions → Restrict key** → nur die drei o.g. APIs erlauben
5. Key als `VITE_GOOGLE_MAPS_API_KEY=...` in `.env.local`
6. Dev-Server neu starten (Env-Variablen werden nur beim Start gelesen)

> **Kosten:** Google gibt 200 USD/Monat als Free-Tier. Das Tool nutzt Caching aggressiv — realistisch bleibst du locker unter 10 USD/Monat auch bei täglicher Nutzung. Heatmap-Geocoding wird ebenfalls gecached (`localStorage`), d.h. einmal hochgeladene Bon-CSVs kosten nur beim ersten Mal.

## Deployment (Vercel)

```bash
# 1. Repo committen, zu GitHub pushen
# 2. Vercel → Import Project → trinkgut-werbegebiete (Unterordner als Root angeben)
# 3. In Vercel Project Settings → Environment Variables:
#    VITE_GOOGLE_MAPS_API_KEY = dein_key
# 4. HTTP-Referrer im Google-Key um deine Vercel-Domain ergänzen
```

Als **Standalone** läuft das Tool unter eigener (Sub-)Domain. Für Einbindung in `trinkgut-jammers.de/werbegebiete` empfiehlt sich entweder:
- **Subdomain** (`werbegebiete.trinkgut-jammers.de`) mit Link von der Hauptseite, oder
- **Iframe-Einbettung** im Next.js-Hauptprojekt unter `/app/werbegebiete/page.tsx`.

## Bon-CSV-Format

Die Heatmap-Funktion erwartet eine CSV mit mindestens zwei Spalten. Header-Zeile ist Pflicht, die Spaltennamen sind case-insensitive und akzeptieren Varianten:

```csv
plz,anzahl_bons
47574,128
6591,42
6511 KS,15
47533,67
```

Akzeptierte Spaltennamen:
- PLZ-Spalte: `plz`, `postcode`, `postleitzahl`, `zip`
- Anzahl-Spalte: `anzahl_bons`, `bons`, `anzahl`, `count`, `kunden`, `n`

NL-PLZ (`6511 KS`) und DE-PLZ (`47574`) werden automatisch erkannt.

## Neue Publikation hinzufügen

`src/data/publications.ts` öffnen und dem `PUBLICATIONS`-Array einen neuen Eintrag hinzufügen:

```ts
{
  id: "neue-id",                  // muss eindeutig sein
  title: "Name der Zeitung",
  kind: "weekly",                 // oder "daily"
  color: "#hexcode",              // eigene Farbe fuer Pins/Chip/Karte
  circulation: 30000,             // fuer CPM-Rechnung
  circulationLabel: "30.000",
  rhythm: "Woechentlich (Do)",
  publisher: "Verlag / Region",
  note: "optional",
  cities: [
    { name: "Stadtname", lat: 51.xxx, lng: 5.xxx },
    // ... weitere Staedte
  ],
},
```

Keine anderen Änderungen nötig — Toggles, Dashboard, CPM-Tabelle und Map-Layer ziehen automatisch.

## Technische Notizen

### Fahrzeit-Cache
- Keys: `<from_lat_4dp,from_lng_4dp>|<to_lat_4dp,to_lng_4dp>`
- TTL: 30 Tage
- Storage: `localStorage` unter `trinkgut_directions_cache_v1`
- Fallback bei API-Fehler: Haversine × 1.3 (Straßenfaktor) bei 65 km/h

### Geocoding-Cache (Heatmap-Upload)
- Storage: `localStorage` unter `trinkgut_plz_geocode_cache_v1`
- Einmal geocodete PLZs werden bei erneutem Upload wiederverwendet.

### State-Persistenz
- `zustand` mit `persist`-Middleware
- Key: `trinkgut-werbegebiete-state-v1`
- Gespeichert: aktive Layer, Map-Style, Label-Toggle, CPM-Kosten

## Known Issues / Bekannte Einschränkungen

- **Bundle-Size-Warnung** (~780 KB minified): Verursacht durch Google-Maps-SDK + `html2canvas` + `jsPDF`. Alles Libraries, die fürs Tool gebraucht werden. Lazy-Loading des PDF-Exports wäre die erste Optimierung, falls nötig — aber für ein internes Business-Tool, das einmal pro Session geladen wird, unkritisch.
- **Mobile Safari Heatmap**: Google Maps Heatmap-Layer renderte in sehr alten iOS-Versionen träge. Auf iOS 17+ kein Thema.
- **Map-Labels**: Tausendfach wiederholte permanente Labels können auf schwachen Geräten stocken — Toggle "Labels ausblenden" oben rechts löst das.
- **Koordinaten**: Die Stadt-Koordinaten sind auf 3 Nachkommastellen (ca. 100 m Genauigkeit) angegeben, was für Werbegebiets-Darstellung mehr als ausreicht. Exaktere Geocoding-Runs einmalig via Script bei Bedarf.

## Projekt-Struktur

```
src/
├── components/
│   ├── Map/
│   │   ├── GoogleMap.tsx          Container, Style-Umschalter, Fit-Bounds, Heatmap
│   │   └── PublicationLayer.tsx   Marker + Reichweiten-Kreise pro Publikation
│   ├── Filters/
│   │   └── PublicationToggles.tsx Chip-Leiste oben
│   └── Panels/
│       ├── PublicationCard.tsx    Karte pro Publikation
│       ├── PublicationDashboard.tsx Wochenblatt-/Tageszeitungs-Sections
│       ├── DistanceCalculator.tsx Adress-Lookup + Fahrzeit + Coverage
│       ├── CostCalculator.tsx     CPM-Tabelle mit Inline-Edit
│       ├── BonHeatmapUpload.tsx   CSV-Upload + Geocoding + Heatmap-Layer
│       └── ExportButton.tsx       PDF-Export via html2canvas + jsPDF
├── data/
│   └── publications.ts            Alle 9 Publikationen + STORE-Konstante
├── hooks/
│   ├── useGoogleMaps.ts           Singleton-Loader
│   ├── useDirections.ts           Fahrzeit mit Cache + Fallback
│   └── usePersistedState.ts       useState + localStorage-Spiegel
├── state/
│   └── store.ts                   Zustand-Store (aktive Layer, Kosten, UI)
├── utils/
│   └── geo.ts                     Haversine, Formatter, Coverage
├── App.tsx                        Layout, Sections, PDF-Target-Wiring
├── main.tsx                       React-Root
└── index.css                      Tailwind-Layer + Component-Klassen
```

## Lizenz / Hinweis

Internes Tool für Trinkgut Jammers Goch e.K. Alle Auflage-/Regionsdaten basieren
auf öffentlich verfügbaren Verlagsangaben (Stand April 2026). Bei Abweichungen
sind die Originalangaben der Verlage maßgeblich.
