import { NextResponse } from "next/server";
export function POST(_request: Request) {
  return NextResponse.json({error:"Die Bildanalyse ist derzeit nicht verfügbar. Es werden keine Bilder zur Analyse an externe Anbieter übermittelt."}, {status:503,headers:{"Cache-Control":"no-store"}});
}
