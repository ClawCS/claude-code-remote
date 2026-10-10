import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const width of [360, 390, 768, 1024, 1151, 1152, 1280, 1440]) {
  test(`team and open jobs are reachable from one header group at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const header = page.locator("[data-cinematic-header]");
    const mobile = width < 1152;
    if (mobile) await header.getByRole("button", { name: "Menü öffnen", exact: true }).click();
    const nav = header.getByRole("navigation", { name: mobile ? "Mobile Navigation" : "Hauptnavigation", exact: true });
    await expect(nav.locator(":scope > ul > li")).toHaveCount(5);
    const discover = nav.locator("summary").filter({ hasText: "Jammers entdecken" });
    await discover.click();
    const group = nav.getByRole("region", { name: "Team & Karriere", exact: true });
    await expect(group).toBeVisible();
    const team = group.getByRole("link", { name: "Unser Team", exact: true });
    const jobs = group.getByRole("link", { name: "Offene Stellen & Bewerbung", exact: true });
    await expect(team).toBeVisible();
    await expect(team).toHaveAttribute("href", "/galerie");
    await expect(jobs).toBeVisible();
    await expect(jobs).toHaveAttribute("href", "/bewerbung");
    const bounds = await header.evaluate(element => {
      const logo = element.querySelector('a[aria-label="Trinkgut Jammers – Startseite"]')!.getBoundingClientRect();
      const desktop = element.querySelector('nav[aria-label="Hauptnavigation"]')!;
      const nav = desktop.checkVisibility() ? desktop.getBoundingClientRect() : null;
      return { viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth, logoRight: logo.right, navLeft: nav?.left, navRight: nav?.right };
    });
    expect(bounds.document).toBeLessThanOrEqual(bounds.viewport);
    if (!mobile) {
      expect(bounds.navLeft).toBeGreaterThanOrEqual(bounds.logoRight + 8);
      expect(bounds.navRight).toBeLessThanOrEqual(bounds.viewport);
    }
    const jobBounds = await jobs.boundingBox();
    expect(jobBounds!.x).toBeGreaterThanOrEqual(0);
    expect(jobBounds!.x + jobBounds!.width).toBeLessThanOrEqual(width);
    await jobs.click();
    await expect(page).toHaveURL(/\/bewerbung$/);
    await page.waitForLoadState("load");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Lust auf Getränke und Menschen?");
    await expect(page.locator('main a[aria-label$="vollständige Anzeige öffnen"]')).toHaveCount(3);
    await expect(page.locator('main a[href^="mailto:info@trinkgut-jammers.de"]').first()).toBeVisible();
    await expect(page.locator('main input[type="file"]')).toHaveCount(0);
    if (mobile) {
      await expect(header.locator("[data-mobile-navigation]")).not.toHaveAttribute("open");
      await header.getByRole("button", { name: "Menü öffnen", exact: true }).click();
    }
    await expect(nav.locator("details[open]")).toHaveCount(0);
    await discover.click();
    await team.click();
    await expect(page).toHaveURL(/\/galerie$/);
    await expect(page.getByRole("heading", { name: "Team Jammers", exact: true })).toBeVisible();
    const applicationConfig = await request.get("/api/bewerbung/config");
    expect(applicationConfig.ok()).toBe(true);
    expect(await applicationConfig.json()).toMatchObject({ enabled: false, mode: "disabled" });
  });
}

test("discover menu groups career and knowledge without colliding with party navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const header = page.locator("[data-cinematic-header]");
  const nav = header.getByRole("navigation", { name: "Hauptnavigation", exact: true });
  await page.waitForLoadState("networkidle");
  const career = nav.locator("details").filter({ has: page.locator("summary").filter({ hasText: "Jammers entdecken" }) });
  const summary = career.locator("summary");
  await summary.focus();
  await summary.press("Enter");
  await expect(career).toHaveAttribute("open");
  await career.getByRole("link", { name: "Unser Team", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(career.getByRole("link", { name: "Offene Stellen & Bewerbung", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(career).not.toHaveAttribute("open");
  await expect(summary).toBeFocused();
  await summary.press("Space");
  await nav.locator('summary[aria-label="Party & Miete – Untermenü öffnen"]').click();
  await expect(career).not.toHaveAttribute("open");
  await summary.click();
  expect((await new AxeBuilder({ page }).include("[data-cinematic-header]").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
