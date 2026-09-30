import { describe, expect, it } from "vitest";
import products from "@/data/products.json";
import type { Product } from "@/lib/utils";
import { addCartItem, cartLineKey, parseStoredCart } from "@/lib/cart-items";
const product = products[0] as Product;
const rental = {startDate:"2026-10-05",endDate:"2026-10-07",workdays:3,periods:1,basePrice:0,totalRentalPrice:0};
describe("inquiry list integrity", () => {
  it("keeps different rental date ranges as independent lines", () => {
    const first=addCartItem([],product,1,rental);
    const second=addCartItem(first,product,1,{...rental,startDate:"2026-10-12",endDate:"2026-10-14"});
    expect(second).toHaveLength(2);
    expect(cartLineKey(second[0])).not.toBe(cartLineKey(second[1]));
  });
  it("merges identical rental dates and clamps excessive quantities", () => {
    expect(addCartItem(addCartItem([],product,998,rental),product,100,rental)).toMatchObject([{quantity:999}]);
  });
  it("separates rental and regular-product requests", () => expect(addCartItem(addCartItem([],product,1),product,1,rental)).toHaveLength(2));
  it("does not trust malformed browser data or stale stored product details", () => {
    expect(parseStoredCart({items:[]})).toEqual([]);
    expect(parseStoredCart([{product:{id:product.id},quantity:1},{product:{id:product.id},quantity:-2},{product:{id:-1},quantity:1}])).toMatchObject([{product:{name:product.name},quantity:1}]);
  });
  it("rejects invalid rental dates restored from storage", () => expect(parseStoredCart([{product:{id:product.id},quantity:1,rental:{...rental,startDate:"2026-02-30"}}])).toEqual([]));
});
