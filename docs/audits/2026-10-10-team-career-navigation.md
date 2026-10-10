# Team & Karriere – Navigation, 10.10.2026

## Auftrag und Umfang

Der bisherige Hauptreiter „Team“ wird im vorhandenen Navigationsplatz zu „Team & Karriere“. Zwei getrennte Unterpunkte führen zu „Unser Team“ (`/galerie`) und „Offene Stellen & Bewerbung“ (`/bewerbung`). Die drei bereits vorhandenen Stellenplakate stehen auf der Zielseite vor dem Bewerbungskontakt. Keine zusätzlichen Hauptreiter, keine Neugestaltung und keine neuen Arbeitgeberversprechen.

Desktop verwendet das bestehende per Tastatur bedienbare Aufklappmenü. Mobil stehen beide Unterpunkte direkt in der Menügruppe. Wegen der längeren Gruppenbezeichnung beginnt die horizontale Desktopnavigation bei 72rem / 1152px statt bei 64rem; darunter bleibt das bestehende mobile Menü. Der interne Datenmarker des wiederverwendeten Aufklappmenüs heißt nun neutral `data-navigation-disclosure`.

## Prüfungen

- Test-first: neuer Karriere-Navigationstest scheiterte vor der Implementierung am fehlenden Reiter; nach der Änderung alle neun gezielten Tests bestanden (360, 390, 768, 1024, 1151, 1152, 1280, 1440px und Tastatur-/Axe-Prüfung).
- Geprüft: neun Hauptgruppen bleiben erhalten; beide Unterpunkte sichtbar und korrekt verlinkt; drei Stellenanzeigen auf `/bewerbung`; Menüschließen nach Navigation, Escape/Fokusrückgabe, Wechsel zwischen beiden Aufklappmenüs und keine horizontale Überlappung.
- Bestehende Navigationstests an neue Gruppenstruktur und 1152px-Grenze angepasst. Veraltete Adress-Testwerte auf die schon bestätigte und unverändert ausgegebene „Jurgensstraße 20“ berichtigt.
- Ein älterer Tastaturtest bediente native `details` vor Abschluss der lokalen React-Hydrierung. Diagnose: vor Escape fehlten die clientseitigen Menü-Handler; nach dem vorhandenen Hydrierungssignal des Handzettel-Buttons schließt Escape korrekt und ohne Browserfehler. Der Test wartet auf dieses echte Anwendungssignal; kein pauschaler Sleep und keine Produktionsänderung dafür. Dieser bestehende Wochencontent-Test setzt eine aktive Handzettelausgabe voraus.
- Unabhängige statische Gegenprüfung ohne Produktionsbefund. Release-Skript separat geprüft; zusätzlich Schutz gegen irrtümliche Wiederverwendung der aktuellen Release-ID vor Dateirechteänderungen.
- Lokaler Lint und TypeScript ohne Befund. Vollständiger lokaler Projekttest mit den erforderlichen QPDF-/Poppler-Testpfaden und zwei Workern: **141 Dateien / 3.135 Tests bestanden** (268 Sekunden). Keine echten Postfachaktionen. Veröffentlichung wird unten nach Abschluss dokumentiert.
- Zusätzlicher Browserlauf zeigte zeitweise HTTP 500 auf `/produkte`. Der gespeicherte Antwortkörper belegt einen lokalen Webpack-Entwicklungsserverfehler (`__webpack_modules__[moduleId] is not a function`), kein Fehler des neuen Navigationsdatenmodells. Frische Direktabfrage lieferte 200. Nur der eigene lokale Entwicklungsserver wurde kontrolliert neu gestartet; keine Produktionskonfiguration geändert. Der nachfolgende isolierte Browserlauf wird vor Releaseabschluss ausgewertet.

## Abgrenzung vorhandener Alt-Tests

Der zusätzliche gesamte `relaunch-integrity`-Lauf fand drei nicht durch diesen Umbau verursachte Testannahmen: ein nicht eindeutiger niederländischer Folder-Button, ein erwartetes historisches Einzelprodukt in der Sitemap und die frühere Überschrift „Alle Produkte“. Diese Alt-Verträge werden hier nicht zur Änderung des aktuellen Wochenangebotsmodells benutzt. Alle elf responsiven Grenzbreitentests sowie beide zusätzlichen Social-Header-Tests bestanden.

## Betriebsgrenze

Bewerbung weiterhin ausschließlich per E-Mail an `info@trinkgut-jammers.de`; Uploadkonfiguration bleibt `enabled:false`, `mode:disabled`. Keine E-Mails, Bewerbungen, Zahlungen oder Löschungen ausgelöst. Keine AppArmor-, Caddy-, Firewall-, Mail- oder Unitkonfiguration verändert. Veröffentlichung ausschließlich als neuer geprüfter Linux-Webrelease; Rückrollziel ist `e5cc5bd750ec70523dcad3b7639fb98b2ed53bde`.

Private Laufprotokolle und Screenshots: `.superpowers/team-career-nav-2026-10-10/`. Fremde Screenshots und der fremde Zwischenbericht zum Bewerbungsupload bleiben unangetastet.

## Veröffentlichung

- App-Commit `dc23203493a1c71cad5a4719dc588ca0a86f2fa0`, lokal und auf `origin/codex/cinematic-production` gespeichert.
- Linux: 93 Dateien / 1.556 Webtests, Lint, TypeScript, 128 Originalangebote und Produktionsbuild bestanden. Quellarchiv SHA-256 `dc75afbe9d8f7d67bbf909af9d8722308e26b501443041d15b67f8a61c845fbe`.
- Private Linux-Vorschau vor Umschaltung: 18 Browserfälle sofort bestanden; der zusätzlich lange Mehrseiten-Test lief zunächst in sein Zeitlimit bei einem ausstehenden optimierten Bild. Bild separat erfolgreich geladen, temporäre Vorschau neu gestartet und Mehrseiten-Test mit ausreichendem Gesamtzeitbudget bestanden (16,7 Sekunden). Ein weiterer zwischenzeitlicher Wiederholungsversuch endete am vorgesehenen Ablauf der temporären 180-Sekunden-Vorschau. Keine Funktionsassertion abgeschwächt, keine Produktionslogik dafür verändert.
- Atomarer Wechsel am **10.10.2026, 12:48:20 UTC / 14:48:20 Europe/Berlin**. Nur bestehende Next-Unit neu gestartet; Caddy- und Unitdatei-Prüfsummen unverändert. Frühere Release-ID bleibt Rückrollziel.
- Öffentliche Karriere-Regression: **9/9 bestanden**, einschließlich acht Breiten von 360 bis 1440px, Tastatur, Axe, beiden Zielseiten und drei Stellenplakaten. Manuell über den veröffentlichten Menüpunkt auf die Bewerbungsseite gewechselt; Screenshot gespeichert.
- Öffentliche Contentprüfung um 12:48:55 UTC: `status:ok`, `websiteVerified:true`, `deploymentVerified:true`, keine Fehler oder Warnungen. Wochenpakete unverändert.
- Abschließende öffentliche HTTP-Prüfung: **117 Seiten, 2.969 lokale Ressourcen, fünf unbekannte Routen und 31 API-Verträge**, null Fehler und null Warnungen. Externe Drittlinks wurden dabei nicht erneut abgerufen.
- Temporäre private Vorschau samt SSH-Tunnel nach Zeitlimit beendet; keine zusätzlichen öffentlichen Ports oder dauerhaften Dienste eingerichtet. Der eigene lokale Entwicklungsserver bleibt für die Vorschau auf Port 3000 verfügbar.
- Bewerbungsupload bleibt ausdrücklich deaktiviert. Veröffentlichung des Menüzugangs ist keine Upload-/Versand-/Löschfreigabe und kein vollständiger Abschluss dieses getrennten Vorhabens.
