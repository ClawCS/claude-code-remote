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
| Gemeinsame Gestaltung und fünfteilige Navigation | `e51aa76` + `fbb76b7` | Separate Codeprüfung und gezielte Nachprüfung bestanden; Gesamtbuild noch ausstehend |
| Startseite und niederländische Landingpage | Ausstehend | Ausstehend |
| Angebote, Sortiment, Marken, Menschen und Aktionen | Ausstehend | Ausstehend |
| Rezepte, Akademie und Kundenwerkzeuge | Ausstehend | Ausstehend |
| Vermietung, Karriere, Listen, Kontakt, Recht und Fehlerseiten | Ausstehend | Ausstehend |
| Gemeinsamer Build und vollständige lokale Routen-/Medienprüfung | Ausstehend | Ausstehend |
| Unabhängige Schlussprüfung und Git-Synchronisation | Ausstehend | Ausstehend |

## Abnahmevorbehalt

Noch kein Abschlussnachweis: Die Prüfung muss alle öffentlichen Seitentypen einschließlich echter Details, Formzustände, Mobil-/Tablet-/Desktopansichten und tatsächlicher Navigationsklicks umfassen. Ein neues Video oder neue globale Farbwerte allein erfüllen den Auftrag nicht.

## Teilabnahme 1 — gemeinsame Gestaltung und Navigation

- Fünf Hauptgruppen, direkter Mietlink und separate Untermenüs, helle Infoleiste, gemeinsamer neutraler Hintergrund und redaktionelle Seiteneinleitung umgesetzt.
- 1.579 Webtests bestanden. Nach abschließender Tastaturkorrektur zusätzlich 30 fokussierte Tests und 26 Browserprüfungen bestanden; TypeScript, geänderte Dateien im Linter und Diff-Prüfung fehlerfrei.
- Die unabhängige Prüfung fand zu schmale Klickflächen an kurzen Brotkrumen-Links. Reproduziert mit 18,67 px Breite, auf mindestens 44 × 44 px korrigiert; Browserregression und 5 Foundation-Tests grün, separate Nachprüfung ohne offenen Befund.
- Controller hat den Kopfbereich und geöffnete Menüs bei 1440 und 390 px visuell geprüft. Angebote bleiben unverändert: lokaler API-Ausgangswert 128; keine Änderungen an Quellen, Daten, Services oder APIs.
- Vollprojektprüfung: 140 Dateien bestanden, 3 native Bewerbungsdateien fehlgeschlagen; 3.058 Tests bestanden, 6 fehlgeschlagen, 15 übersprungen. In diesem Lauf fehlte die absolute QPDF-Testkonfiguration; zusätzlich liegt lokal Poppler 26.05.0 statt der verlangten 26.10.0 vor. Kein Nachweis aktiver oder freigegebener Bewerbungsverarbeitung.

## Prüfentscheidung

Die unveränderten nativen Bewerbungsprüfungen werden am Anfang und bei der Gesamtprüfung ausgeführt, nicht nach jeder rein visuellen Seitengruppe. Jede Gruppe erhält weiterhin die vollständige Websuite. Risiko dieser Bündelung: Eine versehentlich eingeschleuste native Änderung würde gegebenenfalls erst bei der Gesamtprüfung auffallen; deshalb wird zusätzlich der Diff aller ausgeschlossenen Daten-/API-/Servicebereiche kontrolliert.
