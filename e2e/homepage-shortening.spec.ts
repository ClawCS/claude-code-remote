import { expect, test } from "@playwright/test";

// A restored teaser, portrait grid or TCG bridge must fail this contract.
// Existing-server runs keep all generated evidence in Playwright's output dir.
test.use({ screenshot: "off", trace: "off" });

const retainedDestinations = [
  ["Marktleben", "/marktleben", "Unser Markt. Nah dran."],
  ["Geschenkideen", "/geschenkideen", "Freude schenken. Mit Jammers."],
  ["Regionale Spezialitäten", "/regionale-spirituosen", "Regional. Besonders. Für dich."],
  ["Cocktail-Rezepte", "/cocktails", "Cocktail-Rezepte"],
  ["Getränkeakademie", "/akademie", "Getränkeakademie"],
  ["Unser Team", "/galerie", "Team Jammers"],
  ["Offene Stellen & Bewerbung", "/karriere", "Dein nächster Schritt. Bei Jammers."],
] as const;

for (const width of [390, 1440]) {
  test(`short homepage preserves its core chapters without removed blocks at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    const main = page.getByRole("main");

    await expect(main.locator("#menschen, #grailbid, [data-market-discoveries], [data-market-story], aside[aria-label='Getränkeakademie']")).toHaveCount(0);
    await expect(main.locator('a[href="/marktleben"], a[href="/geschenkideen"], a[href="/regionale-spirituosen"], a[href="/akademie"], a[href="/cocktails"], a[href="/galerie"]')).toHaveCount(0);
    await expect(main.locator('img[src*="team-"], img[srcset*="team-"], img[src*="verkostung-moritz-fiege"], img[src*="gift-basket"], img[src*="regional-tante-dele"]')).toHaveCount(0);
    await expect(page.locator('a[href*="grailbid"], a[href="#menschen"], a[href="#grailbid"]')).toHaveCount(0);
    expect(await page.locator("body").innerText()).not.toMatch(/GrailBid|Trading Cards|\bTCG\b/i);

    await expect(main.locator("h1, h2")).toHaveText([
      /^Goch\s*schenkt ein\.$/,
      /^Deine Woche\.\s*Ein guter Einkauf\.$/,
      /^Deine Feier\.\s*Unsere Ausstattung\.$/,
      "Für jeden Geschmack.",
      /^Sechs eigene\s*Charaktere\.$/,
      "Gewinnspiele & Aktionen",
      "Jammers auf Instagram",
    ]);
    expect(await main.locator(":scope > section").evaluateAll(sections => sections.map(section => section.getAttribute("data-hero") === "cinematic" ? "hero" : section.id || "instagram")))
      .toEqual(["hero", "aktuell", "service", "sortiment", "eigenmarken", "aktionen", "instagram"]);
    await expect(main.locator('[data-hero="cinematic"] video')).toHaveAttribute("poster", "/images/home/jammers-film-poster-62abe3860959351d.webp");
    await expect(main.locator('[data-hero="cinematic"] a[href="#aktuell"]')).toBeVisible();
    await expect(main.locator('[data-hero="cinematic"] a[href="#service"]')).toBeVisible();
    await expect(main.locator("[data-quick-entry]")).toHaveCount(3);
    await expect(main.locator("#sortiment [data-category]")).toHaveCount(4);
    await expect(main.locator("#eigenmarken [data-own-brand-stage] img")).toHaveCount(6);

    const current = await page.request.get("/api/content/current");
    expect(current.ok()).toBe(true);
    const publication = await current.json();
    for (const [flyer, selector] of [[publication.flyer, "[data-current-flyer]"], [publication.nlFlyer, "[data-current-nl-flyer]"]] as const) {
      const card = main.locator(selector);
      await expect(card).toHaveCount(flyer ? 1 : 0);
      if (flyer) {
        await expect(card.getByRole("heading", { level: 3 })).toHaveText(flyer.title);
        await expect(card.locator(`a[href="${flyer.pdfUrl}"]`)).toHaveCount(1);
      }
    }
    if (!publication.flyer) await expect(main.locator("[data-current-fallback]")).toBeVisible();
  });

  test(`removed homepage teasers remain reachable through grouped navigation at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    for (const [label, path, heading] of retainedDestinations) {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const header = page.locator("[data-cinematic-header]");
      if (width < 1152) await header.getByRole("button", { name: "Menü öffnen", exact: true }).click();
      const navigation = header.getByRole("navigation", { name: width < 1152 ? "Mobile Navigation" : "Hauptnavigation", exact: true });
      await navigation.locator("summary").filter({ hasText: "Jammers entdecken" }).click();
      await expect(navigation.locator('a[href*="grailbid"]')).toHaveCount(0);
      const link = navigation.getByRole("link", { name: label, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", path);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible();
      await page.waitForLoadState("networkidle");
    }
    await page.goto("/nl");
    await expect(page.locator('a[href*="grailbid"], aside[aria-label="Trading cards bij GrailBid"]')).toHaveCount(0);
    expect(await page.locator("body").innerText()).not.toMatch(/GrailBid|Trading Cards|\bTCG\b/i);
  });
}
