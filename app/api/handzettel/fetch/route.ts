import { NextResponse } from "next/server";

import { isAuthorizedBearer } from "@/lib/cron-auth";
import { getWeeklyOfferContent } from "@/lib/weekly-offer-content";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";

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
  return json({error:"weekly-publication-required",message:"Handzettel werden ausschließlich als vollständig geprüftes lokales Wochenpaket veröffentlicht."},409);
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
    const content = await getWeeklyOfferContent(resolveHomepageNow());
    const flyer = content.flyers.find(item=>item.language==="de");
    if (!flyer) return json({status:"fallback",pageCount:0,pages:[],viewerUrl:null,pdfUrl:null,generatedAt:content.generatedAt,message:"Der nächste Handzettel wird vorbereitet."});
    // Only the cover is a verified page image. Never invent images for other pages.
    return json({...flyer,status:"ok",fetchedAt:content.generatedAt,pages:[{number:1,imageUrl:flyer.coverUrl,thumbnailUrl:flyer.coverUrl}]});
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
