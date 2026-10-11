# NL-Wochenwerbung und zusätzliche Maasduinen-Anzeigen

Stand: 11.10.2026. Die fachliche Darstellung wurde im Chat erklärt und von Niko mit „oki hört sich gut“ bestätigt; zusätzlich soll anschließend KW42 hochgeladen werden. Dieser Entwurf übersetzt das in technische Entscheidungen. Noch keine Umsetzung oder Veröffentlichung aus diesem Dokument ableiten.

## Gewünschtes Ergebnis

- Zwei reguläre Hauptansichten unter Angebote: deutscher Trinkgut-Handzettel links, niederländische Wochenanzeige rechts; mobil untereinander.
- Ab KW42/2026 kommt die reguläre NL-Anzeige in geraden ISO-Kalenderwochen aus De Maas Driehoek, in ungeraden aus Udens Weekblad. Beide kommen von der Agentur und liegen als Originale im Desktopbestand vor.
- Maasduinen bleibt eine eigene, vom Markt in Canva gestaltete Anzeigenreihe mit zwölf Schaltungen jährlich. Eine belegte gültige Ausgabe erscheint zusätzlich unter dem Hauptpaar, unter „Zusätzlich aktuell: Maasduinen“ bzw. „Ook actueel: Maasduinen“. Keine zwölf festen Monatstermine erfinden.
- Dieselben Ausgaben auf Startseite, `/angebote`, `/handzettel`, `/nl` und in den Inhalts-APIs. Alle zugehörigen Original-Angebotskacheln erscheinen im Sortiment und in ihren Warengruppen.
- Jede Ausgabe und ihre Angebote erscheinen ausschließlich innerhalb ihres eigenen gedruckten Zeitraums nach Europe/Berlin. Zusatzausgaben dürfen über Wochen-, Monats- oder Jahresgrenzen reichen und sonntags gelten. Fehlende Wochenwerbung wird niemals durch Maasduinen als erfüllt dargestellt.
- KW42 vorbereiten, prüfen und auf dem bestehenden Server bereitstellen. Nicht vor dem 12.10.2026 als aktive Wochenwerbung anzeigen.

## Unveränderte Grenzen

- Bestehendes filmisches Design und vorhandenen vollständigen PDF-Viewer wiederverwenden, keine neue Hauptnavigation.
- Originale vollständig und unbeschnitten. Sämtliche Angebote mit Originalpreisen, Pfand, Varianten, App-/Mengenbedingungen und vorhandenen Warnungen übernehmen. Keine erfundenen WWS-Daten oder still korrigierten Preise.
- Herkunft wahrheitsgetreu: offizielle Trinkgut-Quelle, Agenturoriginal oder Canva. Keine fingierten Canva-IDs/URLs für Agenturmaterial. Private Desktop-/Accountdaten bleiben außerhalb öffentlicher DTOs/Berichte.
- Vorhandene KW41-Manifeste, Provenienz, Angebote und historische Nachweise unverändert erhalten. Neue Quellenregel gilt ab Zielmontag 12.10.2026, unabhängig vom angegebenen Schemaversionswert.
- Dateien unveränderlich, hashgebunden und vollständig geprüft vom eigenen Server ausliefern. Späterer Ursprungs-404 entfernt kein intaktes importiertes Paket.
- Fehlende optionale Maasduinen-Ausgabe ist normal. Eine deklarierte, aber defekte relevante Zusatzausgabe wird gemeldet und zurückgehalten; gültige Hauptausgaben bleiben sichtbar.
- Keine Änderungen an Mail, Bewerbung, Zahlungen, Mietbetrieb, DNS oder Server-Sicherheitskonfiguration. Kein Server-Canva-Cron und keine Anbieterregistrierung.

## Technische Entscheidungen des Implementierers

1. Die reguläre Wochenbindung bleibt ein Paar DE/NL. Neue Wochenbindungen verwenden Schema 2; bestehende Schema-1-Bindungen bleiben lesbar und bytegleich. Ein gemeinsamer Quellenprüfer erzwingt ab KW42 die Agentur-/Paritätsregel auch bei neuen Schema-1-Eingaben.
2. Maasduinen erhält eine unabhängige Bindung je Ausgabe unter `data/editorial/supplemental-publications/<id>.json`. Dadurch verschwindet eine länger gültige Anzeige nicht beim nächsten Montag und muss nicht in jede Woche kopiert werden.
3. Gemeinsame normalisierte Identität: `purpose` = `weekly` oder `supplemental`; `medium` = `trinkgut`, `de-maas-driehoek`, `udens-weekblad`, `maasduinen` oder ausschließlich für unveränderte historische Zuordnung `legacy-canva`. Herkunft und Darstellungsrolle sind getrennt. Öffentliche Links zeigen nur auf lokale Originale.
4. Gemeinsame unveränderliche Original-/Cover-/Kachelprüfung, aber getrennte Wochen-/Zusatz-Zeitraumregeln. Fehler müssen einer geprüften Ausgabe bzw. einem getrennten Register zugeordnet bleiben. Unbekannte beschädigte Zusatzdatei darf nicht das Hauptregister sperren; gemeinsame unterbrochene Schreibtransaktion sperrt weiter den gesamten unsicher gebundenen Bestand.
5. Angebotserzeugung ersetzt nur Zeilen der ausdrücklich ausgewählten Ausgaben-IDs. `--week` bearbeitet nur reguläre Wochenquellen; `--edition <id>` gezielt eine Zusatzausgabe. Beide teilen sich die bestehende Transaktionssperre. IDs sind über alle Ausgaben eindeutig.
6. `flyer` und `nlFlyer` bleiben die Hauptausgaben der Homepage; neue `supplementalFlyers` enthalten nur Zusatzausgaben. Alle vollständigen Flyer-/Angebotsarrays werden aus derselben geprüften zeitlichen Auswahl gebildet.
7. Alte offene Browser bleiben kompatibel: `/api/content/offers` ohne Versionsheader behält die bisherigen Felder und liefert die vollständige gültige Auswahl ohne neue Metadaten. Neue Clients verlangen `X-Jammers-Content-Version: 2` und erhalten auch Rolle/Medium. Beide Antworten bleiben `no-store` und setzen `Vary: X-Jammers-Content-Version`. Fehler-/Race-/Ablaufregeln bleiben erhalten. Keine zweite inhaltliche Wahrheit und kein Umschreiben von Offer-IDs.
8. Ähnliche Produkte in DE/NL/Zusatzanzeigen werden nicht anhand des Namens zusammengeworfen: Preis-/Mengenbedingungen können verschieden sein. Jede Originalkachel ist über ihre Ausgabe und ihr Datum erkennbar; dieselbe Ausgaben-ID darf nie doppelt erscheinen.
9. Bestehende Automationen inhaltlich anpassen, keine Duplikate. Zum Inventurzeitpunkt ist die Sonntagsaufgabe aktiv auf 19:00 gespeichert, die tägliche 06:15-Kontrolle pausiert. Diese tatsächlichen Zeiten/Status bleiben ohne neue Betreiberanweisung unverändert; abweichende historische 17:00-Dokumentation wird als solche berichtigt, nicht still als aktueller Schedulerstand ausgegeben.

## Quellenstand und Veröffentlichung

- Zielwoche: Montag 12.10.2026 bis Samstag 17.10.2026, KW42.
- Agenturoriginal: eine Seite, 3.113.358 Bytes, SHA-256 `b669c22d2e7bcb6466af9771cf68573f935312556db0d58e24db9a6e5bfe448d`. Gedruckten Zeitraum bereits visuell bestätigt; vollständige Angebots-/Layoutabnahme noch offen.
- DE: offizielle Goch-Quelle `https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest`, Markt 13027, Werbekreis 3.6. Browser zeigt „KW42 2747 RHEINRUHR“ und auf der Titelseite 12.–17.10.2026. Der erste CLI-Abruf endete im Timeout; der gezielte zweite Abruf bestand: Katalog 1394743, Version 1, zehn Seiten, 12.–17.10.2026; Viewer/XML per GET und zehn Seiten/Vorschauen sowie PDF per HEAD jeweils HTTP 200 mit passendem Inhaltstyp. Offizielle PDF: `https://werbung.trinkgut.de/frontend/catalogs/1394743/1/pdf/complete.pdf`. Das bestätigt Erreichbarkeit und Metadaten, noch nicht PDF-Bytes, vollständige Seiten-/Angebotsprüfung oder Hashbindung. Kein fortbestehender Quellenblocker und kein fertiger Import behauptet.
- Maasduinen: exakte aktuelle Canva-Ausgabe gezielt suchen und nur den belegten Zeitraum übernehmen; die abgelaufene KW41-Datei nicht wieder aktivieren. Keine vorhandene aktuell gültige Zusatzausgabe voraussetzen.
- Quellimport, vollständige Kachelerfassung, lokale Tests und Linux-Release sind getrennte Gates. Öffentliche Zukunftsdateien und Releasebindung am Sonntag nachweisen; aktive Montagansicht nur auf isolierter Testumgebung mit ausdrücklich markierter Prüfuhr testen. Produktion folgt der echten Zeit.

## Abnahme

Unabhängiger Builder-Check am 11.10.2026: keine wichtigen unbeantworteten Fragen. Anschließend bestätigt Niko den gespeicherten technischen Plan samt getrennter Umsetzung/Prüfung mit `leg los`. Umsetzung und KW42-Veröffentlichung nach bestandenen Gates sind beauftragt; dieser Vermerk ist noch kein Ausführungsnachweis.

Reguläre KW42-PDFs, vollständige Covers und sämtliche Originalangebote hashgebunden; richtige Quellen und vollständige Zählung. Zusatzfälle mit echten oder eindeutig synthetischen Testdaten: Überlappung, anderer Starttag, Sonntag, Monats-/Jahreswechsel, Berliner Mitternacht/DST, fehlende Wochenwerbung, defekte Zusatzdatei. Keine gültige Gegenausgabe verschwindet durch einen eindeutig zuordenbaren Quellenfehler. Alle APIs und sichtbaren Seiten stimmen überein; Mobil/Desktop und Tastaturbedienung bleiben nutzbar. Erst tatsächliche HTTPS-Prüfungen nach frischem Linux-Webrelease erlauben die Meldung „veröffentlicht“.
