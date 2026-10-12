export type QuizQuestion = {
  question: string;
  options: string[];
  correct: number; // index of correct answer
  explanation: string;
};

export type Lesson = {
  title: string;
  content: string;
  quiz: QuizQuestion[];
};

export type Course = {
  slug: string;
  title: string;
  icon: string;
  image?: string;
  description: string;
  color: string;
  difficulty: "Einsteiger" | "Fortgeschritten" | "Experte";
  duration: string;
  lessons: Lesson[];
  finalExam: QuizQuestion[];
};

import { bierKurs } from "./akademie-bier";
import { whiskyKurs } from "./akademie-whisky";
import { mineralwasserKurs } from "./akademie-mineralwasser";
import { saftKurs } from "./akademie-saft";
import { likoereKurs } from "./akademie-likoere";
import { schaumweinKurs } from "./akademie-schaumwein";

export const courses: Course[] = [
  bierKurs,
  whiskyKurs,
  mineralwasserKurs,
  saftKurs,
  // WEINWISSEN — Wein-Grundlagen (25 Lektionen)
  // ═══════════════════════════════════════════════════════════
  {
    slug: "wein",
    title: "Weinwissen",
    icon: "🍷",
    image: "/images/akademie/wein.png",
    description: "Rebsorten, Terroir, Vinifikation, Sensorik und Grundlagen für Auswahl, Lagerung und passende Speisen.",
    color: "from-purple-600 to-purple-900",
    difficulty: "Fortgeschritten",
    duration: "ca. 50 Min.",
    lessons: [
      // Lektion 1
      {
        title: "Was ist Wein? Grundlagen der Vinifikation",
        content: `**Wein** ist ein alkoholisches Getränk, das durch die vollständige oder teilweise Vergärung von frischem Traubenmost entsteht. Die EU-Verordnung 1308/2013 definiert Wein als Erzeugnis aus frischen Weintrauben oder Traubenmost. Zugelassene Rebsorten können auch Kreuzungen von *Vitis vinifera* mit anderen Arten der Gattung *Vitis* sein. Für Wein gelten grundsätzlich mindestens 8,5 % Vol. aus den Weinbauzonen A und B und 9 % Vol. aus den übrigen Zonen; für Wein mit geschützter Herkunft bestehen Ausnahmen. Eine pauschale 5-%-Ausnahme für nördliche Prädikatsweine gibt es nicht.

**Die alkoholische Gärung** ist der zentrale Prozess: Hefen der Gattung *Saccharomyces cerevisiae* wandeln Traubenzucker (Glucose und Fructose) in Ethanol und Kohlendioxid um. Die vereinfachte Gay-Lussac-Gleichung lautet: C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂. Dabei entstehen auch Ester, höhere Alkohole, Aldehyde und Glycerin, die das sensorische Profil beeinflussen. **Oechsle** misst die Mostdichte, nicht direkt den Alkohol. Der mögliche Alkoholgehalt wird mit einer Umrechnungstabelle geschätzt; die tatsächliche Gärung und verbleibender Restzucker verändern das Ergebnis. Eine lineare Umrechnung von 0,6 % Vol. je Grad Oechsle ist falsch.

**Weintypen im Überblick**: **Stillwein** (ohne deutliche Perlage), **Perlwein** (1–2,5 bar Überdruck bei 20°C), **Schaumwein** (mindestens 3 bar; Qualitätsschaumwein grundsätzlich mindestens 3,5 bar bei 20°C), **Likörwein** (aufgespritet, 15–22 % Vol., z. B. Port, Sherry, Madeira, Marsala), **Dessertwein/edelsüßer Wein** (hoher Restzucker durch Botrytis, Trocknung oder Eiswein-Verfahren). Die Farbe bestimmt die Grundkategorie: **Weißwein** (aus hellen und teils roten Trauben ohne Maischekontakt), **Rotwein** (aus roten Trauben mit Maischegärung), **Roséwein** (kurzer Schalenkontakt oder Saignée-Methode). Daneben gibt es **Orange Wine** (Weißwein mit verlängertem Schalenkontakt) als zunehmend populäre vierte Farbkategorie.

**Restzucker und Geschmacksbezeichnungen**: **Trocken** (bis 4 g/l oder bis 9 g/l, wenn der Zucker die Gesamtsäure um höchstens 2 g/l übersteigt), **Halbtrocken** (oberhalb der Trocken-Grenze bis 12 g/l oder bis 18 g/l, wenn der Zucker die Säure um höchstens 10 g/l übersteigt), **Lieblich** (oberhalb der Halbtrocken-Grenze bis 45 g/l), **Süß** (mehr als 45 g/l). **Feinherb** ist rechtlich nicht als fester Zuckerbereich definiert. Für Schaumwein gelten andere Grenzen: Brut Nature (unter 3 g/l und ohne Zuckerzusatz nach der zweiten Gärung), Extra Brut (0–6 g/l), Brut (<12 g/l), Extra Dry/Extra Sec (12–17 g/l), Sec (17–32 g/l), Demi-Sec (32–50 g/l), Doux (>50 g/l). Beachte: "Extra Dry" Champagner ist also keineswegs trocken — ein häufiger Irrtum.`,
        quiz: [
          { question: "Welche grundsätzlichen Mindestalkoholwerte gelten für Wein ohne geschützte Herkunft in den EU-Weinbauzonen?", options: ["5,0 % Vol.", "8,5 % Vol. in den Zonen A und B; 9 % Vol. in den übrigen Zonen", "10,0 % Vol.", "12,0 % Vol."], correct: 1, explanation: "Anhang VII Teil II der Verordnung 1308/2013 unterscheidet 8,5 % Vol. für die Zonen A und B und 9 % Vol. für die übrigen Zonen. Für Wein mit geschützter Herkunft bestehen gesonderte Ausnahmen." },
          { question: "Was entsteht NEBEN Ethanol bei der alkoholischen Gärung als Hauptprodukt?", options: ["Milchsäure", "Kohlendioxid (CO₂)", "Essigsäure", "Tannin"], correct: 1, explanation: "Die Gay-Lussac-Gleichung zeigt: Glucose wird zu Ethanol UND CO₂ umgewandelt. Das CO₂ entweicht bei Stillwein, wird aber bei Schaumwein gezielt in der Flasche gehalten." },
          { question: "Wie viel Restzucker darf ein trockener Wein maximal enthalten?", options: ["0 g/l — absolut zuckerfrei", "Bis zu 4 g/l", "Bis zu 9 g/l (wenn die Säure maximal 2 g/l darunter liegt)", "Bis zu 18 g/l"], correct: 2, explanation: "Trocken bedeutet max. 9 g/l Restzucker, wobei der Zuckergehalt die Gesamtsäure um höchstens 2 g/l übersteigen darf. Ein Wein mit 7 g/l Restzucker und 6 g/l Säure gilt als trocken." }
        ]
      },
      // Lektion 2
      {
        title: "Die wichtigsten weißen Rebsorten",
        content: `**Riesling** — König der deutschen Weißweine und eine der edelsten Rebsorten weltweit. Aromenspektrum: Pfirsich, Aprikose, Limette, grüner Apfel, Mineralität; im Alter entwickelt sich das charakteristische Petrol-Aroma (TDN — Trimethyldihydronaphthalin). Riesling besitzt eine brillante Säurestruktur und kann von knochentrocken bis edelsüß (Trockenbeerenauslese) vinifiziert werden. Spitzenweine reifen 20–50+ Jahre. Hauptregionen: Mosel (Schiefermineralik, Steillagen bis 65° Neigung), Rheingau (Spätlese-Tradition, Kloster Eberbach), Pfalz (wärmer, opulenter), Alsace/Elsass (Grand-Cru-System), Wachau (Federspiel, Smaragd), Clare Valley und Eden Valley (Australien).

**Chardonnay** — Eine weltweit verbreitete weiße Rebsorte mit sehr unterschiedlichen Ausbaustilen. Von sich aus eher neutral im Aroma, nimmt Chardonnay den Charakter des Ausbaus an: **Edelstahl/Beton**: Frisch, Zitrus, grüner Apfel (Chablis, Mâconnais). **Barrique/Eichenfass**: Butter, Vanille, Toast, Brioche (Meursault, Napa Valley). Die **malolaktische Gärung (MLF)** wandelt scharfe Apfelsäure in weichere Milchsäure um und gibt Cremigkeit. In Burgund erzeugt die Kombination von Kalksteinboden, kühlem Klima und Fassausbau die komplexesten Chardonnays der Welt: Montrachet, Corton-Charlemagne, Puligny-Montrachet.

**Sauvignon Blanc** — Intensiv aromatisch mit grünen, grasigen und tropischen Noten: Stachelbeere, Grapefruit, Passionsfrucht, Holunderblüte, frisch geschnittenes Gras. Der Aromastoff 4-Mercapto-4-methylpentan-2-on (4-MMP) ist verantwortlich für die typische Buchsbaumcharakteristik. **Loire** (Sancerre, Pouilly-Fumé): Mineralisch, feuersteinartig, elegant. **Neuseeland** (Marlborough): Explosiv tropisch-fruchtig. **Steiermark**: Pfeffrig-frisch. **Bordeaux** (Pessac-Léognan): Oft mit Sémillon assembliert und im Fass ausgebaut.

**Grauburgunder/Pinot Grigio/Pinot Gris** — Eine Rebsorte, drei Stile: **Pinot Grigio** (Italien): Schlank, leicht, frisch, als Aperitif. **Grauburgunder** (Deutschland/Baden): Voller, cremiger, nussiger, mit dezenter Rauchnote. **Pinot Gris** (Elsass): Opulent, manchmal restsüß, mit exotischer Frucht.

**Gewürztraminer** — Unverkennbar: Rosenblüte, Lychee, Marzipan, exotische Gewürze, Muskat. Niedrige Säure, aber intensive Aromatik. Hochburgen: Pfalz, Elsass, Südtirol (Tramin — Namensherkunft!). Perfekt zu asiatischer Küche, Foie Gras und Münsterkäse. **Silvaner** — Fränkische Spezialität, oft unterschätzt: Dezente Frucht, erdige Mineralität, Kräuternoten. Passt wie kaum eine andere Rebsorte zu Spargel. **Grüner Veltliner** — Österreichs Flaggschiff: Pfeffrig, würzig, mit weißer Frucht und Tabak bei gereiften Exemplaren aus der Wachau.`,
        quiz: [
          { question: "Was verursacht das Petrol-Aroma bei gereiftem Riesling?", options: ["Oxidation durch fehlerhafte Lagerung", "Trimethyldihydronaphthalin (TDN) — ein Alterungsprodukt", "Schwefelbehandlung im Keller", "Botrytis-Befall der Trauben"], correct: 1, explanation: "TDN entsteht aus Carotinoiden in der Traubenschale während der Flaschenreifung. Es ist kein Fehler, sondern ein geschätztes Reifemerkmal von Riesling." },
          { question: "Was macht Chardonnay zum 'Chamäleon' unter den Rebsorten?", options: ["Er wechselt die Farbe", "Er ist aromatisch neutral und nimmt den Charakter des Ausbaus an (Edelstahl vs. Barrique)", "Er kann rot und weiß vinifiziert werden", "Er wächst in jedem Klima gleich"], correct: 1, explanation: "Chardonnay hat von Natur aus ein eher neutrales Aromaprofil und spiegelt daher den Ausbau besonders stark wider: Im Edelstahl frisch und zitrusartig, im Barrique butterig und vanillig." },
          { question: "Welcher Aromastoff prägt den typischen 'Buchsbaum'-Charakter von Sauvignon Blanc?", options: ["Isoamylacetat", "4-Mercapto-4-methylpentan-2-on (4-MMP)", "Trimethyldihydronaphthalin (TDN)", "Rotundon"], correct: 1, explanation: "4-MMP ist ein flüchtiges Thiol, das bereits in winzigen Konzentrationen (Nanogramm/Liter) den typischen Buchsbaum- und Katzenurin-Charakter von Sauvignon Blanc auslöst." }
        ]
      },
      // Lektion 3
      {
        title: "Die wichtigsten roten Rebsorten",
        content: `**Pinot Noir / Spätburgunder** — Die kapriziöse Diva unter den roten Rebsorten. Dünnschalig, frostempfindlich, anfällig für Botrytis und Mutationen. Doch wenn sie gelingt, erzeugt sie unvergleichlich elegante, vielschichtige Weine. Aromen: Erdbeere, Himbeere, Kirsche, Veilchen, im Alter Waldboden, Trüffel, Leder, Unterholz. **Burgund** ist der Maßstab — die Grands Crus von Vosne-Romanée, Chambertin und Musigny sind Legende. Domaine de la Romanée-Conti (DRC) produziert den teuersten Pinot Noir der Welt von einer nur 1,8 ha großen Monopollage. **Deutschland**: Die Ahr (kleinste, steilste Lagen), Baden (Kaiserstuhl — vulkanischer Löss), Pfalz (wärmer, opulenter) und Rheingau erzeugen zunehmend burgundisch anmutende Weine. **Oregon** (Willamette Valley): Kühles Klima, eleganter Stil. **Neuseeland** (Central Otago): Fruchtiger, offener, würziger.

**Cabernet Sauvignon** — Der König der roten Rebsorten, natürliche Kreuzung aus Cabernet Franc × Sauvignon Blanc (1997 per DNA-Analyse bestätigt). Dickschalig, tanninreich, mit enormem Reifepotenzial (50+ Jahre bei Spitzenweinen). Aromen: Cassis, schwarze Johannisbeere, Zeder, Graphit, Bleistift, Tabak, Minze, Eukalyptus. **Bordeaux** (linkes Ufer — Médoc, Pauillac, Saint-Julien, Margaux): Häufig im Verschnitt mit Merlot, Cabernet Franc oder Petit Verdot. **Napa Valley**: Opulent, konzentriert, oft sortenrein. **Chile** (Maipo, Colchagua): Hervorragendes Preis-Leistungs-Verhältnis. **Coonawarra** (Australien): Minze und Eukalyptus auf Terra Rossa.

**Merlot** — Weicher, zugänglicher, früher trinkreif als Cabernet Sauvignon. Pflaume, Kirsche, Schokolade, Veilchen, Kräuter. **Bordeaux rechtes Ufer** (Pomerol, Saint-Émilion): Hier ist Merlot die Hauptrebsorte. Château Pétrus (100 % Merlot auf blauem Ton) und Château Le Pin gehören zu den teuersten Weinen der Welt. Der Film "Sideways" (2004) machte die Diskussion über Merlot und Pinot Noir populär; daraus lässt sich keine feste weltweite Verkaufswirkung ableiten.

**Nebbiolo** — Piemonts große Traube, benannt nach der Nebbia (Nebel) im Herbst. Extrem tanninreich, hohe Säure, helle Farbe trotz massiver Struktur. **Barolo** ("König der Weine"): Mindestens 38 Monate Reifung, davon 18 im Holz. **Barbaresco**: Etwas eleganter, mindestens 26 Monate Reifung. Aromen: Teer, Rosen, Kirschen, Trüffel, Lakritz, Veilchen.

**Sangiovese** — Italiens am meisten angebaute Rebsorte. Hohe Säure, mittlere Tannine, Kirsche, Pflaume, Tomatenblatt, Kräuter, Leder. **Chianti Classico** (Toskana): 80–100 % Sangiovese. **Brunello di Montalcino**: 100 % Sangiovese Grosso, mind. 5 Jahre Reifung. **Vino Nobile di Montepulciano**: Sangiovese hier als "Prugnolo Gentile" bekannt. **Tempranillo** — Spaniens Edeltraube. In Rioja: Vanille, Leder, Kirschen (durch amerikanische Eiche). Ribera del Duero (dort "Tinto Fino"): Kräftiger, dunkler.`,
        quiz: [
          { question: "Aus welcher Kreuzung ist Cabernet Sauvignon entstanden?", options: ["Pinot Noir × Syrah", "Cabernet Franc × Sauvignon Blanc", "Merlot × Malbec", "Grenache × Mourvèdre"], correct: 1, explanation: "1997 wiesen Carole Meredith und Kollegen per DNA-Analyse nach, dass Cabernet Sauvignon eine natürliche Kreuzung aus Cabernet Franc und Sauvignon Blanc ist." },
          { question: "Welche Rebsorte wird in Barolo verwendet?", options: ["Sangiovese", "Barbera", "Nebbiolo", "Dolcetto"], correct: 2, explanation: "Barolo muss zu 100 % aus Nebbiolo bestehen. Trotz seiner hellen Farbe bringt Nebbiolo enorme Tannine und Säure mit und braucht Jahre der Reifung." },
          { question: "Was war der 'Sideways-Effekt'?", options: ["Ein neues Weinherstellungsverfahren", "Der Film ließ Merlot-Absätze sinken und Pinot Noir boomen", "Eine Methode der Fassreifung", "Ein Erdbeben in Napa Valley"], correct: 1, explanation: "Im Film 'Sideways' wird Merlot abgelehnt und Pinot Noir hervorgehoben. Verkaufszahlen hängen vom untersuchten Zeitraum und Markt ab; die Lektion nennt deshalb keine pauschale Prozentwirkung." }
        ]
      },
      // Lektion 4
      {
        title: "Terroir — Boden, Klima, Mensch",
        content: `**Terroir** ist das französische Konzept, das alle natürlichen und menschlichen Faktoren zusammenfasst, die einem Wein seinen einzigartigen, unverwechselbaren Charakter verleihen. Es ist der fundamentale Grund, warum ein Riesling von der Mosel anders schmeckt als ein Riesling aus dem Clare Valley — obwohl die gleiche Rebsorte verwendet wird. Die vier Säulen des Terroirs sind: **Boden (Sol)**, **Klima (Climat)**, **Topografie** und **Mensch (Vigneron)**.

**Boden (Sol)** — Das Fundament. Die Geologie prägt den Wein durch Mineralstoffversorgung, Wasserhaushalt und Wärmespeicherung. **Schiefer** (Mosel, Douro): Speichert Wärme am Tag und gibt sie nachts ab, mineralische Weine mit Feuerstein-Noten. **Kalkstein/Kreide** (Champagne, Burgund, Chablis): Gute Drainage, elegant-mineralische Weine mit straffer Säure. **Granit** (Beaujolais Crus, Nordrhône): Nährstoffarme, gut drainierte Böden, kraftvolle Weine. **Löss/Lehm** (Pfalz, Kaiserstuhl, Pomerol): Fruchtbare, wasserhaltige Böden, opulentere Weine. **Vulkanboden** (Ätna, Santorini, Pico/Azoren): Mineralreich, einzigartige Weine. **Terra Rossa** (Coonawarra): Roter Kalkstein-Lehm, ideal für Cabernet Sauvignon. **Kies/Graves** (Bordeaux Médoc): Hervorragende Drainage und Wärmereflexion.

**Klima** — **Makroklima** (Region): Bestimmt die Grundeignung. Cool Climate (Mosel, Burgund, Champagne): Hohe Säure, niedrigerer Alkohol, Eleganz. Warm Climate (Barossa, Napa, Maipo): Mehr Zucker/Alkohol, reife Frucht, Opulenz. **Mesokima** (Weinberg): Höhenlage (pro 100 m ca. 0,6°C kühler), Hangneigung (Südhang = mehr Sonne), Nähe zu Gewässern (Temperaturpuffer). **Mikroklima** (einzelne Rebe): Laubwandmanagement beeinflusst Belichtung und Belüftung direkt. Die **Winkler-Skala** (Gradtagsumme) klassifiziert Regionen nach Wärmesumme: Region I (kühl, <1390 Gradtage: Champagne, Mosel) bis Region V (heiß, >2220 Gradtage: Central Valley, Süditalien).

**Topografie** — Höhenlage, Ausrichtung, Hangneigung und Exposition bestimmen Sonneneinstrahlung und Abfluss. An der Mosel arbeiten Winzer auf Steillagen mit bis zu 65° Neigung — nur Handarbeit ist möglich. In Barossa Valley sind die besten alten Reben (pre-phylloxera, 150+ Jahre alt) auf flachen, kargen Böden.

**Der Mensch (Vigneron)** — Erntezeitpunkt, Ertragsreduzierung (Green Harvest), Rebschnitt, biologischer vs. konventioneller Anbau, Fassausbau, Hefewahl — der Winzer formt das Rohmaterial, das die Natur liefert. Terroir ohne den Menschen ist nur Geologie.`,
        quiz: [
          { question: "Wie kann Schieferboden die Bedingungen für Reben beeinflussen?", options: ["Schiefer ist reich an Zucker", "Dunkler Schiefer kann Wärme speichern; Wasserhaushalt und Standort beeinflussen die Reben", "Schiefer macht den Boden besonders fruchtbar", "Schiefer enthält Alkohol"], correct: 1, explanation: "Böden beeinflussen Wasser-, Nährstoff- und Wärmeversorgung. Eine Feuerstein-Note ist eine sensorische Beschreibung, kein Nachweis, dass Gesteinsgeschmack direkt aus dem Boden in den Wein gelangt." },
          { question: "Was misst die Winkler-Skala?", options: ["Die Niederschlagsmenge", "Die Gradtagsumme (Wärmesumme) einer Weinbauregion", "Den Säuregehalt des Bodens", "Die Hangneigung eines Weinbergs"], correct: 1, explanation: "Die Winkler-Skala summiert die Tagestemperaturen über 10°C während der Vegetationsperiode und teilt Regionen in Zonen I (kühl) bis V (heiß) ein." },
          { question: "Was bedeutet 'Cool Climate' im Weinbau?", options: ["Der Wein wird kalt gelagert", "Kühleres Klima ergibt Weine mit höherer Säure, niedrigerem Alkohol und mehr Eleganz", "Die Trauben werden im Winter geerntet", "Es wird nur Weißwein produziert"], correct: 1, explanation: "Cool-Climate-Regionen wie Mosel, Champagne oder Burgund erzeugen Weine mit prägnanter Säure, moderatem Alkohol und finessenreicher Aromatik — im Gegensatz zu den opulenten Weinen warmer Klimazonen." }
        ]
      },
      // Lektion 5
      {
        title: "Weinbau: Vom Rebschnitt zur Lese",
        content: `**Der Jahreszyklus der Rebe** beginnt im Spätwinter mit dem **Rebschnitt** — der wichtigsten Arbeit im Weinberg. Durch den Schnitt bestimmt der Winzer die Ertragsmenge und damit die Qualität. Guyot-Erziehung (ein oder zwei Fruchtruten) ist in Frankreich und Deutschland verbreitet, Gobelet (Buscherziehung ohne Drahtrahmen) in Südfrankreich, Spanien und alten Barossa-Anlagen. Cordon-Erziehung eignet sich für mechanische Ernte.

**Vegetationsperiode** — **Austrieb** (März/April): Die Knospen schwellen und brechen auf. Spätfröste sind die größte Gefahr — 2017 verloren viele europäische Winzer bis zu 80 % ihrer Ernte durch Aprilfröste. Frostschutzmaßnahmen: Räuchern (Frostkerzen), Windmaschinen, Beregnung (paradox: Wasser gefriert und gibt Wärme ab). **Blüte** (Mai/Juni): Selbstbestäubung bei Vitis vinifera. Verrieseln (Blütenabwurf bei Kälte/Regen) und Durchrieseln (mangelhafte Befruchtung) können den Ertrag stark reduzieren. **Fruchtansatz und Wachstum** (Juni–August): Laubarbeit, Entblätterung (Belichtung der Traubenzone), Grünlese (Green Harvest — Entfernung überzähliger Trauben zur Ertragsreduzierung und Qualitätssteigerung). **Véraison** (Juli/August): Die Beeren beginnen sich zu verfärben — rote Sorten werden von grün zu blau/schwarz, weiße von grün zu goldgelb. Ab diesem Moment beginnt die Zuckereinlagerung.

**Die Lese (Ernte)** — Der Erntezeitpunkt ist DIE entscheidende Qualitätsfrage. Zu früh: Hohe Säure, unreife Tannine, grüne Aromen, wenig Zucker. Zu spät: Überreife, zu wenig Säure, alkoholisch, marmeladig. Der Winzer misst Zuckergehalt (Refraktometer: Oechsle, Brix, KMW), Säure, pH-Wert und verkostet die Beeren. **Maschinelle Lese**: Schnell, effizient, kostengünstig — aber weniger selektiv. Die Maschine schüttelt die Reben und fängt die fallenden Beeren auf. **Handlese**: Ermöglicht selektive Ernte und ist in bestimmten Herstellungsregeln vorgeschrieben. Qualitätswein darf jedoch nicht pauschal mit einer Pflicht zur Handlese gleichgesetzt werden. Bei Trockenbeerenauslese und Eiswein wird teils beerenweise selektiert.

**Pflanzenschutz** — **Echter Mehltau (Oidium)** und **Falscher Mehltau (Peronospora)**: Die beiden Hauptkrankheiten im Weinbau. **Reblaus (Phylloxera)**: 1860–1900 vernichtete sie fast den gesamten europäischen Weinbau. Lösung: Aufpfropfen europäischer Edelreben auf reblausresistente amerikanische Unterlagsreben. Nur wenige Regionen blieben verschont: Chile, Teile Australiens (Barossa — alte, wurzelechte Reben!), Santorini.`,
        quiz: [
          { question: "Was ist Véraison?", options: ["Der erste Rebschnitt im Jahr", "Der Farbumschlag der Beeren, ab dem die Zuckereinlagerung beginnt", "Die Ernte der Trauben", "Ein Weinfehler"], correct: 1, explanation: "Véraison ist der Moment, in dem die unreifen grünen Beeren beginnen, sich zu verfärben (rot bei Rotweinsorten, goldgelb bei Weißweinsorten). Ab hier steigt der Zuckergehalt rapide an." },
          { question: "Warum werden fast alle europäischen Reben auf amerikanische Unterlagsreben gepfropft?", options: ["Für besseren Geschmack", "Zum Schutz vor der Reblaus (Phylloxera), die europäische Wurzeln zerstört", "Wegen höherer Erträge", "Wegen des EU-Gesetzes"], correct: 1, explanation: "Die Reblaus (Phylloxera vastatrix) vernichtete ab 1860 fast alle europäischen Weinberge. Amerikanische Rebwurzeln sind resistent — durch Aufpfropfen (Veredelung) werden europäische Sorten geschützt." },
          { question: "Was bewirkt die Grünlese (Green Harvest)?", options: ["Die Trauben werden unreif geerntet", "Überzählige Trauben werden entfernt, um die Qualität der verbleibenden zu steigern", "Die Blätter werden grün gefärbt", "Der Wein wird früher abgefüllt"], correct: 1, explanation: "Bei der Grünlese werden im Sommer überzählige Traubenstände abgeschnitten. Die verbleibenden Trauben erhalten mehr Nährstoffe und reifen besser aus — weniger Ertrag, aber höhere Qualität." }
        ]
      },
      // Lektion 6
      {
        title: "Weißweinherstellung — Kellertechnik",
        content: `**Das Prinzip der Weißweinherstellung**: Die Trauben werden ZUERST gepresst und DANN wird der Saft (Most) vergoren — im Gegensatz zur Rotweinherstellung, bei der die Maische (Saft + Schalen) zusammen gärt. Durch die Trennung von Saft und Schalen vor der Gärung bleibt der Wein hell und frisch.

**Schritt 1: Lese und Transport** — Schnelligkeit ist entscheidend. Oxidation und unkontrollierte Gärung müssen vermieden werden. Kühlung der Trauben (Trockeneis, Nachtlese in warmen Klimazonen), SO₂-Zugabe zum Schutz vor Oxidation und Wildhefen. In Top-Betrieben: Selektionstisch zur Aussortierung beschädigter oder unreifer Beeren.

**Schritt 2: Entrappen und Pressen** — Die Trauben werden entrappt (Stielgerüst entfernt) und schonend gepresst. Pneumatische Pressen (Membranpressen) sind heute Standard — gleichmäßiger, schonender Druck. Der **Vorlauf** (erster, freilaufender Saft ohne Pressdruck) ist der feinste und wird oft separat vinifiziert. Der **Presssaft** (unter Druck gewonnen) ist herber und gerbstoffreicher.

**Schritt 3: Mostbehandlung** — **Entschleimung/Débourbage**: Der Most wird 12–24 Stunden kühl gelagert (4–8°C). Trubstoffe sinken ab und werden abgezogen. Alternativ: Flotation (Aufschäumen der Trubstoffe mit Gas), Zentrifuge oder Filtration. **Mostanreicherung (Chaptalisierung)**: In kühlen Jahrgängen darf Zucker zugesetzt werden, um den Alkoholgehalt zu erhöhen — maximal 1,5–3 % Vol. je nach Region. In Deutschland bei Prädikatsweinen VERBOTEN. **Entsäuerung**: In kalten Jahren kann Calciumcarbonat oder Kaliumbicarbonat zugesetzt werden. **Säuerung**: In warmen Klimazonen darf Weinsäure zugesetzt werden.

**Schritt 4: Gärung** — **Spontangärung** (mit natürlichen Hefen): Komplexer, risikoreicher, kann Wochen dauern. Typisch für Naturwein und traditionelle Betriebe. **Reinzuchthefen** (Saccharomyces cerevisiae): Kontrolliert, vorhersagbar, schneller (1–3 Wochen). Verschiedene Hefestämme betonen unterschiedliche Aromen. **Gärtemperatur**: 12–18°C für Weißwein (kühl = mehr Frucht und Frische, langsamer = aromatischer). **Gärbehälter**: Edelstahltank (reduktiv, fruchtbetont), Eichenfass/Barrique (oxidativ, komplex, Vanille, Toast), Beton-Ei (neutral, fördert natürliche Konvektion), Amphore/Tonkrug (uralte Technik, aktueller Trend).

**Schritt 5: Ausbau** — **Hefelager (Sur Lie)**: Der Wein bleibt auf der Feinhefe. Regelmäßiges Aufrühren (Bâtonnage) setzt Mannoproteide frei → Cremigkeit, Volumen, Hefenoten (Brioche). Typisch für Muscadet Sur Lie und Burgunder Chardonnay. **Biologischer Säureabbau (BSA/MLF)**: Optional bei Weißwein — macht ihn cremiger (Chardonnay), wird bei Riesling meist verhindert, um die Frische zu bewahren.`,
        quiz: [
          { question: "Was ist der fundamentale Unterschied zwischen Weiß- und Rotweinherstellung?", options: ["Die Farbe der Trauben", "Bei Weißwein wird der Most VOR der Gärung von den Schalen getrennt, bei Rotwein gären Saft und Schalen zusammen", "Weißwein wird kälter gelagert", "Rotwein enthält mehr Zucker"], correct: 1, explanation: "Der Schlüsselunterschied: Weißwein = Pressen vor der Gärung (nur Saft gärt). Rotwein = Maischegärung (Saft + Schalen gären zusammen) → Farbe, Tannin, Struktur." },
          { question: "Was ist Bâtonnage?", options: ["Ein Weinfehler", "Das Aufrühren der Feinhefe während des Hefelagers (Sur Lie), das Cremigkeit verleiht", "Eine Pressmethode", "Ein Rebschnitt-Verfahren"], correct: 1, explanation: "Bei der Bâtonnage wird die abgesunkene Feinhefe regelmäßig aufgerührt. Dadurch werden Mannoproteide freigesetzt, die dem Wein Cremigkeit, Volumen und Hefecharakter (Brioche, Nuss) verleihen." },
          { question: "Warum wird bei Riesling die malolaktische Gärung meist verhindert?", options: ["Weil sie giftige Stoffe erzeugt", "Weil sie die frische, prägnante Säure reduzieren würde, die für Riesling typisch ist", "Weil sie den Wein rot färbt", "Weil das Gesetz es verbietet"], correct: 1, explanation: "Die MLF wandelt scharfe Apfelsäure in mildere Milchsäure um. Bei Riesling ist die lebendige Säure ein Qualitätsmerkmal — die MLF würde diese Frische und Spannung nehmen." }
        ]
      },
      // Lektion 7
      {
        title: "Rotweinherstellung — Maischegärung und Extraktion",
        content: `**Das Prinzip der Rotweinherstellung**: Im Gegensatz zum Weißwein werden die roten Trauben ZUSAMMEN mit den Schalen vergoren — die sogenannte **Maischegärung**. Während der Gärung extrahiert der entstehende Alkohol aus den Beerenschalen **Anthocyane** (Farbpigmente), **Tannine** (Gerbstoffe) und **Aromastoffe**. Je länger der Schalenkontakt, desto mehr Farbe, Tannin und Extrakt enthält der Wein.

**Entrappen — ja oder nein?** — Moderne Winzer entrappen meist vollständig (Stielgerüst entfernt, nur Beeren in den Gärtank). Die Stiele enthalten grüne, herbe Tannine. **Ausnahme**: In Burgund verwenden manche Spitzenwinzer (z. B. Domaine de la Romanée-Conti, Domaine Leroy) einen Anteil ganzer Trauben mit Stielen — sogenannte **Whole-Cluster-Fermentation**. Die Stiele bringen bei perfekter Reife ("lignified stems") Würze, Kräuternoten und strukturgebende Tannine. In der Nordrhône (Syrah) und bei Beaujolais (Gamay) ist dies traditionell üblich.

**Kaltmazeration (Cold Soak)** — Vor der Gärung wird die Maische bei 5–10°C für 2–7 Tage kalt eingemaischt. Ohne Alkohol werden vor allem Farbpigmente und fruchtige Aromen extrahiert, aber weniger harte Tannine. Ergebnis: Farbintensivere, fruchtigere Weine. Populär in Neuseeland, Oregon und modern arbeitenden Betrieben weltweit.

**Gärung und Mazerationszeit** — Die Gärung bei Rotwein findet bei 25–30°C statt (wärmer als Weißwein, um die Extraktion zu fördern). Während der Gärung steigen die Schalen durch das CO₂ nach oben und bilden den **Tresterhut (Chapeau)**. Dieser muss regelmäßig mit dem Saft in Kontakt gebracht werden: **Pigeage** (Unterstoßen des Tresterhuts von oben — traditionell mit den Füßen, heute oft maschinell), **Remontage** (Umpumpen des Saftes von unten über den Tresterhut), **Délestage** (Abziehen des gesamten Saftes, kurzes Abtropfen des Tresters, Rückpumpen — schonende Extraktion). Die **Mazerationszeit** variiert stark: 5–7 Tage (leichte, fruchtige Weine: Beaujolais, einfacher Merlot), 10–14 Tage (mittlere Rotweine), 3–4 Wochen (Langmaischung für tanninreiche, langlebige Weine: Barolo, Bordeaux Grand Cru).

**Macération Carbonique (Kohlensäuremaischung)** — Ganze, ungequetschte Trauben werden in einen mit CO₂ gefüllten Tank gelegt. Eine intrazelluläre Gärung beginnt INNERHALB der Beere — ohne Hefe. Ergebnis: Fruchtige, weiche, tanninarme Weine mit typischen Aromen von Banane, Kirschbonbon, Bubble Gum. Klassisch: Beaujolais Nouveau. Auch in der Rioja (Joven-Weine) und zunehmend bei Naturwein-Produzenten beliebt.

**Pressen und Weiterverarbeitung** — Nach der Maischegärung wird der Tresterhut abgepresst. Der **Vorlaufwein** (ohne Druck abfließend) ist feiner, der **Presswein** tanninreicher und farbintensiver. Top-Produzenten verarbeiten beides separat und assemblieren erst später. Anschließend folgt fast immer die **malolaktische Gärung (BSA)** — bei Rotwein Standard, da sie den Wein weicher und geschmeidiger macht.`,
        quiz: [
          { question: "Was ist der Tresterhut (Chapeau) und warum muss er bearbeitet werden?", options: ["Ein Weinkorken", "Die während der Gärung aufsteigenden Schalen, die regelmäßig mit dem Saft in Kontakt gebracht werden müssen für Extraktion", "Ein Fass-Deckel", "Eine Weinpresse"], correct: 1, explanation: "Während der Maischegärung bildet das aufsteigende CO₂ eine Schicht aus Beerenschalen an der Oberfläche — den Tresterhut. Ohne regelmäßigen Kontakt mit dem Saft (Pigeage, Remontage) würde die Extraktion von Farbe und Tannin ungleichmäßig verlaufen." },
          { question: "Was ist Macération Carbonique?", options: ["Kohlensäure wird dem fertigen Wein zugesetzt", "Ganze Trauben gären unter CO₂-Atmosphäre intrazellulär — ohne Hefe — und erzeugen fruchtige, tanninarme Weine", "Der Wein wird mit Kohlensäure versetzt wie Sekt", "Die Trauben werden in Kohlensäure gewaschen"], correct: 1, explanation: "Bei der Macération Carbonique findet eine intrazelluläre Gärung innerhalb der intakten Beeren statt, ohne Hefezusatz. Ergebnis: Sehr fruchtig, weich, wenig Tannin — typisch für Beaujolais Nouveau." },
          { question: "Warum verwenden manche Burgunder-Winzer Whole-Cluster-Fermentation?", options: ["Um Kosten zu sparen", "Reife Stiele bringen Würze, Kräuternoten und strukturgebende Tannine", "Weil das Gesetz es vorschreibt", "Um den Alkoholgehalt zu senken"], correct: 1, explanation: "Bei perfekt ausgereiften, verholzten Stielen (lignified stems) bringt die Whole-Cluster-Fermentation würzige, kräuterige Noten und eine besondere Tanninstruktur, die Komplexität und Langlebigkeit fördern." }
        ]
      },
      // Lektion 8
      {
        title: "Roséwein und Orange Wine",
        content: `**Roséwein** ist weder ein "leichter Rotwein" noch ein "verdünnter Weißwein" — er ist eine eigenständige Weinkategorie mit spezifischen Herstellungsmethoden. Die blassrosa bis lachsfarbene Tönung entsteht durch kurzen Kontakt des Saftes mit roten Traubenschalen. In den letzten 20 Jahren hat Rosé eine Renaissance erlebt — Provence-Rosé ist zum globalen Lifestyle-Phänomen geworden.

**Methode 1: Direktpressung (Pressurage Direct)** — Die roten Trauben werden wie Weißweintrauben direkt gepresst, mit nur minimaler Mazerationszeit (0–6 Stunden). Der blasse, elegante Saft wird dann wie Weißwein vinifiziert. Ergebnis: Sehr helle, lachsfarbene, frische Rosés. Dies ist die Methode der **Provence** — Domaines Ott, Château Miraval (Brad Pitt), Whispering Angel haben diesen Stil weltweit populär gemacht. Typische Aromen: Erdbeere, rote Johannisbeere, Grapefruit, Kräuter der Provence.

**Methode 2: Saignée (Aderlass)** — Beim Ansatz einer Rotwein-Maische wird nach 6–24 Stunden ein Teil des Saftes "abgelassen" (saigner = bluten). Dieser abgezogene Saft wird separat vergoren. Ergebnis: Kräftigere, farbintensivere Rosés mit mehr Struktur. Nebeneffekt: Der verbleibende Rotwein wird konzentrierter (höheres Schalen-zu-Saft-Verhältnis). Tavel an der Rhône ist eine Rosé-Herkunft mit eigenen Herstellungsvorschriften; es darf nicht pauschal jeder Rosé einer einzelnen Methode gleichgesetzt werden.

**Methode 3: Verschnitt (Assemblage)** — Weißwein und Rotwein werden gemischt. Die EU-Regeln unterscheiden Produktkategorie und Herkunftsspezifikation: Ein Verschnitt von Weiß- und Rotwein darf nicht ohne Weiteres als Rosé-Stillwein ohne geschützte Herkunft hergestellt werden. Für Schaumwein und geschützte Herkünfte gelten eigene Regeln. **Rosé-Champagner** kann durch Assemblage von weißem und rotem Grundwein entstehen; Champagne ist nicht die einzige zulässige Schaumwein-Ausnahme.

**Orange Wine / Amber Wine / Skin-Contact White** — Die "vierte Farbe" des Weins. Weißweintrauben werden wie Rotwein behandelt: verlängerter Schalenkontakt (Mazeration) von Tagen bis Monaten, teils mit Stielgärung. Die Schalen geben Phenole, Tannine und goldorange Farbpigmente ab. Ursprung: Georgien, wo traditionell in **Qvevri** (Tonamphoren, in der Erde vergraben) Wein auf den Schalen vergoren wird — 2013 von der UNESCO in die Repräsentative Liste des immateriellen Kulturerbes aufgenommen. Orange Wine erlebt seit den 2000er Jahren ein Revival: Josko Gravner und Stanko Radikon im Friaul (Italien), slowenische Produzenten (Movia), österreichische Naturwein-Szene. Typische Aromen: Getrocknete Aprikose, Honig, Tee, Nuss, Kräuter, Orangenschale. Die Textur ist oft tanninhaltig und griffig — eine völlig neue Erfahrung für Weißweintrinker.

**Wichtig für die Beratung**: Rosé sollte jung getrunken werden (1–2 Jahre), Orange Wine kann dagegen wie Rotwein reifen (5–15 Jahre bei guten Produzenten). Rosé bei 8–10°C servieren, Orange Wine bei 12–14°C (wie leichter Rotwein).`,
        quiz: [
          { question: "Bei welchem dieser bekannten Schaumweine ist Rosé-Assemblage aus weißem und rotem Grundwein üblich?", options: ["Provence", "Rioja", "Champagne", "Toskana"], correct: 2, explanation: "Rosé-Champagner kann aus weißem und rotem Grundwein assembliert werden. Das ist keine EU-weit einzige Ausnahme; Produktkategorie und jeweilige Herkunftsregeln sind zu beachten." },
          { question: "Was ist ein Qvevri?", options: ["Ein georgischer Weinberg", "Ein in die Erde eingegrabenes Tongefäß für Gärung, Reifung und Lagerung von Wein", "Ein französischer Rosé-Stil", "Ein Weinfehler"], correct: 1, explanation: "Qvevri sind große Tonamphoren, die in Georgien bis zum Hals in die Erde eingegraben werden. Die Tradition der Qvevri-Weinbereitung wurde 2013 in die UNESCO-Liste des immateriellen Kulturerbes aufgenommen." },
          { question: "Was unterscheidet die Saignée-Methode von der Direktpressung bei Rosé?", options: ["Saignée verwendet nur weiße Trauben", "Bei Saignée wird Saft von einer Rotwein-Maische abgelassen (intensiver), bei Direktpressung werden die Trauben sofort gepresst (blasser)", "Saignée ist eine Methode für Schaumwein", "Es gibt keinen Unterschied"], correct: 1, explanation: "Saignée erzeugt kräftigere, strukturiertere Rosés, weil der Saft länger (6–24 h) mit den Schalen in Kontakt war. Direktpressung erzeugt blassere, elegantere Rosés mit weniger Mazerationszeit." }
        ]
      },
      // Lektion 9
      {
        title: "Frankreich: Bordeaux und Burgund",
        content: `**Bordeaux** — Ein bedeutendes französisches Gebiet für Weine mit geschützter Herkunft. Bordeaux ist untrennbar mit dem Konzept des **Assemblage** (Verschnitt mehrerer Rebsorten) verbunden. **Linkes Ufer (Rive Gauche)**: Médoc, Haut-Médoc, Pauillac, Saint-Julien, Margaux, Saint-Estèphe, Graves, Pessac-Léognan. Kiesige Böden (Graves = Kies), ideal für Cabernet Sauvignon. Die Weine sind tanninreich, strukturiert, langlebig. **Rechtes Ufer (Rive Droite)**: Pomerol, Saint-Émilion, Fronsac. Lehm- und Kalksteinböden, Merlot-dominiert (mit Cabernet Franc). Weicher, zugänglicher, fruchtiger.

**Die Klassifikation von 1855** — Zur Pariser Weltausstellung wurden die Châteaux des Médoc in fünf Klassen eingeteilt (Premiers Crus bis Cinquièmes Crus). Die fünf **Premiers Grands Crus Classés**: Château Lafite Rothschild, Château Latour, Château Margaux, Château Haut-Brion (einziger außerhalb des Médoc — Graves/Pessac-Léognan) und seit 1973 Château Mouton Rothschild (hochgestuft — der einzige Aufstieg in 170 Jahren). Diese Klassifikation gilt noch heute nahezu unverändert. Daneben: Die **Klassifikation von Saint-Émilion** (wird alle 10 Jahre überarbeitet), die **Crus Bourgeois** (qualitativ oft auf Niveau der Classés).

**Burgund (Bourgogne)** — Das genaue Gegenteil von Bordeaux in Philosophie und Struktur. Statt Assemblage: **sortenreine Weine** (Pinot Noir für Rot, Chardonnay für Weiß). Statt großer Château-Betriebe: **Kleinstparzellen (Climats)**. Das burgundische Klassifikationssystem ist eine Qualitätspyramide: **Bourgogne Régionale** (Basiswein aus ganz Burgund) → **Village** (Ortsweine: Gevrey-Chambertin, Meursault, Chablis) → **Premier Cru** (benannte Einzellagen innerhalb eines Ortes, ca. 10 % der Fläche) → **Grand Cru** (die Spitze: 33 Grand-Cru-Lagen, nur 1–2 % der Fläche). Die **Climats** von Burgund — das System der benannten Einzellagen — sind seit 2015 UNESCO-Weltkulturerbe.

**Côte d'Or** — Das Herzstück Burgunds, aufgeteilt in: **Côte de Nuits** (nördlich, Rotwein-dominiert): Gevrey-Chambertin, Morey-Saint-Denis, Chambolle-Musigny, Vougeot (Clos de Vougeot — 50 ha, 80+ Besitzer!), Vosne-Romanée (Romanée-Conti, La Tâche), Nuits-Saint-Georges. **Côte de Beaune** (südlich, Weißwein-dominiert): Pommard, Volnay (Rotwein), Meursault, Puligny-Montrachet, Chassagne-Montrachet (Weißwein). **Le Montrachet** ist eine bekannte Grand-Cru-Herkunft für Weißwein, keine objektive weltweite Qualitätsrangliste.

**Bordeaux vs. Burgund**: Bordeaux = Blend, große Güter, Marketing-Luxus, konsistenter Stil. Burgund = Einzellage, Kleinstwinzer, Terroir-Mystik, jahrgangsabhängiger.`,
        quiz: [
          { question: "Welches Château wurde 1973 als einziges in die Premiers Crus der 1855er-Klassifikation aufgenommen?", options: ["Château Latour", "Château Mouton Rothschild", "Château Pétrus", "Château Cheval Blanc"], correct: 1, explanation: "Château Mouton Rothschild wurde 1973 auf Betreiben von Baron Philippe de Rothschild vom Deuxième Cru zum Premier Cru hochgestuft — der einzige Aufstieg in der Geschichte der Klassifikation von 1855." },
          { question: "Was sind die 'Climats' von Burgund?", options: ["Eine Wetterstation", "Benannte Einzellagen, die seit 2015 UNESCO-Weltkulturerbe sind", "Ein Weinherstellungsverfahren", "Ein Rebsortensystem"], correct: 1, explanation: "Die Climats sind genau abgegrenzte, benannte Parzellen in Burgund, jede mit eigenem Terroir. Seit 2015 sind sie UNESCO-Weltkulturerbe und verkörpern das burgundische Terroir-Prinzip." },
          { question: "Was dominiert am linken Ufer in Bordeaux?", options: ["Merlot auf Lehm", "Cabernet Sauvignon auf Kiesböden", "Pinot Noir auf Kalkstein", "Chardonnay auf Kreide"], correct: 1, explanation: "Am linken Ufer (Médoc, Graves) dominiert Cabernet Sauvignon auf den kiesigen Böden (Graves = Kies). Die Drainage fördert konzentrierte, tanninreiche, langlebige Weine." }
        ]
      },
      // Lektion 10
      {
        title: "Frankreich: Rhône, Loire, Elsass, Champagne",
        content: `**Rhône** — Geteilt in Nord- und Südrhône, zwei völlig verschiedene Weinwelten. **Nordrhône**: Steil, terrassiert, Granit. Nur eine rote Rebsorte: **Syrah** — pfeffrig, fleischig, Veilchen, schwarze Olive. Spitzenappellationen: **Hermitage** (kraftvoll, langlebig, 50+ Jahre Potenzial), **Côte-Rôtie** (eleganter, mit bis zu 20 % Viognier im Blend!), **Cornas** (muskulös, dunkel), **Saint-Joseph** (zugänglicher). Weiß: Viognier (Condrieu — opulent, blumig), Marsanne, Roussanne. **Südrhône**: Flacher, Kieselsteine (Galets roulés), mediterranes Klima. Blends aus bis zu 18 Rebsorten, dominant **Grenache** (fruchtbetont, alkoholstark), mit Syrah und Mourvèdre (GSM-Blend). **Châteauneuf-du-Pape**: Bis zu 13 zugelassene Rebsorten (18 wenn man Farbvarianten zählt). **Gigondas**, **Vacqueyras** und die Côtes du Rhône Villages bieten oft enormes Preis-Leistungs-Verhältnis.

**Loire** — Frankreichs längster Fluss, 1.000 km Weinbau. **Pays Nantais** (Westlichster Teil): **Muscadet** (100 % Melon de Bourgogne, Sur Lie, perfekter Muschel-Begleiter). **Anjou-Saumur**: **Chenin Blanc** — von knochentrocken (Savennières) über halbsüß bis edelsüß (Quarts de Chaume, Bonnezeaux, Coteaux du Layon). Rosé d'Anjou und Cabernet d'Anjou. **Saumur-Champigny** (Cabernet Franc). **Touraine**: **Chinon**, **Bourgueil** und **Saint-Nicolas-de-Bourgueil** — alle Cabernet Franc, würzig-elegant. **Vouvray** (Chenin Blanc: trocken, halbtrocken, edelsüß, Schaumwein). **Centre Loire**: **Sancerre** und **Pouilly-Fumé** — Sauvignon Blanc mit Feuersteinmineralik auf Kimmeridgien-Kalkstein.

**Elsass (Alsace)** — Eine französische Region, in der Rebsortenangaben auf Etiketten besonders verbreitet sind. Einzigartige Lage: Geschützt durch die Vogesen (trockenste Region Frankreichs — Colmar hat nur 550 mm Niederschlag). Grands Crus (51 Lagen): Hauptsächlich Riesling, Gewürztraminer, Pinot Gris, Muscat. **Vendanges Tardives** (Spätlese) und **Sélection de Grains Nobles** (Beerenauslese) sind die Spitze.

**Champagne** — Nur Schaumwein aus der Champagne darf sich "Champagner" nennen (AOC, 34.000 ha). **Méthode Champenoise/Traditionnelle**: Grundwein → Tirage mit Zucker und Hefe → zweite Gärung IN DER FLASCHE → Reifung. Non-Vintage-Champagner bleibt mindestens 15 Monate ab Tirage im Keller, davon mindestens 12 auf der Hefe; Jahrgangschampagner mindestens 36 Monate. Die **Dosage** wird erst nach dem Degorgieren zugegeben. Rebsorten: **Pinot Noir** (Struktur, rote Frucht), **Chardonnay** (Eleganz, Zitrus, Alterungspotenzial), **Pinot Meunier** (Fruchtigkeit, Zugänglichkeit). **Blanc de Blancs** (ausschließlich weiße Trauben, meist Chardonnay), **Blanc de Noirs** (100 % Pinot Noir/Meunier), **Rosé** (Assemblage oder Saignée). Große Häuser: Moët, Veuve Clicquot, Dom Pérignon, Krug, Bollinger. Grower-Champagner (RM — Récoltant-Manipulant) von kleinen Winzern ist ein wachsender Trend.`,
        quiz: [
          { question: "Wie viele Rebsorten sind in Châteauneuf-du-Pape zugelassen?", options: ["5", "8", "Bis zu 13 (bzw. 18 mit Farbvarianten)", "Unbegrenzt"], correct: 2, explanation: "Châteauneuf-du-Pape erlaubt 13 Rebsorten (18 mit roten und weißen Varianten): Grenache, Syrah, Mourvèdre, Cinsault, Counoise, Vaccarèse, Terret Noir, Muscardin, Clairette, Bourboulenc, Roussanne, Picpoul, Picardan." },
          { question: "Was bedeutet 'Blanc de Blancs' bei Champagner?", options: ["Ein weißer Champagner aus roten Trauben", "Ausschließlich aus weißen Trauben, meist Chardonnay", "Ein besonders alter Champagner", "Ein Billig-Champagner"], correct: 1, explanation: "Blanc de Blancs bedeutet ausschließlich weiße Trauben. Meist ist es Chardonnay; auch andere in der Champagne zugelassene weiße Rebsorten können enthalten sein. Blanc de Noirs wird aus schwarzen Trauben bereitet." },
          { question: "Warum ist das Elsass die trockenste Region Frankreichs?", options: ["Weil es weit vom Meer entfernt ist", "Die Vogesen schirmen die Region vor atlantischen Regenfronten ab (Regenschatten)", "Wegen der hohen Temperaturen", "Wegen des sandigen Bodens"], correct: 1, explanation: "Die Vogesen bilden eine natürliche Barriere gegen die feuchten Westwinde. Colmar erhält nur 550 mm Niederschlag pro Jahr — weniger als Marseille. Das schafft ideale Bedingungen für aromatische Rebsorten." }
        ]
      },
      // Lektion 11
      {
        title: "Italien: Toskana, Piemont, Venetien",
        content: `**Italien** besitzt zahlreiche regionale Herkunftsbezeichnungen und Rebsorten. **Vino** bezeichnet Wein ohne geschützte Herkunft; **IGP/IGT** steht für eine geschützte geografische Angabe, **DOP/DOC** und **DOCG** für geschützte Ursprungsbezeichnungen mit eigenen Vorschriften. **Super Tuscans** ist kein einheitlicher gesetzlicher Rang: Der Begriff bezeichnet bekannte toskanische Weine, die sich teilweise außerhalb früherer regionaler Vorgaben entwickelten. Ihre heutige rechtliche Kategorie muss am konkreten Wein geprüft werden; Sassicaia hat beispielsweise die eigene DOC Bolgheri Sassicaia.

**Toskana** — **Chianti** (DOCG) und **Chianti Classico** (DOCG) sind getrennte Herkunftsbezeichnungen mit eigenen Regeln; Chianti Classico Annata und Riserva enthalten mindestens 80 % Sangiovese, Gran Selezione mindestens 90 %. **Chianti Classico** (das historische Kerngebiet zwischen Florenz und Siena, Gallo Nero als Symbol). Abstufungen: Chianti Classico → Riserva → Gran Selezione (seit 2014, besondere geregelte Kategorie). **Brunello di Montalcino** (DOCG): 100 % Sangiovese Grosso, Freigabe ab 1. Januar des fünften Jahres nach der Ernte, Riserva ein Jahr später. Beide mindestens 2 Jahre in Eiche, dazu mindestens 4 Monate Flaschenreife bzw. 6 Monate bei Riserva. Die Lagerfähigkeit hängt von Jahrgang, Erzeuger und Aufbewahrung ab. **Vino Nobile di Montepulciano**: Sangiovese (hier "Prugnolo Gentile"), mindestens 70 %. **Bolgheri**: Heimat der Super Tuscans — Bordeaux-Rebsorten am Tyrrhenischen Meer. Sassicaia (Cabernet Sauvignon/Franc) hat seine eigene DOC: Bolgheri Sassicaia.

**Piemont** — **Barolo** ("König der Weine, Wein der Könige"): 100 % Nebbiolo, DOCG. Mindestens 38 Monate Reifung, davon 18 im Holz (Riserva: 62 Monate). Elf Gemeinden, die wichtigsten: La Morra (eleganter), Barolo, Castiglione Falletto, Serralunga d'Alba (kräftiger, tanninreicher), Monforte d'Alba. **Barbaresco** (DOCG): Ebenfalls 100 % Nebbiolo, mindestens 26 Monate Reifung. Etwas eleganter als Barolo, dank etwas wärmerem Klima. Angelo Gaja revolutionierte Barbaresco mit Einzellagen und Barrique-Ausbau. **Barbera d'Asti** und **Barbera d'Alba**: Hohe Säure, dunkle Frucht, weniger Tannin als Nebbiolo. **Moscato d'Asti** (DOCG): Süß, perlend, niedrig im Alkohol (5,5 %), Muskattraube.

**Venetien** — **Amarone della Valpolicella** (DOCG): Einzigartige Herstellungsmethode "Appassimento" — die Trauben (Corvina, Corvinone, Rondinella) werden 3–4 Monate auf Strohmatten oder in belüfteten Trocknungsräumen getrocknet. Wasserverlust von 30–40 % konzentriert Zucker, Säure und Aromen. Ergebnis: Mächtige, trockene Weine mit 14–17 % Vol. Aromen: Rosine, Kirschkompott, Schokolade, Tabak, Gewürze. **Ripasso**: "Baby-Amarone" — fertiger Valpolicella wird auf den Trester (Vinacce) des Amarone gegeben für eine zweite, kurze Gärung. **Soave** (Garganega): Eleganter Weißwein, oft unterschätzt.`,
        quiz: [
          { question: "Was ist das Appassimento-Verfahren?", options: ["Schnelle Pressung der Trauben", "Trocknung der Trauben über 3–4 Monate vor der Vinifikation, was Zucker und Aromen konzentriert", "Fermentation im Eichenfass", "Kaltmazeration für 1 Woche"], correct: 1, explanation: "Beim Appassimento werden die Trauben nach der Ernte 3–4 Monate auf Strohmatten oder in Trocknungsräumen getrocknet. Der Wasserverlust von 30–40 % konzentriert alle Inhaltsstoffe — Grundlage für Amarone." },
          { question: "Welche Rebsorte muss Barolo zu 100 % enthalten?", options: ["Sangiovese", "Barbera", "Nebbiolo", "Corvina"], correct: 2, explanation: "Barolo DOCG muss zu 100 % aus Nebbiolo bestehen. Trotz seiner hellen Farbe bringt Nebbiolo mächtige Tannine und Säure mit — Barolo braucht oft 10–20 Jahre Reifung." },
          { question: "Was war das Besondere an den Super Tuscans?", options: ["Sie waren besonders günstig", "Sie entwickelten sich teilweise außerhalb damaliger regionaler Rebsortenregeln; der Begriff ist kein eigener gesetzlicher Rang", "Sie waren alkoholfrei", "Sie waren rein aus Sangiovese"], correct: 1, explanation: "Super Tuscans bezeichnet keine einheitliche gesetzliche Kategorie. Manche Weine entwickelten sich außerhalb früherer regionaler Regeln; die aktuelle Herkunftsbezeichnung ist produktbezogen zu prüfen." }
        ]
      },
      // Lektion 12
      {
        title: "Spanien: Rioja, Ribera, Priorat, Sherry",
        content: `**Spanien** umfasst unterschiedliche Herkunftsbezeichnungen; **Tempranillo** ist eine wichtige rote Rebsorte mit regionalen Namen wie Tinto Fino, Tinta del País oder Tinta de Toro. Reifebegriffe sind nach **Herkunft und Weinfarbe** zu lesen, nicht als überall gleiche nationale Formel. In **Rioja** gilt: roter **Crianza** mindestens zwei Kalenderjahre, davon ein Jahr im Fass; weißer und Rosé-Crianza mindestens sechs Monate im Fass innerhalb der zweijährigen Reife. Rote **Reserva** verlangt mindestens drei Jahre, davon zwölf Monate Fass und sechs Monate Flasche; weiße und Rosé-Reserva mindestens zwei Jahre, davon sechs Monate Fass. Rote **Gran Reserva** verlangt mindestens fünf Jahre, davon 24 Monate Fass und 24 Monate Flasche. Weiße und Rosé-Gran Reserva verlangen mindestens vier Jahre, davon sechs Monate Fass.

**Rioja** (DOCa seit 1991) — Spaniens berühmteste Weinregion, dreigeteilt: **Rioja Alta** (kühler, höher gelegen, eleganter), **Rioja Alavesa** (im Baskenland, Kalkstein, feingliedriger), **Rioja Oriental** (ehem. Rioja Baja, wärmer, Garnacha-dominiert). Der klassische Rioja-Stil: Lange Reifung in **amerikanischer Eiche** (225-l-Barricas) → Vanille, Kokos, Dill, Leder, weiche Tannine. Moderner Stil: **Französische Eiche**, kürzer im Fass, mehr Frucht, konzentrierter. Seit 2017: **Viñedo Singular** (Einzellagen), eine Revolution im Rioja-Verständnis. Große Namen: López de Heredia, La Rioja Alta, CVNE, Muga, Roda, Artadi, Contador.

**Ribera del Duero** (DO) — Am Oberlauf des Duero (der in Portugal zum Douro wird). Extremes Kontinentalklima: Heiße Tage, kalte Nächte, 850 m Höhe. Tempranillo dominiert, erzeugt hier kräftigere, dunklere Weine als in Rioja. **Vega Sicilia** (gegründet 1864) ist Spaniens berühmtestes Weingut — der "Único" reift 10+ Jahre vor der Freigabe.

**Priorat** (DOCa) — Kleine, steile Region in Katalonien mit uralten Garnacha- und Cariñena-Reben auf **Llicorella**-Böden (zertrümmerter Schiefer). Die Weine sind extrem konzentriert, mineralisch, mächtig (14–16 % Vol.). In den 1990ern von der "Priorat-Gang" (Álvaro Palacios, René Barbier, Daphne Glorian u.a.) wiederentdeckt und zu Weltruhm geführt. L'Ermita von Álvaro Palacios ist ein bekanntes Erzeugerbeispiel, keine allgemeine Preisgarantie.

**Sherry** — Aus Jerez de la Frontera, einer der komplexesten und am meisten unterschätzten Weine der Welt. Wichtige Sorten sind **Palomino**, **Pedro Ximénez** und **Moscatel**; Herstellungsführung und Süße unterscheiden sich nach Stil. Das **Solera-System**: Fässer werden in Reihen gestapelt (Criaderas). Wein wird immer aus der untersten Reihe (Solera) abgezogen und durch Wein aus der darüberliegenden Criadera nachgefüllt — ein fortlaufendes System fraktionierter Mischung, das den Hausstil unterstützen kann. **Stile**: **Fino/Manzanilla** (unter Florhefen gereift: trocken, hell, Mandel, Hefe), **Amontillado** (erst biologisch, dann oxidativ: Nuss, Karamell), **Oloroso** (nur oxidativ: dunkel, nussig, komplex), **Palo Cortado** (selten, zwischen Amontillado und Oloroso), **Pedro Ximénez** (PX: sirupartig süß, Rosinen, Schokolade, Feigen).`,
        quiz: [
          { question: "Welche Mindestreife gilt für roten Rioja Gran Reserva?", options: ["Ein besonders günstiger Wein", "Mindestens 60 Monate insgesamt, davon mindestens 24 im Fass und 24 in der Flasche", "Ein Wein nur aus Gran-Cru-Lagen", "Ein Bio-zertifizierter Wein"], correct: 1, explanation: "Für roten Rioja Gran Reserva sind mindestens 60 Monate Gesamtreife vorgeschrieben, einschließlich mindestens 24 Monaten im Fass und 24 Monaten in der Flasche. Andere spanische Herkünfte und Weinfarben haben eigene Vorgaben." },
          { question: "Was ist das Solera-System beim Sherry?", options: ["Eine Gärungsmethode", "Ein Schicht-System aus Fässern, bei dem kontinuierlich junger Wein durch ältere Stufen wandert — für Konsistenz und Komplexität", "Eine Flaschenlagerung", "Eine Klassifikation"], correct: 1, explanation: "Beim Solera-System wird Wein aus der untersten Fassreihe (Solera) entnommen und durch Wein aus der darüberliegenden Criadera nachgefüllt — eine fraktionierte Mischung, die zur Kontinuität des Stils beitragen kann, aber keine unveränderte Qualität garantiert." },
          { question: "Was ist Llicorella?", options: ["Eine spanische Rebsorte", "Zertrümmerter Schieferboden im Priorat, der extreme Konzentration der Weine fördert", "Ein Sherry-Stil", "Ein Weingut in Rioja"], correct: 1, explanation: "Llicorella ist der charakteristische Boden des Priorat: Plättchen aus zertrümmertem Schiefer, der Wärme speichert und die Reben zu tiefer Wurzelung zwingt — Grundlage für die legendär konzentrierten Priorat-Weine." }
        ]
      },
      // Lektion 13
      {
        title: "Deutschland: Riesling-Nation — Mosel, Rheingau, Pfalz",
        content: `**Deutschland** erzeugt überwiegend Weißwein; **Riesling** ist eine wichtige Sorte. Die deutschen Anbaugebiete weisen unterschiedliche Klima-, Boden- und Rebsortenbedingungen auf. Prägnante Säure, filigrane Frucht und moderate Alkoholwerte können kühler geprägte Stile kennzeichnen, gelten aber nicht automatisch für jede Flasche.

**Das deutsche Qualitätssystem** — Historisch basiert auf dem **Mostgewicht** (Zuckergehalt bei der Lese): **Deutscher Wein** (Tafelwein) → **Landwein** → **Qualitätswein** (bestimmter Anbaugebiete, darf chaptalisiert werden) → **Prädikatswein** (KEINE Anreicherung erlaubt): **Kabinett** (leicht, elegant, oft feinherb, 67–82° Oechsle je nach Region), **Spätlese** (spät gelesen, reifer, 76–95° Oechsle), **Auslese** (ausgelesene vollreife Trauben; unreife und kranke Beeren werden ausgesondert), **Beerenauslese (BA)** (edelfaule oder überreife Beeren; keine hier behauptete feste Restzuckergrenze), **Trockenbeerenauslese (TBA)** (weitgehend eingeschrumpfte, edelfaule Beeren; keine hier behauptete feste Restzuckergrenze), **Eiswein** (bei mind. -7°C am Stock gefrorene Trauben gepresst). Parallel: Das **VDP-Klassifikationssystem** (Verband Deutscher Prädikatsweingüter) orientiert sich am burgundischen Modell: **Gutswein** → **Ortswein** → **Erste Lage** → **Große Lage** (Grand Cru). VDP-Große-Lage-Weine tragen den stilisierten Adler und sind die Spitze deutscher Weinkultur.

**Mosel** — Zahlreiche sehr steile Weinlagen, Devonschiefer, kühles Klima. Filigrane, leichtfüßige Rieslinge mit betörender Mineralität und Säure. Ürziger Würzgarten, Wehlener Sonnenuhr, Bernkasteler Doctor, Scharzhofberg (Egon Müller). Typisch: Niedrige Alkoholwerte (7–9 % Vol. bei Kabinett), hohe Restsüße bei gleichzeitig straffer Säure (Süße-Säure-Spiel).

**Rheingau** — Steiler, wärmer als die Mosel. Hier wurde 1775 die Spätlese "erfunden" (Kloster Johannisberg — der Bote mit der Leseerlaubnis kam zu spät, die Trauben waren edelfaul). Etwas opulentere, vollere Rieslinge als an der Mosel. Spitzenlagen: Schloss Johannisberg, Rauenthaler Baiken, Rüdesheimer Berg Schlossberg. Auch hervorragender Spätburgunder (Assmannshausen).

**Pfalz** — Ein wichtiges Riesling-Anbaugebiet, wärmer als Mosel und Rheingau. Rieslinge hier sind opulenter, mit gelber Frucht (Pfirsich, Aprikose) und mehr Alkohol. Spitzenweingüter: Bürklin-Wolf, Von Winning, Christmann, Müller-Catoir, Knipser. Die Mittelhaardt mit Lagen wie Forster Kirchenstück und Deidesheimer Hohenmorgen ist das Herzstück.

**Weitere Regionen**: **Nahe** (vielseitig, Riesling zwischen Mosel und Rheingau), **Rheinhessen** (größte deutsche Region, Silvaner und Riesling), **Baden** (wärmste Region, Spätburgunder-Hochburg am Kaiserstuhl), **Ahr** (kleines, vom Rotwein geprägtes Gebiet, Steillagen-Spätburgunder), **Franken** (Silvaner im Bocksbeutel), **Württemberg** (unter anderem Trollinger und Lemberger; Rot- und Weißwein werden erzeugt), **Sachsen und Saale-Unstrut** (kleine ostdeutsche Gebiete).`,
        quiz: [
          { question: "Was unterscheidet Prädikatswein von Qualitätswein in Deutschland?", options: ["Prädikatswein hat einen schöneren Namen", "Prädikatswein darf NICHT chaptalisiert (angereichert) werden und wird nach Mostgewicht gestuft", "Qualitätswein ist besser", "Es gibt keinen Unterschied"], correct: 1, explanation: "Der entscheidende Unterschied: Qualitätswein darf chaptalisiert werden (Zuckerzugabe vor der Gärung), Prädikatswein NICHT. Die Prädikate (Kabinett bis TBA) basieren auf dem natürlichen Mostgewicht bei der Ernte." },
          { question: "Was war das Besondere an der 'Erfindung' der Spätlese 1775?", options: ["Ein neues Fass wurde erfunden", "Der Bote mit der Leseerlaubnis kam zu spät, die Trauben waren bereits edelfaul — und der Wein war sensationell", "Eine neue Rebsorte wurde entdeckt", "Der erste Eiswein wurde produziert"], correct: 1, explanation: "Im Kloster Johannisberg im Rheingau brauchte der reitende Bote mit der bischöflichen Leseerlaubnis zu lange. Als er eintraf, waren die Trauben überreif und edelfaul — der daraus gewonnene Wein war eine Offenbarung." },
          { question: "Was kennzeichnet das VDP-Große-Lage-System?", options: ["Es basiert auf der Rebsorte", "Es orientiert sich am burgundischen Modell und klassifiziert Weinberge nach Qualitätspyramide (Gutswein → Ortswein → Erste Lage → Große Lage)", "Es ist ein EU-System", "Es gilt nur für Rotwein"], correct: 1, explanation: "Das VDP-System klassifiziert Weinberge nach dem burgundischen Terroir-Prinzip: Die besten Lagen werden als 'Große Lage' eingestuft — das deutsche Äquivalent zum Grand Cru." }
        ]
      },
      // Lektion 14
      {
        title: "Neue Welt: USA, Australien, Chile, Argentinien, Südafrika",
        content: `**Neue Welt** ist ein gebräuchlicher Sammelbegriff, keine einheitliche rechtliche Herkunft oder Qualitätsstufe. Die folgenden Länderbeispiele zeigen unterschiedliche Sorten und Stile; sensorische Beschreibungen sind Orientierungshilfen, keine Garantie für jede Flasche.

**USA**: Kalifornien, Oregon und Washington sind wichtige Regionen mit unterschiedlichen Bedingungen. Beim **Judgment of Paris 1976** wurden kalifornische Weine in einer konkreten Blindverkostung ausgezeichnet; Montelenas 1973 Chardonnay gewann die Weißweingruppe. Das ist ein historisches Ergebnis, kein Beweis einer dauerhaften Überlegenheit sämtlicher US-Weine.

**Australien**: Wine Australia beschreibt **Barossa Valley** unter anderem mit Shiraz, Cabernet Sauvignon und Grenache sowie warmen Tal- und kühleren Höhenlagen. **Coonawarra** ist bekannt für Cabernet Sauvignon auf roter Terra-Rossa-Erde über Kalkstein. Andere Regionen wie Clare Valley, Eden Valley, Yarra Valley und Mornington Peninsula weisen eigene Bedingungen auf. Starre Alkohol-, Reb- oder Qualitäts-Weltrekorde werden daraus nicht abgeleitet.

**Chile**: **Carménère** wurde 1994 bei Viña Carmen vom Ampelographen Jean-Michel Boursiquot als zuvor mit Merlot verwechselte Sorte wiedererkannt. Chile besitzt viele wurzelechte Reben; eine einfache Landschaftsaufzählung ist aber kein allgemeiner Nachweis, dass Reblaus oder andere Schädlinge niemals eindringen könnten.

**Argentinien**: **Malbec** ist eine wichtige rote Sorte, besonders in Mendoza. **Torrontés** umfasst nach dem argentinischen Weinbauinstitut drei Sorten: riojano, sanjuanino und mendocino. Aromatische Beschreibungen wie Blüten oder Muskat beziehen sich auf Stil und Wahrnehmung, nicht auf eine garantierte Herkunft oder Höhenlage.

**Südafrika**: **Pinotage** entstand aus Pinot Noir und Cinsault; Abraham Izak Perold pflanzte 1925 die daraus gewonnenen Samen. Stellenbosch, Franschhoek, Swartland und kühlere Küstengebiete bieten verschiedene Stile. Eine Mischung mit Pinotage ist nicht automatisch eine staatlich festgelegte Cape-Blend-Kategorie mit zwingend derselben Hauptkomponente.

**Beratung**: Herkunft und Rebsorte helfen bei der Auswahl, ersetzen aber nicht Erzeugerangaben, aktuellen Jahrgang und eigenen Geschmack.`,
        quiz: [
          { question: "Was war das Judgment of Paris 1976?", options: ["Ein Rechtsstreit über Weinetiketten", "Eine konkrete Blindverkostung, bei der kalifornische Weine die Rot- und Weißweingruppe gewannen", "Ein Erdbeben in Pariser Weinbergen", "Eine neue EU-Weinverordnung"], correct: 1, explanation: "Bei dieser Blindverkostung gewannen kalifornische Weine die jeweiligen Gruppen. Montelena verweist auf den Erfolg seines 1973 Chardonnay; es ist kein allgemeines Qualitätsurteil für jede Herkunft." },
          { question: "Welche Sorte wurde 1994 bei Viña Carmen als zuvor mit Merlot verwechselt erkannt?", options: ["Riesling", "Carménère", "Pinotage", "Glera"], correct: 1, explanation: "Jean-Michel Boursiquot erkannte Carménère 1994 bei Viña Carmen wieder. Die Beobachtung korrigierte die vorherige Merlot-Zuordnung." },
          { question: "Was ist Pinotage?", options: ["Ein australischer Shiraz-Klon", "Eine 1925 in Stellenbosch gezüchtete Kreuzung aus Pinot Noir und Cinsault", "Ein chilenischer Merlot", "Ein argentinischer Malbec-Typ"], correct: 1, explanation: "Pinotage wurde 1925 von Abraham Izak Perold in Stellenbosch aus Pinot Noir × Cinsault gekreuzt. Sie ist Südafrikas Signature-Rebsorte und erzeugt im besten Fall rauchige, dunkle, pflaumige Weine." }
        ]
      },
      // Lektion 15
      {
        title: "Weinsensorik — Professionell verkosten",
        content: `**Professionelle Weinverkostung** folgt einem systematischen Protokoll: **SEE — SMELL — SIP — SPIT/SWALLOW — SUMMARIZE**. Bei einer professionellen Verkostung wird der Wein ausgespuckt (Spitting), um die sensorische Wahrnehmung über viele Weine hinweg zu erhalten. Das richtige Glas ist entscheidend — das **ISO-Verkostungsglas** (genormt nach ISO 3591) hat eine Tulpenform, die Aromen konzentriert.

**PHASE 1: SEHEN (Visuell)** — Glas gegen einen weißen Hintergrund, 45° geneigt. **Farbintensität**: Blass, mittel, tief/dunkel. **Farbton bei Weißwein**: Grünlich-gelb (jung) → Strohgelb → Goldgelb → Bernstein (alt/oxidiert). **Farbton bei Rotwein**: Purpur/Violett (jung) → Rubinrot → Granatrot → Ziegelrot → Braun (alt). **Rand (Meniskus)**: Am Glasrand wird die Farbe heller — bei alten Rotweinen zeigt der Rand Ziegelrot bis Braun (fortschreitende Polymerisation der Anthocyane). **Klarheit**: Brillant, klar, leicht trüb (bei Naturwein akzeptabel), trüb (bei konventionellem Wein ein Fehler). **Kirchenfenster/Tränen (Marangoni-Effekt)**: Langsam ablaufende, dickere Schlieren deuten auf höheren Alkohol- und/oder Zuckergehalt hin.

**PHASE 2: RIECHEN (Olfaktorisch)** — **Erster Eindruck** (ohne Schwenken): Flüchtige, leichte Aromen. **Nach dem Schwenken** (Belüftung): Komplexere, schwerere Aromen treten hervor. **Intensität**: Leicht, mittel, ausgeprägt. **Aromenklassifikation**: **Primäraromen** (rebsortenspezifisch): Frucht, Blumen, Kräuter — direkt aus der Traube. **Sekundäraromen** (Vinifikation): Hefe, Butter, Brioche (Hefelager), Vanille, Toast (Eichenfass). **Tertiäraromen** (Reifung): Leder, Tabak, Unterholz, Pilz, Trüffel, Honig, Nuss, Petrol.

**PHASE 3: SCHMECKEN (Gustatorisch/Taktil)** — **Antrunk**: Erster Eindruck auf der Zunge. **Mittelgaumen**: Fülle, Körper, Textur. **Abgang/Finish**: Wie lange und was klingt nach? Langes Finish (>10 Sekunden) = Qualitätszeichen. Die fünf geschmacklichen Komponenten: **Süße** (Restzucker) und **Säure** (unter anderem Wein- und Apfelsäure) werden nicht in exklusiven Zungenzonen wahrgenommen. **Tannin** (Gerbstoff, auch bei Weißweinen mit Schalenkontakt relevant) — adstringierend, trocknend auf Zahnfleisch und Innenwangen. **Alkohol** — Wärme, Viskosität, Volumen. **Umami/Mineralität** — schwer zu definieren, aber erfahrbar.

**PHASE 4: GESAMTURTEIL** — Balance (sind alle Komponenten harmonisch?), Komplexität (Vielschichtigkeit der Aromen), Länge (Abgang), Typizität (entspricht der Wein seiner Herkunft/Rebsorte?), Alterungspotenzial. **Punktesysteme**: Robert Parker/Wine Advocate (100 Punkte), James Suckling (100 Punkte), Jancis Robinson (20 Punkte), Falstaff, Gault Millau, Decanter. Die Skalen sind umstritten — letztlich zählt: Trink was DIR schmeckt!`,
        quiz: [
          { question: "Was bedeutet ein langer Abgang/Finish bei einem Wein?", options: ["Der Wein ist alt", "Die Aromen und Geschmackseindrücke halten nach dem Schlucken über 10 Sekunden an — ein Qualitätszeichen", "Der Wein hat viel Alkohol", "Der Wein ist sehr süß"], correct: 1, explanation: "Ein langes Finish (Caudalie >10 Sekunden) bedeutet, dass Aromen und Geschmack auch nach dem Schlucken lange am Gaumen nachklingen. Dies ist eines der wichtigsten Qualitätsmerkmale eines Weins." },
          { question: "Was sind Primäraromen im Wein?", options: ["Aromen aus dem Fass", "Rebsortenspezifische Aromen direkt aus der Traube (Frucht, Blumen, Kräuter)", "Aromen durch Alterung", "Künstliche Zusatzstoffe"], correct: 1, explanation: "Primäraromen stammen direkt aus der Traube und sind rebsortenspezifisch: Pfirsich bei Riesling, Cassis bei Cabernet Sauvignon, Lychee bei Gewürztraminer. Im Gegensatz dazu sind Sekundäraromen (Vinifikation) und Tertiäraromen (Reifung) nicht rebsortengebunden." },
          { question: "Was verursacht den Marangoni-Effekt ('Kirchenfenster/Tränen') im Weinglas?", options: ["Die Rebsorte", "Unterschiede in der Oberflächenspannung zwischen Alkohol und Wasser erzeugen die typischen Schlieren", "Die Temperatur des Weins", "Die Form des Glases"], correct: 1, explanation: "Alkohol hat eine niedrigere Oberflächenspannung als Wasser. Am Glasrand verdunstet Alkohol schneller, die höhere Oberflächenspannung des verbleibenden Wasser-Alkohol-Gemischs zieht Flüssigkeit nach oben — es bilden sich Schlieren ('Tränen')." }
        ]
      },
      // Lektion 16
      {
        title: "Das Weinaroma-Rad und Deskriptoren",
        content: `**Das Weinaroma-Rad** wurde 1984 von Ann C. Noble an der UC Davis entwickelt und ist bis heute das wichtigste Werkzeug der systematischen Weinbeschreibung. Es organisiert Weinaromen in drei konzentrische Ringe: **Innerer Ring** (Hauptkategorien): Fruchtig, blumig, würzig, vegetativ, nussig, karamellig, holzig, chemisch, erdig, mikrobiologisch. **Mittlerer Ring** (Unterkategorien): z. B. Fruchtig → Zitrus, tropisch, Beeren, Steinobst, Trockenfrüchte. **Äußerer Ring** (spezifische Deskriptoren): z. B. Steinobst → Pfirsich, Aprikose, Nektarine.

**Primäraromen (rebsortenspezifisch)**: Diese kommen direkt aus den Aromaverbindungen der Trauben. **Terpene** (Monoterpene): Linalool, Geraniol, Nerol — blumig, rosenähnlich. Besonders bei aromatischen Sorten: Muscat, Gewürztraminer, Riesling, Torrontés. **Methoxypyrazine**: Grüne Paprika, Spargel, Erbse — typisch für Sauvignon Blanc und Cabernet Sauvignon (bei kühleren Lagen/unreifen Trauben). **Thiole**: Passionsfrucht, Grapefruit, Buchsbaum — Sauvignon Blanc, Colombard. **Rotundon**: Pfeffernote — typisch für Syrah (Grüner Veltliner hat ein ähnliches Pfeffrig). **Norisoprenoid**: TDN (Petrol bei Riesling), Beta-Damascenon (Apfel, Rose).

**Sekundäraromen (Vinifikation)**: **Ester** (Gärungsnebenprodukte): Isoamylacetat = Banane, Ethylacetat = Nagellackentferner (in hoher Konzentration: Fehler). **Diacetyl** (MLF): Butter, Karamell — typisch bei Chardonnay nach malolaktischer Gärung. **Autolysearomen** (Hefelager): Brioche, Toastbrot, Biskuit — bei Champagner und Sur-Lie-Weinen. **Holz/Eiche**: Vanillin (Vanille), Eugenol (Nelke), Furfural (Toast, Karamell), Guaiacol (Rauch), Whiskey-Lacton (Kokos — v. a. amerikanische Eiche).

**Tertiäraromen (Reifung)**: **Oxidative Reifung**: Nuss, Honig, Trockenfrüchte, Karamell — bei Sherry, Vin Jaune, gereiftem Weißwein. **Reduktive Reifung (Flasche)**: Leder, Tabak, Unterholz, Trüffel, feuchtes Laub, Wildfleisch — typisch bei gereiftem Rotwein (Pinot Noir, Nebbiolo). **Bouquet** bezeichnet speziell die Tertiäraromen — man sagt: junger Wein hat "Aromen", gereifter Wein hat ein "Bouquet".

**Praxis-Tipp**: Trainiere deine Nase! Rieche bewusst an frischem Obst, Gewürzen, Blumen, Erde, Kaffee, Toast. Le Nez du Vin (54 Aromen-Set) ist ein professionelles Trainingskit. Wine & Spirit Education Trust (WSET) bietet strukturierte Verkostungskurse an.`,
        quiz: [
          { question: "Wer entwickelte das Weinaroma-Rad und wann?", options: ["Robert Parker, 1996", "Ann C. Noble, UC Davis, 1984", "Émile Peynaud, Bordeaux, 1955", "Hugh Johnson, 2001"], correct: 1, explanation: "Professor Ann C. Noble entwickelte 1984 an der University of California, Davis das Weinaroma-Rad (Wine Aroma Wheel) — es wurde zum internationalen Standardwerkzeug der Weinsensorik." },
          { question: "Was sind Methoxypyrazine und in welchen Weinen findet man sie?", options: ["Süße Aromastoffe in Riesling", "Grüne, vegetabile Aromastoffe (grüne Paprika, Spargel) in Sauvignon Blanc und Cabernet Sauvignon", "Fruchtige Ester in Muscat", "Rauchige Noten von der Eiche"], correct: 1, explanation: "Methoxypyrazine sind für die typische grüne Paprika-, Erbsen- und Spargel-Aromatik verantwortlich. Sie kommen natürlich in Sauvignon Blanc und Cabernet Sauvignon vor, besonders aus kühlen Regionen oder bei nicht voll ausgereiften Trauben." },
          { question: "Was unterscheidet 'Aromen' von 'Bouquet'?", options: ["Es gibt keinen Unterschied", "'Aromen' beschreiben primäre und sekundäre Düfte junger Weine, 'Bouquet' bezeichnet die Tertiäraromen gereifter Weine", "'Bouquet' ist ein Fehler", "'Aromen' kommen nur aus dem Fass"], correct: 1, explanation: "In der Fachsprache unterscheidet man: 'Aromen' = Düfte junger Weine (primär aus der Traube, sekundär aus der Vinifikation). 'Bouquet' = komplexe Tertiäraromen, die erst durch Flaschenreifung entstehen (Leder, Trüffel, Unterholz)." }
        ]
      },
      // Lektion 17
      {
        title: "Weinfehler erkennen (Kork, Böckser, Oxidation)",
        content: `**Weinfehler** systematisch zu erkennen ist eine Kernkompetenz des Sommeliers und des Fachhandels. Nicht jedes untypische Aroma ist ein Fehler — manche sind stilistisch gewollt (z. B. leichte Reduktion, Brett in burgundischem Pinot Noir). Der Übergang von "Charakter" zu "Fehler" ist fließend und kontextabhängig.

**Korkton/TCA (2,4,6-Trichloranisol)** — Der häufigste und bekannteste Weinfehler, betrifft ca. 2–5 % aller Flaschen mit Naturkorken. **Ursache**: TCA entsteht durch Schimmelpilze (Penicillium, Aspergillus), die Chlorphenole im Korken zu TCA umwandeln. Bereits 2 Nanogramm pro Liter (!) sind wahrnehmbar. **Sensorik**: Muffig, nasser Karton, feuchter Keller, nasse Zeitung. In niedrigen Konzentrationen "maskiert" TCA die Frucht — der Wein wirkt flach und ausdruckslos, ohne direkt muffig zu riechen. **Maßnahmen**: Alternative Verschlüsse reduzieren bestimmte Verschlussrisiken, beseitigen aber nicht jede mögliche Kontamination aus Keller oder Verpackung.

**Oxidation** — **Ursache**: Übermäßiger Sauerstoffkontakt (undichter Verschluss, zu lange offen, zu warm gelagert). **Sensorik bei Weißwein**: Braune Farbe, abgestandener Apfel, sherry-artige Noten, Bittermandel. **Sensorik bei Rotwein**: Bräunliche Farbe, flache Frucht, Essig-Ansatz, Nagellack. **Ausnahme**: Bei Sherry (Fino, Oloroso), Vin Jaune (Jura) und manchen georgischen Weinen ist oxidativer Ausbau GEWOLLT und kontrolliert.

**Böckser (Reduktion)** — **Ursache**: Schwefelwasserstoff (H₂S) entsteht bei Hefestress (Nährstoffmangel, zu wenig Stickstoff). Weitere flüchtige Schwefelverbindungen: Mercaptane, Disulfide. **Sensorik**: Faule Eier, verbranntes Streichholz, Gummi, Zwiebel, Knoblauch. **Maßnahme**: Bei leichten reduktiven Noten kann vorsichtige Belüftung helfen, aber nicht jede Schwefelverbindung reagiert gleich. Bei anhaltendem Fehler die Flasche reklamieren. Münzen oder andere Metallgegenstände gehören nicht ins Getränk. Kontrollierte Kupferbehandlungen im Weinkeller benötigen Fachkenntnis und Analytik.

**Brettanomyces ("Brett")** — **Ursache**: Die Hefe Brettanomyces bruxellensis produziert flüchtige Phenole (4-Ethylphenol, 4-Ethylguaiacol). **Sensorik**: Pferdestall, Pflaster, Leder, medizinisch, Rauch, Speck. **Kontroverse**: In niedrigen Konzentrationen kann Brett Komplexität verleihen (manche burgundische Pinot Noirs, Châteauneuf-du-Pape). In hohen Konzentrationen eindeutig ein Fehler.

**Flüchtige Säure (VA)** — **Ursache**: Essigsäurebakterien (Acetobacter) produzieren Essigsäure und Ethylacetat. **Sensorik**: Essig, Nagellackentferner, Lösungsmittel. Jeder Wein enthält geringe Mengen VA — sie wird erst ab ca. 0,7–0,8 g/l (Weißwein) bzw. 1,0–1,2 g/l (Rotwein) als störend empfunden.

**Weitere Fehler**: **Mäuseln (Mousiness)**: Mäusekäfig- oder crackerartiger Nachgeschmack, häufig erst retronasal im Mund wahrnehmbar. Die betreffenden Verbindungen sind bei niedrigem Wein-pH wenig flüchtig; im Mund wird der pH angehoben. Häufig bei Naturwein ohne Schwefelzugabe. **UTA (Untypische Alterungsnote)**: Vorzeitige Alterung bei jungen Weißweinen, Mottenkugeln, Bohnerwachs. **Licht-Geschmack (Goût de Lumière)**: Lichteinwirkung kann Schwefelverbindungen und entsprechende Fehltöne begünstigen. Betrifft v. a. Wein in Klarglasflaschen.`,
        quiz: [
          { question: "Ab welcher Konzentration ist TCA (Korkton) wahrnehmbar?", options: ["1 Gramm pro Liter", "2 Nanogramm pro Liter — extrem geringe Mengen", "10 Milligramm pro Liter", "1 Prozent"], correct: 1, explanation: "TCA gehört zu den geruchsintensivsten Substanzen überhaupt — bereits 2 Nanogramm pro Liter (2 Milliardstel Gramm!) genügen, um den muffigen Korkton wahrzunehmen. In niedriger Konzentration maskiert TCA die Frucht, ohne direkt muffig zu riechen." },
          { question: "Was kann man gegen leichten Böckser (Reduktion) tun?", options: ["Den Wein wegschütten", "Vorsichtige Belüftung versuchen; bei anhaltendem Fehler reklamieren", "Zucker hinzufügen", "Den Wein einfrieren"], correct: 1, explanation: "Belüftung kann bei einzelnen reduktiven Noten helfen, ist aber keine universelle Behandlung. Kupferbehandlungen gehören in die kontrollierte Kellerpraxis; keine Münze ins Weinglas geben." },
          { question: "Warum ist Brettanomyces kontrovers diskutiert?", options: ["Weil er Allergien auslöst", "Weil geringe Konzentrationen als Komplexität gelten können, hohe Konzentrationen aber als Fehler", "Weil er den Wein rot färbt", "Weil er den Alkohol erhöht"], correct: 1, explanation: "Brett ist ein Grenzfall: Geringe Mengen der flüchtigen Phenole (4-EP, 4-EG) können Leder- und Rauchnoten verleihen, die manche als Komplexität schätzen (v. a. bei burgundischem Pinot Noir). Ab einer gewissen Schwelle dominiert jedoch der Pferdestall-Geruch und gilt eindeutig als Fehler." }
        ]
      },
      // Lektion 18
      {
        title: "Weinlagerung und Reifepotenzial",
        content: `**Die große Frage**: Wann ist der richtige Zeitpunkt, eine Flasche zu öffnen? Viele Weine werden für den baldigen Genuss bereitet. Ob längere Lagerung sinnvoll ist, hängt von Wein, Jahrgang, Verschluss und Lagerbedingungen ab; belastbare universelle Prozentwerte gibt diese Lektion nicht vor.

**Was braucht ein Wein für Langlebigkeit?** Vier Faktoren bestimmen das Reifepotenzial: **Säure** (konserviert den Wein, bildet das Rückgrat — deshalb reifen Riesling und Nebbiolo so gut). **Tannin** (bei Rotwein: Gerbstoffe polymerisieren über die Jahre, werden weicher, der Wein runder). **Zucker** (kann die Stabilität beeinflussen; daraus folgt kein fester Zeitraum). **Alkohol** (ein Einfluss auf Stabilität und Balance, keine Jahrhundert-Garantie). Balance dieser Komponenten ist entscheidend: Ein Wein mit hohen Tanninen, aber wenig Frucht wird im Alter nicht besser — die Frucht schwindet, die Tannine bleiben.

**Illustrative Stilbeispiele, keine Haltbarkeitsgarantien**: Reifepotenzial hängt von Erzeuger, Jahrgang, konkretem Wein und Lagerung ab. Die folgenden breiten Bereiche sind keine verbindlichen Trinkfenster. **1–3 Jahre**: Die meisten einfachen Weißweine, Rosé, einfache Rotweine. **3–10 Jahre**: Guter Riesling, Chablis Premier Cru, Chianti Classico, Rioja Reserva, Côtes du Rhône Villages. **10–25 Jahre**: Grand Cru Burgunder, Bordeaux Cru Classé, Barolo/Barbaresco, Hermitage, deutscher Riesling Spätlese/Auslese. **25–50+ Jahre**: Bester Bordeaux (Premiers Crus), DRC, Hermitage La Chapelle, Barolo Riserva, Riesling TBA/Eiswein, Vintage Port, Madeira. **50–100+ Jahre**: ausgewählte, sachgerecht gelagerte Madeira, Tokaji Aszú, Château d'Yquem, beste TBA.

**Optimale Lagerbedingungen**: **Temperatur**: 10–14°C, konstant (Schwankungen sind schlimmer als leicht zu warm/kühl). **Luftfeuchtigkeit**: Extreme Trockenheit oder Feuchte vermeiden; Etiketten und Verschlüsse können darunter leiden. **Licht**: Dunkel! UV-Strahlung baut Wein ab (Goût de Lumière). **Vibrationen**: Minimieren — Erschütterungen stören die langsame chemische Reifung. **Gerüche**: Keine starken Gerüche in der Nähe (Korken sind nicht 100 % dicht). **Lagerposition**: Das DWI empfiehlt bei längerer Lagerung von Naturkorkflaschen die liegende Position. Bei kurzer Aufbewahrung von ein bis zwei Jahren können sie auch stehend gelagert werden; andere Verschlüsse können stehend bleiben.

**Weintemperierschränke** sind die pragmatische Lösung: Temperatur, Luftfeuchtigkeit, UV-Schutz und Vibrationsdämpfung in einem Gerät. Für den Einstieg: Ein Zwei-Zonen-Schrank (eine Zone 6–8°C für Weißwein-Trinktemperatur, eine Zone 14–16°C für Rotwein oder Lagerung). Der natürliche Keller (nordseitig, ohne Heizungsrohre) ist weiterhin die beste kostenlose Lösung.`,
        quiz: [
          { question: "Welche Aussage zur Lagerfähigkeit von Wein trifft zu?", options: ["50 %", "25 %", "Nur geeignete Weine profitieren; Wein und Lagerbedingungen sind entscheidend", "Alle Weine werden mit der Zeit besser"], correct: 2, explanation: "Viele Weine sind zum baldigen Genuss gedacht. Reifepotenzial muss am konkreten Wein beurteilt werden; eine universelle Prozentquote wäre irreführend." },
          { question: "Was ist der wichtigste Feind der Weinlagerung?", options: ["Zu niedrige Temperatur", "Temperaturschwankungen — sie sind schlimmer als eine konstant leicht erhöhte Temperatur", "Zu hohe Luftfeuchtigkeit", "Völlige Dunkelheit"], correct: 1, explanation: "Temperaturschwankungen sind der größte Feind: Sie verursachen Ausdehnung und Kontraktion des Weins, was dazu führen kann, dass Luft am Korken vorbei ein- und austritt (Pumping). Konstante 10–14°C sind ideal." },
          { question: "Warum reifen Riesling und Nebbiolo besonders gut?", options: ["Wegen ihres hohen Alkohols", "Wegen ihrer hohen Säure, die als natürliches Konservierungsmittel wirkt und das Rückgrat für die Reifung bildet", "Wegen des niedrigen Tanningehalts", "Wegen der speziellen Flaschengröße"], correct: 1, explanation: "Hohe Säure ist einer der wichtigsten Faktoren für die Langlebigkeit eines Weins. Riesling (straffe Apfelsäure/Weinsäure) und Nebbiolo (hohe Säure + Tannin) haben ideale Voraussetzungen für jahrzehntelange Reifung." }
        ]
      },
      // Lektion 19
      {
        title: "Dekantieren und die richtige Temperatur",
        content: `**Dekantieren** — Das Umfüllen von Wein aus der Flasche in eine Karaffe (Dekanter) hat zwei verschiedene Zwecke, die oft verwechselt werden: **1. Belüftung (Aération)**: Junger, tanninreicher Wein wird durch Sauerstoffkontakt weicher und offener. **2. Abscheidung von Depot**: Älterer Wein wird vorsichtig vom Bodensatz getrennt.

**Belüftung für junge Weine**: Tanninreiche junge Rotweine (Barolo, junger Bordeaux, Cabernet Sauvignon, Syrah) profitieren oft von 30–120 Minuten Belüftung. Der Sauerstoff regt die Polymerisation der Tannine an (kurze Tanninketten verbinden sich zu längeren, die weicher schmecken) und hilft reduktiven Noten (Böckser) zu verfliegen. **Breit-bauchige Karaffen** maximieren die Sauerstoffkontaktfläche. Bei besonders verschlossenen Weinen: Doppeltes Dekantieren (Wein in Karaffe, Flasche ausspülen, zurückfüllen) oder Hyper-Dekantieren (Mixer — kontrovers!).

**Depot-Dekantieren für alte Weine**: Ältere Rotweine (15+ Jahre) bilden natürliches Sediment (Depot) — ausgefallene Tannine, Farbpigmente, Weinstein. Das Depot ist harmlos, aber im Mund unangenehm körnig. **Methode**: Flasche 24–48 h aufrecht stellen (Depot sinkt). Kerze oder Taschenlampe hinter den Flaschenhals. Langsam und gleichmäßig in die Karaffe gießen. Stoppen, sobald das Depot am Flaschenhals erscheint. **VORSICHT**: Alte Weine (20+ Jahre) sollten nur kurz dekantiert werden — zu viel Sauerstoff kann sie "umwerfen" (die fragilen Aromen verfliegen innerhalb von Minuten).

**Welche Weine NICHT dekantieren?** — Leichte, fruchtige Weißweine (Riesling Kabinett, Pinot Grigio), frischer Rosé, einfache Rotweine (Beaujolais, Dornfelder), Schaumweine (CO₂ geht verloren). **Ausnahmen**: Kräftiger Chardonnay aus dem Fass und Orange Wine können von Belüftung profitieren.

**Die richtige Trinktemperatur** — Einer der häufigsten Fehler: Weißwein zu kalt, Rotwein zu warm. **Schaumwein**: als Orientierung häufig 8–10°C; produktbezogene Herstellerhinweise beachten. **Leichter Weißwein** (Riesling, Sauvignon Blanc): 8–10°C. **Gehaltvoller Weißwein** (Chardonnay Barrique, Burgunder): 10–12°C. **Rosé**: 8–10°C. **Leichter Rotwein** (Beaujolais, Pinot Noir): 14–16°C. **Mittlerer Rotwein** (Chianti, Rioja): 16–18°C. **Kräftiger Rotwein** (Bordeaux, Barolo, Shiraz): 16–18°C. **Süßwein**: 8–10°C. **"Zimmertemperatur"** stammt aus der Zeit ungeheizter Steinhäuser (16–18°C) — NICHT aus modern geheizten Wohnungen (22–24°C)! Zu warmer Rotwein schmeckt alkoholisch und flach, zu kalter Weißwein verliert Aromen und schmeckt sauer. **Faustregel**: Lieber etwas zu kühl servieren — im Glas erwärmt sich Wein schnell. Die Kühlzeit hängt von Flaschengröße, Ausgangstemperatur und Kühlgerät ab. Ein Eiskübel mit Wasser und Eis kühlt schneller als ein Kühlschrank.`,
        quiz: [
          { question: "Warum sollte man alte Weine (20+ Jahre) nur KURZ dekantieren?", options: ["Weil sie keinen Sauerstoff mögen", "Die fragilen Tertiäraromen können bei zu viel Sauerstoffkontakt schnell verfliegen und der Wein 'kippt'", "Weil der Dekanter zu klein ist", "Wegen der Glaschemie"], correct: 1, explanation: "Alte Weine haben ein fragiles Aromengebäude aus Tertiäraromen. Zu viel Sauerstoff kann diese empfindlichen Verbindungen schnell zerstören — der Wein wirkt dann plötzlich flach und leer, nachdem er kurz brillant aufgeblüht hat." },
          { question: "Was ist die ideale Trinktemperatur für kräftigen Rotwein?", options: ["22–24°C (Zimmertemperatur)", "16–18°C — 'Zimmertemperatur' bezieht sich auf ungeheizte Steinhäuser, nicht moderne Wohnungen", "8–10°C", "5–8°C"], correct: 1, explanation: "16–18°C ist ideal für kräftige Rotweine. Die historische 'Zimmertemperatur' bezog sich auf ungeheizte Räume. In modernen Wohnungen (22–24°C) schmeckt Rotwein zu warm — alkoholisch und flach." },
          { question: "Warum bilden ältere Rotweine Depot?", options: ["Wegen Bakterien", "Tannine und Farbpigmente polymerisieren über die Jahre und fallen als Sediment aus", "Wegen des Zuckers", "Das Depot ist ein Weinfehler"], correct: 1, explanation: "Während der Flaschenreifung verbinden sich kurze Tanninketten zu längeren Polymeren, die zu schwer werden, um in Lösung zu bleiben. Zusammen mit ausgefallenen Anthocyanen (Farbpigmenten) und Weinstein bilden sie das harmlose, aber körnige Depot." }
        ]
      },
      // Lektion 20
      {
        title: "Food Pairing — Klassische Regeln und neue Wege",
        content: `**Food Pairing** ist die Kunst, Wein und Speisen so zu kombinieren, dass beide sich gegenseitig ergänzen oder kontrastieren und ein harmonisches Gesamterlebnis schaffen. Es gibt wissenschaftlich fundierte Grundregeln, aber auch Raum für kreative Experimente.

**Die 6 klassischen Grundregeln**:

**1. Säure zu Säure** — Der Wein muss mindestens so sauer sein wie die Speise. Tomate + säurearmer Wein = Wein schmeckt flach und fade. Lösung: Chianti, Sangiovese, Barbera (hohe Säure) zu Tomatensauce. Sauvignon Blanc zu Ziegenkäse (Zitrussäure harmoniert mit Milchsäure).

**2. Süße mildert Schärfe** — Restsüße im Wein balanciert Capsaicin (Schärfe). Gewürztraminer Spätlese zu Thai-Curry. Riesling Kabinett/Spätlese zu Szechuan-Küche. Off-dry Vouvray zu scharfem indischem Essen. Trockener, tanninreicher Wein zu scharfem Essen = Katastrophe (Tannin und Capsaicin verstärken sich gegenseitig).

**3. Tannin braucht Protein und Fett** — Tannine binden an Speichelproteine (adstringierendes Mundgefühl). Protein und Fett aus der Speise binden die Tannine zuerst → der Wein wirkt weicher. Cabernet Sauvignon zu Ribeye-Steak = perfekte Symbiose. Barolo zu Brasato al Barolo (Schmorbraten). CAVE: Wein und Fisch können je nach Kombination einen unangenehmen Nachgeschmack ergeben. Untersuchungen an Wein und Jakobsmuscheln fanden einen Einfluss von Eisenionen; eine pauschale Tannin-Fischöl-Reaktion ist keine ausreichende Erklärung. Ausnahme: Tannarmer Rotwein (Pinot Noir, Gamay) zu fettem Fisch (Lachs, Thunfisch).

**4. Gewicht zu Gewicht** — Leichte Speise + leichter Wein, schwere Speise + schwerer Wein. Carpaccio + schwerer Barolo = der Wein erschlägt das Essen. Leichter Pinot Grigio + Schweinshaxe = der Wein geht unter. Die Intensität muss harmonieren.

**5. Regional denken** — Was zusammen wächst, passt zusammen. Muscadet + Meeresfrüchte aus der Bretagne. Chianti + Bistecca Fiorentina. Riesling + Sauerkraut. Albariño + Pulpo aus Galicien.

**6. Süßwein ≥ Dessert** — Der Wein muss mindestens so süß sein wie das Dessert, besser etwas süßer. Trockener Wein zu Schokoladenkuchen = sauer und bitter. **Sauternes** zu Foie Gras oder Crème Brûlée. **Port** (Vintage/Tawny) zu Schokolade, Blauschimmelkäse. **Riesling TBA** zu frischen Früchten oder Obsttartes.

**Neue Wege**: Molecular Pairing (identische Aromaverbindungen in Wein und Speise suchen — Rotundon in Syrah und schwarzem Pfeffer), Textural Pairing (Cremigkeit zu Cremigkeit), Umami-Pairing (Weine mit hohem Glutamat-Gehalt zu umami-reichen Speisen).`,
        quiz: [
          { question: "Was zeigte eine Untersuchung zum unangenehmen Nachgeschmack bei Wein und Meeresfrüchten?", options: ["Weil Fisch zu salzig ist", "Eisenionen im Wein können die Bildung eines fischigen Nachgeschmacks fördern", "Weil die Säure zu hoch ist", "Weil Rotwein generell nicht zu Fisch passt"], correct: 1, explanation: "Eine Studie mit Wein und getrockneten Jakobsmuscheln zeigte einen Einfluss von Eisenionen. Das Ergebnis ist keine universelle Regel für alle Fischgerichte; die konkrete Speise und der Wein zählen." },
          { question: "Warum passt Restsüße im Wein zu scharfem Essen?", options: ["Weil Zucker die Schärfe chemisch neutralisiert", "Restsüße balanciert das Capsaicin, während Tannin und Schärfe sich gegenseitig verstärken würden", "Weil süßer Wein weniger Alkohol hat", "Weil scharfes Essen generell süß ist"], correct: 1, explanation: "Zucker wirkt sensorisch als 'Feuerlöscher' gegen Capsaicin-Schärfe. Gleichzeitig verstärken Tannin und Alkohol die Schärfewahrnehmung — deshalb sind trockene, tanninreiche Rotweine zu scharfem Essen eine schlechte Wahl." },
          { question: "Was ist die Grundregel bei Dessert und Wein?", options: ["Der Wein muss immer trocken sein", "Der Wein muss mindestens so süß sein wie das Dessert, besser etwas süßer", "Zu Dessert passt nur Rosé", "Man trinkt keinen Wein zum Dessert"], correct: 1, explanation: "Ist das Dessert süßer als der Wein, schmeckt der Wein sauer und bitter. Der Süßwein sollte daher mindestens so süß wie das Dessert sein — Sauternes zu Crème Brûlée, Port zu Schokolade." }
        ]
      },
      // Lektion 21
      {
        title: "Biodynamischer und Naturwein",
        content: `**Konventioneller, biologischer, biodynamischer und Naturwein** — vier Philosophien des Weinbaus, die sich grundlegend in ihrem Umgang mit Natur und Technik unterscheiden.

**Konventioneller Weinbau**: Synthetische Pestizide, Herbizide, Kunstdünger erlaubt. Im Keller: Nur zugelassene önologische Verfahren und Stoffe dürfen eingesetzt werden; ihre Zulässigkeit hängt von Produktkategorie und Bedingungen ab. Ein beliebiger Farbstoffzusatz ist damit nicht erlaubt. Der Großteil des Weltweins wird konventionell produziert.

**Biologischer/Ökologischer Weinbau** (EU Bio-Verordnung seit 2012): Im Weinberg: Keine synthetischen Pestizide, Herbizide oder Kunstdünger. Kupfer und Schwefel als Pflanzenschutz erlaubt (nur zugelassene Mittel unter ihren aktuellen Zulassungs- und Anwendungsbedingungen; Bio bedeutet nicht pflanzenschutzmittelfrei). Im Keller: Weniger Zusatzstoffe erlaubt, niedrigere SO₂-Grenzwerte (100 mg/l für trockenen Rotwein vs. 150 mg/l konventionell). Bio-Siegel: EU-Biosiegel, Demeter, Ecovin, Naturland.

**Biodynamischer Weinbau** (Demeter-Zertifizierung): Basiert auf den Vorträgen Rudolf Steiners von 1924. Geht weit über Bio hinaus: **Kosmische Rhythmik**: Pflanzung, Rebschnitt, Lese und Kellerarbeit werden nach einem **Mondkalender** ausgerichtet (Blatt-, Frucht-, Wurzel-, Blütentage). **Biodynamische Präparate**: Hornmist (500) — Kuhmist in Kuhhörnern über Winter im Boden vergraben, dann hochverdünnt auf den Weinberg gesprüht → soll nach biodynamischem Verständnis die Bodenaktivität unterstützen. Hornkiesel (501) — Quarzmehl in Kuhhörnern über Sommer gelagert → soll nach biodynamischem Verständnis die Pflanzenentwicklung unterstützen; daraus folgt keine allgemein gesicherte Wirkungszusage. Schafgarbe, Kamille, Brennnessel, Eichenrinde, Löwenzahn, Baldrian — Kompostpräparate (502–507). **Selbstversorgung**: Der Betrieb als geschlossener Organismus. **Top-Produzenten biodynamisch**: Domaine de la Romanée-Conti, Domaine Leroy, Zind-Humbrecht, Nikolaihof, Bürklin-Wolf, Wittmann.

**Naturwein (Vin Naturel)** — Sammelbegriff für unterschiedliche Ansätze mit möglichst wenigen Eingriffen. Anders als die EU-Bio-Kennzeichnung ist er keine einheitliche EU-Zertifizierung. **Im Weinberg**: Bio oder biodynamisch. **Im Keller**: Spontangärung (Wildhefen), kein oder geringer Schwefelzusatz nach den jeweiligen privaten Regeln; kein universeller EU-Grenzwert von 30–40 mg/l, keine Schönung, keine Filtration, keine Zusatzstoffe. Ergebnis: Weine, die vital, lebendig und unvorhersagbar sind — aber auch instabiler. Häufige Merkmale: Trübung (kein Filtern), leichte Perlage (Restkohlensäure), ungewöhnliche Aromen (Cider, Hefe, Kombucha, Sauerteig). Kritik: Erhöhtes Fehlerrisiko (Essigsäure, Brett, Mäuseln). **Schlüsselfiguren**: Marcel Lapierre (Beaujolais), Josko Gravner (Friaul), Pierre Overnoy (Jura), Frank Cornelissen (Ätna).

**Wichtig für die Beratung**: Naturwein ist polarisierend — manche Kunden lieben die Lebendigkeit, andere empfinden die Fehltöne als störend. Ehrliche Beratung und Probieren lassen ist der beste Ansatz. Das Orange-Wine-Revival und die Amphoren-Welle sind eng mit der Naturwein-Bewegung verbunden.`,
        quiz: [
          { question: "Was ist das Hornmist-Präparat (500) in der Biodynamie?", options: ["Ein chemisches Pestizid", "Kuhmist, der in Kuhhörnern über Winter im Boden vergräbt und dann hochverdünnt auf den Weinberg gesprüht wird, um den Boden zu aktivieren", "Ein synthetischer Dünger", "Ein Dessertwein-Zusatz"], correct: 1, explanation: "Präparat 500 (Hornmist) ist zentral in der Biodynamie: Kuhmist wird in Kuhhörnern über Winter vergraben, wo er reift und sich mit Bodenmikroorganismen anreichert. Hochverdünnt und dynamisiert (gerührt) auf den Boden gespritzt, soll es die Bodenbiologie aktivieren." },
          { question: "Was ist der Hauptunterschied zwischen Bio-Wein und Naturwein?", options: ["Es gibt keinen Unterschied", "Bio-Wein erlaubt noch zahlreiche Kellerbehandlungen und Zusatzstoffe, Naturwein lehnt praktisch alle Eingriffe ab (kein/minimal Schwefel, kein Filtern, Spontangärung)", "Naturwein ist immer besser", "Bio-Wein verwendet keine Trauben"], correct: 1, explanation: "Bio-Wein regelt vor allem den Weinberg (keine synthetischen Mittel) und senkt SO₂-Grenzwerte, erlaubt aber noch viele Kellerbehandlungen. Naturwein geht viel weiter: Spontangärung, kein oder minimaler Schwefel, keine Schönung, keine Filtration — maximaler Non-Interventionismus." },
          { question: "Welches berühmte Weingut arbeitet biodynamisch?", options: ["Gallo", "Domaine de la Romanée-Conti", "Yellow Tail", "Barefoot Wines"], correct: 1, explanation: "Domaine de la Romanée-Conti (DRC) — das wohl berühmteste und teuerste Weingut der Welt — ist für biodynamischen Weinbau bekannt; daraus wird hier keine bestimmte Zertifizierung abgeleitet. Auch Bürklin-Wolf, Leroy und Zind-Humbrecht sind prominente Beispiele." }
        ]
      },
      // Lektion 22
      {
        title: "Weinetiketten lesen und verstehen",
        content: `**Das Weinetikett** ist die Visitenkarte des Weins und enthält — wenn man es zu lesen versteht — enorm viel Information über Herkunft, Qualität, Stil und Jahrgang. Die Pflichtangaben sind EU-weit geregelt (unter anderem VO 1308/2013 und Delegierte VO 2019/33), die freiwilligen Angaben variieren je nach Land und Tradition.

**Pflichtangaben (EU)**: **Verkehrsbezeichnung** (z. B. "Qualitätswein", "Landwein", "Deutscher Wein"). **Herkunftsland** (z. B. "Produkt von Deutschland", "Product of France"). **Anbaugebiet** (bei Qualitätswein, z. B. "Pfalz", "Rheinhessen", "Bordeaux"). **Alkoholgehalt** (% Vol., Toleranz ±0,5 %). **Nennvolumen** (z. B. 0,75 l). **Abfüller** (Name und Anschrift, z. B. "Erzeugerabfüllung" = gesetzlich geregelte Angabe, die unter Bedingungen auch Erzeugerzusammenschlüsse verwenden dürfen). **Losnummer** (L + Nummer für Rückverfolgbarkeit). **Allergene**: "Enthält Sulfite" (wenn >10 mg/l SO₂). Für ab 8. Dezember 2023 erzeugte Weine gelten zusätzliche **Nährwert- und Zutatenangaben**. Vollständige Nährwerte und Zutaten können elektronisch abrufbar sein; der Energiewert und kennzeichnungspflichtige Allergene bleiben auf dem physischen Etikett. Zuvor erzeugte Bestände haben eine Übergangsregel.

**Wichtige freiwillige Angaben**: **Jahrgang**: Das Jahr der Traubenernte (mind. 85 % der Trauben müssen aus diesem Jahr stammen). Kein Jahrgang = Verschnitt mehrerer Jahre (typisch für Champagner NV, Port). **Rebsorte**: Bei EU-Weinen freiwillig (mind. 85 % der genannten Sorte müssen enthalten sein). In Deutschland, Elsass, Österreich, Neuseeland üblich. In Frankreich (Bordeaux, Burgund, Rhône) wird die Herkunft statt der Rebsorte betont. **Geschmacksangabe**: Trocken, halbtrocken, lieblich, süß. **Lage/Einzellage**: "Bernkasteler Doctor", "Forster Kirchenstück" — je spezifischer, desto höher die Qualität. **Qualitätsstufe/Prädikat**: Kabinett, Spätlese, Auslese etc.

**Länder-spezifische Begriffe**: **Frankreich**: AOP/AOC (geschützte Herkunft), Château (Weingut in Bordeaux), Domaine (Weingut in Burgund), Mis en bouteille au château/domaine (Gutsabfüllung), Cru Classé, Grand Cru, Premier Cru. **Italien**: DOC/DOCG, Classico (historisches Kerngebiet), Riserva (verlängerte Reifung), Superiore (höherer Alkohol). **Spanien**: DO/DOCa, Crianza/Reserva/Gran Reserva, Cosecha (Jahrgang), Viñedo (Einzellage). **Deutschland**: VDP-Adler (Große Lage, Erste Lage), Erzeugerabfüllung, Gutsabfüllung, Ortswein, Gutswein.

**Etiketten-Tricks erkennen**: "Abgefüllt für..." (= Handelsmarke, nicht der Erzeuger). Fantasienamen ("Sonnenwinzer Goldtröpfchen") sagen nichts über Qualität. Schwere Flaschen ≠ besserer Wein (aber höherer CO₂-Fußabdruck). Medaillen (Berliner Wein Trophy, Mundus Vini) sind hilfreich, aber inflationär vergeben. **Goldene Regel**: Der Ort/Lage auf dem Etikett ist wichtiger als der Markenname.`,
        quiz: [
          { question: "Was bedeutet 'Erzeugerabfüllung' auf einem deutschen Weinetikett?", options: ["Der Wein wurde im Supermarkt abgefüllt", "Der Winzer hat die Trauben selbst angebaut UND den Wein selbst abgefüllt", "Der Wein stammt aus einer Genossenschaft", "Es ist ein Importwein"], correct: 1, explanation: "Erzeugerabfüllung garantiert, dass der auf dem Etikett genannte Betrieb die Trauben selbst angebaut, den Wein selbst erzeugt und selbst abgefüllt hat — ein Qualitätsmerkmal, das die volle Verantwortung beim Erzeuger belegt." },
          { question: "Welche neue Pflichtangabe gilt seit 2023 für EU-Weine?", options: ["Rebsortenangabe", "Nährwert- und Zutatenangaben; Energiewert und Allergene bleiben auf dem Etikett", "Trinkempfehlung", "Weinbergshöhe"], correct: 1, explanation: "Die neuen Regeln gelten für ab 8. Dezember 2023 erzeugte Weine; zuvor erzeugte Bestände sind ausgenommen. Vollständige Nährwerte und Zutaten können elektronisch bereitgestellt werden, Energiewert und Allergene müssen auf dem Etikett stehen." },
          { question: "Was bedeutet 'Classico' bei einem italienischen Wein (z. B. Chianti Classico)?", options: ["Der Wein ist besonders alt", "Er stammt aus dem historischen Kerngebiet der Appellation — dem ursprünglichen, besten Bereich", "Er wurde nach klassischer Methode hergestellt", "Er ist günstiger als andere"], correct: 1, explanation: "'Classico' bezeichnet das historische Kerngebiet einer italienischen Appellation — bei Chianti das Gebiet zwischen Florenz und Siena. Weine aus dem Classico-Gebiet gelten als typischer und qualitativ hochwertiger." }
        ]
      },
      // Lektion 23
      {
        title: "Weinrecht: DOC, AOC, VDP, Prädikatsstufen",
        content: `**Weinrecht** regelt Herkunft, Qualität, Herstellung und Etikettierung von Wein. Es schützt Verbraucher vor Täuschung und Produzenten vor Nachahmung. Die wichtigsten Systeme im Überblick:

**EU-Weinrecht (seit 2009 reformiert)**: Zwei Qualitätskategorien: **Wein ohne geographische Angabe** und **Wein mit geographischer Angabe**: **g.g.A. / IGP** (geschützte geographische Angabe — z. B. Pays d'Oc, Toscana IGT): Mindestens 85 % der Trauben aus dem benannten Gebiet. **g.U. / DOP** (geschützte Ursprungsbezeichnung — z. B. Bordeaux AOC, Barolo DOCG, Rheingau): 100 % der Trauben aus dem Gebiet, strenge Produktionsregeln.

**Frankreich — AOC/AOP**: Das älteste und einflussreichste Herkunftssystem (seit 1935, INAO). Regelt: Zugelassene Rebsorten, Höchsterträge, Mindestalkohol, Anbau- und Kellermethoden. Strenge Pyramide: Vin de France → IGP → AOP (ehemals AOC). Innerhalb der AOP: Regionale AOP (z. B. Bordeaux) → Kommunale AOP (z. B. Pauillac) → Einzellagen (Cru Classé, Grand Cru etc.). Je enger die Herkunft, desto strenger die Regeln und desto höher (meist) die Qualität.

**Italien — DOC/DOCG**: 332 DOC und 77 DOCG (Stand 2024). DOCG ist die höchste Stufe — mit staatlicher Banderole auf jeder Flasche. Seit den 1990ern auch IGT/IGP (Indicazione Geografica Tipica/Protetta) — ursprünglich für Tafelwein gedacht, aber durch Super Tuscans (Sassicaia, Tignanello) aufgewertet.

**Spanien — DO/DOCa**: 70 DO, 2 DOCa (Rioja und Priorat — höchste Stufe). Reifegrad-System (Joven, Crianza, Reserva, Gran Reserva) ist einzigartig und für den Verbraucher sehr hilfreich. Pago = Einzellage höchster Qualität (Dominio de Valdepusa, Finca Élez etc.).

**Deutschland — Deutsches Weingesetz**: Einzigartig durch das **Mostgewicht-System**: Die Qualität wird (traditionell) durch den natürlichen Zuckergehalt der Trauben bei der Ernte bestimmt. Deutscher Wein → Landwein → Qualitätswein → Prädikatswein. Die **Prädikate**: Kabinett (67–82° Oechsle), Spätlese (76–95° Oechsle), Auslese (83–105° Oechsle), Beerenauslese (110–128° Oechsle), Trockenbeerenauslese (150–154° Oechsle), Eiswein (110–128° Oechsle, bei -7°C geerntet). Parallel: Das **VDP-System** (privater Verband, ca. 200 Top-Weingüter) mit der burgundischen Lagenklassifikation: Gutswein → Ortswein → Erste Lage → Große Lage/Großes Gewächs.

**Österreich**: DAC-System (Districtus Austriae Controllatus, seit 2003). Weinviertel DAC (Grüner Veltliner), Kamptal DAC, Wachau DAC. Sonderstellung: **Vinea Wachau** (Steinfeder, Federspiel, Smaragd — nach Alkoholgehalt gestuft).

**Herkunftsschutz funktioniert**: "Champagner" darf nur aus der Champagne kommen. "Rioja" nur aus der DOCa Rioja. "Tokaji" nur aus Tokaj. Wer diese Namen missbräuchlich verwendet, riskiert empfindliche Strafen. Die EU setzt diese Rechte weltweit durch (Handelsabkommen mit China, USA, Australien etc.).`,
        quiz: [
          { question: "Was ist der Unterschied zwischen DOC und DOCG in Italien?", options: ["Es gibt keinen Unterschied", "DOCG ist die höchste Qualitätsstufe mit staatlicher Banderole und strengeren Kontrollen", "DOC ist besser als DOCG", "DOCG gilt nur für Weißwein"], correct: 1, explanation: "DOCG (Denominazione di Origine Controllata e GARANTITA) ist die höchste Stufe. Das 'G' steht für 'Garantita' — jede Flasche trägt eine nummerierte staatliche Banderole als zusätzliche Qualitätsgarantie." },
          { question: "Was ist das Besondere am VDP-System in Deutschland?", options: ["Es ersetzt das Weingesetz", "Es ist eine private Lagenklassifikation nach burgundischem Vorbild (Gutswein → Ortswein → Erste Lage → Große Lage) — ergänzend zum staatlichen System aus Herkunftsregeln und Prädikaten", "Es gilt nur für Rotwein", "Es ist ein EU-System"], correct: 1, explanation: "Das VDP-System ist eine private Klassifikation der Top-Weingüter Deutschlands, die sich am burgundischen Terroir-Prinzip orientiert. Es ergänzt das staatliche System und klassifiziert Lagen statt Mostgewichte — ein Paradigmenwechsel." },
          { question: "Welche minimale Mostgewichtanforderung hat eine Trockenbeerenauslese?", options: ["67° Oechsle", "95° Oechsle", "110° Oechsle", "150° Oechsle"], correct: 3, explanation: "Trockenbeerenauslese erfordert mindestens 150° Oechsle — extrem konzentrierter Most von stark eingetrockneten, edelfaulen Beeren. Solch hohe Mostgewichte erreichen nur Trauben mit massivem Wasserverlust durch Botrytis cinerea." }
        ]
      },
      // Lektion 24
      {
        title: "Wein und Gesundheit",
        content: `**Wein und Gesundheit**: Wein enthält Alkohol und ist kein Arzneimittel. Die Deutsche Gesellschaft für Ernährung erklärt, dass es keine risikofreie Menge Alkohol gibt, und empfiehlt den Verzicht. Frühere Angaben vermeintlich sicherer Tagesmengen sind keine aktuelle Gesundheitsgarantie.

**Gesicherte Risiken**: Alkohol kann unter anderem Krebs, Lebererkrankungen und Abhängigkeit verursachen. Die WHO/IARC stuft alkoholische Getränke als für Menschen krebserregend ein. Diese Einstufung beschreibt die Sicherheit des Nachweises, nicht die Gleichheit aller Risiken oder Dosierungen.

**Keine Schutzwirkung versprechen**: Beobachtungen über Rotweinkonsum oder das sogenannte French Paradox beweisen keine ursächliche gesundheitliche Schutzwirkung des Weins. Auch Befunde zu einzelnen Polyphenolen rechtfertigen keine Empfehlung, dafür Alkohol zu trinken.

**Besonders wichtig**: Kinder und Jugendliche, Schwangere und Stillende sollen keinen Alkohol trinken. Bei Erkrankungen oder Medikamenten können zusätzliche Risiken bestehen; die individuelle Einordnung gehört in ärztliche beziehungsweise pharmazeutische Beratung.

**Sulfite und Beschwerden**: Sulfite müssen oberhalb von 10 mg/l gekennzeichnet werden. Kopfschmerzen lassen sich nicht pauschal einem einzelnen Inhaltsstoff zuschreiben. Wiederkehrende oder starke Beschwerden sollten medizinisch abgeklärt werden.`,
        quiz: [
          { question: "Was lässt sich aus Beobachtungen zum sogenannten French Paradox ableiten?", options: ["Dass Frankreich mehr exportiert als importiert", "Keine bewiesene ursächliche Schutzwirkung von Rotwein", "Dass französischer Wein teurer ist als deutscher", "Dass Frankreich mehr Weißwein produziert als Rotwein"], correct: 1, explanation: "Beobachtungsdaten und mögliche Störfaktoren beweisen keine gesundheitliche Schutzwirkung von Wein. Die DGE empfiehlt den Verzicht auf Alkohol." },
          { question: "Wie stuft die WHO/IARC Alkohol in Bezug auf Krebs ein?", options: ["Als unbedenklich", "Als Klasse-1-Karzinogen — nachgewiesen krebserregend beim Menschen", "Als möglicherweise krebserregend", "Es gibt keine Einstufung"], correct: 1, explanation: "Die Internationale Agentur für Krebsforschung (IARC) der WHO stuft Alkohol als Klasse-1-Karzinogen ein — die höchste Kategorie, die eine nachgewiesene Krebsverursachung beim Menschen bestätigt." },
          { question: "Wie sollte man Kopfschmerzen nach Weinkonsum einordnen?", options: ["Ausschließlich Sulfite", "Die Ursache ist nicht pauschal aus einem einzelnen Inhaltsstoff ableitbar", "Kohlensäure", "Die Traubensorte"], correct: 1, explanation: "Alkohol und unterschiedliche individuelle Faktoren können Beschwerden auslösen. Die Lektion erlaubt keine Ferndiagnose; wiederkehrende Beschwerden sollten medizinisch abgeklärt werden." }
        ]
      },
      // Lektion 25
      {
        title: "Die Zukunft des Weins — Klimawandel und Trends",
        content: `**Klima und Weinbau**: Hitzeperioden, Wassermangel und veränderte Reifezeiten beeinflussen die Arbeit im Weinberg. Die Folgen sind standort- und jahrgangsabhängig; eine einzige europäische Zahl für vorverlegte Ernten oder höhere Alkoholgehalte wäre zu pauschal.

**Anpassung**: Standort- und Sortenwahl, angepasste Bodenpflege, Beschattung und sorgfältiger Umgang mit Wasser sind mögliche Maßnahmen. Ob eine Region profitiert oder verliert, hängt auch von Extremwetter, Wasserversorgung und betrieblicher Anpassung ab.

**PIWI-Reben**: Pilzwiderstandsfähige Sorten wie Souvignier Gris, Muscaris, Cabernet Blanc und Solaris stammen aus Kreuzungszüchtung. Ihre Widerstandskraft gegen bestimmte Pilzkrankheiten kann Pflanzenschutzmaßnahmen reduzieren. Das DWI nennt bis zu 80 % weniger Maßnahmen; das ist keine pauschale Einspargarantie für jede Sorte, jedes Jahr und jeden Standort und bedeutet nicht völligen Verzicht auf Pflanzenschutz.

**Verpackung und Verfahren**: Leichtere Flaschen und alternative Verpackungen können Transport- und Materialaufwand verändern. Eine konkrete CO₂-Einsparung braucht eine nachvollziehbare Bilanz. Entalkoholisierung ist rechtlich geregelt: Die EU unterscheidet entalkoholisierten Wein mit höchstens 0,5 % Vol. von teilweise entalkoholisiertem Wein oberhalb dieser Grenze, aber unter dem Mindestalkohol der ursprünglichen Kategorie.

**Ausblick**: Technik und neue Rebsorten erweitern Möglichkeiten. Zukunftstrends sind keine zugesicherten Marktprognosen oder automatisch bessere Qualität.`,
        quiz: [
          {"question":"Was sind PIWI-Sorten?","options":["Besonders süße Desserttrauben","Pilzwiderstandsfähige Kreuzungszüchtungen, die Pflanzenschutzmaßnahmen je nach Bedingungen reduzieren können","Eine neue EU-Süßeklasse","Reben ohne jedes Krankheitsrisiko"],"correct":1,"explanation":"Das DWI nennt bis zu 80 % weniger Pflanzenschutzmaßnahmen. Der mögliche Umfang hängt von Sorte, Standort und Jahr ab; völliger Verzicht folgt daraus nicht."},
          {"question":"Warum gibt es keine pauschalen Klimawandel-Gewinner im Weinbau?","options":["Weil Klima bedeutungslos ist","Reifechancen, Wasserverfügbarkeit und Extremwetter wirken standortabhängig","Weil alle Regionen identisch sind","Weil nur die Flaschenfarbe zählt"],"correct":1,"explanation":"Veränderte Temperaturen können Reife ermöglichen, zugleich aber Hitze- und Wasserstress sowie andere Risiken verstärken."},
          {"question":"Welche EU-Grenze gilt für die Bezeichnung entalkoholisierter Wein?","options":["Immer exakt 0,0 % Vol.","Höchstens 0,5 % Vol.","Unter 5 % Vol.","Keine Alkoholgrenze"],"correct":1,"explanation":"Verordnung 1308/2013 unterscheidet entalkoholisiert bei höchstens 0,5 % Vol. von teilweise entalkoholisiert oberhalb dieser Grenze unter dem ursprünglichen Kategorie-Mindestalkohol."},
        ]
      },
    ],
    finalExam: [
      { question: "Wie unterscheidet sich die Herstellung von Weißwein und Rotwein fundamental?", options: ["Nur durch die Traubenfarbe", "Weißwein: Pressung VOR der Gärung (nur Saft gärt). Rotwein: Maischegärung (Saft + Schalen gären zusammen)", "Rotwein wird länger gelagert", "Weißwein enthält keinen Alkohol"], correct: 1, explanation: "Der entscheidende Unterschied: Weißwein wird vor der Gärung gepresst (nur der Most wird vergoren). Rotwein gärt zusammen mit den Schalen (Maischegärung) — dadurch werden Farbe, Tannin und Aromastoffe extrahiert." },
      { question: "Was ist TCA und wie beeinflusst es Wein?", options: ["Ein Vitaminsupplement", "2,4,6-Trichloranisol — verursacht den muffigen Korkton, wahrnehmbar bereits ab 2 Nanogramm/Liter", "Ein Rebsorten-Gen", "Ein Gärungszusatz"], correct: 1, explanation: "TCA (2,4,6-Trichloranisol) entsteht durch Schimmelpilze im Korken und ist bereits in 2 Nanogramm pro Liter wahrnehmbar. Es maskiert Fruchtaromen und gibt dem Wein einen muffigen Keller-/Karton-Geruch." },
      { question: "Was ist das Besondere an der Klassifikation von 1855 in Bordeaux?", options: ["Sie wird jährlich aktualisiert", "Sie hat historischen Bestand; Mouton Rothschild wurde 1973 zum Premier Cru aufgestuft", "Sie existiert nur für Weißwein", "Sie wurde 2000 abgeschafft"], correct: 1, explanation: "Die Klassifikation entstand zur Pariser Weltausstellung 1855. Ein bekannter späterer Aufstieg war Mouton Rothschild zum Premier Cru im Jahr 1973; dies ist nicht als einzige jemals erfolgte Änderung der gesamten Liste zu verstehen." },
      { question: "Welcher Aromastoff erzeugt das typische Petrol-Aroma bei gereiftem Riesling?", options: ["Resveratrol", "TDN (Trimethyldihydronaphthalin)", "Diacetyl", "4-MMP"], correct: 1, explanation: "TDN (1,1,6-Trimethyl-1,2-dihydronaphthalin) entsteht aus Carotinoiden in der Traubenschale während der Flaschenreifung und gibt gereiftem Riesling das typische Petrol/Kerosin-Aroma." },
      { question: "Was unterscheidet Barolo von Barbaresco?", options: ["Verschiedene Rebsorten", "Beide sind 100 % Nebbiolo, aber Barolo hat strengere Reifeanforderungen (38 vs. 26 Monate) und ist oft kräftiger", "Barolo ist Weißwein", "Sie kommen aus verschiedenen Ländern"], correct: 1, explanation: "Sowohl Barolo als auch Barbaresco bestehen zu 100 % aus Nebbiolo. Barolo erfordert mind. 38 Monate Reifung (davon 18 im Holz), Barbaresco mind. 26 Monate. Barolo ist tendenziell strukturierter und langlebiger." },
      { question: "Was ist das Solera-System?", options: ["Ein Gärungsverfahren für Bier", "Ein perpetuierendes Fass-Schicht-System beim Sherry, bei dem junger Wein durch ältere Stufen wandert", "Eine Rebschnitt-Methode", "Ein Klassifikationssystem"], correct: 1, explanation: "Beim Solera-System werden Fässer in Reihen (Criaderas) gestapelt. Wein wird aus der untersten Reihe (Solera) abgezogen und sukzessive aus den darüberliegenden nachgefüllt — ein fraktiöses Blending für konstante Qualität." },
      { question: "Was ist ein Qvevri und welche Weinart wird traditionell darin hergestellt?", options: ["Ein französisches Eichenfass für Bordeaux", "Eine georgische Tonamphore, die in der Erde vergraben wird — traditionell für Skin-Contact-Weißwein (Orange Wine)", "Ein italienischer Edelstahltank", "Ein spanisches Solera-Fass"], correct: 1, explanation: "Qvevri sind eiförmige Tongefäße für Gärung, Reifung und Lagerung von Wein. Die traditionelle georgische Praxis wurde 2013 in die Repräsentative UNESCO-Liste des immateriellen Kulturerbes aufgenommen." },
      { question: "Was bedeutet 'Große Lage' im VDP-System?", options: ["Eine besonders große Weinbergsfläche", "Die höchste Lagenklassifikation — das deutsche Äquivalent zum Grand Cru, nach burgundischem Vorbild", "Ein Marketingbegriff ohne Bedeutung", "Eine Bezeichnung für Bio-Weine"], correct: 1, explanation: "VDP Große Lage ist die Spitze des privaten Klassifikationssystems: Die besten Einzellagen Deutschlands, vergleichbar mit dem Grand Cru in Burgund. Trockene Weine aus Großen Lagen heißen 'Großes Gewächs' (GG)." },
      { question: "Warum sind PIWI-Sorten für die Zukunft des Weinbaus wichtig?", options: ["Weil sie besser schmecken", "Sie sind pilzwiderstandsfähig und können weniger Pflanzenschutzmaßnahmen benötigen — entscheidend für Nachhaltigkeit und Klimaanpassung", "Weil sie schneller wachsen", "Weil sie keinen Alkohol produzieren"], correct: 1, explanation: "Das DWI nennt bei PIWI bis zu 80 % weniger Pflanzenschutzmaßnahmen. Der tatsächliche Umfang hängt von Sorte, Standort und Jahr ab; daraus folgt keine automatisch bezifferte CO₂-Bilanz." },
      { question: "Welche Aussage zum Thema Wein und Gesundheit ist wissenschaftlich korrekt?", options: ["Täglich 2 Gläser Rotwein sind gesund", "Die WHO stuft Alkohol als Klasse-1-Karzinogen ein — es gibt keine wissenschaftlich gesicherte 'gesunde' Trinkmenge", "Resveratrol im Wein verhindert Krebs", "Weißwein ist gesünder als Rotwein"], correct: 1, explanation: "Die WHO/IARC stuft Alkohol als Klasse-1-Karzinogen ein. Die Global Burden of Disease Study (2018, Lancet) kam zum Schluss: 'Das sicherste Konsumniveau ist Null.' Wein ist ein Genussmittel, kein Medikament." },
    ],
  },

  schaumweinKurs,
  likoereKurs,

  // ═══════════════════════════════════════════════════════════
  // RUM-EXPERTE — Fortgeschrittenen-Kurs (25 Lektionen)
  // ═══════════════════════════════════════════════════════════
  {
    slug: "rum",
    title: "Rum-Experte",
    icon: "🥃",
    image: "/images/akademie/rum.png",
    description: "Von Zuckerrohr bis zum perfekten Cocktail — Geschichte, Herstellung, Stile und Genuss von Rum auf Weltklasse-Niveau.",
    color: "from-amber-700 to-amber-900",
    difficulty: "Fortgeschritten",
    duration: "ca. 50 Min.",
    lessons: [
      {
        title: "Was ist Rum? Definition und Grundlagen",
        content: `**Rum** ist eine Spirituose, die aus **Zuckerrohr-Erzeugnissen** destilliert wird — entweder aus **Melasse** (dem sirupartigen Nebenprodukt der Zuckerherstellung), aus **Zuckerrohrsaft** (frisch gepresst) oder selten aus **Zuckerrohrsirup** (eingekochter Saft). Anders als bei Whisky, Brandy oder Tequila gibt es für Rum **keine einheitliche internationale Definition** — die Vorschriften variieren erheblich je nach Herkunftsland, was die Kategorie gleichzeitig komplex und faszinierend macht.

**EU-Verordnung 2019/787**: Rum muss aus Zuckerrohr-Erzeugnissen destilliert werden, mindestens 37,5 % Vol. haben, und darf nicht aromatisiert werden. Zuckerkulör ist ausschließlich zur Farbanpassung erlaubt; eine Süßung zur Geschmacksabrundung ist bis zu 20 g/l, ausgedrückt als Invertzucker, zulässig. **US-TTB-Definition**: Rum = Spirituose aus fermentiertem Zuckerrohrsaft oder Melasse, bei weniger als 95 % Vol. destilliert, sodass das Destillat Geschmack und Charakter behält. **Herkunftsregeln**: Zusätzlich können nationale Vorschriften und konkrete geschützte Herkunftsbezeichnungen gelten. Ihre Bedingungen müssen einzeln geprüft werden.

**Die drei Grundkategorien**: **White/Silver/Blanco Rum**: Ungereift oder kurz gereift und dann kohlegefiltert (um Farbe zu entfernen). Frisch, leicht, ideal für Cocktails. **Gold/Amber/Dorado Rum**: Handelsübliche Farbbezeichnungen ohne weltweit einheitliche Mindestalter. Weicher, mit leichter Vanille und Karamellnote. **Dark/Aged/Añejo Rum**: Dunkle oder gereifte Stile; die genaue Reifung ergibt sich aus belegten Produktangaben, nicht aus der Farbe. Komplex, mit Noten von Vanille, Tabak, Trockenfrüchten, Gewürzen, Schokolade.

**Wichtige Unterscheidung — Alter vs. Farbe**: Farbe ist KEIN zuverlässiger Indikator für Alter! Viele Hersteller setzen **Karamellfarbe (E150a)** zu, um jungem Rum ein dunkles, "gereiftes" Aussehen zu geben. Umgekehrt wird mancher gut gereifte Rum kohlegefiltert und als weißer Rum verkauft (z. B. Don Q Cristal, Diplomatico Planas). **Solera** bezeichnet ein Verfahren der fraktionierten Vermählung unterschiedlich alter Destillate. In der EU darf eine Reifezeit oder ein Alter nur für den jüngsten alkoholischen Bestandteil angegeben werden. Eine große Zahl oder ein Markenname ist daher nicht automatisch eine rechtlich geprüfte Altersangabe.

**Alkoholstärke**: Standardabfüllung ist 40–43 % Vol. **Overproof** bezeichnet Rum über 50 % Vol. (z. B. 63 % bei Wray & Nephew White Overproof). **Cask Strength/Full Proof** bedeutet Abfüllung in Fassstärke ohne Wasser-Reduktion. **Navy Strength** bezeichnet heute häufig etwa 57 % Vol. Die historische britische Proof-Skala entspricht dabei ungefähr 100 Proof, nicht 114 British Proof. Die Bezeichnung ist keine Empfehlung, Alkohol anzuzünden.`,
        quiz: [
          { question: "Warum ist die Farbe bei Rum KEIN zuverlässiger Indikator für das Alter?", options: ["Weil Rum nicht altert", "Weil Karamellfarbe (E150a) zugesetzt werden kann und gereifter Rum kohlegefiltert werden kann", "Weil alle Rums gleich alt sind", "Weil die Farbe nur vom Fass kommt"], correct: 1, explanation: "Viele Hersteller setzen Karamellfarbe zu (junger Rum wirkt alt), während manche gut gereifte Rums kohlegefiltert werden und als weißer Rum verkauft werden. Farbe allein sagt nichts über die Qualität oder Reifung." },
          { question: "Was bedeutet 'Navy Strength' bei Rum?", options: ["Der Rum stammt von der Marine", "Heute häufig rund 57 % Vol.; eine historisch mit der Marine verbundene Stärke", "Der Rum wurde auf einem Schiff gereift", "Ein besonders milder Rum"], correct: 1, explanation: "Navy Strength liegt heute häufig bei rund 57 % Vol., beispielsweise Mount Gay Eclipse Navy Strength bei 57,1 %. Historische Proof-Skalen sind nicht mit US Proof gleichzusetzen; Feuerproben sind keine sichere Prüfung für zu Hause." },
          { question: "Aus welchen Rohstoffen kann Rum hergestellt werden?", options: ["Nur aus Melasse", "Aus Melasse, frischem Zuckerrohrsaft oder Zuckerrohrsirup", "Aus Getreide und Malz", "Aus Rübenmelasse"], correct: 1, explanation: "Rum kann aus verschiedenen Zuckerrohr-Erzeugnissen hergestellt werden: Melasse (am häufigsten, Nebenprodukt der Zuckerproduktion), frischer Zuckerrohrsaft (Rhum Agricole) oder eingekochter Zuckerrohrsirup (selten)." }
        ]
      },
      {
        title: "Geschichte des Rums — Piraten, Kolonien, Moderne",
        content: `**Die Ursprünge des Rums** sind untrennbar mit der Geschichte des Zuckerrohrs, der Kolonialisierung und dem Sklavenhandel verbunden. Zuckerrohr (*Saccharum officinarum*) hat nach Kew sein natürliches Herkunftsgebiet in Neuguinea und wurde von Kolumbus 1493 auf seiner zweiten Reise nach Hispaniola gebracht. In der karibischen Hitze gedieh das Zuckerrohr prächtig — und die Zuckerplantagen wurden zum Motor einer brutalen Plantagenwirtschaft.

**Rum im 17. Jahrhundert** entwickelte sich im Kontext kolonialer Zuckerwirtschaft und Versklavung. Fermentierbare Zuckerrohrprodukte konnten zu Alkohol vergoren und destilliert werden. Frühe Berichte sind lückenhaft; eine genaue Erfinderperson oder das Jahr 1640 als gesicherter weltweit erster Nachweis wird hier nicht behauptet.

**Das Dreieck des Handels (17.–18. Jh.)**: Rum wurde zum Schlüsselprodukt des transatlantischen Dreieckshandels: Melasse aus der Karibik → Rum-Destillation in Neuengland → Rum nach Westafrika → Sklaven in die Karibik. Die **Melassesteuer (Molasses Act, 1733)** und der **Sugar Act (1764)** erzürnten die Kolonisten und trugen zur Amerikanischen Revolution bei.

**Die Royal Navy und der Grog (1655–1970)**: 1655 eroberte Admiral Penn Jamaika für England. Rum wurde Teil der Marineversorgung; Anspruch, Menge und Zusammensetzung änderten sich im Lauf der Zeit. 1740 befahl Admiral Vernon (Spitzname "Old Grog" wegen seines Grogram-Mantels), den Rum mit Wasser zu verdünnen — der **Grog** war geboren. Die tägliche Rum-Ration wurde erst am **31. Juli 1970** abgeschafft — bekannt als **"Black Tot Day"**. Heutige Marken mit Marinebezug sind von den historischen Rationsbeständen zu unterscheiden.

**Rum im 19. und 20. Jahrhundert**: **Facundo Bacardí Massó** revolutionierte in Santiago de Cuba die Herstellung: Er entwickelte Kohlefiltration, Hefekultur-Isolierung und kontrollierte Reifung für leichten, eleganten Rum — Die Herstellerchronik nennt für 1979 einen damaligen Spitzenrang als internationale Premium-Spirituosenmarke; das ist keine aktuelle Weltmarktführerschaft. 1960 wurden die kubanischen Unternehmensvermögen enteignet, und Familienmitglieder gingen ins Exil. **Havana Club** blieb als kubanische Staatsmarke.

**Rum-Renaissance (2000er–heute)**: Rum erlebt eine beispiellose Renaissance. Rhum Agricole, jamaikanischer Pot-Still-Rum, gereifte Sipping Rums und unabhängige Abfüller (Velier, Planteray (früher Plantation), Foursquare) haben Rum auf das Niveau von Single Malt Whisky und Cognac gehoben. Richard Seale (Foursquare, Barbados), Luca Gargano (Velier) und Joy Spence (Appleton Estate — erste weibliche Master Blenderin der Spirituosenwelt) sind Schlüsselfiguren dieser Bewegung.`,
        quiz: [
          { question: "Was war der 'Black Tot Day'?", options: ["Ein Feiertag in der Karibik", "Der 31. Juli 1970 — der letzte Tag der täglichen Rum-Ration in der britischen Royal Navy", "Der Tag, an dem Rum erfunden wurde", "Ein Piratenfest"], correct: 1, explanation: "Am 31. Juli 1970 wurde die seit 1655 bestehende tägliche Rum-Ration der Royal Navy offiziell abgeschafft. Matrosen trugen schwarze Armbinden und hielten Schein-Beerdigungen ab." },
          { question: "Wer erfand den 'Grog'?", options: ["Ein Pirat namens Grog", "Admiral Vernon (1740), der befahl, den Rum mit Wasser zu verdünnen — sein Spitzname 'Old Grog' gab dem Getränk den Namen", "Ein kubanischer Barkeeper", "Charles Dickens"], correct: 1, explanation: "Admiral Edward Vernon befahl 1740, die tägliche Rum-Ration mit Wasser zu strecken, um Trunkenheit zu reduzieren. Sein Spitzname 'Old Grog' wurde zum Namen des Getränks." },
          { question: "Warum war Rum ein Faktor bei der Amerikanischen Revolution?", options: ["Die Briten verboten Rum komplett", "Der Molasses Act (1733) und Sugar Act (1764) besteuerten Melasse-Importe und erzürnten die Kolonisten", "Die Amerikaner wollten Whisky statt Rum", "Rum wurde in Frankreich hergestellt"], correct: 1, explanation: "Die britischen Steuern auf Melasse verteuerten die Rum-Produktion in den Kolonien drastisch und trugen zur Unzufriedenheit bei, die in die Revolution mündete." }
        ]
      },
      {
        title: "Rohstoffe: Melasse vs. Zuckerrohrsaft",
        content: `**Das Rohmaterial bestimmt den Charakter** — kein anderer Faktor prägt den Rum-Stil so fundamental wie die Wahl zwischen Melasse und Zuckerrohrsaft.

**Melasse (Molasses)** — ein häufig verwendeter Rum-Rohstoff, etwa bei BACARDÍ und Mount Gay. Melasse ist das dickflüssige, dunkle Nebenprodukt der Zuckerherstellung. Es gibt drei Qualitätsgrade: **Erste Melasse (Light/Fancy)**: Nach der ersten Kristallisation, hellste, süßeste. **Zweite Melasse (Dark)**: Nach der zweiten Kristallisation, dunkler. **Blackstrap Melasse**: Nach der dritten Kristallisation, sehr dunkel, bitter-süß, mineralreich — sie enthält auch nach der Zuckergewinnung vergärbare Bestandteile. Die Qualität der Melasse beeinflusst den Rum direkt: Verarbeitung und Fermentationsbedingungen sind ebenfalls entscheidend; der Rohstoff allein garantiert keine höhere Qualität.

**Zuckerrohrsaft (Vesou/Jus de Canne)** — Die Basis für **Rhum Agricole** und einige andere Stile. Frisch gepresster Zuckerrohrsaft enthält ca. 14–18 % Zucker, ist verderblich und muss innerhalb von Stunden nach der Ernte verarbeitet werden. Der Saft bringt grüne, grasige, blumige, florale Noten mit und erzeugt Rums mit einem völlig anderen Aromaprofil als Melasse-Rum. Die Zuckerrohrsorte, der Boden und das Klima beeinflussen den Saft unmittelbar — Terroir spielt bei Rhum Agricole eine entscheidende Rolle.

**Zuckerrohrsirup (Sirop de Canne/Honey)** — Eingekochter Zuckerrohrsaft, ein Mittelweg: Haltbarer als frischer Saft, aromatischer als Melasse. Verwendet von Ron Zacapa (Guatemala, "Miel de Caña"). Manche Rum-Puristen sehen dies kritisch, da die Herkunft weniger transparent ist.

**Zuckerrohr-Sorten und Ernte**: Die konkrete Sorte und ihre agronomischen Eigenschaften unterscheiden sich. Industrielle Hochleistungssorten maximieren den Zuckerertrag. Für Rhum Agricole werden teils traditionelle Sorten (wie Canne Bleue auf Martinique) angebaut, die weniger Zucker, aber mehr Aromakomplexität liefern. Die Ernte erfolgt maschinell (schneller, billiger) oder per Hand mit Machete (traditionell, für Rhum Agricole — erlaubt selektive Ernte). Die Verarbeitungsgeschwindigkeit ist entscheidend: Zuckerrohr beginnt nach dem Schneiden sofort an Zucker zu verlieren und zu fermentieren.`,
        quiz: [
          { question: "Was ist Blackstrap Melasse?", options: ["Eine Rumsorte", "Die dunkelste, bitterste Melasse nach der dritten Zuckerkristallisation — ein Rohstoff für die Rumherstellung", "Ein Cocktail-Zutat", "Eine Zuckerrohrsorte"], correct: 1, explanation: "Blackstrap Melasse entsteht nach der dritten und letzten Kristallisation bei der Zuckerherstellung — dunkel, bitter-süß und mineralreich, aber günstig und mit genug Zucker für die Rum-Produktion." },
          { question: "Warum muss Zuckerrohrsaft für Rhum Agricole so schnell verarbeitet werden?", options: ["Wegen eines Gesetzes", "Weil frisch gepresster Saft verderblich ist und innerhalb von Stunden unkontrolliert zu fermentieren beginnt", "Weil er gefriert", "Weil er seine Farbe verliert"], correct: 1, explanation: "Frischer Zuckerrohrsaft enthält natürliche Hefen und Bakterien. Bei karibischer Hitze beginnt die unkontrollierte Fermentation innerhalb weniger Stunden." },
          { question: "Warum spielt Terroir bei Rhum Agricole eine größere Rolle als bei Melasse-Rum?", options: ["Weil Rhum Agricole teurer ist", "Weil der frische Zuckerrohrsaft Boden, Klima und Sorte direkt widerspiegelt, während bei Melasse dieser Zusammenhang durch die Zuckerherstellung verdünnt wird", "Weil Terroir nur bei französischen Produkten gilt", "Weil die Fässer anders sind"], correct: 1, explanation: "Bei Rhum Agricole wird der frische Saft direkt vergoren — Boden, Klima und Sorte prägen das Destillat unmittelbar. Bei Melasse-Rum durchläuft der Rohstoff die industrielle Zuckerherstellung, die terroir-spezifische Nuancen verwischt." }
        ]
      },
      {
        title: "Rhum Agricole vs. industrieller Rum",
        content: `**Die fundamentale Unterscheidung** in der Rum-Welt verläuft zwischen **Rhum Agricole** (aus frischem Zuckerrohrsaft, französische Tradition) und **Rum Industriel/Traditionnel** (aus Melasse, englische und spanische Tradition).

**Rhum Agricole** — Ein klar geregeltes Beispiel ist die **AOC Martinique**. Sie regelt minutiös: Zugelassene Zuckerrohrsorten, Fermentationsdauer, Destillationsparameter (Kolonne, 65–75 % Vol.), Reifungsvorschriften. **Kategorien**: Blanc (Ruhe nach der Destillation ohne Holzkontakt), Élevé Sous Bois (mind. 12 Monate), VO (mind. 3 Jahre), VSOP (mind. 4 Jahre), XO/Hors d'Âge (mind. 6 Jahre). **Aromaprofil**: Grasig, blumig, frisch, pflanzlich, Zitrus.

**Top-Produzenten**: **Clément** (Martinique, elegant), **Neisson** (Martinique, intensiv, parfümiert — Blanc 52,5 % ist einer der besten weißen Rums), **JM** (Martinique, vulkanisch, mineralisch), **La Favorite** (Martinique, traditionell), **Damoiseau** (Guadeloupe), **Savanna** (Réunion, experimentell), **Clairin** (Haïti — artisanal, wild, aus frischem Saft).

**Rum Industriel/Traditionnel** — Stilrichtungen nach kolonialer Prägung: **Englische Tradition** (Jamaika, Barbados, Guyana, Trinidad): Schwerer, esterreicher, komplexer. Pot-Still-Destillation. Trockenfrüchte, Melasse, Gewürze, Leder. **Spanische Tradition** (Kuba, Puerto Rico, Venezuela, Guatemala, Panama, Dominikanische Rep.): Leichter, eleganter, weicher. Column-Still-Destillation. Vanille, Karamell, sanfte Süße. Oft mit Zuckerzusatz (kontrovers!). **Niederländische Tradition** (Curaçao, Surinam): Historisch schwerer Melasse-Rum.

**Süßung und Transparenz**: Süße beschreibt zunächst eine Wahrnehmung, nicht eine nachgewiesene Zutatenmenge. In der EU ist Rum-Süßung bis 20 g/l als Invertzucker zulässig. Zusätze sollten anhand belastbarer Produktinformationen oder geeigneter Laboranalysen eingeordnet werden; weder Herkunft noch Preis beweisen sie.`,
        quiz: [
          { question: "Was ist das Besondere an der AOC Martinique?", options: ["Es ist die größte Rum-Insel", "Die AOC regelt Martinique-Rhum aus Zuckerrohrsaft einschließlich Herstellung und Reifung", "Dort wird nur Melasse-Rum hergestellt", "Es ist ein Cocktail-Name"], correct: 1, explanation: "Die AOC Martinique betrifft Rhum Agricole aus Zuckerrohrsaft. INAO unterscheidet Blanc, Élevé Sous Bois und Vieux mit konkreten Produktionsbedingungen." },
          { question: "Was ist die Zuckerzusatz-Kontroverse bei Rum?", options: ["Rum enthält keinen Zucker", "Süßung und Altersangaben sollten transparent sein; für EU-Rum gilt eine Süßungsgrenze von 20 g/l", "Zucker wird nur bei weißem Rum zugesetzt", "Es geht um Zuckerrohranbau"], correct: 1, explanation: "Sensorische Süße beweist keinen bestimmten Zuckerzusatz. Die EU-Kategorie Rum erlaubt höchstens 20 g/l Süßung, ausgedrückt als Invertzucker; das Alter ist davon getrennt zu prüfen." },
          { question: "Was bedeutet 'VSOP' bei Rhum Agricole (AOC Martinique)?", options: ["Very Special Old Product", "Mindestens 4 Jahre Fassreifung", "Eine bestimmte Zuckerrohrsorte", "Very Sweet, Originally Pressed"], correct: 1, explanation: "Bei Rhum Agricole AOC Martinique bedeutet VSOP eine Mindestreifung von 4 Jahren im Eichenfass." }
        ]
      },
      {
        title: "Herstellungsprozess: Fermentation und Destillation",
        content: `**Die Fermentation** bestimmt den Charakter eines Rums stärker als Destillation oder Reifung. Hefestämme, Fermentationsdauer, Temperatur und die Zugabe von Dunder/Muck prägen das Aromaprofil fundamental.

**Hefestämme**: **Kulturhefen**: Kontrolliert, schnell (24–48 h Gärung), sauber. Typisch für leichte Rums (Bacardí, Havana Club). **Wilde/natürliche Hefen**: Spontangärung, langsamer (5–14+ Tage), mehr Ester (fruchtige, "funky" Aromen). Typisch für jamaikanischen Pot-Still-Rum. **Dunder**: Das Residuum der vorherigen Destillation (vergleichbar mit Sour Mash beim Bourbon), wird der frischen Wash zugesetzt, um Ester-Bildung zu fördern. **Muck/Muck Pit**: In Jamaika legendär — organisches Material verrottet in Gruben über Monate. Buttersäure-Bakterien (Clostridien) produzieren kurzkettige Fettsäuren, die bei der Destillation mit Alkohol zu extremen Estern reagieren: Die Quelle des jamaikanischen "Funk" und "Hogo".

**Marks am Beispiel Hampden**: Der Hersteller beschreibt unterschiedliche Destillatprofile mit Esterwerten in Gramm pro Hektoliter reinen Alkohols: OWH 40–80, LFCH 80–120, LROK 200–400, HLCF 400–600 und DOK 1500–1600. Diese producer-spezifischen Marks sind keine universelle Qualitätsrangliste.

**Destillation**: **Pot Still (Brennblase)**: Batch-Verfahren, schwerer, komplexer Rum. Bei einem Double-Retort-Pot-Still strömt Dampf aus der Brennblase durch zwei mit Flüssigkeit beschickte Retorten vor der Kondensation. Retorten sind keine zusätzlichen vollständigen Pot Stills. **Column/Continuous Still**: Kontinuierlich, leichteres, saubereres Destillat. **Single Column** (65–80 % Vol.) → mit Charakter. **Twin Column/Coffey** (85–90 % Vol.) → sauberer. **Multi-Column** (hoch rektifiziert, aber für EU-Rum unter 96 % Vol.) → fast neutral, ideal für weißen Rum. **Blend**: Die meisten Premium-Rums mischen Pot- und Column-Still-Destillate für Balance zwischen Komplexität und Eleganz.`,
        quiz: [
          { question: "Was ist 'Dunder' in der Rum-Herstellung?", options: ["Ein Gewürz", "Das Residuum aus der vorherigen Destillation, das zur frischen Wash zugesetzt wird — vergleichbar mit Sour Mash", "Ein Fasstyp", "Eine Rebsorte"], correct: 1, explanation: "Dunder enthält Säuren, tote Hefen und Nährstoffe. Zugesetzt zur neuen Wash reguliert er den pH-Wert und fördert die Ester-Bildung — Schlüssel zum jamaikanischen Rum-Charakter." },
          { question: "Was macht jamaikanischen 'Funky' Rum so besonders aromatisch?", options: ["Zugesetzter Fruchtsirup", "Muck Pits — Gruben mit verrottendem organischem Material, dessen Buttersäure-Bakterien extreme Ester-Bildung fördern", "Kohlensäurezusatz", "Besonders lange Reifung"], correct: 1, explanation: "Muck Pits erzeugen Clostridien-Bakterien, die kurzkettige Fettsäuren produzieren. Diese reagieren bei der Destillation mit Alkohol zu hochkomplexen Estern — die Quelle des jamaikanischen Funk." },
          { question: "Was misst die jamaikanische Ester-Klassifikation?", options: ["Den Alkoholgehalt", "Den Ester-Gehalt in Gramm pro Hektoliter reinen Alkohols — je höher, desto intensiver", "Das Alter des Rums", "Den Zuckergehalt"], correct: 1, explanation: "Jamaika klassifiziert Rum nach Ester-Gehalt (g/hlAA): Von Light (<80) bis Continental Flavoured (700–1600+). Hampden Estate erreicht über 1500 g/hlAA." }
        ]
      },
      {
        title: "Column Still vs. Pot Still bei Rum",
        content: `**Die Wahl der Destillationsapparatur** ist neben der Fermentation der wichtigste Einflussfaktor auf den Rum-Charakter.

**Pot Still** — Das älteste Verfahren. Wash wird chargenweise in kupfernen Brennblasen erhitzt, der Alkoholdampf im Kondensator verflüssigt. Die Auswahl von Vor-, Mittel- und Nachlauf beeinflusst Zusammensetzung und Stil. Die Sicherheit wird nicht durch eine vereinfachte Regel 'Methanol nur im Vorlauf' gewährleistet; dies ist keine Anleitung zum Destillieren. **Vorteile**: Maximale Aromenvielfalt, schwerer, charaktervoller Rum. **Jamaikanisches Retort-System**: Eine Brennblase mit zwei dampfbeheizten, flüssigkeitsgefüllten Retorten vor der Kondensation. Hampden Estate, Worthy Park und Long Pond verwenden dieses System.

**Column/Continuous Still (Coffey Still)** — 1831 von Aeneas Coffey patentiert. Kontinuierlicher Betrieb mit Analyser und Rectifier. **Vorteile**: Hohe Effizienz, konsistente Qualität. **Nachteile**: Weniger Kongenere bei hoher Rektifizierung. **Single Column**: 65–80 % Vol., mit deutlichem Charakter. **Twin Column**: 85–90 % Vol., sauberer. **Multi-Column** (3–5 Kolonnen): hoch rektifiziert, aber für EU-Rum unter 96 % Vol., fast neutral.

**Der Blend als Kunstform**: Die meisten Premium-Rums sind Blends aus Pot- und Column-Still-Destillaten. Der Pot-Still-Anteil liefert Komplexität und Tiefe, der Column-Still-Anteil Eleganz und Reinheit. **Mount Gay** (Barbados): Doppelt destillierter Pot Still + Column Still = ausgewogene, komplexe Rums. **Appleton Estate** (Jamaika): Verschiedene Marks (Ester-Stufen) aus Pot und Column Still werden von Master Blenderin Joy Spence verschnitten.

**Kupfer vs. Holz**: Standard ist Kupfer (entfernt Schwefelverbindungen, fördert Ester-Bildung). In Guyana existiert der letzte hölzerne Coffey Still der Welt (Enmore, ca. 1880) und ein hölzerner Doppel-Pot-Still (Port Mourant, ca. 1732). Diese historischen Apparate liefern eigene Destillatprofile. Der konkrete Charakter hängt auch von Gärung, Betriebsweise und Blend ab, nicht allein vom Werkstoff.`,
        quiz: [
          { question: "Was ist das jamaikanische Retort-System?", options: ["Ein Filtersystem", "Eine Brennblase mit zwei nachgeschalteten, flüssigkeitsgefüllten Retorten vor der Kondensation", "Ein Lagersystem", "Eine Gärmethode"], correct: 1, explanation: "Hampden verwendet Double-Retort-Pot-Stills. Die Retorten bewirken weitere Anreicherung vor dem Kondensator; sie sind nicht mit mehreren eigenständigen Pot Stills gleichzusetzen." },
          { question: "Warum werden Premium-Rums meist als Blend aus Pot und Column Still hergestellt?", options: ["Weil es gesetzlich vorgeschrieben ist", "Pot Still liefert Komplexität, Column Still Eleganz — zusammen entsteht ein ausgewogener Rum", "Weil Pot Still nicht genug Alkohol erzeugt", "Aus Kostengründen"], correct: 1, explanation: "Das Blending von Pot-Still (schwer, komplex) und Column-Still (leicht, sauber) gibt dem Blender die Möglichkeit, Balance zu schaffen." },
          { question: "Was ist der Nachteil einer Multi-Column-Destillation?", options: ["Sie ist zu langsam", "Das Destillat wird so rein (hoch rektifiziert, aber für EU-Rum unter 96 % Vol.), dass es kaum noch Charakter behält", "Sie erzeugt zu wenig Alkohol", "Sie ist nicht für Rum geeignet"], correct: 1, explanation: "Multi-Column-Stills destillieren auf hoch rektifiziert, aber für EU-Rum unter 96 % Vol. — sehr nahe an Neutralalkohol. Ideal für leichten weißen Rum, aber zu neutral für komplexe Sipping-Rums." }
        ]
      },
      {
        title: "Fassreifung tropisch vs. kontinental",
        content: `**Die Fassreifung** transformiert klaren New-Make-Spirit in komplexen, aromenreichen Rum. Der Ort der Reifung — tropisch oder kontinental — macht einen dramatischen Unterschied.

**Tropische Reifung** — Wärme kann Holzextraktion und Verdunstung beschleunigen. Hampden beschreibt für seine tropische Lagerung einen deutlich höheren Angel's Share als in Europa. Die tatsächlichen Verluste hängen von Standort, Luftfeuchtigkeit, Fass und Lagerhaus ab. Es gibt **keine feste Umrechnung** von tropischen in kontinentale Reifejahre; fünf Jahre in einem Klima sind nicht automatisch ein bestimmtes Alter in einem anderen.

**Kontinentale Reifung** — In kühleren Lagerhäusern verlaufen manche Reaktionen und Verdunstung anders. Ob der Rum dadurch besser, subtiler oder komplexer wird, ist keine allgemeine Regel. Manche unabhängigen Abfüller lassen Rum ganz oder teilweise in Europa reifen; andere, etwa das Projekt Habitation Velier, setzen gezielt auf tropische Reifung.

**Fasstypen**: **Ex-Bourbon** (American White Oak, 200 l): Standard (ca. 80 %). Vanille, Karamell, Kokos, Toast. **Ex-Cognac** (French Oak): Trockenfrucht, Nuss, elegante Tannine. Plantation nutzt Cognac-Finish. **Ex-Sherry** (Oloroso, PX): Dunkle Frucht, Rosinen, Schokolade, Gewürze. **Virgin Oak**: Intensivste Extraktion — Vanille, Gewürze, Tannin. **Ex-Port, Madeira, Wein, Whisky**: Für Finishes.

**Solera bei Rum**: Mehrere Altersstufen werden fortlaufend vermählt. Das Verfahren allein verrät weder Mindest- noch Durchschnittsalter. Für eine Altersangabe in der EU zählt nach Verordnung 2019/787 der jüngste alkoholische Bestandteil; eine Zahl auf dem Etikett muss von einer tatsächlichen Altersangabe unterschieden werden.

**Single Cask und Cask Strength**: Single Cask bezeichnet die Herkunft aus einem einzelnen Fass, Cask Strength die Abfüllung in Fassstärke. Daraus folgt nicht automatisch, dass ein Produkt ungefärbt, ungesüßt oder ungefiltert ist. Solche Eigenschaften müssen separat belegt werden.`,
        quiz: [
          { question: "Was beeinflusst den Angel's Share bei der Rum-Reifung?", options: ["Weil die Fässer undicht sind", "Klima, Fass und Lagerhaus beeinflussen die Verdunstung", "Weil Rum schneller verdunstet als Whisky", "Wegen der Sonneneinstrahlung"], correct: 1, explanation: "Tropische Lagerung kann hohe Verdunstungsverluste verursachen. Ein einheitlicher Jahreswert für alle karibischen Rums wäre jedoch irreführend." },
          { question: "Wie verhält sich tropische zu kontinentaler Reifung?", options: ["Kein Unterschied", "Es gibt keine feste Umrechnung; Klima, Fass und Lagerung verändern die Reifung", "Kontinental ist schneller", "Tropisch verhindert Reifung"], correct: 1, explanation: "Wärme verändert die Reifung, macht aber eine pauschale Altersumrechnung nicht möglich." },
          { question: "Was ist problematisch an Solera-Altersangaben bei Rum?", options: ["Solera ist verboten", "Eine Etikettzahl darf nicht ungeprüft als Mindestalter verstanden werden; in der EU zählt der jüngste Bestandteil", "Solera-Rum schmeckt schlecht", "Das System funktioniert bei Rum nicht"], correct: 1, explanation: "Ein Solera-Verfahren legt kein bestimmtes Mindestalter fest. Eine Altersangabe muss in der EU auf den jüngsten alkoholischen Bestandteil bezogen sein." }
        ]
      },
      {
        title: "Jamaika — Funky und vollmundig",
        content: `**Jamaika** genießt unter Rum-Kennern den größten Kultstatus. Der typische Stil ist schwer, esterreich, "funky" — mit Aromen von tropischer Frucht bis Lack und reifem Käse.

**Herkunft und Marks**: Wray & Nephew nennt für sein Produkt die Jamaica Rum GI. Die konkreten Schutzbedingungen sind von Produzentenangaben zu unterscheiden. Hampdens eigene Marks beschreiben verschiedene Ester- und Herstellungsprofile.

**Die großen Destillerien**: **Appleton Estate** (Nassau Valley, seit 1749): Joy Spence als Master Blenderin. Pot und Column Still. Ausgewogen, elegant, fruchtig-würzig. Flaggschiffe: 12, 15, 21, 50 Year Old. **Hampden Estate** (Trelawny, seit 1753): Nur Pot Still mit Retort-System. Marks bis DOK (1500+ g/hlAA). Tropische Fruchtbombe, Lack, Banane, Ananas — für Kenner unvergleichlich. **Worthy Park** (St. Catherine, seit 1670): Eigene Zuckerrohrfelder, Zuckerfabrik, Destillerie. Fruchtiger, etwas zugänglicher. **Long Pond** (Trelawny, seit 1753): Historisch für Continental-Flavoured-Marks berühmt. Beliefert Velier mit legendären Abfüllungen.

**Das "Hogo"**: Jamaikanischer Begriff für den intensiven Geruch hochesteriger Rums — von französisch "haut goût". Überreife tropische Frucht, Nagellack, Lack, feuchte Erde, Käse, Funk. Für Enthusiasten das ultimative Qualitätsmerkmal.

**Wray & Nephew White Overproof** (63 %): DER Nationalrum Jamaikas — pur, in Cocktails ; er ist kein zugelassenes Desinfektionsmittel. Essentiell für jamaikanischen Rum-Punsch.`,
        quiz: [
          { question: "Was bedeutet 'Hogo' im jamaikanischen Rum-Kontext?", options: ["Ein Cocktailname", "Der intensive Geruch hochesteriger Rums — von französisch 'haut goût'", "Eine Destillationstemperatur", "Ein Fasstyp"], correct: 1, explanation: "Hogo (von 'haut goût') beschreibt den intensiven Charakter hochesteriger Rums: Überreife tropische Frucht, Lack, Banane, Funk." },
          { question: "Was ist das Besondere an Hampden Estate?", options: ["Es produziert nur leichten Rum", "Es destilliert ausschließlich mit Pot Still und Retort-System und erzeugt Rums mit 1500+ g/hlAA Estern", "Es ist die jüngste Destillerie Jamaikas", "Es stellt nur weißen Rum her"], correct: 1, explanation: "Hampden verwendet ausschließlich Pot Stills mit Retort-System und erzeugt Marks bis 1500–1600 g/hlAA — extrem esterreich und für Kenner unvergleichlich." },
          { question: "Wer ist Joy Spence?", options: ["Eine Cocktail-Erfinderin", "Die Master Blenderin von Appleton Estate — erste weibliche Master Blenderin der Spirituosenwelt", "Eine jamaikanische Politikerin", "Eine Zuckerrohr-Züchterin"], correct: 1, explanation: "Joy Spence wurde 1997 zur Master Blenderin von Appleton Estate ernannt — als erste Frau in dieser Position weltweit." }
        ]
      },
      {
        title: "Barbados — Elegant und ausgewogen",
        content: `**Barbados** hat eine frühe Rumtradition im Kontext der kolonialen Zuckerwirtschaft. Ein bestimmtes Jahr als gesicherter weltweit erster Destillationsnachweis wird hier nicht behauptet. Barbadischer Rum steht für Balance, Eleganz und Raffinesse.

**Herkunftsschutz**: Auf Barbados gibt es Diskussionen über eine gemeinsame geschützte Herkunft. Daraus darf keine bereits seit 2021 geltende GI-Regel abgeleitet werden. Für eine rechtliche Schutzbehauptung ist der aktuelle Registereintrag mit Produktspezifikation entscheidend.

**Foursquare** (St. Philip): Ein bekannter barbadischer Rum-Produzent. Richard Seale produziert mit Pot Still (2× destilliert) + Column Still. Die **ECS-Serie** hat Kultstatus — keine Süßung, keine Zusätze, ehrliche Altersangaben. Stile: Doorly's (hervorragendes Preis-Leistungs-Verhältnis), R.L. Seale's 10, Foursquare ECS (2004–2007, Sagacity, Empery, Nobiliary, Sovereignty).

**Mount Gay** (St. Lucy, seit 1703): Die älteste dokumentierte Rum-Destillerie der Welt. Pot und Column Still. Stile: Eclipse, Black Barrel, XO, 1703 Master Select. Klassischer, ausgewogener barbadischer Stil.

**Weitere**: **St. Nicholas Abbey** (historisches Anwesen, heutige Rumproduktion mit eigenem Zuckerrohr), **West Indies Rum Distillery** (produziert für diverse Marken).

**Barbadischer Stil**: Mittlerer Körper, ausgewogene Komplexität, tropische und getrocknete Frucht, Vanille, Gewürze, dezentes Holz. Diese sensorischen Stilbeschreibungen sind keine weltweite Rangliste.`,
        quiz: [
          { question: "Warum gilt Barbados als 'Geburtsinsel des Rums'?", options: ["Weil Zucker dort erfunden wurde", "Die frühesten Aufzeichnungen über Rum-Destillation (ca. 1640) stammen von Barbados", "Weil es die größte Insel ist", "Marketing-Trick"], correct: 1, explanation: "Die frühesten dokumentierten Beschreibungen der Rum-Herstellung stammen von Barbados (ca. 1640)." },
          { question: "Was macht Foursquare unter Rum-Kennern so besonders?", options: ["Niedrigster Preis", "Kompromisslose Transparenz (kein Zucker, keine Zusätze, ehrliche Altersangaben) und herausragende ECS-Serie", "Größte Produktionsmenge", "Nur weißer Rum"], correct: 1, explanation: "Foursquare unter Richard Seale steht für kompromisslose Qualität und Transparenz. Einzelne Abfüllungen sind anhand ihrer konkreten Herstellungs- und Produktangaben zu beurteilen; Bewertungen sind keine gesetzliche Qualitätsklasse." },
          { question: "Seit wann ist Mount Gay dokumentiert?", options: ["Seit 2003", "Seit 1703 — älteste dokumentierte Rum-Destillerie der Welt", "Seit 1850", "Seit 1492"], correct: 1, explanation: "Mount Gay ist seit 1703 dokumentiert und damit die älteste nachweislich existierende Rum-Destillerie der Welt." }
        ]
      },
      {
        title: "Kuba und Puerto Rico — Leichte Eleganz",
        content: `**Der "spanische Stil"** — leicht, elegant, zugänglich — wurde in Kuba und Puerto Rico definiert. Beide setzen auf Column-Still-Destillation, Kohlefiltration und kontrollierte Reifung.

**Kuba**: **Facundo Bacardí Massó** revolutionierte die Herstellung: Kohlefiltration, Hefekultur-Isolierung und kontrollierte Reifung für leichten, sauberen Rum. Bacardí wurde die meistverkaufte Spirituosenmarke. Nach der Revolution 1959 ins Exil; **Havana Club** blieb als Staatsmarke. Der **Maestro Ronero** (Rum-Meister) ist eine kubanische Institution.

**Puerto Rico**: Heimat von **Bacardí** (weltweit größte Rum-Destillerie in Cataño). **Don Q** (Destilería Serrallés, seit 1865): Lokaler Favorit. Don Q Cristal (kohlegefilterter gereifter Rum) und Don Q Gran Añejo sind hervorragend. **Ron del Barrilito** (seit 1880, Sherry-Fässer): Bestgehütetes Geheimnis Puerto Ricos.

**Cocktail-Geschichte**: **Daiquiri** (60 ml Rum, 25 ml Limette, 15 ml Zucker, geschüttelt) und **Mojito** (Rum, Limette, Zucker, Minze, Soda) sind Kubas Beiträge. Der **Hemingway Daiquiri** (doppelter Rum, Grapefruit statt Zucker, Maraschino) entstand im El Floridita in Havanna.`,
        quiz: [
          { question: "Welche Innovation machte Bacardí zum Revolutionär?", options: ["Er erfand den Pot Still", "Er entwickelte Kohlefiltration, Hefekultur-Isolierung und kontrollierte Reifung für leichten, eleganten Rum", "Er erfand die Column Still", "Er mischte Rum mit Cola"], correct: 1, explanation: "Facundo Bacardí entwickelte in den 1850er/60er Jahren Verfahren zur Kohlefiltration, isolierte Hefestämme und perfektionierte die kontrollierte Reifung." },
          { question: "Was ist ein 'Maestro Ronero'?", options: ["Ein Cocktail", "Der kubanische Titel für den Rum-Meister — vergleichbar mit dem Maître de Chai bei Cognac", "Ein Zuckerrohr-Bauer", "Ein Fasstyp"], correct: 1, explanation: "Der Maestro Ronero ist in Kuba eine hochangesehene Position — er überwacht Fermentation, Destillation, Reifung und Blending." },
          { question: "Was war der Hemingway-Daiquiri?", options: ["Hemingway mochte keinen Rum", "Doppelter Rum, Grapefruit statt Zucker, Maraschino-Likör — für den Diabetiker Hemingway", "Hemingway erfand den Rum", "Hemingway trank nur Whisky"], correct: 1, explanation: "Hemingway war Diabetiker und mochte keinen Zucker. Sein Spezial: Doppelter Rum, Limette, Grapefruit, Maraschino — der 'Papa Doble'." }
        ]
      },
      {
        title: "Guyana und Demerara — Schwer und komplex",
        content: `**Guyana** produziert einige der komplexesten, schwersten Rums der Welt. Heute konzentriert sich alles auf **Diamond Distillery** (Demerara Distillers Limited/DDL).

**Heritage Stills**: Diamond hat die Apparate geschlossener Destillerien gesammelt: **Enmore Wooden Coffey Still (EHP)**: Letzter hölzerner Coffey Still der Welt (ca. 1880). Schwer, ölig, einzigartig. **Port Mourant Double Wooden Pot Still (PM)**: Holz-Pot-Still (ca. 1732). Tropische Frucht, Lakritze, Gewürze — einer der begehrtesten Stile. **Versailles (VSG)**: Holz-Pot-Still, fruchtiger, floraler. **Savalle (SV)**: Französische Kolonne, mittelschwer. **Diamond Coffey (SVW)**: Moderner Coffey Still, leichter.

**Luca Gargano und Velier**: Der italienische Importeur erkannte das Potenzial und füllt Single-Cask-Abfüllungen ab, die den jeweiligen Still benennen: "Port Mourant 1997", "Enmore 1995". Diese Velier-Demerara-Abfüllungen haben Kultstatus.

**El Dorado**: DDLs Hauptmarke. 3, 5, 8, 12, 15, 21, 25 Year Old. **Transparenz**: Rezeptur und Produktspezifikation können sich ändern. Ohne chargenbezogene Primärdaten wird hier keine bestimmte Zuckerzugabe behauptet.

**Demerara-Stil**: Schwer, ölig, komplex. Aromen: Trockenfrüchte, Melasse, dunkle Schokolade, Lakritze, Gewürze, Leder, Tabak. Der "Barolo des Rums".`,
        quiz: [
          { question: "Was ist das Besondere an der Diamond Distillery?", options: ["Größte der Welt", "Sie beherbergt Destillationsapparate mehrerer geschlossener historischer Destillerien", "Nur weißer Rum", "Nur Zuckerrohrsaft"], correct: 1, explanation: "Diamond hat die historischen Stills geschlossener Plantagen-Destillerien gesammelt — darunter den letzten hölzernen Coffey Still der Welt." },
          { question: "Was ist der Enmore Wooden Coffey Still?", options: ["Moderne Edelstahl-Kolonne", "Letzter funktionsfähiger hölzerner Coffey Still der Welt (ca. 1880) — schwerer, öliger Rum", "Cocktail-Shaker", "Gärmethode"], correct: 1, explanation: "Enmore ist eine historische hölzerne Coffey-Anlage mit eigener Prozessführung. Ein bestimmter Geschmack lässt sich nicht allein auf Holz als Baumaterial zurückführen." },
          { question: "Welche Rolle spielt Luca Gargano (Velier)?", options: ["Besitzer von DDL", "Er erkannte das Potenzial der Heritage Stills und füllt legendäre Single-Cask-Abfüllungen ab", "Er erfand Demerara-Rum", "Er produziert Rum in Italien"], correct: 1, explanation: "Gargano begann in den 2000er Jahren, die einzelnen Heritage Stills als separate Single-Cask-Abfüllungen zu vermarkten — damit löste er den Demerara-Kult aus." }
        ]
      },
      {
        title: "Martinique und Guadeloupe — Französische Tradition",
        content: `**Martinique** ist das Flaggschiff des Rhum Agricole. Die AOC regelt minutiös: Zuckerrohrsorten, Erntezeitraum, Fermentation, Destillation (Kolonne, 65–75 % Vol.), Reifung. Vulkanische Terroirs (Mont Pelée) bieten verschiedene Profile.

**Destillerien**: **Clément** (elegant, raffiniert), **Neisson** (intensiv, parfümiert — Blanc 52,5 % einer der besten weißen Rums), **JM** (vulkanisch, mineralisch), **La Favorite** (traditionell), **HSE** (innovativ, Cask Finishes), **Saint James** (größte Destillerie).

**Guadeloupe**: **Damoiseau** (größter Agricole-Produzent), **Longueteau** (innovative Einzellagen). **Marie-Galante** (Bielle, Bellevue, Poisson): Artisanal, rustikal, höherer Alkoholgehalt.

**Blanc-Rum-Kultur**: In der französischen Karibik wird Rhum Blanc als eigenständiges Premium-Produkt geschätzt — pur als **Ti' Punch** (Rhum, Zuckerrohrsirup, Limette). Die besten Blancs sind sensorische Erlebnisse auf höchstem Niveau.

**Haïti — Clairin**: Technisch kein Agricole, aber aus frischem Saft, artisanal, wild, mit natürlichen Hefen. Luca Gargano (Velier) hat Clairin international bekannt gemacht. Produzenten: Sajous, Vaval, Le Rocher, Casimir.`,
        quiz: [
          { question: "Was ist ein Ti' Punch?", options: ["Großer Cocktail", "Rhum Agricole Blanc, Zuckerrohrsirup und Limette — DER Drink der französischen Karibik", "Englischer Punsch", "Tee mit Rum"], correct: 1, explanation: "Ti' Punch = Rhum Blanc (50–55 %), Sirop de Canne, frische Limette. Schlicht und perfekt." },
          { question: "Warum ist Rhum Blanc ein Premium-Produkt?", options: ["Künstlich verteuert", "Der frische Zuckerrohrsaft-Charakter bei hoher Trinkstärke bietet ein eigenständiges sensorisches Erlebnis", "Weil er selten ist", "Weil er alt ist"], correct: 1, explanation: "Die besten Blancs zeigen den puren Charakter des Zuckerrohrsafts — grasig, blumig, mineralisch — bei 50–62 % Vol." },
          { question: "Was ist Neisson?", options: ["Größte Destillerie der Welt", "Kleine Familiendestillerie am Mont Pelée mit intensivem, parfümiertem Rhum Agricole — Blanc 52,5 % hat Weltruf", "Nur Likör", "Neue Destillerie aus 2020"], correct: 1, explanation: "Neisson ist eine kleine, familiengeführte Destillerie in Le Carbet mit Weltruf für ihren intensiven, kräuterig-parfümierten Rhum Agricole." }
        ]
      },
      {
        title: "Guatemala, Panama, Venezuela — Lateinamerikanische Stile",
        content: `**Lateinamerika** jenseits der Karibik folgt der "spanischen Tradition": Column-Still, weicher, zugänglicher — aber auch mit der Zuckerzusatz-Kontroverse.

**Guatemala**: **Ron Zacapa** (Diageo): Destilliert aus Zuckerrohrsirup ("Miel de Caña"), gereift auf 2.300 m Höhenlage, Solera-System. Komplex und weich beschrieben; eine konkrete Zuckerzugabe lässt sich daraus nicht ableiten. **Botran**: Ähnlich, etwas günstiger.

**Panama**: **Ron Abuelo** (seit 1908): Guter, zugänglicher Rum. Finish Collection (Oloroso, Port) zeigt Ambition.

**Venezuela**: **Diplomático Reserva Exclusiva**: Weich, süß und vanillig beschrieben; keine hier belegte chargenbezogene Zuckerangabe. Ideal für Einsteiger. **Santa Teresa 1796**: Echtes Solera-System, moderater Zucker. Betreibt "Proyecto Alcatraz" — Sozialreintegration für Ex-Gang-Mitglieder.

**Dominikanische Rep.**: **Brugal** — Häufig als trocken beschrieben; das ist keine analytische Rangliste der ganzen Region.

**Fazit**: Lateinamerikanische Rums sind oft der Einstieg — zugänglich, weich, süß. Fortgeschrittene sollten auf transparente Produzenten achten und sich bewusst sein, dass viele signifikant gesüßt sind.`,
        quiz: [
          { question: "Warum reift Ron Zacapa auf 2.300 m Höhe?", options: ["Marketing", "Kühle Höhenluft verlangsamt die Reifung und reduziert Angel's Share", "Zuckerrohr wächst dort", "Druck"], correct: 1, explanation: "Die langsamere Reifung in der Höhe reduziert den Angel's Share und fördert subtilere Aromenentwicklung." },
          { question: "Was ist 'Proyecto Alcatraz'?", options: ["Rum-Festival", "Sozialprogramm von Santa Teresa für Ex-Gang-Mitglieder", "Cocktail-Wettbewerb", "Rum-Linie"], correct: 1, explanation: "Santa Teresa betreibt seit 2003 dieses preisgekrönte Sozialprogramm, bei dem Ex-Gang-Mitglieder Ausbildung in der Destillerie erhalten." },
          { question: "Welcher lateinamerikanische Produzent ist für trockenen Stil bekannt?", options: ["Diplomático", "Ron Zacapa", "Brugal (Dominikanische Republik)", "Dictador"], correct: 2, explanation: "Brugal wird häufig als trocken beschrieben. Für konkrete Zuckerwerte braucht es geeignete Produkt- oder Analysedaten." }
        ]
      },
      {
        title: "Rum aus Mauritius, Indien, Philippinen",
        content: `**Rum jenseits der Karibik** — Die Rum-Welt ist global. Asien und der Indische Ozean produzieren faszinierende Rums.

**Mauritius**: **Chamarel** (Rhum Agricole, Pot Still, elegant), **Labourdonnais** (historische Plantage), **New Grove** (Melasse-basiert, gut gereift), **St. Aubin** (kleine Familienproduktion).

**Réunion**: **Savanna** (HERR ist ein High-Ester-Rum aus langer Melassefermentation und Pot-Still-Destillation), **Isautier** (seit 1845), **Rivière du Mât** (größter Produzent).

**Indien**: Rum wird auch für einen großen lokalen Markt produziert; ohne datierte Statistik wird hier kein weltweiter Rang behauptet. **Amrut** (Bangalore, hochklassig), **Paul John** (Goa), **Old Monk** (Kultstatus, seit 1954).

**Philippinen**: **Don Papa** (Marketing-Phänomen, süß, umstritten), **Tanduay** (philippinische Rum-Marke).

**Thailand**: **Chalong Bay** (Phuket, Rhum Agricole aus thailändischem Zuckerrohrsaft — einer der spannendsten neuen Produzenten).

**Japan**: **Nine Leaves** (Shiga, experimentell), **Cor Cor** (Okinawa).

**Australien**: **Bundaberg** ("Bundy", volkstümlich), **Beenleigh** (seit 1884), **Husk Distillers** (Agricole-Stil).`,
        quiz: [
          { question: "Welches dieser Länder liegt außerhalb der Karibik und besitzt einen großen eigenen Rum-Markt?", options: ["Jamaika", "Kuba", "Indien", "Brasilien"], correct: 2, explanation: "Indien besitzt einen eigenen Rum-Markt. Eine Behauptung zum weltweiten Produktionsrang würde eine datierte und vergleichbare Statistik benötigen." },
          { question: "Was ist das Besondere an Savanna aus Réunion?", options: ["Größte Destillerie", "HERR: High-Ester-Rum aus langer Melassefermentation und Pot-Still-Destillation", "Nur Melasse", "Älteste Destillerie"], correct: 1, explanation: "Velier beschreibt HERR als High-Ester-Rum nach langer Melassefermentation und Pot-Still-Destillation. Ein zahlenloser 'Ester'-Wert wäre ohne Einheit und Analyse unpräzise." },
          { question: "Was ist Chalong Bay?", options: ["Strandresort", "Rhum-Agricole-Destillerie auf Phuket aus thailändischem Zuckerrohrsaft", "Rum-Bar", "Cocktail"], correct: 1, explanation: "Chalong Bay zeigt das Potenzial für Terroir-Rum außerhalb traditioneller Herkunftsregionen." }
        ]
      },
      {
        title: "Navy Rum und Overproof",
        content: `**Navy Rum** bezieht sich auf die historische Royal-Navy-Versorgung. Rationen und Mischungen änderten sich über die Zeit; die tägliche Royal-Navy-Rumration endete am 31. Juli 1970.

**Navy Strength**: Heute häufig rund 57 % Vol.; Mount Gay nennt 57,1 %. Historische Marine-Rum-Mischungen hatten nicht zu jeder Zeit dieselbe Stärke. Die britische und US-amerikanische Proof-Skala dürfen nicht verwechselt werden.

**Moderne Navy Rums**: **Pusser's** und **Black Tot** (moderne Marken mit Bezug auf Marinegeschichte), **Smith & Cross** (Jamaika, 57 %, intensiv funky — essentiell für Tiki), **Rum Fire** (Hampden, 63 %, extrem esterreich).

**Overproof Rum** (die jeweilige Proof-Skala und der tatsächliche Alkoholgehalt sind zu beachten): **Wray & Nephew White Overproof** (Jamaika, 63 %) — DER Nationalrum. **Planteray OFTD** (früher Plantation) (69 %, Jamaika/Guyana/Barbados). **Lemon Hart 151** (75,5 %, klassisch für Tiki).

**Sicherheit**: Hochprozentigen Alkohol von Hitze, Funken und offenen Flammen fernhalten. Drinks nicht anzünden. Die kleinere Menge eines starken Rums kann bereits viel Alkohol enthalten; Wasser senkt bei unveränderter Rummenge nicht die insgesamt enthaltene Alkoholmenge.`,
        quiz: [
          { question: "Welche Aussage über heutige Navy-Strength-Abfüllungen trifft zu?", options: ["Geschmack", "Sie liegen häufig rund um 57 % Vol.; das ist keine Anleitung für Feuerproben", "Tradition", "Alkohol gefriert bei 57 %"], correct: 1, explanation: "Mount Gay Eclipse Navy Strength hat 57,1 % Vol. Daraus folgt kein stets identischer Alkoholgehalt aller historischen Marine-Rums." },
          { question: "Was ist Smith & Cross?", options: ["Englischer Whisky", "Jamaikanischer 57 %-Pot-Still-Rum mit intensivem Funk — essentiell für Tiki-Cocktails", "Rum aus Venezuela", "Likör"], correct: 1, explanation: "Smith & Cross ist reiner jamaikanischer Pot-Still-Rum mit 57 % Vol.: Intensiv funky, esterreich, komplex — Schlüssel-Ingredient für Tiki." },
          { question: "Was ist Pusser's Rum?", options: ["Kubanischer Rum", "Moderne Marke mit Bezug auf historische Marine-Rumtradition", "Rum-Cocktail", "Alkoholfreier Rum"], correct: 1, explanation: "Pusser's verweist auf historische Marine-Rumtradition. Daraus folgt kein Beleg einer unveränderten Originalmischung sämtlicher Epochen." }
        ]
      },
      {
        title: "Spiced Rum und aromatisierter Rum",
        content: `**Spiced** und **Flavoured** sind Vermarktungs- und Stilbegriffe für aromatisierte Produkte. Wichtige Unterscheidung: **Spiced Rum** (mit Gewürzen), **Flavoured Rum** (mit Frucht), **Rum-Likör** (mit Zucker, niedrigerer Alkohol).

**Große Marken**: **Captain Morgan Spiced** (ein bekannter Markenname), **Sailor Jerry** (40 %, würziger), **The Kraken** (dunkel, intensiv, Lakritze), **Bumbu** (süß, vanillig).

**Handwerklich**: **Planteray Pineapple "Stiggins' Fancy"** (früher Plantation) — Victoria-Ananas in dunklem Rum mazeriert, Schalen in weißem Rum — ein anderes Niveau.

**EU-Regelung 2019/787**: Die Kategorie Rum darf nicht aromatisiert werden. Eine Süßung zur Geschmacksabrundung ist jedoch bis zu **20 g/l**, ausgedrückt als Invertzucker, zulässig. Aromatisierte Produkte brauchen eine andere zulässige rechtliche Bezeichnung; welche das ist, hängt von der Zusammensetzung ab. Ein Vermarktungsname wie "Spiced" ersetzt nicht die rechtliche Bezeichnung.

**Beratung**: Spiced Rum ist ein exzellenter Einstieg und vielseitiges Cocktail-Ingredient. Zum Vergleichen bieten sich auch ungesüßte, gereifte Rums an. Fassnoten und zugesetzte Aromen ergeben unterschiedliche Stile; daraus folgt keine universelle Überlegenheit.`,
        quiz: [
          { question: "Welche Abgrenzung gilt für die Kategorie Rum in der EU?", options: ["Overproof", "Rum darf nicht aromatisiert werden; Süßung ist bis 20 g/l als Invertzucker zulässig", "Weißer Rum", "Gereifter Rum"], correct: 1, explanation: "Anhang I der Verordnung 2019/787 verbietet die Aromatisierung von Rum, erlaubt aber Süßung zur Geschmacksabrundung bis 20 g/l, ausgedrückt als Invertzucker. Nicht jeder Zuckerzusatz schließt die Kategorie Rum aus." },
          { question: "Was beschreibt Planteray Pineapple (früher Plantation)?", options: ["Billigster Rum", "Victoria-Ananas in dunklem Rum mazeriert, Schalen in weißem Rum — subtiles, elegantes Ergebnis", "Kein Rum enthalten", "Energydrink"], correct: 1, explanation: "Ein aufwendiger Infusion-Rum weit über dem Niveau typischer Flavoured Rums." },
          { question: "Warum kann ein Vergleich mit ungesüßtem, gereiftem Rum interessant sein?", options: ["Spiced Rum ist schlecht", "Fassreifung und Aromatisierung können unterschiedliche Geschmacksstile hervorbringen", "Gereifter Rum ist billiger", "Spiced Rum wird verboten"], correct: 1, explanation: "Fassnoten und Aromatisierung können unterschiedliche Stile ergeben. Ein Vergleich beweist keine allgemeine Überlegenheit einer Kategorie." }
        ]
      },
      {
        title: "Rum-Sensorik — Professionell verkosten",
        content: `**Professionelle Rum-Verkostung** folgt einem systematischen Protokoll. Das richtige Glas: **Glencairn** (Tulpenform, konzentriert Aromen). NICHT: Tumbler oder Shotglas.

**VISUELL**: Farbe gegen weißen Hintergrund. Kristallklar bis tiefbraun. CAVE: Farbe ≠ Alter! Kirchenfenster: Dicke Schlieren = höherer Alkohol/Zucker.

**NASE**: **Erster Nosing** (ohne Schwenken, 5 cm Abstand): Abstand und Dauer an die Alkoholstärke anpassen, vorsichtig und nicht tief einatmen. **Zweites Nosing** (nach Schwenken). **Drittes Nosing** (nach 10–15 Min.): Der Rum öffnet sich.

**Aromen-Kategorien**: **Frucht** (tropisch, Zitrus, Stein, Trocken), **Süß** (Vanille, Karamell, Honig, Melasse), **Würzig** (Zimt, Muskat, Nelke, Pfeffer), **Holzig** (Eiche, Toast, Rauch), **Ester/Funky** (Nagellack, Banane, Lack), **Pflanzlich** (Gras, Kräuter — Agricole), **Erdig** (Leder, Tabak, Pilz), **Geröstet** (Kaffee, Schokolade).

**GAUMEN**: **Antrunk** (süß/trocken), **Mittelgaumen** (Textur, Entwicklung), **Finish** (Dauer und Aromenentwicklung beschreiben, nicht automatisch Qualität). **Retronasal**: Nach dem Schlucken durch die Nase ausatmen — enthüllt zusätzliche Aromen.

**Wasser**: Bei Cask Strength empfohlen — wenige Tropfen öffnen neue Aromen.`,
        quiz: [
          { question: "Wie nähert man sich hochprozentigem Rum beim Riechen?", options: ["Geschmack", "Mit Abstand und kurzen, vorsichtigen Eindrücken; bei Bedarf eine kleine Probe mit Wasser vergleichen", "Etikette", "Damit der Rum atmet"], correct: 1, explanation: "Hohe Alkoholstärke kann stechend wirken. Ein fester Atemtrick ist keine physiologische Garantie; Abstand, Pausen und ein verdünnter Vergleich helfen bei der Beschreibung." },
          { question: "Warum Rum 10–15 Minuten im Glas stehen lassen?", options: ["Kalt werden", "Alkohol verflüchtigt teilweise, subtilere Aromen werden wahrnehmbar", "Giftig", "Farbe"], correct: 1, explanation: "Nach 10–15 Min. hat flüchtiger Alkohol teils verdampft. Weniger flüchtige Aromaverbindungen treten in den Vordergrund." },
          { question: "Was ist retronasal Riechen?", options: ["Durch die Nase trinken", "Nach dem Schlucken durch die Nase ausatmen — enthüllt zusätzliche Aromen über den retronasalen Kanal", "Rückwärts riechen", "Weinfehler"], correct: 1, explanation: "Erwärmte Aromastoffe steigen vom Rachenraum durch den retronasalen Kanal zur Riechschleimhaut — ein anderer Wahrnehmungsweg, der zusätzliche Aromen enthüllt." }
        ]
      },
      {
        title: "Das Rum-Aroma-Rad",
        content: `**Das Rum-Aroma-Rad** strukturiert die Vielzahl möglicher Aromen systematisch. Die wichtigsten Kategorien:

**1. Fruchtig**: Tropisch (Banane, Ananas, Mango, Kokosnuss, Passionsfrucht), Zitrus (Limette, Orange, Bergamotte), Steinobst (Pfirsich, Kirsche), Trockenfrüchte (Rosine, Dattel, Feige), Kompott. Schlüsselaromastoff: **Isoamylacetat** = Banane (besonders bei jamaikanischem Rum).

**2. Süß/Karamell**: Vanille (Vanillin aus dem Fass), Karamell, Toffee, Butterscotch, Honig, brauner Zucker, Melasse, Zuckerrohr (frisch — Agricole Blanc), Schokolade, Mokka.

**3. Würzig**: Zimt, Muskatnuss, Nelke, Piment/Allspice, Pfeffer, Ingwer, Sternanis. Hauptsächlich aus der Fassreifung (Eichenlactone, Eugenol).

**4. Holzig/Balsamisch**: Eiche, Zeder, Sandelholz, Toast, Rauch, Harz. Direkte Fass-Extraktion.

**5. Ester/Chemisch (Funky)**: Nagellack, Lösungsmittel, Aceton, Lack. In niedriger Konzentration: reife tropische Frucht. In hoher: jamaikanischer Funk/Hogo. Ethylacetat, Isoamylacetat, Ethylbutyrat (Ananas).

**6. Pflanzlich/Vegetativ** (Agricole): Gras, Zuckerrohr, Olive, Kräuter, Heu, Tabakblatt, Eukalyptus.

**7. Erdig/Mineralisch**: Feuchte Erde, Pilze, Trüffel, Leder, Tabak, getrocknetes Laub. Lange gereifte Rums und Demerara.

**8. Geröstet**: Kaffee, dunkle Schokolade, Kakao, geröstete Nüsse, Toast, Rauch. Stark getoastete/charred Fässer.

**Praxis-Tipp**: Lege ein "Aroma-Kit" an: Banane, Vanilleextrakt, Zimt, Nelken, Gras, Kakaopulver, gerösteter Kaffee. Rieche bewusst und vergleiche mit dem Rum.`,
        quiz: [
          { question: "Was verursacht 'Banane'-Aromen in jamaikanischem Rum?", options: ["Zugesetzte Banane", "Isoamylacetat — ein Ester aus der Fermentation", "Fassreifung", "Zuckerrohrsorte"], correct: 1, explanation: "Isoamylacetat ist ein Ester, der während der Fermentation entsteht und in hoher Konzentration nach Banane riecht." },
          { question: "Woher stammen Gewürznoten in gereiftem Rum?", options: ["Zuckerrohr", "Fassreifung — Vanillin, Eichenlactone und Eugenol aus dem Holz", "Zugesetzte Gewürze", "Hefe"], correct: 1, explanation: "Vanille, Zimt/Nelke, Kokos und Toast stammen aus der Eiche des Reifungsfasses." },
          { question: "Was unterscheidet Rhum Agricole Blanc fundamental von Melasse-Rum?", options: ["Keine Aromen", "Agricole zeigt pflanzlich-vegetative Noten (Gras, Kräuter), Melasse-Rum eher süß-fruchtig-karamellig", "Gleich", "Melasse ist immer besser"], correct: 1, explanation: "Zwei völlig verschiedene Aromenwelten aus der gleichen Pflanze: Agricole = grasig, pflanzlich. Melasse = süß, fruchtig, karamellig." }
        ]
      },
      {
        title: "Rum-Cocktails: Mojito bis Mai Tai",
        content: `**Rum ist die vielseitigste Cocktail-Spirituose** — von Highballs bis zu Tiki-Kreationen.

**6 essentielle Cocktails**: **1. Daiquiri**: 60 ml weißer Rum, 25 ml Limette, 15 ml Zucker. Shaken, Coupette. Der ultimative Bartender-Test. **2. Mojito**: 60 ml Rum, Limette, Zucker, Minze (LEICHT andrücken!), Soda, Crushed Ice. **3. Mai Tai**: Trader Vic beschreibt sein Original von 1944 mit gereiftem jamaikanischem Rum, Curaçao, Orgeat, Zuckersirup und Limette. Spätere Varianten kombinieren verschiedene Rums. Das heutige IBA-Rezept nennt jamaikanischen Amber Rum und Martinique-Melasse-Rum — nicht zwingend Rhum Agricole. **4. Dark 'n' Stormy**: 60 ml dunkler Rum (traditionell Gosling's), Ginger Beer, Limette. **5. Piña Colada**: 60 ml Rum, Ananassaft, Cream of Coconut (NICHT Kokosmilch!) — Nationalgetränk Puerto Ricos seit 1978. **6. Cuba Libre**: Rum, Coca-Cola, Limette — "¡Por Cuba Libre!" nach dem Spanisch-Amerikanischen Krieg.

**Weitere**: Rum Punch (1 sour, 2 sweet, 3 strong, 4 weak), El Presidente, Rum Old Fashioned, Hot Buttered Rum.`,
        quiz: [
          { question: "Was ist das Original-Mai-Tai-Rezept?", options: ["Fruchtiger roter Mix", "Gereifter jamaikanischer Rum, Curaçao, Orgeat, Zuckersirup und Limette", "Weißer Rum mit Ananassaft", "Vodka mit Orangensaft"], correct: 1, explanation: "Trader Vic's eigenes historisches Rezept von 1944 nennt 17-jährigen Wray & Nephew aus Jamaika, nicht Rhum Agricole. Spätere Rumkombinationen sind Varianten." },
          { question: "Warum Minze im Mojito nur leicht andrücken?", options: ["Optik", "Zu starkes Muddeln setzt bittere Chlorophyll-Verbindungen frei", "Schneller", "Minze ist giftig"], correct: 1, explanation: "Sanftes Andrücken setzt ätherische Öle frei, ohne bittere Chlorophyll- und Tannin-Verbindungen freizusetzen." },
          { question: "Was ist 'Cream of Coconut' vs. Kokosmilch?", options: ["Kein Unterschied", "Cream of Coconut ist gesüßt und eingedickt, Kokosmilch ungesüßt und dünnflüssiger", "Kokosmilch ist süßer", "Alkoholisch"], correct: 1, explanation: "Cream of Coconut (Coco López) ist gesüßtes, eingedicktes Kokosmark — für authentische Piña Colada ESSENTIELL." }
        ]
      },
      {
        title: "Tiki-Kultur und ihre Rum-Cocktails",
        content: `**Die Tiki-Kultur** entstand in den 1930ern als amerikanische Fantasy-Interpretation des Südpazifiks — mit Rum als Hauptspirituose.

**Gründerväter**: **Don the Beachcomber** (Ernest Gantt, 1933, Hollywood): Komplexe Multi-Rum-Cocktails, geheime Rezepte in Codes. **Trader Vic** (Victor Bergeron, 1934, Oakland): Perfektionierte den Stil, erfand den Mai Tai (1944).

**Goldene Ära (1940er–60er)**: Bambusdekor, Südsee-Masken, vulkanförmige Bowlen, Mugs.

**Essentielle Tiki-Cocktails**: **Zombie** (Donn Beach, 1934): 3 Rums + Limette + Grapefruit + Zimt-Sirup + Falernum + Absinth — Die historisch erzählte Zwei-Drink-Regel ist keine gesundheitlich sichere Trinkmenge. **Navy Grog**: 3 Rums + Zitrus + Honig + Soda. **Painkiller** (Soggy Dollar Bar, BVI): Pusser's, Ananassaft, OJ, Cream of Coconut. **Jungle Bird** (KL Hilton, 1978): Dunkler Rum + Campari + Ananas — "Negroni der Tiki-Welt".

**Tiki-Zutaten**: **Orgeat** (Mandelsirup), **Falernum** (karibischer Gewürzlikör), **Cinnamon Syrup**, **Don's Mix** (Grapefruit + Zimtsirup).

**Renaissance**: Jeff "Beachbum" Berry entschlüsselte die Originalrezepte. Martin Cate (Smuggler's Cove, SF). Tiki-Bars weltweit — Berlin, London, Tokyo.`,
        quiz: [
          { question: "Wer begründete die Tiki-Barkultur?", options: ["Hemingway", "Don the Beachcomber (1933, Hollywood)", "James Bond", "Trader Vic allein"], correct: 1, explanation: "Don the Beachcomber eröffnete 1933 die erste Tiki-Bar und erfand den Stil komplexer Multi-Rum-Cocktails." },
          { question: "Warum Limit von 2 Zombies pro Gast?", options: ["Zu wenig Rum", "3 verschiedene Rums (inkl. Overproof) machen den Drink extrem stark", "Preise", "Allergien"], correct: 1, explanation: "Der Zombie enthält 3 Rums plus diverse Liköre — die Alkoholmenge wird durch fruchtige Zutaten maskiert." },
          { question: "Was ist Falernum?", options: ["Rum-Typ", "Karibischer Gewürzlikör (Limette, Mandel, Ingwer, Nelke, Allspice) — essentiell für Tiki", "Cocktailglas", "Zuckerrohrsorte"], correct: 1, explanation: "Falernum ist ein barbadischer Gewürzlikör — Schlüsselzutat für Zombie, Royal Bermuda Yacht Club und viele Tiki-Klassiker." }
        ]
      },
      {
        title: "Rum und Food Pairing",
        content: `**Rum und Essen** bietet nuancierte Pairing-Möglichkeiten dank der Stilvielfalt.

**Grundprinzipien**: **Harmonie** — Ähnliche Aromen ergänzen sich (vanilliger Rum + Crème Brûlée). **Kontrast** — Gegensätze ziehen sich an (süßer Rum + salziger Blauschimmelkäse).

**Pairing-Guide**: **Agricole Blanc** (Neisson, JM): Ceviche, Sashimi, gegrillte Garnelen, Ziegenkäse. **Leichter goldener Rum** (Mount Gay Eclipse): Hähnchen, gegrillter Fisch, Thai-Curry. **Gereifter mittlerer Rum** (Foursquare 12, Appleton 12): Jerk Chicken, BBQ-Ribs, Tacos, Käseplatte. **Schwerer gereifter Rum** (Demerara, Hampden): Dunkle Schokolade (70–85 %), Wildgerichte, Blauschimmelkäse. **Edelsüßer Rum** (Diplomático, Zacapa): Tiramisu, Karamell-Desserts, Vanilleeis. Eine hohe Alkoholstärke ist kein Qualitäts- oder Gesundheitsvorteil beim Pairing.

**Rum und Schokolade**: Besondere Affinität — Kakao und Rum teilen Aromaverbindungen (Pyrazine, Aldehyde). Beides fermentiert, beides tropisch. **Tasting-Idee**: 3 Rums × 3 Schokoladen (40 %, 65 %, 80 %) — 9 Kombinationen.`,
        quiz: [
          { question: "Warum harmoniert Agricole Blanc mit Ceviche?", options: ["Karibische Herkunft", "Grasig-pflanzliche Frische des Agricole ergänzt die Zitrus-Frische des rohen Fisches", "Ceviche enthält Rum", "Kein Alkohol"], correct: 1, explanation: "Kongruenz-Pairing: Frische zu Frische — die pflanzliche Aromatik des Agricole harmoniert mit der Limetten-Frische des Ceviche." },
          { question: "Warum teilen Rum und Schokolade Aromen?", options: ["Schokolade enthält Rum", "Beide tropisch, beide fermentiert, teilen Pyrazine und Aldehyde", "Gleiche Farbe", "Verpackung"], correct: 1, explanation: "Kakao und Zuckerrohr durchlaufen Fermentation, bei der ähnliche Aromaverbindungen entstehen." },
          { question: "Welcher Rum zu Jerk Chicken?", options: ["Agricole Blanc", "Gereifter Rum (z. B. Appleton 12) — Gewürz- und Fruchtnoten ergänzen die Jerk-Marinade", "Wodka", "Leichter weißer Rum"], correct: 1, explanation: "Jerk Chicken braucht einen Rum mit eigener Würze und Tiefe — Appleton 12 ist ein perfekter Partner." }
        ]
      },
      {
        title: "Rum und Zigarren",
        content: `**Rum und Zigarren** werden in historischen Genussbeschreibungen häufig zusammen genannt. Ähnliche Beschreibungen wie Holz, Leder oder Gewürze bedeuten aber weder gesundheitliche Verträglichkeit noch eine Empfehlung, beides zusammen zu konsumieren.

**Gesundheitliche Einordnung**: Alkohol und Tabak erhöhen Krebsrisiken. Ihre gemeinsame Verwendung kann das Risiko bestimmter Krebsarten, insbesondere im Mund- und Rachenraum, zusätzlich verstärken. Auch Zigarren sind kein risikofreies Tabakprodukt. Die WHO/IARC empfiehlt zur Prävention, Tabak zu meiden und Alkohol zu reduzieren beziehungsweise auf ihn zu verzichten.

**Sensorik ohne Rauchen**: Aromen lassen sich mit lebensmitteltauglichen Referenzen wie Kakao, Kaffee, Vanille oder Gewürzen beschreiben. Der Begriff 'Tabaknote' in einer Verkostungsnotiz ist ein Geruchsvergleich, kein Hinweis auf zugesetzten Tabak und kein Anlass zum Rauchen.

**Beratung**: Diese Lektion gibt keine Zigarren-Kaufempfehlungen, Kombinationen oder Konsumrhythmen. Persönliche Gesundheitsfragen gehören zu medizinischem Fachpersonal.`,
        quiz: [
          {"question":"Welche Einordnung ist für Alkohol und Tabak wichtig?","options":["Rauch neutralisiert Alkohol","Beide erhöhen Krebsrisiken; zusammen können sie bestimmte Risiken zusätzlich verstärken","Zigarren sind risikofrei","Rum schützt den Mundraum"],"correct":1,"explanation":"Die Kombination ist nicht gesundheitlich neutral. Aromatische Ähnlichkeit hebt die Risiken nicht auf."},
          {"question":"Was bedeutet eine 'Tabaknote' in einer Rum-Beschreibung?","options":["Tabak ist vorgeschrieben","Ein sensorischer Geruchsvergleich","Eine medizinische Wirkung","Dass man dazu rauchen soll"],"correct":1,"explanation":"Eine Verkostungsnotiz beschreibt Wahrnehmung, nicht automatisch eine Zutat oder einen empfohlenen Begleitkonsum."},
          {"question":"Wie lassen sich Aromen ohne Rauchen trainieren?","options":["Mit Feuerproben","Mit lebensmitteltauglichen Referenzen wie Kakao, Vanille und Gewürzen","Nur mit Zigarren","Durch mehr Alkohol"],"correct":1,"explanation":"Solche Referenzen helfen beim Beschreiben; Tabakkonsum ist dafür nicht erforderlich."},
        ]
      },
      {
        title: "Rum als Investment — Sammeln und Anlegen",
        content: `**Rum als Sammlerobjekt**: Limitierte Abfüllungen, historische Destillerien und unterschiedliche Fass- oder Destillationsprofile können sammlerisch interessant sein. Interesse und Seltenheit sind aber keine verlässliche Renditeprognose.

**Herkunft prüfen**: Etikett, Verschluss, Füllstand, Verpackung und nachvollziehbare Dokumentation sind wichtig. Herstellerinformationen zu Destillerie, Abfüllung und Fass dienen der Einordnung. Ohne prüfbare Daten werden hier keine Auktionspreise, Wertsteigerungen oder garantierten Volumenverluste behauptet.

**Risiken**: Wiederverkauf, Nachfrage, Gebühren, Lagerung, Beschädigung und Fälschungen können den realisierbaren Wert beeinflussen. Historische Preise sagen nicht voraus, was eine Flasche künftig erzielt. Geld für eine Sammlung kann langfristig gebunden sein; ein wirtschaftlicher Verlust ist möglich.

**Lagerung**: Verschlossene Spirituosen aufrecht, vor Licht und starken Temperaturschwankungen geschützt lagern. Produktspezifische Hinweise beachten. Alkoholische Getränke sind kein Ersatz für eine auf die persönliche Situation zugeschnittene Anlageberatung.`,
        quiz: [
          {"question":"Was folgt aus einer limitierten Rum-Abfüllung?","options":["Ein garantierter Preisanstieg","Sie kann sammlerisch interessant sein, garantiert aber keinen späteren Gewinn","Ein risikofreies Investment","Eine feste Rendite"],"correct":1,"explanation":"Seltenheit allein beweist weder Nachfrage noch einen erzielbaren Wiederverkaufspreis."},
          {"question":"Warum ist nachvollziehbare Dokumentation wichtig?","options":["Sie garantiert Rendite","Sie hilft, Herkunft und Authentizität einer Abfüllung zu prüfen","Sie ersetzt jede Prüfung","Sie verändert das Alter"],"correct":1,"explanation":"Etikett und Verpackung allein sind keine vollständige Echtheitsgarantie."},
          {"question":"Was sagt ein historischer Auktionspreis aus?","options":["Jede Flasche erzielt denselben Preis","Er beschreibt einen einzelnen vergangenen Verkauf, nicht einen garantierten Zukunftswert","Es gibt kein Verlustrisiko","Der Hersteller kauft sie zurück"],"correct":1,"explanation":"Zustand, Gebühren, Markt und konkretes Los unterscheiden sich."},
        ]
      },
      {
        title: "Rum-Fehler und Qualitätserkennung",
        content: `**Qualitätserkennung** beginnt mit der Unterscheidung zwischen persönlichem Geschmack, Stil und nachweisbaren Mängeln. Ein esterreicher Rum kann intensiv nach überreifer Frucht oder Lösungsmittel riechen; Intensität allein beweist weder Fehler noch hohe Qualität.

**Produktinformationen prüfen**: Rohstoff, Herkunft, Destillationsverfahren, Reifungsort, tatsächliche Altersangabe und gegebenenfalls Zusätze helfen bei der Einordnung. Die EU-Rumdefinition erlaubt bis zu 20 g/l Süßung als Invertzucker, keine Aromatisierung und Zuckerkulör nur zur Farbanpassung. Eine Altersangabe muss sich auf den jüngsten alkoholischen Bestandteil beziehen.

**Keine Ferndiagnose aus dem Glas**: Süße Wahrnehmung oder sirupartige Textur sind kein genauer Zucker-Nachweis. Eine einfache Dichte-/Hydrometermessung erfasst auch andere Einflüsse und bestätigt keine bestimmte Saccharosemenge. Für belastbare Aussagen sind geeignete Analysen und konkrete Chargendaten nötig.

**Transparenz statt Siegelgläubigkeit**: Geschützte Herkunft belegt die Einhaltung ihrer konkreten Regeln, nicht automatisch den persönlich besten Geschmack. Ein unabhängiger Abfüller ist ebenfalls keine pauschale Qualitätsgarantie. Auffällige oder beschädigte Produkte nicht mit Haushaltsmitteln behandeln, sondern beim Händler klären.`,
        quiz: [
          {"question":"Wie lässt sich eine konkrete Zuckerzugabe belastbar beurteilen?","options":["An der Farbe","Mit geeigneten Analysen und chargenbezogenen Produktinformationen, nicht allein mit Süße oder Dichte","Nur an der Flaschenform","Jeder süße Geruch beweist Zucker"],"correct":1,"explanation":"Sensorik und einfache Hydrometermessung erlauben keine genaue Zutatendiagnose."},
          {"question":"Was sagt dunkle Rumfarbe über das Alter?","options":["Immer mindestens 15 Jahre","Allein kein verlässliches Mindestalter; Zuckerkulör kann die Farbe anpassen","Dass Farbstoff verboten ist","Dass er besser schmeckt"],"correct":1,"explanation":"Die rechtliche Kategorie erlaubt Zuckerkulör nur zur Farbanpassung. Ein Alter muss separat angegeben und belegt werden."},
          {"question":"Wofür steht Herkunftsschutz?","options":["Garantiert höchste Qualität","Für die Einhaltung der konkreten Produktspezifikation","Keine Regeln","Automatisch null Umweltwirkung"],"correct":1,"explanation":"Herkunftsschutz ist keine universelle Geschmacks- oder Qualitätsrangliste."},
        ]
      },
      {
        title: "Die Zukunft des Rums — Trends und Innovationen",
        content: `**Die Rum-Industrie** erlebt den größten Umbruch ihrer Geschichte.

**1. Transparenz-Revolution**: Forderung nach Offenlegung von Zucker, Alter, Farbstoffen. Das **Gargano Classification System**: Pure Single Rum (100 % Pot-Still-Rum aus einer Destillerie), Single Blended Rum (Pot- und Column-Still-Rum aus einer Destillerie). Das ist eine private, keine gesetzliche Qualitätsklassifikation.

**2. Herkunftsschutz und GI**: Die AOC Martinique ist ein Beispiel für geregelte Herkunft. Bei anderen Regionen muss der konkrete Registerstand geprüft werden; eine laufende Diskussion über eine GI ist noch kein wirksamer Schutz.

**3. Terroir und Single Estate**: Einfluss von Zuckerrohrsorte und Boden, Vintage-Abfüllungen. Rhum Agricole ist Vorreiter.

**4. Nachhaltigkeit**: Bagasse als Brennstoff, Wasseraufbereitung und leichtere Flaschen können einzelne Umweltwirkungen beeinflussen. Eine nahezu CO₂-neutrale Produktion folgt daraus nicht automatisch; dafür braucht es eine nachvollziehbare Lebenszyklusbilanz.

**5. Cask Finishing**: Ex-Port, Madeira, Sauternes, Tokaji, IPA-Fässer. Extreme Reifung: 30–50+ Jahre tropisch (Appleton 50, Foursquare Private Cask). STR-Fässer (Shaved, Toasted, Re-charred).

**6. Rum in Deutschland**: Ein Markt mit eigener Rum-Handelsgeschichte. Festivals (German Rum Festival Berlin), spezialisierte Bars (Rum Trader Berlin). Flensburger Rum-Tradition: Pott, Hansen, A.H. Johannsen — historisches Zentrum des deutschen Rum-Handels.

**Die Zukunft ist vielfältig**: Rum hat das Potenzial, die spannendste Spirituosenkategorie des nächsten Jahrzehnts zu werden — die unübertroffene Stilvielfalt (Agricole, Jamaika-Funk, Demerara-Schwere, barbadische Eleganz) und die kulturelle Tiefe machen es möglich.`,
        quiz: [
          { question: "Was ist das Gargano Classification System?", options: ["Cocktail-Guide", "Private Klassifikation nach Destillation und Herkunft, etwa Pure Single und Single Blended", "Zuckerrohr-Anbausystem", "Preiskategorie"], correct: 1, explanation: "Es teilt Rum analog zu Scotch Whisky nach Destillationstyp und Herkunft ein." },
          { question: "Was bedeutet die Nutzung von Bagasse für eine Nachhaltigkeitsaussage?", options: ["Verpackung", "Sie kann Brennstoff ersetzen, beweist aber allein keine CO₂-neutrale Gesamtproduktion", "Weniger Produktion", "Tourismus"], correct: 1, explanation: "Bagasse sind Pressrückstände des Zuckerrohrs. Ihr Einsatz als Brennstoff ist nur ein Teil einer Lebenszyklusbilanz mit Landwirtschaft, Verarbeitung, Transport und Verpackung." },
          { question: "Welche Bedeutung hat Flensburg für deutschen Rum?", options: ["Keine", "Historisches Zentrum des deutschen Rum-Handels — Pott, Hansen, A.H. Johannsen prägen die Rum-Verschnitt-Tradition", "Produziert karibischen Rum", "Für Bier bekannt"], correct: 1, explanation: "Flensburg war über Jahrhunderte der wichtigste deutsche Hafen für Rum-Importe und Zentrum der Rum-Verschnitt-Tradition." }
        ]
      },
    ],
    finalExam: [
      { question: "Aus welchen Rohstoffen kann Rum hergestellt werden?", options: ["Nur Melasse", "Melasse, frischem Zuckerrohrsaft (Rhum Agricole) oder Zuckerrohrsirup", "Getreide und Malz", "Kartoffeln"], correct: 1, explanation: "Rum wird aus Zuckerrohr-Erzeugnissen destilliert: Melasse, frischer Zuckerrohrsaft (Rhum Agricole) oder Zuckerrohrsirup." },
      { question: "Was misst die jamaikanische Ester-Klassifikation?", options: ["Zuckergehalt", "Ester-Gehalt in Gramm pro Hektoliter reinen Alkohols", "Alter des Rums", "Alkoholgehalt"], correct: 1, explanation: "Hampdens Marks unterscheiden konkrete Herstellungsprofile; DOK wird mit 1500–1600 g/hl reinen Alkohols angegeben. Der Wert ist kein universelles Qualitätsurteil." },
      { question: "Warum ist die AOC Martinique einzigartig?", options: ["Größte Insel", "Geregelte Herkunft für Rhum Agricole aus Zuckerrohrsaft von Martinique", "Einziger Rum-Produzent", "Flaschenform"], correct: 1, explanation: "Die AOC Martinique (seit 1996) regelt die Produktion so streng wie kaum eine andere Spirituosen-Appellation." },
      { question: "Was macht den Enmore Wooden Coffey Still einzigartig?", options: ["Aus Gold", "Historische hölzerne Coffey-Anlage aus Enmore mit eigenem Destillationsprofil", "Elektrisch", "Neuester Still"], correct: 1, explanation: "Die historische Enmore-Anlage ist Teil eines spezifischen Herstellungsprozesses. Eine alleinige Materialursache für Geschmack wird nicht behauptet." },
      { question: "Wie verhält sich tropische zu kontinentaler Reifung?", options: ["Kein Unterschied", "Keine feste Altersumrechnung; Klima, Fass und Lagerung sind entscheidend", "Kontinental schneller", "Tropisch unmöglich"], correct: 1, explanation: "Reifejahre in unterschiedlichen Klimazonen lassen sich nicht durch einen festen Faktor gleichsetzen." },
      { question: "Was bedeutet 'Navy Strength'?", options: ["Marketing", "Heute häufig rund 57 % Vol.; historisch mit der Marine verbunden", "Auf Schiff hergestellt", "Besonders mild"], correct: 1, explanation: "Die moderne Bezeichnung ist keine Anleitung, Alkohol oder Schießpulver anzuzünden. Historische Marine-Rums hatten unterschiedliche Stärken." },
      { question: "Wer ist Richard Seale?", options: ["Rum-Pirat", "Rum-Produzent von Foursquare, bekannt für Diskussionen über Herkunft und Transparenz", "Londoner Händler", "Erfinder des Rums"], correct: 1, explanation: "Richard Seale wird mit Foursquare und Herkunfts-/Transparenzdebatten verbunden. Hier wird keine bereits 2021 registrierte Barbados-GI behauptet." },
      { question: "Was ist 'Hogo'?", options: ["Cocktail", "Intensiver Geruch hochesteriger jamaikanischer Rums — von 'haut goût' (tropische Frucht, Lack, Funk)", "Destillationsmethode", "Fasstyp"], correct: 1, explanation: "Hogo beschreibt den charakteristischen Funk hochesteriger Rums — für Kenner das ultimative Qualitätszeichen." },
      { question: "Was war der Original-Mai-Tai?", options: ["Roter Fruchtpunsch", "Gereifter jamaikanischer Rum, Curaçao, Orgeat, Zuckersirup und Limette", "Vodka mit OJ", "Warmes Getränk"], correct: 1, explanation: "Trader Vic's Mai Tai (1944) ist rum-betont und bernsteinfarben — NICHT der fruchtig-bunte Fertig-Mix." },
      { question: "Was ist die Hauptkritik an vielen lateinamerikanischen Premium-Rums?", options: ["Zu alt", "Fehlende Transparenz über Süßung und tatsächliche Altersangaben", "Zu trocken", "Kein Alkohol"], correct: 1, explanation: "Die EU erlaubt für Rum Süßung bis 20 g/l als Invertzucker. Eine angegebene Reifezeit muss sich auf den jüngsten alkoholischen Bestandteil beziehen." },
    ],
  },
];
