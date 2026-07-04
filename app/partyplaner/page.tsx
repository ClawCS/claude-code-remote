"use client";
import Link from "next/link";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice, type Product } from "@/lib/utils";
import productsData from "@/data/products.json";
import ShimmerParticles from "@/components/ShimmerParticles";

const products = productsData as Product[];

type PartyConfig = {
  guests: number;
  duration: number; // hours
  beerDrinkers: number; // percentage
  wineDrinkers: number;
  softDrinkers: number;
  spiritDrinkers: number;
};

function calculateNeeds(config: PartyConfig) {
  const { guests, duration, beerDrinkers, wineDrinkers, softDrinkers, spiritDrinkers } = config;
  const drinksPerHour = 2;
  const totalDrinks = guests * duration * drinksPerHour;

  // Portionen (Getränke) pro Kategorie
  const beerServings = (totalDrinks * beerDrinkers) / 100;
  const wineServings = (totalDrinks * wineDrinkers) / 100;
  const softServings = (totalDrinks * softDrinkers) / 100;
  const spiritServings = (totalDrinks * spiritDrinkers) / 100;

  // Portionsgrößen → tatsächlicher Liter-Bedarf pro Kategorie
  const beerLiters = beerServings * 0.33; // Flasche/Glas ~0,33 l
  const wineLiters = wineServings * 0.2; // Weinglas ~0,2 l
  const softLiters = softServings * 0.25; // Glas ~0,25 l
  const spiritLiters = spiritServings * 0.04; // Shot 4 cl
  const waterLiters = guests * duration * 0.2; // ~0,2 l pro Person und Stunde

  return { beerLiters, wineLiters, softLiters, spiritLiters, waterLiters, totalDrinks };
}

/** Liest das Volumen eines Produkts (in Litern) aus unit/description — z.B. "16 x 0,33 l" = 5,28 l, "5L" = 5 l. */
function parseVolumeLiters(p: Product): number {
  const text = `${p.unit ?? ""} ${p.description ?? ""}`.toLowerCase().replace(/,/g, ".");
  const multi = text.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*l/);
  if (multi) return parseInt(multi[1], 10) * parseFloat(multi[2]);
  const single = text.match(/(\d+(?:\.\d+)?)\s*l\b/);
  if (single) return parseFloat(single[1]);
  return 0;
}

/** Wie viele Einheiten des Produkts decken den Liter-Bedarf (mind. 1)? */
function unitsFor(liters: number, product: Product): number {
  const vol = parseVolumeLiters(product);
  return Math.max(1, Math.ceil(liters / (vol > 0 ? vol : 1)));
}

function getRecommendations(needs: ReturnType<typeof calculateNeeds>) {
  const recs: { product: Product; quantity: number; reason: string }[] = [];

  const fmtL = (l: number) => `~${Math.round(l)} l`;
  const waterRegex = /(wasser|gerolsteiner|fachingen|volvic|quelle|pellegrino|rheinfels)/i;

  if (needs.beerLiters > 0) {
    const beer = products.find((p) => p.categorySlug === "bier");
    if (beer) recs.push({ product: beer, quantity: unitsFor(needs.beerLiters, beer), reason: `${fmtL(needs.beerLiters)} Bier` });
  }
  if (needs.wineLiters > 0) {
    const wine = products.find((p) => p.categorySlug === "wein");
    if (wine) recs.push({ product: wine, quantity: unitsFor(needs.wineLiters, wine), reason: `${fmtL(needs.wineLiters)} Wein` });
  }
  if (needs.softLiters > 0) {
    const soft =
      products.find((p) => p.categorySlug === "alkoholfrei" && !waterRegex.test(p.name)) ||
      products.find((p) => p.categorySlug === "alkoholfrei");
    if (soft) recs.push({ product: soft, quantity: unitsFor(needs.softLiters, soft), reason: `${fmtL(needs.softLiters)} Softdrinks` });
  }
  if (needs.spiritLiters > 0) {
    const spirit = products.find((p) => p.categorySlug === "spirituosen");
    if (spirit) recs.push({ product: spirit, quantity: unitsFor(needs.spiritLiters, spirit), reason: `${fmtL(needs.spiritLiters)} Spirituosen` });
  }
  if (needs.waterLiters > 0) {
    const water =
      products.find((p) => p.categorySlug === "alkoholfrei" && waterRegex.test(p.name)) ||
      products.find((p) => p.categorySlug === "alkoholfrei");
    if (water) recs.push({ product: water, quantity: unitsFor(needs.waterLiters, water), reason: `${fmtL(needs.waterLiters)} Wasser` });
  }

  return recs;
}

export default function PartyplanerPage() {
  const { addItem } = useCart();
  const [config, setConfig] = useState<PartyConfig>({
    guests: 20,
    duration: 5,
    beerDrinkers: 50,
    wineDrinkers: 20,
    softDrinkers: 20,
    spiritDrinkers: 10,
  });
  const [showResults, setShowResults] = useState(false);

  const needs = calculateNeeds(config);
  const recommendations = getRecommendations(needs);
  const totalCost = recommendations.reduce((sum, r) => sum + r.product.price * r.quantity, 0);

  const handleAddAll = () => {
    recommendations.forEach((r) => addItem(r.product, r.quantity));
  };

  return (
    <>
    <div className="page-hero-banner py-16 md:py-24">
      <ShimmerParticles />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <nav className="text-sm text-white/60 mb-4"><Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">/</span> <span className="text-white">Partyplaner</span></nav>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Partyplaner</h1>
        <p className="text-white/80 max-w-xl mx-auto text-lg">
          Plane deine Party perfekt! Gib die Details ein und wir berechnen, wie viel du brauchst.
        </p>
      </div>
    </div>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* Config Form */}
      <div className="bg-white border border-border rounded-xl p-6 mb-8">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Anzahl Gäste
            </label>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={config.guests}
              onChange={(e) => setConfig({ ...config, guests: +e.target.value })}
              className="w-full accent-primary"
            />
            <div className="text-2xl font-bold text-primary mt-1">{config.guests} Personen</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Dauer der Party
            </label>
            <input
              type="range"
              min={2}
              max={12}
              value={config.duration}
              onChange={(e) => setConfig({ ...config, duration: +e.target.value })}
              className="w-full accent-primary"
            />
            <div className="text-2xl font-bold text-primary mt-1">{config.duration} Stunden</div>
          </div>
        </div>

        <hr className="my-6 border-border" />

        <h3 className="font-semibold text-secondary mb-4">Was trinken deine Gäste? (Prozent-Verteilung)</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "beerDrinkers" as const, label: "🍺 Bier", color: "text-[#F59E0B]" },
            { key: "wineDrinkers" as const, label: "🍷 Wein", color: "text-[#7A1428]" },
            { key: "softDrinkers" as const, label: "🥤 Softdrinks", color: "text-[#DC2626]" },
            { key: "spiritDrinkers" as const, label: "🥃 Spirituosen", color: "text-[#B91C1C]" },
          ].map(({ key, label, color }) => (
            <div key={key} className="text-center">
              <label className="block text-sm font-medium text-muted mb-1">{label}</label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={config[key]}
                onChange={(e) => setConfig({ ...config, [key]: +e.target.value })}
                className="w-full accent-primary"
              />
              <span className={`text-lg font-bold ${color}`}>{config[key]}%</span>
            </div>
          ))}
        </div>
        {config.beerDrinkers + config.wineDrinkers + config.softDrinkers + config.spiritDrinkers !== 100 && (
          <p className="text-sm text-red-500 mt-2">
            Summe: {config.beerDrinkers + config.wineDrinkers + config.softDrinkers + config.spiritDrinkers}% (sollte 100% sein)
          </p>
        )}

        <button
          onClick={() => setShowResults(true)}
          className="mt-6 w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-lg"
        >
          Berechnen
        </button>
      </div>

      {/* Results */}
      {showResults && (
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-secondary mb-2">Deine Party-Einkaufsliste</h2>
          <p className="text-sm text-muted mb-6">
            Für {config.guests} Gäste, {config.duration} Stunden – ca. {needs.totalDrinks} Getränke gesamt
          </p>

          <div className="space-y-4 mb-6">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-light rounded-lg">
                <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 relative">
                  <Image src={rec.product.image} alt={rec.product.name} fill sizes="64px" className="object-contain p-1" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-secondary">{rec.product.name}</p>
                  <p className="text-sm text-muted">{rec.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">{rec.quantity}x {formatPrice(rec.product.price)}</p>
                  <p className="font-bold text-primary">{formatPrice(rec.product.price * rec.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Geschätzter Gesamtpreis</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(totalCost)}</p>
            </div>
            <button
              onClick={handleAddAll}
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
            >
              Alles in den Warenkorb
            </button>
          </div>

          <p className="text-xs text-muted mt-4">
            * Berechnung basiert auf ca. 2 Getränken pro Person pro Stunde. Dazu empfehlen wir immer genug Wasser!
            Gerne beraten wir dich persönlich im Markt.
          </p>
        </div>
      )}
    </div>
    </>
  );
}
