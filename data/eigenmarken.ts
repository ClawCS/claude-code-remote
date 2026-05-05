export type EigenmarkeLikoer = {
  slug: string;
  name: string;
  tagline: string;
  flavor: string;
  flavorNL: string;
  abv: number;
  volume: number;
  descriptionDE: string;
  descriptionNL: string;
  image: string;
  accentColor: string;
  emoji: string;
};

export const eigenmarken: EigenmarkeLikoer[] = [
  {
    slug: "pralle-kirsche",
    name: "Pralle Kirsche",
    tagline: "slipperfje",
    flavor: "Kirsch-Mandel-Likör",
    flavorNL: "Kers-amandel likeur",
    abv: 15,
    volume: 700,
    descriptionDE: "Fruchtiger Kirsch-Likör mit feiner Mandelnote — verführerisch süß, perfekt als Aperitif oder pur auf Eis.",
    descriptionNL: "Fruitige kersenlikeur met een verfijnde amandelsmaak — verleidelijk zoet, perfect als aperitief of puur op ijs.",
    image: "/images/eigenmarken/pralle-kirsche.png",
    accentColor: "#DC2626",
    emoji: "🍒",
  },
  {
    slug: "dicke-nuesse",
    name: "Dicke Nüsse",
    tagline: "dikke nootjes",
    flavor: "Haselnuss-Likör",
    flavorNL: "Hazelnoot likeur",
    abv: 18,
    volume: 700,
    descriptionDE: "Milder Haselnuss-Likör mit cremiger Tiefe — wie ein Sonntag bei Oma. Pur auf Eis oder im Kaffee.",
    descriptionNL: "Zachte hazelnoot likeur met romige diepte — als een zondag bij oma. Puur op ijs of in de koffie.",
    image: "/images/eigenmarken/dicke-nuesse.png",
    accentColor: "#B45309",
    emoji: "🌰",
  },
  {
    slug: "suesse-suende",
    name: "Süsse Sünde",
    tagline: "zoete zonde",
    flavor: "Vanille-Likör",
    flavorNL: "Vanille likeur",
    abv: 15,
    volume: 700,
    descriptionDE: "Cremig & verführerisch — ein verleidelijk romiger Vanille-Likör mit natürlicher Süße.",
    descriptionNL: "Verleidelijk romige vanille likeur — de kleine zonde na het eten. IJskoud serveren.",
    image: "/images/eigenmarken/suesse-suende.png",
    accentColor: "#FBBF24",
    emoji: "🍦",
  },
  {
    slug: "caramello",
    name: "Caramello",
    tagline: "caramello",
    flavor: "Karamell-Likör",
    flavorNL: "Karamel likeur",
    abv: 20,
    volume: 700,
    descriptionDE: "Feinster Karamell-Likör — schmeckt wie Werther's Original aus dem Glas. Pur, im Kaffee oder über Vanilleeis.",
    descriptionNL: "Fijnste karamel likeur — smaakt naar Werther's Original uit het glas. Puur, in koffie of over vanille-ijs.",
    image: "/images/eigenmarken/caramello.png",
    accentColor: "#F97316",
    emoji: "🍯",
  },
  {
    slug: "schwarzer-teufel",
    name: "Schwarzer Teufel",
    tagline: "zwarte duivel",
    flavor: "Lakritz-Frucht-Likör",
    flavorNL: "Drop-fruit likeur",
    abv: 20,
    volume: 700,
    descriptionDE: "Lakritz-Frucht-Likör mit Kirsch & Granatapfel — ein wilder Mix für mutige Gaumen.",
    descriptionNL: "Fruitige droplikeur met kers & granaatappel — een wilde mix voor moedige gehemelten.",
    image: "/images/eigenmarken/schwarzer-teufel.png",
    accentColor: "#84CC16",
    emoji: "👹",
  },
  {
    slug: "weisser-engel",
    name: "Weisser Engel",
    tagline: "witte engel",
    flavor: "Anis-Likör",
    flavorNL: "Anijs likeur",
    abv: 21,
    volume: 700,
    descriptionDE: "Klarer Anis-Likör mit kräftigem Charakter und traditioneller Rezeptur — intensiv & klar.",
    descriptionNL: "Heldere anijslikeur met krachtig karakter en traditioneel recept — intens & helder.",
    image: "/images/eigenmarken/weisser-engel.png",
    accentColor: "#FDE047",
    emoji: "👼",
  },
];
