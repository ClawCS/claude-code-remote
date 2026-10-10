import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const proof = process.env.AUDIT_SCREENSHOT_DIR ?? ".superpowers/sdd/2026-10-10-sitewide-filmisch/screenshots";

for (const width of [390, 768, 1440]) {
  for (const path of ["/", "/nl"]) {
    test(`${path} editorial landing at ${width}px preserves originals, anchors and visit controls`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      const root = path === "/" ? page.locator("[data-cinematic-root]") : page.locator("main").locator("..");
      await expect(root).toHaveCSS("background-color", "rgb(250, 249, 246)");
      const flyers = page.locator(path === "/" ? "#aktuell article:has([data-flyer-viewer])" : "#handzettel article:has([data-flyer-viewer])");
      await expect(flyers).toHaveCount(2);
      const [de, nl] = await Promise.all([flyers.nth(0).boundingBox(), flyers.nth(1).boundingBox()]);
      expect(de!.width).toBeCloseTo(nl!.width, 0);
      if (width >= 768) expect(de!.y).toBeCloseTo(nl!.y, 0);
      else expect(nl!.y).toBeGreaterThan(de!.y + de!.height);
      for (const flyer of await flyers.all()) {
        await expect(flyer).toHaveCSS("background-color", "rgb(242, 240, 236)");
        await expect(flyer.locator("img")).toHaveCSS("object-fit", "contain");
        const heading = await flyer.locator("h3").boundingBox();
        const cover = await flyer.locator("[data-flyer-cover]").boundingBox();
        if (width >= 1440) expect(heading!.x + heading!.width).toBeLessThanOrEqual(cover!.x);
      }
      const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute("href")!.slice(1)).filter(id => !document.getElementById(id)));
      expect(brokenAnchors).toEqual([]);
      if (path === "/") {
        await expect(page.locator("#service ol, #service dl")).toHaveCount(0);
        const stories = page.locator("[data-market-story]");
        await expect(stories).toHaveCount(3);
        if (width >= 768) {
          const photo = await page.locator('#service [class*="servicePhoto"]').boundingBox();
          const copy = await page.locator('#service [class*="serviceIntro"]').boundingBox();
          expect(photo!.height).toBeLessThanOrEqual(copy!.height + 1);
          const image = await stories.first().locator("img").boundingBox();
          expect(image!.width).toBeGreaterThan(width * .3);
          const second = stories.nth(1);
          expect((await second.locator("img").boundingBox())!.x).toBeGreaterThan((await second.locator("h3").boundingBox())!.x);
        }
        await expect(page.locator("#eigenmarken li a")).toHaveCount(6);
        for (const image of await page.locator("#eigenmarken img").all()) await expect(image).toHaveCSS("object-fit", "contain");
        await expect(page.locator('#menschen a[href="/galerie"]')).toBeVisible();
        await expect(page.locator('#grailbid a[href="https://grailbid.com"]')).toBeVisible();
        await page.locator("#menschen summary").click();
        await expect(page.locator("#menschen figcaption")).toHaveText(["Niko", "Sven", "Jasmin", "Jan Niklas", "Hanna", "Henri", "Hannah"]);
        for (const caption of await page.locator("#menschen figcaption").all()) await expect(caption).toBeVisible();
        await expect(page.getByText("Unser neues Teamfoto folgt", { exact: true })).toBeVisible();
        await page.locator("#menschen summary").click();
      } else {
        await page.getByRole("link", { name: "Je bezoek", exact: true }).click();
        await expect(page).toHaveURL(/#bezoek$/);
        await expect(page.locator('#bezoek [data-brand-link="maps"]')).toBeVisible();
        await page.locator("#contact").scrollIntoViewIfNeeded();
        await expect(page.getByRole("link", { name: "Stuur een WhatsApp-bericht", exact: true })).toBeVisible();
        await page.getByText("Maak kennis met ons team", { exact: false }).click();
        await expect(page.getByText("Onze nieuwe teamfoto volgt", { exact: true })).toBeVisible();
        await page.getByText("Maak kennis met ons team", { exact: false }).click();
      }
      // Load all original images before the full-page evidence capture.
      for (const img of await page.locator("main img").all()) {
        if (!await img.isVisible()) continue;
        await img.scrollIntoViewIfNeeded();
        await expect.poll(() => img.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.evaluate(() => scrollTo(0, 0));
      mkdirSync(proof, { recursive: true });
      await page.screenshot({ path: `${proof}/task2-${path === "/" ? "home" : "nl"}-${width}.png`, fullPage: true });
      if (width === 1440) {
        for (const id of path === "/" ? ["aktuell", "service", "sortiment", "eigenmarken", "menschen", "grailbid"] : ["handzettel", "service", "bezoek"]) {
          await page.locator(`#${id}`).screenshot({ path: `${proof}/task2-${path === "/" ? "home" : "nl"}-${id}-1440.png` });
        }
      }
    });
  }
}

test("[fixture] Dutch long-title and unavailable flyers remain usable in the gated synthetic fixture", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/test-fixtures/weekly-flyer?landing=nl&state=long");
  await expect(page.getByText("Isolierte synthetische Flyer-Fixture", { exact: false })).toBeVisible();
  await expect(page.locator("#handzettel h3")).toContainText("Synthetische Nederlandse weekfolder");
  await page.getByRole("button", { name: "Folder bekijken", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `${proof}/task2-nl-long-390.png`, fullPage: true });
  await page.goto("/test-fixtures/weekly-flyer?landing=nl&state=empty");
  await expect(page.getByText("Verlopen folders worden niet als actuele aanbiedingen getoond.", { exact: false })).toBeVisible();
  await expect(page.locator("[data-flyer-viewer]")).toHaveCount(0);
  await expect(page.getByText("De Nederlandse weekfolder is nog niet beschikbaar.")).toBeVisible();
  await page.screenshot({ path: `${proof}/task2-nl-empty-390.png`, fullPage: true });
});

for (const width of [390, 1440]) {
  test(`the unchanged film plays, pauses and reaches its six-bottle finale at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const film = page.locator("[data-film-playing]");
    const video = film.locator("video");
    await expect(video).not.toHaveAttribute("src");
    await video.scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Film abspielen", exact: true }).click();
    await expect(film).toHaveAttribute("data-film-playing", "true");
    await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).duration)).toBeGreaterThan(14);
    await video.evaluate(el => { (el as HTMLVideoElement).currentTime = 12; });
    await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).currentTime)).toBeGreaterThanOrEqual(12);
    if (width >= 768) await expect(film).toHaveAttribute("data-film-finale", "true");
    await page.getByRole("button", { name: "Film pausieren", exact: true }).click();
    await expect(film).toHaveAttribute("data-film-playing", "false");
    await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).paused)).toBe(true);
    await page.locator('[data-hero="cinematic"]').screenshot({ path: `${proof}/task2-film-finale-${width}.png` });
  });
}
