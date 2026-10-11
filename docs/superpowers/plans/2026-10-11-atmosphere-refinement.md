# Atmospheric website refinement — implementation plan

> **For agentic workers:** Execute the approved five-point design with parallel, disjoint component ownership and a final independent review. Steps use checkbox notation for tracking.

**Goal:** Replace monotonous presentation with warm photography, strong brand contrast and consistent, accessible editorial framing, initially in the local preview only.

**Architecture:** Keep the existing Next.js server/client boundaries, public page families and content loaders. Refine shared presentation components; the approved garden-party image with Jammers decal replaces the unrelated beer display. No new dependencies or business logic.

**Tech Stack:** Next.js 16.3.8, React 19, CSS Modules, Sharp, Vitest and Playwright.

**Spec:** The five-point recommendation in this conversation, approved by “führe schritt 1-5 jetzt durch deiner empfehlung”, plus the separately approved generated garden-party image with logo.

## Global constraints

- Local preview first; no Hetzner deployment or service/security changes.
- Preserve original weekly data, flyer validity and complete untrimmed posters/PDFs; never show expired covers in the entry cards.
- Preserve all original contact logos and destinations. No new employee or documentary claims about generated imagery.
- Preserve reduced-motion/save-data behavior, semantic labels, 44px targets and keyboard focus.
- Ordinary market category photos may use individually reviewed editorial crops; source files remain unchanged.
- Preserve unrelated dirty screenshots and application audit files. Commit/push only this work after verification.

## Review focus

1. Empty, DE-only, NL-only and paired current flyer states retain sensible entry copy and destinations.
2. Mobile crops retain people and the branded dispenser in the party-service image.
3. Offscreen/blocked/reduced-motion video retains usable controls and never starts unexpectedly.
4. Shared underpage surfaces do not reduce form, price, navigation or focus readability.
5. SVG arrows stay decorative, inherit color and never alter links or render as emoji on iOS.

## Tasks

- [x] **1 — Film controls:** HeroFilm.tsx and hero-film.module.css. Add/update rendered regression tests, prove failure, remove visible caption band, place accessible control inside media; re-run film tests including reduced-motion/error states.
- [x] **2 — Entry cards and service:** HomeQuickLinks.tsx, CinematicHome.tsx, ServiceSection.tsx, dedicated atmosphere.module.css, party image and provenance. Add rendering tests for flyer permutations and destinations, prove failure, implement red/party/market entries and concise service feature; optimize approved image without content changes.
- [x] **3 — Category cards:** AssortmentSection.tsx and category rules in warm.module.css. Browser/render tests first; four desktop/two mobile cards, selected cover crops, restrained footer tones, remove numeric labels, always-visible names, motion preference support.
- [x] **4 — Shared continuity:** ArrowUpRight.tsx replaces decorative arrow characters in active public components and NL. Tune shared PageIntro/editorial and footer surfaces while retaining white working panels. Verify semantic SVGs, shared route contracts and keyboard navigation.
- [x] **5 — Integrated verification:** Run unit suite and separately record known native service prerequisite failures, web suite, TypeScript, lint, production build, focused desktop/mobile/browser/axe checks. Independently review final diff, fix in-scope regressions, capture local screenshots, open preview. Save only owned files in the final commit/push.

## Progress

- Synchronized origin/codex/cinematic-production with fast-forward check; existing linked worktree reused.
- Baseline contains only unrelated historical screenshots, application audit notes and content reports; preserved.
- Implementation requested explicitly; no additional design or execution-method approval needed.
- Results and baseline limitations: `docs/audits/2026-10-11-atmosphere-refinement.md`. No public release performed.
