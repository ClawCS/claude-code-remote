# Atmosphärischer Feinschliff — öffentliche Abnahme, 11.10.2026

## Veröffentlichung und Umfang

Niko hat die fünf lokal geprüften Gestaltungsschritte mit „live bringen“ freigegeben. Auf `https://trinkgut-jammers.de/` läuft seit **06:41:01 UTC / 08:41:01 Europe/Berlin** der frisch auf Linux gebaute App-Release `346c01546bc1dc68060b6c7f11eaed8b9d16694f`. Der App-Inhalt entspricht Designcommit `12488675b49771a6318f3d263e7afe9e2a46deaf`; der folgende Commit ergänzt den Release-Positivfilter und die dokumentierte Browser-Testpartition. Ein nachfolgender reiner Nachweiscommit ändert diese öffentliche Release-ID nicht.

- Filmknopf im Video; sichtbares Caption-/Leerband entfernt, zugängliche Beschreibung erhalten.
- Drei farblich und fotografisch gestaltete Einstiegskarten mit unveränderten Zielen.
- Freigegebene Gartenparty mit Jammers-Logo statt Bierkisten beim Partyservice; vollständiges Bildverhältnis.
- Vier fokussierte Warengruppen ohne Bildmatten/Nummern; gemeinsame warme Akzente und SVG-Pfeile auch auf Unterseiten.
- Bewerbungslinks für Vollzeit/Teilzeit/Ausbildung an `info@trinkgut-jammers.de` erhalten.

Lokale Umsetzung und ursprüngliche Designabnahme: `2026-10-11-atmosphere-refinement.md`. Keine neuen Motive erzeugt oder Geschäftsangaben verändert.

## Speicherfreigabe und Rückfallmöglichkeit

Anfangs waren nur rund 2,3 GiB frei. Nach ausdrücklicher Einzel-Freigabe des Betreibers wurden ausschließlich diese drei inaktiven Releases entfernt:

- `68771ecb706aebc558af7317fb991e328401a00d`
- `e24ab31c926d4baa7939e5ff743a8a79f14ed62b`
- `1788f9d943afeeb3af83523daaa607a92b7886cb`

Vor Löschung: richtiger Host, aktueller Symlink, exakte IDs, keine Symlinks/Mountpoints oder Laufzeitdaten, gleiche Partition geprüft. Danach rund 6,2 GiB frei; laufende Website unverändert erreichbar. Keine andere Release-Löschung.

Der vorherige Release `2370b8202fe98b2251cd3426e0bbe4fb3a0d29c2` bleibt direktes Rückrollziel; auch `8c14f8580ad7b09164548021512f132e4fa7b610` erhalten. Nur das selbst erzeugte, hashgeprüfte temporäre Übertragungsarchiv nach erfolgreicher Aktivierung entfernt. Abschließend rund **4,6 GiB frei**.

## Build und sichere Umschaltung

- Positiv gefiltertes Git-Archiv aus exakt `346c015…`, keine schmutzige Worktree-Kopie, keine `.env`, Schlüssel oder privaten Generatororiginale. Alle vier erforderlichen Medien-Provenienzdateien enthalten.
- Archiv SHA-256: `91308de554ff7ae9b50ad6ca200a4f8a45cb743982aea2aaa2af44f0f64dfdb8`; nach Übertragung identisch.
- Neuer Release unter `/srv/trinkgut-jammers/releases/346c01546bc1dc68060b6c7f11eaed8b9d16694f`, Installation/Build als `jammers`, Node **22.23.3**.
- `npm ci --include=dev --ignore-scripts`, expliziter geprüfter ImapFlow-Patch, Webtests, Lint, Typegen/TypeScript, Angebotsprüfung und Production-Build erfolgreich. Keine Bewerbungsdienste gestartet.
- Linux: **102 Testdateien / 1.642 Tests bestanden**. Die drei ausdrücklich dokumentierten Chromium-Dateien wurden auf Linux ausgelassen und lokal mitgeprüft; keine Aussage eines vollständigen Linux-Gesamtprojekttests.
- Frische lokale Webprüfung: **105 Dateien / 1.677 Tests bestanden**. Native Bewerbungsqualifikation bleibt getrennt und offen.
- Alle **128 gespeicherten Originalangebote** und ihre Bilder validiert; Inhalts-/Herkunftsprüfung bestanden; **120 Seiten vorgerendert**. Lint `--quiet` ohne Fehler, bekannte lokale Warnungen siehe Designbericht.
- Party-WebP: **1672 × 941 px, 247.230 Bytes**, SHA-256 `4f9f29cf0facc78d8f8f8199d6111a7707d02b5a2baad4c5abac39f8e83229fa`; öffentlicher GET identisch.
- Release root-eigen/nicht allgemein beschreibbar, nur Cache für `jammers`; atomarer Symlinkwechsel und bestehende Next-Unit neu gestartet. Fehlerpfad des `set -Eeuo pipefail`-/ERR-Trap-Umschaltskripts unabhängig isoliert geprüft. Kein Rollback nötig.
- Bereitschaft nach Umschaltung sowie weiteren kontrollierten Neustarts erfolgreich; anfängliche lokale Verbindungsablehnungen während des Starts wurden innerhalb der begrenzten Probe korrekt wiederholt. Ein zusätzlich zu früh angesetzter öffentlicher Diagnoseaufruf während des letzten Neustarts ergab 502; erst nach abgeschlossener Bereitschaft erneut geprüft und erfolgreich.

Konfigurationshashes vor/nach Umschaltung und Neustarts identisch:

| Datei | SHA-256 |
| --- | --- |
| `/etc/caddy/Caddyfile` | `fbdf74b2f94dedb319e885110e31179219a3b448f3d65f1018b503e5eeb038ef` |
| `/etc/systemd/system/trinkgut-jammers.service` | `e9d9ba135d9e7f70119ccae175f12bedd64337c083e7efff0a96d1ad22cb1dfa` |

Kein Caddy-Neustart, kein `daemon-reload`, keine AppArmor-/Firewall-/Mail-/DNS-Änderung.

## Öffentliche Verifikation

- `audit:public -- --url https://trinkgut-jammers.de`: nach Aktivierung und erneut nach letztem Neustart **117 Seiten, 1.639 lokale Ressourcen, 5 unbekannte Routen und 31 API-Verträge**, jeweils **0 Fehler / 0 Warnungen**. 116 Sitemap-/Hilfsseiten plus ein nachverfolgtes Ziel. Externe Links nicht abgerufen.
- `content:check -- --url https://trinkgut-jammers.de`: beide Läufe `status:ok`, `websiteVerified:true`, `deploymentVerified:true`, keine Warnungen/Fehler. Letzter Lauf `2026-10-11T06-51-06-083Z-check-47d650df`.
- Echte Berliner Zeit verwendet: Sonntag, 11.10. Die Ausgabe 05.–10.10. ist regulär abgelaufen, deshalb korrekter Leerzustand statt alter Preise. Die 128 geprüften Angebotsdateien sind keine Behauptung von 128 heute aktiven Angeboten. Keine Ersatzwoche/Datumsverlängerung und kein neuer Wochenimport in diesem Designauftrag.
- HTTPS über IPv4 und IPv6 200; HTTP → HTTPS 308; www → Hauptdomain mit Pfad 301; gesperrtes Legacy-Manifest 404.
- Öffentliche Mietkonfiguration `enabled:false`, `testMode:false`, `onlinePayment:false`; Bewerbungsupload `enabled:false`, `mode:disabled`.
- Frische abschließende Chromium-Matrix: **16/16 bestanden**, zusätzlich Flaschen bei 390/768 px **2/2 bestanden**. Keine Retries/Skips im abschließenden Lauf, keine unbehandelten Browserfehler oder horizontalen Überläufe.
- Geprüft: Einstiegskarten/Ziele, echter Klick zum Partyplaner, Partybild geladen/unbeschnitten/Logo sichtbar, vier Kategorien/SVG-Pfeile, Caption entfernt, Film abspielen/pausieren/mobile Quelle/Reduced Motion, sechs Flaschen mit richtigen Eigenmarken-Ankern, acht Unterseiten samt E-Mail-Links und nicht aktiviertem Upload.
- Gezielt axe für die neuen Einstiege/Servicebereiche bei 390/768/1440 px: **0 Verstöße**; je 17 bestandene Regelgruppen, eine unvollständige Kontrastgruppe für zehn Knoten wegen Verlaufs-/Pseudo-Hintergründen. Sichtkontrolle durchgeführt; keine pauschale WCAG-/Safari-/Screenreader-Zertifizierung.

## Festgestellter Optimiererzustand und Grenzen der Behebung

Die erste Live-Browsermatrix ergab 14/16: Kontakt scheiterte an einem zu breiten Prüfselektor (Footer und Hauptbereich), die sechs Likörbilder tatsächlich an hängenden AVIF-Anfragen. Nach korrekt auf `main` begrenztem Prüfselektor bestand Kontakt. Ein zweiter Bildtest nach Ende der parallelen HTTP-Prüfung scheiterte weiterhin; damit nicht als bloß langsamer Erstaufruf abgetan.

Gezielte Abgrenzung, ohne Code-/Konfigurationsänderung:

- Alle sechs Original-PNGs erreichbar; dieselbe Optimierer-URL als WebP in ca. 0,3 s erfolgreich.
- AVIF, Breite 256: öffentliche GETs 20–25 s ohne Bytes, auch direkter localhost-GET Timeout nach 5 s. Keine bloße Caddy-/Internetstörung.
- Native Sharp- und exakte Next-AVIF-Kodierung außerhalb des Dienstprozesses ca. 0,3–0,4 s; frischer AVIF-Schlüssel mit Breite 48 im laufenden Dienst 200 in 109 ms. Keine allgemeine defekte Datei/AVIF-Kodierung oder Ressourcenüberlastung belegt.
- Für den hängenden AVIF256-Schlüssel kein fertiger Cacheeintrag; WebP-Eintrag vorhanden. Nexts schlüsselbezogene gemeinsame Pending-Promise passt zum Prozesszustand. **Der ursprüngliche auslösende Vorgang ist nicht bewiesen**; ein abgebrochener Erstaufruf ist lediglich eine Hypothese.
- Kontrollierter Neustart der bestehenden Next-Unit löste den Zustand. Danach alle sechs tatsächlichen AVIF256-URLs 200 in **0,399–1,049 s**, anschließend frische 16+2 Browserfälle bestanden. Mobile Normalverhandlung lieferte ebenfalls alle sechs Bilder: Breite64 bei 390px und Breite96 bei 768px.

Dies ist eine nachgewiesene Wiederherstellung, **kein behaupteter dauerhafter Codefix** des möglichen Auslösers. Kein Formatwechsel, keine Cachedateilöschung, kein Abschwächen von Schutzmaßnahmen. Bei erneutem Auftreten konkrete URL, Accept-Header, erste Anfrage und Prozesszustand erfassen. Ein HEAD-Ressourcencheck ohne AVIF-Accept ersetzt diese Browser-/GET-Prüfung nicht.

## Nachweise und unveränderte Grenzen

- `audit/evidence/2026-10-11-atmosphere-live-http.json`: bereinigte abschließende HTTP-Evidenz.
- `audit/content-runs/2026-10-11T06-42-18-084Z-check-6cd51bc0.json` und `2026-10-11T06-51-06-083Z-check-47d650df.json`: eigene öffentliche Content-Läufe.
- `audit/screenshots/atmosphere-live-2026-10-11/`: tatsächliche öffentliche Desktop-/Mobilbilder, inklusive sechs geladener Flaschen. Ein anfängliches Desktop-Capture blendete durch internes Größenwechseln den Skiplink ein; finale Aufnahme nutzt passende Viewporthöhe, ohne DOM/CSS zu verstecken.
- Ausführliche erste Fehlversuche, Browserberichte, Traces und separate Reviews bleiben lokal unter `.superpowers/atmosphere-live-2026-10-11/`. Keine öffentlichen Nutzer-/Postfachdaten aufgezeichnet.

Keine echten Bewerbungen, E-Mails, Zahlungen oder Bewerbungs-/Postfachlöschungen ausgelöst. Bewerbungsupload und automatische Löschung bleiben in diesem Auftrag ausdrücklich unangetastet; die vorhandenen E-Mail-Bewerbungswege funktionieren als Links, nicht als Zustellnachweis. Native QPDF-/Betriebsqualifikation bleibt offen. Fremde historische Screenshots, Bewerbungs-Auditnotizen und ältere ungetrackte Content-Läufe wurden weder geändert, mitgestaged noch verworfen. Git und lokale Nachweise werden synchronisiert; der Git-Push wird nicht als Live-Beweis verwendet.
