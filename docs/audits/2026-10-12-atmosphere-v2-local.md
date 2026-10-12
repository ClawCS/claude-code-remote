# Atmosphärische Getränkewelt – lokale Nachbesserung V2

## Auftrag und Grenze

Der Betreiber hat die vorherige, zu schwache visuelle Überarbeitung abgelehnt und eine sichtbare Nachbesserung der gesamten Website mit echtem Live-Vergleich beauftragt. Diese Fassung ist ausschließlich lokal. Kein Deployment, keine Änderung an Serverbetrieb, DNS, Mail, Zahlungen, Bestellungen oder Bewerbungsfreigaben.

## Tatsächlich geändert

| Bereich | Nachbesserung |
| --- | --- |
| Startseite | Zusammenhängende Schnelleinstiege, kräftiges rotes Wochenangebotskapitel mit gleichwertigen DE-/NL-Originalen, größere Typografie, asymmetrische Sortiment-Fotokomposition und großflächige Party-Szene. Entfernte Startseitenblöcke und TCG wurden nicht wieder eingeführt. |
| Eigenmarken | Sechs unveränderte Originalflaschen als große Bildobjekte; individuelle Kirsch-, Haselnuss-, Vanille-, Karamell-, Lakritz- und Anis-Stimmungen. Hintergrund, Flasche, Licht und native Texte sind getrennte Ebenen. Keine Plakatgrafik ersetzt das Layout. |
| Pralle Kirsche | Größere Originalflasche, weiche Szenenübergänge, eigenständige Produkttexte/Fakten und separate mobile Bildkomposition. |
| Sortiment/Warengruppen | Getränkeszenen statt kleiner eingefasster Marktportraits, größere visuelle Kategoriennavigation und ruhige Original-Angebotskacheln. |
| Akademie/Rezepte | Große thematische Einstiege, hervorgehobener erster Kurs, nummerierte Kursbilder, fotografische Kurs-/Rezeptköpfe. Rezeptcredits bleiben vollständig sichtbar. |
| Menschen/Service/NL | Echte vorhandene Markt-/Personenfotos, intakte Partyillustration mit Logo, eigenständige orange NL-Welt, größere Gewinnspielgestaltung. |
| Anfrage/Recht/Navigation | Gemeinsame Typografie, Akzente, Inhaltsflächen und Besuchs-Footer. Formulare und rechtliche Texte bleiben ruhig und unverändert bedienbar. URLs, Menüs und Kontaktziele unverändert. |

Die bereits freigegebenen Getränkethemenbilder werden im Rahmen des nun ausdrücklich websiteweiten Getränkewelt-Auftrags auch für passende Warengruppen eingesetzt; sie werden nicht als echte Marktaufnahmen bezeichnet. Die fünf neuen Zutatenhintergründe wurden mit dem Bildwerkzeug erstellt; Prompts, Quellen und SHA-256 stehen in `assets/source/eigenmarken-scenes/v2-provenance.json`. Öffentliche neue WebP-Dateien zusammen etwa 474 KB. Originalflaschen wurden nicht neu generiert.

## Visuelle Gegenprüfung und behobene Befunde

Unabhängige Review plus direkte Browseransichten gegen die öffentliche Website:

- Ungewollt zu schmaler Rechtsseitenkopf durch verschobene `className`: getrennte innere Klasse und äußere `mediaClassName` wiederhergestellt.
- Rechts abgeschnittenes Partylogo bei 1024 px: Partyplaner und Vermietung verwenden explizit das vollständige `contain`-Motiv; 390/1024/1440 px erneut geprüft.
- Zu schwacher NL-Fotocaption-Kontrast: feste ruhige Captionfläche, gemessener Kontrast etwa 13:1.
- Notumbruch „Wochenangeb/ote“: ausschließlich Sortiment-Titel responsiv kleiner gesetzt; echter Jakarta-Font und Wortgrenzen bei 390/1024/1440 px durch Regressionstest geprüft.

Direkte Vergleichsaufnahmen liegen in `jammers-atmosphaere-v2` im lokalen Codex-Visualisierungsordner: Eigenmarken, Akademie, Sortiment und Startseite. Die Aufnahmen zeigen die tatsächlich gerenderten Seiten bei identischer Desktopgröße; keine nachträgliche optische Verbesserung der Webseitenbilder. Zusätzlich geprüft: mobile Eigenmarken, Pralle Kirsche und NL.

## Prüfungen

- Frische vollständige Website-Suite: **132 Dateien / 2.424 Tests bestanden**, native Bewerbungsdienste und `.superpowers` ausdrücklich ausgeschlossen.
- Finale Browser-Suite gegen den lokalen Produktionsbuild: **100/100 bestanden**. Alle 41 öffentlichen Kundentemplates plus 404 bei 360 und 1440 px; zusätzlich Navigation, Tastatur, Eigenmarken ohne JavaScript, Kategorien, Formularvalidierung und Fokusführung bei 390/768 px. Die Test-Sperre erlaubt ausschließlich lokale GET/HEAD-Anfragen; keine echten Anfragen versandt.
- Produktionsbuild mit `NODE_ENV=production`, `RENTAL_MODE=disabled`, ohne Testuhr: **bestanden**. Separate Snapshot-Vorschau: `http://127.0.0.1:3134/`. Vorherige Vorschauen wurden nicht als neues Ergebnis ausgegeben.
- Lint: **0 Fehler / 20 bereits bestehende Warnungen**. Next-Typegen und TypeScript bestanden; die abschließende Sortimentkorrektur wurde zusätzlich gezielt typ-/lintgeprüft.
- `git diff --check`: bestanden.
- Geschützte Originale und Daten per SHA-256: **406 Dateien, keine Abweichung**. `offers:check`: **210 Originalangebote samt Bildern** unverändert korrekt gebunden (einschließlich historischer Ausgaben).
- Quellstand und finaler lokaler Produktionssnapshot: **53 geänderte/neue ausführbare Präsentations-/Bilddateien hashgleich**.
- Unabhängige Code-/Bildreview: keine verbleibenden erheblichen Befunde. Ergänzende Accessibility-Stichproben auf sechs mobilen Seiten ohne automatisch erkannte WCAG-A/AA-/2.1AA-Verstöße; manuelle Kontrastprüfung zusätzlich durchgeführt. Das ist keine vollständige Barrierefreiheitszertifizierung.

Keine Bewerbungsqualifikation, Versand-/Zahlungstests oder Löschungen durchgeführt. Die dafür bestehenden Betriebsgrenzen bleiben unverändert. Kein Erfolg für ungetestete native Dienste wird aus den Website-Tests abgeleitet.

## Abnahme

Die visuelle Richtung bleibt eine Betreiberentscheidung. Technische Tests ersetzen die Betrachtung nicht. Es gibt keine Behauptung, dass sämtliche Arbeitsabläufe oder jede mögliche Kombination von Endgerät und Browser fehlerfrei sei. Die lokalen Änderungen werden erst nach ausdrücklicher weiterer Live-Freigabe veröffentlicht.
