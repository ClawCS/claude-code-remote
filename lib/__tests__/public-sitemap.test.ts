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

  it("retains the existing public routes and adds the inquiry-list and contest archive", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const path of ["/marktleben", "/geschenkideen", "/regionale-spirituosen", "/merkzettel", "/gewinnspiel/archiv", "/kontakt", "/nl", "/handzettel", "/akademie", "/finder", "/partyplaner", "/partyspiele", "/vermietung"]) {
      expect(urls).toContain(`https://trinkgut-jammers.de${path}`);
    }
  });
});
