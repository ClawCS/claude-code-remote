import { describe, expect, test } from "vitest";

import { shouldHideLegacyChrome } from "@/lib/chrome-visibility";

describe("legacy chrome boundary", () => {
  test.each([
    ["/", true],
    ["/nl", true],
    ["/nl/angebote", true],
    ["/nlde", false],
    ["/angebote", false],
    ["/kontakt", false],
  ])("%s => %s", (pathname, expected) => {
    expect(shouldHideLegacyChrome(pathname)).toBe(expected);
  });
});
