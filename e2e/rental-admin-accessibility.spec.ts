import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { syntheticRentalOrder } from "../lib/rental-orders/documents.test-fixtures";

// Exercise the real admin component with only its GET boundary isolated. The
// fixture does not create orders, authenticate to a real market, or send mail.
for (const width of [320, 1440]) {
  for (const state of ["login", "empty", "completed"] as const) {
    test(`rental admin ${state} stays accessible and unclipped at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route("**/api/rental-admin/orders", async route => {
        expect(route.request().method()).toBe("GET");
        if (state === "login") {
          await route.fulfill({ status: 401, json: { error: "Test-Anmeldung erforderlich" } });
          return;
        }
        await route.fulfill({ json: { testMode: true, jobs: [], orders: state === "empty" ? [] : [
          syntheticRentalOrder({ status: "returned", payment: { status: "paid", attempt: 0 } }),
        ] } });
      });
      await page.goto("/markt/bestellungen");
      await page.waitForLoadState("networkidle");
      if (state === "login") await expect(page.getByLabel("Marktpasswort")).toBeVisible();
      if (state === "empty") await expect(page.getByText("Noch keine Leihbestellungen eingegangen.", { exact: true })).toBeVisible();
      if (state === "completed") await expect(page.getByText("Zurückgegeben", { exact: true })).toBeVisible();

      const accessibility = await new AxeBuilder({ page }).analyze();
      expect.soft(accessibility.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
      const clipping = await page.locator("main .category-intro h1, main .category-intro p").evaluateAll(elements => elements.filter(element => {
        const box = element.getBoundingClientRect();
        return box.left < -1 || box.right > document.documentElement.clientWidth + 1 || element.scrollWidth > element.clientWidth + 1;
      }).map(element => element.textContent));
      expect(clipping, "admin intro must remain fully readable inside the viewport").toEqual([]);
    });
  }
}
