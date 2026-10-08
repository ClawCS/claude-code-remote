import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, realpath, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { validatePublicationPdf } from "../lib/publication-pdf";
import sharp from "sharp";
import { renderOfferCrop } from "../lib/weekly-offer-crops";
import { buildPublicOfferMetadata, type ReviewedWeeklyOffer, type WeeklyOfferPublicSource } from "../lib/weekly-offer-metadata";
import { parseWeeklyPublication } from "../lib/weekly-publication";
import type { PublishedOffer } from "../lib/weekly-publication-types";
import { getCurrentWeekRange } from "../lib/editorial-schedule";
import { getAcceptedNlOfferRanges, getOfficialOfferRange } from "../lib/offer-validity";
import { withWeeklyPublicationTransaction } from "../lib/weekly-publication-transaction";

type Page = { page: number; sourceImage: string; expectedOffers: number; offers: ReviewedWeeklyOffer[] };
type Source = WeeklyOfferPublicSource & { privatePdf: string; printedValidFrom: string; printedValidTo: string; coverSha256: string; pageCount: number; pages: Page[] };
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

export function parseOfferArguments(args: readonly string[]) {
  let check = false, week: string | undefined;
  const seen = new Set<string>();
  for (let i=0;i<args.length;i++) {
    const key=args[i];
    if (seen.has(key)) throw new Error(`Duplicate option: ${key}`); seen.add(key);
    if (key === "--check") { check=true; continue; }
    if (key !== "--week") throw new Error(`Unknown option: ${key}`);
    week=args[++i];
    if (!week || week.startsWith("--")) throw new Error("Missing --week value");
    parseWeeklyPublication({schemaVersion:1,week,editions:[]});
  }
  return {check,week};
}

async function safeRead(root:string,relative:string) {
  if (path.isAbsolute(relative)) throw new Error("Expected relative source path");
  const file=await realpath(path.resolve(root,relative)); const boundary=await realpath(root); const rel=path.relative(boundary,file);
  if (rel===".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) throw new Error("Source escapes editorial root");
  const info=await stat(file);
  if (!info.isFile() || info.size>50*1024*1024) throw new Error("Invalid or oversized source file");
  const bytes=await readFile(file); if (!bytes.length || bytes.length>50*1024*1024) throw new Error("Invalid or oversized source file");
  return bytes;
}
async function imageIntegrity(bytes:Buffer,offer:ReviewedWeeklyOffer,expectedHash:string) {
  const image=sharp(bytes,{limitInputPixels:50_000_000}); const dimensions=await image.metadata();
  if (hash(bytes)!==expectedHash || dimensions.width!==offer.rect[2] || dimensions.height!==offer.rect[3]) throw new Error(`Offer image integrity: ${offer.id}`);
  await image.resize(1,1).raw().toBuffer();
}
function reviewedOffer(offer:ReviewedWeeklyOffer) {
  const dimensions=offer.sourceDimensions;
  const inside=(rect:number[],bounds:number[])=>Array.isArray(rect) && rect.length===4 && rect.every(Number.isSafeInteger) && rect[2]>0 && rect[3]>0 && rect[0]>=bounds[0] && rect[1]>=bounds[1] && rect[0]+rect[2]<=bounds[0]+bounds[2] && rect[1]+rect[3]<=bounds[1]+bounds[3];
  if (!Array.isArray(dimensions) || dimensions.length!==2 || dimensions.some(n=>!Number.isSafeInteger(n)||n<1||n>50_000_000) || !inside(offer.rect,[0,0,...dimensions])
    || (offer.sourceRegions!==undefined && (!Array.isArray(offer.sourceRegions)||!offer.sourceRegions.length||offer.sourceRegions.some(region=>!inside(region,offer.rect))))
    || typeof offer.name!=="string"||!offer.name.trim()||typeof offer.categorySlug!=="string"||!offer.categorySlug.trim()||typeof offer.conditions!=="string"||(offer.sourceWarning!==undefined && typeof offer.sourceWarning!=="string")) throw new Error(`Invalid reviewed offer: ${offer.id}`);
}
async function atomicRows(root:string,rows:readonly PublishedOffer[]) {
  const file=path.join(root,"data/weekly-offers.json"),temp=`${file}.${randomUUID()}.tmp`;
  try { await writeFile(temp,`${JSON.stringify(rows,null,2)}\n`,{flag:"wx"}); await rename(temp,file); }
  finally { await unlink(temp).catch(()=>{}); }
}

export async function buildWeeklyOffers(root:string,args:readonly string[]) {
  const {check,week}=parseOfferArguments(args);
  return withWeeklyPublicationTransaction(root,async transaction=>{
  const layout=JSON.parse((await safeRead(root,"data/weekly-offer-layout.json")).toString()) as {sources:Source[]};
  if (!Array.isArray(layout.sources) || !layout.sources.length) throw new Error("Missing reviewed sources");
  const sources=layout.sources.filter(source=>!week || source.validFrom===week);
  if (!sources.length) throw new Error("No reviewed sources for requested week");
  let existing:PublishedOffer[]=[];
  try { existing=JSON.parse((await safeRead(root,"data/weekly-offers.json")).toString()); }
  catch(error) { if (check || (error as NodeJS.ErrnoException).code!=="ENOENT") throw error; }
  if (!Array.isArray(existing) || new Set(existing.map(row=>row.id)).size!==existing.length) throw new Error("Duplicate or invalid published offers");
    const rows:PublishedOffer[]=[]; const ids=new Set<string>(); const sourceKeys=new Set<string>();
    const assets:{imagePath:string;bytes:Buffer}[]=[];
    for (const source of sources) {
      const key=`${source.validFrom}:${source.language}`;
      if (sourceKeys.has(key) || !["de","nl"].includes(source.language) || source.rightsStatus!=="approved") throw new Error("Duplicate or unapproved reviewed source"); sourceKeys.add(key);
      parseWeeklyPublication({schemaVersion:1,week:source.validFrom,editions:[]});
      const range=getCurrentWeekRange(new Date(`${source.validFrom}T12:00:00Z`));
      const identity=/^https:\/\/werbung\.trinkgut\.de\/frontend\/catalogs\/(\d+)\/(\d+)\/pdf\/complete\.pdf$/.exec(source.sourceUrl);
      const accepted=source.language==="nl"?getAcceptedNlOfferRanges(range):[getOfficialOfferRange(range,identity?{catalogId:identity[1],catalogVersion:identity[2]}:undefined)];
      if (!accepted.some(item=>item.validFrom===source.validFrom && item.validTo===source.validTo)) throw new Error("Invalid reviewed printed validity range");
      if (source.printedValidFrom!==source.validFrom || source.printedValidTo!==source.validTo || !/^[a-f0-9]{64}$/.test(source.coverSha256) || !source.reviewedAt) throw new Error("Missing original/date/cover review");
      if (!Number.isSafeInteger(source.pageCount) || source.pageCount<1 || source.pageCount>60 || (source.language==="nl" && source.pageCount!==1) || !Array.isArray(source.pages) || source.pages.length!==source.pageCount || source.pages.some((p,i)=>p.page!==i+1)) throw new Error(`${source.language}: incomplete or invalid original-page coverage`);
      const pdf=await safeRead(root,source.privatePdf);
      if (hash(pdf)!==source.pdfSha256) throw new Error(`${source.language}: original PDF changed`);
      await validatePublicationPdf(pdf,source.pageCount);
      for (const page of source.pages) {
        if (!Array.isArray(page.offers) || !Number.isSafeInteger(page.expectedOffers) || page.expectedOffers!==page.offers.length) throw new Error(`${source.language} page ${page.page}: incomplete offer coverage`);
        const image=check?undefined:await safeRead(root,page.sourceImage);
        for (const offer of page.offers) {
          reviewedOffer(offer);
          if (!/^[a-z0-9][a-z0-9-]{0,149}$/.test(offer.id) || ids.has(offer.id)) throw new Error(`Invalid or duplicate offer: ${offer.id}`); ids.add(offer.id);
          const old=existing.find(row=>row.id===offer.id);
          if (check || offer.imagePath) {
            if (!old) throw new Error(`Offer differs from reviewed source: ${offer.id}`);
            const imagePath=offer.imagePath ?? `/images/offers/${offer.id}-${old.imageSha256}.webp`;
            const expected=buildPublicOfferMetadata(source,page.page,offer,imagePath);
            const {imageSha256,...metadata}=old;
            // Only build may migrate same-byte DE delivery from its reviewed origin to the local PDF.
            // Every other field, including original hash, crop and conditions, must remain exact.
            const deliveryMigration=!check && source.language==="de" && isDeepStrictEqual(metadata,{...expected,sourceUrl:source.sourceUrl});
            if (!isDeepStrictEqual(metadata,expected) && !deliveryMigration) throw new Error(`Offer differs from reviewed source: ${offer.id}`);
            await imageIntegrity(await safeRead(root,`public${imagePath}`),offer,imageSha256);
            rows.push({...expected,imageSha256}); continue;
          }
          const bytes=await renderOfferCrop(image!,offer); const imageSha256=hash(bytes);
          const imagePath=`/images/offers/${offer.id}-${imageSha256}.webp`;
          const metadata=buildPublicOfferMetadata(source,page.page,offer,imagePath);
          await imageIntegrity(bytes,offer,imageSha256); assets.push({imagePath,bytes}); rows.push({...metadata,imageSha256});
        }
      }
    }
    if (check) {
      const selected=existing.filter(row=>!week || row.validFrom===week);
      if (selected.length!==ids.size || selected.some(row=>!ids.has(row.id))) throw new Error("Published selection is not the complete reviewed original set");
      return {count:ids.size,check};
    }
    const preserved=week?existing.filter(row=>row.validFrom!==week):[];
    if (preserved.some(row=>ids.has(row.id))) throw new Error("Offer ID conflicts with another week");
    for (const asset of assets) {
      try { if (!(await safeRead(root,`public${asset.imagePath}`)).equals(asset.bytes)) throw new Error("Cannot overwrite a published path with different bytes"); }
      catch(error) { if ((error as NodeJS.ErrnoException).code!=="ENOENT") throw error; }
    }
    await mkdir(path.join(root,"public/images/offers"),{recursive:true});
    const outputRelative=path.relative(await realpath(root),await realpath(path.join(root,"public/images/offers")));
    if (outputRelative!=="public/images/offers") throw new Error("Output symlink escapes public root");
    for (const asset of assets) {
      try { await writeFile(path.join(root,`public${asset.imagePath}`),asset.bytes,{flag:"wx"}); }
      catch(error) { if ((error as NodeJS.ErrnoException).code!=="EEXIST" || !(await safeRead(root,`public${asset.imagePath}`)).equals(asset.bytes)) throw error; }
    }
    await transaction.beginBinding();
    await atomicRows(root,[...preserved,...rows]);await transaction.commit();return {count:rows.length,check};
  });
}

if (process.argv[1] && path.resolve(process.argv[1])===path.resolve(import.meta.filename)) {
  buildWeeklyOffers(process.cwd(),process.argv.slice(2)).then(({count,check})=>console.log(check?`Alle ${count} Originalangebote und ihre Bilder geprüft.`:`${count} vollständige Originalangebote vorbereitet.`)).catch(error=>{console.error(error instanceof Error?error.message:"Angebotsbilder konnten nicht verarbeitet werden");process.exitCode=1;});
}
