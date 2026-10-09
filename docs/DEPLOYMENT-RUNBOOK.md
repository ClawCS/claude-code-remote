# Betrieb und Releases auf Hetzner

Stand: 08.10.2026. Diese Anleitung beschreibt die Zielkonfiguration; die Dateien allein sind kein Nachweis einer erfolgten Installation oder öffentlichen Abnahme. Tatsächliche Versionsnummern, Commit, Prüfresultate und Änderungen am Server im Liveschaltungsbericht festhalten.

## Festgelegter Umfang

Nur der neue Server `trinkgut-jammers-web-01`, ID `169370648`, Ubuntu 24.04 x86_64, ist Ziel: IPv4 `159.69.37.200`, IPv6 `2a01:4f8:1c18:14fe::1`. Den anderen Hetzner-Server nicht ändern. `https://trinkgut-jammers.de` ist die Hauptadresse; `www` leitet mit unverändertem Pfad/Query darauf um. Caddy ist der einzige öffentliche HTTP(S)-Einstieg, Next hört auf `127.0.0.1:3000`.

Der Betreiber hat Informationsbetrieb und Impressumsangaben bestätigt. `RENTAL_MODE=disabled` bleibt zwingend: Der Leihwarenkorb erstellt eine unverbindliche E-Mail-Anfrage an `jammers-goch@trinkgut.de` bzw. öffnet den vorhandenen WhatsApp-Anfrageweg. Der Kunde versendet selbst; der Server versendet keine E-Mail, legt keine verbindliche Bestellung an und verarbeitet keine Zahlung. Miet-/Admin-, SMTP-, Zahlungs- und Gemini-Zugänge werden nicht eingerichtet. Die pausierten Upload-/KI-/Community-Endpunkte bleiben gesperrt.

## Dateien und Voraussetzungen

| Repositorydatei unter `deploy/hetzner/` | Installationsziel |
| --- | --- |
| `Caddyfile` | `/etc/caddy/Caddyfile` |
| `caddy-hardening.conf` | `/etc/systemd/system/caddy.service.d/hardening.conf` |
| `trinkgut-jammers.service` | `/etc/systemd/system/trinkgut-jammers.service` |
| `00-jammers-hardening.conf` | `/etc/ssh/sshd_config.d/00-jammers-hardening.conf` |
| `journald-jammers.conf` | `/etc/systemd/journald.conf.d/zz-jammers.conf` |
| `fail2ban-jammers.local` | `/etc/fail2ban/jail.d/jammers.local` |
| `fail2ban-daemon.local` | `/etc/fail2ban/fail2ban.local` |
| `fail2ban-journal.conf` | `/etc/systemd/system/fail2ban.service.d/journal.conf` |
| `99-jammers-coredumps.conf` | `/etc/sysctl.d/99-jammers-coredumps.conf` |
| `apport.default` | `/etc/default/apport` (vorhandene lokale Einstellungen prüfen) |
| `wtmp.logrotate` | `/etc/logrotate.d/wtmp` (vorhandene Regel ersetzen) |
| `btmp.logrotate` | `/etc/logrotate.d/btmp` (vorhandene Regel ersetzen) |

`bootstrap.sh` gehört ausschließlich auf diesen neuen, bestätigten Host und ist kein regelmäßig laufendes Release-Skript. Vor einem erneuten Aufruf den bereits erreichten Zustand prüfen. Es aktualisiert Ubuntu, installiert die Basispakete, Node 22 aus der offiziellen Distribution mit SHA-256-Prüfung und Caddy aus dessen offizieller Paketquelle. `/opt/node` zeigt auf die versionierte Installation. Die tatsächlich installierte Node-Version und Archivprüfsumme dokumentieren; `latest-v22.x` ist kein unveränderlicher Versionspin für spätere Wiederholungen. Für reproduzierbare Folgeinstallationen dieselbe dokumentierte Versions-URL und Prüfsumme verwenden, Sicherheitsupdates separat testen.

Node muss mindestens `22.13.0` sein; `node:sqlite` wird auch bei abgeschalteter Miete importiert. Der Systembenutzer `jammers` hat keine Login-Shell. Auf dem Host außerdem `python3-systemd` für Fail2bans Journal-Backend und `nftables` für seine Sperraktion prüfen/installieren. Eine bestehende funktionierende SSH-Schlüsselverbindung offen halten. SSH-Hostschlüssel über eine unabhängige vertrauenswürdige Quelle abgleichen, nicht mit `StrictHostKeyChecking=no` umgehen.

## SSH, Firewall und technische Logs

Die Drop-ins erst nach Prüfung bereits vorhandener Konfigurationen installieren (root-eigene Dateien, Modus `0644`). OpenSSH wertet meist den zuerst gesetzten Wert aus; insbesondere Cloud-init, Include-Reihenfolge und `Match`-Blöcke prüfen. `authorized_keys` unverändert erhalten. Vor Reload:

```sh
/usr/sbin/sshd -t
/usr/sbin/sshd -T -C user=root,host=trinkgut-jammers-web-01,addr=127.0.0.1
```

Erwartet: `pubkeyauthentication yes`, `passwordauthentication no`, `kbdinteractiveauthentication no`, Root nur per Schlüssel (`prohibit-password`, je nach Ausgabe `without-password`). Zusätzlich für die echte Administrator-Quelladresse prüfen. Erst danach `systemctl reload ssh`; aus einem zweiten Terminal eine neue Schlüsselverbindung erfolgreich aufbauen, bevor die erste Sitzung geschlossen wird. Nicht durch absichtliche Fehlanmeldungen den eigenen Zugang sperren.

UFW lässt zunächst nur `22/tcp` zu. Erst nach erfolgreicher interner App-/Proxyprüfung `80/tcp` und `443/tcp` öffnen. IPv6-Regeln müssen ebenfalls aktiv sein; `3000` und Caddys Admin-Port `2019` niemals öffentlich freigeben. Diese Caddy-Konfiguration nutzt HTTP/1.1 und HTTP/2, kein öffentliches UDP/443. Ein zusätzliches Hetzner-Firewallprofil muss dieselben notwendigen Zugänge zulassen.

Es gibt **keine regulären Caddy-Zugriffslogs**. Technische Fehler können dennoch IP-/URL-Angaben enthalten. Caddy-Fehler, App-Betrieb, SSH und Fail2ban gehen ins flüchtige Journal unter `/run/log/journal`: Ziel maximal sieben Tage und maximal 128 MiB. `MaxRetentionSec=6day` und stündliche Dateirotation lassen einen Puffer unter der Sieben-Tage-Grenze. Platzdruck oder Neustart können früher löschen; das ist keine Zusage einer sieben Tage langen Verfügbarkeit. `/run` ist kein Bestandteil persistenter VM-Datenträgerbackups. Fail2bans zusätzliche Sicherheitsdatenbank liegt ebenfalls flüchtig unter `/run/fail2ban/fail2ban.sqlite3`, mit Löschalter 24 Stunden und ohne gespeicherte Treffertexte. Ein Dienst-/Hostneustart kann Sperren vergessen; dieser begrenzte Schutz ist für den schlüsselbasierten SSH-Zugang bewusst akzeptiert.

**Vor jeder Aussage zur tatsächlichen Aufbewahrung:** Die neue VM hatte `rsyslog` aktiv. Auf diesem dedizierten Host nach Prüfung deaktivieren (`systemctl disable --now rsyslog`), damit rsyslog keine parallelen dauerhaften Kopien dieser Journale erzeugt. Die unten erläuterte SSH-Anmeldebuchführung ist davon unabhängig. Alte Bootstrap-Logs erhalten; keine pauschale Löschung von `/var/log`. Das Journal-Drop-in muss als `zz-jammers.conf` installiert werden: die vorhandene Distributionsdatei `/usr/lib/systemd/journald.conf.d/syslog.conf` sortiert nach einem numerischen Präfix und würde dessen `ForwardToSyslog=no` wieder überschreiben. Nach jeder Paket-/Konfigurationsänderung die zusammengeführte Konfiguration prüfen. `ForwardToSyslog=no` allein verhindert nicht alle unabhängig konfigurierten Logleser. Bestehende `/var/log/journal`-, `/var/log/auth.log`-, `/var/log/syslog`-, Fail2ban-Dateien, Cloud-init-/Journal-Remote-/Agent-Konfigurationen und Backups separat inventarisieren. Keine Behauptung, alte Kopien seien durch die neue Einstellung gelöscht.

```sh
systemd-analyze cat-config systemd/journald.conf
systemctl is-active rsyslog
systemctl is-enabled rsyslog
systemctl cat fail2ban
fail2ban-client -t
```

Nach Installation der Drop-ins `systemctl daemon-reload`, Journal und Fail2ban kontrolliert neu starten. `fail2ban-client status sshd` muss das Journal-Backend zeigen; der Dienst muss im Vordergrund laufen und STDOUT ins Journal leiten, nicht in `/var/log/fail2ban.log`. Mit `journalctl -u ssh -u fail2ban -u caddy -u trinkgut-jammers --since -10min` ausschließlich notwendige technische Informationen prüfen; keine vollständigen Journale mit IPs/Schlüsselinhalten in Git oder Chat kopieren. `journalctl --disk-usage` und die aufgelöste Konfiguration dokumentieren. UFW-Kernelmeldungen unterliegen ebenfalls dieser Journalpolitik.

### Getrennte SSH-/Betriebssystem-Anmeldebuchführung

Die flüchtige Journalpolitik bedeutet **nicht**, dass alle Betriebssystemdaten flüchtig sind. `/var/log/wtmp` enthält System-/SSH-Anmeldungen, `/var/log/btmp` fehlgeschlagene Anmeldeversuche einschließlich fremder SSH-Quelladressen und `/var/log/lastlog` den letzten Login pro Systemkonto. Diese bereits auf der VM vorhandenen persistenten Dateien sind keine Website-Zugriffslogs; insbesondere `btmp` kann trotz gesperrter SSH-Passwörter weiter wachsen.

Für `wtmp` und `btmp` die bisherigen Regeln inventarisieren und durch die beiden mitgelieferten Regeln ersetzen: täglich, sieben Rotationsdateien, `maxage 7`, fehlende/leere Dateien ohne Fehler bzw. ohne unnötige Rotation. **Keine doppelte Definition** in einer zusätzlichen Jammers-Datei anlegen. Root/Gruppe `utmp` und die angegebenen Dateirechte erhalten. Vor Übernahme alte Konfiguration außerhalb von `/etc/logrotate.d` sichern; dort liegende Sicherungskopien könnten sonst erneut eingelesen werden. Danach:

```sh
logrotate --debug /etc/logrotate.conf
systemctl is-enabled logrotate.timer
systemctl list-timers logrotate.timer
```

`--debug` verändert keine Dateien. Erst bei fehlerfreier Gesamtkonfiguration den täglich laufenden Timer sicherstellen. `rotate 7` bezeichnet sieben Archivdateien **zusätzlich zur aktiven Datei**, keine exakte Löschfrist pro Datensatz. `maxage` wird bei einer Rotation ausgewertet; wegen `notifempty`, Dateigrenzen oder ausgefallener Timer ist dies keine garantierte Sieben-Tage-Löschung. `lastlog` wird nicht als gewöhnliche Textlogdatei rotiert und bleibt eine getrennte kontoabhängige Verwaltungsaufzeichnung. Bestehende Bootstrapdateien nicht pauschal löschen.

Datenträgerbackups können diese Verwaltungsdateien länger enthalten: Beispielsweise können sieben tägliche Wiederherstellungspunkte die historische Reichweite bereits etwa zwei Wochen oder länger ausdehnen; der tatsächliche Sicherungsplan und die Dateigrenzen entscheiden. Für SSH-Administration/Backups eine eigene Aufbewahrung dokumentieren, nicht die Sieben-Tage-Aussage des Website-Betriebsjournals übernehmen. Details zu Rotation und `maxage`: [Logrotate-Dokumentation](https://github.com/logrotate/logrotate/blob/main/logrotate.8.in).

### Keine Speicherabbilder der Website-Prozesse

Die Serverprüfung fand Apport als aktiven, über `kernel.core_pattern` aufgerufenen Crashsammler und `LimitCORE=infinity` im Caddy-Paketdienst. Solche Speicherabbilder könnten HTTP-Inhalte oder andere Prozessdaten dauerhaft ablegen. `LimitCORE=0` allein reicht bei einem mit `|` beginnenden Kernel-Crashhandler nicht, weil dessen Pipe die übliche Kerngrößengrenze umgeht. Deshalb werden **beide** Wege geschlossen: Next und Caddy bekommen das harte/weiche Core-Limit null; Apport wird deaktiviert, und das Kernelmuster wird auf eine gewöhnliche Datei zurückgestellt. Siehe [Linux-Core-Dokumentation](https://man7.org/linux/man-pages/man5/core.5.html) und [Kernel-Parameter](https://www.kernel.org/doc/html/latest/admin-guide/sysctl/kernel.html#core-pattern).

Als root ausschließlich auf der bestätigten neuen VM: den aktualisierten Next-Dienst sowie das Caddy-Drop-in installieren. In `/etc/default/apport` den vorhandenen Wert auf **`enabled=0`** setzen (kleingeschrieben, andere lokale Einstellungen erhalten). Das entspricht der [Ubuntu-Apport-Konfiguration](https://help.ubuntu.com/community/ReportingBugs). Danach den vorhandenen Dienst stoppen/deaktivieren und gegen erneutes Starten maskieren; **erst anschließend** die Kernelwerte anwenden, damit ein Apport-Stopskript sie nicht zurücksetzt:

```sh
systemctl disable --now apport.service
systemctl mask apport.service
sysctl --load /etc/sysctl.d/99-jammers-coredumps.conf
systemctl daemon-reload
systemctl restart trinkgut-jammers caddy
sysctl kernel.core_pattern fs.suid_dumpable
systemctl is-enabled apport.service
systemctl is-active apport.service
systemctl show trinkgut-jammers caddy -p LimitCORE -p LimitCORESoft
```

Erwartet: `kernel.core_pattern = core` (kein `|...apport` oder anderer Sammler), `fs.suid_dumpable = 0`, Apport `masked`/`inactive`, beide Core-Limits `0`. Zusätzlich für die tatsächlich gestarteten Prozesse prüfen, nicht nur die Unit-Dateien:

```sh
for unit in trinkgut-jammers caddy; do
  pid=$(systemctl show "$unit" -p MainPID --value)
  test "$pid" -gt 0 || exit 1
  awk '/Max core file size/ {found=1; print; if ($5 != 0 || $6 != 0) exit 1} END {if (!found) exit 1}' "/proc/$pid/limits" || exit 1
done
```

Nach Reboot, Apport-/systemd-/Caddy-Updates und jeder Änderung an Crashdiensten erneut prüfen; andere Drop-ins, `/etc/sysctl.conf` oder startende Dienste können Kernelwerte überschreiben. Vorhandene `apport*`-/`whoopsie*`-Dienste und Timer auf automatische Berichtserfassung/-übermittlung prüfen und vor einer Aussage über deren Abschaltung gezielt behandeln. Das Kernelmuster `core` deaktiviert nicht pauschal Core-Dateien beliebiger anderer Programme; die Aussage gilt für die beiden geprüften Website-Dienste mit Limit null. Vorhandene `/var/crash`-, `/var/lib/apport`- oder Core-Dateien separat inventarisieren, nicht hochladen oder unbesehen löschen. Keinen absichtlichen Absturz des laufenden Webdienstes als Test auslösen. Nach den Neustarts die üblichen lokalen und öffentlichen Erreichbarkeitsprüfungen wiederholen.

## Sicheres Release-Paket

Vor Paketbildung alle beauftragten eigenen Änderungen prüfen/committen. Fremde Screenshot-/Auditänderungen weder stagen noch verwerfen. Nur einen ausdrücklich geprüften Commit paketieren, keine vollständige Kopie der schmutzigen Worktree. Folgender Positivfilter enthält Build-/Testquellen, aber keine lokalen Umgebungen, `.git`, Mac-Abhängigkeiten, Buildausgaben oder privaten Canva-/Instagram-Originalordner:

```sh
cd /Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production
RELEASE_ID=$(git rev-parse HEAD)
ARCHIVE="/tmp/jammers-${RELEASE_ID}.tar.gz"
git archive --format=tar.gz --output="$ARCHIVE" "$RELEASE_ID" -- \
  .gitignore .gitattributes AGENTS.md package.json package-lock.json next.config.ts tsconfig.json \
  postcss.config.mjs eslint.config.mjs vitest.config.mts playwright.config.ts \
  app components config context data lib public scripts e2e deploy docs \
  assets/fonts assets/source/market-photos assets/source/google-market-photos assets/source/team-photos-safe \
  assets/source/preislisten assets/source/contact-brands
tar -tzf "$ARCHIVE"
shasum -a 256 "$ARCHIVE"
```

Archivliste vor Übertragung ansehen, insbesondere auf neue sensible Dateien in diesen Verzeichnissen. Die aufgeführten Quellordner sind versionierte, geprüfte Build-/Testquellen; private Rohordner bleiben ausgeschlossen. Die Google-Fotoquellen sind metadatenbereinigte, freigegebene Vollbild-JPEGs; Fotoidentitäten und Exportnachweise unter `.superpowers/` gehören nicht ins Paket. `public` wird als öffentlicher Inhalt behandelt. Der Proxy blockiert zusätzlich `/data/products` und `/data/products/*`, weil historische Extraktionsdateien keine aktuelle Sortiments-API sind. Niemals einen `file_server` auf die Releasewurzel konfigurieren.

Archiv gezielt an `159.69.37.200` übertragen und dort `sha256sum` mit dem vorherigen Hash vergleichen. Ziel ist ein **neues**, noch nicht verwendetes `/srv/trinkgut-jammers/releases/<vollständiger-Commit>/`; vorhandene Releases nicht überschreiben. `RELEASE_ID` und `RELEASE_DIR` in der Server-Shell ausdrücklich setzen. Auspacken und Installieren als `jammers`, nicht `npm` als root. Vor dem Build dürfen keine `.env`, `.env.local`, `.env.production` oder `.env.production.local` existieren.

## Linux-Build und Installation

Aus dem neuen Releaseverzeichnis als `jammers`, mit `/opt/node/bin` im `PATH`:

```sh
export PATH=/opt/node/bin:/usr/bin:/bin
unset CINEMATIC_E2E CINEMATIC_TEST_NOW
export NODE_ENV=production RENTAL_MODE=disabled NEXT_TELEMETRY_DISABLED=1
node --version
npm ci --include=dev
NODE_ENV=test npm test
npm run lint -- --quiet
npx next typegen
npx tsc --noEmit
npm run offers:check
npm run build
```

Nur der Unit-Testprozess erhält `NODE_ENV=test`, damit ausdrücklich markierte Datumsfixtures funktionieren. Build und Website bleiben im Produktionsmodus; dort werden Testuhren bewusst ignoriert. Nicht den Produktionsschutz abschalten, um Datums-Tests zu erzwingen.

Keine Mac-`node_modules` oder ungeprüfte Mac-`.next` hochladen: Sharp und SWC haben Linux-native Bestandteile. Der Build lädt die Schriften über `next/font/google` und benötigt Internetzugang. Der Prebuild prüft Quellen/Derivate und erstellt den historischen Manifest-Stub; keine privaten Originale nachfordern, um diese Kontrolle zu umgehen. Build/Test dürfen den laufenden Release nie verändern. Bei knappen 4 GB RAM nicht mehrere Builds gleichzeitig ausführen; Speicherfehler zuerst belegen, nicht die Inhaltsprüfung deaktivieren.

Dieses Projekt verwendet normales `next start`, **kein** `output: standalone`. Für das aktuelle Runtimepaket werden `.next`, Linux-`node_modules`, `package.json`, `next.config.ts`, `public`, `data/editorial`, **`data/weekly-offer-layout.json` und `data/weekly-offers.json`** sowie `assets/fonts/rental-document` erhalten; Lockfile/`tsconfig.json` ebenfalls mitführen. Die beiden Angebotsdateien sind zur Integritätsprüfung der Wochenmanifeste auch zur Laufzeit erforderlich; ohne sie wird das Paket zurückgehalten. Der Quellrelease darf für einfache Wartung vollständig bleiben, wird aber nicht als Webverzeichnis freigegeben. `npm prune --omit=dev` ist optional nach den Prüfungen; danach fehlen `tsx` und die Content-/Dispatch-Werkzeuge, weshalb redaktionelle Prüfläufe in einer getrennten vollständigen Arbeitskopie erfolgen müssen.

Als root anschließend den neuen Release root-eigen und nicht gruppen-/weltbeschreibbar machen; Ausführungsbits erhalten. Nur den Cache für `jammers` freigeben:

```sh
chown -R root:root "$RELEASE_DIR"
chmod -R go-w "$RELEASE_DIR"
install -d -m 0750 -o jammers -g jammers "$RELEASE_DIR/.next/cache"
chown -R jammers:jammers "$RELEASE_DIR/.next/cache"
install -m 0644 "$RELEASE_DIR/deploy/hetzner/trinkgut-jammers.service" /etc/systemd/system/trinkgut-jammers.service
systemd-analyze verify /etc/systemd/system/trinkgut-jammers.service
```

`WorkingDirectory` muss die Releasewurzel sein: Laufzeitdateien werden über `process.cwd()` gelesen. Der Dienst erlaubt nur Schreibzugriff auf `.next/cache` und sein privates temporäres Verzeichnis. Kein Mietdatenverzeichnis und kein schreibbares Contentverzeichnis sind für den gesperrten Informationsbetrieb nötig. Es wird kein Cron-Secret eingerichtet; zusätzlich weisen Fetch-/Cron-Handler autonome Aktualisierungen auch nach Authentifizierung zurück, weil diese kein vollständiges Wochenpaket erzeugen. Neue ISR-/Upload-/Bestellfunktionen benötigen eine separate Freigabe und Speicher-/Rechteprüfung.

## Umschalten, Proxy und DNS

Vor Umschaltung die bisherige Zieladresse notieren (`readlink -f /srv/trinkgut-jammers/current`, falls vorhanden). Den Symlink in derselben Partition atomar ersetzen und den Dienst neu starten; es gibt dabei einen kurzen Neustart, keine versprochene unterbrechungsfreie Bereitstellung:

```sh
test ! -e /srv/trinkgut-jammers/.current-new
test ! -L /srv/trinkgut-jammers/.current-new
ln -s "$RELEASE_DIR" /srv/trinkgut-jammers/.current-new
mv -Tf /srv/trinkgut-jammers/.current-new /srv/trinkgut-jammers/current
systemctl daemon-reload
systemctl enable trinkgut-jammers
systemctl restart trinkgut-jammers
systemctl is-active trinkgut-jammers
curl --fail --show-error --silent \
  --retry 10 --retry-connrefused --retry-delay 2 --retry-max-time 45 \
  --connect-timeout 2 --max-time 5 \
  http://127.0.0.1:3000/api/rentals/config
curl --fail --show-error --silent --connect-timeout 2 --max-time 20 \
  http://127.0.0.1:3000/api/content/flyers
ss -ltnp
```

Bei `Type=simple` bestätigt `systemctl is-active` nur den gestarteten Prozess, nicht die HTTP-Bereitschaft. Erst die erfolgreiche HTTP-Probe erlaubt den nächsten Prüfschritt. Sie wiederholt höchstens zehnmal, startet nach 45 Sekunden keinen weiteren Versuch und begrenzt jeden Versuch auf fünf Sekunden (insgesamt höchstens etwa 50 Sekunden). Bei einem Fehlercode abbrechen und den vorherigen geprüften Release wieder aktivieren; keine endlose Warteschleife. Dieselbe Bereitschaftsprobe nach Rollback und weiteren Dienstneustarts ausführen.

Erwartet: App nur `127.0.0.1:3000`; Mietkonfiguration `enabled:false`, `testMode:false`, `onlinePayment:false`. Flyerindex während des belegten Angebotszeitraums nicht `degraded`. Fehlgeschlagenen Start nicht als veröffentlicht melden: direkt vorherigen geprüften Release wieder aktivieren.

Caddy-Konfiguration vor Installation mit der tatsächlich installierten Version prüfen, dann root-eigen installieren und den Dienst kontrolliert starten/reloaden:

```sh
caddy validate --config "$RELEASE_DIR/deploy/hetzner/Caddyfile" --adapter caddyfile
install -m 0644 "$RELEASE_DIR/deploy/hetzner/Caddyfile" /etc/caddy/Caddyfile
systemctl enable caddy
systemctl restart caddy
systemctl is-active caddy
```

Der Proxy begrenzt Anfragen auf 1 MB sowie Header-/Bodyzeit auf 10/30 Sekunden. Die Antwortgrenze von 120 Sekunden und 90 Sekunden bis zum Upstream-Header lassen kalte Bildoptimierung zu; Bild- und PDF-Downloads sind nicht auf 1 MB begrenzt. Nexts eigene Cache-/Sicherheitsheader bleiben erhalten, und Streaming wird nicht ausdrücklich gepuffert. Kurzes Upstream-Keepalive vermeidet eine länger als Node offene Proxyverbindung. Das ist eine Startkonfiguration, kein Lasttest. Details siehe [Caddy-Serveroptionen](https://caddyserver.com/docs/caddyfile/options), [Request-Body-Limit](https://caddyserver.com/docs/caddyfile/directives/request_body) und [Reverse Proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).

Vor DNS-Änderungen alte Webwerte notieren. Nur A/AAAA für die Hauptdomain und das Webziel von `www` anpassen; IONOS-MX, SPF, DKIM und sonstige Mailkonfiguration unverändert lassen. Für beide Namen IPv4 **und** IPv6 prüfen; alte AAAA-Werte dürfen nicht zum alten Host führen. `www` kann per CNAME auf die Hauptdomain zeigen. Caddy benötigt eingehend TCP 80/443 und ausgehend DNS/HTTPS für Zertifikate. Erst passende DNS-Werte, erreichbare Webports und gültige Zertifikate erlauben die öffentliche Abnahme. Niemals `curl -k` oder eine Browser-Zertifikatsausnahme als HTTPS-Nachweis verwenden.

## Öffentliche Abnahme

```sh
curl --fail --show-error --silent -I https://trinkgut-jammers.de/
curl --show-error --silent -I https://www.trinkgut-jammers.de/angebote
curl --show-error --silent -I http://trinkgut-jammers.de/
curl --show-error --silent -o /dev/null -w '%{http_code}\n' https://trinkgut-jammers.de/data/products/manifest.json
curl --fail --show-error --silent https://trinkgut-jammers.de/api/rentals/config
```

Erwartet: Hauptseite erfolgreich, `www` → Hauptdomain per HTTPS, HTTP → HTTPS, Legacy-Pfad `404`, Miete deaktiviert. IPv4 und IPv6 zusätzlich separat mit `curl -4`/`curl -6` prüfen. Einmal Dienstneustart und danach dieselben Checks wiederholen. Nicht selbst Anfragen versenden, echte Personendaten eingeben oder Zahlungswege testen.

Aus einer vollständigen Tooling-Arbeitskopie desselben Commits (die CLI schreibt lokale Prüfberichte):

```sh
npm run audit:public -- --url https://trinkgut-jammers.de --output /tmp/jammers-live-http-audit.json
npm run content:check -- --url https://trinkgut-jammers.de
```

Die HTTP-Prüfung enthält neben GET/HEAD nur leere, unautorisierte Ablehnungsproben der geprüften Endpunkte; keinen autorisierten Refresh oder Bestellversand. `source-config.json.publicUrl` muss die tatsächlich bestätigte Hauptorigin enthalten, sonst bleibt `deploymentVerified` trotz `--url` falsch. Zusätzlich Desktop/Mobil visuell prüfen: `/`, Angebote/Sortiment, DE/NL-Handzettel, Bilder/PDFs, Navigation, Kontakt/Impressum/Datenschutz und der Anfrageweg mit dem richtigen E-Mail-Empfänger. Ein Mailto-Link ist kein Zustellnachweis. APIs/HTML dürfen keine internen Canva-Design-URLs oder privaten Provenienzdateien offenlegen.

## Wochenpflege, Rollback und Sicherungen

Aktuell hinterlegte DE-/NL-Originale gelten nur vom **05.–10.10.2026**. Danach verschwinden sie datumsgerecht; für den 12.10. ist ein neues Paket erforderlich. Ein Server oder Git-Push erzeugt keine künftige Werbung. Die vorhandenen Codex-Aufgaben (Sonntag 17:00 Vorbereitung, täglich 06:15 Kontrolle, Europe/Berlin) laufen weiterhin Mac-/App-abhängig; dieses Deployment installiert keinen unabhängigen Canva-/Instagram-Import und keinen Cronjob.

Redaktion in einer separaten Arbeitskopie nach `CONTENT-UPDATE-RUNBOOK.md`: DE und datumsrichtige einzelne NL-Seite prüfen, alle Angebotsschnitte kuratieren, Originale/Cover/Kacheln versionsgebunden als Wochenpaket prüfen, neuen Release bauen und veröffentlichen. Der öffentliche Loader hält unveränderlich geprüfte Pakete pro Produktionsprozess; die aktive Auswahl folgt weiter der echten Berliner Zeit. Clients erhalten dieselbe öffentliche Auswahl initial und über die lesende Angebots-API, keine rohe Angebotsdatei im Client-Bundle. Neue Datenversionen benötigen den gemeinsamen Neubuild mit Neustart; bereits vollständig ausgelieferte Zukunftspakete aktivieren sich zur Datumsgrenze automatisch. Offene Tabs aktualisieren beim Sichtbarwerden und regelmäßig, entfernen abgelaufene Daten und verwerfen verspätete alte Antworten. Nicht im laufenden `current` editieren. Fetch-/Cron-Refresh ist kein vollständiger Paketimport und bleibt gesperrt.

Für Rollback die vorher notierte, unveränderte Releaseadresse als `RELEASE_DIR` setzen; denselben atomaren Symlinkwechsel und `systemctl restart trinkgut-jammers` ausführen, dann lokale/öffentliche Checks wiederholen. Alte Assets in offenen Tabs können nach einem Wechsel einen Reload benötigen. Mindestens den letzten geprüften funktionierenden Release behalten; keine laufenden oder für Rollback benötigten Verzeichnisse löschen. Datumsgebundene Werbung aus einem alten Release wird beim Rollback **nicht** wieder aktuell.

Hetzner-Backups und ein Git-Commit ersetzen keine Wiederherstellungsprüfung. Inhaltspakete, Release-ID, Node-/Caddy-Version, installierte Konfiguration und DNS-Rückfallwerte dokumentieren; SSH-Privatschlüssel bleiben ausschließlich in der bestehenden sicheren Schlüsselablage. Flüchtige Journale und die neue Fail2ban-Datenbank nicht als Backupinhalt darstellen. Alte Bootstrap-Logs oder vor der Umstellung erstellte Fail2ban-Datenbankkopien können andere Aufbewahrungszeiten haben. Rechtliche/vertragliche Abnahmen, insbesondere AVV, separat belegen; diese Anleitung behauptet keinen Vertragsabschluss.
