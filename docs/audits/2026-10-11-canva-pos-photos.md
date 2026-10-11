# Canva-Fotoergänzung — 11. Oktober 2026

## Stand: alle ausgewählten Motive lokal umgesetzt, nicht veröffentlicht

### Ergänzung nach Personenfreigabe

Niko hat die offene Foto-Rückfrage mit „dürfen alle abgebildet werden“ beantwortet. Diese Freigabe gilt für die vier vorbereiteten Personenmotive der vorgelegten Collage; keine erneute Rückfrage und keine Identifizierung anhand von Gesichtern. Andere frühere Fotoausschlüsse bleiben bestehen.

- Startseite: Moritz-Fiege-Verkostung als Marktleben-Einstieg, weiterhin genau drei Entdeckungskarten.
- `/marktleben` → Menschen & Marktmomente: Moritz Fiege, Il Padrino und die Likör-Verkostung; vorhandene Fotos bleiben erhalten.
- `/marktleben` → Aufbauten & Entdeckungen: Almdudler ergänzt; Safari und Salitos bleiben. Der historische Gewinnspielhinweis ist ausdrücklich keine aktuelle Ankündigung. Keine Preise oder Aktionen aus Fotos in aktuelle Angebotsdaten übernommen.
- Vier Originalausschnitte unverändert aus der hochauflösenden Canva-Seite abgeleitet, natürliche Seitenverhältnisse ohne weiteren CSS-Beschnitt, keine generierten oder nachbearbeiteten Gesichter. Öffentlicher neutraler Dateiname `likoer-verkostung` vermeidet die unzutreffende frühere private Arbeitsbezeichnung „Boennecken“.
- Jetzt 20 geprüfte Canva-Assets. Alle 16 vorherigen Manifest-Einträge sowie ihre 32 PNG-/WebP-Dateien byteidentisch erhalten. Private Original-/Freigabebelege separat archiviert.

Prüfung dieser Ergänzung:

- TDD: vier erwartete rote Seiten-/Zuordnungsprüfungen und fehlende neue Asset-Datei vor Implementierung; anschließend 13/13 Rubrik-/Desktopfototests und 22/22 Assettests bestanden.
- Vollständige Webtests ohne private Laufzeitkopien und native Bewerbungsdienste: **108 Dateien / 1.904 Tests bestanden** (`NODE_ENV=test npm test -- --exclude '.superpowers/**' --exclude 'services/**'`). Die unten dokumentierten Grenzen der nativen Gesamtprüfung bleiben bestehen.
- TypeScript ohne Fehler; Lint 0 Fehler / 21 bestehende Warnungen außerhalb der Änderung. Assetcheck: alle 20 Ausgaben bestanden, vier neue WebPs jeweils unter 150 kB und ohne EXIF/XMP/ICC.
- Unabhängige Nur-Lese-Prüfung ohne kritische, wichtige oder kleinere Befunde; 30/30 fokussierte Tests und vollständiger Bestands-/Crop-/Hashvergleich. Ein erster ungefilterter Review-Test sammelte alte `.superpowers`-Kopien ein; sauber gefilterter Wiederholungslauf grün.
- Lokaler Browser: Startseitenlink führt nach Marktleben; alle vier neuen Bilder geladen, `object-fit: contain`, natürliche Proportionen auf Desktop und 390px Mobil; kein horizontaler Überlauf, auch im mobilen Startseiten-Einstieg. Temporäre Bildschirmgröße danach zurückgesetzt. Kurzer erster 3-Sekunden-HTTP-Check lief in ein Timeout; vorhandener korrekter Devprozess antwortete beim folgenden 20-Sekunden-Check mit 200, kein Neustart oder Codefix notwendig.
- Lokaler HTTP-Abgleich: beide geänderten Seiten mit 200 und neuen Bildpfaden im HTML; alle vier WebP-Dateien tatsächlich geladen, Typ/Größe/SHA-256 identisch mit den geprüften lokalen Ausgaben. Kein öffentlicher Live-Nachweis daraus abgeleitet.
- Keine Canva-Änderung, keine Betriebs-, Hosting-, Upload- oder Mailaktivierung. Öffentliche Veröffentlichung dieses Fotopakets bleibt ausstehend.

### Vorheriger Teillauf (Safari; unverändert dokumentiert)

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

Die Personenfreigabe ist inzwischen erteilt und umgesetzt. Weiterhin fehlt die separat angefragte Freigabe zur Entfernung zweier genau benannter alter Server-Releases (`077412ba…`, `9b9dd9a…`); keine eigenmächtige Speicherbereinigung. Ein neuer Linux-Release/Produktionsbuild und öffentlicher Abgleich wurden in diesem Fotolauf nicht ausgeführt. Lokal/Git ist kein Live-Nachweis. Die Veröffentlichung der Fotoergänzung ist daher noch offen.
