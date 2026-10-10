"use client";
import Link from "next/link";
import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import PageIntro from "@/components/editorial/PageIntro";
import editorial from "@/components/editorial/editorial.module.css";
import styles from "@/components/editorial/collection.module.css";
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
    <PageIntro eyebrow="Trinkgut Jammers · Goch" title="Sortiment & Wochenangebote" description="Alle Produktangebote aus dem deutschen und niederländischen Wochenhandzettel – nach Warengruppen sortiert. Gemeinsam beworbene Varianten und Mengenstaffeln bleiben zusammen. Das vollständige Marktsortiment findest du bei uns vor Ort." breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Sortiment" }]}>
      <Link href="/angebote" className={editorial.secondaryLink}>DE- und NL-Handzettel ansehen</Link>
    </PageIntro>
    <div className={styles.body} data-collection="catalogue">
      <nav className={styles.categories} aria-label="Warengruppen">{categories.map(item=><Link href={`/kategorie/${item.slug}`} key={item.slug}>{item.name}</Link>)}</nav>
      <div className={styles.toolbar}><div className={styles.search}><SearchBar value={search} onChange={setSearch}/></div>
        <div className={styles.filters} role="group" aria-label="Handzettel-Sprache">{[["alle","Alle Angebote"],["de","Deutsch"],["nl","Nederlands"]].map(([value,label])=><button key={value} type="button" aria-pressed={value===language} onClick={()=>setLanguage(value)}>{label}</button>)}</div>
      </div>
      <WeeklyOfferGrid content={content} search={search} language={language}/>
      {children}
    </div>
  </>;
}
