import { readdir } from "node:fs/promises";
import path from "node:path";
import { berlinDateKey } from "./editorial-schedule";
import { assertWeeklyPublicationIdle } from "./weekly-publication-idle";
import { assertPublicationKeys, countPublicationEditionIds, parsePublicationEdition, publicationRecord, readPublicationJson, verifyPublicationEdition } from "./publication-integrity";
import type { PublicationEdition, VerifiedPublicationEdition } from "./weekly-publication-types";

export type SupplementalPublication = Readonly<{ schemaVersion: 1; edition: PublicationEdition }>;
export type SupplementalPublicationIssue = Readonly<{
  register: "supplemental"; editionId?: string; validFrom?: string; validTo?: string; code: string;
}>;
export type LoadedSupplementalPublications = Readonly<{
  editions: readonly VerifiedPublicationEdition[]; issues: readonly SupplementalPublicationIssue[];
}>;

export function parseSupplementalPublication(value: unknown): SupplementalPublication {
  const item = publicationRecord(value, "supplemental publication");
  assertPublicationKeys(item, ["schemaVersion", "edition"], "supplemental publication");
  if (item.schemaVersion !== 1) throw new TypeError("Invalid supplemental publication version");
  return { schemaVersion: 1, edition: parsePublicationEdition(item.edition, undefined, 2) };
}

async function load(root: string): Promise<LoadedSupplementalPublications> {
  const editions: VerifiedPublicationEdition[] = [];
  const issues: SupplementalPublicationIssue[] = [];
  let files;
  try { files = await readdir(path.join(root, "data/editorial/supplemental-publications"), { withFileTypes: true }); }
  catch (error) {
    return { editions, issues: (error as NodeJS.ErrnoException).code === "ENOENT" ? [] : [{ register: "supplemental", code: "register-invalid" }] };
  }
  const globalIds = await countPublicationEditionIds(root);
  for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
    let edition: PublicationEdition | undefined;
    try {
      if (!file.isFile() || !/^[a-z0-9][a-z0-9-]{0,149}\.json$/.test(file.name)) throw new Error("Invalid supplemental manifest filename");
      edition = parseSupplementalPublication(await readPublicationJson(root, `data/editorial/supplemental-publications/${file.name}`)).edition;
      if (file.name !== `${edition.id}.json` || globalIds.get(edition.id) !== 1) throw new Error("Duplicate or mismatching edition ID");
      editions.push(await verifyPublicationEdition(edition, root));
    } catch {
      issues.push({ register: "supplemental", ...(edition ? { editionId: edition.id, validFrom: edition.validFrom, validTo: edition.validTo } : {}), code: "edition-invalid" });
    }
  }
  return { editions, issues };
}

const production = new Map<string, Promise<LoadedSupplementalPublications>>();
const interrupted = (): LoadedSupplementalPublications => ({ editions: [], issues: [{ register: "supplemental", code: "preparation-incomplete" }] });
export async function loadSupplementalPublications(root = process.cwd()): Promise<LoadedSupplementalPublications> {
  root = path.resolve(root);
  try { await assertWeeklyPublicationIdle(root); } catch { return interrupted(); }
  let result: Promise<LoadedSupplementalPublications>;
  if (process.env.NODE_ENV !== "production") result = load(root);
  else { result = production.get(root) ?? load(root); production.set(root, result); }
  const loaded = await result;
  try { await assertWeeklyPublicationIdle(root); } catch { return interrupted(); }
  return loaded;
}

/** Printed validity is independent of weekly manifests; selection is never cached. */
export function selectSupplementalEditions(loaded: LoadedSupplementalPublications, now: Date): readonly VerifiedPublicationEdition[] {
  const today = berlinDateKey(now);
  return loaded.editions.filter(({ edition }) => edition.validFrom <= today && today <= edition.validTo)
    .toSorted((a, b) => b.edition.validFrom.localeCompare(a.edition.validFrom) || a.edition.id.localeCompare(b.edition.id));
}
