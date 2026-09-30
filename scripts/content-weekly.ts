import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { berlinDateKey, getCurrentWeekRange, getPublicationWeekRange } from "../lib/editorial-schedule";
import { fetchOfficialCatalog, loadValidatedHandzettelCache, validateCatalog } from "../lib/handzettel-catalog";
import { loadFlyerPackages, selectActiveFlyerPackages, selectWeeklyNlFlyer, verifyFlyerFiles } from "../lib/flyer-packages";
import { comparePublishedFlyers, isProductionOrigin, parseContentArguments, verifyPublishedFlyerMarkup, type PublishedFlyer } from "../lib/content-verification";
import { mapFlyerPackageToFlyer, mapHandzettelCacheToFlyer } from "../lib/homepage-content";
import { getOfferDemandRange, getOfficialOfferRange } from "../lib/offer-validity";

const {prepare,now,week:explicitWeek,url:overrideUrl} = parseContentArguments(process.argv.slice(2));
const range = explicitWeek ? getCurrentWeekRange(new Date(`${explicitWeek}T12:00:00Z`)) : prepare ? getPublicationWeekRange(now) : getCurrentWeekRange(now);
const offersRequired = prepare || berlinDateKey(now) <= getOfferDemandRange(range).validTo;
if (explicitWeek && range.validFrom !== explicitWeek) throw new Error("--week muss ein gültiger Montag sein.");
const root = process.cwd();
const lockPath = path.join(root, "data/editorial/.content-update.lock");
const runId = `${now.toISOString().replace(/[:.]/g, "-")}-${prepare ? "prepare" : "check"}-${randomUUID().slice(0,8)}`;
const report: Record<string, unknown> = { runId, mode: prepare ? "prepare" : "check", startedAt: new Date().toISOString(), evaluatedAt: now.toISOString(), timeZone: "Europe/Berlin", target: range, sources: [], errors: [], warnings: [], deploymentVerified: false };
const errors = report.errors as string[];
const warnings = report.warnings as string[];
const sources = report.sources as Record<string, unknown>[];
const expectedFlyers: PublishedFlyer[] = [];
let locked = false;

async function atomicJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try { await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" }); await rename(temp, file); }
  finally { await unlink(temp).catch(() => {}); }
}

async function main() {
try {
  if (prepare) {
    await mkdir(path.dirname(lockPath), { recursive: true });
    await writeFile(lockPath, JSON.stringify({runId, startedAt: report.startedAt}), { flag: "wx" });
    locked = true;
    try {
      const catalog = await fetchOfficialCatalog(new Date(`${range.validFrom}T12:00:00Z`));
      const packageData = { ...catalog, fetchedAt: new Date().toISOString() };
      validateCatalog(packageData, range);
      const file = path.join(root, "data/editorial/official-catalogs", `${range.validFrom}.json`);
      await atomicJson(file, packageData);
      sources.push({ source: "trinkgut-official", id: catalog.catalogId, file: path.relative(root, file), validFrom: catalog.validFrom, validTo: catalog.validTo, sha256: createHash("sha256").update(await readFile(file)).digest("hex"), result: "verified" });
    } catch (error) { errors.push(`Offizieller Handzettel nicht vorbereitet: ${error instanceof Error ? error.message : "Quellenfehler"}`); }
  } else {
    const catalog = await loadValidatedHandzettelCache(now);
    if (catalog) {
      expectedFlyers.push({...mapHandzettelCacheToFlyer(catalog),language:"de"});
      for (const [url, type] of [[catalog.pdfUrl, "application/pdf"], [catalog.pages[0].imageUrl, "image/jpeg"]]) {
        const response = await fetch(url, {method: "HEAD", signal: AbortSignal.timeout(20_000)});
        if (!response.ok || !response.headers.get("content-type")?.startsWith(type)) errors.push(`Offizielle Datei nicht erreichbar: ${url}`);
      }
      sources.push({source: "trinkgut-official", id: catalog.catalogId, validFrom: catalog.validFrom, validTo: catalog.validTo, result: "active"});
    } else if (offersRequired) errors.push("Kein gültiger deutscher Handzettel für die laufende Woche.");
  }

  const packages = await loadFlyerPackages();
  const nlFlyer = selectWeeklyNlFlyer(packages, range);
  const relevant = (prepare ? packages.filter((item) => item.validFrom <= range.validTo && item.validTo >= range.validFrom) : selectActiveFlyerPackages(packages, now)).filter(item => item.language !== "nl" || item.id === nlFlyer?.id);
  for (const item of relevant) {
    try {
      await verifyFlyerFiles(item, root);
      if (!prepare && !(item.language === "de" && expectedFlyers.some(f=>f.language === "de"))) expectedFlyers.push({...mapFlyerPackageToFlyer(item),language:item.language});
      sources.push({source: "canva", id: item.id, designId: item.designId, pageNumbers: item.pageNumbers, language: item.language, validFrom: item.validFrom, validTo: item.validTo, pdfSha256: item.pdfSha256, result: prepare ? "scheduled-and-verified" : "active-and-verified"});
    } catch (error) { errors.push(error instanceof Error ? error.message : `Dateifehler: ${item.id}`); }
  }
  if (offersRequired && !nlFlyer) errors.push("Pflicht-NL-Flyer fehlt: genau eine geprüfte Canva-Seite für die vollständige Zielwoche erforderlich.");

  const config = JSON.parse(await readFile(path.join(root, "data/editorial/source-config.json"), "utf8"));
  const publicUrl = overrideUrl ?? config.publicUrl;
  if (publicUrl && !prepare) {
    const origin = new URL(publicUrl);
    if (origin.username || origin.password || !["https:", "http:"].includes(origin.protocol)) throw new Error("Ungültige Prüf-URL.");
    const response = await fetch(new URL("/api/content/current", origin), {cache: "no-store", signal: AbortSignal.timeout(20_000)});
    const content = await response.json();
    const expectedDeEnd = expectedFlyers.find(flyer => flyer.language === "de")?.validTo ?? getOfficialOfferRange(range).validTo;
    if (!response.ok || (offersRequired && (!content.flyer || content.flyer.validFrom !== range.validFrom || content.flyer.validTo !== expectedDeEnd))) errors.push("Website/API zeigt nicht das erwartete aktuelle Wochenpaket.");
    const home = await fetch(origin, {cache: "no-store", signal: AbortSignal.timeout(20_000)});
    const html = await home.text();
    if (!home.ok || !html.includes('id="aktuell"')) errors.push("Homepage oder Angebotsbereich nicht erreichbar.");
    errors.push(...verifyPublishedFlyerMarkup(expectedFlyers, html, "/"));
    if (content.flyer) {
      for (const [link, type] of [[content.flyer.pdfUrl, "application/pdf"], [content.flyer.coverUrl, "image/"]]) {
        const file = await fetch(new URL(link, origin), {method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(20_000)});
        if (!file.ok || !file.headers.get("content-type")?.startsWith(type)) errors.push(`Veröffentlichte Handzetteldatei fehlt: ${link}`);
      }
      if (!html.includes(content.flyer.pdfUrl.replaceAll("&", "&amp;"))) errors.push("Homepage zeigt nicht den Handzettel aus der Inhalts-API.");
    }
    const indexResponse = await fetch(new URL("/api/content/flyers", origin), {cache: "no-store", signal: AbortSignal.timeout(20_000)});
    const index = await indexResponse.json();
    if (!indexResponse.ok) errors.push("Veröffentlichter Flyerindex ist nicht erreichbar.");
    if (index.status === "degraded") errors.push("Veröffentlichter Flyerindex meldet einen Integritätsfehler.");
    errors.push(...comparePublishedFlyers(expectedFlyers,index.flyers,content.flyer,content.nlFlyer));
    for (const route of ["/angebote","/handzettel","/nl"]) {
      const page = await fetch(new URL(route,origin),{cache:"no-store",signal:AbortSignal.timeout(20_000)});
      const markup = await page.text();
      if (!page.ok) errors.push(`Wochenflyerseite nicht erreichbar: ${route}.`);
      errors.push(...verifyPublishedFlyerMarkup(expectedFlyers, markup, route));
    }
    for (const item of selectActiveFlyerPackages(packages, now)) {
      if (item.language === "de" && content.flyer?.id.startsWith("catalog-")) continue;
      const published = Array.isArray(index.flyers) ? index.flyers.find((flyer: PublishedFlyer) => flyer.id === item.id) : undefined;
      if (!published || published.pdfUrl !== item.pdfPath || published.coverUrl !== item.coverPath) continue;
      for (const [link, hash] of [[published.pdfUrl, item.pdfSha256], [published.coverUrl, item.coverSha256]]) {
        const file = await fetch(new URL(link, origin), {cache: "no-store", signal: AbortSignal.timeout(20_000)});
        const bytes = await file.arrayBuffer();
        if (!file.ok || createHash("sha256").update(Buffer.from(bytes)).digest("hex") !== hash) errors.push(`Veröffentlichte Datei oder Prüfsumme fehlerhaft: ${link}`);
      }
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
