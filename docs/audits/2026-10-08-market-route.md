# Routenfehler – 8. Oktober 2026

## Befund und Korrektur

- Der bisherige Google-Maps-Routenlink mit dem alleinigen Ziel `Jurgenstr. 20, 47574 Goch` führte bei der Browserprüfung zum **Sanitätshaus Mönks + Scheer GmbH, Klever Str. 16, 47574 Goch**.
- Der Betreiber nennt **Jurgensstraße 20**. Der geprüfte vollständige Zieltext `Trinkgut Jammers, Jurgensstraße 20, 47574 Goch, Deutschland` löst in Google Maps sichtbar zu **trinkgut Jammers Goch e.K., Jurgensstraße 20, 47574 Goch** auf.
- `MARKET.street` und `SITE_LINKS.route` sind jetzt die gemeinsame Quelle für Adresse und Route. Kontaktseite und bisheriger Footer verwenden denselben Link wie Startseite und NL-Seite. Verbliebene öffentliche Adressangaben und Metadaten übernehmen die zentrale Adresse.
- Kein fester Startort, keine Nutzerkoordinaten und keine erfundene Place-ID sind im Link enthalten. Private Routenstartdaten aus der Maps-Prüfung wurden nicht als Beleg gespeichert.

## Quellen

- Betreiberkorrektur im Auftrag vom 08.10.2026.
- Google Maps: altes und korrigiertes Ziel im Browser geprüft. Der vollständige neue Zieltext ist oben dokumentiert; der lokal personalisierte Ergebnislink wird nicht archiviert.
- [Offizieller Marktauftritt](https://www.trinkgut.de/markt/jammers): Markt und Telefonnummer bestätigt; dort steht weiterhin die abweichende Abkürzung `Jurgenstr.20`.
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started): Directions-URL mit `api=1` und kodiertem `destination`.

## Verifikation

- Neue Render-Regressionsprüfung scheiterte zuerst erwartungsgemäß: Kontaktseite nutzte `/maps/search/`, gemeinsamer Footer übergab das unvollständige Ziel.
- Nach Korrektur: 27 fokussierte Tests bestanden.
- Gesamtlauf `npm test`: **69 Dateien, 1.050 Tests bestanden**.
- `npm run build`: erfolgreich, einschließlich TypeScript und Content-Vorprüfung.
- HTTP 200 auf `/`, `/kontakt`, `/nl`, `/impressum`, `/leergut`; überall korrekte Adresse und derselbe vollständige Maps-Routenlink, keine alte Abkürzung im HTML.
- Kontaktseite zusätzlich im Browser geprüft; Screenshot: `audit/screenshots/route-fix-2026-10-08/kontakt.png`.
- Unabhängige Codeprüfung: kein blockierender Befund. `git diff --check` fehlerfrei.
- Öffentlicher Server weiterhin nicht online; das ist ein lokal geprüfter Stand, kein Live-Nachweis.

## Separater NL-Gestaltungsauftrag

Der kurze Design-Abgleich ist noch unbeantwortet: oben sichtbarer Einstieg mit NL-Flagge, „Nederlands · Click here“ und dezentem Pfeil; Besuchs-Landingpage mit „Jouw drankenadres in Goch“, bestehendem echten Canva-Marktfoto, Angeboten und Route direkt im Einstieg. Bestehende Farben bleiben erhalten. Diese optische Änderung wurde noch nicht implementiert. Keine Kontaktaufnahme mit De Gelderlander und keine Anzeigenbuchung vorgenommen.

Nachtrag: Anschließend wurde die behutsame Oranje-Variante für die NL-Seite mit „starte“ freigegeben und umgesetzt. Ergebnis und Prüfungen: [NL-Refresh](2026-10-08-nl-refresh.md). Der obige Absatz beschreibt den Stand zum Abschluss der vorangegangenen Routenkorrektur.
