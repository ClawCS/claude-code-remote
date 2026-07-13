# DECISIONS — Trinkgut Jammers Weltklasse-Relaunch

## D-0001 — Aktiver Projektordner

Datum: 13.07.2026
Status: bestätigt an G0 am 13.07.2026

Entscheidung: /Users/niko/Desktop/Homepage/trinkgut-jammers-v2 ist die künftige Arbeitsbasis.

Begründung: gleicher Remote und gleicher Ursprungsbranch wie der zweite Klon, aber 60 Commits weiter, jüngere Quellen, mehr vollständige Features und der aktuelle Remote-Stand. Der ältere Klon hat keine exklusiven lokalen Commits.

Folge: Der alte Ordner unter Desktop/Claude Code ist als trinkgut-jammers-v2_ARCHIV_2026-07-13 erhalten. Er wurde nicht gelöscht. Alle weitere Arbeit findet ausschließlich unter Desktop/Homepage statt.

## D-0002 — Bestehenden Next.js-Stand weiterentwickeln

Datum: 13.07.2026
Status: für G1 vorgeschlagen

Entscheidung: Next.js 16 App Router, React 19, TypeScript und Tailwind CSS 4 bleiben bestehen; keine Astro-Migration.

Begründung: Der aktive Stand ist eine umfangreiche, funktionierende Next.js-Anwendung mit 161 generierten Seiten, APIs, Datenmodellen und wiederverwendbaren Features. Der Arbeitsauftrag erlaubt Next.js ausdrücklich, wenn Phase 0 einen sauberen Next-Stand zeigt. Die Performance-Risiken werden über Server Components, kleinere Islands und Asset-Härtung adressiert.

## D-0003 — Keine ungeprüften Verkaufsclaims

Datum: 13.07.2026
Status: verbindlicher P0-Auditgrundsatz

Entscheidung: Preise, Verfügbarkeit, Ersparnisse, Follower-, Bewertungs-, Team- und Lieferclaims werden nur aus freigegebenen Quellen ausgespielt. Fehlende Werte werden nicht geschätzt.

## D-0004 — Keine externen KI-Bildquellen als Ersatz für Marktmaterial

Datum: 13.07.2026
Status: für G1 vorgeschlagen

Entscheidung: Das Signature-Element wird in P1 zunächst mit den echten Eigenmarken- und Teamassets prototypisiert. Fehlende Markt-/Gebäudefotos werden als Input-Lücke sichtbar gehalten und nicht durch generische Stockbilder kaschiert.
