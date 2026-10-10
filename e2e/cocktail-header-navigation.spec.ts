import { expect, test, type Locator, type Page } from "@playwright/test";

// Exercise the public header, not the pre-existing recipe link in the footer.
// Use PLAYWRIGHT_BASE_URL for an existing server; this suite writes no screenshots.
test.use({ screenshot: "off", trace: "off" });

const expectedLinks = [
  ["Angebote", "/angebote"],
  ["Sortiment", "/produkte"],
  ["Party & Miete", "/vermietung"],
  ["Eigenmarken", "/eigenmarke"],
  ["Gewinnspiele", "/gewinnspiel"],
  ["TCG", "https://grailbid.com"],
  ["Kontakt", "/kontakt"],
] as const;

async function expectPublicLinks(navigation: Locator): Promise<void> {
  await expect(navigation).toBeVisible();
  for (const [name, href] of expectedLinks) {
    const link = navigation.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  }
  const teamDisclosure = navigation.locator('details:has(> summary:has-text("Team & Karriere"))');
  if (await teamDisclosure.count()) await teamDisclosure.locator("summary").click();
  for (const [name, href] of [
    ["Unser Team", "/galerie"],
    ["Offene Stellen & Bewerbung", "/bewerbung"],
  ]) {
    const link = navigation.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  }
  if (await teamDisclosure.count()) await teamDisclosure.locator("summary").click();
}

async function openKnowledgeDisclosure(navigation: Locator): Promise<void> {
  const disclosure = navigation.locator('details:has(> summary:has-text("Rezepte & Wissen"))');
  if (await disclosure.count()) {
    await navigation.locator("summary").filter({ hasText: "Rezepte & Wissen" }).click();
    await expect(disclosure).toHaveAttribute("open");
  }
  await expect(navigation.getByRole("link", { name: "Cocktail-Rezepte", exact: true })).toHaveAttribute("href", "/cocktails");
  await expect(navigation.getByRole("link", { name: "Getränkeakademie", exact: true })).toHaveAttribute("href", "/akademie");
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

for (const width of [1152, 1280]) {
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
      const links = [...nav.querySelectorAll("ul > li > a, ul > li > details > summary")].filter(link => link.checkVisibility()).map(link => {
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
    await openKnowledgeDisclosure(navigation);
    await openRecipeFromHeader(page, navigation);
    await openKnowledgeDisclosure(header.getByRole("navigation", { name: "Hauptnavigation", exact: true }));
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
  await openKnowledgeDisclosure(navigation);
  await openRecipeFromHeader(page, navigation);
  await expect(header.locator("[data-mobile-navigation]")).not.toHaveAttribute("open");
  await menu.click();
  await navigation.getByRole("link", { name: "Cocktail-Rezepte", exact: true }).click();
  await expect(page).toHaveURL(/\/cocktails$/);
});

test("desktop knowledge disclosure supports keyboard, Escape and outside dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  // Native details can open before React installs the Escape/outside handlers.
  // This current-week suite has an active flyer: its enabled control is the
  // app's existing hydration signal, so wait for real readiness, not a delay.
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main button[aria-busy]").first()).toBeEnabled();
  const navigation = page.locator("[data-cinematic-header]").getByRole("navigation", { name: "Hauptnavigation", exact: true });
  const summary = navigation.locator("summary").filter({ hasText: "Rezepte & Wissen" });
  const disclosure = navigation.locator('details:has(> summary:has-text("Rezepte & Wissen"))');
  await expect(navigation.locator("[class*='desktopNavList'] > li")).toHaveCount(9);
  await summary.focus();
  await summary.press("Enter");
  await expect(disclosure).toHaveAttribute("open");
  await page.keyboard.press("Tab");
  await expect(navigation.getByRole("link", { name: "Cocktail-Rezepte", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(navigation.getByRole("link", { name: "Getränkeakademie", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(disclosure).not.toHaveAttribute("open");
  await expect(summary).toBeFocused();
  await summary.press("Space");
  await page.getByRole("heading", { level: 1 }).click();
  await expect(disclosure).not.toHaveAttribute("open");
});

for (const width of [390, 1280]) {
  test(`header reaches the academy hub and a preserved course at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const header = page.locator("[data-cinematic-header]");
    if (width < 1152) await header.getByRole("button", { name: "Menü öffnen", exact: true }).click();
    const navigation = header.getByRole("navigation", { name: width < 1152 ? "Mobile Navigation" : "Hauptnavigation", exact: true });
    await openKnowledgeDisclosure(navigation);
    await navigation.getByRole("link", { name: "Getränkeakademie", exact: true }).click();
    await expect(page).toHaveURL(/\/akademie$/);
    await expect(page.getByRole("heading", { level: 1, name: "Getränkeakademie", exact: true })).toBeVisible();
    await page.locator('a[href="/akademie/bier"]').click();
    await expect(page).toHaveURL(/\/akademie\/bier$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Quiz — Frage 1/ })).toBeVisible();
  });
}
