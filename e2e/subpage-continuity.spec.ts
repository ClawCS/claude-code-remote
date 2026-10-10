import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { SITEWIDE_DESIGN_CASES } from "./sitewide-design-cases";
import { courses } from "../data/akademie";
import AxeBuilder from "@axe-core/playwright";

const proof = process.env.AUDIT_SCREENSHOT_DIR ?? ".superpowers/subpage-continuity-2026-10-10/task-1";
const familyProof = process.env.AUDIT_SCREENSHOT_DIR ?? ".superpowers/subpage-continuity-2026-10-10/task-2";
const introCases = SITEWIDE_DESIGN_CASES.filter(item => ["/produkte", "/marktleben", "/cocktails", "/kontakt"].includes(item.path));
const brands = ["pralle-kirsche", "dicke-nuesse", "suesse-suende", "caramello", "schwarzer-teufel", "weisser-engel"];

test.describe.configure({ mode: "parallel" });

const contextLinks = [
  { host: "/produkte", header: "Sortiment", label: "Getränkefinder", target: "/finder" },
  { host: "/partyplaner", header: "Partyplaner", label: "Partyspiele entdecken", target: "/partyspiele" },
  { host: "/kontakt", header: "Dein Besuch", label: "Leergut berechnen", target: "/leergut" },
  { host: "/kontakt", header: "Dein Besuch", label: "Mehrweg entdecken", target: "/oeko-tracker" },
  { host: "/angebote", header: "Angebote", label: "Alle Handzettel ansehen", target: "/handzettel" },
] as const;

async function currentShell(page: Page, origin: string) {
  expect(new URL(page.url()).origin).toBe(origin);
  for (const selector of ["main", "main h1", "[data-cinematic-header]", "footer"]) await expect(page.locator(selector)).toHaveCount(1);
  await expect(page.locator(".glass-header, [data-legacy-footer]")).toHaveCount(0);
}

for (const width of [390, 1440]) {
  for (const javaScriptEnabled of [true, false]) {
    test(`task3 header context destinations and Back retain origin and shell at ${width}px with JavaScript ${javaScriptEnabled}`, async ({ browser }) => {
      test.setTimeout(120_000);
      const context = await browser.newContext({ baseURL: test.info().project.use.baseURL, javaScriptEnabled, viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      try {
        await page.goto("/");
        const origin = new URL(page.url()).origin;
        for (const item of contextLinks) {
          if (javaScriptEnabled) await page.waitForLoadState("networkidle");
          const header = page.locator("[data-cinematic-header]");
          if (width < 1152) await header.getByRole("button", { name: "Menü öffnen", exact: true }).click();
          const nav = header.getByRole("navigation", { name: width < 1152 ? "Mobile Navigation" : "Hauptnavigation", exact: true });
          await expect(nav.locator(":scope > ul > li")).toHaveCount(5);
          await expect(nav.locator('a[href="/community"], a[href="/kuehlschrank"], a[href="/checkout"]')).toHaveCount(0);
          if (item.host === "/partyplaner") await nav.locator('summary[aria-label="Party & Miete – Untermenü öffnen"]').click();
          await nav.getByRole("link", { name: item.header, exact: true }).click();
          await expect(page).toHaveURL(`${origin}${item.host}`);
          if (javaScriptEnabled) await page.waitForLoadState("networkidle");
          await currentShell(page, origin);
          const link = page.locator("main").getByRole("link", { name: item.label, exact: true });
          await expect(link).toHaveAttribute("href", item.target);
          if (javaScriptEnabled) {
            // A pointer-opened page does not enter :focus-visible via focus().
            await page.keyboard.press("Tab");
            await link.focus();
            await expect(link).toBeFocused();
            await expect(link).toHaveCSS("outline-style", "solid");
            expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
          }
          await link.click();
          await expect(page).toHaveURL(`${origin}${item.target}`);
          await currentShell(page, origin);
          await page.goBack();
          await expect(page).toHaveURL(`${origin}${item.host}`);
          await currentShell(page, origin);
          await expect(page.locator("main").getByRole("link", { name: item.label, exact: true })).toBeVisible();
        }
      } finally { await context.close(); }
    });
  }

  test(`task3 contact recipients and restricted overview link at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await familyReady(page, "/kontakt");
    await expect(page.locator("main").getByRole("heading", { name: "Bewerbungen", exact: true })).toBeVisible();
    await expect(page.locator("main").getByRole("heading", { name: "Gut zu wissen", exact: true })).toBeVisible();
    for (const email of ["info@trinkgut-jammers.de", "jammers-goch@trinkgut.de"]) await expect(page.locator("main").getByRole("link", { name: email, exact: true })).toHaveAttribute("href", `mailto:${email}`);
    await familyCapture(page, `contact-context-${width}`);
    for (const route of ["/handzettel", "/nl"]) {
      await familyReady(page, route);
      await expect(page.locator("main").getByRole("link", { name: "Alle Handzettel ansehen", exact: true })).toHaveCount(0);
      await expect(page.locator('main a[href="/handzettel"]')).toHaveCount(0);
    }
  });
}

for (const width of [360, 390, 768, 1440]) {
  for (const { path } of introCases) {
    test(`${path} has a warm full-width intro and bold hierarchy at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      const main = page.getByRole("main");
      await expect(main.locator("h1")).toHaveCount(1);
      await expect(main.locator("h1")).toHaveCSS("font-weight", "800");
      const intro = main.locator("[data-editorial-intro]");
      await expect(intro).toHaveCSS("background-color", "rgb(245, 236, 221)");
      const rect = await intro.boundingBox();
      expect(rect?.x).toBe(0);
      expect(rect?.width).toBe(width);
      const crumbLabel = path === "/cocktails" ? "Start" : path === "/kontakt" ? "Home" : "Startseite";
      const crumb = main.getByRole("navigation", { name: "Brotkrumennavigation" }).getByRole("link", { name: crumbLabel, exact: true });
      await expect(crumb).toHaveAttribute("href", "/");
      await crumb.focus();
      await expect(crumb).toBeFocused();
      await expect(crumb).toHaveCSS("outline-style", "solid");
      expect((await crumb.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect((await crumb.boundingBox())!.width).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      mkdirSync(proof, { recursive: true });
      await intro.screenshot({ path: `${proof}/intro-${path.slice(1)}-${width}.png` });
    });
  }

  test(`brands retain six full original posters in a readable dark world at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/eigenmarke");
    const collection = page.locator('[data-collection="brands"]');
    await expect(collection).toHaveCSS("background-color", "rgb(33, 30, 28)");
    for (const heading of await collection.locator("h2").all()) {
      await expect(heading).toHaveCSS("color", "rgb(246, 235, 221)");
      await expect(heading).toHaveCSS("font-weight", "700");
    }
    // All images, including the unchanged group motif, must decode and remain uncropped.
    await expect(collection.locator("img")).toHaveCount(7);
    for (const slug of brands) {
      const article = collection.locator(`#${slug}`);
      await expect(article).toHaveCount(1);
      await expect(article.locator("img")).toHaveAttribute("src", `/images/eigenmarken/${slug}.png`);
    }
    for (const image of await collection.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await image.evaluate(node => (node as HTMLImageElement).decode());
      await expect(image).toHaveCSS("object-fit", "contain");
    }
    // The group has an optimized Next URL; verify its original source without depending on that encoding.
    expect(await collection.locator("section img").first().evaluate(node => new URL((node as HTMLImageElement).src).searchParams.get("url"))).toBe("/images/eigenmarken-scenes/group-dark-v1.webp");
    const academy = collection.getByRole("link", { name: /Alle Kurse der Getränkeakademie/ });
    await expect(academy).toHaveCSS("color", "rgb(246, 235, 221)");
    await academy.focus();
    await expect(academy).toHaveCSS("outline-color", "rgb(254, 224, 5)");
    expect((await academy.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    mkdirSync(proof, { recursive: true });
    await page.locator("main [data-editorial-intro]").screenshot({ path: `${proof}/intro-eigenmarke-${width}.png` });
    await collection.locator("section").first().screenshot({ path: `${proof}/brands-group-${width}.png` });
    await collection.locator("#pralle-kirsche").screenshot({ path: `${proof}/brands-first-${width}.png` });
    await collection.locator("#weisser-engel").screenshot({ path: `${proof}/brands-last-${width}.png` });
  });
}

test("selected collection chapters are warm while offer originals remain on white", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of ["/marktleben", "/geschenkideen", "/regionale-spirituosen"]) {
    await page.goto(route);
    const chapter = page.locator('[data-collection] > section').first();
    await expect(chapter).toHaveCSS("background-color", "rgb(245, 236, 221)");
    await expect(chapter.locator("h2").first()).toHaveCSS("font-weight", "700");
    mkdirSync(proof, { recursive: true });
    await chapter.screenshot({ path: `${proof}/chapter-${route.slice(1)}-1440.png` });
  }
  await page.goto("/produkte");
  for (const image of await page.locator('[data-offer-id] img').all()) {
    await expect(image).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(image).toHaveCSS("object-fit", "contain");
  }
});

test("legal intro keeps the existing narrow reading alignment inside its full-width surface", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/impressum");
  const intro = page.locator("main [data-editorial-intro]");
  await expect(intro).toHaveCSS("background-color", "rgb(245, 236, 221)");
  expect((await intro.boundingBox())!.width).toBe(1440);
  const title = await intro.locator("h1").boundingBox();
  const bodyHeading = await page.locator('[data-service="legal"] h2').first().boundingBox();
  expect(Math.abs(title!.x - bodyHeading!.x)).toBeLessThan(1);
  expect(title!.x).toBeGreaterThan(300);
  mkdirSync(proof, { recursive: true });
  await page.screenshot({ path: `${proof}/legal-impressum-1440.png` });
});

async function familyCapture(page: Page, name: string, target: Locator = page.locator("main")) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  mkdirSync(familyProof, { recursive: true });
  await target.screenshot({ path: `${familyProof}/${name}.png` });
}

async function familyReady(page: Page, route: string) {
  await page.goto(route);
  // Match the established family suites: do not click server-rendered controls before their client is ready.
  await page.waitForLoadState("networkidle");
}

for (const width of [360, 390, 768, 1440]) {
  // These catch lost family heading rules and warm panels without recoloring reading interiors.
  test(`task2 learning hierarchy keeps recipe and lesson interiors calm at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await familyReady(page, "/cocktails/pi-a-colada");
    await expect(page.locator("#recipe-ingredients")).toHaveCSS("font-weight", "700");
    await expect(page.locator('[aria-labelledby="recipe-ingredients"]')).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(page.getByText("Public domain", { exact: false }).first()).toBeVisible();
    await familyCapture(page, `recipe-${width}`);
    await familyReady(page, "/akademie/mineralwasser");
    const lesson = page.getByRole("region", { name: "Lektion", exact: true });
    await expect(lesson.locator("h2")).toHaveCSS("font-weight", "700");
    await expect(lesson).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(page.locator('[aria-label="Lektionsfortschritt"]').locator("..")).toHaveCSS("background-color", "rgb(245, 236, 221)");
    const exam = page.getByRole("button", { name: /Abschlusstest/ }).first();
    await expect(exam).toBeDisabled();
    const quiz = page.getByRole("region", { name: "Wissensquiz" });
    const correct = courses.find(course => course.slug === "mineralwasser")!.lessons[0].quiz[0].correct;
    await quiz.getByRole("button").filter({ hasText: /^[A-Z]\./ }).nth((correct + 1) % 4).click();
    await expect(quiz.locator('[data-state="wrong"]')).toHaveCSS("background-color", "rgb(255, 243, 243)");
    await expect(quiz.locator('[data-state="correct"]')).toHaveCSS("color", "rgb(20, 83, 45)");
    for (const answer of await quiz.locator("button[data-state]").all()) await expect(answer).toBeDisabled();
    await familyCapture(page, `academy-feedback-${width}`, lesson);
    const longLesson = courses.find(course => course.slug === "mineralwasser")!.lessons.at(-1)!;
    await page.getByRole("navigation", { name: "Kurslektionen" }).getByRole("button", { name: new RegExp(longLesson.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
    await expect(lesson.locator("h2")).toHaveText(longLesson.title);
    expect((await lesson.locator("h2").boundingBox())!.width).toBeLessThanOrEqual((await lesson.boundingBox())!.width);
    await familyCapture(page, `academy-long-lesson-${width}`, lesson);
    await familyReady(page, "/kategorie/bier");
    const entry = page.locator("aside[data-academy-context]");
    await expect(entry).toHaveCSS("background-color", "rgb(245, 236, 221)");
    await expect(entry.locator("h2")).toHaveCSS("font-weight", "700");
    await expect(entry.getByRole("link").first()).toHaveAttribute("href", "/akademie/bier");
    await familyCapture(page, `academy-entry-${width}`, entry);
  });

  test(`task2 giveaway hierarchy preserves full original covers at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await familyReady(page, "/gewinnspiel");
    await expect(page.locator("#agenda-heading")).toHaveCSS("font-weight", "700");
    const card = page.locator("#jahresagenda [data-giveaway-id]").first();
    await expect(card.locator("h3")).toHaveCSS("font-weight", "700");
    await expect(card.locator("h3").locator("..")).toHaveCSS("background-color", "rgb(245, 236, 221)");
    const cover = card.locator("img");
    await cover.scrollIntoViewIfNeeded();
    await expect.poll(() => cover.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(cover).toHaveCSS("object-fit", "contain");
    const ratios = await cover.evaluate((node: HTMLImageElement) => ({ natural: node.naturalWidth / node.naturalHeight, shown: node.clientWidth / node.clientHeight }));
    expect(ratios.shown).toBeCloseTo(ratios.natural, 2);
    await expect(card.getByRole("link").first()).toHaveAttribute("href", /^https:\/\/www.instagram.com\//);
    await expect(card.locator("time")).toHaveAttribute("datetime", /^2026-/);
    await familyCapture(page, `giveaway-original-${width}`, card);
  });

  test(`task2 rental warm framing preserves errors disabled controls and drawer at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/**", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
    await familyReady(page, "/vermietung");
    const dates = page.locator('[aria-labelledby="rental-dates"]');
    await expect(dates.locator("h2")).toHaveCSS("font-weight", "700");
    await expect(dates).toHaveCSS("background-color", "rgb(245, 236, 221)");
    await expect(dates.locator("input").first()).toHaveCSS("background-color", "rgb(255, 255, 255)");
    const article = page.locator('article[data-rental-name="Kühlanhänger"]');
    const decrease = article.getByRole("button", { name: /verringern/ });
    await expect(decrease).toBeDisabled();
    await expect(decrease).toHaveCSS("opacity", "0.55");
    await article.getByRole("spinbutton").fill("999");
    const error = article.getByRole("alert");
    await expect(error).toBeVisible();
    await expect(error).toHaveCSS("background-color", "rgb(255, 246, 245)");
    await expect(error).toHaveCSS("color", "rgb(165, 21, 34)");
    await familyCapture(page, `rental-quantity-error-${width}`, article);
    await article.getByRole("spinbutton").fill("1");
    await page.getByLabel("Gewünschte Abholung").fill("2026-10-12");
    await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-11");
    await expect(dates.getByRole("alert")).toContainText("gültigen Zeitraum");
    await expect(page.getByRole("button", { name: "In den Warenkorb", exact: true })).toBeDisabled();
    await familyCapture(page, `rental-date-error-${width}`, dates);
    await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-14");
    await page.getByRole("button", { name: "In den Warenkorb", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Dein Mietwarenkorb", exact: true });
    await expect(drawer.locator("h2")).toHaveCSS("font-weight", "700");
    await expect(drawer).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(drawer).toContainText("150,00");
    await drawer.getByRole("button", { name: /Menge für Kühlanhänger erhöhen/ }).click();
    await expect(drawer).toContainText("300,00");
    await familyCapture(page, `rental-drawer-${width}`, drawer);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await familyReady(page, "/bewerbung");
    await expect(page.getByText("Der Online-Upload ist zurzeit nicht verfügbar.", { exact: false })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    const posters = page.locator('main a[aria-label$="vollständige Anzeige öffnen"] img');
    await expect(posters).toHaveCount(3);
    for (const poster of await posters.all()) await expect(poster).toHaveCSS("object-fit", "contain");
    await familyCapture(page, `career-disabled-${width}`);
  });

  test(`task2 active tools retain choices litres errors and game keyboard behavior at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await familyReady(page, "/finder");
    const finder = page.getByRole("button", { name: /Bierfinder/ });
    await expect(finder.locator("h2")).toHaveCSS("font-weight", "700");
    await expect(finder).toHaveCSS("background-color", "rgb(245, 236, 221)");
    await finder.click();
    for (const name of ["Pils – herb & frisch", "Keine Präferenz", "Feierabendbier"]) await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator("[data-product-card]").first()).toBeVisible();
    await familyCapture(page, `finder-results-${width}`);
    await familyReady(page, "/partyplaner");
    const calculate = page.getByRole("button", { name: "Berechnen", exact: true });
    await calculate.click();
    const results = page.getByRole("region", { name: "Dein Getränkebedarf" });
    await expect(results.locator("h2")).toHaveCSS("font-weight", "700");
    await expect(results).toHaveCSS("background-color", "rgb(245, 236, 221)");
    await expect(results.locator("dd")).toHaveText(["33 l", "8 l", "10 l", "0,8 l", "20 l"]);
    await familyCapture(page, `planner-results-${width}`);
    await page.locator("#party-beerDrinkers").fill("0");
    await expect(calculate).toBeDisabled();
    await expect(page.locator("main").getByRole("alert")).toContainText("100%");
    await expect(page.locator("#party-beerDrinkers")).toHaveAttribute("aria-invalid", "true");
    await familyCapture(page, `planner-error-${width}`);
    await familyReady(page, "/partyspiele");
    const launcher = page.getByRole("button", { name: /Bier-Pong Scoreboard/ });
    await launcher.click();
    const dialog = page.getByRole("dialog", { name: "Bier-Pong Scoreboard" });
    await expect(dialog.locator("h2")).toHaveCSS("font-weight", "700");
    await expect(dialog.getByRole("checkbox", { name: "Alkoholfrei" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("button", { name: "Teile dieses Spiel" })).toBeFocused();
    await page.keyboard.press("Tab");
    await dialog.getByRole("button", { name: "Treffer!", exact: true }).first().click();
    await expect(dialog.getByText("Becher übrig: 9", { exact: true })).toBeVisible();
    await familyCapture(page, `game-dialog-${width}`, dialog);
    await page.keyboard.press("Escape");
    await expect(launcher).toBeFocused();
  });

  test(`task2 Dutch hierarchy wraps with orange accents and readable dark service at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await familyReady(page, "/nl");
    const title = page.locator("#nl-title");
    await expect(title).toHaveCSS("font-weight", "800");
    await expect(title.locator("span")).toHaveCSS("color", "rgb(165, 65, 8)");
    await expect(title.locator("..").locator("..")).toHaveCSS("background-color", "rgb(245, 236, 221)");
    expect(await title.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    if (width === 360) expect((await title.boundingBox())!.height).toBeGreaterThan(80);
    for (const heading of await page.locator("#bezoek h2, #service h2, #contact h2, #nl-brands-title").all()) await expect(heading).toHaveCSS("font-weight", "700");
    await expect(page.locator("#service h2")).toHaveCSS("color", "rgb(246, 235, 221)");
    await expect(page.locator("#service h3").first()).toHaveCSS("font-weight", "700");
    await expect(page.locator('section[aria-labelledby="nl-brands-title"] img')).toHaveCSS("object-fit", "contain");
    await page.getByRole("link", { name: "Je bezoek", exact: true }).click();
    await expect(page).toHaveURL(/#bezoek$/);
    await expect(page.locator('#bezoek [data-brand-link="maps"]')).toBeVisible();
    await page.getByText("Maak kennis met ons team", { exact: false }).click();
    await expect(page.getByText("Onze nieuwe teamfoto volgt", { exact: true })).toBeVisible();
    await familyCapture(page, `nl-hierarchy-${width}`);
    await familyCapture(page, `nl-hero-${width}`, page.locator('section[aria-labelledby="nl-title"]'));
    await familyCapture(page, `nl-dark-service-${width}`, page.locator("#service"));
  });
}

test("task2 legal measure and 200 percent reflow preserve readable surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/impressum", "/datenschutz", "/agb"]) {
    await familyReady(page, route);
    const legal = page.locator('[data-service="legal"]');
    await expect(legal.locator("h2").first()).toHaveCSS("font-weight", "700");
    await expect(legal).toHaveCSS("line-height", "29.6px");
    expect((await legal.boundingBox())!.width).toBeLessThan(900);
    await familyCapture(page, `legal-${route.slice(1)}-1440`);
  }
  for (const route of ["/akademie/whiskey", "/vermietung", "/partyplaner", "/nl"]) {
    await familyReady(page, route);
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    await expect(page.locator("main h1")).toBeVisible();
    await familyCapture(page, `reflow-200-${route.slice(1).replaceAll("/", "-")}`);
  }
});

test("task2 academy overview editorial benefits retain the stronger section hierarchy", async ({ page }) => {
  await familyReady(page, "/akademie");
  for (const name of ["In deinem Tempo", "Besser einkaufen", "Mehr genießen"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCSS("font-weight", "700");
  }
});

for (const route of ["/cocktails", "/gewinnspiel", "/kategorie/bier", "/finder", "/geschenkideen", "/regionale-spirituosen", "/marktleben"]) {
  test(`task2 warm-card links meet normal-text contrast on ${route}`, async ({ page }) => {
    await familyReady(page, route);
    const collectionLinks: Record<string, string[]> = {
      "/geschenkideen": ["Im Markt beraten lassen"],
      "/regionale-spirituosen": ["Persönlich beraten lassen", "Jammers-Eigenmarken entdecken", "Geschenkideen ansehen"],
      "/marktleben": ["Unsere Eigenmarken entdecken", "Kontakt zum Markt", "Anfahrt und Kontakt", "Team kennenlernen", "Sortiment entdecken"],
    };
    if (collectionLinks[route]) {
      const anchors = page.locator('[data-collection] > section a:not([data-brand-link]):not(:has(img))');
      await expect(anchors).toHaveCount(collectionLinks[route].length);
      expect(await anchors.allTextContents()).toEqual(collectionLinks[route]);
      for (const anchor of await anchors.all()) await expect(anchor).toHaveCSS("color", "rgb(165, 21, 34)");
    }
    const result = await new AxeBuilder({ page }).include("main").withRules(["color-contrast"]).analyze();
    expect(result.violations).toEqual([]);
  });
}

test("[fixture] synthetic weekly offers preserve Sunday empty, refresh ordering and expiry", async ({ page }) => {
  await familyReady(page, "/test-fixtures/weekly-offers");
  await expect(page.getByRole("heading", { name: "Isolierte Wochenangebote-Fixture", exact: true })).toBeVisible();
  await expect(page.locator("[data-offer-id]")).toHaveCount(0);
  await page.getByRole("button", { name: "Montag aktivieren", exact: true }).click();
  await expect(page.locator('[data-offer-id="synthetic-monday-original"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Ältere Antwort anfordern", exact: true }).click();
  await expect(page.getByRole("button", { name: "Antwort 1 abschließen", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Neuere Antwort anfordern", exact: true }).click();
  await expect(page.getByRole("button", { name: "Antwort 2 abschließen", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Antwort 2 abschließen", exact: true }).click();
  await expect(page.locator('[data-offer-id="synthetic-monday-latest"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Antwort 1 abschließen", exact: true }).click();
  await expect(page.locator('[data-offer-id="synthetic-monday-latest"]')).toHaveCount(1);
  await expect(page.locator('[data-offer-id="synthetic-monday-original"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Nach Wochenablauf", exact: true }).click();
  await expect(page.locator("[data-offer-id]")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "kein passendes Einzelangebot" })).toBeVisible();
});
