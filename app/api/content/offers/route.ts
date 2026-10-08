import { getWeeklyOfferContent } from "@/lib/weekly-offer-content";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await getWeeklyOfferContent(resolveHomepageNow()), {headers:{"Cache-Control":"no-store"}});
}
