# Gewinnspielcover — Bildauslieferung, 11. Oktober 2026

## Reproduktion und Eingrenzung

Niko meldet, dass die letzten beiden Gewinnspiele seit der Fotoänderung fehlen. Betroffen sind die Cover des Everdure-/Staropramen-Pizzaofens und des Disaronno-Liegestuhls. Beide Datensätze, Termine, Links und Originalbilder sind weiterhin vorhanden; zwischen den beiden vorherigen Releases wurden diese nicht geändert.

- Auf der öffentlichen Gewinnspielseite sind beide Karten und ihre `img`-Elemente vorhanden, aber auf Desktop bei DPR 2 bleiben die Bildflächen leer (`complete:false`, `naturalWidth:0`).
- `/_next/image?url=%2Fimages%2Feditorial%2Finstagram%2Fgiveaway-2026-10.webp&w=1280&q=75` und die entsprechende Disaronno-URL: mit `Accept: image/avif,image/webp,image/*;q=0.8` jeweils 15 Sekunden ohne Antwort.
- Dieselben beiden URLs mit WebP-Accept: HTTP 200 nach rund 528/572 ms. AVIF-Breite 640 antwortet ebenfalls. Das ist ein größen-/formatspezifischer Zustand, keine fehlende Quelldatei.
- Dieselbe Oktober-AVIF-URL direkt am Server unter `127.0.0.1:3000`: nach 12 Sekunden ebenfalls ohne Antwort. Ein Caddy-/DNS-Fehler ist damit für diese Anfrage ausgeschlossen.
- Beide freigegebenen 1411×1881-Original-WebPs dekodieren korrekt und stimmen mit ihren Manifestprüfsummen überein. Keine neue Quellenfreigabe oder Motivänderung erforderlich.
- Unabhängige Nur-Lese-Prüfung bestätigt: Gewinnspieldaten, Renderpfade, Produktionsuhr und Originalassets sind gegenüber dem vorherigen Release unverändert.

Der interne Auslöser des bereits zweimal dokumentierten AVIF-Stillstands bleibt unbewiesen. Ein weiterer Neustart allein wäre keine dauerhafte Korrektur.

## Begrenzte Korrektur

- Nexts unterstützte Bildausgabe auf WebP beschränkt. Die Größenoptimierung bleibt aktiv; keine Originale, Zuschnitte, Termine, Angebote oder Links verändert.
- Reale Next-Formatverhandlung für beide Gewinnspielbilder bei 640/768/1280/2560 sowie Quellformat-Fallback und ungültige Größe getestet. Vor Konfigurationsänderung zwei erwartete rote Tests, danach alle vier grün.
- Zusätzliche GET-/Decode-Prüfung für aktive Gewinnspielcover auf Startseite und Gewinnspielseite; Header, Originalhashes und responsive Varianten werden geprüft. Kein HEAD-Ersatz.
- Neue lokale Ausgabe mit AVIF-bevorzugendem Browserheader liefert WebP, 1280×1706 Pixel; beide Motive im lokalen Desktopbrowser sichtbar.

## Veröffentlichung

Lokale Freigabe: 110 Dateien / 1.919 Webtests, Lint, TypeScript und Produktionsbuild bestanden. Der erste parallele Gesamtlauf traf die absichtlich rote TDD-Zwischenstufe des neuen Audits; der vollständige Wiederholungslauf ist grün. Die zusätzliche lokale HTTP-Prüfung bestand 18 echte Bilddownloads ohne Befund. Desktop und 390px Mobil zeigen beide vollständigen Motive mit `contain` und ohne horizontalen Überlauf; temporären Viewport zurückgesetzt.

Unabhängige Gegenprüfung: 57 fokussierte Tests und Lint bestanden. Zwei Prüfwerkzeugprobleme vor Veröffentlichung behoben: leere Erkennung darf keine erfolgreiche Bildprüfung melden; die absichtlich hängende Testantwort darf durch zu knappe Zeitgrenze keine normalen WebP-Dekodierungen fälschlich ablehnen.

Erst ein frischer Linux-Release und die anschließende öffentliche HTTP-/Browserprüfung bestätigen die Live-Korrektur. Keine Server-Sicherheitskonfiguration, Bewerbungs-, Mail-, Miet-, Zahlungs- oder Löschfunktion wird geändert oder aktiviert. Fremde Arbeitsänderungen bleiben unberührt.
