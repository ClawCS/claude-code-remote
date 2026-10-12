import { describe, expect, it } from "vitest";
import { bierKurs } from "../../data/akademie-bier";
import { whiskyKurs } from "../../data/akademie-whisky";
import type { QuizQuestion } from "../../data/akademie";

const answer = (question: QuizQuestion) => question.options[question.correct];
const text = (course: typeof bierKurs) => [
  ...course.lessons.map((lesson) => lesson.content),
  ...course.lessons.flatMap((lesson) => lesson.quiz).map((question) => `${answer(question)}\n${question.explanation}`),
  ...course.finalExam.map((question) => `${answer(question)}\n${question.explanation}`),
].join("\n");

describe("source-reviewed beer and whiskey teaching", () => {
  it("preserves 50 lessons and all 170 answerable quiz/exam questions", () => {
    for (const course of [bierKurs, whiskyKurs]) {
      expect(course.lessons).toHaveLength(25);
      expect(course.finalExam).toHaveLength(10);
      for (const lesson of course.lessons) expect(lesson.quiz).toHaveLength(3);
      for (const question of [...course.lessons.flatMap((lesson) => lesson.quiz), ...course.finalExam]) {
        expect(question.correct).toBeGreaterThanOrEqual(0);
        expect(question.correct).toBeLessThan(question.options.length);
        expect(new Set(question.options).size).toBe(question.options.length);
        expect(question.explanation.length).toBeGreaterThan(20);
      }
    }
  });

  it("does not teach a fixed lager temperature as a universal rule", () => {
    expect(answer(bierKurs.lessons[0].quiz[2])).toMatch(/Stamm|stamm/);
    expect(bierKurs.lessons[0].content).toContain("12–18");
  });
  it("teaches the current US craft-brewer definition, not a traditional-ingredient requirement", () => {
    expect(answer(bierKurs.lessons[7].quiz[2])).toMatch(/Brewer|Brau/);
    expect(bierKurs.lessons[7].content).toContain("höchstens 6 Millionen");
    expect(bierKurs.lessons[7].content).toContain("weniger als 25");
  });
  it("does not teach dry hopping as guaranteeing zero additional bitterness", () => {
    expect(bierKurs.lessons[13].quiz.some((question) => /Bitter/.test(answer(question)))).toBe(true);
    expect(bierKurs.finalExam[3].explanation).toMatch(/Bittere.*verändern|verändern.*Bittere/);
  });
  it("does not grade tannin-free beer as true", () => {
    expect(answer(bierKurs.lessons[20].quiz[0])).not.toMatch(/keine Tannine/);
    expect(bierKurs.finalExam[8].explanation).toMatch(/Tannine|Polyphenole/);
    expect(bierKurs.lessons[20].content).toMatch(/enthält.*Polyphenole/);
  });
  it("distinguishes beer styles from legal origin and current monastery census", () => {
    expect(text(bierKurs)).not.toMatch(/14.*Trappistenbrauereien|sechs.*Belgien.*Achel|Oberfranken.*ist.*UNESCO-Weltkulturerbe/);
    expect(bierKurs.lessons[5].content).toContain("immateriellen");
  });
  it("contains no daily healthy-dose or isotonic-for-all health promise", () => {
    expect(bierKurs.lessons[23].content).toMatch(/keine.*risikofreie|risikofreie.*nicht/);
    expect(answer(bierKurs.lessons[23].quiz[2])).toMatch(/vermeiden|Verzicht/);
    expect(text(bierKurs)).not.toMatch(/ohne.*negative Effekte|Bier ist (?:ein Schlafmittel|gesund)/);
  });
  it("uses a strict less-than Scotch distillation cutoff in the exam", () => {
    expect(answer(whiskyKurs.finalExam[0])).toContain("unter 94,8");
    expect(whiskyKurs.lessons[0].content).toContain("unter 94,8");
  });
  it("allows the US corn-whiskey unaged exception without calling it Scotch", () => {
    expect(whiskyKurs.lessons[6].content).toMatch(/Corn Whiskey[\s\S]*ungealtert|Corn Whiskey[\s\S]*ungelagert/);
    expect(whiskyKurs.lessons[0].content).not.toContain("weltweit dieselben gesetzlichen");
  });
  it("identifies Japanese labeling as an association standard rather than universal national law", () => {
    expect(whiskyKurs.lessons[7].content).toMatch(/freiwillige.*Verbands|Verbands.*freiwillige/);
    expect(whiskyKurs.lessons[7].content).toContain("gemälztes Getreide");
  });
  it("does not teach poisonous methanol as being exclusively removed by the first cut", () => {
    expect(whiskyKurs.lessons[9].content).toMatch(/Methanol.*nicht.*ausschließlich|nicht.*ausschließlich.*Methanol/);
    expect(answer(whiskyKurs.lessons[9].quiz[1])).not.toMatch(/Methanol|giftig/);
  });
  it("does not assign sweet and bitter to separate tongue zones", () => {
    expect(whiskyKurs.lessons[13].content).not.toMatch(/Zungenspitze.*Süße|Zungengrund.*Bitterkeit/);
    expect(whiskyKurs.lessons[13].content).toContain("Zungenkarte");
  });
  it("does not guarantee clarity from a universal 46 percent threshold", () => {
    expect(answer(whiskyKurs.lessons[23].quiz[2])).toMatch(/keine.*[Gg]arantie|nicht.*garantiert/);
    expect(answer(whiskyKurs.finalExam[9])).toMatch(/keine.*[Gg]arantie|nicht.*garantiert/);
  });
  it("does not turn a molecular simulation into a universally better taste", () => {
    expect(whiskyKurs.lessons[15].content).toContain("Modell");
    expect(whiskyKurs.lessons[15].content).not.toContain("Wasser macht Whisky nicht schwächer");
  });
  it("replaces fabricated investment return/fake prevalence with actual risks", () => {
    expect(text(whiskyKurs)).not.toMatch(/20-40 %.*gefälscht|über.*500 %|nie wieder neuer Whisky/);
    expect(answer(whiskyKurs.lessons[21].quiz[0])).toMatch(/nicht garantiert|keine.*Garantie/);
    expect(whiskyKurs.lessons[21].content).toContain("Delivery Order");
  });
  it("does not prescribe multiple whiskey portions or tobacco use", () => {
    expect(answer(whiskyKurs.lessons[20].quiz[2])).toMatch(/alkoholfreie|Verzicht/);
    expect(text(whiskyKurs)).not.toMatch(/30-40 ml.*serviert|Zigarren.*rauchen/);
  });
  it("uses current separate operational and all-scope sustainability targets", () => {
    expect(whiskyKurs.lessons[24].content).toContain("2045");
    expect(answer(whiskyKurs.lessons[24].quiz[0])).toContain("2045");
  });
});
