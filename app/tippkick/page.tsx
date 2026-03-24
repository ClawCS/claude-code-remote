"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice, type Product } from "@/lib/utils";

type Match = {
  id: number;
  home: string;
  away: string;
  date: string;
  group: string;
  result?: string;
};

type Tip = {
  matchId: number;
  homeGoals: number;
  awayGoals: number;
};

type MatchDayProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  category: string;
  categorySlug: string;
  description: string;
  unit: string;
  inStock: boolean;
};

type MatchDayRecommendation = {
  matchId: number;
  homeFlag: string;
  awayFlag: string;
  homeGradient: string;
  awayGradient: string;
  homeProducts: MatchDayProduct[];
  awayProducts: MatchDayProduct[];
};

const upcomingMatches: Match[] = [
  { id: 1, home: "Deutschland", away: "Japan", date: "Mi, 11.06.", group: "Gruppe E" },
  { id: 2, home: "Brasilien", away: "Schweiz", date: "Do, 12.06.", group: "Gruppe G" },
  { id: 3, home: "Spanien", away: "Niederlande", date: "Do, 12.06.", group: "Gruppe H" },
  { id: 4, home: "Frankreich", away: "Australien", date: "Fr, 13.06.", group: "Gruppe D" },
  { id: 5, home: "Argentinien", away: "Kanada", date: "Fr, 13.06.", group: "Gruppe A" },
  { id: 6, home: "England", away: "USA", date: "Sa, 14.06.", group: "Gruppe B" },
];

const matchDayRecommendations: MatchDayRecommendation[] = [
  {
    matchId: 1, // Deutschland vs Japan
    homeFlag: "\u{1F1E9}\u{1F1EA}",
    awayFlag: "\u{1F1EF}\u{1F1F5}",
    homeGradient: "from-black via-red-700 to-yellow-500",
    awayGradient: "from-white via-red-600 to-red-800",
    homeProducts: [
      { id: 5, name: "König Pilsener", slug: "koenig-pilsener", price: 13.99, image: "https://media.trinkgut.de/assets/gtin/4/0/1/7/4017300104847-0.webp", category: "Bier", categorySlug: "bier", description: "Das König unter den Pilsenern — deutscher Klassiker!", unit: "Kasten 20x0,5L", inStock: true },
      { id: 2, name: "Bitburger Pils", slug: "bitburger-pils", price: 14.99, image: "https://media.trinkgut.de/assets/gtin/4/0/0/2/4002440001017-0.webp", category: "Bier", categorySlug: "bier", description: "Bitte ein Bit! Deutschlands Premium-Pilsener.", unit: "Kasten 24x0,33L", inStock: true },
      { id: 143, name: "funny-frisch Spezialitäten", slug: "funny-frisch-spezialitaeten", price: 1.69, image: "https://media.trinkgut.de/assets/gtin/4/0/0/3/4003586102584-0.webp", category: "Lebensmittel & Mehr", categorySlug: "lebensmittel", description: "Knusprige Chips — gehört zu jedem Fußballabend!", unit: "Packung", inStock: true },
    ],
    awayProducts: [
      { id: 56, name: "Suntory Toki", slug: "suntory-toki", price: 24.99, image: "https://media.trinkgut.de/assets/gtin/4/9/0/1/4901777247697-0.webp", category: "Spirituosen", categorySlug: "spirituosen", description: "Japanischer Blended Whisky — perfekt als Highball!", unit: "0,7L", inStock: true },
      { id: 47, name: "Coca-Cola, Fanta o. Sprite", slug: "coca-cola-fanta-sprite", price: 11.99, image: "https://media.trinkgut.de/assets/gtin/5/0/0/0/5000112547634-0.webp", category: "Alkoholfreie Getränke", categorySlug: "alkoholfrei", description: "Zum Mixen mit Suntory Toki Highball!", unit: "Kasten 12x1,0L", inStock: true },
      { id: 141, name: "nimm2 Lachgummi", slug: "nimm2-lachgummi", price: 1.29, image: "https://media.trinkgut.de/assets/gtin/4/0/1/4/4014400900231-0.webp", category: "Lebensmittel & Mehr", categorySlug: "lebensmittel", description: "Süßes für die Halbzeitpause!", unit: "Packung", inStock: true },
    ],
  },
  {
    matchId: 2, // Brasilien vs Schweiz
    homeFlag: "\u{1F1E7}\u{1F1F7}",
    awayFlag: "\u{1F1E8}\u{1F1ED}",
    homeGradient: "from-green-600 via-yellow-400 to-blue-600",
    awayGradient: "from-red-600 via-white to-red-600",
    homeProducts: [
      { id: 83, name: "Havana Club Rum", slug: "havana-club-rum", price: 12.99, image: "https://media.trinkgut.de/assets/gtin/8/5/0/1/8501110080231-0.webp", category: "Spirituosen", categorySlug: "spirituosen", description: "Caipirinha-Feeling! Karibischer Rum für den Brasil-Abend.", unit: "0,7L", inStock: true },
      { id: 44, name: "San Pellegrino Limonaden", slug: "san-pellegrino-limonaden", price: 7.99, image: "https://media.trinkgut.de/assets/gtin/8/0/0/2/8002270243417-0.webp", category: "Alkoholfreie Getränke", categorySlug: "alkoholfrei", description: "Erfrischende Limonaden — tropisches Flair!", unit: "Kasten 6x1,25L", inStock: true },
      { id: 143, name: "funny-frisch Spezialitäten", slug: "funny-frisch-spezialitaeten", price: 1.69, image: "https://media.trinkgut.de/assets/gtin/4/0/0/3/4003586102584-0.webp", category: "Lebensmittel & Mehr", categorySlug: "lebensmittel", description: "Snacks für die Samba-Party!", unit: "Packung", inStock: true },
    ],
    awayProducts: [
      { id: 76, name: "Pfaffl Grüner Veltliner o. Grauburgunder", slug: "pfaffl-gruener-veltliner", price: 7.99, image: "https://media.trinkgut.de/assets/gtin/9/0/0/8/9008700002172-0.webp", category: "Wein", categorySlug: "wein", description: "Alpenländischer Wein — passt zur Schweiz!", unit: "0,75L", inStock: true },
      { id: 27, name: "Gerolsteiner Mineralwasser", slug: "gerolsteiner-mineralwasser", price: 6.99, image: "https://media.trinkgut.de/assets/gtin/4/0/0/0/4000400113061-0.webp", category: "Alkoholfreie Getränke", categorySlug: "alkoholfrei", description: "Premium-Mineralwasser — Swiss Quality!", unit: "Kasten 12x0,75L", inStock: true },
      { id: 141, name: "nimm2 Lachgummi", slug: "nimm2-lachgummi", price: 1.29, image: "https://media.trinkgut.de/assets/gtin/4/0/1/4/4014400900231-0.webp", category: "Lebensmittel & Mehr", categorySlug: "lebensmittel", description: "Schokoladen-Alternative für den Halbzeit-Snack!", unit: "Packung", inStock: true },
    ],
  },
  {
    matchId: 3, // Spanien vs Niederlande
    homeFlag: "\u{1F1EA}\u{1F1F8}",
    awayFlag: "\u{1F1F3}\u{1F1F1}",
    homeGradient: "from-red-700 via-yellow-500 to-red-700",
    awayGradient: "from-red-600 via-white to-blue-700",
    homeProducts: [
      { id: 10, name: "Estrella Damm", slug: "estrella-damm", price: 17.99, image: "https://media.trinkgut.de/assets/gtin/8/4/1/0/8410793286129-0.webp", category: "Bier", categorySlug: "bier", description: "Barcelonas Lieblingsbier seit 1876 — Vamos España!", unit: "Kasten 24x0,33L", inStock: true },
      { id: 82, name: "Gin Mare", slug: "gin-mare", price: 29.99, image: "https://media.trinkgut.de/assets/gtin/8/4/1/1/8411640010014-0.webp", category: "Spirituosen", categorySlug: "spirituosen", description: "Mediterraner Premium-Gin aus Barcelona.", unit: "0,7L", inStock: true },
      { id: 61, name: "El Caserón", slug: "el-caseron", price: 2.99, image: "https://media.trinkgut.de/assets/gtin/4/3/2/5/4325070053408-0.webp", category: "Wein", categorySlug: "wein", description: "Spanischer Wein — Tapas-Begleiter!", unit: "0,75L", inStock: true },
    ],
    awayProducts: [
      { id: 7, name: "Heineken", slug: "heineken", price: 16.99, image: "https://media.trinkgut.de/assets/gtin/8/7/1/2/8712000010454-0.webp", category: "Bier", categorySlug: "bier", description: "Das legendäre Premium-Lager aus Amsterdam — Hup Holland!", unit: "Kasten 24x0,33L", inStock: true },
      { id: 8, name: "Carlsberg Lager Beer", slug: "carlsberg-lager-beer", price: 12.99, image: "https://media.trinkgut.de/assets/gtin/5/7/4/0/5740600100116-0.webp", category: "Bier", categorySlug: "bier", description: "Probably the best beer in the world.", unit: "Kasten 24x0,33L", inStock: true },
      { id: 143, name: "funny-frisch Spezialitäten", slug: "funny-frisch-spezialitaeten", price: 1.69, image: "https://media.trinkgut.de/assets/gtin/4/0/0/3/4003586102584-0.webp", category: "Lebensmittel & Mehr", categorySlug: "lebensmittel", description: "Chips & Bitterballen-Feeling!", unit: "Packung", inStock: true },
    ],
  },
  {
    matchId: 4, // Frankreich vs Australien
    homeFlag: "\u{1F1EB}\u{1F1F7}",
    awayFlag: "\u{1F1E6}\u{1F1FA}",
    homeGradient: "from-blue-800 via-white to-red-600",
    awayGradient: "from-blue-900 via-white to-red-700",
    homeProducts: [
      { id: 93, name: "Grey Goose Vodka", slug: "grey-goose-vodka", price: 29.99, image: "https://media.trinkgut.de/assets/gtin/8/0/4/8/8048000440013-0.webp", category: "Spirituosen", categorySlug: "spirituosen", description: "Französischer Premium-Vodka — Vive la France!", unit: "0,7L", inStock: true },
      { id: 95, name: "Hennessy Cognac", slug: "hennessy-cognac", price: 34.99, image: "https://media.trinkgut.de/assets/gtin/3/2/4/5/3245995817012-0.webp", category: "Spirituosen", categorySlug: "spirituosen", description: "Weltberühmter Cognac aus Frankreich.", unit: "0,7L", inStock: true },
      { id: 68, name: "Grand Corbier Crémant de Bordeaux", slug: "grand-corbier-cremant-bordeaux", price: 8.99, image: "https://media.trinkgut.de/assets/gtin/3/5/0/0/3500610158698-0.webp", category: "Wein", categorySlug: "wein", description: "Französischer Crémant — Champagner-Feeling!", unit: "0,75L", inStock: true },
    ],
    awayProducts: [
      { id: 1, name: "Flensburger", slug: "flensburger", price: 15.99, image: "https://media.trinkgut.de/assets/gtin/4/0/0/1/4001350011101-0.webp", category: "Bier", categorySlug: "bier", description: "Plopp! Herbes, ehrliches Bier für den Outback-Abend.", unit: "Kasten 20x0,33L", inStock: true },
      { id: 40, name: "effect Energy Drink", slug: "effect-energy-drink", price: 7.49, image: "https://media.trinkgut.de/assets/gtin/4/0/1/5/4015600220471-0.webp", category: "Alkoholfreie Getränke", categorySlug: "alkoholfrei", description: "Energy für den Australien-Nachtspiel-Kick!", unit: "6-Pack", inStock: true },
      { id: 143, name: "funny-frisch Spezialitäten", slug: "funny-frisch-spezialitaeten", price: 1.69, image: "https://media.trinkgut.de/assets/gtin/4/0/0/3/4003586102584-0.webp", category: "Lebensmittel & Mehr", categorySlug: "lebensmittel", description: "BBQ Chips — Outback Feeling!", unit: "Packung", inStock: true },
    ],
  },
  {
    matchId: 5, // Argentinien vs Kanada
    homeFlag: "\u{1F1E6}\u{1F1F7}",
    awayFlag: "\u{1F1E8}\u{1F1E6}",
    homeGradient: "from-sky-400 via-white to-sky-400",
    awayGradient: "from-red-700 via-white to-red-700",
    homeProducts: [
      { id: 84, name: "Captain Morgan", slug: "captain-morgan", price: 11.99, image: "https://media.trinkgut.de/assets/gtin/5/0/0/0/5000281025360-0.webp", category: "Spirituosen", categorySlug: "spirituosen", description: "Karibik-Feeling — Rum für die Messi-Fans!", unit: "0,7L", inStock: true },
      { id: 47, name: "Coca-Cola, Fanta o. Sprite", slug: "coca-cola-fanta-sprite", price: 11.99, image: "https://media.trinkgut.de/assets/gtin/5/0/0/0/5000112547634-0.webp", category: "Alkoholfreie Getränke", categorySlug: "alkoholfrei", description: "Zum Mixen — Cuba Libre Argentina Style!", unit: "Kasten 12x1,0L", inStock: true },
      { id: 141, name: "nimm2 Lachgummi", slug: "nimm2-lachgummi", price: 1.29, image: "https://media.trinkgut.de/assets/gtin/4/0/1/4/4014400900231-0.webp", category: "Lebensmittel & Mehr", categorySlug: "lebensmittel", description: "Süßes für Messis Fans!", unit: "Packung", inStock: true },
    ],
    awayProducts: [
      { id: 8, name: "Carlsberg Lager Beer", slug: "carlsberg-lager-beer", price: 12.99, image: "https://media.trinkgut.de/assets/gtin/5/7/4/0/5740600100116-0.webp", category: "Bier", categorySlug: "bier", description: "Nordamerikanisches Lager-Feeling!", unit: "Kasten 24x0,33L", inStock: true },
      { id: 96, name: "Rémy Martin VSOP Cognac", slug: "remy-martin-vsop", price: 34.99, image: "https://media.trinkgut.de/assets/gtin/3/0/2/4/3024480115105-0.webp", category: "Spirituosen", categorySlug: "spirituosen", description: "Premium Cognac — Canadian Sophistication.", unit: "0,7L", inStock: true },
      { id: 143, name: "funny-frisch Spezialitäten", slug: "funny-frisch-spezialitaeten", price: 1.69, image: "https://media.trinkgut.de/assets/gtin/4/0/0/3/4003586102584-0.webp", category: "Lebensmittel & Mehr", categorySlug: "lebensmittel", description: "Maple-Snack Alternative!", unit: "Packung", inStock: true },
    ],
  },
  {
    matchId: 6, // England vs USA
    homeFlag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
    awayFlag: "\u{1F1FA}\u{1F1F8}",
    homeGradient: "from-red-700 via-white to-blue-800",
    awayGradient: "from-blue-900 via-red-600 to-white",
    homeProducts: [
      { id: 18, name: "Guinness Draught", slug: "guinness-draught", price: 17.99, image: "https://media.trinkgut.de/assets/gtin/5/0/0/0/5000213025147-0.webp", category: "Bier", categorySlug: "bier", description: "It's a Guinness! Britisches Pub-Feeling pur.", unit: "Kasten 24x0,44L", inStock: true },
      { id: 68, name: "Bombay Sapphire", slug: "bombay-sapphire", price: 17.99, image: "https://media.trinkgut.de/assets/gtin/5/0/1/0/5010677714006-0.webp", category: "Spirituosen", categorySlug: "spirituosen", description: "London Dry Gin — English Gentleman approved.", unit: "0,7L", inStock: true },
      { id: 143, name: "funny-frisch Spezialitäten", slug: "funny-frisch-spezialitaeten", price: 1.69, image: "https://media.trinkgut.de/assets/gtin/4/0/0/3/4003586102584-0.webp", category: "Lebensmittel & Mehr", categorySlug: "lebensmittel", description: "Fish & Chips-Style Crisps!", unit: "Packung", inStock: true },
    ],
    awayProducts: [
      { id: 57, name: "Jack Daniel's", slug: "jack-daniels", price: 19.99, image: "https://media.trinkgut.de/assets/gtin/5/0/9/9/5099873089798-0.webp", category: "Spirituosen", categorySlug: "spirituosen", description: "Tennessee Whiskey — America's Finest!", unit: "0,7L", inStock: true },
      { id: 78, name: "Jim Beam Black", slug: "jim-beam-black", price: 17.99, image: "https://media.trinkgut.de/assets/gtin/5/0/6/0/5060045580306-0.webp", category: "Spirituosen", categorySlug: "spirituosen", description: "Kentucky Bourbon — USA! USA!", unit: "0,7L", inStock: true },
      { id: 47, name: "Coca-Cola, Fanta o. Sprite", slug: "coca-cola-fanta-sprite", price: 11.99, image: "https://media.trinkgut.de/assets/gtin/5/0/0/0/5000112547634-0.webp", category: "Alkoholfreie Getränke", categorySlug: "alkoholfrei", description: "All-American Mix — Jack & Coke!", unit: "Kasten 12x1,0L", inStock: true },
    ],
  },
];

const leaderboard = [
  { rank: 1, name: "MaxBier99", points: 42, trend: "\u2191" },
  { rank: 2, name: "KölschFan", points: 39, trend: "\u2191" },
  { rank: 3, name: "PilsProfi", points: 37, trend: "\u2193" },
  { rank: 4, name: "HopfenHeld", points: 35, trend: "\u2192" },
  { rank: 5, name: "BierBaron", points: 33, trend: "\u2191" },
  { rank: 6, name: "GoldenGoal", points: 31, trend: "\u2193" },
  { rank: 7, name: "StadionKing", points: 29, trend: "\u2192" },
  { rank: 8, name: "TorjägerTom", points: 27, trend: "\u2191" },
];

function MatchDayModal({
  match,
  recommendation,
  onClose,
}: {
  match: Match;
  recommendation: MatchDayRecommendation;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const handleAddItem = (product: MatchDayProduct) => {
    const cartProduct: Product = {
      ...product,
      originalPrice: undefined,
      ean: undefined,
      highlight: false,
    };
    addItem(cartProduct, 1);
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  };

  const handleAddAll = () => {
    const allProducts = [...recommendation.homeProducts, ...recommendation.awayProducts];
    allProducts.forEach((p) => {
      const cartProduct: Product = {
        ...p,
        originalPrice: undefined,
        ean: undefined,
        highlight: false,
      };
      addItem(cartProduct, 1);
    });
    setAddedIds(new Set(allProducts.map((p) => p.id)));
    setTimeout(() => setAddedIds(new Set()), 2000);
  };

  const totalPrice = [...recommendation.homeProducts, ...recommendation.awayProducts].reduce(
    (sum, p) => sum + p.price,
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${recommendation.homeGradient} p-5 rounded-t-2xl relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative text-center text-white">
            <p className="text-sm font-medium opacity-90 mb-1">
              Mach dein Wohnzimmer zur Fan-Zone! 🔥
            </p>
            <h2 className="text-xl sm:text-2xl font-bold">
              🏟️ Match-Day Paket
            </h2>
            <p className="text-lg font-semibold mt-1">
              {recommendation.homeFlag} {match.home} vs {match.away} {recommendation.awayFlag}
            </p>
            <p className="text-xs opacity-80 mt-1">{match.date} &middot; {match.group}</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors text-lg"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        {/* Product columns */}
        <div className="p-4 sm:p-6">
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Home team */}
            <div>
              <h3 className="font-bold text-secondary text-center mb-3 text-sm uppercase tracking-wide">
                {recommendation.homeFlag} {match.home}
              </h3>
              <div className="space-y-3">
                {recommendation.homeProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-light rounded-xl p-3 flex gap-3 items-center"
                  >
                    <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 relative overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-secondary text-sm leading-tight line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{product.unit}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-bold text-primary text-sm">
                          {formatPrice(product.price)}
                        </span>
                        <button
                          onClick={() => handleAddItem(product)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                            addedIds.has(product.id)
                              ? "bg-green-500 text-white"
                              : "bg-primary hover:bg-primary-dark text-white"
                          }`}
                        >
                          {addedIds.has(product.id) ? "✓" : "+ Warenkorb"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Away team */}
            <div>
              <h3 className="font-bold text-secondary text-center mb-3 text-sm uppercase tracking-wide">
                {recommendation.awayFlag} {match.away}
              </h3>
              <div className="space-y-3">
                {recommendation.awayProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-light rounded-xl p-3 flex gap-3 items-center"
                  >
                    <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 relative overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-secondary text-sm leading-tight line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{product.unit}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-bold text-primary text-sm">
                          {formatPrice(product.price)}
                        </span>
                        <button
                          onClick={() => handleAddItem(product)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                            addedIds.has(product.id)
                              ? "bg-green-500 text-white"
                              : "bg-primary hover:bg-primary-dark text-white"
                          }`}
                        >
                          {addedIds.has(product.id) ? "✓" : "+ Warenkorb"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Complete package CTA */}
          <div className="mt-6 pt-4 border-t border-border">
            <button
              onClick={handleAddAll}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-amber-500 hover:from-primary-dark hover:to-amber-600 text-white font-bold rounded-xl transition-all text-base shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              🛒 Komplettes Paket bestellen &middot; {formatPrice(totalPrice)}
            </button>
            <p className="text-center text-xs text-muted mt-2">
              Nur solange der Vorrat reicht — bestelle jetzt für {match.date}!
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scaleIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date("2026-06-11T00:00:00+02:00").getTime();
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-gradient-to-r from-secondary to-gray-800 rounded-xl p-5 mb-6 text-white text-center">
      <p className="text-sm font-medium mb-2 opacity-80">Countdown zur WM 2026</p>
      <div className="flex justify-center gap-4">
        {[
          { value: timeLeft.days, label: "Tage" },
          { value: timeLeft.hours, label: "Std" },
          { value: timeLeft.minutes, label: "Min" },
          { value: timeLeft.seconds, label: "Sek" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center">
            <span className="text-3xl font-bold tabular-nums">{String(item.value).padStart(2, "0")}</span>
            <span className="text-xs opacity-70">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TippkickPage() {
  const [tips, setTips] = useState<Tip[]>(
    upcomingMatches.map((m) => ({ matchId: m.id, homeGoals: 0, awayGoals: 0 }))
  );
  const [submitted, setSubmitted] = useState(false);
  const [username, setUsername] = useState("");
  const [registered, setRegistered] = useState(false);
  const [activeModal, setActiveModal] = useState<number | null>(null);

  const updateTip = (matchId: number, side: "home" | "away", delta: number) => {
    setTips((prev) =>
      prev.map((t) => {
        if (t.matchId !== matchId) return t;
        const key = side === "home" ? "homeGoals" : "awayGoals";
        return { ...t, [key]: Math.max(0, Math.min(9, t[key] + delta)) };
      })
    );
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeModal !== null) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [activeModal]);

  if (!registered) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-8">
          <span className="text-6xl block mb-4">🏆</span>
          <h1 className="text-3xl font-bold text-secondary mb-2">WM 2026 Tippspiel</h1>
          <p className="text-muted">
            Tippe die WM-Ergebnisse und gewinne fette Preise!
          </p>
        </div>

        <Countdown />

        {/* Prizes */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 mb-6 text-secondary">
          <h3 className="font-bold text-center mb-3">🏆 WM-Preise</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-white/80 rounded-lg p-3">
              <span className="text-2xl">🥇</span>
              <div>
                <p className="font-bold">1. Platz</p>
                <p className="text-sm">1.000 € Reisegutschein</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
              <span className="text-2xl">🥈</span>
              <div>
                <p className="font-bold">2. Platz</p>
                <p className="text-sm">PlayStation 5 Pro + EA Sports FC (FIFA)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/40 rounded-lg p-3">
              <span className="text-2xl">🥉</span>
              <div>
                <p className="font-bold">3. Platz</p>
                <p className="text-sm">300 € Einkaufsgutschein bei Trinkgut Jammers</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Spielername *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="z.B. BierBaron42"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">E-Mail *</label>
              <input
                type="email"
                placeholder="deine@email.de"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              onClick={() => username && setRegistered(true)}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
            >
              Mitmachen
            </button>
          </div>
          <div className="mt-6 p-4 bg-light rounded-lg">
            <h3 className="font-semibold text-secondary text-sm mb-2">Punktesystem:</h3>
            <ul className="text-xs text-muted space-y-1">
              <li>3 Punkte – Exaktes Ergebnis</li>
              <li>1 Punkt – Richtige Tendenz (Sieg/Unentschieden)</li>
              <li>0 Punkte – Falsch getippt</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <span className="text-6xl block mb-4">✅</span>
        <h2 className="text-2xl font-bold text-secondary mb-2">Tipps abgegeben!</h2>
        <p className="text-muted mb-6">
          Viel Glück, {username}! Die Ergebnisse werden nach den Spielen ausgewertet.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
        >
          Tipps bearbeiten
        </button>
      </div>
    );
  }

  const activeMatch = activeModal !== null ? upcomingMatches.find((m) => m.id === activeModal) : null;
  const activeRec = activeModal !== null ? matchDayRecommendations.find((r) => r.matchId === activeModal) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">🏆 WM 2026 Tippspiel</h1>
          <p className="text-muted">Gruppenphase – Deine Tipps, {username}</p>
        </div>
      </div>

      <Countdown />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Matches */}
        <div className="lg:col-span-2 space-y-3">
          {upcomingMatches.map((match) => {
            const tip = tips.find((t) => t.matchId === match.id)!;
            const rec = matchDayRecommendations.find((r) => r.matchId === match.id);
            return (
              <div key={match.id} className="bg-white border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted">{match.date}</p>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{match.group}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-right font-medium text-secondary text-sm">{match.home}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateTip(match.id, "home", -1)} className="w-7 h-7 rounded bg-light text-sm font-bold hover:bg-border">-</button>
                    <span className="w-8 text-center font-bold text-lg">{tip.homeGoals}</span>
                    <button onClick={() => updateTip(match.id, "home", 1)} className="w-7 h-7 rounded bg-light text-sm font-bold hover:bg-border">+</button>
                  </div>
                  <span className="text-muted font-bold">:</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateTip(match.id, "away", -1)} className="w-7 h-7 rounded bg-light text-sm font-bold hover:bg-border">-</button>
                    <span className="w-8 text-center font-bold text-lg">{tip.awayGoals}</span>
                    <button onClick={() => updateTip(match.id, "away", 1)} className="w-7 h-7 rounded bg-light text-sm font-bold hover:bg-border">+</button>
                  </div>
                  <span className="flex-1 font-medium text-secondary text-sm">{match.away}</span>
                </div>
                {rec && (
                  <button
                    onClick={() => setActiveModal(match.id)}
                    className="mt-3 w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg text-sm transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                  >
                    🍻 Dein Match-Day Paket
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={() => setSubmitted(true)}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-lg mt-4"
          >
            Tipps abgeben
          </button>
        </div>

        {/* Leaderboard */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="font-bold text-secondary mb-4">🏆 Rangliste</h2>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                  entry.rank <= 3 ? "bg-amber-50" : ""
                }`}
              >
                <span className="w-6 text-center font-bold text-muted">
                  {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                </span>
                <span className="flex-1 font-medium text-secondary">{entry.name}</span>
                <span className="text-xs text-muted">{entry.trend}</span>
                <span className="font-bold text-primary">{entry.points} Pkt.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Match Day Modal */}
      {activeMatch && activeRec && (
        <MatchDayModal
          match={activeMatch}
          recommendation={activeRec}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
