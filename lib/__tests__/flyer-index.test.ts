import { afterEach, describe, expect, it, vi } from "vitest";
import official from "@/e2e/fixtures/handzettel-cache.json";
const mocks=vi.hoisted(()=>({official:vi.fn(),packages:vi.fn()}));
vi.mock("@/lib/handzettel-catalog",async importOriginal=>({...await importOriginal<typeof import("@/lib/handzettel-catalog")>(),loadValidatedHandzettelCache:mocks.official}));
vi.mock("@/lib/flyer-packages",async importOriginal=>({...await importOriginal<typeof import("@/lib/flyer-packages")>(),loadFlyerPackages:mocks.packages}));
import { getFlyerIndex } from "@/lib/flyer-index";
const nl={id:"nl-2026-07-13",language:"nl" as const,title:"Aanbiedingen",validFrom:"2026-07-13",validTo:"2026-07-18",sourceUrl:"https://www.canva.com/design/test/view",designId:"test",pageNumbers:[1],rightsStatus:"approved" as const,exportedAt:"2026-07-12T15:00:00Z",pdfPath:"/handzettel/2026/nl.pdf",coverPath:"/images/content/nl.webp",pdfSha256:"a".repeat(64),coverSha256:"b".repeat(64)};
afterEach(()=>vi.restoreAllMocks());
describe("flyer index reports runtime integrity failures",()=>{
  it("does not demand expired offers on the reviewed KW40 holiday Saturday",async()=>{
    mocks.official.mockResolvedValue(null);mocks.packages.mockResolvedValue([]);
    const index=await getFlyerIndex(new Date("2026-10-03T12:00:00Z"));
    expect(index.status).toBe("ok");expect(index.issues).toEqual([]);expect(index.flyers).toEqual([]);
  });
  it("continues demanding both weekly sources on an ordinary Saturday",async()=>{
    mocks.official.mockResolvedValue(null);mocks.packages.mockResolvedValue([]);
    const index=await getFlyerIndex(new Date("2026-10-10T12:00:00Z"));
    expect(index.status).toBe("degraded");expect(index.issues).toEqual(["official-flyer-missing","nl-flyer-missing"]);
  });
  it("allows a valid empty selection on Sunday outside the weekly offer period",async()=>{
    mocks.official.mockResolvedValue(null);mocks.packages.mockResolvedValue([]);
    const index=await getFlyerIndex(new Date("2026-10-04T12:00:00Z"));
    expect(index.status).toBe("ok");expect(index.issues).toEqual([]);
  });
  it("reports a missing mandatory official flyer during the active week",async()=>{
    mocks.official.mockResolvedValue(null);mocks.packages.mockResolvedValue([]);
    const index=await getFlyerIndex(new Date("2026-09-30T12:00:00Z"));
    expect(index.status).toBe("degraded");expect(index.issues).toEqual(["official-flyer-missing","nl-flyer-missing"]);
    expect(index.flyers).toEqual([]);
  });
  it("retains the official DE flyer while reporting the missing mandatory NL issue",async()=>{
    mocks.official.mockResolvedValue(official);mocks.packages.mockResolvedValue([]);
    const index=await getFlyerIndex(new Date("2026-07-14T12:00:00Z"));
    expect(index.status).toBe("degraded");expect(index.issues).toEqual(["nl-flyer-missing"]);
    expect(index.flyers.map(f=>f.language)).toEqual(["de"]);
  });
  it("publishes one complete current NL page alongside DE",async()=>{
    mocks.official.mockResolvedValue(official);mocks.packages.mockResolvedValue([nl]);
    const index=await getFlyerIndex(new Date("2026-07-14T12:00:00Z"));
    expect(index.status).toBe("ok");expect(index.flyers.map(f=>[f.language,f.pageCount,f.coverUrl])).toEqual([["de",10,official.pages[0].imageUrl],["nl",1,"/images/content/nl.webp"]]);
    expect(index.flyers.find(f=>f.language==="nl")?.pdfSha256).toBe(nl.pdfSha256);
  });
  it("does not accept two NL pages as one complete weekly issue",async()=>{
    mocks.official.mockResolvedValue(official);mocks.packages.mockResolvedValue([nl,{...nl,id:"another-nl"}]);
    const index=await getFlyerIndex(new Date("2026-07-14T12:00:00Z"));
    expect(index.issues).toEqual(["nl-flyer-missing"]);expect(index.flyers.map(f=>f.language)).toEqual(["de"]);
  });
  it.each([
    {validFrom:"2026-07-06",validTo:"2026-07-11"},
    {validFrom:"2026-07-20",validTo:"2026-07-25"},
    {validFrom:"2026-07-14",validTo:"2026-07-18"},
    {validFrom:"2026-07-13",validTo:"2026-07-17"},
    {validFrom:"2026-07-06",validTo:"2026-07-18"},
  ])("withholds a wrong or partial-week NL issue: %j",async dates=>{
    mocks.official.mockResolvedValue(official);mocks.packages.mockResolvedValue([{...nl,...dates}]);
    const index=await getFlyerIndex(new Date("2026-07-14T12:00:00Z"));
    expect(index.issues).toContain("nl-flyer-missing");expect(index.flyers.map(f=>f.language)).toEqual(["de"]);
  });
  it("withholds corrupted packages but exposes degraded status and logs no private details",async()=>{
    mocks.official.mockResolvedValue(null);mocks.packages.mockRejectedValue(new Error("private/path/details"));
    const log=vi.spyOn(console,"error").mockImplementation(()=>{});
    const index=await getFlyerIndex(new Date("2026-10-04T12:00:00Z"));
    expect(index.status).toBe("degraded");expect(index.issues).toEqual(["local-flyer-integrity"]);expect(index.flyers).toEqual([]);
    expect(log).toHaveBeenCalledTimes(1);expect(JSON.stringify(log.mock.calls)).not.toContain("private/path/details");
  });
});
