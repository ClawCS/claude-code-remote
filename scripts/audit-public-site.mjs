#!/usr/bin/env node
/**
 * Read-only publication audit for this repository.
 * GET/HEAD inspect public content. The only POST probes have an empty body and
 * no Authorization header: the reviewed paused handlers and protected flyer
 * handlers reject them before executing a refresh. Rental probes carry no
 * Origin, credentials, valid order ID or payment ID and cannot create an order,
 * trigger a payment, or authorize a market action.
 * HTML, API bodies, cookies, external account URLs and credentials are never
 * included in the evidence file. External links/resources are not fetched.
 */
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { decode, renderedTree, walk } from "../lib/rendered-html.mjs";

const EXTRA_PAGES = ["/warenkorb", "/checkout", "/bestellungen", "/kuehlschrank", "/akademie/zertifikate"];
const UNKNOWN_PAGES = ["/produkte/__audit_unknown__", "/kategorie/__audit_unknown__", "/cocktails/__audit_unknown__", "/cocktails/kategorie/__audit_unknown__", "/akademie/__audit_unknown__"];
const API_CHECKS = [
  { path: "/api/content/current", method: "GET", statuses: [200] },
  { path: "/api/content/flyers", method: "GET", statuses: [200] },
  { path: "/api/content/offers", method: "GET", statuses: [200] },
  ...["current","flyers","offers"].map(name=>({path:`/api/content/${name}`,method:"POST",statuses:[405],frameworkRejection:true})),
  { path: "/api/community", method: "GET", statuses: [200], unavailable: true },
  { path: "/api/handzettel/fetch", method: "GET", statuses: [200] },
  { path: "/api/handzettel/cron", method: "GET", statuses: [401, 503] },
  { path: "/api/handzettel/fetch?refresh=true", method: "GET", statuses: [401, 503] },
  ...["community", "chat", "kuehlschrank", "leergut-scan"].map(route => ({ path: `/api/${route}`, method: "POST", statuses: [503] })),
  ...["/api/handzettel/cron", "/api/handzettel/fetch"].map(path => ({ path, method: "POST", statuses: [401, 503] })),
  { path: "/api/rentals/config", method: "GET", statuses: [200] },
  { path: "/api/rentals/quote", method: "POST", statuses: [403] },
  { path: "/api/rentals/orders", method: "POST", statuses: [403, 503] },
  { path: "/api/rentals/orders/__audit_unknown__", method: "GET", statuses: [404, 503] },
  { path: "/api/rentals/orders/__audit_unknown__/documents/invoice", method: "GET", statuses: [404, 503] },
  { path: "/api/rentals/orders/__audit_unknown__/test-payment", method: "POST", statuses: [404, 503] },
  { path: "/api/rentals/webhook", method: "POST", statuses: [400, 404, 503] },
  { path: "/api/rental-admin/session", method: "POST", statuses: [403, 503] },
  { path: "/api/rental-admin/orders", method: "GET", statuses: [401, 503] },
  { path: "/api/rental-admin/orders/__audit_unknown__", method: "POST", statuses: [401, 503] },
  { path: "/api/rental-admin/orders/__audit_unknown__/documents/invoice", method: "GET", statuses: [401, 503] },
  { path: "/api/rental-admin/outbox", method: "POST", statuses: [401, 503] },
  { path: "/api/rental-admin/test-mails", method: "GET", statuses: [401, 503] },
];
const ROOT_LANDMARK_CONTEXTS = new Set(["main", "article", "section", "aside", "nav"]);

function inspectHtml(html) {
  const landmarks = { h1: 0, main: 0, header: 0, footer: 0 };
  const ids = new Set();
  const links = [];
  const assets = [];
  let legacy = false;
  let cinematicHero = false;
  walk(renderedTree(html), (node, ancestors) => {
    if (node.attrs.id) ids.add(node.attrs.id);
    if (node.tag === "h1" || node.tag === "main") landmarks[node.tag]++;
    if ((node.tag === "header" || node.tag === "footer") && !ancestors.some(tag => ROOT_LANDMARK_CONTEXTS.has(tag))) landmarks[node.tag]++;
    if (Object.hasOwn(node.attrs, "data-legacy-footer") || /(?:^|\s)glass-header(?:\s|$)/.test(node.attrs.class ?? "")) legacy = true;
    if (node.attrs["data-hero"] === "cinematic") cinematicHero = true;
    if (node.tag === "a" && node.attrs.href) links.push({ href: node.attrs.href, target: node.attrs.target, rel: node.attrs.rel ?? "" });
    if (["img", "script", "video", "audio", "source", "iframe"].includes(node.tag) && node.attrs.src) assets.push(node.attrs.src);
    if (node.tag === "video" && node.attrs.poster) assets.push(node.attrs.poster);
    if (node.tag === "link" && /\b(?:stylesheet|preload|modulepreload|icon)\b/.test(node.attrs.rel ?? "") && node.attrs.href) assets.push(node.attrs.href);
    if (["img", "source"].includes(node.tag) && node.attrs.srcset && !node.attrs.srcset.startsWith("data:")) {
      for (const source of node.attrs.srcset.split(",")) assets.push(source.trim().split(/\s+/)[0]);
    }
  });
  return { landmarks, ids, links, assets, legacy, cinematicHero };
}

async function parallel(items, task, count = 4) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(count, items.length) }, async () => {
    while (cursor < items.length) { const item = items[cursor++]; await task(item); }
  }));
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
  if (args.includes("--help")) {
    console.log("Usage: node scripts/audit-public-site.mjs --url http://127.0.0.1:3000 [--output audit/evidence/public-site-completion-2026-09-30.json]\nRead-only GET/HEAD and empty unauthenticated rejection probes for reviewed disabled/protected APIs. No external requests.");
    return;
  }
  const target = new URL(getArg("--url") ?? "http://127.0.0.1:3000");
  if (!["http:", "https:"].includes(target.protocol) || target.username || target.password) throw new Error("Use an HTTP(S) origin without credentials");
  const base = new URL(target.origin);
  const output = resolve(getArg("--output") ?? "audit/evidence/public-site-completion-2026-09-30.json");
  const report = {
    schemaVersion: 1, auditedAt: new Date().toISOString(), baseUrl: base.origin,
    scope: "HTTP/SSR route, resource and rejection-contract audit; not a legal opinion or browser interaction/accessibility test",
    safety: { externalRequests: false, authorizationHeaders: false, persistedBodies: false, postBody: "empty object", authorizedRefresh: false },
    summary: {}, pages: [], unknownPages: [], resources: [], apis: [], findings: [],
  };
  const auditNow = new Date(report.auditedAt);
  const berlinDate = new Intl.DateTimeFormat("en-CA", {timeZone:"Europe/Berlin"});
  const today = berlinDate.format(auditNow);
  const monday = new Date(`${today}T12:00:00Z`);
  const sunday = monday.getUTCDay() === 0;
  const berlinHour = Number(new Intl.DateTimeFormat("en-GB", {timeZone:"Europe/Berlin",hour:"2-digit",hourCycle:"h23"}).format(auditNow));
  monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));
  // Flyer visibility starts Sunday 16:00. Never change the printed price interval.
  if (sunday && berlinHour >= 16) monday.setUTCDate(monday.getUTCDate()+7);
  const week = monday.toISOString().slice(0,10);
  const saturday = new Date(monday);saturday.setUTCDate(saturday.getUTCDate()+5);
  // Same source-reviewed KW40 exception as lib/offer-validity.ts; never infer holidays.
  const demandTo = week === "2026-09-28" ? "2026-10-02" : saturday.toISOString().slice(0,10);
  const findings = report.findings;
  const fail = (code, path, detail) => findings.push({ severity: "error", code, path, detail });
  const warn = (code, path, detail) => findings.push({ severity: "warning", code, path, detail });
  const permittedOrigins = new Set([base.origin]);
  const pages = new Map();
  const linkTargets = new Map();
  const assetPaths = new Set();
  let externalLinkCount = 0;

  async function fetchLocal(path, method = "GET") {
    try {
      return await fetch(new URL(path, base), {
        method, redirect: "manual", signal: AbortSignal.timeout(45000),
        ...(path === "/api/bewerbung/config" ? { headers: { "Sec-Fetch-Site": "same-origin", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Dest": "empty" } } : {}),
        ...(path === "/api/content/offers" && method === "GET" ? {headers:{"X-Jammers-Content-Version":"2"}} : {}),
        ...(method === "POST" && path !== "/api/bewerbung" ? { headers: { "Content-Type": "application/json" }, body: "{}" } : {}),
      });
    } catch (error) { fail("request-failed", path, `${method} failed (${error?.name ?? "network error"})`); return null; }
  }

  function security(response, path) {
    const sensitive = /^\/(?:bewerbung|api\/(?:rentals|rental-admin|bewerbung|bewerbungsverwaltung))(?:\/|$)/.test(path);
    const referrer = sensitive ? "no-referrer" : "strict-origin-when-cross-origin";
    if (/^\/(?:bewerbung|api\/(?:bewerbung|bewerbungsverwaltung))(?:\/|$)/.test(path) && !response.headers.get("x-robots-tag")?.includes("noindex")) fail("security-header",path,"Sensitive application route lacks noindex");
    for (const [name, value] of [["x-content-type-options", "nosniff"], ["x-frame-options", "SAMEORIGIN"], ["referrer-policy", referrer]]) {
      if (response.headers.get(name) !== value) fail("security-header", path, `${name} missing or incorrect`);
    }
    const policy = response.headers.get("content-security-policy") ?? "";
    if (!policy.includes("default-src 'self'") || !policy.includes("object-src 'none'") || !policy.includes("frame-ancestors 'self'")) fail("security-header", path, "Content-Security-Policy lacks the configured source/object/framing controls");
    if (response.headers.has("x-powered-by")) fail("security-header", path, "x-powered-by discloses the framework");
    if (base.protocol === "https:" && !response.headers.get("strict-transport-security")) fail("security-header", path, "HTTPS response lacks HSTS");
  }

  function localUrl(value, pagePath) {
    if (/^(?:mailto:|tel:|data:|blob:)/i.test(value)) return null;
    if (/^javascript:/i.test(value)) { fail("unsafe-link", pagePath, "javascript URL is present"); return null; }
    try {
      const url = new URL(value, new URL(pagePath, base));
      return permittedOrigins.has(url.origin) ? new URL(`${url.pathname}${url.search}${url.hash}`, base) : false;
    } catch { fail("invalid-url", pagePath, "Malformed local URL"); return null; }
  }

  async function auditPage(path, source = "sitemap") {
    if (pages.has(path)) return pages.get(path);
    const operation = (async () => {
      const response = await fetchLocal(path);
      const entry = { path, source, status: response?.status ?? null, landmarks: null };
      report.pages.push(entry);
      if (!response) return null;
      security(response, path);
      if (response.status !== 200) { fail("page-status", path, `Expected 200 without redirect; received ${response.status}`); await response.body?.cancel(); return null; }
      if (!response.headers.get("content-type")?.includes("text/html")) { fail("page-content-type", path, "Expected HTML"); await response.body?.cancel(); return null; }
      const parsed = inspectHtml(await response.text());
      entry.landmarks = parsed.landmarks;
      for (const [name, count] of Object.entries(parsed.landmarks)) if (count !== 1) fail(`landmark-${name}`, path, `Expected one ${name}; found ${count}`);
      if (parsed.legacy) fail("legacy-chrome", path, "Old global header/footer is present");
      if (path !== "/" && parsed.cinematicHero) fail("homepage-hero-on-subpage", path, "Homepage hero is reused on a subpage");
      for (const link of parsed.links) {
        const url = localUrl(link.href, path);
        if (url === false) {
          externalLinkCount++;
          if (link.target === "_blank" && (!/\bnoopener\b/.test(link.rel) || !/\bnoreferrer\b/.test(link.rel))) fail("external-link-rel", path, "New-tab external link lacks noopener/noreferrer");
          continue;
        }
        if (!url) continue;
        const local = `${url.pathname}${url.search}`;
        if (url.pathname.startsWith("/api/")) { warn("api-link-not-followed", path, "API link excluded from automatic page crawling"); continue; }
        if (/\.(?:pdf|json|jpe?g|png|webp|svg|gif|ico)(?:$|\?)/i.test(local)) { assetPaths.add(local); continue; }
        const references = linkTargets.get(local) ?? [];
        references.push({ from: path, fragment: url.hash ? decodeURIComponent(url.hash.slice(1)) : null });
        linkTargets.set(local, references);
      }
      for (const value of parsed.assets) {
        const url = localUrl(value, path);
        if (url === false) fail("external-autoload", path, "An external media/script resource would load automatically");
        if (url) {
          if (url.pathname.startsWith("/api/")) fail("api-autoload", path, "Unexpected API media resource");
          else assetPaths.add(`${url.pathname}${url.search}`);
        }
      }
      return parsed;
    })();
    pages.set(path, operation);
    return operation;
  }

  const sitemap = await fetchLocal("/sitemap.xml");
  let paths = [];
  if (sitemap?.status === 200) {
    for (const match of (await sitemap.text()).matchAll(/<loc>([\s\S]*?)<\/loc>/g)) {
      try { const url = new URL(decode(match[1])); permittedOrigins.add(url.origin); paths.push(`${url.pathname}${url.search}`); }
      catch { fail("sitemap-url", "/sitemap.xml", "Invalid sitemap destination"); }
    }
    if (!paths.length) fail("sitemap-empty", "/sitemap.xml", "Sitemap contains no destinations");
  } else {
    fail("sitemap-status", "/sitemap.xml", `Expected 200; received ${sitemap?.status ?? "no response"}`);
    await sitemap?.body?.cancel();
  }
  paths = [...new Set([...paths, ...EXTRA_PAGES])];
  console.log(`HTTP audit: ${paths.length} sitemap/utility pages at ${base.origin}`);
  await parallel(paths, path => auditPage(path, EXTRA_PAGES.includes(path) ? "utility" : "sitemap"));
  let rounds = 0;
  while ([...linkTargets.keys()].some(path => !pages.has(path)) && rounds++ < 8) {
    const pending = [...linkTargets.keys()].filter(path => !pages.has(path));
    if (pages.size + pending.length > 1200) { fail("crawl-limit", "/", "Local page crawl exceeds 1200 paths"); break; }
    await parallel(pending, path => auditPage(path, "internal-link"));
  }
  for (const [path, references] of linkTargets) {
    const parsed = await pages.get(path);
    if (!parsed) { for (const from of new Set(references.map(reference => reference.from))) fail("link-status", from, `Local page ${path} is unavailable or redirects`); continue; }
    for (const { from, fragment } of references) if (fragment && !parsed.ids.has(fragment)) fail("link-fragment", from, `Target ${path} has no #${fragment}`);
  }

  await parallel([...assetPaths], async path => {
    let response = await fetchLocal(path, "HEAD");
    if (response?.status === 405) { await response.body?.cancel(); response = await fetchLocal(path); }
    report.resources.push({ path, status: response?.status ?? null });
    if (response && response.status !== 200) fail("asset-status", path, `Expected 200 without redirect; received ${response.status}`);
    await response?.body?.cancel();
  });

  await parallel(UNKNOWN_PAGES, async path => {
    const response = await fetchLocal(path);
    report.unknownPages.push({ path, status: response?.status ?? null });
    if (response && response.status !== 404) fail("unknown-status", path, `Expected 404; received ${response.status}`);
    await response?.body?.cancel();
  });

  const weeklyResponses=new Map();
  const applicationResponse = await fetchLocal("/api/bewerbung/config");
  let application = null;
  if (applicationResponse) {
    security(applicationResponse,"/api/bewerbung/config");
    try {
      if (applicationResponse.status !== 200 || !applicationResponse.headers.get("cache-control")?.includes("no-store") || !/^application\/json(?:\s*;|$)/i.test(applicationResponse.headers.get("content-type") ?? "")) throw new Error();
      const reader = applicationResponse.body.getReader(), decoder = new TextDecoder("utf-8",{fatal:true}); let bytes=0, text="";
      try { while(true) { const chunk=await reader.read(); if(chunk.done)break; bytes+=chunk.value.byteLength; if(bytes>8192)throw new Error(); text+=decoder.decode(chunk.value,{stream:true}); } text+=decoder.decode(); }
      catch(error) { await reader.cancel();throw error; } finally { reader.releaseLock(); }
      const value=JSON.parse(text), object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x), exact=(x,keys)=>object(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
      if (!exact(value,["enabled","mode","limits","jobs"]) || typeof value.enabled!=="boolean" || !["disabled","enabled","pilot"].includes(value.mode) || value.mode!=="enabled"&&value.enabled || !exact(value.limits,["maxFiles","maxFileBytes","maxTotalBytes"]) || value.limits.maxFiles!==5 || value.limits.maxFileBytes!==5242880 || value.limits.maxTotalBytes!==10485760 || !Array.isArray(value.jobs)||value.jobs.length!==2||!value.jobs.every(job=>exact(job,["id","label"])&&["sales-fulltime","sales-parttime"].includes(job.id)&&typeof job.label==="string"&&job.label.length>0&&job.label.length<=160&&!/[\u0000-\u001f\u007f]/.test(job.label))||new Set(value.jobs.map(job=>job.id)).size!==2)throw new Error();
      application={mode:value.mode,enabled:value.enabled};
    } catch { fail("api-application-config","/api/bewerbung/config","Invalid public application configuration"); }
  }
  report.apis.push({path:"/api/bewerbung/config",method:"GET",status:applicationResponse?.status??null,expectedStatuses:[200],...(application?{mode:application.mode,intakeAvailable:application.enabled}:{})});
  const applicationStatus=application?.mode==="disabled"?503:403;
  for (const contract of [{path:"/api/bewerbung",method:"POST",statuses:[applicationStatus]},...API_CHECKS]) {
    const response = await fetchLocal(contract.path, contract.method);
    report.apis.push({ path: contract.path, method: contract.method, status: response?.status ?? null, expectedStatuses: contract.statuses });
    if (!response) continue;
    security(response, contract.path);
    if (!contract.statuses.includes(response.status)) fail("api-status", contract.path, `${contract.method}: expected ${contract.statuses.join(" or ")}; received ${response.status}`);
    if (contract.frameworkRejection) { await response.body?.cancel();continue; }
    if (!response.headers.get("cache-control")?.includes("no-store")) fail("api-cache", contract.path, "Response must be no-store");
    if (contract.path==="/api/content/offers"&&contract.method==="GET"&&!response.headers.get("vary")?.toLowerCase().split(",").map(value=>value.trim()).includes("x-jammers-content-version")) fail("api-version-vary",contract.path,"Offers must vary on the content version header");
    try {
      const value = await response.json();
      if (contract.method==="GET" && ["/api/content/current","/api/content/flyers","/api/content/offers","/api/handzettel/fetch"].includes(contract.path)) weeklyResponses.set(contract.path,value);
      if (contract.unavailable && value.available !== false) fail("api-disabled-state", contract.path, "Public community API must disclose unavailable state");
    } catch { fail("api-json", contract.path, "API response is not valid JSON"); }
  }

  const current=weeklyResponses.get("/api/content/current"),index=weeklyResponses.get("/api/content/flyers"),offers=weeklyResponses.get("/api/content/offers"),legacy=weeklyResponses.get("/api/handzettel/fetch");
  for (const [path,value] of [["/api/content/current",current],["/api/content/flyers",index],["/api/content/offers",offers]]) {
    const generatedAt = typeof value?.generatedAt === "string" ? Date.parse(value.generatedAt) : NaN;
    if (!Number.isFinite(generatedAt) || generatedAt > Date.now() || berlinDate.format(new Date(generatedAt)) !== today) {
      fail("api-weekly-clock",path,"Publication snapshot timestamp is invalid, future, or not from the actual audit date");
    }
  }
  const fields=["id","title","language","validFrom","validTo","viewerUrl","pdfUrl","sourceUrl","coverUrl","pageCount","pdfSha256","purpose","medium"];
  const sameFlyer=(a,b)=>Boolean(a&&b&&fields.every(key=>a[key]===b[key]));
  const safePdf=value=>typeof value==="string"&&/^\/handzettel\/[a-zA-Z0-9/_-]+\.pdf$/.test(value)&&!value.includes("//");
  const safeImage=(value,folder)=>typeof value==="string"&&new RegExp(`^/images/${folder}/[a-zA-Z0-9/_-]+\\.(?:webp|avif|png|jpe?g)$`).test(value)&&!value.includes("//");
  const rowObject=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
  const flyers=offers?.flyers;
  const valid=Array.isArray(flyers)&&Array.isArray(offers?.offers)&&["ok","degraded"].includes(offers.status)&&Array.isArray(offers.issues)
    && flyers.every(rowObject)&&offers.offers.every(rowObject)
    && Array.isArray(index?.flyers)&&index.flyers.every(rowObject)&&index.flyers.length===flyers.length&&index.flyers.every(f=>flyers.some(o=>sameFlyer(f,o)))
    && index.status===offers.status&&isDeepStrictEqual(index.issues,offers.issues)
    && new Set(flyers.map(f=>f.id)).size===flyers.length&&new Set(offers.offers.map(o=>o.id)).size===offers.offers.length
    && flyers.every(f=>safePdf(f.pdfUrl)&&f.viewerUrl===f.pdfUrl&&f.sourceUrl===f.pdfUrl&&safeImage(f.coverUrl,"content")&&/^[a-f0-9]{64}$/.test(f.pdfSha256)&&["weekly","supplemental"].includes(f.purpose)&&["trinkgut","legacy-canva","de-maas-driehoek","udens-weekblad","maasduinen"].includes(f.medium))
    && ["de","nl"].every(language=>{const f=flyers.find(f=>f.language===language&&f.purpose==="weekly"),slot=current?.[language==="de"?"flyer":"nlFlyer"];return f?sameFlyer(f,slot):slot===null;})
    && (current?.supplementalFlyers??[]).length===flyers.filter(f=>f.purpose==="supplemental").length
    && flyers.filter(f=>f.purpose==="supplemental").every(f=>Array.isArray(current?.supplementalFlyers)&&current.supplementalFlyers.filter(s=>sameFlyer(f,s)).length===1)
    && offers.offers.every(o=>safeImage(o.image,"offers")&&Number.isSafeInteger(o.sourcePage)&&o.sourcePage>0&&flyers.some(f=>f.id===o.flyerId&&f.language===o.language&&f.pdfUrl===o.sourceUrl&&f.pdfSha256===o.pdfSha256&&f.validFrom===o.validFrom&&f.validTo===o.validTo&&f.pageCount>=o.sourcePage));
  if (!valid) fail("api-weekly-contract","/api/content/offers","Current, flyer and offer APIs do not expose the same locally bound package");
  if (offers?.status==="degraded") fail("api-weekly-integrity","/api/content/offers","Main editions are missing or a declared publication failed integrity verification");
  if (today <= demandTo && !["de","nl"].every(language => Array.isArray(flyers) && flyers.some(f=>rowObject(f)&&f.purpose==="weekly"&&f.language===language&&f.validFrom===week&&today<=f.validTo))) {
    fail("api-weekly-integrity","/api/content/offers","Required current main editions are missing at the actual audit date");
  }
  const de=Array.isArray(flyers)?flyers.find(f=>rowObject(f)&&f.language==="de"):null;
  if (!(de ? Boolean(legacy&&fields.filter(key=>!["purpose","medium"].includes(key)).every(key=>de[key]===legacy[key]))&&legacy.status==="ok"&&isDeepStrictEqual(legacy.pages,[{number:1,imageUrl:de.coverUrl,thumbnailUrl:de.coverUrl}])
    : legacy?.status==="fallback"&&legacy.pageCount===0&&legacy.pdfUrl===null&&legacy.viewerUrl===null&&isDeepStrictEqual(legacy.pages,[]))) fail("api-weekly-contract","/api/handzettel/fetch","Legacy GET must expose only the bound local PDF and its verified cover, or the truthful empty fallback");

  // Independent local manifests bind every active original and tile; never rely on HEAD.
  if (valid) {
    try {
      const manifests=[];
      const calendarDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;
      const editionHeader = edition => rowObject(edition) && typeof edition.id==="string" && /^[a-z0-9][a-z0-9-]{0,149}$/.test(edition.id) && calendarDate(edition.validFrom) && calendarDate(edition.validTo) && edition.validFrom<=edition.validTo;
      for (const [directory,supplemental] of [["data/editorial/weekly-publications",false],["data/editorial/supplemental-publications",true]]) {
        let files;
        try { files=await readdir(resolve(directory),{withFileTypes:true}); }
        catch(error) {
          if(!(supplemental&&error.code==="ENOENT"))fail("weekly-manifest-integrity","/api/content/offers",`${supplemental?"Supplemental":"Weekly"} publication register could not be read`);
          continue;
        }
        for(const file of files) {
          try {
            if(!file.isFile())throw new Error("Invalid manifest file");
            const filenameWeek=/^(\d{4}-\d{2}-\d{2})\.json$/.exec(file.name)?.[1];
            if(!supplemental) {
              if(!calendarDate(filenameWeek)||new Date(`${filenameWeek}T12:00:00Z`).getUTCDay()!==1)throw new Error("Unassignable weekly manifest");
              // A canonical Monday filename is the loader's binding: other weeks cannot lend current IDs.
              if(filenameWeek!==week)continue;
            } else if(!/^[a-z0-9][a-z0-9-]{0,149}\.json$/.test(file.name))throw new Error("Invalid supplemental manifest filename");
            const value=JSON.parse(await readFile(resolve(directory,file.name),"utf8"));
            if(!rowObject(value))throw new Error("Invalid manifest header");
            if(supplemental) {
              if(value.schemaVersion!==1||!editionHeader(value.edition)||file.name!==`${value.edition.id}.json`)throw new Error("Invalid supplemental manifest");
              manifests.push({...value.edition,auditSupplemental:true});
            } else {
              if(![1,2].includes(value.schemaVersion)||value.week!==filenameWeek||!Array.isArray(value.editions)||!value.editions.every(e=>editionHeader(e)&&e.validFrom===filenameWeek))throw new Error("Invalid weekly manifest");
              manifests.push(...value.editions);
            }
          } catch {fail("weekly-manifest-integrity","/api/content/offers",`${supplemental?"Supplemental":"Current or unassignable weekly"} publication manifest could not be read or parsed`);}
        }
      }
      const expectedActive=manifests.filter(e=>e&&today<=e.validTo&&(e.auditSupplemental?e.validFrom<=today:e.validFrom===week));
      if(!isDeepStrictEqual(expectedActive.map(e=>e.id).sort(),flyers.map(f=>f.id).sort()))throw new Error("Incomplete active original set");
      const boundOffers=JSON.parse(await readFile(resolve("data/weekly-offers.json"),"utf8"));
      const assets=new Map();
      for(const flyer of flyers) {
        const matches=manifests.filter(edition=>edition.id===flyer.id);
        if(matches.length!==1)throw new Error("Invalid local edition binding");
        const edition=matches[0];
        if(edition.pdf.path!==flyer.pdfUrl||edition.pdf.sha256!==flyer.pdfSha256||edition.cover.path!==flyer.coverUrl||edition.validFrom!==flyer.validFrom||edition.validTo!==flyer.validTo)throw new Error("Mismatching local edition");
        assets.set(edition.pdf.path,edition.pdf);assets.set(edition.cover.path,edition.cover);
        const priceActive=edition.validFrom<=today&&today<=edition.validTo;
        if(!isDeepStrictEqual(priceActive?[...edition.offerIds].sort():[],offers.offers.filter(o=>o.flyerId===flyer.id).map(o=>o.id).sort()))throw new Error("Incomplete active offer census or premature prices");
        // The API must bind each active offer to its own original tile, not just any safe image.
        for(const offer of offers.offers.filter(item=>item.flyerId===flyer.id)) {
          const matches=boundOffers.filter(item=>item.id===offer.id);
          if(matches.length!==1||matches[0].image!==offer.image)throw new Error("Mismatching public offer image binding");
        }
        // Preview packages must already contain every original crop, even before cards activate.
        const editionOffers=boundOffers.filter(item=>edition.offerIds.includes(item.id));
        if(!isDeepStrictEqual(editionOffers.map(item=>item.id).sort(),[...edition.offerIds].sort()))throw new Error("Incomplete preview offer census");
        for(const offer of editionOffers) {
          const matches=boundOffers.filter(item=>item.id===offer.id);
          if(matches.length!==1||!edition.offerIds.includes(offer.id)||matches[0].image!==offer.image)throw new Error("Invalid local offer binding");
          const local=await readFile(resolve(`public${offer.image}`));
          assets.set(offer.image,{sha256:matches[0].imageSha256,bytes:local.length});
        }
      }
      for(const [path,expected] of assets) {
        if(!safePdf(path)&&!safeImage(path,"content")&&!safeImage(path,"offers"))throw new Error("Unsafe asset path");
        const response=await fetchLocal(path,"GET");
        if(!response)continue;
        const bytes=Buffer.from(await response.arrayBuffer());
        const type=path.endsWith(".pdf")?"application/pdf":path.endsWith(".webp")?"image/webp":path.endsWith(".avif")?"image/avif":path.endsWith(".png")?"image/png":"image/jpeg";
        if(response.status!==200||response.headers.get("content-type")?.split(";")[0].trim()!==type||bytes.length!==expected.bytes||createHash("sha256").update(bytes).digest("hex")!==expected.sha256)fail("weekly-asset-integrity",path,"Active original or tile GET type, size or SHA-256 differs from its local publication binding");
      }
    } catch {fail("weekly-asset-integrity","/api/content/offers","Local bindings for active originals and tiles could not be verified");}
  }

  for (const name of ["pages", "unknownPages", "resources", "apis"]) report[name].sort((a, b) => a.path.localeCompare(b.path) || (a.method ?? "").localeCompare(b.method ?? ""));
  findings.sort((a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code));
  const failureCount = findings.filter(finding => finding.severity === "error").length;
  report.summary = {
    passed: failureCount === 0, failureCount, warningCount: findings.length - failureCount,
    sitemapAndUtilityPages: paths.length, checkedPages: report.pages.length, checkedLocalAssets: report.resources.length,
    checkedUnknownPages: report.unknownPages.length, checkedApiContracts: report.apis.length, externalLinksNotFetched: externalLinkCount,
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
  for (const finding of findings.slice(0, 30)) console.log(`${finding.severity.toUpperCase()} ${finding.code} ${finding.path}: ${finding.detail}`);
  if (findings.length > 30) console.log(`See evidence for ${findings.length - 30} additional findings.`);
  console.log(`Evidence: ${output}`);
  process.exitCode = failureCount === 0 ? 0 : 1;
}

main().catch(error => { console.error(`HTTP audit failed: ${error?.name ?? "Error"}`); process.exitCode = 1; });
