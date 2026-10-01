# Mietbestellungen: Einrichtung und Betrieb

Stand: 1. Oktober 2026. Der Betreiber hat den Ablauf und seine Umsetzung ausdrücklich freigegeben. Der öffentliche Server ist weiterhin nicht online. Dieser Ausbau ist kein Ersatz für die rechtliche/steuerliche Abnahme und kein Auftrag zur kostenpflichtigen Anbieterregistrierung.

## Ablauf

1. Ausschließlich bekannte, vollständig bepreiste Leihartikel: Kundenangebot mit Kontaktdaten, bestätigten Bedingungen und serverseitig nachgerechneten Bruttopreisen. Gemischte/unbepreiste Auswahl bleibt eine Anfrage.
2. Markt meldet sich unter `/markt/bestellungen` an und bestätigt Termin/Verfügbarkeit. Annahme reserviert den Bestand atomar und vergibt einmalig eine Rechnungsnummer. Eingang allein ist keine Annahme.
   Vor Annahme wird die Rechnung vollständig probeweise gerendert. Nicht unterstützte Schriftzeichen oder ungültige Belegangaben verhindern Annahme und Zahlungsanlage mit einem klaren Hinweis; Kundennamen werden niemals verändert oder abgeschnitten.
3. Online: Zahlungslink wird erst nach Annahme angelegt. Oder bar: Markt erfasst die tatsächlich erhaltene Zahlung bei Abholung. Keine automatische Abbuchung beim Absenden.
4. Rechnung bei Annahme, aktualisierter Zahlungsstand unter derselben Rechnungsnummer nach Zahlung. Lieferschein erst nach tatsächlich erfasster Übergabe. Beide Belege gehen getrennt an Kunden- und Marktadresse.
5. Übergabe erst nach Zahlung, Rückgabe erst nach Übergabe. Es gibt keine automatische Freigabe unbezahlter Reservierungen, keine automatische Stornierung/Erstattung und keine behauptete Anbindung an anderweitig geführte Marktbestände.

Mietkalender: Mo–Sa ohne Sonn-/NRW-Feiertage, Abholung/Rückgabe inklusive. Jeder angefangene Dreierblock kostet den vollen Listenpreis. Preise bleiben brutto; der konfigurierte Steuersatz dient nur der Aufschlüsselung, nicht dem Aufschlag.

## Sicherer lokaler Test

Node.js mindestens 22.13 (native `node:sqlite`), ein einzelner dauerhafter Node-Host. Nicht für flüchtige Serverless-Dateisysteme oder mehrere unabhängige Instanzen ausgelegt. Der Testmodus darf nur auf Loopback laufen und verwendet ausschließlich erfundene Daten, lokal gespeicherte Mailkopien und eine lokale Zahlungssimulation. Ein Test-Datenverzeichnis kann nicht in ein Live-Verzeichnis umgewandelt werden.

```sh
RENTAL_MODE=test RENTAL_DATA_DIR=/tmp/jammers-rental-local-test RENTAL_PUBLIC_ORIGIN=http://127.0.0.1:3104 npm run start -- --hostname 127.0.0.1 --port 3104
```

Vorher `npm run build`. Alternativ eigener Entwicklungsserver mit freiem Port; kein zweiter Dev-Server auf demselben `.next-dev`-Verzeichnis.

- Kunde: `/vermietung` → `/warenkorb` → `/checkout` → persönlicher Bestelllink.
- Markt: `/markt/bestellungen`.
- Ausschließlich im lokalen Test: Zugang `TEST-ONLY-local-admin-secret-not-for-live`.
- Test-Mails sind in der geschützten Marktansicht einsehbar. Ihre PDF-Anhänge liegen als Base64 in privaten Testdateien; sie werden nicht an SMTP übergeben.
- Die 19 % im Testaussteller sind synthetische Testdaten, keine bestätigte Besteuerung des Marktes.

## Live-Voraussetzungen (weiterhin offen)

Öffentliche HTTPS-Domain, dauerhafter Server und privates Datenverzeichnis; freigegebene Miet-/Verbraucherinformationen (einschließlich gegebenenfalls Widerruf und elektronischer Widerrufsfunktion), Datenschutz/Aufbewahrung, bestätigter Aussteller samt Steuerangaben, Rechnungssystem/Nummernkreis und Steuersatz, Kaution/Zusatzkosten, Sammelpostfach/Absender sowie Zahlungsanbieter-Vertrag fehlen noch. PDFs sind keine strukturierte E-Rechnung; eine B2B-Anforderung ist gesondert zu lösen.

Die aktuelle Buchungsvariante ist ausschließlich Selbstabholung ohne weitere Vorauszahlungen. Sie darf nur aktiviert werden, wenn diese beiden Geschäftsregeln ausdrücklich bestätigt sind. Andernfalls bleibt der Anfrageweg aktiv; zusätzliche Kosten werden nicht erfunden.

Private JSON nach `docs/examples/rental-settings.example.json` außerhalb des Repositories anlegen; Dateirechte `0600`. Leere Beispielwerte verhindern absichtlich die Aktivierung. `vatRateBps` ist der bestätigte Prozentsatz mal 100. Alle Artikel dieser ersten Variante verwenden einen gemeinsamen bestätigten Satz; abweichende Artikelsätze benötigen eine Erweiterung vor Freischaltung.

Serverumgebung:

```text
RENTAL_MODE=live
RENTAL_DATA_DIR=/privater/dauerhafter/pfad/mietbestellungen
RENTAL_SETTINGS_FILE=/privater/pfad/rental-settings.json
RENTAL_ADMIN_SECRET=<eigenes zufälliges Geheimnis, mindestens 32 Zeichen>
RENTAL_SESSION_SECRET=<anderes zufälliges Geheimnis, mindestens 32 Zeichen>
SMTP_HOST=<Mailserver>
SMTP_PORT=<Port>
SMTP_SECURE=<true bei direktem TLS, sonst false mit verpflichtendem STARTTLS>
SMTP_USER=<Zugang>
SMTP_PASS=<Geheimnis>
SMTP_FROM=<einzelne freigegebene Absenderadresse>
MOLLIE_API_KEY=<nur bei aktivierter Onlinezahlung>
```

Keine Schlüssel oder echte Kundendaten in Git/Chat. Das aktuelle Adapterangebot ist Mollie; es wurde kein Händlerkonto eröffnet und keine kostenpflichtige Einrichtung vorgenommen. Im Händlerkonto freigeschaltete Zahlungsarten bestimmen die gehostete Zahlungsseite; Apple Pay, Karten oder Bankzahlung werden nicht ohne tatsächliche Anbieterfreischaltung zugesagt. Webhook: `/api/rentals/webhook`. Ein Browser-Rücksprung ist niemals Zahlungsnachweis; der Server fragt den Anbieterstatus und prüft Bestell-ID, Betrag und Währung.

## Versand, Ausfälle und Überwachung

Bestellung/Statuswechsel und je zwei Empfängeraufträge werden zusammen dauerhaft gespeichert. Der Webrequest versucht den Versand; Fehler bleiben in der Marktansicht sichtbar. Ein eigener Server-Job soll mit denselben privaten Umgebungswerten regelmäßig `npm run rental:dispatch` ausführen; dieser lokale Ausbau richtet keinen Server oder Scheduler ein. Nach einem Neustart bleiben Bestellungen und Warteschlange erhalten.

`sent` bedeutet Übergabe an SMTP, keinen Nachweis der Postfachzustellung. Bei SMTP-Abbruch nach möglicher Annahme kann trotz stabiler Message-ID eine doppelte E-Mail nicht vollständig ausgeschlossen werden. Bestellungen, Rechnungsnummern und Zahlungen werden dadurch nicht erneut angelegt. Fehlgeschlagene Jobs haben Backoff; der Wiederholungsbutton verarbeitet fällige Jobs, nicht vorzeitig alle.

Bei unklarem Ergebnis einer Zahlungsanlage wird derselbe Idempotenzschlüssel benutzt. Nach zwölf Stunden stoppt das System weitere Anlageversuche und fordert manuellen Abgleich beim Anbieter; diese Grenze ist keine behauptete Anbieter-Garantie. Niemals unkontrolliert neue Zahlungen erzeugen. Bei ausbleibenden Webhooks kann der Markt den Anbieterstatus ausdrücklich neu abfragen.

Der aktuelle Markt-Zugang ist ein geteilter Betreiberzugang mit sechs Stunden Sitzung. Vor Mehrpersonenbetrieb individuelle Rollen/Audit-Identitäten festlegen. Anmeldung und Änderungen verlangen gleichen Origin, sichere HTTP-only-Cookies und begrenzte Eingaben. Reverse Proxy zusätzlich mit Rate-Limit schützen. Zugriffslogs dürfen persönliche Bestell-Token in URLs nicht speichern; Statusseiten und APIs sind privat/no-store/noindex und senden keinen Referrer.

## Datensicherung und Abnahme

SQLite-Datenbank einschließlich WAL konsistent sichern (SQLite-Backup oder Dienst kurz stoppen); bloßes Kopieren der Hauptdatei während Schreibzugriffen reicht nicht. Private Daten, Einstellungen und Schlüssel getrennt verschlüsselt sichern, Wiederherstellung testen. Keine Testdaten in Live übernehmen. Lösch-/Aufbewahrungsregeln vor Start fachlich festlegen; keine automatische Löschung oder Nummernkreis-Rücksetzung.

Abnahme: Preisgrenzen, NRW-Kalender, doppelte Requests, parallele Annahmen/Bestände, falsche Zahlungsbeträge, alte Webhooks, Mailausfall, Neustart, Rechte/CSRF, Rechnung/Lieferschein auf Desktop/Mobil und alle Belegseiten prüfen. Erst danach echte, ausdrücklich freigegebene Anbieter-/Mailtests durchführen. GitHub und localhost sind kein Live-Nachweis.
