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

Noch ausstehend zum Zeitpunkt dieses Vorbereitungscommits: frischer Linux-Release und tatsächliche öffentliche HTTPS-Prüfung. Ein lokaler Test oder Git-Push ist kein Veröffentlichungsnachweis. Dieser Abschnitt wird nach der öffentlichen Abnahme mit Commit und Zeit ergänzt.

## Grenzen

Keine Sicherheits-, DNS-, Mail-, Miet-, Zahlungs-, Bewerbungsupload- oder Löschaktivierung. Fremde Screenshots, bestehender Bewerbungsbericht und private Quellen unverändert. Keine Behauptung einer vollständigen nativen Bewerbungsqualifikation oder einer Live-Bestands-/WWS-Anbindung.
