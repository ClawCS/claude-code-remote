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
  image: string;
};

export const categories: Category[] = [
  { name: "Bier", slug: "bier", icon: "🍺", color: "bg-amber-100 text-amber-800", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop" },
  { name: "Alkoholfreie Getränke", slug: "alkoholfrei", icon: "🥤", color: "bg-green-100 text-green-800", image: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop" },
  { name: "Wein", slug: "wein", icon: "🍷", color: "bg-purple-100 text-purple-800", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop" },
  { name: "Sekt & Co.", slug: "sekt", icon: "🥂", color: "bg-pink-100 text-pink-800", image: "https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=400&h=400&fit=crop" },
  { name: "Spirituosen", slug: "spirituosen", icon: "🥃", color: "bg-orange-100 text-orange-800", image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop" },
  { name: "Lebensmittel & Mehr", slug: "lebensmittel", icon: "🛒", color: "bg-yellow-100 text-yellow-800", image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop" },
];
