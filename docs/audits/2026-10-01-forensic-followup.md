# Forensische Folgeprüfung – lokaler Abschlussbericht

Beginn: 1. Oktober 2026, 09:32 Europe/Berlin. Ausgangsstand `de6f1c1`. Lokaler Prüfpass am selben Vormittag abgeschlossen. **Technische Reparaturen geprüft; keine Live- oder Rechtsfreigabe.** Die bekannten Quellen-/Betriebsgrenzen unten bleiben offen.

## Gesicherter Ausgangszustand

- Freigegebene lokale Worktree und Remote-Branch synchronisiert; Server weiterhin nicht öffentlich online.
- 32 bereits geänderte Audit-Screenshots und zwei fremde Content-Prüfberichte werden nicht übernommen oder überschrieben.
- Mietablauf lokal implementiert; regulärer Bestellbetrieb deaktiviert. Vorheriger Nachweis: 841 Unit-Tests, Build und ausgewählte Browserabläufe bestanden (siehe separaten Mietbestellungsbericht). Das ersetzt nicht diese breitere Prüfung.
- Bekannte Inhaltslücke: bestätigtes NL-Original KW40 fehlt. Offizieller DE-Handzettel gilt bis 02.10.2026; keine Verlängerung bis Samstag.
- Zeitlich begrenzter stündlicher Folgeauftrag im selben Chat eingerichtet, Ende spätestens 01.10.2026 um 19:32 Europe/Berlin. Bestehende Werbeautomationen unverändert.

## Geprüfte Bereiche

- Backend-Sicherheit, Statuswechsel, Zahlungen, Bestandskonkurrenz, Versand und Belege.
- Öffentliche Routen, mobile Navigation, visuelle und barrierearme Bedienung.
- Content-Prüfprozess, Canva-Lese-/Originalzugang und Wochenwerbung.
- Checkout-Wiederholung und Fehlerfälle, Gesamtintegration und Veröffentlichungsgrenzen.

## Reproduzierte und reparierte Fehler

1. **Doppelbestellung nach verlorener Antwort und Neuladen:** Der Browser speicherte den Wiederholungsschlüssel nur im Arbeitsspeicher der Komponente. Ein echter lokaler Browsertest speicherte eine Bestellung, unterbrach lediglich die Antwort und erhielt nach Neuladen eine zweite Bestell-ID. Technische Schlüssel plus SHA-256-Fingerabdrücke überleben jetzt im Sitzungsspeicher desselben Tabs; Klartext-Kontaktdaten werden dafür nicht abgelegt. Identische Angaben liefern dieselbe Bestellung. Maximal zehn offene Varianten; gesperrter/defekter Speicher führt zum sicheren Abbruch. Geänderte Angaben oder geschlossene/geleerte Tabs sind ausdrücklich nicht dieselbe Wiederholung.
2. **Vergangener Abholtermin:** Eine früher eingegangene Anfrage konnte noch nach ihrem Abholtag angenommen werden. Die Annahme prüft den aktuellen Berliner Kalendertag innerhalb der Transaktion erneut, auch wenn die PDF-Prüfung über Mitternacht läuft. Kein Vertrag, keine Nummer oder Zahlung bei diesem Fehler.
3. **Veralteter Zahlungslink:** Während asynchroner PDF-Erstellung konnte eine Zahlung bezahlt oder ersetzt werden. Vor Übergabe an den Mailtransport wird der Zahlungsstand erneut geprüft; gegebenenfalls wird die Nachricht neu vorbereitet.
4. **Doppelversand durch abgelaufene Bearbeitung:** Ein langsamer Renderer konnte nach Übernahme seines Versandauftrags durch einen anderen Prozess noch senden. Gültigkeit und Besitzer der Bearbeitung werden unmittelbar vor dem Transport geprüft. Das ist keine Garantie gegen doppelte E-Mails nach unklarem SMTP-Ausgang.
5. **Falsche Aktivierungsbereitschaft:** Ungültige SMTP-Hostnamen/Zugangsdaten, zu lange Adressen und fehlerhafte Provider-Schlüssel wurden teils erst beim Transport abgewiesen. Die Konfigurationsfreigabe prüft diese Grenzen jetzt vorher und bleibt gesperrt.
6. **Öffentliche Bedienung:** Mobiles Menü setzt bei Escape den Fokus auf den sichtbaren Auslöser zurück. Sortimentfilter passen bei 320 Pixeln. Partyplaner-/Leergut-/Öko-Eingaben haben programmatische Namen. Kontraste auf Hilfsseiten und erkennbare Breadcrumb-Links verbessert.
7. **Prüfwerkzeuge:** Ein alter Header-Test wertete die legitime Beschriftung „Warenkorb öffnen“ fälschlich als Alt-Header. Er prüft jetzt den eindeutigen alten Komponentenmarker. Neue Screenshots lassen sich getrennt ausgeben; ignorierte lokale Prüfskripte werden nicht als Anwendungscode gelintet. Der HTTP-Audit prüft zusätzlich 13 Miet-/Markt-API-Verträge ohne Anmeldung, Origin, gültige Bestell-/Zahlungs-ID oder Nutzlast; keine gültige Bestellung oder Zahlung entsteht.
8. **Datenschutzhinweis im Mietmodus:** Seitenüberschrift steht nun vor dem Zusatzabschnitt. Tatsächlicher technischer Wiederholungsspeicher ist beschrieben; keine rechtliche Freigabe daraus abgeleitet.
9. **Datenbankinitialisierung vor Abweisung:** Geschützte Handler konnten bereits SQLite-Dateien anlegen, bevor ein unbefugter Zugriff, fehlender Origin oder fehlerhafter Webhook abgewiesen wurde. Konfiguration und Zulässigkeit werden jetzt zuerst geprüft. Die erneute Prüfung gegen die tatsächlich geladene Laufzeitkonfiguration bleibt erhalten, auch bei Schlüsselwechsel während des Lesens einer Anfrage. 14 reproduzierte Ablehnungsfälle lösen jetzt keine Datenbankinitialisierung aus.
10. **Überschriften und Marktverwaltung:** Acht Seiten hatten Sprünge von h1 auf h3; die semantische Reihenfolge ist korrigiert, ohne die berechnete Typografie/Farbe/Abstände der geprüften Überschriften zu verändern. Die Bestellverwaltung hatte eine unzulässige ARIA-Beschriftung und eine bei 320 Pixeln abgeschnittene Überschrift. Beides ist repariert und für Anmeldung, leere Liste und abgeschlossene Bestellung geprüft.
11. **Gefüllter Merkzettel und Finder-Zustände:** Auch gespeicherte Artikel im Merkzettel haben nun die passende zweite Überschriftenebene. Im Finder fehlte die Seitenüberschrift nach Abschluss, und Tastaturfokus fiel beim Fragenwechsel auf den Seitenkörper zurück. Ergebnisansicht und Fokusführung sind korrigiert, ohne beim ersten Seitenaufruf Fokus zu stehlen. Drei vollständige Finder-Flows bei 320/1440 Pixeln, Rücksetzen, Tastaturwechsel und leeres Ergebnis werden im Browser geprüft. Der alte Merkzetteltest musste an die jetzt korrekte Überschriftenebene angepasst werden; davor beobachtete Testfehler sind nicht verschwiegen.
12. **Falsche Finder-Empfehlungen:** Rotwein/trocken ergab Sekt, Wasser ergab Softdrinks, „Alt“ traf den Markennamen „Altenmünster“. Drei gezielte Browserfälle und 38 zunächst fehlgeschlagene Unit-Fälle reproduzierten die Probleme. Eine getrennt prüfbare Filterfunktion verlangt jetzt passende Produktgruppen und explizite Merkmale im bereinigten Produktnamen; Wortgrenzen und eindeutige Varianten verhindern die belegten Fehlzuordnungen. Kein Rückfall auf den breiteren Pool bei fehlenden Treffern. Mehrweg beweist kein Glas, Einweg kein PET; fehlender Alkoholhinweis beweist kein klassisches Bier. Historische Werbetexte und Preise wurden nicht wieder eingeführt. 54 gezielte Unit-Fälle prüfen positive und negative Beispiele einschließlich Dezimalangaben beim Alkoholgehalt. Für mehrere Wein-/Wasserkombinationen fehlen konkrete Merkmale: Diese zeigen ehrlich den vorhandenen Beratungs-Hinweis statt unpassender Produkte; der Einleitungstext verspricht kein garantiertes perfektes Getränk mehr.

Alle technischen Reparaturen wurden mit reproduzierten Fehlfällen beziehungsweise fehlgeschlagenen Regressionstests belegt. Unabhängige Delta-Reviews der Backend-, Checkout- und Finder-Änderungen ergaben keine weiteren P1/P2-Befunde im geprüften Umfang. Im unveränderten realen Katalog wurden alle 33 harten Finder-Kombinationen gegengeprüft; fehlende Merkmale bleiben ausdrücklich keine behauptete Produkteigenschaft.

## Abschließende Verifikation

- Frischer Produktionsbuild: erfolgreich, 228 statisch generierte Seiten plus dynamische Routen.
- TypeScript: erfolgreich. ESLint: keine Fehler, 20 bestehende Warnungen. `npm audit` einschließlich Entwicklungsabhängigkeiten: keine gemeldeten Schwachstellen.
- Letzter vollständiger Unit-Lauf nach dem eingefrorenen Code: **63 Dateien / 943 Tests bestanden**. Ein weiterer separat ausgeführter Gesamtlauf bestätigte dieselbe Anzahl.
- Vollständiger Browserlauf auf frischem Produktionsbuild: **131 bestanden**, drei ausschließlich lokale Miettests bewusst übersprungen. Diese drei separat auf einem neuen isolierten lokalen Testserver ebenfalls bestanden: bar, online simuliert, Antwortverlust/Neuladen. Inklusive Bestätigung, Zahlung, Übergabe, Belegen, beiden Mail-Empfängern und bereinigtem Browser-Wiederholungsspeicher; ausschließlich synthetische Daten/erfasste Testmails.
- HTTP-Audit am echten Datum: 224 Seiten, 407 lokale Ressourcen, fünf unbekannte Routen und jetzt 26 API-Verträge geprüft, keine Fehler oder Warnungen. Externe Links werden dabei nicht abgerufen.
- Eigenständiger Browser-Querschnitt: 32 öffentliche Routen bei 320 und 1440 Pixeln (64 Fälle); keine JavaScript-/Konsolenfehler und keine kaputten sichtbaren Bilder. Konkrete Barrierefreiheitsmängel wurden anschließend behoben und mit 16 öffentlichen, sechs Marktverwaltungs- und elf Finder-Browsertests gegengeprüft. Das ist keine vollständige WCAG-Abnahme aller Zustände.
- Bestehende lokale Browserbudgets für Layoutstabilität, Reaktion und Ressourcenübertragung bestanden; keine Feldmessung auf echten Mobilgeräten oder dem zukünftigen Host. Veränderte Routen auf `localhost:3000` erneut erreichbar, Finder-Text im HTML bestätigt. Reguläre Mietkonfiguration weiterhin `enabled: false`, `testMode: false`, `onlinePayment: false`.
- Die historische Juli-Testausgabe meldet im vollständigen E2E-Lauf externe Cover-403 und Next-404-Diagnostik. Das ist getrennt von der aktuellen, lokal geprüften KW40-Werbung; nicht als aktueller Veröffentlichungsausfall ausgegeben.
- Zusätzlicher Lighthouse-Mobilversuch auf der lokalen Produktionsvorschau: zweimal wegen `NO_FCP` ohne verwertbare Messung beendet, auch mit deaktivierter Chrome-Hintergrunddrosselung. Daher **kein belastbarer Lighthouse-/Core-Web-Vitals-Score** aus diesem Lauf. Die unabhängigen normalen Chromium-Seitenaufrufe und Screenshots funktionieren; aus dem Messabbruch weder einen gelungenen Performance-Nachweis noch einen bestätigten öffentlichen Ausfall ableiten. Rohberichte lokal unter `.superpowers/forensic-20261001/lighthouse-home-mobile*.json`. Feldmessung auf dem späteren Zielhost bleibt offen.

Letzte vollständige Browsernachweise liegen getrennt unter `.superpowers/forensic-20261001/full-suite-frozen` und `full-suite-frozen-results`; Mietnachweise unter `rental-frozen`. Der versionierte aktuelle HTTP-Nachweis ist `audit/evidence/2026-10-01-forensic-http.json`. Frühere rote Tests und Zwischenstände werden nicht als erfolgreiche Endabnahme umgedeutet.

## Inhalte und Verbindung

Canva-Lesefunktion und authentifizierte PDF-Exportbedienung waren verfügbar. Es wurde genau eine gezielte Suche und ein Abgleich der konfigurierten Sammlung vorgenommen, keine weitere Vollsichtung behauptet. Der benötigte NL-KW40-Einseiter bleibt unauffindbar; die gefundene Seite vom 05.–10.10.2026 ist KW41 und wurde nicht als Ersatz verwendet oder importiert. Kein Design, Instagram-Inhalt oder Konto wurde verändert.

`content:check` bleibt deshalb **berechtigt rot** (`nl-flyer-missing`). Gültige DE-Werbung bleibt sichtbar und endet am gedruckten 02.10.2026. 17 Cinematic- und 15 geprüfte Canva-Marktdateien bestehen ihre Integritätsprüfungen. `publicUrl: null`, `deploymentVerified: false`.

Neue Inhaltsnachweise: `audit/content-runs/2026-10-01T07-38-44-507Z-check-71895100.json` und `2026-10-01T07-45-50-456Z-check-9ff67b69.json`. Vertiefte lokale Arbeitsnachweise und Screenshots liegen in `.superpowers/forensic-*`; keine privaten Canva-Originale in Git übernehmen.

## Grenzen / verbleibende Entscheidungen

### Konkrete rechtliche Freigabehürden

Rechtsquellen am 01.10.2026 ergänzend geprüft; dies ist eine technische Lückenprüfung, keine individuelle Rechtsberatung oder Freigabe:

- Der bestehende Bestellbutton benennt die Zahlungspflicht. Alle erforderlichen Vertragsinformationen unmittelbar vor Bestellung müssen dennoch anhand des tatsächlich angebotenen Mietvertrags fachlich geprüft werden. Ein bestandener UI-Test reicht dafür nicht. [§ 312j BGB](https://www.gesetze-im-internet.de/bgb/__312j.html).
- Eine elektronische Widerrufsfunktion mit Bestätigung und dauerhafter Eingangsbestätigung ist im aktuellen Mietausbau **noch nicht implementiert**. Die gesetzliche Regelung und ihre Anwendbarkeit auf das konkrete Angebot müssen vor einem Verbraucher-Livestart abgearbeitet werden; keine Ausnahme aufgrund eines festen Miettermins unterstellen. Fehlende Funktion gegebenenfalls anschließend implementieren, nicht durch einen AGB-Satz ersetzen. [§ 356a BGB](https://www.gesetze-im-internet.de/bgb/__356a.html).
- Das erzeugte einfache PDF ist keine strukturierte E-Rechnung. B2B-/B2C-Kundengruppen, Übergangsregelungen und die Zustimmung zum elektronischen PDF-Format müssen mit dem Rechnungswesen geklärt werden. Das BMF nennt eine allgemeine Übergangsfrist für die Ausstellung bis Ende 2026; daraus folgt keine pauschale Dauerfreigabe dieses PDF-Prozesses. [BMF: E-Rechnungs-FAQ, insbesondere Fragen 2, 4 und 11](https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html).

Kein öffentlicher Server, kein realer Zahlungs-/Mailtest, keine pauschale Rechtskonformitäts- oder WCAG-Zertifizierung. Betreiber-/Registerdaten, Steuersatz, Postfach, Anbieter, Gebühren/Kaution, Vertrags-/Widerrufsinformationen, Aufbewahrung und Rechnungswesen bleiben gemäß `OFFENE-FRAGEN.md` abzustimmen. PDF ist keine strukturierte E-Rechnung. SQLite benötigt einen dauerhaften einzelnen Host samt getesteter Sicherung/Wiederherstellung; Provider-Abgleich, Proxy-Schutz und Token-Logbereinigung sind vor Livebetrieb zu prüfen.

Offene Originalfotos/Cover und Personenfreigaben bleiben offen; keine erfundenen Ersatzbilder oder Gesichtszuordnung. Die neue zeitlich begrenzte Folgeprüfung darf bei unverändertem Befund still bleiben und keine künstlichen Änderungen erzeugen. Die regulären Wochen-/Tagesaufgaben bleiben bestehen.

## Sicherung und Übergabe

Reparaturcommit `7237236bc7bf9a396b7881bf97ec58414cea2853` enthält ausschließlich die 47 eigenen geprüften Code-/Test-/Berichtsdateien. Push erfolgreich; lokaler Hash und die direkt abgefragte GitHub-Branchreferenz `codex/cinematic-production` stimmen überein. Die 32 zuvor geänderten Screenshots und zwei vorbestehenden unversionierten Berichte sind weiterhin separat vorhanden, nicht mitcommittet. Dieser Abschlussnachweis wird als anschließender Dokumentationscommit gesichert.

Eigene isolierte Testserver beendet; die bestehende Entwicklungsvorschau auf `http://localhost:3000/` bleibt erreichbar und Bestellungen bleiben dort deaktiviert. Keine öffentliche Bereitstellung, echte Mail oder Zahlung erfolgt. Die begrenzten Folgeprüfungen gelten bis 19:32 Europe/Berlin; Mac und App müssen dafür weiterlaufen. Bei unverändertem Zustand keine wiederholte Meldung oder künstliche Arbeit.
