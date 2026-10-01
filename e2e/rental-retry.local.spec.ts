import { test, expect, type Page } from "@playwright/test";

test("a lost order response followed by reload does not create a second order", async ({ page, baseURL }) => {
  test.skip(process.env.RENTAL_E2E !== "1", "Only an explicitly enabled local rental test server is allowed.");
  expect(new URL(baseURL!).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
  expect((await (await page.request.get("/api/rentals/config")).json()).testMode).toBe(true);
  const date = new Date(); date.setUTCDate(date.getUTCDate() + 35);
  while (date.getUTCDay() !== 1) date.setUTCDate(date.getUTCDate() + 1);
  const start = date.toISOString().slice(0, 10);
  const email = `retry-${crypto.randomUUID()}@example.invalid`;
  async function fillCustomer(target: Page) {
    await target.getByLabel("Vor- und Nachname").fill("Test Wiederholung");
    await target.getByLabel("E-Mail-Adresse", { exact: true }).fill(email);
    await target.getByLabel("Telefon für Terminabsprachen").fill("0123456789");
    await target.getByLabel("Straße und Hausnummer").fill("Teststraße 1");
    await target.getByLabel("Postleitzahl", { exact: true }).fill("00000");
    await target.getByLabel("Ort", { exact: true }).fill("Testort");
    await target.getByRole("checkbox", { name: /Ich akzeptiere die Mietbedingungen/ }).check();
  }
  await page.goto("/vermietung");
  await page.getByLabel("Gewünschte Abholung").fill(start);
  await page.getByLabel("Gewünschte Rückgabe").fill(start);
  await page.getByRole("button", { name: "Menge für Kühlanhänger erhöhen", exact: true }).click();
  await page.getByRole("button", { name: "In den Warenkorb", exact: true }).click();
  await page.goto("/checkout");
  await fillCustomer(page);
  let savedId = "";
  await page.route("**/api/rentals/orders", async route => {
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    savedId = new URL((await response.json()).statusUrl).pathname.split("/").pop()!;
    await route.abort("failed"); // The real server saved it; only the browser's response is lost.
  }, { times: 1 });
  await page.getByRole("button", { name: "Zahlungspflichtig bestellen (Test)", exact: true }).click();
  await expect.poll(() => savedId).not.toBe("");
  await expect(page.getByRole("alert").filter({ hasText: /fetch|Verbindung|versuchen/i })).toBeVisible();
  await page.reload();
  await fillCustomer(page);
  await page.getByRole("button", { name: "Zahlungspflichtig bestellen (Test)", exact: true }).click();
  await page.waitForURL(/\/mietbestellung\//);
  expect(new URL(page.url()).pathname.split("/").pop()).toBe(savedId);
  expect(await page.evaluate(() => sessionStorage.getItem("trinkgut-cart"))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem("jammers-rental-pending-submissions-v1"))).toBeNull();
});
