"use client";
import Link from "next/link";
import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import WeeklyOfferGrid from "@/components/WeeklyOfferGrid";
import { categories } from "@/lib/utils";
import type { WeeklyOfferContent } from "@/lib/weekly-publication-types";
export default function ProductCatalogue({children,content,initialSearch=""}:{children:React.ReactNode;content:WeeklyOfferContent;initialSearch?:string}) {
  const [search,setSearch]=useState(initialSearch);
  const [previousSearch,setPreviousSearch]=useState(initialSearch);
  if (initialSearch !== previousSearch) {
    setPreviousSearch(initialSearch);
    setSearch(initialSearch);
  }
  const [language,setLanguage]=useState("alle");
  return <>
    <div className="page-hero-banner py-16 md:py-24"><div className="max-w-7xl mx-auto px-6 text-center relative">
      <p className="text-white/70 mb-3">Trinkgut Jammers · Goch</p>
      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Sortiment & Wochenangebote</h1>
      <p className="text-white/80 max-w-2xl mx-auto text-lg">Alle Produktangebote aus dem deutschen und niederländischen Wochenhandzettel – nach Warengruppen sortiert. Gemeinsam beworbene Varianten und Mengenstaffeln bleiben zusammen. Das vollständige Marktsortiment findest du bei uns vor Ort.</p>
      <Link href="/angebote" className="inline-block mt-6 rounded-full border border-white/40 text-white px-6 py-3 font-bold">DE- und NL-Handzettel ansehen →</Link>
    </div></div>
    <div className="max-w-7xl mx-auto px-6 py-10">
      <nav className="category-links mb-8" aria-label="Warengruppen">{categories.map(item=><Link href={`/kategorie/${item.slug}`} key={item.slug}>{item.name}</Link>)}</nav>
      <div className="flex flex-wrap items-center gap-4 mb-8"><div className="max-w-full sm:w-80"><SearchBar value={search} onChange={setSearch}/></div>
        <div className="flex flex-wrap gap-2" aria-label="Handzettel-Sprache">{[["alle","Alle Angebote"],["de","Deutsch"],["nl","Nederlands"]].map(([value,label])=><button key={value} type="button" aria-pressed={value===language} onClick={()=>setLanguage(value)} className={`rounded-full px-4 py-2 border border-border font-semibold ${language===value?"bg-primary text-white":"bg-white text-secondary"}`}>{label}</button>)}</div>
      </div>
      <WeeklyOfferGrid content={content} search={search} language={language}/>
      {children}
    </div>
  </>;
}
