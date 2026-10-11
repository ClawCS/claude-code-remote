import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import KontaktPage from "@/app/kontakt/page";
import EigenmarkePage from "@/app/eigenmarke/page";
import RentalPage from "@/app/vermietung/page";
import { CartProvider } from "@/context/CartContext";
import { eigenmarken } from "@/data/eigenmarken";

const answers = (html: string, kind: string) => html.match(new RegExp(`<section[^>]*data-local-answers="${kind}"[\\s\\S]*?<\\/section>`))?.[0] ?? "";
describe("confirmed local answers", () => {
  test("contact answers expose market facts and direct contact", () => {
    const section = answers(renderToStaticMarkup(<KontaktPage />), "contact");
    expect(section).toContain("Jurgensstraße 20");
    expect(section).toContain("47574 Goch");
    expect(section).toContain("Mo–Sa 08:00–20:00 Uhr");
    expect(section).toContain("Sonn- und Feiertage geschlossen");
    expect(section).toContain('href="tel:+492823418707"');
  });
  test("rental answers preserve personal confirmation, price unit and pickup-only scope", () => {
    const section = answers(renderToStaticMarkup(<CartProvider><RentalPage /></CartProvider>), "rental");
    expect(section).toContain("persönlich");
    expect(section).toContain("drei Werktagen");
    expect(section).toContain("Nur Abholung im Markt");
    expect(section).toContain('href="/agb"');
    expect(section).not.toMatch(/sofort buchen|garantiert verfügbar|FAQPage|Lieferung/i);
  });
  test("brand answers point to the actual market without a stock promise and preserve six targets", () => {
    const html = renderToStaticMarkup(<EigenmarkePage />);
    const section = answers(html, "brands");
    expect(section).toContain("Jurgensstraße 20");
    expect(section).toContain("Verfügbarkeit");
    expect(section).toContain('href="/kontakt"');
    expect(section).not.toMatch(/sofort verfügbar|auf Lager|FAQPage/i);
    for (const brand of eigenmarken) expect(html.match(new RegExp(`id="${brand.slug}"`, "g"))).toHaveLength(1);
  });
});
