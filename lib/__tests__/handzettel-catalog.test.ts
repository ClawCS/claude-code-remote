import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/handzettel/fetch/route";
import {
  HANDZETTEL_STORE_ID,
  HANDZETTEL_VIEWER_URL,
  HANDZETTEL_WERBEKREIS,
  createHandzettelFallback,
  extractCatalogInfo,
  extractCatalogManifest,
  fetchOfficialCatalog,
  validateCatalog,
  type HandzettelCache,
} from "@/lib/handzettel-catalog";
import { getPublicationWeekRange } from "@/lib/editorial-schedule";

const NOW = new Date("2026-07-14T10:00:00.000Z");
const TARGET_RANGE = {
  validFrom: "2026-07-13",
  validTo: "2026-07-18",
} as const;
const CATALOG_ID = "1335913";
const CATALOG_VERSION = "2";
const CATALOG_TITLE = "KW29 2747 RHEINRUHR";
const ASSET_BASE =
  `https://werbung.trinkgut.de/frontend/mvc/api/catalogs/${CATALOG_ID}/v${CATALOG_VERSION}`;
const MANIFEST_URL = `${ASSET_BASE}/xml/catalog.xml`;
const PDF_URL =
  `https://werbung.trinkgut.de/frontend/catalogs/${CATALOG_ID}/${CATALOG_VERSION}/pdf/complete.pdf`;

type ViewerFixtureOptions = Readonly<{
  catalogId?: string;
  groupId?: string;
  version?: string;
  title?: string;
  documentTitle?: string;
  expiry?: string;
  suffix?: string;
}>;

function viewerHtml({
  catalogId = CATALOG_ID,
  groupId = HANDZETTEL_STORE_ID,
  version = CATALOG_VERSION,
  title = CATALOG_TITLE,
  documentTitle = title,
  expiry = "Sat, 18 Jul 2026 23:59:59 CEST",
  suffix = "",
}: ViewerFixtureOptions = {}): string {
  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="expires" content="${expiry}">
    <title>${documentTitle}</title>
  </head>
  <body>
    <script>
      var catalogId = '${catalogId}';
      var catalogGroupId = '${groupId}';
      var catalogVersion = '${version}';
      var catalogName = '${title}';
      ${suffix}
    </script>
  </body>
</html>`;
}

const CURRENT_MAPPING = `
  <range id_start="1" nr_start="1" pages="5"/>
  <range id_start="6" nr_start="2" pages="1"/>
  <range id_start="7" nr_start="1" pages="1"/>
  <range id_start="8" nr_start="1" pages="1"/>
  <range id_start="9" nr_start="1" pages="1"/>
  <range id_start="10" nr_start="1" pages="1"/>`;

type ManifestFixtureOptions = Readonly<{
  name?: string;
  pageCount?: number;
  mapping?: string;
  normalDetail?: string;
  thumbnailDetail?: string;
}>;

function manifestXml({
  name = CATALOG_TITLE,
  pageCount = 10,
  mapping = CURRENT_MAPPING,
  normalDetail =
    '<detaillevel name="normal" width="625" height="905" path="../normal/" filename="bk_" extension="jpg"/>',
  thumbnailDetail =
    '<detaillevel name="thumb" width="83" height="120" path="../thumbnails/" filename="bk_" extension="jpg"/>',
}: ManifestFixtureOptions = {}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<catalog name="${name}" nofpages="${pageCount}">
  <structure>
    ${thumbnailDetail}
    ${normalDetail}
  </structure>
  <mapping>${mapping}
  </mapping>
</catalog>`;
}

type PlannedFailure = Readonly<{
  status?: number;
  contentType?: string;
  responseUrl?: string;
}>;

type FetchFixtureOptions = Readonly<{
  html?: string;
  xml?: string;
  viewerResponseUrl?: string;
  failures?: Readonly<Record<string, PlannedFailure>>;
}>;

function response(
  body: BodyInit | null,
  contentType: string,
  status = 200,
  url = "",
): Response {
  const result = new Response(body, {
    status,
    headers: { "Content-Type": contentType },
  });
  if (url) Object.defineProperty(result, "url", { value: url });
  return result;
}

function expectedAssetCalls(catalogId = CATALOG_ID, version = CATALOG_VERSION) {
  const assetBase =
    `https://werbung.trinkgut.de/frontend/mvc/api/catalogs/${catalogId}/v${version}`;
  return Array.from({ length: 10 }, (_, index) => index + 1).flatMap((number) => [
    `HEAD ${assetBase}/normal/bk_${number}.jpg`,
    `HEAD ${assetBase}/thumbnails/bk_${number}.jpg`,
  ]);
}

function createFetchStub({
  html = viewerHtml(),
  xml = manifestXml(),
  viewerResponseUrl = HANDZETTEL_VIEWER_URL,
  failures = {},
}: FetchFixtureOptions = {}) {
  const calls: string[] = [];
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const key = `${method} ${url}`;
    calls.push(key);

    const failure = failures[key];
    if (failure) {
      return response(
        null,
        failure.contentType ?? defaultContentType(url),
        failure.status ?? 200,
        failure.responseUrl ?? url,
      );
    }

    if (key === `GET ${HANDZETTEL_VIEWER_URL}`) {
      return response(html, "text/html; charset=UTF-8", 200, viewerResponseUrl);
    }
    if (key === `GET ${MANIFEST_URL}`) {
      return response(xml, "application/xml; charset=UTF-8", 200, url);
    }
    if (expectedAssetCalls().includes(key)) {
      return response(null, "image/jpeg; charset=binary", 200, url);
    }
    if (key === `HEAD ${PDF_URL}`) {
      return response(null, "application/pdf; charset=binary", 200, url);
    }

    throw new Error(`Unplanned fetch: ${key}`);
  });

  return { calls, fetchImpl: fetchImpl as unknown as typeof fetch };
}

function defaultContentType(url: string): string {
  if (url.endsWith(".jpg")) return "image/jpeg";
  if (url.endsWith(".pdf")) return "application/pdf";
  if (url.endsWith(".xml")) return "application/xml";
  return "text/html";
}

function validCache(overrides: Partial<HandzettelCache> = {}): HandzettelCache {
  const pages = Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return {
      number,
      imageUrl: `${ASSET_BASE}/normal/bk_${number}.jpg`,
      thumbnailUrl: `${ASSET_BASE}/thumbnails/bk_${number}.jpg`,
    };
  });

  return {
    catalogId: CATALOG_ID,
    catalogVersion: CATALOG_VERSION,
    storeId: HANDZETTEL_STORE_ID,
    werbekreis: HANDZETTEL_WERBEKREIS,
    kw: 29,
    year: 2026,
    validFrom: TARGET_RANGE.validFrom,
    validTo: TARGET_RANGE.validTo,
    fetchedAt: NOW.toISOString(),
    viewerUrl: HANDZETTEL_VIEWER_URL,
    pdfUrl: PDF_URL,
    pageCount: 10,
    pages,
    status: "ok",
    ...overrides,
  };
}

describe("official leaflet catalog", () => {
  it("extracts catalog id and version from the official path", () => {
    expect(
      extractCatalogInfo(
        "https://werbung.trinkgut.de/frontend/catalogs/1234567/2/view",
        "",
      ),
    ).toEqual({ catalogId: "1234567", version: "2" });
  });

  it("uses Monday through Saturday in Berlin", () => {
    expect(getPublicationWeekRange(NOW)).toEqual(TARGET_RANGE);
  });

  it("rejects a fallback with invented page count", () => {
    expect(() =>
      validateCatalog(
        {
          catalogId: "unknown",
          catalogVersion: "1",
          storeId: "13027",
          werbekreis: "3.6",
          kw: 29,
          year: 2026,
          validFrom: "2026-07-13",
          validTo: "2026-07-18",
          fetchedAt: "2026-07-14T10:00:00.000Z",
          viewerUrl: "",
          pdfUrl: "",
          pageCount: 24,
          pages: [],
          status: "fallback",
        },
        TARGET_RANGE,
      ),
    ).toThrow(/catalogId/);
  });

  it("extracts one coherent viewer metadata set", () => {
    expect(extractCatalogInfo(HANDZETTEL_VIEWER_URL, viewerHtml())).toEqual({
      catalogId: CATALOG_ID,
      version: CATALOG_VERSION,
      catalogGroupId: HANDZETTEL_STORE_ID,
      title: CATALOG_TITLE,
      expiresAt: "Sat, 18 Jul 2026 23:59:59 CEST",
      validTo: "2026-07-18",
    });
  });

  it("ignores unrelated self-closing meta tags from the live viewer head", () => {
    const liveHeadHtml = viewerHtml().replace(
      "</head>",
      `  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>`,
    );

    expect(extractCatalogInfo(HANDZETTEL_VIEWER_URL, liveHeadHtml)).toMatchObject({
      catalogId: CATALOG_ID,
      version: CATALOG_VERSION,
      catalogGroupId: HANDZETTEL_STORE_ID,
      title: CATALOG_TITLE,
      validTo: "2026-07-18",
    });
  });

  it("still rejects conflicting expiry meta when the second tag is self-closing", () => {
    const conflictingExpiryHtml = viewerHtml().replace(
      "</head>",
      `  <meta http-equiv="expires" content="Sat, 25 Jul 2026 23:59:59 CEST"/>
  </head>`,
    );

    expect(() => extractCatalogInfo(HANDZETTEL_VIEWER_URL, conflictingExpiryHtml)).toThrow(
      /conflicting expiry/,
    );
  });

  it("rejects conflicting viewer metadata", () => {
    expect(() =>
      extractCatalogInfo(
        HANDZETTEL_VIEWER_URL,
        viewerHtml({ suffix: "var catalogId = '9999999';" }),
      ),
    ).toThrow(/conflicting catalogId/);
  });

  it("rejects an expiry whose CET/CEST marker conflicts with the Berlin date", () => {
    expect(() =>
      extractCatalogInfo(
        HANDZETTEL_VIEWER_URL,
        viewerHtml({ expiry: "Sat, 18 Jul 2026 23:59:59 CET" }),
      ),
    ).toThrow(/expiry time zone/);
  });

  it("rejects a direct path that conflicts with viewer metadata", () => {
    expect(() =>
      extractCatalogInfo(
        "https://werbung.trinkgut.de/frontend/catalogs/9999999/2/view",
        viewerHtml(),
      ),
    ).toThrow(/conflicting catalogId/);
  });

  it("extracts the ten-page detail-level and mapping proof", () => {
    expect(extractCatalogManifest(manifestXml())).toEqual({
      name: CATALOG_TITLE,
      pageCount: 10,
      detailLevels: {
        normal: {
          name: "normal",
          path: "../normal/",
          filename: "bk_",
          extension: "jpg",
        },
        thumbnail: {
          name: "thumb",
          path: "../thumbnails/",
          filename: "bk_",
          extension: "jpg",
        },
      },
      mapping: [
        { idStart: 1, numberStart: 1, pages: 5 },
        { idStart: 6, numberStart: 2, pages: 1 },
        { idStart: 7, numberStart: 1, pages: 1 },
        { idStart: 8, numberStart: 1, pages: 1 },
        { idStart: 9, numberStart: 1, pages: 1 },
        { idStart: 10, numberStart: 1, pages: 1 },
      ],
      pageIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    });
  });

  it.each([
    {
      label: "gap",
      mapping:
        '<range id_start="1" nr_start="1" pages="5"/><range id_start="7" nr_start="1" pages="4"/>',
    },
    {
      label: "overlap",
      mapping:
        '<range id_start="1" nr_start="1" pages="6"/><range id_start="6" nr_start="1" pages="5"/>',
    },
  ])("rejects a mapping $label", ({ mapping }) => {
    expect(() => extractCatalogManifest(manifestXml({ mapping }))).toThrow(/mapping/);
  });

  it("rejects a manifest without the proven thumbnail detail level", () => {
    expect(() => extractCatalogManifest(manifestXml({ thumbnailDetail: "" }))).toThrow(
      /thumbnail/,
    );
  });

  it("fetches and proves exactly ten official MVC page pairs and the PDF", async () => {
    const stub = createFetchStub();

    const result = await fetchOfficialCatalog(NOW, stub.fetchImpl);

    expect(result).toEqual(validCache());
    expect(stub.calls).toEqual([
      `GET ${HANDZETTEL_VIEWER_URL}`,
      `GET ${MANIFEST_URL}`,
      ...expectedAssetCalls(),
      `HEAD ${PDF_URL}`,
    ]);
  });

  it.each([
    {
      label: "wrong group",
      html: viewerHtml({ groupId: "99999" }),
      xml: manifestXml(),
      error: /catalogGroupId/,
    },
    {
      label: "wrong week",
      html: viewerHtml({ title: "KW30 2747 RHEINRUHR" }),
      xml: manifestXml({ name: "KW30 2747 RHEINRUHR" }),
      error: /calendar week/,
    },
    {
      label: "wrong expiry",
      html: viewerHtml({ expiry: "Sat, 25 Jul 2026 23:59:59 CEST" }),
      xml: manifestXml(),
      error: /expiry/,
    },
    {
      label: "wrong manifest name",
      html: viewerHtml(),
      xml: manifestXml({ name: "KW29 9999 FALSCH" }),
      error: /manifest name/,
    },
  ])("rejects $label source metadata", async ({ html, xml, error }) => {
    const stub = createFetchStub({ html, xml });
    await expect(fetchOfficialCatalog(NOW, stub.fetchImpl)).rejects.toThrow(error);
  });

  it.each([
    {
      label: "image status",
      key: `HEAD ${ASSET_BASE}/normal/bk_4.jpg`,
      failure: { status: 404 },
      error: /normal page 4.*404/,
    },
    {
      label: "thumbnail content type",
      key: `HEAD ${ASSET_BASE}/thumbnails/bk_3.jpg`,
      failure: { contentType: "text/html" },
      error: /thumbnail page 3.*content type/,
    },
    {
      label: "redirected image URL",
      key: `HEAD ${ASSET_BASE}/normal/bk_3.jpg`,
      failure: {
        responseUrl: `${ASSET_BASE}/normal/bk_4.jpg`,
      },
      error: /normal page 3.*URL/,
    },
    {
      label: "PDF status",
      key: `HEAD ${PDF_URL}`,
      failure: { status: 503 },
      error: /PDF.*503/,
    },
    {
      label: "PDF content type",
      key: `HEAD ${PDF_URL}`,
      failure: { contentType: "application/octet-stream" },
      error: /PDF.*content type/,
    },
  ])("rejects a bad $label proof", async ({ key, failure, error }) => {
    const stub = createFetchStub({ failures: { [key]: failure } });
    await expect(fetchOfficialCatalog(NOW, stub.fetchImpl)).rejects.toThrow(error);
  });

  it("rejects a tampered exact page URL", () => {
    const cache = validCache({
      pages: validCache().pages.map((page) =>
        page.number === 1
          ? { ...page, imageUrl: `${ASSET_BASE}/normal/bk_2.jpg` }
          : page,
      ),
    });

    expect(() => validateCatalog(cache, TARGET_RANGE)).toThrow(/imageUrl/);
  });

  it("rejects a non-positive catalog version even when every URL matches it", () => {
    const cache = validCache({
      catalogVersion: "0",
      pdfUrl: PDF_URL.replace("/2/", "/0/"),
      pages: validCache().pages.map((page) => ({
        ...page,
        imageUrl: page.imageUrl.replace("/v2/", "/v0/"),
        thumbnailUrl: page.thumbnailUrl.replace("/v2/", "/v0/"),
      })),
    });

    expect(() => validateCatalog(cache, TARGET_RANGE)).toThrow(/catalogVersion/);
  });

  it("uses the ISO week-year at the 2026/2027 boundary", async () => {
    const boundaryNow = new Date("2027-01-01T12:00:00.000Z");
    const title = "KW53 2747 RHEINRUHR";
    const stub = createFetchStub({
      html: viewerHtml({
        title,
        expiry: "Sat, 02 Jan 2027 23:59:59 CET",
      }),
      xml: manifestXml({ name: title }),
    });

    const result = await fetchOfficialCatalog(boundaryNow, stub.fetchImpl);

    expect(result).toMatchObject({
      kw: 53,
      year: 2026,
      validFrom: "2026-12-28",
      validTo: "2027-01-02",
    });
  });

  it("creates a truthful non-persistable fallback", () => {
    expect(createHandzettelFallback(NOW, "Quelle nicht verfügbar")).toEqual({
      storeId: HANDZETTEL_STORE_ID,
      werbekreis: HANDZETTEL_WERBEKREIS,
      kw: 29,
      year: 2026,
      validFrom: TARGET_RANGE.validFrom,
      validTo: TARGET_RANGE.validTo,
      generatedAt: NOW.toISOString(),
      viewerUrl: HANDZETTEL_VIEWER_URL,
      pdfUrl: null,
      pageCount: 0,
      pages: [],
      status: "fallback",
      message: "Quelle nicht verfügbar",
    });
  });
});

describe("leaflet refresh route", () => {
  const originalCwd = process.cwd();
  const originalSecret = process.env.CRON_SECRET;
  let sandbox = "";

  beforeEach(async () => {
    sandbox = await mkdtemp(path.join(tmpdir(), "handzettel-route-"));
    process.chdir(sandbox);
    delete process.env.CRON_SECRET;
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    await rm(sandbox, { recursive: true, force: true });
  });

  it("keeps the public GET read-only and returns no-store fallback for a missing cache", async () => {
    const network = vi.fn(() => {
      throw new Error("public GET attempted network access");
    });
    vi.stubGlobal("fetch", network);

    const result = await GET(new Request("https://example.test/api/handzettel/fetch"));

    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.json()).toMatchObject({
      status: "fallback",
      pageCount: 0,
      pages: [],
    });
    expect(network).not.toHaveBeenCalled();
    await expect(readdir(path.join(sandbox, "data"))).rejects.toThrow();
  });

  it("returns fallback for malformed cache JSON without network or file mutation", async () => {
    const cacheFile = path.join(sandbox, "data", "handzettel-cache.json");
    const malformed = '{"status":"ok",';
    await mkdir(path.dirname(cacheFile), { recursive: true });
    await writeFile(cacheFile, malformed, "utf8");
    const network = vi.fn(() => {
      throw new Error("malformed-cache GET attempted network access");
    });
    vi.stubGlobal("fetch", network);

    const result = await GET(new Request("https://example.test/api/handzettel/fetch"));

    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.json()).toMatchObject({
      status: "fallback",
      pageCount: 0,
      pages: [],
    });
    expect(network).not.toHaveBeenCalled();
    expect(await readFile(cacheFile, "utf8")).toBe(malformed);
    expect(await readdir(path.dirname(cacheFile))).toEqual(["handzettel-cache.json"]);
  });

  it("returns fallback for a legacy cache schema without network or file mutation", async () => {
    const cacheFile = path.join(sandbox, "data", "handzettel-cache.json");
    const { validFrom, validTo, ...currentFields } = validCache();
    const legacy = `${JSON.stringify(
      { ...currentFields, weekStart: validFrom, weekEnd: validTo },
      null,
      2,
    )}\n`;
    await mkdir(path.dirname(cacheFile), { recursive: true });
    await writeFile(cacheFile, legacy, "utf8");
    const network = vi.fn(() => {
      throw new Error("legacy-cache GET attempted network access");
    });
    vi.stubGlobal("fetch", network);

    const result = await GET(new Request("https://example.test/api/handzettel/fetch"));

    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.json()).toMatchObject({
      status: "fallback",
      pageCount: 0,
      pages: [],
    });
    expect(network).not.toHaveBeenCalled();
    expect(await readFile(cacheFile, "utf8")).toBe(legacy);
    expect(await readdir(path.dirname(cacheFile))).toEqual(["handzettel-cache.json"]);
  });

  it("serves only a validated active cache without network access", async () => {
    await mkdir(path.join(sandbox, "data"), { recursive: true });
    await writeFile(
      path.join(sandbox, "data", "handzettel-cache.json"),
      JSON.stringify(validCache()),
      "utf8",
    );
    const network = vi.fn(() => {
      throw new Error("cache read attempted network access");
    });
    vi.stubGlobal("fetch", network);

    const result = await GET(new Request("https://example.test/api/handzettel/fetch"));

    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.json()).toEqual(validCache());
    expect(network).not.toHaveBeenCalled();
  });

  it("does not expose a target cache before its validFrom date", async () => {
    const sundayBoundary = new Date("2026-07-19T14:00:00.000Z");
    vi.setSystemTime(sundayBoundary);
    const scheduled = validCache({
      kw: 30,
      validFrom: "2026-07-20",
      validTo: "2026-07-25",
      fetchedAt: sundayBoundary.toISOString(),
    });
    await mkdir(path.join(sandbox, "data"), { recursive: true });
    await writeFile(
      path.join(sandbox, "data", "handzettel-cache.json"),
      JSON.stringify(scheduled),
      "utf8",
    );
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("network"))));

    const result = await GET(new Request("https://example.test/api/handzettel/fetch"));

    expect(await result.json()).toMatchObject({ status: "fallback", pageCount: 0 });
  });

  it("does not expose an expired cache", async () => {
    vi.setSystemTime(new Date("2026-07-19T12:00:00.000Z"));
    await mkdir(path.join(sandbox, "data"), { recursive: true });
    await writeFile(
      path.join(sandbox, "data", "handzettel-cache.json"),
      JSON.stringify(validCache()),
      "utf8",
    );
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("network"))));

    const result = await GET(new Request("https://example.test/api/handzettel/fetch"));

    expect(await result.json()).toMatchObject({ status: "fallback", pageCount: 0 });
  });

  it("rejects refresh with 503 before network access when CRON_SECRET is absent", async () => {
    const network = vi.fn(() => Promise.reject(new Error("network")));
    vi.stubGlobal("fetch", network);

    const result = await POST(new Request("https://example.test/api/handzettel/fetch"));

    expect(result.status).toBe(503);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(network).not.toHaveBeenCalled();
  });

  it("rejects refresh with 401 before network access for a wrong bearer", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const network = vi.fn(() => Promise.reject(new Error("network")));
    vi.stubGlobal("fetch", network);

    const result = await GET(
      new Request("https://example.test/api/handzettel/fetch?refresh=true", {
        headers: { Authorization: "Bearer wrong-secret" },
      }),
    );

    expect(result.status).toBe(401);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(network).not.toHaveBeenCalled();
  });

  it("atomically persists only a validated successful refresh", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const stub = createFetchStub();
    vi.stubGlobal("fetch", stub.fetchImpl);

    const result = await POST(
      new Request("https://example.test/api/handzettel/fetch", {
        method: "POST",
        headers: { Authorization: "Bearer correct-secret" },
      }),
    );

    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.json()).toEqual(validCache());
    const cacheFile = path.join(sandbox, "data", "handzettel-cache.json");
    expect(JSON.parse(await readFile(cacheFile, "utf8"))).toEqual(validCache());
    expect(await readdir(path.dirname(cacheFile))).toEqual(["handzettel-cache.json"]);
  });

  it("returns 502 fallback and preserves the previous cache after refresh failure", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const cacheFile = path.join(sandbox, "data", "handzettel-cache.json");
    await mkdir(path.dirname(cacheFile), { recursive: true });
    const previous = `${JSON.stringify(validCache(), null, 2)}\n`;
    await writeFile(cacheFile, previous, "utf8");
    const stub = createFetchStub({
      failures: {
        [`HEAD ${ASSET_BASE}/normal/bk_2.jpg`]: { status: 404 },
      },
    });
    vi.stubGlobal("fetch", stub.fetchImpl);

    const result = await POST(
      new Request("https://example.test/api/handzettel/fetch", {
        method: "POST",
        headers: { Authorization: "Bearer correct-secret" },
      }),
    );

    expect(result.status).toBe(502);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.json()).toMatchObject({
      status: "fallback",
      pageCount: 0,
      pages: [],
    });
    expect(await readFile(cacheFile, "utf8")).toBe(previous);
    expect(await readdir(path.dirname(cacheFile))).toEqual(["handzettel-cache.json"]);
  });
});
