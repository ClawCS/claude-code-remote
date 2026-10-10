import { mkdirSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import desktopPhotoManifest from "../assets/source/user-market-photos/manifest.json";

// Development tests use a marked clock; public flyer absence remains truthful.
// Production-base runs always use the real clock and verified local packages.

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
  { path: "/eigenmarke", name: "eigenmarke", heading: /^Unsere Eigenmarken$/ },
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
    ? page.locator("#menschen figure:not([data-team-photo-placeholder]) img, #eigenmarken [data-own-brand-stage] img")
    : path === "/galerie" ? page.locator("main figure:not([data-team-photo-placeholder]) img") : null;
  if (!images) return;
  await expect(images).toHaveCount(path === "/" ? 13 : 7);
  for (const image of await images.all()) {
    const ratios = await image.evaluate((element: HTMLImageElement) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      const contentWidth = box.width - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth) - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const contentHeight = box.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const original = Number(element.getAttribute("width")) / Number(element.getAttribute("height"));
      return { original, displayed: contentWidth / contentHeight,
        optimizedRatioMin: (element.naturalWidth - 1) / (element.naturalHeight + 1),
        optimizedRatioMax: (element.naturalWidth + 1) / (element.naturalHeight - 1) };
    });
    // Next's density-corrected natural dimensions are integer-rounded (e.g. 195×156 for 710×570).
    // One integer pixel on each optimized dimension bounds the ratio, including narrow bottles.
    expect(ratios.original, `optimized original proportions: ${await image.getAttribute("alt")}`).toBeGreaterThanOrEqual(ratios.optimizedRatioMin);
    expect(ratios.original, `optimized original proportions: ${await image.getAttribute("alt")}`).toBeLessThanOrEqual(ratios.optimizedRatioMax);
    expect(ratios.displayed, `original content-box aspect ratio: ${await image.getAttribute("alt")}`).toBeCloseTo(ratios.original, 2);
    if (path === "/") await expect(image).toHaveCSS("object-fit", "contain");
  }
  const placeholder = page.locator("[data-team-photo-placeholder]");
  await expect(placeholder).toHaveCount(1);
  await expect(placeholder).toContainText("Unser neues Teamfoto folgt");
  await expect(placeholder.getByRole("img", { name: "Trinkgut Jammers", exact: true })).toHaveCount(1);
  await expect(placeholder.getByRole("img", { name: "Trinkgut Jammers", exact: true })).toHaveAttribute("src", /brand-logo\.webp/);
  await expect(placeholder.getByRole("img", { name: "Trinkgut Jammers", exact: true })).toHaveCSS("object-fit", "contain");
  await expect(page.locator('img[src*="team-group"], img[src*="team-gruppenfoto"]')).toHaveCount(0);

  const team = page.locator(path === "/" ? "#menschen" : 'section[aria-labelledby="team-gallery-title"]');
  for (const name of ["Niko", "Sven", "Jasmin", "Jan Niklas", "Hanna", "Henri", "Hannah"]) {
    const alt = name === "Niko" ? "Nikolaos Jammers im Markt" : `${name} von Trinkgut Jammers`;
    await expect(team.getByRole("img", { name: alt, exact: true })).toHaveCount(1);
    await expect(path === "/"
      ? team.getByText(name, { exact: true })
      : team.getByRole("heading", { name, exact: true })).toHaveCount(1);
  }
  await expect(team.getByText(/\b(?:Harpe|Justin|Nils|Nico|Tim|Gabriella)\b/i)).toHaveCount(0);
  await expect(team.getByRole("img", { name: /\b(?:Harpe|Justin|Nils|Nico|Tim|Gabriella)\b/i })).toHaveCount(0);
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
    "/geschenkideen": 3,
    "/regionale-spirituosen": 3,
    "/marktleben": 15,
    "/eigenmarke": 0,
  };
  const originalDimensions: Record<string, readonly [number, number]> = {
    ...Object.fromEntries(desktopPhotoManifest.entries.map(entry => [entry.output.name, [entry.output.dimensions.width, entry.output.dimensions.height] as const])),
    "salitos-market.webp": [696, 975],
    "gift-basket.webp": [666, 910],
    "regional-tante-dele.webp": [1080, 1440],
    "regional-schokolaedchen.webp": [1080, 1440],
    "regional-kaeffchen.webp": [1080, 1440],
    "eigenmarken-flaschen.webp": [927, 1200],
    "regionaler-hofaufbau.webp": [675, 1200],
    "grusskarten-detail.webp": [675, 1200],
    "desperados-detail.webp": [675, 1200],
    "baileys-aufbau.webp": [900, 1200],
    "grillbegleiter.webp": [900, 1200],
    "karten-mit-charakter.webp": [675, 1200],
    "verkostung.webp": [675, 1200],
  };
  const editorialImages = '[data-market-discoveries] img, [data-collection="gifts"] figure img, [data-collection="regional"] figure img, [data-collection="market"] figure img';
  const images = page.locator(editorialImages);
  await expect(images).toHaveCount(expectedCounts[path] ?? 0);
  await expect(page.locator('[data-market-discoveries] figcaption, [data-collection="gifts"] figcaption, [data-collection="regional"] figcaption, [data-collection="market"] figcaption')).toHaveCount(0);
  await expect(page.getByRole("img", { name: /Reinigungshandschuh|Sprühflasche/i })).toHaveCount(0);
  await expect(page.getByText("Mit Herz. Und mit anpacken.", { exact: true })).toHaveCount(0);
  for (const image of await images.all()) {
    const ratios = await image.evaluate((element: HTMLImageElement) => ({
      natural: element.naturalWidth / element.naturalHeight,
      declared: Number(element.getAttribute("width")) / Number(element.getAttribute("height")),
      displayed: element.getBoundingClientRect().width / element.getBoundingClientRect().height,
    }));
    const description = await image.getAttribute("alt");
    const source = new URL(await image.getAttribute("src") ?? "", page.url());
    const filename = (source.searchParams.get("url") ?? source.pathname).split("/").at(-1) ?? "";
    expect(filename, "excluded forklift photo must never be published").not.toMatch(/justin|gabelstapler|forklift/i);
    if ((source.searchParams.get("url") ?? source.pathname).startsWith("/images/editorial/google/")) {
      await expect(image).toHaveAttribute("loading", "lazy");
      await expect(image).not.toHaveAttribute("alt", /Justin|Gabelstapler|forklift/i);
    }
    const dimensions = originalDimensions[filename];
    expect(dimensions, `verified original source: ${description}`).toBeDefined();
    await expect(image).toHaveAttribute("width", String(dimensions[0]));
    await expect(image).toHaveAttribute("height", String(dimensions[1]));
    expect(ratios.natural, `verified original proportions: ${description}`).toBeCloseTo(dimensions[0] / dimensions[1], 2);
    expect(ratios.declared, `original asset proportions: ${description}`).toBeCloseTo(ratios.natural, 2);
    if (path === "/") {
      // Approved discovery photos use a bounded contain box, not an unbounded natural-ratio box.
      await expect(image).toHaveCSS("object-fit", "contain");
      await expect(image).toHaveCSS("max-height", "608px");
      expect((await image.boundingBox())!.height).toBeLessThanOrEqual(608);
    } else expect(ratios.displayed, `uncropped original photo/poster: ${description}`).toBeCloseTo(ratios.natural, 2);
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

      // Portraits live in the approved native disclosure; open it before checking their actual pixels.
      if (route.path === "/") await page.locator("#menschen summary").click();
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
        const groupPlaceholder = join(screenshotDirectory, `${prefix}-team-placeholder.png`);
        await page.locator("[data-team-photo-placeholder]").screenshot({ path: groupPlaceholder, animations: "disabled", caret: "hide" });
        await testInfo.attach(`${prefix}-team-placeholder`, { path: groupPlaceholder, contentType: "image/png" });
      }

      // Audit the real production page, without rule exclusions or network fixtures.
      const accessibility = await new AxeBuilder({ page }).analyze();
      expect.soft(accessibility.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
      expect.soft(runtimeIssues).toEqual([]);
    });
  }
}
