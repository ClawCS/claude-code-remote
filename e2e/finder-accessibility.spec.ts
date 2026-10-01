import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const flows = [
  { name: "Bierfinder", answers: ["Pils – herb & frisch", "Keine Präferenz", "Feierabendbier"] },
  { name: "Weinfinder", answers: ["Rotwein", "Trocken", "Zum Essen"] },
  { name: "Wasserfinder", answers: ["Sprudel (Classic)", "Egal", "Täglicher Bedarf"] },
] as const;

async function expectAccessibleState(page: Page): Promise<void> {
  await expect.soft(page.locator("main h1"), "each finder state needs one page heading").toHaveCount(1);
  const result = await new AxeBuilder({ page }).include("main").analyze();
  expect.soft(result.violations.filter(({ impact, id }) => impact === "serious" || impact === "critical" || id === "heading-order")).toEqual([]);
  const clipped = await page.locator("main h1, main h2, main h3, main p, main button, main a").evaluateAll(elements => elements.filter(element => {
    if (!element.checkVisibility()) return false;
    const bounds = element.getBoundingClientRect();
    return bounds.left < -1 || bounds.right > window.innerWidth + 1 || element.scrollWidth > element.clientWidth + 1;
  }).map(element => element.textContent));
  expect.soft(clipped).toEqual([]);
}

for (const width of [320, 1440]) {
  for (const flow of flows) {
    test(`${flow.name} keeps accessible question and result states at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/finder");
      await page.getByRole("button", { name: new RegExp(flow.name) }).click();
      for (const answer of flow.answers) {
        await expect(page.getByRole("heading", { level: 1, name: flow.name, exact: true })).toBeVisible();
        await expectAccessibleState(page);
        await page.getByRole("button", { name: answer, exact: true }).click();
      }
      await expect(page.getByRole("heading", { name: "Unsere Empfehlungen für dich!", exact: true })).toBeVisible();
      if (flow.name === "Bierfinder") {
        await expect(page.locator("[data-product-card]").first()).toBeVisible();
      } else {
        await expect(page.locator("[data-product-card]")).toHaveCount(0);
        await expect(page.getByText(/Für diese Auswahl ist kein passendes Sortimentsbeispiel hinterlegt/)).toBeVisible();
      }
      await expectAccessibleState(page);
      await page.screenshot({ path: testInfo.outputPath("finder-results.png"), fullPage: true });
      await page.getByRole("button", { name: "Nochmal versuchen", exact: true }).click();
      await expect(page.getByRole("heading", { level: 1, name: "Getränke-Finder", exact: true })).toBeVisible();
    });
  }
}

test("keyboard choice moves focus to the new question instead of losing it to the page", async ({ page }) => {
  await page.goto("/finder");
  const chooser = page.getByRole("button", { name: /Bierfinder/ });
  await chooser.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Welchen Biertyp bevorzugst du?", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Pils – herb & frisch", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Wie möchtest du dein Bier genießen?", exact: true })).toBeFocused();
});

test("an empty beer result keeps its page heading and keyboard reset destination", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/finder");
  await page.getByRole("button", { name: /Bierfinder/ }).click();
  for (const name of ["Pils – herb & frisch", "Alkoholfrei", "Feierabendbier"]) {
    await page.getByRole("button", { name, exact: true }).click();
  }
  await expect(page.locator("[data-product-card]")).toHaveCount(0);
  await expect(page.getByText(/Für diese Auswahl ist kein passendes Sortimentsbeispiel hinterlegt/)).toBeVisible();
  await expectAccessibleState(page);
  await expect(page.getByRole("heading", { level: 1, name: "Unsere Empfehlungen für dich!", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Nochmal versuchen", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Getränke-Finder", exact: true })).toBeFocused();
});

for (const flow of flows.slice(1)) {
  test(`hard finder preferences never fall back to unrelated ${flow.name} products`, async ({ page }) => {
    await page.goto("/finder");
    await page.getByRole("button", { name: new RegExp(flow.name) }).click();
    for (const name of flow.answers) await page.getByRole("button", { name, exact: true }).click();
    // The catalog has no verified dry-red combination or water carbonation.
    await expect(page.locator("[data-product-card]")).toHaveCount(0);
    await expect(page.getByText(/Für diese Auswahl ist kein passendes Sortimentsbeispiel hinterlegt/)).toBeVisible();
  });
}

test("hard finder Alt preference does not match the brand name Altenmünster", async ({ page }) => {
  await page.goto("/finder");
  await page.getByRole("button", { name: /Bierfinder/ }).click();
  for (const name of ["Alt – malzig & vollmundig", "Keine Präferenz", "Feierabendbier"]) await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByRole("heading", { name: "Altenmünster Urig Würzig", exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Bolten Altbier", exact: true })).toBeVisible();
});
