import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import { chromium, type Browser } from "@playwright/test";
import { afterAll, beforeAll, expect, test } from "vitest";
import EigenmarkePage from "@/app/eigenmarke/page";
import PralleKirschePage, { metadata } from "@/app/eigenmarke/pralle-kirsche/page";
import brandStyles from "@/components/eigenmarken/brand-world.module.css";
import answerStyles from "@/components/LocalAnswers.module.css";
import academyStyles from "@/components/academy-entry.module.css";
import symbolStyles from "@/components/jammers-hilft-symbol.module.css";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";
import sitemap from "@/app/sitemap";
import { SITEWIDE_DESIGN_CASES } from "@/e2e/sitewide-design-cases";

const products = [
  ["pralle-kirsche", "Pralle Kirsche"], ["dicke-nuesse", "Dicke Nüsse"],
  ["suesse-suende", "Süsse Sünde"], ["caramello", "Caramello"],
  ["schwarzer-teufel", "Schwarzer Teufel"], ["weisser-engel", "Weisser Engel"],
];

// Replacing the original cutouts with posters, losing anchors or removing native
// navigation must fail at the rendered page, not merely in a data manifest.
test.each(products)("renders %s as a separate original bottle and native product text", (slug, name) => {
  const html = renderToStaticMarkup(<EigenmarkePage />);
  expect(html).toContain(`id="${slug}"`);
  expect(html).toContain(`href="#${slug}"`);
  expect(html).toContain(`/images/eigenmarken-bottles/${slug}.png`);
  expect(html).toContain(name);
  expect(html).not.toContain(`/images/eigenmarken/${slug}.png`);
});

test("detail exposes only the verified facts, one title and original separate scene/product layers", () => {
  const html = renderToStaticMarkup(<PralleKirschePage />);
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  expect(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g, "")).toBe("Pralle Kirsche.");
  for (const text of ["Kirsch-Mandel-Likör", "15% Vol.", "700 ml", 'data-atmosphere="spirits"', "data-brand-background", "data-brand-product", "data-brand-light", "data-brand-copy"]) expect(html).toContain(text);
  for (const href of ["/eigenmarke", "/kontakt", "#geschmack", "/akademie/likoere"]) expect(html).toContain(`href="${href}"`);
  for (const [slug] of products.slice(1)) expect(html).toContain(`href="/eigenmarke#${slug}"`);
  expect(html).not.toMatch(/slipperfje|€|auf Lager|sofort lieferbar|Spenden|\/private\/|\/Users\/|brainstorm/i);
  expect(metadata.alternates?.canonical).toBe("https://trinkgut-jammers.de/eigenmarke/pralle-kirsche");
});

test("the decorative cherry scene is the approved immutable image, separate from all bottle bytes", () => {
  const path = "public/images/eigenmarken-scenes/cherry-b26593bf6dc6.webp";
  expect(existsSync(path)).toBe(true);
  expect(createHash("sha256").update(readFileSync(path)).digest("hex")).toBe("b26593bf6dc63fc1fba4b9487efed5c629d5777e1be1b388ec3c0913e4b048f3");
});

let browser: Browser;
let css: string;
let classMap: Record<string, string>;
beforeAll(async () => {
  const compiled = await build({ stdin: { contents: 'import brand from "./components/eigenmarken/brand-world.module.css"; import answers from "./components/LocalAnswers.module.css"; import academy from "./components/academy-entry.module.css"; import symbol from "./components/jammers-hilft-symbol.module.css"; import "./app/public-site.css"; export default [brand,answers,academy,symbol];', resolveDir: process.cwd(), loader: "ts" }, bundle: true, write: false, outdir: "/tmp/brand-world-test", format: "cjs", loader: { ".module.css": "local-css" } });
  const output = { exports: {} as { default: Record<string, string>[] } };
  new Function("module", "exports", compiled.outputFiles.find(file => file.path.endsWith(".js"))!.text)(output, output.exports);
  classMap = {};
  [brandStyles, answerStyles, academyStyles, symbolStyles].forEach((source, i) => Object.keys(output.exports.default[i]).forEach(key => { classMap[source[key]] = output.exports.default[i][key]; }));
  css = compiled.outputFiles.find(file => file.path.endsWith(".css"))!.text;
  browser = await chromium.launch();
}, 30_000);
afterAll(async () => { await browser?.close(); });

// Full native rendering with original asset bytes: catches clipping, overlapping
// text, CSS that hides content until hydration, and non-focusable navigation.
test.each([360, 768, 1440])("keeps the collection and cherry page readable without JS at %ipx", async width => {
  for (const [name, element] of [["overview", <EigenmarkePage key="overview" />], ["detail", <PralleKirschePage key="detail" />]] as const) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, javaScriptEnabled: false, reducedMotion: "reduce" });
    try {
      const markup = renderToStaticMarkup(element).replace(/class="([^"]*)"/g, (_, classes: string) => `class="${classes.split(" ").map(value => classMap[value] ?? value).join(" ")}"`);
      const tokens = Object.entries(cinematicTokenStyle).map(([key, value]) => `${key}:${value}`).join(";");
      const htmlDocument = `<meta charset="utf-8"><style>body{margin:0;font-family:sans-serif}${css}</style><main class="public-subpage" style="${tokens}">${markup}</main>`;
      await page.route("https://brand.test/**", async route => {
        const path = new URL(route.request().url()).pathname;
        if (path === "/") return route.fulfill({ contentType: "text/html; charset=utf-8", body: htmlDocument });
        if (!path.startsWith("/images/") || !existsSync(`public${path}`)) return route.abort();
        await route.fulfill({ body: readFileSync(`public${path}`), contentType: path.endsWith(".png") ? "image/png" : "image/webp" });
      });
      await page.goto("https://brand.test/");
      expect(await page.locator("h1").count()).toBe(1);
      expect(await page.locator("h1").evaluate(node => getComputedStyle(node).color)).toBe("rgb(255, 255, 255)");
      expect(await page.locator("[data-academy-context]").evaluate(node => getComputedStyle(node).backgroundColor)).toBe("rgb(255, 255, 255)");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const stages = name === "overview" ? page.locator("[data-brand-stage]") : page.locator("header");
      expect(await stages.count()).toBe(name === "overview" ? 6 : 1);
      for (const stage of await stages.all()) {
        const product = stage.locator("[data-brand-product] img");
        await product.scrollIntoViewIfNeeded();
        await product.waitFor({ state: "visible" });
        expect(await product.evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
        expect(await product.evaluate(node => getComputedStyle(node).objectFit)).toBe("contain");
        expect(await product.evaluate(node => getComputedStyle(node).animationName)).toBe("none");
        const image = (await product.boundingBox())!;
        const copy = (await stage.locator("[data-brand-copy]").boundingBox())!;
        expect(image.x >= copy.x + copy.width - 1 || image.y >= copy.y + copy.height - 1).toBe(true);
        expect(image.x).toBeGreaterThanOrEqual(0);
        expect(image.x + image.width).toBeLessThanOrEqual(width);
        expect(image.height).toBeGreaterThan(350);
      }
      for (const light of await page.locator("[data-brand-light]").all()) {
        expect(await light.getAttribute("aria-hidden")).toBe("true");
        expect(await light.evaluate(node => getComputedStyle(node).pointerEvents)).toBe("none");
      }
      const link = page.getByRole("link", { name: "Kontakt zum Markt" }).first();
      await link.focus();
      expect(await link.evaluate(node => getComputedStyle(node).outlineStyle)).toBe("solid");
      expect(await link.getAttribute("href")).toBe("/kontakt");
      if (name === "overview") {
        await page.getByRole("link", { name: "Pralle Kirsche", exact: true }).click();
        expect(page.url()).toContain("#pralle-kirsche");
      }
      await page.screenshot({ path: `/private/tmp/jammers-atmosphere-task2/${name}-${width}.png`, fullPage: true });
    } finally { await page.close(); }
  }
}, 30_000);

test("overview keeps real contact and learning navigation, without invented commerce or labels", () => {
  const html = renderToStaticMarkup(<EigenmarkePage />);
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  for (const href of ["/eigenmarke/pralle-kirsche", "/kontakt", "/akademie/likoere", "/akademie"]) expect(html).toContain(`href="${href}"`);
  expect(html).toContain('data-local-answers="brands"');
  expect(html).toContain('data-collection="brands"');
  expect(html).toContain("data-jammers-hilft-symbol");
  expect(html).not.toMatch(/slipperfje|group-dark|€|auf Lager|sofort lieferbar|Spenden|Spende pro/i);
});

test("the sole new brand detail is indexable and included in the exact public acceptance census", () => {
  expect(existsSync("app/eigenmarke/pralle-kirsche/page.tsx")).toBe(true);
  expect(sitemap().filter(entry => entry.url.includes("/eigenmarke/"))).toEqual([
    expect.objectContaining({ url: "https://trinkgut-jammers.de/eigenmarke/pralle-kirsche" }),
  ]);
  expect(SITEWIDE_DESIGN_CASES).toHaveLength(41);
  expect(SITEWIDE_DESIGN_CASES).toContainEqual({ family: "brands", template: "/eigenmarke/pralle-kirsche", path: "/eigenmarke/pralle-kirsche" });
});
