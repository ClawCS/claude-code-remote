import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://trinkgut-jammers.de";

  // Statische Routes mit individueller Priorität
  const routes: { path: string; priority: number; changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" }[] = [
    { path: "/", priority: 1.0, changeFrequency: "daily" },
    { path: "/produkte", priority: 0.9, changeFrequency: "daily" },
    { path: "/angebote", priority: 0.9, changeFrequency: "daily" },
    { path: "/handzettel", priority: 0.9, changeFrequency: "weekly" },
    { path: "/eigenmarke", priority: 0.9, changeFrequency: "monthly" },
    { path: "/akademie", priority: 0.8, changeFrequency: "weekly" },
    { path: "/akademie/zertifikate", priority: 0.7, changeFrequency: "monthly" },
    { path: "/cocktails", priority: 0.8, changeFrequency: "weekly" },
    { path: "/finder", priority: 0.8, changeFrequency: "weekly" },
    { path: "/partyplaner", priority: 0.8, changeFrequency: "weekly" },
    { path: "/vermietung", priority: 0.8, changeFrequency: "monthly" },
    { path: "/galerie", priority: 0.7, changeFrequency: "monthly" },
    { path: "/community", priority: 0.7, changeFrequency: "weekly" },
    { path: "/gewinnspiel", priority: 0.7, changeFrequency: "monthly" },
    { path: "/gewinnspiel/archiv", priority: 0.5, changeFrequency: "monthly" },
    { path: "/follower-rabatt", priority: 0.7, changeFrequency: "monthly" },
    { path: "/leergut", priority: 0.7, changeFrequency: "monthly" },
    { path: "/kuehlschrank", priority: 0.7, changeFrequency: "monthly" },
    { path: "/bierkarte", priority: 0.7, changeFrequency: "monthly" },
    { path: "/oeko-tracker", priority: 0.6, changeFrequency: "weekly" },
    { path: "/partyspiele", priority: 0.7, changeFrequency: "monthly" },
    { path: "/battle", priority: 0.6, changeFrequency: "monthly" },
    { path: "/gluecksrad", priority: 0.6, changeFrequency: "monthly" },
    { path: "/tippkick", priority: 0.6, changeFrequency: "weekly" },
    { path: "/nl", priority: 0.7, changeFrequency: "weekly" },
    { path: "/kontakt", priority: 0.7, changeFrequency: "yearly" },
    { path: "/bewerbung", priority: 0.6, changeFrequency: "monthly" },
    { path: "/impressum", priority: 0.3, changeFrequency: "yearly" },
    { path: "/datenschutz", priority: 0.3, changeFrequency: "yearly" },
    { path: "/agb", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
