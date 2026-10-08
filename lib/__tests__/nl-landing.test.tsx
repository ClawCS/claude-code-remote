import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FlyerIndex } from "@/lib/flyer-index";

vi.mock("server-only", () => ({}));
const source = vi.hoisted(() => ({ getFlyerIndex: vi.fn() }));
vi.mock("@/lib/flyer-index", () => source);
// Vite imports bitmap modules as strings, unlike Next's StaticImageData loader.
vi.mock("next/image", async () => {
  const React = await import("react");
  return { default: ({ src, alt, fill: _fill, priority: _priority, ...props }: {
    src: string | { src: string }; alt: string; fill?: boolean; priority?: boolean;
  }) => React.createElement("img", { ...props, src: typeof src === "string" ? src : src.src, alt }) };
});
import NederlandsPage from "@/app/nl/page";

const index: FlyerIndex = {
  status: "ok", issues: [], generatedAt: "2026-10-08T10:00:00.000Z", scheduled: [],
  flyers: ["de", "nl"].map((language) => ({
    id: `test-${language}`, language: language as "de" | "nl", title: `Original ${language}`,
    validFrom: "2026-10-05", validTo: "2026-10-10", pageCount: language === "nl" ? 1 : 8,
    viewerUrl: `/handzettel/2026/test-${language}.pdf`, pdfUrl: `/handzettel/2026/test-${language}.pdf`,
    coverUrl: `/images/content/test-${language}.webp`, sourceUrl: "https://www.canva.com/design/test/view",
  })),
};

beforeEach(() => source.getFlyerIndex.mockResolvedValue(index));

describe("Dutch visitor landing page", () => {
  it("puts offers and exact market directions in the hero, with working section targets", async () => {
    const html = renderToStaticMarkup(await NederlandsPage());
    const hero = html.match(/<section\b[\s\S]*?<\/section>/)?.[0] ?? "";
    const route = hero.match(/href="([^"]*google\.com\/maps[^\"]*)"/);
    expect(route).not.toBeNull();
    const url = new URL(route![1].replaceAll("&amp;", "&"));
    expect(url.searchParams.get("destination")).toBe("Trinkgut Jammers, Jurgensstraße 20, 47574 Goch, Deutschland");
    expect(hero).toContain('href="#handzettel"');
    expect(hero).toContain("Jurgensstraße 20");
    for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
      expect(html.match(new RegExp(`id="${id}"`, "g"))).toHaveLength(1);
    }
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("keeps both original flyer PDFs and Dutch contact messages available", async () => {
    const html = renderToStaticMarkup(await NederlandsPage());
    for (const language of ["de", "nl"]) {
      expect(html).toContain(`href="/handzettel/2026/test-${language}.pdf"`);
      expect(html).toContain(`Original ${language}`);
    }
    const contacts = [...html.matchAll(/href="(https:\/\/wa.me\/[^\"]*)"/g)];
    expect(contacts.length).toBeGreaterThan(0);
    for (const [, href] of contacts) {
      const url = new URL(href.replaceAll("&amp;", "&"));
      expect(url.pathname).toBe("/491752492386");
      expect(url.searchParams.get("text")).toBe("Hallo Trinkgut Jammers, ik heb een vraag.");
    }
  });

  it("preserves Dutch missing-flyer feedback without inventing available offers", async () => {
    source.getFlyerIndex.mockResolvedValue({ ...index, status: "degraded", flyers: [], issues: ["nl-flyer-missing"] });
    const html = renderToStaticMarkup(await NederlandsPage());
    expect(html).toContain("wordt voorbereid");
    expect(html).toContain("Nederlandse weekfolder is nog niet beschikbaar");
    expect(html).not.toContain("test-nl.pdf");
    expect(html).not.toContain("test-de.pdf");
    expect(html).toContain("Jurgensstraße 20");
  });
});
