import { NextResponse } from "next/server";

import { getHomepageContent } from "@/lib/homepage-content";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(await getHomepageContent(resolveHomepageNow()), {
    headers: { "Cache-Control": "no-store" },
  });
}
