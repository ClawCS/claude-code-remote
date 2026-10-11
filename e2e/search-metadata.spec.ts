import { test, expect } from "@playwright/test";
import products from "../data/products.json";

const paths = [
  "/eigenmarke", "/finder", "/partyplaner", "/vermietung", "/galerie", "/community",
  "/gewinnspiel", "/gewinnspiel/archiv", "/merkzettel", "/leergut", "/oeko-tracker",
  "/partyspiele", "/impressum", "/datenschutz", "/agb", "/kontakt", "/angebote",
  "/produkte", "/akademie", "/akademie/zertifikate", "/cocktails", "/marktleben",
  "/geschenkideen", "/regionale-spirituosen", "/nl", "/cocktails/mojito",
  "/cocktails/kategorie/rum", "/kategorie/bier", "/akademie/wein", "/handzettel",
];

for (const path of paths) {
  test(`renders own canonical and matching social metadata: ${path}`, async ({ page }) => {
    test.setTimeout(60_000);
    const response = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
    expect(response?.status()).toBe(200);
    const canonical = `https://trinkgut-jammers.de${path === "/handzettel" ? "/angebote" : path}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", await page.title());
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBeTruthy();
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description!);
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", "https://trinkgut-jammers.de/images/home/cinematic/og-home.jpg");
    if (path === "/merkzettel" || path === "/gewinnspiel/archiv") {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    }
    if (path === "/nl") {
      await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute("href", "https://trinkgut-jammers.de");
      await expect(page.locator('link[rel="alternate"][hreflang="nl"]')).toHaveAttribute("href", "https://trinkgut-jammers.de/nl");
    }
  });
}

test("retired product examples redirect permanently and unknown examples remain 404", async ({ request }) => {
  test.setTimeout(60_000);
  const known = await request.get(`/produkte/${products[0].slug}`, { maxRedirects: 0, timeout: 45_000 });
  expect(known.status()).toBe(308);
  expect(known.headers().location).toBe(`/kategorie/${products[0].categorySlug}`);
  const unknown = await request.get("/produkte/nonexistent-search-example", { maxRedirects: 0, timeout: 45_000 });
  expect(unknown.status()).toBe(404);
});

test("application indexation protection stays unchanged", async ({ page }) => {
  test.setTimeout(60_000);
  const response = await page.goto("/bewerbung", { waitUntil: "domcontentloaded", timeout: 45_000 });
  expect(response?.status()).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow, nocache");
});

test("serves a sitemap without utility aliases and with only the actual translation pair", async ({ request }) => {
  const response = await request.get("/sitemap.xml", { timeout: 45_000 });
  expect(response.status()).toBe(200);
  const xml = await response.text();
  for (const path of ["/handzettel", "/gewinnspiel/archiv", "/merkzettel", "/bewerbung"]) {
    expect(xml).not.toContain(`<loc>https://trinkgut-jammers.de${path}</loc>`);
  }
  expect(xml.match(/<xhtml:link\b/g)).toHaveLength(4);
  expect(xml).toContain('hreflang="de" href="https://trinkgut-jammers.de/"');
  expect(xml).toContain('hreflang="nl" href="https://trinkgut-jammers.de/nl"');
});
