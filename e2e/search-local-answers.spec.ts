import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  { path: "/kontakt", topic: "contact" },
  { path: "/nl", topic: "nl" },
  { path: "/vermietung", topic: "rental" },
  { path: "/eigenmarke", topic: "brands" },
  { path: "/cocktails/mojito", topic: null },
  { path: "/cocktails/ranch-water", topic: null },
] as const;

for (const width of [390, 1440]) {
  for (const route of routes) {
    test(`${route.path} visible answers/schema, layout and accessibility at ${width}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 45_000 });
      expect(response?.status()).toBe(200);
      const target = page.locator(route.topic ? `[data-local-answers="${route.topic}"]` : '[data-learning="recipe"]');
      await target.scrollIntoViewIfNeeded();
      await expect(target).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const scan = await new AxeBuilder({ page }).include(route.topic ? '[data-local-answers]' : '[data-learning="recipe"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(scan.violations).toEqual([]);
      if (route.topic) {
        const link = target.locator("a").first();
        await page.keyboard.press("Tab");
        await link.focus();
        await expect(link).toBeFocused();
        await expect(link).toHaveCSS("outline-style", "solid");
      }
      if (!route.topic) {
        const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent!)));
        const recipe = schemas.find(item => item["@type"] === "Recipe");
        expect(recipe).toBeTruthy();
        expect(recipe.recipeIngredient).toEqual(await page.locator('#recipe-ingredients + ul li').allTextContents());
        expect(recipe.recipeInstructions).toBe(await page.locator('#recipe-instructions + p').textContent());
        const breadcrumbs = schemas.find(item => item["@type"] === "BreadcrumbList");
        expect(breadcrumbs.itemListElement[3].item).toBe(`https://trinkgut-jammers.de${route.path}`);
        if (route.path.endsWith("mojito")) expect(recipe.image).toBe("https://trinkgut-jammers.de/images/cocktails/mojito.webp");
        else expect(recipe.image).toBeUndefined();
      }
      await page.screenshot({ path: `.superpowers/sdd/2026-10-11-search-optimization/task-2-${route.path.slice(1).replaceAll("/", "-")}-${width}.png` });
    });
  }
  test(`Dutch brand links land on stable anchors at ${width}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/nl", { waitUntil: "domcontentloaded", timeout: 45_000 });
    const links = page.locator('[aria-labelledby="nl-brands-title"] li a');
    await expect(links).toHaveCount(6);
    const hrefs = await links.evaluateAll(nodes => nodes.map(node => node.getAttribute("href")));
    expect(hrefs).toEqual(["/eigenmarke#pralle-kirsche", "/eigenmarke#dicke-nuesse", "/eigenmarke#suesse-suende", "/eigenmarke#caramello", "/eigenmarke#schwarzer-teufel", "/eigenmarke#weisser-engel"]);
    await links.first().click();
    await expect(page).toHaveURL(/\/eigenmarke#pralle-kirsche$/);
    await expect(page.locator("#pralle-kirsche")).toBeInViewport();
    for (const href of hrefs) await expect(page.locator(href!.slice(href!.indexOf("#")))).toHaveCount(1);
  });
}
