# Sortiment und automatische Handzettel-Aktionsware

Stand: 08.10.2026. **Design zur Abnahme; noch nicht implementiert.**

## Auftrag und Ziel

Niko hat den Ablauf „Neue HZ einlesen → Artikel samt Bildern und Preisen übernehmen → Warengruppen zuordnen → prüfen → neue Auswahl aktivieren“ bestätigt. Sobald eine neue Ausgabe unter Angebote aktiv wird, muss dieselbe Ausgabe die Aktionsware im Sortiment bestimmen. Vorwochenangebote verschwinden aus der Kundensicht. Später kommen etwa 4.000–5.000 WWS-Artikel hinzu; Kunden sollen dann sowohl das vollständige Sortiment durchsuchen als auch gezielt Aktionsware aufrufen können. Die bestehende warme Gestaltung und die übersichtliche Hauptnavigation bleiben bestehen.

Nicht Gegenstand dieses Ausbaus: die tatsächliche WWS-Anbindung, Zahlungsbetrieb, Hosting oder öffentliche Veröffentlichung. Keine erfundenen Stammdaten, Bestände, EANs, Vergleichspreise oder Rabatte. Canva und Instagram bleiben unverändert.

## Ausgangslage

- `scripts/content-weekly.ts` übernimmt und prüft die Handzettel, erzeugt aber keine Aktionsartikel.
- `data/weekly-offers.json` enthält derzeit 16 einzeln geprüfte Bildausschnitte. Preise stehen in den Motiven, nicht in normalisierten Angebotsfeldern.
- `WeeklyOfferGrid` lädt diesen Datenstand fest mit der Anwendung; sein periodischer Abruf erneuert nur den Flyerindex. Offene Tabs erhalten damit keine neuen Artikel.
- Der historische Gemini-Extraktor ist nicht angeschlossen und für die Veröffentlichung ungeeignet: Er kann fehlende Preise auf null setzen, Angebotszeiträume aus Dateinamen ableiten und unbelegte EAN-Bilder zuordnen. Er wird nicht unverändert reaktiviert.

## Entscheidung und Alternativen

**Empfohlen:** Den vorhandenen lokalen Codex-Wochenlauf um verbindliche seitenweise Extraktion und visuelle Gegenprüfung erweitern. Deterministische Prüfungen und eine gemeinsame Versionsfreigabe sichern die Ergebnisse ab. Dafür wird kein neuer externer KI-Dienst vorausgesetzt.

Ein direkter strukturierter Angebotsfeed wäre langfristig zuverlässiger und schneller, ist für die DE-/NL-Quellen aber nicht belegt. Eine ungeprüfte OCR-/KI-Sofortveröffentlichung wird ausgeschlossen. Die spätere WWS liefert Stammdaten, ersetzt nicht automatisch den separaten Abgleich gedruckter Aktionsbedingungen.

## Oberfläche

- Ein Hauptmenüpunkt **Sortiment** bleibt erhalten; kein zusätzlicher Hauptreiter.
- Heute steht dort **Aktionsware** mit Suche, Warengruppen und Sprachwahl „Alle / DE / NL“. Die vollständigen Originalhandzettel bleiben unter **Angebote**.
- Mit einer tatsächlich geprüften WWS-Verbindung erscheinen innerhalb des Sortiments die Ansichten **Alle Artikel** und **Aktionsware**. Vorher wird kein leeres Vollsortiment mit 5.000 Platzhaltern vorgetäuscht.
- Suchbegriff, Kategorie, Sprache und gewählte Ansicht sind verlinkbar und bei Vor-/Zurücknavigation erhalten. Kategorieansichten nutzen denselben Angebotsbestand.
- Aktionskarten zeigen Originalbildausschnitt, Namen, Gebinde, ausdrücklich belegten Angebotspreis, Pfand, Bedingungen und Gültigkeit. Kein künstlicher durchgestrichener Altpreis oder Prozent-Rabatt ohne belegte Vergleichsbasis.
- Für das spätere Vollsortiment werden Suche, Filter und seitenweise Ausgabe über eine Datenzugriffsgrenze geführt; nicht 5.000 Artikel samt Bildern ungefiltert in den Browser laden. Die reale WWS-Schnittstelle wird erst nach Vorlage ihres Datenvertrags implementiert.

## Gemeinsamer Wochenwechsel

1. Der Sonntagslauf um 17:00 Uhr Europe/Berlin sucht die folgende Zielwoche; die Tageskontrolle um 06:15 Uhr erkennt fehlende oder nachträglich korrigierte Ausgaben. Eine spätere Erkennung des Originals ist nicht gleichbedeutend mit sofortiger Veröffentlichung.
2. DE-Original und authentischer einseitiger NL-Export werden zunächst als Kandidaten mit gedrucktem Zeitraum, Quellenidentität, Originalversion und Dateihashes vorbereitet.
3. Der Lauf erfasst alle Angebotsblöcke auf allen relevanten Originalseiten, einschließlich Varianten, Mengenstaffeln, Pfand, Grundpreis und App-/Mehrkaufbedingungen. Bilder bleiben vollständige relevante Originalausschnitte; keine KI-Produktfotos und keine vermuteten Produktbilder.
4. Jeder Kandidat erhält ein geprüftes Ergebnis. Ein Seitenprotokoll weist sämtliche Angebotsblöcke aus: übernommen oder mit konkretem Grund zurückgehalten. Eine Teilmenge wird nie als vollständige Extraktion gemeldet.
5. Vor Freigabe prüfen Code und visuelle Gegenprüfung Datenformat, Quellenhash, Bildhash, Bildausschnitt, Warengruppe, Preis-/Mengenangaben, Duplikate, Gültigkeit und Seitenabdeckung.
6. **Je Sprache und Originalversion wird ein vollständiges Veröffentlichungspaket gemeinsam aktiviert:** Handzettel, Angebotsdaten, Bilder und Prüfstatus. Vollständig bedeutet: alle Seiten geprüft und jeder Angebotsblock übernommen oder begründet zurückgehalten; fehlende Angaben werden nicht erzwungen. Zurückgehaltene Einzelangebote bleiben im Bericht sichtbar und zählen nicht als übernommene Artikel. Eine gültige DE-Ausgabe darf unabhängig von einer fehlenden NL-Ausgabe weiterlaufen. Eine abgebrochene technische Extraktion darf nicht versehentlich einen neuen Handzettel mit alten Artikelkarten kombinieren.
7. Die Kundensicht wählt ausschließlich die zum aktuellen Original gehörenden und aktuell gültigen Angebote. Kein Anhängen einer neuen Woche an den alten aktiven Bestand. Alte Quellen dürfen als interner Nachweis erhalten bleiben, werden aber nicht mehr als kaufaktuelle Ware ausgegeben.
8. Ein gemeinsamer aktueller Katalog-Endpunkt liefert Angebotsdaten und Quellenversion zusammen. Offene Tabs fragen ihn beim Öffnen, Wiederaktivieren und mindestens alle 60 Sekunden ab; die Datumsprüfung entfernt abgelaufene Angebote auch zwischen Abrufen. Abrufversagen darf alte Preise nicht über deren Ende hinaus verlängern.

Das Start-/Enddatum folgt dem gedruckten Original, gegebenenfalls dem engeren Zeitraum eines einzelnen Angebots. Jahreswechsel, Sommer-/Winterzeit und dokumentierte verkürzte Angebotswochen sind zu berücksichtigen. Vorbereitung am Sonntag zeigt Montagspreise nicht vorzeitig.

## Angebotsdaten und spätere WWS

Zwei getrennte Datentypen:

- **Aktionsangebot:** eigene ID, Sprache, Originalversion/Hash, Quelle/Seite/Ausschnitt, Bild/Hash, Name, Varianten und Gebinde, Preis in Eurocent, ausdrückliche Pfand-/Grundpreis-/Bedingungsangaben, Warengruppe, individueller Zeitraum und Prüfstatus.
- **WWS-Artikel:** stabile tatsächliche Artikelnummer, bestätigte GTIN und Gebinde, Stammdaten sowie tatsächlich verfügbare Preis-/Bestandsfelder aus der späteren Schnittstelle.

Ein DE- und ein NL-Angebot desselben Produkts bleiben getrennt, wenn Preise oder Bedingungen differieren. Die spätere Verknüpfung zum WWS erfolgt nur über bestätigte Identitäten, nicht über ähnliche Namen. Ein Handzettelangebot erzeugt keinen erfundenen WWS-Bestand und keinen neuen Bestellbetrieb.

## Fehlerregeln und Betriebsgrenzen

- Fehlende oder unlesbare Preise werden nicht als 0 € veröffentlicht. Unklare Angebotsblöcke werden dokumentiert; ein klarer Verweis auf das vollständige Original bleibt möglich.
- Nikos Freigabe vom 08.10. für unveränderte NL-Originale trotz dokumentierter Preisabweichungen gilt weiter. Sie ist keine Bestätigung jeder normalisierten Einzelangabe. Widersprüchliche Einzelangebote dürfen nicht eigenmächtig umgerechnet oder bereinigt werden.
- Defekte Dateien, falsche Woche, ungeklärte Herkunft oder ein mehrseitiger NL-Export bleiben blockierend. Nur die betroffene Quelle wird zurückgehalten. Ein alter Preis wird niemals zur Überbrückung verlängert.
- Wiederholte Läufe derselben Quellenversion erzeugen keine doppelten Artikel oder Bilddateien. Abgebrochene Läufe lassen keine halb veröffentlichten Pakete zurück.
- Die bestehenden Automationen und das Runbook müssen die Artikelerfassung und Katalogprüfung verpflichtend enthalten; ein Erfolg nur beim PDF-Import reicht nicht mehr.
- Heute läuft diese Verarbeitung über Codex auf dem Mac und den authentifizierten Canva-Browser. Ausgeschalteter Mac, abgelaufene Anmeldung oder fehlendes Original können sie verhindern. Ein dauerhaft laufender unabhängiger Serverprozess ist ohne Hosting und nicht-interaktiven Quellenzugang noch nicht gegeben und wird nicht versprochen.

## Abnahme vor Aktivierung

- Zwei unterschiedliche Wochen als Testdaten: neue Artikel erscheinen, alte verschwinden; kein stiller Rückfall bei leerer/fehlerhafter Folgeausgabe.
- Montag 00:00, Original-Enddatum, Sonntag, Jahreswechsel und Berliner Zeitumstellung.
- DE vorhanden/NL fehlt, NL später hinzugefügt, dieselbe Woche mit korrigierter Quellenversion.
- Mengenstaffeln, verschiedene Gebinde, Pfand, mehrere Varianten, fehlender Preis, belegte Originalabweichung.
- Vollständigkeitsnachweis je Originalseite und keine überschriebenen Motive bei ähnlichen Namen.
- Geöffneter Tab wechselt ohne manuelles Neuladen auf das neue aktive Paket; Such-/Filterauswahl bleibt bestehen.
- Beide Content-APIs, Startseite, Angebote, Handzettel, NL, Sortiment und Warengruppen stimmen über Quellenversion und Gültigkeit überein.
- Simulierter WWS-Adapter mit 5.000 ausschließlich lokalen Testartikeln: getrennte Aktionsauswahl, seitenweise Suche, keine Testprodukte in der öffentlichen Anwendung.
- Gesamttests, TypeScript, Build sowie Desktop-/Mobilprüfung; Commit und Push nur eigener geprüfter Änderungen. Keine öffentliche Deployment-Behauptung ohne tatsächlich konfigurierten und geprüften Server.

Nach Design-Abnahme folgt ein datei- und testgenauer Implementierungsplan. Erst danach erfolgt die Implementierung; der aktuelle Wochenbetrieb bleibt während dieser Abstimmung unverändert.
