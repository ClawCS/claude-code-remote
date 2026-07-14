import { describe, expect, test } from "vitest";

import type { HomepageContent } from "@/lib/homepage-content";
import nextConfig from "../../../next.config";
import {
  buildCurrentView,
  canRenderHomepageImage,
  formatDate,
  formatDateRange,
  formatPageCount,
} from "@/lib/cinematic/presentation";

const base: HomepageContent = {
  generatedAt: "2026-07-14T06:15:00.000Z",
  flyer: null,
  event: null,
  archive: [],
  fallbackMessage: "Der nächste Handzettel wird vorbereitet.",
};

describe("homepage presentation adapter", () => {
  test("formats date-only values and ranges without timezone drift", () => {
    expect(formatDate("2026-07-24")).toBe("24.07.2026");
    expect(formatDateRange("2026-07-24", "2026-07-24")).toBe("24.07.2026");
    expect(formatDateRange("2026-07-13", "2026-07-18")).toBe("13.–18.07.2026");
    expect(formatDateRange("2026-07-30", "2026-08-02")).toBe("30.07.–02.08.2026");
    expect(formatDateRange("2026-12-30", "2027-01-02")).toBe("30.12.2026–02.01.2027");
    expect(formatPageCount(1)).toBe("1 Seite");
    expect(formatPageCount(10)).toBe("10 Seiten");
  });

  test("passes the adapter-owned empty state through verbatim", () => {
    expect(buildCurrentView(base)).toEqual({
      flyer: null,
      event: null,
      fallbackMessage: "Der nächste Handzettel wird vorbereitet.",
    });
  });

  test("passes adapter-owned flyer/event records without deriving status", () => {
    const flyer = {
      id: "flyer-2026-29",
      title: "Handzettel",
      validFrom: "2026-07-13",
      validTo: "2026-07-18",
      viewerUrl: "https://example.test/view",
      pdfUrl: "https://example.test/flyer.pdf",
      pageCount: 8,
      coverUrl: "/images/flyer.webp",
      sourceUrl: "https://example.test/source",
    };
    const event = {
      id: "striker-2026",
      title: "Striker Ball Challenge",
      summary: "Am 24.07.2026 bei Trinkgut Jammers.",
      validFrom: "2026-07-14",
      validTo: "2026-07-24",
      image: "/images/events/strikerball.png",
      href: "/kontakt",
      sourceUrl: "https://example.test/event",
    };

    expect(buildCurrentView({ ...base, flyer, event })).toEqual({
      flyer,
      event,
      fallbackMessage: null,
    });
  });

  test("allows only local image assets and configured official remote hosts", () => {
    const configured = nextConfig.images?.remotePatterns?.map(
      ({ hostname }) => hostname,
    );
    expect(configured).toEqual(
      expect.arrayContaining([
        "media.trinkgut.de",
        "www.trinkgut.de",
        "werbung.trinkgut.de",
      ]),
    );
    expect(canRenderHomepageImage("/images/events/strikerball.png")).toBe(true);
    expect(
      canRenderHomepageImage("https://werbung.trinkgut.de/catalog/cover.jpg"),
    ).toBe(true);
    expect(
      canRenderHomepageImage("https://media.trinkgut.de/catalog/cover.webp"),
    ).toBe(true);
    expect(
      canRenderHomepageImage("https://www.trinkgut.de/catalog/cover.svg"),
    ).toBe(true);
    expect(
      canRenderHomepageImage("https://unconfigured.example/asset.jpg"),
    ).toBe(false);
    expect(canRenderHomepageImage("/api/content/current")).toBe(false);
    expect(canRenderHomepageImage("/images/../api/content.jpg")).toBe(false);
    expect(
      canRenderHomepageImage("/images/%252e%252e/api/content.jpg"),
    ).toBe(false);
    expect(
      canRenderHomepageImage(
        "/images/%252525252e%252525252e/api/content.jpg",
      ),
    ).toBe(false);
    expect(
      canRenderHomepageImage(
        "/images/%25252525252e%25252525252e/api/content.jpg",
      ),
    ).toBe(false);
    expect(canRenderHomepageImage("/images/poster.jpg%0a")).toBe(false);
    expect(
      canRenderHomepageImage("//attacker.example/images/event.jpg"),
    ).toBe(false);
    expect(
      canRenderHomepageImage(
        " https://werbung.trinkgut.de/catalog/cover.jpg",
      ),
    ).toBe(false);
    expect(
      canRenderHomepageImage(
        "https://werbung.trinkgut.de/catalog/cover.jpg ",
      ),
    ).toBe(false);
    expect(
      canRenderHomepageImage(
        "https://werbung.trinkgut.de/catalog\\cover.jpg",
      ),
    ).toBe(false);
    expect(
      canRenderHomepageImage(
        "https://werbung.trinkgut.de:444/catalog/cover.jpg",
      ),
    ).toBe(false);
    expect(
      canRenderHomepageImage(
        "https://werbung.trinkgut.de:443/catalog/cover.jpg",
      ),
    ).toBe(false);
    expect(
      canRenderHomepageImage(
        "https://werbung.trinkgut.de/catalog/cover.jpg%250a",
      ),
    ).toBe(false);
    expect(
      canRenderHomepageImage(
        "https://werbung.trinkgut.de/%252525252e%252525252e/cover.jpg",
      ),
    ).toBe(false);
    expect(
      canRenderHomepageImage("http://werbung.trinkgut.de/catalog/cover.jpg"),
    ).toBe(false);
    expect(
      canRenderHomepageImage(
        "https://user:secret@werbung.trinkgut.de/catalog/cover.jpg",
      ),
    ).toBe(false);
    expect(
      canRenderHomepageImage("https://werbung.trinkgut.de/catalog/cover.txt"),
    ).toBe(false);
    expect(
      canRenderHomepageImage("https://werbung.trinkgut.de/catalog/cover"),
    ).toBe(false);
    expect(canRenderHomepageImage("/images/poster.txt")).toBe(false);
    expect(canRenderHomepageImage("/images/poster")).toBe(false);
    expect(canRenderHomepageImage(" /images/poster.jpg")).toBe(false);
    expect(canRenderHomepageImage("/images/poster\\image.jpg")).toBe(false);
    expect(canRenderHomepageImage("/images/poster.jpg\n")).toBe(false);
    expect(canRenderHomepageImage("/images/poster.jpg?next=%0a")).toBe(false);
    expect(canRenderHomepageImage("/images/poster.jpg#fragment")).toBe(false);
    expect(canRenderHomepageImage("/images/my%20poster.jpg")).toBe(false);
    expect(
      canRenderHomepageImage(
        "https://werbung.trinkgut.de/catalog/my%20cover.jpg",
      ),
    ).toBe(false);
  });
});
