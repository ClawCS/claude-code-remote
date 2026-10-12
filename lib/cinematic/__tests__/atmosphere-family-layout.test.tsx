import { build } from "esbuild";
import { chromium, type Browser } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AkademiePage from "@/app/akademie/page";
import ProductCatalogue from "@/components/ProductCatalogue";
import styles from "@/components/editorial/learning.module.css";
import collection from "@/components/editorial/collection.module.css";
import editorial from "@/components/editorial/editorial.module.css";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";

let browser: Browser;
let html: string;
let css: string;

beforeAll(async () => {
  const result = await build({
    stdin: { contents: 'import styles from "./components/editorial/learning.module.css"; export default styles;', resolveDir: process.cwd(), loader: "ts" },
    bundle: true, write: false, outdir: "/tmp/atmosphere-family-layout", format: "cjs", loader: { ".module.css": "local-css" },
  });
  const output = { exports: {} as { default?: Record<string, string> } };
  new Function("module", "exports", result.outputFiles.find(file => file.path.endsWith(".js"))!.text)(output, output.exports);
  const compiled = output.exports.default!;
  html = renderToStaticMarkup(<AkademiePage />).replace(/class="([^"]*)"/g, (_, names: string) => `class="${names.split(" ").map(name => {
    const key = Object.keys(compiled).find(key => styles[key] === name);
    return key ? compiled[key] : name;
  }).join(" ")}"`);
  css = result.outputFiles.find(file => file.path.endsWith(".css"))!.text;
  browser = await chromium.launch();
}, 30_000);

afterAll(async () => { await browser?.close(); });

describe("image-led academy hierarchy", () => {
  // A uniform thumbnail grid would lose the requested editorial entry point.
  it.each([390, 768, 1440])("keeps one large first course and readable course links at %ipx", async width => {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    try {
      await page.route("**/*", route => route.abort());
      const tokens = Object.entries(cinematicTokenStyle).map(([key, value]) => `${key}:${value}`).join(";");
      await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;font-family:sans-serif}img{max-width:100%}${css}</style><div style="${tokens}">${html}</div>`);
      const cards = page.locator('[data-learning="academy"] a[href^="/akademie/"]').filter({ has: page.locator("img") });
      expect(await cards.count()).toBe(8);
      for (const card of await cards.all()) {
        expect((await card.boundingBox())!.width).toBeGreaterThan(240);
        expect(await card.locator("h2").innerText()).toBeTruthy();
      }
      const first = (await cards.first().boundingBox())!;
      const second = (await cards.nth(1).boundingBox())!;
      if (width >= 768) expect(first.width).toBeGreaterThan(second.width * 1.8);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await page.close(); }
  });
});

describe("catalogue title readability", () => {
  let catalogueHtml: string;
  let catalogueCss: string;
  beforeAll(async () => {
    const result = await build({
      stdin: { contents: 'import collection from "./components/editorial/collection.module.css"; import editorial from "./components/editorial/editorial.module.css"; export default { collection, editorial };', resolveDir: process.cwd(), loader: "ts" },
      bundle: true, write: false, outdir: "/tmp/catalogue-heading-layout", format: "cjs", loader: { ".module.css": "local-css" },
    });
    const output = { exports: {} as { default?: Record<string, Record<string, string>> } };
    new Function("module", "exports", result.outputFiles.find(file => file.path.endsWith(".js"))!.text)(output, output.exports);
    const maps = [{ original: collection, compiled: output.exports.default!.collection }, { original: editorial, compiled: output.exports.default!.editorial }];
    catalogueHtml = renderToStaticMarkup(<ProductCatalogue content={{ status: "ok", issues: [], generatedAt: "2026-10-12T12:00:00Z", flyers: [], offers: [] }}>{null}</ProductCatalogue>).replace(/class="([^"]*)"/g, (_, names: string) => `class="${names.split(" ").map(name => {
      for (const { original, compiled } of maps) {
        const key = Object.keys(compiled).find(key => original[key] === name);
        if (key) return compiled[key];
      }
      return name;
    }).join(" ")}"`);
    const font = readFileSync("public/fonts/plus-jakarta-sans-latin-cd8db90cd950e26b.woff2").toString("base64");
    catalogueCss = `@font-face{font-family:CatalogueTest;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:200 800}${result.outputFiles.find(file => file.path.endsWith(".css"))!.text}`;
  });

  // Oversized photo-hero typography must not split this core navigation word.
  it.each([390, 1024, 1440])("keeps Wochenangebote intact within the heading at %ipx", async width => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    try {
      await page.route("**/*", route => route.abort());
      const tokens = Object.entries(cinematicTokenStyle).map(([key, value]) => `${key}:${value}`).join(";");
      await page.setContent(`<style>*{box-sizing:border-box}body{margin:0}${catalogueCss}</style><div style="${tokens};--font-jakarta:CatalogueTest">${catalogueHtml}</div>`);
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.locator("h1").evaluate(heading => {
        const text = heading.firstChild!;
        const range = document.createRange();
        const start = text.textContent!.indexOf("Wochenangebote");
        range.setStart(text, start);
        range.setEnd(text, start + "Wochenangebote".length);
        const rects = [...range.getClientRects()];
        return { lines: rects.length, right: Math.max(...rects.map(rect => rect.right)), boundary: heading.getBoundingClientRect().right };
      });
      expect(metrics.lines).toBe(1);
      expect(metrics.right).toBeLessThanOrEqual(metrics.boundary + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await page.close(); }
  });
});
