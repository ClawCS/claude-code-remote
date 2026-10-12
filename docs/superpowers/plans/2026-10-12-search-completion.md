# Search Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining source-backed website, editorial, performance and measurement work in the approved report.
**Architecture:** Extend existing Next pages and verified content packages. Use separate source review records, existing offer summaries and immutable media; keep operational services disabled.
**Tech Stack:** Next 16.3.8, TypeScript, Vitest, Playwright, local original PDFs, FFmpeg and authenticated browser tools.
**Spec:** `docs/superpowers/specs/2026-10-12-search-completion-design.md`.

## Global Constraints

- Work in existing isolated `codex/cinematic-production`; BASE `1abb8448d5ab5a23c03217a9ed4322ba017e489b`. Preserve foreign screenshots, application report and private sources.
- Sunday16 full-preview rule, original dates/hashes, source warnings and historical128 rows stay intact. Future imports require explicit complete summary review.
- No source-account/design changes, invented stock/prices/facts/authorship, unrestricted tracking, security changes, mail/payment/upload/deletion activation or unapproved release cleanup.
- Parent coordinates transactions, full tests/build, commit/push and deployment. Independent domains use disjoint files; avoid concurrent generators and build outputs.
- New behavior receives meaningful RED→GREEN tests. Content edits receive actual source comparisons, not tests that merely assert copied text.
- Full web verification: NODE_ENV=test npx vitest run --exclude 'services/applications/**' --exclude '.superpowers/**'; lint/typegen/tsc/offers:check/build; native application qualification excluded.

## Review Focus

1. Multi-price/app/quantity offers retain every condition; warning-marked source units are never silently repaired.
2. Editorial source coverage represents every actual lesson/recipe, with corrected quiz keys and no invented external review.
3. Media source/cache changes preserve responsive playback, poster-only preferences and the six original bottles.
4. Jobs expose only confirmed public job facts, never private application data or enabled upload endpoints.
5. Search verification and measurement never publish account identifiers/private exports or declare future results measured.

## Task 1: Complete current offer summaries and future review gate

**Files:** `data/weekly-offer-layout.json`, regenerated `data/weekly-offers.json`, KW42 publication manifest, `lib/weekly-offer-metadata.ts`, focused integrity tests and content runbook.
**Interface:** existing `summary:{price,package,deposit,unitPrice}` remains four original-text strings. Add a strictly validated documented ambiguity/review status only if existing fields cannot honestly represent source.
- [x] Inspect all82 original crops and existing conditions; inventory exact values and variants.
- [x] Add failing full-census/import tests; implement source-bound complete summaries and future publication completeness gate.
- [x] Run builders and prepare sequentially under existing lock. Verify210 crops, unchanged originals/history and all82 visible cards.

## Task 2: Complete editorial source review

**Files:** `data/akademie.ts`, `data/cocktails.ts`, new `data/editorial/content-reviews.json`, `components/academy/LessonContent.tsx`, recipe page and reusable sources view, related tests.
**Interface:** per-content ID review records with actual reviewed date, primary sources and scoped findings; no fabricated human reviewer.
- [x] Read every180 lesson and65 recipe in bounded batches; verify health/legal/numerical claims first, then definitions/preparation, sources and quizzes.
- [x] Correct proven errors and remove ungrounded assertions; provide complete source/review census and recorded substantive edits.
- [x] Add accessible source/date view at the relevant content, preserve recipe variants and accurate JSON-LD. Verify direct server-readable routes and quizzes.

## Task 3: Measured media, cache and client/font completion

**Files:** owned hero-media derivatives/provenance, HeroFilm, next config only for reviewed headers, root/provider boundaries and font definitions where warranted, focused browser/media tests.
**Interface:** versioned exact media paths and same-origin font files, original visuals and poster-only controls.
- [x] Measure current transfer/client payloads and film quality. Produce smaller mobile candidate targeting<=1MB; compare actual frame quality.
- [x] Adopt only qualified candidate; bind versions to hashes and immutable media headers. Measure provider separation and stable local-font candidate.
- [x] Verify cold/repeat desktop/mobile rendering, source selection, play/pause, preferences, exact font/media responses and unchanged dated content.

## Task 4: Public career pages and truthful modification dates

**Files:** new `data/jobs.ts`, public `app/karriere` index/detail routes, application links/navigation, metadata/sitemap and focused tests.
**Interface:** stable job IDs `verkauf-vollzeit`, `verkauf-teilzeit`, `ausbildung`; only confirmed poster facts. Single-job schema requires complete genuine fields.
- [x] Create indexable readable job pages with mailto info@trinkgut-jammers.de and original full posters. Keep protected application layout intact.
- [x] Tests for page-specific metadata, confirmed source facts, email subjects and index/protection boundary.
- [x] Add real content-modification metadata where evidence exists; never use every build/request as lastmod.

## Task 5: Search ownership, sitemap and external profile baseline

**Files:** public verification file only when provided by authenticated service; private sanitized measurement record and public report.
- [x] Inspect signed-in SearchConsole/Bing/profile state; identify intended mainHTTPS property.
- [x] Prepare exact safe verification method, submit after release, then confirm actual ownership/sitemap acceptance and baseline fields.
- [x] Resolve missing human-only login/permissions through one concise request while remaining work continues. Do not invent account success.

## Task 6: Future measurement process

**Files:** reusable read-only measurement/check scripts, sanitized baseline/report; existing or explicitly applicable app schedule tools.
- [x] Capture true release/time and available source data; document 7/28/90-day comparisons with fixed DE/NL queries and landing groups.
- [x] Prepare applicable timed followups without duplicating unrelated weekly tasks; notify only meaningful changes or needed access.

## Task 7: Review, release and public acceptance

- [x] Independent whole-range review; resolve material findings, record scoped limits.
- [x] Full local web gates, focused browser/image/original checks, commit/push only own files.
- [x] Recheck actual server current/rollback/free space. If space insufficient, provide specific concrete cleanup proposal before deleting any existing release.
- [x] Fresh Linux source release of exact tested commit; operational/security config hashes remain equal.
- [x] Actual public content/search/HTTP/media checks and ownership finalization; report completed website work, external access status and future measurement separately.

## Ausführungsabschluss / bewusst getrennte Ergebnisse

Website-Umsetzung und Abnahme sind durchgeführt; App-Release `3cbce2652040f3271464bb573ac121bf1cd47a9a` live am 12.10.2026, 13:21:52 Europe/Berlin. Frische lokale 2.354 / Linux 2.298 Webtests, Typen/Build/Originaldaten und tatsächliche öffentliche Prüfungen bestanden; vollständiger Nachweis im Abschlussaudit.

Google-/Bing-Eigentum und Sitemap-Einreichung sind bestätigt. Bing verarbeitet; Google meldete zunächst einen Sitemap-Abruffehler, sein tatsächlicher Live-Test bestätigte um 13:36:17 den erfolgreichen Abruf. Endgültiges Parsen/Indexieren wird nicht als abgeschlossen behauptet. Drei einmalige Nachmessungen Tag7/28/90 sind eingerichtet, Ergebnisse liegen heute noch nicht vor. JobPosting bleibt wegen fehlender Original-Anzeigedaten/Anforderungen zurückgehalten; zehn Foto-Lizenz-/Motivzuordnungen und Änderungen der fremden Trinkgut-Marktplattform sind ausdrücklich getrennte offene Punkte. Keine Upload-/Mail-/Miet-/Zahlungs-/Lösch- oder Sicherheitsaktivierung.
