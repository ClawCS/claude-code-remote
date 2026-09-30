import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const dispose of cleanup.splice(0).reverse()) await dispose(); });

type FixtureOptions = { broken?: "link" | "asset" | "heading" | "legacy" | "redirect" | "api" | "security" | "fragment"; streamed?: boolean };

async function fixture(options: FixtureOptions = {}) {
  const requests: Array<{ path: string; method: string; authorization?: string }> = [];
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? "/", "http://fixture.invalid");
    requests.push({ path: `${url.pathname}${url.search}`, method: request.method ?? "GET", authorization: request.headers.authorization });
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
    const main = options.streamed
      ? `<main><!--$?--><template id="B:0"></template><h1>Fallback</h1><!--/$--></main><div hidden id="S:0">${content}</div><script>$RC("B:0","S:0")</script>`
      : `<main>${content}</main>`;
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
  it("passes valid routes and assets without external or authorized requests", async () => {
    const result = await fixture();
    expect(result.code, result.text).toBe(0);
    expect(result.report.summary).toMatchObject({ passed: true, failureCount: 0 });
    expect(result.requests.some(request => request.path === "/produkte" && request.method === "GET")).toBe(true);
    expect(result.requests.some(request => request.path === "/photo.webp")).toBe(true);
    expect(result.requests.every(request => !request.authorization)).toBe(true);
    expect(result.requests.filter(request => request.method === "POST").map(request => request.path).sort()).toEqual(["/api/bewerbung", "/api/chat", "/api/community", "/api/handzettel/cron", "/api/handzettel/fetch", "/api/kuehlschrank", "/api/leergut-scan"]);
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
  ] as const)("fails visibly for %s defects", async (broken, code) => {
    const result = await fixture({ broken });
    expect(result.code, result.text).toBe(1);
    expect(result.report.summary.passed).toBe(false);
    expect(result.report.findings.some((finding: { code: string }) => finding.code === code)).toBe(true);
  });
});
