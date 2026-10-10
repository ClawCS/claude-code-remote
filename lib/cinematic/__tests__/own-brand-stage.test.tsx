import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium, type Browser } from "@playwright/test";
import sharp from "sharp";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, afterAll, expect, it } from "vitest";
import SpotlightSection from "@/components/cinematic/SpotlightSection";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";

const slugs = ["pralle-kirsche", "dicke-nuesse", "suesse-suende", "caramello", "schwarzer-teufel", "weisser-engel"];
const names = ["Pralle Kirsche", "Dicke Nüsse", "Süsse Sünde", "Caramello", "Schwarzer Teufel", "Weisser Engel"];
const widths = [258, 260, 259, 260, 259, 263];
const colors = ["#DC2626", "#B45309", "#FBBF24", "#F97316", "#84CC16", "#FDE047"];

it("server-renders every exact flavor link with a sized complete bottle and visible name", () => {
  const html = renderToStaticMarkup(<SpotlightSection />);
  slugs.forEach((slug, index) => {
    const link = html.match(new RegExp(`<a[^>]*href="/eigenmarke#${slug}"[^>]*>[\\s\\S]*?</a>`))?.[0];
    expect(link, slug).toBeDefined();
    expect(link).toContain(names[index]);
    expect(decodeURIComponent(link!)).toContain(`/images/eigenmarken-bottles/${slug}.png`);
    expect(link).toContain(`width="${widths[index]}"`);
    expect(link).toContain('height="1200"');
  });
  expect(html).toContain('href="/eigenmarke"');
  expect(html).not.toContain('data-rail="cinematic"');
});

let browser: Browser, script: string, css: string;
beforeAll(async () => {
  const result = await build({
    stdin: { contents: 'import React from "react"; import {createRoot} from "react-dom/client"; import Spotlight from "./components/cinematic/SpotlightSection"; createRoot(document.getElementById("root")).render(<Spotlight/>);', resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, outdir: "/tmp/own-brand-stage-test", format: "iife", jsx: "automatic",
    loader: { ".module.css": "local-css", ".png": "dataurl", ".webp": "dataurl" }, define: { "process.env.NODE_ENV": '"production"' },
    // Next routing/image transforms are framework boundaries, not stage behavior.
    plugins: [{ name: "framework-adapters", setup(builder) {
      builder.onResolve({ filter: /^next\/(image|link)$/ }, args => ({ path: args.path, namespace: "framework" }));
      builder.onLoad({ filter: /.*/, namespace: "framework" }, args => ({ loader: "jsx", resolveDir: process.cwd(), contents: args.path.endsWith("link")
        ? 'import React from "react"; export default ({prefetch,children,...p})=><a {...p}>{children}</a>'
        : 'import React from "react"; export default ({unoptimized,placeholder,fill,src,...p})=><img {...p} src={typeof src==="string"?src:src.src}/>' }));
    } }],
  });
  script = result.outputFiles.find(file => file.path.endsWith(".js"))!.text;
  css = result.outputFiles.find(file => file.path.endsWith(".css"))!.text;
  browser = await chromium.launch();
}, 30_000);
afterAll(async () => { await browser?.close(); });

async function mount(width = 1440, reduced = false, touch = false) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference", hasTouch: touch });
  await page.route("https://stage.test/**", route => {
    const path = new URL(route.request().url()).pathname;
    return path === "/" ? route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' }) : route.fulfill({ body: readFileSync(resolve("public", path.slice(1))), contentType: "image/png" });
  });
  await page.goto("https://stage.test/");
  await page.evaluate(tokens => { for (const [key,value] of Object.entries(tokens)) document.documentElement.style.setProperty(key, String(value)); }, cinematicTokenStyle);
  await page.addStyleTag({ content: "*{box-sizing:border-box}body{margin:0}" + css });
  await page.addScriptTag({ content: script });
  return page;
}

it("keyboard focus reveals its matching backdrop and leaves normal destinations intact", async () => {
  const page = await mount();
  expect(await page.locator("[data-own-brand-stage]").count()).toBe(1);
  const links = page.locator("[data-own-brand-stage] a");
  for (let index=0; index<6; index++) {
    await links.nth(index).focus();
    expect(await page.locator("[data-brand-backdrop]").textContent()).toBe(names[index]);
    expect(await page.locator("[data-own-brand-stage]").getAttribute("data-active-brand")).toBe(slugs[index]);
    expect(await page.locator("[data-own-brand-stage]").evaluate(node => (node as HTMLElement).style.getPropertyValue("--cinematic-color-stage-accent"))).toBe(colors[index]);
    expect(await links.nth(index).getAttribute("href")).toBe(`/eigenmarke#${slugs[index]}`);
    expect(await links.nth(index).evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe("none");
  }
  await page.close();
});

it("touch selection updates the backdrop without cancelling the flavor navigation", async () => {
  const page = await mount(390, false, true);
  expect(await page.locator("[data-own-brand-stage]").count()).toBe(1);
  const flavor = page.locator('a[href="/eigenmarke#dicke-nuesse"]');
  const cancelled = await flavor.evaluate(node => !node.dispatchEvent(new PointerEvent("pointerdown", { pointerType:"touch", bubbles:true, cancelable:true })));
  expect(cancelled).toBe(false);
  expect(await page.locator("[data-brand-backdrop]").textContent()).toBe("Dicke Nüsse");
  const clickCancelled = await flavor.evaluate(node => {
    let prevented = false;
    // Observe the handler outcome, then block navigation only in the fixture.
    document.addEventListener("click", event => { prevented = event.defaultPrevented; event.preventDefault(); }, { once:true });
    node.dispatchEvent(new MouseEvent("click", {bubbles:true,cancelable:true})); return prevented;
  });
  expect(clickCancelled).toBe(false);
  await page.close();
});

it.each([360,390,768,1440])("keeps six names, complete images and 44px targets without overflow at %ipx", async width => {
  const page = await mount(width, true);
  expect(await page.locator("[data-own-brand-stage]").count()).toBe(1);
  const links = page.locator("[data-own-brand-stage] a");
  expect(await links.count()).toBe(6);
  for (let index=0; index<6; index++) {
    const box = await links.nth(index).boundingBox(); expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(await links.nth(index).locator("img").evaluate(img => getComputedStyle(img).objectFit)).toBe("contain");
    await links.nth(index).focus();
    expect(await links.nth(index).locator("img").evaluate(img => getComputedStyle(img).transform)).toBe("none");
    expect(await links.nth(index).locator("img").evaluate(img => getComputedStyle(img).transitionDuration)).toBe("0s");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.close();
});

it("still paints every loaded bottle after resizing desktop to 360px", async () => {
  const page = await mount(1440, true);
  const images = page.locator("[data-own-brand-stage] img");
  expect(await images.count()).toBe(6);
  for (let index=0; index<6; index++) await images.nth(index).evaluate(image => (image as HTMLImageElement).decode());
  await page.setViewportSize({ width:360, height:900 });
  for (let index=0; index<6; index++) {
    const image = images.nth(index);
    expect(await image.evaluate(node => ({ complete:(node as HTMLImageElement).complete, width:(node as HTMLImageElement).naturalWidth }))).toEqual({complete:true,width:widths[index]});
    const box = await image.boundingBox();
    expect(box!.width).toBeGreaterThan(40);
    expect(box!.height).toBeGreaterThan(150);
    // A decoded image can still have a blank composited layer: inspect rendered pixels.
    const {data,info} = await sharp(await image.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true});
    let painted = 0;
    for (let pixel=0; pixel<info.width*info.height; pixel++) {
      if (Math.max(data[pixel*info.channels],data[pixel*info.channels+1],data[pixel*info.channels+2]) > 90) painted++;
    }
    expect(painted, slugs[index]).toBeGreaterThan(100);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.close();
});
