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

## D-0005 — Cinematic Dark ist die Produktionsrichtung

Datum: 14.07.2026
Status: von Niko freigegeben

Entscheidung: Cinematic Dark wird als vollständiges Produktionssystem für die Homepage ausgebaut. Verbindlich sind die schwarze Bühne, die gelbe Lichtachse, eine kontrollierte rote Geste, plakative Typografie und echte Jammers-Motive. Premium Light ist ausgeschlossen.

Begründung: Niko hat nach Sichtung der klickbaren Richtungen ausdrücklich `cinematic` gewählt und das am 14.07.2026 präsentierte Produktionsdesign freigegeben.

## D-0006 — Hybrid-Modus für Handzettel und Aktionen

Datum: 14.07.2026
Status: von Niko mit Auswahl `1` freigegeben

Entscheidung: Der offizielle trinkgut-Handzettel und offizielle trinkgut-Aktionen dürfen nach technischer Plausibilitäts- und Datumsprüfung automatisch erscheinen. Canva und Instagram bleiben lesende Editorial- und Prüfquellen. Eigene Gewinnspiele und erkennbare Personenmotive werden erst nach Datums- und Rechteprüfung veröffentlicht.

Begründung: Der Ablauf hält den Handzettel zuverlässig aktuell, ohne abgelaufene Aktionen, unklare Teilnahmebedingungen oder ungeprüfte Personenfotos automatisiert zu veröffentlichen.

## D-0007 — Cinematic-only-Produktionsbranch

Datum: 14.07.2026
Status: von Niko freigegeben

Entscheidung: Die Produktion erfolgt im isolierten Worktree `.worktrees/cinematic-production` auf Branch `codex/cinematic-production`, ausgehend vom bestätigten P0-Stand. Gemischte P1-Commits werden nicht cherry-gepickt. Nur Cinematic-Dateien und -Evidenz dürfen in die öffentliche Branch-Historie gelangen.

Begründung: Der lokale Vergleichsbranch enthält die ausgeschlossene Richtung Premium Light in seiner Historie. Ein sauberer Produktionsbranch verhindert deren unbeabsichtigte Veröffentlichung.

## D-0008 — Next.js-Sicherheitspatch vor weiterer Produktionsarbeit

Datum: 14.07.2026
Status: umgesetzt und verifiziert

Entscheidung: Next.js und `eslint-config-next` wurden exakt von `16.2.4` auf `16.2.10` angehoben. React und React DOM bleiben exakt auf `19.2.4`; weitere direkte Abhängigkeiten wurden nicht aktualisiert.

Begründung: Der reproduzierbare Produktions-Audit auf `16.2.4` meldet direkte Next.js-Findings mit hohem Schweregrad, darunter betroffene Bereiche unter `16.2.5` und `16.2.6`, und bietet `16.2.10` als nicht-major Fix an. Die Registry bestätigt für Next.js `16.2.10` Node `>=20.9.0`, kompatibel mit der eingesetzten Node-Version `25.8.0`. Das eng begrenzte Patch-Upgrade beseitigt die direkten Next.js-Produktionsfindings, bevor weitere Features auf diesem Fundament entstehen.

Restabweichung: `npm audit --omit=dev` rollt weiterhin `GHSA-qx2v-qp2m-jg93` als moderate Kette `next -> postcss@8.4.31` hoch. Sie wird ohne Override und ohne Canary akzeptiert: Next.js `16.2.10` ist der stabile Zielstand und pinnt diese Version; der Next-Maintainer erläutert in [vercel/next.js#93234](https://github.com/vercel/next.js/issues/93234), dass das Finding Next.js-Nutzer nicht betrifft, weil PostCSS dort nur zur Build-Zeit ausgeführt wird.
