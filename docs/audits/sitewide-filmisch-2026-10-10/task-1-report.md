# Task 1 — Shared editorial foundation and five-group navigation

## Scope and implementation

Worktree: `/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production`; branch `codex/cinematic-production`; base `a048f067ba3aefca66b1a90ecf6d82a9dc8d1020`. Fetched origin and fast-forward checked before editing (already up to date). No push, deployment, SSH, mail, payment, application activation, security configuration or content/data changes. Root-owned dev3000 used; production3110 not rebuilt/restarted.

- Shared global/home paper `#FAF9F6`, surface `#F2F0EC`, ink `#191918`; compatibility home token export now references the same shared style. Existing brand colors retained. Existing Jakarta family reused; technical Space Grotesk removed from layout.
- Native five-group header in approved order: Angebote, Sortiment, Party & Miete, Jammers entdecken, Dein Besuch. Party & Miete remains a direct `/vermietung` anchor with a separate, labelled 44px disclosure control. Party submenu exposes planner, rental selection, request list. Discover has the four approved thematic groups and every former destination; GrailBid remains an external link.
- Light info strip with unchanged address/hours and live Berlin status calculation. Nederlands and flag remain immediately visible on mobile. Desktop measures 32px strip + 92px header row (+1px border), 151px original logo. Mobile uses a 44px info strip and 72px header row; original logo is 126px. NL link retains a full 44px hit target, extending down into otherwise empty desktop header whitespace.
- Shared native disclosure rendering for desktop/mobile. Escape restores focus to the relevant summary; outside pointer and keyboard-generated clicks close unrelated panels. Nested Escape does not dismiss the entire mobile menu until the second Escape. Local Link destinations work after client navigation; no-JS native navigation remains available.
- Pure `PageIntro` and scoped editorial primitives, plus shared footer styles preserving all contact/address links and official original contact images. No blanket image-caption/border removal and no button `!important` overrides.
- Route case inventory includes all 37 rendered customer templates, five explicit redirect/admin/fixture exclusions, and a separate global404 case. Dynamic examples are checked against current category, cocktail and academy catalogs. Rental example `/mietbestellung/design-missing-token` is a controller-approved safe missing-token error state, not a claimed real order.

## Exact interfaces

`CinematicHeader({ nowIso, hasActions })` external props unchanged.

`PageIntroProps`: readonly `{ eyebrow?: string; title: ReactNode; description?: ReactNode; breadcrumbs?: readonly Readonly<{ label: string; href?: string }>[]; children?: ReactNode; className?: string; id?: string }`. Default export `PageIntro` renders one h1 and real breadcrumb links; no fetch, routing hook or client directive.

Editorial module exposes required `container`, `section`, `grid`, `card`, `primaryLink`, `secondaryLink`, `prose`, `field`, `notice`, `emptyState`, plus intro/breadcrumb/footer presentation classes. Interactive primitives have at least44px targets and visible focus.

Navigation types: `NavLink` retained; `NavGroup = {label; children}`; `NavDisclosure = {label; href?} & ({children} | {groups})`; `NavItem = NavLink | NavDisclosure`. `NavigationDisclosure` takes `{item: NavDisclosure; onNavigate?: () => void}`. The callback lets mobile close its outer disclosure after a destination click.

E2E exports: `SITEWIDE_DESIGN_CASES` entries `{family,template,path}`; `SITEWIDE_DESIGN_EXCLUSIONS` entries `{template,reason}`; `SITEWIDE_SYSTEM_CASES` for404.

## RED / GREEN evidence

1. `NODE_ENV=test npx vitest run lib/cinematic/__tests__/sitewide-foundation.test.tsx --maxWorkers=2`: initial RED3/3 expected assertion failures (nine labels vs five; old warm global palette; missing PageIntro assertion). Missing PageIntro used a glob existence assertion, not a failing import. After implementation the same three contracts passed; final test uses the real static import. Added route inventory/data validation brings the file to4 tests.
2. Focused six-file run (foundation/site/header-navigation/nl-entry/tokens/css-audit):29/29 passed before inventory test was added. Earlier CSS-audit failure exposed raw header spacing/type literals; converted them to category-correct shared tokens and reran green, without weakening the audit.
3. Self-review keyboard regression: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/sitewide-navigation.spec.ts -g 'keyboard navigation to another' --workers=1 --reporter=list`. RED desktop left one discover details open after pressing Enter on Sortiment from `/kontakt`; mobile passed. Added click dismissal (keyboard activation has no pointerdown); GREEN2/2.

## Verification

- Web suite: `NODE_ENV=test npx vitest run --exclude 'services/**' --maxWorkers=2`:95 files,1579 tests passed (baseline94/1575). Log `/tmp/sitewide-task1-web-tests.log`.
- Full project command: `NODE_ENV=test npm test -- --maxWorkers=2`:140 files passed,3 files failed;3058 tests passed,6 failed,15 skipped (3079 total),268.89s. Log `/tmp/sitewide-task1-full-tests.log`.
- Native failures are all `QPDF_TEST_PREREQUISITE` because this plain-shell run did not set an absolute pinned `APPLICATIONS_TEST_QPDF`. Failing suites: `services/applications/tests/file-validation.test.ts` (collection), `services/applications/tests/reconstruction-visual.test.ts` (beforeAll;15 skipped), `services/applications/tests/parser-process.test.ts` (six tests). Parser test names: actual versioned child inspection; malformed operations with version:true, version:2, operation:parse, extra:true, pageCount:20. No native code or safety prerequisites altered. QPDF12.4.2 is installed, but the bare command does not auto-configure its test env. The controller's separately recorded Poppler26.10.0 prerequisite baseline remains unresolved; available `pdftoppm -v` in this shell reports26.05.0.
- `npx tsc --noEmit`, eslint on all owned changed TypeScript files, `git diff --check`:passed before final event-handler regression; final rerun recorded below.
- HTTP HTML check on dev3000 `/kontakt`:200, new labels and global `--cinematic-color-paper:#FAF9F6` present. HMR server was never restarted.

## Browser evidence and self-review

Initial new navigation suite7/7 passed (51.8s), then isolated unchanged rerun7/7 passed (52.7s). Checks click all16 internal header destinations at390/1440, inspect links after client route transitions, click logo/NL, inspect external GrailBid target without opening it, test keyboard Escape/focus, navigate with JavaScript disabled at390/1440, and test768 overflow. Existing recipe/academy/career functionality is exercised by the accompanying suites; application config remains disabled and no upload input appears.

An intermediate combined run under concurrent full/native/web test load had22/24 pass and two first `/angebote` transitions exceed Playwright's default5s URL expectation. Isolated rerun passed with unchanged assertions and timeouts, no forced clicks. One older outside-dismissal test attempted to click the hero title now covered by the larger discover panel; it now clicks visible noninteractive info-strip text to exercise the same outside dismissal.

Saved local screenshots beside this report:

- `task-1-header-{390,768,1440}.png`
- `task-1-menu-{390,768,1440}.png`
- `task-1-home-1440.png`
- `task-1-footer-390.png`

Inspected menu390/1440 images against supplied screenshot/prototype; header spacing/light palette/logo retained, no horizontal menu overflow. Footer390 measures390px client/scroll width; Google Maps, WhatsApp, Instagram targets48px high, border0px, transparent backgrounds, original asset paths. Controller also independently viewed desktop/mobile dev header. Main contact page body visible in these screenshots is intentionally not yet converted—later task scope.

## Owned files / final gates

Production: `app/{globals.css,public-site.css,layout.tsx}`; `lib/cinematic/{tokens.ts,site.ts}`; `components/cinematic/{CinematicHeader.tsx,NavigationDisclosure.tsx,MobileNavigation.tsx,LocationFooter.tsx,chrome.module.css}`; new `components/editorial/{PageIntro.tsx,editorial.module.css}`.

Tests: new `lib/cinematic/__tests__/sitewide-foundation.test.tsx`; updated `site.test.ts`, `header-navigation.test.tsx`, `nl-entry.test.tsx`, `tokens.test.ts`; new `e2e/sitewide-design-cases.ts`, `e2e/sitewide-navigation.spec.ts`; updated `e2e/team-career-navigation.spec.ts`, `e2e/cocktail-header-navigation.spec.ts`. Existing social responsive spec unchanged, rerun.

Foreign audit screenshots, application interim doc, untracked content-run reports, and root's running audit document untouched/staged nowhere. This report is explicitly force-added despite the `.superpowers` ignore rule so the requested handoff travels with the commit; screenshots remain local handoff evidence, not application source.

Final gates: all 26 browser tests passed in the serial four-suite run (2.1 minutes; `/tmp/sitewide-task1-final-e2e.log`). No assertion weakening, forced clicks or timing increases. Final focused six-file run passed 30 tests. Final changed-file eslint, `npx tsc --noEmit` and staged diff whitespace check passed. The 95-file / 1,579-test web suite was run before the final event-handler-only keyboard correction; the correction is covered by its observed RED/GREEN regression and the final 26-test browser suite. No redundant broad suite or production build was run.

Status: DONE_WITH_CONCERNS solely for the explicitly documented native test prerequisites and deferred controller-owned production acceptance. No known unresolved Task 1 navigation defect. Subsequent page-family layouts are intentionally not claimed complete.

Hard-refresh handoff: Im Browser bitte Strg+Shift+R (Mac: Cmd+Shift+R) drücken, damit der Cache bypasst wird.

## Review round 1 — breadcrumb target (base e51aa76)

Verified the review finding: a short `NL` breadcrumb rendered only 18.671875px wide despite its 44px height. Added `min-inline-size: 44px`, centered alignment and `.25rem` inline padding to the scoped breadcrumb anchor rule. No other product behavior changed.

Regression lives in `e2e/editorial-targets.spec.ts`: actual browser layout of the breadcrumb primitive with the production stylesheet, at 390px, checking width and height >=44px and preserved `/nl` destination. The existing foundation unit file additionally checks that the real PageIntro renderer preserves the short label/link. Browser measurement intentionally stays in E2E so the ordinary Vitest suite does not acquire a Chromium prerequisite.

Exact evidence:

- `env -u NO_COLOR -u FORCE_COLOR PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/editorial-targets.spec.ts --workers=1 --reporter=list`: observed RED with the original rule, expected >=44, received 18.671875; restored sizing fix, GREEN 1/1. The final committed regression was also mutation-checked by temporarily restoring the original rule and observing the same failure before restoring the fix.
- `env -u NO_COLOR -u FORCE_COLOR NODE_ENV=test npx vitest run lib/cinematic/__tests__/sitewide-foundation.test.tsx --maxWorkers=2`: GREEN 5/5.
- `npx tsc --noEmit`; `npx eslint lib/cinematic/__tests__/sitewide-foundation.test.tsx e2e/editorial-targets.spec.ts`; `git diff --check`: all exit0 after the fix.
- dev3000 `/kontakt` HTTP check succeeded after the CSS edit. No server restart, build, deployment or full-suite repeat.
- Both color variables were unset for focused test commands; the conflicting NO_COLOR/FORCE_COLOR warnings disappeared without product changes. Use the same env prefix for later browser runs.

Only the scoped CSS rule, two focused test files, and this already-tracked report belong to this follow-up commit. No further scratch reports force-added.
