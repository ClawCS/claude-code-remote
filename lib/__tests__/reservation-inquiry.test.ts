import { describe, expect, it } from "vitest";
import { buildInquiryText, buildInquiryUrls, removeLegacyPersonalData } from "@/lib/reservation-inquiry";
import type { CartItem } from "@/context/CartContext";
import products from "@/data/products.json";
const contact = {name: "Niko", method: "pickup" as const, postalCode: "47574", city: "Goch", notes: "Bitte Verfügbarkeit prüfen"};
const item = {product: products[0], quantity: 2} as CartItem;
describe("non-binding inquiry", () => {
  it("includes quantities but no stale prices or unnecessary delivery details", () => {
    const text = buildInquiryText([item], contact);
    expect(text).toContain(`2 × ${products[0].name}`);
    expect(text).toContain("Noch keine Reservierungsbestätigung");
    expect(text).not.toContain("47574");
    expect(text).not.toContain(`${products[0].price} €`);
  });
  it("rejects invalid quantities instead of drafting a malformed inquiry", () => {
    expect(() => buildInquiryText([{...item, quantity: -1}], contact)).toThrow();
    expect(() => buildInquiryText([], contact)).toThrow();
  });
  it("encodes punctuation in the email and WhatsApp draft", () => {
    const urls = buildInquiryUrls("A&B\nC?");
    expect(urls.email).toContain("body=A%26B%0AC%3F");
    expect(urls.whatsapp).toBe("https://wa.me/491752492386?text=A%26B%0AC%3F");
  });
  it("rejects missing names and incomplete delivery locations", () => {
    expect(() => buildInquiryText([item], {...contact, name:"  "})).toThrow();
    expect(() => buildInquiryText([item], {...contact, method:"delivery", postalCode:"", city:""})).toThrow();
  });
  it("rejects reversed or invalid rental dates", () => {
    const rental = {startDate:"2026-10-05", endDate:"2026-10-01", workdays:1,periods:1,basePrice:25,totalRentalPrice:25};
    expect(() => buildInquiryText([{...item,rental}], contact)).toThrow();
  });
  it("deletes only the old personal-data keys", () => {
    const removed: string[] = [];
    removeLegacyPersonalData({removeItem: (key) => {removed.push(key);}});
    expect(removed).toEqual(["trinkgut-bestellungen", "gewinnspiel-teilnahmen", "trinkgut-community-id", "trinkgut-community-name", "trinkgut-community", "trinkgut-last-visit", "cookie-consent"]);
  });
});
