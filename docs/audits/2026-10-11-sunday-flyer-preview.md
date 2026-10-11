# Sonntagsvorschau der Wochenhandzettel

## Auftrag und Abgrenzung

Betreiberfreigabe vom 11.10.2026: Die geprüften Handzettel der Folgewoche bereits sonntags ab 16:00 Europe/Berlin veröffentlichen; KW42 jetzt sichtbar machen. DE bleibt das offizielle Goch-Original, NL das freigegebene Agenturoriginal (gerade KW: De Maas Driehoek, ungerade: Udens Weekblad). Maasduinen bleibt eine separate Canva-Zusatzreihe; konkrete Schaltwochen folgen vom Betreiber. Kein erneuter Import unveränderter KW42-Dateien.

PDF-/Cover-Sichtbarkeit ist vom gedruckten Angebotszeitraum getrennt: Sonntags eindeutig als Vorschau gekennzeichnet, unveränderte Gültigkeit 12.–17.10.2026. Einzelne Sortimentsangebote werden erst innerhalb ihrer tatsächlichen Gültigkeit aktiviert. Zusatzanzeigen behalten ihre eigene Gültigkeit. Keine Preisverlängerung, keine Ersatzausgaben, keine neuen WWS-Daten.

## Umsetzung

- Gemeinsame Auswahl für Startseite, Angebote, Handzettel, NL, Content-APIs und Legacy-DE-GET; keine neuen öffentlichen Herkunfts-/Accountdaten.
- DE/NL-Vorschauhinweise sowohl an den Covers als auch im Viewer. Bereits sichtbare Vorschauen nicht doppelt als geplante Ausgabe aufführen.
- Beide Kontrollprogramme verlangen ab Sonntag 16 Uhr die Folgewoche, prüfen vollständige Original-/Cover-/Kachelbindungen und halten verfrühte Einzelpreise zurück.
- Bestehende Wochenautomation auf Sonntag 16:00 geändert, ACTIVE. Tägliche 06:15-Aufgabe bleibt PAUSED; nur ihr Regeltext wurde angepasst. Kein neuer Zeitplan und kein Server-Cron. Ausführung bleibt Mac-/App-/Quellenzugangsabhängig.

## Lokale Prüfung vor Veröffentlichung

- Test-first: ursprüngliche Montag-Sichtbarkeit und alte 17-Uhr-Auswahl durch fehlschlagende Grenztests belegt, anschließend behoben.
- Sommer-/Winterzeit, beide Zeitumstellungen, Jahreswechsel, Sonntag 15:59/16:00, Montag-Aktivierung, Ablauf, fehlende/defekte Gegenausgabe, sichtbare statt versteckte Hinweise geprüft.
- Kontrollprogramm-Fixtures prüfen beschädigte PDF-, Cover- und Kachelbytes, verfrühte Angebote sowie fehlende Folgewoche.
- Unabhängige Review fand eine Regression in der API-Bildbindung des HTTP-Audits. Ein vertauschtes Angebotsbild bestand zunächst fälschlich; separater API-zu-Original-Abgleich ergänzt. Regression nachgewiesen und behoben; zweite Review freigegeben, 57 HTTP-Audittests bestanden.
- Frische vollständige lokale Web-Suite: **2.220 Tests in 117 Dateien bestanden**, native Bewerbungsdienste und private Scratchtests explizit ausgeschlossen. Lint, Next-Typegen, TypeScript, 210 Originalangebote und Produktionsbuild ohne Testuhr bestanden.
- Lokaler Contentcheck bei echter Sonntagszeit ohne Fehler; lokale URL ist ausdrücklich kein Live-Nachweis. Beide Originale sowie vollständige Kacheln geprüft, keine verfrühten Sortimentskarten.
- Browser: DE-Viewer Desktop, NL-Viewer mobil und Escape/Fokusrückgabe geprüft. Während des lokalen Entwicklungs-/Buildwechsels kurzfristiger HMR-Leerzustand beobachtet; nach vollständigem Reload korrekte Daten und Viewer. Öffentliche Produktionsprüfung separat erforderlich.

## Veröffentlichung

Vor Veröffentlichung: bisheriger geprüfter Release `f0540ec67a10fb248ad87a8c8c8e2bb8997e541c`, etwa 4,8 GiB frei, neun bestehende Sicherheitskonfigurationshashes erfasst. Neuer unveränderlicher Linux-Release und öffentliche Abnahme folgen; dieser Abschnitt allein bestätigt noch keine Live-Schaltung.

Keine alten Releases entfernen; keine Sicherheits-, DNS-, Mail-, Miet-, Zahlungs-, Bewerbungs- oder Löschaktivierung. Native Bewerbungsqualifikation bleibt ausdrücklich unbestätigt.
