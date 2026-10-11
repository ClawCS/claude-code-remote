import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { cocktailCatalog } from "@/lib/cocktail-routes";

describe("public sitemap", () => {
  it("includes all 65 recipe and six cocktail-category destinations once", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.filter((url) => /\/cocktails\/(?!kategorie\/)/.test(url))).toHaveLength(65);
    expect(urls.filter((url) => url.includes("/cocktails/kategorie/"))).toHaveLength(6);
    for (const route of [...cocktailCatalog.recipes, ...cocktailCatalog.categories]) {
      expect(urls.filter((url) => url === `https://trinkgut-jammers.de${route.href}`)).toHaveLength(1);
    }
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("retains indexable public routes without aliases and noindex utilities", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const path of ["/marktleben", "/geschenkideen", "/regionale-spirituosen", "/kontakt", "/nl", "/akademie", "/finder", "/partyplaner", "/partyspiele", "/vermietung"]) {
      expect(urls).toContain(`https://trinkgut-jammers.de${path}`);
    }
    for (const path of ["/handzettel", "/gewinnspiel/archiv", "/merkzettel", "/bewerbung", "/bewerbung/verwaltung"]) {
      expect(urls).not.toContain(`https://trinkgut-jammers.de${path}`);
    }
  });

  it("declares reciprocal translations only for the real homepage pair", () => {
    const entries = sitemap();
    for (const path of ["/", "/nl"]) {
      expect(entries.find(entry => entry.url === `https://trinkgut-jammers.de${path}`)?.alternates?.languages).toEqual({
        de: "https://trinkgut-jammers.de/", nl: "https://trinkgut-jammers.de/nl",
      });
    }
    expect(entries.filter(entry => entry.alternates)).toHaveLength(2);
  });
});
