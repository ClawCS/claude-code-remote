import { type Product } from "@/lib/utils";

export type FinderType = "bier" | "wein" | "wasser" | null;

const beerStyles = {
  pils: /\b(?:pils|pilsener|pilsner)\b/,
  weizen: /\b(?:weizen|weizenbier|weissbier|weisse|witbier|hefeweizen)\b/,
  alt: /\b(?:alt|altbier)\b/,
  lager: /\b(?:export|lager|hell|helles)\b/,
};
const wineColors = {
  rot: /\b(?:rotwein|roter wein)\b/,
  weiss: /\b(?:weisswein|weisser wein)\b/,
  rose: /\b(?:rose|rosewein)\b/,
};
const wineTastes = {
  trocken: /\btrocken\b/,
  halbtrocken: /\bhalbtrocken\b/,
  lieblich: /\b(?:lieblich|suss|suess)\b/,
};
const carbonation = {
  sprudel: /\b(?:classic|sprudel|spritzig)\b/,
  medium: /\bmedium\b/,
  still: /\b(?:still|naturell)\b/,
};
const materials = {
  glas: /\b(?:glas|glasflasche|glasflaschen)\b/,
  pet: /\bpet\b/,
};

function matchesOnly(text: string, patterns: Record<string, RegExp>, selected: string): boolean {
  const matches = Object.entries(patterns).filter(([, pattern]) => pattern.test(text));
  return matches.length === 1 && matches[0][0] === selected;
}

/** Only explicit names in the sanitized catalog are evidence, never historical flyer copy.
 * Missing or ambiguous hard attributes return no match; they must not widen the selection.
 * The final occasion answer is context, not a documented product attribute.
 */
export function filterFinderProducts(products: readonly Product[], finder: FinderType, answers: readonly string[]): Product[] {
  if (!finder || !answers[0] || !answers[1]) return [];
  const [first, second] = answers;

  return products.filter(product => {
    const name = product.name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/ß/g, "ss");
    // An offer containing alternatives does not establish one variant with all selected attributes.
    if (/[/&]|\b(?:o|oder|und|or)\b|,\s*[a-z]/.test(name)) return false;

    if (finder === "bier") {
      if (product.categorySlug !== "bier" || !matchesOnly(name, beerStyles, first)) return false;
      if (second === "any") return true;
      const alcoholFree = /\balkoholfrei\b|(?:^|[^\w.,])0(?:[,.]0)?\s*%/.test(name);
      const alcohol = name.match(/\b(\d+(?:[,.]\d+)?)\s*%\s*vol\b/);
      const classic = !!alcohol && Number(alcohol[1].replace(",", ".")) > 0.5;
      if (second === "alcohol-free") return alcoholFree && !classic;
      if (second === "classic") return classic && !alcoholFree;
      return false;
    }

    if (finder === "wein") {
      if (first === "sekt") {
        if (product.categorySlug !== "sekt") return false;
      } else if (product.categorySlug !== "wein" || !matchesOnly(name, wineColors, first)) {
        return false;
      }
      // Grape names, brand names (e.g. Brut Dargent) and unbounded 'sec' are not taste evidence.
      return matchesOnly(name, wineTastes, second);
    }

    if (finder === "wasser") {
      if (product.categorySlug !== "alkoholfrei" || !/\b(?:mineralwasser|quellwasser|tafelwasser|trinkwasser)\b/.test(name)) return false;
      if (/\b(?:limonade|cola|tonic|tee|saft|energy|geschmack|aroma|zitrone|apfel)\b/.test(name)) return false;
      if (!matchesOnly(name, carbonation, first)) return false;
      return second === "egal" || matchesOnly(name, materials, second);
    }

    return false;
  });
}
