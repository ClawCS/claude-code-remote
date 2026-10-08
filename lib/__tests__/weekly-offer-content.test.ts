import { afterEach, describe, expect, it, vi } from "vitest";
import { rm } from "node:fs/promises";
vi.mock("server-only", () => ({}));
import { weeklyPublicationFixture } from "./fixtures/weekly-publication";
import { loadWeeklyPublications } from "@/lib/weekly-publication";
import { createWeeklyOfferContentLoader, mapPublishedEditionToFlyer } from "@/lib/weekly-offer-content";
const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
const now = new Date("2026-10-08T12:00:00Z");
async function fixture() { const f = await weeklyPublicationFixture(); roots.push(f.root); return f; }
describe("verified public weekly content", () => {
  it("serves complete local originals and crops without leaking private provenance", async () => {
    const f = await fixture();
    const content = await createWeeklyOfferContentLoader(() => loadWeeklyPublications(f.root))(now);
    expect(content.status).toBe("ok");
    expect(content.offers.map(o => o.id)).toEqual(["de-2026-10-05-p1", "de-2026-10-05-p2", "nl-2026-10-05-p1"]);
    expect(mapPublishedEditionToFlyer(f.editions[0]).pdfUrl).toBe("/handzettel/2026-10-05/de.pdf");
    expect(content.flyers[0]).toMatchObject({ viewerUrl: "/handzettel/2026-10-05/de.pdf", sourceUrl: "/handzettel/2026-10-05/de.pdf" });
    expect(Object.keys(content.offers[0]).sort()).toEqual(["categorySlug","conditions","flyerId","id","image","language","name","pdfSha256","rect","sourcePage","sourceUrl","validFrom","validTo"].sort());
    expect(JSON.stringify(content)).not.toMatch(/designId|privatePdf|sourceImage|sourceDimensions|reviewedAt|canva\.com/);
  });
  it("isolates a defective NL original and demands the missing language", async () => {
    const f = await fixture(); await f.write(`public${f.editions[1].pdf.path}`, "broken");
    const content = await createWeeklyOfferContentLoader(() => loadWeeklyPublications(f.root))(now);
    expect(content.status).toBe("degraded"); expect(content.flyers.map(f => f.language)).toEqual(["de"]);
    expect(content.issues).toEqual(["nl-edition-invalid", "nl-flyer-missing"]);
    expect(content.offers).toHaveLength(2);
  });
  it("ignores assigned historical corruption but fails closed for unassignable corruption", async () => {
    const f = await fixture(); const valid = await loadWeeklyPublications(f.root);
    const historical = await createWeeklyOfferContentLoader(async () => ({ ...valid, issues: [{week:"2026-09-28", language:"de", code:"edition-invalid"}] }))(now);
    expect(historical.status).toBe("ok"); expect(historical.offers).toHaveLength(3);
    const unknown = await createWeeklyOfferContentLoader(async () => ({ ...valid, issues: [{week:null, code:"week-invalid"}] }))(now);
    expect(unknown.status).toBe("degraded"); expect(unknown.flyers).toEqual([]); expect(unknown.offers).toEqual([]);
  });
  it.each(["2026-10-04T12:00:00Z","2026-10-10T22:00:00Z","2026-10-03T12:00:00Z"])("does not demand offers outside the publication period: %s", async value => {
    const content = await createWeeklyOfferContentLoader(async () => ({editions:[],issues:[]}))(new Date(value));
    expect(content).toMatchObject({status:"ok",issues:[],flyers:[],offers:[]});
  });
});
