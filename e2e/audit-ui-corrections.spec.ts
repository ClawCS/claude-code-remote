import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { courses } from "../data/akademie";

async function share(page: Page, key: string, value: number) {
  const slider = page.locator(`#party-${key}`);
  await slider.focus();
  await slider.press("Home");
  for (let step = 0; step < value / 5; step++) await slider.press("ArrowRight");
}
async function answer(page: Page, correct: number, right = false) {
  const answers = page.locator("button").filter({ hasText: /^[A-Z]\./ });
  await answers.nth(right ? correct : (correct + 1) % await answers.count()).click();
}

test("zero-score lesson is completed, never passed, and completion gates the final exam", async ({ page }) => {
  const course = courses[0];
  await page.goto(`/akademie/${course.slug}`);
  for (const question of course.lessons[0].quiz) {
    await answer(page, question.correct);
    await page.getByRole("button", { name: /Nächste Frage|Ergebnis anzeigen/ }).click();
  }
  await expect(page.getByText(`Quiz abgeschlossen — 0/${course.lessons[0].quiz.length} richtig`, { exact: false })).toBeVisible();
  await expect(page.getByText(/Quiz bestanden/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Abschlusstest/ }).first()).toBeDisabled();
  await expect(page.getByText("Erst alle Quiz abschließen")).toBeVisible();
});

test("switching lessons resets selected answer, explanation, question and score", async ({ page }) => {
  const course = courses[0];
  await page.goto(`/akademie/${course.slug}`);
  await answer(page, course.lessons[0].quiz[0].correct, true);
  await page.getByRole("button", { name: "Nächste Lektion" }).click();
  await expect(page.getByRole("heading", { name: /Quiz — Frage 1 von/ })).toBeVisible();
  await expect(page.getByText("Richtig!", { exact: true })).toHaveCount(0);
  await expect(page.getByText("0/0 richtig", { exact: true })).toBeVisible();
  await answer(page, course.lessons[1].quiz[0].correct, true);
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  await page.getByRole("button", { name: "Vorherige" }).click();
  await expect(page.getByRole("heading", { name: /Quiz — Frage 1 von/ })).toBeVisible();
  await expect(page.getByText("0/0 richtig", { exact: true })).toBeVisible();
});

test("party water remains an additional litre estimate without choosing a product", async ({ page }) => {
  await page.goto("/partyplaner");
  await page.getByRole("button", { name: "Berechnen", exact: true }).click();
  const result = page.getByRole("region", { name: "Dein Getränkebedarf" });
  const water = result.getByText("Wasser", { exact: true }).locator("..");
  await expect(water.locator("dd")).toHaveText("20 l");
  await expect(result.locator("img")).toHaveCount(0);
});

test("invalid percentages disable calculations and remove previous litre results", async ({ page }) => {
  await page.goto("/partyplaner");
  await page.getByRole("button", { name: "Berechnen", exact: true }).click();
  const result = page.getByRole("region", { name: "Dein Getränkebedarf" });
  await expect(result).toBeVisible();
  await share(page, "beerDrinkers", 45);
  await expect(page.getByRole("button", { name: "Berechnen", exact: true })).toBeDisabled();
  await expect(result).toHaveCount(0);
  await expect(page.locator("main").getByRole("alert")).toContainText("95%");
  await share(page, "beerDrinkers", 50);
  await expect(result).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Berechnen", exact: true })).toBeEnabled();
});

test("academy answer and lesson text and invalid party warnings meet contrast", async ({ page }) => {
  const assertContrast = async () => {
    const result = await new AxeBuilder({ page }).include("main").withRules(["color-contrast"]).analyze();
    expect(result.violations).toEqual([]);
  };
  const course = courses[0];
  await page.goto(`/akademie/${course.slug}`);
  await assertContrast();
  await answer(page, course.lessons[0].quiz[0].correct, true);
  await assertContrast();
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  await answer(page, course.lessons[0].quiz[1].correct);
  await assertContrast();
  await page.goto("/partyplaner");
  await share(page, "beerDrinkers", 45);
  await assertContrast();
});

test("final exam keeps the seventy-percent threshold and can be retried after failure", async ({ page }) => {
  test.setTimeout(120_000);
  const course = courses.find(course => course.slug === "mineralwasser")!;
  await page.goto(`/akademie/${course.slug}`);
  for (const [index, lesson] of course.lessons.entries()) {
    if (index) await page.getByRole("button", { name: "Nächste Lektion" }).click();
    for (const question of lesson.quiz) {
      await answer(page, question.correct);
      await page.getByRole("button", { name: /Nächste Frage|Ergebnis anzeigen/ }).click();
    }
  }
  await page.getByRole("button", { name: "Zum Abschlusstest", exact: true }).click();
  for (const [index, question] of course.finalExam.entries()) {
    await answer(page, question.correct, index < 6);
    await page.getByRole("button", { name: /Nächste Frage|Ergebnis anzeigen/ }).click();
  }
  await expect(page.getByRole("heading", { name: "Nicht bestanden", exact: true })).toBeVisible();
  await expect(page.getByText("6 von 10 richtig (60%)")).toBeVisible();
  await page.getByRole("button", { name: "Nochmal lernen", exact: true }).click();
  await expect(page.getByText("Quiz abgeschlossen — 0/3 richtig", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Abschlusstest", exact: true }).click();
  await expect(page.getByText("0/0 richtig", { exact: true })).toBeVisible();
  for (const [index, question] of course.finalExam.entries()) {
    await answer(page, question.correct, index < 7);
    await page.getByRole("button", { name: /Nächste Frage|Ergebnis anzeigen/ }).click();
  }
  await expect(page.getByRole("heading", { name: "Bestanden!", exact: true })).toBeVisible();
  await expect(page.getByText("7 von 10 richtig (70%)")).toBeVisible();
});

test("invalid calculation handler cannot authorize results even if a disabled button is re-enabled", async ({ page }) => {
  await page.goto("/partyplaner");
  for (const key of ["beerDrinkers", "wineDrinkers", "softDrinkers", "spiritDrinkers"]) await share(page, key, 0);
  const calculate = page.getByRole("button", { name: "Berechnen", exact: true });
  await expect(calculate).toBeDisabled();
  await calculate.evaluate(button => { (button as HTMLButtonElement).disabled = false; });
  await calculate.click();
  await expect(page.getByRole("button", { name: "Alles zur Anfrageliste" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Dein Getränkebedarf" })).toHaveCount(0);
});

for (const [path, canonical, title, description] of [
  ["/akademie", "/akademie", "Getränkeakademie", /Lektionen/],
  ["/akademie/zertifikate", "/akademie/zertifikate", "Professionelle Zertifikatskurse | Getränkeakademie", /17 Weiterbildungshinweise/],
  ["/produkte?search=Krombacher", "/produkte", "Sortiment & aktuelle Wochenangebote", /Warengruppen/],
  ["/angebote", "/angebote", "Wochenangebote — KW-Aktionen", /Originalhandzettel/],
  ["/handzettel", "/angebote", "Handzettel — Aktuelle Prospekte", /Originalhandzettel/],
] as const) {
  test(`${path} has one route-specific production canonical and description`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(`${title} | Trinkgut Jammers`);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://trinkgut-jammers.de${canonical}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", description);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  });
}

test("catalogue raw HTML and live controls retain first-query, text and language filtering", async ({ page }) => {
  const clientRefresh = page.waitForResponse(response => response.url().endsWith("/api/content/offers") && response.request().method() === "GET");
  const response = await page.goto("/produkte?search=Krombacher&search=Volvic");
  const html = await response!.text();
  expect(html).toContain("Sortiment &amp; Wochenangebote");
  expect(html).toContain('aria-label="Warengruppen"');
  expect(html).toContain('aria-label="Aktuelle Einzelangebote"');
  expect(html).toContain('value="Krombacher"');
  await page.waitForLoadState("networkidle");
  // The initial offer refresh is issued by a mounted client effect, unlike
  // server-visible input markup; await it before testing hydrated controls.
  await clientRefresh;
  const input = page.getByRole("textbox", { name: "Aktuelle Angebote durchsuchen" });
  await expect(input).toHaveValue("Krombacher");
  await expect(page.locator("[data-offer-id]").first()).toBeVisible();
  await input.focus();
  await input.press("ControlOrMeta+A");
  await input.pressSequentially("not-an-existing-offer-20261010");
  await expect(page.locator("[data-offer-id]")).toHaveCount(0);
  await input.press("ControlOrMeta+A");
  await input.press("Backspace");
  await page.getByRole("button", { name: "Nederlands", exact: true }).click();
  await expect(page.locator("[data-offer-id]").first()).toContainText("NL-Handzettel");
  await page.getByRole("button", { name: "Deutsch", exact: true }).click();
  await expect(page.locator("[data-offer-id]").first()).toContainText("DE-Handzettel");
  await page.getByRole("navigation", { name: "Hauptnavigation", exact: true }).getByRole("link", { name: "Sortiment", exact: true }).click();
  await expect(page).toHaveURL(/\/produkte$/);
  await expect(input).toHaveValue("");
  await page.goBack();
  await expect(input).toHaveValue("Krombacher");
  await page.getByRole("link", { name: "DE- und NL-Handzettel ansehen", exact: true }).click();
  await expect(page).toHaveURL(/\/angebote$/);
  await page.goBack();
  await expect(page).toHaveURL(/search=Krombacher&search=Volvic$/);
  await expect(input).toHaveValue("Krombacher");
  await expect(page.locator("[data-offer-id]").first()).toContainText("Krombacher");
});
