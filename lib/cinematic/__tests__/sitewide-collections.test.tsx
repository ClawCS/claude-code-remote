import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
// Vite cannot resolve Next's static WebP metadata; keep page content real.
vi.mock("next/image", () => ({ default: ({ src, alt, className }: { src: string | { src: string }; alt: string; className?: string }) => createElement("img", { src: typeof src === "string" ? src : src.src, alt, className }) }));
import ProductCatalogue from "@/components/ProductCatalogue";
import FlyerIndexView from "@/components/FlyerIndexView";
import EigenmarkePage from "@/app/eigenmarke/page";
import RegionalePage from "@/app/regionale-spirituosen/page";
import GeschenkPage from "@/app/geschenkideen/page";
import MarktPage from "@/app/marktleben/page";
import TeamPage from "@/app/galerie/page";
import GewinnPage from "@/app/gewinnspiel/page";
import ArchivPage from "@/app/gewinnspiel/archiv/page";
import type { WeeklyOfferContent } from "@/lib/weekly-publication-types";

const empty: WeeklyOfferContent = { status: "degraded", generatedAt: "2026-10-10T12:00:00Z", issues: [], flyers: [], offers: [] };

describe("editorial collection families", () => {
  // Catches a migrated route accidentally reverting to its old hero or losing its introduction.
  it.each([
    ["catalogue", <ProductCatalogue key="catalogue" content={empty}>{null}</ProductCatalogue>],
    ["flyers", <FlyerIndexView key="flyers" index={{ ...empty, scheduled: [] }} />],
    ["brands", <EigenmarkePage key="brands" />], ["regional", <RegionalePage key="regional" />],
    ["gifts", <GeschenkPage key="gifts" />], ["market", <MarktPage key="market" />],
    ["team", <TeamPage key="team" />], ["giveaways", <GewinnPage key="giveaways" />], ["archive", <ArchivPage key="archive" />],
  ])("%s gives customers one editorial heading and a separate collection body", (_, page) => {
    const html = renderToStaticMarkup(page);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/<header[^>]*class="[^"]*intro/);
    expect(html).toContain("data-collection=");
    expect(html).not.toContain("page-hero-banner");
    expect(html).not.toContain('class="category-intro');
  });

  it("keeps the catalogue's truthful empty result and search controls readable without hydration", () => {
    const html = renderToStaticMarkup(<ProductCatalogue content={empty} initialSearch="kein-treffer">{null}</ProductCatalogue>);
    expect(html).toContain('value="kein-treffer"');
    expect(html).toContain('aria-label="Handzettel-Sprache"');
    expect(html).toContain('role="status"');
    expect(html).toContain("kein passendes Einzelangebot freigegeben");
    expect(html).toContain('href="/angebote"');
  });
});
