import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-dev/**",
    ".market-pipeline-test-*/**",
    ".superpowers/**",
    "out/**",
    "build/**",
    ".build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "audit/lighthouse/**",
    // Private editorial evidence and one-off research helpers are not app code.
    "assets/source/cocktails/**",
    "assets/source/giveaways/**",
  ]),
  // React 19 react-hooks/set-state-in-effect: too strict for our patterns
  // (legitimate state-syncs from MediaQueries, scroll listeners, etc.).
  // We treat as warning instead of error.
  {
    // Match the file scope in which eslint-config-next registers react-hooks.
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
