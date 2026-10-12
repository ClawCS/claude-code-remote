# Fresh subpages and corrected film implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Publish the approved neutral subpage accents and correct V6 hero film without changing business content or operating permissions.

**Architecture:** Scope shared palette variables to customer subpage mains, not global homepage tokens. Use existing CSS modules and real components, remove the flyer component's token reset, and deliver immutable hash-bound V6 media with preserved historical files.

**Tech Stack:** Next.js 16.3.8, React 19, CSS modules, TypeScript, Vitest, Playwright and H.264.

**Spec:** `docs/superpowers/specs/2026-10-12-fresh-subpages-film-design.md`

## Global constraints

All spec preservation and release boundaries apply. Original weekly packages and photos remain byte-identical. No prototype proxy, injected banner or temporary URL enters production.

## Review focus

- Inline token resets and root-mounted drawers must not retain cream on subpages.
- All German PageIntro titles/actions must remain readable on graphite, including no-JS and mobile navigation.
- Offer images and keyboard focus must remain complete; semantic quiz/error states and own-brand dark scenes must not be recolored.
- NL orange identity and homepage/chrome root tokens must remain independent.
- Actual desktop/mobile film bytes, decoded frames and cache-bound filenames must match the approved V6 source, with old archives intact.

## Task 1: Native shared subpage palette

**Files:** `app/public-site.css`; `components/editorial/{editorial,learning,collection}.module.css`; `components/academy-entry.module.css`; `components/FlyerIndexView.tsx`; `app/nl/{page.tsx,nl.module.css}`; existing color assertions in three sitewide e2e files; new `e2e/fresh-subpage-accent.spec.ts`.

**Interfaces:** Existing route mains and data-learning/data-collection markers; add a neutral-palette class to NL main. No content DTO or business interface changes.

- [x] Write native browser expectations for white/gray/graphite scopes, course accents, complete offer images/focus and preserved homepage/NL/brand boundaries.
- [x] Run focused expectations against unchanged local website; expected color failures prove missing native palette.
- [x] Apply shared variables and native module rules. Remove full flyer token reset, preserve compact NL accent.
- [x] Run palette and relevant continuity browser gates, no-JS, mobile, axe and content checks. Expected: no failures, no overflow, unchanged original offer count and images.
- [ ] Stage/commit only reviewed own palette changes; preserve unrelated worktree edits.

## Task 2: Correct V6 delivery

**Files:** `lib/cinematic/hero-media.ts`; `assets/source/hero-film/provenance.json`; two new hash-bound public MP4s; media unit/browser assertions.

**Interfaces:** Existing HERO_MEDIA mobile/desktop/poster constants. Playback/reduced-motion controls stay unchanged.

- [x] Update expected active source to approved V6 master and exact desktop/mobile hashes; run tests first. Expected: old V4 source/path assertions fail.
- [x] Copy approved desktop preview unchanged, copy verified 628843-byte mobile derivative, and bind their exact hashes in constants/provenance. Archive V4 provenance in history; do not remove old files or change the poster.
- [x] Verify actual MP4 decode, dimensions, 360 frames/24fps/15s/no audio, original source hashes, immutable cache rules and responsive playback/pause/reduced-motion.
- [x] Run full local web suite, lint/typegen/TypeScript/offers/build. Expected: all documented web gates pass; native applications remain excluded/unqualified.
- [ ] Commit/push only own reviewed files and qualified report.

## Task 3: Publish and prove

**Files:** sanitized release audit and AGENTS current-release note. Follow `docs/DEPLOYMENT-RUNBOOK.md`.

- [x] Independently review the combined diff and scoped browser results.
- [x] Confirm current/rollback targets, free space and nine unchanged security hashes; no cleanup without separate authorization.
- [ ] Build/test a new Linux release from the exact committed archive, without test clocks or operating activation. Expected: Linux web subset/lint/types/offers/build pass.
- [ ] Atomically switch and restart only the existing Next service; bounded readiness check and rollback on failure.
- [ ] Run public content/audit/image checks and actual public browser playback/colors/links. Download/hash new MP4s and original weekly files. Expected: exact reviewed bytes and current 82 offers.
- [ ] Save/push sanitized evidence, mark real release ID/time and remaining out-of-scope service limitations accurately.
