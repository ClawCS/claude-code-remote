# Subpage Visual Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry the approved warmer, bolder homepage design through every customer page and its navigation paths, without changing business behavior.

**Architecture:** Extend the existing shared PageIntro and family-level CSS Modules rather than replace page layouts or apply global overrides. Keep the independent NL, giveaway and academy-entry modules aligned. Add only contextual links for currently orphaned active tools; preserve the five primary navigation groups and exact legacy redirects.

**Tech Stack:** Existing Next.js 16.3.8, React 19, TypeScript, CSS Modules, Vitest, Playwright and axe; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-10-subpage-visual-continuity-design.md` (extension of the approved sitewide and visual-polish specs).

**Status:** Prepared for user review; no implementation yet. Preserve the previously selected subagent-driven method after confirmation. Baseline `70e0fc2` on `codex/cinematic-production`.

## Global Constraints

- Only local work; no Hetzner deployment, security, mail, upload, rental, payment or deletion activation.
- Do not change data sources, weekly packages, validity, prices, recipes, quiz logic, calculations, addresses or legal text.
- No new images; preserve original assets, credits, excluded-person rules and internal provenance.
- Preserve unrelated screenshots, private sources and audit files; stage explicit own paths only, then commit and push.
- Preserve the five main navigation groups and external destinations; do not introduce new operational features.
- 44px interactive targets, visible keyboard focus, reduced-motion, and no horizontal page overflow at 360/390/768/1440px.

## Review Focus

- Long German/NL titles at 360px or 200% zoom must wrap without hiding links or forcing page overflow (Task 1/2 browser assertions).
- Dark brand sections must override the existing public h1/h2 ink rule; all six target IDs, complete posters and readable focus states survive (Task 1).
- Shared transaction CSS also affects drawers, disabled application paths and error states; none may become unreadable or enabled (Task 2).
- Direct navigation and browser Back must retain the same shell and origin; new context links must work without JavaScript (Task 3).
- Real-clock expiry/empty content must keep the polished layout without reactivating stale advertisements; test-clock fixture checks stay separate from production (Tasks 1/3).

---

### Task 1: Shared page hierarchy and collections

**Files:**
- Modify: `components/editorial/PageIntro.tsx`, `components/editorial/editorial.module.css`, `components/editorial/collection.module.css`.
- Modify only if scoping requires: `app/eigenmarke/page.tsx`, `app/public-site.css`.
- Create: `lib/cinematic/__tests__/subpage-continuity.test.tsx`, `e2e/subpage-continuity.spec.ts`.
- Read/use: `lib/cinematic/tokens.ts`, `e2e/sitewide-design-cases.ts`; do not change their business data.

**Interfaces:**
- Consume the unchanged `PageIntro` props and existing CSS tokens `editorialHeading`, `extraBold`, `assortmentCream`, `charcoal`, `stageName`.
- Produce a warm full-width intro with constrained contents, 800-weight title and correct h1/breadcrumb semantics. No required new prop at existing call sites.
- Scope brand inversion using the existing `[data-collection="brands"]` container. Preserve six `id` anchors and original image src values.

- [ ] **Step 1: Write failing tests.** In `subpage-continuity.test.tsx`, assert PageIntro still renders exactly one h1, the original breadcrumb/action links, and a stable intro marker `data-editorial-intro`. In browser tests assert computed intro title weight 800 and warm `rgb(245, 236, 221)` surface on `/produkte`, `/marktleben`, `/cocktails`, `/kontakt`; no overflow at 360/390/768/1440. For `/eigenmarke`, assert all six original anchors exist, all posters decode and use contain, the brands container is `rgb(33, 30, 28)` and its headings have readable inverse color.
- [ ] **Step 2: Verify intended RED.** `NODE_ENV=test npx vitest run lib/cinematic/__tests__/subpage-continuity.test.tsx`; run the new browser assertions against the unchanged local dev server and record the missing marker/style failures, not unrelated infrastructure failures.
- [ ] **Step 3: Implement shared intro and collection styles.** Use one warm intro wrapper with the existing content width/gutters inside. Apply the spec's bolder heading tiers and selected warm collection panels; dark brand sections get explicit inverse heading/link rules. Preserve full-motif sizing, local images, prose and original URLs. Do not redesign nav, forms or homepage.
- [ ] **Step 4: Verify GREEN and collection contracts.** Run the new unit test plus `sitewide-foundation.test.tsx`, `sitewide-collections.test.tsx` and `sitewide-landings.test.tsx`. Verify affected routes on dev3000. Run browser intro/brand cases and inspect screenshot crops; automated CSS assertions alone are not visual approval. Check a synthetic no-current-flyer input locally in unit tests, without a production test clock.
- [ ] **Step 5: Review and commit.** Fresh task reviewer checks collection readability, intro compatibility across PageIntro callers, six original targets, no business changes. Commit only explicit task paths; report actual RED/GREEN evidence.

### Task 2: Learning, services, tools and NL continuity

**Files:**
- Modify: `components/editorial/learning.module.css`, `components/editorial/tools.module.css`, `components/editorial/transaction.module.css`, `components/giveaways/giveaways.module.css`, `components/academy-entry.module.css`, `app/nl/nl.module.css`.
- Extend: `lib/cinematic/__tests__/subpage-continuity.test.tsx`, `e2e/subpage-continuity.spec.ts`.
- Use existing checks: `e2e/sitewide-learning-tools.spec.ts`, `e2e/sitewide-service-pages.spec.ts`, `e2e/sitewide-landings.spec.ts`.

**Interfaces:**
- Consume the unchanged semantic classes and state attributes in learning, tool and service components; preserve their event handlers and data interfaces.
- Produce 700-weight editorial section headings and warm selected panels, while keeping legal/lesson reading measure and white form interiors. Preserve success/error/disabled states and original logo colors.
- NL keeps its orange accents, language and separate page composition; bring its heading weights, dimensions and section rhythm into the same system.

- [ ] **Step 1: Write failing browser cases for remaining families.** Assert stronger editorial headings on recipe/course, giveaway, rental, tool and NL representatives. Pin visible error/disabled states, legal reading width, NL title wrapping at 360px, and contain sizing for posters/covers. Reuse actual tested academy/finder/partyplaner/game/drawer interactions instead of screenshot-only static pages.
- [ ] **Step 2: Run the focused cases for intended RED.** `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/subpage-continuity.spec.ts --workers=1`; retain only the new style failures as RED evidence, not unrelated HMR/build races.
- [ ] **Step 3: Implement scoped family styling.** Update only editorial selectors and chosen panel surfaces; no blanket font scaling of all descendants. Keep all calculations, labels, error content, rental limits and application gates. Do not remove image credits or required operational notes.
- [ ] **Step 4: Verify behavior and visuals.** Run `NODE_ENV=test npx vitest run lib/cinematic/__tests__/subpage-continuity.test.tsx lib/cinematic/__tests__/sitewide-learning-tools.test.tsx lib/cinematic/__tests__/sitewide-service-pages.test.tsx`. Verify changed routes on dev3000, then focused browser states including 200% zoom and reduced motion. Use a new `.superpowers/subpage-continuity-2026-10-10/` evidence directory; never overwrite historical screenshots.
- [ ] **Step 5: Review and commit.** Fresh reviewer examines dark/light text contrast, NL consistency, long course headings and disabled form/drawer behavior. Commit only own files after fixes and review approval.

### Task 3: Contextual navigation and full local acceptance

**Files:**
- Modify: `components/ProductCatalogue.tsx`, `app/partyplaner/page.tsx`, `app/kontakt/page.tsx`, `components/FlyerIndexView.tsx`, `app/angebote/page.tsx`.
- Extend: `e2e/subpage-continuity.spec.ts`, `lib/cinematic/__tests__/subpage-continuity.test.tsx`.
- Correct only demonstrably stale relevant assertions: `e2e/public-route-consistency.spec.ts`, `e2e/relaunch-integrity.spec.ts`, `e2e/public-subpage-visual.spec.ts`.
- Make screenshot destinations configurable, preserving defaults: `e2e/sitewide-landings.spec.ts`, `e2e/sitewide-collections.spec.ts`, `e2e/sitewide-learning-tools.spec.ts`, `e2e/sitewide-service-pages.spec.ts`. Read `process.env.AUDIT_SCREENSHOT_DIR` before each historical default; the new continuity suite uses the same override.
- Create: `docs/audits/2026-10-10-subpage-visual-continuity.md`; update this plan and `AGENTS.md` with verified local-only status.

**Interfaces:**
- Add real relative contextual anchors exactly as specified: `/produkte` → `/finder`, `/partyplaner` → `/partyspiele`, `/kontakt` → `/leergut` and `/oeko-tracker`, `/angebote` → `/handzettel`.
- If needed add optional `showOverviewLink?: boolean` to `FlyerIndexView`, default false, enabled only by `/angebote`; compact NL rendering and `/handzettel` must not show a new self-link or German copy.
- No changes to `CINEMATIC_NAV`, product redirect targets or external links.

- [ ] **Step 1: Write failing route-link tests.** Assert exact context-link href/labels, the flyer overview link only on `/angebote`, no new main group and no auto-enabled paused links. Add actual-click paths from header to each host page and then its context destination at 390/1440px. Require same origin and one current shell on arrival and Back; repeat basic context-link navigation with JavaScript disabled.
- [ ] **Step 2: Run for intended RED.** Run the new unit/link cases before adding anchors. Record the absent links. Separate dated legacy fixture expectations from actual production-clock checks.
- [ ] **Step 3: Add the small contextual sections.** Use existing editorial link and section styles; keep links outside calculators/forms. Preserve existing labels/copy except the exact new link labels and “Gut zu wissen” section. Correct historical tests only where the already-approved header/image composition or redirect-only sitemap superseded their expectations; do not remove error detection or current data assertions. Add the evidence-directory override before rerunning existing screenshot suites. Replace hard-coded active-flyer counts in real-clock browser checks with the current dated API contract; retain exact two-flyer and expiry/empty assertions in gated synthetic fixtures. Intentional warm-surface changes require updated exact style assertions, not deleted checks.
- [ ] **Step 4: Full static/build verification.** `NODE_ENV=test npx vitest run lib app`; `npx tsc --noEmit`; `npm run lint`; `NODE_ENV=production npm run build`; `npm run offers:check`. Record native application-suite constraints separately; web success is not upload approval. No production fixture flags or test clocks.
- [ ] **Step 5: Refresh actual local production preview and test it.** Restart only the identified local3110 process using the new build, leaving unrelated servers alone. Run `AUDIT_SCREENSHOT_DIR=.superpowers/subpage-continuity-2026-10-10/screenshots PLAYWRIGHT_BASE_URL=http://127.0.0.1:3110 npx playwright test e2e/subpage-continuity.spec.ts e2e/sitewide-navigation.spec.ts e2e/sitewide-landings.spec.ts e2e/sitewide-collections.spec.ts e2e/sitewide-learning-tools.spec.ts e2e/sitewide-service-pages.spec.ts --grep-invert '\[fixture\]' --workers=1`. Run tagged fixture cases separately on the explicitly marked development fixture server; production fixture URLs must remain 404. Inspect representative full pages and states from every family, not only computed CSS. Report both run targets accurately.
- [ ] **Step 6: Full URL/original-content acceptance.** GET every canonical public route and 404 state from the sitemap/matrix, plus `/bewerbung` and missing-token state; require expected status, one main/h1 and no legacy shell/cross-loopback customer anchors. Iterate all 107 `data/products.json` aliases with manual redirects and concurrency at most four; require exact 307 and `/kategorie/${categorySlug}`. Run `npm run audit:public -- --url http://127.0.0.1:3110 --output .superpowers/subpage-continuity-2026-10-10/public-audit.json` (local only, its empty unauthenticated rejection probes are not real transactions). Require no new errors; unchanged weekly assets and gates.
- [ ] **Step 7: Whole-change review, documentation, Git and local handoff.** Independent reviewer checks spec coverage, all family screenshots and current native-test limitations. Record exact scope/results and any genuine remaining issue; update the plan's checkboxes only with evidence. Explicit-path commit/push and verify local/origin SHA. Open the real3110 site, explain local vs live, and give the mandatory cache-refresh hint. Do not deploy.

## Planning checks

- Independent builder check: no important unanswered question and no spec/plan conflict reported.
- Controller self-review: every route family is assigned; all five review-focus risks have tests; original aliases and operational gates remain fixed. Existing screenshot suites need the explicit new output directory and fixture segregation above before reuse.
- Implementation remains pending the short user review; this document is not a completion or release claim.
