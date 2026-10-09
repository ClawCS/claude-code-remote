import { expect, it } from "vitest";
import { createReconstructionScope } from "../src/reconstruction-scope";
import { makeArtifactHarness } from "./fixtures/artifacts";
import { withPrivateFiles, takePrivateSnapshot } from "../src/custody";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { applicationId } from "../src/types";
import { randomUUID } from "node:crypto";

it("reuses only active same-case source authority and retains sources until the outer callback exits", async () => {
  const harness = await makeArtifactHarness();
  try {
    const snapshot = await takePrivateSnapshot(harness.repo.getCommittedIntake(harness.accepted.id)!, harness.keys);
    const scope = createReconstructionScope(harness.keys.custody);
    await withPrivateFiles(snapshot,harness.keys,async processing => {
      await scope.withScope(processing.id,async directory => {
        await writeFile(join(directory,"document-1.png"),"output",{ mode:0o600 });
        await expect(scope.withScope(applicationId(randomUUID()),async()=>{})).rejects.toThrow("BUSY");
      });
      expect(await readdir(harness.keys.runtimeRoot)).toHaveLength(1);
      await scope.withScope(processing.id,async directory => expect(await readFile(join(directory,"document-1.png"),"utf8")).toBe("output"));
    });
    expect(await readdir(harness.keys.runtimeRoot)).toEqual([]);
  } finally { await harness.close(); }
});
