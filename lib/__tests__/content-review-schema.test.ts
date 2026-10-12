import { describe, expect, it } from "vitest";
import { parseContentReviews, assertContentReviewCoverage } from "@/lib/content-review-schema";

const fixture = () => ({ schemaVersion: 1, sources: [{ id: "iba", title: "Official cocktail", url: "https://iba-world.com/cocktails/", publisher: "IBA" }], reviews: [{ id: "recipe:negroni", reviewedAt: "2026-10-12", sourceIds: ["iba"], scope: "Zutaten und Zubereitung mit dem Originalrezept verglichen." }] });

describe("source-review evidence boundaries", () => {
  it("blocks a release when an actual lesson or recipe lacks review evidence", () => {
    expect(() => assertContentReviewCoverage(fixture(), ["recipe:negroni", "academy:wein:1"])).toThrow(/coverage/i);
    expect(() => assertContentReviewCoverage(fixture(), ["recipe:other"])).toThrow(/coverage/i);
    expect(assertContentReviewCoverage(fixture(), ["recipe:negroni"])).toBe(1);
  });
  it("resolves only actual reviewed entries and their declared sources", () => {
    const parsed = parseContentReviews(fixture());
    expect(parsed.reviews.get("recipe:negroni")?.sources[0].publisher).toBe("IBA");
    expect(parsed.reviews.get("recipe:unreviewed")).toBeUndefined();
  });
  it("rejects incomplete evidence instead of showing an unsupported review stamp", () => {
    const value = fixture();
    value.reviews[0].sourceIds = ["missing"];
    expect(() => parseContentReviews(value)).toThrow(/source/i);
  });
  it.each(["javascript:alert(1)", "http://example.org", "https://user:password@example.org", "https://example.org/?token=private"]) ("rejects unsafe or credential-bearing public source links: %s", url => {
    const value = fixture(); value.sources[0].url = url;
    expect(() => parseContentReviews(value)).toThrow(/url/i);
  });
  it("rejects impossible dates and duplicate review identities", () => {
    const value = fixture(); value.reviews[0].reviewedAt = "2026-02-30";
    expect(() => parseContentReviews(value)).toThrow(/date/i);
    const duplicate = fixture(); duplicate.reviews.push({ ...duplicate.reviews[0] });
    expect(() => parseContentReviews(duplicate)).toThrow(/duplicate/i);
  });
});
