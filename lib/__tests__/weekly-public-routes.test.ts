import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rm } from "node:fs/promises";
vi.mock("server-only",()=>({}));
const boundary=vi.hoisted(()=>({load:vi.fn(),supplemental:vi.fn()}));
vi.mock("@/lib/weekly-publication",async original=>({...await original<typeof import("@/lib/weekly-publication")>(),loadWeeklyPublications:boundary.load}));
vi.mock("@/lib/supplemental-publication",async original=>({...await original<typeof import("@/lib/supplemental-publication")>(),loadSupplementalPublications:boundary.supplemental}));
import { supplementalPublicationFixture } from "./fixtures/supplemental-publication";
import { GET as currentGET } from "@/app/api/content/current/route";
import { GET as flyersGET } from "@/app/api/content/flyers/route";
import CurrentSection from "@/components/cinematic/CurrentSection";
import NlCurrentSection from "@/components/cinematic/NlCurrentSection";
import FlyerIndexView from "@/components/FlyerIndexView";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { verifyPublishedFlyerMarkup } from "@/lib/content-verification";
import { weeklyPublicationFixture } from "./fixtures/weekly-publication";
import { GET as offersGET } from "@/app/api/content/offers/route";
import { GET,POST } from "@/app/api/handzettel/fetch/route";
import { GET as cronGET } from "@/app/api/handzettel/cron/route";
const roots:string[]=[];
beforeEach(()=>{vi.useFakeTimers({toFake:["Date"]});vi.setSystemTime(new Date("2026-10-08T12:00:00Z"));boundary.load.mockResolvedValue({editions:[],issues:[]});boundary.supplemental.mockResolvedValue({editions:[],issues:[]});});
afterEach(async()=>{vi.useRealTimers();vi.unstubAllEnvs();vi.restoreAllMocks();for(const root of roots.splice(0)) await rm(root,{recursive:true,force:true});});
describe("public weekly routes",()=>{
  it("exposes all Sunday preview offers in both API versions without changing printed dates",async()=>{
    vi.setSystemTime(new Date("2026-10-11T14:00:00Z"));
    const f=await weeklyPublicationFixture("2026-10-12","2026-10-17");roots.push(f.root);
    const actual=await vi.importActual<typeof import("@/lib/weekly-publication")>("@/lib/weekly-publication");
    boundary.load.mockResolvedValue(await actual.loadWeeklyPublications(f.root));
    for(const headers of [new Headers(),new Headers({"X-Jammers-Content-Version":"2"})]) {
      const response=await offersGET(new Request("https://example.test/api/content/offers",{headers}));
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(response.headers.get("Vary")).toBe("X-Jammers-Content-Version");
      const body=await response.json();
      expect(body.offers).toHaveLength(3);
      expect(body.offers.every((o:{validFrom:string;validTo:string})=>o.validFrom==="2026-10-12"&&o.validTo==="2026-10-17")).toBe(true);
    }
  });
  it("exposes complete active original ID parity across all three APIs and four flyer compositions",async()=>{
    const f=await supplementalPublicationFixture();roots.push(f.root);
    const weekly=await vi.importActual<typeof import("@/lib/weekly-publication")>("@/lib/weekly-publication");
    const supplemental=await vi.importActual<typeof import("@/lib/supplemental-publication")>("@/lib/supplemental-publication");
    boundary.load.mockResolvedValue(await weekly.loadWeeklyPublications(f.root));boundary.supplemental.mockResolvedValue(await supplemental.loadSupplementalPublications(f.root));
    const current=await (await currentGET()).json(), index=await (await flyersGET()).json();
    const offers=await (await offersGET(new Request("https://example.test/api/content/offers",{headers:{"X-Jammers-Content-Version":"2"}}))).json();
    const expected=["de-2026-10-05","nl-2026-10-05","maasduinen-synthetic"];
    expect(index.flyers.map((f:{id:string})=>f.id)).toEqual(expected);
    expect(offers.flyers.map((f:{id:string})=>f.id)).toEqual(expected);
    expect([current.flyer.id,current.nlFlyer.id,...current.supplementalFlyers.map((f:{id:string})=>f.id)]).toEqual(expected);
    for (const [route,view] of [["/",createElement(CurrentSection,{content:current})],["/angebote",createElement(FlyerIndexView,{index,showOverviewLink:true})],["/handzettel",createElement(FlyerIndexView,{index})],["/nl",createElement(NlCurrentSection,{index})]] as const) {
      expect(verifyPublishedFlyerMarkup(index.flyers,renderToStaticMarkup(view),route)).toEqual([]);
    }
  });
  it("returns the exact sanitized offer DTO with no-store and no external fetch",async()=>{
    const f=await weeklyPublicationFixture();roots.push(f.root);
    const actual=await vi.importActual<typeof import("@/lib/weekly-publication")>("@/lib/weekly-publication");
    boundary.load.mockResolvedValue(await actual.loadWeeklyPublications(f.root));
    const network=vi.spyOn(globalThis,"fetch").mockRejectedValue(new Error("offline"));
    const response=await offersGET(new Request("https://example.test/api/content/offers"));
    expect(response.status).toBe(200);expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Vary")).toBe("X-Jammers-Content-Version");
    const body=await response.json();expect(Object.keys(body).sort()).toEqual(["flyers","generatedAt","issues","offers","status"]);
    expect(body.offers).toHaveLength(3);expect(JSON.stringify(body)).not.toMatch(/canva\.com|designId|reviewedAt|privatePdf|sourceImage/);
    expect(body.flyers[0]).not.toHaveProperty("purpose");
    const typed=await (await offersGET(new Request("https://example.test/api/content/offers",{headers:{"X-Jammers-Content-Version":"2"}}))).json();
    expect(typed.flyers[0]).toMatchObject({purpose:"weekly",medium:"trinkgut"});
    expect(typed.offers).toEqual(body.offers);
    expect(network).not.toHaveBeenCalled();
    const compatibility=await GET(new Request("https://example.test/api/handzettel/fetch"));
    const catalog=await compatibility.json();
    expect(catalog).not.toHaveProperty("purpose");expect(catalog).not.toHaveProperty("medium");
    expect(catalog).toMatchObject({status:"ok",pdfUrl:"/handzettel/2026-10-05/de.pdf",pageCount:2});
    expect(catalog.pages).toEqual([{number:1,imageUrl:"/images/content/2026-10-05/de.webp",thumbnailUrl:"/images/content/2026-10-05/de.webp"}]);
  });
  it("does not supply an external newest fallback",async()=>{
    const response=await GET(new Request("https://example.test/api/handzettel/fetch"));
    const body=await response.json();expect(body).toMatchObject({status:"fallback",pageCount:0,pages:[]});
    expect(JSON.stringify(body)).not.toMatch(/https?:|newest/);
  });
  it("blocks authenticated refresh and cron without network or publication mutation",async()=>{
    vi.stubEnv("CRON_SECRET","test-secret");const network=vi.spyOn(globalThis,"fetch").mockRejectedValue(new Error("must not run"));
    for(const response of [await POST(new Request("https://example.test/api/handzettel/fetch",{method:"POST",headers:{Authorization:"Bearer test-secret"}})),await GET(new Request("https://example.test/api/handzettel/fetch?refresh=true",{headers:{Authorization:"Bearer test-secret"}})),await cronGET(new Request("https://example.test/api/handzettel/cron",{headers:{Authorization:"Bearer test-secret"}}))]) {
      expect(response.status).toBe(409);expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(await response.json()).toMatchObject({error:"weekly-publication-required"});
    }
    expect(network).not.toHaveBeenCalled();
  });
});
