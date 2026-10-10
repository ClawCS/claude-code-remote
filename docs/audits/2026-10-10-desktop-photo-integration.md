# Desktop-Fotointegration · 10.10.2026

## Umfang und Freigaben

17 Motive aus dem vom Betreiber bereitgestellten Desktopbestand: sechs Marktaufnahmen, fünf Gewinnübergaben, drei Stellenanzeigen, zwei Produktplakate und ein Gas-Tauschplakat. Auswahl und Ausschlüsse in der zugehörigen Spezifikation. Keine behauptete Canva-Herkunft. Eintrittskarten auf IMG_6942 betreffen laut Betreiber eine vergangene Veranstaltung.

IMG_7783 wurde nach vollständiger Sichtprüfung ausgeschlossen: Tabakwaren, kein TCG-Regal. Private und ungeklärte weitere Bilder bleiben unveröffentlicht. Originaldateien auf dem Desktop bleiben unverändert.

## Aufbereitung

Echte Fotos ausschließlich orientiert, proportional verkleinert und von Metadaten befreit. Beim Spezi-Screenshot nur äußere schwarze Balken entfernt. Quellen: sRGB-JPEG, maximal 1200×1400. Derivate: WebP, Fotoqualität 82 / Plakatqualität 90, effort 6, keine Vergrößerung oder Motivbeschneidung; Budget <350 KB / <500 KB. Vollständige Bild- und Dateihashes im bereinigten Manifest unter `assets/source/user-market-photos/manifest.json`; private Originalhashes separat im ignorierten Arbeitsbereich.

Die drei Stellenplakate sind mit dem eingebauten Bildgenerator bearbeitet. Niko akzeptiert die dabei entstandenen leichten Veränderungen der KI-Personen ausdrücklich. E-Mail in allen drei Anzeigen: info@trinkgut-jammers.de. Übrige Texte und Telefonnummer geprüft; Ausbildungs-QR entspricht weiterhin dem Originalziel. Keine Behauptung einer pixelidentischen Textkorrektur oder echter Mitarbeiterdarstellung.

Verwendeter identischer Bearbeitungsprompt, Modus: Edit eines vorhandenen Bildes, eingebauter Bildgenerator:

> Use case: text-localization. Image 1 is the edit target: an existing Trinkgut Jammers recruitment poster. Replace ONLY the email address below "Mail:" from "jammers-goch@trinkgut.de" to exactly "info@trinkgut-jammers.de". Match its existing white narrow sans-serif lettering, location, alignment and size, adapting only this single email line enough to fit. Preserve every other word, number, typography, color, logo, photograph, person, face, body, pose, clothing, texture and layout. Preserve any QR code exactly, unchanged and scannable. Keep the full original poster, no cropping, no added border, no resizing of separate components, no redesign. The only intended visible difference is this single email text replacement. Output one complete updated poster.

Die tatsächliche Ausgabe weicht über das gewünschte Textfeld hinaus ab; die nachträgliche Betreiberfreigabe bezieht sich genau darauf.

## Prüfstand

Task 1: 28 fokussierte Tests bestanden; Assetprüfung reproduziert alle 17 WebP-Dateien im Speicher, validiert SHA-256, Maße, Metadaten und öffentliche Dateiliste. RED vor Implementierung nachgewiesen. Datenvertrag deckt alle 17 Motive ab. Zwei Kontaktbögen der endgültigen Derivate visuell geprüft.

Task 2 lokal: Platzierungs-Tests erst 7 fehlgeschlagen / 10 bestanden, danach 17/17 bestanden. Gesamtsuite mit den vorhandenen gepinnten lokalen PDF-Testwerkzeugen: 3.135 Tests in 141 Dateien bestanden (247,84 s). Lint, Routentypen, TypeScript, Prüfung aller 128 Originalangebote und Produktionsbuild bestanden.

Browserkontrolle bei 390 und 1440 Pixeln: drei vollständige Stellenplakate, fünf Gewinnübergaben, 15 Marktleben-Motive insgesamt; kein horizontaler Überlauf, sichtbarer Tastaturfokus. Plakatlinks öffnen vollständige lokale Motive. Ein paralleler Entwicklungs-/Buildlauf verursachte vorübergehende Fehler in einem alten lokalen Entwicklungschunk; die getrennt gestartete Produktionsansicht auf Port 3106 zeigte keine neuen Browserfehler. Keine Formulare abgesendet.

## Unabhängige Prüfung

Ein separater Reviewer prüfte den gesamten Bereich `21318c3..40b58c3`: keine kritischen, wichtigen oder kleineren offenen Befunde. Zusätzlich 45 fokussierte Tests, die 17-Bilder-Prüfung, Archivfilter und QR-Abgleich unabhängig bestätigt. Kein Korrekturdurchlauf erforderlich.

## Veröffentlichung und öffentlicher Nachweis

- App-Commit / Release: `40b58c38b28cf840a0d94633cf12a94fd7da6c54`.
- Umschaltung: 10.10.2026, 10:46:22 UTC / 12:46:22 Europe/Berlin.
- Rückrollziel unverändert erhalten: `ef95c0204c2679660ed0fca684ebb5e81069a603`.
- Frisches Git-Archiv mit 17 öffentlichen Derivaten und 18 bereinigten Quelldateien einschließlich Manifest; Archiv-SHA-256 `845dad2c2b5ed65aec1681322166c60dbd36f8e278e61952f8ebcd8b511b0589`.
- Linux: Node 22.23.3, 1.556 Webtests in 93 Dateien bestanden; Lint, TypeScript, 128 Originalangebote und Produktionsbuild bestanden. Keine nativen Bewerbungs-/Scannerarbeiten auf dem Server.
- Nur Next-Release atomar gewechselt und Next neu gestartet. Erste Bereitschaftsprobe traf den erwarteten kurzen Neustart; der begrenzte Wiederholungsversuch bestätigte anschließend HTTP-Bereitschaft und deaktivierte Miet-/Bewerbungsfunktionen.
- `https://trinkgut-jammers.de`: alle 17 Dateien tatsächlich heruntergeladen, HTTP 200, WebP-Typ, Bytezahl und SHA-256 identisch zum lokalen Manifest. Vier betroffene Seiten enthalten die erwarteten Motive. Bewerbungs-Konfiguration weiterhin deaktiviert mit genau zwei bestehenden API-Stellen.
- `content:check`: Status ok, keine Fehler/Warnungen, websiteVerified und deploymentVerified true; beide aktuellen Wochenpakete weiterhin gebunden und geprüft.
- `audit:public`: 117 Seiten, 2.969 lokale Ressourcen, fünf unbekannte Routen und 31 API-Verträge; null Fehler und null Warnungen. Keine externen Links abgerufen, keine echten Formulare oder authentifizierten Aktionen ausgelöst.
- Live-Browser: vollständige Stellenplakate bei 1440px; Gewinnmomente und Gaswerbung bei 390px, kein horizontaler Überlauf. Temporäre Viewport-Änderung anschließend zurückgesetzt. Neue Bilder erfolgreich geladen.
- Caddy-SHA-256 vorher/nachher: `fbdf74b2f94dedb319e885110e31179219a3b448f3d65f1018b503e5eeb038ef`; Next-Unit: `e9d9ba135d9e7f70119ccae175f12bedd64337c083e7efff0a96d1ad22cb1dfa`.

Vorbereitung, Git-Sicherung und öffentlicher Betrieb sind damit getrennt nachgewiesen. Dieser Dokumentationsnachtrag ändert den genannten App-Release nicht. Screenshots, rohe technische Prüfberichte und private Quellenbelege bleiben im ignorierten Arbeitsbereich `.superpowers/desktop-photos-2026-10-10/`.

## Bewusste Abgrenzungen

- Tabakfoto statt TCG: ausgeschlossen; dadurch ein Motiv weniger, keine falsche Rubrikzuordnung.
- Leichte Änderungen der KI-Anzeigenpersonen ausdrücklich akzeptiert; keine Pixelidentität behauptet. Echte Fotos nicht generativ geändert.
- Personenfreigaben und aktuelle Gas-/Stellenwerbung beruhen auf den Betreiberbestätigungen. Keine Gesichtserkennung oder unabhängige Preiszusage; bei geänderten Tatsachen ist redaktionell zu korrigieren.
- Ausbildungs-QR-Ziel unverändert und dekodierbar; der externe WhatsApp-Kanalbetrieb wurde nicht getestet. Ein dort bereits bestehendes Problem wäre hiervon nicht behoben.
- Linux-, öffentliche und Browserprüfung gesondert durch den Hauptbearbeiter durchgeführt, nicht aus Code-Review abgeleitet.
- Fremde Screenshots und der fremde Bewerbungs-Audit bleiben unberührt. Der getrennte Bewerbungsablauf bleibt wegen der ausgesetzten Sicherheitsintegration unvollständig. Keine zurückgestellten kleineren Reviewbefunde.

## Unveränderte Betriebsgrenzen

Bewerbungsupload, Scanner-/AppArmor-Konfiguration, Mail, Zahlungen und Löschung werden durch diesen Fotorelease nicht aktiviert oder geändert. Keine echten Formulare abgesendet. Wochenangebote, Teamdarstellung und GrailBid bleiben inhaltlich unverändert.
