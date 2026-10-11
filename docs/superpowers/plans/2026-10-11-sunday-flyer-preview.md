# Sunday 16:00 flyer preview

## Approved requirement

Niko requests immediate KW42 visibility and, from now on, publication of the following week's DE/NL flyers every Sunday at 16:00 Europe/Berlin. Original printed dates, verified files and source identities stay unchanged. The flyer is a clearly labelled preview; individual offer cards remain restricted to their actual validity. Maasduinen retains its separate printed period. Existing weekly automation changes to 16:00; daily automation stays paused.

## Tasks

1. Add failing boundary, selection, homepage and rendered-preview tests. Implement Berlin-time preview selection without changing the public DTO schema or active offer selection. Keep corrupt/missing language isolation, no duplicate scheduled rows.
2. Add failing CLI and public-audit cases. Verify the preview week's full files/census even before price validity, but require zero premature assortment cards.
3. Run complete website tests (native applications excluded), lint, types, offers check and production build. Review the complete diff independently and check desktop/mobile locally.
4. Update the existing automation and operational documentation; preserve statuses and unrelated settings. Commit/push only task files. Build a fresh exact-commit Linux release, preserve security hashes and rollback target, then verify real HTTPS routes/APIs/files and preview labels.

## Review focus

Sunday 15:59:59/16:00 in summer, winter and DST transition; next Monday only; false preview metadata cannot activate offers; expired and supplemental streams; missing or invalid NL cannot hide valid DE; API/HTML agreement and no raw private provenance; public checkers independently distinguish visible flyers from valid offer cards. No source reimport, date edits, server security changes, upload/mail/rental/payment/deletion activation or unapproved release cleanup.
