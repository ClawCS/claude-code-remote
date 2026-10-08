import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const dispose of cleanup.splice(0).reverse()) await dispose(); });

type FixtureOptions = { broken?: "link" | "asset" | "heading" | "legacy" | "redirect" | "api" | "security" | "fragment" | "rental-auth" | "rental-referrer" | "offers" | "legacy-get" | "content-post"; streamed?: boolean; hiddenQuotedAttribute?:boolean; completionAttrs?:string; malformedRow?: { collection: "offers" | "flyers" | "indexFlyers"; value: unknown } };

async function fixture(options: FixtureOptions = {}) {
  const requests: Array<{ path: string; method: string; authorization?: string; origin?: string; body: string }> = [];
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? "/", "http://fixture.invalid");
    const entry = { path: `${url.pathname}${url.search}`, method: request.method ?? "GET", authorization: request.headers.authorization, origin: request.headers.origin, body: "" };
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
      if (url.pathname.startsWith("/api/content/")) {
        if (request.method==="POST") {response.statusCode=options.broken==="content-post"?200:405;response.end();return;}
        const empty={status:"ok",issues:[],generatedAt:"2026-10-11T12:00:00Z",flyers:[],offers:[]};
        if (options.malformedRow && url.pathname === (options.malformedRow.collection === "indexFlyers" ? "/api/content/flyers" : "/api/content/offers")) {
          const collection = options.malformedRow.collection === "indexFlyers" ? "flyers" : options.malformedRow.collection;
          response.end(JSON.stringify({ ...empty, [collection]: [options.malformedRow.value] })); return;
        }
        response.end(JSON.stringify(url.pathname.endsWith("current")?{flyer:null,nlFlyer:null}:url.pathname.endsWith("offers")&&options.broken==="offers"?{...empty,offers:[{id:"unbound"}]}:empty));return;
      }
      if (url.pathname==="/api/handzettel/fetch"&&request.method==="GET"&&!url.search) {
        response.end(JSON.stringify({status:"fallback",pageCount:0,pages:options.broken==="legacy-get"?[{number:1,imageUrl:"https://provider.invalid/image.jpg"}]:[],viewerUrl:null,pdfUrl:null}));return;
      }
      if (/^\/api\/(rentals|rental-admin)\//.test(url.pathname)) {
        response.setHeader("Referrer-Policy", options.broken === "rental-referrer" ? "strict-origin-when-cross-origin" : "no-referrer");
        if (url.pathname === "/api/rentals/config") response.statusCode = 200;
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
    const child = spawn(process.execPath, ["scripts/audit-public-site.mjs", "--url", `http://127.0.0.1:${address.port}`, "--output", output], { cwd: process.cwd() });
    let text = "";
    child.stdout.on("data", chunk => { text += chunk.toString(); });
    child.stderr.on("data", chunk => { text += chunk.toString(); });
    child.on("close", code => resolve({ code, text }));
  });
  const report = await readFile(output, "utf8").then(JSON.parse).catch(() => null);
  return { ...result, report, requests };
}

describe("public HTTP forensic audit CLI", () => {
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
    expect(result.requests.filter(request => request.method === "POST").every(request => request.body === "{}" && !request.origin)).toBe(true);
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
