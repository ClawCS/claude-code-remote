import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rm } from "node:fs/promises";
vi.mock("server-only",()=>({}));
const boundary=vi.hoisted(()=>({load:vi.fn(),supplemental:vi.fn()}));
vi.mock("@/lib/weekly-publication",async original=>({...await original<typeof import("@/lib/weekly-publication")>(),loadWeeklyPublications:boundary.load}));
vi.mock("@/lib/supplemental-publication",async original=>({...await original<typeof import("@/lib/supplemental-publication")>(),loadSupplementalPublications:boundary.supplemental}));
import { supplementalPublicationFixture } from "./fixtures/supplemental-publication";
import { weeklyPublicationFixture } from "./fixtures/weekly-publication";
import { getFlyerIndex } from "@/lib/flyer-index";
const roots:string[]=[];
beforeEach(()=>{boundary.load.mockResolvedValue({editions:[],issues:[]});boundary.supplemental.mockResolvedValue({editions:[],issues:[]});});
afterEach(async()=>{for(const root of roots.splice(0)) await rm(root,{recursive:true,force:true});});
async function loaded() {
  const f=await weeklyPublicationFixture();roots.push(f.root);
  const real=await vi.importActual<typeof import("@/lib/weekly-publication")>("@/lib/weekly-publication");
  return real.loadWeeklyPublications(f.root);
}
describe("shared verified flyer selection",()=>{
  it("keeps separately verified future supplement metadata when another manifest cannot be assigned",async()=>{
    const f=await supplementalPublicationFixture();roots.push(f.root);
    const real=await vi.importActual<typeof import("@/lib/supplemental-publication")>("@/lib/supplemental-publication");
    const data=await real.loadSupplementalPublications(f.root);
    boundary.supplemental.mockResolvedValue({...data,issues:[{register:"supplemental",code:"edition-invalid"}]});
    const index=await getFlyerIndex(new Date("2026-10-06T12:00:00Z"));
    expect(index.issues).toContain("supplemental-edition-invalid");
    expect(index.scheduled.map(x=>x.id)).toEqual(["maasduinen-synthetic"]);
  });
  it("lists a supplement's independently dated future metadata then selects it without satisfying main NL",async()=>{
    const f=await supplementalPublicationFixture();roots.push(f.root);
    const real=await vi.importActual<typeof import("@/lib/supplemental-publication")>("@/lib/supplemental-publication");
    boundary.supplemental.mockResolvedValue(await real.loadSupplementalPublications(f.root));
    const future=await getFlyerIndex(new Date("2026-10-06T12:00:00Z"));
    expect(future.scheduled.map(x=>x.id)).toEqual(["maasduinen-synthetic"]);
    const active=await getFlyerIndex(new Date("2026-10-07T12:00:00Z"));
    expect(active.flyers.map(x=>x.id)).toEqual(["maasduinen-synthetic"]);
    expect(active.issues).toEqual(["official-flyer-missing","nl-flyer-missing"]);
  });
  it("fails closed with a sanitized issue if package loading unexpectedly rejects",async()=>{
    boundary.load.mockRejectedValue(new Error("private/path"));
    const index=await getFlyerIndex(new Date("2026-10-08T12:00:00Z"));
    expect(index).toMatchObject({status:"degraded",flyers:[],scheduled:[]});
    expect(index.issues).toContain("week-invalid");expect(JSON.stringify(index)).not.toContain("private/path");
  });
  it.each(["2026-10-03T12:00:00Z","2026-10-04T12:00:00Z"])("does not demand expired offers on holiday Saturday or Sunday: %s",async instant=>{
    expect(await getFlyerIndex(new Date(instant))).toMatchObject({status:"ok",issues:[],flyers:[]});
  });
  it("demands both languages on an ordinary Saturday",async()=>{
    expect(await getFlyerIndex(new Date("2026-10-10T12:00:00Z"))).toMatchObject({status:"degraded",issues:["official-flyer-missing","nl-flyer-missing"]});
  });
  it("keeps valid DE when NL fails; all links are verified local originals",async()=>{
    const data=await loaded();boundary.load.mockResolvedValue({editions:data.editions.filter(x=>x.edition.language==="de"),issues:[{week:"2026-10-05",language:"nl",code:"edition-invalid"}]});
    const index=await getFlyerIndex(new Date("2026-10-08T12:00:00Z"));
    expect(index).toMatchObject({status:"degraded",issues:["nl-edition-invalid","nl-flyer-missing"]});
    expect(index.flyers.map(f=>f.language)).toEqual(["de"]);expect(index.flyers[0].pdfUrl).toBe("/handzettel/2026-10-05/de.pdf");
    expect(JSON.stringify(index)).not.toMatch(/canva\.com|designId|reviewedAt|privatePdf/);
  });
  it("lists only verified future metadata without publishing its crops or original early",async()=>{
    boundary.load.mockResolvedValue(await loaded());
    const sunday=await getFlyerIndex(new Date("2026-10-04T12:00:00Z"));
    expect(sunday.flyers).toEqual([]);expect(sunday.scheduled.map(x=>x.id)).toEqual(["de-2026-10-05","nl-2026-10-05"]);
    const preview=await getFlyerIndex(new Date("2026-10-04T14:00:00Z"));
    expect(preview.flyers.map(x=>x.id)).toEqual(["de-2026-10-05","nl-2026-10-05"]);expect(preview.scheduled).toEqual([]);
    const monday=await getFlyerIndex(new Date("2026-10-04T22:00:00Z"));
    expect(monday.flyers.map(x=>x.id)).toEqual(["de-2026-10-05","nl-2026-10-05"]);expect(monday.scheduled).toEqual([]);
  });
});
