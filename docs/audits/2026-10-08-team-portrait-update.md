# Team-Einzelprofile — 08.10.2026

## Umfang

Auf Betreiberanweisung ein Einzelprofil aus den sichtbaren Sammlungen entfernt. Die Seiten `/`, `/galerie` und `/nl` zeigen sieben Einzelportraits und weiterhin das Gruppenfoto. Andere Profile, Bilddateien/Quellenarchiv und Layout unverändert. Keine Änderungen an Canva, Instagram, Mietbetrieb oder Social-Links.

## Prüfung

- Test-first: Die geänderten Anforderungen scheiterten zunächst in sieben Assertions an der noch enthaltenen Person beziehungsweise den bisherigen Bildzahlen.
- Lokal: 75 Testdateien / 1.252 Tests bestanden; ESLint, Next-Typgenerierung, TypeScript und `git diff --check` bestanden.
- Drei bestehende E2E-Verträge angepasst; 40 Tests erfolgreich eingelesen (`--list`, kein E2E-Browserlauf behauptet). Unabhängiger Review bestätigt nach Korrektur der veralteten E2E-Erwartungen keine weiteren Findings.
- Lokaler laufender Server: `/`, `/galerie`, `/nl` jeweils HTTP 200, zurückgenommenes Einzelprofil nicht im HTML, Gruppenfoto erhalten.
- Linux-Neubuild: `npm ci --include=dev`, erneut 75/1.252 Tests, Lint, Typegen, TypeScript, 128 Original-Angebotskacheln und Produktionsbuild bestanden. Produktionsabhängigkeiten: `npm audit --omit=dev` ohne Befund; Installation meldete weiterhin fünf bekannte hohe Befunde in Entwicklungsabhängigkeiten, keine Abhängigkeiten geändert.

## Veröffentlichung

- App-Commit: `bce0e582b5b5137fc52f5a2d5d081c5c767c39b8`, auf GitHub gepusht.
- Positiv gefiltertes Commit-Archiv, SHA-256 `3d8797fef0414383e3c9782cb1bac037cb5262fd4066abeb1017b2548fa3622c`, vor Auspacken auf dem Server abgeglichen. Keine Umgebungsdateien/private Exportordner.
- Neuer Linux-Release auf dem bestehenden bestätigten Hetzner-Host; atomarer Wechsel und Bereitschaft erfolgreich am 08.10.2026 um 14:47:46 UTC. Der erste Bereitschaftsversuch während des Neustarts wurde regulär wiederholt; anschließend HTTP erfolgreich und Dienst aktiv.
- Vorheriger Release `077412ba7211e94fc40de26f8f02f87325c85038` bleibt für Rollback erhalten. Keine DNS-, Caddy-, Mail- oder Sicherheitskonfiguration geändert.
- Öffentliches HTTPS: `/`, `/galerie`, `/nl` jeweils HTTP 200; Einzelprofil im gelieferten HTML abwesend, Gruppe vorhanden. Mietkonfiguration weiterhin `enabled:false`, `testMode:false`, `onlinePayment:false`.
- Teamgalerie im Browser auf Desktop (1280 px) und Mobil (390 px) geprüft: korrekte sieben Beschriftungen, keine horizontale Überbreite. Temporäre Ansichtsgröße zurückgesetzt.
- Eigene Nachweise: `audit/screenshots/team-portrait-update-2026-10-08/galerie-live-desktop.png` und `galerie-live-mobile.png`. Fremde Screenshots und private Quellen unverändert erhalten.
- Erneuter öffentlicher HTTP-Audit: 117 Seiten, 2.828 lokale Asset-URLs, fünf unbekannte Routen und 26 API-Verträge geprüft. Genau die zehn bereits bekannten `asset-status`-404 des externen DE-Covers in verschiedenen Bildgrößen bleiben bestehen; keine weiteren Findings. Laufbericht lokal unter `/tmp/jammers-team-release-live-audit.json`. Der Gesamt-Audit bleibt daher ausdrücklich fehlgeschlagen, während die Profilabnahme bestanden ist.

Der bekannte Ausfall der externen deutschen Handzettel-Dateien wird durch diese reine Profiländerung nicht repariert. Diese Abnahme ist kein pauschaler Fehlerfrei-Nachweis der gesamten Website.
