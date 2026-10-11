import { getWeeklyOfferContent } from "@/lib/weekly-offer-content";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
import { projectLegacyOfferContent } from "@/lib/weekly-offer-refresh";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const content = await getWeeklyOfferContent(resolveHomepageNow());
  return Response.json(request.headers.get("X-Jammers-Content-Version") === "2" ? content : projectLegacyOfferContent(content), {headers:{"Cache-Control":"no-store", "Vary":"X-Jammers-Content-Version"}});
}
