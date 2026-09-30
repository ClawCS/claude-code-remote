import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import FlyerIndexView from "@/components/FlyerIndexView";
import type { FlyerIndex } from "@/lib/flyer-index";

const index:FlyerIndex={status:"ok",issues:[],generatedAt:"2026-09-30T12:00:00Z",flyers:[{id:"sample",language:"de",title:"Originaltitel",validFrom:"2026-09-28",validTo:"2026-10-03",viewerUrl:"/handzettel/2026/sample.pdf",pdfUrl:"/handzettel/2026/sample.pdf",pageCount:1,coverUrl:"/images/home/brand-logo.webp",sourceUrl:"https://www.canva.com/design/sample/view"}],scheduled:[]};
it("uses Dutch controls while preserving the original document title",()=>{
  const html=renderToStaticMarkup(<FlyerIndexView index={index} compact/>);
  expect(html).toContain("Folder bekijken");expect(html).toContain("Originaltitel");expect(html).not.toContain("Handzettel ansehen");
});
it("uses Dutch empty and scheduled states",()=>{
  const html=renderToStaticMarkup(<FlyerIndexView index={{...index,flyers:[],scheduled:[{id:"next",language:"nl",title:"Volgende folder",validFrom:"2026-10-05",validTo:"2026-10-10"}]}} compact/>);
  expect(html).toContain("wordt voorbereid");expect(html).toContain("Binnenkort");expect(html).not.toContain("Der nächste gültige Handzettel");expect(html).not.toContain("Als Nächstes");
});
it("shows a Dutch NL-specific missing notice even while the DE flyer is available",()=>{
  const html=renderToStaticMarkup(<FlyerIndexView index={{...index,status:"degraded",issues:["nl-flyer-missing"]}} compact/>);
  expect(html).toContain("Nederlandse weekfolder is nog niet beschikbaar");expect(html).toContain("Originaltitel");
});
it("shows the German NL-specific missing notice on the German index",()=>{
  const html=renderToStaticMarkup(<FlyerIndexView index={{...index,status:"degraded",issues:["nl-flyer-missing"]}}/>);
  expect(html).toContain("niederländische Wochenflyer ist noch nicht verfügbar");
});
