import { describe, expect, test } from "vitest";

import {
  CINEMATIC_NAV,
  MARKET,
  SITE_LINKS,
  getMarketStatus,
} from "@/lib/cinematic/site";

describe("verified market contract", () => {
  test("uses the approved legal, address, contact, and opening-hour values", () => {
    expect(MARKET).toMatchObject({
      displayName: "Trinkgut Jammers",
      legalName: "Getränkesupermarkt Jammers e.K.",
      owner: "Nikolaos Jammers",
      street: "Jurgensstraße 20",
      postalCode: "47574",
      city: "Goch",
      phoneDisplay: "02823 418707",
      phoneHref: "tel:+492823418707",
      whatsappDisplay: "+49 175 2492386",
      email: "jammers-goch@trinkgut.de",
      openingHours: "Mo–Sa 08:00–20:00 Uhr",
    });
    expect(SITE_LINKS.whatsapp).toContain("491752492386");
  });

  test("exposes the six approved homepage navigation labels in order", () => {
    expect(CINEMATIC_NAV).toEqual([
      { label: "Angebote", href: "#aktuell" },
      { label: "Party & Miete", href: "#service" },
      { label: "Eigenmarken", href: "#eigenmarken" },
      { label: "Aktionen", href: "#aktionen" },
      { label: "Über uns", href: "#menschen" },
      { label: "Kontakt", href: "#kontakt" },
    ]);
  });

  test.each([
    ["2026-07-13T05:59:00.000Z", false, "Heute geschlossen"],
    ["2026-07-13T06:00:00.000Z", true, "Heute bis 20 Uhr"],
    ["2026-07-13T17:59:00.000Z", true, "Heute bis 20 Uhr"],
    ["2026-07-13T18:00:00.000Z", false, "Heute geschlossen"],
    ["2026-07-19T10:00:00.000Z", false, "Heute geschlossen"],
  ])("derives Berlin status at %s", (iso, isOpen, label) => {
    expect(getMarketStatus(new Date(iso))).toEqual({ isOpen, label });
  });
});
