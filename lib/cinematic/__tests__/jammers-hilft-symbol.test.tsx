import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/image", () => ({ default: ({ src, alt }: { src: string | { src: string }; alt: string }) =>
  createElement("img", { src: typeof src === "string" ? src : src.src, alt }) }));
vi.mock("@/lib/flyer-index", () => ({ getFlyerIndex: async () => ({
  status: "ok", generatedAt: "2026-10-12T12:00:00Z", issues: [], flyers: [], scheduled: [],
}) }));

import SpotlightSection from "@/components/cinematic/SpotlightSection";
import EigenmarkePage from "@/app/eigenmarke/page";
import NederlandsPage from "@/app/nl/page";

const symbol = "/images/brands/jammers-hilft-symbol.png";
const asset = resolve(process.cwd(), "public" + symbol);

describe("original Jammers hilft symbol", () => {
  test.each([
    ["home own brands", () => renderToStaticMarkup(<SpotlightSection />), "Jammers hilft"],
    ["own brand page", () => renderToStaticMarkup(<EigenmarkePage />), "Jammers hilft"],
    ["Dutch own brands", async () => renderToStaticMarkup(await NederlandsPage()), "Jammers helpt"],
  ])("%s has one non-interactive, accessible original symbol", async (_, render, label) => {
    const html = await render();
    expect(html.split(`src="${symbol}"`)).toHaveLength(2);
    expect(html).toMatch(new RegExp(`<img[^>]+src="${symbol}"[^>]+alt="${label}[^"<]+"`));
    expect(html).not.toMatch(new RegExp(`<(?:a|button)[^>]*>[^<]*<[^>]*src="${symbol}"`));
    expect(html).not.toMatch(/1\s*(?:€|EUR).*?(?:spend|donat)/i);
  });

  test("keeps the original geometry and opaque white hands without a paper square", async () => {
    expect(existsSync(asset)).toBe(true);
    const metadata = await sharp(asset).metadata();
    expect([metadata.width, metadata.height, metadata.hasAlpha]).toEqual([250, 250, true]);
    const output = await sharp(asset).ensureAlpha().raw().toBuffer();
    expect(output[3]).toBe(0);
    expect(output[(250 * 250 - 1) * 4 + 3]).toBe(0);
    const source = await sharp(readFileSync(resolve(process.cwd(), "public/images/Expertise Liköre (A5)/2.png")))
      .extract({ left: 57, top: 1644, width: 250, height: 250 }).removeAlpha().raw().toBuffer();
    const restored = await sharp(asset).flatten({ background: { r: 251, g: 251, b: 242 } }).removeAlpha().raw().toBuffer();
    let maxDifference = 0;
    let preservedWhitePixels = 0;
    for (let p = 0; p < 250 * 250; p++) {
      for (let c = 0; c < 3; c++) maxDifference = Math.max(maxDifference, Math.abs(source[p * 3 + c] - restored[p * 3 + c]));
      if (source[p * 3] === 255 && source[p * 3 + 1] === 255 && source[p * 3 + 2] === 255) {
        expect(Array.from(output.subarray(p * 4, p * 4 + 4))).toEqual([255, 255, 255, 255]);
        preservedWhitePixels++;
      }
    }
    // This exact source contains 271 pure-white hand pixels; softer whites
    // are covered by the full original-pixel comparison above.
    expect(preservedWhitePixels).toBe(271);
    expect(maxDifference).toBeLessThanOrEqual(3);
  });
});
