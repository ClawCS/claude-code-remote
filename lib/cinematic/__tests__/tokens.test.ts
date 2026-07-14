import { describe, expect, test } from "vitest";

import {
  CINEMATIC_TOKENS,
  cinematicTokenStyle,
  createTokenStyle,
} from "@/lib/cinematic/tokens";

describe("cinematic token contract", () => {
  test("locks the approved six-color palette", () => {
    expect(CINEMATIC_TOKENS.color).toEqual({
      yellow: "#FEE005",
      red: "#E20F1D",
      blue: "#0086C8",
      gray: "#414045",
      black: "#000000",
      white: "#FFFFFF",
    });
  });

  test("is deeply frozen and emits stable full-path CSS variables", () => {
    expect(Object.isFrozen(CINEMATIC_TOKENS)).toBe(true);
    expect(Object.isFrozen(CINEMATIC_TOKENS.motion.runtime)).toBe(true);
    expect(Object.isFrozen(cinematicTokenStyle)).toBe(true);
    expect(cinematicTokenStyle).toMatchObject({
      "--cinematic-color-yellow": "#FEE005",
      "--cinematic-spacing-target": "2.75rem",
      "--cinematic-motion-runtime-scroll-scrub-seconds": 0.55,
    });
    expect(new Set(Object.keys(cinematicTokenStyle)).size).toBe(
      Object.keys(cinematicTokenStyle).length,
    );
  });

  test("rejects colliding full-path CSS variables before object conversion", () => {
    expect(() =>
      createTokenStyle({
        motion: {
          runtime: {
            scrollScrubSeconds: 0.55,
            "scroll-scrub-seconds": 0.8,
          },
        },
      }),
    ).toThrowError(
      'Duplicate cinematic CSS variable "--cinematic-motion-runtime-scroll-scrub-seconds"',
    );
  });
});
