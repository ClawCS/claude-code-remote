import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { courses } from "../data/akademie";

const course = courses.find(course => course.slug === "mineralwasser")!;
for (const index of [1, course.lessons.length - 1]) {
  test(`lesson ${index + 1} has full server-readable content and own metadata without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const route = `/akademie/mineralwasser/lektion/${index + 1}`;
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    const lesson = page.getByRole("region", { name: "Lektion", exact: true });
    await expect(lesson.getByRole("heading", { level: 2 })).toHaveText(course.lessons[index].title);
    const normalize = (value: string) => value.replace(/\*\*|^#{2,3} /gm, "").replace(/\s+/g, " ").trim();
    expect(normalize(await lesson.innerText())).toBe(normalize(`${course.lessons[index].title}\n${course.lessons[index].content}`));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://trinkgut-jammers.de${route}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `https://trinkgut-jammers.de${route}`);
    await expect(page).toHaveTitle(new RegExp(course.lessons[index].title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", new RegExp(`Lektion ${index + 1}`));
    const breadcrumbs = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(breadcrumbs.map(text => JSON.parse(text)).find(value => value["@type"] === "BreadcrumbList").itemListElement.at(-1).item).toBe(`https://trinkgut-jammers.de${route}`);
    await context.close();
  });
}

test("strict lesson aliases and invalid routes return permanent redirects and real 404s", async ({ request }) => {
  const alias = await request.get("/akademie/mineralwasser/lektion/1", { maxRedirects: 0 });
  expect(alias.status()).toBe(308);
  expect(alias.headers().location).toBe("/akademie/mineralwasser");
  for (const route of ["/akademie/unknown-course", "/akademie/unknown-course/lektion/2", ...["0", "-1", "01", "02", "2foo", "2.0", "999"].map(id => `/akademie/mineralwasser/lektion/${id}`)]) {
    expect((await request.get(route)).status(), route).toBe(404);
  }
});

test("lesson links, keyboard, history and query changes reset partial quizzes without losing completion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/akademie/mineralwasser/lektion/2");
  const quiz = page.getByRole("region", { name: "Wissensquiz" });
  await quiz.getByRole("button").first().click();
  await expect(quiz.getByRole("status")).toBeVisible();
  const next = page.getByRole("link", { name: "Nächste Lektion", exact: true });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/lektion\/3$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/lektion\/2$/);
  await expect(quiz.getByRole("status")).toHaveCount(0);
  for (const question of course.lessons[1].quiz) {
    await quiz.getByRole("button").filter({ hasText: /^[A-Z]\./ }).nth((question.correct + 1) % question.options.length).click();
    await quiz.getByRole("button", { name: /Nächste Frage|Ergebnis anzeigen/ }).click();
  }
  await expect(page.getByText("Quiz abgeschlossen — 0/3 richtig", { exact: true })).toBeVisible();
  await next.click();
  await expect(page).toHaveURL(/\/lektion\/3$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/lektion\/2$/);
  await expect(page.getByText("Quiz abgeschlossen — 0/3 richtig", { exact: true })).toBeVisible();
  await next.click();
  await expect(page).toHaveURL(/\/lektion\/3$/);
  await quiz.getByRole("button").first().click();
  await page.evaluate(() => window.history.pushState(null, "", "?test=1"));
  await expect(quiz.getByRole("status")).toHaveCount(0);
  await expect(page.getByText("1 Quiz abgeschlossen", { exact: false })).toBeVisible();
  expect((await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
