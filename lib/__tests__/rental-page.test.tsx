import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CartProvider } from "@/context/CartContext";
import RentalPage from "@/app/vermietung/page";

describe("source-backed rental catalog", () => {
  const html = () => renderToStaticMarkup(<CartProvider><RentalPage /></CartProvider>);
  it("renders every physical source item with its dated stock limit", () => {
    const result = html();
    for (const [name,stock] of [["Kühlanhänger",3],["Kühltruhe",4],["Stehtisch",20],["Zapfanlage",3],["Tisch einzeln",13],["Bank einzeln",44],["Bierzeltgarnitur",13],["Theke",2],["Spültheke",2],["Tablett",3],["Glühweinkocher",2],["Bierpongtisch",1],["Weinglas",124],["Weinglas klein",33],["Sektglas",226],["Altbierglas",402],["Williglas",299],["Kölschglas",58],["Schnapsglas",177],["Weißbierglas",23]] as const) {
      expect(result).toContain(`aria-label="Menge für ${name}"`);
      expect(result).toContain(`data-rental-name="${name}" data-physical-stock="${stock}"`);
    }
    expect(result).toContain("06.03.2026");
    expect(result).toContain("01.01.2026");
  });
  it("does not invent rental periods, source mappings, photos, or purchase rentals", () => {
    const result = html();
    expect(result).toContain("Richtpreis laut Preisliste");
    expect(result).toContain("Preis auf Anfrage");
    expect(result).toContain("Bruchersatz");
    expect(result).toContain("Mietdauer und Endpreis bestätigen wir persönlich");
    expect(result).not.toMatch(/3 Werktage|Leihperiode|Kühlwagen|Entlüfter|Zapfhahn|<svg|<img/);
    expect(result).not.toContain("Kaution");
  });
  it("shows only clearly matched prices from the price sheet", () => {
    const result=html();
    const expectations=[
      ["Kühlanhänger","150,00"],["Kühltruhe","35,00"],["Stehtisch","12,00"],["Zapfanlage","25,00"],
      ["Tisch einzeln","7,00"],["Bank einzeln","4,00"],["Bierzeltgarnitur","15,00"],["Tablett","5,00"],
      ["Glühweinkocher","10,00"],["Bierpongtisch","30,00"],["Weinglas","0,40"],["Sektglas","0,40"],
      ["Theke","Preis auf Anfrage"],["Spültheke","Preis auf Anfrage"],["Weinglas klein","Preis auf Anfrage"],
      ["Altbierglas","Preis auf Anfrage"],["Williglas","Preis auf Anfrage"],["Kölschglas","Preis auf Anfrage"],
      ["Schnapsglas","Preis auf Anfrage"],["Weißbierglas","Preis auf Anfrage"],
    ];
    for (const [name,price] of expectations) {
      const article=result.split(`data-rental-name="${name}"`)[1]?.split("</article>")[0];
      expect(article).toBeDefined();
      expect(article).toContain(price);
      if (!["Weinglas","Sektglas"].includes(name)) expect(article).not.toContain("Bruchersatz:");
    }
  });
});
