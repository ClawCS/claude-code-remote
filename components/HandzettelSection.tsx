"use client";
import { useEffect, useState } from "react";
import FlyerIndexView from "@/components/FlyerIndexView";
import type { FlyerIndex } from "@/lib/flyer-index";
export default function HandzettelSection() {
 const [index,setIndex] = useState<FlyerIndex | null>(null);
 useEffect(()=>{const controller=new AbortController();fetch("/api/content/flyers",{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error("Flyer");return r.json();}).then(setIndex).catch(()=>{});return ()=>controller.abort();},[]);
 return index ? <FlyerIndexView index={index} compact/> : <section className="max-w-6xl mx-auto px-6 py-10"><h2 className="text-2xl font-bold">Actuele folders</h2><p className="mt-3">De actuele folders worden geladen. <a href="/handzettel" className="text-primary underline">Alle folders bekijken</a></p></section>;
}
