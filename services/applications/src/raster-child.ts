import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, isAbsolute, join } from "node:path";
import sharp from "sharp";
import { identifyFile, readSnapshotFile } from "./file-validation";
import { decodeRasterFrame } from "./raster-protocol";
import { decodePpm, PINNED_POPPLER_VERSION, requireLocalTools } from "./raster-process";
import { PINNED_QPDF_VERSION } from "./parser-process";
import { RECONSTRUCTION_LIMITS as limits } from "./reconstruction-limits";
import { assertPageGeometry } from "./pdf-reconstruction";
import { strictRecord, type RasterFrame } from "./reconstruction-types";
import { verifyGeneratedPdfGraph, type GeneratedOutputExpectation } from "./generated-output-policy";
import type { SnapshotFile } from "./types";

// Only these exact bundled LCMS profiles have local synthetic conversion fixtures.
// This is not production color qualification; arbitrary valid ICC is rejected.
const localProfiles = new Set(["c56e1685d888f5edb92fe07f2750f387f8fe8e91b32ff8fb0b56bfbbb9458353", "231752984cd4a5278e1b8d2390fe496767d4511fc81f54e1a5c69ae9ab4c42b5"]);
const fail = (): never => { throw new Error("RASTER_INVALID"); };
function command(executable: string, args: string[], maxBuffer: number): Buffer {
  const result = spawnSync(executable,args,{ env:{ NODE_ENV:"test",TZ:"UTC",LANG:"C",LC_ALL:"C",PATH:"/usr/bin:/bin" },cwd:"/",maxBuffer,timeout:30_000,encoding:"buffer",stdio:["ignore","pipe","pipe"] });
  if (result.error || result.signal || result.status !== 0 || result.stderr.length) fail(); return result.stdout;
}
function qualifyTools(poppler: string, qpdf: string): void {
  // Poppler writes its supported '-v' version response to stderr.
  for (const executable of [poppler,join(dirname(poppler),"pdfinfo")]) {
    const result = spawnSync(executable,["-v"],{ env:{NODE_ENV:"test",PATH:"/usr/bin:/bin"},cwd:"/",maxBuffer:4096,timeout:30_000,encoding:"utf8" });
    if (result.error || result.signal || result.status !== 0 || !(result.stdout+result.stderr).startsWith(`${executable === poppler ? "pdftoppm" : "pdfinfo"} version ${PINNED_POPPLER_VERSION}\n`)) fail();
  }
  if (!command(qpdf,["--version"],4096).toString("utf8").startsWith(`qpdf version ${PINNED_QPDF_VERSION}\n`)) fail();
}
/** Structural frame checks supplement metadata.pages, which misses APNG/MPO. */
function singleImage(bytes: Buffer, format: "png" | "jpeg"): void {
  if (format === "png") {
    let offset = 8, ended = false;
    while (offset + 12 <= bytes.length) {
      const length = bytes.readUInt32BE(offset), type = bytes.toString("ascii",offset+4,offset+8);
      if (length > bytes.length - offset - 12 || ["acTL","fcTL","fdAT"].includes(type)) fail();
      offset += length + 12;
      if (type === "IEND") { if (length !== 0 || offset !== bytes.length) fail(); ended = true; break; }
    }
    if (!ended) fail();
  } else {
    let offset = 2, ended = false;
    while (offset < bytes.length) {
      if (bytes[offset++] !== 255) fail(); while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 217) { if (offset !== bytes.length) fail(); ended = true; break; }
      if (marker === 216 || marker === 0 || marker >= 208 && marker <= 215) fail();
      if (offset + 2 > bytes.length) fail(); const length = bytes.readUInt16BE(offset);
      if (length < 2 || length > bytes.length-offset) fail();
      const data = bytes.subarray(offset+2,offset+length);
      if (marker === 226 && data.subarray(0,4).equals(Buffer.from("MPF\0"))) fail();
      offset += length;
      if (marker === 218) {
        while (offset < bytes.length) {
          if (bytes[offset++] !== 255) continue;
          const next = bytes[offset]; if (next === 0 || next >= 208 && next <= 215) { offset++; continue; }
          if (next === 255) continue; offset--; break;
        }
      }
    }
    if (!ended) fail();
  }
}
async function imagePixels(bytes: Buffer, format: "jpeg" | "png", generated = false): Promise<RasterFrame> {
  singleImage(bytes,format); sharp.cache(false); sharp.concurrency(1);
  const image = sharp(bytes,{failOn:"warning",limitInputPixels:limits.imagePixels,limitInputChannels:4,unlimited:false,sequentialRead:true,ignoreIcc:false});
  let warning = false; image.on("warning",()=> { warning = true; });
  const metadata = await image.metadata();
  if (metadata.format !== format || !metadata.width || !metadata.height || metadata.width > limits.edgePixels || metadata.height > limits.edgePixels || metadata.width*metadata.height > limits.imagePixels || (metadata.pages ?? 1) !== 1 || !["srgb","rgb","b-w"].includes(metadata.space ?? "")) fail();
  if (generated && (metadata.icc || metadata.exif || metadata.xmp || metadata.iptc || metadata.orientation || metadata.comments?.length)) fail();
  if (metadata.icc && !localProfiles.has(createHash("sha256").update(metadata.icc).digest("hex"))) fail();
  const { data, info } = await image.autoOrient().withIccProfile("srgb",{attach:false}).toColourspace("srgb").raw({depth:"uchar"}).toBuffer({resolveWithObject:true});
  if (warning) fail();
  return decodeRasterFrame({ index:0,width:info.width,height:info.height,channels:info.channels },data,0,format);
}
function exactPdfGeometry(file: SnapshotFile,qpdf: string): {width:number;height:number;rotation:number}[] {
  const json = JSON.parse(command(qpdf,["--suppress-recovery","--json=2","--json-key=qpdf","--json-stream-data=none",file.path],16*1024*1024).toString("utf8")) as {qpdf:[unknown,Record<string,{value?:Record<string,unknown>}>]};
  const objects = json.qpdf[1];
  const resolve = (value:unknown):unknown => {
    const seen = new Set<string>();
    while (typeof value === "string" && /^[1-9]\d* \d+ R$/.test(value)) { if (seen.has(value) || seen.size>64) fail(); seen.add(value); value = objects[`obj:${value}`]?.value; }
    return value;
  };
  const dict = (value:unknown):Record<string,unknown> => { const resolved = resolve(value); if (!resolved || typeof resolved !== "object" || Array.isArray(resolved)) fail(); return resolved as Record<string,unknown>; };
  const root = dict(dict(objects.trailer?.value)["/Root"]), pages: {width:number;height:number;rotation:number}[] = [], seen = new Set<string>();
  const visit = (value:unknown,inherited:Record<string,unknown>,depth:number) => {
    if (depth>64 || typeof value !== "string" || seen.has(value)) fail(); seen.add(value as string);
    const node = dict(value), attrs = {...inherited};
    for (const key of ["/MediaBox","/CropBox","/Rotate"]) if (node[key] !== undefined) attrs[key] = node[key];
    if (node["/Type"] === "/Pages") { const kids = resolve(node["/Kids"]); if (!Array.isArray(kids)) fail(); for (const kid of kids as unknown[]) visit(kid,attrs,depth+1); return; }
    if (node["/Type"] !== "/Page" || pages.length>=limits.pdfPages || (node["/UserUnit"] !== undefined && resolve(node["/UserUnit"]) !== 1)) fail();
    const box = (v:unknown):number[] => { const values = resolve(v); if (!Array.isArray(values) || values.length!==4 || values.some(n=>typeof n !== "number" || !Number.isFinite(n))) fail(); return values as number[]; };
    const media = box(attrs["/MediaBox"]), crop = attrs["/CropBox"] === undefined ? media : box(attrs["/CropBox"]);
    if (media[2]<=media[0] || media[3]<=media[1] || crop[2]<=crop[0] || crop[3]<=crop[1]) fail();
    // Visible CropBox is intersected with MediaBox, matching Poppler display.
    let width = Math.min(media[2],crop[2])-Math.max(media[0],crop[0]), height = Math.min(media[3],crop[3])-Math.max(media[1],crop[1]);
    const rawRotation = resolve(attrs["/Rotate"] ?? 0); if (typeof rawRotation !== "number" || !Number.isSafeInteger(rawRotation) || rawRotation%90!==0) fail();
    const rotation = ((rawRotation as number)%360+360)%360; if (rotation===90 || rotation===270) [width,height] = [height,width];
    if (width<=0 || height<=0 || Math.ceil(width*limits.dpi/72)>limits.edgePixels || Math.ceil(height*limits.dpi/72)>limits.edgePixels || Math.ceil(width*limits.dpi/72)*Math.ceil(height*limits.dpi/72)>limits.pdfPagePixels) fail();
    pages.push({width,height,rotation});
  };
  visit(root["/Pages"],{},0); if (!pages.length) fail(); return pages;
}
function pdfGeometry(file: SnapshotFile, poppler: string,qpdf: string): { width: number; height: number }[] {
  const info = command(join(dirname(poppler),"pdfinfo"),["-box","-f","1","-l",String(limits.pdfPages),file.path],64*1024).toString("utf8");
  const count = Number(/^Pages:\s+(\d+)$/m.exec(info)?.[1]); if (!Number.isSafeInteger(count) || count < 1 || count > limits.pdfPages) fail();
  const exact = exactPdfGeometry(file,qpdf); if (exact.length !== count) fail();
  const pages: {width:number;height:number}[] = [];
  for (let n = 1; n <= count; n++) {
    const box = new RegExp(`^Page\\s+${n} CropBox:\\s+(-?[0-9.]+)\\s+(-?[0-9.]+)\\s+(-?[0-9.]+)\\s+(-?[0-9.]+)$`,"m").exec(info);
    const rotation = Number(new RegExp(`^Page\\s+${n} rot:\\s+(-?\\d+)$`,"m").exec(info)?.[1]);
    if (!box || ![0,90,180,270].includes(rotation)) fail();
    let width = Number(box![3])-Number(box![1]), height = Number(box![4])-Number(box![2]); if (rotation === 90 || rotation === 270) [width,height] = [height,width];
    const pixelsWidth = Math.ceil(width*limits.dpi/72), pixelsHeight = Math.ceil(height*limits.dpi/72);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || pixelsWidth > limits.edgePixels || pixelsHeight > limits.edgePixels || pixelsWidth*pixelsHeight > limits.pdfPagePixels) fail();
    if (Math.abs(exact[n-1].width-width)>0.021 || Math.abs(exact[n-1].height-height)>0.021 || exact[n-1].rotation!==rotation) fail();
    pages.push({width:exact[n-1].width,height:exact[n-1].height});
  }
  return pages;
}
async function render(file: SnapshotFile,poppler: string,qpdf: string,emit: (frame:RasterFrame)=>Promise<void>): Promise<{format:"pdf"|"jpeg"|"png";pageCount:number}> {
  const bytes = await readSnapshotFile(file), format = identifyFile(bytes); if (!format) fail();
  if (format === "pdf") {
    const pages = pdfGeometry(file,poppler,qpdf);
    for (let index = 0; index < pages.length; index++) {
      const ppm = command(poppler,["-r",String(limits.dpi),"-cropbox","-f",String(index+1),"-l",String(index+1),file.path],limits.pdfPagePixels*3+4096);
      const decoded = decodePpm(ppm), frame = decodeRasterFrame({index,width:decoded.width,height:decoded.height,channels:3,pagePoints:pages[index]},decoded.pixels,index,"pdf"); assertPageGeometry(frame); await emit(frame);
    }
    await readSnapshotFile(file); return {format,pageCount:pages.length};
  }
  await emit(await imagePixels(bytes,format as "jpeg"|"png")); await readSnapshotFile(file); return {format:format as "jpeg"|"png",pageCount:1};
}
function expectation(value: unknown): GeneratedOutputExpectation {
  const raw = strictRecord(value,["format","pages"]); if (!raw || !["pdf","png","jpeg"].includes(raw.format as string) || !Array.isArray(raw.pages) || !raw.pages.length || raw.pages.length > (raw.format === "pdf" ? limits.pdfPages : 1)) fail();
  const pages = (raw!.pages as unknown[]).map((page,index) => {
    const p = strictRecord(page,["width","height","channels"],["pagePoints"]); if (!p) fail();
    if (!Number.isSafeInteger(p!.width) || !Number.isSafeInteger(p!.height) || Number(p!.width)<1 || Number(p!.height)<1 || Number(p!.width)>limits.edgePixels || Number(p!.height)>limits.edgePixels || Number(p!.width)*Number(p!.height)>(raw!.format === "pdf" ? limits.pdfPagePixels : limits.imagePixels) || (p!.channels!==3 && p!.channels!==4)) fail();
    const frame = decodeRasterFrame({index,...p},new Uint8Array(Number(p!.width)*Number(p!.height)*Number(p!.channels)),index,raw!.format as "pdf"|"png"|"jpeg");
    if (raw!.format === "pdf") assertPageGeometry(frame);
    return {width:frame.width,height:frame.height,channels:frame.channels,...(frame.pagePoints?{pagePoints:frame.pagePoints}:{})};
  }); return {format:raw!.format as "pdf"|"png"|"jpeg",pages};
}
async function verify(file: SnapshotFile,expected: GeneratedOutputExpectation,poppler: string,qpdf: string): Promise<void> {
  const bytes = await readSnapshotFile(file); if (identifyFile(bytes) !== expected.format || file.mediaType !== {pdf:"application/pdf",png:"image/png",jpeg:"image/jpeg"}[expected.format]) fail();
  if (expected.format !== "pdf") {
    const frame = await imagePixels(bytes,expected.format,true), page = expected.pages[0];
    if (expected.pages.length !== 1 || frame.width !== page.width || frame.height !== page.height || frame.channels !== page.channels) fail();
  } else {
    command(qpdf,["--suppress-recovery","--check",file.path],64*1024);
    const json = JSON.parse(command(qpdf,["--suppress-recovery","--json=2","--json-key=qpdf","--json-stream-data=none",file.path],16*1024*1024).toString("utf8")) as unknown;
    await verifyGeneratedPdfGraph(json,expected,async (ref,raw) => command(qpdf,["--suppress-recovery",`--show-object=${ref.split(" ").slice(0,2).join(",")}`,raw?"--raw-stream-data":"--filtered-stream-data",file.path],8*1024*1024),async (jpeg,width,height) => { const frame = await imagePixels(jpeg,"jpeg",true); if (frame.width !== width || frame.height !== height) fail(); });
    let index = 0;
    await render(file,poppler,qpdf,async frame => { const page = expected.pages[index++]; if (!page || frame.width !== page.width || frame.height !== page.height || frame.channels !== page.channels || Math.abs(frame.pagePoints!.width-page.pagePoints!.width)>0.01 || Math.abs(frame.pagePoints!.height-page.pagePoints!.height)>0.01) fail(); });
    if (index !== expected.pages.length) fail();
  }
  await readSnapshotFile(file);
}
async function writeHeader(value: unknown): Promise<void> {
  const bytes = Buffer.from(JSON.stringify(value)), prefix = Buffer.alloc(4); if (bytes.length > limits.headerBytes) fail(); prefix.writeUInt32BE(bytes.length);
  for (const data of [prefix,bytes]) await new Promise<void>((resolve,reject)=>process.stdout.write(data,error=>error?reject(error):resolve()));
}
async function main(): Promise<void> {
  try {
    let input = Buffer.alloc(0); for await (const chunk of process.stdin) { if (input.length+chunk.length>16384) fail(); input = Buffer.concat([input,chunk]); }
    const parsed:unknown = JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(input));
    const raw = strictRecord(parsed,["version","operation","file","popplerPath","qpdfPath"],["expected"]);
    if (!raw || raw.version !== 1 || !["raster","verify-generated"].includes(raw.operation as string) || typeof raw.popplerPath !== "string" || typeof raw.qpdfPath !== "string") fail();
    requireLocalTools(raw!.popplerPath as string,raw!.qpdfPath as string); qualifyTools(raw!.popplerPath as string,raw!.qpdfPath as string);
    const f = strictRecord(raw!.file,["name","path","bytes","mediaType","digest"],["sourceIndex","sourceDigest","pageCount"]);
    if (!f || typeof f.name !== "string" || typeof f.path !== "string" || !isAbsolute(f.path) || typeof f.mediaType !== "string" || typeof f.digest !== "string" || !/^[a-f0-9]{64}$/.test(f.digest) || !Number.isSafeInteger(f.bytes)) fail();
    const file = f as unknown as SnapshotFile;
    if (raw!.operation === "verify-generated") {
      await verify(file,expectation(raw!.expected),raw!.popplerPath as string,raw!.qpdfPath as string); process.stdout.write(JSON.stringify({version:1,operation:"verify-generated",verified:true}));
    } else {
      if (Object.hasOwn(raw!,"expected")) fail();
      const inspection = await render(file,raw!.popplerPath as string,raw!.qpdfPath as string,async frame => { const {pixels,...header} = frame; await writeHeader({version:1,operation:"raster",kind:"frame",frame:header}); await new Promise<void>((resolve,reject)=>process.stdout.write(pixels,error=>error?reject(error):resolve())); });
      await writeHeader({version:1,operation:"raster",kind:"completed",inspection});
    }
  } catch { process.exitCode = 1; }
}
void main();
