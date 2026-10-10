import { expect, test } from "@playwright/test";

type LayoutShiftEntry = PerformanceEntry & { value: number; hadRecentInput: boolean };
type LayoutEvidence = { sum: number; count: number; startedAt: number };
type MeasuredWindow = Window & { __catalogueLayout: LayoutEvidence };

// Run against a freshly built production server for release acceptance. The
// real refresh and frozen, same-origin response are separate observations.
for (const width of [320, 390, 1440]) {
  for (const refresh of ["real", "stable"] as const) {
    test(`catalogue layout stays stable at ${width}px (${refresh} refresh)`, async ({ page, request }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      let interceptedRefreshes = 0;
      const pageErrors: string[] = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      if (refresh === "stable") {
        const response = await request.get("/api/content/offers");
        expect(response.status()).toBe(200);
        const body = await response.text();
        await page.route("**/api/content/offers", route => {
          interceptedRefreshes += 1;
          return route.fulfill({ status: 200, contentType: "application/json", body });
        });
      }
      await page.addInitScript(() => {
        const evidence: LayoutEvidence = { sum: 0, count: 0, startedAt: performance.now() };
        Object.defineProperty(window, "__catalogueLayout", { value: evidence });
        new PerformanceObserver(list => {
          for (const entry of list.getEntries() as LayoutShiftEntry[]) {
            if (!entry.hadRecentInput) {
              evidence.sum += entry.value;
              evidence.count += 1;
            }
          }
        }).observe({ type: "layout-shift", buffered: true });
      });

      const refreshed = page.waitForResponse(response =>
        new URL(response.url()).pathname === "/api/content/offers"
        && response.request().method() === "GET", { timeout: 15000 });
      const response = await page.goto("/produkte", { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: "Sortiment & Wochenangebote" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Warengruppen" })).toBeVisible();
      expect((await refreshed).status()).toBe(200);
      if (refresh === "stable") expect(interceptedRefreshes).toBeGreaterThan(0);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState("networkidle");
      // No user input or scrolling masks a hydration/refresh shift.
      await page.waitForTimeout(3000);
      const evidence = await page.evaluate(() => {
        const value = (window as unknown as MeasuredWindow).__catalogueLayout;
        return { ...value, observedMs: performance.now() - value.startedAt,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth };
      });
      await testInfo.attach("catalogue-layout-evidence", {
        body: JSON.stringify({ width, refresh, interceptedRefreshes, url: page.url(), ...evidence }, null, 2),
        contentType: "application/json",
      });
      expect(evidence.observedMs).toBeGreaterThanOrEqual(3000);
      expect(pageErrors).toEqual([]);
      expect(evidence.horizontalOverflow).toBe(false);
      expect(evidence.sum, "sum of observed layout shifts without recent input").toBeLessThan(0.1);
    });
  }
}
