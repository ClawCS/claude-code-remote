import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

vi.mock("@/lib/weekly-offer-content", () => ({
  getWeeklyOfferContent: async () => ({ status: "degraded", issues: [], generatedAt: "2026-10-10T10:00:00Z", flyers: [], offers: [] }),
}));
vi.mock("next/navigation", () => ({
  // A query hook can suspend during the server pass. The catalogue must
  // receive the resolved page query, not replace its whole shell with fallback.
  useSearchParams: () => { throw new Promise(() => {}); },
}));
import ProduktePage from "@/app/produkte/page";

describe("server-readable catalogue shell", () => {
  it.each([["Krombacher", "Krombacher"], [["Krombacher", "Volvic"], "Krombacher"], [undefined, ""]])(
    "renders hero, categories, results shell and first search value for %j", async (search, expected) => {
      const page = await Reflect.apply(ProduktePage, null, [{ searchParams: Promise.resolve({ search }) }]);
      const html = renderToStaticMarkup(page);
      expect(html).toContain("Sortiment &amp; Wochenangebote");
      expect(html).toContain('aria-label="Warengruppen"');
      expect(html).toContain('aria-label="Aktuelle Einzelangebote"');
      expect(html).toContain(`value="${expected}"`);
      expect(html).not.toContain("Wochenangebote werden geladen");
    },
  );
});
