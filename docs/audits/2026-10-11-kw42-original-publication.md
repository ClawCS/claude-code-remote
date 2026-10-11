# KW42 reviewed original publication

Prepared locally on 11 October 2026 for the inclusive Europe/Berlin interval 12-17 October 2026. This evidence does not assert a production deployment or currently active offers on Sunday 11 October.

## Originals and complete census

- DE: official Goch store 13027, Werbekreis 3.6, catalog 1394743/v1. The unchanged ten-page original is bound with SHA-256 `a8dfe6b0a728982667ce83ac8eed0e527c6cf2b6d03dd7b10fcd857112f4f37e`, 6,829,343 bytes. Printed validity matches 12-17 October. Actual catalog acquisition timestamp: `2026-10-11T09:29:55.596Z`.
- NL: genuine one-page agency original, De Maas Driehoek, not a Canva export. The unchanged original is bound with SHA-256 `b669c22d2e7bcb6466af9771cf68573f935312556db0d58e24db9a6e5bfe448d`, 3,113,358 bytes. Printed KW42 validity matches 12-17 October.
- DE page counts: `[10,10,9,8,10,0,1,6,8,8]`, total 70. The PAYBACK page has no priced block; LEGO is one complete price family, not eight offers. NL contains 12 blocks in three rows of four. Total new offers: 82; stored total: 210. All 128 historical rows and both prior layout sources remain unchanged.
- Full uncut covers and PDFs use content-addressed immutable paths. Crops retain their source coordinates; exclusions are transparent, never moved or retouched. All five independently corrected geometries are present.
- Each offer retains stock/print disclaimers and relevant outside-crop conditions. These include APP/PAYBACK eligibility, two-crate quantity and per-crate deposit, separate Amecke bottle/crate prices, gift calculations, LEGO dates, comparison footnotes, award qualification, and food market restrictions. Warsteiner NL and Hertog Jan NL each have an individual arithmetic inconsistency warning; printed values are unchanged.
- The prior targeted Canva source check found no valid current/forthcoming Maasduinen original. No additional issue, date range or original was invented or published.

## Verification

- Normal bounded preparation fetched actual official bytes matching the reviewed SHA. Initial unreviewed preparation truthfully failed as staging-only. The final complete preparation after the copy review returned `packageVerified: true`, zero errors/warnings, on `2026-10-11T09:40:49.658Z`.
- `npm run offers:build -- --week 2026-10-12`: 82 complete original offers generated. `npm run offers:check`: all 210 originals and derivatives checked.
- Final 82 WebP crops have exact visible RGB pixels and alpha masks matching accepted preflight PNGs. RGB under fully transparent pixels is codec-dependent and is not asserted. All ten populated-page contact sheets and both complete covers were visually inspected.
- `npx vitest run lib/__tests__/content-weekly.test.ts lib/__tests__/weekly-publication.test.ts lib/__tests__/weekly-offer-metadata.test.ts lib/__tests__/weekly-offer-crops.test.ts lib/__tests__/flyer-packages.test.ts lib/__tests__/weekly-offer-content.test.ts lib/__tests__/weekly-public-routes.test.ts --exclude '.superpowers/**'`: 7 files / 197 tests passed.
- `npx vitest run --exclude 'services/applications/**' --exclude '.superpowers/**'`: 108 website files / 1,899 tests passed, exit 0. Native application-service tests are intentionally outside this website release gate.
- Scoped ESLint and `git diff --check`: exit 0, no findings.
- Isolated bound-selection clocks: 11 October 21:59:59.999 UTC -> 0 offers; 11 October 22:00:00 UTC (Berlin Monday midnight) -> 82; 17 October 21:59:59.999 UTC -> 82; 17 October 22:00:00 UTC (Berlin Sunday midnight) -> 0. All states `ok`; public projections contain no private paths or design identities.
- An isolated local runtime used real execution time, no test clock, and left the existing port 3000 runtime untouched. Current/flyer/typed-offer APIs returned HTTP 200 with null weekly slots and zero active offers. `/angebote`, `/handzettel`, `/nl`, `/produkte` returned HTTP 200 without future offer IDs.
- `npm run content:check -- --week 2026-10-12 --url http://127.0.0.1:3125`: zero errors, `websiteVerified: true`, `deploymentVerified: false`; expected preview-only warning. The local runtime was stopped after checks. Public/Linux release gates remain with the controller.
- Repeated final local check after the copy revision finished at `2026-10-11T09:41:53.359Z`, exit 0, zero errors and the same preview-only warning. Both final editions were `bound-and-verified`; the isolated runtime was stopped again.
- Independent visual acceptance passed all 82 crops. Final customer-condition copy review removed only technical generation-attribution sentences from Red Bull/Captain Morgan (attribution remains in the untouched originals and private source review) and corrected Pülleken to “ein Sixpack”. Pixels, numeric values and terms are unchanged. Serial target rebuild/rebind and `offers:check` passed, visible RGB/alpha and historical/boundary/privacy checks passed again; focused post-copy tests: 3 files / 87 passed. No production code changed after the full website suite.

## Acquisition timestamp regression

The normal preparation exposed a caller bug: targeting next Monday also wrote that target instant as `fetchedAt`. A controller-authorized two-line caller correction uses real acquisition time after fetch while preserving target-week validation and exact existing-bound metadata reuse. The new real CLI regression first failed on `1791806400000` (target Monday) exceeding actual execution time, then passed; the full content-weekly suite passed 28/28. No historical metadata was rewritten.

No push, deployment, production clock override, account operation, automation change, or unrelated application/rental change occurred. Foreign dirty screenshots and pre-existing audit runs were excluded from the commit.
