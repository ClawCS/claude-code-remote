import type { Product } from "@/lib/utils";
export type PartyConfig = {
  guests: number;
  duration: number; // hours
  beerDrinkers: number; // percentage
  wineDrinkers: number;
  softDrinkers: number;
  spiritDrinkers: number;
};

export function distributionValidity(config: PartyConfig) {
  const shares = [config.beerDrinkers, config.wineDrinkers, config.softDrinkers, config.spiritDrinkers];
  const total = shares.reduce((sum, share) => sum + share, 0);
  return { total, valid: shares.every(share => Number.isFinite(share) && share >= 0 && share <= 100) && total === 100 };
}

// Reviewed historical product labels explicitly say Mineralwasser. This
// classification is not a live stock or price assertion. Prefer one 9 l case.
const plainWaterIds = [71, 70, 72, 73, 75, 77];

export function calculateNeeds(config: PartyConfig) {
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
export function parseVolumeLiters(p: Product): number {
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

export function getRecommendations(needs: ReturnType<typeof calculateNeeds>, products: readonly Product[]) {
  const recs: { product: Product; quantity: number; reason: string }[] = [];

  const fmtL = (l: number) => `~${Math.round(l)} l`;

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
      products.find((p) => p.categorySlug === "alkoholfrei" && !plainWaterIds.includes(p.id)) ||
      products.find((p) => p.categorySlug === "alkoholfrei");
    if (soft) recs.push({ product: soft, quantity: unitsFor(needs.softLiters, soft), reason: `${fmtL(needs.softLiters)} Softdrinks` });
  }
  if (needs.spiritLiters > 0) {
    const spirit = products.find((p) => p.categorySlug === "spirituosen");
    if (spirit) recs.push({ product: spirit, quantity: unitsFor(needs.spiritLiters, spirit), reason: `${fmtL(needs.spiritLiters)} Spirituosen` });
  }
  if (needs.waterLiters > 0) {
    const water = plainWaterIds.map(id => products.find(p => p.id === id && p.categorySlug === "alkoholfrei"))
      .find(p => p !== undefined && Number.isFinite(parseVolumeLiters(p)) && parseVolumeLiters(p) > 0);
    if (water) recs.push({ product: water, quantity: unitsFor(needs.waterLiters, water), reason: `${fmtL(needs.waterLiters)} Wasser` });
  }

  return recs;
}
