import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, test } from "vitest";

import { loadValidatedHandzettelCache } from "@/lib/handzettel-catalog";

describe("tracked Handzettel browser fixture", () => {
  test("loads as the exact validated KW29/2026 ten-page catalog", async () => {
    const originalWorkingDirectory = process.cwd();
    const fixturePath = resolve(
      originalWorkingDirectory,
      "e2e/fixtures/handzettel-cache.json",
    );
    const fixture: unknown = JSON.parse(readFileSync(fixturePath, "utf8"));
    const temporaryWorkingDirectory = mkdtempSync(
      join(tmpdir(), "cinematic-handzettel-e2e-"),
    );

    try {
      const dataDirectory = join(temporaryWorkingDirectory, "data");
      mkdirSync(dataDirectory);
      copyFileSync(fixturePath, join(dataDirectory, "handzettel-cache.json"));
      process.chdir(temporaryWorkingDirectory);

      const loaded = await loadValidatedHandzettelCache(
        new Date("2026-07-14T12:00:00.000Z"),
      );

      expect(loaded).toEqual(fixture);
      expect(loaded).toMatchObject({
        catalogId: "1335913",
        catalogVersion: "2",
        storeId: "13027",
        werbekreis: "3.6",
        kw: 29,
        year: 2026,
        validFrom: "2026-07-13",
        validTo: "2026-07-18",
        fetchedAt: "2026-07-14T10:00:00.000Z",
        pageCount: 10,
        status: "ok",
      });
      expect(loaded?.pages.map(({ number }) => number)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ]);
    } finally {
      process.chdir(originalWorkingDirectory);
      rmSync(temporaryWorkingDirectory, { recursive: true, force: true });
    }
  });
});
