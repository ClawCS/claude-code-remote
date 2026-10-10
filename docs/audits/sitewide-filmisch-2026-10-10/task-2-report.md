# Task 2 — complete homepage and Dutch landing composition

Status: DONE_WITH_CONCERNS (controller-owned integrated production/native acceptance remains; no known unresolved landing defect).

Base: `c7af6741eb1da39ff01fdf84021fc612b16855fe`, branch `codex/cinematic-production`. Fetch + fast-forward check reported already up to date before edits. Commit recorded below after verification. No push/deployment performed.

## Implementation and interfaces

- Home progression keeps the existing film/quick links, followed by equal-weight DE/NL editorial offers, one coherent party/service feature, assortment navigation and three alternating large market stories, a six-brand story plus the three original posters, dated giveaways/actions, team/career, GrailBid and Instagram/contact.
- CurrentSection keeps `HomepageContent`, source URLs, actual validity dates, page counts and `FlyerViewer` interface/logic unchanged. At desktop each equally wide offer pairs source copy with its complete original cover; tablet/mobile deliberately stack inside the cards. Shared viewer CSS now lets complete covers occupy their available column instead of a fixed 21rem maximum. Other viewer consumers inherit that sizing only; no viewer logic changed.
- Removed the repeated service list and five-price strip. The single feature retains `/vermietung`, `/partyplaner`, `/kontakt`, personal availability/conditions and dated-flyer warnings. Added the explicit non-reservation warning. Rental catalog data and pricing logic are untouched.
- Market discoveries use existing operator/Canva-approved images at a larger scale, alternate image/text on desktop, and preserve full gift/product motifs. Assortment, academy, cocktail, market, gift and regional entrances remain.
- Six brand names come from existing `eigenmarken`; the existing approved original six-bottle image is reused. All six names lead to `/eigenmarke`; all three original posters remain complete and in their original order. No new product properties or media added.
- Team story keeps Sven/Niko hero plus seven current portraits and the approved new-photo placeholder. Native disclosure makes the long portrait group available without another permanently expanded grid; direct team and career entrances are visible before it. Excluded people/photos remain excluded.
- Removed decorative TCG card-stack graphics; retained an explicit external GrailBid entrance and the development-status warning. Consolidated the empty action/social copy and reduced the oversized Instagram fallback typography.
- `/nl` owns its existing single header/main/footer, uses shared paper/surface/type tokens, a light information bar and restrained orange accent. Localized route/WhatsApp controls and German-destination labels remain. Added the six-brand story and visible team entrance using existing data.
- New server component `components/cinematic/NlCurrentSection.tsx` consumes the existing `FlyerIndex` and existing viewer. It preserves both original flyers, localized controls, missing-NL notice, no-current notice and future-edition dates. Noncompact `/handzettel` composition is untouched.
- Existing gated `/test-fixtures/weekly-flyer` accepts only synthetic `landing=nl&state=long|empty` additions; original default fixture stays. Gate remains `NODE_ENV !== production && CINEMATIC_E2E === 1`, no clock override. No new public route or loader/data changes.
- `CinematicHome` and film/player/media files needed no edits. Header props and landmark ownership unchanged. No source assets, public media, loaders, weekly packages, mail, security, application, payment or operating configuration changed.

## RED / GREEN evidence

Used TDD and writing-good-tests: tests render real components with deterministic publication inputs; only Next's static-image/server-only boundaries and the flyer data-loader boundary are adapted in Node.

1. `env -u NO_COLOR -u FORCE_COLOR NODE_ENV=test npx vitest run lib/cinematic/__tests__/sitewide-landings.test.tsx --maxWorkers=2`
   - Initial setup attempt hit Next's `server-only` resolver guard (no tests ran); corrected the test-environment adapter, not production.
   - Actual RED: 4 failed, 2 passed. Failures: duplicate service/price list; missing all-six-brand representation; missing team/career/editorial entrances; unlabeled old NL flyer section.
   - GREEN: 6/6, subsequently included in the final 63-test focused run.
2. `env -u NO_COLOR -u FORCE_COLOR PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test e2e/sitewide-landings.spec.ts --workers=1 --grep '1440px'`
   - Layout RED: home flyer copy still above the cover (`heading right=672`, `cover x=244.796875`); NL background was `rgb(255,248,239)` rather than shared neutral paper.
   - Responsive GREEN: 6/6 real home/NL tests at 390/768/1440.
3. Visual inspection caught intrinsic portrait sizing stretching the desktop service photo to 1438.140625px while the copy was 766.453125px. Added a browser regression requiring the image panel not to exceed its story-copy height. RED reproduced those exact measurements. Made the scene image fill a positioned panel rather than determine grid height; GREEN within the final browser run. Original image/crop focus remained unchanged.
4. Existing composition tests were updated only for intentional homepage composition changes: no five-price strip; poster-order test now scopes the actual poster rail so the new six-name list cannot confuse it.

## Final verification

- Final focused command:
  `env -u NO_COLOR -u FORCE_COLOR NODE_ENV=test npx vitest run lib/__tests__/rental-page.test.tsx lib/cinematic/__tests__/sitewide-landings.test.tsx lib/cinematic/__tests__/composition.test.tsx lib/cinematic/__tests__/css-audit.test.ts lib/cinematic/__tests__/hero-film.test.tsx lib/cinematic/__tests__/academy-discovery.test.tsx --maxWorkers=2`
  Result: **6 files, 63 tests passed**, 8.46s.
- Final browser command:
  `env -u NO_COLOR -u FORCE_COLOR PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test e2e/sitewide-landings.spec.ts --workers=1`
  Result: **9 passed**, 42.7s. Covers both actual landing routes at 390/768/1440, neutral palette, equal editorial flyer widths, full covers/posters, live anchors, no horizontal overflow, market alternation, all six brands, seven real portrait captions through the native disclosure, localized visit/team controls, synthetic NL long/empty states and unchanged play/pause/12-second finale at 390/1440.
- **One full web run only**, as instructed:
  `env -u NO_COLOR -u FORCE_COLOR NODE_ENV=test npm test -- lib --maxWorkers=2`
  Result: **95 files passed, 1 failed; 1585 tests passed, 1 failed (1586 total)**; 58.98s. Log: `.superpowers/sdd/2026-10-10-sitewide-filmisch/task-2-web-tests.log`.
  Sole failure: `lib/__tests__/rental-page.test.tsx > source-backed rental catalog > shows the same confirmed price unit in the homepage rental section` still expected `Referenzpreise je 3 Werktage` from the expressly removed strip. Rebased that homepage-only assertion to the full rental destination and request/availability warnings; all catalog price-unit and price-value assertions are unchanged. Repaired file passed all 9 tests in the final focused 63-test run. **No claim of a second all-green full web run**; controller will run integrated HEAD.
- `env -u NO_COLOR -u FORCE_COLOR npx tsc --noEmit`: passed after correcting inline custom-property typing with CSSProperties (initial TS2353 recorded, resolved).
- Changed-file ESLint (all changed/new TS/TSX including both landing test files and rental-page test): passed, no warnings.
- `git diff --check`: passed.
- Actual dev route HTML after edits contains `Sechs eigene Charaktere`, the non-reservation warning, `nl-current-title` and `Zes eigen karakters`. Both routes served successfully from `127.0.0.1:3000`. One transient first localhost request returned stale HMR markup; subsequent requests on both host spellings returned current markup, no permanent host divergence.
- Root restarted only its dev3000 process with `CINEMATIC_E2E=1` and explicit unset `CINEMATIC_TEST_NOW` for the marked fixtures. Root verified actual-time offers API still had 128 offers. Production3110 untouched. No heavy suites ran concurrently with the browser acceptance pass.

## Visual evidence

Base directory: `.superpowers/sdd/2026-10-10-sitewide-filmisch/screenshots/` (scratch evidence, not force-added).

- `task2-home-{390,768,1440}.png`, `task2-nl-{390,768,1440}.png`: full pages.
- `task2-home-{aktuell,service,sortiment,eigenmarken,menschen,grailbid}-1440.png`: full editorial sections.
- `task2-nl-{handzettel,service,bezoek}-1440.png`: localized section proof.
- `task2-nl-long-390.png`, `task2-nl-empty-390.png`: marked synthetic cases; not current production offers.
- `task2-film-finale-{390,1440}.png`: actual unchanged film at the six-bottle finale.
- `task2-service-viewport-1440.png`: normal scrolled viewport proof for skip-link investigation.

Inspected the saved offer/service/market/brand/finale visuals. Original covers and posters are contained, not cropped. Market scene/photo cropping is deliberate; the service scene keeps its existing `center 66%` focus. No synthetic replacement media created.

Some over-viewport locator screenshots include the offscreen yellow skip-link or Next development badge. Direct DOM/viewport verification found the skip link unfocused and correctly offscreen both before and after scroll (`translateY(-76px)`, rect y=-60, bottom=-16); focus reveals it at y=16, Enter moves focus to `main-content`. No accessible skip-link styling was hidden or altered to sanitize screenshots. Use normal viewport/final production captures for chrome appearance. Below-fold Schneider images remain lazy; the development LCP heuristic warning during scrolled screenshots is not grounds to eagerly load them in the initial viewport.

## Controller handoff / concerns

- Production build and final production visual acceptance are controller-owned and were not run/restarted here.
- Split browser commands for final acceptance (no dynamic skipping):
  - Marked dev3000: `env -u NO_COLOR -u FORCE_COLOR PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test e2e/sitewide-landings.spec.ts --workers=1 --grep '\[fixture\]'`
  - Production3110, with both test environment flags absent: `env -u NO_COLOR -u FORCE_COLOR PLAYWRIGHT_BASE_URL=http://127.0.0.1:3110 npx playwright test e2e/sitewide-landings.spec.ts --workers=1 --grep-invert '\[fixture\]'`
  - Production fixtures must remain 404.
- Historic `e2e/metadata-chrome.spec.ts` has preexisting July source-fixture expectations and now-obsolete homepage assumptions: lines 372–373 require `Deine Party. Unser Service.` / `Drei mit Charakter.`; `expectNaturalPeopleStory` assumes a permanently expanded portrait grid. Not rewritten or claimed passing; new Task2 checks cover the actual real composition and disclosure.
- Native application suites were intentionally not repeated. Inherited Task1 prerequisite failures: QPDF_TEST_PREREQUISITE in `file-validation.test.ts`, `reconstruction-visual.test.ts`, `parser-process.test.ts` (six cases), missing explicit pinned APPLICATIONS_TEST_QPDF in bare shell; controller also recorded required Poppler26.10.0 vs available26.05.0. No native/security settings changed and web success is not native success.
- Foreign audit screenshots, application documentation and content-run reports were preserved and excluded from staging.
- Local-preview reminder for final user handoff: **Im Browser bitte Strg+Shift+R (Mac: Cmd+Shift+R) drücken, damit der Cache bypasst wird.** This is local work only, not a public release.

## Commit

`544e95d` — `feat: complete filmic home and Dutch landing compositions`.

20 explicitly staged code/test files only. Post-commit scoped status is clean; foreign preexisting files remain outside the commit. Report/log/screenshots remain local scratch evidence as requested. No push performed.
