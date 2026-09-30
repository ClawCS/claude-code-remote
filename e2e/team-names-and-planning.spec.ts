import { test, expect } from "./test-fixtures";
import type { Page } from "@playwright/test";

const names = ["Niko", "Sven", "Jasmin", "Gabriella", "Jan Niklas", "Hanna", "Henri", "Hannah"];

async function expectNoDepartedProfiles(page: Page) {
  await expect(page.locator("main").getByText(/\b(?:Nils|Nico|Tim)\b/)).toHaveCount(0);
  await expect(page.getByRole("img", { name: /\b(?:Nils|Nico|Tim)\b/ })).toHaveCount(0);
  await expect(page.locator('main img[src*="team-nils"], main img[src*="team-nico"], main img[src*="team-tim"]')).toHaveCount(0);
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`portrait captions contain names only at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator("#menschen figcaption")).toHaveText(names);
    await expect(page.locator('[data-hero="cinematic"] figcaption')).toHaveText("Sven & Niko");
    await expectNoDepartedProfiles(page);

    await page.goto("/galerie");
    await expect(page.locator('section[aria-labelledby="team-gallery-title"] figcaption')).toHaveText(names);
    await expectNoDepartedProfiles(page);

    await page.goto("/nl");
    await expect(page.locator("main figcaption")).toHaveText(["Sven & Niko", ...names]);
    await expectNoDepartedProfiles(page);
  });

  test(`hero, service and footer planning links reach the interactive party planner at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const selector of ['[data-hero="cinematic"] a[href="/partyplaner"]', '#service a[href="/partyplaner"]', 'footer a[href="/partyplaner"]']) {
      await page.goto("/");
      await page.locator(selector).click();
      await expect(page).toHaveURL(/\/partyplaner$/);
      await expect(page.getByRole("heading", { level: 1, name: "Partyplaner", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Berechnen", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Deine Party-Einkaufsliste", exact: true })).toBeVisible();
    }
  });
}
