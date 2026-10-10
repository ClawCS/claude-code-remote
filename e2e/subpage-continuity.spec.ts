import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { SITEWIDE_DESIGN_CASES } from "./sitewide-design-cases";

const proof = ".superpowers/subpage-continuity-2026-10-10/task-1";
const introCases = SITEWIDE_DESIGN_CASES.filter(item => ["/produkte", "/marktleben", "/cocktails", "/kontakt"].includes(item.path));
const brands = ["pralle-kirsche", "dicke-nuesse", "suesse-suende", "caramello", "schwarzer-teufel", "weisser-engel"];

test.describe.configure({ mode: "parallel" });

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
