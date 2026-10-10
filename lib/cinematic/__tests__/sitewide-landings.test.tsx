import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import type { FlyerIndex } from "@/lib/flyer-index";
import type { HomepageContent } from "@/lib/homepage-content";

// Vitest renders the server page in Node without Next's server-condition resolver.
vi.mock("server-only", () => ({}));
// Static image imports are handled by Next's compiler in the app, not Vitest.
vi.mock("next/image", async () => {
  const React = await import("react");
  return { default: ({ src, alt }: { src: string | { src: string }; alt: string }) =>
    React.createElement("img", { src: typeof src === "string" ? src : src.src, alt }) };
});
const state = vi.hoisted(() => ({ index: null as FlyerIndex | null }));
vi.mock("@/lib/flyer-index", () => ({ getFlyerIndex: async () => state.index }));

import CinematicHome from "@/components/cinematic/CinematicHome";
import NederlandsPage from "@/app/nl/page";

const flyers: FlyerIndex["flyers"] = [
  { id: "de-current", language: "de", title: "Angebote der Woche", validFrom: "2026-10-05", validTo: "2026-10-10", pageCount: 10, coverUrl: "/images/content/de-original.webp", pdfUrl: "/handzettel/de-original.pdf", viewerUrl: "/handzettel/de-original.pdf", sourceUrl: "https://werbung.trinkgut.de/catalog/original/view", pdfSha256: "a".repeat(64) },
  { id: "nl-current", language: "nl", title: "Nederlandse weekfolder met alle aanbiedingen voor een gezellig weekend in Goch", validFrom: "2026-10-05", validTo: "2026-10-10", pageCount: 1, coverUrl: "/images/content/nl-original.webp", pdfUrl: "/handzettel/nl-original.pdf", viewerUrl: "/handzettel/nl-original.pdf", sourceUrl: "https://www.canva.com/design/original/view", pdfSha256: "b".repeat(64) },
];
const content: HomepageContent = { generatedAt: "2026-10-10T10:00:00Z", flyer: flyers[0], nlFlyer: flyers[1], event: null, archive: [], fallbackMessage: null };
function home() { return renderToStaticMarkup(<CinematicHome content={content} nowIso={content.generatedAt} />); }
function section(html: string, id: string) { return html.match(new RegExp(`<section[^>]*id="${id}"[^>]*>[\\s\\S]*?</section>`))?.[0] ?? ""; }

describe("complete editorial landings", () => {
  // Removing a source/date or replacing a full cover with a marketing image loses a live destination.
  test("keeps both dated original flyers and direct PDF fallbacks in the home offer section", () => {
    const html = section(home(), "aktuell");
    for (const path of ["/images/content/de-original.webp", "/images/content/nl-original.webp", "/handzettel/de-original.pdf", "/handzettel/nl-original.pdf"]) expect(html).toContain(path);
    expect(html.match(/05.–10.10.2026/g)).toHaveLength(2);
    expect(html).toContain("10 Seiten");
    expect(html).toContain("1 pagina");
  });

  // Reinserting the duplicate rental list makes the homepage repeat the entire service story.
  test("offers planning, rental and advice together without a second service or price list", () => {
    const html = section(home(), "service");
    for (const href of ["/partyplaner", "/vermietung", "/kontakt"]) expect(html).toContain(`href="${href}"`);
    expect(html).not.toMatch(/<(?:ol|dl)\b/);
    expect(html).toContain("Verfügbarkeit und Konditionen klären wir persönlich.");
    expect(html).toContain("Eine Anfrage ist noch keine bestätigte Reservierung.");
  });

  // A three-brand-only spotlight would silently omit half the range from the homepage.
  test("represents all six own brands alongside the three complete original posters", () => {
    const html = section(home(), "eigenmarken");
    for (const name of ["Pralle Kirsche", "Dicke Nüsse", "Süsse Sünde", "Caramello", "Schwarzer Teufel", "Weisser Engel"]) expect(html).toMatch(new RegExp(`<a[^>]*href="/eigenmarke"[^>]*>[^<]*${name}`));
    for (const poster of ["poster-pralle-kirsche.webp", "poster-schwarzer-teufel.webp", "poster-caramello.webp"]) expect(html).toContain(poster);
    expect(html).toContain("/images/editorial/google/eigenmarken-flaschen.webp");
  });

  test("provides visible editorial entrances to people, career, market stories and the external TCG shop", () => {
    const html = home();
    const people = section(html, "menschen");
    expect(people).toContain('href="/galerie"');
    expect(people).toContain('href="/bewerbung"');
    for (const href of ["/marktleben", "/geschenkideen", "/regionale-spirituosen", "/akademie", "/cocktails", "/produkte"]) expect(section(html, "sortiment")).toContain(`href="${href}"`);
    expect(section(html, "grailbid")).toMatch(/href="https:\/\/grailbid.com"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  });

  test("renders Dutch dated originals, native visit controls and one landmark tree", async () => {
    state.index = { status: "ok", generatedAt: content.generatedAt, issues: [], flyers, scheduled: [] };
    const html = renderToStaticMarkup(await NederlandsPage());
    const current = section(html, "handzettel");
    expect(current).toContain('aria-labelledby="nl-current-title"');
    expect(current).toContain(flyers[1].title);
    for (const flyer of flyers) expect(current).toContain(flyer.pdfUrl);
    expect(current.match(/05.–10.10.2026/g)).toHaveLength(2);
    expect(html).toContain("Plan je route naar Trinkgut Jammers in Google Maps");
    expect(html).toContain("Stuur een WhatsApp-bericht");
    expect(html).toContain("Een aanvraag is nog geen bevestigde reservering.");
    for (const tag of ["header", "main", "footer", "h1"]) expect(html.match(new RegExp(`<${tag}\\b`, "g"))).toHaveLength(1);
  });

  test("keeps empty, missing-NL and future flyer states truthful and localized", async () => {
    state.index = { status: "degraded", generatedAt: content.generatedAt, issues: ["nl-flyer-missing"], flyers: [], scheduled: [{ id: "future", title: "Volgende week", language: "nl", validFrom: "2026-10-12", validTo: "2026-10-17" }] };
    const html = section(renderToStaticMarkup(await NederlandsPage()), "handzettel");
    expect(html).toContain("Verlopen folders worden niet als actuele aanbiedingen getoond.");
    expect(html).toContain("De Nederlandse weekfolder is nog niet beschikbaar.");
    expect(html).toContain("Binnenkort");
    expect(html).toContain("12.–17.10.2026");
    expect(html).not.toContain("data-flyer-viewer");
  });
});
