import { readFile, rm } from "node:fs/promises";
import * as fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { supplementalPublicationFixture } from "./fixtures/supplemental-publication";
import { sha256 } from "./fixtures/weekly-publication";
import { assembleSupplementalPublication as assemble } from "../supplemental-publication-import";
import { buildWeeklyOffers } from "../../scripts/build-weekly-offers";

vi.mock("node:fs/promises",async importOriginal=>({...await importOriginal<typeof import("node:fs/promises")>()}));

const roots:string[]=[];
afterEach(async()=>{vi.restoreAllMocks();await Promise.all(roots.splice(0).map(root=>rm(root,{recursive:true,force:true})));});
async function fixture(){const f=await supplementalPublicationFixture("2026-10-05","2026-10-18");roots.push(f.root);return f;}
describe("independent supplemental assembly",()=>{
  it("copies an exact private original to a new immutable public path only after candidate verification",async()=>{
    const f=await fixture(),pdfPath="/handzettel/2026/maasduinen-synthetic-new.pdf";
    f.supplementalSource.privatePdf="assets/private/supplement.pdf";f.supplementalSource.publishedPdfPath=pdfPath;
    f.supplementalFlyer.pdfPath=pdfPath;f.supplementalOffer.sourceUrl=pdfPath;
    await f.write(f.supplementalSource.privatePdf,f.pdfs[1]);await f.save();
    await expect(readFile(path.join(f.root,`public${pdfPath}`))).rejects.toThrow();
    const result=await assemble(f.supplemental.edition.id,f.root);
    expect(result.edition.pdf.path).toBe(pdfPath);expect(await readFile(path.join(f.root,`public${pdfPath}`))).toEqual(f.pdfs[1]);
    expect((await buildWeeklyOffers(f.root,["--check"])).count).toBe(4);
  });
  it("reassembles idempotently without changing same-date weekly bindings or rows",async()=>{
    const f=await fixture(),weekly=path.join(f.root,"data/editorial/weekly-publications/2026-10-05.json"),manifest=path.join(f.root,`data/editorial/supplemental-publications/${f.supplemental.edition.id}.json`);
    const before=await readFile(weekly),rows=await readFile(path.join(f.root,"data/weekly-offers.json"));
    const first=await assemble(f.supplemental.edition.id,f.root);
    expect(first.edition.identity).toEqual({language:"nl",purpose:"supplemental",medium:"maasduinen"});
    const bound=await readFile(manifest);await assemble(f.supplemental.edition.id,f.root);
    expect(await readFile(manifest)).toEqual(bound);expect(await readFile(weekly)).toEqual(before);expect(await readFile(path.join(f.root,"data/weekly-offers.json"))).toEqual(rows);
  });
  it("resolves the exact typed Canva original reference independently of the supplemental edition ID",async()=>{
    const f=await fixture();f.supplementalFlyer.id="canva-original-row";
    f.supplementalFlyer.source={kind:"canva",flyerId:"canva-original-row"};f.supplementalSource.source=f.supplementalFlyer.source;f.supplemental.edition.source=f.supplementalFlyer.source;await f.save();
    const result=await assemble(f.supplemental.edition.id,f.root);
    expect(result.edition.id).toBe("maasduinen-synthetic");expect(result.edition.source).toEqual({kind:"canva",flyerId:"canva-original-row"});
  });
  it("keeps the earlier manifest after candidate census failure",async()=>{
    const f=await fixture(),manifest=path.join(f.root,`data/editorial/supplemental-publications/${f.supplemental.edition.id}.json`),before=await readFile(manifest);
    f.supplementalSource.pages[0].expectedOffers=2;await f.save();
    await expect(assemble(f.supplemental.edition.id,f.root)).rejects.toThrow(/census/);expect(await readFile(manifest)).toEqual(before);
  });
  it("rejects a changed original at its already bound path even when input hashes are resealed",async()=>{
    const f=await fixture(),manifest=path.join(f.root,`data/editorial/supplemental-publications/${f.supplemental.edition.id}.json`),before=await readFile(manifest);
    const doc=await PDFDocument.load(f.pdfs[1]);doc.setTitle("Synthetic changed original");const bytes=await doc.save(),checksum=sha256(bytes);
    f.supplementalSource.pdfSha256=checksum;f.supplementalFlyer.pdfSha256=checksum;f.supplementalOffer.pdfSha256=checksum;await f.save();await f.write(`public${f.supplemental.edition.pdf.path}`,bytes);
    await expect(assemble(f.supplemental.edition.id,f.root)).rejects.toThrow(/new unique published path/);expect(await readFile(manifest)).toEqual(before);
  });
  it("shares the existing durable transaction lock",async()=>{
    const f=await fixture();await f.write("data/editorial/.weekly-offers.lock","interrupted");
    await expect(assemble(f.supplemental.edition.id,f.root)).rejects.toThrow(/transaction|preparation/i);
  });
  it("rejects an edition ID already declared by the weekly register",async()=>{
    const f=await fixture();f.publication.editions[1].id=f.supplemental.edition.id;await f.save();
    await expect(assemble(f.supplemental.edition.id,f.root)).rejects.toThrow(/duplicate edition ID/);
  });
  it("retains a durable marker if atomic manifest binding fails",async()=>{
    const f=await fixture(),manifest=path.join(f.root,`data/editorial/supplemental-publications/${f.supplemental.edition.id}.json`),before=await readFile(manifest);
    const rename=fs.rename;
    vi.spyOn(fs,"rename").mockImplementation(async(source,target)=>{if(String(target)===manifest)throw new Error("Injected supplemental binding failure");await rename(source,target);});
    await expect(assemble(f.supplemental.edition.id,f.root)).rejects.toThrow("Injected supplemental binding failure");
    expect(await readFile(manifest)).toEqual(before);expect(await fs.stat(path.join(f.root,"data/editorial/.weekly-offers.lock"))).toBeDefined();
    await expect(buildWeeklyOffers(f.root,["--check"])).rejects.toThrow(/transaction|preparation/i);
  });
});
