import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { courses } from "@/data/akademie";
import KategoriePage from "@/app/kategorie/[slug]/page";
import EigenmarkePage from "@/app/eigenmarke/page";
import ProduktePage from "@/app/produkte/page";
import AkademiePage from "@/app/akademie/page";
import AssortmentSection from "@/components/cinematic/AssortmentSection";
import LocationFooter from "@/components/cinematic/LocationFooter";

vi.mock("next/navigation", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/navigation")>(),
  useSearchParams: () => new URLSearchParams(),
}));

function markup(element: React.ReactNode) {
  return renderToStaticMarkup(<CartProvider><WishlistProvider>{element}</WishlistProvider></CartProvider>);
}

function contextDestinations(html: string) {
  const section = html.match(/<aside\b[^>]*data-academy-context[^>]*>([\s\S]*?)<\/aside>/);
  expect(section, "the contextual knowledge entry must be rendered").not.toBeNull();
  return [...section![1].matchAll(/href="(\/akademie(?:\/[^\"]+)?)"/g)].map(([, href]) => href);
}

describe("academy discovery in the existing assortment", () => {
  // These assertions catch absent or unrelated learning destinations, not card styles.
  test.each([
    ["bier", ["/akademie/bier", "/akademie"]],
    ["alkoholfrei", ["/akademie/mineralwasser", "/akademie/saft", "/akademie"]],
    ["wein", ["/akademie/wein", "/akademie"]],
    ["sekt", ["/akademie/schaumwein", "/akademie"]],
    ["spirituosen", ["/akademie/whiskey", "/akademie/rum", "/akademie/likoere", "/akademie"]],
    ["lebensmittel", []],
  ])("offers only relevant courses on %s", async (slug, destinations) => {
    const html = markup(await KategoriePage({ params: Promise.resolve({ slug }) }));
    if (destinations.length === 0) expect(html).not.toContain("data-academy-context");
    else expect(contextDestinations(html)).toEqual(destinations);
  });

  test("own-brand knowledge links to the existing liqueur course with current metadata", () => {
    const html = markup(<EigenmarkePage />);
    expect(contextDestinations(html)).toEqual(["/akademie/likoere", "/akademie"]);
    const liqueur = courses.find(course => course.slug === "likoere")!;
    expect(html).toContain(`${liqueur.lessons.length} Lektionen`);
    expect(html).toContain(liqueur.duration);
  });

  test.each([
    ["homepage assortment", <AssortmentSection key="home" />],
    ["product overview", <ProduktePage key="products" />],
  ])("adds a compact academy destination to %s", (_label, element) => {
    const html = markup(element);
    expect(html).toMatch(/href="\/akademie"[^>]*>[^<]*Getränkeakademie/);
    expect(html).toContain(`${courses.length} Kurse`);
  });

  test("retains one hub with all eight existing course destinations", () => {
    const html = markup(<AkademiePage />);
    const destinations = [...html.matchAll(/href="(\/akademie\/(?!zertifikate)[^\"]+)"/g)].map(([, href]) => href);
    expect(destinations).toEqual([
      "/akademie/bier", "/akademie/whiskey", "/akademie/mineralwasser", "/akademie/saft",
      "/akademie/wein", "/akademie/schaumwein", "/akademie/likoere", "/akademie/rum",
    ]);
  });

  test("names the academy consistently in the public footer", () => {
    expect(markup(<LocationFooter />)).toMatch(/href="\/akademie"[^>]*>Getränkeakademie<\/a>/);
  });
});
