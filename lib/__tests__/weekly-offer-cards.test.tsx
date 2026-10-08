import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import WeeklyOfferGrid from "@/components/WeeklyOfferGrid";
import type { WeeklyOfferContent } from "@/lib/weekly-publication-types";
import offers from "@/data/weekly-offers.json";

const content:WeeklyOfferContent={status:"ok",issues:[],generatedAt:"2026-10-08T12:00:00Z",flyers:[
  {id:"catalog-13027-41-2026",language:"de",title:"DE Original",validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:"/handzettel/2026/complete.pdf",pdfSha256:"be4b243ec0ddb84bee38054f051702a670ea8871fc897584190aefd9b8b4642a",viewerUrl:"/handzettel/2026/complete.pdf",sourceUrl:"/handzettel/2026/complete.pdf",coverUrl:"/images/content/test.webp",pageCount:18},
  {id:"nl-2026-10-05",language:"nl",title:"NL Original",validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:"/handzettel/2026/nl-2026-10-05.pdf",pdfSha256:"65fedf4c7016dfd91229ee5f0e2221b0d08aae4090572df0c35bb674c46db7d4",viewerUrl:"/handzettel/2026/nl-2026-10-05.pdf",sourceUrl:"/handzettel/2026/nl-2026-10-05.pdf",coverUrl:"/images/content/test-nl.webp",pageCount:1}
],offers:offers.map(({id,name,categorySlug,language,flyerId,validFrom,validTo,image,sourcePage,rect,pdfSha256,conditions,sourceWarning})=>({id,name,categorySlug,language:language as "de"|"nl",flyerId,validFrom,validTo,image,sourcePage,rect:rect as [number,number,number,number],pdfSha256,conditions,sourceWarning,sourceUrl:language==="de"?"/handzettel/2026/complete.pdf":"/handzettel/2026/nl-2026-10-05.pdf"}))};

describe("complete original offer cards",()=>{
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
