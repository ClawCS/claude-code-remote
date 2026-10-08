"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createOfferRefresh } from "@/lib/weekly-offer-refresh";
import type { WeeklyOfferContent } from "@/lib/weekly-publication-types";
const defaultRuntime = {
  now: () => new Date(),
  request: async (signal:AbortSignal):Promise<unknown> => {
    const response=await fetch("/api/content/offers",{cache:"no-store",signal:AbortSignal.any([signal,AbortSignal.timeout(8000)])});
    if (!response.ok) throw new Error("Weekly offers unavailable");
    return response.json();
  },
};
export const WeeklyOfferRuntimeContext=createContext(defaultRuntime);
export function useWeeklyOfferContent(initial:WeeklyOfferContent) {
  const runtime=useContext(WeeklyOfferRuntimeContext);
  const [current,setCurrent]=useState(initial);
  const [now,setNow]=useState(initial.generatedAt);
  useEffect(()=>{
    const refresh=createOfferRefresh(runtime.request,value=>{
      setNow(runtime.now().toISOString());
      setCurrent(value??{status:"degraded",issues:["refresh-failed"],generatedAt:runtime.now().toISOString(),flyers:[],offers:[]});
    });
    void refresh.run();
    const clock=setInterval(()=>setNow(runtime.now().toISOString()),1000);
    const timer=setInterval(()=>void refresh.run(),60000);
    const onVisible=()=>{if(document.visibilityState==="visible") void refresh.run();};
    document.addEventListener("visibilitychange",onVisible);
    return ()=>{refresh.dispose();clearInterval(clock);clearInterval(timer);document.removeEventListener("visibilitychange",onVisible);};
  },[initial,runtime]);
  return {current,now:new Date(now)};
}
