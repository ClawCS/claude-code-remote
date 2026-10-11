# Canva-Fotoergänzung — 11. Oktober 2026

## Stand: teilweise lokal umgesetzt, nicht veröffentlicht

Auftrag: Weitere Bilder aus der vorgelegten Point-of-Sale-Collage passend in die bestehende Website aufnehmen. Kein Designumbau, keine Änderungen in Canva.

- Originalseite im angemeldeten Canva-Browser in hoher Auflösung exportiert; privater Herkunftsnachweis und fünf vorbereitete Einzelmotive vorhanden.
- Neuer personenfreier Safari-Bildausschnitt ohne das alte Preis-/Aktionsschild lokal eingebunden: Startseite → Marktleben-Einstieg sowie `/marktleben` → Aufbauten & Entdeckungen.
- Salitos war bereits eingebunden und bleibt erhalten.
- Drei Verkostungsfotos und der Almdudler-Aufbau sind privat vorbereitet. Noch offen: konkrete Betreiberbestätigung zur Veröffentlichung der Personenfotos und dass weder Harpe noch Justin darauf zu sehen sind. Keine Gesichtserkennung oder neue Identitätszuordnung.
- Bestehende 15 Canva-Ausgaben samt Quellen und Hashes unverändert; mit Safari jetzt 16. Keine Änderungen an Handzetteln, Angeboten, Team, Betriebsfunktionen oder Hosting.

## Prüfung

- Fotoeinbindung TDD: vier erwartete rote Zuordnungs-/Anzahltests vor Implementierung, anschließend 12/12 fokussierte Seiten-/Bestandsprüfungen bestanden.
- Asset-Erweiterung: fehlende Safari-Ausgabe zunächst rot, danach vollständiger Hashabgleich grün.
- Zwei Builder-Regressionen mit Rot/Grün-Nachweis: aktuelle Reviewmetadaten statt festem historischen Datum; unvollständige private Importliste darf keine bestehenden öffentlichen IDs entfernen. Fokussiert 21/21 Assettests bestanden.
- Ein lokaler Vorbereitungslauf aus der historischen Teilliste hatte neun spätere Gewinnspielassets entfernt. Ausschließlich diese eigenen Änderungen wurden vollständig aus HEAD wiederhergestellt und die Manifestlisten bewahrend zusammengeführt. Der neue Guard verhindert die Wiederholung. Kein Live-Zwischenstand.
- `npm run assets:market:check`: alle 16 Ausgaben mit SHA256, Dimensionen, Metadatenentfernung und Größenlimit bestanden. Safari: 660×627, 101.222 Byte.
- `NODE_ENV=test npm test -- --exclude '.superpowers/**' --exclude 'services/**'`: 108 Dateien, 1.902 Tests bestanden.
- Lint: 0 Fehler, 21 Warnungen ausschließlich außerhalb der bearbeiteten Dateien. TypeScript ohne Fehler.
- Unbeschränktes `NODE_ENV=test npm test` ebenfalls gestartet, aber nicht grün: es sammelte zusätzlich veraltete private Laufzeitkopien/Playwright-Dateien und native Bewerbungsdiensttests ein. Nach rund 75 Sekunden kontrolliert beendet. Sichtbare Fehler: `parser-process.test.ts` (Inspect-Operation und fünf ungültige Operationsvarianten), `file-validation.test.ts` (Sammlung), `custody-erasure.test.ts` (Iterator-Zeitgrenze, auch in privater Kopie); private Playwright-Specs meldeten 0 Tests. Nicht als gesamtes Projekt bestanden ausgeben; Bewerbungsqualifikation ist nicht Umfang dieser Fotoänderung.
- Lokaler Browser: Startseite und Marktleben-Foto laden; Desktop und 390px Mobil ohne horizontalen Überlauf, natürliche Bildproportionen und keine Preisbeschriftung. Temporären Viewport zurückgesetzt.
- Unabhängige Nur-Lese-Prüfung: keine kritischen/wichtigen Befunde im Safari-Teilumfang; alle 15 bisherigen Einträge und sämtliche 16 Dateipaare unabhängig gehasht.

## Offen vor Veröffentlichung

Vier Personenmotive brauchen die bereits gestellte konkrete Bestätigung. Außerdem fehlt weiterhin die separat angefragte Freigabe zur Entfernung zweier genau benannter alter Server-Releases; keine eigenmächtige Speicherbereinigung. Ein neuer Linux-Release/Produktionsbuild und öffentlicher Abgleich wurden in diesem Fotolauf nicht ausgeführt. Lokal/Git ist kein Live-Nachweis. Der vollständige Bilderauftrag ist daher noch nicht abgeschlossen.
