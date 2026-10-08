"use client";
import { useRef, useState } from "react";
import WeeklyOfferGrid from "@/components/WeeklyOfferGrid";
import { WeeklyOfferRuntimeContext } from "@/components/WeeklyOfferRuntime";
import { weeklyOfferFixtureContent, type WeeklyFixtureStage } from "@/lib/cinematic/weekly-offer-fixture";
import type { WeeklyOfferContent } from "@/lib/weekly-publication-types";
type Pending={id:number;content:WeeklyOfferContent;resolve:(value:unknown)=>void};
export default function WeeklyOfferFixture({initial}:{initial:WeeklyOfferContent}) {
  const snapshot=useRef(initial);const hold=useRef(false);const pending=useRef<Pending[]>([]);const serial=useRef(0);
  const [pendingIds,setPendingIds]=useState<number[]>([]);const [clock,setClock]=useState(initial.generatedAt);const [settled,setSettled]=useState("");
  const [runtime]=useState(()=>({now:()=>new Date(snapshot.current.generatedAt),request:async():Promise<unknown>=>{
    const content=snapshot.current;
    if(!hold.current) return content;
    return new Promise(resolve=>{pending.current.push({id:++serial.current,content,resolve});setPendingIds(pending.current.map(p=>p.id));});
  }}));
  const request=(stage:WeeklyFixtureStage,defer=false)=>{
    snapshot.current=weeklyOfferFixtureContent(stage);hold.current=defer;setClock(snapshot.current.generatedAt);
    document.dispatchEvent(new Event("visibilitychange"));
  };
  const complete=(id:number)=>{
    const next=pending.current.find(p=>p.id===id);if(!next) return;
    pending.current=pending.current.filter(p=>p.id!==id);next.resolve(next.content);setPendingIds(pending.current.map(p=>p.id));setSettled(`Antwort ${id} abgeschlossen`);
  };
  return <main className="max-w-7xl mx-auto px-6 py-10">
    <h1 className="text-3xl font-bold">Isolierte Wochenangebote-Fixture</h1>
    <p>Nur synthetische Daten. Kein Produktionsuhr-Override, keine externen Requests.</p>
    <p role="status">Testuhr: {clock} · {settled}</p>
    <div className="flex flex-wrap gap-3 my-6">
      <button className="border p-3" onClick={()=>request("sunday")}>Sonntag vor Mitternacht</button>
      <button className="border p-3" onClick={()=>request("monday")}>Montag aktivieren</button>
      <button className="border p-3" onClick={()=>request("monday",true)}>Ältere Antwort anfordern</button>
      <button className="border p-3" onClick={()=>request("latest",true)}>Neuere Antwort anfordern</button>
      <button className="border p-3" onClick={()=>request("expired")}>Nach Wochenablauf</button>
    </div>
    <div aria-label="Ausstehende Antworten" className="flex gap-3 my-6">{pendingIds.map(id=><button className="border p-3" key={id} onClick={()=>complete(id)}>Antwort {id} abschließen</button>)}</div>
    <WeeklyOfferRuntimeContext.Provider value={runtime}><WeeklyOfferGrid content={initial}/></WeeklyOfferRuntimeContext.Provider>
  </main>;
}
