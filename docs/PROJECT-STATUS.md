# Trinkgut Jammers Projektstand

Stand: 8. Oktober 2026, 16:39 UTC. Die Website ist im Informationsbetrieb auf dem bestätigten Hetzner-Server veröffentlicht; App-Release `d93f932` ist live. Neu sind Social-Icons, die orange gemeinsame NL-Leiste und verständliche Mengengrenzen ohne öffentliche Bestandslistenangaben. Desktop/Mobil und lokale sowie Linux-Prüfungen sind bestanden; der bekannte externe DE-Handzettel-404 bleibt offen. Deshalb keine fehlerfreie Gesamt-Inhaltsprüfung behaupten. Ältere Bild-/Rubrikbestände unten bleiben datierte Angaben, soweit nicht ausdrücklich aktualisiert. Eine technische Veröffentlichung ist keine juristische Gesamtfreigabe.

**Live:** `https://trinkgut-jammers.de`, Runtime-Release `d93f932c69a097026624a56365bd58f2dba024a7`, neue VM `trinkgut-jammers-web-01`. Aktiviert um 16:39:04 UTC / 18:39:04 Europe/Berlin. HTTPS IPv4/IPv6 jeweils HTTP 200; `www` per 301 mit Pfad/Query auf die Hauptdomain, HTTP per 308 auf HTTPS. Laufender Anfragebetrieb `enabled:false`, `testMode:false`, `onlinePayment:false`. Vorheriger App-Release `b0812f7` bleibt als Rollback erhalten. [Aktueller Prüfbericht](audits/2026-10-08-approved-ui-and-decisions.md). Ein späterer Dokumentationscommit ändert den laufenden App-Release nicht.

Historisch: Die Abnahme um 12:17 UTC war für `1788f9d` ohne Fehler; sie ist kein Nachweis für die später ausgefallenen externen DE-Dateien. Der neue Content-Lauf um 16:39 UTC bestätigt NL, scheitert aber an DE-PDF und -Cover; `websiteVerified`/`deploymentVerified` dieses **Gesamt-Inhaltslaufs** sind false. Das widerspricht nicht der separat geprüften HTTPS-Bereitstellung des UI-Releases. Originaldaten, Wochenpaket-Entwurf und weitere Grenzen sind im aktuellen Prüfbericht verlinkt.

Der Betreiber hat Impressumsangaben und AV-Vertrag bestätigt; daraus wird keine unabhängige juristische Abnahme abgeleitet. `RENTAL_MODE=disabled` bleibt aktiv: nur unverbindliche Anfrage per E-Mail-Entwurf an `jammers-goch@trinkgut.de` oder WhatsApp, Versand durch den Kunden. Kein SMTP-Versand, keine verbindlichen Onlinebestellungen und keine Zahlungen. Git-Push allein veröffentlicht nicht; jeder neue Inhaltsstand benötigt den geprüften Linux-Neubuild und versionierten Release nach [DEPLOYMENT-RUNBOOK.md](DEPLOYMENT-RUNBOOK.md).

## Verbindlicher Arbeitsort

- Arbeitsverzeichnis: `/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production`
- Branch: `codex/cinematic-production`
- GitHub: `https://github.com/ClawCS/claude-code-remote`, derselbe Branch.
- Der übergeordnete Checkout steht auf `codex/p1-design-directions` und ist nicht der aktuelle Produktionsarbeitsstand. Keine Branches oder Worktrees eigenmächtig wechseln oder überschreiben.
- Der früher genannte Claude-Code-Pfad ist archiviert. Ein Pull erfolgt im aktiven Arbeitsverzeichnis.
- Tech-Stack laut `package.json`: Next.js 16.3.8, React 19.2.4, TypeScript und Tailwind CSS 4.

## Umsetzung und Grenzen

Die Bildzahlen, Rubrik- und Quellenstände stammen aus dem Bericht vom 5. Oktober 2026, soweit die jeweilige Zeile nicht ausdrücklich den Livebetrieb vom 8. Oktober beschreibt. Sie sind keine neu erhobene Inventarliste; spätere ausdrückliche Bildfreigaben in `AGENTS.md` haben Vorrang.

| Bereich | Dokumentierter Stand |
| --- | --- |
| Gestaltung | Warmer, rot geprägter Marktauftritt; die frühere dunkle Inszenierung ist nicht die freigegebene Gestaltungsrichtung. |
| Navigation | „Rezepte & Wissen“ bündelt Cocktail-Rezepte und Getränkeakademie ohne zusätzlichen Hauptreiter. Akademie-Einstiege im Sortiment und passende Kurslinks in Warengruppen; Desktop/Mobil am 5. Oktober geprüft. Rot, Hero und grundlegende Struktur erhalten. |
| Team | Sieben aktive Einzelprofile: Niko, Sven, Jasmin, Jan Niklas, Hanna, Henri und Hannah. Gabriella am 8. Oktober zusätzlich entfernt; Nils, Nico und Tim bleiben ausgeschlossen. Nur Namen als Beschriftung, Gruppenfoto ausdrücklich behalten. |
| Ausschlüsse | Harpe und Justin dürfen nicht in aktiven Motiven erscheinen. Unbeschriftete Bilder benötigen noch Betreiberzuordnung; keine Identifikation anhand von Gesichtern behaupten. Historische/private Quellen nicht gelöscht. |
| Canva | Lesefunktion und angemeldete Ansichten am 5. Oktober erreichbar. Originale bleiben unverändert. Neue Fotos benötigen belegte Canva-Herkunft und passende Rubrik; ausdrückliche Ausnahme nur für geprüfte externe Cocktailfotos. |
| Gewinnspiele | Alle 15 derzeit belegten Aktionen haben vollständige Cover: neun Canva-Exporte und sechs ausdrücklich freigegebene eigene Instagram-Originalbilder. Everdure KILN R Staropramen (bis 31.10.) und Disaronno Liegestuhl + Flasche (bis 18.10.) aktuell; ältere Aktionen im Archiv. Bilder lokal optimiert, Originalpost-Links und Herkunft erhalten. Keine ausstehende Quellenfreigabe für diese sechs Cover. |
| Marktleben | Passende Canva-Motive und eigene Themenunterseiten vorhanden. Komplette Account-Sichtung seit Oktober 2024 nicht als abgeschlossen behaupten. Weitere geeignete Rubrikbilder und Personenfreigaben offen. |
| Cocktails | 65 Rezepte, sechs Kategorieeinstiege; 39 geprüfte reale Fotos lokal mit Quellen-/Lizenznachweisen eingebunden. 26 offen: 17 Downloads/visuelle Prüfungen nach Quellserver-Limit, neun passende Lizenz-/Rezeptvarianten. Externe Cocktailfotos am 5. Oktober ausdrücklich freigegeben, keine KI-Ersatzbilder. |
| Vermietung | 19 Artikel mit bestätigten Preisen nach Ergänzungen vom 8. Oktober; „Weinglas klein“ entfernt. Plus/Minus, Direkteingabe, interne Mengengrenzen und Überschneidungsregeln erhalten. Keine sichtbaren Bestandslistenangaben mehr; unmittelbare verständliche Meldung bei Übermenge. Keine marktweite Live-Verfügbarkeit. |
| Warenkorb/Checkout | Live am 8. Oktober ausschließlich unverbindliche Anfrage; `RENTAL_MODE=disabled`. Der zuvor implementierte verbindliche Mietbestellprozess mit SQLite, Marktannahme, Zahlungslink, Belegen und Versandwarteschlange ist nicht aktiviert. Keine automatischen E-Mails oder Zahlungen. |
| GrailBid | Externer Einstieg zu `https://grailbid.com`; kein neues Shopsystem und kein behaupteter Live-Nachweis des Zielshops. |
| Recht/Daten | Betreiber bestätigt am 8. Oktober Impressum und AV-Vertrag. Hosting-/Datenschutzhinweise für den freigegebenen Informationsbetrieb aktualisiert; keine unabhängige juristische Gesamtprüfung behauptet. Schreibende Community-/Bewerbungs- und KI-Funktionen bleiben gesperrt. Mietvertrags-/Belegtexte und Dienste sind damit nicht für verbindliche Onlinebestellungen freigegeben. |
| Veröffentlichung | Seit 8. Oktober öffentlich per HTTPS auf der neuen Hetzner-VM; App-Release `d93f932` seit 16:39 UTC bestätigt. 1.276 Tests lokal/Linux bestanden; bekannter externer DE-Handzettel-Fehler gesondert offen. Änderungen benötigen Linux-Neubuild und versionierten Release, nicht nur Git-Push. Kein SMTP-/Zahlungsbetrieb. |

## Bestätigte Mietregeln (Preisberechnung aktiv, verbindlicher Bestellbetrieb deaktiviert)

- Listenpreise inklusive Mehrwertsteuer je drei Werktage; konkreter Steuersatz noch offen.
- Jeder angefangene Dreierblock vollständig: Kühlanhänger 150 € für 1–3, 300 € für 4–6 und 450 € für 7–9 berechnete Werktage.
- Montag–Samstag ohne Sonntage und gesetzliche NRW-Feiertage. Abhol-/Rückgabetag jeweils vollständig, sofern Werktag; identisches Datum einmal. Kalender in Europe/Berlin maßgeblich.
- Verbindliches Kundenangebot; Vertrag erst durch ausdrückliche Marktannahme nach Verfügbarkeitsprüfung. Automatische Eingangsbestätigung ist keine Annahme.
- Aktuell bestätigt: Zahlung bei tatsächlicher Abholung, keine Kaution, nur Selbstabholung am vereinbarten Tag 09–19 Uhr. Reservierungen führt der Markt in seiner Mietdatei. Onlinezahlungen und automatisierte Belege erst später mit eigener WWS-API.
- Anteilsregel ausschließlich bei verspäteter Rückgabe: bestätigtes Kühlanhänger-Beispiel 150 € bis Tag 3, 200 € an Tag 4, 250 € an Tag 5, 300 € an Tag 6. Keine Änderung der regulären Buchungsblöcke und noch keine automatische Nachberechnung.

Historischer Umsetzungsstand: Der Betreiber hatte Bestellung → Marktannahme → Zahlungslink oder Barzahlung → statusgerechte Belege zur Implementierung freigegeben. Kalenderfehler und NRW-Feiertage sind im zeitzonenunabhängigen Mietkalender mit Regressionstests behoben. Ablauf und Betriebsgrenzen stehen im [Miet-Runbook](RENTAL-ORDER-RUNBOOK.md). Das ist keine Freigabe zum Live-Mietbetrieb. Am 8. Oktober ist nur die Informationsseite mit Anfrageweg veröffentlicht; `RENTAL_MODE=disabled` bleibt gesetzt. Ein späterer verbindlicher Betrieb benötigt separate fachliche Abnahme, Dienstekonfiguration und konkrete Freigabe. Es wurden für die Liveschaltung keine echten Zahlungen ausgelöst oder E-Mails versendet.

## Wochenwerbung und Betrieb

Vorgegeben: Sonntag 17:00 Europe/Berlin für die Folgewoche und täglich 06:15 zur Kontrolle. Die bestehenden Codex-Aufgaben bleiben lokal und benötigen eingeschalteten Mac und laufende App. Die Liveschaltung richtet keinen unabhängigen Canva-/Instagram-Import und keinen Server-Canva-Cron ein.

Am 5. Oktober zusätzlich als aktiv geprüft: Gewinnspielkontrolle am **1. jedes Monats um 18:00 Europe/Berlin**, nach [Gewinnspiel-Runbook](GIVEAWAY-UPDATE-RUNBOOK.md). Die bestehenden Wochen-/Tagesaufgaben bleiben unverändert. Auch diese Monatsaufgabe benötigt Mac und Codex-App; keine dauerhafte Canva-Anmeldung garantiert.

Live-Inhaltsstand vom 8. Oktober: Daten für DE/NL **05.–10.10.2026**, 128 Original-Angebotsblöcke (107 DE, 21 NL). Die frühere Tagesabnahme war erfolgreich; am Nachmittag sind die externen deutschen PDF-/Coverlinks ausgefallen. NL bleibt geprüft. Der freigegebene eigene Wochenpaket-Veröffentlichungsweg ist vorbereitet, noch nicht umgesetzt. Abgelaufene Ausgaben werden nicht verlängert. Für die Folgewoche sind neue geprüfte Quellen erforderlich; nach Prüfung/Commit folgen Linux-Neubuild, neuer Release und öffentliche Kontrolle. Die Datumsumschaltung funktioniert nur für bereits vollständig bereitgestellte gültige Pakete, nicht für bloß lokal vorbereitete oder gepushte Daten. Niemals im laufenden `current` editieren.

Historischer Inhaltsstand vom 1. Oktober (nicht durch den redaktionellen Auftrag vom 5. Oktober erneut verifiziert; neuere Einzelberichte unter `audit/content-runs/` beachten):

- DE KW40: offizielles Original **28.09.–02.10.2026** vorhanden und geprüft; nicht bis Samstag verlängern.
- NL KW40: verpflichtender Canva-Einseiter fehlt. Gefundene Seite **05.–10.10.2026** ist KW41, kein Ersatz.
- Lauf `failed`, `websiteVerified=false`, `deploymentVerified=false`. Gültige DE-Werbung bleibt unabhängig davon sichtbar.
- Canva-Anmeldung laut diesem Lauf nicht der aktuelle Blocker; genaue NL-Quelle fehlt.

Nachweise: [Tagesbericht](../audit/content-runs/2026-10-01-daily-evidence.json), [Runbook](CONTENT-UPDATE-RUNBOOK.md). Frühere lokale HTTP-Antworten beweisen keine jetzige Serververfügbarkeit.

## Nächste Schritte in Reihenfolge

1. Aktuellen Stand, private Originale und bestehende lokale Änderungen sichern.
2. [Aktuelle Betreiberantworten](DECISIONS-2026-10-08.md) beachten. Newsletter sonntags 19 Uhr von vorhandenem `info@trinkgut-jammers.de`; Bewerbungen an die Marktadresse für alle dort Berechtigten; zwei Stellenanzeigen gefunden. [Datenschutz-/Löschentwurf](privacy/2026-10-08-datenschutz-loeschkonzept-entwurf.md) und [Jobs-Inhalte](privacy/2026-10-08-jobs-inhaltsvorbereitung.md) vorbereitet, Dienste noch nicht aktiv.
3. Den verbindlichen Mietablauf nur bei gesondert gewünschter späterer Aktivierung gemeinsam abnehmen; bis dahin bleibt ausschließlich der Anfrageweg aktiv. Bestätigte Kalender- und Dreierblockregeln sind umgesetzt.
4. Fehlende Originale zuordnen, geeignete Bilder kuratieren und Desktop/Mobil prüfen.
5. Newsletter-/Bewerbungsversand und geschützte Uploads technisch konkretisieren. WWS-/Zahlungs-/Rechnungsfragen ausdrücklich zurückgestellt, jetzt nicht erneut pauschal abfragen.
6. Echte Anbieter- und Versandtests nach sicherer Konfiguration und konkreter Freigabe durchführen. Kostenpflichtige Dienste und Livezahlungen nicht aus der Codefreigabe ableiten.
7. Den bestätigten HTTPS-Informationsbetrieb erhalten, kommende Wochenpakete geprüft als neue Linux-Releases ausliefern und öffentliche Nachweise je Release erneuern. Eine unabhängige Server-Redaktion oder verbindlichen Mietbetrieb nur als separat freigegebenen Ausbau behandeln; beides ist durch die Liveschaltung nicht eingerichtet.

## Dokumentation und Sicherung

- [Hetzner-Liveschaltung vom 8. Oktober](audits/2026-10-08-hetzner-launch.md): Runtime-Release, Betreiberfreigaben, Linux-Prüfungen, öffentliche HTTPS-/Inhaltsnachweise und ausdrücklich begrenzter Informationsbetrieb. [Content-Abnahme](../audit/content-runs/2026-10-08T12-17-20-982Z-check-70665b13.json) mit beiden gültigen Handzetteln und bestätigter öffentlicher Bereitstellung.
- [Instagram-Cover-Freigabe vom 5. Oktober](audits/2026-10-05-instagram-giveaway-covers.md): sechs fehlende Originalcover nach ausdrücklicher Betreiberfreigabe eingebunden, ohne Gestaltungsänderung. 975 Tests, TypeScript, Assetprüfung und Produktionsbuild erfolgreich; vollständiges mobiles Poster im In-App-Browser geprüft.
- [Redaktion und Navigation vom 5. Oktober](audits/2026-10-05-editorial-refresh.md): 39 Cocktailfotos, Oktoberaktionen, kompakte Wissensnavigation und Monatsaufgabe. 967 Tests, TypeScript und Build mit 228 Seiten bestanden; 91 betroffene Routen sowie Desktop/Mobil geprüft. Offene Bildfreigaben und Quellenlücken ausdrücklich dokumentiert.
- [Forensische Folgeprüfung vom 1. Oktober](audits/2026-10-01-forensic-followup.md): konkrete Fehler bei Wiederholungen, Annahme, Versand, Konfigurationsfreigabe und öffentlicher Bedienung repariert; lokale Vollprüfung und bekannte Inhalts-/Live-Grenzen dokumentiert. Zeitlich begrenzte Folgeprüfungen während der Abwesenheit bis 19:32 Europe/Berlin eingerichtet; kein Serverbetrieb daraus abgeleitet.

- [Aktuelle Entscheidungen](DECISIONS-2026-10-08.md) haben Vorrang; [Offene Fragen](OFFENE-FRAGEN.md) bleibt die historische 30-Fragen-Liste, nicht erneut komplett abfragen.
- [Nächste Arbeitsschritte](TODO-NAECHSTE-SESSION.md): aktuelle Checkliste.
- [Synchronisationsbericht](audits/2026-10-01-project-sync.md): Sicherungsumfang und Verifikationsgrenzen.
- GitHub sichert versionierte Projektdateien. Ignorierte Canva-Rohoriginale/private Herkunftsnachweise nur lokal sichern, nicht öffentlich hochladen.
- Historische Prüfberichte nicht rückwirkend ändern oder als heutige Abnahme ausgeben.
