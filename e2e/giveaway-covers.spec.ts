import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

// Default: the July fixture configured by playwright.config.ts. For the separate
// September server set GIVEAWAY_COVERS_FIXTURE=september and PLAYWRIGHT_BASE_URL;
// that server uses CINEMATIC_E2E=1 CINEMATIC_TEST_NOW=2026-09-30T12:00:00.000Z.
// Expectations never depend on the visitor's system clock.
const fixture = process.env.GIVEAWAY_COVERS_FIXTURE ?? "july";
if (!["july", "september"].includes(fixture)) throw new Error("Unknown giveaway cover fixture");
const screenshotDirectory = process.env.AUDIT_SCREENSHOT_DIR
  ? join(process.env.AUDIT_SCREENSHOT_DIR, "giveaway-covers")
  : "audit/screenshots/giveaway-covers-2026-09-30";
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }] as const;

// Independent, source-checked contract: do not import production data to compute expectations.
const originalPosts = [
  { id: "2026-01", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DT0ZAQEDOc9/" },
  { id: "2026-02", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DUQ-IgEjMMv/" },
  { id: "2026-03", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DVWA1xvDN-J/" },
  { id: "2026-04", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DW09zp_jCcO/" },
  { id: "2026-05", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DX81IbTMW-M/" },
  { id: "2026-06", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DZFhvs5s7a7/" },
  { id: "2026-07", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DaSlTlAM1-y/" },
  { id: "2026-08", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DbRH2Tds4dc/" },
  { id: "2026-09", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DcsoYTBMQLJ/" },
  { id: "2026-guinness", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DdQ8_8hsWYB/" },
  { id: "2026-easter", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DWenSq4DHsM/" },
  { id: "2026-faxe", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DXuV2NMDO7e/" },
  { id: "2026-wm", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DZc5M8LMmNG/" },
] as const;
const monthlyIds = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];
// Deliberate publication gate: exact Canva source/export or an explicit operator
// exception is still missing for these four historical post variants.
const pendingCoverIds = new Set(["2026-03", "2026-08", "2026-09", "2026-guinness"]);
const publishedCoverPosts = originalPosts.filter(post => !pendingCoverIds.has(post.id));
const fixtureCurrentIds = fixture === "september" ? ["2026-09", "2026-guinness"] : ["2026-07"];
const fixtureArchiveIds = fixture === "september"
  ? ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-easter", "2026-faxe", "2026-wm"]
  : ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-easter", "2026-faxe", "2026-wm"];

function originalCoverPath(id: string): string {
  return `/images/editorial/canva/giveaway-${id}.webp`;
}

function localImagePath(source: string, pageURL: string): string {
  const imageURL = new URL(source, pageURL);
  expect(imageURL.origin, "cover must be served by this site, not a signed thumbnail host").toBe(new URL(pageURL).origin);
  return imageURL.searchParams.get("url") ?? imageURL.pathname;
}

function collectRuntimeIssues(page: Page): string[] {
  const issues: string[] = [];
  page.on("pageerror", error => issues.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error" || (message.type() === "warning" && /hydrat(?:e|ed|ion)|did not match/i.test(message.text()))) {
      issues.push(`console.${message.type()}: ${message.text()}`);
    }
  });
  return issues;
}

async function expectCompleteOriginalCover(card: Locator, page: Page): Promise<string> {
  const id = await card.getAttribute("data-giveaway-id");
  const originalPost = originalPosts.find(post => post.id === id);
  expect(originalPost, `unknown or fabricated giveaway card: ${id}`).toBeDefined();
  if (!originalPost) throw new Error(`No verified original post for ${id}`);

  if (pendingCoverIds.has(originalPost.id)) {
    await expect(card.locator("img, picture, [data-giveaway-cover]"), `${id}: no unapproved source substitute`).toHaveCount(0);
    await expect(card.locator(`a[href="${originalPost.sourceURL}"]`), `${id}: the original post remains reachable`).toHaveCount(1);
    return originalPost.id;
  }
  await expect(card, `${id}: the action must actually be displayed`).toBeVisible();

  const coverLink = card.locator("a[data-giveaway-cover]");
  await expect(coverLink, `${id} must have its own linked original poster`).toHaveCount(1);
  await expect(coverLink).toBeVisible();
  await expect(coverLink).toHaveAttribute("data-giveaway-cover", originalPost.id);
  await expect(coverLink).toHaveAttribute("href", originalPost.sourceURL);
  await expect(coverLink).toHaveAttribute("target", "_blank");
  expect((await coverLink.getAttribute("rel") ?? "").split(/\s+/), `${id}: protect the new tab`).toContain("noopener");

  const image = coverLink.locator("img");
  await expect(card.locator("img"), `${id}: one complete poster, no substitute thumbnail`).toHaveCount(1);
  await expect(image).toHaveCount(1);
  await expect(image).toHaveAttribute("alt", /\S/);
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) =>
    element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }),
  ), { timeout: 15_000, message: `${id}: the cover must not be hidden or transparent` }).toBe(true);
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => ({
    complete: element.complete,
    hasPixels: element.naturalWidth > 0 && element.naturalHeight > 0,
  })), { timeout: 15_000, message: `${id}: original cover must load real pixels` })
    .toEqual({ complete: true, hasPixels: true });
  await image.evaluate((element: HTMLImageElement) => element.decode());

  const geometry = await image.evaluate((element: HTMLImageElement) => {
    const box = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    const clippedBy: string[] = [];
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      const ancestorStyles = getComputedStyle(ancestor);
      const bounds = ancestor.getBoundingClientRect();
      const clipsX = /hidden|clip|auto|scroll/.test(ancestorStyles.overflowX);
      // The root scrolling element is the viewport, not a permanently cropped
      // image wrapper. Normal document scrolling must not fail this contract.
      const clipsY = ancestor !== document.scrollingElement && /hidden|clip|auto|scroll/.test(ancestorStyles.overflowY);
      if (ancestorStyles.clipPath !== "none" || ancestorStyles.maskImage !== "none" || ancestorStyles.clip !== "auto") {
        clippedBy.push(`${ancestor.tagName}: clip/mask effect`);
      }
      if ((clipsX && (box.left < bounds.left - 1 || box.right > bounds.right + 1)) ||
        (clipsY && (box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1))) {
        clippedBy.push(ancestor.tagName);
      }
    }
    return {
      currentSrc: element.currentSrc,
      width: box.width,
      height: box.height,
      declaredWidth: Number(element.getAttribute("width")),
      declaredHeight: Number(element.getAttribute("height")),
      natural: element.naturalWidth / element.naturalHeight,
      displayed: box.width / box.height,
      objectFit: styles.objectFit,
      clippedBy,
    };
  });
  const expectedPath = originalCoverPath(originalPost.id);
  expect(localImagePath(await image.getAttribute("src") ?? "", page.url()), `${id}: declared source`).toBe(expectedPath);
  expect(localImagePath(geometry.currentSrc, page.url()), `${id}: loaded source`).toBe(expectedPath);
  expect(geometry.width, `${id}: displayed width`).toBeGreaterThan(0);
  expect(geometry.height, `${id}: displayed height`).toBeGreaterThan(0);
  expect(geometry.declaredWidth, `${id}: intrinsic width declared`).toBeGreaterThan(0);
  expect(geometry.declaredHeight, `${id}: intrinsic height declared`).toBeGreaterThan(0);
  expect(geometry.declaredWidth / geometry.declaredHeight, `${id}: declaration preserves original proportions`).toBeCloseTo(geometry.natural, 2);
  expect(geometry.displayed, `${id}: displayed poster is uncropped and unstretched`).toBeCloseTo(geometry.natural, 2);
  expect(["contain", "fill", "scale-down"], `${id}: no cover cropping`).toContain(geometry.objectFit);
  expect(geometry.clippedBy, `${id}: no ancestor may clip away poster edges`).toEqual([]);
  return originalPost.id;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const geometry = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(geometry.document, "document must fit the viewport").toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.body, "body must fit the viewport").toBeLessThanOrEqual(geometry.viewport);
  const clipped = await page.locator("main [data-giveaway-id], main [data-month], main [data-giveaway-cover], main [data-giveaway-cover] img").evaluateAll(elements =>
    elements.filter(element => {
      if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
      const box = element.getBoundingClientRect();
      return box.left < -1 || box.right > document.documentElement.clientWidth + 1;
    }).map(element => ({ tag: element.tagName, id: element.getAttribute("data-giveaway-id") ?? element.getAttribute("data-giveaway-cover") })),
  );
  expect(clipped, "giveaway cards and complete covers must not overflow horizontally").toEqual([]);
}

async function saveElementScreenshot(locator: Locator, name: string, testInfo: TestInfo): Promise<void> {
  const path = join(screenshotDirectory, `${name}.png`);
  await locator.screenshot({ path, animations: "disabled", caret: "hide" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

async function saveAgendaScreenshots(page: Page, viewportName: string, testInfo: TestInfo): Promise<void> {
  await page.locator("#jahresagenda").evaluate(element => {
    const headerHeight = document.querySelector("[data-cinematic-header]")?.getBoundingClientRect().height ?? 0;
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - headerHeight - 16);
  });
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const name = `agenda-top-row-${viewportName}`;
  const path = join(screenshotDirectory, `${name}.png`);
  await page.screenshot({ path, animations: "disabled", caret: "hide" });
  await testInfo.attach(name, { path, contentType: "image/png" });
  for (const id of ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]) {
    await saveElementScreenshot(page.locator(`#jahresagenda [data-giveaway-id="${id}"]`), `agenda-${id}-${viewportName}`, testInfo);
  }
  if (await page.locator("#aktuell [data-giveaway-id]").count()) {
    await saveElementScreenshot(page.locator("#aktuell"), `overview-active-actions-${viewportName}`, testInfo);
  }
}

test("all nine source-approved covers serve valid, distinct local WebP assets; four unresolved variants stay unpublished", async ({ request }) => {
  const originals = await Promise.all(publishedCoverPosts.map(async post => {
    const response = await request.get(originalCoverPath(post.id));
    expect(response.status(), `${post.id}: original local cover exists`).toBe(200);
    expect(response.headers()["content-type"], `${post.id}: real WebP content`).toMatch(/^image\/webp(?:;|$)/);
    const bytes = await response.body();
    expect(bytes.subarray(0, 4).toString("ascii"), `${post.id}: WebP RIFF signature`).toBe("RIFF");
    expect(bytes.subarray(8, 12).toString("ascii"), `${post.id}: WebP format signature`).toBe("WEBP");
    return { id: post.id, hash: createHash("sha256").update(bytes).digest("hex") };
  }));
  expect(new Set(originals.map(original => original.hash)).size, "each giveaway must retain its own motif, not identical copied bytes").toBe(9);
  for (const id of pendingCoverIds) {
    expect((await request.get(originalCoverPath(id))).status(), `${id}: do not publish privately prepared, unapproved originals`).toBe(404);
  }
});

for (const viewport of viewports) {
  test(`original giveaway covers stay complete, linked and accessible at ${viewport.width}px`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const runtimeIssues = collectRuntimeIssues(page);
    const seenIds = new Set<string>();
    const viewportName = `${viewport.width}x${viewport.height}`;
    mkdirSync(screenshotDirectory, { recursive: true });

    for (const route of ["/gewinnspiel#jahresagenda", "/gewinnspiel/archiv", "/"] as const) {
      await test.step(route, async () => {
        const response = await page.goto(route, { waitUntil: "domcontentloaded" });
        expect(response?.status(), route).toBe(200);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.getByRole("main")).toHaveCount(1);

        if (route === "/gewinnspiel#jahresagenda") {
          const agenda = page.locator("#jahresagenda");
          await expect(agenda.locator("article")).toHaveCount(12);
          expect(await agenda.locator("[data-giveaway-id]").evaluateAll(elements => elements.map(element => element.getAttribute("data-giveaway-id"))))
            .toEqual(monthlyIds);
          await expect(agenda.locator("[data-giveaway-cover]")).toHaveCount(6);
          expect(await page.locator("#aktuell [data-giveaway-id]").evaluateAll(elements => elements.map(element => element.getAttribute("data-giveaway-id"))).then(ids => ids.sort()))
            .toEqual([...fixtureCurrentIds].sort());
          for (const month of [10, 11, 12]) {
            const pending = agenda.locator(`[data-month="${month}"]`);
            await expect(pending).toHaveCount(1);
            await expect(pending.getByRole("heading", { name: "Noch nicht angekündigt", exact: true })).toBeVisible();
            await expect(pending.locator("img, picture, [data-giveaway-cover]")).toHaveCount(0);
            await expect(pending.locator('a[href*="instagram.com"]')).toHaveCount(0);
            const fabricatedVisuals = await pending.evaluate(element => [element, ...element.querySelectorAll("*")].filter(node =>
              getComputedStyle(node).backgroundImage !== "none" || ["::before", "::after"].some(pseudo => getComputedStyle(node, pseudo).backgroundImage !== "none"),
            ).length);
            expect(fabricatedVisuals, `month ${month}: no invented background poster`).toBe(0);
          }
        }

        const cards = page.locator("main [data-giveaway-id]");
        const visibleIds: string[] = [];
        for (const card of await cards.all()) {
          const id = await expectCompleteOriginalCover(card, page);
          visibleIds.push(id);
          seenIds.add(id);
        }
        if (route !== "/gewinnspiel#jahresagenda") {
          expect(new Set(visibleIds).size, `${route}: no duplicate action cards`).toBe(visibleIds.length);
          expect([...visibleIds].sort(), `${route}: the fixture's actions must not disappear`)
            .toEqual([...(route === "/" ? fixtureCurrentIds : fixtureArchiveIds)].sort());
        }
        if (route === "/") {
          await expect(page.locator("[data-home-giveaways]"), "homepage must display its current action covers").toHaveCount(1);
          await expect(page.locator("[data-home-giveaways] [data-giveaway-cover]")).toHaveCount(fixture === "september" ? 0 : 1);
        }
        await expectNoHorizontalOverflow(page);

        if (route === "/gewinnspiel#jahresagenda") await saveAgendaScreenshots(page, viewportName, testInfo);
        if (route === "/" && await page.locator("[data-home-giveaways]").count()) {
          await saveElementScreenshot(page.locator("[data-home-giveaways]"), `home-active-actions-${viewportName}`, testInfo);
        }

        const accessibility = await new AxeBuilder({ page }).analyze();
        expect.soft(accessibility.violations.filter(({ impact }) => impact === "serious" || impact === "critical"), `${route}: serious/critical accessibility issues`).toEqual([]);
      });
    }
    expect([...seenIds].sort(), "the explicit fixture must expose all expected source-backed actions")
      .toEqual(originalPosts.filter(post => fixture === "september" || post.id !== "2026-guinness").map(post => post.id).sort());
    expect.soft(runtimeIssues, "no runtime, console or hydration errors on the three public routes").toEqual([]);
  });
}
