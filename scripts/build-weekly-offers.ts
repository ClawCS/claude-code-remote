import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import sharp from "sharp";
import { renderOfferCrop } from "../lib/weekly-offer-crops";
import { buildPublicOfferMetadata, type ReviewedWeeklyOffer, type WeeklyOfferPublicSource } from "../lib/weekly-offer-metadata";

type Page = { page:number; sourceImage:string; expectedOffers:number; offers:ReviewedWeeklyOffer[] };
type Source = WeeklyOfferPublicSource & {privatePdf:string;pageCount:number;pages:Page[]};
const hash=(bytes:Buffer)=>createHash("sha256").update(bytes).digest("hex");

async function main() {
  const {sources} = JSON.parse(await readFile("data/weekly-offer-layout.json","utf8")) as {sources:Source[]};
  const check=process.argv.includes("--check");
  const rows: Record<string,unknown>[]=[];
  const ids=new Set<string>();
  const existing=check?JSON.parse(await readFile("data/weekly-offers.json","utf8")) as (Record<string,unknown> & {id:string;imageSha256:string})[]:[];
  for (const source of sources) {
    if (source.pages.length!==source.pageCount || source.pages.some((p,i)=>p.page!==i+1)) throw new Error(`${source.language}: incomplete original-page coverage`);
    if (!check && hash(await readFile(source.privatePdf))!==source.pdfSha256) throw new Error(`${source.language}: original PDF changed`);
    for (const page of source.pages) {
      if (page.expectedOffers!==page.offers.length) throw new Error(`${source.language} page ${page.page}: incomplete offer coverage`);
      const image=check?undefined:await readFile(page.sourceImage);
      for (const offer of page.offers) {
        if (!/^[a-z0-9-]+$/.test(offer.id) || ids.has(offer.id)) throw new Error(`Invalid or duplicate offer: ${offer.id}`);
        ids.add(offer.id);
        const expectedMetadata=buildPublicOfferMetadata(source,page.page,offer);
        if (check) {
          const row=existing.find(item=>item.id===offer.id);
          if (!row) throw new Error(`Offer differs from reviewed source: ${offer.id}`);
          const {imageSha256,...metadata}=row;
          if (!isDeepStrictEqual(metadata,expectedMetadata)) throw new Error(`Offer differs from reviewed source: ${offer.id}`);
          const bytes=await readFile(`public${expectedMetadata.image}`);
          const dimensions=await sharp(bytes).metadata();
          if (hash(bytes)!==imageSha256 || dimensions.width!==offer.rect[2] || dimensions.height!==offer.rect[3]) throw new Error(`Offer image integrity: ${offer.id}`);
          continue;
        }
        const bytes=await renderOfferCrop(image!,offer);
        await mkdir("public/images/offers",{recursive:true});
        await writeFile(`public${expectedMetadata.image}`,bytes);
        rows.push({...expectedMetadata,imageSha256:hash(bytes)});
      }
    }
  }
  if (check) {
    if (existing.length!==ids.size || existing.some(item=>!ids.has(item.id))) throw new Error("Published selection is not the complete reviewed original set");
    console.log(`Alle ${ids.size} Originalangebote und ihre Bilder geprüft.`);
  } else {
    await writeFile("data/weekly-offers.json",JSON.stringify(rows,null,2)+"\n");
    console.log(`${rows.length} vollständige Originalangebote vorbereitet.`);
  }
}
main().catch(error=>{console.error(error instanceof Error?error.message:"Angebotsbilder konnten nicht verarbeitet werden");process.exitCode=1;});
