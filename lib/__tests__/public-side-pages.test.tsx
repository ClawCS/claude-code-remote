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
    expect(html).not.toMatch(/\bKI\b/);
    const largeText = [...html.matchAll(/<(?:span|p|div)\b[^>]*class="[^"]*text-(?:[3-9]xl|\[\d+px\])[^"]*"[^>]*>([^<]*)<\//g)];
    for (const [, text] of largeText) {
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it("pairs every course destination with its approved cover without technical generation labels", () => {
    const html = renderToStaticMarkup(<AkademiePage />);
    expect([...html.matchAll(/<img\b/g)]).toHaveLength(8);
    expect(html).not.toMatch(/\bKI\b|KI-generiert/);
    const titles = [...html.matchAll(/<h2\b[^>]*>([^<]+)<\/h2>/g)].map(([, title]) => title.replaceAll("&amp;", "&"));
    for (const course of courses) {
      expect(html).toContain(`href="/akademie/${course.slug}"`);
      expect(titles).toContain(course.title);
    }
  });

  it("shows the original own-brand posters in full without cover-cropping or zoom", () => {
    const html = renderToStaticMarkup(<EigenmarkePage />);
    const posters = [...html.matchAll(/<img\b[^>]*>/g)].filter(([image]) => image.includes("/images/eigenmarken/"));
    expect(posters).toHaveLength(6);
    for (const [poster] of posters) {
      expect(poster).toContain("object-contain");
      expect(poster).not.toMatch(/object-cover|scale-105/);
    }
  });

  it("introduces all six original posters with the separate full-frame dark bottle scene", () => {
    const html = renderToStaticMarkup(<EigenmarkePage />).replaceAll("%2F", "/");
    const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([image]) => image);
    expect(images).toHaveLength(7);
    expect(images[0]).toContain("/images/eigenmarken-scenes/group-dark-v1.webp");
    expect(html).not.toContain("/images/editorial/google/eigenmarken-flaschen.webp");
    expect(images[0]).toContain('width="1536"');
    expect(images[0]).toContain('height="1024"');
    expect(images[0]).toContain('loading="lazy"');
    expect(images[0]).not.toMatch(/object-cover|data-nimg="fill"/);
    expect(images.filter(image => image.includes("/images/eigenmarken/"))).toHaveLength(6);
    for (const poster of ["pralle-kirsche", "dicke-nuesse", "suesse-suende", "caramello", "schwarzer-teufel", "weisser-engel"]) {
      expect(images.filter(image => image.includes(`/images/eigenmarken/${poster}.png`))).toHaveLength(1);
    }
  });
});
