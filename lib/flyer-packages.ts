import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { validatePublicationPdf } from "./publication-pdf";
import sharp from "sharp";

import { berlinDateKey } from "@/lib/editorial-schedule";
import { getAcceptedNlOfferRanges } from "@/lib/offer-validity";
import { assertPublicationPolicy, isPublicationTimestamp, type PublicationIdentity } from "./flyer-source-policy";
import type { EditionSource } from "./weekly-publication-types";

export type FlyerPackage = Readonly<{
  id: string;
  language: "de" | "nl";
  title: string;
  validFrom: string;
  validTo: string;
  sourceUrl?: string;
  designId?: string;
  identity?: PublicationIdentity;
  source?: EditionSource;
  pageCount?: number;
  review?: Readonly<{ reviewedAt: string; approvedAt: string; printedValidFrom: string; printedValidTo: string }>;
  /** Physical selected PDF pages; agency originals normalize to [1], not Canva design pages. */
  pageNumbers: readonly number[];
  rightsStatus: "approved";
  exportedAt: string;
  pdfPath: string;
  coverPath: string;
  pdfSha256: string;
  coverSha256: string;
}>;
export type ParsedFlyerPackage = FlyerPackage & Readonly<{ identity: PublicationIdentity; source: EditionSource; pageCount: number }>;
/** New on-disk provenance; agency originals have no invented Canva export fields. */
export type OriginalFlyerProvenance = Omit<FlyerPackage, "sourceUrl" | "designId" | "pageNumbers" | "identity" | "source" | "pageCount" | "review"> & Readonly<{
  identity: PublicationIdentity;
  pageCount: number;
  review: NonNullable<FlyerPackage["review"]>;
}> & (
  | Readonly<{ source: Extract<EditionSource, { kind: "agency" }> }>
  | Readonly<{ source: Extract<EditionSource, { kind: "canva" }>; sourceUrl: string; designId: string; pageNumbers: readonly number[] }>
);

const pdfPath = /^\/handzettel\/[a-zA-Z0-9/_-]+\.pdf$/;
const coverPath = /^\/images\/content\/[a-zA-Z0-9/_-]+\.(?:jpe?g|png|webp|avif)$/;
const hash = /^[a-f0-9]{64}$/;

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function exactKeys(item: Record<string, unknown>, expected: readonly string[]): void {
  if (Object.keys(item).sort().join() !== [...expected].sort().join()) throw new TypeError("Ungültige Herkunftsfelder.");
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Ungültige Herkunft.");
  return value as Record<string, unknown>;
}
export function parseFlyerPackages(value: unknown): readonly ParsedFlyerPackage[] {
  if (!Array.isArray(value)) throw new TypeError("Flyerpakete müssen eine Liste sein.");
  const ids = new Set<string>();
  const packages = value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new TypeError("Ungültiges Flyerpaket.");
    const item = entry as Record<string, unknown>;
    const typed = "identity" in item || "source" in item || "review" in item || "pageCount" in item;
    const source = typed ? object(item.source) : { kind: "canva", flyerId: item.id };
    const isCanva = source.kind === "canva";
    const common = ["id", "language", "title", "validFrom", "validTo", "rightsStatus", "exportedAt", "pdfPath", "coverPath", "pdfSha256", "coverSha256"];
    exactKeys(item, [...common, ...(isCanva ? ["sourceUrl", "designId", "pageNumbers"] : []), ...(typed ? ["identity", "source", "pageCount", "review"] : [])]);
    for (const field of ["id", "title", "exportedAt", "pdfPath", "coverPath", "pdfSha256", "coverSha256"] as const) {
      if (typeof item[field] !== "string" || !item[field].trim()) throw new TypeError(`Flyerfeld ${field} fehlt.`);
    }
    if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(item.id as string) || ids.has(item.id as string)) throw new TypeError("Ungültige oder doppelte Flyer-ID.");
    ids.add(item.id as string);
    if (item.language !== "de" && item.language !== "nl") throw new TypeError("Ungültige Flyersprache.");
    if (!validDate(item.validFrom) || !validDate(item.validTo) || item.validFrom > item.validTo) throw new TypeError("Ungültiger Flyerzeitraum.");
    if (item.rightsStatus !== "approved") throw new TypeError("Flyer nicht freigegeben.");
    if (isCanva) {
      exactKeys(source, ["kind", "flyerId"]);
      if (source.flyerId !== item.id || typeof item.designId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(item.designId)
        || typeof item.sourceUrl !== "string") throw new TypeError("Ungültige Canva-Identität.");
      const url = new URL(item.sourceUrl);
      if (url.protocol !== "https:" || url.username || url.password || url.hostname !== "www.canva.com" || !url.pathname.startsWith(`/design/${item.designId}/`)) throw new TypeError("Ungültige Canva-Herkunft.");
      if (!Array.isArray(item.pageNumbers) || !item.pageNumbers.length || item.pageNumbers.length > 60 || item.pageNumbers.some((n) => !Number.isInteger(n) || n < 1 || n > 1000) || new Set(item.pageNumbers).size !== item.pageNumbers.length) throw new TypeError("Ungültige Canva-Seitenauswahl.");
    } else {
      exactKeys(source, ["kind", "originalId", "medium"]);
      if (source.kind !== "agency" || source.originalId !== item.id) throw new TypeError("Ungültige Agentur-Originalbindung.");
    }
    const pageCount = typed ? item.pageCount : (item.pageNumbers as number[]).length;
    if (!Number.isSafeInteger(pageCount) || (pageCount as number) < 1 || (pageCount as number) > 60
      || (item.language === "nl" && pageCount !== 1)
      || (isCanva && pageCount !== (item.pageNumbers as number[]).length)) throw new TypeError("Der NL-Flyer muss genau eine Seite enthalten.");
    const identity = typed ? object(item.identity) as unknown as PublicationIdentity
      : { purpose: "weekly" as const, medium: "legacy-canva" as const, language: item.language as "de" | "nl" };
    if (identity.language !== item.language) throw new TypeError("Widersprüchliche Flyersprache.");
    assertPublicationPolicy(identity, source as EditionSource, item.validFrom, item.validTo);
    if (typed) {
      const review = object(item.review);
      exactKeys(review, ["reviewedAt", "approvedAt", "printedValidFrom", "printedValidTo"]);
      if (!isPublicationTimestamp(review.reviewedAt) || !isPublicationTimestamp(review.approvedAt)
        || Date.parse(review.approvedAt) < Date.parse(review.reviewedAt)
        || review.printedValidFrom !== item.validFrom || review.printedValidTo !== item.validTo) throw new TypeError("Ungültige Originalprüfung/Freigabe.");
    }
    if (!pdfPath.test(item.pdfPath as string) || !coverPath.test(item.coverPath as string)) throw new TypeError("Ungültiger lokaler Flyerpfad.");
    if (!hash.test(item.pdfSha256 as string) || !hash.test(item.coverSha256 as string)) throw new TypeError("Ungültige Dateiprüfsumme.");
    if (!isPublicationTimestamp(item.exportedAt)) throw new TypeError("Ungültige Exportzeit.");
    return { ...item, identity, source, pageCount, pageNumbers: isCanva ? item.pageNumbers : [1] } as unknown as ParsedFlyerPackage;
  });
  for (let i=0;i<packages.length;i++) for (let j=i+1;j<packages.length;j++) {
    const a=packages[i], b=packages[j];
    if (a.identity.purpose === "weekly" && b.identity.purpose === "weekly" && a.language === b.language && a.validFrom <= b.validTo && b.validFrom <= a.validTo) throw new TypeError(`Überlappende Wochenflyer: ${a.id}, ${b.id}`);
  }
  return packages;
}

async function loadAndVerifyFlyerPackages(): Promise<readonly FlyerPackage[]> {
  const packages = parseFlyerPackages(JSON.parse(await readFile(path.join(process.cwd(), "data/editorial/flyers.json"), "utf8")));
  // Bounded I/O: immutable production artifacts are validated once per process.
  for (const item of packages) await verifyFlyerFiles(item);
  return packages;
}
let productionPackages: Promise<readonly FlyerPackage[]> | undefined;
export function loadFlyerPackages(): Promise<readonly FlyerPackage[]> {
  if (process.env.NODE_ENV !== "production") return loadAndVerifyFlyerPackages();
  return productionPackages ??= loadAndVerifyFlyerPackages();
}

export function selectActiveFlyerPackages(packages: readonly FlyerPackage[], now = new Date()): readonly FlyerPackage[] {
  const today = berlinDateKey(now);
  return packages.filter((item) => item.validFrom <= today && today <= item.validTo)
    .toSorted((a, b) => b.validFrom.localeCompare(a.validFrom) || a.id.localeCompare(b.id));
}

// A dated weekly NL page is mandatory alongside the official DE catalog.
// Only the exact calendar week or explicit reviewed KW40 exception can satisfy it;
// arbitrary partial weeks, multi-week intervals and duplicates cannot.
export function selectWeeklyNlFlyer(
  packages: readonly FlyerPackage[],
  range: Readonly<{validFrom: string; validTo: string}>,
): FlyerPackage | null {
  const acceptedRanges = getAcceptedNlOfferRanges(range);
  const matches = packages.filter(item => {
    if (item.language !== "nl" || item.pageNumbers.length !== 1 || item.identity?.purpose === "supplemental"
      || !acceptedRanges.some(accepted => item.validFrom === accepted.validFrom && item.validTo === accepted.validTo)) return false;
    try {
      assertPublicationPolicy(item.identity ?? { language: "nl", purpose: "weekly", medium: "legacy-canva" },
        item.source ?? { kind: "canva", flyerId: item.id }, item.validFrom, item.validTo, range.validFrom);
      return true;
    } catch { return false; }
  });
  return matches.length === 1 ? matches[0] : null;
}

export async function verifyFlyerFiles(item: FlyerPackage, root = process.cwd()): Promise<void> {
  for (const [file, expected] of [[item.pdfPath, item.pdfSha256], [item.coverPath, item.coverSha256]]) {
    const bytes = await readFile(path.join(root, "public", file));
    if (createHash("sha256").update(bytes).digest("hex") !== expected) throw new Error(`Prüfsumme stimmt nicht: ${file}`);
    if (bytes.length > 50*1024*1024) throw new Error(`Datei zu groß: ${file}`);
    if (file === item.pdfPath) {
      await validatePublicationPdf(bytes,item.pageNumbers.length);
    } else {
      const image = await sharp(bytes,{limitInputPixels:50_000_000}).metadata();
      if (!image.width || !image.height || !["jpeg","png","webp","avif","heif"].includes(image.format ?? "")) throw new Error(`Ungültiges Flyer-Vorschaubild: ${file}`);
      await sharp(bytes,{limitInputPixels:50_000_000}).resize(1,1).raw().toBuffer();
    }
  }
}
