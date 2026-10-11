# NL-Publikationsströme — veröffentlichter KW42-Release, 11.10.2026

Status nach abschließender Controller-Abnahme: **Release `8613344dca4aa2644e03dcf50b35a360e16dbab1` ist öffentlich bereitgestellt und bei echter Sonntagszeit geprüft.** Bereitschaft bestätigt am 11.10.2026 um 10:33:55 UTC / 12:33:55 Europe/Berlin. KW42 ist vollständig hochgeladen, aber erst vom 12. bis einschließlich 17.10.2026 aktiv. Der tatsächliche Montagseintritt wurde am Sonntag nicht als beobachtet ausgegeben; Zeitgrenzen und aktive Darstellung wurden separat lokal geprüft. Die folgenden Vorbereitungsabschnitte dokumentieren die frühere Phase; der Abschlussnachtrag unten ersetzt ihre damals noch offenen externen Gates.

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

## Vor der Controller-Abnahme noch erforderliche externe Gates

Nach Reviews muss der Controller beide bestehenden Prompts erneut lesend abgleichen und über das App-Werkzeug aktualisieren, den exakten geprüften Commit pushen und den richtigen Remote `origin/codex/cinematic-production` vergleichen. Vor Release tatsächliche current-/Rollback-Ziele und Speicher prüfen; bestehende Sicherheitskonfigurationshashes vor/nach unverändert vergleichen. Frischer Linux-Webbuild gemäß Deployment-Runbook, ausschließlich eigener geprüfter Commit; bei readiness-Fehler kontrolliert zurückrollen. Keine weitere Releasebereinigung ohne spezifische Erlaubnis.

Danach bei **echter Zeit ohne `--now`**:

```sh
npm run content:check -- --url https://trinkgut-jammers.de
npm run content:check -- --week 2026-10-12 --url https://trinkgut-jammers.de
npm run audit:public -- --url https://trinkgut-jammers.de --output /tmp/jammers-nl-streams-live.json
```

Original-/Cover-/Kachelbytes per GET samt SHA-256, APIs inklusive v2/alter Projektion/Legacy, öffentliche Desktop-/Mobilansichten und echte AVIF-Flaschenabrufe prüfen. Sonntags Zukunftspaketbindung/Dateien separat belegen, während aktive Montagspreise verborgen bleiben. Tatsächliche Release-ID, Rückrollziel, Linux-Ergebnisse, Hashvergleich und reale öffentliche Zeit müssen in einem gesonderten Nachtrag eingetragen werden; aktuell **nicht verifiziert**. Keine Server-Sicherheits-, Upload-, Mail-, Miet-, Zahlungs-, Bewerbungs- oder Löschaktivierung.

## Abschlussnachtrag: Review, Linux-Release und öffentliche Abnahme

### Unabhängige Prüfung und exakter Stand

Alle sechs Aufgaben wurden getrennt implementiert und gegengeprüft. Die Gesamtbranchprüfung `700cfd2..9b584ef` fand keine kritischen oder wichtigen offenen Befunde. Ein kleiner Spezifikationsabgleich wurde mit `8613344` korrigiert: „Zusätzlich aktuell: Maasduinen“ / „Ook actueel: Maasduinen“, jeweils einschließlich zugänglicher Beschriftung. Eine frische, ausschließlich auf diesen Fünf-Dateien-Fix begrenzte Gegenprüfung bestätigte die Korrektur ohne neue Befunde. Keine weiteren Funktions-/Designänderungen danach.

Frische Root-Prüfungen auf `8613344`: 108 Web-Testdateien / **1.899 Tests**, 24,66 s, Exit 0; `npm run lint -- --quiet`, `next typegen`, `tsc --noEmit`, `offers:check` (210/210) und Produktionsbuild jeweils Exit 0. Der Fix selbst hatte zusätzlich 14/14 Browserprüfungen bestanden. Die zuvor dokumentierten 21 Lintwarnungen wurden nicht als beseitigt ausgegeben. `npm audit` meldet weiterhin fünf hohe Paketeinträge derselben bereits dokumentierten Entwicklungsabhängigkeitskette zu `braces`; `npm audit --omit=dev --json --ignore-scripts` meldet **0**. Keine Abhängigkeitsänderung oder pauschale Sicherheitsgarantie.

`8613344` wurde auf `origin/codex/cinematic-production` gepusht und gegen den lokalen Commit abgeglichen. Positiv gefiltertes Git-Archiv: 1.573 Einträge, 359.272.014 Bytes, SHA-256 `6138020a332185fdaddd60f2467b6b6fad4d80d13f9559ff5861664ae9dffb3c`; keine Umgebungsdateien, privaten Arbeitsordner oder Mac-Builds. Eine vor Abschluss des Transfers gestartete Build-Anfrage wurde vom Archivhash-Guard verworfen, ohne Releaseverzeichnis anzulegen. Der tatsächliche Linux-Build begann erst nach abgeschlossener Übertragung und identischem Hash.

### Server und Umschaltung

Auf dem bestätigten Host `trinkgut-jammers-web-01`, Node 22.23.3, frisches Releaseverzeichnis erstellt; Installation als `jammers` mit `--ignore-scripts`, ausschließlich bestehender geprüfter ImapFlow-Patch explizit ausgeführt. Linux-Webteilprüfung gemäß Runbook: **105 Dateien / 1.864 Tests**, 129,25 s, Exit 0. Die drei ausdrücklich dokumentierten Medien-Quelltests bleiben auf Linux ausgeschlossen und sind in den 1.899 lokalen Webtests enthalten; native Bewerbungsqualifikation nicht behauptet. Linux-Lint, Routentypen, TypeScript, 210 Angebotsprüfungen, Prebuild und Produktionsbuild bestanden.

Atomarer Wechsel von `346c01546bc1dc68060b6c7f11eaed8b9d16694f` auf `8613344dca4aa2644e03dcf50b35a360e16dbab1`; nur bestehende Next-Unit neu gestartet. Ein erwarteter erster Verbindungsversuch direkt beim Neustart wurde von der begrenzten Readiness-Wiederholung erfolgreich aufgefangen. Kein Rollback erforderlich; vorheriges Release bleibt Rückfallziel, zusätzlich `2370b82` erhalten. Der Rollbackpfad ist codegeprüft und seine ERR-Vererbung isoliert geprüft, nicht durch absichtlichen Produktionsausfall getestet.

Alle **280** vorher aufgenommenen Konfigurationshashes einschließlich AppArmor sind vor/nach Build und Umschaltung identisch. Caddy und Next aktiv, Next ausschließlich `127.0.0.1:3000`; keine Testuhr oder nativen Testflags im laufenden Dienst. Mietkonfiguration weiterhin `enabled:false`, `testMode:false`, `onlinePayment:false`; `/api/bewerbung/config` weiterhin deaktiviert. Keine Security-/DNS-/Mail-/Miet-/Zahlungs-/Upload-/Löschkonfiguration verändert, keine echten Formulare oder Nachrichten ausgelöst.

### Echte öffentliche Nachweise

- `content:check -- --url https://trinkgut-jammers.de`: Exit 0, Fehler/Warnungen leer, `websiteVerified=true`, `deploymentVerified=true`, Status `ok`, Abschluss **10:34:38.111 UTC**. Reguläres Sonntagsende der KW41; keine alten Preise aktiv.
- `content:check -- --week 2026-10-12 --url https://trinkgut-jammers.de`: Exit 0, Fehler/Warnungen leer, beide Originale `bound-and-verified`, Website/Deployment bestätigt, Abschluss **10:34:48.828 UTC**. Tatsächliche Auswertungszeit 11.10.2026, kein `--now`. Zwei Original-PDFs, zwei vollständige Cover und sämtliche **82** Kacheln öffentlich per GET auf Typ/Größe/Hash geprüft; zukünftige Aktivpreise gleichzeitig verborgen.
- `audit:public`: Exit 0, **117 Seiten, 1.639 lokale Ressourcen, 5 unbekannte Routen und 31 API-Verträge**, 0 Fehler / 0 Warnungen. 1.119 erfasste externe Linkvorkommen wurden nicht abgerufen; daraus keine Fremdseiten-Verfügbarkeitsbehauptung. GET/HEAD und ungefährliche unauthentifizierte Ablehnungsproben, keine echten Geschäftsaktionen.
- IPv4 und IPv6: HTTP→HTTPS 308, `https://www`→Hauptdomain 301, Pfad/Query erhalten, Hauptdomain 200. Sicherheitsheader einschließlich CSP/HSTS/nosniff vorhanden; historische Extraktionsdatei `/data/products/manifest.json` liefert 404.
- Echte AVIF-GETs für sechs Eigenmarken in drei Größen: **18/18** bestanden, Typ und dekodierte Breite korrekt, größte gemessene Anfragedauer 743 ms. Kein bloßer HEAD-Nachweis.
- Unabhängige öffentliche Chromium-Abnahme bei **390/768/1440 px**: 15 Routenbesuche, 6 auf `main` begrenzte Axe-Prüfungen, keine Page-Errors; Filmquelle/Play/Pause/Reduced-Motion, sechs Flaschen und Tastatur-Navigation bestanden. Abschluss **10:35:07.811 UTC**. Angebote Desktop und NL mobil visuell geprüft. Ein zunächst leerer Bereich im Fullpage-Screenshot war Lazyloading: nach Scrollen HTTP 200, `complete=true`, `naturalWidth=390`, korrekt sichtbar. Keine vollständige Browser-/WCAG-Zertifizierung daraus ableiten.

Maasduinen bleibt unabhängig und optional. Kein passendes echtes Zusatzoriginal beim gezielten Quellencheck gefunden; kein Motiv erfunden, kein Export behauptet. Die aktuelle Hauptpaar-Lücke am Sonntag und die angekündigte KW42 sind beabsichtigt. Die zwei bereits dokumentierten rechnerischen Originalabweichungen im NL-Blatt bleiben unverändert mit angebotsbezogener Warnung.

### Bestehende Automationen

Am 11.10.2026 um 10:26 UTC beide bestehenden Prompts ausschließlich über das App-Werkzeug aktualisiert und danach vollständig mit den tatsächlich gespeicherten Prompts verglichen. IDs, Namen, Zielchat und Benachrichtigungspolitik erhalten:

- `jammers-werbung-der-folgewoche`: **Sonntag 19:00 Europe/Berlin, ACTIVE**.
- `jammers-werbung-und-ver-ffentlichung-pr-fen`: **täglich 06:15 Europe/Berlin, weiterhin PAUSED**.

Neue Vorgaben: gerade/ungerade Agenturquellen ab KW42, unabhängiges optionales Maasduinen, vollständige Angebotszählung, echte öffentliche Byteprüfung und idempotente Wiederholung. Keine neue Aufgabe, Reaktivierung oder Server-Cron. Mac, laufende App und erforderliche Quellenzugänge bleiben Voraussetzung.

### Vollständige Verfahrensentscheidungen und deren Kosten

1. Task4-Implementierungscommit vor unabhängiger Diffprüfung; diese Prüfung sperrt Fortschritt/Veröffentlichung bis zur Abnahme. Grund: unveränderliche Reviewbasis. Mögliche Kosten: Sequenz-/Commitnacharbeit, keine ungeprüfte Veröffentlichung.
2. `content:prepare --week` baut ausschließlich das Hauptpaar; überlappende Zusatzprüfungen gehören in `content:check --week`, Zusätze in den eigenen Assembler. Grund: getrennte Transaktionen/Sperren. Kosten: ausdrücklich dokumentierter zusätzlicher Prüfschritt, kein Guard-Bypass.
3. Task5 durfte den nachweislich falschen zukünftigen Abrufzeitstempel minimal im Prepare-Aufrufer samt Regression beheben. Kosten: begrenzte Aufrufer-/Testnacharbeit; historische Daten und Zielwochenprüfung unverändert.
4. Task6-Repository-/Lokalgates vor Review, externe App-/Serveraktionen danach durch den Controller. Kosten: mögliche Dokumentations-Reihenfolgenacharbeit; externe Veröffentlichung blieb hinter der Reviewgrenze.

### Speicher und bestehende Grenzen

Das neue Release ist funktionsfähig. Vor Bereinigung des eigenen Transferarchivs verbleiben etwa 2,6 GiB frei; weitere neue Releases benötigen zusätzlich Platz. Für die zwei nicht mehr aktiven Releases `077412b…` und `9b9dd9a…` vom 8.10. (zusammen etwa 2,6 GiB) wurde eine separate Löschfreigabe erfragt. Bis zur Antwort bleiben sie erhalten; aktuelle und jüngste Rückfallversionen werden nicht entfernt. Fremde 32 Screenshots, der fremde Bewerbungsbericht und fremde Content-Laufberichte bleiben unangetastet/unstaged. Der Abschluss-Dokumentationscommit ist keine neue Anwendungsversion; das öffentlich ausgeführte Code-Release bleibt `8613344`.
