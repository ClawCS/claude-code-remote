# Rental-page copy removal — 30 September 2026

Removed the entire “Belegte Preise. Persönliche Bestätigung.” section and its four paragraphs at the operator's request. The page now proceeds from its introduction directly to the requested dates. No replacement explanation block was added.

The 20 items, per-card prices/stock labels, date selection and inquiry controls remain unchanged. Existing short nonbinding/personal-confirmation notices remain where they already appeared. Stock caps, shared-furniture exclusions, date validation and cart restoration were not changed. The inventory date no longer appears in the removed section, but source metadata remains intact.

Verification: the new removal assertion failed against the previous rendered page, then the full unit suite passed (48 files, 498 tests). TypeScript and the production build passed. Five targeted browser tests passed against the rebuilt preview, covering desktop/mobile layout, accessibility/runtime checks, overlapping stock, shared furniture and restored cart data. A manual HTTP 200 HTML check confirmed the removed text is absent while date controls, all 20 items and the inquiry section remain. Desktop/mobile first-view screenshots were visually checked. A read-only scope audit found no dependent anchors or styling consumers. `git diff --check` passed.

Local previews were restarted on ports 3000 and 3103. No public-domain deployment or external inquiry transmission was performed by this task.
