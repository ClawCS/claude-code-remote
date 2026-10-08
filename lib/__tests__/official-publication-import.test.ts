import { readFile, rm, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { afterEach, describe, expect, it } from "vitest";
import * as importer from "../official-publication-import";
import type { HandzettelCache } from "../handzettel-catalog";
import { loadWeeklyPublications } from "../weekly-publication";
import { sha256, weeklyPublicationFixture } from "./fixtures/weekly-publication";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
async function fixture() { const f = await weeklyPublicationFixture(); roots.push(f.root); return f; }
describe("official original import", () => {
  it("keeps complete immutable bytes privately and exposes only future content-addressed paths", async () => {
    const f = await fixture();
    const cover = await sharp(f.image).jpeg().toBuffer();
    const result = await importer.importOfficialPublication(f.catalog as HandzettelCache, { root: f.root,
      fetchImpl: async url => new Response(String(url).endsWith(".pdf") ? f.pdfs[0] : cover, {
        headers: { "content-type": String(url).endsWith(".pdf") ? "application/pdf" : "image/jpeg" },
      }),
    });
    expect(result.pdf.path).toMatch(/^\/handzettel\/2026\/de-2026-10-05-[a-f0-9]{64}\.pdf$/);
    expect(result.cover.path).toMatch(/^\/images\/content\/de-2026-10-05-[a-f0-9]{64}\.jpg$/);
    expect(await readFile(path.join(result.stagingDirectory, "original.pdf"))).toEqual(f.pdfs[0]);
    expect(await readFile(path.join(result.stagingDirectory, "cover.jpg"))).toEqual(cover);
    await expect(readFile(path.join(f.root, `public${result.pdf.path}`))).rejects.toThrow();
  });
  it.each(["redirect", "html", "pages", "truncated", "truncated-pdf", "oversized-header", "oversized-stream", "corrupt-cover"])("rejects %s before publishing or binding catalog metadata", async mode => {
    const f = await fixture(); const previous = await readFile(path.join(f.root, "data/editorial/weekly-publications/2026-10-05.json"));
    const cover = await sharp(f.image).jpeg().toBuffer();
    const fetchImpl: typeof fetch = async url => {
      const pdf = String(url).endsWith(".pdf");
      if (mode === "redirect") return new Response(null, { status: 302, headers: { location: "https://foreign.invalid/source.pdf" } });
      if (mode === "html") return new Response("<html>error</html>", { headers: { "content-type": "text/html" } });
      if (mode === "oversized-stream") return new Response(new ReadableStream({ start(controller) { for (let i=0;i<51;i++) controller.enqueue(new Uint8Array(1024*1024)); controller.close(); } }), { headers: { "content-type": "application/pdf" } });
      const bytes = pdf ? mode === "pages" ? f.pdfs[1] : mode === "truncated-pdf" ? f.pdfs[0].subarray(0,-5) : f.pdfs[0] : mode === "corrupt-cover" ? Buffer.from("broken") : cover;
      return new Response(bytes, { headers: { "content-type": pdf ? "application/pdf" : "image/jpeg", ...(mode === "truncated" ? { "content-length": String(bytes.length + 1) } : {}), ...(mode === "oversized-header" ? { "content-length": String(51*1024*1024) } : {}) } });
    };
    await expect(importer.importOfficialPublication(f.catalog as HandzettelCache, { root: f.root, fetchImpl })).rejects.toThrow();
    expect(await readFile(path.join(f.root, "data/editorial/weekly-publications/2026-10-05.json"))).toEqual(previous);
  });
});

describe("weekly assembly", () => {
  it("verifies both complete language packages and repeats without changing manifest bytes", async () => {
    const f = await fixture();
    const first = await importer.assembleWeeklyPublication("2026-10-05", f.root);
    expect(first.editions.map(item => item.language)).toEqual(["de", "nl"]);
    const before = await readFile(path.join(f.root, "data/editorial/weekly-publications/2026-10-05.json"));
    await importer.assembleWeeklyPublication("2026-10-05", f.root);
    expect(await readFile(path.join(f.root, "data/editorial/weekly-publications/2026-10-05.json"))).toEqual(before);
  });
  it("failedPreparationPreservesPreviousManifest when the reviewed cover differs", async () => {
    const f = await fixture(); const file = path.join(f.root, "data/editorial/weekly-publications/2026-10-05.json");
    const before = await readFile(file); Object.assign(f.sources[0], { coverSha256: "a".repeat(64) }); await f.save(); await f.write("data/editorial/weekly-publications/2026-10-05.json", before);
    await expect(importer.assembleWeeklyPublication("2026-10-05", f.root)).rejects.toThrow();
    expect(await readFile(file)).toEqual(before);
  });
  it("assembles a reviewed saved DE original with an editorial privateCover and no download", async () => {
    const f = await fixture();
    await f.write("private/original.pdf", f.pdfs[0]); await f.write("private/cover.webp", f.image);
    Object.assign(f.sources[0], { privatePdf: "private/original.pdf", privateCover: "private/cover.webp", publishedPdfPath: `/handzettel/2026/de-2026-10-05-${f.editions[0].pdf.sha256}.pdf` });
    const rows = f.offers.map(row => row.language === "de" ? {...row, sourceUrl: f.sources[0].publishedPdfPath} : row);
    await f.save(); await f.write("data/weekly-offers.json", JSON.stringify(rows));
    await unlink(path.join(f.root, "data/editorial/weekly-publications/2026-10-05.json"));
    const publication = await importer.assembleWeeklyPublication("2026-10-05", f.root);
    expect(publication.editions).toHaveLength(2);
    expect(await readFile(path.join(f.root, `public${publication.editions[0].pdf.path}`))).toEqual(f.pdfs[0]);
    expect(JSON.stringify(publication)).not.toContain("private/");
  });
  it("makes an isolated DE package available when NL is absent", async () => {
    const f = await fixture(); f.sources.splice(1); f.offers.splice(2); await f.save();
    const result = await importer.assembleWeeklyPublication("2026-10-05", f.root);
    expect(result.editions.map(edition => edition.language)).toEqual(["de"]);
  });
  it("assembles the canonical public offer hash despite reordered JSON object keys", async () => {
    const f=await fixture(); f.offers[0]=Object.fromEntries(Object.entries(f.offers[0]).reverse()) as typeof f.offers[number]; await f.save();
    expect((await importer.assembleWeeklyPublication("2026-10-05",f.root)).editions).toHaveLength(2);
  });
  it("copies reviewed staging originals and keeps identical bound catalog bytes on a newer fetch", async () => {
    const f=await fixture(); const cover=await sharp(f.image).jpeg().toBuffer();
    const before=await readFile(path.join(f.root,"data/editorial/official-catalogs/2026-10-05.json"));
    const reordered=Object.fromEntries(Object.entries({...f.catalog,fetchedAt:"2026-10-08T12:00:00.000Z"}).reverse()) as unknown as HandzettelCache;
    const imported=await importer.importOfficialPublication(reordered,{root:f.root,fetchImpl:async url=>new Response(String(url).endsWith(".pdf")?f.pdfs[0]:cover,{headers:{"content-type":String(url).endsWith(".pdf")?"application/pdf":"image/jpeg"}})});
    Object.assign(f.sources[0],{privatePdf:path.relative(f.root,path.join(imported.stagingDirectory,"original.pdf")),publishedPdfPath:imported.pdf.path,coverSha256:imported.cover.sha256});
    for(const row of f.offers) if(row.language==="de") row.sourceUrl=imported.pdf.path;
    await f.save();
    const publication=await importer.assembleWeeklyPublication("2026-10-05",f.root);
    expect(publication.editions[0].cover.path).toBe(imported.cover.path);
    expect(await readFile(path.join(f.root,`public${imported.pdf.path}`))).toEqual(f.pdfs[0]);
    expect(await readFile(path.join(f.root,"data/editorial/official-catalogs/2026-10-05.json"))).toEqual(before);
  });
  it("blocks assembly while an interrupted offer write lock remains",async()=>{
    const f=await fixture();await f.write("data/editorial/.weekly-offers.lock","interrupted");
    await expect(importer.assembleWeeklyPublication("2026-10-05",f.root)).rejects.toThrow();
  });
  it.each(["corrupt","missing"])("binds a fresh verified DE partial while rejecting a %s present NL original",async mode=>{
    const f=await fixture();const manifest=path.join(f.root,"data/editorial/weekly-publications/2026-10-05.json");await unlink(manifest);
    Object.assign(f.sources[0],{privateCover:`public${f.editions[0].cover.path}`});await f.write("data/weekly-offer-layout.json",JSON.stringify({sources:f.sources}));
    if(mode==="corrupt")await f.write(`public${f.editions[1].pdf.path}`,"corrupt original");else await unlink(path.join(f.root,`public${f.editions[1].pdf.path}`));
    await expect(importer.assembleWeeklyPublication("2026-10-05",f.root)).rejects.toMatchObject({publication:{editions:[expect.objectContaining({language:"de"})]},issues:[expect.objectContaining({language:"nl"})],bound:true});
    expect(JSON.parse((await readFile(manifest)).toString()).editions.map((edition:{language:string})=>edition.language)).toEqual(["de"]);
    expect((await loadWeeklyPublications(f.root)).editions.map(item=>item.edition.language)).toEqual(["de"]);
  });
  it("preserves prior binding bytes when an NL replacement fails while its DE sibling verifies",async()=>{
    const f=await fixture();const manifest=path.join(f.root,"data/editorial/weekly-publications/2026-10-05.json");const before=await readFile(manifest);
    await f.write(`public${f.editions[1].pdf.path}`,"corrupt original");
    await expect(importer.assembleWeeklyPublication("2026-10-05",f.root)).rejects.toMatchObject({publication:{editions:[expect.objectContaining({language:"de"})]},bound:false});
    expect(await readFile(manifest)).toEqual(before);
    expect((await loadWeeklyPublications(f.root)).editions.map(item=>item.edition.language)).toEqual(["de"]);
  });
  it("requires a new path for a changed NL original even if an editor already replaced its local bytes",async()=>{
    const f=await fixture();const manifest=path.join(f.root,"data/editorial/weekly-publications/2026-10-05.json");const before=await readFile(manifest);
    const document=await PDFDocument.load(f.pdfs[1]);document.setTitle("Changed reviewed version");const bytes=await document.save();const checksum=sha256(bytes);
    f.sources[1].pdfSha256=checksum;f.flyer.pdfSha256=checksum;f.offers[2].pdfSha256=checksum;await f.save();await f.write(`public${f.editions[1].pdf.path}`,bytes);
    await expect(importer.assembleWeeklyPublication("2026-10-05",f.root)).rejects.toMatchObject({bound:false,issues:[expect.objectContaining({language:"nl"})]});
    expect(await readFile(manifest)).toEqual(before);
  });
});

const repo = process.cwd();
async function generator(root: string, args: string[]) {
  return new Promise<{code:number|null; stderr:string}>((resolve,reject) => {
    const child = spawn(process.execPath, ["--import", path.join(repo,"node_modules/tsx/dist/loader.mjs"), path.join(repo,"scripts/build-weekly-offers.ts"), ...args], {cwd:root,env:{...process.env,TSX_TSCONFIG_PATH:path.join(repo,"tsconfig.json")}});
    let stderr=""; child.stderr.on("data",chunk=>stderr+=chunk); child.on("error",reject); child.on("close",code=>resolve({code,stderr}));
  });
}
describe("multi-week offer generation", () => {
  it.each([{args:["--week","2026-10-05","--week","2026-10-12"]},{args:["--week","2026-10-06"]},{args:["--week","2026-02-30"]},{args:["--force"]}])("rejects invalid options before replacing rows: %j", async ({args}) => {
    const f = await fixture(); const before = await readFile(path.join(f.root,"data/weekly-offers.json"));
    expect((await generator(f.root,args)).code).toBe(1);
    expect(await readFile(path.join(f.root,"data/weekly-offers.json"))).toEqual(before);
  });
  it.each([false,true])("preparingNextWeekPreservesCurrentOffers and fingerprints new derivatives (missing NL: %s)", async missingNl => {
    const current=await fixture(); const next=await weeklyPublicationFixture("2026-10-12","2026-10-17","1399999"); roots.push(next.root);
    if(missingNl)next.sources.splice(1);
    Object.assign(next.sources[0],{privateCover:`public${next.editions[0].cover.path}`});
    for (const source of next.sources) for (const page of source.pages) for (const offer of page.offers) delete (offer as {imagePath?:string}).imagePath;
    for (const edition of next.editions) for (const asset of [edition.pdf,edition.cover]) await current.write(`public${asset.path}`,await readFile(path.join(next.root,`public${asset.path}`)));
    const sources=[...current.sources,...next.sources];
    await current.write("data/weekly-offer-layout.json",JSON.stringify({week:"2026-10-05",sources}));
    const result=await generator(current.root,["--week","2026-10-12"]);
    expect(result).toEqual({code:0,stderr:""});
    const rows=JSON.parse(await readFile(path.join(current.root,"data/weekly-offers.json"),"utf8"));
    expect(rows.filter((row:{validFrom:string})=>row.validFrom==="2026-10-05")).toEqual(current.offers);
    expect(rows.filter((row:{validFrom:string})=>row.validFrom==="2026-10-12").every((row:{image:string})=> /-[a-f0-9]{64}\.webp$/.test(row.image))).toBe(true);
    const before=await readFile(path.join(current.root,"data/weekly-offers.json"));
    expect((await generator(current.root,["--week","2026-10-12"])).code).toBe(0);
    expect(await readFile(path.join(current.root,"data/weekly-offers.json"))).toEqual(before);
    expect((await generator(current.root,["--check"])).code).toBe(0);
    await current.write("data/editorial/official-catalogs/2026-10-12.json",JSON.stringify(next.catalog));
    await current.write("data/editorial/flyers.json",JSON.stringify([current.flyer,...(!missingNl?[next.flyer]:[])]));
    const manifestBefore=await readFile(path.join(current.root,"data/editorial/weekly-publications/2026-10-05.json"));
    const publication=await importer.assembleWeeklyPublication("2026-10-12",current.root);
    expect(publication.editions.map(edition=>edition.language)).toEqual(missingNl?["de"]:["de","nl"]);
    expect(await readFile(path.join(current.root,"data/editorial/weekly-publications/2026-10-05.json"))).toEqual(manifestBefore);
  });
  it("rejects missing original-page coverage without changing any existing rows", async () => {
    const f=await fixture(); f.sources[0].pages.splice(1); await f.save();
    const before=await readFile(path.join(f.root,"data/weekly-offers.json"));
    expect((await generator(f.root,["--week","2026-10-05"])).code).toBe(1);
    expect(await readFile(path.join(f.root,"data/weekly-offers.json"))).toEqual(before);
  });
  it.each(["range","crop"])("rejects %s metadata even when public rows mirror the invalid layout",async mode=>{
    const f=await fixture();
    if(mode==="range") { f.sources[0].validTo="2026-10-09";f.sources[0].printedValidTo="2026-10-09";for(const row of f.offers)if(row.language==="de")row.validTo="2026-10-09"; }
    else {f.sources[0].pages[0].offers[0].rect[0]=-1;f.offers[0].rect[0]=-1;}
    await f.save(); const before=await readFile(path.join(f.root,"data/weekly-offers.json"));
    expect((await generator(f.root,["--check"])).code).toBe(1);
    expect(await readFile(path.join(f.root,"data/weekly-offers.json"))).toEqual(before);
  });
  it("retains explicit zero-priced-offer pages in the full page census",async()=>{
    const f=await fixture(); f.sources[0].pages[1].offers=[];f.sources[0].pages[1].expectedOffers=0;f.offers.splice(1,1);await f.save();
    expect((await generator(f.root,["--week","2026-10-05"])).code).toBe(0);
    expect((await generator(f.root,["--check"])).code).toBe(0);
  });
  it("blocks a multi-page NL original even when layout and local PDF page count agree",async()=>{
    const f=await fixture();Object.assign(f.sources[1],{privatePdf:f.sources[0].privatePdf,pdfSha256:f.sources[0].pdfSha256,pageCount:2});
    f.sources[1].pages.push({...f.sources[1].pages[0],page:2,expectedOffers:0,offers:[]});f.offers[2].pdfSha256=f.sources[0].pdfSha256;await f.save();
    expect((await generator(f.root,["--check"])).code).toBe(1);
  });
});
