import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ContentSources from "@/components/editorial/ContentSources";

// Breaks caught: script-only/hidden content passing as initial HTML; wrong or
// duplicate canonicals; changed recipe/schema fields or an invented photo.
const modules = import.meta.glob("../../scripts/audit-search-readiness.ts");
async function audit() {
  const load = modules["../../scripts/audit-search-readiness.ts"];
  expect(load, "read-only search acceptance harness exists").toBeTypeOf("function");
  return await load() as typeof import("../../scripts/audit-search-readiness");
}
const head = '<link rel="canonical" href="https://trinkgut-jammers.de/example"><meta name="robots" content="index, follow">';

describe("search acceptance boundary", () => {
  it("rejects hidden, stale or source-incomplete review evidence", async () => {
    const { checkContentReview } = await audit();
    const html = renderToStaticMarkup(createElement(ContentSources, { id: "recipe:negroni" }));
    expect(checkContentReview(html, "recipe:negroni")).toEqual([]);
    expect(checkContentReview(`<div hidden>${html}</div>`, "recipe:negroni").join()).toMatch(/review/i);
    expect(checkContentReview(html.replace("2026-10-12", "2026-10-11"), "recipe:negroni").join()).toMatch(/date/i);
    expect(checkContentReview(html.replace(/href="[^"]+"/g, 'href="https://example.org"'), "recipe:negroni").join()).toMatch(/source/i);
  });
  it("rejects wrong, duplicate and noindex canonicals", async () => {
    const { checkPage } = await audit();
    expect(checkPage(head, "/example", null)).toEqual([]);
    expect(checkPage(head, "/other", null).join()).toMatch(/canonical/);
    expect(checkPage(head + head, "/example", null).join()).toMatch(/canonical/);
    expect(checkPage(head + '<meta name="robots" content="noindex">', "/example", null).join()).toMatch(/noindex/);
    expect(checkPage(head, "/example", "noindex").join()).toMatch(/noindex/);
    expect(checkPage('<link rel="canonical" href="https://trinkgut-jammers.de">', "/", null)).toEqual([]);
  });
  it("requires the whole selected lesson in rendered content, not scripts or hidden nodes", async () => {
    const { checkLesson } = await audit();
    const lesson = { title: "Grundlagen", content: "**Erster** Absatz.\n\n## Zweiter Abschnitt\n\nLetzter Absatz." };
    const visible = '<section id="course-lesson"><h2>Grundlagen</h2><p><strong>Erster</strong> Absatz.</p><h3>Zweiter Abschnitt</h3><p>Letzter Absatz.</p></section>';
    expect(checkLesson(visible, lesson)).toEqual([]);
    expect(checkLesson('<script>' + visible + '</script>', lesson)).not.toEqual([]);
    expect(checkLesson('<div hidden>' + visible + '</div>', lesson)).not.toEqual([]);
    expect(checkLesson(visible.replace("Letzter Absatz.", ""), lesson).join()).toMatch(/content/);
    expect(checkLesson('<section id="course-lesson"><h2>Grundlagen</h2><p>Ein <strong>Wort</strong>, genau.</p></section>', { title: "Grundlagen", content: "Ein **Wort**, genau." })).toEqual([]);
  });
  it("compares recipe schema and visible ingredients/instructions with the reviewed source", async () => {
    const { checkRecipe } = await audit();
    const recipe = { name: "Testdrink", category: "Rum", ingredients: ["5 cl Rum", "Eis"], instructions: "Rühren.", tip: "Kalt servieren." };
    const schema = { "@context": "https://schema.org", "@type": "Recipe", name: "Testdrink", recipeCategory: "Rum", recipeIngredient: ["5 cl Rum", "Eis"], recipeInstructions: "Rühren." };
    const html = (data: object, body = '<h1>Testdrink</h1><li>5 cl Rum</li><li>Eis</li><p>Rühren.</p><p>Kalt servieren.</p>') => `<script type="application/ld+json">${JSON.stringify(data)}</script>${body}`;
    expect(checkRecipe(html(schema), recipe, undefined)).toEqual([]);
    expect(checkRecipe(html({ ...schema, recipeIngredient: ["6 cl Rum"] }), recipe, undefined).join()).toMatch(/schema/);
    expect(checkRecipe(html({ ...schema, image: "https://other.example/photo.jpg" }), recipe, undefined).join()).toMatch(/schema/);
    expect(checkRecipe(html({ ...schema, aggregateRating: {} }), recipe, undefined).join()).toMatch(/schema/);
    expect(checkRecipe(html(schema, '<script>5 cl Rum Eis Rühren. Kalt servieren.</script>'), recipe, undefined).join()).toMatch(/visible/);
  });
});
