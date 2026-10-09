# Trinkgut Jammers: bereinigte Betreiberentscheidungen

Grundstand: 8. Oktober 2026; Bewerbungszugriff und Löschvorgabe am 9. Oktober ergänzt. Abgleich aus ausdrücklichen Betreiberantworten, AGENTS.md, aktuellem Code und Einzelberichten. Diese Liste ersetzt die überholte 30-Fragen-Fassung vom 1. Oktober; diese bleibt als Historie erhalten. Nicht beantwortete Wünsche/Empfehlungen sind keine Zustimmung zu Verträgen, Preisen, Löschungen oder kostenpflichtigen Diensten.

## Bereits entschieden – nicht erneut abfragen

- Domain `trinkgut-jammers.de`, eigener bestätigter Hetzner-Host, HTTPS, Impressumsdaten und Hosting-AV-Vertrag sind freigegeben; Informationsseite ist live. Das ist keine unabhängige juristische Gesamtprüfung.
- Aktueller Mietbetrieb: ausschließlich unverbindliche Anfrage an `jammers-goch@trinkgut.de` oder WhatsApp, vom Kunden selbst abgesendet. `RENTAL_MODE=disabled`; kein automatischer Mailversand und keine echten Onlinezahlungen.
- Mietpreisberechnung: Bruttolistenpreise je angefangene drei Werktage; Mo–Sa ohne Sonn-/NRW-Feiertage; Abhol-/Rückgabetag zählen vollständig. Glas-/Thekenpreise vom 8. Oktober sind bestätigt, „Weinglas klein“ entfernt. Konkreter Steuersatz für Rechnungen ist davon nicht umfasst.
- Aktuell bestätigte Abwicklung: Anfrage → persönliche Termin-/Verfügbarkeitsbestätigung durch den Markt → Zahlung unmittelbar bei tatsächlicher Abholung. Onlinezahlungen, automatische Rechnungen/Lieferscheine und verbindlicher Web-Bestellbetrieb sind bis zur späteren eigenen WWS-API-Anbindung zurückgestellt. Der frühere Zahlungslink-Entwurf bleibt Historie, keine aktuelle Aktivierungsfreigabe.
- Wochenwerbung: Sonntag 17:00 Vorbereitung, täglich 06:15 Kontrolle, Europe/Berlin. Der am 8. Oktober freigegebene Wochenpaket-Entwurf erhält die Mac-/App-Abhängigkeit. Ein unabhängiger Server-Canva-Import ist kein noch offener Blocker dieses Auftrags, sondern ein gesonderter Ausbau.
- Gewinnspielkontrolle monatlich; vollständige unbeschnittene Cover und eigene Instagram-Originale ausdrücklich freigegeben. Quellenregeln für reale lizenzierte Cocktailfotos, Google-Inhaberfotos sowie deklarierte KI-Akademie-/Leihartikelmotive stehen in AGENTS.md und sind entschieden.
- Team-/Fotoausschlüsse und das Behalten des Gruppenfotos sind entschieden; das ausdrücklich ausgeschlossene Staplerfoto bleibt ausgeschlossen. Die letzte Einzelprofilentfernung ist bereits live, kein erneuter Personalabgleich erforderlich.
- NL-Landingpage mit Oranje-Akzenten ist umgesetzt. Auch die warme orange gemeinsame NL-Hinweisleiste ist nun ausdrücklich freigegeben; Logo und Hauptnavigation bleiben unverändert.
- Newsletter ist beauftragt: Anmeldung per E-Mail mit Bestätigung, Sonntag 19:00 Europe/Berlin, digitale Downloadlinks zu beiden Handzetteln der Folgewoche. Absender `info@trinkgut-jammers.de`; Postfach existiert laut Betreiber. Öffentlicher MX-Abgleich am 8. Oktober zeigt `mx00.ionos.de`/`mx01.ionos.de`; das belegt den Empfangsweg, nicht SMTP-Zugriff oder erlaubten Massenversand. Kein vorhandener Newsletter-Dienst. Kein zusätzliches Kundenkonto erforderlich.
- Bewerbungsportal mit Anschreiben/Bewerbung, Lebenslauf, Portrait und Zeugnissen ist beauftragt; Zieladresse für Bewerbung und Unterlagen ist nach der jüngsten Korrektur `info@trinkgut-jammers.de`. Das ersetzt die frühere Marktadresse ausdrücklich nur für Bewerbungen. Portrait im Entwurf freiwillig. Am 9. Oktober ausdrücklich bestätigt: Sämtliche bereits für das Info-Postfach zugangsberechtigten Personen dürfen Bewerbungsunterlagen lesen. Bestehende Postfachberechtigungen werden nicht verändert; die sichere technische Einrichtung bleibt vor Uploadbetrieb zu prüfen. Zwei aktuelle Anzeigen liegen vor: Verkauf (m/w/d) Vollzeit und Teilzeit bis 150 Stunden/Monat, jeweils sofortiger Einstieg möglich.
- Am 9. Oktober bestätigte Löschvorgabe für abgelehnte Bewerbungen: sechs Monate nach dokumentiertem Abschluss des Bewerbungsverfahrens, einschließlich Postfachkopien, sofern kein begründeter Ausnahmefall besteht. Bestätigte Betreiberregel für die Umsetzung, keine pauschale gesetzliche Pflichtfrist und noch keine implementierte Löschautomatik.

## A. Antworten vom 8. Oktober und verbleibender Bedarf

### A1 – Wochenpaket: Implementierungsplan und Ausführung

Der [technische Entwurf](superpowers/specs/2026-10-08-weekly-publication-packages-design.md) ist bereits freigegeben. Der Betreiber fragt nun nach einer verständlichen Erklärung; das ist keine neue Ablehnung und keine Bestätigung einer bereits erfolgten Umsetzung. Der [Implementierungsplan](superpowers/plans/2026-10-08-weekly-publication-packages.md) ist noch nicht ausgeführt.

Erklärung im Chat: Originalhandzettel DE/NL, Vorschaubilder und die zugehörigen Angebotskacheln werden geprüft als zusammengehöriges Wochenpaket auf dem eigenen Hetzner-Server bereitgestellt. So sind Downloads nicht von später ausfallenden Anbieterlinks abhängig. Die Datumssteuerung zeigt die richtige Woche und entfernt abgelaufene Preise. Kein grundlegender Designumbau, keine Ersatzwoche und keine Korrektur von Originalpreisen. Native/Subagent-Ausführung ist eine interne Arbeitsentscheidung, keine erneute Betreiberfrage.

Die A2-Umsetzung unten behebt den bekannten externen DE-Handzettel-404 nicht. Bis zum gesonderten geprüften Wochenpaket-Release bleibt dieser Fehler ausdrücklich offen.

### A2 – Kleine UI-Änderungen

Alle drei Kurzdesigns sind ausdrücklich freigegeben und seit 16:39 UTC / 18:39 Europe/Berlin im App-Release `d93f932` öffentlich geprüft. [Releasebericht](audits/2026-10-08-approved-ui-and-decisions.md):

1. WhatsApp-/Instagram-Weiterleitungen als erkennbare Icons mit ausreichend großer Klickfläche, verständlicher zugänglicher Beschriftung und unverändertem Ziel. Erklärende Texte müssen nicht sämtliche Dienstnamen verlieren.
2. Sichtbare Hinweise „Bestand nach Liste“, Bestandsdatum und interne Bestandszahlen entfernen; Mengengrenzen intern erhalten. Bei Überschreitung unmittelbar „Diese Menge ist nicht verfügbar. Bitte reduziere die Menge.“ anzeigen. Ohne zentrales Reservierungsregister ist das kein Nachweis marktweiter Terminverfügbarkeit.
3. Nur die NL-Hinweisleiste im gemeinsamen Kopf warm orange mit dunkler lesbarer Schrift gestalten; Logo, Hauptnavigation und übriger deutscher Auftritt unverändert.

Keine weitere Grundsatzfreigabe erforderlich. Mengenfehler dürfen keine internen Bestandszahlen ausgeben; die Website kennt ohne Anbindung der Mietdatei keine marktweite Terminverfügbarkeit.

### A3 – Newsletter-Ablauf und notwendige Versandtechnik

Antwort: kein bestehender Newsletter-Anbieter. Gewünscht ist ausschließlich die einfache Kundenfunktion E-Mail anmelden → bestätigen → sonntags um 19:00 digitale Downloadlinks für die Folgewoche. Ein technischer Versanddienst ist eine mögliche interne Umsetzung, kein vom Kunden benötigtes Konto. Nicht erneut nach einem vorhandenen Newsletter-Konto fragen.

Das Info-Postfach existiert; DNS zeigt IONOS als Empfangsanbieter. Die Versandfähigkeit und konkrete Kontokonfiguration sind noch zu prüfen. Erst danach eine konkrete sichere Versandlösung mit gegebenenfalls anfallenden Kosten und Verträgen benennen; keine pauschale Dienstebuchung, Kontoerstellung oder echte Sendung ableiten. Anmeldung mit Bestätigung, einfache Abmeldung, nachweisbarer Versand und Datenschutz gehören zur Vorbereitung. Die Sonntagszeit ist bereits entschieden.

### A4 – Bewerbungszugriff und ausgeschriebene Stellen

Aktuelle Antwort: Bewerbung und Unterlagen an **`info@trinkgut-jammers.de`**. Die frühere Antwort nannte `jammers-goch@trinkgut.de` und bestätigte dessen Postfachberechtigte; sie ist hinsichtlich des Empfängers durch die neue Anweisung ersetzt. Am 9. Oktober bestätigt der Betreiber nun ausdrücklich auch für das Info-Postfach: **Alle dort bereits Zugangsberechtigten dürfen Bewerbungsunterlagen lesen.** Damit ist diese Empfängerfreigabe geklärt; keine Postfachberechtigungen verändern oder eine identische Besetzung beider Postfächer behaupten. Der Betreiber überlässt die professionelle Darstellung Codex. Die zwei aktuell aushängenden Anzeigen wurden auf seine Erlaubnis direkt auf dem Desktop gefunden und visuell gelesen: Verkäuferin/Verkäufer (m/w/d) Vollzeit sowie Teilzeit bis zu 150 Stunden/Monat, beide mit möglichem sofortigem Einstieg und freundlichem Team. [Originalbelege und Inhaltsvorbereitung](privacy/2026-10-08-jobs-inhaltsvorbereitung.md). Keine weitere Stellenabfrage nötig; Gehalt und nicht belegte Anforderungen/Benefits nicht erfinden. Upload- und Versandtechnik bleibt gesondert einzurichten.

Entwurf: „Team & Jobs“ als gebündelter Einstieg; Bewerbung ohne Kundenkonto, sichere nicht öffentliche Verarbeitung, optionales Portrait. Der ausdrücklich gewünschte Versand der Unterlagen an das Info-Postfach wird nicht stillschweigend durch eine reine Benachrichtigung ersetzt. Anhänge benötigen eine geprüfte sichere Übermittlung; ein geschützter Downloadlink bleibt gegebenenfalls eine begründet vorzuschlagende Alternative. Keine erfundenen Stellen, Gehälter oder Benefits; noch kein Uploadbetrieb.

### A5 – Postfächer und Absender

Bestätigt und zuletzt korrigiert: Bewerbungen und Unterlagen an `info@trinkgut-jammers.de`; Newsletter ebenfalls von `info@trinkgut-jammers.de`; Info-Postfach vorhanden. Empfangs-MX zeigt IONOS. Technische Absenderprüfung, sichere Konfiguration und Versandgrenzen folgen; Zugangsdaten nicht im Chat oder öffentlichen Repository abfragen. Keine neue Adresse erfinden. Die gesonderte Newsletter-Antwortadresse ist noch nicht technisch festgelegt.

Der aktuelle Miet-Anfrageempfänger `jammers-goch@trinkgut.de` ist bereits entschieden und wird dadurch nicht ungefragt geändert. Zugangsdaten ausschließlich später im geeigneten sicheren Verfahren, nie hier oder im öffentlichen Repository.

### A6 – Aufbewahrung und fachliche Abnahme

Antwort: Keine vorhandenen Texte/Vorgaben; eigenständige Vorbereitung ist ausdrücklich beauftragt. Siehe [Datenschutz- und Löschkonzept, Entwurf](privacy/2026-10-08-datenschutz-loeschkonzept-entwurf.md). Ergänzung vom 9. Oktober: Der Betreiber bestätigt die vorgeschlagene Regel für **abgelehnte Bewerbungen: sechs Monate nach dokumentiertem Verfahrensabschluss löschen, einschließlich Postfachkopien, sofern kein begründeter Ausnahmefall besteht**. Diese konkrete Frist ist damit als Umsetzungsvorgabe entschieden. Weitere Fristen des Konzepts bleiben Vorschläge. Keine tatsächlichen Löschungen oder Veröffentlichung von Angaben zu noch nicht aktiven Diensten aus diesem Dokument ableiten; der technische und organisatorische Löschprozess ist noch einzurichten.

Die Betreiberbestätigung des Impressums bleibt gültig. Neue Datenerhebung oder verbindliche Mietverträge sind davon nicht pauschal abgedeckt. Die nun bestätigte Bewerbungsfrist ist keine pauschale gesetzliche Pflichtfrist oder unabhängige rechtliche Abnahme; für andere Daten keine bereits bestätigte Aufbewahrungsfrist behaupten.

### A7 – Niederländische Endredaktion

Antwort: keine externe niederländische Sprachprüfung vorhanden; Codex soll die redaktionelle Betreuung weiterführen. Kein erneuter externer Freigabe-Blocker. Eine unabhängige muttersprachliche Abnahme wird nicht behauptet. Freigegebene Originalhandzettel bleiben unverändert.

## B. Nur für einen späteren verbindlichen Mietbetrieb

Die folgenden Betriebsangaben wurden beantwortet. Sie werden dokumentiert, aktivieren aber weder verbindliche Onlinebestellungen noch automatischen Zahlungs-/Belegversand. Der gegenwärtige Anfrageweg bleibt erhalten.

### B1 – Mietbedingungen

- Zahlung unmittelbar bei tatsächlicher Abholung; keine Vorauszahlung.
- Keine Kaution, ausschließlich Selbstabholung.
- Abholung am vereinbarten Tag zwischen 09:00 und 19:00 Uhr. Rückgabe-Uhrzeiten sind dadurch noch nicht ausdrücklich festgelegt.
- Stornierung telefonisch. Da erst bei tatsächlicher Abholung bezahlt wird, ist kein Rückzahlungsprozess für vorausbezahlte Stornierungen vorgesehen. Daraus keinen pauschalen Ausschluss gesetzlicher Rechte ableiten.
- Verspätete Rückgabe: ausdrücklich bestätigtes Kühlanhänger-Beispiel 150 € bis Tag 3, 200 € an Tag 4, 250 € an Tag 5, 300 € an Tag 6. Auf Rückfrage bestätigt: **nur bei verspäteter Rückgabe**, nicht bei regulär so gebuchten Mietzeiten. Reguläre Vier-Tage-Buchungen bleiben daher 300 € (zwei angefangene Dreierblöcke). Anteilsbasis ist in diesem Beispiel 150 €/3 = 50 €; die bestätigte Werktagszählung bleibt unverändert. Kein automatischer Nachberechnungsbetrieb aktiviert; weitere Sonderfälle, etwa Verspätung nach einem bereits gebuchten zweiten Block, sind vor einer späteren Abrechnungsimplementierung präzise abzugleichen.
- Reinigung, Schaden und Verlust sind nicht neu beantwortet. Bereits belegte Bruchersatzwerte bleiben erhalten; keine neuen Pauschalen erfinden.

### B2 – Bestand und Mitarbeiterrechte

- Alle Vermietungen werden vor Ort in der Mietdatei erfasst. Der jeweils für die E-Mail-Anfrage verantwortliche Mitarbeiter trägt die Reservierung ein.
- Diese Datei ist nicht an die Website angebunden. Interne physische Mengengrenzen sind daher keine Anzeige freier Mengen für einen Termin; persönliche Bestätigung bleibt erforderlich.
- Für den deaktivierten Web-Bestellbetrieb werden jetzt keine erfundenen Mitarbeiterkonten oder Zugriffsrechte eingerichtet. Bei einer späteren Anbindung ist die tatsächliche Mietdatei gesondert technisch abzugleichen.
- Gemeinsame Garnituren-/Tisch-/Bankbestände bleiben unter der bestehenden Überschneidungssperre; keine neue Mischfreigabe aus dieser Antwort ableiten.

### B3 – Zahlungsanbieter, Rechnung und Versand

Antwort: später, sobald eine eigene WWS-API-Anbindung besteht. Bis dahin keine Zahlungsanbieter registrieren, keine Onlinezahlungen, keine automatische Rechnungserstellung und kein Belegversand aktivieren. Anbieter-, Rechnungsnummern-, Steuer-, Versand- und Kostenfragen erst im konkret aufgenommenen WWS-Projekt wieder öffnen; sie blockieren die Informationsseite und den manuellen Anfrageprozess nicht.

Vertrags-, Widerrufs-, Datenschutz-/Aufbewahrungs- und Rechnungsprozess müssen vor Aktivierung separat fachlich und technisch abgenommen sein. Keine unabhängige rechtliche Freigabe aus dieser Fragenliste ableiten. Endgültige Anbieterbedingungen, Kosten, Tests und Live-Aktivierung sind spätere konkrete Freigabepunkte, keine jetzt sinnvoll erteilbare Blankovollmacht.

## C. Keine neue pauschale Betreiberfreigabe nötig

- Deutsche Handzettel-Auslieferung und Angebotsbindung: Umsetzung des freigegebenen Entwurfs, nach Planfreigabe.
- Noch fehlende passende echte Cocktailfotos: Quellen-/Lizenz-/Motivprüfung innerhalb der bereits erteilten Ausnahme; kein erneutes Canva-only-Votum.
- Geprüfte bekannte Gewinnspielcover und Fotoausschlüsse: geltende Entscheidungen beachten.
- NL KW40: historische Quellenlücke, keine Sperre für aktuelle oder zukünftige Wochen. Nur für eine ausdrücklich gewünschte Archivnachpflege nochmals die genaue Originaldatei anfragen.
- Noch nicht freigegebene neue Personenmotive: erst bei einem konkreten Motiv Identität/Freigabe klären; nicht pauschal weitere Fotos oder Gruppenbilder umwidmen.
- Tests, Sicherheitsmaßnahmen, Fehlerbehebung, Dokumentationsabgleich und technische Herkunftsprüfung sind Arbeitsaufgaben.

## Umgang mit Antworten

Antworten anhand A1–A7 beziehungsweise B1–B3 übernehmen. Neue Antworten von bloßen Vorschlägen unterscheiden und im jeweils betroffenen Konzept dokumentieren. Keine Zugangsdaten, privaten Steuernummern, Bewerberdaten oder personenbezogenen Mitarbeiterrechte in dieser öffentlichen Datei speichern. Ein öffentlicher Git-Push ist weder ein Deployment noch eine Mail-/Zahlungsfreigabe.
