import { mkdirSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { installCatalogCoverFixture } from "./test-fixtures";

// The default shared server uses the historical July test clock; its retired
// upstream flyer needs the same isolated fixture as the existing contracts.
// Explicit production-base runs remain entirely fixture-free.
test.beforeEach(async ({ context }) => {
  if (!process.env.PLAYWRIGHT_BASE_URL) await installCatalogCoverFixture(context);
});

const screenshotDirectory = process.env.AUDIT_SCREENSHOT_DIR
  ? join(process.env.AUDIT_SCREENSHOT_DIR, "public-site-completion")
  : "audit/screenshots/public-site-completion-2026-09-30";
const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;
const routes = [
  { path: "/", name: "home", heading: /Goch schenkt ein\./ },
  { path: "/kategorie/bier", name: "category-bier", heading: /^Bier$/ },
  { path: "/kategorie/alkoholfrei", name: "category-alkoholfrei", heading: /^Alkoholfreie Getränke$/ },
  { path: "/geschenkideen", name: "geschenkideen", heading: /^Freude schenken\. Mit Jammers\.$/ },
  { path: "/regionale-spirituosen", name: "regionale-spirituosen", heading: /^Regional\. Besonders\. Für dich\.$/ },
  { path: "/marktleben", name: "marktleben", heading: /^Unser Markt\. Nah dran\.$/ },
  { path: "/cocktails", name: "cocktails", heading: /^Cocktail-Rezepte$/ },
  { path: "/cocktails/mojito", name: "cocktail-mojito", heading: /^Mojito$/ },
  { path: "/cocktails/kategorie/rum", name: "cocktail-category-rum", heading: /^Cocktails mit Rum$/ },
  { path: "/galerie", name: "galerie", heading: /^Team Jammers$/ },
  { path: "/vermietung", name: "vermietung", heading: /^Deine Feier\. Unser Leihsortiment\.$/ },
  { path: "/gewinnspiel", name: "gewinnspiel", heading: /Ein Jahr\.\s*Viele Gewinnchancen\./ },
] as const;

function collectRuntimeIssues(page: Page): string[] {
  const issues: string[] = [];
  page.on("console", message => {
    if (message.type() === "error" ||
      (message.type() === "warning" && /hydrat(?:e|ed|ion)|did not match/i.test(message.text()))) {
      issues.push(`console.${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", error => issues.push(`pageerror: ${error.message}`));
  return issues;
}

async function settleVisibleImages(page: Page): Promise<void> {
  // Scroll to each actual image so native lazy loading is tested, not bypassed.
  for (const image of await page.locator("img:visible").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => ({
      complete: element.complete,
      hasPixels: element.naturalWidth > 0 && element.naturalHeight > 0,
    })), { message: `image must load: ${await image.getAttribute("alt")}`, timeout: 15_000 })
      .toEqual({ complete: true, hasPixels: true });
    await image.evaluate((element: HTMLImageElement) => element.decode());
  }
  await page.evaluate(() => document.fonts.ready);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const geometry = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(geometry.document, "document must fit the viewport").toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.body, "body must fit the viewport").toBeLessThanOrEqual(geometry.viewport);
  const clippedContent = await page.locator(
    "main h1, main h2, main h3, main p, main figure, main img, main button, main input, main nav a, header a, header summary, footer a, footer p",
  ).evaluateAll(elements => elements.filter(element => {
    if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const box = element.getBoundingClientRect();
    return box.left < -1 || box.right > document.documentElement.clientWidth + 1;
  }).map(element => ({ tag: element.tagName, text: element.textContent?.trim(), class: element.className })));
  expect(clippedContent, "visible content must not be hidden outside the horizontal viewport").toEqual([]);
}

async function expectNaturalEditorialImages(page: Page, path: string): Promise<void> {
  const images = path === "/"
    ? page.locator("#menschen figure img, #eigenmarken figure img")
    : path === "/galerie" ? page.locator("main figure img") : null;
  if (!images) return;
  await expect(images).toHaveCount(path === "/" ? 12 : 9);
  for (const image of await images.all()) {
    const ratios = await image.evaluate((element: HTMLImageElement) => ({
      natural: element.naturalWidth / element.naturalHeight,
      displayed: element.getBoundingClientRect().width / element.getBoundingClientRect().height,
    }));
    expect(ratios.displayed, `natural aspect ratio: ${await image.getAttribute("alt")}`).toBeCloseTo(ratios.natural, 2);
  }
  const group = page.getByRole("img", { name: "Mitarbeiterinnen und Mitarbeiter von Trinkgut Jammers", exact: true });
  await expect(group).toHaveCount(1);
  await expect(group).toHaveAttribute("width", "900");
  await expect(group).toHaveAttribute("height", "875");
  const ratios = await group.evaluate((element: HTMLImageElement) => ({
    natural: element.naturalWidth / element.naturalHeight,
    displayed: element.getBoundingClientRect().width / element.getBoundingClientRect().height,
  }));
  expect(ratios.natural).toBeCloseTo(900 / 875, 2);
  expect(ratios.displayed).toBeCloseTo(900 / 875, 2);

  const team = page.locator(path === "/" ? "#menschen" : 'section[aria-labelledby="team-gallery-title"]');
  for (const name of ["Niko", "Sven", "Jasmin", "Gabriella", "Jan Niklas", "Hanna", "Henri", "Hannah"]) {
    const alt = name === "Niko" ? "Nikolaos Jammers im Markt" : `${name} von Trinkgut Jammers`;
    await expect(team.getByRole("img", { name: alt, exact: true })).toHaveCount(1);
    await expect(path === "/"
      ? team.getByText(name, { exact: true })
      : team.getByRole("heading", { name, exact: true })).toHaveCount(1);
  }
  await expect(team.getByText(/\b(?:Harpe|Justin|Nils|Nico|Tim)\b/i)).toHaveCount(0);
  await expect(team.getByRole("img", { name: /\b(?:Harpe|Justin|Nils|Nico|Tim)\b/i })).toHaveCount(0);
  for (const [name, width, height] of [["Henri", 570, 660], ["Hannah", 720, 610]] as const) {
    const portrait = team.getByRole("img", { name: `${name} von Trinkgut Jammers`, exact: true });
    await expect(portrait).toHaveAttribute("width", String(width));
    await expect(portrait).toHaveAttribute("height", String(height));
  }
}

async function saveViewportContext(page: Page, selector: string, path: string): Promise<void> {
  await page.locator(selector).evaluate(element => {
    const headerHeight = document.querySelector("[data-cinematic-header]")?.getBoundingClientRect().height ?? 0;
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - headerHeight - 16);
  });
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.screenshot({ path, animations: "disabled", caret: "hide" });
}

async function expectNaturalMarketImages(page: Page, path: string): Promise<void> {
  const expectedCounts: Record<string, number> = {
    "/": 3,
    "/kategorie/alkoholfrei": 0,
    "/geschenkideen": 1,
    "/regionale-spirituosen": 3,
    "/marktleben": 2,
  };
  const originalDimensions: Record<string, readonly [number, number]> = {
    "salitos-market.webp": [696, 975],
    "gift-basket.webp": [666, 910],
    "niko-market-life.webp": [705, 940],
    "regional-tante-dele.webp": [1080, 1440],
    "regional-schokolaedchen.webp": [1080, 1440],
    "regional-kaeffchen.webp": [1080, 1440],
  };
  const images = page.locator("[data-market-discoveries] img, .category-photo img, .regional-specialties img");
  await expect(images).toHaveCount(expectedCounts[path] ?? 0);
  for (const image of await images.all()) {
    const ratios = await image.evaluate((element: HTMLImageElement) => ({
      natural: element.naturalWidth / element.naturalHeight,
      declared: Number(element.getAttribute("width")) / Number(element.getAttribute("height")),
      displayed: element.getBoundingClientRect().width / element.getBoundingClientRect().height,
    }));
    const description = await image.getAttribute("alt");
    const source = new URL(await image.getAttribute("src") ?? "", page.url());
    const filename = (source.searchParams.get("url") ?? source.pathname).split("/").at(-1) ?? "";
    const dimensions = originalDimensions[filename];
    expect(dimensions, `verified original source: ${description}`).toBeDefined();
    await expect(image).toHaveAttribute("width", String(dimensions[0]));
    await expect(image).toHaveAttribute("height", String(dimensions[1]));
    expect(ratios.natural, `verified original proportions: ${description}`).toBeCloseTo(dimensions[0] / dimensions[1], 2);
    expect(ratios.declared, `original asset proportions: ${description}`).toBeCloseTo(ratios.natural, 2);
    expect(ratios.displayed, `uncropped original photo/poster: ${description}`).toBeCloseTo(ratios.natural, 2);
  }
}

for (const viewport of viewports) {
  for (const route of routes) {
    test(`${route.name} at ${viewport.width}px: clean production layout, images, runtime and accessibility`, async ({ page }, testInfo) => {
      test.setTimeout(60_000);
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const runtimeIssues = collectRuntimeIssues(page);
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await page.waitForLoadState("networkidle");
      const rubricTitles: Record<string, string> = {
        "/geschenkideen": "Geschenkideen aus Goch | Trinkgut Jammers",
        "/regionale-spirituosen": "Regionale Spirituosen in Goch | Trinkgut Jammers",
        "/marktleben": "Marktleben in Goch | Trinkgut Jammers",
      };
      if (rubricTitles[route.path]) await expect(page).toHaveTitle(rubricTitles[route.path]);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      await expect(page.locator("[data-cinematic-header]")).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      await expect(page.locator(".glass-header, [data-legacy-footer]")).toHaveCount(0);

      await settleVisibleImages(page);
      await expectNoHorizontalOverflow(page);
      await expectNaturalEditorialImages(page, route.path);
      await expectNaturalMarketImages(page, route.path);

      mkdirSync(screenshotDirectory, { recursive: true });
      const prefix = `${route.name}-${viewport.width}x${viewport.height}`;
      await page.evaluate(() => window.scrollTo(0, 0));
      const firstViewport = join(screenshotDirectory, `${prefix}-first-viewport.png`);
      await page.screenshot({ path: firstViewport, animations: "disabled", caret: "hide" });
      await testInfo.attach(`${prefix}-first-viewport`, { path: firstViewport, contentType: "image/png" });
      const fullPage = join(screenshotDirectory, `${prefix}-full-page.png`);
      await page.screenshot({ path: fullPage, fullPage: true, animations: "disabled", caret: "hide" });
      await testInfo.attach(`${prefix}-full-page`, { path: fullPage, contentType: "image/png" });
      if (route.path === "/") {
        for (const [selector, context] of [["#aktionen", "actions"], ["#menschen", "team"]]) {
          const path = join(screenshotDirectory, `${prefix}-${context}-context.png`);
          await saveViewportContext(page, selector, path);
          await testInfo.attach(`${prefix}-${context}-context`, { path, contentType: "image/png" });
        }
        const groupPhoto = join(screenshotDirectory, `${prefix}-team-group-full.png`);
        await page.locator("#menschen figure").first().screenshot({ path: groupPhoto, animations: "disabled", caret: "hide" });
        await testInfo.attach(`${prefix}-team-group-full`, { path: groupPhoto, contentType: "image/png" });
      }

      // Audit the real production page, without rule exclusions or network fixtures.
      const accessibility = await new AxeBuilder({ page }).analyze();
      expect.soft(accessibility.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
      expect.soft(runtimeIssues).toEqual([]);
    });
  }
}
