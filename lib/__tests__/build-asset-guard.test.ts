import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { weeklyPublicationFixture } from "./fixtures/weekly-publication";

const fixtures: string[] = [];
afterEach(() => { for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true }); });

async function prebuildFixture(failing?: "cinematic" | "market" | "missing-market" | "google-market" | "missing-google-market") {
  const {root} = await weeklyPublicationFixture();
  fixtures.push(root);
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "data/editorial/official-catalogs"), { recursive: true });
  const marker = join(root, "completed-checks.txt");
  for (const kind of ["cinematic", "market", "google-market"] as const) {
    if (kind === "market" && failing === "missing-market") continue;
    if (kind === "google-market" && failing === "missing-google-market") continue;
    writeFileSync(join(root, `scripts/build-${kind}-assets.mjs`), `import { appendFileSync } from "node:fs";\nconst args = process.argv.slice(2);\nappendFileSync(${JSON.stringify(marker)}, ${JSON.stringify(kind)} + ":" + args.join(",") + "\\n");\nif (JSON.stringify(args) !== '["--check"]') process.exit(7);\nprocess.exit(${failing === kind ? 1 : 0});\n`);
  }
  writeFileSync(join(root, "scripts/generate-handzettel-manifest.mjs"), `import { appendFileSync } from "node:fs"; appendFileSync(${JSON.stringify(marker)}, "manifest\\n");\n`);
  const result = await new Promise<{ code: number | null; text: string }>(resolveResult => {
    const child = spawn(process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "--tsconfig", resolve("tsconfig.json"), resolve("scripts/validate-content-build.ts")], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let text = "";
    child.stdout.on("data", chunk => { text += chunk.toString(); });
    child.stderr.on("data", chunk => { text += chunk.toString(); });
    child.once("close", code => resolveResult({ code, text }));
  });
  const events = (() => { try { return readFileSync(marker, "utf8").trim().split("\n"); } catch { return []; } })();
  return { ...result, events };
}

describe("prebuild asset publication guard", () => {
  it("checks all public pipelines before producing content artifacts", async () => {
    const result = await prebuildFixture();
    expect(result.code, result.text).toBe(0);
    expect(result.events).toEqual(["cinematic:--check", "market:--check", "google-market:--check", "manifest"]);
  });
  it("stops before content output if cinematic assets are invalid", async () => {
    const result = await prebuildFixture("cinematic");
    expect(result.code, result.text).toBe(1);
    expect(result.events).toEqual(["cinematic:--check"]);
  });
  it("stops before content output if market assets are invalid", async () => {
    const result = await prebuildFixture("market");
    expect(result.code, result.text).toBe(1);
    expect(result.events).toEqual(["cinematic:--check", "market:--check"]);
  });
  it("does not silently skip a missing market validator", async () => {
    const result = await prebuildFixture("missing-market");
    expect(result.code, result.text).toBe(1);
    expect(result.events).toEqual(["cinematic:--check"]);
  });
  it.each(["google-market", "missing-google-market"] as const)("stops before content output for %s", async failing => {
    const result = await prebuildFixture(failing);
    expect(result.code, result.text).toBe(1);
    expect(result.events).toEqual(failing === "google-market" ? ["cinematic:--check", "market:--check", "google-market:--check"] : ["cinematic:--check", "market:--check"]);
  });
});
