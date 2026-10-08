# Wochenpakete und WhatsApp-Symbol — 08.10.2026

Status: Code-/Contentrelease `eb1338cbd8babea498a4a9a778f8fadae9f0b735` ist seit 08.10.2026, 20:08:36 UTC (22:08:36 Europe/Berlin), öffentlich aktiv und geprüft. Vorheriger App-Release `53c01a07ab0a074839a0df00e1683a39a77e2a48` bleibt als Rückrollziel erhalten. Die nachfolgenden Zwischenstände sind historische Schritte; maßgeblich ist die abschließende Abnahme unten.

## Auftrag und Grenzen

Freigegeben ist der reguläre Wochenweg: DE- und NL-Originale beziehen, Originaldaten und Vollständigkeit prüfen, lokale Handzettel/Vorschauen und alle Angebotskacheln gemeinsam binden, als geprüften Linux-Release veröffentlichen und öffentlich kontrollieren. Die vorhandenen 107 deutschen und 21 niederländischen Angebote, Bedingungen und Originalausschnitte bleiben erhalten. Keine stillen Preiskorrekturen. Kein DNS-, SMTP-, Bestell- oder Zahlungsumbau; `RENTAL_MODE=disabled` bleibt erforderlich.

Zusätzlich ausdrücklich bestätigt: Nur das WhatsApp-Symbol wird grün (`#25D366`). Hintergrund, Rahmen, Größe, Links und Instagram bleiben unverändert.

## Originalabgleich KW 41

Am 08.10. erneut lokal gehasht und PDF-Titelseiten gerendert/visuell geprüft. Beide Originale zeigen 05.10.2026–10.10.2026; die Motive bleiben vollständig. Bereits dokumentierte NL-Originalabweichungen werden nicht still korrigiert.

| Original | Seiten | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| DE-PDF | 18 | 11.639.099 | `be4b243ec0ddb84bee38054f051702a670ea8871fc897584190aefd9b8b4642a` |
| NL-PDF | 1 | 12.278.582 | `65fedf4c7016dfd91229ee5f0e2221b0d08aae4090572df0c35bb674c46db7d4` |

DE-Vorschau: `a9ac782ae646c830ea71b4448fda2ceac8ba06d5b9c0ec93c69fb51828220a51`; NL-Vorschau: `a64e80d7087932e064b2d1c9686442bf3a4efc2ce230ac1a18dc1a2b21b0eeb2`.

Sollzählung pro deutscher Seite: `[10,10,9,9,10,0,1,4,9,8,5,5,4,5,5,5,7,1]`. Warengruppen DE/NL: Bier21/4, Wein16/2, alkoholfrei25/4, Spirituosen37/9, Lebensmittel4/1, Sekt4/1. 128 eindeutige Angebots-IDs.

## Bisherige technische Prüfung

- Manifest-/Integritätsprüfung und Import/Assembly getrennt implementiert und unabhängig geprüft.
- Gespeicherte und neu geladene Originale benötigen PDF-Signatur, abschließendes EOF und exakte dekodierte Seitenzahl. Tests mit beschädigten, neu gehashten Originalen reproduzierten die vorherige Lücke und sind nach der Korrektur grün.
- Gemeinsame exklusive Transaktion beginnt vor veränderlichen Lesezugriffen und umfasst die endgültige Bindung. Ein unterbrochener Schreibstand blockiert weitere Veröffentlichung; keine automatische Entfernung der Sperrmarkierung.
- Prüfstufe bis `2d0c8d2`: 185 fokussierte und 1.374 vollständige Tests, TypeScript und gezieltes Linting erfolgreich; unabhängiges Nachreview ohne offene Befunde.
- Die gemeinsame öffentliche Auswahl ist in `0efdeb9` umgesetzt und taskbezogen geprüft: 83 Testdateien / 1.370 Tests bestanden. Öffentliche Daten enthalten nur freigegebene Flyer-/Angebotsfelder; der alte Fetch-/Cron-Weg kann keine eigenständige Veröffentlichung mehr auslösen. Die entfernten Quellenfehler-Isolationstests werden als kleiner Review-Follow-up bei der Datenmigration wieder ergänzt.
- Die Build-/HTTP-Prüfung ist in `32b61e6` erweitert: 84 Testdateien / 1.382 Tests, TypeScript und gezieltes Linting bestanden. Ein Release-ähnliches Fixture besteht ohne private Originalordner. Der normale Build bleibt bis zur echten KW41-Manifestbindung gesperrt; ein diagnostisch direkt gestarteter Next-Build mit 121 Routen ist ausdrücklich keine Releasefreigabe. Die zuvor aufgetretenen dynamischen Dateitracingwarnungen sind nach Trennung des schreibenden Vorbereitungsmoduls verschwunden.
- Das unabhängige Review fand eine Prüflücke für abgelaufene PDF-Links mit Query oder absoluter eigener Origin. In `482f8ca` korrigiert: Vergleich des URL-Pfads unabhängig von Query/Fragment, mit tatsächlicher Prüf-Origin. Fünf Fehler zuerst reproduziert, danach 98 fokussierte Tests sowie TypeScript/Lint bestanden; Nachreview ohne neue Befunde. Ein kleiner Robustheitsbefund zu ungültigen API-Arrayelementen bleibt ausdrücklich für das Gesamtreview vorgemerkt.
- KW41 ist in `3c2627c` über den normalen Generator/Assembler gebunden. Alle 128 Angebotsbilder bleiben bytegleich; nur 107 DE-Original-URLs wechseln auf die lokale identische Datei. Sechs Quellenfehler-Isolationstests ergänzt, bestehendes Verhalten ohne Laufzeitänderung. Serieller Gesamtlauf: 84 Dateien / 1.395 Tests bestanden, Lint/TypeScript/Angebotscheck und regulärer Build mit 121 Routen erfolgreich; `npm audit --omit=dev` meldet 0 Schwachstellen. Der gezielte Git-Binärdateieintrag in `d9571e7` verhindert Textnormalisierung der Original-PDFs, deren Hash unverändert bleibt.
- Die echte lokale HTTP-Abnahme fand anschließend einen Integrationsfehler: Der Prüfer entfernt aufgelöste React-Streamingsegmente als vermeintlich unsichtbar, obwohl im Browser alle 128 Kacheln erscheinen. Lauf `2026-10-08T19-24-51-252Z-check-c5be9475` blieb deshalb ausdrücklich fehlgeschlagen. In `82e5cd9` erkennt eine gemeinsame, statische Prüfgrenze tatsächlich abgeschlossene React-Segmente, ohne empfangene Skripte auszuführen; außerdem wird die CSS-Klasse `overflow-hidden` nicht mehr mit dem HTML-Attribut `hidden` verwechselt.
- Das Nachreview fand zwei weitere Randfälle dieser Prüfgrenze (größer-als-Zeichen in Attributwerten sowie nicht ausführende Skripte mit `src`/`nomodule`). In `9b9dd9a` mit Rot/Grün-Regressionsnachweis korrigiert. 146 fokussierte Tests, TypeScript und Lint bestanden; abschließendes taskbezogenes Nachreview ohne offene Befunde.
- Unabhängiger serieller Gesamtlauf bei `82e5cd9`: 84 Dateien /1.416 Tests, ruhiges Linting, Typegenerierung, TypeScript, 128 Angebotsprüfungen, regulärer Build mit 121 Routen und `npm audit --omit=dev` ohne Schwachstellen. Die späteren zwei Parserzeilen wurden anschließend mit den oben genannten 146 Tests geprüft; dieser Gesamtlauf wird nicht als nachfolgender Lauf ausgegeben.
- Erneute tatsächliche lokale Abnahme bei `9b9dd9a`: `2026-10-08T19-46-08-064Z-check-dc6ea4d4`, beendet19:46:35UTC, keine Fehler, `websiteVerified=true`, `deploymentVerified=false`. Geprüft sind drei Content-APIs, Legacy-GET, vier Flyeransichten, Sortiment/sechs Warengruppen sowie Originale, Covers und alle128Kachelbytes. Die einzige Warnung ist erwartungsgemäß die noch nicht geprüfte öffentliche Origin.
- Abschließende Build-/Liveprüfung und Automationsanpassung sind noch offen. Keine neue öffentliche Bereitstellung an diesem Zwischenstand.

## WhatsApp: lokale Abnahme

Commit `ec90da46985a8c918a107120bdc24e9d441ba240` ändert ausschließlich die gemeinsame SVG-Farbklasse und einen Regressionstest. 17 fokussierte /1.375 vollständige Tests, TypeScript und gezieltes TS-Linting bestanden; unabhängiges Review ohne Befunde. ESLint besitzt hier keine CSS-Konfiguration; der entsprechend ignorierte CSS-Aufruf wurde nicht als CSS-Lintnachweis gewertet.

Realer Browservergleich vor/nach der Änderung: Bei allen fünf Social-Links der Startseite sind Hintergrund, Rahmen, Ankerfarbe, Ziel, 44×44-Pixel-Fläche und 24×24-Pixel-Symbol identisch geblieben. Ausschließlich beide WhatsApp-SVGs wechseln auf `rgb(37, 211, 102)`. Mobile berechnete Farbe und Füllung bestätigen dasselbe; die vorhandene Ausblendung des Headerlinks auf schmalen Bildschirmen bleibt bestehen. Instagram bleibt unverändert. Temporäre Viewportänderung zurückgesetzt.

Lokaler Screenshot: `audit/screenshots/weekly-publication-2026-10-08/whatsapp-symbol-desktop.png`. Keine öffentliche Farbänderung an diesem Zwischenstand behauptet.

## Wochenwechsel: isolierte Browserprüfung

Mit aktuellem Next16.3.8 auf einem vorübergehenden, ausdrücklich markierten Entwicklungsserver auf Port3105 geprüft. Nur synthetische Angebote und Originaldateien; keine echten Preise, Quellen oder Produktionsuhr geändert. Die normale lokale Vorschau wurde danach unmarkiert auf Port3000 wiederhergestellt.

- Sonntag23:59:59(Berlin): keine abgelaufenen Angebote.
- Montag00:00:00: ein neues Testangebot erscheint ohne Neuladen.
- Zwei Antworten bewusst umgekehrt abgeschlossen: Antwort2 zuerst, Antwort1 danach. Die neue Ausgabe bleibt sichtbar, die alte überschreibt sie nicht.
- Nach Ablauf verschwindet das Angebot sofort, auch während eine weitere Antwort noch aussteht.
- Initiales Montag-HTML und anschließend gemountete Browserliste zeigen dieselbe ID `synthetic-monday-original`; das Testbild ist tatsächlich dekodiert.
- Die lokale PDF öffnet im Handzetteldialog. Escape schließt ihn, stellt den Fokus auf den Öffnen-Button zurück und gibt das Scrollen wieder frei.
- Nach Entfernung der Testmarkierung liefern beide Fixture-Seiten sowie künstliche PDF/Bilddatei404; die normale Angebots-API bleibt erreichbar.

Belege: `fixture-reversed-response.png` und `fixture-expired.png` im eigenen Screenshotordner. Diese Verhaltensprüfung ist kein Nachweis aktueller KW41-Inhalte oder öffentlicher Bereitstellung. Keine eigenständige Playwright-/CDP-Ausführung; die breitere E2E-Suite ist damit nicht als vollständig ausgeführt ausgewiesen.

## Echte lokale KW41-Darstellung

Angebote/Handzettel zeigen beide vollständig dekodierten Covers mit `object-fit:contain`, auf Desktop nebeneinander, bei390×844Pixeln untereinander ohne horizontalen Überlauf. NL bleibt vollständig sichtbar; Beleg `local-nl-flyer-mobile.png`. Sortiment128Kacheln, Sprachfilter NL21/DE107 und Krombacher-Bedingungen/Warnung geprüft. WarengruppeBier zeigt25zugeordnete Originalangebote. Niederländische Seite besitzt niederländische Ansprache und beide lokalen PDF-Links.

Der direkte DE-PDF-Link zeigt die Originaltitelseite und Folgeseite im In-App-Browser. Dessen eingebettete native PDF-Ansicht im vorhandenen Dialog blieb dagegen dunkel, obwohl das Ladeereignis eintraf; eine korrekt dargestellte eingebettete PDF wird hier ausdrücklich nicht behauptet. Escape, Fokuswiederherstellung und Scrollfreigabe funktionieren. Dieser konkrete Browserbefund ist dem Gesamtreview übergeben; die direkten Originaldatei-Links bleiben verfügbar.

## Umsetzungsentscheidungen

1. Für das bereits geprüfte, gesicherte DE-Original ist ein optionaler privater Cover-Eingang erlaubt. Auch dieser muss Pfadgrenze, Hash, dekodierbare Bytes und unveränderlichen öffentlichen Zielpfad bestehen. Kein öffentlicher Ersatzpfad und keine Freigabeumgehung. Falls die Eingangsform später geändert werden muss, betrifft dies ein redaktionelles Metadatenfeld, nicht die Websitegestaltung.
2. Eine erstmalig vorbereitete Woche darf ihre einzeln gültige Sprache binden und zugleich wegen einer fehlerhaften Gegenausgabe mit Fehlerstatus enden. Bei einer fehlgeschlagenen Ersetzung eines vorhandenen Wochenmanifests bleiben dessen Bytes unverändert. Ein korrigierter neuer DE-Stand kann dadurch auf die Behebung einer fehlerhaften Ersetzung warten; kein ungültiges Paket wird aktiviert.
3. Für das Prüfwerkzeug wird die bereits vorhandene, fest versionierte Acorn-Bibliothek ausdrücklich als Entwicklungsabhängigkeit geführt. Sie erkennt React-Streamingabschlüsse statisch, ohne empfangenen JavaScript-Code auszuführen oder in die Kunden-Laufzeit zu gelangen. Eine spätere andere Prüfstrategie würde diese Werkzeugabhängigkeit und die Prüfgrenze betreffen, nicht die Kundeninhalte oder Gestaltung.

## Gesamtreview und Linux-Testkonfiguration

Das unabhängige Gesamtreview von `4577a20` bis `9b9dd9a` hat keine offenen kritischen oder wichtigen Befunde. Es bestätigt 128 unveränderte Angebots-IDs und 30.325.424 unveränderte Kachelbytes; die einzige semantische Angebotsänderung sind 107 lokale DE-Originalverweise. Alle drei oben dokumentierten Umsetzungsentscheidungen wurden geprüft. Die minimale Laufzeit-Dateiliste im Deployment-Runbook wurde um beide benötigten Angebots-JSON-Dateien ergänzt und nachgeprüft.

Ein kleiner Audit-Robustheitsbefund wurde in einer einzigen abschließenden Korrekturrunde umgesetzt (`eb1338c`): Ungültige API-Arrayelemente verursachen jetzt einen gespeicherten strukturierten Prüfbericht statt eines Abbruchs ohne Nachweis. Rot/Grün dokumentiert, 33 fokussierte Tests bestanden, gezieltes Linting/Diffprüfung sauber; das begrenzte Nachreview bestätigt die Behebung ohne neue Fehler.

Der erste isolierte Linux-Prüflauf auf `9b9dd9a` endete mit 1.423 bestandenen und fünf fehlgeschlagenen Tests. Ursache war ausschließlich das versehentlich auch für Unit-Tests gesetzte `NODE_ENV=production`: Die Produktionssperre für Testuhren arbeitete korrekt. Dieselben fünf Fehler wurden lokal reproduziert; die beiden betroffenen Dateien bestanden mit `NODE_ENV=test` alle 22 Tests. Das Deployment-Runbook setzt deshalb nur für `npm test` ausdrücklich den Testmodus; Build und Website bleiben im Produktionsmodus. Kein Schutz wurde gelockert, kein fehlgeschlagener Release aktiviert.

Die ursprüngliche eingebettete PDF-Ansicht bleibt eine bekannte Prüfgrenze: Sowohl DE als auch die unveränderte NL-Ansicht blieben im In-App-Browser bei 1.280×900 Pixeln dunkel, obwohl der Ladezustand bereit meldete. Direkte Original-PDFs sind lesbar; keine neue Sandbox-/Layoutrestriktion ist belegt. Die Ursache in anderen Browsern ist nicht verifiziert. Weder ein allgemeiner PDF-Viewer-Erfolg noch eine pauschale Browserursache wird behauptet.

Nicht zum Auftrag gehören neue Preisinterpretationen des freigegebenen Originals, noch nicht existierende künftige Canva-Exporte und Änderungen an Mail, Zahlungen, Mietbetrieb, DNS oder Verträgen. Künftige Originale müssen die beschriebenen Prüfungen erneut bestehen.

## Abhängigkeiten und Bereitstellungsartefakt

Der finale Code-/Contentstand ist `eb1338cbd8babea498a4a9a778f8fadae9f0b735`. Sein ausschließlich aus dem geprüften Git-Commit gebildetes Positivlisten-Archiv hat SHA-256 `1ff334a4c4405dbfd874111750df0db9b91c966abace6eb1df584a833e508cd5`, vor und nach Übertragung geprüft. Es enthält weder lokale Umgebungsdateien noch private Canva-/Instagram-Rohordner, Mac-Builds oder Mac-Abhängigkeiten. Das frische Releaseverzeichnis ist `/srv/trinkgut-jammers/releases/eb1338cbd8babea498a4a9a778f8fadae9f0b735`.

Das vollständige npm-Audit meldet fünf bekannte hohe Befunde ausschließlich in der Entwicklungswerkzeug-Kette `eslint-config-next` / `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`. Kein erzwungenes Versionsupgrade außerhalb dieses Auftrags. Das separate Produktionsaudit bleibt der maßgebliche Nachweis für Laufzeitabhängigkeiten; ein fehlerfreies Produktionsaudit ist keine Aussage, alle Entwicklungswerkzeuge seien frei von Befunden.

## Abschließende Abnahme

Frischer Linux-Lauf auf `eb1338c`: 84 Testdateien / 1.443 Tests bestanden (Start 20:01:13 UTC, Dauer 252,72 Sekunden). Lint ohne Fehler, Next-Typegenerierung, TypeScript, Prüfung aller 128 Angebote und regulärer Produktionsbuild mit 121 Routen erfolgreich; `npm audit --omit=dev` meldet 0 Schwachstellen. Build-Ausgaben nennen die bestehende experimentelle SQLite-Warnung, keine neue Dateitracingwarnung. Keine privaten Originalordner waren erforderlich.

Code/Content auf `origin/codex/cinematic-production` gepusht, Archiv auf dem bestätigten Host geprüft und dort isoliert gebaut. Atomarer Wechsel von `53c01a0` auf `eb1338c`; die erste Verbindungsprobe traf erwartungsgemäß den noch startenden Dienst, der begrenzte Wiederholungsversuch war erfolgreich. Keine Rückrollaktion nötig. App hört weiterhin nur auf 127.0.0.1:3000. Release root-eigen und nicht gruppen-/weltbeschreibbar; `.next/cache` gehört jammers mit 0750. Dienstdatei unverändert: SHA-256 `e9d9ba135d9e7f70119ccae175f12bedd64337c083e7efff0a96d1ad22cb1dfa`. Keine DNS-, Caddy-, SMTP-, Zahlungs- oder Mietbetriebsänderungen.

Öffentlicher [Content-Prüflauf](../../audit/content-runs/2026-10-08T20-08-47-190Z-check-ef950d97.json), abgeschlossen 20:09:02 UTC: keine Fehler/Warnungen, `websiteVerified=true`, `deploymentVerified=true`, beide Originalhashes korrekt. Vier Flyeransichten, Sortiment/sechs Warengruppen, alle drei Content-APIs, Legacy-GET und sämtliche lokalen Original-/Cover-/Kachelbytes wurden abgeglichen. Der nachfolgende [HTTP-Audit](../../audit/evidence/2026-10-08-weekly-publication-live-eb1338c.json) ist bestanden: 117 Seiten, 2.821 Ressourcen, 30 API-Prüfungen und 5 unbekannte Routen, keine Fehler/Warnungen. Externe Links wurden dabei ausdrücklich nicht abgerufen; es gab keine echten E-Mails, Bestellungen oder Zahlungen. Beide Berichte sind bereinigt und enthalten keine Account-/Sitzungsdaten.

HTTPS separat über IPv4 und IPv6 mit 200 bestätigt. `www` liefert 301 auf dieselbe Hauptdomain mit erhaltenem Pfad/Query; HTTP liefert 308 auf HTTPS. Historischer privater Produktpfad und beide geprüften Test-Fixturepfade liefern 404. Mietkonfiguration öffentlich `enabled:false`, `testMode:false`, `onlinePayment:false`.

Tatsächliche öffentliche Browserabnahme: `/angebote` zeigt DE links/NL rechts bei 1280×900; mobil 390×844 vollständige, dekodierte `contain`-Covers ohne horizontalen Überlauf. `/produkte` zeigt 128 Kacheln, Filter NL 21/DE 107, Suche Krombacher 1 mit unveränderter Mengenwarnung; mobile Liste ohne Überlauf. `/handzettel` zeigt beide dekodierten Covers; `/nl` bietet niederländischen Einstieg und beide lokalen Originalverweise. Die Startseite zeigt das grüne WhatsApp-Symbol bei unverändert transparentem Hintergrund und unveränderten Links. Die separate oben beschriebene IAB-PDF-Einbettungsgrenze bleibt ausdrücklich offen; diese Abnahme behauptet keinen vollständigen browserübergreifenden E2E-/Barrierefreiheitstest und keine Rechtsprüfung.

Belege im eigenen Ordner `audit/screenshots/weekly-publication-2026-10-08/`: `live-home-whatsapp.png`, `live-offers-desktop.png`, `live-offers-mobile.png`, `live-assortment-mobile.png`. Fremde Screenshots und alte private/unbereinigte Laufberichte wurden weder übernommen noch überschrieben.

Die zwei vorhandenen aktiven Aufgaben wurden über das Produktwerkzeug aktualisiert und anschließend aus ihren gespeicherten Feldern erneut verglichen: `jammers-werbung-der-folgewoche` (Sonntag 17:00) und `jammers-werbung-und-ver-ffentlichung-pr-fen` (täglich 06:15), jeweils Europe/Berlin. IDs, Namen, Zielchat, Erstellungszeit, Status, Zeitpläne und vorhandene Benachrichtigungseinstellung unverändert; ausschließlich der Arbeitsauftrag ergänzt. Er umfasst Originalexport, vollständige Kachelerfassung, Bindung, frischen Linux-Release und tatsächliche HTTPS-Prüfung. Die Monatsaufgabe wurde nicht verändert. Die Aufgaben bleiben Mac-/Codex-App- und für neue Canva-Originale anmeldeabhängig; kein unabhängiger Server-Canva-Cron. Heute sind weiterhin nur 05.–10.10.2026 belegt; die nächste Woche muss erneut vorbereitet werden.

Abschließende Dokumentations-/Belegcommits ändern den aktiven App-Release `eb1338c` nicht. Lokale Worktree und GitHub werden auf demselben Dokumentationsstand gehalten; kein Pull im alten Claude-Code-Pfad erforderlich.
