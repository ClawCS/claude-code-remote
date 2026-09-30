import { NextResponse } from "next/server";

// Public IDs did not prove ownership in the former points system.
export function GET() {
  return NextResponse.json({leaderboard: [], totalPlayers: 0, winners: [], user: null, available: false}, {headers: {"Cache-Control": "no-store"}});
}
export function POST(_request: Request) {
  return NextResponse.json({error: "Die Punktefunktion ist derzeit nicht verfügbar. Unsere Community findest du auf Instagram."}, {status: 503, headers: {"Cache-Control": "no-store"}});
}
