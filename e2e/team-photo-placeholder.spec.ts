import { expect, test } from "@playwright/test";

const names = ["Niko", "Sven", "Jasmin", "Jan Niklas", "Hanna", "Henri", "Hannah"];

for (const width of [1440, 390]) {
  for (const route of ["/", "/galerie", "/nl"]) {
    test(`team photo placeholder on ${route} at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      if (route === "/nl") await page.getByText("Maak kennis met ons team", { exact: false }).click();
      const team = page.locator(route === "/" ? "#menschen" : route === "/nl" ? 'section[aria-label="Ons team"]' : 'section[aria-labelledby="team-gallery-title"]');
      const placeholder = team.locator("[data-team-photo-placeholder]");
      await expect(placeholder).toHaveCount(1);
      await placeholder.scrollIntoViewIfNeeded();
      await expect(placeholder).toContainText(route === "/nl" ? "Onze nieuwe teamfoto volgt" : "Unser neues Teamfoto folgt");
      await expect(team.locator("figcaption")).toHaveText(names);
      await expect(page.locator('img[src*="team-group"], img[srcset*="team-group"], img[src*="team-gruppenfoto"]')).toHaveCount(0);
      const logo = placeholder.getByRole("img", { name: "Trinkgut Jammers", exact: true });
      await expect(logo).toBeVisible();
      await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      const dimensions = await logo.boundingBox();
      expect(dimensions!.width).toBeGreaterThan(100);
      expect(dimensions!.width).toBeLessThanOrEqual(224);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await placeholder.screenshot({ path: testInfo.outputPath(`team-placeholder-${route === "/" ? "home" : route.slice(1)}-${width}.png`) });
    });
  }
}
