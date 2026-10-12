import type { Course } from "./akademie";

export const mineralwasserKurs: Course = {
  "slug": "mineralwasser",
  "title": "Wassersommelier",
  "icon": "💧",
  "image": "/images/akademie/mineralwasser.png",
  "description": "Geologie, Mineralstoffe, Etikettenkunde, Sensorik und praktische Wasserberatung verständlich kennenlernen.",
  "color": "from-cyan-400 to-blue-600",
  "difficulty": "Fortgeschritten",
  "duration": "ca. 80 Min.",
  "lessons": [
    {
      "title": "Definition und gesetzliche Grundlagen von Mineralwasser",
      "content": "## Natürliches Mineralwasser: eine gesetzlich definierte Kategorie\n\nNatürliches Mineralwasser stammt aus unterirdischen, vor Verunreinigungen geschützten Wasservorkommen. Es besitzt ursprüngliche Reinheit und ein charakteristisches Profil, das im Rahmen natürlicher Schwankungen konstant bleibt. In Deutschland gilt die **Mineral- und Tafelwasser-Verordnung (Min/TafelWV)**; auf EU-Ebene ist die Richtlinie 2009/54/EG maßgeblich. Daraus folgt keine Rangliste, wonach jedes Mineralwasser sicherer oder gesünder wäre als Trinkwasser.\n\n### Amtliche Anerkennung und Abfüllung\n\nVor dem gewerblichen Verkauf ist eine amtliche Anerkennung erforderlich. Geologische, hydrologische, chemische und mikrobiologische Nachweise dienen der Beurteilung. Die Verordnung legt keine allgemeine Mindestdauer von zwei Jahren und keine pauschale Zahl von 200 Einzeluntersuchungen fest. Mineralwasser für den Verkauf in Fertigpackungen wird am Quellort abgefüllt.\n\n### Behandlung: erlaubt ist nicht dasselbe wie Desinfektion\n\nZulässig sind unter anderem die Abtrennung bestimmter unbeständiger Inhaltsstoffe sowie der Entzug oder Zusatz von CO₂. Die Behandlung mit **ozonangereicherter Luft** darf unter festgelegten Bedingungen Eisen-, Mangan- und Schwefelverbindungen sowie Arsen abtrennen. Sie ist nicht mit einer frei zulässigen Desinfektion gleichzusetzen. Verfahren mit dem Zweck, den Keimgehalt zu verändern, sind untersagt. Auch die zugelassene Fluoridentfernung unterliegt besonderen Bedingungen.\n\n### Etiketten lesen\n\nPflichtangaben umfassen Quellname, Ort der Quellnutzung und den Analysenauszug; je nach Behandlung kommen weitere Hinweise hinzu. Ein Analysedatum oder der Aufdruck „amtlich anerkannt“ sind nicht pauschal als Pflichtangaben vorgeschrieben. Säuglingseignung und Fluoridhinweise sind gesondert geregelt. Grenzwerte aus der Trinkwasserverordnung dürfen nicht ungeprüft auf Mineralwasser übertragen werden.",
      "quiz": [
        {
          "question": "Welche Rechtsgrundlage regelt natürliches Mineralwasser in Deutschland spezifisch?",
          "options": [
            "Nur die Trinkwasserverordnung",
            "Die Mineral- und Tafelwasser-Verordnung",
            "Nur das Arzneimittelgesetz",
            "Nur eine freiwillige Branchenvereinbarung"
          ],
          "correct": 1,
          "explanation": "Die Min/TafelWV regelt natürliches Mineralwasser sowie Quell- und Tafelwasser. Weitere Lebensmittelvorschriften gelten ergänzend."
        },
        {
          "question": "Welche Behandlung kann bei natürlichem Mineralwasser zulässig sein?",
          "options": [
            "Beliebige Chlorierung",
            "UV-Desinfektion zur Keimreduktion",
            "Behandlung mit ozonangereicherter Luft unter gesetzlich festgelegten Bedingungen",
            "Zusatz von Vitaminen"
          ],
          "correct": 2,
          "explanation": "Ozonangereicherte Luft darf bestimmte Inhaltsstoffe unter den Bedingungen von § 6 abtrennen. Eine Desinfektion oder freie Veränderung des Keimgehalts ist damit nicht erlaubt."
        },
        {
          "question": "Was unterscheidet amtliche Anerkennung von einem Werbeversprechen?",
          "options": [
            "Sie beweist medizinische Heilwirkung",
            "Sie prüft die gesetzlichen Anforderungen an natürliches Mineralwasser",
            "Sie garantiert den besten Geschmack",
            "Sie setzt mindestens 1.500 mg/l Mineralstoffe voraus"
          ],
          "correct": 1,
          "explanation": "Die Anerkennung betrifft die gesetzliche Kategorie und ihre Anforderungen, nicht eine allgemeine Gesundheits- oder Geschmacksüberlegenheit."
        }
      ]
    },
    {
      "title": "Geologie und Quellenkunde",
      "content": "## Wie der Untergrund den Wassercharakter prägt\n\nEin **Grundwasserleiter (Aquifer)** ist ein Gesteinskörper, in dessen Hohlräumen sich Grundwasser bewegen kann. Poren in Sand und Kies, Klüfte im Festgestein und erweiterte Lösungshohlräume im Karst bilden unterschiedliche Fließwege. Aufenthaltsdauer, Gesteine, Temperatur und gelöstes CO₂ beeinflussen das Wasserprofil; eine lange Verweilzeit allein beweist weder hohe Mineralisierung noch Freiheit von Verunreinigungen.\n\n### Gesteine und gelöste Bestandteile\n\nKarbonatgesteine wie Kalkstein und Dolomit können Calcium, Magnesium und Hydrogencarbonat zum Wasser beitragen. Gips- und Anhydritlagen können Sulfat liefern. Im kristallinen Grundgebirge sind Grundwässer wegen der geringeren Gesteinslöslichkeit häufig niedriger mineralisiert. Ausnahmen und Mischungen zwischen Grundwasserstockwerken sind möglich. Ein Gesteinsname ist daher keine Garantie für einen bestimmten mg/l-Wert.\n\n### Quellentypen\n\nEine **Schichtquelle** tritt dort aus, wo eine wasserführende Schicht auf eine weniger durchlässige Schicht trifft. Bei einer **artesischen Quelle** liegt die Druckfläche des gespannten Grundwassers über der Geländeoberfläche: Das Wasser kann ohne Pumpen aufsteigen. Klüfte und Karsthohlräume beschreiben die Wasserwege, nicht automatisch die Qualität des späteren Flaschenprodukts.\n\n### In der Beratung\n\nGeologische Geschichten erklären Herkunft, ersetzen aber nicht den Analysenauszug. Für den Vergleich zweier Wässer sind Quelle und konkrete Produktvariante entscheidend. Eine Marke kann unterschiedliche Quellen nutzen. Den Geschmack anschließend unter vergleichbaren Bedingungen selbst verkosten, statt ihn ausschließlich aus der Geologie abzuleiten.",
      "quiz": [
        {
          "question": "Wo bewegt sich Wasser in einem Kluftgrundwasserleiter?",
          "options": [
            "Nur in Plastikrohren",
            "In Rissen und Spalten des Festgesteins",
            "Nur auf der Bodenoberfläche",
            "In vollständig dichtem Gestein"
          ],
          "correct": 1,
          "explanation": "Wasserwegsame Klüfte bilden die Fließwege in einem Kluftgrundwasserleiter."
        },
        {
          "question": "Was kennzeichnet eine artesische Quelle?",
          "options": [
            "Sie führt ausschließlich im Sommer Wasser",
            "Gespanntes Grundwasser kann aufgrund seines Drucks ohne Pumpen an die Oberfläche steigen",
            "Sie muss aus einem Vulkan stammen",
            "Sie ist immer mineralstofffrei"
          ],
          "correct": 1,
          "explanation": "Bei artesischen Verhältnissen liegt die Grundwasserdruckfläche über dem Geländeniveau."
        },
        {
          "question": "Was belegt das konkrete Mineralstoffprofil eines Flaschenwassers?",
          "options": [
            "Allein das Alter des Wassers",
            "Die Farbe der Flasche",
            "Der Analysenauszug der konkreten Quelle und Variante",
            "Der Verkaufspreis"
          ],
          "correct": 2,
          "explanation": "Geologie erklärt Einflussfaktoren; das tatsächliche Profil wird analytisch bestimmt."
        }
      ]
    },
    {
      "title": "Mineralstoffe im Detail: Calcium, Magnesium, Natrium und mehr",
      "content": "## Mineralstoffe lesen und richtig einordnen\n\nDer Analysenauszug nennt charakteristische Bestandteile meist in **mg/l**. Calcium, Magnesium, Natrium und Kalium sind Kationen; Hydrogencarbonat, Sulfat und Chlorid gehören zu den Anionen. Der Trockenrückstand ist eine analytische Kenngröße für gelöste Stoffe, aber nicht schlicht die Summe aller Etikettenwerte.\n\n### Calcium und Magnesium\n\nCalcium erfüllt unter anderem Aufgaben in Knochen und Muskulatur. Die DGE empfiehlt Erwachsenen 1.000 mg Calcium täglich. Calciumreiches Wasser kann zur Zufuhr beitragen; eine Behandlung oder Vorbeugung von Krankheiten darf daraus nicht pauschal abgeleitet werden. Die DGE-Schätzwerte für Magnesium betragen für erwachsene Männer 350 mg, für erwachsene Frauen 300 mg täglich. Mineralstoffgehalt und Trinkmenge bestimmen den tatsächlichen Beitrag.\n\n### Natrium, Hydrogencarbonat und Sulfat\n\nDie freiwillige Angabe **„geeignet für natriumarme Ernährung“** verlangt weniger als 20 mg/l Natrium. Hydrogencarbonat ist chemisch ein Säurepuffer; daraus folgt kein allgemeines Versprechen gegen Sodbrennen oder „Übersäuerung“. Auch Sulfatwerte allein sind kein Anlass, ein gewöhnliches Mineralwasser als Abführmittel zu empfehlen.\n\n### Fluorid: drei Werte nicht verwechseln\n\nFür Mineralwasser gilt ein Fluorid-Höchstgehalt von 5,0 mg/l. Bereits **mehr als 1,5 mg/l** erfordern die Angabe des Gehalts und den Hinweis, dass das Wasser für Säuglinge und Kinder unter sieben Jahren nicht zum regelmäßigen Verzehr geeignet ist. Für die besondere Säuglingsnahrungskennzeichnung gilt dagegen höchstens 0,7 mg/l, neben weiteren Anforderungen.\n\n### Sensorik\n\n„Salzig“, „bitter“, „kreidig“ oder „weich“ sind Verkostungsbeschreibungen. Ihre Wahrnehmung hängt vom gesamten Ionenprofil, CO₂, Temperatur und der Person ab; feste universelle Geschmacksschwellen sind hier nicht angegeben.",
      "quiz": [
        {
          "question": "Welcher Natriumwert gilt für die Angabe „geeignet für natriumarme Ernährung“?",
          "options": [
            "Weniger als 10 mg/l",
            "Weniger als 20 mg/l",
            "Höchstens 200 mg/l",
            "Jeder Natriumwert"
          ],
          "correct": 1,
          "explanation": "Anlage 6 der Min/TafelWV verlangt weniger als 20 mg/l. Das ist von der inklusiven Säuglingsgrenze zu unterscheiden."
        },
        {
          "question": "Wie wird der Calciumbeitrag eines Wassers berechnet?",
          "options": [
            "Nur anhand der Marke",
            "Calciumgehalt in mg/l multipliziert mit der getrunkenen Literzahl",
            "Aus der Flaschenfarbe",
            "Aus dem Kohlensäuregrad"
          ],
          "correct": 1,
          "explanation": "300 mg/l Calcium in 0,5 l Wasser ergeben beispielsweise 150 mg Calcium; dies ist keine medizinische Dosierung."
        },
        {
          "question": "Wann ist der besondere Fluoridwarnhinweis erforderlich?",
          "options": [
            "Erst ab 10 mg/l",
            "Bei jedem nachweisbaren Fluoridwert",
            "Bei mehr als 1,5 mg/l: nicht zum regelmäßigen Verzehr für Säuglinge und Kinder unter 7 Jahren geeignet",
            "Nur bei zugesetztem Fluorid"
          ],
          "correct": 2,
          "explanation": "Der Warnschwellenwert von mehr als 1,5 mg/l ist nicht der Höchstgehalt von 5,0 mg/l und nicht die Säuglingsgrenze von 0,7 mg/l."
        }
      ]
    },
    {
      "title": "Kohlensäure: Herkunft, Wirkung und Sensorik",
      "content": "## Kohlensäure: Chemie, Kennzeichnung und Empfinden\n\nGelöstes Kohlendioxid steht mit Kohlensäure, Hydrogencarbonat und Protonen im Gleichgewicht. Temperatur und Druck beeinflussen, wie viel CO₂ im Wasser gelöst bleibt. Beim Öffnen sinkt der Druck; Erwärmung begünstigt den Gasverlust. Die oft genannte Löslichkeit unter CO₂-Atmosphäre darf nicht mit der Löslichkeit unter gewöhnlicher Luft verwechselt werden.\n\n### Drei rechtliche CO₂-Bezeichnungen\n\n**Natürliches kohlensäurehaltiges Mineralwasser** besitzt nach Behandlung und Abfüllung denselben Gehalt an eigenem CO₂ wie am Quellaustritt; zulässige technische Ausgleiche sind möglich. **Mit eigener Quellkohlensäure versetzt** bedeutet, dass CO₂ aus demselben Quellvorkommen den ursprünglichen Gehalt erhöht. **Mit Kohlensäure versetzt** bezeichnet den Zusatz von CO₂ anderer Herkunft. Eigene Quellkohlensäure muss nicht pauschal vulkanisch sein.\n\n### Still, Medium und Classic\n\nDiese handelsüblichen Varianten beschreiben eine Abstufung der Perlung. Es gibt keinen allgemeinen gesetzlichen CO₂-Korridor, der für jede als „Medium“ bezeichnete Flasche gilt. Herstellerangaben und Verkostung sind für den konkreten Vergleich geeigneter als starre Zahlen.\n\n### Was spüren wir?\n\nKohlensäure erzeugt Geschmack und Mundgefühl. Eine experimentelle Studie an Mäusen zeigte eine Rolle säureempfindlicher Geschmackszellen und des Enzyms Carboanhydrase IV. Das ist nicht dasselbe wie der Beweis, das menschliche Prickeln werde ausschließlich über Schmerzrezeptoren wahrgenommen. Bläschengröße und Perlung hängen auch vom Glas, seinen Oberflächen und der Temperatur ab; feinere Bläschen beweisen keine höhere Reinheit oder Sicherheit.\n\nFür empfindliche Personen kann stilles Wasser angenehmer sein. Allgemeine Verdauungs-, Knochen- oder Leistungsversprechen werden aus dem CO₂-Gehalt nicht abgeleitet.",
      "quiz": [
        {
          "question": "Was beeinflusst den CO₂-Verlust nach dem Öffnen?",
          "options": [
            "Nur die Etikettenfarbe",
            "Druckabfall und Temperatur",
            "Nur das Herkunftsland",
            "Nur der Natriumwert"
          ],
          "correct": 1,
          "explanation": "Beim Öffnen fällt der Druck. Erwärmung begünstigt, dass gelöstes CO₂ entweicht."
        },
        {
          "question": "Was bedeutet „mit eigener Quellkohlensäure versetzt“?",
          "options": [
            "CO₂ aus demselben Quellvorkommen erhöht den ursprünglichen Gehalt",
            "Der Quellgehalt bleibt zwingend unverändert",
            "Es wurde beliebiges Industrie-CO₂ zugesetzt",
            "Es ist ein Heilwasser"
          ],
          "correct": 0,
          "explanation": "§ 8 Absatz 3 beschreibt einen höheren CO₂-Gehalt nach Zusatz aus dem gleichen Quellvorkommen."
        },
        {
          "question": "Wie ist „Medium“ beim Mineralwasser einzuordnen?",
          "options": [
            "Als ein für alle Marken gesetzlich festgelegter mg/l-Korridor",
            "Als Handelsbezeichnung; der konkrete CO₂-Gehalt ist produktabhängig",
            "Als Wasser ohne CO₂",
            "Als Arzneimittelkategorie"
          ],
          "correct": 1,
          "explanation": "Die rechtlichen Herkunftsbezeichnungen für CO₂ sind von handelsüblichen Varianten wie Medium zu unterscheiden."
        }
      ]
    },
    {
      "title": "Natürliches Mineralwasser, Quellwasser und Tafelwasser im Vergleich",
      "content": "## Mineralwasser, Quellwasser, Tafelwasser und Trinkwasser\n\nDie Kategorien unterscheiden sich in Herkunft, Herstellung und gesetzlichen Anforderungen. Sie bilden keine pauschale Qualitäts- oder Gesundheitshierarchie.\n\n### Natürliches Mineralwasser\n\nAmtliche Anerkennung, ursprüngliche Reinheit, ein charakteristisches weitgehend konstantes Profil und Abfüllung am Quellort kennzeichnen diese Kategorie. Ein besonders hoher Mineralgehalt ist keine allgemeine Voraussetzung.\n\n### Quellwasser\n\nAuch Quellwasser stammt aus unterirdischen Wasservorkommen und wird für Fertigpackungen am Quellort abgefüllt. Es benötigt keine amtliche Mineralwasseranerkennung. Die Min/TafelWV enthält Vorgaben zur Gewinnung, Behandlung und mikrobiologischen Qualität; ergänzend gelten Anforderungen der Trinkwasserverordnung. „Nur TrinkwV“ wäre deshalb unvollständig.\n\n### Tafelwasser\n\nTafelwasser kann aus Trinkwasser, Mineralwasser und weiteren ausdrücklich zulässigen Zutaten hergestellt werden. Zulässige Salze und Zutaten sind geregelt; es handelt sich nicht um eine beliebige Mischung. Ein Quellbezug ist nicht erforderlich. Mineralwasserähnliche oder täuschende Herkunftsangaben sind unzulässig. Selbst gesprudeltes Leitungswasser wird im Alltag nicht allein durch den Sprudler automatisch zu einem gewerblich definierten Tafelwasserprodukt.\n\n### Mineralisierung\n\nFreiwillige Angaben nach Anlage 6 sind unter anderem: „mit sehr geringem Gehalt an Mineralien“ bei höchstens 50 mg/l Trockenrückstand, „mit geringem Gehalt“ bei höchstens 500 mg/l sowie „mit hohem Gehalt“ bei mehr als 1.500 mg/l. „Mittel mineralisiert“ ist eine praktische Vergleichsbeschreibung, keine entsprechende gesetzliche Auslobung. Eine hohe Mineralisierung sagt allein nichts über Reinheit aus.\n\nFür Leitungswasser sind auch Hausinstallation und örtliche Hinweise wichtig. Im Handel die jeweilige Produktbezeichnung erklären, ohne Trinkwasser pauschal abzuwerten.",
      "quiz": [
        {
          "question": "Welches Merkmal benötigt natürliches Mineralwasser, Quellwasser aber nicht?",
          "options": [
            "Ein Glasgebinde",
            "Amtliche Anerkennung als natürliches Mineralwasser",
            "Kohlensäure",
            "Einen Mindestgehalt von 500 mg/l"
          ],
          "correct": 1,
          "explanation": "Die amtliche Anerkennung ist ein wesentlicher Unterschied. Auch Quellwasser unterliegt konkreten Anforderungen."
        },
        {
          "question": "Wie sind Zutaten für Tafelwasser geregelt?",
          "options": [
            "Alle Salze dürfen beliebig zugesetzt werden",
            "Es sind nur die gesetzlich zulässigen Zutaten und Verfahren erlaubt",
            "Tafelwasser ist immer unverändertes Quellwasser",
            "Tafelwasser muss an einer Mineralquelle abgefüllt werden"
          ],
          "correct": 1,
          "explanation": "§ 11 der Min/TafelWV begrenzt die verwendbaren Zutaten und enthält weitere Anforderungen."
        },
        {
          "question": "Wann ist die Angabe „mit hohem Gehalt an Mineralien“ möglich?",
          "options": [
            "Ab 50 mg/l Trockenrückstand",
            "Ab 500 mg/l",
            "Bei mehr als 1.500 mg/l",
            "Nur bei Heilwasser"
          ],
          "correct": 2,
          "explanation": "Anlage 6 nennt für diese freiwillige Angabe einen Trockenrückstand von mehr als 1.500 mg/l."
        }
      ]
    },
    {
      "title": "Deutsche Mineralwasserregionen und ihre Charakteristik",
      "content": "## Deutsche Regionen: Herkunft erklären, Etiketten vergleichen\n\nDeutschlands unterschiedliche Gesteinsformationen ermöglichen vielfältige Grundwasserprofile. Ein Bundesland oder eine Landschaft ist jedoch keine einheitliche „Wassersorte“. Grundwasserstockwerke, Fließwege und Quellnutzungen können sich auf engem Raum unterscheiden.\n\n### Eifel und andere vulkanisch geprägte Gebiete\n\nVulkanisch geprägte Landschaften sind bekannte Mineralwasserregionen. Als konkretes Beispiel stammt **Gerolsteiner Naturell** laut Hersteller aus einer eigenen Quellnutzung in der Vulkaneifel. Sein Profil ist nicht identisch mit Sprudel und Medium derselben Marke. Die heute veröffentlichte Naturell-Analyse nennt 125 mg/l Calcium, 44 mg/l Magnesium und 17 mg/l Natrium. Markenwerte aus verschiedenen Varianten dürfen nicht vermischt werden.\n\n### Kalk, Sandstein und kristallines Grundgebirge\n\nKarbonatgesteine der Alb können Calcium und Hydrogencarbonat zum Grundwasser beitragen. Sulfat ist dagegen nicht automatisch eine Folge von Kalkstein, sondern hängt etwa von sulfathaltigen Gesteinslagen ab. In Sandsteinregionen und im kristallinen Grundgebirge sind ebenfalls sehr unterschiedliche Wasserprofile möglich. Das Bayerische Landesamt für Umwelt beschreibt für das Grundgebirge überwiegend gering mineralisierte Wässer, aber ausdrücklich auch höher mineralisierte Ausnahmen.\n\n### Eine regionale Verkostung vorbereiten\n\nQuellort, konkrete Variante und Analysenauszug für jede Flasche notieren. Möglichst nicht nur Marken mit unterschiedlicher Herkunft, sondern auch unterschiedliche Profile auswählen. Regionale Nähe kann die Transportwege verkürzen; sie beweist nicht automatisch die günstigste gesamte Ökobilanz.\n\nSuperlative wie „reinste Quelle Europas“, feste Quellenzahlen und ungesicherte Brunnendichte-Ranglisten sind für eine sachliche Herkunftsberatung nicht nötig.",
      "quiz": [
        {
          "question": "Warum können zwei Varianten derselben Marke verschiedene Profile haben?",
          "options": [
            "Mineralstoffe werden stets beliebig zugesetzt",
            "Sie können aus unterschiedlichen Quellnutzungen stammen",
            "Stilles Wasser enthält grundsätzlich keine Mineralstoffe",
            "Das Etikett ist immer identisch"
          ],
          "correct": 1,
          "explanation": "Gerolsteiner beschreibt Naturell ausdrücklich als andere Quellnutzung als Sprudel und Medium."
        },
        {
          "question": "Welche Zuordnung ist ohne konkreten Nachweis unzulässig?",
          "options": [
            "Quellort vom Etikett übernehmen",
            "Analysenauszug der Variante lesen",
            "Kalkstein grundsätzlich mit hohem Sulfatgehalt gleichsetzen",
            "Regionale Profile vergleichen"
          ],
          "correct": 2,
          "explanation": "Sulfat hängt vom konkreten Gesteins- und Fließsystem ab; Kalkstein allein begründet diese Aussage nicht."
        },
        {
          "question": "Welche Natriumangabe veröffentlicht der Hersteller für Gerolsteiner Naturell bei dieser Quellenprüfung?",
          "options": [
            "17 mg/l",
            "410 mg/l",
            "564 mg/l",
            "0 mg/l"
          ],
          "correct": 0,
          "explanation": "Die am 12.10.2026 gelesene Produktseite nennt 17 mg/l. Für spätere Käufe sind aktuelle Etiketten maßgeblich."
        }
      ]
    },
    {
      "title": "Europäische und internationale Premiumwässer",
      "content": "## Internationale Wässer sachlich vergleichen\n\n„Premium“ ist eine Marktpositionierung, keine einheitliche gesetzliche Reinheitsklasse. Herkunft, Gebinde, Vertrieb und Markenauftritt beeinflussen den Preis. Ein teures oder weit transportiertes Wasser ist dadurch weder gesünder noch sensorisch für jede Person besser.\n\n### Beispiel: evian\n\nDie Herstellerseite beschreibt die Herkunft aus den französischen Alpen. Sie nennt für das dort beschriebene Wasser einen **Trockenrückstand bei 180 °C von 345 mg/l**, 80 mg/l Calcium, 26 mg/l Magnesium und 6,5 mg/l Natrium. Diese Analyse ersetzt frühere oder anders ermittelte Zahlen nicht automatisch: Trockenrückstand, elektrische TDS-Schätzung und Summe der Ionen sind unterschiedliche Kenngrößen.\n\n### Internationale Auswahl\n\nFür eine Verkostung können Wässer aus Frankreich, Italien, Skandinavien oder weiteren Regionen gegenübergestellt werden. Maßgeblich sind jeweils die konkrete Quelle, Variante und rechtliche Produktkategorie. Regen-, Gletscher- oder aufbereitetes Wasser ist nicht allein aufgrund einer Herkunftsgeschichte natürliches Mineralwasser. Nationale Anerkennungen und tatsächliche Kennzeichnung müssen getrennt von Werbebegriffen betrachtet werden.\n\n### Sensorik und Nachhaltigkeit\n\n„Leicht“, „rund“, „salzig“ und „kräftig“ sind mögliche Verkostungseindrücke, keine weltweit verbindlichen Markenattribute. Blindverkostung kann helfen, Design- und Preiseffekte auszublenden. Bei der Auswahl auch Transport, Verpackung und Mehrwegsystem berücksichtigen.\n\nFür internationale Premiummarken werden hier keine ungesicherten Heilwirkungen, Sauerstoffvorteile oder „reinste Welt“-Ranglisten übernommen. Preise und Unternehmenszugehörigkeiten sind zeitabhängig und sollten für den konkreten Einkauf aktuell geprüft werden.",
      "quiz": [
        {
          "question": "Was bedeutet „Premium“ bei Wasser automatisch?",
          "options": [
            "Medizinisch nachgewiesene Überlegenheit",
            "Eine gesetzliche Garantie maximaler Reinheit",
            "Keine solche Garantie; es ist eine Marktpositionierung",
            "Mindestens 1.500 mg/l Mineralstoffe"
          ],
          "correct": 2,
          "explanation": "Premium ist keine einheitliche Rechtskategorie wie natürliches Mineralwasser."
        },
        {
          "question": "Welchen Trockenrückstand bei 180 °C nennt die geprüfte evian-Herstellerseite?",
          "options": [
            "44 mg/l",
            "345 mg/l",
            "2.527 mg/l",
            "Über 5.000 mg/l"
          ],
          "correct": 1,
          "explanation": "Die gelesene Herstelleranalyse nennt 345 mg/l. Messverfahren und Produktvariante gehören zu jeder Zahlenangabe."
        },
        {
          "question": "Was hilft bei einem fairen internationalen Vergleich?",
          "options": [
            "Nur der Flaschenpreis",
            "Gleiche Verkostungsbedingungen und Prüfung der konkreten Quelle und Variante",
            "Nur die Flaschenform",
            "Ein hoher pH-Wert als Gesundheitsbeweis"
          ],
          "correct": 1,
          "explanation": "Analyse, Kategorie und eigene Sensorik sind aussagekräftiger als Design oder pauschale Gesundheitsversprechen."
        }
      ]
    },
    {
      "title": "Der Beruf des Wassersommeliers",
      "content": "## Wassersommelier: Wissen vermitteln und Grenzen kennen\n\nWasserberatung verbindet Herkunftswissen, Etikettenkunde, Sensorik und Service. Daraus folgt weder eine medizinische Beratungskompetenz noch eine rechtliche Zertifizierung jeder Empfehlung.\n\n### Externe Qualifikation\n\nDoemens in Gräfelfing bietet eine Wassersommelier-Ausbildung an. Die heute gelesene Veranstaltungsseite datiert den Beginn der Ausbildung auf **2011** und beschreibt ab Herbst 2026 ein Hybridformat mit Online- und Präsenzanteilen. Kursformate, Prüfungen und Termine bitte direkt beim Anbieter prüfen. Diese Jammers-Lerneinheit ist keine Doemens-Ausbildung, keine gleichwertige externe Qualifikation und kein Nachweis einer persönlichen Fachprüfung durch Doemens.\n\n### Kompetenzbereiche\n\nSensorisches Training unterstützt die Beschreibung von Perlung, Geschmack und Mundgefühl. Hydrogeologisches Wissen erklärt mögliche Herkunftseinflüsse. Lebensmittelkunde hilft, Mineral-, Quell- und Tafelwasser korrekt zu unterscheiden. Für konkrete Analysewerte ist das Etikett entscheidend; selbst ein geschulter Gaumen kann nicht jedes Ion oder Herkunftsgestein zuverlässig blind bestimmen.\n\n### Service als Praxiskonzept\n\nFür Vergleichsverkostungen gleichartige, geruchsfreie Gläser und ähnliche Temperaturen verwenden. Als Startpunkte kann man stille Wässer weniger kalt als stark prickelnde Wässer servieren; **12–14 °C bzw. 8–10 °C sind hier Haus-Praxistipps**, keine verbindlichen Normen. Gastwünsche und das Verkostungsziel gehen vor.\n\nArbeitsfelder können Handel, Gastronomie, Schulung und Produktkommunikation sein. Pauschale Gehaltsversprechen oder nicht überprüfte Restaurantlisten sagen wenig über konkrete Beschäftigungsmöglichkeiten aus.",
      "quiz": [
        {
          "question": "Welche Institution bietet den in der Quelle beschriebenen externen Wassersommelier-Lehrgang an?",
          "options": [
            "Die Deutsche Barkeeper-Union",
            "Doemens in Gräfelfing",
            "Diese Website als gleichwertige Doemens-Ausbildung",
            "Eine beliebige Mineralwassermarke"
          ],
          "correct": 1,
          "explanation": "Doemens beschreibt den externen Lehrgang auf seiner eigenen Veranstaltungsseite."
        },
        {
          "question": "Welche Reihenfolge ist ein möglicher Haus-Praxistipp für ein Tasting?",
          "options": [
            "Zwingend alphabetisch",
            "Von zurückhaltenden zu intensiveren Proben",
            "Immer das teuerste Wasser zuerst",
            "Ohne Rücksicht auf das Verkostungsziel"
          ],
          "correct": 1,
          "explanation": "Die Steigerung kann den Vergleich erleichtern, ist aber keine gesetzliche oder universelle Verkostungsnorm."
        },
        {
          "question": "Wie sind die genannten Serviertemperaturen einzuordnen?",
          "options": [
            "Als verbindliche EU-Vorschrift",
            "Als praktische Startpunkte, die an Gast und Verkostungsziel angepasst werden",
            "Als medizinische Grenzwerte",
            "Als amtliche Anerkennungskriterien"
          ],
          "correct": 1,
          "explanation": "Die Temperaturen sind Haus-Praxistipps. Sie werden nicht als allgemeingültige optimale Werte ausgegeben."
        }
      ]
    },
    {
      "title": "Sensorik und professionelle Wasserverkostung",
      "content": "## Systematische Wasserverkostung\n\nWasserprofile können sich im Geschmack und Mundgefühl unterscheiden. Eine reproduzierbare Verkostung beschreibt Beobachtungen, ohne aus ihnen sofort Inhaltsstoffgehalte oder Sicherheit abzuleiten.\n\n### Optik und Geruch\n\nKlarheit, Farbe und bei prickelndem Wasser die Perlung notieren. Bläschen entstehen auch an Oberflächen und kleinen Unregelmäßigkeiten im Glas; ein feiner Bläschenstrom ist kein Reinheitsbeweis. Ein fremder Geruch oder eine unerwartete Trübung ist Anlass, die Flasche nicht weiter auszuschenken und zu reklamieren. Geruch allein bestimmt weder den Keim noch die chemische Ursache.\n\nSulfat ist nicht mit einem Schwefelwasserstoffgeruch gleichzusetzen. Ebenso beweist ein als „erdig“ beschriebener Eindruck keinen Silikatgehalt. Einzelne Ionen sind keine verlässlichen Duftmarker.\n\n### Geschmack und Mundgefühl\n\nMögliche Beschreibungen sind salzig, säuerlich, bitter, mineralisch, weich oder kreidig. „Mineralisch“ und „weich“ sind sensorische Begriffe, keine zusätzlichen amtlichen Grundgeschmäcker. Das Gesamtprofil und persönliche Empfindlichkeit entscheiden; fixe Wahrnehmungsschwellen werden hier nicht behauptet.\n\n### Haus-Verkostungsablauf\n\nGeruchsfreien Raum, saubere gleiche Gläser und vergleichbare Temperaturen wählen. Erst ansehen und riechen, dann einen kleinen Schluck nehmen. **Attack** bezeichnet hier den ersten Eindruck, **Finish** den Nachhall. Notizen zu Intensität, Perlung und Gefallen getrennt halten. Bei Blindproben nur Nummern vergeben und das Etikett erst anschließend aufdecken.\n\nDas Ergebnis beschreibt diese Verkostung. Es ersetzt keine Laboranalyse und keinen medizinischen oder mikrobiologischen Qualitätsnachweis.",
      "quiz": [
        {
          "question": "Was kann eine Verkostung nicht zuverlässig ersetzen?",
          "options": [
            "Eine persönliche Geschmacksbeschreibung",
            "Den Vergleich der Perlung",
            "Eine Laboranalyse der Inhaltsstoffe oder Sicherheit",
            "Notizen zum Mundgefühl"
          ],
          "correct": 2,
          "explanation": "Sensorische Eindrücke sind keine Messung von mg/l-Werten oder Krankheitserregern."
        },
        {
          "question": "Was bedeuten „mineralisch“ und „weich“ in einer Verkostungsnotiz?",
          "options": [
            "Amtliche Reinheitsklassen",
            "Beschreibungen des persönlichen Sinneseindrucks",
            "Nachgewiesene Heilwirkungen",
            "Eine genaue Bestimmung des Gesteins"
          ],
          "correct": 1,
          "explanation": "Diese Begriffe helfen beim Beschreiben, sollten aber nicht als chemische Beweise ausgegeben werden."
        },
        {
          "question": "Was beschreibt „Attack“ im hier vorgeschlagenen Ablauf?",
          "options": [
            "Den Quellort",
            "Den ersten sensorischen Eindruck eines Schlucks",
            "Das Mindesthaltbarkeitsdatum",
            "Eine Laborprüfung"
          ],
          "correct": 1,
          "explanation": "Attack steht in dieser Verkostungssprache für den Auftakt; Finish für den Nachhall."
        }
      ]
    },
    {
      "title": "Water Tasting: Konzeption und Durchführung",
      "content": "## Water Tasting als gut vergleichbare Übung\n\nEin Tasting kann Herkunft, Mineralisierung und Kohlensäure anschaulich machen. Gruppengröße, verfügbare Zeit und Erfahrung bestimmen die Auswahl. Die folgenden Mengen und Abläufe sind **Organisationsbeispiele**, keine empirisch festgelegten Optimalwerte.\n\n### Formate und Dramaturgie\n\nEine geführte Probe kann etwa fünf bis acht Wässer umfassen; eine kurze Blindprobe entsprechend weniger. Auch eine Themenprobe — gleiche Marke in mehreren Varianten oder unterschiedliche regionale Quellen — ist möglich. Bei gleicher Marke prüfen, ob die Varianten tatsächlich dieselbe Quelle nutzen. Sonst werden Mineralisierung und CO₂ zugleich verändert.\n\n### Material und Hygiene\n\nGleiche, saubere und geruchsfreie Gläser erleichtern den Vergleich. Glas ist als Hausstandard gut geeignet; lebensmittelgeeigneter Kunststoff ist nicht grundsätzlich unsicher. Insbesondere PET wird ohne die früher hier behaupteten Weichmacher hergestellt. Materialneutralität und hygienisch einwandfreie Nutzung sind die entscheidenden Kriterien.\n\nFlaschen kurz vor der Probe öffnen, hygienisch ausschenken und Reste verschlossen kühlen. Für den Vergleich ein zurückhaltendes Wasser bereithalten. Brot oder Cracker sind eine optionale Begleitung, kein garantierter physiologischer „Reset“.\n\n### Moderation und Notizen\n\nMit einem Kontrastpaar starten, Beschreibungen sammeln und erst danach Herkunft und Analyse zeigen. Niemand muss einen Unterschied erkennen oder die gleiche Vorliebe haben. Die Reihenfolge kann von mild nach kräftig führen, sollte aber zum Ziel passen.\n\nKleine Probemengen, etwa 50–80 ml, sind ein praktischer Startpunkt. Pausen und die gewünschte Gesamtdauer sind wichtiger als die Behauptung, ab der neunten Probe sei jeder Gaumen zwangsläufig überfordert.",
      "quiz": [
        {
          "question": "Wie ist eine Auswahl von fünf bis acht Wässern einzuordnen?",
          "options": [
            "Als zwingende wissenschaftliche Obergrenze",
            "Als anpassbares Organisationsbeispiel",
            "Als Mindestvorgabe der Min/TafelWV",
            "Als Heilwasserdosierung"
          ],
          "correct": 1,
          "explanation": "Die Zahl ist ein Haus-Praxistipp und wird an Zeit, Publikum und Verkostungsziel angepasst."
        },
        {
          "question": "Was kann ein Kontrastpaar zu Beginn leisten?",
          "options": [
            "Es beweist, dass alle Personen dieselben Unterschiede erkennen",
            "Es bietet einen gemeinsamen Ausgangspunkt für Beschreibungen",
            "Es ersetzt alle weiteren Proben",
            "Es bestätigt die Reinheit"
          ],
          "correct": 1,
          "explanation": "Ein Kontrastpaar hilft beim Beschreiben; das Ergebnis bleibt eine individuelle Wahrnehmung."
        },
        {
          "question": "Warum sind geruchsfreie, gleichartige Gläser sinnvoll?",
          "options": [
            "Sie garantieren eine Gesundheitswirkung",
            "Sie verringern Einflüsse des Gefäßes auf den Vergleich",
            "Sie messen den Natriumgehalt",
            "Sie sind gesetzlich das einzig erlaubte Material"
          ],
          "correct": 1,
          "explanation": "Einheitliche Gefäße machen einen Vergleich fairer. Lebensmittelgeeigneter Kunststoff wird nicht pauschal als gefährlich dargestellt."
        }
      ]
    },
    {
      "title": "Food Pairing: Wasser und Speisen perfekt kombinieren",
      "content": "## Wasser und Speisen gemeinsam verkosten\n\nFood Pairing ist eine praktische Genussentscheidung. Was gut passt, hängt von Rezeptur, Temperatur, persönlichem Geschmack und dem konkreten Wasser ab. Die folgenden Vorschläge sind **Haus-Verkostungsansätze**, keine medizinischen oder universellen Regeln.\n\n### Drei Ansatzpunkte\n\n**Zurückhaltung**: Ein stilles, mild wirkendes Wasser kann feine Speisen begleiten, ohne viel zusätzlichen Reiz zu setzen. **Ergänzung**: Ein kräftigeres Wasser kann neben einer intensiv gewürzten Speise interessant sein. **Kontrast**: Unterschiedliche Texturen und Perlung können bewusst gegenübergestellt werden.\n\n### Kohlensäure als Sinnesreiz\n\nStill, leicht prickelnd und stark prickelnd erzeugen unterschiedliche Mundgefühle. Einige Gäste empfinden prickelndes Wasser zu reichhaltigen Speisen als frisch; andere bevorzugen stilles Wasser. CO₂ spaltet das Speisefett nicht chemisch. Eine garantierte mechanische Entfernung eines „Fettfilms“ wird hier ebenfalls nicht behauptet.\n\n### Praktische Vergleichsprobe\n\nZu Fisch oder Austern zunächst ein mildes stilles Wasser probieren und mit einer prickelnden Alternative vergleichen. Zu Käse oder gegrillten Speisen kann ein intensiveres Wasser ein zweiter Ansatz sein. Für scharfe Speisen nach der Verträglichkeit und Vorliebe des Gastes fragen, statt aus einem starren TDS-Wert die einzig richtige Wahl abzuleiten.\n\n### Wasserkarte\n\nHerkunft, Variante, Kohlensäuregrad, Menge und Preis verständlich zeigen. Pairingtexte als Empfehlung formulieren: „Probierbar zu …“ statt „muss zu …“. Die Anzahl der Positionen und die Preiskalkulation richten sich nach dem Betrieb; ein fixer Aufschlag ist keine Branchenpflicht.",
      "quiz": [
        {
          "question": "Welche Aussage über ein Wasser zu Austern ist sachlich?",
          "options": [
            "Nur Wasser unter 200 mg/l darf serviert werden",
            "Ein mildes stilles Wasser ist ein möglicher Verkostungsansatz, keine zwingende Regel",
            "Classic-Wasser ist gesetzlich verboten",
            "Austern erfordern Heilwasser"
          ],
          "correct": 1,
          "explanation": "Pairing ist eine geschmackliche Empfehlung. Die individuelle Kombination wird verkostet."
        },
        {
          "question": "Was darf aus der Kohlensäure beim Food Pairing nicht abgeleitet werden?",
          "options": [
            "Ein prickelndes Mundgefühl",
            "Eine chemische Spaltung von Speisefett",
            "Eine persönliche Vorliebe",
            "Ein Kontrast zur Speise"
          ],
          "correct": 1,
          "explanation": "Kohlensäure ist kein Fettspalter. Ein Frischeeindruck ist von einer physiologischen Wirkung zu unterscheiden."
        },
        {
          "question": "Was meint das hier verwendete Balance-Prinzip?",
          "options": [
            "Identische pH-Werte sind vorgeschrieben",
            "Wahrgenommene Intensitäten von Wasser und Speise bewusst aufeinander abstimmen",
            "Wasser und Speise müssen gleich teuer sein",
            "Alle Gäste müssen dieselbe Wahl treffen"
          ],
          "correct": 1,
          "explanation": "Balance ist ein gestalterischer Ansatz, keine analytische oder gesetzliche Vorschrift."
        }
      ]
    },
    {
      "title": "Wasser und Wein: Die perfekte Partnerschaft",
      "content": "## Wasser als Begleitung zur Weinverkostung\n\nWasser kann zwischen Weinproben getrunken werden und unterschiedliche Mundgefühle erzeugen. Ein bestimmtes Wasser „ruiniert“ jedoch nicht automatisch jeden feinen Wein. Die hier vorgeschlagenen Kombinationen sind **Verkostungstipps**, keine allgemeingültigen chemischen Gesetze.\n\n### Neutralen Ausgangspunkt schaffen\n\nEin stilles, im eigenen Vergleich zurückhaltend schmeckendes Wasser ist ein sinnvoller Ausgangspunkt. Gleiche Gläser und Temperaturen erleichtern den Vergleich. Anschließend kann derselbe Wein nach einem leicht oder stark prickelnden Wasser probiert werden. Veränderung und persönliches Gefallen getrennt notieren.\n\n### Natrium, Tannin und Säure\n\nDer Analysenauszug zeigt die Zusammensetzung des Wassers. Er beweist nicht, dass Natrium ab einem festen Schwellenwert stets Bitterkeit und Adstringenz verstärkt. Ebenso ist die chemische Pufferfähigkeit von Hydrogencarbonat keine Garantie, dass ein nachfolgender Riesling milder empfunden wird. Solche Effekte müssen für die konkrete Kombination beurteilt werden.\n\n### Pairingbeispiele\n\nZu Schaumwein kann stilles Wasser als ruhiger Gegenpol ausprobiert werden. Zu einem kräftigen Rotwein lässt sich ein intensiveres Wasser danebenstellen. Gastwunsch und individuelle Empfindlichkeit entscheiden. Diese Tipps begründen keine notwendige Markenwahl oder feste TDS-Obergrenze.\n\n### Alkohol und Wasser\n\nWasser neutralisiert keinen Alkohol und macht weder Fahrtüchtigkeit noch einen risikofreien Alkoholkonsum möglich. Die DGE bezeichnet keine Alkoholmenge als gesundheitlich unbedenklich. Bei einer fachlichen Verkostung sind kleine Proben und Ausspucken mögliche Organisationsmaßnahmen; eine alkoholfreie Teilnahme bleibt möglich.",
      "quiz": [
        {
          "question": "Warum kann stilles Wasser ein Ausgangspunkt zum Schaumwein sein?",
          "options": [
            "Weil es den Alkohol neutralisiert",
            "Weil es einen weniger prickelnden Gegenpol bietet",
            "Weil Sprudelwasser gesetzlich verboten ist",
            "Weil beide chemisch reagieren müssen"
          ],
          "correct": 1,
          "explanation": "Das ist ein geschmacklicher Vergleichsansatz, keine Pflicht oder Sicherheitsgarantie."
        },
        {
          "question": "Wie ist eine behauptete Natrium-Tannin-Wirkung zu behandeln?",
          "options": [
            "Natrium verstärkt immer Bitterkeit",
            "Nicht als universelle Regel ausgeben; die konkrete Kombination verkosten",
            "Natrium entfernt den Alkohol",
            "Natrium neutralisiert alle Weinsäuren"
          ],
          "correct": 1,
          "explanation": "Das Ionenprofil allein beweist keine feste sensorische Wirkung auf jeden Wein."
        },
        {
          "question": "Was leistet Wasser beim Alkoholkonsum nicht?",
          "options": [
            "Flüssigkeitszufuhr",
            "Eine zusätzliche alkoholfreie Trinkoption",
            "Wiederherstellung der Fahrtüchtigkeit oder Neutralisierung von Alkohol",
            "Eine andere Textur zwischen Proben"
          ],
          "correct": 2,
          "explanation": "Wasser macht Alkohol nicht unschädlich und ersetzt keine sichere Entscheidung gegen das Fahren."
        }
      ]
    },
    {
      "title": "Wasser und Gesundheit: Wissenschaftliche Fakten",
      "content": "## Flüssigkeitszufuhr ohne Gesundheitsversprechen\n\nWasser ist ein wichtiger Durstlöscher. Mineralstoffe können zur Ernährung beitragen, doch eine Getränkeberatung ist keine Diagnose oder Therapie.\n\n### Allgemeine Trinkempfehlung\n\nDie DGE empfiehlt für Erwachsene im Alltag rund **1,5 Liter Getränke täglich**, vorzugsweise Wasser oder andere kalorienfreie Getränke. Bei Hitze oder erhöhtem Flüssigkeitsverlust kann mehr nötig sein. Das ist kein für jeden Menschen und jede Krankheit identischer Bedarf. Bei ärztlich vorgegebenen Flüssigkeitsmengen haben die individuellen Hinweise Vorrang; übermäßiges Trinken ist ebenfalls nicht sinnvoll.\n\n### Mineralstoffe richtig berechnen\n\nDie DGE nennt calciumreiches Mineralwasser als möglichen Beitrag zur Calciumversorgung. Der Beitrag ergibt sich aus mg/l und Trinkmenge. Eine feste Absorptionsquote von 25–40 % für jedes Wasser und jede Person wird hier nicht behauptet. Magnesiumwasser wird nicht pauschal als Mittel gegen Krämpfe empfohlen. Auch ein Sportprogramm „Hydrogencarbonat vorher, Natrium währenddessen, Magnesium danach“ lässt sich aus dem Etikett allein nicht begründen.\n\n### Säuglingsnahrung\n\nFür die entsprechende Auslobung dürfen diese Werte nicht überschritten werden: **Natrium 20 mg/l, Nitrat 10 mg/l, Nitrit 0,02 mg/l, Sulfat 240 mg/l, Fluorid 0,7 mg/l, Mangan 0,05 mg/l, Arsen 0,005 mg/l und Uran 0,002 mg/l**. Das sind inklusive Höchstwerte, keine strikten „kleiner als“-Grenzen.\n\nDie Kennzeichnung bedeutet nicht, dass das Wasser steril ist. Das BfR empfiehlt, auch entsprechend ausgelobtes Mineral-, Quell- oder Tafelwasser zur Zubereitung von Säuglingsnahrung abzukochen. Zubereitungs-, Hygiene- und medizinische Hinweise sind zusätzlich zu beachten.\n\nLeitungswasser ist nicht pauschal ungesünder als Mineralwasser. Konkrete Zusammensetzung, örtliche Hinweise und die gesamte Ernährung sind entscheidend.",
      "quiz": [
        {
          "question": "Wie lässt sich der ernährungsbezogene Beitrag von Calciumwasser sachlich beschreiben?",
          "options": [
            "Es verhindert garantiert Osteoporose",
            "Es kann je nach Gehalt und Trinkmenge zur Calciumzufuhr beitragen",
            "Jeder Liter deckt den gesamten Bedarf",
            "Es ist immer besser als jede andere Calciumquelle"
          ],
          "correct": 1,
          "explanation": "Der Calciumbeitrag ist berechenbar, eine individuelle Krankheitswirkung daraus nicht."
        },
        {
          "question": "Welcher maximale Natriumwert gilt für die Säuglingsnahrungskennzeichnung?",
          "options": [
            "Höchstens 10 mg/l",
            "Höchstens 20 mg/l",
            "Höchstens 50 mg/l",
            "Höchstens 200 mg/l"
          ],
          "correct": 1,
          "explanation": "Anlage 6 verwendet „darf 20 mg/l nicht überschreiten“. Weitere chemische und mikrobiologische Anforderungen gelten zusätzlich."
        },
        {
          "question": "Was bedeutet „geeignet für die Zubereitung von Säuglingsnahrung“ nicht?",
          "options": [
            "Besondere chemische Grenzwerte werden eingehalten",
            "Das Wasser ist steril und muss nach BfR-Empfehlung nie abgekocht werden",
            "Natrium und Fluorid sind begrenzt",
            "Weitere Zubereitungshinweise bleiben relevant"
          ],
          "correct": 1,
          "explanation": "Das BfR betont, dass die Auslobung keine Sterilität bedeutet, und empfiehlt auch für diese Wässer das Abkochen."
        }
      ]
    },
    {
      "title": "Heilwasser: Arzneimittel und Anwendungshinweise",
      "content": "## Heilwasser ist von gewöhnlichem Mineralwasser zu unterscheiden\n\nIn Deutschland gilt Heilwasser als **Arzneimittel**, nicht als gewöhnliches Lebensmittel. Maßgeblich sind Arzneimittelrecht, der Status des konkreten Produkts und seine zugelassenen Angaben. Die Min/TafelWV schließt Heilwasser aus ihrem Anwendungsbereich aus.\n\n### Zulassung und Anwendungsgebiet\n\nEine Arzneimittelzulassung beurteilt Qualität, Wirksamkeit und Unbedenklichkeit für die zugelassenen Anwendungsgebiete. Ein hoher Mineralstoffgehalt allein macht ein Wasser nicht zum Heilwasser. Auch ein traditioneller Brunnenname oder ein einzelner Hydrogencarbonatwert beweist keine zugelassene Indikation.\n\n### Keine pauschale Übertragung\n\nEine zugelassene Aussage eines konkreten Heilwassers darf nicht auf sämtliche Mineralwässer mit ähnlichem Profil übertragen werden. Das gilt etwa für Aussagen zu Sodbrennen, Verdauung oder Mineralstoffmangel. Ebenso ist eine Marke nicht mit einer Arzneimittelkategorie gleichzusetzen: Unterschiedliche Produkte derselben Marke können unterschiedliche rechtliche Stellungen haben.\n\n### Anwendung und Beratung\n\nGebrauchsinformation, Dosierung, Gegenanzeigen und Wechselwirkungen des konkreten Heilwassers beachten. Hier werden keine allgemeine Trinkkur von drei bis vier Wochen und keine pauschale Tagesdosis empfohlen. Bei Beschwerden oder Unsicherheit sind ärztliche oder pharmazeutische Beratung geeigneter als eine eigenständige Therapieempfehlung im Getränkemarkt.\n\n### Quellkultur\n\nHeilquellen gehören zur Geschichte vieler Kurorte. Historische Nutzung erklärt eine kulturelle Bedeutung, ersetzt aber keine aktuelle Produktzulassung. Ungeprüfte Zahlen über heute zugelassene Heilwässer oder vermeintliche universelle Wirkschwellen werden deshalb nicht als Lernstoff verwendet.",
      "quiz": [
        {
          "question": "Welchem Rechtsbereich unterliegt Heilwasser in Deutschland?",
          "options": [
            "Nur der Min/TafelWV",
            "Dem Arzneimittelrecht",
            "Nur der Trinkwasserverordnung",
            "Nur einer freiwilligen Sommeliernorm"
          ],
          "correct": 1,
          "explanation": "Das BfR unterscheidet Heilwasser als Arzneimittel von Mineral-, Quell- und Tafelwasser als Lebensmitteln."
        },
        {
          "question": "Welche Aussage darf auf ein gewöhnliches Mineralwasser übertragen werden?",
          "options": [
            "Jede Indikation eines ähnlich mineralisierten Heilwassers",
            "Keine pauschale Heilwirkung; der Status des konkreten Produkts ist entscheidend",
            "Alle Heilwasserdosierungen",
            "Jede historische Kuranwendung"
          ],
          "correct": 1,
          "explanation": "Ähnliche Inhaltsstoffe sind kein Nachweis einer Arzneimittelzulassung oder identischen Wirkung."
        },
        {
          "question": "Was ist bei der Anwendung eines Heilwassers maßgeblich?",
          "options": [
            "Eine universelle Tagesdosis für alle Marken",
            "Die konkrete Gebrauchsinformation und gegebenenfalls medizinische Beratung",
            "Nur der Preis",
            "Nur die Flaschenfarbe"
          ],
          "correct": 1,
          "explanation": "Dosierung und Gegenanzeigen sind produktspezifisch. Dieser Kurs gibt keine individuelle Therapie vor."
        }
      ]
    },
    {
      "title": "pH-Wert, Wasserhärte und ihre Bedeutung",
      "content": "## pH-Wert, Härte und Gesamtmineralisierung trennen\n\nDer pH-Wert beschreibt die Säure- beziehungsweise Baseneigenschaft einer wässrigen Lösung. Gelöstes CO₂ kann den pH-Wert senken. Messbedingungen und Zusammensetzung beeinflussen das Ergebnis; ein hoher pH-Wert ist kein allgemeiner Gesundheitsnachweis.\n\n### Gesamthärte\n\nVereinfacht beschreibt die Gesamthärte den Gehalt an Calcium- und Magnesiumionen. Für Trinkwasser nennt § 9 WRMG die Bereiche **weich: unter 1,5 mmol/l**, **mittel: 1,5 bis 2,5 mmol/l**, **hart: über 2,5 mmol/l**, jeweils als Calciumcarbonatäquivalent. Daneben sind Angaben in Grad deutscher Härte üblich.\n\n### TDS ist nicht Wasserhärte\n\nTDS bezeichnet gelöste Stoffe insgesamt; die Gesamthärte betrifft nur einen Teil davon. Ein Wasser kann viel Natrium enthalten und dennoch wenig Calcium und Magnesium. Deshalb lassen sich **50–175 mg/l TDS nicht pauschal in 3–10 °dH umrechnen**. Ein elektrisches TDS-Messgerät schätzt zudem anhand der Leitfähigkeit und eines Umrechnungsfaktors. Es bestimmt nicht die einzelnen Ionen.\n\n### Getränkezubereitung\n\nBei Kaffee sind Härte, Alkalinität, weitere Bestandteile und die Anforderungen des Geräts getrennt zu betrachten. Die SCA erläutert ausdrücklich die Grenzen von TDS-Messgeräten. Eine einzelne TDS-Zahl beweist weder ideale Extraktion noch den Kalkschutz einer Maschine. Für Tee kann ein Vergleich mit unterschiedlichen geeigneten Wässern interessant sein; fixe „optimale“ Härtewerte gelten nicht automatisch für alle Tees.\n\n### Karbonathärte\n\nBeim Erhitzen kann Calciumcarbonat ausfallen; ein Teil der härtebildenden Bestandteile lässt sich dadurch verändern. Nichtkarbonathärte wird nicht auf dieselbe Weise beseitigt. Auch dies ist kein allgemeines Verfahren, um ein unbekanntes Wasser hygienisch oder chemisch unbedenklich zu machen.",
      "quiz": [
        {
          "question": "Warum kann CO₂ den pH-Wert des Wassers senken?",
          "options": [
            "Es entfernt alle Mineralstoffe",
            "Es beteiligt sich am Kohlensäuregleichgewicht, bei dem Protonen entstehen",
            "Es macht jedes Wasser alkalisch",
            "Es wandelt Wasser in Alkohol um"
          ],
          "correct": 1,
          "explanation": "Das Kohlensäuregleichgewicht erklärt die Säurewirkung; es sagt nichts über eine pauschale Heilwirkung aus."
        },
        {
          "question": "Welche Aussage zu TDS und Härte ist richtig?",
          "options": [
            "TDS und Härte sind immer identisch",
            "TDS lässt sich nicht ohne Kenntnis der Zusammensetzung direkt in Wasserhärte umrechnen",
            "Jeder TDS-Wert ist ein Calciumwert",
            "Die Härte hängt ausschließlich vom Natrium ab"
          ],
          "correct": 1,
          "explanation": "Gesamtmineralisierung und Calcium-/Magnesiumhärte sind unterschiedliche Kenngrößen."
        },
        {
          "question": "Welcher Härtebereich ist nach WRMG „mittel“?",
          "options": [
            "Unter 0,5 mmol/l",
            "1,5 bis 2,5 mmol/l Calciumcarbonatäquivalent",
            "Über 5 mmol/l",
            "Jeder Wert über 10 mg/l TDS"
          ],
          "correct": 1,
          "explanation": "§ 9 WRMG legt diese Grenzen für die Mitteilung von Trinkwasserhärtebereichen fest."
        }
      ]
    },
    {
      "title": "Nachhaltigkeit: Glas, PET und die Ökobilanz von Mineralwasser",
      "content": "## Verpackung und Ökobilanz differenziert betrachten\n\nFlaschenmaterial, Wiederbefüllung, Transport und Recycling wirken zusammen. Es gibt keine universelle 200-km-Grenze, unterhalb derer Glas stets jeden anderen Behälter schlägt.\n\n### Mehrweg und Einweg\n\nDas Umweltbundesamt empfiehlt **Mehrweg aus der Region**. Glas-Mehrwegflaschen können laut UBA bis zu 50-mal, PET-Mehrwegflaschen bis zu 20-mal wiederbefüllt werden. „Bis zu“ ist kein garantierter Durchschnitt jedes Pools. Einwegpfand bedeutet Rücknahme und Recycling, nicht Wiederbefüllung. Recyclingfähigkeit ist ebenfalls nicht identisch mit einer tatsächlich vollständig geschlossenen Kreislaufführung.\n\n### Materialeigenschaften\n\nGlas bietet eine gute Gasbarriere, ist jedoch schwer und bruchempfindlich. PET ist leicht und kann CO₂ leichter entweichen lassen. Das BfR erklärt, dass für PET-Flaschen keine Orthophthalate oder andere Weichmacher eingesetzt werden. Acetaldehyd kann bei Herstellung oder Lagerung entstehen und in sehr kleinen Mengen einen Fremdgeschmack verursachen. Ein solcher Qualitätsmangel darf reklamiert werden; er beweist nicht automatisch eine gefährliche Konzentration.\n\n### Vergleichsfragen\n\nWird das Gebinde wiederbefüllt? Wie oft im betrachteten System? Wie weit fährt volle und leere Ware? Welche Materialmengen, Energiequellen und Recyclingannahmen enthält die Untersuchung? Nur bei vergleichbaren Systemgrenzen sind Ranglisten aussagekräftig.\n\n### Leitungswasser\n\nLeitungswasser vermeidet Flaschenlogistik und ist nach dem UBA das umweltfreundlichste Getränk. Für einzelne Produkte werden hier keine ungesicherten CO₂-Faktoren oder pauschalen „600-mal“-Vergleiche behauptet. Geschmackswunsch und konkrete Verpackung können weiterhin bewusste Kaufkriterien sein, ohne ökologische oder medizinische Superlative.",
      "quiz": [
        {
          "question": "Welche Wiederbefüllungszahl nennt das UBA für Glas-Mehrwegflaschen?",
          "options": [
            "Immer genau 10",
            "Bis zu 50, nicht ein garantierter Durchschnitt",
            "Mindestens 100",
            "Genau eine"
          ],
          "correct": 1,
          "explanation": "Die UBA-Angabe lautet bis zu 50 Wiederbefüllungen. Das tatsächliche System entscheidet."
        },
        {
          "question": "Welche Aussage zu PET ist laut BfR richtig?",
          "options": [
            "PET wird mit Orthophthalat-Weichmachern hergestellt",
            "PET benötigt diese Weichmacher nicht; Acetaldehyd kann sensorisch auffallen",
            "Jeder Fremdgeschmack bedeutet eine gefährliche Dosis",
            "PET ist vollständig gasundurchlässig"
          ],
          "correct": 1,
          "explanation": "Das BfR trennt die nicht eingesetzten Weichmacher von möglichen Acetaldehyd-bedingten Qualitätsmängeln."
        },
        {
          "question": "Was bestimmt eine belastbare Verpackungsbilanz?",
          "options": [
            "Nur die Flaschenfarbe",
            "Material, Umlaufzahl, Transport und weitere Systemannahmen",
            "Nur der Kohlensäuregrad",
            "Eine pauschale Grenze von 200 km"
          ],
          "correct": 1,
          "explanation": "Transport ist wichtig, aber nicht die einzige relevante Größe einer Ökobilanz."
        }
      ]
    },
    {
      "title": "Der deutsche Mineralwassermarkt: Strukturen und Zahlen",
      "content": "## Den deutschen Mineralwassermarkt mit sauberer Datenbasis lesen\n\nMarktdaten brauchen Jahr, Quelle und Kategorie. Mineralwasser, Heilwasser, aromatisierte Getränke und sämtliche abgepackten Wässer dürfen nicht stillschweigend als derselbe Markt behandelt werden.\n\n### Ein datiertes Branchenbeispiel\n\nDie am 12.10.2026 gelesene Marktdatenseite des **Verbands Deutscher Mineralbrunnen (VDM)** berichtet für **2024** einen Pro-Kopf-Verbrauch von **125,6 Litern Mineral- und Heilwasser** sowie rund **9,9 Milliarden Litern Absatz**. Das sind keine bereits gemessenen Werte für 2026 und keine Statistik über den gesamten Leitungswasserkonsum.\n\nDie Seite nennt für 2024 rund 39,5 % Marktanteil für Wasser mit wenig CO₂, 32,8 % für Wasser mit viel CO₂ und etwa 25 % für stilles Wasser. Stilles Wasser verzeichnet dort ein Plus von 7 %. Quelle, Zeitraum und Begriffsabgrenzung gehören zu jeder Verwendung dieser Zahlen.\n\n### Vertrieb und Positionierung\n\nMineralwasser wird im Lebensmittelhandel, Getränkefachhandel und in der Gastronomie angeboten. Regionale Brunnen, Herstellermarken und Handelsmarken sind zu unterscheiden. Aus einer günstigen Eigenmarke folgt nicht, dass der Inhalt bloß Quellwasser ist; die gesetzliche Produktbezeichnung entscheidet.\n\n### Preise und Konkurrenz\n\nGebindegröße, Mehrweg oder Einweg, Transport, Vertrieb und Markenposition beeinflussen Preise. Hier werden keine ungesicherten Top-5-Marktanteile, Margen oder aktuellen Regalpreise verwendet. Für konkrete Sortimentsentscheidungen braucht ein Betrieb seine tatsächlichen Einkaufs- und Verkaufsdaten.\n\nBranchenquellen liefern nützliche Marktdaten, vertreten aber zugleich Brancheninteressen. Gesundheits- und Umweltbehauptungen werden deshalb zusätzlich anhand unabhängiger fachlicher oder behördlicher Quellen eingeordnet.",
      "quiz": [
        {
          "question": "Auf welche Kategorie bezieht sich der VDM-Verbrauch von 125,6 Litern für 2024?",
          "options": [
            "Alles Wasser einschließlich Hausverbrauch",
            "Mineral- und Heilwasser",
            "Nur stilles Mineralwasser",
            "Nur Leitungswasser"
          ],
          "correct": 1,
          "explanation": "Die Kategorie ist ausdrücklich Mineral- und Heilwasser. Jahr und Kategorie dürfen bei Vergleichen nicht entfallen."
        },
        {
          "question": "Welche Entwicklung berichtet die geprüfte VDM-Seite für stilles Wasser 2024?",
          "options": [
            "Ein Wachstum von rund 7 %",
            "Einen vollständigen Marktaustritt",
            "Keine Verkäufe",
            "Ein gesetzliches Verbot"
          ],
          "correct": 0,
          "explanation": "Die Angabe ist eine datierte Branchenstatistik für 2024, keine Prognose für spätere Jahre."
        },
        {
          "question": "Wie erkennt man die Wasserkategorie einer Eigenmarke?",
          "options": [
            "Am niedrigen Preis",
            "An der Produktbezeichnung und Kennzeichnung",
            "An der Supermarktgröße",
            "An der Farbe des Deckels"
          ],
          "correct": 1,
          "explanation": "Preis und Vertriebsform legen nicht fest, ob der Inhalt Mineral-, Quell- oder Tafelwasser ist."
        }
      ]
    },
    {
      "title": "Mineralwasser in der Gastronomie: Konzepte und Kalkulation",
      "content": "## Ein verständliches Wasserkonzept für die Gastronomie\n\nEin Wasserkonzept beginnt mit dem Gastwunsch: still oder prickelnd, mild oder kräftig, Flasche oder transparent beschriebenes Leitungswasserangebot. Die folgenden Vorschläge sind **Betriebspraxis**, keine allgemeine Servicepflicht.\n\n### Die Karte\n\nEine überschaubare Auswahl nach Kohlensäure und Geschmack gliedern. Herkunft, konkrete Variante, Gebindegröße und Preis nennen; bei Bedarf den Analysenauszug zur Beratung heranziehen. Pairingempfehlungen als Vorschläge darstellen. Eine bestimmte Mindestzahl an internationalen Marken ist nicht erforderlich, um kompetent zu beraten.\n\n### Kalkulation\n\nEinkauf, Personal, Lager, Reinigung, Leergut, Bruch und Steuer unterscheiden. Ein Aufschlag ist nicht gleich Gewinnmarge oder Deckungsbeitrag. Beispiel: Bei 1 € Netto-Wareneinsatz und 4 € Netto-Verkaufspreis beträgt der Aufschlag 300 %; der Umsatz abzüglich Wareneinsatz ist 3 €, bevor andere Kosten abgezogen sind. Dies ist ein Rechenbeispiel, kein Marktpreis oder vorgeschriebener Aufschlag.\n\n### Ausschank\n\nSaubere Gefäße, hygienische Handhabung und die gewünschte Temperatur stehen im Vordergrund. Flascheninhalt und Quellvariante dürfen nicht verwechselt werden. Eis aus anderem Wasser verändert beim Schmelzen das Profil, ist aber nicht grundsätzlich verboten oder unprofessionell; nach dem Gastwunsch fragen.\n\n### Offenes Wasser und Anlagen\n\nGefiltertes oder gesprudeltes Leitungswasser aus einer Anlage ist nicht automatisch natürliches Mineralwasser. Ebenso muss es nicht pauschal jedes Mal als Tafelwasser eingeordnet werden; die konkrete Herstellung und Auslobung entscheiden. Anlage, Filter und Leitungen nach Herstellerhinweisen und betrieblichem Hygienekonzept warten.\n\nHausentscheidungen zu Leitungswasserpreis und Service nicht als für alle Länder gleiche Rechtslage darstellen.",
      "quiz": [
        {
          "question": "Wie hoch ist der Aufschlag im Rechenbeispiel bei 1 € Wareneinsatz und 4 € Netto-Verkaufspreis?",
          "options": [
            "75 %",
            "100 %",
            "300 %",
            "400 %"
          ],
          "correct": 2,
          "explanation": "(4 € − 1 €) / 1 € ergibt 300 % Aufschlag. Weitere Kosten sind damit nicht abgedeckt oder als Gewinn ausgewiesen."
        },
        {
          "question": "Was bewirkt Eis aus einem anders zusammengesetzten Wasser beim Schmelzen?",
          "options": [
            "Es ist immer gesundheitsschädlich",
            "Es kann das ausgewählte Mineralstoffprofil verdünnen oder verändern",
            "Es sterilisiert das Getränk",
            "Es ist gesetzlich verboten"
          ],
          "correct": 1,
          "explanation": "Eis verändert die Zusammensetzung und Temperatur. Die Serviceentscheidung kann am Gastwunsch ausgerichtet werden."
        },
        {
          "question": "Was ist bei Wasser aus einer Schankanlage wichtig?",
          "options": [
            "Es immer als natürliches Mineralwasser verkaufen",
            "Herstellung und Kategorie transparent beschreiben und Hygiene beachten",
            "Es nie reinigen",
            "Nur die Farbe der Karaffe zeigen"
          ],
          "correct": 1,
          "explanation": "Gefiltertes oder gesprudeltes Leitungswasser erhält nicht allein durch die Anlage eine Mineralwasseranerkennung."
        }
      ]
    },
    {
      "title": "Lagerung, Haltbarkeit und Qualitätssicherung",
      "content": "## Lagerung und Haltbarkeit: Etikett und Hygiene zuerst\n\nDas Mindesthaltbarkeitsdatum bezieht sich auf ungeöffnete Ware bei den angegebenen Lagerbedingungen. Es ist kein universelles Verfallsdatum; ebenso ist es keine Zusage, Mineralwasser sei praktisch unbegrenzt haltbar.\n\n### Ungeöffnete Flaschen\n\nHerstellerhinweise beachten, vor starker Wärme, direktem Sonnenlicht und Frost schützen. Beschädigte Flaschen oder Verschlüsse nicht verwenden. Pauschale Fristen wie „Glas genau 24 Monate“ sind nicht für jedes Produkt verbindlich. Das BfR erklärt, dass Kohlensäure aus PET leichter entweichen kann als aus Glas; dadurch ist die Mindesthaltbarkeit in PET häufig kürzer.\n\n### Nach dem Öffnen\n\nMöglichst zeitnah verbrauchen, verschlossen und gekühlt lagern. Direktes Trinken aus der Flasche kann Keime eintragen; die Flasche dann nicht mit anderen teilen. Das BfR weist darauf hin, dass hygienisch behandelte, verschlossene und gekühlte Flaschen noch nach mehreren Tagen verwendet werden können. Daraus folgt keine feste, für alle Nutzungen sichere Tageszahl.\n\n### Abweichungen\n\nUnerwartete Trübung, Flocken, Verfärbung, fremder Geruch oder ein beschädigter Verschluss sind Gründe, den Ausschank zu stoppen und den Lieferanten zu kontaktieren. Nicht allein nach dem Aussehen zwischen harmloser Ausfällung und Kontamination entscheiden. Geruchs- oder Geschmackstest sind kein sicherer Keimnachweis.\n\n### Lagerorganisation\n\n**FIFO** bedeutet „First In, First Out“: zuerst eingelagerte Ware zuerst verwenden. Zusätzlich nach dem frühesten MHD ordnen, wenn Lieferungen unterschiedliche Fristen haben. Öffnungszeitpunkte und Lagerbedingungen im betrieblichen Ablauf dokumentieren. Kontroll- und Auditintervalle richten sich nach dem tatsächlichen Betrieb, nicht nach einer hier erfundenen jährlichen Pflicht für jedes externe Labor.",
      "quiz": [
        {
          "question": "Warum kann die Mindesthaltbarkeit in PET kürzer sein als in Glas?",
          "options": [
            "PET ist grundsätzlich unhygienisch",
            "Kohlensäure kann aus PET leichter entweichen",
            "PET verändert alle Mineralstoffe",
            "PET darf nicht gekühlt werden"
          ],
          "correct": 1,
          "explanation": "Das BfR nennt den leichteren Kohlensäureverlust aus PET. Die konkrete Frist bleibt produktspezifisch."
        },
        {
          "question": "Wie lagert man eine bereits geöffnete Wasserflasche?",
          "options": [
            "Offen in der Sonne",
            "Verschlossen und gekühlt, möglichst zeitnah verbrauchen",
            "Immer unbegrenzt im Lager",
            "Neben Reinigungsmitteln ohne Verschluss"
          ],
          "correct": 1,
          "explanation": "Diese Handhabung schützt besser vor erneuter Verunreinigung. Sie ist keine unbegrenzte Haltbarkeitsgarantie."
        },
        {
          "question": "Wofür steht FIFO?",
          "options": [
            "Fast In, Fast Out",
            "First In, First Out — zuerst eingelagerte Ware zuerst verwenden",
            "Fill In, Fill Out",
            "Filter In, Filter Out"
          ],
          "correct": 1,
          "explanation": "FIFO ist ein Organisationsprinzip. Unterschiedliche MHD-Fristen sind zusätzlich zu berücksichtigen."
        }
      ]
    },
    {
      "title": "Trends und Zukunft: Flavoured Water, Premium und Innovation",
      "content": "## Trends prüfen: Produktkategorie, Zutaten und Belege\n\nNeue Wassergetränke können geschmacklich interessant sein. Die Basis aus natürlichem Mineralwasser verleiht einem fertigen Mischgetränk aber nicht automatisch dessen rechtlichen Status oder besondere Gesundheitswirkungen.\n\n### Wasser mit Geschmack\n\nNatürlichem Mineralwasser dürfen grundsätzlich außer dem gesetzlich zulässigen CO₂ keine freien Zutaten wie Aromen, Zucker oder Vitamine zugesetzt werden. Ein aromatisiertes Produkt ist daher als **Getränk auf Mineralwasserbasis** beziehungsweise nach seiner tatsächlichen Kategorie zu beschreiben, nicht als unverändertes natürliches Mineralwasser. Zuckerfrei, kalorienarm und ohne zugesetzten Zucker sind unterschiedliche Angaben; Zutatenliste und Nährwerttabelle prüfen.\n\n### Funktionale Zusätze\n\nVitamin-, Protein- oder Wasserstoffgetränke sind kein automatischer Gesundheitsgewinn. Ein Zutatentrend ist kein Beleg für eine konkrete Wirkung. Bei CBD gelten zusätzlich Novel-Food- und gegebenenfalls Arzneimittelanforderungen; „rechtliche Grauzone“ ist keine Freigabe zum Verkauf. Der Status des konkreten Produkts muss geprüft sein.\n\n### Herkunft und Design\n\n„Single Origin“ beschreibt im Marketing die Betonung einer bestimmten Herkunft. „Vintage“, „Ancient“ oder „Luxury“ sind keine amtlichen Qualitätsklassen für Wasser. Lange unterirdische Aufenthaltszeit, Designflasche und hoher Preis beweisen keine Überlegenheit.\n\n### Technik und Nachhaltigkeit\n\nRefill, leichte Gebinde, Recyclingmaterial oder technische Wasseraufbereitung können interessante Konzepte sein. Entscheidend sind nachvollziehbare Systemdaten und sichere Anwendung. Ein UV-Gerät oder Luftwassergewinner ist weder ein Mineralwasserbrunnen noch allein durch sein Werbeversprechen ein Sicherheitsnachweis.\n\nIm Handel Trends als beobachtbare Produktkonzepte erklären; zukünftige Marktführerschaft oder gesundheitliche Vorteile nicht als bereits erwiesene Tatsache darstellen.",
      "quiz": [
        {
          "question": "Wie ist ein mit Aroma versetztes Produkt auf Mineralwasserbasis einzuordnen?",
          "options": [
            "Weiterhin stets unverändertes natürliches Mineralwasser",
            "Als Getränk auf Mineralwasserbasis mit eigener zutreffender Produktbezeichnung",
            "Automatisch als Heilwasser",
            "Als Wasser ohne Zutaten"
          ],
          "correct": 1,
          "explanation": "Die natürliche Mineralwasserkategorie erlaubt keine freie Aromazugabe. Das fertige Getränk ist entsprechend zu kennzeichnen."
        },
        {
          "question": "Was beschreibt „Single Origin“ im Wassermarketing?",
          "options": [
            "Eine gesetzlich garantierte Heilwirkung",
            "Die Betonung einer bestimmten Quelle oder Herkunft",
            "Eine für alle Länder einheitliche Reinheitsstufe",
            "Nur einen Vertriebskanal"
          ],
          "correct": 1,
          "explanation": "Der Marketingbegriff ist von gesetzlichen Produktkategorien zu unterscheiden."
        },
        {
          "question": "Was ist vor einem Verkauf CBD-haltiger Getränke erforderlich?",
          "options": [
            "Die Bezeichnung „Grauzone“ reicht aus",
            "Prüfung der konkreten Verkehrsfähigkeit und gegebenenfalls erforderlicher Zulassungen",
            "Nur eine schöne Flasche",
            "Eine hohe Mineralisierung"
          ],
          "correct": 1,
          "explanation": "CBD und neuartige Lebensmittel unterliegen eigenen Anforderungen. Ein Trend hebt sie nicht auf."
        }
      ]
    }
  ],
  "finalExam": [
    {
      "question": "Welche Voraussetzung unterscheidet natürliches Mineralwasser wesentlich von Quellwasser?",
      "options": [
        "Immer Kohlensäure",
        "Amtliche Anerkennung als natürliches Mineralwasser",
        "Immer Glasflaschen",
        "Mindestens 500 mg/l Mineralstoffe"
      ],
      "correct": 1,
      "explanation": "Natürliches Mineralwasser benötigt eine amtliche Anerkennung. Auch Quellwasser hat konkrete gesetzliche Anforderungen."
    },
    {
      "question": "Warum lässt sich das Wasserprofil nicht allein aus „Granitquelle“ bestimmen?",
      "options": [
        "Weil alle Wasserprofile gleich sind",
        "Fließwege, Gesteinsmischungen und weitere Bedingungen beeinflussen die Zusammensetzung",
        "Weil das Etikett unwichtig ist",
        "Weil jedes Granitwasser über 2.000 mg/l besitzt"
      ],
      "correct": 1,
      "explanation": "Gesteinslöslichkeit ist ein Einflussfaktor, aber keine feste mg/l-Garantie. Den konkreten Analysenauszug verwenden."
    },
    {
      "question": "Welche Angabe ist für eine sachliche Calciumberatung entscheidend?",
      "options": [
        "Eine universelle Absorptionsquote",
        "Der Calciumgehalt und die tatsächlich getrunkene Menge",
        "Nur der Preis",
        "Nur der pH-Wert"
      ],
      "correct": 1,
      "explanation": "Der Zufuhrbeitrag ergibt sich aus mg/l und Literzahl. Daraus folgt keine individuelle Heilwirkung."
    },
    {
      "question": "Welche CO₂-Bezeichnung beschreibt einen erhöhten Gehalt aus demselben Quellvorkommen?",
      "options": [
        "Mit eigener Quellkohlensäure versetzt",
        "Grundsätzlich still",
        "Mit Fruchtaroma versetzt",
        "Tafelwasser"
      ],
      "correct": 0,
      "explanation": "Die Min/TafelWV unterscheidet unveränderten Quellgehalt, Zusatz aus gleichem Quellvorkommen und CO₂ anderer Herkunft."
    },
    {
      "question": "Wie ist ein stilles Wasser zu Champagner einzuordnen?",
      "options": [
        "Als gesetzlich einzige Möglichkeit",
        "Als möglicher geschmacklicher Gegenpol, abhängig von Gast und Kombination",
        "Als Schutz vor Alkoholwirkungen",
        "Als zwingend calciumfreie Wahl"
      ],
      "correct": 1,
      "explanation": "Pairingempfehlungen sind Verkostungsansätze, keine Gesundheits- oder Sicherheitsregeln."
    },
    {
      "question": "Was unterscheidet Heilwasser rechtlich?",
      "options": [
        "Mehr Kohlensäure",
        "Arzneimittelstatus und konkrete zugelassene Angaben",
        "Immer ein Rezeptzwang",
        "Industrielle Herstellung"
      ],
      "correct": 1,
      "explanation": "Heilwasser ist kein gewöhnliches Mineralwasser-Lebensmittel. Gebrauchsinformation und konkreter Status sind maßgeblich."
    },
    {
      "question": "Welche Aussage über Kaffeewasser ist richtig?",
      "options": [
        "TDS lässt sich immer direkt in °dH umrechnen",
        "Härte, Alkalinität und TDS sind getrennt zu betrachten",
        "Ein hoher TDS-Wert garantiert gute Extraktion",
        "Nur die Wasserfarbe zählt"
      ],
      "correct": 1,
      "explanation": "Die SCA erklärt Grenzen von TDS-Messgeräten. Gesamtmineralisierung misst nicht die einzelne Ionenverteilung."
    },
    {
      "question": "Was gehört zu einer belastbaren Verpackungs-Ökobilanz?",
      "options": [
        "Nur die Flaschenfarbe",
        "Nur der Mineralgehalt",
        "Material, Umlaufzahl und Transport sowie weitere Systemannahmen",
        "Eine starre 200-km-Grenze"
      ],
      "correct": 2,
      "explanation": "Eine Rangliste hängt von dem betrachteten System ab. Das UBA empfiehlt regionales Mehrweg, ohne einen universellen 200-km-Sieger festzulegen."
    },
    {
      "question": "Welche Lagerregel gilt für bereits geöffnete Wasserflaschen?",
      "options": [
        "Unbegrenzt offen bei Raumtemperatur",
        "Verschlossen und gekühlt, möglichst zeitnah verbrauchen",
        "Das MHD garantiert nach Öffnung jede Haltbarkeit",
        "Nur Glas darf gekühlt werden"
      ],
      "correct": 1,
      "explanation": "Die BfR-Hygienehinweise unterscheiden geöffnete Flaschen von original verschlossener Ware."
    },
    {
      "question": "Was muss bei einem aromatisierten Wassergetränk geprüft werden?",
      "options": [
        "Nur der Werbename",
        "Tatsächliche Kategorie, Zutaten, Nährwerte und zulässige Aussagen",
        "Nur das Design",
        "Nur der Mineralstoffgehalt der Basis"
      ],
      "correct": 1,
      "explanation": "Mineralwasserbasis oder Trendzutat sind keine pauschalen Rechts- oder Gesundheitsgarantien."
    }
  ]
};
