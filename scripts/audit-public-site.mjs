#!/usr/bin/env node
/**
 * Read-only publication audit for this repository.
 * GET/HEAD inspect public content. The only POST probes have an empty body and
 * no Authorization header: the reviewed paused handlers and protected flyer
 * handlers reject them before parsing input or executing a refresh.
 * HTML, API bodies, cookies, external account URLs and credentials are never
 * included in the evidence file. External links/resources are not fetched.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const EXTRA_PAGES = ["/warenkorb", "/checkout", "/bestellungen", "/kuehlschrank", "/akademie/zertifikate"];
const UNKNOWN_PAGES = ["/produkte/__audit_unknown__", "/kategorie/__audit_unknown__", "/cocktails/__audit_unknown__", "/cocktails/kategorie/__audit_unknown__", "/akademie/__audit_unknown__"];
const API_CHECKS = [
  { path: "/api/content/current", method: "GET", statuses: [200] },
  { path: "/api/content/flyers", method: "GET", statuses: [200] },
  { path: "/api/community", method: "GET", statuses: [200], unavailable: true },
  { path: "/api/handzettel/fetch", method: "GET", statuses: [200] },
  { path: "/api/handzettel/cron", method: "GET", statuses: [401, 503] },
  { path: "/api/handzettel/fetch?refresh=true", method: "GET", statuses: [401, 503] },
  ...["bewerbung", "community", "chat", "kuehlschrank", "leergut-scan"].map(route => ({ path: `/api/${route}`, method: "POST", statuses: [503] })),
  ...["/api/handzettel/cron", "/api/handzettel/fetch"].map(path => ({ path, method: "POST", statuses: [401, 503] })),
];
const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const ROOT_LANDMARK_CONTEXTS = new Set(["main", "article", "section", "aside", "nav"]);

function decode(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi, entity => {
    const named = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const code = entity.slice(2, -1);
    return String.fromCodePoint(code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : parseInt(code, 10));
  });
}

function attributes(tag) {
  const result = {};
  const body = tag.replace(/^<\/?[\w:-]+/, "").replace(/\/?\s*>$/, "");
  for (const match of body.matchAll(/([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

function renderedTree(html) {
  const root = { tag: "#document", children: [], parent: null, attrs: {} };
  const stack = [root];
  const byId = new Map();
  const replacements = [];
  const tokens = html.match(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>|[^<]+|</gi) ?? [];
  for (const token of tokens) {
    if (token.startsWith("<!--")) {
      stack.at(-1).children.push({ tag: "#comment", value: token.slice(4, -3), parent: stack.at(-1), children: [], attrs: {} });
      continue;
    }
    if (!token.startsWith("<") || token.startsWith("<!")) continue;
    const close = token.match(/^<\/([\w:-]+)/);
    if (close) {
      const index = stack.findLastIndex(node => node.tag === close[1].toLowerCase());
      if (index > 0) stack.length = index;
      continue;
    }
    const opening = token.match(/^<([\w:-]+)\b[^>]*>/);
    if (!opening) continue;
    const tag = opening[1].toLowerCase();
    const node = { tag, attrs: attributes(opening[0]), children: [], parent: stack.at(-1) };
    node.parent.children.push(node);
    if (node.attrs.id) byId.set(node.attrs.id, node);
    if (tag === "script") {
      for (const match of token.matchAll(/\$RC\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g)) replacements.push([match[1], match[2]]);
      continue;
    }
    if (tag !== "style" && !VOID_TAGS.has(tag) && !opening[0].endsWith("/>")) stack.push(node);
  }
  // Next/React streams resolved Suspense content outside the original <main>.
  // Apply only the explicit server completion operations, never execute JS.
  for (const [boundaryId, segmentId] of replacements) {
    const boundary = byId.get(boundaryId);
    const segment = byId.get(segmentId);
    if (!boundary?.parent || !segment?.parent) continue;
    const siblings = boundary.parent.children;
    const boundaryIndex = siblings.indexOf(boundary);
    let start = boundaryIndex;
    if (siblings[start - 1]?.tag === "#comment" && /^\$[?!]?$/.test(siblings[start - 1].value)) start--;
    let end = boundaryIndex + 1;
    let nesting = 0;
    for (; end < siblings.length; end++) {
      const sibling = siblings[end];
      if (sibling.tag !== "#comment") continue;
      if (/^\$[?!]?$/.test(sibling.value)) nesting++;
      if (sibling.value === "/$") { if (nesting === 0) break; nesting--; }
    }
    if (end === siblings.length) continue;
    for (const child of segment.children) child.parent = boundary.parent;
    siblings.splice(start, end - start + 1, ...segment.children);
    segment.parent.children = segment.parent.children.filter(child => child !== segment);
  }
  return root;
}

function walk(root, callback, hidden = false, ancestors = []) {
  const unavailable = hidden || root.tag === "template" || Object.hasOwn(root.attrs, "hidden");
  if (!unavailable && root.tag !== "#comment") callback(root, ancestors);
  if (["script", "style", "template"].includes(root.tag)) return;
  for (const child of root.children) walk(child, callback, unavailable, [...ancestors, root.tag]);
}

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
    for (const [name, value] of [["x-content-type-options", "nosniff"], ["x-frame-options", "SAMEORIGIN"], ["referrer-policy", "strict-origin-when-cross-origin"]]) {
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

  for (const contract of API_CHECKS) {
    const response = await fetchLocal(contract.path, contract.method);
    report.apis.push({ path: contract.path, method: contract.method, status: response?.status ?? null, expectedStatuses: contract.statuses });
    if (!response) continue;
    security(response, contract.path);
    if (!contract.statuses.includes(response.status)) fail("api-status", contract.path, `${contract.method}: expected ${contract.statuses.join(" or ")}; received ${response.status}`);
    if (!response.headers.get("cache-control")?.includes("no-store")) fail("api-cache", contract.path, "Response must be no-store");
    try {
      const value = await response.json();
      if (contract.unavailable && value.available !== false) fail("api-disabled-state", contract.path, "Public community API must disclose unavailable state");
    } catch { fail("api-json", contract.path, "API response is not valid JSON"); }
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
