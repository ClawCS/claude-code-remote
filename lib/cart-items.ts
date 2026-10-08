import { assortmentProducts as products } from "@/lib/catalog";
import { getRentalItem, rentalToProduct } from "@/data/rentals";
import type { Product } from "@/lib/utils";
import type { CartItem, RentalInfo } from "@/context/CartContext";
import { RENTAL_QUANTITY_UNAVAILABLE } from "@/lib/rental-messages";

export const validRentalDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
type RentalRange = Pick<RentalInfo,"startDate" | "endDate">;
// '=BIERZELTGARNITUR' is not an additional furniture pool. Until the bundle
// composition is confirmed, do not combine sets and singles on overlapping dates.
export function rentalFurnitureConflict(first: number, second: number): boolean {
  return (first === 20007 && (second === 20005 || second === 20006)) ||
    (second === 20007 && (first === 20005 || first === 20006));
}
export function validRentalRange(range: RentalRange): boolean {
  return validRentalDate(range.startDate) && validRentalDate(range.endDate) && range.startDate <= range.endDate;
}
export function cartLineKey(item: Pick<CartItem,"product" | "rental">): string {
  return `${item.product.id}:${item.rental ? `${item.rental.startDate}:${item.rental.endDate}` : "product"}`;
}

/** Remaining physical capacity across an inclusive range. Not live availability. */
export function maxRentalQuantity(items: readonly CartItem[], id: number, range?: RentalRange, excludeKey?: string): number {
  const catalogItem = getRentalItem(id);
  if (!catalogItem) return 0;
  if (!range) return catalogItem.physicalStock;
  if (!validRentalRange(range)) return 0;
  if (items.some(item => item.quantity > 0 && item.rental && cartLineKey(item) !== excludeKey && rentalFurnitureConflict(id,item.product.id) && item.rental.startDate <= range.endDate && item.rental.endDate >= range.startDate)) return 0;
  const overlapping = items.filter(item => item.product.id === id && item.rental && cartLineKey(item) !== excludeKey && item.rental.startDate <= range.endDate && item.rental.endDate >= range.startDate);
  const dates = [range.startDate,...overlapping.map(item => item.rental!.startDate).filter(date => date >= range.startDate)];
  const peak = Math.max(0,...dates.map(date => overlapping.reduce((sum,item) => sum + (item.rental!.startDate <= date && item.rental!.endDate >= date ? item.quantity : 0),0)));
  return Math.max(0,catalogItem.physicalStock - peak);
}

function unquotedRental(rental: RentalInfo): RentalInfo {
  return {...rental,periods:0,basePrice:0,totalRentalPrice:0,priceStatus:"personal-confirmation-required"};
}

export function addCartItem(items: readonly CartItem[], product: Product, quantity: number, rental?: RentalInfo): CartItem[] {
  if (!Number.isInteger(quantity) || quantity < 1 || (rental && !validRentalRange(rental))) return [...items];
  const catalogItem = getRentalItem(product.id);
  if ((catalogItem && !rental) || (!catalogItem && (product.categorySlug === "vermietung" || product.category === "Vermietung"))) return [...items];
  if (rental && !catalogItem && !products.some(item=>item.id === product.id)) return [...items];
  const canonicalProduct = catalogItem ? rentalToProduct(catalogItem) : product;
  const key = cartLineKey({product:canonicalProduct,rental});
  const existing = items.find(item => cartLineKey(item) === key);
  const limit = catalogItem ? maxRentalQuantity(items,product.id,rental,key) : 999;
  const nextQuantity = Math.min(limit,(existing?.quantity ?? 0) + quantity);
  if (nextQuantity < 1) return [...items];
  const next = {product:canonicalProduct,quantity:nextQuantity,...(rental ? {rental:unquotedRental(rental)} : {})};
  return existing ? items.map(item => cartLineKey(item) === key ? next : item) : [...items,next];
}

export function updateCartQuantity(items: readonly CartItem[], key: string, quantity: number): CartItem[] {
  if (!Number.isInteger(quantity)) return [...items];
  if (quantity <= 0) return items.filter(item => cartLineKey(item) !== key);
  return items.flatMap(item => {
    if (cartLineKey(item) !== key) return [item];
    const limit = getRentalItem(item.product.id) ? maxRentalQuantity(items,item.product.id,item.rental,key) : 999;
    const nextQuantity = Math.min(limit,quantity);
    return nextQuantity ? [{...item,quantity:nextQuantity}] : [];
  });
}

export function assertRentalStock(items: readonly CartItem[]): void {
  for (const [index,item] of items.entries()) {
    const catalogItem = getRentalItem(item.product.id);
    if (!catalogItem) {
      if (item.product.categorySlug === "vermietung" || item.product.category === "Vermietung" || (item.rental && !products.some(product => product.id === item.product.id))) throw new Error("Bitte einen bekannten Leihartikel auswählen.");
      continue;
    }
    if (!item.rental || !validRentalRange(item.rental)) throw new Error("Bitte einen gültigen Leihzeitraum auswählen.");
    const others = items.filter((_,otherIndex) => otherIndex !== index);
    if (item.quantity > maxRentalQuantity(others,item.product.id,item.rental)) throw new Error(RENTAL_QUANTITY_UNAVAILABLE);
  }
}

export function parseStoredCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  let items: CartItem[] = [];
  for (const entry of value.slice(0,200)) {
    if (!entry || !Number.isInteger(entry.quantity) || entry.quantity < 1 || !entry.product || !Number.isInteger(entry.product.id)) continue;
    const catalogItem = getRentalItem(entry.product.id);
    const product = catalogItem ? rentalToProduct(catalogItem) : products.find(item => item.id === entry.product.id) as Product | undefined;
    if (!product || (catalogItem && !entry.rental)) continue;
    let rental: RentalInfo | undefined;
    if (entry.rental) {
      const stored = entry.rental;
      if (!validRentalRange(stored)) continue;
      rental={startDate:stored.startDate,endDate:stored.endDate,workdays:Number.isInteger(stored.workdays) && stored.workdays >= 0 ? Math.min(stored.workdays,3660) : 0,periods:0,basePrice:0,totalRentalPrice:0,priceStatus:"personal-confirmation-required"};
    }
    items=addCartItem(items,product,entry.quantity,rental);
  }
  return items;
}
