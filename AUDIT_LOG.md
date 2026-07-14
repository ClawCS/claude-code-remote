# AUDIT LOG — Trinkgut Jammers Weltklasse-Relaunch

Stand: 13.07.2026, Phase 0
Branch: codex/p0-bestandsaufnahme
Gate-Status: G0 PASS — von Niko am 13.07.2026 bestätigt

## Schweregrade

- P1 Blocker: verhindert den nächsten Gate-PASS oder einen verantwortbaren Launch.
- P2 Major: muss vor dem zugeordneten Gate behoben oder ausdrücklich freigegeben werden.
- P3 Minor: Qualitätsmangel ohne unmittelbare Blockade.

## G0 — Versionsklärung

| Kriterium | Aktiver Kandidat | Alter Kandidat |
|---|---|---|
| Pfad | /Users/niko/Desktop/Homepage/trinkgut-jammers-v2 | /Users/niko/Desktop/Claude Code/trinkgut-jammers-v2 |
| Branch | claude/create-new-repo-EnwI8 | claude/create-new-repo-EnwI8 |
| HEAD vor P0-Branch | 87e1145, 04.07.2026 | 966d9b6, 04.05.2026 |
| Remote-Abstand nach fetch | 0 voraus / 0 zurück | 0 voraus / 60 zurück |
| Jüngste relevante Quelldatei | components/HandzettelSection.tsx, 10.07.2026 | Quellenstand 04.05.2026 |
| Dateien ohne Git/Build/Dependencies | 343 | 187 |

Entscheidungsvorschlag: /Users/niko/Desktop/Homepage/trinkgut-jammers-v2 ist nach der verbindlichen Entscheidungsregel der aktive Stand. Der Ordner unter Desktop/Claude Code ist ein 60 Commits älterer Klon derselben Remote-Branch und enthält keine lokalen Commits, die dem aktiven Stand voraus sind.

Ausgeführt und verifiziert: Der alte Ordner ist unter /Users/niko/Desktop/Claude Code/trinkgut-jammers-v2_ARCHIV_2026-07-13 archiviert. Sein HEAD bleibt 966d9b6; er wurde nicht gelöscht oder inhaltlich verändert.

Wichtiger Worktree-Hinweis: Bereits vor dieser Prüfung zeigte Git im aktiven Ordner 14 gelöschte, getrackte PNGs unter public/images/Expertise Liköre (A5)/. Diese Änderungen stammen nicht von Codex und wurden weder repariert noch gestaged.

## Findings

### P0-001 — P1 — G0 wartet auf Ordnerfreigabe

Status: behoben und verifiziert am 13.07.2026

Niko hat /Users/niko/Desktop/Homepage/trinkgut-jammers-v2 als alleinige Arbeitsbasis bestätigt. Der alte Klon ist unter dem vereinbarten Archivnamen erhalten.

### P0-002 — P2 — Instagram-Brandinput fehlt

Status: offen bis spätestens G1

Es existiert kein brand-input/instagram-Verzeichnis. Der öffentliche Browserzugriff liefert nur ein eingeschränktes Profil und verlangt Anmeldung. Benötigt werden Grid-Übersicht plus 5–10 Top-Posts oder ein freigegebener eingeloggter Zugriff.

### P0-003 — P2 — Kein freigegebenes CI-Masterpaket

Status: offen bis G1

Vorhanden sind zwei SHA-identische, opake Rasterlogos mit weißem Hintergrund. SVG/Vektorlogo, CI-Handbuch, freigegebene Hausschriften und Nutzungsnachweise fehlen. Die aus dem Raster belegten Pixelmodi stehen in assets/INVENTAR.md und sind keine offizielle Markenfreigabe.

### P0-004 — P2 — Bildpool deckt Weltklasse-Bildsprache nicht ab

Status: offen bis G1/G4

13 Teamfotos und sechs Eigenmarken-Produkte sind nutzbar, aber Rollen-Zuordnung und Einwilligungen sind unbestätigt. Es gibt kein eigenständiges Außen-, Gebäude-, Marktinnenraum- oder Videoasset. 110 Produktbilder sind kleine Handzettel-Crops und nicht Hero-tauglich.

### P0-005 — P1 — Veraltete Preise werden als aktuell/verfügbar behandelt

Status: offen; vor öffentlichem Launch zu beheben

Der Katalog enthält 107 Produkte aus KW19/KW20 2026, alle mit inStock=true. Handzettel und Teile der UI bezeichnen alte Mai-Daten als aktuell, während die offizielle Marktseite am 13.07.2026 einen Prospekt für 13.–18.07.2026 führt. Structured Offers und Bestellanfragen dürfen erst auf einer autoritativen Quelle beruhen.

### P0-006 — P1 — Datenflüsse und Rechtstexte widersprechen der Implementierung

Status: offen bis G4

Geo-IP, Open-Meteo, Google Maps, Gemini, Bewerbungsuploads und mehrere LocalStorage-Datenflüsse sind nicht vollständig in der Datenschutzerklärung abgebildet. Der Cookie-Banner speichert nur eine Auswahl, steuert die Requests aber nicht. AGB und Checkout versprechen bzw. implementieren unterschiedliche Lieferbedingungen. Juristische Prüfung ist nach Festlegung des echten Geschäftsmodells erforderlich.

### P0-007 — P1 — NL-Verkaufsclaims sind nicht belegt

Status: offen bis G4

Die NL-Seite erzeugt niederländische Vergleichspreise mit pauschalen Multiplikatoren und leitet daraus bis zu 25 Prozent Ersparnis ab. Anfahrtszeiten, Sprachkompetenz und weitere Claims sind nicht durch eine freigegebene Quelle belegt. Eine Muttersprachlerprüfung fehlt.

### P0-008 — P2 — Events sind nicht zeitgesteuert

Status: offen bis G3

Die vorhandene Strikerball-Bühne zählt fest auf den 24.07.2026. Publish-, Expiry-, Fallback- und Kampagnenwechsel-Logik fehlen; nach Ablauf bleibt 00:00:00. Das im Auftrag verlangte generalisierte Eventmodell ist Neubau.

### P0-009 — P2 — Bestell-, Gewinnspiel- und Community-Flows sind Prototypen

Status: offen bis G3/G4

Click & Collect endet in mailto und LocalStorage statt einer bestätigten Reservierungslogik. Gewinnspiel und Community enthalten veraltete Aktionen bzw. unvollständige Teilnahme- und Datenschutzregeln. Die gewünschte Stufe 1 muss als echte Anfrage mit Bestätigungslogik neu gebaut werden.

### P0-010 — P2 — Mehrsprachigkeit ist nur teilweise vorhanden

Status: offen bis G3

Es gibt eine eigenständige /nl-Seite, aber keine /en-Route. Der globale Sprachschalter übersetzt nur Teilbereiche, URL und Dokumentensprache bleiben überwiegend deutsch; hreflang und Sitemap sind unvollständig.

### P0-011 — P2 — Mobile Hero startet nahezu leer

Status: offen bis G2
Screenshot: audit/screenshots/p0/home-mobile-390.jpg

Bei 390 × 844 px liegt die eigentliche Hero-Botschaft zunächst unterhalb des sichtbaren Bereichs. Gleichzeitig erscheinen AI-Chat und WhatsApp als konkurrierende Floating-Elemente. Desktop zeigt die scrollgebundene Hero-Bühne über mehrere Viewports: audit/screenshots/p0/home-desktop-1440.jpg.

### P0-012 — P2 — Kein automatisiertes Testfundament; Lint-Gate war rot

Status: teilweise behoben am 14.07.2026; Testfundament und 20 Alt-Warnungen bleiben vor P2 offen

Der reproduzierbare ESLint-Blocker in `app/partyspiele/page.tsx:367` ist durch die korrekte deutsche schließende Anführungszeichen-Entität behoben. Gezielter Dateilint und vollständiger ESLint-Lauf sind PASS; der vollständige Lauf meldet weiterhin exakt 20 bereits vorhandene Warnungen. Der frische Production-Build bleibt PASS mit Next.js 16.2.4 und 161 generierten Seiten. Unit-/E2E-Test-Scripts und CI werden im P2-Produktionsplan ergänzt.

### P0-013 — P3 — Asset-Dubletten und falsche Dateiendungen

Status: offen bis P4

Mehrere Bildgruppen sind SHA-identische Kopien. Sechs Kategorie- und vier Service-Dateien heißen .jpg, enthalten technisch jedoch PNG und sind jeweils bis zu rund 4 MB groß. Eine konsolidierte Sharp-Pipeline fehlt.

## Baseline-Verifikation

| Prüfung | Ergebnis |
|---|---|
| git fetch + ff-only merge aktiver Stand | PASS, bereits aktuell |
| TypeScript | PASS laut unabhängiger P0-Prüfung |
| npm run build | PASS, 161 Seiten |
| npm run lint | PASS, 0 Fehler / 20 dokumentierte Alt-Warnungen |
| Browser-Konsole Home 390 px | 0 Errors / 0 Warnings |
| Instagram öffentlich | Eingeschränktes Profil, Analyse ohne Login nicht möglich |

## G0-Freigabe

PASS am 13.07.2026:

1. /Users/niko/Desktop/Homepage/trinkgut-jammers-v2 ist der alleinige aktive Stand.
2. Der alte Klon ist als trinkgut-jammers-v2_ARCHIV_2026-07-13 erhalten.
3. Asset- und Feature-Inventar sind als Phase-0-Ausgangspunkt akzeptiert.
4. Tag: gate-0 (wird auf dem bestätigten Gate-Commit gesetzt).
