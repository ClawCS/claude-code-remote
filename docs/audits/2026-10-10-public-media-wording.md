# Öffentliche Medienbeschriftungen – 10. Oktober 2026

## Auftrag und Grenze

Niko verlangt keine sichtbaren technischen Generierungsbezeichnungen auf der Website, insbesondere keine Beschriftung „KI-generiertes Themenbild“ unter Akademiebildern. Umsetzung auf Basis `d015e06b8c13f99108eae2341cee86648328b8bf`, ausschließlich in der lokalen Designvorschau. Keine Veröffentlichung auf Hetzner, keine Betriebs-/Upload-/Mailaktivierung und keine neue Videoerstellung.

## Änderung

- Akademieübersicht und alle acht Kursseiten ohne Generierungs-Bildunterschriften. Aussagekräftige Alt-Texte beschreiben weiterhin das jeweilige Motiv.
- Film, Leihartikel, Anfrageliste und Stellenanzeigen mit neutraler Wortwahl. Film bleibt illustrative, nicht dokumentarische Werbung; Leihartikel behalten den Hinweis auf abweichende Modelle; Anzeigen werden nicht als Teamfotos ausgegeben.
- Pausierte Foto-/Chatfunktionen, Datenschutz und die unveränderten Verarbeitungswarnungen des Bewerbungsformulars ohne technische Generierungsbegriffe. Die drei Legacy-POST-Routen bleiben `503`/`no-store`.
- Zwei Lerntextbegriffe werden als computergestützte bzw. digitale Technologien beschrieben; keine neue fachliche Aussage und kein Kursumbau.
- Originalmedien, Assets, interne Prompts, Herkunftsmanifeste, Hashes und maschinenlesbare Provenienz unverändert. Der nicht importierte Altbaustein `AIAssistant` bleibt unangetastet; seine Zeichenketten erscheinen nicht auf der aktuellen Website.

## Nachweise

- Test-first: sieben passende Render-Assertions zunächst rot; anschließend acht fokussierte Suites mit 113 Tests grün, einschließlich Originalmedien-/Hash- und deaktivierter Bewerbungs-Verträge.
- Abschließender vollständiger Weblauf: **99 Suites / 1.640 Tests bestanden**.
- TypeScript bestanden; ESLint null Fehler und 21 bereits bestehende Warnungen. Produktionsbuild mit echter Uhr und ohne Fixture-Flags: 120 statische Seiten erzeugt.
- Produktionsbrowser: zwei Bewerbungs-Darstellungstests bestanden. Alle Bewerbungs-API-Antworten dabei synthetisch im Browser abgefangen; kein echter Versand oder Upload.
- Je 16 betroffene Seiten auf Port 3000 und 3110: HTTP 200, keine alten Begriffe im ausgelieferten HTML. Drei lokale Legacy-POST-Prüfungen bestätigen weiter 503/no-store und neutrale Fehlermeldungen.
- Echte Browseransicht des Whisky-Kurses: keine Beschriftung unter dem Motiv, keine entsprechenden Begriffe im sichtbaren Text oder Alt-/ARIA-Beschreibungen. Nachweis: `audit/screenshots/public-media-wording-2026-10-10/academy-whiskey.png`.
- Unabhängige Read-only-Prüfung des begrenzten Diffs und der nachgeführten Text-Hash-Tests ohne konkrete Beanstandung. Keine Aussage zur rechtlichen Kennzeichnungspflicht.

## Testgrenzen

Der parallel gestartete Gesamtprojektlauf endete mit 145 bestandenen und zwei fehlgeschlagenen Suites: 3.202 Tests bestanden, zwei Datenschutz-Sollhashes noch auf dem alten Wortlaut, 15 native Rekonstruktionsfälle wegen fehlendem Poppler 26.10.0 nicht ausgeführt. Für den Datenschutz wurde bytegenau geprüft, dass ausschließlich zweimal `an KI-Anbieter übertragen` durch `an externe Analyseanbieter übertragen` ersetzt wurde. Nur diese beiden Sollhashes wurden angepasst; danach bestanden die 113 fokussierten und alle 1.640 Webtests erneut. Hashverfahren, exakte Vergleiche und übrige eingefrorene Texte unverändert. Die native Voraussetzung wurde nicht installiert oder umgangen; kein vollständig grüner Gesamtprojektlauf und keine Freigabe des Bewerbungsuploads behauptet.

Die lokale Produktionsvorschau wurde neu gestartet. Der alte Prozess gab bei seiner Beendigung noch `NoFallbackError` aus; der anschließend neu gestartete Prozess lieferte die geprüften 16 Seiten erfolgreich. Keine Aussage über eine allgemeine Behebung früherer Entwicklungsserverfehler.

## Bereitstellung

Lokale Vorschau: `http://127.0.0.1:3110/akademie/whiskey`. Entwicklungsserver auf Port 3000 ebenfalls geprüft. Öffentliche Website unverändert; Git-Synchronisierung ist keine Live-Veröffentlichung. Fremde Screenshots, ältere Content-Laufberichte und der fremde Bewerbungs-Zwischenbericht wurden nicht geändert oder eingecheckt.
