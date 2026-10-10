import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function setRange(page: Page, id: string, value: number, min = 0, step = 5) {
  const input = page.locator(`#party-${id}`);
  await input.focus();
  await input.press("Home");
  for (let i = min; i < value; i += step) await input.press("ArrowRight");
}

test("party calculation shows category litres, including fractional spirits, without product selection", async ({ page }) => {
  await page.goto("/partyplaner");
  await page.getByRole("button", { name: "Berechnen", exact: true }).click();
  const result = page.getByRole("region", { name: "Dein Getränkebedarf" });
  await expect(result).toBeVisible();
  for (const [category, amount] of [["Bier", "33 l"], ["Wein", "8 l"], ["Softdrinks", "10 l"], ["Spirituosen", "0,8 l"], ["Wasser", "20 l"]]) {
    await expect(result.locator("dl > div").filter({ has: page.getByText(category, { exact: true }) }).locator("dd")).toHaveText(amount);
  }
  await expect(result.locator("img, button, a")).toHaveCount(0);
  await expect(result.locator("dt")).toHaveCount(5);
  await expect(result).not.toContainText(/Packungen|€|Preis|Anfrageliste/);
});

test("alcohol-free planning keeps water separate and zero-share categories at zero", async ({ page }) => {
  await page.goto("/partyplaner");
  for (const key of ["beerDrinkers", "wineDrinkers", "spiritDrinkers"]) await setRange(page, key, 0);
  await setRange(page, "softDrinkers", 100);
  await page.getByRole("button", { name: "Berechnen", exact: true }).click();
  const result = page.getByRole("region", { name: "Dein Getränkebedarf" });
  await expect(result.locator("dd")).toHaveText(["0 l", "0 l", "50 l", "0 l", "20 l"]);
});

test("small positive volumes do not disappear and result remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/partyplaner");
  await setRange(page, "guests", 5, 5);
  await setRange(page, "duration", 2, 2, 1);
  await setRange(page, "spiritDrinkers", 5);
  await setRange(page, "softDrinkers", 25);
  await page.getByRole("button", { name: "Berechnen", exact: true }).click();
  const result = page.getByRole("region", { name: "Dein Getränkebedarf" });
  await expect(result.locator("dd")).toHaveText(["3,3 l", "0,8 l", "1,25 l", "0,04 l", "2 l"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});

for (const key of ["guests", "duration", "beerDrinkers", "wineDrinkers", "softDrinkers", "spiritDrinkers"]) {
  test(`changing ${key} clears the previous calculation`, async ({ page }) => {
    await page.goto("/partyplaner");
    await page.getByRole("button", { name: "Berechnen", exact: true }).click();
    const result = page.getByRole("region", { name: "Dein Getränkebedarf" });
    await expect(result).toBeVisible();
    await page.locator(`#party-${key}`).focus();
    await page.locator(`#party-${key}`).press("ArrowRight");
    await expect(result).toHaveCount(0);
  });
}
