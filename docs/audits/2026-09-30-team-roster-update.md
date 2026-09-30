# Employee-profile update — 30 September 2026

This update follows the operator's confirmation that Nils, Nico and Tim no longer work at the market. Their individual employee records, imports and active gallery/story entries were removed. It supersedes the eleven-portrait roster described in the earlier audit on this date.

The eight remaining portraits are Niko, Sven, Jasmin, Gabriella, Jan Niklas, Hanna, Henri and Hannah. Captions remain names only. Niko was not confused with Nico. The hero photo and group photo remain unchanged; the operator explicitly answered “Gruppenfoto behalten”. No claim is made about individual participants in the group photo.

The shared data change applies to `/`, `/galerie` and `/nl`. A read-only audit found no additional active named employee representations or legacy team routes. Source files, Canva originals, provenance records and archived image exports were preserved; removal of profiles is not deletion of the source assets or their public file URLs.

## Verification

- Red: six assertions in three focused unit-test files failed against the old eleven-portrait roster for the expected reason.
- Green: 48 unit-test files, 497 tests passed; TypeScript passed.
- Production build passed, including asset/source checks and 230 generated pages.
- Lint passed with zero errors and 20 existing warnings.
- Nine targeted browser tests passed against the rebuilt production preview: desktop/mobile names and absence of departed profiles on all three pages, natural photo layout, accessibility/runtime checks on homepage and gallery, and the existing party-planning links.
- Manual HTML requests to localhost:3000 returned HTTP 200 for all three affected routes, retained all eight names and the group photo, and contained none of the three departed profiles or their individual image references.
- Refreshed desktop/mobile gallery screenshots were visually inspected. An independent read-only code review found no issues.
- `git diff --check` passed.

Local production previews remain available on ports 3000 and 3103. This verification does not establish deployment to an external production domain. The rental-cart and NL-flyer workflows were not changed by this task.
