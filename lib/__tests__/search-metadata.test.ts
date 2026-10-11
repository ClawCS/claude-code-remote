import type { Metadata } from "next";
import { describe, expect, it, vi } from "vitest";
import RetiredProductPage from "@/app/produkte/[slug]/page";
import products from "@/data/products.json";
import { courses } from "@/data/akademie";
import { categories } from "@/lib/utils";
import { cocktailCatalog } from "@/lib/cocktail-routes";
import { metadata as applicationMetadata } from "@/app/bewerbung/layout";
import { existsSync } from "node:fs";

// Vitest is a server-side execution context; bypass only Next's client-import marker.
vi.mock("server-only", () => ({}));
const modules = import.meta.glob("../../app/**/{layout,page}.tsx") as Record<string, () => Promise<{
  metadata: Metadata;
  generateMetadata: (props: { params: Promise<{ slug: string }> }) => Promise<Metadata>;
}>>;

const staticRoutes = [
  ["/eigenmarke", "page"], ["/finder", "layout"], ["/partyplaner", "layout"],
  ["/vermietung", "layout"], ["/galerie", "layout"], ["/community", "layout"],
  ["/gewinnspiel", "layout"], ["/gewinnspiel/archiv", "page"], ["/leergut", "layout"],
  ["/oeko-tracker", "layout"], ["/partyspiele", "layout"], ["/impressum", "page"],
  ["/datenschutz", "page"], ["/agb", "page"], ["/kontakt", "page"],
  ["/angebote", "layout"], ["/produkte", "layout"], ["/akademie", "page"],
  ["/cocktails", "page"], ["/akademie/zertifikate", "page"], ["/marktleben", "page"], ["/geschenkideen", "page"],
  ["/regionale-spirituosen", "page"], ["/nl", "layout"],
] as const;

function expectPageMetadata(metadata: Metadata, path: string) {
  expect(metadata.alternates?.canonical).toBe(`https://trinkgut-jammers.de${path}`);
  const title = typeof metadata.title === "string" ? metadata.title : metadata.title && "absolute" in metadata.title ? metadata.title.absolute : undefined;
  expect(metadata.openGraph).toMatchObject({
    title, description: metadata.description, url: `https://trinkgut-jammers.de${path}`,
  });
  expect(metadata.openGraph?.images).toBeTruthy();
}

describe("public search metadata", () => {
  it.each(staticRoutes)("emits own canonical and matching social metadata for %s", async (path, file) => {
    const { metadata } = await modules[`../../app${path}/${file}.tsx`]();
    expectPageMetadata(metadata, path);
  });

  it("describes rental equipment without an unsupported tent promise", async () => {
    const { metadata } = await import("@/app/vermietung/layout");
    expect(metadata.title).toEqual({ absolute: "Zapfanlagen & Partybedarf mieten in Goch | Trinkgut Jammers" });
    expect(JSON.stringify(metadata)).not.toMatch(/Bierzelte/);
  });

  it("describes finder ideas without promising current inventory", async () => {
    const { metadata } = await import("@/app/finder/layout");
    expect(metadata.description).toMatch(/Ideen/);
    expect(metadata.description).toMatch(/keine.*Bestand/i);
  });

  it("keeps the handzettel alias targeted at the offer page", async () => {
    const { metadata } = await import("@/app/handzettel/layout");
    expectPageMetadata(metadata, "/angebote");
  });

  it("preserves the real DE/NL hreflang pair and NL locale/indexing", async () => {
    const { metadata } = await import("@/app/nl/layout");
    expect(metadata.alternates?.languages).toEqual({ de: "/", nl: "/nl" });
    expect(metadata.openGraph).toMatchObject({ locale: "nl_NL" });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("keeps the personal wishlist noindex/follow with its own metadata", async () => {
    const load = modules["../../app/merkzettel/layout.tsx"];
    expect(load, "Merkzettel must have server metadata").toBeTypeOf("function");
    const { metadata } = await load();
    expectPageMetadata(metadata, "/merkzettel");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("preserves protected application and archive robot policies", async () => {
    expect(applicationMetadata.robots).toEqual({ index: false, follow: false, nocache: true });
    const { metadata } = await import("@/app/gewinnspiel/archiv/page");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it.each([
    ...cocktailCatalog.recipes.map(recipe => ["cocktails/[slug]/page", recipe.slug, recipe.href]),
    ...cocktailCatalog.categories.map(category => ["cocktails/kategorie/[slug]/page", category.slug, category.href]),
    ...categories.map(category => ["kategorie/[slug]/layout", category.slug, `/kategorie/${category.slug}`]),
    ...courses.map(course => ["akademie/[slug]/page", course.slug, `/akademie/${course.slug}`]),
  ])("gives %s %s metadata independent of parent canonical and title", async (file, slug, path) => {
    const { generateMetadata } = await modules[`../../app/${file}.tsx`]();
    const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });
    expectPageMetadata(metadata, path);
    expect(metadata.openGraph?.title).not.toContain("Goch schenkt ein");
  });

  it("permanently redirects a known retired example to its assigned category", async () => {
    const product = products[0];
    const error = await RetiredProductPage({ params: Promise.resolve({ slug: product.slug }) }).catch(error => error);
    expect(error.digest).toBe(`NEXT_REDIRECT;replace;/kategorie/${product.categorySlug};308;`);
  });

  it.each(["unknown-product", "", "__proto__"])("returns a real 404 for retired product slug %s", async slug => {
    await expect(RetiredProductPage({ params: Promise.resolve({ slug }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});

describe("shared page metadata builder", () => {
  const helper = import.meta.glob("../search-metadata.ts") as Record<string, () => Promise<{
    buildPageMetadata: (input: { title: string; description: string; path: string; image?: string; locale?: string }) => Metadata;
  }>>;

  it("builds HTTPS self-canonical and identical document/social titles with a confirmed default image", async () => {
    const load = helper["../search-metadata.ts"];
    expect(load, "Shared metadata builder must exist").toBeTypeOf("function");
    const { buildPageMetadata } = await load();
    const metadata = buildPageMetadata({ title: "Kontakt", description: "Besuch und Kontakt in Goch.", path: "/kontakt" });
    expectPageMetadata(metadata, "/kontakt");
    expect(metadata.title).toEqual({ absolute: "Kontakt | Trinkgut Jammers" });
    expect(metadata.openGraph).toMatchObject({ locale: "de_DE", type: "website", siteName: "Trinkgut Jammers", images: [{ url: "https://trinkgut-jammers.de/images/home/cinematic/og-home.jpg" }] });
    expect(existsSync("public/images/home/cinematic/og-home.jpg")).toBe(true);
  });

  it("supports an own image and locale without adding duplicate site branding", async () => {
    const load = helper["../search-metadata.ts"];
    expect(load).toBeTypeOf("function");
    const { buildPageMetadata } = await load();
    const metadata = buildPageMetadata({ title: "Nederland | Trinkgut Jammers", description: "Plan je bezoek.", path: "/nl", image: "/images/nl.jpg", locale: "nl_NL" });
    expectPageMetadata(metadata, "/nl");
    expect(metadata.title).toEqual({ absolute: "Nederland | Trinkgut Jammers" });
    expect(metadata.openGraph).toMatchObject({ locale: "nl_NL", images: [{ url: "https://trinkgut-jammers.de/images/nl.jpg" }] });
  });

  it.each(["https://other.example/page", "//other.example/page", "kontakt", "/kontakt?tracking=1", "/kontakt#details", "/../kontakt"])("rejects a noncanonical own-page path %s", async path => {
    const { buildPageMetadata } = await helper["../search-metadata.ts"]();
    expect(() => buildPageMetadata({ title: "Kontakt", description: "Besuch.", path })).toThrow(/canonical path/i);
  });
});
