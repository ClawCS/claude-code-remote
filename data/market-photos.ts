import { REGIONAL_SPECIALTIES } from "@/data/regional-specialties";

export type MarketPhoto = Readonly<{ src: string; width: number; height: number; alt: string; caption: string }>;

/** Public rendering data only. Original exports and source identities remain private. */
export const MARKET_PHOTOS = {
  ilPadrino: { src: "/images/editorial/canva/verkostung-il-padrino.webp", width: 660, height: 976, alt: "Eine Person am Holzfass mit Il-Padrino-Flaschen und Probiergläsern im Markt", caption: "Verkostung im Markt" },
  moritzFiege: { src: "/images/editorial/canva/verkostung-moritz-fiege.webp", width: 660, height: 976, alt: "Zwei Personen an einem Moritz-Fiege-Verkostungsstand im Freien", caption: "Verkostung im Freien" },
  liqueurTasting: { src: "/images/editorial/canva/likoer-verkostung.webp", width: 660, height: 1007, alt: "Drei Personen mit Likörflaschen an einer Verkostungstheke im Markt", caption: "Liköre entdecken" },
  almdudler: { src: "/images/editorial/canva/almdudler-aufbau.webp", width: 660, height: 899, alt: "Zwei Personen auf einer Bank unter einem roten Almdudler-Sonnenschirm zwischen Getränkekisten", caption: "Almdudler-Aufbau im Markt" },
  safari: { src: "/images/editorial/canva/safari-display.webp", width: 660, height: 627, alt: "Safari-Likörflaschen vor schwarz-orangefarbenen Kartons in einem Marktaufbau", caption: "Detail eines Warenaufbaus im Markt" },
  market: { src: "/images/editorial/canva/salitos-market.webp", width: 696, height: 975, alt: "Salitos-Getränkeaufbau im Markt von Trinkgut Jammers", caption: "Marktleben · ein Blick auf einen Getränkeaufbau" },
  gifts: { src: "/images/editorial/canva/gift-basket.webp", width: 666, height: 910, alt: "In Folie verpackter Geschenkkorb mit Getränken bei Trinkgut Jammers", caption: "Geschenkideen · mit Liebe zusammengestellt" },
} as const satisfies Record<string, MarketPhoto>;

export const MARKET_DISCOVERIES = [
  { id: "marktleben", title: "Nicht einfach irgendein Markt.", text: "Echte Einblicke, besondere Aufbauten und Menschen, die mit anpacken. Das ist Jammers in Goch.", href: "/marktleben", photo: MARKET_PHOTOS.moritzFiege },
  { id: "geschenke", title: "Eine Freude zum Mitnehmen.", text: "Für Gastgeber, Geburtstage oder ein kleines Dankeschön: Lass dich zu einer passenden Geschenkidee beraten.", href: "/geschenkideen", photo: MARKET_PHOTOS.gifts },
  { id: "regional", title: "Vom Niederrhein. Für dich.", text: "Regionale Spezialitäten mit Charakter. Entdecke Brüdergeist und weitere Genussideen aus unserem Markt.", href: "/regionale-spirituosen", photo: { ...REGIONAL_SPECIALTIES[0], caption: "Brüdergeist · originale Canva-Produktgrafik" } },
] as const;
