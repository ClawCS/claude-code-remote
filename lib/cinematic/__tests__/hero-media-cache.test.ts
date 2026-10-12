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
  "/videos/jammers-hero-v6-mobile-e2f94ee62e776519.mp4",
  "/videos/jammers-hero-v6-desktop-06fd3bdde1a2d604.mp4",
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
  it("delivers the exact approved V6 desktop and bounded mobile while retaining the poster", () => {
    const expected = {
      mobile: { path: "/videos/jammers-hero-v6-mobile-e2f94ee62e776519.mp4", sha256: "e2f94ee62e776519a7b4788a0f156123d056433ebd438f43a39f6d979dfecba3", bytes: 628843 },
      desktop: { path: "/videos/jammers-hero-v6-desktop-06fd3bdde1a2d604.mp4", sha256: "06fd3bdde1a2d6045b056a73fcf0350c4a443a756ee121988e07967d15bd363f", bytes: 3719740 },
      poster: { path: "/images/home/jammers-film-poster-62abe3860959351d.webp", sha256: "62abe3860959351d0d6c4bb03d075e10d4a82549fdfb56ac643ae37b872aa638", bytes: 130626 },
    };
    for (const [variant, path] of Object.entries(HERO_MEDIA)) {
      const record = expected[variant as keyof typeof expected];
      expect(path).toBe(record.path);
      const bytes = readFileSync(`public${path}`);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      expect(sha256).toBe(record.sha256);
      expect(bytes.length).toBe(record.bytes);
      expect(path).toContain(sha256.slice(0, 16));
      if (variant !== "poster") {
        expect(bytes.length).toBeLessThanOrEqual(variant === "mobile" ? 1_000_000 : 6_000_000);
        // The real H.264 sample table must retain all 360 approved frames.
        const samples = bytes.indexOf("stsz");
        expect(samples).toBeGreaterThan(0);
        expect(bytes.readUInt32BE(samples + 12)).toBe(360);
      } else {
        expect(bytes.equals(readFileSync("public/images/home/jammers-film-poster.webp"))).toBe(true);
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
    "/videos/jammers-hero-v6-mobile.mp4", "/videos/jammers-hero-v6-desktop-ffffffffffffffff.mp4",
    "/handzettel/2026/kw42/de.pdf", "/api/content/current", "/bewerbung", "/api/rentals",
  ])("does not grant immutable caching to mutable or unreviewed %s", async path => {
    expect(await cacheHeader(path) ?? "").not.toContain("immutable");
  });
});
