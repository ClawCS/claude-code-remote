# Öffentliche Freigabe — filmische Website und Unterseiten

Veröffentlicht am 10.10.2026 um 23:54:18 Europe/Berlin (21:54:18 UTC), ausschließlich Web-Release. Öffentliche Origin: https://trinkgut-jammers.de. App-Commit `8c14f8580ad7b09164548021512f132e4fa7b610`; derselbe Commit ist auf `origin/codex/cinematic-production` nachgewiesen. Spätere reine Berichtscommits ändern den laufenden App-Stand nicht.

## Umfang und unveränderte Grenzen

Der bereits freigegebene filmische Homepage-Umbau, kräftigere warme Gestaltung aller Kunden-Unterseiten und die kontextuellen Navigationslinks sind jetzt öffentlich. Unter `/kontakt` steht zusätzlich **Bewerbungen: info@trinkgut-jammers.de**; `jammers-goch@trinkgut.de` bleibt für allgemeine Marktanliegen erhalten. Zwei bei der Produktionsabnahme nachgewiesene Kontrastkorrekturen betreffen ausschließlich kleine Texte auf neuen cremefarbenen Flächen.

Keine Betriebsfreigabe für Bewerbungsupload, automatische E-Mails, Löschung, verbindliche Mietbestellungen oder Zahlungen. Öffentlich verifiziert: `/api/bewerbung/config` liefert `enabled:false, mode:disabled`; `/api/rentals/config` liefert `enabled:false, testMode:false, onlinePayment:false`. Bewerbungen bleiben über den vom Kunden geöffneten E-Mail-Link möglich. Server-Sicherheits-/Caddy-/Unit-/Mail-/DNS-Konfigurationen wurden nicht geändert.

## Release-Nachweis

- Ziel ausschließlich `trinkgut-jammers-web-01`, bestehender Next-Dienst; neues Verzeichnis `/srv/trinkgut-jammers/releases/8c14f8580ad7b09164548021512f132e4fa7b610`.
- Positiv gefiltertes Git-Quellarchiv:334143660Bytes, SHA-256 `3f7007c2aa66dbeb309ec155974114c0fa25a8d3b94f7c4f14b0b7675655ab88`. Keine `.env`, Git-Daten, Mac-Abhängigkeiten/Builds oder privaten Exportordner übertragen. Drei notwendige Medien-Herkunftsmanifeste separat enthalten.
- Neuer Linux-Build auf Node22.23.3, `npm ci --include=dev --ignore-scripts`, bestehender versionsgebundener ImapFlow-Patch, 101 Web-Testdateien/1635 Tests bestanden, ESLint ohne Fehler, TypeScript bestanden, alle128 Originalangebote geprüft, Next-Produktionsbuild mit120 vorgerenderten Seiten erfolgreich. Genau zwei Chromium-startende lib-Testdateien laufen separat lokal; kein vollständiger Linux-Browser-/Native-Services-Nachweis behauptet.
- Lokale integrierte Prüfung und ehrliche Aufteilung der ersten fehlgeschlagenen/gezielt korrigierten Fälle: `docs/audits/2026-10-10-subpage-visual-continuity.md`. 103 Dateien/1660 Webtests;21 bestehende Lintwarnungen. Alle drei Taskreviews und abschließende unabhängige Gesamtprüfung ohne kritischen/wichtigen Implementierungsbefund. Native Bewerbungsdienste bleiben ungeprüft/gesperrt; Entwicklungstestserver hat dokumentierte Router-Startwarnung.
- Atomarer `current`-Symlinkwechsel, ausschließlich bestehende Next-Unit neu gestartet. Readiness-Wiederholung überbrückte erwarteten kurzen Verbindungsabbruch; danach Kontakt, Startseite und gesperrte Betriebszustände bestanden. Dienst aktiv, NRestarts0.
- Rückkehrziel unverändert vorhanden: `dc23203493a1c71cad5a4719dc588ca0a86f2fa0`. Kein Rollback erforderlich.
- Caddy-Konfigurationshash vor/nach unverändert: `fbdf74b2f94dedb319e885110e31179219a3b448f3d65f1018b503e5eeb038ef`; Next-Unit: `e9d9ba135d9e7f70119ccae175f12bedd64337c083e7efff0a96d1ad22cb1dfa`.

## Öffentliche Abnahme

- `/` und `/kontakt` tatsächlich über HTTPS200 geladen: neue Navigation/Filmkomponente und beide unterschiedlichen E-Mail-Ziele einschließlich Bewerbungsüberschrift vorhanden.
- HTTP→HTTPS308 und www→Hauptdomain301, Pfad und Query bleiben erhalten.
- `npm run content:check -- --url https://trinkgut-jammers.de`, echter Zeitpunkt21:55:57–21:56:15UTC: statusok, errors[],warnings[], websiteVerified:true,deploymentVerified:true. Aktuelle KW41 DE/NL-Originale datumsrichtig gebunden; SHA-256 DE `be4b243ec0ddb84bee38054f051702a670ea8871fc897584190aefd9b8b4642a`, NL `65fedf4c7016dfd91229ee5f0e2221b0d08aae4090572df0c35bb674c46db7d4`. Bericht `audit/content-runs/2026-10-10T21-55-57-771Z-check-e26ce15c.json`. Mitternacht beendet diese Angebotswoche; kein Testdatum gegen Produktion und keine Verlängerung.
- Tatsächlicher Chrome-Browser auf öffentlicher Homepage, keine Seek-Simulation: Desktop1674px `jammers-hero-v4-desktop.mp4`, readyState4, Zeit6.970551→14.495682Sekunden; echte Pausentaste stoppt14.845149. Mobil390px `jammers-hero-v4-mobile.mp4`, readyState4, Zeit0.139681→8.008160; echte Pausentaste stoppt8.194256. Anschließend Viewport zurückgesetzt und Wiedergabe wiederhergestellt. Quellen/Dateien befinden sich auf eigener HTTPS-Origin.
- Nachgelagerter öffentlicher HTTP-Audit:117 Seiten,3055 Ressourcen,31 API-Verträge,0 Fehler/0 Warnungen dieses Programms;107 exakte307-Aliase.15/15 Navigationsfälle,28 repräsentative responsive/axe-Kombinationen und5/5 lokale synthetische Interaktionen bestanden. Reduced-motion lädt zunächst kein MP4, manuelle Wiedergabe/Pause funktioniert. Keine universelle Browser-/A11y-Zertifizierung.
- Tatsächlicher Berliner Tageswechsel: um00:00:14 am11.10.2026 keine aktiven KW41-Handzettel/Angebote mehr; APIs und fünf Einstiegs-/Angebotsseiten entfernen die abgelaufenen Ausgaben. Keine Produktions-Testuhr. Die zuvor korrekt gelieferten PDFs sind getrennt von der bestätigten leeren Inline-Anzeige im App-Browser zu bewerten.
- Abschließende reine Serverabfrage: aktueller Release unverändert, Dienst active/running,NRestarts0; IPv4/IPv6 jeweils HTTPS200. Seit21:54:10UTC19 Journalzeilen,darunter3 `NoFallbackError`,keine ENOENT/EACCES. Derselbe lokale Produktionsbuild reproduziert die Meldung bei unbekanntem Akademieslug trotz korrektem HTTP404; daher keine vollständig saubere Serverausgabe behauptet. Etwa3,9GiB frei/90% belegt; keine Release-/Quelldateien gelöscht.
- Drei getrennte Auditrollen abgeschlossen. Vollständige priorisierte Liste einschließlich Prüfgrenzen und Reproduktion: [Projektaudit](2026-10-11-project-postrelease-audit.md). Keine Produktkorrektur aus diesen Befunden ohne weitere Nutzerfreigabe. Ein Release-Nachweis ist kein Sicherheits- oder Rechtskonformitätszertifikat.

## Begründete Arbeitsentscheidungen

1. Vorhandene lokale Abhängigkeiten/isolierte Worktree wiederverwendet: vermeidet sachfremde Neuinstallation; Risiko falscher Ausgangslage wird durch Tests sichtbar.
2. Neueste Freigabe als Web-Veröffentlichung, nicht Upload-/Mail-/Sicherheitsaktivierung ausgelegt: bei falscher Auslegung wäre eine Rückkehr des Webstands nötig, keine Zugangsdaten oder Dienste wurden erweitert.
3. Bekannte browserabhängige PDF-Einbettung für das anschließende Audit belassen: neue Auditkorrekturen bedürfen Freigabe; Risiko bleibt bis dahin die bekannte Kompatibilitätsgrenze, nicht fehlende Originaldateien.
4. Zwei Chromium-Testdateien lokal statt auf browserlosem Server ausgeführt, restliche Webtests auf Linux: keine nicht beauftragten System-/GUI-Pakete installiert; Risiko eines Linux-Browser-spezifischen Fehlers wird durch öffentliche Browserprüfung reduziert, nicht vollständig ausgeschlossen.
5. Konfigurierbare Screenshot-Ausgabe für drei Testsuiten aus Task3 nach Task2 vorgezogen, Standardpfade erhalten: schützt fremde Nachweise; falsche Pfadangaben könnten neue Belege falsch ablegen.
6. Nachgewiesene schwach kontrastierende Textlinks auf warmen Collection-Flächen eng auf vorhandenes Burgunder geändert: notwendige Barrierefreiheit der freigegebenen Gestaltung; bei Fehlentscheidung wäre diese begrenzte Farbanpassung zurückzunehmen.
7. Dasselbe für ausschließlich die Instagram-Kapitelüberschrift auf der Startseite: belegtes4.14:1 bei Kleinschrift; bei Fehlentscheidung wäre genau diese Textfarbe zurückzunehmen. Bildtest vergleicht Original-/Inhaltsmaße und begrenzt Optimierer-Rundung statt künstlich Toleranzen zu erweitern.

## Bekannte Prüfgrenzen

Die vollständige Native-Upload-/Scanner-/Mail-/Löschqualifikation ist nicht bestanden und wurde für dieses Webrelease nicht als bestanden ausgegeben. Keine echten Bewerbungen, E-Mails, Zahlungen oder Löschungen ausgelöst. PDF-Inline-Kompatibilität, bestehende Lintwarnungen und Entwicklungs-Routerwarnung bleiben Auditpunkte. Paketprüfung: fünf hohe Einträge sind eine Entwicklungskette zu `braces3.0.3` ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)); `npm audit --omit=dev` meldet0. Kein erzwungener inkompatibler Downgrade und kein Nachweis allgemeiner Ungefährlichkeit; Sicherheitsrolle bewertet Reichweite separat.

Cache-Hinweis für Sichtprüfung: Mac `Cmd+Shift+R`, sonst `Ctrl+Shift+R`.
