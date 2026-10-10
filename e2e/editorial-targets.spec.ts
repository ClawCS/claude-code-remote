import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("short breadcrumb labels retain a 44 by 44 pixel click target", async ({ page }) => {
  // Exercise the production CSS against the breadcrumb primitive's DOM shape.
  // Keep browser layout checks in E2E; the PageIntro renderer is covered in Vitest.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent('<nav class="breadcrumbs" aria-label="Brotkrumennavigation"><ol><li><a href="/nl">NL</a></li><li><span aria-current="page">Besuch</span></li></ol></nav>');
  await page.addStyleTag({ content: readFileSync("components/editorial/editorial.module.css", "utf8") });
  const link = page.getByRole("link", { name: "NL", exact: true });
  await expect(link).toHaveAttribute("href", "/nl");
  const box = await link.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
});
