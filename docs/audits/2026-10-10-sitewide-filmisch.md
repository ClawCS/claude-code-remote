# Durchgängiger filmischer Design-Umbau — lokale Abnahme

## Auftrag und Veröffentlichungsgrenze

Niko hat die vollständige Übertragung der Richtung A auf Startseite und sämtliche öffentlichen Kundenseiten mit »ja leg los« bestätigt. Grundlage sind die freigegebene [Spezifikation](../superpowers/specs/2026-10-10-sitewide-filmisch-design.md), der [Umsetzungsplan](../superpowers/plans/2026-10-10-sitewide-filmisch.md) und sein Screenshot `download.jpg`.

Dieser Auftrag wird ausschließlich in der bestehenden lokalen Worktree auf `codex/cinematic-production` ausgeführt. Keine öffentliche Umschaltung, keine Hosting-/Sicherheitsänderung und keine Aktivierung von Bewerbungen, Mail, Zahlungen oder Löschungen. Der bisherige öffentliche Release bleibt unverändert. Git-Sicherung ist kein Veröffentlichungsnachweis.

## Ausgangszustand

- App-Ausgangspunkt: `6d60875fba8584df38560b14e21eb72789fe5908`.
- Freigegebene Spezifikation und Ausführungsplan: `a048f067ba3aefca66b1a90ecf6d82a9dc8d1020`.
- Frische Web-Basisprüfung: `NODE_ENV=test npm test -- lib --maxWorkers=2`, **94 Dateien / 1.575 Tests bestanden**, 59,69 Sekunden.
- Vorhandene native Bewerbungs-Testvoraussetzungen werden separat ausgewiesen; sie werden durch eine Designabnahme nicht ersetzt.
- Fremde Alt-Screenshots, bestehender Bewerbungs-Zwischenbericht und fremde Content-Laufberichte bleiben unberührt.
- Entwicklungsserver auf Loopback-Port 3000 und bisherige Produktionsvorschau auf 3110 antworten mit HTTP 200. Port 3110 zeigt erst nach dem abschließenden Neubuild den neuen Gesamtstand.

## Prüfmatrix

| Bereich | Umsetzung | Funktions-/Darstellungsprüfung |
| --- | --- | --- |
| Gemeinsame Gestaltung und fünfteilige Navigation | `e51aa76` + `fbb76b7` | Separate Prüfung und Nachprüfung bestanden; integrierter Produktionsbuild und Browsermatrix ebenfalls bestanden |
| Startseite und niederländische Landingpage | `544e95d` | 63 gezielte Tests und 9 Browserfälle; unabhängige Prüfung und abschließende Integration bestanden |
| Angebote, Sortiment, Marken, Menschen und Aktionen | `8bc9e74` | 1.596 Webtests, 185 fokussierte Tests, 40 Browserfälle; unabhängige Prüfung bestanden |
| Rezepte, Akademie und Kundenwerkzeuge | `5c2a7c1` | 1.614 Webtests vor letzter kleiner Überschriftenergänzung, danach 19 fokussierte Tests; 50 Browserfälle im lokalen Produktionsbuild; unabhängige Prüfung bestanden |
| Vermietung, Karriere, Listen, Kontakt, Recht und Fehlerseiten | `1f7c455` + `a8112f0` | 28 Browserfälle + 3 gezielte Übergangsregressionen; unabhängige Prüfung und Nachprüfung bestanden |
| Gemeinsamer Build und vollständige lokale Routen-/Medienprüfung | App-Stand `a8112f0` | 164 Produktionsbrowserfälle; 117 Seiten, 3.000 Dateien, 31 API-Verträge und 107 Alias-Weiterleitungen bestanden |
| Unabhängige Schlussprüfung und Git-Synchronisation | Schlussprüfung freigegeben | Keine kritischen/wichtigen Befunde; ein nichtblockierender Testabdeckungs-Hinweis; Sicherungscommit enthält diesen Bericht |

## Abnahmeumfang

Der lokale Designstand ist zur Betrachtung freigegeben. Alle 37 öffentlichen Seitentemplates plus 404 wurden familienbezogen überarbeitet; echte Details, Formzustände, Mobil-/Tablet-/Desktopansichten und tatsächliche Navigationsklicks sind Bestandteil der Prüfung. Das ist keine öffentliche Veröffentlichung und keine Gesamtfreigabe des nativen Bewerbungsbetriebs. Historische Teilprüfungen unten bleiben als Verlauf erhalten; maßgeblich ist die abschließende integrierte Abnahme.

## Teilabnahme 1 — gemeinsame Gestaltung und Navigation

- Fünf Hauptgruppen, direkter Mietlink und separate Untermenüs, helle Infoleiste, gemeinsamer neutraler Hintergrund und redaktionelle Seiteneinleitung umgesetzt.
- 1.579 Webtests bestanden. Nach abschließender Tastaturkorrektur zusätzlich 30 fokussierte Tests und 26 Browserprüfungen bestanden; TypeScript, geänderte Dateien im Linter und Diff-Prüfung fehlerfrei.
- Die unabhängige Prüfung fand zu schmale Klickflächen an kurzen Brotkrumen-Links. Reproduziert mit 18,67 px Breite, auf mindestens 44 × 44 px korrigiert; Browserregression und 5 Foundation-Tests grün, separate Nachprüfung ohne offenen Befund.
- Controller hat den Kopfbereich und geöffnete Menüs bei 1440 und 390 px visuell geprüft. Angebote bleiben unverändert: lokaler API-Ausgangswert 128; keine Änderungen an Quellen, Daten, Services oder APIs.
- Vollprojektprüfung: 140 Dateien bestanden, 3 native Bewerbungsdateien fehlgeschlagen; 3.058 Tests bestanden, 6 fehlgeschlagen, 15 übersprungen. In diesem Lauf fehlte die absolute QPDF-Testkonfiguration; zusätzlich liegt lokal Poppler 26.05.0 statt der verlangten 26.10.0 vor. Kein Nachweis aktiver oder freigegebener Bewerbungsverarbeitung.

## Prüfentscheidung

Die unveränderten nativen Bewerbungsprüfungen werden am Anfang und bei der Gesamtprüfung ausgeführt, nicht nach jeder rein visuellen Seitengruppe. Jede Gruppe erhält weiterhin die vollständige Websuite. Risiko dieser Bündelung: Eine versehentlich eingeschleuste native Änderung würde gegebenenfalls erst bei der Gesamtprüfung auffallen; deshalb wird zusätzlich der Diff aller ausgeschlossenen Daten-/API-/Servicebereiche kontrolliert.

## Teilabnahme 2 — Startseite und NL

- Vollständige Komposition unterhalb des unveränderten Films: gleichwertige DE-/NL-Originale, zusammengefasste Servicegeschichte, große Markt-/Geschenkmotive, sechs Eigenmarken, Aktionen, Team/Karriere und GrailBid.
- Niederländischer Einstieg mit gemeinsamer heller Gestaltung und zurückhaltendem Orange; Originalzeiträume, lokale Dateien, fehlende und vorbereitete Ausgaben bleiben korrekt abgebildet.
- 63 gezielte Tests, 9 Browserprüfungen bei 390/768/1440 px, TypeScript, Lint und Diff-Prüfung bestanden. Die einmalige vollständige Websuite ergab 1.585 bestandene Tests und eine überholte Erwartung an die ausdrücklich entfernte Preisleiste. Nur diese Startseiten-Erwartung korrigiert; der betroffene Test und alle Mietkatalog-Preisprüfungen bestanden anschließend. Gesamtprüfung wird nicht als bereits grün behauptet.
- Unabhängige Prüfung ohne kritischen oder wichtigen Befund. Alte Metadata-/Chrome-Browsertests mit Dreier-Eigenmarken- und offenem Teamraster müssen bei der Integration an den freigegebenen Aufbau angepasst werden; ihre Metadaten-, Datenschutz- und Bildprüfungen bleiben erhalten.
- Controller hat den realen Kopf-/Film-/Angebotsbereich und NL-Einstieg zusätzlich visuell geprüft. Eine zuvor überhohe Serviceaufnahme wurde mit reproduzierbarem Layouttest korrigiert. Kein Film, Preis, Quellenbestand oder Betriebsmodus geändert.
- Klar markierte synthetische Browserfälle laufen separat auf dem Entwicklungsserver; echte Seiten werden im abschließenden Produktionsbuild geprüft. Die Fixture-Routen müssen dort 404 bleiben. Risiko falscher Testzuordnung: Ein produktionsspezifischer Fehler könnte im betreffenden Fall unentdeckt bleiben; deshalb werden beide Testgruppen und die geschlossenen Produktionszugänge ausdrücklich geprüft.

## Teilabnahme 3 — Angebote, Marken, Markt und Menschen

- Alle vorgesehenen Sammlungs-/Geschichtenseiten auf gemeinsame redaktionelle Einleitungen, strukturierte Suche/Filter und großzügige Bild-/Textkompositionen umgestellt. Eigene Klassen statt globaler Übermalung; vollständige Originalbilder, sieben Namenportraits und reales Gewinnspielarchiv erhalten.
- 97 Dateien mit 1.596 Webtests, 185 fokussierte Prüfungen und 40 Browserfälle bestanden. Drei Breiten (390/768/1440 px), Such-Leerzustand, ungültige Kategorie, beide echten Handzettel-Dialoge und Seitenwechsel zwischen Rubriken geprüft. TypeScript, Lint und Diff-Prüfung grün.
- Ein früher Entwicklungsdurchlauf meldete bei `/produkte` auf Desktop einmal einen Laufzeitfehler während laufender Änderungen. Unveränderter isolierter Nachlauf und komplette Browserwiederholung blieben fehlerfrei. Die Ursache ist nicht bewiesen; der finale Produktionsbuild muss das Fehlen dieses Fehlers nochmals bestätigen.
- Unabhängige Codeprüfung ohne kritischen, wichtigen oder kleinen Befund. Controller hat Eigenmarken-Einstieg und vollständige untere Motiv-/Textgeschichte zusätzlich angesehen. Daten, Medien, Quellen, APIs und Services weiterhin unverändert.
- Alte Juli-/September-Annahmen in einer historischen Gewinnspiel-Browsersuite wurden nicht als bestandener aktueller Test ausgegeben. Aktuelle Cover-/Quellen-/Vollständigkeitsverträge sind durch bestehende Unit-Tests und neue datumsrichtige Browserprüfungen abgedeckt.

## Teilabnahme 4 — Lernen und Kundenwerkzeuge

- Rezepte, Akademie/Kurse, Zertifikatsübersicht, Finder, Partyplaner, Partyspiele, Pfandrechner, Öko-Tracker und stillgelegte Community-/Kühlschrankseiten auf den gemeinsamen Look umgestellt. Daten, Berechnungen, Quizregeln, Quellen und Kennzeichnungen unverändert.
- 159 fokussierte Prüfungen und 98 Dateien mit 1.614 Webtests bestanden. Anschließende kleine Ergänzung für echte Unterüberschriften separat mit 19 Tests sowie TypeScript/Lint geprüft; vollständige integrierte Webprüfung folgt noch.
- Frischer lokaler Produktionsbuild erfolgreich. Darin 50 Browserfälle bei 390/768/1440 px bestanden: echte Kursnavigation, Prüfungsfreigabe, 60%-Fehlschlag und Wiederholung mit 70%-Erfolg, Finder-/Planer-/Rechnerzustände und Spieldialoge. 105 neue Nachweisbilder unter `audit/screenshots/sitewide-learning-tools-2026-10-10/`.
- Unabhängige Prüfung: spezifikationskonform, Qualität freigegeben, keine kritischen oder wichtigen Befunde. Nichtblockierender Prüfhinweis: Die automatische Laufzeitfehler-Sammlung erfasst bisher die Erstansichten, nicht jeden separaten Interaktionstest. Deshalb kein pauschaler Nachweis völliger Fehlerfreiheit aus der bestandenen Matrix. Zwei unveränderte Öko-Tracker-Lintwarnungen bleiben dokumentiert.
- Im Entwicklungsserver wurden zuvor sporadische Syntaxfehler im gemeinsamen Layout-Bundle beobachtet. Ursache nicht bewiesen; derselbe Stand bestand die strengen Browserprüfungen im Produktionsbuild. Keine Fehlerunterdrückung oder Änderung der Geschäftslogik vorgenommen. Dies ist kein Nachweis einer behobenen Entwicklungsserver-Ursache.
- Controller hat unter anderem mobile Rezept-/Finder-/Planeransichten, Spiel-/Prüfungszustände, den echten Lektionssprung samt Fokus und letzte Whiskey-Lektion zusätzlich geprüft. Weitere gemeinsame Abnahme nach dem letzten Seitenbereich bleibt erforderlich.

## Zusätzliche Prüfgrenze bei Mietartikeln

Alle 19 bestehenden Leihartikel haben einen Preis. Der bislang unbenutzte Zweig für einen Artikel ohne Preis wird deshalb mit ausdrücklich synthetischen Tests des echten Bauteils geprüft; reale Browserprüfung umfasst die tatsächlich vorhandenen Leer-, Waren-, Misch-, Datums- und Fehlerzustände. Keine geschützten Quelldaten oder Produktionsfreigaben werden allein für einen Screenshot verändert. Restrisiko: Für den nicht erreichbaren Zweig gibt es keinen direkten visuellen Browsernachweis.

## Integrierter Prüfstand nach dem letzten Seitenbereich

- Kandidat `1f7c455`: 28 Browserfälle des letzten Bereichs einschließlich aller zehn Metadata-/Chrome-Verträge bestanden; 108 Produktionsaufnahmen, jeweils 36 bei 390/768/1440 px. Sichere Bestandsprüfung: zunächst 40 bestandene Fälle, zwei überholte Lade-/Selektorannahmen gezielt korrigiert und beide nachgeprüft; zusätzlich drei Community-/Bestands-/Dialogregressionen bestanden. Kein echter Versand oder Bestellvorgang.
- Frische vollständige Webprüfung: 99 Dateien / 1.640 Tests bestanden (59,20 s). TypeScript fehlerfrei; globaler Linter ohne Fehler, mit 21 bestehenden Warnungen.
- Frische Vollprojektprüfung mit vorhandener QPDF-Konfiguration: 146 Dateien bestanden, eine native Suite wegen fehlender ausdrücklich verlangter Poppler-Version 26.10.0 fehlgeschlagen. 3.204 Tests bestanden, 15 Tests dieser Suite nicht ausgeführt; Gesamtlauf deshalb **nicht grün**. Die lokal vorhandene Version 26.05.0 wurde nicht als Ersatz ausgegeben. Bewerbungsbetrieb bleibt deaktiviert.
- Unabhängige Gegenprüfung fand anschließend einen noch nicht getesteten Übergang: Einzelübernahme aus der Merkzettel-Vorschau ließ gleichzeitig zwei Dialoge offen. Im Produktionsbrowser reproduziert und mit minimalem Dialogübergang korrigiert (`a8112f0`). Drei echte UI-Regressionsfälle bei 390/768/1440 px und 44 fokussierte Tests bestanden; unabhängige Nachprüfung ohne neuen Befund. Keine Änderung der Produkte/Mengen oder Datenverwaltung.
- Frischer Produktionsbuild nach dieser Korrektur erfolgreich; Bewerbungs-/Mietbetrieb weiter deaktiviert, beide Fixture-Routen weiterhin 404. Erneute vollständige Websuite am aktuellen Stand: 99 Dateien / 1.640 Tests bestanden (60,87 s). Die nachfolgende Abnahme prüft genau diesen App-Stand.

## Abschließende integrierte Abnahme

- App-Stand `a8112f0e59eec3678457b2391ab8134d9da755ec`, lokaler Produktionsbuild auf `http://127.0.0.1:3110/`; 120 statische Seiten erfolgreich gebaut, ohne Testuhr oder Fixture-Freigabe. TypeScript und Diff-Prüfung erneut fehlerfrei. Geschützte Daten, Originalmedien, Quellen, APIs, Services, Miet-/Bewerbungsbibliotheken, Kontexte, Abhängigkeiten und Next-Konfiguration sind gegenüber `6d60875` unverändert.
- **164/164 Produktionsbrowserfälle bestanden (5,8 Minuten)**: alle fünf neuen Seitengruppen-Suiten und bestehende Metadata-/Chrome-, Film-, Originalkontaktlogo-, Cocktailnavigation-, Finder-, Literplaner-, UI-Korrektur- und Mietanfrage-/Mengenverträge. Breiten 390/768/1440 px; Dialogübergänge, Tastaturbedienung, sichere synthetisch abgefangene Form-/Fehlerzustände und echte Navigation eingeschlossen. Keine echten Anfragen oder Bewerbungen versandt.
- Der ausdrücklich markierte NL-Leerzustands-/Langtitel-Fixturefall bestand separat auf Entwicklung 3000 (1/1, 4,7 s). Das ersetzt keinen Produktionsfall; beide Fixture-Routen bleiben auf 3110 geschlossen (404).
- Isolierter Leistungstest bestanden (1/1): LCP 108 ms, CLS 0,04907, gemessene Interaktion 32 ms, JavaScript 167.105 Bytes, Bilder 250.933 Bytes. Der genehmigte Mobilfilm hat 2.317.235 Nutzbytes. Unveränderte Testbudgets; CLS liegt nahe an der Grenze 0,05. Dies sind lokale Messungen, keine Aussage über Mobilfunk oder reale Besucher.
- `offers:check`: alle **128** unveränderten Originalangebote und ihre Bilder geprüft. `audit:public` ausschließlich gegen Loopback: **117 Seiten, 3.000 lokale Ressourcen, 31 API-Verträge, 5 unbekannte Routen**, null Fehler/Warnungen. Die 17 ausschließlich leeren/unauthentifizierten Abweisungsproben sind keine realen Formulartransaktionen. Beleg: `audit/evidence/sitewide-filmisch-2026-10-10.json`.
- Alle **107** historischen Produktslugs antworten mit 307 und dem jeweils richtigen Kategorie-Ziel; keine externe Weiterleitung verfolgt. Beleg: `audit/evidence/sitewide-filmisch-aliases-2026-10-10.json`.
- `content:check` gegen Loopback: beide KW41-Originale und Dateibindungen geprüft, keine Inhaltsfehler; `websiteVerified:true`, `deploymentVerified:false`. Status `degraded` ausschließlich wegen der bewusst nicht geprüften öffentlichen Veröffentlichung. DE-SHA-256 `be4b243ec0ddb84bee38054f051702a670ea8871fc897584190aefd9b8b4642a`, NL-SHA-256 `65fedf4c7016dfd91229ee5f0e2221b0d08aae4090572df0c35bb674c46db7d4`. Zeitraum unverändert 05.–10.10.2026; keine neue Quelle importiert, kein Datum verlängert.
- Controller-Sichtprüfung ergänzend zu den Familienmatrizen: Kopf/Film gegen Referenz, vollständige Angebots-/Eigenmarkengeschichte, mobile Rezept-/Werkzeug-/Quiz-/Dialogzustände, Karriere-/Rechts-/Kontaktseiten. Im finalen Build erneut 360-px-Menü mit echter Weiterleitung zur Vermietung, 390-px-Mietseite, 768-px-Akademie und 1440-px-Angebote geprüft. Keine horizontale Überbreite in den gemessenen Mobil-/Tabletansichten. Eigene finale Aufnahmen unter `audit/screenshots/sitewide-final-2026-10-10/`, vollständige Familienbelege in den `sitewide-*`-Nachweisordnern.
- Unabhängige Schlussprüfung des vollständigen Diffs bis EOF, sämtlicher Aufgabenberichte, Spezifikation und Prüfentscheidungen: **bereit zur lokalen Übergabe**, keine kritischen/wichtigen Befunde. Ein nichtblockierender Hinweis bleibt: die Laufzeitfehler-Sammlung der Lernwerkzeug-Browsersuite umfasst Erstansichten, nicht jeden separaten Interaktionstest. Keine pauschale vollständige Laufzeitfehlerfreiheit behauptet.

## Offene Grenzen außerhalb dieser Designabnahme

Die Aufgabennachweise wurden dauerhaft unter `docs/audits/sitewide-filmisch-2026-10-10/` gesichert. Ursprünglich temporäre Kopf-/Navigationsaufnahmen liegen jetzt in `audit/screenshots/sitewide-foundation-2026-10-10/`, Start-/NL-/Sammlungsaufnahmen in `audit/screenshots/sitewide-landings-collections-2026-10-10/`. Die historischen Aufgabenberichte nennen teilweise noch ihre damaligen temporären Pfade; diese Zuordnung bewahrt die Originalbelege. Evidenzcheckpoint `ec92f689e09bb23860a11da0edc518d79161cb62` wurde auf GitHub gepusht und per Remote-SHA abgeglichen. Die tatsächliche Homepage 3110 ist als lokale Übergabe geöffnet; temporäre Browsergröße zurückgesetzt. Dev 3000 ist ohne Fixture-Freigabe/Testuhr wieder verfügbar. Keine Synchronisation in einen anderen Checkout nötig.

- Die Vollprojektprüfung ist wegen fehlendem Poppler 26.10.0 nicht vollständig grün: 3.204 Tests bestanden, 15 native Tests nicht ausgeführt. Kein Upload-/Mail-/Löschbetrieb wurde aktiviert oder als abgenommen erklärt.
- Die zuvor beobachtete sporadische SyntaxError-Ursache im Entwicklungsbundle bleibt ungeklärt. Die frische Produktionsmatrix und der isolierte Entwicklungs-Fixturefall bestanden; daraus wird keine Ursachenbehebung abgeleitet.
- Keine Veröffentlichung auf Hetzner, kein Merge/PR, keine echten Zahlungen, E-Mails oder Bewerbungen. Der bestehende Branch und die Worktree bleiben für Nikos lokale Sichtung erhalten.

## Getroffene Prüfentscheidungen — vollständig und chronologisch

1. Markierte synthetische Fixturefälle separat im Entwicklungsserver, echte Seiten im Produktionsbuild prüfen. Grund: Die Vorlage verlangte zugleich geschlossene Produktions-Fixtures und synthetische Sonderzustände. Risiko einer falschen Einordnung: Ein produktionsspezifischer Fehler könnte im betreffenden Test fehlen; beide Gruppen und geschlossene Gates wurden geprüft.
2. Unveränderte native Bewerbungsprüfungen am Anfang und Ende bündeln; jede Seitengruppe erhält die volle Websuite. Grund: Rein visuelle Arbeit bei bekannten nativen Werkzeugvoraussetzungen. Risiko: Ein versehentlicher nativer Eingriff würde später auffallen; der geschützte Pfadvergleich ist zusätzlich leer.
3. Mietartikel ohne Preis nur im echten Bauteil mit klar synthetischen Daten prüfen. Grund: Alle 19 realen Artikel sind bepreist, keine Quelldatenänderung nur für einen Screenshot. Risiko: Der derzeit unerreichbare Zweig hat keinen direkten visuellen Browsernachweis.
