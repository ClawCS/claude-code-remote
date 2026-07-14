import { describe, expect, it } from "vitest";

import {
  parseArchive,
  parseCampaigns,
  parseReviewQueue,
} from "@/lib/editorial-repository";

describe("editorial repository", () => {
  it("rejects a giveaway without an end date", () => {
    expect(() =>
      parseCampaigns([
        {
          id: "unsafe",
          kind: "giveaway",
          title: "Gewinnspiel",
          summary: "Nicht freigeben",
          validFrom: "2026-07-01",
          validTo: "",
          image: "/images/gewinnspiele/juli.png",
          href: "/gewinnspiel",
          source: "canva",
          sourceUrl: "https://www.canva.com/design/example",
          rightsStatus: "approved",
        },
      ]),
    ).toThrow(/validTo/);
  });

  it("keeps Canva people observations in the review queue", () => {
    const [item] = parseReviewQueue([
      {
        id: "team-2025-02-20",
        title: "Teamfoto im Markt",
        observedAt: "2026-07-14",
        source: "canva",
        sourceUrl: "https://www.canva.com/folder/uploads",
        assetName: "WhatsApp Image 2025-02-20 at 12.55.39 PM-10.jpg",
        rightsStatus: "review-required",
      },
    ]);
    expect(item.rightsStatus).toBe("review-required");
  });

  it("rejects an archive record without an approved rights state", () => {
    expect(() =>
      parseArchive([
        {
          id: "winner-2026-01",
          title: "Gewinnspiel-Rückblick",
          date: "2026-01-15",
          image: "/images/gewinnspiele/winner.png",
          kind: "giveaway",
          rightsStatus: "review-required",
        },
      ]),
    ).toThrow(/rightsStatus/);
  });

  it("rejects non-plain campaign records", () => {
    const classInstance = Object.assign(Object.create({ inherited: true }), {
      id: "class-instance",
      kind: "event",
      title: "Nicht plain",
      summary: "Darf nicht freigegeben werden",
      validFrom: "2026-07-14",
      validTo: "2026-07-24",
      image: "/images/events/strikerball.png",
      href: "https://www.trinkgut.de/strikerball",
      source: "trinkgut-official",
      sourceUrl: "https://www.trinkgut.de/strikerball",
      rightsStatus: "official",
    });

    expect(() => parseCampaigns([classInstance])).toThrow(/object/);
  });
});
