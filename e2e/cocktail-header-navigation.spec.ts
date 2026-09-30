import { expect, test, type Locator, type Page } from "@playwright/test";

// Exercise the public header, not the pre-existing recipe link in the footer.
// Use PLAYWRIGHT_BASE_URL for an existing server; this suite writes no screenshots.
test.use({ screenshot: "off", trace: "off" });

const expectedLinks = [
  ["Angebote", "/angebote"],
  ["Sortiment", "/produkte"],
  ["Cocktail-Rezepte", "/cocktails"],
  ["Party & Miete", "/vermietung"],
  ["Eigenmarken", "/eigenmarke"],
  ["Gewinnspiele", "/gewinnspiel"],
  ["Team", "/galerie"],
  ["TCG", "https://grailbid.com"],
  ["Kontakt", "/kontakt"],
] as const;

async function expectPublicLinks(navigation: Locator): Promise<void> {
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link")).toHaveCount(9);
  for (const [name, href] of expectedLinks) {
    const link = navigation.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  }
}

async function openRecipeFromHeader(page: Page, navigation: Locator): Promise<void> {
  await navigation.getByRole("link", { name: "Cocktail-Rezepte", exact: true }).click();
  await expect(page).toHaveURL(/\/cocktails$/);
  await expect(page.getByRole("heading", { level: 1, name: "Cocktail-Rezepte", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Mojito – Rezept ansehen", exact: true }).click();
  await expect(page).toHaveURL(/\/cocktails\/mojito$/);
  await expect(page.getByRole("heading", { level: 1, name: "Mojito", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Zutaten", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Zubereitung", exact: true })).toBeVisible();
}

for (const width of [1024, 1280]) {
  test(`desktop header exposes recipes without hiding or overflowing other links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    const header = page.locator("[data-cinematic-header]");
    const navigation = header.getByRole("navigation", { name: "Hauptnavigation", exact: true });
    await expectPublicLinks(navigation);

    const geometry = await header.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const logo = element.querySelector('a[aria-label="Trinkgut Jammers – Startseite"]')!.getBoundingClientRect();
      const nav = element.querySelector('nav[aria-label="Hauptnavigation"]')!;
      const navBounds = nav.getBoundingClientRect();
      const whatsapp = element.querySelector('a[href^="https://wa.me/"]')!;
      const whatsappBounds = whatsapp.checkVisibility() ? whatsapp.getBoundingClientRect() : null;
      const links = [...nav.querySelectorAll("a")].map(link => {
        const box = link.getBoundingClientRect();
        return { label: link.textContent, left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      });
      return {
        viewport: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        headerBottom: bounds.bottom,
        logoRight: logo.right,
        navLeft: navBounds.left,
        navRight: navBounds.right,
        whatsappLeft: whatsappBounds?.left ?? null,
        links,
      };
    });
    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.navLeft, "navigation must not overlap the brand logo").toBeGreaterThanOrEqual(geometry.logoRight + 8);
    if (geometry.whatsappLeft !== null) {
      expect(geometry.navRight, "navigation must not overlap the WhatsApp contact link").toBeLessThanOrEqual(geometry.whatsappLeft - 8);
    }
    for (const link of geometry.links) {
      expect(link.left, `${link.label}: left edge`).toBeGreaterThanOrEqual(-1);
      expect(link.right, `${link.label}: right edge`).toBeLessThanOrEqual(geometry.viewport + 1);
      expect(link.bottom, `${link.label}: header height`).toBeLessThanOrEqual(geometry.headerBottom + 1);
    }
    await openRecipeFromHeader(page, navigation);
    await header.getByRole("navigation", { name: "Hauptnavigation", exact: true })
      .getByRole("link", { name: "Cocktail-Rezepte", exact: true }).click();
    await expect(page).toHaveURL(/\/cocktails$/);
  });
}

test("mobile menu exposes recipes and opens a full recipe page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const header = page.locator("[data-cinematic-header]");
  const menu = header.getByRole("button", { name: "Menü öffnen", exact: true });
  await expect(menu).toBeVisible();
  await menu.click();
  const navigation = header.getByRole("navigation", { name: "Mobile Navigation", exact: true });
  await expectPublicLinks(navigation);
  const geometry = await navigation.evaluate(element => ({
    width: element.clientWidth,
    scrollWidth: element.scrollWidth,
    right: element.getBoundingClientRect().right,
    viewport: document.documentElement.clientWidth,
  }));
  expect(geometry.scrollWidth, "mobile menu must not need horizontal scrolling").toBeLessThanOrEqual(geometry.width);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewport);
  await openRecipeFromHeader(page, navigation);
  await expect(header.locator("[data-mobile-navigation]")).not.toHaveAttribute("open");
  await menu.click();
  await navigation.getByRole("link", { name: "Cocktail-Rezepte", exact: true }).click();
  await expect(page).toHaveURL(/\/cocktails$/);
});
