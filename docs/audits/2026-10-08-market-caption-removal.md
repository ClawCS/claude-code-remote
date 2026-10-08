# Gezielte Entfernung von Marktbild-Beschriftungen

## Auftrag und Umfang

Betreiberanweisung vom 08.10.2026: Bildunterschriften wie „Rückblick 2025“, das Niko-Foto mit Reinigungshandschuhen/Sprühflasche und dessen Karte „Mit Herz. Und mit anpacken.“ entfernen.

- Dekorative Bildunterschriften auf Startseite, Marktleben, Geschenkideen, Eigenmarken und regionalen Spirituosen entfernt.
- Niko-Reinigungsfoto und Begleitkarte nicht mehr in aktiven Seitendaten; ursprüngliche Dateien und Herkunftsnachweise unverändert erhalten.
- NL-Hero zeigt unter dem Foto nur „Sven & Niko“, ohne Zusatzsatz.
- Mitarbeiternamen, Bildnachweise bei Cocktails, KI-Kennzeichnungen, Angebotsbedingungen und Gewinnspieldaten unverändert.
- Allgemeiner Hinweis zu nicht aktuellen Preisen in Marktfotos sowie Geschenk-Beispielhinweis bleiben erhalten. Keine Neugestaltung oder Änderung an Werbung, Vermietung, Newsletter oder Jobs.

## Lokale Prüfung

- Regression zuerst rot: Marktbild-Tests scheiterten an vorhandenen Beschriftungen und der siebten Marktleben-Abbildung; NL-Test scheiterte an zusätzlichem Satz unter den Namen.
- Danach 11 fokussierte Tests bestanden. Ein Testhilfsfehler (URL-Decodierung des gesamten HTML mit `% Vol.`) wurde auf rohe HTML-Prüfung begrenzt; keine Appänderung dafür.
- Vollständiger lokaler Testlauf vor der abschließenden NL-Zeilenentfernung: 75 Dateien / 1.254 Tests bestanden. Der vollständige Linux-Release-Testlauf wird separat unten dokumentiert.
- ESLint ohne Fehler, TypeScript ohne Fehler, `git diff --check` ohne Fehler.
- `offers:check`: unverändert 128 Originalangebote samt Bildern geprüft.
- Lokale HTTP-Prüfung aller sechs betroffenen Routen: HTTP 200, entfernte Inhalte nicht im HTML.
- Native Browserprüfung von Marktleben: sechs verbleibende Fotos, kein Reinigungsfoto oder entfernte Rückblick-Beschriftung.
- Unabhängige Read-only-Prüfung: keine wichtigen Probleme; NL-Zusatzsatz als ergänzender Fund ebenfalls entfernt und getestet.

## Bereitstellung

Vor Umschaltung ist Live-Release weiterhin `bce0e582b5b5137fc52f5a2d5d081c5c767c39b8`. Neue Veröffentlichung und öffentliche Nachweise folgen nach frischem Linux-Build. Die bekannten externen DE-Handzettel-404 sind ein separater, weiterhin offener Auftrag; dieser kleine Inhaltsrelease behauptet keine Behebung.
