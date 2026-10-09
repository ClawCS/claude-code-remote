# Bewerbungsportal: Upload, Postfachversand und kontrollierte Löschung

Datum: 9. Oktober 2026. **Schriftliche Spezifikation vom Betreiber mit „ja passt so“ freigegeben; noch keine Implementierung oder Aktivierung.** Die Freigabe umfasst die zuvor gewählte Grundvariante einschließlich gezielten Postfachzugriffs und den hier beschriebenen Schutzablauf. Der [Implementierungsplan](../plans/2026-10-09-application-upload.md) konkretisiert Reihenfolge, Schnittstellen und Tests; seine Prüfung und die Wahl der Ausführungsmethode stehen noch aus. Technische Einrichtungen sind dadurch nicht bereits produktiv vorhanden.

## 1. Ziel und bestätigter Auftrag

Besucher können sich auf die beiden tatsächlichen Stellen bewerben, Unterlagen direkt hochladen und erkennen, ob ihre Bewerbung angenommen und an den Markt übermittelt wurde. Der Markt erhält die geprüften Unterlagen als Anhänge an **info@trinkgut-jammers.de**. Ein kleiner geschützter Bereich dokumentiert Abschluss und Löschfrist; kein vollständiges Personalverwaltungssystem.

Bestätigt sind Verkauf in Vollzeit und Teilzeit bis zu 150 Stunden/Monat, jeweils m/w/d und sofortiger Einstieg möglich. Alle bestehenden Postfachberechtigten dürfen die Unterlagen lesen. Abgelehnte Bewerbungen werden sechs Monate nach dokumentiertem Verfahrensabschluss gelöscht, einschließlich zugehöriger Postfachkopien, vorbehaltlich begründeter Einzelfallausnahmen. Der Betreiber hat am 9. Oktober zusätzlich die vorgeschlagene gezielte Postfach-Löschanbindung freigegeben. Keine Löschung bereits vorhandener Altbewerbungen aus dieser Freigabe ableiten.

Die bestehende Homepage-Gestaltung bleibt erhalten. Mietbetrieb, Zahlungen, Newsletter, Canva, Instagram und DNS werden nicht verändert. Keine KI-Auswertung von Bewerbungen und keine Übermittlung der Dateien an öffentliche Analyse-/Virenscan-Dienste.

## 2. Gewählte Variante und Grenzen

Gewählt ist die Erweiterung auf dem bestehenden Hetzner-Host mit eigenem Bewerbungsdienst, lokalem Scanner, IONOS-Versand und kontrollierter IMAP-Löschung. Ein rein manueller Löschprozess würde die gewünschte Automatik nicht erfüllen. Ein externer Bewerbungsanbieter würde zusätzliche Anbieter-/Vertragsentscheidungen benötigen und ist nicht vorgesehen.

Die Automatik kann nur eindeutig vom Portal erzeugte Nachrichten und deren unveränderte, zuordenbare Postfachkopien bearbeiten. Weiterleitungen, Antworten mit neu angehängten Dokumenten, lokale Downloads und Ausdrucke bleiben im organisatorischen Löschprozess. Im Verwaltungsbereich wird deren Prüfung ausdrücklich bestätigt; die Website behauptet nicht, solche Kopien selbst gelöscht zu haben.

IONOS-Zugangsdaten können technisch Zugriff auf das ganze Konto gewähren. Die Beschränkung auf Portalbewerbungen muss deshalb zusätzlich durch isolierten Dienst, unveränderbare Zuordnungsregeln, Tests und minimale Verarbeitung erzwungen werden; keine angeblich vom Anbieter gewährte Einzelmail-Berechtigung versprechen.

## 3. Sichtbarer Ablauf

`/bewerbung` erhält zwei zugängliche Stellenkarten mit echten Texten statt bloßer Poster und ein gemeinsames Formular mit vorbelegter Stelle. Einstieg über bestehende Team-/Footer-Navigation, kein Umbau der übrigen Hauptnavigation.

Pflichtangaben: Name, E-Mail-Adresse, Stellenwahl. Telefon, Nachricht, Anschreiben, Lebenslauf, Zeugnisse und Portrait sind freiwillig; keine Gesundheits-, Ausweis-, Familienstands- oder Religionsfelder. Keine Pflicht zum Portrait. Kein Kundenkonto und keine Newsletter-Kopplung.

Vorgesehene Grenzen: höchstens fünf Dateien, höchstens 5 MiB je Datei und 10 MiB insgesamt; nur PDF, JPEG und PNG. Format-/Größenhinweise vor der Auswahl, einzeln entfernbare Dateien, tastaturbedienbare Auswahl, beschriftete Fehler und sichtbarer Fortschritt. Keine Speicherung von Formularinhalten oder Dokumenten in LocalStorage/Analysewerkzeugen.

Zustände werden getrennt angezeigt:

1. **Noch nicht angenommen:** Validierung, Übertragung oder Annahme fehlgeschlagen; kein Erfolgshinweis.
2. **Eingang gespeichert, Prüfung läuft:** persistenter privater Eingang bestätigt, Referenznummer verfügbar; noch keine abgeschlossene Dateiprüfung oder Markt-Zustellung behaupten.
3. **An das Marktpostfach übermittelt:** Versand und Eingang der exakt zugeordneten Nachricht im Postfach bestätigt; keine Lesebestätigung behaupten.
4. **Prüfung/Übermittlung nicht abgeschlossen:** verständlicher Hinweis mit Referenznummer und Kontaktweg; keine stillen Verluste, kein blindes erneutes Absenden.

Der Statusabruf benötigt einen unerratbaren, kurzlebigen Nachweis und liefert ausschließlich Status/Referenz, keine persönlichen Daten oder Dateien. Keine öffentlichen Dokumentlinks. Eine automatische zusätzliche Mail an die ungeprüfte Bewerberadresse ist nicht Teil der ersten Version; die Eingangsbestätigung erfolgt auf der Website.

## 4. Technische Trennung

| Bestandteil | Verantwortung | Darf ausdrücklich nicht |
| --- | --- | --- |
| Bestehende Next-Website | Stellen-/Formularoberfläche und Verwaltungsoberfläche | Postfachpasswort, Scanner-Ausnahmen oder Mietaktivierung übernehmen |
| Privater Annahmedienst | Begrenzte HTTP-Annahme, Formatprüfung, privater Eingang und Status | SMTP-/IMAP-Zugang erhalten, fremde Dateien lesen oder Bewerbungen löschen |
| Hintergrunddienst | Scan, Versand, Fristen, Zuordnung und gezielte Postfachlöschung | Unzugeordnete Nachrichten oder Altbewerbungen erfassen/löschen |
| Lokaler Scanner | Dateien mit aktuellen Signaturen prüfen | Öffentlich erreichbar sein oder Dokumente extern hochladen |
| Geschützter Verwaltungsbereich | Bearbeitungsstand, Abschluss, Ausnahmen, Nachweise | Allgemeiner Webmail-Ersatz oder öffentliche Dokumentablage werden |

Annahme und Hintergrundverarbeitung laufen unter getrennten Dienstidentitäten; Laufzeitdaten liegen außerhalb von Releases, `current`, `public` und Git. Die Annahme erhält nur Rechte auf neue Eingänge und begrenzte Statuskommunikation, nicht auf Postfachzuordnung/Löschregister. Übergabe nur vollständig geschriebener Datensätze. Der Worker erzeugt anschließend eine eigene private Kopie mit neuen Dateiinodes, auf die der Annahmedienst keinen Zugriff hat; bloßes Verschieben oder Ändern der Dateirechte genügt wegen möglicherweise noch offener Schreibzugriffe nicht. Ausschließlich diese stabilen privaten Bytes werden erneut validiert, gehasht, gescannt und später versandt. Keine symbolischen Links, frei wählbaren Dateipfade oder Ausführung hochgeladener Inhalte.

Transaktionale private Datenbank für Zustände, Idempotenz, Versandversuche, Zuordnung und Fristen. Genau ein aktiv verarbeitender Worker pro Vorgang; konkurrierende Status-/Löschaktionen werden serialisiert. Fehler beim persistenten Schreiben sind keine erfolgreiche Annahme.

Caddy leitet nur die festgelegten Bewerbungs-/Verwaltungs-API-Pfade an den lokalen Dienst weiter. Nur der eigentliche Upload erhält ein passendes größeres Bodylimit; sonst bleibt die bestehende 1-MB-Grenze. Keine neuen öffentlichen Ports. Der alte Next-Uploadhandler bleibt gesperrt, falls der Dienst nicht eingerichtet ist. `RENTAL_MODE=disabled` und die bisherige Trennung der Miet-Zugangsdaten bleiben bestehen.

## 5. Upload- und Verarbeitungsgrenzen

- Dateiendung, MIME-Angabe und tatsächlicher Dateiinhalt müssen übereinstimmen. Keine Archive, Office-Dateien, HTML/SVG, passwortgeschützten PDFs oder aktiven PDF-Inhalte. Beschädigte oder nicht eindeutig prüfbare Dateien werden abgewiesen.
- Eingaben, Anzahl der Formfelder/Dateien, Dateigröße und Gesamtgröße während des Lesens begrenzen, nicht erst nach vollständiger Speicherbelegung. Zufällige interne Dateinamen; Originalnamen nur bereinigt zur Anzeige/als Anhang.
- Serverseitige Same-Origin-/CSRF-Prüfung, kurzlebiger Formularnachweis, Rate-Limits auf Basis des vertrauenswürdigen Proxys, zusätzliche globale Annahme-/Speichergrenze. Kein Drittanbieter-Captcha im Grundumfang. Begrenzte pseudonymisierte Missbrauchszähler, keine unbegrenzte IP-Historie.
- Startwerte: höchstens zwei parallele Uploads, ein Scan gleichzeitig, höchstens 20 wartende Vorgänge und 250 MiB Eingangsdaten. Wenn Grenzen erreicht sind, Annahme mit verständlichem Wiederholhinweis stoppen. Keine Beeinträchtigung der übrigen Website durch ungebremste Warteschlangen.
- Virenscan vor jedem Versand; bei Scannerfehler, veralteten Signaturen (über 24 Stunden), Ressourcenüberschreitung, unvollständigem Scan oder unklarem Resultat kein Versand. Ein negatives Scanergebnis ist keine absolute Unbedenklichkeitsgarantie.
- Kontakt-/Dokumentinhalte verschlüsselt und nur kurzfristig in der privaten Verarbeitungsablage halten. Schlüssel nicht im Repository, in öffentlichen Releases oder Logs. Parser/Scanner mit Zeit-, Prozess- und Speichergrenzen betreiben.
- Idempotenzschlüssel an den serverseitigen Inhaltsfingerabdruck binden. Gleicher Schlüssel und anderer Inhalt wird abgelehnt; gleiche Übertragung darf keine weitere Bewerbung oder doppelte Mail erzeugen.

## 6. E-Mail und eindeutige Herkunft

Fester Absender und Empfänger `info@trinkgut-jammers.de`; Bewerberadresse höchstens als geprüfter einzelner Reply-To. Keine frei wählbaren Empfänger, Headerzeilen oder Remote-Anhänge. Verschlüsseltes IONOS-SMTP, verpflichtende Zertifikatsprüfung und STARTTLS; bereits belegter Transportweg ist Port 587. Das vorhandene Postfach muss vor Aktivierung tatsächlich authentifiziert und getestet werden. [IONOS-Verbindungsdaten](https://www.ionos.de/hilfe/e-mail/allgemeine-themen/serverinformationen-fuer-imap-pop3-und-smtp/)

Vor Versand eine serverseitig erzeugte Bewerbungs-ID, feste Message-ID, signierte Herkunftskennung und Fingerabdrücke der normalisierten Inhalts-/Anhangsteile dauerhaft speichern. Weder Dateiname, Bewerberadresse noch Betreff allein bestimmen die spätere Zuordnung. Nur der Hintergrunddienst kann neue Versand-/Löschregistrierungen erzeugen.

Der Worker unterscheidet eindeutig gescheiterten Versand, SMTP-Annahme und unklaren Ausgang. Bei eindeutig temporärem Fehler begrenzt wiederholen; bei unklarer Annahme zuerst im Postfach auf genau diese Nachricht prüfen. Weder SMTP noch Message-ID garantieren von sich aus exakt einmalige Zustellung. Ungeklärte Fälle erfordern Prüfung und werden nicht blind nochmals gesendet.

Für die Empfangsbestätigung IMAP/TLS verwenden und nur registrierte Nachrichten anhand der festen Kennungen suchen; keine allgemeine Postfachanalyse oder Downloads fremder Mailinhalte. Zunächst begrenzte Headerprüfung per `BODY.PEEK`, danach nur für passende Kandidaten begrenztes MIME-Lesen und tatsächliche Neuberechnung des Inhaltsfingerabdrucks. Alle dekodierten Anhänge, Anwendungstexte und festgelegten stabilen Identitätsheader einbeziehen; doppelte/widersprüchliche Header, unerwartete MIME-Teile oder überschrittene Parsergrenzen blockieren die Zuordnung. Eine kopierte gültige Signatur mit verändertem Inhalt darf nicht genügen. Keine Veränderung fremder Gelesen-Markierungen. Zuordnung einschließlich tatsächlichem Ordner, UIDVALIDITY und UID speichern. Unerwartet viele oder abweichende Kandidaten blockieren die automatische Verarbeitung.

## 7. Interne Bearbeitung

Der geschützte Bereich zeigt Name, Stelle, Referenz, Eingang, Versandstatus und Bearbeitungsstand. Dokumente werden weiterhin im bestehenden Postfach gelesen; kein zusätzlicher Web-Dokumentviewer erforderlich.

Namentliche Mitarbeiterzugänge mit Passwort und zweitem Faktor, keine öffentliche Registrierung oder automatisch aus Mailadressen abgeleitete Berechtigung. Initialer verantwortlicher Zugang für Niko; weitere Zugänge nur nach seiner ausdrücklichen Zuordnung. Das bestehende Leserecht aller Postfachberechtigten bleibt unverändert, erzeugt aber nicht automatisch Verwaltungs-/Löschrechte. Sichere Einrichtung/Wiederherstellung ohne Passwörter oder TOTP-Geheimnisse im Chat/Repository.

Sitzungen nur über sichere HttpOnly-Cookies, SameSite, CSRF-Schutz, Rate-Limits, Ablauf und serverseitige Widerrufbarkeit. Abschluss-, Ausnahme- und Wiedereröffnungsaktionen mit erneuter Identitätsbestätigung; kein mutierender GET-Link in E-Mails. Pro Aktion Verantwortlichen und Zeitpunkt protokollieren, keine Dokumentinhalte kopieren.

Status: offen → in Bearbeitung → abgelehnt/abgeschlossen. Abschlussdatum in Europe/Berlin ausdrücklich bestätigen; keine automatische Ablehnung nach Untätigkeit. Datum darf nicht vor Eingang oder in der Zukunft liegen. Korrekturen müssen begründet sein und die bisherige Frist sichtbar halten. Eine Einstellung, Rücknahme oder Betroffenenlöschung ist ein gesonderter Fall, keine stillschweigende Anwendung der Ablehnungsregel. Der Markt dokumentiert hierfür den individuellen Abschluss und die erforderliche Kopienbehandlung; keine Personalakte im Portal.

Eine begründete Aufbewahrungsausnahme braucht Verantwortlichen, knappe Begründung und nächsten Prüftermin (höchstens 30 Tage). Ausnahmefälle werden regelmäßig vorgelegt; der Ablauf eines Prüftermins löst nicht eigenmächtig eine Löschung trotz weiterbestehendem Ausnahmegrund aus. Kein unbegründetes dauerhaftes Häkchen zum Aufbewahren.

## 8. Frist und gezielte Postfachlöschung

Sechs **Kalendermonate** nach dem bestätigten Berliner Abschlussdatum, nicht 180 Tage und nicht nach Eingang. Fehlender Zielmonatstag wird auf den letzten Monatstag begrenzt; Beispiel 31.08.2026 → Fristende 28.02.2027. Löschung ab dem folgenden Berliner Kalendertag. Der serverseitige tägliche Lauf um 03:30 Europe/Berlin holt ausgefallene Läufe nach und verhindert doppelte Ausführung. Kein Mac-/Codex-Heartbeat als Produktiv-Löschdienst.

Sieben Tage vor Fälligkeit im Verwaltungsbereich markieren. Ohne bestätigten Ablehnungsabschluss oder bei dokumentierter Ausnahme keine automatische Löschung. Offene Vorgänge erhalten nach 30 Tagen eine Bearbeitungserinnerung, damit Fristen nicht durch fehlende Statuspflege umgangen werden; keine fiktiven Abschlussdaten setzen.

Unmittelbar vor einer Löschung unter demselben Vorgangslock Status, Datum und Ausnahme erneut prüfen. In erreichbaren Postfachordnern ausschließlich nach registrierten Kennungen suchen; unbekannte Nachrichten werden weder inhaltlich gelesen noch verändert. Gefundene Kandidaten müssen Herkunftssignatur, Message-ID und Inhaltsbindung erfüllen. Ein gefälschter Header oder ähnlich lautender Betreff reicht nicht.

UIDs gelten nur zusammen mit Ordner und UIDVALIDITY. Nach Verschiebung oder Änderung der UIDVALIDITY Kandidaten neu verifizieren; keine alte Nummer blind wiederverwenden. Ausschließlich exakt verifizierte einzelne UIDs markieren und gezielt endgültig entfernen. Voraussetzung ist getestete Unterstützung von `UID EXPUNGE`/UIDPLUS oder gleichwertiger gezielter Löschung. **Kein globales EXPUNGE, CLOSE mit implizitem Expunge, vollständiges Papierkorbleeren oder Verändern fremder Löschmarkierungen als Ersatz.** Ohne sichere Fähigkeit pausiert der Postfach-Löschschritt mit Fehlermeldung. [IMAP UIDPLUS](https://www.rfc-editor.org/rfc/rfc4315.html)

Nachprüfung über sämtliche auswählbaren Ordner einschließlich Papierkorb, Archiv und Gesendet: Im kontrollierten Suchumfang keine verifizierten Kopien mehr vorhanden. Nicht lesbare Ordner, Teilfehler, zwischenzeitliche Verschiebungen oder widersprüchliche Kandidaten bleiben offen. Kontrollierter erneuter vollständiger Abgleich, höchstens drei Durchläufe pro Lauf; danach offener Fehler statt endloser Suche oder pauschalem Status „alles gelöscht“. Für Ordnerwechsel/Beendigung ausschließlich nicht löschende Abwahl beziehungsweise Logout; auch Bibliotheks-Cleanup darf kein implizites Expunge auslösen. Nur neu über dieses Portal empfangene Bewerbungen ab Aktivierung werden verarbeitet, keine Suche nach alten Bewerbernamen zur rückwirkenden Bereinigung.

Der Markt bestätigt zusätzlich die Behandlung von Weiterleitungen, Download-/Papierkopien und nicht automatisch zuordenbaren Antworten. Technische Postfachlöschung und organisatorischer Abschluss bleiben separate Nachweise. Die bereits bestätigte Sechsmonatsregel wird dadurch nicht auf einen beliebigen späteren Termin verschoben.

## 9. Datenminimierung, Backups und Wiederherstellung

Vorgesehene technische Fristen für diese Umsetzung:

- Erfolgreich im Postfach bestätigte Uploaddateien, Nachrichtentext und Bewerberkontakt in der Verarbeitungsablage innerhalb von 24 Stunden entfernen. Im Fristenregister bleibt nur der notwendige reduzierte Vorgang, keine Dokumentkopie.
- Ungültige, schädliche oder abgebrochene Uploads spätestens nach 24 Stunden entfernen. Davon ausdrücklich getrennt: bereits dauerhaft angenommene, gültige Bewerbungen mit Zustellstörung bleiben verschlüsselt höchstens sieben Tage zur Wiederherstellung/gezielten Übermittlung erhalten. Nach spätestens einer Stunde ohne bestätigte Zustellung einen internen Störfall anzeigen, spätestens nach 24 Stunden die manuelle Klärung durch den Markt verlangen. Bei Ablauf der sieben Tage Dokumente entfernen, aber keinen abgeschlossenen Bewerbungs-/Versandstatus erfinden.
- Für solche Zustellstörfälle Name, E-Mail, Referenz und Fehlerstatus höchstens 30 Tage ab Annahme für die persönliche Rückmeldung durch den Markt halten; nach dokumentierter Klärung früher entfernen. Der Verantwortliche hält die Kontaktaufnahme und den vereinbarten erneuten Übermittlungsweg fest. Ein Timer darf den Störfall nicht als erfolgreich erledigt schließen. Nach Ende der Frist verbleibt bei fehlender Klärung nur ein nicht identifizierender offener Betriebsfehler; der Verlust/Abbruch wird nicht verschwiegen. Öffentlicher Status zeigt keine erfolgte Marktübermittlung.
- Kurzlebige öffentliche Statusnachweise laufen nach sieben Tagen ab. Missbrauchszähler spätestens nach 24 Stunden verwerfen. Technische Fehlerereignisse ohne Namen, Adressen, Dateinamen oder Inhalte höchstens 30 Tage.
- Nach vollständig dokumentiertem Löschvorgang identifizierende Registerdaten entfernen. Für Wiederherstellungsschutz und begrenzten Nachweis nur zufällige interne Kennung, Zeitpunkt, Prüfergebnis und nicht rückrechenbare Zuordnungsfingerabdrücke weiterführen; auch diese Daten bleiben zugriffsbeschränkt und werden nicht als garantiert anonym bezeichnet.

Vor Aktivierung tatsächliche Hetzner-/IONOS-Backup- und Löschmöglichkeiten feststellen. Keine individuelle sofortige Entfernung aus Anbietersicherungen behaupten. Verschlüsselung allein bewirkt keine Löschung, wenn Schlüssel in einer Sicherung mitgespeichert wurden. Wiederherstellung erfolgt zunächst ohne Upload-/Versand-/Löschbetrieb; anhand eines vom wiederhergestellten Snapshot unabhängigen aktuellen Löschregisters bereits gelöschte Vorgänge bereinigen, erst danach freigeben. Aufbewahrungsdauer des reduzierten Wiederherstellungsregisters auf den belegten maximalen Restorezeitraum plus 30 Tage begrenzen; ohne belegten Zeitraum und getesteten Abgleich keine Aktivierung.

Öffentliche Datenschutzangaben müssen die tatsächlichen Dienste, Empfänger, Zwecke, Fristen, Kopiengrenzen und Rechte erklären. Keine erfundenen Anbietervereinbarungen oder pauschale gesetzliche Sechsmonats-Pflicht. Bewerberdaten sind bei Erforderlichkeit für die Einstellungsentscheidung in § 26 BDSG erfasst; der Entwurf ersetzt keine individuelle juristische Abnahme. [§ 26 BDSG](https://www.gesetze-im-internet.de/bdsg_2018/__26.html)

## 10. Aktivierungsbedingungen und Abnahme

Die Vorprüfung zeigt einen 4-GB-Host ohne installierten Scanner und ohne eingerichtete Mail-Zugangsdaten. SMTP/TLS-Verbindung allein ist kein Versandnachweis. Vor Aktivierung müssen Scanner-Ressourcen einschließlich Signaturaktualisierung und gleichzeitigem Websitebetrieb nachgewiesen sein. Ein notwendiger kostenpflichtiger Ausbau wird mit konkreten Kosten separat freigegeben; keine eigenmächtige Buchung oder externe Scan-Ausweichlösung.

Vorhandene Postfachzugänge sicher durch den Betreiber provisionieren. Kein Passwortwechsel ohne Auftrag. Echtes SMTP/IMAP zuerst ausschließlich an eindeutig gekennzeichneten synthetischen Testbewerbungen prüfen; Empfänger `info@trinkgut-jammers.de`, Umfang und zulässige Testlöschung vorher konkret ankündigen und bestätigen lassen. Keine echten Bewerbungen als Testdaten oder ungeprüfte Altmail-Löschung.

Pflichtabnahme:

- Erlaubte Formate sowie falsche Endung/MIME, beschädigte/aktive/verschlüsselte PDFs, große Dateien, zu viele Teile, Abbruch, Timeouts und Scannerfehler.
- Unberechtigter Abruf, CSRF, Header-/Pfadinjektion, gefälschte Herkunft, Rate-Limits und Erschöpfung von Speicher/Queue; keine Inhalte/Geheimnisse in Logs oder öffentlichem Build.
- Gleichzeitige/doppelte Absendung, offener Schreibzugriff des Annahmedienstes während Worker-Übernahme, Prozessneustart zwischen Annahme/Scan/SMTP, uneindeutige SMTP-Annahme, Postfachverzögerung, korrekte Anhänge und Empfänger; kein Verlust bereits bestätigter Annahmen ohne sichtbaren Fehlerstatus. Zustellstörung über 24 Stunden sowie Sieben-/30-Tage-Grenzen müssen die getrennte manuelle Nachverfolgung und begrenzte Aufbewahrung nachweisen.
- Verifiziertes Mitarbeiterlogin, zweiter Faktor, Sitzungsablauf/Widerruf, Fremdzugriff und erneute Bestätigung sensibler Aktionen.
- Sechs Kalendermonate, Monatsende/Schaltjahr/Sommerzeit, Korrektur/Wiedereröffnung/Ausnahme unmittelbar vor Löschung und konkurrierende Worker.
- Gleicher Betreff bei fremder Mail, gefälschte Portalheader, fremde bereits löschmarkierte Mail, identische Kopien in mehreren Ordnern, UIDVALIDITY-Wechsel, fehlendes UIDPLUS, verschobene Nachricht und Teilausfall: **keine fremde Mail darf verändert oder gelöscht werden.**
- Bereinigung von temporären Dateien/Metadaten, organisatorische Kopienbestätigung und vollständige Wiederherstellungsprobe mit synthetischem gelöschtem Vorgang.
- Desktop/Mobil, Tastatur/Screenreader, Fehler-/Statusanzeigen und erreichbare Datenschutzhinweise. Bestehende Handzettel-/Miet-/Navigationstests bleiben grün; bisherige 503-Erwartungen werden ausschließlich für den neuen konfigurierten Bewerbungsbetrieb aktualisiert.
- Separater geprüfter Linux-Release; Abschalt-/Rückrollweg für den Bewerbungsdienst ohne Verlust oder erneuten Versand angenommener Vorgänge. Erst nach echten HTTPS-/Zustell-/Löschprüfungen als live bezeichnen.

## 11. Stand und nächster Schritt

Diese Spezifikation beschreibt die im Chat ausgewählte und am 9. Oktober schriftlich freigegebene Variante und ihre technische Begrenzung. Postfachfreigabe und Spezifikationsfreigabe sind dokumentiert, aber es wurden keine Zugangsdaten gelesen, Postfachaktionen durchgeführt, Dienste installiert oder Produktfunktionen aktiviert. Der konkrete Implementierungsplan liegt separat vor; nach seiner Prüfung und Wahl der Ausführungsmethode folgt die Umsetzung. Vor Produktivaktivierung bleiben die in Abschnitt 10 genannten Nachweise und gegebenenfalls konkreten Test-/Kostenfreigaben erforderlich.

Technische Basis der Uploadkontrollen: [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html). Aktuelle Ausgangsnachweise: [Vorprüfung vom 9. Oktober](../../audits/2026-10-09-application-upload-readiness.md).
