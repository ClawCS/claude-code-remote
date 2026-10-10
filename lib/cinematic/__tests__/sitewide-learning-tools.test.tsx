import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import CocktailsPage from "@/app/cocktails/page";
import CocktailRecipePage from "@/app/cocktails/[slug]/page";
import CocktailCategoryPage from "@/app/cocktails/kategorie/[slug]/page";
import AkademiePage from "@/app/akademie/page";
import CoursePage from "@/app/akademie/[slug]/page";
import ZertifikatePage from "@/app/akademie/zertifikate/page";
import FinderPage from "@/app/finder/page";
import PartyplanerPage from "@/app/partyplaner/page";
import PartyspielePage from "@/app/partyspiele/page";
import LeergutPage from "@/app/leergut/page";
import OekoPage from "@/app/oeko-tracker/page";
import CommunityPage from "@/app/community/page";
import KuehlschrankPage from "@/app/kuehlschrank/page";
import SearchBar from "@/components/SearchBar";

// Next's route context is the only boundary replaced; course content and UI are real.
const routeParams = vi.hoisted(() => ({ slug: "whiskey" }));
vi.mock("next/navigation", async (original) => ({
  ...await original<typeof import("next/navigation")>(), useParams: () => routeParams,
}));

describe("learning and customer workspaces", () => {
  it("keeps the visible search label inside the accessible input name", () => {
    const html = renderToStaticMarkup(<SearchBar value="" onChange={() => {}} />);
    const visibleLabel = html.match(/<label[^>]*>([^<]+)<input/)?.[1].trim();
    const accessibleName = html.match(/aria-label="([^"]+)"/)?.[1];
    expect(visibleLabel).toBeTruthy();
    expect(accessibleName).toContain(visibleLabel);
  });
  it("exposes the eco input mode state to assistive technology", () => {
    const html = renderToStaticMarkup(<OekoPage />);
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*>\s*Manuell eingeben/);
  });
  // A lost intro/heading or a page accidentally left on the legacy layout breaks these checks.
  it.each([
    ["recipes", CocktailsPage], ["academy", AkademiePage], ["lesson", CoursePage],
    ["certificates", ZertifikatePage], ["finder", FinderPage], ["planner", PartyplanerPage],
    ["games", PartyspielePage], ["deposit", LeergutPage], ["eco", OekoPage],
    ["community", CommunityPage], ["fridge", KuehlschrankPage],
  ])("%s has one editorial heading followed by its own content workspace", (_, Page) => {
    const html = renderToStaticMarkup(<Page />);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/<header[^>]*class="[^"]*intro/);
    expect(html).toMatch(/data-(learning|tool)=/);
    expect(html).not.toContain("page-hero-banner");
  });

  it("keeps recipe ingredients, licensed photo and preparation together in the detail workspace", async () => {
    const html = renderToStaticMarkup(await CocktailRecipePage({ params: Promise.resolve({ slug: "pi-a-colada" }) }));
    expect(html).toContain('data-learning="recipe"');
    expect(html).toContain('id="recipe-ingredients"');
    expect(html).toContain('id="recipe-instructions"');
    expect(html).toContain("Public domain");
    expect(html).toContain('href="https://commons.wikimedia.org/wiki/File:Pi%C3%B1a_Colada.jpg#Licensing"');
    const category = renderToStaticMarkup(await CocktailCategoryPage({ params: Promise.resolve({ slug: "rum" }) }));
    expect(category).toContain('data-learning="recipes"');
    expect(category).toContain('aria-current="page"');
  });

  it("names course navigation and exposes full lesson names and the locked exam", () => {
    const html = renderToStaticMarkup(<CoursePage />);
    expect(html).toContain('aria-label="Kurslektionen"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Erst alle Quiz abschließen");
    expect(html).not.toContain('class="truncate"');
  });

  it("turns lesson section markers into readable semantic subheadings", () => {
    const html = renderToStaticMarkup(<CoursePage />);
    expect(html).toContain("<h3>Whisky — Eine Spirituose mit klaren Regeln</h3>");
    expect(html).not.toContain("## Whisky —");
    expect(html).toContain('href="#course-lesson"');
  });

  it("preserves the deeper section hierarchy in mineral-water lessons", () => {
    routeParams.slug = "mineralwasser";
    try {
      const html = renderToStaticMarkup(<CoursePage />);
      expect(html).toContain("<h3>Was ist natürliches Mineralwasser?</h3>");
      expect(html).toContain("<h4>Die amtliche Anerkennung</h4>");
      expect(html).not.toContain("### Die amtliche");
    } finally {
      routeParams.slug = "whiskey";
    }
  });

  it("gives each deposit counter a distinct operation and related input", () => {
    const html = renderToStaticMarkup(<LeergutPage />);
    expect(html).toContain('aria-label="Weniger Einweg PET-Flasche"');
    expect(html).toContain('aria-label="Mehr Einweg PET-Flasche"');
    expect(html).toContain('aria-label="Anzahl Einweg PET-Flasche"');
    expect(html).toContain('aria-label="Foto-Scan derzeit nicht verfügbar"');
  });

  it("keeps retired functions unavailable and avoids unconfirmed funding promises", () => {
    expect(renderToStaticMarkup(<CommunityPage />)).toContain("keine neuen Profile");
    expect(renderToStaticMarkup(<KuehlschrankPage />)).toContain("keine Bilder hochgeladen");
    expect(renderToStaticMarkup(<ZertifikatePage />)).not.toMatch(/Bildungsgutschein|Mitarbeiterunterstützung|Förderberatung/);
  });
});
