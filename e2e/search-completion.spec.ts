import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PUBLIC_JOBS } from "../data/jobs";
import { courses } from "../data/akademie";

for (const width of [390, 1440]) {
  test(`public vacancy pages remain readable, accessible and email-only at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const job of PUBLIC_JOBS) {
      await page.goto(`/karriere/${job.slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(job.title);
      await expect(page.getByRole("link", { name: "Für diese Stelle bewerben →", exact: true })).toHaveAttribute("href", `mailto:info@trinkgut-jammers.de?subject=${encodeURIComponent(job.emailSubject)}`);
      await expect(page.locator('main input[type="file"]')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    }
  });
  test(`source information opens with the keyboard and works without JavaScript at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: false });
    const page = await context.newPage();
    for (const course of courses) {
      await page.goto(`/akademie/${course.slug}`);
      const sources = page.locator(`[data-content-review="academy:${course.slug}:1"]`);
      await sources.locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(sources.getByText("Quellenabgleich:", { exact: false })).toBeVisible();
      expect(await sources.locator('a[href^="https://"]').count()).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.goto("/cocktails/negroni");
    const sources = page.locator('[data-content-review="recipe:negroni"]');
    await sources.locator("summary").click();
    await expect(sources.locator("time")).toBeVisible();
    await context.close();
  });
}
