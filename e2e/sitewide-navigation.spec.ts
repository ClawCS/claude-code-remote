import { expect, test, type Locator, type Page } from "@playwright/test";

const destinations = [
  ["Angebote", "/angebote", ""], ["Sortiment", "/produkte", ""],
  ["Party & Miete", "/vermietung", ""], ["Dein Besuch", "/kontakt", ""],
  ["Partyplaner", "/partyplaner", "party"], ["Mietauswahl", "/vermietung", "party"], ["Anfrageliste", "/warenkorb", "party"],
  ["Eigenmarken", "/eigenmarke", "discover"], ["Regionale Spezialitäten", "/regionale-spirituosen", "discover"],
  ["Geschenkideen", "/geschenkideen", "discover"], ["Marktleben", "/marktleben", "discover"],
  ["Gewinnspiele", "/gewinnspiel", "discover"], ["Cocktail-Rezepte", "/cocktails", "discover"],
  ["Getränkeakademie", "/akademie", "discover"], ["Unser Team", "/galerie", "discover"],
  ["Offene Stellen & Bewerbung", "/bewerbung", "discover"],
] as const;

async function navigation(page: Page, width: number): Promise<Locator> {
  const header = page.locator("[data-cinematic-header]");
  if (width < 1152) await header.getByRole("button", { name: "Menü öffnen", exact: true }).click();
  return header.getByRole("navigation", { name: width < 1152 ? "Mobile Navigation" : "Hauptnavigation", exact: true });
}

for (const width of [390, 1440]) {
  test(`all internal header destinations survive client route changes at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    for (const [label, path, group] of destinations) {
      const nav = await navigation(page, width);
      await expect(nav.locator(":scope > ul > li")).toHaveCount(5);
      if (group === "party") await nav.locator('summary[aria-label="Party & Miete – Untermenü öffnen"]').click();
      if (group === "discover") await nav.locator("summary").filter({ hasText: "Jammers entdecken" }).click();
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", path);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.locator("main")).toBeVisible();
      await expect(nav.locator("details[open]")).toHaveCount(0);
    }
    const nav = await navigation(page, width);
    await nav.locator("summary").filter({ hasText: "Jammers entdecken" }).click();
    await expect(nav.getByRole("link", { name: "GrailBid · TCG-Shop", exact: true })).toHaveAttribute("href", "https://grailbid.com");
    await page.locator('[data-cinematic-header] a[aria-label="Trinkgut Jammers – Startseite"]').click();
    await expect(page).toHaveURL(/\/$/);
    await page.locator('[data-cinematic-header] a[lang="nl"]').click();
    await expect(page).toHaveURL(/\/nl$/);
  });

  test(`keyboard disclosure returns focus and dismisses with Escape at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/kontakt");
    await page.waitForLoadState("networkidle");
    const nav = await navigation(page, width);
    const summary = nav.locator("summary").filter({ hasText: "Jammers entdecken" });
    await summary.focus();
    await summary.press("Enter");
    await page.keyboard.press("Tab");
    await expect(nav.getByRole("link", { name: "Eigenmarken", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(nav.locator("details[open]")).toHaveCount(0);
    await expect(summary).toBeFocused();
    if (width < 1152) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Menü öffnen", exact: true })).toBeFocused();
    }
  });

  test(`native disclosure navigation without JavaScript at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ baseURL: test.info().project.use.baseURL, javaScriptEnabled: false, viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto("/kontakt");
    const nav = await navigation(page, width);
    await nav.locator("summary").filter({ hasText: "Jammers entdecken" }).click();
    await nav.getByRole("link", { name: "Unser Team", exact: true }).click();
    await expect(page).toHaveURL(/\/galerie$/);
    await context.close();
  });

  test(`keyboard navigation to another main link closes the discover panel at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/kontakt");
    await page.waitForLoadState("networkidle");
    const nav = await navigation(page, width);
    await nav.locator("summary").filter({ hasText: "Jammers entdecken" }).press("Enter");
    await expect(nav.locator("details[open]")).toHaveCount(1);
    await nav.getByRole("link", { name: "Sortiment", exact: true }).press("Enter");
    await expect(page).toHaveURL(/\/produkte$/);
    await expect(nav.locator("details[open]")).toHaveCount(0);
  });
}

test("tablet header and expanded navigation have no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/kontakt");
  const nav = await navigation(page, 768);
  await nav.locator("summary").filter({ hasText: "Jammers entdecken" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await nav.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(page.locator('[data-cinematic-header] a[lang="nl"]')).toBeVisible();
});
