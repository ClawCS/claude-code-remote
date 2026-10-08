# Datenschutz und Löschung: Vorbereitung für Newsletter und Bewerbungen

Stand: 8. Oktober 2026. **Entwurf, nicht öffentlich aktiviert.** Vom Betreiber unter A6 beauftragte eigenständige Vorbereitung. Keine juristische Zertifizierung, keine bereits implementierte Löschautomatik und keine Freigabe zur Löschung vorhandener Daten. Die öffentliche Datenschutzerklärung wird erst an tatsächlich eingerichtete und getestete Abläufe angepasst.

## 1. Feststehender Umfang

Verantwortlicher: Getränkesupermarkt Jammers e.K., Inhaber Nikolaos Jammers, Jurgensstraße 20, 47574 Goch; Kontakt `jammers-goch@trinkgut.de`, 02823 418707. Betreiberangaben sind bestätigt. Es wird kein Datenschutzbeauftragter erfunden.

- Newsletter: Kunde meldet sich per E-Mail an und bestätigt die Anmeldung. Versand sonntags um 19:00 Europe/Berlin von `info@trinkgut-jammers.de`; Downloadlinks zu den Handzetteln der Folgewoche, ohne Kundenkonto. Postfach existiert laut Betreiber; Empfangs-MX zeigt IONOS. Versandberechtigung, Versandgrenzen und konkrete sichere Konfiguration sind noch nicht geprüft.
- Bewerbungen: Bewerbung, Lebenslauf, freiwilliges Portrait und Zeugnisse sollen an `jammers-goch@trinkgut.de` gelangen. Zwei aktuelle Markt-Stellenanzeigen sind als Grundlage benannt, bislang aber nicht als lesbare Anhänge eingegangen. Berechtigter Empfängerkreis noch ungeklärt. Der Betreiberwunsch nach Dokumentenversand wird nicht durch eine bloße Benachrichtigung als angeblich umgesetzt dargestellt.
- Mietanfragen: weiterhin vom Kunden selbst abgesendeter E-Mail-Entwurf oder WhatsApp; kein automatischer Website-Mailversand, kein verbindlicher Onlinebestellbetrieb. Reservierungen führt der Markt manuell in seiner Mietdatei.
- Bestehende Website-/Hostingverarbeitung bleibt unverändert. Diese Vorbereitung behauptet weder, dass keinerlei technische Verbindungsdaten entstehen, noch dass ein bestehender Mailanbieter automatisch vom Hetzner-AV-Vertrag umfasst wäre.

## 2. Newsletter: vorgeschlagener Ablauf

1. Nur E-Mail-Adresse als Pflichtangabe. Getrennte, nicht vorangekreuzte Anmeldung, keine Kopplung an Bewerbung oder Mietanfrage. Keine bestehenden Kunden-/Bewerberadressen automatisch übernehmen.
2. Einmaliger Bestätigungslink mit kurzer Laufzeit. Bestätigungsmail ohne zusätzliche Werbung. Vor Bestätigung kein Wochenversand; Wiederholungen begrenzen und fremde Adressen nicht durch Fehlermeldungen offenlegen.
3. Nachweis der jeweiligen Textversion, Zeitpunkt der Anmeldung und Bestätigung sowie der verwendeten Adresse. Keine unbeschränkte IP-/Gerätehistorie. Token nicht im Klartext speichern oder protokollieren.
4. Wöchentlicher Versand nur mit geprüften Originaldateien der richtigen Folgewoche; keine Ersatzwoche/Verlängerung alter Preise. Ein nicht vollständig geprüftes Paket führt zu einem internen Fehlerhinweis, nicht zum Versand veralteter Werbung.
5. Empfänger einzeln adressieren, niemals Sammel-CC. Versand pro Empfänger/Woche gegen Duplikate sichern; kontrollierte Wiederholung bei temporären Fehlern, harte Unzustellbarkeit aus dem aktiven Versand nehmen.
6. Jede Werbemail enthält Absenderidentität und einfache Abmeldung ohne Anmeldung in einem Kundenkonto. Abmeldung stoppt neue Sendungen sofort; keine erneute Aufnahme ohne neue Bestätigung. Kein Öffnungs-/Klicktracking im Grundumfang.
7. Mailanbieter, Auftragsverarbeitung, Datenstandorte und gegebenenfalls Drittlandverarbeitung vor Auswahl prüfen. Absenderzuständigkeit und erforderliche DNS-/Signaturkonfiguration sicher verifizieren; noch keine DNS-, Vertrags- oder Postfachänderung aus diesem Dokument.

Rechtlicher Ausgangspunkt für das Konzept ist die vorherige ausdrückliche Einwilligung in E-Mail-Werbung; auf eine Bestandskundenausnahme wird hier nicht gebaut. [§ 7 UWG](https://www.gesetze-im-internet.de/uwg_2004/__7.html). Die Nachweisführung einschließlich Bestätigungsprozess und Einwilligungstext orientiert sich an Abschnitt 3.3 der [DSK-Orientierungshilfe Direktwerbung](https://www.datenschutzkonferenz-online.de/media/oh/OH-Werbung_Februar%202022_final.pdf).

Vorgeschlagener Anmeldetext, **erst nach technischer Umsetzung verwendbar**:

> Ich möchte sonntags die Handzettel für die folgende Woche per E-Mail von Trinkgut Jammers erhalten. Ich kann mich jederzeit über den Link in jeder E-Mail abmelden. Hinweise zur Verarbeitung meiner Daten finde ich in den Datenschutzhinweisen.

## 3. Bewerbungen: vorgeschlagener Schutzablauf

- Nur notwendige Kontakt- und Bewerbungsangaben; keine Pflichtangaben zu Gesundheit, Religion, Familienstand oder Ausweisnummern. Portrait freiwillig. Keine automatisierte Eignungsbewertung oder Übergabe der Dokumente an KI-Dienste.
- Formulardaten und Uploads ausschließlich per HTTPS. Dateityp nicht nur anhand der Endung prüfen; erlaubte Typen/Größen begrenzen, Schadsoftwareprüfung und nicht öffentliche Quarantäne vor einer Weiterleitung. Keine Dokumente in `public/`, Git, Analyse-/Fehlerdiensten, Browser-LocalStorage oder frei aufrufbaren Downloadadressen.
- Zugang nur für den bestätigten zuständigen Personenkreis. Die Empfängeradresse allein belegt keine Berechtigung aller Postfachnutzer. Private Geräte/Weiterleitungen und gemeinsam genutzte Konten in die Prüfung einbeziehen.
- Gewünschter Weg: geprüfte Unterlagen an das bestätigte Marktpostfach. Vor Aktivierung Transport-, Empfangs- und Postfachschutz konkret prüfen. Bei unzureichendem Schutz nicht unverschlüsselt ausliefern, sondern einen gesicherten Abruf als Alternative abstimmen. Ein Dateianhang ist nicht allein durch den Versand per E-Mail automatisch sicher. Risikoorientierter Maßstab: [DSK zur E-Mail-Übermittlung](https://www.datenschutzkonferenz-online.de/media/oh/20210616_orientierungshilfe_e_mail_verschluesselung.pdf).
- Eingangsbestätigung ohne Kopie sensibler Unterlagen. Keine Erfolgsmeldung, solange sichere Annahme nicht nachgewiesen ist; getrennte Zustände für Annahme, Prüfung und Marktübermittlung.
- Bewerbung ausschließlich für Auswahl/Kommunikation nutzen. Keine automatische Newsletter-Anmeldung oder unbegrenzte Aufnahme in einen Bewerberpool. Für erforderliche Bewerberdaten ist [§ 26 BDSG](https://www.gesetze-im-internet.de/bdsg_2018/__26.html) zu berücksichtigen; eine pauschale Pflicht-Einwilligung ersetzt nicht die Prüfung der tatsächlichen Zwecke.

Vorgeschlagener Formularhinweis, **noch kein veröffentlichungsfertiger Art.-13-Text**:

> Wir nutzen deine Angaben und Unterlagen zur Bearbeitung deiner Bewerbung. Dein Portrait ist freiwillig. Bitte lade keine Ausweiskopien oder nicht erforderlichen sensiblen Angaben hoch. Welche Personen Zugriff haben, wie die Übermittlung erfolgt und wann die Daten gelöscht werden, erläutern wir in den Datenschutzhinweisen.

## 4. Fristenmatrix – Vorschläge, keine bereits geltende Löschregel

| Daten | Vorgeschlagener Umgang | Noch zu verifizieren |
| --- | --- | --- |
| Unbestätigte Newsletter-Anmeldung | Bestätigungslink 48 Stunden; unbestätigten Datensatz nach spätestens sieben Tagen entfernen | Anbieterfähigkeit und Wiederholschutz |
| Aktives Newsletter-Abonnement | Für die Dauer des bestätigten Abonnements; Abmeldung sofort aus dem aktiven Versand nehmen | tatsächliche Löschung/Sperrung beim Anbieter |
| Einwilligungs-/Abmeldenachweis | Separat zugriffsbeschränkt, nur minimaler Nachweis; konkrete begründete Frist vor Aktivierung festlegen | Nachweispflichten und konkrete Fristberechnung, kein ewiges Vollprofil |
| Technische Versandereignisse | Entwurf: 30 Tage für begrenzte Zustell-/Fehlerdaten, keine Mailinhalte oder Trackingprofile | Anbieterprotokolle und notwendige Störungsanalyse |
| Nicht eingestellte Bewerber | Entwurf: sechs Monate ab dokumentiertem Abschluss des Verfahrens, danach Löschung; begründete Rechtsstreit-/Aufbewahrungsausnahme separat | konkreter Prozess, Empfängerpostfach und Kopien; keine Behauptung einer universellen gesetzlichen Sechsmonatsfrist |
| Eingestellte Bewerber | Nur erforderliche Unterlagen gezielt in die Personalverwaltung übernehmen; überflüssige Kopien entfernen | bestehende Personalverwaltung und deren eigene Fristen |
| Abgebrochene/abgelehnte Uploads | Nur kurzfristige technische Quarantäne, im Entwurf spätestens 24 Stunden, sofern kein konkret dokumentierter Sicherheitsfall | tatsächlich gewählte Upload-/Scanarchitektur |
| Mietanfragen und Mietdatei | Vorhandenen Marktprozess zuerst aufnehmen; Anfrage, Vertrag/Beleg und bloße technische Kopie getrennt behandeln | tatsächliche Unterlagen, handels-/steuerrechtliche Pflichten; keine neue Pauschallöschung |
| Backups | Befristete Rotation und Löschvormerkungen; Wiederherstellung darf gelöschte Datensätze nicht wieder aktivieren | echte Backupzyklen aller beteiligten Systeme einschließlich Mailanbieter |

Die sechs Monate für abgeschlossene Bewerbungen sind ein Konzeptvorschlag, kein individuell festgestelltes Gesetz. Als Praxisbeispiel beschreibt die [Bundesagentur für Arbeit](https://www.arbeitsagentur.de/datenschutz/datenschutz-e-recruiting) eine Löschung sechs Monate nach Abschluss ihres Auswahlverfahrens. Jammers' konkrete Interessen und Pflichten müssen im endgültigen Verfahren berücksichtigt werden. Separat notwendige Einwilligungsnachweise nach Abmeldung werden in Abschnitt 3.7 der genannten DSK-Orientierungshilfe behandelt; Löschung aus dem Werbeverteiler und Nachweisaufbewahrung sind nicht dasselbe.

## 5. Fertigstellung und Betrieb vor Aktivierung

- Tatsächliche Empfänger, Dienstleister, Schutzmaßnahmen, Fristen und Datenflüsse in verständliche öffentliche Hinweise übernehmen; keine Platzhalter oder erfundenen AV-Verträge veröffentlichen.
- Auskunft, Berichtigung, Löschung/Widerspruch und Beschwerdemöglichkeit in den fertigen Hinweisen erklären; Identität bei Anfragen verhältnismäßig prüfen, keine unnötige Ausweiskopie verlangen. Maßstab sind die Informations- und Betroffenenrechte der [DSGVO](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679).
- Löschung auf Uploadspeicher, Verarbeitungskopien, Postfach, lokale Downloads, Warteschlangen und Anbieter abstimmen. Minimal protokollieren, was wann gelöscht wurde, ohne Dokumentinhalte zu kopieren. Streit-/Aufbewahrungsausnahmen einzeln begründen und regelmäßig prüfen.
- Tests ausschließlich mit synthetischen Daten: Abmelden vor Versand, doppelte Anmeldungen, zeitlicher Wochenwechsel/Sommerzeit, fehlende Handzettel, wiederholter Versandjob, bösartige Uploads, fremder Dokumentabruf, fehlgeschlagene Marktübermittlung und Wiederherstellung nach Löschung.
- Echte Testmails erst nach konkret vereinbartem Empfänger und Testumfang; keine Bewerberunterlagen als Testdaten. Rechtliche Aussagen an der tatsächlichen Umsetzung und bei Zweifeln mit qualifizierter Beratung prüfen; diese Vorbereitung ist keine unabhängige rechtliche Freigabe.

**Aktivierungsgrenze:** Newsletter-/Uploadbetrieb bleibt aus, solange die jeweilige sichere Datenverarbeitung und Zustellung nicht eingerichtet, geprüft und passend erläutert ist. Bestehende Daten werden durch diese Vorbereitung weder importiert noch gelöscht.
