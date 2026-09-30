import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { POST as communityPost } from "@/app/api/community/route";
import { POST as applicationPost } from "@/app/api/bewerbung/route";
import ProductLayout, { generateMetadata } from "@/app/produkte/[slug]/layout";
import products from "@/data/products.json";

vi.mock("@/lib/community-db", () => ({loadDB: async () => ({users: {}, monthlyWinners: []}), saveDB: async () => {}, checkMonthlyReset: async () => {}, getLeaderboard: () => [], getLevel: () => "Bronze", generateId: () => "not-used"}));

describe("unsafe legacy publication paths are closed", () => {
  it.each(["chat", "kuehlschrank", "leergut-scan"])("does not transmit to %s AI providers before a reviewed data process", async (route) => {
    vi.stubEnv("GEMINI_API_KEY", "test-not-a-real-key");
    vi.resetModules();
    try {
      const endpoint = route === "chat" ? await import("@/app/api/chat/route") : route === "kuehlschrank" ? await import("@/app/api/kuehlschrank/route") : await import("@/app/api/leergut-scan/route");
      const request = new NextRequest(`http://localhost/api/${route}`, {method:"POST", body: route === "chat" ? JSON.stringify({messages: []}) : new FormData()});
      expect((await endpoint.POST(request)).status).toBe(503);
    } finally {vi.unstubAllEnvs();}
  });
  it("does not accept unauthenticated point changes", async () => {
    const response = await communityPost(new NextRequest("http://localhost/api/community", {method: "POST", body: JSON.stringify({action: "add_points", userId: "unknown", pointAction: "quiz_complete"})}));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("does not collect applicant uploads without an approved storage process", async () => {
    const response = await applicationPost(new NextRequest("http://localhost/api/bewerbung", {method: "POST", body: new FormData()}));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("does not publish unverified catalog prices or stock in product structured data", async () => {
    const tree = await ProductLayout({children: null, params: Promise.resolve({slug: products[0].slug})});
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('"@type":"Product"');
    expect(html).not.toContain('"offers"');
    expect(html).not.toContain("schema.org/InStock");
  });
  it("does not recycle historical action clauses into product metadata", async () => {
    for (const product of products.filter(p => /€|gratis|zugabe|im angebot|trinkgut app/i.test(p.unit))) {
      const params = Promise.resolve({slug: product.slug});
      const metadata = await generateMetadata({params});
      const markup = renderToStaticMarkup(await ProductLayout({children:null, params}));
      expect(`${metadata.description} ${markup}`).not.toMatch(/€|gratis|zugabe|im angebot|trinkgut app/i);
    }
  });
});
