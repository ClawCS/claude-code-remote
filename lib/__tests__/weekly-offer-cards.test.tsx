import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import WeeklyOfferGrid from "@/components/WeeklyOfferGrid";
import type { WeeklyOfferContent } from "@/lib/weekly-publication-types";
import offers from "@/data/weekly-offers.json";

const content:WeeklyOfferContent={status:"ok",issues:[],generatedAt:"2026-10-08T12:00:00Z",flyers:[
  {id:"catalog-13027-41-2026",language:"de",purpose:"weekly",medium:"trinkgut",title:"DE Original",validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:"/handzettel/2026/complete.pdf",pdfSha256:"be4b243ec0ddb84bee38054f051702a670ea8871fc897584190aefd9b8b4642a",viewerUrl:"/handzettel/2026/complete.pdf",sourceUrl:"/handzettel/2026/complete.pdf",coverUrl:"/images/content/test.webp",pageCount:18},
  {id:"nl-2026-10-05",language:"nl",purpose:"weekly",medium:"legacy-canva",title:"NL Original",validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:"/handzettel/2026/nl-2026-10-05.pdf",pdfSha256:"65fedf4c7016dfd91229ee5f0e2221b0d08aae4090572df0c35bb674c46db7d4",viewerUrl:"/handzettel/2026/nl-2026-10-05.pdf",sourceUrl:"/handzettel/2026/nl-2026-10-05.pdf",coverUrl:"/images/content/test-nl.webp",pageCount:1}
],offers:offers.map(({id,name,categorySlug,language,flyerId,validFrom,validTo,image,sourcePage,rect,pdfSha256,conditions,sourceWarning})=>({id,name,categorySlug,language:language as "de"|"nl",flyerId,validFrom,validTo,image,sourcePage,rect:rect as [number,number,number,number],pdfSha256,conditions,sourceWarning,sourceUrl:language==="de"?"/handzettel/2026/complete.pdf":"/handzettel/2026/nl-2026-10-05.pdf"}))};

describe("complete original offer cards",()=>{
  it("renders the three actual KW42 pilot records and the unchanged NL unit warning in an isolated render fixture",()=>{
    const ids=["de-2026-42-p01-06","de-2026-42-p02-01","nl-2026-42-p01-r2c1","nl-2026-42-p01-r1c1"];
    const pilotOffers=offers.filter(o=>ids.includes(o.id)).map(o=>({...o,rect:o.rect as [number,number,number,number]}));
    const fixture:WeeklyOfferContent={status:"ok",issues:[],generatedAt:"2026-10-12T12:00:00Z",offers:pilotOffers,flyers:content.flyers.map(f=>{
      const row=pilotOffers.find(o=>o.language===f.language)!;
      return {...f,id:row.flyerId,validFrom:row.validFrom,validTo:row.validTo,pdfSha256:row.pdfSha256,pdfUrl:row.sourceUrl,sourceUrl:row.sourceUrl,viewerUrl:row.sourceUrl,medium:f.language==="nl"?"de-maas-driehoek":"trinkgut"};
    })};
    const html=renderToStaticMarkup(<WeeklyOfferGrid content={fixture}/>);
    expect(html.match(/<dl\b/g)).toHaveLength(3);expect(html.match(/data-offer-id=/g)).toHaveLength(4);
    for(const text of ["4,99 €","12 × 0,75 l Glas","zzgl. 3,30 € Pfand","0,55 €/l","0,99 €","250 ml Dose","zzgl. 0,25 € Pfand","3,96 €/l","1,19 €","1,25 l PET-fles","excl. 0,25 € statiegeld","0,95 €/l","taurin- und koffeinhaltig","bevat gedeeltelijk cafeïnehoudend","0,25 ml Blik","bitte die Gebindegröße im Markt klären"])expect(html).toContain(text);
    expect(html).toContain("#page=2");
    const preview=renderToStaticMarkup(<WeeklyOfferGrid content={{...fixture,generatedAt:"2026-10-11T14:00:00Z"}}/>);
    expect(preview.match(/<dl\b/g)).toHaveLength(3);expect(preview.match(/data-offer-preview=/g)).toHaveLength(4);
    for(const generatedAt of ["2026-10-11T13:59:59Z","2026-10-17T22:00:00Z"])expect(renderToStaticMarkup(<WeeklyOfferGrid content={{...fixture,generatedAt}}/>)).not.toContain('<dl');
  });
  const summary={price:"4,99 €",package:"12 × 0,75 l Glas",deposit:"zzgl. 3,30 € Pfand",unitPrice:"0,55 €/l"};
  it("renders reviewed printed facts in a visible description list beside all conditions and warnings",()=>{
    const offer={...content.offers[0],summary,conditions:"All printed terms",sourceWarning:"Printed inconsistency"};
    const html=renderToStaticMarkup(<WeeklyOfferGrid content={{...content,offers:[offer]}}/>);
    expect(html).toContain('<dl');
    for(const [label,value] of [["Preis",summary.price],["Gebinde",summary.package],["Pfand",summary.deposit],["Grundpreis",summary.unitPrice]]) {
      expect(html).toContain(`<dt>${label}</dt><dd>${value}</dd>`);
    }
    expect(html).toContain("All printed terms");expect(html).toContain("Printed inconsistency");
    expect(html).not.toMatch(/itemProp="price"|schema.org\/Offer/);
  });
  it.each(["2026-10-04T13:59:59Z","2026-10-10T22:00:00Z"])("never renders summary text outside the Berlin publication window: %s",generatedAt=>{
    const html=renderToStaticMarkup(<WeeklyOfferGrid content={{...content,generatedAt,offers:[{...content.offers[0],summary}]}}/>);
    expect(html).not.toContain("4,99 €");expect(html).not.toContain('<dl');
  });
  it("keeps historical omission as an image and full-text card with no empty summary",()=>{
    const html=renderToStaticMarkup(<WeeklyOfferGrid content={{...content,offers:[content.offers[0]]}}/>);
    expect(html).not.toContain('<dl');expect(html).toContain("Originalhandzettel öffnen");
  });
  it("keeps same-product supplemental conditions separate and labels the actual original",()=>{
    const source={...content.flyers[1],id:"supplemental",purpose:"supplemental" as const,medium:"maasduinen" as const,validFrom:"2026-10-07",validTo:"2026-10-18"};
    const original=content.offers.find(o=>o.language==="nl")!;
    const extra={...original,id:"supplemental-offer",flyerId:source.id,validFrom:source.validFrom,validTo:source.validTo,conditions:"Andere Mindestmenge"};
    const html=renderToStaticMarkup(<WeeklyOfferGrid content={{...content,flyers:[...content.flyers,source],offers:[original,extra]}}/>);
    expect(html.match(/data-offer-id=/g)).toHaveLength(2);
    expect(html).toContain("Maasduinen · Zusatzanzeige");
    expect(html).toContain("Originalanzeige öffnen");
    expect(html).toContain("Andere Mindestmenge");
  });
  it("keeps app and quantity terms available beside the original images",()=>{
    const html=renderToStaticMarkup(<WeeklyOfferGrid content={content}/>);
    expect(html).toContain("Bedingungen zum Angebot");
    expect(html).toContain("Nur mit der trinkgut App");
    expect(html).toContain("Mengenbedingung");
  });
  it("shows source warnings without inventing a corrected price",()=>{
    const html=renderToStaticMarkup(<WeeklyOfferGrid content={content} language="nl" search="Grand Sud"/>);
    expect(html).toContain("Hinweis zum Original");
    expect(html).toContain("Der gedruckte Grundpreis weicht rechnerisch");
    expect(html).not.toContain("itemProp=\"price\"");
  });
  it("links a back-page offer directly to its actual original PDF page",()=>{
    const html=renderToStaticMarkup(<WeeklyOfferGrid content={content}/>);
    expect(html).toContain("complete.pdf#page=18");
    expect(html).toContain("nl-2026-10-05.pdf#page=1");
    expect(html).not.toContain("nl-2026-10-05.pdf#page=14");
  });
});
