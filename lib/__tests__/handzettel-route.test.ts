import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;
const CACHE_FILE = path.join(process.cwd(), "data", "handzettel-cache.json");
const SECRET = "correct-secret";

type CacheState = Readonly<{
  contents: string | null;
  relatedEntries: readonly string[];
}>;

let cacheStateBeforeTest: CacheState;

async function captureCacheState(): Promise<CacheState> {
  let contents: string | null = null;
  try {
    contents = (await readFile(CACHE_FILE)).toString("base64");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  let relatedEntries: string[] = [];
  try {
    relatedEntries = (await readdir(path.dirname(CACHE_FILE)))
      .filter((entry) => entry.includes("handzettel-cache.json"))
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  return { contents, relatedEntries };
}

function requestWithAuthorization(
  authorization?: string,
  method = "GET",
): Request {
  return new Request("https://example.test/api/handzettel/cron", {
    method,
    headers: authorization ? { authorization } : undefined,
  });
}

function bearerRequest(token: string, method = "GET"): Request {
  return requestWithAuthorization(`Bearer ${token}`, method);
}

async function createHandler(refresh: () => unknown | Promise<unknown>) {
  const { createHandzettelCronHandler } = await import(
    "@/lib/handzettel-cron-handler"
  );
  return createHandzettelCronHandler(refresh);
}

beforeEach(async () => {
  cacheStateBeforeTest = await captureCacheState();
});

afterEach(async () => {
  const cacheStateAfterTest = await captureCacheState();

  if (ORIGINAL_CRON_SECRET === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.doUnmock("@/lib/handzettel-catalog");
  vi.resetModules();

  expect(cacheStateAfterTest).toEqual(cacheStateBeforeTest);
});

describe("handzettel cron handler", () => {
  it("rejects authenticated HEAD before authorization or refresh", async () => {
    process.env.CRON_SECRET = SECRET;
    const refresh = vi.fn();
    const handler = await createHandler(refresh);

    const response = await handler(bearerRequest(SECRET, "HEAD"));

    expect(response.status).toBe(405);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("allow")).toBe("GET, POST");
    expect(await response.text()).toBe("");
    expect(refresh).not.toHaveBeenCalled();
  });

  it.each(["GET", "POST"])(
    "returns no-store 503 for %s when no secret exists and never refreshes",
    async (method) => {
      delete process.env.CRON_SECRET;
      const refresh = vi.fn();
      const handler = await createHandler(refresh);

      const response = await handler(
        requestWithAuthorization(undefined, method),
      );

      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({
        success: false,
        error: "Cron is not configured",
      });
      expect(refresh).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["missing header", undefined, SECRET],
    ["malformed header", `Basic ${SECRET}`, SECRET],
    ["wrong-length bearer", "Bearer wrong", SECRET],
    ["same-length wrong bearer", "Bearer same-length-bad", "same-length-ok!"],
  ])(
    "returns no-store 401 for a %s and never refreshes",
    async (_label, authorization, configuredSecret) => {
      process.env.CRON_SECRET = configuredSecret;
      const refresh = vi.fn();
      const handler = await createHandler(refresh);

      const response = await handler(
        requestWithAuthorization(authorization),
      );

      expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({
        success: false,
        error: "Unauthorized",
      });
      expect(refresh).not.toHaveBeenCalled();
    },
  );

  it("reads CRON_SECRET when the request arrives, not when the handler is created", async () => {
    delete process.env.CRON_SECRET;
    const refresh = vi
      .fn()
      .mockResolvedValue({ status: "ok", pageCount: 10 });
    const handler = await createHandler(refresh);
    process.env.CRON_SECRET = "late-secret";

    const response = await handler(bearerRequest("late-secret"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("returns an exact no-store 200 response for a valid non-empty catalog result", async () => {
    process.env.CRON_SECRET = SECRET;
    const refresh = vi
      .fn()
      .mockResolvedValue({ status: "ok", pageCount: 10 });
    const handler = await createHandler(refresh);

    const response = await handler(bearerRequest(SECRET));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      success: true,
      status: "ok",
      pageCount: 10,
    });
    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["empty object", {}],
    ["missing page count", { status: "ok" }],
    ["fallback", { status: "fallback", pageCount: 0 }],
    ["zero", { status: "ok", pageCount: 0 }],
    ["negative", { status: "ok", pageCount: -1 }],
    ["fractional", { status: "ok", pageCount: 1.5 }],
    ["string", { status: "ok", pageCount: "10" }],
    ["above 60", { status: "ok", pageCount: 61 }],
  ])(
    "normalizes an invalid %s result to an exact no-store 502 response",
    async (_label, result) => {
      process.env.CRON_SECRET = SECRET;
      const refresh = vi.fn(() => result);
      const handler = await createHandler(refresh);

      const response = await handler(bearerRequest(SECRET));

      expect(response.status).toBe(502);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({
        success: false,
        status: "fallback",
        pageCount: 0,
      });
      expect(refresh).toHaveBeenCalledOnce();
    },
  );

  it.each([
    ["synchronous throw", () => {
      throw new Error("private source detail");
    }],
    ["rejected promise", () => Promise.reject(new Error("private source detail"))],
  ])("normalizes a %s to a generic no-store 502", async (_label, refresh) => {
    process.env.CRON_SECRET = SECRET;
    const handler = await createHandler(refresh);

    const response = await handler(bearerRequest(SECRET));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      success: false,
      status: "fallback",
      pageCount: 0,
    });
    expect(JSON.stringify(body)).not.toContain("private source detail");
  });

  it("rejects stateful accessors without executing them or splitting body from status", async () => {
    process.env.CRON_SECRET = SECRET;
    let getterCalls = 0;
    const stateful = {
      get status() {
        getterCalls += 1;
        return getterCalls === 1 ? "ok" : "fallback";
      },
      get pageCount() {
        getterCalls += 1;
        return 10;
      },
    };
    const handler = await createHandler(() => stateful);

    const response = await handler(bearerRequest(SECRET));

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      success: false,
      status: "fallback",
      pageCount: 0,
    });
    expect(getterCalls).toBe(0);
  });

  it.each([
    [
      "an array with assigned fields",
      () => Object.assign([], { status: "ok", pageCount: 10 }),
    ],
    [
      "an object with inherited fields",
      () => Object.create({ status: "ok", pageCount: 10 }),
    ],
    [
      "a class instance with own fields",
      () => {
        class CatalogResult {
          status = "ok";
          pageCount = 10;
        }
        return new CatalogResult();
      },
    ],
    [
      "a Proxy throwing from getPrototypeOf",
      () =>
        new Proxy(
          { status: "ok", pageCount: 10 },
          {
            getPrototypeOf() {
              throw new Error("private prototype detail");
            },
          },
        ),
    ],
    [
      "a Proxy throwing from getOwnPropertyDescriptor",
      () =>
        new Proxy(
          { status: "ok", pageCount: 10 },
          {
            getOwnPropertyDescriptor() {
              throw new Error("private descriptor detail");
            },
          },
        ),
    ],
  ])("rejects %s as a generic structural failure", async (_label, makeResult) => {
    process.env.CRON_SECRET = SECRET;
    const handler = await createHandler(makeResult);

    const response = await handler(bearerRequest(SECRET));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      success: false,
      status: "fallback",
      pageCount: 0,
    });
    expect(JSON.stringify(body)).not.toContain("private");
  });

  it("accepts a null-prototype result with own data properties", async () => {
    process.env.CRON_SECRET = SECRET;
    const result = Object.assign(Object.create(null), {
      status: "ok",
      pageCount: 10,
    });
    const handler = await createHandler(() => result);

    const response = await handler(bearerRequest(SECRET));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      success: true,
      status: "ok",
      pageCount: 10,
    });
  });
});

describe("production handzettel cron route", () => {
  it("rejects auto-routed HEAD on the fetch route before load or refresh", async () => {
    process.env.CRON_SECRET = SECRET;
    const createHandzettelFallback = vi.fn();
    const loadValidatedHandzettelCache = vi.fn();
    const refreshHandzettelCache = vi.fn();
    vi.doMock("@/lib/handzettel-catalog", () => ({
      createHandzettelFallback,
      loadValidatedHandzettelCache,
      refreshHandzettelCache,
    }));
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const route = await import("@/app/api/handzettel/fetch/route");
    const response = await route.GET(
      new Request(
        "https://example.test/api/handzettel/fetch?refresh=true",
        {
          method: "HEAD",
          headers: { authorization: `Bearer ${SECRET}` },
        },
      ),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("allow")).toBe("GET, POST");
    expect(await response.text()).toBe("");
    expect(createHandzettelFallback).not.toHaveBeenCalled();
    expect(loadValidatedHandzettelCache).not.toHaveBeenCalled();
    expect(refreshHandzettelCache).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("loads the real catalog module immediately after the fetch-route mock is removed", async () => {
    const catalog = await import("@/lib/handzettel-catalog");

    expect(catalog.HANDZETTEL_STORE_ID).toBe("13027");
    expect(catalog.refreshHandzettelCache).toBeTypeOf("function");
    expect(catalog.fetchOfficialCatalog).toBeTypeOf("function");
  });

  it("exports only GET and POST, calls the internal refresh once per method, and never self-fetches", async () => {
    process.env.CRON_SECRET = SECRET;
    const refreshHandzettelCache = vi
      .fn()
      .mockResolvedValue({ status: "ok", pageCount: 10 });
    vi.doMock("@/lib/handzettel-catalog", () => ({
      refreshHandzettelCache,
    }));
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        Response.json({ status: "ok", pageCount: 10, kw: 29 }),
      );

    const route = await import("@/app/api/handzettel/cron/route");

    expect(Object.keys(route).sort()).toEqual(["GET", "POST"]);
    const getResponse = await route.GET(bearerRequest(SECRET, "GET"));
    expect(refreshHandzettelCache).toHaveBeenCalledOnce();
    const postResponse = await route.POST(bearerRequest(SECRET, "POST"));

    expect(getResponse.status).toBe(200);
    expect(postResponse.status).toBe(200);
    expect(getResponse.headers.get("cache-control")).toBe("no-store");
    expect(postResponse.headers.get("cache-control")).toBe("no-store");
    expect(await getResponse.json()).toEqual({
      success: true,
      status: "ok",
      pageCount: 10,
    });
    expect(await postResponse.json()).toEqual({
      success: true,
      status: "ok",
      pageCount: 10,
    });
    expect(refreshHandzettelCache.mock.calls).toEqual([[], []]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("loads the real catalog module immediately after the route mock is removed", async () => {
    const catalog = await import("@/lib/handzettel-catalog");

    expect(catalog.HANDZETTEL_STORE_ID).toBe("13027");
    expect(catalog.refreshHandzettelCache).toBeTypeOf("function");
    expect(catalog.fetchOfficialCatalog).toBeTypeOf("function");
  });
});
