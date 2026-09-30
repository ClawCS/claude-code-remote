# Verbindliche Leihbestellungen für Trinkgut Jammers

Stand: 30. September 2026. Entwurf zur Prüfung durch den Betreiber, noch keine Freigabe zur Backend-Implementierung oder Veröffentlichung eines verbindlichen Checkouts.

## Ziel und bestätigte Regeln

Besucher wählen Leihartikel und Mengen mit Plus und Minus aus. Der Warenkorb soll Einzelpreise, Positionssummen und eine Gesamtsumme für den gewählten Zeitraum zeigen. Eine verbindliche Bestellung soll anschließend an die Marktemail `jammers-goch@trinkgut.de` übermittelt werden.

Der Betreiber hat die Preisbasis aus der Leihartikelliste vom 01.01.2026 als **je drei Werktage** bestätigt. Er hat außerdem dem empfohlenen Ablauf zugestimmt: Der Kunde gibt ein verbindliches Vertragsangebot ab; ein Mietvertrag entsteht erst durch die ausdrückliche Annahme des Marktes nach Prüfung der tatsächlichen Verfügbarkeit. Eine automatische Eingangsbestätigung ist keine Annahme und keine Reservierungsbestätigung.

Der sichtbare Cocktail-Reiter, die Mengenbedienung und die Kennzeichnung der Preisbasis sind unabhängig davon umgesetzt. Der bestehende unverbindliche Anfrageprozess bleibt nutzbar, bis die Voraussetzungen für verbindliche Bestellungen erfüllt sind.

## Noch zu bestätigende Geschäftsregeln

Diese Angaben dürfen nicht aus der bisherigen, ungenutzten Preisfunktion abgeleitet oder erfunden werden:

- Abrechnung zusätzlicher Werktage: voller Preis je angefangenen Dreierblock oder anteilige Berechnung. Die Rückfrage an den Betreiber ist offen.
- Definition der berechneten Werktage: Einschluss von Samstag, Feiertagen sowie Abhol- und Rückgabetag. Die bisherige Datumsfunktion zählt Montag bis Samstag einschließlich beider Randtage und berücksichtigt keine Feiertage; das ist keine bestätigte Preisregel.
- Steuerstatus der Listenpreise, Zahlungsweise und Zahlungstermin.
- Weitere verbindliche Kosten oder Bedingungen, insbesondere eine etwaige Kaution, Lieferung und Verspätung. Fehlende Angaben bedeuten nicht automatisch kostenlose Leistungen.
- Einzelpreise für Theke, Spültheke, Weinglas klein, Altbierglas, Williglas, Kölschglas, Schnapsglas und Weißbierglas. Diese acht Artikel bleiben ausdrücklich „Preis auf Anfrage“, solange keine eindeutige Zuordnung bestätigt ist.

Eine gemischte Auswahl aus bepreisten und unbepreisten Artikeln darf keinen angeblich vollständigen Gesamtpreis erhalten. Sie bleibt im unverbindlichen Anfrageweg. Der Kunde muss die Auswahl bearbeiten können, um ausschließlich vollständig bepreiste Artikel verbindlich zu bestellen; Artikel werden niemals stillschweigend entfernt.

## Kundenablauf

1. Der Kunde wählt Artikel, Mengen und einen Abhol- und Rückgabezeitraum. Die Oberfläche verhindert negative Mengen und Überschreitungen des physischen Bestands. Die bisherigen Regeln für Garnituren, Einzelbänke und Einzeltische bleiben erhalten.
2. Eine serverseitige Preisprüfung liefert für vollständig bepreiste Artikel die bestätigte Berechnung je Position und die Gesamtsumme. Bei fehlenden Regeln oder Kosten ist nur eine unverbindliche Anfrage möglich.
3. Der Warenkorb zeigt Artikel, Menge, Zeitraum, Preisbasis, Positionssumme und Gesamtpreis. Mengen lassen sich weiter mit Plus und Minus sowie durch Direkteingabe bearbeiten.
4. Im Checkout werden die für Angebot und Rückmeldung erforderlichen Kontaktdaten eingegeben. Die notwendige Datenauswahl und rechtliche Pflichtinformationen werden vor Veröffentlichung abgestimmt. Unnötige persönliche Daten werden nicht erhoben.
5. Unmittelbar vor dem Absenden sieht der Kunde die vollständige Zusammenfassung und kann Fehler korrigieren. Die finale Schaltfläche lautet „Zahlungspflichtig bestellen“. Die ausdrückliche Annahme durch den Markt bleibt Voraussetzung für den Mietvertrag.
6. Nach erfolgreicher dauerhafter Speicherung erhält der Kunde eine Bestellnummer und eine klar als solche bezeichnete Eingangsbestätigung. Die gleiche Bestellung wird an die Marktemail übermittelt.
7. Der Markt prüft Termin, tatsächliche Verfügbarkeit und Bedingungen. Annahme oder Ablehnung erfolgt ausdrücklich und getrennt von der automatischen Eingangsbestätigung.

WhatsApp darf weiterhin für Rückfragen und unverbindliche Anfragen angeboten werden. Ein Klick auf WhatsApp oder das Öffnen eines E-Mail-Entwurfs gilt weder als erfolgreiche Übermittlung noch als verbindliche Bestellung über den neuen Checkout.

## Technischer Entwurf

Der neue Bestellprozess wird als getrenntes Subsystem neben dem bestehenden Anfrageweg gebaut. Er benötigt drei Bausteine:

- Eine zentrale Preisberechnung mit versionierten, bestätigten Geschäftsregeln. Sie arbeitet mit Centbeträgen und einem festgelegten Kalender für Europe/Berlin. Der Server berechnet alle Preise erneut anhand der Artikel-IDs; vom Browser übermittelte Summen werden nicht übernommen.
- Einen Bestellendpunkt mit serverseitiger Prüfung von Artikeln, Mengen, Datumsbereich und Pflichtfeldern. Eine vom Server kontrollierte Wiederholungssperre verhindert, dass Doppelklicks oder Netzwerkwiederholungen mehrere Bestellungen erzeugen. Die unveränderten Bestandsgrenzen werden geprüft; sie ersetzen keine marktweite Live-Verfügbarkeitsprüfung.
- Eine dauerhafte Bestellspeicherung mit separat nachverfolgtem E-Mail-Versand. Fehlgeschlagene E-Mails werden für dieselbe Bestellung erneut versandt, ohne eine zweite Bestellung zu erzeugen. Der konkrete Speicher- und Versanddienst wird erst nach Prüfung des tatsächlichen Hostings und der vorhandenen Zugänge ausgewählt und im Implementierungsplan festgelegt.

Die Zustände „gespeichert“, „Versand ausstehend“, „Versand an den Maildienst übergeben“, „angenommen“ und „abgelehnt“ werden getrennt behandelt. Die Übergabe an einen Maildienst wird nicht als nachgewiesene Zustellung an den Markt dargestellt. Bei einem Speicherfehler zeigt die Oberfläche keine Erfolgsbestätigung. Bei einem Versandproblem darf eine bereits gespeicherte Bestellung nicht verschwinden oder beim Wiederholen dupliziert werden.

E-Mail-Zugangsdaten bleiben ausschließlich in der Serverumgebung. Der Endpunkt benötigt Missbrauchsschutz, begrenzte Eingabegrößen, sichere Textbehandlung für E-Mail-Inhalte und Protokolle ohne unnötige persönliche Daten. Aufbewahrung, Löschung und Zugriffsrechte werden mit dem Betreiber festgelegt. Es wird kein neuer externer Dienst kostenpflichtig eingerichtet, ohne den Betreiber einzubeziehen.

## Rechtliche Prüfung vor Veröffentlichung

Der Entwurf ist keine Rechtsberatung und keine Bestätigung vollständiger Gesetzeskonformität. Vor Veröffentlichung werden Gesamtpreise, Vertragsinformationen, Bestellschaltfläche, Zahlungsbedingungen, Datenschutz sowie Annahme- und Bestätigungstexte fachlich geprüft. Die derzeitigen Anfragehinweise dürfen nicht unverändert als Vertragsbedingungen für den neuen Checkout verwendet werden.

Die Prüfung berücksichtigt insbesondere [§ 312j BGB](https://www.gesetze-im-internet.de/bgb/__312j.html) zur zahlungspflichtigen Bestellsituation, [§ 312i BGB](https://www.gesetze-im-internet.de/bgb/__312i.html) zum elektronischen Geschäftsverkehr und [Artikel 246a § 1 EGBGB](https://www.gesetze-im-internet.de/bgbeg/art_246a__1.html) zu Verbraucherinformationen.

Für ein gegebenenfalls bestehendes Widerrufsrecht werden die erforderliche Belehrung und die elektronische Funktion nach [§ 356a BGB](https://www.gesetze-im-internet.de/bgb/__356a.html) geprüft. Es wird nicht pauschal angenommen, dass die Vermietung von Partyartikeln von einem Widerrufsrecht ausgenommen ist.

## Abnahme und Freigaben

Vor der Umsetzung müssen die Preisregeln vervollständigt und dieser schriftliche Entwurf geprüft werden. Anschließend wird ein gesonderter Implementierungsplan mit dem konkreten Hosting, Speicher, Mailversand und den Vertragsinformationen vorgelegt. Die Freigabe dieses Entwurfs ersetzt nicht die Freigabe des Implementierungsplans.

Vor Aktivierung des verbindlichen Checkouts müssen folgende Prüfungen erfolgreich sein:

- Berechnung für kurze und längere Zeiträume, Samstag, Sonntag, Feiertag, Jahreswechsel und Zeitumstellung gemäß bestätigter Regel; Mengen- und Cent-Rundung ohne Abweichungen zwischen Anzeige und Server.
- Fehlende Preise, manipulierte Browserdaten, ungültige oder vergangene Datumsbereiche und Mengen außerhalb des Bestands führen nicht zu einer verbindlichen Bestellung.
- Warenkorb und Checkout zeigen identische Positions- und Gesamtsummen. Der Kunde kann Angaben vor dem Absenden korrigieren.
- Doppelklick, Zeitüberschreitung und Wiederholung erzeugen höchstens eine Bestellung. Speicher- und Versandfehler werden eindeutig angezeigt und überprüfbar behandelt.
- Ein ausdrücklich freigegebener Testversand erreicht das Marktpostfach und die Testadresse des Kunden. Ein geöffnetes `mailto:`-Fenster zählt nicht als Versandprüfung.
- Mobile Bedienung, Tastaturbedienung, verständliche Fehlermeldungen sowie Trennung von Eingangsbestätigung und Vertragsannahme sind geprüft.
- Die notwendigen Vertrags-, Datenschutz- und Widerrufsinformationen sind vor Veröffentlichung fachlich freigegeben.

Ohne diese Voraussetzungen bleibt der verbindliche Bestellabschluss deaktiviert. Der vorhandene Anfrageweg wird nicht als bereits fertiges Bestellsystem umbeschriftet.
