import { build } from "esbuild";
import { chromium, type Browser } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AssortmentSection from "@/components/cinematic/AssortmentSection";
import styles from "@/components/cinematic/warm.module.css";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";

let browser: Browser;
let css: string;
let html: string;

beforeAll(async () => {
  const result = await build({
    stdin: { contents: 'import styles from "./components/cinematic/warm.module.css"; export default styles;', resolveDir: process.cwd(), loader: "ts" },
    bundle: true, write: false, outdir: "/tmp/category-atmosphere-test", format: "cjs",
    loader: { ".module.css": "local-css" },
  });
  const output = { exports: {} as { default?: Record<string, string> } };
  new Function("module", "exports", result.outputFiles.find(file => file.path.endsWith(".js"))!.text)(output, output.exports);
  const compiled = output.exports.default!;
  html = renderToStaticMarkup(<AssortmentSection />).replace(/class="([^"]*)"/g, (_, classes: string) =>
    `class="${classes.split(" ").map(value => {
      const key = Object.keys(compiled).find(key => styles[key] === value);
      return key ? compiled[key] : value;
    }).join(" ")}"`);
  css = result.outputFiles.find(file => file.path.endsWith(".css"))!.text;
  browser = await chromium.launch();
}, 30_000);
afterAll(async () => { await browser?.close(); });

async function mount(width: number, reduced = false) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: reduced ? "reduce" : "no-preference" });
  await page.route("**/*", route => route.abort());
  const tokens = Object.entries(cinematicTokenStyle).map(([key, value]) => `${key}:${value}`).join(";");
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;font-family:sans-serif} ${css}</style><div style="${tokens}">${html}</div>`);
  return page;
}

describe("photographic category navigation", () => {
  // Reintroducing index numbers or emoji makes category names noisy or platform-dependent.
  it("exposes four named destinations with individual crops and decorative SVG arrows, without numbering", async () => {
    const page = await mount(390);
    try {
      const cards = page.locator('nav[aria-label="Getränke entdecken"] > a');
      expect(await cards.count()).toBe(4);
      for (const [index, slug, name] of [[0, "bier", "Bier & Fassbier"], [1, "alkoholfrei", "Alkoholfrei"], [2, "wein", "Wein & Sekt"], [3, "spirituosen", "Spirituosen"]] as const) {
        const card = cards.nth(index);
        expect(await card.getAttribute("href")).toBe(`/kategorie/${slug}`);
        expect(await card.getAttribute("data-category")).toBe(slug);
        expect(await card.innerText()).toBe(name);
        expect(await card.locator('svg[aria-hidden="true"]').count()).toBe(1);
        expect(await card.locator("img").getAttribute("alt")).toBeTruthy();
      }
      expect(new Set(await cards.locator("img").evaluateAll(images => images.map(image => getComputedStyle(image).objectPosition))).size).toBe(4);
    } finally { await page.close(); }
  });

  // Contain/inner padding would recreate the visible image mats; hidden titles break touch discovery.
  it.each([[360, 2], [390, 2], [768, 4], [1440, 4]])("keeps edge-to-edge photos and visible colored footers at %ipx in %i columns", async (width, columns) => {
    const page = await mount(width);
    try {
      const nav = page.locator('nav[aria-label="Getränke entdecken"]');
      expect((await nav.evaluate(node => getComputedStyle(node).gridTemplateColumns)).split(" ")).toHaveLength(columns);
      const colors = [];
      for (const card of await nav.locator(":scope > a").all()) {
        const metrics = await card.evaluate(node => {
          const image = node.querySelector("img")!;
          const footer = node.lastElementChild!;
          return { card: node.getBoundingClientRect().width, image: image.getBoundingClientRect().width, fit: getComputedStyle(image).objectFit, border: getComputedStyle(node).borderTopWidth, footerColor: getComputedStyle(footer).backgroundColor, footerVisible: getComputedStyle(footer).opacity, titleHeight: footer.firstElementChild!.getBoundingClientRect().height };
        });
        expect(metrics.fit).toBe("cover");
        expect(metrics.border).toBe("0px");
        expect(metrics.image).toBeCloseTo(metrics.card, 1);
        expect(metrics.footerVisible).toBe("1");
        expect(metrics.titleHeight).toBeGreaterThan(20);
        colors.push(metrics.footerColor);
      }
      expect(new Set(colors).size).toBe(4);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await page.close(); }
  });

  // Both pointer and keyboard users get the cue; reduced-motion users must not get either transform.
  it.each([false, true])("respects reduced motion (%s) for hover and keyboard focus", async reduced => {
    const page = await mount(1440, reduced);
    try {
      const card = page.locator('nav[aria-label="Getränke entdecken"] > a').first();
      const image = card.locator("img");
      const arrow = card.locator("svg");
      expect(await arrow.count()).toBe(1);
      await card.hover();
      await page.waitForTimeout(400);
      expect(await image.evaluate(node => getComputedStyle(node).transform === "none")).toBe(reduced);
      expect(await arrow.evaluate(node => getComputedStyle(node).transform === "none")).toBe(reduced);
      await page.mouse.move(0, 0);
      await page.keyboard.press("Tab");
      await card.focus();
      await page.waitForTimeout(400);
      expect(await card.evaluate(node => getComputedStyle(node).outlineStyle)).toBe("solid");
      expect(await image.evaluate(node => getComputedStyle(node).transform === "none")).toBe(reduced);
      if (reduced) expect(await image.evaluate(node => getComputedStyle(node).transitionDuration)).toBe("0s");
    } finally { await page.close(); }
  });
});
