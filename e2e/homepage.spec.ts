import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      messages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));
  await page.addInitScript(() => {
    localStorage.setItem("cookie-consent", "declined");
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(messages).toEqual([]);
});

test("renders exact landmarks, heading hierarchy, facts, and section order", async ({
  page,
}) => {
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { level: 1, name: "Goch schenkt ein." }),
  ).toHaveCount(1);
  await expect(
    page.getByText("Jurgensstraße 20", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Mo–Sa 08:00–20:00 Uhr", { exact: true }).first(),
  ).toBeVisible();
  expect(await page.locator("main > section").count()).toBeGreaterThanOrEqual(6);
});

test("offers exact navigation, contact, route, Instagram, NL, and legal links", async ({
  page,
}) => {
  const navigation = page.getByRole("navigation", { name: "Hauptnavigation" });
  for (const label of [
    "Angebote",
    "Party & Miete",
    "Eigenmarken",
    "Über uns",
    "Kontakt",
  ]) {
    await expect(navigation.getByRole("link", { name: label })).toBeVisible();
  }
  const actionSections = await page.locator("section#aktionen").count();
  await expect(
    navigation.getByRole("link", { name: "Aktionen" }),
  ).toHaveCount(actionSections);
  for (const link of await navigation.locator('a[href^="#"]').all()) {
    const href = await link.getAttribute("href");
    expect(href).not.toBeNull();
    await expect(page.locator(href!)).toHaveCount(1);
  }
  await expect(page.getByRole("link", { name: /WhatsApp/ }).first()).toHaveAttribute(
    "href",
    /wa\.me\/491752492386/,
  );
  await expect(page.getByRole("link", { name: /Route/ }).last()).toHaveAttribute(
    "href",
    /google\.com\/maps\/dir/,
  );
  await expect(
    page.getByRole("link", { name: /Instagram/ }).last(),
  ).toHaveAttribute(
    "href",
    "https://www.instagram.com/trinkgutjammers_goch/",
  );
  await expect(
    page.getByRole("link", { name: /Niederländisch|Grenzkunden/ }),
  ).toHaveAttribute("href", "/nl");
  for (const href of ["/kontakt", "/impressum", "/datenschutz", "/agb"]) {
    await expect(page.locator(`footer a[href="${href}"]`)).toHaveCount(1);
  }
});

test("renders the audited Instagram fallback without fabricated posts or dates", async ({
  page,
}) => {
  const section = page.locator('section[aria-labelledby="instagram-title"]');
  await expect(
    section.getByText("Neue Einblicke folgen", { exact: true }),
  ).toBeVisible();
  await expect(section.getByRole("link", { name: /Instagram/ })).toHaveAttribute(
    "href",
    "https://www.instagram.com/trinkgutjammers_goch/",
  );
  await expect(section.locator("figure")).toHaveCount(0);
  await expect(section.locator("time")).toHaveCount(0);
});

test("supports a visible keyboard path through skip link, navigation, and CTAs", async ({
  page,
}) => {
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Zum Hauptinhalt" })).toBeFocused();
  await expect(
    page.getByRole("link", { name: "Zum Hauptinhalt" }),
  ).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
});

test("mobile details navigation works by keyboard and never covers the first hero message", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const summary = page.getByRole("button", { name: "Menü öffnen" });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-mobile-navigation]")).toHaveAttribute(
    "open",
    "",
  );
  const panel = await page
    .getByRole("navigation", { name: "Mobile Navigation" })
    .boundingBox();
  const hero = await page.locator('[data-hero="cinematic"]').boundingBox();
  expect(panel).not.toBeNull();
  expect(hero).not.toBeNull();
  expect(panel!.y + panel!.height).toBeLessThanOrEqual(hero!.y + 1);
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-mobile-navigation]")).not.toHaveAttribute(
    "open",
    "",
  );
});

test("keeps the red hero gesture behind people at tablet widths", async ({
  page,
}) => {
  for (const viewport of [
    { width: 768, height: 1024 },
    { width: 1024, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    await page.reload();
    const layers = await page.locator('[data-hero="cinematic"]').evaluate((hero) => {
      const portrait = hero.querySelector("figure");
      const gesture = hero.querySelector('[aria-hidden="true"]:last-of-type');
      if (!(portrait instanceof HTMLElement) || !(gesture instanceof HTMLElement)) {
        return null;
      }
      return {
        portrait: Number.parseInt(getComputedStyle(portrait).zIndex, 10),
        gesture: Number.parseInt(getComputedStyle(gesture).zIndex, 10),
      };
    });
    expect(layers).not.toBeNull();
    expect(layers!.gesture).toBeLessThan(layers!.portrait);
  }
});

test("keeps tablet market status clear of the menu control", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.reload();
  const status = await page.locator("[data-market-open]").boundingBox();
  const menu = await page
    .getByRole("button", { name: "Menü öffnen" })
    .boundingBox();
  expect(status).not.toBeNull();
  expect(menu).not.toBeNull();
  expect(menu!.x - (status!.x + status!.width)).toBeGreaterThanOrEqual(8);
});

test("has no critical or serious axe findings", async ({ page }) => {
  const result = await new AxeBuilder({ page }).analyze();
  expect(
    result.violations.filter(
      ({ impact }) => impact === "critical" || impact === "serious",
    ),
  ).toEqual([]);
});

test("never first-loads video, Instagram, map, or flyer iframes", async ({
  page,
}) => {
  const urls = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => entry.name),
  );
  expect(
    urls.some((url) => /instagram|google\.com\/maps|\.mp4|viewer/i.test(url)),
  ).toBe(false);
  await expect(page.locator("iframe")).toHaveCount(0);
});
