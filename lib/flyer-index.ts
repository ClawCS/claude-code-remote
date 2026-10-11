import { loadWeeklyPublications } from "./weekly-publication";
import { selectWeeklyOfferContent } from "./weekly-offer-selection";
import { loadSupplementalPublications, type LoadedSupplementalPublications } from "./supplemental-publication";
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
  const supplemental: LoadedSupplementalPublications = await loadSupplementalPublications().catch(() => ({editions:[],issues:[{register:"supplemental" as const,code:"register-invalid"}]}));
  const content = selectWeeklyOfferContent(loaded,now,supplemental);
  const today = berlinDateKey(now);
  const scheduled = content.issues.includes("preparation-incomplete") ? [] : [...(loaded.issues.some(issue => issue.week === null) ? [] : loaded.editions
    .filter(({edition}) => edition.validFrom > today && !loaded.issues.some(issue => issue.week === edition.validFrom && (!issue.language || issue.language === edition.language)))
    .map(({edition:{id,title,language,validFrom,validTo}}) => ({id,title,language,validFrom,validTo}))),
    ...supplemental.editions.filter(({edition})=>edition.validFrom>today&&!supplemental.issues.some(issue=>issue.editionId===edition.id))
      .map(({edition:{id,title,language,validFrom,validTo}})=>({id,title,language,validFrom,validTo})),
  ];
  return {status:content.status,issues:content.issues,generatedAt:content.generatedAt,flyers:content.flyers,scheduled};
}
