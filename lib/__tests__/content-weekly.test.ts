import { spawn } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { weeklyPublicationFixture } from "./fixtures/weekly-publication";

const repo=process.cwd();
async function prepareReviewed(options:{missingNl?:boolean;badCover?:boolean;stageOnly?:boolean;corruptNl?:boolean}={}) {
  const f=await weeklyPublicationFixture();
  try {
    if(options.missingNl) { f.sources.splice(1);f.offers.splice(2);await f.save();await f.write("data/editorial/flyers.json","[]"); }
    if(options.badCover) { f.sources[0].coverSha256="a".repeat(64);await f.save(); }
    if(options.corruptNl) await f.write(`public${f.editions[1].pdf.path}`,"corrupt NL");
    if(options.stageOnly) {
      f.sources.length=0;await f.save();
      const base="https://werbung.trinkgut.de/frontend/mvc/api/catalogs/1390117/v1";
      const viewer='<!doctype html><meta http-equiv="expires" content="Sat, 10 Oct 2026 23:59:59 CEST"><title>KW41 2747 RHEINRUHR</title><script>var catalogId = \'1390117\'; var catalogGroupId = \'13027\'; var catalogVersion = \'1\'; var catalogName = \'KW41 2747 RHEINRUHR\';</script>';
      const xml='<catalog name="KW41 2747 RHEINRUHR" nofpages="2"><structure><detaillevel name="normal" width="625" height="905" path="../normal/" filename="bk_" extension="jpg"/><detaillevel name="thumb" width="83" height="120" path="../thumbnails/" filename="bk_" extension="jpg"/></structure><mapping><range id_start="1" nr_start="1" pages="2"/></mapping></catalog>';
      await f.write("test-original.pdf",f.pdfs[0]);await f.write("test-cover.jpg",await sharp(f.image).jpeg().toBuffer());
      await f.write("test-official-import.json",JSON.stringify({viewer,xml,base,pdfUrl:f.catalog.pdfUrl,viewerUrl:f.catalog.viewerUrl}));
    }
    await f.write("data/editorial/source-config.json",JSON.stringify({publicUrl:null}));
    const manifest=await readFile(path.join(f.root,"data/editorial/weekly-publications/2026-10-05.json"));
    const metadata=await readFile(path.join(f.root,"data/editorial/official-catalogs/2026-10-05.json"));
    const result=await new Promise<{code:number|null;report:{errors:string[];sources:Record<string,unknown>[];packageVerified?:boolean}}>((resolve,reject)=>{
      const child=spawn(process.execPath,["--import",path.join(repo,"node_modules/tsx/dist/loader.mjs"),"--import",path.join(repo,"lib/__tests__/fixtures/content-check-fetch.mjs"),path.join(repo,"scripts/content-weekly.ts"),"--prepare","--week","2026-10-05","--now","2026-10-08T12:00:00Z"],{cwd:f.root,env:{...process.env,TSX_TSCONFIG_PATH:path.join(repo,"tsconfig.json")}});
      let stdout="",stderr="";child.stdout.on("data",chunk=>stdout+=chunk);child.stderr.on("data",chunk=>stderr+=chunk);child.on("error",reject);child.on("close",code=>{try{resolve({code,report:JSON.parse(stdout)});}catch{reject(new Error(stderr));}});
    });
    const staged=result.report.sources.find(source=>source.result==="staged-awaiting-original-layout-review");
    const stagedPdf=staged?await readFile(path.join(f.root,staged.stagingDirectory as string,"original.pdf")):undefined;
    return {...result,stagedPdf,originalPdf:f.pdfs[0],manifestBefore:manifest,manifestAfter:await readFile(path.join(f.root,"data/editorial/weekly-publications/2026-10-05.json")),metadataBefore:metadata,metadataAfter:await readFile(path.join(f.root,"data/editorial/official-catalogs/2026-10-05.json"))};
  } finally {await rm(f.root,{recursive:true,force:true});}
}
describe("reviewed local preparation",()=>{
  it("uses complete local originals despite later origin failure and preserves bound metadata bytes",async()=>{
    const result=await prepareReviewed();expect(result.code).toBe(0);expect(result.report.errors).toEqual([]);expect(result.metadataAfter).toEqual(result.metadataBefore);
  });
  it("retains an isolated DE package but exits nonzero when mandatory NL is missing",async()=>{
    const result=await prepareReviewed({missingNl:true});expect(result.code).toBe(1);expect(result.report.packageVerified).not.toBe(true);expect(result.report.errors.some(message=>/NL/.test(message))).toBe(true);expect(JSON.parse(result.manifestAfter.toString()).editions.map((edition:{language:string})=>edition.language)).toEqual(["de"]);
  });
  it("failed preparation leaves both previous manifest and catalog binding unchanged",async()=>{
    const result=await prepareReviewed({badCover:true});expect(result.code).toBe(1);expect(result.manifestAfter).toEqual(result.manifestBefore);expect(result.metadataAfter).toEqual(result.metadataBefore);
  });
  it("fresh downloads only stage complete originals and cannot bind an unreviewed offer layout",async()=>{
    const result=await prepareReviewed({stageOnly:true});expect(result.code).toBe(1);expect(result.stagedPdf).toEqual(result.originalPdf);expect(result.manifestAfter).toEqual(result.manifestBefore);expect(result.metadataAfter).toEqual(result.metadataBefore);
  });
  it("reports a verified DE partial distinctly when the present NL original is corrupt",async()=>{
    const result=await prepareReviewed({corruptNl:true});expect(result.code).toBe(1);expect(result.report.errors.some(message=>/NL/.test(message))).toBe(true);expect(result.report.sources.some(source=>source.language==="de"&&source.result==="verified-partial-package")).toBe(true);expect(result.manifestAfter).toEqual(result.manifestBefore);
  });
});
async function runBoundCheck(options:{now?:string;missingNl?:boolean;empty?:boolean;sourceOnly?:boolean;corrupt?:string;missingOffer?:boolean;wrongHash?:boolean;badLegacy?:boolean;missingCard?:boolean;missingLink?:boolean;badType?:boolean;prepare?:boolean;week?:string;staleLink?:string}={}) {
  const f=await weeklyPublicationFixture();
  try {
    if(options.missingNl) { f.publication.editions.splice(1);f.sources.splice(1);f.offers.splice(2);await f.save(); }
    if(options.empty||options.sourceOnly) { f.publication.editions.length=0;await f.save(); }
    const now=options.now??"2026-10-08T12:00:00Z";
    const active=now.slice(0,10)<="2026-10-10"&&!options.sourceOnly&&!options.empty;
    const flyers=active?f.editions.map(e=>({id:e.id,language:e.language,title:e.title,validFrom:e.validFrom,validTo:e.validTo,pdfUrl:e.pdf.path,viewerUrl:e.pdf.path,sourceUrl:e.pdf.path,coverUrl:e.cover.path,pageCount:e.pageCount,pdfSha256:e.pdf.sha256})):[];
    const offers=active?f.offers.map(o=>({id:o.id,name:o.name,categorySlug:o.categorySlug,language:o.language,flyerId:o.flyerId,validFrom:o.validFrom,validTo:o.validTo,image:o.image,sourcePage:o.sourcePage,rect:o.rect,pdfSha256:o.pdfSha256,sourceUrl:o.sourceUrl,conditions:o.conditions})):[];
    const missing=active&&!flyers.some(e=>e.language==="nl");
    const content={status:missing?"degraded":"ok",issues:missing?["nl-flyer-missing"]:[],generatedAt:now,flyers,offers};
    const flyer=flyers.find(e=>e.language==="de")??null,nlFlyer=flyers.find(e=>e.language==="nl")??null;
    const flyerHtml=flyers.map(e=>`<a href="${e.pdfUrl}">PDF</a><img src="${e.coverUrl}">`).join("");
    const cards=offers.map(o=>`<article data-offer-id="${o.id}"><h2>${o.name}</h2><p>${o.conditions}</p><img src="${o.image}"><a href="${o.sourceUrl}#page=${o.sourcePage}">Original</a></article>`).join("");
    const pages={"/":'<section id="aktuell">'+flyerHtml+"</section>","/angebote":flyerHtml,"/handzettel":flyerHtml,"/nl":flyerHtml,"/produkte":options.missingCard?"":cards,"/kategorie/alkoholfrei":options.missingLink?cards.replaceAll(/#page=\d+/g,""):cards};
    if (options.staleLink) pages["/angebote"]+=`<a href="${options.staleLink}">Expired</a>`;
    const legacy=flyer?{...flyer,status:"ok",pages:[{number:1,imageUrl:flyer.coverUrl,thumbnailUrl:flyer.coverUrl}]}:{status:"fallback",pageCount:0,pages:[],viewerUrl:null,pdfUrl:null};
    await f.write("test-published.json",JSON.stringify({current:{flyer,nlFlyer},index:{status:content.status,issues:content.issues,flyers},offers:{...content,offers:options.missingOffer?offers.slice(1):options.wrongHash?offers.map(o=>({...o,pdfSha256:"b".repeat(64)})):offers},legacy:options.badLegacy?{...legacy,pages:[{number:2,imageUrl:"/wrong.webp",thumbnailUrl:"/wrong.webp"}]}:legacy,pages,corruptPath:options.corrupt,badType:options.badType}));
    await f.write("data/editorial/source-config.json",JSON.stringify({publicUrl:"https://trinkgut-jammers.de"}));
    return await new Promise<{code:number|null;report:{errors:string[];sources:Record<string,unknown>[];websiteVerified?:boolean;deploymentVerified:boolean;target:{validFrom:string};warnings:string[]}}>((resolve,reject)=>{
      const child=spawn(process.execPath,["--import",path.join(repo,"node_modules/tsx/dist/loader.mjs"),"--import",path.join(repo,"lib/__tests__/fixtures/content-check-fetch.mjs"),path.join(repo,"scripts/content-weekly.ts"),options.prepare?"--prepare":"--check","--now",now,"--url","http://127.0.0.1:39001",...(options.week?["--week",options.week]:[])],{cwd:f.root,env:{...process.env,TSX_TSCONFIG_PATH:path.join(repo,"tsconfig.json")}});
      let stdout="",stderr="";child.stdout.on("data",chunk=>stdout+=chunk);child.stderr.on("data",chunk=>stderr+=chunk);child.on("error",reject);child.on("close",code=>{try{resolve({code,report:JSON.parse(stdout)});}catch{reject(new Error(stderr));}});
    });
  } finally {await rm(f.root,{recursive:true,force:true});}
}
describe("bound weekly CLI completeness",()=>{
  it("checks both originals, all three content APIs, legacy GET, products and category while provider hosts are blocked",async()=>{
    const result=await runBoundCheck();expect(result.code).toBe(0);expect(result.report.errors).toEqual([]);expect(result.report.websiteVerified).toBe(true);expect(result.report.deploymentVerified).toBe(false);
  });
  it.each(["/handzettel/2026-10-05/de.pdf","/handzettel/2026-10-05/nl.pdf","/images/content/2026-10-05/de.webp","/images/offers/de-2026-10-05-p2.webp"])("rejects changed GET bytes despite exact API metadata: %s",async corrupt=>{
    const result=await runBoundCheck({corrupt});expect(result.code).toBe(1);expect(result.report.errors.some(e=>/Prüfsumme/.test(e))).toBe(true);expect(result.report.websiteVerified).toBe(false);expect(result.report.deploymentVerified).toBe(false);
  });
  it("rejects a wrong GET content type even for correct bytes",async()=>{
    const result=await runBoundCheck({badType:true});expect(result.code).toBe(1);expect(result.report.websiteVerified).toBe(false);
  });
  it.each([{missingOffer:true},{wrongHash:true},{badLegacy:true},{missingCard:true},{missingLink:true}])("rejects incomplete published contract: %j",async options=>{
    const result=await runBoundCheck(options);expect(result.code).toBe(1);expect(result.report.websiteVerified).toBe(false);
  });
  it("preserves verified DE partial availability but fails missing required NL",async()=>{
    const result=await runBoundCheck({missingNl:true});expect(result.code).toBe(1);expect(result.report.sources.some(e=>e.language==="de")).toBe(true);expect(result.report.errors.some(e=>/NL/.test(e))).toBe(true);
  });
  it("does not turn source-only historical evidence into a public week",async()=>{
    const result=await runBoundCheck({sourceOnly:true});expect(result.code).toBe(1);expect(result.report.sources).toEqual([]);
  });
  it("accepts the regular empty Sunday state",async()=>{
    const result=await runBoundCheck({now:"2026-10-11T12:00:00Z",empty:true});expect(result.code).toBe(0);expect(result.report.errors).toEqual([]);expect(result.report.websiteVerified).toBe(true);
  });
  it.each([
    "/handzettel/2026-10-05/de.pdf?download=1",
    "http://127.0.0.1:39001/handzettel/2026-10-05/de.pdf",
  ])("passes the actual checked origin into expired Sunday link verification: %s",async staleLink=>{
    const result=await runBoundCheck({now:"2026-10-11T12:00:00Z",empty:true,staleLink});
    expect(result.code).toBe(1);expect(result.report.websiteVerified).toBe(false);expect(result.report.errors.some(e=>/abgelaufener lokaler Wochenflyer/.test(e))).toBe(true);
  });
  it("demands the complete following week for Sunday preparation",async()=>{
    const result=await runBoundCheck({now:"2026-10-11T15:00:00Z",prepare:true});expect(result.code).toBe(1);expect(result.report.target.validFrom).toBe("2026-10-12");
  });
  it("fails a missing explicitly required Monday even with a Sunday test clock",async()=>{
    const result=await runBoundCheck({now:"2026-10-11T12:00:00Z",week:"2026-10-12",empty:true});expect(result.code).toBe(1);
  });
});
