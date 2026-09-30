# Trinkgut Jammers Korrektur und Vervollständigung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Den beauftragten Relaunch über alle bestehenden Unterseiten konsistent machen und fehlende, belegbare Team-, Leihartikel-, Bild- und Gewinnspielinhalte ergänzen.

**Architecture:** Bestehende Next-Routen und Funktionen bleiben erhalten. Der warme rote Auftritt wird auf einen einheitlichen Seitenrahmen ausgeweitet; Kategorien sind eigene URLs. Leihartikel erhalten einen gemeinsamen, aus den Originaltabellen abgeleiteten Katalog. Gewinnspiele erhalten datierte, belegte Jahresdaten statt undatierter Platzhalter.

**Tech Stack:** Next 16.3.7, React 19.2.4, TypeScript, Vitest, Playwright, Sharp.

**Spec:** Bestehender Relaunch unter `docs/superpowers/specs/2026-07-14-cinematic-production-homepage-design.md`, konkretisiert durch Nikos Korrekturauftrag vom 30.09.2026. Dieser Auftrag verlangt die chronologische Ordnung und anschließende direkte Umsetzung; kein erneuter Wechsel der Designrichtung.

## Global Constraints

- Nur belegte Canva-Fotos; keine KI- oder Stock-Ersatzbilder und keine ablaufenden Vorschaulinks im öffentlichen Auftritt.
- Canva und Instagram ausschließlich lesen; Originale und Accounts unverändert lassen.
- Keine historischen Handzettelpreise als aktuelle Produktpreise, keine erfundenen Mitarbeiter, Gewinner oder Termine.
- Bestandszahlen vom 06.03.2026 sind physische Obergrenzen, keine Live-Verfügbarkeit. Preise vom 01.01.2026 nennen ihren Stand; die Quellen enthalten keinen bestätigten Mietzeitraum.
- `BRUCH` ist Bruchersatz, nicht Kaution. Unklar zugeordnete Glaspreise bleiben offen.
- Keine fingierte Bestellung oder Reservierungsbestätigung; nur unverbindliche Anfrage über bestehenden Prozess.
- Kein Hostingwechsel, keine neue öffentliche Veröffentlichung ohne vorhandenen freigegebenen Prozess. Der bestehende Push ist erlaubt.

## Review Focus

- Direkte Aufrufe und Client-Navigation müssen denselben Rahmen ohne alten Header/Footer oder alte Kategorieinszenierung zeigen.
- Jeder fachliche Navigationseintrag führt auf eine eigene Unterseite; Filter und Sprungmarken werden nicht als Kategorien ausgegeben.
- Wiederholtes Hinzufügen, Mengenänderung und Speicherwiederherstellung dürfen den physischen Leihbestand nicht überschreiten.
- Jahreswechsel, Berliner Mitternacht und abgelaufene Gewinnspiele müssen korrekt klassifiziert werden. Die Mai-Datei mit 2025-Datum bleibt außerhalb der Agenda 2026.
- Gruppenbilder, Portraits und Produktbilder brauchen passende Formate; nicht belegbare Motive bleiben ein sichtbarer offener Abnahmepunkt.

## Chronologische Checkliste

### Task 1 Bestandsaufnahme und Fehlerreproduktion

- [x] Branch synchronisieren und bestehenden isolierten Worktree verwenden.
- [x] Baseline prüfen: 330 Tests bestanden.
- [x] Warengruppe im Browser öffnen: eigener Pfad, aber alter Rahmen und alte Bildersatzgrafiken bestätigt.
- [x] Team, Preislisten, Gewinnspiele und Routing unabhängig read-only untersuchen.

### Task 2 Einheitlicher Rahmen und echte Kategorieziele

**Files:** `components/PublicChrome.tsx`, `components/RouteContent.tsx`, `app/layout.tsx`, `lib/cinematic/site.ts`, `components/cinematic/CinematicHeader.tsx`, neue Unterseiten-CSS, `/produkte`, `/kategorie/[slug]`, Produktdetail.

**Interfaces:** Wiederverwendung von `CinematicHeader({nowIso,hasActions})` und `LocationFooter()`. Fachnavigation liefert absolute lokale Routen, GrailBid bleibt extern. Anfrage- und Merklisten bleiben erreichbar.

- [x] Regressionstest für direkte Unterseiten und Kategorien schreiben und rot beobachten.
- [x] Gleichen Header/Footer und roten Seitenstil herstellen; alte Schimmer-/Kategorie-Hintergründe entfernen.
- [x] Navigation auf `/angebote`, `/produkte`, `/vermietung`, `/eigenmarke`, `/gewinnspiel`, `/galerie`, `/kontakt` und GrailBid legen; Rezepte/Partyplanung sichtbar erreichbar halten.
- [x] Einzeltests und konkrete Browserwechsel prüfen.

### Task 3 Leihkatalog und Mengenbegrenzung

**Files:** neuer `data/rentals.ts`, `/vermietung`, `lib/cart-items.ts`, `context/CartContext.tsx`, `lib/reservation-inquiry.ts`, `ServiceSection.tsx`, betroffene Tests.

**Interfaces:** `RentalItem` liefert Identität, belegten Preis oder null, Bruchersatz oder null, physischen Bestand und Quellenstand. Gemeinsame Mengenvalidierung wird in Auswahl, Warenkorb und Anfrage verwendet.

- [x] Exakte Quellzeilen und Mengenbypass als fehlgeschlagene Tests festhalten.
- [x] Sämtliche belegten Leihartikel übernehmen; unbelegte Kühlwagenvarianten und Tagespreise entfernen.
- [x] Obergrenzen bei wiederholter Auswahl und überlappenden Mietzeiträumen prüfen; keine verbindliche Verfügbarkeit behaupten. Gemeinsamer Garnitur-/Einzelmöbelbestand zusätzlich abgesichert.
- [x] Homepage-Kurzliste mit Preis und Bestand anzeigen; Vollkatalog auf eigener Unterseite.
- [x] Unit- und Browserprüfung von Auswahl bis Anfrage durchführen.

### Task 4 Team und Canva-Bildzuordnung

**Files:** `data/gallery.ts`, `data/cinematic-editorial.ts`, Bildherkunftsnachweise, `PeopleSection.tsx`, `/galerie`, Bildderivate.

**Interfaces:** Jedes neue Bild benötigt bekannte Canva-Identität, lokalen Originalexport, Hash, Rubrik und Ausschnitt. Alte Namenslisten sind keine aktuelle Beschäftigungsbestätigung.

- [x] Alle acht fehlenden lokalen Portraits Canva zuordnen; Henri/Hannah zusätzlich im alten Carousel-Original identifiziert und vom Betreiber bestätigt. Hanna und Hannah bleiben getrennt; ausgeschlossene ehemalige Mitarbeiter nicht verwenden.
- [x] Elf belegte Portraits zeigen; alle elf alten Namen erhalten und keine Rollen aus dekorativen Slogans erfinden.
- [x] Gruppenfoto natürlich, Portraits ohne doppelten pauschalen Crop darstellen; keine falsche Mitarbeiterzahl aus Bildanzahl ableiten.
- [x] Desktop und Mobil visuell prüfen. Dreizehn Originalmotive und natürliche Derivate privat dokumentiert; Gruppenbild 900 × 875. Öffentliche Buildquellen verlustfrei und metadatenfrei, private Identitäten und Rohoriginale ignoriert.

### Task 5 Gewinnspielseite und Agenda 2026

**Files:** neue datierte Gewinnspieldaten und Klassifizierung, `/gewinnspiel`, `/gewinnspiel/archiv`, Homepage-Aktionsrubrik, Tests.

**Interfaces:** Datensätze enthalten Jahr/Monat, Gewinn, Originalpost, belegten Teilnahmeschluss und optional verifiziertes lokales Canva-Motiv. Status entsteht aus Berliner Datum; Teilnahme bleibt beim Originalbeitrag.

- [x] Instagram-Originale Januar bis September lesen und belegen; drei weitere Sonderaktionen und Guinness ergänzen. Bildexport-Zuordnung ist davon getrennt und noch nicht vollständig.
- [x] Monatsagenda mit belegten Aktionen auf eigener URL anzeigen; noch nicht angekündigte Monate nicht erfinden.
- [x] Aktuelle und beendete Aktionen trennen, auf der Startseite sichtbaren Einstieg ergänzen.
- [x] Berliner Tagesgrenzen und Jahreswechsel testen; 2025-Motiv als 2026 ausschließen. Privater Quellenvergleich: `assets/source/giveaways/PROVENANCE-2026.md`.

### Task 6 Rubrikbilder und Rezeptunterseiten

**Files:** Rubrikdaten, `AssortmentSection.tsx`, `/cocktails`, Kategorie- und Service-Bildkomponenten, Herkunftsnachweise.

- [x] Belegte Canva-Motive passend auf Menschen, Eigenmarken, Marktleben, Geschenkideen und regionale Spirituosen verteilen. Keine falschen Motive für fehlende konkrete Geräte-/Cocktailfotos einsetzen; diese Bildlücke bleibt offen.
- [x] Große Emoji-/Logo-Bildersatzflächen entfernen, auch in Anfrageliste und Partyvorschlägen. Fehlende konkrete Fotos nicht durch thematisch falsche Bilder kaschieren.
- [x] 65 Rezepte und sechs Rezeptkategorien über eigene URLs zugänglich machen; keine falsche Rezeptabbildung aus beliebigem Produktfoto.
- [x] Marktleben, Geschenkideen und regionale Spirituosen auf drei eigenen Seiten aus tatsächlichen Canva-Motiven entwickeln; historische Preis-/Neu-Hinweise nicht als aktuelle Aktionen behaupten.

### Task 7 Forensische Abschlussprüfung und Sicherung

- [x] Öffentliche Routen, interne Links und aktive/gesperrte Endpunkte im dokumentierten Umfang testen: HTTP-Audit 224 Seiten, 364 lokale Ressourcen, fünf unbekannte Slugs und 13 API-Verträge ohne Finding. Externe Zielseiten und authentifizierte Schreibabläufe sind nicht Teil dieses Audits.
- [x] Anfrageliste, Mietmengen, mobile Navigation, Tastaturbedienung, Rezeptdetails und Jahresagenda prüfen.
- [x] Volle Unit-Suite (484 Tests), TypeScript, ESLint (0 Fehler, 20 bestehende Warnungen), Produktionsbuild und 85 Browsertests ausführen. 61 Kontrakttests mit fester Juli-Testuhr und 24 reale Produktionsprüfungen ohne Fixtures getrennt abgenommen.
- [x] Unabhängiger Review; gemeinsame Möbelbestände, Wishlist-Bulkaktionen, verschachteltes Main und Agenda-Ziel korrigiert. Schlussreview fand außerdem doppelte Marken-Suffixe in drei neuen Seitentiteln; im realen Browser test-first reproduziert und korrigiert. Keine weiteren bestätigten Hochrisiko-Fehler im geprüften Umfang.
- [x] Reale Vorschau auf 3000 und 3103 aktualisiert, 54 aktuelle Screenshots gespeichert und genaue Dateien mit Implementierungscommit `24d09cd` auf `codex/cinematic-production` gepusht. Remote-Commit bestätigt; Worktree erhalten.
- [x] Prüfbericht unter `docs/audits/2026-09-30-public-site-completion.md` mit Ergebnissen und offenen Quellen-/Betreiberangaben bereitgestellt. Öffentliche Bereitstellung und rechtliche Endabnahme bleiben ausdrücklich offen; keine pauschale Rechtskonformitätsbehauptung.
