import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("ESLint excludes both production and the isolated development build output", () => {
  const config = readFileSync(new URL("../../eslint.config.mjs", import.meta.url), "utf8");
  expect(config).toContain('".next/**"');
  expect(config).toContain('".next-dev/**"');
  expect(config).toContain('".market-pipeline-test-*/**"');
});
