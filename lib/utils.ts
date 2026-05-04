/**
 * Berechnet die Anzahl der Werktage (Mo-Sa) zwischen zwei Daten (inklusive Start- und Endtag).
 * Samstag zählt als Werktag! Nur Sonntag ist frei.
 */
export function calculateWorkdays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return 0;

  let workdays = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    // Nur Sonntag (0) ist KEIN Werktag. Mo-Sa (1-6) zählen.
    if (day !== 0) {
      workdays++;
    }
    current.setDate(current.getDate() + 1);
  }
  return workdays;
}

/**
 * Berechnet die Leihgebühr basierend auf der 3-Werktage-Regel.
 * Erste 3 Werktage = 1x Grundgebühr, danach je 3 weitere Werktage = erneut Grundgebühr.
 * Formel: Math.ceil(werktage / 3) * grundpreis
 */
export function calculateRentalPrice(basePrice: number, workdays: number): number {
  if (workdays <= 0) return basePrice;
  const periods = Math.ceil(workdays / 3);
  return periods * basePrice;
}

/**
 * Gibt die Anzahl der Leihperioden zurueck.
 */
export function calculateRentalPeriods(workdays: number): number {
  if (workdays <= 0) return 1;
  return Math.ceil(workdays / 3);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  category: string;
  categorySlug: string;
  description: string;
  ean?: string;
  image: string;
  unit: string;
  inStock: boolean;
  highlight?: boolean;
};

export type Category = {
  name: string;
  slug: string;
  icon: string;
  color: string;
  gradient: string;
  image: string;
};

export const categories: Category[] = [
  { name: "Bier", slug: "bier", icon: "🍺", color: "bg-amber-100 text-amber-800", gradient: "from-amber-500 via-amber-600 to-amber-800", image: "/images/kategorien/Bier.jpg" },
  { name: "Alkoholfreie Getränke", slug: "alkoholfrei", icon: "🥤", color: "bg-green-100 text-green-800", gradient: "from-emerald-500 via-emerald-600 to-emerald-800", image: "/images/kategorien/Alkoholfreie Getränke.jpg" },
  { name: "Wein", slug: "wein", icon: "🍷", color: "bg-purple-100 text-purple-800", gradient: "from-purple-600 via-purple-700 to-purple-900", image: "/images/kategorien/Wein.jpg" },
  { name: "Sekt & Co.", slug: "sekt", icon: "🥂", color: "bg-pink-100 text-pink-800", gradient: "from-pink-400 via-pink-500 to-rose-700", image: "/images/kategorien/Sekt & Co..jpg" },
  { name: "Spirituosen", slug: "spirituosen", icon: "🥃", color: "bg-orange-100 text-orange-800", gradient: "from-orange-600 via-orange-700 to-orange-900", image: "/images/kategorien/Spirituosen.jpg" },
  { name: "Lebensmittel & Mehr", slug: "lebensmittel", icon: "🛒", color: "bg-yellow-100 text-yellow-800", gradient: "from-yellow-500 via-yellow-600 to-yellow-800", image: "/images/kategorien/Lebenmittel & Mehr.jpg" },
];
