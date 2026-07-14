import { readFile } from "node:fs/promises";
import path from "node:path";

import type { EditorialSource, RightsStatus } from "@/lib/editorial-schedule";

export type EditorialCampaign = Readonly<{
  id: string;
  kind: "event" | "giveaway";
  title: string;
  summary: string;
  validFrom: string;
  validTo: string;
  image: string;
  href: string;
  source: EditorialSource;
  sourceUrl: string;
  rightsStatus: RightsStatus;
}>;

export type EditorialReviewItem = Readonly<{
  id: string;
  title: string;
  observedAt: string;
  source: "canva" | "instagram";
  sourceUrl: string;
  assetName: string;
  rightsStatus: "review-required";
}>;

export type EditorialArchiveItem = Readonly<{
  id: string;
  title: string;
  date: string;
  image: string;
  kind: "event" | "giveaway";
  rightsStatus: "official" | "approved";
}>;

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain object`);
  }
  return value as Record<string, unknown>;
}

function stringField(value: Record<string, unknown>, field: string): string {
  const result = value[field];
  if (typeof result !== "string" || result.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return result;
}

const editorialSources = new Set<EditorialSource>([
  "trinkgut-official",
  "canva",
  "instagram",
  "local",
]);

const publishableRights = new Set<RightsStatus>(["official", "approved"]);

export function parseCampaigns(value: unknown): readonly EditorialCampaign[] {
  if (!Array.isArray(value)) throw new TypeError("campaigns must be an array");
  return value.map((entry, index) => {
    const item = record(entry, `campaigns[${index}]`);
    const validFrom = stringField(item, "validFrom");
    const validTo = stringField(item, "validTo");
    if (validFrom > validTo) throw new TypeError("validFrom must not exceed validTo");
    const kind = stringField(item, "kind");
    if (kind !== "event" && kind !== "giveaway") throw new TypeError("invalid kind");
    const source = stringField(item, "source") as EditorialSource;
    const rightsStatus = stringField(item, "rightsStatus") as RightsStatus;
    if (!editorialSources.has(source)) throw new TypeError("invalid source");
    if (!publishableRights.has(rightsStatus)) throw new TypeError("invalid rightsStatus");
    return {
      id: stringField(item, "id"),
      kind,
      title: stringField(item, "title"),
      summary: stringField(item, "summary"),
      validFrom,
      validTo,
      image: stringField(item, "image"),
      href: stringField(item, "href"),
      source,
      sourceUrl: stringField(item, "sourceUrl"),
      rightsStatus,
    };
  });
}

export function parseArchive(value: unknown): readonly EditorialArchiveItem[] {
  if (!Array.isArray(value)) throw new TypeError("archive must be an array");
  return value.map((entry, index) => {
    const item = record(entry, `archive[${index}]`);
    const kind = stringField(item, "kind");
    const rightsStatus = stringField(item, "rightsStatus");
    if (kind !== "event" && kind !== "giveaway") throw new TypeError("invalid kind");
    if (rightsStatus !== "official" && rightsStatus !== "approved") {
      throw new TypeError("archive rightsStatus must be official or approved");
    }
    return {
      id: stringField(item, "id"),
      title: stringField(item, "title"),
      date: stringField(item, "date"),
      image: stringField(item, "image"),
      kind,
      rightsStatus,
    };
  });
}

export function parseReviewQueue(value: unknown): readonly EditorialReviewItem[] {
  if (!Array.isArray(value)) throw new TypeError("review queue must be an array");
  return value.map((entry, index) => {
    const item = record(entry, `reviewQueue[${index}]`);
    if (item.rightsStatus !== "review-required") {
      throw new TypeError("review queue rightsStatus must be review-required");
    }
    const source = stringField(item, "source");
    if (source !== "canva" && source !== "instagram") {
      throw new TypeError("review queue source must be canva or instagram");
    }
    return {
      id: stringField(item, "id"),
      title: stringField(item, "title"),
      observedAt: stringField(item, "observedAt"),
      source,
      sourceUrl: stringField(item, "sourceUrl"),
      assetName: stringField(item, "assetName"),
      rightsStatus: "review-required",
    };
  });
}

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await readFile(path.join(process.cwd(), file), "utf8"));
}

export async function loadApprovedCampaigns() {
  return parseCampaigns(await readJson("data/editorial/campaigns.json"));
}

export async function loadReviewQueue() {
  return parseReviewQueue(await readJson("data/editorial/review-queue.json"));
}

export async function loadEditorialArchive(): Promise<readonly EditorialArchiveItem[]> {
  return parseArchive(await readJson("data/editorial/archive.json"));
}
