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

**Öffentlich aktiviert am 11.10.2026 um 19:06:57 UTC / 21:06:57 Europe/Berlin:** Release `fbb4d0c80169ac9ad15a686ad0b5a8123c1752ce`. Rückrollziel `f0540ec67a10fb248ad87a8c8c8e2bb8997e541c` erhalten. Quellarchiv SHA-256 `13391ba702b1e85cc445301d16a1c4e20992b4824f778b8516bacbd8d346f664`, 1.618 Positivlisten-Einträge. Die erste Ausführung während noch laufender Übertragung brach korrekt vor jeglicher Releaseänderung an der Hashprüfung ab; erst nach beendetem Upload und identischem Hash wurde das neue Verzeichnis erstellt.

- Frischer Linux-Webgate: **2.185 Tests in 114 Dateien bestanden**. Die drei ausdrücklich freigegebenen Chromium-Dateien (35 Tests) lokal geprüft statt GUI-Pakete auf dem Server zu installieren. Lint, Typegen/TypeScript, 210 Originalangebote und Produktionsbuild bestanden; kein Fontcache-Wiederholungsversuch erforderlich.
- Atomarer Wechsel mit geprüftem ERR-Rollback-Pfad. Erste Bereitschaftsprobe während des Neustarts noch ohne Verbindung; begrenzte Wiederholung erfolgreich. Beide KW42-Vorschauen vorhanden, Einzelangebote am Sonntag leer, Miete und Bewerbung weiter deaktiviert.
- Öffentliche normale und KW42-spezifische `content:check`-Läufe bei echter Berliner Zeit: jeweils `status:ok`, `websiteVerified:true`, `deploymentVerified:true`, keine Fehler/Warnungen. Beide PDFs/Covers und alle 82 KW42-Originalkacheln öffentlich mit ihren Bindungen verglichen; keine Neuinterpretation der Druckdaten.
- Öffentlicher HTTP-Audit: **289 Seiten, 1.715 lokale Ressourcen, 31 API-Verträge**, keine Fehler/Warnungen; zusätzliche Gewinnspielprüfung **18 Bild-GETs**, keine Befunde. Externe Links nicht Gegenstand dieser HTTP-Prüfung.
- Öffentliche Browserprüfung: DE/NL-Covers am Desktop nebeneinander, Vorschauhinweise sichtbar. Mobile NL-Seite zeigt beide Originale untereinander mit „Vooruitblik · geldig vanaf maandag“, kein horizontaler Überlauf. Modale Einstiege, Escape und Fokusrückgabe funktionieren. Die eingebettete PDF-Pixeldarstellung blieb im In-App-Browser dunkel und ist dort nicht visuell bestätigt; unveränderte direkte PDF-Links und heruntergeladene Originaldateien sind separat erfolgreich geprüft. Keine Behauptung einer vollständigen PDF-Viewer-Abnahme in allen Browsern.
- Neun bestehende Sicherheitskonfigurationshashes vor/nach identisch. Nach Release rund 3,1 GiB frei, vor Entfernung ausschließlich des eigenen temporären Übertragungsarchivs. Keine alten Releases gelöscht.

Keine alten Releases entfernen; keine Sicherheits-, DNS-, Mail-, Miet-, Zahlungs-, Bewerbungs- oder Löschaktivierung. Native Bewerbungsqualifikation bleibt ausdrücklich unbestätigt.
