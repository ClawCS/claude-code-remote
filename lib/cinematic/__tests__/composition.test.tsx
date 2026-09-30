import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import type { HomepageContent } from "@/lib/homepage-content";

vi.mock("next/link", async () => {
  const React = await import("react");

  return {
    default: ({
      children,
      href,
      prefetch,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string | URL;
      prefetch?: boolean;
    }) =>
      React.createElement(
        "a",
        {
          ...props,
          href: String(href),
          "data-prefetch": String(prefetch),
        },
        children,
      ),
  };
});

vi.mock("next/image", async () => {
  const React = await import("react");

  return {
    default: (props: {
      src: string | { src: string };
      alt: string;
      fill?: boolean;
      priority?: boolean;
      placeholder?: string;
      blurDataURL?: string;
      quality?: number;
      loader?: unknown;
      unoptimized?: boolean;
    } & React.ImgHTMLAttributes<HTMLImageElement>) => {
      const imageProps = { ...props } as Record<string, unknown>;
      for (const nextOnlyProp of [
        "fill",
        "priority",
        "placeholder",
        "blurDataURL",
        "quality",
        "loader",
        "unoptimized",
      ]) {
        delete imageProps[nextOnlyProp];
      }
      return React.createElement("img", {
        ...imageProps,
        alt: props.alt,
        src: typeof props.src === "string" ? props.src : props.src.src,
      });
    },
  };
});

import CinematicHome from "@/components/cinematic/CinematicHome";

const emptyContent: HomepageContent = {
  generatedAt: "2026-07-14T06:15:00.000Z",
  flyer: null,
  event: null,
  archive: [],
  fallbackMessage: "Der nächste Handzettel wird vorbereitet.",
};

const populatedContent: HomepageContent = {
  generatedAt: "2026-07-14T12:00:00.000Z",
  flyer: {
    id: "catalog-13027-29-2026",
    title: "Angebote der Woche",
    validFrom: "2026-07-13",
    validTo: "2026-07-18",
    viewerUrl: "https://werbung.trinkgut.de/catalog/1335913/view",
    pdfUrl: "https://werbung.trinkgut.de/catalog/1335913/flyer.pdf",
    pageCount: 10,
    coverUrl: "https://werbung.trinkgut.de/catalog/1335913/page-01.jpg",
    sourceUrl: "https://werbung.trinkgut.de/catalog/1335913/view",
  },
  event: {
    id: "striker-2026",
    title: "Striker Ball Challenge",
    summary: "Am 24. Juli wartet die Striker Ball Challenge im Markt.",
    validFrom: "2026-07-14",
    validTo: "2026-07-24",
    image: "/images/events/strikerball.png",
    href: "/kontakt",
    sourceUrl: "https://www.trinkgut.de/aktionen/striker-ball-challenge",
  },
  archive: [
    {
      id: "sommerfest-2026",
      title: "Sommerfest im Markt",
      date: "2026-07-01",
      image: "/images/events/sommerfest.webp",
      kind: "event",
    },
  ],
  fallbackMessage: null,
};

function render(content: HomepageContent, nowIso = "2026-07-14T12:00:00.000Z"): string {
  return renderToStaticMarkup(
    <CinematicHome
      content={content}
      nowIso={nowIso}
    />,
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function count(html: string, pattern: RegExp): number {
  return [...html.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`))].length;
}

function extractElement(html: string, tag: string, selector: string): string {
  const match = new RegExp(
    `<${tag}[^>]*${selector}[^>]*>[\\s\\S]*?</${tag}>`,
  ).exec(html);
  expect(match, `${tag}[${selector}] must exist`).not.toBeNull();
  return match![0];
}

function anchorTagsForHref(html: string, href: string): string[] {
  const exactHref = escapeRegExp(href).replaceAll("&", "(?:&|&amp;)");
  return [
    ...html.matchAll(
      new RegExp(`<a\\b[^>]*href="${exactHref}"[^>]*>`, "g"),
    ),
  ].map(([tag]) => tag);
}

function expectSafeExternalLink(html: string, href: string): void {
  const anchors = anchorTagsForHref(html, href);
  expect(anchors.length, `external link ${href}`).toBeGreaterThan(0);
  for (const anchor of anchors) {
    expect(anchor).toContain('target="_blank"');
    expect(anchor).toContain('rel="noopener noreferrer"');
  }
}

function expectEveryFragmentResolvesOnce(html: string): void {
  const fragmentHrefs = [
    ...html.matchAll(/<a\b[^>]*href="#([^"]+)"[^>]*>/g),
  ].map(([, id]) => id);
  expect(fragmentHrefs.length).toBeGreaterThan(0);
  for (const id of new Set(fragmentHrefs)) {
    expect(count(html, new RegExp(`\\bid="${escapeRegExp(id)}"`))).toBe(1);
  }
}

describe("cinematic homepage composition", () => {
  test("shows sourced giveaways and a dedicated agenda without stale chances", () => {
    const september = render(emptyContent, "2026-09-30T12:00:00.000Z");
    expect(september).toContain("Veltins Helles Lager");
    expect(september).toContain("Guinness Tasche");
    expect(september).toContain('href="/gewinnspiel#jahresagenda"');
    const october = render(emptyContent, "2026-10-01T12:00:00.000Z");
    expect(october).not.toContain("Veltins Helles Lager");
    expect(october).toContain("Guinness Tasche");
    const after = render(emptyContent, "2026-10-04T12:00:00.000Z");
    expect(after).not.toContain("Guinness Tasche");
    expect(after).toContain('href="/gewinnspiel"');
  });
  test("owns one semantic landmark tree and keeps the required section order", () => {
    const html = render(populatedContent);

    expect(count(html, /<h1\b/)).toBe(1);
    expect(count(html, /<header\b/)).toBe(1);
    expect(count(html, /<main\b/)).toBe(1);
    expect(count(html, /<footer\b/)).toBe(1);

    const main = extractElement(html, "main", 'id="main-content"');
    expect(main).not.toMatch(/<header\b|<footer\b/);
    expect(html).toMatch(/<header\b[\s\S]*?<\/header>[\s\S]*?<main\b[\s\S]*?<\/main>[\s\S]*?<footer\b/);

    const orderedMarkers = [
      'data-hero="cinematic"',
      'id="aktuell"',
      'id="sortiment"',
      'id="service"',
      'id="eigenmarken"',
      'id="aktionen"',
      'id="menschen"',
      'id="grailbid"',
      'id="instagram"',
      'id="kontakt"',
    ];
    const positions = orderedMarkers.map((marker) => html.indexOf(marker));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    expectEveryFragmentResolvesOnce(html);
  });

  test("renders the audited people and poster manifests in exact order", () => {
    const html = render(emptyContent);
    const people = extractElement(html, "section", 'id="menschen"');
    const spotlight = extractElement(html, "section", 'id="eigenmarken"');

    expect(count(people, /<figure\b/)).toBe(12);
    const peopleOrder = [
      "Team Jammers",
      "Niko · Inhaber",
      "Sven · Team Jammers",
      "Jasmin · Team Jammers",
      "Gabriella · Team Jammers",
      "Jan Niklas · Team Jammers",
      "Hanna · Team Jammers",
      "Nico · Team Jammers",
      "Nils · Team Jammers",
      "Tim · Team Jammers",
    ].map((caption) => people.indexOf(caption));
    expect(peopleOrder.every((position) => position >= 0)).toBe(true);
    expect(peopleOrder).toEqual(
      [...peopleOrder].sort((left, right) => left - right),
    );

    expect(count(spotlight, /<figure\b/)).toBe(3);
    const posterOrder = [
      "Pralle Kirsche",
      "Schwarzer Teufel",
      "Caramello",
    ].map((name) => spotlight.indexOf(name));
    expect(posterOrder.every((position) => position >= 0)).toBe(true);
    expect(posterOrder).toEqual(
      [...posterOrder].sort((left, right) => left - right),
    );
  });

  test("gives only the responsive Hero image high fetch priority", () => {
    const html = render(populatedContent);
    const hero = extractElement(html, "section", 'data-hero="cinematic"');
    const heroImage = /<img\b[^>]*alt="Sven und Niko von Trinkgut Jammers"[^>]*>/.exec(
      hero,
    );

    expect(heroImage).not.toBeNull();
    expect(heroImage![0]).toContain('fetchPriority="high"');
    expect(heroImage![0]).toContain(
      'sizes="(max-width: 47.999rem) 100vw, (max-width: 79.999rem) 40vw, min(50vw, 915px)"',
    );
    expect(count(html, /<img\b[^>]*fetchPriority="high"/)).toBe(1);
    expect(count(html, /<link\b[^>]*fetchPriority="high"/)).toBe(1);
  });

  test("passes through the exact empty state and exposes no phantom action", () => {
    const html = render(emptyContent);

    expect(html).toContain("Der nächste Handzettel wird vorbereitet.");
    expect(html).not.toContain("Der nächste Handzettel wird vorbereitet</p>");
    expect(html).toContain('id="aktionen"');
    expect(html).toContain("Die Bedingungen und Laufzeiten findest du beim jeweiligen Beitrag.");
    expect(html).not.toContain("data-action-current");
    expect(html).not.toContain("Angebote der Woche");
    expect(html).not.toContain("Striker Ball Challenge");
    expect(html).not.toContain("Sommerfest im Markt");
    expectEveryFragmentResolvesOnce(html);
  });

  test("uses only adapter-owned flyer, event, and archive facts", () => {
    const html = render(populatedContent);
    const current = extractElement(html, "section", 'id="aktuell"');
    const actions = extractElement(html, "section", 'id="aktionen"');

    expect(current).toContain("Angebote der Woche");
    expect(current).toContain("Gültig 13.–18.07.2026");
    expect(current).toContain("10 Seiten");
    expect(current).toContain("Striker Ball Challenge");
    expect(current).toContain(
      "Am 24. Juli wartet die Striker Ball Challenge im Markt.",
    );
    expect(current).not.toContain("Der nächste Handzettel wird vorbereitet.");

    const eventInterval = extractElement(
      current,
      "p",
      "data-event-interval",
    );
    expect(eventInterval).toContain("Aktionszeitraum · 14.–24.07.2026");
    expect(eventInterval).not.toMatch(/Termin|>Am\s/);
    expect(actions).toContain("Rückblick · 01.07.2026");
    expect(actions).toContain("Sommerfest im Markt");

    expect(count(html, /<iframe\b/)).toBe(0);
    expectSafeExternalLink(
      html,
      "https://werbung.trinkgut.de/catalog/1335913/view",
    );
    expectSafeExternalLink(
      html,
      "https://werbung.trinkgut.de/catalog/1335913/flyer.pdf",
    );
  });

  test("keeps giveaway subpages reachable even without an editorial event", () => {
    const html = render(populatedContent);

    expect(count(html, /\bid="aktionen"/)).toBe(1);
    expect(count(html, /href="\/gewinnspiel"/)).toBeGreaterThanOrEqual(2);
    expect(count(render(emptyContent), /href="\/gewinnspiel"/)).toBeGreaterThanOrEqual(2);
    expectEveryFragmentResolvesOnce(html);
  });

  test("renders the honest Instagram fallback without invented posts or dates", () => {
    const html = render(populatedContent);
    const instagram = extractElement(html, "section", 'id="instagram"');

    expect(instagram).toContain("Marktleben, neue Produkte, Verkostungen und Gewinnspiele");
    expect(count(instagram, /<figure\b/)).toBe(0);
    expect(count(instagram, /<time\b/)).toBe(0);
    expect(instagram).not.toContain("reviewedAt");
  });

  test("renders only confirmed copy, evidence labels, and contact destinations", () => {
    const html = render(populatedContent);

    expect(html).toContain("Wir beraten dich persönlich");
    expect(count(html, /Termin &amp; Verfügbarkeit anfragen/)).toBe(5);
    expect(html).toContain("150 €");
    expect(html).toContain("Bestand laut Liste");
    expect(html).toContain("01.01.2026");
    expect(html).toContain("06.03.2026");
    expect(html).toContain("Mo–Sa 08:00–20:00 Uhr");
    expect(html).toContain("Sonn- und Feiertage geschlossen");
    expect(html).toContain("Jurgenstr. 20");
    expect(html).toContain("47574 Goch");

    for (const forbidden of [
      "assets/source",
      "Preislisten",
      "7.000",
      "Lieferung",
      "inStock",
      "sofort verfügbar",
      "Rabatt",
    ]) {
      expect(html).not.toContain(forbidden);
    }

    expect(anchorTagsForHref(html, "tel:+492823418707").length).toBeGreaterThan(0);
    expect(
      anchorTagsForHref(html, "mailto:jammers-goch@trinkgut.de").length,
    ).toBeGreaterThan(0);
    for (const href of [
      "https://wa.me/491752492386?text=Hallo%20Trinkgut%20Jammers%2C%20ich%20habe%20eine%20Frage.",
      "https://www.google.com/maps/dir/?api=1&destination=Jurgenstr.+20%2C+47574+Goch",
      "https://grailbid.com",
      "https://www.instagram.com/trinkgutjammers_goch/",
    ]) {
      expectSafeExternalLink(html, href);
    }
    for (const href of [
      "/nl",
      "/kontakt",
      "/impressum",
      "/datenschutz",
      "/agb",
    ]) {
      const anchors = anchorTagsForHref(html, href);
      expect(anchors.length, `internal link ${href}`).toBeGreaterThan(0);
      for (const anchor of anchors) {
        expect(anchor).not.toContain('target="_blank"');
      }
    }
  });

  test("keeps internal events same-tab and secures external event/source URLs", () => {
    const internalHtml = render(populatedContent);
    const internalEventLinks = anchorTagsForHref(internalHtml, "/kontakt");
    expect(internalEventLinks.length).toBeGreaterThan(0);
    for (const anchor of internalEventLinks) {
      expect(anchor).not.toContain('target="_blank"');
    }
    expectSafeExternalLink(
      internalHtml,
      "https://www.trinkgut.de/aktionen/striker-ball-challenge",
    );

    const externalHref = "https://www.trinkgut.de/aktionen/striker-extern";
    const externalHtml = render({
      ...populatedContent,
      event: { ...populatedContent.event!, href: externalHref },
    });
    expectSafeExternalLink(externalHtml, externalHref);
  });
});
