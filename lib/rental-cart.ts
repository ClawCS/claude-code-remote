import type { CartItem } from "@/context/CartContext";
import { getRentalItem } from "@/data/rentals";
import { quoteRentals, type RentalQuote, type RentalSelection } from "@/lib/rental-pricing";

export function rentalCartQuote(items: readonly CartItem[]): {
  selection: RentalSelection[]; quote: RentalQuote | null; error: string; onlyRentals: boolean;
} {
  const rentals = items.filter(item => item.rental || getRentalItem(item.product.id) ||
    item.product.categorySlug === "vermietung" || item.product.category === "Vermietung");
  const selection = rentals.map(item => ({ id: item.product.id, quantity: item.quantity,
    startDate: item.rental?.startDate ?? "", endDate: item.rental?.endDate ?? "" }));
  const onlyRentals = selection.length > 0 && selection.length === items.length;
  if (selection.length === 0) return { selection, quote: null, error: "", onlyRentals };
  try { return { selection, quote: quoteRentals(selection), error: "", onlyRentals }; }
  catch (cause) {
    return { selection, quote: null, error: cause instanceof Error ? cause.message : "Der Mietpreis konnte nicht berechnet werden.", onlyRentals };
  }
}

export function money(cents: number | null): string {
  return cents === null ? "Preis auf Anfrage" : new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}
