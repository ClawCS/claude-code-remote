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
import { mkdir, writeFile } from "node:fs/promises";
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
  ...["bewerbung", "community", "chat", "kuehlschrank", "leergut-scan"].map(route => ({ path: `/api/${route}`, method: "POST", statuses: [503] })),
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
        ...(method === "POST" ? { headers: { "Content-Type": "application/json" }, body: "{}" } : {}),
      });
    } catch (error) { fail("request-failed", path, `${method} failed (${error?.name ?? "network error"})`); return null; }
  }

  function security(response, path) {
    const referrer = /^\/api\/(?:rentals|rental-admin)(?:\/|$)/.test(path) ? "no-referrer" : "strict-origin-when-cross-origin";
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
  for (const contract of API_CHECKS) {
    const response = await fetchLocal(contract.path, contract.method);
    report.apis.push({ path: contract.path, method: contract.method, status: response?.status ?? null, expectedStatuses: contract.statuses });
    if (!response) continue;
    security(response, contract.path);
    if (!contract.statuses.includes(response.status)) fail("api-status", contract.path, `${contract.method}: expected ${contract.statuses.join(" or ")}; received ${response.status}`);
    if (contract.frameworkRejection) { await response.body?.cancel();continue; }
    if (!response.headers.get("cache-control")?.includes("no-store")) fail("api-cache", contract.path, "Response must be no-store");
    try {
      const value = await response.json();
      if (contract.method==="GET" && ["/api/content/current","/api/content/flyers","/api/content/offers","/api/handzettel/fetch"].includes(contract.path)) weeklyResponses.set(contract.path,value);
      if (contract.unavailable && value.available !== false) fail("api-disabled-state", contract.path, "Public community API must disclose unavailable state");
    } catch { fail("api-json", contract.path, "API response is not valid JSON"); }
  }

  const current=weeklyResponses.get("/api/content/current"),index=weeklyResponses.get("/api/content/flyers"),offers=weeklyResponses.get("/api/content/offers"),legacy=weeklyResponses.get("/api/handzettel/fetch");
  const fields=["id","title","language","validFrom","validTo","viewerUrl","pdfUrl","sourceUrl","coverUrl","pageCount","pdfSha256"];
  const sameFlyer=(a,b)=>Boolean(a&&b&&fields.every(key=>a[key]===b[key]));
  const safePdf=value=>typeof value==="string"&&/^\/handzettel\/[a-zA-Z0-9/_-]+\.pdf$/.test(value)&&!value.includes("//");
  const safeImage=(value,folder)=>typeof value==="string"&&new RegExp(`^/images/${folder}/[a-zA-Z0-9/_-]+\\.(?:webp|avif|png|jpe?g)$`).test(value)&&!value.includes("//");
  const flyers=offers?.flyers;
  const valid=Array.isArray(flyers)&&Array.isArray(offers?.offers)&&["ok","degraded"].includes(offers.status)&&Array.isArray(offers.issues)
    && Array.isArray(index?.flyers)&&index.flyers.length===flyers.length&&index.flyers.every(f=>flyers.some(o=>sameFlyer(f,o)))
    && index.status===offers.status&&isDeepStrictEqual(index.issues,offers.issues)
    && new Set(flyers.map(f=>f.id)).size===flyers.length&&new Set(offers.offers.map(o=>o.id)).size===offers.offers.length
    && flyers.every(f=>safePdf(f.pdfUrl)&&f.viewerUrl===f.pdfUrl&&f.sourceUrl===f.pdfUrl&&safeImage(f.coverUrl,"content")&&/^[a-f0-9]{64}$/.test(f.pdfSha256))
    && ["de","nl"].every(language=>{const f=flyers.find(f=>f.language===language),slot=current?.[language==="de"?"flyer":"nlFlyer"];return f?sameFlyer(f,slot):slot===null;})
    && offers.offers.every(o=>safeImage(o.image,"offers")&&Number.isSafeInteger(o.sourcePage)&&o.sourcePage>0&&flyers.some(f=>f.id===o.flyerId&&f.language===o.language&&f.pdfUrl===o.sourceUrl&&f.pdfSha256===o.pdfSha256&&f.validFrom===o.validFrom&&f.validTo===o.validTo&&f.pageCount>=o.sourcePage));
  if (!valid) fail("api-weekly-contract","/api/content/offers","Current, flyer and offer APIs do not expose the same locally bound package");
  const de=Array.isArray(flyers)?flyers.find(f=>f.language==="de"):null;
  if (!(de ? sameFlyer(de,legacy)&&legacy.status==="ok"&&isDeepStrictEqual(legacy.pages,[{number:1,imageUrl:de.coverUrl,thumbnailUrl:de.coverUrl}])
    : legacy?.status==="fallback"&&legacy.pageCount===0&&legacy.pdfUrl===null&&legacy.viewerUrl===null&&isDeepStrictEqual(legacy.pages,[]))) fail("api-weekly-contract","/api/handzettel/fetch","Legacy GET must expose only the bound local PDF and its verified cover, or the truthful empty fallback");

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
