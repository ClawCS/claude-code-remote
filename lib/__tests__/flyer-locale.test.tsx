import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import FlyerIndexView from "@/components/FlyerIndexView";
import type { FlyerIndex } from "@/lib/flyer-index";
import NlCurrentSection from "@/components/cinematic/NlCurrentSection";
import CurrentSection from "@/components/cinematic/CurrentSection";

const index:FlyerIndex={status:"ok",issues:[],generatedAt:"2026-09-30T12:00:00Z",flyers:[{id:"sample",language:"de",purpose:"weekly",medium:"trinkgut",title:"Originaltitel",validFrom:"2026-09-28",validTo:"2026-10-03",viewerUrl:"/handzettel/2026/sample.pdf",pdfUrl:"/handzettel/2026/sample.pdf",pdfSha256:"a".repeat(64),pageCount:1,coverUrl:"/images/content/sample.webp",sourceUrl:"/handzettel/2026/sample.pdf"}],scheduled:[]};
it("uses Dutch controls while preserving the original document title",()=>{
  const html=renderToStaticMarkup(<FlyerIndexView index={index} compact/>);
  expect(html).toContain("Folder bekijken");expect(html).toContain("Originaltitel");expect(html).not.toContain("Handzettel ansehen");
});
it("describes the local original as a direct link without claiming an external provider",()=>{
  const de=renderToStaticMarkup(<FlyerIndexView index={index}/>);
  const nl=renderToStaticMarkup(<FlyerIndexView index={index} compact/>);
  expect(de).toContain("Handzettel als PDF öffnen");expect(de).not.toContain("Handzettel extern öffnen");
  expect(nl).toContain("Folder als PDF openen");expect(nl).not.toContain("externe folder");
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
it("groups independent supplemental originals below main flyers with localized labels",()=>{
  const supplement={...index.flyers[0],id:"supplement",language:"nl" as const,purpose:"supplemental" as const,medium:"maasduinen" as const,title:"Maasduinen original",validFrom:"2026-09-20",validTo:"2026-10-18"};
  const grouped={...index,status:"degraded" as const,issues:["nl-flyer-missing"],flyers:[index.flyers[0],supplement]};
  for (const [html,label] of [[renderToStaticMarkup(<FlyerIndexView index={grouped}/>),"Zusätzliche Anzeigen"],[renderToStaticMarkup(<NlCurrentSection index={grouped}/>),"Aanvullende advertenties"],[renderToStaticMarkup(<CurrentSection content={{generatedAt:index.generatedAt,flyer:index.flyers[0],nlFlyer:null,supplementalFlyers:[supplement],event:null,archive:[],fallbackMessage:null}}/>),"Zusätzliche Anzeigen"]]) {
    expect(html).toContain(label);
    expect(html).toContain('data-flyer-group="supplemental"');
    expect(html.indexOf("Originaltitel")).toBeLessThan(html.indexOf(label));
    expect(html).toContain("Maasduinen original");
  }
  expect(renderToStaticMarkup(<FlyerIndexView index={index}/>)).not.toContain('data-flyer-group="supplemental"');
});
