import { describe, expect, it } from "vitest";
import products from "@/data/products.json";
import type { Product } from "@/lib/utils";
import { addCartItem, cartLineKey, parseStoredCart, updateCartQuantity, maxRentalQuantity } from "@/lib/cart-items";
const product = products[0] as Product;
const rental = {startDate:"2026-10-05",endDate:"2026-10-07",workdays:3,periods:1,basePrice:0,totalRentalPrice:0};
const trailer = {...product,id:20001,name:"Kühlanhänger",slug:"kuehlanhaenger",category:"Vermietung",categorySlug:"vermietung",price:150};
describe("inquiry list integrity", () => {
  it.each([
    [20001,3],[20002,4],[20003,20],[20004,3],[20005,13],[20006,44],[20007,13],[20008,2],[20009,2],[20010,3],
    [20011,2],[20012,1],[20013,124],[20014,33],[20015,226],[20016,402],[20017,299],[20018,58],[20019,177],[20020,23],
  ])("caps canonical rental %i to its source-backed physical stock %i on add, update and restore",(id,stock)=>{
    const requested={...trailer,id};
    const added=addCartItem([],requested,999,rental);
    expect(added[0].quantity).toBe(stock);
    expect(updateCartQuantity(added,cartLineKey(added[0]),999)[0].quantity).toBe(stock);
    expect(parseStoredCart([{product:requested,quantity:999,rental}])[0].quantity).toBe(stock);
  });
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
  it("caps an initial rental request at the physical three-trailer stock", () => {
    expect(addCartItem([],trailer,999,rental)).toMatchObject([{quantity:3}]);
  });
  it("caps repeated additions of the same rental dates", () => {
    const items=addCartItem([],trailer,2,rental);
    expect(addCartItem(items,trailer,2,rental)).toMatchObject([{quantity:3}]);
  });
  it("counts overlapping date lines against the same physical stock", () => {
    const items=addCartItem([],trailer,2,rental);
    expect(addCartItem(items,trailer,3,{...rental,startDate:"2026-10-07",endDate:"2026-10-10"})).toMatchObject([{quantity:2},{quantity:1}]);
  });
  it("allows full stock on non-overlapping dates", () => {
    const items=addCartItem([],trailer,3,rental);
    expect(addCartItem(items,trailer,3,{...rental,startDate:"2026-10-08",endDate:"2026-10-10"})).toMatchObject([{quantity:3},{quantity:3}]);
  });
  it("does not mistake chained partial overlaps for simultaneous occupancy", () => {
    const items=addCartItem(addCartItem([],trailer,1,rental),trailer,1,{...rental,startDate:"2026-10-08",endDate:"2026-10-10"});
    expect(addCartItem(items,trailer,3,{...rental,startDate:"2026-10-06",endDate:"2026-10-09"})).toMatchObject([{quantity:1},{quantity:1},{quantity:2}]);
  });
  it("restores canonical rentals with capped stock and no price quote", () => {
    expect(parseStoredCart([{product:trailer,quantity:99,rental:{...rental,basePrice:150,totalRentalPrice:900}}])).toMatchObject([{product:{name:"Kühlanhänger",price:0},quantity:3,rental:{periods:0,basePrice:0,totalRentalPrice:0,priceStatus:"personal-confirmation-required"}}]);
  });
  it("caps overlapping restored rental lines", () => {
    expect(parseStoredCart([{product:trailer,quantity:2,rental},{product:trailer,quantity:99,rental:{...rental,startDate:"2026-10-06",endDate:"2026-10-09"}}])).toMatchObject([{quantity:2},{quantity:1}]);
  });
  it("drops unsafe legacy aliases and unknown rental identities", () => {
    expect(parseStoredCart([1001,1003,1010,21000].map(id=>({product:{...trailer,id},quantity:1,rental})))).toEqual([]);
  });
  it("does not accept an unknown rental identity disguised as a drink", () => {
    expect(addCartItem([],{...product,id:1003},1,rental)).toEqual([]);
  });
  it("requires dates for canonical rentals even if rental data is omitted", () => {
    expect(addCartItem([],trailer,1)).toEqual([]);
    expect(parseStoredCart([{product:trailer,quantity:1}])).toEqual([]);
  });
  it("caps cart quantity updates at physical stock", () => {
    const items = addCartItem([],trailer,1,rental);
    expect(updateCartQuantity(items,cartLineKey(items[0]),999)).toMatchObject([{quantity:3}]);
  });
  it("caps quantity updates using concurrent requests on other date lines", () => {
    const items = addCartItem(addCartItem([],trailer,1,rental),trailer,1,{...rental,startDate:"2026-10-06",endDate:"2026-10-09"});
    expect(updateCartQuantity(items,cartLineKey(items[0]),99)).toMatchObject([{quantity:2},{quantity:1}]);
  });
  it("exposes remaining capacity to selection without counting disjoint periods twice", () => {
    const items = addCartItem(addCartItem([],trailer,1,rental),trailer,1,{...rental,startDate:"2026-10-08",endDate:"2026-10-10"});
    expect(maxRentalQuantity(items,20001,{startDate:"2026-10-06",endDate:"2026-10-09"})).toBe(2);
    expect(maxRentalQuantity(items,20001,{startDate:"2026-10-08",endDate:"2026-10-06"})).toBe(0);
    expect(maxRentalQuantity(items,1003,rental)).toBe(0);
  });
});
