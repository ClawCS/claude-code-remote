# Filmisch & nahbar — Implementation Plan

> Execute with superpowers:subagent-driven-development. Approved direction, no new design questionnaire.

**Goal:** Turn approved prototype A into the existing Next.js website without losing business functionality or dynamic content.
**Spec:** `docs/superpowers/specs/2026-10-10-filmisch-redesign.md`
**Architecture:** Server-rendered composition/data stay server-side; small client film player; scoped CSS modules; local optimized media. Existing worktree and deployment unchanged.
**Stack:** Next16.3.8, React19, CSS modules, Vitest, Playwright, Sharp, macOS AVFoundation for encoding.

## Global Constraints

Preserve all nine navigation groups, existing routes, datumsrichtige DE/NL flyers and full offer pipeline, unmodified business/API logic and security state. Original contact logos only; no excluded team/market photos or claims. Keep foreign changes. Commit only own files. No deployment/provider change. Approved 15-second v2 film only, full six-bottle finale. Existing visual assertions may be updated for approved design, but never weaken data, route, focus or accessibility checks. No new runtime dependencies needed.

### Task 1: Production film assets and accessible player

**Files:** create `public/videos/jammers-hero-{desktop,mobile}.mp4`, `public/images/home/jammers-film-poster.webp`, `assets/source/hero-film/provenance.json`, `components/cinematic/HeroFilm.tsx`, `components/cinematic/hero-film.module.css`, focused tests under `lib/cinematic/__tests__/hero-film.test.tsx` or `e2e/hero-film.spec.ts`. Optional deterministic media-encoding helper in `scripts/` if useful.

1. Inspect accepted v2 source and final still, encode local derivatives using existing AVFoundation tooling without altering imagery; target ≤6MB desktop/≤3MB mobile, no sound,15s,16:9. Verify duration/resolution/size/hashes. Poster from accepted final still, optimized without cropping. Provenance stores sanitized task IDs and operator approval, not signed URLs or private credentials.
2. TDD for actual player behavior: source absent during SSR/reduced motion/saveData; manual play/pause, pause after preference changes and background/offscreen, failure fallback, source selection by width. Use browser tests for media behavior if no DOM unit environment exists. Before implementation, demonstrate focused failing assertions on missing component/behavior.
3. Small client component with SSR poster, accessible description/control. Manual action overrides auto-start preference only for that explicit playback; rejected play promises leave accurate controls and poster. Avoid polling/global state/large animation libraries.
4. Preserve server children slot for hero copy if needed to support desktop finale behavior; do not add disappearance unless focus handling and mobile split are safe. Source aspect-ratio remains 16:9.
5. Focused tests + full Vitest suite once; report inherited baseline failures separately, do not repair unrelated services. Commit own files; report exact tests and output.

### Task 2: Approved A composition, shared visual polish and regression coverage

**Files:** `components/cinematic/HeroSection.tsx`, `hero.module.css`, `CinematicHome.tsx`, `CurrentSection.tsx`, `current.module.css`, `ServiceSection.tsx`, `editorial.module.css`, `spotlight.module.css`, `chrome.module.css`, `footer.module.css`, `app/home.module.css`, optionally `lib/cinematic/tokens.ts`; new focused `HomeQuickLinks.tsx`/CSS if needed; relevant existing unit/e2e tests and final audit report. Only touch other related component files when required to retain content.

1. Read approved prototype A and current components/tests. Write failing regression assertions for new hero and navigation/content preservation; do not pin incidental CSS or copy.
2. Integrate Task1 player. Heading/copy/CTAs match approved prototype. Preserve stable `#aktuell`, `#service`, existing section and navigation landmarks. Keep SSR main content.
3. Restyle homepage as one coherent editorial page: complete equally weighted DE/NL, strong party-service picture band using approved existing asset, generous typography/spacing and calm white/offwhite surfaces. Keep all content contracts and existing section reachability including giveaway, jobs and academy. No duplicated heroes and no stale prototype data.
4. Harmonize shared header/footer within existing navigation structure; keep original logos and NL strip. Avoid broad CSS changes to transactional widgets; any tokens affect all pages and require targeted checks.
5. Update only intentionally superseded tests (old hero-photo-only and no-video assumptions). New resource contract: only approved hero video allowed; reduced-motion/saveData must remain video-download-free, poster/image budgets remain constrained. Preserve old accessibility/navigation/content assertions.
6. Run targeted tests, full unit suite, lint, TypeScript, build; start/check localhost3000 and changed routes. Run responsive browser/e2e for homepage, Team&Karriere menu, NL entry, flyerviewer, player and representative subpages. Controller performs visual QA and independent review. Fix confirmed regressions before commit/push. Final audit distinguishes local preview, Git synchronization and public release status.

## Release boundary

Do not edit server/current or toggle services. Finish with actual Next preview and verified source commits. Sitewide design is reviewed visually before separate public release. No claim of being live merely from Git push.
