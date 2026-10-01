import { afterEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DatenschutzPage from "@/app/datenschutz/page";

afterEach(() => vi.unstubAllEnvs());
it("starts the privacy document with its page heading even with enabled rental notices", () => {
  vi.stubEnv("RENTAL_MODE", "test");
  vi.stubEnv("RENTAL_DATA_DIR", "/tmp/jammers-privacy-test-fixture");
  vi.stubEnv("RENTAL_PUBLIC_ORIGIN", "http://127.0.0.1:3104");
  const html = renderToStaticMarkup(<DatenschutzPage />);
  expect(html).toContain("Zusätzlich: Mietbestellungen");
  expect(html.match(/<h[1-6]\b/)?.[0]).toBe("<h1");
});
