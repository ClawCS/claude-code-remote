import { describe, expect, it } from "vitest";
import {selectWeeklyOffers as select} from "@/lib/catalog";
import offers from "@/data/weekly-offers.json";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";

describe("current flyer-only assortment", () => {
  it("covers every priced panel on all 18 pages of the reviewed DE original", () => {
    const actual = select(offers, [{id:"catalog-13027-41-2026",language:"de",validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:"https://werbung.trinkgut.de/frontend/catalogs/1390117/1/pdf/complete.pdf",pdfSha256:"be4b243ec0ddb84bee38054f051702a670ea8871fc897584190aefd9b8b4642a"}], new Date("2026-10-08T12:00:00Z"));
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
