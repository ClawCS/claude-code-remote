import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import publicOffers from "@/data/weekly-offers.json";
import approvedFlyers from "@/data/editorial/flyers.json";
import { buildPublicOfferMetadata } from "@/lib/weekly-offer-metadata";

const repo = process.cwd();
const expectedMetadata = {
  id: "de-test", name: "Original mineral water", categorySlug: "alkoholfrei",
  language: "de", flyerId: "de-week-41", validFrom: "2026-10-05", validTo: "2026-10-10",
  image: "/images/offers/de-test.webp", sourcePage: 1, rect: [1, 1, 4, 3],
  sourceDimensions: [8, 6], sourceRegions: [[1, 1, 4, 3]],
  pdfSha256: createHash("sha256").update("reviewed-pdf").digest("hex"),
  sourceUrl: "https://example.com/reviewed.pdf", rightsStatus: "approved",
  reviewedAt: "2026-10-08T12:00:00Z", conditions: "2 cases; deposit extra",
  sourceWarning: "Printed source warning",
};

async function runFixture(options: {
  build?: boolean;
  plain?: boolean;
  nl?: boolean;
  mutate?: (row: Record<string, unknown>) => void;
} = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "weekly-offer-metadata-"));
  try {
    await mkdir(path.join(root, "data"));
    await mkdir(path.join(root, "public/images/offers"), { recursive: true });
    const source = await sharp({ create: { width: 8, height: 6, channels: 3, background: "red" } }).png().toBuffer();
    const crop = await sharp(source).extract({ left: 1, top: 1, width: 4, height: 3 }).webp({ lossless: true }).toBuffer();
    await writeFile(path.join(root, "source.png"), source);
    await writeFile(path.join(root, "source.pdf"), "reviewed-pdf");
    if (options.nl) {
      await mkdir(path.join(root, "public/handzettel/2026"), { recursive: true });
      await writeFile(path.join(root, "public/handzettel/2026/nl-test.pdf"), "reviewed-pdf");
    }
    await writeFile(path.join(root, "public/images/offers/de-test.webp"), crop);
    // The alias has identical bytes, so a forged image path must fail on metadata, not on its hash.
    await writeFile(path.join(root, "public/images/offers/alias.webp"), crop);
    const offer = { id: "de-test", name: "Original mineral water", categorySlug: "alkoholfrei",
      rect: [1, 1, 4, 3], sourceDimensions: [8, 6], conditions: "2 cases; deposit extra",
      ...(!options.plain ? { sourceRegions: [[1, 1, 4, 3]], sourceWarning: "Printed source warning" } : {}) };
    await writeFile(path.join(root, "data/weekly-offer-layout.json"), JSON.stringify({ sources: [{
      language: options.nl ? "nl" : "de", flyerId: "de-week-41",
      sourceUrl: options.nl ? "https://www.canva.com/design/private-source/view" : "https://example.com/reviewed.pdf",
      pdfSha256: expectedMetadata.pdfSha256, privatePdf: options.nl ? "public/handzettel/2026/nl-test.pdf" : "source.pdf", pageCount: 1,
      validFrom: "2026-10-05", validTo: "2026-10-10", reviewedAt: "2026-10-08T12:00:00Z", rightsStatus: "approved",
      pages: [{ page: 1, sourceImage: "source.png", expectedOffers: 1, offers: [offer] }],
    }] }));
    const row: Record<string, unknown> = { ...structuredClone(expectedMetadata),
      imageSha256: createHash("sha256").update(crop).digest("hex") };
    if (options.nl) Object.assign(row, {language: "nl", sourceUrl: "/handzettel/2026/nl-test.pdf"});
    if (options.plain) { delete row.sourceRegions; delete row.sourceWarning; }
    options.mutate?.(row);
    await writeFile(path.join(root, "data/weekly-offers.json"), JSON.stringify([row]));
    const result = await new Promise<{ code: number | null; stderr: string }>((resolve, reject) => {
      const child = spawn(process.execPath, ["--import", path.join(repo, "node_modules/tsx/dist/loader.mjs"),
        path.join(repo, "scripts/build-weekly-offers.ts"), ...(options.build ? [] : ["--check"])],
      { cwd: root, env: { ...process.env, TSX_TSCONFIG_PATH: path.join(repo, "tsconfig.json") } });
      let stderr = "";
      child.stderr.on("data", chunk => stderr += chunk);
      child.on("error", reject);
      child.on("close", code => resolve({ code, stderr }));
    });
    return { ...result,
      rows: JSON.parse(await readFile(path.join(root, "data/weekly-offers.json"), "utf8")),
      layout: JSON.parse(await readFile(path.join(root, "data/weekly-offer-layout.json"), "utf8")),
    };
  } finally { await rm(root, { recursive: true, force: true }); }
}

describe("weekly offer CLI public metadata binding", () => {
  it("builds NL public records from the local original while keeping Canva provenance internal", async () => {
    const result = await runFixture({build: true, nl: true});
    expect(result.code).toBe(0);
    expect(result.rows[0]).toMatchObject({language: "nl", sourceUrl: "/handzettel/2026/nl-test.pdf"});
    expect(JSON.stringify(result.rows)).not.toMatch(/canva\.com|private-source|privatePdf/);
    expect(result.layout.sources[0].sourceUrl).toBe("https://www.canva.com/design/private-source/view");
  });
  it("accepts an NL public record bound to the verified local PDF", async () => {
    expect((await runFixture({nl: true})).code).toBe(0);
  });
  it("rejects an NL public record that exposes the internal Canva source", async () => {
    const result = await runFixture({nl: true, mutate: row => {row.sourceUrl = "https://www.canva.com/design/private-source/view";}});
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/differs from reviewed source/);
  });
  it("accepts a complete reviewed public record", async () => {
    expect((await runFixture()).code).toBe(0);
  });
  it("accepts omitted optional crop regions and source warning", async () => {
    expect((await runFixture({ plain: true })).code).toBe(0);
  });
  it.each([
    ["flyerId", "wrong-flyer"], ["language", "nl"], ["sourceUrl", "https://example.com/wrong.pdf"],
    ["rightsStatus", "unapproved"], ["reviewedAt", "2026-10-09T12:00:00Z"],
    ["validFrom", "2026-10-06"], ["validTo", "2026-10-09"],
    ["name", "Different product"], ["categorySlug", "bier"],
    ["rect", [2, 1, 4, 3]], ["sourceDimensions", [9, 6]], ["sourceRegions", [[2, 1, 3, 3]]],
    ["image", "/images/offers/alias.webp"], ["conditions", "No conditions"],
    ["sourceWarning", "No warning"], ["sourcePage", 2], ["pdfSha256", "wrong-hash"],
  ])("rejects manipulated %s even when image bytes and dimensions still match", async (key, value) => {
    const result = await runFixture({ mutate: row => { row[key as string] = value; } });
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/differs from reviewed source/);
  });
  it.each(Object.keys(expectedMetadata))("rejects missing published %s metadata", async key => {
    expect((await runFixture({ mutate: row => { delete row[key]; } })).code).toBe(1);
  });
  it("rejects extra published metadata", async () => {
    expect((await runFixture({ mutate: row => { row.unreviewedPrice = "0.01"; } })).code).toBe(1);
  });
  it("rejects optional metadata absent from the reviewed layout", async () => {
    expect((await runFixture({ plain: true, mutate: row => { row.sourceRegions = [[1, 1, 4, 3]]; } })).code).toBe(1);
  });
  it("checks the image checksum separately from source-derived metadata", async () => {
    const result = await runFixture({ mutate: row => { row.imageSha256 = "wrong-hash"; } });
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/image integrity/);
  });
  it("builds the same complete source-derived public metadata that check accepts", async () => {
    const result = await runFixture({ build: true });
    expect(result.code).toBe(0);
    const { imageSha256, ...metadata } = result.rows[0];
    expect(metadata).toEqual(expectedMetadata);
    expect(imageSha256).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("generated weekly data imported by the public client", () => {
  it.each([
    undefined,
    "assets/source/private.pdf",
    "public/handzettel/../private.pdf",
    "https://www.canva.com/design/private-source/view",
  ])("refuses to publish an NL source without a safe local original: %s", privatePdf => {
    expect(() => buildPublicOfferMetadata({
      ...expectedMetadata, language: "nl", privatePdf,
    }, 1, expectedMetadata)).toThrow(/local published PDF/);
  });
  it("ships only local published PDF sources for NL offers, never internal Canva provenance", () => {
    const nlOffers = publicOffers.filter(offer => offer.language === "nl");
    expect(nlOffers.length).toBeGreaterThan(0);
    expect(publicOffers.filter(offer => /canva\.com|assets\/source\/|privatePdf|designId/.test(JSON.stringify(offer)))
      .map(offer => offer.id)).toEqual([]);
    for (const offer of nlOffers) {
      const flyer = approvedFlyers.find(item => item.id === offer.flyerId);
      expect(flyer).toBeDefined();
      expect(offer.sourceUrl).toBe(flyer!.pdfPath);
      expect(offer.pdfSha256).toBe(flyer!.pdfSha256);
    }
  });
});
