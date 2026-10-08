import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Layout from "@/app/produkte/[slug]/layout";
import { assortmentProducts } from "@/lib/catalog";

describe("server product layout", () => {
  it.each(["unknown-product", "", "__proto__"])("rejects nonexistent slug %s before rendering product children", async (slug) => {
    await expect(Layout({ params: Promise.resolve({ slug }), children: <p>Product content</p> }))
      .rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("preserves the redirect child without publishing a retired Product entity", async () => {
    const product = assortmentProducts[0];
    const html = renderToStaticMarkup(await Layout({ params: Promise.resolve({ slug: product.slug }), children: <p>Product content</p> }));
    expect(html).toContain("Product content");
    expect(html).not.toContain('"@type":"Product"');
    expect(html).not.toContain("brand-logo.webp");
  });
});
