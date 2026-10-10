import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { courses } from "../data/akademie";

const evidence = path.resolve("audit/screenshots/sitewide-learning-tools-2026-10-10");
async function ready(page: Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main h1")).toHaveCount(1);
}
async function capture(page: Page, name: string) {
  await mkdir(evidence, { recursive: true });
  const scrollY = await page.evaluate(() => window.scrollY);
  for (const image of await page.locator("main img:visible").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    await image.evaluate(node => (node as HTMLImageElement).decode());
  }
  await page.evaluate(y => window.scrollTo(0, y), scrollY);
  await page.screenshot({ path: path.join(evidence, `${name}.png`), fullPage: !name.startsWith("game-") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
for (const width of [390, 768, 1440]) {
  test(`lesson, quiz, final failure and retry pass at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    const course = courses.find(course => course.slug === "mineralwasser")!;
    await ready(page, `/akademie/${course.slug}`);
    const answer = async (correct: number, right: boolean) => {
      const answers = page.getByRole("region", { name: "Wissensquiz" }).getByRole("button").filter({ hasText: /^[A-Z]\./ });
      await answers.nth(right ? correct : (correct + 1) % await answers.count()).click();
    };
    await expect(page.getByRole("button", { name: /Abschlusstest/ }).first()).toBeDisabled();
    for (const [index, lesson] of course.lessons.entries()) {
      if (index) await page.getByRole("button", { name: "Nächste Lektion", exact: true }).click();
      for (const [qIndex, question] of lesson.quiz.entries()) {
        await answer(question.correct, false);
        if (!index && !qIndex) await capture(page, `academy-quiz-feedback-${width}`);
        await page.getByRole("button", { name: /Nächste Frage|Ergebnis anzeigen/ }).click();
      }
    }
    await capture(page, `academy-unlocked-${width}`);
    await page.getByRole("button", { name: "Zum Abschlusstest", exact: true }).click();
    await capture(page, `academy-final-${width}`);
    for (const [index, question] of course.finalExam.entries()) {
      await answer(question.correct, index < 6);
      await page.getByRole("button", { name: /Nächste Frage|Ergebnis anzeigen/ }).click();
    }
    await expect(page.getByText("6 von 10 richtig (60%)")).toBeVisible();
    await capture(page, `academy-failed-${width}`);
    await page.getByRole("button", { name: "Nochmal lernen", exact: true }).click();
    await expect(page.getByText("Quiz abgeschlossen — 0/3 richtig", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Abschlusstest", exact: true }).click();
    await expect(page.getByText("0/0 richtig", { exact: true })).toBeVisible();
    for (const [index, question] of course.finalExam.entries()) {
      await answer(question.correct, index < 7);
      await page.getByRole("button", { name: /Nächste Frage|Ergebnis anzeigen/ }).click();
    }
    await expect(page.getByText("7 von 10 richtig (70%)")).toBeVisible();
    await capture(page, `academy-passed-${width}`);
  });

  test(`learning and tool families at ${width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(`${page.url()}: ${error.message}\n${error.stack}`));
    await page.exposeFunction("recordWindowError", (error: unknown) => console.error("Window error", error));
    await page.addInitScript(() => {
      window.addEventListener("error", event => {
        const record = (window as unknown as { recordWindowError: (error: unknown) => void }).recordWindowError;
        record({ url: location.href, message: event.message, filename: event.filename, line: event.lineno, column: event.colno });
      });
    });
    for (const route of ["/cocktails", "/cocktails/kategorie/rum", "/cocktails/pi-a-colada", "/akademie", "/akademie/whiskey", "/akademie/zertifikate", "/finder", "/partyplaner", "/partyspiele", "/leergut", "/oeko-tracker", "/community", "/kuehlschrank"]) {
      await ready(page, route);
      await expect(page.locator("main header h1")).toHaveCount(1);
      const axe = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(axe.violations, route).toEqual([]);
      await capture(page, `${route.slice(1).replaceAll("/", "-")}-${width}`);
      if (route === "/akademie/whiskey") {
        await page.getByRole("link", { name: "Zur aktuellen Lektion", exact: true }).click();
        await expect(page.locator("#course-lesson")).toBeFocused();
        await expect(page.getByRole("heading", { name: "Whisky — Eine Spirituose mit klaren Regeln", exact: true })).toBeVisible();
        const lesson = page.locator("#course-lesson");
        expect(await lesson.evaluate(node => node.getBoundingClientRect().top)).toBeGreaterThanOrEqual(100);
        const course = courses.find(course => course.slug === "whiskey")!;
        await page.getByRole("navigation", { name: "Kurslektionen" }).getByRole("button", { name: new RegExp(course.lessons.at(-1)!.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
        await expect(lesson.getByRole("heading", { level: 2 })).toHaveText(course.lessons.at(-1)!.title);
      }
    }
    expect(errors).toEqual([]);
  });

  test(`finder, litres and deposit active workspaces at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    await ready(page, "/finder");
    await page.getByRole("button", { name: /Bierfinder/ }).click();
    await capture(page, `finder-question-${width}`);
    for (const name of ["Pils – herb & frisch", "Keine Präferenz", "Feierabendbier"]) await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator("[data-product-card]").first()).toBeVisible();
    await capture(page, `finder-results-${width}`);
    await page.getByRole("button", { name: "Nochmal versuchen", exact: true }).click();
    await page.getByRole("button", { name: /Bierfinder/ }).click();
    for (const name of ["Pils – herb & frisch", "Alkoholfrei", "Feierabendbier"]) await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator("[data-product-card]")).toHaveCount(0);
    await capture(page, `finder-empty-${width}`);
    await ready(page, "/partyplaner");
    await page.getByRole("button", { name: "Berechnen", exact: true }).click();
    await expect(page.getByRole("region", { name: "Dein Getränkebedarf" }).locator("dd")).toHaveText(["33 l", "8 l", "10 l", "0,8 l", "20 l"]);
    await capture(page, `planner-result-${width}`);
    await ready(page, "/leergut");
    await page.getByRole("spinbutton", { name: "Anzahl Einweg PET-Flasche", exact: true }).fill("4");
    await expect(page.getByText("1,00 €", { exact: true })).toBeVisible();
    await capture(page, `deposit-result-${width}`);
    await page.getByRole("button", { name: "Speichern & zurücksetzen", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Meine Leergut-Historie" })).toBeVisible();
    await capture(page, `deposit-history-${width}`);
    await page.getByRole("link", { name: "Öko-Tracker", exact: true }).click();
    await expect(page.getByRole("button", { name: "Aus Leergut-Historie (4 Flaschen)", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("4 Flaschen & Dosen", { exact: true })).toBeVisible();
    await expect(page.getByText("CO₂ gespart", { exact: true }).locator("..")).toContainText("360");
    await capture(page, `eco-history-${width}`);
    await page.getByRole("button", { name: "Manuell eingeben", exact: true }).click();
    await expect(page.getByRole("button", { name: "Manuell eingeben", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Aus Leergut-Historie (4 Flaschen)", exact: true })).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("spinbutton").fill("100");
    await expect(page.getByText("CO₂ gespart", { exact: true }).locator("..")).toContainText("20.000");
    await capture(page, `eco-manual-${width}`);
    await ready(page, "/leergut");
    await page.getByRole("button", { name: "Eintrag löschen", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Meine Leergut-Historie" })).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem("trinkgut-leergut-historie"))).toBeNull();
  });
}

test("academy discovery remains reachable from homepage, category and own-brand consumers", async ({ page }) => {
  for (const route of ["/", "/kategorie/bier", "/eigenmarke"]) {
    await ready(page, route);
    const entry = page.locator('aside[aria-label="Getränkeakademie"], aside[data-academy-context]');
    await expect(entry).toBeVisible();
    await expect(entry.getByRole("link").first()).toHaveAttribute("href", /^\/akademie/);
  }
});

test("game dialogs have names, keyboard boundaries and return focus to their launcher", async ({ page }) => {
  await ready(page, "/partyspiele");
  const launcher = page.getByRole("button", { name: /Bier-Pong Scoreboard/ });
  await launcher.click();
  const dialog = page.getByRole("dialog", { name: "Bier-Pong Scoreboard" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("checkbox", { name: "Alkoholfrei" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Teile dieses Spiel" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("checkbox", { name: "Alkoholfrei" })).toBeFocused();
  await expect(dialog.getByRole("textbox", { name: "Name Team 1" })).toBeVisible();
  await dialog.getByRole("button", { name: "Treffer!", exact: true }).first().click();
  await expect(dialog.getByText("Becher übrig: 9", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(dialog.getByText("Becher übrig: 10", { exact: true })).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

for (const width of [390, 768, 1440]) {
  test(`all game inner states at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    await ready(page, "/partyspiele");
    for (const name of ["Trink-Roulette", "Wahrheit oder Pflicht", "Bier-Pong Scoreboard", "Flunkyball Timer", "Kings Cup", "Ich hab noch nie...", "Cocktail-Quiz", "Getränke-Tabu"]) {
      await page.getByRole("button", { name: new RegExp(name.replaceAll(".", "\\.")) }).click();
      const dialog = page.getByRole("dialog", { name, exact: true });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("checkbox", { name: "Alkoholfrei" }).check();
      if (name === "Trink-Roulette") {
        for (const player of ["Test A", "Test B"]) { await dialog.getByRole("textbox", { name: "Spielername" }).fill(player); await dialog.getByRole("button", { name: "Spieler hinzufügen" }).click(); }
        await dialog.getByRole("button", { name: "Drehen!", exact: true }).click();
        await expect(dialog.getByRole("button", { name: "Drehen!", exact: true })).toBeEnabled();
      } else if (name === "Wahrheit oder Pflicht") await dialog.getByRole("button", { name: "Wahrheit", exact: true }).click();
      else if (name === "Bier-Pong Scoreboard") await dialog.getByRole("button", { name: "Treffer!", exact: true }).first().click();
      else if (name === "Flunkyball Timer") await dialog.getByRole("button", { name: "+1 Punkt", exact: true }).first().click();
      else if (name === "Kings Cup") await dialog.getByRole("button", { name: /Karte ziehen/ }).click();
      else if (name === "Ich hab noch nie...") await dialog.getByRole("button", { name: /Nächstes Statement/ }).click();
      else if (name === "Cocktail-Quiz") await dialog.getByRole("button", { name: "Quiz starten" }).click();
      else await dialog.getByRole("button", { name: "Spiel starten" }).click();
      expect((await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
      await capture(page, `game-${name.replaceAll(/[^a-z0-9]/gi, "-")}-${width}`);
      await dialog.getByRole("button", { name: "Schließen", exact: true }).click();
      await expect(dialog).toHaveCount(0);
    }
  });
}
