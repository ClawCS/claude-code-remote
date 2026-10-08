import type { MarketPhoto } from "@/data/market-photos";

/** Public rendering data only; source records and profile metadata stay private. */
export const GOOGLE_MARKET_PHOTOS = {
  ownBrands: { src: "/images/editorial/google/eigenmarken-flaschen.webp", width: 927, height: 1200, alt: "Sechs Eigenmarken-Likörflaschen von Trinkgut Jammers auf hellem Untergrund", caption: "Unsere Eigenmarken zusammen im Bild · Rückblick 2025" },
  regional: { src: "/images/editorial/google/regionaler-hofaufbau.webp", width: 675, height: 1200, alt: "Holzaufbau mit Äpfeln, Eiern und Gläsern unter einem grünen Bauernhof-Schild im Markt", caption: "Frisch vom Bauernhof · Rückblick 2025" },
  greetingCards: { src: "/images/editorial/google/grusskarten-detail.webp", width: 675, height: 1200, alt: "Grußkarten mit unterschiedlichen Motiven im Kartenständer bei Trinkgut Jammers", caption: "Grußkarten aus unserem Markt · Rückblick 2025" },
  desperados: { src: "/images/editorial/google/desperados-detail.webp", width: 675, height: 1200, alt: "Desperados-Flasche auf weißen Getränkekisten im Markt", caption: "Getränke im Detail · Rückblick 2025" },
  baileys: { src: "/images/editorial/google/baileys-aufbau.webp", width: 900, height: 1200, alt: "Aufbau mit orangefarbenen Baileys-Zimtschnecken-Flaschen bei Trinkgut Jammers", caption: "Baileys-Aufbau im Markt · Rückblick 2025" },
  grill: { src: "/images/editorial/google/grillbegleiter.webp", width: 900, height: 1200, alt: "Offene Kühlung mit Wurstwaren und Hohenmarker-Dips im Markt", caption: "Begleiter für den Grillabend · Rückblick 2025" },
  characterCards: { src: "/images/editorial/google/karten-mit-charakter.webp", width: 675, height: 1200, alt: "Weitere Grußkarten mit Sprüchen und Motiven im Kartenständer bei Trinkgut Jammers", caption: "Karten mit Charakter · Rückblick 2025" },
  tasting: { src: "/images/editorial/google/verkostung.webp", width: 675, height: 1200, alt: "Drei Personen an einer weißen Verkostungstheke mit Eigenmarken-Likören im Markt", caption: "Verkostung im Markt · Rückblick 2025" },
} as const satisfies Record<string, MarketPhoto>;
