# Startseite kürzen — 12. Oktober 2026

## Betreiberauftrag und Umfang

- Drei Entdeckungskarten (Marktleben, Geschenkideen, regionale Spezialitäten) von der Startseite entfernen.
- Akademie- und Cocktailteaser sowie Team-/Portraitblock von der Startseite entfernen.
- GrailBid/TCG vollständig aus der öffentlichen Darstellung und Verlinkung entfernen: Startseite, gemeinsame Navigation, NL-Seite und Datenschutznennung.
- Die übrigen Unterseiten und Menüwege, alle Originalfotos/Herkunftsnachweise, Wochenpakete, Gewinnspiele und Eigenmarken bleiben erhalten.

Keine Änderung an DNS, Mail, Sicherheitskonfiguration, Miete, Zahlungen, Uploads oder Löschung. Historische Berichte und private Originale bleiben unberührt.

## Umsetzung und bisherige Nachweise

`CinematicHome` rendert nach den Gewinnspielen unmittelbar den Instagram-Abschnitt; `AssortmentSection` beschränkt sich auf die vier Warengruppen. Der GrailBid-Abschnitt und seine URL/Styles sind entfernt. Nicht-TCG-Ziele bleiben im gruppierten Menü und Footer erreichbar.

Die aktualisierten Unit-Verträge wurden zuerst gegen den alten Stand ausgeführt: sechs erwartete Fehler bei 39 bestandenen Tests. Die zusätzliche Datenschutz-Ausschlussprüfung schlug ebenfalls vor Umsetzung fehl. Nach Umsetzung bestehen alle 46 fokussierten Tests in fünf Dateien.

Ein erster zu breit gefilterter Testaufruf erfasste versehentlich auch alte private Scratch-Kopien; diese Ergebnisse wurden nicht als Projektprüfung gewertet. Der saubere Rot-/Grünlauf und die vollständige Websuite schließen `.superpowers/**` ausdrücklich aus.

## Lokale Abnahme

- Vollständige Websuite: 2.355 Tests in 128 Dateien bestanden; native Bewerbungsdienste und private Scratch-Kopien ausdrücklich ausgeschlossen.
- Lint: null Fehler, 20 bestehende Warnungen. Next-Typgenerierung, TypeScript, alle 210 Originalangebote und Produktionsbuild bestanden.
- 43 fokussierte Chromiumfälle gegen eine isolierte Produktionsvorschau bestanden: Kürzung, Originalflyer, sämtliche erhaltenen Menüziele, Desktop/Mobil, Tastatur, JavaScript-freie Darstellung, Galerie/NL-Portraits und grundlegende axe-Prüfungen.
- Inhaltscheck der lokalen Produktionsvorschau: keine Fehler, `websiteVerified=true`; `deploymentVerified=false` und Vorschauwarnung erwartungsgemäß. Keine öffentliche Bereitstellung daraus ableiten.
- HTTP 200 auf Startseite, NL, Datenschutz und sieben erhaltenen Rubrikzielen; keine GrailBid-/Trading-Cards-/TCG-Nennung in deren ausgeliefertem HTML.
- Gleiche Chromium-Bedingungen, Schriften und Bilder geladen: Mobil (390×844) 14.742 → 10.441 px; Desktop (1440×900) 11.722 → 8.055 px Dokumenthöhe. Das sind Beobachtungen dieser Ansichten, keine feste geräteübergreifende Längen- oder Performancezusage.
- Unabhängige Produktions- und Testreview ohne kritische, wichtige oder kleinere Befunde.

Der erste vollständige Weblauf hatte drei erwartete Altvertragsfehler (alte Startseiten-Fotomotive und zwei alte Datenschutz-Textprüfsummen). Diese Verträge wurden auf die ausdrücklich beauftragte Entfernung angepasst; übrige Unterseiten-/Legal-/Portrait-/Markenabdeckung bleibt erhalten. Der frische vollständige Lauf ist grün.

Ein Entwicklungsserver-Browserlauf zeigte zusätzlich Navigationstimeouts und einmal HTTP 500. Der aufgezeichnete Fehler lautet `__webpack_modules__[moduleId] is not a function` im Webpack-Runtime der getrennten `.next-dev`-Umgebung. Eine Verursachung durch parallele Tests ist nicht bewiesen. Dieselben Fälle bestehen seriell im isolierten Produktionsbuild; spätere Entwicklungs-GETs lieferten dreimal HTTP 200. Kein spekulativer Codefix, Neustart des fremden Entwicklungsprozesses oder Konfigurationsumbau.

## Veröffentlichung

Der exakt geprüfte App-Commit `00302feabe2698929c05d46723e6c9d8b85a7d57` ist auf der bestätigten Website-VM als neuer Linux-Release aktiv. Erfolgreiche Bereitschaftsprüfung abgeschlossen am **12.10.2026, 12:21:20 UTC / 14:21:20 Europe/Berlin**. Rückrollziel bleibt `3cbce2652040f3271464bb573ac121bf1cd47a9a`.

- Linux-Webteilprüfung: 2.299 Tests / 124 Dateien bestanden; die vier lokal geprüften Chromiumdateien und die native Bewerbungsqualifikation sind auf Linux ausdrücklich ausgeschlossen. Lint, Typen, 210 Originalangebote und Produktionsbuild bestanden.
- Erste Bereitschaftsprobe traf den kurzen Dienststart und wurde innerhalb der begrenzten Retry-Regel erfolgreich wiederholt. Mietkonfiguration weiterhin `enabled:false`, `testMode:false`, `onlinePayment:false`; Bewerbungen weiterhin deaktiviert. Aktuelle Angebots-API: Status `ok`, 82 Angebote mit 82 Zusammenfassungen, 70 DE / 12 NL, unveränderte Gültigkeit 12.–17.10.2026.
- Alle neun Server-Sicherheitskonfigurationen vor/nach dem Wechsel hashidentisch. Keine Hosting-/DNS-/Mail-/Zahlungs-/Upload-/Löschaktivierung, keine alten Releases gelöscht. Nur das eigene hashgeprüfte temporäre Uploadarchiv anschließend entfernt; rund 3,56 GB frei.
- Tatsächlicher HTTPS-Inhaltscheck: Status `ok`, keine Fehler/Warnungen, `websiteVerified=true`, `deploymentVerified=true`; abgeschlossen 12:22:16 UTC. Beide Originale/Cover und alle Kacheln geladen und gegen ihre Bindung geprüft.
- Öffentlicher HTTP-Audit: 293 Seiten, 2.580 lokale Ressourcen, 31 API-Verträge und fünf unbekannte Routen geprüft; keine Fehler oder Warnungen. Externe Linkziele werden in diesem Audit nicht abgerufen.
- Gewinnspiel-Bildprüfung: 18 tatsächliche Bild-GETs, keine Befunde.
- Öffentliche Chromiumprüfung: 13/13 Fälle (vier Kürzungsverträge, neun Navigationsfälle) bei echter Zeit bestanden, ergänzt durch manuelle Startseite-/NL-/Datenschutzkontrolle. Keine Konsolenwarnungen, Browserfehler oder Seitenfehler. Desktop-/Mobilansicht geprüft; vier Warengruppenziele, fünf Hauptnavigationseinträge und die erhaltenen Unterseiten funktionieren.

Quellstand und Abschlussdokumentation sind lokal und auf GitHub gesichert. Ausführliche Logs und Screenshots liegen im privaten lokalen Evidenzbereich; fremde Screenshot-/Auditänderungen bleiben unverändert. Der reine Abschlussdokumentationscommit verändert den laufenden App-Release nicht.
