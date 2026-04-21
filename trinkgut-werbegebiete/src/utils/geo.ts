import type { City, Publication } from "../data/publications";
import { STORE } from "../data/publications";

const R_EARTH_KM = 6371;

/** Haversine-Distanz in km zwischen zwei lat/lng Paaren */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH_KM * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Fallback-Fahrdistanz-Schaetzung wenn Directions API nicht verfuegbar:
 * Haversine * 1.3 (typischer Strassenfaktor in NL/DE)
 */
export function estimateRoadKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  return haversineKm(from, to) * 1.3;
}

/**
 * Fallback-Fahrzeit-Schaetzung in Minuten:
 * Durchschnitt 65 km/h auf NL/DE Landstrassen inkl. Ortsdurchfahrten
 */
export function estimateDriveMinutes(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  return (estimateRoadKm(from, to) / 65) * 60;
}

/** Findet die naechste Stadt (Luftlinie) einer Publikation zum Store */
export function nearestCityToStore(pub: Publication): City {
  return pub.cities.reduce((best, c) =>
    haversineKm({ lat: STORE.lat, lng: STORE.lng }, c) <
    haversineKm({ lat: STORE.lat, lng: STORE.lng }, best)
      ? c
      : best,
  );
}

/** Welche Publikationen decken eine gegebene Koordinate grob ab? */
export function publicationsCoveringPoint(
  pubs: Publication[],
  point: { lat: number; lng: number },
  /** Radius in km um jeder Stadt */
  radiusKm = 6,
): Publication[] {
  return pubs.filter((p) =>
    p.cities.some((c) => haversineKm(c, point) <= radiusKm),
  );
}

/** Formatiert eine Minutenzahl als "23 min" bzw. "1 h 15 min" */
export function formatMinutes(min: number): string {
  const rounded = Math.round(min);
  if (rounded < 60) return `${rounded} min`;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Formatiert eine Kilometerzahl */
export function formatKm(km: number): string {
  return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

/** Formatiert eine Auflage als "66k" oder "148k" */
export function formatCirculation(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

/** Formatiert Euro-Betrag */
export function formatEuro(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}
