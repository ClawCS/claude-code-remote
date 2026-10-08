import { expect, test } from "@playwright/test";

test("keeps the mobile menu clear when shared social-link styles load after header styles", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const header = page.locator("[data-cinematic-header]");
  const whatsapp = header.getByRole("link", { name: "Per WhatsApp schreiben", exact: true, includeHidden: true });

  // Reproduce the original cascade failure: a reusable link's single-class
  // display rule arrives after the header CSS during route/style loading.
  await whatsapp.evaluate((element) => element.classList.add("late-social-link-base"));
  await page.addStyleTag({ content: ".late-social-link-base { display: inline-flex; }" });

  await expect(whatsapp).toBeHidden();
  const menu = header.getByRole("button", { name: "Menü öffnen", exact: true });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(header.getByRole("navigation", { name: "Mobile Navigation", exact: true })).toBeVisible();
});

test("retains the social icon at the wide desktop breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const header = page.locator("[data-cinematic-header]");
  await expect(header.getByRole("link", { name: "Per WhatsApp schreiben", exact: true })).toBeVisible();
  await expect(header.getByRole("button", { name: "Menü öffnen", exact: true })).toBeHidden();
});
