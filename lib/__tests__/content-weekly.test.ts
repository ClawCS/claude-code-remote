import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
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
async function runCheck(now:string, options:{nl?:boolean;kw40?:boolean;prepare?:boolean;dates?:{validFrom:string;validTo:string};publication?:"valid"|"missing-home-nl"|"missing-nl-page-cover"|"corrupt-bytes"}={}) {
  const root=await mkdtemp(path.join(tmpdir(),"jammers-weekly-check-"));
  try {
    await mkdir(path.join(root,"data/editorial/official-catalogs"),{recursive:true});
    const catalog=JSON.parse(await readFile(path.join(repo,options.kw40?"data/editorial/official-catalogs/2026-09-28.json":"e2e/fixtures/handzettel-cache.json"),"utf8"));
    if(options.kw40) catalog.validTo="2026-10-02";
    await writeFile(path.join(root,"data/editorial/official-catalogs",`${catalog.validFrom}.json`),JSON.stringify(catalog));
    let nlPackage;
    if (options.nl) {
      const document=await PDFDocument.create();document.addPage();
      const pdf=Buffer.from(await document.save());const cover=await sharp({create:{width:64,height:64,channels:3,background:"white"}}).webp().toBuffer();
      nlPackage={id:"nl-2026-07-13",language:"nl",title:"Aanbiedingen",validFrom:catalog.validFrom,validTo:options.kw40?"2026-10-02":"2026-07-18",sourceUrl:"https://www.canva.com/design/test/view",designId:"test",pageNumbers:[14],rightsStatus:"approved",exportedAt:"2026-07-12T15:00:00Z",pdfPath:"/handzettel/2026/nl.pdf",coverPath:"/images/content/nl.webp",pdfSha256:createHash("sha256").update(pdf).digest("hex"),coverSha256:createHash("sha256").update(cover).digest("hex"),...options.dates};
      await mkdir(path.join(root,"public/handzettel/2026"),{recursive:true});await mkdir(path.join(root,"public/images/content"),{recursive:true});
      await writeFile(path.join(root,"public",nlPackage.pdfPath),pdf);await writeFile(path.join(root,"public",nlPackage.coverPath),cover);
    }
    await writeFile(path.join(root,"data/editorial/flyers.json"),JSON.stringify(nlPackage?[nlPackage]:[]));
    await writeFile(path.join(root,"data/editorial/source-config.json"),JSON.stringify({publicUrl:null}));
    if (options.publication) {
      const de=options.kw40?{id:"catalog-13027-40-2026",language:"de",title:"Angebote der Woche",validFrom:"2026-09-28",validTo:"2026-10-02",viewerUrl:"https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest",pdfUrl:"https://werbung.trinkgut.de/frontend/catalogs/1384969/4/pdf/complete.pdf",pageCount:18,coverUrl:"https://werbung.trinkgut.de/frontend/mvc/api/catalogs/1384969/v4/normal/bk_1.jpg",sourceUrl:"https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest"}:{id:"catalog-13027-29-2026",language:"de",title:"Angebote der Woche",validFrom:"2026-07-13",validTo:"2026-07-18",viewerUrl:"https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest",pdfUrl:"https://werbung.trinkgut.de/frontend/catalogs/1335913/2/pdf/complete.pdf",pageCount:10,coverUrl:"https://werbung.trinkgut.de/frontend/mvc/api/catalogs/1335913/v2/normal/bk_1.jpg",sourceUrl:"https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest"};
      const nl={id:"nl-2026-07-13",language:"nl",title:"Aanbiedingen",validFrom:options.kw40?"2026-09-28":"2026-07-13",validTo:options.dates?.validTo??(options.kw40?"2026-10-02":"2026-07-18"),viewerUrl:"/handzettel/2026/nl.pdf",pdfUrl:"/handzettel/2026/nl.pdf",pageCount:1,coverUrl:"/images/content/nl.webp",sourceUrl:"/handzettel/2026/nl.pdf"};
      const deHtml=options.kw40?'<a href="https://werbung.trinkgut.de/frontend/catalogs/1384969/4/pdf/complete.pdf">DE PDF</a><img src="https://werbung.trinkgut.de/frontend/mvc/api/catalogs/1384969/v4/normal/bk_1.jpg" />':'<a href="https://werbung.trinkgut.de/frontend/catalogs/1335913/2/pdf/complete.pdf">DE PDF</a><img src="https://werbung.trinkgut.de/frontend/mvc/api/catalogs/1335913/v2/normal/bk_1.jpg" />';
      const nlLink='<a href="/handzettel/2026/nl.pdf">NL PDF</a>';const nlCover='<img src="/_next/image?url=%2Fimages%2Fcontent%2Fnl.webp&amp;w=640&amp;q=75" />';
      const both=deHtml+nlLink+nlCover;
      await writeFile(path.join(root,"test-published.json"),JSON.stringify({current:{flyer:de,nlFlyer:options.publication==="missing-home-nl"?null:nl},index:{status:"ok",flyers:[de,nl]},pages:{"/":'<section id="aktuell">'+both+'</section>',"/angebote":both,"/handzettel":both,"/nl":options.publication==="missing-nl-page-cover"?deHtml+nlLink:both},corruptBytes:options.publication==="corrupt-bytes"}));
    }
    return await new Promise<{code:number|null;report:{status:string;target:{validFrom:string;validTo:string};sources:{source:string;validTo:string}[];errors:string[];warnings:string[];deploymentVerified:boolean;websiteVerified?:boolean}}>((resolve,reject)=>{
      const child=spawn(process.execPath,["--import",path.join(repo,"node_modules/tsx/dist/loader.mjs"),"--import",path.join(repo,"lib/__tests__/fixtures/content-check-fetch.mjs"),path.join(repo,"scripts/content-weekly.ts"),options.prepare?"--prepare":"--check","--now",now,...(options.publication?["--url","http://127.0.0.1:39001"]:[])],{cwd:root,env:{...process.env,TSX_TSCONFIG_PATH:path.join(repo,"tsconfig.json")}});
      let stdout="",stderr="";child.stdout.on("data",chunk=>stdout+=chunk);child.stderr.on("data",chunk=>stderr+=chunk);child.on("error",reject);
      child.on("close",code=>{try{resolve({code,report:JSON.parse(stdout)});}catch{reject(new Error(`CLI returned no report: ${stderr}`));}});
    });
  } finally {await rm(root,{recursive:true,force:true});}
}
describe("weekly CLI completeness",()=>{
  it("does not demand expired KW40 offers on October 3",async()=>{
    const result=await runCheck("2026-10-03T12:00:00Z",{kw40:true});
    expect(result.code).toBe(0);expect(result.report.errors).toEqual([]);
  });
  it.each(["2026-10-02","2026-10-03"])("accepts a KW40 NL source ending %s without changing its dates",async validTo=>{
    const result=await runCheck("2026-09-30T12:00:00Z",{kw40:true,nl:true,dates:{validFrom:"2026-09-28",validTo}});
    expect(result.code).toBe(0);expect(result.report.errors).toEqual([]);expect(result.report.sources.find(source=>source.source==="canva")?.validTo).toBe(validTo);
  });
  it("verifies the printed KW40 Friday date on the published homepage API",async()=>{
    const result=await runCheck("2026-09-30T12:00:00Z",{kw40:true,nl:true,publication:"valid"});
    expect(result.code).toBe(0);expect(result.report.websiteVerified).toBe(true);expect(result.report.errors).toEqual([]);
  });
  it("continues failing today when the corrected DE source is present but NL is not",async()=>{
    const result=await runCheck("2026-09-30T12:00:00Z",{kw40:true});
    expect(result.code).toBe(1);expect(result.report.errors).toHaveLength(1);expect(result.report.errors[0]).toContain("NL");
  });
  it("does not publish a Friday-ending NL source on the following Saturday",async()=>{
    const result=await runCheck("2026-10-03T12:00:00Z",{kw40:true,nl:true});
    expect(result.code).toBe(0);expect(result.report.errors).toEqual([]);expect(result.report.sources).toEqual([]);
  });
  it("still demands both sources for next week at Sunday 17:00 Berlin",async()=>{
    const result=await runCheck("2026-10-04T15:00:00Z",{kw40:true,prepare:true});
    expect(result.report.target).toEqual({validFrom:"2026-10-05",validTo:"2026-10-10"});expect(result.code).toBe(1);
    expect(result.report.errors.some(message=>/Offizieller Handzettel/.test(message))).toBe(true);expect(result.report.errors.some(message=>/Pflicht-NL/.test(message))).toBe(true);
  });
  it("fails nonzero when DE is valid but the mandatory NL page is missing",async()=>{
    const result=await runCheck("2026-07-14T12:00:00Z");
    expect(result.code).toBe(1);expect(result.report.status).toBe("failed");expect(result.report.errors.some(message=>/NL/.test(message))).toBe(true);expect(result.report.deploymentVerified).toBe(false);
  });
  it("does not demand an active NL or DE issue on Sunday",async()=>{
    const result=await runCheck("2026-07-19T12:00:00Z");
    expect(result.code).toBe(0);expect(result.report.errors).toEqual([]);expect(result.report.warnings.some(message=>/NL/.test(message))).toBe(false);
  });
  it("accepts a verified one-page NL issue for the exact full week",async()=>{
    const result=await runCheck("2026-07-14T12:00:00Z",{nl:true});
    expect(result.code).toBe(0);expect(result.report.errors).toEqual([]);expect(result.report.deploymentVerified).toBe(false);
  });
  it.each([{validFrom:"2026-07-14",validTo:"2026-07-18"},{validFrom:"2026-07-13",validTo:"2026-07-17"},{validFrom:"2026-07-20",validTo:"2026-07-25"}])("fails a real CLI run for wrong or partial NL dates: %j",async dates=>{
    const result=await runCheck("2026-07-14T12:00:00Z",{nl:true,dates});
    expect(result.code).toBe(1);expect(result.report.errors.some(message=>/NL/.test(message))).toBe(true);
  });
  it("verifies both deployed flyer slots, all four routes and original bytes without calling a preview production",async()=>{
    const result=await runCheck("2026-07-14T12:00:00Z",{nl:true,publication:"valid"});
    expect(result.code).toBe(0);expect(result.report.errors).toEqual([]);expect(result.report.websiteVerified).toBe(true);expect(result.report.deploymentVerified).toBe(false);
  });
  it("fails when the published homepage API silently drops the NL slot",async()=>{
    const result=await runCheck("2026-07-14T12:00:00Z",{nl:true,publication:"missing-home-nl"});
    expect(result.code).toBe(1);expect(result.report.errors.some(message=>/Homepage.*niederländischen/.test(message))).toBe(true);
  });
  it("fails when the Dutch route drops the NL cover despite correct published metadata",async()=>{
    const result=await runCheck("2026-07-14T12:00:00Z",{nl:true,publication:"missing-nl-page-cover"});
    expect(result.code).toBe(1);expect(result.report.errors.some(message=>/NL.*Vorschaubild.*\/nl/.test(message))).toBe(true);
  });
  it("fails when the published NL PDF bytes no longer match the approved local export",async()=>{
    const result=await runCheck("2026-07-14T12:00:00Z",{nl:true,publication:"corrupt-bytes"});
    expect(result.code).toBe(1);expect(result.report.errors.some(message=>/Prüfsumme.*nl.pdf/.test(message))).toBe(true);
  });
});
