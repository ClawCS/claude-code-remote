# Website-Veröffentlichung – 10. Oktober 2026

## Ergebnis und Grenze

Die geprüften Website-Änderungen sind auf **https://trinkgut-jammers.de** veröffentlicht. Die Umschaltung und erste HTTP-Bereitschaftsprüfung erfolgten am 10.10.2026 um **09:52 UTC / 11:52 Europe/Berlin**. Ein weiterer kontrollierter Next-Neustart bestand bis 09:56:01 UTC erneut die Bereitschafts-/HTTPS-Prüfung.

Dies ist **keine Freischaltung des Bewerbungsuploads**. Nikos Auftrag, den Server mit den fertigen Website-Änderungen zu aktualisieren, wurde innerhalb seiner weiterhin gültigen Grenze „Vorerst keine Sicherheitskonfiguration ändern“ umgesetzt. Keine AppArmor-, Firewall-, SSH-, Caddy-, Unit- oder Logging-Konfiguration geändert; keine Bewerbungsdienste aktiviert. Kein Scanner-/Dokumenten-Betriebstest, SMTP/IMAP, Zahlungsaufruf, reale Bewerbung oder Datenlöschung ausgelöst. Der getrennte Bewerbungsabschluss bleibt wegen ausstehender Betriebs-/Sicherheitsnachweise und Providerangaben offen.

## Reproduzierbarer Release

- App-Commit: `ef95c0204c2679660ed0fca684ebb5e81069a603`, Branch `codex/cinematic-production`; vor Paketbildung mit Origin identisch.
- Ziel: `trinkgut-jammers-web-01`, ausschließlich `159.69.37.200`.
- Neues Verzeichnis: `/srv/trinkgut-jammers/releases/ef95c0204c2679660ed0fca684ebb5e81069a603`.
- Vorheriger geprüfter Release und unverändert erhaltenes Rückrollziel: `/srv/trinkgut-jammers/releases/b2383232fb5dfdb3a25a96d01995d470b0a54889`.
- Positiv gefiltertes Git-Archiv, keine schmutzige Worktree-Kopie. SHA-256 lokal und auf Ziel identisch: `6abd1eef08d14bb5b67f04e568937975455fb6f55eff69229586837e2195e865`.
- Archiv enthält zusätzlich die erforderlichen versionsgebundenen `patches` und Backendquellen für vollständige statische Prüfung. Keine Umgebungsdateien, Zugangsdaten, private Quellen, Git-Historie oder lokale Build-/Abhängigkeitsverzeichnisse.
- Linux-Abhängigkeiten und Build als Benutzer `jammers`; anschließend nur das neue Release root-eigen/nicht gruppen- oder weltbeschreibbar gemacht. Ausschließlich `.next/cache` für den bestehenden Webbenutzer schreibbar.
- `current` atomar umgeschaltet; nur bestehende Next-Unit neu gestartet. Kein Bootstrap, Caddy-Neustart, `daemon-reload`, DNS-Eingriff oder zusätzliche Buchung.

Eine unabhängige Nur-Lese-Gegenprüfung des Kandidaten fand keinen in-scope Quellblocker für diese begrenzte Website-Veröffentlichung. Der vorhandene Deployment-Runbook wurde um die ausdrückliche Trennung zwischen Web- und noch gesperrtem Bewerbungsbetrieb ergänzt.

## Prüfungen auf dem Zielserver

Node `22.23.3`, Next `16.3.8`. Installation mit `npm ci --include=dev --ignore-scripts`; ausschließlich den geprüften lokalen ImapFlow-Patch explizit ausgeführt. Der Patch verändert lokale Paketdateien, stellt keine Postfachverbindung her.

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| `NODE_ENV=test npm test -- lib --maxWorkers=2` | 1.529 Tests in 91 Dateien bestanden, 98,24 Sekunden |
| `npm run lint -- --quiet` | Exit 0 |
| `npx next typegen`, `npx tsc --noEmit` | Exit 0 |
| `npm run offers:check` | 128 Originalangebote mit Bildern bestanden |
| `npm run build` | Exit 0; Produktionskompilierung, Typprüfung und 120 statische Seiten erfolgreich |
| `npm audit --omit=dev --json --ignore-scripts` | Keine gemeldeten Produktionsabhängigkeits-Advisories |

Die Installation meldete fünf Advisories in Entwicklungsabhängigkeiten. Das Produktions-Audit zeigte null; daraus wird weder ein bereinigter Entwicklungsbaum noch allgemeine Sicherheitsfreiheit abgeleitet. Keine automatische Abhängigkeitskorrektur im Release vorgenommen.

Dies ist ausdrücklich die **Linux-Web-Teilprüfung**. Der separat dokumentierte vorherige lokale Gesamtprojektlauf mit 3.108 Tests in 139 Dateien bleibt ein lokaler Nachweis und wird nicht zur Linux-Abnahme der Bewerbungsdienste umgedeutet. Kein ungefilterter Backend-/Native-/Scannertest auf diesem Server.

Build/Betrieb mit Produktionsmodus und deaktivierter Miete; keine Testuhr. Die erste unmittelbare HTTP-Probe nach jedem Neustart traf kurz auf einen noch nicht geöffneten Port; die vorgesehene begrenzte Wiederholung bestand. Kein Rollback erforderlich. Der abschließende Dienstzustand war `active/running`, automatische Neustarts `NRestarts=0`.

## Öffentliche Abnahme

- `audit:public -- --url https://trinkgut-jammers.de`: **117 Seiten, 2.820 lokale Ressourcen, fünf absichtlich unbekannte Seiten und 31 API-Verträge**, null Fehler/Warnungen. 1.117 externe Links bewusst nicht abgerufen. Nur lesende Aufrufe und leere, unautorisierte Ablehnungsproben; kein Versand.
- HTTP-Rohbericht lokal: `/tmp/jammers-live-http-audit-2026-10-10.json`; Prüfstart `2026-10-10T09:52:38.509Z`; SHA-256 `120b30d66a7b2eeee7d3587e35f67c63a991190d101c58694f9752890eb172c6`.
- `content:check -- --url https://trinkgut-jammers.de`: `status:ok`, `websiteVerified:true`, `deploymentVerified:true`, keine Fehler/Warnungen. Bericht: `audit/content-runs/2026-10-10T09-52-39-945Z-check-3ddc14a7.json`.
- DE/NL-KW41 unverändert mit tatsächlicher Gültigkeit **05.–10.10.2026**; DE 18 Seiten/107 Angebote, NL genau eine Seite/21 Angebote. Ausgelieferte Originale/Cover/Kacheln öffentlich geprüft, kein Import einer Ersatzwoche und keine Preisverlängerung.
- HTTPS-Hauptseite 200, IPv4 und IPv6 jeweils 200; HTTP → HTTPS 308; www → Hauptdomain mit gleichem Pfad 301; historischer öffentlicher `/data/products/manifest.json`-Pfad weiterhin 404.
- Miete `enabled:false`, `testMode:false`, `onlinePayment:false`.
- Neue öffentliche `/api/bewerbung/config` jetzt HTTP 200, ausdrücklich `enabled:false` und `mode:disabled`; leerer POST `/api/bewerbung` erwartet 503. Keine Backendfreischaltung.
- Caddy SHA-256 vorher/nachher identisch: `fbdf74b2f94dedb319e885110e31179219a3b448f3d65f1018b503e5eeb038ef`.
- Bestehende Next-Unit SHA-256 vorher/nachher identisch: `e9d9ba135d9e7f70119ccae175f12bedd64337c083e7efff0a96d1ad22cb1dfa`.
- Listener unverändert: Next nur auf Loopback 3000; keine öffentlichen Bewerbungsports.

## Browser-Nachweis und sichtbare Änderungen

Die echte HTTPS-Website wurde im Browser nach dem Wechsel neu geladen, zusätzlich bei 390 × 844 Pixeln geprüft; temporäre Größenüberschreibung danach zurückgesetzt.

- Startseite mit bestehenden Fotos, Teamfoto-Platzhalter und unveränderter Gestaltung; neuer Jobs-Link im Footer sichtbar.
- Jobs-Seite mit Vollzeit/Teilzeit bis 150 Stunden, richtigem `info@trinkgut-jammers.de` und ausdrücklichem Upload-Ausfallhinweis; keine Eingabefelder für einen vermeintlich freigegebenen Upload.
- Rezepte-&-Wissen-Menü öffnet und führt zur Getränkeakademie; Kursbilder laden. Akademie enthält die geprüften Quiz-/Abschlusskorrekturen und zurückhaltende Hinweise auf externe Weiterbildungen.
- Mobile Sortimentssuche: 128 Angebote, Eingabe „Bayreuther“ reduziert auf ein Angebot. Mobile Navigation öffnet und führt korrekt zu Angebote.
- Angebote mobil untereinander; DE- und NL-Cover vollständig geladen, kein horizontaler Überlauf (DOM 382/382 Pixel Nutzbreite im 390-Pixel-Viewport).
- Partyplaner berechnet bei 20 Gästen/5 Stunden eine unverbindliche Liste; Tastaturänderung auf 25 Gäste entfernt das alte Ergebnis sofort. Keine Übernahme in Anfragen und kein Versand. Browserkonsole in dieser Stichprobe ohne Fehler/Warnungen.
- NL-Einstieg mit orangefarbenen Akzenten, sichtbarem Angebotsbutton und offiziellem Maps-Symbol, korrekter Adresse und bestehenden Markt-/Teamansichten.
- Die Homepage bleibt als Ergebnis im Browser geöffnet. Keine pauschale vollständige manuelle Prüfung jedes einzelnen Formularzustands behauptet; der HTTP-Crawl und die genannten Browser-Stichproben sind getrennte Nachweise.

## Weiterhin offen / unverändert

Bewerbungsportal einschließlich vollständiger Fallverwaltung, Linux-Isolation, Scanner-, Mail-, Restore-/Löschabnahme und begrenztem Praxistest bleibt gesperrt. Keine Sicherheitsänderung aus dieser Veröffentlichung ableiten. IONOS-Wiederherstellungs-/Archivierungsangaben klärt Niko selbst. Newsletter und Zahlungen werden durch diesen Release nicht aktiviert. Fremde Screenshots, frühere Auditänderungen und private Quelldaten bleiben unangetastet. Dokumentationscommits nach diesem Bericht ändern die oben genannte App-Release-ID nicht.
