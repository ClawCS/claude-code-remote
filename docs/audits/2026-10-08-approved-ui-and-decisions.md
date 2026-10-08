# Betreiberantworten und begrenzte UI-Änderungen

Datum: 8. Oktober 2026. Ausgangs-HEAD `c790831e304c98f63d949605b506e468de035764`, vor diesem Auftrag laufender App-Release `b0812f7592046b5fcc846ef166b08e710f4e0311` auf dem bestätigten Hetzner-Host. Branch/Remote zu Beginn synchronisiert. Fremde alte Screenshots und lokale Content-Laufberichte bleiben unangetastet.

## Auftrag und Grenzen

Der Betreiber hat A2 mit drei begrenzten Änderungen bestätigt: direkte Social-Links als Icons, orange gemeinsame NL-Hinweisleiste ohne Änderung an Logo/Hauptnavigation und verständliche Mengenfehler statt öffentlicher Bestandslistenangaben. Alle anderen Antworten stehen in [DECISIONS-2026-10-08.md](../DECISIONS-2026-10-08.md).

- Newsletter-Absender `info@trinkgut-jammers.de`, Postfach laut Betreiber vorhanden. Empfangs-MX zeigt IONOS; keine behauptete SMTP-/Newsletter-Versandprüfung.
- Bewerbungen/Unterlagen an `jammers-goch@trinkgut.de`. Zwei Stellenanzeigen sind benannt, als Anhänge aber noch nicht verfügbar. Empfängerkreis offen.
- Datenschutz-/Löschkonzept eigenständig als [Entwurf](../privacy/2026-10-08-datenschutz-loeschkonzept-entwurf.md) vorbereitet, nicht als öffentliche Datenschutzerklärung aktiviert. Keine Altbestandslöschung, Registrierung oder echte Mail.
- Reguläre Mieten bleiben je angefangenen Dreierblöcken. Die neu bestätigte anteilige Staffel betrifft ausdrücklich nur verspätete Rückgaben. Dokumentiert, keine automatische Nachberechnung eingebaut.
- Zahlung bei Abholung, keine Kaution, ausschließlich Selbstabholung; Abholzeit 09–19 Uhr. Reservierungen bleiben in der manuell geführten Markt-Mietdatei. WWS/Onlinezahlung/Rechnungsversand zurückgestellt.
- Der Wochenpaket-Ablauf (A1) wurde verständlich erklärt, in diesem UI-Release aber nicht umgesetzt. Bekannte externe DE-Handzettel-404 bleiben offen; keine fehlerfreie Gesamtwebsite behaupten.

## Änderungen

- Gemeinsame lokale SVG-Komponente `SocialLink`: beschriftete WhatsApp-/Instagram-Icons, 44-Pixel-Mindestziel, Tastaturfokus, unveränderte Links und sichere externe Linkattribute. Inhaltlich notwendige Originalbeitrags-/Teilnahme- und Versandtexte bleiben erhalten.
- NL-Leiste warm orange; dunkle Schrift/Pfeil. Logo, Navigation und übrige Gestaltung bleiben bestehen.
- Öffentliche Bestandsformulierungen, Bestandsdatum und Bestandszahlen entfernt. Physische Limits, kumulierte Warenkorbmengen und Zeitraum-/Möbelkonflikte bleiben wirksam. Unzulässige Mengen zeigen unmittelbar „Diese Menge ist nicht verfügbar. Bitte reduziere die Menge.“
- Mengenreduktion nach neu entstandener Datumsüberschneidung bleibt schrittweise möglich, während Fehler und Hinzufügen-Sperre bestehen. Persönliche Terminbestätigung bleibt erforderlich; die Website hat keine Verbindung zur Mietdatei.
- Cart-/Anfragetexte an die bestätigte Zahlung bei Abholung angepasst; Checkout bleibt Anfrage, keine Aktivierung des Bestellsystems. Drei zusätzliche SSR-Regressionsfälle zuerst fehlgeschlagen, danach bestanden.

## Prüfung vor Bereitstellung

- Regressionen für Social-Links und entfernte Bestandsangaben zunächst fehlgeschlagen, nach Änderungen bestanden.
- Finaler lokaler kombinierter Lauf nach allen Text-/Mobilkorrekturen: 77 Testdateien / 1.276 Tests erfolgreich; ESLint ohne Fehler, Route-Typegenerierung/TypeScript und alle 128 Original-Angebotsbilder erfolgreich geprüft. Das abschließende unabhängige Review fand keine verbleibenden Blocker.
- Unabhängiges Review fand zwei wichtige Randfälle: fehlende direkte Social-Links auf vier Unterseiten sowie blockierte Minus-Korrektur nach Datumswechsel. Beide korrigiert und erneut unabhängig geprüft; keine Review-Blocker verblieben. Interne `max`-Grenzen sind weiterhin gewöhnliche Formvalidierung, keine sichtbare Bestandsanzeige.
- Echter Browser lokal: Menge 3 → Plus/999 zurückgewiesen mit Meldung, Minus auf 2; Warenkorblimit mit 3 Kühlanhängern, Positionssumme 450 €, Reduktion auf 2 = 300 €; Konflikt 12.–14.10. gegen 14.–17.10., Minus-Korrektur 3→2→1→0 mit aktiver Fehlermeldung bis zur gültigen Auswahl bestätigt. Nur synthetische lokale Mietauswahl; danach über UI entfernt. Keine Anfrage abgesendet.
- Datumsfelder im In-App-Browser über die native Datumsschnittstelle bedient; generisches `fill` setzte hier keinen Wert. Daraus keinen Anwendungsfehler abgeleitet.
- Mobiler Sichttest 390×844 fand eine CSS-Überlagerung von Header-Icon und Menüknopf. Kaskade durch stärkeren Header-Selektor korrigiert: echtes Mobilbild ohne Überlagerung, Menü öffnet, NL-Link führt zu `/nl`; bei 1440×900 ist der Header-Iconlink sichtbar und das mobile Menü verborgen. Kontakt-Icons gemessen mit 44×44 Pixeln. Erweiterung anschließend unabhängig ohne neue Blocker geprüft.
- E2E-Dateien aktualisiert/listbar; keine Behauptung eines Playwright-CLI-Browserlaufs. Interaktionen wurden über den erlaubten echten In-App-Browser geprüft.

## Bereitstellung

Noch ausstehend bei Erstellung dieses Berichts: finaler kombinierter Testlauf, frischer Linux-Build des eigenen geprüften Commits, versionierter Release, öffentliche HTTP-/Mobilprüfung und Screenshotnachweis. Git-Push allein ist kein Live-Nachweis. `RENTAL_MODE=disabled` bleibt zwingend; DNS, Caddy, Mailkonfiguration und andere Server werden nicht geändert.
