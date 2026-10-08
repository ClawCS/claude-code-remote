# Hetzner-Liveschaltung – 8. Oktober 2026

## Umfang und Freigaben

Bestehende Gestaltung und Inhalte auf dem separaten neuen Server veröffentlichen. Betreiber hat Impressum, technischen Umfang, Firmenkontaktdaten bei Hetzner und AV-Vertrag ausdrücklich bestätigt. Firmendaten gespeichert und AVV am 08.10.2026 erstellt; Nachweisscreenshots liegen außerhalb des öffentlichen Repositorys. Keine unabhängige juristische Abnahme behauptet.

Nur VM `trinkgut-jammers-web-01` (ID 169370648, Nürnberg) eingerichtet; anderer bestehender Server unberührt. Informationsbetrieb mit `RENTAL_MODE=disabled`: Mietanfragen öffnen einen E-Mail-Entwurf an `jammers-goch@trinkgut.de` oder WhatsApp. Kunden versenden selbst. Keine bindenden Bestellungen, Zahlungen, automatischen E-Mails oder echten Testkundendaten.

## Erster Release `e24ab31` – historische Erstabnahme

- Zuerst veröffentlichter Release: `e24ab31c926d4baa7939e5ff743a8a79f14ed62b`, Branch `codex/cinematic-production`, nach GitHub gepusht. Die folgenden Erstprüfungen bleiben als Historie erhalten; aktueller App-Livestand ist der weiter unten separat geprüfte Follow-up `1788f9d`. `e24ab31` bleibt als Rollback-Release erhalten.
- Positiv gefiltertes Git-Archiv, SHA-256 `341391e1c363c2b6c0f0caa89c8f028cc786c5c1f320b8718e959a781ced2b56`; Hash auf Linux vor Auspacken identisch. Keine lokalen Umgebungen, SSH-Schlüssel, Browserdaten, privaten Rohordner oder fremden Screenshots übertragen.
- Mac: 74 Testdateien, **1.229 Tests bestanden**; TypeScript, ESLint, `offers:check` (128 Originalangebote) und Whitespace-Prüfung erfolgreich.
- Sicherheitsupdates: Next/eslint-config-next 16.3.8 und source-map-js 1.2.2. `npm audit --omit=dev`: **0 bekannte Schwachstellen** zum Prüfzeitpunkt. Vollständiger Audit enthält weiterhin fünf dev-only Meldungen aus der braces/micromatch/fast-glob/ESLint-Kette; keine pauschale Schwachstellenfreiheit behauptet und kein erzwungenes Downgrade.
- Zwei interne Quellenlecks vor Veröffentlichung geschlossen: öffentliche Flyer-DTOs und die vom Client importierten NL-Angebotsdaten geben keine Canva-Design-URLs aus. Interne Provenienz bleibt erhalten; 21 NL-Angebote verweisen auf das unveränderte öffentliche Original-PDF. Regressionen zunächst rot, dann grün.
- Kleiner Linux-Server überschritt beim zweimaligen Foto-Neurendern die frühere 30-Sekunden-Testgrenze. Nur diese Grenze auf 120 Sekunden erhöht; Bild-/Hashassertionen unverändert. Unaktivierter alter Diagnose-Release wird nicht veröffentlicht.
- Unabhängige Abschlussprüfung vor Veröffentlichung: keine offenen neuen P1/P2-Befunde im geprüften Code-/Konfigurationsstand. Die separat erforderlichen Linux- und öffentlichen Prüfungen sind nachfolgend dokumentiert; daraus folgt keine vollständige Browser-/Sicherheitsprüfung sämtlicher Funktionen.
- Linux: ebenfalls **74 Dateien / 1.229 Tests bestanden** (119,21 Sekunden); ESLint, TypeScript, alle 128 Angebote, Produktionsaudit und vollständiger Next-Produktionsbuild erfolgreich. Frisches Git-Archiv enthält absichtlich keine generierte `next-env.d.ts`: einmaliger Typcheckfehler vor `next typegen` reproduziert, dokumentierte Build-Reihenfolge korrigiert, danach grün. Keine handgeschriebenen Ersatztypen.
- Frischer Linux-Client-Bundle auf Canva-Domains, bekannte private Design-IDs und private Quellpfade geprüft: keine Treffer. Dienst als `jammers` auf ausschließlich `127.0.0.1:3000` gestartet; tatsächliches Core-Limit null. Caddy-Konfiguration nativ validiert.
- Loopback: `/`, `/angebote`, `/produkte`, `/handzettel`, `/nl`, `/cocktails`, `/akademie`, `/vermietung`, `/kontakt`, `/impressum`, `/datenschutz` sowie beide Content-APIs HTTP 200. Mietkonfiguration bestätigt `enabled:false`, `testMode:false`, `onlinePayment:false`.

## Installierte Basis

- Ubuntu 24.04; nach Updates/Reboot Kernel `6.8.0-146-generic`; Node `22.23.3`, Caddy `2.11.7` aus offiziellen Quellen.
- IPv4 `159.69.37.200`; tatsächliche Host-IPv6 `2a01:4f8:1c18:14fe::1`.
- Schlüsselbasierte SSH-Anmeldung; Passwort-/interaktive Passwortanmeldung deaktiviert; neue Verbindung nach Reload erfolgreich.
- UFW aktiv, eingehend standardmäßig blockiert. Webports erst bei Freigabe/Start; Next ausschließlich Loopback.
- Fail2ban mit systemd-Journal und flüchtiger Datenbank unter `/run`; rsyslog gestoppt/deaktiviert; journald flüchtig, Weiterleitung an syslog nach Prüfung der Drop-in-Reihenfolge aus. Keine regulären Web-Zugriffslogs.
- Core-Limits für Website-Dienste null, Apport maskiert/deaktiviert und Kernel-Core-Muster ohne Pipe-Handler; wirksame Werte geprüft. SSH-Loginbuchführung separat rotiert, native Logrotate-Validierung erfolgreich. Historische Bootstrap-/Administrationslogs nicht gelöscht und nicht unter die Website-Sieben-Tage-Aussage subsumiert.

## Erstveröffentlichung `e24ab31` – bestätigte HTTP- und Inhaltsnachweise

Nach ausdrücklicher Betreiberfreigabe wurden die Web-DNS-Einträge A/AAAA und `www` auf den neuen Host umgestellt. Hauptorigin ist `https://trinkgut-jammers.de`; IPv4 und IPv6 zeigen auf die oben dokumentierte neue VM. Mailkonfiguration wurde nicht umgestellt.

- Öffentliches HTTPS: Hauptorigin über IPv4 und IPv6 jeweils HTTP 200, ohne Zertifikatsausnahme. Zertifikat von **Let's Encrypt, Aussteller YE2**, gültig **08.10.2026 10:55:54 GMT bis 06.01.2027 10:55:53 GMT**.
- `https://www.trinkgut-jammers.de` leitet per **301** auf die HTTPS-Hauptdomain; Pfad und Query bleiben erhalten. HTTP leitet per **308** auf HTTPS.
- Vollständiger öffentlicher HTTP-Audit: **117 Seiten, 2.788 Ressourcen, 26 APIs und fünf unbekannte Routen**, Ergebnis bestanden, **0 Fehler, 0 Warnungen**. Dies ist der technische Auditumfang, kein Beleg vollständiger visueller oder interaktiver Prüfung jeder Seite.
- Öffentliche Inhaltsprüfung: [Lauf `2026-10-08T11-55-48-296Z-check-e8d5041f`](../../audit/content-runs/2026-10-08T11-55-48-296Z-check-e8d5041f.json), `status=ok`, `checkedUrl=https://trinkgut-jammers.de`, **`websiteVerified=true` und `deploymentVerified=true`**. DE und NL für **05.–10.10.2026** aktiv und geprüft; keine Fehler oder Warnungen.
- Dienstneustart und anschließende Erreichbarkeit bestätigt. Geprüfte private Quellpfade liefern öffentlich **404**; diese Ablehnungsprüfung ist kein pauschaler Nachweis für jede denkbare URL. Mietkonfiguration bleibt deaktiviert; keine Testbestellung, Nachricht oder Zahlung ausgelöst.

Alte DNS-Rückfallwerte: A `217.160.0.153`, AAAA `2001:8d8:100f:f000::200`, TTL 3600, www zuvor NXDOMAIN. MX `mx00.ionos.de` und `mx01.ionos.de` mit Priorität 10 sowie SPF/DKIM/Autodiscover bleiben unverändert.

## Browserprüfung der Erstveröffentlichung und verbleibende Prüfpunkte

In Desktop-Safari wurden Startseite, NL-Seite, Plus/Minus-Bedienung der Leihartikel und das NL-Original-PDF visuell geprüft; diese geprüften Ansichten und Interaktionen waren in Ordnung. Im schmalen In-App-Browser ließ sich das mobile Menü öffnen und bedienen. Das ist keine vollständige Geräte-/Browsermatrix.

Offen beziehungsweise begrenzt:

- Die Browser-Fehlerkonsole wurde nicht geprüft: Der dafür benötigte moderne CUA-Zugang lief in einen Timeout. Daher keine Aussage über Konsolenfehlerfreiheit.
- Bei **311 px** Breite bricht der Titel des NL-Modals unschön um. Dieser enge Layoutfall bleibt ein dokumentierter Restpunkt.
- Das NL-PDF erschien im In-App-Browser dunkel, während dasselbe Original in Safari korrekt dargestellt wurde. Ursache und IAB-spezifische Darstellung sind nicht abschließend geklärt; daraus wird weder ein beschädigtes PDF noch eine überall fehlerfreie Anzeige abgeleitet.

## Follow-up `1788f9d` – live bestätigt um 12:15 UTC

Aktueller App-Release ist **`1788f9d943afeeb3af83523daaa607a92b7886cb`**. Er enthält die Miet-Anfragetext-Korrektur und die dokumentierte `next typegen`-Buildreihenfolge. Die Aktivierung und folgende releasebezogene Nachweise sind am 08.10.2026 um 12:15 UTC bestätigt:

- Gefiltertes Releasearchiv: SHA-256 **`93c320a0f0f41c6a418d0aa46a401040b9bea34a1d3e194116014b379e6f9f60`**, lokal und auf dem Server identisch.
- Linux: **74 Testdateien / 1.230 Tests bestanden** (120,18 Sekunden). ESLint, `next typegen`, TypeScript, `offers:check` für alle 128 Angebote und vollständiger Next-Produktionsbuild mit **120 Seiten** erfolgreich; Produktionsabhängigkeitsaudit mit **0 bekannten Schwachstellen** zum Prüfzeitpunkt.
- Frische Client-Bundles erneut auf Canva-Provenienz geprüft: keine Treffer. Root-Eigentum und gezielte Cache-Schreibrechte gesetzt/geprüft; Release über den atomaren `current`-Symlinkwechsel aktiviert. Vorheriger Release `e24ab31` für Rollback behalten.
- Next und Caddy aktiv; Mietkonfiguration weiterhin deaktiviert. Beide korrigierten Miet-Anfragetexte sind öffentlich nachgewiesen.
- HTTPS über IPv4 und IPv6 erneut HTTP 200; `www` erneut 301 mit erhaltenem Pfad/Query und HTTP erneut 308 auf HTTPS.

Die vollständigen öffentlichen Nachprüfungen nach diesem Releasewechsel sind ebenfalls bestanden:

- [Erneuter HTTP-Audit](../../audit/evidence/2026-10-08-hetzner-live-http.json): **117 Seiten, 2.788 lokale Ressourcen, 26 API-Verträge und fünf unbekannte Routen**, `passed=true`, **0 Fehler und 0 Warnungen**. 1.553 externe Links wurden ausdrücklich nicht abgerufen; dies ist kein Prüfnachweis ihrer Zielseiten.
- [Erneuter Content-Lauf `2026-10-08T12-17-20-982Z-check-70665b13`](../../audit/content-runs/2026-10-08T12-17-20-982Z-check-70665b13.json), beendet am **08.10.2026 um 12:17:24 UTC**: `status=ok`, `websiteVerified=true`, `deploymentVerified=true`, Hauptorigin `https://trinkgut-jammers.de`. DE und NL für **05.–10.10.2026** erneut aktiv/geprüft, keine Fehler oder Warnungen.

Damit sind die erneuten technischen HTTP-/Inhaltsvollprüfungen für `1788f9d` belegt; die erste Abnahme von `e24ab31` oben bleibt getrennte Historie. Die dokumentierten Browser-Restpunkte bleiben offen. Dokumentation und eigene Prüfnachweise bilden den separaten abschließenden Dokumentationscommit; vor Übergabe wird dessen GitHub-Synchronität geprüft. Fremde Screenshots und alte unversionierte Prüfläufe sind davon ausgeschlossen.

Ein nachfolgender reiner Dokumentationscommit ändert den App-Release **nicht**: Der laufende Release bleibt `1788f9d`, bis erneut ausdrücklich ein geprüftes App-Paket aktiviert wird.

## Betriebsgrenzen

Aktuelle DE/NL-Ausgaben gelten 05.–10.10.2026; 128 Original-Angebotsblöcke (107 DE, 21 NL). Keine Preise oder Gültigkeit erfunden/verlängert. Neue Wochenpakete benötigen geprüfte Quellen, Neubuild und versioniertes Deployment. Ein Git-Push ist kein Deployment.

Bestehende Wochen-/Tages-/Monatskontrollen bleiben Mac-/Codex-App-abhängig. Kein unabhängiger Server-Canva-Import eingerichtet. Caddy übernimmt Zertifikatserneuerung; Next läuft als unprivilegierter Systemdienst. Wiederherstellung/Releasewechsel siehe [Betriebsanleitung](../DEPLOYMENT-RUNBOOK.md). Backups sind kein geprüfter vollständiger Wiederherstellungsnachweis.
