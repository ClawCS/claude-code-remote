import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import nextConfig from "../../../next.config";
import { HERO_MEDIA } from "@/lib/cinematic/hero-media";

const { pathToRegexp } = createRequire(import.meta.url)("next/dist/compiled/path-to-regexp") as {
  pathToRegexp(source: string): RegExp;
};

const approved = [
  "/videos/jammers-hero-v4-mobile-4d55447b17c1b23d.mp4",
  "/videos/jammers-hero-v4-desktop-90db5ba2525d1a39.mp4",
  "/images/home/jammers-film-poster-62abe3860959351d.webp",
  "/fonts/plus-jakarta-sans-cyrillic-ext-a16f29d7d2a21a4f.woff2",
  "/fonts/plus-jakarta-sans-vietnamese-5c913fc1b1f86f4b.woff2",
  "/fonts/plus-jakarta-sans-latin-ext-0303e02b53b0298f.woff2",
  "/fonts/plus-jakarta-sans-latin-cd8db90cd950e26b.woff2",
];

async function cacheHeader(path: string) {
  const rules = await nextConfig.headers!();
  return rules.flatMap(rule => pathToRegexp(rule.source).test(path) ? rule.headers : [])
    .filter(header => header.key.toLowerCase() === "cache-control").at(-1)?.value;
}

describe("reviewed immutable hero media", () => {
  it("ships hash-bound active media without changing the desktop or poster originals", () => {
    for (const [variant, path] of Object.entries(HERO_MEDIA)) {
      const bytes = readFileSync(`public${path}`);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      expect(path).toContain(sha256.slice(0, 16));
      if (variant === "mobile") {
        expect(bytes.length).toBeLessThanOrEqual(1_000_000);
        // The real H.264 sample table must retain all 360 approved frames.
        const samples = bytes.indexOf("stsz");
        expect(samples).toBeGreaterThan(0);
        expect(bytes.readUInt32BE(samples + 12)).toBe(360);
      } else {
        const original = variant === "desktop" ? "public/videos/jammers-hero-v4-desktop.mp4" : "public/images/home/jammers-film-poster.webp";
        expect(bytes.equals(readFileSync(original))).toBe(true);
      }
    }
  });

  it.each(approved)("allows year-long immutable caching for %s", async path => {
    expect(await cacheHeader(path)).toBe("public, max-age=31536000, immutable");
  });

  it.each([
    "/videos/jammers-hero-v4-mobile.mp4", "/images/home/jammers-film-poster.webp",
    "/videos/unreviewed-1234567890abcdef.mp4", "/handzettel/manifest.json",
    "/videos/jammers-hero-v4-mobile-ffffffffffffffff.mp4",
    "/handzettel/2026/kw42/de.pdf", "/api/content/current", "/bewerbung", "/api/rentals",
  ])("does not grant immutable caching to mutable or unreviewed %s", async path => {
    expect(await cacheHeader(path) ?? "").not.toContain("immutable");
  });
});
