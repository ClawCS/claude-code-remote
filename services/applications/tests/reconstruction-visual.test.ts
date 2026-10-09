import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { createLocalDiagnosticRaster, decodePpm } from "../src/raster-process";
import { createLocalDiagnosticSourceInspector } from "../src/parser-process";
import { createLocalGeneratedOutputVerifier } from "../src/generated-output-policy";
import { withReconstructedDocuments } from "../src/reconstruction";
import { encodeRaster } from "../src/image-encoder";
import { utcInstant } from "../src/types";
import { duplicateDefinitionPdf, fixture, requireQpdfTestExecutable, snapshot, staticPdf } from "./fixtures/synthetic";
import { blank, imageFrame, requirePopplerTestExecutable, visualPdf } from "./fixtures/reconstruction";
import { createPdfReconstruction } from "../src/pdf-reconstruction";
import { PDFDocument, degrees } from "pdf-lib";
let root: string, qpdf: string, poppler: string;
beforeAll(() => { qpdf = requireQpdfTestExecutable(); poppler = requirePopplerTestExecutable(); });
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), "reconstruction-visual-")); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });
const visuals = resolve(".superpowers/sdd/2026-10-09-application-document-reconstruction/visual");
describe("real local synthetic rendering - not Linux or AV qualification", () => {
  it("strictly rejects oversized, incomplete, trailing or non-RGB PPM", () => {
    expect([...decodePpm(Buffer.concat([Buffer.from("P6\n1 1\n255\n"), Buffer.from([0,10,255])])).pixels]).toEqual([0,10,255]);
    expect([...decodePpm(Buffer.concat([Buffer.from("P6\n1 1\n255\n"), Buffer.from([10,32,35])])).pixels]).toEqual([10,32,35]); // Pixel whitespace/'#' is not a header separator/comment.
    for (const bytes of [Buffer.from("P6\n9000 1\n255\n"), Buffer.from("P6\n1 1\n255\nxx"), Buffer.from("P6\n1 1\n255\nxxxx"), Buffer.from("P5\n1 1\n255\nxxx")]) expect(() => decodePpm(bytes)).toThrow();
  });
  it("reconstructs/render-checks all four pages, crop/rotation and real blank, without source objects", async () => {
    await mkdir(visuals, { recursive: true }); const sourceBytes = await visualPdf(); await writeFile(join(visuals, "synthetic-source.pdf"), sourceBytes);
    const source = await fixture(root, sourceBytes), frames: { width: number; height: number }[] = [];
    const sourcePixels: Uint8Array[]=[];
    await createLocalDiagnosticRaster(poppler,qpdf).render(source,async frame=>{sourcePixels.push(Uint8Array.from(frame.pixels));await writeFile(join(visuals,`source-page-${frame.index+1}.png`),await encodeRaster({...frame,pagePoints:undefined},"png"));},new AbortController().signal);
    await withReconstructedDocuments(snapshot([source]), {
      inspector: createLocalDiagnosticSourceInspector(qpdf), raster: createLocalDiagnosticRaster(poppler, qpdf), output: createLocalGeneratedOutputVerifier(poppler, qpdf),
      scanner: { assurance: "qualified-local-engine", async scan(file) { return { kind: "clean", complete: true, digest: file.digest, bytes: file.bytes, signatureTime: utcInstant(new Date().toISOString()), engineIdentity: "synthetic-not-real-engine" }; } },
      monotonicNow: () => performance.now(), scope: { async withScope(_id, action) { const directory = await mkdtemp(join(root, "copies-")); try { return await action(directory); } finally { await rm(directory, { recursive: true, force: true }); } } },
    }, async bundle => {
      expect(bundle.files[0].pageCount).toBe(4);
      const { readSnapshotFile } = await import("../src/file-validation"); await writeFile(join(visuals, "synthetic-reconstructed.pdf"), await readSnapshotFile(bundle.files[0]));
      await createLocalDiagnosticRaster(poppler, qpdf).render(bundle.files[0], async frame => {
        frames.push({ width: frame.width, height: frame.height });
        await writeFile(join(visuals, `reconstructed-page-${frame.index + 1}.png`), await encodeRaster({ ...frame, pagePoints: undefined }, "png"));
        const original=sourcePixels[frame.index]; expect(frame.pixels.length).toBe(original.length); const meanDelta=frame.pixels.reduce((sum,value,i)=>sum+Math.abs(value-original[i]),0)/original.length; expect(meanDelta).toBeLessThan(2);
        if (frame.index === 3) expect(frame.pixels.every(value => value === 255)).toBe(true);
      }, new AbortController().signal);
    });
    expect(frames).toEqual([{ width: 1000, height: 1400 }, { width: 834, height: 500 }, { width: 556, height: 834 }, { width: 400, height: 600 }]);
  }, 90_000);
  it("preserves PNG alpha and applies EXIF orientation without propagating metadata", async () => {
    const frame = imageFrame(true), png = await encodeRaster(frame, "png"), file = await fixture(root, Buffer.from(png), "alpha.png", "image/png");
    const rendered: Uint8Array[] = [];
    await createLocalDiagnosticRaster(poppler, qpdf).render(file, async f => { expect([f.width, f.height, f.channels]).toEqual([2,3,4]); rendered.push(f.pixels); await mkdir(visuals, { recursive: true }); await writeFile(join(visuals, "alpha-reconstructed.png"), await encodeRaster(f, "png")); }, new AbortController().signal);
    expect([...rendered[0]].filter((_, i) => i % 4 === 3)).toEqual([0,128,255,255,128,255]);
    const rgb = imageFrame(); const jpeg = await sharp(rgb.pixels, { raw: { width: 2, height: 3, channels: 3 } }).jpeg().withMetadata({ orientation: 6 }).withIccProfile("srgb").toBuffer();
    const oriented = await fixture(root, jpeg, "exif.jpg", "image/jpeg");
    await createLocalDiagnosticRaster(poppler, qpdf).render(oriented, async f => { expect([f.width,f.height]).toEqual([3,2]); const output = await encodeRaster(f, "jpeg"), meta = await sharp(output).metadata(); expect(meta.exif).toBeUndefined(); expect(meta.icc).toBeUndefined(); await writeFile(join(visuals, "exif-reconstructed.jpg"), output); }, new AbortController().signal);
  }, 30_000);
  it("converts the qualified local P3 profile to sRGB with color fidelity", async () => {
    const pixels = Buffer.from([200,80,40,40,160,80,50,60,200]);
    const sourceBytes = await sharp(pixels,{raw:{width:3,height:1,channels:3}}).withIccProfile("p3").png().toBuffer();
    const source = await fixture(root,sourceBytes,"p3.png","image/png");
    await createLocalDiagnosticRaster(poppler,qpdf).render(source,async frame => { expect([...frame.pixels].map((value,i)=>Math.abs(value-pixels[i])).every(delta=>delta<=2)).toBe(true); await mkdir(visuals,{recursive:true}); await writeFile(join(visuals,"p3-reconstructed.png"),await encodeRaster(frame,"png")); },new AbortController().signal);
  });
  it("retains human-readable JPEG text/colors and a larger PNG transparency pattern", async () => {
    await mkdir(visuals,{recursive:true});
    const jpegSvg=Buffer.from('<svg width="1000" height="620"><defs><linearGradient id="g"><stop stop-color="#183c89"/><stop offset="0.5" stop-color="#32b47b"/><stop offset="1" stop-color="#ffd05a"/></linearGradient></defs><rect width="1000" height="620" fill="white"/><rect x="30" y="30" width="940" height="180" fill="url(#g)"/><text x="40" y="260" font-family="sans-serif" font-size="28">SYNTHETIC JPEG - text and color readability</text><text x="40" y="300" font-family="sans-serif" font-size="18">No applicant data. Preserve all edges, colors and small text.</text><path d="M30 340H970M30 390H970M30 440H970" stroke="#333"/><text x="40" y="375" font-family="sans-serif" font-size="16">Row 1: complete qualifications | 2026 | 1234567890</text><text x="40" y="425" font-family="sans-serif" font-size="16">Row 2: readable lowercase and UPPERCASE | ABC abc</text><rect x="30" y="475" width="180" height="110" fill="#ed3838"/><rect x="220" y="475" width="180" height="110" fill="#28a75f"/><rect x="410" y="475" width="180" height="110" fill="#2650df"/><rect x="600" y="475" width="180" height="110" fill="#888"/><rect x="790" y="475" width="180" height="110" fill="#191919"/></svg>');
    const pngSvg=Buffer.from('<svg width="1000" height="620"><defs><linearGradient id="alpha"><stop stop-color="#177ddc" stop-opacity="0"/><stop offset="1" stop-color="#177ddc" stop-opacity="1"/></linearGradient></defs><rect x="25" y="25" width="950" height="160" fill="url(#alpha)"/><text x="40" y="230" font-family="sans-serif" font-size="28" fill="#172a45">SYNTHETIC PNG - alpha and color preservation</text><rect x="40" y="280" width="260" height="260" rx="20" fill="#ee3333" fill-opacity="0.35"/><circle cx="350" cy="400" r="140" fill="#33cc55" fill-opacity="0.65"/><circle cx="575" cy="400" r="140" fill="#3355ee" fill-opacity="0.85"/><rect x="750" y="280" width="210" height="260" fill="#ffc640"/><text x="40" y="590" font-family="sans-serif" font-size="18" fill="#172a45">Transparent background, overlapping colors, fully visible source area.</text></svg>');
    const jpeg=await sharp(jpegSvg).jpeg({quality:94,chromaSubsampling:"4:4:4"}).withMetadata().withIccProfile("srgb").toBuffer(), png=await sharp(pngSvg).png().toBuffer();
    await writeFile(join(visuals,"large-source.jpg"),jpeg);await writeFile(join(visuals,"large-source.png"),png);
    const sources=[await fixture(root,jpeg,"large.jpg","image/jpeg"),await fixture(root,png,"large.png","image/png")];
    await withReconstructedDocuments(snapshot(sources),{
      inspector:createLocalDiagnosticSourceInspector(qpdf),raster:createLocalDiagnosticRaster(poppler,qpdf),output:createLocalGeneratedOutputVerifier(poppler,qpdf),
      scanner:{assurance:"qualified-local-engine",async scan(file){return{kind:"clean",complete:true,digest:file.digest,bytes:file.bytes,signatureTime:utcInstant(new Date().toISOString()),engineIdentity:"synthetic-not-clamav"};}},
      monotonicNow:()=>performance.now(),scope:{async withScope(_id,action){const directory=await mkdtemp(join(root,"large-"));try{return await action(directory);}finally{await rm(directory,{recursive:true,force:true});}}},
    },async bundle=>{
      const {readSnapshotFile}=await import("../src/file-validation");
      for(let i=0;i<bundle.files.length;i++){
        const bytes=await readSnapshotFile(bundle.files[i]), meta=await sharp(bytes).metadata();expect([meta.width,meta.height]).toEqual([1000,620]);expect(meta.icc).toBeUndefined();expect(meta.exif).toBeUndefined();await writeFile(join(visuals,`large-reconstructed.${i===0?"jpg":"png"}`),bytes);
        const sourcePixels=await sharp(i===0?jpeg:png).autoOrient().toColourspace("srgb").raw().toBuffer(), outputPixels=await sharp(bytes).raw().toBuffer();expect(outputPixels.length).toBe(sourcePixels.length);expect(outputPixels.reduce((sum,value,j)=>sum+Math.abs(value-sourcePixels[j]),0)/outputPixels.length).toBeLessThan(2);
        if(i===1){
          // QA previews only. Actual PNG source/output retain untouched alpha.
          const checker=Buffer.from('<svg width="1000" height="620"><defs><pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="white"/><path d="M0 0H20V20H0ZM20 20H40V40H20Z" fill="#e4e4e4"/></pattern></defs><rect width="1000" height="620" fill="url(#p)"/></svg>');
          await writeFile(join(visuals,"large-source-alpha-preview.png"),await sharp(checker).composite([{input:png}]).png().toBuffer());
          await writeFile(join(visuals,"large-reconstructed-alpha-preview.png"),await sharp(checker).composite([{input:bytes}]).png().toBuffer());
        }
      }
    });
  },30_000);
  it("rebuilds a canonical equal-hash PNG into a distinct verified scoped inode", async () => {
    const encoded=await encodeRaster(imageFrame(true),"png"), source=await fixture(root,Buffer.from(encoded),"canonical.png","image/png");
    const raster=createLocalDiagnosticRaster(poppler,qpdf), output=createLocalGeneratedOutputVerifier(poppler,qpdf); let frames=0, verified=0;
    await withReconstructedDocuments(snapshot([source]),{
      inspector:createLocalDiagnosticSourceInspector(qpdf), raster:{async render(file,emit,signal){return raster.render(file,async frame=>{frames++;await emit(frame);},signal);}},
      output:{async verify(...args){await output.verify(...args);verified++;}},
      scanner:{assurance:"qualified-local-engine",async scan(file){return{kind:"clean",complete:true,digest:file.digest,bytes:file.bytes,signatureTime:utcInstant(new Date().toISOString()),engineIdentity:"synthetic-not-clamav"};}},
      scope:{async withScope(_id,action){const directory=await mkdtemp(join(root,"canonical-"));try{return await action(directory);}finally{await rm(directory,{recursive:true,force:true});}}},monotonicNow:()=>performance.now(),
    },async bundle=>{const copy=bundle.files[0];expect(copy.digest).toBe(source.digest);expect(copy.sourceDigest).toBe(source.digest);expect(copy.sourceIndex).toBe(0);expect(copy.path).not.toBe(source.path);expect((await stat(copy.path)).ino).not.toBe((await stat(source.path)).ino);expect(frames).toBe(1);expect(verified).toBe(1);});
  });
  it("rejects an unknown valid ICC profile instead of assuming sRGB", async () => {
    const bytes = await sharp({create:{width:2,height:2,channels:3,background:"red"}}).withIccProfile("srgb").jpeg().toBuffer();
    const marker = bytes.indexOf(Buffer.from("ICC_PROFILE\0")); expect(marker).toBeGreaterThan(0);
    bytes[marker+14+8] ^= 1; // ICC header creator/version bytes, no compressed pixel changes.
    const source = await fixture(root,bytes,"unknown.jpg","image/jpeg"); const emitted: unknown[] = [];
    await expect(createLocalDiagnosticRaster(poppler,qpdf).render(source,async frame=>{ emitted.push(frame); },new AbortController().signal)).rejects.toThrow(); expect(emitted).toEqual([]);
  });
  it.each(["APNG","MPO"])("rejects multi-image %s that metadata.pages misses", async kind => {
    let bytes: Buffer, name: string, media: string;
    if (kind === "APNG") {
      const png = await sharp({create:{width:1,height:1,channels:3,background:"red"}}).png().toBuffer(), chunk = Buffer.alloc(20); chunk.writeUInt32BE(8); chunk.write("acTL",4); chunk.writeUInt32BE(2,8); // Invalid CRC is additionally fail-closed; acTL itself disqualifies.
      bytes = Buffer.concat([png.subarray(0,33),chunk,png.subarray(33)]); name="animated.png"; media="image/png";
    } else {
      const jpeg = await sharp({create:{width:1,height:1,channels:3,background:"red"}}).jpeg().toBuffer(); bytes=Buffer.concat([jpeg.subarray(0,2),Buffer.from([255,226,0,6,77,80,70,0]),jpeg.subarray(2)]); name="multi.jpg"; media="image/jpeg";
    }
    const source=await fixture(root,bytes,name,media), emitted: unknown[]=[];
    await expect(createLocalDiagnosticRaster(poppler,qpdf).render(source,async frame=>{emitted.push(frame);},new AbortController().signal)).rejects.toThrow(); expect(emitted).toEqual([]);
  });
  it("preserves exact decimal CropBox points and rotation", async () => {
    const doc=await PDFDocument.create({updateMetadata:false}), page=doc.addPage([210.123,310.456]); page.setCropBox(10.01,20.02,180.123,270.456); page.setRotation(degrees(270));
    const source=await fixture(root,Buffer.from(await doc.save({useObjectStreams:false})),"decimal.pdf");
    await createLocalDiagnosticRaster(poppler,qpdf).render(source,async frame=>{expect(frame.pagePoints).toEqual({width:270.456,height:180.123}); expect([frame.width,frame.height]).toEqual([752,501]);},new AbortController().signal);
  });
  it("binds generated verification to the recipe and rejects extra metadata objects", async () => {
    const builder=createPdfReconstruction(); await builder.append(blank()); const source=await fixture(root,Buffer.from(await builder.finish()));
    const verifier=createLocalGeneratedOutputVerifier(poppler,qpdf), signal=new AbortController().signal;
    await expect(verifier.verify(source,{format:"pdf",pages:[{width:100,height:100,channels:3,pagePoints:{width:36,height:36}}]},signal)).resolves.toBeUndefined();
    await expect(verifier.verify(source,{format:"pdf",pages:[{width:101,height:100,channels:3,pagePoints:{width:36,height:36}}]},signal)).rejects.toThrow("OUTPUT_INVALID");
    const doc=await PDFDocument.load(await builderBytes()); doc.setTitle("Unallowed metadata");
    const tampered=await fixture(root,Buffer.from(await doc.save({useObjectStreams:false})),"tampered.pdf");
    await expect(verifier.verify(tampered,{format:"pdf",pages:[{width:100,height:100,channels:3,pagePoints:{width:36,height:36}}]},signal)).rejects.toThrow("OUTPUT_INVALID");
    async function builderBytes() { const b=createPdfReconstruction(); await b.append(blank()); return b.finish(); }
  });
  it("makes local raster and verifier unavailable at construction and later use outside tests", async () => {
    const raster=createLocalDiagnosticRaster(poppler,qpdf), verifier=createLocalGeneratedOutputVerifier(poppler,qpdf), source=await fixture(root,staticPdf());
    vi.stubEnv("NODE_ENV","production");
    try { expect(()=>createLocalDiagnosticRaster(poppler,qpdf)).toThrow("LOCAL_DIAGNOSTIC_ONLY"); expect(()=>createLocalGeneratedOutputVerifier(poppler,qpdf)).toThrow("LOCAL_DIAGNOSTIC_ONLY"); await expect(raster.render(source,async()=>{},new AbortController().signal)).rejects.toThrow("LOCAL_DIAGNOSTIC_ONLY"); await expect(verifier.verify(source,{format:"pdf",pages:[]},new AbortController().signal)).rejects.toThrow("LOCAL_DIAGNOSTIC_ONLY"); }
    finally { vi.unstubAllEnvs(); }
  });
  it.each([false,true])("blocks duplicate definitions or emits only a new safe output (%s)", async duplicate => {
    const source = await fixture(root, duplicateDefinitionPdf(duplicate));
    const inspection = await createLocalDiagnosticSourceInspector(qpdf).inspect(source, new AbortController().signal);
    if (inspection.kind === "blocked") return;
    const frames: unknown[] = [];
    try { await createLocalDiagnosticRaster(poppler, qpdf).render(source, async f => { frames.push(f); }, new AbortController().signal); }
    catch { return; }
    expect(frames.length).toBe(1);
    // Successful pixels still cannot dispatch originals; output verifier rejects them.
    await expect(createLocalGeneratedOutputVerifier(poppler,qpdf).verify(source, { format: "pdf", pages: [{ width:278,height:278,channels:3,pagePoints:{width:100,height:100} }] }, new AbortController().signal)).rejects.toThrow("OUTPUT_INVALID");
  });
  it("rejects original text/blank PDFs as generated image-only output", async () => {
    const source = await fixture(root, staticPdf());
    await expect(createLocalGeneratedOutputVerifier(poppler,qpdf).verify(source, { format:"pdf",pages:[{width:1700,height:2200,channels:3,pagePoints:{width:612,height:792}}] }, new AbortController().signal)).rejects.toThrow("OUTPUT_INVALID");
  });
});
