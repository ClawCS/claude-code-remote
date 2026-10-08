import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import { berlinDateKey, getCurrentWeekRange, getPublicationWeekRange } from "../lib/editorial-schedule";
import { fetchOfficialCatalog, validateCatalog } from "../lib/handzettel-catalog";
import { loadFlyerPackages, selectWeeklyNlFlyer, verifyFlyerFiles } from "../lib/flyer-packages";
import { comparePublishedFlyers, isProductionOrigin, parseContentArguments, verifyPublishedFlyerMarkup, verifyPublishedOfferContent, verifyPublishedOfferMarkup, verifyLegacyPublishedFlyer, type PublishedFlyer } from "../lib/content-verification";
import { loadWeeklyPublications, selectPublishedEditions } from "../lib/weekly-publication";
import { selectWeeklyOfferContent } from "../lib/weekly-offer-selection";
import { getOfferDemandRange } from "../lib/offer-validity";
import { assembleWeeklyPublication, importOfficialPublication, WeeklyPreparationError } from "../lib/official-publication-import";
import { buildWeeklyOffers } from "./build-weekly-offers";
import type { WeeklyPublication, WeeklyOfferContent, VerifiedWeeklyEdition } from "../lib/weekly-publication-types";

const {prepare,now,week:explicitWeek,url:overrideUrl} = parseContentArguments(process.argv.slice(2));
const range = explicitWeek ? getCurrentWeekRange(new Date(`${explicitWeek}T12:00:00Z`)) : prepare ? getPublicationWeekRange(now) : getCurrentWeekRange(now);
const offersRequired = prepare || !!explicitWeek || berlinDateKey(now) <= getOfferDemandRange(range).validTo;
if (explicitWeek && range.validFrom !== explicitWeek) throw new Error("--week muss ein gültiger Montag sein.");
const root = process.cwd();
const lockPath = path.join(root, "data/editorial/.content-update.lock");
const runId = `${now.toISOString().replace(/[:.]/g, "-")}-${prepare ? "prepare" : "check"}-${randomUUID().slice(0,8)}`;
const report: Record<string, unknown> = { runId, mode: prepare ? "prepare" : "check", startedAt: new Date().toISOString(), evaluatedAt: now.toISOString(), timeZone: "Europe/Berlin", target: range, sources: [], errors: [], warnings: [], websiteVerified: false, deploymentVerified: false };
const errors = report.errors as string[];
const warnings = report.warnings as string[];
const sources = report.sources as Record<string, unknown>[];
const expectedFlyers: PublishedFlyer[] = [];
let locked = false;
let preparedPublication: WeeklyPublication | undefined;
let expectedOffers: WeeklyOfferContent = {status:"ok",issues:[],generatedAt:now.toISOString(),flyers:[],offers:[]};
let checkedEditions: readonly VerifiedWeeklyEdition[] = [];

async function main() {
try {
  if (prepare) {
    await mkdir(path.dirname(lockPath), { recursive: true });
    await writeFile(lockPath, JSON.stringify({runId, startedAt: report.startedAt}), { flag: "wx" });
    locked = true;
    try {
      // A reviewed local package remains usable if the upstream original later disappears.
      preparedPublication = await assembleWeeklyPublication(range.validFrom, root);
      await buildWeeklyOffers(root, ["--check", "--week", range.validFrom]);
      const complete = ["de","nl"].every(language=>preparedPublication!.editions.some(edition=>edition.language===language));
      for (const edition of preparedPublication.editions) sources.push({source:edition.source.kind,id:edition.id,language:edition.language,validFrom:edition.validFrom,validTo:edition.validTo,result:complete?"reviewed-local-package":"verified-partial-package",bound:true});
      report.packageVerified = complete;
      if (!complete) report.partialPackage = {bound:true,issues:["de","nl"].filter(language=>!preparedPublication!.editions.some(edition=>edition.language===language)).map(language=>({language,message:"Required reviewed edition missing"}))};
      if (!preparedPublication.editions.some(edition => edition.language === "de")) throw new Error("Geprüftes DE-Angebotspaket fehlt.");
    } catch (error) {
      if (error instanceof WeeklyPreparationError) {
        preparedPublication = error.publication;
        report.partialPackage = {bound:error.bound,issues:error.issues};
        for (const edition of error.publication.editions) sources.push({source:edition.source.kind,id:edition.id,language:edition.language,validFrom:edition.validFrom,validTo:edition.validTo,result:"verified-partial-package",bound:error.bound});
        for (const issue of error.issues) errors.push(`${issue.language.toUpperCase()}-Angebotspaket unvollständig: ${issue.message}`);
      } else errors.push(`Offizieller Handzettel nicht vorbereitet: ${error instanceof Error ? error.message : "Quellenfehler"}`);
    }
    if (!preparedPublication?.editions.some(edition => edition.language === "de")) {
      try {
        let catalog = await fetchOfficialCatalog(new Date(`${range.validFrom}T12:00:00Z`));
        validateCatalog(catalog, range);
        try {
          const bound = JSON.parse(await readFile(path.join(root, `data/editorial/official-catalogs/${range.validFrom}.json`), "utf8"));
          validateCatalog(bound, range);
          if (isDeepStrictEqual({...bound,fetchedAt:null},{...catalog,fetchedAt:null})) catalog=bound;
        } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
        const imported = await importOfficialPublication(catalog, {root});
        sources.push({source:"trinkgut-official",id:catalog.catalogId,validFrom:catalog.validFrom,validTo:catalog.validTo,result:"staged-awaiting-original-layout-review",pdfSha256:imported.pdf.sha256,coverSha256:imported.cover.sha256,stagingDirectory:path.relative(root,imported.stagingDirectory)});
        errors.push("Originale privat vorbereitet; datums-/sprach-/hashgebundene Layoutprüfung und offers:build -- --week sind vor der Wochenbindung erforderlich.");
      } catch (error) { errors.push(`Offizieller Handzettel nicht vorbereitet: ${error instanceof Error ? error.message : "Quellenfehler"}`); }
    }
  } else {
    const loaded=await loadWeeklyPublications(root);
    expectedOffers=selectWeeklyOfferContent(loaded,now);
    expectedFlyers.push(...expectedOffers.flyers);
    const targetEditions=loaded.editions.filter(item=>item.edition.validFrom===range.validFrom);
    for (const issue of loaded.issues.filter(issue=>issue.week===null||issue.week===range.validFrom)) errors.push(`Wochenbindung ungültig: ${issue.language?.toUpperCase()??"DE/NL"} ${issue.code}`);
    if (offersRequired) for (const language of ["de","nl"]) {
      if (!targetEditions.some(item=>item.edition.language===language)) errors.push(`Pflicht-${language.toUpperCase()}-Angebotspaket fehlt: vollständige geprüfte Wochenbindung erforderlich.`);
    }
    checkedEditions=[...new Map([...selectPublishedEditions(loaded,now),...(explicitWeek?targetEditions:[])].map(item=>[item.edition.id,item])).values()];
    for (const {edition} of checkedEditions) sources.push({source:edition.source.kind,id:edition.id,language:edition.language,validFrom:edition.validFrom,validTo:edition.validTo,result:"bound-and-verified",pdfSha256:edition.pdf.sha256});
  }

  if (prepare) {
    const packages=await loadFlyerPackages();
    const nlFlyer=selectWeeklyNlFlyer(packages,range);
    for (const item of packages.filter(item=>item.validFrom<=range.validTo&&item.validTo>=range.validFrom).filter(item=>item.language!=="nl"||item.id===nlFlyer?.id)) {
      try { await verifyFlyerFiles(item,root); }
      catch(error) {errors.push(error instanceof Error?error.message:`Dateifehler: ${item.id}`);}
    }
    if (!nlFlyer) errors.push("Pflicht-NL-Flyer fehlt: genau eine geprüfte Canva-Seite für die vollständige Zielwoche erforderlich.");
    if (nlFlyer&&!preparedPublication?.editions.some(edition=>edition.language==="nl")) errors.push("Pflicht-NL-Angebotspaket fehlt: Original-/Layoutprüfung und vollständige Angebotskacheln erforderlich.");
  }

  const config = JSON.parse(await readFile(path.join(root, "data/editorial/source-config.json"), "utf8"));
  const publicUrl = overrideUrl ?? config.publicUrl;
  if (publicUrl && !prepare) {
    const origin = new URL(publicUrl);
    if (origin.username || origin.password || !["https:", "http:"].includes(origin.protocol)) throw new Error("Ungültige Prüf-URL.");
    const request=async (route:string)=>{
      const response=await fetch(new URL(route,origin),{cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(20_000)});
      if (!response.ok) errors.push(`Veröffentlichter Abruf nicht erfolgreich: ${route} (${response.status}).`);
      return response;
    };
    const json=async (route:string)=>{
      const response=await request(route);
      if (!response.headers.get("content-type")?.startsWith("application/json")) errors.push(`Veröffentlichtes API-Format fehlerhaft: ${route}`);
      return response.json();
    };
    const content=await json("/api/content/current");
    const index=await json("/api/content/flyers");
    const offers=await json("/api/content/offers");
    errors.push(...comparePublishedFlyers(expectedFlyers,index.flyers,content.flyer,content.nlFlyer));
    if (index.status!==expectedOffers.status || !isDeepStrictEqual([...(index.issues??[])].sort(),[...expectedOffers.issues].sort())) errors.push("Veröffentlichter Flyerindex meldet nicht den geprüften Integritätsstatus.");
    errors.push(...verifyPublishedOfferContent(expectedOffers,offers));
    errors.push(...verifyLegacyPublishedFlyer(expectedFlyers.find(item=>item.language==="de"),await json("/api/handzettel/fetch")));
    for (const route of ["/","/angebote","/handzettel","/nl"]) {
      const page=await request(route);const html=await page.text();
      if (!page.headers.get("content-type")?.startsWith("text/html")) errors.push(`Wochenflyerseite liefert kein HTML: ${route}`);
      if (route==="/"&&!html.includes('id="aktuell"')) errors.push("Homepage oder Angebotsbereich nicht erreichbar.");
      errors.push(...verifyPublishedFlyerMarkup(expectedFlyers,html,route));
    }
    for (const route of ["/produkte",...new Set(expectedOffers.offers.map(offer=>`/kategorie/${offer.categorySlug}`))]) {
      const page=await request(route);const html=await page.text();
      if (!page.headers.get("content-type")?.startsWith("text/html")) errors.push(`Angebotsseite liefert kein HTML: ${route}`);
      errors.push(...verifyPublishedOfferMarkup(route==="/produkte"?expectedOffers.offers:expectedOffers.offers.filter(offer=>route===`/kategorie/${offer.categorySlug}`),html,route));
    }
    const assets=new Map<string,{sha256:string;bytes:number}>();
    for (const {edition,offers} of checkedEditions) {
      assets.set(edition.pdf.path,edition.pdf);assets.set(edition.cover.path,edition.cover);
      for (const offer of offers) assets.set(offer.image,{sha256:offer.imageSha256,bytes:(await stat(path.join(root,`public${offer.image}`))).size});
    }
    for (const [link,expected] of assets) {
      const file=await request(link);
      const type=link.endsWith(".pdf")?"application/pdf":link.endsWith(".webp")?"image/webp":link.endsWith(".png")?"image/png":link.endsWith(".avif")?"image/avif":"image/jpeg";
      if (file.headers.get("content-type")?.split(";")[0].trim()!==type) errors.push(`Veröffentlichter Dateityp fehlerhaft: ${link}`);
      const bytes=Buffer.from(await file.arrayBuffer());
      if (bytes.length!==expected.bytes||createHash("sha256").update(bytes).digest("hex")!==expected.sha256) errors.push(`Veröffentlichte Datei, Größe oder Prüfsumme fehlerhaft: ${link}`);
    }
    report.websiteVerified = errors.length === 0;
    report.deploymentVerified = errors.length === 0 && isProductionOrigin(origin.origin,config.publicUrl);
    if (!report.deploymentVerified) warnings.push("Keine bestätigte öffentliche Produktionsadresse geprüft; nur Website-/Vorschauprüfung.");
    report.checkedUrl = origin.origin;
  } else if (!publicUrl) warnings.push("Öffentliche Bereitstellungs-URL fehlt; Live-Veröffentlichung noch nicht geprüft.");
} catch (error) {
  errors.push(error instanceof Error ? error.message : "Unbekannter Prüffehler.");
} finally {
  if (locked) await unlink(lockPath).catch(() => {});
  report.finishedAt = new Date().toISOString();
  report.status = errors.length ? "failed" : warnings.length ? "degraded" : "ok";
  await mkdir(path.join(root,"audit/content-runs"),{recursive:true});
  await writeFile(path.join(root,"audit/content-runs",`${runId}.json`),`${JSON.stringify(report,null,2)}\n`,{flag:"wx"});
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (errors.length) process.exitCode = 1;
}
}
main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : "Wochenlauf fehlgeschlagen"}\n`); process.exitCode = 1; });
