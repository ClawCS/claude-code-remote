# Design A — Umsetzung und Abnahme

## Umfang

Freigegebene lokale Designrichtung »Filmisch & nahbar« in die echte Next.js-Website übertragen. Basis `30be854`; Spezifikation und Plan `36fcbe3`. Bestehende Funktionen und Inhalte unverändert, keine Veröffentlichung durch Git allein.

## Ausgangslage

- Aktive Worktree `cinematic-production`, Branch `codex/cinematic-production`, vor Start mit GitHub synchronisiert.
- Fremde Änderungen: vorhandene Auditscreenshots, Bewerbungs-Zwischenbericht und elf Contentlauf-Berichte; nicht Teil dieses Auftrags.
- `localhost:3000` bereits aktiv, HTTP200.
- API-Abgleich vor Umbau: `current`, `flyers`, `offers` HTTP200; DE/NL jeweils 05.–10.10.2026, DE18 Seiten, NL1 Seite, insgesamt128 Originalangebotskacheln.
- DE-PDF SHA256 `be4b243ec0ddb84bee38054f051702a670ea8871fc897584190aefd9b8b4642a`; NL-PDF SHA256 `65fedf4c7016dfd91229ee5f0e2221b0d08aae4090572df0c35bb674c46db7d4`.

## Basistest vor Änderungen

`NODE_ENV=test npm test -- --reporter=dot`: 137 Testdateien bestanden, vier fehlgeschlagen; 3034 Tests bestanden, sieben fehlgeschlagen,15 bestehende Skips. Gesonderte Bewerbungsdiagnostik benötigt ausdrücklich konfigurierte native QPDF-/Poppler-Pfade; zusätzlich ein bestehender Erasure-Belastungstest mit5s-Zeitüberschreitung. Diese Befunde entstanden vor dem Designcode. Keine Testausnahmen oder Änderung der gesperrten Dienste daraus ableiten.

## Verifikation

### Film und Player

- Commits `46abd69`, `94bc4c6`: lokal ausgelieferter 15s-H.264-Film ohne Ton, Desktop1280×720/4.789.249Bytes und Mobil960×540/2.317.235Bytes. Vollständiges Poster1280×720/130.626Bytes. Quellen-/Ableitungshashes in `assets/source/hero-film/provenance.json`, durch Controller gegengeprüft.
- Vollständiges sechsflaschiges Schlussmotiv visuell geprüft, kein nachträglicher Beschnitt. KI-Werbefilm sichtbar gekennzeichnet; keine dokumentarische Marktaufnahme behauptet.
- `npx vitest run lib/cinematic/__tests__/hero-film.test.tsx lib/cinematic/__tests__/component-boundaries.test.ts lib/cinematic/__tests__/css-audit.test.ts`:30Tests bestanden. ESLint der geänderten Dateien, `npx tsc --noEmit` und `git diff --check` bestanden.
- Unabhängiges Erst-Review fand einen mobilen Sichtbarkeitsfehler (Beobachtung des umschließenden Textblocks statt des Videobereichs) sowie fehlende Abbrechbarkeit während ausstehendem Playback. Beide mit reproduzierbarem RED→GREEN-Test repariert, unabhängige Fix-Gegenprüfung ohne offene Befunde.
- Gesamtlauf mit `APPLICATIONS_TEST_QPDF=/opt/homebrew/opt/qpdf/bin/qpdf npm test -- --maxWorkers=2`:141Testdateien bestanden,3135Tests bestanden. Eine gesonderte Bewerbungs-PDF-Testsuite scheitert bereits am Setup, weil die festgelegte native Poppler-Version26.10.0 nicht vorhanden ist;15Tests dieser Suite deshalb nicht ausgeführt. QPDF-/Custody-Baselinefehler im begrenzten parallelen Lauf nicht reproduziert. Keine Änderung der gesperrten Bewerbungsdienste oder Abschwächung ihrer Tests.

### Integration

- Controller-Browserprüfung auf echtem lokalem Produktions-Build `127.0.0.1:3110`: Desktop1440, Tablet768 und Mobil390; vollständiges16:9-Motiv, Filmsteuerung unter dem Bild, keine horizontale Überbreite. Neue Papierfarbe tatsächlich berechnet `#FAF9F6`; ein zuvor von Inline-Tokens überstimmter CSS-Versuch wurde vor Abnahme repariert.
- Handzettel nebeneinander und vollständig zentriert; keine konkurrierenden dreifachen PDF-Schaltflächen. NL-Dialog öffnet, Escape schließt und setzt Fokus auf Auslöser zurück. Der integrierte PDF-Renderer im Codex-In-App-Browser blieb dunkel; der direkte Original-PDF-Link bleibt verfügbar. Kein Nachweis eingebetteter PDF-Darstellung in diesem Browser, kein zusätzlicher PDF-Engine-Umbau im Designauftrag.
- Echte Navigationsfolge mobil: Menü → Offene Stellen & Bewerbung → drei vorhandene Anzeigen. Bestehende gesperrte Upload-/Mail-/Zahlungszustände unverändert.
- `npm run audit:public -- --url http://127.0.0.1:3110 --output audit/evidence/filmisch-2026-10-10-public-contracts.json`:117Seiten,2973lokale Assets,5Unbekannt-Routen,31API-Verträge,0Fehler/0Warnungen. Externe Ziele werden im Audit nicht aufgerufen. Beide Originale und128Angebotskacheln unverändert gebunden.
- Repräsentativer Controller-E2E-Lauf:36/37 bestanden; ein Outside-Click-Test zeigte eine unnötige `pointer-events:none`-Regel auf dem Filmtext. Regel entfernt (Textauswahl wieder möglich), unveränderter Test isoliert und im finalen Produktions-Browserlauf bestanden; keine abgeschwächte Menü-Schließprüfung.
- Finale Web-Tests `NODE_ENV=test npm test -- lib --maxWorkers=2`:94Dateien,1575Tests bestanden. Finale Film-State-Tests17/17, Browserlauf gegen Produktions-Build16/16, zusätzliche Viewer-/No-JS-/Mobil-Prüfungen5/5. TypeScript und Produktions-Build erfolgreich. ESLint0Fehler/26 bereits bestehende Warnungen.
- Gesamttests bleiben ausdrücklich nicht vollständig grün:3137bestanden, zwei Ausfälle (Timing im Filmtest;5000ms-Zeitlimit einer unveränderten Bewerbungs-Admin-Prüfung) plus fehlende native Poppler26.10.0-Voraussetzung mit15nicht ausgeführten PDF-Tests. Beide betroffenen Testdateien liefen isoliert76/76grün; der Filmtest wartet nun zusätzlich auf den tatsächlichen React-Wiedergabestatus und lief anschließend17/17grün. Bewerbungs-Code, dessen Tests und Zeitlimits blieben unangetastet.
- Lokaler Performance-Test: kalter Server LCP1364ms, CLS0,04839, Interaktion32ms; JS167.694Bytes, Bilder209.544Bytes, mobiles Video2.317.535Bytes. Keine ungemessenen/unerlaubten externen Ressourcen. Schwellen1500ms/0,05 sind knapp eingehalten; kein Versprechen realer Feldmesswerte. Warmer Wiederholungslauf116msLCP nicht als Kaltstart ausgegeben.
- Kurzzeitige leere Angebotsansicht während paralleler Prüfungen erklärt: `offers:check` bzw. Prebuild erzeugt dieselbe redaktionelle Sperre wie ein Paketupdate. Inhaltslader blendet währenddessen bewusst aus. Finale Browserabnahme deshalb nach Ende von Build/Angebotsprüfung, ohne Lock; keine Änderung dieser Schutzlogik.

### Unabhängige Gegenprüfung

- Task 1 nach Reparatur beider Befunde freigegeben; Task 2 (`94bc4c6..d8c8ae9`) in Spezifikation und Qualität freigegeben.
- Abschließendes Gesamt-Review des gesamten Umbaus (`30be854..d8c8ae9`): keine kritischen, wichtigen oder zusätzlich handlungsbedürftigen kleinen Codebefunde. Freigabe ausschließlich für die lokale Designvorschau.
- Nicht Gegenstand dieser Freigabe: öffentlicher Linux-Release, Aktivierung der Bewerbungs-/Mail-/Sicherheitsdienste, allgemeine PDF-Renderer-Kompatibilität oder Performance im tatsächlichen Kundenbetrieb. Dies folgt der ausdrücklichen lokalen Abnahmegrenze, nicht einer technischen Aktivierungsfreigabe.
- Vier Controller-Abnahmebilder liegen unter `audit/screenshots/filmisch-2026-10-10/`; maschinenlesbarer HTTP-/Datei-/API-Abgleich unter `audit/evidence/filmisch-2026-10-10-public-contracts.json`.

Kein pauschaler Grünstatus für das Gesamtprojekt aus einer Web-Teilprüfung.

## Bereitstellung

Der Designauftrag wird als echte lokale Website zur visuellen Schlussabnahme vorbereitet. Öffentliche Seite und Sicherheits-/Mail-/Bewerbungs-/Zahlungseinstellungen bleiben bis zu einer gesondert geprüften Umschaltung unverändert.

Die beiden lokalen Vorschauprozesse wurden nach Ende des Implementierungsagenten im Hauptkontext neu gestartet: Entwicklung auf Port 3000, tatsächlich gebauter Produktionsstand auf Port 3110, jeweils ausschließlich an 127.0.0.1 gebunden. Die laufenden Vorschauen sind an diesen Rechner gebunden, keine öffentliche Bereitstellung.

Git-Sicherung: vier Implementierungs-/Plancommits bis `d8c8ae9`, anschließend dieser Abnahmebericht samt eigener Bildbelege. Push ist nur eine Quellensicherung; kein Server-Release. Fremde Screenshots, Contentlauf-JSON und der Bewerbungs-Zwischenbericht bleiben außerhalb dieser Commits.
