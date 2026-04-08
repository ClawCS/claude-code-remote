import { NextResponse } from "next/server";

/**
 * Cron-Endpoint fuer wöchentliche Handzettel-Aktualisierung.
 *
 * Aufruf: Jeden Sonntag um 17:00 Uhr
 *
 * Fuer Vercel: vercel.json -> "crons": [{ "path": "/api/handzettel/cron", "schedule": "0 17 * * 0" }]
 * Fuer VPS: crontab -> 0 17 * * 0 curl -X POST https://deine-domain.de/api/handzettel/cron
 * Fuer externe Dienste: cron-job.org, EasyCron, etc.
 */

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Optionaler Schutz via Secret
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return runUpdate(request);
}

export async function POST(request: Request) {
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return runUpdate(request);
}

async function runUpdate(request: Request) {
  const baseUrl = new URL(request.url).origin;

  try {
    // 1. Alten Cache loeschen und neu abrufen
    const fetchRes = await fetch(`${baseUrl}/api/handzettel/fetch?refresh=true`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!fetchRes.ok) {
      throw new Error(`Fetch fehlgeschlagen: ${fetchRes.status}`);
    }

    const data = await fetchRes.json();

    return NextResponse.json({
      success: true,
      message: `Handzettel KW ${data.kw} erfolgreich aktualisiert`,
      timestamp: new Date().toISOString(),
      kw: data.kw,
      pageCount: data.pageCount,
      status: data.status,
    });
  } catch (error) {
    console.error("[Handzettel Cron] Fehler:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
