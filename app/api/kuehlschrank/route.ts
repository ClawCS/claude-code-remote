import { NextResponse } from "next/server";
export function POST(_request: Request) {
  return NextResponse.json({error:"Die KI-Bildanalyse ist derzeit nicht verfügbar. Es werden keine Bilder an einen KI-Anbieter übermittelt."}, {status:503,headers:{"Cache-Control":"no-store"}});
}
