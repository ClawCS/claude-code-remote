# Content- und Bildaktualisierung, 08.10.2026

Arbeitsstand: `codex/cinematic-production` in der freigegebenen lokalen Worktree. Kein öffentlicher Server eingerichtet; lokale Prüfung und Git-Sicherung sind keine Veröffentlichung.

## Freigabe und Umsetzung

- Niko bestätigte das behutsame Design und beauftragte ausdrücklich Image-Motive für die acht Akademiekurse. Acht natürlich gestaltete Themenbilder sind in Übersicht und Kursdetails eingebaut; bestehende Navigation, Inhalte und warme Farbwelt bleiben erhalten. Die Bilder sind als KI-generierte Illustrationen kenntlich gemacht.
- Alle 19 verbleibenden Leihartikel haben ein eigenes Beispielbild. Der Hinweis „KI-Beispielbild · Modell und Ausführung können abweichen“ steht an den Bildern und im Warenkorb; konkrete reale Modelle oder Maße werden nicht zugesichert.
- 27 Bildoriginale liegen privat unter `assets/source/generated-visuals/2026-10-08/`. Das versionierte Manifest `data/generated-visuals.json` dokumentiert Prompts, Generator, Freigabe, Original- und WebP-Hashes sowie Abmessungen. Originale werden nicht in Git eingecheckt.
- Bestätigte Bruttomietpreise: Altbier-/Willi-/Kölschglas je 0,20 €, Schnapsglas 0,40 €, Weizenglas 0,80 €, Theke 35 €, Spültheke 50 €. Weinglas klein entfernt. Sichtbares Preislistendatum 01.01.2026 entfernt; interne Herkunftsdaten erhalten.
- Mietberechnung bleibt je angefangenem Dreierblock von Werktagen (Mo–Sa, ohne NRW-Feiertage, Abhol- und Rückgabetag mitgezählt). Preisversion erhöht, sodass alte Preisbestätigungen nicht unbemerkt mit neuen Preisen fortgesetzt werden. Bestellbetrieb unverändert gesperrt; keine echten Bestellungen, Zahlungen oder E-Mails ausgelöst.

## Niederländischer Handzettel

- KW41, gedruckte Gültigkeit 05.–10.10.2026, Canva-Design `DAHHqrttnew`, Seite 14. Aktuellen authentifizierten Originalviewer am 08.10. lesend und vollständig visuell mit dem lokalen Originalexport vom 04.10. abgeglichen. Canva/Instagram nicht verändert.
- PDF unverändert aus dem authentifizierten Export übernommen; genau eine Seite. SHA-256: `65fedf4c7016dfd91229ee5f0e2221b0d08aae4090572df0c35bb674c46db7d4`. Vollständige lokale WebP-Vorschau, keine signierten Thumbnails.
- Betreiberfreigabe erlaubt die unveränderte Originalübernahme trotz der zuvor erläuterten Preis-/Grundpreis- und Bedingungsabweichungen. Die fünf rechnerischen Abweichungen sowie Krombacher-/Pfandfragen bleiben im historischen Nachweis `audit/content-runs/2026-10-04-weekly-evidence.json` dokumentiert; keine Behauptung rechnerischer oder rechtlicher Fehlerfreiheit.
- Unter Angebote DE links unverändert, NL rechts gleichwertig und unbeschnitten; mobil untereinander. Neue Einseiterdarstellung verwendet das natürliche Seitenverhältnis.
- Tägliche Kontrolle 06:15 und Sonntagsvorbereitung 17:00 aktualisiert: Preisabweichungen sind redaktionelle Warnungen, falsche Woche, beschädigte Datei, fehlende Herkunft oder mehrseitige NL-PDF bleiben blockierend. Keine Verlängerung abgelaufener Werbung.

## Sortiment und Cocktailfotos

- Öffentlicher Sortimentskatalog und Warengruppen zeigen nur die aktiven Original-Handzettelangebote statt der historischen 107 Produktbeispiele. 16 geprüfte Originalausschnitte (7 DE, 9 NL), Suche, Sprachfilter und passende Akademie-Verweise sind vorhanden. Detail-Altlinks führen zur zugehörigen aktuellen Kategorie; unbekannte Slugs bleiben 404. Alte Product-JSON-LD-Ausgaben und Sitemap-Detailziele entfernt.
- Angebotsauswahl ist an Original-ID, Sprache, exakten Zeitraum und konkrete Originalversion gebunden (DE versionierte PDF-URL, NL PDF-Hash). Ohne Versionsbeleg oder nach Originalwechsel/Enddatum bleibt ein Ausschnitt verborgen. Offene Tabs aktualisieren Zeit und Quellen. Nicht eindeutig belegte Einzelangebote wurden nicht separat herausgestellt.
- Neue Wochen benötigen neu kuratierte Ausschnitte; andernfalls verweisen die Kategorien auf die vollständigen aktuellen Handzettel. Der alte interne Produktpool für bestehende Finder-/Planerfunktionen wurde nicht als WWS ersetzt und nicht gelöscht.
- 16 zusätzliche echte Cocktailfotos ergänzt, keine KI-Bilder: Gin Fizz, Bramble, Aviation, French 75, Bee’s Knees, Hugo, Campari Spritz, Bellini, Kir Royal, Rossini, Americano, Limoncello Spritz, Margarita, Paloma, Tequila Sunrise, Lillet Vive. Originalquelle, konkrete kommerziell nutzbare Lizenz, Urheber und Hashes dokumentiert; öffentliche Bildnachweise bleiben erreichbar.
- Ergebnis: 55 von 65 Rezepten mit belegtem Foto. Offen: Mai Tai, Zombie, Planter’s Punch, Bahama Mama, Vodka Sour, Gimlet, Mezcal Mule, Mezcal Negroni, Batanga, Ranch Water. Geprüfte unpassende Varianten bzw. nicht belegte Nutzungsrechte bleiben zurückgehalten; Rezepte wurden nicht an Fotos angepasst. Private Detailbelege: `assets/source/cocktails/2026-10-08/README.md`.

## Prüfung

- Regressionstests vor Reparaturen: fehlende Mietpreise/Bilder, Einseiterformat, Angebotsablauf, Originalwechsel und fehlende Versionsbelege reproduziert; anschließend behoben.
- Desktop und 390×844-Mobilansicht: Angebote, Akademie, Kursdetail, Sortiment und Vermietung visuell geprüft. Kein horizontaler Überlauf in den geprüften mobilen Ansichten; mobile Navigation und NL-Filter funktionieren. 16 Gesamtangebote / 9 NL-Angebote. Originalmotive vollständig sichtbar.
- Konkrete Browserprobe: 08.–12.10.2026 = vier Werktage, ein Kühlanhänger = zwei Mietblöcke = 300 € inkl. MwSt. Keine Bestellung abgesendet.
- Bildprüfung: 27 generierte WebP- und Originalhashes, 16 Ausschnitt-Hashes, 55 Cocktailfotos und Quellenzuordnungen geprüft. Keine privaten Bildoriginale öffentlich eingebunden.
- `npm run content:check -- --url http://localhost:3000`: keine Content-Fehler, beide KW41-Ausgaben aktiv; `websiteVerified=true`, `deploymentVerified=false`. Einzige Laufwarnung: keine bestätigte öffentliche Produktionsadresse. Nachweis: `audit/content-runs/2026-10-08T07-26-09-966Z-check-4ccd55ed.json`.
- Abschließende Gesamtsuite: 1.048 Tests in 68 Dateien bestanden. TypeScript und Produktionsbuild bestanden (120 statische Ausgaben plus dynamische Routen). Build-Traces für `/produkte` und `/kategorie/[slug]` enthalten NL-PDF, lokale Vorschau und redaktionelle Daten.
- HTTP-Prüfung gegen die laufende lokale Website: 117 Seiten, 1.895 lokale Ressourcen, 5 unbekannte Routen und 26 API-Verträge; keine Fehler oder Warnungen. APIs nur lesend bzw. mit leeren nicht authentifizierten Ablehnungsproben getestet; keine gültigen Bestell- oder Zahlungsdaten. Nachweis: `audit/evidence/2026-10-08-content-visual-refresh.json`.
- Unabhängiger Code-Review: keine verbleibende aktuelle Regression festgestellt. Der Hinweis auf fehlende Versionsbelege bei künftigen Imports wurde mit zwei zusätzlichen Rot→Grün-Tests behoben. Diese technische Abnahme ist keine Rechtsberatung und keine Abnahme eines öffentlichen Zahlungsbetriebs.

Fremde vorhandene Screenshots und historische unversionierte Prüfläufe bleiben unverändert und werden nicht mit diesem Auftrag eingecheckt. Bestehende Canva-Anbindung erhalten.
