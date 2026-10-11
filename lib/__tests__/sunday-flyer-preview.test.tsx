import { afterEach, describe, expect, it, vi } from "vitest";
import { rm } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("server-only", () => ({}));
import { weeklyPublicationFixture } from "./fixtures/weekly-publication";
import { loadWeeklyPublications } from "@/lib/weekly-publication";
import { selectWeeklyOfferContent } from "@/lib/weekly-offer-selection";
import { aggregateHomepageContent } from "@/lib/homepage-content";
import { getPublicationWeekRange } from "@/lib/editorial-schedule";
import CurrentSection from "@/components/cinematic/CurrentSection";
import FlyerIndexView from "@/components/FlyerIndexView";
import NlCurrentSection from "@/components/cinematic/NlCurrentSection";
import WeeklyOfferGrid from "@/components/WeeklyOfferGrid";
import { selectWeeklyOffers } from "@/lib/catalog";

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
async function fixture() { const f = await weeklyPublicationFixture("2026-10-12", "2026-10-17"); roots.push(f.root); return f; }

describe("Sunday 16:00 Berlin complete weekly preview, validity from Monday", () => {
  it.each([
    ["2026-10-11T13:59:59Z", "2026-10-05"], ["2026-10-11T14:00:00Z", "2026-10-12"],
    ["2027-01-03T14:59:59Z", "2026-12-28"], ["2027-01-03T15:00:00Z", "2027-01-04"],
    ["2026-03-29T13:59:59Z", "2026-03-23"], ["2026-03-29T14:00:00Z", "2026-03-30"],
    ["2026-10-25T14:59:59Z", "2026-10-19"], ["2026-10-25T15:00:00Z", "2026-10-26"],
  ])("selects the correct week at %s", (instant, week) => {
    expect(getPublicationWeekRange(new Date(instant)).validFrom).toBe(week);
  });
  it("shows complete unchanged originals and all offers at 16:00 through the original expiry", async () => {
    const f = await fixture(); const loaded = await loadWeeklyPublications(f.root);
    expect(selectWeeklyOfferContent(loaded, new Date("2026-10-11T13:59:59Z")).flyers).toEqual([]);
    const preview = selectWeeklyOfferContent(loaded, new Date("2026-10-11T14:00:00Z"));
    expect(preview.status).toBe("ok"); expect(preview.issues).toEqual([]);
    expect(preview.flyers.map(f => [f.id, f.validFrom, f.validTo])).toEqual([
      ["de-2026-10-12", "2026-10-12", "2026-10-17"], ["nl-2026-10-12", "2026-10-12", "2026-10-17"],
    ]);
    expect(preview.offers).toHaveLength(3);
    expect(preview.offers.map(o => [o.validFrom, o.validTo])).toEqual(Array(3).fill(["2026-10-12", "2026-10-17"]));
    expect(selectWeeklyOfferContent(loaded, new Date("2026-10-11T21:59:59Z")).offers).toHaveLength(3);
    expect(selectWeeklyOfferContent(loaded, new Date("2026-10-11T22:00:00Z")).offers).toHaveLength(3);
    expect(selectWeeklyOfferContent(loaded, new Date("2026-10-17T22:00:00Z")).flyers).toEqual([]);
    expect(selectWeeklyOfferContent(loaded, new Date("2026-10-17T22:00:00Z")).offers).toEqual([]);
  });
  it("keeps valid DE preview when the next-week NL original is damaged", async () => {
    const f = await fixture(); await f.write(`public${f.editions[1].pdf.path}`, "broken");
    const content = selectWeeklyOfferContent(await loadWeeklyPublications(f.root), new Date("2026-10-11T14:00:00Z"));
    expect(content.flyers.map(f => f.language)).toEqual(["de"]);
    expect(content.issues).toEqual(["nl-edition-invalid", "nl-flyer-missing"]); expect(content.offers).toHaveLength(2);
  });
  it("requires both originals at the preview deadline even when neither exists", () => {
    expect(selectWeeklyOfferContent({ editions: [], issues: [] }, new Date("2026-10-11T14:00:00Z")).issues).toEqual(["official-flyer-missing", "nl-flyer-missing"]);
  });
  it("applies preview boundaries, category filters, source integrity and supplemental exclusion in the client", async () => {
    const f = await fixture();
    const selected = selectWeeklyOfferContent(await loadWeeklyPublications(f.root), new Date("2026-10-12T10:00:00Z"));
    const pick = (instant: string) => selectWeeklyOffers(selected.offers, selected.flyers, new Date(instant));
    expect(pick("2026-10-11T13:59:59Z")).toEqual([]);
    expect(pick("2026-10-11T14:00:00Z")).toHaveLength(3);
    expect(pick("2026-10-11T22:00:00Z")).toHaveLength(3);
    expect(pick("2026-10-17T22:00:00Z")).toEqual([]);
    const now = new Date("2026-10-11T14:00:00Z");
    const category = selected.offers[0].categorySlug;
    expect(selectWeeklyOffers(selected.offers, selected.flyers, now, category)).toEqual(selected.offers.filter(o => o.categorySlug === category));
    expect(selectWeeklyOffers(selected.offers, selected.flyers.map(f => ({ ...f, pdfSha256: "0".repeat(64) })), now)).toEqual([]);
    expect(selectWeeklyOffers(selected.offers, selected.flyers.map(f => ({ ...f, purpose: "supplemental" })), now)).toEqual([]);
  });
  it("labels every future card and removes the preview label at Monday midnight without losing offers", async () => {
    const f = await fixture(); const loaded = await loadWeeklyPublications(f.root);
    for (const [instant, preview] of [["2026-10-11T14:00:00Z", true], ["2026-10-11T22:00:00Z", false]] as const) {
      const selected = selectWeeklyOfferContent(loaded, new Date(instant));
      const html = renderToStaticMarkup(<WeeklyOfferGrid content={selected} />);
      expect(html.match(/data-offer-id=/g)).toHaveLength(3);
      expect(html.match(/data-offer-preview=/g)?.length ?? 0).toBe(preview ? 3 : 0);
      expect(html.includes("Vorschau · gültig ab Montag")).toBe(preview);
      const nl = renderToStaticMarkup(<WeeklyOfferGrid content={selected} language="nl" />);
      expect(nl.match(/data-offer-id=/g)).toHaveLength(1);
    }
  });
  it("renders preview notices and both originals on home, offer index and Dutch landing without changing dates", async () => {
    const f = await fixture(); const now = new Date("2026-10-11T14:00:00Z");
    const selected = selectWeeklyOfferContent(await loadWeeklyPublications(f.root), now);
    const content = aggregateHomepageContent({ now, flyer: selected.flyers[0], nlFlyer: selected.flyers[1], campaigns: [], archive: [] });
    expect(content.flyer?.id).toBe("de-2026-10-12"); expect(content.nlFlyer?.id).toBe("nl-2026-10-12");
    const index = { ...selected, scheduled: [] };
    for (const [view, notice] of [
      [<CurrentSection key="home" content={content} />, "Vorschau · gültig ab Montag"],
      [<FlyerIndexView key="offers" index={index} />, "Vorschau · gültig ab Montag"],
      [<NlCurrentSection key="nl" index={index} />, "Vooruitblik · geldig vanaf maandag"],
    ] as const) {
      const html = renderToStaticMarkup(view);
      expect(html).toContain(notice);
      expect(html).toContain("/handzettel/2026-10-12/de.pdf"); expect(html).toContain("/handzettel/2026-10-12/nl.pdf");
    }
  });
});
