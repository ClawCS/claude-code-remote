# Partyplaner: Literbedarf statt Produktauswahl

Auftrag vom 10.10.2026: Im Partyplaner nur den Literbedarf der Warengruppen darstellen, keine automatisch ausgewählten Angebotsprodukte.

## Änderung

- Ergebnis als zugängliche Mengenübersicht: Bier, Wein, Softdrinks, Spirituosen und zusätzlich Wasser.
- Keine Produktnamen, Produktbilder, Packungsmengen, Preise oder Übernahme in die Anfrageliste. Die Seite importiert weder Katalog noch Warenkorb.
- Gästezahl, Dauer, Prozentverteilung und Verbrauchsformel unverändert. Genau 100 Prozent erforderlich; jede Eingabeänderung verwirft das vorherige Ergebnis.
- Deutsche Zahlendarstellung mit bis zu zwei Nachkommastellen. Die kleinste über die Oberfläche mögliche positive Spirituosenmenge bleibt als `0,04 l` erkennbar.
- Unverbindliche Richtwerte, Wasser ausdrücklich zusätzlich. Metadaten beschreiben die Mengenplanung statt einer nicht vorhandenen Equipmentberechnung.
- Die alten, hier nicht mehr aufgerufenen Empfehlungsfunktionen in `lib/party-planner.ts` bleiben außerhalb dieses eng begrenzten UI-Auftrags unverändert.

## Bisherige Prüfungen

- Test-first: neuer Browsertest schlug gegen die alte Produktausgabe fehl; nach Umstellung neun neue Browsertests bestanden.
- Vier vorhandene relevante Browserprüfungen bestanden: Wasserbedarf, Prozentvalidierung, Kontraste und ungültiger Berechnungshandler.
- Zwei Navigationstests für Einstieg über Hero, Service und Footer bei 1440 und 390 Pixel bestanden. Der erste Lauf klickte laut Trace vor dem Laden der JavaScript-Dateien auf der Zielseite; der Test wartet nun auf das `load`-Ereignis der gewöhnlichen Linknavigation, ohne Wartezeit oder Mehrfachklick einzubauen.
- Mobile Prüfung bei 390 × 844: kein horizontaler Überlauf; axe-Prüfung WCAG 2 A/AA und 2.1 AA ohne Befund.
- ESLint und TypeScript erfolgreich; localhost:3000 und geänderte Route erfolgreich geprüft. Sichtprüfung der vollständigen Literübersicht erfolgt.
- Unabhängige Nur-Lese-Gegenprüfung: kein Blocker festgestellt.
- Lokale Gesamtsuite: 3.135 Tests in 141 Dateien bestanden, 249,61 Sekunden. Native Dokumentfixtures nur lokal; keine externen Bewerbungen/Mails ausgelöst.

## Veröffentlichung

- App-Commit und Linux-Release: `e5cc5bd750ec70523dcad3b7639fb98b2ed53bde`; geprüfter Archivhash `83a945a7d8522bcfe0c41b70af567e450eb12167d6058f99e4ff054473dd03b7`.
- Linux-Webprüfung: 1.556 Tests in 93 Dateien, Lint, TypeScript, 128 Originalangebote und Produktionsbuild erfolgreich.
- Atomarer Releasewechsel auf `trinkgut-jammers-web-01` am 10.10.2026 um 12:15:51 UTC / 14:15:51 Europe/Berlin. Rückrollziel `c6f159a959564983d9bdc0f717d58590d0281d2c` unverändert erhalten.
- Nur Next neu gestartet; Caddy- und Unit-Hashes vor/nach unverändert. Mietbetrieb bleibt deaktiviert, Bewerbungs-API liefert `enabled:false`, `mode:disabled`.
- Alle neun neuen Browserprüfungen auf der echten öffentlichen HTTPS-Seite bestanden (6,4 Sekunden), einschließlich mobiler axe-Prüfung und kleiner Mengen. Öffentliche Ergebnisdarstellung außerdem im Browser visuell bestätigt.
- Öffentliche Contentprüfung am 10.10.2026 um 12:16:27 UTC: `status:ok`, keine Fehler/Warnungen, `websiteVerified:true`, `deploymentVerified:true`; beide gültigen Originalausgaben weiterhin unverändert gebunden.
- Öffentliche HTTP-Gesamtprüfung bestanden: 117 Seiten, 2.969 lokale Ressourcen, fünf unbekannte Routen und 31 API-Verträge, keine Fehler/Warnungen. Externe Links wurden in diesem Lauf nicht aufgerufen.

Private Testnachweise und Live-Screenshot: `.superpowers/partyplaner-litres-2026-10-10/`. Keine Änderungen am Bewerbungsbetrieb, Mailversand, Zahlungen oder an Sicherheitskonfigurationen; fremde Arbeitsänderungen bleiben erhalten. Der anschließende Dokumentationscommit verändert den App-Release nicht.
