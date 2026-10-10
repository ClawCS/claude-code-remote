# Entfernung nicht bestätigter Weiterbildungsaussagen · 10.10.2026

## Auftrag und Herkunft

Der Betreiber verlangt die vollständige Entfernung von „Du willst dich weiterbilden?“ mit der behaupteten Mitarbeiterunterstützung und Förderung über Bildungsgutscheine. Das gesamte Banner sowie der gleichgerichtete Kontaktaufruf einschließlich seines direkten Telefonbuttons wurden auf `/akademie/zertifikate` entfernt. Allgemeine Kontaktmöglichkeiten, beide Akademie-Rücklinks und alle 17 externen Kursinformationen bleiben unverändert. Keine neue Zusage oder Ersatzwerbung ergänzt.

Die Aussagen waren bereits im ursprünglichen Commit `11f38fe4` vom 24.03.2026 vorhanden; `aafa19b0` vom 04.05.2026 änderte die Umlautschreibung. Git-Autorenangaben belegen keine Betreiberfreigabe. Eine Bestätigung dieser Arbeitgeberleistung wurde in den geprüften Projektentscheidungen nicht gefunden. Die neue Entfernungsanweisung ist ausdrücklich in AGENTS.md dokumentiert.

## Prüfung und Veröffentlichung

- Öffentliche Vorprüfung: Banner, Bildungsgutscheinaussage und Förderungs-Kontaktaufruf tatsächlich vorhanden, HTTP 200.
- Nach Entfernung: lokale Seite HTTP 200, beanstandete Aussagen fehlen; Browser zeigt unveränderte externe Kurskarten und Akademie-Rücknavigation. Quellensuche in app/components/data/lib ohne weitere Kopie der beanstandeten Aussagen.
- 13 bestehende Akademie-Tests in zwei Dateien bestanden; TypeScript, gezieltes Lint und Diffprüfung bestanden.
- Vollständiger lokaler Projektlauf: **3.135 Tests in 141 Dateien**, Exit 0, 251,18 Sekunden; ausschließlich synthetische lokale Testdaten, mit vorhandenen gepinnten Dokumentwerkzeugen.
- Unabhängige Inhalts-/Diffprüfung ohne offenen Befund. Reine Textentfernung ohne neue Funktion; kein künstlicher Snapshot-Test für die gelöschte Formulierung ergänzt.
- Git/App-Commit: `c6f159a959564983d9bdc0f717d58590d0281d2c`. GitHub-Referenz identisch geprüft; vorhandene gh-Anmeldung als Credential-Helper nur für den Push genutzt, keine globale Git-/Zugriffskonfiguration geändert.
- Neues Quellarchiv mit explizitem Runbook-Positivfilter; SHA-256 `2ff250fe504e37f958ac3afce40616f3e99fdb3656f6b2c8b73e67212c5ca242`; keine lokalen Secrets, .env, .git, .superpowers oder Mac-Builds enthalten.
- Linux-Webteilprüfung: **1.556 Tests in 93 Dateien**, Lint, TypeScript, alle 128 Originalangebote und frischer Produktionsbuild bestanden. Keine Bewerbungsdienste gebaut/gestartet oder Scanner-/Mailqualifikation ausgeführt.
- Atomarer Wechsel auf den neuen Release am **10.10.2026 um 11:56:32 UTC / 13:56:32 Europe/Berlin**. Rückrollziel bleibt `40b58c38b28cf840a0d94633cf12a94fd7da6c54`. Erste Bereitschaftsprobe traf den kurzen Neustart, begrenzter Nachlauf erfolgreich.
- Tatsächliche öffentliche GETs: Zertifikatsseite, Akademie, Startseite und Bewerbung HTTP 200; beide entfernten Aussagen fehlen. Bewerbungs-Konfiguration weiter `enabled:false`/`mode:disabled`, Miete weiter `enabled:false`/`testMode:false`/`onlinePayment:false`.
- Öffentlicher Browserabgleich bestätigt die Entfernung und erhaltene Kurskarten. Screenshot und rohe Prüfberichte im ignorierten Ordner `.superpowers/academy-claim-removal-2026-10-10/`.
- Abschließende öffentliche Gesamtprüfung: **117 Seiten, 2.969 lokale Ressourcen, fünf unbekannte Routen und 31 API-Verträge**, keine Fehler oder Warnungen; 1.117 externe Links bewusst nicht erneut geprüft.
- `content:check -- --url https://trinkgut-jammers.de` am 10.10.2026 um 11:59:51 UTC bestanden: Status `ok`, keine Fehler/Warnungen, `websiteVerified:true`, `deploymentVerified:true`; beide laufenden Original-Wochenpakete unverändert gebunden und geprüft.

## Begrenzte Korrektur am Ausführungsskript

Die unabhängige Prüfung des privaten Umschaltskripts fand fehlende Bash-ERR-Trap-Vererbung (`set -euo pipefail` statt `set -Eeuo pipefail`). Ein isolierter Test reproduzierte vor der Korrektur einen Funktionsfehler ohne Rückrollaufruf. Nach dem gezielten Flagwechsel rufen simulierte Fehler in Bereitschaft, Umschaltung und Konfigurationsprüfung jeweils den Rückrollhandler auf. Syntaxprüfung und separate Nachprüfung bestanden. Kein absichtlicher Produktionsfehler ausgelöst. Der Runbookhinweis verhindert das erneute ungeprüfte Übernehmen des alten privaten Skripts.

## Unveränderte Grenzen

Caddy-SHA-256 vor/nach Wechsel `fbdf74b2f94dedb319e885110e31179219a3b448f3d65f1018b503e5eeb038ef`; Next-Unit `e9d9ba135d9e7f70119ccae175f12bedd64337c083e7efff0a96d1ad22cb1dfa`. Nur bestehende Next-Unit neu gestartet. Kein Caddy-/AppArmor-/Firewall-/SSH-/Mail-/Lösch-/Zahlungswechsel. Keine echten Bewerbungen oder Nachrichten. Fremde Screenshot-/Auditänderungen bleiben unberührt. Dies ist keine Freischaltung des weiterhin offenen Bewerbungsportals.
