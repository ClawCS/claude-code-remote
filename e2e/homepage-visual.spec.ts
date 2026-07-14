import { mkdirSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 360, height: 844 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 1024 },
  { width: 1440, height: 900 },
  { width: 2560, height: 1440 },
] as const;

async function settleReviewImages(
  page: Page,
  viewportHeight: number,
): Promise<void> {
  await page.locator("img").evaluateAll((images) => {
    for (const image of images) {
      if (image instanceof HTMLImageElement) image.loading = "eager";
    }
  });

  const scrollHeight = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  const step = Math.max(1, Math.floor(viewportHeight * 0.75));
  for (let top = 0; top < scrollHeight; top += step) {
    await page.evaluate((scrollTop) => window.scrollTo(0, scrollTop), top);
    await page.waitForTimeout(20);
  }

  await page.waitForFunction(
    () =>
      Array.from(document.images).every(
        (image) =>
          image.complete &&
          image.naturalWidth > 0 &&
          getComputedStyle(image).backgroundImage === "none",
      ),
    undefined,
    { timeout: 15_000 },
  );
  await page.evaluate(async () => {
    await Promise.all(
      Array.from(document.images, (image) => image.decode().catch(() => undefined)),
    );
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(100);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("cookie-consent", "declined");
  });
});

for (const viewport of viewports) {
  test(`${viewport.width}x${viewport.height} has no overflow and stores a full-page review image`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const geometry = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (viewport.width <= 390) {
      const h1 = await page.getByRole("heading", { level: 1 }).boundingBox();
      const cta = await page
        .locator('[data-hero="cinematic"]')
        .getByRole("link", { name: /WhatsApp/ })
        .boundingBox();
      const heroImage = await page
        .locator('[data-hero="cinematic"] img')
        .boundingBox();
      expect(h1 && h1.y + h1.height).toBeLessThan(viewport.height);
      expect(cta && cta.y + cta.height).toBeLessThan(viewport.height);
      expect(heroImage && heroImage.y).toBeLessThan(viewport.height);
    }
    await settleReviewImages(page, viewport.height);
    mkdirSync("audit/screenshots/cinematic-production", { recursive: true });
    await page.screenshot({
      animations: "disabled",
      caret: "hide",
      fullPage: true,
      path: `audit/screenshots/cinematic-production/home-${viewport.width}x${viewport.height}.png`,
    });
  });
}

test("360px facts occupy separate rows without collisions", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 });
  await page.goto("/");
  const boxes = await page
    .locator('[data-hero="cinematic"] dl > div')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect()),
    );
  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index].top).toBeGreaterThanOrEqual(boxes[index - 1].bottom);
  }
});
