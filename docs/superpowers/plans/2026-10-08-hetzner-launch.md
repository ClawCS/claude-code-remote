# Hetzner-Liveschaltung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die bestehende freigegebene Homepage unter https://trinkgut-jammers.de öffentlich, verschlüsselt und überprüfbar betreiben.

**Architecture:** Ein separater Ubuntu-24.04-Server betreibt genau eine Next.js-Produktionsinstanz als unprivilegierter Systemdienst auf 127.0.0.1:3000. Caddy terminiert HTTPS und leitet www auf die Hauptdomain um. Versionierte Releases erlauben Rückkehr zum vorherigen Stand; der bestehende andere Hetzner-Server bleibt unberührt.

**Tech Stack:** Next.js 16.3.8, Node.js 22 LTS (installiert: 22.23.3), systemd, Caddy 2.11.7, UFW, Ubuntu 24.04.

**Spec:** Betreiberauftrag im Chat vom 08.10.2026: Prozess bis zur funktionierenden Liveschaltung fortsetzen, erforderliche Freigaben gezielt erfragen. Bereits gebucht: CX23, Nürnberg, 2 vCPU, 4 GB, 40 GB, Backups und IPv4; 8,43 EUR/Monat inklusive USt. Kurzdesign, Impressum, Firmendaten/AVV und Web-DNS-Umschaltung wurden am jeweiligen Aktionspunkt ausdrücklich bestätigt.

**Nachweisstand 08.10.2026, 12:17 UTC:** Aktueller App-Release `1788f9d943afeeb3af83523daaa607a92b7886cb` ist nach eigenem Linux-Prüflauf aktiviert und öffentlich per HTTPS geprüft. [Erneuter HTTP-Audit](../../../audit/evidence/2026-10-08-hetzner-live-http.json) und [erneute Content-Abnahme](../../../audit/content-runs/2026-10-08T12-17-20-982Z-check-70665b13.json) sind bestanden. Die Erstabnahme von `e24ab31` bleibt im [Launchbericht](../../audits/2026-10-08-hetzner-launch.md) und der [ersten Content-Abnahme](../../../audit/content-runs/2026-10-08T11-55-48-296Z-check-e8d5041f.json) als Historie erhalten; `e24ab31` bleibt für Rollback verfügbar. Ein reiner Dokumentationscommit ändert den laufenden App-Release nicht.

## Global Constraints

- Arbeitsort und Branch gemäß AGENTS.md; fremde Screenshots/Prüfberichte nicht ändern oder stagen.
- Nur der neue Server `trinkgut-jammers-web-01` (ID 169370648) wird eingerichtet; bestehender Server ID 125309815 bleibt unangetastet.
- Bestehende Gestaltung, Redaktion und Preise nicht im Rahmen des Deployments umgestalten.
- `NODE_ENV=production`, `RENTAL_MODE=disabled`; keine Testuhren, SMTP-/Payment-Zugänge oder echten Bestellungen/Zahlungen.
- Bestehende WhatsApp-/E-Mail-Anfragen bleiben nutzbar. Keine automatisch versendeten E-Mails.
- Keine privaten Canva-/Instagram-Originale, Browserdaten, SSH-Privatschlüssel oder lokalen Umgebungsdateien übertragen.
- IONOS-MX-, SPF-, DKIM- und sonstige Mail-Einträge unverändert lassen; nur Web-DNS gezielt anpassen.
- Keine regulären Web-Zugriffslogs; technische Betriebs-/Sicherheitslogs begrenzen. AVV-Abschluss nur anhand tatsächlicher Betreiberbestätigung/Nachweise dokumentieren, keine juristische Gesamtfreigabe daraus ableiten.
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
- [x] Ausgangsstand vor Umstellung dokumentiert: Domain zeigte auf IONOS; Mail-MX bleibt auch nach der Web-Umschaltung bei IONOS.
- [x] Impressumsangaben durch Betreiber bestätigt; Firmendaten gespeichert und AVV nach ausdrücklicher Freigabe erstellt.
- [x] Kurzdesign/Plan vom Betreiber abgeglichen; technische Umsetzung freigegeben.

### Task 2: Veröffentlichungssichere Inhalte und Deploymentdateien

**Files:** `lib/homepage-content.ts`, betroffene Content-Tests, `app/datenschutz/page.tsx`, `deploy/hetzner/*`, `docs/DEPLOYMENT-RUNBOOK.md`.

**Interfaces:** Öffentliches Flyer-DTO enthält lokale PDF-/Coverpfade, jedoch keine internen Canva-Design-URLs; Provenienz bleibt intern.

- [x] Regression zunächst rot: JSON beider Content-APIs und öffentliche Seitendaten enthalten keine Canva-Design-URL, Flyer bleiben abrufbar.
- [x] Minimalen Provenienz-Fix einschließlich Client-Angebotsdaten implementiert und relevante Content-/Routenprüfungen ausgeführt.
- [x] Hostingtext mit tatsächlichem Betreiber/Standort und konkret eingerichteter Logpolitik vervollständigt; keine Rechtsfreigabe behauptet.
- [x] Reproduzierbare systemd-/Caddy-/SSH-Konfiguration und Release-Anleitung erstellt; keine Secrets darin.
- [x] Konfigurationsprüfungen für Loopback-Bindung, unprivilegierten Dienst, deaktivierte Miete, fehlende Testuhren und Domainweiterleitung ausgeführt.
- [x] Gesamttests und Produktionsbuild für den ersten Release `e24ab31` geprüft; nur eigene geprüfte Dateien committed/gepusht. Mac und Linux jeweils 74 Testdateien / 1.229 Tests bestanden; der eigene Prüfnachweis des späteren Follow-ups steht unten.

### Task 3: Neuer Server und getesteter Release

**Files:** Serverseitig `/etc/ssh/sshd_config.d/`, `/etc/caddy/Caddyfile`, `/etc/systemd/system/trinkgut-jammers.service`, `/srv/trinkgut-jammers/releases/<commit>/`, `/etc/trinkgut-jammers/`.

**Interfaces:** Anwendung hört nur lokal; Caddy ist der einzige öffentliche HTTP(S)-Einstieg. Dienst läuft als dedizierter Benutzer ohne interaktive Anmeldung.

- [x] Ubuntu-Updates, Schlüsselanmeldung ohne SSH-Passwörter, Firewall und begrenzte Website-Sicherheitsjournale eingerichtet; zweiten SSH-Zugriff geprüft.
- [x] Node.js aus offizieller Quelle mit Hashprüfung installiert; Caddy aus dokumentierter offizieller Paketquelle installiert.
- [x] Ausschließlich veröffentlichten Git-Stand und notwendige sichere Buildquellen übertragen; keine lokalen Umgebungsdateien oder privaten Rohdaten.
- [x] `npm ci`, Tests und Build für `e24ab31` auf Linux mit realer Uhr und gesperrter Miete ausgeführt; Linux-Prüfungen erfolgreich.
- [x] systemd gestartet; zentrale Routen und Content-APIs auf Loopback geprüft. Bilder und PDFs zusätzlich im öffentlichen HTTP-Audit geprüft; NL-PDF in Safari visuell korrekt.
- [x] Konfiguration validiert, Dienstneustart und erneute Erreichbarkeit geprüft; Rollback-Schritte dokumentiert. Kein durchgeführter vollständiger Restore-/Rollback-Test behauptet.

### Task 4: Domain, HTTPS und öffentliche Erstabnahme `e24ab31`

**Files:** IONOS-Web-DNS, `data/editorial/source-config.json`, `docs/PROJECT-STATUS.md`, `docs/CONTENT-UPDATE-RUNBOOK.md`, `docs/audits/2026-10-08-hetzner-launch.md`.

**Interfaces:** Hauptdomain liefert bestehenden Marktauftritt; www leitet auf dieselbe HTTPS-Origin; `publicUrl` entspricht der tatsächlich geprüften Origin.

- [x] Bestehende DNS-Rückfallwerte dokumentiert; nach ausdrücklicher Freigabe ausschließlich Web-A/AAAA/www umgestellt. MX, SPF, DKIM und Autodiscover unverändert; AVV am Aktionspunkt ausdrücklich freigegeben.
- [x] Öffentliches HTTPS über IPv4/IPv6 jeweils HTTP 200 geprüft; gültiges Let's-Encrypt-Zertifikat (YE2, 08.10.2026 10:55:54 GMT–06.01.2027 10:55:53 GMT). `www` per 301 mit erhaltenem Pfad/Query, HTTP per 308 auf HTTPS; keine Zertifikatswarnung umgangen.
- [x] `publicUrl` im geprüften Release gesetzt; öffentlicher Content-Lauf `2026-10-08T11-55-48-296Z-check-e8d5041f` bestätigt `websiteVerified=true`, `deploymentVerified=true` und beide Handzettel 05.–10.10.2026.
- [x] Öffentliche Seiten, Content-APIs und Ressourcen geprüft: vollständiger HTTP-Audit mit 117 Seiten, 2.788 Ressourcen, 26 APIs und fünf unbekannten Routen; 0 Fehler, 0 Warnungen.
- [x] Desktop-Safari: Startseite, NL-Seite, Mietartikel-Plus/Minus und NL-PDF visuell geprüft. Schmales IAB: mobiles Menü bedienbar. Begrenzter Prüfbereich, keine vollständige Browsermatrix.
- [ ] Fehlerkonsole nach Wiederherstellung des modernen CUA-Zugangs prüfen und zugehörige Nachweise sichern; bisher wegen Timeout nicht geprüft.
- [ ] Restpunkte nachprüfen: unschöner NL-Modaltitel-Umbruch bei 311 px und dunkle NL-PDF-Darstellung im IAB (in Safari korrekt).
- [x] Öffentliche Sperrprüfungen für Bestellungen/Administration/pausierte Funktionen erfolgreich; geprüfte private Quellpfade liefern 404. Keine echten Bestellungen, E-Mails oder Zahlungen ausgelöst.
- [x] Launchbericht mit bestätigtem App-Commit, HTTPS-/Content-Nachweisen und Betriebsgrenzen lokal ergänzt; keine unabhängige Server-Canva-Automatik behauptet, Codex-Aufgaben bleiben Mac-/App-abhängig.
- [x] Abschließenden Bericht/Plan geprüft und mit den eigenen öffentlichen Prüfnachweisen in den abschließenden Dokumentationscommit aufgenommen; GitHub-Synchronität wird vor der Übergabe geprüft.

### Aktivierter Follow-up `1788f9d`

- [x] Miet-Anfragetext und `next typegen`-Buildreihenfolge als `1788f9d943afeeb3af83523daaa607a92b7886cb` committed. Archiv-SHA-256 lokal/remote identisch: `93c320a0f0f41c6a418d0aa46a401040b9bea34a1d3e194116014b379e6f9f60`.
- [x] Separaten Linux-Prüflauf bestanden: 74 Dateien / 1.230 Tests (120,18 s), ESLint, `next typegen`, TypeScript, 128 Angebote, Produktionsabhängigkeitsaudit 0 und Next-Build mit 120 Seiten. Client-Bundle-Canva-Scan ohne Treffer.
- [x] Root-Eigentum/Cache-Berechtigungen geprüft, atomaren Releasewechsel vorgenommen, Next/Caddy aktiv und Miete deaktiviert bestätigt; `e24ab31` für Rollback behalten.
- [x] Um 12:15 UTC beide neuen Anfragetexte öffentlich nachgewiesen; HTTPS IPv4/IPv6 200, `www` 301 mit Pfad/Query und HTTP 308 erneut geprüft. App-Release `1788f9d` ist live.
- [x] Vollständigen öffentlichen HTTP-Audit nach dem Follow-up bestanden: 117 Seiten / 2.788 lokale Ressourcen / 26 APIs / fünf unbekannte Routen, 0 Fehler und 0 Warnungen. Nachweis: `audit/evidence/2026-10-08-hetzner-live-http.json`.
- [x] Erneuten `content:check` am 08.10.2026 um 12:17:24 UTC abgeschlossen: Lauf `2026-10-08T12-17-20-982Z-check-70665b13`, `status=ok`, beide Verified-Werte `true`, DE/NL 05.–10.10.2026, keine Fehler oder Warnungen.
- [x] Abschlussdokumentation geprüft und zur gezielten Commit-/Push-Integration abgeschlossen. Ein Dokumentationscommit verändert den bestätigten App-Release `1788f9d` nicht.
