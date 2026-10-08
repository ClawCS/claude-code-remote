import { notFound } from "next/navigation";
import { fixtureEnabled, weeklyOfferFixtureContent } from "@/lib/cinematic/weekly-offer-fixture";
import WeeklyOfferFixture from "./weekly-offer-fixture";
export const dynamic="force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<{stage?:string}>}) {
  if(!fixtureEnabled()) notFound();
  const {stage}=await searchParams;
  return <WeeklyOfferFixture initial={weeklyOfferFixtureContent(stage==="monday"?"monday":"sunday")}/>;
}
