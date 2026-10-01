# Mietbestellprozess – lokale technische Abnahme

Datum: 1. Oktober 2026. Arbeitsstand auf `codex/cinematic-production`, Ausgangscommit `9e6b346035982cda9d20537f4ff9bcb6caceda52`. Ausdrücklicher Betreiberauftrag: vierstufigen Bestell-/Bestätigungs-/Zahlungs-/Belegablauf umsetzen. Keine Veröffentlichung, Kontoeröffnung, realen Zahlungen oder externen Testsendungen vorgenommen.

## Umgesetzt

- Brutto-Einzel-/Positions-/Gesamtsummen aus dem kanonischen Mietkatalog; volle angefangene Dreierblöcke, date-only-NRW-Kalender. Zwölf bepreiste und acht weiterhin unbepreiste Artikel. Gemischte/unbepreiste Warenkörbe bleiben im Anfrageweg.
- Dauerhafte SQLite-Bestellungen, versionierte Zustände, idempotente Wiederholungen, atomare Bestandsprüfung bei ausdrücklicher Marktannahme einschließlich gemeinsam genutzten Mobiliars.
- Geschützte Marktoberfläche: Annahme/Ablehnung, Online-Status/Zahlungslink, tatsächliche Barzahlung, Ausgabe und Rückgabe. Die Annahme wird bei einem anschließenden Zahlungsdienstfehler nicht als ungeschehen angezeigt.
- Online-Zahlung ausschließlich nach Annahme; vorbereiteter Mollie-Adapter mit Anbieterabgleich von Bestell-ID, EUR-Betrag und Status. Lokaler Testadapter ohne externe Transaktion. Keine im Händlerkonto nicht nachgewiesenen Zahlungsarten versprochen.
- Rechnung nach Annahme, Zahlungsstand unter derselben Nummer, Lieferschein erst nach tatsächlicher Ausgabe. Kunden- und Marktversand getrennt dauerhaft verfolgt. SMTP mit TLS, begrenzten Aufträgen und Wiederholungsstatus; SMTP-Annahme ist kein Zustellnachweis.
- Persönliche Bestelllinks und geschützte PDF-Downloads; private/no-store/noindex, kein Referrer, Same-Origin-Schutz, HTTP-only-Sitzungen, begrenzte Bodies. Fehlende Livekonfiguration sperrt den Bestellabschluss.

## Gefundene und behobene Fehler

1. Zeitumstellung und NRW-Feiertage verfälschten Mietdauer: zeitzonenunabhängig ersetzt und in mehreren TZ getestet.
2. Bereits bezahlte Anbieterantwort ohne Checkout-URL wurde abgewiesen: terminale Antworten korrekt verifiziert.
3. Verspätet bezahlter früherer Zahlungsversuch konnte verloren gehen: dauerhafte Zuordnung sämtlicher Anbieter-IDs; kein weiterer Checkout bei bezahlter Bestellung, sichtbarer manueller Abgleich eines zusätzlichen Versuchs.
4. Langfristig unbekannter Anlageausgang: nach zwölf Stunden kein weiterer Anlageversuch ohne manuellen Abgleich; kein unbelegtes Vertrauen in unbegrenzte Anbieter-Idempotenz.
5. Abweichende E-Mail-Prüfungen ließen dauerhaft unversendbare Bestellungen zu: einheitlich vor Speicherung bzw. Freischaltung abgewiesen.
6. Ältere Statusantwort konnte „bezahlt“ überschreiben: monotone Bestellversionen, abgebrochene Anfragen und abgefangene veraltete Fehler.
7. Anbieterfehler nach gespeicherter Annahme ließ Marktansicht veraltet: Status wird auch nach Fehler neu geladen und Vertragsergebnis erklärt.
8. Nicht darstellbare Kundennamen konnten angenommene Aufträge ohne Rechnung erzeugen: echte PDF-Vorprüfung vor Annahme, Nummernvergabe und Zahlung. Namen werden nicht verändert. Fehler erhält Zustand `submitted`.
9. Versand-CLI verwendete Top-Level-Await im CJS-Projekt: asynchronen Einstieg korrigiert und tatsächlich ausgeführt.

## Nachweise

- `npm test`: **60 Suites / 841 Tests bestanden** im abschließenden Lauf; zusätzlich gezielte Rot/Grün-Regressionen für die genannten Fehler.
- `npx tsc --noEmit`: erfolgreich.
- Gesamtes `npm run lint`: **0 Fehler, 20 vorhandene Warnungen** außerhalb des neuen Mietausbaus. Alle neuen/angepassten Mietdateien separat ohne Warnungen geprüft.
- `npm run build`: erfolgreich; 228 statische Seiten plus dynamische Routen. Frühere Warnung über Ganzprojekt-Dateitracing durch die neue Konfigurationsprüfung behoben. PDF-Schriftdateien explizit für Miet-APIs im Tracing enthalten.
- `npm audit --omit=dev`: keine gemeldeten Schwachstellen.
- Lokaler Produktions-Testserver `127.0.0.1:3104`: **2 vollständige Browserabläufe bestanden**, online und bar, einschließlich wirklicher SQLite-Speicherung, Marktaktionen, PDF-Abruf und separater lokal aufgezeichneter Empfänger-Mails. Desktop und 390-px-Mobilansicht ohne horizontalen Überlauf.
- Lokaler Produktionsserver mit deaktivierter Bestellung `127.0.0.1:3105`: **10 Browserprüfungen bestanden** für Anfrage-Fallback, manipulierte Alt-Warenkörbe, Bestand/Mobiliar, Plus/Minus, Mobilbedienung und neue Unterseitennavigation. Vorherige Testtexte an freigegebene Warenkorb-Bezeichnungen und deutsches Datumsformat angepasst; keine Bestandsassertion entfernt.
- `npm run rental:dispatch` mit rein lokaler Testkonfiguration: `sent: 0, failed: 0, pending: 0` nach den vollständigen Testabläufen. Kein externer Versand.
- Lokaler Entwicklungsserver `localhost:3000`: Startseite/Marktseite HTTP 200; Mietseite enthält neue Preisbasis; `/api/rentals/config` bestätigt standardmäßig deaktivierte Bestellungen.
- Synthetische Test-PDFs gerendert und visuell vollständig geprüft: achtseitige Unicode-/Langtextrechnung und einseitiger Lieferschein; Text, Seitenumbrüche, Summen und TEST-Kennzeichnung lesbar. Keine echten Kundendaten. Lokale Testartefakte unter `.superpowers/`, nicht im öffentlichen Git.
- Unabhängige Reviews zwischen den Implementierern: Preis-/UI-, API-/Backend- und Integrations-/Beleggrenzen. Gefundene wesentliche Mängel vor Abschluss repariert.

## Betriebsgrenzen

Der öffentliche Server bleibt **offline/unbestätigt**. Testpostfach und Zahlungssimulation sind keine echten Anbieter-/SMTP-Nachweise. Node ab 22.13 und ein dauerhafter einzelner Host sind Voraussetzung. Echtes Postfach, Anbieterzugang, Aussteller, bestätigter Steuersatz, Nummernkreis, Bedingungen/Datenschutz sowie Regeln zu Kaution/Zusatzkosten fehlen. Keine automatische Stornierung/Erstattung, kein angebundener Kassenbestand, keine strukturierte B2B-E-Rechnung und keine behauptete rechtliche Gesamtabnahme.

Die vorhandenen 32 geänderten Audit-Screenshots und zwei September-Contentberichte gehören nicht zu diesem Ausbau; sie bleiben unverändert und werden nicht in diesen Commit aufgenommen. Canva/Instagram und redaktionelle Inhalte wurden in diesem Auftrag nicht verändert. Einrichtung und offener Betriebsbedarf: [RENTAL-ORDER-RUNBOOK.md](../RENTAL-ORDER-RUNBOOK.md).
