# Offizielle Kontakt-Logos — Live-Abnahme

Datum: 9. Oktober 2026. Ausdrücklicher Betreiberauftrag: offizielle Google-Maps-, Instagram- und WhatsApp-Originale, keine zusätzlichen Rahmen oder andersfarbigen Buttonflächen; prüfen und live stellen. Ausgangs-HEAD `3295db140fd93afd537eed3a6358246415882e18`, Arbeitsbranch `codex/cinematic-production`. Fremde Screenshots und alte Content-Laufberichte bleiben unverändert/unversioniert.

## Umsetzung und Quellen

- Gemeinsame `SocialLink`-Darstellung für Kontakt-/Routenlinks: lokale offizielle Originalgrafiken, native Farben, unveränderte Proportionen und transparente Freiräume. Keine selbst nachgezeichneten Pfade, Filter, Rahmen, Schatten oder zusätzlichen Buttonflächen, auch nicht beim Hover.
- 48 × 48 Pixel unsichtbare Klickfläche, sichtbarer Tastaturfokus, deutsche/niederländische Screenreader-Beschriftungen und unveränderte Linkziele. Sichere Attribute für neue Tabs bleiben erhalten.
- Google Maps aus der offiziellen Maps-Produktseite; Instagram und WhatsApp aus den offiziell verlinkten Meta-Markenpaketen. Die aktuell bereitgestellte WhatsApp-Datei ist ein grünes Zeichen auf Transparenz; keine zusätzliche grün-weiße Plakette konstruiert. Herkunft, Download-/Archivpfade und SHA-256: `assets/source/contact-brands/provenance.json`.
- Originale unverändert lokal versioniert; PNGs werden mit Next Image bedarfsgerecht klein ausgeliefert. Das originale Instagram-PNG ist 5000 × 5000 Pixel groß; die kontrollierte 32-Pixel-PNG-Antwort umfasst 1.766 Bytes. SVG bleibt Original-SVG.
- Änderungen an aktivem Header/Footer, Kontakt, NL, Community, Galerie, Leergut und Öko-Tracker-Kontakt. Keine Änderungen an Nachrichten, Mietformulardaten oder Linkzielen. Der validierende WhatsApp-Anfrage-Submit im Mietformular und die Öko-Tracker-Teilen-Aktion sind keine statischen Kontaktlinks und wurden nicht umgebaut.

## Prüfungen

- Render-/Browser-Regressionen vor Implementierung rot, anschließend erfolgreich. Geschenkfoto-Test grenzt dekorative `aria-hidden`-Markenbilder von echten Inhaltsfotos ab.
- Lokal und im frischen Linux-Release: **84 Testdateien / 1.448 Unit-Tests bestanden**. ESLint, Route-Typegenerierung, TypeScript, Angebotsprüfung und Produktionsbuild erfolgreich. Alle 128 Original-Angebotskacheln weiterhin geprüft.
- Lokal: 16 Kontaktlogo-/Header-Browserfälle sowie sechs zusätzliche Accessibility-/Navigationsfälle bestanden. Unabhängiges Review ohne verbleibende P0/P1/P2-Befunde; Mindestziel im Browsertest auf tatsächliche 48 Pixel präzisiert.
- Öffentliche Website: abschließender Lauf **16/16 Browserfälle bestanden**, sieben Routen bei 1440 × 900 und 390 × 844 plus zwei Header-Regressionsfälle. Geprüft: Originalbilder geladen, unveränderte externe Linkattribute, zugängliche Namen, transparente rahmenlose Darstellung einschließlich Hover, keine Farbfilter, 48-Pixel-Ziele und kein horizontaler Überlauf.
- Beim ersten öffentlichen Lauf einmalige Überschreitung des 5-Sekunden-Bildladechecks für Instagram auf der Startseite; 15/16 Fälle bestanden. Trace zeigte einen noch ausstehenden Optimizer-Request, keinen belegten HTTP-Fehler. Der vollständige unveränderte Folgelauf bestand 16/16 in 12 Sekunden. Kalte Bildoptimierung ist plausibel, aber nicht abschließend bewiesen; keine garantierte Kaltstartzeit oder behobenen Performancefehler daraus behaupten.
- Zusätzlich echter In-App-Browser: öffentliche DE-Kontaktsektion und NL-Einstieg visuell geprüft. [Kontaktbereich live](../../audit/screenshots/original-contact-icons-2026-10-09/contact-footer-live-desktop.png).
- Alle drei öffentlichen Originaldateien per tatsächlichem HTTPS-GET geladen: HTTP 200, erwarteter MIME-Typ, Größe und SHA-256 exakt gleich den versionierten Originalen.

## Bereitstellung

- App-Commit **`8a6344eabba6f7a99b5b88546dc6ac8325a2e7e7`**, auf GitHub gesichert. Positiv gefiltertes Commit-Archiv, keine schmutzige Worktree, privaten Umgebungen oder Rohquellen. Archiv-SHA-256 lokal/Server: `133f9dccf0c0935fb607b2bfa7abd414671379a35d76d169da226f5ab4a9abb9`.
- Neuer Linux-Release auf dem bestätigten Host `trinkgut-jammers-web-01`, Node 22.23.3. Build/Test ausschließlich im neuen Releaseverzeichnis; danach root-eigen, nur `.next/cache` für `jammers` schreibbar. Service-Datei mit installiertem Stand identisch.
- Atomare Umschaltung am **09.10.2026, 04:51:46 UTC / 06:51:46 Europe/Berlin**. Erwartete kurze Startphase, danach Bereitschaftsproben erfolgreich, Dienst aktiv. Vorheriger Release `eb1338cbd8babea498a4a9a778f8fadae9f0b735` bleibt unverändert für Rollback erhalten.
- Keine DNS-, Caddy-, Firewall-, Mail-, Mietbetriebs- oder Zahlungsänderungen. Mietkonfiguration bestätigt `enabled:false`, `testMode:false`, `onlinePayment:false`.
- Öffentlicher `content:check` um 04:51–04:52 UTC: **status ok, websiteVerified=true, deploymentVerified=true**, keine Fehler/Warnungen. DE-/NL-Originale für 05.–10.10.2026 gebunden und geprüft. Lauf-ID `2026-10-09T04-51-55-216Z-check-e079c90e`; privater vollständiger Laufbericht nicht mitveröffentlicht.
- Abschließender allgemeiner öffentlicher HTTP-Audit: **bestanden**, null Fehler/Warnungen; 117 Seiten, 2.821 lokale Ressourcen, fünf unbekannte Routen und 30 API-Verträge geprüft. Externe Linkziele wurden dabei nicht aufgerufen (1.117 externe Linkvorkommen); keine Nachrichten/Formulare abgesendet. Vollständiger technischer Bericht lokal unter `/tmp/jammers-icons-live-http-audit.json`.

## Bekannter separater Wartungspunkt

`npm ci` meldet fünf hohe Entwicklungsabhängigkeitsbefunde innerhalb einer Kette `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` (GHSA-vfj7-8cjw-p6xm). `npm audit --omit=dev` meldet null Produktionsbefunde. Abhängigkeiten/Lockfile sind gegenüber dem vorigen Live-Release unverändert. Keine belegte Besucher-zu-Glob-Verarbeitung; keine Sicherheitsgarantie. Kein ungeprüftes `audit fix --force` oder Versionsdowngrade durchgeführt; getrennte Tooling-Wartung nötig.

Die nachfolgende Dokumentations-/Screenshot-Sicherung ändert den veröffentlichten App-Commit nicht. Bewerbungsupload und Newsletter werden durch diesen Designauftrag nicht aktiviert.
