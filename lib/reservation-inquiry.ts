import type { CartItem } from "@/context/CartContext";
import { MARKET } from "@/lib/cinematic/site";
import { assertRentalStock } from "@/lib/cart-items";
import { getRentalItem } from "@/data/rentals";

export type InquiryContact = Readonly<{name: string; method: "pickup" | "delivery"; postalCode: string; city: string; notes: string}>;
export const INQUIRY_SUBJECT = "Unverbindliche Reservierungsanfrage – Trinkgut Jammers";
export function buildInquiryText(items: readonly CartItem[], contact: InquiryContact): string {
  if (!items.length || items.some(({quantity}) => !Number.isInteger(quantity) || quantity < 1 || quantity > 999)) throw new Error("Bitte gültige Artikelmengen auswählen.");
  if (!contact.name.trim()) throw new Error("Bitte deinen Namen angeben.");
  if (contact.method === "delivery" && (!contact.postalCode.trim() || !contact.city.trim())) throw new Error("Bitte PLZ und Ort für die Lieferanfrage angeben.");
  const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date;
  if (items.some(({rental}) => rental && (!validDate(rental.startDate) || !validDate(rental.endDate) || rental.startDate > rental.endDate))) throw new Error("Bitte einen gültigen Leihzeitraum auswählen.");
  assertRentalStock(items);
  const lines = items.map(({product, quantity, rental}) => `- ${quantity} × ${getRentalItem(product.id)?.name ?? product.name}${rental ? `, gewünschter Leihzeitraum ${rental.startDate} bis ${rental.endDate}` : ""}`);
  return [INQUIRY_SUBJECT, "Noch keine Reservierungsbestätigung.", "",
    `Gewünschte Bereitstellung: ${contact.method === "pickup" ? "Abholung" : "Lieferung nach Absprache"}`,
    `Name: ${contact.name.trim().slice(0, 100)}`,
    ...(contact.method === "delivery" ? [`PLZ/Ort: ${contact.postalCode.trim().slice(0, 10)} ${contact.city.trim().slice(0, 100)}`] : []),
    ...(contact.notes.trim() ? [`Anmerkungen: ${contact.notes.trim().slice(0, 500)}`] : []),
    "", "Artikelwunsch:", ...lines, "", "Bitte bestätigt Verfügbarkeit, Mietdauer, Konditionen und Endpreis, gegebenenfalls Pfand für Getränke, eventuelle Lieferkosten und den möglichen Termin.",
  ].join("\n");
}
export function buildInquiryUrls(text: string) {
  return {email: `mailto:${MARKET.email}?subject=${encodeURIComponent(INQUIRY_SUBJECT)}&body=${encodeURIComponent(text)}`, whatsapp: `https://wa.me/${MARKET.whatsappNumber}?text=${encodeURIComponent(text)}`};
}
export function removeLegacyPersonalData(storage: Pick<Storage, "removeItem">): void {
  for (const key of ["trinkgut-bestellungen", "gewinnspiel-teilnahmen", "trinkgut-community-id", "trinkgut-community-name", "trinkgut-community", "trinkgut-last-visit", "cookie-consent"]) storage.removeItem(key);
}
