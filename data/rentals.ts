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
  priceDate: "2026-01-01" | "2026-10-08";
  image: string;
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
  [20008,"Theke","Mobiliar & Zubehör",35,2,null],
  [20009,"Spültheke","Mobiliar & Zubehör",50,2,null],
  [20010,"Tablett","Mobiliar & Zubehör",5,3,null],
  [20011,"Glühweinkocher","Kühlung & Ausschank",10,2,null],
  [20012,"Bierpongtisch","Mobiliar & Zubehör",30,1,null],
  [20013,"Weinglas","Gläser",0.4,124,1.5],
  [20015,"Sektglas","Gläser",0.4,226,1.5],
  [20016,"Altbierglas","Gläser",0.2,402,null],
  [20017,"Williglas","Gläser",0.2,299,null],
  [20018,"Kölschglas","Gläser",0.2,58,null],
  [20019,"Schnapsglas","Gläser",0.4,177,null],
  [20020,"Weizenglas","Gläser",0.8,23,null],
] as const;

// Additional gross prices and retirement of item 20014 confirmed by Niko on 2026-10-08.
// Entlüfter and Zapfhahn are explicitly KAUF, not rentals.
export const rentalItems: readonly RentalItem[] = rows.map(([id,name,category,price,physicalStock,breakagePrice]) => ({
  id,name,slug:createSlug(name),category,price,physicalStock,breakagePrice,
  inventoryDate:"2026-03-06",priceDate:[20008,20009,20016,20017,20018,20019,20020].includes(id) ? "2026-10-08" : "2026-01-01",
  image:`/images/rentals/item-${id}.webp`,
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
    image:item.image,unit:"Leihartikel · Preis nach persönlicher Bestätigung",inStock:false,
  };
}
