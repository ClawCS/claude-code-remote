import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://trinkgut-jammers.de";

  const routes = [
    "/",
    "/produkte",
    "/angebote",
    "/akademie",
    "/cocktails",
    "/galerie",
    "/gewinnspiel",
    "/tippkick",
    "/vermietung",
    "/partyplaner",
    "/finder",
    "/handzettel",
    "/follower-rabatt",
    "/bewerbung",
    "/eigenmarke",
    "/bestellungen",
    "/impressum",
    "/datenschutz",
    "/akademie/zertifikate",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
