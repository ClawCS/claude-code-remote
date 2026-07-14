import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { resolveHomepageNow } from "@/lib/cinematic/server-clock";

const originalDate = globalThis.Date;
const originalDateNow = Date.now;
const guardedInstant = "2026-07-14T12:00:00.000Z";

afterEach(() => {
  expect(globalThis.Date).toBe(originalDate);
  expect(Date.now).toBe(originalDateNow);
});

describe("cinematic homepage server clock", () => {
  test("uses the injected real clock when no override is supplied", () => {
    const realDate = new Date("2026-07-14T08:30:00.000Z");
    const realNow = vi.fn(() => realDate);

    expect(resolveHomepageNow({ env: {}, realNow })).toBe(realDate);
    expect(realNow).toHaveBeenCalledTimes(1);
  });

  test("fails closed when a fixed value lacks the exact E2E guard", () => {
    const realNow = vi.fn(() => new Date());

    expect(() =>
      resolveHomepageNow({
        env: { CINEMATIC_TEST_NOW: guardedInstant },
        realNow,
      }),
    ).toThrow("CINEMATIC_TEST_NOW requires CINEMATIC_E2E=1");
    expect(() =>
      resolveHomepageNow({
        env: { CINEMATIC_E2E: "0", CINEMATIC_TEST_NOW: guardedInstant },
        realNow,
      }),
    ).toThrow("CINEMATIC_TEST_NOW requires CINEMATIC_E2E=1");
    expect(realNow).not.toHaveBeenCalled();
  });

  test.each([
    "not-an-instant",
    ` ${guardedInstant}`,
    `${guardedInstant} `,
    "2026-07-14T12:00:00Z",
    "2026-07-14T12:00:00.00Z",
    "2026-07-14T99:00:00.000Z",
  ])("rejects malformed or non-canonical overrides: %s", (fixed) => {
    const realNow = vi.fn(() => new Date());

    expect(() =>
      resolveHomepageNow({
        env: { CINEMATIC_E2E: "1", CINEMATIC_TEST_NOW: fixed },
        realNow,
      }),
    ).toThrow("invalid CINEMATIC_TEST_NOW");
    expect(realNow).not.toHaveBeenCalled();
  });

  test("resolves the exact guarded instant without touching global Date", () => {
    const realNow = vi.fn(() => new Date());

    const resolved = resolveHomepageNow({
      env: {
        CINEMATIC_E2E: "1",
        CINEMATIC_TEST_NOW: guardedInstant,
      },
      realNow,
    });

    expect(resolved.toISOString()).toBe(guardedInstant);
    expect(realNow).not.toHaveBeenCalled();
    expect(globalThis.Date).toBe(originalDate);
    expect(Date.now).toBe(originalDateNow);
  });
});
