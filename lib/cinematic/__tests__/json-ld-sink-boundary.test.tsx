import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import ProductLayout from "@/app/produkte/[slug]/layout";
import JsonLdScript from "@/components/JsonLdScript";

function productionTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionTsxFiles(path);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("JSON-LD production sink boundary", () => {
  test("does not emit a retired Product payload and preserves the redirect child", async () => {
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

    expect(scripts).toHaveLength(0);
    expect(html).toContain(
      '<p data-review-child="preserved">Unverändertes Kind</p>',
    );
  });

  test("escapes markup at the production sink even for malicious product text", () => {
    const description = "<0,5% </script><script>alert(1)</script>";
    const html = renderToStaticMarkup(<JsonLdScript value={{description}} />);
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1);
    expect(scripts[0][1]).toContain("\\u003c0,5");
    expect(scripts[0][1]).not.toContain("<script>");
    expect(JSON.parse(scripts[0][1]).description).toBe(description);
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
