import { rm, symlink, unlink } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { loadWeeklyPublications, parseWeeklyEdition, parseWeeklyPublication, selectPublishedEditions, verifyWeeklyEdition } from "@/lib/weekly-publication";
import { sha256, weeklyPublicationFixture } from "./fixtures/weekly-publication";

const roots: string[] = [];
async function fixture(...args: Parameters<typeof weeklyPublicationFixture>) {
  const result = await weeklyPublicationFixture(...args);
  roots.push(result.root);
  return result;
}
afterEach(async () => { vi.unstubAllEnvs(); await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

describe("immutable weekly publications", () => {
  it("rejectsChangedOriginal: rejects changed original bytes rather than trusting metadata", async () => {
    const f = await fixture();
    await f.write(`public${f.editions[0].pdf.path}`, Buffer.from("%PDF-changed"));
    await expect(verifyWeeklyEdition(f.editions[0], f.root)).rejects.toThrow();
  });
  it("isolatesCorruptNl: retains verified DE when the NL PDF is corrupt", async () => {
    const f = await fixture();
    await f.write(`public${f.editions[1].pdf.path}`, "corrupt");
    const loaded = await loadWeeklyPublications(f.root);
    expect(loaded.editions.map(x => x.edition.language)).toEqual(["de"]);
    expect(loaded.issues).toEqual([{ week: "2026-10-05", language: "nl", code: "edition-invalid" }]);
    expect(selectPublishedEditions(loaded, new Date("2026-10-08T12:00:00Z")).map(x => x.edition.language)).toEqual(["de"]);
  });
  it("isolates invalid NL metadata after a readable week header", async () => {
    const f = await fixture();
    await f.write("data/editorial/weekly-publications/2026-10-05.json", JSON.stringify({ ...f.publication,
      editions: [f.editions[0], { ...f.editions[1], cover: null }] }));
    expect((await loadWeeklyPublications(f.root)).editions.map(x => x.edition.language)).toEqual(["de"]);
    expect(() => parseWeeklyPublication({ ...f.publication, editions: [f.editions[0], { ...f.editions[1], cover: null }] })).toThrow();
  });
  it("does not let a malformed NL edition's colliding raw ID invalidate verified DE", async () => {
    const f = await fixture();
    await f.write("data/editorial/weekly-publications/2026-10-05.json", JSON.stringify({ ...f.publication,
      editions: [f.editions[0], { ...f.editions[1], id: f.editions[0].id, cover: null }] }));
    const loaded = await loadWeeklyPublications(f.root);
    expect(loaded.editions.map(row => row.edition.language)).toEqual(["de"]);
    expect(loaded.issues).toEqual([{ week: "2026-10-05", language: "nl", code: "edition-invalid" }]);
    expect(selectPublishedEditions(loaded, new Date("2026-10-08T12:00:00Z")).map(row => row.edition.language)).toEqual(["de"]);
  });
  it("still rejects colliding IDs between schema-valid candidates", async () => {
    const f = await fixture();
    f.editions[1].id = f.editions[0].id;
    await f.save();
    const loaded = await loadWeeklyPublications(f.root);
    expect(loaded.editions).toEqual([]);
    expect(loaded.issues.map(issue => issue.language).sort()).toEqual(["de", "nl"]);
  });
  it("still rejects duplicate schema-valid languages without disabling their unique sibling", async () => {
    const f = await fixture();
    f.publication.editions.push(structuredClone(f.editions[0]));
    await f.save();
    const loaded = await loadWeeklyPublications(f.root);
    expect(loaded.editions.map(row => row.edition.language)).toEqual(["nl"]);
    expect(loaded.issues.map(issue => issue.language)).toEqual(["de", "de"]);
  });
  it("acceptsHistoricalPackage: verifies source validity against the package week, not today", async () => {
    const f = await fixture("2025-12-29", "2026-01-03");
    const loaded = await loadWeeklyPublications(f.root);
    expect(loaded.issues).toEqual([]);
    expect(loaded.editions).toHaveLength(2);
    expect(selectPublishedEditions(loaded, new Date("2026-10-08T12:00:00Z"))).toEqual([]);
  });
  it.each(["pdf", "cover"] as const)("rejectsTraversalAndSymlinks: rejects escaping %s assets", async key => {
    const f = await fixture();
    expect(() => parseWeeklyEdition({ ...f.editions[0], [key]: { ...f.editions[0][key], path: "/handzettel/../outside.pdf" } }, f.publication.week)).toThrow();
    const target = path.join(f.root, `public${f.editions[0][key].path}`);
    await f.write(`outside-${key}`, key === "pdf" ? f.pdfs[0] : f.image);
    await unlink(target);
    await symlink(path.join(f.root, `outside-${key}`), target);
    await expect(verifyWeeklyEdition(f.editions[0], f.root)).rejects.toThrow();
  });
  it.each(["missing", "extra", "duplicate", "wrong-page", "source-hash", "metadata", "image-hash"])("requiresExactCensus: rejects %s reviewed/public offer drift", async mode => {
    const f = await fixture();
    if (mode === "missing") f.offers.splice(0, 1);
    if (mode === "extra") f.offers.push({ ...f.offers[0], id: "extra" });
    if (mode === "duplicate") f.offers.push(f.offers[0]);
    if (mode === "wrong-page") f.sources[0].pages[0].expectedOffers = 2;
    if (mode === "source-hash") f.sources[0].pdfSha256 = "a".repeat(64);
    if (mode === "metadata") f.offers[0].conditions = "Silent correction";
    if (mode === "image-hash") f.offers[0].imageSha256 = "a".repeat(64);
    // Re-seal the row checksum to prove structural/canonical checks are independent of it.
    f.editions[0].offersSha256 = sha256(JSON.stringify(f.offers.filter(row => row.language === "de").sort((a, b) => a.id.localeCompare(b.id))));
    await f.save();
    await expect(verifyWeeklyEdition(f.editions[0], f.root)).rejects.toThrow();
  });
  it("accepts complete source-bound local original offers with real assets", async () => {
    const f = await fixture();
    const loaded = await loadWeeklyPublications(f.root);
    expect(loaded.issues).toEqual([]);
    expect(loaded.editions.flatMap(x => x.offers).map(x => x.id)).toEqual(["de-2026-10-05-p1", "de-2026-10-05-p2", "nl-2026-10-05-p1"]);
    expect(JSON.stringify(loaded.editions.flatMap(x => x.offers))).not.toMatch(/canva|privatePdf|designId/);
  });
  it("hashes the complete public rows sorted by ID independently of layout and manifest order", async () => {
    const f = await fixture();
    f.sources[0].pages[0].offers[0].id = "z-last";
    f.sources[0].pages[1].offers[0].id = "a-first";
    f.sources[0].pages[0].offers[0].imagePath = "/images/offers/z-last.webp";
    f.sources[0].pages[1].offers[0].imagePath = "/images/offers/a-first.webp";
    f.offers[0].id = "z-last"; f.offers[0].image = "/images/offers/z-last.webp";
    f.offers[1].id = "a-first"; f.offers[1].image = "/images/offers/a-first.webp";
    f.editions[0].offerIds = ["z-last", "a-first"];
    f.editions[0].offersSha256 = sha256(JSON.stringify([f.offers[1], f.offers[0]]));
    await f.write("public/images/offers/z-last.webp", f.crop);
    await f.write("public/images/offers/a-first.webp", f.crop);
    await f.save();
    expect((await verifyWeeklyEdition(f.editions[0], f.root)).offers.map(row => row.id)).toEqual(["a-first", "z-last"]);
  });
  it("uses canonical metadata key order rather than the serialized public JSON key order", async () => {
    const f = await fixture();
    f.offers[0] = Object.fromEntries(Object.entries(f.offers[0]).reverse()) as typeof f.offers[number];
    await f.save();
    await expect(verifyWeeklyEdition(f.editions[0], f.root)).resolves.toMatchObject({ edition: { language: "de" } });
  });
  it("rejects source regions outside the reviewed original crop even when public metadata agrees", async () => {
    const f = await fixture();
    const regions = [[0, 0, 4, 3]];
    Object.assign(f.sources[0].pages[0].offers[0], { sourceRegions: regions });
    const { imageSha256, ...row } = f.offers[0];
    const { pdfSha256, sourceUrl, rightsStatus, reviewedAt, conditions, ...head } = row;
    Object.assign(f.offers[0], { sourceRegions: regions });
    f.editions[0].offersSha256 = sha256(JSON.stringify([{ ...head, sourceRegions: regions, pdfSha256, sourceUrl, rightsStatus, reviewedAt, conditions, imageSha256 }, f.offers[1]]));
    await f.save();
    await expect(verifyWeeklyEdition(f.editions[0], f.root)).rejects.toThrow(/region/i);
  });
  it.each(["metadata-hash", "metadata-identity", "flyer-binding", "cover-bytes", "cover-decode", "offer-decode", "offer-size"])("rejects independent original and image integrity drift: %s", async mode => {
    const f = await fixture();
    let edition = f.editions[0];
    if (mode === "metadata-hash") await f.write("data/editorial/official-catalogs/2026-10-05.json", JSON.stringify({ ...f.catalog, fetchedAt: "2026-10-06T12:00:00.000Z" }));
    if (mode === "metadata-identity") { f.catalog.catalogId = "1234567"; const bytes = JSON.stringify(f.catalog); if (edition.source.kind === "trinkgut-official") edition.source.metadataSha256 = sha256(bytes); await f.write("data/editorial/official-catalogs/2026-10-05.json", bytes); }
    if (mode === "flyer-binding") { edition = f.editions[1]; f.flyer.pdfSha256 = "a".repeat(64); }
    if (mode === "cover-bytes") edition.cover.bytes++;
    if (mode === "cover-decode") { const bytes = Buffer.from("not an image"); edition.cover.sha256 = sha256(bytes); edition.cover.bytes = bytes.length; await f.write(`public${edition.cover.path}`, bytes); }
    if (mode === "offer-decode") { const bytes = Buffer.from("not an image"); f.offers[0].imageSha256 = sha256(bytes); await f.write(`public${f.offers[0].image}`, bytes); }
    if (mode === "offer-size") { f.sources[0].pages[0].offers[0].rect = [1, 1, 3, 3]; f.offers[0].rect = [1, 1, 3, 3]; }
    edition.offersSha256 = sha256(JSON.stringify(f.offers.filter(row => row.language === edition.language).sort((a, b) => a.id.localeCompare(b.id))));
    await f.save();
    await expect(verifyWeeklyEdition(edition, f.root)).rejects.toThrow();
  });
  it("does not turn a missing counterpart into an integrity error or suppress verified DE", async () => {
    const f = await fixture();
    f.publication.editions.splice(1, 1);
    await f.save();
    const loaded = await loadWeeklyPublications(f.root);
    expect(loaded.issues).toEqual([]);
    expect(selectPublishedEditions(loaded, new Date("2026-10-08T12:00:00Z")).map(row => row.edition.language)).toEqual(["de"]);
    expect(loaded.issues).toEqual([]);
  });
  it.each([
    ["2026-10-04T21:59:59Z", 0], ["2026-10-04T22:00:00Z", 2],
    ["2026-10-10T21:59:59Z", 2], ["2026-10-10T22:00:00Z", 0],
  ])("selects anew at Berlin validity boundaries %s", async (now, count) => {
    const f = await fixture();
    const loaded = await loadWeeklyPublications(f.root);
    expect(selectPublishedEditions(loaded, new Date(now))).toHaveLength(count);
  });
  it.each([
    ["2026-09-28", "2026-10-02", "1384969", "4"],
    ["2026-09-28", "2026-10-02", "1384969", "5"],
    ["2026-10-26", "2026-10-31", "1390117", "1"],
  ])("preserves reviewed KW40 and standard post-DST validity %s/%s", async (week, to, id, version) => {
    const f = await fixture(week, to, id, version);
    expect((await loadWeeklyPublications(f.root)).issues).toEqual([]);
  });
  it.each([
    { schemaVersion: 2 }, { week: "2026-10-06" }, { extra: true },
  ])("rejects an unknown version, non-Monday, or extra header key %j", async override => {
    const f = await fixture();
    expect(() => parseWeeklyPublication({ ...f.publication, ...override })).toThrow();
  });
  it.each([
    { source: { kind: "canva", flyerId: "nl-2026-10-05", sourceUrl: "private" } },
    { validTo: "2026-10-09" }, { pageCount: 2 }, { offerIds: ["same", "same"] },
    { review: { reviewedAt: "invalid", printedValidFrom: "2026-10-05", printedValidTo: "2026-10-10", pageOfferCounts: [1] } },
    { pdf: { path: "/handzettel/nl.pdf", sha256: "a".repeat(64), bytes: 50 * 1024 * 1024 + 1 } },
  ])("rejects unsafe or inconsistent edition metadata %j", async override => {
    const f = await fixture();
    expect(() => parseWeeklyEdition({ ...f.editions[1], ...override }, f.publication.week)).toThrow();
  });
  it("rejects duplicate edition IDs and languages", async () => {
    const f = await fixture();
    expect(() => parseWeeklyPublication({ ...f.publication, editions: [f.editions[0], f.editions[0]] })).toThrow();
  });
  it("rejects a rehashed multi-page NL PDF", async () => {
    const f = await fixture();
    const doc = await PDFDocument.create(); doc.addPage(); doc.addPage();
    const bytes = Buffer.from(await doc.save());
    f.editions[1].pdf = { ...f.editions[1].pdf, sha256: sha256(bytes), bytes: bytes.length };
    f.flyer.pdfSha256 = sha256(bytes);
    await f.write(`public${f.editions[1].pdf.path}`, bytes);
    await f.save();
    await expect(verifyWeeklyEdition(f.editions[1], f.root)).rejects.toThrow();
  });
  it("reports unreadable headers as week errors and invalid filenames as unassignable issues", async () => {
    const f = await fixture();
    await f.write("data/editorial/weekly-publications/2026-10-05.json", "not json");
    await f.write("data/editorial/weekly-publications/not-a-week.json", "{}");
    const loaded = await loadWeeklyPublications(f.root);
    expect(loaded.editions).toEqual([]);
    expect(loaded.issues).toEqual([{ week: "2026-10-05", code: "week-invalid" }, { week: null, code: "week-invalid" }]);
  });
  it("caches immutable checks per production root without freezing time selection", async () => {
    const f = await fixture();
    vi.stubEnv("NODE_ENV", "production");
    const loaded = await loadWeeklyPublications(f.root);
    await f.write(`public${f.editions[1].pdf.path}`, "changed after validation");
    expect(await loadWeeklyPublications(f.root)).toBe(loaded);
    expect(selectPublishedEditions(loaded, new Date("2026-10-08T12:00:00Z"))).toHaveLength(2);
    expect(selectPublishedEditions(loaded, new Date("2026-10-10T22:00:00Z"))).toEqual([]);
  });
});
