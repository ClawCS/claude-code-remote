# Task 4 — learning and customer tools

Status: implementation complete; production-browser verification passed. Baseline `9a7c79b2cdcc125cfdf2a48bcb7dc27135b9ae4a`; branch `codex/cinematic-production`. No push, build, deployment, service activation or real submissions performed by this agent.

## Scope and interfaces

Recipes, recipe category/detail, academy overview/course/certificates, finder, litre-only planner, all eight game dialogs, deposit/history, eco/history/manual and retired community/fridge pages receive family-specific editorial layouts. Shared `AcademyEntry`, `AcademyCover`, `ProductCard`, `ProductGrid`, `SearchBar` retain existing props. `PageIntro` and global/shared Task1 CSS are consumed unchanged. Task5 receives the square border-block ProductCard styling; the old `product-text-card` marker was removed because its global legacy CSS rounded the cards.

Business data, quiz score thresholds, completion/unlock/reset rules, game scoring/timers, finder matching, litres calculation, deposit/eco formulas, session storage and provider/API gates remain unchanged. Source/license links and AI cover disclosures remain. Party dialogs now consume the existing focus/Escape/return-focus hook, with a stable close callback and labelled controls. No assumed employee or funding claim added; the unverifiable presentation claim “Von Profis aufbereitet” was replaced with self-paced-learning wording.

## RED evidence

- `NODE_ENV=test npx vitest run lib/cinematic/__tests__/sitewide-learning-tools.test.tsx --maxWorkers=2`: initial 15 tests, 14 expected failures exposing missing editorial intro/workspace, recipe structure, labelled course navigation and deposit controls; one retired/funding safeguard passed.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test e2e/sitewide-learning-tools.spec.ts --grep 'game dialogs have names' --workers=1`: one expected failure because the old dialog had no accessible dialog role/name.
- Added semantic lesson-section/jump-link regression after screenshot inspection exposed literal `##` headings. Focused run: 15 passed, one expected failure before implementation.
- Final presentation review added visible-label/accessible-name agreement and eco-mode pressed-state checks: 16 passed / 2 expected failures before the minimal markup/style fixes; no calculation/state transitions rewritten.

## Browser investigation (do not treat earlier runs as green)

- Initial combined browser run: 37 passed / 9 failed. Relevant failures: old muted text contrasted only 4.24 on warm surface, certificate pastel badge, obsolete catalogue arrow selector, incorrect nested eco-stat text assertion; one navigation raced an in-progress HMR edit. Scoped color fixes and presentation-selector corrections retain all original score/threshold checks.
- Second combined run: 44 passed / 5 failed. Existing behavior and accessibility suites all passed. Three full first-view matrix tests collected generic syntax errors; deposit390 remained unhydrated (input DOM4 but total0); academy1440 showed Next dev `JSON.parse` “Unexpected end of JSON input” overlay.
- Focused390 matrix repeated errors at certificates and eco with empty error stacks. No errors were discarded.
- Read-only executable HTML/chunk parsing with `vm.Script` found no bad executable body. A diagnostic with route-tagged `window.error` filename/line/column and actual response-body parsing ran15 navigations (5 routes×3), all with1h1 and deposit4=1€, zero window/page errors. Full13routes with axe-only also zero. At390/reduced-motion, certificates+eco×3 separately axe-only and image-decode/scroll/screenshot-only: zero errors in both comparisons. Cached responses can have unavailable bodies; no bad-body claim is inferred from that diagnostic limitation.
- Root performed a controlled restart of its dev3000 only, same Next16.3.8 webpack and dev fixture flag, real clock, no `.next` deletion/config/code change. Cold focused390 matrix passed1/1 in34s, same13routes/axe/decoded captures and zero pageerrors.
- Subsequent final combined dev run:47 passed /3 failed in4.1m. Errors now identify the shared `/_next/static/chunks/app/layout.js`: PiñaColada243:56 Unexpected end, academy375:29 Invalid token, whiskey180:42 Invalid token; desktop Piña202:29 and whiskey243:56. The affected whiskey pages did not hydrate (last-lesson click did not change lesson); desktop planner similarly did not respond. Tablet fullmatrix, all3 final-exam pass/fail/retry sequences, all24game states, original contracts and homepage/category/own-brand AcademyEntry traversal passed. Trace response body sizes for layout varied259157/69809/148168/37376 while ETag size field stayedf5343 and Last-Modified advanced across navigations. Trace content has size=-1 and no body SHA, so truncation/rewrite is a hypothesis, not proven by saved bytes. Preserved failures under scratch `task4-dev-test-results/`.
- Root authorized a controlled production comparison instead of more dev retries. Runtime cause remains unresolved; no ignored errors, skipped tests, force clicks, caching/compression workaround or app change attributed to the dev issue. Strict same browser acceptance will run against root-owned3110 after its build, fixture/testclock flags absent.

## Screenshot handling

New evidence only under `audit/screenshots/sitewide-learning-tools-2026-10-10`. Existing32 screenshot modifications, old application interim report and11 content-run files remain untouched/uncommitted by this task.

Capture scrolls each visible main image into view, waits for complete/naturalWidth and decode, then restores scroll. Root’s grey Rum Punch/Caipirinha/Hurricane panels were capture timing: final decoded image captures show all three; no eager-loading workaround. Game captures are viewport-sized for usable fixed-dialog evidence.

Personally inspected so far: planner-result390, Bier-PongScoreboard390 (old fullpage and corrected viewport), Cocktail-Quiz1440, whiskey1440 (old markers) and whiskey768 (semantic h3/jump/scroll navigation), academy-failed390, academy-final390, academy-passed768, finder-results390 (old version), corrected finder-results768, decoded cocktails-kategorie-rum390, eco-manual1440, deposit-history768, certificates390, Getr-nke-Tabu768 and Kings-Cup1440 (corrected viewport). Final production inspection list and green outcomes to follow.

## Final verification / commit

- Final focused command: `NODE_ENV=test npx vitest run lib/cinematic/__tests__/sitewide-learning-tools.test.tsx lib/__tests__/cocktail-photos.test.tsx lib/__tests__/cocktail-routes.test.ts lib/__tests__/party-planner.test.ts lib/finder-products.test.ts lib/__tests__/academy-certificates.test.ts lib/__tests__/product-card.test.tsx lib/__tests__/safe-public-functions.test.ts lib/cinematic/__tests__/academy-discovery.test.tsx lib/__tests__/public-side-pages.test.tsx --maxWorkers=2`:10files/159tests passed,8.25s.
- `npx tsc --noEmit`: exit0.
- `npx eslint` on all23 changed/new TS/TSX files listed below: exit0,0errors,2existing `react-hooks/set-state-in-effect` warnings in unchanged eco counter/history effects (current128/263); no business-logic rewrite to silence warnings.
- `git diff --check -- app components e2e lib/cinematic/__tests__/sitewide-learning-tools.test.tsx`: exit0.
- `NODE_ENV=test npm test -- lib --maxWorkers=2`:98files/1614tests passed in59.86s. Native/application suites intentionally reserved for root.
- Last content-shape inspection found mineralwasser also uses `###` subsections. Added real-course regression:18passed/1expectedRED; minimal parser extension maps those to h4 while preserving h2 lesson/h3 section hierarchy. Final focused new suite19/19passed; fresh TypeScript/changed-parser lint/diff-check completed. This tiny semantic extension followed the single full-web run; final root full-family suite remains required.
- Production browser result: **50 passed in2.4m**, exit0. Same strict tests, including all13route first views at390/768/1440, course jump+lastlesson access, real quiz completion/unlock/60%fail/retry/70%pass, finder3steps/results/empty/reset, litres, deposit save/history/delete, eco history/manual selected-state and figures, all24game inner states, modal focus trap/Escape/return-focus and shared AcademyEntry consumers. No runtime errors or skipped cases. Production success does not establish the root cause of the dev bundle delivery problem.
- Root provided a production comparison build (reported exit0, TypeScript clean,120static pages), server3110 with both cinematic flags absent. Root verified application/rental disabled gates and fixture404 before this agent's browser run. This does not replace final all-family root acceptance after Task5.

Browser command (same50 tests, no weakened guard): `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3110 npx playwright test e2e/sitewide-learning-tools.spec.ts e2e/cocktail-navigation.spec.ts e2e/finder-accessibility.spec.ts e2e/partyplaner-litres.spec.ts e2e/audit-ui-corrections.spec.ts --workers=1`.

Production evidence:105 PNGs in the own folder (102 matrix screenshots +3 focused quiz-feedback crops). All matrix captures regenerated from3110 and modification times checked—no stale dev PNG remains. A read-only Playwright capture of wrong-answer feedback at all3widths also finished with zero pageerrors. Final production images personally read: `academy-quiz-feedback-390`, `academy-passed-390`, all3 `academy-quiz-feedback-detail-*`, `partyspiele-768`, `cocktails-pi-a-colada-1440`, `akademie-390`, `finder-results-390`, `planner-result-1440`, `deposit-history-390`, `eco-manual-768`, `community-390`, `kuehlschrank-1440`, `game-Bier-Pong-Scoreboard-390`, `game-Cocktail-Quiz-1440`. Layouts/controls readable, correct active state, no overflow/obscured action found. Earlier inspection list above additionally covers intermediate family layouts and the corrected lazy-photo case.

Remaining concerns: unresolved development-only shared chunk parse/hydration behavior;2unchanged eco effect lint warnings. No production blocker observed. Global404, final metadata/chrome integration, Task5 consumers and final all-family/native acceptance remain root/Task5-owned. No public rollout authorized or performed.

Commit: `5c2a7c1` — `feat: bring learning and customer tools into editorial layouts`;131files (26source/test +105own PNGs),849insertions/561deletions. Explicit own-file staging only; cached diff-check clean. Scratch report/diagnostics were not force-added. No push performed.

## Exact source/test files

1. `app/akademie/[slug]/page.tsx`
2. `app/akademie/page.tsx`
3. `app/akademie/zertifikate/page.tsx`
4. `app/cocktails/[slug]/page.tsx`
5. `app/cocktails/kategorie/[slug]/page.tsx`
6. `app/cocktails/page.tsx`
7. `app/community/page.tsx`
8. `app/finder/page.tsx`
9. `app/kuehlschrank/page.tsx`
10. `app/leergut/page.tsx`
11. `app/oeko-tracker/page.tsx`
12. `app/partyplaner/page.tsx`
13. `app/partyspiele/page.tsx`
14. `components/AcademyCover.tsx`
15. `components/AcademyEntry.tsx`
16. `components/ProductCard.tsx`
17. `components/ProductGrid.tsx`
18. `components/SearchBar.tsx`
19. `components/academy-entry.module.css`
20. `components/recipes/CocktailPhoto.tsx`
21. `components/recipes/RecipeCollection.tsx`
22. `components/editorial/learning.module.css` (new)
23. `components/editorial/tools.module.css` (new)
24. `e2e/audit-ui-corrections.spec.ts` (only obsolete presentation labels;60%fail/70%pass/unlock/reset/calculation contracts intact)
25. `e2e/sitewide-learning-tools.spec.ts` (new)
26. `lib/cinematic/__tests__/sitewide-learning-tools.test.tsx` (new)

Source/data guard: `git diff --name-only -- data assets public services app/api lib ':!lib/cinematic/__tests__/sitewide-learning-tools.test.tsx'` returned no paths. No business modules, API, media or fixtures changed.
