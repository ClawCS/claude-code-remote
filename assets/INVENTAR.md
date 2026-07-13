# Asset-Inventar — Phase 0

Stand: 13.07.2026
Quelle: aktiver Kandidat /Users/niko/Desktop/Homepage/trinkgut-jammers-v2

## Überblick

- 190 Medienkandidaten: 110 WebP, 61 echte PNG, 13 JPEG, 5 SVG, 1 ICO.
- Keine Video- und keine Fontdateien.
- 21 SHA-256-identische Dublettengruppen.
- Nur public/images/qr-code.png enthält tatsächlich transparente Pixel.
- Kein brand-input- oder Instagram-Screenshot-Verzeichnis.

## A — Menschen und Aktionen

13 Teamfotos unter public/images/gallery/:

- team-gabriella.jpg
- team-gruppenfoto.jpg
- team-hanna.jpg
- team-hannah.jpg
- team-henri.jpg
- team-jan-niklas.jpg
- team-jasmin.jpg
- team-nico.jpg
- team-niko.jpg
- team-nils.jpg
- team-sven-niko.jpg
- team-sven.jpg
- team-tim.jpg

Qualität: 1080 × 1350 bis 1350 × 1688 px, opake JPEGs. Die Bilder tragen die Homepage menschlich, aber Teamrollen, Zählung und Einwilligungen sind nicht bestätigt. Gruppen- und Duoaufnahmen dürfen nicht als einzelne Mitarbeiter gezählt werden.

Weitere Aktionsmotive: public/images/Services/65 Cocktail-Rezepte.jpg und Partyplaner.jpg. Beide Dateien sind intern PNG trotz .jpg-Endung; Nutzungsrechte und Authentizität sind zu prüfen.

## B — Eigenmarken-Liköre

Primärer Satz unter public/images/eigenmarken/:

- caramello.png
- dicke-nuesse.png
- pralle-kirsche.png
- schwarzer-teufel.png
- suesse-suende.png
- weisser-engel.png
- uebersicht.png

Die sechs Produktmotive liegen bei etwa 1054 × 1493 px, die Übersicht bei 1492 × 1054 px. Alle sieben sind opake PNGs und liegen SHA-identisch nochmals unter public/images/Eigenmarken-Likör/. Sie eignen sich als inhaltliche Basis, benötigen aber Freistellung, einheitliches Grading und optimierte AVIF/WebP-Derivate.

## C — Markt und Gebäude

Kein eigenständiges Außen-, Gebäude-, Eingangs- oder unverdecktes Marktinnenraumfoto vorhanden. Marktinterieur erscheint nur als Hintergrund einzelner Teamfotos. Ein Markt-Flythrough ist mit dem aktuellen Material nicht seriös umsetzbar.

## D — Logo und CI

- public/images/logo-jammers.png
- public/images/logo-trinkgut-jammers.png

Beide Dateien sind SHA-identisch: PNG, 828 × 324 px, opak, weißer Hintergrund; Metadaten weisen auf einen Screenshot statt eines Markenmasters hin. Ein Vektorlogo fehlt.

Dominante belegte Pixelwerte aus exakter Sharp-RGB-Histogrammanalyse im sRGB-Raum:

| Rolle | Pixelmodus | Häufigkeit |
|---|---:|---:|
| Trinkgut-Gelb | #FEE005 | 15.628 Pixel |
| Trinkgut-Rot | #E20F1D | 2.100 Pixel |
| Tropfen-Blau | #0086C8 | 256 Pixel |
| Dunkelgrau | #414045 | 1.601 Pixel |
| Schwarz | #000000 | 2.249 Pixel |
| Weiß | #FFFFFF | 72.727 Pixel |

Hinweis: Das Rasterlogo enthält Verläufe und 30.851 unterschiedliche RGB-Werte. Die Tabelle ist eine belegbare Extraktion, aber keine offizielle Pantone-/CI-Freigabe. Die aktuell im CSS verwendeten Hauptwerte #DC2626 und #F59E0B stammen nicht aus diesen Pixelmodi.

## E — Sekundär oder vorerst unbrauchbar

- 110 kleine Handzettel-WebPs unter public/handzettel/extracted/: etwa 174–400 px, mit Flyer-Cropping und teilweise Preisstörern; als Produktfallback nutzbar, nicht als Hero-Material.
- 16 Akademie-PNGs: acht identische Paare.
- Sechs Kategorie- und vier Servicebilder: .jpg-Endung, intern PNG, teils 2,2–4,1 MB; vor Wiederverwendung Rechte, Motiv und Kompression prüfen.
- Fünf Gewinnspielmotive plus Strikerball und Bier des Monats: zeitgebundene Promoassets, nicht für evergreen Content.
- Fünf SVGs: Next/Vercel-Boilerplate, kein Markenmaterial.
- Vier Preislisten-PNGs: redaktionelle Quelle, keine Web-Heroes.
- 14 getrackte Expertise-Liköre-PNGs fehlen bereits im Worktree; der ältere Klon bzw. Git-History bewahrt sie. Nicht von Codex gelöscht.

## Fehlender Input

1. Offizielles Logo als SVG/Vektor plus Co-Branding-Regeln.
2. Freigegebene Hausschriften oder bestätigte Lizenzstrategie.
3. Außenansicht, Eingang, breite Marktinnenräume und echte Beratung/Verkostung.
4. Team-Zuordnung und Fotoeinwilligungen.
5. Instagram-Grid plus 5–10 Top-Posts.
6. Produktfreisteller ohne Flyerpreise, mindestens für die wichtigsten Angebote.
7. Optionales Marktvideo für einen Flythrough; andernfalls Eigenmarken-Inszenierung als Signature-Element.
