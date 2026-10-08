import { describe, expect, it } from "vitest";
import {selectWeeklyOffers as select} from "@/lib/catalog";
import offers from "@/data/weekly-offers.json";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";

describe("current flyer-only assortment", () => {
  it("selects only entries whose exact source is active, in the requested category", () => {
    const rows=[{id:"a",flyerId:"de-41",language:"de",validFrom:"2026-10-05",validTo:"2026-10-10",categorySlug:"bier",sourceUrl:"https://example.com/v1.pdf"},{id:"b",flyerId:"nl-41",language:"nl",validFrom:"2026-10-05",validTo:"2026-10-10",categorySlug:"wein",pdfSha256:"a"}];
    expect(select(rows,[{id:"de-41",language:"de",validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:"https://example.com/v1.pdf"}],new Date("2026-10-08T12:00:00Z"),"bier").map(x=>x.id)).toEqual(["a"]);
  });
  it("hides expired and not-yet-started offer crops at Berlin boundaries", () => {
    const rows=[{id:"a",flyerId:"de-41",language:"de",validFrom:"2026-10-05",validTo:"2026-10-10",categorySlug:"bier",sourceUrl:"https://example.com/v1.pdf"}];
    const flyers=[{id:"de-41",language:"de",validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:"https://example.com/v1.pdf"}];
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
