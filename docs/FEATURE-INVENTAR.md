# Feature-Inventar — Phase 0

Stand: 13.07.2026

| Bereich | Status | Entscheidung für Relaunch | Hauptdateien |
|---|---|---|---|
| Home | teilweise | Struktur wiederverwenden, Dramaturgie und Mobile-Hero neu | app/page.tsx, components/Hero.tsx, components/VideoHero.tsx |
| Sortiment | teilweise | Suche/Filter/Details behalten, Produktquelle und Claims neu | app/produkte, app/kategorie, data/products.json |
| Eigenmarken | gut vorhanden | Bühne, Daten und sechs Liköre wiederverwenden | app/eigenmarke, components/EigenmarkenShowcase.tsx, data/eigenmarken.ts |
| Akademie | stark, aber schwer | 175 Lektionen behalten; Server/Client-Grenzen und Fortschritt neu | app/akademie, data/akademie*.ts |
| Vermietung | teilweise | Karten/Preise als Basis; echte Anfrage und Verfügbarkeit neu | app/vermietung/page.tsx |
| Click & Collect | Prototyp | Mailto/LocalStorage durch Reservierungsanfrage mit Bestätigung ersetzen | app/warenkorb, app/checkout, app/bestellungen |
| Partyplaner | teilweise | Mengenlogik behalten, Produktauswahl und Anfragefluss härten | app/partyplaner/page.tsx |
| Events | unzureichend | Datengetriebenes Publish/Expiry/Fallback-Modell neu bauen | components/VideoHero.tsx, public/images/events |
| Angebote | inkonsistent | Dynamische Quelle vereinheitlichen, alte Mai-Daten entfernen | app/angebote, app/handzettel, app/api/handzettel |
| Team | Assets vorhanden | Rollen, Anzahl, Einwilligungen und Story freigeben | data/gallery.ts, app/galerie |
| Kontakt | weitgehend vorhanden | Stammdaten zentralisieren, Routen aus NL ergänzen | app/kontakt/page.tsx |
| Rechtliches | nicht launchfähig | Nach finalem Daten-/Geschäftsmodell fachlich und juristisch neu prüfen | app/impressum, app/datenschutz, app/agb |
| NL | umfangreich, unbelegt | Dramaturgie behalten; Preisclaims, lang und Copy neu | app/nl |
| EN | fehlt | Basisnavigation und Kernseiten neu | lib/i18n.ts, neue /en-Routen |
| Wetter | teilweise | Fallback Goch behalten; Datenfluss, Consent und Textsystem neu | components/WeatherWidget.tsx |
| WhatsApp | vorhanden | Nummer bestätigen, kontextbezogene CTAs vereinheitlichen | components/WhatsAppButton.tsx |
| Instagram | teilweise | Kuratiertes lokales Grid nach Brandinput neu | app/page.tsx, app/galerie |
| SEO | Grundlage vorhanden | Sitemap, hreflang, Sprachen und Offers korrigieren | app/layout.tsx, app/sitemap.ts, app/robots.ts |
| Analytics | fehlt | Plausible oder Umami erst nach Deploymententscheidung | keine Implementierung |
| Formulare | teilweise | Honeypot, Time-Trap, Validierung und Bestätigung zentral bauen | app/api/bewerbung, weitere Flows neu |
| Bildpipeline | teilweise | Sharp-Pipeline konsolidieren; AVIF/WebP/srcset/Placeholder verbindlich | scripts, public/images, public/handzettel |

## Wiederverwendbare Substanz

- Next.js 16 App Router mit 161 erfolgreich generierten Seiten.
- Sechs Eigenmarken-Liköre, 175 Akademie-Lektionen, Partyplaner, Vermietungsdaten, Handzettel-Fetcher, Produkt-/Kategorie-Routen und lokale Teamfotos.
- LocalBusiness-/Product-Schema, Metadaten, Sitemap-Grundlage und WhatsApp-Verlinkung.

## Neubau oder tiefgreifende Überarbeitung

- Tokenbasiertes visuelles System, zwei G1-Prototypen und Signature-Motion.
- Verlässliche aktuelle Angebots-/Produktquelle.
- Click-&-Collect-Anfrage mit serverseitiger Bestätigung.
- Zeitgesteuertes, redaktionell austauschbares Eventmodell.
- Vollständige URL-basierte Spracharchitektur DE/NL/EN.
- Consent-/Datenschutz-konforme externe Datenflüsse.
- Testinfrastruktur, Lighthouse/axe/Playwright und CI-Gates.

## Technische Baseline

- Stack: Next.js 16.2.4, React 19.2.4, TypeScript strict, Tailwind CSS 4.2, Sharp.
- Keine Unit-, Integration- oder E2E-Tests; kein test-Script und keine CI.
- npm run build: PASS.
- npm run lint: FAIL mit 1 Fehler und 20 Warnungen.
- Viele globale und seitenspezifische Client Components; Home, NL und Akademie tragen große Client-Bundles.
- Datei-Persistenz und In-Memory-Rate-Limits sind nur in einem sauber abgesicherten Einzel-VPS-Setup tragfähig.
