# Freigegebene Instagram-Gewinnspielcover — 05.10.2026

## Freigabe und Umfang

Nikos ausdrückliche Antwort: „freigabe instagram, hol sie aus insta und render diese“. Die sechs im vorherigen redaktionellen Bericht noch zurückgehaltenen eigenen Originalbeitragsbilder sind damit freigegeben. Diese spätere Freigabe ersetzt die damalige offene Quellenfrage; der frühere Bericht bleibt als Historie unverändert.

- März: grüne Monster-Energy-Cooler-Version.
- August: Salitos SUP Wood Edition.
- September: Veltins Mini Cooler und zwei Kisten Helles Lager.
- Guinness: Tasche und vier Dosen.
- Oktober: Everdure KILN R Staropramen Edition.
- Sonderaktion: Disaronno Liegestuhl und Flasche.

Alle 15 derzeit belegten Gewinnspiele haben damit Originalcover. Es wurden weder zukünftige Gewinne erfunden noch Teilnahmefristen verändert. Rot, Hero, Navigation, Kartenlayout und übrige Website unverändert.

## Herkunft und Verarbeitung

Die bereits regulär aus den vollständigen Instagram-Beiträgen heruntergeladenen JPEGs wurden wiederverwendet. Vier Originale stammen aus der Recherche vom 30.09., zwei vom 05.10. Kein erneuter Download wird behauptet. Alle sechs erneut visuell sowie unabhängig durch einen zweiten Prüfer kontrolliert: Gewinn/Motiv, Maße und SHA-256 entsprechen den gesicherten Originalbelegen.

WebP-Derivate bei Qualität 92 ohne Größenänderung, Beschnitt, zusätzliche Beschriftung oder andere Motivänderung; keine EXIF-/XMP-/ICC-Metadaten. Originalmaße unverändert zwischen 1405×1874 und 1448×1931. Die Website lädt lokale Dateien, keine signierten Instagram-CDN-URLs oder eingebetteten Instagram-Frames. Die vorhandene Next-Bildoptimierung liefert passende responsive Größen.

Öffentlicher, nicht personenbezogener Herkunftsnachweis: `data/editorial/giveaway-instagram-covers.json`. Private Originale und Freigaben bleiben in `assets/source/giveaways/`, außerhalb des Git-Commits. Instagram-Motive werden nicht als Canva-Exporte ausgegeben; Canva bleibt unverändert verbunden. Die zwei neuen Oktoberposter sind laut Quellpost als KI-Inhalte gekennzeichnet; dies sind übernommene eigene Werbemotive, keine in diesem Auftrag erzeugten Bilder oder reale Marktfotografie.

Die Quellenregel in `AGENTS.md` und das Gewinnspiel-Runbook sind aktualisiert. Die bestehende aktive Monatsaufgabe verweist bereits auf beide Dateien und berücksichtigt dadurch die Freigabe; kein doppelter Zeitplan angelegt oder bestehender Termin geändert.

## Prüfung

- Sieben neue Bildtests zunächst rot: sechs fehlende gerenderte Cover und fehlender Integritätsnachweis. Nach Integration grün.
- Eine alte September-Testannahme verbot sämtliche Oktoberbilder. Nach Quellen-/Datumsabgleich auf tatsächlich nicht angekündigte November-/Dezembermotive eingegrenzt; weiterhin ausdrücklich keine Oktoberaktion im aktiven Septemberbereich. Zusätzlicher Test trennt beide aktiven Oktobercover und vier ältere Instagram-Cover im Archiv.
- **66 Testdateien, 975 Tests bestanden.** `npx tsc --noEmit`, `npm run assets:market:check` und Produktionsbuild mit **228 statischen Seiten** erfolgreich. Fokussierter ESLint-Lauf ohne Fehler oder Warnungen.
- HTTP 200 für `/`, `/gewinnspiel`, `/gewinnspiel/archiv`, alle sechs WebP-Dateien und die optimierte mobile Bildausgabe. Startseite zeigt beide laufenden Oktobercover; Jahresagenda enthält die Monatsmotive; Archiv enthält die vier älteren Instagrammotive mit abgelaufenem Status.
- Desktop im In-App-Browser: beide aktuellen Originalmotive sichtbar, korrekte Postlinks, natürliche Proportionen und `contain`.
- Mobil im In-App-Browser bei tatsächlichen 390×844 Pixeln: vollständiges Everdure-Poster sichtbar, kein Horizontalüberlauf, Seitenverhältnis erhalten. Temporäre Größenänderungen zurückgesetzt. Ein separater Chrome-Prüflauf blockierte `/_next/image` clientseitig mit `ERR_BLOCKED_BY_CLIENT`; der Bildserver lieferte HTTP 200. Diese Chrome-Umgebung wird nicht als erfolgreich geprüfte Bildanzeige ausgegeben; keine Browser-Schutz-/Blockiereinstellungen verändert.
- Screenshots: `audit/screenshots/instagram-covers-2026-10-05/`. Vorbestehende 32 Audit-PNG-Änderungen und zwei alte unversionierte Content-Berichte unverändert bewahrt.

## Bereitstellung

Geprüfter lokaler Stand auf `codex/cinematic-production`. Nur eigene Quellenzuordnung, Web-Derivate, Tests und Dokumentation zur GitHub-Sicherung vorgesehen. Kein öffentlicher Server, kein öffentlicher HTTPS-Nachweis; keine Änderungen an Instagram- oder Canva-Inhalten, keine E-Mails oder Zahlungen.
