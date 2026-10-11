import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

const screenshotDirectory = "audit/screenshots/atmosphere-refinement-2026-10-11";

for (const width of [390, 768, 1440]) {
  test(`atmosphere entries, service photo and category links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const film = page.locator('[data-hero="cinematic"] video');
    const control = page.getByRole("button", { name:"Film abspielen", exact:true });
    await expect(film).not.toHaveAttribute("src");
    const filmBox = (await film.boundingBox())!;
    const controlBox = (await control.boundingBox())!;
    expect(controlBox.width).toBeGreaterThanOrEqual(44);
    expect(controlBox.height).toBeGreaterThanOrEqual(44);
    expect(controlBox.x).toBeGreaterThanOrEqual(filmBox.x + filmBox.width / 2);
    expect(controlBox.y).toBeGreaterThanOrEqual(filmBox.y + filmBox.height / 2);
    expect(controlBox.x + controlBox.width).toBeLessThanOrEqual(filmBox.x + filmBox.width);
    expect(controlBox.y + controlBox.height).toBeLessThanOrEqual(filmBox.y + filmBox.height);
    const heroBox = (await page.locator('[data-hero="cinematic"]').boundingBox())!;
    expect(heroBox.y + heroBox.height).toBeCloseTo(filmBox.y + filmBox.height, 1);
    expect(await page.locator("body").innerText()).not.toContain("Werbefilm · beispielhafte Partyszene");
    const quick = page.getByRole("navigation", { name: "Direkt zu Angeboten, Partyplanung und Besuch" });
    await expect(quick.locator('[data-quick-entry]')).toHaveCount(3);
    await quick.scrollIntoViewIfNeeded();
    await expect(quick.locator('[data-quick-entry="offers"]')).toHaveAttribute("href", "#aktuell");
    await expect(quick.locator('[data-quick-entry="party"]')).toHaveAttribute("href", "/partyplaner");
    const visit = quick.locator('[data-quick-entry="visit"]');
    await expect(visit.getByRole("link", { name: /Bei uns/ })).toHaveAttribute("href", "/kontakt");
    await expect(visit.locator('[data-brand-link="maps"]')).toHaveAttribute("href", /Jurgensstra/);
    const service = page.locator("#service");
    await service.scrollIntoViewIfNeeded();
    const image = service.locator("img");
    await expect(image).toHaveJSProperty("complete", true);
    const dimensions = await image.evaluate((img: HTMLImageElement) => ({ natural:img.naturalWidth/img.naturalHeight, display:img.clientWidth/img.clientHeight }));
    expect(dimensions.display).toBeCloseTo(dimensions.natural, 1);
    await expect(service.getByRole("link", { name: /Leihsortiment ansehen/ })).toHaveAttribute("href", "/vermietung");
    await expect(page.getByRole("navigation", { name: "Getränke entdecken" }).getByRole("link")).toHaveCount(4);
    expect(await page.locator("body").innerText()).not.toContain("↗");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const audit = await new AxeBuilder({ page }).include('[aria-label="Direkt zu Angeboten, Partyplanung und Besuch"]').include("#service").analyze();
    expect(audit.violations).toEqual([]);
    await mkdir(screenshotDirectory, { recursive:true });
    await quick.screenshot({ path:`${screenshotDirectory}/quicklinks-${width}.png` });
    await service.screenshot({ path:`${screenshotDirectory}/service-${width}.png` });
    await page.getByRole("navigation", { name:"Getränke entdecken" }).screenshot({ path:`${screenshotDirectory}/categories-${width}.png` });
  });
}

for (const route of ["/angebote", "/produkte", "/kategorie/bier", "/partyplaner", "/vermietung", "/akademie", "/bewerbung", "/kontakt"]) {
  test(`shared atmospheric intro keeps readable content ${route}`, async ({ page }) => {
    await page.setViewportSize({ width:390, height:844 });
    await page.goto(route);
    const intro = page.locator("[data-editorial-intro]");
    await expect(intro).toBeVisible();
    expect(await intro.evaluate(el => getComputedStyle(el).backgroundImage)).not.toBe("none");
    await expect(page.getByRole("heading", { level:1 })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
