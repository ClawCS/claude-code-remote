import { expect, test } from "./test-fixtures";
import type { Page } from "@playwright/test";

const VIEWER_URL =
  "https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest";
const PDF_URL =
  "https://werbung.trinkgut.de/frontend/catalogs/1335913/2/pdf/complete.pdf";
const INSTAGRAM_ORIGIN = "https://www.instagram.com/";
const ROUTE_URL =
  "https://www.google.com/maps/dir/?api=1&destination=Jurgenstr.+20%2C+47574+Goch";
const TRIGGER_NAME = "Handzettel ansehen";
const DIALOG_NAME = "Angebote der Woche ansehen";
const CLOSE_NAME = "Handzettel schließen";
const IFRAME_TITLE = "Angebote der Woche – externer Handzettel";
const ERROR_COPY = "Der Handzettel konnte hier nicht geladen werden.";

function collectRuntimeIssues(page: Page): string[] {
  const issues: string[] = [];

  page.on("console", (message) => {
    const text = message.text();
    if (
      message.type() === "error" ||
      (message.type() === "warning" &&
        /hydrat(?:e|ed|ion)|did not match/i.test(text))
    ) {
      issues.push(`console.${message.type()}: ${text}`);
    }
  });
  page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));

  return issues;
}

async function expectSafeExternalAnchor(
  page: Page,
  href: string,
  scope = page.locator("body"),
): Promise<void> {
  const anchor = scope.locator(`a[href="${href}"]`).first();
  await expect(anchor).toBeVisible();
  await expect(anchor).toHaveAttribute("target", "_blank");
  await expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("cookie-consent", "declined");
    } catch {
      // The interaction surface does not depend on storage availability.
    }
  });
});

test("[product-contract] first load is passive and exposes the validated flyer fallbacks", async ({
  page,
}) => {
  const requestedUrls: string[] = [];
  const runtimeIssues = collectRuntimeIssues(page);
  page.on("request", (request) => requestedUrls.push(request.url()));

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("[data-cinematic-root]")).toBeVisible();
  await expect(page.getByRole("button", { name: TRIGGER_NAME })).toBeEnabled();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );

  await expect(page.getByText("Angebote der Woche", { exact: true })).toBeVisible();
  await expect(page.getByText("Gültig 13.–18.07.2026", { exact: true })).toBeVisible();
  await expect(page.getByText("10 Seiten", { exact: true })).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expectSafeExternalAnchor(page, VIEWER_URL);
  await expectSafeExternalAnchor(page, PDF_URL);

  const forbiddenPassiveRequests = requestedUrls.filter(
    (url) =>
      url === VIEWER_URL ||
      url === PDF_URL ||
      url.startsWith(INSTAGRAM_ORIGIN) ||
      url === ROUTE_URL,
  );
  expect(forbiddenPassiveRequests).toEqual([]);
  expect(runtimeIssues).toEqual([]);
});

test("[product-contract] flyer dialog is named, focus-trapped, lazy, and restores focus on Escape", async ({
  page,
}) => {
  const runtimeIssues = collectRuntimeIssues(page);
  await page.clock.install({ time: new Date("2026-07-14T12:00:00.000Z") });
  await page.route(VIEWER_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><html><head><title>Fixture flyer</title></head><body>Fixture flyer</body></html>",
    });
  });

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  const trigger = page.getByRole("button", { name: TRIGGER_NAME });
  await expect(trigger).toBeEnabled();
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1_000);
  await expect(page.locator("iframe")).toHaveCount(0);
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: DIALOG_NAME });
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole("button", { name: CLOSE_NAME });
  await expect(close).toBeFocused();
  const iframe = dialog.locator(`iframe[title="${IFRAME_TITLE}"]`);
  await expect(iframe).toHaveCount(1);
  await expect(iframe).toHaveAttribute("src", VIEWER_URL);
  await expect(dialog).toHaveAttribute("data-flyer-dialog-state", "ready");
  await page.clock.runFor(8_001);
  await expect(dialog).toHaveAttribute("data-flyer-dialog-state", "ready");
  await expect(
    dialog.locator('[role="status"][data-flyer-state="error"]'),
  ).toHaveCount(0);

  const focusable = dialog.locator(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  expect(await focusable.count()).toBeGreaterThan(1);
  await page.keyboard.press("Shift+Tab");
  await expect(focusable.last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(runtimeIssues).toEqual([]);
});

test("[product-contract] flyer timeout is deterministic and resets on every reopen", async ({
  page,
}) => {
  const runtimeIssues = collectRuntimeIssues(page);
  await page.clock.install({ time: new Date("2026-07-14T12:00:00.000Z") });
  await page.route(VIEWER_URL, async () => {
    // Keep every iframe navigation genuinely pending. Returning from a route
    // handler without resolving it lets Chromium abort a later reopen.
    await new Promise<void>(() => undefined);
  });

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  const trigger = page.getByRole("button", { name: TRIGGER_NAME });
  await expect(trigger).toBeEnabled();
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1_000);
  await trigger.click();
  let dialog = page.getByRole("dialog", { name: DIALOG_NAME });
  await expect(dialog.locator(`iframe[title="${IFRAME_TITLE}"]`)).toHaveCount(1);
  await expect(dialog.locator('[role="status"][data-flyer-state="error"]')).toHaveCount(0);

  await page.clock.runFor(8_001);
  let error = dialog.locator('[role="status"][data-flyer-state="error"]');
  await expect(error).toContainText(ERROR_COPY);
  await expectSafeExternalAnchor(page, VIEWER_URL, error);
  await expectSafeExternalAnchor(page, PDF_URL, error);

  await dialog.getByRole("button", { name: CLOSE_NAME }).click();
  await expect(dialog).toHaveCount(0);
  await trigger.click();
  dialog = page.getByRole("dialog", { name: DIALOG_NAME });
  error = dialog.locator('[role="status"][data-flyer-state="error"]');
  await expect(dialog.locator(`iframe[title="${IFRAME_TITLE}"]`)).toHaveCount(1);
  await expect(error).toHaveCount(0);

  await page.clock.runFor(7_999);
  await expect(error).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(error).toContainText(ERROR_COPY);
  expect(runtimeIssues).toEqual([]);
});

test("[product-contract] mobile details closes on Escape, outside pointer, and link activation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const runtimeIssues = collectRuntimeIssues(page);
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);

  const details = page.locator("details[data-mobile-navigation]");
  // Native details can open before React's Escape/outside handlers hydrate.
  await page.waitForLoadState("networkidle");
  const summary = details.locator(':scope > summary[aria-label="Menü öffnen"]');
  await expect(details).toHaveCount(1);
  await summary.click();
  await expect(details).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(details).not.toHaveAttribute("open", "");

  await summary.click();
  await expect(details).toHaveAttribute("open", "");
  await page.locator('[data-hero="cinematic"] h1').click({ force: true });
  await expect(details).not.toHaveAttribute("open", "");

  await summary.click();
  await expect(details).toHaveAttribute("open", "");
  await details.getByRole("link", { name: "Party & Miete" }).click();
  await expect(page).toHaveURL(/\/vermietung$/);
  await expect(page.getByRole("heading", { level: 1, name: "Deine Feier. Unser Leihsortiment." })).toBeVisible();
  await expect(page.locator("[data-cinematic-header]")).toHaveCount(1);
  await expect(page.locator(".glass-header, [data-legacy-footer]")).toHaveCount(0);
  // This locator now resolves the menu on the destination, not the old document.
  await expect(details).not.toHaveAttribute("open", "");
  await expect(details.getByRole("navigation")).not.toBeVisible();
  expect(runtimeIssues).toEqual([]);
});

test("[product-contract] native mobile navigation remains usable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });

  try {
    const page = await context.newPage();
    const response = await page.goto(new URL("/", baseURL).href, {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);

    const details = page.locator("details[data-mobile-navigation]");
    const summary = details.locator(':scope > summary[aria-label="Menü öffnen"]');
    await expect(details).toHaveCount(1);
    await expect(summary).toBeVisible();
    await expect(details).not.toHaveAttribute("open", "");
    await summary.click();
    await expect(details).toHaveAttribute("open", "");

    for (const [label, href] of [
      ["Angebote", "/angebote"],
      ["Sortiment", "/produkte"],
      ["Party & Miete", "/vermietung"],
      ["Eigenmarken", "/eigenmarke"],
      ["Gewinnspiele", "/gewinnspiel"],
      ["Team", "/galerie"],
      ["Kontakt", "/kontakt"],
    ]) {
      const link = details.getByRole("link", { name: label, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }
    await details.getByRole("link", { name: "Party & Miete" }).click();
    await expect(page).toHaveURL(/\/vermietung$/);
    await expect(page.getByRole("heading", { level: 1, name: "Deine Feier. Unser Leihsortiment." })).toBeVisible();
    await expect(page.locator("details[data-mobile-navigation]")).not.toHaveAttribute("open", "");
    await expect(page.locator("[data-cinematic-header]")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(page.locator(".glass-header, [data-legacy-footer]")).toHaveCount(0);
    await expect(page.locator("iframe")).toHaveCount(0);
  } finally {
    await context.close();
  }
});
