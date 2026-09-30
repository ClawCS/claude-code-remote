# Gewinnspiel-Cover: geprüfter Zwischenstand

Stand: 30.09.2026, Europe/Berlin. Lokale Produktionsvorschau: http://127.0.0.1:3103/gewinnspiel#jahresagenda. Keine bestätigte öffentliche Bereitstellung.

## Ergebnis und verbleibende Quelle

Der Nutzer bestätigte vollständige, unbeschnittene Originalbeitragsbilder einschließlich Text und Datum. Neun passende Vollmotive sind lokal übernommen: Januar, Februar, April, Mai, Juni, Juli sowie Ostern, Vatertag und WM. Die Karten verwenden natürliche Originalproportionen ohne feste Höhe, Crop, Maskierung oder zusätzliche Bildüberlagerung; Desktop und Mobil wurden geprüft. Jeder Coverlink führt auf den zugehörigen Originalbeitrag. Keine Instagram-Einbettung, keine signierten Thumbnail-URLs und keine Besucher-Accountpflicht.

Acht historische Canva-PNG-Originale wurden mit dem verbundenen Canva-Bestand und den veröffentlichten Posts abgeglichen. Januar stammt aus der bereits vorhandenen vollständigen Datei und hat einen historischen visuellen Canva-Layoutbeleg; es wird ausdrücklich keine Byteidentität mit der heutigen Canva-Version behauptet. Metadatenfreie PNG-Buildquellen und WebPs sind per SHA-256 und Originalmaßen fixiert. Private Originale, Canva-Identitäten und Nachweise bleiben ignoriert. Die vorhandene Asset-Pipeline reproduziert jetzt 15 Bilder: sechs Marktmotive plus neun Cover. Drei- und zweispaltige Karten verwenden passende responsive Bildgrößen.

**Nicht vollständig abgeschlossen:** Für März mit grünem Monster-Titel, August, September und Guinness ist das exakte Canva-Original bislang nicht identifiziert. Andere Fassungen beziehungsweise 2025-Gewinne werden nicht verwendet. Die vier richtigen Instagram-Motive sind privat vorbereitet, aber nicht veröffentlicht; die ausdrückliche Quellen-Ausnahmefrage ist noch unbeantwortet. Dafür sind weiterhin Canva-Originalexports mit Identität oder eine ausdrückliche Ausnahmefreigabe erforderlich. Die Website bleibt bei diesen vier Aktionen textbasiert mit korrektem Originalpostlink. Oktober–Dezember bekommen keine erfundenen Motive.

## Frische Verifikation

- Unit-Suite: 48 Dateien, 496 Tests bestanden.
- TypeScript und Produktionsbuild erfolgreich; 230 statisch erzeugte Seiten, beide Asset-/Content-Vorprüfungen bestanden.
- Lint: 0 Fehler; 20 bereits bestehende Warnungen. Gezielt geänderte Code-/Testdateien ohne neue Warnungen.
- Normale Playwright-Suite: 88/88 bestanden, 54,6 Sekunden; feste Juli-Testuhr und isolierte historische Flyer-Titelseite.
- Zusätzliche September-Coverprüfung: 3/3 bestanden, 8,1 Sekunden; neun publizierte Dateien, vier bewusst fehlende Dateien, Agenda/Archiv/Home bei 1440 und 390 Pixeln. Explizite September-Testuhr, keine Flyer-Netzwerkfixture.
- Reale Produktionsprüfung: 24/24 bestanden, 43,8 Sekunden; zwölf Routen auf Desktop/Mobil mit realer Uhr und ohne Netzwerkfixtures. Kein Bildausfall, horizontaler Überlauf, Laufzeit-/Hydrationsfehler oder schwerer/kritischer Axe-Verstoß in diesem Umfang.
- HTTP/SSR-Audit: 224 Seiten, 454 lokale Ressourcen, fünf unbekannte Pfade und 13 API-Verträge; 0 Fehler, 0 Warnungen. Evidenz: `audit/evidence/giveaway-covers-2026-09-30.json`.
- Unabhängiger Read-only-Review: neun vollständige Quellen und Derivate, Hashes/Maße/Metadaten und Datenzuordnung geprüft. Keine verbleibenden wesentlichen Produktionsbefunde; Layout-Bildgrößen wurden anschließend optimiert.

Die ersten Vollständigkeitstests waren rot wegen der vier fehlenden Quellen. Die endgültige Testsuite sichert ausdrücklich die neun freigegebenen Cover und die Quarantäne der vier anderen, nicht eine fingierte Vollständigkeit aller dreizehn Aktionen. Ein falscher Testbefund behandelte den normalen Dokument-Scrollbereich als dauerhaften Bildcrop; die Prüfung unterscheidet jetzt korrekt zwischen Viewport-Scrollen und tatsächlicher Wrapper-/Maskenbeschneidung.

Die normale Gesamt-Browsersuite enthielt außerdem unisolierte Zugriffe auf die inzwischen stillgelegte Juli-Flyer-Titelseite (upstream 403). Die zwei betroffenen Prüfdateien nutzen bei der expliziten Juli-Testumgebung nun dieselbe enge Titelseitenfixture wie die bestehenden Kontrakttests. Produktionsläufe mit expliziter Basis-URL bleiben fixturefrei. Es werden keine realen Netzwerkfehler ausgeblendet.

Aktuelle Cover-Screenshots: `audit/screenshots/giveaway-covers-2026-09-30/` (September-Testuhr). Reale Produktions-Screenshots: `audit/screenshots/public-site-completion-2026-09-30/`. Diese technische Prüfung ersetzt keine vollständige manuelle Barrierefreiheits- oder rechtliche Zertifizierung.

Nach lokalem Versionswechsel im Browser Cmd+Shift+R verwenden. Vorgehen und Quellen-Sperre: `docs/CONTENT-UPDATE-RUNBOOK.md`.
