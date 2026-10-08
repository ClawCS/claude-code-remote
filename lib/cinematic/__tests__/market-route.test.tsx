import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import KontaktPage from "@/app/kontakt/page";
import LocationFooter from "@/components/cinematic/LocationFooter";

describe("market directions", () => {
  test.each([
    ["contact page", KontaktPage],
    ["shared footer", LocationFooter],
  ])("%s sends visitors to Jammers on Jurgensstraße, not an address-only match", (_name, Component) => {
    const html = renderToStaticMarkup(<Component />);
    const mapLinks = [...html.matchAll(/href="([^"]*google\.com\/maps[^\"]*)"/g)];

    expect(mapLinks.length).toBeGreaterThan(0);
    for (const [, href] of mapLinks) {
      const url = new URL(href.replaceAll("&amp;", "&"));
      expect(url.pathname).toBe("/maps/dir/");
      expect(url.searchParams.get("api")).toBe("1");
      expect(url.searchParams.get("destination")).toBe(
        "Trinkgut Jammers, Jurgensstraße 20, 47574 Goch, Deutschland",
      );
      expect(url.searchParams.has("origin")).toBe(false);
    }
    expect(html).toContain("Jurgensstraße 20");
  });
});
