import { describe, expect, it } from "vitest";
import { buildContentLastModified } from "@/lib/content-last-modified";

describe("meaningful sitemap modification dates", () => {
  it("uses actual source changes, not build time, and leaves unknown dates absent", () => {
    const lookup = buildContentLastModified({ "/angebote": "2026-10-12" }, [
      { id: "academy:wein:2", reviewedAt: "2026-10-12" },
      { id: "recipe:negroni", reviewedAt: "2026-10-11" },
    ], [{ slug: "verkauf-vollzeit", publishedAt: "2026-10-12" }]);
    expect(lookup("/angebote")).toBe("2026-10-12");
    expect(lookup("/akademie/wein/lektion/2")).toBe("2026-10-12");
    expect(lookup("/akademie")).toBe("2026-10-12");
    expect(lookup("/cocktails/negroni")).toBe("2026-10-11");
    expect(lookup("/karriere/verkauf-vollzeit")).toBe("2026-10-12");
    expect(lookup("/impressum")).toBeUndefined();
  });
  it("keeps the most recent real update when reviewed content predates another content edit", () => {
    const lookup = buildContentLastModified({ "/cocktails/negroni": "2026-10-12" }, [{ id: "recipe:negroni", reviewedAt: "2026-10-11" }], []);
    expect(lookup("/cocktails/negroni")).toBe("2026-10-12");
  });
});
