import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { SITEWIDE_DESIGN_CASES, SITEWIDE_SYSTEM_CASES } from "./sitewide-design-cases";
import { appendFileSync } from "node:fs";

// These acceptance tests must never open drafts or write to operational handlers.
async function readOnly(context: BrowserContext) {
  await context.route("**/*", route => {
    const request = route.request();
    if (!["GET", "HEAD"].includes(request.method()) || !/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(request.url())) {
      if (process.env.ATMOSPHERE_BLOCKED_LOG) appendFileSync(process.env.ATMOSPHERE_BLOCKED_LOG, `${request.method()} ${request.url()}\n`);
      return route.abort();
    }
    return route.continue();
  });
}
async function originals(page: Page) {
  for (const img of await page.locator("main img:visible").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    await img.evaluate(node => (node as HTMLImageElement).decode());
    const src = await img.getAttribute("src") ?? "";
    if (/handzettel|weekly-offer|eigenmarken-bottles|giveaways|job-|rental-|cocktail/.test(decodeURIComponent(src))) await expect(img).toHaveCSS("object-fit", "contain");
  }
}

const portraits = [
  ["bier", "beer", "/images/editorial/user/bueble-aufbau.webp"],
  ["alkoholfrei", "fresh", "/images/editorial/user/spezi-regal.webp"],
  ["wein", "wine", "/images/editorial/user/weinregal.webp"],
  ["spirituosen", "spirits", "/images/editorial/google/baileys-aufbau.webp"],
] as const;

test("party introductions show the intact illustration without replacing working forms", async ({ page, context }) => {
  test.setTimeout(90_000);
  await readOnly(context);
  for (const route of ["/partyplaner", "/vermietung"]) {
    await page.goto(route);
    const image = page.locator("[data-intro-media] img");
    await expect(image).toHaveCount(1);
    expect(decodeURIComponent(await image.getAttribute("src") ?? "")).toContain("/images/party/garden-party-jammers-v1.webp");
    await expect(image).toHaveCSS("object-fit", "contain");
    await expect(page.locator("main input").first()).toBeVisible();
  }
});

for (const width of [360, 1440]) {
  test(`approved category portraits and independent copy at ${width}px`, async ({ page, context }) => {
    test.setTimeout(120_000);
    await readOnly(context);
    await page.setViewportSize({ width, height: 1000 });
    for (const [slug, theme, source] of portraits) {
      await page.goto(`/kategorie/${slug}`);
      const intro = page.locator("[data-editorial-intro]");
      await expect(intro).toHaveAttribute("data-atmosphere", theme);
      const image = intro.locator("[data-intro-media] img");
      await expect(image).toHaveCount(1);
      expect(decodeURIComponent(await image.getAttribute("src") ?? "")).toContain(source);
      await expect(image).toHaveCSS("object-fit", "contain");
      await originals(page);
      const bounds = await image.boundingBox();
      expect(bounds!.height).toBeGreaterThan(bounds!.width);
      const title = await intro.locator("h1").boundingBox();
      expect(title!.x + title!.width <= bounds!.x || title!.y + title!.height <= bounds!.y).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });
}

test("validated dynamic templates opt into their mood while unknown paths stay neutral", async ({ page, context }) => {
  await readOnly(context);
  for (const [route, mood] of [["/akademie/bier", "learning"], ["/akademie/bier/lektion/2", "learning"], ["/cocktails/mojito", "learning"], ["/cocktails/kategorie/rum", "learning"], ["/karriere/verkauf-vollzeit", "people"]]) {
    await page.goto(route);
    await expect(page.locator("[data-editorial-intro]")).toHaveAttribute("data-atmosphere", mood);
  }
  await page.goto("/akademie/kein-kurs");
  await expect(page.locator("main[data-atmosphere]")).toHaveAttribute("data-atmosphere", "neutral");
});

for (const mode of ["normal", "reduced", "no-js"] as const) {
  for (const width of [360, 1440]) {
    for (const entry of [...SITEWIDE_DESIGN_CASES, ...SITEWIDE_SYSTEM_CASES]) {
      test(`census ${mode} ${width}px ${entry.template}`, async ({ browser, baseURL }) => {
        test.setTimeout(90_000);
        const context = await browser.newContext({ baseURL, viewport: { width, height: 1000 }, javaScriptEnabled: mode !== "no-js", reducedMotion: mode === "normal" ? "no-preference" : "reduce" });
        await readOnly(context);
        const page = await context.newPage();
        const errors: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        page.on("console", msg => { if (msg.type() === "error" && /hydration|did not match/i.test(msg.text())) errors.push(msg.text()); });
        try {
          await page.goto(entry.path);
          await expect(page.getByRole("main")).toHaveCount(1);
          await expect(page.locator("main h1")).toHaveCount(1);
          await expect(page.locator("main h1")).toBeVisible();
          await expect(page.getByRole("banner")).toHaveCount(1);
          await expect(page.getByRole("contentinfo")).toHaveCount(1);
          expect(await page.locator("[data-atmosphere]").first().getAttribute("data-atmosphere")).toMatch(/^(neutral|offers|beer|fresh|wine|spirits|party|learning|people|nl)$/);
          await originals(page);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
          if (["/impressum", "/datenschutz", "/agb", "/checkout", "/warenkorb"].includes(entry.path)) {
            await expect(page.locator("main[data-atmosphere]")).toHaveAttribute("data-atmosphere", "neutral");
            await expect(page.getByRole("main")).toHaveCSS("background-color", "rgb(255, 255, 255)");
          }
          expect(errors).toEqual([]);
        } finally { await context.close(); }
      });
    }
  }
}

test("native brand navigation works without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 360, height: 900 } });
  await readOnly(context);
  const page = await context.newPage();
  try {
    await page.goto("/eigenmarke");
    await page.locator('main a[href="#pralle-kirsche"]').first().click();
    await expect(page).toHaveURL(/#pralle-kirsche$/);
    await page.locator('main a[href="/eigenmarke/pralle-kirsche"]').first().click();
    await expect(page).toHaveURL(/\/eigenmarke\/pralle-kirsche$/);
    await expect(page.locator("main h1")).toHaveText("Pralle Kirsche.");
    await expect(page.getByRole("heading", { level: 1, name: "Pralle Kirsche.", exact: true })).toBeVisible();
    await originals(page);
  } finally { await context.close(); }
});

test("a category with no released offers keeps its honest empty state and original portrait", async ({ page, context, request }) => {
  await readOnly(context);
  await page.setViewportSize({ width: 360, height: 900 });
  const source = await request.get("/api/content/offers", { headers: { "X-Jammers-Content-Version": "2" } });
  expect(source.ok()).toBe(true);
  const content = await source.json();
  // Marked browser-only response fixture: preserve source metadata and other
  // categories, removing the selected category without changing the real clock.
  await page.route("**/api/content/offers", route => route.fulfill({ json: { ...content, offers: content.offers.filter((offer: { categorySlug: string }) => offer.categorySlug !== "bier") } }));
  await page.goto("/kategorie/bier");
  await expect(page.locator("[data-offer-id]")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "kein passendes Einzelangebot freigegeben" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Alle Handzettel und Zusatzanzeigen ansehen", exact: false })).toBeVisible();
  await expect(page.locator("[data-intro-media] img")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

for (const width of [390, 768]) {
  test(`quiet portal and inquiry validation at ${width}px without opening a draft`, async ({ page, context, request }) => {
    await readOnly(context);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/vermietung");
    await page.getByLabel("Gewünschte Abholung").fill("2026-10-12");
    await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-14");
    await page.getByRole("spinbutton", { name: "Menge für Kühlanhänger", exact: true }).fill("1");
    const add = page.getByRole("button", { name: "In den Warenkorb", exact: true });
    await add.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(dialog.getByRole("button", { name: "Schließen", exact: true })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Schließen", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("[data-cart-focus-return]")).toBeFocused();
    await page.goto("/checkout");
    await expect(page.locator('[data-service="inquiry"]')).toBeVisible();
    const form = page.locator("main form");
    expect(await form.evaluate(node => (node as HTMLFormElement).checkValidity())).toBe(false);
    await page.getByLabel("Dein Name").fill("Lokale Designprüfung");
    expect(await form.evaluate(node => (node as HTMLFormElement).checkValidity())).toBe(true);
    await page.getByLabel("Gewünschte Bereitstellung").selectOption("delivery");
    expect(await form.evaluate(node => (node as HTMLFormElement).checkValidity())).toBe(false);
    await expect(page.getByLabel("PLZ", { exact: true })).toHaveAttribute("required", "");
    await expect(page.getByLabel("Ort", { exact: true })).toHaveAttribute("required", "");
    await expect(page.getByText("1 × Kühlanhänger", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const config = await request.get("/api/rentals/config");
    expect(config.ok()).toBe(true);
    expect(await config.json()).toMatchObject({ enabled: false, testMode: false, onlinePayment: false });
  });
}
