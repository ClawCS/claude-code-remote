import { describe, expect, it } from "vitest";
import { fixtureEnabled, weeklyOfferFixtureContent } from "../weekly-offer-fixture";
import { parseWeeklyOfferContent } from "@/lib/weekly-offer-refresh";
import { selectWeeklyOffers } from "@/lib/catalog";
describe("isolated weekly-offer browser fixture",()=>{
  it("is inaccessible in production and without explicit test marker",()=>{
    expect(fixtureEnabled({NODE_ENV:"production",CINEMATIC_E2E:"1"})).toBe(false);
    expect(fixtureEnabled({NODE_ENV:"development"})).toBe(false);
    expect(fixtureEnabled({NODE_ENV:"development",CINEMATIC_E2E:"1"})).toBe(true);
  });
  it("provides only synthetic public content with Monday activation and expiry",()=>{
    const sunday=weeklyOfferFixtureContent("sunday"), monday=weeklyOfferFixtureContent("monday"), expired=weeklyOfferFixtureContent("expired");
    expect(parseWeeklyOfferContent(monday)).toEqual(monday);
    expect(sunday.offers).toEqual([]);expect(expired.offers).toEqual([]);
    expect(selectWeeklyOffers(monday.offers,monday.flyers,new Date(monday.generatedAt)).map(o=>o.id)).toEqual(["synthetic-monday-original"]);
    expect(selectWeeklyOffers(monday.offers,monday.flyers,new Date(expired.generatedAt))).toEqual([]);
    expect(weeklyOfferFixtureContent("latest").offers.map(o=>o.id)).toEqual(["synthetic-monday-latest"]);
  });
});
