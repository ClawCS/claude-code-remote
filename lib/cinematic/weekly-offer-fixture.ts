import type { WeeklyOfferContent } from "../weekly-publication-types";
export type WeeklyFixtureStage="sunday"|"preview"|"monday"|"latest"|"expired";
export function fixtureEnabled(env:NodeJS.ProcessEnv=process.env):boolean { return env.NODE_ENV!=="production"&&env.CINEMATIC_E2E==="1"; }
export function weeklyOfferFixtureContent(stage:WeeklyFixtureStage):WeeklyOfferContent {
  const generatedAt=stage==="sunday"?"2026-10-11T13:59:59.000Z":stage==="preview"?"2026-10-11T14:00:00.000Z":stage==="expired"?"2026-10-17T22:00:00.000Z":"2026-10-11T22:00:00.000Z";
  if(stage==="sunday"||stage==="expired") return {status:"ok",issues:[],generatedAt,flyers:[],offers:[]};
  const hash=(stage==="latest"?"b":"a").repeat(64);
  const pdfUrl="/handzettel/weekly-fixture.pdf";
  return {status:"ok",issues:[],generatedAt,flyers:[{id:"synthetic-monday",language:"de",purpose:"weekly",medium:"trinkgut",title:"Synthetischer Testhandzettel",validFrom:"2026-10-12",validTo:"2026-10-17",pdfUrl,viewerUrl:pdfUrl,sourceUrl:pdfUrl,pdfSha256:hash,pageCount:1,coverUrl:"/images/content/weekly-fixture.webp"}],offers:[{
    id:stage==="latest"?"synthetic-monday-latest":"synthetic-monday-original",name:stage==="latest"?"Synthetische neue Ausgabe":"Synthetisches Montagsangebot",
    categorySlug:"alkoholfrei",language:"de",flyerId:"synthetic-monday",validFrom:"2026-10-12",validTo:"2026-10-17",image:"/images/offers/weekly-fixture.webp",sourcePage:1,rect:[0,0,320,180],pdfSha256:hash,sourceUrl:pdfUrl,conditions:"Nur synthetische Fixture; kein echtes Preisangebot.",
  }]};
}

export type PublicationStreamFixtureState = "active" | "missing-nl" | "main-only" | "supplement-only" | "expired";
/** DTO-only synthetic composition for the explicitly gated test routes. */
export function publicationStreamFixtureContent(state: PublicationStreamFixtureState): WeeklyOfferContent {
  const base=weeklyOfferFixtureContent("monday");
  const de=base.flyers[0];
  const nl={...de,id:"synthetic-nl",language:"nl" as const,medium:"de-maas-driehoek" as const,title:"Synthetische Nederlandse weekfolder"};
  const supplemental={...nl,id:"synthetic-maasduinen",purpose:"supplemental" as const,medium:"maasduinen" as const,title:"Synthetische Maasduinen advertentie",validFrom:"2026-10-07",validTo:"2026-10-18"};
  const flyers=state==="expired"?[]:state==="supplement-only"?[supplemental]:state==="missing-nl"?[de,supplemental]:state==="main-only"?[de,nl]:[de,nl,supplemental];
  const issues=state==="missing-nl"?["nl-flyer-missing"]:state==="supplement-only"?["official-flyer-missing","nl-flyer-missing"]:[];
  return {status:issues.length?"degraded":"ok",issues,generatedAt:state==="expired"?"2026-10-18T22:00:00Z":"2026-10-13T12:00:00Z",flyers,offers:flyers.map(flyer=>({...base.offers[0],id:`${flyer.id}-offer`,flyerId:flyer.id,language:flyer.language,validFrom:flyer.validFrom,validTo:flyer.validTo,conditions:flyer.purpose==="supplemental"?"Synthetische Zusatzbedingung, getrennt vom Wochenangebot.":"Synthetische Wochenbedingung."}))};
}
