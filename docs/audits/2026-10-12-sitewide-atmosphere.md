# Sitewide atmosphere — local acceptance, 2026-10-12

Scope: the actual Next website, Tasks 1–3 of the approved sitewide-atmosphere design. Local presentation acceptance only; no deployment, push, operational activation or native-application qualification.

Layout candidate: `3cf109a52c9ca1fde245ad43ef772dc2907716ca`, building on foundation `3acf4e4` and Eigenmarken/detail `a3b6075`. The final candidate additionally inserts one literal JSX space in the Pralle Kirsche h1 so native text and accessible name retain the proper product name. The final fresh preview and focused verification are recorded below; the large layout matrix is explicitly evidence from the preceding layout candidate.

## Delivered presentation

Shared contained-media intros and cool white/gray/graphite continuity now connect collections, learning, transaction, tools, giveaways and the Dutch landing page. Offers retain coral/red distinction and original white offer/flyer cards. Academy imagery remains educational. The NL page retains its Dutch copy and original market image with orange accents. Legal and transaction surfaces remain quiet and readable.

Category introductions explicitly select beer, fresh, wine or spirits lighting with four approved original portrait photographs: bueble-aufbau, spezi-regal, weinregal and baileys-aufbau. Sekt uses wine lighting without unrelated media; pantry remains neutral without an invented photograph. A short notice distinguishes photographic displays/prices from current released offers. Valid academy/recipe/job templates explicitly select their intro mood without broadening the closed route map. The existing garden-party illustration appears in the party planner and rental service intros only.

The preceding approved tasks supply the unchanged short homepage structure, native six-original-bottle Eigenmarken world and Pralle Kirsche detail. No original image, business data, provider, API, legal text or operational state was rewritten by Task 3. Original contact icons, team placeholder/names, frozen V6/film controls and disabled applications/rental/newsletter configuration remain intact.

## Verification results

| Gate | Result |
| --- | --- |
| Full web Vitest, native application service excluded | 131 files / 2,418 passed |
| Repository lint | 0 errors, 20 pre-existing warnings |
| Next type generation + TypeScript | Passed in isolated snapshot; final test-only TypeScript also passed |
| Original offers check | 210 original offers/images verified |
| Protected-file integrity | 406 checked, zero mismatches |
| Public census | All 252 renders passed: 41 templates + 404 × 360/1440px × normal/reduced-motion/no-JS |
| Additional atmosphere acceptance | 8 unique cases passed, including original portraits, valid/unknown moods, no-JS brand navigation, empty category and 390/768px drawer/inquiry |
| Existing core navigation/academy/rental/quantity/planner regressions | 54 unique cases passed, including a focused rerun after a stale keyboard-test correction |
| Collection/learning/tool families | 54 passed at 390/768/1440px |
| Applicable subpage context/contact continuity | 6 passed |

The initial 259-case atmosphere run passed 258, with one missing native-title separator failure. A temporary whitespace-tolerant assertion and the added empty-category case then passed two focused cases. Review correctly rejected tolerance as masking a semantic defect. The final test requires exact native text and accessible heading name `Pralle Kirsche.`; the production h1 now includes a literal space before its visual line break. Strict unit and no-JS production RED checks confirmed the original defect before the fix. The final focused GREEN is recorded separately, not represented as a second full 260-case run.

The core run initially passed 53/54. The legacy Escape test tried to focus a hidden submenu link without opening its native disclosure. Corrected assertions now open the submenu, verify first Escape returns focus to its summary and second Escape returns focus to the mobile trigger; all keyboard assertions are preserved. Navigation implementation is unchanged.

The family tests cover current source-bound offers, complete DE/NL flyer covers and keyboard viewers, search no-match, brand anchors, academy all-lesson progression, quiz failure/retry/pass/history, tools and game dialog states. Inquiry checks use native required-field validity without opening a mail/WhatsApp draft. Drawer focus trapping/return remains verified. All census images are loaded and decoded; relevant original documents/product images retain contain rendering. There was no overflow or collected runtime/hydration error in the census.

## Real-current content and safe test boundary

GET-only production evidence: `/api/content/offers` v2 has 82 currently released offers and two flyers. Category counts: beer 23, sekt 2, fresh 26, wine 9, spirits 18, pantry 4. `/api/content/flyers` supplies the current DE `catalog-13027-42-2026` and NL `nl-2026-10-12-de-maas-driehoek` sources. `/api/rentals/config` remains `enabled:false`, `testMode:false`, `onlinePayment:false`; `/api/bewerbung/config` remains disabled.

Every browser context, including manually created no-JS contexts, used a guard aborting non-GET/HEAD and non-loopback requests before network. Existing tests used a snapshot-only import substitution to the guard fixture; assertions otherwise remain source assertions apart from documented obsolete presentation expectations. Attempted blocked requests would be logged; no blocked-request log was produced. No draft buttons, live handler POSTs, external account searches, uploads, payments or operational activations occurred. The browser-only empty-category response fixture removes beer offers from the fetched response without changing the production clock or source data. `audit:public` was intentionally not run because it makes POST probes.

## Build, preview and evidence

Fresh tracked-source snapshot: `/private/tmp/jammers-atmosphere-preview-3cf109a-task3`, with no environment secrets and a dependency symlink. Existing repository `.next`, `.next-dev`, port 3000 and port 3130 were preserved.

`NODE_ENV=production npm run build` failed before app compilation because Turbopack rejects the snapshot's external `node_modules` symlink. The approved supported fallback `NODE_ENV=production npm run build -- --webpack` passed. No project build configuration was modified. This is not a claim that the default build passed or that a Linux release is qualified.

Initial owned preview was `http://127.0.0.1:3131`, listener PID 55199. It was superseded by the fresh final preview below. Actual overview, Pralle detail, category, academy, rental and NL preview tabs were requested in Codex; the UI reported them queued.

Evidence: `/private/tmp/jammers-atmosphere-acceptance-2026-10-12/` contains 40 new full/viewport screenshots, family/context captures and `capture-proof.json`. Full command logs and safe fixture are in `/private/tmp/jammers-atmosphere-task3/`. Representative mobile/desktop screenshots were visually inspected, including brand originals, category portraits, academy, rental, Dutch landing and contact. Foreign audit images/documents were not staged or overwritten.

## Remaining boundaries

Final text-delta candidate: `83f817c45ccbe6e1eac6d8af02c749c05639a7e8` (production space fix in `0420db5`, followed by test-regex compatibility fix). Fresh snapshot `/private/tmp/jammers-atmosphere-preview-final-3132` passed typegen, TypeScript and `NODE_ENV=production npm run build -- --webpack`. The complete final web suite again passed 131 files / 2,418 tests (32.00s); final scoped lint and TypeScript passed. The final preview is `http://127.0.0.1:3132`, listener PID 58951, left running. At both 360 and 1440px with JavaScript disabled the h1 text is exactly `Pralle Kirsche.`, with no overflow; proof is `final-title-proof.json` and `final-pralle-{360,1440}.png`. Focused final production smoke results are recorded in the task report; the 252-case layout matrix above remains explicitly associated with `3cf109a`, not this final candidate.

Final production smoke: 52 representative atmosphere/native-title cases passed (37.2s), plus 29 navigation/academy/accessibility cases passed (19.4s). Final integrity remains406/zero mismatches; no blocked request attempts were recorded. The obsolete owned3131 process was stopped after verifying its PID/cwd; other previews were preserved. Final runner color variables were unset; earlier NO_COLOR/FORCE_COLOR messages were runner warnings, not app-console findings.

No unresolved visual defect was found in the scoped local checks. Independent whole-branch review remains the controller's gate. Ten known cocktail-photo gaps retain existing fallbacks. Native applications remain excluded/unqualified. Live readiness requires a fresh normal Linux release and separately authorized public/operational checks; none is inferred from this Mac webpack snapshot. No push or deployment was performed.

For the preview, hard-refresh with Cmd+Shift+R (Mac) or Ctrl+Shift+R.
