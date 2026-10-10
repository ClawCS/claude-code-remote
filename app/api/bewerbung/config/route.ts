import { APPLICATION_FALLBACK } from "@/lib/applications-client";
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(APPLICATION_FALLBACK, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow, noarchive" } });
}
