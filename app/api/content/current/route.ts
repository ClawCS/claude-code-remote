import { NextResponse } from "next/server";

import { getHomepageContent } from "@/lib/homepage-content";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(await getHomepageContent(), {
    headers: { "Cache-Control": "no-store" },
  });
}
