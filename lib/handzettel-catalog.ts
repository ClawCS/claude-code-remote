import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { berlinDateKey, getPublicationWeekRange } from "@/lib/editorial-schedule";

const HANDZETTEL_ORIGIN = "https://werbung.trinkgut.de";

export const HANDZETTEL_STORE_ID = "13027" as const;
export const HANDZETTEL_WERBEKREIS = "3.6" as const;
export const HANDZETTEL_VIEWER_URL =
  `${HANDZETTEL_ORIGIN}/frontend/mvc/catalog/by-name/${HANDZETTEL_STORE_ID}/newest` as const;

const VIEWER_PATH = `/frontend/mvc/catalog/by-name/${HANDZETTEL_STORE_ID}/newest`;
const CACHE_FILE_NAME = "handzettel-cache.json";
const CACHE_DIRECTORY = "data";
const BROWSER_HEADERS = {
  "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
  "User-Agent":
    "Mozilla/5.0 (compatible; TrinkgutJammersCatalog/1.0; +https://www.trinkgut.de/markt/jammers)",
} as const;

export type HandzettelPage = Readonly<{
  number: number;
  imageUrl: string;
  thumbnailUrl: string;
}>;

export type HandzettelCache = Readonly<{
  catalogId: string;
  catalogVersion: string;
  storeId: typeof HANDZETTEL_STORE_ID;
  werbekreis: typeof HANDZETTEL_WERBEKREIS;
  kw: number;
  year: number;
  validFrom: string;
  validTo: string;
  fetchedAt: string;
  viewerUrl: typeof HANDZETTEL_VIEWER_URL;
  pdfUrl: string;
  pageCount: number;
  pages: readonly HandzettelPage[];
  status: "ok";
}>;

export type HandzettelFallback = Readonly<{
  storeId: typeof HANDZETTEL_STORE_ID;
  werbekreis: typeof HANDZETTEL_WERBEKREIS;
  kw: number;
  year: number;
  validFrom: string;
  validTo: string;
  generatedAt: string;
  viewerUrl: typeof HANDZETTEL_VIEWER_URL;
  pdfUrl: null;
  pageCount: 0;
  pages: readonly [];
  status: "fallback";
  message: string;
}>;

type CatalogPathInfo = Readonly<{
  catalogId: string;
  version: string;
}>;

type CatalogViewerInfo = Readonly<{
  catalogId: string;
  version: string;
  catalogGroupId: string;
  title: string;
  expiresAt: string;
  validTo: string;
}>;

type CatalogDetailLevel = Readonly<{
  name: string;
  path: string;
  filename: string;
  extension: string;
}>;

type CatalogMappingRange = Readonly<{
  idStart: number;
  numberStart: number;
  pages: number;
}>;

export type CatalogManifest = Readonly<{
  name: string;
  pageCount: number;
  detailLevels: Readonly<{
    normal: CatalogDetailLevel;
    thumbnail: CatalogDetailLevel;
  }>;
  mapping: readonly CatalogMappingRange[];
  pageIds: readonly number[];
}>;

type PublicationRange = Readonly<{
  validFrom: string;
  validTo: string;
}>;

function cacheFilePath(): string {
  return path.join(process.cwd(), CACHE_DIRECTORY, CACHE_FILE_NAME);
}

function parseOfficialUrl(value: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError("invalid official catalog URL");
  }
  if (parsed.origin !== HANDZETTEL_ORIGIN || parsed.username || parsed.password) {
    throw new TypeError("invalid official catalog URL");
  }
  return parsed;
}

function decodeMarkup(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function uniqueMatch(
  source: string,
  pattern: RegExp,
  label: string,
): string {
  const values = [...source.matchAll(pattern)].map((match) => match[1]);
  if (values.length === 0) throw new TypeError(`missing ${label}`);
  const distinct = [...new Set(values)];
  if (distinct.length !== 1) throw new TypeError(`conflicting ${label}`);
  return distinct[0];
}

function parseAttributes(source: string, context: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern = /([A-Za-z_][\w:.-]*)\s*=\s*(["'])(.*?)\2/g;
  let cursor = 0;
  for (const match of source.matchAll(pattern)) {
    if (source.slice(cursor, match.index).trim()) {
      throw new TypeError(`malformed ${context}`);
    }
    const name = match[1];
    if (Object.hasOwn(attributes, name)) {
      throw new TypeError(`duplicate ${context} attribute ${name}`);
    }
    attributes[name] = decodeMarkup(match[3]);
    cursor = (match.index ?? 0) + match[0].length;
  }
  if (source.slice(cursor).trim()) throw new TypeError(`malformed ${context}`);
  return attributes;
}

function extractExpiryMeta(html: string): string {
  const values: string[] = [];
  for (const match of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const attributeSource = match[1].replace(/\/\s*$/, "");
    const httpEquivValues = [
      ...attributeSource.matchAll(/(?:^|\s)http-equiv\s*=\s*(["'])(.*?)\1/gi),
    ].map((attributeMatch) => decodeMarkup(attributeMatch[2]).toLowerCase());
    if (!httpEquivValues.includes("expires")) continue;

    const attributes = parseAttributes(attributeSource, "expires meta");
    const htmlAttribute = (name: string) => {
      const matches = Object.entries(attributes).filter(
        ([attributeName]) => attributeName.toLowerCase() === name,
      );
      if (matches.length > 1) throw new TypeError(`duplicate expires meta attribute ${name}`);
      return matches[0]?.[1];
    };
    if (htmlAttribute("http-equiv")?.toLowerCase() !== "expires") {
      throw new TypeError("conflicting expiry meta");
    }
    const content = htmlAttribute("content");
    if (!content) throw new TypeError("missing expiry");
    values.push(content);
  }
  if (values.length === 0) throw new TypeError("missing expiry");
  const distinct = [...new Set(values)];
  if (distinct.length !== 1) throw new TypeError("conflicting expiry");
  return distinct[0];
}

const MONTHS = new Map([
  ["Jan", 1],
  ["Feb", 2],
  ["Mar", 3],
  ["Apr", 4],
  ["May", 5],
  ["Jun", 6],
  ["Jul", 7],
  ["Aug", 8],
  ["Sep", 9],
  ["Oct", 10],
  ["Nov", 11],
  ["Dec", 12],
]);
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function expiryDateKey(value: string): string {
  const match =
    /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat), (\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) 23:59:59 (CET|CEST)$/.exec(
      value,
    );
  if (!match) throw new TypeError("invalid expiry");
  const [, weekday, dayText, monthText, yearText, timeZoneMarker] = match;
  const day = Number(dayText);
  const month = MONTHS.get(monthText);
  const year = Number(yearText);
  if (!month) throw new TypeError("invalid expiry");
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    WEEKDAYS[date.getUTCDay()] !== weekday
  ) {
    throw new TypeError("invalid expiry");
  }
  const lastSunday = (monthNumber: number) => {
    const lastDay = new Date(Date.UTC(year, monthNumber, 0, 12));
    return lastDay.getUTCDate() - lastDay.getUTCDay();
  };
  const expectedTimeZoneMarker =
    month < 3 || month > 10
      ? "CET"
      : month > 3 && month < 10
        ? "CEST"
        : month === 3
          ? day >= lastSunday(3)
            ? "CEST"
            : "CET"
          : day >= lastSunday(10)
            ? "CET"
            : "CEST";
  if (timeZoneMarker !== expectedTimeZoneMarker) {
    throw new TypeError("invalid expiry time zone");
  }
  return `${yearText}-${String(month).padStart(2, "0")}-${dayText}`;
}

export function extractCatalogInfo(
  url: string,
  html: string,
): CatalogPathInfo | CatalogViewerInfo {
  const parsedUrl = parseOfficialUrl(url);
  const directPath =
    /^\/frontend\/catalogs\/(\d{5,8})\/([1-9]\d?)(?:\/|$)/.exec(parsedUrl.pathname);
  const isViewerPath = parsedUrl.pathname === VIEWER_PATH;
  if (!directPath && !isViewerPath) {
    throw new TypeError("invalid official catalog path");
  }

  const hasViewerMetadata =
    /\bvar\s+catalog(?:Id|GroupId|Version|Name)\s*=|<meta\b[^>]*http-equiv=["']expires["']/i.test(
      html,
    );
  if (!hasViewerMetadata) {
    if (directPath) {
      return { catalogId: directPath[1], version: directPath[2] };
    }
    throw new TypeError("missing viewer metadata");
  }

  const catalogId = uniqueMatch(
    html,
    /\bvar\s+catalogId\s*=\s*["'](\d{5,8})["']\s*;?/g,
    "catalogId",
  );
  const catalogGroupId = uniqueMatch(
    html,
    /\bvar\s+catalogGroupId\s*=\s*["'](\d{5,8})["']\s*;?/g,
    "catalogGroupId",
  );
  const version = uniqueMatch(
    html,
    /\bvar\s+catalogVersion\s*=\s*["']([1-9]\d?)["']\s*;?/g,
    "catalogVersion",
  );
  const title = uniqueMatch(
    html,
    /\bvar\s+catalogName\s*=\s*["']([^"'\r\n]+)["']\s*;?/g,
    "catalogName",
  );
  const documentTitle = decodeMarkup(
    uniqueMatch(html, /<title>\s*([^<\r\n]+?)\s*<\/title>/gi, "title"),
  );
  if (documentTitle !== title) throw new TypeError("conflicting catalog title");

  const expiresAt = extractExpiryMeta(html);
  const validTo = expiryDateKey(expiresAt);

  if (directPath && directPath[1] !== catalogId) {
    throw new TypeError("conflicting catalogId");
  }
  if (directPath && directPath[2] !== version) {
    throw new TypeError("conflicting catalogVersion");
  }

  return {
    catalogId,
    version,
    catalogGroupId,
    title,
    expiresAt,
    validTo,
  };
}

function oneOpeningTag(xml: string, tagName: string): Record<string, string> {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>`, "g");
  const matches = [...xml.matchAll(pattern)];
  if (matches.length !== 1) throw new TypeError(`malformed ${tagName}`);
  return parseAttributes(matches[0][1], tagName);
}

function parsePositiveInteger(value: string | undefined, label: string): number {
  if (!value || !/^\d+$/.test(value)) throw new TypeError(`invalid ${label}`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new TypeError(`invalid ${label}`);
  return parsed;
}

export function extractCatalogManifest(xml: string): CatalogManifest {
  if (typeof xml !== "string" || !xml.trim() || /<!DOCTYPE/i.test(xml)) {
    throw new TypeError("malformed catalog XML");
  }
  const catalog = oneOpeningTag(xml, "catalog");
  if (!xml.includes("</catalog>")) throw new TypeError("malformed catalog XML");
  const name = catalog.name?.trim();
  if (!name) throw new TypeError("invalid manifest name");
  const pageCount = parsePositiveInteger(catalog.nofpages, "manifest page count");
  if (pageCount > 60) throw new TypeError("invalid manifest page count");

  const detailMatches = [...xml.matchAll(/<detaillevel\b([^>]*?)\/>/g)];
  const detailLevels = detailMatches.map((match) =>
    parseAttributes(match[1], "detail level"),
  );
  const normalLevels = detailLevels.filter((level) => level.name === "normal");
  const thumbnailLevels = detailLevels.filter((level) => level.name === "thumb");
  if (normalLevels.length !== 1) throw new TypeError("missing or duplicate normal detail level");
  if (thumbnailLevels.length !== 1) {
    throw new TypeError("missing or duplicate thumbnail detail level");
  }

  const validateDetailLevel = (
    level: Record<string, string>,
    expectedPath: string,
    label: string,
  ): CatalogDetailLevel => {
    if (
      level.path !== expectedPath ||
      level.filename !== "bk_" ||
      level.extension !== "jpg"
    ) {
      throw new TypeError(`invalid ${label} detail level`);
    }
    return {
      name: level.name,
      path: level.path,
      filename: level.filename,
      extension: level.extension,
    };
  };

  const mappingSections = [...xml.matchAll(/<mapping\b[^>]*>([\s\S]*?)<\/mapping>/g)];
  if (mappingSections.length !== 1) throw new TypeError("invalid manifest mapping");
  const mappingSource = mappingSections[0][1];
  const rangePattern = /<range\b([^>]*?)\/>/g;
  const rangeMatches = [...mappingSource.matchAll(rangePattern)];
  if (rangeMatches.length === 0 || mappingSource.replace(rangePattern, "").trim()) {
    throw new TypeError("invalid manifest mapping");
  }
  const mapping = rangeMatches.map((match) => {
    const attributes = parseAttributes(match[1], "mapping range");
    const range = {
      idStart: parsePositiveInteger(attributes.id_start, "mapping id_start"),
      numberStart: parsePositiveInteger(attributes.nr_start, "mapping nr_start"),
      pages: parsePositiveInteger(attributes.pages, "mapping pages"),
    };
    if (
      range.idStart > pageCount ||
      range.pages > pageCount ||
      range.idStart + range.pages - 1 > pageCount
    ) {
      throw new TypeError("invalid manifest mapping range");
    }
    return range;
  });
  const pageIds = mapping.flatMap((range) =>
    Array.from({ length: range.pages }, (_, index) => range.idStart + index),
  );
  const expectedPageIds = Array.from({ length: pageCount }, (_, index) => index + 1);
  const sortedPageIds = [...pageIds].sort((left, right) => left - right);
  if (
    sortedPageIds.length !== expectedPageIds.length ||
    sortedPageIds.some((pageId, index) => pageId !== expectedPageIds[index])
  ) {
    throw new TypeError("invalid manifest mapping coverage");
  }

  return {
    name,
    pageCount,
    detailLevels: {
      normal: validateDetailLevel(normalLevels[0], "../normal/", "normal"),
      thumbnail: validateDetailLevel(
        thumbnailLevels[0],
        "../thumbnails/",
        "thumbnail",
      ),
    },
    mapping,
    pageIds: expectedPageIds,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (actual.length !== required.length || actual.some((key, index) => key !== required[index])) {
    throw new TypeError(`invalid ${label} shape`);
  }
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string") throw new TypeError(`invalid ${label}`);
}

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function addCalendarDays(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function assertPublicationRange(range: PublicationRange): void {
  if (!isValidDateKey(range.validFrom) || !isValidDateKey(range.validTo)) {
    throw new TypeError("invalid target validity range");
  }
  const monday = new Date(`${range.validFrom}T12:00:00.000Z`);
  if (monday.getUTCDay() !== 1 || addCalendarDays(range.validFrom, 5) !== range.validTo) {
    throw new TypeError("invalid target validity range");
  }
}

function isoWeekIdentity(dateKey: string): Readonly<{ kw: number; year: number }> {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const year = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1, 12));
  const kw = Math.ceil(((date.valueOf() - yearStart.valueOf()) / 86_400_000 + 1) / 7);
  return { kw, year };
}

function isExactIsoTimestamp(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

const CACHE_KEYS = [
  "catalogId",
  "catalogVersion",
  "storeId",
  "werbekreis",
  "kw",
  "year",
  "validFrom",
  "validTo",
  "fetchedAt",
  "viewerUrl",
  "pdfUrl",
  "pageCount",
  "pages",
  "status",
] as const;

const PAGE_KEYS = ["number", "imageUrl", "thumbnailUrl"] as const;

export function validateCatalog(
  value: unknown,
  expectedRange: PublicationRange,
): asserts value is HandzettelCache {
  assertPublicationRange(expectedRange);
  if (!isRecord(value)) throw new TypeError("invalid catalog shape");
  assertExactKeys(value, CACHE_KEYS, "catalog");

  assertString(value.catalogId, "catalogId");
  if (!/^\d{5,8}$/.test(value.catalogId)) throw new TypeError("invalid catalogId");
  assertString(value.catalogVersion, "catalogVersion");
  if (!/^[1-9]\d?$/.test(value.catalogVersion)) {
    throw new TypeError("invalid catalogVersion");
  }
  if (value.storeId !== HANDZETTEL_STORE_ID) throw new TypeError("invalid storeId");
  if (value.werbekreis !== HANDZETTEL_WERBEKREIS) {
    throw new TypeError("invalid werbekreis");
  }
  if (value.status !== "ok") throw new TypeError("invalid status");

  assertString(value.validFrom, "validFrom");
  assertString(value.validTo, "validTo");
  if (
    value.validFrom !== expectedRange.validFrom ||
    value.validTo !== expectedRange.validTo
  ) {
    throw new TypeError("invalid validity range");
  }
  const expectedIdentity = isoWeekIdentity(expectedRange.validFrom);
  if (value.kw !== expectedIdentity.kw || value.year !== expectedIdentity.year) {
    throw new TypeError("invalid ISO week identity");
  }

  assertString(value.fetchedAt, "fetchedAt");
  if (!isExactIsoTimestamp(value.fetchedAt)) throw new TypeError("invalid fetchedAt");
  if (value.viewerUrl !== HANDZETTEL_VIEWER_URL) {
    throw new TypeError("invalid viewerUrl");
  }

  if (!Number.isInteger(value.pageCount) || (value.pageCount as number) < 1 || (value.pageCount as number) > 60) {
    throw new TypeError("invalid pageCount");
  }
  if (!Array.isArray(value.pages) || value.pages.length !== value.pageCount) {
    throw new TypeError("page count mismatch");
  }

  const pdfUrl =
    `${HANDZETTEL_ORIGIN}/frontend/catalogs/${value.catalogId}/${value.catalogVersion}/pdf/complete.pdf`;
  if (value.pdfUrl !== pdfUrl) throw new TypeError("invalid pdfUrl");

  const assetBase =
    `${HANDZETTEL_ORIGIN}/frontend/mvc/api/catalogs/${value.catalogId}/v${value.catalogVersion}`;
  value.pages.forEach((page, index) => {
    if (!isRecord(page)) throw new TypeError("invalid page shape");
    assertExactKeys(page, PAGE_KEYS, "page");
    const number = index + 1;
    if (page.number !== number) throw new TypeError("page numbers must be consecutive");
    if (page.imageUrl !== `${assetBase}/normal/bk_${number}.jpg`) {
      throw new TypeError("invalid page imageUrl");
    }
    if (page.thumbnailUrl !== `${assetBase}/thumbnails/bk_${number}.jpg`) {
      throw new TypeError("invalid page thumbnailUrl");
    }
  });
}

function mediaType(response: Response): string {
  return response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ?? "";
}

function assertResponse(
  response: Response,
  expectedMediaTypes: readonly string[],
  label: string,
  expectedUrl?: string,
): void {
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  if (!expectedMediaTypes.includes(mediaType(response))) {
    throw new Error(`${label} returned invalid content type`);
  }
  if (expectedUrl && response.url !== expectedUrl) {
    throw new Error(`${label} returned unexpected URL`);
  }
}

function isViewerInfo(info: CatalogPathInfo | CatalogViewerInfo): info is CatalogViewerInfo {
  return "catalogGroupId" in info;
}

function titleWeek(title: string): number {
  const match = /^KW(\d{1,2})(?:\s|$)/.exec(title);
  if (!match) throw new TypeError("invalid viewer calendar week");
  const kw = Number(match[1]);
  if (!Number.isInteger(kw) || kw < 1 || kw > 53) {
    throw new TypeError("invalid viewer calendar week");
  }
  return kw;
}

export async function fetchOfficialCatalog(
  now = new Date(),
  fetchImpl: typeof fetch = fetch,
): Promise<HandzettelCache> {
  const targetRange = getPublicationWeekRange(now);
  assertPublicationRange(targetRange);
  const expectedIdentity = isoWeekIdentity(targetRange.validFrom);

  const viewerResponse = await fetchImpl(HANDZETTEL_VIEWER_URL, {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
    headers: {
      ...BROWSER_HEADERS,
      Accept: "text/html,application/xhtml+xml",
    },
  });
  assertResponse(viewerResponse, ["text/html"], "catalog viewer");
  const html = await viewerResponse.text();
  const info = extractCatalogInfo(viewerResponse.url || HANDZETTEL_VIEWER_URL, html);
  if (!isViewerInfo(info)) throw new TypeError("missing complete viewer metadata");
  if (info.catalogGroupId !== HANDZETTEL_STORE_ID) {
    throw new TypeError("invalid catalogGroupId");
  }
  if (titleWeek(info.title) !== expectedIdentity.kw) {
    throw new TypeError("viewer calendar week does not match target range");
  }
  if (info.validTo !== targetRange.validTo) {
    throw new TypeError("viewer expiry does not match target range");
  }

  const assetBase =
    `${HANDZETTEL_ORIGIN}/frontend/mvc/api/catalogs/${info.catalogId}/v${info.version}`;
  const manifestUrl = `${assetBase}/xml/catalog.xml`;
  const manifestResponse = await fetchImpl(manifestUrl, {
    method: "GET",
    cache: "no-store",
    headers: {
      ...BROWSER_HEADERS,
      Accept: "application/xml,text/xml",
    },
  });
  assertResponse(
    manifestResponse,
    ["application/xml", "text/xml"],
    "catalog manifest",
    manifestUrl,
  );
  const manifest = extractCatalogManifest(await manifestResponse.text());
  if (manifest.name !== info.title) {
    throw new TypeError("manifest name does not match viewer title");
  }

  const pages: HandzettelPage[] = [];
  for (const number of manifest.pageIds) {
    const imageUrl = `${assetBase}/normal/bk_${number}.jpg`;
    const thumbnailUrl = `${assetBase}/thumbnails/bk_${number}.jpg`;
    const imageResponse = await fetchImpl(imageUrl, {
      method: "HEAD",
      cache: "no-store",
      headers: { ...BROWSER_HEADERS, Accept: "image/jpeg" },
    });
    assertResponse(imageResponse, ["image/jpeg"], `normal page ${number}`, imageUrl);
    const thumbnailResponse = await fetchImpl(thumbnailUrl, {
      method: "HEAD",
      cache: "no-store",
      headers: { ...BROWSER_HEADERS, Accept: "image/jpeg" },
    });
    assertResponse(
      thumbnailResponse,
      ["image/jpeg"],
      `thumbnail page ${number}`,
      thumbnailUrl,
    );
    pages.push({ number, imageUrl, thumbnailUrl });
  }

  const pdfUrl =
    `${HANDZETTEL_ORIGIN}/frontend/catalogs/${info.catalogId}/${info.version}/pdf/complete.pdf`;
  const pdfResponse = await fetchImpl(pdfUrl, {
    method: "HEAD",
    cache: "no-store",
    headers: { ...BROWSER_HEADERS, Accept: "application/pdf" },
  });
  assertResponse(pdfResponse, ["application/pdf"], "catalog PDF", pdfUrl);

  const catalog: HandzettelCache = {
    catalogId: info.catalogId,
    catalogVersion: info.version,
    storeId: HANDZETTEL_STORE_ID,
    werbekreis: HANDZETTEL_WERBEKREIS,
    kw: expectedIdentity.kw,
    year: expectedIdentity.year,
    validFrom: targetRange.validFrom,
    validTo: targetRange.validTo,
    fetchedAt: now.toISOString(),
    viewerUrl: HANDZETTEL_VIEWER_URL,
    pdfUrl,
    pageCount: manifest.pageCount,
    pages,
    status: "ok",
  };
  validateCatalog(catalog, targetRange);
  return catalog;
}

export function createHandzettelFallback(
  now = new Date(),
  message = "Aktueller Handzettel momentan nicht verfügbar.",
): HandzettelFallback {
  const targetRange = getPublicationWeekRange(now);
  const identity = isoWeekIdentity(targetRange.validFrom);
  return {
    storeId: HANDZETTEL_STORE_ID,
    werbekreis: HANDZETTEL_WERBEKREIS,
    kw: identity.kw,
    year: identity.year,
    validFrom: targetRange.validFrom,
    validTo: targetRange.validTo,
    generatedAt: now.toISOString(),
    viewerUrl: HANDZETTEL_VIEWER_URL,
    pdfUrl: null,
    pageCount: 0,
    pages: [],
    status: "fallback",
    message,
  };
}

export async function loadValidatedHandzettelCache(
  now = new Date(),
): Promise<HandzettelCache | null> {
  const targetRange = getPublicationWeekRange(now);
  try {
    const raw: unknown = JSON.parse(await readFile(cacheFilePath(), "utf8"));
    validateCatalog(raw, targetRange);
    const today = berlinDateKey(now);
    if (today < raw.validFrom || today > raw.validTo) return null;
    return raw;
  } catch {
    return null;
  }
}

export async function refreshHandzettelCache(
  now = new Date(),
  fetchImpl: typeof fetch = fetch,
): Promise<HandzettelCache> {
  const catalog = await fetchOfficialCatalog(now, fetchImpl);
  validateCatalog(catalog, getPublicationWeekRange(now));

  const cacheFile = cacheFilePath();
  const directory = path.dirname(cacheFile);
  const temporaryFile = path.join(
    directory,
    `.${path.basename(cacheFile)}.${process.pid}.${randomUUID()}.tmp`,
  );
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporaryFile, `${JSON.stringify(catalog, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    await rename(temporaryFile, cacheFile);
  } catch (error) {
    try {
      await unlink(temporaryFile);
    } catch {
      // The temp file may not exist yet or may already have been atomically renamed.
    }
    throw error;
  }
  return catalog;
}
