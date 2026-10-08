# Eigene Google-Profilfotos — Prüfung vom 08.10.2026

## Umfang und Freigabe

Auf Betreiberauftrag wurden 39 Einträge der öffentlich sichtbaren Google-Galerie „Vom Inhaber“ einschließlich Videos gesichtet und kategorisiert. Nicht alle Videos wurden abgespielt. Es wurde kein authentifizierter Google-Kontozugriff verwendet; Google und Canva blieben unverändert.

Acht geeignete Fotos wurden als lokale, metadatenbereinigte Vollbild-Derivate übernommen. Das vom Betreiber Justin zugeordnete Stapler-/Anlieferungsfoto ist vollständig ausgeschlossen, auch als Ausschnitt; es wurde nicht heruntergeladen. Das Drei-Personen-Verkostungsfoto blieb nach der Betreiberantwort zulässig, die ausschließlich das Staplerfoto ausschloss. Unbeschriftete Personen wurden nicht anhand ihrer Gesichter identifiziert.

## Einordnung und Darstellung

- **Startseite:** bestehende drei Entdeckungskarten erhalten; nur das Marktleben-Motiv durch die Verkostung ersetzt.
- **Marktleben:** sieben Fotos in drei Gruppen mit 2/3/2 Motiven; die beiden bisherigen Canva-Marktfotos bleiben. Neu: Verkostung, Desperados-Detail, Baileys-Aufbau, Bauernhof-Aufbau und Grillbegleiter.
- **Geschenkideen:** bisheriger Geschenkkorb erhalten, zwei Grußkartenfotos ergänzt.
- **Eigenmarken:** Foto der sechs Likörflaschen ergänzt, alle sechs bisherigen Originalposter erhalten.

Die neuen Fotos sind als Rückblicke aus 2025 gekennzeichnet. Sichtbare alte Preise werden nicht als aktuelle Preise ausgegeben; Marktleben weist ausdrücklich auf abweichendes Sortiment und die im Markt zu erfragende Verfügbarkeit hin. Die Bilder bleiben vollständig, unverzerrt und in natürlichen Proportionen. Die acht WebPs umfassen zusammen **862.230 Bytes (rund 842 KiB)**.

## Herkunft, Datenschutz und Build

Öffentliche Renderdaten liegen in `data/google-market-photos.ts`, lokale WebPs unter `public/images/editorial/google/`. Acht bereinigte JPEG-Buildquellen und das Manifest unter `assets/source/google-market-photos/` dokumentieren Freigabebasis, Google-Betreiberherkunft, Maße, Vollbildausschnitt und SHA-256; sie enthalten keine privaten Quellen-URLs oder Fotoidentitäten. Google-Fotos werden nicht als Canva-verifiziert bezeichnet und nicht extern eingebettet.

Private Quellen-URLs, Fotoidentitäten, Exportnachweise und Rohdateien bleiben im Repository ausschließlich unter dem Git-ignorierten Verzeichnis `.superpowers/google-photos-2026-10-08/`. Dieses Verzeichnis gehört nicht ins Releasepaket. Der Deployment-Archivpfad wurde um die bereinigten Google-Buildquellen erweitert; sämtliche neuen Renderdaten, Quellen, Derivate und das Prüfskript müssen vor dem Release versioniert sein.

`scripts/build-google-market-assets.mjs` prüft Quellen- und Derivathashes, vollständige Ausschnitte, bereinigte Metadaten, Maße, Bytebudgets und die öffentliche Datei-Allowlist. `--check` rekonstruiert nur im Speicher und verändert keine Dateien. Die Prüfung ist in den Prebuild eingebunden.

## Verifikation und Review

Vom Hauptagenten bestätigt:

- `npm test`: 75 Testdateien und 1.251 Tests bestanden.
- Lint mit `--quiet`, Next-Typegen und TypeScript-Prüfung bestanden.
- Produktionsbuild, Google-Assetcheck für alle acht Fotos und Diffcheck bestanden.
- CUA-Prüfung bei 390 × 844 auf allen vier geänderten Routen (`/`, `/marktleben`, `/geschenkideen`, `/eigenmarke`): kein horizontaler Overflow, Bilder laden und behalten natürliche Proportionen.
- Desktop-Prüfung aller vier geänderten Routen bei 1.280 × 900 ebenfalls bestanden: kein horizontaler Overflow, alle neuen Motive laden in ihren natürlichen Proportionen. Die Browserkonsole meldete keine Fehler.
- Die betroffenen Routen wurden zusätzlich per lokalem HTTP-Aufruf auf die neuen Inhalte geprüft. Die angepasste E2E-Datei wurde in diesem Lauf nicht separat ausgeführt; die responsive Sichtprüfung erfolgte über CUA.

Die unabhängige, read-only Prüfung des aufgabenbezogenen Working Diffs ergab keine kritischen, wichtigen oder handlungsbedürftigen kleineren Befunde. Alle acht lokalen Motive wurden visuell geprüft; Google-Assetcheck und aufgabenbezogener Diffcheck wurden zusätzlich erfolgreich ausgeführt. Fremde Audit-Screenshots und die beiden nicht zugehörigen Audit-JSON-Dateien vom 30.09. waren ausdrücklich nicht Review-Gegenstand.

## Veröffentlichungsstatus

**Fotoerweiterung live:** App-Release `077412ba7211e94fc40de26f8f02f87325c85038`, auf der bestätigten Hetzner-VM um 14:13:24 UTC aktiviert. Vorheriger Release `1788f9d943afeeb3af83523daaa607a92b7886cb` bleibt für Rollback erhalten. Lokaler Branch und App-Commit wurden auf GitHub synchronisiert.

Das positiv gefilterte Commit-Archiv hatte lokal und auf dem Server SHA-256 `bd3230299a73724ba863bc51c9a8b20a3696a61264b2f37f7189bf69bb45b66a`. Keine privaten Rohordner oder fremden Screenshotänderungen übertragen. Frischer Linux-Build mit Node 22.23.3 als `jammers`: 75 Testdateien/1.251 Tests, Lint, Typegen/TypeScript, alle 128 Originalangebote und Build bestanden. `npm audit --omit=dev`: null Schwachstellen; der vollständige Installationsaudit meldete fünf bereits vorhandene High-Befunde in Entwicklungsabhängigkeiten, die durch diesen Fotorelease nicht geändert wurden.

Nach atomarer Umschaltung bestätigte die begrenzte HTTP-Bereitschaftsprüfung die laufende App. `RENTAL_MODE=disabled`, `enabled:false`, `testMode:false`, `onlinePayment:false` bleiben unverändert. Keine externen Kontoänderungen, Nachrichten, Bestellungen oder Zahlungen vorgenommen.

Öffentliche HTTPS-Prüfung: Alle acht neuen WebPs liefern 200 und exakt die Manifest-SHA-256. Alle vier geänderten Seiten zeigen ihre neuen Fotos; Desktop- und Mobilansichten wurden über CUA geprüft. Der Marktleben-Bereich lädt alle sieben Motive vollständig, ohne horizontalen Überlauf. Browser-Viewport danach zurückgesetzt. Nachweise: `audit/screenshots/google-owner-photos-2026-10-08/` (`marktleben-live-desktop.png`, `marktleben-live-mobile.png`, `home-live-desktop.png`).

### Separater offener Befund: externer deutscher Handzettel

Der vollständige [öffentliche HTTP-Audit](../../audit/evidence/google-owner-photos-2026-10-08-live.json) ist **nicht insgesamt bestanden**: 117 Seiten, 2.844 lokale Asset-URLs, fünf unbekannte Routen und 26 API-Verträge geprüft; zehn Fehler betreffen ausschließlich verschiedene Bildgrößen derselben externen DE-Titelseite. Die Fotoerweiterung ist nicht betroffen. Der [Content-Check](../../audit/content-runs/2026-10-08T14-13-40-079Z-check-9cc65ad1.json) schlägt ebenfalls wegen externer DE-PDF und -Titelseite fehl; `deploymentVerified:false` ist zu erhalten und kein Beleg einer fehlenden HTTPS-Konfiguration.

Ursachenabgrenzung: Die gespeicherten offiziellen URLs für Katalog `1390117`, Version 1, antworten am 08.10. gegen 14:15 UTC sowohl bei HEAD als auch GET mit 404. Der PDF-GET wurde zusätzlich direkt von Hetzner aus mit 404 bestätigt. Diese Metadaten und der Auslieferungscode sind gegenüber dem zuvor veröffentlichten Release unverändert. Warum der Anbieter die Dateien unter diesen Adressen nicht mehr bereitstellt, ist nicht geklärt. NL-Dateien bleiben lokal erreichbar und hashgeprüft; gültige Preise oder Datumsgrenzen wurden nicht verändert.

Die Original-PDF und Titelseite dieser DE-Ausgabe liegen noch im privaten, geprüften Quellenordner auf dem Mac. Ihre aktuellen Hashes stimmen mit dem Quellenbeleg vom 04.10. überein: PDF `be4b243ec0ddb84bee38054f051702a670ea8871fc897584190aefd9b8b4642a`, Cover `a9ac782ae646c830ea71b4448fda2ceac8ba06d5b9c0ec93c69fb51828220a51`. Sie sind bislang nicht als öffentliche DE-Auslieferungsdateien eingerichtet.

Niko wurde gefragt, ob die geprüften lokalen Originale als reguläre Auslieferung auf dem eigenen Server eingerichtet werden sollen. Er bat zunächst um verständliche Erklärung und einen sauberen Prozess ohne Sonderwege. Deshalb in diesem Auftrag **keine Änderung am Handzettel-Auslieferungsmodell**: als Folgearbeit einheitliches versioniertes Wochenpaket mit Originalen, Integritäts-/Datumsprüfung, atomarer Aktivierung und öffentlicher Abnahme erklären und abstimmen; keine spontane Ersatzwoche oder Preisverlängerung.
