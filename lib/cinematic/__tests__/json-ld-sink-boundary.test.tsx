import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import ProductLayout from "@/app/produkte/[slug]/layout";

function productionTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionTsxFiles(path);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("JSON-LD production sink boundary", () => {
  test("serializes the real d-j-vu Product payload and preserves children", async () => {
    const element = await ProductLayout({
      params: Promise.resolve({ slug: "d-j-vu" }),
      children: <p data-review-child="preserved">Unverändertes Kind</p>,
    });
    const html = renderToStaticMarkup(element);
    const scripts = [
      ...html.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      ),
    ];

    expect(scripts).toHaveLength(1);
    expect(scripts[0][1]).toContain("\\u003c0,5");
    expect(scripts[0][1]).not.toContain("<0,5");
    expect(JSON.parse(scripts[0][1])).toMatchObject({
      "@type": "Product",
      name: "Déjà-Vu",
      description:
        "Déjà-Vu – Original oder Alkoholfrei 17% / <0,5% Vol. 0,7l Flasche",
    });
    expect(html).toContain(
      '<p data-review-child="preserved">Unverändertes Kind</p>',
    );
  });

  test("allows exactly one JSON-LD script sink in production TSX", () => {
    const root = resolve(process.cwd());
    const productionFiles = [
      ...productionTsxFiles(resolve(root, "app")),
      ...productionTsxFiles(resolve(root, "components")),
    ];
    const sinkFiles = productionFiles
      .filter((path) => readFileSync(path, "utf8").includes("application/ld+json"))
      .map((path) => relative(root, path))
      .sort();

    expect(sinkFiles).toEqual(["components/JsonLdScript.tsx"]);
    expect(
      readFileSync(resolve(root, "components/JsonLdScript.tsx"), "utf8"),
    ).toContain("serializeJsonLd(value)");
  });
});
