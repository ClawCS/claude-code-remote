import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { supplementalPublicationFixture } from "./fixtures/supplemental-publication";
import { loadWeeklyPublications } from "@/lib/weekly-publication";
import { loadSupplementalPublications } from "@/lib/supplemental-publication";
import { selectWeeklyOfferContent } from "@/lib/weekly-offer-selection";

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const dispose of cleanup.splice(0).reverse()) await dispose(); });

type FixtureOptions = { broken?: "link" | "asset" | "heading" | "legacy" | "redirect" | "api" | "security" | "fragment" | "rental-auth" | "rental-referrer" | "offers" | "legacy-get" | "content-post"; streamed?: boolean; hiddenQuotedAttribute?:boolean; completionAttrs?:string; malformedRow?: { collection: "offers" | "flyers" | "indexFlyers"; value: unknown } };

async function fixture(options: FixtureOptions & { activeSupplement?:boolean; hideSupplement?:boolean; hideMain?:boolean; missingMainManifest?:boolean; swappedOfferImage?:boolean; snapshotNow?:string; auditNow?:string; manifestDamage?:"supplemental-json"|"supplemental-shape"|"supplemental-read"|"weekly-current"|"weekly-unknown"|"weekly-historical"; corruptAsset?:string; application?: { config: unknown; post: number } } = {}) {
  const source=options.activeSupplement?await supplementalPublicationFixture():undefined;
  if(source) cleanup.push(()=>rm(source.root,{recursive:true,force:true}));
  const snapshotNow=options.snapshotNow??(source?"2026-10-08T12:00:00Z":"2026-10-11T12:00:00Z");
  const selected=source?selectWeeklyOfferContent(await loadWeeklyPublications(source.root),new Date(snapshotNow),await loadSupplementalPublications(source.root)):undefined;
  const active=selected?{...selected,flyers:selected.flyers.filter(f=>!(options.hideSupplement&&f.purpose==="supplemental")&&!(options.hideMain&&f.purpose==="weekly")),offers:selected.offers.filter(o=>!(options.hideSupplement&&o.flyerId==="maasduinen-synthetic")&&!(options.hideMain&&o.flyerId!=="maasduinen-synthetic"))}:undefined;
  if(active&&options.swappedOfferImage) active.offers=active.offers.map((offer,index)=>index===0?{...offer,image:active.offers[1].image}:offer);
  if(source&&options.missingMainManifest)await rm(join(source.root,"data/editorial/weekly-publications/2026-10-05.json"));
  if(source&&options.manifestDamage) {
    const file=options.manifestDamage.startsWith("supplemental")?"data/editorial/supplemental-publications/maasduinen-synthetic.json":`data/editorial/weekly-publications/${options.manifestDamage==="weekly-historical"?"2026-09-28":options.manifestDamage==="weekly-unknown"?"undatable":"2026-10-05"}.json`;
    if(options.manifestDamage==="supplemental-read") {await rm(join(source.root,file));await mkdir(join(source.root,file));}
    else await source.write(file,options.manifestDamage==="supplemental-shape"?JSON.stringify({schemaVersion:1,edition:{}}):"broken");
  }
  const requests: Array<{ path: string; method: string; authorization?: string; origin?: string; body: string; version?:string }> = [];
  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? "/", "http://fixture.invalid");
    const entry = { path: `${url.pathname}${url.search}`, method: request.method ?? "GET", authorization: request.headers.authorization, origin: request.headers.origin, body: "", version:request.headers["x-jammers-content-version"] as string|undefined };
    requests.push(entry);
    request.on("data", chunk => { entry.body += chunk.toString(); });
    if (options.broken !== "security") {
      response.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob:; object-src 'none'; frame-ancestors 'self'");
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("X-Frame-Options", "SAMEORIGIN");
      response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    }
    if (url.pathname === "/sitemap.xml") {
      response.setHeader("Content-Type", "application/xml");
      response.end('<urlset><url><loc>https://trinkgut-jammers.de/</loc></url><url><loc>https://trinkgut-jammers.de/produkte</loc></url><url><loc>https://trinkgut-jammers.de/galerie</loc></url></urlset>');
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      response.setHeader("Content-Type", "application/json");
      response.setHeader("Cache-Control", "no-store");
      if (url.pathname === "/api/bewerbung/config" || url.pathname === "/api/bewerbung") {
        response.setHeader("Referrer-Policy", "no-referrer");
        response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
        if (url.pathname.endsWith("/config")) response.end(JSON.stringify(options.application?.config ?? { enabled: false, mode: "disabled", limits: { maxFiles: 5, maxFileBytes: 5242880, maxTotalBytes: 10485760 }, jobs: [{ id: "sales-fulltime", label: "Vollzeit" }, { id: "sales-parttime", label: "Teilzeit" }] }));
        else { response.statusCode = options.broken === "api" ? 200 : options.application?.post ?? 503; response.end(JSON.stringify({ code: "WORKER_UNAVAILABLE" })); }
        return;
      }
      if (url.pathname.startsWith("/api/content/")) {
        if (request.method==="POST") {response.statusCode=options.broken==="content-post"?200:405;response.end();return;}
        if(url.pathname.endsWith("offers")) response.setHeader("Vary","X-Jammers-Content-Version");
        if(active) {
          const main=active.flyers.filter(f=>f.purpose==="weekly");
          response.end(JSON.stringify(url.pathname.endsWith("current")?{generatedAt:active.generatedAt,flyer:main[0]??null,nlFlyer:main[1]??null,supplementalFlyers:active.flyers.filter(f=>f.purpose==="supplemental")}:active));return;
        }
        const empty={status:"ok",issues:[],generatedAt:snapshotNow,flyers:[],offers:[]};
        if (options.malformedRow && url.pathname === (options.malformedRow.collection === "indexFlyers" ? "/api/content/flyers" : "/api/content/offers")) {
          const collection = options.malformedRow.collection === "indexFlyers" ? "flyers" : options.malformedRow.collection;
          response.end(JSON.stringify({ ...empty, [collection]: [options.malformedRow.value] })); return;
        }
        response.end(JSON.stringify(url.pathname.endsWith("current")?{generatedAt:snapshotNow,flyer:null,nlFlyer:null}:url.pathname.endsWith("offers")&&options.broken==="offers"?{...empty,offers:[{id:"unbound"}]}:empty));return;
      }
      if (url.pathname==="/api/handzettel/fetch"&&request.method==="GET"&&!url.search) {
        if(active?.flyers.some(f=>f.language==="de")) {const f=active.flyers.find(f=>f.language==="de")!;response.end(JSON.stringify({...f,status:"ok",pages:[{number:1,imageUrl:f.coverUrl,thumbnailUrl:f.coverUrl}]}));return;}
        response.end(JSON.stringify({status:"fallback",pageCount:0,pages:options.broken==="legacy-get"?[{number:1,imageUrl:"https://provider.invalid/image.jpg"}]:[],viewerUrl:null,pdfUrl:null}));return;
      }
      if (/^\/api\/(rentals|rental-admin)\//.test(url.pathname)) {
        response.setHeader("Referrer-Policy", options.broken === "rental-referrer" ? "strict-origin-when-cross-origin" : "no-referrer");
        if (url.pathname === "/api/rentals/config") { response.statusCode = 200; response.end(JSON.stringify({ enabled: false, testMode: false, onlinePayment: false, termsVersion: "", termsText: "", privacyText: "", message: "Online-Bestellungen sind noch nicht freigeschaltet. Bitte stellen Sie eine unverbindliche Anfrage." })); return; }
        else if (url.pathname.startsWith("/api/rental-admin/")) response.statusCode = options.broken === "rental-auth" ? 200 : url.pathname.endsWith("/session") ? 403 : 401;
        else if (url.pathname.includes("__audit_unknown__") || url.pathname.endsWith("/webhook")) response.statusCode = 404;
        else response.statusCode = 403;
        response.end(JSON.stringify({ error: "Not authorized" })); return;
      }
      const paused = ["/api/chat", "/api/community", "/api/kuehlschrank", "/api/leergut-scan", "/api/bewerbung"];
      if (request.method === "POST" && paused.includes(url.pathname)) response.statusCode = options.broken === "api" ? 200 : 503;
      else if (url.pathname === "/api/handzettel/cron" || url.searchParams.get("refresh") === "true" || request.method === "POST") response.statusCode = 401;
      response.end(JSON.stringify(url.pathname === "/api/community" && request.method === "GET" ? { available: false } : { ok: true }));
      return;
    }
    if (url.pathname.startsWith("/missing") || url.pathname.includes("__audit_unknown__")) {
      response.statusCode = 404; response.end("not found"); return;
    }
    if(source&&/^\/(?:handzettel|images\/content|images\/offers)\//.test(url.pathname)) {
      const bytes=await readFile(join(source.root,"public",url.pathname));
      response.setHeader("Content-Type",url.pathname.endsWith(".pdf")?"application/pdf":"image/webp");
      response.end(options.corruptAsset===url.pathname?Buffer.concat([bytes,Buffer.from("changed")]):bytes);return;
    }
    if (url.pathname === "/photo.webp" || url.pathname === "/site.css" || url.pathname === "/site.js") {
      response.statusCode = options.broken === "asset" && url.pathname === "/photo.webp" ? 404 : 200;
      response.end("asset"); return;
    }
    if (url.pathname === "/produkte" && options.broken === "redirect") {
      response.statusCode = 307; response.setHeader("Location", "/"); response.end(); return;
    }
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    const header = '<header data-cinematic-header="true"><a href="/produkte">Sortiment</a></header>';
    const content = `<h1>Title</h1>${options.broken === "heading" ? "<h1>Duplicate</h1>" : ""}<p id="details">Content</p><img src="/photo.webp" srcset="/photo.webp 640w, /photo.webp 1280w" alt="Market"/><a href="/galerie#${options.broken === "fragment" ? "absent" : "details"}">Team</a>${options.broken === "link" ? '<a href="/missing-page">Broken</a>' : ""}`;
    const visibleContent=options.hiddenQuotedAttribute?`<div title="x > y" hidden>${content}</div>`:content;
    const main = options.streamed
      ? `<main><!--$?--><template id="B:0"></template>${options.completionAttrs?"<p>Fallback</p>":"<h1>Fallback</h1>"}<!--/$--></main><div hidden id="S:0">${visibleContent}</div><script ${options.completionAttrs??""}>$RC("B:0","S:0")</script>`
      : `<main>${visibleContent}</main>`;
    response.end(`<!doctype html><html><head><link rel="stylesheet" href="/site.css"/><script src="/site.js"></script></head><body>${header}${main}<footer${options.broken === "legacy" ? " data-legacy-footer" : ""}>Footer</footer><script>const sample = "<h1>Not DOM</h1>";</script></body></html>`);
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  cleanup.push(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Fixture has no port");
  const directory = await mkdtemp(join(tmpdir(), "jammers-http-audit-"));
  cleanup.push(() => rm(directory, { recursive: true, force: true }));
  const output = join(directory, "evidence.json");
  const result = await new Promise<{ code: number | null; text: string }>(resolve => {
    const child = spawn(process.execPath, ["--import",join(process.cwd(),"lib/__tests__/fixtures/public-site-audit-clock.mjs"),join(process.cwd(),"scripts/audit-public-site.mjs"), "--url", `http://127.0.0.1:${address.port}`, "--output", output], { cwd: source?.root??process.cwd(),env:{...process.env,JAMMERS_AUDIT_FIXTURE_NOW:options.auditNow??snapshotNow} });
    let text = "";
    child.stdout.on("data", chunk => { text += chunk.toString(); });
    child.stderr.on("data", chunk => { text += chunk.toString(); });
    child.on("close", code => resolve({ code, text }));
  });
  const report = await readFile(output, "utf8").then(JSON.parse).catch(() => null);
  return { ...result, report, requests };
}

describe("public HTTP forensic audit CLI", () => {
  it("rejects an active API offer whose image points to another correctly served original tile", async () => {
    const result = await fixture({ activeSupplement: true, swappedOfferImage: true });
    expect(result.code, result.text).toBe(1);
    expect(result.report.findings).toContainEqual(expect.objectContaining({code:"weekly-asset-integrity"}));
  });
  it("accepts verified Sunday previews with zero premature product offers", async () => {
    const result = await fixture({ activeSupplement: true, snapshotNow: "2026-10-04T14:00:00Z" });
    expect(result.report.findings.filter((f: {severity:string}) => f.severity === "error")).toEqual([]);
  });
  it("requires next-week originals at the preview deadline even when APIs agree on no flyers", async () => {
    const result = await fixture({ snapshotNow: "2026-10-11T14:00:00Z" });
    expect(result.code).toBe(1);
    expect(result.report.findings).toContainEqual(expect.objectContaining({code:"api-weekly-integrity"}));
  });
  it("fails an internally consistent stale API snapshot at the audit's actual execution date",async()=>{
    const result=await fixture({activeSupplement:true,auditNow:"2026-10-11T12:00:00Z"});
    expect(result.code,result.text).toBe(1);
    expect(result.report.findings).toContainEqual(expect.objectContaining({code:"api-weekly-clock",path:"/api/content/offers"}));
    expect(result.report.findings).toContainEqual(expect.objectContaining({code:"weekly-asset-integrity"}));
  });
  it("fails an internally consistent future API snapshot",async()=>{
    const result=await fixture({activeSupplement:true,auditNow:"2026-10-07T12:00:00Z"});
    expect(result.code,result.text).toBe(1);
    expect(result.report.findings).toContainEqual(expect.objectContaining({code:"api-weekly-clock"}));
  });
  it("requires current main editions even when every API falsely reports a healthy supplemental-only snapshot",async()=>{
    const result=await fixture({activeSupplement:true,hideMain:true,missingMainManifest:true});
    expect(result.code,result.text).toBe(1);
    expect(result.report.findings).toContainEqual(expect.objectContaining({code:"api-weekly-integrity"}));
  });
  it.each(["supplemental-json","supplemental-shape","supplemental-read"] as const)("fails %s corruption hidden by otherwise healthy APIs",async manifestDamage=>{
    const result=await fixture({activeSupplement:true,hideSupplement:true,manifestDamage});
    expect(result.code,result.text).toBe(1);
    expect(result.report.findings).toContainEqual(expect.objectContaining({code:"weekly-manifest-integrity"}));
    expect(JSON.stringify(result.report)).not.toContain("maasduinen-synthetic.json");
  });
  it.each(["weekly-current","weekly-unknown"] as const)("fails %s manifest corruption that cannot be isolated as historical",async manifestDamage=>{
    const result=await fixture({activeSupplement:true,hideMain:manifestDamage==="weekly-current",manifestDamage});
    expect(result.code,result.text).toBe(1);
    expect(result.report.findings).toContainEqual(expect.objectContaining({code:"weekly-manifest-integrity"}));
  });
  it("isolates a corrupt weekly manifest whose valid filename proves it historical",async()=>{
    const result=await fixture({activeSupplement:true,manifestDamage:"weekly-historical"});
    expect(result.code,result.text).toBe(0);
  });
  it("requests typed offers and checks exact GET bytes for active main and supplemental originals and tiles",async()=>{
    const result=await fixture({activeSupplement:true});
    expect(result.code,result.text).toBe(0);
    expect(result.requests.find(r=>r.path==="/api/content/offers"&&r.method==="GET")?.version).toBe("2");
    expect(result.requests.some(r=>r.path==="/images/offers/nl-2026-10-05-p1.webp"&&r.method==="GET")).toBe(true);
  });
  it("fails changed active GET asset bytes even when the API metadata is exact",async()=>{
    const result=await fixture({activeSupplement:true,corruptAsset:"/images/offers/nl-2026-10-05-p1.webp"});
    expect(result.code,result.text).toBe(1);
    expect(result.report.findings.some((f:{code:string})=>f.code==="weekly-asset-integrity")).toBe(true);
  });
  it("fails an active supplemental original silently omitted from all public APIs",async()=>{
    const result=await fixture({activeSupplement:true,hideSupplement:true});
    expect(result.code,result.text).toBe(1);
    expect(result.report.findings.some((f:{code:string})=>f.code==="weekly-asset-integrity")).toBe(true);
  });
  it.each([
    ["disabled", false, 503, true], ["enabled", true, 403, true], ["enabled", false, 403, true], ["pilot", false, 403, true],
    ["disabled", true, 503, false], ["pilot", true, 403, false], ["enabled", true, 503, false], ["disabled", false, 403, false], ["enabled", true, 202, false],
  ] as const)("maps public application mode %s/%s to exact rejecting POST %s", async (mode, enabled, post, pass) => {
    const config = { enabled, mode, limits: { maxFiles: 5, maxFileBytes: 5242880, maxTotalBytes: 10485760 }, jobs: [{ id: "sales-fulltime", label: "Vollzeit" }, { id: "sales-parttime", label: "Teilzeit" }] };
    const result = await fixture({ application: { config, post } });
    expect(result.code, result.text).toBe(pass ? 0 : 1);
    expect(result.requests.filter(request => request.path === "/api/bewerbung/session")).toEqual([]);
    const upload = result.requests.find(request => request.path === "/api/bewerbung" && request.method === "POST");
    expect(upload).toMatchObject({ body: "", origin: undefined, authorization: undefined });
    expect(JSON.stringify(result.report)).not.toContain("Vollzeit");
  });
  it.each(
    (["offers", "flyers", "indexFlyers"] as const).flatMap(collection =>
      [null, false, 0, "https://provider.invalid/private-row", []].map(value => ({ collection, value }))),
  )("saves structured contract failure for malformed $collection row $value", async malformedRow => {
    const result = await fixture({ malformedRow });
    expect(result.code, result.text).toBe(1);
    expect(result.report, result.text).not.toBeNull();
    expect(result.report.summary).toMatchObject({ passed: false });
    expect(result.report.findings).toContainEqual(expect.objectContaining({
      severity: "error", code: "api-weekly-contract", path: "/api/content/offers",
    }));
    expect(result.requests.every(request => !request.authorization)).toBe(true);
    expect(result.requests.filter(request => request.method === "POST").every(request => request.body === (request.path === "/api/bewerbung" ? "" : "{}") && !request.origin)).toBe(true);
    expect(result.requests.some(request => request.path.includes("private-row"))).toBe(false);
    expect(JSON.stringify(result.report)).not.toContain("provider.invalid");
  });
  it("does not count content hidden after a quoted greater-than attribute",async()=>{
    const result=await fixture({hiddenQuotedAttribute:true});
    expect(result.code).toBe(1);
    expect(result.report.findings.some((finding:{code:string})=>finding.code==="landmark-h1")).toBe(true);
    expect(result.requests.some(request=>request.path==="/photo.webp")).toBe(false);
  });
  it.each(['src=""',"nomodule"])("does not resolve SSR from a nonexecuting inline script: %s",async completionAttrs=>{
    const result=await fixture({streamed:true,completionAttrs});
    expect(result.code).toBe(1);
    expect(result.report.findings.some((finding:{code:string})=>finding.code==="landmark-h1")).toBe(true);
    expect(result.requests.some(request=>request.path==="/photo.webp")).toBe(false);
  });
  it("passes valid routes and assets without external or authorized requests", async () => {
    const result = await fixture();
    expect(result.code, result.text).toBe(0);
    expect(result.report.summary).toMatchObject({ passed: true, failureCount: 0 });
    expect(result.requests.some(request => request.path === "/produkte" && request.method === "GET")).toBe(true);
    expect(result.requests.some(request => request.path === "/photo.webp")).toBe(true);
    expect(result.requests.every(request => !request.authorization)).toBe(true);
    expect(result.requests.filter(request => request.method === "POST").map(request => request.path).sort()).toEqual(["/api/bewerbung", "/api/chat", "/api/community", "/api/content/current", "/api/content/flyers", "/api/content/offers", "/api/handzettel/cron", "/api/handzettel/fetch", "/api/kuehlschrank", "/api/leergut-scan", "/api/rental-admin/orders/__audit_unknown__", "/api/rental-admin/outbox", "/api/rental-admin/session", "/api/rentals/orders", "/api/rentals/orders/__audit_unknown__/test-payment", "/api/rentals/quote", "/api/rentals/webhook"]);
    expect(result.requests.some(request => request.path === "/api/rental-admin/orders")).toBe(true);
    expect(JSON.stringify(result.report)).not.toContain("<h1>");
  });

  it("counts the resolved Next streamed content rather than fallback or script text", async () => {
    const result = await fixture({ streamed: true });
    expect(result.code, result.text).toBe(0);
    expect(result.report.pages.find((page: { path: string }) => page.path === "/produkte").landmarks).toMatchObject({ h1: 1, main: 1, header: 1, footer: 1 });
  });

  it.each([
    ["link", "link-status"], ["asset", "asset-status"], ["heading", "landmark-h1"], ["legacy", "legacy-chrome"],
    ["redirect", "page-status"], ["api", "api-status"], ["security", "security-header"], ["fragment", "link-fragment"],
    ["rental-auth", "api-status"], ["rental-referrer", "security-header"],
    ["offers","api-weekly-contract"], ["legacy-get","api-weekly-contract"], ["content-post","api-status"],
  ] as const)("fails visibly for %s defects", async (broken, code) => {
    const result = await fixture({ broken });
    expect(result.code, result.text).toBe(1);
    expect(result.report.summary.passed).toBe(false);
    expect(result.report.findings.some((finding: { code: string }) => finding.code === code)).toBe(true);
  });
});
