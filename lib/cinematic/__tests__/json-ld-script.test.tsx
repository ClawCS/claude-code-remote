import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import JsonLdScript from "@/components/JsonLdScript";

describe("JsonLdScript", () => {
  test("uses the safe serializer at the real script sink", () => {
    const sentinel = "</script><script>alert(1)</script>";
    const html = renderToStaticMarkup(
      <JsonLdScript value={{ probe: sentinel }} />,
    );

    expect(html.match(/<script\b/g)).toHaveLength(1);
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain("\\u003c/script>");
    expect(html).not.toContain(sentinel);
    expect(html.match(/<script\b/g)).not.toHaveLength(2);
  });
});
