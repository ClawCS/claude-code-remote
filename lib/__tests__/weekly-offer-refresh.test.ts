import { describe, expect, it } from "vitest";
import { createOfferRefresh, parseWeeklyOfferContent } from "@/lib/weekly-offer-refresh";
import { weeklyOfferFixtureContent } from "@/lib/cinematic/weekly-offer-fixture";
const empty={status:"ok",issues:[],generatedAt:"2026-10-08T12:00:00.000Z",flyers:[],offers:[]};
describe("offer refresh boundary",()=>{
  it("rejects a reversed validity interval rather than accepting part of a malformed payload",()=>{
    const valid=weeklyOfferFixtureContent("monday");
    expect(()=>parseWeeklyOfferContent({...valid,offers:[],flyers:[{...valid.flyers[0],validFrom:"2026-10-18"}]})).toThrow();
  });
  it("rejects malformed content and unsolicited private fields",()=>{
    expect(parseWeeklyOfferContent(empty)).toEqual(empty);
    expect(()=>parseWeeklyOfferContent({...empty,offers:[{id:"bad"}]})).toThrow();
    expect(()=>parseWeeklyOfferContent({...empty,designId:"private"})).toThrow();
  });
  it("discards a late older response even if its transport ignores abort",async()=>{
    const pending: ((value: unknown)=>void)[]=[];
    const published:unknown[]=[];
    const refresh=createOfferRefresh(async()=>new Promise(resolve=>pending.push(resolve)), value=>published.push(value));
    const old=refresh.run(); const latest=refresh.run();
    pending[1]({...empty,generatedAt:"2026-10-09T12:00:00.000Z"}); await latest;
    pending[0](empty); await old;
    expect(published).toEqual([{...empty,generatedAt:"2026-10-09T12:00:00.000Z"}]);
  });
  it("clears all selections when the newest response fails validation",async()=>{
    const published:unknown[]=[];
    await createOfferRefresh(async()=>({flyers:[]}),value=>published.push(value)).run();
    expect(published).toEqual([null]);
  });
});
