# Lokaler filmischer Feinschliff — 10.10.2026

## Auftrag und Grenzen

Freigegebener Plan: `docs/superpowers/plans/2026-10-10-visual-polish.md`. Kräftigere Hierarchie und warme/dunkle Kapitel, vier fotografische Warengruppen, sechs vorhandene Original-Flaschenfreisteller mit interaktiver Hintergrundtypografie, Entfernung zweier überflüssiger Stellenanzeigen-Untertitel und Übernahme der bereits freigegebenen v4-Filmvorschau in die echte lokale Homepage.

Keine neuen Produktbilder benötigt oder generiert. Keine Änderung von Live-Release, Hosting, Sicherheitskonfiguration, Bewerbungsbetrieb, Mail, Miete, Zahlungen oder Wochenpaketen. Ursprünglicher Git-Stand `3cf2431ee7e639e032cc5e57dda87b1f3968441b`; Plan-Commit `689ea9bed792a8a9988c32f5cd5062f5af89fa59`.

## Ausgangsprüfung

- Repository synchronisiert, bestehender isolierter Worktree beibehalten. Fremde Screenshots, Bewerbungs-Zwischenbericht und Content-Laufberichte nicht angefasst.
- 42 relevante Bestandstests in drei Dateien bestanden.
- Browser-Vorheransicht unter `.superpowers/visual-polish-2026-10-10/before-assortment.png`; keine erfassten Konsolenwarnungen/-fehler.
- Sechs transparente Flaschenfotos aus dem früheren Projekt geprüft; zugehörige Original-Expertiseblätter sind mit dem aktuellen Projektbestand byte-identisch. Bestehende Poster bleiben erhalten. Keine Verwendung der alten künstlichen Kategorie-JPGs.

## Umsetzung

App-Commit `8b51ba7cd813a8a378bd44ed263b283cf46f267e`; zusätzliche Bild-/Resize-Regressionsprüfung `2b56e34cc3c9f390e524a4056bf42ccf9698e9bc` (nur Teständerung).

- Vier vollständig verlinkte, unbeschnittene Marktaufnahmen für Bier, Alkoholfrei, Wein und Spirituosen. Größere Überschriften, warme Cremeflächen und kräftigere redaktionelle Hierarchie; Header, Navigation und Formulare nicht global vergrößert.
- Sechs vorhandene transparente Originalflaschen byte-identisch übernommen. Dekorativer Sortenname und Lichtfarbe reagieren auf Zeiger/Tastaturfokus; normale Detailverlinkungen bleiben erhalten. Zwei/drei/sechs Spalten, keine reine Hover-Bedienung, reduzierte Bewegung respektiert.
- Wiederholte Gruppen-/Posterfolge nur auf der Startseite durch die Flaschenbühne ersetzt. Vollständige Originalplakate und Gruppenmotiv auf Eigenmarken-/NL-Seite bleiben bestehen.
- Nur der abgelehnte Absatz „Anzeigenmotive – keine Teamfotos. Alle Anzeigen lassen sich in voller Größe öffnen.“ entfernt. Alle drei Posterlinks sowie Datenschutz-/Verarbeitungsinformationen bleiben erhalten.
- Freigegebener 15-Sekunden-Film v4 in die echte lokale Homepage eingebunden: Anstoßen, Gartenszene mit genehmigter einleitiger Anlage, bestehender Einschenkablauf und Eigenmarkenfinale. Versionierte Desktop-/Mobildateien, keine neue Generierung.

## Nachweise

### Tests und Build

- TDD: neun beabsichtigte UI-Fehler vor Umsetzung; danach 17 fokussierte Tests einschließlich unveränderter CSS-Prüfung bestanden. Film-/Medienprüfung 19/19 bestanden.
- Abschließende Web-Suite: `NODE_ENV=test npm test -- lib/ --maxWorkers=2`, **102 Dateien, 1.652 Tests bestanden**. Anschließend hinzugefügter Resize-/Pixeltest separat mit gesamter Flaschen-Testdatei **8/8 bestanden**; nicht als erneute gesamte Web-Suite ausgegeben.
- TypeScript bestanden; Lint ohne Fehler, 21 bestehende Warnungen. Produktionsbuild erfolgreich, 120/120 Seiten vorgerendert. Der anschließende Test-only-Commit verändert das gebaute App-Artefakt nicht.
- Gesamtsuite einmal ausgeführt: 144/150 Dateien bestanden, 9 Testfehler/15 übersprungene Fälle. Ein veralteter Homepage-Vertrag wurde aktualisiert und anschließend grün geprüft. Übrige Fehler betreffen nicht eingerichtete native QPDF-12.4.2-Prüfvoraussetzungen bzw. zwei bestehende 5-Sekunden-Zeitlimits unter Gesamtsuitenlast. **Keine pauschale Behauptung einer grünen Gesamtsuite oder einer freigabefähigen Bewerbungsfunktion.**
- Private Befehlsausgaben und RED/GREEN-Abfolge: `.superpowers/sdd/2026-10-10-visual-polish/task-1-report.md` und dort referenzierte Logs.

### Produktionsvorschau und Bedienung

- Normalzeit-Produktion `http://127.0.0.1:3110/` frisch gebaut/gestartet, keine Testuhr. Entwicklungsrouten `/`, `/bewerbung`, `/eigenmarke`, `/nl` auf Port 3000 jeweils HTTP 200 und neue SSR-Inhalte geprüft.
- `npm run audit:public -- --url http://127.0.0.1:3110 --output .superpowers/visual-polish-2026-10-10/public-audit.json`: **117 Seiten, 3.055 lokale Ressourcen, 31 API-Verträge**, fünf unbekannte Seiten; **0 Fehler, 0 Warnungen**.
- Browserprüfungen bei 360, 390, 768 und 1440 Pixeln: zwei/drei/sechs Flaschenspalten, vollständige Bilder, lange Namen lesbar, keine horizontale Seitenüberbreite. Kategorieansichten auf Desktop und Mobil geprüft. Native Tastaturnavigation zu `/eigenmarke#schwarzer-teufel` erfolgreich; passender Hintergrundname und sichtbarer Fokus.
- Frischer Mobil-Tab: native Flaschenverlinkung → `/eigenmarke#pralle-kirsche` → Logo-Link zurück zur Startseite → Tastaturfokus auf Flaschenbühne. Bilder sichtbar und vollständig geladen; keine erfassten Konsolenwarnungen/-fehler. Bewerbungsseite ohne abgelehnte Sätze, drei vollständige Bildverlinkungen erhalten.
- Desktopfilm aus `jammers-hero-v4-desktop.mp4`: Dauer 15 Sekunden, stumm, `readyState=4`; Pause/Wiedergabe tatsächlich bedient. Mobiler Film aus `jammers-hero-v4-mobile.mp4` bei 390 Pixeln ebenfalls sichtbar laufend, 15 Sekunden, stumm, `readyState=4`, ohne Medienfehler.
- Einmaliger Anzeigeeffekt beim automatisierten Größen-/Seitenwechsel: sechs Bildflächen zunächst leer trotz gültiger dekodierter Originale; Neuladen stellte sie wieder dar. Exakte Produktionswiederholung sowie frischer mobiler Client-Hin-/Rückweg anschließend ohne Fehler. Nativer Komponenten-Resize-Test prüft auch tatsächlich gemalte Bildpixel. **Nicht reproduzierter transienter Befund, Ursache ungeklärt; kein behaupteter Fix und keine spekulative CSS-Änderung.** Unmittelbare CUA-Aufnahmen zeigten vereinzelt noch die vorherige Oberfläche, während DOM/URL bereits gewechselt waren; dies belegt keine abschließende Ursache des ersten Effekts.
- Private Screenshots: `.superpowers/visual-polish-2026-10-10/{assortment-desktop,bottles-desktop-final,bottles-tablet-768,bottles-mobile-360,bottles-mobile-client-return}.png`.

### Medien und Integrität

- Herkunft, Maße und SHA-256 aller sechs Originalkopien: `assets/source/eigenmarken-bottles/provenance.json`; keine Quellpfade im ausgelieferten HTML.
- v4 Desktop: 1280×720, 4.785.365 Bytes, SHA-256 `90db5ba2525d1a391e0ca6c1db5ae32472da7eefd6e455d309c9b2f5208b4291`.
- v4 Mobil: 960×540, 2.316.048 Bytes, SHA-256 `66141998ae290a8f8087dfe1921a53ddacffa6d7b9f9a4bd95ed42adce38797c`.
- Encoderprüfung: jeweils 15 Sekunden, 24 Bilder/s, H.264, keine Audiospur, Fast-start; beide unter den vereinbarten Größenbudgets. Historische Originale unverändert erhalten. Herkunftskette unter `assets/source/hero-film/provenance.json`.
- 13 bestehende Originalposter-/Gruppen-/Poster-/Film-/Wochenpaketdateien gegen Git-Ausgangsstand geprüft: **keine Abweichung**.

## Unabhängige Prüfung und Bereitstellungsgrenze

Task-Review: Umsetzung spezifikationskonform, keine kritischen/wichtigen Quellcodebefunde. Der anfängliche Bildanzeige-Vorbehalt wurde nach direkter Produktionswiederholung als nicht reproduzierter transienter Befund eingeordnet. Kleine Verbesserungsidee: Dateicontainer-Metadaten künftig zusätzlich zum Encoder unabhängig im Regressionstest lesen; heutige Hash-/Encoder- und Browsernachweise sind dokumentiert.

Abschließende unabhängige Gesamtprüfung `3cf2431..2b56e34`: **keine kritischen/wichtigen Befunde; für lokale Vorschau und Git-Integration freigegeben**. Zusätzlich unabhängig geprüft: neun Medienhashes, sechs eindeutige Detailanker, keine privaten Quellpfade im HTML, entfernte Untertitel, unverändert gesperrter anfänglicher Uploadstatus und begrenzte CSS-Verwendung. Die Gesamtprüfung bestätigt keine native Bewerbungsverarbeitung, filmische Dokumentarechtheit oder Veröffentlichung. Diese ausgeschlossenen Bewertungen bleiben getrennte Grenzen, keine stillschweigend abgeschlossenen Arbeiten.

Stand auf bestehendem Branch erhalten; kein Merge, kein Branch-/Worktree-Aufräumen, keine fremden Dateien gestaged. Der finale Push synchronisiert die lokale Worktree mit GitHub, veröffentlicht aber keine Website. **Nur lokale Vorschau; kein Hetzner-Deployment.** Öffentliche App bleibt `dc23203493a1c71cad5a4719dc588ca0a86f2fa0`. Bewerbungsupload, Mail, Mietbetrieb, Zahlungen, Sicherheitskonfiguration und Wochenpakete bleiben unverändert.
