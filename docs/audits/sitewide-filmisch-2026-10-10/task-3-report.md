# Task 3 — collection families

Date: 2026-10-10. Worktree: `/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production`. Base: `537116d7174c32d3ef4f81886c49ae708144d387`. Local-only work; no push, build, server restart or deployment.

## Implementation and interfaces

Consumed the existing pure `PageIntro` and editorial tokens/classes. No shared interface changes. `FlyerIndexView(index, compact)`, `ProductCatalogue(children, content, initialSearch)`, `WeeklyOfferGrid(content, category, search, language)` and `GiveawayCard(giveaway, status, label, layout)` retain their existing props and data selection. Added presentation-only `data-collection` markers and an accessible live offer-result status.

Own production files:

- `components/editorial/collection.module.css` (new scoped family compositions).
- `components/FlyerIndexView.tsx`, `components/ProductCatalogue.tsx`, `components/WeeklyOfferGrid.tsx`, `components/EigenmarkenShowcase.tsx`.
- `components/giveaways/GiveawayCard.tsx`, `components/giveaways/giveaways.module.css`.
- `app/kategorie/[slug]/page.tsx`, `app/eigenmarke/page.tsx`, `app/regionale-spirituosen/page.tsx`, `app/geschenkideen/page.tsx`, `app/marktleben/page.tsx`, `app/galerie/page.tsx`, `app/gewinnspiel/page.tsx`, `app/gewinnspiel/archiv/page.tsx`.

Own tests:

- `lib/cinematic/__tests__/sitewide-collections.test.tsx` (new, 10 real-render checks).
- `e2e/sitewide-collections.spec.ts` (new, 40 real-clock cases: 33 page/viewports, 3 search/404/navigation, 3 real DE/NL viewer controls, 1 cross-family client-navigation case).
- `lib/__tests__/giveaway-pages.test.tsx` (two obsolete blanket `<header>` prohibitions replaced by exactly one editorial header and continued rejection of duplicate banner/footer, forms and embeds).

Composition: left-aligned editorial introductions; bounded search/category/language toolbar; clean full-original offer cards; large alternating own-brand poster/text stories; regional image/text stories; gift advice alongside full source imagery; larger market image groups and text stories; natural portrait grid with names only and original approved logo placeholder; quiet agenda/archive with complete giveaway covers and real dates. Removed old gradients/glows/rounded card bands from the owned composition. `EigenmarkenShowcase` is now a pure component; no current caller was found, but its six original posters and destinations are preserved.

No changes to recipes, offer selection/refresh/date logic, source warnings, verified cover/source hashes, current data, APIs, private services, assets, manifests, media or application activation. `/angebote`, `/handzettel`, `/produkte` remain thin existing route wrappers. The real `bier` category slug was verified. All 128 current DE/NL original offers were present during the real-clock run; expectations derive current validity from Berlin date, not a forced test clock. Flyer viewer counts derive the actual `/api/content/flyers` response.

## TDD and focused verification

RED, before production edits:

`NODE_ENV=test npx vitest run lib/cinematic/__tests__/sitewide-collections.test.tsx --maxWorkers=2`

Result: 1 file failed, 10 tests failed as expected (9 missing shared editorial introductions/collection bodies; 1 missing catalogue live result-status semantics). No import/setup failure.

Focused command:

`NODE_ENV=test npx vitest run lib/cinematic/__tests__/sitewide-collections.test.tsx lib/__tests__/product-catalogue-shell.test.tsx lib/__tests__/flyer-locale.test.tsx lib/__tests__/weekly-offer-cards.test.tsx lib/__tests__/content-verification.test.ts lib/__tests__/public-side-pages.test.tsx lib/__tests__/market-photo-rubrics.test.tsx lib/__tests__/desktop-photo-placement.test.tsx lib/__tests__/giveaway-pages.test.tsx lib/__tests__/giveaway-covers.test.tsx lib/cinematic/__tests__/team-gallery.test.tsx lib/cinematic/__tests__/academy-discovery.test.tsx --maxWorkers=2`

First result: 183 passed, 2 failed in `giveaway-pages.test.tsx` because the new semantic PageIntro is a `<header>`. Narrow assertion rebase described above; no date/source/business guard removed. GREEN rerun: 12 files passed, 185 tests passed, 8.24 seconds.

`npx tsc --noEmit` passed (exit 0). Changed TSX/TS-file `npx eslint` passed with zero warnings/errors after adding explicit existing alt values to image spreads and React keys to the table-driven test elements. Initial lint had 9 JSX-key errors and 4 image-alt-spread warnings; all repaired. `git diff --check` passed.

## Browser verification and screenshots

Root-owned marked development server: `http://127.0.0.1:3000`; real clock; no `CINEMATIC_TEST_NOW`, new fixture or interception in these tests. No forms submitted and no external source/social destinations opened. All browser commands used explicit `PLAYWRIGHT_BASE_URL` and one worker. Heavy tests and browser runs were serialized under the controller's publication lock.

Initial command: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test e2e/sitewide-collections.spec.ts --workers=1`.

Initial result: 32 passed, 7 failed. Six interaction failures (search-empty and viewer, each at 390/768/1440) were test readiness errors: typing before client hydration or focusing the intentionally disabled pre-hydration viewer trigger. Tests now await the real offer refresh response and assert the viewer button becomes enabled before focus/Enter. No forced click, error-list reset, production behavior change, fake clock, skip or removed assertion was used.

One additional runtime observation: `/produkte` at 1440px emitted `Invalid or unexpected token` during the first sweep while a live HMR update was occurring. This is recorded, not suppressed or declared a proven HMR diagnosis. The unchanged-production-code isolated rerun and full rerun had no runtime/hydration errors. Final rebuilt-production runtime scan must independently confirm absence.

Targeted rerun: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test e2e/sitewide-collections.spec.ts --workers=1 --grep 'no-match|keyboard|/produkte collection'` — 9 passed (1.3 minutes).

Full rerun of the original matrix: same full command — 39 passed (2.7 minutes), including real DE/NL dialog activation, initial lazy iframe absence, local PDF URL, initial focus, Shift+Tab containment, Escape close and trigger focus return at all three widths. All visible images decoded, with contained crops or natural ratios, no horizontal overflow, all six brand headings, seven exact portrait names, full source-linked giveaway originals, 12 agenda slots and date-correct archive sets.

Additional cross-family client-navigation check: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test e2e/sitewide-collections.spec.ts --workers=1 --grep 'client navigation'` — 1 passed (2.4 seconds). Real footer/main links moved through own-brand → gifts → market → team → giveaway pages without losing scoped heading composition, portrait count or overflow/runtime guards. Thus all 40 cases in the final file passed, as the complete 39-case matrix followed by this new separate case.

Scratch image directory: `.superpowers/sdd/2026-10-10-sitewide-filmisch/screenshots/`. 45 Task 3 images, not staged or force-added:

- `task3-{angebote,handzettel,produkte,kategorie-bier,eigenmarke,regionale-spirituosen,geschenkideen,marktleben,galerie,gewinnspiel,gewinnspiel-archiv}-{390,768,1440}.png` (33 captures; catalogue is viewport-size because all 128 cards produce an excessively tall full-page image).
- `task3-{offer-first,offer-last,no-match,invalid-category}-{390,768,1440}.png` (12 additional captures).

Actual screenshots were viewed, including full real DE/NL handzettel at mobile/tablet/desktop, all six alternating brand stories, full regional posters, gift photos, all seven portraits/placeholder, market groups, current/archived giveaway covers, catalogue toolbar and first/last originals, and the search-empty focus state. Images retain full motifs; portrait dimensions are natural and deliberately not forced to a uniform crop. The existing shared viewer's same-size full-column cover boxes were verified on real `/handzettel`; no shared viewer CSS change was needed. The black Next development badge in screenshots is development-only chrome, not a production site element.

## Remaining gates and deviations

- Required full web library suite, run once after browser work: `NODE_ENV=test npm test -- lib --maxWorkers=2` — 97 files passed, 1,596 tests passed, 58.74 seconds, exit 0. No failed tests skipped or hidden.
- Final `npx tsc --noEmit`, changed-file lint and `git diff --check` passed with exit 0. Exact lint command: `npx eslint components/FlyerIndexView.tsx components/ProductCatalogue.tsx components/WeeklyOfferGrid.tsx components/EigenmarkenShowcase.tsx components/giveaways/GiveawayCard.tsx app/kategorie/\[slug\]/page.tsx app/eigenmarke/page.tsx app/regionale-spirituosen/page.tsx app/geschenkideen/page.tsx app/marktleben/page.tsx app/galerie/page.tsx app/gewinnspiel/page.tsx app/gewinnspiel/archiv/page.tsx lib/cinematic/__tests__/sitewide-collections.test.tsx lib/__tests__/giveaway-pages.test.tsx e2e/sitewide-collections.spec.ts`.
- Local implementation commit: `8bc9e74` (`feat: extend editorial design across collection pages`). Only the 18 explicit own production/test files were committed; this report and screenshots remain scratch by instruction. Post-commit `git status --short -- app components lib e2e` and staged-file list are empty. No push.
- Controller owns independent code review, final production build/runtime/visual scan and durable screenshots. No subagents spawned from this task per explicit assignment. Requesting-code-review skill was read and the handoff review requested from controller.
- Shared `app/not-found.tsx` still has its prior design; its customer-visible 404/backlink behavior passed here. Controller confirmed global 404 redesign is Task 5-owned, not duplicated in Task 3.
- The old `e2e/giveaway-covers.spec.ts` was neither modified nor run: its July/September assumptions were already identified by preparation notes. Hash/source/full-cover contracts were instead retained and exercised by the focused existing unit suites and new real-clock browser tests. Broad metadata/chrome modernization remains final-integration work.
- Protected-path diff against task base (`data assets public services app/api`) was empty. All 32 foreign old screenshot modifications, the application interim report, 11 foreign historical content-run files and the controller's plan note were left untouched and unstaged.
- User-facing cache note for the final controller response: Im Browser bitte Strg+Shift+R (Mac: Cmd+Shift+R) drücken, damit der Cache bypasst wird.
