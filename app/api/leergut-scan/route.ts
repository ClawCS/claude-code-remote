import { NextResponse } from "next/server";
export function POST(_request: Request) {
  return NextResponse.json({error:"Der Foto-Scan ist derzeit nicht verfügbar. Bitte nutze den manuellen Leergut-Rechner."}, {status:503,headers:{"Cache-Control":"no-store"}});
}
