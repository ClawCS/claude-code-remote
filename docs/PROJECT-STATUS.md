# Trinkgut Jammers Projektstand

Stand: 5. Oktober 2026. Navigation, Gewinnspiele und Cocktailfotos wurden gezielt aktualisiert; Mietbetrieb und Wochenwerbung wurden dabei nicht erneut vollständig abgenommen. Diese Datei ersetzt die überholten Shop-, Team- und Importangaben der früheren Projektübersicht. Frühere Prüfberichte bleiben als datierte Historie erhalten.

Der Betreiber hat ausdrücklich bestätigt: **Der öffentliche Server ist noch nicht online.** Lokal und GitHub sichern den Projektstand, nicht seine Veröffentlichung. `data/editorial/source-config.json` enthält weiterhin `publicUrl: null`.

## Verbindlicher Arbeitsort

- Arbeitsverzeichnis: `/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production`
- Branch: `codex/cinematic-production`
- GitHub: `https://github.com/ClawCS/claude-code-remote`, derselbe Branch.
- Der übergeordnete Checkout steht auf `codex/p1-design-directions` und ist nicht der aktuelle Produktionsarbeitsstand. Keine Branches oder Worktrees eigenmächtig wechseln oder überschreiben.
- Der früher genannte Claude-Code-Pfad ist archiviert. Ein Pull erfolgt im aktiven Arbeitsverzeichnis.
- Tech-Stack laut `package.json`: Next.js 16.3.7, React 19.2.4, TypeScript und Tailwind CSS 4.

## Umsetzung und Grenzen

| Bereich | Aktueller Stand |
| --- | --- |
| Gestaltung | Warmer, rot geprägter Marktauftritt; die frühere dunkle Inszenierung ist nicht die freigegebene Gestaltungsrichtung. |
| Navigation | „Rezepte & Wissen“ bündelt Cocktail-Rezepte und Getränkeakademie ohne zusätzlichen Hauptreiter. Akademie-Einstiege im Sortiment und passende Kurslinks in Warengruppen; Desktop/Mobil am 5. Oktober geprüft. Rot, Hero und grundlegende Struktur erhalten. |
| Team | Acht aktive Einzelprofile: Niko, Sven, Jasmin, Gabriella, Jan Niklas, Hanna, Henri und Hannah. Nur Namen als Beschriftung. Nils, Nico und Tim aus den aktiven Einzelprofilen entfernt; Gruppenfoto ausdrücklich behalten. |
| Ausschlüsse | Harpe und Justin dürfen nicht in aktiven Motiven erscheinen. Unbeschriftete Bilder benötigen noch Betreiberzuordnung; keine Identifikation anhand von Gesichtern behaupten. Historische/private Quellen nicht gelöscht. |
| Canva | Lesefunktion und angemeldete Ansichten am 5. Oktober erreichbar. Originale bleiben unverändert. Neue Fotos benötigen belegte Canva-Herkunft und passende Rubrik; ausdrückliche Ausnahme nur für geprüfte externe Cocktailfotos. |
| Gewinnspiele | Everdure KILN R Staropramen (bis 31.10.) und Disaronno Liegestuhl + Flasche (bis 18.10.) anhand der Oktober-Originalposts ergänzt. Neun vollständige Canva-Cover vorhanden. März/grüne Monster-Version, August, September, Guinness und beide Oktoberaktionen warten auf exakte Canva-Zuordnung oder die angefragte begrenzte Instagram-Ausnahme. Sechs Originalbilder privat vorbereitet, nicht veröffentlicht. |
| Marktleben | Passende Canva-Motive und eigene Themenunterseiten vorhanden. Komplette Account-Sichtung seit Oktober 2024 nicht als abgeschlossen behaupten. Weitere geeignete Rubrikbilder und Personenfreigaben offen. |
| Cocktails | 65 Rezepte, sechs Kategorieeinstiege; 39 geprüfte reale Fotos lokal mit Quellen-/Lizenznachweisen eingebunden. 26 offen: 17 Downloads/visuelle Prüfungen nach Quellserver-Limit, neun passende Lizenz-/Rezeptvarianten. Externe Cocktailfotos am 5. Oktober ausdrücklich freigegeben, keine KI-Ersatzbilder. |
| Vermietung | 20 Artikel, davon zwölf mit zugeordnetem Listenpreis und acht auf Anfrage. Plus/Minus, Direkteingabe, Bestandsgrenzen und Überschneidungsregeln umgesetzt. Keine marktweite Live-Verfügbarkeit. |
| Warenkorb/Checkout | Mietbestellprozess umgesetzt: kanonische Bruttosummen, dauerhafte SQLite-Bestellungen, geschützte Marktannahme, anschließender Zahlungslink oder Barzahlung, PDF-Rechnung/Lieferschein und getrennte Versandwarteschlange. Lokal testbar; Live-Aktivierung bleibt ohne vollständige Betreiber-/Dienstekonfiguration gesperrt. Gemischte/unbepreiste Auswahl bleibt Anfrage. |
| GrailBid | Externer Einstieg zu `https://grailbid.com`; kein neues Shopsystem und kein behaupteter Live-Nachweis des Zielshops. |
| Recht/Daten | Riskante schreibende Community-/Bewerbungs- und KI-Endpunkte eingeschränkt. Betreiberangaben, Datenabläufe, Altbestände und Vertrags-/Belegtexte noch nicht endgültig fachlich abgenommen. |
| Veröffentlichung | Nicht online. Domain, Hosting, Versanddienste und Veröffentlichungsablauf offen. GitHub und localhost sind kein öffentlicher HTTPS-Nachweis. |

## Bestätigte Mietregeln

- Listenpreise inklusive Mehrwertsteuer je drei Werktage; konkreter Steuersatz noch offen.
- Jeder angefangene Dreierblock vollständig: Kühlanhänger 150 € für 1–3, 300 € für 4–6 und 450 € für 7–9 berechnete Werktage.
- Montag–Samstag ohne Sonntage und gesetzliche NRW-Feiertage. Abhol-/Rückgabetag jeweils vollständig, sofern Werktag; identisches Datum einmal. Kalender in Europe/Berlin maßgeblich.
- Verbindliches Kundenangebot; Vertrag erst durch ausdrückliche Marktannahme nach Verfügbarkeitsprüfung. Automatische Eingangsbestätigung ist keine Annahme.
- Gewünscht: Apple Pay, Kreditkarte, Online-Bankzahlung, Barzahlung sowie Rechnung und Lieferschein per E-Mail an Kunde und Markt. Neues Sammelpostfach angekündigt, Adresse noch offen.

Der Betreiber hat anschließend ausdrücklich die Umsetzung freigegeben: Bestellung → Marktannahme → Zahlungslink oder Barzahlung → statusgerechte Belege. Kalenderfehler und NRW-Feiertage sind im neuen zeitzonenunabhängigen Mietkalender mit Regressionstests behoben. Ablauf und Betriebsgrenzen stehen im [Miet-Runbook](RENTAL-ORDER-RUNBOOK.md). Es wurden keine echten Zahlungen ausgelöst oder E-Mails versendet. Postfach, Anbieterzugang, Steuersatz, Aussteller, Bedingungen und öffentlicher Server bleiben zu konfigurieren.

## Wochenwerbung und Betrieb

Vorgegeben: Sonntag 17:00 Europe/Berlin für die Folgewoche und täglich 06:15 zur Kontrolle. Die bisher dokumentierten Codex-Aufgaben laufen lokal und benötigen eingeschalteten Mac und laufende App. Keine unabhängige Serverautomatik eingerichtet; Umstellung noch offen.

Zusätzlich aktiv und geprüft: Gewinnspielkontrolle am **1. jedes Monats um 18:00 Europe/Berlin**, nach [Gewinnspiel-Runbook](GIVEAWAY-UPDATE-RUNBOOK.md). Die bestehenden Wochen-/Tagesaufgaben bleiben unverändert. Auch diese Monatsaufgabe benötigt Mac und Codex-App; keine dauerhafte Canva-Anmeldung garantiert.

Historischer Inhaltsstand vom 1. Oktober (nicht durch den redaktionellen Auftrag vom 5. Oktober erneut verifiziert; neuere Einzelberichte unter `audit/content-runs/` beachten):

- DE KW40: offizielles Original **28.09.–02.10.2026** vorhanden und geprüft; nicht bis Samstag verlängern.
- NL KW40: verpflichtender Canva-Einseiter fehlt. Gefundene Seite **05.–10.10.2026** ist KW41, kein Ersatz.
- Lauf `failed`, `websiteVerified=false`, `deploymentVerified=false`. Gültige DE-Werbung bleibt unabhängig davon sichtbar.
- Canva-Anmeldung laut diesem Lauf nicht der aktuelle Blocker; genaue NL-Quelle fehlt.

Nachweise: [Tagesbericht](../audit/content-runs/2026-10-01-daily-evidence.json), [Runbook](CONTENT-UPDATE-RUNBOOK.md). Frühere lokale HTTP-Antworten beweisen keine jetzige Serververfügbarkeit.

## Nächste Schritte in Reihenfolge

1. Aktuellen Stand, private Originale und bestehende lokale Änderungen sichern.
2. [Betreiberantworten](OFFENE-FRAGEN.md) einarbeiten; Empfehlungen nicht als Freigaben behandeln.
3. Den lokal implementierten Mietablauf gemeinsam abnehmen; bestätigte Kalender- und Dreierblockregeln sind umgesetzt.
4. Fehlende Originale zuordnen, geeignete Bilder kuratieren und Desktop/Mobil prüfen.
5. Mietbedingungen, Anbieter, Postfach, Steuer-/Rechnungswesen und Zusatzkosten klären; keine erneute allgemeine Implementierungsfreigabe nötig.
6. Echte Anbieter- und Versandtests nach sicherer Konfiguration und konkreter Freigabe durchführen. Kostenpflichtige Dienste und Livezahlungen nicht aus der Codefreigabe ableiten.
7. Domain/Hosting und Serverautomatik vorbereiten. Erst nach fachlicher Abnahme und tatsächlicher HTTPS-Prüfung als online beziehungsweise fertig melden.

## Dokumentation und Sicherung

- [Redaktion und Navigation vom 5. Oktober](audits/2026-10-05-editorial-refresh.md): 39 Cocktailfotos, Oktoberaktionen, kompakte Wissensnavigation und Monatsaufgabe. 967 Tests, TypeScript und Build mit 228 Seiten bestanden; 91 betroffene Routen sowie Desktop/Mobil geprüft. Offene Bildfreigaben und Quellenlücken ausdrücklich dokumentiert.
- [Forensische Folgeprüfung vom 1. Oktober](audits/2026-10-01-forensic-followup.md): konkrete Fehler bei Wiederholungen, Annahme, Versand, Konfigurationsfreigabe und öffentlicher Bedienung repariert; lokale Vollprüfung und bekannte Inhalts-/Live-Grenzen dokumentiert. Zeitlich begrenzte Folgeprüfungen während der Abwesenheit bis 19:32 Europe/Berlin eingerichtet; kein Serverbetrieb daraus abgeleitet.

- [Offene Fragen](OFFENE-FRAGEN.md): nummerngleich mit den 30 Chatfragen; unbeantwortete Punkte bleiben offen.
- [Nächste Arbeitsschritte](TODO-NAECHSTE-SESSION.md): aktuelle Checkliste.
- [Synchronisationsbericht](audits/2026-10-01-project-sync.md): Sicherungsumfang und Verifikationsgrenzen.
- GitHub sichert versionierte Projektdateien. Ignorierte Canva-Rohoriginale/private Herkunftsnachweise nur lokal sichern, nicht öffentlich hochladen.
- Historische Prüfberichte nicht rückwirkend ändern oder als heutige Abnahme ausgeben.
