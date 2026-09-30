import { loadFlyerPackages, selectActiveFlyerPackages, selectWeeklyNlFlyer } from "@/lib/flyer-packages";
import { loadValidatedHandzettelCache } from "@/lib/handzettel-catalog";
import { mapFlyerPackageToFlyer, mapHandzettelCacheToFlyer, type HomepageFlyer } from "@/lib/homepage-content";
import { berlinDateKey, getCurrentWeekRange } from "@/lib/editorial-schedule";
import { getOfferDemandRange } from "@/lib/offer-validity";

export type FlyerIndex = Readonly<{
  status: "ok" | "degraded";
  issues: readonly string[];
  generatedAt: string;
  flyers: readonly (HomepageFlyer & {language: "de" | "nl"})[];
  scheduled: readonly {id: string; title: string; language: "de" | "nl"; validFrom: string; validTo: string}[];
}>;

export async function getFlyerIndex(now = new Date()): Promise<FlyerIndex> {
  const issues:string[]=[];
  const [official, packages] = await Promise.all([loadValidatedHandzettelCache(now), loadFlyerPackages().catch(() => {
    issues.push("local-flyer-integrity");
    console.error("Lokale Flyerpakete konnten nicht validiert werden; betroffene Inhalte bleiben zurückgehalten.");
    return [];
  })]);
  const today = berlinDateKey(now);
  const range = getCurrentWeekRange(now);
  const activePackages = selectActiveFlyerPackages(packages, now);
  const nlFlyer = selectWeeklyNlFlyer(activePackages, range);
  const offersRequired = today <= getOfferDemandRange(range).validTo;
  if (!official && offersRequired) issues.push("official-flyer-missing");
  if (!nlFlyer && offersRequired) issues.push("nl-flyer-missing");
  const flyers: (HomepageFlyer & {language:"de" | "nl"})[] = [];
  if (official) flyers.push({...mapHandzettelCacheToFlyer(official),language:"de"});
  for (const item of activePackages) {
    if (item.language === "de" && official) continue;
    if (item.language === "nl" && item.id !== nlFlyer?.id) continue;
    flyers.push({...mapFlyerPackageToFlyer(item),language:item.language});
  }
  return {status:issues.length ? "degraded" : "ok",issues,generatedAt:now.toISOString(),flyers,scheduled: packages.filter((p)=>p.validFrom>today).map(({id,title,language,validFrom,validTo})=>({id,title,language,validFrom,validTo}))};
}
