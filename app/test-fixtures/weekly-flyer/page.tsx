import { notFound } from "next/navigation";
import CurrentSection from "@/components/cinematic/CurrentSection";
import { fixtureEnabled, weeklyOfferFixtureContent } from "@/lib/cinematic/weekly-offer-fixture";
export const dynamic="force-dynamic";
export default function Page() {
  if(!fixtureEnabled()) notFound();
  const fixture=weeklyOfferFixtureContent("monday");
  return <main data-cinematic-root><p className="p-6">Isolierte synthetische Flyer-Fixture. Kein echtes Preisangebot und kein Produktionsnachweis.</p><CurrentSection content={{generatedAt:fixture.generatedAt,flyer:fixture.flyers[0],nlFlyer:null,event:null,archive:[],fallbackMessage:null}}/></main>;
}
