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

Release `b0812f7592046b5fcc846ef166b08e710f4e0311` ist seit **15:55:44 UTC / 17:55:44 Europe/Berlin** auf dem bestätigten Host `trinkgut-jammers-web-01` aktiv. Unveränderter Rollback-Release: `bce0e582b5b5137fc52f5a2d5d081c5c767c39b8`. Archiv-SHA-256 lokal und auf dem Server: `cd52d9f3b747f8ba6c3358ddd9da5d458036d9dd37e97550b05a8e4d09c1614b`.

Frische Linux-Installation als `jammers`, Node 22.23.3: **75 Testdateien / 1.255 Tests bestanden**, Lint, Typegen, TypeScript, alle 128 Original-Angebotsbilder und Produktionsbuild mit 120 Seiten erfolgreich. Produktionsabhängigkeitsaudit ohne bekannte Befunde; die fünf bekannten hohen Befunde in Entwicklungsabhängigkeiten bleiben unverändert. Keine Abhängigkeiten geändert. Root-eigener Release, ausschließlich Cache schreibbar; Servicekonfiguration identisch, keine Proxy-/DNS-/Mailänderungen. Nach Neustart war der erste Bereitschaftsaufruf erwartungsgemäß vor dem Start, der begrenzte Wiederholungsaufruf erfolgreich.

## Öffentliche Abnahme

- Alle sechs betroffenen HTTPS-Routen liefern 200; entfernte Texte und Bildreferenz fehlen auch im ausgelieferten HTML.
- `/api/rentals/config`: `enabled:false`, `testMode:false`, `onlinePayment:false`.
- IPv4/IPv6 auf Marktleben: jeweils 200. `www` leitet mit 301 auf dieselbe Hauptdomain-Route, HTTP mit 308 auf HTTPS.
- Native Live-Browserprüfung: Startseite bei 1440 × 900 mit drei vollständig geladenen, unverzerrten Bildkarten und null dekorativen Bildunterschriften; Marktleben bei 390 × 844 mit sechs Fotos, null dekorativen Bildunterschriften und ohne Niko-Reinigungsfoto. Kein horizontaler Überlauf. Temporäre Viewport-Änderung zurückgesetzt.
- Nachweise: `audit/screenshots/market-caption-removal-2026-10-08/home-live-desktop.png` und `marktleben-live-mobile.png`.
- Aktualisierte Playwright-Spezifikationen: 30 Tests gesammelt (`--list`), nicht als ausgeführter Playwright-Lauf deklariert. Visuelle Abnahme erfolgte separat im nativen Browser.
- `content:check` bleibt fehlgeschlagen: die bekannten externen DE-PDF-/Vorschaulinks liefern weiterhin keine Datei. Beide Ausgaben sind in Metadaten aktiv, NL lokal geprüft; der allgemeine Content-Veröffentlichungsnachweis ist deshalb nicht erfolgreich. Dieser Inhaltsrelease behebt keine Handzettel-Anbindung. Rohbericht verbleibt lokal, ohne interne Canva-Identitäten neu in Git aufzunehmen.
- Vollständiger öffentlicher HTTP-Audit: 117 Seiten, 2.821 lokale Assets, 26 API-Verträge und fünf unbekannte Pfade geprüft. Zehn Fehler, ausschließlich die bereits bekannten DE-Vorschau-404 in verschiedenen Bildgrößen; kein weiterer gemeldeter Fehler. Gesamtprüfung daher ausdrücklich nicht grün. Rohnachweis: `/tmp/jammers-caption-live-http-audit.json`.
