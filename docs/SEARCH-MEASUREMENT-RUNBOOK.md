# Suchmaschinen und Sichtbarkeit prüfen

Dieses Verfahren prüft die technische Auffindbarkeit, lokale Geschäftsdaten und tatsächliche Suchleistung von Trinkgut Jammers nach dem freigegebenen Suchoptimierungsrelease. Tag 0 ist die öffentliche HTTPS-Abnahme des neuen Releases, nicht dessen Git-Commit oder lokaler Build. Spätere Rankings, Rich Results und Antwortzitate werden erst anhand tatsächlicher Beobachtungen bewertet.

## Technische Kontrolle

Im vorgesehenen Worktree zuerst Git-Zustand und AGENTS.md lesen; fremde Änderungen erhalten. Die folgenden Prüfungen lesen ausschließlich die öffentliche Website und vorhandene lokale Quellen:

```sh
npm run offers:check
npm run content:check -- --url https://trinkgut-jammers.de
npm run audit:search -- --url https://trinkgut-jammers.de
npm run audit:public -- --url https://trinkgut-jammers.de
```

Die Suchprüfung verlangt jede Sitemap-URL mit eigenem Canonical, alle 180 vollständigen Lektionen, 65 Rezepte mit ihren wirklichen Zutaten und Fotos, 245 passende Quellenansichten, drei bestätigte öffentliche Stellenseiten mit E-Mail-Bewerbung sowie die bestehende Sperre des Bewerbungs- und Mietbetriebs. `JobPosting` bleibt bewusst aus, solange das ursprüngliche Anzeigendatum und vollständige Tätigkeiten/Anforderungen nicht belegt sind; „ab sofort“ ist ein Arbeitsbeginn, kein Veröffentlichungsdatum. Fehlende Quelle, ungeprüfter Inhalt oder aktivierter Upload ist kein bestandener Suchabschluss. Wöchentliche Inhalte folgen unabhängig dem CONTENT-UPDATE-RUNBOOK; ab Sonntag 16 Uhr ist die vollständige, datumsbeschriftete Folgewoche sichtbar.

`data/editorial/page-updates.json` enthält ausschließlich belegte wesentliche Inhaltsänderungen. Bei einer neuen Wochenveröffentlichung das tatsächliche Änderungsdatum für Startseite, Angebote, Sortiment, NL und betroffene Warengruppen festhalten. Bei identischem Material nicht ändern. Akademie-/Rezeptdaten stammen aus den tatsächlichen Quellenabgleichen, Stellen aus ihrem wirklichen Veröffentlichungsdatum. Keine Buildzeit, Abrufzeit oder zukünftige Preisgültigkeit als Inhaltsänderung ausgeben. Bei fachlicher Änderung Quellenabgleich und Datum entsprechend erneuern.

## Google und Bing

Die Hauptproperty ist jeweils `https://trinkgut-jammers.de/`. Eigentum über die vom angemeldeten Dienst vorgegebene lokale HTML-/XML-Datei bestätigen; keine DNS- oder Mailänderung und keine fremden Eigentümer hinzufügen. Erst nach tatsächlichem öffentlichem Datei-GET und erfolgreicher Bestätigung die vollständige `https://trinkgut-jammers.de/sitemap.xml` übermitteln. Erfolg bedeutet die sichtbare Annahme im Dienst, nicht nur eine abrufbare Sitemap. Fehlende Verarbeitung oder Zugriffsrechte als solchen Status festhalten; fehlende Zahlen sind nicht null.

Nach jeder Messung Datum, Property, verfügbare Zeitraumgrenzen, Suchtyp, Länder-/Sprachfilter, exportierte Aggregate und verwendete Vergleichsperiode sichern. Konto-E-Mails, Zugriffstoken, private URLs und Einzelkontakte gehören nicht in GitHub oder den öffentlichen Bericht. Kein Analytics-Tracking, Consent-Dienst oder kostenpflichtiges Werkzeug wird durch diesen Ablauf aktiviert.

## Vergleichsgruppen

Landingpagegruppen getrennt betrachten: Markt/Besuch (`/`, `/kontakt`, `/nl`), Wochenangebote (`/angebote`, `/produkte`, Warengruppen), Party/Miete, Akademie, Cocktailrezepte und Karriere. Die unterschiedlichen Angebotswochen, neue URLs, Saisonalität und weitere Änderungen bei der Interpretation nennen. Neue Seiten haben keinen erfundenen historischen Nullwert.

Für wiederholbare lokale Stichproben dieselben Fragen verwenden: „Getränkemarkt Goch“, „Trinkgut Jammers Goch“, „Getränke Angebote Goch“, „Zapfanlage mieten Goch“, „dranken kopen Goch“, „aanbiedingen drank Goch“, „Trinkgut Jammers openingstijden“ und „drankenwinkel vlak bij Nederland“. Suchort, Sprache, Gerät und beobachtete Ergebnisart festhalten; persönliche Suchergebnisse sind keine allgemeine Position. Unternehmensprofil separat auf bestätigten Namen, Jurgensstraße 20, 47574 Goch, Mo–Sa 08–20 Uhr, Telefon und eigenen Website-Link prüfen. Bestehendes Profil verwenden, kein Duplikat erstellen. Profilstatistiken nur aus einem tatsächlich zugänglichen Originalexport übernehmen.

## Kontrollen nach der Veröffentlichung

| Zeitpunkt | Prüfumfang |
| --- | --- |
| Tag 7 | Sitemapannahme, Indexierung/Ausschlüsse, gewählte Canonicals, Crawl-/404-/308- und Schemafehler. Technischen HTTP-Audit wiederholen und Herkunft jeder Zahl festhalten. |
| Tag 28 | Impressionen, Klicks und CTR nach Landingpagegruppe sowie DE/NL getrennt; nur vollständige gleich lange Zeiträume vergleichen. Indexierte neue Seiten und echte Profilinteraktionen prüfen. |
| Tag 90 | Stabile Indexierung, wichtige Suchfragen, angebotene Besuchsaktionen und verfügbare Feld-CWV bewerten; Änderungen nach belegter Wirkung priorisieren. |

Performance nur mit demselben Gerät-/Viewport-/Netz-/Cacheprotokoll vergleichen. Labormessungen nicht als Feld-CWV bezeichnen. Für Antwortmaschinen wenige feste Fragen wie „Wo kann ich in Goch Getränke und eine Zapfanlage für eine Feier bekommen?“ und „Waar kan ik in Goch drank kopen en welke aanbiedingen gelden deze week?“ mit Datum, Produkt/Version, vollständiger Frage und tatsächlicher Antwort dokumentieren. Ein einzelnes Zitat ist keine repräsentative Sichtbarkeitsquote oder kausale SEO-Wirkung.

Die einmaligen Folgekontrollen laufen über die Codex-App im bestehenden Chat. Der Mac, die App und erforderliche Anmeldung müssen verfügbar sein. Kein Server-Cron, keine tägliche Ersatzautomation und keine Reaktivierung pausierter Werbeaufgaben. Nur neue erhebliche Fehler, notwendiger Zugriff oder die jeweilige abgeschlossene Messung melden. Eine notwendige Anmeldung einmal konkret benennen; unverändert fehlenden Zugang nicht täglich erneut melden. Nach der dritten Kontrolle endet diese Nachmessung.

Gespeicherte Termine nach der Abnahme vom 12.10.2026: 19.10.2026, 09.11.2026 und 10.01.2027 jeweils 14 Uhr Europe/Berlin; jede Aufgabe läuft einmal. Google/Bing-Eigentum ist bestätigt und die Sitemap eingereicht. Bing verarbeitet; Googles anfänglicher Sitemap-Abrufstatus war fehlerhaft, während der eigene Live-Test am 12.10. um 13:36:17 den erfolgreichen Abruf bestätigt hat. In der Nachkontrolle den tatsächlichen Verarbeitungsstatus neu lesen; nicht den erfolgreichen Live-Test als abgeschlossene Sitemap-Verarbeitung oder Indexierung ausgeben.

## Zuständigkeit externer Einträge

Am 12.10.2026 wurde das bestehende bestätigte Google-Unternehmensprofil im zuständigen Betreiberkonto geöffnet. Adresse, Telefonnummer und Öffnungszeiten passen zu den bestätigten Angaben. Der bisherige Website-Link zeigte auf die Trinkgut-Marktplattform; die Änderung auf `https://trinkgut-jammers.de/` wurde eingereicht und anschließend in der Kontaktansicht ohne ausstehenden Prüfhinweis als gespeicherter Website-Link bestätigt. Keine anderen Profildaten wurden verändert. Die öffentliche Trinkgut-Marktplattform führt Telefonnummer und Öffnungszeiten passend, verwendet aber die Kurzschreibweise „Jurgenstr.20“ und zeigt keinen Link zur eigenen Website. Eine Änderung dieser fremden Plattform benötigt deren Verwaltungszugang; ohne Zugang nicht als erledigt ausgeben und keine Nachricht eigenmächtig versenden. Referenz: [Trinkgut Markt Jammers](https://www.trinkgut.de/markt/jammers).
