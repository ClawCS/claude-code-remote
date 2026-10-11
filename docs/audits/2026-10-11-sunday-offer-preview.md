# Vollständige Sonntagsvorschau – 11.10.2026

## Auftrag und Ursache

Betreiberfreigabe: „jop direkt umsetzen als regel“. Die geprüfte Folgewoche soll ab Sonntag 16:00 Europe/Berlin nicht nur als PDF/Cover, sondern vollständig als Einzelangebote im Sortiment und in den Warengruppen sichtbar sein. Die vorige Veröffentlichung hatte nur die Flyer vorgezogen; serverseitige Angebotsauswahl und Clientfilter verlangten weiterhin den tatsächlichen Montag. Deshalb blieb das Sortiment am Sonntag leer, obwohl das vollständige KW42-Paket bereits vorhanden war.

## Änderung

- Gemeinsames Wochenfenster für Flyer und sämtliche Angebote; für jede zukünftige Karte sichtbar „Vorschau · gültig ab Montag“.
- Montag entfällt nur der Vorschauhinweis. Gedruckte Gültigkeit, Hash-/Quellenbindung und Ablauf bleiben unverändert.
- Maasduinen-Zusatzanzeigen ausschließlich in ihrem eigenen tatsächlichen Zeitraum; fehlender Quellentyp erlaubt keine vorgezogene Anzeige.
- Content- und unabhängiger HTTP-Prüfer verlangen jetzt auch sonntags den vollständigen Angebotsumfang; fehlende, unsichtbare und nach Montag verbliebene Vorschauhinweise werden erkannt.
- Bestehende Sonntagsaufgabe: 16:00 ACTIVE, Prompt entsprechend erweitert. Tageskontrolle: 06:15 unverändert PAUSED. Keine zusätzliche Automation, kein Server-Cron; Quellenimport bleibt Mac-/Codex- und zugangsabhängig.
- Keine Originale neu importiert oder bearbeitet: KW42 weiterhin 70 DE + 12 NL, gültig 12.–17.10.2026. Historische 128 KW41-Angebote bewahrt.

## Prüfungen vor Veröffentlichung

Die neuen Tests reproduzierten zunächst vier leere Server-/Client-/UI-Ausgaben sowie zwei fehlerhafte Content-Checks und einen unvollständigen unabhängigen Sonntags-Census. Nach Korrektur bestanden die fokussierten Tests. Die vollständige lokale Web-Suite bestand mit 2.226 Tests in 117 Dateien; native Bewerbungsdienste und private Scratch-Verzeichnisse ausdrücklich ausgeschlossen. Lint, Next-Typgenerierung, TypeScript, 210 Originalangebote/-bilder und Produktionsbuild bestanden, nach abschließender Kontrastkorrektur sämtlich frisch erneut ausgeführt.

Isolierter Browser-Zeitgrenzentest: vor Sonntag 16 Uhr keine Angebote; ab 16 Uhr Angebot und Vorschauhinweis; Montag gleiche Angebote ohne Hinweis; ältere asynchrone Antworten überschreiben keine neueren; nach Ablauf keine Angebote. Sommer-/Winterzeitgrenzen sind zusätzlich per Unit-Test abgedeckt. Nur der isolierte Testserver verwendet eine explizite Testuhr; Produktion und öffentliche Abnahme verwenden echte Zeit.

Der echte Produktionsbrowser fand zunächst 4,27:1 Kontrast beim neu hinzugefügten Hinweis. Ein Axe-Regressionstest scheiterte reproduzierbar, anschließend bestand er mit dem vorhandenen dunklen Burgunder-Farbtoken. Kein allgemeiner Designumbau. Ein verlorener Sprachfilter-Klick in der lokalen Entwicklungsansicht wurde unabhängig als Klick vor abgeschlossener React-Initialisierung bestätigt; nach Initialisierung funktioniert der Filter. Die Browserabnahme wartet nun auf die erste Laufzeit-API-Antwort.

Unabhängige Codeprüfung und gesonderte Prüfung des Release-/Rückrollskripts ohne blockierenden Befund. Nicht-blockierender redaktioneller Hinweis: Die bestehende Sortiment-Metabeschreibung verwendet weiterhin „gültigen“ Handzetteln; im sichtbaren Inhalt kennzeichnet jede zukünftige Karte die Vorschau. Keine Erweiterung des Auftrags dafür.

Die unveränderte Rückrollfunktion wurde in einem eigenen temporären Serververzeichnis mit simuliertem Dienstneustart geprüft: ursprüngliches Ziel wiederhergestellt, Fehlerstatus erhalten, echter Dienst unberührt. Das Release prüft vor Umschaltung freien Platz, vorheriges Releaseziel, Archivhash und neun Sicherheitskonfigurationshashes. Keine Bereinigung alter Releases vorgesehen.

## Bereitstellung

Desktop-/Mobilabnahme des korrigierten lokalen Produktionsbuilds auf 390 und 1440 Pixeln bestanden: 82 Karten und 82 Vorschauhinweise, Filter DE 70/NL 12/alle 82, sechs Warengruppen (Bier 23, Sekt 2, alkoholfrei 26, Wein 9, Spirituosen 18, Lebensmittel 4), keine horizontalen Überläufe, keine Browserfehler, keine Befunde für die geprüften Axe-Regeln Kontrast/Alt-Texte/Link- und Buttonnamen. Angebotsbild dekodiert, beide Ansichten visuell geprüft. Lokale Haupt-Devroute ebenfalls mit 82 Karten/82 Hinweisen bestätigt und nicht gestoppt.

**Live:** App-Release `6314600b83915127bb0d570e3f1a5a3d1455ccd0`, erfolgreiche Bereitschaftsprüfung am 11.10.2026 um **20:06:04 UTC / 22:06:04 Europe/Berlin**. Vorheriger unveränderter Release `fbb4d0c80169ac9ad15a686ad0b5a8123c1752ce` ist das Rückrollziel. Archiv SHA-256 `9c2971ef8c2f02280c0ab6fb849c3663dc2d823313d86cf039cad96e5054919d` vor Extraktion geprüft; frischer Linux-Build des exakten gepushten Commits, kein Edit im laufenden Release.

Linux-Webteilprüfung auf Node 22.23.3: **2.191 Tests in 114 Dateien**, Lint, Routentypen, TypeScript, 210 Originalangebote und Produktionsbuild erfolgreich. Die drei explizit im Runbook ausgeschlossenen Chromium-Testdateien sind im vollständigen lokalen Weblauf enthalten; keine zusätzlichen Ausschlüsse. Neun Sicherheitskonfigurationshashes vor/nach unverändert. Nach dem kurzen Neustart zunächst erwartbar noch keine Verbindung; die begrenzte Bereitschaftswiederholung bestand, kein Rückrollen erforderlich. Miete und Bewerbung weiterhin deaktiviert.

### Tatsächliche öffentliche Prüfung

- Normale Inhaltsprüfung auf `https://trinkgut-jammers.de`: `status:ok`, keine Fehler/Warnungen, `websiteVerified:true`, `deploymentVerified:true`, abgeschlossen 20:06:30 UTC.
- Feste Zielwoche 12.10.2026: dasselbe Ergebnis um 20:06:39 UTC; echte Sonntagszeit, kein `--now` und keine Produktions-Testuhr.
- Öffentliche APIs, Flyerflächen, vollständige Originale/Cover/Kacheln mit tatsächlichem GET und Typ-/Byte-/Hashabgleich bestanden. 82 Angebote (70 DE, 12 NL); Druckgültigkeit 12.–17.10. unverändert.
- Unabhängiger HTTP-Lauf: **289 Seiten, 2.618 lokale Ressourcen, 31 API-Verträge**, fünf erwartete unbekannte 404-Seiten, null Fehler/Warnungen. 2.150 externe Links nicht flächendeckend abgerufen.
- Aktuelle Gewinnspielcover: 18 Original-/Varianten-GETs, null Befunde.
- Öffentlicher Chromium-Browser, 390/1440 Pixel: 82 Karten/82 Vorschauhinweise, Sprachfilter 70/12, alle sechs Warengruppen wie oben, keine Überläufe/Browserfehler; geprüfte Axe-Regeln ohne Befund. Beide Screenshots visuell geprüft.
- Weitere neun öffentliche Browserfälle: Film-/Reduced-motion-/Save-data-Verhalten, gleichwertige vollständige DE/NL-Covers und sechs Eigenmarkenposter bestanden. Zusätzlich mobile/desktop Filmquelle sowie Abspielen/Pausieren auf 390/1440 Pixel erfolgreich geprüft.
- Nur die beiden eigenen Testserver beendet; vorhandenen Entwicklungsport 3000 bewahrt. Nur das eigene temporäre Uploadarchiv nach öffentlicher Abnahme entfernt, keine alten Releases gelöscht. Danach 1.960.443.904 Bytes frei. Vor einem weiteren Release freien Platz erneut prüfen und gegebenenfalls spezifische Bereinigungsfreigabe einholen.

`npm ci` meldet weiterhin fünf hohe Paketeinträge derselben bekannten Entwicklungsabhängigkeitskette `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` (S-01 im Projektaudit, eine DoS-Warnung). Frischer unabhängiger Produktions-Abhängigkeitsaudit mit `--omit=dev`: null gemeldete Advisories. Keine Abhängigkeitsänderung und keine allgemeine Sicherheitsgarantie daraus ableiten.

## Grenzen

Keine Sicherheits-, DNS-, Mail-, Miet-, Zahlungs-, Bewerbungsupload- oder Löschaktivierung. Fremde Screenshots, bestehender Bewerbungsbericht und private Quellen unverändert. Keine Behauptung einer vollständigen nativen Bewerbungsqualifikation oder einer Live-Bestands-/WWS-Anbindung.
