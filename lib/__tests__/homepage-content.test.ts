import { access } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  EditorialArchiveItem,
  EditorialCampaign,
} from "@/lib/editorial-repository";
import type { HandzettelCache } from "@/lib/handzettel-catalog";
import {
  aggregateHomepageContent,
  createHomepageContentLoader,
  getHomepageContent,
  mapHandzettelCacheToFlyer,
  type HomepageFlyer,
} from "@/lib/homepage-content";
import * as currentContentRoute from "@/app/api/content/current/route";

const NOW = new Date("2026-07-14T12:00:00.000Z");
const VIEWER_URL =
  "https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest";
const ASSET_BASE =
  "https://werbung.trinkgut.de/frontend/mvc/api/catalogs/1335913/v2";

function makeCache(): HandzettelCache {
  return {
    catalogId: "1335913",
    catalogVersion: "2",
    storeId: "13027",
    werbekreis: "3.6",
    kw: 29,
    year: 2026,
    validFrom: "2026-07-13",
    validTo: "2026-07-18",
    fetchedAt: "2026-07-14T10:00:00.000Z",
    viewerUrl: VIEWER_URL,
    pdfUrl:
      "https://werbung.trinkgut.de/frontend/catalogs/1335913/2/pdf/complete.pdf",
    pageCount: 10,
    pages: Array.from({ length: 10 }, (_, index) => ({
      number: index + 1,
      imageUrl: `${ASSET_BASE}/normal/bk_${index + 1}.jpg`,
      thumbnailUrl: `${ASSET_BASE}/thumbnails/bk_${index + 1}.jpg`,
    })),
    status: "ok",
  };
}

function makeFlyer(overrides: Partial<HomepageFlyer> = {}): HomepageFlyer {
  return {
    id: "catalog-13027-29-2026",
    title: "Angebote der Woche",
    validFrom: "2026-07-13",
    validTo: "2026-07-18",
    viewerUrl: VIEWER_URL,
    pdfUrl:
      "https://werbung.trinkgut.de/frontend/catalogs/1335913/2/pdf/complete.pdf",
    pageCount: 10,
    coverUrl: `${ASSET_BASE}/normal/bk_1.jpg`,
    sourceUrl: VIEWER_URL,
    ...overrides,
  };
}

function makeCampaign(
  overrides: Partial<EditorialCampaign> = {},
): EditorialCampaign {
  return {
    id: "strikerball-2026-07-24",
    kind: "event",
    title: "Striker Ball Challenge",
    summary: "Am 24. Juli bei Jammers.",
    validFrom: "2026-07-14",
    validTo: "2026-07-24",
    image: "/images/events/strikerball.png",
    href: "https://www.trinkgut.de/strikerball",
    source: "trinkgut-official",
    sourceUrl: "https://www.trinkgut.de/strikerball",
    rightsStatus: "official",
    ...overrides,
  };
}

function makeArchive(
  overrides: Partial<EditorialArchiveItem> = {},
): EditorialArchiveItem {
  return {
    id: "archive-item",
    title: "Rückblick",
    date: "2026-07-01",
    image: "/images/archive/rueckblick.jpg",
    kind: "event",
    rightsStatus: "approved",
    ...overrides,
  };
}

function aggregate(overrides: {
  now?: Date;
  flyer?: HomepageFlyer | null;
  campaigns?: readonly EditorialCampaign[];
  archive?: readonly EditorialArchiveItem[];
} = {}) {
  return aggregateHomepageContent({
    now: overrides.now ?? NOW,
    flyer: overrides.flyer === undefined ? null : overrides.flyer,
    campaigns: overrides.campaigns ?? [],
    archive: overrides.archive ?? [],
  });
}

describe("homepage content", () => {
  it("returns the current flyer and official event", () => {
    const content = aggregateHomepageContent({
      now: NOW,
      flyer: {
        id: "catalog-13027-29-2026",
        title: "Angebote der Woche",
        validFrom: "2026-07-13",
        validTo: "2026-07-18",
        viewerUrl: VIEWER_URL,
        pdfUrl:
          "https://werbung.trinkgut.de/frontend/catalogs/1234567/1/pdf/complete.pdf",
        pageCount: 8,
        coverUrl:
          "https://werbung.trinkgut.de/frontend/mvc/api/catalogs/1234567/v1/normal/bk_1.jpg",
        sourceUrl: VIEWER_URL,
      },
      campaigns: [makeCampaign()],
      archive: [],
    });
    expect(content.flyer?.validTo).toBe("2026-07-18");
    expect(content.event?.id).toBe("strikerball-2026-07-24");
    expect(content.fallbackMessage).toBeNull();
  });

  it("drops an expired flyer instead of extending it", () => {
    const content = aggregate({
      now: new Date("2026-07-19T10:00:00.000Z"),
      flyer: makeFlyer(),
    });
    expect(content.flyer).toBeNull();
    expect(content.fallbackMessage).toBe(
      "Der nächste Handzettel wird vorbereitet.",
    );
  });

  it("never maps a giveaway into the HomepageEvent slot", () => {
    const content = aggregate({
      campaigns: [makeCampaign({ id: "giveaway", kind: "giveaway" })],
    });
    expect(content.event).toBeNull();
  });

  it("maps the validated ten-page cache without reconstructing asset URLs", () => {
    const cache = makeCache();
    expect(mapHandzettelCacheToFlyer(cache)).toEqual({
      id: "catalog-13027-29-2026",
      title: "Angebote der Woche",
      validFrom: "2026-07-13",
      validTo: "2026-07-18",
      viewerUrl: VIEWER_URL,
      pdfUrl:
        "https://werbung.trinkgut.de/frontend/catalogs/1335913/2/pdf/complete.pdf",
      pageCount: 10,
      coverUrl: cache.pages[0].imageUrl,
      sourceUrl: VIEWER_URL,
    });
    expect(mapHandzettelCacheToFlyer(cache).coverUrl).toContain(
      "/normal/bk_1.jpg",
    );
    expect(mapHandzettelCacheToFlyer(cache).coverUrl).not.toContain(
      "/thumbnails/",
    );
  });

  it("keeps a flyer through the inclusive Berlin validTo date", () => {
    expect(
      aggregate({
        now: new Date("2026-07-18T21:59:59.999Z"),
        flyer: makeFlyer(),
      }).flyer?.id,
    ).toBe("catalog-13027-29-2026");
  });

  it("expires a flyer at the next Berlin midnight", () => {
    expect(
      aggregate({
        now: new Date("2026-07-18T22:00:00.000Z"),
        flyer: makeFlyer(),
      }).flyer,
    ).toBeNull();
  });

  it("rejects an injected flyer above the validated 60-page limit", () => {
    expect(aggregate({ flyer: makeFlyer({ pageCount: 61 }) }).flyer).toBeNull();
  });

  it("hides a Sunday-preloaded Monday flyer until Berlin Monday", () => {
    const mondayFlyer = makeFlyer({
      id: "catalog-13027-30-2026",
      validFrom: "2026-07-20",
      validTo: "2026-07-25",
    });
    expect(
      aggregate({
        now: new Date("2026-07-19T15:00:00.000Z"),
        flyer: mondayFlyer,
      }).flyer,
    ).toBeNull();
    expect(
      aggregate({
        now: new Date("2026-07-19T22:00:00.000Z"),
        flyer: mondayFlyer,
      }).flyer?.id,
    ).toBe("catalog-13027-30-2026");
  });

  it("copies the injected timestamp exactly into generatedAt", () => {
    const now = new Date("2026-10-25T01:30:45.123Z");
    expect(aggregate({ now }).generatedAt).toBe(now.toISOString());
  });

  it("ranks event sources from official through Instagram", () => {
    const content = aggregate({
      campaigns: [
        makeCampaign({ id: "instagram", source: "instagram" }),
        makeCampaign({ id: "canva", source: "canva" }),
        makeCampaign({ id: "local", source: "local" }),
        makeCampaign({ id: "official", source: "trinkgut-official" }),
      ],
    });
    expect(content.event?.id).toBe("official");
  });

  it("ranks newer validFrom first within the same source", () => {
    const content = aggregate({
      campaigns: [
        makeCampaign({ id: "older", validFrom: "2026-07-01" }),
        makeCampaign({ id: "newer", validFrom: "2026-07-14" }),
      ],
    });
    expect(content.event?.id).toBe("newer");
  });

  it("uses ascending id as the final event tie-breaker", () => {
    const content = aggregate({
      campaigns: [makeCampaign({ id: "z-event" }), makeCampaign({ id: "a-event" })],
    });
    expect(content.event?.id).toBe("a-event");
  });

  it.each([
    ["scheduled", makeCampaign({ validFrom: "2026-07-15", validTo: "2026-07-20" })],
    ["expired", makeCampaign({ validFrom: "2026-07-01", validTo: "2026-07-13" })],
    [
      "review-required",
      { ...makeCampaign(), rightsStatus: "review-required" } as unknown as EditorialCampaign,
    ],
    [
      "rejected",
      { ...makeCampaign(), rightsStatus: "rejected" } as unknown as EditorialCampaign,
    ],
    ["giveaway", makeCampaign({ kind: "giveaway" })],
  ])("excludes a %s campaign from the event slot", (_label, candidate) => {
    expect(aggregate({ campaigns: [candidate] }).event).toBeNull();
  });

  it("keeps the flyer fallback message when an event is active", () => {
    const content = aggregate({ campaigns: [makeCampaign()] });
    expect(content.event?.id).toBe("strikerball-2026-07-24");
    expect(content.fallbackMessage).toBe(
      "Der nächste Handzettel wird vorbereitet.",
    );
  });

  it.each([
    "//example.test/event",
    "http://example.test/event",
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "https://user:pass@example.test/event",
    "https://example.test\\@attacker.test/event",
    "/event\nunsafe",
    "/event/%ZZ",
    "https://",
  ])("rejects unsafe event href %s", (href) => {
    expect(aggregate({ campaigns: [makeCampaign({ href })] }).event).toBeNull();
  });

  it("keeps the existing single-slash root-relative href contract", () => {
    const href = "/api/content/current";
    expect(aggregate({ campaigns: [makeCampaign({ href })] }).event?.href).toBe(
      href,
    );
  });

  it.each([
    "//example.test/image.jpg",
    "http://example.test/image.jpg",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "https://user:pass@example.test/image.jpg",
    "https://example.test\\@attacker.test/image.jpg",
    "/images/unsafe\r.jpg",
    "/images/%ZZ.jpg",
    "/%61pi/content.jpg",
    "/%2Fapi/content.jpg",
    "/images/%2e%2e/api/content.jpg",
    "/images/%252e%252e/api/content.jpg",
    "/images%2F..%2Fapi/content.jpg",
    "/images/safe.jpg%5C..%5Capi/content.jpg",
    "/images/safe.jpg%3F/../api/content.jpg",
    "/images/safe.jpg%23/../api/content.jpg",
    "/images/safe.jpg?variant=%0A",
    "not-a-path",
  ])("rejects unsafe event image %s", (image) => {
    expect(aggregate({ campaigns: [makeCampaign({ image })] }).event).toBeNull();
  });

  it("rejects an event whose published source URL contains credentials", () => {
    const campaign = makeCampaign({
      sourceUrl: "https://user:pass@example.test/source",
    });
    expect(aggregate({ campaigns: [campaign] }).event).toBeNull();
  });

  it("rejects an API endpoint masquerading as a local event image", () => {
    expect(
      aggregate({
        campaigns: [makeCampaign({ image: "/api/content/current" })],
      }).event,
    ).toBeNull();
  });

  it("rejects a local image asset outside the public images namespace", () => {
    expect(
      aggregate({
        campaigns: [makeCampaign({ image: "/assets/events/strikerball.webp" })],
      }).event,
    ).toBeNull();
  });

  it.each([
    "/images/events/strikerball.webp?v=2#hero",
    "/%69mages/events/strikerball.webp",
    "https://cdn.example.test/render?id=strikerball",
  ])("accepts the safe published image %s", (image) => {
    expect(aggregate({ campaigns: [makeCampaign({ image })] }).event?.image).toBe(
      image,
    );
  });

  it("filters invalid and future archive dates before deterministic limiting", () => {
    const archive = [
      makeArchive({ id: "older", date: "2025-12-31" }),
      makeArchive({ id: "same-z", date: "2026-07-10" }),
      makeArchive({ id: "latest", date: "2026-07-14" }),
      makeArchive({ id: "same-a", date: "2026-07-10" }),
      makeArchive({ id: "fifth", date: "2026-06-15" }),
      makeArchive({ id: "future", date: "2026-07-15" }),
      makeArchive({ id: "invalid", date: "2026-02-30" }),
    ];
    expect(aggregate({ archive }).archive.map(({ id }) => id)).toEqual([
      "latest",
      "same-a",
      "same-z",
      "fifth",
    ]);
  });

  it("requires parser-approved archive rights", () => {
    const archive = {
      ...makeArchive(),
      rightsStatus: "review-required",
    } as unknown as EditorialArchiveItem;
    expect(aggregate({ archive: [archive] }).archive).toEqual([]);
  });

  it("rejects an API endpoint masquerading as a local archive image", () => {
    expect(
      aggregate({ archive: [makeArchive({ image: "/api/archive/image" })] })
        .archive,
    ).toEqual([]);
  });

  it.each([
    "//example.test/image.jpg",
    "http://example.test/image.jpg",
    "javascript:alert(1)",
    "https://user:pass@example.test/image.jpg",
    "/images/unsafe\u0000.jpg",
    "/images/%ZZ.jpg",
    "/%61pi/content.jpg",
    "/%2Fapi/content.jpg",
    "/images/%2e%2e/api/content.jpg",
    "/images/%252e%252e/api/content.jpg",
    "/images%2F..%2Fapi/content.jpg",
    "/images/safe.jpg%5C..%5Capi/content.jpg",
    "/images/safe.jpg%3F/../api/content.jpg",
    "/images/safe.jpg%23/../api/content.jpg",
    "/images/safe.jpg?variant=%0A",
    "/assets/archive/content.jpg",
  ])("rejects unsafe archive image %s", (image) => {
    expect(aggregate({ archive: [makeArchive({ image })] }).archive).toEqual([]);
  });

  it("preserves a safe query and hash on an archive image asset", () => {
    const image = "/images/archive/content.jpg?v=2#card";
    expect(aggregate({ archive: [makeArchive({ image })] }).archive[0]?.image).toBe(
      image,
    );
  });

  it("does not auto-flow giveaway campaigns into the archive", () => {
    const content = aggregate({
      campaigns: [makeCampaign({ kind: "giveaway" })],
      archive: [],
    });
    expect(content.event).toBeNull();
    expect(content.archive).toEqual([]);
  });
});

describe("homepage content loader", () => {
  const workingSources = {
    loadValidatedHandzettelCache: async () => makeCache(),
    loadApprovedCampaigns: async () => [makeCampaign()],
    loadEditorialArchive: async () => [makeArchive()],
  };

  it("isolates a rejected cache while preserving event and archive", async () => {
    const load = createHomepageContentLoader({
      ...workingSources,
      loadValidatedHandzettelCache: async () => {
        throw new Error("bad cache");
      },
    });
    const content = await load(NOW);
    expect(content.flyer).toBeNull();
    expect(content.event?.id).toBe("strikerball-2026-07-24");
    expect(content.archive.map(({ id }) => id)).toEqual(["archive-item"]);
  });

  it("isolates a synchronous source throw before settling all sources", async () => {
    const load = createHomepageContentLoader({
      ...workingSources,
      loadValidatedHandzettelCache: (() => {
        throw new Error("synchronous cache failure");
      }) as typeof workingSources.loadValidatedHandzettelCache,
    });
    await expect(load(NOW)).resolves.toMatchObject({
      flyer: null,
      event: { id: "strikerball-2026-07-24" },
      archive: [{ id: "archive-item" }],
    });
  });

  it("never accepts a fallback object as a flyer", async () => {
    const load = createHomepageContentLoader({
      ...workingSources,
      loadValidatedHandzettelCache: async () =>
        ({
          ...makeCache(),
          status: "fallback",
          pages: [],
          pageCount: 0,
        }) as unknown as HandzettelCache,
    });
    const content = await load(NOW);
    expect(content.flyer).toBeNull();
    expect(content.event?.id).toBe("strikerball-2026-07-24");
  });

  it("isolates rejected campaigns while preserving flyer and archive", async () => {
    const load = createHomepageContentLoader({
      ...workingSources,
      loadApprovedCampaigns: async () => {
        throw new Error("bad campaigns");
      },
    });
    const content = await load(NOW);
    expect(content.flyer?.id).toBe("catalog-13027-29-2026");
    expect(content.event).toBeNull();
    expect(content.archive.map(({ id }) => id)).toEqual(["archive-item"]);
  });

  it("isolates a rejected archive while preserving flyer and event", async () => {
    const load = createHomepageContentLoader({
      ...workingSources,
      loadEditorialArchive: async () => {
        throw new Error("bad archive");
      },
    });
    const content = await load(NOW);
    expect(content.flyer?.id).toBe("catalog-13027-29-2026");
    expect(content.event?.id).toBe("strikerball-2026-07-24");
    expect(content.archive).toEqual([]);
  });

  it("degrades a resolved invalid cache without rejecting the request", async () => {
    const load = createHomepageContentLoader({
      ...workingSources,
      loadValidatedHandzettelCache: async () =>
        ({ ...makeCache(), pages: [] }) as HandzettelCache,
    });
    await expect(load(NOW)).resolves.toMatchObject({
      flyer: null,
      event: { id: "strikerball-2026-07-24" },
      archive: [{ id: "archive-item" }],
    });
  });

  it("loads the production sources without writing a missing cache", async () => {
    const cachePath = path.join(process.cwd(), "data/handzettel-cache.json");
    await expect(access(cachePath)).rejects.toThrow();
    const content = await getHomepageContent(NOW);
    expect(content).toEqual({
      generatedAt: NOW.toISOString(),
      flyer: null,
      event: {
        id: "strikerball-2026-07-24",
        title: "Striker Ball Challenge",
        summary: "Dein Schuss. Dein Gewinn. Am 24. Juli bei Trinkgut Jammers.",
        validFrom: "2026-07-14",
        validTo: "2026-07-24",
        image: "/images/events/strikerball.png",
        href: "https://www.trinkgut.de/strikerball",
        sourceUrl: "https://www.trinkgut.de/strikerball",
      },
      archive: [],
      fallbackMessage: "Der nächste Handzettel wird vorbereitet.",
    });
    await expect(access(cachePath)).rejects.toThrow();
  });
});

describe("current content route", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("exports only the dynamic route contract", () => {
    expect(Object.keys(currentContentRoute).sort()).toEqual(["GET", "dynamic"]);
    expect(currentContentRoute.dynamic).toBe("force-dynamic");
  });

  it("returns 200 JSON with an exact no-store cache policy", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const response = await currentContentRoute.GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      generatedAt: NOW.toISOString(),
      flyer: null,
      event: { id: "strikerball-2026-07-24" },
      archive: [],
      fallbackMessage: "Der nächste Handzettel wird vorbereitet.",
    });
  });
});
