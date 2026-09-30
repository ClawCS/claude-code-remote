import { expect, test } from "@playwright/test";

test("recipe cards open complete recipe URLs, not a modal", async ({ page }) => {
  await page.goto("/cocktails");
  await page.getByRole("link", { name: "Mojito – Rezept ansehen", exact: true }).click();
  await expect(page).toHaveURL(/\/cocktails\/mojito$/);
  await expect(page.getByRole("heading", { level: 1, name: "Mojito", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Zutaten", exact: true })).toBeVisible();
  await expect(page.getByText("5 cl weißer Rum", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Zubereitung", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Mojito", exact: true })).toBeVisible();
});

test("category links open dedicated pages and remain available from a recipe", async ({ page }) => {
  await page.goto("/cocktails");
  await page.getByRole("navigation", { name: "Rezeptkategorien" }).getByRole("link", { name: "Rum (12)", exact: true }).click();
  await expect(page).toHaveURL(/\/cocktails\/kategorie\/rum$/);
  await expect(page.getByRole("heading", { level: 1, name: "Cocktails mit Rum", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /– Rezept ansehen$/ })).toHaveCount(12);
  await expect(page.getByRole("link", { name: "Margarita – Rezept ansehen", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Mojito – Rezept ansehen", exact: true }).click();
  await page.getByRole("link", { name: "Kategorie: Rum", exact: true }).click();
  await expect(page).toHaveURL(/\/cocktails\/kategorie\/rum$/);
});

test("unknown recipe and category paths return 404", async ({ request }) => {
  for (const path of ["/cocktails/not-a-recipe", "/cocktails/kategorie/not-a-category"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});
