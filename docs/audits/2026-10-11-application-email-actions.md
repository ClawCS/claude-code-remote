# E-Mail-Einstiege für Verkaufsbewerbungen

## Auftrag und Umfang

Niko verlangt bei ausgeschaltetem Bewerbungsupload unter den beiden Anzeigen für Vollzeit und Teilzeit einen sichtbaren E-Mail-Einstieg wie bei der Ausbildung. Empfänger bleibt `info@trinkgut-jammers.de`.

App-Commit: `2370b8202fe98b2251cd3426e0bbe4fb3a0d29c2`.

- Vollzeit: „Per E-Mail für Vollzeit bewerben“, Betreff „Bewerbung Verkauf Vollzeit“.
- Teilzeit: „Per E-Mail für Teilzeit bewerben“, Betreff „Bewerbung Verkauf Teilzeit“.
- Die Ausbildung ist unverändert. Bei später tatsächlich aktivierter Upload-Konfiguration bleiben die bisherigen Formularauswahl-Buttons mit Sperre während laufender/angenommener Übermittlung erhalten.
- Die E-Mail-Links sind bereits im serverseitigen HTML enthalten und benötigen kein JavaScript. Sie öffnen das konfigurierte E-Mail-Programm; sie sind kein Versand- oder Zustellnachweis.

Keine Upload-, Postfach-, Zahlungs-, Miet-, Lösch- oder Sicherheitsaktivierung. Keine Korrektur weiterer Befunde aus dem getrennten Projektaudit.

## Lokale Prüfung

- Test-first: die zwei neuen SSR-Prüfungen scheiterten vor der Änderung an den fehlenden Links; nach der Änderung alle acht UI-Vertragstests bestanden.
- Vollständige Web-Partition: `NODE_ENV=test npx vitest run lib app --exclude 'services/**'` — 103 Dateien, 1.662 Tests bestanden, einschließlich der beiden browsergestützten Film-/Flaschenbühnen-Dateien.
- Bewerbungs-Browsermatrix: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test e2e/application-form.spec.ts` — 22 Fälle bestanden. Enthält Disabled/No-JS, Enabled-/Pilot-Konfiguration, Tastaturauswahl und bestehende Wiederholungs-/Sperrzustände; sämtliche simulierten Übermittlungen abgefangen, keine echten Bewerbungen oder E-Mails.
- ESLint ohne Fehler, TypeScript und Produktionsbuild bestanden.
- Lokales HTML und tatsächlicher Browser zeigen beide korrekten Links. Bei 390 px Bildschirmbreite kein horizontaler Überlauf; Linktexte vollständig sichtbar.
- Unabhängige, rein lesende Prüfung des Drei-Dateien-Diffs: keine regressionsrelevanten Befunde.

## Veröffentlichung

Aktiviert am **11.10.2026, 00:21:59 Europe/Berlin** (10.10.2026, 22:21:59 UTC) unter `https://trinkgut-jammers.de/bewerbung`.

- Frisches Linux-Webrelease: 101 Testdateien / 1.637 Tests bestanden, Lint, Typgenerierung, TypeScript, 128 Originalangebote und Produktionsbuild bestanden. Die zwei im Runbook benannten Browserdateien wurden ausschließlich auf Linux ausgelassen; lokal sind sie in den 1.662 Tests enthalten. Keine native Bewerbungsqualifikation oder Bewerbungsdienste ausgeführt.
- Aktivierungsskript unabhängig geprüft, atomarer Wechsel mit ERR-Rollback und begrenzter HTTP-Bereitschaftsprüfung. Nur die bestehende Next-Unit neu gestartet. Caddy- und Unit-Hashes vor/nachher identisch; Dienst aktiv, `NRestarts=0`.
- Öffentliche HTTPS-Antwort und Browser zeigen Vollzeit, Teilzeit und Ausbildung mit den jeweiligen korrekten Mailto-Zielen. Auch bei 390 px kein horizontaler Überlauf, keine Dateieingabefelder. Kein E-Mail-Programm geöffnet, keine Bewerbung gesendet.
- Bewerbungs-API unverändert `enabled:false`, `mode:"disabled"`; Mietflags `enabled:false`, `testMode:false`, `onlinePayment:false`.
- `audit:public`: 117 Seiten, 1.625 lokale Dateien, fünf unbekannte Routen und 31 API-Verträge geprüft; null Fehler, null Warnungen. Die Anzahl der aktiven Angebotsdateien ist am Sonntag geringer als im vorherigen Wochenlauf; kein künstliches Datum gegen Produktion.
- `content:check -- --url https://trinkgut-jammers.de`: `status:ok`, `websiteVerified:true`, `deploymentVerified:true`, keine Fehler/Warnungen. KW 41 ist am aktuellen Berliner Sonntag regulär abgelaufen; keine alten Angebote verlängert oder neue Werbung im Rahmen dieses Link-Fixes importiert.
- Beleg im Repository: `audit/content-runs/2026-10-10T22-22-17-514Z-check-7a355a4b.json`. Lokale technische Belege: `/tmp/jammers-email-{webtests,build,linux-build,public-audit,content-check}.log`; Browserbild `.superpowers/application-email-actions-2026-10-11/live-email-links.png`.

Quellarchiv SHA-256: `501ef42d352f76c7fb2c1792e288ca03191a76f301900eb5336f7b7e80120b20`. Positivfilter gemäß Deployment-Runbook; keine lokalen Umgebungsdateien oder privaten Rohordner. Bisheriger geprüfter Live-Release und Rückrollziel: `8c14f8580ad7b09164548021512f132e4fa7b610`.

Nach erfolgreichem Release nur das in diesem Auftrag übertragene temporäre Quellarchiv mit Hashkontrolle entfernt. Keine alten Releases gelöscht. Rund 2,3 GiB freier Plattenplatz verbleiben; vor dem nächsten vollständigen Release Speicher-Vorprüfung durchführen und eine gezielte Bereinigung alter, nicht mehr benötigter Releases abstimmen.
