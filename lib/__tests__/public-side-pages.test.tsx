import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CartProvider } from "@/context/CartContext";
import { courses } from "@/data/akademie";
import KontaktPage from "@/app/kontakt/page";
import PartyplanerPage from "@/app/partyplaner/page";
import EigenmarkePage from "@/app/eigenmarke/page";
import LeergutPage from "@/app/leergut/page";
import PartyspielePage from "@/app/partyspiele/page";
import AkademiePage from "@/app/akademie/page";
import CoursePage from "@/app/akademie/[slug]/page";
import FinderPage from "@/app/finder/page";

vi.mock("next/navigation", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/navigation")>(),
  useParams: () => ({ slug: "likoere" }),
}));

describe("public side-page presentation", () => {
  it.each([
    ["Kontakt", KontaktPage],
    ["Partyplaner", PartyplanerPage],
    ["Eigenmarken", EigenmarkePage],
    ["Leergut", LeergutPage],
    ["Partyspiele", PartyspielePage],
    ["Akademie", AkademiePage],
    ["Kurs", CoursePage],
    ["Finder", FinderPage],
  ])("renders %s without the old animated particles or giant emoji illustrations", (_name, Page) => {
    const html = renderToStaticMarkup(<CartProvider><Page /></CartProvider>);
    expect(html).not.toContain("particleFloat");
    const largeText = [...html.matchAll(/<(?:span|p|div)\b[^>]*class="[^"]*text-(?:[3-9]xl|\[\d+px\])[^"]*"[^>]*>([^<]*)<\//g)];
    for (const [, text] of largeText) {
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it("pairs every course destination with its approved illustrative cover and visible disclosure", () => {
    const html = renderToStaticMarkup(<AkademiePage />);
    expect([...html.matchAll(/<img\b/g)]).toHaveLength(8);
    expect(html).toContain("KI-generierte Themenbilder");
    const titles = [...html.matchAll(/<h2\b[^>]*>([^<]+)<\/h2>/g)].map(([, title]) => title.replaceAll("&amp;", "&"));
    for (const course of courses) {
      expect(html).toContain(`href="/akademie/${course.slug}"`);
      expect(titles).toContain(course.title);
    }
  });

  it("shows the original own-brand posters in full without cover-cropping or zoom", () => {
    const html = renderToStaticMarkup(<EigenmarkePage />);
    const posters = [...html.matchAll(/<img\b[^>]*>/g)];
    expect(posters).toHaveLength(6);
    for (const [poster] of posters) {
      expect(poster).toContain("object-contain");
      expect(poster).not.toMatch(/object-cover|scale-105/);
    }
  });
});
