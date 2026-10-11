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

### Live bestätigt

- App-Release `2858e5256fd3ba1024b1a5f48d3b0cece234826e` seit **11.10.2026, 15:27:42 UTC / 17:27:42 Europe/Berlin**. Rückrollziel `f3a1cbdf782983973e7c458c0654fffbff7d1c75` erhalten.
- Archiv aus genau diesem Commit mit Runbook-Positivliste, SHA-256 `faddab8b7eff2c4c872a47bfb2795ba9bd605f109e3e73da9627af6b65572ac6`. Keine fremden uncommitteten Änderungen, privaten Quellen oder Umgebungsdateien enthalten. Neues Linux-Releaseverzeichnis, kein Edit in `current`.
- Linux: **107 Dateien / 1.884 Webtests**, Lint, TypeScript, 210 Originalangebote und Produktionsbuild bestanden. Drei Chromium-Dateien wie im Runbook ausschließlich lokal geprüft; native Bewerbungsdienste nicht aktiviert oder als abgenommen ausgegeben.
- Unabhängige Prüfung der Umschalt-/Buildskripte ohne Blocker. Bestehende Next-Unit einmal nach atomarem Wechsel neu gestartet; begrenzte Bereitschaftsprüfung fing die unmittelbare Verbindungsablehnung beim Start auf. Beide vorher hängenden 1280-URLs mit AVIF-bevorzugendem Header lieferten anschließend WebP und vollständig dekodierbare Pixel.
- **18 öffentliche Original-/Varianten-GETs** bestanden: beide aktiven IDs auf Startseite und Gewinnspielseite, Originalhashes, vier Optimierergrößen je Motiv unter zwei Accept-Profilen, korrekte Typen und Seitenverhältnisse. Anschließend **33 zusätzliche WebP-Varianten** der fünf neuen Marktfotos und sechs Eigenmarkenflaschen geladen/dekodiert; langsamste Anfrage 379 ms. Kein HEAD-Ersatz.
- Öffentliche Gesamtprüfung: **117 Seiten, 1.689 lokale Ressourcen, 31 API-Verträge und fünf unbekannte Pfade**, keine Fehler/Warnungen. 1.119 externe Links nicht abgerufen. Die 18 Gewinnspiel-Bilddownloads nach diesem Gesamtlauf erneut bestanden.
- Aktuelle Inhaltsprüfung und separate KW42-Prüfung gegen `https://trinkgut-jammers.de` beide ohne Befund, jeweils `deploymentVerified:true`. Echte Berliner Sonntagszeit; abgelaufene KW41 ausgeblendet, 70 DE-/12 NL-Angebote für 12.–17.10. bereits bereitgestellt, nicht vorzeitig aktiviert.
- Öffentlicher Browser: beide Cover auf beiden Seiten bei Desktop-DPR 2 und 390px Mobil geladen, vollständige Motive mit `contain`, lesbare unveränderte Fristen und Originalpost-Links, sichtbarer Tastaturfokus, kein horizontaler Überlauf. Temporären Viewport zurückgesetzt; Gewinnspielseite geöffnet gelassen. Screenshot und Downloadnachweise unter `audit/releases/2026-10-11-giveaway-images/`.
- IPv4/IPv6 HTTPS je 200; neun bestehende Sicherheits-/Dienstkonfigurationshashes identisch. Miete `enabled:false`, `testMode:false`, `onlinePayment:false`; Bewerbung `enabled:false`, `mode:disabled`. Keine Mails, Bewerbungen, Zahlungen oder Löschläufe.
- Nur das selbst erzeugte temporäre Übertragungsarchiv nach Hashprüfung entfernt; **keine alten Releases gelöscht**. Abschließend rund 2,1 GiB frei. Vor dem nächsten großen Release Platz prüfen und nötige Bereinigung separat freigeben lassen.
- `npm ci` meldete fünf hohe Abhängigkeitswarnungen; Paketabhängigkeiten und Lockfile wurden für diese Bildkorrektur nicht verändert. Der bestehende separate Projektaudit bleibt maßgeblich; keine pauschale Sicherheitsfreigabe daraus ableiten.

Damit ist die gemeldete Bildstörung öffentlich behoben. Die interne Ursache der historischen AVIF-Stillstände ist nicht abschließend bewiesen; der betroffene optionale Ausgabeweg ist deaktiviert. Fremde Arbeitsänderungen und alle übrigen Betriebsgrenzen bleiben erhalten.
