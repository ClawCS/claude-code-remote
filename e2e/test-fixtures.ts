// Public pages never use a raw external catalog fallback. Flyer-specific tests
// use the gated /test-fixtures/weekly-flyer page with synthetic local DTO/assets.
export { expect, test } from "@playwright/test";
