import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import WeeklyOfferGrid from "@/components/WeeklyOfferGrid";
import type { FlyerIndex } from "@/lib/flyer-index";

const index:FlyerIndex={status:"ok",issues:[],scheduled:[],generatedAt:"2026-10-08T12:00:00Z",flyers:[
  {id:"catalog-13027-41-2026",language:"de",title:"DE Original",validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:"https://werbung.trinkgut.de/frontend/catalogs/1390117/1/pdf/complete.pdf",viewerUrl:"https://example.test/de",sourceUrl:"https://example.test/de",coverUrl:"/images/content/test.webp",pageCount:18},
  {id:"nl-2026-10-05",language:"nl",title:"NL Original",validFrom:"2026-10-05",validTo:"2026-10-10",pdfUrl:"/handzettel/2026/nl-2026-10-05.pdf",pdfSha256:"65fedf4c7016dfd91229ee5f0e2221b0d08aae4090572df0c35bb674c46db7d4",viewerUrl:"/handzettel/2026/nl-2026-10-05.pdf",sourceUrl:"https://example.test/nl",coverUrl:"/images/content/test-nl.webp",pageCount:1}
]};

describe("complete original offer cards",()=>{
  it("keeps app and quantity terms available beside the original images",()=>{
    const html=renderToStaticMarkup(<WeeklyOfferGrid index={index}/>);
    expect(html).toContain("Bedingungen zum Angebot");
    expect(html).toContain("Nur mit der trinkgut App");
    expect(html).toContain("Mengenbedingung");
  });
  it("shows source warnings without inventing a corrected price",()=>{
    const html=renderToStaticMarkup(<WeeklyOfferGrid index={index} language="nl" search="Grand Sud"/>);
    expect(html).toContain("Hinweis zum Original");
    expect(html).toContain("Der gedruckte Grundpreis weicht rechnerisch");
    expect(html).not.toContain("itemProp=\"price\"");
  });
  it("links a back-page offer directly to its actual original PDF page",()=>{
    const html=renderToStaticMarkup(<WeeklyOfferGrid index={index}/>);
    expect(html).toContain("complete.pdf#page=18");
    expect(html).toContain("nl-2026-10-05.pdf#page=1");
    expect(html).not.toContain("nl-2026-10-05.pdf#page=14");
  });
});
