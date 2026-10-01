# Trinkgut Jammers nächste Arbeitsschritte

Stand: 1. Oktober 2026. Arbeitsort und bestätigte Vorgaben: [PROJECT-STATUS.md](PROJECT-STATUS.md). Diese Checkliste ersetzt die veralteten Teamzuordnungen, pauschalen Backend-Aufgaben und ungeprüften Importwünsche der alten Liste; historische Fassungen bleiben in Git.

Der öffentliche Server ist laut Betreiber noch nicht online. Der Mietablauf wurde anschließend ausdrücklich zur Implementierung freigegeben. Keine Veröffentlichung, kostenpflichtige Einrichtung oder Livezahlung daraus ableiten. Einrichtung und Abnahme: [RENTAL-ORDER-RUNBOOK.md](RENTAL-ORDER-RUNBOOK.md).

## Betreiberantworten zuerst

- [ ] [OFFENE-FRAGEN.md](OFFENE-FRAGEN.md) beantworten und Entscheidungen gezielt übernehmen.
- [ ] Domain/Hosting und Betrieb bei ausgeschaltetem Mac klären.
- [ ] Firmennachweise, fachliche Rechtsprüfung, Datenschutz-/Aufbewahrungsregeln und Altbestände abstimmen.
- [x] Zahlungszeitpunkt: nach Marktannahme per Link oder bar bei Abholung.
- [ ] Zahlungsfrist, Kaution, Lieferung, Zusatzkosten, Stornierung und Übergabezeiten klären.
- [ ] Anbieter, Kostenrahmen, Sammelpostfach, Versand und Rechnungswesen festlegen.
- [ ] Steuersatz, Kundengruppen, Belegzeitpunkte und Marktberechtigungen bestätigen.

## Technische und redaktionelle Arbeit danach

- [x] Mietkalender zeitzonenunabhängig reparieren und NRW-Feiertage integrieren; 23.–26.10.2026 ergibt drei Werktage.
- [x] Dreierblöcke, Grenzfälle, Mengen und Cent-Rundung testen; Live-Aktivierung ohne vollständige Konfiguration sperren.
- [x] Acht unbepreiste Artikel auf Anfrage lassen; gemischte Auswahl nicht als vollständig bepreist ausgeben.
- [ ] Exakte NL-KW40-Seite beschaffen und Datum, Sprache, Einzelpage, Dateien und SHA-256 nach Runbook prüfen. KW41 nicht ersetzen lassen.
- [ ] Vier fehlende Gewinnspielcover zuordnen oder begrenzte Ausnahmeentscheidung abwarten.
- [ ] Harpe-/Justin-Bildzuordnung abgleichen; keine Gesichtsidentifikation. Neue Personenmotive nur mit belegter Freigabe.
- [ ] Passende Canva-Fotos für reale Leihartikel, Sortiment und Marktleben auswählen; Cocktails erst nach Klärung der Bildregel ergänzen.
- [ ] Niederländische Texte muttersprachlich abnehmen lassen.

## Verbindlicher Checkout als eigener Ausbau

- [x] Bestellablauf vom Betreiber freigegeben; Implementierungsplan angelegt und umgesetzt.
- [x] Serverseitige Preis-/Bestandsprüfung, dauerhafte Bestellungen und Wiederholungsschutz umsetzen.
- [x] Zahlung, Marktannahme, Barzahlung, Übergabe und Rückgabe getrennt nachverfolgen.
- [x] Rechnungs-/Lieferscheinprozess und Versandwarteschlange an beide Empfänger ohne doppelte Nummern oder Bestellungen umsetzen.
- [x] Lokale Zahlungssimulation und Mailaufzeichnung ohne externe Transaktionen integrieren.
- [ ] Echte Anbieter-/Versandtests nach Kontoeinrichtung und konkreter Freigabe durchführen.
- [ ] Stornierung/Erstattung und Aufbewahrung mit dem Betreiber festlegen; keine automatische Erstattung implementiert.
- [ ] Vertrags-, Datenschutz-, Widerrufs- und Rechnungsinformationen fachlich abnehmen lassen.

## Veröffentlichung zuletzt

- [ ] Tatsächliche HTTPS-Produktionsadresse und Hosting dokumentieren.
- [ ] Serverunabhängigen Wochenprozess nach Betriebsentscheidung einrichten; Sonntag 17:00 und täglich 06:15 Europe/Berlin beibehalten.
- [ ] Komplette DE-/NL-Werbung, Endpunkte, Browser, Zahlungen und Belege auf dem Zielsystem prüfen.
- [ ] Erst nach öffentlicher Prüfung Veröffentlichung bestätigen. GitHub/localhost sind kein Live-Nachweis.

Bestätigte Teamänderungen, Fotoformat, Mietpreiszeitraum und Kalenderzählung nicht erneut abfragen. Codefehler, Sicherheitsmaßnahmen und Tests sind Engineering-Aufgaben, keine Betreiberentscheidungen.
