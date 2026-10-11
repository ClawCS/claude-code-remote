import { notFound } from "next/navigation";
import CurrentSection from "@/components/cinematic/CurrentSection";
import NlCurrentSection from "@/components/cinematic/NlCurrentSection";
import { cinematicHomeTokenStyle } from "@/lib/cinematic/tokens";
import { fixtureEnabled, weeklyOfferFixtureContent, publicationStreamFixtureContent, type PublicationStreamFixtureState } from "@/lib/cinematic/weekly-offer-fixture";
import FlyerIndexView from "@/components/FlyerIndexView";
import WeeklyOfferFixture from "../weekly-offers/weekly-offer-fixture";
export const dynamic="force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ landing?: string; state?: string }> }) {
  if(!fixtureEnabled()) notFound();
  const params = await searchParams;
  if (params.state && ["active","missing-nl","main-only","supplement-only","expired"].includes(params.state)) {
    const content=publicationStreamFixtureContent(params.state as PublicationStreamFixtureState);
    const index={...content,scheduled:[]};
    if(params.landing==="products") return <WeeklyOfferFixture initial={content} catalogue/>;
    return <main data-cinematic-root style={cinematicHomeTokenStyle}><p className="p-6">Isolierte synthetische Flyer-Fixture. Kein echtes Preisangebot und kein Produktionsnachweis.</p>{params.landing==="nl"?<NlCurrentSection index={index}/>:params.landing==="index"||params.landing==="handzettel"?<FlyerIndexView index={index}/>:<CurrentSection content={{generatedAt:content.generatedAt,flyer:content.flyers.find(f=>f.language==="de"&&f.purpose==="weekly")??null,nlFlyer:content.flyers.find(f=>f.language==="nl"&&f.purpose==="weekly")??null,supplementalFlyers:content.flyers.filter(f=>f.purpose==="supplemental"),event:null,archive:[],fallbackMessage:"Der nächste Handzettel wird vorbereitet."}}/>}</main>;
  }
  const fixture=weeklyOfferFixtureContent("monday");
  return <main data-cinematic-root style={cinematicHomeTokenStyle}><p className="p-6">Isolierte synthetische Flyer-Fixture. Kein echtes Preisangebot und kein Produktionsnachweis.</p>{params.landing === "nl" ? <NlCurrentSection index={{ status:"degraded", generatedAt:fixture.generatedAt, issues:params.state === "empty" ? ["nl-flyer-missing"] : [], flyers:params.state === "empty" ? [] : [{ ...fixture.flyers[0], language:"nl", title:"Synthetische Nederlandse weekfolder met een extra lange titel voor een gezellig weekend en feestelijke momenten in Goch" }], scheduled:[] }} /> : <CurrentSection content={{generatedAt:fixture.generatedAt,flyer:fixture.flyers[0],nlFlyer:null,event:null,archive:[],fallbackMessage:null}}/>}</main>;
}
