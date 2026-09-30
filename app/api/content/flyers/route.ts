import { getFlyerIndex } from "@/lib/flyer-index";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await getFlyerIndex(resolveHomepageNow()), {headers:{"Cache-Control":"no-store"}});
}
