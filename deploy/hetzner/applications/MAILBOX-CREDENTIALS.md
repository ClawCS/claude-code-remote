# Sichere einmalige Postfach-Einrichtung

Diese Einrichtung speichert ausschließlich das bestehende Passwort für `info@trinkgut-jammers.de`. Sie meldet sich nicht beim Mailanbieter an, sendet keine Nachricht und aktiviert keinen Bewerbungsdienst.

Der Betreiber startet `bash deploy/hetzner/applications/provision-mailbox-credential.sh` im privaten lokalen Terminal. Die vorhandene, streng hostgeprüfte SSH-Verbindung öffnet eine verdeckte Eingabe auf dem Website-Server. Passwort nicht im Chat, in Argumenten oder in einer `.env`-Datei eingeben. Eine Desktop-Verknüpfung darf lediglich dieses Script starten und enthält kein Passwort.

## Feste technische Schnittstelle

- Ziel: `trinkgut-jammers-web-01`, `159.69.37.200`.
- Credential: `/etc/credstore.encrypted/trinkgut-applications-mailbox-password`, root:root, `0600`; Verzeichnis root:root, `0700`.
- Das Passwort fließt ohne Zeilenende aus `systemd-ask-password --echo=no -n` direkt in `systemd-creds encrypt --with-key=host`. Kein Klartext-Zwischenspeicher auf Disk.
- Abbruch, Timeout, leeres/überlanges Passwort oder Verschlüsselungsfehler verhindern die Veröffentlichung. Bestehende Dateien werden nicht überschrieben. Eine spätere Korrektur/Rotation ist ein gesonderter kontrollierter Vorgang, kein Passwortreset beim Anbieter.
- Nur der spätere Worker erhält das Credential über `LoadCredentialEncrypted=trinkgut-applications-mailbox-password:/etc/credstore.encrypted/trinkgut-applications-mailbox-password`. Next und Intake erhalten es nicht. Vor Aktivierung muss der tatsächliche Worker diese Schnittstelle geprüft konsumieren.
- Der Credential-Inhalt ist nur das Passwort. Benutzer, Absender und Empfänger bleiben fest `info@trinkgut-jammers.de`.

Der Host-Schlüssel liegt unter `/var/lib/systemd/credential.secret`. Beide Dateien in derselben Serversicherung bieten **keinen** unabhängigen Lösch- oder Wiederherstellungsschutz; die Verschlüsselung ersetzt weder Zugriffskontrolle noch den Restore-/Löschabgleich. Keine SSD-Überschreibungs- oder Anbieterbackup-Löschgarantie.

## Prüfstand 10.10.2026

Shell-Syntax, nichtinteraktive Ablehnung und feste Ziel-/No-Clobber-/Pipeline-Regeln sind lokal getestet und unabhängig im Quelltext geprüft. Ein synthetischer Verschlüsselungs-/Entschlüsselungslauf mit tatsächlich installiertem `systemd-creds` auf dem Server war erfolgreich; die Testdatei wurde entfernt. Das ist kein Nachweis eines richtigen Mailboxpassworts, einer Zustellung oder einer funktionierenden Postfachlöschung. Der tatsächliche Betreiber-Eingabelauf und spätere begrenzte Mailpilot werden separat nachgewiesen. Keine Geheimnisse oder deren Hashes in Prüfberichte übernehmen.

Niko bestätigte anschließend „Passwort sicher hinterlegt“. Die ausschließlich lesende Metadatenkontrolle vor und nach der freigegebenen CX33-Erweiterung belegt eine reguläre Datei am festen Ziel, root:root, 0600, einen Hardlink. Der Betreiber-Eingabeschritt ist damit erfolgt; das Passwort wurde nicht ausgelesen und noch nicht gegen SMTP/IMAP getestet. Kein Dienst ist dadurch aktiviert.
