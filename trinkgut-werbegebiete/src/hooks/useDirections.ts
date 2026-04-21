import { useEffect, useState } from "react";
import { haversineKm, estimateDriveFromHaversine } from "../utils/geo";
import { STORE_LOCATION, type LatLng } from "../data/publications";

type DirResult = {
  durationMin: number;
  drivingKm: number;
  source: "google" | "estimate";
};

type CacheEntry = DirResult & { ts: number };

const CACHE_KEY = "trinkgut-directions-cache";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function loadCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, CacheEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* quota exceeded, ignore */
  }
}

function keyFor(a: LatLng, b: LatLng): string {
  return `${a.lat.toFixed(4)},${a.lng.toFixed(4)}->${b.lat.toFixed(4)},${b.lng.toFixed(4)}`;
}

function estimateResult(origin: LatLng, dest: LatLng): DirResult {
  const dist = haversineKm(origin, dest);
  const { durationMin, drivingKm } = estimateDriveFromHaversine(dist);
  return { durationMin, drivingKm, source: "estimate" };
}

export async function fetchDirections(
  origin: LatLng,
  dest: LatLng,
): Promise<DirResult> {
  const cache = loadCache();
  const k = keyFor(origin, dest);
  const cached = cache[k];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached;
  }

  try {
    if (
      typeof google === "undefined" ||
      !google.maps ||
      !google.maps.DirectionsService
    ) {
      const est = estimateResult(origin, dest);
      cache[k] = { ...est, ts: Date.now() };
      saveCache(cache);
      return est;
    }

    const service = new google.maps.DirectionsService();
    const res = await service.route({
      origin,
      destination: dest,
      travelMode: google.maps.TravelMode.DRIVING,
      region: "de",
    });
    const leg = res.routes[0]?.legs[0];
    if (!leg || !leg.duration || !leg.distance) {
      throw new Error("Keine Route gefunden");
    }
    const result: DirResult = {
      durationMin: leg.duration.value / 60,
      drivingKm: leg.distance.value / 1000,
      source: "google",
    };
    cache[k] = { ...result, ts: Date.now() };
    saveCache(cache);
    return result;
  } catch {
    const est = estimateResult(origin, dest);
    cache[k] = { ...est, ts: Date.now() };
    saveCache(cache);
    return est;
  }
}

export function useDirections(
  dest: LatLng | null,
  origin: LatLng = STORE_LOCATION,
) {
  const [data, setData] = useState<DirResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dest) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchDirections(origin, dest)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dest?.lat, dest?.lng, origin.lat, origin.lng]);

  return { data, loading };
}

export function clearDirectionsCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
