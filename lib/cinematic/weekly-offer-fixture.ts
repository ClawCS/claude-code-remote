import type { WeeklyOfferContent } from "../weekly-publication-types";
export type WeeklyFixtureStage="sunday"|"monday"|"latest"|"expired";
export function fixtureEnabled(env:NodeJS.ProcessEnv=process.env):boolean { return env.NODE_ENV!=="production"&&env.CINEMATIC_E2E==="1"; }
export function weeklyOfferFixtureContent(stage:WeeklyFixtureStage):WeeklyOfferContent {
  const generatedAt=stage==="sunday"?"2026-10-11T21:59:59.000Z":stage==="expired"?"2026-10-17T22:00:00.000Z":"2026-10-11T22:00:00.000Z";
  if(stage==="sunday"||stage==="expired") return {status:"ok",issues:[],generatedAt,flyers:[],offers:[]};
  const hash=(stage==="latest"?"b":"a").repeat(64);
  const pdfUrl="/handzettel/weekly-fixture.pdf";
  return {status:"ok",issues:[],generatedAt,flyers:[{id:"synthetic-monday",language:"de",title:"Synthetischer Testhandzettel",validFrom:"2026-10-12",validTo:"2026-10-17",pdfUrl,viewerUrl:pdfUrl,sourceUrl:pdfUrl,pdfSha256:hash,pageCount:1,coverUrl:"/images/content/weekly-fixture.webp"}],offers:[{
    id:stage==="latest"?"synthetic-monday-latest":"synthetic-monday-original",name:stage==="latest"?"Synthetische neue Ausgabe":"Synthetisches Montagsangebot",
    categorySlug:"alkoholfrei",language:"de",flyerId:"synthetic-monday",validFrom:"2026-10-12",validTo:"2026-10-17",image:"/images/offers/weekly-fixture.webp",sourcePage:1,rect:[0,0,320,180],pdfSha256:hash,sourceUrl:pdfUrl,conditions:"Nur synthetische Fixture; kein echtes Preisangebot.",
  }]};
}
