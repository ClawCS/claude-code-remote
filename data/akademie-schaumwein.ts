import type { Course } from "./akademie";

export const schaumweinKurs: Course = {
  slug: "schaumwein",
  title: "Schaumwein & Sekt",
  icon: "🥂",
  description:
    "Von der Méthode Traditionnelle bis zum Pét-Nat — Herstellungsverfahren, Appellationen, Rebsorten, Dosage, Sensorik und Service auf Sommelier-Niveau.",
  color: "from-yellow-400 to-amber-500",
  difficulty: "Fortgeschritten",
  duration: "ca. 80 Min.",
  lessons: [
    // ─── Lektion 1 ───────────────────────────────────────────
    {
      title: "Geschichte des Schaumweins",
      content: `## Von der zufälligen Perlage zur Königsdisziplin der Weinwelt

Die Geschichte des Schaumweins beginnt nicht, wie oft behauptet, mit Dom Pérignon — sie reicht weiter zurück und ist weitaus vielschichtiger. Bereits in der Antike bemerkten Winzer, dass manche Weine im Frühjahr erneut zu gären begannen, wenn steigende Temperaturen ruhende Hefen reaktivierten. Dieses Phänomen war gefürchtet, denn die entstehende Kohlensäure ließ Fässer und primitive Tongefäße bersten. In der römischen Weinliteratur finden sich Hinweise auf *vinum titillans* — prickelnden Wein, der eher als Fehler denn als Delikatesse galt.

**Die Blanquette de Limoux** beansprucht den Titel des ältesten dokumentierten Schaumweins. Benediktinermönche der Abtei Saint-Hilaire im Languedoc sollen bereits 1531 gezielt prickelnden Wein erzeugt haben — über ein Jahrhundert vor den ersten Champagner-Experimenten. Sie versiegelten halbvergorenen Wein in Flaschen und nutzten die Zweitgärung bewusst aus. Die Appellation Limoux ist damit historisch bedeutsamer, als viele Weinkenner vermuten. Noch heute wird Blanquette de Limoux aus der autochthonen Rebsorte Mauzac nach der *Méthode Ancestrale* hergestellt.

**Die englische Verbindung**: Der Arzt und Wissenschaftler Christopher Merret dokumentierte 1662 vor der Royal Society in London ein Verfahren, bei dem fertigem Wein Zucker zugesetzt wurde, um eine Zweitgärung in der Flasche auszulösen — volle sechs Jahre bevor Dom Pérignon sein Amt als Kellermeister in Hautvillers antrat. Englische Glashütten stellten zudem bereits im 17. Jahrhundert Flaschen her, die dem Druck der Kohlensäure (bis zu 6 bar) standhielten, während in der Champagne noch dünnwandige Flaschen explodierten. Historiker bezeichnen die englische Methode als *méthode anglaise*.

**Dom Pierre Pérignon** (1638–1715) war Benediktinermönch und Kellermeister der Abtei Hautvillers. Entgegen der Legende „erfand" er den Champagner nicht, sondern perfektionierte die Assemblage verschiedener Traubenpartien aus unterschiedlichen Lagen und Jahrgängen — eine Kunst, die bis heute das Fundament der Champagnerherstellung bildet. Er führte den Korkverschluss (statt ölgetränkter Holzpfropfen) ein, verbesserte die Pressung und erkannte die Bedeutung der Kühlung. Sein berühmtes Zitat „Ich trinke Sterne" ist allerdings eine Erfindung der Werbung aus dem 19. Jahrhundert.

**Das 18. und 19. Jahrhundert** brachten entscheidende Innovationen: Die Witwe (Veuve) Nicole-Barbe Clicquot-Ponsardin entwickelte um 1816 das **Rüttelpult** (*pupitre*), mit dem sich Hefesatz gezielt in den Flaschenhals befördern ließ — die Grundlage des modernen Dégorgement. Jean-Antoine Chaptal beschrieb die kontrollierte Zuckerzugabe (**Chaptalisation**), und der Pharmazeut André François erfand das **Saccharometer**, mit dem erstmals der Zuckergehalt im Most präzise gemessen werden konnte. Damit wurde die Schaumweinproduktion vom Glücksspiel zur berechenbaren Wissenschaft. Die Explosionsrate der Flaschen sank von bis zu 80 % auf unter 5 %.

**Industrialisierung und Globalisierung**: Im 19. Jahrhundert verbreitete sich die Schaumweinproduktion von der Champagne über ganz Europa. In Deutschland begann 1826 die Sektherstellung bei Kessler in Esslingen, Spanien entwickelte den Cava, und Italien perfektionierte den Charmat-Prozess für Prosecco. Heute werden Schaumweine auf allen Kontinenten produziert — von Tasmania über England bis nach Brasilien. Die globale Jahresproduktion übersteigt 2,5 Milliarden Flaschen.`,
      quiz: [
        {
          question:
            "Welcher Schaumwein gilt als der älteste dokumentierte der Welt?",
          options: [
            "Champagner aus Hautvillers",
            "Blanquette de Limoux aus der Abtei Saint-Hilaire",
            "Prosecco aus dem Veneto",
            "Sekt aus Esslingen",
          ],
          correct: 1,
          explanation:
            "Benediktinermönche in Limoux erzeugten bereits 1531 dokumentiert Schaumwein — über 100 Jahre vor den ersten Champagner-Experimenten.",
        },
        {
          question:
            "Was dokumentierte Christopher Merret 1662 vor der Royal Society?",
          options: [
            "Die Erfindung des Rüttelpults",
            "Die Zugabe von Zucker zu fertigem Wein zur Erzeugung einer Zweitgärung in der Flasche",
            "Die Méthode Ancestrale",
            "Die Dosage-Abstufungen für Champagner",
          ],
          correct: 1,
          explanation:
            "Merret beschrieb 1662 die gezielte Zweitgärung durch Zuckerzugabe — sechs Jahre bevor Dom Pérignon sein Amt antrat. Die Methode wird als méthode anglaise bezeichnet.",
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

**Schritt 1 — Grundwein (Vin de Base)**: Zunächst wird ein stiller Grundwein vinifiziert, typischerweise mit 10,5–11 % Vol. Alkohol, hoher Säure und neutralem Charakter. Die Trauben werden oft früher gelesen als für Stillwein, um die Säure zu bewahren. In der Champagne werden die drei Hauptrebsorten Chardonnay, Pinot Noir und Pinot Meunier meist separat vinifiziert und anschließend assembliert. Große Häuser halten **Réserveweine** aus früheren Jahrgängen zurück (bis zu 40 % der Cuvée), um einen konstanten Hausstil zu gewährleisten.

**Schritt 2 — Assemblage**: Der Kellermeister (*Chef de Cave*) komponiert aus Dutzenden oder Hunderten von Grundweinen die finale Cuvée. Dies ist die anspruchsvollste Aufgabe, denn die Assemblage muss den Hausstil über Jahrzehnte hinweg konstant halten, obwohl jeder Jahrgang unterschiedliche Bedingungen bringt. Bei Millésimé-Champagnern (Jahrgangschampagner) stammen alle Grundweine aus einem einzigen herausragenden Jahr.

**Schritt 3 — Tirage (Flaschenfüllung und Liqueur de Tirage)**: Dem Grundwein wird eine Mischung aus Zucker (typisch 24 g/l für 6 bar Druck), Hefe (*Saccharomyces bayanus* oder speziellen Champagnerhefen) und Nährstoffen zugesetzt — der sogenannte **Liqueur de Tirage**. Die Flaschen werden mit einem Kronkorken verschlossen und horizontal in kühlen Kreidekellern (10–12 °C) gelagert.

**Schritt 4 — Zweitgärung auf der Flasche (Prise de Mousse)**: Die Hefe vergärt den zugesetzten Zucker und erzeugt dabei ca. 1,2–1,3 % Vol. zusätzlichen Alkohol sowie Kohlensäure, die sich unter Druck im Wein löst (5–6 bar bei 10 °C). Die Gärung dauert 6–8 Wochen. Die feine, persistente Perlage von Méthode-Traditionnelle-Weinen entsteht durch die langsame Gärung bei niedrigen Temperaturen und die vollständige Integration des CO₂ in den Wein.

**Schritt 5 — Hefelager (Sur Lie)**: Nach der Zweitgärung stirbt die Hefe ab und beginnt sich zu zersetzen — ein Prozess namens **Autolyse**. Dabei werden Aminosäuren, Mannoproteïne und Polysaccharide freigesetzt, die dem Wein Komplexität, cremige Textur und Aromen von Brioche, Toast und Biskuit verleihen. Die Mindestlagerzeiten sind streng reglementiert: Non-Vintage-Champagner mindestens 15 Monate auf der Hefe (davon 12 Monate nach der Tirage), Vintage-Champagner mindestens 36 Monate. Prestige-Cuvées lagern oft 5–10 Jahre oder länger.

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
            "Wie lange muss Non-Vintage-Champagner mindestens auf der Hefe lagern?",
          options: [
            "6 Monate",
            "15 Monate (davon 12 nach der Tirage)",
            "36 Monate",
            "60 Monate",
          ],
          correct: 1,
          explanation:
            "Non-Vintage-Champagner muss mindestens 15 Monate auf der Hefe lagern. Vintage-Champagner erfordert mindestens 36 Monate. Prestige-Cuvées lagern oft 5–10 Jahre.",
        },
      ],
    },

    // ─── Lektion 3 ───────────────────────────────────────────
    {
      title: "Charmat-Verfahren / Tankgärung",
      content: `## Großvolumige Eleganz — Die Methode hinter Prosecco und Co.

Das **Charmat-Verfahren** (auch **Méthode Charmat**, **Metodo Italiano** oder **Tankgärung** genannt) wurde 1895 vom Italiener Federico Martinotti entwickelt und 1907 vom Franzosen Eugène Charmat patentiert. Der entscheidende Unterschied zur Méthode Traditionnelle: Die zweite Gärung findet nicht in der einzelnen Flasche statt, sondern in großen, druckfesten **Autoclaven** (Edelstahltanks) mit Fassungsvermögen von 5.000 bis 100.000 Litern oder mehr. Dies ermöglicht eine effiziente Massenproduktion bei gleichzeitiger Qualitätskontrolle.

**Der Prozess im Detail**: Zunächst wird ein stiller Grundwein hergestellt, der in den Autoklaven gefüllt wird. Dort werden Hefe und Zucker (Liqueur de Tirage) zugegeben, und die Zweitgärung beginnt unter kontrollierten Bedingungen (Temperatur, Druck). Die Gärung dauert typischerweise 30–80 Tage (kurzer Charmat) oder bis zu 9 Monate (langer Charmat / *Charmat lungo*). Nach Abschluss der Gärung wird der Wein unter Aufrechterhaltung des CO₂-Drucks gefiltert und in Flaschen abgefüllt — ein Verfahren, das als **isobarische Filtration und Abfüllung** bezeichnet wird.

**Vorteile des Charmat-Verfahrens**: Die Tankgärung bewahrt die **primären Fruchtaromen** und die **sortentypischen Charakteristika** der Trauben deutlich besser als die Méthode Traditionnelle, bei der die lange Hefelagerung Autolyse-Aromen (Brioche, Toast) in den Vordergrund rückt. Für aromatische Rebsorten wie Glera (Prosecco), Muscat oder Müller-Thurgau ist Charmat daher das ideale Verfahren. Die kontrollierte Umgebung im Tank erlaubt zudem eine präzisere Steuerung von Temperatur, Druck und Gärdauer als die individuelle Flaschengärung. Die Kosten pro Flasche sind erheblich geringer, was Charmat-Schaumweine auch preislich zugänglich macht.

**Kurzer Charmat vs. Charmat Lungo**: Beim **kurzen Charmat** (30–80 Tage Kontaktzeit) bleibt der Wein fruchtig, frisch und unkompliziert — ideal für fruchtbetonte Stile wie Prosecco DOC oder deutsche Sektkellerei-Produkte. Beim **Charmat Lungo** (6–9 Monate auf der Feinhefe im Tank) gewinnt der Wein zusätzliche Komplexität durch partielle Autolyse, ohne die sortentypische Frucht vollständig zu überlagern. Dieser Ansatz wird für höherwertige Prosecco DOCG (Conegliano Valdobbiadene) und qualitätsbewusste Asti Spumante eingesetzt. Einige innovative Produzenten experimentieren sogar mit Charmat-Lagerzeiten von über 12 Monaten.

**Qualitätsrelevante Parameter**: Die **Gärtemperatur** liegt typischerweise bei 12–18 °C — niedrigere Temperaturen erzeugen feinere Perlage und bewahren flüchtige Aromen, erhöhen aber die Gärdauer. Der **Druck** im Autoklaven wird auf 5–6 bar für Spumante bzw. 2,5 bar für Frizzante eingestellt. Die Wahl der **Hefe** beeinflusst Aromenbildung und Gärgeschwindigkeit erheblich. Moderne Autoklaven verfügen über Rührwerke, die die Hefelagerung im Tank optimieren.

**Martinotti vs. Charmat — Eine Frage der Ehre**: In Italien wird das Verfahren korrekt als **Metodo Martinotti** bezeichnet, da Federico Martinotti es erstmals 1895 an der Königlichen Önologischen Station in Asti beschrieb. Eugène Charmat entwickelte lediglich den industriellen Autoklaven, der die großtechnische Umsetzung ermöglichte. Dennoch hat sich im internationalen Sprachgebrauch der Name „Charmat" durchgesetzt — sehr zum Unmut italienischer Önologen.

**Verbreitung und typische Weine**: Das Charmat-Verfahren dominiert bei Prosecco (DOC und DOCG), Asti Spumante und Moscato d'Asti, einem Großteil des deutschen Sekts (insbesondere von Großkellereien wie Henkell, Rotkäppchen, Mumm Sekt), vielen Crémants der Einstiegspreisklasse und Lambrusco Spumante. Weltweit wird geschätzt, dass über 70 % aller Schaumweine im Charmat-Verfahren hergestellt werden.`,
      quiz: [
        {
          question:
            "Was ist der Hauptvorteil des Charmat-Verfahrens für aromatische Rebsorten wie Glera?",
          options: [
            "Höherer Alkoholgehalt",
            "Bewahrung der primären Fruchtaromen und sortentypischen Charakteristika",
            "Längere Haltbarkeit",
            "Intensivere Hefelager-Aromen",
          ],
          correct: 1,
          explanation:
            "Die Tankgärung bewahrt die sortentypischen Fruchtaromen besser als die Méthode Traditionnelle, bei der Autolyse-Aromen die Frucht überlagern.",
        },
        {
          question:
            "Wer entwickelte das Verfahren zuerst — und wer patentierte den Autoklaven?",
          options: [
            "Charmat entwickelte, Martinotti patentierte",
            "Dom Pérignon entwickelte, Charmat patentierte",
            "Martinotti beschrieb es 1895, Charmat patentierte den Autoklaven 1907",
            "Clicquot entwickelte, Martinotti patentierte",
          ],
          correct: 2,
          explanation:
            "Federico Martinotti beschrieb das Verfahren 1895 an der Königlichen Önologischen Station in Asti. Eugène Charmat patentierte 1907 den industriellen Autoklaven.",
        },
        {
          question:
            "Worin unterscheidet sich 'Charmat Lungo' vom kurzen Charmat-Verfahren?",
          options: [
            "Es wird eine andere Rebsorte verwendet",
            "Die Hefelagerung im Tank dauert 6–9 Monate statt 30–80 Tage, was partielle Autolyse und mehr Komplexität ermöglicht",
            "Der Wein wird in Flaschen statt im Tank vergoren",
            "Der Druck im Tank ist doppelt so hoch",
          ],
          correct: 1,
          explanation:
            "Charmat Lungo lagert 6–9 Monate auf der Feinhefe im Tank. Partielle Autolyse verleiht mehr Komplexität, ohne die sortentypische Frucht vollständig zu überlagern.",
        },
      ],
    },

    // ─── Lektion 4 ───────────────────────────────────────────
    {
      title: "Das Transvasierverfahren",
      content: `## Der Kompromiss zwischen Flasche und Tank

Das **Transvasierverfahren** (von frz. *transvaser* = umfüllen) ist ein Hybrid-Verfahren, das Elemente der Méthode Traditionnelle und des Charmat-Verfahrens kombiniert. Es wurde in den 1950er-Jahren entwickelt und wird heute vor allem in Deutschland, Australien und für bestimmte Großflaschenformate eingesetzt. Der Grundgedanke: Die zweite Gärung findet wie bei der Méthode Traditionnelle in der Flasche statt, aber die aufwendigen Schritte Remuage und Dégorgement werden durch eine Umfüllung in den Tank ersetzt.

**Der Prozess im Detail**: Der Grundwein wird wie bei der Méthode Traditionnelle in Flaschen gefüllt, mit Liqueur de Tirage versetzt und verschlossen. Die Zweitgärung findet in der Flasche statt, und der Wein lagert für eine definierte Zeit auf der Hefe (Monate bis Jahre). Bis hierhin ist das Verfahren identisch mit der traditionellen Methode und erzeugt die gleiche feine Perlage und Autolyse-Komplexität. Anschließend werden die Flaschen unter Gegendruck (isobarisch) in einen druckfesten Tank entleert — daher der Name **Transvasierung**. Im Tank wird der Wein gesammelt, die Dosage zugegeben, filtriert und unter Druck in neue, saubere Flaschen abgefüllt.

**Vorteile gegenüber der Méthode Traditionnelle**: Der Hauptvorteil liegt in der **Effizienz**. Das zeitaufwendige Rütteln (2–3 Monate per Hand oder 3–7 Tage per Gyropalette) und das präzise Dégorgement entfallen vollständig. Bei Großflaschen (Magnum aufwärts) ist die Méthode Traditionnelle besonders herausfordernd — Jeroboams (3 l) und größere Formate werden fast ausnahmslos im Transvasierverfahren hergestellt, selbst von renommierten Champagnerhäusern. Die Filtration im Tank ermöglicht zudem eine **gleichmäßigere Dosage** über die gesamte Produktionsmenge, was die Homogenität des Endprodukts verbessert.

**Nachteile und Qualitätsaspekte**: Kritiker argumentieren, dass die Umfüllung und Filtration einen Teil der im Hefelager gewonnenen Komplexität wieder zerstört. Die feinen Mannoproteïne und Polysaccharide, die bei der Autolyse freigesetzt werden, werden teilweise herausgefiltert. Zudem geht durch den Umfüllprozess ein minimaler Teil der gebundenen Kohlensäure verloren, was die Perlage etwas gröber machen kann als bei einem reinen Méthode-Traditionnelle-Wein. In Blindverkostungen schneiden Transvasier-Weine dennoch oft besser ab als reine Charmat-Produkte, da die initiale Flaschengärung und Hefelagerung deutlich spürbar bleibt.

**Kennzeichnung und rechtliche Aspekte**: In der EU darf auf dem Etikett die Angabe **„Flaschengärung"** (*fermentation en bouteille*) verwendet werden, da die Zweitgärung tatsächlich in der Flasche stattfindet. Die Angabe *„traditionelle Flaschengärung"* (*méthode traditionnelle*) ist hingegen **nicht** gestattet, da Remuage und Dégorgement in der Originalflasche fehlen. Diese Unterscheidung ist für informierte Verbraucher ein wichtiges Qualitätsmerkmal. In Deutschland kennzeichnen viele Produzenten mit „Flaschengärung" ohne weitere Spezifizierung, was zu Verwirrung führen kann.

**Einsatzgebiete heute**: Das Transvasierverfahren wird hauptsächlich für **Großflaschenformate** (Jeroboam, Rehoboam, Methusalem, Salmanazar, Balthasar, Nebukadnezar) genutzt, selbst bei hochwertigsten Champagnern. In Deutschland und Australien ist es bei mittelpreisigen Qualitäts-Schaumweinen verbreitet, die von der Flaschengärung profitieren sollen, ohne die vollen Kosten der Méthode Traditionnelle tragen zu müssen. Einige deutsche Winzersekt-Produzenten nutzen es als Einstieg in die Premium-Schaumweinproduktion, bevor sie auf die vollständige Méthode Traditionnelle umsteigen.

**Sonderform — Transfer Method in der Neuen Welt**: In Australien und den USA ist das Transvasierverfahren als **Transfer Method** bekannt und genießt hohes Ansehen. Australische Häuser wie Yalumba und Seppelt haben es zur Perfektion gebracht. Der *Transfer Method* wird dort oft mit langen Hefelagerzeiten (3–5 Jahre) kombiniert, was Ergebnisse liefert, die der Méthode Traditionnelle erstaunlich nahekommen.`,
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
            "Warum werden Champagner-Großflaschen (ab Jeroboam) meist im Transvasierverfahren hergestellt?",
          options: [
            "Weil die Champagne das Transvasierverfahren erfunden hat",
            "Weil Remuage und Dégorgement bei Großflaschen technisch extrem herausfordernd und unwirtschaftlich sind",
            "Weil Großflaschen keinen Druck aushalten",
            "Weil die AOC-Regeln es vorschreiben",
          ],
          correct: 1,
          explanation:
            "Das Rütteln und Degorgieren von Großflaschen (3–15 Liter) ist extrem aufwendig. Selbst renommierte Häuser nutzen daher das Transvasierverfahren für Formate ab Jeroboam.",
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
      content: `## Das Nonplusultra des Schaumweins

**Champagner** ist weit mehr als ein Schaumwein — er ist eine geschützte Herkunftsbezeichnung (AOC/AOP seit 1936), ein kulturelles Symbol und ein Wirtschaftsfaktor von enormer Bedeutung. Nur Schaumwein, der in der streng abgegrenzten Region **Champagne** (ca. 34.300 Hektar Rebfläche, 319 Crus) nach den Regeln der Méthode Traditionnelle hergestellt wird, darf sich Champagner nennen. Die Region liegt 150 km nordöstlich von Paris und ist eines der nördlichsten Weinbaugebiete der Welt (49° nördliche Breite). Das kühle Klima (Jahresdurchschnittstemperatur ca. 11 °C) und die **Kreideböden** (Belemnit-Kreide aus der oberen Kreidezeit) sind die natürlichen Grundlagen des einzigartigen Champagnerstils.

**Die Unterregionen**: Die Champagne gliedert sich in fünf Hauptregionen: Die **Montagne de Reims** (dominiert von Pinot Noir; Grand Crus wie Ambonnay, Bouzy, Verzenay), die **Vallée de la Marne** (Hochburg des Pinot Meunier; berühmte Lagen um Aÿ), die **Côte des Blancs** (fast reiner Chardonnay; Grand Crus Avize, Cramant, Le Mesnil-sur-Oger), die **Côte de Sézanne** (aufstrebend, Chardonnay-dominiert) und die **Aube/Côte des Bar** (200 km südlich, Pinot-Noir-Schwerpunkt, historisch umstritten). Das **Cru-System** klassifiziert Gemeinden auf einer Skala: 17 **Grand Crus** (100 %) und 42 **Premier Crus** (90–99 %) — wobei sich die Prozentzahlen auf den historischen Traubenpreis beziehen.

**Die zugelassenen Rebsorten**: Hauptsorten sind **Chardonnay** (30 % der Fläche; Eleganz, Zitrus, mineralisch), **Pinot Noir** (38 %; Struktur, rote Frucht, Kraft) und **Pinot Meunier** (32 %; Fruchtigkeit, Rundheit, Zugänglichkeit). Daneben gibt es vier selten genutzte historische Sorten: Arbane, Petit Meslier, Pinot Blanc und Pinot Gris — zusammen unter 0,3 % der Fläche.

**Champagner-Stile**: **Brut Sans Année (BSA)** / Non-Vintage ist der Hausstil und macht ca. 80 % der Produktion aus — eine Assemblage aus mehreren Jahrgängen. **Millésimé** (Vintage) wird nur in herausragenden Jahren deklariert und muss zu 100 % aus dem angegebenen Jahrgang stammen. **Blanc de Blancs** (ausschließlich aus weißen Trauben, meist Chardonnay) bietet Eleganz und Finesse. **Blanc de Noirs** (ausschließlich aus roten Trauben) zeigt mehr Körper und Struktur. **Rosé** wird entweder durch kurze Mazeration (*saignée*) oder durch Zugabe von Rotwein (*assemblage*) hergestellt — die Champagne ist die einzige französische AOC, in der letzteres erlaubt ist. **Prestige Cuvée** (Dom Pérignon, Cristal, La Grande Dame, Comtes de Champagne, Krug Grande Cuvée) repräsentiert das Beste eines Hauses.

**Akteure der Champagne**: Das System unterscheidet nach dem zweistelligen Code auf dem Etikett: **NM** (Négociant-Manipulant) — Große Häuser, die Trauben zukaufen (Moët, Veuve Clicquot, Bollinger). **RM** (Récoltant-Manipulant) — Winzer, die ausschließlich eigene Trauben verarbeiten (die „Grower Champagnes", zunehmend beliebt). **CM** (Coopérative de Manipulation) — Genossenschaften. **RC** (Récoltant-Coopérateur) — Winzer, die Trauben an die Genossenschaft liefern und fertigen Champagner unter eigenem Label zurückerhalten. **MA** (Marque d'Acheteur) — Handelsmarken. Die Grower-Champagne-Bewegung hat den Markt in den letzten zwei Jahrzehnten revolutioniert: Winzer wie Egly-Ouriet, Pierre Gimonnet, Larmandier-Bernier oder Jacques Selosse erzielen heute Preise, die mit den großen Häusern konkurrieren.

**Wirtschaftliche Dimensionen**: Die Champagne produziert jährlich ca. 300 Millionen Flaschen mit einem Exportwert von über 6 Milliarden Euro. Das macht sie zum wirtschaftlich bedeutendsten Weinbaugebiet der Welt — obwohl sie nur 4 % der französischen Rebfläche ausmacht.`,
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
            "Es ist die einzige französische AOC, in der Rosé durch Zugabe von Rotwein zur weißen Cuvée hergestellt werden darf",
            "Rosé-Champagner muss mindestens 5 Jahre reifen",
            "Rosé darf nur aus Grand-Cru-Lagen stammen",
          ],
          correct: 1,
          explanation:
            "Die Champagne ist die einzige französische AOC, in der Rosé durch Assemblage (Zugabe von Rotwein) hergestellt werden darf. Alternativ wird die Saignée-Methode (kurze Mazeration) angewandt.",
        },
      ],
    },

    // ─── Lektion 6 ───────────────────────────────────────────
    {
      title: "Crémant — Elsass, Loire, Burgund und darüber hinaus",
      content: `## Frankreichs zweite Schaumwein-Garde — unterschätzt und herausragend

**Crémant** ist die Sammelbezeichnung für qualitativ hochwertige französische Schaumweine, die nach der Méthode Traditionnelle außerhalb der Champagne hergestellt werden. Der Name leitet sich von *crème* (Creme) ab und verwies historisch auf den etwas geringeren Druck (3,5–4 bar statt 5–6 bar), der eine „cremigere" Perlage erzeugte. Heute müssen Crémants den vollen Druck aufweisen und unterliegen strengen EU-Produktionsregeln (Verordnung 1308/2013): Ganztraubenpressung ist vorgeschrieben, die Ausbeute darf maximal 100 Liter Most aus 150 kg Trauben betragen, die Mindestlagerzeit auf der Hefe beträgt 9 Monate, und der Grundwein muss vor der Tirage analysiert werden.

**Crémant d'Alsace** ist der volumenstärkste französische Crémant und macht über 50 % der gesamten Crémant-Produktion aus. Zugelassene Rebsorten sind Pinot Blanc (dominierend), Riesling, Pinot Gris, Auxerrois, Chardonnay und Pinot Noir. Die Kombination aus dem kühlen elsässischen Klima und den aromatischen Rebsorten ergibt Schaumweine von bemerkenswerter Frische und sortentypischer Frucht. Der Crémant d'Alsace Blanc de Noirs (100 % Pinot Noir) kann erstaunlich champagnerähnlich sein. Das Preis-Leistungs-Verhältnis ist herausragend: Für 8–15 Euro erhält man Schaumweine, die in Blindverkostungen regelmäßig Non-Vintage-Champagner unter 30 Euro schlagen.

**Crémant de Loire** stammt aus dem Loiretal und basiert auf Chenin Blanc (der hier seine mineralische, honigartige Seite zeigt), Chardonnay, Cabernet Franc (für Rosé) und Pinot Noir. Saumur ist das historische Zentrum der Loire-Schaumweinproduktion — die Tuffsteinhöhlen bieten ideale Lagerbedingungen (konstant 12 °C). Einige Produzenten lagern ihre Crémants 3–5 Jahre auf der Hefe, was Komplexität erzeugt, die vielen Champagnern ebenbürtig ist. Besonders empfehlenswert sind die Crémants von Langlois-Château, Bouvet-Ladubay und Domaine des Baumard.

**Crémant de Bourgogne** profitiert von den gleichen Rebsorten (Chardonnay, Pinot Noir) und ähnlichem Terroir wie die Champagne. Die Region um Rully (Côte Chalonnaise) ist das Herzzentrum der Produktion. Louis Bouillot, Bailly Lapierre (die Genossenschaft in Bailly nutzt spektakuläre unterirdische Steinbrüche als Reifekeller) und Vitteaut-Alberti zählen zu den führenden Häusern. Crémant de Bourgogne wird oft als „Champagner-Alternative" positioniert und bietet tatsächlich den ähnlichsten Stil, da Rebsorten und Klimabedingungen vergleichbar sind.

**Weitere Crémant-Appellationen**: **Crémant de Bordeaux** (Sémillon, Sauvignon Blanc, Muscadelle; oft unterschätzt), **Crémant de Jura** (Chardonnay, Savagnin, Pinot Noir; der Savagnin verleiht eine einzigartige nussige Note), **Crémant de Limoux** (Chardonnay, Chenin Blanc, Mauzac, Pinot Noir; die älteste Schaumweinregion Frankreichs), **Crémant de Die** (Clairette, Muscat; leicht und aromatisch) und **Crémant de Savoie** (seit 2015; Jacquère, Altesse; alpin-frisch und eigenständig).

**Crémant im internationalen Kontext**: Auch **Luxemburg** produziert Crémant — der **Crémant de Luxembourg** (Auxerrois, Pinot Blanc, Riesling, Chardonnay) ist die meistproduzierte Appellation des Landes und hat sich einen exzellenten Ruf erarbeitet. Insgesamt bieten Crémants das beste Preis-Leistungs-Verhältnis im Segment der nach Méthode Traditionnelle hergestellten Schaumweine. Für den Getränkefachhandel sind sie ein unverzichtbares Sortimentselement zwischen Sekt und Champagner.`,
      quiz: [
        {
          question:
            "Wie lange muss ein Crémant mindestens auf der Hefe lagern?",
          options: ["3 Monate", "6 Monate", "9 Monate", "15 Monate"],
          correct: 2,
          explanation:
            "Crémants müssen gemäß EU-Verordnung mindestens 9 Monate auf der Hefe lagern. Dies ist weniger als bei Non-Vintage-Champagner (15 Monate), aber mehr als bei vielen anderen Schaumweinen.",
        },
        {
          question:
            "Welcher Crémant hat den größten Produktionsanteil in Frankreich?",
          options: [
            "Crémant de Bourgogne",
            "Crémant de Loire",
            "Crémant d'Alsace (über 50 % der gesamten Crémant-Produktion)",
            "Crémant de Bordeaux",
          ],
          correct: 2,
          explanation:
            "Crémant d'Alsace dominiert mit über 50 % der gesamten französischen Crémant-Produktion und bietet ein herausragendes Preis-Leistungs-Verhältnis.",
        },
        {
          question:
            "Welche Rebsorte dominiert den Crémant de Loire und verleiht ihm seine typische mineralisch-honigartige Note?",
          options: [
            "Chardonnay",
            "Sauvignon Blanc",
            "Chenin Blanc",
            "Riesling",
          ],
          correct: 2,
          explanation:
            "Chenin Blanc ist die Leitsorte des Crémant de Loire und zeigt hier seine mineralische, honigartige Seite — unterstützt von Chardonnay, Cabernet Franc und Pinot Noir.",
        },
      ],
    },

    // ─── Lektion 7 ───────────────────────────────────────────
    {
      title: "Cava — Spaniens traditioneller Schaumwein",
      content: `## Méthode Traditionnelle aus dem Penedès und darüber hinaus

**Cava** ist Spaniens bedeutendster Qualitätsschaumwein und wird nach der Méthode Traditionnelle hergestellt. Der Name stammt vom katalanischen Wort *cava* (Keller/Höhle). Die DO Cava wurde 1972 geschaffen und ist eine der wenigen spanischen Denominaciones, die nicht an eine einzige Region gebunden ist — Cava darf in 159 Gemeinden in sieben Autonomen Gemeinschaften produziert werden. Das Herz der Produktion liegt jedoch im **Penedès** (Katalonien), insbesondere rund um **Sant Sadurní d'Anoia**, wo über 95 % der Gesamtproduktion konzentriert sind. Die Kalksteinböden und das mediterrane Klima mit kühlen Nächten bieten ideale Bedingungen.

**Die traditionellen Rebsorten**: Die klassische Cava-Triade besteht aus **Macabeo** (auch Viura; bringt florale Noten und Frische), **Xarel·lo** (ausgesprochen „Tscha-rel-lo"; verleiht Struktur, Körper und Erdigkeit — der Charakter-Geber) und **Parellada** (feine Aromatik und Eleganz in höheren Lagen). Diese drei autochthonen Sorten unterscheiden Cava grundlegend von Champagner. Seit 1986 sind auch Chardonnay und Pinot Noir zugelassen, was den internationalen Stil stärkt, aber von Puristen kritisch gesehen wird. Für Rosado (Rosé) sind Garnacha, Monastrell und Trepat zugelassen.

**Qualitätsstufen — Die Revolution von 2020**: Historisch wurde Cava primär nach Hefelagerzeit klassifiziert: **Cava** (mindestens 9 Monate), **Cava Reserva** (mindestens 15 Monate), **Cava Gran Reserva** (mindestens 30 Monate). Die grundlegende Reform der DO-Regeln 2020 führte ein herkunftsbasiertes System ein, das die bloße Zeitangabe ergänzt: **Cava de Guarda** (Einstieg, 9 Monate Hefe), **Cava de Guarda Superior** (mit spezifischen Subzonen: *Reserva* 18 Monate, *Gran Reserva* 30 Monate, *Cava de Paraje Calificado* 36 Monate aus Einzellage). Die Paraje-Calificado-Kategorie verlangt zudem ökologischen Anbau, Handlese und strenge Ertragsbegrenzung — sie positioniert Cava erstmals auf Prestige-Cuvée-Niveau.

**Die großen Häuser**: **Codorníu** (gegründet 1551, ältestes Sekthaus Spaniens; Manuel Raventós begann 1872 mit der Schaumweinproduktion nach der Méthode Champenoise), **Freixenet** (weltweit größter Schaumweinproduzent; die schwarze Flasche des Cordon Negro ist ikonisch), **Gramona** (Familienweingut seit 1881; produziert ausschließlich im Corpinnat-System und hat die DO Cava verlassen), **Raventós i Blanc** (Nachfolger der Codorníu-Gründerfamilie; verließ die DO Cava 2012 und gründete die eigene Qualitätsbezeichnung **Conca del Riu Anoia**), **Recaredo** (biodynamischer Pionier; ausschließlich Brut Nature).

**Corpinnat — Die Abtrünnigen**: 2019 traten neun renommierte Produzenten (darunter Gramona, Torelló, Llopart, Sabaté i Coca) aus der DO Cava aus und gründeten die private Qualitätsbezeichnung **Corpinnat** (*Cor* = Herz des Penedès). Corpinnat verlangt 100 % ökologischen Anbau, ausschließlich autochthone Sorten, Handlese, 18 Monate Mindestlagerzeit und Herkunft aus dem Kerngebiet des Penedès. Diese Bewegung unterstreicht den Qualitätsanspruch katalanischer Spitzenproduzenten, die den Ruf des Cava durch Massenproduktion gefährdet sahen.

**Cava und Champagner im Vergleich**: Während Champagner durch Kühle, Kreide und burgundische Sorten geprägt ist, bietet Cava einen grundlegend anderen Stil: mediterrane Wärme, Kalkstein, autochthone Sorten. Cava zeigt typisch reifere Frucht, weniger Säure, mehr Struktur und erdige Noten. Die besten Gran-Reserva-Cavas und Corpinnat-Weine bieten bei 15–40 Euro eine Qualität, die in der Champagne 60–120 Euro kostet.`,
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
            "Eine von neun Spitzenproduzenten gegründete private Qualitätsbezeichnung für Premium-Schaumwein aus dem Herzen des Penedès",
            "Eine Rebsorte für Rosé-Cava",
            "Ein Süßegrad für Cava",
          ],
          correct: 1,
          explanation:
            "Corpinnat wurde 2019 von neun renommierten Produzenten gegründet, die die DO Cava verließen. Es verlangt ökologischen Anbau, autochthone Sorten, Handlese und Herkunft aus dem Kern-Penedès.",
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
      content: `## Italiens meistgetrunkener Schaumwein — von der Massenware zum Terroir-Wein

**Prosecco** ist der volumenmäßig erfolgreichste Schaumwein der Welt. Die Bezeichnung hat eine komplexe Geschichte: Bis 2009 war „Prosecco" sowohl der Name einer Rebsorte als auch einer Herkunft. Die epochale Reform von 2009 trennte beides: Die Rebsorte wurde in **Glera** umbenannt, und „Prosecco" wurde zur geschützten geografischen Bezeichnung (DOC/DOCG), die an das Anbaugebiet im norditalienischen **Veneto** und **Friaul-Julisch Venetien** gebunden ist. Damit wurde verhindert, dass Produzenten außerhalb Italiens die Rebsorte anbauen und ihren Wein als „Prosecco" vermarkten.

**Prosecco DOC** umfasst ein riesiges Gebiet von neun Provinzen in Veneto und Friaul. Die Produktion beträgt über 600 Millionen Flaschen jährlich. Die Weine werden fast ausschließlich im **Charmat-Verfahren** hergestellt und zeigen den typischen Prosecco-Stil: blumig-fruchtige Aromen (weißer Pfirsich, Birne, Akazienblüte, grüner Apfel), moderate Säure, leichte Süße und eine frische, unkomplizierte Perlage. Der Alkoholgehalt liegt typisch bei 10,5–11,5 % Vol. — deutlich niedriger als bei Champagner. Es gibt drei Typen: **Spumante** (voll schäumend, >3 bar), **Frizzante** (leicht perlend, 1–2,5 bar) und **Tranquillo** (still, selten zu finden).

**Prosecco DOCG Conegliano Valdobbiadene** ist das historische Herz und die Qualitätsspitze der Prosecco-Produktion. Die steilen Hügel zwischen den Städten Conegliano und Valdobbiadene nördlich von Treviso wurden 2019 zum **UNESCO-Weltkulturerbe** erklärt. Die Böden (Moränen, Ton, Sandstein) und das kühlere Mikroklima in Höhenlagen von 50–500 Metern erzeugen Weine mit deutlich mehr Komplexität, Mineralität und Tiefe als die Ebenen-Proseccos der DOC. Innerhalb der DOCG gibt es die Spitzenbezeichnung **Rive** (Einzellagen von 43 benannten Hügelgemeinden, mit Jahrgangsangabe) und das legendäre **Cartizze** — eine 107 Hektar große Grand-Cru-ähnliche Steillage, deren Weine die höchsten Preise erzielen.

**Prosecco DOCG Asolo** ist die kleinere, weniger bekannte DOCG südwestlich von Conegliano Valdobbiadene. Die vulkanischen Böden und das Mikroklima der Asolo-Hügel erzeugen einen etwas vollmundigeren, strukturierteren Stil. Die Produktion ist deutlich geringer, und die Weine sind für Kenner eine lohnende Entdeckung.

**Prosecco Rosé DOC** wurde erst 2020 eingeführt und ist damit die jüngste Prosecco-Kategorie. Er muss mindestens 85 % Glera und 10–15 % Pinot Noir enthalten und darf ausschließlich als Spumante (mit Jahrgangsangabe) produziert werden. Die Einführung war zunächst umstritten, hat sich aber kommerziell als äußerst erfolgreich erwiesen und ein jüngeres Publikum angesprochen.

**Qualitätsdiskussion**: Die enorme Produktionsmenge der Prosecco DOC hat zu berechtigter Kritik geführt: Massenweine zu 3–5 Euro pro Flasche verwässern das Image. Die DOCG-Produzenten betonen daher zunehmend die Herkunftshierarchie (DOC → DOCG → Rive → Cartizze) und investieren in Terroir-Kommunikation. Spitzenerzeuger wie Bisol, Nino Franco, Adami, Col Vetoraz und Bortolomiol demonstrieren eindrucksvoll, dass Prosecco DOCG ein ernstzunehmender Terroir-Schaumwein sein kann — mit Preisen von 12–30 Euro für Rive- und Cartizze-Weine.

**Glera — Die Rebsorte**: Glera ist eine spätreifende, ertragreiche Weißweinsorte mit dünner Schale und intensiver Aromatik. Sie liefert Weine mit moderatem Alkohol, dezenter Säure und ausgeprägt blumig-fruchtigen Primäraromen. Ihre aromatische Intensität macht sie ideal für das Charmat-Verfahren, das diese Primäraromen bewahrt. In Verschnitten dürfen bis zu 15 % andere Sorten (Verdiso, Bianchetta Trevigiana, Perera, Glera Lunga, sowie Chardonnay und Pinot-Sorten) eingesetzt werden.`,
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
            "Eine 107 Hektar große Grand-Cru-ähnliche Steillage innerhalb der DOCG Conegliano Valdobbiadene",
            "Ein Charmat-Verfahren für Spitzen-Prosecco",
            "Der Name des Prosecco-Konsortiums",
          ],
          correct: 1,
          explanation:
            "Cartizze ist eine 107 ha große Prestigelage innerhalb der DOCG Conegliano Valdobbiadene — vergleichbar mit einem Grand Cru. Die Weine erzielen die höchsten Prosecco-Preise.",
        },
        {
          question:
            "Welche Besonderheit gilt für Prosecco Rosé DOC (seit 2020)?",
          options: [
            "Er darf nur als Frizzante produziert werden",
            "Er muss 100 % Glera enthalten",
            "Er muss mindestens 85 % Glera und 10–15 % Pinot Noir enthalten und darf nur als Spumante mit Jahrgangsangabe produziert werden",
            "Er darf nur in der DOCG-Zone hergestellt werden",
          ],
          correct: 2,
          explanation:
            "Prosecco Rosé DOC verlangt 85 % Glera + 10–15 % Pinot Noir, darf nur als Spumante hergestellt werden und muss eine Jahrgangsangabe tragen — strenger als Standard-Prosecco.",
        },
      ],
    },

    // ─── Lektion 9 ───────────────────────────────────────────
    {
      title: "Deutscher Sekt — Winzersekt vs. Großkellerei",
      content: `## Vom Billig-Image zum Qualitätswunder — Deutschlands Sekt-Renaissance

Deutschland ist der **größte Schaumweinkonsument der Welt** (ca. 300 Millionen Flaschen jährlich, rund 3,5 Liter pro Kopf) und gleichzeitig einer der größten Produzenten. Der Begriff **Sekt** bezeichnete historisch jeden Qualitätsschaumwein mit mindestens 10 % Vol. Alkohol und mindestens 3,5 bar Druck. Doch hinter diesem einen Wort verbirgt sich eine enorme Qualitätsspanne — vom industriellen Massenprodukt für 2,99 Euro bis zum handwerklichen Winzersekt für über 40 Euro.

**Die Geschichte des deutschen Sekts**: Georg Christian Kessler gründete 1826 in Esslingen am Neckar die erste deutsche Sektkellerei, nachdem er bei Veuve Clicquot in der Champagne gelernt hatte. Im 19. Jahrhundert entstanden die großen Häuser: Henkell (1832), Deinhard (1843), Kupferberg (1850), Söhnlein (1864), Mumm (1877 — nicht verwandt mit G.H. Mumm Champagner). Bis 1902 war Deutschland der größte Schaumweinproduzent der Welt. Bismarck führte 1902 die **Sektsteuer** ein (heute 1,02 Euro pro 0,75-l-Flasche), die ursprünglich zur Finanzierung der Kaiserlichen Marine diente und bis heute besteht — weltweit einzigartig.

**Großkellerei-Sekt**: Die industrielle Sektproduktion nutzt überwiegend das **Charmat-Verfahren** oder das **Transvasierverfahren** und verarbeitet importierte Grundweine aus Frankreich, Italien oder Spanien — der Großteil des deutschen Sekts wird nicht aus deutschen Trauben hergestellt. Die Bezeichnung **Deutscher Sekt** auf dem Etikett bedeutet lediglich, dass die Versektung in Deutschland stattfand, nicht dass die Trauben aus Deutschland stammen. Nur die Bezeichnung **Sekt b.A.** (bestimmter Anbaugebiete) garantiert deutsche Trauben aus einem definierten Anbaugebiet. Marken wie Rotkäppchen, Mumm, Henkell und Freixenet (die heute zu einem Konzern gehören) dominieren den Massenmarkt mit Preisen von 3–8 Euro.

**Winzersekt — Die Qualitätsrevolution**: Seit den 1990er-Jahren hat eine wachsende Bewegung von Qualitätswinzern den **Winzersekt** als eigenständige Premium-Kategorie etabliert. Winzersekt wird ausschließlich aus eigenen Trauben des Weinguts hergestellt, nach der **Méthode Traditionnelle** (Flaschengärung mit Remuage und Dégorgement) produziert und lagert typischerweise 24–60 Monate auf der Hefe. Der **Verband Deutscher Prädikatsweingüter (VDP)** hat ein eigenes Sekt-Klassifikationssystem eingeführt: **VDP.SEKT** (Gutssekt), **VDP.SEKT.ORTSWEIN** (Ortssekt), **VDP.SEKT.GROSSE LAGE** (aus Großer Lage) — analog zur VDP-Stillwein-Klassifikation.

**Pioniere und Spitzenerzeuger**: **Raumland** (Flörsheim-Dalsheim, Rheinhessen) gilt als Deutschlands führendes Sekthaus — Volker und Heide-Rose Raumland produzieren ausschließlich Sekt nach Méthode Traditionnelle mit Hefelagerung von 36–120 Monaten. Weitere Spitzenproduzenten: **Griesel & Compagnie** (Bensheim, Hessische Bergstraße; 36+ Monate Hefelager), **Bardong** (Pfalz; minimalistischer Ansatz), **Wilhelmshof** (Pfalz), **Solter** (Rheingau; Riesling-Sekt-Spezialist), **von Buhl** (Pfalz; Riesling-Sekt aus VDP-Großen Lagen), **Aldinger** (Württemberg) und **Bründlmayer** (Kamptal, Österreich; als Referenz für den deutschsprachigen Raum).

**Riesling-Sekt — Das deutsche Alleinstellungsmerkmal**: Während die meisten Schaumwein-Nationen auf Chardonnay und Pinot Noir setzen, hat Deutschland mit dem **Riesling-Sekt** ein einzigartiges Produkt ohne globale Parallele. Riesling bringt von Natur aus hohe Säure, intensive Aromatik (Zitrus, Pfirsich, Apfel, Petrol) und ausgeprägte Mineralität mit — ideale Voraussetzungen für erstklassigen Schaumwein. Die besten Riesling-Sekte (Brut Nature oder Extra Brut) aus Mosel, Rheingau, Pfalz und Nahe können in Blindverkostungen mit Blanc-de-Blancs-Champagner konkurrieren. Die Preise liegen typischerweise bei 15–40 Euro.

**Das neue Qualitätsbewusstsein**: Die deutsche Sekt-Renaissance hat den Markt nachhaltig verändert. Fachzeitschriften, Sommeliers und die Gastronomie widmen Winzersekt zunehmend eigene Kategorien. Die Sektsteuer bleibt allerdings ein Wettbewerbsnachteil, da sie auch Spitzenprodukte belastet.`,
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
            "Sekt b.A. (bestimmter Anbaugebiete) garantiert, dass die Trauben aus einem definierten deutschen Anbaugebiet stammen. 'Deutscher Sekt' allein bedeutet nur, dass die Versektung in Deutschland stattfand.",
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
            "Was unterscheidet Riesling-Sekt als deutsches Alleinstellungsmerkmal?",
          options: [
            "Er wird ausschließlich im Charmat-Verfahren hergestellt",
            "Riesling bietet hohe Säure, intensive Aromatik und Mineralität — ein Schaumwein-Stil ohne globale Parallele",
            "Er wird nur in der Mosel-Region produziert",
            "Er ist immer süß (Demi-Sec oder Doux)",
          ],
          correct: 1,
          explanation:
            "Riesling-Sekt ist ein deutsches Unikat: Die Sorte bringt von Natur aus hohe Säure, komplexe Aromatik und Mineralität mit. Die besten Exemplare konkurrieren mit Blanc-de-Blancs-Champagner.",
        },
      ],
    },

    // ─── Lektion 10 ──────────────────────────────────────────
    {
      title: "Franciacorta, Cap Classique und weitere Schaumweine der Welt",
      content: `## Méthode Traditionnelle rund um den Globus

**Franciacorta DOCG** (Lombardei, Italien) ist Italiens Antwort auf Champagner und wird ausschließlich nach der Méthode Traditionnelle (hier *Metodo Classico* genannt) hergestellt. Die Region liegt südlich des Iseosees in der Provinz Brescia. Die zugelassenen Rebsorten sind Chardonnay (dominierend), Pinot Noir (*Pinot Nero*) und Erbamat (eine autochthone Sorte, seit 2017 zugelassen, die hohe Säure bewahrt — eine strategische Antwort auf den Klimawandel). Die Mindestlagerzeiten sind strenger als in der Champagne: **Non-Vintage** mindestens 18 Monate auf der Hefe, **Satèn** (ein exklusiver, nur in Franciacorta existierender Stil mit reduziertem Druck von max. 5 bar, ausschließlich aus weißen Trauben — „Seide in Flüssigform") mindestens 24 Monate, **Vintage** mindestens 30 Monate, **Riserva** mindestens 60 Monate. Spitzenerzeuger: Ca' del Bosco (der „Dom Pérignon Italiens"), Bellavista, Berlucchi, Contadi Castaldi, Ferghettina, Cavalleri.

**Cap Classique** (Südafrika) ist die Bezeichnung für südafrikanische Schaumweine nach der Méthode Traditionnelle. Der Begriff wurde 1992 eingeführt, um die Weine von einfacheren Schaumweinen (*Méthode Cap Classique* = MCC) abzugrenzen. Die Wiege der südafrikanischen Sektproduktion ist **Stellenbosch**, aber auch die kühleren Regionen Robertson, Walker Bay und Elgin liefern herausragende Grundweine. Chardonnay und Pinot Noir dominieren, aber auch Chenin Blanc wird verwendet — eine südafrikanische Besonderheit. Die besten Cap Classiques lagern 36–72 Monate auf der Hefe und erreichen ein Qualitätsniveau, das bei internationalen Wettbewerben regelmäßig für Überraschungen sorgt. Spitzenerzeuger: **Graham Beck** (hat bei zwei Präsidenten-Inaugurationen in den USA als Toastwein gedient), **Simonsig** (Pionierkellerei, erster MCC 1971), **Pongrácz**, **Villiera**, **Colmant** (von einem belgischen Winzer gegründet).

**English Sparkling Wine** (England) hat in den letzten zwei Jahrzehnten eine bemerkenswerte Qualitätsrevolution erlebt. Die Kreideböden in Sussex, Kent und Hampshire sind geologisch mit der Champagne identisch (gleiche Kreideschicht, getrennt durch den Ärmelkanal). Der Klimawandel hat die Bedingungen in Südengland verbessert: Längere Vegetationsperioden und wärmere Sommer ermöglichen zuverlässigere Reife bei gleichzeitig hoher Säure. Chardonnay, Pinot Noir und Pinot Meunier — die Champagner-Triade — dominieren. Spitzenerzeuger: **Nyetimber** (hat in renommierten Blindverkostungen Champagner geschlagen), **Wiston Estate**, **Ridgeview**, **Gusbourne**, **Hattingley Valley**, **Exton Park**.

**Méthode Traditionnelle in der Neuen Welt**: In **Kalifornien** haben Champagnerhäuser selbst investiert: Moët & Chandon besitzt Domaine Chandon (Napa), Louis Roederer besitzt Roederer Estate (Anderson Valley), Taittinger besitzt Domaine Carneros, und Mumm besitzt Mumm Napa. **Tasmanien** (Australien) gilt als eine der vielversprechendsten Schaumweinregionen der Welt — das kühle Klima erzeugt Grundweine von champagnerähnlicher Finesse (House of Arras, Jansz, Pirie). In **Neuseeland** produzieren vor allem Marlborough und Central Otago hochwertige Méthode-Traditionnelle-Weine (No. 1 Family Estate, Quartz Reef). **Brasilien** (Serra Gaúcha) überrascht zunehmend mit Qualität (Cave Geisse, Miolo).

**Trento DOC** (Trentino, Italien) verdient besondere Erwähnung: Der *Metodo Classico* aus dem Trentino wird von **Ferrari** dominiert — das Haus produziert über 5 Millionen Flaschen Méthode Traditionnelle und hat bei internationalen Wettbewerben wiederholt als „Sparkling Wine Producer of the Year" triumphiert. Giulio Ferraris Perlé-Linie ist legendär.`,
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
            "Weil die Kreideböden in Sussex/Kent/Hampshire geologisch identisch mit denen der Champagne sind",
            "Weil England die gleichen Rebsorten anbaut wie Cava",
            "Wegen der sandigen Böden an der Küste",
          ],
          correct: 1,
          explanation:
            "Die Kreideböden in Sussex, Kent und Hampshire gehören zur gleichen geologischen Schicht wie die der Champagne — getrennt nur durch den Ärmelkanal.",
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
      content: `## Welche Trauben bringen die besten Bläschen?

Die Wahl der Rebsorte ist fundamental für den Charakter eines Schaumweins. Grundsätzlich gilt: Ideale Schaumwein-Trauben liefern **hohe natürliche Säure** (entscheidend für Frische und Langlebigkeit), **moderate Aromatik** (bei Méthode Traditionnelle, da Autolyse-Aromen dominieren sollen) oder **intensive Primäraromen** (bei Charmat-Verfahren), **neutrale bis elegante Grundweine** mit moderatem Alkohol und **gute Extraktionsfähigkeit** bei schonender Pressung.

**Chardonnay** ist die weltweit wichtigste weiße Schaumwein-Rebsorte. In der Champagne liefert sie die Basis für Blanc de Blancs — Weine von außergewöhnlicher Eleganz, Zitrusfrucht, Mineralität und Langlebigkeit. Chardonnay reift im Hefelager besonders gut und entwickelt komplexe Noten von Brioche, geröstetem Brot und Haselnuss. Die Sorte ist anpassungsfähig und wird in praktisch jeder Schaumweinregion der Welt angebaut: Champagne, Franciacorta, England, Kalifornien, Tasmanien. In kühleren Klimaten (Côte des Blancs, Limoux) zeigt sie mehr Zitrus und Kreide, in wärmeren (Napa, Stellenbosch) mehr tropische Frucht und Fülle.

**Pinot Noir** ist die bedeutendste rote Schaumwein-Rebsorte und verleiht Struktur, Körper, rote Frucht (Erdbeere, Himbeere) und Kraft. In der Champagne macht er 38 % der Rebfläche aus und ist die Rückgrat-Sorte der Montagne de Reims. Bei der Pressung muss sorgfältig gearbeitet werden, um Farbextraktion zu vermeiden (außer bei Rosé). Die *Cuvée* (der First Press, 2.050 Liter aus 4.000 kg Trauben) ist farbneutral und von höchster Qualität; die *Taille* (die Nachpressung) enthält mehr Farbe und gröbere Tannine. Pinot Noir ist auch in Franciacorta, England, Australien, Neuseeland und bei Cap Classique die Leitsorte für Struktur und Komplexität.

**Pinot Meunier** (in Deutschland als Schwarzriesling oder Müllerrebe bekannt) wird oft als „dritte Sorte" der Champagne unterschätzt, macht aber 32 % der Rebfläche aus und ist unentbehrlich für den Hausstil vieler Marken. Meunier liefert Fruchtigkeit, Rundheit, weiche Textur und frühe Trinkreife. Die Sorte ist weniger frostempfindlich als Pinot Noir, weshalb sie in der kühlen Vallée de la Marne dominiert. Grower-Champagner-Pioniere wie Jérôme Prévost (La Closerie) haben bewiesen, dass reinsortiger Meunier-Champagner von erhabener Qualität sein kann.

**Glera** ist die Sorte hinter dem Prosecco-Phänomen. Sie liefert intensiv blumig-fruchtige Aromen (weißer Pfirsich, Birne, Akazienblüte), die im Charmat-Verfahren optimal zur Geltung kommen. Glera ist ertragreich und spätreifend — in den Steillagen der DOCG Conegliano Valdobbiadene zeigt sie ihre beste Seite mit mehr Mineralität und Komplexität.

**Macabeo, Xarel·lo, Parellada** bilden die autochthone Triade des Cava. Xarel·lo ist die Charaktersorte — erdig, strukturiert, mit Noten von Mandel und Kräutern. Macabeo bringt florale Frische, Parellada elegante Aromatik aus höheren Lagen.

**Riesling** — Deutschlands Beitrag zur Schaumweinwelt — liefert Sekte von einzigartiger Aromatik: Zitrus, Pfirsich, grüner Apfel, Steinobst, und nach Reifung Petrolnoten. Die hohe natürliche Säure des Rieslings prädestiniert ihn für Schaumwein, und die sortentypische Mineralität ist in Brut-Nature-Sekten besonders ausgeprägt.

**Chenin Blanc** ist die Basis für Crémant de Loire, Vouvray Mousseux und südafrikanischen Cap Classique. Die Sorte zeigt Honig, Quitte, Apfel und eine lebendige Säure, die für hervorragende Schaumwein-Langlebigkeit sorgt.

**Weitere Sorten**: Muscat/Moscato (für Asti Spumante — aromatisch, niedrigalkoholisch), Mauzac (Blanquette de Limoux — apfelig, rustikal), Jacquère (Crémant de Savoie — alpin-frisch), Erbamat (Franciacorta — hohe Säure, Klimawandel-Antwort), Savagnin (Crémant de Jura — nussig, eigenständig).`,
      quiz: [
        {
          question:
            "Warum wird Pinot Meunier in der Champagne oft unterschätzt?",
          options: [
            "Weil er nur 5 % der Rebfläche ausmacht",
            "Weil er als 'dritte Sorte' gilt, obwohl er 32 % der Fläche ausmacht und Fruchtigkeit, Rundheit und frühe Trinkreife liefert",
            "Weil er nur für Rosé-Champagner verwendet wird",
            "Weil er keine Autolyse-Fähigkeit hat",
          ],
          correct: 1,
          explanation:
            "Pinot Meunier wird oft als 'dritte Sorte' abgetan, macht aber 32 % der Champagne-Fläche aus. Er liefert Fruchtigkeit und Rundheit und ist weniger frostempfindlich als Pinot Noir.",
        },
        {
          question:
            "Was unterscheidet die Cuvée von der Taille bei der Champagner-Pressung?",
          options: [
            "Die Cuvée ist der Second Press, die Taille der First Press",
            "Die Cuvée (First Press, 2.050 l aus 4.000 kg) ist farbneutral und von höchster Qualität; die Taille enthält mehr Farbe und gröbere Tannine",
            "Cuvée und Taille sind identisch",
            "Die Taille wird nur für Blanc de Blancs verwendet",
          ],
          correct: 1,
          explanation:
            "Die Cuvée ist der erste, schonende Pressvorgang (2.050 l aus 4.000 kg Trauben) — farbneutral und qualitativ überlegen. Die Taille (Nachpressung) enthält mehr Farbe und gröbere Stoffe.",
        },
        {
          question:
            "Warum wurde Erbamat in der Franciacorta DOCG zugelassen?",
          options: [
            "Weil sie höheren Alkohol liefert",
            "Als strategische Antwort auf den Klimawandel, da Erbamat hohe natürliche Säure bewahrt",
            "Weil sie intensivere Aromen hat als Chardonnay",
            "Weil sie ertragreicher ist",
          ],
          correct: 1,
          explanation:
            "Erbamat wurde 2017 zugelassen, weil diese autochthone Sorte selbst in warmen Jahren hohe natürliche Säure bewahrt — eine strategische Maßnahme gegen den Klimawandel.",
        },
      ],
    },

    // ─── Lektion 12 ──────────────────────────────────────────
    {
      title: "Dosage und Süßegrade",
      content: `## Die letzte Entscheidung — Zucker als Stilmittel

Die **Dosage** (auch *Liqueur d'Expédition*) ist der letzte Schritt vor dem endgültigen Verschluss eines Schaumweins nach der Méthode Traditionnelle. Nach dem Dégorgement wird der durch den Hefeaustrag verlorene Wein durch eine Mischung aus Wein und Zucker (bei einigen Produzenten auch Most oder Traubenkonzentrat) ersetzt. Die Menge des zugesetzten Zuckers bestimmt den **Süßegrad** — und damit den Geschmacksstil — des fertigen Schaumweins. Die Dosage ist eine der am kontroversesten diskutierten Entscheidungen in der Schaumweinproduktion: Sie kann Säure abrunden, Komplexität hinzufügen oder — bei übertriebenem Einsatz — die Terroir-Charakteristik des Weins verschleiern.

**Die offiziellen EU-Süßegrade für Schaumwein** (gemäß EU-Verordnung 1308/2013, Anhang VII): **Brut Nature** (auch Pas Dosé, Dosage Zéro, Non Dosé): 0–3 g/l Restzucker, **kein** Zucker nach dem Dégorgement zugesetzt. **Extra Brut**: 0–6 g/l Restzucker. **Brut**: 0–12 g/l Restzucker — der weltweit dominierende Stil (ca. 90 % aller Champagner). **Extra Dry** (Extra Sec): 12–17 g/l — trotz des Namens merklich süßer als Brut (ein häufiger Irrtum). **Dry** (Sec): 17–32 g/l. **Demi-Sec** (Halbtrocken): 32–50 g/l — klassisch zu Desserts. **Doux** (Süß): über 50 g/l — heute äußerst selten.

**Die Kunst der Dosage**: Die Dosage ist weit mehr als bloße Süßung. Ein erfahrener Kellermeister nutzt sie als **Balancewerkzeug**: Der Zucker interagiert mit der Säure und der Kohlensäure und beeinflusst die Wahrnehmung von Mundgefühl, Fruchtigkeit und Geschmackslänge. Ein Champagner mit 8 g/l Dosage (unterer Brut-Bereich) kann trockener schmecken als einer mit 3 g/l, wenn letzterer eine niedrigere Säure hat. Die **Formel** ist daher immer: Dosage im Verhältnis zur Säure (TA) und zum Alkoholgehalt betrachten. Einige Produzenten verwenden statt Rohrzucker auch **MCR** (Moût Concentré Rectifié — rektifiziertes Traubenmost-Konzentrat) oder **Réservewein** als Dosage, um ein komplexeres Geschmacksprofil zu erreichen.

**Der Brut-Nature-Trend**: In den letzten zwei Jahrzehnten hat sich ein deutlicher Trend zu niedrigeren Dosagen etabliert. Immer mehr Produzenten — von Grower-Champagnern über Franciacorta bis zum deutschen Winzersekt — setzen auf **Brut Nature** oder **Extra Brut**. Die Philosophie: Ohne (oder mit minimaler) Dosage wird der Wein „nackt" präsentiert — Terroir, Jahrgangscharakter und Vinifikation stehen im Vordergrund, ohne dass Zucker die Ecken und Kanten abrundet. Kritiker dieser Bewegung argumentieren, dass manche Weine ohne Dosage aggressiv, unbalanciert oder eindimensional schmecken, weil ihnen die abrundende Wirkung des Zuckers fehlt. Die Wahrheit liegt wie so oft in der Mitte: Ein großer Grundwein braucht wenig oder keine Dosage; ein einfacherer Grundwein profitiert oft von einer wohlüberlegten Dosage von 6–8 g/l.

**Dosage und Alterung**: Die Wahrnehmung der Dosage verändert sich über die Lagerzeit. Ein frisch degorgierter Champagner mit 8 g/l Dosage kann merklich süßer schmecken als derselbe Wein nach 2–3 Jahren Flaschenreifung, da der Zucker über die Zeit in das Gesamtgefüge integriert wird. Einige Produzenten wie Krug geben daher bewusst etwas höhere Dosagen, die für sofortigen Genuss leicht süß erscheinen, aber für die Langzeitreifung konzipiert sind. Das **Dégorgementdatum** auf dem Etikett (zunehmend angegeben) ist daher eine wichtige Information für den Konsumenten.

**Regionale Unterschiede**: In der Champagne liegt die durchschnittliche Dosage bei Brut-Champagnern heute bei ca. 7–9 g/l (vor 30 Jahren waren 12 g/l Standard). Cava wird häufig als Brut Nature oder Extra Brut produziert (besonders Recaredo und Corpinnat-Mitglieder). Prosecco tendiert zu leicht höheren Dosagen (Extra Dry ist die meistverkaufte Kategorie). Franciacorta positioniert sich im Brut-Bereich. Deutscher Winzersekt geht zunehmend in Richtung Brut Nature.

**Dosage im Charmat-Verfahren**: Beim Charmat-Verfahren wird die Dosage vor der isobarischen Abfüllung im Tank zugegeben. Die Kontrolle ist hier einfacher und präziser als bei der Einzelflaschen-Dosage der Méthode Traditionnelle. Bei Prosecco wird oft nicht von „Dosage", sondern von **Restzucker** gesprochen, der aus der Gärung stammt (die Gärung wird gestoppt, bevor aller Zucker vergoren ist).`,
      quiz: [
        {
          question:
            "Welcher Süßegrad dominiert den Champagner-Markt mit ca. 90 % Marktanteil?",
          options: [
            "Brut Nature (0–3 g/l)",
            "Extra Brut (0–6 g/l)",
            "Brut (0–12 g/l)",
            "Extra Dry (12–17 g/l)",
          ],
          correct: 2,
          explanation:
            "Brut (0–12 g/l Restzucker) ist mit ca. 90 % Marktanteil der dominierende Champagner-Stil. Der Durchschnitt liegt heute bei etwa 7–9 g/l.",
        },
        {
          question:
            "Warum ist die Bezeichnung 'Extra Dry' bei Schaumwein irreführend?",
          options: [
            "Weil Extra Dry der trockenste Süßegrad ist",
            "Weil Extra Dry (12–17 g/l) merklich süßer ist als Brut (0–12 g/l), obwohl der Name 'trocken' suggeriert",
            "Weil Extra Dry nur bei Prosecco verwendet wird",
            "Weil der Alkoholgehalt dabei besonders niedrig ist",
          ],
          correct: 1,
          explanation:
            "Extra Dry/Extra Sec (12–17 g/l) ist merklich süßer als Brut (0–12 g/l). Der Name 'dry/trocken' ist irreführend und eine häufige Fehlannahme bei Konsumenten.",
        },
        {
          question:
            "Warum kann ein Champagner mit 8 g/l Dosage trockener schmecken als einer mit 3 g/l?",
          options: [
            "Weil der Alkohol die Süße maskiert",
            "Weil der Champagner mit höherer Dosage auch eine höhere Säure haben kann, die den Zucker balanciert",
            "Weil die Kohlensäure bei 8 g/l stärker ist",
            "Weil 3 g/l der Mindestwert für Brut Nature ist",
          ],
          correct: 1,
          explanation:
            "Die Süßewahrnehmung hängt vom Verhältnis Zucker zu Säure ab. Hohe Säure lässt eine höhere Dosage trockener schmecken; niedrige Säure lässt selbst geringe Dosage süßer wirken.",
        },
      ],
    },

    // ─── Lektion 13 ──────────────────────────────────────────
    {
      title: "Sensorik und Verkostung von Schaumwein",
      content: `## Schaumwein verkosten wie ein Sommelier

Die professionelle Verkostung von Schaumwein erfordert eine erweiterte sensorische Methodik im Vergleich zur Stillweinverkostung. Die Kohlensäure fügt eine zusätzliche Dimension hinzu, die Aromenwahrnehmung, Mundgefühl und Gesamtbewertung beeinflusst. Ein systematischer Ansatz ist entscheidend, um die Qualitätsmerkmale eines Schaumweins objektiv zu erfassen.

**Das richtige Glas**: Das traditionelle Champagner-Glas — die flache **Coupe** (angeblich nach der Brust Marie Antoinettes geformt, was historisch nicht belegt ist) — ist für die Verkostung ungeeignet, da die große Oberfläche die Kohlensäure schnell entweichen lässt und Aromen verflüchtigt. Die **Flûte** (Sektflöte) ist besser für die Perlage, aber zu schmal für eine differenzierte Aromenanalyse. Professionelle Verkoster verwenden zunehmend ein **tulpenförmiges Glas** (wie das Riedel Veritas Champagne Wine Glass oder das Zalto Universal) — breit genug für Aromentwicklung, schmal genug für die Perlage. Für analytische Verkostungen empfiehlt sich sogar ein leicht geöffnetes Weißweinglas.

**Visuelle Beurteilung**: Die Farbe reicht von Blassgelb-Grünlich (jung, Blanc de Blancs) über Goldgelb (reif, Pinot-Anteil) bis Bernstein (sehr reif, Oxidation). Rosé-Schaumweine zeigen Lachs, Kupfer bis helles Kirschrot. Entscheidend ist die **Perlage**: **Größe** der Bläschen (fein = Qualitätsmerkmal, groß = einfacherer Wein oder wärmere Temperatur), **Persistenz** (wie lange Bläschen aufsteigen — bei Top-Champagnern stundenlang), **Regelmäßigkeit** (gleichmäßige „Perlenschnüre" = *cordons de bulles* vs. chaotisches Sprudeln), **Mousse** (der Schaum an der Oberfläche — fein, cremig und persistent bei Qualitätswein vs. grobblasig und schnell verschwindend). Die Perlage ist direkt mit der Qualität der Kohlensäure-Integration verknüpft: Langsame Flaschengärung bei niedrigen Temperaturen erzeugt feinere Bläschen als schnelle Tankgärung.

**Olfaktorische Analyse (Nase)**: Bei Schaumwein ist die erste Nase unmittelbar nach dem Einschenken besonders wichtig — die aufsteigenden Bläschen transportieren flüchtige Aromen intensiv nach oben. **Primäraromen** (von der Rebsorte): Zitrusfrucht, Apfel, Birne, Pfirsich, Blüten (typisch bei jungem Prosecco, Crémant). **Sekundäraromen** (von der Vinifikation): Brotkruste, Brioche, Toast, Biskuit, Mandel, Haselnuss (typisch bei Méthode Traditionnelle mit Autolyse). **Tertiäraromen** (von der Reifung): Honig, Nougat, Trockenfrüchte, Pilz, Trüffel, Rauch, Kaffee (typisch bei gereiften Prestige-Cuvées). Die **Intensität** und **Komplexität** der Aromen sind wichtige Qualitätsindikatoren.

**Gustatorische Analyse (Gaumen)**: Beim Schaumwein kommen spezifische Bewertungskriterien hinzu: **Antrunk** (der erste Eindruck — frisch, cremig, aggressiv?), **Mousse am Gaumen** (wie fühlt sich die Kohlensäure im Mund an — seidig, cremig, pikant, stechend?), **Säure-Dosage-Balance** (das Zusammenspiel von Säure, Restzucker und CO₂), **Körper und Textur** (von schlank und nervös bis vollmundig und cremig), **Geschmackslänge** (wie lange der Eindruck nach dem Schlucken anhält — der *Finish* oder *Nachhall*). Große Schaumweine haben einen Nachhall von über 15 Sekunden mit sich verändernden Aromen.

**Typische Fehltöne**: **Oxidation** (nussig, sherryartig — wenn nicht beabsichtigt), **Korkton** (TCA — muffig, nasser Karton; seltener bei Kronkorken), **Reduktion** (Schwefelwasserstoff, faule Eier — kann sich beim Belüften verflüchtigen), **Brettanomyces** (Pferdestall, Pflaster — selten bei Schaumwein), **zu niedrige/hohe Dosage** (aggressiv sauer vs. klebrig süß), **Lichttöne** (*goût de lumière* — Schwefelverbindungen durch UV-Licht, besonders bei hellen Flaschen).

**Verkostungsprotokoll**: Professionelle Schaumwein-Verkostungen folgen einem standardisierten Protokoll: Temperatur 8–10 °C, tulpenförmiges Glas, 100 ml Einschenkmenge, 2–3 Minuten Standzeit (damit die initiale CO₂-Aggression nachlässt), dann erst Nase, dann Gaumen. Die Verkostung erfolgt idealerweise am Vormittag, wenn die sensorische Wahrnehmung am schärfsten ist.`,
      quiz: [
        {
          question:
            "Warum verwenden professionelle Verkoster zunehmend tulpenförmige Gläser statt Flûtes?",
          options: [
            "Weil Flûtes zu teuer sind",
            "Weil tulpenförmige Gläser breit genug für Aromentwicklung und schmal genug für die Perlage sind",
            "Weil die Coupe das beste Verkostungsglas ist",
            "Weil die Kohlensäure in der Flûte zu schnell entweicht",
          ],
          correct: 1,
          explanation:
            "Tulpenförmige Gläser bieten den idealen Kompromiss: ausreichend Oberfläche für Aromentwicklung und genügend Verengung, um die Perlage zu erhalten und Aromen zu bündeln.",
        },
        {
          question:
            "Was sind typische Sekundäraromen bei Schaumwein nach Méthode Traditionnelle?",
          options: [
            "Zitrus, Apfel, Birne",
            "Brotkruste, Brioche, Toast, Biskuit — entstanden durch Autolyse",
            "Honig, Trüffel, Trockenfrüchte",
            "Rose, Veilchen, Litschi",
          ],
          correct: 1,
          explanation:
            "Sekundäraromen wie Brioche, Toast und Biskuit entstehen durch die Autolyse — die Zersetzung der Hefe während der Lagerung auf dem Hefesatz (Sur Lie).",
        },
        {
          question: "Was ist 'goût de lumière'?",
          options: [
            "Ein Geschmack, der durch zu viel Dosage entsteht",
            "Schwefelverbindungen, die durch UV-Lichteinwirkung auf den Wein entstehen — besonders bei hellen Flaschen",
            "Ein typisches Aroma von Blanc de Blancs",
            "Der Lichtreflex in der Perlage",
          ],
          correct: 1,
          explanation:
            "Goût de lumière (Lichtgeschmack) entsteht durch UV-Licht, das Schwefelverbindungen im Wein erzeugt. Helle Flaschen sind besonders anfällig — ein Grund, warum Champagner oft in dunklen Flaschen abgefüllt wird.",
        },
      ],
    },

    // ─── Lektion 14 ──────────────────────────────────────────
    {
      title: "Flaschengrößen und Etiketten",
      content: `## Vom Piccolo bis zum Nebukadnezar — und was das Etikett verrät

Die Welt der Schaumwein-Flaschengrößen ist so vielfältig wie faszinierend. Jedes Format hat eigene Vor- und Nachteile hinsichtlich Reifung, Handhabung und Prestige. Die biblisch-historischen Namen der Großflaschen verleihen dem Schaumwein eine Aura des Besonderen, die bei keinem anderen Getränk existiert.

**Die Flaschengrößen**: **Piccolo / Quart** (0,2 l — 1/4 Flasche; für Flugzeuge und Minibars), **Demi / Half** (0,375 l — 1/2 Flasche; elegant, aber reift schneller), **Standard** (0,75 l — die Referenzgröße), **Magnum** (1,5 l — 2 Flaschen; von vielen Experten als ideale Reifegröße betrachtet, da das Verhältnis von Weinvolumen zu Sauerstoff im Flaschenhals optimal ist), **Jeroboam** (3 l — 4 Flaschen), **Rehoboam** (4,5 l — 6 Flaschen), **Methusalem** (6 l — 8 Flaschen), **Salmanazar** (9 l — 12 Flaschen), **Balthasar** (12 l — 16 Flaschen), **Nebukadnezar** (15 l — 20 Flaschen). Seltene Sonderformate: **Salomon/Melchior** (18 l — 24 Flaschen) und **Primat** (27 l — 36 Flaschen, nur von Drappier produziert). Die Benennung folgt biblischen Königen und Patriarchen — Methusalem war der älteste Mensch der Bibel, Nebukadnezar der mächtigste König Babylons.

**Reifung und Flaschengröße**: Die Flaschengröße beeinflusst die Reifung maßgeblich. In der **Magnum** reift Champagner langsamer und harmonischer, da das Volumen-zu-Sauerstoff-Verhältnis günstiger ist. Viele Top-Produzenten (z.B. Bollinger) führen die Zweitgärung in der Magnum durch und füllen dann für kleinere Formate um. In der **Demi-Flasche** verläuft die Reifung schneller, und der Wein kann vorzeitig altern. **Großflaschen** ab Jeroboam werden fast immer im Transvasierverfahren gefüllt, auch wenn auf dem Etikett „Méthode Traditionnelle" steht — die Zweitgärung fand dann in der Standardflasche oder Magnum statt.

**Das Etikett lesen — Champagner als Beispiel**: Ein Champagner-Etikett enthält eine Fülle an Informationen für den informierten Konsumenten. **Pflichtangaben**: Name/Marke, „Champagne" (AOC), Alkoholgehalt (% Vol.), Volumen, Herstellercode (NM/RM/CM/RC/MA + Registrierungsnummer), Land, Allergene (enthält Sulfite). **Häufige Zusatzangaben**: Süßegrad (Brut, Extra Brut etc.), Cuvée-Name (Prestige Cuvée, Grande Réserve etc.), Jahrgang (bei Millésimé), Rebsorteninformation (Blanc de Blancs, Blanc de Noirs), Dégorgementdatum (zunehmend, besonders bei Grower-Champagnern), Einzellagen-Bezeichnung.

**Der Herstellercode im Detail**: Die zwei Buchstaben vor der Registrierungsnummer auf dem Etikett sind ein Schlüssel zur Identität des Produzenten. **NM** (Négociant-Manipulant) — Handel mit Traubenzukauf (>80 % aller Champagner). **RM** (Récoltant-Manipulant) — Winzer, der ausschließlich eigene Trauben verarbeitet (Grower Champagne). **CM** (Coopérative de Manipulation) — Genossenschaft, die Trauben ihrer Mitglieder verarbeitet. **RC** (Récoltant-Coopérateur) — Genossenschaftsmitglied, das fertigen Champagner unter eigenem Label verkauft. **MA** (Marque d'Acheteur) — Handelsmarke/Eigenmarke eines Käufers. Für den Fachhandel ist besonders die Unterscheidung NM vs. RM relevant, da Grower-Champagner zunehmend nachgefragt werden.

**Cava-Etikett**: Qualitätsstufen (Cava, Reserva, Gran Reserva, Paraje Calificado), Herkunftszone, Rebsorten, Jahrgang (bei Vintage), ökologische Zertifizierung. **Prosecco-Etikett**: DOC oder DOCG, Spumante/Frizzante/Tranquillo, Süßegrad, bei DOCG ggf. Rive-Bezeichnung und Jahrgang. **Franciacorta-Etikett**: DOCG, Stilbezeichnung (Satèn, Rosé, Vintage, Riserva), Rebsorten, Hefelagerzeit, Dégorgementdatum (häufig angegeben).

**Die Agraffe (Muselet)**: Das Drahtgestell über dem Korken hat exakt **sechs Halbwindungen** — ein weltweiter Standard. Der Druck in einer Champagnerflasche (5–6 bar) entspricht dem doppelten Reifendruck eines PKW. Ohne Agraffe würde der Korken herausgeschossen werden. Die **Plaque de Muselet** (Kapsel auf der Agraffe) ist ein beliebtes Sammelobjekt — es gibt über 100.000 verschiedene Designs, und die Hobby-Sammler nennen sich **Placomusophile**.`,
      quiz: [
        {
          question:
            "Warum gilt die Magnum als ideale Reifegröße für Champagner?",
          options: [
            "Weil sie den geringsten Preis pro Liter hat",
            "Weil das Verhältnis von Weinvolumen zu Sauerstoff im Flaschenhals optimal ist und der Wein langsamer, harmonischer reift",
            "Weil die Magnum die einzige Flaschengröße für Vintage-Champagner ist",
            "Weil Großflaschen nicht existierten, als die Regel festgelegt wurde",
          ],
          correct: 1,
          explanation:
            "In der Magnum (1,5 l) ist das Verhältnis von Weinvolumen zu Sauerstoff im Flaschenhals optimal. Der Wein reift langsamer und gleichmäßiger als in der Standardflasche.",
        },
        {
          question:
            "Wie viele Halbwindungen hat die Agraffe (Drahtgestell) einer Champagnerflasche?",
          options: ["Drei", "Vier", "Sechs", "Acht"],
          correct: 2,
          explanation:
            "Die Agraffe hat exakt sechs Halbwindungen — ein weltweiter Standard. Sie sichert den Korken gegen den Druck von 5–6 bar (doppelter PKW-Reifendruck).",
        },
        {
          question:
            "Was beschreibt die Bezeichnung 'Rive' auf einem Prosecco DOCG?",
          options: [
            "Einen bestimmten Süßegrad",
            "Das Charmat-Lungo-Verfahren",
            "Eine von 43 benannten Einzellagen-Hügelgemeinden mit Jahrgangsangabe",
            "Den Rosé-Stil des Prosecco",
          ],
          correct: 2,
          explanation:
            "Rive bezeichnet eine von 43 benannten Hügelgemeinden innerhalb der DOCG Conegliano Valdobbiadene. Rive-Proseccos müssen eine Jahrgangsangabe tragen und zeigen Lagencharakter.",
        },
      ],
    },

    // ─── Lektion 15 ──────────────────────────────────────────
    {
      title: "Lagerung, Temperatur und Service",
      content: `## Vom Keller ins Glas — perfekter Schaumwein-Genuss

Die korrekte Lagerung und der fachgerechte Service sind entscheidend, um das volle Potenzial eines Schaumweins auszuschöpfen. Fehler in diesen Bereichen können selbst den besten Champagner ruinieren. Für den Getränkefachhandel und die Gastronomie ist dieses Wissen unverzichtbar.

**Lagerung — Grundregeln**: Schaumwein sollte **liegend** gelagert werden, damit der Korken feucht bleibt und seine Elastizität behält. Ein ausgetrockneter Korken verliert seine Dichtigkeit, Kohlensäure entweicht, und der Wein oxidiert vorzeitig. Die ideale Lagertemperatur liegt bei **10–12 °C** — konstant, ohne Schwankungen. Temperaturschwankungen lassen den Wein „atmen" (Expansion und Kontraktion), was zu vorzeitiger Alterung führt. Die **Luftfeuchtigkeit** sollte bei 70–80 % liegen, um Korkaustrocknung zu verhindern. **Dunkelheit** ist essenziell — UV-Licht verursacht den gefürchteten *goût de lumière* (Lichtgeschmack). **Vibrationsfreiheit** ist wichtig, da Erschütterungen die Perlage negativ beeinflussen und die Hefeautolyse stören können.

**Reifepotenzial**: Nicht jeder Schaumwein profitiert von Lagerung. **Prosecco** und einfache **Charmat-Sekte** sind für sofortigen Genuss konzipiert und sollten innerhalb von 1–2 Jahren nach dem Kauf getrunken werden — ihre Fruchtaromen verblassen mit der Zeit, ohne dass Komplexität hinzukommt. **Non-Vintage-Champagner** kann 3–5 Jahre nach dem Dégorgement reifen und entwickelt dabei nussige, honigartige Noten. **Vintage-Champagner** und **Prestige Cuvées** haben ein Reifepotenzial von 10–30+ Jahren — Krug 1988 oder Dom Pérignon 1996 trinken sich heute in absoluter Perfektion. **Crémant**, **Cava Gran Reserva** und **Franciacorta Riserva** können 5–10 Jahre reifen. **Winzersekt** aus Deutschland (Brut Nature, lange Hefelagerung) zeigt nach 3–7 Jahren bemerkenswerte Entwicklung.

**Trinktemperatur**: Die richtige Temperatur ist entscheidend für die Aromenentfaltung und die Qualität der Perlage. **Einfache Schaumweine** (Prosecco DOC, Sekt der Großkellerei): 6–8 °C — die Kühle maskiert eventuelle Schwächen und betont Frische. **Non-Vintage-Champagner, Crémant, Cava**: 8–10 °C — kühl genug für Frische, warm genug für Aromentwicklung. **Vintage-Champagner, Prestige Cuvées, Franciacorta Riserva**: 10–12 °C — diese komplexen Weine brauchen etwas Wärme, um ihre volle Aromenpalette zu entfalten. **Reifer Champagner** (10+ Jahre): 12–14 °C — ähnlich wie großer Weißwein. Zu kalte Temperaturen unterdrücken Aromen; zu warme Temperaturen lassen die Kohlensäure aggressiv werden und die Perlage gröber erscheinen.

**Kühlung**: Die beste Methode ist ein **Eiskübel** (Eis-Wasser-Mischung, 50:50) — kühlt eine Flasche in 20–30 Minuten von Raumtemperatur auf 8 °C. Der Kühlschrank braucht 3–4 Stunden für das gleiche Ergebnis. Das **Gefrierfach** ist riskant: Ab –5 °C kann der Wein gefrieren und die Flasche sprengen (Kohlensäure senkt den Gefrierpunkt nur leicht). **Nie** Champagner bei Zimmertemperatur servieren.

**Das Öffnen**: Die Flasche sollte nach dem Kühlen ruhig stehen (Erschütterungen erhöhen den Druck unmittelbar unter dem Korken). Die Agraffe wird gelöst (sechs Halbwindungen), dabei wird die Hand stets über dem Korken gehalten. Die korrekte Technik: **Flasche drehen, nicht den Korken** — in einem Winkel von 45° geneigt, mit kontrolliertem Druckablassen. Das ideale Geräusch ist ein leises **Seufzen** (*soupir*), nicht ein lauter Knall — der Knall bedeutet Kohlensäureverlust. Bei wertvollen Flaschen und altem Champagner empfiehlt sich eine **Champagnerzange** zum kontrollierten Öffnen.

**Einschenken**: Das Glas wird schräg gehalten, der Wein wird langsam am Glasrand entlang eingeschenkt — in zwei Etappen (erst zur Hälfte, Schaum abklingen lassen, dann auffüllen bis 2/3). Die CO₂-Verluste werden so minimiert, und die Perlage bleibt fein. Das Glas sollte **nicht** poliert oder gespült werden — Mikrokratzer auf der Glasoberfläche dienen als Nukleationspunkte für die Perlage. Absolut saubere, neue Gläser können paradoxerweise eine schwache Perlage zeigen. Einige Glashersteller ätzen daher absichtlich einen kleinen Punkt in den Glasboden (**point d'effervescence**), um eine gleichmäßige Perlage zu gewährleisten.

**Service-Fehler im Fachhandel und in der Gastronomie**: Zu kalt serviert (unter 5 °C — keine Aromen), zu warm serviert (über 14 °C — CO₂ wird aggressiv), falsche Gläser (Coupe — Aromenverlust), zu volle Gläser (kein Raum für Aromentwicklung), Flasche nicht nachgekühlt (Temperatur steigt in 30 Minuten um 5 °C).`,
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
            "Bei welcher Temperatur sollte ein gereifter Vintage-Champagner serviert werden?",
          options: [
            "4–6 °C",
            "6–8 °C",
            "10–12 °C, um die volle Aromenpalette zu entfalten",
            "Zimmertemperatur (18–20 °C)",
          ],
          correct: 2,
          explanation:
            "Vintage-Champagner und Prestige Cuvées brauchen 10–12 °C, um ihre Komplexität zu entfalten. Zu kalte Temperaturen unterdrücken die Aromen dieser hochwertigen Weine.",
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
      content: `## Schaumwein als vielseitigster Speisenbegleiter

Schaumwein ist der **universellste Speisenbegleiter** unter allen Weintypen. Die Kombination aus Säure, Kohlensäure und — bei der Méthode Traditionnelle — Autolyse-Komplexität macht ihn zum idealen Partner für ein erstaunlich breites Spektrum an Gerichten. Die Kohlensäure wirkt als natürlicher **Gaumenreiniger** (*palate cleanser*), der zwischen den Bissen den Geschmack „resettet" und dadurch verhindert, dass reiche, fette Speisen den Gaumen ermüden.

**Das wissenschaftliche Prinzip**: Die Kohlensäure im Schaumwein hat eine **fettlösende Wirkung** — sie emulgiert Fette auf der Zunge und im Gaumen, ähnlich wie Säure in einer Vinaigrette Öl aufspaltet. Gleichzeitig stimuliert das CO₂ die Geschmackspapillen und erhöht die Gesamtwahrnehmung von Aromen — sowohl des Weins als auch der Speise. Die Säure im Schaumwein kontrastiert Salz und Umami, während die Dosage (Restzucker) scharfe oder bittere Elemente abmildern kann.

**Klassische Pairings**: **Austern + Blanc de Blancs Champagner** — das ikonische Pairing. Die Jod-Salzigkeit der Auster harmoniert mit der Mineralität und Zitrusfrucht des Chardonnay. **Sashimi/Sushi + Extra Brut** — die reine Fischprotein-Textur wird durch die Kohlensäure aufgelöst, die Säure balanciert Sojasoße und Wasabi. **Kaviar + Brut Nature** — die Salzigkeit des Kaviars kontrastiert perfekt mit der knochentrockenen, mineralischen Reinheit. **Trüffel-Risotto + Vintage Champagner** — die Autolyse-Noten (Brioche, Hefe) echoen die erdige Umami-Tiefe des Trüffels. **Fried Chicken / Frittiertes + Brut Champagner** — das fettlösende CO₂ schneidet durch die Panierung und setzt den Geschmack frei; ein Pairing, das in der Gastronomie zunehmend populär ist.

**Regionale Pairings**: **Prosecco + Antipasti** — Prosciutto, Burrata, mariniertes Gemüse; die Fruchtigkeit und leichte Süße des Prosecco harmoniert mit dem Salz des Schinkens und der Cremigkeit des Käses. **Cava + Tapas** — Manchego, Jamón Ibérico, Oliven, Tortilla; die erdige Xarel·lo-Note des Cava komplementiert die nussig-salzigen Aromen der Tapas. **Crémant d'Alsace + Tarte Flambée** — ein elsässischer Klassiker; die Frische des Crémant kontrastiert Crème Fraîche und Speck. **Franciacorta Satèn + Vitello Tonnato** — die cremige Textur des Satèn spiegelt die Sauce wider, während die Säure das Thunfisch-Aroma hervorhebt. **Winzersekt Brut Nature + Zander** — die Mineralität des Riesling-Sekts und die Finesse des Süßwasserfischs harmonieren auf hohem Niveau.

**Süße Schaumweine und Dessert**: **Demi-Sec Champagner + Tarte Tatin** — die karamellisierten Äpfel spiegeln die Dosage wider. **Asti Spumante + Panettone** — ein italienischer Weihnachtsklassiker; Muskataromen und leichte Süße. **Moscato d'Asti + frisches Obst** — der niedrige Alkohol (5,5 %) und die zarte Süße passen perfekt zu Erdbeeren, Pfirsichen und Melone. **Brachetto d'Acqui + Schokolade** — roter Schaumwein mit Rosenduft trifft auf dunkle Schokolade.

**Schaumwein als Aperitif**: Die klassischste Rolle — aber auch hier gibt es Feinheiten. Ein **Brut Nature Champagner** ist als Aperitif für unerfahrene Gäste zu fordernd; ein **Brut** (6–8 g/l) oder **Prosecco Extra Dry** ist einladender. Ein **Rosé-Schaumwein** als Aperitif signalisiert Festlichkeit und ist visuell ansprechend. Dazu kleine Häppchen: gesalzene Mandeln, Parmesan-Stücke, Gougères (Gruyère-Windbeutel), Blinis mit Lachs.

**Vermeidungen**: Sehr scharfe Gerichte (Chili, Thai-Schärfe) lassen die Kohlensäure aggressiv und stechend wirken. Süße Desserts mit trockenem Schaumwein erzeugen Dissonanz — der Wein schmeckt bitter und sauer. Sehr tanninhaltige Gerichte (z.B. Rotwein-Reduktionen) harmonieren schlecht mit der Kohlensäure.`,
      quiz: [
        {
          question:
            "Warum eignet sich Schaumwein besonders gut zu fetthaltigen Speisen?",
          options: [
            "Weil der Alkohol das Fett auflöst",
            "Weil die Kohlensäure fettlösend wirkt und als natürlicher Gaumenreiniger fungiert",
            "Weil die Dosage das Fett neutralisiert",
            "Weil Schaumwein kalt serviert wird",
          ],
          correct: 1,
          explanation:
            "Die Kohlensäure im Schaumwein emulgiert Fette auf der Zunge (palate cleansing). Deshalb funktioniert sogar Fried Chicken hervorragend mit Brut-Champagner.",
        },
        {
          question:
            "Warum sollte man sehr scharfe Gerichte nicht mit Schaumwein kombinieren?",
          options: [
            "Weil der Alkohol die Schärfe verstärkt",
            "Weil die Kohlensäure bei Schärfe aggressiv und stechend wirkt",
            "Weil die Dosage die Schärfe nicht ausgleichen kann",
            "Weil scharfe Gerichte den Korken beschädigen",
          ],
          correct: 1,
          explanation:
            "Scharfe Gerichte (Capsaicin) machen die Kohlensäure aggressiv und stechend — die CO₂-Prickelwirkung wird als unangenehm empfunden, statt als erfrischend.",
        },
        {
          question:
            "Welches Pairing ist ein zunehmend populärer Gastronomie-Trend?",
          options: [
            "Champagner mit Schokoladentorte",
            "Brut Champagner mit Fried Chicken — die Kohlensäure schneidet durch die Panierung",
            "Prosecco mit Steak",
            "Demi-Sec mit Austern",
          ],
          correct: 1,
          explanation:
            "Fried Chicken mit Brut Champagner ist ein modernes Trend-Pairing: Die fettlösende Kohlensäure schneidet durch die Panierung und setzt den Geschmack frei.",
        },
      ],
    },

    // ─── Lektion 17 ──────────────────────────────────────────
    {
      title: "Schaumwein-Cocktails",
      content: `## Prickelnde Mixologie — Klassiker und moderne Kreationen

Schaumwein-Cocktails gehören zu den elegantesten und festlichsten Kategorien der Barkultur. Vom zeitlosen Champagner-Cocktail bis zum modernen Spritz — die Kohlensäure verleiht Drinks Leichtigkeit, Frische und visuelle Dramatik. Für den Getränkefachhandel sind Schaumwein-Cocktails ein wichtiges Upselling-Thema: Sie machen Schaumwein für ein breiteres Publikum zugänglich und können teurere Flaschen in der Gastronomie verankern.

**Die Grundregel des Mixens**: Für Cocktails sollte **kein** teurer Schaumwein verwendet werden — die feinen Nuancen eines Vintage-Champagners gehen in der Mischung verloren. Ideal sind solide **Brut-Crémants** (8–12 Euro), **Prosecco DOC** (5–8 Euro) oder **Cava** (6–10 Euro). Der Schaumwein wird **immer zuletzt** zugegeben und **niemals** geschüttelt — nur vorsichtig verrührt oder das Glas schräg gehalten und langsam aufgefüllt. Schütteln zerstört die Kohlensäure und erzeugt unkontrolliertes Überschäumen.

**Klassische Schaumwein-Cocktails**: Der **Champagne Cocktail** (seit ca. 1862 dokumentiert) ist der Urvater aller Schaumwein-Drinks: Ein Stück Würfelzucker wird mit Angostura Bitters getränkt, ins Champagnerglas gelegt, mit Cognac (2 cl) übergossen und mit Champagner aufgefüllt. Die Zucker-Bitters-Kombination erzeugt eine faszinierende Aromenbrücke zur Autolyse-Komplexität des Champagners.

Der **Kir Royal** — Crème de Cassis (Schwarze Johannisbeerlikör, 1–2 cl) mit Champagner aufgefüllt — wurde nach Félix Kir, dem Bürgermeister von Dijon, benannt, der den Drink populär machte (obwohl der ursprüngliche Kir mit Weißwein und nicht mit Champagner gemixt wurde). Die Qualität des Cassis ist entscheidend: Premium-Cassis aus Burgund (16–20 % Vol., mind. 400 g/l Frucht) unterscheidet sich fundamental von industriellen Produkten. Variationen: Kir Impérial (Crème de Framboise/Himbeere), Kir Pêche (Crème de Pêche/Pfirsich), Kir Mûre (Crème de Mûre/Brombeere).

Die **Bellini** wurde in den 1940er-Jahren von Giuseppe Cipriani in Harry's Bar in Venedig erfunden: Frischer weißer Pfirsichsaft (oder Pfirsichpüree, 1/3) wird mit Prosecco (2/3) aufgefüllt. Die originale Bellini verwendet **weißen Pfirsich** — gelber Pfirsich verändert Farbe und Geschmack erheblich. Die perfekte Bellini hat eine zartrosa Farbe und balanciert die Süße des Pfirsichs mit der Frische des Prosecco.

Der **Mimosa** (auch Buck's Fizz in England) — frisch gepresster Orangensaft (1/3) mit Champagner (2/3) — ist der Klassiker beim Brunch. Die Qualität steht und fällt mit dem Orangensaft: Frisch gepresst aus süßen, aromatischen Orangen (Valencia, Navel). Niemals Saft aus dem Karton verwenden.

**Moderne Kreationen**: Der **Aperol Spritz** (3 Teile Prosecco, 2 Teile Aperol, 1 Splash Soda, Orangenscheibe) hat in den 2010er-Jahren einen globalen Trend ausgelöst und den Prosecco-Absatz massiv angekurbelt. Der **Hugo** (Prosecco, Holunderblütensirup, Mineralwasser, Minze, Limette) wurde 2005 von dem Südtiroler Barkeeper Roland Gruber erfunden und ist besonders im deutschsprachigen Raum populär. Der **French 75** (Gin 3 cl, Zitronensaft 1,5 cl, Zuckersirup 1,5 cl, Champagner auffüllen) verbindet die Komplexität eines Gin Sour mit der Eleganz des Champagners. Der Name bezieht sich auf die französische 75-mm-Feldkanone im Ersten Weltkrieg — der Drink „trifft" angeblich mit gleicher Wirkung.

**Spritz-Kultur**: Die italienische Spritz-Tradition geht über Aperol hinaus: **Select Spritz** (venezianischer Bitter, kräftiger als Aperol), **Campari Spritz** (bitterer, komplexer), **Cynar Spritz** (Artischocken-Bitter, herb-erdig). Basis ist immer Prosecco Spumante oder Frizzante. Diese Drinks haben Schaumwein zum Alltags-Getränk demokratisiert.

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
      content: `## Pink Bubbles — Mehr als nur eine Farbe

Rosé-Schaumwein hat in den letzten zwei Jahrzehnten einen beeindruckenden Aufstieg erlebt. Was einst als Nischenprodukt galt, macht heute einen wachsenden Anteil des globalen Schaumweinmarktes aus. Rosé-Champagner allein verzeichnet seit 2000 einen Anstieg von 300 % im Absatzvolumen. Die Farbe Rosé steht für Festlichkeit, Lebensfreude und Zugänglichkeit — eine perfekte Ergänzung zum Schaumwein-Image.

**Herstellungsmethoden**: Es gibt drei grundlegende Wege, Rosé-Schaumwein zu erzeugen. Die **Saignée-Methode** (von frz. *saigner* = bluten lassen): Rote Trauben (typisch Pinot Noir) werden gemaischt, und nach kurzem Schalenkontakt (6–72 Stunden) wird ein Teil des farbigen Mostes abgezogen. Dieser Most wird dann zum Grundwein für den Schaumwein vergoren. Die Saignée-Methode liefert intensivere Farben (Lachs bis Kirschrot) und ausgeprägtere Aromen roter Früchte (Erdbeere, Himbeere, Kirsche). Die **Assemblage-Methode**: Einem weißen Grundwein wird eine kleine Menge (typisch 5–20 %) fertiger Rotwein (in der Champagne meist Pinot Noir aus der Montagne de Reims, Coteaux Champenois) zugesetzt. Diese Methode erlaubt eine präzisere Farbkontrolle und ist in der Champagne die dominierende Technik. Die Champagne ist die **einzige** französische AOC, in der die Assemblage-Methode für Rosé gestattet ist — in allen anderen Appellationen ist das Mischen von Rot- und Weißwein zur Roséherstellung verboten. Die **Direktpressung** (selten bei Schaumwein): Rote Trauben werden sofort gepresst, der leicht rosafarbene Most direkt vergoren. Das Ergebnis ist ein sehr blasser Rosé mit dezenter Frucht.

**Rosé-Champagner**: Etwa 10–12 % der Champagner-Produktion sind Rosé (Tendenz steigend). Die Preise liegen typischerweise 10–30 % über dem entsprechenden Brut-Champagner — teilweise gerechtfertigt durch den höheren Aufwand, teilweise durch die höhere Zahlungsbereitschaft der Konsumenten. **Laurent-Perrier Cuvée Rosé** (Saignée-Methode, seit 1968 — der Pionier des modernen Rosé-Champagners), **Billecart-Salmon Brut Rosé** (Assemblage, gilt als Referenz für Eleganz), **Ruinart Rosé** (Assemblage, ältestes Champagnerhaus, gegr. 1729), **Dom Pérignon Rosé** (Assemblage, Prestige-Cuvée mit enormer Komplexität) und **Krug Rosé** (seit 2008, Multi-Vintage-Assemblage mit über 30 Weinen).

**Rosé-Crémant**: Crémant d'Alsace Rosé (100 % Pinot Noir, hervorragendes Preis-Leistungs-Verhältnis), Crémant de Loire Rosé (Cabernet Franc verleiht würzige Noten von Paprika und Kräutern), Crémant de Bourgogne Rosé (Pinot Noir aus der Côte Chalonnaise).

**Rosé-Cava**: Wird zunehmend aus Garnacha, Monastrell und der seltenen **Trepat** (eine autochthone, nur im Cava zugelassene rote Sorte von bemerkenswerter Eleganz) hergestellt. Die besten Rosé-Cavas zeigen eine lebendige Frucht und mediterrane Wärme.

**Prosecco Rosé DOC**: Seit 2020 zugelassen, muss mindestens 85 % Glera und 10–15 % Pinot Noir enthalten. Darf nur als Spumante mit Jahrgangsangabe produziert werden. Die Einführung war zunächst kontrovers (Puristen sahen den Prosecco-Charakter in Gefahr), hat sich aber kommerziell als Erfolg erwiesen — das jüngere Publikum wurde gezielt angesprochen.

**Franciacorta Rosé**: Mindestens 25 % Pinot Noir, Saignée-Methode ist hier Standard. Die langen Hefelagerzeiten (mindestens 24 Monate für Non-Vintage) verleihen den Rosés eine Komplexität, die viele Rosé-Champagner übertrifft.

**Sensorik von Rosé-Schaumwein**: Typische Aromen: Erdbeere, Himbeere, rote Johannisbeere, Kirsche, Rosenblüte, rosa Grapefruit. Bei gereiften Exemplaren: Mandel, Brioche, Blutorange, getrocknete Kräuter. Die Textur ist oft etwas voller als beim weißen Pendant, bedingt durch die Tanninextraktion aus der Schale. Die Farbe reicht von blassem Zwiebelhaut-Rosa über Lachs und Kupfer bis zu leuchtendem Kirschrot — je nach Methode und Mazerationszeit.

**Markttrend**: Rosé-Schaumwein profitiert vom allgemeinen Rosé-Trend und von Social-Media-Ästhetik (die Farbe ist extrem fotogen). Für den Getränkefachhandel ist die Kategorie ein Wachstumssegment mit überdurchschnittlichen Margen.`,
      quiz: [
        {
          question:
            "Warum ist die Champagne die einzige französische AOC, in der Rosé durch Assemblage (Zugabe von Rotwein) hergestellt werden darf?",
          options: [
            "Weil die Champagne die älteste AOC ist",
            "Weil es eine historische Ausnahmeregel ist — in allen anderen französischen AOCs ist das Mischen von Rot- und Weißwein für Rosé verboten",
            "Weil nur Champagner-Trauben dafür geeignet sind",
            "Weil die Assemblage-Methode in der Champagne erfunden wurde",
          ],
          correct: 1,
          explanation:
            "Die Champagne genießt eine historische Ausnahme: Nur hier darf Rosé durch Zugabe von Rotwein zum Weißwein hergestellt werden. In allen anderen französischen AOCs ist diese Methode für Rosé verboten.",
        },
        {
          question:
            "Was ist die Besonderheit der Rebsorte Trepat im Cava-Rosé?",
          options: [
            "Sie ist die ertragreichste rote Sorte Spaniens",
            "Sie ist eine autochthone, nur im Cava zugelassene rote Sorte von bemerkenswerter Eleganz",
            "Sie wird auch in der Champagne angebaut",
            "Sie liefert die dunkelste Roséfarbe aller Sorten",
          ],
          correct: 1,
          explanation:
            "Trepat ist eine seltene autochthone rote Sorte, die ausschließlich für Cava (insbesondere Rosé-Cava) zugelassen ist und für ihre Eleganz und Finesse geschätzt wird.",
        },
        {
          question:
            "Welcher Rosé-Champagner gilt als Pionier des modernen Stils (seit 1968)?",
          options: [
            "Billecart-Salmon Brut Rosé",
            "Dom Pérignon Rosé",
            "Laurent-Perrier Cuvée Rosé (Saignée-Methode)",
            "Krug Rosé",
          ],
          correct: 2,
          explanation:
            "Laurent-Perrier Cuvée Rosé (seit 1968) gilt als Pionier des modernen Rosé-Champagners. Er wird nach der Saignée-Methode hergestellt und hat den Rosé-Trend maßgeblich mitgeprägt.",
        },
      ],
    },

    // ─── Lektion 19 ──────────────────────────────────────────
    {
      title: "Pétillant Naturel (Pét-Nat)",
      content: `## Die älteste Methode der Welt — neu entdeckt

**Pétillant Naturel** (kurz **Pét-Nat**) ist Schaumwein nach der **Méthode Ancestrale** — dem ältesten bekannten Verfahren zur Herstellung von prickelndem Wein. Im Gegensatz zur Méthode Traditionnelle, bei der ein fertiger Stillwein durch Zugabe von Zucker und Hefe eine zweite Gärung in der Flasche durchläuft, wird bei der Méthode Ancestrale der Most **während der ersten (und einzigen) Gärung** in Flaschen abgefüllt, wo er fertig gärt. Es gibt keine Zweitgärung, keine Zugabe von Zucker oder Hefe, keine Dosage — nur der natürliche Traubenzucker und die natürliche Hefe treiben die Gärung an. Das Ergebnis ist ein authentischer, unmanipulierter Schaumwein.

**Der Prozess**: Die Trauben werden gepresst, und die alkoholische Gärung beginnt im Tank oder Fass. Bei einem Alkoholgehalt von typisch 4–6 % Vol. (wenn noch ca. 20–25 g/l Restzucker im Most sind) wird der teilvergorene Most in Flaschen abgefüllt und mit einem Kronkorken (oder bei traditionellen Produzenten mit einem Agrafenkorken) verschlossen. Die Hefe vergärt den restlichen Zucker in der Flasche, wobei CO₂ entsteht, das sich im Wein löst. Der Druck ist typischerweise geringer als bei der Méthode Traditionnelle — 2–4 bar statt 5–6 bar, was eine zartere, cremigere Perlage ergibt. Die Gärung kann in der Flasche 4–12 Wochen dauern. Ein Restrisiko bleibt: Da die natürliche Hefe und der natürliche Zucker schwer exakt zu kontrollieren sind, variieren Druck und Restzucker von Flasche zu Flasche — jede Flasche ist ein Unikat.

**Degorgiert oder nicht?** Hier gibt es zwei Schulen: Einige Produzenten **degorgieren** den Pét-Nat (entfernen den Hefesatz) und erhalten einen klaren, sauberen Wein. Andere lassen den Hefesatz bewusst in der Flasche — der Wein ist dann **trüb** (ein gewolltes Merkmal, kein Fehler) und zeigt intensivere hefig-brotige Noten. Die trübe Version ist bei Naturwein-Enthusiasten besonders beliebt. Eine Dosage wird in der Regel nicht zugegeben — der eventuelle Restzucker stammt ausschließlich aus der unvollständigen Gärung.

**Blanquette de Limoux — Der Urvater**: Die Abtei Saint-Hilaire im Languedoc dokumentierte bereits 1531 die Herstellung von Schaumwein nach dieser Methode. Die **Blanquette Méthode Ancestrale** (AOP) wird aus der Rebsorte **Mauzac** hergestellt und ist der letzte Wein, der kontinuierlich nach dieser uralten Methode produziert wird. Mauzac bringt typische Aromen von grünem Apfel und Quitte und eine eigentümlich rustikale Textur.

**Die Pét-Nat-Renaissance**: Ab den 2000er-Jahren erlebte die Méthode Ancestrale eine bemerkenswerte Wiedergeburt, getrieben von der **Naturwein-Bewegung**. Pioniere wie **Christian Chaussard** (Loire) und **Patrick Bouju** (Auvergne) begannen, Pét-Nat als radikal authentische Alternative zum konventionellen Schaumwein zu positionieren. Heute wird Pét-Nat weltweit produziert — in Frankreich (Loire, Jura, Languedoc, Elsass), Deutschland (fränkische und pfälzische Naturwein-Winzer), Österreich, Italien, Spanien, Australien, den USA (besonders Oregon und New York) und Südafrika. Die Rebsortenvielfalt ist enorm: Von Chenin Blanc und Gamay über Blaufränkisch und Grüner Veltliner bis zu Zibibbo und Nerello Mascalese.

**Pét-Nat vs. Méthode Traditionnelle**: Die Unterschiede sind fundamental. Pét-Nat ist **einfacher** in der Grundstruktur (keine Autolyse-Komplexität, da keine lange Hefelagerung), aber **authentischer** im Ausdruck (nur natürliche Hefen, kein zugesetzter Zucker). Die Perlage ist **zarter** und **unregelmäßiger**, das Mundgefühl oft **cremiger** und **weicher**. Aromatisch dominieren **Primärfrucht** und hefige Noten, nicht Brioche und Toast. Die Haltbarkeit ist geringer — die meisten Pét-Nats sollten innerhalb von 1–3 Jahren getrunken werden.

**Qualitätsdiskussion**: Kritiker bemängeln die Unberechenbarkeit (Flaschenvarianz, mikrobiologische Risiken, gelegentliche Fehltöne wie Mäuseln oder flüchtige Säure) und das manchmal hohe Preisniveau für vergleichsweise einfache Weine. Befürworter sehen gerade in der Unberechenbarkeit den Reiz — jede Flasche erzählt eine andere Geschichte. Die Wahrheit ist: Handwerklich sauber produzierter Pét-Nat kann von bezaubernder Frische und Authentizität sein; schlecht gemachter Pét-Nat ist fehlerhaft und überteuert. Wie immer im Wein entscheidet die Qualität des Erzeugers.`,
      quiz: [
        {
          question:
            "Was ist der fundamentale Unterschied zwischen Pét-Nat und Champagner?",
          options: [
            "Pét-Nat wird im Charmat-Verfahren hergestellt",
            "Bei Pét-Nat gibt es nur eine Gärung (die in der Flasche endet), keine zugesetzte Hefe oder Zucker — bei Champagner gibt es eine gezielte Zweitgärung mit Liqueur de Tirage",
            "Pét-Nat hat immer mehr Kohlensäure",
            "Pét-Nat wird nur aus roten Trauben hergestellt",
          ],
          correct: 1,
          explanation:
            "Pét-Nat basiert auf einer einzigen Gärung: Der teilvergorene Most wird in Flaschen gefüllt, wo er fertig gärt. Es gibt keine Zweitgärung, keinen zugesetzten Zucker und keine Dosage.",
        },
        {
          question:
            "Warum ist Pét-Nat oft trüb, und ist das ein Fehler?",
          options: [
            "Ja, Trübung ist immer ein Qualitätsmangel",
            "Nein — der Hefesatz wird bei vielen Produzenten bewusst in der Flasche belassen; Trübung ist ein gewolltes Merkmal und kein Fehler",
            "Die Trübung entsteht durch zugesetztes Casein",
            "Die Trübung verschwindet nach einer Stunde von selbst",
          ],
          correct: 1,
          explanation:
            "Viele Pét-Nat-Produzenten belassen den Hefesatz bewusst in der Flasche. Die Trübung ist ein gewolltes Merkmal, das intensivere hefig-brotige Noten bringt.",
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
            "Die Blanquette Méthode Ancestrale (AOP Limoux) wird aus der autochthonen Rebsorte Mauzac hergestellt — seit 1531 dokumentiert und damit der älteste kontinuierlich produzierte Schaumwein.",
        },
      ],
    },

    // ─── Lektion 20 ──────────────────────────────────────────
    {
      title: "Trends und Zukunft des Schaumweins",
      content: `## Wohin prickelt die Welt?

Der Schaumweinmarkt befindet sich in einem fundamentalen Wandel. Konsumgewohnheiten verändern sich, neue Regionen und Stile entstehen, und globale Megatrends wie Nachhaltigkeit, Gesundheitsbewusstsein und Premiumisierung prägen die Zukunft. Für den Getränkefachhandel ist es essenziell, diese Entwicklungen zu verstehen und das Sortiment entsprechend zu gestalten.

**Trend 1 — Premiumisierung**: Der globale Schaumweinmarkt verschiebt sich von Volumen zu Wert. Während der Absatz einfacher Sekte stagniert oder sinkt, wachsen die Segmente **Winzersekt**, **Grower-Champagner**, **Crémant**, **Franciacorta** und **Premium-Cava** überproportional. Konsumenten trinken weniger, aber besser — ein Phänomen, das als *trading up* bezeichnet wird. Für den Fachhandel bedeutet das: Das mittlere Preissegment (10–25 Euro) ist das Wachstumsfeld, während der Einstiegsbereich unter 5 Euro schrumpft.

**Trend 2 — Nachhaltigkeit und Bio**: Ökologischer und biodynamischer Anbau wachsen im Schaumweinbereich überproportional. In der Champagne sind bereits über 20 % der Fläche zertifiziert biologisch oder in Umstellung. Corpinnat verlangt 100 % Bio. Viele Winzersekt-Produzenten arbeiten biodynamisch (Raumland, Griesel, Recaredo). Die **CO₂-Bilanz** der Produktion wird zunehmend thematisiert: Leichtere Flaschen (800 g statt 900 g), kurze Transportwege, Korkrecycling. Für nachhaltigkeitsbewusste Kunden — ein wachsendes Segment — ist die Herkunftsregion (lokal vs. importiert) ein Kaufkriterium. Deutscher Winzersekt hat hier einen natürlichen Vorteil.

**Trend 3 — Zero-Dosage und Minimalismus**: Der Trend zu **Brut Nature** und **Extra Brut** setzt sich ungebremst fort. Die Philosophie: Terroir statt Zucker, Transparenz statt Manipulation. Parallel dazu wächst das Interesse an **Naturwein-Schaumwein** (Pét-Nat, Skin-Contact-Schaumwein, ungeschwefelte Cuvées). Diese Kategorie spricht ein jüngeres, experimentierfreudiges Publikum an, das Authentizität über Perfektion stellt.

**Trend 4 — Englischer Schaumwein**: England ist die am schnellsten wachsende Schaumweinregion der Welt. Die Rebfläche hat sich seit 2000 vervierfacht. Investitionen von Champagnerhäusern (Taittinger hat 2015 ein Weingut in Kent erworben — **Domaine Evremond**; Pommery hat 2017 in Hampshire gepflanzt — **Louis Pommery England**) unterstreichen das Potenzial. Klimamodelle prognostizieren, dass Südengland um 2050 klimatisch dem heutigen Champagne-Klima entsprechen wird. Die besten englischen Schaumweine rivalisieren bereits heute mit Non-Vintage-Champagner in Blindverkostungen.

**Trend 5 — Prosecco-Evolution**: Die Prosecco DOC kämpft mit dem Spagat zwischen Massenmarkt und Qualität. Die DOCG-Zone betont Terroir (Rive, Cartizze) und investiert in die Kommunikation der Herkunftshierarchie. Die Einführung von **Prosecco Rosé** (2020) hat ein neues Segment erschlossen. Langfristig wird sich der Prosecco-Markt aufspalten: Discount-DOC für den Massenmarkt und Premium-DOCG für qualitätsbewusste Konsumenten.

**Trend 6 — Gesundheit und Alkoholreduktion**: Der Trend zu bewusstem Konsum treibt die Nachfrage nach **alkoholreduzierten** und **alkoholfreien** Schaumweinen. Technologien wie Vakuumdestillation, Spinning-Cone-Column und Umkehrosmose ermöglichen die Herstellung von alkoholfreiem Sekt, der geschmacklich zunehmend überzeugt. Marken wie **Kolonne Null** (Deutschland) und **Noughty** (England) zeigen, dass alkoholfreier Schaumwein auch für Weinkritiker akzeptabel sein kann. Das Segment wächst jährlich zweistellig.

**Trend 7 — Schaumwein als Alltagsgetränk**: Die Demokratisierung des Schaumweins — weg vom Festgetränk, hin zum Alltagsbegleiter — verändert Konsummuster grundlegend. Prosecco und Cava haben diesen Wandel eingeleitet, aber auch Crémant und deutscher Winzersekt positionieren sich zunehmend als Aperitif- und Essensbegleiter für jeden Tag. Die Spritz-Kultur (Aperol Spritz, Hugo) hat Schaumwein für Nicht-Weinkenner zugänglich gemacht.

**Trend 8 — Klimawandel und neue Regionen**: Steigende Temperaturen zwingen traditionelle Regionen zur Anpassung (frühere Lese, höhere Lagen, neue Sorten wie Erbamat in Franciacorta) und eröffnen neue Möglichkeiten in kühleren Gebieten. **Tasmanien**, **Patagonien**, **Skandinavien** und **Kanada** (Nova Scotia, British Columbia) experimentieren mit Schaumwein. Gleichzeitig bedrohen Extremwetterereignisse (Frost, Hagel, Hitze) die Erntesicherheit in etablierten Regionen.

**Ausblick für den Getränkefachhandel**: Die Zukunft gehört einem diversifizierten Sortiment: Premium-Champagner für besondere Anlässe, Winzersekt und Crémant als Qualitätsalternative im Mittelsegment, Prosecco DOCG für den fruchtigen Stil, Cava Gran Reserva für Preis-Leistung, Pét-Nat für experimentierfreudige Kunden, alkoholfreie Alternativen für gesundheitsbewusste Konsumenten. Beratungskompetenz wird zum entscheidenden Differenzierungsmerkmal gegenüber dem Lebensmitteleinzelhandel.`,
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
            "Konsumenten trinken weniger, aber besser — das mittlere Preissegment wächst, während der Billigbereich schrumpft",
            "Nur Champagner wird als Premium anerkannt",
            "Die Produktionskosten steigen durch Inflation",
          ],
          correct: 1,
          explanation:
            "Premiumisierung bedeutet, dass Konsumenten weniger, aber höherwertigen Schaumwein kaufen (trading up). Das Wachstum liegt im Segment 10–25 Euro, während der Bereich unter 5 Euro stagniert.",
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
            "Moderne Technologien wie Vakuumdestillation und Spinning-Cone-Column entfernen Alkohol bei niedrigen Temperaturen, wobei Aromen weitgehend erhalten bleiben. Das Segment wächst jährlich zweistellig.",
        },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════
  // FINAL EXAM — 10 Fragen
  // ═══════════════════════════════════════════════════════════
  finalExam: [
    {
      question:
        "Bei der Méthode Traditionnelle werden dem Grundwein typischerweise 24 g/l Zucker im Liqueur de Tirage zugesetzt. Welchen Druck erzeugt dies in der Flasche?",
      options: [
        "2–3 bar",
        "Etwa 6 bar",
        "8–10 bar",
        "12 bar",
      ],
      correct: 1,
      explanation:
        "24 g/l Zucker im Liqueur de Tirage erzeugen bei der Zweitgärung ca. 6 bar Druck (bei 10 °C). Dies entspricht 1,2–1,3 % zusätzlichem Alkohol und ist der Standard für Champagner und andere Méthode-Traditionnelle-Schaumweine.",
    },
    {
      question:
        "Welche Mindestlagerzeit auf der Hefe gilt für Franciacorta Riserva?",
      options: [
        "18 Monate",
        "30 Monate",
        "60 Monate (5 Jahre)",
        "36 Monate",
      ],
      correct: 2,
      explanation:
        "Franciacorta Riserva verlangt mindestens 60 Monate (5 Jahre) Hefelagerung — die strengste Anforderung aller Schaumwein-Appellationen weltweit. Selbst Vintage-Champagner erfordert nur 36 Monate.",
    },
    {
      question:
        "Ein Champagner-Etikett zeigt den Code 'RC-12345'. Was bedeutet das über den Produzenten?",
      options: [
        "Es ist ein Négociant-Manipulant (großes Haus)",
        "Es ist ein Récoltant-Coopérateur — ein Genossenschaftsmitglied, das fertigen Champagner unter eigenem Label verkauft",
        "Es ist ein Récoltant-Manipulant (Grower Champagne)",
        "Es ist eine Marque d'Acheteur (Handelsmarke)",
      ],
      correct: 1,
      explanation:
        "RC (Récoltant-Coopérateur) bedeutet, dass ein Winzer seine Trauben an eine Genossenschaft liefert und fertigen Champagner unter eigenem Etikett zurückerhält. Die Vinifikation liegt bei der Genossenschaft, nicht beim Winzer.",
    },
    {
      question:
        "Warum wurde die autochthone Rebsorte Erbamat 2017 für die Franciacorta DOCG zugelassen?",
      options: [
        "Weil sie intensivere Fruchtaromen liefert als Chardonnay",
        "Weil sie als strategische Antwort auf den Klimawandel hohe natürliche Säure selbst in warmen Jahren bewahrt",
        "Weil sie die Produktionskosten senkt",
        "Weil sie resistenter gegen Mehltau ist",
      ],
      correct: 1,
      explanation:
        "Erbamat bewahrt selbst in heißen Jahren hohe natürliche Säure — unverzichtbar für Schaumwein. Die Zulassung war eine strategische Entscheidung des Konsortiums zur Anpassung an den Klimawandel.",
    },
    {
      question:
        "Was unterscheidet Corpinnat von der DO Cava?",
      options: [
        "Corpinnat erlaubt auch das Charmat-Verfahren",
        "Corpinnat ist eine private Qualitätsbezeichnung von neun Spitzenproduzenten, die 100 % Bio-Anbau, autochthone Sorten, Handlese und Herkunft aus dem Kern-Penedès verlangt",
        "Corpinnat ist eine Unterregion der DO Cava",
        "Corpinnat erlaubt internationale Rebsorten wie Chardonnay",
      ],
      correct: 1,
      explanation:
        "Corpinnat wurde 2019 von neun renommierten Produzenten gegründet, die die DO Cava verließen. Die Anforderungen (Bio-Pflicht, autochthone Sorten, Handlese, Kerngebiet Penedès) sind strenger als die DO-Cava-Regeln.",
    },
    {
      question:
        "Beim Charmat-Lungo-Verfahren lagert der Wein 6–9 Monate auf der Feinhefe im Tank. Welchen Effekt hat dies im Vergleich zum kurzen Charmat?",
      options: [
        "Höherer Alkoholgehalt",
        "Partielle Autolyse, die zusätzliche Komplexität verleiht, ohne die sortentypische Frucht vollständig zu überlagern",
        "Intensivere Farbe",
        "Mehr Kohlensäuredruck",
      ],
      correct: 1,
      explanation:
        "Charmat Lungo (6–9 Monate Hefelagerung im Tank) ermöglicht partielle Autolyse — der Wein gewinnt Komplexität (Brioche-Noten), behält aber die sortentypische Frucht, die das Charmat-Verfahren auszeichnet.",
    },
    {
      question:
        "Ein Schaumwein ist als 'Extra Dry' etikettiert. Wie viel Restzucker enthält er?",
      options: [
        "0–3 g/l — praktisch zuckerfrei",
        "0–6 g/l",
        "12–17 g/l — merklich süßer als Brut, trotz des Namens",
        "32–50 g/l",
      ],
      correct: 2,
      explanation:
        "Extra Dry (Extra Sec) enthält 12–17 g/l Restzucker — deutlich mehr als Brut (0–12 g/l). Die Bezeichnung ist irreführend und ein häufiger Irrtum bei Konsumenten. Bei Prosecco ist Extra Dry die meistverkaufte Kategorie.",
    },
    {
      question:
        "Warum ist die Magnum-Flasche (1,5 l) die ideale Reifegröße für Champagner?",
      options: [
        "Weil sie den niedrigsten Preis pro Liter hat",
        "Weil sie die Standard-Flaschengröße für Prestige-Cuvées ist",
        "Weil das Verhältnis von Weinvolumen zu Sauerstoff im Flaschenhals optimal ist, was langsamere, harmonischere Reifung ermöglicht",
        "Weil sie die einzige Flasche ist, in der die Zweitgärung stattfindet",
      ],
      correct: 2,
      explanation:
        "Die Magnum bietet das optimale Verhältnis von Weinvolumen zu Sauerstoff im Flaschenhals. Der Wein reift langsamer und harmonischer als in der Standardflasche (0,75 l) oder in Großflaschen.",
    },
    {
      question:
        "Was ist 'goût de lumière' und wie kann er vermieden werden?",
      options: [
        "Ein erwünschtes Aroma gereifter Champagner",
        "Schwefelverbindungen, die durch UV-Lichteinwirkung entstehen — vermeidbar durch dunkle Flaschen und lichtgeschützte Lagerung",
        "Ein Fehler, der durch zu hohe Dosage entsteht",
        "Der Geschmack von Champagner nach dem Dégorgement",
      ],
      correct: 1,
      explanation:
        "Goût de lumière (Lichtgeschmack) entsteht, wenn UV-Licht Schwefelverbindungen im Wein erzeugt. Dunkle Flaschen und lichtgeschützte Lagerung sind die wichtigsten Präventionsmaßnahmen.",
    },
    {
      question:
        "Welche drei Faktoren treiben den Trend zu englischem Schaumwein?",
      options: [
        "Niedrige Grundstückspreise, EU-Subventionen und Marketing",
        "Geologisch identische Kreideböden wie in der Champagne, verbesserte Klimabedingungen durch Erderwärmung und Investitionen von Champagnerhäusern (Taittinger, Pommery)",
        "Historische Tradition seit dem Mittelalter, günstigere Arbeitskräfte und Brexit-Vorteile",
        "Nähe zum Londoner Markt, touristische Attraktivität und staatliche Förderung",
      ],
      correct: 1,
      explanation:
        "Englands Aufstieg basiert auf drei Säulen: identische Kreideböden wie in der Champagne, verbesserte klimatische Bedingungen durch die Erderwärmung und Investitionen renommierter Champagnerhäuser wie Taittinger (Domaine Evremond) und Pommery.",
    },
  ],
};
