import { expect, test } from "./test-fixtures";

// Dev bundles are deliberately not a production byte-budget measurement.
test.skip(!process.env.PLAYWRIGHT_PRODUCTION_PERFORMANCE, "Requires an optimized production preview");

test.use({ viewport: { width: 390, height: 844 } });
for (const route of ["/finder", "/warenkorb"]) {
  test(`${route} does not duplicate the shopping provider payload`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const client = await page.context().newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    expect(await page.locator("main").innerText()).not.toContain("Deine Auswahl wird geladen");
    const scriptTransfer = await page.evaluate(() =>
      (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
        .filter(entry => new URL(entry.name).pathname.endsWith(".js"))
        .reduce((bytes, entry) => bytes + entry.transferSize, 0),
    );
    // Baseline bodies: finder 180,176; cart 175,834. This allowance catches
    // the measured 213,977 / 196,035-byte dynamic-root regression.
    expect(scriptTransfer).toBeGreaterThan(0);
    expect(scriptTransfer).toBeLessThanOrEqual(190 * 1024);
    expect(errors).toEqual([]);
    await client.detach();
  });
}

test("deferred cart drawer retains its original typography and keyboard lifecycle", async ({ page }) => {
  await page.goto("/vermietung");
  await page.getByLabel("Gewünschte Abholung").fill("2026-10-12");
  await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-14");
  await page.getByRole("spinbutton", { name: "Menge für Kühlanhänger", exact: true }).fill("1");
  await page.getByRole("button", { name: "In den Warenkorb", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Entfernen", exact: true })).toHaveCSS("line-height", "24px");
  await expect(dialog.getByRole("button", { name: "Schließen", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("[data-cart-focus-return]")).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});
