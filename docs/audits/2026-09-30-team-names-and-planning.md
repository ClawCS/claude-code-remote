# Team names and planning links — 30 September 2026

## Scope and outcome

- All eleven employee portraits now display names only on `/`, `/galerie` and `/nl`. No role or “Team Jammers” sentence is displayed beneath the portraits.
- The hero photo is captioned “Sven & Niko”. The group photo remains present and retains descriptive alternative text, without a generic visible caption.
- Hanna, Hannah and Henri remain included. No employees or photos were added or removed by this change.
- The reported broken homepage planning link was not reproducible. No production navigation change was made: the existing links already point to `/partyplaner`.

## Diagnosis

The hero, current-actions fallback, party service and footer planning links all reached the party planner in desktop and mobile checks. The planner's “Berechnen” action produced the shopping list. The hero link also worked without JavaScript. The separate “Route planen” link is a maps link, not a party-planning link.

The new browser regression tests cover the three fixed entry points (hero, service and footer) at 1440px and 390px. The conditional current-actions fallback was checked during diagnosis but is not covered by these new regression tests. No claim is made about the cause of the visitor's earlier failure.

## Verification

- Red/green: the new name-only assertions failed against the previous captions, then passed after the caption correction. Planning-link tests already passed before the correction.
- Unit tests: 48 files, 497 tests passed.
- TypeScript: `npx tsc --noEmit` passed.
- Lint: no errors; 20 existing warnings remain.
- Production build: passed, including asset/source checks and 230 generated pages.
- Full default browser suite: 92 tests passed. This suite uses its test clock and is not proof of current live editorial dates.
- Current production preview, without the default test-clock override: 28 public-page and caption/planning tests passed; the four new tests also passed independently.
- Current September giveaway-cover checks: three tests passed after refreshing screenshots that the default suite had regenerated with its fixture.
- Manual HTML checks on localhost:3000 confirmed updated captions and HTTP 200 for the homepage and party planner.
- Independent code review found no blocking issue. The conditional fallback regression-test gap is documented above.
- `git diff --check` passed.

The production preview at `http://127.0.0.1:3103/` was rebuilt, restarted and reloaded in the browser. This is a local preview, not confirmation of deployment to a public domain.

## Visual proof

`audit/screenshots/team-names-2026-09-30/galerie-names-only-1440x900.png` shows the updated gallery with plain name captions. Existing public-page screenshots were refreshed by the verification runs.

Rental-cart presentation, the additional weekly NL flyer and its automation were not changed in this caption/navigation task.
