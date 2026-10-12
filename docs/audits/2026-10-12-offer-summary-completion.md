# KW42: vollständige Originalangebots-Zusammenfassungen

## Prüfstand

Am 12.10.2026 wurden alle 82 aktuellen Originalausschnitte einzeln visuell gelesen: 70 deutsche Angebote aus dem zehnseitigen Wochenhandzettel und zwölf niederländische Angebote aus der einseitigen Agenturoriginalausgabe De Maas Driehoek. Die bestehenden Ausschnittdateien wurden in 14 privaten Kontaktbögen zur Sichtprüfung dargestellt; der LEGO-Treueaktionsblock zusätzlich in voller Größe. PDF- und Ausschnitthashes wurden gegen die bereits gebundenen Originaldateien geprüft. Dies ist eine quellenbezogene redaktionelle Prüfung, keine Bestands-, WWS- oder Preisnormalisierung.

Die 79 bislang fehlenden Zusammenfassungen wurden im bestehenden Layout ergänzt. Alle 82 haben jetzt die vier Klartextfelder `price`, `package`, `deposit` und `unitPrice`. Die drei bereits veröffentlichten Pilotzusammenfassungen bleiben identisch. Bedingungen, Quellenwarnungen, gedruckte Gültigkeit vom 12. bis 17.10.2026, IDs, Ausschnittkoordinaten, Pfade und Hashes sind unverändert. Ein strukturierter Vergleich mit dem Ausgangsstand `1abb844` bestätigt: ohne das Feld `summary` ist das komplette Layout gleich; die 128 historischen Angebote einschließlich ihrer gesamten Metadaten sind gleich.

## Besondere Fälle

- Warsteiner DE: reguläre 11,99 € und APP-Preis 10,99 €, beide Kastenvarianten, beide Pfandbeträge und beide Paare gedruckter Grundpreise erhalten. Die vollständigen APP-/PAYBACK- und Mischkastenbedingungen stehen weiterhin im Angebot.
- Gerolsteiner: 10,00 € ausdrücklich für zwei Kästen; 3,30 € Pfand ausdrücklich je Kasten. Kein erfundener Einzelkastenpreis.
- Kloster Andechs und Pülleken: tatsächlicher Angebotspreis, Gratiszugabe und zusätzliches Pfand erhalten. Die gedruckten rechnerischen Werte 16,41 € bzw. 10,00 € sind als solche bezeichnet, nicht als weitere Kassenpreise.
- LEGO: 5,99 € mit fünf APP-Treuepunkten und 11,99 € UVP ohne Punkte; alle acht Varianten als eine Preisfamilie. Sammel- und Einlösefristen bleiben vollständig in den Bedingungen. Keine erfundenen Pfand- oder Grundpreisangaben.
- Amecke: Kasten und Einzelflasche bleiben getrennt; die Gebindegröße der Einzelflasche wird aus dem zugehörigen gedruckten Kasten-/Flaschenkontext beschrieben. Keine Übertragung des Kastenpfands auf die einzelne Flasche.
- Prinzen Rolle: Gebindespanne 330 bis 400 g und der gedruckte Grundpreis mit „ab“ bleiben erhalten; keine Auswahl eines erfundenen einheitlichen Gewichts.
- Red Bull NL: „0,25 ml Blik“ bleibt trotz widersprüchlicher Einheit erhalten und im Kurztext als so gedruckt gekennzeichnet. Die bestehende Quellenwarnung wurde nicht korrigiert oder entfernt.
- Warsteiner NL: 1,25 / 1,58 €/l als gedruckte Originalwerte erhalten; kein APP-Grundpreis ergänzt. Hertog Jan: 24 × 0,3 l und 1,40 €/l erhalten. Die beiden bestehenden Preis-/Gebinde-/Grundpreiswarnungen bleiben unverändert; die Quelle bestimmt nicht, welcher Einzelwert fehlerhaft ist.

35 Angebote nennen keinen separaten Pfandbetrag im Original (28 DE, sieben NL). Sie verwenden eine ausdrückliche quellenbezogene Nicht-Angabe, keine Aussage „pfandfrei“. Bei sieben Angeboten fehlt ein separater Grundpreis vollständig (fünf DE einschließlich LEGO, zwei NL); diese Werte werden nicht aus Preis und Menge berechnet. Bei Warsteiner NL fehlt zusätzlich nur der APP-Grundpreis. Deutsche und niederländische Beschreibung verwenden die jeweilige Sprache. Kommas, Multiplikationszeichen und kompakte Einheiten sind reine Lesetypografie, keine Rechenkorrekturen.

## Dauerhaftes Wochen-Importgate

`buildPublicOfferMetadata` verlangt für Wochenquellen ab dem ausdrücklich abgeschlossenen KW42-Paket (`validFrom >= 2026-10-12`) eine vollständige gültige Zusammenfassung. Die bestehende Prüfung akzeptiert ausschließlich die vier begrenzten, nichtleeren Klartextfelder; sie lehnt Zusatzfelder, Zahltypen, Markup und fehlerhafte Fakten weiterhin ab. Quellenwarnungen umgehen die Vollständigkeit nicht. Fehlende Druckwerte sind beschreibbar und werden niemals berechnet.

Das Gate wird von Neuerzeugung, Bindungsprüfung und Laufzeitprüfung gemeinsam benutzt. Historische KW41-Pakete bleiben kompatibel ohne erfundene nachträgliche Werte; eigenständige Zusatzanzeigen bleiben getrennte Publikationen und werden nicht versehentlich der Wochenpflicht unterstellt. Eine fehlerhafte Sprachfassung nimmt einer vollständigen Schwesterfassung nicht die Verfügbarkeit. Bei fehlerhafter neuer Erfassung ersetzen Generator und strikte Prüfung keine bestehenden Angebotszeilen, Publikationsbindung oder Bildbytes.

## Nachweise und Übergabegrenze

Die private Prüfevidenz liegt ausschließlich im auftragsbezogenen `offers`-Prüfbereich: 82-ID-/Seiten-/Bildhash-Census, 14 Kontaktbögen und die manuell nach Sichtprüfung erfasste Vier-Fakten-Tabelle. Private Original- oder Accountreferenzen werden nicht öffentlich ausgegeben. Die beiden gebundenen öffentlichen Original-PDFs sind unverändert.

Der erste Census-Test wurde vor der Datenänderung ausgeführt und scheiterte an genau 79 fehlenden Zusammenfassungen. Das neue Wochen-Gate wurde vor seiner Implementierung mit vier erwarteten Ablehnungsfällen rot gesehen; danach bestanden die sieben reinen Metadaten-Gatefälle. Der frische fokussierte Lauf mit sechs produktiven Testdateien bestand anschließend **176/176 Tests** (17,53 Sekunden), einschließlich Generator-Ablehnung ohne Datenersatz und Verfügbarkeit der vollständigen Schwesterfassung:

```sh
NODE_ENV=test npx vitest run lib/__tests__/weekly-offer-summary-coverage.test.ts lib/__tests__/weekly-offer-metadata.test.ts lib/__tests__/weekly-publication-build.test.ts lib/__tests__/official-publication-import.test.ts lib/__tests__/sunday-flyer-preview.test.tsx lib/__tests__/weekly-public-routes.test.ts --exclude '.superpowers/**'
```

Zusätzlich bestanden der erneute 82-Ausschnitte-Hashvergleich gegen die publizierten SHA-256-Werte, der Vergleich beider PDF-Hashes und `git diff --check` für die betroffenen Dateien. Das gemeinsame synthetische Wochenfixture trägt für neue Wochen vollständige vier Fakten, damit bestehende Provenienz-/Integritätstests weiterhin ihren beabsichtigten Zweig prüfen; KW41 bleibt ohne Summary.

Ein zunächst zu breit gefilterter Fokuslauf erfasste versehentlich alte ignorierte Runtime-/Performancekopien unter `.superpowers`; deren veraltete Fixtures sind keine Releaseprüfung und wurden nicht geändert. Der anschließende qualifizierende Lauf schließt `.superpowers/**` aus. Ein Argumentformfehler in zwei neuen tabellengesteuerten CLI-Tests wurde am Testursprung korrigiert, ohne Produktionsverhalten zu lockern.

Dieser Teilauftrag erzeugt keine neuen Originalbilder, startet keinen Produktionsbuild und verändert keine Konten, Server- oder Betriebsfunktionen. Die zentrale Neuerzeugung von `weekly-offers.json`, die Neubindung des KW42-Manifests, der 210-Angebote-Originalgate, die tatsächliche Karten-/HTTP-Abnahme sowie Commit, Veröffentlichung und vollständige Websuite erfolgen anschließend serialisiert durch den Controller. Bis dahin ist der Layout-/Gate-Stand vollständig, aber kein neuer öffentlicher Release behauptet.
