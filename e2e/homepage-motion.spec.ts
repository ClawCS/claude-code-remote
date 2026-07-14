import { expect, test } from "@playwright/test";

test("enhances only the desktop Spotlight rail and owns one controller", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const root = page.locator("[data-cinematic-root]");
  await expect(root).toHaveAttribute("data-motion-state", "enhanced");
  await expect(root).toHaveAttribute("data-motion-controller-count", "1");
  await expect(root).toHaveAttribute(
    "data-motion-trigger-count",
    /[1-9]\d*/,
  );
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  const rail = root.locator('[data-rail="cinematic"]');
  const before = await rail.evaluate((node) => getComputedStyle(node).transform);
  const sectionTop = await root
    .locator('[data-signature="cinematic"]')
    .evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((top) => window.scrollTo(0, top + 900), sectionTop);
  await expect
    .poll(() => rail.evaluate((node) => getComputedStyle(node).transform))
    .not.toBe(before);
});

test("keeps mobile in normal document flow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator('[data-rail="cinematic"]')).toHaveCSS(
    "display",
    "grid",
  );
  await expect(
    page.locator('[data-signature="cinematic"]'),
  ).not.toHaveCSS("position", "fixed");
  await expect(page.locator("[data-cinematic-root]")).toHaveAttribute(
    "data-motion-trigger-count",
    "0",
  );
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
});

test("owns no motion resources under reduced motion", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const root = page.locator("[data-cinematic-root]");
  await expect(root).toHaveAttribute("data-motion-state", "reduced");
  await expect(root).toHaveAttribute("data-motion-controller-count", "0");
  await expect(root).toHaveAttribute("data-motion-trigger-count", "0");
  await expect(root.locator('[data-rail="cinematic"]')).toHaveCSS(
    "transform",
    "none",
  );
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await context.close();
});

test("keeps all posters and links without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  const rail = page.locator('[data-rail="cinematic"]');
  await expect(rail).toHaveCSS("display", "grid");
  await expect(rail.locator("figure")).toHaveCount(3);
  await expect(page.getByRole("link", { name: /Pralle Kirsche/ })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Schwarzer Teufel/ }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Caramello/ })).toBeVisible();
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await context.close();
});

test("cleans page-local motion when navigating away", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("cookie-consent", "declined");
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  for (let cycle = 0; cycle < 2; cycle += 1) {
    await expect(page.locator("[data-cinematic-root]")).toHaveAttribute(
      "data-motion-controller-count",
      "1",
    );
    await expect(page.locator(".pin-spacer")).toHaveCount(1);

    await page.locator('footer a[href="/kontakt"]').click();
    await expect(page).toHaveURL(/\/kontakt$/);
    await expect(page.locator("[data-cinematic-root]")).toHaveCount(0);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);

    await page.getByRole("link", { name: "Home" }).first().click();
    await expect(page).toHaveURL(/\/$/);
  }

  await expect(page.locator("[data-cinematic-root]")).toHaveAttribute(
    "data-motion-controller-count",
    "1",
  );
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
});

test("rebuilds cleanly across live motion and viewport changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const root = page.locator("[data-cinematic-root]");
  const rail = root.locator('[data-rail="cinematic"]');
  await expect(root).toHaveAttribute("data-motion-state", "enhanced");
  await expect(page.locator(".pin-spacer")).toHaveCount(1);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(root).toHaveAttribute("data-motion-state", "reduced");
  await expect(root).toHaveAttribute("data-motion-controller-count", "0");
  await expect(root).toHaveAttribute("data-motion-trigger-count", "0");
  await expect(rail).toHaveCSS("transform", "none");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(root).toHaveAttribute("data-motion-state", "enhanced");
  await expect(root).toHaveAttribute("data-motion-controller-count", "1");
  await expect(root).toHaveAttribute("data-motion-trigger-count", /[1-9]\d*/);
  await expect(page.locator(".pin-spacer")).toHaveCount(1);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(rail).toHaveCSS("display", "grid");
  await expect(root).toHaveAttribute("data-motion-trigger-count", "0");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(rail).toHaveCSS("display", "flex");
  await expect(root).toHaveAttribute("data-motion-trigger-count", /[1-9]\d*/);
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
});
