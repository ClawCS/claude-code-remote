import { describe, expect, it } from "vitest";
import { courses } from "../../data/akademie";
import { cocktails } from "../../data/cocktails";

const wine = courses.find((course) => course.slug === "wein")!;
const rum = courses.find((course) => course.slug === "rum")!;
const liqueur = courses.find((course) => course.slug === "likoere")!;
const sparkling = courses.find((course) => course.slug === "schaumwein")!;

describe("source-backed editorial quiz facts", () => {
  it("identifies Qvevri practice as intangible cultural heritage, not a World Heritage site", () => {
    expect(wine.lessons[7].quiz[1].explanation).toMatch(/immateriell/i);
    expect(wine.lessons[7].quiz[1].explanation).not.toMatch(/UNESCO-Weltkulturerbe/);
    expect(wine.finalExam[6].explanation).toMatch(/immateriell/i);
    expect(wine.finalExam[6].explanation).not.toMatch(/UNESCO-Weltkulturerbe/);
  });

  it("does not teach wood alone as the cause of the Enmore rum character", () => {
    expect(rum.lessons[10].quiz[1].explanation).not.toMatch(/Holz.*Schwefel/);
    expect(rum.finalExam[3].explanation).not.toMatch(/Holz.*Schwefel/);
  });

  it("uses current Champagne grapes and leaves Brut quiz with one unambiguous category", () => {
    expect(sparkling.lessons[4].content).toMatch(/Chardonnay rose/);
    expect(sparkling.lessons[11].quiz[0].options.filter(option => /Brut/i.test(option))).toEqual(["Brut"]);
  });

  it("does not claim unearned professional credentials in course descriptions", () => {
    expect(wine.description).not.toMatch(/Sommelier-Niveau/);
    expect(sparkling.description).not.toMatch(/Sommelier-Niveau/);
  });

  it("does not derive fixed residual-sugar minima from German Prädikat categories", () => {
    expect(wine.lessons[12].content).not.toMatch(/Restzucker 100\+|Restzucker 150\+/);
  });

  it("does not require every corked bottle to lie down even for short storage", () => {
    expect(wine.lessons[17].content).not.toMatch(/Bei Korkflaschen zwingend/);
    expect(wine.lessons[17].content).toMatch(/kurz|ein.*zwei Jahre/i);
  });

  it("does not dismiss thujone toxicity as a myth", () => {
    expect(liqueur.lessons[9].content).not.toMatch(/Thujon.*modern hat sich dies als Mythos erwiesen/);
    expect(liqueur.lessons[9].content).toMatch(/Thujon.*neurotox|Nervengift/i);
  });

  it("does not turn the DWI's possible PIWI reduction into a fixed final-exam percentage", () => {
    expect(wine.finalExam[8].explanation).toMatch(/bis zu 80|bedingungen|standort/i);
    expect(wine.finalExam[8].explanation).not.toMatch(/benötigen ca\. 80 %/);
  });

  it("does not describe the Mouton promotion as the only change ever made to the 1855 classification", () => {
    expect(wine.finalExam[2].explanation).not.toMatch(/einzige Veränderung/i);
  });

  it("does not grade the invented 5% northern Prädikatswein exception as correct", () => {
    const question = wine.lessons[0].quiz[0];
    expect(question.options[question.correct]).toMatch(/8,5.*Zonen A und B.*9.*übrigen/i);
    expect(question.explanation).not.toMatch(/5 %.*Prädikatswein/);
  });

  it("grades Blanc de Blancs as white grapes rather than necessarily Chardonnay", () => {
    const question = wine.lessons[9].quiz[1];
    expect(question.options[question.correct]).toMatch(/weiße.*Trauben|weißen.*Rebsorten/i);
    expect(question.options[question.correct]).not.toMatch(/100 % Chardonnay/);
  });

  it("does not recommend putting a circulation coin in wine to treat reduction", () => {
    const question = wine.lessons[16].quiz[1];
    expect(question.options[question.correct]).toMatch(/Belüft|Luftkontakt/i);
    expect(question.options[question.correct]).not.toMatch(/Kupfermünze/);
  });

  it("teaches that headache causes cannot be diagnosed from a wine ingredient alone", () => {
    const question = wine.lessons[23].quiz[2];
    expect(question.options[question.correct]).toMatch(/nicht.*pauschal|keine.*Ferndiagnose/i);
  });

  it.each(["Vodka Sour", "Whiskey Sour"])("specifies a pasteurized egg option for unheated %s", (name) => {
    const recipe = cocktails.find((cocktail) => cocktail.name === name)!;
    expect(recipe.ingredients.find((ingredient) => /Eiweiß/.test(ingredient))).toMatch(/pasteurisiert/i);
    expect(recipe.tip).toMatch(/rohe|Salmonellen|pasteurisiert/i);
  });

  it("uses a bar spoon rather than a knife when preparing a Batanga", () => {
    const recipe = cocktails.find((cocktail) => cocktail.name === "Batanga")!;
    expect(recipe.instructions).toMatch(/Barlöffel/);
    expect(recipe.instructions).not.toMatch(/Messer/);
  });

  it("distinguishes the EU rum sweetening limit from prohibited flavouring", () => {
    const question = rum.lessons[15].quiz[0];
    expect(question.options[question.correct]).toMatch(/Aromen|aromatisier/i);
    expect(question.explanation).toMatch(/20 g\/l/);
    expect(question.options[question.correct]).not.toMatch(/Zucker\/Aromen/);
  });

  it("does not grade a tropical-to-continental age conversion as a fact", () => {
    const question = rum.lessons[6].quiz[1];
    expect(question.options[question.correct]).toMatch(/keine.*Umrechnung|nicht.*gleichsetzen/i);
  });

  it("identifies the 1944 Mai Tai without an invented Agricole component", () => {
    const question = rum.lessons[18].quiz[0];
    expect(question.options[question.correct]).toMatch(/jamaikanischer.*Rum/i);
    expect(question.options[question.correct]).not.toMatch(/Agricole/);
  });

  it("does not recommend tobacco pairing or a safe dose of alcohol", () => {
    expect(rum.lessons[21].content).toMatch(/Krebsrisiko|Krebsrisiken/);
    expect(rum.lessons[21].content).not.toMatch(/Ein Zug, ein Schluck/);
    expect(wine.lessons[23].content).toMatch(/keine.*sichere|keinen.*risikofreien|keine.*risikofreie/i);
    expect(wine.lessons[23].content).not.toMatch(/12 g.*24 g|10.*höher.*Weißwein/);
  });

  it("defines Pure Single Rum as pot-still rum from one distillery, not one still", () => {
    expect(rum.lessons[24].content).toMatch(/Pure Single Rum.*100 %.*Pot.Still.*eine[rn]? Destillerie/i);
    expect(rum.lessons[24].content).not.toMatch(/Pure Single Rum \(ein Still/);
  });

  it("limits the 70g cherry exception to kirsch-only alcohol and includes the 80g botanical exception", () => {
    expect(liqueur.lessons[0].content).toMatch(/70 g\/l.*ausschließlich.*Kirschbrand/i);
    expect(liqueur.lessons[0].content).toMatch(/80 g\/l.*Enzian|Enzian.*80 g\/l/i);
    expect(liqueur.finalExam[0].explanation).not.toMatch(/Einzige Ausnahme/);
  });

  it("uses product-specific cream liqueur storage rather than a universal six month rule", () => {
    const question = liqueur.lessons[6].quiz[2];
    expect(question.options[question.correct]).toMatch(/Hersteller|Produkt/i);
    expect(liqueur.lessons[16].content).not.toMatch(/Wenn ein Likör noch gut riecht und schmeckt, ist er in Ordnung/);
  });

  it("does not turn digestif tradition into a gastric-emptying health promise", () => {
    expect(liqueur.lessons[18].content).not.toMatch(/20–30 ml.*Magenentleerung fördern/);
    expect(liqueur.lessons[18].content).toMatch(/keine.*Gesundheits|kein.*Verdauungs|keine.*Verdauungs/i);
  });

  it("uses current manufacturer coffee and grape-spirit specifications", () => {
    expect(liqueur.lessons[7].quiz[0].options[liqueur.lessons[7].quiz[0].correct]).toMatch(/Arabica.*Brasilien/i);
    expect(liqueur.lessons[11].content).toMatch(/Nonino.*Traubenbrand|Nonino.*Acquavite d.Uva/i);
    expect(liqueur.lessons[11].content).not.toMatch(/Nonino.*Grappa.basiert/i);
  });

  it("separates Champagne total maturation from minimum time on lees", () => {
    const question = sparkling.lessons[1].quiz[2];
    expect(question.options[question.correct]).toMatch(/15.*insgesamt.*12.*Hefe|12.*Hefe.*15.*insgesamt/i);
  });

  it("does not mislabel Deutscher Sekt as imported grapes merely fermented in Germany", () => {
    expect(sparkling.lessons[8].content).toMatch(/Deutscher Sekt.*deutsch.*Trauben|Deutscher Sekt.*ausschließlich.*Deutschland/i);
    expect(sparkling.lessons[8].content).not.toMatch(/Deutscher Sekt.*lediglich.*Versektung/i);
  });

  it("requires clean sparkling-wine glasses and keeps pressurized bottles pointed away", () => {
    expect(sparkling.lessons[14].content).not.toMatch(/Glas sollte \*\*nicht\*\* poliert oder gespült/);
    expect(sparkling.lessons[14].content).toMatch(/saubere|sauber gereinigte/i);
    expect(sparkling.lessons[14].content).toMatch(/Personen|Menschen/);
  });

  it("does not teach carbon dioxide as a fat-dissolving or protein-dissolving agent", () => {
    expect(sparkling.lessons[15].content).not.toMatch(/fettlösende Wirkung|emulgiert Fette|Fischprotein-Textur wird.*aufgelöst/);
    expect(sparkling.lessons[15].quiz[0].options[sparkling.lessons[15].quiz[0].correct]).not.toMatch(/fettlösend/i);
  });
});
