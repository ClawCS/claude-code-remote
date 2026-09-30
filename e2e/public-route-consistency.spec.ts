import { expect, test } from "@playwright/test";

test("community has one shared main landmark without a nested legacy main", async ({ page }) => {
  const response = await page.goto("/community");
  expect(response?.status()).toBe(200);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("main#main-content")).toHaveCount(1);
  await expect(page.locator("[data-cinematic-header]")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(page.locator(".glass-header, [data-legacy-footer]")).toHaveCount(0);
});

test("shared furniture selection cannot reserve bundles and single items on overlapping dates", async ({ page }) => {
  await page.goto("/vermietung");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Belegte Preise. Persönliche Bestätigung.", exact: true })).toHaveCount(0);
  await expect(page.locator('[aria-labelledby="rental-conditions"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Dein gewünschter Zeitraum", exact: true })).toBeVisible();
  await page.getByLabel("Gewünschte Abholung", { exact: true }).fill("2026-10-05");
  await page.getByLabel("Gewünschte Rückgabe", { exact: true }).fill("2026-10-07");
  const table = page.getByRole("spinbutton", { name: "Menge für Tisch einzeln", exact: true });
  const bench = page.getByRole("spinbutton", { name: "Menge für Bank einzeln", exact: true });
  const set = page.getByRole("spinbutton", { name: "Menge für Bierzeltgarnitur", exact: true });

  await table.fill("13");
  await expect(table).toHaveValue("13");
  await set.fill("13");
  await expect(set).toHaveValue("13");
  await expect(table).toHaveValue("0");
  await bench.fill("44");
  await expect(bench).toHaveValue("44");
  await expect(set).toHaveValue("0");
  await set.fill("13");
  await expect(table).toHaveValue("0");
  await expect(bench).toHaveValue("0");

  // Individual tables and benches can be combined; the bundle is not extra stock.
  await table.fill("13");
  await bench.fill("44");
  await expect(table).toHaveValue("13");
  await expect(bench).toHaveValue("44");
  await expect(set).toHaveValue("0");
  await page.getByRole("button", { name: "Zur Anfrageliste", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Deine Anfrageliste", exact: true });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator("li")).toHaveCount(2);
  await expect(drawer).toContainText("Tisch einzeln");
  await expect(drawer).toContainText("Bank einzeln");
  await expect(drawer).not.toContainText("Bierzeltgarnitur");
  await drawer.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(set).toHaveAttribute("max", "0");
  await set.fill("13");
  await expect(set).toHaveValue("0");
  await expect(page.getByRole("button", { name: "Zur Anfrageliste", exact: true })).toBeDisabled();

  // Non-overlapping dates release the same physical pool for a separate request.
  await page.getByLabel("Gewünschte Abholung", { exact: true }).fill("2026-10-08");
  await page.getByLabel("Gewünschte Rückgabe", { exact: true }).fill("2026-10-09");
  await expect(set).toHaveAttribute("max", "13");
  await set.fill("13");
  await page.getByRole("button", { name: "Zur Anfrageliste", exact: true }).click();
  await expect(drawer).toBeVisible();
  await expect(drawer.locator("li")).toHaveCount(3);
  await expect(drawer).toContainText("Bierzeltgarnitur");
  await expect(drawer).toContainText("2026-10-08 – 2026-10-09");
});

test("warengruppen behalten den neuen Rahmen bei direktem Aufruf und Navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Bier & Fassbier Entdecken" }).click();
  await expect(page).toHaveURL(/\/kategorie\/bier$/);
  await expect(page.locator("[data-cinematic-header]")).toHaveCount(1);
  await expect(page.locator(".glass-header, [data-legacy-footer]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Bier", exact: true })).toBeVisible();
  await expect(page.locator("[data-category-intro]")).toBeVisible();
  await page.reload();
  await expect(page.locator("[data-cinematic-header]")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
});

test("fachnavigation führt auf eigene Seiten statt Startseitenabschnitte", async ({ page }) => {
  await page.goto("/produkte");
  const nav = page.getByRole("navigation", { name: "Hauptnavigation", exact: true });
  await expect(nav.getByRole("link", { name: "Angebote", exact: true })).toHaveAttribute("href", "/angebote");
  await expect(nav.getByRole("link", { name: "Gewinnspiele", exact: true })).toHaveAttribute("href", "/gewinnspiel");
  await expect(nav.getByRole("link", { name: "Team", exact: true })).toHaveAttribute("href", "/galerie");
  await nav.getByRole("link", { name: "Team", exact: true }).click();
  await expect(page).toHaveURL(/\/galerie$/);
  await expect(page.locator("[data-cinematic-header]")).toHaveCount(1);
});

test("Sortimentskategorien sind eigenständige Links und keine Bildersatzlogos", async ({ page }) => {
  await page.goto("/produkte");
  await expect(page.getByRole("link", { name: "Sekt & Co.", exact: true })).toHaveAttribute("href", "/kategorie/sekt");
  await page.getByRole("link", { name: "Sekt & Co.", exact: true }).click();
  await expect(page).toHaveURL(/\/kategorie\/sekt$/);
  await expect(page.getByRole("heading", { name: "Sekt & Co.", exact: true })).toBeVisible();
  await expect(page.locator('[data-product-card] img[alt*="neutrales Sortimentsbild"]')).toHaveCount(0);
});
