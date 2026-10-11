import { describe, expect, it } from "vitest";
import {selectWeeklyOffers as select} from "@/lib/catalog";
import offers from "@/data/weekly-offers.json";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import { loadWeeklyPublications } from "@/lib/weekly-publication";
import { selectWeeklyOfferContent } from "@/lib/weekly-offer-selection";
import { rm } from "node:fs/promises";
import { assembleWeeklyPublication } from "@/lib/official-publication-import";
import { assembleSupplementalPublication } from "@/lib/supplemental-publication-import";
import { loadSupplementalPublications, selectSupplementalEditions } from "@/lib/supplemental-publication";
import { supplementalPublicationFixture } from "./fixtures/supplemental-publication";

const LOCAL_DE_PDF = "/handzettel/2026/de-2026-10-05-be4b243ec0ddb84bee38054f051702a670ea8871fc897584190aefd9b8b4642a.pdf";

describe("current flyer-only assortment", () => {
  it.each([false,true])("keeps same-date Maasduinen separate from main-week assortment selection (missing main NL: %s)",async missingNl=>{
    // A same-date supplement must neither displace the agency weekly original
    // nor satisfy the main selector's mandatory NL slot when that original is absent.
    const f=await supplementalPublicationFixture("2026-10-12","2026-10-25","2026-10-12","2026-10-17");
    try {
      if(missingNl){f.sources.splice(1,1);f.offers.splice(2,1);await f.save();}
      await assembleWeeklyPublication("2026-10-12",f.root);
      await assembleSupplementalPublication("maasduinen-synthetic",f.root);
      const now=new Date("2026-10-14T12:00:00Z");
      const supplemental=selectSupplementalEditions(await loadSupplementalPublications(f.root),now);
      expect(supplemental.map(({edition})=>edition.id)).toEqual(["maasduinen-synthetic"]);
      expect(supplemental[0].offers.map(offer=>offer.id)).toEqual(["maasduinen-synthetic-p1"]);
      const content=selectWeeklyOfferContent(await loadWeeklyPublications(f.root),now);
      expect(content.flyers.map(flyer=>flyer.id)).toEqual(missingNl?["de-2026-10-12"]:["de-2026-10-12","nl-2026-10-12"]);
      expect(content.issues).toEqual(missingNl?["nl-flyer-missing"]:[]);
      expect(content.status).toBe(missingNl?"degraded":"ok");
      const expectedIds=missingNl?["de-2026-10-12-p1","de-2026-10-12-p2"]:["de-2026-10-12-p1","de-2026-10-12-p2","nl-2026-10-12-p1"];
      expect(content.offers.map(offer=>offer.id)).toEqual(expectedIds);
      expect(select(f.offers,content.flyers,now,"alkoholfrei").map(offer=>offer.id)).toEqual(expectedIds);
    } finally {await rm(f.root,{recursive:true,force:true});}
  });
  it("publishes the complete reviewed KW41 through verified local originals", async () => {
    const loaded = await loadWeeklyPublications();
    expect(loaded.issues).toEqual([]);
    const content = selectWeeklyOfferContent(loaded, new Date("2026-10-08T12:00:00Z"));
    expect(content.offers.filter(offer => offer.language === "de")).toHaveLength(107);
    expect(content.offers.filter(offer => offer.language === "nl")).toHaveLength(21);
    expect(content.flyers).toHaveLength(2);
    expect(content.flyers.every(flyer => flyer.pdfUrl.startsWith("/handzettel/"))).toBe(true);
    expect(content.flyers.map(flyer => [flyer.language, flyer.title, flyer.pageCount])).toEqual([
      ["de", "Angebote der Woche", 18],
      ["nl", "Nederlandse weekaanbiedingen · KW 41", 1],
    ]);
    for (const [category, de, nl] of [
      ["bier", 21, 4], ["wein", 16, 2], ["alkoholfrei", 25, 4],
      ["spirituosen", 37, 9], ["lebensmittel", 4, 1], ["sekt", 4, 1],
    ] as const) {
      expect(content.offers.filter(offer => offer.categorySlug === category && offer.language === "de")).toHaveLength(de);
      expect(content.offers.filter(offer => offer.categorySlug === category && offer.language === "nl")).toHaveLength(nl);
    }
  });
  it.each(["de", "nl"])("binds %s crops to the original hash even with an unchanged URL and ID", language => {
    const flyer = {id:"same", language, validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:"/handzettel/same.pdf",pdfSha256:"new"};
    const crop = {flyerId:"same",language,validFrom:flyer.validFrom,validTo:flyer.validTo,categorySlug:"bier",sourceUrl:flyer.pdfUrl,pdfSha256:"old"};
    expect(select([crop],[flyer],new Date("2026-10-08T12:00:00Z"))).toEqual([]);
  });
  it("covers every priced panel on all 18 pages of the reviewed DE original", () => {
    const actual = select(offers, [{id:"catalog-13027-41-2026",language:"de",validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:LOCAL_DE_PDF,pdfSha256:"be4b243ec0ddb84bee38054f051702a670ea8871fc897584190aefd9b8b4642a"}], new Date("2026-10-08T12:00:00Z"));
    // Independent visual page census; page 6 has no individually priced product panel.
    const counts = Array.from({length:18}, (_, index) => actual.filter(offer => offer.sourcePage === index + 1).length);
    expect(counts).toEqual([10,10,9,9,10,0,1,4,9,8,5,5,4,5,5,5,7,1]);
    expect(actual).toHaveLength(107);
  });
  it("makes every approved NL product panel available, not just the former nine-panel selection", () => {
    const actual = select(offers, [{id:"nl-2026-10-05",language:"nl",validFrom:"2026-10-05",validTo:"2026-10-10",pdfSha256:"65fedf4c7016dfd91229ee5f0e2221b0d08aae4090572df0c35bb674c46db7d4"}], new Date("2026-10-08T12:00:00Z"));
    // Independently counted against the complete approved one-page original.
    expect(actual).toHaveLength(21);
    for (const name of ["Label 5", "Havana Club", "Grand Sud", "Pepsi", "Active O2", "Chipsfrisch", "Hertog Jan", "Krombacher"]) {
      expect(actual.some(offer => offer.name.includes(name))).toBe(true);
    }
  });
  it("selects only entries whose exact source is active, in the requested category", () => {
    const rows=[{id:"a",flyerId:"de-41",language:"de",validFrom:"2026-10-05",validTo:"2026-10-10",categorySlug:"bier",pdfSha256:"a"},{id:"b",flyerId:"nl-41",language:"nl",validFrom:"2026-10-05",validTo:"2026-10-10",categorySlug:"wein",pdfSha256:"a"}];
    expect(select(rows,[{id:"de-41",language:"de",validFrom:"2026-10-05",validTo:"2026-10-10",pdfSha256:"a"}],new Date("2026-10-08T12:00:00Z"),"bier").map(x=>x.id)).toEqual(["a"]);
  });
  it("hides expired and not-yet-started offer crops at Berlin boundaries", () => {
    const rows=[{id:"a",flyerId:"de-41",language:"de",validFrom:"2026-10-05",validTo:"2026-10-10",categorySlug:"bier",pdfSha256:"a"}];
    const flyers=[{id:"de-41",language:"de",validFrom:"2026-10-05",validTo:"2026-10-10",pdfSha256:"a"}];
    expect(select(rows,flyers,new Date("2026-10-10T21:59:59Z")).map(x=>x.id)).toEqual(["a"]);
    expect(select(rows,flyers,new Date("2026-10-04T21:59:59Z"))).toEqual([]);
    expect(select(rows,flyers,new Date("2026-10-10T22:00:00Z"))).toEqual([]);
    expect(select(rows,[],new Date("2026-10-08T12:00:00Z"))).toEqual([]);
  });
  it.each(["de","nl"])("hides %s offer crops without an original version identifier", language=>{
    const original={id:"week-41",language,validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:"https://example.com/v1.pdf",pdfSha256:"a"};
    const crop={flyerId:original.id,language,validFrom:original.validFrom,validTo:original.validTo,categorySlug:"bier"};
    expect(select([crop],[original],new Date("2026-10-08T12:00:00Z"))).toEqual([]);
  });
  it("does not reuse offer crops when an original changes within the same week",()=>{
    const original={id:"de-41",language:"de",validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:"https://example.com/catalog/v2.pdf"};
    const crop={flyerId:original.id,language:"de",validFrom:original.validFrom,validTo:original.validTo,categorySlug:"bier",sourceUrl:"https://example.com/catalog/v1.pdf"};
    expect(select([crop],[original],new Date("2026-10-08T12:00:00Z"))).toEqual([]);
    expect(select([{...crop,language:"nl",pdfSha256:"a"}],[{...original,language:"nl",pdfSha256:"b"}],new Date("2026-10-08T12:00:00Z"))).toEqual([]);
  });
  it.each(offers)("keeps the verified original crop for $id",offer=>{
    expect(createHash("sha256").update(readFileSync("public"+offer.image)).digest("hex")).toBe(offer.imageSha256);
    expect(offer.pdfSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(offer.rightsStatus).toBe("approved");
  });
});
