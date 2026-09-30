import { assortmentProducts as products } from "@/lib/catalog";
import { createSlug, type Product } from "@/lib/utils";
import type { CartItem, RentalInfo } from "@/context/CartContext";

const rentals = ["Zapfanlage","Kühltruhe","Kühlwagen (mit Getränken)","Kühlwagen (ohne Getränke)","Theke","Nasstheke mit Becken","Weingläser","Sektgläser","Schnapsgläser","Biergläser"];
const validDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
export function cartLineKey(item: Pick<CartItem,"product" | "rental">): string {
  return `${item.product.id}:${item.rental ? `${item.rental.startDate}:${item.rental.endDate}` : "product"}`;
}
export function addCartItem(items: readonly CartItem[], product: Product, quantity: number, rental?: RentalInfo): CartItem[] {
  if (!Number.isInteger(quantity) || quantity < 1 || (rental && (!validDate(rental.startDate) || !validDate(rental.endDate) || rental.startDate > rental.endDate))) return [...items];
  const next = {product,quantity:Math.min(quantity,999),...(rental ? {rental} : {})};
  const key = cartLineKey(next);
  return items.some(item=>cartLineKey(item) === key) ? items.map(item=>cartLineKey(item) === key ? {...item,quantity:Math.min(999,item.quantity+quantity)} : item) : [...items,next];
}
export function parseStoredCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  let items: CartItem[] = [];
  for (const entry of value.slice(0,200)) {
    if (!entry || !Number.isInteger(entry.quantity) || entry.quantity < 1 || !entry.product || !Number.isInteger(entry.product.id)) continue;
    const id = entry.product.id;
    let product = products.find(item=>item.id === id) as Product | undefined;
    if (!product && id >= 1001 && id <= 1010 && entry.rental) {
      const name = rentals[id-1001];
      product = {id,name,slug:createSlug(name),price:0,category:"Vermietung",categorySlug:"vermietung",description:"Leihartikel – Termin und Konditionen nach Absprache.",image:"/images/home/brand-logo.webp",unit:"Leihartikel",inStock:false};
    }
    if (!product) continue;
    let rental: RentalInfo | undefined;
    if (entry.rental) {
      const stored = entry.rental;
      if (!validDate(stored.startDate) || !validDate(stored.endDate) || stored.startDate > stored.endDate) continue;
      rental={startDate:stored.startDate,endDate:stored.endDate,workdays:Number.isInteger(stored.workdays) && stored.workdays >= 0 ? Math.min(stored.workdays,3660) : 0,periods:0,basePrice:0,totalRentalPrice:0};
    }
    items=addCartItem(items,product,entry.quantity,rental);
  }
  return items;
}
