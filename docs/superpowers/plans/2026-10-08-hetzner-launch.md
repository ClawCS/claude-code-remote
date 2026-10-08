# Hetzner-Liveschaltung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die bestehende freigegebene Homepage unter https://trinkgut-jammers.de öffentlich, verschlüsselt und überprüfbar betreiben.

**Architecture:** Ein separater Ubuntu-24.04-Server betreibt genau eine Next.js-Produktionsinstanz als unprivilegierter Systemdienst auf 127.0.0.1:3000. Caddy terminiert HTTPS und leitet www auf die Hauptdomain um. Versionierte Releases erlauben Rückkehr zum vorherigen Stand; der bestehende andere Hetzner-Server bleibt unberührt.

**Tech Stack:** Next.js 16.3.7, Node.js 22 LTS (mindestens 22.13), systemd, Caddy, UFW, Ubuntu 24.04.

**Spec:** Betreiberauftrag im Chat vom 08.10.2026: Prozess bis zur funktionierenden Liveschaltung fortsetzen, erforderliche Freigaben gezielt erfragen. Bereits gebucht: CX23, Nürnberg, 2 vCPU, 4 GB, 40 GB, Backups und IPv4; 8,43 EUR/Monat inklusive USt. Kurzdesign und Impressumsbestätigung sind am 08.10. zur Prüfung vorgelegt.

## Global Constraints

- Arbeitsort und Branch gemäß AGENTS.md; fremde Screenshots/Prüfberichte nicht ändern oder stagen.
- Nur der neue Server `trinkgut-jammers-web-01` (ID 169370648) wird eingerichtet; bestehender Server ID 125309815 bleibt unangetastet.
- Bestehende Gestaltung, Redaktion und Preise nicht im Rahmen des Deployments umgestalten.
- `NODE_ENV=production`, `RENTAL_MODE=disabled`; keine Testuhren, SMTP-/Payment-Zugänge oder echten Bestellungen/Zahlungen.
- Bestehende WhatsApp-/E-Mail-Anfragen bleiben nutzbar. Keine automatisch versendeten E-Mails.
- Keine privaten Canva-/Instagram-Originale, Browserdaten, SSH-Privatschlüssel oder lokalen Umgebungsdateien übertragen.
- IONOS-MX-, SPF-, DKIM- und sonstige Mail-Einträge unverändert lassen; nur Web-DNS gezielt anpassen.
- Keine regulären Web-Zugriffslogs; technische Betriebs-/Sicherheitslogs begrenzen, keine behauptete bereits abgeschlossene AVV.
- Vertragsannahmen und sicherheitsrelevante Browseraktionen bei Bedarf vor dem tatsächlichen Auslösen bestätigen lassen.
- Öffentliche HTTPS-Prüfung, nicht Git-Push oder localhost, entscheidet über Live-Erfolg.

## Review Focus

1. Falsches A/AAAA oder www-Ziel: beide Namensvarianten und IPv4/IPv6 prüfen, keine Weiterleitung zum alten IONOS-Webspace.
2. Privates Material oder interne Provenienz: öffentliche APIs/HTML und erratbare Quelldateipfade auf Offenlegung prüfen.
3. Unbeabsichtigte Bestell-/KI-Aktivierung: Produktionskonfiguration und mutierende Endpunkte müssen weiterhin geschlossen sein.
4. Veraltete Wochenwerbung durch Build/Cache: DE/NL und 128 aktuelle Angebotsblöcke mit realer Uhr über öffentliche APIs prüfen.
5. Neustart/Deploymentfehler: Dienststart und lokaler Healthcheck prüfen; keinen ungeprüften Release aktivieren, Rollback dokumentieren.

### Task 1: Ausgangsstand und Veröffentlichungshürden

**Files:** `AGENTS.md`, `docs/OFFENE-FRAGEN.md`, `docs/CONTENT-UPDATE-RUNBOOK.md`, `app/impressum/page.tsx`, `app/datenschutz/page.tsx`.

**Interfaces:** Bestehender Commit 2e824c2 und Betreiberantworten; Ergebnis ist eine konkrete Liste bestätigter Angaben und noch gesperrter Betriebsfunktionen.

- [x] Fetch/FF-only durchführen; Branch aktuell, fremde Änderungen erhalten.
- [x] Neuen Server über SSH lesend prüfen: Ubuntu 24.04.4, x86_64, Cloud-init fertig, nur SSH öffentlich, Uhr synchron.
- [x] Domain zeigt noch auf IONOS; Mail-MX bleibt bei IONOS.
- [ ] Impressumsangaben durch Betreiber bestätigen; Hosting-/AVV-Status klären.
- [ ] Kurzdesign/Plan vom Betreiber abgleichen; danach technische Umsetzung.

### Task 2: Veröffentlichungssichere Inhalte und Deploymentdateien

**Files:** `lib/homepage-content.ts`, betroffene Content-Tests, `app/datenschutz/page.tsx`, `deploy/hetzner/*`, `docs/DEPLOYMENT-RUNBOOK.md`.

**Interfaces:** Öffentliches Flyer-DTO enthält lokale PDF-/Coverpfade, jedoch keine internen Canva-Design-URLs; Provenienz bleibt intern.

- [ ] Regression zunächst rot: JSON beider Content-APIs und öffentliche Seitendaten enthalten keine Canva-Design-URL, Flyer bleiben abrufbar.
- [ ] Minimalen Provenienz-Fix implementieren und relevante Content-/Routenprüfungen ausführen.
- [ ] Hostingtext mit tatsächlichem Betreiber/Standort und konkret eingerichteter Logpolitik vervollständigen; keine Rechtsfreigabe behaupten.
- [ ] Reproduzierbare systemd-/Caddy-/SSH-Konfiguration und Release-Anleitung erstellen; keine Secrets darin.
- [ ] Konfigurationsprüfungen für Loopback-Bindung, unprivilegierten Dienst, deaktivierte Miete, fehlende Testuhren und Domainweiterleitung ausführen.
- [ ] Gesamttests und Produktionsbuild prüfen; nur eigene geprüfte Dateien committen/pushen.

### Task 3: Neuer Server und getesteter Release

**Files:** Serverseitig `/etc/ssh/sshd_config.d/`, `/etc/caddy/Caddyfile`, `/etc/systemd/system/trinkgut-jammers.service`, `/srv/trinkgut-jammers/releases/<commit>/`, `/etc/trinkgut-jammers/`.

**Interfaces:** Anwendung hört nur lokal; Caddy ist der einzige öffentliche HTTP(S)-Einstieg. Dienst läuft als dedizierter Benutzer ohne interaktive Anmeldung.

- [ ] Ubuntu-Updates, Schlüsselanmeldung ohne SSH-Passwörter, Firewall und zeitlich begrenzte Sicherheitslogs einrichten; zweiten SSH-Zugriff vor Beenden der bestehenden Verbindung prüfen.
- [ ] Node.js aus offizieller Quelle mit Hashprüfung installieren; Caddy aus dokumentierter offizieller Paketquelle installieren.
- [ ] Ausschließlich veröffentlichten Git-Stand und notwendige sichere Buildquellen übertragen; keine lokalen Umgebungsdateien oder privaten Rohdaten.
- [ ] `npm ci`, Tests und Build auf Linux mit realer Uhr und gesperrter Miete ausführen.
- [ ] systemd starten; zentrale Routen, Bilder, lokale PDFs und Content-APIs auf Loopback prüfen.
- [ ] Konfiguration validieren, Dienstneustart prüfen und Rollback-Schritte dokumentieren.

### Task 4: Domain, HTTPS und öffentliche Abnahme

**Files:** IONOS-Web-DNS, `data/editorial/source-config.json`, `docs/PROJECT-STATUS.md`, `docs/CONTENT-UPDATE-RUNBOOK.md`, `docs/audits/2026-10-08-hetzner-launch.md`.

**Interfaces:** Hauptdomain liefert bestehenden Marktauftritt; www leitet auf dieselbe HTTPS-Origin; `publicUrl` entspricht der tatsächlich geprüften Origin.

- [ ] Bestehende DNS-Werte dokumentieren; nur Web-A/AAAA/www ändern. HTTPS-/AVV-Vertragsfreigaben am jeweiligen Aktionspunkt einholen.
- [ ] DNS-Auflösung und automatisch ausgestelltes Zertifikat für beide Namen prüfen; kein Umgehen von Zertifikatswarnungen.
- [ ] `publicUrl` setzen und Release aktualisieren; `npm run content:check -- --url https://trinkgut-jammers.de` gegen reale Produktion ausführen.
- [ ] Öffentlich `/`, `/angebote`, `/produkte`, `/handzettel`, `/nl`, `/cocktails`, `/akademie`, `/vermietung`, `/kontakt`, `/impressum`, `/datenschutz`, beide Content-APIs sowie Bilder/PDFs prüfen.
- [ ] Desktop und Mobil im Browser prüfen, Fehlerkonsole/Navigation testen; Nachweisscreenshots sichern.
- [ ] Sperren für Bestellungen/Administration/pausierte Upload- und KI-Funktionen sowie nicht öffentliche Quellpfade prüfen.
- [ ] Abschlussbericht mit Commit, HTTPS-Nachweis, Grenzen und Betriebsanleitung speichern/pushen. Keine unabhängige serverseitige Canva-Automatik behaupten; vorhandene Codex-Aufgaben bleiben Mac-abhängig.
