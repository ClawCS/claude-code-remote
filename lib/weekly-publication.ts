import { readdir } from "node:fs/promises";
import path from "node:path";
import { berlinDateKey, getCurrentWeekRange, getPublicationWeekRange } from "./editorial-schedule";
import type { LoadedWeeklyPublications, ParsedWeeklyEdition, ParsedWeeklyPublication, VerifiedWeeklyEdition, WeeklyEdition, WeeklyPublicationIssue } from "./weekly-publication-types";
import { assertWeeklyPublicationIdle } from "./weekly-publication-idle";
import { parsePublicationEdition, verifyPublicationEdition, publicationRecord as record, assertPublicationKeys as keys, publicationWeekRange as weekRange, readPublicationJson as json, countPublicationEditionIds } from "./publication-integrity";

export function parseWeeklyEdition(value: unknown, week: string, schemaVersion?: 1 | 2): ParsedWeeklyEdition {
  return parsePublicationEdition(value, week, schemaVersion);
}

export async function verifyWeeklyEdition(edition: WeeklyEdition, root: string): Promise<VerifiedWeeklyEdition> {
  return verifyPublicationEdition(parseWeeklyEdition(edition, edition.validFrom), root);
}

function header(value: unknown, expectedWeek?: string) {
  const item = record(value, "weekly publication");
  keys(item, ["schemaVersion", "week", "editions"], "weekly publication");
  weekRange(item.week);
  if (![1, 2].includes(item.schemaVersion as number) || (expectedWeek && item.week !== expectedWeek) || !Array.isArray(item.editions)) throw new TypeError("Invalid weekly publication header");
  return item as { schemaVersion: 1 | 2; week: string; editions: unknown[] };
}
export function parseWeeklyPublication(value: unknown): ParsedWeeklyPublication {
  const item = header(value);
  const editions = item.editions.map(edition => parseWeeklyEdition(edition, item.week, item.schemaVersion));
  if (new Set(editions.map(edition => edition.id)).size !== editions.length
    || new Set(editions.map(edition => edition.language)).size !== editions.length) throw new TypeError("Duplicate weekly edition");
  return { schemaVersion: item.schemaVersion, week: item.week, editions };
}

async function load(root: string): Promise<LoadedWeeklyPublications> {
  const editions: VerifiedWeeklyEdition[] = [];
  const globalIds = await countPublicationEditionIds(root);
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
        candidates.push(parseWeeklyEdition(raw, item.week, item.schemaVersion));
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
        if (counts.get(edition.language) !== 1 || ids.get(edition.id) !== 1 || globalIds.get(edition.id) !== 1) throw new Error("Duplicate edition");
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

/** Fully verified weekly originals may be previewed on Sunday; offer validity stays separate. */
export function selectVisibleWeeklyEditions(loaded: LoadedWeeklyPublications, now: Date): readonly VerifiedWeeklyEdition[] {
  const today = berlinDateKey(now);
  const week = getPublicationWeekRange(now).validFrom;
  return loaded.editions.filter(({ edition }) => edition.validFrom === week && today <= edition.validTo)
    .toSorted((a, b) => a.edition.language.localeCompare(b.edition.language));
}
