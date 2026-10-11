# Canva-Fotoergänzung — 11. Oktober 2026

## Stand: veröffentlicht und öffentlich geprüft

- App-Release `f3a1cbdf782983973e7c458c0654fffbff7d1c75`, Umschaltung **11.10.2026, 14:43:35 UTC / 16:43:35 Europe/Berlin** auf `https://trinkgut-jammers.de`. Rückrollziel `8613344dca4aa2644e03dcf50b35a360e16dbab1` erhalten.
- Nach Nikos gesonderter Antwort „freigabe erteilt“ ausschließlich die vorher konkret angefragten inaktiven Releases `077412ba7211e94fc40de26f8f02f87325c85038` und `9b9dd9a87991a9a2cdd22927d9d3f64813ad991f` entfernt. Vorher Host, aktuelles Ziel, Rückfallversionen, Mounts und Prozessnutzung geprüft. Aktuelle und beide jüngsten Rückfallversionen blieben erhalten; keine weitere Releasebereinigung. Abschließend rund 3,8 GiB frei nach Entfernung des eigenen temporären Übertragungsarchivs.
- Sauberes Archiv ausschließlich aus dem geprüften Commit und der Runbook-Positivliste; SHA-256 `868fa1ff2cada34c86e6efd272df6287d067437c324b9a949a2336e8cffcfd08`. Keine privaten Rohquellen, Zugangsdaten oder fremden Arbeitsänderungen im Paket. Linux-Neubuild in neuem Releaseverzeichnis; laufendes `current` nicht editiert.
- Frisch lokal **108 Dateien / 1.904 Webtests** bestanden. Linux: **105 Dateien / 1.869 Webtests**, Lint, TypeScript, 210 Originalangebote samt Bildern, Asset-/Paketprüfung und Produktionsbuild bestanden. Die drei browserabhängigen Tests ausschließlich wie im Runbook auf Linux ausgeschlossen und lokal bestanden; native Bewerbungsdienste nicht als vollständig abgenommen ausgeben.
- Unabhängige Nur-Lese-Prüfung von App-Diff, Bestands-/Bildhashes, Archivweg und Umschaltskript ohne Releaseblocker. Mount-Inventar vor Löschung auf fehlgeschlagene Inventarisierung absichernd korrigiert. Vererbter Bash-ERR-Trap isoliert über einen absichtlich fehlgeschlagenen Funktionsaufruf geprüft; kein absichtlicher Produktionsausfall.

### Öffentlicher Nachweis und Bildoptimierer-Vorfall

Die erste öffentliche HTTP-Prüfung war grün, deckte aber einen anschließend visuell bemerkten Zustand einzelner AVIF-Bildgrößen nicht ab:

1. Almdudler und Likör-Verkostung bei Breite 360: AVIF-GET jeweils 30 Sekunden ohne Antwort; derselbe Almdudler-GET direkt gegen localhost 12 Sekunden ohne Antwort. Originaldatei 200 in 0,004 Sekunden, WebP-Variante 200 in 0,176 Sekunden, neue AVIF-Größe 390 in 0,449 Sekunden. Keine defekte Originaldatei und kein belegter Proxy-/DNS-Fehler.
2. Derselbe Prozesszustand war bereits im Atmosphäre-Release dokumentiert. Prozess-/Release-/Konfigurationszustand vor dem Eingriff aufgenommen; unabhängige Gegenprüfung bestätigte die Eingrenzung auf einzelne Optimierer-Schlüssel. Eine ungelöste gemeinsame Bildberechnung ist plausibel, aber **nicht als bewiesene Ursache ausgeben**. Ein gleichzeitiger `NoFallbackError` bei der HTTP-Prüfung beweist keinen Zusammenhang.
3. Ein kontrollierter Neustart ausschließlich der bestehenden Next-Unit, ohne Code-, Format-, Cache-, Caddy- oder Sicherheitsänderungen. Bereitschaft abgesichert, alter Release als Fehler-Rückfall vorhanden. Um **14:48:51 UTC** gleicher App-Release aktiv; beide zuvor hängenden lokalen AVIF-GETs 200 in 0,820 bzw. 0,227 Sekunden. Kurze Verbindungsablehnung unmittelbar nach Dienststart wurde durch die begrenzte Bereitschaftsprobe erwartungsgemäß aufgefangen.
4. Danach **33 tatsächlich geladene und dekodierte öffentliche AVIF-Varianten** bestanden: fünf neue Fotos in 360/768/1280 sowie sechs Originalflaschen in 256/360/640. Langsamste Anfrage 722 ms. Kein HEAD-Ersatz. Fünf öffentliche WebP-Dateien erneut mit Typ, Bytezahl und SHA-256 gegen lokal geprüft, identisch. Das ist eine Wiederherstellung des Betriebs, keine bewiesene dauerhafte Fehlerkorrektur; bei erneutem Stillstand Rückfall/gezielte Ursachenprüfung statt fortlaufender Neustarts.

Nach dem Neustart erneut:

- `content:check -- --url https://trinkgut-jammers.de`: grün, echte Berliner Sonntagszeit; regulär abgelaufene KW41 nicht als aktiv angezeigt.
- `content:check -- --week 2026-10-12 --url https://trinkgut-jammers.de`: grün, DE und De Maas Driehoek einschließlich öffentlicher Original-/Cover-/Kachelbindung für 12.–17.10.2026 geprüft; keine Testuhr und keine vorgezogene Aktivierung der 70 DE-/12 NL-Angebote.
- `audit:public`: **117 Seiten, 1.689 lokale Ressourcen, 31 API-Verträge, fünf unbekannte Pfade**, keine Fehler/Warnungen. 1.119 externe Links nicht abgerufen; kein Vollcheck fremder Websites behaupten.
- Browser 1440px/390px: Moritz-Fiege-Einstieg und Link zu `/marktleben`, neue Verkostungs-/Aufbautenfotos geladen, natürliche Seitenverhältnisse mit `contain`, kein horizontaler Überlauf. Film abspielen/pausieren, Desktop-/Mobilquelle, mobile Sortiment-Navigation und sichtbarer Tastaturfokus an der Flaschenbühne geprüft; alle sechs Originalflaschen auch im Mobilbrowser dekodiert. Reduced-motion-Verhalten war Teil der frisch bestandenen lokalen Chromium-Suite, nicht erneut öffentlich emuliert. Zwei zunächst unpassende Prüfselektoren korrigiert; keine App-Fehler daraus abgeleitet. Temporären Viewport zurückgesetzt.
- IPv4/IPv6 HTTPS jeweils 200; neun Sicherheits-/Dienstkonfigurationshashes identisch. Mietbetrieb `enabled:false`, `testMode:false`, `onlinePayment:false`; Bewerbung `enabled:false`, `mode:disabled`.
- `npm ci` meldete fünf hohe Audit-Pakete aus demselben bereits dokumentierten `braces`-Befund der ESLint-Entwicklungskette (Audit S-01). Paketdateien gegenüber vorherigem Live-Stand unverändert; frischer Produktions-Abhängigkeitsaudit ohne Advisory. Keine pauschale Sicherheitsfreigabe und kein automatisches Abhängigkeitsupdate.

Nur dieser Fotoumfang ist abgeschlossen. Native Bewerbungsqualifikation, andere Projektaudit-Befunde und bestehende Betriebsgrenzen bleiben offen/unverändert. Keine Canva-Änderungen, echten Mails, Bewerbungen, Zahlungen oder Löschläufe. Die beiden folgenden Abschnitte dokumentieren die lokale Vorbereitung und damalige Zwischenstände.

## Lokale Vorbereitung vor Veröffentlichung

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

## Historischer Freigabestand vor dem Live-Lauf

Beim Abschluss der lokalen Vorbereitung war die Personenfreigabe erteilt, die separate Release-Löschfreigabe noch ausstehend. Diese ist anschließend ausdrücklich erteilt und ausschließlich für die beiden benannten Releases umgesetzt worden. Der neue Linux-Release und die öffentliche Abnahme sind im aktuellen Stand oben dokumentiert; die frühere Veröffentlichungssperre dieses Fotopakets ist aufgehoben.
