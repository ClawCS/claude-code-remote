import type { IncomingMessage } from "node:http";
import { ImageOptimizerCache } from "next/dist/server/image-optimizer";
import { describe, expect, test } from "vitest";

import nextConfig from "../../next.config";

const browserAccept = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
const paths = [
  "/images/editorial/instagram/giveaway-2026-10.webp",
  "/images/editorial/instagram/giveaway-2026-disaronno.webp",
];

function negotiate(url: string, width: number, accept: string) {
  return ImageOptimizerCache.validateParams(
    { headers: { accept } } as IncomingMessage,
    { url, w: String(width), q: "75" },
    nextConfig as Parameters<typeof ImageOptimizerCache.validateParams>[2],
    false,
  );
}

describe("production image format negotiation", () => {
  test.each(paths)("serves %s as WebP even when the browser prefers AVIF", (url) => {
    for (const width of [640, 768, 1280, 2560]) {
      const modern = negotiate(url, width, browserAccept);
      const webp = negotiate(url, width, "image/webp,image/*;q=0.8");
      expect(modern).toMatchObject({ href: url, width, quality: 75, mimeType: "image/webp" });
      expect(modern).toEqual(webp);
    }
  });

  test("keeps source-format fallback when the browser does not advertise WebP", () => {
    expect(negotiate(paths[0], 640, "image/jpeg,image/png")).toMatchObject({
      href: paths[0], mimeType: "",
    });
  });

  test("still rejects unsupported optimizer sizes", () => {
    expect(negotiate(paths[0], 999, browserAccept)).toHaveProperty("errorMessage");
  });
});
