import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rm } from "node:fs/promises";
vi.mock("server-only",()=>({}));
const boundary=vi.hoisted(()=>({load:vi.fn()}));
vi.mock("@/lib/weekly-publication",async original=>({...await original<typeof import("@/lib/weekly-publication")>(),loadWeeklyPublications:boundary.load}));
import { weeklyPublicationFixture } from "./fixtures/weekly-publication";
import { GET as offersGET } from "@/app/api/content/offers/route";
import { GET,POST } from "@/app/api/handzettel/fetch/route";
import { GET as cronGET } from "@/app/api/handzettel/cron/route";
const roots:string[]=[];
beforeEach(()=>{vi.useFakeTimers({toFake:["Date"]});vi.setSystemTime(new Date("2026-10-08T12:00:00Z"));boundary.load.mockResolvedValue({editions:[],issues:[]});});
afterEach(async()=>{vi.useRealTimers();vi.unstubAllEnvs();vi.restoreAllMocks();for(const root of roots.splice(0)) await rm(root,{recursive:true,force:true});});
describe("public weekly routes",()=>{
  it("returns the exact sanitized offer DTO with no-store and no external fetch",async()=>{
    const f=await weeklyPublicationFixture();roots.push(f.root);
    const actual=await vi.importActual<typeof import("@/lib/weekly-publication")>("@/lib/weekly-publication");
    boundary.load.mockResolvedValue(await actual.loadWeeklyPublications(f.root));
    const network=vi.spyOn(globalThis,"fetch").mockRejectedValue(new Error("offline"));
    const response=await offersGET();
    expect(response.status).toBe(200);expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body=await response.json();expect(Object.keys(body).sort()).toEqual(["flyers","generatedAt","issues","offers","status"]);
    expect(body.offers).toHaveLength(3);expect(JSON.stringify(body)).not.toMatch(/canva\.com|designId|reviewedAt|privatePdf|sourceImage/);
    expect(network).not.toHaveBeenCalled();
    const compatibility=await GET(new Request("https://example.test/api/handzettel/fetch"));
    const catalog=await compatibility.json();
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
