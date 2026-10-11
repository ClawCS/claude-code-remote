import { describe, expect, it } from "vitest";
import { assertPublicationPolicy, expectedNlAgencyMedium } from "../flyer-source-policy";

describe("publication provider policy", () => {
  it.each([
    ["2026-10-12", "de-maas-driehoek"], ["2026-10-19", "udens-weekblad"],
    ["2026-12-28", "udens-weekblad"], ["2027-01-04", "udens-weekblad"],
    ["2027-01-11", "de-maas-driehoek"],
  ] as const)("uses ISO week parity at %s", (week, medium) => {
    expect(expectedNlAgencyMedium(week)).toBe(medium);
  });
  it.each(["2026-10-13", "2026-02-30", "KW42", "2026-10-12T00:00:00Z"])("rejects invalid week %s", week => {
    expect(() => expectedNlAgencyMedium(week)).toThrow();
  });
  it("retains historical Canva without granting it future weekly status", () => {
    const identity = { language: "nl", purpose: "weekly", medium: "legacy-canva" } as const;
    const source = { kind: "canva", flyerId: "historical" } as const;
    expect(() => assertPublicationPolicy(identity, source, "2026-10-05", "2026-10-10", "2026-10-05")).not.toThrow();
    expect(() => assertPublicationPolicy(identity, source, "2026-10-12", "2026-10-17", "2026-10-12")).toThrow();
  });
  it.each([
    ["2026-10-12", "2026-10-17", "de-maas-driehoek"],
    ["2026-10-19", "2026-10-24", "udens-weekblad"],
    ["2026-12-28", "2027-01-02", "udens-weekblad"],
  ] as const)("accepts the dated agency original %s", (week, to, medium) => {
    expect(() => assertPublicationPolicy({ language: "nl", purpose: "weekly", medium },
      { kind: "agency", originalId: "synthetic-original", medium }, week, to, week)).not.toThrow();
  });
  it.each([
    { language: "de", purpose: "weekly", medium: "de-maas-driehoek" },
    { language: "nl", purpose: "supplemental", medium: "de-maas-driehoek" },
    { language: "nl", purpose: "weekly", medium: "udens-weekblad" },
    { language: "nl", purpose: "weekly", medium: "maasduinen" },
  ] as const)("rejects mismatching identity %j", identity => {
    expect(() => assertPublicationPolicy(identity, { kind: "agency", originalId: "synthetic", medium: "de-maas-driehoek" },
      "2026-10-12", "2026-10-17", "2026-10-12")).toThrow();
  });
  it.each([["2026-10-19", "2026-10-24"], ["2025-10-12", "2025-10-17"], ["2026-10-12", "2026-10-18"]])(
    "rejects incorrect printed week/year/range %s", (from, to) => {
      expect(() => assertPublicationPolicy({ language: "nl", purpose: "weekly", medium: "de-maas-driehoek" },
        { kind: "agency", originalId: "synthetic", medium: "de-maas-driehoek" }, from, to, "2026-10-12")).toThrow();
    });
  it("keeps Maasduinen independent of Monday/Saturday weekly intervals", () => {
    expect(() => assertPublicationPolicy({ language: "nl", purpose: "supplemental", medium: "maasduinen" },
      { kind: "canva", flyerId: "synthetic" }, "2026-12-31", "2027-01-10")).not.toThrow();
  });
});
