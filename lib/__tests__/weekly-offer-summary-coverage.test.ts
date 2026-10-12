import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import rawLayout from "@/data/weekly-offer-layout.json";
import { buildPublicOfferMetadata, type ReviewedWeeklyOffer, type WeeklyOfferPublicSource } from "@/lib/weekly-offer-metadata";
import { buildWeeklyOffers } from "@/scripts/build-weekly-offers";
import { loadWeeklyPublications } from "@/lib/weekly-publication";
import { sha256, weeklyPublicationFixture } from "./fixtures/weekly-publication";

const roots: string[] = [];
const layout = rawLayout as unknown as { sources: (WeeklyOfferPublicSource & { pages: { page: number; offers: (ReviewedWeeklyOffer & { imagePath: string })[] }[] })[] };
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

const completeSummary = { price: "1,19 €", package: "1,25 l PET-Flasche", deposit: "zzgl. 0,25 € Pfand", unitPrice: "0,95 €/l" };
const originalOffer: ReviewedWeeklyOffer = {
  id: "de-original", name: "Original offer", categorySlug: "alkoholfrei", conditions: "Printed original conditions",
  rect: [0, 0, 4, 3], sourceDimensions: [4, 3],
};
const originalSource: WeeklyOfferPublicSource = {
  language: "de", flyerId: "reviewed-original", sourceUrl: "https://example.invalid/original.pdf",
  publishedPdfPath: "/handzettel/2026/original.pdf", pdfSha256: "a".repeat(64),
  validFrom: "2026-10-12", validTo: "2026-10-17", reviewedAt: "2026-10-12T12:00:00Z", rightsStatus: "approved",
};

describe("complete summary review for new weekly sources", () => {
  it.each(["2026-10-12", "2026-10-19", "2027-01-04"])("rejects an unreviewed summary in a new weekly source starting %s", validFrom => {
    expect(() => buildPublicOfferMetadata({ ...originalSource, validFrom }, 1, originalOffer, "/images/offers/original.webp")).toThrow(/complete.*summary/i);
  });
  it("does not allow a source warning to bypass the complete-summary requirement", () => {
    expect(() => buildPublicOfferMetadata(originalSource, 1, { ...originalOffer, sourceWarning: "Printed unit is contradictory" }, "/images/offers/original.webp")).toThrow(/complete.*summary/i);
  });
  it("retains historical KW41 compatibility without inventing summary facts", () => {
    const record = buildPublicOfferMetadata({ ...originalSource, validFrom: "2026-10-05", validTo: "2026-10-10" }, 1, originalOffer, "/images/offers/original.webp");
    expect(record).not.toHaveProperty("summary");
    expect(record.conditions).toBe("Printed original conditions");
  });
  it("accepts exact complete facts for a future weekly source", () => {
    const record = buildPublicOfferMetadata({ ...originalSource, validFrom: "2027-01-04" }, 1, { ...originalOffer, summary: completeSummary }, "/images/offers/original.webp");
    expect(record.summary).toEqual(completeSummary);
    expect(record.conditions).toBe("Printed original conditions");
  });
  it("permits descriptive source omissions but never silently adds numeric facts", () => {
    const summary = { ...completeSummary, deposit: "Im Original nicht separat angegeben", unitPrice: "Im Original nicht separat angegeben (1-l-Gebinde)" };
    expect(buildPublicOfferMetadata(originalSource, 1, { ...originalOffer, summary }, "/images/offers/original.webp").summary).toEqual(summary);
  });
  it.each([{ args: ["--week", "2026-10-12"] }, { args: ["--check"] }])("blocks incomplete future CLI review before replacing any rows or bindings: $args", async ({ args }) => {
    const f = await weeklyPublicationFixture("2026-10-12", "2026-10-17", "1399999"); roots.push(f.root);
    delete f.sources[0].pages[0].offers[0].summary;
    await f.save();
    const files = ["data/weekly-offers.json", "data/editorial/weekly-publications/2026-10-12.json", `public${f.offers[0].image}`];
    const before = await Promise.all(files.map(file => readFile(path.join(f.root, file))));
    await expect(buildWeeklyOffers(f.root, args)).rejects.toThrow(/complete.*summary/i);
    expect(await Promise.all(files.map(file => readFile(path.join(f.root, file))))).toEqual(before);
  });
  it("keeps a complete language available when the sibling has an incomplete summary review", async () => {
    const f = await weeklyPublicationFixture("2026-10-12", "2026-10-17", "1399999"); roots.push(f.root);
    delete f.sources[1].pages[0].offers[0].summary;
    delete f.offers[2].summary;
    f.editions[1].offersSha256 = sha256(JSON.stringify([f.offers[2]]));
    await f.save();
    const loaded = await loadWeeklyPublications(f.root);
    expect(loaded.editions.map(item => item.edition.language)).toEqual(["de"]);
    expect(loaded.issues).toEqual([{ week: "2026-10-12", language: "nl", code: "edition-invalid" }]);
  });
});

describe("complete current original-offer summaries", () => {
  it("makes all 82 KW42 original offers readable without relying on crop pixels", () => {
    const sources = layout.sources.filter(source => source.validFrom === "2026-10-12");
    const records = sources.flatMap(source => source.pages.flatMap(page => page.offers.map(offer =>
      buildPublicOfferMetadata(source, page.page, offer as ReviewedWeeklyOffer, offer.imagePath),
    )));
    expect(records).toHaveLength(82);
    expect(records.filter(record => record.language === "de")).toHaveLength(70);
    expect(records.filter(record => record.language === "nl")).toHaveLength(12);
    expect(records.filter(record => !record.summary).map(record => record.id)).toEqual([]);
    for (const record of records) {
      expect(Object.keys(record.summary!)).toEqual(["price", "package", "deposit", "unitPrice"]);
      expect(Object.values(record.summary!).every(value => typeof value === "string" && value.trim().length > 0)).toBe(true);
    }
  });
  it("retains original app prices, both crate variants and printed unit prices together", () => {
    const warsteiner = layout.sources.find(source => source.validFrom === "2026-10-12" && source.language === "de")!.pages[0].offers[0];
    expect(warsteiner.summary).toEqual({ price: "11,99 €; APP-Preis 10,99 €", package: "20 × 0,5 l / 24 × 0,33 l Kasten", deposit: "zzgl. 3,10 € / 3,42 € Pfand", unitPrice: "1,20 / 1,51 €/l; APP 1,10 / 1,39 €/l" });
    expect(warsteiner.conditions).toContain("nur unter diesen APP-Bedingungen");
    expect(warsteiner.conditions).toContain("gelten nicht für Mischkästen");
  });
  it("does not turn two-case or gift calculations into single-case checkout prices", () => {
    const source = layout.sources.find(source => source.validFrom === "2026-10-12" && source.language === "de")!;
    const gerolsteiner = source.pages[0].offers[3];
    expect(gerolsteiner.summary).toMatchObject({ price: "10,00 € für 2 Kästen", package: "2 Kästen à 12 × 0,75 l Glas", deposit: "zzgl. 3,30 € Pfand je Kasten" });
    const andechs = source.pages[3].offers[0];
    expect(andechs.summary).toMatchObject({ price: "18,99 €; rechnerisch 16,41 € je Kasten laut Original", deposit: "zzgl. 3,10 € Pfand; Gratisflaschen ebenfalls zzgl. Pfand" });
    expect(andechs.conditions).toContain("Geschenkabzug 2.58");
    const puelleken = source.pages[4].offers[0];
    expect(puelleken.summary).toMatchObject({ price: "14,99 €; rechnerisch 10,00 € je Kasten laut Original", package: "24 × 0,33 l Kasten; 6 × 0,33 l Pülleken gratis" });
    expect(puelleken.conditions).toContain("Geschenkabzug 4.99");
  });
  it("retains both LEGO prices and does not invent a deposit or unit price", () => {
    const lego = layout.sources.find(source => source.validFrom === "2026-10-12" && source.language === "de")!.pages[6].offers[0];
    expect(lego.summary).toMatchObject({ price: "5,99 € mit 5 APP-Treuepunkten; 11,99 € (UVP) ohne Punkte", deposit: "Im Original nicht separat angegeben (Treueaktionsartikel)", unitPrice: "Im Original nicht separat angegeben (Treueaktionsartikel)" });
    expect(lego.conditions).toContain("Einlösung bis 31.10.2026");
  });
  it("preserves contradictory Dutch values and their source warnings without arithmetic repairs", () => {
    const nl = layout.sources.find(source => source.validFrom === "2026-10-12" && source.language === "nl")!.pages[0].offers;
    expect(nl[0].summary).toMatchObject({ package: "0,25 ml Blik (zo gedrukt; bronwaarschuwing)", unitPrice: "3,96 €/l (zoals gedrukt)" });
    expect(nl[0].sourceWarning).toContain("Keine stillschweigende Korrektur");
    expect(nl[10].summary).toMatchObject({ price: "11,99 €; 10,99 € alleen met de APP", unitPrice: "1,25 / 1,58 €/l (zoals gedrukt); APP-grondprijs niet apart vermeld" });
    expect(nl[11].summary).toMatchObject({ package: "24 × 0,3 ltr. Krat (zoals gedrukt)", unitPrice: "1,40 €/l (zoals gedrukt)" });
    for (const index of [10, 11]) expect(nl[index].sourceWarning).toContain("nicht fest, welcher Wert fehlerhaft ist");
  });
});
