# Bewerbungsadresse und öffentlicher Funktionsstand

## Auftrag

Am 8. Oktober 2026 korrigiert der Betreiber den Empfänger für Bewerbungen und Unterlagen auf `info@trinkgut-jammers.de` und fragt nach dem tatsächlichen Live-Stand. Die allgemeine Marktadresse und Mietanfragen bleiben bei `jammers-goch@trinkgut.de`. Originalposter werden nicht verändert.

## Änderung

- Eigener Bewerbungsempfänger in `lib/application-contact.ts` statt Kopplung an den allgemeinen Marktkontakt.
- Bestehender Kontaktlink auf `/bewerbung` und Hinweis des pausierten `/api/bewerbung` verwenden die neue Adresse.
- Upload-Endpunkt bleibt HTTP 503 mit `Cache-Control: no-store`; keine neue Datenerhebung, automatische Sendung oder Zahlungsaktivierung.
- Betreiberentscheidungen, Jobs-Inhaltsvorbereitung und Datenschutzentwurf auf den neuen Empfänger abgeglichen. Postfachrechte nicht verändert oder identische Leserkreise unterstellt.
- Codecommit: `53c01a07ab0a074839a0df00e1683a39a77e2a48`.

## Lokale Prüfung

- Zwei erwartete rote Regressionstests vor der Änderung: gerenderter E-Mail-Link und tatsächliche JSON-Antwort zeigten noch die alte Adresse.
- Danach vollständige Suite: 77 Dateien, 1.277 Tests erfolgreich; ESLint, Next-Typgenerierung, TypeScript und alle 128 Original-Angebotsblöcke geprüft.
- `localhost:3000` HTTP 200; HTML und Browseransicht von `/bewerbung` zeigen den neuen Mailto-Empfänger, allgemeiner Footer-Kontakt unverändert.
- Unabhängige eingeschränkte Codeprüfung: keine kritischen oder wichtigen Befunde, acht gezielte Tests erfolgreich.
- Produktionsabhängigkeiten: `npm audit --omit=dev` meldet null bekannte Schwachstellen. Die unveränderten Entwicklungsabhängigkeiten melden weiterhin fünf hohe Befunde; keine erzwungenen Paketänderungen. Das ist keine umfassende Sicherheitszertifizierung.

## Live-Stand vor diesem Release

- `/`, `/angebote`, `/kontakt`, `/bewerbung` HTTP 200. Bewerbungsseite nur Kontaktseite ohne Stellenkarten oder Uploadformular.
- Kein aktiver Newsletter-Anmelde-/Versanddienst. Die vorhandene unbenutzte Mailto-Komponente ist kein laufender Newsletter.
- Mietbetrieb bleibt Anfragebetrieb: `enabled:false`, `testMode:false`, `onlinePayment:false`.
- DE-PDF und DE-Cover von Katalog `1390117` liefern weiterhin 404, ebenso die zugehörige Bildoptimierung. NL-PDF für 05.–10.10.2026 ist HTTP 200. Der freigegebene Wochenpaket-Plan ist noch nicht umgesetzt.
- Folglich ist die Gesamtliste der Aufträge **nicht** vollständig live oder fehlerfrei. Mailto-Verknüpfung ist kein E-Mail-Zustellnachweis.

## Server-Release

- Aktiviert am **8. Oktober 2026, 17:14:29 UTC / 19:14:29 Europe/Berlin**: `53c01a07ab0a074839a0df00e1683a39a77e2a48`.
- Aus Positivliste gebautes Git-Archiv lokal/Server SHA-256 identisch: `ec89f853bfa3a69dde9edc07385a1e6cdc72a92dac3b73b6e2485df32be3c91c`.
- Frisches Linux-Release als `jammers`: 77 Testdateien / 1.277 Tests, ESLint, Typgenerierung, TypeScript, 128 Originalangebote, Quellen-/Assetprüfung und Produktionsbuild mit 120 statischen Seiten erfolgreich.
- Root-eigener Release, nur Next-Cache beschreibbar. Bestehende systemd-Unit byteidentisch und validiert. Atomarer Wechsel, Bereitschaft nach einem anfänglichen Verbindungsfehler beim Neustart innerhalb der begrenzten Wiederholungsprüfung bestätigt.
- Vorheriger geprüfter Release `d93f932c69a097026624a56365bd58f2dba024a7` bleibt unverändert als Rückfallstand.
- Keine Änderung an DNS, Caddy, E-Mail-Konten oder Postfachrechten vorgenommen; keine echten E-Mails oder Bewerberdaten verwendet.

## Öffentliche Nachprüfung

- `/bewerbung` über HTTPS IPv4/IPv6 HTTP 200. Tatsächlicher Mailto-Link enthält `info@trinkgut-jammers.de`; allgemeiner Footer-Kontakt bleibt `jammers-goch@trinkgut.de`.
- Leere Ablehnungsprobe `/api/bewerbung` HTTP 503 mit neuem Info-Empfänger, kein Upload und keine Sendung. Mietkonfiguration weiterhin vollständig deaktiviert.
- `/` und `/angebote` HTTP 200; geschützter historischer Datenpfad 404. `www` leitet per 301 mit Pfad/Query auf die Hauptdomain, HTTP per 308 auf HTTPS.
- Öffentliche Browserprüfung in Desktop- und 390-Pixel-Mobilansicht: Kontaktbutton erreichbar, richtige Adresse im Link, kein Uploadformular behauptet. Screenshots unter `audit/screenshots/application-recipient-2026-10-08/`.
- Vollständiger HTTP-Prüflauf: 117 Seiten, 2.821 lokale Ressourcen, 26 API-Verträge und fünf unbekannte Routen. Zehn Fehler, ausschließlich die bereits bekannten zehn Auflösungen des externen DE-Covers; keine zusätzliche Fehlerklasse und keine Warnung. Nachweis lokal `/tmp/jammers-application-recipient-live-audit.json`. Gesamtlauf deshalb ausdrücklich nicht grün.
- Content-Lauf `2026-10-08T17-14-51-503Z-check-2a9c0c9a` bleibt wegen der bekannten externen DE-Dateien fehlgeschlagen; NL ist aktiv und geprüft. Der Lauf ist **kein** erfolgreicher Gesamt-Inhaltsnachweis. Seine generische Produktionsadresswarnung folgt der fehlgeschlagenen Gesamtprüfung; die konfigurierte öffentliche HTTPS-Adresse ist separat oben bestätigt. Rohbericht mit internen Quellenmetadaten bleibt außerhalb des öffentlichen Commits.
