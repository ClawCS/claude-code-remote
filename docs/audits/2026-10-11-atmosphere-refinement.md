# Atmosphärischer Feinschliff — lokale Abnahme, 11.10.2026

## Umfang und Ergebnis

Die fünf freigegebenen Gestaltungsschritte sind unter `http://127.0.0.1:3110/` umgesetzt. **Kein Hetzner-Deployment.** Öffentlicher App-Stand laut letztem Releasebericht bleibt `2370b8202fe98b2251cd3426e0bbe4fb3a0d29c2`; dieser Auftrag hat weder Server noch öffentliche Inhalte verändert.

1. Sichtbare Werbefilm-Unterschrift und Leerband entfernt. Der mindestens 44 px große Abspiel-/Pauseknopf sitzt im Video. Screenreader-Beschreibung, Fehlerstatus, Save-Data-/Reduced-Motion-/Sichtbarkeitsschutz bleiben.
2. Drei Einstiegskarten: Angebote in Jammers-Rot, Partyplanung mit warmem Gartenmotiv, Besuch mit hellem Marktbild. Karten, Kontakt und separates originales Maps-Symbol behalten ihre Ziele. Handzettel-Covers werden ausschließlich aus dem zeitgeprüften Homepage-Adapter übernommen; DE/NL/Einzelausgabe/Leerzustand getestet.
3. Freigegebenes Gartenparty-Motiv mit Jammers-Logo statt Bierkistenfoto beim Partyservice. Vollständiges Bildverhältnis im Service, kurzer Text und Links zu Vermietung, Mengenplanung und Beratung. Keine neue Bestands-/Reservierungszusage. Generiertes Werbemotiv, keine tatsächliche Mitarbeiter- oder Veranstaltungsaufnahme.
4. Vier Warengruppen ohne Bildmatten und Nummerierung, individuell geprüfte Bildschwerpunkte und warme Farbbänder. Vier Spalten auf Desktop, zwei mobil; Namen stets sichtbar. Originaldateien unverändert; keine Flyer oder Poster beschnitten.
5. Gemeinsame warme Intro-/Kapitelakzente auf Unterseiten, lesbare weiße Arbeitsflächen bei Formularen und Preisen. Dekorative SVG-Pfeile ersetzen die auf iOS als blaue Emoji-Kacheln dargestellten diagonalen Pfeile. Originale Social-/Maps-Logos unverändert.

Bildquelle und SHA-256: `assets/source/party-scenes/provenance.json`. Original-PNG archiviert; WebP 1672 × 941 px, 247.230 Bytes. Keine weitere Generierung bei dieser Einbindung.

## Verifikation

- `NODE_ENV=test npx vitest run --exclude 'services/applications/**' --exclude '.superpowers/**'`: **105 Dateien, 1.677 Tests bestanden**, nach letzter UI-Änderung.
- Zusätzliche Service-/Seitenverträge nach explizitem Alt-Attribut: **32/32 bestanden**.
- `npx tsc --noEmit`: bestanden.
- `npm run lint`: **0 Fehler, 21 bestehende Warnungen** außerhalb dieses Feinschliffs. Neue Alt-Prop-Warnung beseitigt; betroffene Komponente separat ohne Warnung geprüft.
- `npm run build`: bestanden, einschließlich Herkunfts-/Inhaltsprüfung und 120 vorgerenderter Seiten. Build/Betrieb in Production ohne Testuhr.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3110 npx playwright test e2e/atmosphere-refinement.spec.ts e2e/cinematic-film-home.spec.ts --grep-invert 'near-white|equal-width complete' --workers=1`: **14/14 bestanden**.
- Darin: 390/768/1440 px; Filmknopf im Video ohne Leerband; Servicebild geladen/unbeschnitten; Karten-/Kategorieziele; keine Emoji-Pfeile oder horizontalen Überläufe; axe-Prüfung der neuen Einstiege und des Servicebereichs. Acht Unterseiten mit gemeinsamem Intro, genau einer H1 und ohne Überlauf: Angebote, Produkte, Bier, Partyplaner, Vermietung, Akademie, Bewerbung, Kontakt.
- Filmprüfungen für Reduced Motion, Save Data und Medienfehler bestanden. Zwei ältere Browserfälle verlangen zwingend aktive DE/NL-Ausgaben; am tatsächlichen Sonntag 11.10. nicht als aktuelle Werbung fingiert. Filmgeometrie im neuen Test unabhängig vom Wocheninhalt geprüft; Flyer-Permutationen im Unit-Test. Werbung der Vorwoche bleibt nach Ablauf ausgeblendet.
- Unabhängiger Read-only-Review ohne bestätigten kritischen, wichtigen oder kleinen Befund. Zusätzlich Kartenansichten bei 360/390/768/820/1024/1440 px, Herkunftshashes, Datumsadapter, Fokus und Ziele geprüft. Kein echter Safari-/iOS-/Screenreader-Labortest behauptet.
- `git diff --check` bestanden. Dev-Ansicht localhost:3000 und fertige Vorschau 127.0.0.1:3110 kontrolliert.

## Bestehende Grenzen und fehlgeschlagene Läufe

Der Bewerbungsdienst ist **nicht** durch diese Designabnahme freigegeben. Baseline `npm test`: 3.141 bestanden, 6 fehlgeschlagen, 15 übersprungen; vier Suitefehler. Drei native Suiten benötigen die nicht gesetzte/geprüfte `APPLICATIONS_TEST_QPDF`-Voraussetzung für QPDF 12.4.2. Die vierte war eine fremde Playwright-Scratchdatei unter `.superpowers`, die der pauschale Vitest-Lauf mitentdeckte.

Ein weiterer breiter Lauf mit Dateifiltern `lib components app` erfasste unbeabsichtigt auch `services/applications` (Teilstring `app`). Dort zusätzlich drei 5-Sekunden-Timeouts bei gleichzeitigem Build/Browserlauf: Auth, Custody-Erasure und Neveraccepted-Erasure. Alle drei anschließend separat mit einem Worker und unveränderten Standardtimeouts bestanden (3 bestanden, 216 gezielt nicht ausgewählt). QPDF-Voraussetzung bleibt offen; keine Installation, Sicherheitskonfiguration oder Uploadaktivierung.

Ältere UI-Vertragstests erwarteten das ersetzte Bierfoto, sichtbare Filmcaption bzw. gar keine SVGs; eng auf die neuen Anforderungen aktualisiert. Beratung und fehlende Reservierungszusage weiterhin getestet. Ein paralleler Lintlauf traf eine kurzlebige Testdatei; seriell wiederholt und bestanden.

Keine echten Formulare versandt, E-Mails/Zahlungen/Löschungen ausgelöst. Wochenpakete, Mietberechnung, Bewerbungsbetrieb und Hosting-/Sicherheitseinstellungen unverändert. Fremde historische Screenshots, Bewerbungs-Auditnotizen und Content-Laufberichte unberührt und nicht mitgestaged.

## Sichtnachweise und nächster Schritt

`audit/screenshots/atmosphere-refinement-2026-10-11/`: jeweils Quicklinks, Service und Kategorien bei 390/768/1440 px, aufgenommen am fertigen lokalen Produktionsbuild. Nutzer-Screenshots unverändert.

Nächster Schritt: lokale Designbetrachtung durch Niko. Veröffentlichung benötigt Freigabe und regulären frischen Linux-Release nach Deployment-Runbook; Git-Push ist keine Live-Schaltung.
