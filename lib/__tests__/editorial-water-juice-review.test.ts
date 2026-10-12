import { describe, expect, it } from "vitest";
import { mineralwasserKurs } from "../../data/akademie-mineralwasser";
import { saftKurs } from "../../data/akademie-saft";

const answer = (question: { options: string[]; correct: number }) =>
  question.options[question.correct];

describe("source-checked water and juice quiz decisions", () => {
  it("distinguishes permitted ozone-enriched-air treatment from disinfection", () => {
    expect(answer(mineralwasserKurs.lessons[0].quiz[1])).toMatch(
      /ozonangereicherter Luft.*Bedingungen/i,
    );
  });

  it("uses the 1.5 mg/l fluoride warning threshold, not the 5 mg/l maximum", () => {
    expect(answer(mineralwasserKurs.lessons[2].quiz[2])).toMatch(
      /mehr als 1,5 mg\/l.*unter 7/i,
    );
  });

  it("keeps the infant-preparation sodium limit inclusive", () => {
    expect(answer(mineralwasserKurs.lessons[12].quiz[1])).toBe("Höchstens 20 mg/l");
  });

  it("does not convert total dissolved solids directly into water hardness", () => {
    expect(answer(mineralwasserKurs.lessons[14].quiz[1])).toMatch(
      /TDS.*nicht.*Wasserhärte/i,
    );
  });

  it("teaches the legal minimum of 35 percent for sour-cherry nectar", () => {
    expect(answer(saftKurs.lessons[0].quiz[2])).toBe("35 %");
  });

  it("does not invent a universal HACCP 24-hour deadline for open juice", () => {
    expect(answer(saftKurs.lessons[17].quiz[2])).toMatch(
      /Herstellerangaben.*Hygienekonzept/i,
    );
  });

  it("does not infer a safe raw-juice shelf life from cold pressing alone", () => {
    expect(answer(saftKurs.lessons[19].quiz[1])).toMatch(
      /keine pauschale.*Haltbarkeit/i,
    );
  });

  it("does not describe flavoured drinks as unaltered natural mineral water", () => {
    expect(answer(mineralwasserKurs.lessons[19].quiz[0])).toMatch(
      /Getränk auf Mineralwasserbasis/i,
    );
  });

  it("judges packaging by reuse, material and transport instead of a universal 200 km winner", () => {
    expect(answer(mineralwasserKurs.finalExam[7])).toMatch(
      /Material.*Umlaufzahl.*Transport/i,
    );
  });

  it("keeps every quiz answer selectable after factual corrections", () => {
    for (const course of [mineralwasserKurs, saftKurs]) {
      const questions = [
        ...course.lessons.flatMap((lesson) => lesson.quiz),
        ...course.finalExam,
      ];
      expect(course.lessons).toHaveLength(20);
      expect(questions).toHaveLength(70);
      for (const question of questions) {
        expect(Number.isInteger(question.correct)).toBe(true);
        expect(question.correct).toBeGreaterThanOrEqual(0);
        expect(question.correct).toBeLessThan(question.options.length);
        expect(answer(question).trim()).not.toBe("");
        expect(question.explanation.trim()).not.toBe("");
      }
    }
  });
});
