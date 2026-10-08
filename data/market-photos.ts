import { REGIONAL_SPECIALTIES } from "@/data/regional-specialties";
import { GOOGLE_MARKET_PHOTOS } from "@/data/google-market-photos";

export type MarketPhoto = Readonly<{ src: string; width: number; height: number; alt: string; caption: string }>;

/** Public rendering data only. Original exports and source identities remain private. */
export const MARKET_PHOTOS = {
  market: { src: "/images/editorial/canva/salitos-market.webp", width: 696, height: 975, alt: "Salitos-Getränkeaufbau im Markt von Trinkgut Jammers", caption: "Marktleben · ein Blick auf einen Getränkeaufbau" },
  gifts: { src: "/images/editorial/canva/gift-basket.webp", width: 666, height: 910, alt: "In Folie verpackter Geschenkkorb mit Getränken bei Trinkgut Jammers", caption: "Geschenkideen · mit Liebe zusammengestellt" },
} as const satisfies Record<string, MarketPhoto>;

export const MARKET_DISCOVERIES = [
  { id: "marktleben", title: "Nicht einfach irgendein Markt.", text: "Echte Einblicke, besondere Aufbauten und Menschen, die mit anpacken. Das ist Jammers in Goch.", href: "/marktleben", photo: GOOGLE_MARKET_PHOTOS.tasting },
  { id: "geschenke", title: "Eine Freude zum Mitnehmen.", text: "Für Gastgeber, Geburtstage oder ein kleines Dankeschön: Lass dich zu einer passenden Geschenkidee beraten.", href: "/geschenkideen", photo: MARKET_PHOTOS.gifts },
  { id: "regional", title: "Vom Niederrhein. Für dich.", text: "Regionale Spezialitäten mit Charakter. Entdecke Brüdergeist und weitere Genussideen aus unserem Markt.", href: "/regionale-spirituosen", photo: { ...REGIONAL_SPECIALTIES[0], caption: "Brüdergeist · originale Canva-Produktgrafik" } },
] as const;
