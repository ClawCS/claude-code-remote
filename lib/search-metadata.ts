import type { Metadata } from "next";

export const SEARCH_ORIGIN = "https://trinkgut-jammers.de";
const siteName = "Trinkgut Jammers";
const defaultImage = {
  url: `${SEARCH_ORIGIN}/images/home/cinematic/og-home.jpg`,
  width: 1200,
  height: 630,
  alt: "Trinkgut Jammers – Goch schenkt ein.",
};

/** Complete route metadata, so nested pages never inherit a parent's canonical or social title. */
export function buildPageMetadata({ title, description, path, image, locale = "de_DE" }: {
  title: string;
  description: string;
  path: string;
  image?: string;
  locale?: string;
}): Metadata {
  if (!path.startsWith("/") || path.startsWith("//") || new URL(path, SEARCH_ORIGIN).href !== `${SEARCH_ORIGIN}${path}` || /[?#]/.test(path)) {
    throw new TypeError("Expected an own-page canonical path without query or fragment");
  }
  const pageTitle = title.endsWith(` | ${siteName}`) ? title : `${title.trim()} | ${siteName}`;
  const url = `${SEARCH_ORIGIN}${path}`;
  return {
    title: { absolute: pageTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale,
      siteName,
      title: pageTitle,
      description,
      url,
      images: [image ? { url: new URL(image, SEARCH_ORIGIN).href } : defaultImage],
    },
  };
}
