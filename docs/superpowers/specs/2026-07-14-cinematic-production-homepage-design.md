# Cinematic Production Homepage — Design-Spezifikation

Datum: 14.07.2026  
Status: von Niko freigegeben  
Produktionsrichtung: Cinematic Dark  
Content-Betrieb: Hybrid-Modus  
Branch: `codex/cinematic-production`

## Ziel

Die bestehende Startseite wird durch eine vollständig produktionsfähige Cinematic-Dark-Homepage ersetzt. Sie verbindet echte Menschen und Aktionen aus Trinkgut Jammers Goch mit einer tiefdunklen Bühne, gelbem Richtungslicht, einer kontrollierten roten Geste und plakativer Typografie. Jede Hauptsektion soll als eigenständiger Social-Screenshot funktionieren, ohne Template- oder Stockfoto-Eindruck.

Die Homepage ist zugleich ein aktuelles Betriebsinstrument:

- Der jeweils gültige Handzettel erscheint automatisch und verschwindet nach Ablauf.
- Offiziell bestätigte trinkgut-Aktionen dürfen automatisch erscheinen.
- Eigene Gewinnspiele und erkennbare Personenmotive benötigen vor der Veröffentlichung eine Datums- und Rechteprüfung.
- Abgelaufene Inhalte werden niemals als aktuell dargestellt.

## Verbindliche Geschäftsdaten

- Name: Trinkgut Jammers / Getränkesupermarkt Jammers e.K.
- Inhaber: Nikolaos Jammers
- Anschrift: Jurgensstraße 20, 47574 Goch
- Öffnungszeiten: Montag bis Samstag 08:00–20:00 Uhr
- Telefon: 02823 418707
- WhatsApp: +49 175 2492386
- E-Mail: jammers-goch@trinkgut.de
- Verifizierte Leistungen: persönliche Beratung, Partybedarf und Vermietung

Die amtliche Schreibweise `Jurgensstraße` folgt dem Straßenverzeichnis der Stadt Goch. Die offizielle trinkgut-Marktseite kürzt die Adresse uneinheitlich als `Jurgenstr.20`; diese Kurzform wird nicht als sichtbare Website-Schreibweise übernommen.

## Freigegebene Inhalte und rechtliche Grenze

Niko hat die projektbezogene öffentliche Webnutzung des vorhandenen lokalen Fotopools und der Poster Pralle Kirsche, Schwarzer Teufel und Caramello bestätigt. Canva wird ausschließlich lesend verwendet und nicht verändert.

Diese Freigabe ersetzt keine unabhängige Urheberrechts- oder Model-Release-Prüfung. Deshalb gelten zusätzlich:

- Aktuelle Team- und Mitarbeitermotive dürfen nach Identitäts- und Rollenprüfung verwendet werden.
- Kunden, Kinder und erkennbare Dritte werden nur mit dokumentierter Einwilligung veröffentlicht.
- Fehlende Einwilligung führt zum Ausschluss oder zu einer datenschutzgerechten Unkenntlichmachung.
- Abgelaufene Gewinnspielgrafiken werden nur als klar datierter Rückblick verwendet.
- Canva-Stock, offensichtliche KI-Bilder, Fantasieetiketten und generische Partybilder werden ausgeschlossen.

## Gestaltungsprinzip

### Bühne

Die Seite ist keine schwarze Kartenwand. Große schwarze Flächen bilden eine filmische Bühne. Weiß trägt Lesbarkeit, Trinkgut-Gelb führt Blick und Bewegung, Trinkgut-Rot markiert genau einen entscheidenden Moment pro Szene. Blau bleibt ein seltener funktionaler Markenakzent.

### Typografie

- Charakterstarke, selbst gehostete Display-Schrift für plakative Aussagen.
- Ruhige, selbst gehostete Sans-Serif für Fließtext und UI.
- Überschriften werden kurz, konkret und überwiegend versal gesetzt.
- Textbreiten bleiben knapp; keine langen Marketingabsätze im sichtbaren Hauptfluss.
- Alle Größen, Abstände, Farben und Motion-Werte stammen aus einem zentralen Tokenvertrag.

### Fotografie

- Menschen und Handlungen tragen die Hauptdramaturgie.
- Einheitliches dunkles Grading mit warmen Hauttönen und kontrollierten gelb-roten Lichtakzenten.
- Originalmotive werden nicht als künstliche Freisteller ausgegeben.
- Kleine oder stark komprimierte Bilder erscheinen nur in begrenzten Kartenformaten.
- Handzettel bleiben erkennbare Angebotsmedien und werden nicht als Lifestyle-Fotografie behandelt.

## Signature-Element: „Jammers Spotlight Rail“

Der Hero öffnet als dunkle Markt-Bühne mit der Aussage `Goch schenkt ein.`. Ein authentisches Mitarbeiter-/Beratungsmotiv steht im Lichtkorridor. Beim Scrollen wandert die gelbe Lichtachse in eine horizontale Filmsequenz, in der drei Eigenmarkenposter nacheinander als nummerierte Originalmotive auftreten:

1. Pralle Kirsche
2. Schwarzer Teufel
3. Caramello

Die Bewegung ist progressiv:

- Server-HTML zeigt alle Inhalte ohne JavaScript vollständig.
- Desktop darf die Sequenz kontrolliert pinnen und horizontal führen.
- Mobile nutzt einen normalen vertikalen Ablauf ohne langes Pinning.
- `prefers-reduced-motion` deaktiviert Lenis, ScrollTrigger-Pinning, Parallax und transformbasierte Einflüge.
- Bei Motion-Ausfall bleibt die Reihenfolge als statische Editorial-Strecke lesbar.

Three.js wird nicht eingesetzt. Die vorhandenen Poster sind zweidimensionale Originalmotive und rechtfertigen keine erfundene 3D-Flasche.

## Dramaturgie der Startseite

### 1. Header und Live-Status

- Kompakter dunkler Header mit Jammers-Logo.
- Hauptnavigation: Angebote, Party & Miete, Eigenmarken, Aktionen, Über uns, Kontakt.
- Sichtbarer WhatsApp-Kontakt.
- Kleiner Live-Status aus Öffnungszeiten: `Heute bis 20 Uhr` oder `Heute geschlossen`.
- Mobile Navigation bleibt tastaturbedienbar und blockiert den Hero nicht.

### 2. Signature-Hero

- Kicker: `Trinkgut Jammers · Goch`
- Hauptaussage: `Goch schenkt ein.`
- Kurztext: persönliche Beratung, Partybedarf und Vermietung vor Ort.
- Primär-CTA: WhatsApp-Anfrage.
- Sekundär-CTA: Route oder aktuelle Angebote.
- Sichtbare Marktfakten: Jurgensstraße 20, Mo–Sa 08–20 Uhr, 47574 Goch.
- Authentischer Hero-Kandidat: Canva-Upload `D9175606-F3FB-4C4F-8CD2-EEBDD88AC3CA/L0/001-14.12.2024, 12:50:18.jpg`, 3238 × 5756 px, Mitarbeiter im Markt mit Wein.

### 3. „Jetzt bei Jammers“

Diese Sektion ist die einzige große Aktualitätsbühne. Sie kombiniert:

- gültigen Handzettel mit sichtbarem Zeitraum,
- eine aktuelle oder anstehende Aktion,
- WhatsApp-Kanal-CTA.

Referenz am Freigabetag:

- acht Handzettelseiten, in Canva am 08.07.2026 hochgeladen,
- gültig 13.07.2026–18.07.2026,
- Striker Ball Challenge bei Trinkgut Jammers am 24.07.2026.

Der Handzettel erscheint als fokussierte Coverkarte mit optionalem Seiten-Viewer. Preise werden nicht aus dem Bild herauskopiert und nicht als eigenständige Structured Offers ausgegeben.

### 4. „Menschen hinter Jammers“

Eine asymmetrische, redaktionelle Bildstrecke zeigt Markt, Team und lokale Beteiligung. Kuratierte Kandidaten:

- `WhatsApp Image 2025-02-20 at 12.55.39 PM-10.jpg`: aktuelles Teamfoto im Markt, 1200 × 1354 px.
- `WhatsApp Image 2025-03-10 at 12.17.13 PM (1).jpg`: sechs Personen mit Getränkekisten und Wagen, 1152 × 2048 px.
- `WhatsApp Image 2025-03-12 at 2.37.24 PM.jpg`: Eigenmarken-/Marktpräsentation, 1200 × 1600 px.
- `06656E54-D47D-4AB6-957C-00C0B4A89596/L0/001-14.1.2025, 13:54:54.jpg`: Mitarbeiter vor Getränkekisten, 1200 × 1600 px.
- `FD059FF5...18.5.2026...png`: authentischer Marktalltag mit Reinigungsaktion, 1086 × 1448 px.

Kleine Bilder werden nicht über ihre Auflösung hinaus vergrößert. Die Bildstrecke darf mit starken typografischen Zwischenkarten arbeiten, wenn ein Motiv nicht hero-tauglich ist.

### 5. „Deine Party. Unser Service.“

Die Leistungen werden nicht als generisches Vier-Karten-Raster inszeniert. Eine große typografische Servicewand führt durch:

- Beratung und Planung,
- Partybedarf,
- Kommissionskauf,
- Packservice,
- Leihartikel und Reservierung.

Solange keine konsistente Fotoserie der tatsächlichen Leihartikel vorliegt, verwendet die Produktionsseite echte Preis-/Bestandsdaten, präzise Typografie und zurückhaltende Produktzeichnungen statt KI- oder Stockbildern.

Die Mietartikelquelle ist `public/images/Preislisten/2.png` mit Stand 01.01.2026; `public/images/Preislisten/1.png` belegt den Bestand. Preise und Konditionen werden daraus strukturiert, nicht aus Legacy-Hardcodes.

### 6. Eigenmarken-Spotlight

Die drei freigegebenen Originalposter bilden die scrollgesteuerte Signature-Strecke. Jede Station enthält:

- Nummer und Produktname,
- klare Kennzeichnung als Originalposter,
- kurze charakterbasierte Copy ohne erfundene Geschmacks- oder Qualitätsclaims,
- Link zur bestehenden Eigenmarken-Seite.

### 7. Aktionen, Gewinnspiele und Rückblicke

Aktuelle Aktionen erhalten eine große Bühne mit Datum und CTA. Rückblicke erscheinen als kleinere, klar datierte Chronik. Beispiel für den Rückblick:

- Gewinnerfoto Januar 2026 nur klein und nur nach Rechteprüfung.
- Erdinger-Gewinnspiel Mai 2026 ausschließlich als `Rückblick · Mai 2026`.
- HOTT-Sports-, Monster- und Rollerwagen-Gewinnspiele niemals ohne belegten Gültigkeitszeitraum als aktuell.

### 8. Instagram-Auswahl

Kein Drittanbieter-Embed. Ein lokales, statisches Raster zeigt 4–6 kuratierte Beiträge oder Originalmotive. Es dient als Beleg für echten Marktalltag, nicht als vollständiger Feed. Jeder Eintrag erhält:

- lokales optimiertes Bild,
- Datum,
- kurze redaktionelle Bildunterschrift,
- Deep-Link zum Instagram-Profil oder Beitrag, wenn verfügbar.

### 9. Standort-Finale

- Adresse, Telefon, E-Mail, WhatsApp und Öffnungszeiten.
- Routen-CTA zu einer externen Kartenanwendung statt schwerem Karten-Embed im First Load.
- Kurzer Hinweis für Grenzkunden mit Link zur eigenständigen `/nl`-Landingpage.
- Rechtliche Links und Marktimpressum bleiben vollständig erreichbar.

## Hybrid-Content-Modell

### Quellenpriorität

1. **Handzettel:** offizieller trinkgut-Blaetterkatalog für Store-ID `13027` / Werbekreis `3.6`.
2. **Offizielle Events:** trinkgut-Markt- und Aktionsseiten.
3. **Canva:** visuelle Gegenprüfung, lokale Originalmotive, redaktionelle Aktionen und fertige Social-Motive.
4. **Instagram:** Veröffentlichungsnachweis und Deep-Link, nicht primäre Binärdatenquelle.
5. **Lokale redaktionelle Daten:** geprüfte, versionierte Metadaten im Repository.

### Statusmodell

Jeder zeitgebundene Eintrag besitzt mindestens:

- eindeutige ID,
- Titel und Kurztext,
- `validFrom` und `validTo` als Datum in Europe/Berlin,
- Quelle und Quell-URL,
- Bildquelle,
- Status `draft`, `scheduled`, `active`, `expired` oder `archived`,
- Rechte-/Freigabestatus,
- optionalen CTA.

`active` wird ausschließlich aus gültigem Zeitraum und Freigabestatus abgeleitet. Redakteure setzen den Status nicht manuell gegen das Datum.

### Automatischer Ablauf

- Sonntag 16:00 Uhr: offiziellen Handzettel für die Folgewoche vorladen.
- Täglich 06:15 Uhr: Gültigkeits- und Quellenprüfung.
- Handzettel nur veröffentlichen, wenn Katalogkennung, Seitenzahl und Datumsbereich plausibel sind.
- Offizielle Events automatisch als `scheduled`/`active` übernehmen.
- Canva-/Instagram-Fundstücke mit Personen oder eigenen Gewinnspielen als Prüfentwurf melden, nicht automatisch veröffentlichen.
- Nach `validTo` Inhalte sofort aus `Aktuell` entfernen und optional in den Rückblick verschieben.
- Ein automatischer Lauf darf Canva oder Instagram niemals verändern.

### Fehler- und Fallback-Verhalten

- Quellenfehler verlängern keine Gültigkeit.
- Der zuletzt bekannte Handzettel bleibt nur bis zu seinem belegten `validTo` sichtbar.
- Fehlt ein gültiger Handzettel, erscheint eine ruhige Meldung `Der nächste Handzettel wird vorbereitet` plus WhatsApp-CTA.
- Fehlt eine aktive Aktion, entfällt die Aktionskarte ohne Layoutloch.
- Ungültige oder nicht plausible Datumswerte blockieren die Veröffentlichung und erzeugen einen Audit-Hinweis.
- Externe Bild- oder Viewerfehler erhalten ein lokales Poster-/Text-Fallback.
- Keine abgelaufenen Preise, Countdown-Nullstände oder stillen Netzwerkfehler.

## Technische Architektur

- Next.js 16 App Router und React 19 bleiben bestehen.
- Die Homepage bleibt überwiegend eine Server Component.
- Kleine Client Islands besitzen ausschließlich Navigation, Viewer und Motion.
- Cinematic-Tokens werden zentral als TypeScript-Vertrag definiert und als CSS Custom Properties ausgegeben.
- Styling folgt der vorhandenen CSS-Module-/Tailwind-4-Struktur, ohne neue parallele Tokenquellen.
- GSAP, ScrollTrigger und Lenis werden seitenlokal initialisiert und vollständig aufgeräumt.
- Bilder laufen über Next Image und die projektweite Sharp-Pipeline mit AVIF/WebP, `srcset`, festen Größen und Blur-Placeholdern.
- Redaktionelle Zeitlogik liegt in reinen, unit-testbaren Funktionen und verwendet explizit `Europe/Berlin`.
- Das vorhandene Handzettel-API wird gehärtet, nicht doppelt neu gebaut.

## Branch- und Veröffentlichungsschutz

Der lokale Vergleichsbranch `codex/p1-design-directions` enthält auch Premium Light und wird nicht gepusht. Der Produktionsbranch startet vom bestätigten P0-Stand. Cinematic-Dateien werden ausschließlich per Whitelist neu übernommen oder neu erstellt; gemischte P1-Commits werden nicht cherry-gepickt.

Der Push erfolgt erst nach:

- Quellscan ohne Premium-Light-Route, Assets oder Evidenz,
- vollständigem Test- und Build-Pass,
- visueller Prüfung der Cinematic-Seite,
- Audit ohne offene P1/P2 für das aktuelle Arbeitspaket.

## Performance und Barrierefreiheit

- Lighthouse-Zielwerte gemäß Arbeitsauftrag: mindestens 95 in allen vier Kategorien auf Mobile und Desktop.
- LCP unter 1,5 s, CLS unter 0,05, INP unter 200 ms.
- Kein Instagram-Embed, kein schweres Karten-Embed und kein Hero-Video im First Load.
- Semantische Landmarken und logische Heading-Hierarchie.
- Vollständige Tastaturnavigation und sichtbare Fokuszustände.
- Kontrastprüfung für jede gelbe, rote und weiße Kombination.
- Touch-Ziele mindestens 44 × 44 CSS-Pixel.
- Reduced-Motion- und No-JS-Fallbacks sind Gate-Kriterien.

## Test- und Auditstrategie

### Unit- und Contract-Tests

- Tokenvertrag und Verbot roher Markenfarben in Produktions-CSS.
- Event-/Handzettelstatus an Start-, End- und Zeitzonengrenzen.
- Keine Veröffentlichung ohne Freigabe oder plausiblen Zeitraum.
- Adress-, Kontakt- und Öffnungszeitenvertrag.
- Whitelist der drei öffentlich freigegebenen Poster.
- Quellpriorität und Fallbacks des Hybrid-Modells.

### E2E

- Homepage bei 360, 390, 768, 1024, 1440 und 2560 px.
- Hauptaussage und CTA im ersten mobilen Viewport.
- Tastaturpfad durch Navigation, Viewer und CTAs.
- Reduced Motion deaktiviert Scroll-Pinning und Lenis.
- Aktiver Handzettel sichtbar, abgelaufener Handzettel nicht sichtbar.
- Aktion wechselt korrekt zwischen `scheduled`, `active` und `expired`.
- WhatsApp-, Routen-, Instagram- und Rechtslinks sind korrekt.

### Visuelle und technische QA

- Playwright-Screenshots werden tatsächlich visuell geprüft.
- Browserkonsole: null Errors und null Warnings auf der Homepage.
- Lighthouse Mobile und Desktop.
- axe-core: keine kritischen Befunde.
- Production-Build und vollständiger Lintlauf.
- Asset-Requests auf 404, falsche Dateitypen und übergroße Transfers prüfen.
- Öffentliche Git-Historie auf ausgeschlossene Premium-Light-Inhalte prüfen.

## Abnahmekriterien für das Homepage-Arbeitspaket

- Die Root-Homepage verwendet Cinematic Dark als vollständiges Produktionssystem.
- Echte Menschen und Marktaktionen prägen die Bildsprache.
- Aktueller Handzettel und offizielle Aktion sind zeitgesteuert und ausfallsicher.
- Gewinnspiele und Personenmotive folgen dem Hybrid-Freigabemodell.
- Pralle Kirsche, Schwarzer Teufel und Caramello bilden die Signature-Strecke.
- Keine Stock-/KI-Ersatzbilder oder unbelegten Verkaufsclaims.
- Mobile, Reduced Motion, No-JS, A11y und Performance bestehen die definierten Gates.
- Der Cinematic-only-Branch enthält keine Premium-Light-Implementierung oder -Evidenz.

