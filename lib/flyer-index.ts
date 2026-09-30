import { loadFlyerPackages, selectActiveFlyerPackages } from "@/lib/flyer-packages";
import { loadValidatedHandzettelCache } from "@/lib/handzettel-catalog";
import { mapFlyerPackageToFlyer, mapHandzettelCacheToFlyer, type HomepageFlyer } from "@/lib/homepage-content";
import { berlinDateKey, getCurrentWeekRange } from "@/lib/editorial-schedule";

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
  if (!official && today <= getCurrentWeekRange(now).validTo) issues.push("official-flyer-missing");
  const flyers: (HomepageFlyer & {language:"de" | "nl"})[] = [];
  if (official) flyers.push({...mapHandzettelCacheToFlyer(official),language:"de"});
  for (const item of selectActiveFlyerPackages(packages, now)) {
    if (item.language === "de" && official) continue;
    flyers.push({...mapFlyerPackageToFlyer(item),language:item.language});
  }
  return {status:issues.length ? "degraded" : "ok",issues,generatedAt:now.toISOString(),flyers,scheduled: packages.filter((p)=>p.validFrom>today).map(({id,title,language,validFrom,validTo})=>({id,title,language,validFrom,validTo}))};
}
