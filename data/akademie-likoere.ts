import type { Course } from "./akademie";

export const likoereKurs: Course = {
  slug: "likoere",
  title: "Likör-Experte",
  icon: "🍸",
  image: "/images/akademie/likoere.png",
  description:
    "Von Mazeration bis Destillation, von Frucht bis Kräuter — Herstellung, Stilistik, Sensorik und Cocktail-Kunst auf Fortgeschrittenen-Niveau.",
  color: "from-purple-500 to-pink-600",
  difficulty: "Fortgeschritten",
  duration: "ca. 80 Min.",
  lessons: [
    // ─── Lektion 1 ───────────────────────────────────────────
    {
      title: "Definition und Geschichte der Liköre",
      content: `## Was ist ein Likör?

**Likör** ist per EU-Verordnung 2019/787 eine Spirituose mit einem Mindestzuckergehalt von **100 g/l**, ausgedrückt als Invertzucker (Ausnahmen: 70 g/l für Kirschlikör, dessen Alkohol ausschließlich aus Kirschbrand stammt; 80 g/l für Enzianlikör und Liköre aus ähnlichen Pflanzen oder Wermut) und einem Mindestalkoholgehalt von **15 % Vol.** Diese Definition grenzt Liköre klar von anderen Spirituosen ab: Während ein Gin oder Wodka keinen Mindestzuckergehalt aufweist, ist der Zucker beim Likör konstitutives Element. Der Zucker kann als Saccharose, Invertzucker, Traubenzucker, Fructose oder Honig zugeführt werden. Die Basis bildet ein Agraralkohol oder ein Destillat, das mit Aromastoffen — natürlichen Extrakten, Essenzen, Destillaten, Mazerate — und Süßungsmitteln kombiniert wird.

## Historische Wurzeln

**Die Geschichte der Liköre beginnt im Mittelalter**, als Mönche und Apotheker alkoholische Kräuterauszüge als Heilmittel herstellten. Der Begriff **Liquor** (lateinisch: Flüssigkeit) wandelte sich über das italienische **Liquore** zum heutigen Likör. Im 13. Jahrhundert entwickelten **Benediktiner- und Kartäusermönche** komplexe Rezepturen aus Dutzenden von Kräutern, Wurzeln und Gewürzen — die berühmte **Chartreuse** mit ihren 130 Kräutern geht auf eine Rezeptur von 1605 zurück, die den Kartäusern vom Marschall d'Estrées übergeben wurde.

**Historische Beispiele**: Die Herstellerchronik von Bols führt die Amsterdamer Likörherstellung auf 1575 zurück; das Unternehmen Der Lachs entstand laut Hardenberg-Wilthen um 1598. Solche Herstellerhistorien erklären Markenherkunft, nicht eine heutige medizinische Wirkung.

## Vom Medikament zum Genussmittel

**Im 18. und 19. Jahrhundert** vollzog sich der entscheidende Wandel: Liköre wurden von Heilmitteln zu Genussmitteln. Die **Kolonialisierung** brachte exotische Zutaten wie Kakao, Kaffee, tropische Früchte und Gewürze nach Europa und erweiterte die Palette dramatisch. **Marie Brizard** gründete 1755 ihr Haus in Bordeaux, **Cointreau** begann 1849 in Angers, **Grand Marnier** startete 1880. Die Industrialisierung ermöglichte eine standardisierte Massenproduktion, während gleichzeitig handwerkliche Häuser ihre Geheimrezepturen pflegten. Heute umfasst die Kategorie zahlreiche Varianten von herb-bitter bis üppig-süß; spezielle Unterkategorien besitzen eigene Anforderungen.`,
      quiz: [
        {
          question:
            "Welchen Mindestzuckergehalt muss ein Likör gemäß EU-Verordnung aufweisen?",
          options: ["50 g/l", "70 g/l", "100 g/l", "150 g/l"],
          correct: 2,
          explanation:
            "Die EU-Verordnung 2019/787 schreibt mindestens 100 g/l Zucker vor. Ausnahmen gelten für Kirschlikör mit ausschließlich Kirschbrand als Alkoholbasis (70 g/l) sowie Enzian-/vergleichbare Pflanzen- und Wermutliköre (80 g/l), jeweils als Invertzucker.",
        },
        {
          question:
            "Welches Kloster ist berühmt für die Herstellung der Chartreuse mit 130 Kräutern?",
          options: [
            "Benediktinerkloster Monte Cassino",
            "Kartäuserkloster Grande Chartreuse",
            "Zisterzienserkloster Cîteaux",
            "Franziskanerkloster Assisi",
          ],
          correct: 1,
          explanation:
            "Die Chartreuse steht in der Tradition der Kartäuser. Die heutige Destillerie Aiguenoire nahm laut Hersteller 2018 den Betrieb auf. Die Rezeptur geht auf ein Manuskript von 1605 zurück.",
        },
        {
          question:
            "Welcher Mindestalkoholgehalt ist für Liköre vorgeschrieben?",
          options: ["10 % Vol.", "15 % Vol.", "20 % Vol.", "25 % Vol."],
          correct: 1,
          explanation:
            "Liköre müssen mindestens 15 % Vol. Alkohol enthalten. In der Praxis liegen die meisten zwischen 15 und 40 % Vol.",
        },
      ],
    },

    // ─── Lektion 2 ───────────────────────────────────────────
    {
      title: "Herstellungsverfahren im Überblick",
      content: `## Die vier Säulen der Likörherstellung

**Die Herstellung eines Likörs** folgt einem grundlegenden Schema: Aromatisierung einer Alkoholbasis, Süßung und gegebenenfalls Reifung. Doch innerhalb dieses Rahmens existieren fundamentale Unterschiede in der Extraktion der Aromastoffe, die Qualität, Komplexität und Charakter des fertigen Produkts entscheidend beeinflussen. Die vier zentralen Verfahren sind **Mazeration**, **Perkolation**, **Destillation** und **Infusion** — oft werden mehrere Techniken für ein einziges Produkt kombiniert.

## Mazeration — Die kalte Extraktion

**Bei der Mazeration** werden die Ausgangsstoffe — Früchte, Kräuter, Gewürze, Schalen — direkt in Alkohol eingelegt. Der Alkohol fungiert als Lösungsmittel und extrahiert über Tage, Wochen oder Monate ätherische Öle, Farbstoffe, Bitterstoffe und Aromaverbindungen. Die **Kaltmazeration** (bei Raumtemperatur oder darunter) schont empfindliche Aromen und bewahrt die Frische von Zitrusölen oder Blütenessenzen. Die **Warmmazeration** (40–60 °C) beschleunigt die Extraktion erheblich, kann aber hitzeempfindliche Aromakomponenten zerstören. Industriell wird die Mazeration oft in Edelstahltanks mit Rührwerken durchgeführt, um eine gleichmäßige Extraktion zu gewährleisten.

## Perkolation — Das Durchströmungsprinzip

**Die Perkolation**: Alkohol beziehungsweise eine Alkohol-Wasser-Mischung durchströmt ein Pflanzenbett. Durchfluss, Lösungsmittelmenge und Material beeinflussen die Extraktion. Eine Flüssigkeit kann auch hierbei sättigen; wiederholtes Durchströmen garantiert weder unbegrenzte Extraktion noch stets bessere Effizienz.

## Destillation — Reinheit und Finesse

**Bei der Destillation** werden die aromatisierten Mazerate oder Infusionen erhitzt und der Dampf aufgefangen. Die Destillation liefert ein klares, transparentes Destillat mit besonders reinen, eleganten Aromen — Farbstoffe und Bitterstoffe bleiben im Destillationsrückstand zurück. **Pot-Still-Destillation** (diskontinuierlich, in Kupferbrennblasen) ergibt komplexere, körperreichere Destillate. **Column-Still-Destillation** (kontinuierlich) liefert leichtere, reinere Destillate. Viele Premiumliköre kombinieren destillierte mit mazerierten Anteilen, um sowohl Reinheit als auch Farbintensität und geschmackliche Tiefe zu erzielen.

## Assemblage und Süßung

**Nach der Aromengewinnung** folgt die Assemblage: Die verschiedenen Extrakte werden in präzisen Verhältnissen gemischt. Dann wird gesüßt — mit Kristallzucker, Invertzucker, Honig oder Agavensirup. Der **Zuckergehalt** bestimmt maßgeblich die Textur: 100–250 g/l ergeben einen leichten, trinkbaren Likör, 250–400 g/l einen sirupartigen, üppigen Likör. Nach der Süßung folgen **Filtration** (Schönung mit Bentonit, Aktivkohle oder Kältefiltration) und bei einigen Produkten eine **Reifung** in Holzfässern, die zusätzliche Vanillin-, Tannin- und Karamellnoten einbringt.`,
      quiz: [
        {
          question:
            "Welchen Vorteil hat die Perkolation gegenüber der Mazeration?",
          options: [
            "Sie ist günstiger in der Anschaffung",
            "Der Alkohol durchströmt ein Pflanzenbett; der Prozess kann kontrolliert geführt werden",
            "Sie erzeugt automatisch eine höhere Alkoholstärke",
            "Sie benötigt keinen Alkohol als Lösungsmittel",
          ],
          correct: 1,
          explanation:
            "Bei der Perkolation durchströmt die Flüssigkeit ein Pflanzenbett. Sättigung ist möglich; eine höhere Effizienz ist keine automatische Eigenschaft jedes Verfahrens.",
        },
        {
          question:
            "Warum kombinieren viele Premiumliköre destillierte und mazerierte Anteile?",
          options: [
            "Weil die EU dies vorschreibt",
            "Um Produktionskosten zu senken",
            "Um sowohl Reinheit und Eleganz (Destillat) als auch Farbe und Tiefe (Mazerat) zu erreichen",
            "Weil Destillation allein keinen Alkohol erzeugt",
          ],
          correct: 2,
          explanation:
            "Destillation liefert reine, elegante Aromen ohne Farbe. Mazeration bringt Farbstoffe und geschmackliche Tiefe. Die Kombination vereint beide Vorteile.",
        },
        {
          question:
            "Welche Temperatur gilt typischerweise für eine Kaltmazeration?",
          options: [
            "Raumtemperatur oder darunter",
            "60–80 °C",
            "Über 100 °C",
            "Exakt 0 °C",
          ],
          correct: 0,
          explanation:
            "Kaltmazeration findet bei Raumtemperatur oder darunter statt, um empfindliche Aromen wie Zitrusöle und Blütenessenzen zu schonen.",
        },
      ],
    },

    // ─── Lektion 3 ───────────────────────────────────────────
    {
      title: "Mazeration vs. Destillation im Detail",
      content: `## Zwei Philosophien der Aromengewinnung

**Mazeration und Destillation** stehen für zwei grundlegend verschiedene Ansätze der Aromengewinnung, die sich in ihren chemischen Prinzipien, Ergebnissen und Einsatzbereichen fundamental unterscheiden. Ein Likörmeister, der beide Techniken souverän beherrscht und gezielt kombiniert, kann Produkte von außerordentlicher Komplexität schaffen. Dieses Kapitel vertieft die chemischen und sensorischen Unterschiede und zeigt auf, wann welches Verfahren zum optimalen Ergebnis führt.

## Chemie der Mazeration

**Bei der Mazeration** wirkt Ethanol als selektives Lösungsmittel. Die Extraktion folgt dem **Fick'schen Diffusionsgesetz**: Aromastoffe wandern von Bereichen hoher Konzentration (im pflanzlichen Material) zu Bereichen niedriger Konzentration (im Alkohol). Die Extraktionseffizienz hängt ab von der **Alkoholstärke** (die geeignete Stärke hängt von den Zielstoffen und dem Ausgangsmaterial ab), der **Temperatur** (höhere Temperatur beschleunigt Diffusion, kann aber labile Verbindungen zerstören), der **Zerkleinerung** (mehr Oberfläche = schnellere Extraktion) und der **Einwirkdauer**. Bei der Mazeration gehen sowohl **flüchtige Verbindungen** (ätherische Öle, Ester) als auch **nicht-flüchtige Verbindungen** (Farbstoffe wie Anthocyane, Bitterstoffe, Tannine, Polyphenole) in Lösung.

## Chemie der Destillation

**Bei der Destillation** werden flüchtige Komponenten mit dem Dampf übergetragen und anschließend kondensiert. Bei Gemischen lässt sich das nicht als starre Grenze nach den Siedepunkten der Reinstoffe erklären. **Ätherische Öle** (Limonen, Linalool, Citral, Geraniol) destillieren hervorragend und ergeben ein brillantes, klares Destillat. **Farbstoffe** (Anthocyane, Chlorophyll, Carotinoide) sind nicht flüchtig und bleiben im Rückstand — deshalb sind reine Likördestillate immer farblos. **Bitterstoffe und Tannine** verbleiben ebenfalls im Sumpf. Die Auswahl von **Vorlauf**, **Mittellauf** und **Nachlauf** beeinflusst das Destillat. Methanol lässt sich nicht pauschal nur dem Vorlauf zuordnen. Dieses Kapitel ist keine Anleitung zur sicheren Destillation.

## Sensorischer Vergleich

**Mazerierte Liköre** zeichnen sich durch Farbintensität, geschmackliche Tiefe und eine gewisse Adstringenz durch Tannine aus. Sie wirken oft erdiger, vollmundiger und komplexer im Mundgefühl. Beispiel: Ein durch Mazeration gewonnener **Waldfruchtlikör** zeigt tiefes Rubinrot, intensive Beerennoten und einen leicht herben Nachhall. **Destillierte Liköre** sind transparenter im Aroma, eleganter und feiner in der Textur. Sie betonen florale und ätherische Noten. Beispiel: Ein destillierter **Orangenlikör** wie Cointreau zeigt kristallklare Zitrusnoten ohne die Bitterkeit der Schale.

## Die Kunst der Kombination

**In der Praxis** arbeiten die meisten Premiumhersteller mit einer Kombination beider Verfahren. **Grand Marnier** etwa vereint ein Destillat aus Bitterorangen-Maischung mit gereiftem Cognac. **Bénédictine** verwendet 27 Pflanzen, von denen einige mazeriert und andere destilliert werden, bevor alles assembliert und in Eichenholzfässern gereift wird. Die Assemblage verschiedener Mazerate und Destillate ist eine hohe Kunst, die jahrelange Erfahrung und ein exzellentes sensorisches Gedächtnis erfordert. Häufig werden einzelne Botanicals separat behandelt und erst im finalen Schritt zusammengeführt.`,
      quiz: [
        {
          question:
            "Warum sind reine Likördestillate immer farblos?",
          options: [
            "Weil der Alkohol die Farbstoffe zerstört",
            "Weil Farbstoffe nicht flüchtig sind und im Destillationsrückstand verbleiben",
            "Weil bei der Destillation Bleichmittel eingesetzt werden",
            "Weil nur Wasser destilliert wird, nicht der Alkohol",
          ],
          correct: 1,
          explanation:
            "Farbstoffe wie Anthocyane und Chlorophyll haben einen sehr hohen Siedepunkt und sind nicht flüchtig. Sie bleiben beim Destillieren im Sumpf zurück.",
        },
        {
          question:
            "Welche Aussage zur geeigneten Alkoholstärke bei der Mazeration stimmt?",
          options: [
            "10–20 % Vol.",
            "20–30 % Vol.",
            "Sie hängt von Ausgangsmaterial und Zielstoffen ab.",
            "80–96 % Vol.",
          ],
          correct: 2,
          explanation:
            "Es gibt keine universelle optimale Alkoholstärke für alle Aromastoffe und Pflanzen. Rezeptur und Prozess müssen passend gewählt werden.",
        },
        {
          question:
            "Was ist der 'Mittellauf' bei der Destillation?",
          options: [
            "Der erste Anteil mit Methanol und Acetaldehyd",
            "Das Herzstück mit den gewünschten Aromen",
            "Der letzte Anteil mit schweren Fuselölen",
            "Die gesamte Destillationsmenge",
          ],
          correct: 1,
          explanation:
            "Der Mittellauf (Herzstück) enthält die gewünschten Aromastoffe. Die Fraktionen enthalten unterschiedliche Stoffgemische. Die vereinfachte Behauptung, sämtliches Methanol sei nur im Vorlauf, wäre falsch.",
        },
      ],
    },

    // ─── Lektion 4 ───────────────────────────────────────────
    {
      title: "Fruchtliköre — Vielfalt aus Obst und Beeren",
      content: `## Fruchtliköre unterscheiden

**Fruchtliköre** bilden die umfangreichste und vielfältigste Kategorie innerhalb der Likörwelt. Von Cassis bis Maracuja, von Kirsch bis Mango — nahezu jede Frucht kann zur Basis eines Likörs werden. Die EU-Verordnung definiert spezielle Unterkategorien: **Crème de** (z. B. Crème de Cassis) muss mindestens 250 g/l Zucker enthalten, **Crème de Cassis** verlangt allgemein mehr als 400 g/l als Invertzucker, nicht nur die Herkunft Dijon. Diese Crème-Liköre sind nicht zu verwechseln mit Cremelikören auf Sahnebasis — das „Crème" bezieht sich hier auf die sirupartige, cremige Textur durch den hohen Zuckergehalt.

## Kernobstliköre

**Kirschlikör** ist einer der ältesten und vielfältigsten Fruchtliköre. **Maraschino** (aus Marasca-Kirschen, 30–32 % Vol.) wird aus einer Destillation von Kirschen samt Kernen gewonnen — die Kerne bringen eine subtile Marzipan-Bittermandel-Note ein. **Guignolet** ist ein französischer Kirschlikör auf Mazerationsbasis, typisch für die Loire-Region. **Cherry Heering** aus Dänemark, gegründet 1818, mazeriert Kirschen in Neutralalkohol und reift in Holzfässern — das Ergebnis ist ein komplexer Likör mit Mandel-, Vanille- und Kirschnoten. **Apfellikör** und **Birnenlikör** werden häufig aus Obstbränden als Basis hergestellt, wobei die Fruchtmazerate den Brand aromatisch ergänzen.

## Beerenliköre

**Crème de Cassis** (schwarze Johannisbeere) ist ein bekannter Johannisbeerlikör und die Basis des legendären **Kir** (Cassis + Weißwein) und **Kir Royal** (Cassis + Champagner). Die besten Qualitäten stammen aus Dijon (Burgund) und verwenden die Sorte **Noir de Bourgogne**. Die Extraktion erfolgt durch Mazeration in Neutralalkohol über mehrere Wochen. **Himbeerlikör** (Chambord ist die bekannteste Marke, aus dem Loire-Tal) kombiniert Himbeeren mit Honig, Vanille und Cognac. **Brombeerlikör**, **Heidelbeerlikör** und **Erdbeerlikör** sind traditionell in Deutschland als Aufgesetzte (Hausansätze) verbreitet und werden industriell vor allem für den Bargebrauch produziert.

## Tropische und Zitrusliköre

**Zitrusliköre** sind eine eigenständige Großkategorie: **Curaçao** (aus Laraha-Orangen der Insel Curaçao, oft blau gefärbt), **Triple Sec** (generische Bezeichnung für einen Orangenlikör, z. B. Cointreau; kein garantierter Dreifach-Destillationsprozess), **Grand Marnier** (Bitterorangen-Destillat auf Cognac-Basis). **Limoncello** aus Kampanien mazeriert die Schale der **Sfusato Amalfitano**-Zitrone in hochprozentigem Alkohol und wird eisgekühlt als Digestif getrunken. **Tropische Fruchtliköre** wie Passionsfrucht (Passoã), Mango, Litschi (Soho) und Kokosnuss (Malibu — technisch ein Rumlikör) bedienen die Cocktailkultur und zeichnen sich durch süße, exotische Aromatik aus.`,
      quiz: [
        {
          question:
            "Was bedeutet die Bezeichnung 'Crème de' bei einem Fruchtlikör?",
          options: [
            "Er enthält Sahne als Zutat",
            "Er hat einen besonders hohen Zuckergehalt von mindestens 250 g/l",
            "Er wurde in der Crème-Region Frankreichs hergestellt",
            "Er enthält Crème fraîche",
          ],
          correct: 1,
          explanation:
            "Die Bezeichnung 'Crème de' bezieht sich auf die sirupartige, cremige Textur durch mindestens 250 g/l Zuckergehalt — nicht auf Milchprodukte.",
        },
        {
          question:
            "Woher stammt die subtile Marzipan-Note im Maraschino?",
          options: [
            "Aus zugesetztem Bittermandelöl",
            "Aus den mitdestillierten Kirschkernen",
            "Aus einer Marzipan-Essenz",
            "Aus der Holzfassreifung",
          ],
          correct: 1,
          explanation:
            "Bei der Herstellung von Maraschino werden die Marasca-Kirschen samt Kernen destilliert. Die Kerne enthalten Amygdalin, das die charakteristische Bittermandel-Note erzeugt.",
        },
        {
          question: "Aus welcher Cocktail-Kombination besteht ein Kir Royal?",
          options: [
            "Cassis + Rotwein",
            "Cassis + Champagner",
            "Himbeerlikör + Sekt",
            "Cassis + Orangensaft",
          ],
          correct: 1,
          explanation:
            "Kir Royal kombiniert Crème de Cassis mit Champagner. Der einfache Kir verwendet stattdessen Weißwein (Bourgogne Aligoté).",
        },
      ],
    },

    // ─── Lektion 5 ───────────────────────────────────────────
    {
      title: "Kräuterliköre und Bitters",
      content: `## Die komplexeste Likör-Kategorie

**Kräuterliköre** (auch Bitter-Liköre oder Amari) sind die wohl vielschichtigste Untergattung der Liköre. Sie basieren auf der Mazeration und/oder Destillation Dutzender bis über hundert pflanzlicher Zutaten — Kräuter, Wurzeln, Rinden, Blüten, Samen und Gewürze. Die Rezepturen sind oft Jahrhunderte alt und streng geheim. Der Geschmack bewegt sich zwischen süß-herb und intensiv-bitter, wobei **Bitterstoffe** maßgeblich zum Geschmack beitragen; eine gesundheitliche Wirkung des Getränks folgt daraus nicht.

## Amarogentin und die Bitterkeit

**Bittere Pflanzenstoffe** prägen manche Kräuterliköre. Enzian, Wermut und andere Botanicals liefern unterschiedliche bittere Aromaprofile. Bittergeschmack und kulturelle Digestif-Verwendung beweisen keine Verdauungswirkung des alkoholischen Getränks. Konkrete Zutaten sind herstellerabhängig und bei Geheimrezepturen nicht vollständig bekannt.

## Die großen Kräuterlikör-Familien

**Italienische Amari** sind die vielfältigste Gruppe: **Fernet-Branca** (1845, Mailand) ist extrem bitter und intensiv, mit Myrrhe, Safran, Kamille und Aloe. **Amaro Montenegro** (1885, Bologna) zeigt eine elegantere, süßer-herbe Balance mit 40 Botanicals. **Averna** (1868, Sizilien) ist runder und süßer mit Orangenschale und Myrte. **Amaro Nonino Quintessentia** (Friaul) wird mit gereiftem ÙE-Traubenbrand (Acquavite d'Uva) veredelt und zeigt kräuterfrische Eleganz. **Deutsche Kräuterliköre** wie **Jägermeister** (56 Kräuter), **Underberg** (aus Rheinberger Tradition), **Ramazzotti** (tatsächlich italienisch, aber in Deutschland sehr populär) und **Killepitsch** (98 Kräuter, Beeren und Früchte, aus Düsseldorf) haben eigene Stilistiken.

## Bitters vs. Kräuterliköre

**Cocktail-Bitters** wie Angostura sind konzentrierte Würzzutaten, die in kleinen Dashes eingesetzt werden. Davon sind trinkfertig angebotene Bitterspirituosen und Amari zu unterscheiden. Der Geschmack allein bestimmt nicht die EU-Kategorie; die konkrete Zusammensetzung und rechtliche Bezeichnung sind maßgeblich. Nicht jeder bittere Aperitif ist ein Likör, insbesondere nicht automatisch ein 11-%-Produkt.`,
      quiz: [
        {
          question:
            "Welche natürliche Substanz ist eine der bittersten überhaupt?",
          options: [
            "Chinin aus Chinarinde",
            "Amarogentin aus Enzianwurzel",
            "Absinthin aus Wermutkraut",
            "Cynarin aus Artischockenblättern",
          ],
          correct: 1,
          explanation:
            "Amarogentin aus der Enzianwurzel ist ein intensiv bitterer Pflanzenstoff.",
        },
        {
          question:
            "Warum werden Angostura Cocktail-Bitters in kleinen Dashes eingesetzt?",
          options: [
            "Weil sie keinen Alkohol enthalten",
            "Weil sie konzentrierte Würz- und Aromazutaten sind",
            "Weil sie aus Trinidad stammen",
            "Weil sie nur aus einer einzigen Zutat bestehen",
          ],
          correct: 1,
          explanation:
            "Der Hersteller beschreibt Angostura Bitters als Aromazutat für kleine Dashes. Eine pauschale Aussage über alle Bitterspirituosen folgt daraus nicht.",
        },
        {
          question:
            "Welcher Kräuterlikör stammt aus Düsseldorf?",
          options: [
            "Jägermeister",
            "Underberg",
            "Killepitsch",
            "Ramazotti",
          ],
          correct: 2,
          explanation:
            "Killepitsch ist ein Düsseldorfer Kräuterlikör. Die aktuelle Herstellerseite nennt 98 Kräuter, Beeren und Früchte und 42 % Vol.",
        },
      ],
    },

    // ─── Lektion 6 ───────────────────────────────────────────
    {
      title: "Nussliköre — Walnuss, Haselnuss und Mandel",
      content: `## Nussaromen und unterschiedliche Rohstoffe

**Nussliköre** sind keine einheitliche Rezeptur. Nüsse, geröstete Nüsse, pflanzliche Extrakte und weitere Zutaten können ein nussiges Aroma ergeben. Die konkrete Zutaten- und Allergeninformation ist wichtiger als der Name oder eine Verkostungsbeschreibung.

## Walnuss- und Haselnussbeispiele

**Nocino** steht für einen dunkel beschriebenen Walnusslikör aus grünen, unreifen Walnüssen. Erntezustand, Gewürze und Verarbeitung sind rezeptabhängig; ein fixes Kalenderdatum, eine Sonneneinstrahlung oder eine bestimmte Ansatzdauer sind keine universelle Qualitätsregel.

**Frangelico** beschreibt seinen charakteristischen Geschmack als von italienischen Haselnüssen geprägt. Die Marke ist ein Beispiel für den Haselnussstil, nicht ein Beleg, dass jede Nusslikörrezeptur dasselbe Verfahren oder dieselbe Zusammensetzung besitzt.

## Amaretto nicht auf eine Zutat reduzieren

**Amaretto** bezeichnet einen mandelartig wahrgenommenen Stil. Daraus folgt nicht automatisch, dass Mandeln oder Aprikosenkerne in jedem Produkt enthalten sind. **Lazzaroni Amaretto 1851** wird nach Herstellerangabe durch Infusion von Amaretti-Keksen hergestellt; die veröffentlichten Zutaten nennen diese Infusion ausdrücklich. Andere Rezepturen sind damit nicht bewiesen.

**Sicherheit**: Bittere Aprikosenkerne und Bittermandeln können aus cyanogenen Glykosiden giftige Blausäure freisetzen. Keine Hausansätze mit zerkleinerten Kernen oder unbekannten Pflanzen aus einer Markenbeschreibung ableiten. Bei Allergien die konkreten Zutaten und Herstellerinformationen prüfen, nicht aus dem Aromabegriff 'Mandel' auf Sicherheit schließen.`,
      quiz: [
        {"question":"Was lässt sich aus einem Mandelaroma allein ableiten?","options":["Dass immer Mandeln enthalten sind","Keine sichere Aussage über die konkrete Zutat oder Allergensicherheit","Dass keine Allergene vorkommen","Dass jede Rezeptur gleich ist"],"correct":1,"explanation":"Aroma und Zutaten sind nicht identisch. Etikett und Herstellerangaben des Produkts prüfen."},
        {"question":"Wie beschreibt Lazzaroni die Basis seines Amaretto 1851?","options":["Als reinen Mandelbrand","Als Infusion von Amaretti-Keksen","Als Walnusswein","Als Kaffeeextrakt"],"correct":1,"explanation":"Die veröffentlichte Herstellungsbeschreibung nennt die Kekse und eine Infusion; daraus folgt keine allgemeine Rezeptur aller Amaretti."},
        {"question":"Warum sind bittere Aprikosenkerne kein bedenkenloser Hausansatz-Rohstoff?","options":["Sie enthalten keinen Geschmack","Sie können giftige Blausäure freisetzen","Sie machen Alkohol alkoholfrei","Sie sterilisieren die Mischung"],"correct":1,"explanation":"Das BfR warnt vor Vergiftungsrisiken. Eine kommerzielle Rezepturbeschreibung ist keine sichere Heimherstellungsanleitung."},
      ],
    },

    // ─── Lektion 7 ───────────────────────────────────────────
    {
      title: "Sahne- und Cremeliköre",
      content: `## Emulsion und Rezeptur

**Sahne- und Cremeliköre** kombinieren eine Alkoholbasis mit Milch-/Sahnebestandteilen und weiteren Zutaten. Eine stabile Emulsion erfordert eine abgestimmte Rezeptur und Prozessführung. Emulgierung und Homogenisierung sind mögliche technische Schritte; genaue Drücke, Fettanteile und Zusatzstoffe sind herstellerabhängig, keine allgemeine Pflichtrezeptur.

## Baileys als konkretes Beispiel

Die aktuelle Hersteller-FAQ nennt für **Baileys Original Irish Cream** 17 % Vol., Sahne und Milchproteine sowie Neutralalkohol und Irish Whiskey. Der Hersteller gibt **24 Monate ab Abfüllung**, geöffnet oder ungeöffnet, bei 0–25 °C und Schutz vor direkter Sonne an. Das gilt nicht automatisch für alle Varianten, Flaschengrößen oder andere Sahneliköre.

## Haltbarkeit richtig beraten

Es gibt keine allgemeingültige Regel 'geöffnet sechs Monate' für die ganze Kategorie. Produkt, Verpackung, Lagertemperatur und Herstellerhinweise entscheiden. Mindesthaltbarkeitsdatum und Hinweise nach dem Öffnen beachten; bei Unsicherheit den Hersteller fragen. Alkohol allein ist keine Sterilitätsgarantie.

## Veränderungen beurteilen

Ausflockung oder Phasentrennung können eine gebrochene Emulsion anzeigen, etwa nach Kontakt mit sauren Zutaten. Das ist nicht automatisch ein Nachweis mikrobiellen Verderbs. Umgekehrt beweisen unauffälliger Geruch und Geschmack keine Sicherheit. Auffällige oder falsch gelagerte Produkte nicht probieren, um ihre Sicherheit zu testen.`,
      quiz: [
        {"question":"Was muss für eine stabile Sahnelikör-Emulsion abgestimmt werden?","options":["Nur die Flaschenfarbe","Rezeptur und Prozessführung","Nur der Markenname","Immer exakt dieselbe Fettmenge"],"correct":1,"explanation":"Die genaue Art und Menge von Emulgatoren sowie technische Parameter sind produktabhängig."},
        {"question":"Welche Alkoholbasis nennt die Baileys-FAQ?","options":["Nur Scotch Whisky","Neutralalkohol und Irish Whiskey","Nur Bier","Keinen Alkohol"],"correct":1,"explanation":"Die FAQ nennt beide Bestandteile. Das Produkt enthält außerdem Sahne und Milchproteine."},
        {"question":"Wie wird die Haltbarkeit eines geöffneten Sahnelikörs bestimmt?","options":["Immer sechs Monate","Anhand der konkreten Hersteller- und Produkthinweise","Unbegrenzt","Nur durch Probieren"],"correct":1,"explanation":"Baileys Original nennt zum Beispiel 24 Monate ab Abfüllung bei seinen Lagerbedingungen, geöffnet oder ungeöffnet. Das ist keine pauschale Kategorieregel."},
      ],
    },

    // ─── Lektion 8 ───────────────────────────────────────────
    {
      title: "Kaffeeliköre — Von Kahlúa bis Cold Brew",
      content: `## Kaffee trifft Alkohol

**Kaffeeliköre** vereinen zwei der beliebtesten Genussmittel der Welt und bilden eine der kommerziell erfolgreichsten Likör-Kategorien. Die Herstellung erfordert Expertise in zwei Domänen: Kaffeeverarbeitung und Likörproduktion. Die Aromenkomplexität von Kaffee — viele flüchtige Verbindungen — bietet ein enormes Gestaltungsspektrum, das durch die Wahl der Kaffesorte, des Röstgrads, der Extraktionsmethode und der Alkoholbasis vielfältig moduliert werden kann.

## Die Großen Marken

**Kahlúa** (1936, Mexiko) ist ein bekannter Kaffeelikör. Er basiert auf **Arabica-Kaffee** aus Veracruz (Mexiko), **Zuckerrohr-Rum** und Vanille. Die Kaffeebohnen werden geröstet, gemahlen und als Kaltextrakt gewonnen, der dann mit dem Rum, Zucker und Vanille assembliert wird. **Tia Maria** (1946, Jamaika) verwendet **Arabica-Kaffee aus Brasilien** im Cold-Brew-Verfahren; die aktuelle Herstellerbeschreibung nennt keine Blue-Mountain-Herkunft. **Mr. Black** (Australien) repräsentiert die neue Generation: Ein **Cold-Brew-Kaffeelikör** mit höherem Alkoholgehalt (25 % Vol.) und weniger Zucker, der die Kaffeearomen unverfälscht in den Vordergrund stellt.

## Herstellungsmethoden

**Die Kaffeeextraktion** ist der entscheidende Schritt. **Heiße Extraktion** (80–96 °C) löst schnell Aromastoffe, extrahiert aber auch Bitterstoffe und Chlorogensäure, die Adstringenz und einen flachen Geschmack erzeugen können. **Kalte Extraktion** (Cold Brew, 4–20 °C, 12–24 Stunden) liefert ein sanfteres, runderes Profil mit weniger Bitterkeit und höherer Süßwahrnehmung — erfordert aber deutlich mehr Kaffee pro Liter Extrakt. **Espresso-Extraktion** unter hohem Druck erzeugt ein konzentriertes, cremareiches Extrakt mit intensiver Aromatik. Einige Hersteller mazerieren ganze Bohnen direkt in Alkohol — der Ethanol extrahiert andere Verbindungen als Wasser, insbesondere fettlösliche Aromastoffe, die in wässrigen Extrakten fehlen.

## Röstgrad und Geschmacksprofil

**Der Röstgrad** des Kaffees prägt den Likör fundamental. **Helle Röstung** (City Roast): Fruchtig, blumig, säurebetont — ergibt elegant-komplexe Liköre mit Noten von Zitrus, Jasmin und Beeren. **Mittlere Röstung** (Full City): Ausgewogen, karamellig, nussig — der Klassiker für Kaffeeliköre mit harmonischem Profil. **Dunkle Röstung** (French/Italian): Rauchig, schokoladig, bitter — ergibt kräftige, robuste Liköre mit Noten von dunkler Schokolade und geröstetem Holz. **Sortenreinheit** ist ein wachsender Trend: Single-Origin-Kaffeeliköre aus äthiopischem Yirgacheffe, kolumbianischem Huila oder kenianischem AA erlauben terroir-spezifische Geschmackserlebnisse, vergleichbar mit Single-Malt-Whiskys.`,
      quiz: [
        {
          question:
            "Welche Kaffeebohnensorte verwendet Tia Maria?",
          options: [
            "Robusta aus Vietnam",
            "Arabica-Kaffee aus Brasilien",
            "Arabica aus Veracruz, Mexiko",
            "Liberica aus den Philippinen",
          ],
          correct: 1,
          explanation:
            "Die aktuelle Herstellerseite nennt 100 % Arabica-Kaffee aus Brasilien und Cold-Brew-Extraktion.",
        },
        {
          question:
            "Welchen Vorteil hat Cold-Brew-Extraktion bei Kaffeelikören?",
          options: [
            "Sie ist schneller und kostengünstiger",
            "Sie erzeugt ein sanfteres, weniger bitteres Profil mit höherer Süßwahrnehmung",
            "Sie extrahiert mehr Koffein",
            "Sie erfordert weniger Kaffeebohnen",
          ],
          correct: 1,
          explanation:
            "Cold Brew (4–20 °C, 12–24 h) extrahiert weniger Bitterstoffe und Chlorogensäure, was ein runderes, sanfteres Profil mit natürlicher wahrgenommener Süße ergibt.",
        },
        {
          question:
            "Was unterscheidet Mr. Black von klassischen Kaffeelikören?",
          options: [
            "Er enthält keinen Kaffee",
            "Er wird aus Instantkaffee hergestellt",
            "Er hat höheren Alkoholgehalt, weniger Zucker und stellt Kaffeearomen unverfälscht in den Vordergrund",
            "Er wird nur in der Cocktailbar verwendet",
          ],
          correct: 2,
          explanation:
            "Mr. Black repräsentiert die neue Generation: Cold-Brew-basiert, 25 % Vol., weniger Zucker — die Kaffeearomen stehen im Mittelpunkt statt hinter Süße versteckt.",
        },
      ],
    },

    // ─── Lektion 9 ───────────────────────────────────────────
    {
      title: "Schokoladenliköre — Vom Kakao zum Genuss",
      content: `## Kakao als Likör-Zutat

**Schokoladenliköre** verbinden die sensorische Welt des Kakaos mit Spirituosen zu einem der genussreichsten Segmente der Likörwelt. Die Basis bildet **Kakao** in verschiedenen Formen: **Kakaopulver** (entölt oder vollfett), **Kakaonibs** (geröstete, gebrochene Kakaobohnen), **Kakaobutter**, **Schokoladenmasse** oder **Kakaoextrakte**. Kakao enthält viele Aromaverbindungen — darunter Pyrazine (nussig, röstig), Aldehyde (fruchtig), Ester (blumig) und Phenole (rauchig). Das Zusammenspiel dieser Verbindungen mit Alkohol, Zucker und eventuell Sahne erzeugt ein außerordentlich komplexes Geschmackserlebnis.

## Qualitätsmerkmale von Kakaobohnen

**Kakaorohstoff und Verarbeitung**: Herkunft, Fermentation und Röstung beeinflussen das Profil. Klassische Sorten-/Gruppennamen wie Criollo, Trinitario und Forastero sind eine vereinfachte Beschreibung, keine universelle Qualitätsrangfolge. Ohne datierte Daten werden hier keine weltweiten Prozentanteile oder festen Röstprogramme als Pflicht behauptet.

## Herstellungsansätze

**Herstellungsansätze**: Kakaomaterial kann extrahiert oder mit weiteren Zutaten kombiniert werden. Fett, Feststoffe und gegebenenfalls Sahne verlangen eine abgestimmte Rezeptur. Kältefiltration ist eine mögliche Prozessmaßnahme, nicht zwingend Bestandteil jedes Schokoladenlikörs und kein Sterilisationsverfahren. Hochprozentigen Alkohol zu Hause nicht zum Schmelzen von Schokolade erhitzen.

## Die großen Marken

**Mozart Chocolate Liqueur** bietet nach aktueller Herstellerbeschreibung mehrere Stile, darunter Cream Chocolate mit belgischer Schokolade, White Chocolate mit Kakaobutter und Sahne sowie Dark Chocolate ohne Sahne. Die Rezeptur unterscheidet sich je Produkt; aus dem Wort 'Chocolate' folgen weder bestimmte Milchallergene noch ein bestimmter Zuckerwert. Etikett und konkrete Herstellerangaben prüfen.`,
      quiz: [
        {
          question:
            "Welcher Name bezeichnet eine klassische Kakaogruppe?",
          options: ["Arabica", "Robusta", "Criollo", "Pinot Noir"],
          correct: 2,
          explanation:
            "Criollo ist ein klassischer Kakaogruppenname. Eine Gruppe allein garantiert keine bestimmte Qualität.",
        },
        {
          question:
            "Wozu kann Kältefiltration bei einem kakaohaltigen Likör dienen?",
          options: [
            "Um den Alkoholgehalt zu senken",
            "Um ausgefallene Bestandteile zu entfernen; sie ist nicht bei jeder Rezeptur Pflicht",
            "Um den Zuckergehalt zu erhöhen",
            "Um Bakterien abzutöten",
          ],
          correct: 1,
          explanation:
            "Kältefiltration kann ausfallende Bestandteile entfernen. Sie beweist keine Sterilität und ist keine universelle Pflicht bei allen Schokoladenlikören.",
        },
        {
          question:
            "Warum ist die Fermentation der Kakaobohnen für den Likör entscheidend?",
          options: [
            "Sie erhöht den Koffeingehalt",
            "Ohne Fermentation schmeckt Kakao flach und adstringent — erst die Fermentation entwickelt die Aromen",
            "Sie sterilisiert die Bohnen",
            "Sie verändert die Farbe von braun zu weiß",
          ],
          correct: 1,
          explanation:
            "Die 3–7-tägige Fermentation wandelt Vorstufen in Aromaverbindungen um. Unfermentierter Kakao hat ein flaches, adstringentes Profil ohne die typische Schokoladen-Komplexität.",
        },
      ],
    },

    // ─── Lektion 10 ──────────────────────────────────────────
    {
      title: "Anis-Liköre — Ouzo, Pastis, Sambuca und Raki",
      content: `## Die Welt des Anisgeschmacks

**Anis-Liköre und -Spirituosen** bilden eine der ältesten und kulturell bedeutendsten Spirituosen-Familien der Welt. Der charakteristische Geschmack stammt von **Anethol** (trans-1-Methoxy-4-propenylbenzol), einer aromatischen Verbindung, die in **Sternanis** (Illicium verum), **Anis** (Pimpinella anisum) und **Fenchel** (Foeniculum vulgare) vorkommt. Anethol hat eine bemerkenswerte physikalische Eigenschaft: Es ist in Alkohol löslich, aber wasserunlöslich. Wenn ein Anis-Likör mit Wasser oder Eis verdünnt wird, fällt das Anethol als feine Tröpfchen aus und erzeugt die charakteristische milchig-weiße **Louche** (auch Ouzo-Effekt genannt).

## Ouzo — Griechenlands Nationalgetränk

**Ouzo** ist seit 2006 durch eine EU-Ursprungsbezeichnung geschützt und darf ausschließlich in Griechenland und Zypern hergestellt werden. Die Herstellung folgt einem präzisen Protokoll: Anissamen, Sternanis, Fenchel, Mastix (Harz der Mastix-Pistazie von Chios), Koriander, Kardamom und weitere Botanicals werden in Alkohol mazeriert und anschließend in kupfernen Brennblasen destilliert. Das Destillat muss mindestens **20 % des Gesamtalkohols** ausmachen ; die Zusammensetzung ist produktbezogen zu prüfen, statt eine pauschale Qualitätsrangfolge daraus abzuleiten. Der Alkoholgehalt liegt typisch bei **37,5–50 % Vol.** Ouzo wird traditionsgemäß mit Wasser verdünnt zu Meze (kleine Vorspeisen) getrunken. Die bekanntesten Marken: **Plomari** (Lesbos), **Mini** (Mytilene), **12** (Thessaloniki).

## Pastis, Sambuca und Raki

**Pastis** (Frankreich, min. 40 % Vol.) entstand als legaler Nachfolger des verbotenen Absinths. **Ricard** und **Pernod** sind die dominierenden Marken. Pastis enthält neben Anis auch **Süßholz** (Glycyrrhizin), das eine runde, lakritzartige Süße beisteuert. Er wird traditionsgemäß **1:5 mit eiskaltem Wasser** verdünnt. **Sambuca** (Italien, min. 38 % Vol.) ist ein rechtlich geregelter, farbloser Anislikör mit mindestens 350 g/l Zucker als Invertzucker; Holunderblüten sind keine zwingende Definitionszutat. **Sambuca con la mosca** („mit der Fliege") serviert man mit drei Kaffeebohnen, die traditionell Gesundheit, Reichtum und Glück symbolisieren; eine Flamme ist für das Servieren nicht erforderlich und wird hier nicht empfohlen. **Raki** (Türkei) und **Arak** (Libanon, Syrien, Israel) werden aus Traubendestillat mit Aniszusatz hergestellt. Raki wird als **„Löwenmilch"** (aslan sütü) bezeichnet und zu Meze mit kaltem Wasser getrunken.

## Absinth — Der große Bruder

**Absinth** (45–74 % Vol.) ist streng genommen kein Likör, da er den Mindestzuckergehalt nicht erfüllt. Er basiert auf **Wermut** (Artemisia absinthium), Anis und Fenchel. **Thujon** kann neurotoxisch wirken; hohe Dosen sind nicht harmlos. Angebliche besondere Rauscheffekte sind kein Qualitäts- oder Gesundheitsargument. Daneben ist der hohe Alkoholgehalt ein eigenständiges Risiko. Für Thujon gelten in der EU lebensmittelrechtliche Grenzen, die von der Produktgruppe abhängen; eine pauschale historische Freigabe aller Absinth-Produkte wird hier nicht behauptet. Die rituelle Zubereitung mit Absinthlöffel, Zuckerwürfel und eiskaltem Wasser ist fester Bestandteil der Bar-Kultur. Absinth war im 19. Jahrhundert das Getränk der Bohème: Toulouse-Lautrec, Van Gogh, Rimbaud und Wilde waren berühmte Konsumenten.`,
      quiz: [
        {
          question:
            "Welche chemische Verbindung ist für den Ouzo-Effekt (Louche) verantwortlich?",
          options: [
            "Thujon",
            "Anethol, das bei Wasserzugabe als feine Tröpfchen ausfällt",
            "Glycyrrhizin aus Süßholz",
            "Menthol",
          ],
          correct: 1,
          explanation:
            "Anethol ist in Alkohol löslich, aber wasserunlöslich. Bei Verdünnung mit Wasser fällt es als Emulsion feiner Tröpfchen aus — die milchig-weiße Trübung (Louche/Ouzo-Effekt).",
        },
        {
          question:
            "Was symbolisieren die drei Kaffeebohnen bei Sambuca con la mosca?",
          options: [
            "Erde, Wasser und Feuer",
            "Gesundheit, Reichtum und Glück",
            "Vergangenheit, Gegenwart und Zukunft",
            "Vater, Sohn und Heiliger Geist",
          ],
          correct: 1,
          explanation:
            "Die drei Kaffeebohnen (mosche/Fliegen) in der Sambuca symbolisieren traditionell Gesundheit (salute), Reichtum (ricchezza) und Glück (felicità).",
        },
        {
          question:
            "Warum ist Absinth technisch gesehen kein Likör?",
          options: [
            "Weil er zu viel Alkohol enthält",
            "Weil er den Mindestzuckergehalt von 100 g/l nicht erfüllt",
            "Weil er Wermut enthält",
            "Weil er in der EU verboten ist",
          ],
          correct: 1,
          explanation:
            "Absinth erfüllt nicht den EU-Mindestzuckergehalt von 100 g/l für Liköre. Der Name allein ist keine eigenständige EU-Spirituosenkategorie; die rechtliche Bezeichnung richtet sich nach der tatsächlichen Zusammensetzung.",
        },
      ],
    },

    // ─── Lektion 11 ──────────────────────────────────────────
    {
      title: "Klassische Likörmarken weltweit",
      content: `## Die Ikonen der Likörwelt

**Die globale Likörlandschaft** wird von einer Handvoll legendärer Marken geprägt, die über Generationen Qualitätsstandards gesetzt und ganze Kategorien definiert haben. Jede dieser Marken verkörpert eine einzigartige Philosophie, eine spezifische Herstellungstradition und ein kulturelles Erbe, das weit über das Produkt hinausgeht. Die Kenntnis dieser Marken und ihrer Besonderheiten ist essenziell für jeden, der professionell mit Likören arbeitet.

## Die Niederländische Tradition — Bols und De Kuyper

**Lucas Bols** (1575, Amsterdam) führt seine Herstellerchronik auf 1575 zurück. Im Goldenen Zeitalter der Niederlande (17. Jahrhundert) profitierte Bols von Amsterdams Stellung als globaler Handelshafen: Exotische Gewürze, Früchte und Botanicals aus den Kolonien flossen direkt in die Likörproduktion. Bols produziert verschiedene Liköre, darunter den ikonischen **Bols Blue Curaçao** und den historischen **Bols Genever**. **De Kuyper** (1695, Schiedam) ist ein bekannter Likörhersteller und beliefert professionelle Bars weltweit. Die aktuellen Produktangebote sind beim Hersteller zu prüfen.

## Französische Eleganz

**Cointreau** (1849, Angers) definierte den Triple Sec: Ein destillierter Orangenlikör aus süßen und bitteren Orangenschalen, kristallklar und mit perfekter Balance zwischen Süße und Bitterkeit bei **40 % Vol.** — deutlich stärker als die meisten Liköre. **Grand Marnier** (1880) ging einen anderen Weg: Bitterorangen-Destillat auf der Basis von **Cognac**, gereift in Eichenholzfässern, tiefgolden und komplex. Die Cordon Rouge-Variante (laut Hersteller 51 % Cognac) ist der Klassiker. **Bénédictine** (1510/1863, Fécamp) beschreibt eine Rezeptur mit 27 Pflanzen und Gewürzen. Ein weltweit ältestes Rezept oder eine vollständige geheime Zutatenliste wird hier nicht behauptet. Die Flasche trägt das Motto **D.O.M.** (Deo Optimo Maximo — „Dem besten, größten Gott").

## Globale Ikonen

**Drambuie** (Schottland) basiert auf **Scotch Whisky**, Heidehonig und Kräutern — der Legende nach stammt die Rezeptur von Bonnie Prince Charlie (1745). **Galliano** (Italien, 1896) ist ein Vanille-Anis-Kräuterlikör in der markanten hohen Flasche, benannt nach dem italienischen Kriegshelden Giuseppe Galliano. Er ist essenzielle Zutat im **Harvey Wallbanger**. **Southern Comfort** (USA, 1874, New Orleans) kombiniert neutralen Whiskey mit Pfirsich und Gewürzen — historisch ein aromatisierter Whiskey, heute als Likör klassifiziert. **Midori** (Japan, 1978, Suntory) ist ein Melonenlikör, der speziell für die amerikanische Cocktailkultur bei der Eröffnung von Studio 54 in New York lanciert wurde. **Licor 43** (Spanien) verwendet 43 mediterrane Zutaten und ist in der spanischsprachigen Welt allgegenwärtig — sein Vanille-Zitrus-Profil macht ihn zum meistverkauften Likör Spaniens.`,
      quiz: [
        {
          question:
            "Welches Haus führt seine Likörherstellung laut eigener Chronik auf 1575 zurück?",
          options: [
            "Cointreau (1849)",
            "Lucas Bols (1575)",
            "Bénédictine (1510)",
            "De Kuyper (1695)",
          ],
          correct: 1,
          explanation:
            "Bols beschreibt die Gründung der Destillerie 't Lootsje in Amsterdam im Jahr 1575. Ein weltweiter Altersrekord ist dafür nicht notwendig.",
        },
        {
          question:
            "Was bedeutet D.O.M. auf der Bénédictine-Flasche?",
          options: [
            "Denominazione di Origine Monacale",
            "Deo Optimo Maximo — Dem besten, größten Gott",
            "Destillerie Officielle de Monastère",
            "Domaine Original de Moine",
          ],
          correct: 1,
          explanation:
            "D.O.M. steht für das lateinische 'Deo Optimo Maximo' (Dem besten, größten Gott) — ein Benediktiner-Motto, das die klösterlichen Wurzeln des Likörs ehrt.",
        },
        {
          question:
            "Was unterscheidet Cointreau von Grand Marnier grundlegend?",
          options: [
            "Cointreau enthält Alkohol, Grand Marnier nicht",
            "Cointreau ist ein kristallklarer Triple Sec, Grand Marnier basiert auf Cognac und ist fassgelagert",
            "Grand Marnier enthält keine Orangenaromen",
            "Cointreau stammt aus Italien, Grand Marnier aus Spanien",
          ],
          correct: 1,
          explanation:
            "Cointreau ist ein kristallklarer Orangenlikör aus süßen und bitteren Orangenschalen. Grand Marnier vereint Bitterorangen-Destillat mit Cognac und Fassreifung — tiefgolden und weicher.",
        },
      ],
    },

    // ─── Lektion 12 ──────────────────────────────────────────
    {
      title: "Italienische Liköre — Amaretto, Limoncello und Amari",
      content: `## Italien — Das Herzland der Likörkultur

**Italien** ist ohne Übertreibung die vielfältigste und einflussreichste Likör-Nation der Welt. Von den Alpen bis Sizilien hat jede Region eigene Spezialitäten entwickelt, die lokale Zutaten, klimatische Bedingungen und jahrhundertealte Traditionen reflektieren. Der **Amaro** (Plural: Amari) — der bittere Kräuterlikör — ist das Herzstück der italienischen Trinkkultur und wird traditionell als **Digestivo** nach dem Essen getrunken. Eine feste Zahl der italienischen Likörmarken wird hier ohne datierte Erhebung nicht behauptet.

## Limoncello — Süditaliens flüssiger Sonnenschein

**Limoncello** wird traditionell an der **Amalfiküste**, auf **Capri** und in **Sorrent** hergestellt. Die Basis: Schalen der **Sfusato Amalfitano**-Zitrone an der Amalfiküste; in Sorrent werden andere lokale Sorten verwendet, mit jeweils eigenen Eigenschaften. Die Herstellung ist elegant einfach: Die Schalen werden **ohne weiße Albedo** (die bitter wäre) dünn abgeschält und in **hochprozentigem Alkohol** (95 % Vol. Agraralkohol) über einen produktabhängigen Zeitraum mazeriert. Nur das gelbe Flavedo enthält die ätherischen Öle (Limonen, Citral, Linalool), die den Limoncello aromatisieren. Das Mazerat wird dann mit **Zuckersirup** verdünnt auf typisch 25–32 % Vol. Alkohol und 200–350 g/l Zucker.

## Amaretto — Das Geheimnis der Mandelnote

**Amaretto** wurde in Lektion 6 als mandelartig wahrgenommener Stil eingeordnet. Markengeschichten aus Saronno werden teils ausdrücklich als Legenden erzählt. Ohne veröffentlichte Rezeptur wird hier kein konkreter Herstellungsablauf für Disaronno behauptet. Lazzaroni veröffentlicht dagegen die Amaretti-Keksinfusion als Produktmerkmal.

## Die Amaro-Landkarte Italiens

**Norditalien**: **Amaro Nonino Quintessentia** (Friaul, mit ÙE-Traubenbrand/Acquavite d'Uva veredelt, elegant-kräutrig), **Fernet-Branca** (Mailand, extrem bitter, 27 Kräuter inkl. Myrrhe, Safran, Aloe). **Weitere Regionen**: **Amaro Lucano** (Basilikata, 1894, ausgewogene Bitterkeit mit Honig), **Centerba** (Abruzzen, Kräuterspirituosenstil; Stärke produktabhängig). **Süditalien**: **Averna** (Sizilien, rund und süßlich mit Orangenschale), **Strega** (Benevento, Kampanien, gelb gefärbt durch Safran, 70 Kräuter). **Inseln**: **Mirto** (Sardinien, aus Myrtenbeeren, rot oder weiß). Diese regionale Vielfalt spiegelt Italiens kulinarische Philosophie wider: Jeder Ort hat seine eigene Identität, seine eigenen Zutaten und seine eigene Tradition.`,
      quiz: [
        {
          question:
            "Warum wird beim Limoncello nur das gelbe Flavedo der Zitrone verwendet?",
          options: [
            "Weil die weiße Albedo zu süß ist",
            "Weil nur das Flavedo die ätherischen Öle enthält — die Albedo wäre bitter",
            "Weil die Albedo den Alkohol verdünnt",
            "Aus rein ästhetischen Gründen",
          ],
          correct: 1,
          explanation:
            "Nur das gelbe Flavedo enthält die ätherischen Öle (Limonen, Citral, Linalool). Die weiße Albedo (Mesokarp) enthält Bitterstoffe, die den Limoncello verderben würden.",
        },
        {
          question:
            "Welcher italienische Amaro wird heute mit ÙE-Traubenbrand veredelt?",
          options: [
            "Fernet-Branca",
            "Averna",
            "Amaro Nonino",
            "Amaro Lucano",
          ],
          correct: 2,
          explanation:
            "Amaro Nonino Quintessentia verwendet seit 1992 ÙE-Traubenbrand statt des früheren Grappa. Traubenbrand und Tresterbrand sind nicht dasselbe.",
        },
        {
          question:
            "Welcher Kräuterspirituosenstil wird mit den Abruzzen verbunden?",
          options: [
            "Fernet-Branca",
            "Centerba aus den Abruzzen",
            "Averna",
            "Amaro Montenegro",
          ],
          correct: 1,
          explanation:
            "Centerba steht für einen Kräuterspirituosenstil aus den Abruzzen. Alkoholstärke und Zusammensetzung sind produktabhängig.",
        },
      ],
    },

    // ─── Lektion 13 ──────────────────────────────────────────
    {
      title: "Französische Liköre — Chartreuse, Cointreau und Grand Marnier",
      content: `## Frankreichs Beitrag zur Likörkunst

**Frankreich** hat die Likörwelt wie kein anderes Land geprägt. Französische Liköre stehen für Eleganz, Komplexität und handwerkliche Perfektion. Drei Faktoren begründen diese Vorherrschaft: Die **klösterliche Tradition** (Benediktiner, Kartäuser), die **koloniale Verfügbarkeit** exotischer Zutaten (Karibik, Afrika, Asien) und das französische Verständnis von **Art de Vivre**, das Genussmittel als kulturelles Gut begreift.

## Chartreuse — Das ultimative Geheimrezept

**Chartreuse** veröffentlicht 130 Pflanzenbestandteile als Rezepturmerkmal. Die Herstellerseiten beschreiben Mazeration, Destillation und Reifung in Eichenbehältern. Grüne Chartreuse hat 55 % Vol., die aktuelle gelbe Chartreuse 43 % Vol. V.E.P. bedeutet Vieillissement Exceptionnellement Prolongé und beschreibt besonders verlängerte Reifung, keine zugesicherte Wertsteigerung.

## Cointreau — Die Perfektion des Triple Sec

**Cointreau** (1849, Angers, Loire-Tal) ist das Referenzprodukt für kristallklare Orangenliköre. Das Haus Cointreau verwendet süße und bittere Orangenschalen sowie Destillation. 'Triple Sec' garantiert keine dreifache Destillation. Der Prozess: Orangenschalen aus aller Welt (Haiti, Spanien, Brasilien) werden separat in Neutralalkohol mazeriert, danach destilliert. Die verschiedenen Destillate werden assembliert und mit Zucker versetzt. Das Ergebnis: **40 % Vol.**, kristallklar, mit einem perfekten Gleichgewicht zwischen Zitrus-Süße und Bitterorange. Cointreau ist ein möglicher Orangenlikör für Margarita, Cosmopolitan, Sidecar und Mai Tai; eine feste Cocktailzahl ist kein Rezepturmerkmal.

## Grand Marnier und Bénédictine

**Grand Marnier Cordon Rouge** verbindet Cognac und Bitterorangenlikör; der Hersteller nennt 51 % Cognac. Eine bestimmte Fine-Champagne-Herkunft oder ein fixes Cognacalter wird für diese Abfüllung hier nicht behauptet. Andere Cuvées haben eigene Zusammensetzungen. Bénédictine ist ein weiteres Kräuterlikör-Beispiel; historische Heilmittelgeschichten sind keine heutige Gesundheitszusage.`,
      quiz: [
        {
          question:
            "Welche Zahl veröffentlicht Chartreuse als Pflanzenbestandteil-Merkmal?",
          options: [
            "Einer — der Abt",
            "130 Pflanzenbestandteile",
            "Fünf Mönche und der Abt",
            "Alle Mönche des Klosters",
          ],
          correct: 1,
          explanation:
            "Die Produktseite nennt 130 Pflanzenbestandteile; daraus wird hier keine vollständige Zutatenliste erfunden.",
        },
        {
          question:
            "Welche Basis ist für Grand Marnier Cordon Rouge charakteristisch?",
          options: [
            "VS (Very Special)",
            "VSOP aus Borderies",
            "Cognac, vermählt mit Bitterorangenlikör",
            "XO aus Bois Ordinaires",
          ],
          correct: 2,
          explanation:
            "Grand Marnier Cordon Rouge kombiniert Cognac mit Bitterorangenlikör; der Hersteller nennt 51 % Cognac. Ein bestimmter Fine-Champagne-Cru wird hier nicht vorausgesetzt.",
        },
        {
          question:
            "Welchen Alkoholgehalt nennt Cointreau für sein klassisches Produkt?",
          options: [
            "10 % Vol.",
            "20 % Vol.",
            "40 % Vol.",
            "60 % Vol.",
          ],
          correct: 2,
          explanation:
            "Die aktuelle Produktseite nennt 40 % Vol. Cocktailzahlen sind keine feste Definition eines Likörs.",
        },
      ],
    },

    // ─── Lektion 14 ──────────────────────────────────────────
    {
      title: "Deutsche Likör-Tradition",
      content: `## Deutschlands unterschätzte Likörkultur

**Deutschland** besitzt eine reiche und vielfältige Likör-Tradition, die international oft unterschätzt wird. Während französische und italienische Liköre die Weltbühne dominieren, pflegt Deutschland eine eigenständige Likörkultur, die von **Kräuterlikören über Eierpunsch** bis zu **regionalen Spezialitäten** reicht. Die deutsche Likörlandschaft ist geprägt von mittelständischen Familienbetrieben, die seit Generationen produzieren, und von regionalen Trinkgewohnheiten, die sich von Nord nach Süd, von Ost nach West deutlich unterscheiden.

## Kräuterliköre — Deutschlands stärkste Kategorie

**Jägermeister** (1935, Wolfenbüttel) ist ein bekannter deutscher Kräuterlikör. Die Rezeptur umfasst **56 Kräuter, Blüten, Wurzeln und Früchte**, darunter Zimt, Sternanis, Ingwer, Orangenschalen und Süßholz. Die Zutaten werden mazeriert und filtriert; der vereinte Grundstoff reift laut Hersteller rund ein Jahr in Eichenfässern. Vor der Abfüllung werden Wasser, Alkohol, Karamell und Zucker ergänzt. Der Erfolg in den USA ab den 1980ern — befeuert durch die Barkultur und den „Jäger-Bomb" (Jägermeister + Energy Drink) — machte die Marke zum globalen Phänomen.

**Underberg** (1846, Rheinberg am Niederrhein) ist ein **bitterer Digestif** im ikonischen 20-ml-Portionsfläschchen, umwickelt mit Papier. Er wird aus Kräutern aus 43 Ländern hergestellt und als traditionell nach dem Essen angeboten; eine Verdauungswirkung wird hier nicht zugesichert. **Killepitsch** (Düsseldorf, 42 % Vol.) enthält laut aktueller Herstellerseite 98 Kräuter, Beeren und Früchte und ist eine lokale Institution. **Schierker Feuerstein** (Harz) ist ein Halbitter mit Anis und Kümmel. **Kuemmerling** (Bodenheim, 35 % Vol.) wird seit 1938 als Magenbitter vermarktet.

## Eierlikör und regionale Spezialitäten

**Verpoorten** (gegründet 1876 in Heinsberg, heute Bonn) ist eine bekannte deutsche **Eierlikör**-Marke. Eierlikör hat eine eigene EU-Kategorie: mindestens **140 g Eigelb und 150 g Zucker pro Liter**, Mindestalkohol 14 % Vol. Verpoorten verwendet Eier als wesentliche Zutat. Regionale Spezialitäten: **Danziger Goldwasser** (Likör mit echten Blattgoldflocken, historisch aus Danzig, heute eine Marke von Hardenberg-Wilthen), **Bärenfang** (Ostpreußischer Honiglikör auf Wodkabasis), **Ettaler Klosterlikör** (Bayern, von Benediktinern hergestellt), **Blutwurz** (Bayern, aus der Tormentill-Wurzel, tiefrot), **Friesengeist** (Ostfriesland, 56 % Vol., nicht anzünden; hochprozentig). Die **Norddeutsche Kümmel-Tradition** (Helbing Kümmel, Hamburg) und der **Goldene Hai** (Nordsee-Region, mit Blattgold) zeigen die norddeutsche Seite der Likörkultur.`,
      quiz: [
        {
          question:
            "Wie viele Kräuter enthält die Jägermeister-Rezeptur?",
          options: ["28", "42", "56", "72"],
          correct: 2,
          explanation:
            "Jägermeister enthält 56 Kräuter, Blüten, Wurzeln und Früchte. Diese werden laut Hersteller mazeriert, filtriert und als Grundstoff rund ein Jahr in Eichenfässern gereift.",
        },
        {
          question:
            "Welche Mindestanforderungen gelten für Eierlikör in der EU?",
          options: [
            "50 g Eigelb und 100 g Zucker pro Liter",
            "140 g Eigelb und 150 g Zucker pro Liter bei mind. 14 % Vol.",
            "200 g Eigelb und 200 g Zucker pro Liter bei mind. 20 % Vol.",
            "Es gibt keine spezifischen Vorgaben",
          ],
          correct: 1,
          explanation:
            "EU-Recht schreibt für Eierlikör mindestens 140 g Eigelb und 150 g Zucker pro Liter vor, bei einem Mindestalkoholgehalt von 14 % Vol.",
        },
        {
          question:
            "Was ist das Besondere am Danziger Goldwasser?",
          options: [
            "Es wird aus Gold hergestellt",
            "Es enthält echte Blattgoldflocken",
            "Es wird in goldenen Flaschen verkauft",
            "Es ist der teuerste Likör der Welt",
          ],
          correct: 1,
          explanation:
            "Danziger Goldwasser enthält echte Blattgoldflocken, die im Likör schweben. Diese Tradition geht auf das 16. Jahrhundert zurück, als Gold medizinische Wirkung zugeschrieben wurde.",
        },
      ],
    },

    // ─── Lektion 15 ──────────────────────────────────────────
    {
      title: "Cocktails mit Likör — Von Klassikern bis Modern Mixology",
      content: `## Liköre als Cocktail-Bausteine

**Liköre** sind unverzichtbare Bestandteile der professionellen Barkultur. Sie erfüllen im Cocktail drei Funktionen: Sie bringen **Süße** (als Alternative zu einfachem Zuckersirup), **Aroma** (als komplexe Geschmacksverstärker) und **Textur** (durch ihren Zuckergehalt erzeugen sie ein volleres Mundgefühl). Die International Bartenders Association (IBA) veröffentlicht Referenzrezepte, darunter zahlreiche Cocktails mit Likören. Ein professioneller Bartender muss die Likör-Kategorien und ihre Einsatzmöglichkeiten exakt kennen.

## Die unverzichtbaren Likör-Klassiker

**Margarita** (Tequila, Cointreau/Triple Sec, Limettensaft) — ein bekannter Sour-Cocktail. Cointreau bringt Orangensüße und Balance zur Limettensäure. Verhältnisse variieren; die aktuelle IBA-Fassung verwendet 50 ml Tequila, 20 ml Triple Sec und 15 ml Limettensaft. **Cosmopolitan** (Wodka Citron, Cointreau, Cranberrysaft, Limette) — Carrie Bradshaws Lieblingsdrink, popularisiert durch „Sex and the City". **Sidecar** (Cognac, Cointreau, Zitronensaft) — ein Klassiker aus den 1920ern, angeblich im Ritz Paris entstanden. **Mai Tai** (Rum, Curaçao/Triple Sec, Orgeat-Mandelsirup, Limette) — Trader Vic's Kreation von 1944. **B-52** (Kahlúa, Baileys, Grand Marnier, geschichtet) — ein Layer-Shot, bei dem die unterschiedlichen Dichten der Liköre die Schichten erzeugen.

## Moderne Mixology mit Likören

**Die moderne Cocktailkultur** hat Liköre wiederentdeckt und in einen neuen Kontext gesetzt. **Amaro-Cocktails** sind ein Beispiel für verschiedene moderne Anwendungen: Der **Paper Plane** (Bourbon, Amaro Nonino, Aperol, Zitrone, zu gleichen Teilen) wurde 2008 von Sam Ross kreiert und ist der Amaro-Cocktail der Moderne. Der **Black Manhattan** ersetzt den Sweet Vermouth durch Averna. Der **Naked and Famous** (Mezcal, Chartreuse, Aperol, Limette) verbindet rauchigen Mezcal mit der Komplexität der Chartreuse.

**Chartreuse-Cocktails**: Der **Last Word** (Gin, Grüne Chartreuse, Maraschino, Limette, zu gleichen Teilen) ist ein Prohibition-Klassiker, der um 2004 wiederentdeckt wurde und die Cocktail-Renaissance einleitete. Der **Chartreuse Swizzle** (Grüne Chartreuse, Ananassaft, Limette, Falernum) ist ein tropischer Chartreuse-Drink. **Likör-Techniken**: **Fat-Washing** (Fett-Infusion mit Likör), **Clarification** (Milchklärung von trüben Likör-Cocktails), **Sous-Vide-Mazeration** (beschleunigte Likörherstellung bei niedriger Temperatur unter Vakuum) und **Saline Solution** (Salzlösung, die die Süße von Likören moduliert) sind Werkzeuge des modernen Bartenders.`,
      quiz: [
        {
          question:
            "Welcher Cocktail besteht aus gleichen Teilen Bourbon, Amaro Nonino, Aperol und Zitrone?",
          options: [
            "Manhattan",
            "Paper Plane",
            "Negroni",
            "Old Fashioned",
          ],
          correct: 1,
          explanation:
            "Der Paper Plane wurde 2008 von Sam Ross kreiert und besteht aus gleichen Teilen Bourbon, Amaro Nonino, Aperol und Zitronensaft. Er ist zum modernen Amaro-Cocktail-Klassiker geworden.",
        },
        {
          question:
            "Welcher Cocktail kombiniert Gin, grüne Chartreuse, Maraschino und Limette zu gleichen Teilen?",
          options: [
            "Corpse Reviver",
            "Aviation",
            "Last Word",
            "Bee's Knees",
          ],
          correct: 2,
          explanation:
            "Die IBA-Fassung des Last Word kombiniert gleiche Teile Gin, grüne Chartreuse, Maraschino und Limettensaft.",
        },
        {
          question:
            "Welche drei Funktionen erfüllen Liköre im Cocktail?",
          options: [
            "Farbe, Alkohol und Schaumbildung",
            "Süße, Aroma und Textur",
            "Kühlung, Verdünnung und Konservierung",
            "Bitterkeit, Säure und Salzigkeit",
          ],
          correct: 1,
          explanation:
            "Liköre bringen Süße (Alternative zu Sirup), Aroma (komplexe Geschmacksverstärker) und Textur (volleres Mundgefühl durch Zucker) in den Cocktail ein.",
        },
      ],
    },

    // ─── Lektion 16 ──────────────────────────────────────────
    {
      title: "Sensorik und Verkostung von Likören",
      content: `## Professionelle Likörverkostung

**Die sensorische Bewertung von Likören** erfordert eine spezifische Methodik, die sich von der Wein- oder Whiskydegustation unterscheidet. Der hohe Zuckergehalt (100–400 g/l), die oftmals kräftigen Farben und die enorme Aromenvielfalt (von floral über fruchtig bis bitter-medizinal) stellen besondere Anforderungen an den Verkoster. Professionelle Likörverkostung folgt einem strukturierten Ablauf: **Optische Bewertung**, **Olfaktorische Analyse** (Nase), **Gustatorische Prüfung** (Gaumen) und **Nachhall-Bewertung**.

## Optische Bewertung

**Farbe** ist bei Likören ein wichtiger Qualitätsindikator. Man gießt 20–30 ml in ein klares **Nosingglas** oder ein Cognacglas und betrachtet gegen weißen Hintergrund. **Klarheit**: Ist der Likör brillant klar, leicht trüb oder opak (Sahneliköre)? Trübung bei einem eigentlich klaren Likör deutet auf Qualitätsmängel hin (Ausfällung, Oxidation). **Farbintensität und -ton**: Fruchtliköre zeigen je nach Frucht und Herstellungsverfahren ein Spektrum von wasserklar (destilliert) über goldgelb (Zitrus-Mazerate) bis tiefrot (Beerenmazerate). **Viskosität**: Man schwenkt das Glas und beobachtet die **Schlieren** (Kirchenfenster/Tränen): Schlieren hängen unter anderem von Oberflächenspannung, Verdunstung und Zusammensetzung ab; sie erlauben keine genaue Alkohol-/Zuckermessung.

## Olfaktorische Analyse

**Das Riechen** erfolgt in drei Stufen. **Erster Eindruck** (Glas ruhig unter die Nase, Abstand 3–5 cm): Hier nimmt man die flüchtigsten, leichtesten Aromen wahr — florale Noten, frische Zitrusnoten, Alkoholschärfe. **Zweiter Eindruck** (leichtes Schwenken, Glas direkt an die Nase): Jetzt treten die Fruchtaromen, Gewürze und Kräuternoten hervor. **Dritter Eindruck** (nach 5–10 Min. Belüftung): Die tiefsten Aromen erscheinen — Holz, Vanille, Karamell, erdige Noten. Bei einem Likör mit 30+ % Vol. ist **Retronasale Wahrnehmung** wichtig: Nach einem kleinen Schluck atmet man durch die Nase aus und nimmt Aromen wahr, die über den Rachenraum in die Nasenhöhle gelangen.

## Gustatorische Prüfung und Nachhall

**Am Gaumen** bewertet man: **Süße-Säure-Bitter-Balance** — ein guter Likör zeigt Harmonie, nicht eindimensionale Süße. **Mundgefühl**: Leicht und spritzig oder schwer und sirupartig? Samtig-cremig (Sahneliköre) oder trocken-adstringent (tannin-reiche Kräuterliköre)? **Alkoholintegration**: Ist der Alkohol nahtlos eingebunden oder brennt er unangenehm? **Aromenentwicklung**: Wie verändert sich der Geschmack vom ersten Kontakt (Antrunk) über die Mitte (Mittellauf) bis zum Abgang? **Der Nachhall** (Finish/Abgang) wird in Sekunden gemessen: **Kurz** (unter 5 Sek.), **mittel** (5–10 Sek.), **lang** (10–20 Sek.), **sehr lang** (über 20 Sek.). Hochwertige Liköre zeigen typisch einen langen, komplexen Nachhall, bei dem sich die Aromen im Abklingen noch verändern.`,
      quiz: [
        {
          question:
            "Was zeigen langsam fließende, breite Schlieren im Glas an?",
          options: [
            "Einen niedrigen Alkoholgehalt",
            "Keine genaue Alkohol-/Zuckermenge; Schlieren sind kein Qualitätsbeweis",
            "Mindere Qualität",
            "Eine Kältetrübung",
          ],
          correct: 1,
          explanation:
            "Schlieren erlauben keine zuverlässige Zutatendiagnose oder Qualitätswertung. Oberflächenspannung und Verdunstung spielen ebenfalls eine Rolle.",
        },
        {
          question:
            "Was versteht man unter retronasaler Wahrnehmung?",
          options: [
            "Das Riechen am geschlossenen Glas",
            "Das Wahrnehmen von Aromen, die über den Rachenraum in die Nasenhöhle gelangen",
            "Das Riechen mit der linken Nasenhälfte",
            "Die optische Beurteilung des Likörs",
          ],
          correct: 1,
          explanation:
            "Bei der retronasalen Wahrnehmung atmet man nach einem Schluck durch die Nase aus. Aromaverbindungen gelangen über den Rachenraum in die Nasenhöhle und erschließen zusätzliche Geschmacksdimensionen.",
        },
        {
          question:
            "Wozu dienen Zeitangaben bei einer Verkostung?",
          options: [
            "Ab 2 Sekunden",
            "Ab 5 Sekunden",
            "Als beschreibende Konvention, nicht als gesetzliche Qualitätsgrenze",
            "Ab 30 Sekunden",
          ],
          correct: 2,
          explanation:
            "Die Lektion verwendet ein illustratives Beschreibungsschema. Die Dauer allein belegt weder Qualität noch eine amtliche Klasse.",
        },
      ],
    },

    // ─── Lektion 17 ──────────────────────────────────────────
    {
      title: "Lagerung und Haltbarkeit von Likören",
      content: `## Produktspezifisch statt pauschal

**Liköre** unterscheiden sich durch Alkohol, Zucker, Säure, pflanzliche Inhaltsstoffe und gegebenenfalls Milch oder Ei. Deshalb gibt es weder eine einzige ideale Lagertemperatur noch ein festes Haltbarkeitsfenster für die gesamte Kategorie. Etikett, Verpackung und aktuelle Herstellerhinweise haben Vorrang.

## Nachvollziehbare Beispiele

**Baileys Original**: Der Hersteller nennt 24 Monate ab Abfüllung, geöffnet oder ungeöffnet, bei 0–25 °C und Schutz vor direkter Sonne; andere Varianten und kleine Verpackungen können abweichen. **Kahlúa Original**: Der Hersteller empfiehlt einen kühlen, trockenen, lichtgeschützten Ort und nennt vier Jahre als Qualitätszeitraum; Kaffeeintensität kann abnehmen. **Eierlikör**: Keine allgemeine Drei-Monats-Regel. Verpoorten empfiehlt für den geöffneten Original-Eierlikör aufrechte Kühlschranklagerung und Verbrauch innerhalb von sechs Monaten; andere Produkte können andere Vorgaben haben.

## Licht, Temperatur und Verschluss

Direkte Sonne, starke Wärme und große Temperaturschwankungen vermeiden, soweit die Produkthinweise nichts Spezifischeres sagen. Klare beziehungsweise farblose Glasflaschen sind nicht automatisch lichtschützend. Den Verschluss sauber halten und nach Gebrauch schließen. Eine frostige Servierempfehlung darf nicht ungeprüft als dauerhafte Lagerfreigabe für jeden Likör übernommen werden.

## Kein Sicherheitsnachweis durch Geschmack

Farbveränderung, Ausflockung oder Phasentrennung sind Anlass zur Prüfung. Ein angenehmer Geruch oder Geschmack beweist aber keine mikrobiologische Sicherheit. Verdächtige Produkte nicht zur Sicherheitskontrolle verkosten.`,
      quiz: [
        {"question":"Welche Lagerregel hat Vorrang?","options":["Immer 15–20 °C","Die aktuelle Angabe für das konkrete Produkt","Immer Gefrierfach","Temperatur ist irrelevant"],"correct":1,"explanation":"Kategorienamen ersetzen weder Etikett noch Herstellerhinweise."},
        {"question":"Was beweist ein unauffälliger Geruch?","options":["Garantierte Sicherheit","Keine vollständige mikrobiologische Sicherheit","Unbegrenzte Haltbarkeit","Dass Alkohol alle Keime beseitigt"],"correct":1,"explanation":"Geruch und Aussehen können Hinweise geben, ersetzen aber keine sichere Lagerung oder Produkthinweise."},
        {"question":"Welche Aussage zur Haltbarkeit von Eierlikör stimmt?","options":["Immer exakt drei Monate","Sie ist produktabhängig; beispielsweise gibt Verpoorten eigene Hinweise nach Öffnung","Immer unbegrenzt","Bei jedem Produkt gleich"],"correct":1,"explanation":"Für Verpoorten Original werden gekühlte aufrechte Lagerung und sechs Monate genannt. Das ist keine Regel für jede Eierlikörrezeptur."},
      ],
    },

    // ─── Lektion 18 ──────────────────────────────────────────
    {
      title: "Likör selbst herstellen — Vom Ansatz zum Produkt",
      content: `## Hausansatz und Destillation unterscheiden

**Aufgesetzter** bezeichnet Zutaten, die in einer fertigen Alkoholbasis ziehen. Das ist nicht dasselbe wie das Erzeugen von Alkohol durch Gärung und Destillation. Destillation und gewerbliche Herstellung unterliegen eigenständigen alkoholsteuer-, lebensmittel- und gegebenenfalls gewerberechtlichen Regeln. Für eine konkrete rechtliche Frage sind die zuständigen Behörden maßgeblich; das frühere Branntweinmonopol ist keine aktuelle pauschale Rechtsgrundlage.

## Sichere Auswahl

Nur einwandfreie, für Lebensmittel geeignete Zutaten und ausdrücklich zum Verzehr geeigneten, legal erworbenen Alkohol verwenden. Kein Brennspiritus, technischer oder vergällter Alkohol. Keine unbekannten Wildpflanzen, Bittermandeln oder zerkleinerten Steinobstkerne einsetzen; natürliche Herkunft bedeutet nicht automatisch Sicherheit. Die BfR-Hinweise zu cyanogenen Glykosiden und Lebensmittelvergiftungen sind zu beachten.

## Sauber arbeiten

Lebensmitteltaugliche, sauber gereinigte Gefäße verwenden und Zutaten hygienisch verarbeiten. Ein sauber wirkendes Glas ist nicht automatisch steril. Fertiger Alkohol verhindert nicht unter allen Bedingungen mikrobiellen Verderb, besonders nach Verdünnung oder bei Ei-/Milchzusätzen. Keine allgemeine Haltbarkeit oder sichere Endalkoholstärke aus einer groben Mengenformel ableiten.

## Zeit und Filtration

Extraktions- und Ruhezeiten hängen von Rezeptur und Material ab; vier bis acht Wochen sind keine universelle Mindestpflicht. Filtration entfernt Feststoffe, garantiert aber keine Sterilität. Hochprozentigen Alkohol von Hitze und offenen Flammen fernhalten, nicht auf dem Herd erwärmen oder selbst destillieren.`,
      quiz: [
        {"question":"Was unterscheidet einen Aufgesetzten von Destillation?","options":["Beide erzeugen immer neuen Alkohol","Zutaten ziehen in einer fertigen Alkoholbasis; es wird nicht destilliert","Destillation ist ohne Regeln erlaubt","Aufgesetzter ist automatisch steril"],"correct":1,"explanation":"Die steuer- und lebensmittelrechtlichen Regeln unterscheiden sich. Diese Lektion ersetzt keine behördliche Auskunft."},
        {"question":"Welche Alkoholbasis ist ungeeignet?","options":["Legal gekaufter Trinkalkohol","Technischer oder vergällter Alkohol","Ein klar bezeichnetes Lebensmittel","Ein geprüftes Handelsprodukt"],"correct":1,"explanation":"Nur ausdrücklich für den menschlichen Verzehr geeigneten Alkohol verwenden."},
        {"question":"Was leistet eine einfache Filtration?","options":["Sie beseitigt garantiert alle Keime","Sie entfernt Feststoffe, garantiert aber keine Sterilität","Sie entfernt sämtliches Methanol","Sie macht jede Pflanze essbar"],"correct":1,"explanation":"Haltbarkeit und Sicherheit hängen von Rezeptur, Verarbeitung und Lagerung ab."},
      ],
    },

    // ─── Lektion 19 ──────────────────────────────────────────
    {
      title: "Likör als Digestif und Aperitif",
      content: `## Begriffe der Esskultur

**Aperitif** heißt im gastronomischen Sprachgebrauch ein Getränk vor dem Essen, **Digestif** eines nach dem Essen. Diese Namen beschreiben Zeitpunkt und Tradition, keine nachgewiesene Gesundheitswirkung.

## Keine Verdauungszusage

Ein alkoholischer Kräuterlikör ist **kein Verdauungsmedikament**. Aus einem bitteren Geschmack oder der Aktivierung von Bitterrezeptoren folgt keine gesundheitliche Wirksamkeit des fertigen Getränks. Ein kontrollierter Versuch mit Käsefondue zeigte sogar langsamere Magenentleerung bei Wein beziehungsweise Schnaps; er belegt allerdings nicht dieselbe Wirkung für jede Mahlzeit und jeden Likör. Beschwerden gehören bei Bedarf medizinisch abgeklärt.

## Geschmack und Servierweise

Bittere Kräuterstile, fruchtige Liköre und Cremeliköre werden je nach Produkt zu verschiedenen Anlässen angeboten. Ob gekühlt, auf Eis oder bei Raumtemperatur, richtet sich nach Herstellerhinweisen und persönlicher Vorliebe. Eine Gefrierfachtemperatur von -18 °C ist keine pauschale Empfehlung für alle Limoncelli und garantiert nicht, dass jedes Produkt flüssig bleibt. Getränke nicht flambieren.

## Kategorien auseinanderhalten

**Aperol** ist eine süß-bittere Aperitif-Zutat; die verbreitete Abfüllung mit 11 % Vol. erfüllt nicht allein die allgemeine EU-Likörgrenze von 15 % Vol. **Lillet** ist ein weinbasierter Aperitif, kein Spirituosenlikör. **Negroni** und **Spritz** sind Cocktailbeispiele mit eigenen Rezepturen. Weniger Alkohol oder Zucker macht ein alkoholisches Getränk nicht gesund; die DGE empfiehlt den Verzicht.`,
      quiz: [
        {"question":"Was bedeuten Aperitif und Digestif hier?","options":["Eine Arzneimittelzulassung","Getränk vor beziehungsweise nach dem Essen, nicht eine medizinische Wirkung","Eine sichere Trinkmenge","Eine garantierte Magenentleerung"],"correct":1,"explanation":"Die Begriffe bezeichnen eine kulturelle Verwendung. Sie belegen keine Verdauungsverbesserung."},
        {"question":"Welche Serviertemperatur gilt für Limoncello?","options":["Immer exakt -18 °C","Die passende Produktangabe und persönliche Servierpräferenz, keine pauschale -18-°C-Pflicht","Immer 40 °C","Temperatur ist gesetzlich identisch"],"correct":1,"explanation":"Rezeptur und Alkohol-/Zuckergehalt variieren; nicht jedes Produkt bleibt im Gefrierfach flüssig."},
        {"question":"Welche Zutat gehört zum Aperol Spritz?","options":["Nur Lillet und Wasser","Aperol zusammen mit Prosecco und Soda","Cassis und Rotwein","Whiskey und Sahne"],"correct":1,"explanation":"Das IBA-Rezept beschreibt diese Zutaten. Cocktailname und EU-Spirituosenkategorie sind unterschiedliche Dinge."},
      ],
    },

    // ─── Lektion 20 ──────────────────────────────────────────
    {
      title: "Trends und Zukunft der Likörwelt",
      content: `## Entwicklungen ohne erfundene Marktprognose

Neue Cocktailanwendungen, botanische Zutaten und alkoholfreie Alternativen erweitern das Angebot. Ohne datierte und nachvollziehbare Erhebung werden hier keine globalen Marktgrößen, Wachstumsraten oder Ranglisten angegeben.

## Weniger Zucker ist rechtlich begrenzt

**Likör** ist eine definierte EU-Kategorie: grundsätzlich mindestens 100 g/l Zucker als Invertzucker und mindestens 15 % Vol., mit spezifischen Ausnahmen und eigenen Unterkategorien. Ein Produkt mit 80 g/l kann nicht allein wegen des Trends 'Low Sugar' als gewöhnlicher Likör bezeichnet werden. Die 80-g-Ausnahme betrifft bestimmte Enzian-, vergleichbare Pflanzen- oder Wermutliköre. Alkoholfreie Alternativen sind nicht selbst Spirituosenliköre.

## Herkunft und Transparenz

Lokale Zutaten, offene Herstellungsangaben und nachvollziehbare Allergeninformationen können bei der Auswahl helfen. 'Craft', 'Single Origin' oder 'Farm to Bottle' sind keine automatische Qualitäts- oder Gesundheitsgarantie. Bei proprietären Rezepturen dürfen Einzelheiten nicht erfunden werden.

## Technik und Umwelt

Alternative Extraktionsverfahren können eine andere Prozessführung erlauben. Sie liefern nicht automatisch Sterilität, dieselbe Qualität oder eine feste Zeiteinsparung. Die Verwendung eines Nebenprodukts als Rohstoff beweist keine vollständig abfallfreie oder CO₂-neutrale Produktion; belastbare Umweltbehauptungen benötigen eine Bilanz und klaren Geltungsbereich.`,
      quiz: [
        {"question":"Wann darf ein Produkt mit 80 g/l Zucker als Likör eingeordnet werden?","options":["Immer bei der Aufschrift Craft","Wenn es eine konkrete gesetzliche Ausnahme wie Enzian-/vergleichbaren Pflanzen- oder Wermutlikör erfüllt","Wenn es teuer ist","Bei jedem Fruchtlikör"],"correct":1,"explanation":"Eine beliebige Low-Sugar-Rezeptur erfüllt nicht automatisch die allgemeine 100-g/l-Likördefinition."},
        {"question":"Was beweist eine neue Extraktionstechnik allein?","options":["Immer dieselbe Zeiteinsparung","Weder Sterilität noch automatisch höhere Qualität","Kein Alkoholrisiko","Ein gesundes Getränk"],"correct":1,"explanation":"Prozess und Ergebnis müssen für die konkrete Rezeptur geprüft werden."},
        {"question":"Was bedeutet die Verwendung von Lebensmittel-Nebenprodukten?","options":["Automatische CO₂-Neutralität","Sie kann Rohstoffe weiter nutzen, beweist aber keine völlig abfallfreie Gesamtproduktion","Eine gesetzliche Qualitätsstufe","Garantierte Null-Abfälle"],"correct":1,"explanation":"Umweltaussagen benötigen einen klaren Geltungsbereich und geeignete Daten."},
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════
  // ABSCHLUSSPRÜFUNG — 10 Fragen
  // ═══════════════════════════════════════════════════════════
  finalExam: [
    {
      question:
        "Welcher Mindestzuckergehalt ist für Liköre laut EU-Verordnung 2019/787 vorgeschrieben?",
      options: ["50 g/l", "70 g/l", "100 g/l", "150 g/l"],
      correct: 2,
      explanation:
        "Die EU-Verordnung schreibt 100 g/l als Mindestzuckergehalt vor. Ausnahmen: Kirschlikör mit ausschließlich Kirschbrand als Alkoholbasis (70 g/l) sowie Enzian-/vergleichbare Pflanzen- und Wermutliköre (80 g/l), jeweils als Invertzucker.",
    },
    {
      question:
        "Was ist der fundamentale Unterschied zwischen Mazeration und Destillation bei der Likörherstellung?",
      options: [
        "Mazeration verwendet Wasser, Destillation verwendet Alkohol",
        "Mazeration extrahiert flüchtige und nicht-flüchtige Verbindungen, Destillation nur flüchtige — deshalb sind reine Destillate farblos",
        "Destillation ist immer billiger als Mazeration",
        "Es gibt keinen wesentlichen Unterschied",
      ],
      correct: 1,
      explanation:
        "Mazeration kann flüchtige und nicht-flüchtige Komponenten extrahieren. Destillation überträgt flüchtige Komponenten mit dem Dampf; sie trennt Gemische nicht nach einer einfachen Reinstoff-Siedepunktgrenze. Daher sind reine Destillate farblos.",
    },
    {
      question:
        "Welche chemische Verbindung erzeugt den Ouzo-Effekt (Louche)?",
      options: [
        "Thujon",
        "Anethol",
        "Glycyrrhizin",
        "Limonen",
      ],
      correct: 1,
      explanation:
        "Anethol ist in Alkohol löslich, aber wasserunlöslich. Bei Verdünnung fällt es als milchig-weiße Emulsion aus — der Ouzo-Effekt.",
    },
    {
      question:
        "Welche Aussage zu Mandelaromen und Amaretto ist wichtig?",
      options: [
        "Aprikosenkerne sind günstiger und haben keinen Geschmack",
        "Mandelaroma allein beweist keine konkrete Zutat; Hersteller- und Allergeninformationen prüfen",
        "Mandeln sind in Italien verboten",
        "Aprikosenkerne haben mehr Alkohol",
      ],
      correct: 1,
      explanation:
        "Die konkrete Rezeptur variiert. Bittere Aprikosenkerne und Bittermandeln können giftige Blausäure freisetzen und sind keine bedenkenlose Heimansatz-Zutat.",
    },
    {
      question:
        "Welche Aussage zur Emulsion eines Sahnelikörs stimmt?",
      options: [
        "10–20 bar",
        "50–80 bar",
        "Rezeptur und Prozessführung müssen für das Produkt abgestimmt sein.",
        "500–1000 bar",
      ],
      correct: 2,
      explanation:
        "Homogenisierung kann die Emulsion unterstützen. Ein universeller Druckbereich oder eine garantierte Stabilität für alle Rezepturen folgt daraus nicht.",
    },
    {
      question:
        "Welcher Cocktail besteht aus gleichen Teilen Gin, Grüne Chartreuse, Maraschino und Limettensaft?",
      options: [
        "Negroni",
        "Last Word",
        "Paper Plane",
        "Corpse Reviver No. 2",
      ],
      correct: 1,
      explanation:
        "Der Last Word ist ein Equal-Parts-Cocktail mit gleichen Teilen Gin, grüner Chartreuse, Maraschino und Limettensaft.",
    },
    {
      question:
        "Was bedeutet V.E.P. bei Chartreuse-Abfüllungen?",
      options: [
        "Vin et Plaisir",
        "Vieillissement Exceptionnellement Prolongé (außergewöhnlich verlängerte Reifung)",
        "Variété Extra Premium",
        "Version Exclusive Privée",
      ],
      correct: 1,
      explanation:
        "V.E.P. steht für Vieillissement Exceptionnellement Prolongé — diese Chartreuse-Varianten werden besonders lange in Eichenholzfässern gereift und erzielen Sammlerpreise.",
    },
    {
      question:
        "Was bedeutet die traditionelle Bezeichnung Digestif?",
      options: [
        "Sie erzeugen ein Sättigungsgefühl",
        "Ein Getränk nach dem Essen, ohne zugesicherte Verdauungswirkung",
        "Sie blockieren die Alkoholaufnahme",
        "Sie neutralisieren den Zuckergehalt",
      ],
      correct: 1,
      explanation:
        "Die kulturelle Bezeichnung Digestif ist kein Nachweis einer Verdauungswirkung. Alkohol kann die Magenentleerung verlangsamen; daraus folgt keine Behandlungsempfehlung.",
    },
    {
      question:
        "Welche Aussage zu neuen Extraktionsverfahren stimmt?",
      options: [
        "Sie erzeugt Ultraschall-Aromen",
        "Die Prozesswirkung ist rezeptabhängig und beweist nicht automatisch Sterilität oder höhere Qualität",
        "Sie entfernt unerwünschte Bitterstoffe",
        "Sie erhöht den Alkoholgehalt",
      ],
      correct: 1,
      explanation:
        "Technik muss für Rezeptur und Zielstoffe geprüft werden; eine allgemeine Zeiteinsparung oder Sicherheitsgarantie wird nicht behauptet.",
    },
    {
      question:
        "Welche EU-Anforderungen gelten für Eierlikör?",
      options: [
        "Keine speziellen Anforderungen",
        "Mindestens 140 g Eigelb und 150 g Zucker pro Liter bei mind. 14 % Vol.",
        "Mindestens 50 g Eigelb pro Liter",
        "Nur dass er Eier enthalten muss",
      ],
      correct: 1,
      explanation:
        "Die EU schreibt für Eierlikör mindestens 140 g Eigelb und 150 g Zucker pro Liter vor, bei einem Mindestalkoholgehalt von 14 % Vol.",
    },
  ],
};
