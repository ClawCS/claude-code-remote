import { afterEach, describe, expect, it, vi } from "vitest";
import { rm } from "node:fs/promises";
vi.mock("server-only", () => ({}));
import { weeklyPublicationFixture } from "./fixtures/weekly-publication";
import { supplementalPublicationFixture } from "./fixtures/supplemental-publication";
import { loadSupplementalPublications } from "@/lib/supplemental-publication";
import { loadWeeklyPublications } from "@/lib/weekly-publication";
import { createWeeklyOfferContentLoader, mapPublishedEditionToFlyer } from "@/lib/weekly-offer-content";
import { sha256 } from "./fixtures/weekly-publication";
const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
const now = new Date("2026-10-08T12:00:00Z");
async function fixture() { const f = await weeklyPublicationFixture(); roots.push(f.root); return f; }
describe("verified public weekly content", () => {
  it("projects only the source-reviewed summary into public content within the publication window", async () => {
    const f=await fixture();
    const summary={price:"4,99 €",package:"12 × 0,75 l Glas",deposit:"zzgl. 3,30 € Pfand",unitPrice:"0,55 €/l"};
    Object.assign(f.sources[0].pages[0].offers[0],{summary});
    const {imageSha256,...metadata}=f.offers[0];
    f.offers[0]={...metadata,summary,imageSha256} as typeof f.offers[number];
    f.editions[0].offersSha256=sha256(JSON.stringify(f.offers.filter(o=>o.language==="de")));
    await f.save();
    const loader=createWeeklyOfferContentLoader(()=>loadWeeklyPublications(f.root),()=>loadSupplementalPublications(f.root));
    const current=await loader(now);
    expect(current.status).toBe("ok");expect(current.offers[0]).toMatchObject({summary});
    expect(current.offers[1]).not.toHaveProperty("summary");
    expect((await loader(new Date("2026-10-04T14:00:00Z"))).offers[0]).toMatchObject({summary,validFrom:"2026-10-05"});
    for(const time of ["2026-10-04T13:59:59Z","2026-10-10T22:00:00Z"])expect((await loader(new Date(time))).offers).toEqual([]);
  });
  it("keeps main requirements separate while adding every independently active supplemental offer", async () => {
    const f = await supplementalPublicationFixture(); roots.push(f.root);
    const weekly = await loadWeeklyPublications(f.root);
    const supplements = await loadSupplementalPublications(f.root);
    const content = await createWeeklyOfferContentLoader(async () => weekly, async () => supplements)(now);
    expect(content.status).toBe("ok");
    expect(content.flyers.map(f => [f.id, f.purpose, f.medium])).toEqual([
      ["de-2026-10-05", "weekly", "trinkgut"], ["nl-2026-10-05", "weekly", "legacy-canva"], ["maasduinen-synthetic", "supplemental", "maasduinen"],
    ]);
    expect(content.offers.map(o => o.id)).toEqual(["de-2026-10-05-p1", "de-2026-10-05-p2", "nl-2026-10-05-p1", "maasduinen-synthetic-p1"]);
    const missing = await createWeeklyOfferContentLoader(async () => ({...weekly, editions:weekly.editions.filter(x => x.edition.language === "de")}), async () => supplements)(now);
    expect(missing.issues).toEqual(["nl-flyer-missing"]);
    expect(missing.flyers.map(f => f.id)).toEqual(["de-2026-10-05", "maasduinen-synthetic"]);
    const expired = await createWeeklyOfferContentLoader(async () => ({editions:[], issues:[]}), async () => supplements)(new Date("2026-10-18T22:00:00Z"));
    expect(expired.flyers).toEqual([]); expect(expired.offers).toEqual([]);
  });
  it("isolates a corrupt supplement without poisoning healthy weekly originals", async () => {
    const f = await supplementalPublicationFixture(); roots.push(f.root);
    await f.write(`data/editorial/supplemental-publications/${f.supplemental.edition.id}.json`, "broken");
    const content = await createWeeklyOfferContentLoader(() => loadWeeklyPublications(f.root), () => loadSupplementalPublications(f.root))(now);
    expect(content.issues).toEqual(["supplemental-edition-invalid"]);
    expect(content.flyers.map(f => f.id)).toEqual(["de-2026-10-05", "nl-2026-10-05"]);
    expect(content.offers).toHaveLength(3);
  });
  it("fails both streams closed when either loader observes the durable preparation lock", async () => {
    const f=await supplementalPublicationFixture(); roots.push(f.root);
    const weekly=await loadWeeklyPublications(f.root), supplements=await loadSupplementalPublications(f.root);
    const content=await createWeeklyOfferContentLoader(async()=>weekly,async()=>({...supplements,issues:[{register:"supplemental",code:"preparation-incomplete"}]}))(now);
    expect(content.flyers).toEqual([]);expect(content.offers).toEqual([]);
  });
  it("reports unassignable supplemental corruption without invalidating a separately verified sibling",async()=>{
    const f=await supplementalPublicationFixture();roots.push(f.root);
    const weekly=await loadWeeklyPublications(f.root),supplements=await loadSupplementalPublications(f.root);
    const content=await createWeeklyOfferContentLoader(async()=>weekly,async()=>({...supplements,issues:[{register:"supplemental",code:"edition-invalid"}]}))(now);
    expect(content.status).toBe("degraded");expect(content.issues).toEqual(["supplemental-edition-invalid"]);
    expect(content.flyers.map(f=>f.id)).toEqual(["de-2026-10-05","nl-2026-10-05","maasduinen-synthetic"]);
  });
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
