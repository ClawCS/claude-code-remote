# NL-Publikationsströme — lokale Releasevorbereitung, 11.10.2026

Status: Repository-Umstellung und KW42-Vorbereitung lokal geprüft. **Öffentliche Veröffentlichung noch ausstehend.** Dieser Bericht bestätigt keinen neuen Linux-Release, keine Liveschaltungszeit und keine vorzeitige KW42-Aktivierung. Der Controller übernimmt nach unabhängiger Diff-/Gesamtbranchprüfung die bestehenden App-Promptupdates, Push/Synchronisationsnachweis, Linux-Build, Releasewechsel und tatsächliche HTTPS-Abnahme.

## Quellen und vollständiger Umfang

Ab Zielmontag 12.10.2026 stammt das reguläre NL-Wochenoriginal aus der Agentur: gerade ISO-Wochen De Maas Driehoek, ungerade Udens Weekblad. Parität allein ersetzt keine Prüfung des gedruckten Jahres/Zeitraums, der Sprache, Herkunft/Freigabe und einseitigen vollständigen Originaldatei. Die bestehende KW41-Canva-Historie bleibt unverändert. Maasduinen ist separat optional, zwölf Schaltungen/Jahr ohne bestätigte Monatstermine, mit eigener gedruckter Gültigkeit und eigenen Angeboten; kein Ersatz für fehlendes Wochen-NL.

Vollständig vorbereitetes KW42-Paar für 12.–17.10.2026:

| Original | Umfang | SHA-256 | Angebotscensus |
| --- | --- | --- | --- |
| DE Goch, Katalog 1394743/v1 | 10 Seiten; 6.829.343 Bytes | `a8dfe6b0a728982667ce83ac8eed0e527c6cf2b6d03dd7b10fcd857112f4f37e` | 70; Seiten `[10,10,9,8,10,0,1,6,8,8]` |
| NL De Maas Driehoek | 1 Seite; 3.113.358 Bytes | `b669c22d2e7bcb6466af9771cf68573f935312556db0d58e24db9a6e5bfe448d` | 12 |

Das Manifest `data/editorial/weekly-publications/2026-10-12.json` bindet beide Originale, vollständige unbeschnittene Cover und 82 Originalausschnitte. 210 gespeicherte Angebote enthalten 128 unveränderte historische Zeilen. Quelle und finale Ausschnitte wurden in Task5 unabhängig geprüft; letzter erfolgreicher normaler Prepare-Lauf endete am 11.10.2026 um 09:40:49.658 UTC. Das ist **Vorbereitung**, keine Liveschaltung. Der bereits dokumentierte gezielte Canva-Check fand kein passend gültiges/forthcoming Maasduinen-Original; keine Zusatzbindung wurde erfunden oder erneut gesucht. Originalwarnungen und vollständige Bedingungen bleiben erhalten. Detaillierter Importnachweis: [KW42-Originalpaar](2026-10-11-kw42-original-publication.md).

## Repository und Scheduler

AGENTS.md, Content-Runbook und Quellenkonfiguration dokumentieren nun den bestätigten Cutover, unabhängige Zusatzbindung, gezielte `--week`-/`--edition`-Workflows, All-Stream-Checks und idempotente Wiederholung. Nur der Wochenpflegeabsatz im Deployment-Runbook ist angepasst; sämtliche Einrichtungs-/Sicherheitsgrenzen bleiben unverändert. Gleichwertiges Hauptpaar auf Startseite, `/nl`, `/angebote`, `/handzettel`; gültige Zusätze separat darunter, Sortiment mit vollständigen Originalangeboten und ihren eigenen Zeiträumen. Alte Header-freie Angebotsprojektion und Legacy-DE-GET bleiben kompatibel, v2 wird über `X-Jammers-Content-Version: 2` geprüft.

Die beiden vorhandenen Automationsdateien wurden erneut gelesen: Sonntag 19:00 Europe/Berlin **ACTIVE**, tägliche 06:15-Kontrolle **PAUSED**; IDs, Namen, Zielchat und fehlende explizite Benachrichtigungspolitik bleiben erhalten. Es liegen zwei vollständige Promptentwürfe im privaten Arbeitsbereich vor, **noch nicht angewendet**. Ausschließlich der Controller darf sie nach Review über das App-Werkzeug ersetzen; keine TOML-Direktänderung, neue Aufgabe, Reaktivierung oder Server-Cron. Erforderliche Quellen-/Canva-/Browserzugänge und eingeschalteter Mac/laufende App bleiben Voraussetzungen. Bereits exakte geprüfte Bindungen nicht identisch neu generieren/redeployen oder leer committen; tatsächliche Verfügbarkeit dennoch prüfen. Unveränderte fehlerfreie oder bereits konkret gemeldete blockierte Zustände bleiben still.

## Frische lokale Gates

- `NODE_ENV=test npx vitest run --exclude 'services/applications/**' --exclude '.superpowers/**'`: 108 Dateien / **1.899 Tests bestanden**, Exit 0, 24,96 s, Start 11:56:58 Europe/Berlin. Native Bewerbungsdienste ausdrücklich ausgeschlossen, keine Betriebsqualifikation daraus ableiten.
- `npm run lint`: Exit 0, **0 Fehler / 21 bestehende Warnungen**, darunter die im Ledger bereits vermerkten NL-Testprops. Kein sauberer/pristiner Output behauptet.
- `npx next typegen`: Exit 0, Routentypen erfolgreich generiert. `npx tsc --noEmit`: Exit 0 ohne Ausgabe.
- `npm run offers:check`: Exit 0, **alle 210 Originalangebote und Bilder geprüft**.
- Ein einzelner `env -u CINEMATIC_E2E -u CINEMATIC_TEST_NOW -u APPLICATIONS_TEST_QPDF -u APPLICATIONS_TEST_POPPLER NODE_ENV=production RENTAL_MODE=disabled NEXT_TELEMETRY_DISABLED=1 npm run build`: Exit 0. Prebuild-Inhalts-/Assetprüfung erfolgreich, optimierter Build kompiliert, 120 statische Seiten generiert. Kein Mac-Build als Linux-Release ausgegeben.
- Wiederverwendbare fokussierte Chromium-Matrix `e2e/nl-publication-streams.spec.ts` am eigenen isolierten Entwicklungsserver: **14/14 bestanden**, 32,4 s. Vier synthetische Flyerkompositionen bei 390/768/1440, separate Zusätze, Fehl-NL, Hauptpaar ohne leere Zusatzgruppe, Ablauf, getrennte Bedingungen/Sprachfilter/Suche und Tastatur-Viewer geprüft.
- Matching-Zukunftsprüfung `npm run content:check -- --week 2026-10-12 --now 2026-10-12T12:00:00Z --url http://127.0.0.1:3126`: Exit 0, Fehler `[]`, `websiteVerified=true`, `deploymentVerified=false`. Tatsächlicher Lauf 11.10.2026 10:02:33.036–10:03:20.832 UTC, ausgewertete isolierte Testzeit 12.10.2026 12:00 UTC. Berichtstatus `degraded` ausschließlich wegen erwarteter Vorschau-/Nichtproduktionswarnung; kein Inhaltsfehler und ausdrücklich kein öffentlicher Nachweis.
- Tatsächlicher KW42-Chromium-Gate mit übereinstimmender Server-/Browser-Testuhr: Exit 0; **8 Flyerkompositionen**, **2 vollständige Sortimentsseiten**, **12 Warengruppenseiten**, **164 dekodierte Angebotsbilder** bei 390/1440 geprüft. Exakte 82 IDs (70 DE/12 NL), Bedingungen/Warnungen, Original-PDF-Seitenlinks, vollständige unbeschnittene Cover, Hauptpaar-Geometrie, fehlende leere Zusatzgruppe, Enter/Escape/Schließen-/Rückkehrfokus, APIs v2/alte Projektion/Legacy-DE und vier Original-/Cover-GET-Hashes bestanden; keine `pageerror`-Ereignisse. Screenshots Angebote 1440 und Handzettel 390 visuell geprüft. Kleine zusätzliche Interaktionsprüfung nach abgeschlossener Hydration: bei beiden Breiten 82 Karten/82 geöffnete Bedingungen, **keine Console-Fehler**.

Der eigene Testserver verwendet eine separate ignorierte Quellkopie mit `CINEMATIC_E2E=1` und passender Montag-Testuhr sowie passender Playwright-Browseruhr; Produktion erhält keine Testuhr. Scratch-Anfangsversuche korrigierten ausschließlich Harness-Annahmen (Next-Vary-Zusatzwerte, viewport-relative Geometrie nach verschiedenen Scrollpositionen, reale Sonntags-Browseruhr gegenüber Montag-Server). Die reale Sonntags-Browseruhr entfernte zukünftige Karten korrekt. Eine testinduzierte native Details-Interaktion vor Hydration erzeugte eine Dev-Warnung; nach explizitem Warten auf initialen Angebotsrefresh war die Zusatzprüfung fehlerfrei. Application-Code nicht verändert. Bestehende Workspace-/LCP-Advisories bleiben dokumentiert, kein insgesamt pristiner Output behauptet. Eigener Server danach gestoppt, Port 3126 frei; Port 3000 und die bestehende `.next-dev` nicht verändert, normale Vorschau weiter erreichbar. Ein unabhängiger `audit:public` mit Zukunftsuhr wurde bewusst nicht ausgeführt.

## Noch erforderliche externe Gates

Nach Reviews muss der Controller beide bestehenden Prompts erneut lesend abgleichen und über das App-Werkzeug aktualisieren, den exakten geprüften Commit pushen und den richtigen Remote `origin/codex/cinematic-production` vergleichen. Vor Release tatsächliche current-/Rollback-Ziele und Speicher prüfen; bestehende Sicherheitskonfigurationshashes vor/nach unverändert vergleichen. Frischer Linux-Webbuild gemäß Deployment-Runbook, ausschließlich eigener geprüfter Commit; bei readiness-Fehler kontrolliert zurückrollen. Keine weitere Releasebereinigung ohne spezifische Erlaubnis.

Danach bei **echter Zeit ohne `--now`**:

```sh
npm run content:check -- --url https://trinkgut-jammers.de
npm run content:check -- --week 2026-10-12 --url https://trinkgut-jammers.de
npm run audit:public -- --url https://trinkgut-jammers.de --output /tmp/jammers-nl-streams-live.json
```

Original-/Cover-/Kachelbytes per GET samt SHA-256, APIs inklusive v2/alter Projektion/Legacy, öffentliche Desktop-/Mobilansichten und echte AVIF-Flaschenabrufe prüfen. Sonntags Zukunftspaketbindung/Dateien separat belegen, während aktive Montagspreise verborgen bleiben. Tatsächliche Release-ID, Rückrollziel, Linux-Ergebnisse, Hashvergleich und reale öffentliche Zeit müssen in einem gesonderten Nachtrag eingetragen werden; aktuell **nicht verifiziert**. Keine Server-Sicherheits-, Upload-, Mail-, Miet-, Zahlungs-, Bewerbungs- oder Löschaktivierung.
