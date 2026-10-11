import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomeQuickLinks from "@/components/cinematic/HomeQuickLinks";
import ServiceSection from "@/components/cinematic/ServiceSection";
import type { HomepageContent, HomepageFlyer } from "@/lib/homepage-content";

const flyer: HomepageFlyer = { id: "de", title: "Wochenangebote", validFrom: "2026-10-05", validTo: "2026-10-10", viewerUrl: "/handzettel/de.pdf", pdfUrl: "/handzettel/de.pdf", pageCount: 8, coverUrl: "/images/flyers/test-de.webp", sourceUrl: "https://trinkgut.de/" };
const base: HomepageContent = { generatedAt: "2026-10-08T12:00:00Z", flyer: null, nlFlyer: null, event: null, archive: [], fallbackMessage: "Der nächste Handzettel wird vorbereitet." };

describe("atmospheric homepage entries", () => {
  it.each([
    [null, null, []],
    [flyer, null, ["test-de.webp"]],
    [null, { ...flyer, id: "nl", pageCount: 1, coverUrl: "/images/flyers/test-nl.webp" }, ["test-nl.webp"]],
    [flyer, { ...flyer, id: "nl", pageCount: 1, coverUrl: "/images/flyers/test-nl.webp" }, ["test-de.webp", "test-nl.webp"]],
  ] as const)("renders only supplied current flyer covers %s / %s", (de, nl, covers) => {
    const html = decodeURIComponent(renderToStaticMarkup(<HomeQuickLinks content={{ ...base, flyer: de, nlFlyer: nl }} />));
    for (const cover of ["test-de.webp", "test-nl.webp"]) expect(html.includes(cover)).toBe(covers.includes(cover as never));
    expect(html).toContain('href="#aktuell"');
    expect(html).toContain('href="/partyplaner"');
    expect(html).toContain('href="/kontakt"');
    expect(html).toContain("maps");
    expect(html).not.toContain("↗");
  });
  it("uses the approved illustrative party motif and keeps rental and quantity destinations separate", () => {
    const html = decodeURIComponent(renderToStaticMarkup(<ServiceSection />));
    expect(html).toContain("garden-party-jammers-v1.webp");
    expect(html).not.toContain("schneider-weisse");
    expect(html).toContain('href="/vermietung"');
    expect(html).toContain('href="/partyplaner"');
    expect(html).not.toContain("↗");
  });
});
