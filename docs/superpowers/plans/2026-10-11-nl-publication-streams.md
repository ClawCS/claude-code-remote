# NL publication streams implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agency-sourced main NL weekly flyers plus independently dated supplemental Maasduinen advertisements, followed by a verified KW42 release.

**Execution status, 11 October 2026:** Tasks 1–6 completed, independently reviewed and released as `8613344`. Fresh Linux build and real public HTTPS/content/browser checks passed. KW42 is scheduled for its original 12–17 October dates, not active prematurely on Sunday. Detailed outcomes, four explicit workflow rulings and remaining unrelated operational limits are recorded in `docs/audits/2026-10-11-nl-publication-streams.md`. Checklists below preserve the approved task instructions; execution evidence supersedes the historical pending-review wording.

**Architecture:** Preserve historical weekly bindings, add typed agency provenance and a separate per-issue supplemental registry, and reuse the immutable asset/layout verification and transaction mechanism. One verified selection feeds all public pages and APIs; old offer clients retain their wire contract.

**Tech Stack:** Existing Next.js 16.3.8 / React 19.2.4 / TypeScript / Vitest / Playwright / Sharp / pdf-lib, Node >=22.13.0; existing Hetzner Linux deployment. No new provider, database, dependency or server service.

**Spec:** `docs/superpowers/specs/2026-10-11-nl-publication-streams-design.md`; technical plan and recommended separated implementation/review method approved by Niko with `leg los` on 11.10.2026. Execution ledger: `.superpowers/sdd/2026-10-11-nl-publication-streams/progress.md`.

## Global Constraints

- Main NL provider cutoff: `2026-10-12`; even ISO weeks `de-maas-driehoek`, odd `udens-weekblad`; actual printed dates/year and exactly one decoded original page remain mandatory.
- Supplemental Maasduinen: twelve placements yearly, no invented monthly schedule; inclusive independent Europe/Berlin dates, no weekly substitute.
- Keep existing KW41 manifest/provenance/layout/offer bytes and historical verification semantics; reject future legacy-schema attempts to bypass provider cutoff.
- Preserve exact original content, hashes, safe relative paths, complete offer census, warnings, immutable public URLs, durable transaction lock and fail-closed errors.
- No private paths/design identities in DTOs; no counterfeit Canva provenance. No app code, imports or releases until the technical plan review gate is passed.
- Preserve dirty screenshots, unrelated application report and untracked content runs. Commit only explicit own file lists; follow AGENTS synchronization.
- Only website/content release. No mail, payment, application, rental, DNS or security changes. Preserve actual existing automation schedules/status (Sunday active 19:00, daily 06:15 paused at planning time).

## Review Focus

1. Same-start-date weekly NL and supplement must not mix census or delete each other's offer rows — tasks 2/3.
2. A supplemental manifest from a previous week/month or with unknown corruption must not disable the valid weekly pair — tasks 2/4.
3. An old open browser must continue reading new valid offers without unknown-field rejection — task 4.
4. ISO week/year parity, DST and Sunday validity must use actual Berlin dates, not `KW+1` or current-week-only lookup — tasks 1/2/4.
5. A prepared future release must not expose future prices early or be called active after a local/test-clock-only check — tasks 5/6.

## Task 1: Typed original provenance and provider policy

**Files:** create `lib/flyer-source-policy.ts`, `lib/__tests__/flyer-source-policy.test.ts`; modify `lib/flyer-packages.ts`, `lib/weekly-publication-types.ts`, `lib/weekly-publication.ts`, `lib/__tests__/flyer-packages.test.ts`, `lib/__tests__/weekly-publication.test.ts`, fixtures under `lib/__tests__/fixtures/`.

**Interfaces:** export `AgencyMedium`, `PublicationPurpose`, `PublicationMedium`, `PublicationIdentity`; `expectedNlAgencyMedium(week: string): AgencyMedium`; `assertPublicationPolicy(identity: PublicationIdentity, source: EditionSource, validFrom: string, validTo: string, week?: string): void`. Extend `EditionSource` with `{kind:"agency"; originalId:string; medium:AgencyMedium}`. Normalize legacy Canva rows internally without writing them. New provenance requires explicit typed source, review/approval timestamps, exact original hashes/dates/page count; no fictitious remote URL.

- [ ] Write tests: unchanged KW41 accepted; KW42 Driehoek accepted; KW43 Udens accepted; wrong medium/week/year, multiple pages, mismatching typed identity and future Canva main (including v1) rejected. Add ISO-year-boundary fixture.
- [ ] Run `NODE_ENV=test npx vitest run lib/__tests__/flyer-source-policy.test.ts lib/__tests__/flyer-packages.test.ts lib/__tests__/weekly-publication.test.ts` and record expected failures.
- [ ] Implement strict legacy/new parsing and policy, with the provider cutoff independent of schema version. Main v2 stores explicit identity; historical normalization does not alter hashes.
- [ ] Re-run tests; inspect diff and confirm no existing content files changed. Commit explicit task files.

## Task 2: Independent supplemental binding with shared integrity verification

**Files:** create `lib/publication-integrity.ts`, `lib/supplemental-publication.ts`, `lib/__tests__/supplemental-publication.test.ts`; modify `lib/weekly-publication.ts`, `lib/weekly-publication-types.ts`, relevant fixtures and `lib/__tests__/weekly-publication.test.ts`.

**Interfaces:** canonical `PublicationEdition` holds current asset/review/census fields plus `PublicationIdentity`; `verifyPublicationEdition(edition: PublicationEdition, root: string): Promise<VerifiedPublicationEdition>` handles common immutable checks after source/date parsing. `SupplementalPublication = {schemaVersion:1; edition:PublicationEdition}`; `parseSupplementalPublication(value: unknown): SupplementalPublication`; `loadSupplementalPublications(root?: string): Promise<LoadedSupplementalPublications>`; `selectSupplementalEditions(loaded: LoadedSupplementalPublications, now: Date): readonly VerifiedPublicationEdition[]`. Read `data/editorial/supplemental-publications/<id>.json`. Issues are scoped to register and, when validly known, edition ID/period; never trust malformed raw identity to invalidate a healthy sibling.

- [ ] Write failing fixtures for non-Monday start, two-week/month/year spans, Sunday end, Berlin midnight and DST, missing next weekly manifest, two valid overlapping source streams, duplicate edition IDs and corrupt supplement isolation.
- [ ] Run `NODE_ENV=test npx vitest run lib/__tests__/supplemental-publication.test.ts lib/__tests__/weekly-publication.test.ts` and record red results.
- [ ] Extract/reuse integrity checks without loosening PDF decoding, EOF, one-page NL, all-page offer counts, image geometry/bytes, canonical metadata, hashes or symlink bounds. Scope row membership by exact edition ID; separately reject globally duplicated IDs. Keep shared durable-lock behavior and production caching of verification, not of date selection.
- [ ] Re-run tests plus `lib/__tests__/weekly-publication-build.test.ts`; prove legacy verified content unchanged; commit task files.

## Task 3: Targeted builds and atomic main/supplemental assembly

**Files:** modify `scripts/build-weekly-offers.ts`, `lib/weekly-offer-metadata.ts`, `lib/official-publication-import.ts`, `scripts/validate-content-build.ts`, `lib/__tests__/official-publication-import.test.ts`, `lib/__tests__/weekly-publication-build.test.ts`, `lib/__tests__/weekly-assortment.test.ts`; create `lib/supplemental-publication-import.ts` and its test.

**Interfaces:** existing `buildWeeklyOffers(root,args)` gains strict mutually exclusive `--week <Monday>` / `--edition <id>` targeting; `--check` checks all declared bindings when untargeted. Weekly assembly resolves typed agency provenance and only main sources. `assembleSupplementalPublication(id: string, root: string): Promise<SupplementalPublication>` uses the same transaction lock and immutable-copy/candidate verification discipline. Layout references typed provenance and explicit purpose/medium; public source URLs remain local PDFs.

- [ ] Write failing tests: same-date NL main and supplement preserved by separate builds; idempotent reassembly; failed candidate keeps earlier binding; bytes changed at existing path rejected; missing supplemental manifest, duplicate identity, broken census and lock block release check; clean archive needs no private originals.
- [ ] Run `NODE_ENV=test npx vitest run lib/__tests__/official-publication-import.test.ts lib/__tests__/supplemental-publication-import.test.ts lib/__tests__/weekly-publication-build.test.ts lib/__tests__/weekly-assortment.test.ts`.
- [ ] Implement replacement by explicitly selected edition IDs, independent registries and strict binding/identity agreement. Never delete by shared `validFrom` or weaken weekly validation to accommodate supplements.
- [ ] Re-run task tests and `npm run offers:check` against unchanged historical content; commit only implementation/tests.

## Task 4: Unified selection, compatible APIs and grouped UI

**Files:** modify `lib/weekly-offer-selection.ts`, `lib/weekly-offer-content.ts`, `lib/weekly-offer-refresh.ts`, `lib/homepage-content.ts`, `lib/flyer-index.ts`, `lib/cinematic/presentation.ts`, `lib/content-verification.ts`, `scripts/content-weekly.ts`, `scripts/audit-public-site.mjs`, `app/api/content/offers/route.ts`, `components/cinematic/CurrentSection.tsx`, `components/cinematic/NlCurrentSection.tsx`, `components/FlyerIndexView.tsx`, `components/WeeklyOfferGrid.tsx`, `components/ProductCatalogue.tsx`, existing related CSS modules. Extend existing route/content/refresh/locale/collection tests; add `e2e/nl-publication-streams.spec.ts`.

**Interfaces:** `selectWeeklyOfferContent(loaded, now, supplemental?)` returns one full current selection. Public flyers carry `purpose`/`medium`; offer fields and IDs unchanged. Homepage adds `supplementalFlyers`; its singular fields are strictly main editions. `parseWeeklyOfferContent` validates v2; `projectLegacyOfferContent(content)` removes only new flyer metadata for requests without `X-Jammers-Content-Version: 2`, retaining the same offers/dates/assets. New refresh client and audit request that header; route varies on it and remains no-store. Legacy DE GET stays unchanged.

- [ ] Write tests for main-only healthy, supplement-only still missing main NL, corrupt supplement isolated, complete active ID parity across all three APIs and four flyer routes, old/new client DTOs, races, expiry, supplemental original source labels, same product with different conditions not merged.
- [ ] Run focused tests in `lib/__tests__/weekly-offer-content.test.ts`, `weekly-offer-refresh.test.ts`, `homepage-content.test.ts`, `flyer-index.test.ts`, `weekly-public-routes.test.ts`, `content-weekly.test.ts`, `content-verification.test.ts`, `weekly-offer-cards.test.tsx`, `flyer-locale.test.tsx` and relevant cinematic presentation/collection tests; record failure before code.
- [ ] Implement main two-column row plus separate localized supplemental row using existing full-image viewer; no empty supplemental section. Primary missing notices refer only to main editions. Keep catalogue language/category/search behavior and date binding, update copy to include supplementary advertisements.
- [ ] Extend CLI/audit to check all actually active originals and tiles by GET bytes/type/size/hash, main completeness separately from declared supplemental corruption. `--week` includes overlapping supplement review without changing its dates. No future production clock.
- [ ] Verify test matrix at 390/768/1440 widths, keyboard viewer/focus and all full covers; run local UI workflow from AGENTS. Commit task files after independent review.

## Task 5: Complete KW42 originals and all offer tiles

**Files:** new KW42 official catalog and weekly manifest under `data/editorial/`; modify only new rows in `data/editorial/flyers.json`, `data/weekly-offer-layout.json`, `data/weekly-offers.json`; immutable assets under `public/handzettel/2026/`, `public/images/content/`, `public/images/offers/`. Conditional supplemental manifest/assets only for an actually verified original. Keep private downloads under ignored `.superpowers/`.

**Inputs:** fixed week `2026-10-12`; approved Driehoek PDF hash from spec; official Goch store 13027 / Werbekreis 3.6. **Outputs:** complete bound KW42 DE+agency-NL plus any independently verified currently/forthcoming valid Maasduinen issue; no fabricated content or reused KW41 validity.

- [ ] Run the bounded normal `npm run content:prepare -- --week 2026-10-12`; initial private staging may truthfully remain incomplete. Reconnaissance retry already confirmed catalog 1394743/v1, ten pages, 12.–17.10.2026, with successful original-endpoint HEAD responses after an initial transient timeout. Recheck actual original bytes at import. If browser download is needed, verify exact official provenance/metadata and original identity before feeding reviewed staging; never suppress guards or claim success from a screenshot.
- [ ] Visually inspect every DE page and complete NL page, record all offer blocks/conditions/warnings, exact crops and page census. Verify the original printed date against metadata. NL must decode to exactly one page; preserve complete covers.
- [ ] Read Canva and search once for exact valid Maasduinen original; if found export original one-page file through available authenticated route, verify full layout and dates. If absent, report only that optional source status and do not hold back complete weekly pair or invent monthly dates.
- [ ] Build `npm run offers:build -- --week 2026-10-12`, bind with `npm run content:prepare -- --week 2026-10-12`; use `--edition` plus supplemental assembler for a reviewed additional issue. `npm run offers:check` must succeed; all source/offer counts and hashes must match review.
- [ ] Verify isolated local Berlin start/expiry boundaries and actual current Sunday response. Keep historical data unchanged; commit only successful reviewed outputs and sanitized evidence.

## Task 6: Release, automation alignment and public verification

**Files:** update `AGENTS.md`, `docs/CONTENT-UPDATE-RUNBOOK.md`, `data/editorial/source-config.json`; create `docs/audits/2026-10-11-nl-publication-streams.md`. Update only existing automation prompts through the app tool, never raw TOML writes; preserve schedules, status, IDs and notification policy.

- [ ] Complete fresh branch review; run `NODE_ENV=test npx vitest run --exclude 'services/applications/**' --exclude '.superpowers/**'`, lint, `npx next typegen`, `npx tsc --noEmit`, `npm run offers:check`, production build and focused e2e. Native application qualification remains excluded and unclaimed.
- [ ] Document confirmed provider cutover and current scheduler facts. Read automations again, then replace Canva-exclusive prompts with agency parity plus optional Maasduinen rules and original-date/source checks. Keep Sunday 19:00 active and daily 06:15 paused if unchanged; do not create or re-enable tasks. No server cron.
- [ ] Check actual server current/rollback targets and disk space. Build fresh Linux release following DEPLOYMENT-RUNBOOK, preserve all security configuration hashes, deploy only verified own commit; no release cleanup without specific user permission. Roll back on readiness failure.
- [ ] Run `npm run content:check -- --url https://trinkgut-jammers.de` and `npm run audit:public -- --url https://trinkgut-jammers.de --output /tmp/jammers-nl-streams-live.json`; verify original/cover/crop GET SHA-256, APIs, desktop/mobile and legacy endpoint. On Sunday confirm future release binding/files separately while active prices remain hidden.
- [ ] Record source preparation, complete offer counts, local test/date-preview results, exact release and actual public time separately; commit/push report and verify local/GitHub synchronization. Report any unmet gates without calling KW42 active early.

## Self-review

All approved surfaces, independent validity, source parity, exact-original safety, historic preservation, catalogue tiles and public release are assigned above. Five review-focus edge cases each have an explicit owning test step. No test count, current Maasduinen availability, DE PDF completion or deployment success is assumed. Execution approach recommended: subagent-driven implementation with independent review of each task and whole-branch review before release; technical plan review remains the next gate.
