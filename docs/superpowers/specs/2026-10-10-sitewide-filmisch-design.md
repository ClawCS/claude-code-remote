# Durchgängiger Design-Umbau — Filmisch & nahbar

## Status und Auftrag

Niko hat den vollständigen Umfang einschließlich der fünf Hauptgruppen am 10.10.2026 mit »ja leg los« bestätigt und die Umsetzung beauftragt. Niko verlangt ausdrücklich, dass auch alle Unterseiten dem neuen Look entsprechen. Sein Screenshot zeigt die freigegebene Richtung A mit schmaler heller Infoleiste, großzügigem weißem Kopfbereich und fünf Hauptpunkten. Die bisherige Umsetzung war nur eine Teilübertragung: Film, einige Startseitenbereiche und leichte gemeinsame Anpassungen. Ein vollständiger Seitenumbau darf nicht erneut allein aus einem neuen Film oder globalen Farbwechsel abgeleitet werden.

Visuelle Referenz: `.superpowers/brainstorm/88954-1791640434/content/jammers-directions.html`, Richtung A. Zusätzlich vom Betreiber vorgelegter Screenshot `download.jpg`, SHA-256 `809edf886bb7e1264727bcff88fecd07cd831b28427f014dda9af65b760c4781`. Die Designstudio-Werkzeugleisten sind keine Websitebestandteile. Der bestätigte Film bleibt erhalten.

Technische Grundlage bleibt die vorhandene Next.js-Website, derselbe Git-Branch und dieselben Datenquellen. Keine Migration zu einem neuen Baukasten oder Hostinganbieter. Umsetzung und Abnahme ausschließlich lokal; keine öffentliche Veröffentlichung aus diesem Auftragsschritt.

## Gestaltungsziel

Jede öffentlich erreichbare Kundenseite wirkt als Teil derselben Website: fast weiße Flächen, dunkle ruhige Schrift, großzügige Abstände, gezieltes Trinkgut-Rot und große sinnvoll eingesetzte Originalbilder. Keine Mischung aus neuem Film und alten technischen Display-Schriften, beigen Hero-Bannern, dekorativen Emojis, Leuchteffekten oder beliebigen runden Karten.

Gleiche Gestaltung bedeutet nicht gleiche Schablone: Angebotsseiten bleiben übersichtlich und produktorientiert, Rezepte und Geschichten bildgeführt, Wissen lesefreundlich, Formulare klar und kompakt. Nicht jede Unterseite erhält ein Video oder ein dekoratives Foto. Wo keine passende freigegebene Aufnahme vorliegt, wird mit Typografie und Layout gearbeitet.

## Kopfbereich und Navigation

Die folgende vom Implementierer vorgeschlagene Einordnung ist mit dem vollständigen Entwurf bestätigt:

- Schmale helle Infoleiste mit Goch/Öffnungszeiten, Adresse und klar erkennbarem NL-Einstieg mit Flagge. Sie ersetzt die bisherige vollflächig orange deutsche Sprachleiste; auf Mobil bleibt Nederlands unmittelbar sichtbar. Die niederländische Landingpage behält dezente orange Akzente innerhalb des gemeinsamen Stils.
- Weißer großzügiger Kopfbereich mit unverändertem Jammers-Logo und den fünf Gruppen des Entwurfs: **Angebote**, **Sortiment**, **Party & Miete**, **Jammers entdecken**, **Dein Besuch**.
- Angebote führt direkt zu `/angebote`; vollständige Handzettel bleiben dort und unter `/handzettel` erreichbar.
- Sortiment führt direkt zu `/produkte`; Warengruppen, aktuelle Aktionsware und Suche bleiben dort erhalten.
- Party & Miete führt direkt zu `/vermietung`, mit separat eindeutig bedienbarer Untermenüöffnung für Partyplaner und Mietauswahl. Ein Klick auf den Hauptlink darf nicht nur ein Menü öffnen.
- Jammers entdecken öffnet eine übersichtliche, thematisch gegliederte Navigation: Getränke (Eigenmarken, regionale Spezialitäten, Geschenkideen), Erleben (Marktleben, Gewinnspiele, GrailBid), Rezepte & Wissen (Cocktails, Getränkeakademie), Team & Karriere (Unser Team, Offene Stellen & Bewerbung). Keine wesentliche Rubrik wird gelöscht oder nur im Footer versteckt. Desktop darf dafür ein breites gegliedertes Menü verwenden, Mobil zugängliche aufklappbare Gruppen.
- Dein Besuch führt direkt zu `/kontakt`; originale Google-Maps-, WhatsApp- und Instagram-Zeichen bleiben an passenden Kontaktstellen rahmenlos und in Originalfarben erhalten.
- Logo führt nach Hause; interne Links bleiben auf derselben lokalen Origin. Untermenüs sind klar von Ziel-Links unterscheidbar und per Maus, Touch und Tastatur nutzbar. Escape, Fokus und Schließen nach Navigation sind ausdrücklich zu prüfen.
- GrailBid bleibt zusätzlich auf der Startseite deutlich als externer TCG-Shop verknüpft. Externe Ziele werden nicht kopiert oder lokal nachgebaut.

Die bestätigte Fünferstruktur ersetzt die ältere Vorgabe, exakt neun Hauptgruppen sichtbar beizubehalten. Der vollständige Inhalt dieser Gruppen bleibt erreichbar.

## Startseite vervollständigen

Nicht beim Film aufhören: Angebote, Sortiment, Entdeckergeschichten, Eigenmarken, Aktionen, Team, GrailBid und Kontakt werden gestalterisch zusammengeführt. Bestehende funktionale Inhalte bleiben über passende Einstiege und ihre Unterseiten erreichbar. Wiederholungen auf der Startseite dürfen zugunsten klarer redaktioneller Bereiche zusammengefasst werden, aber keine Rubrik ersatzlos verschwinden.

DE und NL erhalten gleichwertige, ruhig komponierte Angebotsflächen mit unveränderten vollständigen Originalmotiven und funktionierendem Viewer. Beim Partyservice kein zusätzliches langes, optisch altes Kartenband direkt unter einem neuen großen Motiv. Markt- und Entdeckerinhalte werden zu großzügigen Bild-/Textgeschichten statt einer Wiederholung gleichartiger Kacheln. Alle sechs Eigenmarken bleiben erreichbar; keine neue oder unbelegte Produkteigenschaft wird behauptet.

## Vollständiger Kundenseitenumfang

Die unabhängige Code-Inventur erfasst 42 `page.tsx`-Vorlagen: 37 gerenderte Kundenseiten-Vorlagen, eine Weiterleitung, zwei geschützte Verwaltungsseiten und zwei Test-Fixtures. Hinzu kommt die globale 404. Dynamische Vorlagen erzeugen mehrere reale Seiten; 37 bedeutet deshalb nicht nur 37 zu prüfende URLs.

| Seitengruppe | Routen/Seitentypen | Gestaltung und zu erhaltende Funktion |
| --- | --- | --- |
| Einstieg | `/`, `/nl` | Durchgängige redaktionelle Startseiten; NL mit eigenständiger Sprache und dezenten orangefarbenen Akzenten, aber gemeinsamem Layoutsystem |
| Angebote und Sortiment | `/angebote`, `/handzettel`, `/produkte`, `/kategorie/[slug]` | Einheitliche Einstiege, Filter, Suchfelder, Angebotskarten, datierte Vollmotive; keine erfundenen WWS-Daten |
| Marken und Geschenke | `/eigenmarke`, `/regionale-spirituosen`, `/geschenkideen` | Großzügige Produkt-/Bildgeschichten mit vorhandenen belegten Motiven |
| Cocktails | `/cocktails`, `/cocktails/kategorie/[slug]`, `/cocktails/[slug]` | Übersicht, Kategorien und Rezeptdetails mit gleicher Schrift, Bildsprache und Bedienelementen; Zutaten, Schritte und Bildnachweise erhalten |
| Akademie | `/akademie`, `/akademie/[slug]`, `/akademie/zertifikate` | Kursübersicht und lesefreundliche Lektionen; Fortschritt/Quiz und externe Kursinformationen unverändert |
| Markt und Menschen | `/marktleben`, `/galerie`, `/gewinnspiel`, `/gewinnspiel/archiv` | Aktuelle Portraits, freigegebene Markt- und Übergabebilder, unbeschnittene Originalcover, Agenda und datierte Aktionen |
| Karriere | `/bewerbung` | Sichtbare Stellenanzeigen und klarer Bewerbungsweg; bestehende deaktivierte Uploadzustände bleiben deaktiviert |
| Party und Miete | `/partyplaner`, `/vermietung`, `/warenkorb`, `/checkout`, `/bestellungen`, `/mietbestellung/[id]` | Einheitliche Formulare, Mengenwahl, Summen, Hinweise, Bestätigungs-/Fehler-/Leerzustände ohne Änderung der Berechnungen oder Betriebsfreigaben |
| Weitere Kundenwerkzeuge | `/finder`, `/merkzettel`, `/partyspiele`, `/leergut`, `/oeko-tracker` | Bestehende Auswahl-, Such-, Rechen- und Hilfsfunktionen im neuen System |
| Bestehende Informationszustände | `/community`, `/kuehlschrank` | Auch stillgelegte Funktionshinweise bekommen den neuen Look; keine Wiederaktivierung alter Profile/Punktefunktionen |
| Besuch und Recht | `/kontakt`, `/impressum`, `/datenschutz`, `/agb` | Kontakt klar strukturiert; Rechtstexte ruhig und gut lesbar, Wortlaut nicht kreativ umschreiben |
| Systemzustände | Öffentliche 404, ungültige Detailrouten, leere Suchergebnisse, Lade-/Fehlerzustände | Verständliche Rückwege, gleiche Gestaltung, keine alten bunten Fehlerkarten |

`/produkte/[slug]` behält seine Weiterleitung zur passenden Warengruppe; dafür keine neue Produktdetailseite erfinden. Vor Umsetzung wird diese Inventur gegen sämtliche Route-Dateien und tatsächlich generierten öffentlichen Detail-URLs abgeglichen. Nicht verlinkte, aber öffentlich erreichbare Kundenseiten zählen ebenfalls zum Umfang.

## Nicht öffentliche oder externe Bereiche

`/bewerbung/verwaltung`, `/markt/bestellungen`, technische Test-Fixtures, APIs, E-Mails/PDF-Dokumente und der externe GrailBid-Shop erhalten keinen separaten funktionalen oder visuellen Neuaufbau in diesem Kundenwebsite-Auftrag. Die geerbte öffentliche Hülle kann sich dort technisch ändern; Zugriffsregeln, Sperren und interne Bedienabläufe dürfen dadurch nicht geändert werden. Öffentlich sichtbare Sperr-/Hinweisseiten bleiben verständlich. Keine neue Anmeldung, Rechteausweitung oder Aktivierung.

## Gemeinsames System statt oberflächlicher Übermalung

Gemeinsame Variablen, Seitenköpfe, Inhaltsbreiten, Schriftstaffel, Abstände, Karten, Bildrahmen, Buttons und Formulare definieren. Für jede Familie werden ihre eigentlichen Komponenten angepasst, nicht nur globale CSS-Regeln über unveränderte alte Strukturen gelegt. Einfache Rechtstexte benötigen keine Bildinszenierung. Bestehende Originallogos, plakatartige Fotos, Angebotskacheln und Gewinnspielcover bleiben vollständig und unverzerrt; echte Szenenfotos bekommen individuell geprüfte Ausschnitte.

Die konkrete technische Aufteilung der Komponenten, sinnvolle responsive Schwellen und feinere Abstände sind Entscheidungen des Implementierers. Sie müssen den gezeigten Desktop-Entwurf treffen und auf schmalen Geräten eigenständig gut funktionieren. Schriftfamilien bleiben lokal bereits vorhandene, keine zusätzlichen Font- oder Medienanbieter allein für diesen Umbau.

Auch Zustände innerhalb einer Seite zählen: Akademie-Lektionsnavigation, Quiz/Prüfung/Ergebnis, Finder-Schritte und Ergebnisliste, Partyspiele-Dialoge, Leergut-Verlauf, Öko-Auswertung, Merkzettel-/Warenkorb-Drawer, Mietzeitraum-/Mengenfehler sowie Bewerbungs-Sperrhinweise und Plakate. `noindex` allein nimmt eine Kundenseite nicht aus dem Designumfang.

## Harte Betriebs- und Inhaltsgrenzen

Keine Änderung von Berliner Gültigkeitsberechnung, Wochenpaketen, Angebotszählung, Preisen, Rezepten, Quizlogik, Mietdauer-/Bestandsregeln, Empfängeradressen, Datenschutzregeln oder API-Verträgen. Keine Mail, Zahlung, Löschung, Anbieterbuchung, Hosting-/Sicherheitsänderung oder Bewerbungsaktivierung. Fremde Arbeitsdateien bleiben unberührt. Keine unbestätigten Leistungen, Personen oder Motive wieder aufnehmen. Keine neuen KI-/Stockbilder aus diesem Designauftrag ableiten. Bereits belegte Quellen und Filmkennzeichnung erhalten.

## Abnahme und Reihenfolge

1. Vollständige Routen- und Komponentenmatrix festhalten; URLs und Zustände als spätere Checkliste verwenden.
2. Gemeinsames Gestaltungssystem und Kopf-/Fußbereich samt Navigation umsetzen.
3. Startseite vollständig an den Entwurf angleichen; danach die oben genannten Seitengruppen und ihre Detail-/Leerzustände umstellen.
4. Navigation mit echten Klicks testen — Desktop, Mobil, Untermenüs und Tastatur. Keine reine HTTP-Linkliste als Navigationsnachweis.
5. Jede öffentlich erreichbare Route auf alte Gestaltung und Darstellungsfehler prüfen. Mindestens eine echte Detailseite je dynamischer Familie plus sämtliche wichtigen Formularzustände visuell auf Mobil, Tablet und Desktop abnehmen. Jede Familie erhält gespeicherte Bildbelege; nicht nur der Hero.
6. Abhängige Webtests, TypeScript, Lint und Produktionsbuild; lokale Seiten-/API-/Dateiprüfung ohne echte Sendungen. Vorhandene native Bewerbungs-Testvoraussetzungen separat ausweisen, nicht durch Webtests als bestanden erklären.
7. Unabhängige Schlussprüfung gegen Referenz und Seitenmatrix, Git-Sicherung und echte lokale Vorschau. Explizit zwischen fertigem lokalem Design und öffentlichem Release unterscheiden.

Abschluss erst, wenn jede Kundenseitenfamilie und jeder aktive Navigationseinstieg erfasst ist. Keine Meldung »alle Unterseiten fertig« aufgrund einer globalen Farbvariable oder einer einzigen Startseitenaufnahme.
