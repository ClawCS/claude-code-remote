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
  posterImage: string;
  detailImage: string;
  accentColor: string;
  emoji: string;
};

export const eigenmarken: EigenmarkeLikoer[] = [
  {
    slug: "pralle-kirsche",
    name: "Pralle Kirsche",
    tagline: "schon probiert?",
    flavor: "Kirsch-Mandel-Likör",
    flavorNL: "Kers-amandel likeur",
    abv: 15,
    volume: 700,
    descriptionDE: "Fruchtiger Kirsch-Likör mit feiner Mandelnote — verführerisch süß, perfekt als Aperitif oder pur auf Eis.",
    descriptionNL: "Fruitige kersenlikeur met een verfijnde amandelsmaak — verleidelijk zoet, perfect als aperitief of puur op ijs.",
    posterImage: "/images/eigenmarken/pralle-kirsche-poster.png",
    detailImage: "/images/eigenmarken/pralle-kirsche-detail.png",
    accentColor: "#DC2626",
    emoji: "🍒",
  },
  {
    slug: "dicke-nuesse",
    name: "Dicke Nüsse",
    tagline: "schon probiert?",
    flavor: "Haselnuss-Likör",
    flavorNL: "Hazelnoot likeur",
    abv: 18,
    volume: 700,
    descriptionDE: "Milder Haselnuss-Likör mit cremiger Tiefe — wie ein Sonntag bei Oma. Pur auf Eis oder im Kaffee.",
    descriptionNL: "Zachte hazelnoot likeur met romige diepte — als een zondag bij oma. Puur op ijs of in de koffie.",
    posterImage: "/images/eigenmarken/dicke-nuesse-poster.png",
    detailImage: "/images/eigenmarken/dicke-nuesse-detail.png",
    accentColor: "#B45309",
    emoji: "🌰",
  },
  {
    slug: "suesse-suende",
    name: "Süsse Sünde",
    tagline: "schon probiert?",
    flavor: "Vanille-Sahne-Likör",
    flavorNL: "Vanille-room likeur",
    abv: 15,
    volume: 700,
    descriptionDE: "Verführerisch cremiger Vanille-Sahne-Likör — die kleine Sünde nach dem Essen. Eiskalt servieren.",
    descriptionNL: "Verleidelijk romige vanille-room likeur — de kleine zonde na het eten. IJskoud serveren.",
    posterImage: "/images/eigenmarken/suesse-suende-poster.png",
    detailImage: "/images/eigenmarken/suesse-suende-detail.png",
    accentColor: "#FBBF24",
    emoji: "🍦",
  },
  {
    slug: "caramello",
    name: "Caramello",
    tagline: "schon probiert?",
    flavor: "Karamell-Likör",
    flavorNL: "Karamel likeur",
    abv: 20,
    volume: 700,
    descriptionDE: "Feinster Karamell-Likör — schmeckt wie Werther's Original aus dem Glas. Pur, im Kaffee oder über Vanilleeis.",
    descriptionNL: "Fijnste karamel likeur — smaakt naar Werther's Original uit het glas. Puur, in koffie of over vanille-ijs.",
    posterImage: "/images/eigenmarken/caramello-poster.png",
    detailImage: "/images/eigenmarken/caramello-detail.png",
    accentColor: "#F97316",
    emoji: "🍯",
  },
  {
    slug: "schwarzer-teufel",
    name: "Schwarzer Teufel",
    tagline: "schon probiert?",
    flavor: "Lakritz-Frucht-Likör",
    flavorNL: "Drop-fruit likeur",
    abv: 20,
    volume: 700,
    descriptionDE: "Lakritz-Frucht-Likör mit Kirsch & Granatapfel — ein wilder Mix für mutige Gaumen.",
    descriptionNL: "Fruitige droplikeur met kers & granaatappel — een wilde mix voor moedige gehemelten.",
    posterImage: "/images/eigenmarken/schwarzer-teufel-poster.png",
    detailImage: "/images/eigenmarken/schwarzer-teufel-detail.png",
    accentColor: "#84CC16",
    emoji: "👹",
  },
  {
    slug: "weisser-engel",
    name: "Weisser Engel",
    tagline: "schon probiert?",
    flavor: "Anis-Likör",
    flavorNL: "Anijs likeur",
    abv: 21,
    volume: 700,
    descriptionDE: "Drabbiger, klarer Anis-Likör — ein himmlischer Digestif. Eiskalt aus dem Tiefkühler.",
    descriptionNL: "Heldere, stroperige anijslikeur — een hemelse digestief. IJskoud uit de vriezer.",
    posterImage: "/images/eigenmarken/weisser-engel-poster.png",
    detailImage: "/images/eigenmarken/weisser-engel-detail.png",
    accentColor: "#FDE047",
    emoji: "👼",
  },
];
