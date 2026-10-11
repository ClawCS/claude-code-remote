import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { parseFlyerPackages } from "./flyer-packages";
import { parseSupplementalPublication, type SupplementalPublication } from "./supplemental-publication";
import { countPublicationEditionIds, verifyPublicationEdition } from "./publication-integrity";
import { withWeeklyPublicationTransaction } from "./weekly-publication-transaction";
import { buildPublicOfferMetadata, type ReviewedWeeklyOffer, type WeeklyOfferPublicSource } from "./weekly-offer-metadata";
import type { PublishedOffer } from "./weekly-publication-types";
import { atomicPublicationBytes, immutablePublicationAsset, localPublicationBytes, publicationDirectory, publicationHash } from "./publication-assembly-files";

type LayoutSource=WeeklyOfferPublicSource & {privatePdf:string;privateCover?:string;title?:string;printedValidFrom:string;printedValidTo:string;coverSha256:string;pageCount:number;pages:{page:number;expectedOffers:number;offers:ReviewedWeeklyOffer[]}[]};

/** One independently dated issue; preparation never rewrites another register or offer rows. */
export async function assembleSupplementalPublication(id:string,root:string):Promise<SupplementalPublication> {
  if(!/^[a-z0-9][a-z0-9-]{0,149}$/.test(id))throw new Error("Invalid supplemental edition ID");
  return withWeeklyPublicationTransaction(root,async transaction=>{
    const manifest=`data/editorial/supplemental-publications/${id}.json`;
    let previous:SupplementalPublication|undefined;
    try {previous=parseSupplementalPublication(JSON.parse((await localPublicationBytes(root,manifest)).toString()));}
    catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
    if(previous && previous.edition.id!==id)throw new Error("Supplemental filename/identity mismatch");
    const counts=await countPublicationEditionIds(root);
    if((counts.get(id)??0)>(previous?1:0))throw new Error("Globally duplicate edition ID");
    const layout=JSON.parse((await localPublicationBytes(root,"data/weekly-offer-layout.json")).toString()) as {sources:LayoutSource[]};
    if(!Array.isArray(layout.sources))throw new Error("Missing reviewed layout");
    const sources=layout.sources.filter(source=>source.flyerId===id);
    if(sources.length!==1 || sources[0].identity?.purpose!=="supplemental")throw new Error("Missing or duplicate supplemental reviewed source");
    const source=sources[0];
    if(source.source?.kind!=="canva")throw new Error("Missing typed supplemental provenance");
    const originalId=source.source.flyerId;
    const entries=JSON.parse((await localPublicationBytes(root,"data/editorial/flyers.json")).toString());
    if(!Array.isArray(entries))throw new Error("Invalid flyer provenance list");
    const matches=entries.filter(row=>row&&typeof row==="object"&&row.id===originalId);
    if(matches.length!==1)throw new Error("Missing or duplicate supplemental original");
    const [flyer]=parseFlyerPackages(matches);
    if(!isDeepStrictEqual(source.identity,flyer.identity)||!isDeepStrictEqual(source.source,flyer.source)
      || source.approvedAt!==flyer.review?.approvedAt)throw new Error("Reviewed provenance binding mismatch");
    const rows=JSON.parse((await localPublicationBytes(root,"data/weekly-offers.json")).toString()) as PublishedOffer[];
    if(!Array.isArray(rows))throw new Error("Invalid public offer rows");
    const offers=rows.filter(row=>row.flyerId===id).toSorted((a,b)=>a.id.localeCompare(b.id));
    const canonical=offers.map(row=>{
      const page=source.pages.find(page=>page.offers.some(offer=>offer.id===row.id)),offer=page?.offers.find(offer=>offer.id===row.id);
      if(!page||!offer)throw new Error("Unexpected public offer outside reviewed layout");
      return {...buildPublicOfferMetadata(source,page.page,offer,offer.imagePath??`/images/offers/${offer.id}-${row.imageSha256}.webp`),imageSha256:row.imageSha256};
    });
    const pdf=await localPublicationBytes(root,source.privatePdf),cover=await localPublicationBytes(root,source.privateCover??`public${flyer.coverPath}`);
    const publication=parseSupplementalPublication({schemaVersion:1,edition:{id,language:source.language,title:source.title??flyer.title,
      identity:flyer.identity,source:flyer.source,validFrom:source.validFrom,validTo:source.validTo,
      pdf:{path:source.publishedPdfPath,sha256:source.pdfSha256,bytes:pdf.length},cover:{path:flyer.coverPath,sha256:source.coverSha256,bytes:cover.length},pageCount:source.pageCount,
      review:{reviewedAt:source.reviewedAt,approvedAt:source.approvedAt,printedValidFrom:source.printedValidFrom,printedValidTo:source.printedValidTo,pageOfferCounts:source.pages.map(page=>page.expectedOffers)},
      offerIds:offers.map(offer=>offer.id),offersSha256:publicationHash(JSON.stringify(canonical))}});
    const assets=[{asset:publication.edition.pdf,bytes:pdf},{asset:publication.edition.cover,bytes:cover}];
    for(const {asset} of assets) {
      const old=[previous?.edition.pdf,previous?.edition.cover].find(item=>item?.path===asset.path);
      if(old&&(old.sha256!==asset.sha256||old.bytes!==asset.bytes))throw new Error("Changed original requires a new unique published path");
    }
    const candidate=await publicationDirectory(root,`.superpowers/supplemental-preparation/${id}/assembly-${randomUUID()}`);
    try {
      for(const file of ["data/weekly-offer-layout.json","data/weekly-offers.json","data/editorial/flyers.json"])await atomicPublicationBytes(path.join(candidate,file),await localPublicationBytes(root,file));
      for(const {asset,bytes} of assets)await immutablePublicationAsset(candidate,asset,bytes);
      for(const offer of offers){const bytes=await localPublicationBytes(root,`public${offer.image}`);await immutablePublicationAsset(candidate,{path:offer.image,sha256:offer.imageSha256,bytes:bytes.length},bytes);}
      await verifyPublicationEdition(publication.edition,candidate);
      for(const {asset,bytes} of assets) {
        try {if(!(await localPublicationBytes(root,`public${asset.path}`)).equals(bytes))throw new Error("Cannot overwrite a published path with different bytes");}
        catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
      }
      for(const {asset,bytes} of assets)await immutablePublicationAsset(root,asset,bytes);
      await transaction.beginBinding();
      await verifyPublicationEdition(publication.edition,root);
      await publicationDirectory(root,"data/editorial/supplemental-publications");
      if(!previous||JSON.stringify(previous)!==JSON.stringify(publication))await atomicPublicationBytes(path.join(root,manifest),`${JSON.stringify(publication,null,2)}\n`);
      await transaction.commit();
      return publication;
    } finally {await rm(candidate,{recursive:true,force:true});}
  });
}
