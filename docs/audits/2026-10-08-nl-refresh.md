# NL-Einstieg und Oranje-Landingpage – 8. Oktober 2026

## Freigabe und Umfang

Niko hat den sichtbaren NL-Einstieg und die behutsame Oranje-Variante für `/nl` mit „starte“ freigegeben. Der bestehende deutsche Auftritt bleibt erhalten. Keine Anzeigenbuchung, kein Kontakt mit De Gelderlander, keine Hostingänderung und keine Veröffentlichung auf einem öffentlichen Server.

## Umsetzung

- Gemeinsamer Kopfbereich: eigenständiger, auch mobil außerhalb des Menüs sichtbarer Link „🇳🇱 Nederlands · Click here“, mit dezentem Pfeil zur Flagge.
- `/nl`: warme Cremeflächen, dunkle Schrift und Oranje-Akzente; unverändertes Trinkgut-Logo und vorhandenes echtes Canva-Foto von Sven und Niko, vollständig und unbeschnitten.
- Angebote und Route direkt im Einstieg. Der bereits korrigierte zentrale Routenlink enthält den vollständigen Markt und Jurgensstraße 20, 47574 Goch.
- Besuchsinfos, Öffnungszeiten inklusive Feiertagshinweis, Beratung, Partyplanung, Vermietung, Kontakt und GrailBid geordnet. Bestehende Teamfotos bleiben in einem aufklappbaren Bereich zugänglich; Einzelbildbeschriftungen enthalten nur Namen.
- WhatsApp-Kontakte auf `/nl` verwenden einen niederländischen Nachrichtentext. Kein Nachrichtenversand ausgeführt.
- Aktuelle DE- und NL-Originalhandzettel samt Datum, PDF und Viewer bleiben unverändert. Oranje-Anpassungen im gemeinsamen Flyerbaustein gelten ausschließlich für die kompakte NL-Ansicht; deutsche Angebotsseiten behalten ihre Farben.
- Keine Canva-/Instagram-Inhalte geändert, keine neuen Bilder importiert, keine Änderungen an Content-Pipeline oder Automationen. Die gesonderte Sortiment-Erweiterung ist nicht Teil dieser Freigabe.

## Verifikation

- Test-first: Neue Landingpage-Tests meldeten vor der Implementierung den fehlenden Hero-Routenlink und den deutschen WhatsApp-Text. Neuer Header-Test meldete den fehlenden NL-Einstieg. Nach Umsetzung grün.
- Gesamtlauf `npm test`: **71 Dateien, 1.054 Tests bestanden**.
- `npm run build`: erfolgreich, einschließlich TypeScript und Content-/Asset-Vorprüfung.
- Fokussierte Tests für NL-Landingpage, Header, Flyer-Lokalisierung und Metadaten: 11 Tests bestanden. Zusätzliche Header-Regressionen und Token-Prüfung bestanden.
- Unabhängige Codeprüfung: kein blockierender Befund. `git diff --check` fehlerfrei.
- HTTP 200 für `/`, `/nl`, `/angebote`, `/handzettel`; neue NL-Einstiege, Hero und niederländischer WhatsApp-Link im HTML bestätigt.
- Browser: `/nl` bei 1440 × 900, 390 × 844 und 320 × 844 geprüft; kein horizontaler Überlauf in der schmalen Ansicht. Natürliches, unbeschnittenes Hero- und Handzettelmotiv.
- Angebots-CTA springt zur richtigen Sektion. NL-PDF-Viewer öffnet die Originaldatei `/handzettel/2026/nl-2026-10-05.pdf`; Escape schließt und gibt den Fokus an den Auslöser zurück.
- Team-Aufklappbereich öffnet und schließt; alle derzeitigen Mitarbeiterprofile vorhanden, einschließlich Hanna, Henri und Hannah.
- Deutscher Kopfbereich bei 320 Pixeln: NL-Einstieg außerhalb des geschlossenen Menüs sichtbar; Menü lässt sich öffnen und schließen, alle Einträge erreichbar. Wochenangebots-Sprung funktioniert. Linkwechsel Deutsch → NL und NL → Deutsch im Browser bestätigt.
- Deutscher Desktop-Kopfbereich bei 1440 Pixeln: NL-Einstieg sichtbar; bestehende Hauptnavigation, Logo und WhatsApp-Link ohne Überlappung. Temporäre Viewport-Overrides nach der Prüfung zurückgesetzt.

## Belege und Bereitstellung

Screenshots unter `audit/screenshots/nl-refresh-2026-10-08/`: `nl-desktop.png`, `nl-mobile.png`, `nl-flyer-mobile.png`, `home-nl-entry-mobile.png`, `home-nl-entry-desktop.png`.

Lokal auf `http://localhost:3000/nl` geprüft. Der öffentliche Server ist weiterhin nicht online; GitHub-Sicherung ist kein Live-Nachweis. Fremde bestehende Audit-Screenshots und Laufberichte wurden weder übernommen noch verändert.
