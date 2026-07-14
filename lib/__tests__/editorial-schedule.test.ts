import { describe, expect, it } from "vitest";

import {
  berlinDateKey,
  deriveEditorialStatus,
  getPublicationWeekRange,
  isEditorialPublishable,
  type ScheduledEditorial,
} from "@/lib/editorial-schedule";

const approved: ScheduledEditorial = {
  id: "strikerball-2026-07-24",
  source: "trinkgut-official",
  sourceUrl: "https://www.trinkgut.de/strikerball",
  validFrom: "2026-07-24",
  validTo: "2026-07-24",
  rightsStatus: "official",
};

describe("editorial schedule", () => {
  it("uses the Berlin calendar around UTC midnight", () => {
    expect(berlinDateKey(new Date("2026-07-23T22:30:00.000Z"))).toBe("2026-07-24");
  });

  it("keeps an item active through its validTo date", () => {
    expect(deriveEditorialStatus(approved, new Date("2026-07-24T21:59:59.000Z"))).toBe("active");
  });

  it("expires it at the next Berlin midnight", () => {
    expect(deriveEditorialStatus(approved, new Date("2026-07-24T22:00:00.000Z"))).toBe("expired");
  });

  it("never publishes review-required people imagery", () => {
    expect(
      isEditorialPublishable(
        { ...approved, rightsStatus: "review-required" },
        new Date("2026-07-24T12:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("keeps the current target week before the Sunday preload boundary", () => {
    expect(getPublicationWeekRange(new Date("2026-07-19T13:59:59.000Z"))).toEqual({
      validFrom: "2026-07-13",
      validTo: "2026-07-18",
    });
  });

  it("targets the following week from Sunday 16:00 Berlin", () => {
    expect(getPublicationWeekRange(new Date("2026-07-19T14:00:00.000Z"))).toEqual({
      validFrom: "2026-07-20",
      validTo: "2026-07-25",
    });
  });

  it("crosses the publication-year boundary correctly", () => {
    expect(getPublicationWeekRange(new Date("2027-01-03T15:00:00.000Z"))).toEqual({
      validFrom: "2027-01-04",
      validTo: "2027-01-09",
    });
  });

  it("uses the Berlin 16:00 boundary after the DST change", () => {
    expect(getPublicationWeekRange(new Date("2026-03-29T14:00:00.000Z"))).toEqual({
      validFrom: "2026-03-30",
      validTo: "2026-04-04",
    });
  });

  it("rejects calendar-invalid ISO date keys", () => {
    expect(
      isEditorialPublishable(
        { ...approved, validFrom: "2026-02-30", validTo: "2026-03-05" },
        new Date("2026-03-02T12:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("rejects a malformed HTTPS source URL", () => {
    expect(
      isEditorialPublishable(
        { ...approved, sourceUrl: "https://" },
        new Date("2026-07-24T12:00:00.000Z"),
      ),
    ).toBe(false);
  });
});
