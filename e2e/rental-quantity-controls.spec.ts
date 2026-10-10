import { test, expect } from "@playwright/test";

test("rental plus/minus respects zero, physical stock and direct numeric entry", async ({ page }) => {
  await page.goto("/vermietung");
  const trailer = page.locator('article[data-rental-name="Kühlanhänger"]');
  const quantity = trailer.getByRole("spinbutton", { name: "Menge für Kühlanhänger", exact: true });
  const minus = trailer.getByRole("button", { name: "Menge für Kühlanhänger verringern", exact: true });
  const plus = trailer.getByRole("button", { name: "Menge für Kühlanhänger erhöhen", exact: true });
  await expect(minus).toBeDisabled();
  await plus.click();
  await expect(quantity).toHaveValue("1");
  await minus.click();
  await expect(quantity).toHaveValue("0");
  await expect(minus).toBeDisabled();
  await quantity.fill("3");
  await plus.click();
  await expect(quantity).toHaveValue("3");
  await expect(trailer.getByRole("alert")).toHaveText("Diese Menge ist nicht verfügbar. Bitte reduziere die Menge.");
  await quantity.fill("999");
  await expect(quantity).toHaveValue("3");
  await expect(trailer.getByRole("alert")).toHaveText("Diese Menge ist nicht verfügbar. Bitte reduziere die Menge.");
  await minus.click();
  await expect(quantity).toHaveValue("2");
  await expect(trailer.getByRole("alert")).toHaveCount(0);
  await expect(plus).toBeEnabled();
});

test("rental plus/minus preserves shared furniture safeguards", async ({ page }) => {
  await page.goto("/vermietung");
  const set = page.locator('article[data-rental-name="Bierzeltgarnitur"]');
  const table = page.locator('article[data-rental-name="Tisch einzeln"]');
  await set.getByRole("button", { name: "Menge für Bierzeltgarnitur erhöhen", exact: true }).click();
  await expect(set.getByRole("spinbutton")).toHaveValue("1");
  await table.getByRole("button", { name: "Menge für Tisch einzeln erhöhen", exact: true }).click();
  await expect(table.getByRole("spinbutton")).toHaveValue("1");
  await expect(set.getByRole("spinbutton")).toHaveValue("0");
});

test("rental controls are usable on mobile and reflect existing cart capacity", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vermietung");
  await page.getByLabel("Gewünschte Abholung").fill("2026-10-05");
  await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-07");
  const trailer = page.locator('article[data-rental-name="Kühlanhänger"]');
  const plus = trailer.getByRole("button", { name: "Menge für Kühlanhänger erhöhen", exact: true });
  await plus.scrollIntoViewIfNeeded();
  const box = await plus.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await trailer.getByRole("spinbutton").fill("3");
  await page.getByRole("button", { name: "In den Warenkorb", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(trailer.getByRole("spinbutton")).toHaveValue("0");
  await plus.click();
  await expect(trailer.getByRole("spinbutton")).toHaveValue("0");
  await expect(trailer.getByRole("alert")).toHaveText("Diese Menge ist nicht verfügbar. Bitte reduziere die Menge.");
  await expect(trailer).not.toContainText(/Bestand|höchstens/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("cart quantity increases explain the limit without changing the accepted quantity", async ({ page }) => {
  await page.goto("/vermietung");
  await page.getByLabel("Gewünschte Abholung").fill("2026-10-12");
  await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-14");
  await page.getByRole("spinbutton", { name: "Menge für Kühlanhänger", exact: true }).fill("3");
  await page.getByRole("button", { name: "In den Warenkorb", exact: true }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("button", { name: "Menge für Kühlanhänger erhöhen", exact: true }).click();
  await expect(drawer.getByRole("alert")).toHaveText("Diese Menge ist nicht verfügbar. Bitte reduziere die Menge.");
  await expect(drawer).toContainText("3 Stück");
  await drawer.getByRole("link", { name: "Liste prüfen", exact: true }).click();
  await page.getByRole("button", { name: "Menge für Kühlanhänger erhöhen", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Diese Menge ist nicht verfügbar. Bitte reduziere die Menge.");
  await page.getByRole("button", { name: "Menge für Kühlanhänger verringern", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  await expect(page.getByText("Positionssumme: 300,00", { exact: false })).toBeVisible();
});

test("a date-conflicted selection can decrease stepwise while invalid quantities cannot be added", async ({ page }) => {
  await page.goto("/vermietung");
  await page.getByLabel("Gewünschte Abholung").fill("2026-10-12");
  await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-14");
  const trailer = page.locator('article[data-rental-name="Kühlanhänger"]');
  await trailer.getByRole("spinbutton").fill("3");
  await page.getByRole("button", { name: "In den Warenkorb", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Schließen", exact: true }).click();
  await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-17");
  await page.getByLabel("Gewünschte Abholung").fill("2026-10-15");
  await trailer.getByRole("spinbutton").fill("3");
  await page.getByRole("spinbutton", { name: "Menge für Kühltruhe", exact: true }).fill("1");
  await page.getByLabel("Gewünschte Abholung").fill("2026-10-14");
  await expect(trailer.getByRole("alert")).toHaveText("Diese Menge ist nicht verfügbar. Bitte reduziere die Menge.");
  const add = page.getByRole("button", { name: "In den Warenkorb", exact: true });
  const minus = trailer.getByRole("button", { name: "Menge für Kühlanhänger verringern", exact: true });
  await expect(add).toBeDisabled();
  for (const quantity of ["2", "1"]) {
    await minus.click();
    await expect(trailer.getByRole("spinbutton")).toHaveValue(quantity);
    await expect(trailer.getByRole("alert")).toHaveText("Diese Menge ist nicht verfügbar. Bitte reduziere die Menge.");
    await expect(add).toBeDisabled();
  }
  await minus.click();
  await expect(trailer.getByRole("spinbutton")).toHaveValue("0");
  await expect(trailer.getByRole("alert")).toHaveCount(0);
  await expect(add).toBeEnabled();
});
