import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { assortmentProducts } from "../lib/catalog";
import type { RentalOrder } from "../lib/rental-orders/types";

const evidence = path.resolve(process.env.AUDIT_SCREENSHOT_DIR ?? "audit/screenshots/sitewide-service-pages-2026-10-10");
const issues = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, baseURL }) => {
  expect(new URL(baseURL!).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
  const errors: string[] = []; issues.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() !== "error" && !/hydrat(?:e|ed|ion)|did not match|SyntaxError/i.test(message.text())) return;
    // Deliberately invalid pages and fail-closed/config-error GETs emit a browser
    // resource diagnostic. Their visible safe states are asserted below.
    const pathname = new URL(message.location().url || baseURL!, baseURL).pathname;
    const expectedRejections: Record<string, number> = {
      "/task5-does-not-exist": 404,
      "/api/rentals/orders/task5-invalid": 503,
      "/api/rentals/config": 503,
      "/api/bewerbungsverwaltung/session": 404,
      "/api/rental-admin/orders": 503,
    };
    const resourceStatus = message.text().match(/^Failed to load resource:.*status of (\d+)/)?.[1];
    if (resourceStatus && expectedRejections[pathname] === Number(resourceStatus)) return;
    errors.push(message.text());
  });
  // All service tests are read-only. A later, narrower synthetic interception
  // may fulfill application requests, but no mutation reaches any real handler.
  await page.route("**/api/**", route => {
    if (!["GET", "HEAD"].includes(route.request().method())) { errors.push(`Unexpected mutation: ${route.request().url()}`); return route.abort(); }
    return route.continue();
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
});
test.afterEach(async ({ page }) => { expect(issues.get(page)).toEqual([]); });
async function ready(page: Page, route: string) {
  await page.goto(route); await page.waitForLoadState("networkidle");
  await expect(page.locator("main h1")).toHaveCount(1);
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
}
async function capture(page: Page, name: string, dialog = false) {
  await mkdir(evidence, { recursive: true });
  if (!dialog) {
    for (const image of await page.locator("main img:visible").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: path.join(evidence, `${name}.png`), fullPage: !dialog });
}
async function seedWishlist(page: Page) {
  await page.addInitScript(product => { if (!sessionStorage.getItem("task5-seeded")) { sessionStorage.setItem("trinkgut-wishlist", JSON.stringify([product])); sessionStorage.setItem("task5-seeded", "1"); } }, assortmentProducts[0]);
}
async function assertDialogKeyboard(page: Page, name: string, opener: import("@playwright/test").Locator) {
  const dialog = page.getByRole("dialog", { name, exact: true });
  await expect(dialog).toBeVisible();
  const first = dialog.locator('a[href],button:not([disabled]),input:not([disabled])').first();
  const last = dialog.locator('a[href],button:not([disabled]),input:not([disabled])').last();
  await first.focus();
  await page.keyboard.press("Shift+Tab"); await expect(last).toBeFocused();
  await page.keyboard.press("Tab"); await expect(first).toBeFocused();
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused();
}

for (const width of [390, 768, 1440]) {
  test(`service families and exact public contact destinations at ${width}px`, async ({ page }) => {
    test.setTimeout(180_000); await page.setViewportSize({ width, height: 900 });
    for (const route of ["/vermietung", "/bewerbung", "/warenkorb", "/merkzettel", "/checkout", "/bestellungen", "/kontakt", "/impressum", "/datenschutz", "/agb", "/task5-does-not-exist"]) {
      await ready(page, route);
      await expect(page.locator("main header h1")).toHaveCount(1);
      expect((await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations, route).toEqual([]);
      await capture(page, `${route.slice(1)}-${width}`);
      if (route === "/bewerbung") {
        await expect(page.getByText("Der Online-Upload ist zurzeit nicht verfügbar.", { exact: false })).toBeVisible();
        await expect(page.locator('input[type="file"]')).toHaveCount(0);
        const posters = page.locator('main a[aria-label$="vollständige Anzeige öffnen"]'); await expect(posters).toHaveCount(3);
        for (const image of await posters.locator("img").all()) {
          const ratios = await image.evaluate((node: HTMLImageElement) => ({ natural: node.naturalWidth / node.naturalHeight, shown: node.clientWidth / node.clientHeight }));
          expect(ratios.shown).toBeCloseTo(ratios.natural, 2);
        }
      }
      if (route === "/kontakt") {
        for (const href of ["tel:+492823418707", "tel:+4917663228597", "mailto:jammers-goch@trinkgut.de", "https://wa.me/491752492386", "https://www.instagram.com/trinkgutjammers_goch/"]) await expect(page.locator(`main a[href="${href}"]`)).toHaveCount(1);
        await expect(page.locator("main").getByRole("link", { name: "Route zu Trinkgut Jammers in Google Maps planen", exact: true })).toBeVisible();
      }
    }
    // Protected routes remain read-only unauthenticated views; no login/control use.
    for (const route of ["/bewerbung/verwaltung", "/markt/bestellungen"]) {
      await ready(page, route);
      if (route === "/bewerbung/verwaltung") {
        await expect(page.locator("#admin-status")).toContainText("Die Sitzung konnte nicht geprüft werden.");
        await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toHaveCount(0);
      } else {
        await expect(page.locator("main").getByRole("alert")).toContainText("Online-Bestellungen werden noch eingerichtet.");
        await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toBeDisabled();
      }
      await capture(page, `${route.slice(1).replaceAll("/", "-")}-inherited-${width}`);
    }
  });

  test(`rental quantity, dated quote, errors, cart and inquiry selections at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000); await page.setViewportSize({ width, height: 900 }); await ready(page, "/vermietung");
    const article = page.locator('article[data-rental-name="Kühlanhänger"]');
    const amount = article.getByRole("spinbutton");
    await page.getByLabel("Gewünschte Abholung").fill("2026-10-12"); await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-14");
    await article.getByRole("button", { name: /erhöhen/ }).click(); await expect(amount).toHaveValue("1");
    await article.getByRole("button", { name: /verringern/ }).click(); await expect(amount).toHaveValue("0");
    await amount.fill("1"); await expect(page.getByText(/Mietgesamtpreis: 150,00/)).toBeVisible();
    for (const button of await article.getByRole("button").all()) { const box = await button.boundingBox(); expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44); }
    await capture(page, `rental-selection-${width}`);
    await amount.fill("999"); await expect(article.getByRole("alert")).toBeVisible(); await expect(amount).toHaveAttribute("aria-invalid", "true"); await capture(page, `rental-quantity-error-${width}`);
    await amount.fill("0"); await amount.fill("1"); await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-11"); await expect(page.locator('[aria-labelledby="rental-dates"]').getByRole("alert")).toContainText("gültigen Zeitraum"); await capture(page, `rental-date-error-${width}`);
    await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-14");
    const add = page.getByRole("button", { name: "In den Warenkorb", exact: true }); await add.click();
    const rentalDialog = page.getByRole("dialog", { name: "Dein Mietwarenkorb", exact: true });
    await expect(rentalDialog.getByRole("button", { name: "Schließen", exact: true })).toBeFocused();
    const drawerIncrease = rentalDialog.getByRole("button", { name: "Menge für Kühlanhänger erhöhen", exact: true });
    await drawerIncrease.click();
    await expect(rentalDialog).toContainText("300,00");
    await expect(drawerIncrease).toBeFocused();
    await capture(page, `cart-drawer-rental-${width}`, true);
    await assertDialogKeyboard(page, "Dein Mietwarenkorb", page.getByRole("link", { name: "Warenkorb öffnen", exact: true }));
    await ready(page, "/warenkorb"); await expect(page.getByText(/Mietgesamtpreis: 300,00/)).toBeVisible(); await capture(page, `cart-priced-${width}`);
    await page.getByRole("button", { name: /Menge für Kühlanhänger erhöhen/ }).click(); await page.getByRole("button", { name: /Menge für Kühlanhänger erhöhen/ }).click(); await page.getByRole("button", { name: /Menge für Kühlanhänger erhöhen/ }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("nicht verfügbar"); await capture(page, `cart-quantity-error-${width}`);
    await ready(page, "/checkout"); await expect(page.getByRole("heading", { name: "Reservierung unverbindlich anfragen", exact: true })).toBeVisible(); await capture(page, `checkout-disabled-inquiry-${width}`);
    await page.getByLabel("Gewünschte Bereitstellung").selectOption("delivery"); await expect(page.getByLabel("PLZ", { exact: true })).toBeVisible();
    // Native required validation only: no submit event, mailto or window.open.
    expect(await page.locator("main form").evaluate((form: HTMLFormElement) => form.reportValidity())).toBe(false);
    await capture(page, `inquiry-delivery-required-${width}`);
  });

  test(`wishlist, mixed list and both drawer states at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000); await page.setViewportSize({ width, height: 900 }); await seedWishlist(page); await ready(page, "/merkzettel");
    await expect(page.locator("[data-product-card]")).toHaveCount(1); await capture(page, `wishlist-populated-${width}`);
    const preview = page.getByRole("button", { name: "Merkzettel-Vorschau öffnen", exact: true }); await preview.click();
    await capture(page, `wishlist-drawer-populated-${width}`, true); await assertDialogKeyboard(page, "Merkzettel (1)", preview);
    await preview.click(); await page.getByRole("dialog").getByRole("button", { name: "Merkzettel leeren", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("Dein Merkzettel ist leer"); await capture(page, `wishlist-drawer-empty-${width}`, true); await page.keyboard.press("Escape"); await expect(preview).toBeFocused();
    await page.evaluate(product => sessionStorage.setItem("trinkgut-wishlist", JSON.stringify([product])), assortmentProducts[0]); await page.reload();
    const bulk = page.getByRole("button", { name: "Alle zur Anfrageliste (1)", exact: true });
    await bulk.click(); const goodsDialog = page.getByRole("dialog", { name: "Deine Anfrageliste", exact: true }); await expect(goodsDialog).toBeVisible(); await capture(page, `cart-drawer-goods-${width}`, true);
    for (const key of ["Tab", "Shift+Tab"]) {
      if (key === "Shift+Tab") { await bulk.click(); await expect(goodsDialog).toBeVisible(); }
      await goodsDialog.getByRole("button", { name: "Entfernen", exact: true }).click(); await expect(goodsDialog).toContainText("Deine Anfrageliste ist leer.");
      await page.keyboard.press(key); await expect(goodsDialog.getByRole("button", { name: "Schließen", exact: true })).toBeFocused();
      if (key === "Tab") await capture(page, `cart-drawer-empty-${width}`, true);
      await page.keyboard.press("Escape"); await expect(bulk).toBeFocused();
    }
    await bulk.click(); await expect(goodsDialog).toBeVisible(); await page.keyboard.press("Escape");
    await ready(page, "/warenkorb"); await capture(page, `cart-goods-${width}`);
    await ready(page, "/vermietung"); await page.getByLabel("Gewünschte Abholung").fill("2026-10-12"); await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-14"); await page.getByRole("spinbutton", { name: "Menge für Kühlanhänger", exact: true }).fill("1"); await page.getByRole("button", { name: "In den Warenkorb", exact: true }).click(); await page.keyboard.press("Escape");
    await ready(page, "/warenkorb"); await expect(page.getByText(/kein Gesamtpreis der gemischten Liste/)).toBeVisible(); await capture(page, `cart-mixed-${width}`);
    await ready(page, "/checkout"); await expect(page.getByText("Gemischte Warenkörbe und Leihartikel ohne festgelegten Preis stimmen wir persönlich mit dir ab.", { exact: true })).toBeVisible(); await capture(page, `checkout-mixed-${width}`);
  });

  test(`individual wishlist transfer hands off to one keyboard-safe cart dialog at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await ready(page, "/finder");
    await page.getByRole("button", { name: /Bierfinder/ }).click();
    for (const name of ["Pils – herb & frisch", "Keine Präferenz", "Feierabendbier"]) await page.getByRole("button", { name, exact: true }).click();
    const card = page.locator("[data-product-card]").first();
    const productName = (await card.getByRole("heading", { level: 2 }).textContent())!.trim();
    await card.getByRole("button", { name: "Zum Merkzettel", exact: true }).click();
    await page.locator("footer").getByRole("link", { name: "Merkzettel", exact: true }).click();
    const preview = page.getByRole("button", { name: "Merkzettel-Vorschau öffnen", exact: true }); await preview.click();
    await page.getByRole("dialog", { name: "Merkzettel (1)", exact: true }).getByRole("button", { name: "+ Anfrage", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    const cart = page.getByRole("dialog", { name: "Deine Anfrageliste", exact: true });
    await expect(cart).toContainText(productName); await expect(cart.getByText("1", { exact: true })).toBeVisible();
    const controls = cart.locator('a[href],button:not([disabled]),input:not([disabled])');
    await expect(controls.first()).toBeFocused();
    await page.keyboard.press("Tab"); await expect(controls.nth(1)).toBeFocused();
    await page.keyboard.press("Shift+Tab"); await expect(controls.first()).toBeFocused();
    await assertDialogKeyboard(page, "Deine Anfrageliste", preview);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("[data-product-card]")).toHaveCount(1);
    await expect(page.locator("[data-product-card]")).toContainText(productName);
  });

  test(`synthetic application selection and error focus without upload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); let mutations = 0;
    await page.route("**/api/bewerbung**", route => {
      if (!route.request().url().endsWith("/config") || route.request().method() !== "GET") { mutations++; return route.abort(); }
      return route.fulfill({ json: { enabled: true, mode: "pilot", limits: { maxFiles: 5, maxFileBytes: 5242880, maxTotalBytes: 10485760 }, jobs: [{ id: "sales-fulltime", label: "Verkauf Vollzeit (m/w/d)" }, { id: "sales-parttime", label: "Verkauf Teilzeit bis zu 150 Stunden/Monat (m/w/d)" }] } });
    });
    await ready(page, "/bewerbung"); await page.getByRole("button", { name: "Für Teilzeit bewerben", exact: true }).click(); await expect(page.getByLabel("Name *", { exact: true })).toBeFocused();
    await expect(page.getByRole("radio", { name: "Verkauf Teilzeit bis zu 150 Stunden/Monat (m/w/d)", exact: true })).toBeChecked();
    await capture(page, `application-synthetic-selected-${width}`);
    await page.getByRole("button", { name: "TEST-Bewerbung absenden", exact: true }).click(); const summary = page.getByRole("alert", { name: "Bitte prüfe deine Eingaben", exact: true }); await expect(summary).toBeFocused();
    await expect(page.getByLabel("Name *", { exact: true })).toHaveAttribute("aria-invalid", "true"); await expect(page.getByLabel("E-Mail *", { exact: true })).toHaveAttribute("aria-describedby", "application-email-error");
    await capture(page, `application-synthetic-errors-${width}`); expect(mutations).toBe(0);
  });

  test(`invalid rental status and synthetic configuration error at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await ready(page, "/mietbestellung/task5-invalid"); await expect(page.locator("main").getByRole("alert")).toBeVisible(); await expect(page.getByRole("button", { name: /Zahlung/ })).toHaveCount(0); await capture(page, `rental-status-invalid-${width}`);
    await page.addInitScript(() => sessionStorage.setItem("trinkgut-cart", JSON.stringify([{ product: { id: 20001 }, quantity: 1, rental: { startDate: "2026-10-12", endDate: "2026-10-14", workdays: 3, periods: 0, basePrice: 0, totalRentalPrice: 0 } }])));
    await page.route("**/api/rentals/config", route => route.fulfill({ status: 503, json: { error: "Synthetic unavailable" } }));
    await ready(page, "/checkout"); await expect(page.locator("main").getByRole("alert")).toHaveText("Die Bestellfunktion konnte nicht geladen werden."); await capture(page, `checkout-config-error-${width}`);
  });

  test(`synthetic rental checkout and status presentation without transactions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const order: RentalOrder = {
      id: "synthetic-presentation", number: "TEST-UI-ONLY", createdAt: "2026-10-10T12:00:00Z", updatedAt: "2026-10-10T12:00:00Z", version: 1, status: "submitted", paymentMethod: "cash", payment: { status: "not_requested", attempt: 0 },
      customer: { name: "Synthetic UI", email: "ui@example.invalid", phone: "000", street: "Test", postalCode: "00000", city: "Test", country: "Test" },
      quote: { lines: [{ id: 20001, name: "Kühlanhänger", quantity: 1, startDate: "2026-10-12", endDate: "2026-10-14", workdays: 3, periods: 1, unitPriceCents: 15000, lineTotalCents: 15000 }], totalCents: 15000, knownSubtotalCents: 15000, allPriced: true, currency: "EUR", pricingVersion: "synthetic-presentation" },
      termsVersion: "synthetic", termsText: "Synthetische Bedingungen zur reinen Darstellungsprüfung.", privacyText: "Synthetischer Datenschutzhinweis zur Darstellungsprüfung.", testMode: true, issuer: { name: "Synthetic", address: ["Test"], taxNumber: "TEST", vatRateBps: 1900, invoicePrefix: "TEST" }, events: [],
    };
    await page.route("**/api/rentals/**", route => {
      if (route.request().method() !== "GET") { issues.get(page)!.push("Synthetic rental attempted a mutation"); return route.abort(); }
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === "/api/rentals/config") return route.fulfill({ json: { enabled: true, testMode: true, onlinePayment: false, termsVersion: order.termsVersion, termsText: order.termsText, privacyText: order.privacyText, message: "Synthetic UI only" } });
      if (pathname === "/api/rentals/orders/synthetic-presentation") return route.fulfill({ json: { order } });
      issues.get(page)!.push(`Unexpected synthetic endpoint: ${pathname}`); return route.abort();
    });
    await page.addInitScript(() => sessionStorage.setItem("trinkgut-cart", JSON.stringify([{ product: { id: 20001 }, quantity: 1, rental: { startDate: "2026-10-12", endDate: "2026-10-14", workdays: 3, periods: 0, basePrice: 0, totalRentalPrice: 0 } }])));
    await ready(page, "/checkout"); await expect(page.getByRole("heading", { name: "Deine Mietbestellung", exact: true })).toBeVisible();
    await page.getByText("Mietbedingungen lesen", { exact: true }).click(); await page.getByText("Datenschutz zur Bestellung", { exact: true }).click();
    expect((await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    await capture(page, `checkout-synthetic-form-${width}`);
    await ready(page, "/mietbestellung/synthetic-presentation?token=synthetic"); await expect(page.getByRole("heading", { name: "Bestellung eingegangen", exact: true })).toBeVisible(); await capture(page, `status-synthetic-submitted-${width}`);
    order.status = "accepted"; order.version = 2; order.payment.status = "paid";
    await page.reload(); await expect(page.getByRole("heading", { name: "Vom Markt bestätigt", exact: true })).toBeVisible(); await page.getByText("Vereinbarte Mietbedingungen", { exact: true }).click(); await capture(page, `status-synthetic-accepted-${width}`);
  });
}
