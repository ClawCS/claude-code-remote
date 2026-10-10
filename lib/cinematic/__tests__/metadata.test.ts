import { describe, expect, test } from "vitest";

import { metadata as nlMetadata } from "@/app/nl/layout";
import { metadata as academyMetadata } from "@/app/akademie/page";
import { metadata as productsMetadata } from "@/app/produkte/layout";
import { metadata as offersMetadata } from "@/app/angebote/layout";
import { metadata as flyersMetadata } from "@/app/handzettel/layout";
import {
  HOMEPAGE_METADATA,
  LOCAL_BUSINESS_JSON_LD,
  SITE_METADATA,
  serializeJsonLd,
} from "@/lib/cinematic/metadata";

describe("homepage metadata", () => {
  test("canonicalizes catalogue filters and duplicate handzettel views to their own destinations", () => {
    expect(academyMetadata.alternates?.canonical).toBe("/akademie");
    expect(academyMetadata.description).toMatch(/Lektionen|Lernen/);
    expect(productsMetadata.alternates?.canonical).toBe("/produkte");
    expect(offersMetadata.alternates?.canonical).toBe("/angebote");
    expect(flyersMetadata.alternates?.canonical).toBe("/angebote");
    for (const metadata of [offersMetadata, flyersMetadata]) {
      expect(metadata.description).toMatch(/Originalhandzettel/);
      expect(metadata.title).toBe(String(metadata.title).trim());
    }
  });
  test("keeps root-only canonical, hreflang, and OG out of site metadata", () => {
    expect(SITE_METADATA.alternates?.canonical).toBeUndefined();
    expect(SITE_METADATA.openGraph).toBeUndefined();
    expect(HOMEPAGE_METADATA.title).toEqual({
      absolute: "Goch schenkt ein. | Trinkgut Jammers",
    });
    expect(HOMEPAGE_METADATA.alternates).toEqual({
      canonical: "/",
      languages: { de: "/", nl: "/nl" },
    });
    expect(HOMEPAGE_METADATA.openGraph).toMatchObject({
      url: "/",
      title: "Goch schenkt ein. | Trinkgut Jammers",
      images: [
        {
          url: "/images/home/cinematic/og-home.jpg",
          width: 1200,
          height: 630,
        },
      ],
    });
    expect(nlMetadata.alternates).toEqual({
      canonical: "/nl",
      languages: { de: "/", nl: "/nl" },
    });
    expect(nlMetadata.keywords).toBeUndefined();
    expect(JSON.stringify(nlMetadata)).not.toMatch(
      /25\s*%|7(?:[.,\s]?000)|3\s*km|gratis parkeren|wij spreken|goedko(?:op|per)|bespaar|Duitse prijzen/i,
    );
  });

  test("contains exactly the approved LocalBusiness facts", () => {
    expect(LOCAL_BUSINESS_JSON_LD).toEqual({
      "@context": "https://schema.org",
      "@type": "LiquorStore",
      "@id": "https://trinkgut-jammers.de/#market",
      name: "Trinkgut Jammers",
      legalName: "Getränkesupermarkt Jammers e.K.",
      url: "https://trinkgut-jammers.de",
      telephone: "+49 2823 418707",
      email: "jammers-goch@trinkgut.de",
      owner: { "@type": "Person", name: "Nikolaos Jammers" },
      address: {
        "@type": "PostalAddress",
        streetAddress: "Jurgensstraße 20",
        postalCode: "47574",
        addressLocality: "Goch",
        addressCountry: "DE",
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
          opens: "08:00",
          closes: "20:00",
        },
      ],
      sameAs: ["https://www.instagram.com/trinkgutjammers_goch/"],
    });
    expect(JSON.stringify(LOCAL_BUSINESS_JSON_LD)).not.toMatch(
      /7(?:[.,\s]?000)|liefer(?:ung|n)|inStock|priceRange|25\s*%/i,
    );
  });

  test("serializes JSON-LD without a script-breakout sequence", () => {
    const serialized = serializeJsonLd({
      probe: "</script><script>alert(1)</script>",
    });
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c/script>");
  });
});
