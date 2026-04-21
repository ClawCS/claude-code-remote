import { useEffect, useRef, useState } from "react";
import { estimateDriveMinutes, estimateRoadKm } from "../utils/geo";
import { STORE } from "../data/publications";
import { loadGoogleMaps } from "./useGoogleMaps";

export interface DriveInfo {
  /** Minuten */
  durationMin: number;
  /** Kilometer */
  distanceKm: number;
  /** true = kam aus Cache */
  cached: boolean;
  /** true = Fallback-Schaetzung (keine API) */
  estimated: boolean;
}

interface CacheEntry extends DriveInfo {
  ts: number;
}

const CACHE_KEY = "trinkgut_directions_cache_v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 Tage

function loadCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, CacheEntry>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

function cacheKey(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): string {
  const f = `${from.lat.toFixed(4)},${from.lng.toFixed(4)}`;
  const t = `${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
  return `${f}|${t}`;
}

/**
 * Berechnet Fahrzeit + Distanz von Goch zu einem Zielpunkt.
 * Nutzt Google Directions API mit localStorage-Cache.
 * Fallt bei Fehler auf Haversine-Schaetzung zurueck.
 */
export async function getDriveInfo(
  to: { lat: number; lng: number },
  from: { lat: number; lng: number } = { lat: STORE.lat, lng: STORE.lng },
): Promise<DriveInfo> {
  const cache = loadCache();
  const key = cacheKey(from, to);
  const now = Date.now();
  const hit = cache[key];
  if (hit && now - hit.ts < CACHE_TTL_MS && !hit.estimated) {
    return { ...hit, cached: true };
  }

  const googlePromise = loadGoogleMaps();
  if (!googlePromise) {
    return fallback(from, to);
  }
  try {
    const g = await googlePromise;
    const service = new g.maps.DirectionsService();
    const result = await service.route({
      origin: from,
      destination: to,
      travelMode: g.maps.TravelMode.DRIVING,
      region: "DE",
    });
    const route = result.routes[0];
    const leg = route?.legs[0];
    if (!leg || !leg.duration || !leg.distance) return fallback(from, to);
    const info: DriveInfo = {
      durationMin: leg.duration.value / 60,
      distanceKm: leg.distance.value / 1000,
      cached: false,
      estimated: false,
    };
    cache[key] = { ...info, ts: now };
    saveCache(cache);
    return info;
  } catch {
    return fallback(from, to);
  }
}

function fallback(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): DriveInfo {
  return {
    durationMin: estimateDriveMinutes(from, to),
    distanceKm: estimateRoadKm(from, to),
    cached: false,
    estimated: true,
  };
}

/** Hook-Variante: liefert reaktiv DriveInfo fuer einen Zielpunkt */
export function useDriveInfo(to: { lat: number; lng: number } | null): {
  info: DriveInfo | null;
  loading: boolean;
  error: string | null;
} {
  const [info, setInfo] = useState<DriveInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!to) {
      setInfo(null);
      return;
    }
    const key = `${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDriveInfo(to)
      .then((i) => {
        if (cancelled) return;
        setInfo(i);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [to]);

  return { info, loading, error };
}

/** Bulk-Variante: laedt Drive-Infos fuer viele Punkte mit Throttling */
export function useBulkDriveInfo(points: Array<{ id: string; lat: number; lng: number }>): {
  infos: Record<string, DriveInfo>;
  loading: boolean;
} {
  const [infos, setInfos] = useState<Record<string, DriveInfo>>({});
  const [loading, setLoading] = useState(false);
  const signature = points.map((p) => `${p.id}:${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join("|");

  useEffect(() => {
    if (points.length === 0) return;
    let cancelled = false;
    setLoading(true);
    const acc: Record<string, DriveInfo> = {};
    (async () => {
      for (const p of points) {
        if (cancelled) return;
        try {
          const info = await getDriveInfo({ lat: p.lat, lng: p.lng });
          acc[p.id] = info;
          setInfos((prev) => ({ ...prev, [p.id]: info }));
          if (!info.cached) {
            // leichtes Throttling zwischen nicht-gecachten Calls
            await new Promise((r) => setTimeout(r, 80));
          }
        } catch {
          /* skip */
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { infos, loading };
}

export function clearDirectionsCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
