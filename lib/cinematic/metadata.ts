import type { Metadata } from "next";

import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";

const description =
  "Persönliche Beratung, Partybedarf und Vermietung bei Trinkgut Jammers in der Jurgensstraße 20 in Goch.";

export const SITE_METADATA: Metadata = {
  metadataBase: new URL("https://trinkgut-jammers.de"),
  title: {
    default: "Trinkgut Jammers Goch",
    template: "%s | Trinkgut Jammers",
  },
  description,
};

export const HOMEPAGE_METADATA: Metadata = {
  title: { absolute: "Goch schenkt ein. | Trinkgut Jammers" },
  description,
  alternates: {
    canonical: "/",
    languages: { de: "/", nl: "/nl" },
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "Trinkgut Jammers",
    url: "/",
    title: "Goch schenkt ein. | Trinkgut Jammers",
    description,
    images: [
      {
        url: "/images/home/cinematic/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "Trinkgut Jammers – Goch schenkt ein.",
      },
    ],
  },
};

export const LOCAL_BUSINESS_JSON_LD = Object.freeze({
  "@context": "https://schema.org",
  "@type": "LiquorStore",
  "@id": "https://trinkgut-jammers.de/#market",
  name: MARKET.displayName,
  legalName: MARKET.legalName,
  url: "https://trinkgut-jammers.de",
  telephone: "+49 2823 418707",
  email: MARKET.email,
  owner: { "@type": "Person", name: MARKET.owner },
  address: {
    "@type": "PostalAddress",
    streetAddress: MARKET.street,
    postalCode: MARKET.postalCode,
    addressLocality: MARKET.city,
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
  sameAs: [SITE_LINKS.instagram],
});

export function serializeJsonLd(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new TypeError("JSON-LD value is not serializable");
  }
  return serialized.replace(/</g, "\\u003c");
}
