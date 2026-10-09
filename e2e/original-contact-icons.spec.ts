import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test.describe(`original contact icons at ${viewport.width}px`, () => {
    test.use({ viewport });
    for (const path of ["/", "/nl", "/kontakt", "/community", "/galerie", "/leergut", "/oeko-tracker"]) {
      test(`${path} keeps native artwork, transparent targets and accessible names`, async ({ page }) => {
        await page.goto(path);
        const icons = page.locator('a[href*="wa.me/"], a[href="https://www.instagram.com/trinkgutjammers_goch/"], a[href*="google.com/maps/dir/"]');
        expect(await icons.count()).toBeGreaterThan(0);
        for (const link of await icons.all()) {
          if (!await link.isVisible()) continue;
          await link.scrollIntoViewIfNeeded();
          await expect(link).toHaveAttribute("aria-label", /.+/);
          await expect(link).toHaveAttribute("target", "_blank");
          await expect(link).toHaveAttribute("rel", "noopener noreferrer");
          await expect(link).toHaveText("");
          await expect(link).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
          await expect(link).toHaveCSS("border-top-width", "0px");
          await expect(link).toHaveCSS("border-bottom-width", "0px");
          await expect(link).toHaveCSS("box-shadow", "none");
          const img = link.locator("img");
          await expect(img).toHaveAttribute("src", /^\/(?:images\/brands\/|_next\/image\?url=%2Fimages%2Fbrands%2F)/);
          await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
          await expect(img).toHaveCSS("filter", "none");
          const box = await link.boundingBox();
          expect(box?.width).toBeGreaterThanOrEqual(48);
          expect(box?.height).toBeGreaterThanOrEqual(48);
          await link.hover();
          await expect(link).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
          await expect(link).toHaveCSS("border-top-width", "0px");
          await expect(img).toHaveCSS("filter", "none");
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      });
    }
  });
}
