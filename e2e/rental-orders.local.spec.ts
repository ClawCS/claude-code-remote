import { test, expect } from "@playwright/test";
import { countRentalWorkdays } from "../lib/rental-calendar";

test.describe("local-only rental ordering", () => {
  test.skip(process.env.RENTAL_E2E !== "1", "Requires explicitly started loopback rental test server; never run against live services.");
  for (const method of ["cash", "online"] as const) test(`${method}: customer order, acceptance, payment, handover and both mail recipients`, async ({ page, context, baseURL }) => {
    test.setTimeout(90000);
    expect(new URL(baseURL!).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
    const cfg = await page.request.get("/api/rentals/config");
    expect((await cfg.json()).testMode).toBe(true);
    const date = new Date(); date.setUTCDate(date.getUTCDate() + 21);
    while (date.getUTCDay() !== 1) date.setUTCDate(date.getUTCDate() + 1);
    const start = date.toISOString().slice(0, 10);
    while (countRentalWorkdays(start, date.toISOString().slice(0, 10)) < 4) date.setUTCDate(date.getUTCDate() + 1);
    const end = date.toISOString().slice(0, 10);
    await page.setViewportSize({ width: method === "cash" ? 390 : 1440, height: 900 });
    await page.goto("/vermietung");
    await page.getByLabel("Gewünschte Abholung").fill(start);
    await page.getByLabel("Gewünschte Rückgabe").fill(end);
    await page.getByRole("button", { name: "Menge für Kühlanhänger erhöhen", exact: true }).click();
    await expect(page.getByText("Mietgesamtpreis:")).toContainText("300,00");
    await page.getByRole("button", { name: "In den Warenkorb", exact: true }).click();
    await page.goto("/warenkorb");
    await expect(page.getByText("300,00", { exact: false }).first()).toBeVisible();
    await page.getByRole("link", { name: "Unverbindlich anfragen", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Deine Mietbestellung" })).toBeVisible();
    await page.getByLabel("Vor- und Nachname").fill(`Testkunde ${method}`);
    await page.getByLabel("E-Mail-Adresse", { exact: true }).fill(`test-${method}@example.invalid`);
    await page.getByLabel("Telefon für Terminabsprachen").fill("0123456789");
    await page.getByLabel("Straße und Hausnummer").fill("Teststraße 1");
    await page.getByLabel("Postleitzahl", { exact: true }).fill("00000");
    await page.getByLabel("Ort", { exact: true }).fill("Testort");
    if (method === "online") await page.getByRole("radio", { name: /Sicherer Online-Zahlungslink/ }).check();
    await page.getByRole("checkbox", { name: /Ich akzeptiere die Mietbedingungen/ }).check();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `.superpowers/rental-${method}-checkout.png`, fullPage: true });
    await page.getByRole("button", { name: "Zahlungspflichtig bestellen (Test)", exact: true }).click();
    await page.waitForURL(/\/mietbestellung\//);
    await expect(page.getByRole("heading", { name: "Bestellung eingegangen", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Rechnung als PDF" })).toHaveCount(0);
    const id = new URL(page.url()).pathname.split("/").pop()!;
    const admin = await context.newPage();
    await admin.setViewportSize({ width: method === "cash" ? 390 : 1440, height: 900 });
    await admin.goto("/markt/bestellungen");
    await admin.getByLabel("Marktpasswort").fill("TEST-ONLY-local-admin-secret-not-for-live");
    await admin.getByRole("button", { name: "Anmelden", exact: true }).click();
    const card = admin.locator(`article[aria-labelledby="order-${id}"]`);
    await card.getByRole("button", { name: "Termin bestätigen", exact: true }).click();
    await expect(card.getByRole("link", { name: "Rechnung als PDF" })).toBeVisible();
    await expect(card.getByRole("link", { name: "Lieferschein als PDF" })).toHaveCount(0);
    if (method === "cash") await card.getByRole("button", { name: "Barzahlung erhalten", exact: true }).click();
    else {
      await page.reload();
      await page.getByRole("button", { name: "Zahlung lokal simulieren (Test)", exact: true }).click();
      await expect(page.getByText("Zahlung: bezahlt", { exact: true })).toBeVisible();
      await admin.getByRole("button", { name: "Aktualisieren", exact: true }).click();
    }
    await card.getByRole("button", { name: "Ausgabe bestätigen", exact: true }).click();
    await expect(card.getByRole("link", { name: "Lieferschein als PDF" })).toBeVisible();
    const pdf = await admin.request.get((await card.getByRole("link", { name: "Lieferschein als PDF" }).getAttribute("href"))!);
    expect(pdf.status()).toBe(200); expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
    await card.getByRole("button", { name: "Rückgabe bestätigen", exact: true }).click();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Rückgabe erfasst", exact: true })).toBeVisible();
    const messages = await (await admin.request.get("/api/rental-admin/test-mails")).json();
    for (const to of [`test-${method}@example.invalid`, "market@example.invalid"]) {
      expect(messages.messages.some((mail: { to: string; attachments: unknown[] }) => mail.to === to && mail.attachments.length > 0)).toBe(true);
    }
    expect(await admin.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `.superpowers/rental-${method}-customer.png`, fullPage: true });
    await admin.screenshot({ path: `.superpowers/rental-${method}-market.png`, fullPage: true });
    await admin.close();
  });
});
