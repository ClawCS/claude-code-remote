import { NextResponse } from "next/server";
export function POST(_request: Request) {
  return NextResponse.json({error:"Der Chat ist derzeit nicht verfügbar. Unser Team hilft dir persönlich unter 02823 418707 oder per WhatsApp."}, {status:503,headers:{"Cache-Control":"no-store"}});
}
