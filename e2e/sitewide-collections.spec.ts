import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import offers from "../data/weekly-offers.json";
import { eigenmarken } from "../data/eigenmarken";
import { GIVEAWAYS_2026 } from "../data/giveaways";
import type { FlyerIndex } from "../lib/flyer-index";

const proof = ".superpowers/sdd/2026-10-10-sitewide-filmisch/screenshots";
const routes = ["/angebote", "/handzettel", "/produkte", "/kategorie/bier", "/eigenmarke", "/regionale-spirituosen", "/geschenkideen", "/marktleben", "/galerie", "/gewinnspiel", "/gewinnspiel/archiv"];

for (const width of [390, 768, 1440]) {
  for (const path of routes) {
    test(`${path} collection at ${width}px keeps full originals and editorial hierarchy`, async ({ page }) => {
      test.setTimeout(120_000);
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error" && /hydration|did not match/i.test(message.text())) errors.push(message.text()); });
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      const main = page.getByRole("main");
      await expect(main.locator("h1")).toHaveCount(1);
      await expect(main.locator("header h1")).toBeVisible();
      await expect(main.locator("[data-collection]")).toHaveCount(1);
      await expect(main.locator("h1")).toHaveCSS("color", "rgb(25, 25, 24)");
      await expect(main.locator(".page-hero-banner, .category-intro")).toHaveCount(0);
      if (path === "/produkte") {
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
        const valid = offers.filter(offer => offer.validFrom <= today && offer.validTo >= today);
        await expect(main.locator("[data-offer-id]")).toHaveCount(valid.length);
        for (const offer of valid) {
          const article = main.locator(`[data-offer-id="${offer.id}"]`);
          await expect(article.locator("img")).toHaveAttribute("alt", new RegExp(offer.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
          if (offer.sourceWarning) await expect(article).toContainText(offer.sourceWarning);
        }
      }
      if (path === "/eigenmarke") {
        for (const brand of eigenmarken) await expect(main.locator(`#${brand.slug} h2`)).toHaveText(brand.name);
      }
      if (path === "/galerie") {
        await expect(main.locator("figcaption")).toHaveText(["Niko", "Sven", "Jasmin", "Jan Niklas", "Hanna", "Henri", "Hannah"]);
        await expect(main.getByText("Unser neues Teamfoto folgt", { exact: true })).toBeVisible();
      }
      if (path.startsWith("/gewinnspiel")) {
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
        if (path.endsWith("/archiv")) {
          const ended = GIVEAWAYS_2026.filter(item => item.verifiedEndsDate < today);
          await expect(main.locator("[data-giveaway-id]")).toHaveCount(ended.length);
          for (const item of ended) await expect(main.locator(`[data-giveaway-cover="${item.id}"]`)).toHaveCount(item.cover ? 1 : 0);
        } else {
          await expect(main.locator("#jahresagenda article")).toHaveCount(12);
          for (const item of GIVEAWAYS_2026.filter(item => item.kind === "monthly" && item.cover)) await expect(main.locator(`#jahresagenda [data-giveaway-cover="${item.id}"]`)).toHaveCount(1);
          for (const active of await main.locator('#aktuell [data-giveaway-id]').all()) {
            const id = await active.getAttribute("data-giveaway-id");
            expect(GIVEAWAYS_2026.find(item => item.id === id)!.verifiedEndsDate >= today).toBe(true);
          }
        }
        for (const cover of await main.locator("[data-giveaway-cover]").all()) {
          const id = await cover.getAttribute("data-giveaway-cover");
          const giveaway = GIVEAWAYS_2026.find(item => item.id === id);
          expect(giveaway?.cover).toBeTruthy();
          await expect(cover).toHaveAttribute("href", giveaway!.sourceURL);
          await expect(cover).toHaveAttribute("rel", "noopener noreferrer");
        }
      }
      // Every visible original must decode; offer crops use a contain box, other originals retain their natural ratio.
      for (const img of await main.locator("img").all()) {
        await img.scrollIntoViewIfNeeded();
        await expect.poll(() => img.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        const geometry = await img.evaluate(el => {
          const image = el as HTMLImageElement;
          const rect = image.getBoundingClientRect();
          return { fit: getComputedStyle(image).objectFit, ratio: rect.width / rect.height, natural: image.naturalWidth / image.naturalHeight };
        });
        expect(geometry.fit === "contain" || Math.abs(geometry.ratio - geometry.natural) < .02).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(errors).toEqual([]);
      await page.evaluate(() => scrollTo(0, 0));
      mkdirSync(proof, { recursive: true });
      await page.screenshot({ path: `${proof}/task3-${path.slice(1).replaceAll("/", "-")}-${width}.png`, fullPage: path !== "/produkte" });
      if (path === "/produkte" && await main.locator("[data-offer-id]").count()) {
        await main.locator("[data-offer-id]").first().screenshot({ path: `${proof}/task3-offer-first-${width}.png` });
        await main.locator("[data-offer-id]").last().screenshot({ path: `${proof}/task3-offer-last-${width}.png` });
      }
    });
  }

  test(`catalogue no-match, category 404 and navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const hydratedOffers = page.waitForResponse(response => response.url().endsWith("/api/content/offers") && response.status() === 200);
    await page.goto("/produkte");
    await hydratedOffers;
    await page.getByRole("textbox", { name: "Aktuelle Angebote durchsuchen" }).fill("zzzz-kein-angebot-zzzz");
    await expect(page.locator("[data-offer-id]")).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "kein passendes Einzelangebot" })).toBeVisible();
    mkdirSync(proof, { recursive: true });
    await page.screenshot({ path: `${proof}/task3-no-match-${width}.png`, fullPage: true });
    await page.getByRole("navigation", { name: "Warengruppen" }).getByRole("link", { name: "Bier", exact: true }).click();
    await expect(page).toHaveURL(/\/kategorie\/bier$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bier");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("color", "rgb(25, 25, 24)");
    const response = await page.goto("/kategorie/gibt-es-nicht");
    // A streamed Next 404 may have a 200 HTTP shell; the customer-visible not-found state is authoritative.
    expect([200, 404]).toContain(response!.status());
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/nicht gefunden/i);
    await expect(page.getByRole("main").getByRole("link", { name: /Startseite/i })).toBeVisible();
    await page.screenshot({ path: `${proof}/task3-invalid-category-${width}.png`, fullPage: true });
  });

  test(`real DE and NL handzettel viewer keyboard and focus at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/handzettel");
    const viewers = page.locator("[data-flyer-viewer]");
    const response = await request.get("/api/content/flyers");
    expect(response.ok()).toBe(true);
    const index: FlyerIndex = await response.json();
    await expect(viewers).toHaveCount(index.flyers.length);
    if (!index.flyers.length) await expect(page.getByText("Der nächste gültige Handzettel wird vorbereitet.", { exact: false })).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
    for (const viewer of await viewers.all()) {
      const trigger = viewer.getByRole("button", { name: "Handzettel ansehen", exact: true });
      await expect(trigger).toBeEnabled();
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Handzettel schließen" })).toBeFocused();
      const source = await dialog.locator("iframe").getAttribute("src");
      expect(source).toMatch(/^\/handzettel\//);
      await page.keyboard.press("Shift+Tab");
      expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
  });
}

test("client navigation between image, market, people and action families keeps scoped composition", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/eigenmarke");
  for (const [href, family] of [["/geschenkideen", "gifts"], ["/marktleben", "market"], ["/gewinnspiel#jahresagenda", "giveaways"]]) {
    await page.getByRole("contentinfo").locator(`a[href="${href}"]`).click();
    await expect(page.locator(`[data-collection="${family}"]`)).toBeVisible();
    await expect(page.getByRole("main").locator("h1")).toHaveCSS("color", "rgb(25, 25, 24)");
    await expect(page.getByRole("main").locator("h1")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    if (family === "market") {
      await page.getByRole("main").getByRole("link", { name: "Team kennenlernen", exact: true }).click();
      await expect(page.locator('[data-collection="team"] figcaption')).toHaveCount(7);
      await expect(page.getByRole("main").locator("h1")).toHaveCSS("color", "rgb(25, 25, 24)");
    }
  }
  expect(errors).toEqual([]);
});
