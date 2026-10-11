import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import sharp from "sharp";

const auditModulePath = "../../scripts/audit-giveaway-images.mjs";
let audit: typeof import("../../scripts/audit-giveaway-images.mjs");
let original: Buffer;
let resized: Buffer;
const variants = new Map<number, Buffer>();
let manifest: { covers: Array<{ id: string; src: string; width: number; height: number; sha256: string; bytes: number }> };

const coverPath = "/images/editorial/instagram/giveaway-test.webp";
const imagePath = (width: number) => `/_next/image?url=%2Fimages%2Feditorial%2Finstagram%2Fgiveaway-test.webp&w=${width}&q=75`;
function pageMarkup(status = "active") {
  return `<article data-giveaway-id="test" data-status="${status}"><a data-giveaway-cover="test"><img src="${imagePath(1280).replaceAll("&", "&amp;")}" srcset="${imagePath(640).replaceAll("&", "&amp;")} 640w, ${imagePath(768).replaceAll("&", "&amp;")} 768w, ${imagePath(1280).replaceAll("&", "&amp;")} 1280w" width="1600" height="2000"></a></article>`;
}

beforeAll(async () => {
  // Failure modes use real encoded pixels/Response bodies, not mocked decoders.
  original = await sharp({ create: { width: 1600, height: 2000, channels: 3, background: "#bb6644" } }).webp().toBuffer();
  resized = await sharp(original).resize({ width: 640 }).webp().toBuffer();
  for (const width of [640, 768, 1280]) variants.set(width, await sharp(original).resize({ width }).webp().toBuffer());
  manifest = { covers: [{ id: "test", src: coverPath, width: 1600, height: 2000, sha256: createHash("sha256").update(original).digest("hex"), bytes: original.length }] };
  audit = await import(auditModulePath);
});

describe("focused giveaway image delivery audit", () => {
  test("discovers only rendered active covers and preserves their responsive URLs", () => {
    const hidden = `<div hidden>${pageMarkup()}</div>`;
    const html = pageMarkup() + pageMarkup("ended") + hidden + `<script>${JSON.stringify(pageMarkup())}</script>`;
    const covers = audit.discoverGiveawayImages(html, "https://example.test");
    expect(covers).toHaveLength(1);
    expect(covers[0]).toMatchObject({ id: "test", originalPath: coverPath, width: 1600, height: 2000 });
    expect(covers[0].variants.map((entry: { width: number }) => entry.width)).toEqual([640, 768, 1280]);
  });

  test("rejects cross-origin sources and variants pointing at a different original", () => {
    expect(() => audit.discoverGiveawayImages(pageMarkup().replaceAll("/_next/image", "https://external.test/_next/image"), "https://example.test")).toThrow(/same.origin/i);
    expect(() => audit.discoverGiveawayImages(pageMarkup().replace("srcset=\"/_next/image?url=%2Fimages", "srcset=\"/_next/image?url=%2Fother"), "https://example.test")).toThrow(/original/i);
  });

  test("accepts valid WebP responses even when the client prefers AVIF", async () => {
    const result = await audit.inspectImageResponse(new Response(new Uint8Array(resized), { headers: { "content-type": "image/webp" } }), { width: 640, sourceWidth: 1600, sourceHeight: 2000 });
    expect(result).toMatchObject({ format: "webp", width: 640, height: 800, bytes: resized.length });
  });

  test("rejects HTTP errors, non-image responses and empty image bodies", async () => {
    await expect(audit.inspectImageResponse(new Response("not found", { status: 404 }), {})).rejects.toThrow(/HTTP 404/);
    await expect(audit.inspectImageResponse(new Response("<html>failure</html>", { headers: { "content-type": "text/html" } }), {})).rejects.toThrow(/content.type/i);
    await expect(audit.inspectImageResponse(new Response(new Uint8Array(), { headers: { "content-type": "image/webp" } }), {})).rejects.toThrow(/empty/i);
  });

  test("actually decodes pixels instead of trusting image headers or metadata", async () => {
    const corrupt = Buffer.from(resized);
    corrupt.fill(0, 40);
    await expect(audit.inspectImageResponse(new Response(new Uint8Array(corrupt), { headers: { "content-type": "image/webp" } }), {})).rejects.toThrow(/decode/i);
  });

  test("rejects incorrect variant dimensions, media types and original hashes", async () => {
    await expect(audit.inspectImageResponse(new Response(new Uint8Array(resized), { headers: { "content-type": "image/webp" } }), { width: 1280, sourceWidth: 1600, sourceHeight: 2000 })).rejects.toThrow(/width/i);
    await expect(audit.inspectImageResponse(new Response(new Uint8Array(resized), { headers: { "content-type": "image/avif" } }), {})).rejects.toThrow(/format/i);
    await expect(audit.inspectImageResponse(new Response(new Uint8Array(original), { headers: { "content-type": "image/webp" } }), { sha256: "0".repeat(64) })).rejects.toThrow(/hash/i);
  });

  test("times out response bodies as well as initial fetches", async () => {
    const stream = new ReadableStream({ start() {} });
    await expect(audit.inspectImageResponse(new Response(stream, { headers: { "content-type": "image/webp" } }), {}, { timeoutMs: 15 })).rejects.toThrow(/timeout/i);
    const report = await audit.auditGiveawayImages({ url: "https://example.test", manifest, timeoutMs: 15, fetchImpl: () => new Promise(() => {}) });
    expect(report.ok).toBe(false);
    expect(report.findings).toHaveLength(2);
    expect(report.findings.every((entry: { code: string }) => entry.code === "page-request-failed")).toBe(true);
  });

  test("records a failed 1280 AVIF-preferring GET without hiding it behind successful originals and WebP", async () => {
    const fetchImpl: typeof fetch = async (input, options) => {
      const url = new URL(input instanceof Request ? input.url : input);
      if (url.pathname === "/" || url.pathname === "/gewinnspiel") return new Response(pageMarkup(), { headers: { "content-type": "text/html" } });
      if (url.pathname === coverPath) return new Response(new Uint8Array(original), { headers: { "content-type": "image/webp" } });
      if (url.searchParams.get("w") === "1280" && new Headers(options?.headers).get("Accept")?.includes("image/avif")) return new Promise<Response>(() => {});
      const bytes = variants.get(Number(url.searchParams.get("w")));
      if (!bytes) throw new Error("Unexpected responsive width");
      return new Response(new Uint8Array(bytes), { headers: { "content-type": "image/webp" } });
    };
    const report = await audit.auditGiveawayImages({ url: "https://example.test", manifest, timeoutMs: 1000, fetchImpl });
    expect(report.ok).toBe(false);
    expect(report.checks).toHaveLength(7);
    expect(report.checks.filter((entry: { ok: boolean }) => !entry.ok)).toMatchObject([{ width: 1280, accept: "avif-preferred", error: expect.stringMatching(/timeout/i) }]);
    expect(report.pages.map((entry: { ids: string[] }) => entry.ids)).toEqual([["test"], ["test"]]);
  });

  test("fails unknown source hashes and missing active cover markup instead of silently skipping them", async () => {
    const unknown = await audit.auditGiveawayImages({ url: "https://example.test", manifest: { covers: [] }, fetchImpl: async () => new Response(pageMarkup(), { headers: { "content-type": "text/html" } }) });
    expect(unknown.ok).toBe(false);
    expect(unknown.findings.some((entry: { code: string }) => entry.code === "unverified-original")).toBe(true);
    const missing = pageMarkup().replace(/<img[^>]+>/, "");
    expect(() => audit.discoverGiveawayImages(missing, "https://example.test")).toThrow(/cover/i);
  });

  test("does not greenlight image delivery when both pages contain zero active covers", async () => {
    const report = await audit.auditGiveawayImages({ url: "https://example.test", manifest, fetchImpl: async () => new Response("<main>No active giveaways</main>", { headers: { "content-type": "text/html" } }) });
    expect(report.ok).toBe(false);
    expect(report.checks).toEqual([]);
    expect(report.findings).toMatchObject([{ code: "no-active-image-coverage" }]);
  });
});

describe("real read-only HTTP boundary", () => {
  const methods: string[] = [];
  const accepts = new Set<string>();
  const server = createServer(async (request, response) => {
    methods.push(request.method ?? "");
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname === "/" || url.pathname === "/gewinnspiel") {
      response.setHeader("content-type", "text/html");
      response.end(pageMarkup());
    } else if (url.pathname === coverPath) {
      response.setHeader("content-type", "image/webp");
      response.end(original);
    } else if (url.pathname === "/_next/image") {
      accepts.add(request.headers.accept ?? "");
      const bytes = await sharp(original).resize({ width: Number(url.searchParams.get("w")) }).webp().toBuffer();
      response.setHeader("content-type", "image/webp");
      response.end(bytes);
    } else {
      response.writeHead(404).end();
    }
  });
  beforeAll(async () => { await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve)); });
  afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });

  test("requests only two pages, one original and six decoded negotiated variants", async () => {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server not listening");
    const report = await audit.auditGiveawayImages({ url: `http://127.0.0.1:${address.port}`, manifest, timeoutMs: 2000 });
    expect(report.ok).toBe(true);
    expect(report.checks).toHaveLength(7);
    expect(report.findings).toEqual([]);
    expect(methods).toEqual(Array(9).fill("GET"));
    expect(accepts.size).toBe(2);
    expect(report.checks.filter((entry: { kind: string }) => entry.kind === "variant").map((entry: { width: number; format: string }) => [entry.width, entry.format])).toEqual([[640, "webp"], [640, "webp"], [768, "webp"], [768, "webp"], [1280, "webp"], [1280, "webp"]]);
  });
});
