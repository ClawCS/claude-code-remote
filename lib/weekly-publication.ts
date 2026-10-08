import { createHash } from "node:crypto";
import { readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { validatePublicationPdf } from "./publication-pdf";
import sharp from "sharp";
import { berlinDateKey, getCurrentWeekRange } from "./editorial-schedule";
import { parseFlyerPackages, verifyFlyerFiles } from "./flyer-packages";
import { validateCatalog } from "./handzettel-catalog";
import { getAcceptedNlOfferRanges, getOfficialOfferRange } from "./offer-validity";
import { buildPublicOfferMetadata, type ReviewedWeeklyOffer, type WeeklyOfferPublicSource } from "./weekly-offer-metadata";
import type { LoadedWeeklyPublications, LocalAsset, PublishedOffer, VerifiedWeeklyEdition, WeeklyEdition, WeeklyPublication, WeeklyPublicationIssue } from "./weekly-publication-types";
import { assertWeeklyPublicationIdle } from "./weekly-publication-transaction";

const MAX_BYTES = 50 * 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const ID = /^[a-z0-9][a-z0-9-]{0,149}$/;
const PDF_PATH = /^\/handzettel\/[a-zA-Z0-9/_-]+\.pdf$/;
const COVER_PATH = /^\/images\/content\/[a-zA-Z0-9/_-]+\.(?:jpe?g|png|webp|avif)$/;
const OFFER_PATH = /^\/images\/offers\/[a-zA-Z0-9/_-]+\.(?:jpe?g|png|webp|avif)$/;

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`Invalid ${label}`);
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (!isDeepStrictEqual(actual, wanted)) throw new TypeError(`Invalid ${label} keys`);
}
function text(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`Invalid ${label}`);
}
function date(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}
function timestamp(value: unknown): value is string {
  return date(value) || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().replace(".000Z", "Z") === value.replace(".000Z", "Z"));
}
function weekRange(week: unknown) {
  if (!date(week)) throw new TypeError("Invalid week");
  const range = getCurrentWeekRange(new Date(`${week}T12:00:00Z`));
  if (range.validFrom !== week) throw new TypeError("Week must be a Monday");
  return range;
}
function positive(value: unknown, max: number): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0 && (value as number) <= max;
}
function asset(value: unknown, pattern: RegExp): LocalAsset {
  const item = record(value, "asset");
  keys(item, ["path", "sha256", "bytes"], "asset");
  if (typeof item.path !== "string" || !pattern.test(item.path) || item.path.includes("//")
    || typeof item.sha256 !== "string" || !HASH.test(item.sha256) || !positive(item.bytes, MAX_BYTES)) throw new TypeError("Invalid local asset");
  return item as unknown as LocalAsset;
}

export function parseWeeklyEdition(value: unknown, week: string): WeeklyEdition {
  const range = weekRange(week);
  const item = record(value, "edition");
  keys(item, ["id", "language", "title", "validFrom", "validTo", "source", "pdf", "cover", "pageCount", "review", "offerIds", "offersSha256"], "edition");
  text(item.id, "edition ID"); text(item.title, "title");
  if (!ID.test(item.id) || !["de", "nl"].includes(item.language as string)) throw new TypeError("Invalid edition identity");
  const source = record(item.source, "source");
  let accepted;
  if (item.language === "de" && source.kind === "trinkgut-official") {
    keys(source, ["kind", "catalogId", "catalogVersion", "metadataSha256"], "official source");
    if (typeof source.catalogId !== "string" || !/^\d{5,8}$/.test(source.catalogId)
      || typeof source.catalogVersion !== "string" || !/^[1-9]\d?$/.test(source.catalogVersion)
      || typeof source.metadataSha256 !== "string" || !HASH.test(source.metadataSha256)) throw new TypeError("Invalid official source");
    accepted = [getOfficialOfferRange(range, { catalogId: source.catalogId, catalogVersion: source.catalogVersion })];
  } else if (item.language === "nl" && source.kind === "canva") {
    keys(source, ["kind", "flyerId"], "NL source");
    if (typeof source.flyerId !== "string" || !ID.test(source.flyerId)) throw new TypeError("Invalid flyer reference");
    accepted = getAcceptedNlOfferRanges(range);
  } else throw new TypeError("Missing original source");
  if (!accepted.some(candidate => candidate.validFrom === item.validFrom && candidate.validTo === item.validTo)) throw new TypeError("Invalid printed validity range");
  asset(item.pdf, PDF_PATH); asset(item.cover, COVER_PATH);
  if (!positive(item.pageCount, 60) || (item.language === "nl" && item.pageCount !== 1)) throw new TypeError("Invalid page count");
  const review = record(item.review, "review");
  keys(review, ["reviewedAt", "printedValidFrom", "printedValidTo", "pageOfferCounts"], "review");
  if (!timestamp(review.reviewedAt) || review.printedValidFrom !== item.validFrom || review.printedValidTo !== item.validTo) throw new TypeError("Invalid review validity");
  if (!Array.isArray(review.pageOfferCounts) || review.pageOfferCounts.length !== item.pageCount
    || review.pageOfferCounts.some(count => !Number.isSafeInteger(count) || count < 0 || count > 1000)) throw new TypeError("Invalid page offer census");
  if (!Array.isArray(item.offerIds) || !item.offerIds.length || item.offerIds.some(id => typeof id !== "string" || !ID.test(id))
    || new Set(item.offerIds).size !== item.offerIds.length
    || review.pageOfferCounts.reduce((sum: number, count: number) => sum + count, 0) !== item.offerIds.length) throw new TypeError("Invalid offer census");
  if (typeof item.offersSha256 !== "string" || !HASH.test(item.offersSha256)) throw new TypeError("Invalid offer checksum");
  return item as unknown as WeeklyEdition;
}

function header(value: unknown, expectedWeek?: string) {
  const item = record(value, "weekly publication");
  keys(item, ["schemaVersion", "week", "editions"], "weekly publication");
  weekRange(item.week);
  if (item.schemaVersion !== 1 || (expectedWeek && item.week !== expectedWeek) || !Array.isArray(item.editions)) throw new TypeError("Invalid weekly publication header");
  return item as { schemaVersion: 1; week: string; editions: unknown[] };
}
export function parseWeeklyPublication(value: unknown): WeeklyPublication {
  const item = header(value);
  const editions = item.editions.map(edition => parseWeeklyEdition(edition, item.week));
  if (new Set(editions.map(edition => edition.id)).size !== editions.length
    || new Set(editions.map(edition => edition.language)).size !== editions.length) throw new TypeError("Duplicate weekly edition");
  return { schemaVersion: 1, week: item.week, editions };
}

const sha256 = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
function within(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
async function safeRead(root: string, relative: string, publicOnly = false): Promise<Buffer> {
  const canonicalRoot = await realpath(root);
  const boundary = publicOnly ? await realpath(path.join(root, "public")) : canonicalRoot;
  if (!within(canonicalRoot, boundary)) throw new Error("Asset root escapes package root");
  const file = path.resolve(root, relative);
  if (!within(publicOnly ? path.join(root, "public") : root, file)) throw new Error("Path escapes package root");
  const resolved = await realpath(file);
  if (!within(boundary, resolved)) throw new Error("Symlink escapes asset root");
  const info = await stat(resolved);
  if (!info.isFile() || info.size > MAX_BYTES) throw new Error("Invalid or oversized package file");
  const bytes = await readFile(resolved);
  if (bytes.length > MAX_BYTES) throw new Error("Oversized package file");
  return bytes;
}
async function json(root: string, file: string): Promise<unknown> {
  return JSON.parse((await safeRead(root, file)).toString("utf8"));
}
async function verifyAsset(item: LocalAsset, root: string): Promise<Buffer> {
  const bytes = await safeRead(root, `public${item.path}`, true);
  if (bytes.length !== item.bytes || sha256(bytes) !== item.sha256) throw new Error("Local asset integrity mismatch");
  return bytes;
}
async function decodeImage(bytes: Buffer) {
  const image = sharp(bytes, { limitInputPixels: 50_000_000 });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || !["jpeg", "png", "webp", "avif", "heif"].includes(metadata.format ?? "")) throw new Error("Invalid publication image");
  await image.resize(1, 1).raw().toBuffer();
  return metadata;
}
type LayoutPage = { page: number; expectedOffers: number; offers: (ReviewedWeeklyOffer & { imagePath?: string })[] };
type LayoutSource = WeeklyOfferPublicSource & { printedValidFrom: string; printedValidTo: string; coverSha256: string; pageCount: number; pages: LayoutPage[] };

export async function verifyWeeklyEdition(edition: WeeklyEdition, root: string): Promise<VerifiedWeeklyEdition> {
  edition = parseWeeklyEdition(edition, edition.validFrom);
  const pdf = await verifyAsset(edition.pdf, root);
  await validatePublicationPdf(pdf,edition.pageCount);
  await decodeImage(await verifyAsset(edition.cover, root));
  let originUrl: string;
  let flyerId = edition.id;
  if (edition.source.kind === "trinkgut-official") {
    const bytes = await safeRead(root, `data/editorial/official-catalogs/${edition.validFrom}.json`);
    if (sha256(bytes) !== edition.source.metadataSha256) throw new Error("Official catalog metadata checksum mismatch");
    const catalog: unknown = JSON.parse(bytes.toString("utf8"));
    validateCatalog(catalog, weekRange(edition.validFrom));
    if (catalog.catalogId !== edition.source.catalogId || catalog.catalogVersion !== edition.source.catalogVersion
      || catalog.validFrom !== edition.validFrom || catalog.validTo !== edition.validTo || catalog.pageCount !== edition.pageCount) throw new Error("Official catalog binding mismatch");
    originUrl = catalog.pdfUrl;
  } else {
    const entries = await json(root, "data/editorial/flyers.json");
    if (!Array.isArray(entries)) throw new TypeError("Invalid flyer provenance");
    // Only parse the referenced provenance; an unrelated historical flyer cannot disable this edition.
    const id = edition.source.flyerId;
    const candidates = entries.filter(value => value && typeof value === "object" && value.id === id);
    if (candidates.length !== 1) throw new Error("Missing or duplicate NL original");
    const [flyer] = parseFlyerPackages(candidates);
    if (flyer.language !== "nl" || flyer.validFrom !== edition.validFrom || flyer.validTo !== edition.validTo
      || flyer.pdfPath !== edition.pdf.path || flyer.pdfSha256 !== edition.pdf.sha256
      || flyer.coverPath !== edition.cover.path || flyer.coverSha256 !== edition.cover.sha256) throw new Error("NL original binding mismatch");
    await verifyFlyerFiles(flyer, root);
    originUrl = flyer.sourceUrl;
    flyerId = flyer.id;
  }
  const layout = record(await json(root, "data/weekly-offer-layout.json"), "offer layout");
  if (!Array.isArray(layout.sources)) throw new TypeError("Missing reviewed sources");
  const candidates = layout.sources.filter(value => value && typeof value === "object" && value.flyerId === flyerId && value.language === edition.language);
  if (candidates.length !== 1) throw new Error("Missing or duplicate reviewed source");
  const source = candidates[0] as LayoutSource;
  if (source.validFrom !== edition.validFrom || source.validTo !== edition.validTo || source.pdfSha256 !== edition.pdf.sha256
    || source.sourceUrl !== originUrl || source.rightsStatus !== "approved" || source.reviewedAt !== edition.review.reviewedAt
    || source.publishedPdfPath !== edition.pdf.path || source.coverSha256 !== edition.cover.sha256
    || source.printedValidFrom !== edition.validFrom || source.printedValidTo !== edition.validTo
    || source.pageCount !== edition.pageCount || !Array.isArray(source.pages) || source.pages.length !== edition.pageCount) throw new Error("Reviewed source binding mismatch");
  const expected = new Map<string, ReturnType<typeof buildPublicOfferMetadata>>();
  const rows = await json(root, "data/weekly-offers.json");
  if (!Array.isArray(rows)) throw new TypeError("Invalid published offers");
  for (const [index, page] of source.pages.entries()) {
    if (page.page !== index + 1 || !Array.isArray(page.offers) || page.expectedOffers !== page.offers.length
      || page.expectedOffers !== edition.review.pageOfferCounts[index]) throw new Error("Incomplete original page offer census");
    for (const offer of page.offers) {
      if (!offer || typeof offer.id !== "string" || !ID.test(offer.id) || expected.has(offer.id)) throw new Error("Duplicate or invalid original offer ID");
      if (!Array.isArray(offer.rect) || offer.rect.length !== 4 || !offer.rect.every(Number.isSafeInteger)
        || offer.rect[0] < 0 || offer.rect[1] < 0 || offer.rect[2] < 1 || offer.rect[3] < 1
        || !Array.isArray(offer.sourceDimensions) || offer.sourceDimensions.length !== 2 || !offer.sourceDimensions.every(n => positive(n, 50_000_000))
        || offer.rect[0] + offer.rect[2] > offer.sourceDimensions[0] || offer.rect[1] + offer.rect[3] > offer.sourceDimensions[1]
        || typeof offer.name !== "string" || !offer.name.trim() || typeof offer.categorySlug !== "string" || !offer.categorySlug.trim()
        || typeof offer.conditions !== "string" || (offer.sourceWarning !== undefined && typeof offer.sourceWarning !== "string")) throw new Error("Invalid reviewed offer metadata");
      if (offer.sourceRegions !== undefined && (!Array.isArray(offer.sourceRegions) || !offer.sourceRegions.length
        || offer.sourceRegions.some(region => !Array.isArray(region) || region.length !== 4 || !region.every(Number.isSafeInteger)
          || region[2] < 1 || region[3] < 1 || region[0] < offer.rect[0] || region[1] < offer.rect[1]
          || region[0] + region[2] > offer.rect[0] + offer.rect[2] || region[1] + region[3] > offer.rect[1] + offer.rect[3]))) throw new Error("Region outside reviewed original crop");
      const published = rows.find(row => row && typeof row === "object" && row.id === offer.id);
      const imagePath = offer.imagePath ?? `/images/offers/${offer.id}-${published?.imageSha256}.webp`;
      if (!OFFER_PATH.test(imagePath) || imagePath.includes("//")) throw new Error("Unsafe offer image path");
      const metadata = buildPublicOfferMetadata(source, page.page, offer, imagePath);
      expected.set(offer.id, metadata);
    }
  }
  if (!isDeepStrictEqual([...expected.keys()].sort(), [...edition.offerIds].sort())) throw new Error("Manifest is not the complete reviewed original offer set");
  const relevant = rows.filter(value => value && typeof value === "object"
    && (expected.has(value.id) || value.flyerId === flyerId || (value.language === edition.language && value.validFrom === edition.validFrom)));
  if (relevant.length !== expected.size) throw new Error("Published offer census mismatch");
  const seen = new Set<string>();
  const canonical: PublishedOffer[] = [];
  for (const value of relevant) {
    const row = record(value, "published offer");
    if (typeof row.id !== "string" || seen.has(row.id) || !expected.has(row.id)) throw new Error("Duplicate or unexpected public offer");
    seen.add(row.id);
    const { imageSha256, ...metadata } = row;
    if (typeof imageSha256 !== "string" || !HASH.test(imageSha256) || !isDeepStrictEqual(metadata, expected.get(row.id))) throw new Error("Public offer differs from the reviewed original");
    const offer = metadata as ReturnType<typeof buildPublicOfferMetadata>;
    const bytes = await safeRead(root, `public${offer.image}`, true);
    if (sha256(bytes) !== imageSha256) throw new Error("Offer image checksum mismatch");
    const image = await decodeImage(bytes);
    if (image.width !== offer.rect[2] || image.height !== offer.rect[3]) throw new Error("Offer image dimensions mismatch");
    canonical.push({ ...expected.get(row.id)!, imageSha256 });
  }
  const offers = canonical.toSorted((a, b) => a.id.localeCompare(b.id));
  if (sha256(JSON.stringify(offers)) !== edition.offersSha256) throw new Error("Complete public offer checksum mismatch");
  return { edition, offers };
}

async function load(root: string): Promise<LoadedWeeklyPublications> {
  const editions: VerifiedWeeklyEdition[] = [];
  const issues: WeeklyPublicationIssue[] = [];
  let files;
  try { files = await readdir(path.join(root, "data/editorial/weekly-publications"), { withFileTypes: true }); }
  catch { return { editions, issues: [{ week: null, code: "week-invalid" }] }; }
  for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
    let week: string | null = null;
    let item;
    try {
      const match = /^(\d{4}-\d{2}-\d{2})\.json$/.exec(file.name);
      if (!match || !file.isFile()) throw new Error("Invalid manifest filename");
      weekRange(match[1]); week = match[1];
      item = header(await json(root, `data/editorial/weekly-publications/${file.name}`), week);
    } catch { issues.push({ week, code: "week-invalid" }); continue; }
    const candidates: WeeklyEdition[] = [];
    for (const raw of item.editions) {
      const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
      const language = value.language === "de" || value.language === "nl" ? value.language : undefined;
      try {
        candidates.push(parseWeeklyEdition(raw, item.week));
      } catch { issues.push({ week, ...(language ? { language } : {}), code: "edition-invalid" }); }
    }
    // Malformed metadata cannot lend its raw identity to invalidate a valid sibling.
    // Uniqueness remains strict across all successfully parsed candidates.
    const counts = new Map<string, number>();
    const ids = new Map<string, number>();
    for (const edition of candidates) {
      counts.set(edition.language, (counts.get(edition.language) ?? 0) + 1);
      ids.set(edition.id, (ids.get(edition.id) ?? 0) + 1);
    }
    for (const edition of candidates) {
      try {
        if (counts.get(edition.language) !== 1 || ids.get(edition.id) !== 1) throw new Error("Duplicate edition");
        editions.push(await verifyWeeklyEdition(edition, root));
      } catch { issues.push({ week, language: edition.language, code: "edition-invalid" }); }
    }
  }
  return { editions, issues };
}
const production = new Map<string, Promise<LoadedWeeklyPublications>>();
export async function loadWeeklyPublications(root = process.cwd()): Promise<LoadedWeeklyPublications> {
  root = path.resolve(root);
  try { await assertWeeklyPublicationIdle(root); }
  catch { return {editions:[],issues:[{week:null,code:"preparation-incomplete"}]}; }
  let result: Promise<LoadedWeeklyPublications>;
  if (process.env.NODE_ENV !== "production") result = load(root);
  else {
    result = production.get(root) ?? load(root);
    production.set(root, result);
  }
  const loaded = await result;
  // Preparation can begin while asynchronous verification is in flight.
  try { await assertWeeklyPublicationIdle(root); }
  catch { return {editions:[],issues:[{week:null,code:"preparation-incomplete"}]}; }
  return loaded;
}

/** Time selection is deliberately not cached; missing/invalid languages never hide a valid sibling. */
export function selectPublishedEditions(loaded: LoadedWeeklyPublications, now: Date): readonly VerifiedWeeklyEdition[] {
  const today = berlinDateKey(now);
  const week = getCurrentWeekRange(now).validFrom;
  return loaded.editions.filter(({ edition }) => edition.validFrom === week && edition.validFrom <= today && today <= edition.validTo)
    .toSorted((a, b) => a.edition.language.localeCompare(b.edition.language));
}
