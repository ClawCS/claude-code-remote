import { loadWeeklyPublications } from "./weekly-publication";
import { createWeeklyOfferContentLoader } from "./weekly-offer-content";
import type { PublicFlyer } from "./weekly-publication-types";
import type { LoadedWeeklyPublications } from "./weekly-publication-types";
import { berlinDateKey } from "./editorial-schedule";
export type FlyerIndex = Readonly<{
  status: "ok" | "degraded"; issues: readonly string[]; generatedAt: string;
  flyers: readonly PublicFlyer[];
  scheduled: readonly {id:string; title:string; language:"de"|"nl"; validFrom:string; validTo:string}[];
}>;
export async function getFlyerIndex(now = new Date()): Promise<FlyerIndex> {
  const loaded:LoadedWeeklyPublications = await loadWeeklyPublications().catch(() => ({editions:[],issues:[{week:null,code:"week-invalid"}]}));
  const content = await createWeeklyOfferContentLoader(async () => loaded)(now);
  const today = berlinDateKey(now);
  const scheduled = loaded.issues.some(issue => issue.week === null) ? [] : loaded.editions
    .filter(({edition}) => edition.validFrom > today && !loaded.issues.some(issue => issue.week === edition.validFrom && (!issue.language || issue.language === edition.language)))
    .map(({edition:{id,title,language,validFrom,validTo}}) => ({id,title,language,validFrom,validTo}));
  return {status:content.status,issues:content.issues,generatedAt:content.generatedAt,flyers:content.flyers,scheduled};
}
