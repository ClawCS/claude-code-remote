import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const TRINKGUT_CATALOG_URL =
  "https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest";
const CACHE_FILE = path.join(process.cwd(), "data", "handzettel-cache.json");
const WERBEKREIS = "3.6";
const STORE_ID = "13027";

/** ISO-Kalenderwoche berechnen */
function getISOWeek(date: Date): number {
  const tmp = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Montag und Samstag der aktuellen Woche */
function getWeekRange(date: Date) {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { weekStart: fmt(monday), weekEnd: fmt(saturday) };
}

export type HandzettelPage = {
  number: number;
  imageUrl: string;
  thumbnailUrl: string;
};

export type HandzettelCache = {
  catalogId: string;
  storeId: string;
  werbekreis: string;
  kw: number;
  year: number;
  weekStart: string;
  weekEnd: string;
  fetchedAt: string;
  viewerUrl: string;
  pageCount: number;
  pages: HandzettelPage[];
  status: "ok" | "fallback";
};

/** Cache laden */
async function loadCache(): Promise<HandzettelCache | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Cache speichern */
async function saveCache(data: HandzettelCache): Promise<void> {
  await fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Hauptlogik: Trinkgut-Katalog abrufen und Seiten-URLs extrahieren.
 *
 * MEDIA Central / Offerista Katalog-Viewer Muster:
 *   1. /frontend/mvc/catalog/by-name/{storeId}/newest -> Redirect oder HTML mit Katalog-ID
 *   2. Katalog-ID aus URL oder HTML extrahieren
 *   3. Seiten-Bilder: /frontend/mvc/catalog/{catalogId}/page/{num}?width=800
 */
async function fetchCatalog(): Promise<HandzettelCache> {
  const now = new Date();
  const kw = getISOWeek(now);
  const { weekStart, weekEnd } = getWeekRange(now);

  const baseResult: Omit<HandzettelCache, "catalogId" | "pageCount" | "pages" | "status"> = {
    storeId: STORE_ID,
    werbekreis: WERBEKREIS,
    kw,
    year: now.getFullYear(),
    weekStart,
    weekEnd,
    fetchedAt: now.toISOString(),
    viewerUrl: TRINKGUT_CATALOG_URL,
  };

  try {
    // Schritt 1: Katalog-URL abrufen (Redirect folgen)
    const res = await fetch(TRINKGUT_CATALOG_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();
    const finalUrl = res.url;

    // Schritt 2: Katalog-ID extrahieren
    let catalogId = extractCatalogId(finalUrl, html);

    if (!catalogId) {
      // Fallback: ID aus dem URL-Pfad
      const urlMatch = finalUrl.match(/\/catalog\/(\d+)/);
      if (urlMatch) catalogId = urlMatch[1];
    }

    if (!catalogId) {
      throw new Error("Katalog-ID konnte nicht extrahiert werden");
    }

    // Schritt 3: Seitenanzahl ermitteln
    const pageCount = await fetchPageCount(catalogId, html);

    // Schritt 4: Seiten-URLs generieren
    const baseUrl = "https://werbung.trinkgut.de";
    const pages: HandzettelPage[] = [];
    for (let i = 1; i <= pageCount; i++) {
      pages.push({
        number: i,
        imageUrl: `${baseUrl}/frontend/mvc/catalog/${catalogId}/page/${i}?width=1200`,
        thumbnailUrl: `${baseUrl}/frontend/mvc/catalog/${catalogId}/page/${i}?width=300`,
      });
    }

    return {
      ...baseResult,
      catalogId,
      pageCount,
      pages,
      status: "ok",
    };
  } catch (error) {
    console.error("[Handzettel] Fehler beim Abrufen:", error);

    // Fallback: Viewer-URL bereitstellen fuer iframe-Embedding
    return {
      ...baseResult,
      catalogId: "unknown",
      pageCount: 0,
      pages: [],
      status: "fallback",
    };
  }
}

/** Katalog-ID aus URL oder HTML extrahieren */
function extractCatalogId(url: string, html: string): string | null {
  // Muster 1: URL enthaelt /catalog/{id}
  const urlPatterns = [
    /\/catalog\/(\d+)/,
    /catalogId[=:][\s"']*(\d+)/,
  ];
  for (const p of urlPatterns) {
    const m = url.match(p);
    if (m) return m[1];
  }

  // Muster 2: HTML/JS-Variablen
  const htmlPatterns = [
    /["']catalogId["']\s*:\s*["']?(\d+)["']?/,
    /data-catalog-id=["'](\d+)["']/,
    /catalogId\s*=\s*["']?(\d+)["']?/,
    /catalog[_-]?id["']\s*:\s*(\d+)/i,
    /\/catalog\/(\d+)\/page/,
    /"id"\s*:\s*(\d+).*?"type"\s*:\s*"catalog"/,
  ];
  for (const p of htmlPatterns) {
    const m = html.match(p);
    if (m) return m[1];
  }

  return null;
}

/** Seitenanzahl ermitteln */
async function fetchPageCount(catalogId: string, html: string): Promise<number> {
  // Muster 1: Aus HTML extrahieren
  const htmlPatterns = [
    /["']?pageCount["']?\s*:\s*(\d+)/,
    /["']?numberOfPages["']?\s*:\s*(\d+)/,
    /["']?pages["']?\s*:\s*(\d+)/,
    /["']?totalPages["']?\s*:\s*(\d+)/,
    /data-page-count=["'](\d+)["']/,
  ];
  for (const p of htmlPatterns) {
    const m = html.match(p);
    if (m) return parseInt(m[1], 10);
  }

  // Muster 2: API-Aufruf fuer Katalog-Metadaten
  try {
    const metaRes = await fetch(
      `https://werbung.trinkgut.de/frontend/mvc/catalog/${catalogId}`,
      {
        headers: {
          Accept: "application/json, text/html",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );
    if (metaRes.ok) {
      const text = await metaRes.text();
      // JSON-Antwort
      try {
        const json = JSON.parse(text);
        if (json.pageCount) return json.pageCount;
        if (json.numberOfPages) return json.numberOfPages;
        if (json.pages && Array.isArray(json.pages)) return json.pages.length;
      } catch {
        // HTML-Antwort parsen
        for (const p of htmlPatterns) {
          const m = text.match(p);
          if (m) return parseInt(m[1], 10);
        }
      }
    }
  } catch {
    // Ignorieren
  }

  // Muster 3: Binary Search - Seiten testen bis 404
  let count = 0;
  for (let i = 1; i <= 40; i++) {
    try {
      const pageRes = await fetch(
        `https://werbung.trinkgut.de/frontend/mvc/catalog/${catalogId}/page/${i}?width=100`,
        { method: "HEAD" }
      );
      if (pageRes.ok) {
        count = i;
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  return count > 0 ? count : 24; // Standard: 24 Seiten
}

// === API-Handler ===

/** GET: Cache zurueckgeben oder neu abrufen */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  const cache = await loadCache();
  const now = new Date();
  const currentKw = getISOWeek(now);

  // Cache verwenden wenn aktuell (gleiche KW) und kein Force-Refresh
  if (cache && cache.kw === currentKw && cache.year === now.getFullYear() && !forceRefresh) {
    return NextResponse.json(cache);
  }

  // Neu abrufen
  const data = await fetchCatalog();
  await saveCache(data);

  return NextResponse.json(data);
}

/** POST: Manuelles Update erzwingen */
export async function POST() {
  const data = await fetchCatalog();
  await saveCache(data);

  return NextResponse.json({
    success: true,
    message: `Handzettel KW ${data.kw} aktualisiert`,
    data,
  });
}
