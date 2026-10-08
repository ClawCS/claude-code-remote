import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

// Adapt only Next's static image boundary; the shared header and links stay real.
vi.mock("@/public/images/home/brand-logo.webp", () => ({
  default: { src: "/images/home/brand-logo.webp", width: 520, height: 198 },
}));

import CinematicHeader from "@/components/cinematic/CinematicHeader";

describe("public header Dutch entry", () => {
  // A missing, menu-only, or wrong-route entry must fail these assertions.
  test("offers a labelled Dutch destination before the main navigation and outside the mobile menu", () => {
    const html = renderToStaticMarkup(<CinematicHeader nowIso="2026-10-08T10:00:00.000Z" hasActions />);
    const links = [...html.matchAll(/<a\b([^>]*href="\/nl"[^>]*)>([\s\S]*?)<\/a>/g)];
    expect(links).toHaveLength(1);
    const [link, attributes, content] = links[0];
    expect(attributes).toContain('lang="nl"');
    expect(attributes).toContain('hrefLang="nl"');
    expect(attributes).toContain('aria-label="Nederlands · Click here"');
    expect(content).toContain("Nederlands");
    expect(content).toContain("Click here");
    expect(content).toMatch(/<span\b[^>]*aria-hidden="true"[^>]*>🇳🇱<\/span>/);
    expect(content).toMatch(/<span\b[^>]*aria-hidden="true"[^>]*>→<\/span>/);
    expect(html.indexOf(link)).toBeLessThan(html.indexOf('aria-label="Hauptnavigation"'));
    expect(html.indexOf(link)).toBeLessThan(html.indexOf("<details"));
    expect(attributes).not.toMatch(/(?:^|\s)hidden(?:[=\s]|$)/);
  });
});
