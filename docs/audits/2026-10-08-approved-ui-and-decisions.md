# Betreiberantworten und begrenzte UI-Änderungen

Datum: 8. Oktober 2026. Ausgangs-HEAD `c790831e304c98f63d949605b506e468de035764`, vor diesem Auftrag laufender App-Release `b0812f7592046b5fcc846ef166b08e710f4e0311` auf dem bestätigten Hetzner-Host. Branch/Remote zu Beginn synchronisiert. Fremde alte Screenshots und lokale Content-Laufberichte bleiben unangetastet.

## Auftrag und Grenzen

Der Betreiber hat A2 mit drei begrenzten Änderungen bestätigt: direkte Social-Links als Icons, orange gemeinsame NL-Hinweisleiste ohne Änderung an Logo/Hauptnavigation und verständliche Mengenfehler statt öffentlicher Bestandslistenangaben. Alle anderen Antworten stehen in [DECISIONS-2026-10-08.md](../DECISIONS-2026-10-08.md).

- Newsletter-Absender `info@trinkgut-jammers.de`, Postfach laut Betreiber vorhanden. Empfangs-MX zeigt IONOS; keine behauptete SMTP-/Newsletter-Versandprüfung.
- Bewerbungen/Unterlagen an `jammers-goch@trinkgut.de`. Nach dem App-Quellcommit hat der Betreiber alle Postfachberechtigten bestätigt und erlaubt, die bereitgelegten Anzeigen direkt auf dem Desktop zu lesen. Beide gefunden und visuell geprüft: Verkauf (m/w/d) Vollzeit sowie Teilzeit bis zu 150 Stunden/Monat. Belege/Inhaltsvorbereitung separat gespeichert; keine Rohbildveröffentlichung und keine Aktivierung des Bewerbungsdienstes.
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

## Bereitstellung und öffentliche Abnahme

- App-Commit `d93f932c69a097026624a56365bd58f2dba024a7` auf GitHub gesichert; nur eigene geprüfte Dateien. Positiv gefiltertes Git-Archiv, keine schmutzige Worktreekopie, keine privaten Rohordner/Umgebungen. SHA-256 lokal und auf dem Zielhost: `b83a00ae1b903c309467973f8ae12ff73a6ac8881020038e1eca06aebfe0978d`.
- Neuer separater Linux-Release unter `/srv/trinkgut-jammers/releases/d93f932c69a097026624a56365bd58f2dba024a7`, Node 22.23.3. `npm ci`, 77 Testdateien / 1.276 Tests, ESLint, TypeScript, 128 Original-Angebotsbilder, Quell-/Derivatprüfungen und Build mit 120 Seiten bestanden. Kein Build im laufenden Verzeichnis.
- Paketmanager meldet unverändert fünf hohe Befunde bei Entwicklungsabhängigkeiten. Separates `npm audit --omit=dev --json` lokal: null gemeldete Produktionsbefunde. Kein `audit fix --force`, keine unangekündigte Paketänderung und keine Sicherheitsgarantie daraus abgeleitet.
- Release root-eigen, nur `.next/cache` schreibbar für `jammers`; vorhandene Service-Datei binär identisch, `systemd-analyze verify` erfolgreich. Kein DNS-/Caddy-/Mail-/Firewallumbau.
- Atomare Umschaltung am **08.10.2026 um 16:39:04 UTC / 18:39:04 Europe/Berlin**. Dienst aktiv; Bereitschaftsprobe nach erwarteter kurzer Startphase erfolgreich. Vorheriger unveränderter Release `b0812f7592046b5fcc846ef166b08e710f4e0311` bleibt für Rollback erhalten.
- Öffentliche Mietkonfiguration: `enabled:false`, `testMode:false`, `onlinePayment:false`. HTTPS IPv4 und IPv6 jeweils 200. `www` 301 mit Pfad/Query, HTTP 308 auf HTTPS bestätigt.
- Echter öffentlicher Browser: Desktop-Icon sichtbar, mobiles Header-Icon korrekt verborgen, Menü funktionsfähig; NL-Link erreicht die passende Landingpage. Kontakt-Icon 44×44 Pixel. Mengenüberschreitung bleibt unverändert bei 0 und meldet die verständliche Fehlermeldung; keine öffentliche Auswahl in den Warenkorb gelegt und nichts abgesendet. Temporäre Browsergrößen zurückgesetzt.
- [Desktopnachweis](../../audit/screenshots/approved-ui-2026-10-08/home-live-desktop.png), [Mobilnachweis](../../audit/screenshots/approved-ui-2026-10-08/home-live-mobile.png), [Mengenfehler mobil](../../audit/screenshots/approved-ui-2026-10-08/rental-quantity-error-live-mobile.png).

Öffentlicher Gesamt-HTTP-Lauf: **117 Seiten, 2.821 lokale Ressourcen, 26 API-Verträge, fünf unbekannte Routen** geprüft. Zehn Fehler, alle unverändert Varianten des externen DE-Cover-404; null zusätzliche Warnungen oder neue Fehlerklassen. Evidenz lokal `/tmp/jammers-approved-ui-live-http-audit.json`. Nicht als vollständig bestandenen Gesamt-Audit ausgeben.

Erneuter `content:check` um 16:39 UTC: NL aktiv und geprüft; DE-PDF und DE-Cover extern nicht erreichbar. Gesamtstatus `failed`, `websiteVerified=false`, `deploymentVerified=false`; das bezieht sich auf die vollständige Werbeprüfung und hebt den separaten UI-/HTTPS-Nachweis nicht auf. Der lokale Rohbericht mit internen Canva-Metadaten bleibt unversioniert. Behebung durch den gesonderten Wochenpaket-Auftrag, nicht durch dieses UI-Release.

Die anschließend aktualisierten Entscheidungen, Quellenbelege, Statusdokumente und Screenshots werden als eigener Dokumentationscommit gesichert. Dieser ändert die veröffentlichte App-Version nicht. Newsletter, Bewerbungsupload, automatische E-Mails/Zahlungen bleiben deaktiviert; es erfolgten keine echten Sendungen oder Löschungen vorhandener Daten.
