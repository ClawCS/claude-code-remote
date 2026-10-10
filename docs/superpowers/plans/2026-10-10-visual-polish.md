# Filmischer Feinschliff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved warmer, bolder homepage with original-bottle interactions and approved v4 film as a verified local preview.

**Architecture:** Scoped CSS Modules and a small isolated own-brand interaction component, retaining server-rendered destinations and existing page contracts. Reuse exact existing transparent bottle assets and already-approved photography. Existing HeroFilm playback behavior is retained; only versioned media sources change.

**Tech Stack:** Next.js 16.3.8, React 19, TypeScript, CSS Modules, Sharp/AVFoundation, Vitest and Playwright.

**Spec:** `docs/superpowers/specs/2026-10-10-visual-polish.md`

## Global Constraints

- Local only. No Hetzner deployment, security, mail, uploads, payments, rental or content-package changes.
- Preserve existing header/navigation, verified imagery, full original posters, product identity and bottle labels. No new user photo request or generated bottle replacement.
- Retain honest alternative text and required privacy/operational information; remove only the two approved redundant visible application captions.
- Preserve unrelated dirty files. Stage only own explicit paths; commit/push approved work, no deployment from push.
- Keyboard access, visible focus, reduced-motion, usable touch, 44px targets, no horizontal page overflow at 360/390/768/1440px.

## Review Focus

- Touch visitors can identify and open every flavor without hover (own-brand browser interaction tests).
- Long names remain legible without clipping essential information (360/390px browser checks).
- Transparent images remain complete against dark backgrounds (visual/alpha bounds verification).
- Motion-disabled or save-data users keep a usable poster and links (existing HeroFilm tests plus own-brand reduced-motion test).
- Shared CSS does not regress NL/application/category pages (smoke affected pages, image/link contracts).

---

### Task 1: Cohesive visual polish and approved media integration

**Files:**
- Modify: `components/cinematic/AssortmentSection.tsx`, `warm.module.css`, `SpotlightSection.tsx`, `spotlight.module.css`, `editorial.module.css`, `HeroFilm.tsx` (paths/constants only if needed).
- Create: `components/cinematic/OwnBrandStage.tsx`, `own-brand-stage.module.css`, `data/eigenmarken-bottles.ts`, `public/images/eigenmarken-bottles/*`, `assets/source/eigenmarken-bottles/provenance.json`.
- Modify: `components/applications/ApplicationForm.tsx`, relevant existing composition/placement/service tests.
- Create/modify: `public/videos/jammers-hero-v4-{desktop,mobile}.mp4`, `assets/source/hero-film/provenance.json` with accurate v4 source evidence, focused media tests.
- Test: `lib/cinematic/__tests__/visual-polish.test.tsx`, `lib/cinematic/__tests__/own-brand-stage.test.tsx` (real browser component tests if interactive).

**Interfaces:**
- Consumes `eigenmarken` data; six slug links target `/eigenmarke#<slug>` (verify IDs). Existing product images are full posters, not cutouts.
- Bottle sources: `/Users/niko/Desktop/Homepage/Homepage Codex/src/assets/flaschen/{pralle-kirsche,dicke-nuesse,suesse-suende,caramello,schwarzer-teufel,weisser-engel}.png`. These are improved transparent silhouettes; do NOT use opaque `a/bottles` or ghosted `b/flasche-*` alternatives. Reuse byte-identical PNGs unless lossless web encoding is justified; source hashes/dimensions in private provenance, safe src/width/height mapping in data module.
- v4 source: `.superpowers/hero-people-preview-2026-10-10/.superpowers/brainstorm/44114-1791658740/content/jammers-hero-15s-v4.mp4`, SHA-256 `59a70d3ef71c8eef46396005b3242f2109e3570a46b286f1b7f3fadbe0cc81a2`, 15s, 1920x1080, 24fps, silent. Existing `scripts/encode-hero-film.swift` can create versioned derivatives; desktop 1280x720/2500000bps <6MB, mobile 960x540/1200000bps <3MB. Keep existing poster/full-frame contain and film fallback logic.
- Produces a server-visible six-flavor stage, correct anchors, larger editorial hierarchy and four image-based category destinations. Reuse current design tokens, scoped new values permitted where needed without global nav/form expansion.

- [x] **Step 1: Add failing behavior tests.** Assert four accessible category links contain appropriate images; every exact six flavor destination is present with complete image sizing; keyboard/focus and touch selection reveal matching name/color without swallowing navigation; reduced-motion disables motion. Assert application renders poster enlargement links without the two rejected sentences and still retains privacy info. Adjust obsolete composition expectations to the approved new stage rather than weakening unrelated checks.
- [x] **Step 2: Run focused tests and record intended RED output.** `NODE_ENV=test npx vitest run lib/cinematic/__tests__/visual-polish.test.tsx lib/cinematic/__tests__/own-brand-stage.test.tsx`.
- [x] **Step 3: Implement approved composition.** Warm cream assortment panel with four generous fully linked image cards, bolder scoped headings and body copy, dark own-brand stage with giant aria-hidden names behind complete bottles. Use actual source photography already approved for each group; root provides asset audit notes. Keep all six visible on desktop, tidy two/three-column responsive layout on mobile; no carousel required. Pointer/focus may update the decorative backdrop, but each flavor remains a normal named link. Reuse group motif on `/eigenmarke` and `/nl`; homepage stage replaces the repetitive group/list/three-poster stack, with a clear all-brands CTA to complete originals. Preserve all existing page section IDs/order and unaffected business links. Remove exactly the approved application paragraph. Increase relevant downstream editorial headings and alternate warm section surfaces without changing nav/forms.
- [x] **Step 4: Integrate approved film.** Derive new versioned media, update source paths and tests, provenance source/hash/approval/scene times. Preserve original media files and pure rendering fallback. No extra generation or service activation.
- [x] **Step 5: Verify.** Focused tests GREEN; `NODE_ENV=test npm test` once and report all unrelated native-service failures separately. `npx tsc --noEmit`, `npm run lint`, `NODE_ENV=production npm run build`. Verify changed `/`, `/bewerbung`, `/eigenmarke`, `/nl` on dev3000. Controller performs fresh production3110 visual checks and final review; no deploy.
- [x] **Step 6: Self-review and commit.** Explicit own-path staging only, no push until controller verification. Detailed report includes RED/GREEN evidence, source integrity, full-suite limits and exact commit IDs.
