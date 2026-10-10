import { describe, expect, test } from "vitest";
import { ESLint } from "eslint";

describe("lint boundaries", () => {
  test("compiled application output is ignored while TypeScript sources still enforce import rules", async () => {
    const eslint = new ESLint();
    expect(await eslint.isPathIgnored(".build/applications/services/applications/src/server.js")).toBe(true);
    const source = "services/applications/src/server.ts";
    expect(await eslint.isPathIgnored(source)).toBe(false);
    const [result] = await eslint.lintText('const fs = require("node:fs"); export { fs };', { filePath: source });
    expect(result.messages.some(message => message.ruleId === "@typescript-eslint/no-require-imports" && message.severity === 2)).toBe(true);
  });
  test("private source research is not treated as application code", async () => {
    const eslint = new ESLint();
    for (const file of [
      "assets/source/cocktails/research.cjs",
      "assets/source/giveaways/research.cjs",
    ]) expect(await eslint.isPathIgnored(file), file).toBe(true);
  });

  test("the React hook override applies only where the React plugin exists", async () => {
    const eslint = new ESLint();
    const script = await eslint.calculateConfigForFile("scripts/example.cjs");
    expect(script.rules?.["react-hooks/set-state-in-effect"]).toBeUndefined();
    const component = await eslint.calculateConfigForFile("components/recipes/CocktailPhoto.tsx");
    expect(component.rules["react-hooks/set-state-in-effect"][0]).toBe(1);
  });
});
