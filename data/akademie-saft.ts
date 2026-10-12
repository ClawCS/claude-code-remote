import type { Course } from "./akademie";

export const saftKurs: Course = {
  "slug": "saft",
  "title": "Saft-Experte",
  "icon": "🧃",
  "image": "/images/akademie/saft.png",
  "description": "Direktsaft, Konzentrat und Nektar: Herstellung, Kennzeichnung, Nährwerte und praktische Saftberatung verständlich kennenlernen.",
  "color": "from-orange-400 to-yellow-500",
  "difficulty": "Einsteiger",
  "duration": "ca. 80 Min.",
  "lessons": [
    {
      "title": "Definition: Direktsaft, Konzentrat und Nektar",
      "content": "## Fruchtsaft, Konzentrat und Nektar unterscheiden\n\nDie deutsche **Fruchtsaft- und Erfrischungsgetränkeverordnung (FrSaftErfrischGetrV)** setzt die europäischen Vorgaben um. Fruchtsaft ist ein gärfähiges, aber nicht gegorenes Erzeugnis aus gesunden und reifen Früchten. Die Bezeichnung steht für 100 % Fruchtgehalt; gesetzlich zugelassene Zutaten, Restaurationsaromen und Verfahren sind gesondert geregelt. „100 %“ bedeutet daher nicht, dass keinerlei Verarbeitung erlaubt wäre.\n\n### Direktsaft und Saft aus Konzentrat\n\nDirektsaft durchläuft keine Konzentrierung. Für Saft aus Konzentrat wird zunächst Wasser physikalisch entzogen und später mit geeignetem Trinkwasser wiederhergestellt. Die Kennzeichnung „aus Fruchtsaftkonzentrat“ ist erforderlich. Auch dieser Saft ist Fruchtsaft und nicht automatisch ein minderwertiges Getränk. **Brix** beschreibt lösliche Trockenmasse, nicht ausschließlich Zucker; für wiederhergestellten Apfelsaft beträgt der Mindestwert 11,2 °Bx.\n\n### Nektar\n\nNektar enthält zusätzlich Wasser und gegebenenfalls Zucker oder Honig. Die **Mindestfruchtanteile** sind fruchtspezifisch: Banane und Passionsfrucht 25 %, Sauerkirsche **35 %**, Apfel und Orange 50 %. „25–50 %“ bezeichnet die Bandbreite der Mindestwerte, keine Obergrenze des tatsächlichen Fruchtanteils.\n\nNach der aktuell gelesenen Fassung sind Zucker- oder Honigzusätze je Fruchtgruppe auf **20 %, 15 % oder 10 % des Gesamtgewichts** begrenzt; eine pauschale 20-%-Regel ist unvollständig. Die Verordnung enthält seit den ab 14.06.2026 maßgeblichen Änderungen außerdem eigene Kategorien für zuckerreduzierten Saft mit mindestens 30 % reduziertem natürlichem Zucker.\n\n### Beratung\n\nProduktbezeichnung, Fruchtanteil, Zutaten und Nährwerttabelle gemeinsam lesen. Fruchtsaftgetränk, Schorle und Fruchtnektar sind nicht bloß andere Namen für 100-%-Saft.",
      "quiz": [
        {
          "question": "Welcher Fruchtgehalt kennzeichnet gewöhnlichen Fruchtsaft?",
          "options": [
            "Mindestens 25 %",
            "Mindestens 50 %",
            "100 % Fruchtgehalt unter den gesetzlichen Herstellungsregeln",
            "Beliebig, solange fruchtig"
          ],
          "correct": 2,
          "explanation": "Auch korrekt wiederhergestellter Saft aus Konzentrat ist Fruchtsaft. Zulässige Verarbeitung ist von einer beliebigen Verdünnung zu unterscheiden."
        },
        {
          "question": "Was beschreibt der Brix-Wert?",
          "options": [
            "Nur die Säure",
            "Lösliche Trockenmasse, vor allem Zucker, aber nicht ausschließlich Zucker",
            "Den Alkoholgehalt",
            "Nur zugesetzten Zucker"
          ],
          "correct": 1,
          "explanation": "Fruchtsaft enthält auch andere lösliche Bestandteile. Der Brix-Wert allein beweist keine Zuckerzugabe."
        },
        {
          "question": "Welcher Mindestfruchtgehalt gilt für Sauerkirschnektar?",
          "options": [
            "25 %",
            "30 %",
            "35 %",
            "50 %"
          ],
          "correct": 2,
          "explanation": "Anlage 5 der FrSaftErfrischGetrV nennt für Sauerkirschen/Weichseln 35 %. Bananen- und Passionsfruchtnektar haben andere Mindestwerte."
        }
      ]
    },
    {
      "title": "Geschichte des Fruchtsafts",
      "content": "## Wie haltbarer Fruchtsaft entstand\n\nFrisch gepresste Fruchtsäfte können durch Mikroorganismen verderben oder gären. Die Entwicklung kontrollierter Haltbarmachung und geeigneter Verpackungen war deshalb ein wichtiger Schritt für die moderne Saftwirtschaft. Pasteurisierung, Konzentratherstellung und Abfülltechnik erfüllen dabei unterschiedliche Aufgaben.\n\n### Pasteurisierung\n\nDie kurzzeitige Wärmebehandlung reduziert relevante Mikroorganismen und beeinflusst Enzyme. Welche Temperatur und Dauer nötig sind, hängt vom Produkt und dem validierten Verfahren ab. Die Bezeichnung „Direktsaft“ allein beschreibt nicht eine einzige Pasteurisierungstemperatur und keine für alle Produkte gleiche Kühlpflicht.\n\n### Industrielle Entwicklung\n\nDie Herstellerhistorie von Eckes beschreibt den Einstieg in die Saftproduktion in den **1930er-Jahren** und die Einführung von hohes C Orangensaft **1958**. Solche Unternehmensangaben erklären ein konkretes Beispiel, nicht die gesamte Geschichte der weltweiten Saftproduktion. Die frühere pauschale Erzählung über eine nationalsozialistische Organisation wird mangels hier geprüftem Beleg nicht übernommen.\n\nKonzentrat verringerte das transportierte Wasservolumen. Verpackung und hygienische Abfüllung ermöglichten neue Vertriebswege. Ein Karton allein macht ein Lebensmittel aber nicht ungekühlt haltbar: Produktbehandlung, Barriere und Abfüllung wirken zusammen.\n\n### Datierte Verbrauchszahl\n\nDie geprüfte VdF-Branchenseite nennt für **2025** 22,5 Liter Pro-Kopf-Konsum von Fruchtsaft und -nektar. Das ist ein datierter Branchenwert, keine zeitlose Gewohnheit jedes Menschen und kein Beweis, warum einzelne Personen Saft bevorzugen.\n\nFür historische Behauptungen gilt dasselbe wie für aktuelle Statistik: Ort, Jahr, Kategorie und Beleg gehören zusammen.",
      "quiz": [
        {
          "question": "Welche Entwicklung unterstützt die Haltbarmachung von Saft?",
          "options": [
            "Nur die Etikettenfarbe",
            "Kontrollierte Verarbeitung und hygienisch geeignete Abfüllung",
            "Nur der Flaschenpreis",
            "Eine beliebige Lagerdauer"
          ],
          "correct": 1,
          "explanation": "Eine Verpackung allein ersetzt keinen validierten Haltbarmachungsprozess."
        },
        {
          "question": "Welchen datierten Pro-Kopf-Konsum nennt die gelesene VdF-Seite für 2025?",
          "options": [
            "14 Liter",
            "22,5 Liter Fruchtsaft und -nektar",
            "42 Liter reinen Apfelsaft",
            "55 Liter Orangensaft"
          ],
          "correct": 1,
          "explanation": "Jahr und Produktkategorie gehören zur Zahl. Sie ist keine Messung für 2026."
        },
        {
          "question": "Wann wurde hohes C Orangensaft laut Herstellerhistorie eingeführt?",
          "options": [
            "1869",
            "1932",
            "1958",
            "2007"
          ],
          "correct": 2,
          "explanation": "Eckes nennt 1958 als Einführung des fertig abgefüllten hohes C Orangensafts."
        }
      ]
    },
    {
      "title": "Rohstoffe und Obstsorten für die Saftproduktion",
      "content": "## Saftrohstoffe nach Eignung beurteilen\n\nFür die Saftherstellung sind gesunde, angemessen reife Früchte erforderlich. Geschmack und Verarbeitungseignung hängen von Sorte, Reife, Erntejahr und Verfahren ab. Fruchtsaftverordnung und Rohstoffprüfung sind wichtiger als eine pauschale „Superfrucht“-Rangliste.\n\n### Kernobst und Zitrusfrüchte\n\nÄpfel und Birnen können sortenrein oder als Mischung verarbeitet werden. Eine **Cuvée** kombiniert Sorten, um ein gewünschtes Süße-Säure- und Aromaprofil zu erreichen. Eine süße Sorte wie Gala ist nicht grundsätzlich unbrauchbar; sie kann ein sinnvoller Mischungspartner sein. Ein starres Zucker-Säure-Verhältnis von „1:10“ wird nicht als universelle Qualitätsregel verwendet.\n\nOrangen, Grapefruits, Zitronen und Limetten haben unterschiedliche Säure- und Aromaprofile. Wie viel Saft gewonnen wird und welche Schalenbestandteile übergehen, hängt vom Rohstoff und der Maschine ab. Feste Ausbeuten sind keine Garantie jeder Charge.\n\n### Beeren und tropische Früchte\n\nJohannisbeere oder Passionsfrucht können sehr säurebetont sein. Banane und Mango liefern viel Fruchtfleisch und werden häufig als Fruchtmark oder Nektar verarbeitet. Das bedeutet nicht, dass sie ausschließlich als verdünntes Produkt vorkommen dürfen: gesetzlich zulässige Mischungen mit anderen Fruchtsäften sind möglich.\n\n### Fachberatung\n\nAuf dem Etikett Fruchtart, Saft oder Nektar, Anteil und Mischung beachten. Einzelne Vitamin- oder Polyphenolwerte sind produktabhängig. Acerola ist als Vitamin-C-reiche Zutat bekannt, aber eine ungeprüfte Behauptung „Vitamin-C-reichste Frucht überhaupt“ ist kein belastbarer Beratungsinhalt.\n\nSensorische Begriffe wie würzig, mild oder kräftig beschreiben die verkostete Probe und nicht jede Frucht derselben Sorte.",
      "quiz": [
        {
          "question": "Wie kann eine süße Apfelsorte in der Saftherstellung eingesetzt werden?",
          "options": [
            "Sie ist grundsätzlich verboten",
            "Als Mischungspartner für ein gewünschtes Profil",
            "Nur als Konservierungsstoff",
            "Sie kann nie gepresst werden"
          ],
          "correct": 1,
          "explanation": "Die Eignung hängt von gewünschtem Profil und Mischung ab. Süße Sorten werden nicht pauschal abgewertet."
        },
        {
          "question": "Was kennzeichnet eine Saft-Cuvée?",
          "options": [
            "Nur Wasserzusatz",
            "Eine Mischung von Sorten oder Säften zur Profilgestaltung",
            "Immer zugesetzten Alkohol",
            "Eine garantierte Gesundheitswirkung"
          ],
          "correct": 1,
          "explanation": "Cuvée beschreibt eine bewusste Mischung; die passende Produktkategorie und Kennzeichnung bleiben zu beachten."
        },
        {
          "question": "Was gilt für dickflüssiges Fruchtmark?",
          "options": [
            "Es ist immer wertlos",
            "Es kann für Nektar oder geeignete Saftmischungen verwendet werden",
            "Es muss immer Zucker enthalten",
            "Es ist mit Fruchtsaftkonzentrat identisch"
          ],
          "correct": 1,
          "explanation": "Die Verordnung definiert Fruchtmark gesondert. Nektare und zulässige Mischungen nutzen unterschiedliche Rohstoffe."
        }
      ]
    },
    {
      "title": "Herstellung von Direktsaft",
      "content": "## Direktsaftproduktion: Qualität und Sicherheit verbinden\n\nDirektsaft wird ohne zwischenzeitliche Konzentratherstellung gewonnen. Die konkrete Prozesskette hängt von Frucht, gewünschter Trübung, Verpackung und Haltbarmachung ab. Eine einheitliche Temperatur oder Mindesthaltbarkeit gilt nicht für sämtliche Direktsäfte.\n\n### Rohware und Pressung\n\nGesunde, angemessen reife Früchte prüfen, waschen und sortieren. Faule oder verschimmelte Früchte sind kein akzeptabler Rohstoff allein deshalb, weil sie einen behaupteten „2-%-Faulanteil“ nicht überschreiten. Bei Apfelerzeugnissen ist **Patulin**, ein Schimmelpilzgift, ein relevanter Kontrollparameter. Ein Sinneseindruck kann dessen Gehalt nicht sicher bestimmen.\n\nZerkleinerung und Pressung trennen Saft und Trester. Pressen, Dekanter und Extraktoren sind unterschiedliche Anlagen; feste Druck- oder Leistungswerte werden nicht als allgemeingültige Verfahrenseigenschaft vermittelt.\n\n### Klar oder naturtrüb\n\nFür klare Säfte können zugelassene Enzyme und Verarbeitungshilfsstoffe sowie Filtration eingesetzt werden. **Pektinasen** bauen Pektin ab und unterstützen die Verarbeitung. Naturtrübe Säfte behalten Trubbestandteile; diese können sich absetzen. Die klare oder trübe Optik allein sagt nichts über sichere Haltbarkeit aus.\n\n### Wärme und Abfüllung\n\n**HTST** steht für „High Temperature Short Time“. Temperatur, Haltezeit und Abfüllung müssen zum Produkt und zur erforderlichen mikrobiologischen Sicherheit passen. Pasteurisierung ist nicht gleich Sterilisation. Aseptische Abfüllung und Heißabfüllung sind unterschiedliche Systeme; ein heißer Kopfraum garantiert nicht ohne Weiteres Sterilität.\n\n### Lagerung\n\nEinige Direktsäfte sind original verschlossen ungekühlt lagerfähig, andere kühlpflichtig. Maßgeblich sind das konkrete Etikett, MHD und Hinweise nach dem Öffnen. Die frühere Behauptung, sämtlicher Direktsaft müsse bei 0–7 °C gelagert werden, ist unzutreffend.",
      "quiz": [
        {
          "question": "Welches Schimmelpilzgift ist bei Apfelerzeugnissen ein relevanter Prüfparameter?",
          "options": [
            "Koffein",
            "Patulin",
            "Kohlendioxid",
            "Pektin"
          ],
          "correct": 1,
          "explanation": "Patulin ist ein Mykotoxin. Gesunde Rohware und analytische Kontrolle sind wichtig; Geruch ist kein sicherer Nachweis."
        },
        {
          "question": "Wofür steht HTST?",
          "options": [
            "High Taste Standard Treatment",
            "High Temperature Short Time",
            "Hygienic Thermal Storage",
            "Heated Sugar Treatment"
          ],
          "correct": 1,
          "explanation": "Die Abkürzung beschreibt eine kurzzeitige Wärmebehandlung, nicht eine für jeden Saft gleiche Prozessrezeptur."
        },
        {
          "question": "Welche Enzymgruppe wird zur Pektinspaltung eingesetzt?",
          "options": [
            "Lipasen",
            "Proteasen",
            "Pektinasen",
            "Nur Amylasen"
          ],
          "correct": 2,
          "explanation": "Pektinasen können in der zulässigen Saftverarbeitung den Pektinabbau unterstützen."
        }
      ]
    },
    {
      "title": "Herstellung von Fruchtsaftkonzentrat",
      "content": "## Konzentrat: Wasserentzug und korrekte Wiederherstellung\n\nFruchtsaftkonzentrat entsteht durch den physikalischen Entzug eines Teils des natürlichen Wassers. So müssen bei Lagerung und Transport kleinere Mengen bewegt werden. Das ist ein Prozessvorteil, aber kein Beweis einer pauschal besseren Gesamtökobilanz.\n\n### Eindampfung und Aroma\n\nBei der industriellen Eindampfung werden häufig Vakuumverfahren eingesetzt. Ein geringerer Druck senkt die Siedetemperatur und kann eine schonendere Verarbeitung ermöglichen. Flüchtige Aromakomponenten können getrennt gewonnen und bei der Wiederherstellung entsprechend den gesetzlichen Vorgaben zurückgeführt werden. Feste Zahl von Verdampferstufen, Aroma-Aufkonzentrierung oder Energieeinsparung gelten nicht für jede Anlage.\n\n### Brix und Mengenrechnung\n\nBrix beschreibt lösliche Trockenmasse. Konzentration und Ausbeute unterscheiden sich nach Frucht und Verfahren. Eine Volumenrechnung allein darf Masse, Dichte und lösliche Trockenmasse nicht verwechseln; aus 1.000 Litern Saft ergibt sich daher nicht automatisch eine exakte bestimmte Literzahl Konzentrat.\n\n### Rückverdünnung\n\nDas Wasser muss den gesetzlich geforderten Trinkwasseranforderungen genügen. Für wiederhergestellte Säfte gelten fruchtspezifische Mindestbrixwerte; Apfel und Orange jeweils **11,2 °Bx**. Bei nicht gelisteten Früchten gilt die entsprechende Vorgabe zum Ausgangssaft. Es wird nicht zwingend für jede Charge der ursprüngliche individuelle Brix-Wert „exakt“ reproduziert.\n\n### Qualität und Lagerung\n\nEin korrekt wiederhergestelltes Erzeugnis bleibt **Fruchtsaft aus Fruchtsaftkonzentrat**. Es muss die vorgeschriebenen wesentlichen Merkmale erhalten. Ein geübter Sensoriker erkennt nicht zwangsläufig jede Probe blind. Kühl-, Gefrier- und Haltbarkeitsbedingungen richten sich nach Produktspezifikation; „praktisch unbegrenzt haltbar“ ist keine sichere Lagerregel.",
      "quiz": [
        {
          "question": "Warum kann Vakuum bei der Eindampfung sinnvoll sein?",
          "options": [
            "Es garantiert unbegrenzte Haltbarkeit",
            "Es senkt die Siedetemperatur",
            "Es macht den Saft zu Alkohol",
            "Es entfernt alle Aromastoffe vollständig"
          ],
          "correct": 1,
          "explanation": "Ein geringerer Druck senkt den Siedepunkt. Die Prozessparameter werden produktspezifisch festgelegt."
        },
        {
          "question": "Wofür steht FCOJ?",
          "options": [
            "Fresh Citrus Orange Juice",
            "Frozen Concentrated Orange Juice",
            "Filtered Clear Orange Juice",
            "Full Colour Orange Juice"
          ],
          "correct": 1,
          "explanation": "FCOJ ist die gebräuchliche Abkürzung für gefrorenes Orangensaftkonzentrat."
        },
        {
          "question": "Welchen Mindestbrixwert nennt Anlage 6 für wiederhergestellten Apfelsaft?",
          "options": [
            "5,0 °Bx",
            "8,0 °Bx",
            "11,2 °Bx",
            "70,0 °Bx"
          ],
          "correct": 2,
          "explanation": "Die Mindestbrixwerte betreffen das wiederhergestellte Erzeugnis, nicht eine universelle Konzentratstärke."
        }
      ]
    },
    {
      "title": "Apfelsaft — Deutschlands Nr. 1",
      "content": "## Apfelsaft: Sorte, Trübung und Geschmack\n\nApfelsaft ist eine wichtige Kategorie im deutschen Saftregal. Die heute gelesene VdF-Branchenseite nennt für 2025 einen Pro-Kopf-Verbrauch von **4,7 Litern Apfelsaft**. Dieser Wert ist vom Verbrauch von Apfelsaftschorle und von sämtlichen Fruchtsäften zu unterscheiden.\n\n### Sorten und Mischung\n\nBoskoop, Elstar, Bittenfelder und andere Sorten können unterschiedliche sensorische Eindrücke beitragen. Ob eine Probe würzig, mild oder säurebetont wirkt, hängt auch von Reife, Erntejahr und Verarbeitung ab. Sortenmischungen können ein bewusst gestaltetes Profil liefern; reine süße Sorten sind nicht grundsätzlich schlechter.\n\n### Klar und naturtrüb\n\nFür klaren Apfelsaft werden Trubbestandteile durch geeignete Verfahren abgetrennt. Naturtrüber Saft enthält solche Bestandteile und kann sich im Aussehen und Mundgefühl unterscheiden. Sortierung, Enzymbehandlung und Filtration beeinflussen die Zusammensetzung. Daraus folgt keine feste Polyphenolmenge für jede Flasche und keine garantierte entzündungshemmende oder krankheitsvorbeugende Wirkung.\n\nBei veganen Anforderungen ist gegebenenfalls die Herstellerinformation zu Verarbeitungshilfsstoffen hilfreich; nicht jedes historisch mögliche Klärungsmittel wird in jeder Produktion verwendet.\n\n### Schorle\n\nBeim Mischen mit Wasser sinken Zucker und Energie **pro gleicher Getränkemenge**, weil weniger Saft darin enthalten ist. Die gesamte Zuckermenge der ursprünglichen Saftportion verschwindet dadurch nicht. Die DGE empfiehlt als Getränkemischung etwa **einen Teil Saft zu drei Teilen Wasser**. Das ist keine pauschale Bestätigung einer isotonischen Zusammensetzung oder Eignung für jede sportliche Belastung.\n\n### Verkostung\n\nKlaren und naturtrüben Saft unter gleichen Bedingungen vergleichen. Persönliche Präferenz, Nährwerttabelle und tatsächliches Herstellungsverfahren getrennt beurteilen.",
      "quiz": [
        {
          "question": "Was unterscheidet naturtrüben von klarem Apfelsaft?",
          "options": [
            "Naturtrüb enthält grundsätzlich keinen Zucker",
            "Naturtrüb behält Trubbestandteile, die bei klaren Säften abgetrennt werden",
            "Klarer Saft muss eine Limonade sein",
            "Naturtrüb ist immer steril"
          ],
          "correct": 1,
          "explanation": "Trübung beschreibt die Zusammensetzung und Optik, nicht automatisch eine Heilwirkung oder Sicherheit."
        },
        {
          "question": "Was kann eine Sortenmischung in Apfelsaft leisten?",
          "options": [
            "Eine garantierte Krampfvorbeugung",
            "Ein gewünschtes Süße-Säure- und Aromaprofil gestalten",
            "Alle Kohlenhydrate entfernen",
            "Das MHD unbegrenzt verlängern"
          ],
          "correct": 1,
          "explanation": "Die Mischung ist ein sensorisches Gestaltungsmittel, kein pauschales Gesundheitsversprechen."
        },
        {
          "question": "Welches Verhältnis empfiehlt die DGE als Saftschorle im Getränkekontext?",
          "options": [
            "Drei Teile Saft zu einem Teil Wasser",
            "Ein Teil Saft zu drei Teilen Wasser",
            "Nur puren Saft",
            "Ein Teil Zucker zu einem Teil Saft"
          ],
          "correct": 1,
          "explanation": "Die DGE nennt 1:3. Die genaue Osmolalität ist damit nicht automatisch belegt."
        }
      ]
    },
    {
      "title": "Orangensaft — Rohstoff, Verarbeitung und Lieferkette",
      "content": "## Orangensaft: Rohstoff, Verarbeitung und Lieferkette\n\nOrangensaft gibt es als Direktsaft und als Saft aus Konzentrat. Für beide sind konkrete Rohstoffqualität, Verarbeitung und richtige Kennzeichnung entscheidend. Ein Land, eine Sorte oder ein Preis beweist nicht automatisch die Qualität jeder Flasche.\n\n### Verarbeitung\n\nDie Frucht wird geprüft, gewaschen und entsaftet. Schalenbestandteile und bittere Komponenten sollen kontrolliert werden. Nach der Gewinnung folgen je nach Produkt weitere Verarbeitung, Haltbarmachung und Abfüllung. **NFC** bedeutet „Not From Concentrate“; **FCOJ** bezeichnet „Frozen Concentrated Orange Juice“.\n\nEin pauschaler Ausschluss sämtlicher Navel-Orangen aus der Saftproduktion ist zu streng. Bitterkeit kann von Sorte, Reife, Extraktion und Lagerung abhängen. Ebenso gelten feste Maschinenleistungen oder universelle Farbranglisten zwischen Herkunftsländern nicht für jedes Produkt.\n\n### Citrus Greening\n\nDie US-Pflanzenschutzbehörde APHIS beschreibt **Huanglongbing (HLB), auch Citrus Greening**, als bakterielle Zitruspflanzenkrankheit. In den USA wird sie durch den Asiatischen Zitrusblattfloh übertragen. Betroffene Bäume können weniger und qualitativ veränderte Früchte liefern. Die Krankheit ist kein direktes Gesundheitsrisiko für Menschen durch den Konsum von Zitrusfrüchten; ihre Auswirkungen auf Ernten und Versorgung sind dennoch erheblich.\n\n### Marktangaben\n\nErntemengen, Anbauregionen und Lieferverträge können Preise beeinflussen. Hier werden keine ungeprüften Weltmarktanteile, Ernteverlustquoten oder Börsenkurse als aktueller Stand verwendet. Für Handelsentscheidungen die jeweilige Saison, Vertragsart und Quelle nennen.\n\n### Vergleich\n\nFruchtgehalt, Herkunftsangaben, Direktsaft oder Konzentrat und Nährwerte prüfen. Geschmack, Farbe und Fruchtfleischanteil anschließend als Merkmale der tatsächlichen Probe beschreiben.",
      "quiz": [
        {
          "question": "Welche Pflanzenkrankheit ist auch als HLB bekannt?",
          "options": [
            "Feuerbrand",
            "Citrus Greening",
            "Mehltau",
            "Grauschimmel"
          ],
          "correct": 1,
          "explanation": "APHIS beschreibt HLB als bakterielle Erkrankung von Zitruspflanzen."
        },
        {
          "question": "Was bedeutet NFC bei Orangensaft?",
          "options": [
            "No Fruit Content",
            "Not From Concentrate",
            "Natural Food Colour",
            "New Frozen Citrus"
          ],
          "correct": 1,
          "explanation": "NFC kennzeichnet die Verarbeitung ohne Konzentratstufe."
        },
        {
          "question": "Welche Aussage zu Citrus Greening trifft laut APHIS zu?",
          "options": [
            "Es ist eine direkte Vergiftung von Menschen durch Saft",
            "Es schädigt Zitruspflanzen und ihre Erträge, ist aber keine direkte Gesundheitsbedrohung für Menschen oder Tiere",
            "Es wird durch Kohlensäure geheilt",
            "Es betrifft nur Apfelbäume"
          ],
          "correct": 1,
          "explanation": "Pflanzenkrankheit und Lebensmittelsicherheitsrisiko sind nicht gleichzusetzen."
        }
      ]
    },
    {
      "title": "Exotische Säfte: Mango, Maracuja und Granatapfel",
      "content": "## Exotische Fruchtprofile ohne Superfood-Versprechen\n\nMango, Passionsfrucht und Granatapfel können unterschiedliche Konsistenz, Säure und Geschmacksintensität liefern. Die Produktbezeichnung ist dabei wichtiger als ein „Superfood“-Werbename.\n\n### Mango\n\nMangofruchtfleisch wird häufig als Fruchtmark verarbeitet. Ein Mangonektar enthält Wasser und mindestens **25 % Fruchtsaft oder Fruchtmark**. Das ist ein Mindestwert, keine vorgeschriebene feste Rezeptur. Mangomark darf unter passenden Vorgaben auch in Saftmischungen verwendet werden; es muss nicht immer verdünnt werden, „um überhaupt trinkbar zu sein“.\n\n### Passionsfrucht\n\nPassionsfruchtprodukte können sehr säurebetont wirken und als Saft, Nektar oder Zutat in Mischungen angeboten werden. Für Nektar gilt mindestens **25 % Fruchtanteil**. Die gelbe und violette Frucht werden im Handel teils unterschiedlich bezeichnet; für die tatsächliche Zusammensetzung zählt die konkrete Produktinformation.\n\n### Granatapfel\n\nRubinrote Farbe, herbe oder adstringierende Noten sind mögliche Verkostungseindrücke. Pflanzeninhaltsstoffe sind ein Forschungsgebiet, aber ein Laborwert für antioxidative Kapazität, etwa **ORAC**, beweist keinen Schutz vor Herzkrankheiten oder Krebs beim Menschen. Unbelegte besondere Gesundheitswirkungen werden hier nicht vermittelt.\n\n### Auswahl im Handel\n\nSaft, Nektar und Fruchtsaftgetränk vergleichen: tatsächlicher Fruchtanteil, Zutaten, Zucker und Portion. Einen besonderen Geschmack empfehlen, ohne aus einer Fruchtart eine medizinische Empfehlung abzuleiten. Exotische Herkunft kann längere Transportwege bedeuten, bestimmt aber allein keine vollständige Umweltbilanz.",
      "quiz": [
        {
          "question": "Welcher Mindestfruchtanteil gilt für Mangonektar?",
          "options": [
            "10 %",
            "25 %",
            "75 %",
            "Immer genau 100 %"
          ],
          "correct": 1,
          "explanation": "Anlage 5 nennt Mango in der Gruppe mit mindestens 25 % Fruchtsaft oder Fruchtmark."
        },
        {
          "question": "Was beweist ein hoher ORAC-Laborwert nicht?",
          "options": [
            "Eine Eigenschaft im jeweiligen Labortest",
            "Eine garantierte krankheitsvorbeugende Wirkung des Getränks beim Menschen",
            "Dass ein bestimmter Test durchgeführt wurde",
            "Die Aussage des verwendeten Messverfahrens"
          ],
          "correct": 1,
          "explanation": "Laboraktivität und ein klinisch belegter Gesundheitsnutzen sind unterschiedliche Evidenzstufen."
        },
        {
          "question": "Welcher Mindestfruchtanteil gilt für Passionsfruchtnektar?",
          "options": [
            "10 %",
            "25 %",
            "50 %",
            "75 %"
          ],
          "correct": 1,
          "explanation": "Der gesetzliche Mindestwert ist fruchtspezifisch. Für Passionsfrucht sind es 25 %."
        }
      ]
    },
    {
      "title": "Gemüsesäfte — Tomate, Karotte und Co.",
      "content": "## Gemüsesäfte: Zusammensetzung und Kategorie prüfen\n\nGemüsesäfte bieten unterschiedliche Geschmackserlebnisse. Tomate, Karotte und Rote Bete sind dabei keine austauschbaren Produkte. Zucker-, Salz- und Nährstoffgehalte hängen vom konkreten Saft und seiner Rezeptur ab.\n\n### Rechtliche Besonderheit der Tomate\n\nObwohl Tomatensaft im Alltag zu Gemüsesäften gezählt wird, umfasst die **Fruchtsaftverordnung ausdrücklich Tomaten**. Sie erlaubt bei Tomatensaft unter anderem Salz, Gewürze und aromatische Kräuter. Die pauschale frühere Aussage, kein Gemüsesaft falle unter diese Verordnung, ist deshalb falsch. Für weitere Gemüseprodukte sind die passenden lebensmittelrechtlichen Vorgaben und Leitsätze zu berücksichtigen.\n\n### Geschmack und Inhaltsstoffe\n\nTomatensaft kann herzhaft und umamibetont wirken. Ein Flugzeugkontext liefert jedoch keine universelle Aussage, er schmecke für jeden besser oder Süße und Salz nähmen stets um exakt 30 % ab. Karottensaft kann eine süßliche Note und carotinoidhaltige Farbe aufweisen. Ein bestimmtes Glas deckt nicht ohne Produktanalyse und Bezugswert automatisch den individuellen Vitamin-A-Bedarf.\n\n### Rote Bete und Forschung\n\nNitrat in Rote-Bete-Produkten wird im Sportkontext untersucht. Daraus folgt keine für jede Person oder jede Portion garantierte Leistungsverbesserung um 1–3 %. Hier werden keine individuellen Dosierungen oder gesundheitlichen Empfehlungen abgeleitet.\n\n### Fermentierte und gemischte Produkte\n\nMilchsauer vergorener Sauerkrautsaft ist nicht automatisch ein klinisch belegtes „probiotisches“ Mittel; Haltbarmachung kann die Mikroorganismen verändern. Ein Ingwer-Shot kann Saft, Saftmischung oder ein anderes Getränk sein. Zutaten und Produktbezeichnung entscheiden, nicht allein die kleine Flasche.",
      "quiz": [
        {
          "question": "Welche Aussage zu Tomatensaft ist rechtlich richtig?",
          "options": [
            "Die Fruchtsaftverordnung schließt Tomaten ausdrücklich aus",
            "Die Fruchtsaftverordnung umfasst Tomaten und erlaubt bestimmte würzende Zutaten",
            "Tomatensaft darf nie Salz enthalten",
            "Tomatensaft ist immer ein Arzneimittel"
          ],
          "correct": 1,
          "explanation": "Tomaten stehen ausdrücklich in der Fruchtdefinition. Anlage 3 nennt Salz, Gewürze und aromatische Kräuter für Tomatensaft."
        },
        {
          "question": "Wie sind Nährstoffangaben für Karottensaft zu prüfen?",
          "options": [
            "Jedes Glas deckt automatisch den individuellen Bedarf",
            "Konkreter Gehalt, Portion und Bezugswert müssen zusammenpassen",
            "Nur die Farbe entscheidet",
            "Man braucht keine Produktinformation"
          ],
          "correct": 1,
          "explanation": "Produktabhängige Zusammensetzung erlaubt keine feste Versorgungsgarantie für jede Person."
        },
        {
          "question": "Welche Aussage zu Rote-Bete-Saft ist sachlich?",
          "options": [
            "Er verbessert jede Leistung garantiert um 3 %",
            "Forschung zu Nitrat begründet keine pauschale Leistungsgarantie für jede Portion und Person",
            "Er enthält grundsätzlich keinen Zucker",
            "Er ist für jede Krankheit geeignet"
          ],
          "correct": 1,
          "explanation": "Ergebnisse aus bestimmten Studienbedingungen dürfen nicht als allgemeine Wirkung jeder Flasche verkauft werden."
        }
      ]
    },
    {
      "title": "Smoothies vs. Säfte — Unterschiede und Gemeinsamkeiten",
      "content": "## Smoothie und Saft: die konkrete Rezeptur entscheidet\n\nFruchtsaft wird durch Pressung oder andere geeignete Verfahren gewonnen. Fruchtmark enthält den genießbaren pürierten Teil der Frucht ohne vollständige Saftabtrennung. Smoothies können solche Pürees, Säfte und weitere Zutaten kombinieren.\n\n### Ballaststoffe\n\nEin stärker püreehaltiges Produkt kann mehr Fruchtbestandteile und Ballaststoffe enthalten als ein klarer Saft. Wie viel tatsächlich enthalten ist, hängt von Frucht, Schalenanteil, Verdünnung und Rezeptur ab. „Smoothie enthält immer sämtliche Fasern“ wäre daher zu pauschal. Eine feste GI-Differenz von 15–25 Punkten gegenüber Saft ist ebenfalls nicht generell belegt.\n\n### Bezeichnung und Etikett\n\n„Smoothie“ ist keine in der Fruchtsaftverordnung einheitlich definierte Erzeugnisart mit einem eigenen Mindestfruchtgehalt. Das hebt die allgemeinen Regeln gegen Irreführung und für zutreffende Kennzeichnung nicht auf. Die Zutatenliste und gegebenenfalls die rechtliche Produktbezeichnung zeigen, ob es eine Fruchtmischung mit Saft, Püree oder weiteren Zutaten ist.\n\n### Haltbarmachung\n\nWärmebehandlung oder **HPP (High Pressure Processing)** können je nach Produkt eingesetzt werden. HPP arbeitet mit hohem Druck und reduziert vor allem vegetative Mikroorganismen, ist aber keine universelle Sterilisation. Druckbehandelte Getränke brauchen geeignete Prozessvalidierung und in der Regel Kühlung.\n\n### Praxisvergleich\n\nKonsistenz, Säure, Süße, Portion und Nährwerte vergleichen. Fruchtpüree ist nicht automatisch kalorienfrei oder ein besserer Durstlöscher. Frisch zubereitete Mischungen hygienisch behandeln und zeitnah verwenden. Für Handelsware Lager- und Verbrauchshinweise beachten statt eine allgemeine Zwei- oder Drei-Tage-Frist aus dem Namen „Smoothie“ abzuleiten.",
      "quiz": [
        {
          "question": "Wovon hängt der Ballaststoffgehalt eines Smoothies ab?",
          "options": [
            "Nur vom Namen",
            "Von Fruchtbestandteilen und konkreter Rezeptur",
            "Nur vom Preis",
            "Er beträgt immer genau 4 g/100 ml"
          ],
          "correct": 1,
          "explanation": "Püreeanteil, Frucht und weitere Zutaten beeinflussen den tatsächlichen Ballaststoffgehalt."
        },
        {
          "question": "Was bedeutet der fehlende eigene Smoothie-Mindestfruchtgehalt in der Fruchtsaftverordnung?",
          "options": [
            "Keine Kennzeichnungspflichten gelten",
            "Die konkrete Zusammensetzung und zutreffende Produktinformation bleiben entscheidend",
            "Es darf beliebig irreführend geworben werden",
            "Alle Smoothies sind Nektare"
          ],
          "correct": 1,
          "explanation": "Ein nicht einheitlich definierter Werbename hebt allgemeine Lebensmittelregeln nicht auf."
        },
        {
          "question": "Welches Verfahren nutzt hohen Druck zur Haltbarmachung?",
          "options": [
            "Nur Gefriertrocknung",
            "HPP — High Pressure Processing",
            "Nur Ozonbehandlung",
            "Nur Glasabfüllung"
          ],
          "correct": 1,
          "explanation": "HPP ist ein Druckverfahren, keine universelle Sterilisation. Die Kühlkette und Prozessvalidierung bleiben wichtig."
        }
      ]
    },
    {
      "title": "Nährstoffe und Vitamine im Fruchtsaft",
      "content": "## Nährstoffe: Produktwerte statt pauschaler Versprechen\n\nFruchtsäfte können Vitamine und Mineralstoffe liefern. Die tatsächlichen Mengen hängen von Frucht, Rezeptur, Herstellung und Lagerung ab. Für die Beratung sind Nährwerttabelle, Portion und gegebenenfalls Herstelleranalyse entscheidend.\n\n### Vitamin C\n\nDie DGE empfiehlt erwachsenen Männern **110 mg**, erwachsenen Frauen **95 mg Vitamin C täglich**; für einzelne Lebenssituationen gelten andere Werte. Diese Zufuhrempfehlung ist nicht identisch mit dem einheitlichen Nährstoffbezugswert auf einem Lebensmitteletikett.\n\nVitamin C reagiert empfindlich auf bestimmte Verarbeitungs- und Lagerbedingungen. Wie schnell es abnimmt, hängt vom Produkt, Sauerstoffkontakt, Zeit und Temperatur ab. Eine für jede geöffnete Flasche geltende Abnahme von „20–40 % in sieben Tagen“ wird nicht behauptet. Hinweise zum Verbrauch nach Öffnung sind wichtiger als ein solcher pauschaler Prozentwert.\n\n### Weitere Inhaltsstoffe\n\nKalium, Folat oder Carotinoide können je nach Produkt vorkommen. Ihr Gehalt darf nicht aus einem allgemeinen Fruchtnamen für jede Flasche berechnet werden. β-Carotin ist ein Provitamin-A-Carotinoid; eine Vitaminwirkung ist nicht mit der Farbe oder einem nicht gemessenen Saftanteil garantiert.\n\n### Pflanzenstoffe und Aussagen\n\nPolyphenole sind eine vielfältige Stoffgruppe. Ein höherer analytischer Gehalt oder eine antioxidative Wirkung im Reagenzglas bedeutet nicht automatisch Krebsprävention oder eine entzündungshemmende Wirkung des Safts beim Menschen. Solche früheren pauschalen Versprechen werden nicht übernommen.\n\nVitamin C kann die Aufnahme von pflanzlichem Nicht-Häm-Eisen unterstützen; ein fester Faktor von drei bis sechs gilt jedoch nicht für jede Mahlzeit und Person. Gesundheitsbezogene Werbeaussagen benötigen die zulässige Form und ihre Bedingungen. „Viel Vitamin“ ist kein Ersatz für eine vollständige Ernährungsberatung.",
      "quiz": [
        {
          "question": "Wie ist eine feste Vitamin-C-Abnahme für jede geöffnete Saftflasche einzuordnen?",
          "options": [
            "Sie beträgt immer genau 30 %",
            "Sie ist ohne Produkt- und Lagerbedingungen nicht pauschal festlegbar",
            "Vitamin C ist unbegrenzt stabil",
            "Sie hängt nur von der Flaschenfarbe ab"
          ],
          "correct": 1,
          "explanation": "Zeit, Temperatur, Sauerstoff und Zusammensetzung beeinflussen den tatsächlichen Gehalt. Verbrauchshinweise beachten."
        },
        {
          "question": "Welche Vitamin-C-Zufuhr empfiehlt die DGE für erwachsene Männer und Frauen?",
          "options": [
            "Jeweils immer 80 mg",
            "110 mg für Männer und 95 mg für Frauen",
            "Jeweils 500 mg",
            "Jeweils 1.000 mg"
          ],
          "correct": 1,
          "explanation": "Die DGE-Zufuhrempfehlung ist von den Nährstoffbezugswerten der Etikettierung zu unterscheiden."
        },
        {
          "question": "Was folgt aus einem hohen Polyphenolgehalt nicht automatisch?",
          "options": [
            "Ein analytisch beschreibbarer Inhaltsstoffgehalt",
            "Eine garantierte Krebsprävention durch das Getränk",
            "Dass verschiedene Früchte verschiedene Profile haben",
            "Dass eine Analyse erforderlich sein kann"
          ],
          "correct": 1,
          "explanation": "Inhaltsstoff- und Laborbefunde sind keine allgemeine klinische Wirkungsgarantie."
        }
      ]
    },
    {
      "title": "Zucker und Gesundheit — Die Debatte um Fruchtsaft",
      "content": "## Zucker in Fruchtsaft bewusst einordnen\n\n„Ohne zugesetzten Zucker“ heißt nicht „zuckerfrei“. Fruchtsaft enthält natürlicherweise Zucker; für die konkrete Menge sind Nährwerttabelle und Portion entscheidend. Unterschiedliche Früchte und Produkte liefern unterschiedliche Werte.\n\n### WHO-Empfehlung\n\nDie WHO zählt Zucker in Fruchtsäften und Fruchtsaftkonzentraten zu **freien Zuckern**. Sie empfiehlt weniger als **10 % der täglichen Energiezufuhr** aus freien Zuckern; weniger als **5 %** kann zusätzliche Vorteile bieten. Bei einem Rechenbeispiel mit 2.000 kcal entsprechen 10 % etwa 50 g, 5 % etwa 25 g Zucker. Das sind keine für alle Menschen identischen absoluten Grammgrenzen.\n\n### Portionen richtig rechnen\n\nEnthält ein Saft laut Etikett 10 g Zucker pro 100 ml, liefern 200 ml **20 g Zucker**. Verdünnung senkt den Gehalt je 100 ml der Mischung, aber nicht die Gesamtzuckermenge derselben verwendeten Saftportion. Mineralstoffe oder Polyphenole machen diesen Zucker nicht unschädlich.\n\n### Saft und ganze Frucht\n\nSaft und eine ganze Frucht unterscheiden sich in Struktur und meist auch Ballaststoffgehalt. Daraus folgt keine feste GI-Zahl für jede Frucht oder jede Saftflasche. Ganze Früchte bleiben eine sinnvolle eigene Lebensmittelgruppe; Saft ist kein pauschaler gleichwertiger Ersatz.\n\n### Alltagsberatung\n\nDie DGE empfiehlt Wasser und kalorienfreie Getränke als bevorzugte Durstlöscher und nennt Saftschorlen mit einem Teil Saft zu drei Teilen Wasser. Eine universelle DGE-Tageshöchstmenge von 150 ml wird hier nicht behauptet. Ebenso werden keine ungeprüften Diabetes-Schutzwirkungen oder ausländischen Steuer- und Werberegeln als Grundlage der Beratung verwendet.",
      "quiz": [
        {
          "question": "Wie ordnet die WHO den Zucker in Fruchtsaft ein?",
          "options": [
            "Als grundsätzlich unbedenklich",
            "Als freien Zucker",
            "Als Vitamin",
            "Als in der Zuckerbilanz irrelevant"
          ],
          "correct": 1,
          "explanation": "Die WHO-Definition umfasst natürlich vorkommende Zucker in Fruchtsaft und Konzentrat, nicht nur zusätzlich zugesetzten Zucker."
        },
        {
          "question": "Wie viel Zucker liefern 200 ml Saft bei 10 g Zucker pro 100 ml?",
          "options": [
            "5 g",
            "10 g",
            "20 g",
            "40 g"
          ],
          "correct": 2,
          "explanation": "Die Portion ist zweimal 100 ml: 2 × 10 g = 20 g."
        },
        {
          "question": "Was bewirkt Verdünnung einer vorhandenen Saftportion mit Wasser?",
          "options": [
            "Sie entfernt den Zucker der Saftportion",
            "Sie senkt die Konzentration pro 100 ml Mischung, nicht die Gesamtzuckermenge der verwendeten Saftportion",
            "Sie macht den Zucker zu Ballaststoff",
            "Sie garantiert einen niedrigeren GI"
          ],
          "correct": 1,
          "explanation": "Wasser verändert die Konzentration, nicht die bereits im Saft enthaltene Zuckermasse."
        }
      ]
    },
    {
      "title": "Bio-Säfte — Standards, Anbau und Markt",
      "content": "## Bio-Saft: kontrollierte Erzeugung, keine Gesundheitsgarantie\n\nDie Bio-Kennzeichnung bezieht sich auf geregelte Erzeugungs- und Verarbeitungsbedingungen. Sie ist nicht gleichbedeutend mit „zuckerfrei“, „rückstandsfrei“ oder einer bewiesenen gesundheitlichen Überlegenheit jedes Safts.\n\n### EU-Bio-Kennzeichnung\n\nFür vorverpackte in der EU erzeugte Bio-Lebensmittel ist das **EU-Bio-Logo** nach den einschlägigen Vorgaben verpflichtend. Dazu gehören die Codenummer der Kontrollstelle und die Herkunftsangabe der landwirtschaftlichen Zutaten, etwa EU- oder Nicht-EU-Landwirtschaft. Ein deutscher Kontrollstellencode hat die Form **DE-ÖKO-XXX**. Das ersetzt keinen regionalen Herkunftsnachweis: Bio und regional sind unterschiedliche Eigenschaften.\n\n### Anbau und Verarbeitung\n\nDie EU-Öko-Regeln begrenzen Betriebsmittel und Verfahren. Zugelassene Pflanzenschutzmittel und Hilfsstoffe dürfen unter ihren jeweiligen Bedingungen eingesetzt werden; „Bio nutzt überhaupt keine Pflanzenschutzmittel“ wäre falsch. Eine feste Zahl wie „56 Zusatzstoffe“ kann sich ändern und wird hier nicht als zeitlose Regel vermittelt.\n\n### Private Standards\n\nVerbandszeichen wie Demeter, Bioland oder Naturland weisen auf zusätzliche private Anforderungen hin. Die jeweils aktuellen Richtlinien sind maßgeblich. Widersprüchliche pauschale Aussagen wie „Kupfer ist verboten, maximal drei Kilogramm sind erlaubt“ werden nicht übernommen. Unterschiedliche Siegel nicht als austauschbar behandeln.\n\n### Beratung und Geschmack\n\nDirektsaft, Konzentrat, Nektar, Fruchtanteil und Nährwerte bleiben auch bei Bio-Produkten relevant. Geschmack kann von Sorte, Reife und Verarbeitung abhängen; ein Siegel garantiert nicht, dass jede Blindprobe bevorzugt wird. Preisaufschläge und Ertragsunterschiede sind betriebsspezifisch und keine festen Qualitätsmaßstäbe.",
      "quiz": [
        {
          "question": "Welche Angaben gehören zur EU-Bio-Kennzeichnung?",
          "options": [
            "Nur ein grünes Blatt",
            "Kontrollstellencode und Herkunft der landwirtschaftlichen Zutaten",
            "Nur der Verkaufspreis",
            "Nur ein Gesundheitsversprechen"
          ],
          "correct": 1,
          "explanation": "Die Ministeriumsinformation nennt Logo, Kontrollstellencode und Herkunftsangabe zusammen."
        },
        {
          "question": "Was bedeutet Bio nicht automatisch?",
          "options": [
            "Kontrollierte Erzeugungsregeln",
            "Regionalität, Zuckerfreiheit oder eine garantierte Gesundheitsüberlegenheit",
            "Besondere Kennzeichnung",
            "Eine Öko-Kontrollstelle"
          ],
          "correct": 1,
          "explanation": "Bio, regional und Nährstoffzusammensetzung sind unterschiedliche Aussagen."
        },
        {
          "question": "Wie sind private Verbandszeichen einzuordnen?",
          "options": [
            "Als für alle Verbände identische Regeln",
            "Als zusätzliche Standards, deren aktuelle Richtlinien einzeln zu prüfen sind",
            "Als Arzneimittelzulassung",
            "Als Garantie eines bestimmten Polyphenolgehalts"
          ],
          "correct": 1,
          "explanation": "Private Standards können über EU-Bio hinausgehen; ihre Bedingungen unterscheiden sich."
        }
      ]
    },
    {
      "title": "Regionale Streuobstwiesensäfte",
      "content": "## Streuobstwiesensäfte: Kulturlandschaft und konkrete Herkunft\n\nStreuobstanbau verbindet Obstbäume, Flächennutzung, Wissen und Pflege. Er trägt zum Erhalt von Sorten und artenreichen Lebensräumen bei. Für einen regionalen Saft sollten Herkunft und tatsächliche Rohstoffverwendung nachvollziehbar sein.\n\n### Kulturerbe richtig benennen\n\n**Streuobstanbau wurde 2021 in das Bundesweite Verzeichnis des Immateriellen Kulturerbes aufgenommen.** Dies ist eine nationale Anerkennung, dokumentiert durch die Deutsche UNESCO-Kommission. Es ist nicht dasselbe wie eine Aufnahme in die internationale UNESCO-Liste oder ein Welterbetitel für jede Streuobstwiese.\n\n### Landschaft und Sorten\n\nStreuobstbestände sind typischerweise locker über eine Fläche verteilt und können verschiedene Obstsorten und -arten enthalten. Pflege, Nachpflanzung, Ernte und Verarbeitung halten die Kultur lebendig. Eine starre Bestandszahl, Sortenzahl oder pauschale Fläche wird hier nicht als gesicherter heutiger Stand verwendet.\n\n### Saft und Geschmack\n\nSortenmischungen können ein eigenständiges Profil liefern. Säure, Gerbstoffe und Trübung unterscheiden sich jedoch nach Sorte, Ernte und Verarbeitung. „Streuobstsaft hat stets mehr Polyphenole“ oder „geschulte Panels bevorzugen ihn immer“ sind keine verlässlichen Garantien. Sensorische Beobachtungen als Merkmale der konkreten Probe formulieren.\n\n### Wirtschaft und Beratung\n\nAufpreisinitiativen oder regionale Vermarktung können Pflege und Erhalt unterstützen. Ein bestimmter Verkaufspreis garantiert aber keine Rentabilität; Erntekosten, Ertrag und Auszahlung sind betriebsspezifisch. „Streuobst“ macht ein Produkt nicht automatisch Bio. Herkunft, eventuelle Bio-Zertifizierung, Saftart und Nährwerte separat erklären.",
      "quiz": [
        {
          "question": "Welche Anerkennung erhielt Streuobstanbau 2021?",
          "options": [
            "Automatisch internationales UNESCO-Welterbe",
            "Aufnahme in das Bundesweite Verzeichnis des Immateriellen Kulturerbes",
            "Arzneimittelzulassung",
            "Pflicht-Biozertifizierung aller Bestände"
          ],
          "correct": 1,
          "explanation": "Die Deutsche UNESCO-Kommission dokumentiert die nationale Verzeichnisaufnahme. Internationale UNESCO-Listen sind davon zu unterscheiden."
        },
        {
          "question": "Was folgt aus „Streuobstsaft“ nicht automatisch?",
          "options": [
            "Eine Herkunftsangabe zur Rohware",
            "Bio-Zertifizierung oder eine feste Gesundheitswirkung",
            "Ein mögliches eigenes Geschmacksprofil",
            "Die Möglichkeit regionaler Vermarktung"
          ],
          "correct": 1,
          "explanation": "Streuobst und Bio sind unterschiedliche Aussagen; Gesundheitswirkungen brauchen gesonderte Belege."
        },
        {
          "question": "Was unterstützt den Fortbestand der Streuobstkultur?",
          "options": [
            "Alle Bäume ohne Pflege sich selbst überlassen",
            "Pflege, Nachpflanzung, Wissen und Verarbeitung der Früchte",
            "Nur eine dekorative Flasche",
            "Eine garantierte Mindestmarge"
          ],
          "correct": 1,
          "explanation": "Die UNESCO-Kommission beschreibt Wissen, Fertigkeiten und Engagement als wichtige Voraussetzungen des Erhalts."
        }
      ]
    },
    {
      "title": "Qualitätskontrolle und Sensorik",
      "content": "## Saftqualität: Analytik, Herkunft und Sensorik verbinden\n\nEine Qualitätsprüfung kombiniert mehrere Messverfahren und nachvollziehbare Lieferketten. Ein einzelner Messwert oder ein Sinneseindruck beweist weder Echtheit noch Sicherheit einer ganzen Charge.\n\n### Chemisch-physikalische Prüfung\n\nBrix, Dichte, pH und titrierbare Säure beantworten unterschiedliche Fragen. **Brix** beschreibt lösliche Trockenmasse; **pH** beschreibt die Säureeigenschaft; die **titrierbare Säure** erfasst eine andere Größe. Normale Schwankungen durch Frucht, Sorte und Herkunft müssen bei der Interpretation berücksichtigt werden.\n\nEin niedriger Prolinwert allein beweist keine Verfälschung. Die frühere allgemeine Behauptung „jeder echte Orangensaft muss mindestens 600 mg/l Prolin enthalten“ wird ohne passende, aktuelle und zugängliche Bewertungsgrundlage nicht als Regel gelehrt.\n\n### Industrielle Selbstkontrolle\n\n**SGF** heißt heute **Safe – Global – Fair**. Die Organisation beschreibt eine freiwillige Kontrolle der Saftlieferkette, Qualitäts- und Authentizitätsprüfungen. NMR-Profiling kann Muster und Auffälligkeiten anhand von Referenzdaten untersuchen. Das ist vom speziellen SNIF-NMR-Isotopenverfahren zu unterscheiden; nicht jede NMR-Analyse misst dieselben Isotopenverhältnisse. Ein Screeningbefund muss fachlich eingeordnet und gegebenenfalls bestätigt werden.\n\n### Sensorik\n\nAussehen, Geruch, Süße, Säure, Bitterkeit, Mundgefühl und Nachgeschmack systematisch beschreiben. „Muffig“ identifiziert kein bestimmtes Mykotoxin; ein normaler Geschmack garantiert dessen Abwesenheit nicht. Unerwartete Trübung bei Klarsaft, Gärzeichen oder beschädigte Packungen sind Anlass zur Sperrung und Reklamation.\n\n### Verantwortung\n\nReferenzrichtlinien und freiwillige Kontrollen ersetzen weder geltende Höchstgehalte noch die Verantwortung des Lebensmittelunternehmens. Nicht automatisch jede Abweichung als Betrug bezeichnen; Laborverfahren, Unsicherheit und Chargenbezug beachten.",
      "quiz": [
        {
          "question": "Welche Kombination ist für die Qualitätseinordnung sinnvoll?",
          "options": [
            "Nur ein Brix-Wert",
            "Mehrere passende Analysen, Herkunftsnachweise und sensorische Beobachtungen",
            "Nur der Preis",
            "Nur die Farbe"
          ],
          "correct": 1,
          "explanation": "Jedes Verfahren beantwortet andere Fragen. Einzelwerte benötigen fachliche Interpretation."
        },
        {
          "question": "Wofür steht SGF nach der heute gelesenen Organisationsseite?",
          "options": [
            "Sugar Guaranteed Free",
            "Safe – Global – Fair",
            "Saft-Gesetz-Freigabe",
            "Standard Glass Filling"
          ],
          "correct": 1,
          "explanation": "Die Organisation beschreibt ihre freiwillige industrielle Selbstkontrolle unter dem Namen Safe – Global – Fair."
        },
        {
          "question": "Was beweist ein muffiger Geruch nicht?",
          "options": [
            "Eine sensorische Abweichung",
            "Den sicheren Nachweis eines bestimmten Mykotoxins",
            "Einen Reklamationsanlass",
            "Dass weitere Prüfung nötig sein kann"
          ],
          "correct": 1,
          "explanation": "Geruch kann Abweichungen zeigen, aber weder Patulin sicher erkennen noch seine Abwesenheit garantieren."
        }
      ]
    },
    {
      "title": "Verpackung: Tetra Pak, Glas und PET",
      "content": "## Saftverpackung: Barriere, Nutzung und Umweltwirkung\n\nVerbundkarton, Glas, PET und Bag-in-Box erfüllen unterschiedliche Anforderungen. Das passende Gebinde wird zusammen mit Behandlung, Transport, Ausschank und Recycling betrachtet.\n\n### Verbundkarton\n\nKartons kombinieren mehrere Materiallagen. Je nach System liefern Polymere und gegebenenfalls Aluminium Barrieren gegen Feuchtigkeit, Sauerstoff oder Licht. Nicht jeder moderne Getränkekarton enthält dieselben sechs Lagen oder eine identische Aluminiumstärke. Aseptische Verarbeitung und Abfüllung können ungekühlte Lagerfähigkeit ermöglichen; die Verpackung allein garantiert sie nicht.\n\n### Glas und PET\n\nGlas ist eine gute Gasbarriere, aber schwer und bruchempfindlich. PET ist leichter; seine Barriere hängt auch von Konstruktion und Beschichtungen ab. Pauschale Mikroplastik-Partikelzahlen oder die Behauptung, PET-Saft enthalte weniger Mikroplastik als jedes Leitungswasser, werden nicht übernommen.\n\n**Einwegpfand ist kein Mehrwegnachweis**. Der VdF verwendet für Saft ein eigenes Mehrwegsystem; dieses darf nicht mit jeder Mineralwasser-GDB-Flasche gleichgesetzt werden. Eine garantierte Umlaufzahl oder ein universeller 200-km-Ökobilanzsieger existiert hier nicht.\n\n### Bag-in-Box\n\nBeim Zapfen zieht sich der Beutel zusammen und kann den Lufteintrag verringern. Ein pauschaler „Vakuumeffekt garantiert sechs Wochen“ ist dennoch keine sichere Verbrauchsregel. Produkt, Behandlung, Zapfhygiene, Temperatur und Herstellerhinweise entscheiden.\n\n### Auswahl und Entsorgung\n\nMehrweg aus der Region ist ein sinnvoller Ansatz des Umweltbundesamtes. Material, Transport und tatsächliche Wiederbefüllung gehören zum Vergleich. Vor dem Öffnen MHD und Lagerhinweise lesen; nach dem Öffnen die dafür angegebenen Bedingungen einhalten.",
      "quiz": [
        {
          "question": "Warum enthalten Saftverpackungen Barrieren?",
          "options": [
            "Um den Zucker zu entfernen",
            "Um je nach System Licht- oder Sauerstoffeintrag zu begrenzen",
            "Um den Fruchtanteil zu erhöhen",
            "Um grundsätzlich Sterilität zu garantieren"
          ],
          "correct": 1,
          "explanation": "Die Materialbarriere ist ein Teil des Gesamtsystems; sie ersetzt nicht eine geeignete Verarbeitung."
        },
        {
          "question": "Was sagt ein Einwegpfand aus?",
          "options": [
            "Die Flasche wird garantiert wiederbefüllt",
            "Rücknahme und Recycling, aber nicht automatisch Mehrweg",
            "Die Flasche ist aus Glas",
            "Der Saft ist länger haltbar als jedes andere Produkt"
          ],
          "correct": 1,
          "explanation": "Pfand und Wiederbefüllung sind unterschiedliche Eigenschaften. Die tatsächliche Kennzeichnung prüfen."
        },
        {
          "question": "Welche Aussage zur geöffneten Bag-in-Box ist richtig?",
          "options": [
            "Sie hält grundsätzlich unbegrenzt",
            "Die Nutzungsdauer hängt von Produkt, Lagerung, Hygiene und Herstellerhinweisen ab",
            "Sie benötigt nie Hygiene",
            "Alle Produkte halten exakt sechs Wochen"
          ],
          "correct": 1,
          "explanation": "Der zusammenziehende Beutel reduziert Lufteintrag, ersetzt aber keine produktspezifischen Verbrauchshinweise."
        }
      ]
    },
    {
      "title": "Mischgetränke und Schorlen",
      "content": "## Schorlen und Fruchtmischungen klar beschreiben\n\nFruchtsaft, Nektar, Fruchtsaftgetränk und Schorle unterscheiden sich. Ein ähnlich klingender Name beweist weder gleichen Fruchtgehalt noch gleiche Nährwerte.\n\n### Schorle\n\nEine selbst gemischte Schorle enthält Saft und Wasser, mit oder ohne CO₂. Mehr Wasser senkt Zucker und Energie pro gleicher Mischungsmenge. Die DGE nennt einen Teil Saft zu drei Teilen Wasser als Getränkemischung. Dies ist eine Ernährungs- und Praxisempfehlung, nicht automatisch die rechtliche Handelsrezeptur jeder „Apfelsaftschorle“.\n\nKohlensäure kann bestimmte mikrobiologische Bedingungen beeinflussen, ist aber kein Ersatz für Haltbarmachung und Hygiene. Sie garantiert nicht, dass Hefen oder Schimmel nicht wachsen können. „Sportschorle“ ist kein Nachweis einer exakt isotonischen Zusammensetzung.\n\n### Multivitamin- und ACE-Produkte\n\nMischungen können Fruchtsäfte, Fruchtmark und zugesetzte Vitamine enthalten. Die Bezeichnung richtet sich nach der tatsächlichen Zusammensetzung. **ACE** steht für A beziehungsweise Provitamin A, C und E; der Name allein belegt weder eine bestimmte Dosis noch einen besonderen Gesundheitsnutzen.\n\n### Fruchtsaftgetränke und Nektare\n\nFruchtsaftgetränke sind nicht automatisch Nektar mit zu geringem Anteil. Unterschiedliche Kategorien haben eigene Anforderungen beziehungsweise Verkehrsauffassungen. Nektar-Mindestwerte sind fruchtspezifisch; mehr Frucht als der Mindestwert bleibt möglich. Die Fruchtsaft- und Erfrischungsgetränkeverordnung regelt nicht pauschal jede koffeinfreie Limonade durch eine angebliche eigene „Erfrischungsgetränkeverordnung“.\n\n### Hausberatung\n\nProdukte so präsentieren, dass Bezeichnung und Fruchtanteil erkennbar sind. Süße, Säure, Portion und Zucker vergleichen; bloße Wellnessbegriffe nicht als medizinische Wirkung auslegen.",
      "quiz": [
        {
          "question": "Was entscheidet über die Kategorie eines fruchthaltigen Mischgetränks?",
          "options": [
            "Nur die Farbe",
            "Konkrete Zusammensetzung und zutreffende Kennzeichnung",
            "Nur der Regalplatz",
            "Nur die Größe"
          ],
          "correct": 1,
          "explanation": "Nektar, Saft, Schorle und Saftgetränk sind nicht beliebig austauschbare Namen."
        },
        {
          "question": "Wofür steht ACE bei solchen Getränken?",
          "options": [
            "Apfel, Citrus, Exoten",
            "A beziehungsweise Provitamin A, Vitamin C und Vitamin E",
            "Nur Acerola",
            "Ein gesetzlicher Saftanteil"
          ],
          "correct": 1,
          "explanation": "Die Abkürzung beschreibt das Vitamin-Konzept. Das Etikett zeigt die tatsächlichen Gehalte."
        },
        {
          "question": "Was bedeutet die Bandbreite 25–50 % beim Nektar?",
          "options": [
            "Jeder Nektar muss genau 25 % enthalten",
            "Fruchtspezifische Mindestwerte, keine feste Obergrenze",
            "Nektar ist immer zuckerfrei",
            "Alle Fruchtsaftgetränke sind automatisch Nektar"
          ],
          "correct": 1,
          "explanation": "Beispielsweise gelten 35 % für Sauerkirsche und 50 % für Apfel. Höhere tatsächliche Anteile sind möglich."
        }
      ]
    },
    {
      "title": "Saft in der Gastronomie",
      "content": "## Saftservice: Kategorie, Kalkulation und Hygiene\n\nDie Gastronomie kann Flaschensaft, frisch gepressten Saft oder Produkte aus Schanksystemen anbieten. Jede Variante braucht zutreffende Bezeichnung und einen passenden hygienischen Ablauf.\n\n### Premix und Postmix\n\n**Premix** wird als fertiges Getränk angeliefert. **Postmix** mischt Komponenten beim Ausschank; das tatsächliche Ergebnis kann Saft aus Konzentrat, Nektar oder ein anderes Getränk sein. Rezeptur, Wasserqualität und richtige Dosierung entscheiden. Ein Schanksystem ist nicht allein wegen seiner Technik grundsätzlich minderwertig oder hochwertig.\n\n### Hauskalkulation\n\nWareneinsatz, Portionsgröße, Personal, Reinigung, Schwund und Steuer getrennt betrachten. Ein Rechenbeispiel: 0,30 € Netto-Wareneinsatz und 1,80 € Netto-Verkaufspreis ergeben den Faktor 6; die Differenz von 1,50 € ist vor weiteren Kosten kein Reingewinn. Dies ist eine Übungsrechnung, keine allgemeine Branchenmarge.\n\n### Juice Pairing\n\nEine Saftbegleitung stimmt alkoholfreie Getränke auf Speisen ab. Apfel zu einem herzhaften Gericht oder eine säurebetonte Probe zu Käse können als Haus-Verkostungsansätze ausprobiert werden. **Verjus** wird aus unreifen Trauben gewonnen und ist nicht einfach ein Synonym für jeden unvergorenen Traubensaft.\n\n### Hygiene\n\nDie EU-Hygienevorgaben verlangen geeignete, risikobasierte Abläufe. Eine allgemeine „HACCP-Pflicht: offener Saft maximal 24 Stunden“ gibt es daraus nicht. **Herstellerangaben und das betriebliche Hygienekonzept** bestimmen Lagerung und Verwendung des konkreten Produkts. Geöffnete Ware kennzeichnen, Kühlung einhalten und Schankanlagen nach geeignetem Reinigungsplan betreiben.\n\nBei Gärzeichen, verdächtigen Packungen oder fremdem Geruch nicht weiter ausschenken. Geschmack allein ist kein sicherer Nachweis der Unbedenklichkeit.",
      "quiz": [
        {
          "question": "Welcher Faktor ergibt sich im Beispiel aus 0,30 € Wareneinsatz und 1,80 € Netto-Verkaufspreis?",
          "options": [
            "2",
            "6",
            "18",
            "50"
          ],
          "correct": 1,
          "explanation": "1,80 / 0,30 = 6. Das ist ein Rechenbeispiel, keine universelle Marge; weitere Kosten bleiben zu berücksichtigen."
        },
        {
          "question": "Was bedeutet Juice Pairing?",
          "options": [
            "Immer zwei Säfte in einem Glas mischen",
            "Eine alkoholfreie Getränkebegleitung auf Speisen abstimmen",
            "Saft als verbindlicher Obst-Ersatz",
            "Nur Cocktailzubereitung"
          ],
          "correct": 1,
          "explanation": "Die Kombinationen sind Genussentscheidungen und werden mit dem konkreten Gericht verkostet."
        },
        {
          "question": "Was bestimmt die Verwendung geöffneten Safts im Betrieb?",
          "options": [
            "Eine aus HACCP abgeleitete allgemeine 24-Stunden-Frist für alle Säfte",
            "Herstellerangaben und das betriebliche Hygienekonzept",
            "Nur die Farbe",
            "Unbegrenzt, solange er süß schmeckt"
          ],
          "correct": 1,
          "explanation": "HACCP ist ein risikobasiertes Vorgehen, keine pauschale Verbrauchsfrist für jedes Produkt und Gebinde."
        }
      ]
    },
    {
      "title": "Die deutsche Saftindustrie — Marktführer und Strukturen",
      "content": "## Die deutsche Saftbranche: Quellen und Unternehmen unterscheiden\n\nBranchenstatistik, Unternehmensgeschichte und konkrete Produkte sind unterschiedliche Informationsarten. Bei Zahlen Jahr und Definition nennen; Unternehmenswerbung nicht als unabhängige Gesundheitsbewertung übernehmen.\n\n### Branchenstruktur\n\nDer VdF vertritt die deutsche Fruchtsaftindustrie und veröffentlicht Marktdaten. Die am 12.10.2026 gelesene Branchenseite nennt für **2025** einen Pro-Kopf-Konsum von **22,5 Litern Fruchtsaft und -nektar**. Die Branche umfasst größere Unternehmen sowie viele mittelständische Keltereien. Präzise Mitglieds- oder Umsatzanteile können je nach Abgrenzung variieren; uneinheitliche Zahlen werden hier nicht zusammengezogen.\n\n### Eckes-Granini\n\nEckes nennt Nieder-Olm in seiner Unternehmensgeschichte. Die Saftproduktion begann in den 1930er-Jahren; **Granini wurde 1994 von der Melitta-Gruppe übernommen**. Die frühere Erzählung von einer Fusion mit einer französischen Granini-Gruppe 2007 ist falsch. Der Ausstieg aus dem Spirituosengeschäft 2006/2007 ist ein anderer Vorgang.\n\n### beckers bester\n\nLaut eigener Herstellerhistorie gründete **Bertha Becker 1932 in Lütgenrode bei Göttingen, Niedersachsen**, das Unternehmen. Das ist nicht Lütgeneder in Nordrhein-Westfalen und nicht das Gründungsjahr 1928. Ein konkreter historischer Beleg ist hilfreicher als ungeprüfte Aussagen über die „größte“ Marke.\n\n### Handel und Sortimentsberatung\n\nHandelsmarke und Herstellermarke sind Vertriebs- und Markenmodelle, keine festen Qualitätsklassen. Direktsaft, Konzentrat, Bio, Herkunft, Portion und Nährwerttabelle prüfen. Preisbereiche und Handelsmarkenanteile benötigen eine aktuelle passende Datenbasis; sie werden nicht als zeitlose Werte auswendig gelernt.",
      "quiz": [
        {
          "question": "Wann übernahm Eckes Granini laut Herstellerhistorie?",
          "options": [
            "1857",
            "1958",
            "1994",
            "2007 als Fusion mit einer französischen Granini-Gruppe"
          ],
          "correct": 2,
          "explanation": "Die Geschichte nennt 1994 und die Melitta-Gruppe. 2006/2007 betrifft den Ausstieg aus dem Spirituosengeschäft."
        },
        {
          "question": "Wo und wann wurde beckers bester laut Herstellerhistorie gegründet?",
          "options": [
            "1928 in Lütgeneder, NRW",
            "1932 in Lütgenrode bei Göttingen, Niedersachsen",
            "2007 in Paris",
            "1869 in Florida"
          ],
          "correct": 1,
          "explanation": "Die Herstellerseite nennt Bertha Becker, Lütgenrode und 1932."
        },
        {
          "question": "Was entscheidet nicht allein über Saftqualität?",
          "options": [
            "Die passende Kategorie und Rohware",
            "Ob es eine Handels- oder Herstellermarke ist",
            "Die konkrete Verarbeitung",
            "Eine nachvollziehbare Analyse"
          ],
          "correct": 1,
          "explanation": "Das Markenmodell ist keine pauschale Qualitätsklasse."
        }
      ]
    },
    {
      "title": "Trends: Cold Pressed, HPP und Functional Juices",
      "content": "## Kaltpressung, HPP und funktionale Produkte\n\nNeue Herstellungs- und Produktkonzepte brauchen dieselbe Genauigkeit bei Kategorie, Sicherheit und Aussagen wie klassische Säfte.\n\n### Cold Pressed\n\n„Kaltgepresst“ beschreibt eine Art der Saftgewinnung, nicht automatisch die anschließende Behandlung oder Haltbarkeit. Eine hydraulische Presse hat nicht einfach „niedrige Drehzahlen“; unterschiedliche Maschinen erfüllen unterschiedliche Schritte. Kaltpressung garantiert weder vollständigere Nährstoffgewinnung noch Sicherheit oder eine feste Drei- bis Fünf-Tage-Frist. Behandlung, Hygiene, Kühlung und konkrete Produktvalidierung bleiben maßgeblich.\n\n### HPP\n\n**High Pressure Processing** nutzt typischerweise **4.000–6.000 bar**. Der gelesene Anlagenhersteller Hiperbaric beschreibt die Reduktion vegetativer Mikroorganismen, aber keine zuverlässige Inaktivierung bakterieller Sporen bei üblichen industriellen Drücken. HPP ist daher keine universelle Sterilisation. In der Regel ist Kühlung erforderlich; der genaue Prozess und die Haltbarkeit werden produktspezifisch geprüft. Nicht jeder Stoff oder jedes Enzym bleibt zwingend unverändert.\n\n### Funktionale Namen\n\n„Immunity“, „Detox“, „Beauty“ oder „Adaptogen“ sind zunächst Werbe- beziehungsweise Produktkonzepte. Zutaten wie Ingwer, Zink oder Biotin begründen nicht jede damit verbundene Aussage. Zulässige Health Claims und ihre Verwendungsbedingungen prüfen; aus der kleinen Shot-Portion keinen garantierten Immunboost oder Stressabbau ableiten.\n\n### Zuckerreduzierung\n\nDie aktuelle Fruchtsaftverordnung enthält eigene Kategorien für zuckerreduzierten Fruchtsaft mit **mindestens 30 % weniger natürlichem Zucker** unter bestimmten Prozessbedingungen. Das ist nicht dasselbe wie beliebige Verdünnung oder Süßstoffzugabe unter dem Namen „Fruchtsaft“.\n\nTrester kann weiterverwendet werden. Eine geringere transportierte Wassermenge ist jedoch nicht automatisch ein geringerer landwirtschaftlicher Wasserfußabdruck.",
      "quiz": [
        {
          "question": "Welchen typischen Druckbereich beschreibt die HPP-Quelle?",
          "options": [
            "100–500 bar",
            "1.000–2.000 bar",
            "4.000–6.000 bar",
            "Mehr als 20.000 bar"
          ],
          "correct": 2,
          "explanation": "Hiperbaric beschreibt diesen Bereich. Wirkung, Sporenresistenz und Kühlung sind zusätzlich zu beachten."
        },
        {
          "question": "Welche Haltbarkeit folgt allein aus der Angabe „kaltgepresst“?",
          "options": [
            "Immer genau drei bis fünf Tage",
            "Es folgt keine pauschale sichere Haltbarkeit; Produkt und Prozess entscheiden",
            "Immer zwölf Monate",
            "Unbegrenzt ohne Kühlung"
          ],
          "correct": 1,
          "explanation": "Cold Pressed beschreibt die Gewinnung, nicht eine universelle Haltbarmachung."
        },
        {
          "question": "Was beweist der Name „Immunity Shot“?",
          "options": [
            "Einen garantierten Immunboost",
            "Keine pauschale Wirkung; Zutaten, Gehalte und zulässige Aussagen müssen geprüft werden",
            "Eine Arzneimittelzulassung",
            "Eine feste Portion von 80 ml"
          ],
          "correct": 1,
          "explanation": "Ein Werbename ersetzt keinen Wirkungsbeleg oder die Bedingungen zulässiger Claims."
        }
      ]
    }
  ],
  "finalExam": [
    {
      "question": "Was unterscheidet Fruchtsaft und Fruchtnektar?",
      "options": [
        "Nur die Flaschenform",
        "Fruchtsaft hat 100 % Fruchtgehalt; Nektar enthält Wasser und erfüllt fruchtspezifische Mindestanteile",
        "Nur die Farbe",
        "Nektar muss immer genau 25 % Frucht enthalten"
      ],
      "correct": 1,
      "explanation": "Nektar-Mindestwerte sind keine feste Obergrenze. Zutaten und Herstellungsregeln sind kategoriespezifisch."
    },
    {
      "question": "Warum werden bei Konzentratverfahren Aromen getrennt gewonnen?",
      "options": [
        "Um jeden Geschmack zu entfernen",
        "Damit geeignete fruchteigene Aromakomponenten bei der Wiederherstellung zurückgeführt werden können",
        "Um aus Saft Wein zu machen",
        "Um immer Zucker zuzusetzen"
      ],
      "correct": 1,
      "explanation": "Die zulässige Rückführung von Restaurationsaromen ist von einer beliebigen Fremdaromatisierung zu unterscheiden."
    },
    {
      "question": "Welche Faktoren bestimmen das Geschmacksprofil einer Saft-Cuvée?",
      "options": [
        "Nur Fruchtgröße und Farbe",
        "Sorten, Reife, Süße-Säure-Verhältnis und Verarbeitung",
        "Nur die Flaschenfarbe",
        "Nur ein festes Verhältnis von 1:10"
      ],
      "correct": 1,
      "explanation": "Ein universelles Zucker-Säure-Verhältnis wird nicht als Qualitätsgarantie verwendet."
    },
    {
      "question": "Was leistet gewöhnliches HPP nicht zuverlässig?",
      "options": [
        "Druck auf das Produkt ausüben",
        "Eine vollständige Sterilisation einschließlich bakterieller Sporen",
        "Vegetative Mikroorganismen reduzieren",
        "Ein produktspezifisch validiertes Verfahren unterstützen"
      ],
      "correct": 1,
      "explanation": "Bei üblichen industriellen Drücken können bakterielle Sporen resistent sein. Kühlung und passende Prozessvalidierung bleiben erforderlich."
    },
    {
      "question": "Wie liest man einen Branchenwert zum Saftkonsum korrekt?",
      "options": [
        "Ohne Jahr, als zeitlose Gewohnheit",
        "Mit Jahr, Produktkategorie und Quelle",
        "Als individuellen Trinkbedarf",
        "Als medizinische Tagesdosis"
      ],
      "correct": 1,
      "explanation": "Die VdF-Zahl von 22,5 Litern bezieht sich auf 2025 und Fruchtsaft/-nektar, nicht jede Getränkekategorie oder Person."
    },
    {
      "question": "Welche Aussage zur Saftauthentizität ist richtig?",
      "options": [
        "Brix allein beweist jede Verfälschung",
        "Mehrere geeignete Analyseverfahren und Referenzdaten müssen fachlich eingeordnet werden",
        "Normaler Geruch beweist die Abwesenheit aller Mykotoxine",
        "Jede Abweichung ist automatisch Betrug"
      ],
      "correct": 1,
      "explanation": "Screening, Bestätigung und natürliche Schwankungen sind zu unterscheiden."
    },
    {
      "question": "Was ist der wesentliche Unterschied zwischen klarem und naturtrübem Apfelsaft?",
      "options": [
        "Naturtrüb ist immer zuckerfrei",
        "Trubbestandteile werden beim Klarsaft abgetrennt und bleiben bei naturtrübem Saft erhalten",
        "Klarer Saft ist gesetzlich verboten",
        "Naturtrüb verhindert nachweislich jede Krankheit"
      ],
      "correct": 1,
      "explanation": "Aus Trübung folgt keine feste Polyphenolmenge oder Gesundheitsgarantie für jede Flasche."
    },
    {
      "question": "Wie vergleicht man Saftverpackungen sachlich?",
      "options": [
        "Glas gewinnt immer unter 200 km",
        "Material, Barriere, Wiederbefüllung, Transport und konkrete Verwendung zusammen betrachten",
        "Nur den Kaufpreis vergleichen",
        "Einwegpfand mit Wiederbefüllung gleichsetzen"
      ],
      "correct": 1,
      "explanation": "Ökobilanzen hängen von Systemgrenzen und tatsächlichen Bedingungen ab."
    },
    {
      "question": "Was versteht man unter Juice Pairing?",
      "options": [
        "Immer zwei Säfte mischen",
        "Eine alkoholfreie Getränkebegleitung passend zu Speisen gestalten",
        "Saft als Arzneimittel verwenden",
        "Saft als Pflichtobstersatz einsetzen"
      ],
      "correct": 1,
      "explanation": "Pairing ist eine sensorische Genussentscheidung, keine allgemeingültige Ernährungs- oder Gesundheitsregel."
    },
    {
      "question": "Was kennzeichnet die gesetzliche Kategorie zuckerreduzierter Fruchtsaft?",
      "options": [
        "Beliebige Wasserzugabe genügt",
        "Mindestens 30 % Reduktion des natürlichen Zuckers unter den vorgeschriebenen Bedingungen",
        "Jede Süßstoffzugabe ist erlaubt",
        "Immer vollständig zuckerfrei"
      ],
      "correct": 1,
      "explanation": "Die aktuelle Fruchtsaftverordnung enthält eigene Kategorien und Bedingungen; Verdünnung allein ist nicht gleichbedeutend."
    }
  ]
};
