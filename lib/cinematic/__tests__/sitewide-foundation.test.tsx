import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync } from "node:fs";
import { describe, expect, test, vi } from "vitest";
import PageIntro from "@/components/editorial/PageIntro";
import { CINEMATIC_NAV } from "../site";
import { cinematicHomeTokenStyle, cinematicTokenStyle } from "../tokens";
import { SITEWIDE_DESIGN_CASES, SITEWIDE_DESIGN_EXCLUSIONS } from "@/e2e/sitewide-design-cases";
import { cocktailCatalog } from "@/lib/cocktail-routes";
import { categories } from "@/lib/utils";
import { courses } from "@/data/akademie";

vi.mock("@/public/images/home/brand-logo.webp", () => ({
  default: { src: "/images/home/brand-logo.webp", width: 520, height: 198 },
}));
import CinematicHeader from "@/components/cinematic/CinematicHeader";

describe("shared editorial foundation", () => {
  test("acceptance matrix covers each customer template and only real catalog examples", () => {
    const templates = readdirSync("app", { recursive: true }).filter((file): file is string => typeof file === "string" && /(^|\/)page\.tsx$/.test(file))
      .map(file => `/${file.replace(/(^|\/)page\.tsx$/, "")}`);
    expect(SITEWIDE_DESIGN_CASES).toHaveLength(37);
    expect([...SITEWIDE_DESIGN_CASES, ...SITEWIDE_DESIGN_EXCLUSIONS].map(item => item.template).sort()).toEqual(templates.sort());
    const validExamples = [
      ...categories.map(category => `/kategorie/${category.slug}`),
      ...cocktailCatalog.categories.map(category => category.href),
      ...cocktailCatalog.recipes.map(recipe => recipe.href),
      ...courses.map(course => `/akademie/${course.slug}`),
    ];
    for (const item of SITEWIDE_DESIGN_CASES.filter(item => item.template.includes("[slug]"))) expect(validExamples).toContain(item.path);
    expect(SITEWIDE_DESIGN_CASES.find(item => item.template === "/mietbestellung/[id]")?.path).toBe("/mietbestellung/design-missing-token");
  });
  test("renders five navigation groups without losing customer destinations", () => {
    expect(CINEMATIC_NAV.map(item => item.label)).toEqual([
      "Angebote", "Sortiment", "Party & Miete", "Jammers entdecken", "Dein Besuch",
    ]);
    const html = renderToStaticMarkup(<CinematicHeader nowIso="2026-10-10T10:00:00Z" hasActions />);
    for (const href of ["/angebote", "/produkte", "/vermietung", "/partyplaner", "/warenkorb", "/eigenmarke", "/regionale-spirituosen", "/geschenkideen", "/marktleben", "/gewinnspiel", "https://grailbid.com", "/cocktails", "/akademie", "/galerie", "/bewerbung", "/kontakt"]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toMatch(/<a[^>]*href="\/vermietung"[^>]*>Party &amp; Miete<\/a>/);
    expect(html).toContain('aria-label="Party &amp; Miete – Untermenü öffnen"');
    expect(html).toMatch(/<a(?=[^>]*href="\/")(?=[^>]*aria-label="Trinkgut Jammers – Startseite")[^>]*>/);
    expect(html).toContain("brand-logo.webp");
    expect(html).toContain("whatsapp");
  });

  test("global and home consumers receive the same neutral paper, surface and readable ink", () => {
    for (const style of [cinematicTokenStyle, cinematicHomeTokenStyle]) {
      expect(style).toMatchObject({
        "--cinematic-color-paper": "#FAF9F6",
        "--cinematic-color-surface": "#F2F0EC",
        "--cinematic-color-ink": "#191918",
      });
    }
  });

  test("PageIntro renders one semantic title and real breadcrumb destinations", () => {
    const html = renderToStaticMarkup(<PageIntro id="intro" className="family" eyebrow="Entdecken" title={<em>Unsere Welt</em>} description={<span>Für deinen Besuch.</span>} breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Unsere Welt" }]}><a href="/kontakt">Besuch planen</a></PageIntro>);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("<em>Unsere Welt</em>");
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>Startseite<\/a>/);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/kontakt"');
    expect(html).toContain('id="intro"');
    expect(html).toContain("family");
  });
});
