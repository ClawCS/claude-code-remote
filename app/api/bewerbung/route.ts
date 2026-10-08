import { NextResponse } from "next/server";
import { APPLICATION_EMAIL } from "@/lib/application-contact";

export function POST(_request: Request) {
  return NextResponse.json({error: `Online-Uploads sind derzeit nicht verfügbar. Bitte kontaktiere uns per E-Mail an ${APPLICATION_EMAIL} oder direkt im Markt.`}, {status: 503, headers: {"Cache-Control": "no-store"}});
}
