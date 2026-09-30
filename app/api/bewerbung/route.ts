import { NextResponse } from "next/server";

export function POST(_request: Request) {
  return NextResponse.json({error: "Online-Uploads sind derzeit nicht verfügbar. Bitte kontaktiere uns per E-Mail an jammers-goch@trinkgut.de oder direkt im Markt."}, {status: 503, headers: {"Cache-Control": "no-store"}});
}
