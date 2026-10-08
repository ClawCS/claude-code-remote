import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import FlyerViewer from "@/components/cinematic/FlyerViewer";
import type { HomepageFlyer } from "@/lib/homepage-content";

const flyer: HomepageFlyer = {
  id: "hydration-fixture",
  title: "Aktueller Handzettel",
  validFrom: "2026-09-28",
  validTo: "2026-10-03",
  viewerUrl: "https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest",
  pdfUrl: "https://werbung.trinkgut.de/frontend/catalogs/fixture/pdf/complete.pdf",
  pageCount: 10,
  coverUrl: "/images/home/brand-logo.webp",
  sourceUrl: "https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest",
};

describe("flyer viewer before client hydration", () => {
  it("renders a single-page original at natural aspect ratio and full card width", () => {
    const html=renderToStaticMarkup(<FlyerViewer flyer={{...flyer,pageCount:1}}/>);
    expect(html).toContain('data-single-page="true"');
    expect(html).not.toContain('data-nimg="fill"');
  });
  it.each([
    ["de", "Handzettel ansehen"],
    ["nl", "Folder bekijken"],
  ] as const)("does not offer an inert dialog button in %s server HTML", (locale, label) => {
    const html = renderToStaticMarkup(<FlyerViewer flyer={flyer} locale={locale} />);
    const trigger = html.match(new RegExp(`<button([^>]*)>${label}</button>`));
    expect(trigger).not.toBeNull();
    expect(trigger?.[1]).toMatch(/\bdisabled=""/);
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('role="dialog"');

    // The native alternatives stay available even if JavaScript never loads.
    for (const href of [flyer.viewerUrl, flyer.pdfUrl]) {
      const anchor = html.match(new RegExp(`<a[^>]*href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`));
      expect(anchor).not.toBeNull();
      expect(anchor?.[0]).toContain('target="_blank"');
      expect(anchor?.[0]).toContain('rel="noopener noreferrer"');
    }
  });
});
