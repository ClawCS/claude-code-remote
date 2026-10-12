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
import CourseLayout from "@/app/akademie/[slug]/layout";
import FinderPage from "@/app/finder/page";

vi.mock("next/navigation", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/navigation")>(),
  useParams: () => ({ slug: "likoere" }),
  usePathname: () => "/akademie/likoere", useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: () => {} }),
}));

async function CoursePresentation() {
  const params = Promise.resolve({ slug: "likoere" });
  return CourseLayout({ params, children: await CoursePage({ params }) });
}

describe("public side-page presentation", () => {
  it.each([
    ["Kontakt", KontaktPage],
    ["Partyplaner", PartyplanerPage],
    ["Eigenmarken", EigenmarkePage],
    ["Leergut", LeergutPage],
    ["Partyspiele", PartyspielePage],
    ["Akademie", AkademiePage],
    ["Kurs", CoursePresentation],
    ["Finder", FinderPage],
  ])("renders %s without the old animated particles or giant emoji illustrations", async (_name, Page) => {
    const content = Page === CoursePresentation ? await CoursePresentation() : <Page />;
    const html = renderToStaticMarkup(<CartProvider>{content}</CartProvider>);
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

  it("shows all six original bottle cutouts in the lineup and their native product stages", () => {
    const html = renderToStaticMarkup(<EigenmarkePage />).replaceAll("%2F", "/");
    const allImages = [...html.matchAll(/<img\b[^>]*>/g)].map(([image]) => image);
    expect(allImages.filter(image => image.includes("/images/brands/jammers-hilft-symbol.png"))).toHaveLength(1);
    const images = allImages.filter(image => !image.includes("/images/brands/jammers-hilft-symbol.png"));
    expect(images).toHaveLength(12);
    expect(html).not.toContain("/images/eigenmarken-scenes/group-dark-v1.webp");
    expect(html).not.toContain("/images/editorial/google/eigenmarken-flaschen.webp");
    expect(images.filter(image => image.includes("/images/eigenmarken/"))).toHaveLength(0);
    for (const slug of ["pralle-kirsche", "dicke-nuesse", "suesse-suende", "caramello", "schwarzer-teufel", "weisser-engel"]) {
      expect(images.filter(image => image.includes(`/images/eigenmarken-bottles/${slug}.png`))).toHaveLength(2);
      expect(html).toContain(`href="#${slug}"`);
      expect(html).toContain(`id="${slug}"`);
    }
  });
});
