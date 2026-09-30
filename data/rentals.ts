import { createSlug, type Product } from "@/lib/utils";

export type RentalItem = Readonly<{
  id: number;
  name: string;
  slug: string;
  category: "Kühlung & Ausschank" | "Mobiliar & Zubehör" | "Gläser";
  price: number | null;
  breakagePrice: number | null;
  physicalStock: number;
  inventoryDate: "2026-03-06";
  priceDate: "2026-01-01";
}>;

// New identities do not reinterpret unsafe former 1001–1010 aliases.
const rows = [
  [20001,"Kühlanhänger","Kühlung & Ausschank",150,3,null],
  [20002,"Kühltruhe","Kühlung & Ausschank",35,4,null],
  [20003,"Stehtisch","Mobiliar & Zubehör",12,20,null],
  [20004,"Zapfanlage","Kühlung & Ausschank",25,3,null],
  [20005,"Tisch einzeln","Mobiliar & Zubehör",7,13,null],
  [20006,"Bank einzeln","Mobiliar & Zubehör",4,44,null],
  [20007,"Bierzeltgarnitur","Mobiliar & Zubehör",15,13,null],
  [20008,"Theke","Mobiliar & Zubehör",null,2,null],
  [20009,"Spültheke","Mobiliar & Zubehör",null,2,null],
  [20010,"Tablett","Mobiliar & Zubehör",5,3,null],
  [20011,"Glühweinkocher","Kühlung & Ausschank",10,2,null],
  [20012,"Bierpongtisch","Mobiliar & Zubehör",30,1,null],
  [20013,"Weinglas","Gläser",0.4,124,1.5],
  [20014,"Weinglas klein","Gläser",null,33,null],
  [20015,"Sektglas","Gläser",0.4,226,1.5],
  [20016,"Altbierglas","Gläser",null,402,null],
  [20017,"Williglas","Gläser",null,299,null],
  [20018,"Kölschglas","Gläser",null,58,null],
  [20019,"Schnapsglas","Gläser",null,177,null],
  [20020,"Weißbierglas","Gläser",null,23,null],
] as const;

// GLAS / BIERGLAS prices cannot safely be mapped to the named glass types.
// Entlüfter and Zapfhahn are explicitly KAUF, not rentals.
export const rentalItems: readonly RentalItem[] = rows.map(([id,name,category,price,physicalStock,breakagePrice]) => ({
  id,name,slug:createSlug(name),category,price,physicalStock,breakagePrice,
  inventoryDate:"2026-03-06",priceDate:"2026-01-01",
}));
export const rentalCategories = [...new Set(rentalItems.map(item => item.category))];
export function getRentalItem(id: number): RentalItem | undefined {
  return rentalItems.find(item => item.id === id);
}
export function rentalToProduct(item: RentalItem): Product {
  return {
    id:item.id,name:item.name,slug:item.slug,price:0,
    category:"Vermietung",categorySlug:"vermietung",
    description:"Unverbindliche Leihanfrage – Mietdauer, Konditionen und Endpreis nach persönlicher Bestätigung.",
    image:"/images/home/brand-logo.webp",unit:"Leihartikel · Preis nach persönlicher Bestätigung",inStock:false,
  };
}
