import { NextResponse } from "next/server";

import { isAuthorizedBearer } from "@/lib/cron-auth";
import {
  createHandzettelFallback,
  loadValidatedHandzettelCache,
  refreshHandzettelCache,
} from "@/lib/handzettel-catalog";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

function json(value: unknown, status = 200): NextResponse {
  return NextResponse.json(value, { status, headers: NO_STORE_HEADERS });
}

function authorizeRefresh(request: Request): NextResponse | null {
  if (!process.env.CRON_SECRET) {
    return json({ error: "Cron-Endpoint nicht konfiguriert (CRON_SECRET fehlt)." }, 503);
  }
  if (!isAuthorizedBearer(request)) return json({ error: "Unauthorized" }, 401);
  return null;
}

async function refresh(): Promise<NextResponse> {
  const now = new Date();
  try {
    return json(await refreshHandzettelCache(now));
  } catch {
    return json(
      createHandzettelFallback(
        now,
        "Der offizielle Handzettel konnte nicht sicher aktualisiert werden.",
      ),
      502,
    );
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  if (request.method !== "GET") {
    return new NextResponse(null, {
      status: 405,
      headers: { ...NO_STORE_HEADERS, Allow: "GET, POST" },
    });
  }
  const shouldRefresh = new URL(request.url).searchParams.get("refresh") === "true";
  if (!shouldRefresh) {
    const now = new Date();
    const cache = await loadValidatedHandzettelCache(now);
    return json(cache ?? createHandzettelFallback(now));
  }

  const denied = authorizeRefresh(request);
  if (denied) return denied;
  return refresh();
}

export async function POST(request: Request): Promise<NextResponse> {
  const denied = authorizeRefresh(request);
  if (denied) return denied;
  return refresh();
}
