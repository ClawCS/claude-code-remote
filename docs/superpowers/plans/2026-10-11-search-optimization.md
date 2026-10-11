# SEO / GEO / AEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved search-readiness improvements without redesigning or activating restricted operations.
**Architecture:** Existing Next App Router and source-bound editorial packages remain authoritative. Add focused metadata/schema helpers, static lesson URLs with persistent course interaction, and optional strictly verified offer summaries. Measure production CSS output before adopting a performance change.
**Tech Stack:** Next 16.3.8, React 19, TypeScript, Vitest, Playwright, existing local editorial JSON.
**Spec:** `docs/superpowers/specs/2026-10-11-search-optimization-design.md` (approved report elaboration).

## Global Constraints

- Preserve the existing design, original assets, WebP-only optimization and actual Berlin publication dates.
- Preserve all existing application/admin/rental/mail/payment/security protections and disabled operations. No external account changes, new tracking, or deployment without separate confirmation.
- Never invent stock, prices, reviews, nutritional facts, authorship, qualifications or editorial review dates. Preserve source warnings.
- Preserve unrelated dirty screenshots, private sources and `docs/audits/2026-10-09-application-upload-interim.md`.
- Use installed Next documentation, TDD for behavior and real rendered assertions. Run tests with NODE_ENV=test; build and runtime production without test clocks.
- Full existing web gate: `NODE_ENV=test npx vitest run --exclude 'services/applications/**' --exclude '.superpowers/**'`. Bare npm test was attempted before edits: it discovers private duplicate runtime copies and unqualified native application fixtures; interrupted after native/version failures. Report this limitation, never claim full native qualification. Do not change native/security behavior for SEO.
- Only own tested paths may be committed. Controller owns push, production build orchestration and any authorized deployment.

## Review Focus

- Descendant metadata must not inherit the parent canonical or wrong OpenGraph title: test rendered detail pages and utilities.
- Malicious text in JSON-LD must not terminate a script: use the existing serialization boundary and test hostile strings.
- Lesson navigation must preserve completed quizzes while resetting the selected lesson quiz, including zero-score completions and browser back.
- Missing, changed or malformed offer summary must never bypass package hashes; expired and future pilots remain hidden.
- External CSS must load with the existing CSP and mobile styles; no missing styling or stale dated-content caching.

## Task 1: Technical metadata and indexation hygiene

**Files:** `app/sitemap.ts`; affected existing `app/*/{layout,page}.tsx` metadata, including `/eigenmarke`, `/finder`, `/partyplaner`, `/vermietung`, `/galerie`, `/community`, `/gewinnspiel`, `/gewinnspiel/archiv`, `/leergut`, `/oeko-tracker`, `/partyspiele`, `/impressum`, `/datenschutz`, `/agb`, `/kontakt`; new `app/merkzettel/layout.tsx`; `app/produkte/[slug]/page.tsx`; `lib/cinematic/metadata.ts` or new `lib/search-metadata.ts`; `lib/__tests__/public-sitemap.test.ts`, new `lib/__tests__/search-metadata.test.ts`; existing metadata/redirect tests.
**Interfaces:** Produce `buildPageMetadata({title,description,path,image?,locale?}): Metadata` in `lib/search-metadata.ts`, absolute canonical and matching OG title/description/url, shared confirmed default image. Preserve caller robots/hreflang when applied. Existing source has metadata in layouts or server pages; never export from a client page.
- [x] Write failing tests: sitemap excludes `/handzettel`, `/gewinnspiel/archiv`, `/merkzettel`; public canonical helper emits HTTPS own-page targets and matching OG; merkzettel noindex/follow; protected Bewerbung unchanged; retired known product route uses 308 and unknown slug404.
- [x] Observe RED, then implement. Existing `/handzettel` canonical stays `/angebote`; archive stays noindex. Add self canonicals to listed public routes; archive may self canonical while remaining noindex. Rental title `Zapfanlagen & Partybedarf mieten in Goch`; no Bierzelte promise. Finder description clearly describes ideas, no current inventory promise.
- [x] Apply matching OG metadata to current static search pages plus cocktail/category/course generators where simple without changing content; avoid a homepage OG title inherited everywhere. Add root/NL hreflang to sitemap only for the real pair, no fake translation pairs.
- [x] Verify focused tests, web gate, typecheck; request affected dev routes; self-review and commit only task paths. Report any metadata generators needing the subsequent task.

## Task 2: Recipe schema and local answers

**Files:** new `lib/recipe-structured-data.ts`, new `lib/__tests__/recipe-structured-data.test.tsx`; `app/cocktails/[slug]/page.tsx`; `lib/cinematic/metadata.ts`; `app/kontakt/page.tsx`, `app/nl/page.tsx`, `app/vermietung/page.tsx`, `app/eigenmarke/page.tsx`; new `components/LocalAnswers.tsx` and scoped styles only if required; related render tests.
**Interfaces:** `buildRecipeJsonLd(recipe,photo)` returns Recipe using existing name/ingredients/instructions/category and approved local image only; no unverified optional properties. `buildBreadcrumbJsonLd(items: readonly {name:string;path:string}[])` uses real paths. Reuse `JsonLdScript` and `serializeJsonLd`.
- [x] RED tests: Mojito JSON-LD equals visible ingredients/instructions and actual approved image; all 65 recipes valid; absent image omitted not invented; no ratings/nutrition/time/author; hostile text safely serialized; breadcrumbs real home/recipes/category/recipe paths.
- [x] Add Recipe + BreadcrumbList to all existing recipe pages; approved existing photos and visible content unchanged. Add confirmed local market image and official `https://www.trinkgut.de/markt/jammers` sameAs (no guessed coordinates/ratings/hours).
- [x] Add small DE/NL answer sections using only MARKET facts, original flyer validity, personal rental confirmation, three-working-day prices, pickup only. No FAQ rich-result promise/schema required. Connect NL own-brand links to existing six stable anchors; create anchors if missing. Keep long legal/price details at their existing source.
- [x] Focused tests + full web gate + typecheck; inspect mobile/desktop affected pages; commit tested own paths.

## Task 3: Stable server-readable academy lessons

**Files:** `app/akademie/[slug]/{layout,page}.tsx`; new `app/akademie/[slug]/lektion/[lesson]/page.tsx`; new `components/academy/{CourseShell,LessonContent}.tsx`; new `lib/academy-routes.ts`; `components/editorial/learning.module.css`; `app/sitemap.ts`; academy/e2e tests.
**Interfaces:** `lessonHref(courseSlug,index)` returns course root for index0, `/akademie/{slug}/lektion/{index+1}` otherwise. Course layout holds persistent client CourseShell, route page supplies server-rendered lesson children. Parse numeric 1-based IDs strictly against known course; `/lektion/1` permanent redirect to root; invalid404. Existing root remains lesson1 canonical. No content rewriting.
- [x] RED route/render tests: direct second/final lesson shows correct full text without JS and self metadata; invalid/zero/out-of-range/unknown404; 1alias308; sitemap adds unique lesson2..N routes.
- [x] Extract existing course shell preserving all quiz, retry, 70% pass and completed-zero-score behavior. Real links for lesson controls and previous/next. Use persistent layout state; query/path changes reset active quiz but keep completion in that course. Returning from exam to learning resets view and goes to first lesson as before.
- [x] Add truthful lesson title/description/canonical/OG and navigational breadcrumbs. Do not claim review dates, course accreditation, health/legal verification or authorship.
- [x] Update selectors from button to link in existing browser tests, not weaken assertions. Test direct loads, real navigation, browser back, completed lessons, mobile keyboard/axe. Full web gate + typecheck; commit tested paths.

## Task 4: Source-bound visible offer-summary pilot

**Files:** `lib/weekly-offer-metadata.ts`, `lib/publication-integrity.ts`, `lib/weekly-publication-types.ts`, `lib/weekly-offer-selection.ts`, `scripts/build-weekly-offers.ts`, `components/WeeklyOfferGrid.tsx`, related CSS; relevant metadata/publication/content/card tests; `data/weekly-offer-layout.json`, generated `data/weekly-offers.json`, `data/editorial/weekly-publications/2026-10-12.json`; `docs/CONTENT-UPDATE-RUNBOOK.md`.
**Interfaces:** optional `summary` with exactly `price`, `package`, `deposit`, `unitPrice` nonempty bounded plain strings representing printed facts. No arithmetic, no numeric Offer schema, no stock. `validateOfferSummary(unknown)` accepts omission for history, validates strict keys/types/lengths; use both builder and integrity path; include field in checksum and version2 public projection/runtime validation. Existing version1 compatibility remains.
- [x] RED tests for omission unchanged, valid summary public+visible, invalid/unknown/malformed data rejected, tamper invalidates manifest, old/future summaries never render. Preserve source warning/full conditions beside summary.
- [x] Implement pipeline and accessible visible description list. All originals and full text conditions remain. No regex extraction into numeric prices.
- [x] Visually recheck three simple KW42 crops against actual source hashes, then add only these pilot summaries: `de-2026-42-p01-06` Ahrtal Quelle `4,99 €`, `12 × 0,75 l Glas`, `zzgl. 3,30 € Pfand`, `0,55 €/l`; `de-2026-42-p02-01` Red Bull `0,99 €`, `250 ml Dose`, `zzgl. 0,25 € Pfand`, `3,96 €/l`; `nl-2026-42-p01-r2c1` Coca-Cola/Fanta/Sprite `1,19 €`, `1,25 l PET-fles`, `excl. 0,25 € statiegeld`, `0,95 €/l`. Keep caffeine/variants text. DE source SHA `a8dfe6b0a728982667ce83ac8eed0e527c6cf2b6d03dd7b10fcd857112f4f37e`; NL `b669c22d2e7bcb6466af9771cf68573f935312556db0d58e24db9a6e5bfe448d`. Exclude all other rows from initial summary pilot.
- [x] Correct the existing NL Red Bull text mismatch transparently: preserve the original `0,25 ml Blik` wording and add sourceWarning stating printed unit inconsistency and ask in market; never assert corrected0.25l as exact original. This is a transcription correction, not a price correction. Preserve prior warnings.
- [x] `offers:build -- --week 2026-10-12`, then `content:prepare -- --week 2026-10-12` via normal source/hash/census gates; no manual generated hashes. `offers:check`, full web tests. Historical128 rows byte-equivalent. Update runbook with summary verification/optional backward compatibility, commit own tested files.
- [x] Isolate homepage fixtures from ambient supplemental content: a concurrent `offers:check` takes the real `.weekly-offers.lock`, currently poisoning five otherwise independent fixture tests through their missing supplemental-loader injection. Add a regression using only temporary paths; explicitly inject fixture supplemental data where the fixture already injects weekly data. Preserve the production fail-closed rule. See `.superpowers/sdd/2026-10-11-search-optimization/fixture-diagnosis.md`. Run offer commands and the full suite serially until this test isolation is verified.

## Task 5: Measured stylesheet delivery optimization

**Files:** `next.config.ts`; new focused performance test/script under `scripts/` and `lib/__tests__/` only if useful for a durable gate; report under `docs/audits/2026-10-11-search-optimization.md`.
**Interfaces:** No business interfaces changed. Root CSS remains same source and ordering.
- [x] Establish a local production baseline before changing inlineCss: GET /,/nl,/angebote,/produkte,/gewinnspiel with size/CSS/JS metrics; capture desktop/mobile render for comparison. No production test clocks.
- [x] Test that candidate output references retrievable same-origin CSS, contains drastically less repeated inline CSS and preserves current CSP/WebP configuration. Remove `experimental.inlineCss:true` only after the comparison design is ready; build fresh candidate and measure.
- [x] Compare raw/gzip HTML plus CSS first-load and repeat-view bytes; do not equate raw savings with speed. Run navigation, screenshots/axe, LCP/CLS lab sample if feasible. Revert candidate if rendering or meaningful lab regression appears. Keep HeroFilm content, media bytes, provider state and dynamic content caching unchanged unless a separately measured candidate is safely reviewed; otherwise document follow-up, not claim done.
- [x] Full web gate, typecheck/lint/build, commit only proven configuration and test/report changes. No server cache/security changes.

## Task 6: Integrated acceptance and truthful handoff

**Files:** `docs/audits/2026-10-11-search-optimization.md`; targeted reusable SEO audit under `scripts/` if needed; `AGENTS.md` short local status; completed plan checkboxes.
- [x] Full web gate, lint, typegen/tsc, offers:check and clean production build. Crawl local sitemap, verify200/self-canonical/non-noindex, recipes/schema, lesson initial HTML, legacy308, protected routes. Verify PDFs/images/content APIs remain correct using real production time and separate marked fixture only for future offer tests.
- [ ] Independent whole-range code review and focused fixes; collect exact measurements, limitations, report correction C01, source checks and test failures separately.
- [ ] Commit and push own verified changes according to AGENTS; verify remote SHA. Do not deploy unless separately approved; if approved follow DEPLOYMENT-RUNBOOK fully with fresh Linux release and actual public checks.
- [x] Record Search Console/GBP access pending, no fabricated visibility data; prepare 7/28/90-day measurement checklist without creating new automation. List remaining editorial fact-check and nonadopted performance candidates honestly.

Task-6-Abgrenzung: Lokale Acceptance/Dokumentation abgeschlossen; der vorhandene frische Task-5-Build bleibt gültig, weil danach kein Appcode geändert wurde. Unabhängige Gesamtbranchprüfung, Push/Remote-SHA und Linux-/öffentliche Releaseabnahme liegen beim Controller und bleiben oben bewusst offen. Die direkte Veröffentlichung nach Prüfung ist vom Betreiber bestätigt, zusätzliche Releasebereinigung aber noch nicht freigegeben; kein Deploymentnachweis durch lokale Tests.
