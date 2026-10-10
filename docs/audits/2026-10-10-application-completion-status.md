# Bewerbungsablauf – Fortsetzung nach Auditfreigabe

Stand: 10.10.2026. Dies ist ein Fortschrittsbericht, **keine Betriebsfreigabe**.

## Auftrag und Grenzen

Niko hat die Korrekturliste des Projektaudits freigegeben und die Fertigstellung des Bewerbungsablaufs beauftragt. Der bestätigte Entwurf und die Freigabe für genau drei gekennzeichnete synthetische Testbewerbungen an `info@trinkgut-jammers.de`, eine kontrollierte Testkopie sowie deren gezielte Löschung bleiben gültig. Der Test darf erst nach bestandener technischer Sicherheitsprüfung erfolgen. Bestehende Postfachnachrichten bleiben unberührt. Keine neue fachliche Designfreigabe ist erforderlich.

## Tatsächlicher Ausgangszustand

- Arbeitsstand zu Beginn: `942ca5bb394032b2a921a6d3d72f59634615018d`, Branch `codex/cinematic-production`; 62 lokale Vorgängercommits noch nicht auf Origin. Fetch/FF-Abgleich meldete bereits aktuell. Fremde Screenshots und private Quellen werden nicht übernommen oder verworfen.
- Öffentliche Website auf `trinkgut-jammers-web-01`: Release `b2383232fb5dfdb3a25a96d01995d470b0a54889`. Die Informationsseite läuft; der Bewerbungsupload ist deaktiviert.
- Per vorhandener, streng hostgeprüfter SSH-Verbindung gelesen: Bewerbungsdienste, deren Benutzer/Verzeichnisse, Scanner und Rekonstruktionswerkzeuge sind noch nicht eingerichtet. Next besitzt keine Mail-Zugangsdaten; die vorgesehenen Credential-Verzeichnisse sind leer beziehungsweise fehlen.
- Server: 3.819 MiB RAM insgesamt, 2.815 MiB verfügbar beim Check, kein Swap; rund 14,4 GB freier Plattenplatz. Das ist kein Lasttest und kein Nachweis ausreichender Scannerreserve.
- Aktuelle Caddydatei stimmt mit der lokalen Deploymentvorlage überein: SHA-256 `fbdf74b2f94dedb319e885110e31179219a3b448f3d65f1018b503e5eeb038ef`. Sie überschreibt `X-Real-IP`, entfernt `Forwarded`; Next lauscht nur auf `127.0.0.1:3000`. Die noch nicht eingerichteten Bewerbungsports sind nicht geöffnet.

## Verifikation und Bearbeitung

- `npm audit --omit=dev --json --ignore-scripts`: keine gemeldeten Produktionsabhängigkeits-Advisories. Das ist keine allgemeine Sicherheitsgarantie.
- Korrekturen H1/H2 und ursprünglicher Löschablauf: Implementierungsstand `e3b7cbc`, 2.855 Tests in 130 Dateien vor zwei späten eng begrenzten Korrekturen; danach 281 betroffene Tests in sechs Dateien sowie Backendbuild, TypeScript und scoped Lint bestanden. Das unabhängige Review fand einen fehlenden erneuten physischen Abschlussnachweis nach Phasenwechsel. Korrektur `38c5829` prüft die tatsächliche aktuelle Nichtzugänglichkeit erneut; sieben neue Regressionen und 288 betroffene Tests in sechs Dateien bestanden, unabhängige Nachprüfung freigegeben. Kein erfundener vollständiger Nachlauf nach diesen Korrekturen. Weitere Fristen-/Restoreintegration und die tatsächlichen Linux-Nachweise bleiben offen.
- Korrekturen M1–M7/N1/N2 an Quiz, Planung, Darstellung und Metadaten: `b2ca9bb`, 39 fokussierte Unit- und 20 Browsertests bestanden, unabhängiges Review ohne konkreten in-scope Befund. Kein Redesign. Die anschließende lokale Produktionskompilierung ist erfolgreich.
- M6: Sechs zusätzliche Chromium-Prüfungen gegen den lokalen Produktionsserver, jeweils echte und eingefrorene aktuelle Angebotsantwort bei 320/390/1440 Pixeln. Beobachter vor Navigation, nachgewiesener erfolgreicher Angebots-GET, im eingefrorenen Fall nachgewiesene Interception, keine Seitenfehler, geladene Schriften und mindestens drei Sekunden Beobachtung ohne Eingabe. Gemessene Verschiebungssummen je Breite: 0,02660 / 0,000162 / 0,001585, jeweils unter 0,1 und ohne horizontalen Überlauf. Ein Reviewhinweis auf einen zunächst fehlenden Refresh-Nachweis wurde im Test korrigiert und alle sechs Fälle erneut bestanden. Dies sind lokale Beobachtungen, keine Felddaten oder Live-Veröffentlichung.
- Korrekturen M8/M9 an begrenzten Miet-Clientlimits und Ausschluss generierter Builddateien aus Lint: `2a05422`, fokussierte Tests und unabhängiges Review bestanden. Mietbetrieb bleibt deaktiviert.
- N3: `braces@3.0.3` ist weiterhin die Registryversion; Advisory `GHSA-vfj7-8cjw-p6xm` nennt noch keine korrigierte Version. Der Befund betrifft die Entwicklungskette, nicht die ausgelieferten Produktionsabhängigkeiten. Keine ungeprüfte Zwangsaktualisierung.
- N4: striktere Script-CSP bleibt ein eigener Härtungsschritt. Die mitgelieferte Next-16-Dokumentation verlangt für requestgebundene Nonces dynamisches Rendering; eine bloße Entfernung von `unsafe-inline` würde die vorhandene Hydration nicht nachweislich erhalten. Kein voreiliger globaler Headerwechsel.

## Noch notwendige Betriebsnachweise

1. Vollständige geprüfte Integration von Fristen-/Restoreablauf, Verwaltung, öffentlichem Formular und Linux-Betriebspaket.
2. Tatsächlicher Linux-Scan/Rekonstruktions- und Ressourcen-/Rechtetest, ohne aktuelle Website zu beeinträchtigen.
3. Tatsächliche SMTP-/IMAP-Qualifikation mit dem inzwischen sicher hinterlegten Postfachpasswort. Eine vorhandene verschlüsselte Credential-Datei ist noch kein Anmelde-/Zustellnachweis.
4. Verlässlicher maximaler Restorezeitraum und unabhängiger aktueller Löschstand; keine Behauptung automatischer Bereinigung externer Kopien oder beliebiger Anbieterbackups.
5. Persönliche Verwaltungseinrichtung für Niko einschließlich zweitem Faktor und sicherer Recovery.
6. Begrenzter freigegebener Drei-Mail-Pilot, gezielte Testlöschung und synthetische Restoreprobe.
7. Frischer geprüfter Linux-Release, aktive Form-/API-Abnahme über HTTPS und erneute Kontrolle der bestehenden Website.

Hetzners Browsersitzung ist wieder angemeldet. Vorhanden sind die Backups vom 08.10.2026 und 09.10.2026; manuelle Snapshots existieren laut Übersicht nicht. Sieben rotierende Backup-Slots belegen keinen festen maximalen Kalender-Restorezeitraum.

### Tatsächlich ausgeführte Einrichtung, 10.10.2026

- Niko bestätigte die Erweiterung CX23 → CX33 mit unveränderter Festplatte/IP und kurzer Unterbrechung. Sichtbares Angebot: 5,49 → 8,49 €/Monat netto, bestehende Backups zusätzlich 20 %, also **3,60 €/Monat netto Mehrkosten**. Geordnet heruntergefahren, ausschließlich CPU/RAM skaliert; Hetzner meldet „Servertyp geändert“ und startete die VM anschließend wieder.
- Um 06:37 UTC / 08:37 Europe/Berlin bestätigt: 4 CPUs, 7.751 MiB tatsächlich sichtbarer RAM, unveränderte Disk mit 40.961.572.864 Bytes; `caddy` und `trinkgut-jammers` aktiv. Öffentliche HTTPS-Startseite HTTP 200 mit bestehenden Sicherheitsheadern. IPs und Release `b2383232fb5dfdb3a25a96d01995d470b0a54889` unverändert. Kein Bewerbungsdienst aktiviert, kein DNS-Wechsel.
- Niko hat das Postfachpasswort selbst über das verdeckte Terminalscript eingegeben und „Passwort sicher hinterlegt“ bestätigt. Vor und nach Neustart ausschließlich Metadaten geprüft: reguläre Credential-Datei, root:root, 0600, genau ein Hardlink; Verzeichnis root:root 0700. Kein Passwort oder Passwort-Hash ausgelesen, kein Klartext in Chat/Repository/Argumenten. Verfahren und Grenzen: `deploy/hetzner/applications/MAILBOX-CREDENTIALS.md`, Commit `592642b`.
- Diese Schritte sind **kein** Scanner-Lasttest, Mail-Anmeldenachweis, Versand-/Löschtest oder Upload-Livefreigabe. Kein SMTP-/IMAP-Zugriff und keine Nachrichten oder Löschungen ausgelöst. Unabhängiger Löschspeicher und tatsächlicher Restorehorizont bleiben ungeklärt; die Servererweiterung genehmigt keine zusätzliche Speicherbuchung.

### Weitere bestätigte Betriebsentscheidungen

- Nach separater Frage genehmigt Niko 10 GB getrennten Hetzner-Speicher bis 0,70 EUR/Monat inklusive Mehrwertsteuer **nach bestandener Eignungsprüfung**. Noch nicht gebucht; Snapshot-Unabhängigkeit allein belegt keinen vollständigen sicheren Journalbetrieb.
- Minimale operative Sicherheitsvermerke dürfen bei offenem Fall oder begründeter Ausnahme bestehen bleiben, anschließend für den belegten maximalen Wiederherstellungszeitraum plus 30 Tage. Dies verlängert weder Dokument- noch Bewerberkontaktfristen und erlaubt keine unbegrenzte Ereignishistorie.
- Die Auskunft zu IONOS-Wiederherstellungszeitraum und eventuell aktiver Archivierung holt Niko selbst ein. Es erfolgt keine Supportanfrage durch Codex. Der Zeitraum wird nicht geschätzt.
- Anmelde-HTTP-Endpunkte lokal mit 59 fokussierten Tests und unabhängiger Gegenprüfung geprüft, Commit `2abca4d`; vollständige Verwaltung und Linux-Aktivierung bleiben davon getrennt.
- Linux-Werkzeuge tatsächlich vorbereitet: QPDF 12.4.2 und Poppler 26.10.0 unter `/opt/trinkgut-document-tools`; gepinnte Originalarchive vor Entpacken geprüft, begrenzter nativer Build erfolgreich. ClamAV 1.5.4 installiert und Signaturen einmal aktualisiert, Standarddienste ausdrücklich weiterhin maskiert/inaktiv. Detailnachweis: `deploy/hetzner/applications/DOCUMENT-TOOLS.md`. Kein Dokumentverarbeitungs-/Scanner-Praxistest oder Mailzugriff daraus abgeleitet. Bestehende Website während und nach dem Build HTTPS 200.
- Das unabhängige Formularreview fordert noch vier gezielte Korrekturen: Retry-After bei fehlerhaftem Antwortinhalt bewahren, ausschließlich echte Zeichenketten für Protokollwerte zulassen, Tastatur-/Feldfehlerführung vervollständigen und den genehmigten Dokumenthinweis präzisieren. Korrekturschleife aktiv; noch keine Formularfreigabe.

## Unabhängige Wochenwerbung

Der zuvor ausgelöste Tagescheck war erfolgreich: Run `2026-10-10T05-48-15-667Z-check-bddc3138`, aktuelle Berliner Zeit, Zielwoche 05.–10.10.2026. Beide Original-PDFs und Covers sowie alle 128 Angebotskacheln wurden öffentlich auf Typ, Größe und SHA-256 geprüft. Die lokale Originalprüfung bestätigt DE mit 18 Seiten/107 Kacheln und NL mit genau einer Seite/21 Kacheln. Keine Contentänderung oder neue Veröffentlichung notwendig. Dieser Erfolg sagt nichts über die noch ausstehende Bewerbungsaktivierung aus.
