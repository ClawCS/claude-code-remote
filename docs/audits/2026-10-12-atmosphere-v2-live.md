# Atmosphärische Getränkewelt V2 – Live-Abnahme

## Freigabe und veröffentlichter Stand

- Betreiberfreigabe nach Betrachtung der lokalen V2: „ja geht doch, so ist top bring es live“.
- Öffentliche Origin: https://trinkgut-jammers.de
- Exakter App-Commit/Release: `49ecd0c1a12df98fe8272da2c0954d3d54f5d79c`.
- Bereitschaft bestätigt: **12.10.2026, 20:21:50 UTC / 22:21:50 Europe/Berlin**.
- Erhaltenes Rückrollziel: `2dbdcec46a092dfa6480343a186367616de208a2`.
- Kein weiterer Designumbau während dieses Veröffentlichungsauftrags. Umsetzung und lokale visuelle Abnahme: `2026-10-12-atmosphere-v2-local.md`.
- Dieser nachgelagerte Dokumentationscommit ist nicht die Runtime-ID; ein weiterer Build nur für diese Dokumentation ist nicht erforderlich.

## Paket und Linux-Qualifikation

Exakten Git-Commit mit Positivfilter archiviert, nicht die schmutzige Worktree. 1.712 Einträge, 377.284.697 Bytes, SHA-256 `37ecb8bd6343d8d678bdccece104bb5527bbdc265178c1ab7288bf60f965f6ec`. Neu im Positivfilter: ausschließlich `assets/source/eigenmarken-scenes/v2-provenance.json`; private V2-Generatororiginale bleiben ausgeschlossen. Keine `.env`, `.git`, Mac-Abhängigkeiten oder privaten `.superpowers`-Quellen übertragen.

- Frische vollständige lokale Websuite: **2.424 Tests / 132 Dateien bestanden**.
- Frische Linux-Webteilprüfung: **2.306 Tests / 125 Dateien bestanden**.
- Genau sieben Chromium-Testdateien vollständig lokal qualifiziert, nicht auf dem Server: `hero-film.test.tsx`, `own-brand-stage.test.tsx`, `category-atmosphere.test.tsx`, `shopping-provider-boundary.test.tsx`, `atmosphere.test.tsx`, `brand-world.test.tsx`, `atmosphere-family-layout.test.tsx` unter `lib/cinematic/__tests__/`.
- Native `services/applications`-Qualifikation und `.superpowers` ausdrücklich ausgeschlossen. Kein vollständiger Linux-Alltests-Erfolg behauptet, keine GUI-/Scannerpakete installiert.
- Linux Lint ohne Fehler, Next-Typegen, TypeScript und **210 Originalangebote samt Bildern** bestanden.
- Fünf neue öffentliche Hintergründe auf Linux anhand Manifest auf exakte Bytegröße/SHA-256, WebP-Format, 1536 × 1024 Pixel und vollständige Dekodierung geprüft.
- Frischer Produktionsbuild unter Linux bestanden; Build/Betrieb production, `RENTAL_MODE=disabled`, keine Testuhr.

## Umschaltung und Sicherheit

Vorheriges `current` sowie beide Build-IDs geprüft; neuer Release vor der Umschaltung root-eigen, nur Next-Cache für den Dienst beschreibbar. Atomarer Symlinkwechsel und Neustart ausschließlich der bestehenden Next-Unit. Begrenzte HTTP-Bereitschaftsprüfung: Mietbetrieb deaktiviert, Flyerstatus `ok`, keine Issues, DE und genau einseitige NL-Ausgabe vorhanden. Ein anfänglicher Connection-refused während des kurzen Neustarts wurde innerhalb des vorgesehenen Retryfensters erfolgreich aufgelöst.

Unabhängige Prüfung fand vor Aktivierung einen Fehler in der Shell-Fehlerweitergabe des temporären Aktivierungsskripts: `ready || …` kann `set -e` innerhalb einer Funktion unterdrücken. Jeder Bereitschaftsschritt propagiert jetzt Fehler ausdrücklich; Rückroll-Restart und Rückroll-Bereitschaft werden separat geprüft. Zwei unabhängige Simulationen der tatsächlichen Funktion: jeweils **5/5** Fälle bestanden (Erfolg und vier Fehlerpfade). Es war kein Fehler der Website. Runbook entsprechend präzisiert.

Neun bestehende Sicherheitskonfigurationsdateien vor Build, vor Umschaltung und danach hashgleich. Keine Caddy-/Unit-/AppArmor-/SSH-/DNS-/Mailkonfiguration geändert; kein Caddy-Neustart/daemon-reload. Keine echten E-Mails, Zahlungen, Bestellungen, Bewerbungen oder Löschungen ausgelöst. Bewerbung, Mietbestellung und Onlinezahlung bleiben gesperrt; vorhandene E-Mail-/WhatsApp-Anfragen unverändert.

Keine alte Serverversion gelöscht. Nur das eigene hochgeladene temporäre Archiv nach bestätigtem Hash und öffentlicher Medienprüfung entfernt. Laufender Release und vorherige Build-ID am Ende erneut bestätigt, Dienst `active`. Freier Platz um 20:27:09 UTC: **1.753.280.512 Bytes**; vor nächstem Release neu prüfen.

## Tatsächliche öffentliche Prüfung

Alle folgenden Prüfungen gegen die echte HTTPS-Origin und tatsächliche Produktionszeit, keine Zukunftsuhr:

| Kontrolle | Ergebnis |
| --- | --- |
| `content:check` | `ok`, keine Errors/Warnings; `websiteVerified` und `deploymentVerified` true |
| KW42 | DE und Agentur-NL, Originalgültigkeit 12.–17.10.2026, Originaldateien unverändert |
| Öffentliches HTTP-Audit | **294 Seiten, 2.590 lokale Ressourcen, 31 API-Verträge, fünf unbekannte Routen; null Fehler/Warnungen** |
| Gewinnspiel-Bildprüfung | **18 GET-/Dekodierprüfungen bestanden** |
| Exakte Medienauslieferung | **15 GETs**: fünf neue Szenen, sechs Originalflaschen, V6 Desktop/Mobil, Poster, Jammers-hilft-Symbol; Bytes/Typ/SHA-256 und Bilddekodierung bestanden |
| Unabhängiger Medienabgleich | Alle 15 Dateien zusätzlich gegen exakten App-Commit geprüft, keine Abweichung |
| Weiterleitungen | HTTP→HTTPS 308; www→Hauptdomain 301 mit unverändertem Pfad und Query |
| Schutz/Erreichbarkeit | Historischer Rohdatenpfad 404; `/api/bewerbung/config` und `/api/rentals/config` weiterhin disabled; HTTPS über IPv4 und IPv6 200 |

Contentlauf: `2026-10-12T20-22-27-300Z-check-c69304cd`. DE-PDF SHA-256 `a8dfe6b0a728982667ce83ac8eed0e527c6cf2b6d03dd7b10fcd857112f4f37e`, NL-PDF `b669c22d2e7bcb6466af9771cf68573f935312556db0d58e24db9a6e5bfe448d`.

Eine zusätzliche manuelle Probe verwendete zunächst fälschlich 308 statt der konfigurierten permanenten 301-www-Weiterleitung und einen nicht existierenden englischen Bewerbungs-Konfigurationspfad. Quellkonfiguration und tatsächliche Antwort belegt, nur die temporäre Testerwartung korrigiert. Anschließend sechs korrekte Routing-/Betriebsproben bestanden; keine Website- oder Serveränderung deshalb vorgenommen.

## Öffentliche Browserkontrolle und Grenzen

- Desktop 1440 px: Eigenmarkenwelt mit sechs Originalflaschen, Kollektion-Ankersprung, echte Weiterleitung zu Pralle Kirsche; neue Produktdetailansicht, Sortiment und orange NL-Landingpage. Keine horizontale Überbreite in den gemessenen Ansichten.
- Mobil 390 px: Pralle Kirsche, Vermietung, Akademie und Angebote; Menüs öffnen, Untermenü per Tastatur, tatsächliche Seitenwechsel und Schließen nach Navigation geprüft.
- Startseite: vollständige DE-/NL-Covers mobil untereinander, Desktop nebeneinander auf dem neuen roten Wochenkapitel sichtbar.
- Film: öffentliche V6-Mobilquelle `readyState=4`; Play/Pause per Enter funktioniert. Sichtbarer Buttontext leer, Ziel 44 × 44 Pixel, Fokus erhalten.
- Handzettel-Dialoge öffnen und schließen; Escape bringt Fokus zum Auslöser zurück. **Die eingebetteten PDF-Pixel waren im Codex-In-app-Browser als graue Fläche nicht visuell bestätigbar.** Deshalb kein visueller PDF-Renderer-Erfolg behauptet. Echte Original-PDF-GETs/Typen/Hashes und Coverdarstellung separat bestanden. Kein neuer App-Fehler daraus abgeleitet und keine spekulative Änderung vorgenommen.
- Vorherige **100/100 Produktionsbrowserfälle** gehören zur dokumentierten lokalen V2-Abnahme, nicht zu einer vollständigen öffentlichen Wiederholung. Öffentliche Kontrolle ist die hier genannte manuelle Stichprobe plus HTTP-Audit.
- Keine neue vollständige Rechts-/Barrierefreiheitszertifizierung und keine native Bewerbungs-/Mailqualifikation aus diesen Ergebnissen ableiten.

Unabhängige abschließende Review der öffentlichen Nachweise: kein bestätigter Releaseblocker oder Widerspruch zur Aussage, dass der freigegebene Designstand live ist.

## Belege und Sicherung

Eigene Laufdateien lokal unter `/private/tmp/jammers-atmosphere-v2-*`; frische öffentliche Screenshots im Codex-Visualisierungsordner `jammers-atmosphaere-v2`, Dateinamen `*-live-release-1440.png` bzw. `*-live-release-390.png`. Vorher-/Nachher-Aufnahmen des lokalen Auftrags bleiben erhalten. Fremde Screenshotänderungen, private Quellen und fremder Bewerbungs-Audit unangetastet. Ausschließlich dieser Bericht, die aktuelle Zustandsnotiz und die präzisierten Release-Anweisungen werden gesondert dokumentiert.
