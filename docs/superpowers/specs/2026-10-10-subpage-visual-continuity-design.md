# Neuer Feinschliff auf allen Kundenseiten

## Auftrag und Ausgangspunkt

Niko verlangt ausdrücklich, dass sich die zuletzt freigegebene kräftigere, wärmere Startseitengestaltung durch alle Unterseiten und Weiterleitungen zieht. Grundlage sind die bestehenden Freigaben in `2026-10-10-sitewide-filmisch-design.md` und `2026-10-10-visual-polish.md`. Keine neue Gestaltungsrichtung, keine neuen Likörbilder und kein weiterer Baukasten. Die vorhandene Next.js-/CSS-Modules-Website bleibt die technische Grundlage.

Dies beschreibt die Erweiterung des Feinschliffs, nicht eine bereits abgeschlossene Umsetzung. Der konkrete Erweiterungsplan wird vor Produktänderungen zur kurzen Bestätigung vorgelegt. Die bisher gewählte subagentengestützte Umsetzung mit unabhängiger Gegenprüfung bleibt bestehen.

## Was durchgängig werden soll

- Bestehende Plus Jakarta Sans; Seitentitel kräftig und klar, Bereichsüberschriften und Kartenbezeichnungen gut voneinander abgestuft. Keine neue Schriftdatei und keine Vergrößerung sämtlicher Navigationselemente/Formularbeschriftungen.
- Warmes Creme für Einstiege und ausgewählte Kapitel, ruhige helle Leseflächen, dunkle Eigenmarkenbereiche, gezieltes Trinkgut-Rot. Nicht jede Seite erhält denselben dunklen Hintergrund oder ein Video.
- Einheitliche Inhaltsbreiten, Abstände, Bildrahmen, Links und Rückwege. Das Ziel nach einem Klick gehört erkennbar zur gleichen Website.
- Fotos und Inhalte bleiben sachlich passend. Originalposter, Handzettel, Angebotskacheln, Flaschen und Gewinnspielcover vollständig und unverzerrt; keine neue Bildbeschaffung oder generierte Etiketten.
- Bewegungen bleiben dezent. Keine Scrollübernahme, keine automatisch laufenden Textbänder und keine zusätzliche Animation auf Leseseiten. Vorhandene Reduced-motion-Regeln erhalten.

## Konkrete Gestaltungsentscheidungen des Implementierers

Diese Werte und Einteilung übertragen den bestätigten Look; sie sind keine wörtlichen Betreiberwünsche:

- Gemeinsamer `PageIntro`: vorhandener `editorialHeading`-Token, Gewicht 800, Zeilenhöhe etwa 1,06; warmes Creme `#F5ECDD` als zusammenhängende Einleitungsfläche. Vorhandene Brotkrumen und Aktionen bleiben echte Links.
- Redaktionelle Abschnittstitel: Gewicht 700, Karten-/Sortennamen mindestens 600, bei wichtigen Kacheln 700. Lesetext bleibt grundsätzlich 1rem oder größer; Metadaten und sachliche Nebenhinweise dürfen kleiner bleiben.
- Sortiment, Markt und Geschichten erhalten warme Kapitel-/Kartenrahmen; vollständige Angebotsbilder bleiben auf ruhigem hellem Grund. Formulare, Tabellen, Zutaten und Lektionen behalten ruhige helle Innenflächen.
- `/eigenmarke`: dunkle zusammenhängende Markenwelt mit ausdrücklich hellen Überschriften und Links; das vorhandene Gruppenmotiv und alle sechs vollständigen Poster bleiben erhalten, einschließlich der sechs bereits verwendeten Sprungziele. Keine zweite interaktive Flaschenbühne nötig.
- `/nl`: gleiche kräftigere Hierarchie und Flächenrhythmik, bestehende orange Akzente und niederländische Texte erhalten. Kein zweiter deutscher Auftritt und keine ungefragte Übersetzung weiterer Seiten.
- Juristische Texte: nur gemeinsamer Einstieg und passende Abschnittsgewichte; vorhandene schmale Lesebreite und Zeilenabstände bewahren.

## Vollständigkeit nach Seitengruppen

Die vorhandene Matrix `e2e/sitewide-design-cases.ts` bleibt verbindlich: 37 gerenderte Kundenseiten-Vorlagen plus 404. Dynamische Vorlagen zählen mit ihren realen Detailseiten, nicht als nur eine URL.

| Familie | Routen | Besondere Abnahme |
| --- | --- | --- |
| Angebote / Sortiment | `/angebote`, `/handzettel`, `/produkte`, `/kategorie/[slug]` | DE/NL gleichwertig, Suche/Filter/Leerzustände und vollständige Kacheln |
| Marken / Geschenke | `/eigenmarke`, `/regionale-spirituosen`, `/geschenkideen` | Dunkle Markenwelt, lesbare Links, vollständige Poster, alle sechs Sprungziele |
| Markt / Menschen | `/marktleben`, `/galerie`, `/gewinnspiel`, `/gewinnspiel/archiv` | Bildrhythmus, aktuelle erlaubte Personen, vollständige Cover und klare Fristen |
| Rezepte / Wissen | `/cocktails`, `/cocktails/kategorie/[slug]`, `/cocktails/[slug]`, `/akademie`, `/akademie/[slug]`, `/akademie/zertifikate` | Übersichten, Rezeptdetails, Lektionen, Quiz-/Ergebniszustände und Bildnachweise |
| Service / Karriere | `/vermietung`, `/warenkorb`, `/checkout`, `/bestellungen`, `/mietbestellung/[id]`, `/bewerbung`, `/kontakt` | Mengen-/Datumseingaben, Summen, Fehler, leere Listen, Plakate, gesperrte Betriebszustände |
| Werkzeuge | `/partyplaner`, `/finder`, `/merkzettel`, `/partyspiele`, `/leergut`, `/oeko-tracker` | Auswahl-/Ergebniszustände, Dialoge und Warenkorb-/Merkzettel-Drawer |
| Informationen / Recht | `/community`, `/kuehlschrank`, `/impressum`, `/datenschutz`, `/agb`, 404 | Ruhige Leseflächen und Rückwege; pausierte Funktionen bleiben pausiert |
| Einstieg / Sprache | `/`, `/nl` | Neue Startseite nicht zurückbauen; NL gezielt angleichen; gemeinsame Navigation erhalten |

## Navigation ohne weitere Hauptreiter

Die fünf bestehenden Hauptgruppen und ihre Menüs bleiben unverändert. Die unabhängige Prüfung fand keine falsche Origin und keine kaputten Produktweiterleitungen: alle 107 alten Produkt-URLs führten korrekt mit 307 zur jeweiligen Warengruppe. Das bleibt so.

Vier aktive Werkzeuge sind bislang nicht vom Einstieg aus über Seitenlinks erreichbar. Sie werden kontextuell erschlossen, nicht zusätzlich in die Hauptnavigation gedrängt:

- `/produkte` erhält „Getränkefinder“ → `/finder` bei den weiterführenden Angeboten.
- `/partyplaner` erhält „Partyspiele entdecken“ → `/partyspiele` nach dem Planungsbereich, nicht innerhalb der Berechnung.
- `/kontakt` erhält einen kleinen Abschnitt „Gut zu wissen“ mit „Leergut berechnen“ → `/leergut` und „Mehrweg entdecken“ → `/oeko-tracker`.
- Die vollständige Handzettelübersicht bleibt zusätzlich als klarer Textlink auf `/angebote` erreichbar: „Alle Handzettel ansehen“ → `/handzettel`. Kein Selbstlink auf `/handzettel` und kein deutscher Zusatz im kompakten NL-Viewer.

Keine Aktivierung oder Hervorhebung der pausierten Community-/Kühlschrankfunktionen. Checkout bleibt vom Listenstatus abhängig; geschützte oder tokengebundene Ziele werden nicht künstlich öffentlich gemacht. Externe Ziele wie GrailBid, Karten und soziale Kanäle bleiben extern; deren Gestaltung liegt nicht in unserem Einfluss.

## Technischer Zuschnitt

Gemeinsamer Einstieg in `components/editorial/editorial.module.css` und `PageIntro.tsx`; danach die bestehenden Familienmodule `collection`, `learning`, `tools`, `transaction`. Eigenständige Module für Gewinnspiele, Akademie-Einstiege und NL gesondert berücksichtigen. Keine pauschale globale Überschriften-/Hintergrundüberschreibung über alle Formularzustände.

`app/public-site.css` setzt öffentliche h1/h2 auf dunkle Schrift. Dunkle Markenflächen brauchen daher gezielte inverse Regeln mit ausreichender Spezifität; auf geerbte helle Textfarbe allein darf man sich nicht verlassen. Neue Bibliotheken und veränderte Daten-/API-Schnittstellen sind nicht nötig.

## Harte Grenzen

- Nur lokal; keine Hetzner-Veröffentlichung, Sicherheits-, Mail-, Upload-, Miet-, Zahlungs- oder Löschaktivierung.
- Keine Änderung von Datenquellen, Wochenpaketen, Gültigkeit, Preisen, Rezepten, Quizlogik, Mengenberechnungen, Adressen oder Rechtstexten.
- Keine neuen Bilder; bestehende Originale, Bildnachweise, Personen-Ausschlüsse und interne Provenienz erhalten.
- Fremde Screenshots, private Quellen und ungeprüfte Auditdateien nicht überschreiben, löschen oder mitcommitten.
- Keine Änderung der fünf Hauptgruppen, kein Nachbau externer Ziele und keine neue Betriebsfunktion.
- Mindestens 44px große interaktive Ziele, sichtbarer Tastaturfokus, Reduced-motion und kein horizontaler Seitenüberlauf bei 360/390/768/1440px.

## Abnahme

Jede Familie und ihre wesentlichen Zustände erhalten visuelle Nachweise aus einem frisch gebauten lokalen Produktionsstand. Echte Klickpfade, Zurücknavigation, Tastatur und mobile Menüs werden neben GET-Weiterleitungschecks geprüft. Alle 107 Produktalias-Ziele bleiben exakt erhalten; die vollständige Kundenseitenmatrix darf nicht auf wenige Startseitenaufnahmen reduziert werden.

Webtests, TypeScript, Lint, Produktionsbuild sowie lokale Seiten-/API-/Originaldateiprüfung. Keine echten Sendungen; die bekannten nativen Bewerbungs-Testgrenzen getrennt ausweisen. Nur eigene geprüfte Änderungen sichern und mit GitHub synchronisieren. Lokal fertig ist nicht öffentlich veröffentlicht.
