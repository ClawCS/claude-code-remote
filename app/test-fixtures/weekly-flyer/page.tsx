import { notFound } from "next/navigation";
import CurrentSection from "@/components/cinematic/CurrentSection";
import NlCurrentSection from "@/components/cinematic/NlCurrentSection";
import { cinematicHomeTokenStyle } from "@/lib/cinematic/tokens";
import { fixtureEnabled, weeklyOfferFixtureContent } from "@/lib/cinematic/weekly-offer-fixture";
export const dynamic="force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ landing?: string; state?: string }> }) {
  if(!fixtureEnabled()) notFound();
  const params = await searchParams;
  const fixture=weeklyOfferFixtureContent("monday");
  return <main data-cinematic-root style={cinematicHomeTokenStyle}><p className="p-6">Isolierte synthetische Flyer-Fixture. Kein echtes Preisangebot und kein Produktionsnachweis.</p>{params.landing === "nl" ? <NlCurrentSection index={{ status:"degraded", generatedAt:fixture.generatedAt, issues:params.state === "empty" ? ["nl-flyer-missing"] : [], flyers:params.state === "empty" ? [] : [{ ...fixture.flyers[0], language:"nl", title:"Synthetische Nederlandse weekfolder met een extra lange titel voor een gezellig weekend en feestelijke momenten in Goch" }], scheduled:[] }} /> : <CurrentSection content={{generatedAt:fixture.generatedAt,flyer:fixture.flyers[0],nlFlyer:null,event:null,archive:[],fallbackMessage:null}}/>}</main>;
}
