# Freigegebener Teamfoto-Platzhalter

Datum: 9. Oktober 2026. Niko hat das Kurzdesign ausdrücklich bestätigt und damit die frühere Vorgabe, das Gruppenfoto zu behalten, ersetzt. Ausgangs-HEAD `97d5b70567a912bf8ea7d1f1be49f109a2c47db5`; aktiver Arbeitsbranch `codex/cinematic-production`, vor Beginn mit GitHub abgeglichen.

## Begrenzte Änderung

- Startseite, Teamseite `/galerie` und NL-Seite verwenden denselben schlichten Platzhalter mit dem vorhandenen, unveränderten Jammers-Logo. Text: „Unser neues Teamfoto folgt“, auf `/nl` „Onze nieuwe teamfoto volgt“.
- Das alte Gruppenbild wird nicht mehr von den aktiven Seiten eingebunden. Sein Import und Gruppeneintrag sind aus dem redaktionellen Anzeigemanifest entfernt. Historische Original-/Archivdateien und der ungenutzte Legacy-Hero bleiben unangetastet; keine Quellenlöschung beauftragt.
- Die sieben freigegebenen Einzelportraits, Namen, Reihenfolge und das Sven-/Niko-Herobild bleiben unverändert. Nur der Platzhalter überspannt das Raster; Niko wird nicht zum vermeintlichen Gruppenbild hochgestuft.
- Bestehende NL-Aufklappfunktion, Navigation, Kontakt-Logos, Handzettel und sonstige Inhalte unverändert. Keine Bildgenerierung, Canva-/Instagram-Änderung oder fremde Fotobeschaffung.
- Umsetzung und Tests in App-Commit `b2383232fb5dfdb3a25a96d01995d470b0a54889`, lokal und auf GitHub gesichert. Fremde Screenshot- und Content-Dateien weder aufgenommen noch verworfen.

## Verifikation vor Veröffentlichung

- Vier gezielte Unit-Regressionen vor der Implementierung erwartungsgemäß fehlgeschlagen (altes Gruppenbild bzw. Gruppen-Datensatz noch vorhanden); nach Änderung 26/26 fokussierte Fälle erfolgreich.
- Vollständiger lokaler Lauf: **84 Testdateien / 1.448 Tests bestanden**, anschließend Typegenerierung, TypeScript und ESLint ohne Fehler.
- Sechs neue Browserfälle: alle drei Seiten bei 1440 und 390 Pixeln geprüft. Jeweils genau ein sichtbarer Platzhalter, korrektes Logo geladen, kein altes Gruppenbild im DOM, sieben unveränderte Portraitnamen, begrenzte Logogröße und kein horizontaler Überlauf. Zusätzlich beide vorhandenen Portraitnamen-Browserfälle erfolgreich.
- Zwei zusätzlich ausgeführte bestehende Partyplanerfälle scheiterten lokal beim unmittelbaren Klick auf „Berechnen“ vor Abschluss der Hydration. Trace: Desktop-Klick bei ca. 26.459 s, benötigtes JavaScript erst bei 26.672 s geladen; mobil entsprechendes Timing. Code und Test des Partyplaners unverändert. Beide Fälle gegen die bisherige öffentliche Produktionsversion erneut geprüft: **2/2 bestanden in 3,9 s**. Keine Korrektur des Partyplaners innerhalb dieses Designauftrags; lokalen Gesamtlauf nicht pauschal als vollständig grün ausgeben.
- Unabhängiges Code-/CSS-Review ohne P0/P1/P2-Befund. Lokaler visueller Desktopcheck sowie mobile Screenshotprüfung erfolgreich.

## Release-Vorbereitung

Positiv gefiltertes Commit-Archiv ohne Umgebungsdateien, private Rohordner oder Mac-Abhängigkeiten. SHA-256: `d3392418e1e5be73507a7ed0589e3a5b9c4c444d94606ac8d893ae06b3a40974`. Ein vor Ende der Übertragung gestarteter Prüfschritt stoppte korrekt vor dem Entpacken; nach vollständiger Übertragung Hash bestätigt und frischen separaten Release angelegt.

## Veröffentlichung und öffentliche Abnahme

- Frischer Linux-Release auf `trinkgut-jammers-web-01`, Node 22.23.3: 84 Testdateien / 1.448 Tests bestanden (194,88 s), ESLint, TypeScript, alle 128 Originalangebot-Kacheln, Quell-/Derivatprüfungen und Produktionsbuild erfolgreich. Bestehende Paketmanager-Hinweise zu Entwicklungsabhängigkeiten unverändert, keine Paketversionen geändert.
- Release root-eigen, nur `.next/cache` für `jammers` schreibbar; Service-Datei unverändert. Atomare Umschaltung **09.10.2026, 05:07:03 UTC / 07:07:03 Europe/Berlin**. Bereitschaftsproben nach kurzer Startphase erfolgreich; Dienst aktiv, Flyerindex `ok`, Mietbetrieb weiterhin deaktiviert. Kein DNS-/Caddy-/Mail-/Bestell-/Zahlungsumbau. Unveränderter vorheriger Release `8a6344eabba6f7a99b5b88546dc6ac8325a2e7e7` bleibt für Rollback erhalten.
- Öffentliche sechs Platzhalter- und zwei Portraitnamen-Browserfälle bestanden; kein altes Gruppenbild im gerenderten DOM auf den drei Seiten. Visueller Livecheck im echten In-App-Browser auf `/galerie`. [Desktop-Platzhalter](../../audit/screenshots/team-placeholder-2026-10-09/home-live-desktop.png), [NL mobil](../../audit/screenshots/team-placeholder-2026-10-09/nl-live-mobile.png).
- Öffentlicher `content:check`, Lauf `2026-10-09T05-07-13-078Z-check-b6ccb9c7`: **ok**, `websiteVerified=true`, `deploymentVerified=true`, keine Fehler/Warnungen. DE-/NL-Wochenpakete vom 05.–10.10.2026 unverändert gebunden und geprüft.
- Erster vollständiger Browserlauf nach Umschaltung: 9/10 erfolgreich; zusätzlicher unveränderter Partyplaner-1440-Fall scheiterte erneut beim unmittelbaren Berechnen-Klick, während 390 erfolgreich war. Unabhängige Trace-Auswertung bestätigt: Klick bei 11,173–11,174 s, zugehöriger Client-Chunk erst bei 11,601 s vollständig geladen, also rund 427 ms später; HTTP 200, keine Console-/PageErrors. Damit ist der frühe Klick vor Hydration **auch in Produktion** möglich, nicht ausschließlich lokal. Separater offener Fehler im unveränderten Partyplaner, nicht durch diesen Auftrag behoben. Belege unter `/tmp/jammers-team-placeholder-live-tests`.
- Vollständiger unveränderter öffentlicher Wiederholungslauf: **10/10 Browserfälle bestanden in 5,0 s**, einschließlich beider Partyplanerfälle. Das bestätigt den normalen Ablauf, nicht die Behebung des frühen Klickfehlers. Wiederholungsbelege getrennt unter `/tmp/jammers-team-placeholder-live-recheck`.
- Allgemeiner öffentlicher Gesamt-HTTP-Audit: **bestanden**, null Fehler/Warnungen; 117 Seiten, 2.819 lokale Ressourcen, fünf unbekannte Routen und 30 API-Verträge geprüft. Externe Links nicht aufgerufen, keine Nachrichten/Bewerbungen/Bestellungen versendet. Bericht lokal `/tmp/jammers-team-placeholder-live-http-audit.json`. Dieser HTTP-Test ist kein Nachweis für die Abwesenheit des oben dokumentierten Interaktionstiming-Fehlers.

App-Commit und späterer Dokumentationscommit sind getrennt; Dokumentationssicherung ändert den Live-App-Stand nicht. Newsletter, Bewerbungsupload und Mietbestellbetrieb bleiben in ihrem bisherigen gesperrten Zustand.
