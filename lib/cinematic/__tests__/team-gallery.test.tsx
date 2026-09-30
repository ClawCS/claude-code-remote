import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

// Vite imports WebP as URL strings rather than Next's static image records.
// Replace only this framework boundary; gallery selection/captions stay real.
vi.mock("next/image", async () => {
  const { createElement } = await import("react");
  return { default: ({ src, alt, sizes, className }: {
    src: string | { src: string }; alt: string; sizes?: string; className?: string;
  }) => createElement("img", { src: typeof src === "string" ? src : src.src, alt, sizes, className }) };
});

import GaleriePage from "@/app/galerie/page";
import { galleryItems } from "@/data/gallery";

describe("source-gated team gallery", () => {
  test("restores all eleven names without turning group images into employees", () => {
    const html = renderToStaticMarkup(<GaleriePage />);
    for (const name of ["Niko", "Sven", "Jasmin", "Gabriella", "Jan Niklas", "Hanna", "Nico", "Nils", "Henri", "Tim", "Hannah"]) {
      expect(html).toContain(name);
    }
    expect(html).not.toMatch(/\d+ Mitarbeiter/);
    expect(html).not.toContain("Geschäftsführer");
    expect(html).not.toContain("Marketing");
  });

  test("restores the Canva-matched, operator-confirmed Henri and Hannah without rejected team members", () => {
    const html = renderToStaticMarkup(<GaleriePage />);
    expect(html).not.toContain("Bisherige Teamvorstellung");
    expect(html).not.toContain("Aktuelles Portrait noch nicht veröffentlicht");
    expect(html).toContain("team-henri");
    expect(html).toContain("team-hannah");
    expect(galleryItems.filter(({ image }) => image)).toHaveLength(11);
    expect(html).not.toMatch(/Harpe|Justin/i);
  });

  test("renders natural, local photos without an inaccessible overlay", () => {
    const html = renderToStaticMarkup(<GaleriePage />);
    expect(html).not.toContain("aspect-square");
    expect(html).not.toContain("object-cover");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("canva.com");
    expect(html).not.toMatch(/\bPB[A-Za-z0-9_-]{12,}\b/);
    expect(html.match(/<figure/g)).toHaveLength(12);
  });
});
