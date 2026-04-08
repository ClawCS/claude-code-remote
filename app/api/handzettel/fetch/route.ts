import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const TRINKGUT_CATALOG_URL =
  "https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest";
const BASE_URL = "https://werbung.trinkgut.de";
const CACHE_FILE = path.join(process.cwd(), "data", "handzettel-cache.json");
const WERBEKREIS = "3.6";
const STORE_ID = "13027";

/**
 * Plattform: Blaetterkatalog (blaetterkatalog.de) von COMINTO GmbH
 *
 * URL-Muster:
 *   Viewer:    /frontend/mvc/catalog/by-name/{storeId}/newest
 *   PDF:       /frontend/catalogs/{catalogId}/{version}/pdf/complete.pdf
 *   Seite PDF: /frontend/catalogs/{catalogId}/{version}/pdf/save/bk_{page}.pdf
 *   Seite Bild: Wird aus dem HTML/JS des Viewers extrahiert
 *
 * Wichtig: Die by-name ID (13027) ist NICHT die catalogId.
 *   13027 = persistente Store/Gruppen-ID fuer Werbekreis 3.6
 *   catalogId = spezifische Publikations-ID (z.B. 1212347)
 */

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
  catalogVersion: string;
  storeId: string;
  werbekreis: string;
  kw: number;
  year: number;
  weekStart: string;
  weekEnd: string;
  fetchedAt: string;
  viewerUrl: string;
  pdfUrl: string;
  pageCount: number;
  pages: HandzettelPage[];
  status: "ok" | "fallback";
};

/** Cache laden */
async function loadCache(): Promise<HandzettelCache | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!data.kw || data.kw === 0) return null;
    return data;
  } catch {
    return null;
  }
}

/** Cache speichern */
async function saveCache(data: HandzettelCache): Promise<void> {
  await fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
};

/**
 * Hauptlogik: Trinkgut-Katalog vom Blaetterkatalog-System abrufen.
 */
async function fetchCatalog(): Promise<HandzettelCache> {
  const now = new Date();
  const kw = getISOWeek(now);
  const { weekStart, weekEnd } = getWeekRange(now);

  const baseResult = {
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
    // Schritt 1: Viewer-Seite abrufen (Redirect folgen)
    const res = await fetch(TRINKGUT_CATALOG_URL, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();
    const finalUrl = res.url;

    // Schritt 2: catalogId und Version aus HTML/URL extrahieren
    const catalogInfo = extractCatalogInfo(finalUrl, html);

    if (!catalogInfo.catalogId) {
      throw new Error("Katalog-ID konnte nicht extrahiert werden");
    }

    const { catalogId, version } = catalogInfo;

    // Schritt 3: Seitenanzahl ermitteln
    const pageCount = await detectPageCount(catalogId, version, html);

    // Schritt 4: Seiten-URLs generieren (Blaetterkatalog-Muster)
    const pages: HandzettelPage[] = [];
    for (let i = 1; i <= pageCount; i++) {
      pages.push({
        number: i,
        // Blaetterkatalog Seiten-Bild URL-Muster
        imageUrl: `${BASE_URL}/frontend/catalogs/${catalogId}/${version}/pages/${i}/zoom/0`,
        thumbnailUrl: `${BASE_URL}/frontend/catalogs/${catalogId}/${version}/pages/${i}/normal`,
      });
    }

    // PDF-URL
    const pdfUrl = `${BASE_URL}/frontend/catalogs/${catalogId}/${version}/pdf/complete.pdf`;

    return {
      ...baseResult,
      catalogId,
      catalogVersion: version,
      pdfUrl,
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
      catalogVersion: "1",
      pdfUrl: "",
      pageCount: 0,
      pages: [],
      status: "fallback",
    };
  }
}

/**
 * Katalog-ID und Version aus der Blaetterkatalog-Seite extrahieren.
 *
 * Bekannte Muster im HTML/JS:
 *   - /frontend/catalogs/{catalogId}/{version}/
 *   - catalogId: 1212347 (7-stellig)
 *   - version: 1-9 (einstellig)
 */
function extractCatalogInfo(
  url: string,
  html: string
): { catalogId: string; version: string } {
  // Muster 1: URL-Pfad /frontend/catalogs/{id}/{ver}/
  const catalogsPattern = /\/frontend\/catalogs\/(\d{5,8})\/(\d{1,2})\//;

  // Aus URL pruefen
  const urlMatch = url.match(catalogsPattern);
  if (urlMatch) {
    return { catalogId: urlMatch[1], version: urlMatch[2] };
  }

  // Aus HTML/JS pruefen
  const htmlMatch = html.match(catalogsPattern);
  if (htmlMatch) {
    return { catalogId: htmlMatch[1], version: htmlMatch[2] };
  }

  // Muster 2: JSON-Config im HTML
  const jsonPatterns = [
    /"catalogId"\s*:\s*"?(\d{5,8})"?/,
    /"id"\s*:\s*(\d{5,8})\b/,
    /catalogId\s*=\s*"?(\d{5,8})"?/,
    /data-catalog-id="(\d{5,8})"/,
  ];
  for (const p of jsonPatterns) {
    const m = html.match(p);
    if (m) {
      // Version versuchen zu finden
      const vMatch = html.match(/"version"\s*:\s*"?(\d{1,2})"?/);
      return { catalogId: m[1], version: vMatch ? vMatch[1] : "1" };
    }
  }

  // Muster 3: Aus der finalen URL nach Redirect
  // z.B. /frontend/mvc/catalog/{catalogId}?...
  const mvcMatch = url.match(/\/frontend\/mvc\/catalog\/(\d{5,8})\b/);
  if (mvcMatch) {
    return { catalogId: mvcMatch[1], version: "1" };
  }

  // Muster 4: Alle Zahlen im 5-8-stelligen Bereich aus dem HTML suchen
  // die im Kontext von "catalogs" oder "catalog" stehen
  const contextMatch = html.match(/catalog[s"]?\W{0,5}(\d{5,8})/i);
  if (contextMatch) {
    return { catalogId: contextMatch[1], version: "1" };
  }

  return { catalogId: "", version: "1" };
}

/**
 * Seitenanzahl des Katalogs ermitteln.
 * Versucht mehrere Strategien.
 */
async function detectPageCount(
  catalogId: string,
  version: string,
  html: string
): Promise<number> {
  // Strategie 1: Aus HTML extrahieren
  const htmlPatterns = [
    /["']?pageCount["']?\s*:\s*(\d+)/,
    /["']?numberOfPages["']?\s*:\s*(\d+)/,
    /["']?totalPages["']?\s*:\s*(\d+)/,
    /["']?numPages["']?\s*:\s*(\d+)/,
    /data-page-count="(\d+)"/,
    /pages\s*:\s*\[([^\]]+)\]/,
  ];
  for (const p of htmlPatterns) {
    const m = html.match(p);
    if (m) {
      // Fuer Array-Match: Elemente zaehlen
      if (m[1].includes(",")) {
        return m[1].split(",").length;
      }
      const num = parseInt(m[1], 10);
      if (num > 0 && num < 100) return num;
    }
  }

  // Strategie 2: Einzelne Seiten-PDFs testen (Blaetterkatalog-Muster)
  let count = 0;
  for (let i = 1; i <= 40; i++) {
    try {
      const pageUrl = `${BASE_URL}/frontend/catalogs/${catalogId}/${version}/pdf/save/bk_${i}.pdf`;
      const pageRes = await fetch(pageUrl, {
        method: "HEAD",
        headers: BROWSER_HEADERS,
      });
      if (pageRes.ok) {
        count = i;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  if (count > 0) return count;

  // Strategie 3: Seiten-Bilder testen
  for (let i = 1; i <= 40; i++) {
    try {
      const imgUrl = `${BASE_URL}/frontend/catalogs/${catalogId}/${version}/pages/${i}/normal`;
      const imgRes = await fetch(imgUrl, {
        method: "HEAD",
        headers: BROWSER_HEADERS,
      });
      if (imgRes.ok) {
        count = i;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  if (count > 0) return count;

  // Standard-Fallback: Trinkgut-Handzettel hat typischerweise 24 Seiten
  return 24;
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
