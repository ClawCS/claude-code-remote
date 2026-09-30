import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import sharp from "sharp";

import GiveawayCard from "@/components/giveaways/GiveawayCard";
import { GIVEAWAYS_2026 } from "@/data/giveaways";

const approvedOriginals = [
  ["2026-01", "0f55f17e3a51fe46b16bb2321eaa797f128e5e87a80a4ed404c1241fc09d11f8", 1320, 1642],
  ["2026-02", "50e5ea4336eb301cce1125904d232e519e46d59fced56819305dc39b0439dec1", 1080, 1440],
  ["2026-04", "ac2e481082984619f2333949780384b39d841c6129524069bb2ed070b941a04e", 1080, 1440],
  ["2026-05", "793a124a993a9dea36591e363ffc50940f32f929019a28273fcc87cfd229bfce", 1080, 1440],
  ["2026-06", "76bd472460daae97e5c751317f4cccccee2044debac56d80ef91fbf55dca3eab", 1080, 1440],
  ["2026-07", "cc04ecb1466575e78b779bda2e0feac77241ca1292a841ea0e286065c721ad86", 1080, 1440],
  ["2026-easter", "b9a06295a686ae556f6eaefebb430c55eacbbffe5ae3c12c93a56894c842b887", 1080, 1440],
  ["2026-faxe", "096ee5de726dac753ccaaa441746f60bcd5405bca8f686646d790979553ad90d", 1080, 1440],
  ["2026-wm", "5477133b5de326ccd4f264679964a531d5db1a663491c955fcc81dea6d7be12f", 1080, 1440],
] as const;

describe("giveaway original-post covers", () => {
  test.each(approvedOriginals)("locks the complete, metadata-free original source for %s", async (id, sourceHash, width, height) => {
    const bytes = readFileSync(`assets/source/market-photos/giveaway-${id}.png`);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(sourceHash);
    const metadata = await sharp(bytes).metadata();
    expect(metadata).toMatchObject({ format: "png", width, height });
    expect(metadata.exif).toBeUndefined();
    expect(metadata.xmp).toBeUndefined();
    expect(metadata.icc).toBeUndefined();
    expect(GIVEAWAYS_2026.find(giveaway => giveaway.id === id)?.cover).toMatchObject({
      src: `/images/editorial/canva/giveaway-${id}.webp`, width, height,
    });
  });

  test("renders the entire locally served original motif at its natural ratio, linked to its own post", () => {
    const giveaway = {
      ...GIVEAWAYS_2026[0],
      cover: {
        src: "/images/editorial/canva/giveaway-2026-01.webp",
        width: 1080,
        height: 1440,
        alt: "Originalbeitragsbild zum Salitos SUP-Paket",
      },
    };
    const html = renderToStaticMarkup(<GiveawayCard giveaway={giveaway} status="ended" label="Januar" />);
    expect(html).toContain('data-giveaway-cover="2026-01"');
    expect(html).toContain('alt="Originalbeitragsbild zum Salitos SUP-Paket"');
    expect(html).toContain('width="1080" height="1440"');
    expect(html).toContain('sizes="(max-width: 640px) 85vw, (max-width: 1000px) 42vw, 360px"');
    expect(decodeURIComponent(html)).toContain(giveaway.cover.src);
    expect(html).toMatch(new RegExp(`<a[^>]*href="${giveaway.sourceURL}"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*><img`));
    expect(html).not.toMatch(/<iframe|instagram\.com\/.*\/embed/);
  });

  test("does not invent a cover for an action without a verified source image", () => {
    const giveaway = { ...GIVEAWAYS_2026[0], cover: undefined };
    const html = renderToStaticMarkup(<GiveawayCard giveaway={giveaway} status="ended" label="Januar" />);
    expect(html).not.toContain("<img");
    expect(html).toContain(giveaway.title);
    expect(html).toContain(giveaway.sourceURL);
  });

  test("requests larger responsive images only for the two-column current-action layout", () => {
    const html = renderToStaticMarkup(<GiveawayCard giveaway={GIVEAWAYS_2026[0]} status="active" label="Januar" layout="wide" />);
    expect(html).toContain('sizes="(max-width: 640px) 85vw, (max-width: 1000px) 42vw, 560px"');
  });
});
