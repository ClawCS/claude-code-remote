# Verbindliche Leihbestellungen für Trinkgut Jammers

Stand: 1. Oktober 2026. Entwurf zur Prüfung durch den Betreiber, noch keine Freigabe zur Backend-Implementierung oder Veröffentlichung eines verbindlichen Checkouts.

## Ziel und bestätigte Regeln

Besucher wählen Leihartikel und Mengen mit Plus und Minus aus. Der Warenkorb soll Einzelpreise, Positionssummen und eine Gesamtsumme für den gewählten Zeitraum zeigen. Bestellungen und zugehörige Belege sollen an den Kunden und an ein neues Sammelpostfach des Marktes übermittelt werden. Der Betreiber wird dieses Postfach erstellen; seine Adresse ist noch nicht benannt. Die bisherige Marktemail `jammers-goch@trinkgut.de` ist damit nicht automatisch als endgültiges Empfängerpostfach des neuen Systems bestätigt.

Am 1. Oktober 2026 hat der Betreiber den gewünschten Umfang um Apple Pay, Kreditkartenzahlung, eine einfache Online-Bankzahlung und Barzahlung vor Ort erweitert. Mit „Sofortüberweisung“ ist zunächst der gewünschte Bankzahlungsweg beschrieben; der konkrete heute verfügbare Zahlungsdienst und dessen Bestätigungsdauer müssen geprüft und ausgewählt werden. Rechnung und Lieferschein sollen auch bei Barzahlung elektronisch an Kunde und Markt gehen. Diese Anforderungen sind noch keine Freigabe eines Zahlungsanbieters, einer Rechnungssoftware oder kostenpflichtiger Dienste.

Der Betreiber hat die Preisbasis aus der Leihartikelliste vom 01.01.2026 als **je drei Werktage** bestätigt. Er hat außerdem dem empfohlenen Ablauf zugestimmt: Der Kunde gibt ein verbindliches Vertragsangebot ab; ein Mietvertrag entsteht erst durch die ausdrückliche Annahme des Marktes nach Prüfung der tatsächlichen Verfügbarkeit. Eine automatische Eingangsbestätigung ist keine Annahme und keine Reservierungsbestätigung.

Am 1. Oktober 2026 hat der Betreiber die Abrechnung zusätzlicher Werktage bestätigt: **Jeder angefangene Dreierblock wird vollständig berechnet.** Ab dem vierten berechneten Werktag fällt erneut der volle Mietpreis für einen Dreierblock an; eine anteilige Tagesberechnung findet nicht statt. Bei einer positiven berechneten Mietdauer ergibt sich die Zahl der Blöcke durch Aufrunden von `Werktage / 3`. Die Positionssumme beträgt `Menge × Preis je Dreierblock × Anzahl der Blöcke`.

Für einen Kühlanhänger mit einem Listenpreis von 150 € je Dreierblock bedeutet dies: 1–3 berechnete Werktage kosten 150 €, 4–6 Werktage 300 € und 7–9 Werktage 450 €.

Der Betreiber hat am 1. Oktober 2026 bestätigt, dass die Listenpreise Endpreise inklusive Mehrwertsteuer sind. Auf diese Mietpreise wird kein zusätzlicher Mehrwertsteuerbetrag aufgeschlagen; entsprechend sind die genannten 150 €, 300 € und 450 € bereits inklusive Mehrwertsteuer. Ein konkreter Steuersatz wurde damit nicht festgelegt. Etwaige weitere Kosten oder eine Kaution sind weiterhin gesondert zu klären.

Der Betreiber hat am selben Tag auch die Kalenderregel bestätigt: Montag bis Samstag zählen, Sonntage und gesetzliche NRW-Feiertage zählen nicht. Abhol- und Rückgabetag werden jeweils vollständig mitgezählt, sofern sie nach dieser Regel Werktage sind. Ein identischer Abhol- und Rückgabetag zählt nur einmal. Maßgeblich ist das lokale Kalenderdatum in Europe/Berlin; die Zählung darf weder von der Serverzeitzone noch von einer Zeitumstellung abhängen. Die bestätigten Regeln sind im Konzept festgehalten, aber noch nicht im öffentlichen Warenkorb aktiviert.

Der sichtbare Cocktail-Reiter, die Mengenbedienung und die Kennzeichnung der Preisbasis sind unabhängig davon umgesetzt. Der bestehende unverbindliche Anfrageprozess bleibt nutzbar, bis die Voraussetzungen für verbindliche Bestellungen erfüllt sind.

## Noch zu bestätigende Geschäftsregeln

Diese Angaben dürfen nicht aus der bisherigen, ungenutzten Preisfunktion abgeleitet oder erfunden werden:

- Zahlungszeitpunkt für Online-Zahlungen, Frist für die Zahlung nach Marktbestätigung und Behandlung nicht bezahlter Bestellungen. Die gewünschten Zahlungsarten sind oben festgehalten; die konkrete Anbieterwahl bleibt offen.
- Weitere verbindliche Kosten oder Bedingungen, insbesondere eine etwaige Kaution, Lieferung und Verspätung. Fehlende Angaben bedeuten nicht automatisch kostenlose Leistungen.
- Einzelpreise für Theke, Spültheke, Weinglas klein, Altbierglas, Williglas, Kölschglas, Schnapsglas und Weißbierglas. Diese acht Artikel bleiben ausdrücklich „Preis auf Anfrage“, solange keine eindeutige Zuordnung bestätigt ist.
- Rechnungsführendes System des Marktes, Rechnungsnummernkreis, anzuwendende Steuersätze sowie Zeitpunkt und Format der Rechnungserstellung. Das neue Sammelpostfach und ein sicher eingerichteter Versandzugang sind ebenfalls noch festzulegen.

Eine gemischte Auswahl aus bepreisten und unbepreisten Artikeln darf keinen angeblich vollständigen Gesamtpreis erhalten. Sie bleibt im unverbindlichen Anfrageweg. Der Kunde muss die Auswahl bearbeiten können, um ausschließlich vollständig bepreiste Artikel verbindlich zu bestellen; Artikel werden niemals stillschweigend entfernt.

## Befund zur bestehenden Datumsfunktion

Die bestehende Funktion `calculateWorkdays` in `lib/utils.ts` berücksichtigt keine Feiertage. Außerdem vermischt sie das Einlesen eines ISO-Datums als UTC-Zeitpunkt mit lokalen Tagesschritten. Der Bereich 23.10.2026–26.10.2026 liefert dadurch mit `TZ=Europe/Berlin` zwei Tage, mit `TZ=UTC` dagegen drei. Nach der bestätigten Regel müssen Freitag, Samstag und Montag unabhängig von der Laufzeitzeitzone zusammen drei Werktage ergeben. Dieser Befund wurde am 1. Oktober 2026 reproduziert; er ist noch nicht behoben. Vor Aktivierung der Preisberechnung sind eine zeitzonenunabhängige Kalenderzählung und der NRW-Feiertagskalender einschließlich Regressionstests erforderlich.

## Kundenablauf

1. Der Kunde wählt Artikel, Mengen und einen Abhol- und Rückgabezeitraum. Die Oberfläche verhindert negative Mengen und Überschreitungen des physischen Bestands. Die bisherigen Regeln für Garnituren, Einzelbänke und Einzeltische bleiben erhalten.
2. Eine serverseitige Preisprüfung liefert für vollständig bepreiste Artikel die bestätigte Berechnung je Position und die Gesamtsumme. Bei fehlenden Regeln oder Kosten ist nur eine unverbindliche Anfrage möglich.
3. Der Warenkorb zeigt Artikel, Menge, Zeitraum, Preisbasis, Positionssumme und Gesamtpreis. Mengen lassen sich weiter mit Plus und Minus sowie durch Direkteingabe bearbeiten.
4. Im Checkout werden die für Angebot und Rückmeldung erforderlichen Kontaktdaten eingegeben. Die notwendige Datenauswahl und rechtliche Pflichtinformationen werden vor Veröffentlichung abgestimmt. Unnötige persönliche Daten werden nicht erhoben.
5. Unmittelbar vor dem Absenden sieht der Kunde die vollständige Zusammenfassung und kann Fehler korrigieren. Die finale Schaltfläche lautet „Zahlungspflichtig bestellen“. Die ausdrückliche Annahme durch den Markt bleibt Voraussetzung für den Mietvertrag.
6. Nach erfolgreicher dauerhafter Speicherung erhält der Kunde eine Bestellnummer und eine klar als solche bezeichnete Eingangsbestätigung. Die gleiche Bestellung wird an das bestätigte Sammelpostfach des Marktes übermittelt.
7. Der Markt prüft Termin, tatsächliche Verfügbarkeit und Bedingungen. Annahme oder Ablehnung erfolgt ausdrücklich und getrennt von der automatischen Eingangsbestätigung.

WhatsApp darf weiterhin für Rückfragen und unverbindliche Anfragen angeboten werden. Ein Klick auf WhatsApp oder das Öffnen eines E-Mail-Entwurfs gilt weder als erfolgreiche Übermittlung noch als verbindliche Bestellung über den neuen Checkout.

## Zahlung und Belege

Die Dokumentationsprüfung vom 1. Oktober 2026 ergibt zwei mögliche Anbieter: Mollie unterstützt [Apple Pay mit aktivierter Kartenzahlung](https://docs.mollie.com/gu/docs/apple-pay) und [Pay by Bank für deutsche Kunden](https://docs.mollie.com/docs/pay-by-bank). Pay by Bank bleibt bis zum Geldeingang ausstehend; eine sofortige Bestätigung ist nicht für jede Bank garantiert. [Eigenständiges SOFORT wurde bei Mollie eingestellt](https://help.mollie.com/hc/de/articles/20904206772626-SOFORT-wird-eingestellt-30-September-2024). Stripe ist eine Alternative für Karten und Apple Pay, führt [Pay by Bank für deutsche Kunden aktuell aber als Private Preview](https://docs.stripe.com/payments/pay-by-bank). Mollie ist deshalb ein vorläufig bevorzugter Kandidat für den gewünschten Bankzahlungsweg, keine bereits freigegebene oder eingerichtete Integration. Ein vorhandenes Händlerkonto und die Zulässigkeit der Vermietung sowie die konkrete Methodenfreischaltung sind vor Auswahl zu prüfen.

Als noch nicht freigegebener Ablauf wird empfohlen, die Online-Zahlung erst nach ausdrücklicher Marktannahme und Prüfung des Termins anzufordern. Ein bestellbezogener, sicherer Zahlungslink führt zu einem gehosteten Checkout des ausgewählten Zahlungsdienstes. Dort stehen die tatsächlich im Händlerkonto freigeschalteten und für den Kunden verfügbaren Verfahren bereit. Die Website speichert keine Kreditkartendaten. Barzahlung vor Ort bleibt ein getrennt nachverfolgter Zahlungsweg.

Alternativ wäre eine sofortige Online-Zahlung vor Verfügbarkeitsprüfung möglich. Dafür müssten Rückerstattungen bei Ablehnung sowie die unterschiedlichen Möglichkeiten zur Autorisierung und Abbuchung je Zahlungsart ausdrücklich gestaltet und freigegeben werden. Dieser Ablauf wird nicht stillschweigend gewählt.

Eine Weiterleitung auf die Erfolgsseite ist kein Zahlungsnachweis. Die Zahlung wird serverseitig anhand verifizierter Anbieterereignisse und des beim Anbieter abgefragten Bestellbezugs, Betrags, Währungs- und Zahlungsstatus abgeglichen. Doppelte und verspätete Meldungen dürfen weder zweite Bestellungen noch zweite Rechnungen erzeugen. Eine noch ausstehende Bankzahlung wird nicht als bezahlt ausgegeben. Barzahlung gilt erst nach einer dazu berechtigten Marktbestätigung als eingegangen.

Rechnung und Lieferschein erhalten denselben nachvollziehbaren Bestellbezug, bleiben aber unterschiedliche Dokumente. Eine Rechnung wird ausschließlich über den abgestimmten Rechnungsprozess mit eindeutiger Nummer und vollständigen Angaben erstellt. Falls bereits eine Kassen- oder Buchhaltungssoftware Rechnungen erzeugt, wird deren Integration geprüft; die Website legt nicht ohne Abstimmung eine konkurrierende zweite Rechnung an. Zahlungsbelege des Zahlungsdienstes werden nicht automatisch als vollständige Mietrechnung ausgegeben.

Die Belegerstellung und der Versandzeitpunkt sind vor Umsetzung festzulegen. Vor tatsächlicher Ausgabe darf ein Lieferschein die Übergabe nicht als bereits erfolgt bestätigen; eine vorbereitete Ausgabe wird entsprechend als Abhol- oder Übergabedokument gekennzeichnet. Bei Barzahlung kann die Rechnung vor Zahlung als offen erscheinen. Nach Zahlung wird der Bezahlstatus für dieselbe Rechnung dokumentiert, nicht ohne Grund eine weitere Rechnung erzeugt. Rechnung und das zum jeweiligen Prozessstand passende Übergabedokument werden in getrennten Nachrichten an Kunde und Markt versandt. Fehler und Wiederholungen werden je Empfänger nachverfolgt; eine fehlgeschlagene E-Mail darf keine neue Bestellung oder Belegnummer erzeugen.

## Technischer Entwurf

Der aktuelle Checkout in `app/checkout/page.tsx` öffnet ausschließlich einen E-Mail- oder WhatsApp-Entwurf. Im geprüften Projekt sind noch keine Zahlungsanbindung, dauerhafte Mietbestellspeicherung, automatischer Belegversand oder Schnittstelle zur Rechnungssoftware umgesetzt. Die Prüfung belegt nicht, ob außerhalb des Projekts schon passende Anbieter- oder Buchhaltungskonten existieren. Die öffentliche Produktionsadresse ist ebenfalls noch nicht konfiguriert; `data/editorial/source-config.json` enthält `publicUrl: null`. Ein öffentlich erreichbarer HTTPS-Server mit geeigneter Speicherung und Zahlungsbenachrichtigungen bleibt vor Live-Betrieb zu bestätigen.

Der neue Bestellprozess wird als getrenntes Subsystem neben dem bestehenden Anfrageweg entworfen. Der erweiterte Zielumfang benötigt fünf Bausteine; ihre konkrete Umsetzung ist noch nicht freigegeben:

- Eine zentrale Preisberechnung mit versionierten, bestätigten Geschäftsregeln. Sie arbeitet mit Centbeträgen und einem festgelegten Kalender für Europe/Berlin. Der Server berechnet alle Preise erneut anhand der Artikel-IDs; vom Browser übermittelte Summen werden nicht übernommen.
- Einen Bestellendpunkt mit serverseitiger Prüfung von Artikeln, Mengen, Datumsbereich und Pflichtfeldern. Eine vom Server kontrollierte Wiederholungssperre verhindert, dass Doppelklicks oder Netzwerkwiederholungen mehrere Bestellungen erzeugen. Die unveränderten Bestandsgrenzen werden geprüft; sie ersetzen keine marktweite Live-Verfügbarkeitsprüfung.
- Eine dauerhafte Bestellspeicherung mit separat nachverfolgtem E-Mail-Versand. Fehlgeschlagene E-Mails werden für dieselbe Bestellung erneut versandt, ohne eine zweite Bestellung zu erzeugen. Der konkrete Speicher- und Versanddienst wird erst nach Prüfung des tatsächlichen Hostings und der vorhandenen Zugänge ausgewählt und im Implementierungsplan festgelegt.
- Eine getrennte Zahlungsanbindung für den gehosteten Online-Checkout, Statusabgleich, Wiederholungsverarbeitung und erforderliche Rückerstattungen. Barzahlungen werden ausdrücklich als vor Ort zu bestätigende Zahlungen geführt.
- Einen mit dem Markt abgestimmten Rechnungs- und Lieferscheinprozess einschließlich Belegnummern, Dateispeicherung und Versand an beide Empfänger. Rechnungs- und Zahlungserstellung dürfen bei Wiederholungen nicht dupliziert werden.

Die Zustände „gespeichert“, „Versand ausstehend“, „Versand an den Maildienst übergeben“, „angenommen“ und „abgelehnt“ werden getrennt behandelt. Die Übergabe an einen Maildienst wird nicht als nachgewiesene Zustellung an den Markt dargestellt. Bei einem Speicherfehler zeigt die Oberfläche keine Erfolgsbestätigung. Bei einem Versandproblem darf eine bereits gespeicherte Bestellung nicht verschwinden oder beim Wiederholen dupliziert werden.

E-Mail- und Zahlungszugangsdaten bleiben ausschließlich in der Serverumgebung und werden nicht im Chat angefordert oder im Repository gespeichert. Der Endpunkt benötigt Missbrauchsschutz, begrenzte Eingabegrößen, sichere Textbehandlung für E-Mail-Inhalte und Protokolle ohne unnötige persönliche Daten. Aufbewahrung, Löschung und Zugriffsrechte werden mit dem Betreiber festgelegt. Es wird kein neuer externer Dienst kostenpflichtig eingerichtet, ohne den Betreiber einzubeziehen.

## Rechtliche Prüfung vor Veröffentlichung

Der Entwurf ist keine Rechtsberatung und keine Bestätigung vollständiger Gesetzeskonformität. Vor Veröffentlichung werden Gesamtpreise, Vertragsinformationen, Bestellschaltfläche, Zahlungsbedingungen, Datenschutz sowie Annahme- und Bestätigungstexte fachlich geprüft. Die derzeitigen Anfragehinweise dürfen nicht unverändert als Vertragsbedingungen für den neuen Checkout verwendet werden.

Die Prüfung berücksichtigt insbesondere [§ 312j BGB](https://www.gesetze-im-internet.de/bgb/__312j.html) zur zahlungspflichtigen Bestellsituation, [§ 312i BGB](https://www.gesetze-im-internet.de/bgb/__312i.html) zum elektronischen Geschäftsverkehr und [Artikel 246a § 1 EGBGB](https://www.gesetze-im-internet.de/bgbeg/art_246a__1.html) zu Verbraucherinformationen.

Für ein gegebenenfalls bestehendes Widerrufsrecht werden die erforderliche Belehrung und die elektronische Funktion nach [§ 356a BGB](https://www.gesetze-im-internet.de/bgb/__356a.html) geprüft. Es wird nicht pauschal angenommen, dass die Vermietung von Partyartikeln von einem Widerrufsrecht ausgenommen ist.

Die Rechnungsprüfung umfasst insbesondere die Pflichtangaben nach [§ 14 UStG](https://www.gesetze-im-internet.de/ustg_1980/__14.html), die Unterscheidung zwischen Privat- und Firmenkunden sowie das erforderliche Rechnungsformat. Nach den [BMF-FAQ zur E-Rechnung, Stand März 2026](https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html) ist ein einfaches PDF keine strukturierte E-Rechnung; für inländische Firmenkunden sind Anwendungsbereich, Ausnahmen und Übergangsfristen gesondert zu prüfen. Der Wunsch nach E-Mail-Versand allein legt das zulässige Rechnungsformat nicht fest. Die konkrete steuerliche Ausgestaltung wird mit dem Markt beziehungsweise seiner Buchhaltung abgestimmt, nicht als bereits rechtskonform behauptet.

## Abnahme und Freigaben

Vor der Umsetzung müssen die Preisregeln vervollständigt und dieser schriftliche Entwurf geprüft werden. Anschließend wird ein gesonderter Implementierungsplan mit dem konkreten Hosting, Speicher, Mailversand und den Vertragsinformationen vorgelegt. Die Freigabe dieses Entwurfs ersetzt nicht die Freigabe des Implementierungsplans.

Vor Aktivierung des verbindlichen Checkouts müssen folgende Prüfungen erfolgreich sein:

- Berechnung für kurze und längere Zeiträume, Samstag, Sonntag, Feiertag, Jahreswechsel und Zeitumstellung gemäß bestätigter Regel; Mengen- und Cent-Rundung ohne Abweichungen zwischen Anzeige und Server.
- Fehlende Preise, manipulierte Browserdaten, ungültige oder vergangene Datumsbereiche und Mengen außerhalb des Bestands führen nicht zu einer verbindlichen Bestellung.
- Warenkorb und Checkout zeigen identische Positions- und Gesamtsummen. Der Kunde kann Angaben vor dem Absenden korrigieren.
- Doppelklick, Zeitüberschreitung und Wiederholung erzeugen höchstens eine Bestellung. Speicher- und Versandfehler werden eindeutig angezeigt und überprüfbar behandelt.
- Ein ausdrücklich freigegebener Testversand von Bestellnachricht, Rechnung und passendem Übergabedokument erreicht das bestätigte Sammelpostfach und die Testadresse des Kunden. Ein geöffnetes `mailto:`-Fenster zählt nicht als Versandprüfung.
- Die gewählten Online-Zahlungsarten sind zunächst in der Testumgebung geprüft. Erfolgreiche, ausstehende, abgebrochene und fehlgeschlagene Zahlungen sowie wiederholte Anbieterereignisse werden korrekt unterschieden. Eine Erfolgsweiterleitung allein setzt keinen Bezahlstatus. Live-Aktivierung und gegebenenfalls finanzielle Testtransaktionen benötigen eine gesonderte Freigabe.
- Barzahlung, Rechnungsnummern, Stornierung, Belegwiederholung und die Anbindung an das bestätigte Rechnungswesen erzeugen keine doppelten Forderungen oder Buchungen.
- Mobile Bedienung, Tastaturbedienung, verständliche Fehlermeldungen sowie Trennung von Eingangsbestätigung und Vertragsannahme sind geprüft.
- Die notwendigen Vertrags-, Datenschutz- und Widerrufsinformationen sind vor Veröffentlichung fachlich freigegeben.

Ohne diese Voraussetzungen bleibt der verbindliche Bestellabschluss deaktiviert. Der vorhandene Anfrageweg wird nicht als bereits fertiges Bestellsystem umbeschriftet.
