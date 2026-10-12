import type { Course } from "./akademie";

export const whiskyKurs: Course = {
  slug: "whiskey",
  title: "Whisky & Whiskey",
  icon: "\uD83E\uDD43",
  image: "/images/akademie/whiskey.png",
  description:
    "Von Scotch Single Malt bis Bourbon, von Pot Still bis Fassreifung — Herstellung, Sensorik, Cocktails und Investition auf Experten-Niveau.",
  color: "from-amber-800 to-yellow-900",
  difficulty: "Fortgeschritten",
  duration: "ca. 120 Min.",
  lessons: [
    // ═══════════════════════════════════════════════════════════
    // Lektion 1
    // ═══════════════════════════════════════════════════════════
    {
      title: "Was ist Whisky? Definition und Grundlagen",
      content: `## Whisky — Eine Spirituose mit klaren Regeln

**Whisky / Whiskey** wird aus vergorenem Getreide gewonnen. Welche Destillations-, Lager- und Kennzeichnungsvorgaben gelten, hängt von Land und Kategorie ab; die häufige Holzreifung ist keine ausnahmslose weltweite Regel.

## Die grundlegenden Merkmale

Whisky ist eine Spirituosenfamilie aus vergorenem Getreide. Getreidesorte, Mälzung, Gärung, Destillation und Lagerung prägen den Charakter. **Rechtsvorgaben sind land- und kategorienabhängig**: Scotch muss in Eiche reifen, US-Corn-Whiskey kann ungealtert sein. Eine weltweit identische Holz- oder Mindestreiferegel gibt es deshalb nicht.

## Whisky vs. Whiskey — Der Unterschied

**Whisky** und **Whiskey** sind Schreibkonventionen, keine Qualitätsstufen. Scotch wird üblicherweise „Whisky“, Irish üblicherweise „Whiskey“ geschrieben; in den USA existieren beide Varianten, beispielsweise bei Maker’s Mark und George Dickel. Eine angeblich eindeutige historische Abgrenzung von „schlechtem Scotch“ ist keine gesicherte Erklärung.

## Gesetzliche Definitionen im Vergleich

**Scotch Whisky** muss unter anderem in Schottland aus Getreide, Wasser und Hefe hergestellt, bei **unter 94,8 % Vol.** destilliert und dort mindestens **3 Jahre in Eichenfässern von höchstens 700 Litern** gereift werden. Abfüllstärke: mindestens **40 % Vol.** **US-Bourbon** benötigt mindestens 51 % Mais, Destillation höchstens 80 % Vol. und neue ausgebrannte Eichenfässer; beim Einfüllen höchstens 62,5 % Vol. Eine bestimmte Eichenart oder Kentucky als Herkunft ist nicht vorgeschrieben. Weitere Länder haben eigene geschützte Kategorien und Standards.

## Die Bedeutung des Alkoholgehalts

**New Make Spirit** ist das noch nicht gereifte Destillat. Einfüll- und Abfüllstärken sind betriebs- und kategorienabhängig. Für Scotch beträgt die Mindestabfüllstärke 40 % Vol.; Fassstärke bedeutet dort keine Anpassung der Stärke nach der Reifung. Verdünnung entfernt nicht die bereits eingeschenkte Alkoholmenge.

## Whisky als Kulturgut

Whisky hat unterschiedliche regionale Traditionen und Produktionsweisen. Exportwerte und Marktanteile ändern sich; ohne Bezugsjahr und aktuelle Primärstatistik werden sie nicht als allgemeingültige Zahlen genannt. Geschmackswissen ist keine Aufforderung zum Konsum und begründet keine sichere Alkoholmenge.`,
      quiz: [
        {
          "question": "Wie lange muss Scotch Whisky mindestens in Eichenfässern reifen?",
          "options": [
            "1 Jahr",
            "2 Jahre",
            "3 Jahre",
            "5 Jahre"
          ],
          "correct": 2,
          "explanation": "Scotch Whisky muss per Gesetz mindestens 3 Jahre in Eichenfässern in Schottland reifen."
        },
        {
          "question": "Welches Getreide muss in Bourbon zu mindestens 51 % enthalten sein?",
          "options": [
            "Gerste",
            "Roggen",
            "Weizen",
            "Mais"
          ],
          "correct": 3,
          "explanation": "Bourbon muss laut US-Gesetz aus mindestens 51 % Mais hergestellt werden und in neuen, ausgebrannten Eichenfässern reifen."
        },
        {
          "question": "Was bedeutet die Schreibweise „Whisky“ oder „Whiskey“?",
          "options": [
            "Sie garantiert ein Mindestalter von 12 Jahren",
            "Sie folgt regionalen und herstellerspezifischen Konventionen, nicht einer Qualitätsregel",
            "Mit e ist immer höherwertig",
            "Ohne e ist immer ungetorft"
          ],
          "correct": 1,
          "explanation": "Die Schreibweise ist eine Konvention mit Ausnahmen. Sie belegt weder Qualität noch Gär-, Destillations- oder Reifungsverfahren."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 2
    // ═══════════════════════════════════════════════════════════
    {
      title: "Die Geschichte des Whiskys",
      content: `## Von der Klosterdestillation zur Weltspirituose

Die Geschichte des Whiskys reicht über **500 Jahre** zurück und ist eng verwoben mit Religion, Steuerpolitik, Prohibition und globalem Handel. Die Ursprünge liegen im Dunkel der Geschichte, doch die dokumentierte Entwicklung erzählt eine faszinierende Geschichte von Innovation und Widerstand.

## Die frühesten Aufzeichnungen

Die schottischen Exchequer Rolls enthalten **1494** einen bekannten frühen Beleg: Malz für Friar John Cor zur Herstellung von aqua vitae. Das ist ein Beleg für Destillation in Schottland, nicht der Nachweis, dass damals weltweit erstmals Whisky entstand. Geschichten über eine genaue Einführung durch irische Mönche im 6. Jahrhundert werden ohne zeitgenössischen Nachweis nicht als Fakt erzählt.

## Das Zeitalter der illegalen Brenner

Ab dem **17. Jahrhundert** begannen die britischen Regierungen, hohe Steuern auf Spirituosen zu erheben. Dies führte zu einer **Blütezeit des Schwarzbrennens**, besonders in den schottischen Highlands. Tausende kleine illegale Brennereien produzierten Whisky in abgelegenen Tälern und Höhlen. Die **Excise Men** (Steuereintreiber) lieferten sich einen erbitterten Kampf mit den Schmugglern. Erst der **Excise Act von 1823** legalisierte die Kleinbrennerei durch erschwingliche Lizenzen — ein Wendepunkt in der Geschichte.

## Die Erfindung des Blended Whisky

Die Entwicklung kontinuierlicher Brennapparate, besonders der Coffey Still im frühen 19. Jahrhundert, erleichterte die Herstellung von Grain Whisky. Blending verbindet verschiedene Destillate zu einem Zielprofil. Die Geschichte lässt sich nicht auf einen einzigen Moment reduzieren; Malt- und Grain-Komponenten sind bei Blended Scotch rechtlich definierte Bestandteile.

## Prohibition und die Folgen

Die amerikanische **Prohibition (1920-1933)** vernichtete fast die gesamte US-Whiskey-Industrie. Nur wenige Destillerien überlebten mit Lizenzen zur Herstellung von "medizinischem Whiskey". In Schottland und Irland brachen wichtige Exportmärkte weg. Kanada profitierte als Whisky-Lieferant für den Schmuggel. Nach der Aufhebung der Prohibition musste die Industrie praktisch bei Null beginnen.

## Die Whisky-Renaissance ab den 1990ern

In den vergangenen Jahrzehnten wurden Single Malts, unabhängige Abfüllungen und neue Produktionsländer bekannter. Nachfrage und Sammlerpreise verlaufen jedoch nicht ständig aufwärts. Datierte Entwicklungen dürfen nicht als dauerhafte „goldene Zeit“ oder Renditegarantie verstanden werden.`,
      quiz: [
        {
          "question": "Aus welchem Jahr stammt der bekannte frühe schottische Exchequer-Rolls-Beleg für Destillation?",
          "options": [
            "1294",
            "1494",
            "1694",
            "1823"
          ],
          "correct": 1,
          "explanation": "Der Eintrag von 1494 erwähnt Malz für Friar John Cor zur Herstellung von aqua vitae. Er ist ein schottischer Beleg, keine weltweite Ersterfindung."
        },
        {
          "question": "Welches Ereignis half Scotch Whisky, den Weltmarkt zu erobern?",
          "options": [
            "Die Erfindung der Glasflasche",
            "Die Reblaus-Epidemie, die Cognac knapp machte",
            "Die Entdeckung Amerikas",
            "Die industrielle Revolution"
          ],
          "correct": 1,
          "explanation": "Die Reblaus vernichtete ab 1860 europäische Weinberge und damit die Cognac-Produktion. Scotch Blended Whisky füllte diese Marktlücke."
        },
        {
          "question": "Was bewirkte der Excise Act von 1823?",
          "options": [
            "Verbot jeglicher Whisky-Produktion",
            "Einführung der Mindest-Reifezeit",
            "Legalisierung der Kleinbrennerei durch erschwingliche Lizenzen",
            "Gründung der Scotch Whisky Association"
          ],
          "correct": 2,
          "explanation": "Der Excise Act von 1823 machte legale Brennerei-Lizenzen erschwinglich und beendete damit die Ära des massenhaften Schwarzbrennens in Schottland."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 3
    // ═══════════════════════════════════════════════════════════
    {
      title: "Scotch Single Malt — Regionen und Stile",
      content: `## Die Kronjuwelen des schottischen Whiskys

**Single Malt Scotch Whisky** wird aus Wasser und gemälzter Gerste in Pot Stills einer einzigen schottischen Brennerei hergestellt und mindestens drei Jahre in Schottland in Eichenfässern gereift. Rechtlich geschützt sind die Herkunftsbezeichnungen **Highland, Lowland, Speyside, Islay und Campbeltown**. Sensorische Regionalbilder sind nicht mit einer gesetzlichen Geschmacksanforderung gleichzusetzen.

## Die Speyside — Das Herz des Whiskys

**Speyside** liegt im Nordosten Schottlands und gehört zu den geschützten Herkunftsregionen. Glenfiddich, Glenlivet, Macallan und Aberlour sind bekannte Beispiele. Fruchtige oder süß wirkende Stilbilder sind Orientierung, keine verbindliche Eigenschaft jeder Abfüllung und keine aktuelle Verkaufsrangliste.

## Die Highlands — Vielfalt pur

Die **Highlands** sind die größte Region und zeigen enorme Stilvielfalt. **Nördliche Highlands** (Glenmorangie, Dalmore): Oft fruchtig und komplex. **Östliche Highlands** (GlenDronach, Royal Lochnagar): Vollmundig, oft sherryig. **Westliche Highlands** (Oban, Ben Nevis): Maritime Einflüsse, leicht salzig. **Südliche Highlands** (Aberfeldy, Edradour): Milder, zugänglicher. Die geographische Weite sorgt dafür, dass "Highland Malt" kein einheitlicher Stil ist.

## Islay — Die Torf-Insel

**Islay** ist eine geschützte Herkunftsbezeichnung. Laphroaig, Ardbeg und Lagavulin sind bekannte Beispiele für torfgeprägte Abfüllungen, Bruichladdich produziert auch ungetorfte Whiskys. „Islay“ bedeutet deshalb nicht automatisch „rauchig“. Eine aktuelle Zahl aktiver Brennereien wird nicht als dauerhaftes Lernziel festgeschrieben.

## Lowlands und Campbeltown

**Lowland** und **Campbeltown** sind ebenfalls geschützt. Leichte Lowland-Stilbilder haben Ausnahmen. Springbank, Glen Scotia und Glengyle sind mit Campbeltown verbunden; die Region wird nicht durch eine unveränderliche heutige Betriebszahl definiert.

## Die Inseln (Islands)

**Islands** ist keine sechste geschützte Scotch-Herkunftsregion. Inseln außerhalb Islays werden im rechtlichen Regionensystem Highland zugeordnet; genaue Inselnamen können zulässige geografische Angaben sein. Talisker auf Skye, Highland Park auf Orkney und Tobermory auf Mull zeigen verschiedene Profile. Ein Inselname garantiert keinen bestimmten Rauch- oder Salzgeschmack.`,
      quiz: [
        {
          "question": "In welcher geschützten Scotch-Region liegt Glenfiddich?",
          "options": [
            "Speyside",
            "Islay",
            "Campbeltown",
            "Lowland"
          ],
          "correct": 0,
          "explanation": "Glenfiddich liegt in Speyside. Das ist eine Herkunftszuordnung, keine Verkaufs- oder Qualitätsrangliste."
        },
        {
          "question": "Was wird in ppm gemessen?",
          "options": [
            "Der Alkoholgehalt des Destillats",
            "Der Phenolgehalt (Torfrauch) im Malz",
            "Die Fasskapazität",
            "Der Zuckergehalt der Maische"
          ],
          "correct": 1,
          "explanation": "ppm (Parts per Million) misst den Phenolgehalt im Malz, der durch das Darren über Torffeuer entsteht. Islay-Malts können über 50 ppm erreichen."
        },
        {
          "question": "Mit welcher geschützten Herkunft sind Springbank, Glen Scotia und Glengyle verbunden?",
          "options": [
            "Islay",
            "Campbeltown",
            "Dublin",
            "Kentucky"
          ],
          "correct": 1,
          "explanation": "Diese Brennereien sind mit Campbeltown verbunden. Regionale Identität hängt nicht von einer festgeschriebenen aktuellen Brennereizahl ab."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 4
    // ═══════════════════════════════════════════════════════════
    {
      title: "Scotch Blended — Die Kunst des Verschnitts",
      content: `## Blended Scotch — Das Rückgrat der Industrie

**Blended Scotch Whisky** kombiniert einen oder mehrere Single Malt Scotch Whiskys mit einem oder mehreren Single Grain Scotch Whiskys. Er ist ein wichtiger Teil der Branche; ein zeitloser Verkaufsanteil „über 90 %“ wird nicht behauptet. Ein Blend ist nicht automatisch minderwertig.

## Die Rolle des Master Blenders

Der **Master Blender** ist der wichtigste Mensch in einer Blending-Firma. Er oder sie wählt aus Hunderten einzelner Fässer die perfekte Kombination aus. Ein typischer Blend kann **20 bis 50 verschiedene Malt Whiskys** und **3 bis 5 Grain Whiskys** enthalten. Der Master Blender muss sicherstellen, dass jede Flasche identisch schmeckt — eine enorme sensorische Leistung, denn jedes Fass entwickelt sich anders. Berühmte Master Blender wie **Richard Paterson** (Whyte & Mackay) oder **Jim Beveridge** (Johnnie Walker) sind lebende Legenden der Branche.

## Die Anatomie eines Blends

Malt- und Grain-Komponenten tragen unterschiedliche Aromen und Texturen bei. Die **Maltquote allein ist kein objektiver Qualitätsmaßstab**. Der Master Blender beurteilt die Komponenten und ihr Zusammenspiel; das genaue Mischungsverhältnis ist produktabhängig. **Blended Malt** enthält Malt Whiskys mehrerer Brennereien ohne Grain, **Blended Grain** entsprechend Grain Whiskys mehrerer Brennereien.

## Qualitätsstufen

Begriffe wie Standard, Premium oder Super-Premium sind Markt- und Preisbeschreibungen, keine gesetzlich verbindlichen Scotch-Qualitätsstufen. Eine Altersangabe bezieht sich auf die jüngste Komponente, NAS kann verschieden alte Komponenten umfassen. Weder Preis noch Alter garantieren die persönliche Geschmackspräferenz.

## Der wirtschaftliche Stellenwert

Johnnie Walker, Chivas Regal und andere Marken verdeutlichen die Bedeutung des Blendings. Fallzahlen, Umsätze und heutige Komponentenlisten benötigen jeweils aktuelle Hersteller- oder Verbandsdaten; hier werden keine unbefristeten Absatzrekorde gelehrt.`,
      quiz: [
        {
          "question": "Welche Komponenten enthält Blended Scotch Whisky?",
          "options": [
            "Nur Single Malt einer Brennerei",
            "Single Malt und Single Grain Scotch Whisky",
            "Nur neutralen Alkohol ohne Whisky",
            "Ausschließlich Roggendestillat"
          ],
          "correct": 1,
          "explanation": "Die geschützte Kategorie kombiniert Malt und Grain Scotch. Ein nicht datierter Verkaufsanteil ist keine Kategorieanforderung."
        },
        {
          "question": "Was ist ein Blended Malt Whisky?",
          "options": [
            "Ein Whisky aus nur einer Brennerei",
            "Eine Mischung aus Malt und Grain Whisky",
            "Eine Mischung aus Malt Whiskys verschiedener Brennereien ohne Grain",
            "Ein ungelagerter Whisky"
          ],
          "correct": 2,
          "explanation": "Ein Blended Malt (ehemals Vatted Malt) besteht ausschließlich aus Malt Whiskys verschiedener Brennereien, enthält aber keinen Grain Whisky."
        },
        {
          "question": "Welche Aufgabe hat ein Master Blender?",
          "options": [
            "Er baut die Destillierblasen",
            "Er wählt und kombiniert verschiedene Whiskys zu einem konsistenten Blend",
            "Er verkauft den Whisky im Handel",
            "Er kontrolliert die Wasserqualität"
          ],
          "correct": 1,
          "explanation": "Der Master Blender wählt aus Hunderten Fässern die perfekte Kombination, um ein konsistentes Geschmacksprofil zu erzeugen."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 5
    // ═══════════════════════════════════════════════════════════
    {
      title: "Irish Whiskey — Dreifach destilliert",
      content: `## Die sanfte Seele der grünen Insel

**Irish Whiskey** erlebt eine spektakuläre Renaissance. Von nur **zwei aktiven Brennereien** in den 1980ern (Midleton und Bushmills) ist die Zahl auf über **40** angestiegen. Irish Whiskey ist der am **schnellsten wachsende** Spirituosenmarkt weltweit und zeichnet sich durch seine typische Sanftheit und Zugänglichkeit aus.

## Die dreifache Destillation

Viele irische Pot-Still- und Malt-Whiskeys werden dreifach destilliert; das ist **keine ausnahmslose Pflicht für jeden Irish Whiskey**. Doppelte Destillation kommt ebenfalls vor. Häufig als weich beschriebene Profile sind sensorische Eindrücke, keine Qualitätsgarantie.

## Die Pot-Still-Tradition

**Pot Still Irish Whiskey** verwendet eine Mischung aus gemälzter und ungemälzter Gerste und wird in Pot Stills destilliert. **Single** bedeutet Herstellung in einer Brennerei. Die genaue Getreideschüttung muss der geschützten Spezifikation entsprechen; Geschmackseindrücke wie Würze oder Cremigkeit sind davon zu unterscheiden.

## Die großen Marken und ihre Geschichte

Jameson, Bushmills, Redbreast und Teeling stehen für verschiedene irische Whiskey-Traditionen. Die Jahreszahl **1608** bei Bushmills verweist auf eine historische Lizenz in der Region und ist nicht automatisch der Nachweis, dass die heutige Brennerei seither ununterbrochen existiert. Aktuelle Absatz- oder Wachstumsranglisten werden nicht festgeschrieben.

## Der Niedergang und die Wiedergeburt

Die irische Branche erlebte einen langen Rückgang und später neue Gründungen. Kriege, Handel und Prohibition gehören zum historischen Umfeld. Eine pauschale Behauptung, alle irischen Produzenten hätten Column Stills abgelehnt, wäre falsch. Heutige Betriebszahlen oder ein einziges feste Zahlensnapshot für die gesamten 1980er Jahre werden nicht gelehrt.`,
      quiz: [
        {
          "question": "Ist dreifache Destillation eine Pflicht für jeden Irish Whiskey?",
          "options": [
            "Ja, ohne Ausnahme",
            "Nein, sie ist verbreitet, aber andere Verfahren sind ebenfalls möglich",
            "Nur außerhalb Irlands",
            "Irish Whiskey wird gar nicht destilliert"
          ],
          "correct": 1,
          "explanation": "Dreifache Destillation ist eine bekannte Tradition, aber keine universelle Vorschrift der gesamten Kategorie."
        },
        {
          "question": "Was ist Single Pot Still Whiskey?",
          "options": [
            "Whiskey nur aus gemälzter Gerste",
            "Whiskey aus gemälzter und ungemälzter Gerste, in Pot Stills einer einzigen Brennerei",
            "Whiskey aus Mais",
            "Whiskey aus nur einem Fass"
          ],
          "correct": 1,
          "explanation": "Pot Still Irish Whiskey verwendet gemälzte und ungemälzte Gerste. „Single“ kennzeichnet die Herkunft aus einer Brennerei; weitere Vorgaben folgen der geschützten Spezifikation."
        },
        {
          "question": "Warum sind pauschale historische Erklärungen für den Rückgang einer Branche problematisch?",
          "options": [
            "Weil Geschichte nie untersucht werden kann",
            "Weil wirtschaftliche, politische und technische Faktoren zusammenwirkten",
            "Weil alle Produzenten stets identische Entscheidungen trafen",
            "Weil nur die Glasform wichtig war"
          ],
          "correct": 1,
          "explanation": "Die Branchenentwicklung lässt sich nicht mit einer universellen Ablehnung einer Technik oder einer unbefristeten Betriebszahl erklären."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 6
    // ═══════════════════════════════════════════════════════════
    {
      title: "Bourbon — Amerikanischer Klassiker",
      content: `## America's Native Spirit

**Bourbon** ist eine geschützte US-Whiskey-Kategorie und muss in den USA destilliert und gereift werden. Kentucky besitzt eine wichtige Tradition, ist aber nicht die einzige zulässige Herkunft. Bourbon ist auch nicht die einzige Spirituose mit geschütztem Herkunftsbezug.

## Die gesetzlichen Anforderungen

Nach US-Standard gelten unter anderem: mindestens **51 % Mais**, Destillation bei höchstens **80 % Vol.**, neue ausgebrannte **Eichenfässer**, Einfüllen bei höchstens **62,5 % Vol.** und Abfüllung bei mindestens **40 % Vol.** Für Bourbon ist keine bestimmte Eichenart vorgeschrieben; amerikanische Weißeiche ist verbreitete Praxis. **Straight Bourbon** benötigt mindestens zwei Jahre Lagerung. Bourbon erlaubt nach diesem Standard keine zugesetzten Farb- oder Aromastoffe.

## Die Mashbill — Das Geheimnis des Geschmacks

Die **Mashbill** (Getreidemischung) bestimmt den Charakter des Bourbon. **High-Corn** (70-80 % Mais): Süßer, weicher (z.B. Maker's Mark). **High-Rye** (15-35 % Roggen): Würziger, trockener (z.B. Four Roses, Bulleit). **Wheated** (Weizen statt Roggen): Weicher, süßer, runder (z.B. Maker's Mark, Pappy Van Winkle, W.L. Weller). Die restlichen 5-15 % sind fast immer **gemälzte Gerste**, die die notwendigen Enzyme zur Verzuckerung liefert.

## Kentucky — Das Bourbon-Paradies

Kentucky bietet viele bekannte Bourbon-Brennereien und eine ausgeprägte Besuchskultur. Temperaturwechsel und Lagerhausbedingungen beeinflussen den Fasseinfluss; sie erzeugen aber keinen universellen Umrechnungsfaktor für das Alter. Produktionsanteile, Fassbestände und Mitgliedschaften in touristischen Routen sind aktuell beim Anbieter zu prüfen.

## Die legendären Destillerien

Jim Beam, Maker’s Mark, Buffalo Trace, Wild Turkey, Four Roses und Woodford Reserve sind Beispiele für unterschiedliche Produktions- und Markenprofile. Wer einen Besuch plant, prüft direkt beim Betrieb Öffnung, Buchung und Zugänglichkeit; eine heutige Rangfolge oder Tourmitgliedschaft wird hier nicht versprochen.`,
      quiz: [
        {
          "question": "Muss Bourbon aus Kentucky stammen?",
          "options": [
            "Ja, das ist gesetzlich vorgeschrieben",
            "Nein, er muss nur in den USA hergestellt werden",
            "Ja, aber nur Straight Bourbon",
            "Nein, er kann aus jedem Land stammen"
          ],
          "correct": 1,
          "explanation": "Bourbon muss nur in den USA hergestellt werden. Der Kentucky-Mythos rührt daher, dass über 95 % dort produziert werden."
        },
        {
          "question": "In welchen Fässern muss Bourbon reifen?",
          "options": [
            "Gebrauchte Sherryfässer",
            "Neue, ausgebrannte Eichenfässer",
            "Gebrauchte Bourbonfässer",
            "Edelstahltanks"
          ],
          "correct": 1,
          "explanation": "Bourbon muss per Gesetz in neuen, ausgebrannten (charred) Eichenfässern aus amerikanischer Weißeiche reifen. Diese können danach nur einmal für Bourbon verwendet werden."
        },
        {
          "question": "Was ist ein 'Wheated Bourbon'?",
          "options": [
            "Bourbon mit Weizenmalz als Hauptgetreide",
            "Bourbon, bei dem Weizen statt Roggen als Sekundärgetreide verwendet wird",
            "Bourbon aus Europa",
            "Bourbon mit Weizenstroh-Filtration"
          ],
          "correct": 1,
          "explanation": "Bei Wheated Bourbon wird Weizen statt Roggen als Sekundärgetreide verwendet, was den Whiskey weicher und süßer macht. Beispiele: Maker's Mark, Pappy Van Winkle."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 7
    // ═══════════════════════════════════════════════════════════
    {
      title: "Tennessee Whiskey und Rye",
      content: `## Tennessee Whiskey — Mehr als nur Bourbon aus Tennessee

**Tennessee Whiskey** ist mit der Produktion in Tennessee und bei bekannten Herstellern mit dem **Lincoln County Process** verbunden: Filtration durch Ahornholzkohle vor der Fassreifung. Es gibt gesetzliche Sonderfälle; „ausnahmslos jeder Tennessee Whiskey wird so filtriert“ ist deshalb zu absolut. Die US-Grundregeln für die jeweilige Whiskey-Kategorie bleiben zu beachten.

## Jack Daniel's — Der Gigant

**Jack Daniel’s** in Lynchburg steht für Ahornholzkohle-Filtration und neue ausgebrannte Eichenfässer. Heutige Absatzrekorde und eine pauschale Aussage, in einem „dry county“ sei keinerlei Verkauf möglich, werden nicht übernommen; konkrete Besuchs- und Verkaufsregeln sind beim Betrieb zu prüfen.

## George Dickel — Die Alternative

**George Dickel** ist eine bekannte Tennessee-Marke mit der Schreibweise „Whisky“. Herstellerspezifische Filtration und Kühlung sind Prozessentscheidungen, kein objektiver Beleg dafür, dass Kenner diese Marke grundsätzlich bevorzugen. Eine genaue Betriebstemperatur wird hier nicht ohne Produktbeleg vorgegeben.

## Rye Whiskey — Das würzige Comeback

Für **US-Rye Whiskey** gilt eine Schüttung mit mindestens 51 % Roggen, Destillation bei höchstens 80 % Vol. und Lagerung in neuen ausgebrannten Eichenfässern bei höchstens 62,5 % Vol. Einfüllstärke. Würzige oder pfeffrige Eindrücke sind häufige sensorische Beschreibungen, nicht bei jeder Flasche garantiert. Kanadischer „Rye“ folgt anderen Standards.

## Wichtige Rye-Marken

Rittenhouse, Bulleit, WhistlePig, Sazerac, Pikesville und High West sind Beispiele für Rye-Marken oder Abfüllungen. Stärke, Rohstoffanteile, Herstellungsort und Alter sind am konkreten Produkt zu prüfen. Rye kann in Manhattan, Old Fashioned und weiteren Cocktailrezepten verwendet werden; eine unbefristete zweistellige Wachstumsrate wird nicht behauptet.

## Weitere amerikanische Whiskey-Stile

**US-Corn Whiskey** benötigt mindestens 80 % Mais und kann **ungealtert** sein. Falls er gelagert wird, gelten gebrauchte oder neue, nicht ausgebrannte Eichenfässer und die einschlägigen Stärkegrenzen. **Wheat Whiskey** und **Malt Whiskey** besitzen eigene US-Standards. Ein ungelagertes Getreidedestillat oder „Moonshine“ erfüllt nicht automatisch die europäischen Whisky-Anforderungen oder die Scotch-Definition.`,
      quiz: [
        {
          "question": "Welches Verfahren ist für bekannte Tennessee-Whiskey-Hersteller typisch?",
          "options": [
            "Er wird aus Roggen hergestellt",
            "Die Filtration durch Ahornholzkohle (Lincoln County Process)",
            "Er reift in gebrauchten Fässern",
            "Er wird nicht destilliert"
          ],
          "correct": 1,
          "explanation": "Die Filtration durch Ahornholzkohle vor der Reifung heißt Lincoln County Process. Bekannte Hersteller setzen sie ein; gesetzliche Sonderfälle verhindern eine pauschale Aussage für jeden Betrieb."
        },
        {
          "question": "Welches Getreide verlangt der US-Standard für Rye Whiskey zu mindestens 51 %?",
          "options": [
            "Mais",
            "Weizen",
            "Roggen",
            "Gerste"
          ],
          "correct": 2,
          "explanation": "Rye Whiskey muss per Gesetz mindestens 51 % Roggen in der Mashbill enthalten, was ihm seinen charakteristisch würzigen, pfeffrigen Geschmack verleiht."
        },
        {
          "question": "Warum erlebt Rye Whiskey seit den 2000ern ein Comeback?",
          "options": [
            "Weil er billiger als Bourbon ist",
            "Wegen der Cocktail-Renaissance und der Nachfrage nach würzigem Charakter",
            "Weil er weniger Alkohol enthält",
            "Weil er schneller reift"
          ],
          "correct": 1,
          "explanation": "Die Cocktail-Renaissance brachte klassische Rye-Drinks wie Manhattan und Sazerac zurück, was die Nachfrage nach dem würzigen Charakter von Rye Whiskey stark steigerte."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 8
    // ═══════════════════════════════════════════════════════════
    {
      title: "Japanischer Whisky — Östliche Perfektion",
      content: `## Die unerwartete Whisky-Supermacht

**Japanischer Whisky** hat in den letzten zwei Jahrzehnten die Whisky-Welt revolutioniert und Preise bei internationalen Wettbewerben gewonnen, die einst ausschließlich an schottische Destillerien gingen. Die Geschichte beginnt mit einem Mann: **Masataka Taketsuru**, der 1918 nach Schottland reiste, um die Kunst des Whisky-Brennens zu erlernen.

## Die Gründerväter

**Masataka Taketsuru** studierte Chemie an der University of Glasgow, arbeitete in schottischen Brennereien und heiratete die Schottin **Jessie Roberta "Rita" Cowan**. Zurück in Japan gründete er zunächst zusammen mit **Shinjiro Torii** die **Yamazaki-Brennerei** (1923), Japans erste. Differenzen über den Stil führten zur Trennung: Torii behielt Yamazaki und baute **Suntory** auf, Taketsuru zog nach **Hokkaido** und gründete **Nikka** mit der **Yoichi-Brennerei** (1934). Diese beiden Häuser dominieren bis heute die japanische Whisky-Landschaft.

## Die Philosophie: Perfektion im Detail

Japanische Hersteller können innerhalb einer Brennerei mit unterschiedlichen Hefen, Brennapparaten und Fässern verschiedene Profile erzeugen. Das unterstützt eigenes Blending. Historisch war der Fasshandel zwischen Konkurrenten weniger verbreitet als in Schottland; daraus folgt nicht, dass Austausch oder Zusammenarbeit heute nie vorkommen.

## Die wichtigsten Brennereien

**Suntory** betreibt: **Yamazaki** (bei Osaka, seit 1923) — komplex, fruchtig, oft in japanischer Mizunara-Eiche gereift. **Hakushu** (in den japanischen Alpen) — frisch, grün, kräuterig, leicht rauchig. **Chita** (Grain-Whisky-Destillerie). **Nikka** betreibt: **Yoichi** (Hokkaido) — kräftig, torfig, rauchig, maritim (dem schottischen Stil am nächsten). **Miyagikyo** (Sendai) — elegant, fruchtig, blumig. Weitere: **Mars Shinshu**, **Chichibu** (von Ichiro Akuto, der "Rockstar" der japanischen Whisky-Szene), **White Oak Akashi**, **Fuji Gotemba**.

## Mizunara — Das flüsternde Holz

**Mizunara** ist eine japanische Eiche, deren Verarbeitung zu Fässern anspruchsvoll sein kann. Sandelholz, Kokos und Weihrauch sind häufig genannte sensorische Assoziationen; sie sind weder bei jeder Abfüllung garantiert noch benötigen sie zwangsläufig Jahrzehnte, bevor überhaupt ein Holzeinfluss erkennbar wird. Preise und Verfügbarkeit sind zeitabhängig.

## Das Regulierungsproblem und neue Standards

Die **JSLMA** beschloss 2021 freiwillige **Verbandsstandards zur Kennzeichnung Japanese Whisky**, mit vollständiger Anwendung nach der Übergangsfrist ab April 2024. Das ist keine gleichartige gesetzliche Pflicht für sämtliche Anbieter in Japan. Gefordert werden **gemälztes Getreide** (nicht ausschließlich Gerstenmalz), weitere Getreide und in Japan gewonnenes Wasser; Verzuckerung, Gärung und Destillation in Japan bei unter 95 % Vol.; mindestens drei Jahre Reifung in Japan in Holzfässern bis 700 Liter und Abfüllung in Japan bei mindestens 40 % Vol. Herkunft und konkretes Produkt sind getrennt vom japanisch klingenden Markennamen zu prüfen.`,
      quiz: [
        {
          "question": "Wer gilt als Vater des japanischen Whiskys?",
          "options": [
            "Shinjiro Torii",
            "Masataka Taketsuru",
            "Ichiro Akuto",
            "Kiichiro Iwai"
          ],
          "correct": 1,
          "explanation": "Masataka Taketsuru reiste 1918 nach Schottland, lernte dort das Whisky-Brennen und gründete später Nikka. Er gilt als Vater des japanischen Whiskys."
        },
        {
          "question": "Was ist besonders an Mizunara-Eiche?",
          "options": [
            "Sie wächst besonders schnell",
            "Sie verleiht Noten von Sandelholz, Kokosnuss und Weihrauch, ist aber schwer zu verarbeiten",
            "Sie macht den Whisky farblos",
            "Sie ist die billigste Eichenart"
          ],
          "correct": 1,
          "explanation": "Mizunara-Eiche verleiht dem Whisky einzigartige orientalische Aromen, ist aber porös und schwer zu verarbeiten — Mizunara-gereifte Whiskys sind daher selten und teuer."
        },
        {
          "question": "Warum produzieren japanische Brennereien intern so viele verschiedene Stile?",
          "options": [
            "Wegen gesetzlicher Vorgaben",
            "Um intern verschiedene Komponenten für eigene Blends zu erzeugen",
            "Weil sie mehr Platz haben",
            "Wegen der Klimavielfalt in Japan"
          ],
          "correct": 1,
          "explanation": "Unterschiedliche Herstellungswege liefern interne Blend-Komponenten. Historische Branchenpraxis ist keine Garantie, dass zwischen japanischen Herstellern niemals Austausch stattfindet."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 9
    // ═══════════════════════════════════════════════════════════
    {
      title: "Kanadischer und Weltwhisky",
      content: `## Kanadischer Whisky — Der sanfte Riese

**Kanadischer Whisky** hat einen besonderen Platz in der Whisky-Welt: Er ist bekannt für seine **Sanftheit und Zugänglichkeit**, wird aber von Enthusiasten oft unterschätzt. Die kanadische Whisky-Industrie hat eigene Traditionen und Regeln, die sich von Scotch und Bourbon deutlich unterscheiden.

## Kanadische Besonderheiten

Die aktuellen kanadischen Compositional Standards verlangen für **Canadian Whisky / Canadian Rye Whisky** unter anderem Maischen, Destillieren und mindestens drei Jahre Reifung in kleinen Holzgebinden in Kanada sowie mindestens 40 % Vol. Aromatisierung ist nach der Spezifikation möglich. Der Name „Canadian Rye“ schreibt nicht automatisch den US-Roggenanteil von 51 % vor. Eine pauschale gesetzliche 9,09-%-Grenze für jede Zugabe wird hier nicht behauptet.

## Wichtige kanadische Marken

Crown Royal, Canadian Club und weitere Marken illustrieren unterschiedliche Blending-Traditionen. Die Auszeichnung einer einzelnen Abfüllung in einem bestimmten Wettbewerb ist keine objektive Weltrangliste der gesamten Marke.

## Weltwhisky — Die globale Expansion

Whisky wird in vielen Ländern hergestellt, unter anderem Indien, Taiwan, Australien, skandinavischen Ländern und Deutschland. Klima und Lagerbedingungen können Extraktion, Oxidation und Verdunstung beeinflussen. **Fünf Jahre in einem warmen Klima sind nicht pauschal dasselbe wie fünfzehn Jahre in Schottland**; Komplexität und Gefallen lassen sich nicht aus einem festen Altersfaktor ableiten.

## Taiwan

**Kavalan** produziert in Taiwan. Wärmeres Klima kann einen deutlichen Einfluss auf die Fassreifung und Verdunstung haben. Eine einheitliche jährliche Verlustquote für jedes Fass wird nicht angegeben; Lagerhaus, Fass und Feuchtigkeit sind ebenfalls wichtig.

## Australien, Skandinavien und Deutschland

Australische, skandinavische und deutsche Hersteller zeigen, dass Herkunft und lokale Produktionsentscheidungen neue Stile hervorbringen können. Bei geräuchertem Malz sind Trocknung und Rauchquelle von der Mälzung selbst zu unterscheiden. Regionenamen, klimatische Kurzbeschreibungen und Auszeichnungen ersetzen keine konkreten Produktinformationen.`,
      quiz: [
        {
          "question": "Was ist das Besondere am kanadischen Blending-System?",
          "options": [
            "Nur Mais wird verwendet",
            "Base Whisky und Flavouring Whisky werden separat hergestellt und dann gemischt",
            "Es wird nur in Pot Stills destilliert",
            "Es gibt keine Mindest-Reifezeit"
          ],
          "correct": 1,
          "explanation": "Kanada verwendet ein einzigartiges System: Ein leichter Base Whisky wird mit einem aromatischeren Flavouring Whisky gemischt."
        },
        {
          "question": "Kann man Reifungsjahre warmer und kühler Klimazonen mit einem festen Faktor umrechnen?",
          "options": [
            "Ja, immer 1:3",
            "Nein, Klima verändert Prozesse, aber es gibt keine allgemeine Alters- oder Qualitätsgleichsetzung",
            "Ja, allein anhand der Flaschenfarbe",
            "Nur bei Bourbon"
          ],
          "correct": 1,
          "explanation": "Temperatur, Feuchtigkeit, Fass und Lagerung wirken zusammen. Eine feste Gleichsetzung wie fünf Jahre Amrut = fünfzehn Jahre Scotch ist nicht belastbar."
        },
        {
          "question": "Was bedeutet Angel’s Share?",
          "options": [
            "Die Anzahl verkaufter Flaschen",
            "Der Verdunstungsverlust während der Fasslagerung",
            "Die Altersangabe auf dem Etikett",
            "Ein gesetzlich fixer Verlust von 12 %"
          ],
          "correct": 1,
          "explanation": "Angel’s Share bezeichnet die Verdunstung aus dem Fass. Sie hängt von Fass, Klima und Lagerbedingungen ab und ist keine universelle Länderquote."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 10
    // ═══════════════════════════════════════════════════════════
    {
      title: "Der Herstellungsprozess: Mälzen bis Destillation",
      content: `## Vom Korn zum Geist — Der komplette Weg

Die Whisky-Herstellung ist ein mehrstufiger Prozess, der traditionelles Handwerk mit moderner Technologie verbindet. Jeder Schritt beeinflusst das Endprodukt entscheidend. In dieser Lektion verfolgen wir den Weg von der rohen Gerste bis zum frischen Destillat.

## Schritt 1: Mälzen (Malting)

Beim **Mälzen** wird Gerste in Wasser eingeweicht (**Steeping**, ca. 2-3 Tage), bis sie einen Feuchtigkeitsgehalt von etwa **45 %** erreicht. Die nasse Gerste wird dann ausgebreitet und zum **Keimen** gebracht. Während der Keimung (4-7 Tage) bilden sich **Enzyme** (vor allem Alpha- und Beta-Amylase), die später Stärke in vergärbaren Zucker umwandeln. Die Keimung muss zum richtigen Zeitpunkt gestoppt werden — durch **Darren** (Trocknen mit heißer Luft). Wenn Torfrauch gewünscht ist, wird während des Darrens **Torf** verbrannt. Traditionell wurde auf **Malting Floors** (Mälzböden) gemälzt — heute nutzen die meisten Brennereien industrielle Mälzereien. Nur wenige Destillerien wie **Laphroaig**, **Bowmore**, **Springbank** und **Highland Park** mälzen noch einen Teil selbst.

## Schritt 2: Schroten (Milling)

Das getrocknete Malz wird zu **Grist** geschrotet. Die passende Mischung aus Spelzen, gröberen Teilen und Mehl hängt von Mühle und Maischeanlage ab; eine einzelne Prozentaufteilung ist kein allgemeines Gesetz für jede Brennerei.

## Schritt 3: Maischen (Mashing)

Grist und warmes Wasser werden im Maischebottich zusammengeführt. Enzyme des Malzes bauen Stärke zu löslichen Kohlenhydraten ab. Die zuckerhaltige Flüssigkeit heißt **Wort / Würze**. Temperaturen und Wassergaben sind betriebsspezifisch; ein einziger Ablauf ist kein Rezept für alle Whisky-Kategorien.

## Schritt 4: Gärung (Fermentation)

Die abgekühlte Würze wird in **Washbacks** (Gärbottiche) gepumpt. Diese sind traditionell aus Oregon-Kiefer oder Douglasie (**Holz-Washbacks** in traditionellen Brennereien) oder aus **Edelstahl**. Hefe wird zugesetzt und die **Gärung** läuft 48-72 Stunden (manche Brennereien bis zu 120 Stunden). Die Hefe wandelt Zucker in Alkohol und CO2 um. Das Ergebnis ist die **Wash** — im Grunde ein ungehopftes Bier mit ca. **7-9 % Vol.** Alkohol. Längere Gärzeiten erzeugen fruchtigere, esterreichere Destillate.

## Schritt 5: Destillation

Bei der Destillation werden Alkohol und weitere flüchtige Stoffe aus der vergorenen **Wash** konzentriert. Beim Malt-Scotch-Verfahren wird das **Herzstück / Middle Cut** zur Reifung gesammelt. **Foreshots** und **Feints** werden üblicherweise mit der nächsten Charge Low Wines erneut destilliert. **Methanol ist nicht ausschließlich im ersten Vorlauf enthalten**; das einfache Verwerfen eines ersten Anteils ist keine Sicherheitsgarantie und keine Anleitung zum privaten Destillieren. Die Schnittpunkte beeinflussen die Qualität und müssen professionell kontrolliert werden.`,
      quiz: [
        {
          "question": "Was ist der Zweck des Mälzens?",
          "options": [
            "Die Gerste zu reinigen",
            "Enzyme zu bilden, die Stärke in Zucker umwandeln können",
            "Den Alkoholgehalt zu erhöhen",
            "Die Gerste zu konservieren"
          ],
          "correct": 1,
          "explanation": "Beim Mälzen bilden sich Enzyme (Alpha- und Beta-Amylase), die im späteren Maischprozess Stärke in vergärbaren Zucker umwandeln."
        },
        {
          "question": "Was sind Foreshots im Malt-Scotch-Prozess?",
          "options": [
            "Bereits fertig gereifter Whisky",
            "Die erste getrennt gesammelte Destillatfraktion, üblicherweise zur erneuten Destillation",
            "Ausschließlich reines Methanol, dessen Entfernung alles sicher macht",
            "Die Gerstenspelzen"
          ],
          "correct": 1,
          "explanation": "Foreshots sind der erste getrennte Teil des Destillatflusses. Die Scotch-Spezifikation beschreibt ihre erneute Destillation mit Low Wines, nicht eine einfache vollständige Entfernung sämtlicher Risiken."
        },
        {
          "question": "Wie hoch ist der Alkoholgehalt der Wash vor der Destillation?",
          "options": [
            "Ca. 1-2 %",
            "Ca. 7-9 %",
            "Ca. 20-25 %",
            "Ca. 40 %"
          ],
          "correct": 1,
          "explanation": "Die Wash — das Ergebnis der Gärung — hat einen Alkoholgehalt von ca. 7-9 % Vol. und ist im Grunde ein ungehopftes Bier."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 11
    // ═══════════════════════════════════════════════════════════
    {
      title: "Pot Still vs. Column Still",
      content: `## Zwei Wege zum Destillat

Die Art der Brennblase hat einen fundamentalen Einfluss auf den Charakter des Whiskys. Die beiden Haupttypen — **Pot Still** und **Column Still** — unterscheiden sich in Funktionsweise, Effizienz und dem Geschmacksprofil des erzeugten Destillats grundlegend.

## Die Pot Still (Kupfer-Brennblase)

Die **Pot Still** ist eine der ältesten Destillationstechnologien der Welt. Sie besteht aus einem **kupfernen Kessel** (Pot), einem **Schwanenhals** (Lyne Arm) und einem **Kondensator**. Die Funktionsweise ist einfach: Die Flüssigkeit wird im Kessel erhitzt, Alkoholdämpfe steigen auf, passieren den Schwanenhals und werden im Kondensator wieder zu Flüssigkeit. Dies ist ein **Batch-Prozess** — nach jedem Durchgang muss die Still gereinigt und neu befüllt werden.

## Die Form macht den Whisky

Bauform, Heizleistung, Rückfluss (**Reflux**), Kondensator und Schnittpunkte beeinflussen den Destillatstil. Hohe oder aufsteigende Bauteile können mehr Rückfluss begünstigen, doch „schwere Moleküle schaffen den Weg nicht“ ist nur eine ungenaue Metapher. Entscheidend sind Verdampfung, Kondensation und Kontaktbedingungen; eine Brennblasenhöhe allein garantiert kein leichtes oder schweres Profil.

## Die Column Still (Coffey Still / Patent Still)

Die **Column Still** erlaubt kontinuierliche Destillation. Coffeys historische Konstruktion verwendet Analyser und Rectifier; heutige Systeme können anders aufgebaut sein. Wiederholter Stoff- und Wärmeaustausch zwischen Dampf und Flüssigkeit ermöglicht stärkere Trennung. Für Scotch liegt die erlaubte Destillationsstärke **unter 94,8 % Vol.**, nicht einschließlich 94,8 %.

## Column-Still-Whisky

Viele Grain Whiskys werden in kontinuierlichen Anlagen hergestellt. Das Verfahren allein definiert jedoch nicht jede nationale Grain-Kategorie: Die Scotch-Spezifikation lässt auch andere Produktionswege zu. Bourbon-Anlagen können Säulen mit weiteren Brennapparaten kombinieren. Getreide, Stärke und Schnittführung wirken zusammen.

## Destillationsstärke und Charakter

Höhere Destillationsstärke kann ein zurückhaltenderes Begleitstoffprofil ermöglichen. Sie ist aber weder automatisch „geschmacklos“ noch ein Qualitätsmaßstab. Die jeweiligen gesetzlichen Grenzen sind von tatsächlicher Betriebsstärke zu unterscheiden: Scotch unter 94,8 % Vol., US-Bourbon höchstens 80 % Vol.`,
      quiz: [
        {
          "question": "Was bezeichnet Reflux bei der Destillation?",
          "options": [
            "Den Flaschenverschluss",
            "Rückkondensation, bei der Flüssigkeit zurückfließt und die Trennung beeinflusst",
            "Den Hopfengehalt",
            "Die Flaschenreifung"
          ],
          "correct": 1,
          "explanation": "Rückkondensation und erneute Verdampfung beeinflussen die Stofftrennung. Bauform, Betrieb und Kühlung wirken mit; eine Höhe allein garantiert kein bestimmtes Geschmacksprofil."
        },
        {
          "question": "Wer perfektionierte die Column Still?",
          "options": [
            "Masataka Taketsuru",
            "Aeneas Coffey",
            "John Walker",
            "Andrew Usher"
          ],
          "correct": 1,
          "explanation": "Aeneas Coffey entwickelte einen wichtigen historischen kontinuierlichen Brennapparat. Die Coffey Still ist nach ihm benannt."
        },
        {
          "question": "Was ist ein wesentlicher Unterschied zwischen Pot-Still- und Column-Still-Destillation?",
          "options": [
            "Pot Still ist kontinuierlich, Column Still ist Batch-basiert",
            "Pot Still ist ein Batch-Prozess, Column Still arbeitet kontinuierlich",
            "Beide arbeiten identisch",
            "Column Still verwendet kein Kupfer"
          ],
          "correct": 1,
          "explanation": "Pot Still ist ein Batch-Prozess (Befüllen, Destillieren, Reinigen), während die Column Still kontinuierlich arbeitet und damit effizienter ist."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 12
    // ═══════════════════════════════════════════════════════════
    {
      title: "Fassreifung — Einfluss von Holz und Zeit",
      content: `## Das Fass macht den Whisky

Das Fass ist ein wesentlicher Einfluss auf Farbe, Aroma und Textur. Eine allgemeine Aussage, exakt 60–80 % eines Geschmacks stammten aus dem Fass, ist jedoch keine belastbare Messgröße für jeden Whisky. Getreide, Fermentation, Destillation, Fass und Lagerbedingungen wirken zusammen.

## Die Chemie der Fassreifung

Drei parallele Prozesse laufen während der Reifung ab: **Additive Reifung** — Das Holz gibt Verbindungen an den Whisky ab: **Vanillin** (Vanillearoma), **Lactone** (Kokos), **Tannine** (Struktur, Adstringenz), **Lignin-Abbauprodukte** (Gewürze, Rauch), **Hemicellulose** (Karamell, Toffee). **Subtraktive Reifung** — Unerwünschte Verbindungen werden vom Holz absorbiert oder durch Oxidation abgebaut: Schwefelverbindungen, unreife New-Make-Noten, scharfe Alkohole. **Interaktive Reifung** — Whisky und Holz reagieren miteinander und bilden neue, komplexe Verbindungen, die weder im New Make noch im Holz allein vorkommen (z.B. Ester durch Reaktion von Alkoholen mit Fettsäuren).

## Amerikanische Weißeiche vs. Europäische Eiche

**Amerikanische Weißeiche** (Quercus alba): Ein verbreiteter Holztyp für Whisky-Fässer. Verleiht Vanille, Kokos, Karamell, Honig und helle Frucht. Weniger Tannine als europäische Eiche. Wird für Bourbon-Fässer verwendet (neu und ausgebrannt), die danach von der Scotch-Industrie als **Ex-Bourbon Casks** übernommen werden. **Europäische Eiche** (Quercus robur und Q. petraea): Tanninreicher, würziger. Kann für Sherry-seasoned Fässer genutzt werden; dafür wird auch amerikanische Eiche eingesetzt. Verleiht Trockenfrüchte, Schokolade, Weihnachtsgewürze und dunkle Farbe.

## Charring und Toasting

**Charring** verkohlt die Innenfläche durch Flammen; **Toasting** behandelt das Holz mit kontrollierter Wärme, ohne zwingend dieselbe verkohlte Schicht zu erzeugen. Intensität und Ablauf beeinflussen die Holzoberfläche und extrahierbare Stoffe. Char-Level und Sekundenwerte sind herstellerabhängig und keine universelle vierstufige Rechtsvorschrift.

## Der Angel's Share

**Angel’s Share** bezeichnet Verdunstungsverluste aus dem Fass. Klima, Feuchtigkeit, Fass und Lagerhaus beeinflussen Volumen und Alkoholstärke. Als schottischer Durchschnitt wird häufig etwa 2 % Volumenverlust pro Jahr beschrieben; das ist keine Garantie für ein einzelnes Fass. Ob die Alkoholstärke steigt oder sinkt, hängt vom relativen Verlust von Wasser und Ethanol ab.

## Die Bedeutung der Zeit

Zeit verändert das Zusammenspiel von Destillat und Fass, aber nicht linear. Ein fester „Sweet Spot“ bei 10–20 Jahren gilt nicht für alle Whiskys. Mehr Holzextraktion kann auch zu dominanter Adstringenz führen; ältere oder dunklere Produkte sind nicht automatisch besser. Das konkrete Fass und der gewünschte Stil entscheiden.`,
      quiz: [
        {
          "question": "Wie ist der Einfluss des Fasses auf Whisky einzuordnen?",
          "options": [
            "Er beträgt bei jeder Flasche exakt 80 %",
            "Er ist wesentlich, aber es gibt keinen universellen Geschmacks-Prozentsatz",
            "Er ist immer bedeutungslos",
            "Er hängt nur vom Etikett ab"
          ],
          "correct": 1,
          "explanation": "Fass und Lagerung wirken gemeinsam mit Getreide, Gärung und Destillation. Ein universeller prozentualer Geschmacksanteil ist kein belastbares Lernziel."
        },
        {
          "question": "Was ist Charring?",
          "options": [
            "Das Auswaschen des Fasses mit Wasser",
            "Das Ausbrennen der Fass-Innenseite mit offener Flamme",
            "Das Trocknen des Holzes an der Luft",
            "Das Versiegeln des Fasses mit Wachs"
          ],
          "correct": 1,
          "explanation": "Charring ist das Verkohlen der Fassinnenfläche mit Flammen. Der konkrete Ablauf ist herstellerabhängig und beeinflusst Holzstruktur und extrahierbare Stoffe."
        },
        {
          "question": "Was ist der Angel's Share?",
          "options": [
            "Der Anteil des Meisters am Destillat",
            "Die jährliche Verdunstung von Whisky durch das poröse Fassholz",
            "Der erste Teil der Destillation",
            "Die Steuer auf Whisky"
          ],
          "correct": 1,
          "explanation": "Angel’s Share bezeichnet den Verdunstungsverlust. Die Menge schwankt mit Klima, Fass und Lagerhaus; ein Mittelwert ist keine feste Länderquote."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 13
    // ═══════════════════════════════════════════════════════════
    {
      title: "Fasstypen: Bourbon, Sherry, Port, Wein",
      content: `## Die Fass-Palette des Whisky-Makers

Die Wahl des Fasses ist eine der kreativsten Entscheidungen in der Whisky-Produktion. Verschiedene Fasstypen bringen völlig unterschiedliche Geschmacksprofile, und die Kombination von Erst- und Zweitreifung (**Finishing**) eröffnet nahezu unbegrenzte Möglichkeiten.

## Ex-Bourbon Casks (American Standard Barrel, ASB)

Bourbon benötigt nach US-Standard **neue ausgebrannte Eichenfässer**. Bereits für Bourbon genutzte Fässer können anschließend anderen Spirituosen dienen. Ein American Standard Barrel fasst ungefähr 200 Liter; andere Größen kommen ebenfalls vor. **First Fill** bezeichnet in der Scotch-Praxis die erste Befüllung mit Scotch nach der vorherigen Nutzung, nicht automatisch ein fabrikneues Fass. Wiederverwendung verändert den Einfluss, aber es gibt keine für jedes Fass feste maximale Zahl.

## Sherry Casks

Sherry-seasoned Fässer können aus **amerikanischer oder europäischer Eiche** bestehen. Eichenart, vorherige Nutzung, Seasoning und Reifedauer sind getrennte Merkmale. Oloroso-, PX- oder Fino-bezogene Beschreibungen sind häufige Aromenerwartungen, keine bei jeder Flasche garantierten Einzelnoten. Herstellerangaben erklären, ob und wie Fässer speziell vorbereitet wurden.

## Port, Madeira und Weinfässer

**Port Casks**: Verleihen Beerennoten, rote Früchte, Schokolade, leichte Süße. Beliebt bei GlenDronach, BenRiach und Glenmorangie. **Madeira Casks**: Karamell, Orangenschale, Nüsse, tropische Früchte. Die oxidative Reifung des Madeira macht die Fässer besonders aromatisch. **Rotweinfässer** (Bordeaux, Burgund, Barolo): Rote Beeren, Tannine, erdige Noten. **Weißweinfässer** (Sauternes): Honig, Aprikose, Blüten — Glenmorangie hat hier Pionierarbeit geleistet.

## Rum, Cognac und andere exotische Fässer

Rum-, Cognac- und bestimmte Bierfässer können zusätzliche Reifungsprofile schaffen. Nicht jedes beliebige vorbelegte Fass ist für Scotch zulässig: Die geschützte Spezifikation begrenzt Vorbelegungen und verlangt, dass das Fass vor dem Befüllen geleert ist. **STR** bedeutet **Shaved, Toasted, Re-charred** — Innenbearbeitung durch Hobeln, Toasten und erneutes Verkohlen. Eine alleinige Erfinder- oder Marken-Zuschreibung wird ohne belastbare historische Belege nicht vorausgesetzt.

## Finishing und Double Maturation

**Finishing** ist eine zusätzliche Reifungsphase in einem anderen Fass, beispielsweise nach Ex-Bourbon in einem geeigneten Sherryfass. Dauer und Vorgehen sind produktabhängig. Begriffe wie **Double Cask** bedeuten nicht automatisch nacheinander Sherry und Bourbon: **Macallan Double Cask** kombiniert laut Hersteller in Sherry-seasoned amerikanischer und europäischer Eiche gereifte Komponenten. Das ist vom Finishing eines einzelnen Whiskys zu unterscheiden.`,
      quiz: [
        {
          "question": "Warum sind Ex-Bourbon-Fässer so reichlich verfügbar?",
          "options": [
            "Weil Bourbon schlecht verkauft wird",
            "Weil Bourbon per Gesetz neue Fässer verwenden muss und gebrauchte nicht wiederverwenden darf",
            "Weil Bourbon-Fässer besonders groß sind",
            "Weil sie kostenlos sind"
          ],
          "correct": 1,
          "explanation": "Bourbon muss per Gesetz in neuen, ausgebrannten Eichenfässern reifen. Die gebrauchten Fässer stehen danach der Scotch- und anderen Whisky-Industrien zur Verfügung."
        },
        {
          "question": "Was ist ein 'Finishing' in der Whisky-Reifung?",
          "options": [
            "Die letzte Destillation",
            "Eine zweite Reifungsphase in einem anderen Fasstyp",
            "Das Abfüllen in Flaschen",
            "Die Verdünnung auf Trinkstärke"
          ],
          "correct": 1,
          "explanation": "Finishing bedeutet, dass ein Whisky nach der Hauptreifung für eine zweite Phase in ein anderes Fass umgefüllt wird (z.B. von Ex-Bourbon in Sherryfass)."
        },
        {
          "question": "Welcher Sherry-Typ verleiht dem Whisky Trockenfrüchte, Schokolade und Weihnachtsgewürze?",
          "options": [
            "Fino",
            "Manzanilla",
            "Oloroso",
            "Amontillado"
          ],
          "correct": 2,
          "explanation": "Oloroso-Sherry (oxidativ gereift) verleiht dem Whisky Aromen von Trockenfrüchten, dunkler Schokolade, Walnuss und Weihnachtsgewürzen."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 14
    // ═══════════════════════════════════════════════════════════
    {
      title: "Whisky-Sensorik — Nosing und Tasting",
      content: `## Die Kunst der Whisky-Verkostung

Professionelles Whisky-Tasting ist eine erlernbare Fähigkeit, die Übung, Konzentration und die richtige Methodik erfordert. Die sensorische Analyse eines Whiskys folgt einem systematischen Ablauf, der Farbe, Geruch, Geschmack und Nachklang umfasst.

## Das richtige Glas

Ein sauberes tulpenförmiges Nosing-Glas wie Glencairn oder Copita kann Aromen bündeln. Glasform, Temperatur und Verdünnung beeinflussen die Wahrnehmung. Ein Tumbler ist nicht verboten oder objektiv unbrauchbar; für einen Vergleich sollten die Bedingungen möglichst gleich sein. Eis verändert Temperatur und Verdünnung und damit den Eindruck.

## Schritt 1: Visuelle Bewertung

Beschreiben Sie **Farbe** und Klarheit, ohne daraus ein sicheres Alter oder einen eindeutigen Fasstyp abzuleiten. Fassart, Nutzung und gegebenenfalls E150a beeinflussen die Farbe. **Schlieren / Legs** hängen unter anderem mit Alkohol, Oberflächenspannung und Verdunstung zusammen; sie belegen weder Qualität noch zugesetzten Zucker oder Glycerin. Für Scotch sind Zucker- und Glycerinzusätze nicht zulässige Zutaten.

## Schritt 2: Nosing (Geruch)

Das Nosing ist der **wichtigste Teil** der Verkostung — unser Geruchssinn ist viel differenzierter als der Geschmackssinn. Halten Sie das Glas ca. **5-10 cm** von der Nase entfernt — nicht zu nah, sonst betäubt der Alkohol die Rezeptoren. **Erstes Nosing** (pur): Alkohol wahrnehmen und "durchdringen". Grundcharakter erfassen: Fruchtig? Rauchig? Süß? Blumig? **Zweites Nosing** (nach 5-10 Min.): Der Whisky hat geatmet, subtilere Aromen treten hervor. **Drittes Nosing** (mit Wasser): Ein paar Tropfen Wasser reduzieren die Alkoholschärfe und öffnen neue Aromenebenen. Atmen Sie abwechselnd durch ein Nasenloch — jedes nimmt leicht unterschiedliche Dinge wahr.

## Schritt 3: Palate (Geschmack)

Bei einer freiwilligen Verkostung werden Grundgeschmack, Mundgefühl und Wärme getrennt beschrieben. Die **Zungenkarte** mit festen Zonen für Süße, Salz, Säure und Bitterkeit ist ein Mythos: Unterschiedliche Geschmacksrezeptorzellen sind über die Zunge verteilt. Aroma, Textur und Temperatur tragen gemeinsam zum Gesamteindruck bei. Niemand muss Alkohol schlucken, um an einer sensorischen Erklärung teilzunehmen.

## Schritt 4: Finish (Nachklang)

Der **Finish / Nachklang** beschreibt verbleibende Eindrücke und deren Veränderung. „Kurz“ oder „lang“ sind sensorische Beschreibungen; ein universeller 60-Sekunden-Grenzwert als Premium-Prüfung existiert hier nicht. Länge allein ist keine Qualitätsgarantie.

## Professionelles Tasting-Setup

Für vergleichbare Eindrücke: gleiche Gläser, ruhige Umgebung, möglichst ähnliche Bedingungen und dokumentierte Beobachtungen. Verdeckte Proben können Erwartungseffekte **reduzieren**, nicht sämtliche Vorurteile eliminieren. Eine Reihenfolge von zurückhaltend zu intensiv kann praktisch sein; Alter oder Farbe allein definieren die Intensität nicht. Alkoholmeidung ist immer möglich.`,
      quiz: [
        {
          "question": "Welches tulpenförmige Glas wird häufig für Whisky-Nosing genutzt?",
          "options": [
            "Tumbler",
            "Weinglas",
            "Glencairn Glass",
            "Schnapsglas"
          ],
          "correct": 2,
          "explanation": "Glencairn ist ein verbreitetes Nosing-Glas. Eine saubere, geeignete Glasform hilft beim Vergleich; es gibt keine Pflicht, nur dieses Glas zu verwenden."
        },
        {
          "question": "Warum ist das Nosing wichtiger als das eigentliche Trinken?",
          "options": [
            "Weil der Alkohol beim Trinken betäubt",
            "Weil unser Geruchssinn viel differenzierter als der Geschmackssinn ist",
            "Weil Whisky besser riecht als schmeckt",
            "Weil es schneller geht"
          ],
          "correct": 1,
          "explanation": "Der Geruchssinn kann tausende verschiedene Aromen unterscheiden, während der Geschmackssinn auf wenige Grundgeschmacksrichtungen beschränkt ist."
        },
        {
          "question": "Was lässt sich aus einem langen Nachklang sicher ableiten?",
          "options": [
            "Dass der Whisky garantiert Premiumqualität hat",
            "Dass Eindrücke länger wahrnehmbar bleiben, nicht automatisch höhere Qualität",
            "Dass er mindestens 30 Jahre alt ist",
            "Dass er Zucker enthält"
          ],
          "correct": 1,
          "explanation": "Nachklang beschreibt die Dauer und Entwicklung sensorischer Eindrücke. Eine universelle Sekunden-Grenze ist kein objektives Premium-Zertifikat."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 15
    // ═══════════════════════════════════════════════════════════
    {
      title: "Das Whisky-Aroma-Rad",
      content: `## Systematische Aromen-Kategorisierung

Das **Whisky-Aroma-Rad** ist ein Hilfsmittel zur gemeinsamen Beschreibung von Eindrücken. SWRI dokumentiert seine Entwicklung durch Wissenschaftler und Blender **1979**. Begriffe auf einem Rad sind keine vollständige Liste chemischer Moleküle und keine Garantie, dass jeder Verkoster dieselben Noten wahrnimmt.

## Die Hauptkategorien

Das Aroma-Rad teilt Whisky-Aromen in **acht Hauptkategorien**: **Cereals (Getreide)**: Malz, Brot, Toast, Keks, Teig, Haferflocken, Müsli. Diese Aromen stammen hauptsächlich aus dem Getreide und der Mälzung. Junger Whisky zeigt oft ausgeprägtere Getreidenoten. **Fruity (Fruchtig)**: Unterteilt in frische Frucht (Apfel, Birne, Zitrus) und getrocknete Frucht (Rosinen, Feigen, Datteln). Ester, die während der Gärung entstehen, sind hauptverantwortlich. Sherryfass-Reifung verstärkt Trockenfruchtnoten.

## Florale und süße Aromen

**Floral (Blumig)**: Rose, Jasmin, Lavendel, Veilchen, Geranium, Heidekraut. Typisch für leichte Lowland-Whiskys, japanische Whiskys und elegante Speyside-Malts. Entstehen durch Ester und Aldehyde. **Sweet (Süß)**: Honig, Vanille, Butterscotch, Toffee, Karamell, Schokolade, Fudge. Vanille stammt hauptsächlich aus dem **Vanillin** im Eichenholz (besonders amerikanische Eiche). Karamellnoten entstehen durch die Karamellisierung der Holzzucker beim Charring/Toasting.

## Holz und Gewürze

**Woody (Holzig)**: Frisches Holz, Zeder, Sandelholz, altes Holz, Bleistift, Sägespäne. Direkte Holzextraktion, nimmt mit dem Alter zu. Zu viel Holz kann den Whisky bitter und trocken machen — ein Zeichen von überreiften Fässern. **Spicy (Würzig)**: Zimt, Nelke, Muskat, Ingwer, Pfeffer, Lakritze. Roggenwhisky (Rye) zeigt natürliche Pfeffrigkeit. Gewürznoten kommen auch aus dem Fass (besonders europäische Eiche).

## Rauchige und andere komplexe Aromen

**Peaty/Smoky (Torfig/Rauchig)**: Lagerfeuer, geräuchertes Fleisch, Teer, Asche, medizinisch, jodhaltig, maritime Noten. Durch das Darren des Malzes über Torffeuer. Die **Phenolverbindungen** (Guaiacol, Kresol, etc.) sind die chemischen Träger dieser Aromen. **Feinty (Schwer)**: Leder, Tabak, Nuss, erdige Noten. Oft in älteren Whiskys und durch längere Destillation (späterer Cut Point) präsenter. **Sulphury (Schwefelig)**: Streichholz, Gummi, Kohl, Ei. In kleinen Mengen akzeptabel (besonders in jungen Sherry-Cask-Whiskys), in großen Mengen ein Fehler.

## Praktische Anwendung des Aroma-Rads

Beginnen Sie mit allgemeinen Eindrücken und werden Sie genauer: „fruchtig“ → „Trockenfrucht“ → „Rosine“. Je nach Darstellung führt das von breiten zu spezifischen Kategorien, nicht zwingend in eine festgelegte Richtung auf jedem Rad. Individuelle Wahrnehmung und Erfahrung unterscheiden sich. Eine feststehende Zahl von 150 Aromen ist kein Fähigkeitsnachweis.`,
      quiz: [
        {
          "question": "Wozu dient ein Whisky-Aroma-Rad?",
          "options": [
            "Zur Messung des Alkoholgehalts",
            "Zur systematischen Beschreibung und gemeinsamen Kommunikation sensorischer Eindrücke",
            "Zur sicheren Altersbestimmung",
            "Zur Garantie identischer Wahrnehmung aller Personen"
          ],
          "correct": 1,
          "explanation": "SWRI dokumentiert die Entwicklung des Rads 1979. Es hilft beim Benennen von Eindrücken, ersetzt aber keine chemische Analyse und legt persönliche Wahrnehmung nicht fest."
        },
        {
          "question": "Woher stammt die Vanillenote im Whisky hauptsächlich?",
          "options": [
            "Aus der Hefe",
            "Aus dem Getreide",
            "Aus dem Vanillin im Eichenholz",
            "Aus zugesetzter Vanille"
          ],
          "correct": 2,
          "explanation": "Vanillenoten im Whisky stammen hauptsächlich aus dem Vanillin, das im Eichenholz enthalten ist und während der Fassreifung extrahiert wird."
        },
        {
          "question": "Was sind die chemischen Träger von Torf- und Raucharomen im Whisky?",
          "options": [
            "Ester",
            "Phenolverbindungen wie Guaiacol und Kresol",
            "Tannine",
            "Aldehyde"
          ],
          "correct": 1,
          "explanation": "Phenolverbindungen (Guaiacol, Kresol u.a.) sind die chemischen Träger der Torf- und Raucharomen, die beim Darren des Malzes über Torffeuer entstehen."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 16
    // ═══════════════════════════════════════════════════════════
    {
      title: "Whisky und Wasser — Verdünnung und Chemie",
      content: `## Die Wissenschaft hinter dem Wassertropfen

Wasser kann Alkoholstärke und Aromawahrnehmung verändern. Ob eine Verdünnung persönlich besser gefällt, ist subjektiv. Wissenschaftliche Ergebnisse zu einzelnen Molekülen sind keine allgemeine Genuss- oder Gesundheitsgarantie.

## Die Chemie der Verdünnung

**Karlsson und Friedman (2017)** untersuchten Guaiacol in **Modellgemischen aus Wasser und Ethanol** mit Molekulardynamik-Simulationen. Bei niedrigeren untersuchten Ethanolkonzentrationen lag das Molekül bevorzugter an der Flüssigkeits-Luft-Grenzfläche. Das kann Veränderungen der Wahrnehmung erklären. Die Studie war kein klinischer Nutzenbeleg und kein Verkostungstest, der jede Sorte nach wenigen Tropfen als besser bewies.

## Ethanol als Lösungsmittel

Ethanol besitzt hydrophile und hydrophobe Anteile. In Wasser-Ethanol-Gemischen können sich lokale Strukturen und die Verteilung eines Aromamoleküls verändern. „Mikro-Tröpfchen schließen alle Aromen ein, Wasser befreit sie“ wäre eine zu pauschale Erklärung. Verschiedene Verbindungen verhalten sich unterschiedlich.

## Die praktische Anwendung

Wenn Sie freiwillig verkosten, können kleine Wasserzugaben schrittweise verglichen werden. Ein festes Tropfenschema für jede Alkoholstärke ist nicht belastbar; Glasmenge, Tropfengröße und persönlicher Eindruck variieren. **Verdünnung reduziert die Stärke, nicht die bereits im Glas enthaltene Alkoholmenge.** Mehr Wasser ist kein Schutz vor Alkoholfolgen.

## Welches Wasser?

Geschmacksneutrales, trinkbares Wasser ist für einen Vergleich praktisch. Mineralisierung und Temperatur können den Eindruck beeinflussen; eine einzelne Quellwasserherkunft oder destilliertes Wasser ist keine Voraussetzung. Die Wahl bleibt eine Verkostungspräferenz, keine Gesundheitsmaßnahme.

## Proofing — Die Kunst der richtigen Trinkstärke

**Proofing** ist die Einstellung der gewünschten Stärke durch Wasserzugabe. Scotch muss bei der Abfüllung mindestens 40 % Vol. haben. **Cask Strength** bedeutet bei Scotch, dass die Stärke nach der Reifung nicht angepasst wurde. Eine Abfüllung bei 46 % Vol. garantiert keine Trübungsfreiheit; Temperatur, Zusammensetzung und Verdünnung wirken ebenfalls mit.`,
      quiz: [
        {
          "question": "Was untersuchte die Karlsson-Friedman-Studie von 2017?",
          "options": [
            "Eine Heilwirkung von Whisky",
            "Die Verteilung von Guaiacol in simulierten Wasser-Ethanol-Modellgemischen",
            "Garantiert besseren Geschmack jeder Flasche",
            "Eine sichere Trinkdosis"
          ],
          "correct": 1,
          "explanation": "Die Molekulardynamik-Studie zeigte konzentrationsabhängige Verteilung im Modell. Daraus folgt keine universelle Geschmacks- oder Gesundheitsgarantie."
        },
        {
          "question": "Was ändert die Zugabe von Wasser zu einem bereits eingeschenkten Whisky?",
          "options": [
            "Sie entfernt sämtlichen Alkohol",
            "Sie senkt die Konzentration, nicht die enthaltene Alkoholmenge",
            "Sie macht Alkohol unschädlich",
            "Sie macht Scotch älter"
          ],
          "correct": 1,
          "explanation": "Verdünnung verändert Konzentration und Wahrnehmung, aber nicht die vor der Zugabe bereits eingeschenkte Alkoholmenge."
        },
        {
          "question": "Welches Wasser eignet sich am besten zum Verdünnen von Whisky?",
          "options": [
            "Stark kohlensäurehaltiges Mineralwasser",
            "Stilles, weiches, geschmacksneutrales Wasser bei Raumtemperatur",
            "Eiskaltes Leitungswasser",
            "Salzwasser"
          ],
          "correct": 1,
          "explanation": "Stilles, weiches, geschmacksneutrales Wasser bei Raumtemperatur ist ideal, da Kohlensäure und Mineralien den Geschmack verfälschen und Kälte Aromen verschließt."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 17
    // ═══════════════════════════════════════════════════════════
    {
      title: "Torfrauch und Phenole",
      content: `## Die dunkle Seite des Whiskys

**Torfrauch** kann das Aromaprofil eines Whiskys deutlich prägen. Ob rauchige, medizinisch wirkende oder erdige Eindrücke gefallen, ist subjektiv. Solche Beschreibungen belegen weder eine Heilwirkung noch einen exklusiven Geschmack, der in anderen Spirituosen unmöglich wäre.

## Was ist Torf?

**Torf** entsteht aus nur teilweise zersetzten Pflanzenresten in nassen, sauerstoffarmen Mooren. Die Neubildung ist langsam und standortabhängig. Torfmoore speichern Kohlenstoff und unterstützen Ökosysteme. Regionale Pflanzenzusammensetzung kann variieren; „Islay-Rauch schmeckt medizinisch, weil jeder Torf dort viel Seetang enthält“ ist keine belegte universelle Kausalregel.

## Der Torf im Herstellungsprozess

Torfrauch kann beim **Darren** des gekeimten Malzes Rauchbestandteile übertragen. Feuchtigkeit, Rauchkontakt, Dauer und Anlage beeinflussen die Aufnahme. Nicht jede Brennerei nutzt dieselbe Phase oder eine universelle 30-%-Feuchtigkeitsgrenze. Rauchprofil und Reifung sind getrennte Schritte.

## Phenole — Die Chemie des Rauchs

**Phenole** sind die chemischen Verbindungen, die für Rauch- und Torfaromen verantwortlich sind. Der Gesamtphenolgehalt wird in **ppm (Parts per Million)** gemessen — bei Herstellerangaben häufig im **Malz**; auch das fertige Destillat kann analytisch untersucht werden. Die Bezugsprobe muss deshalb genannt sein. Wichtige Phenole: **Guaiacol** — rauchig, medizinisch. **4-Methylguaiacol** — geräuchertes Fleisch. **Kresol** — teerig, medizinisch. **Eugenol** — Nelke, Gewürz (stammt auch aus dem Fass). **Syringol** — süßer Rauch.

## Phenolwerte berühmter Whiskys

Hersteller können einen **Phenolgehalt des Malzes in ppm** angeben. Das ist kein direkter Messwert für die wahrgenommene Rauchigkeit der fertigen Flasche; Destillation und Reifung verändern Zusammensetzung und Eindruck. Octomore steht für stark getorfte Abfüllungen, aber eine veränderliche Weltrekordliste oder ein pauschaler Wert für jede Ausgabe wird nicht festgeschrieben.

## Torf und Nachhaltigkeit

Torfabbau und Verbrennung berühren Kohlenstoffspeicher, Biodiversität und Wasserhaushalt. Der SWA-Ansatz umfasst verantwortlichen Einsatz und Wiederherstellung von Mooren. Ein kleines Produktionsvolumen macht einen Eingriff nicht wirkungsfrei. Ungesicherte Beispiele angeblicher Birken- oder Seegrasexperimente werden nicht als bestehende Branchenlösung ausgegeben.`,
      quiz: [
        {
          "question": "Wie gelangen typische Torfrauchnoten in peated Malt Whisky?",
          "options": [
            "Nur durch die Flaschenfarbe",
            "Durch Rauchkontakt beim Darren des Malzes",
            "Durch Zugabe von Meerwasser",
            "Ausschließlich durch Glycerin"
          ],
          "correct": 1,
          "explanation": "Torfrauch kann beim Trocknen des Malzes Aroma übertragen. Aufnahme und Ablauf sind anlagenabhängig, keine universelle Feuchtigkeitsformel."
        },
        {
          "question": "Was bedeutet eine Herstellerangabe zum Phenolgehalt des Malzes in ppm?",
          "options": [
            "Eine garantierte Rauchigkeitsrangliste aller fertigen Whiskys",
            "Eine Messangabe zum Malz, nicht automatisch zur fertigen Flasche oder Wahrnehmung",
            "Die Anzahl der Reifejahre",
            "Den Alkoholgehalt"
          ],
          "correct": 1,
          "explanation": "PPM-Angaben beziehen sich häufig auf das Malz. Produktion und Reifung verändern Stoffe; sensorische Rauchigkeit ist nicht einfach der Malzwert."
        },
        {
          "question": "Was ist ein Nachhaltigkeitsproblem beim Torfabbau?",
          "options": [
            "Torf wächst zu schnell",
            "Torf ist ein Kohlenstoffspeicher — sein Abbau setzt CO2 frei und Torfmoore regenerieren sich extrem langsam",
            "Torf ist zu billig",
            "Torf hat keinen Einfluss auf den Geschmack"
          ],
          "correct": 1,
          "explanation": "Torfmoore speichern Kohlenstoff und unterstützen Biodiversität und Wasserhaushalt. Torfabbau und -verbrennung können diese Funktionen beeinträchtigen; Neubildung ist langsam."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 18
    // ═══════════════════════════════════════════════════════════
    {
      title: "Altersangaben und NAS-Whiskys",
      content: `## Das Alter — und warum es nicht alles ist

**Altersangaben** auf Whisky-Flaschen sind für viele Konsumenten das wichtigste Qualitätsmerkmal. Doch die Realität ist komplexer: Alter ist ein Indikator, aber keine Garantie für Qualität. Die wachsende Kategorie der **NAS-Whiskys** (No Age Statement) stellt diese Denkweise zunehmend in Frage.

## Was bedeutet die Altersangabe?

Bei **Scotch** bezieht sich eine Altersangabe auf die jüngste Whisky-Komponente; eine 12-jährige Abfüllung enthält keinen jüngeren Scotch. Das Alter zählt die Fassreifung, nicht Zeit im Glasregal. Auch andere Kategorien haben Kennzeichnungsregeln, doch deren Details dürfen nicht ungeprüft gleichgesetzt werden. Die Flaschenlagerung setzt die Fassreifung nicht fort.

## Warum älter nicht automatisch besser ist

Der passende Reifezeitpunkt hängt von Destillat, Fass und Lagerung ab. Mehr Alter kann Komplexität bringen, aber auch einen dominanten Holzeindruck. Eine universelle optimale Altersspanne oder Garantie, dass nur außergewöhnliche Fässer ab 25 Jahren gut sind, existiert nicht. Qualität und persönliche Präferenz lassen sich nicht allein am Alter ablesen.

## NAS-Whiskys — No Age Statement

**NAS / No Age Statement** bedeutet keine angegebene Reifedauer. Ein NAS-Scotch muss trotzdem die gesetzliche Mindestreifung von drei Jahren erfüllen. Blender können verschiedene Alterskomponenten einsetzen. Verfügbarkeit, Preis und gewünschtes Profil können eine Rolle spielen; NAS beweist weder Minderwertigkeit noch Überlegenheit. Alte Marketingprogramme sind keine Beschreibung des gesamten heutigen Sortiments.

## Die Kontroverse

Kritiker argumentieren: NAS dient oft nur als Entschuldigung, jüngeren (billigeren) Whisky zu höheren Preisen zu verkaufen. Ohne Altersangabe fehlt dem Konsumenten eine wichtige **Transparenz-Information**. Manche NAS-Whiskys enthalten sehr junge Komponenten, die durch aktive Fässer (First-Fill Sherry) "maskiert" werden. Befürworter kontern: Alter ist nur ein Faktor — Fassqualität, Destillatcharakter und Blending-Kunst sind ebenso wichtig. Einige der besten Whiskys der Welt haben keine Altersangabe. Die Fixierung auf Zahlen führt zu **Alterssnobismus**, der gute junge Whiskys unfair abwertet.

## Vintage und andere Datierungen

**Vintage** bezeichnet bei Scotch das Destillationsjahr der gesamten Abfüllung. Die Scotch-Kennzeichnungsregeln verlangen zusätzlich Abfülljahr, Alter oder Reifedauer im selben Sichtfeld. Zwei Kalenderjahre allein bestimmen ohne Monatsdaten nicht zwingend das exakt vollendete Alter. **Established** ist eine Gründungsangabe, keine Reifeangabe.`,
      quiz: [
        {
          "question": "Worauf bezieht sich eine Altersangabe auf Scotch Whisky?",
          "options": [
            "Das Durchschnittsalter aller Komponenten",
            "Das Alter des ältesten Whiskys in der Flasche",
            "Das Alter des jüngsten Whiskys in der Flasche",
            "Die Reifedauer in der Flasche"
          ],
          "correct": 2,
          "explanation": "Die Altersangabe bezeichnet bei Scotch die jüngste Whisky-Komponente, nicht den Durchschnitt oder Zeit in der Flasche."
        },
        {
          "question": "Wofür steht NAS?",
          "options": [
            "New Age Spirit",
            "No Age Statement",
            "Natural Aroma Selection",
            "Non-Aged Scotch"
          ],
          "correct": 1,
          "explanation": "NAS steht für 'No Age Statement' — Whiskys ohne Altersangabe auf der Flasche, die dem Master Blender mehr kreative Freiheit geben."
        },
        {
          "question": "Reift Whisky in der Flasche weiter?",
          "options": [
            "Ja, genau wie Wein",
            "Nein, die Reifung endet mit der Abfüllung",
            "Nur bei Cask Strength",
            "Nur die ersten 5 Jahre"
          ],
          "correct": 1,
          "explanation": "Whisky reift nicht in der Flasche weiter. Ein 12-jähriger Whisky bleibt ein 12-Jähriger, egal wie lange er im Regal steht."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 19
    // ═══════════════════════════════════════════════════════════
    {
      title: "Single Cask, Cask Strength, Vintage",
      content: `## Besondere Abfüllungen und ihre Bedeutung

Neben den Standard-Abfüllungen existiert eine faszinierende Welt von **Sonderabfüllungen**, die dem Kenner einzigartige Einblicke in einzelne Fässer, besondere Jahrgänge und die natürliche Stärke des Whiskys bieten. Diese Begriffe zu verstehen ist essentiell für den anspruchsvollen Genuss.

## Single Cask (Einzelfassabfüllung)

Ein **Single Cask** stammt aus einem identifizierten einzelnen Fass, statt für die Abfüllung aus mehreren Fässern zusammengestellt zu werden. Die Angabe garantiert nicht, dass jeder Konsument dieselbe Qualität wahrnimmt. Flaschenzahl und verfügbare Menge hängen von Fassinhalt, Verlusten, Flaschengröße und eventueller Verdünnung ab; ein 200-Liter-Fass ergibt nicht pauschal immer 200–250 Flaschen.

## Cask Strength (Fassstärke)

**Cask Strength / Fassstärke** bedeutet bei Scotch, dass die Alkoholstärke nach der Reifung nicht angepasst wurde. Das kann eine einzelne Fassabfüllung oder einen Blend mehrerer Fässer betreffen. Fassstärke ist keine Garantie für höhere Qualität oder ein „reineres“ Produkt. Verdünnung zum persönlichen Vergleich ist möglich; hohe Stärke bedeutet keine geringeren Alkoholrisiken.

## Small Batch

**Small Batch** ist kein einheitlicher gesetzlicher Qualitätsstandard für alle Whisky-Kategorien. Hersteller definieren Größe und Verfahren unterschiedlich. Eine pauschale Zahl von 5–50 Fässern ist kein verlässlicher Grenzwert; konkrete Angaben müssen beim Produkt geprüft werden.

## Vintage (Jahrgangsabfüllungen)

**Vintage-Abfüllungen** geben das **Destillationsjahr** (und oft das Abfülljahr) an. Sie bieten einen Einblick in den Charakter eines bestimmten Jahrgangs. Faktoren wie Gerste-Ernte, Wasserqualität, Hefekultur und Brennerei-Zustand variieren von Jahr zu Jahr. Vintage-Whiskys von **unabhängigen Abfüllern** (Independent Bottlers) wie **Gordon & MacPhail**, **Signatory Vintage**, **Berry Bros. & Rudd** und **Cadenhead's** sind eine hervorragende Möglichkeit, Brennereien in ungewöhnlichen Abfüllungen zu entdecken.

## Unabhängige Abfüller

**Independent Bottlers** kaufen Fässer direkt von Brennereien und füllen sie unter eigenem Label ab. Vorteile: Zugang zu Brennereien, die sonst keine Single-Cask-Abfüllungen anbieten. Oft **ungefärbt und nicht kühlfiltriert**. Verschiedene Fasstypen und Reifezeiten, die die Brennerei selbst nicht anbietet. Einblicke in den "nackten" Charakter einer Brennerei ohne das Marketing-Polishing der offiziellen Abfüllungen.`,
      quiz: [
        {
          "question": "Was bedeutet 'Single Cask'?",
          "options": [
            "Whisky aus einer einzelnen Brennerei",
            "Whisky aus einem einzigen Fass",
            "Whisky mit nur einer Getreidesorte",
            "Whisky ohne Verschnitt mit Wasser"
          ],
          "correct": 1,
          "explanation": "Single Cask bedeutet, dass der gesamte Whisky in der Flasche aus einem einzigen, identifizierten Fass stammt. Keine Vermählung mit anderen Fässern."
        },
        {
          "question": "Wovon hängt die Flaschenzahl einer Einzelfassabfüllung ab?",
          "options": [
            "Immer nur von einer festen 200–250-Regel",
            "Von verfügbarem Inhalt, Verlusten, Flaschengröße und gegebenenfalls Verdünnung",
            "Nur vom Alter des Etiketts",
            "Nur vom Brennereinamen"
          ],
          "correct": 1,
          "explanation": "Fassgröße allein genügt nicht zur Berechnung. Verdunstung, Restinhalt, Abfüllgröße und Stärke beeinflussen die Zahl."
        },
        {
          "question": "Was machen unabhängige Abfüller (Independent Bottlers)?",
          "options": [
            "Sie brauen eigenen Whisky",
            "Sie kaufen Fässer von Brennereien und füllen sie unter eigenem Label ab",
            "Sie verkaufen nur Standardabfüllungen weiter",
            "Sie produzieren Fässer"
          ],
          "correct": 1,
          "explanation": "Independent Bottlers wie Gordon & MacPhail oder Signatory kaufen einzelne Fässer von Brennereien und füllen sie unter eigenem Label ab, oft ungefärbt und nicht kühlfiltriert."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 20
    // ═══════════════════════════════════════════════════════════
    {
      title: "Whisky-Cocktails: Old Fashioned bis Penicillin",
      content: `## Whisky in der Cocktail-Kultur

Whisky ist eine der **vielseitigsten Cocktail-Zutaten** der Welt. Von den Anfängen der Cocktail-Kultur im 19. Jahrhundert bis zur modernen Cocktail-Renaissance spielen Whisky-basierte Drinks eine zentrale Rolle. Die richtige Auswahl des Whiskys kann einen Cocktail grundlegend verändern.

## Old Fashioned — Der Urvater aller Cocktails

Der **Old Fashioned** ist ein bekannter Spirit-Forward-Klassiker, nicht nachgewiesen der älteste dokumentierte Cocktail überhaupt. Eine Rezeptvariante kombiniert Bourbon oder Rye, Zucker, Bitters, Eis und Zitruszeste. Mengen und Garnitur können variieren. Die Beschreibung dient Cocktailkunde für Erwachsene, nicht einer sicheren Portionsempfehlung.

## Whisky Sour — Der elegante Klassiker

Der **Whiskey Sour** kombiniert Whiskey, Zitronensaft und Zuckersirup. Die IBA nennt als Rezept 45 ml Bourbon, 25 ml Zitronensaft und 20 ml Zuckersirup; Eiweiß ist optional. Wer Ei verwendet, muss Allergene und Lebensmittelhygiene berücksichtigen, vorzugsweise mit pasteurisiertem Eiweiß. Säure und Alkohol machen rohes Ei nicht zuverlässig keimfrei. Ein New York Sour ergänzt einen Weinfloat.

## Manhattan — Eleganz pur

Der **Manhattan** kombiniert Whiskey, süßen Vermouth und Bitters und wird üblicherweise gerührt. Rye oder Bourbon verändern das Profil. Eine einzelne Vermouthmarke ist kein objektiver „Goldstandard“. Rob Roy verwendet Scotch; Rezeptvarianten sind von historischen Erfinderbehauptungen zu unterscheiden.

## Penicillin — Der moderne Klassiker

Der **Penicillin** kombiniert Blended Scotch, Zitrone, Honig und Ingwer mit einem Float aus rauchigem Single Malt. Die IBA beschreibt diese Zusammensetzung und den Float. Der Name ist ein Cocktailname und keine medizinische Wirkung; eine objektive Einstufung als „bedeutendster moderner Cocktail“ wird nicht behauptet.

## Weitere Klassiker

**Mint Julep**, **Rusty Nail**, **Blood & Sand**, **Boulevardier** und **Highball** zeigen weitere Einsatzweisen. Der Whisky-Highball enthält Whisky und Soda, üblicherweise mit Eis. Eine einzelne Marke wie Toki hat nicht nachgewiesen allein den gesamten japanischen Markt oder dessen Kultur verändert.`,
      quiz: [
        {
          "question": "Welche Zutatenfamilie kennzeichnet einen Old Fashioned?",
          "options": [
            "Whisky, Zucker und Bitters",
            "Bier, Milch und Kaffee",
            "Nur Soda ohne Spirituose",
            "Ausschließlich Rotwein"
          ],
          "correct": 0,
          "explanation": "Old Fashioned ist ein bekannter Spirit-Forward-Klassiker. Eine unbelegte Rangfolge als ältester Cocktail ist dafür nicht nötig."
        },
        {
          "question": "Was kennzeichnet den Penicillin-Cocktail?",
          "options": [
            "Ausschließlich Gin und Tonic",
            "Blended Scotch, Zitrone, Honig/Ingwer und ein Float aus rauchigem Single Malt",
            "Eine medizinisch wirksame Antibiotikadosis",
            "Nur Whiskey und Milch"
          ],
          "correct": 1,
          "explanation": "Die IBA beschreibt Scotch, Zitrone, Honig und Ingwer sowie einen Islay-Malt-Float. Der Name begründet keinerlei Heilwirkung."
        },
        {
          "question": "Was ist ein Whisky-Highball?",
          "options": [
            "Whisky mit Soda, üblicherweise auf Eis",
            "Ein heißes Bier",
            "Eine Reifung ohne Fass",
            "Ein Medikament"
          ],
          "correct": 0,
          "explanation": "Highball bezeichnet die Kombination von Whisky und Soda. Eine einzelne Marke oder ein universeller kultureller Wandel ist keine Rezeptvoraussetzung."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 21
    // ═══════════════════════════════════════════════════════════
    {
      title: "Whisky und Food Pairing",
      content: `## Die Kunst der Kombination von Whisky und Speisen

Die folgenden Pairings sind **subjektive praktische Vorschläge**, keine bewiesenen allgemeingültigen Regeln oder Gesundheitsargumente. Ähnliche Aromen und Intensitäten können interessant sein; die persönliche Wahrnehmung entscheidet. Alkoholfreie Begleitung und Verzicht sind gleichwertige Optionen.

## Grundprinzipien des Pairings

Wie beim Wein gelten fundamentale Pairing-Prinzipien: **Komplementär** (gleiche Aromen verstärken sich): Ein sherrygelagerter Whisky mit Schokoladendessert — beide teilen Noten von Trockenfrüchten und Kakao. **Kontrastierend** (Gegensätze ergänzen sich): Ein torfiger Islay Malt mit cremigem Blauschimmelkäse — der Rauch schneidet durch die Fettigkeit. **Intensität matchen**: Ein leichter Lowland-Whisky zu delikaten Meeresfrüchten. Ein kräftiger Cask-Strength-Bourbon zu gegrilltem Steak. Der Whisky sollte das Essen **nicht erschlagen** und umgekehrt.

## Klassische Pairings

**Lachs und Torf**: Geräucherter Lachs mit Islay-Whisky (Laphroaig, Caol Ila) ist ein absoluter Klassiker. Beide teilen rauchige, maritime Noten. **Schokolade und Sherry-Cask**: Dunkle Schokolade (70 %+) mit sherrygereiftem Whisky (Macallan, Aberlour) ist eine himmlische Kombination. Die Tannine der Schokolade harmonieren mit den Sherry-Noten. **Käse und Whisky**: Stilton/Roquefort + Talisker 10. Comte/Gruyere + Highland Park 12. Cheddar + Bourbon (Woodford Reserve). Ziegenkäse + leichter Speyside-Malt.

## Whisky zum Dinner

**Vorspeise**: Austern + Bruichladdich Classic Laddie oder Caol Ila 12 (beide haben maritime Frische). Foie Gras + Sauternes-Finish-Whisky (z.B. Glenmorangie Nectar d'Or). **Hauptgang**: Lamm + Highland Malt (Dalmore, Oban) — die Kräuter des Lamms harmonieren mit würzigen Highland-Noten. Wild + Talisker oder schwerer Speyside-Malt. **Dessert**: Crème Brûlée + Bourbon (die Vanille verbindet). Sticky Toffee Pudding + Balvenie DoubleWood. Obstkuchen + GlenDronach 18.

## Whisky in der Küche

Whisky kann auch als **Kocharom** verwendet werden: **Whisky-Soßen** für Steaks und Wild. **Flambieren** mit Bourbon (Bananas Foster). **Whisky-Butter** zum Verfeinern von Fisch. **Desserts**: Whisky-Trüffel, Whisky-Marmelade, Whisky-Kuchen (besonders beliebt in Schottland: **Dundee Cake** mit Scotch). **Whisky-Marinade**: Bourbon, brauner Zucker, Sojasauce für Grill-Fleisch.

## Pairing-Events organisieren

Planen Sie Speisen, Allergene, freiwillige Teilnahme und **alkoholfreie Alternativen**. Es gibt keine gesundheitlich sichere feste Whiskyportion pro Gang; die Summe mehrerer Gläser zählt. Wasser oder Essen entfernen aufgenommenen Alkohol nicht. Wer fährt oder Alkohol vermeiden soll, braucht eine echte alkoholfreie Option; niemand muss trinken oder schlucken, um Pairing-Ideen kennenzulernen.`,
      quiz: [
        {
          "question": "Welches klassische Pairing kombiniert ähnliche Aromen (komplementär)?",
          "options": [
            "Torfiger Whisky mit Vanilleeis",
            "Geräucherter Lachs mit Islay-Whisky",
            "Bourbon mit Sushi",
            "Lowland-Whisky mit Steak"
          ],
          "correct": 1,
          "explanation": "Geräucherter Lachs und Islay-Whisky teilen rauchige und maritime Aromen — ein klassisches komplementäres Pairing."
        },
        {
          "question": "Was ist das wichtigste Grundprinzip beim Whisky-Food-Pairing?",
          "options": [
            "Immer den teuersten Whisky wählen",
            "Die Intensität von Whisky und Essen sollte zueinander passen",
            "Nur getorften Whisky verwenden",
            "Whisky nur zum Dessert servieren"
          ],
          "correct": 1,
          "explanation": "Die Intensitäten sollten matchen: Leichter Whisky zu delikaten Speisen, kräftiger Whisky zu intensiven Gerichten. Keines sollte das andere erschlagen."
        },
        {
          "question": "Was gehört zu verantwortlicher Planung eines Pairing-Events?",
          "options": [
            "Eine Pflichtportion Whisky pro Gang",
            "Freiwillige Teilnahme und alkoholfreie Alternativen, ohne sichere Trinkdosis zu versprechen",
            "Alle Gäste müssen Alkohol trinken",
            "Wasser macht Alkohol unschädlich"
          ],
          "correct": 1,
          "explanation": "Es gibt keine sichere feste Alkoholportion für ein mehrgängiges Dinner. Wahlfreiheit, geeignete Alternativen und die gesamte Alkoholmenge sind zu berücksichtigen."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 22
    // ═══════════════════════════════════════════════════════════
    {
      title: "Whisky als Wertanlage",
      content: `## Flüssiges Gold — Whisky als alternatives Investment

Whiskyflaschen und Fässer können als Sammlerobjekte gehandelt werden, aber daraus folgt keine Empfehlung zur Geldanlage. Wertentwicklung, Echtheit, Kosten und Verkaufsmöglichkeiten sind unsicher. Dieser Abschnitt erklärt Risiken und Begriffe, keine persönliche Anlageberatung.

## Die Performance

**Renditen sind nicht garantiert.** Ungeprüfte Indexzuwächse, Gold-/Aktienvergleiche und einzelne Auktionsrekorde sind keine belastbare Grundlage für eine erwartete persönliche Rendite. Indexmethodik, Zeitraum, Handelskosten und Liquidität müssten geprüft werden. Vergangene Spitzenpreise lassen sich nicht auf gewöhnliche Flaschen oder ein einzelnes Fass übertragen.

## Was macht einen Whisky wertvoll?

Seltenheit, Nachfrage, Zustand und dokumentierte Herkunft können Sammlerpreise beeinflussen, garantieren aber keinen Gewinn. Alte Bestände stillgelegter Produktionsperioden sind begrenzt; Brennereien können wiedereröffnen. **Brora, Port Ellen und Rosebank** dürfen deshalb nicht als Beleg dafür dienen, dass unter diesen Namen „nie wieder“ Whisky hergestellt wird.

## Investmentstrategien

Bei **Flaschen** zählen Echtheit, Lagerung, Zustand und nachvollziehbare Herkunft. Bei **Fässern** müssen Verkäufer, Fassnummer, Inhalt, Lagerort, Vertrag und laufende Kosten geprüft werden. Die SWA empfiehlt, die Eigentumsübertragung unmittelbar mit dem Lagerhalter zu bestätigen; traditionell dient dazu eine **Delivery Order**, heute können andere akzeptierte Dokumente genügen. Ein Verkaufsvertrag allein garantiert nicht, dass der Lagerhalter den Käufer als Eigentümer anerkennt.

## Die Risiken

Fälschung, Betrug, Verluste, Verdunstung und geringe Liquidität sind reale Risiken, ohne dass eine unbelegte Quote von 20–40 % Fälschungen behauptet wird. Lagerung, Versicherung, Transport, Abfüllung, Steuern und Vermittlung können Kosten verursachen. Fässer können an Volumen oder Stärke verlieren; unter 40 % Vol. wäre eine Abfüllung als Scotch nicht zulässig. Reifung bedeutet keinen automatischen Wertzuwachs.

## Tipps für Einsteiger

Verkäuferunterlagen und Eigentumsnachweis sind unabhängig zu prüfen. Informationen von Handelsplattformen ersetzen weder Authentizitätsprüfung noch fachkundige rechtliche, steuerliche und finanzielle Beratung. Keine Kaufempfehlung folgt aus einem Markennamen, einer Altersangabe oder dem Gedanken, einen Verlust notfalls durch Trinken auszugleichen.`,
      quiz: [
        {
          "question": "Was lässt sich über die Rendite einer Whisky-Anlage sicher sagen?",
          "options": [
            "Sie ist immer höher als Aktien",
            "Ein Gewinn ist nicht garantiert, Kosten und Verkaufsmöglichkeiten müssen geprüft werden",
            "Fassreifung verdoppelt den Wert automatisch",
            "Jede alte Flasche ist eine sichere Anlage"
          ],
          "correct": 1,
          "explanation": "Sammlerpreise und einzelne Rekorde garantieren keine Rendite. Kosten, Echtheit, Nachfrage und Liquidität beeinflussen das Ergebnis."
        },
        {
          "question": "Welche Prüfung ist beim Fasskauf besonders wichtig?",
          "options": [
            "Nur ein schönes Flaschenetikett",
            "Anerkennung der Eigentumsübertragung durch den Lagerhalter",
            "Eine pauschale Gewinnzusage",
            "Nur das Alter des Verkäufers"
          ],
          "correct": 1,
          "explanation": "Die SWA empfiehlt, die registrierte Eigentumsübertragung mit dem Lagerhalter zu klären, etwa durch eine akzeptierte Delivery Order oder andere Dokumente."
        },
        {
          "question": "Warum ist „diese Brennerei produziert nie wieder“ als Wertargument problematisch?",
          "options": [
            "Weil Whisky keinen Namen haben darf",
            "Weil Brennereien wiedereröffnen können und Seltenheit keinen Gewinn garantiert",
            "Weil jedes Fass wertlos ist",
            "Weil nur neue Flaschen existieren"
          ],
          "correct": 1,
          "explanation": "Alte Produktionsbestände können endlich sein, während eine wiedereröffnete Brennerei neuen Whisky produziert. Der Sammlerwert bleibt dennoch unsicher."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 23
    // ═══════════════════════════════════════════════════════════
    {
      title: "Die großen Destillerien Schottlands",
      content: `## Ikonen der Whisky-Welt

Schottische Brennereien zeigen unterschiedliche Produktionsweisen und Profile. Die folgenden Beispiele sind keine objektive Rangliste, kein aktueller Betriebszensus und keine Kaufempfehlung. Stil und tatsächliche Eigenschaften sind an der jeweiligen Abfüllung zu prüfen.

## Macallan — Der Luxus-Ikone

**The Macallan** ist ein Speyside-Hersteller mit ausgeprägter Sherry-seasoned-Fassstrategie. Amerikanische und europäische Eiche werden unter anderem für Double Cask kombiniert. Das ist nicht mit Ex-Bourbon plus Sherry gleichzusetzen. Alte NAS-Programme beschreiben nicht automatisch das gesamte heutige Sortiment; „wertvollster Whisky der Welt“ ist kein zeitloser Qualitätsbegriff.

## Glenfiddich — Der Pionier

**Glenfiddich** ist eine bekannte Speyside-Brennerei und Marke. Sie gehört zu den Wegbereitern der internationalen Single-Malt-Vermarktung. Eine aktuelle weltweite Verkaufsrangliste oder die Behauptung, erstmals überhaupt Single Malt angeboten zu haben, wird hier nicht als Prüfungswissen vorausgesetzt.

## Laphroaig — Der Polarisierer

**Laphroaig** liegt auf Islay und ist für torfgeprägte Abfüllungen bekannt. Medizinisch, rauchig oder süß sind mögliche sensorische Beschreibungen und keine Zusagen für jede Flasche. Historische königliche Auszeichnungen und aktuelle Berechtigungen sind getrennte Angaben; ein allgemeiner Exklusivanspruch auf solche Auszeichnungen wird nicht behauptet.

## Ardbeg — Der Kult

**Ardbeg** ist eine Islay-Brennerei mit bekannten rauchigen Abfüllungen und einer aktiven Fangemeinschaft. Exakte heutige Mitgliederzahlen, Weltbestenlisten und ein immer gleicher Malz-Phenolwert benötigen aktuelle, ausgabenspezifische Belege und werden nicht festgeschrieben.

## Springbank — Das Handwerk

**Springbank** in Campbeltown beschreibt den Weg vom eigenen Mälzen bis zur eigenen Abfüllung. Drei Malts entstehen mit unterschiedlichen Verfahren: **Springbank** wird zweieinhalbfach, **Longrow** zweifach und **Hazelburn** dreifach destilliert. Das belegt die eigene Arbeitsweise, nicht einen ungesicherten Exklusivanspruch gegenüber sämtlichen anderen Brennereien.

## Weitere Legenden

Glenmorangie, Talisker, Highland Park, Dalmore und Lagavulin stehen für weitere regionale Beispiele. Zuordnungen zu leicht, würzig oder rauchig sind nützliche Verkostungsorientierung, aber keine Garantie und keine allgemeine Preis-Leistungs-Rangfolge.`,
      quiz: [
        {
          "question": "Welche der genannten Brennereien liegt in Speyside?",
          "options": [
            "Glenfiddich",
            "Laphroaig",
            "Ardbeg",
            "Springbank"
          ],
          "correct": 0,
          "explanation": "Glenfiddich ist eine Speyside-Brennerei. Eine veränderliche Verkaufsrangliste ist keine Voraussetzung dieser Herkunftszuordnung."
        },
        {
          "question": "Was ist das Besondere an Springbank?",
          "options": [
            "Sie ist die größte Brennerei Schottlands",
            "Sie führt den kompletten Prozess in-house durch — vom Mälzen bis zur Abfüllung",
            "Sie produziert nur Grain Whisky",
            "Sie hat keine Pot Stills"
          ],
          "correct": 1,
          "explanation": "Springbank beschreibt eigene Mälzung, Destillation, Lagerung und Abfüllung. Daraus folgt hier kein Exklusivvergleich mit sämtlichen anderen schottischen Brennereien."
        },
        {
          "question": "Welche der genannten Brennereien ist mit Islay verbunden?",
          "options": [
            "Glenfiddich",
            "Springbank",
            "Laphroaig",
            "Glenmorangie"
          ],
          "correct": 2,
          "explanation": "Laphroaig liegt auf Islay und ist für torfgeprägte Abfüllungen bekannt; aktuelle Auszeichnungen sind davon getrennt zu betrachten."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 24
    // ═══════════════════════════════════════════════════════════
    {
      title: "Whisky-Fehler und Qualitätsprobleme",
      content: `## Wenn Whisky nicht so schmeckt, wie er soll

Nicht jeder Whisky ist perfekt. **Off-Flavours** (Fehlaromen), Produktionsprobleme und umstrittene Praktiken können die Qualität beeinträchtigen. Ein informierter Konsument sollte diese erkennen und einordnen können — denn manchmal ist ein "Fehler" auch Geschmackssache.

## Schwefel — Der häufigste Fehler

Schwefelverbindungen können an Streichholz, Gummi, Kohl oder Ei erinnern. Produktion und Fassbedingungen können beitragen, doch ein einzelner Geruch identifiziert die Ursache nicht sicher. Kupferkontakt kann das Profil beeinflussen. Manche Eindrücke werden je nach Konzentration und Stil unterschiedlich bewertet; eine ganze Marke wird nicht pauschal als fehlerhaft eingestuft.

## Kühlfiltration — Schönheit vs. Geschmack

**Kühlfiltration** kann Bestandteile entfernen, die bei Kälte oder Verdünnung einen Schleier (**Haze**) bilden. Die Scotch-Spezifikation nennt insbesondere langkettige Ester und begrenzt die Filtration auf die Vermeidung solcher Ausflockungen. **46 % Vol. sind keine Garantie** für Trübungsfreiheit und keine gesetzliche Schwelle, ab der Filtration verboten oder automatisch unnötig wäre. Zusammensetzung, Temperatur und Verdünnung zählen. Non-Chill-Filtered ist eine Prozessangabe, kein objektives Qualitätszertifikat.

## Zuckerkulör (E150a)

**E150a / Zuckerkulör** ist für Scotch zur Farbanpassung erlaubt, nicht als Süßungs- oder Aromazutat. **US-Bourbon** erlaubt nach seinem Standard keine zugesetzten Farbstoffe. Kennzeichnungsanforderungen hängen vom Absatzmarkt ab; eine ausnahmslose weltweite Deklarationsregel wird nicht behauptet. Farbe allein beweist kein Alter oder Fassprofil.

## Korkverschluss-Probleme

Ein korkähnlicher Fehlton kann muffig oder kartonartig wirken. Ein Verschlusswechsel allein garantiert nicht die Abwesenheit jeder Kontamination oder jedes Lagerfehlers. Flaschen sollten passend gelagert werden; sichtbare Fremdstoffe, beschädigte Verschlüsse oder unerwartete Gerüche sind Anlass zur Prüfung, nicht zum improvisierten „Reparieren“ des Getränks.

## Weitere Off-Flavours

Seifig, papierartig, metallisch, essigartig oder lösungsmittelartig sind beschreibende Begriffe. Sie sind keine alleinige Diagnose einer bestimmten Produktionsstörung und kein Sicherheitstest. Vergleichsproben und fachkundige Prüfung helfen; bei Verdacht auf Verunreinigung wird nicht weiter konsumiert.`,
      quiz: [
        {
          "question": "Was ist das Ziel der Kühlfiltration?",
          "options": [
            "Den Alkoholgehalt zu senken",
            "Den Whisky klar zu halten, wenn er kalt serviert wird",
            "Bakterien abzutöten",
            "Die Farbe zu verstärken"
          ],
          "correct": 1,
          "explanation": "Kühlfiltration soll Trübungen durch bei Kälte oder Verdünnung ausfallende Bestandteile begrenzen. In der Scotch-Spezifikation ist der zulässige Zweck entsprechend begrenzt."
        },
        {
          "question": "Was ist E150a?",
          "options": [
            "Ein natürlicher Farbstoff aus Trauben",
            "Zuckerkulör, der zur Farbkorrektur von Whisky zugesetzt wird",
            "Ein Konservierungsmittel",
            "Ein Geschmacksverstärker"
          ],
          "correct": 1,
          "explanation": "E150a (Zuckerkulör) wird vielen Whiskys zugesetzt, um eine konsistente Farbe zwischen verschiedenen Batches zu gewährleisten. In Bourbon ist dies verboten."
        },
        {
          "question": "Garantiert eine Abfüllung bei 46 % Vol., dass Whisky niemals trüb wird?",
          "options": [
            "Ja, unabhängig von Temperatur und Verdünnung",
            "Nein, es gibt keine universelle Garantie; Zusammensetzung und Bedingungen zählen",
            "Nur wenn der Korken braun ist",
            "Es ist eine gesetzlich vorgeschriebene Garantie"
          ],
          "correct": 1,
          "explanation": "46 % Vol. sind keine gesetzliche oder naturgesetzliche Trübungsgrenze. Temperatur, Zusammensetzung und Wasserzugabe können den Eindruck verändern."
        }
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // Lektion 25
    // ═══════════════════════════════════════════════════════════
    {
      title: "Die Zukunft des Whiskys — Trends und Innovationen",
      content: `## Wohin steuert die Whisky-Welt?

Die Whisky-Industrie befindet sich in einer Phase dramatischen Wandels. **Tradition trifft Innovation**, etablierte Märkte treffen auf neue Verbrauchergewohnheiten, und globale Herausforderungen wie der Klimawandel zwingen die Branche zum Umdenken. Die kommenden Jahrzehnte werden die Whisky-Landschaft fundamental verändern.

## Nachhaltigkeit und Umwelt

Die aktuelle SWA-Strategie unterscheidet **Dekarbonisierung der eigenen Betriebsabläufe (Scopes 1 und 2) bis 2040** und **Netto-Null über alle drei Emissionsbereiche bis 2045**. Das sind Ziele, keine bereits erreichte Klimaneutralität jeder Flasche. Wärmeversorgung, Energieeffizienz, Wasser und Verpackung gehören zu den Ansatzpunkten. Einzelne Brennereien werden ohne konkrete Belege nicht als vollelektrisch bezeichnet.

## Der Klimawandel als Herausforderung

Veränderte Temperaturen, Niederschläge und Extremereignisse können Rohstoffe, Wasserverfügbarkeit, Lagerbedingungen und Moorökosysteme beeinflussen. Daraus folgt kein fixer Beschleunigungsfaktor für Reifung und kein Versprechen neuer gewinnbringender Herkunftsregionen. Risiken müssen orts- und verfahrensbezogen untersucht werden.

## Technologische Innovationen

Analytik und Prozessdaten können die Qualitätskontrolle unterstützen; neue Hefen und Prozessideen können Profile verändern. Beschleunigte Holzextraktion ist nicht gleichbedeutend mit traditioneller mehrjähriger Reifung und erfüllt nicht automatisch geschützte Whisky-Definitionen. Digitale Herkunftsaufzeichnungen können nützlich sein, machen falsche Eingabedaten aber nicht automatisch wahr oder fälschungssicher.

## Neue Verbrauchermärkte

Nachfrage unterscheidet sich nach Land, Zielgruppe und Zeit. Ohne aktuelle Daten wird keine Region als dauerhaft größter Wachstumsmarkt und keine Generation als einheitlicher Geschmackstyp dargestellt. Menschen mit unterschiedlichen Hintergründen arbeiten in Herstellung, Forschung, Handel und Vermittlung.

## Craft-Destillerien und Innovation

Kleine und größere Hersteller können mit Getreide, Fässern oder lokalen Rohstoffen experimentieren. Eine heutige feste US-Betriebszahl wird ohne datierten Zensus nicht gelehrt. Innovation bleibt an Kategorie- und Herkunftsvorgaben gebunden: Nicht jede exotische Fassvorbelegung ist für Scotch erlaubt und nicht jede schnelle Extraktion ersetzt die Mindestreifung.

## Was bleibt, was sich ändert

Tradition wird immer das **Fundament** des Whiskys bleiben — die Grundprinzipien (Getreide, Wasser, Hefe, Kupfer, Holz, Zeit) sind seit Jahrhunderten bewährt. Aber die Art, wie Whisky **produziert, vermarktet und genossen** wird, wird sich weiter wandeln. Die spannendste Entwicklung: Whisky wird globaler, diverser und experimenteller denn je — ohne seine Seele zu verlieren.`,
      quiz: [
        {
          "question": "Welche Zieljahre unterscheidet die aktuelle SWA-Strategie?",
          "options": [
            "Betrieb 2025, alle Bereiche 2030",
            "Betriebliche Dekarbonisierung 2040, Netto-Null über alle Scopes 2045",
            "Alle Flaschen sind bereits klimaneutral",
            "Eine unveränderliche 2050-Pflicht für jeden Betrieb"
          ],
          "correct": 1,
          "explanation": "Die SWA unterscheidet Betriebsabläufe (Scopes 1 und 2) bis 2040 von Netto-Null über alle drei Emissionsbereiche bis 2045. Ziele sind nicht gleich bereits erreichte Ergebnisse."
        },
        {
          "question": "Was können digitale Provenienzaufzeichnungen leisten?",
          "options": [
            "Jede Fälschung automatisch verhindern",
            "Herkunftswege dokumentieren, aber keine Garantie für die Wahrheit falscher Ausgangsdaten bieten",
            "Den Alkohol entfernen",
            "Fassreifung ersetzen"
          ],
          "correct": 1,
          "explanation": "Digitale Dokumentation kann Nachvollziehbarkeit unterstützen. Sie ersetzt nicht die Prüfung von Produkt, Dokumenten und tatsächlicher Eigentumsübertragung."
        },
        {
          "question": "Was ist bei neuen Reifungsverfahren oder Fassideen zu beachten?",
          "options": [
            "Alles darf automatisch als Scotch bezeichnet werden",
            "Geschützte Definitionen und Mindestreifung gelten weiterhin",
            "Holzextraktion ersetzt rechtlich immer drei Jahre",
            "Neue Technik garantiert höchste Qualität"
          ],
          "correct": 1,
          "explanation": "Innovation hebt Kategorie- und Herkunftsvorgaben nicht auf. Für Scotch gelten unter anderem geeignete Eichenfässer und mindestens drei Jahre Reifung in Schottland."
        }
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════
  // FINAL EXAM — 10 schwere Fragen
  // ═══════════════════════════════════════════════════════════
  finalExam: [
    {
      "question": "Welche Destillationsgrenze gilt für Scotch Whisky?",
      "options": [
        "80 % Vol.",
        "Strikt unter 94,8 % Vol.",
        "96 % Vol.",
        "90 % Vol."
      ],
      "correct": 1,
      "explanation": "Die Scotch Whisky Regulations schreiben eine Destillationsstärke von weniger als 94,8 % Vol. vor. Genau 94,8 % erfüllt diese Grenze nicht."
    },
    {
      "question": "Welche Verbindung wurde in der Karlsson-Friedman-Modellstudie zur Whisky-Verdünnung untersucht?",
      "options": [
        "Vanillin",
        "Ethanol",
        "Guaiacol",
        "Tannin"
      ],
      "correct": 2,
      "explanation": "Die Studie simulierte die Verteilung von Guaiacol in Wasser-Ethanol-Modellgemischen. Die Grenzflächenverteilung änderte sich mit der Konzentration; das ist keine universelle Geschmacks- oder Gesundheitsgarantie."
    },
    {
      "question": "Was ist ein STR-Fass (Shaved, Toasted, Re-charred)?",
      "options": [
        "Ein brandneues Fass aus japanischer Eiche",
        "Ein gebrauchtes Rotweinfass, das innen gehobelt, getoastet und erneut ausgebrannt wird",
        "Ein dreifach genutztes Bourbon-Fass",
        "Ein Fass aus Kastanienholz"
      ],
      "correct": 1,
      "explanation": "STR steht für Shaved, Toasted, Re-charred: ein gebrauchtes Fass wird innen bearbeitet, getoastet und erneut verkohlt. Eine alleinige Erfinder-Zuschreibung ist nicht Teil dieser Definition."
    },
    {
      "question": "Warum werden Ex-Bourbon-Fässer auch für Scotch eingesetzt?",
      "options": [
        "Weil Bourbon schneller reift",
        "Weil das US-Gesetz neue, ausgebrannte Eichenfässer vorschreibt, und die gebrauchten danach an die Scotch-Industrie verkauft werden",
        "Weil Scotch in alten Fässern besser schmeckt",
        "Weil es in Schottland keine Eichen gibt"
      ],
      "correct": 1,
      "explanation": "Bourbon verlangt neue ausgebrannte Eichenfässer. Nach dieser Verwendung können Fässer für andere Spirituosen genutzt werden; Scotch ist nicht grundsätzlich auf gebrauchte Fässer beschränkt."
    },
    {
      "question": "Welche Brennerei produziert drei verschiedene Whisky-Stile (2,5-fach, doppelt und dreifach destilliert) unter einem Dach?",
      "options": [
        "Macallan",
        "Glenfiddich",
        "Springbank",
        "Laphroaig"
      ],
      "correct": 2,
      "explanation": "Springbank produziert drei Stile: Springbank (2,5-fach destilliert, leicht getorft), Longrow (doppelt, schwer getorft) und Hazelburn (dreifach, ungetorft)."
    },
    {
      "question": "Was ist der Hauptunterschied zwischen Single Pot Still Irish Whiskey und Single Malt Scotch?",
      "options": [
        "Single Pot Still verwendet eine Mischung aus gemälzter und ungemälzter Gerste",
        "Single Pot Still wird in Column Stills destilliert",
        "Single Pot Still reift nicht in Fässern",
        "Es gibt keinen Unterschied"
      ],
      "correct": 0,
      "explanation": "Single Pot Still Irish Whiskey verwendet gemälzte und ungemälzte Gerste und stammt aus einer Brennerei. Single Malt Scotch verwendet nur gemälzte Gerste und wird in Pot Stills einer Brennerei destilliert."
    },
    {
      "question": "Was versteht man unter dem 'Cut Point' bei der Destillation?",
      "options": [
        "Den Zeitpunkt, an dem das Fass geöffnet wird",
        "Die Entscheidung, wann vom Vorlauf zum Herzstück und vom Herzstück zum Nachlauf gewechselt wird",
        "Das Abschneiden des Korkens",
        "Die Trennung von Malz und Spelzen"
      ],
      "correct": 1,
      "explanation": "Der Cut Point ist die entscheidende Stelle, an der der Stillman zwischen Foreshots (Vorlauf), Heart (Herzstück) und Feints (Nachlauf) trennt — eine der wichtigsten Qualitätsentscheidungen."
    },
    {
      "question": "Wovon hängt der Angel’s Share eines Fasses ab?",
      "options": [
        "Von einer festen universellen Länderquote",
        "Von Klima, Feuchtigkeit, Fass und Lagerbedingungen",
        "Nur vom Flaschenetikett",
        "Er beträgt immer genau 12 %"
      ],
      "correct": 1,
      "explanation": "Verdunstungsverluste unterscheiden sich nach Fass und Lagerbedingungen. Eine einzelne Quote ist keine allgemeine Garantie für Schottland oder Taiwan."
    },
    {
      "question": "Wie sind Aussagen zu Mizunara-Aromen einzuordnen?",
      "options": [
        "Jede Mizunara-Flasche muss gleich schmecken",
        "Verarbeitung kann anspruchsvoll sein; Aromen und Einwirkdauer sind produktabhängig",
        "Sandelholznoten beweisen exakt 30 Jahre",
        "Mizunara ist eine schottische Pflichtzutat"
      ],
      "correct": 1,
      "explanation": "Mizunara ist ein Fassholz mit möglichen charakteristischen sensorischen Eindrücken. Jahrzehnte sind keine zwingende Voraussetzung für jeden Holzeinfluss, und Aromen sind nicht garantiert."
    },
    {
      "question": "Was gilt für 46 % Vol. und Kühlfiltration?",
      "options": [
        "46 % garantieren stets Klarheit",
        "Es gibt keine universelle Klarheitsgarantie; Temperatur, Zusammensetzung und Verdünnung wirken mit",
        "Kühlfiltration ist oberhalb 46 % gesetzlich verboten",
        "Nur Bourbon kann trüb werden"
      ],
      "correct": 1,
      "explanation": "46 % Vol. sind keine verbindliche Grenze, ab der keinerlei Trübung auftreten kann. Die Scotch-Spezifikation beschreibt Haze und den Zweck der Filtration ohne solche Garantie."
    }
  ],
};
