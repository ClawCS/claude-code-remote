import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 320, height: 900 } });
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("Escape returns mobile navigation focus to its visible trigger", async ({ page }) => {
  await page.goto("/cocktails");
  await page.waitForLoadState("networkidle");
  const trigger = page.getByRole("button", { name: "Menü öffnen", exact: true });
  await trigger.click();
  await page.getByRole("navigation", { name: "Mobile Navigation", exact: true })
    .getByRole("link", { name: "Cocktail-Rezepte", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-mobile-navigation]")).not.toHaveAttribute("open");
  await expect(trigger).toBeFocused();
});

test("assortment origin filters all fit inside a 320px viewport", async ({ page }) => {
  await page.goto("/produkte");
  await page.evaluate(() => document.fonts.ready);
  for (const name of [/Alle Angebote/, /Deutsch/, /Nederlands/]) {
    const button = page.getByRole("button", { name });
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeInViewport({ ratio: 1 });
    const bounds = await button.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  }
});

// Dropping a form label or restoring the original low-contrast colors must
// fail on the real rendered utility pages, not a mocked component.
for (const route of ["/produkte", "/partyplaner", "/leergut", "/oeko-tracker", "/partyspiele", "/kontakt"]) {
  test(`${route} has no serious or critical main-content accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const result = await new AxeBuilder({ page }).include("main").analyze();
    expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);
  });
}

// Restoring an h1-to-h3 jump in a catalog or utility page must fail the
// document-outline contract independently of the contrast/label checks.
for (const route of ["/produkte", "/partyplaner", "/leergut", "/oeko-tracker", "/partyspiele", "/kategorie/bier", "/kategorie/alkoholfrei", "/kategorie/sekt"]) {
  test(`${route} preserves sequential main-content heading levels`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const result = await new AxeBuilder({ page }).include("main").withRules(["heading-order"]).analyze();
    expect(result.violations).toEqual([]);
  });
}
