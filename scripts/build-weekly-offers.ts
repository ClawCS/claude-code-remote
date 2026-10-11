import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, realpath, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { validatePublicationPdf } from "../lib/publication-pdf";
import sharp from "sharp";
import { renderOfferCrop } from "../lib/weekly-offer-crops";
import { buildPublicOfferMetadata, validateOfferSummary, type ReviewedWeeklyOffer, type WeeklyOfferPublicSource } from "../lib/weekly-offer-metadata";
import { parseWeeklyPublication } from "../lib/weekly-publication";
import type { PublicationEdition, PublishedOffer } from "../lib/weekly-publication-types";
import { getCurrentWeekRange } from "../lib/editorial-schedule";
import { getAcceptedNlOfferRanges, getOfficialOfferRange } from "../lib/offer-validity";
import { withWeeklyPublicationTransaction } from "../lib/weekly-publication-transaction";
import { parseSupplementalPublication } from "../lib/supplemental-publication";
import { verifyPublicationEdition } from "../lib/publication-integrity";
import { assertPublicationPolicy } from "../lib/flyer-source-policy";

type Page = { page: number; sourceImage: string; expectedOffers: number; offers: ReviewedWeeklyOffer[] };
type Source = WeeklyOfferPublicSource & { privatePdf: string; printedValidFrom: string; printedValidTo: string; coverSha256: string; pageCount: number; pages: Page[] };
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

export function parseOfferArguments(args: readonly string[]) {
  let check = false, week: string | undefined, edition: string | undefined;
  const seen = new Set<string>();
  for (let i=0;i<args.length;i++) {
    const key=args[i];
    if (seen.has(key)) throw new Error(`Duplicate option: ${key}`); seen.add(key);
    if (key === "--check") { check=true; continue; }
    if (key !== "--week" && key !== "--edition") throw new Error(`Unknown option: ${key}`);
    const value=args[++i];
    if (!value || value.startsWith("--")) throw new Error(`Missing ${key} value`);
    if(key==="--week") {week=value;parseWeeklyPublication({schemaVersion:1,week,editions:[]});}
    else {edition=value;if(!/^[a-z0-9][a-z0-9-]{0,149}$/.test(edition))throw new Error("Invalid edition ID");}
  }
  if(week&&edition)throw new Error("--week and --edition are mutually exclusive");
  return {check,week,edition};
}

async function declaredEditions(root:string) {
  const editions:PublicationEdition[]=[];
  for(const register of ["weekly","supplemental"] as const) {
    let files;
    try {files=await readdir(path.join(root,`data/editorial/${register}-publications`),{withFileTypes:true});}
    catch(error) {if((error as NodeJS.ErrnoException).code==="ENOENT")continue;throw error;}
    for(const file of files) {
      if(!file.isFile())throw new Error("Invalid publication declaration");
      const item=JSON.parse((await safeRead(root,`data/editorial/${register}-publications/${file.name}`)).toString());
      if(register==="weekly") {
        const publication=parseWeeklyPublication(item);
        if(file.name!==`${publication.week}.json`)throw new Error("Publication filename/date mismatch");
        editions.push(...publication.editions);
      } else {
        const publication=parseSupplementalPublication(item);
        if(file.name!==`${publication.edition.id}.json`)throw new Error("Publication filename/identity mismatch");
        editions.push(publication.edition);
      }
    }
  }
  if(new Set(editions.map(item=>item.id)).size!==editions.length)throw new Error("Globally duplicate edition ID");
  return editions;
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
  validateOfferSummary(offer.summary);
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
  const {check,week,edition}=parseOfferArguments(args);
  return withWeeklyPublicationTransaction(root,async transaction=>{
  const layout=JSON.parse((await safeRead(root,"data/weekly-offer-layout.json")).toString()) as {sources:Source[]};
  if (!Array.isArray(layout.sources) || !layout.sources.length) throw new Error("Missing reviewed sources");
  if(new Set(layout.sources.map(source=>source.flyerId)).size!==layout.sources.length)throw new Error("Globally duplicate reviewed edition ID");
  const sources=layout.sources.filter(source=>{
    if(edition)return source.flyerId===edition&&source.identity?.purpose==="supplemental";
    if(check&&!week)return true;
    return source.identity?.purpose!=="supplemental"&&(!week||source.validFrom===week);
  });
  if (!sources.length) throw new Error("No reviewed sources for requested week");
  let existing:PublishedOffer[]=[];
  try { existing=JSON.parse((await safeRead(root,"data/weekly-offers.json")).toString()); }
  catch(error) { if (check || (error as NodeJS.ErrnoException).code!=="ENOENT") throw error; }
  if (!Array.isArray(existing) || new Set(existing.map(row=>row.id)).size!==existing.length) throw new Error("Duplicate or invalid published offers");
    const rows:PublishedOffer[]=[]; const ids=new Set<string>(); const sourceKeys=new Set<string>();
    const bindings=check?await declaredEditions(root):[];
    const selectedBindings=bindings.filter(item=>edition?item.id===edition&&item.identity.purpose==="supplemental":week?item.identity.purpose==="weekly"&&item.validFrom===week:true);
    if(check && (!isDeepStrictEqual(selectedBindings.map(item=>item.id).sort(),sources.map(source=>source.flyerId).sort())))throw new Error("Declared publications differ from reviewed sources");
    const assets:{imagePath:string;bytes:Buffer}[]=[];
    for (const source of sources) {
      const supplemental=source.identity?.purpose==="supplemental";
      if(!supplemental && source.language==="nl" && source.validFrom>="2026-10-12" && (!source.identity||!source.source))throw new Error("Missing typed agency provenance");
      const key=supplemental?source.flyerId:`${source.validFrom}:${source.language}`;
      if (sourceKeys.has(key) || !["de","nl"].includes(source.language) || source.rightsStatus!=="approved") throw new Error("Duplicate or unapproved reviewed source"); sourceKeys.add(key);
      if(source.identity) {
        if(source.identity.language!==source.language)throw new Error("Reviewed identity/language mismatch");
        if(!source.source && source.language==="nl")throw new Error("Missing typed source provenance");
        if(source.source)assertPublicationPolicy(source.identity,source.source,source.validFrom,source.validTo,supplemental?undefined:source.validFrom);
      }
      if(!supplemental)parseWeeklyPublication({schemaVersion:1,week:source.validFrom,editions:[]});
      const range=getCurrentWeekRange(new Date(`${source.validFrom}T12:00:00Z`));
      const identity=/^https:\/\/werbung\.trinkgut\.de\/frontend\/catalogs\/(\d+)\/(\d+)\/pdf\/complete\.pdf$/.exec(source.sourceUrl);
      const accepted=source.language==="nl"?getAcceptedNlOfferRanges(range):[getOfficialOfferRange(range,identity?{catalogId:identity[1],catalogVersion:identity[2]}:undefined)];
      if (!supplemental && !accepted.some(item=>item.validFrom===source.validFrom && item.validTo===source.validTo)) throw new Error("Invalid reviewed printed validity range");
      if (source.printedValidFrom!==source.validFrom || source.printedValidTo!==source.validTo || !/^[a-f0-9]{64}$/.test(source.coverSha256) || !source.reviewedAt) throw new Error("Missing original/date/cover review");
      if (!Number.isSafeInteger(source.pageCount) || source.pageCount<1 || source.pageCount>60 || (source.language==="nl" && source.pageCount!==1) || !Array.isArray(source.pages) || source.pages.length!==source.pageCount || source.pages.some((p,i)=>p.page!==i+1)) throw new Error(`${source.language}: incomplete or invalid original-page coverage`);
      let boundEdition:PublicationEdition|undefined;
      if (check) {
        const bound=selectedBindings.filter(edition=>edition.id===source.flyerId&&edition.language===source.language);
        if (bound.length!==1) throw new Error(`${source.language}: reviewed source is not bound to a weekly publication`);
        boundEdition=bound[0];
      }
      // An archive checks its immutable bound public original. New generation still
      // requires the strictly validated private input and its original page images.
      const pdf=await safeRead(root,check?`public${source.publishedPdfPath}`:source.privatePdf);
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
            // Delivery migration remains exact; reviewed text updates may reuse identical
            // original/crop bytes in build mode only. Check always requires the full record.
            const deliveryMigration=!check && source.language==="de" && isDeepStrictEqual(metadata,{...expected,sourceUrl:source.sourceUrl});
            const immutableMetadata=(row:typeof metadata)=>Object.fromEntries(Object.entries(row).filter(([key])=>!["summary","conditions","sourceWarning"].includes(key)));
            const reviewedTextUpdate=!check && isDeepStrictEqual(immutableMetadata(metadata),immutableMetadata(expected));
            if (!isDeepStrictEqual(metadata,expected) && !deliveryMigration && !reviewedTextUpdate) throw new Error(`Offer differs from reviewed source: ${offer.id}`);
            await imageIntegrity(await safeRead(root,`public${imagePath}`),offer,imageSha256);
            rows.push({...expected,imageSha256}); continue;
          }
          const bytes=await renderOfferCrop(image!,offer); const imageSha256=hash(bytes);
          const imagePath=`/images/offers/${offer.id}-${imageSha256}.webp`;
          const metadata=buildPublicOfferMetadata(source,page.page,offer,imagePath);
          await imageIntegrity(bytes,offer,imageSha256); assets.push({imagePath,bytes}); rows.push({...metadata,imageSha256});
        }
      }
      if (boundEdition) await verifyPublicationEdition(boundEdition,root);
    }
    if (check) {
      const selected=existing.filter(row=>sources.some(source=>source.flyerId===row.flyerId));
      if (selected.length!==ids.size || selected.some(row=>!ids.has(row.id))) throw new Error("Published selection is not the complete reviewed original set");
      if(!week&&!edition && selected.length!==existing.length)throw new Error("Published offer has no declared edition");
      return {count:ids.size,check};
    }
    const preserved=existing.filter(row=>!sources.some(source=>source.flyerId===row.flyerId));
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
