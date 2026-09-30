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

**Files:** `components/DeChrome.tsx`, `components/RouteContent.tsx`, `app/layout.tsx`, `lib/cinematic/site.ts`, `components/cinematic/CinematicHeader.tsx`, neue Unterseiten-CSS, `/produkte`, `/kategorie/[slug]`, Produktdetail.

**Interfaces:** Wiederverwendung von `CinematicHeader({nowIso,hasActions})` und `LocationFooter()`. Fachnavigation liefert absolute lokale Routen, GrailBid bleibt extern. Anfrage- und Merklisten bleiben erreichbar.

- [ ] Regressionstest für direkte Unterseiten und Kategorien schreiben und rot beobachten.
- [ ] Gleichen Header/Footer und roten Seitenstil herstellen; alte Schimmer-/Kategorie-Hintergründe entfernen.
- [ ] Navigation auf `/angebote`, `/produkte`, `/vermietung`, `/eigenmarke`, `/gewinnspiel`, `/galerie`, `/kontakt` und GrailBid legen; Rezepte/Partyplanung sichtbar erreichbar halten.
- [ ] Einzeltests und konkrete Browserwechsel prüfen.

### Task 3 Leihkatalog und Mengenbegrenzung

**Files:** neuer `data/rentals.ts`, `/vermietung`, `lib/cart-items.ts`, `context/CartContext.tsx`, `lib/reservation-inquiry.ts`, `ServiceSection.tsx`, betroffene Tests.

**Interfaces:** `RentalItem` liefert Identität, belegten Preis oder null, Bruchersatz oder null, physischen Bestand und Quellenstand. Gemeinsame Mengenvalidierung wird in Auswahl, Warenkorb und Anfrage verwendet.

- [ ] Exakte Quellzeilen und Mengenbypass als fehlgeschlagene Tests festhalten.
- [ ] Sämtliche belegten Leihartikel übernehmen; unbelegte Kühlwagenvarianten und Tagespreise entfernen.
- [ ] Obergrenzen bei wiederholter Auswahl und überlappenden Mietzeiträumen prüfen; keine verbindliche Verfügbarkeit behaupten.
- [ ] Homepage-Kurzliste mit Preis und Bestand anzeigen; Vollkatalog auf eigener Unterseite.
- [ ] Unit- und Browserprüfung von Auswahl bis Anfrage durchführen.

### Task 4 Team und Canva-Bildzuordnung

**Files:** `data/gallery.ts`, `data/cinematic-editorial.ts`, Bildherkunftsnachweise, `PeopleSection.tsx`, `/galerie`, Bildderivate.

**Interfaces:** Jedes neue Bild benötigt bekannte Canva-Identität, lokalen Originalexport, Hash, Rubrik und Ausschnitt. Alte Namenslisten sind keine aktuelle Beschäftigungsbestätigung.

- [ ] Die acht fehlenden lokalen Portraits mit Canva-Motiven abgleichen.
- [ ] Alle belegten alten Teammitglieder zeigen; keine unbestätigten zusätzlichen Namen oder Rollen übernehmen.
- [ ] Gruppenfoto breit, Portraits ohne doppelten pauschalen Crop darstellen; keine falsche Mitarbeiterzahl aus Bildanzahl ableiten.
- [ ] Desktop und Mobil visuell prüfen. Nicht auflösbare Originalexport-Lücken ausdrücklich dokumentieren.

### Task 5 Gewinnspielseite und Agenda 2026

**Files:** neue datierte Gewinnspieldaten und Klassifizierung, `/gewinnspiel`, `/gewinnspiel/archiv`, Homepage-Aktionsrubrik, Tests.

**Interfaces:** Datensätze enthalten Jahr/Monat, Gewinn, Originalpost, belegten Teilnahmeschluss und optional verifiziertes lokales Canva-Motiv. Status entsteht aus Berliner Datum; Teilnahme bleibt beim Originalbeitrag.

- [ ] Instagram-Originale Januar bis September mit Canva beziehungsweise lokalen Exporten abgleichen.
- [ ] Monatsagenda mit belegten Aktionen auf eigener URL anzeigen; noch nicht angekündigte Monate nicht erfinden.
- [ ] Aktuelle und beendete Aktionen trennen, auf der Startseite sichtbaren Einstieg ergänzen.
- [ ] Berliner Tagesgrenzen und Jahreswechsel testen; 2025-Motiv als 2026 ausschließen.

### Task 6 Rubrikbilder und Rezeptunterseiten

**Files:** Rubrikdaten, `AssortmentSection.tsx`, `/cocktails`, Kategorie- und Service-Bildkomponenten, Herkunftsnachweise.

- [ ] Vorhandene Canva-Motive passend auf Sortiment, Menschen, Eigenmarken und Vermietung verteilen.
- [ ] Große Emoji-/Logo-Bildersatzflächen entfernen. Fehlende konkrete Fotos nicht durch thematisch falsche Bilder kaschieren.
- [ ] Rezepte über eigene Detail-URLs zugänglich machen; keine falsche Rezeptabbildung aus beliebigem Produktfoto.
- [ ] Weitere Themen nur bei tatsächlich passendem Material ergänzen, etwa regionale Spezialitäten, Geschenkideen oder echte Marktaktionen.

### Task 7 Forensische Abschlussprüfung und Sicherung

- [ ] Alle öffentlichen Routen, internen Links und aktiven/gesperrten Endpunkte testen.
- [ ] Anfrageliste, Mietmengen, mobile Navigation, Tastaturbedienung, Rezeptdetails und Jahresagenda prüfen.
- [ ] Volle Unit-Suite, TypeScript, ESLint, Produktionsbuild und Browsertests ausführen.
- [ ] Unabhängiger Review; relevante Findings debuggen und erneut prüfen.
- [ ] Reale Vorschau auf 3000 und 3103 aktualisieren, Screenshots speichern, genaue Dateien committen und pushen.
- [ ] Abnahme mit belegten Ergebnissen und noch offenen Quellen-/Betreiberangaben übergeben; keine pauschale Behauptung vollständiger Rechtskonformität.
