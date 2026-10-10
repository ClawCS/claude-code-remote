import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium, type Browser, type Page } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import HeroFilm from "@/components/cinematic/HeroFilm";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";

let browser: Browser;
let bundle: string;
let css: string;

beforeAll(async () => {
  const result = await build({
    stdin: { contents: 'import React from "react"; import {createRoot} from "react-dom/client"; import HeroFilm from "./components/cinematic/HeroFilm"; createRoot(document.getElementById("root")).render(<HeroFilm><a href="#offers">Angebote</a></HeroFilm>);', resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, outdir: "/tmp/hero-film-test", format: "iife", jsx: "automatic",
    loader: { ".module.css": "local-css" }, define: { "process.env.NODE_ENV": '"production"' },
  });
  bundle = result.outputFiles.find((file) => file.path.endsWith(".js"))!.text;
  css = result.outputFiles.find((file) => file.path.endsWith(".css"))?.text ?? "";
  browser = await chromium.launch();
}, 30_000);
afterAll(async () => { await browser?.close(); });

async function mount(options: { reduced?: boolean; saveData?: boolean; width?: number; height?: number; tallCopy?: boolean; reject?: boolean; nativeMedia?: boolean } = {}) {
  const page = await browser.newPage({ viewport: { width: options.width ?? 1440, height: options.height ?? 900 }, reducedMotion: options.reduced ? "reduce" : "no-preference" });
  await page.route("https://film.test/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/") return route.fulfill({ contentType: "text/html", body: "<div id='root'></div>" });
    const file = resolve(process.cwd(), "public", path.slice(1));
    await route.fulfill({ body: readFileSync(file), contentType: path.endsWith(".mp4") ? "video/mp4" : "image/webp" });
  });
  await page.goto("https://film.test/");
  await page.evaluate(({ saveData, reject, nativeMedia, tokens }) => {
    for (const [key, value] of Object.entries(tokens)) document.documentElement.style.setProperty(key, String(value));
    const connection = new EventTarget();
    Object.assign(connection, { saveData: Boolean(saveData) });
    Object.defineProperty(navigator, "connection", { value: connection, configurable: true });
    if (!nativeMedia) {
      HTMLMediaElement.prototype.play = function () {
        if (reject) return Promise.reject(new Error("Playback blocked"));
        this.dispatchEvent(new Event("playing"));
        return Promise.resolve();
      };
      HTMLMediaElement.prototype.pause = function () { this.dispatchEvent(new Event("pause")); };
      HTMLMediaElement.prototype.load = function () {};
    }
  }, { ...options, tokens: cinematicTokenStyle });
  await page.addStyleTag({ content: css });
  if (options.tallCopy) await page.addStyleTag({ content: "[data-film-copy] { min-height:600px; } body { padding-bottom:1000px; }" });
  await page.addScriptTag({ content: bundle });
  await page.locator("button").waitFor({ state: "visible" });
  await page.waitForFunction(() => !document.querySelector("button")?.disabled);
  return page;
}

const label = async (page: Page) => page.locator("button").innerText();

describe("HeroFilm loading and playback", () => {
  it("does not load offscreen mobile media just because tall copy is visible", async () => {
    const page = await mount({ width: 390, height: 500, tallCopy: true });
    expect((await page.locator("video").boundingBox())!.y).toBeGreaterThanOrEqual(500);
    // Wait for real browser intersection delivery, not a substituted observer.
    await page.locator("video").evaluate((video) => new Promise<void>((resolve) => {
      const observer = new IntersectionObserver(() => { observer.disconnect(); resolve(); });
      observer.observe(video);
    }));
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(await page.locator("video").getAttribute("src")).toBeNull();
    expect(await label(page)).toBe("Film abspielen");
    await page.locator("video").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector("button")?.textContent === "Film pausieren");
    expect(await page.locator("video").getAttribute("src")).toBe("/videos/jammers-hero-mobile.mp4");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => document.querySelector("button")?.textContent === "Film abspielen");
    expect((await page.locator("video").boundingBox())!.y).toBeGreaterThanOrEqual(500);
    await page.close();
  });

  it("allows cancellation of pending explicit playback and ignores its late completion", async () => {
    const page = await mount({ reduced: true });
    await page.evaluate(() => {
      HTMLMediaElement.prototype.play = function () {
        return new Promise<void>((resolve) => {
          (window as Window & { completePlay?: () => void }).completePlay = () => { this.dispatchEvent(new Event("playing")); resolve(); };
        });
      };
    });
    await page.locator("button").click();
    expect(await label(page)).toBe("Wiedergabe abbrechen");
    await page.locator("button").click();
    expect(await label(page)).toBe("Film abspielen");
    await page.evaluate(() => (window as Window & { completePlay?: () => void }).completePlay?.());
    expect(await label(page)).toBe("Film abspielen");
    expect(await page.locator("[role=status]").innerText()).toBe("");
    await page.close();
  });

  it("ships a usable poster and links but no media URL or inert control before hydration", () => {
    const html = renderToStaticMarkup(<HeroFilm><a href="/angebote">Angebote</a></HeroFilm>);
    expect(html).toContain('poster="/images/home/jammers-film-poster.webp"');
    expect(html).not.toContain(".mp4");
    expect(html).toContain('href="/angebote"');
    expect(html).toContain('disabled=""');
    expect(html).toContain("KI-Werbefilm · beispielhafte Partyszene");
  });

  it.each([{ reduced: true }, { saveData: true }])("does not attach a source until an explicit play under %j", async (options) => {
    const page = await mount(options);
    expect(await page.locator("video").getAttribute("src")).toBeNull();
    await page.locator("button").click();
    await page.waitForFunction(() => document.querySelector("button")?.textContent === "Film pausieren");
    expect(await page.locator("video").getAttribute("src")).toBe("/videos/jammers-hero-desktop.mp4");
    await page.locator("button").click();
    expect(await label(page)).toBe("Film abspielen");
    await page.close();
  });

  it.each([[390, "mobile"], [768, "desktop"], [1440, "desktop"]])("chooses the bounded source at %ipx", async (width, variant) => {
    const page = await mount({ width: Number(width) });
    await page.waitForFunction(() => Boolean(document.querySelector("video")?.getAttribute("src")));
    expect(await page.locator("video").getAttribute("src")).toBe(`/videos/jammers-hero-${variant}.mp4`);
    await page.close();
  });

  it("respects manual pause across visibility changes", async () => {
    const page = await mount();
    await page.waitForFunction(() => document.querySelector("button")?.textContent === "Film pausieren");
    await page.locator("button").click();
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(await label(page)).toBe("Film abspielen");
    await page.close();
  });

  it("pauses and detaches on new reduced-motion or data-saving preference", async () => {
    const page = await mount();
    await page.waitForFunction(() => document.querySelector("button")?.textContent === "Film pausieren");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => !document.querySelector("video")?.getAttribute("src"));
    expect(await label(page)).toBe("Film abspielen");
    await page.locator("button").click();
    await page.waitForFunction(() => document.querySelector("button")?.textContent === "Film pausieren");
    await page.evaluate(() => { const connection = (navigator as Navigator & { connection: EventTarget & { saveData: boolean } }).connection; connection.saveData = true; connection.dispatchEvent(new Event("change")); });
    await page.waitForFunction(() => !document.querySelector("video")?.getAttribute("src"));
    expect(await label(page)).toBe("Film abspielen");
    await page.close();
  });

  it("does not accept a late playing event after a restrictive preference change", async () => {
    const page = await mount();
    await page.waitForFunction(() => document.querySelector("button")?.textContent === "Film pausieren");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => !document.querySelector("video")?.getAttribute("src"));
    await page.locator("video").dispatchEvent("playing");
    expect(await label(page)).toBe("Film abspielen");
    await page.close();
  });

  it("ignores a rejected pending play after manual pause and viewport re-entry", async () => {
    const page = await mount({ reduced: true });
    await page.evaluate(() => {
      HTMLMediaElement.prototype.play = function () {
        this.dispatchEvent(new Event("playing"));
        return new Promise((_resolve, reject) => { (window as Window & { rejectPlay?: () => void }).rejectPlay = () => reject(new Error("Late failure")); });
      };
    });
    await page.locator("button").click();
    await page.waitForFunction(() => document.querySelector("button")?.textContent === "Film pausieren");
    await page.locator("button").click();
    await page.evaluate(() => (window as Window & { rejectPlay?: () => void }).rejectPlay?.());
    await page.evaluate(() => { document.body.style.paddingBottom = "2000px"; window.scrollTo(0, 1600); });
    await page.waitForTimeout(30);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(30);
    expect(await label(page)).toBe("Film abspielen");
    expect(await page.locator("[role=status]").innerText()).toBe("");
    expect(await page.locator("video").getAttribute("src")).toBe("/videos/jammers-hero-desktop.mp4");
    await page.close();
  });

  it("pauses in background and outside the viewport, then resumes only eligible playback", async () => {
    const page = await mount();
    await page.waitForFunction(() => document.querySelector("button")?.textContent === "Film pausieren");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForFunction(() => document.querySelector("button")?.textContent === "Film abspielen");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: false, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); document.body.style.paddingBottom = "2000px"; });
    await page.waitForFunction(() => document.querySelector("button")?.textContent === "Film pausieren");
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForFunction(() => document.querySelector("button")?.textContent === "Film abspielen");
    await page.close();
  });

  it("keeps truthful controls and the poster when play rejects or media fails", async () => {
    const page = await mount({ reject: true });
    await page.waitForFunction(() => document.querySelector("[role=status]")?.textContent?.includes("Standbild"));
    expect(await label(page)).toBe("Film abspielen");
    expect(await page.locator("video").getAttribute("src")).toBeNull();
    await page.locator("button").click();
    expect(await label(page)).toBe("Film abspielen");
    await page.locator("video").dispatchEvent("error");
    expect(await page.locator("[role=status]").innerText()).toContain("Standbild");
    await page.close();
  });

  it.each([390, 1440])("preserves focus and mobile copy during the finale at %ipx", async (width) => {
    const page = await mount({ width });
    const copy = page.locator("[data-film-copy]");
    await page.locator("a").focus();
    await page.locator("video").evaluate((video: HTMLVideoElement) => { video.currentTime = 12; video.dispatchEvent(new Event("timeupdate")); });
    expect(await copy.evaluate((node) => getComputedStyle(node).visibility)).toBe("visible");
    await page.locator("button").focus();
    await page.waitForFunction((mobile) => getComputedStyle(document.querySelector("[data-film-copy]")!).visibility === (mobile ? "visible" : "hidden"), width < 768);
    if (width >= 768) expect(await copy.getAttribute("inert")).not.toBeNull();
    const box = await page.locator("video").boundingBox();
    expect(box!.width / box!.height).toBeCloseTo(16 / 9, 2);
    await page.close();
  });

  it("plays the real local silent video and stops cleanly", async () => {
    const page = await mount({ reduced: true, nativeMedia: true, width: 390 });
    await page.locator("button").click();
    await page.waitForFunction(() => { const video = document.querySelector("video"); return video && video.currentTime > 0 && video.videoWidth === 960; });
    expect(await label(page)).toBe("Film pausieren");
    await page.locator("button").click();
    expect(await page.locator("video").evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
    await page.close();
  });
});
