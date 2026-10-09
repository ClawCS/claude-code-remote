# Bewerbungsupload: technische Vorprüfung

Stand: 9. Oktober 2026. Fortsetzungsauftrag des Betreibers: Bewerbungsupload fertigstellen. Dies ist eine Vorprüfung, keine Implementierung, Freischaltung oder vollständige Funktionsabnahme.

## Bereits entschiedene Vorgaben

- Empfänger für Bewerbungen und Unterlagen: `info@trinkgut-jammers.de`.
- Alle bereits zugangsberechtigten Personen dieses Postfachs dürfen Bewerbungsunterlagen lesen; keine erneute Abfrage dieser Entscheidung.
- Zwei bestätigte Stellen: Verkauf Vollzeit sowie Teilzeit bis zu 150 Stunden/Monat, jeweils m/w/d.
- Abgelehnte Bewerbungen sechs Monate nach dokumentiertem Verfahrensabschluss löschen, einschließlich Postfachkopien, sofern kein begründeter Ausnahmefall besteht. Nicht ab Uploaddatum rechnen.
- Portrait freiwillig; keine KI-Bewerberbewertung. Mietbetrieb und Newsletter sind nicht Teil dieses Fortsetzungsauftrags.

## Tatsächlich geprüft

- Aktive Worktree auf `codex/cinematic-production` mit `origin` synchronisiert; bereits aktuell. Fremde Screenshot-/Contentänderungen unverändert gelassen.
- `/bewerbung` enthält bisher nur den E-Mail-Kontakt. `/api/bewerbung` gibt weiterhin absichtlich 503 zurück. Kein bestehender Uploadablauf, den man lediglich einschalten könnte.
- Aktiver Serverrelease `b2383232fb5dfdb3a25a96d01995d470b0a54889`, Dienst aktiv. Das prüft Erreichbarkeit, nicht Bewerbungsfunktionen.
- Website-Dienst hat kein `EnvironmentFile`, entfernt bisher SMTP-Variablen ausdrücklich und darf nur im Next-Cache schreiben. Proxy begrenzt Anfragekörper allgemein auf 1 MB.
- Auf der VM sind rund 3,8 GiB Arbeitsspeicher, beim Abruf etwa 2,7 GiB verfügbar; kein Swap. Rund 14 GiB Plattenplatz frei. `clamd`, `clamdscan` und `freshclam` nicht gefunden. Keine Installation oder Kapazitätsänderung vorgenommen.
- Verschlüsselte SMTP-Verbindung vom tatsächlichen Hetzner-Host zu `smtp.ionos.de:587` per STARTTLS erfolgreich: TLS 1.3, Zertifikatsprüfung erfolgreich. Keine Anmeldung, keine Nachricht und kein Bewerberdokument übertragen. Dies ist kein Nachweis gültiger Postfachzugangsdaten oder erfolgreicher E-Mail-Zustellung.
- Bestehende Nodemailer-Abhängigkeit vorhanden; bisheriger Versandcode gehört zum gesperrten Mietsystem und darf nicht durch diese Erweiterung aktiviert werden.
- Es gibt noch keinen implementierten Abschluss-/Fristenprozess und keine geprüfte Postfach-Löschanbindung.

## Ergänzende Betreiberfreigabe

Nach dieser Vorprüfung bestätigt Niko am 9. Oktober die empfohlene Variante einschließlich des gezielten Postfachzugriffs zum Löschen. Damit sind geschützter Abschlussbereich und gezielter automatisierter Postfachanteil als Grundvariante gewählt. Keine pauschale Postfach-/Altbewerbungsbereinigung daraus ableiten. Der [schriftliche technische Entwurf](../superpowers/specs/2026-10-09-application-upload-design.md) steht separat zur Prüfung; noch keine Implementierung oder Aktivierung.

## Vor Implementierung beziehungsweise Aktivierung zu konkretisieren

1. Abschlussdatum und Ablehnungsstatus benötigen eine verantwortliche, authentifizierte Eingabe im Markt. Die bestätigte Sechsmonatsfrist ist entschieden, ihr technischer Auslöser noch nicht.
2. SMTP kann senden, aber keine Postfachkopien löschen. Die gezielte IMAP-Verarbeitung ist inzwischen grundsätzlich freigegeben; sichere Zuordnung, Anbieterfähigkeiten und Tests müssen diese Grenze noch belegen. Downloads, Weiterleitungen und andere externe Kopien bleiben gesondert zu behandeln.
3. Postfachzugang nur sicher provisionieren, nicht im Chat, Repository oder Logs. Authentifizierung und eine synthetische Zustellprobe stehen aus; Testempfänger/-umfang vorher abstimmen.
4. Ressourcen für einen lokalen Scanner vor Aktivierung belegen. ClamAV empfiehlt mindestens 3 GiB zusätzlich zu anderen Anwendungen; der vorhandene 4-GB-Host bietet dafür keine belegte Reserve. Keine eigenmächtige kostenpflichtige Aufrüstung oder externe Weitergabe von Bewerbungsdateien.

## Prüfplan für die spätere Umsetzung

- [ ] Technischen Datenfluss einschließlich Abschluss- und Löschprozess abstimmen; danach schriftliche Spezifikation/Implementierungsplan prüfen.
- [ ] Formular für die zwei Stellen, Inhalts-/Größenprüfung, private Verarbeitung und Missbrauchsschutz implementieren.
- [ ] Virenprüfung einschließlich Fehler-/Timeoutfällen und begrenzten Ressourcen testen; ungeprüfte Dateien niemals weiterleiten.
- [ ] Versand mit festem Empfänger, Duplikat-/Fehlerbehandlung und verständlichen Statusmeldungen testen.
- [ ] Abschlussdatum, sechs Kalendermonate, begründete Sperren, Kopien und Wiederherstellung/Löschung testen.
- [ ] Tatsächlichen Ablauf in öffentliche Datenschutzhinweise und Betriebsanleitung übernehmen.
- [ ] Mobil-/Desktop-, Sicherheits-, Zustell- und Löschtests mit synthetischen Daten; erst dann geprüfter Linux-Release und öffentliche Abnahme.

## Technische Primärquellen

- [IONOS: IMAP-/SMTP-Verbindungsdaten und STARTTLS-Port 587](https://www.ionos.de/hilfe/e-mail/allgemeine-themen/serverinformationen-fuer-imap-pop3-und-smtp/)
- [OWASP: Dateiuploads, Inhaltsprüfung, Grenzen und nicht öffentliche Speicherung](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [ClamAV: empfohlene Systemressourcen](https://docs.clamav.net/)

Keine Postfachinhalte oder Geheimnisse gelesen, keine Dateien installiert, keine echten E-Mails gesendet, keine Löschungen und keine Livekonfiguration verändert. Der Upload bleibt bis zur sicheren Umsetzung deaktiviert.
