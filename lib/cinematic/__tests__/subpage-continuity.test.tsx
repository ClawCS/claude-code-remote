import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import PageIntro from "@/components/editorial/PageIntro";
import FlyerIndexView from "@/components/FlyerIndexView";
import type { FlyerIndex } from "@/lib/flyer-index";

describe("subpage visual continuity contracts", () => {
  // A removed intro boundary breaks the shared full-width surface and browser verification.
  test("marks the shared intro without requiring a new caller prop", () => {
    const html = renderToStaticMarkup(<PageIntro title="Unsere Welt" />);
    expect(html).toMatch(/<header[^>]*data-editorial-intro/);
  });

  // Moving content into the warm wrapper must not lose heading, current-page or link semantics.
  test("preserves the single title, breadcrumb destinations and action links", () => {
    const html = renderToStaticMarkup(<PageIntro id="visit-intro" className="narrow-reading" eyebrow="Entdecken" title={<em>Unsere Welt</em>} description={<p>Für deinen Besuch.</p>} breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Sortiment", href: "/produkte" }, { label: "Unsere Welt" }]}><a href="/kontakt">Besuch planen</a></PageIntro>);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("<h1><em>Unsere Welt</em></h1>");
    expect(html).toContain('aria-label="Brotkrumennavigation"');
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>Startseite<\/a>/);
    expect(html).toMatch(/<a[^>]*href="\/produkte"[^>]*>Sortiment<\/a>/);
    expect(html).toContain('<span aria-current="page">Unsere Welt</span>');
    expect(html).toContain('<a href="/kontakt">Besuch planen</a>');
    expect(html).toContain('id="visit-intro"');
    expect(html).toContain("narrow-reading");
  });

  // A visual refresh must not relabel an empty/future flyer input as a current offer.
  test("keeps a synthetic no-current-flyer state truthful with the shared intro", () => {
    const index: FlyerIndex = {
      status: "degraded", generatedAt: "2026-10-11T12:00:00Z", issues: ["nl-flyer-missing"], flyers: [],
      scheduled: [{ id: "future-nl", title: "Nederlandse weekfolder", language: "nl", validFrom: "2026-10-12", validTo: "2026-10-17" }],
    };
    const html = renderToStaticMarkup(<FlyerIndexView index={index} />);
    expect(html).toContain("Der nächste gültige Handzettel wird vorbereitet.");
    expect(html).toContain("Abgelaufene Ausgaben werden hier nicht als aktuelle Angebote angezeigt.");
    expect(html).toContain("Der niederländische Wochenflyer ist noch nicht verfügbar.");
    expect(html).toContain("Als Nächstes");
    expect(html).toContain("12.–17.10.2026");
    expect(html).not.toContain("data-flyer-viewer");
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });
});
