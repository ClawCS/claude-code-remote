# Hybrid Content Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a date-safe hybrid content pipeline that publishes valid official trinkgut leaflets and events automatically, keeps Canva and Instagram read-only, and exposes one typed homepage interface without ever presenting expired content as current.

**Architecture:** Pure Europe/Berlin schedule and approval functions sit below a local editorial repository and the existing official leaflet fetcher. Runtime aggregation reads only validated cache/editorial data; network refreshes happen behind authenticated cron endpoints. A recurring Codex automation performs the read-only Canva/Instagram/official-source review, updates versioned metadata, runs verification, and pushes only when all gates pass.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript, Vitest, Playwright, Node filesystem APIs, official trinkgut Blaetterkatalog, Codex recurring automation.

**Execution prerequisite:** Run Cinematic Homepage Task 1 first. It owns `package.json`, `package-lock.json`, `vitest.config.ts`, and `playwright.config.ts` and establishes the `npm test` / `npm run test:e2e` commands used below. Hybrid work starts only after that task's review is clean.

## Global Constraints

- All date decisions use `Europe/Berlin`; date-only validity intervals are inclusive through `validTo` and expire at the next Berlin midnight.
- Source priority is official trinkgut leaflet, official trinkgut event, approved local metadata, Canva read-only review, then Instagram publication evidence.
- Canva and Instagram are never mutated by application code or automation.
- A customer/person image with `rightsStatus: "review-required"` can never become active.
- A giveaway with missing `validFrom`, `validTo`, or `sourceUrl` can never become active.
- Source failure never extends a validity interval.
- The current homepage interface is `@/lib/homepage-content` exporting `getHomepageContent(now?: Date): Promise<HomepageContent>`.
- The public branch must contain no Premium-Light implementation or evidence.
- Every behavior change follows red-green-refactor and ends in its own commit.

---

## File Structure

- `lib/editorial-schedule.ts` — pure Berlin date keys, target publication week, derived statuses, approval gates.
- `lib/editorial-repository.ts` — schema validation and loading for versioned campaign/review JSON.
- `lib/handzettel-catalog.ts` — official catalog parsing, URL construction, plausibility checks.
- `lib/homepage-content.ts` — sole typed aggregation interface consumed by the homepage.
- `data/editorial/campaigns.json` — approved official/local campaigns with explicit dates and rights.
- `data/editorial/review-queue.json` — Canva/Instagram observations awaiting a human gate.
- `data/editorial/archive.json` — approved dated retrospective items.
- `app/api/handzettel/fetch/route.ts` — authenticated refresh and cache response using extracted catalog functions.
- `app/api/handzettel/cron/route.ts` — cron orchestration and truthful result codes.
- `app/api/content/current/route.ts` — read-only JSON form of the homepage aggregation.
- `docs/CONTENT-UPDATE-RUNBOOK.md` — source order, approval checklist, failure recovery, automation behavior.
- `lib/__tests__/editorial-schedule.test.ts` — date and rights boundary contracts.
- `lib/__tests__/editorial-repository.test.ts` — invalid metadata rejection.
- `lib/__tests__/handzettel-catalog.test.ts` — parser and plausibility contracts.
- `lib/__tests__/homepage-content.test.ts` — current/fallback/archive aggregation contracts.
- `lib/__tests__/handzettel-route.test.ts` — authenticated refresh and failure semantics.

### Task 1: Berlin Schedule and Publication Gate

**Files:**
- Create: `lib/editorial-schedule.ts`
- Create: `lib/__tests__/editorial-schedule.test.ts`

**Interfaces:**
- Produces: `EditorialStatus`, `TemporalEditorialStatus`, `RightsStatus`, `ScheduledEditorial`, `berlinDateKey(now)`, `getPublicationWeekRange(now)`, `deriveEditorialStatus(item, now)`, `isEditorialPublishable(item, now)`.
- Consumes: no project runtime state.

- [ ] **Step 1: Write the failing boundary and rights tests**

```ts
import { describe, expect, it } from "vitest";

import {
  berlinDateKey,
  deriveEditorialStatus,
  getPublicationWeekRange,
  isEditorialPublishable,
  type ScheduledEditorial,
} from "@/lib/editorial-schedule";

const approved: ScheduledEditorial = {
  id: "strikerball-2026-07-24",
  source: "trinkgut-official",
  sourceUrl: "https://www.trinkgut.de/strikerball",
  validFrom: "2026-07-24",
  validTo: "2026-07-24",
  rightsStatus: "official",
};

describe("editorial schedule", () => {
  it("uses the Berlin calendar around UTC midnight", () => {
    expect(berlinDateKey(new Date("2026-07-23T22:30:00.000Z"))).toBe("2026-07-24");
  });

  it("keeps an item active through its validTo date", () => {
    expect(deriveEditorialStatus(approved, new Date("2026-07-24T21:59:59.000Z"))).toBe("active");
  });

  it("expires it at the next Berlin midnight", () => {
    expect(deriveEditorialStatus(approved, new Date("2026-07-24T22:00:00.000Z"))).toBe("expired");
  });

  it("never publishes review-required people imagery", () => {
    expect(
      isEditorialPublishable(
        { ...approved, rightsStatus: "review-required" },
        new Date("2026-07-24T12:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("keeps the current target week before the Sunday preload boundary", () => {
    expect(getPublicationWeekRange(new Date("2026-07-19T13:59:59.000Z"))).toEqual({
      validFrom: "2026-07-13",
      validTo: "2026-07-18",
    });
  });

  it("targets the following week from Sunday 16:00 Berlin", () => {
    expect(getPublicationWeekRange(new Date("2026-07-19T14:00:00.000Z"))).toEqual({
      validFrom: "2026-07-20",
      validTo: "2026-07-25",
    });
  });

  it("crosses the publication-year boundary correctly", () => {
    expect(getPublicationWeekRange(new Date("2027-01-03T15:00:00.000Z"))).toEqual({
      validFrom: "2027-01-04",
      validTo: "2027-01-09",
    });
  });

  it("uses the Berlin 16:00 boundary after the DST change", () => {
    expect(getPublicationWeekRange(new Date("2026-03-29T14:00:00.000Z"))).toEqual({
      validFrom: "2026-03-30",
      validTo: "2026-04-04",
    });
  });
});
```

- [ ] **Step 2: Run the test and confirm the missing-module failure**

Run: `npm test -- lib/__tests__/editorial-schedule.test.ts`

Expected: FAIL with `Failed to resolve import "@/lib/editorial-schedule"`.

- [ ] **Step 3: Implement the pure schedule contract**

```ts
export const EDITORIAL_TIME_ZONE = "Europe/Berlin" as const;

export type EditorialSource =
  | "trinkgut-official"
  | "canva"
  | "instagram"
  | "local";

export type EditorialStatus = "draft" | "scheduled" | "active" | "expired" | "archived";
export type TemporalEditorialStatus = Exclude<EditorialStatus, "draft">;
export type RightsStatus = "official" | "approved" | "review-required" | "rejected";

export type ScheduledEditorial = Readonly<{
  id: string;
  source: EditorialSource;
  sourceUrl: string;
  validFrom: string;
  validTo: string;
  rightsStatus: RightsStatus;
  archived?: boolean;
}>;

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EDITORIAL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function berlinDateKey(now = new Date()): string {
  return dateKeyFormatter.format(now);
}

export function deriveEditorialStatus(
  item: ScheduledEditorial,
  now = new Date(),
): TemporalEditorialStatus {
  if (item.archived) return "archived";
  const today = berlinDateKey(now);
  if (today < item.validFrom) return "scheduled";
  if (today > item.validTo) return "expired";
  return "active";
}

function addCalendarDays(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function berlinWeekdayAndTime(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EDITORIAL_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function getPublicationWeekRange(now = new Date()) {
  const today = berlinDateKey(now);
  const day = new Date(`${today}T12:00:00.000Z`).getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  let validFrom = addCalendarDays(today, -daysSinceMonday);
  const clock = berlinWeekdayAndTime(now);
  const minutes = Number(clock.hour) * 60 + Number(clock.minute);
  if (clock.weekday === "Sun" && minutes >= 16 * 60) {
    validFrom = addCalendarDays(validFrom, 7);
  }
  return { validFrom, validTo: addCalendarDays(validFrom, 5) } as const;
}

export function isEditorialPublishable(
  item: ScheduledEditorial,
  now = new Date(),
): boolean {
  if (item.rightsStatus !== "official" && item.rightsStatus !== "approved") return false;
  if (!/^https:\/\//.test(item.sourceUrl)) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.validFrom)) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.validTo)) return false;
  if (item.validFrom > item.validTo) return false;
  return deriveEditorialStatus(item, now) === "active";
}
```

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- lib/__tests__/editorial-schedule.test.ts`

Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/editorial-schedule.ts lib/__tests__/editorial-schedule.test.ts
git commit -m "feat: add Berlin editorial schedule gate"
```

### Task 2: Versioned Editorial Repository

**Files:**
- Create: `lib/editorial-repository.ts`
- Create: `lib/__tests__/editorial-repository.test.ts`
- Create: `data/editorial/campaigns.json`
- Create: `data/editorial/review-queue.json`
- Create: `data/editorial/archive.json`

**Interfaces:**
- Consumes: `ScheduledEditorial` from `lib/editorial-schedule.ts`.
- Produces: `EditorialCampaign`, `EditorialArchiveItem`, `parseCampaigns()`, `parseReviewQueue()`, `parseArchive()`, `loadApprovedCampaigns()`, `loadReviewQueue()`, `loadEditorialArchive()`.

- [ ] **Step 1: Write failing validation tests**

```ts
import { describe, expect, it } from "vitest";

import {
  parseArchive,
  parseCampaigns,
  parseReviewQueue,
} from "@/lib/editorial-repository";

describe("editorial repository", () => {
  it("rejects a giveaway without an end date", () => {
    expect(() =>
      parseCampaigns([
        {
          id: "unsafe",
          kind: "giveaway",
          title: "Gewinnspiel",
          summary: "Nicht freigeben",
          validFrom: "2026-07-01",
          validTo: "",
          image: "/images/gewinnspiele/juli.png",
          href: "/gewinnspiel",
          source: "canva",
          sourceUrl: "https://www.canva.com/design/example",
          rightsStatus: "approved",
        },
      ]),
    ).toThrow(/validTo/);
  });

  it("keeps Canva people observations in the review queue", () => {
    const [item] = parseReviewQueue([
      {
        id: "team-2025-02-20",
        title: "Teamfoto im Markt",
        observedAt: "2026-07-14",
        source: "canva",
        sourceUrl: "https://www.canva.com/folder/uploads",
        assetName: "WhatsApp Image 2025-02-20 at 12.55.39 PM-10.jpg",
        rightsStatus: "review-required",
      },
    ]);
    expect(item.rightsStatus).toBe("review-required");
  });

  it("rejects an archive record without an approved rights state", () => {
    expect(() =>
      parseArchive([
        {
          id: "winner-2026-01",
          title: "Gewinnspiel-Rückblick",
          date: "2026-01-15",
          image: "/images/gewinnspiele/winner.png",
          kind: "giveaway",
          rightsStatus: "review-required",
        },
      ]),
    ).toThrow(/rightsStatus/);
  });
});
```

- [ ] **Step 2: Run the tests and confirm the missing-module failure**

Run: `npm test -- lib/__tests__/editorial-repository.test.ts`

Expected: FAIL because `@/lib/editorial-repository` does not exist.

- [ ] **Step 3: Implement strict repository parsers**

Implement `parseCampaigns`, `parseReviewQueue`, and filesystem loaders. The campaign parser must require non-empty strings for `id`, `title`, `summary`, `validFrom`, `validTo`, `image`, `href`, `sourceUrl`; accept only `event | giveaway`; and reject `validFrom > validTo`. The review parser must require `rightsStatus === "review-required"` until a reviewed item is explicitly moved to `campaigns.json` or `archive.json`.

```ts
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
    if (item.rightsStatus !== "review-required") throw new TypeError("review queue rightsStatus must be review-required");
    const source = stringField(item, "source");
    if (source !== "canva" && source !== "instagram") throw new TypeError("review queue source must be canva or instagram");
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
```

- [ ] **Step 4: Seed only verified content**

`data/editorial/campaigns.json`:

```json
[
  {
    "id": "strikerball-2026-07-24",
    "kind": "event",
    "title": "Striker Ball Challenge",
    "summary": "Dein Schuss. Dein Gewinn. Am 24. Juli bei Trinkgut Jammers.",
    "validFrom": "2026-07-14",
    "validTo": "2026-07-24",
    "image": "/images/events/strikerball.png",
    "href": "https://www.trinkgut.de/strikerball",
    "source": "trinkgut-official",
    "sourceUrl": "https://www.trinkgut.de/strikerball",
    "rightsStatus": "official"
  }
]
```

`data/editorial/review-queue.json`:

```json
[
  {
    "id": "market-weinberatung-2024-12-14",
    "title": "Persönliche Weinberatung im Markt",
    "observedAt": "2026-07-14",
    "source": "canva",
    "sourceUrl": "https://www.canva.com/folder/uploads",
    "assetName": "D9175606-F3FB-4C4F-8CD2-EEBDD88AC3CA/L0/001-14.12.2024, 12:50:18.jpg",
    "rightsStatus": "review-required"
  },
  {
    "id": "teamfoto-2025-02-20",
    "title": "Teamfoto im Markt",
    "observedAt": "2026-07-14",
    "source": "canva",
    "sourceUrl": "https://www.canva.com/folder/uploads",
    "assetName": "WhatsApp Image 2025-02-20 at 12.55.39 PM-10.jpg",
    "rightsStatus": "review-required"
  },
  {
    "id": "team-aktion-2025-03-10",
    "title": "Teamaktion mit Kisten und Wagen",
    "observedAt": "2026-07-14",
    "source": "canva",
    "sourceUrl": "https://www.canva.com/folder/uploads",
    "assetName": "WhatsApp Image 2025-03-10 at 12.17.13 PM (1).jpg",
    "rightsStatus": "review-required"
  },
  {
    "id": "eigenmarken-display-2025-03-12",
    "title": "Eigenmarken-Präsentation im Markt",
    "observedAt": "2026-07-14",
    "source": "canva",
    "sourceUrl": "https://www.canva.com/folder/uploads",
    "assetName": "WhatsApp Image 2025-03-12 at 2.37.24 PM.jpg",
    "rightsStatus": "review-required"
  },
  {
    "id": "markt-mitarbeiter-2025-01-14",
    "title": "Mitarbeiter im Markt",
    "observedAt": "2026-07-14",
    "source": "canva",
    "sourceUrl": "https://www.canva.com/folder/uploads",
    "assetName": "06656E54-D47D-4AB6-957C-00C0B4A89596/L0/001-14.1.2025, 13:54:54.jpg",
    "rightsStatus": "review-required"
  }
]
```

`data/editorial/archive.json`:

```json
[]
```

No unverified winner or giveaway claim is seeded.

- [ ] **Step 5: Run the repository tests**

Run: `npm test -- lib/__tests__/editorial-repository.test.ts`

Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/editorial-repository.ts lib/__tests__/editorial-repository.test.ts data/editorial
git commit -m "feat: add gated editorial repository"
```

### Task 3: Extract and Validate the Official Leaflet Catalog

**Files:**
- Create: `lib/handzettel-catalog.ts`
- Create: `lib/__tests__/handzettel-catalog.test.ts`
- Modify: `app/api/handzettel/fetch/route.ts`

**Interfaces:**
- Produces: `HandzettelPage`, `HandzettelCache`, `extractCatalogInfo`, `extractCatalogManifest`, `validateCatalog`, `fetchOfficialCatalog(now, fetchImpl?)`.
- Consumes: official store ID `13027`, Werbekreis `3.6`.

**Verified source contract (live audit 2026-07-14):** The `newest` viewer may return `200` without redirect. Its HTML exposes one coherent `catalogId`, `catalogVersion`, `catalogGroupId`, catalog title, and expiry meta value. The authoritative page manifest is `/frontend/mvc/api/catalogs/{catalogId}/v{version}/xml/catalog.xml`; for catalog `1335913` / version `2` it reports `name="KW29 2747 RHEINRUHR"` and `nofpages="10"`. Valid page assets use `/frontend/mvc/api/catalogs/{catalogId}/v{version}/normal/bk_{page}.jpg` and `/thumbnails/bk_{page}.jpg`. The legacy `/pages/{page}/normal`, `/zoom/0`, and single-page PDF HEAD probes are not valid proof and must not be used.

- [ ] **Step 1: Write failing parser and plausibility tests**

```ts
import { describe, expect, it } from "vitest";

import {
  extractCatalogInfo,
  validateCatalog,
} from "@/lib/handzettel-catalog";
import { getPublicationWeekRange } from "@/lib/editorial-schedule";

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
    expect(getPublicationWeekRange(new Date("2026-07-14T10:00:00.000Z"))).toEqual({
      validFrom: "2026-07-13",
      validTo: "2026-07-18",
    });
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
        { validFrom: "2026-07-13", validTo: "2026-07-18" },
      ),
    ).toThrow(/catalogId/);
  });
});
```

Before implementation, extend this RED suite with deterministic viewer-HTML and catalog-XML fixtures copied down to the verified fields only. The suite must prove: coherent `catalogId`/version/group/title/expiry extraction; exactly ten pages from `nofpages` and mapping coverage; exact MVC-API normal/thumbnail URL generation; rejection of wrong group, KW, expiry, XML name, mapping, status, or content type; and ISO week-year correctness around December/January. Each injected fetch response must be asserted so an unplanned URL or network call fails the test.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- lib/__tests__/handzettel-catalog.test.ts`

Expected: FAIL because the module is absent.

- [ ] **Step 3: Move pure catalog logic and remove the 24-page guess**

Create `lib/handzettel-catalog.ts` from the existing route functions. Import `getPublicationWeekRange` from Task 1; do not duplicate calendar math. Remove every guessed/default ID, version, validity value, and page count. `extractCatalogInfo` must accept either an exact `/frontend/catalogs/{id}/{version}/` path or one coherent viewer field set and must never default the version to `1`. `extractCatalogManifest` must parse the authoritative XML `name`, `nofpages`, normal/thumbnails detail levels, and mapping coverage. It must return no catalog when the XML is malformed, the mapping does not cover exactly `1..nofpages`, or required detail levels are absent.

`validateCatalog` must require the exact store ID and Werbekreis, `status: "ok"`, target validity range, numeric catalog ID/version, correct ISO week and ISO week-year, a valid `fetchedAt`, 1–60 pages, matching page array length, exact `werbung.trinkgut.de` HTTPS hosts, URLs whose embedded catalog ID/version/page numbers match the object, and consecutive page numbers. It must reject source metadata whose `catalogGroupId`, title KW, expiry date, XML name, or page manifest does not prove the expected Berlin publication range.

```ts
export const HANDZETTEL_STORE_ID = "13027" as const;
export const HANDZETTEL_WERBEKREIS = "3.6" as const;

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
  viewerUrl: string;
  pdfUrl: string;
  pageCount: number;
  pages: readonly HandzettelPage[];
  status: "ok" | "fallback";
}>;

export function validateCatalog(
  value: HandzettelCache,
  expectedRange: Readonly<{ validFrom: string; validTo: string }>,
): void {
  if (value.status !== "ok") throw new TypeError("invalid status");
  if (!/^\d{5,8}$/.test(value.catalogId)) throw new TypeError("invalid catalogId");
  if (!/^\d{1,2}$/.test(value.catalogVersion)) throw new TypeError("invalid catalogVersion");
  if (value.storeId !== HANDZETTEL_STORE_ID) throw new TypeError("invalid storeId");
  if (value.werbekreis !== HANDZETTEL_WERBEKREIS) throw new TypeError("invalid werbekreis");
  if (value.validFrom !== expectedRange.validFrom || value.validTo !== expectedRange.validTo) {
    throw new TypeError("invalid validity range");
  }
  if (!Number.isInteger(value.kw) || !Number.isInteger(value.year)) throw new TypeError("invalid week identity");
  if (Number.isNaN(Date.parse(value.fetchedAt))) throw new TypeError("invalid fetchedAt");
  if (value.viewerUrl !== "https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest") throw new TypeError("invalid viewerUrl");
  if (!Number.isInteger(value.pageCount) || value.pageCount < 1 || value.pageCount > 60) throw new TypeError("invalid pageCount");
  if (value.pages.length !== value.pageCount) throw new TypeError("page count mismatch");
  const expectedPdfUrl = `https://werbung.trinkgut.de/frontend/catalogs/${value.catalogId}/${value.catalogVersion}/pdf/complete.pdf`;
  if (value.pdfUrl !== expectedPdfUrl) throw new TypeError("invalid pdfUrl");
  for (const page of value.pages) {
    const assetBase = `https://werbung.trinkgut.de/frontend/mvc/api/catalogs/${value.catalogId}/v${value.catalogVersion}`;
    if (page.imageUrl !== `${assetBase}/normal/bk_${page.number}.jpg`) throw new TypeError("invalid page imageUrl");
    if (page.thumbnailUrl !== `${assetBase}/thumbnails/bk_${page.number}.jpg`) throw new TypeError("invalid thumbnailUrl");
  }
  const expectedNumbers = Array.from({ length: value.pageCount }, (_, index) => index + 1);
  if (value.pages.some((page, index) => page.number !== expectedNumbers[index])) {
    throw new TypeError("page numbers must be consecutive");
  }
}

export async function fetchOfficialCatalog(
  now = new Date(),
  fetchImpl: typeof fetch = fetch,
): Promise<HandzettelCache>;
```

`fetchOfficialCatalog(now, fetchImpl)` must call `getPublicationWeekRange(now)`, fetch the viewer, require coherent viewer metadata for group `13027`, verify the expected KW and expiry, fetch and parse the authoritative XML manifest, then build the exact MVC-API normal/thumbnail URLs. It must prove every generated page with an injected GET/HEAD response whose status is successful and whose content type is `image/jpeg`; the complete PDF must likewise prove a successful `application/pdf` response. Build page records only after these checks, call `validateCatalog(result, targetRange)`, and return `status: "ok"`. It must throw on every source or validation failure. The injected `fetchImpl` is mandatory in tests so viewer HTML, XML, asset proofs, PDF proofs, and failures require no live network. Do not use canary/legacy URL patterns or individual-page PDF HEAD probes.

- [ ] **Step 4: Reduce the route to cache/auth orchestration**

`app/api/handzettel/fetch/route.ts` imports `fetchOfficialCatalog`, `validateCatalog`, and `HandzettelCache`. Keep the timing-safe bearer guard. Public `GET` without `refresh=true` is strictly read-only: it may parse and fully validate the cache for the target range but must never call the official network or write the filesystem. A missing, malformed, invalid, or non-current cache yields a truthful, non-persisted fallback response with `pageCount: 0`, `pages: []`, and `status: "fallback"`.

Only an authenticated `GET ?refresh=true` or authenticated `POST` may call `fetchOfficialCatalog`. A successful refresh writes only a validated `status: "ok"` cache, atomically via same-directory temporary file and rename. A failed refresh must return `502`, must not overwrite the cache, and must never report a stale/current cache as a successful refresh. The public read path may continue to serve an independently validated current cache after a failed refresh. Every response carries `Cache-Control: no-store` so an expired offer cannot remain publicly stale after the next Berlin midnight.

- [ ] **Step 5: Run focused and route type checks**

Run: `npm test -- lib/__tests__/handzettel-catalog.test.ts`

Expected: PASS for the three baseline tests plus fixture-driven coverage proving the real viewer/XML contract, exact ten-page MVC asset mapping, wrong group/KW/expiry/XML-name rejection, malformed or inconsistent mapping rejection, content-type/status rejection, and ISO week-year behavior.

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/handzettel-catalog.ts lib/__tests__/handzettel-catalog.test.ts app/api/handzettel/fetch/route.ts
git commit -m "refactor: validate official leaflet catalog"
```

### Task 4: Homepage Content Aggregator

**Files:**
- Create: `lib/homepage-content.ts`
- Create: `lib/__tests__/homepage-content.test.ts`
- Create: `app/api/content/current/route.ts`

**Interfaces:**
- Produces: `HomepageContent`, `HomepageFlyer`, `HomepageEvent`, `HomepageArchiveItem`, `getHomepageContent(now?: Date): Promise<HomepageContent>`.
- Consumes: Task 3 `loadValidatedHandzettelCache(now)`, approved campaigns/archive loaders, schedule gate.

**Integration contract:** The cache file is ignored and may not exist on first start. Never cast JSON directly to a flyer/cache type and never persist or consume a fallback as a catalog. Map a validated `HandzettelCache` through one explicit adapter; its cover is exactly `cache.pages[0].imageUrl`, not a reconstructed or thumbnail URL. Load failures are isolated per source so a missing/bad flyer yields no flyer, bad campaigns yield no event, and bad archive yields an empty archive without taking down otherwise valid homepage content.

- [ ] **Step 1: Write failing aggregation tests**

```ts
import { describe, expect, it } from "vitest";

import { aggregateHomepageContent } from "@/lib/homepage-content";

describe("homepage content", () => {
  it("returns the current flyer and official event", () => {
    const content = aggregateHomepageContent({
      now: new Date("2026-07-14T12:00:00.000Z"),
      flyer: {
        id: "catalog-13027-29-2026",
        title: "Angebote der Woche",
        validFrom: "2026-07-13",
        validTo: "2026-07-18",
        viewerUrl: "https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest",
        pdfUrl: "https://werbung.trinkgut.de/frontend/catalogs/1234567/1/pdf/complete.pdf",
        pageCount: 8,
        coverUrl: "https://werbung.trinkgut.de/frontend/mvc/api/catalogs/1234567/v1/normal/bk_1.jpg",
        sourceUrl: "https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest"
      },
      campaigns: [{
        id: "strikerball-2026-07-24",
        kind: "event",
        title: "Striker Ball Challenge",
        summary: "Am 24. Juli bei Jammers.",
        validFrom: "2026-07-14",
        validTo: "2026-07-24",
        image: "/images/events/strikerball.png",
        href: "https://www.trinkgut.de/strikerball",
        source: "trinkgut-official",
        sourceUrl: "https://www.trinkgut.de/strikerball",
        rightsStatus: "official"
      }],
      archive: [],
    });
    expect(content.flyer?.validTo).toBe("2026-07-18");
    expect(content.event?.id).toBe("strikerball-2026-07-24");
    expect(content.fallbackMessage).toBeNull();
  });

  it("drops an expired flyer instead of extending it", () => {
    const content = aggregateHomepageContent({
      now: new Date("2026-07-19T10:00:00.000Z"),
      flyer: {
        id: "expired",
        title: "Alt",
        validFrom: "2026-07-13",
        validTo: "2026-07-18",
        viewerUrl: "https://werbung.trinkgut.de/viewer",
        pdfUrl: "https://werbung.trinkgut.de/flyer.pdf",
        pageCount: 8,
        coverUrl: "https://werbung.trinkgut.de/cover",
        sourceUrl: "https://werbung.trinkgut.de/source"
      },
      campaigns: [],
      archive: [],
    });
    expect(content.flyer).toBeNull();
    expect(content.fallbackMessage).toBe("Der nächste Handzettel wird vorbereitet.");
  });

  it("never maps a giveaway into the HomepageEvent slot", () => {
    const content = aggregateHomepageContent({
      now: new Date("2026-07-14T12:00:00.000Z"),
      flyer: null,
      campaigns: [{
        id: "giveaway",
        kind: "giveaway",
        title: "Gewinnspiel",
        summary: "Nur als Giveaway behandeln",
        validFrom: "2026-07-14",
        validTo: "2026-07-20",
        image: "/images/giveaway.png",
        href: "/gewinnspiel",
        source: "local",
        sourceUrl: "https://example.test/source",
        rightsStatus: "approved",
      }],
      archive: [],
    });
    expect(content.event).toBeNull();
  });
});
```

Extend the RED suite before implementation to cover the production boundaries the three baseline examples do not prove: exact cache-to-flyer mapping with the first `normal/bk_1.jpg` cover; active-end and next-Berlin-midnight expiry; a Sunday-preloaded Monday flyer hidden until Monday; exact `generatedAt`; deterministic event ranking; scheduled/expired/review-required/giveaway exclusion; fallback text even when an event exists; invalid/future archive filtering plus deterministic four-item limit; independently rejected unsafe campaign/archive URLs; isolated loader failures; and the current-content route's `force-dynamic`/HTTP 200/`Cache-Control: no-store` contract.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- lib/__tests__/homepage-content.test.ts`

Expected: FAIL because the module is absent.

- [ ] **Step 3: Implement the exact homepage interface**

```ts
export type HomepageFlyer = Readonly<{
  id: string;
  title: string;
  validFrom: string;
  validTo: string;
  viewerUrl: string;
  pdfUrl: string;
  pageCount: number;
  coverUrl: string;
  sourceUrl: string;
}>;

export type HomepageEvent = Readonly<{
  id: string;
  title: string;
  summary: string;
  validFrom: string;
  validTo: string;
  image: string;
  href: string;
  sourceUrl: string;
}>;

export type HomepageArchiveItem = Readonly<{
  id: string;
  title: string;
  date: string;
  image: string;
  kind: "event" | "giveaway";
}>;

export type HomepageContent = Readonly<{
  generatedAt: string;
  flyer: HomepageFlyer | null;
  event: HomepageEvent | null;
  archive: readonly HomepageArchiveItem[];
  fallbackMessage: string | null;
}>;
```

Implement `aggregateHomepageContent` as a pure helper for tests and `getHomepageContent(now = new Date())` as the filesystem-backed loader. The flyer is current only when `validFrom <= berlinDateKey(now) <= validTo`. For the singular `HomepageEvent` slot, filter to `kind === "event"`, require `isEditorialPublishable`, then sort by explicit source rank (`trinkgut-official`, `local`, `canva`, `instagram`), `validFrom`, and `id`. A giveaway can only appear in the separately typed archive. Limit archive to four parser-approved items sorted newest first. Set `fallbackMessage` whenever `flyer` is null, regardless of whether an event exists.

Add an explicit validated-cache adapter that maps `id` as `catalog-{storeId}-{kw}-{year}`, title as `Angebote der Woche`, validity/viewer/PDF/page count directly from the cache, `coverUrl` from `cache.pages[0].imageUrl`, and `sourceUrl` from the exact viewer URL. Never construct a legacy page path.

Event selection order is source rank ascending (`trinkgut-official: 0`, `local: 1`, `canva: 2`, `instagram: 3`), then `validFrom` descending, then `id` ascending. Before output, `href` must be safe root-relative (not protocol-relative) or HTTPS; `image` must be a safe root-relative asset path or HTTPS. The same image gate applies to archive entries.

Archive entries additionally require a real calendar-valid `YYYY-MM-DD` whose date is not after `berlinDateKey(now)`; sort `date` descending then `id` ascending and only then limit to four. Giveaway campaigns never auto-flow into archive.

Implement the production loader through dependency-injected/testable source functions (a small factory is acceptable) while preserving the exact public `getHomepageContent(now = new Date())` signature. Settle flyer, campaigns, and archive independently; a rejection in one source must not erase successful data from another. `generatedAt` is exactly `now.toISOString()`.

- [ ] **Step 4: Add the read-only current-content route**

```ts
import { NextResponse } from "next/server";
import { getHomepageContent } from "@/lib/homepage-content";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getHomepageContent(), {
    headers: { "Cache-Control": "no-store" },
  });
}
```

- [ ] **Step 5: Run tests and TypeScript**

Run: `npm test -- lib/__tests__/homepage-content.test.ts`

Expected: PASS for the three baseline tests plus all cache-adapter, Berlin-boundary, ranking, URL-safety, archive, loader-isolation, and no-store route tests listed above.

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/homepage-content.ts lib/__tests__/homepage-content.test.ts app/api/content/current/route.ts
git commit -m "feat: expose date-safe homepage content"
```

### Task 5: Authenticated Cron Semantics

**Files:**
- Modify: `app/api/handzettel/cron/route.ts`
- Create: `lib/handzettel-cron-handler.ts`
- Create: `lib/handzettel-update-result.ts`
- Create: `lib/__tests__/handzettel-route.test.ts`
- Modify: `lib/cron-auth.ts`

**Interfaces:**
- Consumes: `CRON_SECRET`, official fetch endpoint.
- Produces: authenticated GET/POST returning `200` only for a validated catalog; `502` for source/fallback failure; `401` for bad bearer; `503` when no secret is configured.

- [ ] **Step 1: Write failing authorization and fallback tests**

Use real `Request` objects and dependency-injected `runHandzettelUpdate` rather than mocking Next internals.

```ts
import { afterEach, describe, expect, it } from "vitest";
import { isAuthorizedBearer } from "@/lib/cron-auth";
import {
  handzettelUpdateBody,
  handzettelUpdateHttpStatus,
} from "@/lib/handzettel-update-result";
import { createHandzettelCronHandler } from "@/lib/handzettel-cron-handler";

describe("cron authorization", () => {
  afterEach(() => delete process.env.CRON_SECRET);

  it("rejects a mismatched bearer", () => {
    process.env.CRON_SECRET = "correct-secret";
    expect(
      isAuthorizedBearer(
        new Request("https://example.test/api/handzettel/cron", {
          headers: { authorization: "Bearer wrong-secret" },
        }),
      ),
    ).toBe(false);
  });

  it("maps a fallback result to a truthful upstream failure", () => {
    const result = { status: "fallback" as const, pageCount: 0 };
    expect(handzettelUpdateHttpStatus(result)).toBe(502);
    expect(handzettelUpdateBody(result)).toMatchObject({
      success: false,
      status: "fallback",
    });
  });

  it("reports success only for a validated non-empty catalog", () => {
    const result = { status: "ok" as const, pageCount: 8 };
    expect(handzettelUpdateHttpStatus(result)).toBe(200);
    expect(handzettelUpdateBody(result)).toMatchObject({ success: true, status: "ok" });
  });

  it("returns 503 when the cron secret is not configured", async () => {
    const handler = createHandzettelCronHandler(async () => ({ status: "ok", pageCount: 8 }));
    const response = await handler(new Request("https://example.test/api/handzettel/cron"));
    expect(response.status).toBe(503);
  });

  it("returns 401 for a bad bearer and never calls refresh", async () => {
    process.env.CRON_SECRET = "correct-secret";
    let calls = 0;
    const handler = createHandzettelCronHandler(async () => {
      calls += 1;
      return { status: "ok", pageCount: 8 };
    });
    const response = await handler(new Request("https://example.test/api/handzettel/cron", {
      headers: { authorization: "Bearer wrong-secret" },
    }));
    expect(response.status).toBe(401);
    expect(calls).toBe(0);
  });

  it.each([
    [{ status: "ok" as const, pageCount: 8 }, 200],
    [{ status: "fallback" as const, pageCount: 0 }, 502],
  ])("maps refresh result %# to HTTP %i", async (result, expectedStatus) => {
    process.env.CRON_SECRET = "correct-secret";
    const handler = createHandzettelCronHandler(async () => result);
    const response = await handler(new Request("https://example.test/api/handzettel/cron", {
      headers: { authorization: "Bearer correct-secret" },
    }));
    expect(response.status).toBe(expectedStatus);
    expect(await response.json()).toMatchObject({
      success: expectedStatus === 200,
      status: result.status,
    });
  });
});
```

- [ ] **Step 2: Run and verify the fallback assertion fails against current behavior**

Run: `npm test -- lib/__tests__/handzettel-route.test.ts`

Expected: FAIL because the current cron reports fallback payloads as success.

- [ ] **Step 3: Implement truthful result mapping**

Create the dependency-free result mapper and handler factory, then export one factory-created function as both `GET` and `POST` from the route. Preserve timing-safe bearer comparison.

```ts
export type HandzettelUpdateResult = Readonly<{
  status: "ok" | "fallback";
  pageCount: number;
}>;

export function handzettelUpdateHttpStatus(data: HandzettelUpdateResult): 200 | 502 {
  return data.status === "ok" && data.pageCount > 0 ? 200 : 502;
}

export function handzettelUpdateBody(data: HandzettelUpdateResult) {
  const success = handzettelUpdateHttpStatus(data) === 200;
  return { success, status: data.status, pageCount: data.pageCount } as const;
}
```

```ts
import { isAuthorizedBearer } from "@/lib/cron-auth";
import {
  handzettelUpdateBody,
  handzettelUpdateHttpStatus,
  type HandzettelUpdateResult,
} from "@/lib/handzettel-update-result";

export function createHandzettelCronHandler(
  refresh: () => Promise<HandzettelUpdateResult>,
) {
  return async function handler(request: Request): Promise<Response> {
    if (!process.env.CRON_SECRET) {
      return Response.json({ success: false, error: "Cron is not configured" }, { status: 503 });
    }
    if (!isAuthorizedBearer(request)) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const data = await refresh();
    return Response.json(handzettelUpdateBody(data), {
      status: handzettelUpdateHttpStatus(data),
      headers: { "Cache-Control": "no-store" },
    });
  };
}
```

The route's injected production refresh calls the internal leaflet refresh directly; it must not fetch its own public URL. The fallback body contains no success message.

- [ ] **Step 4: Run focused and full tests**

Run: `npm test -- lib/__tests__/handzettel-route.test.ts`

Expected: PASS.

Run: `npm test`

Expected: PASS, zero failed tests.

- [ ] **Step 5: Commit**

```bash
git add app/api/handzettel/cron/route.ts lib/cron-auth.ts lib/handzettel-cron-handler.ts lib/handzettel-update-result.ts lib/__tests__/handzettel-route.test.ts
git commit -m "fix: make leaflet cron failures truthful"
```

### Task 6: Operations Runbook and Recurring Codex Automation

**Files:**
- Create: `docs/CONTENT-UPDATE-RUNBOOK.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: repository tests, build, authenticated cron, Codex project ID.
- Produces: one recurring local Codex automation named `Jammers Content-Aktualisierung`.

- [ ] **Step 1: Write the runbook before configuring external state**

The runbook must contain the exact source order, `validFrom`/`validTo` rules, rights checklist, failure policy, and these verification commands:

```bash
npm test
npm run lint
npm run build
npm run test:e2e -- e2e/homepage.spec.ts
```

It must state that the automation:

1. browses official trinkgut leaflet/event pages first;
2. inspects Canva and Instagram read-only;
3. never clicks edit/delete/share/publish controls;
4. updates approved official metadata directly;
5. adds person/giveaway observations only to `review-queue.json`;
6. rejects missing dates, source URLs, consent, or implausible page counts;
7. runs all verification commands;
8. creates a focused content commit only when verification passes and the working tree was clean before the run;
9. pushes only the configured production branch after confirming that the branch contains `lib/homepage-content.ts` and `docs/CONTENT-UPDATE-RUNBOOK.md`; otherwise it leaves Git untouched and reports the reason.

- [ ] **Step 2: Add the runbook link to README**

Add `Content-Aktualisierung: docs/CONTENT-UPDATE-RUNBOOK.md` under the existing operational documentation section.

- [ ] **Step 3: Commit documentation**

```bash
git add docs/CONTENT-UPDATE-RUNBOOK.md README.md
git commit -m "docs: add hybrid content operations runbook"
```

- [ ] **Step 4: Resolve the Codex project ID and inspect existing automations**

Call `codex_app__list_projects({})` and select the record whose local path is the canonical repository `/Users/niko/Desktop/Homepage/trinkgut-jammers-v2`. Inspect existing automation metadata through the supported automation interface and, only if needed for duplicate resolution, read the name and ID fields from `$CODEX_HOME/automations/*/automation.toml`. Reuse an automation whose name is exactly `Jammers Content-Aktualisierung`.

Expected: one project ID and zero or one matching automation ID.

- [ ] **Step 5: Create or update the recurring automation**

Call `codex_app__automation_update` in create mode when no match exists, or update mode with the resolved ID when one exists. Configure a local recurring job named `Jammers Content-Aktualisierung` for every day at 06:15 Europe/Berlin. Its prompt is the nine-step runbook behavior above. Use the resolved project, a clean worktree execution environment, repository root, current default model, and **paused/inactive status** until the production branch has been integrated and Task 7 verification is clean. The authenticated leaflet cron remains a separate deployment concern; this Codex schedule does not pretend that a 06:15 run executes after Sunday 16:00.

Expected: automation tool returns a stable automation ID and paused daily schedule. Do not create a second automation for Sunday.

- [ ] **Step 6: Verify external state without triggering a publish**

Call `codex_app__automation_update({ mode: "view", id })` and assert its name, paused status, canonical project, daily schedule, and prompt all match the runbook. Do not manually run it against Canva during this verification step.

### Task 7: Full Hybrid Verification and Audit Closure

**Files:**
- Modify: `AUDIT_LOG.md`
- Modify: `DECISIONS.md`

**Interfaces:**
- Consumes: all prior hybrid tasks.
- Produces: evidence-backed closure for stale-handzettel and untimed-event findings.

- [ ] **Step 1: Run the full automated verification**

Run: `npm test`

Expected: PASS, zero failures.

Run: `npm run lint`

Expected: exit 0; any pre-existing warnings are listed separately and no new warning points to changed files.

Run: `npm run build`

Expected: PASS and all routes generated.

Run: `npm run test:e2e -- e2e/homepage.spec.ts`

Expected: PASS with the active, scheduled, and expired content fixtures covered by the homepage E2E plan.

- [ ] **Step 2: Exercise the authenticated cron locally**

Start a production server on a non-conflicting port with a temporary shell-local secret, call the cron once with an invalid bearer and once with the correct bearer, and record only status codes—not the secret:

```bash
CRON_SECRET='local-verification-only' npm run start -- --hostname 127.0.0.1 --port 3100
curl -sS -o /tmp/jammers-cron-invalid.json -w '%{http_code}\n' \
  -H 'Authorization: Bearer invalid' \
  http://127.0.0.1:3100/api/handzettel/cron
curl -sS -o /tmp/jammers-cron-valid.json -w '%{http_code}\n' \
  -H 'Authorization: Bearer local-verification-only' \
  http://127.0.0.1:3100/api/handzettel/cron
```

Expected: invalid bearer `401`; correct bearer `200` with validated catalog or truthful `502` when the official source is unavailable.

- [ ] **Step 3: Update audit and decision records**

Record the homepage portion of P0-005 as verified while leaving the broader stale product-catalog finding open. Close P0-008 only if the homepage E2E fixtures prove `scheduled → active → expired` and the official-source selection; otherwise leave it partially resolved. Do not close unrelated product-catalog, legal, NL, or giveaway-flow findings. Record the paused automation ID without credentials.

- [ ] **Step 4: Activate only after integration**

If and only if the production branch containing this pipeline has been integrated into the automation project's configured branch, call `codex_app__automation_update` with the same ID and active status, then view it again. If integration has not happened in this session, leave it paused and record that exact prerequisite instead of activating an automation against the wrong checkout.

- [ ] **Step 5: Commit audit evidence**

```bash
git add AUDIT_LOG.md DECISIONS.md
git commit -m "docs: verify hybrid content pipeline"
```

## Execution Handoff

Execute in this session with `superpowers:subagent-driven-development`. First complete and review Cinematic Homepage Task 1 (shared test harness), then Hybrid Tasks 1–5, then return to Homepage Tasks 2–8. Hybrid Tasks 6–7 run only after the homepage acceptance suite exists. Push is authorized; activation of the recurring automation remains conditional on the production branch actually being integrated into its configured project checkout.
