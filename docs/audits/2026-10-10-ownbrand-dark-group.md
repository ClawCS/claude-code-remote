# Eigenmarken: gemeinsames dunkles Gruppenmotiv — nur lokal

## Umfang

Niko beauftragt den Austausch des weißen Hintergrunds zugunsten einer gemeinsamen Bildwelt passend zu den einzelnen Likörplakaten; die generierte Bearbeitung ist ausdrücklich erlaubt. Ein eigenständiges, vollständiges 3:2-Gruppenmotiv ersetzt ausschließlich die bisherige Gruppenansicht auf `/`, `/eigenmarke` und `/nl`. Dunkler Hintergrund mit Gold-, Rot- und Grünakzenten; alle sechs Flaschen vollständig sichtbar. Keine Änderung der Einzelplakate, Produktdaten, Preise, Google-Originale oder Videos der eigentlichen Website.

Quelle, beide Prompts, Abmessungen und Hashes: `assets/source/eigenmarken-scenes/provenance.json`. Bilddatei: `public/images/eigenmarken-scenes/group-dark-v1.webp` (1536 × 1024, 334.530 Bytes). Referenzgeleitete Bildbearbeitung, keine Behauptung pixelidentischer Verpackungen oder dokumentarischer Google-Aufnahme. Die vollständige PNG-Quelle bleibt privat lokal erhalten.

## Prüfungen

- Drei fokussierte Regressionen zuerst mit alter Bildquelle fehlgeschlagen, danach 23 Tests der drei betroffenen Testdateien bestanden.
- Frischer gesamter Weblauf: `NODE_ENV=test npm test -- lib --maxWorkers=2` — 99 Dateien, 1.641 Tests bestanden.
- TypeScript und Produktionsbuild bestanden; 120 statische Seiten gebaut. Kein Testdatum oder Fixture-Modus verwendet.
- ESLint: keine Fehler, 21 bereits bestehende Warnungen; keine neuen Warnungen in den geänderten Bildkonsumenten.
- Cinematic- und Google-Medienchecks bestanden. Zehn Originalmedien-/Datendateien byteidentisch zu HEAD vor der Änderung.
- `/`, `/eigenmarke` und `/nl` auf Dev 3000 und neu gebauter Produktionsvorschau 3110: HTTP 200, neue Szene enthalten, alte Gruppenquelle nicht enthalten.
- Direkter lokaler WebP-Abruf: HTTP 200, `image/webp`, 334.530 Bytes, SHA-256 `4822aa75e3fb983cb90413e344f57f9cb97330ebbd38c9d95ece78a60e54124a`.
- Browser: vollständige sechs Flaschen, `object-fit: contain`, 3:2-Verhältnis auf allen drei Seiten. Bei 390 px Bildbreite 350 px, Bildhöhe ca. 233 px, kein horizontaler Überlauf. Desktop ca. 553 × 368 px; neutraler NL-Alttext vorhanden. Keine erfassten Browserwarnungen/-fehler. Temporäre Browsergröße zurückgesetzt. Belege privat unter `.superpowers/ownbrand-group-*.png`.
- Unabhängige Code-/Bildprüfung ohne kritische oder wichtige Befunde. Kleine Lücke in der Referenzliste (Dicke Nüsse) vor Commit ergänzt.

## Abgrenzung der Gesamtprüfung

Ein zusätzlicher unkonfigurierter Komplettlauf einschließlich nativer Bewerbungsdienste war **nicht grün**: 142 Testdateien bestanden, fünf schlugen fehl; 3.118 Tests bestanden, acht fehlgeschlagen, 15 übersprungen. Ursachen im Bericht des Laufs: fehlendes `APPLICATIONS_TEST_QPDF` für gebundene QPDF-Version sowie zwei 5-Sekunden-Zeitüberschreitungen in Löschtests. Diese Dienste wurden hier nicht verändert, nicht aktiviert und nicht als abgenommen erklärt. Für den Bildwechsel zählt die getrennte erfolgreiche Web-/Build-/Browserprüfung; kein allgemeines Projekt-Gesundheitsversprechen daraus ableiten.

## Bereitstellung

Nur lokal auf `http://127.0.0.1:3110/` aktualisiert. Dev 3000 bleibt erreichbar. Kein Hetzner-Deployment, keine Änderung von Mail, Uploads, Zahlungen oder Sicherheitskonfiguration. Git-Synchronisation ist kein Live-Nachweis.
