import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CartProvider } from "@/context/CartContext";
import RentalPage from "@/app/vermietung/page";
import { rentalItems } from "@/data/rentals";
import ServiceSection from "@/components/cinematic/ServiceSection";

describe("source-backed rental catalog", () => {
  const html = () => renderToStaticMarkup(<CartProvider><RentalPage /></CartProvider>);
  it("renders every physical source item with its stock limit", () => {
    const result = html();
    for (const [name,stock] of [["Kühlanhänger",3],["Kühltruhe",4],["Stehtisch",20],["Zapfanlage",3],["Tisch einzeln",13],["Bank einzeln",44],["Bierzeltgarnitur",13],["Theke",2],["Spültheke",2],["Tablett",3],["Glühweinkocher",2],["Bierpongtisch",1],["Weinglas",124],["Sektglas",226],["Altbierglas",402],["Williglas",299],["Kölschglas",58],["Schnapsglas",177],["Weizenglas",23]] as const) {
      expect(result).toContain(`aria-label="Menge für ${name}"`);
      const article = result.split(`data-rental-name="${name}"`)[1]?.split("</article>")[0];
      expect(article).toContain(`max="${stock}"`);
    }
    expect(result).not.toContain("01.01.2026");
    expect(result).not.toContain("Weinglas klein");
  });
  it("keeps stock limits internal while asking the market to confirm availability", () => {
    const result = html();
    expect(result).not.toMatch(/Physischer Bestand|Bestand (?:laut|nach) Liste|Bestandsstand|noch höchstens/);
    expect(result).not.toContain("data-physical-stock");
    expect(result).toContain("Termin und Verfügbarkeit bestätigen wir persönlich.");
    expect(result).toContain('max="3"');
  });
  it("shows confirmed periods and labelled examples without inventing deposit or purchase rentals", () => {
    const result = html();
    expect(result).not.toContain("01.01.2026");
    expect(result).not.toContain("Weinglas klein");
    expect(result).not.toContain("Preis auf Anfrage");
    expect([...result.matchAll(/<img\b/g)]).toHaveLength(19);
    expect(result).toContain("Beispielbild · Modell und Ausführung können abweichen.");
    expect(result).not.toContain("KI-Beispielbild");
    expect(result).toContain("Bruchersatz");
    expect(result).toContain("Deine Mietauswahl");
    expect(result).not.toContain("kein berechneter Mietgesamtpreis");
    expect(result).toContain("inkl. MwSt.");
    expect(result).not.toMatch(/Leihperiode|Kühlwagen|Entlüfter|Zapfhahn|<svg/);
    expect(result).not.toContain("Kaution");
  });
  it("offers bounded plus/minus controls alongside direct quantity entry for every item", () => {
    const result = html();
    for (const { name } of rentalItems) {
      const article = result.split(`data-rental-name="${name}"`)[1]?.split("</article>")[0];
      expect(article).toContain(`aria-label="Menge für ${name} verringern"`);
      expect(article).toContain(`aria-label="Menge für ${name} erhöhen"`);
      expect(article).toContain(`aria-label="Menge für ${name}"`);
      expect(article).toMatch(/aria-label="Menge für [^"]+ verringern"[^>]*disabled/);
    }
  });
  it("shows the operator-confirmed three-workday price unit and counter price", () => {
    const result = html();
    const trailer = result.split('data-rental-name="Kühlanhänger"')[1]?.split("</article>")[0];
    const counter = result.split('data-rental-name="Theke"')[1]?.split("</article>")[0];
    expect(trailer).toContain("3-Werktage-Block");
    expect(counter).toContain("35,00");
    expect(counter).not.toContain("0,00");
  });
  it("links the homepage service story to the full rental catalog without implying a reservation", () => {
    const result = renderToStaticMarkup(<ServiceSection />);
    expect(result).toContain('href="/vermietung"');
    expect(result).toContain("Eine Anfrage ist noch keine bestätigte Reservierung.");
    expect(result).toContain("Verfügbarkeit und Konditionen klären wir persönlich.");
  });
  it("lets visitors choose dates directly without the removed long conditions block", () => {
    const result = html();
    expect(result).toContain("Dein gewünschter Zeitraum");
    expect(result).toContain("Gewünschte Abholung");
    expect(result).toContain("Gewünschte Rückgabe");
    expect(result).not.toContain('aria-labelledby="rental-conditions"');
    expect(result).not.toContain("Belegte Preise. Persönliche Bestätigung.");
    expect(result).not.toContain("Die Preisliste nennt keinen bestätigten Mietzeitraum.");
    expect(result).not.toContain("Bereits angefragte Mengen für überlappende Zeiträume");
    expect(result).not.toContain("Bruchersatz ist nur bei eindeutig zugeordneten Gläsern");
    expect(result).not.toContain("Garnituren und Einzelmöbel können deshalb hier nicht gemeinsam");
  });
  it("describes the pre-checkout selection as an inquiry rather than an order or reservation", () => {
    const result = html();
    const intro = result.split("data-rental-intro")[1]?.split("</section>")[0];
    const selection = result.split('aria-labelledby="rental-request"')[1]?.split("</section>")[0];
    expect(intro).toContain("Termin und Verfügbarkeit bestätigen wir persönlich.");
    expect(intro).not.toContain("nach deiner Bestellung");
    expect(selection).toContain("Deine Auswahl reserviert noch keine Artikel. Verbindliche Absprachen treffen wir persönlich.");
    expect(selection).not.toContain("Die Bestellung wird erst");
  });
  it("shows only clearly matched prices from the price sheet", () => {
    const result=html();
    const expectations=[
      ["Kühlanhänger","150,00"],["Kühltruhe","35,00"],["Stehtisch","12,00"],["Zapfanlage","25,00"],
      ["Tisch einzeln","7,00"],["Bank einzeln","4,00"],["Bierzeltgarnitur","15,00"],["Tablett","5,00"],
      ["Glühweinkocher","10,00"],["Bierpongtisch","30,00"],["Weinglas","0,40"],["Sektglas","0,40"],
      ["Theke","35,00"],["Spültheke","50,00"],
      ["Altbierglas","0,20"],["Williglas","0,20"],["Kölschglas","0,20"],
      ["Schnapsglas","0,40"],["Weizenglas","0,80"],
    ];
    for (const [name,price] of expectations) {
      const article=result.split(`data-rental-name="${name}"`)[1]?.split("</article>")[0];
      expect(article).toBeDefined();
      expect(article).toContain(price);
      if (!["Weinglas","Sektglas"].includes(name)) expect(article).not.toContain("Bruchersatz:");
    }
  });
});
