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

Linux-Release und öffentliche Abnahme werden vor Abschluss ergänzt. Private Testnachweise: `.superpowers/partyplaner-litres-2026-10-10/`. Keine Änderungen am Bewerbungsbetrieb, Mailversand, Zahlungen oder an Sicherheitskonfigurationen; fremde Arbeitsänderungen bleiben erhalten.
