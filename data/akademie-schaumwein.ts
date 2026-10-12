import type { Course } from "./akademie";

export const schaumweinKurs: Course = {
  slug: "schaumwein",
  title: "Schaumwein & Sekt",
  icon: "🥂",
  image: "/images/akademie/schaumwein.png",
  description:
    "Von der Méthode Traditionnelle bis zum Pét-Nat — Herstellungsverfahren, Appellationen, Rebsorten, Dosage, Sensorik und Service für Herstellung, Auswahl und Service.",
  color: "from-yellow-400 to-amber-500",
  difficulty: "Fortgeschritten",
  duration: "ca. 80 Min.",
  lessons: [
    // ─── Lektion 1 ───────────────────────────────────────────
    {
      title: "Geschichte des Schaumweins",
      content: `## Viele Beiträge, kein einzelner Erfinder

Die Entwicklung des Schaumweins lässt sich nicht auf eine einzelne Person reduzieren. Gärung erzeugt Kohlendioxid; bleibt dieses unter Druck im Wein, entsteht die Perlage. Die kontrollierte Herstellung erforderte geeignete Flaschen, Verschlüsse und Verfahren zum Umgang mit dem Hefesatz.

**Limoux** verweist in seiner Herkunftsgeschichte auf prickelnden Wein aus der Abtei Saint-Hilaire im Jahr 1531. Daraus folgt kein Beweis für einen weltweit einzigen Ursprung. Heute müssen zwei Produkte unterschieden werden: **Blanquette de Limoux** erhält eine zweite Gärung in der Flasche; bei **Blanquette de Limoux Méthode Ancestrale** wird die erste Gärung in der Flasche vollendet.

**Dom Pierre Pérignon** wird vom Comité Champagne für seine systematische Arbeit an der Assemblage gewürdigt. Verschiedene Weine und Herkünfte gezielt zusammenzustellen, half, ausgewogenere Weine zu erzeugen. Ihn als alleinigen Erfinder des Schaumweins zu bezeichnen, verkürzt diese gemeinsame Entwicklung.

**Rütteln und Degorgieren** machten es möglich, den Hefesatz zu entfernen, ohne den fertigen Wein einfach in eine andere Flasche zu gießen. Das Haus Veuve Clicquot nennt die Entwicklung der Rütteltische im Jahr **1816** als wichtigen Beitrag Madame Clicquots und ihres Hauses.

**Weitere Regionen** entwickelten eigene Herkunftsbezeichnungen und Herstellungsregeln. Cava, Crémant, Prosecco und deutscher Winzersekt sind keine austauschbaren Namen: Ihre Herkunft, Rebsorten und Verfahren bestimmen sich nach den jeweiligen Vorschriften.`,
      quiz: [
        {
          question:
            "Welche Herkunft verweist auf die Abtei Saint-Hilaire und das Jahr 1531?",
          options: [
            "Champagner aus Hautvillers",
            "Blanquette de Limoux aus der Abtei Saint-Hilaire",
            "Prosecco aus dem Veneto",
            "Sekt aus Esslingen",
          ],
          correct: 1,
          explanation:
            "Die Herkunftsgeschichte von Limoux nennt die Abtei Saint-Hilaire und 1531. Das ist keine Garantie eines weltweit einzigen Ursprungs.",
        },
        {
          question:
            "Was kennzeichnet Blanquette de Limoux Méthode Ancestrale?",
          options: [
            "Die Erfindung des Rüttelpults",
            "Die erste Gärung wird in der Flasche vollendet",
            "Ausschließlich Fassreifung ohne Flasche",
            "Die Dosage-Abstufungen für Champagner",
          ],
          correct: 1,
          explanation:
            "Bei der Méthode Ancestrale endet die erste Gärung in der Flasche. Reguläre Blanquette de Limoux erhält dagegen eine zweite Flaschengärung.",
        },
        {
          question:
            "Welche Innovation wird Veuve Clicquot zugeschrieben?",
          options: [
            "Die Erfindung des Champagnerkorkens",
            "Die Entwicklung des Rüttelpults (pupitre)",
            "Die Einführung der Dosage",
            "Die Erfindung der Charmat-Methode",
          ],
          correct: 1,
          explanation:
            "Nicole-Barbe Clicquot-Ponsardin entwickelte um 1816 das Rüttelpult, mit dem Hefesatz gezielt in den Flaschenhals befördert wird — Grundlage des modernen Dégorgement.",
        },
      ],
    },

    // ─── Lektion 2 ───────────────────────────────────────────
    {
      title: "Méthode Traditionnelle / Champenoise",
      content: `## Die Königsdisziplin der Schaumweinherstellung

Die **Méthode Traditionnelle** (auch Méthode Classique genannt; der Begriff *Méthode Champenoise* ist außerhalb der Champagne EU-rechtlich nicht mehr gestattet) ist das aufwendigste und prestigeträchtigste Verfahren zur Herstellung von Schaumwein. Das Kernprinzip: Die zweite Gärung, die die Kohlensäure erzeugt, findet **in derselben Flasche** statt, in der der Wein später verkauft wird. Dieses Verfahren wird nicht nur in der Champagne angewandt, sondern auch bei Crémant, Cava, Franciacorta, Cap Classique und deutschem Winzersekt.

**Schritt 1 — Grundwein (Vin de Base)**: Zunächst wird ein stiller Grundwein vinifiziert, typischerweise mit 10,5–11 % Vol. Alkohol, hoher Säure und neutralem Charakter. Die Trauben werden oft früher gelesen als für Stillwein, um die Säure zu bewahren. In der Champagne werden die drei Hauptrebsorten Chardonnay, Pinot Noir und Pinot Meunier meist separat vinifiziert und anschließend assembliert. Reserveweine aus früheren Erntejahren können den Hausstil unterstützen; ihre Anteile unterscheiden sich nach Cuvée.

**Schritt 2 — Assemblage**: Der Kellermeister (*Chef de Cave*) komponiert aus Dutzenden oder Hunderten von Grundweinen die finale Cuvée. Dies ist die anspruchsvollste Aufgabe, denn die Assemblage muss den Hausstil über Jahrzehnte hinweg konstant halten, obwohl jeder Jahrgang unterschiedliche Bedingungen bringt. Bei Millésimé-Champagnern (Jahrgangschampagner) stammen alle Grundweine aus einem einzigen herausragenden Jahr.

**Schritt 3 — Tirage (Flaschenfüllung und Liqueur de Tirage)**: Dem Grundwein wird eine Mischung aus Zucker (typisch 24 g/l für 6 bar Druck), Hefe (*Saccharomyces bayanus* oder speziellen Champagnerhefen) und Nährstoffen zugesetzt — der sogenannte **Liqueur de Tirage**. Die Flaschen werden mit einem Kronkorken verschlossen und horizontal in kühlen Kreidekellern (10–12 °C) gelagert.

**Schritt 4 — Zweitgärung auf der Flasche (Prise de Mousse)**: Die Hefe vergärt den zugesetzten Zucker und erzeugt dabei ca. 1,2–1,3 % Vol. zusätzlichen Alkohol sowie Kohlensäure, die sich unter Druck im Wein löst (5–6 bar bei 20 °C). Die Gärung dauert 6–8 Wochen. Die feine, persistente Perlage von Méthode-Traditionnelle-Weinen entsteht durch die langsame Gärung bei niedrigen Temperaturen und die vollständige Integration des CO₂ in den Wein.

**Schritt 5 — Hefelager (Sur Lie)**: Nach der Zweitgärung stirbt die Hefe ab und beginnt sich zu zersetzen — ein Prozess namens **Autolyse**. Dabei werden Aminosäuren, Mannoproteïne und Polysaccharide freigesetzt, die dem Wein Komplexität, cremige Textur und Aromen von Brioche, Toast und Biskuit verleihen. Die Mindestlagerzeiten sind streng reglementiert: Non-Vintage-Champagner mindestens 15 Monate insgesamt ab Tirage, davon mindestens 12 Monate auf der Hefe, Vintage-Champagner mindestens 36 Monate. Prestige-Cuvées lagern oft 5–10 Jahre oder länger.

**Schritt 6 — Remuage (Rütteln)**: Die Flaschen werden über Wochen schrittweise von der Horizontalen in eine Kopfüber-Position gebracht, wobei sie täglich um 1/8-Drehung gedreht und leicht angehoben werden. Der Hefesatz wandert dabei in den Flaschenhals. Traditionell geschieht dies per Hand auf Rüttelpulten (2–3 Monate), heute meist maschinell mit **Gyropaletten** (3–7 Tage für 504 Flaschen gleichzeitig).

**Schritt 7 — Dégorgement**: Der Flaschenhals wird in ein Kältebad (–25 °C Sole) getaucht, der Hefesatz gefriert zu einem Eispfropfen. Beim Öffnen des Kronkorkens schießt der Druck den gefrorenen Pfropfen heraus — mit minimalem Weinverlust. Diese Methode heißt **Dégorgement à la Glace**. Das seltene **Dégorgement à la Volée** (ohne Einfrieren) erfordert extreme Geschicklichkeit.

**Schritt 8 — Dosage und Endverschluss**: Der Weinverlust wird durch die **Liqueur d'Expédition** ausgeglichen — eine Mischung aus Wein und Zucker, deren Konzentration den Süßegrad des fertigen Schaumweins bestimmt. Anschließend wird die Flasche mit dem endgültigen Korken und der Agraffe (Drahtgestell) verschlossen.`,
      quiz: [
        {
          question:
            "Was ist der entscheidende Unterschied der Méthode Traditionnelle zu anderen Verfahren?",
          options: [
            "Es wird ausschließlich Chardonnay verwendet",
            "Die zweite Gärung findet in derselben Flasche statt, in der der Wein verkauft wird",
            "Der Wein wird pasteurisiert",
            "Es dürfen nur drei Rebsorten verwendet werden",
          ],
          correct: 1,
          explanation:
            "Das Kernprinzip der Méthode Traditionnelle ist die Zweitgärung in der Verkaufsflasche. Dies erzeugt besonders feine, persistente Perlage durch langsame CO₂-Integration.",
        },
        {
          question:
            "Was passiert bei der Autolyse während des Hefelagers?",
          options: [
            "Die Hefe vermehrt sich weiter",
            "Die abgestorbene Hefe zersetzt sich und setzt Aminosäuren, Mannoproteïne und Polysaccharide frei",
            "Der Alkoholgehalt steigt um weitere 5 %",
            "Die Kohlensäure entweicht durch den Korken",
          ],
          correct: 1,
          explanation:
            "Bei der Autolyse zersetzt sich die abgestorbene Hefe und setzt Substanzen frei, die dem Wein cremige Textur sowie Aromen von Brioche, Toast und Biskuit verleihen.",
        },
        {
          question:
            "Welche Mindestlagerung gilt für Non-Vintage-Champagner?",
          options: [
            "6 Monate",
            "15 Monate insgesamt ab Tirage, davon mindestens 12 Monate auf der Hefe",
            "36 Monate",
            "60 Monate",
          ],
          correct: 1,
          explanation:
            "Non-Vintage-Champagner muss mindestens 15 Monate insgesamt ab Tirage reifen, davon mindestens 12 Monate auf der Hefe. Vintage-Champagner erfordert mindestens 36 Monate. Prestige-Cuvées lagern oft 5–10 Jahre.",
        },
      ],
    },

    // ─── Lektion 3 ───────────────────────────────────────────
    {
      title: "Charmat-Verfahren / Tankgärung",
      content: `## Die zweite Gärung im Drucktank

Beim **Charmat- oder Martinotti-Verfahren** erhält der Grundwein seine zweite Gärung in einem geschlossenen Drucktank. Hefe und gärfähiger Zucker sorgen für Kohlendioxid, das unter Druck im Wein bleibt. Anschließend wird der Wein gefiltert und unter Gegendruck abgefüllt.

**Fruchtbetonte Stile**: Tankgärung wird unter anderem bei Prosecco eingesetzt. Eine kurze Verarbeitung kann sortentypische Frucht- und Blütenaromen betonen. Das Verfahren allein garantiert aber weder eine bestimmte Qualität noch identischen Geschmack.

**Hefekontakt**: Längerer Kontakt mit der Feinhefe im Tank wird häufig als **Charmat Lungo** bezeichnet. Die konkrete Dauer ist produktabhängig; es gibt hier keine universelle Vorgabe von sechs bis neun Monaten.

**Unterschied zur Flasche**: Es ist keine zweite Gärung in jeder Verkaufsflasche erforderlich. Das erleichtert die Verarbeitung größerer Mengen. Bei der traditionellen Methode erfolgen zweite Gärung und Entfernung des Hefesatzes dagegen in der jeweiligen Flasche.

**Asti unterscheiden**: Aromatische Schaumweine können auch durch eine unterbrochene erste Gärung erzeugt werden. Nicht jedes Produkt aus einem Drucktank ist deshalb ein Beispiel einer zweiten Charmat-Gärung.

**Crémant und Winzersekt** verlangen traditionelle Flaschengärung. Ihre Namen dürfen nicht allein aus einem erwünschten Geschmack eines Tankgärungsweins abgeleitet werden.`,
      quiz: [
        {
                "question": "Wo findet beim Charmat-Verfahren die zweite Gärung statt?",
                "options": [
                        "In der offenen Amphore",
                        "Im geschlossenen Drucktank",
                        "In jeder Verkaufsflasche",
                        "Erst im Glas"
                ],
                "correct": 1,
                "explanation": "Charmat bezeichnet die zweite Gärung im geschlossenen Drucktank mit anschließender Abfüllung unter Gegendruck."
        },
        {
                "question": "Welcher Unterschied zur traditionellen Methode ist entscheidend?",
                "options": [
                        "Es wird nie Hefe verwendet",
                        "Es darf kein Grundwein verwendet werden",
                        "Die zweite Gärung findet im Tank statt, nicht in jeder Verkaufsflasche",
                        "Der Wein enthält immer weniger Alkohol"
                ],
                "correct": 2,
                "explanation": "Der Ort der zweiten Gärung unterscheidet die Verfahren. Qualität oder Alkoholgehalt folgen nicht automatisch daraus."
        },
        {
                "question": "Wofür steht Charmat Lungo?",
                "options": [
                        "Immer eine andere Rebsorte",
                        "Längerer Hefekontakt im Tank; die konkrete Dauer ist produktabhängig",
                        "Gärung nur in der Flasche",
                        "Zwingend doppelter Druck"
                ],
                "correct": 1,
                "explanation": "Lungo beschreibt längeren Hefekontakt im Tank, keine universelle Mindestzeit für alle Produkte."
        }
],
    },

    // ─── Lektion 4 ───────────────────────────────────────────
    {
      title: "Das Transvasierverfahren",
      content: `## Flaschengärung mit anschließendem Umfüllen

Beim **Transvasierverfahren** findet die zweite Gärung zunächst in der Flasche statt. Nach dem Hefelager wird der Wein unter Gegendruck in einen Tank überführt. Dort wird der Hefesatz durch Filtration entfernt; anschließend wird unter Druck neu abgefüllt.

**Unterschied zur traditionellen Methode**: Bei der traditionellen Flaschengärung wird der Hefesatz durch Rütteln und Degorgieren aus der jeweiligen Flasche entfernt. Beim Transvasieren ersetzen Umfüllen und Filtration diese Schritte. Die EU-Bezeichnung **„Flaschengärung“** setzt eigene Herstellungs- und Lagerbedingungen voraus; die zusätzliche Angabe **„traditionelle Flaschengärung“** darf nicht allein aus einer anfänglichen Flaschengärung abgeleitet werden.

**Warum umfüllen?** Das Verfahren erleichtert die Abfüllung und einheitliche Behandlung größerer Mengen. Es kann auch für bestimmte Flaschenformate eingesetzt werden. Daraus folgt nicht, dass jede Magnum oder jede Drei-Liter-Flasche transvasiert wurde: Die Zulässigkeit und Anwendung richten sich nach Produkt und Herkunftsvorschrift.

**Qualität beurteilen**: Hefelagerzeit, Grundwein, Sauerstoffmanagement und Abfüllung beeinflussen das Ergebnis. Eine pauschale Rangfolge „traditionell besser als Transfer, Transfer besser als Tank“ ersetzt keine Verkostung. Nicht jede Filtration entfernt sämtliche für die Textur wichtigen Bestandteile.

**Winzersekt** ist kein Synonym für dieses Verfahren. Die geschützte Bezeichnung verlangt traditionelle Flaschengärung und weitere Voraussetzungen der Erzeugerabfüllung.`,
      quiz: [
        {
          question:
            "Was unterscheidet das Transvasierverfahren von der Méthode Traditionnelle?",
          options: [
            "Die Zweitgärung findet im Tank statt",
            "Nach der Flaschengärung und Hefelagerung wird der Wein unter Gegendruck in einen Tank umgefüllt, filtriert und neu abgefüllt",
            "Es wird keine Dosage zugegeben",
            "Die Hefe wird vor der Zweitgärung entfernt",
          ],
          correct: 1,
          explanation:
            "Beim Transvasierverfahren findet die Zweitgärung in der Flasche statt, aber statt Remuage und Dégorgement wird der Wein unter Druck in einen Tank umgefüllt, filtriert und neu abgefüllt.",
        },
        {
          question:
            "Warum kann das Transvasierverfahren für bestimmte Formate eingesetzt werden?",
          options: [
            "Weil die Champagne das Transvasierverfahren erfunden hat",
            "Weil Umfüllen und Abfüllen die Bearbeitung bestimmter Formate erleichtern können",
            "Weil Großflaschen keinen Druck aushalten",
            "Weil die AOC-Regeln es vorschreiben",
          ],
          correct: 1,
          explanation:
            "Die Bearbeitung bestimmter Formate kann durch Transfer erleichtert werden. Es gilt aber keine allgemeine Regel, dass jede Flasche ab drei Litern transvasiert sein muss.",
        },
        {
          question:
            "Welche Etikettierung ist beim Transvasierverfahren in der EU erlaubt?",
          options: [
            "Méthode Traditionnelle",
            "Méthode Champenoise",
            "Flaschengärung (fermentation en bouteille)",
            "Méthode Ancestrale",
          ],
          correct: 2,
          explanation:
            "Da die Zweitgärung tatsächlich in der Flasche stattfindet, darf 'Flaschengärung' angegeben werden. 'Méthode Traditionnelle' ist nicht erlaubt, da Remuage und Dégorgement in der Originalflasche fehlen.",
        },
      ],
    },

    // ─── Lektion 5 ───────────────────────────────────────────
    {
      title: "Champagner — AOC, Häuser und Cuvées",
      content: `## Eine geschützte Herkunft

**Champagne** ist eine geschützte Herkunftsbezeichnung. Nur Wein, der aus dem abgegrenzten Gebiet und nach der gültigen Produktspezifikation erzeugt wird, darf so heißen. Die traditionelle Herstellung und Herkunft gehören zusammen; ein gleiches Verfahren anderswo macht den Wein nicht zu Champagne.

**Hauptsorten** sind Chardonnay, Pinot Noir und Meunier. Die anderen regulär zugelassenen Sorten sind Arbane, Petit Meslier, Pinot Blanc, Pinot Gris und seit **2025 Chardonnay rose**. Daneben ist Voltis im Anpassungsversuch ein gesonderter Fall; historische Listen mit genau sieben regulären Sorten sind nicht mehr aktuell.

**Stile**: Eine jahrgangslose Cuvée kann mehrere Erntejahre zusammenführen; ein Jahrgangs-Champagne bezieht sich auf den angegebenen Erntejahrgang. **Blanc de Blancs** stammt aus weißen Trauben, nicht zwingend ausschließlich Chardonnay. **Blanc de Noirs** wird weiß aus dunklen Trauben gekeltert. Für Rosé sind Mazeration und Assemblage mit stillem roten Champagne-Wein möglich.

**Hefelager und Reifung**: Für jahrgangslosen Champagne gelten mindestens **15 Monate Gesamtreifung**, darin mindestens **12 Monate auf der Hefe**. Jahrgangs-Champagne muss mindestens drei Jahre reifen. Längere Zeiten sind möglich und produktbezogen zu prüfen.

**Erzeugercodes**: **NM** bezeichnet einen Négociant-Manipulant, der neben möglichen eigenen Trauben auch Trauben, Most oder Wein zukauft. **RM** bezeichnet einen Récoltant-Manipulant, der Wein aus seiner eigenen Ernte in eigenen Betriebsräumen erzeugt. **CM** steht für eine erzeugende Genossenschaft; **RC** für ein Genossenschaftsmitglied, das Most oder Wein zurückerhält. Diese Codes sind keine automatische Rangliste.

**Crus**: Die bekannten Bezeichnungen Grand Cru und Premier Cru beziehen sich auf das historische System der Gemeinden. Das Comité Champagne nennt 17 Grand-Cru-Gemeinden. Herkunft, Cuvée und Herstellungsentscheidungen bleiben für die konkrete Flasche wichtig; ein Weltrekord zu Preis oder Umsatz wird hier nicht behauptet.`,
      quiz: [
        {
          question:
            "Was bedeutet der Code 'RM' auf einem Champagner-Etikett?",
          options: [
            "Réserve Millésimée — Jahrgangsreserve",
            "Récoltant-Manipulant — ein Winzer, der ausschließlich eigene Trauben verarbeitet",
            "Rosé Méthode — Rosé durch Mazeration",
            "Région de la Marne — Herkunft aus der Marne",
          ],
          correct: 1,
          explanation:
            "RM steht für Récoltant-Manipulant, also Winzer-Champagner (Grower Champagne). Diese Champagner stammen ausschließlich aus eigenen Trauben des Winzers.",
        },
        {
          question:
            "Wie viele Grand-Cru-Gemeinden gibt es in der Champagne?",
          options: ["7", "17", "42", "100"],
          correct: 1,
          explanation:
            "Die Champagne hat 17 Grand-Cru-Gemeinden (historisch 100 % des Traubenpreises) und 42 Premier-Cru-Gemeinden (90–99 %).",
        },
        {
          question:
            "Was ist die Besonderheit der Champagne bezüglich Rosé-Herstellung?",
          options: [
            "Rosé darf nur aus Chardonnay hergestellt werden",
            "Rosé kann nach den Champagne-Regeln durch Rotweinverschnitt oder Mazeration entstehen",
            "Rosé-Champagner muss mindestens 5 Jahre reifen",
            "Rosé darf nur aus Grand-Cru-Lagen stammen",
          ],
          correct: 1,
          explanation:
            "Champagne-Rosé kann durch Rotweinverschnitt oder Mazeration entstehen. Eine pauschale Behauptung, jede andere französische AOC verbiete das Verfahren, wäre unzutreffend.",
        },
      ],
    },

    // ─── Lektion 6 ───────────────────────────────────────────
    {
      title: "Crémant — Elsass, Loire, Burgund und darüber hinaus",
      content: `## Traditionelle Flaschengärung mit eigener Herkunft

**Crémant** ist eine geregelte Angabe für bestimmte Qualitätsschaumweine mit geschützter Ursprungsbezeichnung. Sie ist nicht allein auf Frankreich begrenzt. Zu den EU-Bedingungen gehören Handlese, begrenzte Mostausbeute, traditionelle Flaschengärung und mindestens **neun Monate Hefelager**. Zusätzlich gelten die jeweiligen Herkunftsspezifikationen.

**Französische Beispiele**: Crémant d'Alsace, de Bourgogne, de Loire, de Bordeaux, du Jura, de Limoux, de Die und de Savoie sind verschiedene Herkünfte. Sie unterscheiden sich bei Gebiet und zugelassenen Rebsorten; ein gemeinsamer Name bedeutet keine identische Cuvée.

**Loire**: Chenin Blanc ist eine wichtige Sorte. Chardonnay und Cabernet Franc sowie weitere zugelassene Sorten können ebenfalls verwendet werden. Die INAO beschreibt Weiß- und Rosé-Crémant aus Anjou, Saumur, Touraine und Cheverny sowie mindestens neun Monate Lagerung auf Latten.

**Die**: **Crémant de Die** wird hauptsächlich aus Clairette erzeugt und erhält eine zweite Gärung in der Flasche. Er ist nicht dasselbe wie **Clairette de Die**, die überwiegend Muscat und ergänzend Clairette nach einem ancestral geprägten Verfahren verwendet. Die ähnlich klingenden Namen sind deshalb nicht austauschbar.

**Beratung**: Vergleiche Herkunft, Rebsorten, Dosage und tatsächlich angegebene Reifezeit. Ein allgemeiner Preisbereich, ein angeblicher Anteil von mehr als 50 % für eine Herkunft oder eine garantierte Überlegenheit gegenüber Champagne ersetzt keine aktuelle Produkt- oder Marktprüfung.`,
      quiz: [
        {
                "question": "Wie lange muss Crémant bei traditioneller Flaschengärung mindestens auf der Hefe lagern?",
                "options": [
                        "3 Monate",
                        "6 Monate",
                        "9 Monate",
                        "15 Monate"
                ],
                "correct": 2,
                "explanation": "Die Mindestzeit auf der Hefe beträgt neun Monate; zusätzliche Herkunftsregeln sind zu beachten."
        },
        {
                "question": "Welche Aussage zu Crémant ist richtig?",
                "options": [
                        "Crémant ist immer Tankgärung",
                        "Crémant stammt zwingend nur aus Frankreich",
                        "Crémant unterliegt EU-Bedingungen und zusätzlichen Herkunftsregeln",
                        "Crémant enthält immer Muscat"
                ],
                "correct": 2,
                "explanation": "Die geregelte Angabe verbindet EU-Bedingungen mit der jeweiligen geschützten Herkunft."
        },
        {
                "question": "Welche Sorte prägt Crémant de Loire wesentlich?",
                "options": [
                        "Glera",
                        "Riesling",
                        "Chenin Blanc",
                        "Mauzac ausschließlich"
                ],
                "correct": 2,
                "explanation": "Chenin Blanc ist eine wichtige Loire-Sorte; eine einzelne Sorte oder ein Aroma ist aber keine Garantie für jede Cuvée."
        }
],
    },

    // ─── Lektion 7 ───────────────────────────────────────────
    {
      title: "Cava — Spaniens traditioneller Schaumwein",
      content: `## Traditionelle Flaschengärung mit eigenen Herkunftsregeln

**Cava** ist eine spanische geschützte Herkunft, deren Gebiet nicht auf einen einzigen zusammenhängenden Ort begrenzt ist. Ein wichtiges Zentrum liegt im Penedès rund um Sant Sadurní d'Anoia. Herstellung und zugelassene Sorten richten sich nach der DO-Spezifikation, nicht nach einer allgemeinen Gleichsetzung mit Champagne.

**Klassische Sorten**: Macabeo, Xarel·lo und Parellada bilden die bekannte Triade. Weitere zugelassene Sorten ergänzen die Möglichkeiten; Trepat ist unter anderem für Rosé-Cava relevant.

**Kategorien nach Hefelager**: Cava de Guarda mindestens **neun Monate**; Guarda Superior **Reserva 18**, **Gran Reserva 30** und **Paraje Calificado 36 Monate**. Die ehemalige 15-Monats-Angabe für Reserva ist nicht der aktuelle Mindestwert. Zu den Reifezeiten kommen eigene Produktions- und Herkunftsanforderungen; seit **2025** gelten Bio-Anforderungen für Guarda Superior, nicht pauschal für sämtlichen Cava.

**Herstellerhistorie**: Codorníu nennt **Josep Raventós** und das Jahr **1872** für seine erste traditionell erzeugte Schaumweinflasche. Aktuelle Weltmarktführerschaften oder unveränderliche Anteile an der Gesamtproduktion werden hier nicht behauptet.

**Corpinnat** ist eine eigene kollektive EU-Marke, öffentlich vorgestellt **2018**; der Austritt damaliger Mitglieder aus der DO Cava erfolgte **2019**. Sie verlangt Bio-Trauben, Handlese, Vinifikation im eigenen Betrieb, mindestens **18 Monate** Reife und mindestens **90 % historische Sorten**. Chardonnay und Pinot Noir sind derzeit begrenzt möglich; das Markensystem sieht ihren Ausschluss ab der Ernte **2034** vor.

**Vergleich**: Prüfe Herkunft, Sorten, Hefelager und Süßestufe am konkreten Produkt. Ein allgemeines Versprechen gleicher Qualität für ein Drittel des Champagne-Preises ist keine überprüfte Produkteigenschaft.`,
      quiz: [
        {
          question:
            "Welche drei autochthonen Rebsorten bilden die klassische Cava-Triade?",
          options: [
            "Chardonnay, Pinot Noir, Pinot Meunier",
            "Macabeo, Xarel·lo, Parellada",
            "Garnacha, Tempranillo, Monastrell",
            "Albariño, Verdejo, Godello",
          ],
          correct: 1,
          explanation:
            "Die drei traditionellen Cava-Sorten Macabeo, Xarel·lo und Parellada unterscheiden den Cava-Stil grundlegend von Champagner.",
        },
        {
          question: "Was ist 'Corpinnat'?",
          options: [
            "Eine Unterregion der DO Cava",
            "Eine kollektive Marke für Schaumwein aus dem historischen Penedès mit eigenen Herstellungsregeln",
            "Eine Rebsorte für Rosé-Cava",
            "Ein Süßegrad für Cava",
          ],
          correct: 1,
          explanation:
            "Corpinnat ist eine 2018 öffentlich vorgestellte kollektive EU-Marke; der Austritt damaliger Mitglieder aus der DO Cava erfolgte 2019. Es verlangt ökologischen Anbau, mindestens 90 % historische Sorten, Handlese und Vinifikation im eigenen Betrieb innerhalb der definierten Herkunft.",
        },
        {
          question:
            "Wie lange muss ein Cava de Paraje Calificado mindestens auf der Hefe lagern?",
          options: [
            "9 Monate",
            "18 Monate",
            "30 Monate",
            "36 Monate",
          ],
          correct: 3,
          explanation:
            "Cava de Paraje Calificado — die höchste Stufe — verlangt mindestens 36 Monate Hefelager, ökologischen Anbau, Handlese und Einzellagen-Herkunft.",
        },
      ],
    },

    // ─── Lektion 8 ───────────────────────────────────────────
    {
      title: "Prosecco — Italien DOC und DOCG",
      content: `## DOC und DOCG unterscheiden

**Prosecco** ist eine geschützte Herkunftsbezeichnung aus Nordostitalien. **Glera** ist die wichtigste Rebsorte, nicht die Herkunftsangabe selbst. Glera aus einem anderen Gebiet ist deshalb nicht automatisch Prosecco.

**Prosecco DOC** umfasst festgelegte Gebiete in Veneto und Friaul-Julisch Venetien. Die Produktspezifikation unterscheidet stillen Wein, Frizzante und Spumante. Tankgärung ist verbreitet, doch Verfahren und genaue Produktangaben müssen zur jeweiligen Flasche passen.

**Conegliano Valdobbiadene Prosecco Superiore DOCG** ist eine eigene Herkunft in den Hügeln nördlich von Treviso. **Rive** bezeichnet abgegrenzte zusätzliche geografische Angaben auf der Ebene bestimmter Gemeinden oder Ortsteile; es gibt **43 Rive**, nicht 43 gleichartige Einzellagen. **Superiore di Cartizze** ist eine besondere Unterzone. Diese Bezeichnungen sind keine frei übertragbaren „Grand Cru“-Titel.

**Asolo Prosecco DOCG** ist eine weitere eigenständige Herkunft. Eine DOCG-Angabe ersetzt nicht die Verkostung und beweist nicht automatisch, dass jede Flasche besser als jede DOC-Flasche schmeckt.

**Prosecco Rosé DOC** wird als Spumante mit Jahrgangsangabe erzeugt. Nach der aktuellen Spezifikation enthält er **85–90 % Glera und 10–15 % Pinot Noir**, zusammen 100 %. Ein bloßes „mindestens 85 % Glera“ ohne Obergrenze und passende Ergänzung beschreibt diese Rosé-Regel unvollständig.

**Süße**: Extra Dry bedeutet bei Schaumwein 12–17 g/l Zucker und ist süßer als die Brut-Grenze. Der Begriff ist nicht mit „besonders trocken“ im Alltag gleichzusetzen.`,
      quiz: [
        {
          question:
            "Warum wurde die Rebsorte 'Prosecco' 2009 in 'Glera' umbenannt?",
          options: [
            "Weil die EU neue Namenskonventionen einführte",
            "Um Prosecco als geografische Herkunftsbezeichnung zu schützen und zu verhindern, dass Produzenten außerhalb Italiens die Rebsorte als 'Prosecco' vermarkten",
            "Weil eine neue Klon-Auswahl vorgenommen wurde",
            "Um die Rebsorte vom Wein zu unterscheiden",
          ],
          correct: 1,
          explanation:
            "Durch die Trennung von Sortenname und Herkunftsbezeichnung wurde 'Prosecco' zur geschützten geografischen Angabe — Glera-Trauben aus anderen Ländern dürfen nicht als Prosecco vermarktet werden.",
        },
        {
          question: "Was ist 'Cartizze' im Prosecco-Kontext?",
          options: [
            "Eine Rebsorte für Premium-Prosecco",
            "Eine besondere Unterzone innerhalb der DOCG Conegliano Valdobbiadene",
            "Ein Charmat-Verfahren für Spitzen-Prosecco",
            "Der Name des Prosecco-Konsortiums",
          ],
          correct: 1,
          explanation:
            "Superiore di Cartizze bezeichnet eine besondere Unterzone der DOCG Conegliano Valdobbiadene, keinen allgemeinen Grand-Cru-Titel.",
        },
        {
          question:
            "Welche Besonderheit gilt für Prosecco Rosé DOC (seit 2020)?",
          options: [
            "Er darf nur als Frizzante produziert werden",
            "Er muss 100 % Glera enthalten",
            "Er muss 85–90 % Glera und 10–15 % Pinot Noir, zusammen 100 % enthalten und darf nur als Spumante mit Jahrgangsangabe produziert werden",
            "Er darf nur in der DOCG-Zone hergestellt werden",
          ],
          correct: 2,
          explanation:
            "Prosecco Rosé DOC verlangt 85–90 % Glera + 10–15 % Pinot Noir, zusammen 100 %, darf nur als Spumante hergestellt werden und muss eine Jahrgangsangabe tragen — strenger als Standard-Prosecco.",
        },
      ],
    },

    // ─── Lektion 9 ───────────────────────────────────────────
    {
      title: "Deutscher Sekt — Winzersekt vs. Großkellerei",
      content: `## Herkunft und Herstellung getrennt lesen

**Sekt** umfasst verschiedene Stile und Herstellungsverfahren. Ein deutscher Abfüll- oder Versektungsbetrieb allein beweist nicht, dass die Grundweine aus deutschen Trauben stammen.

**Deutscher Sekt** wird in Deutschland ausschließlich aus deutschen Grundweinen und damit deutschen Trauben hergestellt. **Sekt b.A.** grenzt die Herkunft zusätzlich auf ein bestimmtes deutsches Anbaugebiet ein. „In Deutschland versektet“ allein ist nicht dieselbe Herkunftsangabe.

**Winzersekt** verbindet traditionelle Flaschengärung mit den Voraussetzungen der Erzeugerabfüllung. Eigene Trauben können von einem Weingut oder einem zulässigen Erzeugerzusammenschluss stammen. Mindestens neun Monate Hefelager sind erforderlich; längere Zeiten sind möglich und werden produktbezogen angegeben.

**Private Verbandsregeln**: Das VDP.SEKT.STATUT kennt **VDP.SEKT** und **VDP.SEKT.PRESTIGE®**, nicht eine automatisch vom Stillwein übernommene Dreistufenpyramide. Vorgeschrieben sind traditionelle Flaschengärung und mindestens 15 beziehungsweise 36 Monate Hefelager. Bei Jahrgangs-VDP.SEKT sind es mindestens 24 Monate, bei Jahrgangs-PRESTIGE mindestens 36. Dies sind private Verbandsanforderungen zusätzlich zum staatlichen Recht.

**Riesling-Sekt** ist ein wichtiger deutscher Stil, wird aber nicht ausschließlich in Deutschland erzeugt. Frische Säure und sortentypische Frucht können ebenso wie Chardonnay und Burgundersorten zur Stilbildung beitragen.

**Schaumweinsteuer**: Nach § 2 SchaumwZwStG beträgt der reguläre Satz 136 Euro je Hektoliter, rechnerisch 1,02 Euro je 0,75 Liter vor Mehrwertsteuer. Für Schaumwein mit weniger als 6 % Vol. gelten 51 Euro je Hektoliter. Diese Steuerregel ist kein Qualitätsmerkmal.

**Geschichtlicher Bezug**: Kessler in Esslingen verweist auf das Gründungsjahr 1826. Historische Namen und heutige Unternehmensgruppen sollten nicht gleichgesetzt werden.`,
      quiz: [
        {
          question:
            "Was garantiert die Bezeichnung 'Sekt b.A.' auf dem Etikett?",
          options: [
            "Dass der Sekt im Charmat-Verfahren hergestellt wurde",
            "Dass die Trauben aus einem bestimmten deutschen Anbaugebiet stammen",
            "Dass der Sekt mindestens 36 Monate gereift ist",
            "Dass es ein Winzersekt ist",
          ],
          correct: 1,
          explanation:
            "Sekt b.A. (bestimmter Anbaugebiete) garantiert, dass die Trauben aus einem definierten deutschen Anbaugebiet stammen. Auch 'Deutscher Sekt' verlangt deutsche Grundweine; Sekt b.A. grenzt die Herkunft zusätzlich auf ein bestimmtes Anbaugebiet ein.",
        },
        {
          question:
            "Wer gründete 1826 die erste deutsche Sektkellerei?",
          options: [
            "Henkell",
            "Georg Christian Kessler in Esslingen",
            "Rotkäppchen in Freyburg",
            "Deinhard in Koblenz",
          ],
          correct: 1,
          explanation:
            "Georg Christian Kessler gründete 1826 die erste deutsche Sektkellerei in Esslingen am Neckar, nachdem er bei Veuve Clicquot in der Champagne gelernt hatte.",
        },
        {
          question:
            "Was beschreibt Riesling-Sekt zutreffend?",
          options: [
            "Er wird ausschließlich im Charmat-Verfahren hergestellt",
            "Riesling bietet hohe Säure, intensive Aromatik und Mineralität — ein wichtiger Schaumwein-Stil, nicht ausschließlich in Deutschland erzeugt",
            "Er wird nur in der Mosel-Region produziert",
            "Er ist immer süß (Demi-Sec oder Doux)",
          ],
          correct: 1,
          explanation:
            "Riesling-Sekt ist ein bedeutender deutscher Stil, nicht aber ausschließlich deutschen Erzeugern vorbehalten.",
        },
      ],
    },

    // ─── Lektion 10 ──────────────────────────────────────────
    {
      title: "Franciacorta, Cap Classique und weitere Schaumweine der Welt",
      content: `## Regionale Regeln statt einer Welt-Rangliste

**Franciacorta DOCG** stammt aus der Lombardei und wird traditionell in der Flasche vergoren. Zugelassen sind Chardonnay und Pinot Noir, Pinot Blanc bis 50 % sowie Erbamat bis 10 %; für einzelne Stile gelten zusätzliche Einschränkungen.

**Reifung auf der Hefe**: Die Grundkategorie verlangt mindestens **18 Monate**, **Satèn und Rosé 24**, **Millésimato 30** und **Riserva 60 Monate**. Diese regionalen Anforderungen sind nicht für jede Kategorie strenger als die Champagne-Regeln.

**Satèn** wird aus weißen Trauben erzeugt: mindestens 50 % Chardonnay und höchstens 50 % Pinot Blanc. Erbamat ist hier ausgeschlossen. Reduzierter Druck von höchstens etwa 5 bar und mindestens 24 Monate Hefelager gehören zu diesem geregelten Stil; der Name allein sagt nichts über ein beliebiges anderes Produkt.

**England**: Einige Lagen in Kent und anderen südenglischen Gebieten sind kreidegeprägt. Das erklärt nicht sämtliche Standorte und macht den Wein nicht automatisch identisch mit Champagne. Domaine Evremond ist ein konkretes gemeinsames Projekt von Taittinger und Hatch Mansfield in Kent.

**Weitere Regionen**: Traditionell erzeugte Schaumweine gibt es beispielsweise in Südafrika, Kalifornien, Australien und Neuseeland. **Cap Classique** ist ein südafrikanischer Begriff; **Roederer Estate** gehört zum Haus Louis Roederer und liegt im kalifornischen Anderson Valley. Auf der einzelnen Flasche gelten die jeweiligen Herkunfts- und Herstellerangaben.

**Vergleichen**: Herkunft, Methode, Hefelager, Süßestufe und Geschmack sind getrennte Merkmale. Eine neue Region oder lange Mindestlagerzeit beweist keinen Weltrekord und keine pauschale Qualitätsüberlegenheit.`,
      quiz: [
        {
          question: "Was ist 'Satèn' in der Franciacorta?",
          options: [
            "Eine Rebsorte",
            "Ein exklusiver Stil mit reduziertem Druck (max. 5 bar), ausschließlich aus weißen Trauben, mindestens 24 Monate Hefelager",
            "Die höchste Qualitätsstufe (wie Gran Reserva)",
            "Ein Dosage-Typ",
          ],
          correct: 1,
          explanation:
            "Satèn ist ein einzigartiger Franciacorta-Stil: reduzierter Druck (max. 5 bar), nur weiße Trauben, mindestens 24 Monate Hefelager. Der Name spielt auf 'Seide' (seta) an.",
        },
        {
          question:
            "Warum ist Südengland geologisch ideal für Schaumwein nach Champagner-Art?",
          options: [
            "Wegen des warmen Klimas",
            "Weil die Kreideböden in Sussex/Kent/Hampshire in manchen Lagen kreidegeprägt, ähnlich einigen Lagen der Champagne sind",
            "Weil England die gleichen Rebsorten anbaut wie Cava",
            "Wegen der sandigen Böden an der Küste",
          ],
          correct: 1,
          explanation:
            "Die Kreideböden in Sussex, Kent und Hampshire sind in manchen Lagen kreidegeprägt. Das beschreibt jedoch nicht sämtliche Standorte oder einen automatisch gleichen Wein.",
        },
        {
          question:
            "Welches Champagnerhaus besitzt Roederer Estate im Anderson Valley?",
          options: [
            "Moët & Chandon",
            "Taittinger",
            "Louis Roederer",
            "Bollinger",
          ],
          correct: 2,
          explanation:
            "Louis Roederer besitzt Roederer Estate im Anderson Valley (Kalifornien). Es ist eines von mehreren Champagnerhäusern, die in die Neue Welt investiert haben.",
        },
      ],
    },

    // ─── Lektion 11 ──────────────────────────────────────────
    {
      title: "Rebsorten für Schaumwein",
      content: `## Rebsorten als Teil des Stils

**Chardonnay, Pinot Noir und Meunier** sind die drei wichtigsten Champagne-Sorten. Chardonnay kann Frische und Zitrusbeschreibungen beitragen; Pinot Noir Struktur und dunklere Fruchtnoten; Meunier Fruchtigkeit und Rundheit. Solche Beschreibungen sind Orientierungshilfen und keine identische Aromagarantie für jeden Wein.

**Helle Weine aus dunklen Trauben**: Ohne längeren Schalenkontakt kann aus Pinot Noir und Meunier weißer Grundwein entstehen. Die schonende Pressung hilft, eine stärkere Farbextraktion zu begrenzen.

**Pressfraktionen in der Champagne**: Bei der vorgeschriebenen Pressung eines Satzes von 4.000 kg Trauben werden **2.050 Liter Cuvée** und **500 Liter Taille** unterschieden. Es sind Fraktionen mit verschiedenen Eigenschaften, nicht automatisch ein Beweis, dass jede Cuvée einer anderen Flasche qualitativ überlegen ist.

**Glera** prägt Prosecco. **Macabeo, Xarel·lo und Parellada** bilden die klassische Cava-Triade. **Riesling** ist bei deutschen Sekten wichtig und auch außerhalb Deutschlands zu finden. **Chenin Blanc** kann Loire-Schaumweine prägen; **Mauzac** gehört zur geregelten Blanquette de Limoux Méthode Ancestrale.

**Neue und seltene Sorten**: Die gültigen Herkunftsregeln sind maßgeblich. Franciacorta erlaubt Erbamat bis zu einem begrenzten Anteil; Champagne führt seit 2025 Chardonnay rose unter den regulären Sorten. Ein historischer Kurs mit genau sieben Champagne-Sorten darf diese Änderung nicht übergehen.

**Hefelager und Grundwein**: Rebsorte ist nur ein Einfluss. Lesereife, Pressung, Gärung, Säure, Assemblage, Hefelager und Dosage wirken zusammen. Ein weltweit eindeutiges „beste Sorte“-Ranking lässt sich daraus nicht ableiten.`,
      quiz: [
        {
                "question": "Welche Aussage zu Meunier in der Champagne ist richtig?",
                "options": [
                        "Er ist ausschließlich für Rosé erlaubt",
                        "Er gehört zu den drei wichtigen Hauptsorten und kann Fruchtigkeit und Rundheit beitragen",
                        "Er macht immer exakt 32 % aus",
                        "Er wird nur als Tafeltraube verwendet"
                ],
                "correct": 1,
                "explanation": "Meunier gehört neben Chardonnay und Pinot Noir zu den wichtigen Hauptsorten. Flächenanteile sind zeitabhängig."
        },
        {
                "question": "Welche Pressfraktionen werden aus 4.000 kg Champagne-Trauben unterschieden?",
                "options": [
                        "2.050 l Taille und 500 l Cuvée",
                        "2.050 l Cuvée und 500 l Taille",
                        "Nur 4.000 l Cuvée",
                        "Identische, unbegrenzte Mengen"
                ],
                "correct": 1,
                "explanation": "Die geregelten Fraktionen sind 2.050 Liter Cuvée und 500 Liter Taille."
        },
        {
                "question": "Welche Aussage zu Erbamat in Franciacorta ist zutreffend?",
                "options": [
                        "Erbamat ist die einzig erlaubte Sorte",
                        "Erbamat darf überall unbegrenzt verwendet werden",
                        "Erbamat ist begrenzt zugelassen, bei Satèn aber ausgeschlossen",
                        "Erbamat muss rot vergoren werden"
                ],
                "correct": 2,
                "explanation": "Die Herkunftsregeln begrenzen Erbamat auf 10 %; für Satèn ist die Sorte ausgeschlossen."
        }
],
    },

    // ─── Lektion 12 ──────────────────────────────────────────
    {
      title: "Dosage und Süßegrade",
      content: `## Zuckerangabe und Wahrnehmung trennen

Die **Dosage** wird bei der traditionellen Methode nach dem Entfernen des Hefesatzes zugegeben. Sie kann Zucker enthalten und den Stil beeinflussen. Der **Zuckergehalt des fertigen Weins** ist die Grundlage seiner Süßestufe; Dosage-Menge und analytischer Endzucker sind nicht in jedem Fall identisch.

**EU-Süßestufen** nach Verordnung 2019/33, Anhang III: **Brut Nature**: unter 3 g/l und kein Zucker nach der zweiten Gärung zugesetzt. **Extra Brut**: 0–6 g/l. **Brut**: unter 12 g/l. **Extra Dry / Extra Sec**: 12–17 g/l. **Dry / Sec**: 17–32 g/l. **Demi-Sec**: 32–50 g/l. **Doux**: über 50 g/l. Für die Kennzeichnung gelten außerdem die rechtlichen Toleranz- und Überschneidungsregeln.

**Nicht vom Namen täuschen lassen**: „Extra Dry“ ist in dieser Systematik süßer als „Brut“. Es ist keine Behauptung, dass jeder Extra Dry subjektiv gleich schmeckt.

**Balance**: Säure, Frucht und Prickeln beeinflussen die Süßewahrnehmung. Ein säurereicher Wein kann bei mehr Zucker trockener wirken als ein säureärmerer mit weniger Zucker. Solche Vergleiche sind sensorische Beispiele, keine mathematische Geschmacksformel.

**Ohne Dosage** bedeutet nicht automatisch besser, gesünder oder bio. Niedriger Zucker macht den enthaltenen Alkohol nicht risikofrei. Das Herstellungsverfahren, die Herkunft und die persönliche Wahrnehmung bleiben eigene Fragen.

**Reifung**: Duft und Geschmack können sich nach dem Degorgieren verändern. Der Zucker verschwindet dabei nicht einfach, nur weil er als „integriert“ beschrieben wird. Ein Degorgierdatum kann bei produktbezogenen Vergleichen hilfreich sein; daraus folgt keine allgemeine Haltbarkeitsgarantie.`,
      quiz: [
        {
                "question": "Welche Süßestufe hat die definierte Obergrenze unter 12 g/l?",
                "options": [
                        "Doux",
                        "Dry",
                        "Brut",
                        "Extra Dry"
                ],
                "correct": 2,
                "explanation": "Brut ist die Bezeichnung mit der Obergrenze unter 12 g/l; andere Stufen haben eigene Bereiche."
        },
        {
                "question": "Warum führt Extra Dry häufig zu Missverständnissen?",
                "options": [
                        "Es ist der trockenste Stil",
                        "Es bezeichnet 12–17 g/l und ist damit in der Systematik süßer als Brut",
                        "Es ist ausschließlich für Prosecco erlaubt",
                        "Es bedeutet alkoholfrei"
                ],
                "correct": 1,
                "explanation": "Extra Dry enthält 12–17 g/l Zucker. Der alltägliche Eindruck des Wortes dry führt leicht in die Irre."
        },
        {
                "question": "Was gilt zusätzlich für Brut Nature?",
                "options": [
                        "Zwingend mindestens 3 g/l",
                        "Keine Säure",
                        "Kein Zucker nach der zweiten Gärung zugesetzt und unter 3 g/l",
                        "Ausschließlich Tankgärung"
                ],
                "correct": 2,
                "explanation": "Die Angabe verlangt sowohl den Zuckerbereich unter 3 g/l als auch den Verzicht auf Zuckerzugabe nach der zweiten Gärung."
        }
],
    },

    // ─── Lektion 13 ──────────────────────────────────────────
    {
      title: "Sensorik und Verkostung von Schaumwein",
      content: `## Beobachten statt Qualität aus Blasen abzuleiten

Bei der Verkostung können **Farbe, Duft, Geschmack und Textur** getrennt beschrieben werden. Ein klares Glas und vergleichbare Temperatur erleichtern den Vergleich. Für eine Beurteilung muss kein Alkohol geschluckt werden.

**Perlage**: Beobachte, wo Blasen entstehen, wie sie aufsteigen und wie sich Schaum und Prickeln verändern. Glasoberfläche, Temperatur, Zeit seit dem Einschenken und gelöstes Kohlendioxid wirken mit. Kleine Blasen allein beweisen weder eine bestimmte Methode noch hohe Qualität.

**Duft**: Zitrus, Apfel, Birne und Blüten können als Beschreibungen fruchtbetonter Stile dienen; Brioche, Nuss oder geröstete Noten können bei Hefelagerung und Reifung auftreten. Das sind sensorische Orientierungshilfen, keine analytische Zutatenliste.

**Im Mund**: Beschreibe Säure, wahrgenommene Süße, Prickeln, Körper und Nachklang. Ein Wein mit derselben Zuckerangabe kann wegen anderer Säure oder Aromatik unterschiedlich süß wirken. „Brut“ ist eine rechtliche Süßekategorie, kein Versprechen identischen Geschmacks.

**Fehlton oder Stil?** Oxidative Noten können gewollt sein; unangenehme Veränderungen können dagegen auf Lager- oder Herstellungsprobleme hindeuten. Lichtgeschmack, Korkfehler und Oxidation sollten nicht allein aus einer einzelnen Blase oder der Farbe diagnostiziert werden.

**Vergleichen**: Gleiche Gläser, ähnliche Füllmenge und passende Temperaturen helfen. Notiere konkrete Eindrücke statt eine Herkunft oder Qualität aus einem einzelnen Merkmal zu behaupten.`,
      quiz: [
        {
                "question": "Was lässt sich aus kleinen Blasen allein ableiten?",
                "options": [
                        "Immer höchste Qualität",
                        "Immer Champagne-Herkunft",
                        "Kein sicherer Nachweis für Herkunft oder Qualität",
                        "Garantiert kein Zucker"
                ],
                "correct": 2,
                "explanation": "Glas, Temperatur und Zeit beeinflussen die Blasen; ein einzelnes Merkmal beweist keine Qualität."
        },
        {
                "question": "Welche Beschreibung kann mit Hefelager und Reifung verbunden sein?",
                "options": [
                        "Brioche oder Brotkruste",
                        "Immer zugesetztes Brot",
                        "Zwingend Erdbeerlikör",
                        "Garantiert mehr Alkohol"
                ],
                "correct": 0,
                "explanation": "Brioche und Brotkruste sind mögliche sensorische Beschreibungen, keine Zutatenanalyse."
        },
        {
                "question": "Welche Bedingungen helfen beim Vergleichen?",
                "options": [
                        "Unterschiedliche Gläser und Temperaturen",
                        "Gleiche Gläser und ähnliche Servierbedingungen",
                        "Möglichst starkes Schütteln",
                        "Alle Flaschen warm lagern"
                ],
                "correct": 1,
                "explanation": "Vergleichbare Bedingungen reduzieren Einflüsse von Glas und Temperatur."
        }
],
    },

    // ─── Lektion 14 ──────────────────────────────────────────
    {
      title: "Flaschengrößen und Etiketten",
      content: `## Inhalt, Herkunft und Format

Die übliche Weinflasche enthält **0,75 Liter**, eine **Magnum 1,5 Liter** und eine **Jeroboam bei Schaumwein 3 Liter**. Weitere Größen und historische Namen variieren nach Region und Erzeuger. Verlasse dich beim Kauf auf die aufgedruckte Nettofüllmenge; „Piccolo“ ist kein zuverlässiger Rechenbeweis für exakt ein Viertel einer 0,75-Liter-Flasche.

**Format und Herstellung**: Eine größere Flasche lässt nicht automatisch auf Transferherstellung schließen. Welche Formate in der Gärflasche verbleiben dürfen oder umgefüllt werden, bestimmt die jeweilige Produktspezifikation. Auch längere Lagerfähigkeit ist nicht für jede Magnum garantiert.

**Verschluss**: Bei einer Korkflasche hält die Drahtsicherung (**Agraffe**) den Stopfen gegen den Innendruck. Halte den Korken beim Lösen ständig fest und richte die Flasche niemals auf Personen. Ein Kronkorken kann in der Herstellung oder bei bestimmten fertigen Produkten verwendet werden; er ist allein kein Qualitätsurteil.

**Etikett lesen**: Herkunftsbezeichnung, Alkoholgehalt, Nettofüllmenge, Süßestufe, Erzeugerangabe und gegebenenfalls Jahrgang sind wichtiger als ein dekorativer Flaschenname. Für neuere Weine gelten außerdem die EU-Regeln zu Nährwerten und Zutaten; bestimmte Angaben können über ein elektronisches Etikett bereitgestellt werden, während Energie und Allergene am physischen Etikett verbleiben müssen.

**Champagne-Codes** wie NM, RM oder CM bezeichnen die registrierte Erzeugerart. Sie ersetzen keine Angabe zum tatsächlichen Geschmack oder zur Dauer des Hefelagers.`,
      quiz: [
        {
                "question": "Welchen Inhalt hat eine Magnum?",
                "options": [
                        "0,2 Liter",
                        "1,5 Liter",
                        "3 Liter",
                        "6 Liter"
                ],
                "correct": 1,
                "explanation": "Magnum bezeichnet eine 1,5-Liter-Flasche."
        },
        {
                "question": "Welche Funktion hat die Agraffe?",
                "options": [
                        "Sie färbt den Wein",
                        "Sie entfernt Hefesatz",
                        "Sie hält den Stopfen gegen den Innendruck",
                        "Sie misst den Restzucker"
                ],
                "correct": 2,
                "explanation": "Die Drahtsicherung hält den Stopfen. Beim Lösen muss er ständig kontrolliert werden."
        },
        {
                "question": "Was bezeichnet Rive?",
                "options": [
                        "Einen Süßegrad",
                        "Ausschließlich Tankgärung",
                        "Eine abgegrenzte geografische Angabe für bestimmte Gemeinden oder Ortsteile",
                        "Den Rosé-Stil"
                ],
                "correct": 2,
                "explanation": "Rive sind zusätzliche geografische Angaben in der DOCG Conegliano Valdobbiadene, nicht einfach 43 identische Einzellagen."
        }
],
    },

    // ─── Lektion 15 ──────────────────────────────────────────
    {
      title: "Lagerung, Temperatur und Service",
      content: `## Sicher öffnen und sauber servieren

**Lagern**: Kühl, dunkel und möglichst temperaturstabil aufbewahren. Große Temperaturschwankungen und starke Lichteinwirkung vermeiden. Lagerfähigkeit hängt von Wein, Verschluss und bisherigen Bedingungen ab; aus „Vintage“ oder einem Preis folgt keine garantierte Haltbarkeit von Jahrzehnten. Beachte Hinweise des jeweiligen Erzeugers.

**Kühlen**: Das Comité Champagne empfiehlt für den Service von Champagne etwa **8–10 °C**. Eine Eis-Wasser-Mischung im Kühler ist geeignet; ein Gefrierfach birgt das Risiko des Einfrierens und einer beschädigten Flasche. Benutze es nicht als unbeaufsichtigte Schnellkühlung.

**Öffnen**: Nicht schütteln. Halte den Korken beim Entfernen der Folie und Lösen der Agraffe ständig fest. Die Flasche etwa **30–45°** neigen und niemals auf Personen richten. Halte den Stopfen kontrolliert und drehe langsam die Flasche. Lass den Druck behutsam entweichen. Ein Knall ist kein Qualitätsmerkmal. Keine Anleitung zum Säbeln oder freien Abschießen des Korkens.

**Gläser**: Verwende **saubere, gut gespülte Gläser** ohne Fett- oder Reinigungsmittelrückstände. Das Comité Champagne empfiehlt Heißwasserspülen und Lufttrocknung. Ein geeigneter Nukleationspunkt im Glas kann die Bläschenbildung unterstützen; das ist kein Grund, ungewaschene Gläser zu verwenden.

**Einschenken**: Langsam einschenken, den ersten Schaum abklingen lassen und Platz für Duft und erneutes Einschenken lassen. Ein tulpenförmiges Glas kann Duft und Perlage zusammenführen. Die Form macht einen Wein nicht automatisch besser.

**Geöffnete Flasche**: Mit geeignetem Schaumweinverschluss verschließen und kühl halten. Ein Löffel im Flaschenhals ist kein druckdichter Verschluss. Ein fixer Zeitraum garantiert weder unveränderte Perlage noch Geschmack.`,
      quiz: [
        {
          question:
            "Warum sollte beim Öffnen einer Champagnerflasche die Flasche und nicht der Korken gedreht werden?",
          options: [
            "Weil der Korken sonst bricht",
            "Weil das Drehen der Flasche kontrollierten Druckabbau ermöglicht und CO₂-Verlust minimiert — das ideale Geräusch ist ein leises Seufzen",
            "Weil es die Tradition vorschreibt",
            "Weil der Wein dadurch schneller abkühlt",
          ],
          correct: 1,
          explanation:
            "Die Flasche wird gedreht, nicht der Korken. Dies ermöglicht kontrollierten Druckabbau. Ein leises Seufzen (soupir) ist ideal — ein Knall bedeutet unnötigen CO₂-Verlust.",
        },
        {
          question:
            "Welche Serviertemperatur nennt das Comité Champagne als Orientierung?",
          options: [
            "4–6 °C",
            "6–8 °C",
            "Etwa 8–10 °C",
            "Zimmertemperatur (18–20 °C)",
          ],
          correct: 2,
          explanation:
            "Das Comité Champagne nennt etwa 8–10 °C. Der konkrete Erzeuger kann für seine Cuvée ergänzende Hinweise geben.",
        },
        {
          question:
            "Warum haben einige Schaumweingläser einen eingeätzten Punkt im Boden?",
          options: [
            "Als Qualitätssiegel des Herstellers",
            "Als Nukleationspunkt (point d'effervescence) für eine gleichmäßige Perlage",
            "Zur Messung des Füllstands",
            "Als Markierung für die richtige Glasdrehung beim Einschenken",
          ],
          correct: 1,
          explanation:
            "Der eingeätzte Punkt (point d'effervescence) dient als Nukleationspunkt für CO₂-Bläschen. Ohne solche Mikrokratzer kann in sehr sauberen Gläsern die Perlage schwach ausfallen.",
        },
      ],
    },

    // ─── Lektion 16 ──────────────────────────────────────────
    {
      title: "Food Pairing mit Schaumwein",
      content: `## Vorschläge zum Probieren, keine Naturgesetze

Schaumwein kann ein Speisenbegleiter sein. Säure, wahrgenommene Süße, Frucht und Prickeln beeinflussen den gemeinsamen Eindruck. Die folgenden Kombinationen sind **sensorische Vorschläge**, keine gesundheitlichen Aussagen und keine Garantie, dass jede Person sie gleich empfindet.

**Frische und Kontrast**: Ein trockener Schaumwein kann neben salzigen oder reichhaltigen Speisen als frisch empfunden werden. Daraus folgt keine nachgewiesene Fettauflösung im Mund. Kohlendioxid emulgiert nicht einfach Speisefett und löst auch kein Fischprotein auf.

**Zum Vergleichen**: Probiere etwa Brut zu frittiertem Gemüse, Riesling-Sekt zu mild zubereitetem Fisch oder Crémant zu Flammkuchen. Ein fruchtbetonter Prosecco kann neben Antipasti interessant wirken. Bei reiferen, nussigen Schaumweinen können Pilzgerichte einen passenden aromatischen Bezug anbieten.

**Dessert**: Die tatsächliche Süße der Speise und des Weins zählt. Ein sehr süßes Dessert kann einen trockenen Wein vergleichsweise sauer erscheinen lassen; Demi-Sec oder ein süßerer Stil kann daher eine Alternative sein. Süßebezeichnungen ersetzen keine individuelle Verkostung.

**Schärfe**: Alkohol und Prickeln können neben stark scharfen Speisen unangenehm wirken. Das ist keine pauschale Unverträglichkeit für jede Person oder jedes Gericht. Mit kleinen Probemengen lässt sich die Kombination beurteilen; alkoholfreie Alternativen gehören ebenfalls zur Auswahl.

**Kein Gesundheitsargument**: Ein Pairing macht Alkohol nicht gesünder. Die DGE empfiehlt, auf alkoholische Getränke zu verzichten; auch kleine Mengen können Risiken tragen.`,
      quiz: [
        {
          question:
            "Wie lässt sich Schaumwein zu reichhaltigen Speisen sachlich beschreiben?",
          options: [
            "Weil der Alkohol das Fett auflöst",
            "Säure und Prickeln können als frischer Kontrast empfunden werden; eine Fettauflösung wird damit nicht belegt",
            "Weil die Dosage das Fett neutralisiert",
            "Weil Schaumwein kalt serviert wird",
          ],
          correct: 1,
          explanation:
            "Säure und Prickeln können einen sensorischen Kontrast bieten. Die Behauptung einer Fettauflösung durch Kohlendioxid ist damit nicht belegt.",
        },
        {
          question:
            "Was sollte bei einer Kombination mit sehr scharfen Gerichten beachtet werden?",
          options: [
            "Weil der Alkohol die Schärfe verstärkt",
            "Alkohol und Prickeln können neben Schärfe unangenehm wirken; die Wahrnehmung ist individuell",
            "Weil die Dosage die Schärfe nicht ausgleichen kann",
            "Weil scharfe Gerichte den Korken beschädigen",
          ],
          correct: 1,
          explanation:
            "Die Wirkung von Alkohol, Prickeln und Schärfe wird individuell wahrgenommen. Eine pauschale Aussage für jedes Gericht ist nicht gerechtfertigt.",
        },
        {
          question:
            "Welche Kombination ist ein sensorischer Vorschlag, keine Wirkgarantie?",
          options: [
            "Champagner mit Schokoladentorte",
            "Brut-Schaumwein mit frittierten Speisen als möglicher Kontrast",
            "Prosecco mit Steak",
            "Demi-Sec mit Austern",
          ],
          correct: 1,
          explanation:
            "Brut-Schaumwein zu frittierten Speisen ist ein Vorschlag zum Ausprobieren. Eine garantierte Fettauflösung oder ein universeller Trend wird nicht behauptet.",
        },
      ],
    },

    // ─── Lektion 17 ──────────────────────────────────────────
    {
      title: "Schaumwein-Cocktails",
      content: `## Prickelnde Mixologie — Klassiker und moderne Kreationen

Schaumwein-Cocktails gehören zu den elegantesten und festlichsten Kategorien der Barkultur. Vom zeitlosen Champagner-Cocktail bis zum modernen Spritz — die Kohlensäure verleiht Drinks Leichtigkeit, Frische und visuelle Dramatik. Für den Getränkefachhandel sind Schaumwein-Cocktails ein wichtiges Upselling-Thema: Sie machen Schaumwein für ein breiteres Publikum zugänglich und können teurere Flaschen in der Gastronomie verankern.

**Beim Mixen**: Wähle den Schaumwein nach Stil und konkretem Rezept. Ein hoher Preis ist weder Voraussetzung noch Ausschlussgrund; pauschale aktuelle Preisgrenzen werden nicht behauptet. Der Schaumwein wird **immer zuletzt** zugegeben und **niemals** geschüttelt — nur vorsichtig verrührt oder das Glas schräg gehalten und langsam aufgefüllt. Schütteln zerstört die Kohlensäure und erzeugt unkontrolliertes Überschäumen.

**Klassische Schaumwein-Cocktails**: Der **Champagne Cocktail** (seit ca. 1862 dokumentiert) ist der Urvater aller Schaumwein-Drinks: Ein Stück Würfelzucker wird mit Angostura Bitters getränkt, ins Champagnerglas gelegt, mit Cognac (2 cl) übergossen und mit Champagner aufgefüllt. Die Zucker-Bitters-Kombination erzeugt eine faszinierende Aromenbrücke zur Autolyse-Komplexität des Champagners.

Der **Kir Royal** — Crème de Cassis (Schwarze Johannisbeerlikör, 1–2 cl) mit Champagner aufgefüllt — wurde nach Félix Kir, dem Bürgermeister von Dijon, benannt, der den Drink populär machte (obwohl der ursprüngliche Kir mit Weißwein und nicht mit Champagner gemixt wurde). Die Qualität des Cassis ist entscheidend: Premium-Cassis aus Burgund (16–20 % Vol., mehr als 400 g/l süßende Erzeugnisse als Invertzucker) unterscheidet sich fundamental von industriellen Produkten. Variationen: Kir Impérial (Crème de Framboise/Himbeere), Kir Pêche (Crème de Pêche/Pfirsich), Kir Mûre (Crème de Mûre/Brombeere).

Die **Bellini** wurde in den 1940er-Jahren von Giuseppe Cipriani in Harry's Bar in Venedig erfunden: Frischer weißer Pfirsichsaft (oder Pfirsichpüree, 1/3) wird mit Prosecco (2/3) aufgefüllt. Die originale Bellini verwendet **weißen Pfirsich** — gelber Pfirsich verändert Farbe und Geschmack erheblich. Die perfekte Bellini hat eine zartrosa Farbe und balanciert die Süße des Pfirsichs mit der Frische des Prosecco.

Der **Mimosa** — die IBA-Fassung verwendet gleiche Teile Orangensaft und Prosecco; eine Champagne-Variante kann anders proportioniert sein — ist der Klassiker beim Brunch. Die Qualität steht und fällt mit dem Orangensaft: Frisch gepresst aus süßen, aromatischen Orangen (Valencia, Navel). Niemals Saft aus dem Karton verwenden.

**Moderne Kreationen**: Der **Aperol Spritz** (3 Teile Prosecco, 2 Teile Aperol, 1 Splash Soda, Orangenscheibe) ist ein bekanntes Schaumwein-Cocktailbeispiel. Der **Hugo** (Prosecco, Holunderblütensirup, Mineralwasser, Minze, Limette) ist eine Sirup-Variante; die heutige IBA-Fassung verwendet Holunderblütenlikör. Der **French 75** (Gin 3 cl, Zitronensaft 1,5 cl, Zuckersirup 1,5 cl, Champagner auffüllen) verbindet die Komplexität eines Gin Sour mit der Eleganz des Champagners. Eine Herkunftslegende ist kein Maß für Stärke oder sichere Trinkmenge.

**Spritz-Kultur**: Die italienische Spritz-Tradition geht über Aperol hinaus: **Select Spritz** (venezianischer Bitter, kräftiger als Aperol), **Campari Spritz** (bitterer, komplexer), **Cynar Spritz** (Artischocken-Bitter, herb-erdig). Die Schaumweinbasis kann je nach Rezept variieren. Diese Drinks haben Schaumwein zum Alltags-Getränk demokratisiert.

**Tipps für den Fachhandel**: Schaumwein-Cocktail-Aktionen (besonders im Sommer und zu Feiertagen) können den Absatz von Prosecco, Cava und Crémant um 20–30 % steigern. Rezeptkarten am POS, Cross-Selling mit Cassis/Aperol/Holunderblütensirup und Verkostungsaktionen mit einfachen Cocktails sind bewährte Maßnahmen.`,
      quiz: [
        {
          question:
            "Warum sollte für Schaumwein-Cocktails kein teurer Champagner verwendet werden?",
          options: [
            "Weil die Kohlensäure beim Mischen verloren geht",
            "Weil die feinen Nuancen eines hochwertigen Schaumweins in der Mischung verloren gehen",
            "Weil teure Champagner zu wenig Säure haben",
            "Weil es gesetzlich verboten ist",
          ],
          correct: 1,
          explanation:
            "Die feinen Nuancen eines Vintage-Champagners oder einer Prestige Cuvée gehen in der Mischung verloren. Solide Crémants, Prosecco DOC oder Cava sind ideal für Cocktails.",
        },
        {
          question:
            "Wer erfand die Bellini und welcher Pfirsich wird im Original verwendet?",
          options: [
            "Harry Craddock, gelber Pfirsich",
            "Giuseppe Cipriani in Harry's Bar, Venedig — weißer Pfirsich",
            "Félix Kir in Dijon, Nektarine",
            "Roland Gruber in Südtirol, Weinbergpfirsich",
          ],
          correct: 1,
          explanation:
            "Giuseppe Cipriani erfand die Bellini in den 1940ern in Harry's Bar, Venedig. Das Original verwendet weißen Pfirsichsaft (1/3) mit Prosecco (2/3).",
        },
        {
          question:
            "Was ist der Ursprung des Hugo-Cocktails?",
          options: [
            "Ein venezianischer Barklassiker aus den 1920ern",
            "Ein Champagner-Cocktail aus Paris",
            "Eine Erfindung des Südtiroler Barkeepers Roland Gruber von 2005, mit Prosecco, Holunderblütensirup, Mineralwasser, Minze und Limette",
            "Ein englischer Cocktail auf Basis von Cider",
          ],
          correct: 2,
          explanation:
            "Der Hugo wurde 2005 von Roland Gruber in Südtirol erfunden. Die Kombination aus Prosecco, Holunderblütensirup, Mineralwasser, Minze und Limette wurde besonders im deutschsprachigen Raum populär.",
        },
      ],
    },

    // ─── Lektion 18 ──────────────────────────────────────────
    {
      title: "Rosé-Schaumwein",
      content: `## Farbe durch Schalenkontakt oder Assemblage

**Rosé-Schaumwein** kann durch kurze Mazeration roter Trauben, Direktpressung oder die zugelassene Assemblage eines weißen Grundweins mit Rotwein entstehen. Welche Methode zulässig ist, richtet sich nach der konkreten Herkunft und Kategorie. Die Champagne darf nicht pauschal als einzige französische Herkunft mit erlaubtem Rotweinverschnitt dargestellt werden.

**Champagne** kennt Rosé durch Mazeration und durch Assemblage. Bei Mazeration gelangt Farbe aus den Schalen in den Most; bei Assemblage wird vor der zweiten Gärung stiller roter Champagne-Wein zugegeben. Der gewählte Prozess kann Stil und Farbe beeinflussen, bestimmt aber keine allgemeine Qualitätsrangfolge.

**Weitere Herkunftsregeln**: Cava erlaubt unter anderem die rote Sorte **Trepat** für Rosé. Diese Sorte kommt nicht ausschließlich in Cava vor. **Prosecco Rosé DOC** verlangt nach der aktuellen Spezifikation **85–90 % Glera und 10–15 % Pinot Noir**, zusammen 100 %, und die Jahrgangsangabe beim Rosé-Spumante. **Franciacorta Rosé** enthält mindestens **35 % Pinot Noir**; für die Grundkategorie gelten mindestens **24 Monate Hefelager**.

**Sensorik**: Erdbeere, Himbeere oder rote Johannisbeere sind mögliche Beschreibungen. Farbe allein sagt weder einen höheren Zuckergehalt noch ein besseres Produkt voraus. Rebsorten, Verfahren, Dosage und Lagerung wirken gemeinsam.

**Im Handel**: Ein Preisaufschlag oder eine Wachstumsaussage lässt sich nicht aus der Farbe ableiten. Vergleiche echte Produktangaben und aktuelle Preise, statt allgemeine Margen oder Marktanteile zu versprechen.`,
      quiz: [
        {
          question:
            "Welche Aussage über die Rosé-Herstellung in der Champagne ist zutreffend?",
          options: [
            "Weil die Champagne die älteste AOC ist",
            "Champagne-Rosé kann durch Mazeration oder die erlaubte Zugabe stillen roten Champagne-Weins entstehen",
            "Weil nur Champagner-Trauben dafür geeignet sind",
            "Weil die Assemblage-Methode in der Champagne erfunden wurde",
          ],
          correct: 1,
          explanation:
            "In der Champagne sind Mazeration und Assemblage möglich. Ob Verschnitt anderswo erlaubt ist, richtet sich nach der jeweiligen Kategorie und Herkunftsspezifikation.",
        },
        {
          question:
            "Was ist die Besonderheit der Rebsorte Trepat im Cava-Rosé?",
          options: [
            "Sie ist die ertragreichste rote Sorte Spaniens",
            "Sie ist eine autochthone, für Rosé-Cava zugelassene rote Sorte von bemerkenswerter Eleganz",
            "Sie wird auch in der Champagne angebaut",
            "Sie liefert die dunkelste Roséfarbe aller Sorten",
          ],
          correct: 1,
          explanation:
            "Trepat ist eine seltene autochthone rote Sorte, die für Rosé-Cava zugelassen, aber nicht ausschließlich in dieser Herkunft vorhanden ist und für ihre Eleganz und Finesse geschätzt wird.",
        },
        {
          question:
            "Welcher Mindestanteil Pinot Noir gilt für Franciacorta Rosé?",
          options: [
            "10 %",
            "25 %",
            "35 %",
            "100 %",
          ],
          correct: 2,
          explanation:
            "Die aktuelle Franciacorta-Spezifikation verlangt für Rosé mindestens 35 % Pinot Noir.",
        },
      ],
    },

    // ─── Lektion 19 ──────────────────────────────────────────
    {
      title: "Pétillant Naturel (Pét-Nat)",
      content: `## Eine Gärung, die in der Flasche endet

**Pétillant Naturel**, kurz **Pét-Nat**, bezeichnet üblicherweise Weine, bei denen eine begonnene alkoholische Gärung in der Flasche vollendet wird. Das unterscheidet sie von der traditionellen Methode mit einer gezielten **zweiten** Gärung des fertigen Grundweins. „Pét-Nat“ allein beweist jedoch nicht automatisch eine bestimmte Bio-Zertifizierung, ausschließliche Spontangärung oder den vollständigen Verzicht auf alle önologischen Eingriffe.

**Méthode Ancestrale** ist bei bestimmten Herkünften geregelt. **Blanquette de Limoux Méthode Ancestrale** verwendet Mauzac. Auch **Clairette de Die** ist ein Beispiel einer ancestral erzeugten Herkunft, dort mit überwiegend Muscat und ergänzender Clairette. Limoux ist daher nicht der weltweit einzige noch bestehende Wein dieses Verfahrens.

**Hefesatz**: Manche Weine werden degorgiert, andere behalten ihren Hefesatz. Eine gewollte Hefetrübung ist nicht automatisch ein Fehler, belegt aber ebenso wenig mikrobiologische Sicherheit. Längeres Hefelager kann auch bei dieser Methode Veränderungen durch Autolyse ermöglichen.

**Stil**: Frucht, Restzucker, Druck, Alkoholgehalt und Haltbarkeit unterscheiden sich nach Wein und Herstellungsführung. Eine starre Vorgabe „bei 4–6 % Alkohol abfüllen“ oder ein fester Gärzeitraum beschreibt nicht sämtliche Produkte. Die technische Herstellung druckhaltiger Flaschen gehört in kontrollierte, dafür ausgelegte Prozesse, nicht in eine allgemeine Heimabfüll-Anleitung.

**Service**: Beachte die Hinweise des Erzeugers zu Hefesatz und Öffnen. Kühl und ruhig behandeln, die Flasche nicht auf Menschen richten und den Verschluss kontrollieren. Trüb, naturbetont oder ohne Dosage sind Stilbeschreibungen, keine Gesundheits- oder Qualitätsgarantien.`,
      quiz: [
        {
          question:
            "Was ist der fundamentale Unterschied zwischen Pét-Nat und Champagner?",
          options: [
            "Pét-Nat wird im Charmat-Verfahren hergestellt",
            "Bei Pét-Nat endet üblicherweise die erste Gärung in der Flasche; Champagne erhält eine gezielte zweite Gärung",
            "Pét-Nat hat immer mehr Kohlensäure",
            "Pét-Nat wird nur aus roten Trauben hergestellt",
          ],
          correct: 1,
          explanation:
            "Der grundlegende Unterschied ist die Vollendung der ersten Gärung in der Flasche statt einer gezielten zweiten Gärung. Der Begriff allein garantiert nicht sämtliche weiteren Produktionsentscheidungen.",
        },
        {
          question:
            "Warum ist Pét-Nat oft trüb, und ist das ein Fehler?",
          options: [
            "Ja, Trübung ist immer ein Qualitätsmangel",
            "Hefesatz kann bewusst verbleiben; Trübung allein beweist weder Fehler noch Sicherheit",
            "Die Trübung entsteht durch zugesetztes Casein",
            "Die Trübung verschwindet nach einer Stunde von selbst",
          ],
          correct: 1,
          explanation:
            "Hefesatz kann gewollt in der Flasche verbleiben. Die Trübung allein entscheidet nicht über Fehlerfreiheit oder Sicherheit.",
        },
        {
          question:
            "Welche Rebsorte wird für die historische Blanquette Méthode Ancestrale aus Limoux verwendet?",
          options: [
            "Chardonnay",
            "Chenin Blanc",
            "Mauzac",
            "Glera",
          ],
          correct: 2,
          explanation:
            "Die geregelte Blanquette de Limoux Méthode Ancestrale verwendet Mauzac. Daneben bestehen andere ancestral erzeugte Herkünfte wie Clairette de Die.",
        },
      ],
    },

    // ─── Lektion 20 ──────────────────────────────────────────
    {
      title: "Trends und Zukunft des Schaumweins",
      content: `## Entwicklungen anhand konkreter Regeln einordnen

Schaumwein umfasst unterschiedliche Herkünfte, Produktionsweisen und Zielgruppen. Pauschale Marktgrößen, jährliche Wachstumsraten oder sichere Prognosen für einzelne Preisstufen benötigen aktuelle Daten und werden hier nicht als Tatsachen behauptet.

**Herkunft und handwerkliche Stile**: Winzersekt, Crémant, Franciacorta und Cava bieten verschiedene Alternativen. „Premiumisierung“ bezeichnet eine Orientierung zu höherpreisigen oder höherwertig positionierten Produkten, nicht den Beweis, dass jedes Segment zwischen bestimmten Eurogrenzen wächst.

**Bio und Nachhaltigkeit**: Konkrete Anforderungen können überprüft werden: **Corpinnat** verlangt Bio-Trauben, Handlese, Vinifikation im eigenen Betrieb und mindestens 18 Monate Reife. Bei **Cava de Guarda Superior** gelten seit 2025 Bio-Anforderungen. Das bedeutet nicht, dass alle Cavas oder jede Champagne biologisch sind. Kürzere Transporte oder leichtere Flaschen allein beweisen noch keine vollständige CO₂-Bilanz.

**Neue Regionen**: Taittinger und Hatch Mansfield gründeten das Projekt **Domaine Evremond in Kent** ab 2015; die ersten Reben wurden 2017 gepflanzt. Dies ist ein konkretes Beispiel, keine Garantie, dass England die weltweit am schnellsten wachsende Region ist oder 2050 überall das heutige Champagne-Klima haben wird.

**Alkoholreduktion**: Vakuumdestillation und Membranverfahren können zur Entalkoholisierung eingesetzt werden. Entfernen von Alkohol verändert aber auch die sensorische Balance. „Alkoholfrei“ und „0,0 %“ müssen nach den Produktangaben unterschieden werden. Alkoholhaltiger Schaumwein wird nicht durch Bio-Anbau, niedrige Dosage oder eine kleine Portion zu einem gesunden Getränk; die DGE empfiehlt, auf Alkohol zu verzichten.

**Klima und Rebsorten**: Neue Sorten und veränderte Bewirtschaftung sind konkrete Anpassungsansätze. Beispielsweise erlauben die Franciacorta-Regeln in begrenztem Umfang Erbamat. Prognosen über sichere Gewinnerregionen ersetzen keine Prüfung von Standort, Wetterrisiken und geltenden Vorschriften.

**Beratung**: Erkläre Herkunft, Methode, Süßestufe und tatsächliche Produktangaben. Biete passende alkoholfreie Alternativen an und kennzeichne Geschmacksurteile als solche.`,
      quiz: [
        {
          question:
            "Welches Champagnerhaus hat 2015 ein Weingut in England erworben?",
          options: [
            "Moët & Chandon",
            "Bollinger",
            "Taittinger (Domaine Evremond in Kent)",
            "Veuve Clicquot",
          ],
          correct: 2,
          explanation:
            "Taittinger erwarb 2015 Land in Kent und gründete Domaine Evremond — ein starkes Signal für das Qualitätspotenzial englischer Schaumweine. Auch Pommery investierte 2017 in Hampshire.",
        },
        {
          question:
            "Was bedeutet 'Premiumisierung' im Schaumweinmarkt?",
          options: [
            "Alle Schaumweine werden teurer",
            "Eine Orientierung zu höherpreisigen oder höherwertig positionierten Produkten",
            "Nur Champagner wird als Premium anerkannt",
            "Die Produktionskosten steigen durch Inflation",
          ],
          correct: 1,
          explanation:
            "Premiumisierung beschreibt eine höherwertige Positionierung oder Kaufentscheidung. Das belegt keine allgemeine Wachstumsrate einzelner Preisstufen.",
        },
        {
          question:
            "Welche Technologie ermöglicht die Herstellung von alkoholfreiem Schaumwein?",
          options: [
            "Pasteurisierung",
            "Vakuumdestillation, Spinning-Cone-Column und Umkehrosmose",
            "Chaptalisation",
            "Karbonisierung mit externem CO₂",
          ],
          correct: 1,
          explanation:
            "Vakuumdestillation und andere geeignete Verfahren können Alkohol entfernen; die sensorische Balance kann sich dabei verändern. Eine allgemeine zweistellige Wachstumsrate wird nicht behauptet.",
        },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════
  // FINAL EXAM — 10 Fragen
  // ═══════════════════════════════════════════════════════════
  finalExam: [
    {
        "question": "Welche Aussage zur Champagne-Reifung ist zutreffend?",
        "options": [
            "Immer 15 Monate ausschließlich auf der Hefe",
            "Jahrgangslos mindestens 15 Monate insgesamt, darin 12 Monate auf der Hefe",
            "Keine geregelte Mindestzeit",
            "Jahrgangs-Champagne darf sofort verkauft werden"
        ],
        "correct": 1,
        "explanation": "Die Regel unterscheidet Gesamtreifung und Hefelager. Für Jahrgangs-Champagne gelten mindestens drei Jahre."
    },
    {
        "question": "Wie lange lagert Franciacorta Riserva mindestens auf der Hefe?",
        "options": [
            "18 Monate",
            "30 Monate",
            "60 Monate",
            "36 Monate"
        ],
        "correct": 2,
        "explanation": "Die regionale Spezifikation verlangt mindestens 60 Monate; daraus folgt kein Weltrekord."
    },
    {
        "question": "Was bezeichnet RC auf einem Champagne-Etikett?",
        "options": [
            "Einen Süßegrad",
            "Ein Genossenschaftsmitglied, das Most oder Wein zurückerhält",
            "Eine Rebsorte",
            "Eine garantierte Lagerzeit"
        ],
        "correct": 1,
        "explanation": "Récoltant-Coopérateur bezeichnet die Erzeugerart, nicht die Qualität."
    },
    {
        "question": "Welche Aussage zu Winzersekt ist richtig?",
        "options": [
            "Jede Abfüllung in Deutschland ist Winzersekt",
            "Traditionelle Flaschengärung und Voraussetzungen der Erzeugerabfüllung sind erforderlich",
            "Tankgärung ist zwingend",
            "Nur ein Staatssiegel macht den Wein süß"
        ],
        "correct": 1,
        "explanation": "Winzersekt verbindet Herstellung und Herkunft nach den geregelten Voraussetzungen."
    },
    {
        "question": "Was unterscheidet Corpinnat als Markensystem?",
        "options": [
            "Immer Tankgärung",
            "Eigene Anforderungen zu Bio, Handlese, Vinifikation, Reifung und historischen Sorten",
            "Es ist eine Unterregion der DO Cava",
            "Nur Chardonnay ist erlaubt"
        ],
        "correct": 1,
        "explanation": "Corpinnat ist eine kollektive Marke mit eigenen Regeln; es ist nicht dieselbe Produktspezifikation wie DO Cava."
    },
    {
        "question": "Was beschreibt Charmat Lungo?",
        "options": [
            "Mehr Alkohol gesetzlich zwingend",
            "Längerer Hefekontakt im Tank, Dauer produktabhängig",
            "Nur Gärung im Glas",
            "Immer doppelter Druck"
        ],
        "correct": 1,
        "explanation": "Lungo beschreibt längeren Hefekontakt; ein universeller Zeitraum wird nicht behauptet."
    },
    {
        "question": "Wie viel Zucker umfasst Extra Dry in der EU-Systematik?",
        "options": [
            "0–3 g/l",
            "0–6 g/l",
            "12–17 g/l",
            "32–50 g/l"
        ],
        "correct": 2,
        "explanation": "Extra Dry bezeichnet 12–17 g/l; der Name bedeutet nicht besonders trocken."
    },
    {
        "question": "Welche Regel gilt beim sicheren Öffnen?",
        "options": [
            "Korken frei abschießen",
            "Flasche auf eine Person richten",
            "Stopfen kontrollieren und Flasche niemals auf Personen richten",
            "Zuerst kräftig schütteln"
        ],
        "correct": 2,
        "explanation": "Die Druckflasche wird ruhig und mit kontrolliertem Stopfen geöffnet."
    },
    {
        "question": "Welche Aussage zur Pét-Nat-Trübung ist richtig?",
        "options": [
            "Sie garantiert Sicherheit",
            "Hefesatz kann gewollt sein, Trübung allein beweist weder Fehler noch Sicherheit",
            "Sie ist immer zugesetztes Casein",
            "Sie beweist eine Bio-Zertifizierung"
        ],
        "correct": 1,
        "explanation": "Trübung ist ohne weitere Prüfung keine Diagnose."
    },
    {
        "question": "Welches konkrete Projekt verbindet Taittinger mit England?",
        "options": [
            "Eine allgemeine Klima-Garantie für 2050",
            "Domaine Evremond in Kent mit Hatch Mansfield",
            "Die DO Cava",
            "Alle englischen Weinberge"
        ],
        "correct": 1,
        "explanation": "Domaine Evremond ist ein konkretes Projekt ab 2015, keine Garantie einer weltweiten Wachstumsrangliste."
    }
],
};
