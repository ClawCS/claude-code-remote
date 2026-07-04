import { NextResponse } from "next/server";
import { isAuthorizedBearer } from "@/lib/cron-auth";

/**
 * Cron-Endpoint für wöchentliche Handzettel-Aktualisierung.
 *
 * Aufruf: Jeden Sonntag um 16:00 Uhr (neuer Handzettel von trinkgut.de übernehmen).
 *
 * Hetzner-VPS: crontab -> 0 16 * * 0 curl -X POST https://trinkgut-jammers.de/api/handzettel/cron -H "Authorization: Bearer $CRON_SECRET"
 *
 * SICHERHEIT: CRON_SECRET MUSS gesetzt sein, sonst gibt der Endpoint 503 zurück.
 * Der Vergleich ist timing-sicher (siehe lib/cron-auth.ts).
 */

const CRON_SECRET = process.env.CRON_SECRET;

function authorize(request: Request): NextResponse | null {
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: "Cron-Endpoint nicht konfiguriert (CRON_SECRET fehlt)." },
      { status: 503 }
    );
  }
  if (!isAuthorizedBearer(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;
  return runUpdate(request);
}

export async function POST(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;
  return runUpdate(request);
}

async function runUpdate(request: Request) {
  const baseUrl = new URL(request.url).origin;

  try {
    // 1. Alten Cache loeschen und neu abrufen — das eigene CRON_SECRET
    //    weiterreichen, da der refresh=true-Endpoint jetzt authentifiziert ist.
    const fetchRes = await fetch(`${baseUrl}/api/handzettel/fetch?refresh=true`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CRON_SECRET}`,
      },
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
